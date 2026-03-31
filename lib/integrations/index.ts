export type IntegrationType =
  | 'salesforce'
  | 'hubspot'
  | 'gmail'
  | 'google-calendar'
  | 'gong'
  | 'fireflies'
  | 'slack';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface IntegrationCredentials {
  [key: string]: string | number | boolean | undefined;
}

export interface IntegrationSettings {
  [key: string]: string | number | boolean | undefined;
}

export interface IntegrationConfig {
  id: string;
  orgId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  credentials: IntegrationCredentials;
  settings: IntegrationSettings;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthFlow {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface IntegrationMetadata {
  name: string;
  description: string;
  icon: string;
  category: 'crm' | 'communication' | 'calendar' | 'recording' | 'collaboration';
  oauthEnabled: boolean;
  webhookEnabled: boolean;
  syncInterval?: number; // minutes
}

export const INTEGRATION_METADATA: Record<IntegrationType, IntegrationMetadata> = {
  salesforce: {
    name: 'Salesforce',
    description: 'CRM integration for contact and opportunity sync',
    icon: 'Cloud',
    category: 'crm',
    oauthEnabled: true,
    webhookEnabled: true,
    syncInterval: 60,
  },
  hubspot: {
    name: 'HubSpot',
    description: 'CRM and marketing automation platform',
    icon: 'Hexagon',
    category: 'crm',
    oauthEnabled: true,
    webhookEnabled: true,
    syncInterval: 60,
  },
  gmail: {
    name: 'Gmail',
    description: 'Email integration for message tracking',
    icon: 'Mail',
    category: 'communication',
    oauthEnabled: true,
    webhookEnabled: false,
  },
  'google-calendar': {
    name: 'Google Calendar',
    description: 'Calendar sync and meeting scheduling',
    icon: 'Calendar',
    category: 'calendar',
    oauthEnabled: true,
    webhookEnabled: false,
  },
  gong: {
    name: 'Gong',
    description: 'Revenue intelligence and call recording',
    icon: 'Mic',
    category: 'recording',
    oauthEnabled: false,
    webhookEnabled: true,
  },
  fireflies: {
    name: 'Fireflies.ai',
    description: 'Meeting recording and transcription',
    icon: 'Flame',
    category: 'recording',
    oauthEnabled: false,
    webhookEnabled: true,
  },
  slack: {
    name: 'Slack',
    description: 'Team messaging and notifications',
    icon: 'Hash',
    category: 'collaboration',
    oauthEnabled: true,
    webhookEnabled: true,
  },
};

// Salesforce mapping helpers
export function mapSalesforceContactToAdvisor(contact: any) {
  return {
    name: `${contact.FirstName || ''} ${contact.LastName || ''}`.trim(),
    title: contact.Title || 'Contact',
    company: contact.Account?.Name || 'Unknown',
    email: contact.Email,
    phone: contact.Phone,
    location: contact.MailingCity
      ? `${contact.MailingCity}, ${contact.MailingState}`
      : undefined,
  };
}

export function mapSalesforceOpportunityToDeal(opportunity: any) {
  return {
    name: opportunity.Name,
    mrr: opportunity.Amount ? opportunity.Amount / 12 : 0,
    stage: normalizeSalesforceStage(opportunity.StageName),
    probability: opportunity.Probability || 0,
    closeDate: opportunity.CloseDate,
  };
}

function normalizeSalesforceStage(stage: string): string {
  const mapping: Record<string, string> = {
    'Prospecting': 'Discovery',
    'Qualification': 'Qualifying',
    'Needs Analysis': 'Proposal',
    'Value Proposition': 'Proposal',
    'Id. Decision Makers': 'Qualifying',
    'Perception Analysis': 'Proposal',
    'Proposal/Price Quote': 'Proposal',
    'Negotiation/Review': 'Negotiating',
    'Closed Won': 'Closed Won',
    'Closed Lost': 'Stalled',
  };
  return mapping[stage] || stage;
}

// HubSpot mapping helpers
export function mapHubspotContactToAdvisor(contact: any) {
  const props = contact.properties || {};
  return {
    name: `${props.firstname?.value || ''} ${props.lastname?.value || ''}`.trim(),
    title: props.jobtitle?.value || 'Contact',
    company: props.company?.value || 'Unknown',
    email: props.email?.value,
    phone: props.phone?.value,
    location: props.city?.value
      ? `${props.city.value}, ${props.state?.value || ''}`
      : undefined,
  };
}

export function mapHubspotDealToDeal(deal: any) {
  const props = deal.properties || {};
  return {
    name: props.dealname?.value,
    mrr: props.amount?.value ? props.amount.value / 12 : 0,
    stage: normalizeHubspotStage(props.dealstage?.value),
    probability: props.probability?.value || 0,
    closeDate: props.closedate?.value,
  };
}

function normalizeHubspotStage(stage: string): string {
  const mapping: Record<string, string> = {
    'negotiation': 'Negotiating',
    'presentationscheduled': 'Proposal',
    'qualifiedtobuy': 'Qualifying',
    'appointmentscheduled': 'Qualifying',
    'decisionmakerboughtin': 'Proposal',
    'contractsent': 'Proposal',
    'closedwon': 'Closed Won',
    'closedlost': 'Stalled',
  };
  return mapping[stage?.toLowerCase()] || stage || 'Discovery';
}

// Test connection function
export async function testIntegration(
  type: IntegrationType,
  config: IntegrationConfig
): Promise<boolean> {
  try {
    switch (type) {
      case 'salesforce':
        return await testSalesforceConnection(config.credentials);
      case 'hubspot':
        return await testHubspotConnection(config.credentials);
      case 'slack':
        return await testSlackConnection(config.credentials);
      case 'gong':
        return await testGongConnection(config.credentials);
      case 'fireflies':
        return await testFirefliesConnection(config.credentials);
      default:
        return false;
    }
  } catch (error) {
    console.error(`Test connection failed for ${type}:`, error);
    return false;
  }
}

async function testSalesforceConnection(credentials: IntegrationCredentials): Promise<boolean> {
  if (!credentials.accessToken) return false;
  try {
    const response = await fetch(
      `${credentials.instanceUrl}/services/oauth2/userinfo`,
      {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function testHubspotConnection(credentials: IntegrationCredentials): Promise<boolean> {
  if (!credentials.accessToken) return false;
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function testSlackConnection(credentials: IntegrationCredentials): Promise<boolean> {
  if (!credentials.webhookUrl) return false;
  try {
    const response = await fetch(credentials.webhookUrl as string, {
      method: 'POST',
      body: JSON.stringify({ text: 'Channel Companion test message' }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function testGongConnection(credentials: IntegrationCredentials): Promise<boolean> {
  if (!credentials.apiKey) return false;
  try {
    const response = await fetch('https://api.gong.io/v2/users', {
      headers: { Authorization: `Bearer ${credentials.apiKey}` },
    });
    return response.ok || response.status === 401;
  } catch {
    return false;
  }
}

async function testFirefliesConnection(credentials: IntegrationCredentials): Promise<boolean> {
  if (!credentials.apiKey) return false;
  try {
    const response = await fetch('https://api.fireflies.ai/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: '{ user { id } }' }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
