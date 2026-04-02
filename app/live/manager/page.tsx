'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, DollarSign, Brain, Activity,
  TrendingDown, TrendingUp, Zap, Users, ChevronDown, ChevronUp, X,
  ArrowLeft, MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays,
  Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, RefreshCw,
  Megaphone, Star, TrendingUp as TrendingUpIcon, CheckCircle, AlertCircle as AlertCircleIcon, Edit, Plus,
  LayoutGrid, Map, FileText, Mail, Building2, ArrowUpRight, BarChart3, UserPlus,
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
  const [pipelineMetricsView, setPipelineMetricsView] = useState<'deals' | 'quotes-vs-sold'>('deals');
  const [selectedTsdAdvisors, setSelectedTsdAdvisors] = useState<Advisor[]>([]);
  const [expandedTsdCompany, setExpandedTsdCompany] = useState<string | null>(null);

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
          { id: 'tel-1', name: 'Sarah Mitchell', title: 'Channel Development Manager', email: 's.mitchell@telarus.com', phone: '(801) 555-4821', lastContact: '2026-03-29', introsQTD: 8, introsAllTime: 47, revenueAttributed: 142000 },
          { id: 'tel-2', name: 'James Thornton', title: 'Solutions Engineer', email: 'j.thornton@telarus.com', phone: '(801) 555-3392', lastContact: '2026-03-25', introsQTD: 5, introsAllTime: 31, revenueAttributed: 88000 },
          { id: 'tel-3', name: 'Rachael Nguyen', title: 'Partner Success Lead', email: 'r.nguyen@telarus.com', phone: '(801) 555-1104', lastContact: '2026-04-01', introsQTD: 12, introsAllTime: 63, revenueAttributed: 215000 },
        ],
      },
      {
        name: 'Avant',
        logo: '🟧',
        description: 'Leading channel platform for IT decision making',
        contacts: [
          { id: 'av-1', name: 'Derek Paulson', title: 'Channel Account Manager', email: 'd.paulson@avant.com', phone: '(312) 555-6678', lastContact: '2026-03-31', introsQTD: 10, introsAllTime: 52, revenueAttributed: 178000 },
          { id: 'av-2', name: 'Monica Reeves', title: 'Solutions Architect', email: 'm.reeves@avant.com', phone: '(312) 555-2241', lastContact: '2026-03-28', introsQTD: 6, introsAllTime: 28, revenueAttributed: 95000 },
        ],
      },
      {
        name: 'Bridgepointe',
        logo: '🟩',
        description: 'Technology advisory and distribution platform',
        contacts: [
          { id: 'bp-1', name: 'Kevin Marsh', title: 'VP Channel Partnerships', email: 'k.marsh@bridgepointe.com', phone: '(925) 555-8812', lastContact: '2026-03-22', introsQTD: 4, introsAllTime: 19, revenueAttributed: 67000 },
          { id: 'bp-2', name: 'Alicia Tran', title: 'Partner Development Rep', email: 'a.tran@bridgepointe.com', phone: '(925) 555-3350', lastContact: '2026-03-27', introsQTD: 7, introsAllTime: 34, revenueAttributed: 112000 },
        ],
      },
      {
        name: 'Intelisys',
        logo: '🟪',
        description: 'Telecommunications master agent and solutions distributor',
        contacts: [
          { id: 'in-1', name: 'Robert Cianci', title: 'Channel Director', email: 'r.cianci@intelisys.com', phone: '(203) 555-9901', lastContact: '2026-03-30', introsQTD: 9, introsAllTime: 41, revenueAttributed: 156000 },
          { id: 'in-2', name: 'Patricia Dunn', title: 'Sales Engineer', email: 'p.dunn@intelisys.com', phone: '(203) 555-4478', lastContact: '2026-03-18', introsQTD: 3, introsAllTime: 22, revenueAttributed: 71000 },
          { id: 'in-3', name: 'Tyler Washington', title: 'Partner Enablement Manager', email: 't.washington@intelisys.com', phone: '(203) 555-6632', lastContact: '2026-04-01', introsQTD: 11, introsAllTime: 55, revenueAttributed: 198000 },
        ],
      },
      {
        name: 'AppDirect',
        logo: '🔵',
        description: 'B2B subscription commerce platform and marketplace',
        contacts: [
          { id: 'ad-1', name: 'Yuki Tanaka', title: 'Partner Growth Manager', email: 'y.tanaka@appdirect.com', phone: '(415) 555-7723', lastContact: '2026-03-26', introsQTD: 6, introsAllTime: 25, revenueAttributed: 83000 },
          { id: 'ad-2', name: 'Chris Brennan', title: 'Solutions Consultant', email: 'c.brennan@appdirect.com', phone: '(415) 555-1198', lastContact: '2026-03-20', introsQTD: 2, introsAllTime: 14, revenueAttributed: 45000 },
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
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Portfolio MRR" value={formatCurrency(totalMRR)} change={`${advisors.length} partners`} changeType="positive" />
        <KPICard label="Active Pipeline" value={formatCurrency(pipelineMRR)} change={`${activePipeline.length} deals`} changeType="positive" />
        <KPICard label="At-Risk MRR" value={formatCurrency(atRiskMRR)} change={`${atRiskAdvisors.length} partners`} changeType={atRiskAdvisors.length > 0 ? "negative" : "neutral"} />
        <KPICard label="Closed Won QTD" value={formatCurrency(closedWonMRR)} change={`${closedWonDeals.length} deals`} changeType="positive" />
      </div>

      {/* Co-Marketing Opportunity Alert (conditional) */}
      {coMarketingOpportunities.length > 0 && (
        <div className="bg-gradient-to-r from-[#157A6E]/5 to-[#157A6E]/10 rounded-[10px] border border-[#157A6E]/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-4 h-4 text-[#157A6E]" />
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-[#157A6E]">Co-Marketing Opportunities</h3>
            <span className="px-2 py-0.5 bg-[#157A6E] text-white text-10px rounded-full font-bold">{coMarketingOpportunities.length} primed</span>
          </div>
          <div className="space-y-2">
            {coMarketingOpportunities.slice(0, 3).map((opp, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                <div>
                  <p className="text-13px font-medium text-gray-800">{opp.advisor.name} — {opp.type}</p>
                  <p className="text-11px text-gray-500">{opp.reason}</p>
                </div>
                <span className="text-12px font-semibold text-[#157A6E]">{formatCurrency(opp.advisor.mrr)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Signal Alerts */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Signal Alerts</h3>
          <div className="space-y-3">
            {atRiskAdvisors.length > 0 ? atRiskAdvisors.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100"
                   onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}>
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-13px font-medium text-gray-800">{a.name} — {a.trajectory}</p>
                  <p className="text-12px text-gray-500">{a.company} · {formatCurrency(a.mrr)} MRR · Friction: {a.friction}</p>
                </div>
              </div>
            )) : (
              <p className="text-12px text-gray-400 italic">No at-risk partners currently</p>
            )}
            {stalledDeals.length > 0 && stalledDeals.slice(0, 3).map(d => {
              const adv = advisors.find(a => a.id === d.advisorId);
              return (
                <div key={d.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-13px font-medium text-gray-800">{d.name} — Stalled {d.daysInStage}d</p>
                    <p className="text-12px text-gray-500">{adv?.name || 'Unknown'} · {formatCurrency(d.mrr)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline by Stage */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Pipeline by Stage</h3>
          <div className="space-y-2">
            {stageDistribution.filter(s => s.count > 0).map(s => {
              const colors: Record<string, string> = {
                Discovery: 'bg-blue-400', Qualifying: 'bg-cyan-400', Proposal: 'bg-violet-400',
                Negotiating: 'bg-amber-400', 'Closed Won': 'bg-green-400', Stalled: 'bg-red-400',
              };
              return (
                <div key={s.stage} className="cursor-pointer" onClick={() => setExpandedStage(expandedStage === s.stage as DealStage ? null : s.stage as DealStage)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-12px font-medium text-gray-700">{s.stage}</span>
                    <span className="text-11px text-gray-500">{s.count} · {formatCurrency(s.mrr)}</span>
                  </div>
                  <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[s.stage] || 'bg-gray-400'} rounded-full`} style={{ width: `${(s.mrr / maxStageMRR) * 100}%` }} />
                  </div>
                  {expandedStage === s.stage && (
                    <div className="mt-2 ml-2 space-y-1">
                      {deals.filter(d => d.stage === s.stage).map(d => {
                        const adv = advisors.find(a => a.id === d.advisorId);
                        return (
                          <div key={d.id} className="text-11px text-gray-600 flex justify-between">
                            <span>{d.name} ({adv?.name || '?'})</span>
                            <span>{formatCurrency(d.mrr)}</span>
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
  // RELATIONSHIPS (with sub-tabs: Partners, TSDs, Territory, White Space)
  // ════════════════════════════════════════════════
  const renderRelationships = () => {
    // Contact type categories
    const contactTypes = ['All', 'Partner', 'Champion', 'Decision Maker', 'Influencer', 'End User'];
    // Assign mock contact types based on seeded random
    const getContactType = (advisor: Advisor): string => {
      const types = ['Partner', 'Champion', 'Decision Maker', 'Influencer', 'End User'];
      const idx = Math.floor(seededRandom(advisor.id + '-ct') * types.length);
      return types[idx];
    };

    // Filtering logic
    const allAdvisorsCount = advisorsWithDeals.length;
    const activatedCount = advisorsWithDeals.filter(a => deals.some(d => d.advisorId === a.id)).length;
    const activeCount = advisorsWithDeals.filter(a => a.pulse === 'Strong' || a.pulse === 'Steady').length;
    const top20Count = advisorsWithDeals.filter(a => a.tier === 'top10' || a.tier === 'next20').length;
    const needsAttentionCount = advisorsWithDeals.filter(a =>
      a.friction === 'High' || a.friction === 'Critical' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall'
    ).length;

    let filteredAdvisors = [...advisorsWithDeals];
    if (relationshipFilter === 'Activated') {
      filteredAdvisors = advisorsWithDeals.filter(a => deals.some(d => d.advisorId === a.id));
    } else if (relationshipFilter === 'Active') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.pulse === 'Strong' || a.pulse === 'Steady');
    } else if (relationshipFilter === 'Strategic Top 20') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.tier === 'top10' || a.tier === 'next20');
    } else if (relationshipFilter === 'Needs Attention') {
      filteredAdvisors = advisorsWithDeals.filter(a =>
        a.friction === 'High' || a.friction === 'Critical' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall'
      );
    }

    // Apply contact type filter
    if (contactTypeFilter !== 'All') {
      filteredAdvisors = filteredAdvisors.filter(a => getContactType(a) === contactTypeFilter);
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

    const segments = [
      { label: 'All Partners', count: allAdvisorsCount, key: 'All' },
      { label: 'Activated', count: activatedCount, key: 'Activated' },
      { label: 'Active', count: activeCount, key: 'Active' },
      { label: 'Strategic Top 20', count: top20Count, key: 'Strategic Top 20' },
      { label: 'Needs Attention', count: needsAttentionCount, key: 'Needs Attention' },
    ];

    const handleCityClick = (city: string) => {
      setTerritoryFilter(prev => prev === city ? null : city);
    };

    // TSD data
    const allTsds = new Set<string>();
    advisorsWithDeals.forEach(a => { a.tsds?.forEach(tsd => allTsds.add(tsd)); });
    const tsdArray = Array.from(allTsds).sort();
    const tsdData = tsdArray.map(tsd => {
      const advisorsWithTsd = advisorsWithDeals.filter(a => a.tsds?.includes(tsd));
      const mrrWithTsd = advisorsWithTsd.reduce((sum, a) => sum + a.mrr, 0);
      return { tsd, advisorCount: advisorsWithTsd.length, mrr: mrrWithTsd, advisors: advisorsWithTsd };
    });

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

    return (
      <>
        {/* Sub-Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-[#e8e5e1] pb-3">
          {[
            { key: 'partners', label: 'Partners', icon: Users },
            { key: 'tsds', label: `TSDs (${TSD_COMPANIES.length})`, icon: Building2 },
            { key: 'territory', label: 'Territory Map', icon: Map },
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
          {/* Territory Map */}
          <USAMap
            advisorsByCity={advisorsByCityMap}
            onCityClick={handleCityClick}
            selectedCity={territoryFilter}
          />

          {/* Contact Type Filter */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
            <p className="text-11px text-gray-600 mb-3 uppercase font-medium">Contact Type</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {contactTypes.map(ct => (
                <button
                  key={ct}
                  onClick={() => setContactTypeFilter(ct)}
                  className={`px-3 py-1.5 rounded-full text-12px font-medium transition-colors ${
                    contactTypeFilter === ct
                      ? 'bg-[#157A6E] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ct}
                </button>
              ))}
            </div>
            <p className="text-11px text-gray-600 mb-3 uppercase font-medium">Partner Segments</p>
            <div className="flex flex-wrap gap-2">
              {segments.map(seg => (
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
              {contactTypeFilter !== 'All' && <span className="ml-1 text-[#157A6E]">· {contactTypeFilter}</span>}
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

          {/* Advisors List with inline White Space */}
          <div className="space-y-2">
            {sortedAdvisors.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-12px">No partners match this filter</p>
              </div>
            ) : (
              sortedAdvisors.map(a => {
                const daysSince = getDaysSinceContact(a.lastContact);
                const ws = whiteSpaceData.find(w => w.id === a.id);
                const contactType = getContactType(a);
                return (
                  <div
                    key={a.id}
                    className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 hover:shadow-md cursor-pointer transition-all"
                    onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-13px font-semibold text-gray-900">{a.name}</p>
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-medium">{contactType}</span>
                        </div>
                        <p className="text-11px text-gray-500">{a.company} · {a.title}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingPartner(a); setShowPartnerModal(true); }}
                          className="text-gray-400 hover:text-[#157A6E] transition-colors pt-0.5"
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
                    <div className="flex items-center gap-3 mt-2">
                      <PulseBadge pulse={a.pulse} />
                      <TrajectoryBadge trajectory={a.trajectory} />
                      <FrictionBadge level={a.friction} />
                      <span className="text-11px text-gray-500 ml-auto">
                        Last contacted: {daysSince}d ago
                      </span>
                    </div>
                    {/* Inline White Space indicator */}
                    {ws && ws.opportunityProducts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="w-3 h-3 text-gray-400" />
                          <span className="text-10px text-gray-500 font-medium">White Space:</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${ws.crossSellScore}%` }} />
                          </div>
                          <span className="text-10px font-semibold text-gray-600">{ws.crossSellScore.toFixed(0)}%</span>
                          <span className="text-10px text-gray-400">{ws.opportunityProducts.length} opps</span>
                        </div>
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

          {/* TSD Company Cards */}
          <div className="space-y-3">
            {TSD_COMPANIES.map(company => {
              const isExpanded = expandedTsdCompany === company.name;
              const color = tsdColors[company.name] || '#157A6E';
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

                {/* Expanded Content — contacts + partners */}
                {isExpanded && (
                <div className="border-t border-[#e8e5e1] px-5 pb-5">
                  {/* Contacts */}
                  <div className="pt-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-12px font-semibold text-gray-700 uppercase tracking-wide">Your Contacts at {company.name}</p>
                      <button className="flex items-center gap-1 text-11px font-medium text-[#157A6E] hover:underline">
                        <UserPlus className="w-3 h-3" /> Add Contact
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {company.contacts.map(contact => {
                        const daysSince = Math.floor((new Date().getTime() - new Date(contact.lastContact).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                        <div key={contact.id} className="flex items-center gap-4 p-3 bg-[#F7F5F2] rounded-lg hover:bg-[#f0ede9] transition-colors">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-11px font-semibold flex-shrink-0"
                            style={{ backgroundColor: color }}>
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-13px font-semibold text-gray-800">{contact.name}</p>
                            <p className="text-11px text-gray-500">{contact.title}</p>
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

        {/* ── TERRITORY MAP SUB-TAB ── */}
        {relationshipViewMode === 'territory' && (
        <div className="space-y-4">
          {/* Full US Map with state markers */}
          <USAMap
            advisorsByCity={advisorsByCityMap}
            onCityClick={handleCityClick}
            selectedCity={null}
            showAllStates={true}
            stateData={stateDataMap}
            onStateClick={(abbr) => setSelectedState(prev => prev === abbr ? null : abbr)}
            selectedState={selectedState}
          />

          {/* Region Analysis */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Regional Analysis</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                <p className="text-10px text-gray-500 uppercase font-medium">Total MRR</p>
                <p className="text-lg font-bold text-[#157A6E]">{formatCurrency(totalMRR)}</p>
              </div>
              <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                <p className="text-10px text-gray-500 uppercase font-medium">Pipeline by Region</p>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(pipelineMRR)}</p>
              </div>
              <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                <p className="text-10px text-gray-500 uppercase font-medium">Avg Deal Size</p>
                <p className="text-lg font-bold text-gray-800">{closedWonDeals.length > 0 ? formatCurrency(closedWonMRR / closedWonDeals.length) : '—'}</p>
              </div>
            </div>
            <table className="w-full text-12px">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-500">Region</th>
                  <th className="text-right py-2 font-medium text-gray-500">Partners</th>
                  <th className="text-right py-2 font-medium text-gray-500">MRR</th>
                  <th className="text-right py-2 font-medium text-gray-500">Pipeline</th>
                  <th className="text-right py-2 font-medium text-gray-500">Avg Sold</th>
                  <th className="text-right py-2 font-medium text-gray-500">Closed</th>
                </tr>
              </thead>
              <tbody>
                {regionAnalysis.map(r => (
                  <tr key={r.region} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">{r.region}</td>
                    <td className="py-2 text-right text-gray-600">{r.partners}</td>
                    <td className="py-2 text-right font-semibold text-[#157A6E]">{formatCurrency(r.mrr)}</td>
                    <td className="py-2 text-right text-gray-600">{formatCurrency(r.pipeline)}</td>
                    <td className="py-2 text-right text-gray-600">{r.avgSold > 0 ? formatCurrency(r.avgSold) : '—'}</td>
                    <td className="py-2 text-right text-gray-600">{r.closedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* State detail (if selected) */}
          {selectedState && stateDataMap[selectedState] && (
            <div className="bg-white rounded-[10px] border border-[#157A6E]/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">
                  {selectedState} Detail
                </h3>
                <button onClick={() => setSelectedState(null)} className="text-12px text-[#157A6E] hover:underline">Clear</button>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                  <p className="text-10px text-gray-500">Partners</p>
                  <p className="text-lg font-bold text-gray-800">{stateDataMap[selectedState].partners}</p>
                </div>
                <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                  <p className="text-10px text-gray-500">MRR</p>
                  <p className="text-lg font-bold text-[#157A6E]">{formatCurrency(stateDataMap[selectedState].mrr)}</p>
                </div>
                <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                  <p className="text-10px text-gray-500">Pipeline</p>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(stateDataMap[selectedState].pipeline)}</p>
                </div>
                <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                  <p className="text-10px text-gray-500">Deals</p>
                  <p className="text-lg font-bold text-gray-800">{stateDataMap[selectedState].deals}</p>
                </div>
              </div>
              <div className="space-y-2">
                {advisorsWithDeals
                  .filter(a => a.location?.toUpperCase().includes(`, ${selectedState}`))
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
                        <span className="text-13px font-semibold text-[#157A6E]">{formatCurrency(a.mrr)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        )}

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
          <button onClick={() => setPipelineMetricsView('deals')}
            className={`px-4 py-2 text-13px font-medium rounded-t-lg transition-colors ${pipelineMetricsView === 'deals' ? 'bg-[#157A6E] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            All Deals
          </button>
          <button onClick={() => setPipelineMetricsView('quotes-vs-sold')}
            className={`px-4 py-2 text-13px font-medium rounded-t-lg transition-colors ${pipelineMetricsView === 'quotes-vs-sold' ? 'bg-[#157A6E] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            Quotes vs Sold
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
      </div>
    );
  };

  // ════════════════════════════════════════════════
  // INTELLIGENCE HUB
  // ════════════════════════════════════════════════
  const renderIntelligence = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Partner Diagnostics</h3>
        {diagnosticRows.length === 0 ? (
          <p className="text-12px text-gray-400 italic">All partners healthy — no diagnostics needed</p>
        ) : (
          <table className="w-full text-12px">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 font-medium text-gray-500">Partner</th>
                <th className="text-left py-2 font-medium text-gray-500">Pulse</th>
                <th className="text-left py-2 font-medium text-gray-500">Deal Health</th>
                <th className="text-left py-2 font-medium text-gray-500">Friction</th>
                <th className="text-left py-2 font-medium text-gray-500">Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {diagnosticRows.map((row, i) => {
                const advisor = advisors.find(a => a.name === row.advisor);
                return (
                  <tr key={i} className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => { if (advisor) { setSelectedAdvisor(advisor); setPanelOpen(true); } }}>
                    <td className="py-2 font-medium text-gray-800">{row.advisor}</td>
                    <td className="py-2"><PulseBadge pulse={row.pulse} /></td>
                    <td className="py-2"><DealHealthBadge health={row.dealHealth} /></td>
                    <td className="py-2"><FrictionBadge level={row.friction} /></td>
                    <td className="py-2 text-gray-600 max-w-[300px] truncate">{row.diagnosis}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Portfolio Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['top10', 'next20', 'other'] as const).map(tier => {
            const tierAdvisors = advisors.filter(a => a.tier === tier);
            const tierMRR = tierAdvisors.reduce((s, a) => s + a.mrr, 0);
            const label = tier === 'top10' ? 'Top 10' : tier === 'next20' ? 'Next 20' : 'Other';
            return (
              <div key={tier} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-11px text-gray-500 mb-1">{label}</p>
                <p className="text-xl font-semibold text-gray-800">{tierAdvisors.length}</p>
                <p className="text-12px text-gray-500">{formatCurrency(tierMRR)} MRR</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════
  // STRATEGIC
  // ════════════════════════════════════════════════
  const renderStrategic = () => {
    const frictionIssues = advisors.filter(a => a.friction === 'High' || a.friction === 'Critical');

    const healthValue = (a: Advisor): number => {
      const pulseScores: Record<string, number> = { Strong: 90, Steady: 65, Rising: 55, Fading: 30, Flatline: 10 };
      const frictionPenalty: Record<string, number> = { Low: 0, Moderate: -10, High: -25, Critical: -40 };
      const trajectoryMod: Record<string, number> = { Accelerating: 10, Climbing: 5, Stable: 0, Slipping: -10, Freefall: -20 };
      return Math.max(0, Math.min(100,
        (pulseScores[a.pulse] || 50) + (frictionPenalty[a.friction] || 0) + (trajectoryMod[a.trajectory] || 0)
      ));
    };

    const heatColor = (score: number): string => {
      if (score >= 80) return 'bg-emerald-500';
      if (score >= 65) return 'bg-emerald-400';
      if (score >= 50) return 'bg-yellow-400';
      if (score >= 35) return 'bg-orange-400';
      if (score >= 20) return 'bg-red-400';
      return 'bg-red-600';
    };

    const sortedAdvisors = [...advisors].filter(a => a.mrr > 0).sort((a, b) => b.mrr - a.mrr);
    const tierGroups = [
      { label: 'Top 10', tier: 'top10', advisors: sortedAdvisors.filter(a => a.tier === 'top10') },
      { label: 'Next 20', tier: 'next20', advisors: sortedAdvisors.filter(a => a.tier === 'next20') },
      { label: 'Other', tier: 'other', advisors: sortedAdvisors.filter(a => a.tier === 'other') },
    ].filter(g => g.advisors.length > 0);

    const frictionByLevel = [
      { level: 'Critical', count: advisors.filter(a => a.friction === 'Critical').length, mrr: advisors.filter(a => a.friction === 'Critical').reduce((s, a) => s + a.mrr, 0), color: 'bg-red-600' },
      { level: 'High', count: advisors.filter(a => a.friction === 'High').length, mrr: advisors.filter(a => a.friction === 'High').reduce((s, a) => s + a.mrr, 0), color: 'bg-red-400' },
      { level: 'Moderate', count: advisors.filter(a => a.friction === 'Moderate').length, mrr: advisors.filter(a => a.friction === 'Moderate').reduce((s, a) => s + a.mrr, 0), color: 'bg-amber-400' },
      { level: 'Low', count: advisors.filter(a => a.friction === 'Low').length, mrr: advisors.filter(a => a.friction === 'Low').reduce((s, a) => s + a.mrr, 0), color: 'bg-emerald-400' },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Days to Quarter End" value={`${DAYS_REMAINING}`} change={QUARTER_END} changeType="neutral" />
          <KPICard label="High Friction Partners" value={`${frictionIssues.length}`} change={`${formatCurrency(frictionIssues.reduce((s, a) => s + a.mrr, 0))} at risk`} changeType={frictionIssues.length > 0 ? "negative" : "neutral"} />
          <KPICard label="Critical Friction" value={`${advisors.filter(a => a.friction === 'Critical').length}`} change={advisors.filter(a => a.friction === 'Critical').length > 0 ? 'Immediate action needed' : 'None'} changeType={advisors.filter(a => a.friction === 'Critical').length > 0 ? "negative" : "positive"} />
          <KPICard label="Healthy Partners" value={`${advisors.filter(a => a.friction === 'Low' && (a.pulse === 'Strong' || a.pulse === 'Steady')).length}`} change={`of ${advisors.length} total`} changeType="positive" />
        </div>

        {/* Friction Distribution */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Friction Distribution</h3>
          <div className="flex h-8 rounded-lg overflow-hidden mb-3">
            {frictionByLevel.filter(f => f.count > 0).map(f => (
              <div key={f.level} className={`${f.color} flex items-center justify-center transition-all`}
                   style={{ width: `${(f.count / advisors.length) * 100}%` }}>
                <span className="text-[10px] font-bold text-white">{f.count}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {frictionByLevel.filter(f => f.count > 0).map(f => (
              <div key={f.level} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${f.color}`} />
                <span className="text-11px text-gray-600">{f.level}: {f.count} ({formatCurrency(f.mrr)})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Partner Health Heatmap</h3>
              <p className="text-11px text-gray-400 mt-0.5">Composite score: Pulse + Trajectory + Friction · Sized by MRR</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                <div className="w-3 h-2 rounded-sm bg-red-600" />
                <div className="w-3 h-2 rounded-sm bg-red-400" />
                <div className="w-3 h-2 rounded-sm bg-orange-400" />
                <div className="w-3 h-2 rounded-sm bg-yellow-400" />
                <div className="w-3 h-2 rounded-sm bg-emerald-400" />
                <div className="w-3 h-2 rounded-sm bg-emerald-500" />
              </div>
              <span className="text-10px text-gray-400 ml-1">Critical → Healthy</span>
            </div>
          </div>
          {tierGroups.map(group => (
            <div key={group.tier} className="mb-5 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <TierBadge tier={group.tier as PartnerTier} />
                <span className="text-11px text-gray-400">{group.advisors.length} partners · {formatCurrency(group.advisors.reduce((s, a) => s + a.mrr, 0))} MRR</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.advisors.map(a => {
                  const score = healthValue(a);
                  const size = Math.max(36, Math.min(72, 36 + (a.mrr / 1000) * 1.2));
                  return (
                    <div key={a.id}
                      className={`${heatColor(score)} rounded-md flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-gray-800 hover:ring-offset-1 transition-all group relative`}
                      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px` }}
                      onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); setActiveViewRaw('relationships'); }}>
                      <span className="text-[9px] font-bold text-white leading-tight text-center px-0.5">
                        {a.name.split(' ').map(n => n[0]).join('')}
                      </span>
                      <span className="text-[8px] text-white opacity-80">{score}</span>
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-10px rounded-lg px-3 py-2 whitespace-nowrap z-20 shadow-lg">
                        <p className="font-semibold">{a.name}</p>
                        <p className="text-gray-300">{a.company} · {formatCurrency(a.mrr)}</p>
                        <div className="flex items-center gap-2 mt-1 text-[9px]">
                          <span>Pulse: {a.pulse}</span><span>·</span>
                          <span>Friction: {a.friction}</span><span>·</span>
                          <span>Trajectory: {a.trajectory}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Friction Cases */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">
            Friction Cases
            {frictionIssues.length > 0 && <span className="ml-2 text-12px font-normal text-red-500">({frictionIssues.length} requiring attention · {formatCurrency(frictionIssues.reduce((s, a) => s + a.mrr, 0))} MRR at risk)</span>}
          </h3>
          {frictionIssues.length === 0 ? (
            <p className="text-12px text-gray-400 italic">No high-friction partners</p>
          ) : (
            <div className="space-y-3">
              {frictionIssues.sort((a, b) => {
                const order: Record<string, number> = { Critical: 0, High: 1 };
                return (order[a.friction] ?? 2) - (order[b.friction] ?? 2) || b.mrr - a.mrr;
              }).map(a => (
                <div key={a.id} className={`p-4 rounded-lg cursor-pointer transition-colors ${a.friction === 'Critical' ? 'bg-red-50 border border-red-200 hover:bg-red-100' : 'bg-amber-50 border border-amber-200 hover:bg-amber-100'}`}
                     onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); setActiveViewRaw('relationships'); }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-13px font-semibold text-gray-800">{a.name}</p>
                        <FrictionBadge level={a.friction} />
                        <PulseBadge pulse={a.pulse} />
                        <TrajectoryBadge trajectory={a.trajectory} />
                      </div>
                      <p className="text-12px text-gray-600">{a.company} · {a.location || 'Unknown'}</p>
                      <p className="text-11px text-gray-500 mt-1.5 leading-relaxed">{a.diagnosis}</p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-[15px] font-bold text-gray-800">{formatCurrency(a.mrr)}</p>
                      <p className="text-10px text-gray-400">monthly</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supplier Accountability */}
        {ratings && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Supplier Accountability</h3>
                  <p className="text-11px text-gray-400 mt-0.5">Data from The Channel Standard Ratings Platform</p>
                </div>
                <a href="https://www.the-channel-standard.com" target="_blank" rel="noopener noreferrer"
                  className="text-[#157A6E] text-11px font-semibold hover:underline flex items-center gap-1">
                  View Full Ratings
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6v12h12v-6m0-6l4-4m0 0l-4 4m4-4v4" />
                  </svg>
                </a>
              </div>
              <SupplierAccountabilityCard data={ratings} loading={ratingsLoading} />
            </div>
            {ratings?.supplier?.recentFeedback && ratings.supplier.recentFeedback.length > 0 && (
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <AdvisorSentimentFeed data={ratings} />
              </div>
            )}
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
    'intelligence-hub': renderIntelligence,
    'relationships': renderRelationships,
    'pipeline': renderPipeline,
    'strategic': renderStrategic,
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
