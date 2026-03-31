'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, DollarSign, Brain, Activity,
  TrendingDown, TrendingUp, Zap, Users, ChevronDown, ChevronUp, X,
  ArrowLeft, MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays,
  Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, RefreshCw,
  Megaphone, Star, TrendingUp as TrendingUpIcon, CheckCircle, AlertCircle as AlertCircleIcon,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
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

  useEffect(() => { fetchData(); }, []);

  // Wire up advisor -> deal relationship
  const advisorsWithDeals = useMemo(() => {
    return advisors.map(a => ({
      ...a,
      deals: deals.filter(d => d.advisorId === a.id).map(d => d.id),
    }));
  }, [advisors, deals]);

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
  const top5Ids = new Set(
    [...quadrantAdvisors].sort((a, b) => b.mrr - a.mrr).slice(0, 5).map(a => a.id)
  );

  const engScore = (a: Advisor) => {
    const scores: Record<string, number> = { Strong: 3, Steady: 2, Rising: 2.5, Fading: 1, Flatline: 0 };
    const eb = a.engagementBreakdown;
    return ((scores[eb.engagement] ?? 1.5) + (scores[eb.pipelineStrength] ?? 1.5) + (scores[eb.responsiveness] ?? 1.5) + (scores[eb.growthPotential] ?? 1.5)) / 4;
  };

  // Diagnostic rows
  const diagnosticRows: DiagnosticRow[] = advisors
    .filter(a => a.friction !== 'Low' || a.pulse === 'Fading' || a.pulse === 'Flatline')
    .map(a => ({ advisor: a.name, pulse: a.pulse, dealHealth: a.dealHealth, friction: a.friction, diagnosis: a.diagnosis }));

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

  const renderCommandCenter = () => (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Portfolio MRR" value={formatCurrency(totalMRR)} change={`${advisors.length} partners`} changeType="positive" />
        <KPICard label="Active Pipeline" value={formatCurrency(pipelineMRR)} change={`${activePipeline.length} deals`} changeType="positive" />
        <KPICard label="At-Risk MRR" value={formatCurrency(atRiskMRR)} change={`${atRiskAdvisors.length} partners`} changeType={atRiskAdvisors.length > 0 ? "negative" : "neutral"} />
        <KPICard label="Closed Won QTD" value={formatCurrency(closedWonMRR)} change={`${closedWonDeals.length} deals`} changeType="positive" />
      </div>

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

      {/* Revenue Intent */}
      {intents.filter((i: any) => i.signals90d > 0).length > 0 && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Revenue Intent</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {intents.filter((i: any) => i.signals90d > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 8).map((intent: any) => {
              const colors: Record<string, string> = { Hot: 'border-red-300 bg-red-50', Warm: 'border-amber-300 bg-amber-50', Interested: 'border-blue-300 bg-blue-50', Cold: 'border-gray-200 bg-gray-50' };
              const badgeColors: Record<string, string> = { Hot: 'bg-red-100 text-red-700', Warm: 'bg-amber-100 text-amber-700', Interested: 'bg-blue-100 text-blue-700', Cold: 'bg-gray-100 text-gray-500' };
              return (
                <div key={intent.advisorId} className={`rounded-lg border p-3 ${colors[intent.label] || 'border-gray-200'} cursor-pointer hover:shadow-sm`}
                     onClick={() => { const a = advisorsWithDeals.find(x => x.id === intent.advisorId); if (a) { setSelectedAdvisor(a); setPanelOpen(true); } }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-12px font-semibold text-gray-800 truncate">{intent.advisorName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${badgeColors[intent.label]}`}>{intent.label}</span>
                  </div>
                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mb-1.5">
                    <div className={`h-full rounded-full ${intent.score >= 70 ? 'bg-red-400' : intent.score >= 40 ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${intent.score}%` }} />
                  </div>
                  <div className="text-10px text-gray-500">
                    {intent.quoteCount30d > 0 && <span className="font-medium text-gray-700">{intent.quoteCount30d} quotes · </span>}
                    {intent.signals30d} signals (30d)
                    {intent.topProducts.length > 0 && <span className="block mt-0.5">{intent.topProducts.join(', ')}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Engagement Quadrant */}
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Partner Engagement Quadrant</h3>
        <div className="relative h-[300px] border border-gray-200 rounded-lg bg-gray-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-px h-full bg-gray-300 absolute left-1/2" />
            <div className="h-px w-full bg-gray-300 absolute top-1/2" />
          </div>
          <span className="absolute top-2 left-3 text-10px text-gray-400">High Engagement · Low MRR</span>
          <span className="absolute top-2 right-3 text-10px text-gray-400">High Engagement · High MRR</span>
          <span className="absolute bottom-2 left-3 text-10px text-gray-400">Low Engagement · Low MRR</span>
          <span className="absolute bottom-2 right-3 text-10px text-gray-400">Low Engagement · High MRR</span>
          {quadrantAdvisors.map(a => {
            const eng = engScore(a);
            const x = (a.mrr / maxMRR) * 90 + 5;
            const y = 95 - (eng / 3) * 90;
            const pulseColor: Record<string, string> = { Strong: '#22c55e', Rising: '#3b82f6', Steady: '#eab308', Fading: '#f97316', Flatline: '#ef4444' };
            return (
              <div key={a.id} className="absolute cursor-pointer group" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                   onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}>
                <div className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ backgroundColor: pulseColor[a.pulse] || '#9ca3af' }} />
                {top5Ids.has(a.id) && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-medium text-gray-600 whitespace-nowrap">
                    {a.name.split(' ')[0]} {a.name.split(' ')[1]?.[0]}.
                  </span>
                )}
                <div className="hidden group-hover:block absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-10px rounded px-2 py-1 whitespace-nowrap z-10">
                  {a.name} · {formatCurrency(a.mrr)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderRelationships = () => {
    // Calculate segment counts
    const allAdvisorsCount = advisorsWithDeals.length;
    const activatedCount = advisorsWithDeals.filter(a => a.pulse !== 'Flatline').length;
    const activeCount = advisorsWithDeals.filter(a => ['Strong', 'Rising', 'Steady'].includes(a.pulse)).length;
    const top20Count = [...advisorsWithDeals].sort((a, b) => b.mrr - a.mrr).slice(0, 20).length;
    const needsAttentionCount = advisorsWithDeals.filter(a =>
      a.friction === 'High' || a.friction === 'Critical' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall'
    ).length;

    // Calculate filtered advisors based on segment
    let filteredAdvisors = advisorsWithDeals;
    if (relationshipFilter === 'Activated') {
      filteredAdvisors = advisorsWithDeals.filter(a => a.pulse !== 'Flatline');
    } else if (relationshipFilter === 'Active') {
      filteredAdvisors = advisorsWithDeals.filter(a => ['Strong', 'Rising', 'Steady'].includes(a.pulse));
    } else if (relationshipFilter === 'Strategic Top 20') {
      const top20Ids = new Set([...advisorsWithDeals].sort((a, b) => b.mrr - a.mrr).slice(0, 20).map(a => a.id));
      filteredAdvisors = advisorsWithDeals.filter(a => top20Ids.has(a.id));
    } else if (relationshipFilter === 'Needs Attention') {
      filteredAdvisors = advisorsWithDeals.filter(a =>
        a.friction === 'High' || a.friction === 'Critical' || a.trajectory === 'Slipping' || a.trajectory === 'Freefall'
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

    // Calculate days since last contact
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

    if (panelOpen && selectedAdvisor) {
      return (
        <div className="space-y-4">
          <button onClick={() => { setPanelOpen(false); setSelectedAdvisor(null); }}
                  className="flex items-center gap-1 text-12px text-[#157A6E] hover:underline">
            <ArrowLeft className="w-3 h-3" /> Back to list
          </button>
          <AdvisorPanel advisor={selectedAdvisor} deals={deals.filter(d => d.advisorId === selectedAdvisor.id)} isOpen={true} onClose={() => { setPanelOpen(false); setSelectedAdvisor(null); }} />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Segmentation Filter Bar */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-4">
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

        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="text-12px text-gray-600 font-medium">
            Showing {sortedAdvisors.length} partners
          </div>
          <div className="flex gap-2">
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

        {/* Advisors List */}
        <div className="space-y-2">
          {sortedAdvisors.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-12px">No partners match this segment</p>
            </div>
          ) : (
            sortedAdvisors.map(a => {
              const daysSince = getDaysSinceContact(a.lastContact);
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-[10px] border border-[#e8e5e1] p-4 hover:shadow-md cursor-pointer transition-all"
                  onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-13px font-semibold text-gray-900">{a.name}</p>
                      <p className="text-11px text-gray-500">{a.company} · {a.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-13px font-semibold text-gray-800">{formatCurrency(a.mrr)}</p>
                      <TierBadge tier={a.tier} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <PulseBadge pulse={a.pulse} />
                    <TrajectoryBadge trajectory={a.trajectory} />
                    <FrictionBadge level={a.friction} />
                    <span className="text-11px text-gray-500 ml-auto">
                      Last contacted: {daysSince}d ago
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

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

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="flex items-center gap-3 mb-4">
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
          <div className="space-y-2">
            {filtered.length === 0 && <p className="text-12px text-gray-400 italic">No deals match filters</p>}
            {filtered.map(d => {
              const adv = advisors.find(a => a.id === d.advisorId);
              return (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                     onClick={() => { if (adv) { setSelectedAdvisor(adv); setPanelOpen(true); setActiveViewRaw('relationships'); } }}>
                  <div className="flex-1">
                    <p className="text-13px font-medium text-gray-800">{d.name}</p>
                    <p className="text-11px text-gray-500">{adv?.name || 'Unassigned'} · {d.stage} · {d.daysInStage}d in stage</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <DealHealthBadge health={d.health} />
                    <span className="text-13px font-semibold text-gray-800">{formatCurrency(d.mrr)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderIntelligence = () => (
    <div className="space-y-6">
      {/* Diagnostics Table */}
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
              {diagnosticRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-800">{row.advisor}</td>
                  <td className="py-2"><PulseBadge pulse={row.pulse} /></td>
                  <td className="py-2"><DealHealthBadge health={row.dealHealth} /></td>
                  <td className="py-2"><FrictionBadge level={row.friction} /></td>
                  <td className="py-2 text-gray-600 max-w-[300px] truncate">{row.diagnosis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tier Distribution */}
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

  const renderStrategic = () => {
    const frictionIssues = advisors.filter(a => a.friction === 'High' || a.friction === 'Critical');

    // Heatmap: advisors in a grid, color-coded by health score (composite of pulse, friction, trajectory)
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

    const heatTextColor = (score: number): string => {
      if (score >= 50) return 'text-white';
      return 'text-white';
    };

    // Sort advisors: highest MRR first for visual impact
    const sortedAdvisors = [...advisors].filter(a => a.mrr > 0).sort((a, b) => b.mrr - a.mrr);

    // Group by tier
    const tierGroups = [
      { label: 'Top 10', tier: 'top10', advisors: sortedAdvisors.filter(a => a.tier === 'top10') },
      { label: 'Next 20', tier: 'next20', advisors: sortedAdvisors.filter(a => a.tier === 'next20') },
      { label: 'Other', tier: 'other', advisors: sortedAdvisors.filter(a => a.tier === 'other') },
    ].filter(g => g.advisors.length > 0);

    // Friction timeline data for sparkline effect
    const frictionByLevel = [
      { level: 'Critical', count: advisors.filter(a => a.friction === 'Critical').length, mrr: advisors.filter(a => a.friction === 'Critical').reduce((s, a) => s + a.mrr, 0), color: 'bg-red-600', textColor: 'text-red-700', bgColor: 'bg-red-50' },
      { level: 'High', count: advisors.filter(a => a.friction === 'High').length, mrr: advisors.filter(a => a.friction === 'High').reduce((s, a) => s + a.mrr, 0), color: 'bg-red-400', textColor: 'text-red-600', bgColor: 'bg-red-50' },
      { level: 'Moderate', count: advisors.filter(a => a.friction === 'Moderate').length, mrr: advisors.filter(a => a.friction === 'Moderate').reduce((s, a) => s + a.mrr, 0), color: 'bg-amber-400', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
      { level: 'Low', count: advisors.filter(a => a.friction === 'Low').length, mrr: advisors.filter(a => a.friction === 'Low').reduce((s, a) => s + a.mrr, 0), color: 'bg-emerald-400', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    ];

    return (
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Days to Quarter End" value={`${DAYS_REMAINING}`} change={QUARTER_END} changeType="neutral" />
          <KPICard label="High Friction Partners" value={`${frictionIssues.length}`} change={`${formatCurrency(frictionIssues.reduce((s, a) => s + a.mrr, 0))} at risk`} changeType={frictionIssues.length > 0 ? "negative" : "neutral"} />
          <KPICard label="Critical Friction" value={`${advisors.filter(a => a.friction === 'Critical').length}`} change={advisors.filter(a => a.friction === 'Critical').length > 0 ? 'Immediate action needed' : 'None'} changeType={advisors.filter(a => a.friction === 'Critical').length > 0 ? "negative" : "positive"} />
          <KPICard label="Healthy Partners" value={`${advisors.filter(a => a.friction === 'Low' && (a.pulse === 'Strong' || a.pulse === 'Steady')).length}`} change={`of ${advisors.length} total`} changeType="positive" />
        </div>

        {/* Friction Distribution Bar */}
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

        {/* Partner Health Heatmap */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Partner Health Heatmap</h3>
              <p className="text-11px text-gray-400 mt-0.5">Composite score: Pulse + Trajectory + Friction · Sized by MRR · Click to drill in</p>
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
                    <div
                      key={a.id}
                      className={`${heatColor(score)} rounded-md flex flex-col items-center justify-center cursor-pointer
                        hover:ring-2 hover:ring-gray-800 hover:ring-offset-1 transition-all group relative`}
                      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px` }}
                      onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); setActiveViewRaw('relationships'); }}
                    >
                      <span className={`text-[9px] font-bold ${heatTextColor(score)} leading-tight text-center px-0.5`}>
                        {a.name.split(' ').map(n => n[0]).join('')}
                      </span>
                      <span className={`text-[8px] ${heatTextColor(score)} opacity-80`}>
                        {score}
                      </span>
                      {/* Tooltip */}
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-10px rounded-lg px-3 py-2 whitespace-nowrap z-20 shadow-lg">
                        <p className="font-semibold">{a.name}</p>
                        <p className="text-gray-300">{a.company} · {formatCurrency(a.mrr)}</p>
                        <div className="flex items-center gap-2 mt-1 text-[9px]">
                          <span>Pulse: {a.pulse}</span>
                          <span>·</span>
                          <span>Friction: {a.friction}</span>
                          <span>·</span>
                          <span>Trajectory: {a.trajectory}</span>
                        </div>
                        {a.diagnosis && <p className="text-gray-400 mt-1 max-w-[250px] text-[9px]">{a.diagnosis.substring(0, 80)}...</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Friction Detail Cards */}
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

        {/* Supplier Accountability Section */}
        {ratings && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Supplier Accountability</h3>
                  <p className="text-11px text-gray-400 mt-0.5">Data from The Channel Standard Ratings Platform</p>
                </div>
                <a
                  href="https://www.the-channel-standard.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#157A6E] text-11px font-semibold hover:underline flex items-center gap-1"
                >
                  View Full Ratings
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6v12h12v-6m0-6l4-4m0 0l-4 4m4-4v4" />
                  </svg>
                </a>
              </div>
              <SupplierAccountabilityCard data={ratings} loading={ratingsLoading} />
            </div>

            {/* Advisor Sentiment Feed */}
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

  const renderWhiteSpace = () => {
    const advisorsWithDealsFiltered = advisorsWithDeals.filter(a => deals.some(d => d.advisorId === a.id));

    const whiteSpaceData = advisorsWithDealsFiltered.map(advisor => {
      const advisorDeals = deals.filter(d => d.advisorId === advisor.id);
      const soldProducts = new Set(advisorDeals.map(d => d.name.split(' ')[0]).filter(p => SERVICE_CATALOG.includes(p)));
      const opportunityProducts = SERVICE_CATALOG.filter(p => !soldProducts.has(p));
      const crossSellScore = (soldProducts.size / SERVICE_CATALOG.length) * 100;

      return {
        ...advisor,
        soldProducts: Array.from(soldProducts),
        opportunityProducts,
        crossSellScore,
        opportunityMRR: opportunityProducts.reduce((sum, p) => {
          const seed = `${advisor.id}-${p}`;
          return sum + (2000 + seededRandom(seed) * 6000);
        }, 0),
      };
    });

    const totalWhiteSpaceMRR = whiteSpaceData.reduce((s, a) => s + a.opportunityMRR, 0);
    const avgCrossSellScore = whiteSpaceData.reduce((s, a) => s + a.crossSellScore, 0) / whiteSpaceData.length;

    const allOpportunities = whiteSpaceData.flatMap(a => a.opportunityProducts.map(p => ({
      product: p,
      advisor: a.name,
      mrr: 2000 + seededRandom(`${a.id}-${p}`) * 6000,
    }))).sort((a, b) => b.mrr - a.mrr).slice(0, 5);

    const sorted = [...whiteSpaceData].sort((a, b) => a.crossSellScore - b.crossSellScore);

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Total White Space MRR" value={formatCurrency(totalWhiteSpaceMRR)} change={`${whiteSpaceData.length} advisors`} changeType="positive" />
          <KPICard label="Avg Cross-Sell Score" value={`${avgCrossSellScore.toFixed(0)}%`} change="of catalog covered" changeType="neutral" />
          <KPICard label="Top Opportunity" value={allOpportunities.length > 0 ? allOpportunities[0].product : 'N/A'} change={allOpportunities.length > 0 ? formatCurrency(allOpportunities[0].mrr) : ''} changeType="positive" />
          <KPICard label="Advisors Assessed" value={`${whiteSpaceData.length}`} change="with active deals" changeType="positive" />
        </div>

        {/* Account Grid */}
        <div className="space-y-4">
          <h2 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Account Analysis</h2>
          <div className="grid grid-cols-1 gap-4">
            {sorted.map(advisor => {
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
                    {/* Products Sold */}
                    <div>
                      <p className="text-12px font-semibold text-gray-700 mb-2">Products Sold ({advisor.soldProducts.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {advisor.soldProducts.length > 0 ? advisor.soldProducts.map(p => (
                          <span key={p} className="px-2 py-1 bg-white/70 rounded text-11px font-medium text-gray-700">
                            {p}
                          </span>
                        )) : (
                          <span className="text-11px text-gray-500 italic">None</span>
                        )}
                      </div>
                    </div>

                    {/* White Space Opportunities */}
                    <div>
                      <p className="text-12px font-semibold text-gray-700 mb-2">White Space Opportunities ({advisor.opportunityProducts.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {advisor.opportunityProducts.slice(0, 3).map(p => {
                          const oppMrr = 2000 + seededRandom(`${advisor.id}-${p}`) * 6000;
                          return (
                            <div key={p} className="px-2 py-1 bg-white/70 rounded text-10px text-gray-700 flex items-center gap-1">
                              <span className="font-medium">{p}</span>
                              <span className="text-gray-500">({formatCurrency(oppMrr)})</span>
                            </div>
                          );
                        })}
                        {advisor.opportunityProducts.length > 3 && (
                          <span className="text-10px text-gray-600 italic">+{advisor.opportunityProducts.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#157A6E] to-[#0f5550]" style={{ width: `${advisor.crossSellScore}%` }} />
                    </div>
                    <span className={`text-11px font-bold ${scoreColor}`}>{advisor.crossSellScore.toFixed(1)}% of catalog</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Opportunities */}
        {allOpportunities.length > 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Top 5 Opportunities</h3>
            <div className="space-y-2">
              {allOpportunities.map((opp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-13px font-medium text-gray-800">{opp.product}</p>
                    <p className="text-11px text-gray-500">{opp.advisor}</p>
                  </div>
                  <span className="text-13px font-semibold text-[#157A6E]">{formatCurrency(opp.mrr)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTerritory = () => {
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

      return locationLower.includes('international') || locationLower.includes('uk') || locationLower.includes('canada') ? 'International' : 'Unknown';
    };

    const [searchCity, setSearchCity] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    const advisorsByRegion: Record<string, typeof advisorsWithDeals> = {};
    advisorsWithDeals.forEach(a => {
      const region = a.location ? regionMapping(a.location) : 'Unknown';
      if (!advisorsByRegion[region]) advisorsByRegion[region] = [];
      advisorsByRegion[region].push(a);
    });

    const filteredAdvisors = searchCity ? advisorsWithDeals.filter(a => a.location?.toLowerCase().includes(searchCity.toLowerCase())) : [];
    const currentRegion = selectedRegion ? advisorsByRegion[selectedRegion] || [] : [];
    const displayAdvisors = selectedRegion ? currentRegion : (searchCity ? filteredAdvisors : []);
    const displayAdvisorsSorted = [...displayAdvisors].sort((a, b) => b.mrr - a.mrr);

    return (
      <div className="space-y-6">
        {/* Trip Planner Header */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h2 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-3">Trip Planner</h2>
          <input
            type="text"
            placeholder="Search by city or region..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E]"
          />
        </div>

        {/* Regions Grid */}
        {!searchCity && !selectedRegion && (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(advisorsByRegion).map(([region, advs]) => {
              const regionMRR = advs.reduce((s, a) => s + a.mrr, 0);
              return (
                <div
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className="bg-white rounded-[10px] border border-[#e8e5e1] p-5 cursor-pointer hover:border-[#157A6E] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">{region}</h3>
                      <p className="text-12px text-gray-500 mt-1">{advs.length} partners · {formatCurrency(regionMRR)} MRR</p>
                    </div>
                    <MapPin className="w-5 h-5 text-[#157A6E]" />
                  </div>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                    {advs.slice(0, 3).map(a => (
                      <div key={a.id} className="text-11px text-gray-600">
                        <span className="font-medium">{a.name}</span> · {formatCurrency(a.mrr)}
                      </div>
                    ))}
                    {advs.length > 3 && <p className="text-10px text-gray-400 italic">+{advs.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trip Summary - Region Selected */}
        {selectedRegion && displayAdvisorsSorted.length > 0 && (
          <>
            <button
              onClick={() => setSelectedRegion(null)}
              className="flex items-center gap-1 text-12px text-[#157A6E] hover:underline"
            >
              <ArrowLeft className="w-3 h-3" /> Back to regions
            </button>

            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h2 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Trip Summary: {selectedRegion}</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-11px text-gray-500 mb-1">Total Partners</p>
                  <p className="text-xl font-bold text-gray-800">{displayAdvisorsSorted.length}</p>
                </div>
                <div>
                  <p className="text-11px text-gray-500 mb-1">Total MRR</p>
                  <p className="text-xl font-bold text-[#157A6E]">{formatCurrency(displayAdvisorsSorted.reduce((s, a) => s + a.mrr, 0))}</p>
                </div>
              </div>

              {displayAdvisorsSorted.length >= 1 && (
                <div className="bg-[#F7F5F2] rounded-lg p-4 mb-4">
                  <p className="text-12px font-semibold text-gray-800 mb-2">Suggested Agenda</p>
                  <ul className="space-y-1 text-11px text-gray-600">
                    <li>Lunch with <span className="font-medium">{displayAdvisorsSorted[0].name}</span> ({formatCurrency(displayAdvisorsSorted[0].mrr)})</li>
                    {displayAdvisorsSorted.length >= 2 && <li>Office visit with <span className="font-medium">{displayAdvisorsSorted[1].name}</span> ({formatCurrency(displayAdvisorsSorted[1].mrr)})</li>}
                    {displayAdvisorsSorted.length >= 3 && <li>Coffee with <span className="font-medium">{displayAdvisorsSorted[2].name}</span> ({formatCurrency(displayAdvisorsSorted[2].mrr)})</li>}
                  </ul>
                </div>
              )}

              <h3 className="text-13px font-semibold text-gray-800 mb-3">Partners to Visit</h3>
              <div className="space-y-2">
                {displayAdvisorsSorted.map((a, idx) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-13px font-medium text-gray-800">#{idx + 1} {a.name}</p>
                      <p className="text-11px text-gray-500">{a.company} · Last contact: {a.lastContact}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-13px font-bold text-gray-800">{formatCurrency(a.mrr)}</p>
                      <PulseBadge pulse={a.pulse} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Search Results */}
        {searchCity && filteredAdvisors.length > 0 && (
          <>
            <button
              onClick={() => setSearchCity('')}
              className="flex items-center gap-1 text-12px text-[#157A6E] hover:underline"
            >
              <ArrowLeft className="w-3 h-3" /> Clear search
            </button>

            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h2 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Results: {searchCity}</h2>
              <div className="space-y-2">
                {displayAdvisorsSorted.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-13px font-medium text-gray-800">{a.name}</p>
                      <p className="text-11px text-gray-500">{a.location} · {a.company}</p>
                    </div>
                    <span className="text-13px font-semibold text-gray-800">{formatCurrency(a.mrr)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {searchCity && filteredAdvisors.length === 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-8 text-center">
            <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-13px text-gray-500">No partners found in "{searchCity}"</p>
          </div>
        )}
      </div>
    );
  };

  const renderCoMarketing = () => {
    const [cmTab, setCmTab] = useState<'campaigns' | 'assets' | 'results'>('campaigns');

    const campaigns = [
      { id: 'cm1', name: 'Cloud Migration Assessment', status: 'active' as const, partners: 8, leadsGenerated: 23, type: 'Email Nurture', startDate: '2026-02-15', endDate: '2026-04-15' },
      { id: 'cm2', name: 'Security Posture Review', status: 'active' as const, partners: 5, leadsGenerated: 14, type: 'LinkedIn Campaign', startDate: '2026-03-01', endDate: '2026-05-01' },
      { id: 'cm3', name: 'SD-WAN ROI Calculator', status: 'draft' as const, partners: 0, leadsGenerated: 0, type: 'Landing Page + Email', startDate: '', endDate: '' },
      { id: 'cm4', name: 'Hybrid Cloud Webinar Series', status: 'completed' as const, partners: 12, leadsGenerated: 47, type: 'Webinar', startDate: '2026-01-10', endDate: '2026-02-28' },
      { id: 'cm5', name: 'Managed Security Q1 Push', status: 'completed' as const, partners: 6, leadsGenerated: 31, type: 'Multi-Channel', startDate: '2026-01-01', endDate: '2026-03-15' },
    ];

    const assets = [
      { name: 'Cloud Migration Email Sequence (3-part)', type: 'Email', format: 'HTML', rebrandable: true },
      { name: 'Security Assessment LinkedIn Posts (5x)', type: 'Social', format: 'Copy + Graphics', rebrandable: true },
      { name: 'SD-WAN ROI Calculator', type: 'Tool', format: 'Interactive PDF', rebrandable: true },
      { name: 'Hybrid Cloud Customer Story — Healthcare', type: 'Case Study', format: 'PDF + Landing Page', rebrandable: true },
      { name: 'Network Transformation Infographic', type: 'Visual', format: 'PNG + AI Source', rebrandable: true },
      { name: 'Managed Security Webinar Deck', type: 'Presentation', format: 'PPTX', rebrandable: true },
    ];

    const statusColor = (s: string) => s === 'active' ? 'bg-green-100 text-green-700' : s === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700';

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Active Campaigns" value={`${campaigns.filter(c => c.status === 'active').length}`} change="running now" changeType="positive" />
          <KPICard label="Partners Engaged" value={`${campaigns.reduce((s, c) => s + c.partners, 0)}`} change="across campaigns" changeType="positive" />
          <KPICard label="Leads Generated" value={`${campaigns.reduce((s, c) => s + c.leadsGenerated, 0)}`} change="all time" changeType="positive" />
          <KPICard label="Asset Library" value={`${assets.length}`} change="rebrandable assets" changeType="neutral" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#e8e5e1] pb-2">
          {(['campaigns', 'assets', 'results'] as const).map(t => (
            <button key={t} onClick={() => setCmTab(t)}
              className={`px-4 py-2 text-13px font-medium rounded-t-lg transition-colors ${cmTab === t ? 'bg-[#157A6E] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t === 'campaigns' ? 'Campaigns' : t === 'assets' ? 'Asset Library' : 'Results'}
            </button>
          ))}
        </div>

        {cmTab === 'campaigns' && (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">{c.name}</p>
                    <p className="text-12px text-gray-500">{c.type}{c.startDate ? ` · ${c.startDate} → ${c.endDate}` : ''}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-11px font-semibold ${statusColor(c.status)}`}>{c.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                    <p className="text-lg font-bold text-gray-800">{c.partners}</p>
                    <p className="text-10px text-gray-500">Partners Using</p>
                  </div>
                  <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                    <p className="text-lg font-bold text-[#157A6E]">{c.leadsGenerated}</p>
                    <p className="text-10px text-gray-500">Leads Generated</p>
                  </div>
                  <div className="text-center p-3 bg-[#F7F5F2] rounded-lg">
                    <p className="text-lg font-bold text-gray-800">{c.partners > 0 ? (c.leadsGenerated / c.partners).toFixed(1) : '—'}</p>
                    <p className="text-10px text-gray-500">Leads / Partner</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {cmTab === 'assets' && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Rebrandable Assets</h3>
              <button className="px-3 py-1.5 bg-[#157A6E] text-white text-12px rounded-lg hover:bg-[#0f5550]">+ Upload Asset</button>
            </div>
            <div className="space-y-2">
              {assets.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-13px font-medium text-gray-800">{a.name}</p>
                    <p className="text-11px text-gray-500">{a.type} · {a.format}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.rebrandable && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-10px rounded-full font-medium">Rebrandable</span>}
                    <button className="text-11px text-[#157A6E] hover:underline">Share</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cmTab === 'results' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Campaign Performance</h3>
              {campaigns.filter(c => c.leadsGenerated > 0).sort((a, b) => b.leadsGenerated - a.leadsGenerated).map(c => (
                <div key={c.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-13px font-medium text-gray-800">{c.name}</p>
                    <p className="text-11px text-gray-500">{c.partners} partners · {c.type}</p>
                  </div>
                  <div className="w-32">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${Math.min(100, (c.leadsGenerated / 50) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-13px font-bold text-[#157A6E] w-16 text-right">{c.leadsGenerated}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const viewRenderers: Record<string, () => React.ReactNode> = {
    'command-center': renderCommandCenter,
    'intelligence-hub': renderIntelligence,
    'relationships': renderRelationships,
    'pipeline': renderPipeline,
    'strategic': renderStrategic,
    'white-space': renderWhiteSpace,
    'territory': renderTerritory,
    'co-marketing': renderCoMarketing,
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
      <AIChat role="manager" selectedAdvisor={selectedAdvisor} live={true} />
    </div>
  );
}
