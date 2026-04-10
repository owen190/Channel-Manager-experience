'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, ChevronDown, ChevronRight, ArrowLeft,
  MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays,
  Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, X, RefreshCw, Users,
  TrendingDown, TrendingUp, BarChart3, Star, Shield, CheckCircle, ArrowUpRight, ArrowDownLeft,
  Settings, DollarSign, Brain, Zap, Download, Plus, Edit, MoreHorizontal, PlayCircle, Send, Loader2,
  Search, Building2, LayoutGrid, Filter, Calendar, Mail, FileText, Eye, UserPlus,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AIChat } from '@/components/shared/AIChat';
import { KPICard } from '@/components/shared/KPICard';
import { AdvisorTable } from '@/components/shared/AdvisorTable';
import { AdvisorPanel } from '@/components/shared/AdvisorPanel';
import { DealHealthBadge } from '@/components/shared/DealHealthBadge';
import { PulseBadge } from '@/components/shared/PulseBadge';
import { TrajectoryBadge } from '@/components/shared/TrajectoryBadge';
import { FrictionBadge } from '@/components/shared/FrictionBadge';
import { TierBadge } from '@/components/shared/TierBadge';
import { SupplierAccountabilityCard } from '@/components/shared/RatingsDisplay';
import { USAMap } from '@/components/shared/USAMap';
import { NAV_ITEMS_LEADER, QUARTER_END, DAYS_REMAINING, STAGE_WEIGHTS } from '@/lib/constants';
import { EngagementScore, DealStage, Advisor, Deal, Rep, FrictionLevel } from '@/lib/types';
import { adaptAdvisor, adaptDeal, adaptRep } from '@/lib/db/adapter';

type DealStageType = 'Discovery' | 'Qualifying' | 'Proposal' | 'Negotiating' | 'Closed Won' | 'Closed Lost' | 'Stalled';

const US_REGIONS: Record<string, { label: string; states: string[] }> = {
  'new-england': { label: 'New England', states: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT'] },
  'mid-atlantic': { label: 'Mid-Atlantic', states: ['NJ', 'NY', 'PA'] },
  'south-atlantic': { label: 'South Atlantic', states: ['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'WV', 'DC'] },
  'east-south-central': { label: 'East South Central', states: ['AL', 'KY', 'MS', 'TN'] },
  'west-south-central': { label: 'West South Central', states: ['AR', 'LA', 'OK', 'TX'] },
  'east-north-central': { label: 'East North Central', states: ['IL', 'IN', 'MI', 'OH', 'WI'] },
  'west-north-central': { label: 'West North Central', states: ['IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'] },
  'mountain': { label: 'Mountain', states: ['AZ', 'CO', 'ID', 'MT', 'NV', 'NM', 'UT', 'WY'] },
  'pacific': { label: 'Pacific', states: ['AK', 'CA', 'HI', 'OR', 'WA'] },
};

function seededRandom(seed: string, min: number = 0, max: number = 1): number {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (Math.sin(hash) * 10000 - Math.floor(Math.sin(hash) * 10000)) * (max - min) + min;
}

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

function EngLabel({ score }: { score: EngagementScore }) {
  const colors: Record<EngagementScore, string> = {
    Strong: 'bg-green-100 text-green-800',
    Steady: 'bg-amber-100 text-amber-800',
    Fading: 'bg-red-100 text-red-800',
  };
  return <span className={`px-2 py-0.5 rounded-full text-11px font-semibold ${colors[score]}`}>{score}</span>;
}

interface Signal {
  type: string;
  text: string;
  severity: 'critical' | 'high' | 'medium';
  repName: string;
  advisorName?: string;
  mrr?: number;
  time: string;
}

interface FrictionInsight {
  issue: string;
  severity: FrictionLevel;
  advisorCount: number;
  names: string[];
}

export default function LiveLeaderDashboard() {
  // ═══════════════════ STATE ═══════════════════
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [intents, setIntents] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveViewRaw] = useState('command-center');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Team view
  const [teamSubTab, setTeamSubTab] = useState<'overview' | 'prep' | 'risks' | 'geography'>('overview');
  const [riskSubTab, setRiskSubTab] = useState<'deals' | 'partners' | 'tsds'>('deals');
  const [expandedRepId, setExpandedRepId] = useState<string | null>(null);
  const [oneOnOneSchedule, setOneOnOneSchedule] = useState<Record<string, {day: string; time: string}>>(() => loadFromStorage('leader_1on1_schedule', {}));

  // Feature 1: Time-frame filtering on funnels
  const [forecastTimeFrame, setForecastTimeFrame] = useState<'30d' | 'quarter' | '6m' | 'ytd' | 'custom'>('quarter');
  const [customDays, setCustomDays] = useState(45);

  // Feature 2: Meeting type breakdown
  const [repMeetingBreakdown, setRepMeetingBreakdown] = useState<Record<string, {customer: number; agent: number; byNature: Record<string, number>}>>(() => loadFromStorage('leader_repMeetingBreakdown', {}));

  // Feature 4: Leader interaction logging
  const [leaderInteractions, setLeaderInteractions] = useState<Array<{id: string; advisorId: string; date: string; note: string; dealId?: string}>>(() => loadFromStorage('leader_interactions', []));
  const [showLogInteractionModal, setShowLogInteractionModal] = useState(false);
  const [logInteractionAdvisor, setLogInteractionAdvisor] = useState<string | null>(null);
  const [logInteractionNote, setLogInteractionNote] = useState('');

  // Feature 5: Historical trend reports
  const [showTrendsTab, setShowTrendsTab] = useState(false);

  // Feature 6: Forecast accuracy reporting
  const [forecastHistory, setForecastHistory] = useState<Record<string, Array<{period: string; forecasted: number; actual: number}>>>(() => loadFromStorage('leader_forecastHistory', {}));

  // Feature 7: Event playbooks with ROI tracking
  const [eventPlaybooks, setEventPlaybooks] = useState<Array<{id: string; name: string; date: string; budget: number; assignedCMs: string[]; targetMeetings: number; targetSignups: number; actualMeetings?: number; actualSignups?: number; roi?: number; status: 'planning' | 'active' | 'completed'}>>(() => loadFromStorage('leader_eventPlaybooks', [
    { id: 'e1', name: 'Q2 Partner Summit', date: '2026-04-20', budget: 50000, assignedCMs: ['Jordan R.', 'Sarah K.'], targetMeetings: 30, targetSignups: 45, actualMeetings: 28, actualSignups: 42, status: 'active' },
    { id: 'e2', name: 'Executive Roundtable', date: '2026-05-15', budget: 30000, assignedCMs: ['Marcus T.'], targetMeetings: 15, targetSignups: 20, status: 'planning' },
  ]));

  // Feature 8: Supplier collaboration tracking
  const [supplierCollabs, setSupplierCollabs] = useState<Array<{id: string; repId: string; supplierName: string; type: 'co-event' | 'joint-selling' | 'referral'; status: 'proposed' | 'active' | 'completed'; partnerIds: string[]; notes: string}>>(() => loadFromStorage('leader_supplierCollabs', [
    { id: 'sc1', repId: 'r1', supplierName: 'Acme Tech', type: 'joint-selling', status: 'active', partnerIds: ['a1', 'a2'], notes: 'Sales collaboration on enterprise deals' },
    { id: 'sc2', repId: 'r2', supplierName: 'NextGen Solutions', type: 'co-event', status: 'proposed', partnerIds: ['a3'], notes: 'Proposed webinar series' },
  ]));

  // Feature 9: Sentiment escalation alerts
  const [sentimentAlertThreshold, setSentimentAlertThreshold] = useState<'high' | 'moderate'>('moderate');

  // Feature 10: Overdue tasks report
  const [overdueThresholdDays, setOverdueThresholdDays] = useState(7);

  // Relationships view
  const [relSubTab, setRelSubTab] = useState<'partners' | 'groups' | 'tsds' | 'contacts' | 'flatlined' | 'trends' | 'supplierCollabs'>('partners');
  const [myPartnersOnly, setMyPartnersOnly] = useState(false);
  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [partnerGroups, setPartnerGroups] = useState<Array<{id: string; name: string; rules: Array<{field: string; operator: string; value: string}>; assignedTo: string[]; startDate?: string; endDate?: string}>>(() => loadFromStorage('leader_partnerGroups', [
    { id: 'g1', name: 'Texas Anchors', rules: [{field: 'tier', operator: 'equals', value: 'anchor'}, {field: 'state', operator: 'equals', value: 'TX'}], assignedTo: ['Jordan R.'] },
    { id: 'g2', name: 'New Onboards Q2', rules: [{field: 'stage', operator: 'equals', value: 'Onboarding'}], assignedTo: ['Whole Team'], startDate: '2026-04-01', endDate: '2026-06-30' },
    { id: 'g3', name: 'Fading Scaling Partners', rules: [{field: 'pulse', operator: 'equals', value: 'Fading'}, {field: 'tier', operator: 'equals', value: 'scaling'}], assignedTo: ['Sarah K.', 'Marcus T.'] },
  ]));
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [partnerSearch, setPartnerSearch] = useState('');

  // PIECE 1: Create Partner Modal state
  const [createPartnerForm, setCreatePartnerForm] = useState({ name: '', company: '', email: '', phone: '', tier: 'launching', state: '', notes: '' });

  // PIECE 2: Create Group Modal state
  const [createGroupForm, setCreateGroupForm] = useState({ name: '', rules: [{ field: 'tier', operator: 'equals', value: '' }], assignedCMs: [] as string[], startDate: '', endDate: '' });

  // PIECE 4: 1:1 Schedule Editor state
  const [editingScheduleRepId, setEditingScheduleRepId] = useState<string | null>(null);
  const [editScheduleForm, setEditScheduleForm] = useState({ day: 'Monday', time: '10:00 AM' });

  // PIECE 3: Meeting form state
  const [newMeetingForm, setNewMeetingForm] = useState({ time: '', title: '', detail: '', stake: 'Medium' });

  // Supplier modal state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCM, setNewSupplierCM] = useState('');
  const [newSupplierType, setNewSupplierType] = useState<'co-event' | 'joint-selling' | 'referral'>('co-event');
  const [newSupplierStatus, setNewSupplierStatus] = useState<'proposed' | 'active' | 'completed'>('proposed');
  const [newSupplierPartners, setNewSupplierPartners] = useState<string[]>([]);
  const [newSupplierNotes, setNewSupplierNotes] = useState('');

  // Event modal state
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventBudget, setNewEventBudget] = useState(0);
  const [newEventTargetMeetings, setNewEventTargetMeetings] = useState(0);
  const [newEventTargetSignups, setNewEventTargetSignups] = useState(0);
  const [newEventStatus, setNewEventStatus] = useState<'planning' | 'active' | 'completed'>('planning');
  const [newEventCMs, setNewEventCMs] = useState<string[]>([]);

  // Intelligence view
  const [signalSubTab, setSignalSubTab] = useState<'deal' | 'partner'>('deal');
  const [playbookAssignTo, setPlaybookAssignTo] = useState<'self' | 'one' | 'multiple' | 'team'>('self');
  const [playbookAssignCM, setPlaybookAssignCM] = useState('');
  const [playbookAssignMultiple, setPlaybookAssignMultiple] = useState<string[]>([]);
  const [diagnosticsFilter, setDiagnosticsFilter] = useState('');

  // Team Management view
  const [showTerritoryWizard, setShowTerritoryWizard] = useState(false);
  const [territoryWizardStep, setTerritoryWizardStep] = useState(1);
  const [perCMCadence, setPerCMCadence] = useState<Record<string, Partial<Record<string, number>>>>(() => loadFromStorage('leader_perCMCadence', {}));
  const [teamMgmtSubTab, setTeamMgmtSubTab] = useState<'roster' | 'cadence' | 'alerts' | 'goals'>('roster');
  const [cadenceRules, setCadenceRules] = useState<Record<string, number>>(() => loadFromStorage('leader_cadenceRules', {
    anchor: 7, scaling: 10, building: 14, launching: 21,
  }));
  const [alertThresholds, setAlertThresholds] = useState(() => loadFromStorage('leader_alertThresholds', {
    dealPushThreshold: 50000, dealPushCount: 2, cadenceComplianceThreshold: 80, frictionCountThreshold: 3,
  }));
  const [notifSettings, setNotifSettings] = useState(() => loadFromStorage('leader_notifSettings', {
    dailyDigest: true, criticalSignals: true, forecastOverrides: true, cadenceViolations: false, weeklyReport: true, newPartnerAlerts: true,
  }));
  const [teamGoals, setTeamGoals] = useState(() => loadFromStorage('leader_teamGoals', {
    partnerActivationTarget: 35, winRateTarget: 35, pipelineCoverageTarget: 3.0,
  }));

  // Per-rep editable cadence compliance data (persisted)
  const [repCadenceData, setRepCadenceData] = useState<Record<string, { overall: number; anchor: number; scaling: number; building: number; launching: number }>>(() => loadFromStorage('leader_repCadence', {}));

  // Per-rep editable activity data (persisted)
  const [repActivityData, setRepActivityData] = useState<Record<string, { meetings: number; calls: number; emails: number }>>(() => loadFromStorage('leader_repActivity', {}));

  // Editable meetings (persisted)
  const [storedMeetings, setStoredMeetings] = useState<Array<{ time: string; title: string; detail: string; stake: string; stakeColor: string; borderColor: string }>>(() => loadFromStorage('leader_meetings', []));
  const [editingMeetings, setEditingMeetings] = useState(false);

  // Deal actions
  const [overrideActions, setOverrideActions] = useState<Record<string, 'approved' | 'denied'>>({});
  const [dealActions, setDealActions] = useState<Record<string, 'flagged' | 'joined'>>({});

  // Playbook state
  const [launchedPlaybooks, setLaunchedPlaybooks] = useState<Array<{templateId: string; advisorId: string; advisorName: string; launchedAt: string; priority: 'critical' | 'high' | 'medium'; completedSteps: number[]; skippedSteps: number[]; customSteps?: Array<{day: number; label: string; desc: string; phase: string}>; notes?: string; playbookName?: string}>>(() => loadFromStorage('cc_launchedPlaybooks', []));
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [playbookModalAdvisor, setPlaybookModalAdvisor] = useState<Advisor | null>(null);
  const [playbookModalMode, setPlaybookModalMode] = useState<'template' | 'custom'>('template');
  const [selectedPlaybookTemplate, setSelectedPlaybookTemplate] = useState<string | null>(null);
  const [playbookPriority, setPlaybookPriority] = useState<'critical' | 'high' | 'medium'>('high');
  const [customPlaybookName, setCustomPlaybookName] = useState('');
  const [customPlaybookSteps, setCustomPlaybookSteps] = useState<Array<{label: string; desc: string; day: number}>>([{label: '', desc: '', day: 1}]);
  const [playbookAdvisorSearch, setPlaybookAdvisorSearch] = useState('');
  const [showPlaybookAdvisorPicker, setShowPlaybookAdvisorPicker] = useState(false);

  const playbookTemplates = [
    { id: 'win-back', title: 'Win-Back', icon: '🔄', subtitle: 'Re-engage at-risk partners', duration: '7 days', bgColor: 'bg-rose-50', borderColor: 'border-l-rose-400', color: '#e11d48', tagColor: 'bg-rose-100 text-rose-800', category: 'Retention', steps: [
      { day: 1, label: 'Review partner history', desc: 'Analyze engagement decline and identify root cause', phase: 'Assess' },
      { day: 2, label: 'Internal strategy session', desc: 'Align with CM on win-back approach', phase: 'Plan' },
      { day: 3, label: 'Direct outreach', desc: 'Personal call or meeting with partner', phase: 'Engage' },
      { day: 5, label: 'Value reinforcement', desc: 'Share success stories and new capabilities', phase: 'Engage' },
      { day: 7, label: 'Follow-up commitment', desc: 'Secure next steps and renewed engagement plan', phase: 'Close' },
    ]},
    { id: 'onboarding', title: 'Onboarding', icon: '🚀', subtitle: 'Launch new partners', duration: '14 days', bgColor: 'bg-blue-50', borderColor: 'border-l-blue-400', color: '#2563eb', tagColor: 'bg-blue-100 text-blue-800', category: 'Activation', steps: [
      { day: 1, label: 'Welcome & intro', desc: 'Initial meeting and expectation setting', phase: 'Setup' },
      { day: 3, label: 'Training session', desc: 'Product and process training', phase: 'Setup' },
      { day: 5, label: 'First deal support', desc: 'Guide through first opportunity', phase: 'Activate' },
      { day: 10, label: 'Progress check-in', desc: 'Review early metrics and adjust', phase: 'Monitor' },
      { day: 14, label: 'Graduation review', desc: 'Assess readiness for independent operation', phase: 'Close' },
    ]},
    { id: 'tier-upgrade', title: 'Tier Upgrade', icon: '⬆️', subtitle: 'Accelerate high-performers', duration: '30 days', bgColor: 'bg-amber-50', borderColor: 'border-l-amber-400', color: '#d97706', tagColor: 'bg-amber-100 text-amber-800', category: 'Growth', steps: [
      { day: 1, label: 'Performance review', desc: 'Document growth trajectory and potential', phase: 'Assess' },
      { day: 5, label: 'Expansion discussion', desc: 'Explore new product lines and territories', phase: 'Plan' },
      { day: 10, label: 'Joint business plan', desc: 'Co-create growth targets and strategy', phase: 'Plan' },
      { day: 20, label: 'Executive alignment', desc: 'Connect with partner leadership', phase: 'Engage' },
      { day: 30, label: 'Tier promotion', desc: 'Formalize upgrade with new benefits', phase: 'Close' },
    ]},
    { id: 'qbr', title: 'QBR Prep', icon: '📊', subtitle: 'Quarterly business review', duration: '7 days', bgColor: 'bg-purple-50', borderColor: 'border-l-purple-400', color: '#7c3aed', tagColor: 'bg-purple-100 text-purple-800', category: 'Cadence', steps: [
      { day: 1, label: 'Data compilation', desc: 'Pull performance metrics and trends', phase: 'Prepare' },
      { day: 3, label: 'Deck preparation', desc: 'Build QBR presentation with insights', phase: 'Prepare' },
      { day: 5, label: 'Internal pre-brief', desc: 'Align team on talking points and asks', phase: 'Align' },
      { day: 6, label: 'QBR meeting', desc: 'Conduct review with partner', phase: 'Execute' },
      { day: 7, label: 'Follow-up actions', desc: 'Document commitments and next steps', phase: 'Close' },
    ]},
  ];

  const setActiveView = (view: string) => {
    setActiveViewRaw(view);
    if (view !== 'relationships') {
      setSelectedAdvisor(null);
      setPanelOpen(false);
    }
  };

  // ═══════════════════ DATA FETCHING ═══════════════════
  const fetchData = async () => {
    setLoading(true);
    try {
      const [advisorsRes, dealsRes, repsRes, intentsRes, ratingsRes] = await Promise.all([
        fetch('/api/live/advisors'),
        fetch('/api/live/deals'),
        fetch('/api/live/reps'),
        fetch('/api/live/intent'),
        fetch('/api/live/ratings'),
      ]);
      const rawAdvisors = await advisorsRes.json();
      const rawDeals = await dealsRes.json();
      const rawReps = await repsRes.json();
      const rawIntents = await intentsRes.json();
      const rawRatings = await ratingsRes.json();
      setAdvisors(rawAdvisors.map(adaptAdvisor));
      setDeals(rawDeals.map(adaptDeal));
      setReps(rawReps.map(adaptRep));
      setIntents(Array.isArray(rawIntents) ? rawIntents : []);
      setRatings(rawRatings);
    } catch (err) {
      console.error('Failed to fetch live data:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { saveToStorage('cc_launchedPlaybooks', launchedPlaybooks); }, [launchedPlaybooks]);
  useEffect(() => { saveToStorage('leader_cadenceRules', cadenceRules); }, [cadenceRules]);
  useEffect(() => { saveToStorage('leader_alertThresholds', alertThresholds); }, [alertThresholds]);
  useEffect(() => { saveToStorage('leader_notifSettings', notifSettings); }, [notifSettings]);
  useEffect(() => { saveToStorage('leader_teamGoals', teamGoals); }, [teamGoals]);
  useEffect(() => { saveToStorage('leader_repCadence', repCadenceData); }, [repCadenceData]);
  useEffect(() => { saveToStorage('leader_repActivity', repActivityData); }, [repActivityData]);
  useEffect(() => { saveToStorage('leader_meetings', storedMeetings); }, [storedMeetings]);
  useEffect(() => { saveToStorage('leader_1on1_schedule', oneOnOneSchedule); }, [oneOnOneSchedule]);
  useEffect(() => { saveToStorage('leader_partnerGroups', partnerGroups); }, [partnerGroups]);
  useEffect(() => { saveToStorage('leader_perCMCadence', perCMCadence); }, [perCMCadence]);
  useEffect(() => { saveToStorage('leader_repMeetingBreakdown', repMeetingBreakdown); }, [repMeetingBreakdown]);
  useEffect(() => { saveToStorage('leader_interactions', leaderInteractions); }, [leaderInteractions]);
  useEffect(() => { saveToStorage('leader_forecastHistory', forecastHistory); }, [forecastHistory]);
  useEffect(() => { saveToStorage('leader_eventPlaybooks', eventPlaybooks); }, [eventPlaybooks]);
  useEffect(() => { saveToStorage('leader_supplierCollabs', supplierCollabs); }, [supplierCollabs]);

  // ═══════════════════ COMPUTED DATA ═══════════════════
  const formatCurrency = (num: number): string => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num}`;
  };

  const leaderOwned = useMemo(() => {
    return new Set(advisors
      .filter(a => a.tier === 'anchor' && (a.relationshipStage === 'Strategic' || a.relationshipStage === 'Scaling'))
      .map(a => a.id));
  }, [advisors]);

  const leaderInvolved = useMemo(() => {
    return new Set(deals
      .filter(d => {
        const advisorIds = d.advisorIds?.length ? d.advisorIds : [d.advisorId];
        return advisorIds.some(id => leaderOwned.has(id)) || d.mrr >= 15000;
      })
      .map(d => d.id));
  }, [deals, leaderOwned]);

  const getDealAdvisorIds = (deal: Deal): string[] => {
    if (deal.advisorIds && deal.advisorIds.length > 0) return deal.advisorIds;
    return deal.advisorId ? [deal.advisorId] : [];
  };

  const getRepAdvisors = (rep: Rep): Advisor[] => {
    const ids = new Set<string>();
    if (rep.advisorIds) rep.advisorIds.forEach(id => ids.add(id));
    if (rep.exceptionAdvisors) rep.exceptionAdvisors.forEach(id => ids.add(id));
    deals.filter(d => d.repId === rep.id).forEach(d => getDealAdvisorIds(d).forEach(id => ids.add(id)));
    return advisors.filter(a => ids.has(a.id));
  };

  const getRepCadence = (repId: string) => {
    if (repCadenceData[repId]) return repCadenceData[repId];
    return {
      overall: Math.floor(seededRandom(repId + 'cadence', 60, 95)),
      anchor: Math.floor(seededRandom(repId + 'ca', 80, 100)),
      scaling: Math.floor(seededRandom(repId + 'cs', 70, 95)),
      building: Math.floor(seededRandom(repId + 'cb', 55, 90)),
      launching: Math.floor(seededRandom(repId + 'cl', 40, 85)),
    };
  };

  const getRepActivity = (repId: string) => {
    if (repActivityData[repId]) return repActivityData[repId];
    return {
      meetings: Math.floor(seededRandom(repId + 'meetings', 5, 25)),
      calls: Math.floor(seededRandom(repId + 'calls', 10, 35)),
      emails: Math.floor(seededRandom(repId + 'emails', 40, 80)),
    };
  };

  // Feature 1: Filter deals by timeframe
  const getFilteredDealsByTimeframe = (dealsToFilter: Deal[]): Deal[] => {
    const now = new Date();
    const cutoffDate = new Date();
    const lastModifiedOrCloseDate = (d: Deal) => new Date(d.lastModified || d.closeDate);

    if (forecastTimeFrame === '30d') {
      cutoffDate.setDate(now.getDate() - 30);
    } else if (forecastTimeFrame === 'quarter') {
      cutoffDate.setMonth(now.getMonth() - 3);
    } else if (forecastTimeFrame === '6m') {
      cutoffDate.setMonth(now.getMonth() - 6);
    } else if (forecastTimeFrame === 'ytd') {
      cutoffDate.setFullYear(now.getFullYear(), 0, 1);
    } else if (forecastTimeFrame === 'custom') {
      cutoffDate.setDate(now.getDate() - customDays);
    }

    return dealsToFilter.filter(d => lastModifiedOrCloseDate(d) >= cutoffDate);
  };

  // Feature 2: Compute meeting breakdown for each rep
  const getRepMeetingBreakdownData = (repId: string) => {
    if (repMeetingBreakdown[repId]) return repMeetingBreakdown[repId];
    const repAdvisors = getRepAdvisors(reps.find(r => r.id === repId)!);
    let customer = 0, agent = 0;
    const byNature: Record<string, number> = { discovery: 0, 'needs-analysis': 0, 'solutions-presentation': 0, 'relationship-building': 0, 'QBR': 0, event: 0, other: 0 };
    repAdvisors.forEach(a => {
      a.activity.filter(act => act.type === 'meeting').forEach(act => {
        if (act.meetingType === 'customer') customer++;
        else if (act.meetingType === 'agent') agent++;
        if (act.meetingNature && act.meetingNature in byNature) byNature[act.meetingNature]++;
      });
    });
    return { customer: customer || Math.floor(seededRandom(repId + 'cm', 3, 10)), agent: agent || Math.floor(seededRandom(repId + 'ag', 2, 8)), byNature: Object.keys(byNature).length === 0 ? { discovery: 3, 'needs-analysis': 2, 'solutions-presentation': 1, 'relationship-building': 1, 'QBR': 0, event: 0, other: 0 } : byNature };
  };

  // Feature 4: Compute leader touch impact on deal cycles
  const getLeaderTouchImpact = () => {
    const touchedDeals = allDeals.filter(d => d.leaderTouchedAt && d.leaderTouchedAt.length > 0);
    const untouchedDeals = allDeals.filter(d => !d.leaderTouchedAt || d.leaderTouchedAt.length === 0);
    const avgCycleTouched = touchedDeals.length > 0 ? Math.round(touchedDeals.reduce((s, d) => s + d.daysInStage, 0) / touchedDeals.length) : 0;
    const avgCycleUntouched = untouchedDeals.length > 0 ? Math.round(untouchedDeals.reduce((s, d) => s + d.daysInStage, 0) / untouchedDeals.length) : 0;
    return { avgCycleTouched, avgCycleUntouched, touchedCount: touchedDeals.length };
  };

  // Feature 6: Generate default forecast history if not available
  const getForecastHistoryData = (repId: string) => {
    if (forecastHistory[repId]) return forecastHistory[repId];
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarters.map(q => ({
      period: q,
      forecasted: Math.floor(seededRandom(repId + q + 'f', 50000, 300000)),
      actual: Math.floor(seededRandom(repId + q + 'a', 45000, 280000)),
    }));
  };

  // Feature 10: Compute overdue tasks
  const getOverdueTasks = () => {
    const now = new Date();
    const overdueTasks: Array<{text: string; daysOverdue: number; repName: string; dealName: string}> = [];
    allDeals.forEach(d => {
      d.actionItems?.filter(ai => ai.status === 'overdue' || ai.daysOld > overdueThresholdDays).forEach(ai => {
        const rep = reps.find(r => r.id === d.repId);
        overdueTasks.push({ text: ai.text, daysOverdue: ai.daysOld, repName: rep?.name || 'Unknown', dealName: d.name });
      });
    });
    return overdueTasks;
  };

  const timeAgo = (date: Date | string): string => {
    const now = new Date();
    const d = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const signals = useMemo(() => {
    const sigs: Signal[] = [];
    const now = new Date();
    deals.forEach(d => {
      if (d.health === 'At Risk' || d.health === 'Critical') {
        const rep = reps.find(r => r.id === d.repId);
        const advisorIds = d.advisorIds?.length ? d.advisorIds : [d.advisorId];
        const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || 'Unknown';
        const signalDate = new Date(now.getTime() - Math.min(d.daysInStage, 7) * 86400000 * 0.3);
        sigs.push({ type: 'deal_at_risk', text: `${d.name} is ${d.health}. Immediate action needed.`, severity: 'critical', repName: rep?.name || 'Unknown', advisorName, mrr: d.mrr, time: timeAgo(signalDate) });
      }
    });
    deals.forEach(d => {
      if (d.overrideRequested && !overrideActions[d.id]) {
        const rep = reps.find(r => r.id === d.repId);
        const signalDate = new Date(now.getTime() - d.daysInStage * 86400000 * 0.5);
        sigs.push({ type: 'override_pending', text: `${d.name} has a pending forecast override request.`, severity: 'medium', repName: rep?.name || 'Unknown', mrr: d.mrr, time: timeAgo(signalDate) });
      }
    });
    advisors.forEach(a => {
      if (a.tier === 'anchor' && (a.pulse === 'Fading' || a.pulse === 'Flatline')) {
        const daysSinceContact = a.lastContact ? Math.floor((now.getTime() - new Date(a.lastContact).getTime()) / 86400000) : 7;
        const signalDate = new Date(now.getTime() - Math.min(daysSinceContact, 14) * 86400000);
        sigs.push({ type: 'partner_fading', text: `${a.name} is ${a.pulse}. May need engagement intervention.`, severity: 'high', repName: 'Account Team', advisorName: a.name, mrr: a.mrr, time: timeAgo(signalDate) });
      }
    });
    advisors.forEach(a => {
      if (a.trajectory === 'Freefall') {
        const daysSinceContact = a.lastContact ? Math.floor((now.getTime() - new Date(a.lastContact).getTime()) / 86400000) : 10;
        const signalDate = new Date(now.getTime() - Math.min(daysSinceContact, 21) * 86400000);
        sigs.push({ type: 'trajectory_freefall', text: `${a.name} in freefall. Risk of complete disengagement.`, severity: 'critical', repName: 'Account Team', advisorName: a.name, mrr: a.mrr, time: timeAgo(signalDate) });
      }
    });
    advisors.forEach(a => {
      if (a.trajectory === 'Accelerating' || a.trajectory === 'Climbing') {
        const connectedDays = a.connectedSince ? Math.floor((now.getTime() - new Date(a.connectedSince).getTime()) / 86400000) : 30;
        const signalDate = new Date(now.getTime() - Math.min(connectedDays * 0.1, 7) * 86400000);
        sigs.push({ type: 'expansion', text: `${a.name} is ${a.trajectory}. Strong growth potential — cross-sell opportunity.`, severity: 'medium', repName: 'Account Team', advisorName: a.name, mrr: a.mrr, time: timeAgo(signalDate) });
      }
    });
    // Feature 9: Sentiment escalation alerts
    advisors.forEach(a => {
      if (a.tone === 'Cool' && (a.friction === 'High' || a.friction === 'Critical')) {
        const daysSinceContact = a.lastContact ? Math.floor((now.getTime() - new Date(a.lastContact).getTime()) / 86400000) : 5;
        const signalDate = new Date(now.getTime() - Math.min(daysSinceContact, 10) * 86400000);
        const severity = a.friction === 'Critical' ? 'critical' : 'high';
        sigs.push({ type: 'sentiment_alert', text: `${a.name} showing negative sentiment. ${a.friction} friction detected — immediate engagement needed.`, severity, repName: 'Account Team', advisorName: a.name, mrr: a.mrr, time: timeAgo(signalDate) });
      }
    });
    return sigs.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [deals, advisors, reps, overrideActions, sentimentAlertThreshold]);

  const frictionInsights = useMemo(() => {
    const insights: FrictionInsight[] = [];
    const frictionLevels: FrictionLevel[] = ['Critical', 'High', 'Moderate'];
    frictionLevels.forEach(level => {
      const advisorsWithFriction = advisors.filter(a => a.friction === level);
      if (advisorsWithFriction.length >= 2) {
        insights.push({ issue: `${level} friction across multiple partners`, severity: level, advisorCount: advisorsWithFriction.length, names: advisorsWithFriction.map(a => a.name) });
      }
    });
    return insights;
  }, [advisors]);

  const unassignedPartners = useMemo(() => {
    const allRepAdvisorIds = new Set<string>();
    reps.forEach(rep => {
      if (rep.advisorIds) rep.advisorIds.forEach(id => allRepAdvisorIds.add(id));
      if (rep.exceptionAdvisors) rep.exceptionAdvisors.forEach(id => allRepAdvisorIds.add(id));
    });
    deals.forEach(d => {
      if (d.repId) {
        const aids = getDealAdvisorIds(d);
        aids.forEach(id => allRepAdvisorIds.add(id));
      }
    });
    return advisors.filter(a => !allRepAdvisorIds.has(a.id));
  }, [advisors, reps, deals]);

  const handleAdvisorClick = (advisorId: string) => {
    const advisor = advisors.find(a => a.id === advisorId);
    if (advisor) {
      setSelectedAdvisor(advisor);
      if (activeView === 'relationships') setSelectedAdvisor(advisor);
      else setPanelOpen(true);
    }
  };

  const updateAdvisorField = async (field: string, value: any) => {
    if (!selectedAdvisor) return;
    const updated = { ...selectedAdvisor, [field]: value };
    setAdvisors(prev => prev.map(a => a.id === selectedAdvisor.id ? { ...a, [field]: value } : a));
    setSelectedAdvisor(updated);
    try {
      await fetch('/api/live/advisors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...selectedAdvisor, [field]: value }) });
    } catch (err) { console.error('Failed to update advisor:', err); }
  };

  // KPI computations
  const teamMRR = reps.reduce((sum, rep) => sum + rep.managedMRR, 0);
  const prevTeamMRR = teamMRR * 0.942;
  const mrrChange = ((teamMRR - prevTeamMRR) / prevTeamMRR * 100).toFixed(1);
  const teamTarget = reps.reduce((sum, rep) => sum + rep.quotaTarget, 0);
  const teamCommit = reps.reduce((sum, rep) => sum + rep.currentCommit, 0);
  const commitGap = teamTarget - teamCommit;
  const commitPercentage = teamTarget > 0 ? Math.round((teamCommit / teamTarget) * 100) : 0;
  const avgWinRate = reps.length > 0 ? Math.round(reps.reduce((s, r) => s + r.winRate, 0) / reps.length) : 0;
  const avgCycle = reps.length > 0 ? Math.round(reps.reduce((s, r) => s + r.avgCycle, 0) / reps.length) : 0;
  const allDeals = deals;
  const teamPipeline = allDeals.reduce((sum, deal) => sum + deal.mrr, 0);
  const weightedPipeline = allDeals.reduce((sum, deal) => {
    const stageWeight = STAGE_WEIGHTS.find(sw => sw.stage === deal.stage)?.weight || 0;
    return sum + (deal.mrr * stageWeight);
  }, 0);
  const activeDealCount = allDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled').length;
  const atRiskDeals = allDeals.filter(d => d.health === 'At Risk' || d.health === 'Stalled' || d.health === 'Critical');
  const atRiskAdvisors = advisors.filter(a => a.trajectory === 'Slipping' || a.trajectory === 'Freefall');
  const atRiskMRR = atRiskAdvisors.reduce((s, a) => s + a.mrr, 0);

  // Upside computation
  const upsideDeals = allDeals.filter(d => d.isUpside);
  const totalUpside = upsideDeals.reduce((s, d) => s + d.mrr, 0);
  const upsideWinRate = upsideDeals.length > 0 ? Math.round(upsideDeals.reduce((s, d) => s + d.probability, 0) / upsideDeals.length) : 0;
  const upsideExpectedValue = upsideDeals.reduce((s, d) => s + d.mrr * (d.probability / 100), 0);

  // ═══════════════════ LOADING / EMPTY STATES ═══════════════════
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

  if (advisors.length === 0 && reps.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F5F2]">
        <div className="text-center max-w-md">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold font-['Newsreader'] text-gray-800 mb-2">No Live Data Yet</h2>
          <p className="text-13px text-gray-500 font-['Inter'] mb-4">Add reps, advisors, and deals in the admin panel to populate the live dashboard.</p>
          <a href="/live" className="inline-flex items-center gap-2 px-4 py-2 bg-[#157A6E] text-white rounded-lg text-13px font-medium hover:bg-[#125f56]">Go to Admin Panel</a>
        </div>
      </div>
    );
  }

  // ═══════════════════ VIEW 1: COMMAND CENTER ═══════════════════
  const renderCommandCenter = () => {
    const greeting = (() => {
      const h = new Date().getHours();
      return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    })();

    const myDeals = allDeals.filter(d => leaderInvolved.has(d.id));
    const criticalSignals = signals.filter(s => s.severity === 'critical');
    const stalledHighValue = allDeals.filter(d => (d.daysInStage > 14 && d.mrr >= 15000) || (d.health === 'At Risk' && d.mrr >= 10000));
    const pendingOverrides = allDeals.filter(d => d.overrideRequested && !overrideActions[d.id]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">{greeting}, Owen</h1>
          <p className="text-12px text-gray-500 mt-1">Here's what matters most today · {DAYS_REMAINING} days left in quarter</p>
        </div>

        {/* QUICK STATS BAR */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Team MRR" value={formatCurrency(teamMRR)} change={`${mrrChange}% vs last month`} changeType={parseFloat(mrrChange) > 0 ? "positive" : "negative"} />
          <KPICard label="Pipeline (Weighted)" value={formatCurrency(weightedPipeline)} change={`${teamTarget > 0 ? (weightedPipeline / teamTarget).toFixed(1) : '0'}× coverage`} changeType="neutral" />
          <KPICard label="Commit vs Target" value={`${commitPercentage}%`} change={`${formatCurrency(teamCommit)} / ${formatCurrency(teamTarget)}`} changeType={commitPercentage >= 85 ? "positive" : "negative"} />
          <KPICard label="Upside" value={formatCurrency(totalUpside)} change={`${upsideWinRate}% win rate`} changeType="neutral" />
        </div>

        {/* HIGHEST-IMPACT ACTIONS */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Highest-Impact Actions</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(() => {
            const actionCards = [];
            const biggestStalled = stalledHighValue.sort((a, b) => b.mrr - a.mrr)[0];
            if (biggestStalled) {
              const rep = reps.find(r => r.id === biggestStalled.repId);
              const advId = getDealAdvisorIds(biggestStalled)[0];
              const adv = advisors.find(a => a.id === advId);
              actionCards.push({
                icon: '🔥', level: 'Critical', color: '#ef4444',
                title: `Call ${adv?.company || 'partner'} — ${formatCurrency(biggestStalled.mrr)} deal stalling`,
                desc: `${rep?.name}'s deal stuck in ${biggestStalled.stage} for ${biggestStalled.daysInStage} days.`,
              });
            }
            if (unassignedPartners.length > 0) {
              const anchorCount = unassignedPartners.filter(a => a.tier === 'anchor').length;
              actionCards.push({
                icon: '⚠️', level: 'High Priority', color: '#f59e0b',
                title: `Review ${unassignedPartners.length} unassigned relationships`,
                desc: `Partners without an assigned CM${anchorCount > 0 ? `: ${anchorCount} anchor-tier` : ''}.`,
              });
            }
            if (pendingOverrides.length > 0) {
              const biggest = pendingOverrides.sort((a, b) => b.mrr - a.mrr)[0];
              const rep = reps.find(r => r.id === biggest.repId);
              actionCards.push({
                icon: '📈', level: 'Opportunity', color: '#157A6E',
                title: `Approve ${rep?.name}'s override — ${formatCurrency(biggest.mrr)} commit`,
                desc: `${biggest.name} — wants upside override. Probability: ${biggest.probability}%.`,
              });
            }
            return actionCards.slice(0, 3).map((action, i) => {
              const handleActionClick = () => {
                if (i === 0) {
                  const biggestStalled = stalledHighValue.sort((a, b) => b.mrr - a.mrr)[0];
                  if (biggestStalled) setActiveView('forecast-pipeline');
                } else if (i === 1) {
                  setActiveView('relationships');
                } else if (i === 2) {
                  // Scroll to overrides in action items
                  document.querySelector('[data-action="overrides"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              };
              return (
                <div key={i} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-all" style={{ borderLeft: `3px solid ${action.color}` }} onClick={handleActionClick}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[16px]">{action.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.5px]" style={{ color: action.color }}>{action.level}</span>
                  </div>
                  <p className="text-13px font-semibold text-gray-800 mb-1">{action.title}</p>
                  <p className="text-11px text-gray-500">{action.desc}</p>
                </div>
              );
            });
          })()}
        </div>

        {/* ACTION ITEMS + TODAY'S MEETINGS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Your Action Items</h3>
            </div>
            <div className="space-y-2">
              {pendingOverrides.filter(d => !overrideActions[d.id]).map((d, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#fafaf8] hover:bg-gray-100">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-red-500" />
                  <div className="flex-1">
                    <p className="text-12px font-semibold text-gray-800">Approve forecast override: {d.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{reps.find(r => r.id === d.repId)?.name} · {formatCurrency(d.mrr)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setOverrideActions(prev => ({...prev, [d.id]: 'approved'})); setTimeout(() => setOverrideActions(prev => {const {[d.id]: _, ...rest} = prev; return rest;}), 2000); }} className="px-2 py-1 text-[9px] font-bold bg-green-100 text-green-800 rounded hover:bg-green-200">Approve</button>
                    <button onClick={() => { setOverrideActions(prev => ({...prev, [d.id]: 'denied'})); setTimeout(() => setOverrideActions(prev => {const {[d.id]: _, ...rest} = prev; return rest;}), 2000); }} className="px-2 py-1 text-[9px] font-bold bg-red-100 text-red-800 rounded hover:bg-red-200">Deny</button>
                  </div>
                </div>
              ))}
              {stalledHighValue.slice(0, 2).map((d, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#fafaf8] cursor-pointer hover:bg-gray-100">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-amber-500" />
                  <div>
                    <p className="text-12px font-semibold text-gray-800">{d.name} — {d.daysInStage}d stalled</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{reps.find(r => r.id === d.repId)?.name} · {formatCurrency(d.mrr)} MRR</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Today's Key Meetings</h3>
              <button onClick={() => setEditingMeetings(!editingMeetings)} className="text-[10px] text-[#157A6E] font-semibold cursor-pointer hover:underline">{editingMeetings ? 'Done' : 'Edit'}</button>
            </div>
            <div className="space-y-2">
              {storedMeetings.map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg border border-[#e8e5e1]" style={{ borderLeft: `3px solid ${m.borderColor}` }}>
                  <div className="text-[11px] font-bold text-[#157A6E] min-w-[55px]">{m.time}</div>
                  <div className="flex-1">
                    <p className="text-12px font-semibold text-gray-800">{m.title}</p>
                    <p className="text-[10px] text-gray-500">{m.detail}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[9px] font-semibold ${m.stakeColor} whitespace-nowrap`}>{m.stake}</span>
                  {editingMeetings && <button onClick={() => { setStoredMeetings(prev => prev.filter((_, idx) => idx !== i)); saveToStorage('leader_meetings', storedMeetings.filter((_, idx) => idx !== i)); }} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
                </div>
              ))}

              {editingMeetings && (
                <div className="bg-gray-50 rounded-lg p-3 border border-[#e8e5e1] space-y-3">
                  <p className="text-[10px] font-bold uppercase text-gray-600">Add New Meeting</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" value={newMeetingForm.time} onChange={(e) => setNewMeetingForm(prev => ({...prev, time: e.target.value}))} className="px-2 py-1 border border-[#e8e5e1] rounded text-[11px] focus:outline-none focus:border-[#157A6E]" placeholder="Time" />
                    <input type="text" value={newMeetingForm.title} onChange={(e) => setNewMeetingForm(prev => ({...prev, title: e.target.value}))} className="px-2 py-1 border border-[#e8e5e1] rounded text-[11px] focus:outline-none focus:border-[#157A6E]" placeholder="Title" />
                    <input type="text" value={newMeetingForm.detail} onChange={(e) => setNewMeetingForm(prev => ({...prev, detail: e.target.value}))} className="col-span-2 px-2 py-1 border border-[#e8e5e1] rounded text-[11px] focus:outline-none focus:border-[#157A6E]" placeholder="Detail" />
                    <select value={newMeetingForm.stake} onChange={(e) => setNewMeetingForm(prev => ({...prev, stake: e.target.value}))} className="col-span-2 px-2 py-1 border border-[#e8e5e1] rounded text-[11px] focus:outline-none focus:border-[#157A6E]">
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <button onClick={() => {
                    if (newMeetingForm.time && newMeetingForm.title) {
                      const stakeColorMap: Record<string, string> = {High: 'bg-red-100 text-red-800', Medium: 'bg-amber-100 text-amber-800', Low: 'bg-green-100 text-green-800'};
                      const borderColorMap: Record<string, string> = {High: '#ef4444', Medium: '#f59e0b', Low: '#157A6E'};
                      const updated = [...storedMeetings, {time: newMeetingForm.time, title: newMeetingForm.title, detail: newMeetingForm.detail, stake: newMeetingForm.stake, stakeColor: stakeColorMap[newMeetingForm.stake] || 'bg-gray-100 text-gray-800', borderColor: borderColorMap[newMeetingForm.stake] || '#999'}];
                      setStoredMeetings(updated);
                      saveToStorage('leader_meetings', updated);
                      setNewMeetingForm({time: '', title: '', detail: '', stake: 'Medium'});
                    }
                  }} className="w-full px-2 py-1 text-[10px] font-bold text-white bg-[#157A6E] rounded hover:bg-[#126a5f]">Save Meeting</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════ VIEW 2: FORECAST PIPELINE ═══════════════════
  const renderForecastPipeline = () => {
    // Feature 1: Apply timeframe filter
    const filteredDeals = getFilteredDealsByTimeframe(allDeals);
    const dealsByRep = reps.map(rep => ({
      rep,
      deals: filteredDeals.filter(d => d.repId === rep.id),
      commit: rep.currentCommit,
      target: rep.quotaTarget,
      committed: filteredDeals.filter(d => d.repId === rep.id && d.committed).reduce((s, d) => s + d.mrr, 0),
    }));

    const closingThisQuarter = filteredDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost' && d.stage !== 'Stalled');
    const stallingDeals = filteredDeals.filter(d => d.daysInStage > 14 || d.health === 'At Risk' || d.health === 'Critical');
    const quoteDeals = filteredDeals.filter(d => d.stage === 'Proposal');
    const teamPipelineFiltered = filteredDeals.reduce((sum, deal) => sum + deal.mrr, 0);
    const weightedPipelineFiltered = filteredDeals.reduce((sum, deal) => {
      const stageWeight = STAGE_WEIGHTS.find(sw => sw.stage === deal.stage)?.weight || 0;
      return sum + (deal.mrr * stageWeight);
    }, 0);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">Forecast & Pipeline</h1>
          <p className="text-12px text-gray-500 mt-1">Snapshot of deal progress and team performance</p>
        </div>

        {/* Feature 1: Timeframe Selector */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-[#e8e5e1]">
          <span className="text-[10px] font-bold text-gray-600 uppercase">Timeframe:</span>
          <div className="flex gap-1.5">
            {(['30d', 'quarter', '6m', 'ytd', 'custom'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setForecastTimeFrame(tf)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                  forecastTimeFrame === tf
                    ? 'bg-[#157A6E] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#157A6E]'
                }`}
              >
                {tf === '30d' ? '30 Days' : tf === 'quarter' ? 'Quarter' : tf === '6m' ? '6 Months' : tf === 'ytd' ? 'YTD' : 'Custom'}
              </button>
            ))}
          </div>
          {forecastTimeFrame === 'custom' && (
            <input
              type="number"
              value={customDays}
              onChange={(e) => setCustomDays(parseInt(e.target.value) || 45)}
              className="ml-2 w-16 px-2 py-1 border border-gray-200 rounded text-11px font-bold text-[#157A6E] text-center focus:outline-none focus:border-[#157A6E]"
              placeholder="Days"
            />
          )}
        </div>

        {/* SNAPSHOT METRICS */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Pipeline Health Snapshot</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Total Pipeline</p>
            <p className="text-[20px] font-bold text-gray-800 mt-2">{formatCurrency(teamPipelineFiltered)}</p>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Weighted</p>
            <p className="text-[20px] font-bold text-[#157A6E] mt-2">{formatCurrency(weightedPipelineFiltered)}</p>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Commit/Target</p>
            <p className="text-[20px] font-bold text-gray-800 mt-2">{commitPercentage}%</p>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Gap</p>
            <p className="text-[20px] font-bold text-red-600 mt-2">{formatCurrency(commitGap)}</p>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Upside</p>
            <p className="text-[20px] font-bold text-[#157A6E] mt-2">{formatCurrency(totalUpside)}</p>
            <p className="text-[10px] text-gray-600 mt-1">{upsideWinRate}% win rate</p>
          </div>
        </div>

        {/* REP PERFORMANCE RANKINGS */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Rep Performance</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {reps.map(rep => {
            const repDeals = allDeals.filter(d => d.repId === rep.id);
            const repCommitPct = rep.quotaTarget > 0 ? Math.round((rep.currentCommit / rep.quotaTarget) * 100) : 0;
            const borderColor = repCommitPct >= 85 ? '#157A6E' : repCommitPct >= 60 ? '#f59e0b' : '#ef4444';
            const topPerformer = Math.max(...reps.map(r => r.quotaTarget > 0 ? Math.round((r.currentCommit / r.quotaTarget) * 100) : 0)) === repCommitPct && repCommitPct >= 85;
            return (
              <div key={rep.id} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4" style={{ borderLeft: `4px solid ${borderColor}` }}>
                {topPerformer && <div className="flex items-center gap-1 mb-2 text-[10px] font-bold text-amber-600">⭐ Top Performer</div>}
                <p className="text-13px font-semibold text-gray-800">{rep.name}</p>
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-600">Commit</span>
                      <span className="font-bold" style={{ color: borderColor }}>{repCommitPct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ backgroundColor: borderColor, width: `${Math.min(repCommitPct, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-600">
                    <span>{rep.activeDeals} active deals</span>
                    <span>{Math.round(rep.winRate)}% win rate</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DEALS CLOSING THIS QUARTER */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Deals Closing This Quarter</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
          <table className="w-full text-11px">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2 text-left font-bold text-gray-700">Deal Name</th>
                <th className="px-4 py-2 text-left font-bold text-gray-700">Partner</th>
                <th className="px-4 py-2 text-left font-bold text-gray-700">CM</th>
                <th className="px-4 py-2 text-left font-bold text-gray-700">Stage</th>
                <th className="px-4 py-2 text-right font-bold text-gray-700">MRR</th>
                <th className="px-4 py-2 text-right font-bold text-gray-700">Days in Stage</th>
                <th className="px-4 py-2 text-center font-bold text-gray-700">Health</th>
              </tr>
            </thead>
            <tbody>
              {closingThisQuarter.sort((a, b) => b.mrr - a.mrr).slice(0, 10).map((d, i) => {
                const rep = reps.find(r => r.id === d.repId);
                const advId = getDealAdvisorIds(d)[0];
                const adv = advisors.find(a => a.id === advId);
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold text-gray-800">{d.name}</td>
                    <td className="px-4 py-2 text-gray-600">{adv?.company || '–'}</td>
                    <td className="px-4 py-2 text-gray-600">{rep?.name || '–'}</td>
                    <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{d.stage}</span></td>
                    <td className="px-4 py-2 text-right font-bold text-gray-800">{formatCurrency(d.mrr)}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{d.daysInStage}d</td>
                    <td className="px-4 py-2 text-center"><DealHealthBadge health={d.health} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* STALLING DEALS */}
        {stallingDeals.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-red-600 whitespace-nowrap">Stalling Deals</span>
              <div className="flex-1 h-px bg-[#e8e5e1]" />
            </div>

            <div className="bg-white rounded-[10px] border-2 border-red-300 p-5">
              <div className="space-y-3">
                {stallingDeals.slice(0, 5).map((d, i) => {
                  const rep = reps.find(r => r.id === d.repId);
                  const advId = getDealAdvisorIds(d)[0];
                  const adv = advisors.find(a => a.id === advId);
                  return (
                    <div key={i} className="flex items-start justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <p className="text-12px font-semibold text-gray-800">{d.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{adv?.company || '–'} · {rep?.name || '–'} · {d.daysInStage}d in {d.stage}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-12px font-bold text-gray-800">{formatCurrency(d.mrr)}</p>
                        <DealHealthBadge health={d.health} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* QUOTE ACTIVITY */}
        {quoteDeals.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Quote Activity</span>
              <div className="flex-1 h-px bg-[#e8e5e1]" />
            </div>

            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <p className="text-13px font-semibold mb-3">{quoteDeals.length} proposals active</p>
              <div className="space-y-2">
                {quoteDeals.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-11px text-gray-800 font-semibold">{d.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.daysInStage > 10 ? 'bg-red-100 text-red-800' : d.daysInStage > 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{d.daysInStage}d</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* UPSIDE TRACKER */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Upside Tracker</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
          <table className="w-full text-11px">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2 text-left font-bold text-gray-700">CM</th>
                <th className="px-4 py-2 text-center font-bold text-gray-700">Upside Deals</th>
                <th className="px-4 py-2 text-right font-bold text-gray-700">Total Upside</th>
                <th className="px-4 py-2 text-center font-bold text-gray-700">Win Rate</th>
                <th className="px-4 py-2 text-right font-bold text-gray-700">Expected Value</th>
              </tr>
            </thead>
            <tbody>
              {reps.map((rep, i) => {
                const repUpside = upsideDeals.filter(d => d.repId === rep.id);
                const repUpsideTotal = repUpside.reduce((s, d) => s + d.mrr, 0);
                const repUpsideWR = repUpside.length > 0 ? Math.round(repUpside.reduce((s, d) => s + d.probability, 0) / repUpside.length) : 0;
                const repEV = repUpside.reduce((s, d) => s + d.mrr * (d.probability / 100), 0);
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold text-gray-800">{rep.name}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{repUpside.length}</td>
                    <td className="px-4 py-2 text-right font-bold text-gray-800">{formatCurrency(repUpsideTotal)}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{repUpsideWR}%</td>
                    <td className="px-4 py-2 text-right text-gray-800">{formatCurrency(repEV)}</td>
                  </tr>
                );
              })}
              <tr className="bg-[#F7F5F2] font-bold">
                <td className="px-4 py-2 text-gray-800">TEAM TOTAL</td>
                <td className="px-4 py-2 text-center text-gray-800">{upsideDeals.length}</td>
                <td className="px-4 py-2 text-right text-[#157A6E]">{formatCurrency(totalUpside)}</td>
                <td className="px-4 py-2 text-center text-gray-800">{upsideWinRate}%</td>
                <td className="px-4 py-2 text-right text-[#157A6E]">{formatCurrency(upsideExpectedValue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════ VIEW 3: TEAM ACCOUNTABILITY ═══════════════════
  const renderTeamAccountability = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">Team & Accountability</h1>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[#e8e5e1]">
          {(['overview', 'prep', 'risks', 'geography'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTeamSubTab(tab)}
              className={`px-6 py-3 text-13px font-semibold border-b-2 transition-colors ${
                teamSubTab === tab ? 'text-[#157A6E] border-[#157A6E]' : 'text-gray-500 border-transparent'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'prep' ? '1:1 Prep' : tab === 'risks' ? 'Risks' : 'Geography'}
            </button>
          ))}
        </div>

        {teamSubTab === 'overview' && (
          <div className="grid grid-cols-3 gap-4">
            {reps.map(rep => {
              const repAdvisors = getRepAdvisors(rep);
              const cadence = getRepCadence(rep.id);
              const topConcern = rep.topConcern || 'Monitor performance';
              const capacityUsed = (rep.partnerCount / rep.partnerCapacity) * 100;
              const isExpanded = expandedRepId === rep.id;
              return (
                <div
                  key={rep.id}
                  className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  style={{ borderLeft: `4px solid ${rep.engagementScore === 'Strong' ? '#157A6E' : rep.engagementScore === 'Steady' ? '#f59e0b' : '#ef4444'}` }}
                  onClick={() => setExpandedRepId(isExpanded ? null : rep.id)}
                >
                  <div className="p-4">
                    <p className="text-13px font-semibold text-gray-800">{rep.name}</p>
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-600">Partners</span>
                          <span className="font-bold">{rep.partnerCount}/{rep.partnerCapacity}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${Math.min(capacityUsed, 100)}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-600">
                        <span>{rep.activeDeals} active deals</span>
                        <span>{Math.round((rep.currentCommit / rep.quotaTarget) * 100)}% commit</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-[10px] text-gray-500">Top concern:</p>
                        <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{topConcern}</p>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (() => {
                    const repDeals = allDeals.filter(d => d.repId === rep.id);
                    const topDeals = repDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').sort((a, b) => b.mrr - a.mrr).slice(0, 5);
                    const activity = getRepActivity(rep.id);
                    const upsideCount = repDeals.filter(d => d.isUpside).length;
                    const upsideMRR = repDeals.filter(d => d.isUpside).reduce((s, d) => s + d.mrr, 0);
                    const healthyPartners = repAdvisors.filter(a => a.pulse === 'Strong' || a.pulse === 'Steady').length;
                    const atRiskPartners = repAdvisors.filter(a => a.pulse === 'Fading' || a.pulse === 'Flatline').length;
                    return (
                      <div className="border-t border-gray-100 bg-[#fafaf8]">
                        {/* Quick Metrics Row */}
                        <div className="grid grid-cols-4 gap-3 p-4 border-b border-gray-100">
                          <div className="text-center">
                            <p className="text-[16px] font-bold text-gray-800">{Math.round(rep.winRate)}%</p>
                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Win Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[16px] font-bold text-gray-800">{cadence.overall}%</p>
                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Cadence</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[16px] font-bold text-[#157A6E]">{formatCurrency(upsideMRR)}</p>
                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Upside ({upsideCount})</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[16px] font-bold text-gray-800">{rep.avgCycle}d</p>
                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Avg Cycle</p>
                          </div>
                        </div>

                        {/* Top Deals */}
                        <div className="p-4 border-b border-gray-100">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-500 mb-2">Top Deals</p>
                          {topDeals.length > 0 ? topDeals.map(d => {
                            const healthColor = d.health === 'At Risk' || d.health === 'Critical' ? 'text-red-600' : d.health === 'Stalled' ? 'text-purple-600' : 'text-green-600';
                            return (
                              <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-11px font-semibold text-gray-800">{d.name}</span>
                                  {d.isUpside && <span className="text-[8px] font-bold text-[#157A6E] bg-teal-50 px-1 rounded">UPSIDE</span>}
                                </div>
                                <div className="flex items-center gap-3 text-[10px]">
                                  <span className="font-bold text-gray-700">{formatCurrency(d.mrr)}</span>
                                  <span className="text-gray-500">{d.stage}</span>
                                  <span className="text-gray-400">{d.daysInStage}d</span>
                                  <span className={`font-semibold ${healthColor}`}>{d.health}</span>
                                </div>
                              </div>
                            );
                          }) : <p className="text-[10px] text-gray-400">No active deals</p>}
                        </div>

                        {/* Cadence Breakdown + Partner Health + Activity */}
                        <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100">
                          {/* Cadence by Tier */}
                          <div className="p-4">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-gray-500 mb-2">Cadence by Tier</p>
                            {(['anchor', 'scaling', 'building', 'launching'] as const).map(tier => {
                              const val = cadence[tier];
                              const color = val >= 85 ? 'text-green-600' : val >= 70 ? 'text-amber-600' : 'text-red-600';
                              const count = repAdvisors.filter(a => a.tier === tier).length;
                              return (
                                <div key={tier} className="flex items-center justify-between py-1">
                                  <span className="text-[10px] text-gray-600 capitalize">{tier} ({count})</span>
                                  <span className={`text-[10px] font-bold ${color}`}>{val}%</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Partner Health */}
                          <div className="p-4">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-gray-500 mb-2">Partner Health</p>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-[10px] text-gray-600">Healthy/Steady</span>
                              <span className="text-[10px] font-bold text-green-600">{healthyPartners}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-[10px] text-gray-600">Fading/Flatline</span>
                              <span className="text-[10px] font-bold text-red-600">{atRiskPartners}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-[10px] text-gray-600">Total Partners</span>
                              <span className="text-[10px] font-bold text-gray-800">{repAdvisors.length}</span>
                            </div>
                          </div>

                          {/* Weekly Activity + Meeting Breakdown (Feature 2) */}
                          <div className="p-4">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-gray-500 mb-2">Activity Breakdown</p>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-[10px] text-gray-600">Meetings</span>
                              <span className="text-[10px] font-bold text-gray-800">{activity.meetings}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-[10px] text-gray-600">Calls</span>
                              <span className="text-[10px] font-bold text-gray-800">{activity.calls}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-[10px] text-gray-600">Emails</span>
                              <span className="text-[10px] font-bold text-gray-800">{activity.emails}</span>
                            </div>
                            {(() => {
                              const mtg = getRepMeetingBreakdownData(rep.id);
                              return (
                                <>
                                  <div className="border-t border-gray-100 mt-2 pt-2">
                                    <p className="text-[8px] font-bold text-gray-400 mb-1">Meeting Types</p>
                                    <div className="flex items-center justify-between py-0.5">
                                      <span className="text-[9px] text-gray-600">Customer</span>
                                      <span className="text-[9px] font-bold text-[#157A6E]">{mtg.customer}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-0.5">
                                      <span className="text-[9px] text-gray-600">Agent</span>
                                      <span className="text-[9px] font-bold text-gray-700">{mtg.agent}</span>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {teamSubTab === 'prep' && (
          <div className="space-y-4">
            {reps.map(rep => {
              const schedule = oneOnOneSchedule[rep.id] || { day: 'Monday', time: '10:00 AM' };
              const isEditing = editingScheduleRepId === rep.id;
              return (
                <div key={rep.id} className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                  <div className="flex items-center justify-between mb-4">
                    {isEditing ? (
                      <div className="flex-1">
                        <p className="text-13px font-semibold text-gray-800 mb-2">{rep.name}</p>
                        <div className="space-y-2">
                          <select value={editScheduleForm.day} onChange={(e) => setEditScheduleForm(prev => ({...prev, day: e.target.value}))} className="w-full px-2 py-1 border border-[#e8e5e1] rounded text-[11px] focus:outline-none focus:border-[#157A6E]">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <input type="time" value={editScheduleForm.time} onChange={(e) => setEditScheduleForm(prev => ({...prev, time: e.target.value}))} className="w-full px-2 py-1 border border-[#e8e5e1] rounded text-[11px] focus:outline-none focus:border-[#157A6E]" />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => { setOneOnOneSchedule(prev => ({...prev, [rep.id]: editScheduleForm})); saveToStorage('leader_1on1_schedule', {...oneOnOneSchedule, [rep.id]: editScheduleForm}); setEditingScheduleRepId(null); }} className="flex-1 px-2 py-1 text-[10px] font-bold text-white bg-[#157A6E] rounded hover:bg-[#126a5f]">Save</button>
                          <button onClick={() => setEditingScheduleRepId(null)} className="flex-1 px-2 py-1 text-[10px] font-bold text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-13px font-semibold text-gray-800">{rep.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{schedule.day} at {schedule.time}</p>
                        </div>
                        <button onClick={() => { setEditScheduleForm(schedule); setEditingScheduleRepId(rep.id); }} className="text-[10px] text-[#157A6E] font-semibold hover:underline">Edit schedule</button>
                      </>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase text-gray-600">Top 3 Discussion Topics</p>
                    <ul className="space-y-1">
                      {[
                        `${rep.quotaTarget > rep.currentCommit ? 'Close commit gap' : 'Celebrate progress'}`,
                        `Review ${getRepAdvisors(rep).length} partner health`,
                        'Pipeline opportunities & risks'
                      ].map((topic, i) => (
                        <li key={i} className="text-11px text-gray-700 flex gap-2">
                          <span>•</span> <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {teamSubTab === 'risks' && (
          <div className="space-y-4">
            {/* RISK TABS */}
            <div className="flex gap-2">
              {(['deals', 'partners', 'tsds'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setRiskSubTab(tab)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-full transition-colors ${
                    riskSubTab === tab ? 'bg-[#157A6E] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab === 'deals' ? 'Deal Risks' : tab === 'partners' ? 'Partner Risks' : 'TSD Risks'}
                </button>
              ))}
            </div>

            {riskSubTab === 'deals' && (
              <div className="space-y-3">
                {atRiskDeals.map((d, i) => {
                  const rep = reps.find(r => r.id === d.repId);
                  const advId = getDealAdvisorIds(d)[0];
                  const adv = advisors.find(a => a.id === advId);
                  return (
                    <div key={i} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-12px font-semibold text-gray-800">{d.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{adv?.company} · {rep?.name}</p>
                        </div>
                        <div className="text-right">
                          <DealHealthBadge health={d.health} />
                          <p className="text-11px font-bold text-gray-800 mt-2">{formatCurrency(d.mrr)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {riskSubTab === 'partners' && (
              <div className="space-y-3">
                {advisors.filter(a => a.pulse === 'Fading' || a.pulse === 'Flatline').map((a, i) => (
                  <div key={i} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-12px font-semibold text-gray-800">{a.name}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{a.company}</p>
                      </div>
                      <div className="text-right">
                        <PulseBadge pulse={a.pulse} />
                        <p className="text-11px font-bold text-gray-800 mt-2">{formatCurrency(a.mrr)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {riskSubTab === 'tsds' && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-12px">TSD risks analysis coming soon</p>
              </div>
            )}
          </div>
        )}

        {/* Feature 10: Overdue Tasks Report */}
        {teamSubTab === 'risks' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-red-600 whitespace-nowrap">Overdue Tasks</span>
                <div className="flex-1 h-px bg-[#e8e5e1]" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-gray-600">Threshold (days):</label>
                <input
                  type="number"
                  value={overdueThresholdDays}
                  onChange={(e) => setOverdueThresholdDays(parseInt(e.target.value) || 7)}
                  className="w-16 px-2 py-1 border border-gray-200 rounded text-11px font-bold text-[#157A6E] text-center focus:outline-none focus:border-[#157A6E]"
                />
              </div>
            </div>

            {(() => {
              const overdue = getOverdueTasks();
              return overdue.length > 0 ? (
                <div className="bg-white rounded-[10px] border border-red-300 overflow-hidden">
                  <table className="w-full text-11px">
                    <thead>
                      <tr className="bg-red-50 border-b border-red-100">
                        <th className="px-4 py-2 text-left font-bold text-red-800">Task</th>
                        <th className="px-4 py-2 text-center font-bold text-red-800">Days Overdue</th>
                        <th className="px-4 py-2 text-left font-bold text-red-800">Rep</th>
                        <th className="px-4 py-2 text-left font-bold text-red-800">Deal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdue.slice(0, 10).map((t, i) => (
                        <tr key={i} className="border-b border-red-100 hover:bg-red-50">
                          <td className="px-4 py-2 font-semibold text-gray-800">{t.text}</td>
                          <td className="px-4 py-2 text-center"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-800">{t.daysOverdue}d</span></td>
                          <td className="px-4 py-2 text-gray-600">{t.repName}</td>
                          <td className="px-4 py-2 text-gray-600">{t.dealName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-12px">No overdue tasks</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Feature 3: Geography tab */}
        {teamSubTab === 'geography' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Geographic Performance</span>
              <div className="flex-1 h-px bg-[#e8e5e1]" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {reps.map(rep => {
                const repAdvisors = getRepAdvisors(rep);
                const repDeals = allDeals.filter(d => d.repId === rep.id);
                const stateMap: Record<string, {deals: number; pipeline: number; partners: number; activity: number}> = {};

                repAdvisors.forEach(a => {
                  const state = a.location?.split(',').pop()?.trim() || 'Unknown';
                  if (!stateMap[state]) stateMap[state] = { deals: 0, pipeline: 0, partners: 0, activity: a.activity.length };
                  stateMap[state].partners++;
                  stateMap[state].activity += a.activity.length;
                });

                repDeals.forEach(d => {
                  const advId = getDealAdvisorIds(d)[0];
                  const adv = advisors.find(a => a.id === advId);
                  const state = adv?.location?.split(',').pop()?.trim() || 'Unknown';
                  if (!stateMap[state]) stateMap[state] = { deals: 0, pipeline: 0, partners: 0, activity: 0 };
                  if (d.stage === 'Closed Won') stateMap[state].deals++;
                  stateMap[state].pipeline += d.mrr;
                });

                const states = Object.entries(stateMap);
                const maxPipeline = Math.max(...states.map(s => s[1].pipeline), 1);

                return (
                  <div key={rep.id} className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                    <p className="text-13px font-semibold text-gray-800 mb-4">{rep.name}</p>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {states.length > 0 ? states.sort((a, b) => b[1].pipeline - a[1].pipeline).map(([state, data]) => {
                        const health = data.pipeline >= maxPipeline * 0.6 ? 'strong' : data.pipeline >= maxPipeline * 0.3 ? 'moderate' : 'struggling';
                        const healthColor = health === 'strong' ? '#157A6E' : health === 'moderate' ? '#f59e0b' : '#ef4444';
                        const healthBg = health === 'strong' ? 'bg-green-50' : health === 'moderate' ? 'bg-amber-50' : 'bg-red-50';
                        return (
                          <div key={state} className={`p-2 rounded-lg border ${healthBg}`}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-11px font-bold text-gray-800">{state}</p>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ color: healthColor, backgroundColor: healthColor + '20' }}>
                                {health === 'strong' ? '↑ Strong' : health === 'moderate' ? '→ Moderate' : '↓ Struggling'}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-[10px]">
                              <div><span className="text-gray-600">Deals Won:</span><br/><span className="font-bold">{data.deals}</span></div>
                              <div><span className="text-gray-600">Pipeline:</span><br/><span className="font-bold">{formatCurrency(data.pipeline)}</span></div>
                              <div><span className="text-gray-600">Partners:</span><br/><span className="font-bold">{data.partners}</span></div>
                              <div><span className="text-gray-600">Activity:</span><br/><span className="font-bold">{data.activity}</span></div>
                            </div>
                          </div>
                        );
                      }) : (
                        <p className="text-[10px] text-gray-400 py-4">No geographic data available</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════ VIEW 4: RELATIONSHIPS ═══════════════════
  const renderRelationships = () => {
    const filteredAdvisors = advisors.filter(a => {
      if (partnerSearch && !a.name.toLowerCase().includes(partnerSearch.toLowerCase()) && !a.company.toLowerCase().includes(partnerSearch.toLowerCase())) return false;
      if (myPartnersOnly) return false; // Would filter by ownership
      return true;
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">Relationships</h1>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[#e8e5e1]">
          {(['partners', 'groups', 'tsds', 'contacts', 'flatlined', 'trends', 'supplierCollabs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setRelSubTab(tab as any)}
              className={`px-6 py-3 text-13px font-semibold border-b-2 transition-colors ${
                relSubTab === tab ? 'text-[#157A6E] border-[#157A6E]' : 'text-gray-500 border-transparent'
              }`}
            >
              {tab === 'partners' ? 'Partners' : tab === 'groups' ? 'Groups' : tab === 'tsds' ? 'TSDs' : tab === 'contacts' ? 'Contacts' : tab === 'flatlined' ? 'Flatlined' : tab === 'trends' ? 'Trends' : 'Supplier Collabs'}
            </button>
          ))}
        </div>

        {relSubTab === 'partners' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-between">
              <div className="flex gap-2">
                <button onClick={() => setMyPartnersOnly(!myPartnersOnly)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${myPartnersOnly ? 'bg-[#157A6E] text-white' : 'bg-gray-100 text-gray-600'}`}>My Partners</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCreatePartner(true)} className="px-3 py-1.5 text-[10px] font-bold text-white bg-[#157A6E] rounded-full hover:bg-[#126a5f]">+ Partner</button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search partners..."
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#e8e5e1] rounded-lg text-12px focus:outline-none focus:border-[#157A6E]"
              />
            </div>

            <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
              <table className="w-full text-11px">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Company</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Tier</th>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Stage</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-700">MRR</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Pulse</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Last Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvisors.map((a, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold text-gray-800 cursor-pointer" onClick={() => handleAdvisorClick(a.id)}>{a.name}</td>
                      <td className="px-4 py-2 text-gray-600">{a.company}</td>
                      <td className="px-4 py-2 text-center"><TierBadge tier={a.tier} /></td>
                      <td className="px-4 py-2 text-gray-600">{a.relationshipStage || 'Prospect'}</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-800">{formatCurrency(a.mrr)}</td>
                      <td className="px-4 py-2 text-center"><PulseBadge pulse={a.pulse} /></td>
                      <td className="px-4 py-2 text-center text-gray-600 text-[10px]">{a.lastContact ? timeAgo(a.lastContact) : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {relSubTab === 'groups' && (
          <div className="space-y-4">
            <button onClick={() => setShowCreateGroup(true)} className="px-3 py-1.5 text-[10px] font-bold text-white bg-[#157A6E] rounded-full hover:bg-[#126a5f]">+ Create Group</button>
            <div className="grid grid-cols-2 gap-4">
              {partnerGroups.map(group => (
                <div key={group.id} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                  <p className="text-13px font-semibold text-gray-800">{group.name}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{group.rules.map(r => `${r.field} ${r.operator} ${r.value}`).join(' · ')}</p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {group.assignedTo.map((cm, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#157A6E] text-white">{cm}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {relSubTab === 'tsds' && (
          <div className="space-y-4">
            {(() => {
              const tsds = ['TechFlow Dist', 'Prime Channel Partners', 'Solutions Aggregators Inc'].map((name, i) => {
                const seed = name;
                const stateList = ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'WA', 'MA', 'CO', 'AZ'];
                const stateCount = Math.floor(seededRandom(seed + 'statecount', 1, 4)) + 1;
                const states = stateList.slice(i * 3, i * 3 + stateCount);
                const partnerCount = Math.floor(seededRandom(seed + 'pc', 8, 35));
                const dealVolume = Math.floor(seededRandom(seed + 'dv', 150000, 850000));
                const commission = parseFloat((seededRandom(seed + 'comm', 2, 8)).toFixed(1));
                const statusOptions = ['active', 'pending', 'inactive'];
                const status = statusOptions[Math.floor(seededRandom(seed + 'stat') * statusOptions.length)];
                return { id: `tsd${i}`, name, territory: states, partnerCount, dealVolume, commission, primaryContact: `Contact ${i + 1}`, status };
              });
              return (
                <div className="grid grid-cols-2 gap-4">
                  {tsds.map(tsd => (
                    <div key={tsd.id} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-13px font-semibold text-gray-800">{tsd.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{tsd.territory.join(', ')}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full whitespace-nowrap ${tsd.status === 'active' ? 'bg-green-100 text-green-800' : tsd.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                          {tsd.status.charAt(0).toUpperCase() + tsd.status.slice(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px] mb-3">
                        <div>
                          <p className="text-gray-500">Partners</p>
                          <p className="font-semibold text-gray-800">{tsd.partnerCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Deal Volume</p>
                          <p className="font-semibold text-gray-800">{formatCurrency(tsd.dealVolume)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Commission</p>
                          <p className="font-semibold text-gray-800">{tsd.commission}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Contact</p>
                          <p className="font-semibold text-gray-800 text-[10px]">{tsd.primaryContact}</p>
                        </div>
                      </div>
                      <button className="w-full px-3 py-1.5 text-[10px] font-bold text-white bg-[#157A6E] rounded-full hover:bg-[#126a5f] transition-colors">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {relSubTab === 'contacts' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-[#e8e5e1]">
                <Search className="w-4 h-4 text-gray-400" />
                <input placeholder="Search contacts by name, company, role..." className="flex-1 text-12px outline-none bg-transparent" onChange={(e) => setPartnerSearch(e.target.value)} />
              </div>
              <table className="w-full text-11px">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Company</th>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Role</th>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Email</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Tier</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Last Contact</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Pulse</th>
                  </tr>
                </thead>
                <tbody>
                  {advisors.filter(a => a.name.toLowerCase().includes(partnerSearch.toLowerCase()) || a.company.toLowerCase().includes(partnerSearch.toLowerCase())).map((a, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleAdvisorClick(a.id)}>
                      <td className="px-4 py-2 font-semibold text-gray-800">{a.name}</td>
                      <td className="px-4 py-2 text-gray-600">{a.company}</td>
                      <td className="px-4 py-2 text-gray-600">{a.title || 'Partner'}</td>
                      <td className="px-4 py-2 text-gray-600 text-[10px]">{a.email || '–'}</td>
                      <td className="px-4 py-2 text-center"><TierBadge tier={a.tier} /></td>
                      <td className="px-4 py-2 text-center text-gray-600 text-[10px]">{a.lastContact ? timeAgo(a.lastContact) : '–'}</td>
                      <td className="px-4 py-2 text-center"><PulseBadge pulse={a.pulse} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {relSubTab === 'flatlined' && (
          <div className="space-y-4">
            {(() => {
              const flatlinedAdvisors = advisors.filter(a => {
                const daysSinceContact = a.lastContact ? Math.floor((new Date().getTime() - new Date(a.lastContact).getTime()) / 86400000) : 0;
                return a.pulse === 'Flatline' || (a.pulse === 'Fading' && daysSinceContact > 30);
              });
              if (flatlinedAdvisors.length === 0) {
                return (
                  <div className="text-center py-8 bg-white rounded-[10px] border border-[#e8e5e1]">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-12px text-gray-600">All partners are active — no flatlined relationships</p>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-2 gap-4">
                  {flatlinedAdvisors.map((a, i) => {
                    const daysSinceContact = a.lastContact ? Math.floor((new Date().getTime() - new Date(a.lastContact).getTime()) / 86400000) : 0;
                    return (
                      <div key={i} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-13px font-semibold text-gray-800">{a.name}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{a.company}</p>
                          </div>
                          <TierBadge tier={a.tier} />
                        </div>
                        <div className="flex items-center gap-2 mb-3 text-[11px]">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">Last contact: {daysSinceContact}d ago</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
                          <div>
                            <p className="text-gray-500">MRR</p>
                            <p className="font-semibold text-gray-800">{formatCurrency(a.mrr)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Trajectory</p>
                            <TrajectoryBadge trajectory={a.trajectory} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setPlaybookModalAdvisor(a); setShowPlaybookModal(true); }} className="flex-1 px-2 py-1.5 text-[9px] font-bold text-white bg-[#157A6E] rounded-full hover:bg-[#126a5f] transition-colors">
                            Launch Win-Back
                          </button>
                          <button onClick={() => { setLogInteractionAdvisor(a.id); setShowLogInteractionModal(true); }} className="flex-1 px-2 py-1.5 text-[9px] font-bold text-[#157A6E] border border-[#157A6E] rounded-full hover:bg-[#f7f5f2] transition-colors">
                            Log Interaction
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Feature 5: Historical Trend Reports (Trends tab) */}
        {relSubTab === 'trends' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Trailing 12-Month Trends</span>
              <div className="flex-1 h-px bg-[#e8e5e1]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {advisors.slice(0, 6).map(a => {
                const snapshots = a.monthlySnapshots || [
                  { month: 'Jan', pulse: 'Strong', trajectory: 'Climbing', tier: 'anchor', mrr: Math.floor(seededRandom(a.id + 'jan', 8000, 15000)) },
                  { month: 'Feb', pulse: 'Strong', trajectory: 'Climbing', tier: 'anchor', mrr: Math.floor(seededRandom(a.id + 'feb', 8200, 15200)) },
                  { month: 'Mar', pulse: 'Steady', trajectory: 'Stable', tier: 'anchor', mrr: Math.floor(seededRandom(a.id + 'mar', 8100, 15100)) },
                  { month: 'Apr', pulse: 'Steady', trajectory: 'Stable', tier: 'anchor', mrr: Math.floor(seededRandom(a.id + 'apr', 8300, 15300)) },
                  { month: 'May', pulse: 'Strong', trajectory: 'Climbing', tier: 'anchor', mrr: Math.floor(seededRandom(a.id + 'may', 8500, 15500)) },
                  { month: 'Jun', pulse: 'Strong', trajectory: 'Climbing', tier: 'anchor', mrr: Math.floor(seededRandom(a.id + 'jun', 8700, 15700)) },
                ];
                const maxMRR = Math.max(...snapshots.map(s => s.mrr));
                return (
                  <div key={a.id} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                    <p className="text-12px font-semibold text-gray-800 mb-3">{a.name}</p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[9px] font-bold text-gray-600 mb-2">MRR Trend</p>
                        <div className="flex items-end justify-between gap-1 h-12">
                          {snapshots.map((s, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                              <div className="w-full bg-[#157A6E] rounded-t" style={{ height: `${(s.mrr / maxMRR) * 40}px` }} title={`${s.mrr}`} />
                              <p className="text-[8px] text-gray-500 mt-1">{s.month.substring(0, 1)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-600 mb-2">Pulse Trend</p>
                        <div className="flex gap-1">
                          {snapshots.map((s, i) => {
                            const pulseColors = { Strong: '#157A6E', Steady: '#f59e0b', Rising: '#10b981', Fading: '#ef4444', Flatline: '#6b7280' };
                            return (
                              <div
                                key={i}
                                className="flex-1 h-6 rounded"
                                style={{ backgroundColor: pulseColors[s.pulse] || '#ccc' }}
                                title={s.pulse}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feature 8: Supplier Collaboration Tracking */}
        {relSubTab === 'supplierCollabs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Supplier Collaborations</span>
                <div className="flex-1 h-px bg-[#e8e5e1]" />
              </div>
              <button onClick={() => setShowAddSupplierModal(true)} className="px-3 py-1 text-[10px] font-bold text-white bg-[#157A6E] rounded-full hover:bg-[#126a5f]">+ Add</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {reps.map(rep => {
                const repCollabs = supplierCollabs.filter(sc => sc.repId === rep.id);
                return (
                  <div key={rep.id} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                    <p className="text-13px font-semibold text-gray-800 mb-3">{rep.name}</p>
                    {repCollabs.length > 0 ? (
                      <div className="space-y-2">
                        {repCollabs.map(sc => {
                          const statusColors = { proposed: 'bg-blue-50 text-blue-800 border-blue-200', active: 'bg-green-50 text-green-800 border-green-200', completed: 'bg-gray-50 text-gray-800 border-gray-200' };
                          const typeLabels = { 'co-event': 'Co-Event', 'joint-selling': 'Joint Selling', referral: 'Referral' };
                          return (
                            <div key={sc.id} className={`p-2 rounded border text-[10px] ${statusColors[sc.status]}`}>
                              <p className="font-bold">{sc.supplierName}</p>
                              <div className="flex gap-1 mt-1">
                                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-white bg-opacity-60">{typeLabels[sc.type]}</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-white bg-opacity-60 capitalize">{sc.status}</span>
                              </div>
                              <p className="text-[9px] mt-1 opacity-75">{sc.notes}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400">No active collaborations</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════ VIEW 5: INTELLIGENCE ═══════════════════
  const renderIntelligence = () => {
    const dealSignals = signals.filter(s => ['deal_at_risk', 'override_pending', 'expansion'].includes(s.type));
    const partnerSignals = signals.filter(s => ['partner_fading', 'trajectory_freefall'].includes(s.type));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">Intelligence</h1>
        </div>

        {/* SIGNAL SUMMARY */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Total Signals</p>
            <p className="text-[24px] font-bold text-gray-800 mt-2">{signals.length}</p>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Critical</p>
            <p className="text-[24px] font-bold text-red-600 mt-2">{signals.filter(s => s.severity === 'critical').length}</p>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">High</p>
            <p className="text-[24px] font-bold text-amber-600 mt-2">{signals.filter(s => s.severity === 'high').length}</p>
          </div>
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Medium</p>
            <p className="text-[24px] font-bold text-blue-600 mt-2">{signals.filter(s => s.severity === 'medium').length}</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[#e8e5e1] gap-4">
          {(['deal', 'partner'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSignalSubTab(tab)}
              className={`px-6 py-3 text-13px font-semibold border-b-2 transition-colors ${
                signalSubTab === tab ? 'text-[#157A6E] border-[#157A6E]' : 'text-gray-500 border-transparent'
              }`}
            >
              {tab === 'deal' ? 'Deal Signals' : 'Partner Signals'}
            </button>
          ))}
        </div>

        {signalSubTab === 'deal' && (
          <div className="space-y-3">
            {dealSignals.map((s, i) => (
              <div key={i} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-12px font-semibold text-gray-800">{s.text}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{s.repName} {s.advisorName ? `· ${s.advisorName}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.severity === 'critical' ? 'bg-red-100 text-red-800' : s.severity === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{s.severity.toUpperCase()}</span>
                    <p className="text-[10px] text-gray-500 mt-1">{s.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {signalSubTab === 'partner' && (
          <div className="space-y-3">
            {partnerSignals.map((s, i) => (
              <div key={i} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-12px font-semibold text-gray-800">{s.text}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{s.advisorName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{s.severity.toUpperCase()}</span>
                    <p className="text-[10px] text-gray-500 mt-1">{s.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feature 6: Forecast Accuracy Reporting */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Forecast Accuracy</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
          <table className="w-full text-11px">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2 text-left font-bold text-gray-700">Rep</th>
                <th className="px-4 py-2 text-right font-bold text-gray-700">Q1 Forecast</th>
                <th className="px-4 py-2 text-right font-bold text-gray-700">Q1 Actual</th>
                <th className="px-4 py-2 text-center font-bold text-gray-700">Accuracy</th>
                <th className="px-4 py-2 text-right font-bold text-gray-700">Trend</th>
              </tr>
            </thead>
            <tbody>
              {reps.map((rep, i) => {
                const history = getForecastHistoryData(rep.id);
                const q1 = history[0];
                const accuracy = q1 ? Math.round((q1.actual / q1.forecasted) * 100) : 0;
                const trend = accuracy >= 90 ? '+' : accuracy >= 75 ? '→' : '−';
                const trendColor = accuracy >= 90 ? 'text-green-600' : accuracy >= 75 ? 'text-amber-600' : 'text-red-600';
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold text-gray-800">{rep.name}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{formatCurrency(q1?.forecasted || 0)}</td>
                    <td className="px-4 py-2 text-right font-bold text-gray-800">{formatCurrency(q1?.actual || 0)}</td>
                    <td className="px-4 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${accuracy >= 90 ? 'bg-green-100 text-green-800' : accuracy >= 75 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{accuracy}%</span></td>
                    <td className={`px-4 py-2 text-right font-bold ${trendColor}`}>{trend}</td>
                  </tr>
                );
              })}
              <tr className="bg-[#F7F5F2] font-bold">
                <td className="px-4 py-2 text-gray-800">TEAM AVG</td>
                <td className="px-4 py-2 text-right text-gray-800">{formatCurrency(reps.reduce((s, r) => s + (getForecastHistoryData(r.id)[0]?.forecasted || 0), 0) / reps.length)}</td>
                <td className="px-4 py-2 text-right text-gray-800">{formatCurrency(reps.reduce((s, r) => s + (getForecastHistoryData(r.id)[0]?.actual || 0), 0) / reps.length)}</td>
                <td className="px-4 py-2 text-center text-gray-800">{Math.round(reps.reduce((s, r) => s + (getForecastHistoryData(r.id)[0]?.actual || 0) / (getForecastHistoryData(r.id)[0]?.forecasted || 1), 0) / reps.length * 100)}%</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        {/* Feature 7: Event Playbooks with ROI Tracking */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Event Playbooks</span>
            <div className="flex-1 h-px bg-[#e8e5e1]" />
          </div>
          <button onClick={() => setShowAddEventModal(true)} className="px-3 py-1 text-[10px] font-bold text-white bg-[#157A6E] rounded-full hover:bg-[#126a5f]">+ Add Event</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {eventPlaybooks.map(event => {
            const roiCalc = event.actualMeetings && event.budget ? ((event.actualMeetings / event.targetMeetings) * (event.actualSignups ? event.actualSignups / event.targetSignups : 0.5)) * 100 : 0;
            const statusColors = { planning: 'bg-blue-50 border-blue-200', active: 'bg-green-50 border-green-200', completed: 'bg-gray-50 border-gray-200' };
            return (
              <div key={event.id} className={`border border-[#e8e5e1] rounded-[10px] p-4 ${statusColors[event.status]}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-12px font-semibold text-gray-800">{event.name}</p>
                    <p className="text-[10px] text-gray-600">{event.date}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${event.status === 'planning' ? 'bg-blue-100 text-blue-800' : event.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {event.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                  <div>
                    <p className="text-gray-600">Budget</p>
                    <p className="font-bold text-gray-800">{formatCurrency(event.budget)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Meetings</p>
                    <p className="font-bold text-gray-800">{event.actualMeetings || 0} / {event.targetMeetings}</p>
                  </div>
                </div>
                {event.actualMeetings && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-[9px] text-gray-600">Est. ROI</p>
                    <p className="text-[14px] font-bold text-[#157A6E]">{roiCalc.toFixed(0)}%</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PLAYBOOKS */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Launch Playbook</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <button onClick={() => setShowPlaybookModal(true)} className="w-full px-4 py-3 text-13px font-semibold text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f]">+ Launch New Playbook</button>
        </div>

        {/* Feature 4: Leader Interaction Logging and Impact */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Leader Touch Impact</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        {(() => {
          const impact = getLeaderTouchImpact();
          return (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-[10px] border border-green-200 p-4 text-center">
                <p className="text-[10px] text-gray-600 uppercase font-bold">Avg Cycle (Leader Touched)</p>
                <p className="text-[24px] font-bold text-gray-800 mt-2">{impact.avgCycleTouched}d</p>
                <p className="text-[9px] text-gray-500 mt-1">{impact.touchedCount} deals</p>
              </div>
              <div className="bg-gray-50 rounded-[10px] border border-gray-200 p-4 text-center">
                <p className="text-[10px] text-gray-600 uppercase font-bold">Avg Cycle (No Touch)</p>
                <p className="text-[24px] font-bold text-gray-800 mt-2">{impact.avgCycleUntouched}d</p>
              </div>
              <div className={`rounded-[10px] border p-4 text-center ${impact.avgCycleTouched < impact.avgCycleUntouched ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-[10px] text-gray-600 uppercase font-bold">Impact</p>
                <p className={`text-[24px] font-bold mt-2 ${impact.avgCycleTouched < impact.avgCycleUntouched ? 'text-green-700' : 'text-red-700'}`}>
                  {impact.avgCycleUntouched - impact.avgCycleTouched > 0 ? '−' : '+'}{Math.abs(impact.avgCycleUntouched - impact.avgCycleTouched)}d
                </p>
              </div>
            </div>
          );
        })()}

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-12px font-bold text-gray-800">Recent Leader Notes</p>
            <button
              onClick={() => setShowLogInteractionModal(true)}
              className="px-2 py-1 text-[10px] font-bold text-white bg-[#157A6E] rounded hover:bg-[#126a5f]"
            >
              + Log Interaction
            </button>
          </div>
          {leaderInteractions.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {leaderInteractions.slice(-5).reverse().map(interaction => {
                const advisor = advisors.find(a => a.id === interaction.advisorId);
                const deal = allDeals.find(d => d.id === interaction.dealId);
                return (
                  <div key={interaction.id} className="p-2 bg-gray-50 rounded text-[10px] border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{advisor?.name || 'Unknown'}</p>
                        <p className="text-gray-600 mt-0.5">{interaction.note}</p>
                        {deal && <p className="text-[9px] text-gray-500 mt-1">Deal: {deal.name}</p>}
                      </div>
                      <p className="text-[9px] text-gray-500 whitespace-nowrap">{new Date(interaction.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 py-2">No interactions logged yet</p>
          )}
        </div>

        {/* DIAGNOSTICS */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Diagnostics</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2 text-left font-bold text-gray-700">Advisor</th>
                <th className="px-4 py-2 text-center font-bold text-gray-700">Pulse</th>
                <th className="px-4 py-2 text-center font-bold text-gray-700">Trajectory</th>
                <th className="px-4 py-2 text-center font-bold text-gray-700">Friction</th>
                <th className="px-4 py-2 text-center font-bold text-gray-700">Deal Health</th>
              </tr>
            </thead>
            <tbody>
              {advisors.map((a, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 font-semibold text-gray-800">{a.name}</td>
                  <td className="px-4 py-2 text-center"><PulseBadge pulse={a.pulse} /></td>
                  <td className="px-4 py-2 text-center"><TrajectoryBadge trajectory={a.trajectory} /></td>
                  <td className="px-4 py-2 text-center"><FrictionBadge level={a.friction} /></td>
                  <td className="px-4 py-2 text-center"><DealHealthBadge health={a.dealHealth} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════ VIEW 6: TEAM MANAGEMENT ═══════════════════
  const renderTeamManagement = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">Team Management</h1>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[#e8e5e1]">
          {(['roster', 'cadence', 'alerts', 'goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTeamMgmtSubTab(tab)}
              className={`px-6 py-3 text-13px font-semibold border-b-2 transition-colors ${
                teamMgmtSubTab === tab ? 'text-[#157A6E] border-[#157A6E]' : 'text-gray-500 border-transparent'
              }`}
            >
              {tab === 'roster' ? 'Roster' : tab === 'cadence' ? 'Cadence' : tab === 'alerts' ? 'Alerts' : 'Goals'}
            </button>
          ))}
        </div>

        {teamMgmtSubTab === 'roster' && (
          <div className="space-y-4">
            <button onClick={() => { setShowTerritoryWizard(true); setTerritoryWizardStep(1); }} className="px-3 py-1.5 text-[10px] font-bold text-white bg-[#157A6E] rounded-full hover:bg-[#126a5f]">⚙️ Territory Wizard</button>

            <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
              <table className="w-full text-11px">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Territory</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Partners</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Active Deals</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-700">Quota</th>
                  </tr>
                </thead>
                <tbody>
                  {reps.map((rep, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold text-gray-800">{rep.name}</td>
                      <td className="px-4 py-2 text-gray-600">{rep.territories?.join(', ') || 'TBD'}</td>
                      <td className="px-4 py-2 text-center text-gray-600">{rep.partnerCount}</td>
                      <td className="px-4 py-2 text-center text-gray-600">{rep.activeDeals}</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-800">{formatCurrency(rep.quotaTarget)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {teamMgmtSubTab === 'cadence' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {(['anchor', 'scaling', 'building', 'launching'] as const).map(tier => (
                <div key={tier} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                  <p className="text-11px font-bold uppercase text-gray-600">{tier} Tier</p>
                  <input
                    type="number"
                    value={cadenceRules[tier]}
                    onChange={(e) => setCadenceRules({...cadenceRules, [tier]: parseInt(e.target.value) || 0})}
                    className="w-full mt-2 px-2 py-1 border border-gray-200 rounded text-13px font-bold text-[#157A6E] text-center focus:outline-none focus:border-[#157A6E]"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 text-center">days between touches</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
              <table className="w-full text-11px">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-left font-bold text-gray-700">CM</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Overall</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Anchor</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Scaling</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Building</th>
                  </tr>
                </thead>
                <tbody>
                  {reps.map((rep, i) => {
                    const cadence = getRepCadence(rep.id);
                    return (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 font-semibold text-gray-800">{rep.name}</td>
                        <td className="px-4 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${cadence.overall >= 80 ? 'bg-green-100 text-green-800' : cadence.overall >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{cadence.overall}%</span></td>
                        <td className="px-4 py-2 text-center text-gray-600">{cadence.anchor}%</td>
                        <td className="px-4 py-2 text-center text-gray-600">{cadence.scaling}%</td>
                        <td className="px-4 py-2 text-center text-gray-600">{cadence.building}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {teamMgmtSubTab === 'alerts' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <label className="text-11px font-bold uppercase text-gray-600">Deal Push Threshold</label>
                <input
                  type="number"
                  value={alertThresholds.dealPushThreshold}
                  onChange={(e) => setAlertThresholds({...alertThresholds, dealPushThreshold: parseInt(e.target.value) || 0})}
                  className="w-full mt-2 px-3 py-2 border border-gray-200 rounded text-13px font-bold text-[#157A6E] focus:outline-none focus:border-[#157A6E]"
                />
                <p className="text-[10px] text-gray-500 mt-1">Alert if deal pushed above this MRR</p>
              </div>

              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <label className="text-11px font-bold uppercase text-gray-600">Cadence Compliance Threshold</label>
                <input
                  type="number"
                  value={alertThresholds.cadenceComplianceThreshold}
                  onChange={(e) => setAlertThresholds({...alertThresholds, cadenceComplianceThreshold: parseInt(e.target.value) || 0})}
                  className="w-full mt-2 px-3 py-2 border border-gray-200 rounded text-13px font-bold text-[#157A6E] focus:outline-none focus:border-[#157A6E]"
                />
                <p className="text-[10px] text-gray-500 mt-1">Alert if compliance below this %</p>
              </div>
            </div>
          </div>
        )}

        {teamMgmtSubTab === 'goals' && (
          <div className="space-y-4">
            {/* GOALS TABLE */}
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] overflow-hidden">
              <table className="w-full text-11px">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-left font-bold text-gray-700">CM</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-700">Quota</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-700">Commit</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Variance</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-700">Upside</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reps.map((rep, i) => {
                    const variance = rep.currentCommit - rep.commitTarget;
                    const repUpside = upsideDeals.filter(d => d.repId === rep.id).reduce((s, d) => s + d.mrr, 0);
                    return (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 font-semibold text-gray-800">{rep.name}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{formatCurrency(rep.quotaTarget)}</td>
                        <td className="px-4 py-2 text-right font-bold text-gray-800">{formatCurrency(rep.currentCommit)}</td>
                        <td className="px-4 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${variance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{variance >= 0 ? '+' : ''}{formatCurrency(variance)}</span></td>
                        <td className="px-4 py-2 text-right text-[#157A6E] font-bold">{formatCurrency(repUpside)}</td>
                        <td className="px-4 py-2 text-center text-gray-600">{Math.round(rep.winRate)}%</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-[#F7F5F2] font-bold">
                    <td className="px-4 py-2 text-gray-800">TEAM TOTAL</td>
                    <td className="px-4 py-2 text-right text-gray-800">{formatCurrency(teamTarget)}</td>
                    <td className="px-4 py-2 text-right text-gray-800">{formatCurrency(teamCommit)}</td>
                    <td className="px-4 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${commitGap <= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{commitGap <= 0 ? '−' : '−'}{formatCurrency(Math.abs(commitGap))}</span></td>
                    <td className="px-4 py-2 text-right text-[#157A6E] font-bold">{formatCurrency(totalUpside)}</td>
                    <td className="px-4 py-2 text-center text-gray-800">{avgWinRate}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* UPSIDE TRACKING */}
            <div className="bg-gradient-to-r from-[#157A6E] to-[#0d5a51] rounded-[10px] text-white p-6">
              <h3 className="text-[16px] font-bold mb-4">Upside Tracking</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] uppercase opacity-75">Total Upside</p>
                  <p className="text-[20px] font-bold mt-2">{formatCurrency(totalUpside)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-75">Upside Deals</p>
                  <p className="text-[20px] font-bold mt-2">{upsideDeals.length}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-75">Win Rate</p>
                  <p className="text-[20px] font-bold mt-2">{upsideWinRate}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-75">Expected Value</p>
                  <p className="text-[20px] font-bold mt-2">{formatCurrency(upsideExpectedValue)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════ MAIN RENDER ═══════════════════
  const contentByView: Record<string, React.ReactNode> = {
    'command-center': renderCommandCenter(),
    'forecast-pipeline': renderForecastPipeline(),
    'team-accountability': renderTeamAccountability(),
    'relationships': renderRelationships(),
    'intelligence': renderIntelligence(),
    'team-management': renderTeamManagement(),
  };

  return (
    <div className="flex h-screen bg-[#F7F5F2]">
      <Sidebar
        items={NAV_ITEMS_LEADER}
        activeView={activeView}
        onViewChange={setActiveView}
        role="leader"
        userName="Owen W."
        userInitials="OW"
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar nudges={[]} userName="Owen W." userInitials="OW" role="leader" />
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {contentByView[activeView]}
          </div>
        </div>
      </div>
      {panelOpen && selectedAdvisor && (
        <AdvisorPanel
          advisor={selectedAdvisor}
          deals={allDeals.filter(d => getDealAdvisorIds(d).includes(selectedAdvisor.id))}
          isOpen={panelOpen}
          onClose={() => { setPanelOpen(false); setSelectedAdvisor(null); }}
          onUpdateAdvisor={updateAdvisorField}
        />
      )}

      {/* ═══════════════════ LOG INTERACTION MODAL (Feature 4) ═══════════════════ */}
      {showLogInteractionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowLogInteractionModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[500px]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e8e5e1]">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold font-['Newsreader'] text-gray-800">Log Leader Interaction</h2>
                <button onClick={() => setShowLogInteractionModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-11px font-bold uppercase text-gray-600">Partner</label>
                <select
                  value={logInteractionAdvisor || ''}
                  onChange={(e) => setLogInteractionAdvisor(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]"
                >
                  <option value="">Select partner...</option>
                  {advisors.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.company})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-11px font-bold uppercase text-gray-600">Interaction Note</label>
                <textarea
                  value={logInteractionNote}
                  onChange={(e) => setLogInteractionNote(e.target.value)}
                  placeholder="Describe the interaction and its impact..."
                  rows={4}
                  className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#e8e5e1] flex justify-end gap-2">
              <button onClick={() => setShowLogInteractionModal(false)} className="px-4 py-2 text-12px font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button
                onClick={() => {
                  if (logInteractionAdvisor && logInteractionNote) {
                    const newId = `li_${Date.now()}`;
                    setLeaderInteractions(prev => [...prev, { id: newId, advisorId: logInteractionAdvisor, date: new Date().toISOString(), note: logInteractionNote }]);
                    setLogInteractionNote('');
                    setLogInteractionAdvisor(null);
                    setShowLogInteractionModal(false);
                  }
                }}
                className="px-4 py-2 text-12px font-medium text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f]"
              >
                Log Interaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ PLAYBOOK MODAL ═══════════════════ */}
      {showPlaybookModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPlaybookModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[700px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e8e5e1]">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold font-['Newsreader'] text-gray-800">Launch Playbook</h2>

      {/* ═══════════════════ PIECE 1: CREATE PARTNER MODAL ═══════════════════ */}
      {showCreatePartner && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreatePartner(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[600px]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e8e5e1]">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold font-['Newsreader'] text-gray-800">Create New Partner</h2>
                <button onClick={() => setShowCreatePartner(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-11px font-bold uppercase text-gray-600">Partner Name</label>
                <input type="text" value={createPartnerForm.name} onChange={(e) => setCreatePartnerForm(prev => ({...prev, name: e.target.value}))} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" placeholder="Name" />
              </div>

              <div>
                <label className="text-11px font-bold uppercase text-gray-600">Company</label>
                <input type="text" value={createPartnerForm.company} onChange={(e) => setCreatePartnerForm(prev => ({...prev, company: e.target.value}))} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" placeholder="Company" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-11px font-bold uppercase text-gray-600">Email</label>
                  <input type="email" value={createPartnerForm.email} onChange={(e) => setCreatePartnerForm(prev => ({...prev, email: e.target.value}))} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" placeholder="Email" />
                </div>
                <div>
                  <label className="text-11px font-bold uppercase text-gray-600">Phone</label>
                  <input type="tel" value={createPartnerForm.phone} onChange={(e) => setCreatePartnerForm(prev => ({...prev, phone: e.target.value}))} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" placeholder="Phone" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-11px font-bold uppercase text-gray-600">Tier</label>
                  <select value={createPartnerForm.tier} onChange={(e) => setCreatePartnerForm(prev => ({...prev, tier: e.target.value}))} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]">
                    <option value="anchor">Anchor</option>
                    <option value="scaling">Scaling</option>
                    <option value="building">Building</option>
                    <option value="launching">Launching</option>
                  </select>
                </div>
                <div>
                  <label className="text-11px font-bold uppercase text-gray-600">State</label>
                  <input type="text" value={createPartnerForm.state} onChange={(e) => setCreatePartnerForm(prev => ({...prev, state: e.target.value}))} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" placeholder="State" />
                </div>
              </div>

              <div>
                <label className="text-11px font-bold uppercase text-gray-600">Notes</label>
                <textarea value={createPartnerForm.notes} onChange={(e) => setCreatePartnerForm(prev => ({...prev, notes: e.target.value}))} rows={3} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" placeholder="Additional notes..." />
              </div>
            </div>

            <div className="p-6 border-t border-[#e8e5e1] flex justify-end gap-2">
              <button onClick={() => setShowCreatePartner(false)} className="px-4 py-2 text-12px font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={() => { if (createPartnerForm.name && createPartnerForm.company) { const newAdvisor: any = { id: `a_${Date.now()}`, name: createPartnerForm.name, title: '', company: createPartnerForm.company, email: createPartnerForm.email, phone: createPartnerForm.phone, tier: createPartnerForm.tier, pulse: 'Strong', trajectory: 'Stable', tone: 'Neutral', intent: 'Growth', friction: 'Low', dealHealth: 'Good', relationshipStage: 'Prospect', location: createPartnerForm.state, birthday: '', education: '', family: '', hobbies: '', funFact: '', personalIntel: '', tsds: [], previousCompanies: [], mutualConnections: [], sharedClients: [], notes: [createPartnerForm.notes], activity: [], lastContact: new Date().toISOString(), deals: [], mrr: 5000, connectedSince: new Date().toISOString(), bestDayToReach: 'Monday', commPreference: 'Email', referredBy: '', engagementBreakdown: { engagement: 'Steady', pipelineStrength: 'Steady', responsiveness: 'Steady', growthPotential: 'Steady' }, diagnosis: '' }; setAdvisors(prev => [...prev, newAdvisor]); setCreatePartnerForm({ name: '', company: '', email: '', phone: '', tier: 'launching', state: '', notes: '' }); setShowCreatePartner(false); } }} className="px-4 py-2 text-12px font-medium text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f]">Create Partner</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ PIECE 2: CREATE GROUP MODAL ═══════════════════ */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreateGroup(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[700px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e8e5e1]">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold font-['Newsreader'] text-gray-800">Create Partner Group</h2>
                <button onClick={() => setShowCreateGroup(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-11px font-bold uppercase text-gray-600">Group Name</label>
                <input type="text" value={createGroupForm.name} onChange={(e) => setCreateGroupForm(prev => ({...prev, name: e.target.value}))} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" placeholder="e.g., Texas Anchors" />
              </div>

              <div>
                <label className="text-11px font-bold uppercase text-gray-600">Rules</label>
                <div className="mt-2 space-y-2">
                  {createGroupForm.rules.map((rule, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select value={rule.field} onChange={(e) => { const newRules = [...createGroupForm.rules]; newRules[idx].field = e.target.value; setCreateGroupForm(prev => ({...prev, rules: newRules})); }} className="flex-1 px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-[#157A6E]">
                        <option value="tier">Tier</option>
                        <option value="pulse">Pulse</option>
                        <option value="state">State</option>
                        <option value="stage">Stage</option>
                        <option value="trajectory">Trajectory</option>
                      </select>
                      <select value={rule.operator} onChange={(e) => { const newRules = [...createGroupForm.rules]; newRules[idx].operator = e.target.value; setCreateGroupForm(prev => ({...prev, rules: newRules})); }} className="flex-1 px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-[#157A6E]">
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                        <option value="contains">Contains</option>
                      </select>
                      <input type="text" value={rule.value} onChange={(e) => { const newRules = [...createGroupForm.rules]; newRules[idx].value = e.target.value; setCreateGroupForm(prev => ({...prev, rules: newRules})); }} className="flex-1 px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:border-[#157A6E]" placeholder="Value" />
                      {createGroupForm.rules.length > 1 && <button onClick={() => setCreateGroupForm(prev => ({...prev, rules: prev.rules.filter((_, i) => i !== idx)}))} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setCreateGroupForm(prev => ({...prev, rules: [...prev.rules, {field: 'tier', operator: 'equals', value: ''}]}))} className="text-[10px] text-[#157A6E] font-semibold hover:underline">+ Add Rule</button>
                </div>
              </div>

              <div>
                <label className="text-11px font-bold uppercase text-gray-600">Assigned CMs</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Jordan R.', 'Sarah K.', 'Marcus T.', 'Whole Team'].map(cm => (
                    <button key={cm} onClick={() => { if (createGroupForm.assignedCMs.includes(cm)) { setCreateGroupForm(prev => ({...prev, assignedCMs: prev.assignedCMs.filter(c => c !== cm)})); } else { setCreateGroupForm(prev => ({...prev, assignedCMs: [...prev.assignedCMs, cm]})); } }} className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${createGroupForm.assignedCMs.includes(cm) ? 'bg-[#157A6E] text-white' : 'bg-gray-100 text-gray-600'}`}>{cm}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-11px font-bold uppercase text-gray-600">Start Date (optional)</label>
                  <input type="date" value={createGroupForm.startDate} onChange={(e) => setCreateGroupForm(prev => ({...prev, startDate: e.target.value}))} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" />
                </div>
                <div>
                  <label className="text-11px font-bold uppercase text-gray-600">End Date (optional)</label>
                  <input type="date" value={createGroupForm.endDate} onChange={(e) => setCreateGroupForm(prev => ({...prev, endDate: e.target.value}))} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#e8e5e1] flex justify-end gap-2">
              <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2 text-12px font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={() => { if (createGroupForm.name && createGroupForm.rules.every(r => r.value)) { const newGroup = { id: `g_${Date.now()}`, name: createGroupForm.name, rules: createGroupForm.rules, assignedTo: createGroupForm.assignedCMs, startDate: createGroupForm.startDate || undefined, endDate: createGroupForm.endDate || undefined }; setPartnerGroups(prev => [...prev, newGroup]); saveToStorage('leader_partnerGroups', [...partnerGroups, newGroup]); setCreateGroupForm({ name: '', rules: [{ field: 'tier', operator: 'equals', value: '' }], assignedCMs: [], startDate: '', endDate: '' }); setShowCreateGroup(false); } }} className="px-4 py-2 text-12px font-medium text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f]">Create Group</button>
            </div>
          </div>
        </div>
      )}
                <button onClick={() => setShowPlaybookModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-11px font-bold uppercase text-gray-600">Select Partner</label>
                <div className="mt-2">
                  {!playbookModalAdvisor ? (
                    <button onClick={() => setShowPlaybookAdvisorPicker(true)} className="w-full px-3 py-2 border border-[#e8e5e1] rounded-lg text-12px text-gray-600 hover:bg-gray-50">
                      Choose partner...
                    </button>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-[#e8e5e1] flex items-center justify-between">
                      <div>
                        <p className="text-12px font-semibold text-gray-800">{playbookModalAdvisor.name}</p>
                        <p className="text-[10px] text-gray-500">{playbookModalAdvisor.company}</p>
                      </div>
                      <button onClick={() => setShowPlaybookAdvisorPicker(true)} className="text-[10px] text-[#157A6E] font-semibold">Change</button>
                    </div>
                  )}
                </div>

                {showPlaybookAdvisorPicker && (
                  <div className="mt-2 border border-[#e8e5e1] rounded-lg overflow-hidden">
                    <input
                      type="text"
                      value={playbookAdvisorSearch}
                      onChange={(e) => setPlaybookAdvisorSearch(e.target.value)}
                      placeholder="Search partners..."
                      className="w-full px-3 py-2 text-12px border-b border-[#e8e5e1] focus:outline-none focus:bg-teal-50"
                      autoFocus
                    />
                    <div className="max-h-[200px] overflow-y-auto">
                      {advisors
                        .filter(a => !playbookAdvisorSearch || a.name.toLowerCase().includes(playbookAdvisorSearch.toLowerCase()) || a.company.toLowerCase().includes(playbookAdvisorSearch.toLowerCase()))
                        .map(a => (
                          <div
                            key={a.id}
                            onClick={() => { setPlaybookModalAdvisor(a); setShowPlaybookAdvisorPicker(false); setPlaybookAdvisorSearch(''); }}
                            className="flex items-center justify-between px-3 py-2 hover:bg-[#F7F5F2] cursor-pointer border-b border-gray-50"
                          >
                            <div><p className="text-12px font-semibold text-gray-800">{a.name}</p><p className="text-[10px] text-gray-500">{a.company}</p></div>
                            <div className="flex items-center gap-2"><TierBadge tier={a.tier} /><span className="text-11px font-bold text-gray-700">{formatCurrency(a.mrr)}</span></div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-11px font-bold uppercase text-gray-600">Choose Template</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {playbookTemplates.map(tmpl => (
                    <div
                      key={tmpl.id}
                      onClick={() => {
                        if (playbookModalAdvisor) {
                          setLaunchedPlaybooks(prev => [...prev, {
                            templateId: tmpl.id,
                            advisorId: playbookModalAdvisor.id,
                            advisorName: playbookModalAdvisor.name,
                            launchedAt: new Date().toISOString(),
                            priority: playbookPriority,
                            completedSteps: [],
                            skippedSteps: [],
                            playbookName: tmpl.title
                          }]);
                          setShowPlaybookModal(false);
                        }
                      }}
                      className={`${tmpl.bgColor} rounded-lg border-2 border-[#e8e5e1] p-3 cursor-pointer hover:shadow-md transition-all border-l-4 ${tmpl.borderColor} ${!playbookModalAdvisor ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-[18px]">{tmpl.icon}</span>
                        <div className="flex-1">
                          <h4 className="text-12px font-semibold text-gray-800">{tmpl.title}</h4>
                          <p className="text-[10px] text-gray-600">{tmpl.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#e8e5e1] flex justify-end gap-2">
              <button onClick={() => setShowPlaybookModal(false)} className="px-4 py-2 text-12px font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}


      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowAddSupplierModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e8e5e1]">
              <div className="flex justify-between items-center">
                <h2 className="text-[18px] font-bold font-['Newsreader'] text-gray-800">Add Collaboration</h2>
                <button onClick={() => setShowAddSupplierModal(false)}><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-11px font-bold uppercase text-gray-600 block mb-2">Supplier Name</label>
                <input type="text" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" />
              </div>
              <div>
                <label className="text-11px font-bold uppercase text-gray-600 block mb-2">CM</label>
                <select value={newSupplierCM} onChange={(e) => setNewSupplierCM(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]">
                  <option value="">Select CM...</option>
                  {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-11px font-bold uppercase text-gray-600 block mb-2">Type</label>
                <select value={newSupplierType} onChange={(e) => setNewSupplierType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]">
                  <option value="co-event">Co-Event</option>
                  <option value="joint-selling">Joint Selling</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
              <div>
                <label className="text-11px font-bold uppercase text-gray-600 block mb-2">Status</label>
                <select value={newSupplierStatus} onChange={(e) => setNewSupplierStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]">
                  <option value="proposed">Proposed</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-11px font-bold uppercase text-gray-600 block mb-2">Notes</label>
                <textarea value={newSupplierNotes} onChange={(e) => setNewSupplierNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-12px focus:outline-none focus:border-[#157A6E]" />
              </div>
            </div>
            <div className="p-6 border-t border-[#e8e5e1] flex gap-2 justify-end">
              <button onClick={() => setShowAddSupplierModal(false)} className="px-4 py-2 text-12px font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={() => { const id = `sc_${Date.now()}`; setSupplierCollabs(prev => [...prev, {id, repId: newSupplierCM, supplierName: newSupplierName, type: newSupplierType, status: newSupplierStatus, partnerIds: [], notes: newSupplierNotes}]); setShowAddSupplierModal(false); setNewSupplierName(''); setNewSupplierCM(''); setNewSupplierNotes(''); }} className="px-4 py-2 text-12px font-medium text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f]">Create Collaboration</button>
            </div>
          </div>
        </div>
      )}

      <AIChat role="leader" selectedAdvisor={selectedAdvisor} live={true} />
    </div>
  );
}
