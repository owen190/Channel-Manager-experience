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
  { name: 'Salesforce', status: 'connected' as const, icon: 'âï¸' },
  { name: 'Gong', status: 'connected' as const, icon: 'ðï¸' },
  { name: 'Fireflies', status: 'connected' as const, icon: 'ð¥' },
  { name: 'Microsoft Teams', status: 'connected' as const, icon: 'ð¬' },
  { name: 'Slack', status: 'available' as const, icon: 'ð±' },
  { name: 'HubSpot', status: 'available' as const, icon: 'ð¶' },
];

export const NAV_ITEMS_MANAGER = [
  { id: 'command-center', label: 'Command Center', icon: 'â¡' },
  { id: 'intelligence', label: 'Intelligence Hub', icon: 'ð§ ' },
  { id: 'relationships', label: 'Relationships', icon: 'ð¤' },
  { id: 'pipeline', label: 'Pipeline', icon: 'ð°' },
  { id: 'strategic', label: 'Strategic', icon: 'ð' },
];

export const NAV_ITEMS_LEADER = [
  { id: 'command-center', label: 'Command Center', icon: 'â¡' },
  { id: 'forecast', label: 'Forecast', icon: 'ð' },
  { id: 'team', label: 'Team', icon: 'ð¥' },
  { id: 'relationships', label: 'Relationships', icon: 'ð¤' },
  { id: 'pipeline', label: 'Pipeline', icon: 'ð°' },
  { id: 'intelligence', label: 'Intelligence', icon: 'ð§ ' },
];
