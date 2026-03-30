'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, DollarSign, Brain, Activity,
  TrendingDown, TrendingUp, Zap, Users, ChevronDown, ChevronUp, X,
  ArrowLeft, MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays,
  Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, RefreshCw,
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
import { TrajectoryBadge } from '@/components/shared/TrajectoryBadge';
import { TierBadge } from '@/components/shared/TierBadge';
import { NAV_ITEMS_MANAGER, STAGE_WEIGHTS, QUARTER_END, DAYS_REMAINING } from '@/lib/constants';
import { Advisor, Deal, DealHealth, FrictionLevel, DiagnosticRow, EngagementScore } from '@/lib/types';
import { adaptAdvisor, adaptDeal } from '@/lib/db/adapter';

type DealStage = 'Discovery' | 'Qualifying' | 'Proposal' | 'Negotiating' | 'Closed Won' | 'Stalled';

export default function LiveManagerPage() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [intents, setIntents] = useState<any[]>([]);
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
      const [advisorsRes, dealsRes, intentsRes] = await Promise.all([
        fetch('/api/live/advisors'),
        fetch('/api/live/deals'),
        fetch('/api/live/intent'),
      ]);
      const rawAdvisors = await advisorsRes.json();
      const rawDeals = await dealsRes.json();
      const rawIntents = await intentsRes.json();
      setAdvisors(rawAdvisors.map(adaptAdvisor));
      setDeals(rawDeals.map(adaptDeal));
      setIntents(Array.isArray(rawIntents) ? rawIntents : []);
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
    const scores = { Strong: 3, Steady: 2, Fading: 1 };
    const eb = a.engagementBreakdown;
    return ((scores[eb.engagement] || 0) + (scores[eb.pipelineStrength] || 0) + (scores[eb.responsiveness] || 0) + (scores[eb.growthPotential] || 0)) / 4;
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
    const filteredAdvisors = relationshipFilter === 'All' ? advisorsWithDeals
      : advisorsWithDeals.filter(a => a.tier === (relationshipFilter === 'Top 10' ? 'top10' : relationshipFilter === 'Next 20' ? 'next20' : 'other'));

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
        <div className="flex items-center gap-2">
          {['All', 'Top 10', 'Next 20', 'Other'].map(f => (
            <button key={f} onClick={() => setRelationshipFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-12px font-medium transition-colors ${relationshipFilter === f ? 'bg-[#157A6E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f}
            </button>
          ))}
        </div>
        <AdvisorTable
          advisors={filteredAdvisors}
          onAdvisorClick={(id) => { const a = advisorsWithDeals.find(x => x.id === id); if (a) { setSelectedAdvisor(a); setPanelOpen(true); } }}
        />
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
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <KPICard label="Days to Quarter End" value={`${DAYS_REMAINING}`} change={QUARTER_END} changeType="neutral" />
          <KPICard label="High Friction Partners" value={`${frictionIssues.length}`} change={`${formatCurrency(frictionIssues.reduce((s, a) => s + a.mrr, 0))} at risk`} changeType={frictionIssues.length > 0 ? "negative" : "neutral"} />
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Friction Analysis</h3>
          {frictionIssues.length === 0 ? (
            <p className="text-12px text-gray-400 italic">No high-friction partners</p>
          ) : (
            <div className="space-y-3">
              {frictionIssues.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100"
                     onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); setActiveViewRaw('relationships'); }}>
                  <div>
                    <p className="text-13px font-medium text-gray-800">{a.name}</p>
                    <p className="text-11px text-gray-500">{a.company} · {a.diagnosis}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FrictionBadge level={a.friction} />
                    <span className="text-13px font-semibold">{formatCurrency(a.mrr)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

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
      <AIChat role="manager" selectedAdvisor={selectedAdvisor} live={true} />
    </div>
  );
}
