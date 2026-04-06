'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, DollarSign, Brain, Activity,
  TrendingDown, TrendingUp, Zap, Users, ChevronDown, ChevronUp, X,
  ArrowLeft, MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays,
  Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, RefreshCw,
  Megaphone, Star, TrendingUp as TrendingUpIcon, CheckCircle, AlertCircle as AlertCircleIcon, Edit, Plus,
  LayoutGrid, Map, FileText, Mail, Building2, ArrowUpRight, BarChart3, UserPlus, Calendar, Shield, PlayCircle, ChevronRight,
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
import { SupplierAccountabilityCard, AdvisorSentimentFeed } from '@/components/shared/RatingsDisplay';
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
  const [relationshipViewMode, setRelationshipViewMode] = useState<'partners' | 'tsds' | 'territory' | 'white-space'>('partners');
  const [contactTypeFilter, setContactTypeFilter] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string | null>(null);
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

  const setActiveView = (view: string) => {
    setActiveViewRaw(view);
    if (view !== 'relationships') {
      setSelectedAdvisor(null);
      setPanelOpen(false);
    }
    setExpandedKPIPanel(null);
    setExpandedKPI(null);
    setDrillDown(null);
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
          { id: 'tel-1', name: 'Sarah Mitchell', title: 'Channel Development Manager', role: 'Channel Manager', email: 's.mitchell@telarus.com', phone: '(801) 555-4821', lastContact: '2026-03-29', introsQTD: 8, introsAllTime: 47, revenueAttributed: 142000 },
          { id: 'tel-2', name: 'James Thornton', title: 'Solutions Engineer', role: 'Sales Engineer', email: 'j.thornton@telarus.com', phone: '(801) 555-3392', lastContact: '2026-03-25', introsQTD: 5, introsAllTime: 31, revenueAttributed: 88000 },
          { id: 'tel-3', name: 'Rachael Nguyen', title: 'Partner Success Lead', role: 'Channel Manager', email: 'r.nguyen@telarus.com', phone: '(801) 555-1104', lastContact: '2026-04-01', introsQTD: 12, introsAllTime: 63, revenueAttributed: 215000 },
        ],
      },
      {
        name: 'Avant',
        logo: '🟧',
        description: 'Leading channel platform for IT decision making',
        contacts: [
          { id: 'av-1', name: 'Derek Paulson', title: 'Channel Account Manager', role: 'Channel Manager', email: 'd.paulson@avant.com', phone: '(312) 555-6678', lastContact: '2026-03-31', introsQTD: 10, introsAllTime: 52, revenueAttributed: 178000 },
          { id: 'av-2', name: 'Monica Reeves', title: 'Solutions Architect', role: 'Sales Engineer', email: 'm.reeves@avant.com', phone: '(312) 555-2241', lastContact: '2026-03-28', introsQTD: 6, introsAllTime: 28, revenueAttributed: 95000 },
        ],
      },
      {
        name: 'Bridgepointe',
        logo: '🟩',
        description: 'Technology advisory and distribution platform',
        contacts: [
          { id: 'bp-1', name: 'Kevin Marsh', title: 'VP Channel Partnerships', role: 'Leadership', email: 'k.marsh@bridgepointe.com', phone: '(925) 555-8812', lastContact: '2026-03-22', introsQTD: 4, introsAllTime: 19, revenueAttributed: 67000 },
          { id: 'bp-2', name: 'Alicia Tran', title: 'Partner Development Rep', role: 'PDM/SPDM', email: 'a.tran@bridgepointe.com', phone: '(925) 555-3350', lastContact: '2026-03-27', introsQTD: 7, introsAllTime: 34, revenueAttributed: 112000 },
        ],
      },
      {
        name: 'Intelisys',
        logo: '🟪',
        description: 'Telecommunications master agent and solutions distributor',
        contacts: [
          { id: 'in-1', name: 'Robert Cianci', title: 'Channel Director', role: 'Leadership', email: 'r.cianci@intelisys.com', phone: '(203) 555-9901', lastContact: '2026-03-30', introsQTD: 9, introsAllTime: 41, revenueAttributed: 156000 },
          { id: 'in-2', name: 'Patricia Dunn', title: 'Sales Engineer', role: 'Sales Engineer', email: 'p.dunn@intelisys.com', phone: '(203) 555-4478', lastContact: '2026-03-18', introsQTD: 3, introsAllTime: 22, revenueAttributed: 71000 },
          { id: 'in-3', name: 'Tyler Washington', title: 'Partner Enablement Manager', role: 'Channel Manager', email: 't.washington@intelisys.com', phone: '(203) 555-6632', lastContact: '2026-04-01', introsQTD: 11, introsAllTime: 55, revenueAttributed: 198000 },
        ],
      },
      {
        name: 'AppDirect',
        logo: '🔵',
        description: 'B2B subscription commerce platform and marketplace',
        contacts: [
          { id: 'ad-1', name: 'Yuki Tanaka', title: 'Partner Growth Manager', role: 'Channel Manager', email: 'y.tanaka@appdirect.com', phone: '(415) 555-7723', lastContact: '2026-03-26', introsQTD: 6, introsAllTime: 25, revenueAttributed: 83000 },
          { id: 'ad-2', name: 'Chris Brennan', title: 'Solutions Consultant', role: 'Sales Engineer', email: 'c.brennan@appdirect.com', phone: '(415) 555-1198', lastContact: '2026-03-20', introsQTD: 2, introsAllTime: 14, revenueAttributed: 45000 },
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
      if (a.pulse === 'Strong' && a.tier === 'top10') {
        opps.push({ advisor: a, reason: `${a.name} is a top-10 partner with strong engagement — ideal co-marketing candidate`, type: 'High-Value Amplification' });
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
            {['top10', 'next20', 'developing', 'new'].map(tier => {
              const tierAdvisors = advisors.filter(a => a.tier === tier);
              const tierMRR = tierAdvisors.reduce((s, a) => s + a.mrr, 0);
              return (
                <div key={tier} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">{tier === 'top10' ? 'Top 10' : tier === 'next20' ? 'Next 20' : tier === 'developing' ? 'Developing' : 'New'}</div>
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
        label: 'Strategic Top 20',
        key: 'Strategic Top 20',
        count: advisorsWithDeals.filter(a => a.tier === 'top10' || a.tier === 'next20').length,
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
    } else if (relationshipFilter === 'Strategic Top 20') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.tier === 'top10' || a.tier === 'next20');
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

    // Calculate heat map data by city
    const heatMapData = Object.entries(advisorsByCityMap).map(([location, data]) => {
      const advisorList = data.advisors;
      const avgPulse = advisorList.length > 0
        ? advisorList.reduce((sum, a) => {
            const pulseScore: Record<string, number> = { Strong: 3, Steady: 2, Rising: 2.5, Fading: 1, Flatline: 0 };
            const fullAdvisor = advisorsWithDeals.find(ad => ad.id === a.id);
            return sum + (pulseScore[fullAdvisor?.pulse || ''] || 1);
          }, 0) / advisorList.length
        : 0;

      const avgTrajectory = advisorList.length > 0
        ? advisorList.reduce((sum, a) => {
            const trajScore: Record<string, number> = { Accelerating: 3, Climbing: 2, Stable: 1, Slipping: -1, Freefall: -2 };
            const fullAdvisor = advisorsWithDeals.find(ad => ad.id === a.id);
            return sum + (trajScore[fullAdvisor?.trajectory || ''] || 0);
          }, 0) / advisorList.length
        : 0;

      const score = (avgPulse + avgTrajectory) / 2;
      return { location, count: data.count, mrr: data.mrr, score, health: score > 1.5 ? 'good' : score > 0 ? 'moderate' : 'poor' };
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

    return (
      <>
        {/* Sub-Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-[#e8e5e1] pb-3">
          {[
            { key: 'partners', label: 'Partners', icon: Users },
            { key: 'tsds', label: `TSDs (${TSD_COMPANIES.length})`, icon: Building2 },
            { key: 'white-space', label: 'White Space', icon: LayoutGrid },
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
          {/* Heat Map — SVG visualization */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
            <p className="text-11px text-gray-600 mb-3 uppercase font-medium">Territory Heat Map</p>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16A34A' }} />
                <span className="text-10px text-gray-600">Good</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FBBF24' }} />
                <span className="text-10px text-gray-600">Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                <span className="text-10px text-gray-600">Poor</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {heatMapData.slice(0, 12).map(data => {
                const color = data.health === 'good' ? '#16A34A' : data.health === 'moderate' ? '#FBBF24' : '#EF4444';
                const size = Math.min(20, 10 + data.count);
                return (
                  <div
                    key={data.location}
                    className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                    title={`${data.location}: ${data.count} partners, $${(data.mrr / 1000).toFixed(0)}K MRR`}
                  >
                    <div
                      className="rounded-full"
                      style={{ width: `${size}px`, height: `${size}px`, backgroundColor: color }}
                    />
                    <span className="text-9px text-gray-600 text-center">{data.location.split(',')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Engagement Level Filter */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
            <p className="text-11px text-gray-600 mb-3 uppercase font-medium">Engagement Levels</p>
            <div className="flex flex-wrap gap-2">
              {engagementSegments.map(seg => (
                <button
                  key={seg.key}
                  onClick={() => setRelationshipFilter(seg.key)}
                  className={`px-3 py-1.5 rounded-full text-12px font-medium transition-colors ${
                    relationshipFilter === seg.key
                      ? 'bg-[#157A6E] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {seg.label}
                  <span className={`ml-1.5 ${relationshipFilter === seg.key ? 'text-white/80' : 'text-gray-600'}`}>
                    ({seg.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort Controls & Add Button */}
          <div className="flex items-center justify-between">
            <div className="text-12px text-gray-600 font-medium">
              Showing {sortedAdvisors.length} partners
              {territoryFilter && <span className="ml-1 text-[#157A6E]">in {territoryFilter}</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingPartner(null); setShowPartnerModal(true); }}
                className="px-4 py-2 bg-[#157A6E] text-white rounded-lg text-12px font-medium hover:bg-[#12675b] transition-colors"
              >
                + Add Partner
              </button>
              <select
                value={relationshipSort}
                onChange={(e) => setRelationshipSort(e.target.value as 'name' | 'mrr' | 'lastContact')}
                className="text-12px border border-gray-200 rounded px-2 py-1 text-gray-700 hover:border-gray-300"
              >
                <option value="mrr">Sort by MRR</option>
                <option value="lastContact">Sort by Last Contacted</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* Partner Cards — HubSpot-style */}
          <div className="space-y-3">
            {sortedAdvisors.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-12px">No partners match this filter</p>
              </div>
            ) : (
              sortedAdvisors.map(a => {
                const daysSince = getDaysSinceContact(a.lastContact);
                const ws = whiteSpaceData.find(w => w.id === a.id);
                const stage = getRelationshipStage(a);
                const initials = a.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                const coMarketingMatch = coMarketingOpportunities.find(opp => opp.advisor.id === a.id);

                return (
                  <div
                    key={a.id}
                    className="bg-white rounded-[10px] border border-[#e8e5e1] p-5 hover:shadow-md cursor-pointer transition-all"
                    onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}
                  >
                    {/* Header: Avatar, Name, Stage Badge, MRR + Tier */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-13px font-bold flex-shrink-0"
                          style={{ backgroundColor: '#157A6E' }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-13px font-semibold text-gray-900">{a.name}</p>
                            <span className="px-2 py-0.5 bg-[#157A6E]/10 text-[#157A6E] text-[10px] rounded-full font-semibold">{stage}</span>
                          </div>
                          <p className="text-11px text-gray-500">{a.company} · {a.title}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingPartner(a); setShowPartnerModal(true); }}
                          className="text-gray-400 hover:text-[#157A6E] transition-colors pt-1"
                          title="Edit partner"
                        >
                          <Edit size={16} />
                        </button>
                        <div className="text-right">
                          <p className="text-13px font-semibold text-gray-800">{formatCurrency(a.mrr)}</p>
                          <TierBadge tier={a.tier} />
                        </div>
                      </div>
                    </div>

                    {/* Action Items Row */}
                    <div className="flex gap-2 mb-3 pb-3 border-b border-gray-100">
                      <button className="text-11px font-medium text-[#157A6E] hover:bg-[#157A6E]/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </button>
                      <button className="text-11px font-medium text-[#157A6E] hover:bg-[#157A6E]/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Call
                      </button>
                      <button className="text-11px font-medium text-[#157A6E] hover:bg-[#157A6E]/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Schedule
                      </button>
                      <button className="text-11px font-medium text-[#157A6E] hover:bg-[#157A6E]/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        Note
                      </button>
                    </div>

                    {/* Engagement Indicators */}
                    <div className="flex items-center gap-4 mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <PulseBadge pulse={a.pulse} />
                        <span className="text-10px text-gray-500">Pulse</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrajectoryBadge trajectory={a.trajectory} />
                        <span className="text-10px text-gray-500">Trajectory</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FrictionBadge level={a.friction} />
                        <span className="text-10px text-gray-500">Friction</span>
                      </div>
                      <div className={`ml-auto text-11px font-semibold ${getLastContactColor(daysSince)}`}>
                        {daysSince}d ago
                      </div>
                    </div>

                    {/* Additional Opportunities Section */}
                    {(ws || coMarketingMatch) && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        {ws && ws.opportunityProducts.length > 0 && (
                          <div className="mb-2">
                            <p className="text-11px font-semibold text-gray-700 mb-1">White Space Opportunities</p>
                            <p className="text-10px text-gray-600">
                              {ws.opportunityProducts.length} products · Est. {formatCurrency(ws.opportunityMRR)}
                            </p>
                          </div>
                        )}
                        {coMarketingMatch && (
                          <div>
                            <p className="text-11px font-semibold text-gray-700 mb-1">Co-Marketing Eligible</p>
                            <p className="text-10px text-gray-600">{coMarketingMatch.type}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}

        {/* AdvisorPanel as overlay */}
        {selectedAdvisor && (
          <AdvisorPanel
            advisor={selectedAdvisor}
            deals={deals.filter(d => d.advisorId === selectedAdvisor.id)}
            isOpen={panelOpen}
            onClose={() => { setPanelOpen(false); setSelectedAdvisor(null); }}
          />
        )}

        {/* ── TSDs SUB-TAB ── */}
        {relationshipViewMode === 'tsds' && (() => {
          const totalTsdIntrosQTD = TSD_COMPANIES.reduce((s, c) => s + c.totalIntrosQTD, 0);
          const totalTsdIntrosAllTime = TSD_COMPANIES.reduce((s, c) => s + c.totalIntrosAllTime, 0);
          const totalTsdRevenue = TSD_COMPANIES.reduce((s, c) => s + c.totalRevenueAttributed, 0);
          const totalTsdContacts = TSD_COMPANIES.reduce((s, c) => s + c.contacts.length, 0);
          const maxTsdRevenue = Math.max(...TSD_COMPANIES.map(c => c.totalRevenueAttributed), 1);
          const tsdColors: Record<string, string> = { Telarus: '#2563EB', Avant: '#EA580C', Bridgepointe: '#16A34A', Intelisys: '#7C3AED', AppDirect: '#0891B2' };

          return (
        <div className="space-y-4">
          {/* KPI Row */}
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
              <p className="text-10px text-gray-500 uppercase font-medium">Partners Sourced</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{TSD_COMPANIES.reduce((s, c) => s + c.partners.length, 0)}</p>
            </div>
          </div>

          {/* Revenue by TSD Chart */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#157A6E]" />
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Revenue by TSD</h3>
            </div>
            <div className="space-y-3">
              {TSD_COMPANIES.sort((a, b) => b.totalRevenueAttributed - a.totalRevenueAttributed).map(company => (
                <div key={company.name} className="flex items-center gap-3">
                  <div className="w-24 text-12px font-medium text-gray-700 flex-shrink-0">{company.name}</div>
                  <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setExpandedTsdCompany(prev => prev === company.name ? null : company.name)}>
                    <div className="h-full rounded-full flex items-center transition-all duration-500"
                      style={{ width: `${(company.totalRevenueAttributed / maxTsdRevenue) * 100}%`, backgroundColor: tsdColors[company.name] || '#157A6E' }}>
                      <span className="text-10px font-semibold text-white ml-2 whitespace-nowrap">{formatCurrency(company.totalRevenueAttributed)}</span>
                    </div>
                  </div>
                  <div className="w-20 text-right flex-shrink-0">
                    <span className="text-11px font-semibold text-gray-600">{company.totalIntrosQTD} intros</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Filter Pills */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
            <p className="text-11px text-gray-600 mb-3 uppercase font-medium">Filter by Role</p>
            <div className="flex flex-wrap gap-2">
              {tsdRoles.map(role => (
                <button
                  key={role}
                  onClick={() => setTsdRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-full text-12px font-medium transition-colors ${
                    tsdRoleFilter === role
                      ? 'bg-[#157A6E] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* TSD Company Cards */}
          <div className="space-y-3">
            {TSD_COMPANIES.map(company => {
              const isExpanded = expandedTsdCompany === company.name;
              const color = tsdColors[company.name] || '#157A6E';
              const health = getTsdRelationshipHealth(company);
              const filteredContacts = tsdRoleFilter === 'All'
                ? company.contacts
                : company.contacts.filter(c => c.role === tsdRoleFilter);

              return (
              <div key={company.name} className={`bg-white rounded-[10px] border transition-all ${isExpanded ? 'border-[#157A6E] shadow-md' : 'border-[#e8e5e1] hover:shadow-sm'}`}>
                {/* Company Header — always visible */}
                <div className="p-5 cursor-pointer" onClick={() => setExpandedTsdCompany(prev => prev === company.name ? null : company.name)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: color + '18' }}>
                        {company.logo}
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold font-['Newsreader'] text-gray-900">{company.name}</p>
                        <p className="text-11px text-gray-500">{company.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div style={{ color: health.color }} className="text-center">
                        <p className="text-12px font-bold">{health.health}</p>
                        <p className="text-9px text-gray-400">Health</p>
                      </div>
                      <div className="text-right">
                        <p className="text-13px font-bold" style={{ color }}>{company.totalIntrosQTD} intros QTD</p>
                        <p className="text-10px text-gray-400">{company.totalIntrosAllTime} all-time</p>
                      </div>
                      <div className="text-right">
                        <p className="text-13px font-bold text-[#157A6E]">{formatCurrency(company.totalRevenueAttributed)}</p>
                        <p className="text-10px text-gray-400">{company.partners.length} partners</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content — contacts grouped by role + partners */}
                {isExpanded && (
                <div className="border-t border-[#e8e5e1] px-5 pb-5">
                  {/* Contacts grouped by role */}
                  {filteredContacts.length > 0 && (
                  <div className="pt-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-12px font-semibold text-gray-700 uppercase tracking-wide">Your Contacts ({filteredContacts.length})</p>
                      <button className="flex items-center gap-1 text-11px font-medium text-[#157A6E] hover:underline">
                        <UserPlus className="w-3 h-3" /> Add Contact
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {filteredContacts.map(contact => {
                        const daysSince = Math.floor((new Date().getTime() - new Date(contact.lastContact).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                        <div key={contact.id} className="flex items-center gap-4 p-3 bg-[#F7F5F2] rounded-lg hover:bg-[#f0ede9] transition-colors">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-11px font-semibold flex-shrink-0"
                            style={{ backgroundColor: color }}>
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-13px font-semibold text-gray-800">{contact.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-10px text-gray-500 px-1.5 py-0.5 bg-gray-200 rounded">{contact.role}</span>
                              <p className="text-11px text-gray-500">{contact.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 flex-shrink-0">
                            <div className="text-center">
                              <p className="text-13px font-bold" style={{ color }}>{contact.introsQTD}</p>
                              <p className="text-9px text-gray-400 uppercase">Intros QTD</p>
                            </div>
                            <div className="text-center">
                              <p className="text-13px font-bold text-gray-600">{contact.introsAllTime}</p>
                              <p className="text-9px text-gray-400 uppercase">All-Time</p>
                            </div>
                            <div className="text-center">
                              <p className="text-13px font-bold text-[#157A6E]">{formatCurrency(contact.revenueAttributed)}</p>
                              <p className="text-9px text-gray-400 uppercase">Revenue</p>
                            </div>
                            <div className="text-center">
                              <p className={`text-11px font-medium ${daysSince <= 3 ? 'text-green-600' : daysSince <= 7 ? 'text-yellow-600' : 'text-red-500'}`}>
                                {daysSince}d ago
                              </p>
                              <p className="text-9px text-gray-400 uppercase">Contact</p>
                            </div>
                            <div className="flex gap-1">
                              <button className="p-1.5 rounded hover:bg-white transition-colors" title={contact.email}>
                                <Mail className="w-3.5 h-3.5 text-gray-400 hover:text-[#157A6E]" />
                              </button>
                              <button className="p-1.5 rounded hover:bg-white transition-colors" title={contact.phone}>
                                <Phone className="w-3.5 h-3.5 text-gray-400 hover:text-[#157A6E]" />
                              </button>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                  )}

                  {/* Partners sourced through this TSD */}
                  {company.partners.length > 0 && (
                  <div>
                    <p className="text-12px font-semibold text-gray-700 uppercase tracking-wide mb-3">Partners via {company.name} ({company.partners.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {company.partners.slice(0, 6).map(partner => (
                        <div key={partner.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => { setSelectedAdvisor(partner); setPanelOpen(true); }}>
                          <div className="text-11px min-w-0 flex-1">
                            <p className="text-gray-800 font-medium truncate">{partner.name}</p>
                            <p className="text-gray-500 truncate">{partner.company}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <PulseBadge pulse={partner.pulse} />
                            <span className="text-11px font-semibold text-[#157A6E]">{formatCurrency(partner.mrr)}</span>
                            <ArrowUpRight className="w-3 h-3 text-gray-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {company.partners.length > 6 && (
                      <p className="text-center text-11px text-[#157A6E] font-medium mt-2 cursor-pointer hover:underline">
                        + {company.partners.length - 6} more partners
                      </p>
                    )}
                  </div>
                  )}
                </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
          );
        })()}

        {/* ── WHITE SPACE SUB-TAB ── */}
        {relationshipViewMode === 'white-space' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <KPICard label="Total White Space MRR" value={formatCurrency(whiteSpaceData.reduce((s, a) => s + a.opportunityMRR, 0))} change={`${whiteSpaceData.length} advisors`} changeType="positive" />
            <KPICard label="Avg Cross-Sell" value={`${(whiteSpaceData.reduce((s, a) => s + a.crossSellScore, 0) / Math.max(whiteSpaceData.length, 1)).toFixed(0)}%`} change="of catalog covered" changeType="neutral" />
            <KPICard label="Services in Catalog" value={`${SERVICE_CATALOG.length}`} change="available products" changeType="positive" />
          </div>

          <div className="space-y-4">
            {[...whiteSpaceData].sort((a, b) => a.crossSellScore - b.crossSellScore).map(advisor => {
              const colorClass = advisor.crossSellScore < 30 ? 'border-red-200 bg-red-50' : advisor.crossSellScore < 60 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50';
              const scoreColor = advisor.crossSellScore < 30 ? 'text-red-700' : advisor.crossSellScore < 60 ? 'text-amber-700' : 'text-emerald-700';
              const statusBadgeClass = advisor.crossSellScore < 30 ? 'bg-red-100 text-red-700' : advisor.crossSellScore < 60 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';

              return (
                <div key={advisor.id} className={`border rounded-[10px] p-5 ${colorClass}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">{advisor.name}</p>
                      <p className="text-12px text-gray-600">{advisor.company} · {formatCurrency(advisor.mrr)} MRR</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-13px font-bold ${statusBadgeClass}`}>
                      {advisor.crossSellScore.toFixed(0)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-12px font-semibold text-gray-700 mb-2">Products Sold ({advisor.soldProducts.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {advisor.soldProducts.length > 0 ? advisor.soldProducts.map(p => (
                          <span key={p} className="px-2 py-1 bg-white/70 rounded text-11px font-medium text-gray-700">{p}</span>
                        )) : <span className="text-11px text-gray-500 italic">None</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-12px font-semibold text-gray-700 mb-2">White Space ({advisor.opportunityProducts.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {advisor.opportunityProducts.slice(0, 4).map(p => (
                          <span key={p} className="px-2 py-1 bg-white/70 rounded text-10px text-gray-700 font-medium">{p}</span>
                        ))}
                        {advisor.opportunityProducts.length > 4 && (
                          <span className="text-10px text-gray-600 italic">+{advisor.opportunityProducts.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#157A6E] to-[#0f5550]" style={{ width: `${advisor.crossSellScore}%` }} />
                    </div>
                    <span className={`text-11px font-bold ${scoreColor}`}>{advisor.crossSellScore.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* PartnerModal */}
        <PartnerModal
          isOpen={showPartnerModal}
          onClose={() => { setShowPartnerModal(false); setEditingPartner(null); }}
          editingPartner={editingPartner}
          onSave={handleSavePartner}
        />
      </>
    );
  };

  // ════════════════════════════════════════════════
  // PIPELINE (with Quotes vs Sold metrics)
  // ════════════════════════════════════════════════
  const renderPipeline = () => {
    const filtered = deals.filter(d => {
      if (dealFilter.health !== 'all' && d.health !== dealFilter.health) return false;
      if (dealFilter.stage !== 'all' && d.stage !== dealFilter.stage) return false;
      return true;
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <KPICard label="Active Pipeline" value={formatCurrency(pipelineMRR)} change={`${activePipeline.length} deals`} changeType="positive" />
          <KPICard label="Weighted Pipeline" value={formatCurrency(weightedPipeline)} change="Stage-weighted" changeType="neutral" />
          <KPICard label="Stalled" value={`${stalledDeals.length}`} change={formatCurrency(stalledDeals.reduce((s, d) => s + d.mrr, 0))} changeType={stalledDeals.length > 0 ? "negative" : "neutral"} />
        </div>

        {/* Pipeline view toggle */}
        <div className="flex gap-2 border-b border-[#e8e5e1] pb-2">
          <button onClick={() => setPipelineMetricsView('kanban')}
            className={`px-4 py-2 text-13px font-medium rounded-t-lg transition-colors ${pipelineMetricsView === 'kanban' ? 'bg-[#157A6E] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            Kanban
          </button>
          <button onClick={() => setPipelineMetricsView('deals')}
            className={`px-4 py-2 text-13px font-medium rounded-t-lg transition-colors ${pipelineMetricsView === 'deals' ? 'bg-[#157A6E] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            All Deals
          </button>
          <button onClick={() => setPipelineMetricsView('quotes-vs-sold')}
            className={`px-4 py-2 text-13px font-medium rounded-t-lg transition-colors ${pipelineMetricsView === 'quotes-vs-sold' ? 'bg-[#157A6E] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            Quotes vs Sold
          </button>
          <button onClick={() => setPipelineMetricsView('by-advisor')}
            className={`px-4 py-2 text-13px font-medium rounded-t-lg transition-colors ${pipelineMetricsView === 'by-advisor' ? 'bg-[#157A6E] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            By Advisor
          </button>
        </div>

        {pipelineMetricsView === 'deals' && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">All Deals</h3>
              <select className="text-12px border border-gray-200 rounded px-2 py-1" value={dealFilter.health} onChange={e => setDealFilter({ ...dealFilter, health: e.target.value })}>
                <option value="all">All Health</option>
                <option value="Healthy">Healthy</option>
                <option value="Monitor">Monitor</option>
                <option value="At Risk">At Risk</option>
                <option value="Stalled">Stalled</option>
              </select>
              <select className="text-12px border border-gray-200 rounded px-2 py-1" value={dealFilter.stage} onChange={e => setDealFilter({ ...dealFilter, stage: e.target.value })}>
                <option value="all">All Stages</option>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button
              onClick={() => { setShowDealModal(true); setEditingDeal(null); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#157A6E] text-white rounded-lg hover:bg-[#126B5F] transition-colors text-12px font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Deal
            </button>
          </div>
          <div className="space-y-2">
            {filtered.length === 0 && <p className="text-12px text-gray-400 italic">No deals match filters</p>}
            {filtered.map(d => {
              const adv = advisors.find(a => a.id === d.advisorId);
              return (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 group"
                     onClick={() => { if (adv) { setSelectedAdvisor(adv); setPanelOpen(true); setActiveViewRaw('relationships'); } }}>
                  <div className="flex-1 cursor-pointer">
                    <p className="text-13px font-medium text-gray-800">{d.name}</p>
                    <p className="text-11px text-gray-500">{adv?.name || 'Unassigned'} · {d.stage} · {d.daysInStage}d in stage</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <DealHealthBadge health={d.health} />
                    <span className="text-13px font-semibold text-gray-800">{formatCurrency(d.mrr)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingDeal(d); setShowDealModal(true); }}
                      className="p-1.5 text-gray-400 hover:text-[#157A6E] hover:bg-gray-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Kanban view */}
        {pipelineMetricsView === 'kanban' && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-min pb-4">
              {stages.map(stage => {
                const stageDeals = deals.filter(d => d.stage === stage);
                const stageMRR = stageDeals.reduce((s, d) => s + d.mrr, 0);
                const stageColors: Record<DealStage, string> = {
                  'Discovery': '#3B82F6',
                  'Qualifying': '#06B6D4',
                  'Proposal': '#8B5CF6',
                  'Negotiating': '#F59E0B',
                  'Closed Won': '#10B981',
                  'Stalled': '#EF4444',
                };
                return (
                  <div key={stage} className="flex-shrink-0 w-[240px]">
                    <div className="bg-[#F7F5F2] rounded-lg overflow-hidden border border-[#e8e5e1]">
                      <div className="border-t-4 p-4" style={{ borderTopColor: stageColors[stage] }}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-13px font-semibold font-['Newsreader'] text-gray-800">{stage}</h4>
                          <span className="text-11px bg-white px-2 py-1 rounded text-gray-600 font-medium">{stageDeals.length}</span>
                        </div>
                        <p className="text-11px text-gray-600 mb-3">{formatCurrency(stageMRR)} MRR</p>
                        <div className="space-y-2">
                          {stageDeals.map(d => {
                            const adv = advisors.find(a => a.id === d.advisorId);
                            return (
                              <div key={d.id}
                                onClick={() => { if (adv) { setSelectedAdvisor(adv); setPanelOpen(true); setActiveViewRaw('relationships'); } }}
                                className="bg-white p-3 rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-[#e8e5e1]">
                                <p className="text-12px font-semibold text-gray-800 mb-1">{d.name}</p>
                                <p className="text-10px text-gray-600 mb-2">{adv?.name || 'Unassigned'}</p>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-11px font-medium text-[#157A6E]">{formatCurrency(d.mrr)}</span>
                                  <span className="text-10px text-gray-500">{d.daysInStage}d</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DealHealthBadge health={d.health} />
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

        {/* Quotes vs Sold view */}
        {pipelineMetricsView === 'quotes-vs-sold' && (
        <div className="space-y-4">
          {/* Summary stats */}
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

          {/* Per-partner breakdown */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Quotes vs Sold by Partner</h3>
            <table className="w-full text-12px">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-500">Partner</th>
                  <th className="text-center py-2 font-medium text-gray-500">Q1 Quotes</th>
                  <th className="text-center py-2 font-medium text-gray-500">Q1 Sold</th>
                  <th className="text-center py-2 font-medium text-gray-500">Q2 Quotes</th>
                  <th className="text-center py-2 font-medium text-gray-500">Q2 Sold</th>
                  <th className="text-center py-2 font-medium text-gray-500">All-Time Quotes</th>
                  <th className="text-center py-2 font-medium text-gray-500">All-Time Sold</th>
                  <th className="text-right py-2 font-medium text-gray-500">Close Rate</th>
                </tr>
              </thead>
              <tbody>
                {quotesVsSold.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => { setSelectedAdvisor(a as any); setPanelOpen(true); }}>
                    <td className="py-2">
                      <p className="font-medium text-gray-800">{a.name}</p>
                      <p className="text-10px text-gray-500">{a.company}</p>
                    </td>
                    <td className="py-2 text-center text-gray-600">{a.q1.quotes}</td>
                    <td className="py-2 text-center font-semibold text-green-700">{a.q1.sold}</td>
                    <td className="py-2 text-center text-gray-600">{a.q2.quotes}</td>
                    <td className="py-2 text-center font-semibold text-green-700">{a.q2.sold}</td>
                    <td className="py-2 text-center text-gray-800 font-medium">{a.totalQuotes}</td>
                    <td className="py-2 text-center font-bold text-green-700">{a.soldDeals}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-11px font-bold ${
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

        {/* By Advisor view */}
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
                    <div className="border-t border-[#e8e5e1] p-4 bg-[#F7F5F2]">
                      {advisorDeals.length === 0 ? (
                        <p className="text-11px text-gray-400 italic">No deals for this advisor</p>
                      ) : (
                        <div className="space-y-2">
                          {advisorDeals.map(d => (
                            <div key={d.id}
                              onClick={() => { setSelectedAdvisor(adv); setPanelOpen(true); setActiveViewRaw('relationships'); }}
                              className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer border border-[#e8e5e1] group">
                              <div className="flex-1">
                                <p className="text-12px font-medium text-gray-800">{d.name}</p>
                                <p className="text-10px text-gray-500">{d.stage} · {d.daysInStage}d in stage</p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <DealHealthBadge health={d.health} />
                                <span className="text-12px font-semibold text-gray-800 min-w-[60px] text-right">{formatCurrency(d.mrr)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
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

    // Playbook data
    const playbooks = [
      ...atRiskAdvisors.slice(0, 2).map(a => ({ priority: 'critical' as const, title: `Win-Back: ${a.name}`, desc: `${a.diagnosis || 'Custom retention strategy needed'}. ${formatCurrency(a.mrr)} at risk.`, amount: formatCurrency(a.mrr), amountRaw: a.mrr, days: 7, steps: [{ label: 'Pull complaint history', done: true }, { label: 'Executive outreach call', active: true }, { label: 'Service credit + SLA', done: false }, { label: 'Weekly check-in cadence', done: false }], signalTitle: `Churn Risk — ${a.name}`, signalType: 'churn' as const })),
      ...advisors.filter(a => a.trajectory === 'Accelerating' || a.trajectory === 'Climbing').slice(0, 1).map(a => ({ priority: 'high' as const, title: `Growth: ${a.name} → Cross-Sell`, desc: `${a.trajectory} trajectory. Expand product footprint.`, amount: `+${formatCurrency(Math.round(a.mrr * 0.6))}`, amountRaw: Math.round(a.mrr * 0.6), days: 14, steps: [{ label: 'Identify cross-sell products', done: true }, { label: 'Build joint proposal', active: true }, { label: 'Strategy call', done: false }, { label: 'First deal registered', done: false }], signalTitle: `Expansion — ${a.name}`, signalType: 'growth' as const })),
      ...frictionIssues.slice(0, 1).map(a => ({ priority: 'medium' as const, title: `Retention: ${a.name}`, desc: `${a.friction} friction. QBR + service review needed.`, amount: formatCurrency(a.mrr), amountRaw: a.mrr, days: 10, steps: [{ label: 'Resolve open tickets', done: true }, { label: 'Acknowledge issues', done: true }, { label: 'Schedule QBR', active: true }, { label: 'Monthly check-in commitment', done: false }], signalTitle: `Churn Risk — ${a.name}`, signalType: 'churn' as const })),
    ];

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

      return (
        <div className="space-y-5">
          {subTabBar}
          <div className="grid grid-cols-4 gap-4">
            <KPICard label="Active Playbooks" value={`${playbooks.length}`} change={`${playbooks.filter(p=>p.priority==='critical').length} critical, ${playbooks.filter(p=>p.priority==='high').length} high`} changeType="neutral" />
            <KPICard label="MRR Protected" value={formatCurrency(protectedMRR)} change="In active win-back" changeType="negative" />
            <KPICard label="MRR Targeted" value={`+${formatCurrency(expansionMRR)}`} change="Expansion playbooks" changeType="positive" />
            <KPICard label="Avg Days to Deadline" value={`${avgDays}`} change={`Nearest: ${playbooks[0]?.days || 0} days`} changeType="neutral" />
          </div>

          <div className="grid grid-cols-[1fr_280px] gap-4">
            <div className="space-y-4">
              {playbooks.map((pb, i) => {
                const doneSteps = pb.steps.filter(s => s.done).length;
                const totalSteps = pb.steps.length;
                const pct = Math.round((doneSteps / totalSteps) * 100);
                return (
                  <div key={i} className={`bg-white rounded-[10px] border border-[#e8e5e1] p-5 border-l-4 ${pb.priority === 'critical' ? 'border-l-red-500' : pb.priority === 'high' ? 'border-l-amber-400' : 'border-l-blue-500'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide mb-1.5 ${pb.priority === 'critical' ? 'bg-red-100 text-red-800' : pb.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                          {pb.priority}
                        </span>
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

            {/* Sidebar: deadlines + stats */}
            <div className="space-y-4 self-start sticky top-[105px]">
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Upcoming Deadlines</h3>
                {playbooks.sort((a,b) => a.days - b.days).map((pb, i) => (
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
                  <p className="text-[11px] text-gray-500 mt-0.5">{a.company} · {a.tier || 'Partner'}</p>
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
        editingDeal={editingDeal}
        advisors={advisors}
      />
      <AIChat role="manager" selectedAdvisor={selectedAdvisor} live={true} />
    </div>
  );
}
