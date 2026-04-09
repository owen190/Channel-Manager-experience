'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, DollarSign, Brain, Activity,
  TrendingDown, TrendingUp, Zap, Users, ChevronDown, ChevronUp, X,
  ArrowLeft, MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays,
  Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, RefreshCw,
  Megaphone, Star, TrendingUp as TrendingUpIcon, CheckCircle, AlertCircle as AlertCircleIcon, Edit, Plus,
  LayoutGrid, Map, FileText, Mail, Building2, ArrowUpRight, BarChart3, UserPlus, Calendar, Shield, PlayCircle, ChevronRight, Search,
  Send, Loader2, Bell, ExternalLink,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { USAMap } from '@/components/shared/USAMap';
import { KPICard } from '@/components/shared/KPICard';
import { AdvisorTable } from '@/components/shared/AdvisorTable';
import { AdvisorPanel } from '@/components/shared/AdvisorPanel';
import { AIChat } from '@/components/shared/AIChat';
import { DealHealthBadge } from '@/components/shared/DealHealthBadge';
import { PulseBadge } from '@/components/shared/PulseBadge';
import { FrictionBadge } from '@/components/shared/FrictionBadge';
import { SentimentBadge } from '@/components/shared/SentimentBadge';
import { SupplierAccountabilityCard, AdvisorSentimentFeed, PerAdvisorRating } from '@/components/shared/RatingsDisplay';
import { TrajectoryBadge } from '@/components/shared/TrajectoryBadge';
import { TierBadge } from '@/components/shared/TierBadge';
import { DealModal } from '@/components/shared/DealModal';
import { PartnerModal } from '@/components/shared/PartnerModal';
import { NAV_ITEMS_MANAGER, STAGE_WEIGHTS, QUARTER_END, DAYS_REMAINING, SERVICE_CATALOG } from '@/lib/constants';
import { Advisor, Deal, DealHealth, FrictionLevel, DiagnosticRow, EngagementScore, PartnerTier, LostReason, MeetingParty, MeetingNature } from '@/lib/types';
import { adaptAdvisor, adaptDeal } from '@/lib/db/adapter';

type DealStage = 'Discovery' | 'Qualifying' | 'Proposal' | 'Negotiating' | 'Closed Won' | 'Closed Lost' | 'Stalled';

const US_REGIONS: Record<string, { label: string; states: string[] }> = {
  northeast: { label: 'Northeast', states: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'] },
  southeast: { label: 'Southeast', states: ['AL', 'AR', 'DE', 'FL', 'GA', 'KY', 'LA', 'MD', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV', 'DC'] },
  midwest: { label: 'Midwest', states: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'] },
  southwest: { label: 'Southwest', states: ['AZ', 'NM', 'OK', 'TX'] },
  west: { label: 'West', states: ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY'] },
};

// localStorage helpers
function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function LiveManagerPage() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [intents, setIntents] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any>(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveViewRaw] = useState('command-center');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedKPI, setExpandedKPI] = useState<string | null>(null);
  const [dealFilter, setDealFilter] = useState({ health: 'all', stage: 'all' });
  const [drillDown, setDrillDown] = useState<{ label: string; advisorIds: string[] } | null>(null);
  const [inlineTab, setInlineTab] = useState<'overview' | 'personal' | 'deals' | 'notes' | 'activity'>('overview');
  const [relationshipsView, setRelationshipsView] = useState<'list' | 'detail'>('list');
  const [expandedKPIPanel, setExpandedKPIPanel] = useState<string | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [pipelineKPIExpanded, setPipelineKPIExpanded] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<DealStage | null>(null);
  const [relationshipSort, setRelationshipSort] = useState<'name' | 'mrr' | 'lastContact'>('mrr');
  const [searchCity, setSearchCity] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [cmTab, setCmTab] = useState<'campaigns' | 'assets' | 'results'>('campaigns');
  const [territoryFilter, setTerritoryFilter] = useState<string | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Advisor | null>(null);
  const [relationshipViewMode, setRelationshipViewMode] = useState<'partners' | 'tsds' | 'groups' | 'all'>('partners');
  const [contactTypeFilter, setContactTypeFilter] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [pipelineMetricsView, setPipelineMetricsView] = useState<'kanban' | 'deals' | 'quotes-vs-sold' | 'by-advisor'>('deals');
  const [selectedTsdAdvisors, setSelectedTsdAdvisors] = useState<Advisor[]>([]);
  const [expandedTsdCompany, setExpandedTsdCompany] = useState<string | null>(null);
  const [intelligenceSubTab, setIntelligenceSubTab] = useState<'overview' | 'signals' | 'playbooks' | 'diagnostics' | 'resources'>('overview');
  const [signalFilter, setSignalFilter] = useState<'all' | 'churn' | 'growth' | 'stall' | 'intel'>('all');
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [playbookModalSignal, setPlaybookModalSignal] = useState<{type: string; title: string; desc: string; partnerName?: string; mrr?: number} | null>(null);
  const [playbookSteps, setPlaybookSteps] = useState<string[]>(['', '', '']);
  const [playbookPriority, setPlaybookPriority] = useState<'critical' | 'high' | 'medium'>('high');
  const [playbookDeadline, setPlaybookDeadline] = useState(14);
  const [selectedPlaybookTemplate, setSelectedPlaybookTemplate] = useState<string | null>(null);
  const [playbookAssignees, setPlaybookAssignees] = useState<string[]>([]);
  const [launchedPlaybooks, setLaunchedPlaybooks] = useState<Array<{templateId: string; advisorId: string; advisorName: string; launchedAt: string; priority: 'critical' | 'high' | 'medium'; completedSteps: number[]; skippedSteps: number[]; customSteps?: Array<{day: number; label: string; desc: string; phase: string}>; notes?: string; playbookName?: string}>>(() => loadFromStorage('cc_launchedPlaybooks', []));
  const [editingPlaybookIdx, setEditingPlaybookIdx] = useState<number | null>(null);
  const [ccKpiDrill, setCcKpiDrill] = useState<string | null>(null);
  const [showCoMarketingNotif, setShowCoMarketingNotif] = useState(true);
  const [tsdRoleFilter, setTsdRoleFilter] = useState<string>('All');
  const [tsdCompanyFilter, setTsdCompanyFilter] = useState<string | null>(null);
  const [tsdSearch, setTsdSearch] = useState('');
  const [selectedTsdContact, setSelectedTsdContact] = useState<any>(null);
  const [partnersSubView, setPartnersSubView] = useState<'contacts' | 'companies'>('contacts');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<string[]>(() => loadFromStorage('cc_completedActions', []));
  const [actionFilter, setActionFilter] = useState<'all' | 'critical' | 'playbook' | 'cadence' | 'deals'>('all');
  const [showAllPriority, setShowAllPriority] = useState(false);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);
  const [playbookModalAdvisor, setPlaybookModalAdvisor] = useState<Advisor | null>(null);
  const [playbookModalMode, setPlaybookModalMode] = useState<'template' | 'custom' | 'ai'>('template');
  const [aiPlaybookMessages, setAiPlaybookMessages] = useState<Array<{type: 'user' | 'assistant'; text: string}>>([]);
  const [aiPlaybookInput, setAiPlaybookInput] = useState('');
  const [aiPlaybookLoading, setAiPlaybookLoading] = useState(false);
  const [aiGeneratedSteps, setAiGeneratedSteps] = useState<Array<{day: number; label: string; desc: string; phase: string}> | null>(null);
  const [customPlaybookName, setCustomPlaybookName] = useState('');
  const [customPlaybookSteps, setCustomPlaybookSteps] = useState<Array<{label: string; desc: string; day: number}>>([{label: '', desc: '', day: 1}]);
  const [showAbandonModal, setShowAbandonModal] = useState<{advisorId: string; advisorName: string; company: string; tier: PartnerTier; mrr: number} | null>(null);
  const [abandonNotes, setAbandonNotes] = useState('');
  const [stalledAdvisorIds, setStalledAdvisorIds] = useState<string[]>(() => loadFromStorage('cc_stalledAdvisorIds', []));
  const [modalEditSteps, setModalEditSteps] = useState<Array<{day: number; label: string; desc: string; phase: string}>>([]);
  const [deleteTemplateConfirm, setDeleteTemplateConfirm] = useState<string | null>(null);
  const [showDeleteAdvisorConfirm, setShowDeleteAdvisorConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Call logs
  const [callLogs, setCallLogs] = useState<Array<{id: string; advisorId: string; advisorName: string; date: string; duration: string; notes: string; dealMentioned?: string; newDealName?: string; sentiment: 'positive' | 'neutral' | 'negative'}>>(() => loadFromStorage('cc_callLogs', []));
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [logCallAdvisor, setLogCallAdvisor] = useState<Advisor | null>(null);
  const [logCallNotes, setLogCallNotes] = useState('');
  const [logCallDuration, setLogCallDuration] = useState('15');
  const [logCallSentiment, setLogCallSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral');
  const [logCallDealMentioned, setLogCallDealMentioned] = useState('');
  const [logCallNewDeal, setLogCallNewDeal] = useState(false);
  const [logCallNewDealName, setLogCallNewDealName] = useState('');
  const [logContactType, setLogContactType] = useState<'call' | 'email'>('call');
  const [showClosedLostModal, setShowClosedLostModal] = useState(false);
  const [closedLostDealId, setClosedLostDealId] = useState<string | null>(null);
  const [closedLostReason, setClosedLostReason] = useState<LostReason | ''>('');
  const [closedLostDetail, setClosedLostDetail] = useState('');
  const [logMeetingType, setLogMeetingType] = useState<MeetingParty | ''>('');
  const [logMeetingNature, setLogMeetingNature] = useState<MeetingNature | ''>('');
  const [pipelineTimeframe, setPipelineTimeframe] = useState<'all' | '30d' | '45d' | 'quarter' | 'ytd'>('all');
  const [overdueThreshold, setOverdueThreshold] = useState(7);
  const [territoryRegion, setTerritoryRegion] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('cc_territory_region') || '';
  });
  const [territoryExceptions, setTerritoryExceptions] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('cc_territory_exceptions') || '[]'); } catch { return []; }
  });
  const [showFullUSA, setShowFullUSA] = useState(false);

  // Persisted TSD contact edits (overrides for static TSD data)
  const [tsdContactOverrides, setTsdContactOverrides] = useState<Record<string, Record<string, string>>>(() => loadFromStorage('cc_tsdContactOverrides', {}));

  // Editable personal intel per advisor
  const [advisorPersonalIntel, setAdvisorPersonalIntel] = useState<Record<string, {birthday?: string; education?: string; family?: string; hobbies?: string; funFact?: string; linkedin?: string}>>(() => loadFromStorage('cc_advisorPersonalIntel', {}));
  const [editingIntelField, setEditingIntelField] = useState<string | null>(null);
  const [editingIntelValue, setEditingIntelValue] = useState('');

  // Editable white space notes per advisor
  const [advisorWhiteSpaceNotes, setAdvisorWhiteSpaceNotes] = useState<Record<string, string>>(() => loadFromStorage('cc_advisorWhiteSpaceNotes', {}));
  const [editingWhiteSpace, setEditingWhiteSpace] = useState(false);
  const [editingWhiteSpaceValue, setEditingWhiteSpaceValue] = useState('');

  // Editable co-marketing notes per advisor
  const [advisorCoMarketingNotes, setAdvisorCoMarketingNotes] = useState<Record<string, string>>(() => loadFromStorage('cc_advisorCoMarketingNotes', {}));
  const [editingCoMarketing, setEditingCoMarketing] = useState(false);
  const [editingCoMarketingValue, setEditingCoMarketingValue] = useState('');

  // Advisor notes with timestamps
  const [advisorNotes, setAdvisorNotes] = useState<Record<string, string[]>>(() => loadFromStorage('cc_advisorNotes', {}));
  const [noteInput, setNoteInput] = useState('');

  // Editable action items per advisor
  const [advisorActionItems, setAdvisorActionItems] = useState<Record<string, Array<{id: string; title: string; due: string; status: 'overdue' | 'pending' | 'low' | 'done'}>>>(() => loadFromStorage('cc_advisorActionItems', {}));
  const [editingActionItem, setEditingActionItem] = useState<string | null>(null);
  const [editingActionValue, setEditingActionValue] = useState('');
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionDue, setNewActionDue] = useState('');

  // Contact groups
  const [contactGroups, setContactGroups] = useState<Array<{id: string; name: string; advisorIds: string[]; rules?: {cadenceDays?: number; autoActions?: boolean; emailTemplateId?: string}}>>(() => loadFromStorage('cc_contactGroups', []));
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupAdvisors, setNewGroupAdvisors] = useState<string[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showGroupRules, setShowGroupRules] = useState<string | null>(null);
  const [groupRuleCadence, setGroupRuleCadence] = useState('14');
  const [groupRuleAutoActions, setGroupRuleAutoActions] = useState(false);

  // Contacts view
  const [contactsView, setContactsView] = useState<'partners' | 'tsds' | 'all' | 'groups'>('partners');

  // Helper: get all advisor IDs for a deal (backward-compatible)
  const getDealAdvisorIds = (deal: any): string[] => {
    if (deal.advisorIds?.length) return deal.advisorIds;
    if (deal.advisorId) return [deal.advisorId];
    return [];
  };

  const [playbookTemplates, setPlaybookTemplates] = useState<Array<{
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    category: string;
    duration: string;
    steps: Array<{day: number; label: string; desc: string; phase: string}>;
    bgColor: string;
    borderColor: string;
    tagColor: string;
    color: string;
    applicableTo: string;
  }>>([
    {
      id: 'win-back',
      icon: '🔄',
      title: 'Win-Back',
      subtitle: 'Re-engage at-risk partners',
      category: 'Retention',
      duration: '7 days',
      color: '#e53e3e',
      bgColor: 'bg-red-50',
      borderColor: 'border-l-red-500',
      tagColor: 'bg-red-100 text-red-800',
      applicableTo: 'At-Risk Partners',
      steps: [
        { day: 1, phase: 'Discovery', label: 'Pull complaint history', desc: 'Analyze recent support tickets, escalations, and NPS feedback.' },
        { day: 2, phase: 'Discovery', label: 'Review engagement metrics', desc: 'Check product usage, feature adoption, and login trends.' },
        { day: 3, phase: 'Action', label: 'Executive outreach call', desc: 'Schedule call with partner executive to discuss concerns.' },
        { day: 4, phase: 'Action', label: 'Present recovery plan', desc: 'Offer service improvements, credits, or SLA changes.' },
        { day: 5, phase: 'Action', label: 'Assign dedicated support', desc: 'Pair with a senior CSM for daily check-ins.' },
        { day: 7, phase: 'Close', label: 'Confirm partnership commitment', desc: 'Get verbal confirmation of renewed engagement.' },
      ],
    },
    {
      id: 'onboarding',
      icon: '🚀',
      title: 'Onboarding',
      subtitle: 'Launch new partners for success',
      category: 'Activation',
      duration: '14 days',
      color: '#3182CE',
      bgColor: 'bg-blue-50',
      borderColor: 'border-l-blue-500',
      tagColor: 'bg-blue-100 text-blue-800',
      applicableTo: 'New Partners',
      steps: [
        { day: 1, phase: 'Setup', label: 'Welcome kickoff call', desc: 'Introduce team, review roadmap, and set expectations.' },
        { day: 2, phase: 'Setup', label: 'Send enablement kit', desc: 'Provide marketing collateral, pricing deck, and sales guides.' },
        { day: 4, phase: 'Training', label: 'Product training session', desc: 'Deep dive on features, integrations, and use cases.' },
        { day: 6, phase: 'Training', label: 'Co-sell alignment', desc: 'Align on positioning, messaging, and target segments.' },
        { day: 9, phase: 'Launch', label: 'Help with first deal registration', desc: 'Guide through deal reg process to ensure compliance.' },
        { day: 14, phase: 'Close', label: 'First 30-day check-in', desc: 'Review early wins, challenges, and support needs.' },
      ],
    },
    {
      id: 'tier-upgrade',
      icon: '⬆️',
      title: 'Tier Upgrade',
      subtitle: 'Accelerate high-performers to premium',
      category: 'Growth',
      duration: '30 days',
      color: '#157A6E',
      bgColor: 'bg-teal-50',
      borderColor: 'border-l-teal-500',
      tagColor: 'bg-teal-100 text-teal-800',
      applicableTo: 'High-Growth Partners',
      steps: [
        { day: 1, phase: 'Strategy', label: 'Strategic plan review', desc: 'Review partner goals, market size, and growth trajectory.' },
        { day: 3, phase: 'Strategy', label: 'Define Platinum criteria', desc: 'Set MRR targets, activity levels, and engagement commitments.' },
        { day: 7, phase: 'Enablement', label: 'Assign dedicated SE', desc: 'Introduce senior solution engineer and technical resources.' },
        { day: 14, phase: 'Enablement', label: 'Pipeline acceleration sprint', desc: 'Co-build top 5 opportunities with joint planning.' },
        { day: 21, phase: 'Close', label: 'Executive sponsor check-in', desc: 'CEO/CRO call to discuss partnership elevation.' },
        { day: 30, phase: 'Close', label: 'Tier promotion decision', desc: 'Formalize new tier status and benefits.' },
      ],
    },
    {
      id: 'activation',
      icon: '⚡',
      title: 'Activation',
      subtitle: 'Reignite dormant partnerships',
      category: 'Engagement',
      duration: '21 days',
      color: '#D69E2E',
      bgColor: 'bg-amber-50',
      borderColor: 'border-l-amber-500',
      tagColor: 'bg-amber-100 text-amber-800',
      applicableTo: 'Inactive Partners',
      steps: [
        { day: 1, phase: 'Reconnect', label: 'Audit partner history', desc: 'Review past deals, relationships, and engagement trends.' },
        { day: 2, phase: 'Reconnect', label: 'Personal outreach (no pitch)', desc: 'Reach out to check on their business, not to sell.' },
        { day: 5, phase: 'Engage', label: 'Share competitive intelligence', desc: 'Send relevant market insights and industry trends.' },
        { day: 10, phase: 'Engage', label: 'Bring a warm lead', desc: 'Generate one inbound opportunity to demonstrate value.' },
        { day: 15, phase: 'Launch', label: 'Schedule advisory board call', desc: 'Involve them in product direction or strategy.' },
        { day: 21, phase: 'Close', label: 'Activation assessment', desc: 'Evaluate renewed interest and next steps.' },
      ],
    },
    {
      id: 'qbr',
      icon: '📊',
      title: 'Quarterly Business Review',
      subtitle: 'Strategic partner review & planning',
      category: 'Cadence',
      duration: '7 days',
      color: '#5A67D8',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-l-indigo-500',
      tagColor: 'bg-indigo-100 text-indigo-800',
      applicableTo: 'Platinum & Gold Partners',
      steps: [
        { day: 1, phase: 'Preparation', label: 'Gather performance data', desc: 'Compile MRR, deals, adoption metrics, and feedback.' },
        { day: 2, phase: 'Preparation', label: 'Build executive summary', desc: 'Create slide deck with results, wins, and recommendations.' },
        { day: 3, phase: 'Preparation', label: 'Confirm attendees', desc: 'Coordinate schedule with partner leadership.' },
        { day: 5, phase: 'Delivery', label: 'Conduct QBR meeting', desc: 'Review results, discuss challenges, and plan next quarter.' },
        { day: 6, phase: 'Close', label: 'Send follow-up & action items', desc: 'Document decisions, commitments, and next steps.' },
        { day: 7, phase: 'Close', label: 'Schedule next QBR', desc: 'Lock in date for next quarterly review.' },
      ],
    },
    {
      id: 'cross-sell',
      icon: '🎯',
      title: 'Cross-Sell',
      subtitle: 'Expand wallet with additional products',
      category: 'Revenue',
      duration: '14 days',
      color: '#38A169',
      bgColor: 'bg-green-50',
      borderColor: 'border-l-green-500',
      tagColor: 'bg-green-100 text-green-800',
      applicableTo: 'Single-Product Customers',
      steps: [
        { day: 1, phase: 'Planning', label: 'Identify cross-sell products', desc: 'Analyze usage and recommend complementary solutions.' },
        { day: 3, phase: 'Planning', label: 'Calculate total contract value', desc: 'Model revenue expansion and mutual benefits.' },
        { day: 5, phase: 'Proposal', label: 'Build joint proposal', desc: 'Create technical specs and pricing for expanded scope.' },
        { day: 7, phase: 'Proposal', label: 'Strategy call with partner', desc: 'Present opportunity and answer technical questions.' },
        { day: 10, phase: 'Closing', label: 'First deal registered', desc: 'Submit cross-sell deal to deal registration system.' },
        { day: 14, phase: 'Close', label: 'Product onboarding plan', desc: 'Schedule training for new product modules.' },
      ],
    },
  ]);

  const setActiveView = (view: string) => {
    setActiveViewRaw(view);
    if (view !== 'relationships') {
      setSelectedAdvisor(null);
      setPanelOpen(false);
    }
    setExpandedKPIPanel(null);
    setExpandedKPI(null);
    setDrillDown(null);
    setSelectedDeal(null);
  };

  // Helper to open playbook modal with optional context
  const openPlaybookModal = (advisorId?: string, templateId?: string) => {
    if (advisorId) {
      const advisor = advisors.find(a => a.id === advisorId);
      setPlaybookModalAdvisor(advisor || null);
    } else {
      setPlaybookModalAdvisor(null);
    }
    if (templateId) {
      setSelectedPlaybookTemplate(templateId);
      setPlaybookModalMode('template');
    } else {
      setSelectedPlaybookTemplate(null);
      setPlaybookModalMode('template');
    }
    setShowPlaybookModal(true);
  };

  // Abandon/Reignite Advisor functions
  const abandonAdvisor = (advisorId: string) => {
    setStalledAdvisorIds(prev => [...prev, advisorId]);
    setLaunchedPlaybooks(prev => prev.filter(p => p.advisorId !== advisorId));
    setShowAbandonModal(null);
    setSelectedAdvisor(null);
    setPanelOpen(false);
    setAbandonNotes('');
  };

  const reigniteAdvisor = (advisorId: string) => {
    setStalledAdvisorIds(prev => prev.filter(id => id !== advisorId));
  };

  // AI Playbook generation
  const sendAiPlaybookMessage = async (text: string) => {
    if (!text.trim()) return;
    const advisor = playbookModalAdvisor;

    // Add user message to chat immediately
    const newUserMsg = { type: 'user' as const, text };
    setAiPlaybookMessages(prev => [...prev, newUserMsg]);
    setAiPlaybookInput('');
    setAiPlaybookLoading(true);

    try {
      // Build system prompt with deep channel management context
      const advisorContext = advisor
        ? `ADVISOR PROFILE:
- Name: ${advisor.name}
- Company: ${advisor.company}
- Tier: ${advisor.tier}
- MRR: ${formatCurrency(advisor.mrr)}
- Trajectory: ${advisor.trajectory}
- Pulse: ${advisor.pulse}
- Friction: ${advisor.friction}
- Diagnosis: ${advisor.diagnosis || 'None provided'}
- Last Contact: ${advisor.lastContact || 'Unknown'}`
        : '';

      const systemContext = `You are a channel management strategist helping a supplier's channel manager build an actionable playbook for a partner advisor at a TSD (Technology Solutions Distributor).

${advisorContext}

YOUR JOB: Have a brief dialogue with the channel manager FIRST to understand their goals, then generate a concrete, day-by-day action plan they can execute.

IMPORTANT: Before generating any playbook steps, you MUST ask the channel manager at least one clarifying question about their goals, the partner's situation, or what outcome they're targeting. Never generate a complete playbook on the first response. Have a brief dialogue first (1-2 questions), then generate the playbook with structured steps.

PLAYBOOK RULES:
- Steps should be real actions: "Call [advisor name] to review Q2 pipeline" not "Reach out to partner"
- Use the advisor's actual name, company, tier, and data in the steps
- Day numbers represent business days from when the playbook starts
- Each step needs a clear label (what to do) and description (how to do it, what to say, what to prepare)
- Group steps into phases that make sense for the goal (e.g., "Discovery", "Engagement", "Execution", "Follow-through")
- Include 5-12 steps depending on complexity
- Space steps realistically — not everything on Day 1
- For at-risk/declining advisors: front-load with diagnosis and quick wins
- For growth plays: build momentum with early engagement before asking for commitments
- For onboarding: map to typical TSD partner activation milestones
- For win-back: start with listening, then rebuild with small asks

RESPONSE FORMAT (when dialogue is complete and user is ready for the playbook):
1. Brief explanation of your approach (2-3 sentences max)
2. The playbook as a JSON code block:

\`\`\`json
[
  {"day": 1, "label": "Action title", "desc": "Detailed description of what to do", "phase": "Phase Name"},
  {"day": 3, "label": "Action title", "desc": "Detailed description", "phase": "Phase Name"}
]
\`\`\`

3. One sentence asking if they want to adjust anything

FORMATTING for generated steps:
When you DO generate the playbook (after gathering context), format the steps in the JSON with this exact format for each step:
Day X: [Step Title] — [Step description]

If the user asks you to revise, regenerate the FULL JSON block with changes applied. Always output the complete updated playbook, never a partial diff.
If the user's request is vague or you don't have enough context, ask ONE clarifying question — don't generate a playbook until you understand their specific goal.`;

      // Send only prior history (not the current message) to avoid duplication
      // The API route will add the current message separately
      const priorHistory = aiPlaybookMessages.map(m => ({ type: m.type, text: m.text }));

      const res = await fetch('/api/live/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          role: 'manager',
          advisorId: advisor?.id,
          systemPrompt: systemContext,
          conversationHistory: priorHistory,
          maxTokens: 4096,
        }),
      });
      const data = await res.json();
      const responseText = data.response || 'I couldn\'t generate a response. Try describing what you want this playbook to accomplish.';

      setAiPlaybookMessages(prev => [...prev, { type: 'assistant', text: responseText }]);

      // Extract JSON steps from the response
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const steps = JSON.parse(jsonMatch[1]);
          if (Array.isArray(steps) && steps.length > 0 && steps[0].label && steps[0].day !== undefined) {
            setAiGeneratedSteps(steps);
          }
        } catch (parseErr) {
          console.error('Failed to parse AI playbook JSON:', parseErr);
        }
      }
    } catch (err) {
      setAiPlaybookMessages(prev => [...prev, { type: 'assistant', text: 'Could not reach AI service. Try again or create steps manually.' }]);
    }

    setAiPlaybookLoading(false);
  };

  // Fetch live data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [advisorsRes, dealsRes, intentsRes, ratingsRes] = await Promise.all([
        fetch('/api/live/advisors'),
        fetch('/api/live/deals'),
        fetch('/api/live/intent'),
        fetch('/api/live/ratings'),
      ]);
      const rawAdvisors = await advisorsRes.json();
      const rawDeals = await dealsRes.json();
      const rawIntents = await intentsRes.json();
      const rawRatings = await ratingsRes.json();
      setAdvisors(rawAdvisors.map(adaptAdvisor));
      setDeals(rawDeals.map(adaptDeal));
      setIntents(Array.isArray(rawIntents) ? rawIntents : []);
      setRatings(rawRatings);
    } catch (err) {
      console.error('Failed to fetch live data:', err);
    }
    setLoading(false);
  };

  const handleSaveDeal = async (dealData: Partial<Deal>) => {
    try {
      const response = await fetch('/api/live/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      });
      if (!response.ok) throw new Error('Failed to save deal');
      await fetchData();
    } catch (err) {
      console.error('Error saving deal:', err);
      throw err;
    }
  };

  // Inline deal creation state
  const [showInlineAddDeal, setShowInlineAddDeal] = useState(false);
  const [inlineDealName, setInlineDealName] = useState('');
  const [inlineDealMRR, setInlineDealMRR] = useState('');

  // Global search state
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  useEffect(() => { fetchData(); }, []);

  // Auto-create advisors for onboarding playbook contacts that don't exist yet
  useEffect(() => {
    if (advisors.length === 0 || launchedPlaybooks.length === 0) return;
    const advisorIds = new Set(advisors.map(a => a.id));
    const orphanedPlaybooks = launchedPlaybooks.filter(pb => !advisorIds.has(pb.advisorId) && pb.templateId.startsWith('onboarding-'));
    if (orphanedPlaybooks.length === 0) return;

    const createMissing = async () => {
      for (const pb of orphanedPlaybooks) {
        try {
          await fetch('/api/live/advisors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: pb.advisorId,
              name: pb.advisorName,
              company: 'Unknown',
              title: 'Partner',
              tier: 'building',
              mrr: 0,
              pulse: 'Fading',
              trajectory: 'Stable',
              friction: 'Moderate',
              diagnosis: `Created from onboarding playbook: ${pb.playbookName || 'Relationship playbook'}`,
              lastContact: new Date().toISOString().split('T')[0],
              location: '',
              email: '',
              phone: '',
            }),
          });
        } catch (err) {
          console.error('Failed to create advisor from onboarding playbook:', err);
        }
      }
      fetchData(); // Refresh to pick up new advisors
    };
    createMissing();
  }, [advisors.length, launchedPlaybooks]);

  // Global search keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
        setGlobalSearchQuery('');
      }
      if (e.key === 'Escape') setShowGlobalSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Persist key state to localStorage
  useEffect(() => { saveToStorage('cc_launchedPlaybooks', launchedPlaybooks); }, [launchedPlaybooks]);
  useEffect(() => { saveToStorage('cc_completedActions', completedActions); }, [completedActions]);
  useEffect(() => { saveToStorage('cc_stalledAdvisorIds', stalledAdvisorIds); }, [stalledAdvisorIds]);
  useEffect(() => { saveToStorage('cc_callLogs', callLogs); }, [callLogs]);
  useEffect(() => { saveToStorage('cc_advisorPersonalIntel', advisorPersonalIntel); }, [advisorPersonalIntel]);
  useEffect(() => { saveToStorage('cc_advisorWhiteSpaceNotes', advisorWhiteSpaceNotes); }, [advisorWhiteSpaceNotes]);
  useEffect(() => { saveToStorage('cc_advisorCoMarketingNotes', advisorCoMarketingNotes); }, [advisorCoMarketingNotes]);
  useEffect(() => { saveToStorage('cc_advisorActionItems', advisorActionItems); }, [advisorActionItems]);
  useEffect(() => { saveToStorage('cc_advisorNotes', advisorNotes); }, [advisorNotes]);
  useEffect(() => { saveToStorage('cc_contactGroups', contactGroups); }, [contactGroups]);
  useEffect(() => { saveToStorage('cc_tsdContactOverrides', tsdContactOverrides); }, [tsdContactOverrides]);

  // Delete handlers
  const handleDeleteAdvisor = async (advisorId: string) => {
    try {
      const response = await fetch(`/api/live/advisors?id=${advisorId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete advisor');
      setAdvisors(prev => prev.filter(a => a.id !== advisorId));
      setDeals(prev => prev.filter(d => d.advisorId !== advisorId));
      setLaunchedPlaybooks(prev => prev.filter(p => p.advisorId !== advisorId));
      if (selectedAdvisor?.id === advisorId) { setSelectedAdvisor(null); setPanelOpen(false); }
    } catch (err) {
      console.error('Error deleting advisor:', err);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      const response = await fetch(`/api/live/deals?id=${dealId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete deal');
      setDeals(prev => prev.filter(d => d.id !== dealId));
      if (selectedDeal?.id === dealId) setSelectedDeal(null);
    } catch (err) {
      console.error('Error deleting deal:', err);
    }
  };

  const handleDeletePlaybook = (idx: number) => {
    setLaunchedPlaybooks(prev => prev.filter((_, i) => i !== idx));
    if (editingPlaybookIdx === idx) setEditingPlaybookIdx(null);
  };

  const handleSavePartner = async (partnerData: Partial<Advisor>) => {
    try {
      const response = await fetch('/api/live/advisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      });
      if (!response.ok) throw new Error('Failed to save partner');
      await fetchData();
    } catch (err) {
      console.error('Error saving partner:', err);
      throw err;
    }
  };

  const handleCloseDealLost = (dealId: string) => {
    if (!closedLostReason) return;
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: 'Closed Lost' as any, lostReason: closedLostReason as any, lostReasonDetail: closedLostDetail } : d));
    fetch('/api/live/deals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dealId, stage: 'Closed Lost', lostReason: closedLostReason, lostReasonDetail: closedLostDetail }),
    }).catch(console.error);
    setShowClosedLostModal(false);
    setClosedLostDealId(null);
    setClosedLostReason('');
    setClosedLostDetail('');
    if (selectedDeal?.id === dealId) setSelectedDeal(null);
  };

  const handleLogCall = () => {
    if (!logCallAdvisor || !logCallNotes.trim()) return;
    const newLog = {
      id: `call-${Date.now()}`,
      advisorId: logCallAdvisor.id,
      advisorName: logCallAdvisor.name,
      date: new Date().toISOString(),
      duration: logCallDuration,
      notes: logCallNotes,
      sentiment: logCallSentiment as 'positive' | 'neutral' | 'negative',
      ...(logCallDealMentioned ? { dealMentioned: logCallDealMentioned } : {}),
      ...(logCallNewDeal && logCallNewDealName ? { newDealName: logCallNewDealName } : {}),
    };
    setCallLogs(prev => [newLog, ...prev]);

    // If new deal mentioned, create it
    if (logCallNewDeal && logCallNewDealName.trim()) {
      const newDeal: any = {
        id: `deal-${Date.now()}`,
        name: logCallNewDealName,
        advisorId: logCallAdvisor.id,
        stage: 'Discovery',
        mrr: 0,
        health: 'Healthy',
        probability: 10,
        daysInStage: 0,
        lastActivity: new Date().toISOString().split('T')[0],
        nextStep: 'Initial qualification',
        decisionMaker: logCallAdvisor.name,
        products: [],
        actionItems: [`Follow up on ${logCallNewDealName} from call`],
      };
      setDeals(prev => [...prev, newDeal]);
      // Also persist via API
      fetch('/api/live/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: logCallNewDealName, advisorId: logCallAdvisor.id, stage: 'Discovery', mrr: 0, probability: 10, health: 'Healthy', daysInStage: 0 }),
      }).catch(console.error);
    }

    // Reset modal
    setShowLogCallModal(false);
    setLogCallNotes('');
    setLogCallDuration('15');
    setLogCallSentiment('neutral');
    setLogCallDealMentioned('');
    setLogCallNewDeal(false);
    setLogCallNewDealName('');
  };

  // Wire up advisor -> deal relationship
  const advisorsWithDeals = useMemo(() => {
    return advisors.map(a => ({
      ...a,
      deals: deals.filter(d => d.advisorId === a.id).map(d => d.id),
    }));
  }, [advisors, deals]);

  // Build advisorsByCity for the map
  const advisorsByCityMap = useMemo(() => {
    const result: Record<string, { city: string; state: string; count: number; mrr: number; advisors: Array<{ id: string; name: string; mrr: number }> }> = {};
    advisorsWithDeals.forEach(a => {
      const loc = a.location?.trim();
      if (!loc) return;
      if (!result[loc]) {
        const parts = loc.split(',').map(s => s.trim());
        result[loc] = { city: parts[0] || loc, state: parts[1] || '', count: 0, mrr: 0, advisors: [] };
      }
      result[loc].count++;
      result[loc].mrr += a.mrr;
      result[loc].advisors.push({ id: a.id, name: a.name, mrr: a.mrr });
    });
    Object.values(result).forEach(r => r.advisors.sort((a, b) => b.mrr - a.mrr));
    return result;
  }, [advisorsWithDeals]);

  // Build state-level data for territory map
  const stateDataMap = useMemo(() => {
    const result: Record<string, { partners: number; mrr: number; pipeline: number; deals: number }> = {};
    advisorsWithDeals.forEach(a => {
      const loc = a.location?.trim();
      if (!loc) return;
      const parts = loc.split(',').map(s => s.trim());
      const stateAbbr = parts[1]?.toUpperCase();
      if (!stateAbbr || stateAbbr.length !== 2) return;
      if (!result[stateAbbr]) result[stateAbbr] = { partners: 0, mrr: 0, pipeline: 0, deals: 0 };
      result[stateAbbr].partners++;
      result[stateAbbr].mrr += a.mrr;
    });
    deals.forEach(d => {
      const advisor = advisors.find(a => a.id === d.advisorId);
      if (!advisor?.location) return;
      const parts = advisor.location.split(',').map(s => s.trim());
      const stateAbbr = parts[1]?.toUpperCase();
      if (!stateAbbr || stateAbbr.length !== 2) return;
      if (!result[stateAbbr]) result[stateAbbr] = { partners: 0, mrr: 0, pipeline: 0, deals: 0 };
      result[stateAbbr].deals++;
      if (d.stage !== 'Closed Won' && d.stage !== 'Stalled') {
        result[stateAbbr].pipeline += d.mrr;
      }
    });
    return result;
  }, [advisorsWithDeals, deals, advisors]);

  // Region mapping helper
  const regionMapping = (location: string): string => {
    const locationLower = location.toLowerCase();
    const neastates = ['me', 'nh', 'vt', 'ma', 'ri', 'ct', 'ny', 'nj', 'pa', 'de', 'md', 'dc'];
    const southeast = ['va', 'wv', 'nc', 'sc', 'ga', 'fl', 'al', 'ms', 'la', 'ar', 'ky', 'tn'];
    const midwest = ['oh', 'in', 'il', 'mi', 'wi', 'mn', 'ia', 'mo', 'nd', 'sd', 'ne', 'ks'];
    const southwest = ['tx', 'ok', 'nm', 'az'];
    const west = ['wa', 'or', 'ca', 'nv', 'id', 'mt', 'wy', 'co', 'ut'];

    for (const state of neastates) if (locationLower.includes(state)) return 'Northeast';
    for (const state of southeast) if (locationLower.includes(state)) return 'Southeast';
    for (const state of midwest) if (locationLower.includes(state)) return 'Midwest';
    for (const state of southwest) if (locationLower.includes(state)) return 'Southwest';
    for (const state of west) if (locationLower.includes(state)) return 'West';
    return 'Other';
  };

  const userName = 'Jordan R.';
  const userInitials = 'JR';

  // KPI computations
  const totalMRR = advisors.reduce((sum, a) => sum + a.mrr, 0);
  const activePipeline = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled');
  const pipelineMRR = activePipeline.reduce((sum, d) => sum + d.mrr, 0);
  const weightedPipeline = activePipeline.reduce((sum, d) => {
    const w = STAGE_WEIGHTS.find(s => s.stage === d.stage)?.weight || 0;
    return sum + d.mrr * w;
  }, 0);
  const atRiskAdvisors = advisors.filter(a => !stalledAdvisorIds.includes(a.id) && (a.trajectory === 'Freefall' || a.trajectory === 'Slipping'));
  const atRiskMRR = atRiskAdvisors.reduce((sum, a) => sum + a.mrr, 0);
  const stalledDeals = deals.filter(d => d.stage === 'Stalled');
  const closedWonDeals = deals.filter(d => d.stage === 'Closed Won');
  const closedWonMRR = closedWonDeals.reduce((sum, d) => sum + d.mrr, 0);

  // Notification count: overdue cadences + critical actions
  const overdueNotifCount = useMemo(() => {
    const getDays = (d: string) => Math.floor((new Date().getTime() - new Date(d).getTime()) / (1000*60*60*24));
    const overdueCadence = advisors.filter(a => {
      if (a.tier === 'anchor' && getDays(a.lastContact) > 7) return true;
      if (a.tier === 'scaling' && getDays(a.lastContact) > 14) return true;
      if (a.tier === 'building' && getDays(a.lastContact) > 21) return true;
      if (a.tier === 'launching' && getDays(a.lastContact) > 10) return true;
      return false;
    }).length;
    const criticalFriction = advisors.filter(a => a.friction === 'Critical').length;
    const stalledDealsCount = deals.filter(d => d.stage === 'Stalled').length;
    return overdueCadence + criticalFriction + stalledDealsCount;
  }, [advisors, deals]);

  const formatCurrency = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`;

  // Stage distribution
  const stages: DealStage[] = ['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Closed Lost', 'Stalled'];
  const stageDistribution = stages.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage);
    return { stage, count: stageDeals.length, mrr: stageDeals.reduce((s, d) => s + d.mrr, 0) };
  });
  const maxStageMRR = Math.max(...stageDistribution.map(s => s.mrr), 1);

  // Quadrant data
  const quadrantAdvisors = advisorsWithDeals.filter(a => a.mrr > 0);
  const maxMRR = Math.max(...quadrantAdvisors.map(a => a.mrr), 1);

  const engScore = (a: Advisor) => {
    const scores: Record<string, number> = { Strong: 3, Steady: 2, Rising: 2.5, Fading: 1, Flatline: 0 };
    const eb = a.engagementBreakdown;
    return ((scores[eb.engagement] ?? 1.5) + (scores[eb.pipelineStrength] ?? 1.5) + (scores[eb.responsiveness] ?? 1.5) + (scores[eb.growthPotential] ?? 1.5)) / 4;
  };

  // Diagnostic rows
  const diagnosticRows: DiagnosticRow[] = advisors
    .filter(a => a.friction !== 'Low' || a.pulse === 'Fading' || a.pulse === 'Flatline')
    .map(a => ({ advisor: a.name, pulse: a.pulse, dealHealth: a.dealHealth, friction: a.friction, diagnosis: a.diagnosis }));

  // Seeded random for deterministic mock data
  const seededRandom = (seed: string): number => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 1000 / 1000;
  };

  // TSD Company Data — contacts at each Technology Solutions Distributor
  const TSD_COMPANIES = useMemo(() => {
    const companies = [
      {
        name: 'Telarus',
        logo: '🟦',
        description: 'Largest privately-held technology solutions distributor',
        contacts: [
          { id: 'tel-1', name: 'Sarah Mitchell', title: 'Channel Development Manager', role: 'Channel Manager', email: 's.mitchell@telarus.com', phone: '(801) 555-4821', lastContact: '2026-03-29', introsQTD: 8, introsAllTime: 47, revenueAttributed: 142000, responsiveness: 'Fast' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Proactively sending intro leads — 3 new ones this week', signalType: 'positive' as const, location: 'Salt Lake City, UT', commPref: 'Slack', notes: 'Key ally at Telarus. Always responds same-day. Advocates for Aptum in internal supplier reviews.', linkedin: 'linkedin.com/in/sarah-mitchell-telarus' },
          { id: 'tel-2', name: 'James Thornton', title: 'Solutions Engineer', role: 'Sales Engineer', email: 'j.thornton@telarus.com', phone: '(801) 555-3392', lastContact: '2026-03-25', introsQTD: 5, introsAllTime: 31, revenueAttributed: 88000, responsiveness: 'Moderate' as const, sentiment: 'Neutral' as const, engagement: 'Medium' as const, signal: 'Requested updated technical docs for SD-WAN — possible upcoming RFP', signalType: 'info' as const, location: 'Salt Lake City, UT', commPref: 'Email', notes: 'Strong technical knowledge. Prefers detailed spec sheets over marketing collateral.', linkedin: 'linkedin.com/in/james-thornton-se' },
          { id: 'tel-3', name: 'Rachael Nguyen', title: 'Partner Success Lead', role: 'Channel Manager', email: 'r.nguyen@telarus.com', phone: '(801) 555-1104', lastContact: '2026-04-01', introsQTD: 12, introsAllTime: 63, revenueAttributed: 215000, responsiveness: 'Fast' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Top intro source this quarter — asked to co-host a webinar', signalType: 'positive' as const, location: 'Austin, TX', commPref: 'Slack', notes: 'Our #1 champion at Telarus. Drives more intros than anyone. Nominated us for Supplier of the Year.', linkedin: 'linkedin.com/in/rachael-nguyen' },
        ],
      },
      {
        name: 'Avant',
        logo: '🟧',
        description: 'Leading channel platform for IT decision making',
        contacts: [
          { id: 'av-1', name: 'Derek Paulson', title: 'Channel Account Manager', role: 'Channel Manager', email: 'd.paulson@avant.com', phone: '(312) 555-6678', lastContact: '2026-03-31', introsQTD: 10, introsAllTime: 52, revenueAttributed: 178000, responsiveness: 'Fast' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Pushing Aptum for 2 net-new enterprise accounts this month', signalType: 'positive' as const, location: 'Chicago, IL', commPref: 'Email', notes: 'Very results-driven. Responds well to SPIFs and incentive programs. Always hits his intro targets.', linkedin: 'linkedin.com/in/derek-paulson' },
          { id: 'av-2', name: 'Monica Reeves', title: 'Solutions Architect', role: 'Sales Engineer', email: 'm.reeves@avant.com', phone: '(312) 555-2241', lastContact: '2026-03-28', introsQTD: 6, introsAllTime: 28, revenueAttributed: 95000, responsiveness: 'Moderate' as const, sentiment: 'Neutral' as const, engagement: 'Medium' as const, signal: 'Joined a competitor webinar last week — monitor for mindshare drift', signalType: 'warning' as const, location: 'Chicago, IL', commPref: 'Email', notes: 'Great technical depth. Helps close complex deals. Schedules are tight — book 2 weeks ahead.', linkedin: 'linkedin.com/in/monica-reeves-sa' },
        ],
      },
      {
        name: 'Bridgepointe',
        logo: '🟩',
        description: 'Technology advisory and distribution platform',
        contacts: [
          { id: 'bp-1', name: 'Kevin Marsh', title: 'VP Channel Partnerships', role: 'Leadership', email: 'k.marsh@bridgepointe.com', phone: '(925) 555-8812', lastContact: '2026-03-22', introsQTD: 4, introsAllTime: 19, revenueAttributed: 67000, responsiveness: 'Slow' as const, sentiment: 'Cool' as const, engagement: 'Low' as const, signal: 'Hasn\'t responded to last 2 emails — relationship cooling', signalType: 'warning' as const, location: 'San Ramon, CA', commPref: 'Phone', notes: 'C-level relationship — strategic but hard to reach. Best approached through Alicia first.', linkedin: 'linkedin.com/in/kevin-marsh-bp' },
          { id: 'bp-2', name: 'Alicia Tran', title: 'Partner Development Rep', role: 'PDM/SPDM', email: 'a.tran@bridgepointe.com', phone: '(925) 555-3350', lastContact: '2026-03-27', introsQTD: 7, introsAllTime: 34, revenueAttributed: 112000, responsiveness: 'Fast' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Scheduled joint training session for advisors next week', signalType: 'positive' as const, location: 'San Ramon, CA', commPref: 'Slack', notes: 'Day-to-day contact at Bridgepointe. Very organized. Keeps detailed notes on advisor preferences.', linkedin: 'linkedin.com/in/alicia-tran' },
        ],
      },
      {
        name: 'Intelisys',
        logo: '🟪',
        description: 'Telecommunications master agent and solutions distributor',
        contacts: [
          { id: 'in-1', name: 'Robert Cianci', title: 'Channel Director', role: 'Leadership', email: 'r.cianci@intelisys.com', phone: '(203) 555-9901', lastContact: '2026-03-30', introsQTD: 9, introsAllTime: 41, revenueAttributed: 156000, responsiveness: 'Moderate' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Invited us to Intelisys supplier summit — keynote opportunity', signalType: 'positive' as const, location: 'Petaluma, CA', commPref: 'Phone', notes: 'Senior leader with strong influence. Sets strategic direction for which suppliers get prioritized.', linkedin: 'linkedin.com/in/robert-cianci' },
          { id: 'in-2', name: 'Patricia Dunn', title: 'Sales Engineer', role: 'Sales Engineer', email: 'p.dunn@intelisys.com', phone: '(203) 555-4478', lastContact: '2026-03-18', introsQTD: 3, introsAllTime: 22, revenueAttributed: 71000, responsiveness: 'Slow' as const, sentiment: 'Neutral' as const, engagement: 'Low' as const, signal: 'Low intro volume — may need enablement refresh on our solutions', signalType: 'info' as const, location: 'Milford, CT', commPref: 'Email', notes: 'Technically capable but not proactive. Needs regular check-ins to stay engaged.', linkedin: 'linkedin.com/in/patricia-dunn-intelisys' },
          { id: 'in-3', name: 'Tyler Washington', title: 'Partner Enablement Manager', role: 'Channel Manager', email: 't.washington@intelisys.com', phone: '(203) 555-6632', lastContact: '2026-04-01', introsQTD: 11, introsAllTime: 55, revenueAttributed: 198000, responsiveness: 'Fast' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Created custom Aptum battlecard for advisors — high advocacy', signalType: 'positive' as const, location: 'Petaluma, CA', commPref: 'Slack', notes: 'Enablement-focused. Loves co-branded content. Great at arming advisors with our talking points.', linkedin: 'linkedin.com/in/tyler-washington' },
        ],
      },
      {
        name: 'AppDirect',
        logo: '🔵',
        description: 'B2B subscription commerce platform and marketplace',
        contacts: [
          { id: 'ad-1', name: 'Yuki Tanaka', title: 'Partner Growth Manager', role: 'Channel Manager', email: 'y.tanaka@appdirect.com', phone: '(415) 555-7723', lastContact: '2026-03-26', introsQTD: 6, introsAllTime: 25, revenueAttributed: 83000, responsiveness: 'Moderate' as const, sentiment: 'Neutral' as const, engagement: 'Medium' as const, signal: 'Requested updated pricing matrix — potential deal in pipeline', signalType: 'info' as const, location: 'San Francisco, CA', commPref: 'Email', notes: 'Newer relationship. Methodical and data-driven. Appreciates ROI-focused messaging.', linkedin: 'linkedin.com/in/yuki-tanaka-ad' },
          { id: 'ad-2', name: 'Chris Brennan', title: 'Solutions Consultant', role: 'Sales Engineer', email: 'c.brennan@appdirect.com', phone: '(415) 555-1198', lastContact: '2026-03-20', introsQTD: 2, introsAllTime: 14, revenueAttributed: 45000, responsiveness: 'Slow' as const, sentiment: 'Cool' as const, engagement: 'Low' as const, signal: 'Engagement dropping — last meeting was cancelled twice', signalType: 'warning' as const, location: 'San Francisco, CA', commPref: 'Phone', notes: 'Was more engaged 6 months ago. May be shifting focus to other suppliers. Needs re-engagement.', linkedin: 'linkedin.com/in/chris-brennan' },
        ],
      },
    ];

    // Assign partners to TSD companies deterministically
    const tsdNames = companies.map(c => c.name);
    const partnersByTsd: Record<string, typeof advisorsWithDeals> = {};
    tsdNames.forEach(n => { partnersByTsd[n] = []; });
    advisorsWithDeals.forEach(a => {
      const idx = Math.floor(seededRandom(a.id + '-tsd') * tsdNames.length);
      const secondIdx = Math.floor(seededRandom(a.id + '-tsd2') * tsdNames.length);
      partnersByTsd[tsdNames[idx]].push(a);
      if (secondIdx !== idx && seededRandom(a.id + '-tsd-dual') > 0.6) {
        partnersByTsd[tsdNames[secondIdx]].push(a);
      }
    });

    return companies.map(c => {
      // Apply saved overrides from localStorage to TSD contacts
      const contactsWithOverrides = c.contacts.map(ct => {
        const overrides = tsdContactOverrides[ct.id];
        return overrides ? { ...ct, ...overrides } : ct;
      });
      const partners = partnersByTsd[c.name] || [];
      const revenue = partners.reduce((s, p) => s + p.mrr, 0);
      const totalIntrosQTD = contactsWithOverrides.reduce((s, ct) => s + ct.introsQTD, 0);
      const totalIntrosAllTime = contactsWithOverrides.reduce((s, ct) => s + ct.introsAllTime, 0);
      const totalRevenueAttributed = contactsWithOverrides.reduce((s, ct) => s + ct.revenueAttributed, 0);
      return { ...c, contacts: contactsWithOverrides, partners, revenue, totalIntrosQTD, totalIntrosAllTime, totalRevenueAttributed, introTarget: 8 };
    });
  }, [advisorsWithDeals, seededRandom, tsdContactOverrides]);

  // Co-marketing opportunity detection
  const coMarketingOpportunities = useMemo(() => {
    const opps: Array<{ advisor: Advisor; reason: string; type: string }> = [];
    advisorsWithDeals.forEach(a => {
      if (a.pulse === 'Strong' && a.tier === 'anchor') {
        opps.push({ advisor: a, reason: `${a.name} is an Anchor partner with strong engagement — ideal co-marketing candidate`, type: 'High-Value Amplification' });
      }
      if (a.trajectory === 'Accelerating' || a.trajectory === 'Climbing') {
        const advisorDeals = deals.filter(d => d.advisorId === a.id && d.stage === 'Closed Won');
        if (advisorDeals.length >= 2) {
          opps.push({ advisor: a, reason: `${a.name} is on an upward trajectory with ${advisorDeals.length} closed deals — prime for case study`, type: 'Success Story' });
        }
      }
    });
    return opps.slice(0, 5);
  }, [advisorsWithDeals, deals]);

  // Quotes vs Sold per partner
  const quotesVsSold = useMemo(() => {
    return advisorsWithDeals.map(a => {
      const advisorDeals = deals.filter(d => d.advisorId === a.id);
      const totalQuotes = advisorDeals.length;
      const soldDeals = advisorDeals.filter(d => d.stage === 'Closed Won').length;
      // Mock quarterly breakdown with seeded random
      const q1Quotes = Math.max(0, Math.floor(seededRandom(`${a.id}-q1q`) * totalQuotes * 0.6));
      const q1Sold = Math.max(0, Math.floor(seededRandom(`${a.id}-q1s`) * soldDeals * 0.5));
      const q2Quotes = totalQuotes - q1Quotes;
      const q2Sold = soldDeals - q1Sold;
      return {
        ...a,
        totalQuotes,
        soldDeals,
        closeRate: totalQuotes > 0 ? (soldDeals / totalQuotes * 100) : 0,
        q1: { quotes: q1Quotes, sold: q1Sold },
        q2: { quotes: q2Quotes, sold: q2Sold },
      };
    }).filter(a => a.totalQuotes > 0).sort((a, b) => b.totalQuotes - a.totalQuotes);
  }, [advisorsWithDeals, deals]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F5F2]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#157A6E] mx-auto mb-3" />
          <p className="text-13px text-gray-500 font-['Inter']">Loading live data...</p>
        </div>
      </div>
    );
  }

  if (advisors.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F5F2]">
        <div className="text-center max-w-md">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold font-['Newsreader'] text-gray-800 mb-2">No Live Data Yet</h2>
          <p className="text-13px text-gray-500 font-['Inter'] mb-4">
            Add advisors, deals, and notes in the admin panel to populate the live dashboard.
          </p>
          <a href="/live" className="inline-flex items-center gap-2 px-4 py-2 bg-[#157A6E] text-white rounded-lg text-13px font-medium hover:bg-[#125f56]">
            Go to Admin Panel
          </a>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════
  // COMMAND CENTER
  // ════════════════════════════════════════════════

  const renderCommandCenter = () => {
    const getDaysSinceContact = (lastContactDate: string): number => {
      const last = new Date(lastContactDate);
      const now = new Date();
      return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    };

    // ── Build today's action list from real data ──
    type TodayAction = { id: string; title: string; context: string; tag: string; type: 'critical' | 'playbook' | 'cadence' | 'deals'; advisorId?: string; mrrImpact: number; impactType: 'risk' | 'pipeline' | 'growth' };
    const todayActions: TodayAction[] = [];

    // Critical: at-risk advisors
    atRiskAdvisors.forEach(a => {
      todayActions.push({ id: `risk-${a.id}`, title: `Reach out to ${a.name}`, context: `${a.trajectory} trajectory · ${a.friction} friction · Last contact ${getDaysSinceContact(a.lastContact)}d ago`, tag: 'Win-Back', type: 'critical', advisorId: a.id, mrrImpact: a.mrr, impactType: 'risk' });
    });

    // Critical: stalled deals
    stalledDeals.forEach(d => {
      const adv = advisors.find(a => a.id === d.advisorId);
      todayActions.push({ id: `stall-${d.id}`, title: `Unstall: ${d.name}`, context: `${adv?.name || 'Unknown'} · Stuck in ${d.stage} for ${d.daysInStage} days · ${formatCurrency(d.mrr)} MRR`, tag: 'Deal Stall', type: 'deals', advisorId: adv?.id, mrrImpact: d.mrr, impactType: 'pipeline' });
    });

    // Playbook: next step for each launched playbook
    launchedPlaybooks.forEach(pb => {
      const tmplSteps = pb.customSteps || playbookTemplates.find(t => t.id === pb.templateId)?.steps;
      if (!tmplSteps || tmplSteps.length === 0) return;
      const nextIdx = tmplSteps.findIndex((_, idx) => !pb.completedSteps.includes(idx) && !pb.skippedSteps.includes(idx));
      if (nextIdx === -1) return;
      const step = tmplSteps[nextIdx];
      const pbName = pb.playbookName || playbookTemplates.find(t => t.id === pb.templateId)?.title || pb.templateId.replace('-', ' ');
      const totalSteps = tmplSteps.length;
      const completedCount = pb.completedSteps.length;
      const stepNumber = nextIdx + 1;
      todayActions.push({ id: `pb-${pb.templateId}-${pb.advisorId}`, title: `${step.label}`, context: `${pb.advisorName} · ${pbName} (step ${stepNumber}/${totalSteps}) · ${step.desc}`, tag: pbName, type: 'playbook', advisorId: pb.advisorId, mrrImpact: advisors.find(a => a.id === pb.advisorId)?.mrr || 0, impactType: 'growth' });
    });

    // Cadence: overdue contacts by tier
    const anchorOverdue = advisors.filter(a => a.tier === 'anchor' && getDaysSinceContact(a.lastContact) > 7);
    const scalingOverdue = advisors.filter(a => a.tier === 'scaling' && getDaysSinceContact(a.lastContact) > 14);
    const buildingOverdue = advisors.filter(a => a.tier === 'building' && getDaysSinceContact(a.lastContact) > 21);
    const launchingOverdue = advisors.filter(a => a.tier === 'launching' && getDaysSinceContact(a.lastContact) > 10);
    [...anchorOverdue, ...scalingOverdue, ...buildingOverdue, ...launchingOverdue].forEach(a => {
      if (todayActions.some(act => act.advisorId === a.id)) return; // don't duplicate
      todayActions.push({ id: `cadence-${a.id}`, title: `Check in with ${a.name}`, context: `${a.tier === 'anchor' ? 'Anchor' : a.tier === 'scaling' ? 'Scaling' : a.tier === 'building' ? 'Building' : 'Launching'} · Last contact ${getDaysSinceContact(a.lastContact)} days ago · ${a.tier === 'anchor' ? 'Weekly' : a.tier === 'scaling' ? 'Bi-weekly' : a.tier === 'building' ? 'Every 3 weeks' : '10-day'} cadence overdue`, tag: 'Cadence', type: 'cadence', advisorId: a.id, mrrImpact: a.mrr, impactType: 'growth' });
    });

    // Group rule cadence actions
    contactGroups.forEach(group => {
      if (!group.rules?.cadenceDays || !group.rules?.autoActions) return;
      group.advisorIds.forEach(advId => {
        const a = advisors.find(adv => adv.id === advId);
        if (!a || todayActions.some(act => act.advisorId === a.id)) return;
        const daysSince = getDaysSinceContact(a.lastContact);
        if (daysSince > group.rules!.cadenceDays!) {
          todayActions.push({ id: `grp-${group.id}-${a.id}`, title: `${group.name}: Reach out to ${a.name}`, context: `Group rule: every ${group.rules!.cadenceDays}d · Last contact ${daysSince}d ago`, tag: group.name, type: 'cadence', advisorId: a.id, mrrImpact: a.mrr, impactType: 'growth' });
        }
      });
    });

    // Growth: accelerating/climbing advisors not already in actions
    advisors.filter(a => (a.trajectory === 'Accelerating' || a.trajectory === 'Climbing') && !todayActions.some(act => act.advisorId === a.id)).forEach(a => {
      todayActions.push({ id: `growth-${a.id}`, title: `Explore expansion: ${a.name}`, context: `${a.trajectory} trajectory · ${a.pulse} pulse · Cross-sell or tier upgrade opportunity`, tag: 'Growth', type: 'deals', advisorId: a.id, mrrImpact: a.mrr, impactType: 'growth' });
    });

    // Filter + sort
    const filteredActions = actionFilter === 'all' ? todayActions : todayActions.filter(a => a.type === actionFilter);
    const activeActions = filteredActions.filter(a => !completedActions.includes(a.id));
    const doneActions = filteredActions.filter(a => completedActions.includes(a.id));
    const criticalCount = todayActions.filter(a => a.type === 'critical').length;

    // Priority vs Deadline split
    const priorityActions = todayActions.filter(a => a.type === 'critical' || a.type === 'playbook');
    const deadlineActions = todayActions.filter(a => a.type === 'cadence' || a.type === 'deals');

    // ── Portfolio snapshot data ──
    const frictionCritical = advisors.filter(a => a.friction === 'Critical').length;
    const frictionHigh = advisors.filter(a => a.friction === 'High').length;
    const healthy = advisors.filter(a => a.friction === 'Low' && (a.pulse === 'Strong' || a.pulse === 'Steady')).length;
    const tierCounts = {
      anchor: advisors.filter(a => a.tier === 'anchor').length,
      scaling: advisors.filter(a => a.tier === 'scaling').length,
      building: advisors.filter(a => a.tier === 'building').length,
      launching: advisors.filter(a => a.tier === 'launching').length,
    };

    // Cadence compliance
    const cadenceData = (['anchor', 'scaling', 'building', 'launching'] as const).map(tier => {
      const tierAdvs = advisors.filter(a => a.tier === tier);
      const threshold = tier === 'anchor' ? 7 : tier === 'scaling' ? 14 : tier === 'building' ? 21 : 10;
      const onPace = tierAdvs.filter(a => getDaysSinceContact(a.lastContact) <= threshold).length;
      return { tier, total: tierAdvs.length, onPace, pct: tierAdvs.length > 0 ? Math.round((onPace / tierAdvs.length) * 100) : 100 };
    });

    const tagColor = (type: string) => {
      switch (type) {
        case 'critical': return 'bg-red-100 text-red-800';
        case 'playbook': return 'bg-[#D1FAE5] text-[#065F46]';
        case 'cadence': return 'bg-blue-100 text-blue-800';
        case 'deals': return 'bg-amber-100 text-amber-800';
        default: return 'bg-gray-100 text-gray-600';
      }
    };

    return (
      <div className="space-y-5">
        {/* ── PORTFOLIO SNAPSHOT ── */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Portfolio MRR</div>
            <div className="text-[20px] font-bold text-gray-800 mt-1 font-['Newsreader']">{formatCurrency(totalMRR)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{advisors.length} partners</div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Active Pipeline</div>
            <div className="text-[20px] font-bold text-[#157A6E] mt-1 font-['Newsreader']">{formatCurrency(pipelineMRR)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{activePipeline.length} deals</div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">At-Risk MRR</div>
            <div className={`text-[20px] font-bold mt-1 font-['Newsreader'] ${atRiskAdvisors.length > 0 ? 'text-red-500' : 'text-gray-800'}`}>{formatCurrency(atRiskMRR)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{atRiskAdvisors.length} partners</div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Closed Won QTD</div>
            <div className="text-[20px] font-bold text-[#157A6E] mt-1 font-['Newsreader']">{formatCurrency(closedWonMRR)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{closedWonDeals.length} deals</div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Partner Health</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-[20px] font-bold text-[#157A6E] font-['Newsreader']">{healthy}</span>
              <span className="text-[11px] text-gray-400">healthy</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{frictionCritical > 0 ? `${frictionCritical} critical · ` : ''}{frictionHigh > 0 ? `${frictionHigh} high friction` : 'No friction issues'}</div>
          </div>
        </div>

        {/* ── ADVISOR HEALTH AT A GLANCE ── */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[1.5px] text-gray-500">Advisor Snapshot</h3>
            <button onClick={() => setActiveView('relationships')} className="text-[10px] text-[#157A6E] font-semibold hover:underline">View all →</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Top partners by MRR */}
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Top Partners</div>
              <div className="space-y-1.5">
                {[...advisors].sort((a, b) => b.mrr - a.mrr).slice(0, 6).map(a => (
                  <div key={a.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}>
                    <div className={`w-2 h-2 rounded-sm shrink-0 ${a.tier === 'anchor' ? 'bg-[#157A6E]' : a.tier === 'scaling' ? 'bg-amber-400' : a.tier === 'building' ? 'bg-gray-400' : 'bg-blue-400'}`} />
                    <span className="text-[12px] font-medium text-gray-800 flex-1 truncate">{a.name}</span>
                    <PulseBadge pulse={a.pulse} />
                    <span className="text-[11px] font-bold text-gray-700 tabular-nums">{formatCurrency(a.mrr)}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Needs attention */}
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Needs Attention</div>
              {advisors.filter(a => a.friction === 'Critical' || a.friction === 'High' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall').length > 0 ? (
                <div className="space-y-1.5">
                  {advisors.filter(a => a.friction === 'Critical' || a.friction === 'High' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall').slice(0, 6).map(a => (
                    <div key={a.id} className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${a.friction === 'Critical' ? 'bg-red-50 hover:bg-red-100' : 'bg-amber-50 hover:bg-amber-100'}`} onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}>
                      <AlertTriangle className={`w-3 h-3 shrink-0 ${a.friction === 'Critical' ? 'text-red-500' : 'text-amber-500'}`} />
                      <span className="text-[12px] font-medium text-gray-800 flex-1 truncate">{a.name}</span>
                      <FrictionBadge level={a.friction} />
                      <span className="text-[11px] font-bold text-gray-700 tabular-nums">{formatCurrency(a.mrr)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic py-2">All partners healthy</p>
              )}
            </div>
          </div>

          {/* Tier distribution + cadence compliance inline */}
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
            {(['anchor', 'scaling', 'building', 'launching'] as const).map(tier => {
              const cd = cadenceData.find(c => c.tier === tier);
              return (
                <div key={tier} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
                  <div className={`w-3 h-3 rounded-sm ${tier === 'anchor' ? 'bg-[#157A6E]' : tier === 'scaling' ? 'bg-amber-400' : tier === 'building' ? 'bg-gray-400' : 'bg-blue-400'}`} />
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold text-gray-700 capitalize">{tier}</div>
                    <div className="text-[10px] text-gray-500">{tierCounts[tier]} partners</div>
                  </div>
                  {cd && tier !== 'launching' && (
                    <div className={`text-[11px] font-bold ${cd.pct >= 80 ? 'text-[#157A6E]' : cd.pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {cd.pct}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FLATLINED ADVISORS ── */}
        {stalledAdvisorIds.length > 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[1.5px] text-gray-500">Flatlined Advisors</h3>
              <span className="text-[10px] text-gray-400">{stalledAdvisorIds.length} paused · Quarterly reignition cadence</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {advisors.filter(a => stalledAdvisorIds.includes(a.id)).map(a => (
                <div key={a.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-semibold text-gray-800">{a.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{a.company} · {formatCurrency(a.mrr)}</div>
                  </div>
                  <button
                    onClick={() => reigniteAdvisor(a.id)}
                    className="px-2 py-1 text-[10px] font-semibold text-[#157A6E] border border-[#157A6E] rounded hover:bg-teal-50 transition-colors"
                  >
                    Reignite
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TODAY'S ACTIONS ── */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Today&apos;s Actions</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
          <span className="text-[12px] font-semibold text-gray-500">{activeActions.length} remaining</span>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Priority Actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <h3 className="text-[12px] font-bold text-gray-700">Priority Actions</h3>
              <span className="text-[10px] text-gray-400 ml-auto">{priorityActions.length} items</span>
            </div>
            <div className="space-y-2">
              {(showAllPriority ? priorityActions : priorityActions.slice(0, 5)).filter(a => !completedActions.includes(a.id)).map(action => {
                const advisor = action.advisorId ? advisors.find(a => a.id === action.advisorId) : null;
                return (
                  <div key={action.id} className={`bg-white rounded-[10px] border border-[#e8e5e1] p-3.5 transition-all hover:shadow-sm ${action.type === 'critical' ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-[#157A6E]'}`}>
                    <div className="flex items-start gap-2.5">
                      <button onClick={() => setCompletedActions(prev => [...prev, action.id])}
                        className="w-4.5 h-4.5 rounded border-2 border-gray-300 hover:border-[#157A6E] flex items-center justify-center shrink-0 mt-0.5 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${action.type === 'critical' ? 'bg-red-100 text-red-800' : 'bg-[#D1FAE5] text-[#065F46]'}`}>{action.tag}</span>
                        </div>
                        <p className="text-[12px] font-semibold text-gray-800 leading-snug">{action.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{action.context}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-[13px] font-bold ${action.impactType === 'risk' ? 'text-red-500' : 'text-[#157A6E]'}`}>
                          {formatCurrency(action.mrrImpact)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {priorityActions.filter(a => !completedActions.includes(a.id)).length > 5 && !showAllPriority && (
                <button onClick={() => setShowAllPriority(true)} className="w-full py-2 text-[11px] font-semibold text-[#157A6E] hover:bg-teal-50 rounded-lg transition-colors">
                  Show {priorityActions.filter(a => !completedActions.includes(a.id)).length - 5} more →
                </button>
              )}
              {priorityActions.filter(a => !completedActions.includes(a.id)).length === 0 && (
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6 text-center">
                  <CheckCircle className="w-6 h-6 text-[#157A6E] mx-auto mb-1" />
                  <p className="text-[11px] text-gray-500">All clear</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <h3 className="text-[12px] font-bold text-gray-700">Upcoming Deadlines</h3>
              <span className="text-[10px] text-gray-400 ml-auto">{deadlineActions.length} items</span>
            </div>
            <div className="space-y-2">
              {(showAllDeadlines ? deadlineActions : deadlineActions.slice(0, 5)).filter(a => !completedActions.includes(a.id)).map(action => {
                const advisor = action.advisorId ? advisors.find(a => a.id === action.advisorId) : null;
                return (
                  <div key={action.id} className="bg-white rounded-[10px] border border-[#e8e5e1] p-3.5 transition-all hover:shadow-sm border-l-4 border-l-amber-300">
                    <div className="flex items-start gap-2.5">
                      <button onClick={() => setCompletedActions(prev => [...prev, action.id])}
                        className="w-4.5 h-4.5 rounded border-2 border-gray-300 hover:border-[#157A6E] flex items-center justify-center shrink-0 mt-0.5 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${action.type === 'cadence' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{action.tag}</span>
                        </div>
                        <p className="text-[12px] font-semibold text-gray-800 leading-snug">{action.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{action.context}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[13px] font-bold text-amber-600">{formatCurrency(action.mrrImpact)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {deadlineActions.filter(a => !completedActions.includes(a.id)).length > 5 && !showAllDeadlines && (
                <button onClick={() => setShowAllDeadlines(true)} className="w-full py-2 text-[11px] font-semibold text-[#157A6E] hover:bg-teal-50 rounded-lg transition-colors">
                  Show {deadlineActions.filter(a => !completedActions.includes(a.id)).length - 5} more →
                </button>
              )}
              {deadlineActions.filter(a => !completedActions.includes(a.id)).length === 0 && (
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6 text-center">
                  <CheckCircle className="w-6 h-6 text-[#157A6E] mx-auto mb-1" />
                  <p className="text-[11px] text-gray-500">All clear</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completed actions */}
        {doneActions.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-400 whitespace-nowrap">Completed ({doneActions.length})</span>
              <div className="flex-1 h-px bg-[#e8e5e1]" />
            </div>
            <div className="space-y-1.5">
              {doneActions.map(action => (
                <div key={action.id} className="bg-gray-50 rounded-[10px] border border-gray-100 p-3 flex items-center gap-3 opacity-60">
                  <button onClick={() => setCompletedActions(prev => prev.filter(id => id !== action.id))}
                    className="w-5 h-5 rounded bg-[#157A6E] flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </button>
                  <span className="text-[12px] text-gray-500 line-through flex-1">{action.title}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PIPELINE + PLAYBOOK STATUS ── */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pipeline by Stage (compact) */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[1.5px] text-gray-500">Pipeline by Stage</h3>
              <button onClick={() => setActiveView('pipeline')} className="text-[10px] text-[#157A6E] font-semibold hover:underline">Full pipeline →</button>
            </div>
            <div className="space-y-2">
              {stageDistribution.filter(s => s.count > 0 && s.stage !== 'Closed Won').map(s => {
                const colors: Record<string, string> = { Discovery: '#3B82F6', Qualifying: '#06B6D4', Proposal: '#8B5CF6', Negotiating: '#F59E0B', Stalled: '#EF4444' };
                return (
                  <div key={s.stage} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: colors[s.stage] || '#9CA3AF' }} />
                    <span className="text-[11px] font-medium text-gray-700 w-24">{s.stage}</span>
                    <div className="flex-1 h-[5px] bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(s.mrr / maxStageMRR) * 100}%`, backgroundColor: colors[s.stage] || '#9CA3AF' }} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 tabular-nums w-16 text-right">{formatCurrency(s.mrr)}</span>
                    <span className="text-[10px] text-gray-400 w-4 text-right">{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Playbooks (compact) */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[1.5px] text-gray-500">Active Playbooks</h3>
              <button onClick={() => { setActiveView('intelligence'); setIntelligenceSubTab('playbooks'); }} className="text-[10px] text-[#157A6E] font-semibold hover:underline">Manage →</button>
            </div>
            {launchedPlaybooks.length > 0 ? (
              <div className="space-y-3">
                {launchedPlaybooks.slice(0, 4).map((pb, idx) => {
                  const tmplSteps = pb.customSteps || [];
                  const effective = tmplSteps.length - pb.skippedSteps.length;
                  const pct = effective > 0 ? Math.round((pb.completedSteps.length / effective) * 100) : 100;
                  const advisor = advisors.find(a => a.id === pb.advisorId);
                  return (
                    <div key={idx} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors" onClick={() => { setActiveView('intelligence'); setIntelligenceSubTab('playbooks'); setEditingPlaybookIdx(idx); }}>
                      <div className={`w-2 h-full min-h-[32px] rounded-full shrink-0 ${pb.priority === 'critical' ? 'bg-red-400' : pb.priority === 'high' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-gray-800 truncate">{pb.playbookName || playbookTemplates.find(t => t.id === pb.templateId)?.title || pb.templateId.replace('-', ' ')} — <button onClick={(e) => { e.stopPropagation(); const adv = advisors.find(a => a.id === pb.advisorId); if (adv) { setSelectedAdvisor(adv); setPanelOpen(true); } }} className="text-[#157A6E] hover:underline">{pb.advisorName}</button></div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-[4px] bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-[#157A6E]">{pct}%</span>
                        </div>
                      </div>
                      {advisor && <span className="text-[10px] text-gray-400 shrink-0">{formatCurrency(advisor.mrr)}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <PlayCircle className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                <p className="text-[11px] text-gray-400">No active playbooks</p>
                <button onClick={() => { setActiveView('intelligence'); setIntelligenceSubTab('playbooks'); }} className="text-[10px] text-[#157A6E] font-semibold mt-1 hover:underline">Assign one →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════
  // RELATIONSHIPS (with sub-tabs: Partners, TSDs, White Space)
  // ════════════════════════════════════════════════
  const renderRelationships = () => {
    // Relationship Stage types (new channel-appropriate categories)
    const relationshipStages = ['Prospect', 'Onboarding', 'Activated', 'Scaling', 'Strategic'];
    const getRelationshipStage = (advisor: Advisor): string => {
      if ((advisor as any).relationshipStage) return (advisor as any).relationshipStage;
      const stages = ['Prospect', 'Onboarding', 'Activated', 'Scaling', 'Strategic'];
      const idx = Math.floor(seededRandom(advisor.id + '-stage') * stages.length);
      return stages[idx];
    };

    // New engagement level filters
    const engagementSegments = [
      { label: 'All Partners', key: 'All', count: advisorsWithDeals.length },
      {
        label: 'Revenue Producing',
        key: 'Revenue Producing',
        count: advisorsWithDeals.filter(a => deals.some(d => d.advisorId === a.id)).length,
      },
      {
        label: 'High Engagement',
        key: 'High Engagement',
        count: advisorsWithDeals.filter(a => a.pulse === 'Strong' || a.pulse === 'Steady').length,
      },
      {
        label: 'Anchor & Scaling',
        key: 'Anchor & Scaling',
        count: advisorsWithDeals.filter(a => a.tier === 'anchor' || a.tier === 'scaling').length,
      },
      {
        label: 'Needs Attention',
        key: 'Needs Attention',
        count: advisorsWithDeals.filter(a =>
          a.friction === 'High' || a.friction === 'Critical' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall'
        ).length,
      },
      {
        label: 'New / Onboarding',
        key: 'New / Onboarding',
        count: advisorsWithDeals.filter(a => getRelationshipStage(a) === 'Onboarding').length,
      },
      { label: 'Anchor', key: 'Anchor', count: advisorsWithDeals.filter(a => a.tier === 'anchor').length },
      { label: 'Scaling', key: 'Scaling', count: advisorsWithDeals.filter(a => a.tier === 'scaling').length },
      { label: 'Building', key: 'Building', count: advisorsWithDeals.filter(a => a.tier === 'building').length },
      { label: 'Launching', key: 'Launching', count: advisorsWithDeals.filter(a => a.tier === 'launching').length },
    ];

    // Filtering logic for partners
    let filteredAdvisors = [...advisorsWithDeals];
    if (relationshipFilter === 'Revenue Producing') {
      filteredAdvisors = advisorsWithDeals.filter(a => deals.some(d => d.advisorId === a.id));
    } else if (relationshipFilter === 'High Engagement') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.pulse === 'Strong' || a.pulse === 'Steady');
    } else if (relationshipFilter === 'Anchor & Scaling') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.tier === 'anchor' || a.tier === 'scaling');
    } else if (relationshipFilter === 'Needs Attention') {
      filteredAdvisors = advisorsWithDeals.filter(a =>
        a.friction === 'High' || a.friction === 'Critical' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall'
      );
    } else if (relationshipFilter === 'New / Onboarding') {
      filteredAdvisors = advisorsWithDeals.filter(a => getRelationshipStage(a) === 'Onboarding');
    } else if (relationshipFilter === 'Anchor') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.tier === 'anchor');
    } else if (relationshipFilter === 'Scaling') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.tier === 'scaling');
    } else if (relationshipFilter === 'Building') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.tier === 'building');
    } else if (relationshipFilter === 'Launching') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.tier === 'launching');
    }

    // Apply city filter from map
    if (territoryFilter) {
      filteredAdvisors = filteredAdvisors.filter(a => a.location?.trim() === territoryFilter);
    }

    // Apply company filter
    if (companyFilter) {
      filteredAdvisors = filteredAdvisors.filter(a => a.company === companyFilter);
    }

    // Apply stage filter
    if (stageFilter !== 'All') {
      filteredAdvisors = filteredAdvisors.filter(a => getRelationshipStage(a) === stageFilter);
    }

    // Apply search filter (searches name, company, location)
    if (partnerSearch.trim()) {
      const q = partnerSearch.toLowerCase();
      filteredAdvisors = filteredAdvisors.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.company?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q) ||
        a.title?.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    const sortedAdvisors = [...filteredAdvisors].sort((a, b) => {
      if (relationshipSort === 'mrr') return b.mrr - a.mrr;
      if (relationshipSort === 'lastContact') {
        const dateA = new Date(a.lastContact).getTime();
        const dateB = new Date(b.lastContact).getTime();
        return dateB - dateA;
      }
      return a.name.localeCompare(b.name);
    });

    const getDaysSinceContact = (lastContactDate: string): number => {
      const last = new Date(lastContactDate);
      const now = new Date();
      return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getLastContactColor = (days: number): string => {
      if (days < 3) return 'text-green-600';
      if (days < 7) return 'text-yellow-600';
      return 'text-red-500';
    };

    // White space data per advisor
    const whiteSpaceData = advisorsWithDeals.map(advisor => {
      const advisorDeals = deals.filter(d => d.advisorId === advisor.id);
      const soldProducts = new Set(advisorDeals.map(d => d.name.split(' ')[0]).filter(p => SERVICE_CATALOG.includes(p)));
      const opportunityProducts = SERVICE_CATALOG.filter(p => !soldProducts.has(p));
      const crossSellScore = (soldProducts.size / SERVICE_CATALOG.length) * 100;
      return {
        ...advisor,
        soldProducts: Array.from(soldProducts),
        opportunityProducts,
        crossSellScore,
        opportunityMRR: opportunityProducts.reduce((sum, p) => sum + (2000 + seededRandom(`${advisor.id}-${p}`) * 6000), 0),
      };
    });

    const handleCityClick = (city: string) => {
      setTerritoryFilter(prev => prev === city ? null : city);
    };

    // Calculate per-state heat data for weather-map style heat map
    const stateHeatData: Record<string, { score: number; partners: number; mrr: number; pipeline: number; deals: number }> = {};
    advisorsWithDeals.forEach(a => {
      // Extract state abbreviation from location like "Boston, MA"
      const match = a.location?.match(/,\s*([A-Z]{2})$/);
      if (!match) return;
      const stateAbbr = match[1];
      if (!stateHeatData[stateAbbr]) stateHeatData[stateAbbr] = { score: 0, partners: 0, mrr: 0, pipeline: 0, deals: 0 };
      stateHeatData[stateAbbr].partners += 1;
      stateHeatData[stateAbbr].mrr += a.mrr;
      const advisorDeals = deals.filter(d => d.advisorId === a.id);
      stateHeatData[stateAbbr].deals += advisorDeals.length;
      stateHeatData[stateAbbr].pipeline += advisorDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled').reduce((s, d) => s + d.mrr, 0);
    });
    // Compute performance score for each state (0-1 based on pulse, trajectory, friction)
    const maxStateMRR = Math.max(...Object.values(stateHeatData).map(s => s.mrr), 1);
    Object.keys(stateHeatData).forEach(abbr => {
      const stateAdvisors = advisorsWithDeals.filter(a => a.location?.endsWith(`, ${abbr}`));
      if (stateAdvisors.length === 0) return;
      const pulseScore: Record<string, number> = { Strong: 1, Steady: 0.7, Rising: 0.8, Fading: 0.3, Flatline: 0.1 };
      const trajScore: Record<string, number> = { Accelerating: 1, Climbing: 0.8, Stable: 0.5, Slipping: 0.2, Freefall: 0 };
      const fricScore: Record<string, number> = { Low: 1, Moderate: 0.6, High: 0.3, Critical: 0 };
      const avgPulse = stateAdvisors.reduce((s, a) => s + (pulseScore[a.pulse] || 0.5), 0) / stateAdvisors.length;
      const avgTraj = stateAdvisors.reduce((s, a) => s + (trajScore[a.trajectory] || 0.5), 0) / stateAdvisors.length;
      const avgFric = stateAdvisors.reduce((s, a) => s + (fricScore[a.friction] || 0.5), 0) / stateAdvisors.length;
      const mrrFactor = stateHeatData[abbr].mrr / maxStateMRR;
      // Weighted composite: 30% pulse, 25% trajectory, 20% friction, 25% revenue
      stateHeatData[abbr].score = Math.min(1, avgPulse * 0.3 + avgTraj * 0.25 + avgFric * 0.2 + mrrFactor * 0.25);
    });

    // Region analysis for territory sub-tab
    const advisorsByRegion: Record<string, typeof advisorsWithDeals> = {};
    advisorsWithDeals.forEach(a => {
      const region = a.location ? regionMapping(a.location) : 'Other';
      if (!advisorsByRegion[region]) advisorsByRegion[region] = [];
      advisorsByRegion[region].push(a);
    });

    const regionAnalysis = Object.entries(advisorsByRegion).map(([region, advs]) => {
      const regionDeals = deals.filter(d => advs.some(a => a.id === d.advisorId));
      const regionMRR = advs.reduce((s, a) => s + a.mrr, 0);
      const regionPipeline = regionDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled').reduce((s, d) => s + d.mrr, 0);
      const closedDeals = regionDeals.filter(d => d.stage === 'Closed Won');
      const avgSold = closedDeals.length > 0 ? closedDeals.reduce((s, d) => s + d.mrr, 0) / closedDeals.length : 0;
      return { region, partners: advs.length, mrr: regionMRR, pipeline: regionPipeline, avgSold, closedCount: closedDeals.length };
    }).sort((a, b) => b.mrr - a.mrr);

    // TSD role categories
    const tsdRoles = ['All', 'Leadership', 'Channel Manager', 'PDM/SPDM', 'Sales Engineer', 'Marketing', 'Ops', 'Other'];

    // Compute Relationship Health for TSD companies
    const getTsdRelationshipHealth = (company: typeof TSD_COMPANIES[0]): { health: string; color: string } => {
      const avgDaysSinceContact = company.contacts.length > 0
        ? company.contacts.reduce((sum, c) => sum + getDaysSinceContact(c.lastContact), 0) / company.contacts.length
        : 0;

      const introTarget = (company as any).introTarget || 8;
      const introsFrequency = company.totalIntrosQTD > introTarget ? 1 : company.totalIntrosQTD > (introTarget / 2) ? 0.5 : 0;
      const recentContact = avgDaysSinceContact < 7 ? 1 : avgDaysSinceContact < 14 ? 0.5 : 0;
      const revenueScale = company.totalRevenueAttributed > 100000 ? 1 : company.totalRevenueAttributed > 50000 ? 0.5 : 0;

      const healthScore = (introsFrequency + recentContact + revenueScale) / 3;
      if (healthScore > 0.75) return { health: 'Excellent', color: '#16A34A' };
      if (healthScore > 0.5) return { health: 'Good', color: '#84CC16' };
      if (healthScore > 0.25) return { health: 'Fair', color: '#FBBF24' };
      return { health: 'Needs Work', color: '#EF4444' };
    };

    // Render full-width advisor detail view
    const renderAdvisorDetail = () => {
      if (!selectedAdvisor) return <></>;

      const advisorDeals = deals.filter(d => d.advisorId === selectedAdvisor.id);
      const whiteSpace = whiteSpaceData.find(w => w.id === selectedAdvisor.id);
      const coMarketingMatch = coMarketingOpportunities.find(opp => opp.advisor.id === selectedAdvisor.id);
      const advisorRating = ratings?.advisorRatings?.find((r: any) => r.advisorId === selectedAdvisor.id);

      const personalIntel = {
        birthday: `${['January', 'February', 'March', 'April', 'May', 'June'][Math.floor(seededRandom(`${selectedAdvisor.id}-month`) * 6)]} ${Math.floor(seededRandom(`${selectedAdvisor.id}-day`) * 28) + 1}`,
        education: [
          { school: 'Stanford University', degree: 'MBA' },
          { school: 'UC Berkeley', degree: 'BS Computer Science' }
        ][Math.floor(seededRandom(`${selectedAdvisor.id}-edu`) * 2)],
        family: `Married, ${Math.floor(seededRandom(`${selectedAdvisor.id}-kids`) * 3) + 1} kids`,
        hobbies: ['Hiking', 'Photography', 'Golf', 'Cooking', 'Board games'][Math.floor(seededRandom(`${selectedAdvisor.id}-hobby`) * 5)],
        funFact: 'Built a SaaS startup before joining this company',
      };

      const connectedMonths = Math.floor(seededRandom(`${selectedAdvisor.id}-connected`) * 24);
      const lastContactDays = Math.floor(seededRandom(`${selectedAdvisor.id}-contact`) * 30);

      // Mock recent activity timeline
      const mockActivityTimeline = [
        { id: 1, type: 'call' as const, icon: Phone, title: 'Quarterly Business Review', details: `Discussed Q2 targets and new product roadmap with ${selectedAdvisor.name}`, time: `${lastContactDays}d ago` },
        { id: 2, type: 'email' as const, icon: Mail, title: 'Campaign Follow-up', details: 'Sent Q2 promotional materials and launch timeline', time: `${lastContactDays + 3}d ago` },
        { id: 3, type: 'meeting' as const, icon: Calendar, title: 'Product Demo', details: `Presented new Analytics Suite with ${selectedAdvisor.name.split(' ')[0]} and team`, time: `${lastContactDays + 8}d ago` },
        { id: 4, type: 'deal' as const, icon: FileText, title: 'Deal Update', details: advisorDeals[0] ? `${advisorDeals[0].name} moved to ${advisorDeals[0].stage}` : 'Deal stage updated', time: `${lastContactDays + 10}d ago` },
        { id: 5, type: 'note' as const, icon: MessageCircle, title: 'Personal Note', details: `${selectedAdvisor.name.split(' ')[0]} mentioned upcoming family plans`, time: `${lastContactDays + 16}d ago` },
        { id: 6, type: 'email' as const, icon: Mail, title: 'Initial Outreach', details: 'First contact email introducing partnership opportunities', time: '1mo ago' },
      ];

      // Prepend real call logs
      const realCallLogs = callLogs.filter(c => c.advisorId === selectedAdvisor.id).map((c, i) => ({
        id: 100 + i,
        type: 'call' as const,
        icon: Phone,
        title: `Call with ${selectedAdvisor.name.split(' ')[0]}${c.newDealName ? ` — New deal: ${c.newDealName}` : ''}`,
        details: c.notes.length > 80 ? c.notes.slice(0, 80) + '...' : c.notes,
        time: (() => { const d = new Date(c.date); const now = new Date(); const diff = Math.floor((now.getTime() - d.getTime()) / (1000*60*60*24)); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff}d ago`; })(),
      }));
      const activityTimeline = [...realCallLogs, ...mockActivityTimeline];

      // Mock action items
      const actionItems = [
        { id: 1, title: advisorDeals[0] ? `Send contract for ${advisorDeals[0].name}` : 'Send partnership contract', due: 'Tomorrow', status: 'overdue' as const },
        { id: 2, title: 'Schedule Q2 planning session', due: 'Apr 15', status: 'pending' as const },
        { id: 3, title: 'Follow up on pricing proposal', due: 'Apr 12', status: 'pending' as const },
        { id: 4, title: 'Invite to user conference', due: 'Apr 20', status: 'low' as const },
      ];

      const activityIconColors: Record<string, string> = {
        call: 'bg-blue-50 text-blue-600',
        email: 'bg-purple-50 text-purple-600',
        meeting: 'bg-emerald-50 text-emerald-600',
        deal: 'bg-amber-50 text-amber-600',
        note: 'bg-gray-100 text-gray-600',
      };

      // Update advisor field in state and persist
      const updateAdvisorField = async (field: string, value: any) => {
        const updated = { ...selectedAdvisor, [field]: value };
        setAdvisors(prev => prev.map(a => a.id === selectedAdvisor.id ? { ...a, [field]: value } : a));
        setSelectedAdvisor(updated);
        // Use POST (upsert) — no PUT handler exists
        fetch('/api/live/advisors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...selectedAdvisor, [field]: value }) }).catch(console.error);
      };

      return (
        <div>
          {/* Back button */}
          <button
            onClick={() => { setPanelOpen(false); setSelectedAdvisor(null); }}
            className="mb-5 flex items-center gap-1.5 text-12px font-medium text-[#157A6E] hover:text-[#0f5550] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {companyFilter ? `Back to ${companyFilter}` : 'Back to Partners'}
          </button>

          {/* Flipped two-column: LEFT = sticky contact sidebar, RIGHT = scrollable content */}
          <div className="grid grid-cols-12 gap-6">

            {/* ═══ LEFT SIDEBAR (5 cols / ~40%) — Contact Card + Actions + Health + Intel ═══ */}
            <div className="col-span-5">
              <div className="space-y-5">

                {/* Contact Card */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-[#157A6E] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[22px] font-semibold font-['Newsreader']">
                        {selectedAdvisor.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      {editingIntelField === `${selectedAdvisor.id}-name` ? (
                        <div className="flex gap-1 mb-2">
                          <input
                            autoFocus
                            value={editingIntelValue}
                            onChange={e => setEditingIntelValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { updateAdvisorField('name', editingIntelValue); setEditingIntelField(null); }
                              if (e.key === 'Escape') setEditingIntelField(null);
                            }}
                            className="flex-1 text-[22px] font-semibold font-['Newsreader'] border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]"
                          />
                          <button onClick={() => { updateAdvisorField('name', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <h2 onClick={() => { setEditingIntelField(`${selectedAdvisor.id}-name`); setEditingIntelValue(selectedAdvisor.name); }} className="text-[22px] font-semibold font-['Newsreader'] text-gray-900 leading-tight cursor-pointer hover:text-[#157A6E] hover:bg-teal-50/50 rounded px-1 -mx-1 py-0.5 transition-colors">{selectedAdvisor.name}</h2>
                      )}
                      <p className="text-12px text-gray-600">
                        {editingIntelField === `${selectedAdvisor.id}-title` ? (
                          <div className="flex gap-1 inline-flex">
                            <input
                              autoFocus
                              value={editingIntelValue}
                              onChange={e => setEditingIntelValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') { updateAdvisorField('title', editingIntelValue); setEditingIntelField(null); }
                                if (e.key === 'Escape') setEditingIntelField(null);
                              }}
                              className="text-12px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]"
                            />
                            <button onClick={() => { updateAdvisorField('title', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3 h-3" /></button>
                            <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <span onClick={() => { setEditingIntelField(`${selectedAdvisor.id}-title`); setEditingIntelValue(selectedAdvisor.title || 'Partner'); }} className="cursor-pointer hover:text-[#157A6E] hover:bg-teal-50/50 rounded px-1 -mx-1 py-0.5 transition-colors">{selectedAdvisor.title || 'Partner'}</span>
                        )} at{' '}
                        <button
                          onClick={() => { setCompanyFilter(selectedAdvisor.company); setPartnersSubView('contacts'); setPanelOpen(false); setSelectedAdvisor(null); }}
                          className="text-[#157A6E] font-medium hover:underline"
                        >{selectedAdvisor.company}</button>
                      </p>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-2.5 mb-4 pb-4 border-b border-[#e8e5e1]">
                    <div className="flex items-center gap-2.5 text-12px">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {editingIntelField === `${selectedAdvisor.id}-phone` ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus
                            value={editingIntelValue}
                            onChange={e => setEditingIntelValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { updateAdvisorField('phone', editingIntelValue); setEditingIntelField(null); }
                              if (e.key === 'Escape') setEditingIntelField(null);
                            }}
                            className="flex-1 text-11px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]"
                          />
                          <button onClick={() => { updateAdvisorField('phone', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <span onClick={() => { setEditingIntelField(`${selectedAdvisor.id}-phone`); setEditingIntelValue(selectedAdvisor.phone || `(${Math.floor(seededRandom(`${selectedAdvisor.id}-area`) * 900 + 100)}) ${Math.floor(seededRandom(`${selectedAdvisor.id}-ph1`) * 900 + 100)}-${Math.floor(seededRandom(`${selectedAdvisor.id}-ph2`) * 9000 + 1000)}`); }} className="text-gray-900 font-medium cursor-pointer hover:text-[#157A6E] hover:bg-teal-50/50 rounded px-1 -mx-1 py-0.5 transition-colors">{selectedAdvisor.phone || `(${Math.floor(seededRandom(`${selectedAdvisor.id}-area`) * 900 + 100)}) ${Math.floor(seededRandom(`${selectedAdvisor.id}-ph1`) * 900 + 100)}-${Math.floor(seededRandom(`${selectedAdvisor.id}-ph2`) * 9000 + 1000)}`}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-12px">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {editingIntelField === `${selectedAdvisor.id}-email` ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus
                            value={editingIntelValue}
                            onChange={e => setEditingIntelValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { updateAdvisorField('email', editingIntelValue); setEditingIntelField(null); }
                              if (e.key === 'Escape') setEditingIntelField(null);
                            }}
                            className="flex-1 text-11px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]"
                          />
                          <button onClick={() => { updateAdvisorField('email', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <span onClick={() => { setEditingIntelField(`${selectedAdvisor.id}-email`); setEditingIntelValue(selectedAdvisor.email || `${selectedAdvisor.name.toLowerCase().replace(' ', '.')}@${selectedAdvisor.company.toLowerCase().replace(/\s+/g, '')}.com`); }} className="text-gray-900 font-medium truncate cursor-pointer hover:text-[#157A6E] hover:bg-teal-50/50 rounded px-1 -mx-1 py-0.5 transition-colors">{selectedAdvisor.email || `${selectedAdvisor.name.toLowerCase().replace(' ', '.')}@${selectedAdvisor.company.toLowerCase().replace(/\s+/g, '')}.com`}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-12px">
                      <ExternalLink className="w-3.5 h-3.5 text-[#0A66C2] flex-shrink-0" />
                      {advisorPersonalIntel[selectedAdvisor.id]?.linkedin ? (
                        <a href={advisorPersonalIntel[selectedAdvisor.id]!.linkedin!.startsWith('http') ? advisorPersonalIntel[selectedAdvisor.id]!.linkedin! : `https://${advisorPersonalIntel[selectedAdvisor.id]!.linkedin!}`} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] font-medium hover:underline truncate">{advisorPersonalIntel[selectedAdvisor.id]!.linkedin}</a>
                      ) : (
                        <button onClick={() => { setEditingIntelField(`${selectedAdvisor.id}-linkedin`); setEditingIntelValue(''); }} className="text-gray-400 text-12px italic hover:text-[#0A66C2]">Add LinkedIn...</button>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-12px">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {editingIntelField === `${selectedAdvisor.id}-location` ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus
                            value={editingIntelValue}
                            onChange={e => setEditingIntelValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { updateAdvisorField('location', editingIntelValue); setEditingIntelField(null); }
                              if (e.key === 'Escape') setEditingIntelField(null);
                            }}
                            className="flex-1 text-11px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]"
                          />
                          <button onClick={() => { updateAdvisorField('location', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <span onClick={() => { setEditingIntelField(`${selectedAdvisor.id}-location`); setEditingIntelValue(selectedAdvisor.location || 'Unknown'); }} className="text-gray-700 cursor-pointer hover:text-[#157A6E] hover:bg-teal-50/50 rounded px-1 -mx-1 py-0.5 transition-colors">{selectedAdvisor.location || 'Unknown'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-12px">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">Connected {connectedMonths} months</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                      { label: 'Email', icon: Mail, action: () => { setLogContactType('email'); setLogCallAdvisor(selectedAdvisor); setShowLogCallModal(true); } },
                      { label: 'Call', icon: Phone, action: () => { setLogContactType('call'); setLogCallAdvisor(selectedAdvisor); setShowLogCallModal(true); } },
                      { label: 'Schedule', icon: Calendar, action: () => { window.open('https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meeting+with+' + encodeURIComponent(selectedAdvisor.name)); } },
                      { label: 'Log Call', icon: FileText, action: () => { setLogContactType('call'); setLogCallAdvisor(selectedAdvisor); setShowLogCallModal(true); } },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.action} className="flex flex-col items-center gap-1 px-2 py-2.5 border border-[#157A6E]/30 text-[#157A6E] rounded-lg hover:bg-[#157A6E]/5 transition-colors">
                        <btn.icon className="w-4 h-4" />
                        <span className="text-[10px] font-medium">{btn.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 text-center mb-4">Links configured in Settings</p>
                  {(() => {
                    const existingPb = launchedPlaybooks.findIndex(p => p.advisorId === selectedAdvisor.id);
                    if (existingPb >= 0) {
                      const pb = launchedPlaybooks[existingPb];
                      const steps = pb.customSteps || [];
                      const effective = steps.length - pb.skippedSteps.length;
                      const pct = effective > 0 ? Math.round((pb.completedSteps.length / effective) * 100) : 100;
                      return (
                        <button
                          onClick={() => { setActiveView('intelligence'); setIntelligenceSubTab('playbooks'); setEditingPlaybookIdx(existingPb); }}
                          className="w-full px-3 py-2.5 text-[11px] font-semibold text-[#157A6E] border border-[#157A6E]/30 rounded-lg hover:bg-teal-50 transition-colors flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2"><PlayCircle className="w-4 h-4" /> View Active Playbook</span>
                          <span className="text-[10px] font-bold">{pct}%</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={() => { setPlaybookModalAdvisor(selectedAdvisor); setPlaybookModalMode('template'); setSelectedPlaybookTemplate(null); setShowPlaybookModal(true); }}
                        className="w-full px-3 py-2.5 text-[11px] font-semibold text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f] transition-colors flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" /> Run Playbook
                      </button>
                    );
                  })()}
                </div>

                {/* Key Metrics */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">MRR</p>
                      {editingIntelField === `${selectedAdvisor.id}-mrr` ? (
                        <div className="flex gap-1 justify-center">
                          <input
                            autoFocus
                            type="number"
                            value={editingIntelValue}
                            onChange={e => setEditingIntelValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { updateAdvisorField('mrr', parseInt(editingIntelValue) || 0); setEditingIntelField(null); }
                              if (e.key === 'Escape') setEditingIntelField(null);
                            }}
                            className="w-20 text-13px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]"
                          />
                          <button onClick={() => { updateAdvisorField('mrr', parseInt(editingIntelValue) || 0); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <p onClick={() => { setEditingIntelField(`${selectedAdvisor.id}-mrr`); setEditingIntelValue(String(selectedAdvisor.mrr || 0)); }} className="text-[18px] font-bold text-[#157A6E] cursor-pointer hover:text-[#0f5550]">{formatCurrency(selectedAdvisor.mrr)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Last Contact</p>
                      <p className="text-13px font-semibold text-gray-900">{lastContactDays}d ago</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Next Action</p>
                      <p className="text-13px font-semibold text-red-600">Tomorrow</p>
                    </div>
                  </div>
                </div>

                {/* Relationship Health */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                  <h3 className="text-13px font-semibold font-['Newsreader'] text-gray-900 mb-3">Relationship Health</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-11px text-gray-600">Pulse</span>
                      <PulseBadge pulse={selectedAdvisor.pulse} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-11px text-gray-600">Trajectory</span>
                      <TrajectoryBadge trajectory={selectedAdvisor.trajectory} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-11px text-gray-600">Friction</span>
                      <FrictionBadge level={selectedAdvisor.friction} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-11px text-gray-600">Sentiment</span>
                      <SentimentBadge tone={seededRandom(`${selectedAdvisor.id}-sent`) > 0.6 ? 'Warm' : seededRandom(`${selectedAdvisor.id}-sent`) > 0.3 ? 'Neutral' : 'Cool'} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-11px text-gray-600">Intent</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-10px font-medium rounded">Expanding</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-11px text-gray-600">Tier</span>
                      {editingIntelField === `${selectedAdvisor.id}-tier` ? (
                        <div className="flex gap-1">
                          <select
                            autoFocus
                            value={editingIntelValue}
                            onChange={e => setEditingIntelValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { updateAdvisorField('tier', editingIntelValue); setEditingIntelField(null); }
                              if (e.key === 'Escape') setEditingIntelField(null);
                            }}
                            className="text-11px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]"
                          >
                            <option value="anchor">Anchor</option>
                            <option value="scaling">Scaling</option>
                            <option value="building">Building</option>
                            <option value="launching">Launching</option>
                          </select>
                          <button onClick={() => { updateAdvisorField('tier', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div onClick={() => { setEditingIntelField(`${selectedAdvisor.id}-tier`); setEditingIntelValue(selectedAdvisor.tier); }} className="cursor-pointer hover:opacity-80 transition-opacity">
                          <TierBadge tier={selectedAdvisor.tier} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-11px text-gray-600">Stage</span>
                      {(() => {
                        const stage = selectedAdvisor.relationshipStage || 'Activated';
                        const stageColors: Record<string, string> = {
                          'Prospect': 'bg-gray-100 text-gray-700',
                          'Onboarding': 'bg-blue-100 text-blue-700',
                          'Activated': 'bg-green-100 text-green-700',
                          'Scaling': 'bg-[#d4f3f0] text-[#157A6E]',
                          'Strategic': 'bg-purple-100 text-purple-700',
                        };
                        return (
                          <span className={`px-2 py-0.5 text-10px font-medium rounded ${stageColors[stage] || stageColors['Activated']}`}>
                            {stage}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 12-Month Trend */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                  <h3 className="text-13px font-semibold font-['Newsreader'] text-gray-900 mb-3">12-Month Trend</h3>
                  {(() => {
                    let snapshots = selectedAdvisor.monthlySnapshots || [];

                    // If no snapshots, generate mock data
                    if (snapshots.length === 0) {
                      snapshots = [];
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const baseMRR = selectedAdvisor.mrr || 50000;
                      for (let i = 0; i < 12; i++) {
                        const variance = seededRandom(`${selectedAdvisor.id}-mrr-${i}`) * 0.3 - 0.15;
                        snapshots.push({
                          month: months[i],
                          pulse: ['Strong', 'Steady', 'Rising', 'Fading', 'Flatline'][Math.floor(seededRandom(`${selectedAdvisor.id}-pulse-${i}`) * 5)] as any,
                          trajectory: ['Accelerating', 'Climbing', 'Stable', 'Slipping', 'Freefall'][Math.floor(seededRandom(`${selectedAdvisor.id}-traj-${i}`) * 5)] as any,
                          tier: ['anchor', 'scaling', 'building', 'launching'][Math.floor(seededRandom(`${selectedAdvisor.id}-tier-${i}`) * 4)] as any,
                          mrr: Math.max(20000, baseMRR * (1 + variance)),
                        });
                      }
                    }

                    const mrrValues = snapshots.map(s => s.mrr);
                    const minMRR = Math.min(...mrrValues);
                    const maxMRR = Math.max(...mrrValues);
                    const mrrRange = maxMRR - minMRR || 1;

                    const avgMRR = Math.round(mrrValues.reduce((a, b) => a + b, 0) / mrrValues.length);
                    const peakMRR = Math.max(...mrrValues);
                    const currentMRR = mrrValues[mrrValues.length - 1];

                    // SVG sparkline
                    const sparklineWidth = 280;
                    const sparklineHeight = 60;
                    const padding = 8;
                    const graphWidth = sparklineWidth - padding * 2;
                    const graphHeight = sparklineHeight - padding * 2;
                    const points = mrrValues.map((val, idx) => {
                      const x = padding + (idx / (mrrValues.length - 1)) * graphWidth;
                      const y = sparklineHeight - padding - ((val - minMRR) / mrrRange) * graphHeight;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <div>
                        <svg width={sparklineWidth} height={sparklineHeight} className="w-full mb-3" style={{ maxWidth: '100%' }}>
                          <polyline points={points} fill="none" stroke="#157A6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">12mo Avg</p>
                            <p className="text-12px font-semibold text-gray-900">${(avgMRR / 1000).toFixed(1)}k</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Peak</p>
                            <p className="text-12px font-semibold text-gray-900">${(peakMRR / 1000).toFixed(1)}k</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Current</p>
                            <p className="text-12px font-semibold text-gray-900">${(currentMRR / 1000).toFixed(1)}k</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Personal Intel */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-13px font-semibold font-['Newsreader'] text-gray-900">Personal Intel</h3>
                    <span className="text-[9px] text-gray-400">Click to edit</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon: Cake, label: 'Birthday', field: 'birthday', value: (advisorPersonalIntel[selectedAdvisor.id]?.birthday) || selectedAdvisor.birthday || personalIntel.birthday },
                      { icon: GraduationCap, label: 'Education', field: 'education', value: (advisorPersonalIntel[selectedAdvisor.id]?.education) || selectedAdvisor.education || personalIntel.education?.degree },
                      { icon: Heart, label: 'Family', field: 'family', value: (advisorPersonalIntel[selectedAdvisor.id]?.family) || selectedAdvisor.family || personalIntel.family },
                      { icon: Star, label: 'Hobbies', field: 'hobbies', value: (advisorPersonalIntel[selectedAdvisor.id]?.hobbies) || selectedAdvisor.hobbies || personalIntel.hobbies },
                      { icon: Lightbulb, label: 'Fun Fact', field: 'funFact', value: (advisorPersonalIntel[selectedAdvisor.id]?.funFact) || selectedAdvisor.funFact || personalIntel.funFact },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-2.5 group">
                        <item.icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-500">{item.label}</p>
                          {editingIntelField === `${selectedAdvisor.id}-${item.field}` ? (
                            <div className="flex gap-1 mt-0.5">
                              <input
                                autoFocus
                                value={editingIntelValue}
                                onChange={e => setEditingIntelValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    setAdvisorPersonalIntel(prev => ({ ...prev, [selectedAdvisor.id]: { ...prev[selectedAdvisor.id], [item.field]: editingIntelValue } }));
                                    setEditingIntelField(null);
                                  }
                                  if (e.key === 'Escape') setEditingIntelField(null);
                                }}
                                className="flex-1 text-11px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]"
                              />
                              <button onClick={() => { setAdvisorPersonalIntel(prev => ({ ...prev, [selectedAdvisor.id]: { ...prev[selectedAdvisor.id], [item.field]: editingIntelValue } })); setEditingIntelField(null); }} className="text-[#157A6E] hover:text-[#0f5550]"><CheckCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingIntelField(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <p
                                onClick={() => { setEditingIntelField(`${selectedAdvisor.id}-${item.field}`); setEditingIntelValue(item.value || ''); }}
                                className="text-11px font-medium text-gray-900 cursor-pointer hover:text-[#157A6E] hover:bg-teal-50/50 rounded px-1 -mx-1 py-0.5 transition-colors flex-1"
                              >
                                {item.value || <span className="text-gray-400 italic">Click to add...</span>}
                              </p>
                              {item.field === 'linkedin' && item.value && (
                                <a href={item.value.startsWith('http') ? item.value : `https://${item.value}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[#0A66C2] hover:text-[#004182] flex-shrink-0" title="Open LinkedIn profile">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT CONTENT (7 cols / ~60%) — Activity, Action Items, Deals, Notes ═══ */}
            <div className="col-span-7 space-y-5">

              {/* Action Items — pinned at top */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900">Action Items</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-10px font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      {(advisorActionItems[selectedAdvisor.id] || actionItems).filter(a => a.status === 'overdue').length} overdue
                    </span>
                    <button onClick={() => setShowAddAction(true)} className="text-[#157A6E] hover:text-[#0f5550]"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                {showAddAction && (
                  <div className="mb-3 p-3 bg-teal-50/50 rounded-lg border border-[#157A6E]/20">
                    <div className="flex gap-2 mb-2">
                      <input placeholder="Action item..." value={newActionTitle} onChange={e => setNewActionTitle(e.target.value)} className="flex-1 text-12px border border-[#e8e5e1] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                      <input type="date" value={newActionDue} onChange={e => setNewActionDue(e.target.value)} className="text-11px border border-[#e8e5e1] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        if (!newActionTitle.trim()) return;
                        const newItem = { id: `action-${Date.now()}`, title: newActionTitle, due: newActionDue || 'No date', status: 'pending' as const };
                        setAdvisorActionItems(prev => ({ ...prev, [selectedAdvisor.id]: [...(prev[selectedAdvisor.id] || actionItems), newItem] }));
                        setNewActionTitle(''); setNewActionDue(''); setShowAddAction(false);
                      }} className="px-3 py-1 text-11px font-medium bg-[#157A6E] text-white rounded hover:bg-[#0f5550]">Add</button>
                      <button onClick={() => { setShowAddAction(false); setNewActionTitle(''); setNewActionDue(''); }} className="px-3 py-1 text-11px font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {(advisorActionItems[selectedAdvisor.id] || actionItems).filter(a => a.status !== 'done').map(item => (
                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border-l-3 ${item.status === 'overdue' ? 'bg-red-50/50 border-l-red-400' : item.status === 'pending' ? 'bg-amber-50/30 border-l-amber-300' : 'bg-gray-50 border-l-gray-200'}`}>
                      <button onClick={() => {
                        setAdvisorActionItems(prev => {
                          const items = prev[selectedAdvisor.id] || actionItems;
                          return { ...prev, [selectedAdvisor.id]: items.map(a => a.id === item.id ? { ...a, status: 'done' as const } : a) };
                        });
                      }} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${item.status === 'overdue' ? 'border-red-400 hover:bg-red-100' : 'border-gray-300 hover:bg-gray-100'} transition-colors`}>
                        {item.status === 'overdue' && <AlertCircle className="w-3 h-3 text-red-500" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        {editingActionItem === item.id ? (
                          <input autoFocus value={editingActionValue} onChange={e => setEditingActionValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { setAdvisorActionItems(prev => ({ ...prev, [selectedAdvisor.id]: (prev[selectedAdvisor.id] || actionItems).map(a => a.id === item.id ? { ...a, title: editingActionValue } : a) })); setEditingActionItem(null); } if (e.key === 'Escape') setEditingActionItem(null); }}
                            className="w-full text-12px border border-[#157A6E] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                        ) : (
                          <p onClick={() => { setEditingActionItem(item.id); setEditingActionValue(item.title); }} className="text-12px font-medium text-gray-900 truncate cursor-pointer hover:text-[#157A6E]">{item.title}</p>
                        )}
                      </div>
                      <span className={`text-10px font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${item.status === 'overdue' ? 'bg-red-100 text-red-700' : item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.due}
                      </span>
                      <button onClick={() => { setAdvisorActionItems(prev => ({ ...prev, [selectedAdvisor.id]: (prev[selectedAdvisor.id] || actionItems).filter(a => a.id !== item.id) })); }} className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-0">
                  {activityTimeline.map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <div key={item.id} className="flex gap-3 relative">
                        {/* Timeline line */}
                        {idx < activityTimeline.length - 1 && (
                          <div className="absolute left-[15px] top-[36px] bottom-0 w-[1.5px] bg-[#e8e5e1]" />
                        )}
                        {/* Icon circle */}
                        <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 z-10 ${activityIconColors[item.type] || 'bg-gray-100 text-gray-600'}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        {/* Content */}
                        <div className={`flex-1 pb-5 ${idx < activityTimeline.length - 1 ? '' : ''}`}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-12px font-medium text-gray-900">{item.title}</p>
                            <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{item.time}</span>
                          </div>
                          <p className="text-11px text-gray-600 mt-0.5">{item.details}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deals */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900">Active Deals ({advisorDeals.length})</h3>
                  <button onClick={() => setShowInlineAddDeal(!showInlineAddDeal)} className="text-[#157A6E] hover:text-[#0f5550]"><Plus className="w-4 h-4" /></button>
                </div>
                {showInlineAddDeal && (
                  <div className="mb-3 p-3 bg-teal-50/50 rounded-lg border border-[#157A6E]/20">
                    <div className="flex gap-2 mb-2">
                      <input placeholder="Deal name..." value={inlineDealName} onChange={e => setInlineDealName(e.target.value)} className="flex-1 text-12px border border-[#e8e5e1] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                      <input placeholder="MRR" type="number" value={inlineDealMRR} onChange={e => setInlineDealMRR(e.target.value)} className="w-24 text-12px border border-[#e8e5e1] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        if (!inlineDealName.trim()) return;
                        const newDeal: any = { id: `deal-${Date.now()}`, name: inlineDealName, advisorId: selectedAdvisor.id, advisorIds: [selectedAdvisor.id], stage: 'Discovery', mrr: parseInt(inlineDealMRR) || 0, health: 'Healthy', probability: 10, daysInStage: 0, lastActivity: new Date().toISOString().split('T')[0], nextStep: 'Initial qualification', decisionMaker: selectedAdvisor.name, products: [], actionItems: [] };
                        setDeals(prev => [...prev, newDeal]);
                        fetch('/api/live/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: inlineDealName, advisorId: selectedAdvisor.id, advisorIds: [selectedAdvisor.id], stage: 'Discovery', mrr: parseInt(inlineDealMRR) || 0, probability: 10, health: 'Healthy', daysInStage: 0 }) }).catch(console.error);
                        setInlineDealName(''); setInlineDealMRR(''); setShowInlineAddDeal(false);
                      }} className="px-3 py-1 text-11px font-medium bg-[#157A6E] text-white rounded hover:bg-[#0f5550]">Add Deal</button>
                      <button onClick={() => { setShowInlineAddDeal(false); setInlineDealName(''); setInlineDealMRR(''); }} className="px-3 py-1 text-11px font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                )}
                {advisorDeals.length > 0 && (
                  <div className="space-y-3">
                    {advisorDeals.map(deal => (
                      <div
                        key={deal.id}
                        onClick={() => { setSelectedDeal(deal); setActiveViewRaw('pipeline'); }}
                        className="p-4 rounded-lg border border-[#e8e5e1] hover:border-[#157A6E]/30 hover:bg-[#F0F9F8] transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-13px font-medium text-gray-900">{deal.name}</p>
                            <p className="text-11px text-gray-600 mt-0.5">{deal.stage} · {deal.daysInStage}d in stage</p>
                          </div>
                          <DealHealthBadge health={deal.health} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-bold text-gray-900">{formatCurrency(deal.mrr)}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-[#157A6E]" style={{ width: `${deal.probability || 50}%` }} />
                            </div>
                            <span className="text-10px text-gray-500">{deal.probability || 50}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {advisorDeals.length === 0 && !showInlineAddDeal && (
                  <p className="text-12px text-gray-500">No active deals yet</p>
                )}
              </div>

              {/* Growth Opportunities */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Growth Opportunities</h3>
                <div className="grid grid-cols-2 gap-5">
                  {/* White Space */}
                  {whiteSpace && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-12px font-semibold text-gray-900">White Space Analysis</h4>
                        {!editingWhiteSpace && <button onClick={() => { setEditingWhiteSpace(true); setEditingWhiteSpaceValue(advisorWhiteSpaceNotes[selectedAdvisor.id] || ''); }} className="text-[#157A6E] hover:text-[#0f5550]"><Edit className="w-3 h-3" /></button>}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-11px text-gray-600">Catalog Coverage</p>
                            <span className="text-11px font-bold text-gray-900">{whiteSpace.crossSellScore.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#157A6E]" style={{ width: `${whiteSpace.crossSellScore}%` }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-11px text-gray-600 mb-1.5">Opportunities</p>
                          <div className="flex flex-wrap gap-1">
                            {whiteSpace.opportunityProducts.slice(0, 4).map(p => (
                              <span key={p} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">{p}</span>
                            ))}
                            {whiteSpace.opportunityProducts.length > 4 && <span className="text-[10px] text-gray-500">+{whiteSpace.opportunityProducts.length - 4}</span>}
                          </div>
                        </div>
                        <p className="text-11px text-gray-600">Est. Opportunity: <span className="font-bold text-gray-900">{formatCurrency(whiteSpace.opportunityMRR)}</span></p>
                        {editingWhiteSpace ? (
                          <div>
                            <textarea value={editingWhiteSpaceValue} onChange={e => setEditingWhiteSpaceValue(e.target.value)} placeholder="Add notes about white space opportunities..." className="w-full text-11px border border-[#157A6E] rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" rows={2} />
                            <div className="flex gap-1 mt-1">
                              <button onClick={() => { setAdvisorWhiteSpaceNotes(prev => ({ ...prev, [selectedAdvisor.id]: editingWhiteSpaceValue })); setEditingWhiteSpace(false); }} className="px-2 py-1 text-[10px] font-medium bg-[#157A6E] text-white rounded">Save</button>
                              <button onClick={() => setEditingWhiteSpace(false)} className="px-2 py-1 text-[10px] text-gray-500">Cancel</button>
                            </div>
                          </div>
                        ) : advisorWhiteSpaceNotes[selectedAdvisor.id] ? (
                          <p className="text-11px text-gray-700 bg-gray-50 rounded p-2 italic">{advisorWhiteSpaceNotes[selectedAdvisor.id]}</p>
                        ) : null}
                      </div>
                    </div>
                  )}
                  {/* Co-Marketing */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-12px font-semibold text-gray-900">Co-Marketing</h4>
                      {!editingCoMarketing && <button onClick={() => { setEditingCoMarketing(true); setEditingCoMarketingValue(advisorCoMarketingNotes[selectedAdvisor.id] || ''); }} className="text-[#157A6E] hover:text-[#0f5550]"><Edit className="w-3 h-3" /></button>}
                    </div>
                    {coMarketingMatch ? (
                      <div className="space-y-3">
                        <p className="text-11px text-gray-600">{coMarketingMatch.reason}</p>
                        <div className="px-3 py-2 bg-[#157A6E]/5 rounded-lg">
                          <p className="text-[10px] text-gray-500 mb-0.5">Campaign Type</p>
                          <p className="text-12px font-semibold text-[#157A6E]">{coMarketingMatch.type}</p>
                        </div>
                        <button className="w-full px-3 py-2 text-11px font-medium bg-[#157A6E] text-white rounded-lg hover:bg-[#0f5550] transition-colors">Launch Campaign</button>
                      </div>
                    ) : (
                      <p className="text-11px text-gray-600">Not currently eligible for co-marketing campaigns</p>
                    )}
                    {editingCoMarketing ? (
                      <div className="mt-3">
                        <textarea value={editingCoMarketingValue} onChange={e => setEditingCoMarketingValue(e.target.value)} placeholder="Add co-marketing notes, ideas, or campaign details..." className="w-full text-11px border border-[#157A6E] rounded p-2 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" rows={2} />
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => { setAdvisorCoMarketingNotes(prev => ({ ...prev, [selectedAdvisor.id]: editingCoMarketingValue })); setEditingCoMarketing(false); }} className="px-2 py-1 text-[10px] font-medium bg-[#157A6E] text-white rounded">Save</button>
                          <button onClick={() => setEditingCoMarketing(false)} className="px-2 py-1 text-[10px] text-gray-500">Cancel</button>
                        </div>
                      </div>
                    ) : advisorCoMarketingNotes[selectedAdvisor.id] ? (
                      <p className="text-11px text-gray-700 bg-gray-50 rounded p-2 mt-3 italic">{advisorCoMarketingNotes[selectedAdvisor.id]}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Notes & Activity */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-3">Notes</h3>
                <div className="flex gap-2 mb-3">
                  <textarea
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder={`Write a note about ${selectedAdvisor.name.split(' ')[0]}...`}
                    className="flex-1 text-12px border border-[#e8e5e1] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#157A6E]"
                    rows={2}
                  />
                </div>
                <button
                  onClick={() => {
                    if (!noteInput.trim()) return;
                    const timestamp = new Date().toLocaleString();
                    setAdvisorNotes(prev => ({ ...prev, [selectedAdvisor.id]: [`[${timestamp}] ${noteInput}`, ...(prev[selectedAdvisor.id] || [])] }));
                    setNoteInput('');
                  }}
                  disabled={!noteInput.trim()}
                  className="px-4 py-1.5 text-11px font-semibold bg-[#157A6E] text-white rounded-lg hover:bg-[#0f5550] disabled:opacity-40 disabled:cursor-not-allowed mb-3"
                >
                  Save Note
                </button>
                {(advisorNotes[selectedAdvisor.id] || []).length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-[#e8e5e1]">
                    {(advisorNotes[selectedAdvisor.id] || []).map((note, i) => (
                      <div key={i} className="text-11px text-gray-700 bg-gray-50 rounded-lg p-2.5 leading-relaxed">
                        {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ═══ DANGER ZONE — at bottom of profile, requires scroll ═══ */}
          <div className="mt-10 pt-6 border-t border-red-100">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-red-400 mb-4">Danger Zone</h3>
            <div className="space-y-3">
              {/* Abandon */}
              <div className="bg-white rounded-[10px] border border-red-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">Abandon Advisor</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Move to Flatlined tier with quarterly reignition cadence. Active playbooks will be cancelled.</p>
                </div>
                <button
                  onClick={() => setShowAbandonModal({ advisorId: selectedAdvisor.id, advisorName: selectedAdvisor.name, company: selectedAdvisor.company, tier: selectedAdvisor.tier, mrr: selectedAdvisor.mrr })}
                  className="px-4 py-2 text-[11px] font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                >
                  Abandon
                </button>
              </div>

              {/* Delete with type-to-confirm */}
              <div className="bg-white rounded-[10px] border border-red-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">Delete Advisor Permanently</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">This will permanently remove {selectedAdvisor.name}, all their deals, playbooks, and history. This action cannot be undone.</p>
                  </div>
                </div>
                {!showDeleteAdvisorConfirm ? (
                  <button
                    onClick={() => { setShowDeleteAdvisorConfirm(true); setDeleteConfirmText(''); }}
                    className="px-4 py-2 text-[11px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete Advisor...
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <p className="text-[11px] text-red-700 font-medium">Type <span className="font-bold font-mono bg-red-100 px-1.5 py-0.5 rounded">delete</span> to confirm:</p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="Type 'delete' to confirm"
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (deleteConfirmText.toLowerCase() === 'delete') {
                            handleDeleteAdvisor(selectedAdvisor.id);
                            setShowDeleteAdvisorConfirm(false);
                            setDeleteConfirmText('');
                          }
                        }}
                        disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                        className="px-4 py-2 text-[11px] font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Permanently Delete {selectedAdvisor.name}
                      </button>
                      <button
                        onClick={() => { setShowDeleteAdvisorConfirm(false); setDeleteConfirmText(''); }}
                        className="px-4 py-2 text-[11px] font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    // If an advisor is selected, show full-width detail instead of list
    if (selectedAdvisor && panelOpen) {
      return renderAdvisorDetail();
    }

    return (
      <>
        {/* Sub-Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-[#e8e5e1] pb-3">
          {[
            { key: 'partners', label: 'Partners', icon: Users },
            { key: 'tsds', label: `TSDs (${TSD_COMPANIES.length})`, icon: Building2 },
            { key: 'all', label: 'All Contacts', icon: LayoutGrid },
            { key: 'groups', label: `Groups (${contactGroups.length})`, icon: Shield },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setRelationshipViewMode(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-13px font-medium transition-colors ${
                relationshipViewMode === tab.key
                  ? 'bg-[#157A6E] text-white'
                  : 'bg-white border border-[#e8e5e1] text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={() => { setRelationshipViewMode('groups'); setShowCreateGroup(true); }} className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-[#157A6E] border border-[#157A6E] rounded-[8px] hover:bg-teal-50 transition-colors">
            <Plus className="w-3 h-3" /> Create Group
          </button>
        </div>

        {/* ── PARTNERS SUB-TAB ── */}
        {relationshipViewMode === 'partners' && (
        <div className="space-y-4">
          {/* Weather-Map Style Heat Map */}
          <USAMap
            advisorsByCity={advisorsByCityMap}
            onCityClick={handleCityClick}
            selectedCity={territoryFilter}
            heatMode={true}
            heatData={stateHeatData}
            onStateClick={(abbr) => setSelectedState(prev => prev === abbr ? null : abbr)}
            selectedState={selectedState}
            title="Partner Performance Heat Map"
            subtitle="States colored by partner engagement, trajectory & revenue · Click for details"
            activeRegion={territoryRegion || null}
            regionStates={territoryRegion ? US_REGIONS[territoryRegion]?.states : undefined}
            exceptionStates={territoryExceptions.length > 0 ? territoryExceptions : undefined}
            showRegionToggle={!!territoryRegion}
            onRegionToggle={(full) => setShowFullUSA(full)}
            showFullUSA={showFullUSA}
          />

          {/* State Detail (when clicked on heat map) */}
          {selectedState && stateHeatData[selectedState] && stateHeatData[selectedState].partners > 0 && (
            <div className="bg-white rounded-[10px] border border-[#157A6E]/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">
                  {selectedState} — {stateHeatData[selectedState].partners} Partner{stateHeatData[selectedState].partners !== 1 ? 's' : ''}
                </h3>
                <button onClick={() => setSelectedState(null)} className="text-12px text-[#157A6E] hover:underline">Clear</button>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                  <p className="text-10px text-gray-500">Partners</p>
                  <p className="text-lg font-bold text-gray-800">{stateHeatData[selectedState].partners}</p>
                </div>
                <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                  <p className="text-10px text-gray-500">MRR</p>
                  <p className="text-lg font-bold text-[#157A6E]">{formatCurrency(stateHeatData[selectedState].mrr)}</p>
                </div>
                <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                  <p className="text-10px text-gray-500">Pipeline</p>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(stateHeatData[selectedState].pipeline)}</p>
                </div>
                <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                  <p className="text-10px text-gray-500">Score</p>
                  <p className="text-lg font-bold text-[#157A6E]">{Math.round(stateHeatData[selectedState].score * 100)}%</p>
                </div>
              </div>
              <div className="space-y-2">
                {advisorsWithDeals
                  .filter(a => a.location?.endsWith(`, ${selectedState}`))
                  .sort((a, b) => b.mrr - a.mrr)
                  .map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}>
                      <div>
                        <p className="text-13px font-medium text-gray-800">{a.name}</p>
                        <p className="text-11px text-gray-500">{a.company} · {a.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PulseBadge pulse={a.pulse} />
                        <TrajectoryBadge trajectory={a.trajectory} />
                        <span className="text-13px font-semibold text-[#157A6E]">{formatCurrency(a.mrr)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── TOOLBAR ── */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 flex items-center gap-4 flex-wrap">
            {/* Contacts / Companies toggle */}
            <div className="flex bg-[#F5F5F5] rounded-lg p-1 gap-1">
              <button
                onClick={() => { setPartnersSubView('contacts'); setCompanyFilter(null); setPartnerSearch(''); }}
                className={`px-3 py-1.5 rounded-md text-12px font-medium transition-all ${
                  partnersSubView === 'contacts'
                    ? 'bg-white text-[#157A6E] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Contacts
              </button>
              <button
                onClick={() => { setPartnersSubView('companies'); setCompanyFilter(null); setPartnerSearch(''); }}
                className={`px-3 py-1.5 rounded-md text-12px font-medium transition-all ${
                  partnersSubView === 'companies'
                    ? 'bg-white text-[#157A6E] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Companies
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                placeholder={partnersSubView === 'contacts' ? 'Search partners or companies...' : 'Search companies...'}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-full text-12px font-['Inter'] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E]/20"
              />
            </div>

            {/* Filters (contacts only) */}
            {partnersSubView === 'contacts' && (
              <>
                <select
                  value={relationshipFilter}
                  onChange={(e) => setRelationshipFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-md text-12px font-['Inter'] text-gray-700 hover:border-[#157A6E] cursor-pointer"
                >
                  <option value="All">All Engagement</option>
                  <option value="Revenue Producing">Revenue Producing</option>
                  <option value="High Engagement">High Engagement</option>
                  <option value="Platinum & Gold">Platinum & Gold</option>
                  <option value="Needs Attention">Needs Attention</option>
                  <option value="New / Onboarding">New / Onboarding</option>
                </select>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-md text-12px font-['Inter'] text-gray-700 hover:border-[#157A6E] cursor-pointer"
                >
                  <option value="All">All Stages</option>
                  {relationshipStages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {companyFilter && (
                  <button
                    onClick={() => setCompanyFilter(null)}
                    className="flex items-center gap-1 px-3 py-2 bg-[#157A6E]/10 text-[#157A6E] rounded-md text-12px font-medium"
                  >
                    {companyFilter} <X className="w-3 h-3" />
                  </button>
                )}
                <select
                  value={relationshipSort}
                  onChange={(e) => setRelationshipSort(e.target.value as 'name' | 'mrr' | 'lastContact')}
                  className="px-3 py-2 border border-gray-200 rounded-md text-12px font-['Inter'] text-gray-700 hover:border-[#157A6E] cursor-pointer"
                >
                  <option value="mrr">Sort: MRR</option>
                  <option value="lastContact">Sort: Last Contact</option>
                  <option value="name">Sort: Name</option>
                </select>
              </>
            )}

            <button
              onClick={() => { setEditingPartner(null); setShowPartnerModal(true); }}
              className="px-4 py-2 bg-[#157A6E] text-white rounded-md text-12px font-semibold hover:bg-[#12675b] transition-colors"
            >
              + Add Partner
            </button>
            {partnersSubView === 'contacts' && (
              <button onClick={() => {
                const csvRows = ['Partner Name,Company,Tier,MRR,Pulse,Trajectory,Friction,Last Contact'];
                advisorsWithDeals.forEach(a => {
                  csvRows.push(`"${a.name}","${a.company}","${a.tier}",${a.mrr},"${a.pulse}","${a.trajectory}","${a.friction}","${a.lastContact}"`);
                });
                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const el = document.createElement('a'); el.href = url; el.download = 'partners-export.csv'; el.click();
                URL.revokeObjectURL(url);
              }} className="flex items-center gap-1.5 px-3 py-2 text-11px font-semibold text-gray-600 border border-[#e8e5e1] rounded-md hover:bg-gray-50 transition-colors">
                <ArrowUpRight className="w-3 h-3" /> Export
              </button>
            )}
          </div>

          {/* ── COMPANIES TABLE VIEW ── */}
          {partnersSubView === 'companies' && (() => {
            const existingCompanies = [...new Set(advisorsWithDeals.map(a => a.company).filter(Boolean))].sort();
            const q = partnerSearch.toLowerCase();

            const companyData = existingCompanies.map(company => {
              const companyAdvisors = advisorsWithDeals.filter(a => a.company === company);
              const companyMRR = companyAdvisors.reduce((s, a) => s + a.mrr, 0);
              const companyDeals = deals.filter(d => companyAdvisors.some(a => a.id === d.advisorId));
              const activeDealCount = companyDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled').length;
              const pipelineMRR = companyDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled').reduce((s, d) => s + d.mrr, 0);

              const pulseMap: Record<string, number> = { 'Strong': 1, 'Steady': 0.7, 'Rising': 0.8, 'Fading': 0.3, 'Flatline': 0.1 };
              const trajMap: Record<string, number> = { 'Accelerating': 1, 'Climbing': 0.8, 'Stable': 0.5, 'Slipping': 0.2, 'Freefall': 0 };
              const fricMap: Record<string, number> = { 'Low': 1, 'Moderate': 0.6, 'High': 0.3, 'Critical': 0 };
              const avgPulse = companyAdvisors.reduce((s, a) => s + (pulseMap[a.pulse] || 0.5), 0) / (companyAdvisors.length || 1);
              const avgTraj = companyAdvisors.reduce((s, a) => s + (trajMap[a.trajectory] || 0.5), 0) / (companyAdvisors.length || 1);
              const avgFric = companyAdvisors.reduce((s, a) => s + (fricMap[a.friction] || 0.5), 0) / (companyAdvisors.length || 1);
              const avgContact = companyAdvisors.reduce((s, a) => {
                const days = getDaysSinceContact(a.lastContact);
                return s + (days < 7 ? 1 : days < 14 ? 0.5 : 0);
              }, 0) / (companyAdvisors.length || 1);
              const relScore = (avgPulse * 0.3 + avgTraj * 0.25 + avgFric * 0.2 + avgContact * 0.25);

              const getScoreBadge = (score: number) => {
                if (score > 0.75) return { label: 'Excellent', color: '#16A34A' };
                if (score > 0.5) return { label: 'Good', color: '#84CC16' };
                if (score > 0.25) return { label: 'Fair', color: '#FBBF24' };
                return { label: 'Needs Work', color: '#EF4444' };
              };

              return {
                name: company,
                contacts: companyAdvisors.length,
                mrr: companyMRR,
                pipeline: pipelineMRR,
                activeDeals: activeDealCount,
                relScore,
                scoreBadge: getScoreBadge(relScore),
              };
            })
            .filter(c => !q || c.name.toLowerCase().includes(q))
            .sort((a, b) => b.mrr - a.mrr);

            const totalCompanyMRR = companyData.reduce((s, c) => s + c.mrr, 0);

            return (
              <>
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAF8]">
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Company</th>
                      <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Contacts</th>
                      <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Active Deals</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">MRR</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Pipeline</th>
                      <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Relationship</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyData.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-12px text-gray-400">No companies match your search</td></tr>
                    ) : (
                      companyData.map((company, i) => (
                        <tr
                          key={company.name}
                          onClick={() => { setCompanyFilter(company.name); setPartnersSubView('contacts'); setPartnerSearch(''); }}
                          className={`cursor-pointer transition-colors hover:bg-[#F0F9F8] ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}
                          style={{ height: 52 }}
                        >
                          <td className="px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#157A6E]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-[#157A6E]" />
                              </div>
                              <span className="text-13px font-semibold text-gray-900">{company.name}</span>
                            </div>
                          </td>
                          <td className="px-4 text-center text-13px text-gray-700">{company.contacts}</td>
                          <td className="px-4 text-center text-13px text-gray-700">{company.activeDeals}</td>
                          <td className="px-4 text-right text-13px font-semibold text-[#157A6E]">{formatCurrency(company.mrr)}</td>
                          <td className="px-4 text-right text-13px text-gray-700">{formatCurrency(company.pipeline)}</td>
                          <td className="px-4 text-center">
                            <span
                              className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full text-white"
                              style={{ backgroundColor: company.scoreBadge.color }}
                            >
                              {company.scoreBadge.label}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Summary bar */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] px-5 py-3 text-center text-12px text-gray-500">
                Showing <strong className="text-gray-800">{companyData.length}</strong> companies · Total MRR: <strong className="text-gray-800">{formatCurrency(totalCompanyMRR)}</strong>
              </div>
              </>
            );
          })()}

          {/* ── CONTACTS DATA TABLE ── */}
          {partnersSubView === 'contacts' && (() => {
            const totalFilteredMRR = sortedAdvisors.reduce((s, a) => s + a.mrr, 0);
            const avgDays = sortedAdvisors.length > 0
              ? (sortedAdvisors.reduce((s, a) => s + getDaysSinceContact(a.lastContact), 0) / sortedAdvisors.length).toFixed(1)
              : '0';

            // Stage styling
            const stageStyles: Record<string, string> = {
              Prospect: 'bg-gray-100 text-gray-600',
              Onboarding: 'bg-blue-50 text-blue-700',
              Activated: 'bg-emerald-50 text-emerald-700',
              Scaling: 'bg-teal-50 text-teal-700',
              Strategic: 'bg-amber-50 text-amber-700',
            };

            // Pulse dot colors
            const pulseDot: Record<string, string> = { Strong: '#16A34A', Steady: '#84CC16', Rising: '#2563EB', Fading: '#F59E0B', Flatline: '#EF4444' };
            const trajDot: Record<string, string> = { Accelerating: '#16A34A', Climbing: '#84CC16', Stable: '#6B7280', Slipping: '#F59E0B', Freefall: '#EF4444' };
            const fricDot: Record<string, string> = { Low: '#16A34A', Moderate: '#F59E0B', High: '#F97316', Critical: '#EF4444' };

            // Generate phone number from advisor id
            const getPhone = (id: string) => {
              const area = Math.floor(seededRandom(id + '-area') * 800) + 200;
              const mid = Math.floor(seededRandom(id + '-mid') * 900) + 100;
              const end = Math.floor(seededRandom(id + '-end') * 9000) + 1000;
              return `(${area}) ${mid}-${end}`;
            };

            return (
              <>
              {/* Company detail header when filtered */}
              {companyFilter && (() => {
                const companyAdvisors = sortedAdvisors;
                const companyMRR = companyAdvisors.reduce((s, a) => s + a.mrr, 0);
                return (
                  <div className="bg-white rounded-[10px] border border-[#157A6E]/30 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#157A6E]/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#157A6E]" />
                      </div>
                      <div>
                        <h3 className="text-[18px] font-semibold font-['Newsreader'] text-gray-900">{companyFilter}</h3>
                        <p className="text-11px text-gray-500">{companyAdvisors.length} contacts · {formatCurrency(companyMRR)} MRR</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCompanyFilter(null)}
                      className="flex items-center gap-1 px-3 py-1.5 text-12px font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ← All Partners
                    </button>
                  </div>
                );
              })()}

              {/* Data table */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAF8]">
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]" style={{ minWidth: 220 }}>Partner</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Stage</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Pulse</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Trajectory</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Friction</th>
                      <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Phone</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">MRR</th>
                      <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Contact</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAdvisors.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-8 text-12px text-gray-400">No partners match your filters</td></tr>
                    ) : (
                      sortedAdvisors.map((a, i) => {
                        const daysSince = getDaysSinceContact(a.lastContact);
                        const stage = getRelationshipStage(a);
                        const initials = a.name.split(' ').map(n => n[0]).join('').slice(0, 2);

                        return (
                          <tr
                            key={a.id}
                            onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}
                            className={`group cursor-pointer transition-colors hover:bg-[#F0F9F8] ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}
                            style={{ height: 52 }}
                          >
                            {/* Name + Company */}
                            <td className="px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#157A6E] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-13px font-semibold text-gray-900 truncate group-hover:text-[#157A6E] transition-colors">{a.name}</p>
                                  <p className="text-[10px] text-gray-400 truncate">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setCompanyFilter(a.company); }}
                                      className="hover:text-[#157A6E] hover:underline transition-colors"
                                    >
                                      {a.company}
                                    </button>
                                  </p>
                                </div>
                              </div>
                            </td>
                            {/* Stage */}
                            <td className="px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${stageStyles[stage] || 'bg-gray-100 text-gray-600'}`}>
                                {stage}
                              </span>
                            </td>
                            {/* Pulse */}
                            <td className="px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-[6px] h-[6px] rounded-full inline-block flex-shrink-0" style={{ backgroundColor: pulseDot[a.pulse] || '#6B7280' }} />
                                <span className="text-11px text-gray-600">{a.pulse}</span>
                              </div>
                            </td>
                            {/* Trajectory */}
                            <td className="px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-[6px] h-[6px] rounded-full inline-block flex-shrink-0" style={{ backgroundColor: trajDot[a.trajectory] || '#6B7280' }} />
                                <span className="text-11px text-gray-600">{a.trajectory}</span>
                              </div>
                            </td>
                            {/* Friction */}
                            <td className="px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-[6px] h-[6px] rounded-full inline-block flex-shrink-0" style={{ backgroundColor: fricDot[a.friction] || '#6B7280' }} />
                                <span className="text-11px text-gray-600">{a.friction}</span>
                              </div>
                            </td>
                            {/* Phone */}
                            <td className="px-3">
                              <span className="text-11px text-gray-500 whitespace-nowrap">{getPhone(a.id)}</span>
                            </td>
                            {/* MRR */}
                            <td className="px-4 text-right">
                              <span className="text-13px font-semibold text-[#157A6E]">{formatCurrency(a.mrr)}</span>
                            </td>
                            {/* Last Contact */}
                            <td className="px-3 text-center">
                              <span className={`text-13px font-medium ${daysSince <= 3 ? 'text-green-500' : daysSince <= 7 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {daysSince}d
                              </span>
                            </td>
                            {/* Actions (hover) */}
                            <td className="px-4">
                              <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded bg-gray-100 hover:bg-[#157A6E] hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="Email">
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded bg-gray-100 hover:bg-[#157A6E] hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="Call">
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded bg-gray-100 hover:bg-[#157A6E] hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="Schedule">
                                  <Calendar className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingPartner(a); setShowPartnerModal(true); }}
                                  className="w-7 h-7 rounded bg-gray-100 hover:bg-[#157A6E] hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary bar */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] px-5 py-3 text-center text-12px text-gray-500">
                Showing <strong className="text-gray-800">{sortedAdvisors.length}</strong> of {advisorsWithDeals.length} partners · Total MRR: <strong className="text-gray-800">{formatCurrency(totalFilteredMRR)}</strong> · Avg Last Contact: <strong className="text-gray-800">{avgDays}d</strong>
              </div>
              </>
            );
          })()}
        </div>
        )}


        {/* ── TSDs SUB-TAB ── */}
        {relationshipViewMode === 'tsds' && (() => {
          const totalTsdIntrosQTD = TSD_COMPANIES.reduce((s, c) => s + c.totalIntrosQTD, 0);
          const totalTsdIntrosAllTime = TSD_COMPANIES.reduce((s, c) => s + c.totalIntrosAllTime, 0);
          const totalTsdRevenue = TSD_COMPANIES.reduce((s, c) => s + c.totalRevenueAttributed, 0);
          const totalTsdContacts = TSD_COMPANIES.reduce((s, c) => s + c.contacts.length, 0);
          const tsdColors: Record<string, string> = { Telarus: '#2563EB', Avant: '#EA580C', Bridgepointe: '#16A34A', Intelisys: '#7C3AED', AppDirect: '#0891B2' };

          // Calculate average relationship score across all TSD companies
          const avgRelationshipScore = TSD_COMPANIES.length > 0
            ? TSD_COMPANIES.reduce((sum, company) => {
                const avgDaysSinceContact = company.contacts.length > 0
                  ? company.contacts.reduce((s, c) => s + getDaysSinceContact(c.lastContact), 0) / company.contacts.length
                  : 0;
                const cIntroTarget = (company as any).introTarget || 8;
                const introsFrequency = company.totalIntrosQTD > cIntroTarget ? 1 : company.totalIntrosQTD > (cIntroTarget / 2) ? 0.5 : 0;
                const recentContact = avgDaysSinceContact < 7 ? 1 : avgDaysSinceContact < 14 ? 0.5 : 0;
                const revenueScale = company.totalRevenueAttributed > 100000 ? 1 : company.totalRevenueAttributed > 50000 ? 0.5 : 0;
                return sum + (introsFrequency + recentContact + revenueScale) / 3;
              }, 0) / TSD_COMPANIES.length
            : 0;

          const getScoreBadge = (score: number) => {
            if (score > 0.75) return { label: 'Excellent', color: '#16A34A' };
            if (score > 0.5) return { label: 'Good', color: '#84CC16' };
            if (score > 0.25) return { label: 'Fair', color: '#FBBF24' };
            return { label: 'Needs Work', color: '#EF4444' };
          };

          const scoreInfo = getScoreBadge(avgRelationshipScore);

          const allTsdContacts = TSD_COMPANIES.flatMap(company =>
            company.contacts.map(contact => ({ ...contact, companyName: company.name, companyColor: tsdColors[company.name] || '#157A6E' }))
          );

          const filteredContacts = allTsdContacts.filter(contact => {
            if (tsdRoleFilter !== 'All' && contact.role !== tsdRoleFilter) return false;
            if (tsdCompanyFilter && contact.companyName !== tsdCompanyFilter) return false;
            if (tsdSearch.trim()) {
              const q = tsdSearch.toLowerCase();
              if (!contact.name.toLowerCase().includes(q) && !contact.title.toLowerCase().includes(q) && !contact.companyName.toLowerCase().includes(q)) return false;
            }
            return true;
          });

          const sortedContacts = [...filteredContacts].sort((a, b) =>
            new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime()
          );

          const engagementColors: Record<string, string> = { High: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-red-100 text-red-700' };
          const sentimentColors: Record<string, string> = { Warm: 'text-emerald-600', Neutral: 'text-gray-500', Cool: 'text-red-500' };
          const responsivenessColors: Record<string, string> = { Fast: 'text-emerald-600', Moderate: 'text-amber-600', Slow: 'text-red-500' };
          const signalTypeColors: Record<string, string> = { positive: 'bg-emerald-50 border-l-emerald-400 text-emerald-800', warning: 'bg-amber-50 border-l-amber-400 text-amber-800', info: 'bg-blue-50 border-l-blue-400 text-blue-800' };

          // ═══ TSD CONTACT DETAIL VIEW ═══
          if (selectedTsdContact) {
            const tc = selectedTsdContact;
            const tsdCompany = TSD_COMPANIES.find(c => c.contacts.some(ct => ct.id === tc.id));
            const companyPartners = tsdCompany?.partners || [];
            const daysSince = getDaysSinceContact(tc.lastContact);

            // Helper to update TSD contact fields inline
            const updateTsdField = (field: string, value: string) => {
              (tc as any)[field] = value;
              setSelectedTsdContact({ ...tc, [field]: value });
              // Persist to localStorage so edits survive refresh
              setTsdContactOverrides(prev => ({
                ...prev,
                [tc.id]: { ...(prev[tc.id] || {}), [field]: value }
              }));
            };

            // Mock activity for this TSD contact
            const tsdActivity = [
              { id: 1, icon: Phone, title: `Call with ${tc.name}`, details: 'Discussed pipeline and upcoming advisor introductions', time: `${daysSince}d ago`, type: 'call' },
              { id: 2, icon: Mail, title: 'Email: Intro for Barry Bazen', details: `${tc.name} introduced Barry Bazen for SD-WAN opportunity`, time: `${daysSince + 3}d ago`, type: 'email' },
              { id: 3, icon: Calendar, title: 'Joint Training Session', details: `Co-hosted enablement session with ${tc.companyName} advisors`, time: `${daysSince + 8}d ago`, type: 'meeting' },
              { id: 4, icon: Mail, title: 'Email: SPIF Update', details: `Sent updated SPIF program details to ${tc.name}`, time: `${daysSince + 14}d ago`, type: 'email' },
              { id: 5, icon: MessageCircle, title: 'Slack: Quick Check-in', details: `${tc.name} flagged a deal needing technical support`, time: `${daysSince + 18}d ago`, type: 'note' },
            ];

            const actIconColors: Record<string, string> = {
              call: 'bg-blue-50 text-blue-600', email: 'bg-purple-50 text-purple-600',
              meeting: 'bg-emerald-50 text-emerald-600', note: 'bg-gray-100 text-gray-600',
            };

            return (
              <div>
                <button
                  onClick={() => setSelectedTsdContact(null)}
                  className="mb-5 flex items-center gap-1.5 text-12px font-medium text-[#157A6E] hover:text-[#0f5550] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to TSDs
                </button>

                <div className="grid grid-cols-12 gap-6">
                  {/* LEFT — Contact Card */}
                  <div className="col-span-5 space-y-5">
                    <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[22px] font-semibold font-['Newsreader'] flex-shrink-0" style={{ backgroundColor: tc.companyColor }}>
                          {tc.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          {editingIntelField === `tsd-${tc.id}-name` ? (
                            <div className="flex gap-1 items-center">
                              <input autoFocus value={editingIntelValue} onChange={e => setEditingIntelValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { updateTsdField('name', editingIntelValue); setEditingIntelField(null); } if (e.key === 'Escape') setEditingIntelField(null); }}
                                className="text-[20px] font-semibold font-['Newsreader'] border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E] w-full" />
                              <button onClick={() => { updateTsdField('name', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <h2 onClick={() => { setEditingIntelField(`tsd-${tc.id}-name`); setEditingIntelValue(tc.name); }} className="text-[22px] font-semibold font-['Newsreader'] text-gray-900 leading-tight cursor-pointer hover:text-[#157A6E] transition-colors">{tc.name}</h2>
                          )}
                          {editingIntelField === `tsd-${tc.id}-title` ? (
                            <div className="flex gap-1 items-center mt-0.5">
                              <input autoFocus value={editingIntelValue} onChange={e => setEditingIntelValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { updateTsdField('title', editingIntelValue); setEditingIntelField(null); } if (e.key === 'Escape') setEditingIntelField(null); }}
                                className="text-12px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E] flex-1" />
                              <button onClick={() => { updateTsdField('title', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <p className="text-12px text-gray-600">
                              <span onClick={() => { setEditingIntelField(`tsd-${tc.id}-title`); setEditingIntelValue(tc.title); }} className="cursor-pointer hover:text-[#157A6E] transition-colors">{tc.title}</span>
                              {' '}at <span className="font-semibold" style={{ color: tc.companyColor }}>{tc.companyName}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2.5 mb-4 pb-4 border-b border-[#e8e5e1]">
                        <div className="flex items-center gap-2.5 text-12px">
                          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {editingIntelField === `tsd-${tc.id}-phone` ? (
                            <div className="flex gap-1 flex-1">
                              <input autoFocus value={editingIntelValue} onChange={e => setEditingIntelValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { updateTsdField('phone', editingIntelValue); setEditingIntelField(null); } if (e.key === 'Escape') setEditingIntelField(null); }}
                                className="flex-1 text-11px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                              <button onClick={() => { updateTsdField('phone', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <span onClick={() => { setEditingIntelField(`tsd-${tc.id}-phone`); setEditingIntelValue(tc.phone); }} className="text-gray-900 font-medium cursor-pointer hover:text-[#157A6E] hover:bg-teal-50/50 rounded px-1 -mx-1 py-0.5 transition-colors">{tc.phone}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-12px">
                          <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {editingIntelField === `tsd-${tc.id}-email` ? (
                            <div className="flex gap-1 flex-1">
                              <input autoFocus value={editingIntelValue} onChange={e => setEditingIntelValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { updateTsdField('email', editingIntelValue); setEditingIntelField(null); } if (e.key === 'Escape') setEditingIntelField(null); }}
                                className="flex-1 text-11px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                              <button onClick={() => { updateTsdField('email', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <span onClick={() => { setEditingIntelField(`tsd-${tc.id}-email`); setEditingIntelValue(tc.email); }} className="text-gray-900 font-medium cursor-pointer hover:text-[#157A6E] hover:bg-teal-50/50 rounded px-1 -mx-1 py-0.5 transition-colors truncate">{tc.email}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-12px">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {editingIntelField === `tsd-${tc.id}-location` ? (
                            <div className="flex gap-1 flex-1">
                              <input autoFocus value={editingIntelValue} onChange={e => setEditingIntelValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { updateTsdField('location', editingIntelValue); setEditingIntelField(null); } if (e.key === 'Escape') setEditingIntelField(null); }}
                                className="flex-1 text-11px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                              <button onClick={() => { updateTsdField('location', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <span onClick={() => { setEditingIntelField(`tsd-${tc.id}-location`); setEditingIntelValue(tc.location); }} className="text-gray-700 cursor-pointer hover:text-[#157A6E] hover:bg-teal-50/50 rounded px-1 -mx-1 py-0.5 transition-colors">{tc.location}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-12px"><Building2 className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-700">{tc.companyName}</span></div>
                        {editingIntelField === `tsd-${tc.id}-linkedin` ? (
                          <div className="flex items-center gap-2.5 text-12px">
                            <ExternalLink className="w-3.5 h-3.5 text-[#0A66C2] flex-shrink-0" />
                            <div className="flex gap-1 flex-1">
                              <input autoFocus value={editingIntelValue} onChange={e => setEditingIntelValue(e.target.value)} placeholder="linkedin.com/in/..."
                                onKeyDown={e => { if (e.key === 'Enter') { updateTsdField('linkedin', editingIntelValue); setEditingIntelField(null); } if (e.key === 'Escape') setEditingIntelField(null); }}
                                className="flex-1 text-11px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                              <button onClick={() => { updateTsdField('linkedin', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ) : tc.linkedin ? (
                          <div className="flex items-center gap-2.5 text-12px">
                            <ExternalLink className="w-3.5 h-3.5 text-[#0A66C2]" />
                            <a href={tc.linkedin.startsWith('http') ? tc.linkedin : `https://${tc.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] font-medium hover:underline" onClick={e => e.stopPropagation()}>LinkedIn Profile</a>
                            <button onClick={() => { setEditingIntelField(`tsd-${tc.id}-linkedin`); setEditingIntelValue(tc.linkedin || ''); }} className="text-gray-300 hover:text-[#157A6E] ml-auto"><Edit className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 text-12px">
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                            <button onClick={() => { setEditingIntelField(`tsd-${tc.id}-linkedin`); setEditingIntelValue(''); }} className="text-gray-400 text-12px italic hover:text-[#0A66C2]">Add LinkedIn...</button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {[
                          { label: 'Email', icon: Mail, action: () => { setLogContactType('email'); setLogCallAdvisor({ id: tc.id, name: tc.name, company: tc.companyName } as any); setShowLogCallModal(true); } }, { label: 'Call', icon: Phone, action: () => { setLogContactType('call'); setLogCallAdvisor({ id: tc.id, name: tc.name, company: tc.companyName } as any); setShowLogCallModal(true); } },
                          { label: 'Schedule', icon: Calendar, action: () => { window.open('https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meeting+with+' + encodeURIComponent(tc.name)); } }, { label: 'Log Call', icon: FileText, action: () => {} },
                        ].map(btn => (
                          <button key={btn.label} onClick={btn.action} className="flex flex-col items-center gap-1 px-2 py-2.5 border border-[#157A6E]/30 text-[#157A6E] rounded-lg hover:bg-[#157A6E]/5 transition-colors">
                            <btn.icon className="w-4 h-4" />
                            <span className="text-[10px] font-medium">{btn.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-400 text-center">Links configured in Settings</p>
                    </div>

                    {/* Key Metrics */}
                    <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Revenue</p>
                          <p className="text-[18px] font-bold text-[#157A6E]">{formatCurrency(tc.revenueAttributed)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Intros QTD</p>
                          <p className="text-[18px] font-bold text-gray-900">{tc.introsQTD}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">All-Time</p>
                          <p className="text-[18px] font-bold text-gray-900">{tc.introsAllTime}</p>
                        </div>
                      </div>
                    </div>

                    {/* Engagement & Signals */}
                    <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                      <h3 className="text-13px font-semibold font-['Newsreader'] text-gray-900 mb-3">Engagement</h3>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-11px text-gray-600">Engagement</span>
                          <span className={`px-2 py-0.5 text-10px font-medium rounded ${engagementColors[tc.engagement] || ''}`}>{tc.engagement}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-11px text-gray-600">Sentiment</span>
                          <span className={`text-11px font-semibold ${sentimentColors[tc.sentiment] || ''}`}>{tc.sentiment}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-11px text-gray-600">Responsiveness</span>
                          <span className={`text-11px font-semibold ${responsivenessColors[tc.responsiveness] || ''}`}>{tc.responsiveness}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-11px text-gray-600">Last Contact</span>
                          <span className={`text-11px font-semibold ${daysSince <= 7 ? 'text-emerald-600' : daysSince <= 14 ? 'text-amber-600' : 'text-red-500'}`}>{daysSince}d ago</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-11px text-gray-600">Comm Pref</span>
                          {editingIntelField === `tsd-${tc.id}-commPref` ? (
                            <div className="flex gap-1">
                              <input autoFocus value={editingIntelValue} onChange={e => setEditingIntelValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { updateTsdField('commPref', editingIntelValue); setEditingIntelField(null); } if (e.key === 'Escape') setEditingIntelField(null); }}
                                className="w-24 text-11px border border-[#157A6E] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                              <button onClick={() => { updateTsdField('commPref', editingIntelValue); setEditingIntelField(null); }} className="text-[#157A6E]"><CheckCircle className="w-3 h-3" /></button>
                              <button onClick={() => setEditingIntelField(null)} className="text-gray-400"><X className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <span onClick={() => { setEditingIntelField(`tsd-${tc.id}-commPref`); setEditingIntelValue(tc.commPref); }} className="text-11px font-medium text-gray-900 cursor-pointer hover:text-[#157A6E] hover:bg-teal-50/50 rounded px-1 -mx-1 py-0.5 transition-colors">{tc.commPref}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {tc.notes && (
                      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                        <h3 className="text-13px font-semibold font-['Newsreader'] text-gray-900 mb-3">Notes</h3>
                        <p className="text-12px text-gray-700 leading-relaxed">{tc.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT — Signal, Activity, Partners */}
                  <div className="col-span-7 space-y-5">
                    {/* Active Signal */}
                    {tc.signal && (
                      <div className={`rounded-[10px] border-l-4 p-4 ${signalTypeColors[tc.signalType] || 'bg-gray-50 border-l-gray-300 text-gray-700'}`}>
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-12px font-semibold mb-0.5">Signal</p>
                            <p className="text-12px">{tc.signal}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                      <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Recent Activity</h3>
                      <div className="space-y-0">
                        {tsdActivity.map((item, idx) => {
                          const IconComp = item.icon;
                          return (
                            <div key={item.id} className="flex gap-3 relative">
                              {idx < tsdActivity.length - 1 && <div className="absolute left-[15px] top-[36px] bottom-0 w-[1.5px] bg-[#e8e5e1]" />}
                              <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 z-10 ${actIconColors[item.type] || 'bg-gray-100 text-gray-600'}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="flex-1 pb-5">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-12px font-medium text-gray-900">{item.title}</p>
                                  <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{item.time}</span>
                                </div>
                                <p className="text-11px text-gray-600 mt-0.5">{item.details}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Partners via this TSD */}
                    {companyPartners.length > 0 && (
                      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Partners via {tc.companyName} ({companyPartners.length})</h3>
                        <div className="space-y-2">
                          {companyPartners.slice(0, 8).map(p => (
                            <div
                              key={p.id}
                              onClick={() => { setSelectedAdvisor(p); setPanelOpen(true); setSelectedTsdContact(null); }}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F0F9F8] cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#157A6E] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                  {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                  <p className="text-12px font-medium text-gray-900">{p.name}</p>
                                  <p className="text-[10px] text-gray-500">{p.company}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-12px font-semibold text-[#157A6E]">{formatCurrency(p.mrr)}</span>
                                <PulseBadge pulse={p.pulse} />
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                              </div>
                            </div>
                          ))}
                          {companyPartners.length > 8 && <p className="text-11px text-gray-400 text-center pt-2">+{companyPartners.length - 8} more partners</p>}
                        </div>
                      </div>
                    )}

                    {/* Add Note */}
                    <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                      <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-3">Notes</h3>
                      <div className="flex gap-2 mb-3">
                        <textarea
                          value={noteInput}
                          onChange={e => setNoteInput(e.target.value)}
                          placeholder={`Write a note about ${tc.name.split(' ')[0]}...`}
                          className="flex-1 text-12px border border-[#e8e5e1] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#157A6E]"
                          rows={2}
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!noteInput.trim()) return;
                          const timestamp = new Date().toLocaleString();
                          setAdvisorNotes(prev => ({ ...prev, [tc.id]: [`[${timestamp}] ${noteInput}`, ...(prev[tc.id] || [])] }));
                          setNoteInput('');
                        }}
                        disabled={!noteInput.trim()}
                        className="px-4 py-1.5 text-11px font-semibold bg-[#157A6E] text-white rounded-lg hover:bg-[#0f5550] disabled:opacity-40 disabled:cursor-not-allowed mb-3"
                      >
                        Save Note
                      </button>
                      {(advisorNotes[tc.id] || []).length > 0 && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-[#e8e5e1]">
                          {(advisorNotes[tc.id] || []).map((note, i) => (
                            <div key={i} className="text-11px text-gray-700 bg-gray-50 rounded-lg p-2.5 leading-relaxed">
                              {note}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // ═══ TSD LIST VIEW ═══
          return (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
              <p className="text-10px text-gray-500 uppercase font-medium">Intros This Quarter</p>
              <p className="text-xl font-bold text-[#157A6E] mt-1">{totalTsdIntrosQTD}</p>
              <p className="text-10px text-gray-400 mt-0.5">{totalTsdIntrosAllTime} all-time</p>
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
              <p className="text-10px text-gray-500 uppercase font-medium">Revenue via TSDs</p>
              <p className="text-xl font-bold text-[#157A6E] mt-1">{formatCurrency(totalTsdRevenue)}</p>
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
              <p className="text-10px text-gray-500 uppercase font-medium">TSD Contacts</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{totalTsdContacts}</p>
              <p className="text-10px text-gray-400 mt-0.5">across {TSD_COMPANIES.length} companies</p>
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
              <p className="text-10px text-gray-500 uppercase font-medium">Relationship Score</p>
              <p className="text-xl font-bold mt-1" style={{ color: scoreInfo.color }}>{scoreInfo.label}</p>
              <p className="text-10px text-gray-400 mt-0.5">{(avgRelationshipScore * 100).toFixed(0)}% health</p>
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={tsdSearch} onChange={(e) => setTsdSearch(e.target.value)} placeholder="Search TSD contacts..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-full text-12px font-['Inter'] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E]/20" />
            </div>
            <select value={tsdRoleFilter} onChange={(e) => setTsdRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-md text-12px font-['Inter'] text-gray-700 hover:border-[#157A6E] cursor-pointer">
              <option value="All">All Roles</option>
              <option value="Leadership">Leadership</option>
              <option value="Channel Manager">Channel Manager</option>
              <option value="PDM/SPDM">PDM/SPDM</option>
              <option value="Sales Engineer">Sales Engineer</option>
            </select>
            <select value={tsdCompanyFilter || ''} onChange={(e) => setTsdCompanyFilter(e.target.value || null)} className="px-3 py-2 border border-gray-200 rounded-md text-12px font-['Inter'] text-gray-700 hover:border-[#157A6E] cursor-pointer">
              <option value="">All TSDs</option>
              {TSD_COMPANIES.map(company => <option key={company.name} value={company.name}>{company.name}</option>)}
            </select>
            <button className="flex items-center gap-2 px-3 py-2 bg-[#157A6E] text-white rounded-md text-12px font-semibold hover:bg-[#126B5F] transition-colors" title="Add a new TSD contact">
              <Plus className="w-4 h-4" /> Add TSD
            </button>
          </div>

          {/* Intro Target Bar — shows when a specific TSD company is selected */}
          {tsdCompanyFilter && (() => {
            const selectedCompany = TSD_COMPANIES.find(c => c.name === tsdCompanyFilter);
            if (!selectedCompany) return null;
            const currentTarget = (selectedCompany as any).introTarget || 8;
            const currentIntros = selectedCompany.totalIntrosQTD;
            const pct = Math.min(100, Math.round((currentIntros / currentTarget) * 100));
            return (
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] px-5 py-3 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-11px font-medium text-gray-600">Intro Target:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={currentTarget}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      // Update the intro target on the company object
                      (selectedCompany as any).introTarget = val;
                    }}
                    className="w-16 px-2 py-1 border border-gray-200 rounded text-12px text-center focus:outline-none focus:ring-1 focus:ring-[#157A6E]"
                  />
                  <span className="text-11px text-gray-400">intros / quarter</span>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#16A34A' : pct >= 50 ? '#FBBF24' : '#EF4444' }} />
                  </div>
                  <span className="text-11px font-semibold" style={{ color: pct >= 100 ? '#16A34A' : pct >= 50 ? '#92400E' : '#EF4444' }}>
                    {currentIntros}/{currentTarget} ({pct}%)
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAF8]">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]" style={{ minWidth: 200 }}>Contact</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Role</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Engagement</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]" style={{ minWidth: 220 }}>Signal</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Phone</th>
                  <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Intros</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Revenue</th>
                  <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Contact</th>
                </tr>
              </thead>
              <tbody>
                {sortedContacts.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-12px text-gray-400">No TSD contacts match your filters</td></tr>
                ) : (
                  sortedContacts.map((contact, i) => {
                    const daysSince = getDaysSinceContact(contact.lastContact);
                    const initials = contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
                    return (
                      <tr
                        key={contact.id}
                        onClick={() => setSelectedTsdContact(contact)}
                        className={`group transition-colors hover:bg-[#F0F9F8] cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}
                        style={{ height: 52 }}
                      >
                        <td className="px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-10px font-bold flex-shrink-0" style={{ backgroundColor: contact.companyColor }}>{initials}</div>
                            <div>
                              <p className="text-13px font-semibold text-gray-900 group-hover:text-[#157A6E] transition-colors">{contact.name}</p>
                              <p className="text-10px text-gray-500">{contact.title} · <span style={{ color: contact.companyColor }} className="font-medium">{contact.companyName}</span></p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4">
                          <span className="inline-block text-10px font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{contact.role}</span>
                        </td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-10px font-medium rounded ${engagementColors[(contact as any).engagement] || 'bg-gray-100 text-gray-600'}`}>{(contact as any).engagement}</span>
                            <span className={`text-10px font-medium ${sentimentColors[(contact as any).sentiment] || ''}`}>{(contact as any).sentiment}</span>
                          </div>
                        </td>
                        <td className="px-4">
                          {(contact as any).signal && (
                            <p className="text-[10px] text-gray-600 truncate max-w-[220px]" title={(contact as any).signal}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${(contact as any).signalType === 'positive' ? 'bg-emerald-500' : (contact as any).signalType === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                              {(contact as any).signal}
                            </p>
                          )}
                        </td>
                        <td className="px-4 text-11px text-gray-600">{contact.phone}</td>
                        <td className="px-4 text-center">
                          <span className="text-13px font-bold text-[#157A6E]">{contact.introsQTD}</span>
                          <span className="text-[10px] text-gray-400 ml-1">/ {contact.introsAllTime}</span>
                        </td>
                        <td className="px-4 text-right text-13px font-bold text-[#157A6E]">{formatCurrency(contact.revenueAttributed)}</td>
                        <td className="px-4 text-center">
                          <span className={`inline-block text-11px font-semibold px-2.5 py-1 rounded-full text-white ${daysSince <= 3 ? 'bg-green-500' : daysSince <= 7 ? 'bg-yellow-500' : 'bg-red-500'}`}>{daysSince}d</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-[10px] border border-[#e8e5e1] px-5 py-3 text-center text-12px text-gray-500">
            Showing <strong className="text-gray-800">{sortedContacts.length}</strong> of <strong className="text-gray-800">{totalTsdContacts}</strong> contacts · Total Revenue: <strong className="text-gray-800">{formatCurrency(sortedContacts.reduce((s, c) => s + c.revenueAttributed, 0))}</strong>
          </div>
        </div>
          );
        })()}


        {/* ── ALL CONTACTS SUB-TAB ── */}
        {relationshipViewMode === 'all' && (() => {
          const q = partnerSearch.toLowerCase();
          const filteredPartners = advisorsWithDeals.filter(a => !q || a.name.toLowerCase().includes(q) || a.company.toLowerCase().includes(q));
          const filteredTsdContacts = TSD_COMPANIES.flatMap(co => co.contacts.map(c => ({ ...c, company: co.name, companyLogo: co.logo }))).filter(c => !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
          const totalContacts = filteredPartners.length + filteredTsdContacts.length;

          const pulseDotAll: Record<string, string> = { Strong: '#16A34A', Steady: '#84CC16', Rising: '#2563EB', Fading: '#F59E0B', Flatline: '#EF4444' };
          const trajDotAll: Record<string, string> = { Accelerating: '#16A34A', Climbing: '#84CC16', Stable: '#6B7280', Slipping: '#F59E0B', Freefall: '#EF4444' };
          const fricDotAll: Record<string, string> = { Low: '#16A34A', Moderate: '#F59E0B', High: '#F97316', Critical: '#EF4444' };
          const engDotAll: Record<string, string> = { High: '#16A34A', Medium: '#F59E0B', Low: '#6B7280' };
          const sentDotAll: Record<string, string> = { Warm: '#16A34A', Cool: '#2563EB', Neutral: '#6B7280' };

          const getPhoneAll = (id: string) => {
            const area = Math.floor(seededRandom(id + '-area') * 800) + 200;
            const mid = Math.floor(seededRandom(id + '-mid') * 900) + 100;
            const end = Math.floor(seededRandom(id + '-end') * 9000) + 1000;
            return `(${area}) ${mid}-${end}`;
          };

          const totalMRR = filteredPartners.reduce((s, a) => s + a.mrr, 0) + filteredTsdContacts.reduce((s, c) => s + c.revenueAttributed, 0);

          return (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  placeholder="Search all contacts..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-full text-12px font-['Inter'] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E]/20"
                />
              </div>
              <span className="text-11px text-gray-400">{totalContacts} contacts</span>
              <button onClick={() => {
                const csvRows = ['Name,Company,Type,Role,MRR/Revenue,Last Contact'];
                filteredPartners.forEach(a => {
                  csvRows.push(`"${a.name}","${a.company}","Partner","",${a.mrr},"${a.lastContact}"`);
                });
                filteredTsdContacts.forEach(c => {
                  csvRows.push(`"${c.name}","${c.company}","TSD","${c.role}",${c.revenueAttributed},"${c.lastContact}"`);
                });
                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const el = document.createElement('a'); el.href = url; el.download = 'all-contacts-export.csv'; el.click();
                URL.revokeObjectURL(url);
              }} className="flex items-center gap-1.5 px-3 py-2 text-11px font-semibold text-gray-600 border border-[#e8e5e1] rounded-md hover:bg-gray-50 transition-colors">
                <ArrowUpRight className="w-3 h-3" /> Export
              </button>
            </div>

            {/* Data table */}
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#FAFAF8]">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]" style={{ minWidth: 220 }}>Contact</th>
                    <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Type</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Pulse / Engagement</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Trajectory / Sentiment</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Friction</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Phone</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">MRR / Revenue</th>
                    <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Contact</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {totalContacts === 0 && (
                    <tr><td colSpan={9} className="text-center py-8 text-12px text-gray-400">No contacts match your search</td></tr>
                  )}
                  {/* Partner rows */}
                  {filteredPartners.map((a, i) => {
                    const daysSince = getDaysSinceContact(a.lastContact);
                    const initials = a.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                    const advisorDeals = deals.filter(d => d.advisorId === a.id);
                    return (
                      <tr
                        key={`p-${a.id}`}
                        onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}
                        className={`group cursor-pointer transition-colors hover:bg-[#F0F9F8] ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}
                        style={{ height: 52 }}
                      >
                        <td className="px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#157A6E] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-13px font-semibold text-gray-900 truncate group-hover:text-[#157A6E] transition-colors">{a.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{a.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700">Partner</span>
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-[6px] h-[6px] rounded-full inline-block flex-shrink-0" style={{ backgroundColor: pulseDotAll[a.pulse] || '#6B7280' }} />
                            <span className="text-11px text-gray-600">{a.pulse}</span>
                          </div>
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-[6px] h-[6px] rounded-full inline-block flex-shrink-0" style={{ backgroundColor: trajDotAll[a.trajectory] || '#6B7280' }} />
                            <span className="text-11px text-gray-600">{a.trajectory}</span>
                          </div>
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-[6px] h-[6px] rounded-full inline-block flex-shrink-0" style={{ backgroundColor: fricDotAll[a.friction] || '#6B7280' }} />
                            <span className="text-11px text-gray-600">{a.friction}</span>
                          </div>
                        </td>
                        <td className="px-3">
                          <span className="text-11px text-gray-500 whitespace-nowrap">{getPhoneAll(a.id)}</span>
                        </td>
                        <td className="px-4 text-right">
                          <span className="text-13px font-semibold text-[#157A6E]">{formatCurrency(a.mrr)}</span>
                          <p className="text-[9px] text-gray-400">{advisorDeals.length} deal{advisorDeals.length !== 1 ? 's' : ''}</p>
                        </td>
                        <td className="px-3 text-center">
                          <span className={`text-13px font-medium ${daysSince <= 3 ? 'text-green-500' : daysSince <= 7 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {daysSince}d
                          </span>
                        </td>
                        <td className="px-4">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded bg-gray-100 hover:bg-[#157A6E] hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="Email">
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded bg-gray-100 hover:bg-[#157A6E] hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="Call">
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded bg-gray-100 hover:bg-[#157A6E] hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="Schedule">
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {/* TSD contact rows */}
                  {filteredTsdContacts.map((c, i) => {
                    const daysSince = Math.floor((new Date().getTime() - new Date(c.lastContact).getTime()) / (1000*60*60*24));
                    const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                    const rowIdx = filteredPartners.length + i;
                    return (
                      <tr
                        key={`t-${c.id}`}
                        className={`group cursor-pointer transition-colors hover:bg-[#F0F9F8] ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}
                        style={{ height: 52 }}
                      >
                        <td className="px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-13px font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">{c.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{c.role} · {c.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700">TSD</span>
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-[6px] h-[6px] rounded-full inline-block flex-shrink-0" style={{ backgroundColor: engDotAll[c.engagement] || '#6B7280' }} />
                            <span className="text-11px text-gray-600">{c.engagement}</span>
                          </div>
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-[6px] h-[6px] rounded-full inline-block flex-shrink-0" style={{ backgroundColor: sentDotAll[c.sentiment] || '#6B7280' }} />
                            <span className="text-11px text-gray-600">{c.sentiment}</span>
                          </div>
                        </td>
                        <td className="px-3">
                          <span className="text-11px text-gray-400">—</span>
                        </td>
                        <td className="px-3">
                          <span className="text-11px text-gray-500 whitespace-nowrap">{getPhoneAll(c.id)}</span>
                        </td>
                        <td className="px-4 text-right">
                          <span className="text-13px font-semibold text-purple-600">{formatCurrency(c.revenueAttributed)}</span>
                          <p className="text-[9px] text-gray-400">{c.introsQTD} intros QTD</p>
                        </td>
                        <td className="px-3 text-center">
                          <span className={`text-13px font-medium ${daysSince <= 3 ? 'text-green-500' : daysSince <= 7 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {daysSince}d
                          </span>
                        </td>
                        <td className="px-4">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded bg-gray-100 hover:bg-purple-500 hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="Email">
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded bg-gray-100 hover:bg-purple-500 hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="Call">
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded bg-gray-100 hover:bg-purple-500 hover:text-white flex items-center justify-center text-gray-400 transition-colors" title="Schedule">
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary bar */}
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] px-5 py-3 text-center text-12px text-gray-500">
              Showing <strong className="text-gray-800">{totalContacts}</strong> contacts ({filteredPartners.length} partners, {filteredTsdContacts.length} TSD) · Total Revenue: <strong className="text-gray-800">{formatCurrency(totalMRR)}</strong>
            </div>
          </div>
          );
        })()}

        {/* ── GROUPS SUB-TAB ── */}
        {relationshipViewMode === 'groups' && (
          <div className="space-y-4">
            {/* Groups Explainer */}
            <div className="bg-gradient-to-r from-[#157A6E]/5 to-teal-50/50 rounded-[10px] border border-[#157A6E]/20 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#157A6E]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[#157A6E]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold font-['Newsreader'] text-gray-900 mb-1">Organize your partners into groups</h3>
                  <p className="text-12px text-gray-600 leading-relaxed">
                    Groups help you manage subsets of your partners more effectively. Set custom cadence rules per group, auto-generate action items when outreach is overdue, and track how you're performing with each segment. Great for organizing by region, tier, product focus, or any criteria that matters to your workflow.
                  </p>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-11px text-gray-500">
                      <Calendar className="w-3 h-3 text-[#157A6E]" />
                      Custom cadence per group
                    </div>
                    <div className="flex items-center gap-1.5 text-11px text-gray-500">
                      <Zap className="w-3 h-3 text-[#157A6E]" />
                      Auto-generate action items
                    </div>
                    <div className="flex items-center gap-1.5 text-11px text-gray-500">
                      <BarChart3 className="w-3 h-3 text-[#157A6E]" />
                      Group performance reports
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Group Form */}
            {showCreateGroup && (
              <div className="bg-white rounded-[10px] border-2 border-[#157A6E]/30 p-5">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-3">Create Contact Group</h3>
                <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name..." className="w-full text-13px border border-[#e8e5e1] rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#157A6E]" />

                {/* Upload spreadsheet option */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg border border-[#e8e5e1] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[#157A6E]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-12px font-medium text-gray-800">Import from spreadsheet</p>
                      <p className="text-[10px] text-gray-500">Upload a .csv or .xlsx with partner names to auto-match</p>
                    </div>
                    <label className="px-3 py-1.5 text-[11px] font-semibold text-[#157A6E] border border-[#157A6E]/30 rounded-lg hover:bg-teal-50 cursor-pointer transition-colors">
                      Upload
                      <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const text = ev.target?.result as string;
                          if (file.name.endsWith('.csv')) {
                            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                            const nameCol = lines[0]?.toLowerCase().includes('name') ? 0 : -1;
                            const dataLines = nameCol >= 0 ? lines.slice(1) : lines;
                            const names = dataLines.map(l => {
                              const cols = l.split(',').map(c => c.replace(/"/g, '').trim());
                              return nameCol >= 0 ? cols[nameCol] : cols[0];
                            }).filter(Boolean);
                            const matched = advisorsWithDeals.filter(a =>
                              names.some(n => a.name.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(a.name.toLowerCase()))
                            );
                            setNewGroupAdvisors(prev => [...new Set([...prev, ...matched.map(a => a.id)])]);
                          }
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                </div>

                <p className="text-11px text-gray-500 mb-2">Or select contacts manually:</p>
                <div className="max-h-48 overflow-y-auto space-y-1 mb-3 border border-[#e8e5e1] rounded-lg p-2">
                  {advisorsWithDeals.map(a => (
                    <label key={a.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="checkbox" checked={newGroupAdvisors.includes(a.id)} onChange={e => setNewGroupAdvisors(prev => e.target.checked ? [...prev, a.id] : prev.filter(id => id !== a.id))} className="rounded border-gray-300 text-[#157A6E] focus:ring-[#157A6E]" />
                      <span className="text-12px text-gray-800">{a.name}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{a.company}</span>
                    </label>
                  ))}
                </div>
                {newGroupAdvisors.length > 0 && (
                  <p className="text-11px text-[#157A6E] font-medium mb-2">{newGroupAdvisors.length} contact{newGroupAdvisors.length !== 1 ? 's' : ''} selected</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (!newGroupName.trim()) return;
                    setContactGroups(prev => [...prev, { id: `grp-${Date.now()}`, name: newGroupName, advisorIds: newGroupAdvisors }]);
                    setNewGroupName(''); setNewGroupAdvisors([]); setShowCreateGroup(false);
                  }} className="px-4 py-2 text-12px font-semibold bg-[#157A6E] text-white rounded-lg hover:bg-[#0f5550]">Create Group</button>
                  <button onClick={() => { setShowCreateGroup(false); setNewGroupName(''); setNewGroupAdvisors([]); }} className="px-4 py-2 text-12px font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
              </div>
            )}

            {contactGroups.length === 0 && !showCreateGroup ? (
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-8 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-13px font-semibold text-gray-700">No groups yet</p>
                <p className="text-11px text-gray-400 mt-1">Create a group to organize contacts and set outreach rules</p>
                <button onClick={() => setShowCreateGroup(true)} className="mt-3 px-4 py-2 text-12px font-semibold text-[#157A6E] border border-[#157A6E] rounded-lg hover:bg-teal-50">Create Group</button>
              </div>
            ) : contactGroups.map(group => (
              <div key={group.id} className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-[14px] font-semibold text-gray-900">{group.name}</h4>
                    <p className="text-11px text-gray-500">{group.advisorIds.length} contacts{group.rules?.cadenceDays ? ` · ${group.rules.cadenceDays}d cadence` : ''}{group.rules?.autoActions ? ' · Auto-actions on' : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowGroupRules(showGroupRules === group.id ? null : group.id)} className="px-3 py-1.5 text-[10px] font-semibold text-[#157A6E] border border-[#157A6E]/30 rounded-lg hover:bg-teal-50">
                      {group.rules ? 'Edit Rules' : 'Set Rules'}
                    </button>
                    <button onClick={() => setContactGroups(prev => prev.filter(g => g.id !== group.id))} className="px-2 py-1.5 text-[10px] text-red-500 hover:text-red-700"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {/* Rules editor */}
                {showGroupRules === group.id && (
                  <div className="mb-4 p-3 bg-teal-50/50 rounded-lg border border-[#157A6E]/20">
                    <h5 className="text-11px font-semibold text-gray-800 mb-2">Outreach Rules</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="text-11px text-gray-600 w-24">Cadence (days)</label>
                        <input type="number" value={group.rules?.cadenceDays || groupRuleCadence} onChange={e => setGroupRuleCadence(e.target.value)} className="w-20 text-11px border border-[#e8e5e1] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#157A6E]" />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-11px text-gray-600 w-24">Auto-actions</label>
                        <button onClick={() => setGroupRuleAutoActions(!groupRuleAutoActions)} className={`w-8 h-5 rounded-full transition-colors ${groupRuleAutoActions ? 'bg-[#157A6E]' : 'bg-gray-300'} relative`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${groupRuleAutoActions ? 'left-3.5' : 'left-0.5'}`} />
                        </button>
                        <span className="text-[10px] text-gray-500">Generate action items when cadence is overdue</span>
                      </div>
                    </div>
                    <button onClick={() => {
                      setContactGroups(prev => prev.map(g => g.id === group.id ? { ...g, rules: { cadenceDays: parseInt(groupRuleCadence), autoActions: groupRuleAutoActions } } : g));
                      setShowGroupRules(null);
                    }} className="mt-2 px-3 py-1.5 text-[10px] font-semibold bg-[#157A6E] text-white rounded hover:bg-[#0f5550]">Save Rules</button>
                  </div>
                )}
                {/* Group performance snapshot */}
                {(() => {
                  const members = group.advisorIds.map(id => advisors.find(adv => adv.id === id)).filter(Boolean) as Advisor[];
                  const groupMRR = members.reduce((s, a) => s + a.mrr, 0);
                  const groupDeals = deals.filter(d => group.advisorIds.includes(d.advisorId));
                  const healthy = members.filter(a => a.pulse === 'Strong' || a.pulse === 'Steady').length;
                  const atRisk = members.filter(a => a.friction === 'Critical' || a.friction === 'High').length;
                  return (
                    <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">MRR</p>
                        <p className="text-[14px] font-bold text-[#157A6E]">{formatCurrency(groupMRR)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Deals</p>
                        <p className="text-[14px] font-bold text-gray-800">{groupDeals.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Healthy</p>
                        <p className="text-[14px] font-bold text-emerald-600">{healthy}/{members.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">At Risk</p>
                        <p className={`text-[14px] font-bold ${atRisk > 0 ? 'text-red-500' : 'text-gray-400'}`}>{atRisk}</p>
                      </div>
                    </div>
                  );
                })()}
                {/* Group members */}
                <div className="space-y-1">
                  {group.advisorIds.map(id => {
                    const a = advisors.find(adv => adv.id === id);
                    if (!a) return null;
                    return (
                      <div key={id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}>
                        <div className={`w-2 h-2 rounded-sm ${a.tier === 'anchor' ? 'bg-[#157A6E]' : a.tier === 'scaling' ? 'bg-amber-400' : a.tier === 'building' ? 'bg-gray-400' : 'bg-blue-400'}`} />
                        <span className="text-12px font-medium text-gray-800 flex-1">{a.name}</span>
                        <span className="text-[10px] text-gray-400">{a.company}</span>
                        <PulseBadge pulse={a.pulse} />
                        <span className="text-11px font-bold text-gray-700">{formatCurrency(a.mrr)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PartnerModal */}
        <PartnerModal
          isOpen={showPartnerModal}
          onClose={() => { setShowPartnerModal(false); setEditingPartner(null); }}
          editingPartner={editingPartner}
          onSave={handleSavePartner}
          existingCompanies={[...new Set(advisorsWithDeals.map(a => a.company).filter(Boolean))].sort()}
        />
      </>
    );
  };

  // ════════════════════════════════════════════════
  // PIPELINE (with Quotes vs Sold metrics)
  // ════════════════════════════════════════════════
  const renderPipeline = () => {
    // ── Deal Detail View ──
    if (selectedDeal) {
      const dealAdvisor = advisors.find(a => a.id === selectedDeal.advisorId);
      const dealAdvisorDeals = deals.filter(d => d.advisorId === selectedDeal.advisorId);
      const stageColors: Record<string, string> = {
        'Discovery': '#3B82F6', 'Qualifying': '#06B6D4', 'Proposal': '#8B5CF6',
        'Negotiating': '#F59E0B', 'Closed Won': '#10B981', 'Closed Lost': '#6B7280', 'Stalled': '#EF4444',
      };
      const stageBg: Record<string, string> = {
        'Discovery': 'bg-blue-50 text-blue-700', 'Qualifying': 'bg-cyan-50 text-cyan-700',
        'Proposal': 'bg-violet-50 text-violet-700', 'Negotiating': 'bg-amber-50 text-amber-700',
        'Closed Won': 'bg-emerald-50 text-emerald-700', 'Closed Lost': 'bg-gray-50 text-gray-600', 'Stalled': 'bg-red-50 text-red-700',
      };
      const healthDotColor: Record<string, string> = { 'Healthy': '#16A34A', 'Monitor': '#F59E0B', 'At Risk': '#F97316', 'Stalled': '#EF4444' };

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
            <button
              onClick={() => setSelectedDeal(null)}
              className="mb-4 flex items-center gap-1 text-12px font-medium text-[#157A6E] hover:text-[#0f5550] transition-colors"
            >
              ← Back to Pipeline
            </button>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-[28px] font-semibold font-['Newsreader'] text-gray-900 mb-2">{selectedDeal.name}</h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-12px font-medium ${stageBg[selectedDeal.stage] || 'bg-gray-100 text-gray-600'}`}>
                    {selectedDeal.stage}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: healthDotColor[selectedDeal.health] || '#6B7280' }} />
                    <span className="text-12px text-gray-600">{selectedDeal.health}</span>
                  </div>
                </div>
                {dealAdvisor && (
                  <p className="text-13px text-gray-600">
                    Advisor:{' '}
                    <button
                      onClick={() => { setSelectedAdvisor(dealAdvisor); setPanelOpen(true); setActiveViewRaw('relationships'); setSelectedDeal(null); }}
                      className="text-[#157A6E] font-medium hover:underline"
                    >
                      {dealAdvisor.name}
                    </button>
                    <span className="text-gray-400"> · {dealAdvisor.company}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingDeal(selectedDeal); setShowDealModal(true); }}
                  className="px-4 py-2 text-12px font-medium border border-[#e8e5e1] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit Deal
                </button>
                {selectedDeal.stage !== 'Closed Won' && selectedDeal.stage !== 'Closed Lost' && (
                  <button
                    onClick={() => {
                      setClosedLostDealId(selectedDeal.id);
                      setShowClosedLostModal(true);
                    }}
                    className="px-4 py-2 text-12px font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Move to Closed Lost
                  </button>
                )}
                <button
                  onClick={() => { if (confirm(`Delete "${selectedDeal.name}"? This cannot be undone.`)) handleDeleteDeal(selectedDeal.id); }}
                  className="px-4 py-2 text-12px font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Key metrics row */}
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                <p className="text-10px text-gray-500 uppercase font-medium">MRR</p>
                <p className="text-[18px] font-bold text-[#157A6E]">{formatCurrency(selectedDeal.mrr)}</p>
              </div>
              <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                <p className="text-10px text-gray-500 uppercase font-medium">Probability</p>
                <p className="text-[18px] font-bold text-gray-800">{selectedDeal.probability || 50}%</p>
              </div>
              <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                <p className="text-10px text-gray-500 uppercase font-medium">Days in Stage</p>
                <p className={`text-[18px] font-bold ${selectedDeal.daysInStage > 20 ? 'text-red-500' : 'text-gray-800'}`}>{selectedDeal.daysInStage}</p>
              </div>
              <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                <p className="text-10px text-gray-500 uppercase font-medium">Close Date</p>
                <p className="text-[15px] font-bold text-gray-800">{selectedDeal.closeDate || '—'}</p>
              </div>
              <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                <p className="text-10px text-gray-500 uppercase font-medium">Competitor</p>
                <p className="text-[15px] font-bold text-gray-800">{selectedDeal.competitor || 'None'}</p>
              </div>
            </div>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left column */}
            <div className="col-span-2 space-y-6">
              {/* Stage Progress */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Stage Progress</h3>
                <div className="flex items-center gap-1">
                  {(['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won'] as const).map((stage, idx) => {
                    const currentIdx = ['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won'].indexOf(selectedDeal.stage);
                    const isActive = idx <= currentIdx && selectedDeal.stage !== 'Stalled';
                    const isCurrent = stage === selectedDeal.stage;
                    return (
                      <div key={stage} className="flex-1">
                        <div
                          className={`h-2 rounded-full ${isActive ? '' : 'bg-gray-200'}`}
                          style={isActive ? { backgroundColor: stageColors[stage] } : {}}
                        />
                        <p className={`text-[9px] mt-1 text-center ${isCurrent ? 'text-[#157A6E] font-bold' : 'text-gray-400'}`}>{stage}</p>
                      </div>
                    );
                  })}
                </div>
                {selectedDeal.stage === 'Stalled' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-12px text-red-700 font-medium">This deal is stalled — {selectedDeal.daysInStage} days without movement</p>
                  </div>
                )}
              </div>

              {/* Action Items */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Action Items</h3>
                {selectedDeal.actionItems && selectedDeal.actionItems.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDeal.actionItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-green-500' : item.status === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                          <p className="text-12px text-gray-800">{item.text}</p>
                        </div>
                        <span className={`text-10px font-medium ${item.status === 'overdue' ? 'text-red-500' : 'text-gray-500'}`}>
                          {item.daysOld}d old
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-12px text-gray-400 italic">No action items</p>
                )}
              </div>

              {/* Notes */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Notes</h3>
                <textarea
                  placeholder="Add notes about this deal..."
                  defaultValue={selectedDeal.overrideNote || ''}
                  className="w-full text-12px border border-[#e8e5e1] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#157A6E]"
                  rows={4}
                />
                <button className="mt-2 px-4 py-2 text-12px font-medium bg-[#157A6E] text-white rounded-lg hover:bg-[#0f5550] transition-colors">Save Note</button>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Advisor Card */}
              {dealAdvisor && (
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                  <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Advisor</h3>
                  <div
                    onClick={() => { setSelectedAdvisor(dealAdvisor); setPanelOpen(true); setActiveViewRaw('relationships'); setSelectedDeal(null); }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#157A6E] flex items-center justify-center text-white text-12px font-bold">
                      {dealAdvisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-13px font-semibold text-gray-900">{dealAdvisor.name}</p>
                      <p className="text-11px text-gray-500">{dealAdvisor.company}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-10px text-gray-500 uppercase">MRR</p>
                      <p className="text-13px font-bold text-[#157A6E]">{formatCurrency(dealAdvisor.mrr)}</p>
                    </div>
                    <div>
                      <p className="text-10px text-gray-500 uppercase">Deals</p>
                      <p className="text-13px font-bold text-gray-800">{dealAdvisorDeals.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Deals by Same Advisor */}
              {dealAdvisor && dealAdvisorDeals.filter(d => d.id !== selectedDeal.id).length > 0 && (
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                  <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Other Deals</h3>
                  <div className="space-y-2">
                    {dealAdvisorDeals.filter(d => d.id !== selectedDeal.id).map(d => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDeal(d)}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="text-12px font-medium text-gray-800">{d.name}</p>
                          <p className="text-10px text-gray-500">{d.stage}</p>
                        </div>
                        <span className="text-12px font-semibold text-[#157A6E]">{formatCurrency(d.mrr)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Probability Ring */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6 text-center">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Win Probability</h3>
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg viewBox="0 0 36 36" className="w-24 h-24">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#157A6E"
                      strokeWidth="3"
                      strokeDasharray={`${selectedDeal.probability || 50}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[20px] font-bold text-[#157A6E]">{selectedDeal.probability || 50}%</span>
                  </div>
                </div>
                <p className="text-11px text-gray-500">Weighted Value: {formatCurrency(selectedDeal.mrr * (selectedDeal.probability || 50) / 100)}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Apply search + health + stage filters
    const filtered = deals.filter(d => {
      if (dealFilter.health !== 'all' && d.health !== dealFilter.health) return false;
      if (dealFilter.stage !== 'all' && d.stage !== dealFilter.stage) return false;
      if (pipelineSearch.trim()) {
        const q = pipelineSearch.toLowerCase();
        const adv = advisors.find(a => a.id === d.advisorId);
        if (
          !d.name.toLowerCase().includes(q) &&
          !(adv?.name || '').toLowerCase().includes(q) &&
          !(adv?.company || '').toLowerCase().includes(q)
        ) return false;
      }
      // Apply timeframe filter
      if (pipelineTimeframe !== 'all') {
        const today = new Date();
        const dealDate = d.closeDate ? new Date(d.closeDate) : new Date(d.lastModified || '');
        let cutoffDate = new Date();
        if (pipelineTimeframe === '30d') cutoffDate.setDate(today.getDate() - 30);
        else if (pipelineTimeframe === '45d') cutoffDate.setDate(today.getDate() - 45);
        else if (pipelineTimeframe === 'quarter') {
          const quarter = Math.floor(today.getMonth() / 3);
          cutoffDate = new Date(today.getFullYear(), quarter * 3, 1);
        }
        else if (pipelineTimeframe === 'ytd') {
          cutoffDate = new Date(today.getFullYear(), 0, 1);
        }
        if (dealDate < cutoffDate) return false;
      }
      return true;
    });

    const totalFilteredMRR = filtered.reduce((s, d) => s + d.mrr, 0);
    const filteredWeighted = filtered.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled')
      .reduce((s, d) => s + d.mrr * (STAGE_WEIGHTS.find(w => w.stage === d.stage)?.weight || 0.3), 0);
    const avgProb = filtered.length > 0
      ? (filtered.reduce((s, d) => s + (d.probability || 50), 0) / filtered.length).toFixed(0)
      : '0';

    // Stage colors + styles
    const stageColors: Record<DealStage, string> = {
      'Discovery': '#3B82F6',
      'Qualifying': '#06B6D4',
      'Proposal': '#8B5CF6',
      'Negotiating': '#F59E0B',
      'Closed Won': '#10B981',
      'Closed Lost': '#6B7280',
      'Stalled': '#EF4444',
    };
    const stageBgStyles: Record<string, string> = {
      'Discovery': 'bg-blue-50 text-blue-700',
      'Qualifying': 'bg-cyan-50 text-cyan-700',
      'Proposal': 'bg-violet-50 text-violet-700',
      'Negotiating': 'bg-amber-50 text-amber-700',
      'Closed Won': 'bg-emerald-50 text-emerald-700',
      'Closed Lost': 'bg-gray-50 text-gray-600',
      'Stalled': 'bg-red-50 text-red-700',
    };
    const healthDot: Record<string, string> = { 'Healthy': '#16A34A', 'Monitor': '#F59E0B', 'At Risk': '#F97316', 'Stalled': '#EF4444', 'Slipping': '#F97316', 'Freefall': '#DC2626', 'Critical': '#991B1B' };

    return (
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <KPICard label="Active Pipeline" value={formatCurrency(pipelineMRR)} change={`${activePipeline.length} deals`} changeType="positive" />
          <KPICard label="Weighted Pipeline" value={formatCurrency(weightedPipeline)} change="Stage-weighted" changeType="neutral" />
          <KPICard label="Stalled" value={`${stalledDeals.length}`} change={formatCurrency(stalledDeals.reduce((s, d) => s + d.mrr, 0))} changeType={stalledDeals.length > 0 ? "negative" : "neutral"} />
        </div>

        {/* View toggle */}
        <div className="flex gap-2 border-b border-[#e8e5e1] pb-2">
          {[
            { key: 'deals', label: 'All Deals' },
            { key: 'kanban', label: 'Kanban' },
            { key: 'quotes-vs-sold', label: 'Quotes vs Sold' },
            { key: 'by-advisor', label: 'By Advisor' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setPipelineMetricsView(tab.key as any)}
              className={`px-4 py-2 text-13px font-medium rounded-t-lg transition-colors ${
                pipelineMetricsView === tab.key ? 'bg-[#157A6E] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── ALL DEALS: Data Table grouped by stage ── */}
        {pipelineMetricsView === 'deals' && (
        <>
          {/* Toolbar */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pipelineSearch}
                onChange={(e) => setPipelineSearch(e.target.value)}
                placeholder="Search deals, advisors, companies..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-full text-12px font-['Inter'] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E]/20"
              />
            </div>
            <select
              value={dealFilter.health}
              onChange={e => setDealFilter({ ...dealFilter, health: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-md text-12px font-['Inter'] text-gray-700 hover:border-[#157A6E] cursor-pointer"
            >
              <option value="all">All Health</option>
              <option value="Healthy">Healthy</option>
              <option value="Monitor">Monitor</option>
              <option value="At Risk">At Risk</option>
              <option value="Stalled">Stalled</option>
            </select>
            <select
              value={dealFilter.stage}
              onChange={e => setDealFilter({ ...dealFilter, stage: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-md text-12px font-['Inter'] text-gray-700 hover:border-[#157A6E] cursor-pointer"
            >
              <option value="all">All Stages</option>
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={pipelineTimeframe}
              onChange={e => setPipelineTimeframe(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-md text-12px font-['Inter'] text-gray-700 hover:border-[#157A6E] cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="45d">Last 45 Days</option>
              <option value="quarter">This Quarter</option>
              <option value="ytd">YTD</option>
            </select>
            <button
              onClick={() => { setShowDealModal(true); setEditingDeal(null); }}
              className="px-4 py-2 bg-[#157A6E] text-white rounded-md text-12px font-semibold hover:bg-[#12675b] transition-colors"
            >
              + Add Deal
            </button>
            <button onClick={() => {
              const csvRows = ['Deal Name,Advisor,Company,Stage,MRR,Probability,Days in Stage,Health'];
              deals.forEach(d => {
                const adv = advisors.find(a => a.id === d.advisorId);
                csvRows.push(`"${d.name}","${adv?.name || ''}","${adv?.company || ''}","${d.stage}",${d.mrr},${d.probability || 0},${d.daysInStage},"${d.health}"`);
              });
              const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'pipeline-export.csv'; a.click();
              URL.revokeObjectURL(url);
            }} className="flex items-center gap-1.5 px-3 py-2 text-11px font-semibold text-gray-600 border border-[#e8e5e1] rounded-md hover:bg-gray-50 transition-colors">
              <ArrowUpRight className="w-3 h-3" /> Export CSV
            </button>
          </div>

          {/* Grouped data table */}
          {stages.map(stage => {
            const stageDeals = filtered.filter(d => d.stage === stage);
            if (stageDeals.length === 0 && dealFilter.stage === 'all') return null;
            if (stageDeals.length === 0) return null;
            const stageMRR = stageDeals.reduce((s, d) => s + d.mrr, 0);

            return (
              <div key={stage} className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
                {/* Stage header */}
                <div className="flex items-center justify-between px-5 py-3 bg-[#FAFAF8] border-b border-[#e8e5e1]">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stageColors[stage] }} />
                    <h3 className="text-13px font-semibold font-['Newsreader'] text-gray-800">{stage}</h3>
                    <span className="text-11px bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">{stageDeals.length}</span>
                  </div>
                  <span className="text-13px font-semibold text-[#157A6E]">{formatCurrency(stageMRR)}</span>
                </div>

                {/* Table */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAF8]/50">
                      <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]" style={{ minWidth: 200 }}>Deal</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Advisor</th>
                      <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Health</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">MRR</th>
                      <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Probability</th>
                      <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Days</th>
                      <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Close Date</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageDeals.map((d, i) => {
                      const adv = advisors.find(a => a.id === d.advisorId);
                      return (
                        <tr
                          key={d.id}
                          onClick={() => setSelectedDeal(d)}
                          className={`group cursor-pointer transition-colors hover:bg-[#F0F9F8] ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}
                          style={{ height: 48 }}
                        >
                          <td className="px-5">
                            <p className="text-13px font-semibold text-gray-900 group-hover:text-[#157A6E] transition-colors">{d.name}</p>
                          </td>
                          <td className="px-4">
                            <p className="text-12px text-gray-800">{adv?.name || 'Unassigned'}</p>
                            <p className="text-[10px] text-gray-400">{adv?.company || ''}</p>
                          </td>
                          <td className="px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-[6px] h-[6px] rounded-full inline-block" style={{ backgroundColor: healthDot[d.health] || '#6B7280' }} />
                              <span className="text-11px text-gray-600">{d.health}</span>
                            </div>
                          </td>
                          <td className="px-4 text-right">
                            <span className="text-13px font-semibold text-[#157A6E]">{formatCurrency(d.mrr)}</span>
                          </td>
                          <td className="px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${d.probability || 50}%` }} />
                              </div>
                              <span className="text-11px text-gray-500">{d.probability || 50}%</span>
                            </div>
                          </td>
                          <td className="px-3 text-center">
                            <span className={`text-12px font-medium ${d.daysInStage > 20 ? 'text-red-500' : d.daysInStage > 10 ? 'text-yellow-500' : 'text-gray-600'}`}>
                              {d.daysInStage}d
                            </span>
                          </td>
                          <td className="px-3">
                            <span className="text-11px text-gray-500">{d.closeDate}</span>
                          </td>
                          <td className="px-4">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingDeal(d); setShowDealModal(true); }}
                                className="w-7 h-7 rounded bg-gray-100 hover:bg-[#157A6E] hover:text-white flex items-center justify-center text-gray-400 transition-colors"
                                title="Edit deal"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Closed Lost */}
          {deals.filter(d => d.stage === 'Closed Lost').length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-400">Closed Lost</span>
                <div className="flex-1 h-px bg-[#e8e5e1]" />
                <span className="text-[10px] text-gray-400">{deals.filter(d => d.stage === 'Closed Lost').length} deals</span>
              </div>
              <div className="space-y-2">
                {deals.filter(d => d.stage === 'Closed Lost').map(deal => {
                  const advisor = advisors.find(a => a.id === deal.advisorId);
                  return (
                    <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-gray-50 rounded-[10px] border border-gray-200 p-4 cursor-pointer hover:bg-gray-100 transition-colors opacity-70">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-13px font-medium text-gray-600 line-through">{deal.name}</p>
                          <p className="text-11px text-gray-400 mt-0.5">{advisor?.name || 'Unknown'} · {advisor?.company || ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-bold text-gray-400">{formatCurrency(deal.mrr)}</p>
                          <p className="text-[10px] text-red-400">Lost</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary bar */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] px-5 py-3 text-center text-12px text-gray-500">
            Showing <strong className="text-gray-800">{filtered.length}</strong> of {deals.length} deals · Total MRR: <strong className="text-gray-800">{formatCurrency(totalFilteredMRR)}</strong> · Weighted: <strong className="text-gray-800">{formatCurrency(filteredWeighted)}</strong> · Avg Probability: <strong className="text-gray-800">{avgProb}%</strong>
          </div>
        </>
        )}

        {/* ── KANBAN (grouped by stage) ── */}
        {pipelineMetricsView === 'kanban' && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-min pb-4">
              {stages.map(stage => {
                const stageDeals = deals.filter(d => d.stage === stage);
                const stageMRR = stageDeals.reduce((s, d) => s + d.mrr, 0);
                return (
                  <div key={stage} className="flex-shrink-0 w-[240px]">
                    <div
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                      onDragEnter={() => setDragOverStage(stage)}
                      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dealId = e.dataTransfer.getData('dealId');
                        if (dealId) {
                          if (stage === 'Closed Lost') {
                            setClosedLostDealId(dealId);
                            setShowClosedLostModal(true);
                          } else {
                            setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: stage as any } : d));
                            fetch('/api/live/deals', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: dealId, stage: stage }),
                            }).catch(console.error);
                          }
                        }
                        setDragOverStage(null);
                      }}
                      className={`rounded-lg overflow-hidden border border-[#e8e5e1] transition-all ${
                        dragOverStage === stage ? 'ring-2 ring-[#157A6E] ring-dashed bg-teal-50/30' : ''
                      } ${stage === 'Stalled' || stage === 'Closed Lost' ? 'bg-red-50/50' : 'bg-[#F7F5F2]'}`}
                    >
                      <div className="border-t-4 p-4" style={{ borderTopColor: stageColors[stage] }}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-13px font-semibold font-['Newsreader'] text-gray-800">{stage}</h4>
                          <span className="text-11px bg-white px-2 py-1 rounded text-gray-600 font-medium">{stageDeals.length}</span>
                        </div>
                        <p className="text-11px text-gray-600 mb-3">{formatCurrency(stageMRR)} MRR</p>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {stageDeals.map(d => {
                            const adv = advisors.find(a => a.id === d.advisorId);
                            return (
                              <div
                                key={d.id}
                                draggable
                                onDragStart={(e) => { e.dataTransfer.setData('dealId', d.id); e.dataTransfer.effectAllowed = 'move'; }}
                                onClick={() => setSelectedDeal(d)}
                                className={`bg-white p-3 rounded-lg hover:shadow-md transition-all cursor-move border border-[#e8e5e1] ${stage === 'Closed Lost' ? 'opacity-70' : ''}`}>
                                <p className={`text-12px font-semibold text-gray-800 mb-1 ${stage === 'Closed Lost' ? 'line-through' : ''}`}>{d.name}</p>
                                <p className="text-10px text-gray-600 mb-2">{adv?.name || 'Unassigned'} · {adv?.company || ''}</p>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-11px font-medium text-[#157A6E]">{formatCurrency(d.mrr)}</span>
                                  <span className="text-10px text-gray-500">{d.daysInStage}d</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <DealHealthBadge health={d.health} />
                                    {d.committed && <span className="text-[8px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">COMMIT</span>}
                                    {d.isUpside && <span className="text-[8px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">UPSIDE</span>}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${d.probability || 50}%` }} />
                                    </div>
                                    <span className="text-[9px] text-gray-400">{d.probability || 50}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {stageDeals.length === 0 && (
                            <p className="text-11px text-gray-400 italic py-4 text-center">No deals</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}

        {/* ── QUOTES VS SOLD ── */}
        {pipelineMetricsView === 'quotes-vs-sold' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
              <p className="text-10px text-gray-500 uppercase font-medium">Total Quotes</p>
              <p className="text-xl font-bold text-gray-800">{deals.length}</p>
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
              <p className="text-10px text-gray-500 uppercase font-medium">Total Sold</p>
              <p className="text-xl font-bold text-green-700">{closedWonDeals.length}</p>
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
              <p className="text-10px text-gray-500 uppercase font-medium">Close Rate</p>
              <p className="text-xl font-bold text-[#157A6E]">{deals.length > 0 ? (closedWonDeals.length / deals.length * 100).toFixed(1) : 0}%</p>
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
              <p className="text-10px text-gray-500 uppercase font-medium">Avg Deal Size</p>
              <p className="text-xl font-bold text-gray-800">{closedWonDeals.length > 0 ? formatCurrency(closedWonMRR / closedWonDeals.length) : '—'}</p>
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAF8]">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Partner</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Q1 Quotes</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Q1 Sold</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Q2 Quotes</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Q2 Sold</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">All-Time</th>
                  <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Sold</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Close Rate</th>
                </tr>
              </thead>
              <tbody>
                {quotesVsSold.map((a, i) => (
                  <tr
                    key={a.id}
                    className={`cursor-pointer transition-colors hover:bg-[#F0F9F8] ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}
                    style={{ height: 48 }}
                    onClick={() => { setSelectedAdvisor(a as any); setPanelOpen(true); setActiveViewRaw('relationships'); }}
                  >
                    <td className="px-5">
                      <p className="text-13px font-semibold text-gray-900">{a.name}</p>
                      <p className="text-[10px] text-gray-400">{a.company}</p>
                    </td>
                    <td className="px-3 text-center text-12px text-gray-600">{a.q1.quotes}</td>
                    <td className="px-3 text-center text-12px font-semibold text-green-700">{a.q1.sold}</td>
                    <td className="px-3 text-center text-12px text-gray-600">{a.q2.quotes}</td>
                    <td className="px-3 text-center text-12px font-semibold text-green-700">{a.q2.sold}</td>
                    <td className="px-3 text-center text-12px font-medium text-gray-800">{a.totalQuotes}</td>
                    <td className="px-3 text-center text-12px font-bold text-green-700">{a.soldDeals}</td>
                    <td className="px-5 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        a.closeRate >= 50 ? 'bg-green-100 text-green-700' :
                        a.closeRate >= 25 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {a.closeRate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* ── BY ADVISOR ── */}
        {pipelineMetricsView === 'by-advisor' && (
        <div className="space-y-4">
          {advisorsWithDeals
            .sort((a, b) => b.mrr - a.mrr)
            .map(adv => {
              const advisorDeals = deals.filter(d => d.advisorId === adv.id);
              const advisorPipelineMRR = advisorDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled').reduce((s, d) => s + d.mrr, 0);
              const isExpanded = expandedStage === adv.id;
              return (
                <div key={adv.id} className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
                  <div
                    onClick={() => setExpandedStage(isExpanded ? null : (adv.id as any))}
                    className="p-5 cursor-pointer hover:bg-[#F7F5F2] transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="text-13px font-semibold font-['Newsreader'] text-gray-800 mb-1">{adv.name}</h3>
                      <p className="text-11px text-gray-600 mb-3">{adv.company}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-12px font-medium text-gray-700">
                          Pipeline: <span className="text-[#157A6E] font-semibold">{formatCurrency(advisorPipelineMRR)}</span>
                        </span>
                        <span className="text-12px font-medium text-gray-700">
                          Deals: <span className="text-gray-800 font-semibold">{advisorDeals.length}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <PulseBadge pulse={adv.pulse} />
                        <TrajectoryBadge trajectory={adv.trajectory} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#e8e5e1] bg-[#F7F5F2] overflow-hidden">
                      {advisorDeals.length === 0 ? (
                        <p className="text-11px text-gray-400 italic p-4">No deals for this advisor</p>
                      ) : (
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-[#FAFAF8]/70">
                              <th className="text-left px-5 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Deal</th>
                              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Stage</th>
                              <th className="text-center px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Health</th>
                              <th className="text-right px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">MRR</th>
                              <th className="text-center px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#e8e5e1]">Days</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advisorDeals.map((d, i) => (
                              <tr
                                key={d.id}
                                onClick={() => setSelectedDeal(d)}
                                className={`cursor-pointer transition-colors hover:bg-[#F0F9F8] ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}
                                style={{ height: 44 }}
                              >
                                <td className="px-5 text-12px font-medium text-gray-800">{d.name}</td>
                                <td className="px-3">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${stageBgStyles[d.stage] || 'bg-gray-100 text-gray-600'}`}>{d.stage}</span>
                                </td>
                                <td className="px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="w-[5px] h-[5px] rounded-full inline-block" style={{ backgroundColor: healthDot[d.health] || '#6B7280' }} />
                                    <span className="text-10px text-gray-500">{d.health}</span>
                                  </div>
                                </td>
                                <td className="px-3 text-right text-12px font-semibold text-[#157A6E]">{formatCurrency(d.mrr)}</td>
                                <td className="px-3 text-center text-11px text-gray-500">{d.daysInStage}d</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════
  // ════════════════════════════════════════════════
  // INTELLIGENCE
  // ════════════════════════════════════════════════
  const renderIntelligence = () => {
    // ── Shared intelligence data ──
    const frictionIssues = advisors.filter(a => !stalledAdvisorIds.includes(a.id) && (a.friction === 'High' || a.friction === 'Critical'));
    const healthyPartners = advisors.filter(a => !stalledAdvisorIds.includes(a.id) && a.friction === 'Low' && (a.pulse === 'Strong' || a.pulse === 'Steady'));

    // Generate signals from real data
    const signals: Array<{type: 'churn' | 'growth' | 'stall' | 'intel'; title: string; desc: string; time: string; source: string; mrr?: number; partnerName?: string}> = [];

    atRiskAdvisors.forEach(a => {
      signals.push({ type: 'churn', title: `Churn Risk — ${a.name}`, desc: `${a.trajectory} trajectory. Pulse: ${a.pulse}. Friction: ${a.friction}. ${a.diagnosis || 'Engagement declining.'}`, time: 'Today', source: 'CRM + Engagement', mrr: a.mrr, partnerName: a.name });
    });
    stalledDeals.slice(0, 3).forEach(d => {
      const adv = advisors.find(a => a.id === d.advisorId);
      signals.push({ type: 'stall', title: `Pipeline Stall — ${d.name}`, desc: `Stuck in ${d.stage} for ${d.daysInStage} days. ${adv?.name || 'Unknown partner'} · ${formatCurrency(d.mrr)} MRR.`, time: `${d.daysInStage}d stalled`, source: 'CRM pipeline', mrr: d.mrr });
    });
    advisors.filter(a => a.trajectory === 'Accelerating' || a.trajectory === 'Climbing').slice(0, 3).forEach(a => {
      signals.push({ type: 'growth', title: `Expansion — ${a.name} (${a.company})`, desc: `${a.trajectory} trajectory with ${a.pulse} pulse. Strong growth potential — cross-sell opportunity.`, time: 'This week', source: 'Engagement data', mrr: Math.round(a.mrr * 0.6), partnerName: a.name });
    });
    coMarketingOpportunities.slice(0, 2).forEach(opp => {
      signals.push({ type: 'intel', title: `Co-Marketing — ${opp.advisor.name}`, desc: opp.reason, time: 'This week', source: 'CRM + LinkedIn', mrr: opp.advisor.mrr, partnerName: opp.advisor.name });
    });


    // All playbooks come from launchedPlaybooks (user-created). No phantom auto-generated playbooks.

    // ── Recommended playbooks (suggestions based on advisor signals) ──
    const recommendedPlaybooks: Array<{template: typeof playbookTemplates[0]; advisors: Advisor[]; reason: string; urgency: 'critical' | 'high' | 'medium'}> = [];

    // Win-back recommendations
    const winBackCandidates = advisors.filter(a => !stalledAdvisorIds.includes(a.id) && (a.pulse === 'Fading' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall') && !launchedPlaybooks.some(p => p.advisorId === a.id));
    if (winBackCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[0], advisors: winBackCandidates.slice(0, 3), reason: `${winBackCandidates.length} partner${winBackCandidates.length > 1 ? 's' : ''} showing declining engagement — ${formatCurrency(winBackCandidates.reduce((s,a)=>s+a.mrr,0))} MRR at risk`, urgency: 'critical' });
    }

    // Onboarding recommendations
    const onboardingCandidates = advisors.filter(a => !stalledAdvisorIds.includes(a.id) && (a.tier === 'launching' || (a.tier === 'building' && Math.floor((Date.now() - new Date(a.connectedSince).getTime()) / 86400000) < 90)));
    if (onboardingCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[1], advisors: onboardingCandidates.slice(0, 3), reason: `${onboardingCandidates.length} partner${onboardingCandidates.length > 1 ? 's' : ''} in first 90 days — first deal velocity is critical`, urgency: 'high' });
    }

    // Tier upgrade recommendations
    const tierUpgradeCandidates = advisors.filter(a => !stalledAdvisorIds.includes(a.id) && a.tier === 'scaling' && (a.pulse === 'Strong' || a.trajectory === 'Accelerating') && !launchedPlaybooks.some(p => p.advisorId === a.id));
    if (tierUpgradeCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[2], advisors: tierUpgradeCandidates.slice(0, 3), reason: `${tierUpgradeCandidates.length} Gold partner${tierUpgradeCandidates.length > 1 ? 's' : ''} showing Platinum potential — invest now to capture growth`, urgency: 'high' });
    }

    // Activation recommendations
    const activationCandidates = advisors.filter(a => !stalledAdvisorIds.includes(a.id) && a.tier === 'building' && (a.engagementBreakdown?.engagement === 'Fading' || a.pulse === 'Fading') && !launchedPlaybooks.some(p => p.advisorId === a.id));
    if (activationCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[3], advisors: activationCandidates.slice(0, 3), reason: `${activationCandidates.length} Silver partner${activationCandidates.length > 1 ? 's' : ''} going dormant — activate before they defect`, urgency: 'medium' });
    }

    // QBR recommendations
    const qbrCandidates = advisors.filter(a => !stalledAdvisorIds.includes(a.id) && (a.tier === 'anchor' || a.tier === 'scaling'));
    if (qbrCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[4], advisors: qbrCandidates.slice(0, 3), reason: `Q2 QBRs due for ${qbrCandidates.length} Anchor & Scaling partners — come with data, not excuses`, urgency: 'medium' });
    }

    // Cross-sell recommendations
    const crossSellCandidates = advisors.filter(a => !stalledAdvisorIds.includes(a.id) && (a.tier === 'anchor' || a.tier === 'scaling') && a.trajectory === 'Accelerating' && !launchedPlaybooks.some(p => p.templateId === 'cross-sell' && p.advisorId === a.id));
    if (crossSellCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[5], advisors: crossSellCandidates.slice(0, 3), reason: `${crossSellCandidates.length} high-performers selling single product — whitespace expansion opportunity`, urgency: 'high' });
    }

    const healthPartners = [...advisors].filter(a => !stalledAdvisorIds.includes(a.id)).sort((a, b) => b.mrr - a.mrr).slice(0, 8);

    const roadmapItems = [
      ...launchedPlaybooks.slice(0, 2).map(p => ({ phase: 'active' as const, title: p.playbookName || p.templateId.replace('-', ' '), desc: `${p.advisorName} · ${(p.customSteps || []).length} steps` })),
      ...coMarketingOpportunities.slice(0, 2).map(o => ({ phase: 'next' as const, title: `Co-Marketing: ${o.advisor.name}`, desc: o.type })),
      { phase: 'planned' as const, title: 'Mid-Quarter Pipeline Review', desc: 'End of April' },
    ];

    const calEvents = [
      { day: 9, label: launchedPlaybooks[0]?.playbookName || launchedPlaybooks[0]?.advisorName || 'No active playbooks' },
      { day: 15, label: 'Campaign launch' },
      { day: 30, label: 'Mid-quarter pipeline review' },
    ];
    const eventDays = calEvents.map(e => e.day);
    const aprilDays = Array.from({length: 30}, (_, i) => i + 1);
    const startPad = 2;
    const today = 6;

    const signalDotColor = (type: string) => {
      switch(type) { case 'churn': return 'bg-red-500'; case 'growth': return 'bg-[#157A6E]'; case 'stall': return 'bg-amber-400'; case 'intel': return 'bg-blue-500'; default: return 'bg-gray-400'; }
    };
    const signalTagStyles = (type: string) => {
      switch(type) { case 'churn': return 'bg-red-100 text-red-800'; case 'growth': return 'bg-green-100 text-green-800'; case 'stall': return 'bg-amber-100 text-amber-800'; case 'intel': return 'bg-blue-100 text-blue-800'; default: return 'bg-gray-100 text-gray-600'; }
    };
    const signalTypeLabel = (type: string) => {
      switch(type) { case 'churn': return 'Churn Risk'; case 'growth': return 'Expansion'; case 'stall': return 'Pipeline Stall'; case 'intel': return 'Co-Marketing'; default: return type; }
    };

    // Filter signals
    const filteredSignals = signalFilter === 'all' ? signals : signals.filter(s => s.type === signalFilter);
    const churnCount = signals.filter(s => s.type === 'churn').length;
    const growthCount = signals.filter(s => s.type === 'growth').length;
    const stallCount = signals.filter(s => s.type === 'stall').length;
    const intelCount = signals.filter(s => s.type === 'intel').length;

    // Diagnostics data
    const criticalPartners = advisors.filter(a => a.friction === 'Critical');
    const highRiskPartners = advisors.filter(a => a.friction === 'High');
    const watchPartners = advisors.filter(a => a.friction === 'Moderate' || (a.pulse === 'Fading' && a.friction !== 'High' && a.friction !== 'Critical'));
    const stablePartners = advisors.filter(a => a.pulse === 'Steady' && a.friction === 'Low');
    const healthyPartnersCount = advisors.filter(a => (a.pulse === 'Strong') && a.friction === 'Low');

    // ── Sub-tab bar (shared) ──
    const subTabBar = (
      <div className="flex gap-0 border-b border-[#e8e5e1] -mx-6 px-6 mb-2">
        {([
          { id: 'overview' as const, label: 'Overview' },
          { id: 'signals' as const, label: 'Signals', count: signals.length },
          { id: 'playbooks' as const, label: 'Playbooks', count: launchedPlaybooks.length },
          { id: 'diagnostics' as const, label: 'Diagnostics' },
          { id: 'resources' as const, label: 'Resources' },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setIntelligenceSubTab(tab.id)}
            className={`px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${intelligenceSubTab === tab.id ? 'text-[#157A6E] border-[#157A6E] font-semibold' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
            {tab.label}
            {'count' in tab && tab.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#F0FAF8] text-[#157A6E] text-[10px] font-bold rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    );

    // ════════════════════════════════════════
    // SUB-TAB: OVERVIEW
    // ════════════════════════════════════════
    if (intelligenceSubTab === 'overview') {
      return (
        <div className="space-y-5">
          {subTabBar}
          <div className="grid grid-cols-4 gap-4">
            <KPICard label="Live Signals (7d)" value={`${signals.length}`} change="Today" changeType="neutral" />
            <KPICard label="Revenue at Risk" value={formatCurrency(atRiskMRR)} change={`${atRiskAdvisors.length} partners flagged`} changeType={atRiskAdvisors.length > 0 ? "negative" : "neutral"} />
            <KPICard label="Expansion Signals" value={`${growthCount}`} change="Cross-sell potential" changeType="positive" />
            <KPICard label="Q2 MRR Progress" value={`${Math.round((totalMRR / 85000) * 100)}%`} change={`${formatCurrency(totalMRR)} / $85K target`} changeType="positive" />
          </div>

          {/* What's Happening */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">What&apos;s Happening</span>
            <div className="flex-1 h-px bg-[#e8e5e1]" />
          </div>
          <div className="grid grid-cols-[2fr_1fr] gap-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Signal Feed</h3>
                <button onClick={() => setIntelligenceSubTab('signals')} className="text-[10px] text-[#157A6E] font-semibold cursor-pointer hover:underline">View all {signals.length} →</button>
              </div>
              <div className="space-y-0 divide-y divide-gray-50">
                {signals.slice(0, 5).map((sig, i) => (
                  <div key={i} className="flex gap-3 py-3 first:pt-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${signalDotColor(sig.type)}`} />
                    <div className="min-w-0">
                      <h4 className="text-[12px] font-semibold text-gray-800">{sig.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{sig.desc}</p>
                      <span className="text-[10px] text-gray-400">{sig.time} · {sig.source}</span>
                      <button onClick={() => { if (sig.partnerName) { const adv = advisors.find(a => a.name === sig.partnerName); if (adv) { setPlaybookModalAdvisor(adv); setPlaybookModalMode('template'); setSelectedPlaybookTemplate(null); setShowPlaybookModal(true); } } }} className="block text-[10px] text-[#157A6E] font-semibold mt-1 hover:underline cursor-pointer">→ Create Playbook</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Q2 2026 Goals</h3>
                <span className="text-[10px] text-[#157A6E] font-semibold cursor-pointer">Edit →</span>
              </div>
              {[
                { name: 'MRR Target', pct: Math.round((totalMRR / 85000) * 100), detail: `${formatCurrency(totalMRR)} of $85K`, warn: false },
                { name: 'Partners Activated', pct: Math.round((advisors.filter(a => a.mrr > 0).length / 15) * 100), detail: `${advisors.filter(a => a.mrr > 0).length} of 15`, warn: false },
                { name: 'Close Rate', pct: deals.length > 0 ? Math.round((closedWonDeals.length / deals.length) * 100) : 0, detail: `${deals.length > 0 ? Math.round((closedWonDeals.length / deals.length) * 100) : 0}% of 35% target`, warn: true },
              ].map((g, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[12px] font-semibold text-gray-800">{g.name}</span>
                    <span className={`text-[11px] font-bold ${g.warn ? 'text-amber-600' : 'text-[#157A6E]'}`}>{g.pct}%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-1">{g.detail}</p>
                  <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${g.warn ? 'bg-amber-400' : 'bg-[#157A6E]'}`} style={{ width: `${Math.min(100, g.warn ? g.pct / 35 * 100 : g.pct)}%` }} />
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">April 2026</h3>
                <div className="grid grid-cols-7 gap-[2px] text-center text-[10px]">
                  {['M','T','W','T','F','S','S'].map((d, i) => (<div key={i} className="font-semibold text-gray-400 py-1">{d}</div>))}
                  {Array.from({length: startPad}).map((_, i) => (<div key={`pad-${i}`} className="py-1 text-transparent">.</div>))}
                  {aprilDays.map(d => (<div key={d} className={`py-1 rounded ${d === today ? 'bg-[#157A6E] text-white font-bold' : eventDays.includes(d) ? 'bg-[#F0FAF8] text-[#157A6E] font-semibold' : 'text-gray-500'}`}>{d}</div>))}
                </div>
                <div className="mt-2 space-y-1">
                  {calEvents.map((ev, i) => (<div key={i} className="flex gap-2 text-[10px]"><span className="text-[#157A6E] font-semibold min-w-[38px]">Apr {ev.day}</span><span className="text-gray-600 truncate">{ev.label}</span></div>))}
                </div>
              </div>
            </div>
          </div>

          {/* What You're Doing About It */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">What You&apos;re Doing About It</span>
            <div className="flex-1 h-px bg-[#e8e5e1]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Active Playbooks</h3>
                <button onClick={() => setIntelligenceSubTab('playbooks')} className="text-[10px] text-[#157A6E] font-semibold cursor-pointer hover:underline">View all {launchedPlaybooks.length} →</button>
              </div>
              <div className="space-y-2">
                {launchedPlaybooks.length > 0 ? launchedPlaybooks.slice(0, 4).map((lp, i) => {
                  const lpSteps = lp.customSteps || [];
                  const effective = lpSteps.length - lp.skippedSteps.length;
                  const pct = effective > 0 ? Math.round((lp.completedSteps.length / effective) * 100) : 100;
                  const lpAdvisor = advisors.find(a => a.id === lp.advisorId);
                  return (
                    <div key={i} className={`border-l-[3px] rounded-r-md bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors ${lp.priority === 'critical' ? 'border-red-500' : lp.priority === 'high' ? 'border-amber-400' : 'border-[#157A6E]'}`}
                      onClick={() => { setIntelligenceSubTab('playbooks'); setEditingPlaybookIdx(i); }}>
                      <h4 className="text-[12px] font-semibold text-gray-800">{lp.playbookName || lp.templateId.replace('-', ' ')}: {lp.advisorName}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-[4px] bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-[#157A6E]">{pct}%</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                        <span className={lp.priority === 'critical' ? 'text-red-500 font-semibold' : lp.priority === 'high' ? 'text-amber-600 font-semibold' : ''}>{lp.priority.charAt(0).toUpperCase() + lp.priority.slice(1)}</span>
                        {lpAdvisor && <span className="text-[#157A6E] font-semibold">{formatCurrency(lpAdvisor.mrr)}</span>}
                        <span>{lpSteps.length} steps</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-4">
                    <p className="text-[11px] text-gray-400">No active playbooks</p>
                    <button onClick={() => setIntelligenceSubTab('playbooks')} className="text-[10px] text-[#157A6E] font-semibold mt-1 hover:underline">Create one →</button>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Partner Health Matrix</h3>
                <span className="text-[10px] text-[#157A6E] font-semibold cursor-pointer">Expand →</span>
              </div>
              <table className="w-full text-[11px]">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-400 text-[10px] uppercase tracking-wide">Partner</th>
                  <th className="text-center py-2 font-medium text-gray-400 text-[10px] uppercase tracking-wide">Pulse</th>
                  <th className="text-center py-2 font-medium text-gray-400 text-[10px] uppercase tracking-wide">Friction</th>
                  <th className="text-center py-2 font-medium text-gray-400 text-[10px] uppercase tracking-wide">Trend</th>
                  <th className="text-right py-2 font-medium text-gray-400 text-[10px] uppercase tracking-wide">MRR</th>
                </tr></thead>
                <tbody>
                  {healthPartners.map(a => (
                    <tr key={a.id} className="border-b border-gray-50 cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); setActiveViewRaw('relationships'); }}>
                      <td className="py-2 font-medium text-gray-800">{a.name}</td>
                      <td className="py-2 text-center"><PulseBadge pulse={a.pulse} /></td>
                      <td className="py-2 text-center"><FrictionBadge level={a.friction} /></td>
                      <td className="py-2 text-center"><span className={`text-[12px] ${a.trajectory === 'Accelerating' || a.trajectory === 'Climbing' ? 'text-[#157A6E]' : a.trajectory === 'Slipping' || a.trajectory === 'Freefall' ? 'text-red-500' : 'text-amber-500'}`}>{a.trajectory === 'Accelerating' || a.trajectory === 'Climbing' ? '↑' : a.trajectory === 'Slipping' || a.trajectory === 'Freefall' ? '↓' : '→'}</span></td>
                      <td className="py-2 text-right text-gray-700 font-medium">{formatCurrency(a.mrr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Portfolio Diagnostics */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Portfolio Diagnostics</span>
            <div className="flex-1 h-px bg-[#e8e5e1]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Diagnostics</h3>
                <button onClick={() => setIntelligenceSubTab('diagnostics')} className="text-[10px] text-[#157A6E] font-semibold cursor-pointer hover:underline">Full view →</button>
              </div>
              {diagnosticRows.length === 0 ? <p className="text-[11px] text-gray-400 italic">All partners healthy</p> : (
                <div className="space-y-2">
                  {diagnosticRows.slice(0, 5).map((row, i) => {
                    const advisor = advisors.find(a => a.name === row.advisor);
                    return (
                      <div key={i} className={`p-2.5 rounded-lg cursor-pointer transition-colors ${row.friction === 'Critical' ? 'bg-red-50 hover:bg-red-100' : row.friction === 'High' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                        onClick={() => { if (advisor) { setSelectedAdvisor(advisor); setPanelOpen(true); } }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold text-gray-800">{row.advisor}</span>
                          <PulseBadge pulse={row.pulse} />
                          <FrictionBadge level={row.friction} />
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{row.diagnosis}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Partner Roadmaps</h3>
                <span className="text-[10px] text-[#157A6E] font-semibold cursor-pointer">Plan →</span>
              </div>
              <div className="space-y-0 divide-y divide-gray-100">
                {roadmapItems.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 first:pt-0">
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${item.phase === 'active' ? 'bg-green-100 text-green-700' : item.phase === 'next' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{item.phase}</span>
                    <div className="min-w-0">
                      <h5 className="text-[12px] font-semibold text-gray-800 truncate">{item.title}</h5>
                      <p className="text-[10px] text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ════════════════════════════════════════
    // SUB-TAB: SIGNALS
    // ════════════════════════════════════════
    if (intelligenceSubTab === 'signals') {
      return (
        <div className="space-y-5">
          {subTabBar}
          {/* Signal-specific KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <KPICard label="Churn Risks" value={`${churnCount}`} change={`${formatCurrency(atRiskMRR)} MRR at risk`} changeType="negative" />
            <KPICard label="Expansion Signals" value={`${growthCount}`} change="Cross-sell potential" changeType="positive" />
            <KPICard label="Pipeline Stalls" value={`${stallCount}`} change={`${stalledDeals.length} deals affected`} changeType="neutral" />
            <KPICard label="Intel / Co-Marketing" value={`${intelCount}`} change={`${intelCount} candidates`} changeType="positive" />
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {([
              { id: 'all' as const, label: 'All', count: signals.length, style: 'border-gray-300 text-gray-700' },
              { id: 'churn' as const, label: 'Churn Risk', count: churnCount, style: 'border-red-200 text-red-800' },
              { id: 'growth' as const, label: 'Expansion', count: growthCount, style: 'border-green-200 text-green-800' },
              { id: 'stall' as const, label: 'Pipeline Stall', count: stallCount, style: 'border-amber-200 text-amber-800' },
              { id: 'intel' as const, label: 'Intel', count: intelCount, style: 'border-blue-200 text-blue-800' },
            ]).map(f => (
              <button key={f.id} onClick={() => setSignalFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${signalFilter === f.id ? f.style + ' bg-gray-50 font-semibold' : 'border-gray-200 text-gray-400 hover:text-gray-600'}`}>
                {f.label}<span className="ml-1.5 text-[10px] font-bold">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Signal cards + timeline sidebar */}
          <div className="grid grid-cols-[1fr_280px] gap-4">
            <div className="space-y-3">
              {filteredSignals.map((sig, i) => (
                <div key={i} className="bg-white rounded-[10px] border border-[#e8e5e1] p-5 flex gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${signalDotColor(sig.type)}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide mb-1.5 ${signalTagStyles(sig.type)}`}>{signalTypeLabel(sig.type)}</span>
                    <h3 className="text-[14px] font-bold text-gray-800 font-serif">{sig.title}</h3>
                    <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{sig.desc}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                      <span>{sig.time}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-500">{sig.source}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {sig.mrr && (
                      <div className={`text-[16px] font-bold ${sig.type === 'growth' || sig.type === 'intel' ? 'text-[#157A6E]' : 'text-red-500'}`}>
                        {sig.type === 'growth' ? '+' : ''}{formatCurrency(sig.mrr)}
                      </div>
                    )}
                    <button onClick={() => { if (sig.partnerName) { const adv = advisors.find(a => a.name === sig.partnerName); if (adv) { setPlaybookModalAdvisor(adv); setPlaybookModalMode('template'); setSelectedPlaybookTemplate(null); setShowPlaybookModal(true); } } }} className="mt-2 px-3 py-1.5 bg-[#157A6E] text-white text-[11px] font-semibold rounded-md hover:bg-[#126a5f] transition-colors">→ Create Playbook</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline sidebar */}
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 self-start sticky top-[105px]">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Signal Timeline</h3>
              {[
                { day: 'Today — April 6', items: signals.filter(s => s.time === 'Today').map(s => ({ dot: signalDotColor(s.type), text: s.title, time: s.time })) },
                { day: 'This Week', items: signals.filter(s => s.time === 'This week').map(s => ({ dot: signalDotColor(s.type), text: s.title, time: s.time })) },
                { day: 'Earlier', items: signals.filter(s => s.time !== 'Today' && s.time !== 'This week').map(s => ({ dot: signalDotColor(s.type), text: s.title, time: s.time })) },
              ].filter(g => g.items.length > 0).map((group, gi) => (
                <div key={gi} className="mb-3">
                  <div className="text-[10px] font-bold text-gray-800 mb-2 pb-1 border-b border-gray-100">{group.day}</div>
                  {group.items.map((item, ii) => (
                    <div key={ii} className="flex items-start gap-2 py-1.5">
                      <div className={`w-[7px] h-[7px] rounded-full mt-1 shrink-0 ${item.dot}`} />
                      <div>
                        <p className="text-[10px] text-gray-600 leading-snug">{item.text}</p>
                        <span className="text-[9px] text-gray-400">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ════════════════════════════════════════
    // SUB-TAB: PLAYBOOKS
    // ════════════════════════════════════════
    if (intelligenceSubTab === 'playbooks') {
      const protectedMRR = launchedPlaybooks.filter(p => p.priority === 'critical' || p.priority === 'medium').reduce((s, p) => {
        const adv = advisors.find(a => a.id === p.advisorId);
        return s + (adv?.mrr || 0);
      }, 0);
      const expansionMRR = launchedPlaybooks.filter(p => p.priority === 'high').reduce((s, p) => {
        const adv = advisors.find(a => a.id === p.advisorId);
        return s + (adv?.mrr || 0);
      }, 0);
      const avgSteps = launchedPlaybooks.length > 0 ? Math.round(launchedPlaybooks.reduce((s, p) => s + (p.customSteps?.length || 0), 0) / launchedPlaybooks.length) : 0;

      const phaseColors: Record<string, string> = {
        'Diagnose': 'bg-red-100 text-red-700', 'Engage': 'bg-orange-100 text-orange-700', 'Recover': 'bg-amber-100 text-amber-700', 'Activate': 'bg-green-100 text-green-700',
        'Week 1': 'bg-blue-100 text-blue-700', 'Week 2': 'bg-blue-100 text-blue-700', 'Week 3': 'bg-indigo-100 text-indigo-700', 'Month 1': 'bg-violet-100 text-violet-700', 'Month 2': 'bg-purple-100 text-purple-700', 'Month 3': 'bg-fuchsia-100 text-fuchsia-700',
        'Plan': 'bg-blue-100 text-blue-700', 'Invest': 'bg-indigo-100 text-indigo-700', 'Execute': 'bg-amber-100 text-amber-700', 'Accelerate': 'bg-green-100 text-green-700',
        'Research': 'bg-gray-100 text-gray-700', 'Re-engage': 'bg-amber-100 text-amber-700', 'Assess': 'bg-blue-100 text-blue-700',
        'Prepare': 'bg-blue-100 text-blue-700', 'Follow-up': 'bg-green-100 text-green-700',
        'Analyze': 'bg-indigo-100 text-indigo-700', 'Enable': 'bg-amber-100 text-amber-700', 'Incentivize': 'bg-purple-100 text-purple-700', 'Measure': 'bg-green-100 text-green-700',
      };

      // ── ACTIVE PLAYBOOK INSTANCE EDIT VIEW ──
      if (editingPlaybookIdx !== null) {
        const editPb = launchedPlaybooks[editingPlaybookIdx];
        if (!editPb) { setEditingPlaybookIdx(null); return null; }
        const editTmplRaw = playbookTemplates.find(t => t.id === editPb.templateId);
        const isCustomOrAi = editPb.templateId === 'custom' || editPb.templateId === 'ai-generated';
        const editTmpl = editTmplRaw || {
          id: editPb.templateId,
          icon: isCustomOrAi ? (editPb.templateId === 'ai-generated' ? '✦' : '✎') : '📋',
          title: editPb.playbookName || editPb.templateId.replace('-', ' '),
          subtitle: isCustomOrAi ? `${editPb.templateId === 'ai-generated' ? 'AI-generated' : 'Custom'} playbook` : 'Playbook',
          category: editPb.templateId === 'ai-generated' ? 'AI-Built' : 'Custom',
          duration: `${(editPb.customSteps || []).length} steps`,
          steps: editPb.customSteps || [],
          bgColor: 'bg-[#F7F5F2]',
          borderColor: 'border-l-[#157A6E]',
          tagColor: 'bg-teal-100 text-teal-800',
          color: '#157A6E',
          applicableTo: 'All Partners',
        };
        const editAdvisor = advisors.find(a => a.id === editPb.advisorId);
        const activeSteps = editPb.customSteps || editTmpl.steps;

        // Group steps by phase
        const editPhases = activeSteps.reduce<Array<{phase: string; steps: typeof activeSteps; startIdx: number}>>((acc, step, idx) => {
          const existing = acc.find(p => p.phase === step.phase);
          if (existing) { existing.steps.push(step); } else { acc.push({ phase: step.phase, steps: [step], startIdx: idx }); }
          return acc;
        }, []);

        const effectiveSteps = activeSteps.length - editPb.skippedSteps.length;
        const editPct = effectiveSteps > 0 ? Math.round((editPb.completedSteps.length / effectiveSteps) * 100) : 100;

        return (
          <div className="space-y-5">
            {subTabBar}

            {/* Back + header */}
            <div className="flex items-center justify-between">
              <button onClick={() => setEditingPlaybookIdx(null)} className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-[#157A6E] transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Playbooks
              </button>
              <button
                onClick={() => { if (confirm('Delete this playbook? This cannot be undone.')) handleDeletePlaybook(editingPlaybookIdx!); }}
                className="px-3 py-1.5 text-[11px] font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete Playbook
              </button>
            </div>

            <div className={`${editTmpl.bgColor} rounded-[12px] border border-[#e8e5e1] p-6 border-l-4 ${editTmpl.borderColor}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[28px]">{editTmpl.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${editTmpl.tagColor}`}>{editTmpl.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${editPb.priority === 'critical' ? 'bg-red-100 text-red-800' : editPb.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{editPb.priority}</span>
                    </div>
                    <h2 className="text-[20px] font-bold text-gray-800 font-serif">{editTmpl.title}: {editAdvisor?.name || editPb.advisorName}</h2>
                    <p className="text-[13px] text-gray-500 mt-0.5">{editAdvisor?.company || ''} · {editAdvisor ? formatCurrency(editAdvisor.mrr) : ''} MRR · Assigned {new Date(editPb.launchedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] text-gray-400">{editTmpl.duration}</div>
                    <div className="text-[14px] font-bold" style={{ color: editTmpl.color }}>{editPct}% complete</div>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-[8px] bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${editPct}%`, backgroundColor: editTmpl.color }} />
                </div>
                <span className="text-[12px] font-bold" style={{ color: editTmpl.color }}>{editPb.completedSteps.length}/{effectiveSteps}{editPb.skippedSteps.length > 0 ? ` (${editPb.skippedSteps.length} skipped)` : ''}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-5">
              {/* LEFT: Editable timeline (7 cols) */}
              <div className="col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-500 whitespace-nowrap">Action Steps</span>
                  <div className="flex-1 h-px bg-[#e8e5e1]" />
                  <button onClick={() => {
                    const newStep = { day: (activeSteps[activeSteps.length - 1]?.day || 0) + 7, label: 'New action step', desc: 'Describe what needs to happen', phase: activeSteps[activeSteps.length - 1]?.phase || 'Execute' };
                    const updatedSteps = [...activeSteps, newStep];
                    setLaunchedPlaybooks(prev => prev.map((p, i) => i === editingPlaybookIdx ? { ...p, customSteps: updatedSteps } : p));
                  }} className="text-[10px] text-[#157A6E] font-semibold hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Step
                  </button>
                </div>

                {editPhases.map((phase, pi) => {
                  // Calculate start index of this phase in the overall steps array
                  let globalIdx = 0;
                  for (let pp = 0; pp < pi; pp++) globalIdx += editPhases[pp].steps.length;

                  return (
                    <div key={pi} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${phaseColors[phase.phase] || 'bg-gray-100 text-gray-600'}`}>{phase.phase}</span>
                      </div>
                      <div className="space-y-0">
                        {phase.steps.map((step, si) => {
                          const stepIdx = globalIdx + si;
                          const isDone = editPb.completedSteps.includes(stepIdx);
                          const isSkipped = editPb.skippedSteps.includes(stepIdx);
                          const isNext = !isDone && !isSkipped && (stepIdx === 0 || editPb.completedSteps.includes(stepIdx - 1) || editPb.skippedSteps.includes(stepIdx - 1));

                          return (
                            <div key={si} className={`flex gap-3 relative group ${isSkipped ? 'opacity-40' : ''}`}>
                              <div className="flex flex-col items-center">
                                <div onClick={() => {
                                  if (isSkipped) return;
                                  setLaunchedPlaybooks(prev => prev.map((p, i) => i === editingPlaybookIdx ? {
                                    ...p, completedSteps: isDone ? p.completedSteps.filter(x => x !== stepIdx) : [...p.completedSteps, stepIdx]
                                  } : p));
                                }} className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 cursor-pointer transition-all border-2 ${isSkipped ? 'bg-gray-100 text-gray-300 border-dashed border-gray-300' : isDone ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' : isNext ? 'text-white hover:opacity-80 border-transparent' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'}`}
                                  style={isNext ? { backgroundColor: editTmpl.color } : {}}>
                                  {isSkipped ? '—' : isDone ? '✓' : step.day}
                                </div>
                                {si < phase.steps.length - 1 && <div className="w-px flex-1 min-h-[20px]" style={{ backgroundColor: `${editTmpl.color}30` }} />}
                              </div>
                              <div className="pb-4 flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={step.label}
                                      onChange={(e) => {
                                        const updated = [...activeSteps];
                                        updated[stepIdx] = { ...updated[stepIdx], label: e.target.value };
                                        setLaunchedPlaybooks(prev => prev.map((p, i) => i === editingPlaybookIdx ? { ...p, customSteps: updated } : p));
                                      }}
                                      className={`text-[13px] font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#157A6E] focus:outline-none w-full transition-colors ${isSkipped ? 'text-gray-300 line-through italic' : isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                                    />
                                    {!isSkipped && (
                                      <textarea
                                        value={step.desc}
                                        onChange={(e) => {
                                          const updated = [...activeSteps];
                                          updated[stepIdx] = { ...updated[stepIdx], desc: e.target.value };
                                          setLaunchedPlaybooks(prev => prev.map((p, i) => i === editingPlaybookIdx ? { ...p, customSteps: updated } : p));
                                        }}
                                        rows={2}
                                        className="text-[11px] text-gray-500 mt-0.5 leading-relaxed bg-transparent border border-transparent hover:border-gray-200 focus:border-[#157A6E] focus:outline-none w-full rounded px-1 -mx-1 resize-none transition-colors"
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all mt-1">
                                    <button onClick={() => {
                                      setLaunchedPlaybooks(prev => prev.map((p, i) => i === editingPlaybookIdx ? {
                                        ...p,
                                        skippedSteps: isSkipped ? p.skippedSteps.filter(x => x !== stepIdx) : [...p.skippedSteps, stepIdx],
                                        completedSteps: isSkipped ? p.completedSteps : p.completedSteps.filter(x => x !== stepIdx),
                                      } : p));
                                    }} className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${isSkipped ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}>
                                      {isSkipped ? 'Unskip' : 'Skip'}
                                    </button>
                                    <button onClick={() => {
                                      const updated = activeSteps.filter((_, idx) => idx !== stepIdx);
                                      const updatedCompleted = editPb.completedSteps.filter(x => x !== stepIdx).map(x => x > stepIdx ? x - 1 : x);
                                      const updatedSkipped = editPb.skippedSteps.filter(x => x !== stepIdx).map(x => x > stepIdx ? x - 1 : x);
                                      setLaunchedPlaybooks(prev => prev.map((p, i) => i === editingPlaybookIdx ? { ...p, customSteps: updated, completedSteps: updatedCompleted, skippedSteps: updatedSkipped } : p));
                                    }} className="text-gray-300 hover:text-red-400">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] font-medium ${isSkipped ? 'text-gray-300 italic' : isDone ? 'text-green-500' : isNext ? 'font-bold' : 'text-gray-300'}`} style={isNext ? { color: editTmpl.color } : {}}>
                                    {isSkipped ? 'Skipped for this advisor' : isDone ? 'Completed' : isNext ? 'Current step' : `Day ${step.day}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RIGHT: Partner info + notes (5 cols) */}
              <div className="col-span-5 space-y-4">
                {/* Partner card */}
                {editAdvisor && (
                  <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-3">Assigned Partner</h4>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#157A6E] rounded-full flex items-center justify-center text-white text-[14px] font-semibold font-serif shrink-0">
                        {editAdvisor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-gray-800">{editAdvisor.name}</div>
                        <div className="text-[11px] text-gray-500">{editAdvisor.company} · {editAdvisor.tier === 'anchor' ? 'Anchor' : editAdvisor.tier === 'scaling' ? 'Scaling' : editAdvisor.tier === 'building' ? 'Building' : 'Launching'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 rounded-md p-2 text-center">
                        <div className="text-[9px] text-gray-400">MRR</div>
                        <div className="text-[13px] font-bold text-[#157A6E]">{formatCurrency(editAdvisor.mrr)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-2 text-center">
                        <div className="text-[9px] text-gray-400">Pulse</div>
                        <div className="text-[13px] font-bold text-gray-800">{editAdvisor.pulse}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-2 text-center">
                        <div className="text-[9px] text-gray-400">Trajectory</div>
                        <div className="text-[13px] font-bold text-gray-800">{editAdvisor.trajectory}</div>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedAdvisor(editAdvisor); setPanelOpen(true); setActiveViewRaw('relationships'); setEditingPlaybookIdx(null); }}
                      className="w-full mt-3 px-3 py-2 text-[11px] font-medium text-[#157A6E] border border-[#157A6E]/30 rounded-lg hover:bg-[#157A6E]/5 transition-colors">
                      View Full Profile →
                    </button>
                  </div>
                )}

                {/* Playbook notes */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Playbook Notes</h4>
                  <textarea
                    value={editPb.notes || ''}
                    onChange={(e) => {
                      setLaunchedPlaybooks(prev => prev.map((p, i) => i === editingPlaybookIdx ? { ...p, notes: e.target.value } : p));
                    }}
                    placeholder={`Notes specific to this ${editTmpl.title} for ${editAdvisor?.name || editPb.advisorName}...`}
                    className="w-full text-[12px] border border-[#e8e5e1] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#157A6E] resize-none"
                    rows={4}
                  />
                </div>

                {/* Quick stats */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-3">Progress</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Completed', value: `${editPb.completedSteps.length}/${effectiveSteps}` },
                      { label: 'Skipped', value: `${editPb.skippedSteps.length}` },
                      { label: 'Progress', value: `${editPct}%` },
                      { label: 'Duration', value: editTmpl.duration },
                    ].map((stat, si) => (
                      <div key={si} className="bg-gray-50 rounded-md p-2.5 text-center">
                        <div className="text-[9px] text-gray-400">{stat.label}</div>
                        <div className="text-[14px] font-bold text-gray-800">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority adjustment */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Priority</h4>
                  <div className="flex gap-2">
                    {(['critical', 'high', 'medium'] as const).map(p => (
                      <button key={p} onClick={() => {
                        setLaunchedPlaybooks(prev => prev.map((pb, i) => i === editingPlaybookIdx ? { ...pb, priority: p } : pb));
                      }} className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors ${editPb.priority === p
                        ? p === 'critical' ? 'bg-red-500 text-white' : p === 'high' ? 'bg-amber-400 text-white' : 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delete playbook */}
                <button onClick={() => {
                  setLaunchedPlaybooks(prev => prev.filter((_, i) => i !== editingPlaybookIdx));
                  setEditingPlaybookIdx(null);
                }} className="w-full px-4 py-2.5 text-[11px] font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  Remove This Playbook
                </button>
              </div>
            </div>
          </div>
        );
      }

      // ── PLAYBOOK DETAIL / ASSIGNMENT VIEW ──
      if (selectedPlaybookTemplate) {
        const tmpl = playbookTemplates.find(t => t.id === selectedPlaybookTemplate);
        if (!tmpl) { setSelectedPlaybookTemplate(null); return null; }

        // Get the matching recommendation to find suggested advisors
        const matchingRec = recommendedPlaybooks.find(r => r.template.id === tmpl.id);
        const suggestedAdvisors = matchingRec?.advisors || [];
        // All advisors as assignable options
        const allAssignable = advisors;
        const totalAssigneeMRR = playbookAssignees.reduce((s, id) => { const a = advisors.find(x => x.id === id); return s + (a?.mrr || 0); }, 0);
        const alreadyLaunched = launchedPlaybooks.filter(lp => lp.templateId === tmpl.id);

        // Group steps by phase
        const phases = tmpl.steps.reduce<Array<{phase: string; steps: typeof tmpl.steps}>>((acc, step) => {
          const existing = acc.find(p => p.phase === step.phase);
          if (existing) { existing.steps.push(step); } else { acc.push({ phase: step.phase, steps: [step] }); }
          return acc;
        }, []);

        return (
          <div className="space-y-5">
            {subTabBar}

            {/* Back button + header */}
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelectedPlaybookTemplate(null); setPlaybookAssignees([]); }} className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-[#157A6E] transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Playbooks
              </button>
            </div>

            <div className={`${tmpl.bgColor} rounded-[12px] border border-[#e8e5e1] p-6 border-l-4 ${tmpl.borderColor}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[28px]">{tmpl.icon}</span>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-1 ${tmpl.tagColor}`}>{tmpl.category}</span>
                    <h2 className="text-[20px] font-bold text-gray-800 font-serif">{tmpl.title}</h2>
                    <p className="text-[13px] text-gray-500 mt-0.5">{tmpl.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-400">{tmpl.duration} · {tmpl.steps.length} steps</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Applies to: {tmpl.applicableTo}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-5">
              {/* LEFT: Timeline (7 cols) */}
              <div className="col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-500 whitespace-nowrap">Playbook Timeline</span>
                  <div className="flex-1 h-px bg-[#e8e5e1]" />
                </div>

                {phases.map((phase, pi) => (
                  <div key={pi} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${phaseColors[phase.phase] || 'bg-gray-100 text-gray-600'}`}>{phase.phase}</span>
                      <span className="text-[10px] text-gray-400">Day {phase.steps[0].day}{phase.steps.length > 1 ? ` — ${phase.steps[phase.steps.length - 1].day}` : ''}</span>
                    </div>
                    <div className="space-y-0">
                      {phase.steps.map((step, si) => (
                        <div key={si} className="flex gap-3 relative">
                          {/* Timeline connector */}
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border-2" style={{ borderColor: tmpl.color, color: tmpl.color, backgroundColor: `${tmpl.color}10` }}>
                              {step.day}
                            </div>
                            {si < phase.steps.length - 1 && <div className="w-px flex-1 min-h-[20px]" style={{ backgroundColor: `${tmpl.color}30` }} />}
                          </div>
                          <div className="pb-4 flex-1 min-w-0">
                            <h4 className="text-[13px] font-semibold text-gray-800">{step.label}</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT: Assignment (5 cols) */}
              <div className="col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-500 whitespace-nowrap">Assign to Partners</span>
                  <div className="flex-1 h-px bg-[#e8e5e1]" />
                </div>

                {/* Suggested advisors */}
                {suggestedAdvisors.length > 0 && (
                  <div className="bg-[#F0FAF8] rounded-[10px] border border-[#d0e8e4] p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wide text-[#157A6E] mb-2">Suggested Partners</h4>
                    <p className="text-[10px] text-gray-500 mb-3">{matchingRec?.reason}</p>
                    <div className="space-y-2">
                      {suggestedAdvisors.map(a => {
                        const isSelected = playbookAssignees.includes(a.id);
                        const isAlreadyRunning = alreadyLaunched.some(lp => lp.advisorId === a.id);
                        return (
                          <div key={a.id} onClick={() => {
                            if (isAlreadyRunning) return;
                            setPlaybookAssignees(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id]);
                          }} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${isAlreadyRunning ? 'bg-gray-100 opacity-60 cursor-not-allowed' : isSelected ? 'bg-white border-2 border-[#157A6E] shadow-sm' : 'bg-white/60 border border-transparent hover:bg-white hover:border-gray-200'}`}>
                            <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0 ${isAlreadyRunning ? 'bg-gray-300 text-white' : isSelected ? 'bg-[#157A6E] text-white' : 'bg-gray-200 text-gray-400'}`}>
                              {isAlreadyRunning ? '—' : isSelected ? '✓' : ''}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-semibold text-gray-800">{a.name}</div>
                              <div className="text-[10px] text-gray-500">{a.company} · {formatCurrency(a.mrr)} MRR</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${a.tier === 'anchor' ? 'bg-teal-100 text-teal-700' : a.tier === 'scaling' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{a.tier}</div>
                              {isAlreadyRunning && <div className="text-[9px] text-gray-400 mt-0.5">Already running</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All partners */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">All Partners</h4>
                  <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
                    {allAssignable.filter(a => !suggestedAdvisors.some(s => s.id === a.id)).map(a => {
                      const isSelected = playbookAssignees.includes(a.id);
                      const isAlreadyRunning = alreadyLaunched.some(lp => lp.advisorId === a.id);
                      return (
                        <div key={a.id} onClick={() => {
                          if (isAlreadyRunning) return;
                          setPlaybookAssignees(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id]);
                        }} className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${isAlreadyRunning ? 'opacity-50 cursor-not-allowed' : isSelected ? 'bg-[#F0FAF8] border border-[#157A6E]' : 'hover:bg-gray-50 border border-transparent'}`}>
                          <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] shrink-0 ${isAlreadyRunning ? 'bg-gray-300 text-white' : isSelected ? 'bg-[#157A6E] text-white' : 'bg-gray-200'}`}>
                            {isSelected ? '✓' : ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-gray-700 truncate">{a.name}</div>
                            <div className="text-[9px] text-gray-400">{a.company}</div>
                          </div>
                          <span className="text-[10px] text-gray-400">{formatCurrency(a.mrr)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Launch summary */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-3">Launch Summary</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-md p-2.5 text-center">
                      <div className="text-[10px] text-gray-400">Partners</div>
                      <div className="text-[16px] font-bold text-gray-800">{playbookAssignees.length}</div>
                    </div>
                    <div className="bg-gray-50 rounded-md p-2.5 text-center">
                      <div className="text-[10px] text-gray-400">MRR Covered</div>
                      <div className="text-[16px] font-bold text-[#157A6E]">{formatCurrency(totalAssigneeMRR)}</div>
                    </div>
                  </div>
                  {playbookAssignees.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {playbookAssignees.map(id => {
                        const a = advisors.find(x => x.id === id);
                        return a ? (
                          <div key={id} className="flex items-center justify-between text-[11px] py-1 border-b border-gray-50">
                            <span className="font-medium text-gray-700">{a.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); setPlaybookAssignees(prev => prev.filter(x => x !== id)); }} className="text-gray-300 hover:text-red-400"><X className="w-3 h-3" /></button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  <button
                    disabled={playbookAssignees.length === 0}
                    onClick={() => {
                      const newLaunched = playbookAssignees.map(id => {
                        const a = advisors.find(x => x.id === id);
                        return { templateId: tmpl.id, advisorId: id, advisorName: a?.name || '', launchedAt: new Date().toISOString(), priority: (matchingRec?.urgency || 'high') as 'critical' | 'high' | 'medium', completedSteps: [] as number[], skippedSteps: [] as number[] };
                      });
                      setLaunchedPlaybooks(prev => [...prev, ...newLaunched]);
                      setPlaybookAssignees([]);
                      setSelectedPlaybookTemplate(null);
                    }}
                    className={`w-full py-2.5 rounded-lg text-[12px] font-semibold transition-all ${playbookAssignees.length > 0 ? 'bg-[#157A6E] text-white hover:bg-[#126a5f] shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  >
                    Assign Playbook to {playbookAssignees.length} Partner{playbookAssignees.length !== 1 ? 's' : ''}
                  </button>
                </div>

                {/* Already launched */}
                {alreadyLaunched.length > 0 && (
                  <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Already Running</h4>
                    <div className="space-y-2">
                      {alreadyLaunched.map((lp, li) => (
                        <div key={li} className="flex items-center gap-2 text-[11px] py-1.5 border-b border-gray-50 last:border-b-0">
                          <div className="w-2 h-2 rounded-full bg-[#157A6E]" />
                          <span className="font-medium text-gray-700">{lp.advisorName}</span>
                          <span className="text-gray-400 ml-auto">{lp.completedSteps.length}/{tmpl.steps.length} steps</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-5">
          {subTabBar}

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <KPICard label="Active Playbooks" value={`${launchedPlaybooks.length}`} change={`${launchedPlaybooks.filter(p=>p.priority==='critical').length} critical`} changeType="neutral" />
            <KPICard label="MRR Protected" value={formatCurrency(protectedMRR)} change="In active retention" changeType="negative" />
            <KPICard label="MRR Targeted" value={`+${formatCurrency(expansionMRR)}`} change="Growth & expansion" changeType="positive" />
            <KPICard label="Recommendations" value={`${recommendedPlaybooks.length}`} change="Based on signals" changeType="neutral" />
          </div>

          {/* ── RECOMMENDED PLAYBOOKS ── */}
          {recommendedPlaybooks.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Recommended Playbooks</span>
                <div className="flex-1 h-px bg-[#e8e5e1]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {recommendedPlaybooks.slice(0, 6).map((rec, ri) => (
                  <div key={ri} onClick={() => { setSelectedPlaybookTemplate(rec.template.id); setPlaybookAssignees(rec.advisors.map(a => a.id)); }} className={`${rec.template.bgColor} rounded-[10px] border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-all border-l-4 ${rec.template.borderColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[16px]">{rec.template.icon}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${rec.urgency === 'critical' ? 'bg-red-200 text-red-800' : rec.urgency === 'high' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'}`}>{rec.urgency}</span>
                    </div>
                    <h4 className="text-[13px] font-bold text-gray-800 font-serif">{rec.template.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{rec.reason}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {rec.advisors.slice(0, 3).map((a, ai) => (
                        <span key={ai} className="px-2 py-0.5 bg-white/80 rounded-full text-[10px] font-medium text-gray-600 border border-white">{a.name.split(' ')[0]}</span>
                      ))}
                      {rec.advisors.length > 3 && <span className="text-[10px] text-gray-400">+{rec.advisors.length - 3}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] text-gray-400">{rec.template.duration}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{rec.template.steps.length} steps</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── ACTIVE PLAYBOOKS ── */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-500 whitespace-nowrap">Active Playbooks</span>
            <div className="flex-1 h-px bg-[#e8e5e1]" />
          </div>

          <div className="grid grid-cols-[1fr_280px] gap-4">
            <div className="space-y-4">
              {launchedPlaybooks.length === 0 && (
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-8 text-center">
                  <PlayCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-[13px] font-semibold text-gray-600">No active playbooks</p>
                  <p className="text-[11px] text-gray-400 mt-1">Assign a playbook to a partner from Relationships, or create one below.</p>
                </div>
              )}
              {/* All playbooks — user-assigned (template, custom, and AI) */}
              {launchedPlaybooks.map((lp, lpi) => {
                const lpTemplate = playbookTemplates.find(t => t.id === lp.templateId);
                const lpAdvisor = advisors.find(a => a.id === lp.advisorId);
                if (!lpAdvisor) return null;
                const lpSteps = lp.customSteps || lpTemplate?.steps || [];
                if (lpSteps.length === 0) return null;
                const lpEffective = lpSteps.length - lp.skippedSteps.length;
                const lpPct = lpEffective > 0 ? Math.round((lp.completedSteps.length / lpEffective) * 100) : 100;
                const isCustomOrAi = lp.templateId === 'custom' || lp.templateId === 'ai-generated';
                const displayName = lp.playbookName || lpTemplate?.title || lp.templateId.replace('-', ' ');
                const displayColor = lpTemplate?.color || '#157A6E';
                const displayBorder = lpTemplate?.borderColor || 'border-l-[#157A6E]';
                const displayBg = lpTemplate?.bgColor || '';
                const displayTag = lpTemplate?.tagColor || 'bg-teal-100 text-teal-800';
                const displayCategory = lpTemplate?.category || (lp.templateId === 'ai-generated' ? 'AI-Built' : 'Custom');
                const displayDuration = lpTemplate?.duration || `${lpSteps.length} steps`;

                return (
                  <div key={`lp-${lpi}`} onClick={() => setEditingPlaybookIdx(lpi)} className={`bg-white rounded-[10px] border border-[#e8e5e1] p-5 border-l-4 cursor-pointer hover:shadow-md transition-all ${displayBorder}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${lp.priority === 'critical' ? 'bg-red-100 text-red-800' : lp.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                            {lp.priority}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${displayTag}`}>{displayCategory}</span>
                          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#F0FAF8] text-[#157A6E]">Launched</span>
                          {isCustomOrAi && <span className="inline-block px-2 py-0.5 rounded text-[9px] font-medium bg-purple-50 text-purple-700">{lp.templateId === 'ai-generated' ? '✦ AI' : '✎ Custom'}</span>}
                          {lp.skippedSteps.length > 0 && <span className="inline-block px-2 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-500">{lp.skippedSteps.length} skipped</span>}
                        </div>
                        <h3 className="text-[15px] font-bold text-gray-800 font-serif">{displayName}: <button onClick={(e) => { e.stopPropagation(); setSelectedAdvisor(lpAdvisor); setPanelOpen(true); }} className="text-[#157A6E] hover:underline">{lpAdvisor.name}</button></h3>
                        <p className="text-[12px] text-gray-500 mt-1">{lpSteps.length} action steps — {formatCurrency(lpAdvisor.mrr)} MRR</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[18px] font-bold" style={{ color: displayColor }}>{formatCurrency(lpAdvisor.mrr)}</div>
                        <div className="text-[10px] text-gray-400">{displayDuration}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-[6px] bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${lpPct}%`, backgroundColor: displayColor }} />
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: displayColor }}>{lpPct}%</span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Action Steps</h4>
                      {lpSteps.map((step, si) => {
                        const isDone = lp.completedSteps.includes(si);
                        const isSkipped = lp.skippedSteps.includes(si);
                        const isActive = !isDone && !isSkipped && (si === 0 || lp.completedSteps.includes(si - 1) || lp.skippedSteps.includes(si - 1));
                        if (isSkipped) return (
                          <div key={si} className="flex items-start gap-3 opacity-30">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-gray-100 text-gray-300 border border-dashed border-gray-300">—</div>
                            <span className="text-[12px] text-gray-300 line-through italic">{step.label}</span>
                          </div>
                        );
                        return (
                          <div key={si} className="flex items-start gap-3 group">
                            <div onClick={(e) => { e.stopPropagation(); setLaunchedPlaybooks(prev => prev.map((p, pi) => pi === lpi ? { ...p, completedSteps: isDone ? p.completedSteps.filter(x => x !== si) : [...p.completedSteps, si] } : p)); }}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 cursor-pointer transition-all ${isDone ? 'bg-green-100 text-green-700 hover:bg-green-200' : isActive ? 'text-white hover:opacity-80' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              style={isActive ? { backgroundColor: displayColor } : {}}>
                              {isDone ? '✓' : si + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-[12px] ${isDone ? 'text-gray-400 line-through' : isActive ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>{step.label}</span>
                              {isActive && <p className="text-[10px] text-gray-400 mt-0.5">{step.desc}</p>}
                            </div>
                            <span className="text-[9px] text-gray-300 font-medium">Day {step.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div onClick={() => { setPlaybookModalAdvisor(null); setPlaybookModalMode('template'); setSelectedPlaybookTemplate(null); setShowPlaybookModal(true); }} className="bg-white rounded-[10px] border-2 border-dashed border-gray-200 p-6 text-center cursor-pointer hover:border-[#157A6E] transition-colors">
                <div className="text-[20px] text-gray-300 mb-1">+</div>
                <div className="text-[12px] font-semibold text-[#157A6E]">Create New Playbook</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Build from a signal or start from scratch</div>
              </div>
            </div>

            {/* Sidebar: deadlines + stats + templates */}
            <div className="space-y-4 self-start sticky top-[105px]">
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Upcoming Deadlines</h3>
                {launchedPlaybooks.length > 0 ? launchedPlaybooks.map((lp, i) => {
                  const lpSteps = lp.customSteps || [];
                  const remaining = lpSteps.length - lp.completedSteps.length - lp.skippedSteps.length;
                  return (
                    <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded" onClick={() => setEditingPlaybookIdx(i)}>
                      <div className={`w-2 h-2 rounded-full ${lp.priority === 'critical' ? 'bg-red-500' : lp.priority === 'high' ? 'bg-amber-400' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-700 truncate">{lp.playbookName || lp.templateId.replace('-', ' ')}: {lp.advisorName}</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">{remaining} left</span>
                    </div>
                  );
                }) : <p className="text-[10px] text-gray-400">No active playbooks</p>}
              </div>
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Playbook Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Active', value: launchedPlaybooks.length },
                    { label: 'Critical', value: launchedPlaybooks.filter(p=>p.priority==='critical').length },
                    { label: 'Avg Progress', value: `${launchedPlaybooks.length > 0 ? Math.round(launchedPlaybooks.reduce((s,p) => { const steps = p.customSteps?.length || 0; const effective = steps - p.skippedSteps.length; return s + (effective > 0 ? (p.completedSteps.length/effective)*100 : 100); }, 0) / launchedPlaybooks.length) : 0}%` },
                    { label: 'Total MRR', value: formatCurrency(launchedPlaybooks.reduce((s,p) => { const adv = advisors.find(a => a.id === p.advisorId); return s + (adv?.mrr || 0); }, 0)) },
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-50 rounded-md p-2.5 text-center">
                      <div className="text-[10px] text-gray-400">{stat.label}</div>
                      <div className="text-[14px] font-bold text-gray-800">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── PLAYBOOK LIBRARY ── */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-500 whitespace-nowrap">Playbook Library</span>
            <div className="flex-1 h-px bg-[#e8e5e1]" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {playbookTemplates.map((tmpl, ti) => (
              <div key={ti} onClick={() => { setSelectedPlaybookTemplate(tmpl.id); setPlaybookAssignees([]); }} className={`bg-white rounded-[10px] border border-[#e8e5e1] p-5 hover:shadow-md transition-all cursor-pointer border-l-4 ${tmpl.borderColor}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[20px]">{tmpl.icon}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${tmpl.tagColor}`}>{tmpl.category}</span>
                </div>
                <h3 className="text-[14px] font-bold text-gray-800 font-serif">{tmpl.title}</h3>
                <p className="text-[11px] text-gray-500 mt-1">{tmpl.subtitle}</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                    <span>{tmpl.duration}</span>
                    <span>{tmpl.steps.length} steps</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mb-2">Applies to: <span className="text-gray-600 font-medium">{tmpl.applicableTo}</span></div>
                  {/* Timeline preview */}
                  <div className="space-y-1.5">
                    {tmpl.steps.slice(0, 4).map((step, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold bg-gray-100 text-gray-500 shrink-0">
                          {step.day}
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${phaseColors[step.phase] || 'bg-gray-100 text-gray-600'}`}>{step.phase}</span>
                        <span className="text-[10px] text-gray-600 truncate">{step.label}</span>
                      </div>
                    ))}
                    {tmpl.steps.length > 4 && (
                      <div className="text-[10px] text-[#157A6E] font-semibold pl-6">+ {tmpl.steps.length - 4} more steps →</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ════════════════════════════════════════
    // SUB-TAB: DIAGNOSTICS
    // ════════════════════════════════════════
    const critMRR = criticalPartners.reduce((s,a) => s+a.mrr, 0);
    const highMRR = highRiskPartners.reduce((s,a) => s+a.mrr, 0);
    const avgHealth = advisors.length > 0 ? Math.round(advisors.reduce((s,a) => {
      let score = 50;
      if (a.pulse === 'Strong') score += 25; else if (a.pulse === 'Steady') score += 15; else if (a.pulse === 'Fading') score -= 10;
      if (a.friction === 'Low') score += 20; else if (a.friction === 'Moderate') score += 5; else if (a.friction === 'High') score -= 15; else if (a.friction === 'Critical') score -= 25;
      if (a.trajectory === 'Accelerating') score += 10; else if (a.trajectory === 'Climbing') score += 5; else if (a.trajectory === 'Slipping') score -= 10; else if (a.trajectory === 'Freefall') score -= 20;
      return s + Math.max(0, Math.min(100, score));
    }, 0) / advisors.length) : 0;

    // Friction sources
    const frictionSources = [
      { cat: 'Support Response', count: frictionIssues.filter(a => a.diagnosis?.toLowerCase().includes('support') || a.diagnosis?.toLowerCase().includes('complaint')).length || Math.max(2, Math.round(frictionIssues.length * 0.4)), partners: Math.min(frictionIssues.length, 6), severity: 'critical' as const },
      { cat: 'Commission Disputes', count: frictionIssues.filter(a => a.diagnosis?.toLowerCase().includes('commission')).length || Math.max(1, Math.round(frictionIssues.length * 0.25)), partners: Math.min(frictionIssues.length, 4), severity: 'high' as const },
      { cat: 'Onboarding Delays', count: Math.max(1, Math.round(frictionIssues.length * 0.2)), partners: Math.min(frictionIssues.length, 3), severity: 'high' as const },
      { cat: 'Deal Reg Bottleneck', count: Math.max(1, Math.round(stalledDeals.length * 0.5)), partners: Math.min(3, stalledDeals.length), severity: 'medium' as const },
      { cat: 'Co-Marketing Gaps', count: Math.max(1, Math.round(frictionIssues.length * 0.1)), partners: 2, severity: 'medium' as const },
    ];
    const totalFriction = frictionSources.reduce((s,f) => s+f.count, 0);

    return (
      <div className="space-y-5">
        {subTabBar}
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Partners Monitored" value={`${advisors.length}`} change="All active partners" changeType="neutral" />
          <KPICard label="Critical / High Risk" value={`${criticalPartners.length + highRiskPartners.length}`} change={`${criticalPartners.length} critical, ${highRiskPartners.length} high`} changeType="negative" />
          <KPICard label="Avg Partner Health" value={`${avgHealth}`} change="Composite score" changeType={avgHealth >= 70 ? "positive" : "negative"} />
          <KPICard label="MRR at Risk" value={formatCurrency(atRiskMRR)} change={`${Math.round(atRiskMRR / (totalMRR || 1) * 100)}% of total portfolio`} changeType="negative" />
        </div>

        {/* Portfolio Health + Friction */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Portfolio Health Distribution</h3>
              <span className="text-[10px] text-[#157A6E] font-semibold cursor-pointer">Export →</span>
            </div>
            {/* Stacked bar */}
            <div className="flex h-5 rounded-md overflow-hidden mb-2">
              {[
                { count: healthyPartnersCount.length, color: '#157A6E', label: 'Healthy' },
                { count: stablePartners.length, color: '#3182CE', label: 'Stable' },
                { count: watchPartners.length, color: '#D69E2E', label: 'Watch' },
                { count: highRiskPartners.length, color: '#e53e3e', label: 'At Risk' },
                { count: criticalPartners.length, color: '#9B2C2C', label: 'Critical' },
              ].filter(s => s.count > 0).map((seg, i) => (
                <div key={i} className="flex items-center justify-center text-[9px] font-bold text-white" style={{ width: `${(seg.count / (advisors.length || 1)) * 100}%`, backgroundColor: seg.color, minWidth: seg.count > 0 ? '20px' : '0' }}>
                  {seg.count}
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap mb-4">
              {[
                { label: 'Healthy', color: '#157A6E', count: healthyPartnersCount.length },
                { label: 'Stable', color: '#3182CE', count: stablePartners.length },
                { label: 'Watch', color: '#D69E2E', count: watchPartners.length },
                { label: 'At Risk', color: '#e53e3e', count: highRiskPartners.length },
                { label: 'Critical', color: '#9B2C2C', count: criticalPartners.length },
              ].map((leg, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: leg.color }} />
                  {leg.label} ({leg.count})
                </div>
              ))}
            </div>
            {/* Tier breakdown */}
            {[
              { tier: 'Critical', color: '#9B2C2C', partners: criticalPartners, mrr: critMRR },
              { tier: 'At Risk', color: '#e53e3e', partners: highRiskPartners, mrr: highMRR },
              { tier: 'Watch', color: '#D69E2E', partners: watchPartners, mrr: watchPartners.reduce((s,a)=>s+a.mrr,0) },
              { tier: 'Stable', color: '#3182CE', partners: stablePartners, mrr: stablePartners.reduce((s,a)=>s+a.mrr,0) },
              { tier: 'Healthy', color: '#157A6E', partners: healthyPartnersCount, mrr: healthyPartnersCount.reduce((s,a)=>s+a.mrr,0) },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-b-0">
                <span className="text-[10px] font-bold uppercase tracking-wide w-14" style={{ color: row.color }}>{row.tier}</span>
                <div className="flex-1 h-[8px] bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(row.partners.length / (advisors.length || 1)) * 100}%`, backgroundColor: row.color }} />
                </div>
                <span className="text-[11px] text-gray-600 min-w-[140px] text-right"><strong>{row.partners.length}</strong> partner{row.partners.length !== 1 ? 's' : ''} · {formatCurrency(row.mrr)} MRR</span>
              </div>
            ))}
          </div>

          {/* Friction Sources */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Friction Sources</h3>
              <span className="text-[10px] text-[#157A6E] font-semibold cursor-pointer">View details →</span>
            </div>
            <table className="w-full text-[11px]">
              <thead><tr className="border-b border-gray-200">
                <th className="text-left py-1.5 font-semibold text-gray-400 text-[10px] uppercase tracking-wide">Category</th>
                <th className="text-center py-1.5 font-semibold text-gray-400 text-[10px] uppercase tracking-wide">Incidents</th>
                <th className="text-center py-1.5 font-semibold text-gray-400 text-[10px] uppercase tracking-wide">Partners</th>
                <th className="text-center py-1.5 font-semibold text-gray-400 text-[10px] uppercase tracking-wide">Severity</th>
              </tr></thead>
              <tbody>
                {frictionSources.map((f, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 font-semibold text-gray-700">{f.cat}</td>
                    <td className="py-2 text-center font-bold" style={{ color: f.severity === 'critical' ? '#e53e3e' : f.severity === 'high' ? '#D69E2E' : '#3182CE' }}>{f.count}</td>
                    <td className="py-2 text-center text-gray-600">{f.partners}</td>
                    <td className="py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${f.severity === 'critical' ? 'bg-red-100 text-red-800' : f.severity === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{f.severity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Total Friction Events (30d)</div>
              <div className="flex items-baseline gap-2">
                <span className="text-[24px] font-bold text-red-500">{totalFriction}</span>
                <span className="text-[11px] text-red-500 font-semibold">↑ vs prior 30d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Diagnostic Cards */}
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-gray-400 mb-1">Partner-Level Diagnostics</div>
        {[...criticalPartners, ...highRiskPartners].slice(0, 6).map((a, i) => {
          const isCritical = a.friction === 'Critical';
          const daysSinceContact = Math.round(Math.random() * 25) + 5;
          const frictionScore = isCritical ? 85 + Math.round(Math.random() * 10) : 60 + Math.round(Math.random() * 15);
          const linkedSignals = signals.filter(s => s.partnerName === a.name);
          return (
            <div key={a.id} className={`bg-white rounded-[10px] border border-[#e8e5e1] p-5 border-l-4 ${isCritical ? 'border-l-red-500' : 'border-l-amber-400'} mb-4`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[16px] font-bold text-gray-800 font-serif">{a.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${isCritical ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{a.friction}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{a.company} · {a.tier === 'anchor' ? 'Anchor' : a.tier === 'scaling' ? 'Scaling' : a.tier === 'building' ? 'Building' : a.tier === 'launching' ? 'Launching' : 'Partner'}</p>
                </div>
                <div className="text-right">
                  <div className={`text-[20px] font-bold ${isCritical ? 'text-red-500' : 'text-amber-600'}`}>{formatCurrency(a.mrr)}</div>
                  <div className="text-[10px] text-gray-400">Monthly MRR</div>
                </div>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Pulse', value: a.pulse, color: a.pulse === 'Strong' ? '#157A6E' : a.pulse === 'Fading' ? '#e53e3e' : '#D69E2E', detail: `${a.trajectory} trajectory` },
                  { label: 'Friction Score', value: `${frictionScore}`, color: frictionScore > 80 ? '#e53e3e' : frictionScore > 65 ? '#D69E2E' : '#157A6E', detail: `${a.friction} friction` },
                  { label: 'Trajectory', value: a.trajectory === 'Freefall' || a.trajectory === 'Slipping' ? '↓ ' + a.trajectory : a.trajectory === 'Accelerating' || a.trajectory === 'Climbing' ? '↑ ' + a.trajectory : '→ ' + a.trajectory, color: a.trajectory === 'Freefall' || a.trajectory === 'Slipping' ? '#e53e3e' : '#D69E2E', detail: '' },
                  { label: 'Days Since Contact', value: `${daysSinceContact}`, color: daysSinceContact > 14 ? '#e53e3e' : daysSinceContact > 7 ? '#D69E2E' : '#157A6E', detail: '' },
                ].map((m, mi) => (
                  <div key={mi} className="bg-gray-50 rounded-md p-3 text-center">
                    <div className="text-[10px] text-gray-400 mb-1">{m.label}</div>
                    <div className="text-[14px] font-bold" style={{ color: m.color }}>{m.value}</div>
                    {m.detail && <div className="text-[9px] text-gray-400 mt-0.5">{m.detail}</div>}
                  </div>
                ))}
              </div>

              {/* Diagnosis */}
              <div className="bg-gray-50 rounded-md p-3 mb-3">
                <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-1">AI Diagnosis</div>
                <p className="text-[12px] text-gray-600 leading-relaxed">{a.diagnosis || `${a.name} showing ${a.friction.toLowerCase()} friction with ${a.pulse.toLowerCase()} pulse. ${a.trajectory} trajectory indicates ${isCritical ? 'immediate intervention required' : 'proactive engagement needed'}.`}</p>
              </div>

              {/* Linked signals */}
              {linkedSignals.length > 0 && (
                <div className="mb-3">
                  <div className="text-[9px] font-bold uppercase text-gray-400 mb-1">Linked Signals</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {linkedSignals.map((ls, li) => (
                      <div key={li} className="flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1 text-[10px] text-gray-600">
                        <div className={`w-[6px] h-[6px] rounded-full ${signalDotColor(ls.type)}`} />
                        {ls.title} — {ls.time}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => {
                  const existingIdx = launchedPlaybooks.findIndex(p => p.advisorId === a.id);
                  if (existingIdx >= 0) {
                    setActiveView('intelligence'); setIntelligenceSubTab('playbooks'); setEditingPlaybookIdx(existingIdx);
                  } else {
                    setPlaybookModalAdvisor(a); setPlaybookModalMode('template'); setSelectedPlaybookTemplate(null); setShowPlaybookModal(true);
                  }
                }} className="px-3 py-1.5 bg-[#157A6E] text-white text-[11px] font-semibold rounded-md hover:bg-[#126a5f]">
                  {launchedPlaybooks.some(p => p.advisorId === a.id) ? 'View Playbook →' : 'Assign Playbook →'}
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-md hover:bg-gray-200" onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); setActiveViewRaw('relationships'); }}>
                  Contact History
                </button>
              </div>
            </div>
          );
        })}

        {/* Watch List */}
        {watchPartners.length > 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Watch List</h3>
              <span className="text-[10px] text-gray-500">Partners showing early warning signs</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {watchPartners.slice(0, 6).map(a => (
                <div key={a.id} className="bg-amber-50 rounded-lg p-3 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[12px] font-semibold text-gray-800">{a.name}</span>
                    <span className="text-[11px] font-bold text-amber-600">{formatCurrency(a.mrr)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">{a.diagnosis || `${a.pulse} pulse, ${a.friction} friction`}</p>
                  <div className="flex gap-1 mt-1.5">
                    <PulseBadge pulse={a.pulse} />
                    <FrictionBadge level={a.friction} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
              <div>
                <div className="text-[10px] font-bold uppercase text-gray-400">Early Warning MRR Exposure</div>
                <div className="text-[20px] font-bold text-amber-600">{formatCurrency(watchPartners.reduce((s,a)=>s+a.mrr,0))}</div>
              </div>
              <div className="text-[10px] text-gray-400 text-right">Could escalate<br/>within 30 days</div>
            </div>
          </div>
        )}
      </div>
    );

    // ════════════════════════════════════════
    // SUB-TAB: RESOURCES
    // ════════════════════════════════════════
    if (intelligenceSubTab === 'resources') {
      return (
        <div className="space-y-5">
          {subTabBar}
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-[#157A6E]/5 to-teal-50/50 rounded-[10px] border border-[#157A6E]/20 p-5">
              <h3 className="text-[14px] font-semibold font-['Newsreader'] text-gray-900 mb-1">Company Resources</h3>
              <p className="text-12px text-gray-600">Sales enablement materials, product docs, and marketing assets for your partner conversations.</p>
            </div>

            {/* Resource categories */}
            {[
              {
                category: 'Sales Enablement',
                icon: '📊',
                items: [
                  { name: 'Product Pricing Guide Q2 2026', type: 'PDF', updated: '2 days ago', size: '2.4 MB' },
                  { name: 'Competitive Battle Cards', type: 'PDF', updated: '1 week ago', size: '1.8 MB' },
                  { name: 'Partner Pitch Deck', type: 'PPTX', updated: '3 days ago', size: '5.2 MB' },
                  { name: 'ROI Calculator Template', type: 'XLSX', updated: '2 weeks ago', size: '890 KB' },
                ]
              },
              {
                category: 'Product Documentation',
                icon: '📋',
                items: [
                  { name: 'UCaaS Solution Brief', type: 'PDF', updated: '1 week ago', size: '1.2 MB' },
                  { name: 'SD-WAN Technical Specs', type: 'PDF', updated: '3 weeks ago', size: '3.1 MB' },
                  { name: 'CCaaS Integration Guide', type: 'PDF', updated: '5 days ago', size: '2.8 MB' },
                  { name: 'SASE/SSE Overview', type: 'PDF', updated: '1 month ago', size: '1.5 MB' },
                ]
              },
              {
                category: 'Marketing Assets',
                icon: '🎨',
                items: [
                  { name: 'Co-Branded Email Templates', type: 'ZIP', updated: '4 days ago', size: '3.4 MB' },
                  { name: 'Social Media Kit', type: 'ZIP', updated: '1 week ago', size: '8.7 MB' },
                  { name: 'Case Study: Enterprise UCaaS Migration', type: 'PDF', updated: '2 weeks ago', size: '1.1 MB' },
                  { name: 'Webinar Slide Templates', type: 'PPTX', updated: '3 days ago', size: '4.2 MB' },
                ]
              },
              {
                category: 'Training & Certification',
                icon: '🎓',
                items: [
                  { name: 'Partner Certification Program Guide', type: 'PDF', updated: '1 month ago', size: '2.0 MB' },
                  { name: 'Product Training Videos (Q2)', type: 'Link', updated: '1 week ago', size: '' },
                  { name: 'Technical SE Enablement Deck', type: 'PPTX', updated: '2 weeks ago', size: '6.1 MB' },
                ]
              },
            ].map(cat => (
              <div key={cat.category} className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[16px]">{cat.icon}</span>
                  <h4 className="text-[14px] font-semibold font-['Newsreader'] text-gray-900">{cat.category}</h4>
                  <span className="text-[10px] text-gray-400 ml-auto">{cat.items.length} items</span>
                </div>
                <div className="space-y-2">
                  {cat.items.map(item => (
                    <div key={item.name} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                        item.type === 'PDF' ? 'bg-red-50 text-red-600' :
                        item.type === 'PPTX' ? 'bg-orange-50 text-orange-600' :
                        item.type === 'XLSX' ? 'bg-emerald-50 text-emerald-600' :
                        item.type === 'ZIP' ? 'bg-purple-50 text-purple-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>{item.type}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-12px font-medium text-gray-900 group-hover:text-[#157A6E] transition-colors">{item.name}</p>
                        <p className="text-[10px] text-gray-400">Updated {item.updated}{item.size ? ` · ${item.size}` : ''}</p>
                      </div>
                      <button className="px-3 py-1.5 text-[10px] font-semibold text-[#157A6E] border border-[#157A6E]/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-teal-50">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  // Groups view is now integrated into renderRelationships

  // ════════════════════════════════════════════════
  // VIEW ROUTING
  // ════════════════════════════════════════════════
  const viewRenderers: Record<string, () => React.ReactNode> = {
    'command-center': renderCommandCenter,
    'intelligence': renderIntelligence,
    'relationships': renderRelationships,
    'pipeline': renderPipeline,
  };

  return (
    <div className="flex h-screen bg-[#F7F5F2] font-['Inter']">
      <Sidebar items={NAV_ITEMS_MANAGER} activeView={activeView} onViewChange={setActiveView} role="manager" userName={userName} userInitials={userInitials} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          nudges={[]}
          userName={userName}
          userInitials={userInitials}
          role="manager"
          notificationCount={overdueNotifCount}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <a href="/live" className="text-12px text-[#157A6E] hover:underline flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Admin
                </a>
                <h1 className="text-xl font-semibold font-['Newsreader'] text-gray-800">
                  {activeView === 'command-center' ? 'Today' : NAV_ITEMS_MANAGER.find(n => n.id === activeView)?.label || 'Dashboard'}
                </h1>
                <span className="text-10px font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">LIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowGlobalSearch(true); setGlobalSearchQuery(''); }} className="flex items-center gap-1.5 px-2.5 py-1 text-12px text-gray-500 hover:text-[#157A6E] border border-[#e8e5e1] rounded-lg hover:border-[#157A6E]/30 transition-colors">
                  <Search className="w-3 h-3" /> <span className="text-[10px] text-gray-400">⌘K</span>
                </button>
                <a href="/settings" className="flex items-center gap-1 text-12px text-gray-500 hover:text-[#157A6E]">
                  <Shield className="w-3 h-3" /> Settings
                </a>
                <button onClick={fetchData} className="flex items-center gap-1 text-12px text-gray-500 hover:text-[#157A6E]">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>
            {viewRenderers[activeView]?.() || renderCommandCenter()}
          </div>
        </main>
      </div>
      {/* Playbook Creation Modal */}
      {showPlaybookModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPlaybookModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[700px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header with Advisor Info */}
            <div className="p-6 border-b border-[#e8e5e1] bg-gradient-to-r from-[#F7F5F2] to-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-bold font-['Newsreader'] text-gray-800">Assign Playbook</h2>
                <button onClick={() => setShowPlaybookModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              {playbookModalAdvisor && (
                <div className="bg-white rounded-lg p-4 border border-[#e8e5e1]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[14px] font-semibold text-gray-800">{playbookModalAdvisor.name}</h3>
                      <p className="text-[12px] text-gray-500 mt-0.5">{playbookModalAdvisor.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[16px] font-bold text-[#157A6E]">{formatCurrency(playbookModalAdvisor.mrr)}</div>
                      <div className="text-[10px] text-gray-400">Monthly MRR</div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-semibold ${playbookModalAdvisor.tier === 'anchor' ? 'bg-purple-100 text-purple-800' : playbookModalAdvisor.tier === 'scaling' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {playbookModalAdvisor.tier.charAt(0).toUpperCase() + playbookModalAdvisor.tier.slice(1)}
                    </span>
                    <TrajectoryBadge trajectory={playbookModalAdvisor.trajectory} />
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#e8e5e1] px-6 bg-white">
              <button
                onClick={() => setPlaybookModalMode('template')}
                className={`px-6 py-3 text-[13px] font-semibold border-b-2 transition-colors ${playbookModalMode === 'template' ? 'text-[#157A6E] border-[#157A6E]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
              >
                Choose Template
              </button>
              <button
                onClick={() => setPlaybookModalMode('custom')}
                className={`px-6 py-3 text-[13px] font-semibold border-b-2 transition-colors ${playbookModalMode === 'custom' ? 'text-[#157A6E] border-[#157A6E]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
              >
                Create Custom
              </button>
              <button
                onClick={() => { setPlaybookModalMode('ai'); if (aiPlaybookMessages.length === 0) { setAiPlaybookMessages([{ type: 'assistant', text: playbookModalAdvisor ? `I can help you build a playbook for ${playbookModalAdvisor.name}. Tell me what you're trying to accomplish — are you looking to retain them, grow the relationship, re-engage, or something else?` : 'Tell me about the advisor and what you want this playbook to accomplish. I\'ll generate the steps for you.' }]); } }}
                className={`px-6 py-3 text-[13px] font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${playbookModalMode === 'ai' ? 'text-[#157A6E] border-[#157A6E]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Assistant
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {playbookModalMode === 'template' ? (
                <>
                  {/* Template Selection Grid */}
                  {!selectedPlaybookTemplate ? (
                    <div className="grid grid-cols-2 gap-4">
                      {playbookTemplates.map((tmpl) => (
                        <div
                          key={tmpl.id}
                          onClick={() => {
                            setSelectedPlaybookTemplate(tmpl.id);
                            setModalEditSteps(JSON.parse(JSON.stringify(tmpl.steps)));
                          }}
                          className={`${tmpl.bgColor} rounded-lg border-2 border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-all border-l-4 ${tmpl.borderColor}`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-[24px]">{tmpl.icon}</span>
                            <div className="flex-1">
                              <h4 className="text-[13px] font-semibold text-gray-800">{tmpl.title}</h4>
                              <p className="text-[11px] text-gray-600">{tmpl.subtitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-200">
                            <span>{tmpl.duration}</span>
                            <span>{tmpl.steps.length} steps</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Expanded Template Editor */}
                      {playbookTemplates.find(t => t.id === selectedPlaybookTemplate) && (() => {
                        const tmpl = playbookTemplates.find(t => t.id === selectedPlaybookTemplate)!;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <button onClick={() => { setSelectedPlaybookTemplate(null); setModalEditSteps([]); }} className="text-[12px] text-[#157A6E] font-semibold hover:underline flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" /> Back to Templates
                              </button>
                              <button
                                onClick={() => setDeleteTemplateConfirm(tmpl.id)}
                                className="text-[12px] text-red-500 font-semibold hover:text-red-700"
                              >
                                Delete Template
                              </button>
                            </div>

                            {deleteTemplateConfirm === tmpl.id && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-[12px] text-red-700 mb-2">Are you sure? This cannot be undone.</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setPlaybookTemplates(prev => prev.filter(t => t.id !== tmpl.id));
                                      setSelectedPlaybookTemplate(null);
                                      setDeleteTemplateConfirm(null);
                                    }}
                                    className="px-3 py-1 bg-red-500 text-white text-[11px] font-semibold rounded hover:bg-red-600"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setDeleteTemplateConfirm(null)}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 text-[11px] font-semibold rounded hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className={`${tmpl.bgColor} rounded-lg border border-[#e8e5e1] p-4 border-l-4 ${tmpl.borderColor}`}>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[24px]">{tmpl.icon}</span>
                                <div>
                                  <h3 className="text-[14px] font-semibold text-gray-800">{tmpl.title}</h3>
                                  <p className="text-[11px] text-gray-600">{tmpl.subtitle}</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Steps</label>
                              <div className="space-y-2 mt-2">
                                {modalEditSteps.map((step, i) => (
                                  <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="grid grid-cols-4 gap-2 mb-2">
                                      <input
                                        type="number"
                                        value={step.day}
                                        onChange={e => {
                                          const newSteps = [...modalEditSteps];
                                          newSteps[i].day = parseInt(e.target.value) || 1;
                                          setModalEditSteps(newSteps);
                                        }}
                                        placeholder="Day"
                                        className="px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-[#157A6E]"
                                      />
                                      <input
                                        type="text"
                                        value={step.phase}
                                        onChange={e => {
                                          const newSteps = [...modalEditSteps];
                                          newSteps[i].phase = e.target.value;
                                          setModalEditSteps(newSteps);
                                        }}
                                        placeholder="Phase"
                                        className="px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-[#157A6E]"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      value={step.label}
                                      onChange={e => {
                                        const newSteps = [...modalEditSteps];
                                        newSteps[i].label = e.target.value;
                                        setModalEditSteps(newSteps);
                                      }}
                                      placeholder="Step label"
                                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] mb-1 focus:outline-none focus:border-[#157A6E]"
                                    />
                                    <textarea
                                      value={step.desc}
                                      onChange={e => {
                                        const newSteps = [...modalEditSteps];
                                        newSteps[i].desc = e.target.value;
                                        setModalEditSteps(newSteps);
                                      }}
                                      placeholder="Step description"
                                      className="w-full px-2 py-1 border border-gray-200 rounded text-[10px] focus:outline-none focus:border-[#157A6E]"
                                      rows={2}
                                    />
                                    {modalEditSteps.length > 1 && (
                                      <button
                                        onClick={() => setModalEditSteps(modalEditSteps.filter((_, j) => j !== i))}
                                        className="mt-2 text-[10px] text-red-500 font-semibold hover:text-red-700"
                                      >
                                        Remove Step
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  onClick={() => setModalEditSteps([...modalEditSteps, { day: Math.max(...modalEditSteps.map(s => s.day), 0) + 1, label: '', desc: '', phase: 'Action' }])}
                                  className="text-[11px] text-[#157A6E] font-semibold hover:underline"
                                >
                                  + Add Step
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                              <div className="flex gap-2 mt-2">
                                {(['critical', 'high', 'medium'] as const).map(p => (
                                  <button
                                    key={p}
                                    onClick={() => setPlaybookPriority(p)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${playbookPriority === p
                                      ? p === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' : p === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
                                  >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </>
              ) : playbookModalMode === 'custom' ? (
                <>
                  {/* Custom Playbook Creation */}
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Playbook Name</label>
                    <input
                      type="text"
                      value={customPlaybookName}
                      onChange={e => setCustomPlaybookName(e.target.value)}
                      placeholder="e.g., Win-Back: Acme Corp"
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#157A6E]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                    <div className="flex gap-2 mt-1">
                      {(['critical', 'high', 'medium'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setPlaybookPriority(p)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${playbookPriority === p
                            ? p === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' : p === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Steps</label>
                    <div className="space-y-2 mt-2">
                      {customPlaybookSteps.map((step, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <input
                              type="number"
                              value={step.day}
                              onChange={e => {
                                const ns = [...customPlaybookSteps];
                                ns[i].day = parseInt(e.target.value) || 1;
                                setCustomPlaybookSteps(ns);
                              }}
                              placeholder="Day"
                              className="px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-[#157A6E]"
                            />
                          </div>
                          <input
                            type="text"
                            value={step.label}
                            onChange={e => {
                              const ns = [...customPlaybookSteps];
                              ns[i].label = e.target.value;
                              setCustomPlaybookSteps(ns);
                            }}
                            placeholder="Step label"
                            className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] mb-1 focus:outline-none focus:border-[#157A6E]"
                          />
                          <textarea
                            value={step.desc}
                            onChange={e => {
                              const ns = [...customPlaybookSteps];
                              ns[i].desc = e.target.value;
                              setCustomPlaybookSteps(ns);
                            }}
                            placeholder="Step description"
                            className="w-full px-2 py-1 border border-gray-200 rounded text-[10px] focus:outline-none focus:border-[#157A6E]"
                            rows={2}
                          />
                          {customPlaybookSteps.length > 1 && (
                            <button
                              onClick={() => setCustomPlaybookSteps(customPlaybookSteps.filter((_, j) => j !== i))}
                              className="mt-2 text-[10px] text-red-500 font-semibold hover:text-red-700"
                            >
                              Remove Step
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => setCustomPlaybookSteps([...customPlaybookSteps, { label: '', desc: '', day: Math.max(...customPlaybookSteps.map(s => s.day), 0) + 1 }])}
                        className="text-[11px] text-[#157A6E] font-semibold hover:underline"
                      >
                        + Add Step
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setPlaybookModalMode('ai')}
                    className="w-full px-4 py-2 text-[12px] font-medium text-[#157A6E] border border-[#157A6E] rounded-lg hover:bg-teal-50 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Let AI Help Build This
                  </button>
                </>
              ) : (
                <>
                  {/* AI Assistant Chat */}
                  <div className="flex flex-col h-[400px]">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                      {aiPlaybookMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-xl px-4 py-2.5 ${msg.type === 'user'
                            ? 'bg-[#157A6E] text-white'
                            : 'bg-[#F7F5F2] text-gray-800 border border-[#e8e5e1]'}`}
                          >
                            <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.text.replace(/```json[\s\S]*?```/g, '[Playbook steps generated — see below]')}</p>
                          </div>
                        </div>
                      ))}
                      {aiPlaybookLoading && (
                        <div className="flex justify-start">
                          <div className="bg-[#F7F5F2] border border-[#e8e5e1] rounded-xl px-4 py-3 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 text-[#157A6E] animate-spin" />
                            <span className="text-[12px] text-gray-500">Building your playbook...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Generated Steps Review */}
                    {aiGeneratedSteps && (
                      <div className="border border-[#157A6E]/30 bg-teal-50/50 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#157A6E]" />
                            <h4 className="text-[13px] font-semibold text-[#157A6E]">Generated Playbook — {aiGeneratedSteps.length} Steps</h4>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setAiGeneratedSteps(null);
                                setAiPlaybookMessages(prev => [...prev, { type: 'user', text: 'Please revise this playbook.' }]);
                                sendAiPlaybookMessage('Please revise this playbook. I want changes.');
                              }}
                              className="px-3 py-1 text-[10px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              Revise
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                          {aiGeneratedSteps.map((step, i) => (
                            <div key={i} className="bg-white rounded-lg p-3 border border-[#e8e5e1]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-[#157A6E] bg-teal-100 px-2 py-0.5 rounded">Day {step.day}</span>
                                <span className="text-[9px] text-gray-400 uppercase">{step.phase}</span>
                              </div>
                              <input
                                type="text"
                                value={step.label}
                                onChange={e => {
                                  const updated = [...aiGeneratedSteps];
                                  updated[i] = { ...updated[i], label: e.target.value };
                                  setAiGeneratedSteps(updated);
                                }}
                                className="w-full text-[12px] font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:bg-gray-50 rounded px-1 -mx-1"
                              />
                              <textarea
                                value={step.desc}
                                onChange={e => {
                                  const updated = [...aiGeneratedSteps];
                                  updated[i] = { ...updated[i], desc: e.target.value };
                                  setAiGeneratedSteps(updated);
                                }}
                                className="w-full text-[11px] text-gray-600 bg-transparent border-none focus:outline-none focus:bg-gray-50 rounded px-1 -mx-1 resize-none"
                                rows={2}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-3">
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                          <div className="flex gap-2 mt-1">
                            {(['critical', 'high', 'medium'] as const).map(p => (
                              <button
                                key={p}
                                onClick={() => setPlaybookPriority(p)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${playbookPriority === p
                                  ? p === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' : p === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
                              >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiPlaybookInput}
                        onChange={e => setAiPlaybookInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiPlaybookMessage(aiPlaybookInput); } }}
                        placeholder={aiGeneratedSteps ? 'Ask for revisions...' : 'Describe the playbook you need...'}
                        className="flex-1 px-4 py-2.5 border border-[#e8e5e1] rounded-xl text-[13px] focus:outline-none focus:border-[#157A6E] bg-white"
                        disabled={aiPlaybookLoading}
                      />
                      <button
                        onClick={() => sendAiPlaybookMessage(aiPlaybookInput)}
                        disabled={!aiPlaybookInput.trim() || aiPlaybookLoading}
                        className="px-4 py-2.5 bg-[#157A6E] text-white rounded-xl hover:bg-[#126a5f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#e8e5e1] flex justify-end gap-2">
              <button onClick={() => setShowPlaybookModal(false)} className="px-4 py-2 text-[12px] font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              {selectedPlaybookTemplate && playbookModalMode === 'template' && playbookModalAdvisor && (
                <button
                  onClick={() => {
                    const tmpl = playbookTemplates.find(t => t.id === selectedPlaybookTemplate);
                    if (tmpl) {
                      setLaunchedPlaybooks(prev => [...prev, {
                        templateId: tmpl.id,
                        advisorId: playbookModalAdvisor.id,
                        advisorName: playbookModalAdvisor.name,
                        launchedAt: new Date().toISOString(),
                        priority: playbookPriority,
                        completedSteps: [],
                        skippedSteps: [],
                        customSteps: modalEditSteps,
                      }]);
                      setShowPlaybookModal(false);
                      setSelectedPlaybookTemplate(null);
                      setModalEditSteps([]);
                    }
                  }}
                  className="px-4 py-2 text-[12px] font-semibold text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f]"
                >
                  Assign to {playbookModalAdvisor.name}
                </button>
              )}
              {playbookModalMode === 'custom' && customPlaybookName && playbookModalAdvisor && (
                <button
                  onClick={() => {
                    setLaunchedPlaybooks(prev => [...prev, {
                      templateId: 'custom',
                      advisorId: playbookModalAdvisor.id,
                      advisorName: playbookModalAdvisor.name,
                      launchedAt: new Date().toISOString(),
                      priority: playbookPriority,
                      completedSteps: [],
                      skippedSteps: [],
                      customSteps: customPlaybookSteps.map(s => ({ ...s, phase: 'Action' })),
                      playbookName: customPlaybookName,
                    }]);
                    setShowPlaybookModal(false);
                    setCustomPlaybookName('');
                    setCustomPlaybookSteps([{ label: '', desc: '', day: 1 }]);
                  }}
                  className="px-4 py-2 text-[12px] font-semibold text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f]"
                >
                  Assign to {playbookModalAdvisor.name}
                </button>
              )}
              {playbookModalMode === 'ai' && aiGeneratedSteps && playbookModalAdvisor && (
                <button
                  onClick={() => {
                    const aiName = `AI Playbook: ${playbookModalAdvisor.name}`;
                    setLaunchedPlaybooks(prev => [...prev, {
                      templateId: 'ai-generated',
                      advisorId: playbookModalAdvisor.id,
                      advisorName: playbookModalAdvisor.name,
                      launchedAt: new Date().toISOString(),
                      priority: playbookPriority,
                      completedSteps: [],
                      skippedSteps: [],
                      customSteps: aiGeneratedSteps,
                      playbookName: aiName,
                    }]);
                    setShowPlaybookModal(false);
                    setAiPlaybookMessages([]);
                    setAiGeneratedSteps(null);
                    setAiPlaybookInput('');
                  }}
                  className="px-4 py-2 text-[12px] font-semibold text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Assign to {playbookModalAdvisor.name}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showAbandonModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowAbandonModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-[17px] font-bold font-['Newsreader'] text-gray-800">Abandon Advisor</h2>
              <p className="text-[12px] text-gray-500 mt-1">Move {showAbandonModal.advisorName} to Flatlined status with quarterly reignition cadence</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[13px] font-semibold text-red-900">{showAbandonModal.advisorName}</h3>
                    <p className="text-[11px] text-red-700 mt-1">{showAbandonModal.company} · {showAbandonModal.tier.charAt(0).toUpperCase() + showAbandonModal.tier.slice(1)} · {formatCurrency(showAbandonModal.mrr)} MRR</p>
                    <p className="text-[11px] text-red-600 mt-2">This will:</p>
                    <ul className="text-[10px] text-red-600 mt-1 space-y-0.5 ml-4 list-disc">
                      <li>Move advisor to Flatlined tier</li>
                      <li>Cancel all active playbooks</li>
                      <li>Schedule quarterly reignition check-ins</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Optional Notes</label>
                <textarea
                  value={abandonNotes}
                  onChange={e => setAbandonNotes(e.target.value)}
                  placeholder="Why are we abandoning this advisor?"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#157A6E]"
                  rows={3}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowAbandonModal(null)} className="px-4 py-2 text-[12px] font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button
                onClick={() => abandonAdvisor(showAbandonModal.advisorId)}
                className="px-4 py-2 text-[12px] font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Confirm Abandon
              </button>
            </div>
          </div>
        </div>
      )}
      <DealModal
        isOpen={showDealModal}
        onClose={() => { setShowDealModal(false); setEditingDeal(null); }}
        onSave={handleSaveDeal}
        onSavePartner={handleSavePartner}
        editingDeal={editingDeal}
        advisors={advisors}
        existingCompanies={[...new Set(advisors.map(a => a.company).filter(Boolean))].sort()}
      />
      {/* Log Call Modal */}
      {showLogCallModal && logCallAdvisor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowLogCallModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[520px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e8e5e1] bg-gradient-to-r from-[#F7F5F2] to-white">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold font-['Newsreader'] text-gray-800">{logContactType === 'email' ? 'Log Email' : 'Log Call'}</h2>
                <button onClick={() => setShowLogCallModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-12px text-gray-500 mt-1">with {logCallAdvisor.name} · {logCallAdvisor.company}</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Duration */}
              {logContactType === 'call' && (
              <div>
                <label className="text-11px font-semibold text-gray-700 mb-1 block">Duration (minutes)</label>
                <input type="number" value={logCallDuration} onChange={e => setLogCallDuration(e.target.value)} className="w-24 text-13px border border-[#e8e5e1] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#157A6E]" />
              </div>
              )}
              {/* Sentiment */}
              <div>
                <label className="text-11px font-semibold text-gray-700 mb-2 block">{logContactType === 'email' ? 'Email Sentiment' : 'Call Sentiment'}</label>
                <div className="flex gap-2">
                  {(['positive', 'neutral', 'negative'] as const).map(s => (
                    <button key={s} onClick={() => setLogCallSentiment(s)} className={`px-4 py-2 text-12px font-medium rounded-lg border transition-colors ${logCallSentiment === s ? (s === 'positive' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : s === 'negative' ? 'bg-red-50 border-red-400 text-red-700' : 'bg-gray-100 border-gray-400 text-gray-700') : 'border-[#e8e5e1] text-gray-500 hover:border-gray-300'}`}>
                      {s === 'positive' ? '😊 Positive' : s === 'negative' ? '😟 Negative' : '😐 Neutral'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Meeting Type & Nature (for meetings/calls) */}
              {logContactType === 'call' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-11px font-semibold text-gray-700 mb-2 block">Meeting With</label>
                  <div className="flex gap-2">
                    {([['customer', 'Customer'], ['agent', 'Advisor']] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setLogMeetingType(logMeetingType === val ? '' : val)} className={`px-3 py-1.5 text-11px font-medium rounded-lg border transition-colors ${logMeetingType === val ? 'bg-[#157A6E] border-[#157A6E] text-white' : 'border-[#e8e5e1] text-gray-500 hover:border-gray-300'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-11px font-semibold text-gray-700 mb-2 block">Nature</label>
                  <select value={logMeetingNature} onChange={e => setLogMeetingNature(e.target.value as any)} className="w-full text-11px border border-[#e8e5e1] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#157A6E]">
                    <option value="">Select...</option>
                    <option value="discovery">Discovery</option>
                    <option value="needs-analysis">Needs Analysis</option>
                    <option value="solutions-presentation">Solutions Presentation</option>
                    <option value="relationship-building">Relationship Building</option>
                    <option value="QBR">QBR</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              )}
              {/* Notes */}
              <div>
                <label className="text-11px font-semibold text-gray-700 mb-1 block">{logContactType === 'email' ? 'Email Summary' : 'Call Notes'}</label>
                <textarea value={logCallNotes} onChange={e => setLogCallNotes(e.target.value)} placeholder={logContactType === 'email' ? "What was the email about? Key points, follow-ups, commitments..." : "What was discussed? Key takeaways, commitments made, next steps..."} className="w-full text-12px border border-[#e8e5e1] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#157A6E]" rows={4} />
              </div>
              {/* Deal mention */}
              <div>
                <label className="text-11px font-semibold text-gray-700 mb-1 block">{logContactType === 'email' ? 'Deal Referenced' : 'Deal Discussed'}</label>
                <select value={logCallDealMentioned} onChange={e => setLogCallDealMentioned(e.target.value)} className="w-full text-12px border border-[#e8e5e1] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#157A6E]">
                  <option value="">None</option>
                  {deals.filter(d => d.advisorId === logCallAdvisor.id).map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.stage})</option>
                  ))}
                </select>
              </div>
              {/* New deal toggle */}
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={logCallNewDeal} onChange={e => setLogCallNewDeal(e.target.checked)} className="rounded border-gray-300 text-[#157A6E] focus:ring-[#157A6E]" />
                  <span className="text-12px font-medium text-gray-800">{logContactType === 'email' ? 'New deal mentioned in this email' : 'New deal mentioned on this call'}</span>
                </label>
                {logCallNewDeal && (
                  <input value={logCallNewDealName} onChange={e => setLogCallNewDealName(e.target.value)} placeholder="Deal name..." className="mt-2 w-full text-12px border border-[#e8e5e1] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#157A6E]" />
                )}
              </div>
              {/* Submit */}
              <button onClick={handleLogCall} disabled={!logCallNotes.trim()} className="w-full px-4 py-2.5 text-13px font-semibold bg-[#157A6E] text-white rounded-lg hover:bg-[#0f5550] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {logContactType === 'email' ? 'Log Email' : 'Log Call'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      {showGlobalSearch && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-start justify-center pt-[15vh]" onClick={() => setShowGlobalSearch(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[560px] max-h-[60vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e8e5e1]">
              <Search className="w-5 h-5 text-gray-400" />
              <input autoFocus value={globalSearchQuery} onChange={e => setGlobalSearchQuery(e.target.value)} placeholder="Search partners, deals, contacts..." className="flex-1 text-[15px] focus:outline-none" />
              <kbd className="px-2 py-0.5 bg-gray-100 text-[10px] text-gray-500 rounded border border-gray-200 font-mono">ESC</kbd>
            </div>
            {globalSearchQuery && (
              <div className="overflow-y-auto max-h-[45vh] p-2">
                {(() => {
                  const q = globalSearchQuery.toLowerCase();
                  const matchedPartners = advisors.filter(a => a.name.toLowerCase().includes(q) || a.company.toLowerCase().includes(q)).slice(0, 5);
                  const matchedDeals = deals.filter(d => d.name.toLowerCase().includes(q)).slice(0, 5);
                  return (
                    <>
                      {matchedPartners.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 px-3 py-1">Partners</p>
                          {matchedPartners.map(a => (
                            <button key={a.id} onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); setActiveViewRaw('relationships'); setShowGlobalSearch(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-left transition-colors">
                              <div className="w-8 h-8 bg-[#157A6E] rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[10px] font-semibold">{a.name.split(' ').map(n => n[0]).join('')}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-13px font-medium text-gray-900">{a.name}</p>
                                <p className="text-11px text-gray-500">{a.company} · {a.tier}</p>
                              </div>
                              <span className="text-12px font-bold text-gray-600">{formatCurrency(a.mrr)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {matchedDeals.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 px-3 py-1">Deals</p>
                          {matchedDeals.map(d => {
                            const adv = advisors.find(a => a.id === d.advisorId);
                            return (
                              <button key={d.id} onClick={() => { setSelectedDeal(d); setActiveViewRaw('pipeline'); setShowGlobalSearch(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-left transition-colors">
                                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <DollarSign className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-13px font-medium text-gray-900">{d.name}</p>
                                  <p className="text-11px text-gray-500">{adv?.name || 'Unknown'} · {d.stage}</p>
                                </div>
                                <span className="text-12px font-bold text-gray-600">{formatCurrency(d.mrr)}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {matchedPartners.length === 0 && matchedDeals.length === 0 && (
                        <div className="px-3 py-8 text-center">
                          <p className="text-13px text-gray-500">No results for "{globalSearchQuery}"</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            {!globalSearchQuery && (
              <div className="px-5 py-6 text-center">
                <p className="text-12px text-gray-400">Start typing to search across partners and deals</p>
                <p className="text-[10px] text-gray-300 mt-1">Tip: Press ⌘K anywhere to open search</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Closed Lost Reason Modal */}
      {showClosedLostModal && closedLostDealId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => { setShowClosedLostModal(false); setClosedLostDealId(null); setClosedLostReason(''); setClosedLostDetail(''); }}>
          <div className="bg-white rounded-xl shadow-xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e8e5e1] bg-gradient-to-r from-[#F7F5F2] to-white">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold font-['Newsreader'] text-gray-800">Close Deal as Lost</h2>
                <button onClick={() => { setShowClosedLostModal(false); setClosedLostDealId(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-12px text-gray-500 mt-1">{deals.find(d => d.id === closedLostDealId)?.name || 'Deal'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-11px font-semibold text-gray-700 mb-2 block">Why was this deal lost? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {([['price', 'Price'], ['competitor', 'Competitor Won'], ['timing', 'Bad Timing'], ['reputation', 'Reputation'], ['feature-gap', 'Feature Gap'], ['relationship', 'Relationship Issue'], ['unknown', 'Unknown'], ['other', 'Other']] as [LostReason, string][]).map(([val, label]) => (
                    <button key={val} onClick={() => setClosedLostReason(val)} className={`px-3 py-2 text-12px font-medium rounded-lg border transition-colors text-left ${closedLostReason === val ? 'bg-red-50 border-red-400 text-red-700' : 'border-[#e8e5e1] text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-11px font-semibold text-gray-700 mb-1 block">Additional Details {closedLostReason === 'other' && <span className="text-red-500">*</span>}</label>
                <textarea value={closedLostDetail} onChange={e => setClosedLostDetail(e.target.value)} placeholder="What happened? Competitor name, pricing feedback, lessons learned..." className="w-full text-12px border border-[#e8e5e1] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#157A6E]" rows={3} />
              </div>
              <button onClick={() => closedLostDealId && handleCloseDealLost(closedLostDealId)} disabled={!closedLostReason || (closedLostReason === 'other' && !closedLostDetail.trim())} className="w-full px-4 py-2.5 text-13px font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Confirm Close as Lost
              </button>
            </div>
          </div>
        </div>
      )}

      <AIChat role="manager" selectedAdvisor={selectedAdvisor} live={true} />
    </div>
  );
}
