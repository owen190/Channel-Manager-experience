import { StageWeight } from './types';

export const STAGE_WEIGHTS: StageWeight[] = [
  { stage: 'Negotiating', weight: 0.90 },
  { stage: 'Proposal', weight: 0.75 },
  { stage: 'Qualifying', weight: 0.10 },
  { stage: 'Discovery', weight: 0.05 },
  { stage: 'Stalled', weight: 0.00 },
  { stage: 'Closed Won', weight: 1.00 },
];

export const PARTNER_CAPACITY = 30;

export const QUARTER_END = '2026-03-31';
export const DAYS_REMAINING = 5;

export const INTEGRATIONS = [
  { name: 'Salesforce', status: 'connected' as const, icon: 'Cloud' },
  { name: 'Gong', status: 'connected' as const, icon: 'Mic' },
  { name: 'Fireflies', status: 'connected' as const, icon: 'Flame' },
  { name: 'Microsoft Teams', status: 'connected' as const, icon: 'MessageSquare' },
  { name: 'Slack', status: 'available' as const, icon: 'Hash' },
  { name: 'HubSpot', status: 'available' as const, icon: 'Hexagon' },
];

export const NAV_ITEMS_MANAGER = [
  { id: 'command-center', label: 'Command Center', icon: 'Zap' },
  { id: 'intelligence-hub', label: 'Intelligence Hub', icon: 'Brain' },
  { id: 'relationships', label: 'Relationships', icon: 'Handshake' },
  { id: 'pipeline', label: 'Pipeline', icon: 'DollarSign' },
  { id: 'strategic', label: 'Strategic', icon: 'TrendingUp' },
  { id: 'co-marketing', label: 'Co-Marketing', icon: 'Megaphone' },
];

export const NAV_ITEMS_LEADER = [
  { id: 'command-center', label: 'Command Center', icon: 'Zap' },
  { id: 'forecast', label: 'Forecast', icon: 'BarChart3' },
  { id: 'team', label: 'Team', icon: 'Users' },
  { id: 'relationships', label: 'Relationships', icon: 'Handshake' },
  { id: 'pipeline', label: 'Pipeline', icon: 'DollarSign' },
  { id: 'intelligence', label: 'Intelligence', icon: 'Brain' },
  { id: 'supplier-accountability', label: 'Supplier Accountability', icon: 'Shield' },
];

export const SERVICE_CATALOG = [
  'UCaaS',
  'CCaaS',
  'SD-WAN',
  'SASE/SSE',
  'Managed Security',
  'Cloud Infrastructure',
  'Collaboration',
  'Network as a Service',
  'Managed Detection & Response',
  'Business Continuity',
];
