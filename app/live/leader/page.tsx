'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, ChevronDown, ChevronRight, ArrowLeft,
  MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays,
  Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, X, RefreshCw, Users,
  TrendingDown, TrendingUp, BarChart3, Star, Shield, CheckCircle,
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
import { SupplierAccountabilityCard, AdvisorSentimentFeed } from '@/components/shared/RatingsDisplay';
import { NAV_ITEMS_LEADER, QUARTER_END, DAYS_REMAINING, STAGE_WEIGHTS } from '@/lib/constants';
import { EngagementScore, DealStage, Advisor, Deal, Rep, ForecastHistoryEntry } from '@/lib/types';
import { adaptAdvisor, adaptDeal, adaptRep } from '@/lib/db/adapter';

function EngLabel({ score }: { score: EngagementScore }) {
  const colors: Record<EngagementScore, string> = {
    Strong: 'bg-green-100 text-green-800',
    Steady: 'bg-amber-100 text-amber-800',
    Fading: 'bg-red-100 text-red-800',
  };
  return <span className={`px-2 py-0.5 rounded-full text-11px font-semibold ${colors[score]}`}>{score}</span>;
}

export default function LiveLeaderDashboard() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [intents, setIntents] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveViewRaw] = useState('command-center');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedReps, setExpandedReps] = useState<string[]>([]);
  const [inlineTab, setInlineTab] = useState<'overview' | 'personal' | 'deals' | 'notes' | 'activity'>('overview');
  const [relationshipsView, setRelationshipsView] = useState<'list' | 'detail'>('list');
  const [expandedKPIPanel, setExpandedKPIPanel] = useState<string | null>(null);
  const [expandedForecastRep, setExpandedForecastRep] = useState<string | null>(null);
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [expandedStage, setExpandedStage] = useState<DealStage | null>(null);
  const [expandedPipelineRep, setExpandedPipelineRep] = useState<string | null>(null);
  const [overrideActions, setOverrideActions] = useState<Record<string, 'approved' | 'denied'>>({});

  const setActiveView = (view: string) => {
    setActiveViewRaw(view);
    if (view !== 'relationships') {
      setSelectedAdvisor(null);
      setPanelOpen(false);
    }
    setExpandedKPIPanel(null);
    setExpandedForecastRep(null);
    setExpandedStage(null);
    setExpandedPipelineRep(null);
    setInlineTab('overview');
    setRelationshipsView('list');
  };

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

  const userName = 'Priya M.';
  const userInitials = 'PM';

  // KPI computations
  const teamMRR = reps.reduce((sum, rep) => sum + rep.managedMRR, 0);
  const prevTeamMRR = teamMRR * 0.942;
  const mrrChange = ((teamMRR - prevTeamMRR) / prevTeamMRR * 100).toFixed(1);
  const teamTarget = reps.reduce((sum, rep) => sum + rep.quotaTarget, 0);
  const teamCommit = reps.reduce((sum, rep) => sum + rep.currentCommit, 0);
  const commitGap = teamTarget - teamCommit;
  const commitPercentage = teamTarget > 0 ? Math.round((teamCommit / teamTarget) * 100) : 0;

  const allDeals = deals;
  const teamPipeline = allDeals.reduce((sum, deal) => sum + deal.mrr, 0);
  const weightedPipeline = allDeals.reduce((sum, deal) => {
    const stageWeight = STAGE_WEIGHTS.find(sw => sw.stage === deal.stage)?.weight || 0;
    return sum + (deal.mrr * stageWeight);
  }, 0);
  const activeDealCount = allDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled').length;
  const atRiskDeals = allDeals.filter(d => d.health === 'At Risk' || d.health === 'Stalled');
  const stalledDeals = allDeals.filter(d => d.stage === 'Stalled');

  const avgWinRate = reps.length > 0 ? Math.round(reps.reduce((s, r) => s + r.winRate, 0) / reps.length) : 0;
  const avgCycle = reps.length > 0 ? Math.round(reps.reduce((s, r) => s + r.avgCycle, 0) / reps.length) : 0;

  const formatCurrency = (num: number): string => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num}`;
  };

  const toggleRepExpansion = (repId: string) => {
    setExpandedReps(prev => prev.includes(repId) ? prev.filter(id => id !== repId) : [...prev, repId]);
  };

  const handleAdvisorClick = (advisorId: string) => {
    const advisor = advisors.find(a => a.id === advisorId);
    if (advisor) {
      setSelectedAdvisor(advisor);
      if (activeView === 'relationships') setRelationshipsView('detail');
      else setPanelOpen(true);
    }
  };

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
          <p className="text-13px text-gray-500 font-['Inter'] mb-4">
            Add reps, advisors, and deals in the admin panel to populate the live dashboard.
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
        <KPICard label="Team MRR" value={formatCurrency(teamMRR)} change={`+${mrrChange}% QoQ`} changeType="positive" />
        <KPICard label="Commit vs Target" value={`${commitPercentage}%`} change={`Gap: ${formatCurrency(commitGap)}`} changeType={commitPercentage >= 90 ? "positive" : "negative"} />
        <KPICard label="Avg Win Rate" value={`${avgWinRate}%`} change={`${avgCycle}d avg cycle`} changeType="neutral" />
        <KPICard label="Pipeline Health" value={`${activeDealCount} active`} change={`${atRiskDeals.length} at risk`} changeType={atRiskDeals.length > 3 ? "negative" : "positive"} />
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-2 gap-6">
        {/* Rep Performance */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Rep Performance</h3>
          <div className="space-y-3">
            {reps.map(rep => {
              const repDeals = deals.filter(d => d.repId === rep.id);
              const repPipeline = repDeals.reduce((s, d) => s + d.mrr, 0);
              const utilization = Math.round((rep.partnerCount / rep.partnerCapacity) * 100);
              const expanded = expandedReps.includes(rep.id);
              return (
                <div key={rep.id}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                       onClick={() => toggleRepExpansion(rep.id)}>
                    <div className="flex items-center gap-3">
                      {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <div>
                        <p className="text-13px font-medium text-gray-800">{rep.name}</p>
                        <p className="text-11px text-gray-500">{rep.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <EngLabel score={rep.engagementScore} />
                      <span className="text-13px font-semibold">{formatCurrency(rep.managedMRR)}</span>
                    </div>
                  </div>
                  {expanded && (
                    <div className="ml-7 mt-2 p-3 bg-white border border-gray-100 rounded-lg text-12px space-y-2">
                      <div className="grid grid-cols-3 gap-3">
                        <div><span className="text-gray-500">Win Rate</span><p className="font-semibold">{rep.winRate}%</p></div>
                        <div><span className="text-gray-500">Avg Cycle</span><p className="font-semibold">{rep.avgCycle}d</p></div>
                        <div><span className="text-gray-500">Capacity</span><p className="font-semibold">{rep.partnerCount}/{rep.partnerCapacity} ({utilization}%)</p></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><span className="text-gray-500">Quota</span><p className="font-semibold">{formatCurrency(rep.quotaTarget)}</p></div>
                        <div><span className="text-gray-500">Commit</span><p className="font-semibold">{formatCurrency(rep.currentCommit)}</p></div>
                        <div><span className="text-gray-500">Pipeline</span><p className="font-semibold">{formatCurrency(repPipeline)}</p></div>
                      </div>
                      {rep.topConcern && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 rounded">
                          <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                          <span className="text-11px text-amber-700">{rep.topConcern}</span>
                        </div>
                      )}
                      {repDeals.length > 0 && (
                        <div className="mt-2">
                          <p className="text-11px text-gray-500 mb-1">Active Deals:</p>
                          {repDeals.slice(0, 5).map(d => (
                            <div key={d.id} className="flex items-center justify-between py-1">
                              <span className="text-11px text-gray-700">{d.name}</span>
                              <div className="flex items-center gap-2">
                                <DealHealthBadge health={d.health} />
                                <span className="text-11px font-medium">{formatCurrency(d.mrr)}</span>
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
        </div>

        {/* Alerts & At-Risk */}
        <div className="space-y-6">
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">At-Risk Deals</h3>
            {atRiskDeals.length === 0 ? (
              <p className="text-12px text-gray-400 italic">No at-risk deals</p>
            ) : (
              <div className="space-y-2">
                {atRiskDeals.map(d => {
                  const adv = advisors.find(a => a.id === d.advisorId);
                  const rep = reps.find(r => r.id === d.repId);
                  return (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-13px font-medium text-gray-800">{d.name}</p>
                        <p className="text-11px text-gray-500">{adv?.name || '?'} · {rep?.name || '?'} · {d.stage} · {d.daysInStage}d</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <DealHealthBadge health={d.health} />
                        <span className="text-13px font-semibold">{formatCurrency(d.mrr)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Quarter Snapshot</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-12px">
                <span className="text-gray-500">Days Remaining</span>
                <span className="font-semibold text-gray-800">{DAYS_REMAINING}</span>
              </div>
              <div className="flex justify-between text-12px">
                <span className="text-gray-500">Team Target</span>
                <span className="font-semibold text-gray-800">{formatCurrency(teamTarget)}</span>
              </div>
              <div className="flex justify-between text-12px">
                <span className="text-gray-500">Current Commit</span>
                <span className="font-semibold text-gray-800">{formatCurrency(teamCommit)}</span>
              </div>
              <div className="flex justify-between text-12px">
                <span className="text-gray-500">Gap to Close</span>
                <span className={`font-semibold ${commitGap > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(Math.abs(commitGap))}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${Math.min(commitPercentage, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Intent Summary */}
      {intents.filter((i: any) => i.signals90d > 0).length > 0 && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Revenue Intent — Top Partners</h3>
          <div className="space-y-2">
            {intents.filter((i: any) => i.signals90d > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 6).map((intent: any) => {
              const badgeColors: Record<string, string> = { Hot: 'bg-red-100 text-red-700', Warm: 'bg-amber-100 text-amber-700', Interested: 'bg-blue-100 text-blue-700', Cold: 'bg-gray-100 text-gray-500' };
              return (
                <div key={intent.advisorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                     onClick={() => handleAdvisorClick(intent.advisorId)}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-10px font-bold ${badgeColors[intent.label]}`}>{intent.label}</span>
                    <div>
                      <p className="text-13px font-medium text-gray-800">{intent.advisorName}</p>
                      <p className="text-10px text-gray-500">
                        {intent.quoteCount30d} quotes · {intent.signals30d} signals (30d)
                        {intent.topProducts.length > 0 ? ` · ${intent.topProducts.join(', ')}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${intent.score >= 70 ? 'bg-red-400' : intent.score >= 40 ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${intent.score}%` }} />
                    </div>
                    <span className="text-11px font-semibold text-gray-600 w-6 text-right">{intent.score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderForecast = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Weighted Pipeline" value={formatCurrency(weightedPipeline)} change="Stage-weighted" changeType="neutral" />
        <KPICard label="Commit Coverage" value={`${commitPercentage}%`} change={`${formatCurrency(teamCommit)} / ${formatCurrency(teamTarget)}`} changeType={commitPercentage >= 90 ? "positive" : "negative"} />
        <KPICard label="Stalled Deals" value={`${stalledDeals.length}`} change={formatCurrency(stalledDeals.reduce((s, d) => s + d.mrr, 0))} changeType={stalledDeals.length > 0 ? "negative" : "neutral"} />
      </div>

      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Rep Forecast Breakdown</h3>
        <div className="space-y-3">
          {reps.map(rep => {
            const repDeals = deals.filter(d => d.repId === rep.id && d.stage !== 'Closed Won' && d.stage !== 'Stalled');
            const repWeighted = repDeals.reduce((s, d) => {
              const w = STAGE_WEIGHTS.find(sw => sw.stage === d.stage)?.weight || 0;
              return s + d.mrr * w;
            }, 0);
            const quotaPct = rep.quotaTarget > 0 ? Math.round((rep.currentCommit / rep.quotaTarget) * 100) : 0;
            const expanded = expandedForecastRep === rep.id;
            return (
              <div key={rep.id}>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                     onClick={() => setExpandedForecastRep(expanded ? null : rep.id)}>
                  <div className="flex items-center gap-2">
                    {expanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                    <span className="text-13px font-medium text-gray-800">{rep.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-12px">
                    <span className="text-gray-500">Commit: {formatCurrency(rep.currentCommit)}</span>
                    <span className="text-gray-500">Weighted: {formatCurrency(repWeighted)}</span>
                    <span className={`font-semibold ${quotaPct >= 90 ? 'text-green-600' : quotaPct >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                      {quotaPct}%
                    </span>
                  </div>
                </div>
                {expanded && repDeals.length > 0 && (
                  <div className="ml-5 mt-2 space-y-1">
                    {repDeals.map(d => {
                      const adv = advisors.find(a => a.id === d.advisorId);
                      return (
                        <div key={d.id} className="flex items-center justify-between py-1.5 px-3 text-11px">
                          <span className="text-gray-700">{d.name} ({adv?.name || '?'})</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">{d.stage}</span>
                            <DealHealthBadge health={d.health} />
                            <span className="font-medium">{formatCurrency(d.mrr)}</span>
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
  );

  const renderTeam = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Team Size" value={`${reps.length}`} change="Active reps" changeType="neutral" />
        <KPICard label="Avg Win Rate" value={`${avgWinRate}%`} change="Team average" changeType="positive" />
        <KPICard label="Avg Cycle" value={`${avgCycle}d`} change="Days to close" changeType="neutral" />
        <KPICard label="Total Partners" value={`${reps.reduce((s, r) => s + r.partnerCount, 0)}`} change={`/ ${reps.reduce((s, r) => s + r.partnerCapacity, 0)} capacity`} changeType="neutral" />
      </div>

      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Rep Capacity & Performance</h3>
        <table className="w-full text-12px">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 font-medium text-gray-500">Rep</th>
              <th className="text-left py-2 font-medium text-gray-500">MRR</th>
              <th className="text-left py-2 font-medium text-gray-500">Win Rate</th>
              <th className="text-left py-2 font-medium text-gray-500">Cycle</th>
              <th className="text-left py-2 font-medium text-gray-500">Capacity</th>
              <th className="text-left py-2 font-medium text-gray-500">Engagement</th>
              <th className="text-left py-2 font-medium text-gray-500">Concern</th>
            </tr>
          </thead>
          <tbody>
            {reps.map(rep => {
              const utilization = Math.round((rep.partnerCount / rep.partnerCapacity) * 100);
              const overCapacity = utilization > 100;
              return (
                <tr key={rep.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2">
                    <p className="font-medium text-gray-800">{rep.name}</p>
                    <p className="text-10px text-gray-400">{rep.title}</p>
                  </td>
                  <td className="py-2 font-semibold text-gray-800">{formatCurrency(rep.managedMRR)}</td>
                  <td className="py-2">
                    <span className={`font-semibold ${rep.winRate >= 75 ? 'text-green-600' : rep.winRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {rep.winRate}%
                    </span>
                  </td>
                  <td className="py-2">{rep.avgCycle}d</td>
                  <td className="py-2">
                    <span className={overCapacity ? 'text-red-600 font-semibold' : ''}>
                      {rep.partnerCount}/{rep.partnerCapacity}
                    </span>
                    <span className="text-gray-400 ml-1">({utilization}%)</span>
                  </td>
                  <td className="py-2"><EngLabel score={rep.engagementScore} /></td>
                  <td className="py-2 text-gray-500 max-w-[200px] truncate">{rep.topConcern || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rising Stars */}
      {reps.filter(r => r.winRate >= 75 && r.engagementScore === 'Strong').length > 0 && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Rising Stars</h3>
          <div className="grid grid-cols-2 gap-3">
            {reps.filter(r => r.winRate >= 75 && r.engagementScore === 'Strong').map(rep => (
              <div key={rep.id} className="p-3 bg-green-50 rounded-lg">
                <p className="text-13px font-medium text-gray-800">{rep.name}</p>
                <p className="text-11px text-gray-500">{rep.winRate}% win rate · {rep.dealsWonQTD} won QTD · {formatCurrency(rep.managedMRR)} MRR</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRelationships = () => {
    const filteredAdvisors = relationshipFilter === 'All' ? advisors
      : advisors.filter(a => a.tier === (relationshipFilter === 'Platinum' ? 'platinum' : relationshipFilter === 'Gold' ? 'gold' : 'silver'));

    if (relationshipsView === 'detail' && selectedAdvisor) {
      return (
        <div className="space-y-4">
          <button onClick={() => { setRelationshipsView('list'); setSelectedAdvisor(null); }}
                  className="flex items-center gap-1 text-12px text-[#157A6E] hover:underline">
            <ArrowLeft className="w-3 h-3" /> Back to list
          </button>
          <AdvisorPanel advisor={selectedAdvisor} deals={deals.filter(d => d.advisorId === selectedAdvisor.id)} isOpen={true} onClose={() => { setRelationshipsView('list'); setSelectedAdvisor(null); }} />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {['All', 'Platinum', 'Gold', 'Silver'].map(f => (
            <button key={f} onClick={() => setRelationshipFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-12px font-medium transition-colors ${relationshipFilter === f ? 'bg-[#157A6E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f}
            </button>
          ))}
        </div>
        <AdvisorTable
          advisors={filteredAdvisors}
          onAdvisorClick={(id) => { const a = advisors.find(x => x.id === id); if (a) { setSelectedAdvisor(a); setRelationshipsView('detail'); } }}
        />
      </div>
    );
  };

  const renderPipeline = () => {
    const stages: DealStage[] = ['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <KPICard label="Total Pipeline" value={formatCurrency(teamPipeline)} change={`${allDeals.length} deals`} changeType="positive" />
          <KPICard label="Weighted" value={formatCurrency(weightedPipeline)} change="Stage-weighted" changeType="neutral" />
          <KPICard label="Active Deals" value={`${activeDealCount}`} change={`${atRiskDeals.length} at risk`} changeType="neutral" />
        </div>

        {/* Pipeline by Rep */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Pipeline by Rep</h3>
          <div className="space-y-3">
            {reps.map(rep => {
              const repDeals = deals.filter(d => d.repId === rep.id);
              const repPipeline = repDeals.reduce((s, d) => s + d.mrr, 0);
              const maxRepPipeline = Math.max(...reps.map(r => deals.filter(d => d.repId === r.id).reduce((s, d) => s + d.mrr, 0)), 1);
              const expanded = expandedPipelineRep === rep.id;
              return (
                <div key={rep.id}>
                  <div className="cursor-pointer" onClick={() => setExpandedPipelineRep(expanded ? null : rep.id)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-12px font-medium text-gray-700">{rep.name}</span>
                      <span className="text-11px text-gray-500">{repDeals.length} deals · {formatCurrency(repPipeline)}</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#157A6E] rounded-full" style={{ width: `${(repPipeline / maxRepPipeline) * 100}%` }} />
                    </div>
                  </div>
                  {expanded && (
                    <div className="ml-2 mt-2 space-y-1">
                      {repDeals.map(d => {
                        const adv = advisors.find(a => a.id === d.advisorId);
                        return (
                          <div key={d.id} className="flex items-center justify-between py-1 text-11px">
                            <span className="text-gray-700">{d.name} ({adv?.name || '?'})</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{d.stage}</span>
                              <DealHealthBadge health={d.health} />
                              <span className="font-medium">{formatCurrency(d.mrr)}</span>
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
    );
  };

  const renderIntelligence = () => {
    const atRiskAdvisors = advisors.filter(a => a.trajectory === 'Freefall' || a.trajectory === 'Slipping');
    const frictionAdvisors = advisors.filter(a => a.friction === 'High' || a.friction === 'Critical');

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">At-Risk Partners</h3>
            {atRiskAdvisors.length === 0 ? (
              <p className="text-12px text-gray-400 italic">No at-risk partners</p>
            ) : (
              <div className="space-y-2">
                {atRiskAdvisors.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100"
                       onClick={() => handleAdvisorClick(a.id)}>
                    <div>
                      <p className="text-13px font-medium text-gray-800">{a.name}</p>
                      <p className="text-11px text-gray-500">{a.company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrajectoryBadge trajectory={a.trajectory} />
                      <span className="text-13px font-semibold">{formatCurrency(a.mrr)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">High Friction</h3>
            {frictionAdvisors.length === 0 ? (
              <p className="text-12px text-gray-400 italic">No high-friction partners</p>
            ) : (
              <div className="space-y-2">
                {frictionAdvisors.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100"
                       onClick={() => handleAdvisorClick(a.id)}>
                    <div>
                      <p className="text-13px font-medium text-gray-800">{a.name}</p>
                      <p className="text-11px text-gray-500">{a.diagnosis || a.company}</p>
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
      </div>
    );
  };

  const renderSupplierAccountability = () => {
    // Aggregate friction data across all reps' advisors
    const frictionByLevel = [
      { level: 'Critical', advisors: advisors.filter(a => a.friction === 'Critical'), color: 'bg-red-600', textColor: 'text-red-700', bgColor: 'bg-red-50' },
      { level: 'High', advisors: advisors.filter(a => a.friction === 'High'), color: 'bg-red-400', textColor: 'text-red-600', bgColor: 'bg-red-50' },
      { level: 'Moderate', advisors: advisors.filter(a => a.friction === 'Moderate'), color: 'bg-amber-400', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
      { level: 'Low', advisors: advisors.filter(a => a.friction === 'Low'), color: 'bg-emerald-400', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    ];
    const totalFrictionPartners = advisors.filter(a => a.friction === 'High' || a.friction === 'Critical').length;
    const frictionMRR = advisors.filter(a => a.friction === 'High' || a.friction === 'Critical').reduce((s, a) => s + a.mrr, 0);
    const avgFrictionScore = advisors.length > 0 ? Math.round(advisors.reduce((s, a) => {
      const scores: Record<string, number> = { Low: 100, Moderate: 65, High: 30, Critical: 10 };
      return s + (scores[a.friction] || 50);
    }, 0) / advisors.length) : 0;

    // Aggregate rep-level friction
    const repFriction = reps.map(rep => {
      const repAdvisors = advisors.filter(a => {
        const repDeals = deals.filter(d => d.repId === rep.id);
        return repDeals.some(d => d.advisorId === a.id);
      });
      const highFriction = repAdvisors.filter(a => a.friction === 'High' || a.friction === 'Critical');
      return {
        rep,
        totalPartners: repAdvisors.length,
        highFrictionCount: highFriction.length,
        frictionMRR: highFriction.reduce((s, a) => s + a.mrr, 0),
        topIssues: highFriction.slice(0, 3),
      };
    }).filter(r => r.totalPartners > 0).sort((a, b) => b.highFrictionCount - a.highFrictionCount);

    return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Org Friction Score" value={`${avgFrictionScore}/100`} change={avgFrictionScore >= 70 ? 'Healthy' : avgFrictionScore >= 50 ? 'Needs attention' : 'Critical'} changeType={avgFrictionScore >= 70 ? "positive" : avgFrictionScore >= 50 ? "neutral" : "negative"} />
        <KPICard label="High Friction Partners" value={`${totalFrictionPartners}`} change={`${formatCurrency(frictionMRR)} MRR at risk`} changeType={totalFrictionPartners > 0 ? "negative" : "positive"} />
        <KPICard label="Avg Win Rate" value={`${avgWinRate}%`} change="across team" changeType="neutral" />
        <KPICard label="Active Suppliers" value={`${new Set(deals.map(d => d.name.split(' ')[0])).size}`} change="in pipeline" changeType="positive" />
      </div>

      {/* Friction Distribution */}
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Friction Distribution Across Partners</h3>
        <div className="flex h-8 rounded-lg overflow-hidden mb-3">
          {frictionByLevel.filter(f => f.advisors.length > 0).map(f => (
            <div key={f.level} className={`${f.color} flex items-center justify-center transition-all`}
                 style={{ width: `${(f.advisors.length / advisors.length) * 100}%` }}>
              <span className="text-[10px] font-bold text-white">{f.advisors.length}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {frictionByLevel.filter(f => f.advisors.length > 0).map(f => (
            <div key={f.level} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${f.color}`} />
              <span className="text-11px text-gray-600">{f.level}: {f.advisors.length} ({formatCurrency(f.advisors.reduce((s, a) => s + a.mrr, 0))})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Standard Ratings */}
      {ratings && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Supplier Ratings</h3>
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
          <SupplierAccountabilityCard data={ratings} loading={false} />
        </div>
      )}

      {/* Advisor Sentiment Feed */}
      {ratings?.supplier?.recentFeedback && ratings.supplier.recentFeedback.length > 0 && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <AdvisorSentimentFeed data={ratings} />
        </div>
      )}

      {/* Friction by Rep */}
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Friction by Rep</h3>
        {repFriction.length === 0 ? (
          <p className="text-12px text-gray-400 italic">No rep-level friction data available</p>
        ) : (
          <div className="space-y-3">
            {repFriction.map(rf => (
              <div key={rf.rep.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-13px font-semibold text-gray-800">{rf.rep.name}</p>
                    <EngLabel score={rf.rep.engagementScore} />
                  </div>
                  <div className="flex items-center gap-3">
                    {rf.highFrictionCount > 0 && (
                      <span className="text-11px font-medium text-red-600">{rf.highFrictionCount} high friction</span>
                    )}
                    <span className="text-12px font-semibold text-gray-700">{rf.totalPartners} partners</span>
                  </div>
                </div>
                {rf.topIssues.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {rf.topIssues.map(a => (
                      <div key={a.id} className="flex items-center justify-between text-11px py-1 px-2 bg-white rounded">
                        <div className="flex items-center gap-2">
                          <FrictionBadge level={a.friction} />
                          <span className="text-gray-800 font-medium">{a.name}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">{a.company}</span>
                        </div>
                        <span className="font-semibold text-gray-700">{formatCurrency(a.mrr)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Critical Friction Cases */}
      {advisors.filter(a => a.friction === 'Critical').length > 0 && (
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">
            Critical Friction Cases
            <span className="ml-2 text-12px font-normal text-red-500">
              ({advisors.filter(a => a.friction === 'Critical').length} requiring immediate attention)
            </span>
          </h3>
          <div className="space-y-3">
            {advisors.filter(a => a.friction === 'Critical').sort((a, b) => b.mrr - a.mrr).map(a => (
              <div key={a.id} className="p-4 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                   onClick={() => { setSelectedAdvisor(a); setPanelOpen(true); }}>
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
        </div>
      )}
    </div>
    );
  };

  const viewRenderers: Record<string, () => React.ReactNode> = {
    'command-center': renderCommandCenter,
    'forecast': renderForecast,
    'team': renderTeam,
    'relationships': renderRelationships,
    'pipeline': renderPipeline,
    'intelligence': renderIntelligence,
    'supplier-accountability': renderSupplierAccountability,
  };

  return (
    <div className="flex h-screen bg-[#F7F5F2] font-['Inter']">
      <Sidebar items={NAV_ITEMS_LEADER} activeView={activeView} onViewChange={setActiveView} role="leader" userName={userName} userInitials={userInitials} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar nudges={[]} userName={userName} userInitials={userInitials} role="leader" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <a href="/live" className="text-12px text-[#157A6E] hover:underline flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Admin
                </a>
                <h1 className="text-xl font-semibold font-['Newsreader'] text-gray-800">
                  {NAV_ITEMS_LEADER.find(n => n.id === activeView)?.label || 'Dashboard'}
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
      <AIChat role="leader" selectedAdvisor={selectedAdvisor} live={true} />
    </div>
  );
}
