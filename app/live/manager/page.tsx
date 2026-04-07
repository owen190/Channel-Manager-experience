'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, DollarSign, Brain, Activity,
  TrendingDown, TrendingUp, Zap, Users, ChevronDown, ChevronUp, X,
  ArrowLeft, MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays,
  Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, RefreshCw,
  Megaphone, Star, TrendingUp as TrendingUpIcon, CheckCircle, AlertCircle as AlertCircleIcon, Edit, Plus,
  LayoutGrid, Map, FileText, Mail, Building2, ArrowUpRight, BarChart3, UserPlus, Calendar, Shield, PlayCircle, ChevronRight, Search,
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
import { Advisor, Deal, DealHealth, FrictionLevel, DiagnosticRow, EngagementScore, PartnerTier } from '@/lib/types';
import { adaptAdvisor, adaptDeal } from '@/lib/db/adapter';

type DealStage = 'Discovery' | 'Qualifying' | 'Proposal' | 'Negotiating' | 'Closed Won' | 'Stalled';

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
  const [relationshipViewMode, setRelationshipViewMode] = useState<'partners' | 'tsds'>('partners');
  const [contactTypeFilter, setContactTypeFilter] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [pipelineMetricsView, setPipelineMetricsView] = useState<'kanban' | 'deals' | 'quotes-vs-sold' | 'by-advisor'>('kanban');
  const [selectedTsdAdvisors, setSelectedTsdAdvisors] = useState<Advisor[]>([]);
  const [expandedTsdCompany, setExpandedTsdCompany] = useState<string | null>(null);
  const [intelligenceSubTab, setIntelligenceSubTab] = useState<'overview' | 'signals' | 'playbooks' | 'diagnostics'>('overview');
  const [signalFilter, setSignalFilter] = useState<'all' | 'churn' | 'growth' | 'stall' | 'intel'>('all');
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [playbookModalSignal, setPlaybookModalSignal] = useState<{type: string; title: string; desc: string; partnerName?: string; mrr?: number} | null>(null);
  const [playbookSteps, setPlaybookSteps] = useState<string[]>(['', '', '']);
  const [playbookPriority, setPlaybookPriority] = useState<'critical' | 'high' | 'medium'>('high');
  const [playbookDeadline, setPlaybookDeadline] = useState(14);
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
  useEffect(() => { fetchData(); }, []);

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
  const atRiskAdvisors = advisors.filter(a => a.trajectory === 'Freefall' || a.trajectory === 'Slipping');
  const atRiskMRR = atRiskAdvisors.reduce((sum, a) => sum + a.mrr, 0);
  const stalledDeals = deals.filter(d => d.stage === 'Stalled');
  const closedWonDeals = deals.filter(d => d.stage === 'Closed Won');
  const closedWonMRR = closedWonDeals.reduce((sum, d) => sum + d.mrr, 0);

  const formatCurrency = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`;

  // Stage distribution
  const stages: DealStage[] = ['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'];
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
          { id: 'tel-1', name: 'Sarah Mitchell', title: 'Channel Development Manager', role: 'Channel Manager', email: 's.mitchell@telarus.com', phone: '(801) 555-4821', lastContact: '2026-03-29', introsQTD: 8, introsAllTime: 47, revenueAttributed: 142000, responsiveness: 'Fast' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Proactively sending intro leads — 3 new ones this week', signalType: 'positive' as const, location: 'Salt Lake City, UT', commPref: 'Slack', notes: 'Key ally at Telarus. Always responds same-day. Advocates for Aptum in internal supplier reviews.' },
          { id: 'tel-2', name: 'James Thornton', title: 'Solutions Engineer', role: 'Sales Engineer', email: 'j.thornton@telarus.com', phone: '(801) 555-3392', lastContact: '2026-03-25', introsQTD: 5, introsAllTime: 31, revenueAttributed: 88000, responsiveness: 'Moderate' as const, sentiment: 'Neutral' as const, engagement: 'Medium' as const, signal: 'Requested updated technical docs for SD-WAN — possible upcoming RFP', signalType: 'info' as const, location: 'Salt Lake City, UT', commPref: 'Email', notes: 'Strong technical knowledge. Prefers detailed spec sheets over marketing collateral.' },
          { id: 'tel-3', name: 'Rachael Nguyen', title: 'Partner Success Lead', role: 'Channel Manager', email: 'r.nguyen@telarus.com', phone: '(801) 555-1104', lastContact: '2026-04-01', introsQTD: 12, introsAllTime: 63, revenueAttributed: 215000, responsiveness: 'Fast' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Top intro source this quarter — asked to co-host a webinar', signalType: 'positive' as const, location: 'Austin, TX', commPref: 'Slack', notes: 'Our #1 champion at Telarus. Drives more intros than anyone. Nominated us for Supplier of the Year.' },
        ],
      },
      {
        name: 'Avant',
        logo: '🟧',
        description: 'Leading channel platform for IT decision making',
        contacts: [
          { id: 'av-1', name: 'Derek Paulson', title: 'Channel Account Manager', role: 'Channel Manager', email: 'd.paulson@avant.com', phone: '(312) 555-6678', lastContact: '2026-03-31', introsQTD: 10, introsAllTime: 52, revenueAttributed: 178000, responsiveness: 'Fast' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Pushing Aptum for 2 net-new enterprise accounts this month', signalType: 'positive' as const, location: 'Chicago, IL', commPref: 'Email', notes: 'Very results-driven. Responds well to SPIFs and incentive programs. Always hits his intro targets.' },
          { id: 'av-2', name: 'Monica Reeves', title: 'Solutions Architect', role: 'Sales Engineer', email: 'm.reeves@avant.com', phone: '(312) 555-2241', lastContact: '2026-03-28', introsQTD: 6, introsAllTime: 28, revenueAttributed: 95000, responsiveness: 'Moderate' as const, sentiment: 'Neutral' as const, engagement: 'Medium' as const, signal: 'Joined a competitor webinar last week — monitor for mindshare drift', signalType: 'warning' as const, location: 'Chicago, IL', commPref: 'Email', notes: 'Great technical depth. Helps close complex deals. Schedules are tight — book 2 weeks ahead.' },
        ],
      },
      {
        name: 'Bridgepointe',
        logo: '🟩',
        description: 'Technology advisory and distribution platform',
        contacts: [
          { id: 'bp-1', name: 'Kevin Marsh', title: 'VP Channel Partnerships', role: 'Leadership', email: 'k.marsh@bridgepointe.com', phone: '(925) 555-8812', lastContact: '2026-03-22', introsQTD: 4, introsAllTime: 19, revenueAttributed: 67000, responsiveness: 'Slow' as const, sentiment: 'Cool' as const, engagement: 'Low' as const, signal: 'Hasn\'t responded to last 2 emails — relationship cooling', signalType: 'warning' as const, location: 'San Ramon, CA', commPref: 'Phone', notes: 'C-level relationship — strategic but hard to reach. Best approached through Alicia first.' },
          { id: 'bp-2', name: 'Alicia Tran', title: 'Partner Development Rep', role: 'PDM/SPDM', email: 'a.tran@bridgepointe.com', phone: '(925) 555-3350', lastContact: '2026-03-27', introsQTD: 7, introsAllTime: 34, revenueAttributed: 112000, responsiveness: 'Fast' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Scheduled joint training session for advisors next week', signalType: 'positive' as const, location: 'San Ramon, CA', commPref: 'Slack', notes: 'Day-to-day contact at Bridgepointe. Very organized. Keeps detailed notes on advisor preferences.' },
        ],
      },
      {
        name: 'Intelisys',
        logo: '🟪',
        description: 'Telecommunications master agent and solutions distributor',
        contacts: [
          { id: 'in-1', name: 'Robert Cianci', title: 'Channel Director', role: 'Leadership', email: 'r.cianci@intelisys.com', phone: '(203) 555-9901', lastContact: '2026-03-30', introsQTD: 9, introsAllTime: 41, revenueAttributed: 156000, responsiveness: 'Moderate' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Invited us to Intelisys supplier summit — keynote opportunity', signalType: 'positive' as const, location: 'Petaluma, CA', commPref: 'Phone', notes: 'Senior leader with strong influence. Sets strategic direction for which suppliers get prioritized.' },
          { id: 'in-2', name: 'Patricia Dunn', title: 'Sales Engineer', role: 'Sales Engineer', email: 'p.dunn@intelisys.com', phone: '(203) 555-4478', lastContact: '2026-03-18', introsQTD: 3, introsAllTime: 22, revenueAttributed: 71000, responsiveness: 'Slow' as const, sentiment: 'Neutral' as const, engagement: 'Low' as const, signal: 'Low intro volume — may need enablement refresh on our solutions', signalType: 'info' as const, location: 'Milford, CT', commPref: 'Email', notes: 'Technically capable but not proactive. Needs regular check-ins to stay engaged.' },
          { id: 'in-3', name: 'Tyler Washington', title: 'Partner Enablement Manager', role: 'Channel Manager', email: 't.washington@intelisys.com', phone: '(203) 555-6632', lastContact: '2026-04-01', introsQTD: 11, introsAllTime: 55, revenueAttributed: 198000, responsiveness: 'Fast' as const, sentiment: 'Warm' as const, engagement: 'High' as const, signal: 'Created custom Aptum battlecard for advisors — high advocacy', signalType: 'positive' as const, location: 'Petaluma, CA', commPref: 'Slack', notes: 'Enablement-focused. Loves co-branded content. Great at arming advisors with our talking points.' },
        ],
      },
      {
        name: 'AppDirect',
        logo: '🔵',
        description: 'B2B subscription commerce platform and marketplace',
        contacts: [
          { id: 'ad-1', name: 'Yuki Tanaka', title: 'Partner Growth Manager', role: 'Channel Manager', email: 'y.tanaka@appdirect.com', phone: '(415) 555-7723', lastContact: '2026-03-26', introsQTD: 6, introsAllTime: 25, revenueAttributed: 83000, responsiveness: 'Moderate' as const, sentiment: 'Neutral' as const, engagement: 'Medium' as const, signal: 'Requested updated pricing matrix — potential deal in pipeline', signalType: 'info' as const, location: 'San Francisco, CA', commPref: 'Email', notes: 'Newer relationship. Methodical and data-driven. Appreciates ROI-focused messaging.' },
          { id: 'ad-2', name: 'Chris Brennan', title: 'Solutions Consultant', role: 'Sales Engineer', email: 'c.brennan@appdirect.com', phone: '(415) 555-1198', lastContact: '2026-03-20', introsQTD: 2, introsAllTime: 14, revenueAttributed: 45000, responsiveness: 'Slow' as const, sentiment: 'Cool' as const, engagement: 'Low' as const, signal: 'Engagement dropping — last meeting was cancelled twice', signalType: 'warning' as const, location: 'San Francisco, CA', commPref: 'Phone', notes: 'Was more engaged 6 months ago. May be shifting focus to other suppliers. Needs re-engagement.' },
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
      const partners = partnersByTsd[c.name] || [];
      const revenue = partners.reduce((s, p) => s + p.mrr, 0);
      const totalIntrosQTD = c.contacts.reduce((s, ct) => s + ct.introsQTD, 0);
      const totalIntrosAllTime = c.contacts.reduce((s, ct) => s + ct.introsAllTime, 0);
      const totalRevenueAttributed = c.contacts.reduce((s, ct) => s + ct.revenueAttributed, 0);
      return { ...c, partners, revenue, totalIntrosQTD, totalIntrosAllTime, totalRevenueAttributed };
    });
  }, [advisorsWithDeals, seededRandom]);

  // Co-marketing opportunity detection
  const coMarketingOpportunities = useMemo(() => {
    const opps: Array<{ advisor: Advisor; reason: string; type: string }> = [];
    advisorsWithDeals.forEach(a => {
      if (a.pulse === 'Strong' && a.tier === 'platinum') {
        opps.push({ advisor: a, reason: `${a.name} is a Platinum partner with strong engagement — ideal co-marketing candidate`, type: 'High-Value Amplification' });
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

  const renderCommandCenter = () => (
    <div className="space-y-5">
      {/* Co-Marketing Notification Banner (dismissible) */}
      {showCoMarketingNotif && coMarketingOpportunities.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#F0FAF8] border border-[#157A6E]/20 rounded-lg">
          <Megaphone className="w-4 h-4 text-[#157A6E] shrink-0" />
          <p className="text-[12px] text-gray-700 flex-1">
            <span className="font-semibold text-[#157A6E]">{coMarketingOpportunities.length} co-marketing opportunities</span> identified —{' '}
            {coMarketingOpportunities.slice(0, 2).map(o => o.advisor.name).join(', ')}{coMarketingOpportunities.length > 2 ? ` +${coMarketingOpportunities.length - 2} more` : ''}
          </p>
          <button onClick={() => { setActiveView('relationships'); }} className="text-[11px] font-semibold text-[#157A6E] hover:underline whitespace-nowrap">View in profiles →</button>
          <button onClick={() => setShowCoMarketingNotif(false)} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* KPI Row — Clickable */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'mrr', label: 'Portfolio MRR', value: formatCurrency(totalMRR), change: `${advisors.length} partners`, changeType: 'positive' as const },
          { key: 'pipeline', label: 'Active Pipeline', value: formatCurrency(pipelineMRR), change: `${activePipeline.length} deals`, changeType: 'positive' as const },
          { key: 'atrisk', label: 'At-Risk MRR', value: formatCurrency(atRiskMRR), change: `${atRiskAdvisors.length} partners`, changeType: (atRiskAdvisors.length > 0 ? 'negative' : 'neutral') as 'negative' | 'neutral' },
          { key: 'won', label: 'Closed Won QTD', value: formatCurrency(closedWonMRR), change: `${closedWonDeals.length} deals`, changeType: 'positive' as const },
        ].map(kpi => (
          <div key={kpi.key} className="cursor-pointer" onClick={() => setCcKpiDrill(ccKpiDrill === kpi.key ? null : kpi.key)}>
            <KPICard label={kpi.label} value={kpi.value} change={kpi.change} changeType={kpi.changeType} />
          </div>
        ))}
      </div>

      {/* KPI Drill-Down (conditional) */}
      {ccKpiDrill === 'mrr' && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 animate-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[12px] font-semibold text-gray-700">MRR by Tier</h4>
            <button onClick={() => setCcKpiDrill(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {['platinum', 'gold', 'silver', 'onboarding'].map(tier => {
              const tierAdvisors = advisors.filter(a => a.tier === tier);
              const tierMRR = tierAdvisors.reduce((s, a) => s + a.mrr, 0);
              return (
                <div key={tier} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">{tier === 'platinum' ? 'Platinum' : tier === 'gold' ? 'Gold' : tier === 'silver' ? 'Silver' : 'Onboarding'}</div>
                  <div className="text-[16px] font-bold text-gray-800 mt-1">{formatCurrency(tierMRR)}</div>
                  <div className="text-[10px] text-gray-500">{tierAdvisors.length} partners</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {ccKpiDrill === 'pipeline' && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[12px] font-semibold text-gray-700">Pipeline Breakdown</h4>
            <button onClick={() => setCcKpiDrill(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex h-5 rounded-md overflow-hidden gap-[2px]">
            {stageDistribution.filter(s => s.count > 0 && s.stage !== 'Closed Won' && s.stage !== 'Stalled').map(s => {
              const colors: Record<string, string> = { Discovery: '#3B82F6', Qualifying: '#06B6D4', Proposal: '#8B5CF6', Negotiating: '#F59E0B' };
              return <div key={s.stage} className="flex items-center justify-center text-[9px] font-bold text-white" style={{ width: `${(s.mrr / pipelineMRR) * 100}%`, backgroundColor: colors[s.stage] || '#9CA3AF', minWidth: 30 }}>{s.count}</div>;
            })}
          </div>
          <div className="flex gap-3 mt-2 flex-wrap">
            {stageDistribution.filter(s => s.count > 0 && s.stage !== 'Closed Won' && s.stage !== 'Stalled').map(s => {
              const colors: Record<string, string> = { Discovery: '#3B82F6', Qualifying: '#06B6D4', Proposal: '#8B5CF6', Negotiating: '#F59E0B' };
              return <div key={s.stage} className="flex items-center gap-1.5 text-[10px] text-gray-500"><div className="w-2 h-2 rounded-sm" style={{backgroundColor: colors[s.stage]}} />{s.stage}: {s.count} · {formatCurrency(s.mrr)}</div>;
            })}
          </div>
        </div>
      )}
      {ccKpiDrill === 'atrisk' && atRiskAdvisors.length > 0 && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[12px] font-semibold text-gray-700">At-Risk Partners</h4>
            <button onClick={() => setCcKpiDrill(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {atRiskAdvisors.map(a => (
              <div key={a.id} className="bg-red-50 rounded-lg p-3 cursor-pointer hover:bg-red-100" onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}>
                <div className="text-[12px] font-semibold text-gray-800">{a.name}</div>
                <div className="text-[11px] font-bold text-red-500 mt-0.5">{formatCurrency(a.mrr)}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{a.trajectory} · {a.friction} friction</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {ccKpiDrill === 'won' && closedWonDeals.length > 0 && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[12px] font-semibold text-gray-700">Closed Won This Quarter</h4>
            <button onClick={() => setCcKpiDrill(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
          </div>
          {closedWonDeals.map(d => {
            const adv = advisors.find(a => a.id === d.advisorId);
            return (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
                <div><div className="text-[12px] font-medium text-gray-800">{d.name}</div><div className="text-[10px] text-gray-500">{adv?.name || 'Unknown'}</div></div>
                <span className="text-[13px] font-bold text-green-600">{formatCurrency(d.mrr)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-5">
        {/* Signal Alerts — Now shows diagnosis/reason */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Signal Alerts</h3>
            <button onClick={() => { setActiveView('intelligence'); setIntelligenceSubTab('signals'); }} className="text-[10px] text-[#157A6E] font-semibold hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {atRiskAdvisors.length > 0 ? atRiskAdvisors.map(a => (
              <div key={a.id} className="p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                   onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-gray-800">{a.name}</p>
                      <span className="text-[11px] font-bold text-red-500">{formatCurrency(a.mrr)}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{a.diagnosis || `${a.trajectory} trajectory with ${a.friction.toLowerCase()} friction. Engagement declining.`}</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-[12px] text-gray-400 italic">No at-risk partners currently</p>
            )}
            {stalledDeals.length > 0 && stalledDeals.slice(0, 3).map(d => {
              const adv = advisors.find(a => a.id === d.advisorId);
              return (
                <div key={d.id} className="p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                     onClick={() => { if (adv) { setSelectedAdvisor(adv); setPanelOpen(true); } }}>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] font-semibold text-gray-800">{d.name}</p>
                        <span className="text-[11px] font-bold text-amber-600">{formatCurrency(d.mrr)}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">{adv?.name || 'Unknown'} · Stuck in {d.stage} for {d.daysInStage} days</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline by Stage — Friendlier expand */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Pipeline by Stage</h3>
            <button onClick={() => setActiveView('pipeline')} className="text-[10px] text-[#157A6E] font-semibold hover:underline">Full pipeline →</button>
          </div>
          <div className="space-y-2.5">
            {stageDistribution.filter(s => s.count > 0).map(s => {
              const colors: Record<string, string> = {
                Discovery: '#3B82F6', Qualifying: '#06B6D4', Proposal: '#8B5CF6',
                Negotiating: '#F59E0B', 'Closed Won': '#10B981', Stalled: '#EF4444',
              };
              const bgColors: Record<string, string> = {
                Discovery: 'bg-blue-50', Qualifying: 'bg-cyan-50', Proposal: 'bg-violet-50',
                Negotiating: 'bg-amber-50', 'Closed Won': 'bg-green-50', Stalled: 'bg-red-50',
              };
              const isExpanded = expandedStage === s.stage;
              return (
                <div key={s.stage}>
                  <div className="cursor-pointer rounded-lg p-2.5 hover:bg-gray-50 transition-colors" onClick={() => setExpandedStage(isExpanded ? null : s.stage as DealStage)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: colors[s.stage] || '#9CA3AF' }} />
                        <span className="text-[12px] font-semibold text-gray-700">{s.stage}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: colors[s.stage] + '18', color: colors[s.stage] }}>{s.count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-gray-700">{formatCurrency(s.mrr)}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                      </div>
                    </div>
                    <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(s.mrr / maxStageMRR) * 100}%`, backgroundColor: colors[s.stage] || '#9CA3AF' }} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className={`mt-1 ml-2 mr-2 mb-1 rounded-lg p-3 ${bgColors[s.stage] || 'bg-gray-50'}`}>
                      {deals.filter(d => d.stage === s.stage).map(d => {
                        const adv = advisors.find(a => a.id === d.advisorId);
                        return (
                          <div key={d.id} className="flex items-center justify-between py-2 border-b border-white/50 last:border-b-0 cursor-pointer hover:opacity-80"
                               onClick={() => { if (adv) { setSelectedAdvisor(adv); setPanelOpen(true); setActiveViewRaw('relationships'); } }}>
                            <div>
                              <p className="text-[11px] font-semibold text-gray-700">{d.name}</p>
                              <p className="text-[10px] text-gray-500">{adv?.name || 'Unassigned'} · {d.daysInStage}d in stage</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <DealHealthBadge health={d.health} />
                              <span className="text-[12px] font-bold text-gray-700">{formatCurrency(d.mrr)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════
  // RELATIONSHIPS (with sub-tabs: Partners, TSDs, White Space)
  // ════════════════════════════════════════════════
  const renderRelationships = () => {
    // Relationship Stage types (new channel-appropriate categories)
    const relationshipStages = ['Prospect', 'Onboarding', 'Activated', 'Scaling', 'Strategic'];
    const getRelationshipStage = (advisor: Advisor): string => {
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
        label: 'Platinum & Gold',
        key: 'Platinum & Gold',
        count: advisorsWithDeals.filter(a => a.tier === 'platinum' || a.tier === 'gold').length,
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
    ];

    // Filtering logic for partners
    let filteredAdvisors = [...advisorsWithDeals];
    if (relationshipFilter === 'Revenue Producing') {
      filteredAdvisors = advisorsWithDeals.filter(a => deals.some(d => d.advisorId === a.id));
    } else if (relationshipFilter === 'High Engagement') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.pulse === 'Strong' || a.pulse === 'Steady');
    } else if (relationshipFilter === 'Platinum & Gold') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.tier === 'platinum' || a.tier === 'gold');
    } else if (relationshipFilter === 'Needs Attention') {
      filteredAdvisors = advisorsWithDeals.filter(a =>
        a.friction === 'High' || a.friction === 'Critical' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall'
      );
    } else if (relationshipFilter === 'New / Onboarding') {
      filteredAdvisors = advisorsWithDeals.filter(a => getRelationshipStage(a) === 'Onboarding');
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

      const introsFrequency = company.totalIntrosQTD > 8 ? 1 : company.totalIntrosQTD > 4 ? 0.5 : 0;
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
      const activityTimeline = [
        { id: 1, type: 'call' as const, icon: Phone, title: 'Quarterly Business Review', details: `Discussed Q2 targets and new product roadmap with ${selectedAdvisor.name}`, time: `${lastContactDays}d ago` },
        { id: 2, type: 'email' as const, icon: Mail, title: 'Campaign Follow-up', details: 'Sent Q2 promotional materials and launch timeline', time: `${lastContactDays + 3}d ago` },
        { id: 3, type: 'meeting' as const, icon: Calendar, title: 'Product Demo', details: `Presented new Analytics Suite with ${selectedAdvisor.name.split(' ')[0]} and team`, time: `${lastContactDays + 8}d ago` },
        { id: 4, type: 'deal' as const, icon: FileText, title: 'Deal Update', details: advisorDeals[0] ? `${advisorDeals[0].name} moved to ${advisorDeals[0].stage}` : 'Deal stage updated', time: `${lastContactDays + 10}d ago` },
        { id: 5, type: 'note' as const, icon: MessageCircle, title: 'Personal Note', details: `${selectedAdvisor.name.split(' ')[0]} mentioned upcoming family plans`, time: `${lastContactDays + 16}d ago` },
        { id: 6, type: 'email' as const, icon: Mail, title: 'Initial Outreach', details: 'First contact email introducing partnership opportunities', time: '1mo ago' },
      ];

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
                      <h2 className="text-[22px] font-semibold font-['Newsreader'] text-gray-900 leading-tight">{selectedAdvisor.name}</h2>
                      <p className="text-12px text-gray-600">
                        {selectedAdvisor.title || 'Partner'} at{' '}
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
                      <span className="text-gray-900 font-medium">{`(${Math.floor(seededRandom(`${selectedAdvisor.id}-area`) * 900 + 100)}) ${Math.floor(seededRandom(`${selectedAdvisor.id}-ph1`) * 900 + 100)}-${Math.floor(seededRandom(`${selectedAdvisor.id}-ph2`) * 9000 + 1000)}`}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-12px">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-900 font-medium truncate">{selectedAdvisor.name.toLowerCase().replace(' ', '.')}@{selectedAdvisor.company.toLowerCase().replace(/\s+/g, '')}.com</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-12px">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{selectedAdvisor.location || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-12px">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">Connected {connectedMonths} months</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                      { label: 'Email', icon: Mail },
                      { label: 'Call', icon: Phone },
                      { label: 'Schedule', icon: Calendar },
                      { label: 'Log Call', icon: FileText },
                    ].map(btn => (
                      <button key={btn.label} className="flex flex-col items-center gap-1 px-2 py-2.5 border border-[#157A6E]/30 text-[#157A6E] rounded-lg hover:bg-[#157A6E]/5 transition-colors">
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
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">MRR</p>
                      <p className="text-[18px] font-bold text-[#157A6E]">{formatCurrency(selectedAdvisor.mrr)}</p>
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
                      <TierBadge tier={selectedAdvisor.tier} />
                    </div>
                  </div>
                </div>

                {/* Personal Intel */}
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                  <h3 className="text-13px font-semibold font-['Newsreader'] text-gray-900 mb-3">Personal Intel</h3>
                  <div className="space-y-2.5">
                    {[
                      { icon: Cake, label: 'Birthday', value: selectedAdvisor.birthday || personalIntel.birthday },
                      { icon: GraduationCap, label: 'Education', value: selectedAdvisor.education || personalIntel.education?.degree },
                      { icon: Heart, label: 'Family', value: selectedAdvisor.family || personalIntel.family },
                      { icon: Star, label: 'Hobbies', value: selectedAdvisor.hobbies || personalIntel.hobbies },
                      { icon: Lightbulb, label: 'Fun Fact', value: selectedAdvisor.funFact || personalIntel.funFact },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-2.5">
                        <item.icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500">{item.label}</p>
                          <p className="text-11px font-medium text-gray-900">{item.value}</p>
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
                  <span className="text-10px font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{actionItems.filter(a => a.status === 'overdue').length} overdue</span>
                </div>
                <div className="space-y-2">
                  {actionItems.map(item => (
                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border-l-3 ${item.status === 'overdue' ? 'bg-red-50/50 border-l-red-400' : item.status === 'pending' ? 'bg-amber-50/30 border-l-amber-300' : 'bg-gray-50 border-l-gray-200'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${item.status === 'overdue' ? 'border-red-400' : 'border-gray-300'}`}>
                        {item.status === 'overdue' && <AlertCircle className="w-3 h-3 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-12px font-medium text-gray-900 truncate">{item.title}</p>
                      </div>
                      <span className={`text-10px font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${item.status === 'overdue' ? 'bg-red-100 text-red-700' : item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.due}
                      </span>
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
              {advisorDeals.length > 0 && (
                <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                  <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Active Deals ({advisorDeals.length})</h3>
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
                </div>
              )}

              {/* Growth Opportunities */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-4">Growth Opportunities</h3>
                <div className="grid grid-cols-2 gap-5">
                  {/* White Space */}
                  {whiteSpace && (
                    <div>
                      <h4 className="text-12px font-semibold text-gray-900 mb-3">White Space Analysis</h4>
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
                      </div>
                    </div>
                  )}
                  {/* Co-Marketing */}
                  <div>
                    <h4 className="text-12px font-semibold text-gray-900 mb-3">Co-Marketing</h4>
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
                  </div>
                </div>
              </div>

              {/* Notes & Activity */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-3">Add a Note</h3>
                <textarea
                  placeholder={`Write a note about ${selectedAdvisor.name.split(' ')[0]}...`}
                  className="w-full text-12px border border-[#e8e5e1] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#157A6E] mb-3"
                  rows={3}
                />
                <button className="px-4 py-2 text-12px font-medium bg-[#157A6E] text-white rounded-lg hover:bg-[#0f5550] transition-colors">Save Note</button>
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
                  <option value="Strategic Top 20">Strategic Top 20</option>
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
                const introsFrequency = company.totalIntrosQTD > 8 ? 1 : company.totalIntrosQTD > 4 ? 0.5 : 0;
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
                          <h2 className="text-[22px] font-semibold font-['Newsreader'] text-gray-900 leading-tight">{tc.name}</h2>
                          <p className="text-12px text-gray-600">{tc.title} at <span className="font-semibold" style={{ color: tc.companyColor }}>{tc.companyName}</span></p>
                        </div>
                      </div>

                      <div className="space-y-2.5 mb-4 pb-4 border-b border-[#e8e5e1]">
                        <div className="flex items-center gap-2.5 text-12px"><Phone className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-900 font-medium">{tc.phone}</span></div>
                        <div className="flex items-center gap-2.5 text-12px"><Mail className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-900 font-medium">{tc.email}</span></div>
                        <div className="flex items-center gap-2.5 text-12px"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-700">{tc.location}</span></div>
                        <div className="flex items-center gap-2.5 text-12px"><Building2 className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-700">{tc.companyName}</span></div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {[
                          { label: 'Email', icon: Mail }, { label: 'Call', icon: Phone },
                          { label: 'Schedule', icon: Calendar }, { label: 'Log Call', icon: FileText },
                        ].map(btn => (
                          <button key={btn.label} className="flex flex-col items-center gap-1 px-2 py-2.5 border border-[#157A6E]/30 text-[#157A6E] rounded-lg hover:bg-[#157A6E]/5 transition-colors">
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
                          <span className="text-11px font-medium text-gray-900">{tc.commPref}</span>
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
                      <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900 mb-3">Add a Note</h3>
                      <textarea placeholder={`Write a note about ${tc.name.split(' ')[0]}...`} className="w-full text-12px border border-[#e8e5e1] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#157A6E] mb-3" rows={3} />
                      <button className="px-4 py-2 text-12px font-medium bg-[#157A6E] text-white rounded-lg hover:bg-[#0f5550] transition-colors">Save Note</button>
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
        'Negotiating': '#F59E0B', 'Closed Won': '#10B981', 'Stalled': '#EF4444',
      };
      const stageBg: Record<string, string> = {
        'Discovery': 'bg-blue-50 text-blue-700', 'Qualifying': 'bg-cyan-50 text-cyan-700',
        'Proposal': 'bg-violet-50 text-violet-700', 'Negotiating': 'bg-amber-50 text-amber-700',
        'Closed Won': 'bg-emerald-50 text-emerald-700', 'Stalled': 'bg-red-50 text-red-700',
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
      'Stalled': '#EF4444',
    };
    const stageBgStyles: Record<string, string> = {
      'Discovery': 'bg-blue-50 text-blue-700',
      'Qualifying': 'bg-cyan-50 text-cyan-700',
      'Proposal': 'bg-violet-50 text-violet-700',
      'Negotiating': 'bg-amber-50 text-amber-700',
      'Closed Won': 'bg-emerald-50 text-emerald-700',
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
            <button
              onClick={() => { setShowDealModal(true); setEditingDeal(null); }}
              className="px-4 py-2 bg-[#157A6E] text-white rounded-md text-12px font-semibold hover:bg-[#12675b] transition-colors"
            >
              + Add Deal
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
                    <div className={`rounded-lg overflow-hidden border border-[#e8e5e1] ${stage === 'Stalled' ? 'bg-red-50/50' : 'bg-[#F7F5F2]'}`}>
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
                              <div key={d.id}
                                onClick={() => setSelectedDeal(d)}
                                className="bg-white p-3 rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-[#e8e5e1]">
                                <p className="text-12px font-semibold text-gray-800 mb-1">{d.name}</p>
                                <p className="text-10px text-gray-600 mb-2">{adv?.name || 'Unassigned'} · {adv?.company || ''}</p>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-11px font-medium text-[#157A6E]">{formatCurrency(d.mrr)}</span>
                                  <span className="text-10px text-gray-500">{d.daysInStage}d</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <DealHealthBadge health={d.health} />
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
    const frictionIssues = advisors.filter(a => a.friction === 'High' || a.friction === 'Critical');
    const healthyPartners = advisors.filter(a => a.friction === 'Low' && (a.pulse === 'Strong' || a.pulse === 'Steady'));

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

    // ── Playbook Templates (cadence-based, from The Channel Standard) ──
    const playbookTemplates = [
      {
        id: 'win-back',
        category: 'Retention',
        title: 'Win-Back Campaign',
        subtitle: 'Re-engage dormant or at-risk partners',
        icon: '🔥',
        color: '#e53e3e',
        bgColor: 'bg-red-50',
        borderColor: 'border-l-red-500',
        tagColor: 'bg-red-100 text-red-800',
        duration: '21 days',
        applicableTo: 'Fading pulse, Slipping/Freefall trajectory, High/Critical friction',
        steps: [
          { day: 1, label: 'Pull complaint history & support tickets', desc: 'Review CRM for open issues, commission disputes, and unanswered requests', phase: 'Diagnose' },
          { day: 2, label: 'Internal resource coordination', desc: 'Brief SE, product team, and leadership on situation. Align on what we can offer.', phase: 'Diagnose' },
          { day: 3, label: 'Executive outreach call', desc: 'Direct call from channel manager — acknowledge issues, listen first. No pitching.', phase: 'Engage' },
          { day: 5, label: 'Deliver resolution plan', desc: 'Service credit, SLA improvement, dedicated SE, or whatever was agreed. Put it in writing.', phase: 'Engage' },
          { day: 7, label: 'Follow-up check-in', desc: 'Confirm resolution delivery. Ask: "What else is broken that you haven\'t told us?"', phase: 'Recover' },
          { day: 10, label: 'Re-enablement session', desc: '1:1 training on new features, updated battlecards, competitive positioning refresh', phase: 'Recover' },
          { day: 14, label: 'Joint selling opportunity', desc: 'Bring a qualified lead or co-sell opportunity. Show renewed investment.', phase: 'Activate' },
          { day: 21, label: 'Relationship health review', desc: 'Formal check-in: pulse, friction, trajectory reassessment. Set ongoing cadence.', phase: 'Activate' },
        ],
      },
      {
        id: 'onboarding',
        category: 'Activation',
        title: 'New Partner Onboarding',
        subtitle: 'First 90 days — get to first deal fast',
        icon: '🚀',
        color: '#3B82F6',
        bgColor: 'bg-blue-50',
        borderColor: 'border-l-blue-500',
        tagColor: 'bg-blue-100 text-blue-800',
        duration: '90 days',
        applicableTo: 'New partners, Onboarding tier',
        steps: [
          { day: 1, label: 'Welcome call + expectation setting', desc: 'Introduce yourself as their single point of contact. Set response SLA expectations. Document comm preferences.', phase: 'Week 1' },
          { day: 3, label: 'Portal access & training enrollment', desc: 'Verify TSD portal access, marketplace listing, and training platform credentials', phase: 'Week 1' },
          { day: 5, label: 'First enablement session', desc: 'Product overview, competitive positioning, ideal customer profile. Share battlecards.', phase: 'Week 1' },
          { day: 7, label: 'Intro to TSD field team', desc: 'Connect partner with TSD channel manager and SE. These relationships determine visibility.', phase: 'Week 1' },
          { day: 14, label: 'Pipeline building workshop', desc: 'Help identify 3-5 prospects from their book. Practice positioning and objection handling.', phase: 'Week 2' },
          { day: 21, label: 'First deal registration', desc: 'Target: first deal reg by day 21. Channel manager joins first customer call.', phase: 'Week 3' },
          { day: 30, label: '30-day milestone review', desc: 'Review: portal adoption, training completion, pipeline status, relationship health', phase: 'Month 1' },
          { day: 45, label: 'Co-sell support on active deal', desc: 'Provide SE support, custom pricing, or executive sponsor for their best opportunity', phase: 'Month 2' },
          { day: 60, label: '60-day milestone review', desc: 'Pipeline health check. Adjust enablement focus based on selling patterns.', phase: 'Month 2' },
          { day: 75, label: 'Introduce to partner community', desc: 'Connect to advisory council, Slack channels, upcoming events. Build belonging.', phase: 'Month 3' },
          { day: 90, label: '90-day graduation review', desc: 'Full assessment: deals registered, revenue, engagement score. Assign permanent tier.', phase: 'Month 3' },
        ],
      },
      {
        id: 'tier-upgrade',
        category: 'Growth',
        title: 'Tier Advancement Program',
        subtitle: 'Move Gold → Platinum through structured development',
        icon: '⬆️',
        color: '#157A6E',
        bgColor: 'bg-[#F0FAF8]',
        borderColor: 'border-l-[#157A6E]',
        tagColor: 'bg-green-100 text-green-800',
        duration: '60 days',
        applicableTo: 'Gold tier with Climbing/Accelerating trajectory',
        steps: [
          { day: 1, label: 'Strategic business plan review', desc: 'Deep-dive: current pipeline, growth targets, vertical focus, co-marketing interests', phase: 'Plan' },
          { day: 3, label: 'Set Platinum qualification criteria', desc: 'Define targets: deal count, revenue threshold, engagement score, training completion', phase: 'Plan' },
          { day: 7, label: 'Assign dedicated SE', desc: 'Pair with solutions engineer for priority pre-sale support on all opportunities', phase: 'Invest' },
          { day: 14, label: 'Co-marketing campaign launch', desc: 'Joint webinar, case study, or content piece. MDF allocation for partner promotion.', phase: 'Invest' },
          { day: 21, label: 'Pipeline acceleration sprint', desc: 'Identify 5 high-potential deals. Provide custom pricing, expedited deal reg, exec sponsors.', phase: 'Execute' },
          { day: 30, label: 'Mid-program review', desc: 'Check progress against Platinum criteria. Adjust support and remove blockers.', phase: 'Execute' },
          { day: 45, label: 'SPIFF or incentive activation', desc: 'Launch targeted SPIFF for final push. Recognition in partner community.', phase: 'Accelerate' },
          { day: 60, label: 'Tier promotion decision', desc: 'Formal review against criteria. Promote, extend program, or set new targets.', phase: 'Accelerate' },
        ],
      },
      {
        id: 'activation',
        category: 'Activation',
        title: 'Dormant Partner Activation',
        subtitle: 'Re-activate Silver partners with no recent deals',
        icon: '⚡',
        color: '#D69E2E',
        bgColor: 'bg-amber-50',
        borderColor: 'border-l-amber-400',
        tagColor: 'bg-amber-100 text-amber-800',
        duration: '30 days',
        applicableTo: 'Silver tier, 60+ days since last deal, low engagement',
        steps: [
          { day: 1, label: 'Audit partner history', desc: 'Review past deals, training completion, last contact, comm preferences. Find what worked before.', phase: 'Research' },
          { day: 3, label: 'Personal outreach — no pitch', desc: 'Call or email about them, not us. Ask about their business, challenges, market shifts.', phase: 'Research' },
          { day: 5, label: 'Share competitive intelligence', desc: 'Give value first: market data, competitor moves, vertical insights relevant to their practice', phase: 'Re-engage' },
          { day: 7, label: 'Enablement refresh session', desc: 'Updated product training focused on what changed since they last engaged', phase: 'Re-engage' },
          { day: 14, label: 'Bring a warm lead', desc: 'Source an opportunity in their territory or vertical. Nothing re-activates like revenue.', phase: 'Activate' },
          { day: 21, label: 'Co-sell on active opportunity', desc: 'Joint call with their prospect. Provide SE, custom pricing, whatever accelerates.', phase: 'Activate' },
          { day: 30, label: 'Activation assessment', desc: 'Deal registered? Pipeline built? If yes, upgrade cadence. If no, reassess partnership.', phase: 'Assess' },
        ],
      },
      {
        id: 'qbr-prep',
        category: 'Cadence',
        title: 'Quarterly Business Review',
        subtitle: 'Come with data, not excuses',
        icon: '📊',
        color: '#6366F1',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-l-indigo-500',
        tagColor: 'bg-indigo-100 text-indigo-800',
        duration: '14 days',
        applicableTo: 'All Platinum & Gold partners, all TSDs',
        steps: [
          { day: 1, label: 'Pull performance data', desc: 'Pipeline, revenue, deal velocity, conversion rate, days-to-close, partner engagement metrics', phase: 'Prepare' },
          { day: 3, label: 'Build QBR deck', desc: 'Key wins, pipeline health, competitive landscape, growth opportunities, asks', phase: 'Prepare' },
          { day: 5, label: 'Internal dry-run', desc: 'Review with leadership. Align on commitments you can make and asks you need to escalate.', phase: 'Prepare' },
          { day: 7, label: 'Send pre-read to partner', desc: 'Share agenda and key data 48h before meeting. Respect their prep time.', phase: 'Execute' },
          { day: 9, label: 'Conduct QBR', desc: '90 min: performance review, strategic discussion, next-quarter planning, mutual commitments', phase: 'Execute' },
          { day: 10, label: 'Send follow-up within 24h', desc: 'Meeting notes, agreed action items, timeline, and owners. No ambiguity.', phase: 'Follow-up' },
          { day: 14, label: 'Complete all committed actions', desc: 'Deliver everything promised in QBR. Speed of follow-through defines credibility.', phase: 'Follow-up' },
        ],
      },
      {
        id: 'cross-sell',
        category: 'Growth',
        title: 'Cross-Sell Expansion',
        subtitle: 'Expand product footprint with existing high-performers',
        icon: '📈',
        color: '#157A6E',
        bgColor: 'bg-[#F0FAF8]',
        borderColor: 'border-l-[#157A6E]',
        tagColor: 'bg-green-100 text-green-800',
        duration: '30 days',
        applicableTo: 'Platinum/Gold with Accelerating trajectory, single-product sellers',
        steps: [
          { day: 1, label: 'Identify whitespace', desc: 'Analyze partner\'s current product mix. Map gaps against full portfolio.', phase: 'Analyze' },
          { day: 3, label: 'Build business case', desc: 'ROI model: what the partner leaves on the table by not selling additional products', phase: 'Analyze' },
          { day: 5, label: 'Product-specific enablement', desc: 'Targeted training on the cross-sell product. Focus on how it pairs with what they already sell.', phase: 'Enable' },
          { day: 10, label: 'Joint proposal on live deal', desc: 'Find an active opportunity where the additional product adds value. Build the proposal together.', phase: 'Enable' },
          { day: 14, label: 'SPIFF incentive for first deal', desc: 'Accelerator bonus for first closed deal on the new product line', phase: 'Incentivize' },
          { day: 21, label: 'Pipeline review — new product', desc: 'Check: are they building pipeline on the new product independently?', phase: 'Measure' },
          { day: 30, label: 'Expansion assessment', desc: 'Is the partner now multi-product? Adjust tier scoring and engagement plan.', phase: 'Measure' },
        ],
      },
    ];

    // ── Active playbooks (dynamic, tied to real advisor data) ──
    const playbooks = [
      ...atRiskAdvisors.slice(0, 2).map(a => ({ priority: 'critical' as const, templateId: 'win-back', title: `Win-Back: ${a.name}`, desc: `${a.diagnosis || 'Custom retention strategy needed'}. ${formatCurrency(a.mrr)} at risk.`, amount: formatCurrency(a.mrr), amountRaw: a.mrr, days: 7, currentStep: 2, steps: [{ label: 'Pull complaint history', done: true }, { label: 'Executive outreach call', active: true }, { label: 'Service credit + SLA', done: false }, { label: 'Weekly check-in cadence', done: false }], signalTitle: `Churn Risk — ${a.name}`, signalType: 'churn' as const, advisorId: a.id })),
      ...advisors.filter(a => a.trajectory === 'Accelerating' || a.trajectory === 'Climbing').slice(0, 1).map(a => ({ priority: 'high' as const, templateId: 'cross-sell', title: `Growth: ${a.name} → Cross-Sell`, desc: `${a.trajectory} trajectory. Expand product footprint.`, amount: `+${formatCurrency(Math.round(a.mrr * 0.6))}`, amountRaw: Math.round(a.mrr * 0.6), days: 14, currentStep: 1, steps: [{ label: 'Identify cross-sell products', done: true }, { label: 'Build joint proposal', active: true }, { label: 'Strategy call', done: false }, { label: 'First deal registered', done: false }], signalTitle: `Expansion — ${a.name}`, signalType: 'growth' as const, advisorId: a.id })),
      ...frictionIssues.slice(0, 1).map(a => ({ priority: 'medium' as const, templateId: 'win-back', title: `Retention: ${a.name}`, desc: `${a.friction} friction. QBR + service review needed.`, amount: formatCurrency(a.mrr), amountRaw: a.mrr, days: 10, currentStep: 2, steps: [{ label: 'Resolve open tickets', done: true }, { label: 'Acknowledge issues', done: true }, { label: 'Schedule QBR', active: true }, { label: 'Monthly check-in commitment', done: false }], signalTitle: `Churn Risk — ${a.name}`, signalType: 'churn' as const, advisorId: a.id })),
      ...advisors.filter(a => a.tier === 'gold' && (a.trajectory === 'Accelerating' || a.trajectory === 'Climbing')).slice(0, 1).map(a => ({ priority: 'high' as const, templateId: 'tier-upgrade', title: `Tier Upgrade: ${a.name} → Platinum`, desc: `Strong trajectory. ${formatCurrency(a.mrr)} MRR with room to grow.`, amount: `+${formatCurrency(Math.round(a.mrr * 0.4))}`, amountRaw: Math.round(a.mrr * 0.4), days: 30, currentStep: 1, steps: [{ label: 'Strategic plan review', done: true }, { label: 'Set Platinum criteria', active: true }, { label: 'Assign dedicated SE', done: false }, { label: 'Pipeline acceleration sprint', done: false }, { label: 'Tier promotion decision', done: false }], signalTitle: `Growth — ${a.name}`, signalType: 'growth' as const, advisorId: a.id })),
      ...advisors.filter(a => a.tier === 'silver' && a.pulse === 'Fading').slice(0, 1).map(a => ({ priority: 'medium' as const, templateId: 'activation', title: `Activate: ${a.name}`, desc: `Dormant Silver partner. ${formatCurrency(a.mrr)} MRR. Low engagement — needs re-activation.`, amount: formatCurrency(a.mrr), amountRaw: a.mrr, days: 21, currentStep: 0, steps: [{ label: 'Audit partner history', done: true }, { label: 'Personal outreach — no pitch', active: true }, { label: 'Share competitive intelligence', done: false }, { label: 'Bring a warm lead', done: false }, { label: 'Activation assessment', done: false }], signalTitle: `Dormant — ${a.name}`, signalType: 'stall' as const, advisorId: a.id })),
    ];

    // ── Recommended playbooks (suggestions based on advisor signals) ──
    const recommendedPlaybooks: Array<{template: typeof playbookTemplates[0]; advisors: Advisor[]; reason: string; urgency: 'critical' | 'high' | 'medium'}> = [];

    // Win-back recommendations
    const winBackCandidates = advisors.filter(a => (a.pulse === 'Fading' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall') && !playbooks.some(p => p.advisorId === a.id));
    if (winBackCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[0], advisors: winBackCandidates.slice(0, 3), reason: `${winBackCandidates.length} partner${winBackCandidates.length > 1 ? 's' : ''} showing declining engagement — ${formatCurrency(winBackCandidates.reduce((s,a)=>s+a.mrr,0))} MRR at risk`, urgency: 'critical' });
    }

    // Onboarding recommendations
    const onboardingCandidates = advisors.filter(a => a.tier === 'onboarding' || (a.tier === 'silver' && Math.floor((Date.now() - new Date(a.connectedSince).getTime()) / 86400000) < 90));
    if (onboardingCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[1], advisors: onboardingCandidates.slice(0, 3), reason: `${onboardingCandidates.length} partner${onboardingCandidates.length > 1 ? 's' : ''} in first 90 days — first deal velocity is critical`, urgency: 'high' });
    }

    // Tier upgrade recommendations
    const tierUpgradeCandidates = advisors.filter(a => a.tier === 'gold' && (a.pulse === 'Strong' || a.trajectory === 'Accelerating') && !playbooks.some(p => p.advisorId === a.id));
    if (tierUpgradeCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[2], advisors: tierUpgradeCandidates.slice(0, 3), reason: `${tierUpgradeCandidates.length} Gold partner${tierUpgradeCandidates.length > 1 ? 's' : ''} showing Platinum potential — invest now to capture growth`, urgency: 'high' });
    }

    // Activation recommendations
    const activationCandidates = advisors.filter(a => a.tier === 'silver' && (a.engagementBreakdown?.engagement === 'Fading' || a.pulse === 'Fading') && !playbooks.some(p => p.advisorId === a.id));
    if (activationCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[3], advisors: activationCandidates.slice(0, 3), reason: `${activationCandidates.length} Silver partner${activationCandidates.length > 1 ? 's' : ''} going dormant — activate before they defect`, urgency: 'medium' });
    }

    // QBR recommendations
    const qbrCandidates = advisors.filter(a => a.tier === 'platinum' || a.tier === 'gold');
    if (qbrCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[4], advisors: qbrCandidates.slice(0, 3), reason: `Q2 QBRs due for ${qbrCandidates.length} Platinum & Gold partners — come with data, not excuses`, urgency: 'medium' });
    }

    // Cross-sell recommendations
    const crossSellCandidates = advisors.filter(a => (a.tier === 'platinum' || a.tier === 'gold') && a.trajectory === 'Accelerating' && !playbooks.some(p => p.templateId === 'cross-sell' && p.advisorId === a.id));
    if (crossSellCandidates.length > 0) {
      recommendedPlaybooks.push({ template: playbookTemplates[5], advisors: crossSellCandidates.slice(0, 3), reason: `${crossSellCandidates.length} high-performers selling single product — whitespace expansion opportunity`, urgency: 'high' });
    }

    const healthPartners = [...advisors].sort((a, b) => b.mrr - a.mrr).slice(0, 8);

    const roadmapItems = [
      ...playbooks.slice(0, 2).map(p => ({ phase: 'active' as const, title: p.title, desc: `${p.days} days remaining` })),
      ...coMarketingOpportunities.slice(0, 2).map(o => ({ phase: 'next' as const, title: `Co-Marketing: ${o.advisor.name}`, desc: o.type })),
      { phase: 'planned' as const, title: 'Mid-Quarter Pipeline Review', desc: 'End of April' },
    ];

    const calEvents = [
      { day: 9, label: playbooks[0]?.title || 'Retention deadline' },
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
          { id: 'playbooks' as const, label: 'Playbooks', count: playbooks.length },
          { id: 'diagnostics' as const, label: 'Diagnostics' },
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
                      <button onClick={() => { setPlaybookModalSignal({ type: sig.type, title: sig.title, desc: sig.desc, partnerName: sig.partnerName, mrr: sig.mrr }); setShowPlaybookModal(true); }} className="block text-[10px] text-[#157A6E] font-semibold mt-1 hover:underline cursor-pointer">→ Create Playbook</button>
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
                <button onClick={() => setIntelligenceSubTab('playbooks')} className="text-[10px] text-[#157A6E] font-semibold cursor-pointer hover:underline">View all {playbooks.length} →</button>
              </div>
              <div className="space-y-2">
                {playbooks.map((pb, i) => (
                  <div key={i} className={`border-l-[3px] rounded-r-md bg-gray-50 p-3 ${pb.priority === 'critical' ? 'border-red-500' : pb.priority === 'high' ? 'border-amber-400' : 'border-[#157A6E]'}`}>
                    <h4 className="text-[12px] font-semibold text-gray-800">{pb.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">{pb.desc}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                      <span className={pb.priority === 'critical' ? 'text-red-500 font-semibold' : pb.priority === 'high' ? 'text-amber-600 font-semibold' : ''}>{pb.priority.charAt(0).toUpperCase() + pb.priority.slice(1)}</span>
                      <span className="text-[#157A6E] font-semibold">{pb.amount}</span>
                      <span>{pb.days} days</span>
                    </div>
                  </div>
                ))}
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
                    <button onClick={() => { setPlaybookModalSignal({ type: sig.type, title: sig.title, desc: sig.desc, partnerName: sig.partnerName, mrr: sig.mrr }); setShowPlaybookModal(true); }} className="mt-2 px-3 py-1.5 bg-[#157A6E] text-white text-[11px] font-semibold rounded-md hover:bg-[#126a5f] transition-colors">→ Create Playbook</button>
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
      const protectedMRR = playbooks.filter(p => p.priority === 'critical' || p.priority === 'medium').reduce((s, p) => s + p.amountRaw, 0);
      const expansionMRR = playbooks.filter(p => p.priority === 'high').reduce((s, p) => s + p.amountRaw, 0);
      const avgDays = Math.round(playbooks.reduce((s, p) => s + p.days, 0) / (playbooks.length || 1));

      const phaseColors: Record<string, string> = {
        'Diagnose': 'bg-red-100 text-red-700', 'Engage': 'bg-orange-100 text-orange-700', 'Recover': 'bg-amber-100 text-amber-700', 'Activate': 'bg-green-100 text-green-700',
        'Week 1': 'bg-blue-100 text-blue-700', 'Week 2': 'bg-blue-100 text-blue-700', 'Week 3': 'bg-indigo-100 text-indigo-700', 'Month 1': 'bg-violet-100 text-violet-700', 'Month 2': 'bg-purple-100 text-purple-700', 'Month 3': 'bg-fuchsia-100 text-fuchsia-700',
        'Plan': 'bg-blue-100 text-blue-700', 'Invest': 'bg-indigo-100 text-indigo-700', 'Execute': 'bg-amber-100 text-amber-700', 'Accelerate': 'bg-green-100 text-green-700',
        'Research': 'bg-gray-100 text-gray-700', 'Re-engage': 'bg-amber-100 text-amber-700', 'Assess': 'bg-blue-100 text-blue-700',
        'Prepare': 'bg-blue-100 text-blue-700', 'Follow-up': 'bg-green-100 text-green-700',
        'Analyze': 'bg-indigo-100 text-indigo-700', 'Enable': 'bg-amber-100 text-amber-700', 'Incentivize': 'bg-purple-100 text-purple-700', 'Measure': 'bg-green-100 text-green-700',
      };

      return (
        <div className="space-y-5">
          {subTabBar}

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <KPICard label="Active Playbooks" value={`${playbooks.length}`} change={`${playbooks.filter(p=>p.priority==='critical').length} critical, ${playbooks.filter(p=>p.priority==='high').length} high`} changeType="neutral" />
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
                  <div key={ri} className={`${rec.template.bgColor} rounded-[10px] border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-all border-l-4 ${rec.template.borderColor}`}>
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
              {playbooks.map((pb, i) => {
                const doneSteps = pb.steps.filter(s => s.done).length;
                const totalSteps = pb.steps.length;
                const pct = Math.round((doneSteps / totalSteps) * 100);
                const template = playbookTemplates.find(t => t.id === pb.templateId);
                return (
                  <div key={i} className={`bg-white rounded-[10px] border border-[#e8e5e1] p-5 border-l-4 ${pb.priority === 'critical' ? 'border-l-red-500' : pb.priority === 'high' ? 'border-l-amber-400' : 'border-l-blue-500'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${pb.priority === 'critical' ? 'bg-red-100 text-red-800' : pb.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                            {pb.priority}
                          </span>
                          {template && <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${template.tagColor}`}>{template.category}</span>}
                        </div>
                        <h3 className="text-[15px] font-bold text-gray-800 font-serif">{pb.title}</h3>
                        <p className="text-[12px] text-gray-500 mt-1 leading-relaxed max-w-xl">{pb.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-[18px] font-bold ${pb.priority === 'high' ? 'text-[#157A6E]' : 'text-red-500'}`}>{pb.amount}</div>
                        <div className="text-[10px] text-gray-400">{pb.priority === 'high' ? 'Expansion potential' : 'MRR at risk'}</div>
                        <div className={`text-[10px] font-semibold mt-1 ${pb.days <= 7 ? 'text-red-500' : 'text-amber-600'}`}>Deadline: {pb.days} days</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-[6px] bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#157A6E] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-[#157A6E]">{pct}%</span>
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Action Steps</h4>
                      {pb.steps.map((step, si) => (
                        <div key={si} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${step.done ? 'bg-green-100 text-green-700' : step.active ? 'bg-[#157A6E] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {step.done ? '✓' : si + 1}
                          </div>
                          <span className={`text-[12px] ${step.done ? 'text-gray-400 line-through' : step.active ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>{step.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Signal source */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <span className="text-[9px] font-bold uppercase text-gray-400">Created from signal</span>
                      <div className="flex items-center gap-2 mt-1.5 bg-gray-50 rounded-md px-3 py-2">
                        <div className={`w-[7px] h-[7px] rounded-full ${signalDotColor(pb.signalType)}`} />
                        <span className="text-[11px] text-gray-600 font-medium">{pb.signalTitle}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div onClick={() => { setPlaybookModalSignal(null); setShowPlaybookModal(true); }} className="bg-white rounded-[10px] border-2 border-dashed border-gray-200 p-6 text-center cursor-pointer hover:border-[#157A6E] transition-colors">
                <div className="text-[20px] text-gray-300 mb-1">+</div>
                <div className="text-[12px] font-semibold text-[#157A6E]">Create New Playbook</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Build from a signal or start from scratch</div>
              </div>
            </div>

            {/* Sidebar: deadlines + stats + templates */}
            <div className="space-y-4 self-start sticky top-[105px]">
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Upcoming Deadlines</h3>
                {[...playbooks].sort((a,b) => a.days - b.days).map((pb, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-b-0">
                    <div className={`w-2 h-2 rounded-full ${pb.priority === 'critical' ? 'bg-red-500' : pb.priority === 'high' ? 'bg-amber-400' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-700 truncate">{pb.title}</p>
                    </div>
                    <span className={`text-[10px] font-bold ${pb.days <= 7 ? 'text-red-500' : 'text-amber-600'}`}>{pb.days}d</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Playbook Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Active', value: playbooks.length },
                    { label: 'Critical', value: playbooks.filter(p=>p.priority==='critical').length },
                    { label: 'Avg Progress', value: `${Math.round(playbooks.reduce((s,p) => { const done = p.steps.filter(st=>st.done).length; return s + (done/p.steps.length)*100; }, 0) / (playbooks.length||1))}%` },
                    { label: 'Total MRR', value: formatCurrency(playbooks.reduce((s,p) => s + p.amountRaw, 0)) },
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
              <div key={ti} className={`bg-white rounded-[10px] border border-[#e8e5e1] p-5 hover:shadow-md transition-all cursor-pointer border-l-4 ${tmpl.borderColor}`}>
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
                  <p className="text-[11px] text-gray-500 mt-0.5">{a.company} · {a.tier === 'platinum' ? 'Platinum' : a.tier === 'gold' ? 'Gold' : a.tier === 'silver' ? 'Silver' : a.tier === 'onboarding' ? 'Onboarding' : 'Partner'}</p>
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
                <button onClick={() => { const linkedSigs = signals.filter(s => s.partnerName === a.name); const topSig = linkedSigs[0]; setPlaybookModalSignal(topSig ? { type: topSig.type, title: topSig.title, desc: topSig.desc, partnerName: a.name, mrr: a.mrr } : { type: 'intel', title: `${a.name} Engagement Plan`, desc: `Strategic playbook for ${a.name}`, partnerName: a.name, mrr: a.mrr }); setShowPlaybookModal(true); }} className="px-3 py-1.5 bg-[#157A6E] text-white text-[11px] font-semibold rounded-md hover:bg-[#126a5f]">
                  {playbooks.find(p => p.title.includes(a.name)) ? 'View Playbook →' : 'Create Playbook →'}
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
  };

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
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <a href="/live" className="text-12px text-[#157A6E] hover:underline flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Admin
                </a>
                <h1 className="text-xl font-semibold font-['Newsreader'] text-gray-800">
                  {NAV_ITEMS_MANAGER.find(n => n.id === activeView)?.label || 'Dashboard'}
                </h1>
                <span className="text-10px font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">LIVE</span>
              </div>
              <button onClick={fetchData} className="flex items-center gap-1 text-12px text-gray-500 hover:text-[#157A6E]">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            {viewRenderers[activeView]?.() || renderCommandCenter()}
          </div>
        </main>
      </div>
      {/* Playbook Creation Modal */}
      {showPlaybookModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPlaybookModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[560px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-bold font-['Newsreader'] text-gray-800">Create Playbook</h2>
                <button onClick={() => setShowPlaybookModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              {playbookModalSignal && (
                <div className="flex items-center gap-2 mt-3 bg-gray-50 rounded-lg px-3 py-2">
                  <div className={`w-2 h-2 rounded-full ${playbookModalSignal.type === 'churn' ? 'bg-red-500' : playbookModalSignal.type === 'growth' ? 'bg-[#157A6E]' : playbookModalSignal.type === 'stall' ? 'bg-amber-400' : 'bg-blue-500'}`} />
                  <span className="text-[11px] text-gray-600">From signal: <strong>{playbookModalSignal.title}</strong></span>
                </div>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Playbook Name</label>
                <input type="text" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#157A6E]"
                  defaultValue={playbookModalSignal ? (playbookModalSignal.type === 'churn' ? `Win-Back: ${playbookModalSignal.partnerName || ''}` : playbookModalSignal.type === 'growth' ? `Growth: ${playbookModalSignal.partnerName || ''}` : playbookModalSignal.title) : ''} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                  <div className="flex gap-2 mt-1">
                    {(['critical', 'high', 'medium'] as const).map(p => (
                      <button key={p} onClick={() => setPlaybookPriority(p)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${playbookPriority === p
                          ? p === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' : p === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Deadline (days)</label>
                  <div className="flex gap-2 mt-1">
                    {[7, 14, 21, 30].map(d => (
                      <button key={d} onClick={() => setPlaybookDeadline(d)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${playbookDeadline === d ? 'bg-[#157A6E] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {playbookModalSignal?.mrr && (
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">{playbookModalSignal.type === 'growth' ? 'Expansion Potential' : 'MRR at Risk'}</span>
                  <span className={`text-[16px] font-bold ${playbookModalSignal.type === 'growth' ? 'text-[#157A6E]' : 'text-red-500'}`}>
                    {playbookModalSignal.type === 'growth' ? '+' : ''}{formatCurrency(playbookModalSignal.mrr)}
                  </span>
                </div>
              )}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Action Steps</label>
                <div className="space-y-2 mt-1">
                  {playbookSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0">{i + 1}</div>
                      <input type="text" value={step} onChange={e => { const ns = [...playbookSteps]; ns[i] = e.target.value; setPlaybookSteps(ns); }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#157A6E]"
                        placeholder={i === 0 ? 'First action step...' : i === 1 ? 'Second step...' : 'Additional step...'} />
                      {playbookSteps.length > 1 && (
                        <button onClick={() => setPlaybookSteps(playbookSteps.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setPlaybookSteps([...playbookSteps, ''])} className="text-[11px] text-[#157A6E] font-semibold hover:underline">+ Add step</button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Owner</label>
                <input type="text" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#157A6E]" defaultValue="Jordan R." />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowPlaybookModal(false)} className="px-4 py-2 text-[12px] font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={() => { setShowPlaybookModal(false); setIntelligenceSubTab('playbooks'); }}
                className="px-4 py-2 text-[12px] font-semibold text-white bg-[#157A6E] rounded-lg hover:bg-[#126a5f]">Create Playbook</button>
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
      <AIChat role="manager" selectedAdvisor={selectedAdvisor} live={true} />
    </div>
  );
}
