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

  // Forecast & Pipeline state
  const [expandedForecastRep, setExpandedForecastRep] = useState<string | null>(null);
  const [forecastSubTab, setForecastSubTab] = useState<'overview' | 'pipeline' | 'deals' | 'lost' | 'push'>('overview');
  const [pipelineFilter, setPipelineFilter] = useState<{ cm: string; stage: string; health: string }>({ cm: '', stage: '', health: '' });
  const [expandedStage, setExpandedStage] = useState<DealStageType | null>(null);

  // Team & Accountability state
  const [teamSubTab, setTeamSubTab] = useState<'overview' | 'cadence' | 'friction' | 'coaching' | 'benchmarks'>('overview');
  const [teamExpandedCM, setTeamExpandedCM] = useState<string | null>(null);

  // Relationships state
  const [relationshipsView, setRelationshipsView] = useState<'list' | 'detail'>('list');
  const [relationshipViewMode, setRelationshipViewMode] = useState<'partners' | 'tsds' | 'all' | 'groups'>('partners');
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [relationshipOwnerFilter, setRelationshipOwnerFilter] = useState('');
  const [relationshipStageFilter, setRelationshipStageFilter] = useState('All');
  const [relationshipSort, setRelationshipSort] = useState<'mrr' | 'name' | 'lastContact'>('mrr');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [myOnlyPartners, setMyOnlyPartners] = useState(false);
  const [showFullUSA, setShowFullUSA] = useState(true);
  const [territoryRegion, setTerritoryRegion] = useState<string | null>(null);
  const [territoryExceptions, setTerritoryExceptions] = useState<string[]>([]);
  const [territoryRemoved, setTerritoryRemoved] = useState<string[]>([]);

  // Intelligence state
  const [intelligenceSubTab, setIntelligenceSubTab] = useState<'overview' | 'signals' | 'playbooks' | 'diagnostics' | 'resources'>('overview');
  const [signalFilter, setSignalFilter] = useState<'all' | 'churn' | 'growth' | 'stall' | 'intel'>('all');

  // Team management state
  const [teamMgmtSubTab, setTeamMgmtSubTab] = useState<'roster' | 'cadence' | 'alerts' | 'notifications' | 'goals'>('roster');
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
  const [editingPlaybookIdx, setEditingPlaybookIdx] = useState<number | null>(null);

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
    setExpandedForecastRep(null);
    setExpandedStage(null);
    setTeamExpandedCM(null);
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
      const stored = loadFromStorage<{region?: string | null; exceptions?: string[]; removed?: string[]}>('leader-territory-settings', {});
      setTerritoryRegion(stored.region || null);
      setTerritoryExceptions(stored.exceptions || []);
      setTerritoryRemoved(stored.removed || []);
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

  // Get all advisors linked to a rep — via rep.advisorIds, exceptionAdvisors, AND deals
  const getRepAdvisors = (rep: Rep): Advisor[] => {
    const ids = new Set<string>();
    if (rep.advisorIds) rep.advisorIds.forEach(id => ids.add(id));
    if (rep.exceptionAdvisors) rep.exceptionAdvisors.forEach(id => ids.add(id));
    deals.filter(d => d.repId === rep.id).forEach(d => getDealAdvisorIds(d).forEach(id => ids.add(id)));
    return advisors.filter(a => ids.has(a.id));
  };

  // Get cadence data for a rep, initializing from seededRandom if not stored
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

  // Get activity data for a rep, initializing from seededRandom if not stored
  const getRepActivity = (repId: string) => {
    if (repActivityData[repId]) return repActivityData[repId];
    return {
      meetings: Math.floor(seededRandom(repId + 'meetings', 5, 25)),
      calls: Math.floor(seededRandom(repId + 'calls', 10, 35)),
      emails: Math.floor(seededRandom(repId + 'emails', 40, 80)),
    };
  };

  // Time-ago helper based on real dates
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

  // Signals — generated from real data with real timestamps
  const signals = useMemo(() => {
    const sigs: Signal[] = [];
    const now = new Date();
    deals.forEach(d => {
      if (d.health === 'At Risk' || d.health === 'Critical') {
        const rep = reps.find(r => r.id === d.repId);
        const advisorIds = d.advisorIds?.length ? d.advisorIds : [d.advisorId];
        const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || 'Unknown';
        // Time based on daysInStage — the longer it's been stuck, the longer ago the signal
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
    return sigs.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [deals, advisors, reps, overrideActions]);

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

  // Unassigned partners: advisors not covered by any rep's advisor list
  const unassignedPartners = useMemo(() => {
    const allRepAdvisorIds = new Set<string>();
    reps.forEach(rep => {
      if (rep.advisorIds) rep.advisorIds.forEach(id => allRepAdvisorIds.add(id));
      if (rep.exceptionAdvisors) rep.exceptionAdvisors.forEach(id => allRepAdvisorIds.add(id));
    });
    // Also check deals — if an advisor has a deal with a rep, they're assigned
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
      if (activeView === 'relationships') setRelationshipsView('detail');
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

  // ═══════════════════ VIEW 0: COMMAND CENTER ═══════════════════
  const renderCommandCenter = () => {
    const myDeals = allDeals.filter(d => leaderInvolved.has(d.id));
    const criticalSignals = signals.filter(s => s.severity === 'critical');
    const stalledHighValue = allDeals.filter(d => (d.daysInStage > 14 && d.mrr >= 15000) || (d.health === 'At Risk' && d.mrr >= 10000));
    const pendingOverrides = allDeals.filter(d => d.overrideRequested && !overrideActions[d.id]);

    // Build action items from real data
    const actionItems: Array<{priority: 'critical' | 'high' | 'medium' | 'low'; title: string; meta: string; onClick?: () => void}> = [];
    if (pendingOverrides.length > 0) actionItems.push({ priority: 'critical', title: `Approve ${pendingOverrides.length} forecast override${pendingOverrides.length > 1 ? 's' : ''}`, meta: `Due today · ${pendingOverrides.map(d => { const r = reps.find(re => re.id === d.repId); return r?.name || '?'; }).join(', ')}`, onClick: () => setActiveView('forecast-pipeline') });
    if (unassignedPartners.length > 0) actionItems.push({ priority: 'critical', title: `Assign CM to ${unassignedPartners.length} unassigned partner${unassignedPartners.length > 1 ? 's' : ''}`, meta: `Overdue · ${formatCurrency(unassignedPartners.reduce((s, a) => s + a.mrr, 0))} MRR without coverage`, onClick: () => { setActiveView('relationships'); setRelationshipFilter('All'); } });
    stalledHighValue.slice(0, 3).forEach(d => {
      const rep = reps.find(r => r.id === d.repId);
      actionItems.push({ priority: 'high', title: `Review ${d.name} — ${d.stage} for ${d.daysInStage}d`, meta: `${rep?.name || '?'} · ${formatCurrency(d.mrr)} MRR`, onClick: () => setSelectedDeal(d) });
    });
    const lowCadenceReps = reps.filter(r => getRepCadence(r.id).overall < alertThresholds.cadenceComplianceThreshold);
    if (lowCadenceReps.length > 0) actionItems.push({ priority: 'medium', title: `Review cadence compliance — ${lowCadenceReps.length} CM${lowCadenceReps.length > 1 ? 's' : ''} below ${alertThresholds.cadenceComplianceThreshold}%`, meta: 'This week', onClick: () => { setActiveView('team-accountability'); setTeamSubTab('cadence'); } });
    launchedPlaybooks.filter(p => { const s = p.customSteps || playbookTemplates.find(t => t.id === p.templateId)?.steps || []; const eff = s.length - p.skippedSteps.length; return eff > 0 && p.completedSteps.length < eff; }).slice(0, 2).forEach(pb => {
      actionItems.push({ priority: 'low', title: `Continue playbook: ${pb.playbookName || pb.templateId.replace('-', ' ')} (${pb.advisorName})`, meta: 'In progress', onClick: () => { setActiveView('intelligence'); setIntelligenceSubTab('playbooks'); } });
    });

    // Impact actions: top 3 most impactful things
    const impactActions: Array<{level: string; icon: string; color: string; title: string; desc: string; cta: string; onClick?: () => void}> = [];
    const biggestStalledDeal = stalledHighValue.sort((a, b) => b.mrr - a.mrr)[0];
    if (biggestStalledDeal) {
      const rep = reps.find(r => r.id === biggestStalledDeal.repId);
      const advId = getDealAdvisorIds(biggestStalledDeal)[0];
      const adv = advisors.find(a => a.id === advId);
      impactActions.push({ level: 'Critical', icon: '🔥', color: '#ef4444', title: `Call ${adv?.company || 'partner'} — ${formatCurrency(biggestStalledDeal.mrr)} deal stalling`, desc: `${rep?.name}'s deal stuck in ${biggestStalledDeal.stage} for ${biggestStalledDeal.daysInStage} days. Partner pulse: ${adv?.pulse || '?'}.`, cta: 'Your involvement could unlock this', onClick: () => setSelectedDeal(biggestStalledDeal) });
    }
    if (unassignedPartners.length > 0) {
      const anchorCount = unassignedPartners.filter(a => a.tier === 'anchor').length;
      impactActions.push({ level: 'High Priority', icon: '⚠️', color: '#f59e0b', title: `Review ${unassignedPartners.length} unassigned relationships`, desc: `Partners without an assigned CM${anchorCount > 0 ? `: ${anchorCount} anchor-tier` : ''}. Combined MRR: ${formatCurrency(unassignedPartners.reduce((s, a) => s + a.mrr, 0))}.`, cta: 'Assign before cadence lapses', onClick: () => { setActiveView('relationships'); setRelationshipFilter('All'); } });
    }
    if (pendingOverrides.length > 0) {
      const biggest = pendingOverrides.sort((a, b) => b.mrr - a.mrr)[0];
      const rep = reps.find(r => r.id === biggest.repId);
      impactActions.push({ level: 'Opportunity', icon: '📈', color: '#157A6E', title: `Approve ${rep?.name}'s override — ${formatCurrency(biggest.mrr)} commit`, desc: `${biggest.name} — wants upside override. Probability: ${biggest.probability}%.`, cta: `Approve to boost team commit`, onClick: () => setActiveView('forecast-pipeline') });
    }
    // Fill with expansion if we have room
    if (impactActions.length < 3) {
      const expanding = advisors.filter(a => a.trajectory === 'Accelerating').sort((a, b) => b.mrr - a.mrr)[0];
      if (expanding) {
        impactActions.push({ level: 'Opportunity', icon: '📈', color: '#157A6E', title: `Expand ${expanding.name} — ${expanding.trajectory} trajectory`, desc: `${expanding.company} · ${formatCurrency(expanding.mrr)} MRR · Strong growth potential.`, cta: 'Cross-sell opportunity', onClick: () => handleAdvisorClick(expanding.id) });
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">{(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}, Owen</h1>
          <p className="text-12px text-gray-500 mt-1">Here&apos;s what matters most today · {DAYS_REMAINING} days left in quarter</p>
        </div>

        {/* HIGH-IMPACT ACTIONS */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">Highest-Impact Actions Today</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {impactActions.slice(0, 3).map((action, i) => (
            <div key={i} className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-all" style={{ borderLeft: `3px solid ${action.color}` }} onClick={action.onClick}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[16px]">{action.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.5px]" style={{ color: action.color }}>{action.level}</span>
              </div>
              <p className="text-13px font-semibold text-gray-800 mb-1">{action.title}</p>
              <p className="text-11px text-gray-500 mb-2">{action.desc}</p>
              <p className="text-[10px] text-[#157A6E] font-semibold">→ {action.cta}</p>
            </div>
          ))}
        </div>

        {/* ACTION ITEMS + TODAY'S MEETINGS */}
        <div className="grid grid-cols-2 gap-4">
          {/* Action Items */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Your Action Items</h3>
              <span className="text-[10px] text-[#157A6E] font-semibold">{actionItems.length} items</span>
            </div>
            <div className="space-y-2">
              {actionItems.map((item, i) => {
                const dotColors = { critical: 'bg-red-500', high: 'bg-amber-500', medium: 'bg-[#157A6E]', low: 'bg-gray-400' };
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#fafaf8] cursor-pointer hover:bg-gray-100" onClick={item.onClick}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColors[item.priority]}`} />
                    <div>
                      <p className="text-12px font-semibold text-gray-800">{item.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.meta}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Key Meetings */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Today&apos;s Key Meetings</h3>
              <button onClick={() => setEditingMeetings(!editingMeetings)} className="text-[10px] text-[#157A6E] font-semibold cursor-pointer hover:underline">{editingMeetings ? 'Done editing' : 'Edit meetings →'}</button>
            </div>
            <div className="space-y-2">
              {/* Meetings — from localStorage or generated from data */}
              {(() => {
                const meetings = storedMeetings.length > 0 ? storedMeetings : (() => {
                  const generated: typeof storedMeetings = [];
                  const topDeal = allDeals.filter(d => d.stage === 'Negotiating' || d.stage === 'Proposal').sort((a, b) => b.mrr - a.mrr)[0];
                  if (topDeal) {
                    const rep = reps.find(r => r.id === topDeal.repId);
                    const adv = advisors.find(a => a.id === getDealAdvisorIds(topDeal)[0]);
                    generated.push({ time: '9:00 AM', title: `Deal Review — ${adv?.company || topDeal.name}`, detail: `${rep?.name} · ${formatCurrency(topDeal.mrr)} MRR · ${topDeal.stage}`, stake: 'High Stakes', stakeColor: 'bg-red-100 text-red-800', borderColor: '#ef4444' });
                  }
                  if (reps[0]) generated.push({ time: '11:30 AM', title: `Pipeline Review — ${reps[0].name}`, detail: `1:1 weekly · ${reps[0].activeDeals} active deals · ${formatCurrency(reps[0].currentCommit)} commit`, stake: 'Review', stakeColor: 'bg-amber-100 text-amber-800', borderColor: '#f59e0b' });
                  generated.push({ time: '4:00 PM', title: 'Channel Team Standup', detail: `All CMs · Weekly sync · Commit updates due`, stake: 'Recurring', stakeColor: 'bg-gray-100 text-gray-600', borderColor: '#9ca3af' });
                  return generated;
                })();

                if (editingMeetings) {
                  const editableMeetings = storedMeetings.length > 0 ? [...storedMeetings] : [...meetings];
                  return (
                    <div className="space-y-2">
                      {editableMeetings.map((m, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                          <div className="flex gap-2">
                            <input type="text" value={m.time} onChange={e => { const up = [...editableMeetings]; up[i] = { ...up[i], time: e.target.value }; setStoredMeetings(up); }} className="w-20 px-2 py-1 border border-gray-200 rounded text-11px font-bold" placeholder="9:00 AM" />
                            <input type="text" value={m.title} onChange={e => { const up = [...editableMeetings]; up[i] = { ...up[i], title: e.target.value }; setStoredMeetings(up); }} className="flex-1 px-2 py-1 border border-gray-200 rounded text-11px" placeholder="Meeting title" />
                            <button onClick={() => { const up = editableMeetings.filter((_, j) => j !== i); setStoredMeetings(up); }} className="text-red-400 hover:text-red-600 text-[10px] px-1">✕</button>
                          </div>
                          <input type="text" value={m.detail} onChange={e => { const up = [...editableMeetings]; up[i] = { ...up[i], detail: e.target.value }; setStoredMeetings(up); }} className="w-full px-2 py-1 border border-gray-200 rounded text-[10px]" placeholder="Details" />
                          <select value={m.stake} onChange={e => { const up = [...editableMeetings]; const stakeMap: Record<string, {stakeColor: string; borderColor: string}> = { 'High Stakes': { stakeColor: 'bg-red-100 text-red-800', borderColor: '#ef4444' }, 'Review': { stakeColor: 'bg-amber-100 text-amber-800', borderColor: '#f59e0b' }, 'Recurring': { stakeColor: 'bg-gray-100 text-gray-600', borderColor: '#9ca3af' }, 'Prep': { stakeColor: 'bg-blue-100 text-blue-800', borderColor: '#3b82f6' } }; up[i] = { ...up[i], stake: e.target.value, ...stakeMap[e.target.value] }; setStoredMeetings(up); }} className="px-2 py-1 border border-gray-200 rounded text-[10px]">
                            <option value="High Stakes">High Stakes</option>
                            <option value="Review">Review</option>
                            <option value="Recurring">Recurring</option>
                            <option value="Prep">Prep</option>
                          </select>
                        </div>
                      ))}
                      <button onClick={() => setStoredMeetings([...editableMeetings, { time: '12:00 PM', title: 'New Meeting', detail: '', stake: 'Review', stakeColor: 'bg-amber-100 text-amber-800', borderColor: '#f59e0b' }])} className="text-[10px] text-[#157A6E] font-semibold hover:underline">+ Add Meeting</button>
                    </div>
                  );
                }

                return meetings.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg border border-[#e8e5e1]" style={{ borderLeft: `3px solid ${m.borderColor}` }}>
                    <div className="text-[11px] font-bold text-[#157A6E] min-w-[55px] text-center">{m.time}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-12px font-semibold text-gray-800 truncate">{m.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{m.detail}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[9px] font-semibold ${m.stakeColor} whitespace-nowrap`}>{m.stake}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* AT-A-GLANCE KPIs */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#157A6E] whitespace-nowrap">At a Glance</span>
          <div className="flex-1 h-px bg-[#e8e5e1]" />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Team Commit" value={formatCurrency(teamCommit)} change={`${commitPercentage}% of ${formatCurrency(teamTarget)}`} changeType={commitPercentage >= 85 ? "positive" : "negative"} />
          <KPICard label="Weighted Pipeline" value={formatCurrency(weightedPipeline)} change={`Coverage: ${teamTarget > 0 ? (weightedPipeline / teamTarget).toFixed(1) : '0'}×`} changeType="neutral" />
          <KPICard label="At-Risk MRR" value={formatCurrency(atRiskMRR)} change={`${atRiskAdvisors.length} partners flagged`} changeType={atRiskAdvisors.length === 0 ? "positive" : "negative"} />
          <KPICard label="Win Rate (QTD)" value={`${avgWinRate}%`} change={`${avgCycle}d avg cycle`} changeType="neutral" />
        </div>

        {/* COMPACT WIDGETS ROW */}
        <div className="grid grid-cols-3 gap-4">
          {/* Active Playbooks */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Active Playbooks</h3>
              <button onClick={() => { setActiveView('intelligence'); setIntelligenceSubTab('playbooks'); }} className="text-[10px] text-[#157A6E] font-semibold">Manage →</button>
            </div>
            {launchedPlaybooks.length > 0 ? launchedPlaybooks.slice(0, 3).map((pb, idx) => {
              const tmpl = playbookTemplates.find(t => t.id === pb.templateId);
              const steps = pb.customSteps || tmpl?.steps || [];
              const effective = steps.length - pb.skippedSteps.length;
              const pct = effective > 0 ? Math.round((pb.completedSteps.length / effective) * 100) : 100;
              return (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-[#f3f0ed] last:border-b-0">
                  <div>
                    <p className="text-12px font-semibold text-gray-800">{pb.playbookName || tmpl?.title || pb.templateId.replace('-', ' ')}</p>
                    <p className="text-[10px] text-gray-500">{pb.advisorName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-3">
                <PlayCircle className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                <p className="text-[10px] text-gray-400">No active playbooks</p>
              </div>
            )}
          </div>

          {/* Team Commit */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Team Commit</h3>
              <button onClick={() => setActiveView('forecast-pipeline')} className="text-[10px] text-[#157A6E] font-semibold">Details →</button>
            </div>
            {reps.map(rep => {
              const cp = rep.quotaTarget > 0 ? Math.round((rep.currentCommit / rep.quotaTarget) * 100) : 0;
              const barColor = cp >= 85 ? 'bg-[#157A6E]' : cp >= 60 ? 'bg-amber-400' : 'bg-red-500';
              return (
                <div key={rep.id} className="mb-2 last:mb-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-11px font-medium text-gray-700">{rep.name}</span>
                    <span className="text-11px font-bold" style={{ color: cp >= 85 ? '#157A6E' : cp >= 60 ? '#f59e0b' : '#ef4444' }}>{formatCurrency(rep.currentCommit)} <span className="text-[10px] text-gray-400 font-normal">/ {formatCurrency(rep.quotaTarget)}</span></span>
                  </div>
                  <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(cp, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Critical Signals */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Critical Signals</h3>
              <button onClick={() => { setActiveView('intelligence'); setIntelligenceSubTab('signals'); }} className="text-[10px] text-[#157A6E] font-semibold">Intelligence →</button>
            </div>
            {signals.slice(0, 3).map((sig, i) => {
              const dotColor = sig.severity === 'critical' ? 'bg-red-500' : sig.severity === 'high' ? 'bg-amber-500' : 'bg-[#157A6E]';
              return (
                <div key={i} className="flex gap-2 py-2 border-b border-[#f3f0ed] last:border-b-0">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${dotColor}`} />
                  <div>
                    <p className="text-11px font-semibold text-gray-800 leading-tight">{sig.text.length > 60 ? sig.text.slice(0, 60) + '...' : sig.text}</p>
                    <p className="text-[10px] text-gray-500">{sig.mrr ? formatCurrency(sig.mrr) + ' · ' : ''}{sig.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════ VIEW 1: FORECAST & PIPELINE ═══════════════════
  const renderForecastPipeline = () => {
    const weighted = allDeals.reduce((s, d) => s + d.mrr * (STAGE_WEIGHTS.find(sw => sw.stage === d.stage)?.weight || 0), 0);
    const pending = allDeals.filter(d => d.overrideRequested && !overrideActions[d.id]);
    const stages: DealStageType[] = ['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Stalled'];
    let filtered = allDeals;
    if (pipelineFilter.cm) filtered = filtered.filter(d => d.repId === pipelineFilter.cm);
    if (pipelineFilter.stage) filtered = filtered.filter(d => d.stage === pipelineFilter.stage);
    if (pipelineFilter.health) filtered = filtered.filter(d => d.health === pipelineFilter.health);
    const stageData = stages.map(s => ({ stage: s, deals: filtered.filter(d => d.stage === s), mrr: filtered.filter(d => d.stage === s).reduce((sum, d) => sum + d.mrr, 0), count: filtered.filter(d => d.stage === s).length }));
    const maxMRR = Math.max(...stageData.map(s => s.mrr), 1);
    const lostReasonCounts = filtered.filter(d => d.stage === 'Closed Lost' && d.lostReason).reduce((acc, d) => { acc[d.lostReason || 'unknown'] = (acc[d.lostReason || 'unknown'] || 0) + 1; return acc; }, {} as Record<string, number>);
    const pushyDeals = filtered.filter(d => d.pushHistory && d.pushHistory.length > 0).sort((a, b) => (b.pushHistory?.length || 0) - (a.pushHistory?.length || 0));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">Forecast & Pipeline</h1>
          <p className="text-12px text-gray-500 mt-1">Q2 2026 forecast tracking, pipeline health, and deal-level detail</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-0 border-b border-[#e8e5e1]">
          {([
            { id: 'overview' as const, label: 'Forecast Overview' },
            { id: 'pipeline' as const, label: 'Pipeline by Stage' },
            { id: 'deals' as const, label: 'Deal Table' },
            { id: 'lost' as const, label: 'Closed-Lost' },
            { id: 'push' as const, label: 'Push History' },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setForecastSubTab(tab.id)}
              className={`px-4 py-2.5 text-12px font-medium border-b-2 transition-colors ${forecastSubTab === tab.id ? 'text-[#157A6E] border-[#157A6E] font-semibold' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Team Commit" value={formatCurrency(teamCommit)} change={`${commitPercentage}% of target`} changeType={commitPercentage >= 85 ? "positive" : "negative"} />
          <KPICard label="Weighted Pipeline" value={formatCurrency(weighted)} change={`Coverage: ${teamTarget > 0 ? (weighted / teamTarget).toFixed(1) : '0'}×`} changeType="neutral" />
          <KPICard label="Best Case" value={formatCurrency(teamCommit + allDeals.filter(d => d.isUpside).reduce((s, d) => s + d.mrr, 0))} change={`Includes ${formatCurrency(allDeals.filter(d => d.isUpside).reduce((s, d) => s + d.mrr, 0))} upside`} changeType="positive" />
          <KPICard label="Override Requests" value={`${pending.length}`} change="Pending review" changeType={pending.length > 0 ? "negative" : "neutral"} />
        </div>

        {/* FORECAST OVERVIEW SUB-TAB */}
        {forecastSubTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Forecast by Rep</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-11px">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Channel Manager</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">Quota</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">Commit</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Commit %</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">Weighted</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Coverage</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">Closed Won</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Win Rate</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reps.map(rep => {
                      const rd = allDeals.filter(d => d.repId === rep.id);
                      const rw = rd.reduce((s, d) => s + d.mrr * (STAGE_WEIGHTS.find(sw => sw.stage === d.stage)?.weight || 0), 0);
                      const qp = rep.quotaTarget > 0 ? Math.round((rep.currentCommit / rep.quotaTarget) * 100) : 0;
                      const cov = rep.quotaTarget > 0 ? (rw / rep.quotaTarget).toFixed(1) : '0';
                      const gap = rep.quotaTarget - rep.closedWon;
                      const expanded = expandedForecastRep === rep.id;
                      return (
                        <React.Fragment key={rep.id}>
                        <tr className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${expanded ? 'bg-[#f0faf8]' : ''}`} onClick={() => setExpandedForecastRep(expanded ? null : rep.id)}>
                          <td className="px-3 py-2 font-semibold text-gray-800">
                            <div className="flex items-center gap-2"><ChevronRight className={`w-3 h-3 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />{rep.name} <EngLabel score={rep.engagementScore} /></div>
                          </td>
                          <td className="px-2 py-2 text-right">{formatCurrency(rep.quotaTarget)}</td>
                          <td className="px-2 py-2 text-right font-bold" style={{ color: qp >= 85 ? '#157A6E' : qp >= 60 ? '#f59e0b' : '#ef4444' }}>{formatCurrency(rep.currentCommit)}</td>
                          <td className="px-2 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${qp >= 85 ? 'bg-green-100 text-green-800' : qp >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{qp}%</span>
                          </td>
                          <td className="px-2 py-2 text-right">{formatCurrency(rw)}</td>
                          <td className="px-2 py-2 text-center">{cov}×</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(rep.closedWon)}</td>
                          <td className="px-2 py-2 text-center">{rep.winRate}%</td>
                          <td className="px-2 py-2 text-right font-bold text-red-600">{gap > 0 ? `-${formatCurrency(gap)}` : formatCurrency(Math.abs(gap))}</td>
                        </tr>
                        {expanded && (
                          <tr className="bg-[#fafaf8]">
                            <td colSpan={9} className="px-4 py-3">
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Active Deals for {rep.name}</p>
                                {rd.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length === 0 ? (
                                  <p className="text-11px text-gray-500 italic">No active deals</p>
                                ) : rd.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').sort((a, b) => b.mrr - a.mrr).map(d => {
                                  const advName = advisors.find(a => a.id === getDealAdvisorIds(d)[0])?.name || '?';
                                  return (
                                    <div key={d.id} className="flex items-center justify-between px-3 py-2 bg-white rounded border border-gray-100 cursor-pointer hover:border-[#157A6E]" onClick={(e) => { e.stopPropagation(); setSelectedDeal(d); }}>
                                      <div className="flex items-center gap-3">
                                        <DealHealthBadge health={d.health} />
                                        <div>
                                          <span className="text-11px font-semibold text-gray-800">{d.name}</span>
                                          <span className="text-[10px] text-gray-500 ml-2">{advName}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 text-11px">
                                        <span className="text-gray-600">{d.stage} · {d.daysInStage}d</span>
                                        <span className="text-gray-500">{d.probability}%</span>
                                        <span className="font-bold text-gray-800">{formatCurrency(d.mrr)}</span>
                                        {d.overrideRequested && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700">OVERRIDE</span>}
                                        {leaderInvolved.has(d.id) && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#f0faf8] text-[#157A6E]">MINE</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      );
                    })}
                    <tr className="bg-[#f0faf8] font-bold">
                      <td className="px-3 py-2">TOTAL</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(teamTarget)}</td>
                      <td className="px-2 py-2 text-right text-[#157A6E]">{formatCurrency(teamCommit)}</td>
                      <td className="px-2 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${commitPercentage >= 85 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{commitPercentage}%</span></td>
                      <td className="px-2 py-2 text-right">{formatCurrency(weighted)}</td>
                      <td className="px-2 py-2 text-center">{teamTarget > 0 ? (weighted / teamTarget).toFixed(1) : '0'}×</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(reps.reduce((s, r) => s + r.closedWon, 0))}</td>
                      <td className="px-2 py-2 text-center">{avgWinRate}%</td>
                      <td className="px-2 py-2 text-right text-red-600">-{formatCurrency(commitGap)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Overrides */}
            {pending.length > 0 && (
              <div className="bg-white rounded-[10px] border-2 border-amber-300 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Pending Override Requests</h3>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">{pending.length} pending</span>
                </div>
                <div className="space-y-3">
                  {pending.map(d => {
                    const advisorIds = getDealAdvisorIds(d);
                    const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || '?';
                    const rep = reps.find(r => r.id === d.repId);
                    return (
                      <div key={d.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-14px font-bold text-gray-800">{d.name}</p>
                            <p className="text-11px text-gray-600">{advisorName} · {rep?.name} · {d.stage} · {formatCurrency(d.mrr)}</p>
                            {d.overrideNote && <p className="text-11px text-amber-900 italic mt-2">&quot;{d.overrideNote}&quot;</p>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setOverrideActions(p => ({ ...p, [d.id]: 'approved' })); }} className="px-3 py-1.5 bg-green-600 text-white text-11px font-bold rounded hover:bg-green-700">Approve</button>
                            <button onClick={(e) => { e.stopPropagation(); setOverrideActions(p => ({ ...p, [d.id]: 'denied' })); }} className="px-3 py-1.5 bg-gray-200 text-gray-800 text-11px font-bold rounded hover:bg-gray-300">Deny</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PIPELINE BY STAGE */}
        {forecastSubTab === 'pipeline' && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Pipeline Funnel</h3>
            <div className="space-y-3">
              {stageData.map((s, i) => {
                const next = stageData[i + 1];
                const conv = next && s.count > 0 ? Math.round((next.count / s.count) * 100) : null;
                const colors: Record<string, string> = { Discovery: 'bg-blue-400', Qualifying: 'bg-blue-500', Proposal: 'bg-teal-500', Negotiating: 'bg-green-500', Stalled: 'bg-gray-400' };
                const stageWeight = STAGE_WEIGHTS.find(sw => sw.stage === s.stage)?.weight || 0;
                const expanded = expandedStage === s.stage;
                return (
                  <div key={s.stage}>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedStage(expanded ? null : s.stage)}>
                      <span className="w-24 text-12px font-medium text-gray-700 flex-shrink-0">{s.stage} <span className="text-[9px] text-gray-400">(×{stageWeight})</span></span>
                      <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden relative">
                        <div className={`h-full rounded-lg flex items-center pl-3 ${colors[s.stage]}`} style={{ width: `${Math.max((s.mrr / maxMRR) * 100, 10)}%` }}>
                          <span className="text-10px font-bold text-white">{formatCurrency(s.mrr)}</span>
                        </div>
                      </div>
                      <span className="w-16 text-11px text-gray-600 text-right">{s.count} deal{s.count !== 1 ? 's' : ''}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </div>
                    {conv !== null && s.stage !== 'Stalled' && <div className="ml-27 text-9px text-gray-500">↓ {conv}% conversion</div>}
                    {expanded && s.deals.length > 0 && (
                      <div className="ml-4 mt-2 space-y-1">
                        {s.deals.map(d => (
                          <div key={d.id} className="px-3 py-2 bg-gray-50 rounded text-11px cursor-pointer hover:bg-gray-100" onClick={() => setSelectedDeal(d)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <DealHealthBadge health={d.health} />
                                <span className="font-semibold text-gray-800">{d.name}</span>
                                {leaderInvolved.has(d.id) && <span className="text-8px bg-[#157A6E] text-white px-1.5 py-0.5 rounded-full font-bold">MINE</span>}
                              </div>
                              <span className="font-bold text-gray-800">{formatCurrency(d.mrr)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DEAL TABLE */}
        {forecastSubTab === 'deals' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 flex gap-3 flex-wrap">
              <select value={pipelineFilter.cm} onChange={(e) => setPipelineFilter(p => ({ ...p, cm: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-lg text-11px">
                <option value="">All CMs</option>
                {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select value={pipelineFilter.stage} onChange={(e) => setPipelineFilter(p => ({ ...p, stage: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-lg text-11px">
                <option value="">All Stages</option>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={pipelineFilter.health} onChange={(e) => setPipelineFilter(p => ({ ...p, health: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-lg text-11px">
                <option value="">All Health</option>
                {['Healthy', 'Monitor', 'At Risk', 'Stalled', 'Critical'].map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-11px">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Deal</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Partner</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">CM</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Stage</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Health</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">MRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.sort((a, b) => b.mrr - a.mrr).map(d => {
                      const advisorIds = getDealAdvisorIds(d);
                      const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || '?';
                      const rep = reps.find(r => r.id === d.repId);
                      return (
                        <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDeal(d)}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{d.name}</span>
                              {leaderInvolved.has(d.id) && <span className="text-8px bg-[#157A6E] text-white px-1.5 py-0.5 rounded-full font-bold">MINE</span>}
                              {d.overrideRequested && <span className="text-8px bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">OVERRIDE</span>}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-gray-700">{advisorName}</td>
                          <td className="px-2 py-2 text-gray-600">{rep?.name}</td>
                          <td className="px-2 py-2"><span className="text-gray-800">{d.stage}</span> <span className="text-gray-500">{d.daysInStage}d</span></td>
                          <td className="px-2 py-2"><DealHealthBadge health={d.health} /></td>
                          <td className="px-2 py-2 text-right font-bold text-gray-800">{formatCurrency(d.mrr)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CLOSED-LOST */}
        {forecastSubTab === 'lost' && Object.keys(lostReasonCounts).length === 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-8 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-13px font-semibold text-gray-600">No closed-lost deals</p>
            <p className="text-11px text-gray-400 mt-1">No deals have been marked as lost this quarter.</p>
          </div>
        )}
        {forecastSubTab === 'lost' && Object.keys(lostReasonCounts).length > 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Closed-Lost Analysis</h3>
            <div className="space-y-2">
              {Object.entries(lostReasonCounts).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-12px font-semibold text-gray-700 capitalize">{reason.replace(/-/g, ' ')}</span>
                  <span className="text-12px font-bold text-red-600">{count} deals</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PUSH HISTORY */}
        {forecastSubTab === 'push' && pushyDeals.length === 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-8 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-13px font-semibold text-gray-600">No push history</p>
            <p className="text-11px text-gray-400 mt-1">No deals have been pushed this quarter.</p>
          </div>
        )}
        {forecastSubTab === 'push' && pushyDeals.length > 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Push History</h3>
            <div className="space-y-2">
              {pushyDeals.slice(0, 10).map(d => (
                <div key={d.id} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => setSelectedDeal(d)}>
                  <div className="flex items-center justify-between">
                    <span className="text-12px font-semibold text-gray-800">{d.name}</span>
                    <span className="text-11px font-bold text-amber-600">{d.pushHistory?.length || 0} pushes</span>
                  </div>
                  {d.pushHistory && d.pushHistory.length > 0 && <p className="text-10px text-gray-500 mt-1">Latest: {d.pushHistory[d.pushHistory.length - 1].toPeriod}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════ VIEW 2: TEAM & ACCOUNTABILITY ═══════════════════
  const renderTeamAccountability = () => {
    const highFriction = advisors.filter(a => a.friction === 'High' || a.friction === 'Critical');
    const avgFrictionScore = advisors.length > 0 ? Math.round(advisors.reduce((s, a) => {
      const scores: Record<string, number> = { Low: 100, Moderate: 65, High: 30, Critical: 10 };
      return s + (scores[a.friction] || 50);
    }, 0) / advisors.length) : 0;
    const frictionLevels = [
      { level: 'Critical', advisors: advisors.filter(a => a.friction === 'Critical'), color: 'bg-red-600' },
      { level: 'High', advisors: advisors.filter(a => a.friction === 'High'), color: 'bg-red-500' },
      { level: 'Moderate', advisors: advisors.filter(a => a.friction === 'Moderate'), color: 'bg-amber-400' },
      { level: 'Low', advisors: advisors.filter(a => a.friction === 'Low'), color: 'bg-green-500' },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">Team & Accountability</h1>
          <p className="text-12px text-gray-500 mt-1">Channel manager performance, cadence compliance, supplier friction, and coaching flags</p>
        </div>

        <div className="flex gap-0 border-b border-[#e8e5e1]">
          {([
            { id: 'overview' as const, label: 'Team Overview' },
            { id: 'cadence' as const, label: 'Cadence Compliance' },
            { id: 'friction' as const, label: 'Supplier Friction' },
            { id: 'coaching' as const, label: 'Coaching Flags' },
            { id: 'benchmarks' as const, label: 'Benchmarks' },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setTeamSubTab(tab.id)}
              className={`px-4 py-2.5 text-12px font-medium border-b-2 transition-colors ${teamSubTab === tab.id ? 'text-[#157A6E] border-[#157A6E] font-semibold' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Team Size" value={`${reps.length}`} change="Active CMs" changeType="neutral" />
          <KPICard label="Avg Win Rate" value={`${avgWinRate}%`} change="Target: 35%" changeType={avgWinRate >= 35 ? "positive" : "negative"} />
          <KPICard label="Friction Score" value={`${avgFrictionScore}/100`} change={avgFrictionScore >= 70 ? 'Healthy' : 'Needs attention'} changeType={avgFrictionScore >= 70 ? "positive" : "negative"} />
          <KPICard label="High-Friction Partners" value={`${highFriction.length}`} change={`${formatCurrency(highFriction.reduce((s, a) => s + a.mrr, 0))} MRR at risk`} changeType={highFriction.length === 0 ? "positive" : "negative"} />
        </div>

        {/* TEAM OVERVIEW */}
        {teamSubTab === 'overview' && (
          <div className="grid grid-cols-2 gap-4">
            {reps.map(rep => {
              const repAdvisors = getRepAdvisors(rep);
              const rhf = repAdvisors.filter(a => a.friction === 'High' || a.friction === 'Critical');
              const cadenceCompliance = getRepCadence(rep.id).overall;
              const util = rep.partnerCapacity > 0 ? Math.round((rep.partnerCount / rep.partnerCapacity) * 100) : 0;
              const isAttention = rep.engagementScore === 'Fading' || rep.winRate < avgWinRate - 10;
              const cp = rep.quotaTarget > 0 ? Math.round((rep.currentCommit / rep.quotaTarget) * 100) : 0;
              const expanded = teamExpandedCM === rep.id;

              return (
                <div key={rep.id} className={`bg-white rounded-[10px] border-2 p-4 cursor-pointer transition-all ${isAttention ? 'border-red-300' : 'border-[#e8e5e1]'} hover:shadow-md`} onClick={() => setTeamExpandedCM(expanded ? null : rep.id)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#157A6E] flex items-center justify-center text-white text-[13px] font-semibold font-['Newsreader']">
                      {rep.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-14px font-bold text-gray-800">{rep.name}</span>
                        <EngLabel score={rep.engagementScore} />
                        {isAttention && <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">NEEDS ATTENTION</span>}
                      </div>
                      <p className="text-11px text-gray-500">{rep.title} · {rep.territories?.[0] || 'Unassigned'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-center mb-3">
                    <div><p className="text-[10px] text-gray-500">Partners</p><p className="text-[16px] font-bold text-[#157A6E]">{rep.partnerCount}</p></div>
                    <div><p className="text-[10px] text-gray-500">MRR</p><p className="text-[16px] font-bold">{formatCurrency(rep.managedMRR)}</p></div>
                    <div><p className="text-[10px] text-gray-500">Win Rate</p><p className="text-[16px] font-bold" style={{ color: rep.winRate >= avgWinRate ? '#157A6E' : '#ef4444' }}>{rep.winRate}%</p></div>
                    <div><p className="text-[10px] text-gray-500">Commit</p><p className="text-[16px] font-bold" style={{ color: cp >= 85 ? '#157A6E' : cp >= 60 ? '#f59e0b' : '#ef4444' }}>{cp}%</p></div>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-500">Cadence Compliance</span>
                      <span className="font-semibold" style={{ color: cadenceCompliance >= 80 ? '#157A6E' : cadenceCompliance >= 65 ? '#f59e0b' : '#ef4444' }}>{cadenceCompliance}%</span>
                    </div>
                    <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cadenceCompliance >= 80 ? 'bg-[#157A6E]' : cadenceCompliance >= 65 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${cadenceCompliance}%` }} />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {rhf.length > 0 && <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">{rhf.length} High-Friction</span>}
                    {launchedPlaybooks.filter(p => { const repAdv = repAdvisors.find(a => a.id === p.advisorId); return !!repAdv; }).length > 0 && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#f0faf8] text-[#157A6E] font-semibold">{launchedPlaybooks.filter(p => repAdvisors.some(a => a.id === p.advisorId)).length} Active Playbooks</span>
                    )}
                  </div>

                  {expanded && (
                    <div className="border-t border-gray-200 mt-3 pt-3 space-y-2 text-11px">
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="font-semibold text-gray-800">Activity (30d)</p>
                        <p className="text-gray-600">Meetings: {getRepActivity(rep.id).meetings}, Calls: {getRepActivity(rep.id).calls}, Emails: {getRepActivity(rep.id).emails}</p>
                      </div>
                      {rhf.length > 0 && (
                        <div className="p-2 bg-red-50 rounded">
                          <p className="font-semibold text-gray-800">High-Friction Partners</p>
                          {rhf.map(a => <p key={a.id} className="text-gray-600">{a.name} · {a.company} · <FrictionBadge level={a.friction} /></p>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SUPPLIER FRICTION */}
        {teamSubTab === 'friction' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-3">Friction Distribution</h3>
              <div className="flex h-7 rounded-lg overflow-hidden mb-3">
                {frictionLevels.filter(f => f.advisors.length > 0).map(f => (
                  <div key={f.level} className={`${f.color} flex items-center justify-center`} style={{ width: `${(f.advisors.length / advisors.length) * 100}%` }}>
                    <span className="text-10px font-bold text-white">{f.advisors.length}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 flex-wrap">
                {frictionLevels.filter(f => f.advisors.length > 0).map(f => (
                  <div key={f.level} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-sm ${f.color}`} />
                    <span className="text-11px text-gray-600">{f.level}: {f.advisors.length} ({formatCurrency(f.advisors.reduce((s, a) => s + a.mrr, 0))})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Friction by CM</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-11px">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">CM</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Total</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Low</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Moderate</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">High</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Critical</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reps.map(rep => {
                      const repAdvisors = getRepAdvisors(rep);
                      return (
                        <tr key={rep.id} className="border-b border-gray-100">
                          <td className="px-3 py-2 font-semibold text-gray-800">{rep.name}</td>
                          <td className="px-2 py-2 text-center">{repAdvisors.length}</td>
                          <td className="px-2 py-2 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">{repAdvisors.filter(a => a.friction === 'Low').length}</span></td>
                          <td className="px-2 py-2 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">{repAdvisors.filter(a => a.friction === 'Moderate').length}</span></td>
                          <td className="px-2 py-2 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">{repAdvisors.filter(a => a.friction === 'High').length}</span></td>
                          <td className="px-2 py-2 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">{repAdvisors.filter(a => a.friction === 'Critical').length}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {ratings && (
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">The Channel Standard Ratings</h3>
                  <a href="https://www.the-channel-standard.com" target="_blank" rel="noopener noreferrer" className="text-[#157A6E] text-11px font-semibold hover:underline">View Full →</a>
                </div>
                <SupplierAccountabilityCard data={ratings} loading={false} />
              </div>
            )}
          </div>
        )}

        {/* CADENCE COMPLIANCE */}
        {teamSubTab === 'cadence' && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Cadence Compliance by CM</h3>
              <p className="text-[10px] text-gray-400">Click any value to edit</p>
            </div>
            <div className="space-y-4">
              {reps.map(rep => {
                const cd = getRepCadence(rep.id);
                const ok = cd.overall >= alertThresholds.cadenceComplianceThreshold;
                const updateCadence = (field: string, value: number) => {
                  setRepCadenceData(prev => ({ ...prev, [rep.id]: { ...cd, [field]: Math.max(0, Math.min(100, value)) } }));
                };
                return (
                  <div key={rep.id} className={`p-4 rounded-lg border ${ok ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-13px font-bold text-gray-800">{rep.name}</span>
                        {!ok && <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">BELOW THRESHOLD</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <input type="number" value={cd.overall} onChange={e => updateCadence('overall', parseInt(e.target.value) || 0)} className={`w-12 text-right text-14px font-bold bg-transparent border-b border-dashed border-gray-300 focus:border-[#157A6E] focus:outline-none ${ok ? 'text-[#157A6E]' : 'text-red-600'}`} />
                        <span className={`text-14px font-bold ${ok ? 'text-[#157A6E]' : 'text-red-600'}`}>%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${ok ? 'bg-[#157A6E]' : 'bg-red-500'}`} style={{ width: `${cd.overall}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
                      {(['anchor', 'scaling', 'building', 'launching'] as const).map(tier => (
                        <span key={tier} className="flex items-center gap-0.5 capitalize">
                          {tier}: <input type="number" value={cd[tier]} onChange={e => updateCadence(tier, parseInt(e.target.value) || 0)} className="w-8 text-center bg-transparent border-b border-dashed border-gray-300 focus:border-[#157A6E] focus:outline-none text-[10px]" />%
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COACHING FLAGS */}
        {teamSubTab === 'coaching' && (
          <div className="space-y-4">
            {reps.map(rep => {
              const repAdvisors = getRepAdvisors(rep);
              const staleAnchors = repAdvisors.filter(a => a.tier === 'anchor' && (a.pulse === 'Fading' || a.pulse === 'Flatline'));
              const stalledDeals = allDeals.filter(d => d.repId === rep.id && (d.stage === 'Stalled' || d.daysInStage > 25));
              const flags: string[] = [];
              if (rep.winRate < avgWinRate - 10) flags.push(`Win rate ${rep.winRate}% — ${avgWinRate - rep.winRate}pts below team avg`);
              if (rep.avgCycle > avgCycle + 10) flags.push(`Avg cycle ${rep.avgCycle}d — ${rep.avgCycle - avgCycle}d slower than team`);
              if (staleAnchors.length > 0) flags.push(`${staleAnchors.length} anchor partner${staleAnchors.length > 1 ? 's' : ''} going cold`);
              if (stalledDeals.length > 0) flags.push(`${stalledDeals.length} deal${stalledDeals.length > 1 ? 's' : ''} stalled or aging`);
              if (flags.length === 0) return null;
              return (
                <div key={rep.id} className="bg-white rounded-[10px] border border-amber-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-14px font-bold text-gray-800">{rep.name}</span>
                    <EngLabel score={rep.engagementScore} />
                    <span className="text-11px text-amber-600 font-semibold">{flags.length} coaching flags</span>
                  </div>
                  <div className="space-y-2">
                    {flags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-12px text-gray-700 p-2 bg-amber-50 rounded">
                        <span className="text-amber-500 flex-shrink-0 mt-0.5">⚠</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BENCHMARKS */}
        {teamSubTab === 'benchmarks' && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Team Benchmarks</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-11px">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Metric</th>
                    {reps.map(r => <th key={r.id} className="text-center px-2 py-2 font-semibold text-gray-700">{r.name.split(' ')[0]}</th>)}
                    <th className="text-center px-2 py-2 font-semibold text-[#157A6E]">Team Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Win Rate', fn: (r: Rep) => `${r.winRate}%`, avg: `${avgWinRate}%` },
                    { label: 'Avg Cycle', fn: (r: Rep) => `${r.avgCycle}d`, avg: `${avgCycle}d` },
                    { label: 'Managed MRR', fn: (r: Rep) => formatCurrency(r.managedMRR), avg: formatCurrency(teamMRR / reps.length) },
                    { label: 'Partners', fn: (r: Rep) => `${r.partnerCount}`, avg: `${Math.round(reps.reduce((s, r) => s + r.partnerCount, 0) / reps.length)}` },
                    { label: 'Commit %', fn: (r: Rep) => `${r.quotaTarget > 0 ? Math.round((r.currentCommit / r.quotaTarget) * 100) : 0}%`, avg: `${commitPercentage}%` },
                  ].map(metric => (
                    <tr key={metric.label} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-semibold text-gray-700">{metric.label}</td>
                      {reps.map(r => <td key={r.id} className="px-2 py-2 text-center text-gray-800">{metric.fn(r)}</td>)}
                      <td className="px-2 py-2 text-center font-bold text-[#157A6E]">{metric.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════ VIEW 3: RELATIONSHIPS ═══════════════════
  const renderRelationships = () => {
    // If advisor selected, show detail
    if (relationshipsView === 'detail' && selectedAdvisor) {
      const advDeals = allDeals.filter(d => getDealAdvisorIds(d).includes(selectedAdvisor.id));
      return (
        <div className="space-y-4">
          <button onClick={() => { setRelationshipsView('list'); setSelectedAdvisor(null); }} className="flex items-center gap-1 text-12px text-[#157A6E] font-semibold hover:underline">
            <ArrowLeft className="w-3 h-3" /> Back to list
          </button>
          <AdvisorPanel advisor={selectedAdvisor} deals={advDeals} isOpen={true} onClose={() => { setRelationshipsView('list'); setSelectedAdvisor(null); }} onUpdateAdvisor={updateAdvisorField} />
        </div>
      );
    }

    // Filter logic
    let filtered = [...advisors];
    if (relationshipFilter === 'Anchor') filtered = filtered.filter(a => a.tier === 'anchor');
    else if (relationshipFilter === 'Scaling') filtered = filtered.filter(a => a.tier === 'scaling');
    else if (relationshipFilter === 'Building') filtered = filtered.filter(a => a.tier === 'building');
    else if (relationshipFilter === 'Launching') filtered = filtered.filter(a => a.tier === 'launching');
    else if (relationshipFilter === 'Needs Attention') filtered = filtered.filter(a => a.friction === 'High' || a.friction === 'Critical' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall');
    else if (relationshipFilter === 'Unassigned') filtered = unassignedPartners;

    if (relationshipOwnerFilter) {
      if (relationshipOwnerFilter === 'unassigned') {
        filtered = filtered.filter(a => unassignedPartners.some(u => u.id === a.id));
      } else {
        const rep = reps.find(r => r.id === relationshipOwnerFilter);
        if (rep) {
          const repDealAdvisorIds = new Set(allDeals.filter(d => d.repId === rep.id).flatMap(d => getDealAdvisorIds(d)));
          filtered = filtered.filter(a => repDealAdvisorIds.has(a.id));
        }
      }
    }

    if (relationshipStageFilter !== 'All') {
      filtered = filtered.filter(a => a.relationshipStage === relationshipStageFilter);
    }

    if (partnerSearch.trim()) {
      const q = partnerSearch.toLowerCase();
      filtered = filtered.filter(a => a.name.toLowerCase().includes(q) || a.company.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q));
    }

    if (myOnlyPartners) filtered = filtered.filter(a => leaderOwned.has(a.id));

    const sortedAdvisors = [...filtered].sort((a, b) => {
      if (relationshipSort === 'mrr') return b.mrr - a.mrr;
      if (relationshipSort === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    const stageDistribution = {
      Prospect: advisors.filter(a => a.relationshipStage === 'Prospect').length,
      Onboarding: advisors.filter(a => a.relationshipStage === 'Onboarding').length,
      Activated: advisors.filter(a => a.relationshipStage === 'Activated').length,
      Scaling: advisors.filter(a => a.relationshipStage === 'Scaling').length,
      Strategic: advisors.filter(a => a.relationshipStage === 'Strategic').length,
    };

    // Find CM owner for each advisor
    const getOwner = (advisorId: string): string => {
      for (const rep of reps) {
        const repDeals = allDeals.filter(d => d.repId === rep.id);
        if (repDeals.some(d => getDealAdvisorIds(d).includes(advisorId))) return rep.name;
      }
      return '';
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">Relationships</h1>
          <p className="text-12px text-gray-500 mt-1">Manage all partner, TSD, and team relationships — filter by owner, stage, and assignment status</p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex gap-2 border-b border-[#e8e5e1] pb-3">
          {[
            { key: 'partners', label: '👥 Partners', count: advisors.length },
            { key: 'tsds', label: '🏢 TSDs', count: null },
            { key: 'all', label: '📋 All Contacts', count: null },
            { key: 'groups', label: '🏷️ Groups', count: null },
          ].map(tab => (
            <button key={tab.key} onClick={() => setRelationshipViewMode(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-12px font-medium transition-colors ${relationshipViewMode === tab.key ? 'bg-[#157A6E] text-white' : 'bg-white border border-[#e8e5e1] text-gray-700 hover:bg-gray-50'}`}>
              {tab.label}{tab.count !== null ? ` (${tab.count})` : ''}
            </button>
          ))}
        </div>

        {/* Unassigned banner */}
        {unassignedPartners.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-[10px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center text-white text-[18px] flex-shrink-0">⚠</div>
            <div className="flex-1">
              <p className="text-13px font-semibold text-amber-900">{unassignedPartners.length} Unassigned Relationships</p>
              <p className="text-11px text-amber-800">Partners without an assigned CM. Combined MRR: {formatCurrency(unassignedPartners.reduce((s, a) => s + a.mrr, 0))}.</p>
            </div>
            <button onClick={() => setRelationshipFilter('Unassigned')} className="px-3 py-1.5 bg-amber-500 text-white border-none rounded-lg text-11px font-semibold hover:bg-amber-600">Assign Now →</button>
          </div>
        )}

        {/* Partners view */}
        {relationshipViewMode === 'partners' && (
          <>
            {/* Map */}
            {showFullUSA && (
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-13px font-semibold text-gray-800">Partner Performance Heat Map</p>
                    <p className="text-[10px] text-gray-500">Click states for details</p>
                  </div>
                  <div className="flex bg-[#f5f5f5] rounded-lg p-1 gap-1">
                    <button onClick={() => setMyOnlyPartners(false)} className={`px-3 py-1 rounded-md text-11px font-medium transition-all ${!myOnlyPartners ? 'bg-white text-[#157A6E] shadow-sm' : 'text-gray-500'}`}>All Team</button>
                    <button onClick={() => setMyOnlyPartners(true)} className={`px-3 py-1 rounded-md text-11px font-medium transition-all ${myOnlyPartners ? 'bg-white text-[#157A6E] shadow-sm' : 'text-gray-500'}`}>My Partners</button>
                  </div>
                </div>
                <USAMap
                  advisorsByCity={{}}
                  onCityClick={() => {}}
                  selectedCity={null}
                  regionStates={territoryRegion && US_REGIONS[territoryRegion] ? US_REGIONS[territoryRegion].states : []}
                  exceptionStates={territoryExceptions}
                  showRegionToggle={true}
                  onRegionToggle={(showFull) => setShowFullUSA(showFull)}
                  activeRegion={territoryRegion}
                  showFullUSA={showFullUSA}
                />
              </div>
            )}

            {/* Toolbar */}
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={partnerSearch} onChange={(e) => setPartnerSearch(e.target.value)} placeholder="Search partners or companies..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-full text-12px font-['Inter'] focus:outline-none focus:border-[#157A6E]" />
              </div>
              <select value={relationshipOwnerFilter} onChange={e => setRelationshipOwnerFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-11px">
                <option value="">All Owners</option>
                {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                <option value="unassigned">⚠ Unassigned</option>
              </select>
              <select value={relationshipFilter} onChange={e => setRelationshipFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-11px">
                <option value="All">All Tiers</option>
                <option value="Anchor">Anchor</option>
                <option value="Scaling">Scaling</option>
                <option value="Building">Building</option>
                <option value="Launching">Launching</option>
              </select>
              <select value={relationshipStageFilter} onChange={e => setRelationshipStageFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-11px">
                <option value="All">All Stages</option>
                <option value="Strategic">Strategic</option>
                <option value="Scaling">Scaling</option>
                <option value="Activated">Activated</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Prospect">Prospect</option>
              </select>
              <select value={relationshipSort} onChange={e => setRelationshipSort(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-lg text-11px">
                <option value="mrr">Sort: MRR ↓</option>
                <option value="name">Sort: Name A-Z</option>
              </select>
            </div>

            {/* Segment pills */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: `All Partners (${advisors.length})`, key: 'All' },
                { label: `Needs Attention (${advisors.filter(a => a.friction === 'High' || a.friction === 'Critical' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall').length})`, key: 'Needs Attention' },
                { label: `Anchor (${advisors.filter(a => a.tier === 'anchor').length})`, key: 'Anchor' },
                { label: `Scaling (${advisors.filter(a => a.tier === 'scaling').length})`, key: 'Scaling' },
                { label: `Building (${advisors.filter(a => a.tier === 'building').length})`, key: 'Building' },
                { label: `Launching (${advisors.filter(a => a.tier === 'launching').length})`, key: 'Launching' },
              ].map(seg => (
                <button key={seg.key} onClick={() => setRelationshipFilter(seg.key)}
                  className={`px-3 py-1.5 rounded-full text-11px font-medium border transition-colors ${relationshipFilter === seg.key ? 'bg-[#157A6E] text-white border-[#157A6E]' : 'bg-white text-gray-600 border-[#e8e5e1] hover:border-[#157A6E]'}`}>
                  {seg.label}
                </button>
              ))}
              {unassignedPartners.length > 0 && (
                <button onClick={() => setRelationshipFilter('Unassigned')}
                  className={`px-3 py-1.5 rounded-full text-11px font-medium border transition-colors ${relationshipFilter === 'Unassigned' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-600 border-amber-300 hover:border-amber-500'}`}>
                  ⚠ Unassigned ({unassignedPartners.length})
                </button>
              )}
            </div>

            {/* Partner Table */}
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-11px">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Partner</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Company</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Owner (CM)</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Tier</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Stage</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">MRR</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Pulse</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Trajectory</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Friction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAdvisors.map(a => {
                      const owner = getOwner(a.id);
                      const isUnassigned = unassignedPartners.some(u => u.id === a.id);
                      return (
                        <tr key={a.id} className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isUnassigned ? 'bg-amber-50' : ''}`} onClick={() => { setSelectedAdvisor(a); setRelationshipsView('detail'); }}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#157A6E] flex items-center justify-center text-white text-[10px] font-semibold font-['Newsreader'] flex-shrink-0">
                                {a.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-semibold text-gray-800">{a.name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-gray-700">{a.company}</td>
                          <td className="px-2 py-2">
                            {isUnassigned ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800">⚠ Unassigned</span>
                            ) : (
                              <span className="text-gray-600">{owner}</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center"><TierBadge tier={a.tier} /></td>
                          <td className="px-2 py-2 text-gray-700">{a.relationshipStage || '—'}</td>
                          <td className="px-2 py-2 text-right font-bold text-gray-800">{formatCurrency(a.mrr)}</td>
                          <td className="px-2 py-2 text-center"><PulseBadge pulse={a.pulse} /></td>
                          <td className="px-2 py-2 text-center"><TrajectoryBadge trajectory={a.trajectory} /></td>
                          <td className="px-2 py-2 text-center"><FrictionBadge level={a.friction} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-center pt-3 text-11px text-gray-500">
                Showing {sortedAdvisors.length} of {advisors.length} partners
              </div>
            </div>

            {/* Stage Distribution */}
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Relationship Stage Distribution</h3>
              <div className="flex h-7 rounded-lg overflow-hidden mb-3">
                {Object.entries(stageDistribution).map(([stage, count]) => {
                  if (count === 0) return null;
                  const colors: Record<string, string> = { Prospect: '#9ca3af', Onboarding: '#f59e0b', Activated: '#3b82f6', Scaling: '#157A6E', Strategic: '#0f5550' };
                  return <div key={stage} style={{ width: `${(count / advisors.length) * 100}%`, background: colors[stage] }} title={`${stage}: ${count}`} />;
                })}
              </div>
              <div className="flex gap-4 flex-wrap text-10px">
                {Object.entries(stageDistribution).filter(([, c]) => c > 0).map(([stage, count]) => {
                  const colors: Record<string, string> = { Prospect: '#9ca3af', Onboarding: '#f59e0b', Activated: '#3b82f6', Scaling: '#157A6E', Strategic: '#0f5550' };
                  return (
                    <span key={stage} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm" style={{ background: colors[stage] }} />
                      {stage} ({count})
                    </span>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* TSDs view */}
        {relationshipViewMode === 'tsds' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Technology Solutions Distributors</h3>
              <p className="text-12px text-gray-500 mb-4">TSD company relationships and intro tracking across the team</p>
              <div className="overflow-x-auto">
                <table className="w-full text-11px">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">TSD Company</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Partners</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">Revenue Attributed</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Intros (QTD)</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Telarus', 'Avant', 'Sandler Partners', 'Intelisys', 'AppDirect'].map((tsd, i) => {
                      const partnerCount = Math.floor(seededRandom(tsd + 'pc', 3, 15));
                      const revenue = Math.floor(seededRandom(tsd + 'rev', 50000, 500000));
                      const intros = Math.floor(seededRandom(tsd + 'intros', 2, 20));
                      const healthPct = Math.floor(seededRandom(tsd + 'health', 50, 95));
                      const healthColor = healthPct >= 80 ? 'text-[#157A6E]' : healthPct >= 60 ? 'text-amber-600' : 'text-red-600';
                      const healthLabel = healthPct >= 80 ? 'Strong' : healthPct >= 60 ? 'Steady' : 'Needs Attention';
                      return (
                        <tr key={tsd} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#157A6E]" />
                              <span className="font-semibold text-gray-800">{tsd}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">{partnerCount}</td>
                          <td className="px-2 py-2 text-right font-bold text-gray-800">{formatCurrency(revenue)}</td>
                          <td className="px-2 py-2 text-center">{intros}</td>
                          <td className={`px-2 py-2 text-center font-semibold ${healthColor}`}>{healthLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* All Contacts view */}
        {relationshipViewMode === 'all' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">All Team Contacts</h3>
              <p className="text-12px text-gray-500 mb-4">Unified view of all partner contacts, TSD contacts, and team relationships</p>
              <div className="overflow-x-auto">
                <table className="w-full text-11px">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Contact</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Company</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Type</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Owner (CM)</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">MRR</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisors.sort((a, b) => b.mrr - a.mrr).map(a => {
                      const owner = (() => { for (const rep of reps) { const rd = allDeals.filter(d => d.repId === rep.id); if (rd.some(d => getDealAdvisorIds(d).includes(a.id))) return rep.name; } return ''; })();
                      const isUnassigned = unassignedPartners.some(u => u.id === a.id);
                      return (
                        <tr key={a.id} className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isUnassigned ? 'bg-amber-50' : ''}`} onClick={() => { setSelectedAdvisor(a); setRelationshipsView('detail'); }}>
                          <td className="px-3 py-2 font-semibold text-gray-800">{a.name}</td>
                          <td className="px-2 py-2 text-gray-700">{a.company}</td>
                          <td className="px-2 py-2"><span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-800">Partner</span></td>
                          <td className="px-2 py-2">{isUnassigned ? <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800">Unassigned</span> : <span className="text-gray-600">{owner}</span>}</td>
                          <td className="px-2 py-2 text-right font-bold text-gray-800">{formatCurrency(a.mrr)}</td>
                          <td className="px-2 py-2 text-center"><PulseBadge pulse={a.pulse} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-center pt-3 text-11px text-gray-500">
                Showing {advisors.length} contacts
              </div>
            </div>
          </div>
        )}

        {/* Groups view */}
        {relationshipViewMode === 'groups' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Partner Groups</h3>
              <p className="text-12px text-gray-500 mb-4">Partners grouped by tier, relationship stage, and territory</p>
              <div className="grid grid-cols-3 gap-4">
                {/* By Tier */}
                <div className="border border-[#e8e5e1] rounded-lg p-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">By Tier</h4>
                  {(['anchor', 'scaling', 'building', 'launching'] as const).map(tier => {
                    const count = advisors.filter(a => a.tier === tier).length;
                    const mrr = advisors.filter(a => a.tier === tier).reduce((s, a) => s + a.mrr, 0);
                    return (
                      <div key={tier} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded px-2" onClick={() => { setRelationshipViewMode('partners'); setRelationshipFilter(tier.charAt(0).toUpperCase() + tier.slice(1)); }}>
                        <div className="flex items-center gap-2">
                          <TierBadge tier={tier} />
                          <span className="text-11px text-gray-500">{count}</span>
                        </div>
                        <span className="text-11px font-bold text-gray-700">{formatCurrency(mrr)}</span>
                      </div>
                    );
                  })}
                </div>
                {/* By Stage */}
                <div className="border border-[#e8e5e1] rounded-lg p-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">By Stage</h4>
                  {['Strategic', 'Scaling', 'Activated', 'Onboarding', 'Prospect'].map(stage => {
                    const count = advisors.filter(a => a.relationshipStage === stage).length;
                    const mrr = advisors.filter(a => a.relationshipStage === stage).reduce((s, a) => s + a.mrr, 0);
                    return (
                      <div key={stage} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded px-2" onClick={() => { setRelationshipViewMode('partners'); setRelationshipStageFilter(stage); }}>
                        <span className="text-12px font-medium text-gray-700">{stage}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-11px text-gray-500">{count}</span>
                          <span className="text-11px font-bold text-gray-700">{formatCurrency(mrr)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* By CM */}
                <div className="border border-[#e8e5e1] rounded-lg p-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">By Channel Manager</h4>
                  {reps.map(rep => {
                    const repAdvisorIds = new Set(allDeals.filter(d => d.repId === rep.id).flatMap(d => getDealAdvisorIds(d)));
                    const count = advisors.filter(a => repAdvisorIds.has(a.id)).length;
                    const mrr = advisors.filter(a => repAdvisorIds.has(a.id)).reduce((s, a) => s + a.mrr, 0);
                    return (
                      <div key={rep.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded px-2" onClick={() => { setRelationshipViewMode('partners'); setRelationshipOwnerFilter(rep.id); }}>
                        <span className="text-12px font-medium text-gray-700">{rep.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-11px text-gray-500">{count}</span>
                          <span className="text-11px font-bold text-gray-700">{formatCurrency(mrr)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {unassignedPartners.length > 0 && (
                    <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-amber-50 rounded px-2" onClick={() => { setRelationshipViewMode('partners'); setRelationshipFilter('Unassigned'); }}>
                      <span className="text-12px font-medium text-amber-700">⚠ Unassigned</span>
                      <div className="flex items-center gap-2">
                        <span className="text-11px text-amber-600">{unassignedPartners.length}</span>
                        <span className="text-11px font-bold text-amber-700">{formatCurrency(unassignedPartners.reduce((s, a) => s + a.mrr, 0))}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════ VIEW 4: INTELLIGENCE ═══════════════════
  const renderIntelligence = () => {
    const churnSignals = signals.filter(s => s.type === 'deal_at_risk' || s.type === 'partner_fading' || s.type === 'trajectory_freefall');
    const growthSignals = signals.filter(s => s.type === 'expansion');
    const stallSignals = signals.filter(s => s.type === 'override_pending');
    const intelSignals = signals.filter(s => s.type === 'expansion' || s.type === 'override_pending');
    const filteredSignals = signalFilter === 'all' ? signals : signalFilter === 'churn' ? churnSignals : signalFilter === 'growth' ? growthSignals : signalFilter === 'stall' ? stallSignals : signalFilter === 'intel' ? intelSignals : signals;

    const trajectories = {
      Accelerating: advisors.filter(a => a.trajectory === 'Accelerating'),
      Stable: advisors.filter(a => a.trajectory === 'Stable'),
      Slipping: advisors.filter(a => a.trajectory === 'Slipping'),
      Freefall: advisors.filter(a => a.trajectory === 'Freefall'),
    };

    // Recommended playbooks
    const winBackCandidates = advisors.filter(a => (a.pulse === 'Fading' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall') && !launchedPlaybooks.some(p => p.advisorId === a.id));
    const onboardingCandidates = advisors.filter(a => a.tier === 'launching' || (a.tier === 'building' && Math.floor((Date.now() - new Date(a.connectedSince).getTime()) / 86400000) < 90));
    const qbrCandidates = advisors.filter(a => a.tier === 'anchor' || a.tier === 'scaling');

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">Intelligence</h1>
          <p className="text-12px text-gray-500 mt-1">Signals, playbooks, diagnostics, and strategic resources for the full channel team</p>
        </div>

        <div className="flex gap-0 border-b border-[#e8e5e1]">
          {([
            { id: 'overview' as const, label: 'Overview' },
            { id: 'signals' as const, label: 'Signals', count: signals.length },
            { id: 'playbooks' as const, label: 'Playbooks', count: launchedPlaybooks.length },
            { id: 'diagnostics' as const, label: 'Diagnostics' },
            { id: 'resources' as const, label: 'Resources' },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setIntelligenceSubTab(tab.id)}
              className={`px-4 py-2.5 text-12px font-medium border-b-2 transition-colors ${intelligenceSubTab === tab.id ? 'text-[#157A6E] border-[#157A6E] font-semibold' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              {tab.label}
              {'count' in tab && tab.count !== undefined && <span className="ml-1.5 px-1.5 py-0.5 bg-[#F0FAF8] text-[#157A6E] text-[10px] font-bold rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Live Signals (7d)" value={`${signals.length}`} change="Today" changeType="neutral" />
          <KPICard label="Revenue at Risk" value={formatCurrency(atRiskMRR)} change={`${atRiskAdvisors.length} partners`} changeType={atRiskAdvisors.length > 0 ? "negative" : "neutral"} />
          <KPICard label="Expansion Signals" value={`${growthSignals.length}`} change="Cross-sell potential" changeType="positive" />
          <KPICard label="Active Playbooks" value={`${launchedPlaybooks.length}`} change="Across team" changeType="neutral" />
        </div>

        {/* OVERVIEW */}
        {intelligenceSubTab === 'overview' && (
          <div className="grid grid-cols-[2fr_1fr] gap-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Signal Feed</h3>
                <button onClick={() => setIntelligenceSubTab('signals')} className="text-[10px] text-[#157A6E] font-semibold">View all {signals.length} →</button>
              </div>
              {signals.slice(0, 5).map((sig, i) => {
                const dotColor = sig.severity === 'critical' ? 'bg-red-500' : sig.severity === 'high' ? 'bg-amber-500' : 'bg-[#157A6E]';
                return (
                  <div key={i} className="flex gap-3 py-3 border-b border-gray-50 last:border-b-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                    <div className="min-w-0">
                      <p className="text-12px font-semibold text-gray-800">{sig.text}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{sig.time} · {sig.repName}{sig.mrr ? ` · ${formatCurrency(sig.mrr)}` : ''}</p>
                      {sig.advisorName && (
                        <button onClick={() => { const a = advisors.find(x => x.name === sig.advisorName); if (a) { setPlaybookModalAdvisor(a); setPlaybookModalMode('template'); setShowPlaybookModal(true); } }} className="text-[10px] text-[#157A6E] font-semibold mt-1 hover:underline">→ Create Playbook</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Recommended Playbooks</h3>
              </div>
              <div className="space-y-3 text-11px">
                {winBackCandidates.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">Critical</span>
                      <span className="ml-2 font-semibold">Win-back ({winBackCandidates.length})</span>
                    </div>
                    <button onClick={() => { if (winBackCandidates[0]) { setPlaybookModalAdvisor(winBackCandidates[0]); setPlaybookModalMode('template'); setShowPlaybookModal(true); } }} className="text-[10px] text-[#157A6E] font-semibold">Launch →</button>
                  </div>
                )}
                {onboardingCandidates.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">High</span>
                      <span className="ml-2 font-semibold">Onboarding ({onboardingCandidates.length})</span>
                    </div>
                    <button onClick={() => { if (onboardingCandidates[0]) { setPlaybookModalAdvisor(onboardingCandidates[0]); setPlaybookModalMode('template'); setShowPlaybookModal(true); } }} className="text-[10px] text-[#157A6E] font-semibold">Launch →</button>
                  </div>
                )}
                {qbrCandidates.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-[#f0faf8] rounded-lg">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#f0faf8] text-[#157A6E]">Medium</span>
                      <span className="ml-2 font-semibold">QBR ({qbrCandidates.length})</span>
                    </div>
                    <button onClick={() => { if (qbrCandidates[0]) { setPlaybookModalAdvisor(qbrCandidates[0]); setPlaybookModalMode('template'); setShowPlaybookModal(true); } }} className="text-[10px] text-[#157A6E] font-semibold">Launch →</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SIGNALS */}
        {intelligenceSubTab === 'signals' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {[
                { key: 'all' as const, label: `All (${signals.length})` },
                { key: 'churn' as const, label: `🔴 Churn (${churnSignals.length})` },
                { key: 'growth' as const, label: `🟢 Growth (${growthSignals.length})` },
                { key: 'stall' as const, label: `🟡 Stall (${stallSignals.length})` },
                { key: 'intel' as const, label: `🔵 Intel (${intelSignals.length})` },
              ].map(f => (
                <button key={f.key} onClick={() => setSignalFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-11px font-medium border transition-colors ${signalFilter === f.key ? 'bg-[#157A6E] text-white border-[#157A6E]' : 'bg-white text-gray-600 border-[#e8e5e1]'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              {filteredSignals.map((sig, i) => {
                const bgColor = sig.severity === 'critical' ? 'bg-red-50 border-red-200' : sig.severity === 'high' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200';
                const dotColor = sig.severity === 'critical' ? 'bg-red-500' : sig.severity === 'high' ? 'bg-amber-500' : 'bg-blue-500';
                return (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border mb-2 ${bgColor}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                    <div className="flex-1">
                      <p className="text-13px font-semibold text-gray-800">{sig.text}</p>
                      <div className="flex gap-3 mt-1 text-10px">
                        <span className="text-gray-600">{sig.repName}</span>
                        {sig.mrr && <span className="font-bold text-gray-800">{formatCurrency(sig.mrr)}</span>}
                        <span className="text-gray-400">{sig.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PLAYBOOKS */}
        {intelligenceSubTab === 'playbooks' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setPlaybookModalAdvisor(null); setPlaybookModalMode('template'); setShowPlaybookModal(true); }} className="px-4 py-2 text-11px font-semibold text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> New Playbook
              </button>
            </div>
            {launchedPlaybooks.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {launchedPlaybooks.map((pb, idx) => {
                  const tmpl = playbookTemplates.find(t => t.id === pb.templateId);
                  const steps = pb.customSteps || tmpl?.steps || [];
                  const effective = steps.length - pb.skippedSteps.length;
                  const pct = effective > 0 ? Math.round((pb.completedSteps.length / effective) * 100) : 100;
                  const nextStepIdx = steps.findIndex((_, si) => !pb.completedSteps.includes(si) && !pb.skippedSteps.includes(si));
                  const nextStep = nextStepIdx >= 0 ? steps[nextStepIdx] : null;
                  return (
                    <div key={idx} className={`bg-white rounded-[10px] border border-[#e8e5e1] p-4 border-l-4 ${tmpl?.borderColor || 'border-l-[#157A6E]'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-13px font-semibold text-gray-800">{pb.playbookName || tmpl?.title || pb.templateId.replace('-', ' ')}</p>
                          <p className="text-[10px] text-gray-500">{pb.advisorName} · Started {new Date(pb.launchedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${pb.priority === 'critical' ? 'bg-red-100 text-red-700' : pb.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{pb.priority}</span>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span>Progress</span>
                          <span className="font-bold text-[#157A6E]">{pct}% ({pb.completedSteps.length}/{effective})</span>
                        </div>
                        <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1 text-11px mb-3">
                        {steps.map((step, si) => {
                          const done = pb.completedSteps.includes(si);
                          const skipped = pb.skippedSteps.includes(si);
                          return (
                            <div key={si} className={`${done ? 'text-[#157A6E]' : skipped ? 'text-gray-300 line-through' : 'text-gray-600'}`}>
                              {done ? '✅' : skipped ? '⏭' : '⬜'} {step.label}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-1.5">
                        {nextStep && (
                          <>
                            <button onClick={() => setLaunchedPlaybooks(prev => prev.map((p, i) => i === idx ? { ...p, completedSteps: [...p.completedSteps, nextStepIdx] } : p))} className="flex-1 px-2 py-1.5 text-[10px] font-semibold text-white bg-[#157A6E] rounded hover:bg-[#126a5f]">Complete Next</button>
                            <button onClick={() => setLaunchedPlaybooks(prev => prev.map((p, i) => i === idx ? { ...p, skippedSteps: [...p.skippedSteps, nextStepIdx] } : p))} className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-100 rounded hover:bg-gray-200">Skip</button>
                          </>
                        )}
                        <button onClick={() => { if (confirm('Remove this playbook?')) setLaunchedPlaybooks(prev => prev.filter((_, i) => i !== idx)); }} className="px-2 py-1.5 text-[10px] font-semibold text-red-500 bg-red-50 rounded hover:bg-red-100">Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-8 text-center">
                <PlayCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-13px font-semibold text-gray-600">No active playbooks</p>
                <p className="text-11px text-gray-400 mt-1">Create a playbook to track engagement strategies for your partners.</p>
              </div>
            )}
          </div>
        )}

        {/* DIAGNOSTICS */}
        {intelligenceSubTab === 'diagnostics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Critical', count: advisors.filter(a => a.friction === 'Critical').length, mrr: advisors.filter(a => a.friction === 'Critical').reduce((s, a) => s + a.mrr, 0), bg: 'bg-red-50', color: '#ef4444' },
                { label: 'High Risk', count: advisors.filter(a => a.friction === 'High').length, mrr: advisors.filter(a => a.friction === 'High').reduce((s, a) => s + a.mrr, 0), bg: 'bg-orange-50', color: '#ea580c' },
                { label: 'Watch', count: advisors.filter(a => a.friction === 'Moderate').length, mrr: advisors.filter(a => a.friction === 'Moderate').reduce((s, a) => s + a.mrr, 0), bg: 'bg-amber-50', color: '#ca8a04' },
                { label: 'Stable', count: advisors.filter(a => a.friction === 'Low' && a.pulse !== 'Strong').length, mrr: advisors.filter(a => a.friction === 'Low' && a.pulse !== 'Strong').reduce((s, a) => s + a.mrr, 0), bg: 'bg-green-50', color: '#16a34a' },
                { label: 'Healthy', count: advisors.filter(a => a.friction === 'Low' && a.pulse === 'Strong').length, mrr: advisors.filter(a => a.friction === 'Low' && a.pulse === 'Strong').reduce((s, a) => s + a.mrr, 0), bg: 'bg-[#f0faf8]', color: '#157A6E' },
              ].map(cat => (
                <div key={cat.label} className={`p-4 rounded-lg text-center ${cat.bg}`}>
                  <p className="text-[24px] font-bold" style={{ color: cat.color }}>{cat.count}</p>
                  <p className="text-[10px] font-semibold" style={{ color: cat.color }}>{cat.label}</p>
                  <p className="text-[9px] text-gray-500">{formatCurrency(cat.mrr)} MRR</p>
                </div>
              ))}
            </div>

            {/* Trajectory clusters */}
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(trajectories).map(([traj, list]) => (
                <div key={traj} className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                  <h3 className={`text-[15px] font-semibold font-['Newsreader'] mb-3 ${traj === 'Accelerating' ? 'text-green-600' : traj === 'Freefall' ? 'text-red-600' : 'text-gray-800'}`}>
                    {traj} ({list.length}) · {formatCurrency(list.reduce((s, a) => s + a.mrr, 0))}
                  </h3>
                  {list.length === 0 ? <p className="text-12px text-gray-500 italic">None</p> : (
                    <div className="space-y-2">
                      {list.sort((a, b) => b.mrr - a.mrr).slice(0, 5).map(a => (
                        <div key={a.id} className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 text-11px" onClick={() => handleAdvisorClick(a.id)}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">{a.name} <span className="text-gray-500 font-normal">({a.company})</span></span>
                            <span className="font-bold text-gray-800">{formatCurrency(a.mrr)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Friction patterns */}
            {frictionInsights.length > 0 && (
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Systemic Friction Patterns</h3>
                <div className="space-y-2">
                  {frictionInsights.map((f, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FrictionBadge level={f.severity} />
                          <span className="text-13px font-bold text-gray-800">{f.issue}</span>
                        </div>
                        <span className="text-11px text-gray-500">{f.advisorCount} partners</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {f.names.map(n => (
                          <span key={n} className="text-10px px-2 py-1 bg-gray-100 rounded text-gray-700 cursor-pointer hover:bg-gray-200" onClick={() => handleAdvisorClick(advisors.find(a => a.name === n)?.id || '')}>{n}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESOURCES */}
        {intelligenceSubTab === 'resources' && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5 text-center py-12">
            <Lightbulb className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-13px font-semibold text-gray-600">Resources coming soon</p>
            <p className="text-11px text-gray-400 mt-1">Playbook templates, training materials, and strategic guides.</p>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════ VIEW 5: TEAM MANAGEMENT ═══════════════════
  const renderTeamManagement = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-semibold font-['Newsreader'] text-gray-900">Team Management</h1>
          <p className="text-12px text-gray-500 mt-1">Manage your channel team roster, territories, cadence rules, alerts, and notification preferences</p>
        </div>

        <div className="flex gap-0 border-b border-[#e8e5e1]">
          {([
            { id: 'roster' as const, label: 'Roster & Territories' },
            { id: 'cadence' as const, label: 'Cadence Rules' },
            { id: 'alerts' as const, label: 'Alert Thresholds' },
            { id: 'notifications' as const, label: 'Notifications' },
            { id: 'goals' as const, label: 'Goals & Quotas' },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setTeamMgmtSubTab(tab.id)}
              className={`px-4 py-2.5 text-12px font-medium border-b-2 transition-colors ${teamMgmtSubTab === tab.id ? 'text-[#157A6E] border-[#157A6E] font-semibold' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ROSTER */}
        {teamMgmtSubTab === 'roster' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Channel Manager Roster</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-11px">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Channel Manager</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Title</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-700">Territory</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Partners</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">Managed MRR</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-700">Quota</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reps.map(rep => {
                      const status = rep.engagementScore === 'Fading' ? 'At Risk' : rep.engagementScore === 'Strong' ? 'Active' : 'Active';
                      return (
                        <tr key={rep.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#157A6E] flex items-center justify-center text-white text-[10px] font-semibold font-['Newsreader']">
                                {rep.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{rep.name}</p>
                                <p className="text-[9px] text-gray-500">{rep.name.toLowerCase().replace(' ', '.')}@tcs.com</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-gray-600">{rep.title}</td>
                          <td className="px-2 py-2">
                            {rep.territories?.map(t => (
                              <span key={t} className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#f0faf8] text-[#157A6E] mr-1">{t}</span>
                            )) || <span className="text-gray-400">Unassigned</span>}
                          </td>
                          <td className="px-2 py-2 text-center">{rep.partnerCount}</td>
                          <td className="px-2 py-2 text-right font-bold text-gray-800">{formatCurrency(rep.managedMRR)}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(rep.quotaTarget)}</td>
                          <td className="px-2 py-2 text-center"><EngLabel score={rep.engagementScore} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Territory Map placeholder */}
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Territory Map</h3>
              </div>
              <USAMap
                advisorsByCity={{}}
                onCityClick={() => {}}
                selectedCity={null}
                regionStates={territoryRegion && US_REGIONS[territoryRegion] ? US_REGIONS[territoryRegion].states : []}
                exceptionStates={territoryExceptions}
                showRegionToggle={true}
                onRegionToggle={(showFull) => setShowFullUSA(showFull)}
                activeRegion={territoryRegion}
                showFullUSA={showFullUSA}
              />
            </div>
          </div>
        )}

        {/* CADENCE RULES */}
        {teamMgmtSubTab === 'cadence' && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-2">Cadence Rules</h3>
            <p className="text-11px text-gray-500 mb-4">Maximum days between touchpoints per partner tier</p>
            <div className="space-y-3">
              {Object.entries(cadenceRules).map(([tier, days]) => (
                <div key={tier} className="flex items-center gap-4 p-3 border-b border-gray-100">
                  <TierBadge tier={tier as any} />
                  <span className="text-12px font-medium text-gray-700 w-24 capitalize">{tier}</span>
                  <input type="number" value={days} onChange={(e) => setCadenceRules(p => ({ ...p, [tier]: parseInt(e.target.value) || 0 }))} className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-13px font-bold text-center" />
                  <span className="text-11px text-gray-500">days</span>
                  <span className="text-[10px] text-gray-400 ml-auto">Currently: avg {Math.floor(seededRandom(tier + 'avg', days * 0.8, days * 1.2))}d</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALERT THRESHOLDS */}
        {teamMgmtSubTab === 'alerts' && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-2">Alert Thresholds</h3>
            <p className="text-11px text-gray-500 mb-4">Triggers that generate action items and notifications</p>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 border-b border-gray-100">
                <span className="text-12px font-medium text-gray-700 flex-1">Cadence compliance below</span>
                <input type="number" value={alertThresholds.cadenceComplianceThreshold} onChange={e => setAlertThresholds(p => ({ ...p, cadenceComplianceThreshold: parseInt(e.target.value) || 0 }))} className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-13px font-bold text-center" />
                <span className="text-11px text-gray-500">%</span>
              </div>
              <div className="flex items-center gap-4 p-3 border-b border-gray-100">
                <span className="text-12px font-medium text-gray-700 flex-1">Deal stalled beyond</span>
                <input type="number" value={alertThresholds.dealPushCount} onChange={e => setAlertThresholds(p => ({ ...p, dealPushCount: parseInt(e.target.value) || 0 }))} className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-13px font-bold text-center" />
                <span className="text-11px text-gray-500">pushes</span>
              </div>
              <div className="flex items-center gap-4 p-3 border-b border-gray-100">
                <span className="text-12px font-medium text-gray-700 flex-1">Deal MRR threshold for alerts</span>
                <input type="number" value={alertThresholds.dealPushThreshold} onChange={e => setAlertThresholds(p => ({ ...p, dealPushThreshold: parseInt(e.target.value) || 0 }))} className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-13px font-bold text-center" />
                <span className="text-11px text-gray-500">MRR</span>
              </div>
              <div className="flex items-center gap-4 p-3 border-b border-gray-100">
                <span className="text-12px font-medium text-gray-700 flex-1">High-friction partners per CM exceeds</span>
                <input type="number" value={alertThresholds.frictionCountThreshold} onChange={e => setAlertThresholds(p => ({ ...p, frictionCountThreshold: parseInt(e.target.value) || 0 }))} className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-13px font-bold text-center" />
                <span className="text-11px text-gray-500">per CM</span>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {teamMgmtSubTab === 'notifications' && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Notification Preferences</h3>
            <div className="space-y-0">
              {Object.entries(notifSettings).map(([key, enabled]) => {
                const labels: Record<string, {title: string; desc: string}> = {
                  dailyDigest: { title: 'Daily digest email', desc: 'Summary of action items, signals, and team metrics each morning' },
                  criticalSignals: { title: 'Critical signal alerts', desc: 'Immediate notification for churn risk and critical friction' },
                  forecastOverrides: { title: 'Forecast override requests', desc: 'Alert when a CM submits an upside override for approval' },
                  cadenceViolations: { title: 'Cadence violation warnings', desc: 'Alert when a CM drops below cadence compliance threshold' },
                  weeklyReport: { title: 'Weekly team performance report', desc: 'Monday summary of team metrics, win rates, and pipeline changes' },
                  newPartnerAlerts: { title: 'New partner assignment alerts', desc: 'Notification when a new partner enters the system without a CM' },
                };
                const label = labels[key] || { title: key, desc: '' };
                return (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-12px font-medium text-gray-800">{label.title}</p>
                      <p className="text-[10px] text-gray-500">{label.desc}</p>
                    </div>
                    <button onClick={() => setNotifSettings(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                      className={`w-10 h-6 rounded-full transition-colors relative ${enabled ? 'bg-[#157A6E]' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GOALS & QUOTAS */}
        {teamMgmtSubTab === 'goals' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Q2 2026 Team Targets</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-12px font-medium text-gray-700">Team Quota</span>
                  <span className="text-14px font-bold text-gray-800">{formatCurrency(teamTarget)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-12px font-medium text-gray-700">Per-CM Default Quota</span>
                  <span className="text-14px font-bold text-gray-800">{formatCurrency(reps.length > 0 ? teamTarget / reps.length : 0)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-12px font-medium text-gray-700">Partner Activation Target</span>
                  <div className="flex items-center gap-1">
                    <input type="number" value={teamGoals.partnerActivationTarget} onChange={e => setTeamGoals(p => ({ ...p, partnerActivationTarget: parseInt(e.target.value) || 0 }))} className="w-14 text-right text-14px font-bold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-[#157A6E] focus:outline-none" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-12px font-medium text-gray-700">Win Rate Target</span>
                  <div className="flex items-center gap-0.5">
                    <input type="number" value={teamGoals.winRateTarget} onChange={e => setTeamGoals(p => ({ ...p, winRateTarget: parseInt(e.target.value) || 0 }))} className="w-12 text-right text-14px font-bold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-[#157A6E] focus:outline-none" />
                    <span className="text-14px font-bold text-gray-800">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-12px font-medium text-gray-700">Pipeline Coverage Target</span>
                  <div className="flex items-center gap-0.5">
                    <input type="number" step="0.1" value={teamGoals.pipelineCoverageTarget} onChange={e => setTeamGoals(p => ({ ...p, pipelineCoverageTarget: parseFloat(e.target.value) || 0 }))} className="w-12 text-right text-14px font-bold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-[#157A6E] focus:outline-none" />
                    <span className="text-14px font-bold text-gray-800">×</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Current Progress</h3>
              <div className="space-y-4">
                {[
                  { label: 'Team Revenue', pct: commitPercentage, detail: `${formatCurrency(teamCommit)} of ${formatCurrency(teamTarget)}` },
                  { label: 'Partners Activated', pct: teamGoals.partnerActivationTarget > 0 ? Math.round((advisors.filter(a => a.mrr > 0).length / teamGoals.partnerActivationTarget) * 100) : 0, detail: `${advisors.filter(a => a.mrr > 0).length} of ${teamGoals.partnerActivationTarget}` },
                  { label: 'Win Rate', pct: teamGoals.winRateTarget > 0 ? Math.round((avgWinRate / teamGoals.winRateTarget) * 100) : 0, detail: `${avgWinRate}% of ${teamGoals.winRateTarget}% target` },
                  { label: 'Pipeline Coverage', pct: teamGoals.pipelineCoverageTarget > 0 ? Math.round(((teamTarget > 0 ? weightedPipeline / teamTarget : 0) / teamGoals.pipelineCoverageTarget) * 100) : 0, detail: `${teamTarget > 0 ? (weightedPipeline / teamTarget).toFixed(1) : '0'}× of ${teamGoals.pipelineCoverageTarget}× target` },
                ].map(g => (
                  <div key={g.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-12px font-semibold text-gray-800">{g.label}</span>
                      <span className={`text-11px font-bold ${g.pct >= 80 ? 'text-[#157A6E]' : 'text-amber-600'}`}>{Math.min(g.pct, 100)}%</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-1">{g.detail}</p>
                    <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${g.pct >= 80 ? 'bg-[#157A6E]' : 'bg-amber-400'}`} style={{ width: `${Math.min(g.pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-Rep Activity Data Editor */}
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5 col-span-2">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-2">CM Activity Data (30d)</h3>
              <p className="text-[10px] text-gray-400 mb-4">Edit activity metrics per channel manager — changes reflect across the dashboard</p>
              <div className="overflow-x-auto">
                <table className="w-full text-11px">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Channel Manager</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Meetings</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Calls</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-700">Emails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reps.map(rep => {
                      const act = getRepActivity(rep.id);
                      const updateActivity = (field: string, value: number) => {
                        setRepActivityData(prev => ({ ...prev, [rep.id]: { ...act, [field]: Math.max(0, value) } }));
                      };
                      return (
                        <tr key={rep.id} className="border-b border-gray-100">
                          <td className="px-3 py-2 font-semibold text-gray-800">{rep.name}</td>
                          <td className="px-2 py-2 text-center"><input type="number" value={act.meetings} onChange={e => updateActivity('meetings', parseInt(e.target.value) || 0)} className="w-12 text-center bg-transparent border-b border-dashed border-gray-300 focus:border-[#157A6E] focus:outline-none" /></td>
                          <td className="px-2 py-2 text-center"><input type="number" value={act.calls} onChange={e => updateActivity('calls', parseInt(e.target.value) || 0)} className="w-12 text-center bg-transparent border-b border-dashed border-gray-300 focus:border-[#157A6E] focus:outline-none" /></td>
                          <td className="px-2 py-2 text-center"><input type="number" value={act.emails} onChange={e => updateActivity('emails', parseInt(e.target.value) || 0)} className="w-12 text-center bg-transparent border-b border-dashed border-gray-300 focus:border-[#157A6E] focus:outline-none" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

      {/* ═══════════════════ DEAL DETAIL MODAL ═══════════════════ */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedDeal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e8e5e1] bg-gradient-to-r from-[#F7F5F2] to-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[18px] font-bold font-['Newsreader'] text-gray-800">{selectedDeal.name}</h2>
                <button onClick={() => setSelectedDeal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <DealHealthBadge health={selectedDeal.health} />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">{selectedDeal.stage}</span>
                {leaderInvolved.has(selectedDeal.id) && <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#157A6E] text-white">LEADER INVOLVED</span>}
                {selectedDeal.overrideRequested && <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800">OVERRIDE REQUESTED</span>}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-[#F7F5F2] rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">MRR</p>
                  <p className="text-[20px] font-bold text-[#157A6E]">{formatCurrency(selectedDeal.mrr)}</p>
                </div>
                <div className="bg-[#F7F5F2] rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Stage Age</p>
                  <p className="text-[20px] font-bold text-gray-800">{selectedDeal.daysInStage}d</p>
                </div>
                <div className="bg-[#F7F5F2] rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Probability</p>
                  <p className="text-[20px] font-bold text-gray-800">{selectedDeal.probability}%</p>
                </div>
              </div>

              {(() => {
                const advisorIds = getDealAdvisorIds(selectedDeal);
                const dealAdvisor = advisors.find(a => a.id === advisorIds[0]);
                const rep = reps.find(r => r.id === selectedDeal.repId);
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Partner</p>
                        <p className="text-13px font-semibold text-gray-800">{dealAdvisor?.name || 'Unknown'}</p>
                        <p className="text-11px text-gray-500">{dealAdvisor?.company}</p>
                      </div>
                      {dealAdvisor && (
                        <button onClick={() => { setSelectedDeal(null); handleAdvisorClick(dealAdvisor.id); }} className="text-11px text-[#157A6E] font-semibold hover:underline">View Partner →</button>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Channel Manager</p>
                        <p className="text-13px font-semibold text-gray-800">{rep?.name || 'Unknown'}</p>
                        <p className="text-11px text-gray-500">{rep?.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedDeal.overrideRequested && selectedDeal.overrideNote && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-[10px] text-amber-700 uppercase font-semibold mb-1">Override Note</p>
                  <p className="text-12px text-amber-900 italic">&quot;{selectedDeal.overrideNote}&quot;</p>
                  {!overrideActions[selectedDeal.id] && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => { setOverrideActions(p => ({ ...p, [selectedDeal.id]: 'approved' })); }} className="px-3 py-1.5 bg-green-600 text-white text-11px font-bold rounded hover:bg-green-700">Approve</button>
                      <button onClick={() => { setOverrideActions(p => ({ ...p, [selectedDeal.id]: 'denied' })); }} className="px-3 py-1.5 bg-gray-200 text-gray-800 text-11px font-bold rounded hover:bg-gray-300">Deny</button>
                    </div>
                  )}
                  {overrideActions[selectedDeal.id] && (
                    <p className={`text-11px font-semibold mt-2 ${overrideActions[selectedDeal.id] === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                      {overrideActions[selectedDeal.id] === 'approved' ? '✓ Override Approved' : '✗ Override Denied'}
                    </p>
                  )}
                </div>
              )}

              {selectedDeal.pushHistory && selectedDeal.pushHistory.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Push History ({selectedDeal.pushHistory.length})</p>
                  {selectedDeal.pushHistory.map((push, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-b-0 text-11px">
                      <span className="text-gray-600">{push.fromPeriod} → {push.toPeriod}</span>
                      <span className="text-gray-500">{push.reason || 'No reason given'}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setSelectedDeal(null); setActiveView('forecast-pipeline'); setForecastSubTab('deals'); }} className="flex-1 px-3 py-2 text-11px font-semibold text-[#157A6E] bg-[#f0faf8] rounded-lg hover:bg-[#e0f4f0]">View in Pipeline</button>
                <button onClick={() => setSelectedDeal(null)} className="px-3 py-2 text-11px font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ PLAYBOOK MODAL ═══════════════════ */}
      {showPlaybookModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPlaybookModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[700px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e8e5e1] bg-gradient-to-r from-[#F7F5F2] to-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-bold font-['Newsreader'] text-gray-800">Assign Playbook</h2>
                <button onClick={() => setShowPlaybookModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              {!playbookModalAdvisor ? (
                <div className="bg-white rounded-lg border border-[#e8e5e1] p-3">
                  <button onClick={() => setShowPlaybookAdvisorPicker(!showPlaybookAdvisorPicker)} className="w-full text-left px-3 py-2 text-[13px] text-gray-400 bg-[#F7F5F2] rounded-lg border border-dashed border-gray-300 hover:border-[#157A6E]">Select a partner to assign...</button>
                  {showPlaybookAdvisorPicker && (
                    <div className="mt-2 border border-[#e8e5e1] rounded-lg overflow-hidden">
                      <input type="text" value={playbookAdvisorSearch} onChange={e => setPlaybookAdvisorSearch(e.target.value)} placeholder="Search partners..." className="w-full px-3 py-2 text-12px border-b border-[#e8e5e1] focus:outline-none focus:bg-teal-50" autoFocus />
                      <div className="max-h-[200px] overflow-y-auto">
                        {advisors.filter(a => !playbookAdvisorSearch || a.name.toLowerCase().includes(playbookAdvisorSearch.toLowerCase()) || a.company.toLowerCase().includes(playbookAdvisorSearch.toLowerCase())).map(a => (
                          <div key={a.id} onClick={() => { setPlaybookModalAdvisor(a); setShowPlaybookAdvisorPicker(false); setPlaybookAdvisorSearch(''); }} className="flex items-center justify-between px-3 py-2 hover:bg-[#F7F5F2] cursor-pointer border-b border-gray-50">
                            <div><p className="text-12px font-semibold text-gray-800">{a.name}</p><p className="text-[10px] text-gray-500">{a.company}</p></div>
                            <div className="flex items-center gap-2"><TierBadge tier={a.tier} /><span className="text-11px font-bold text-gray-700">{formatCurrency(a.mrr)}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 border border-[#e8e5e1]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-14px font-semibold text-gray-800">{playbookModalAdvisor.name}</h3>
                      <p className="text-12px text-gray-500 mt-0.5">{playbookModalAdvisor.company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] font-bold text-[#157A6E]">{formatCurrency(playbookModalAdvisor.mrr)}</span>
                      <button onClick={() => { setPlaybookModalAdvisor(null); setShowPlaybookAdvisorPicker(true); }} className="text-[10px] text-[#157A6E] font-semibold hover:underline ml-2">Change</button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2"><TierBadge tier={playbookModalAdvisor.tier} /><TrajectoryBadge trajectory={playbookModalAdvisor.trajectory} /></div>
                </div>
              )}
            </div>

            <div className="flex border-b border-[#e8e5e1] px-6 bg-white">
              <button onClick={() => setPlaybookModalMode('template')} className={`px-6 py-3 text-13px font-semibold border-b-2 transition-colors ${playbookModalMode === 'template' ? 'text-[#157A6E] border-[#157A6E]' : 'text-gray-500 border-transparent'}`}>Choose Template</button>
              <button onClick={() => setPlaybookModalMode('custom')} className={`px-6 py-3 text-13px font-semibold border-b-2 transition-colors ${playbookModalMode === 'custom' ? 'text-[#157A6E] border-[#157A6E]' : 'text-gray-500 border-transparent'}`}>Create Custom</button>
            </div>

            <div className="p-6 space-y-4">
              {playbookModalMode === 'template' ? (
                <div className="grid grid-cols-2 gap-4">
                  {playbookTemplates.map(tmpl => (
                    <div key={tmpl.id} onClick={() => { if (playbookModalAdvisor) { setLaunchedPlaybooks(prev => [...prev, { templateId: tmpl.id, advisorId: playbookModalAdvisor.id, advisorName: playbookModalAdvisor.name, launchedAt: new Date().toISOString(), priority: playbookPriority, completedSteps: [], skippedSteps: [] }]); setShowPlaybookModal(false); } }} className={`${tmpl.bgColor} rounded-lg border-2 border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-all border-l-4 ${tmpl.borderColor} ${!playbookModalAdvisor ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-[24px]">{tmpl.icon}</span>
                        <div className="flex-1">
                          <h4 className="text-13px font-semibold text-gray-800">{tmpl.title}</h4>
                          <p className="text-11px text-gray-600">{tmpl.subtitle}</p>
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
                <div className="space-y-4">
                  <div>
                    <label className="text-11px font-semibold text-gray-500 uppercase tracking-wide">Playbook Name</label>
                    <input type="text" value={customPlaybookName} onChange={e => setCustomPlaybookName(e.target.value)} placeholder="e.g., Strategic Engagement: Acme" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:border-[#157A6E]" />
                  </div>
                  <div>
                    <label className="text-11px font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                    <div className="flex gap-2 mt-1">
                      {(['critical', 'high', 'medium'] as const).map(p => (
                        <button key={p} onClick={() => setPlaybookPriority(p)} className={`px-3 py-1.5 rounded-lg text-11px font-semibold transition-colors ${playbookPriority === p ? p === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' : p === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-11px font-semibold text-gray-500 uppercase tracking-wide">Steps</label>
                    <div className="space-y-2 mt-2">
                      {customPlaybookSteps.map((step, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <input type="number" value={step.day} onChange={e => { const ns = [...customPlaybookSteps]; ns[i].day = parseInt(e.target.value) || 1; setCustomPlaybookSteps(ns); }} placeholder="Day" className="w-16 px-2 py-1 border border-gray-200 rounded text-11px mb-1" />
                          <input type="text" value={step.label} onChange={e => { const ns = [...customPlaybookSteps]; ns[i].label = e.target.value; setCustomPlaybookSteps(ns); }} placeholder="Step label" className="w-full px-2 py-1 border border-gray-200 rounded text-11px mb-1 focus:outline-none focus:border-[#157A6E]" />
                          <textarea value={step.desc} onChange={e => { const ns = [...customPlaybookSteps]; ns[i].desc = e.target.value; setCustomPlaybookSteps(ns); }} placeholder="Step description" className="w-full px-2 py-1 border border-gray-200 rounded text-[10px] focus:outline-none focus:border-[#157A6E]" rows={2} />
                          {customPlaybookSteps.length > 1 && <button onClick={() => setCustomPlaybookSteps(customPlaybookSteps.filter((_, j) => j !== i))} className="mt-1 text-[10px] text-red-500 font-semibold">Remove</button>}
                        </div>
                      ))}
                      <button onClick={() => setCustomPlaybookSteps([...customPlaybookSteps, { label: '', desc: '', day: Math.max(...customPlaybookSteps.map(s => s.day), 0) + 1 }])} className="text-11px text-[#157A6E] font-semibold hover:underline">+ Add Step</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#e8e5e1] flex justify-end gap-2">
              <button onClick={() => setShowPlaybookModal(false)} className="px-4 py-2 text-12px font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              {playbookModalMode === 'custom' && customPlaybookName && playbookModalAdvisor && (
                <button onClick={() => { setLaunchedPlaybooks(prev => [...prev, { templateId: 'custom', advisorId: playbookModalAdvisor.id, advisorName: playbookModalAdvisor.name, launchedAt: new Date().toISOString(), priority: playbookPriority, completedSteps: [], skippedSteps: [], customSteps: customPlaybookSteps.map(s => ({ ...s, phase: 'Action' })), playbookName: customPlaybookName }]); setShowPlaybookModal(false); setCustomPlaybookName(''); setCustomPlaybookSteps([{ label: '', desc: '', day: 1 }]); }} className="px-4 py-2 text-12px font-semibold text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f]">Assign to {playbookModalAdvisor.name}</button>
              )}
            </div>
          </div>
        </div>
      )}

      <AIChat role="leader" selectedAdvisor={selectedAdvisor} live={true} />
    </div>
  );
}
