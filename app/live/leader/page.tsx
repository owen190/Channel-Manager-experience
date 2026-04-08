'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, ChevronDown, ChevronRight, ArrowLeft,
  MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays,
  Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, X, RefreshCw, Users,
  TrendingDown, TrendingUp, BarChart3, Star, Shield, CheckCircle, ArrowUpRight, ArrowDownLeft,
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
import { EngagementScore, DealStage, Advisor, Deal, Rep, FrictionLevel } from '@/lib/types';
import { adaptAdvisor, adaptDeal, adaptRep } from '@/lib/db/adapter';

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
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [myOnlyPartners, setMyOnlyPartners] = useState(false);
  const [expandedForecastRep, setExpandedForecastRep] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<DealStage | null>(null);
  const [expandedPipelineRep, setExpandedPipelineRep] = useState<string | null>(null);
  const [overrideActions, setOverrideActions] = useState<Record<string, 'approved' | 'denied'>>({});
  const [dealActions, setDealActions] = useState<Record<string, 'flagged' | 'joined'>>({});

  const setActiveView = (view: string) => {
    setActiveViewRaw(view);
    if (view !== 'relationships') {
      setSelectedAdvisor(null);
      setPanelOpen(false);
    }
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

  const formatCurrency = (num: number): string => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num}`;
  };

  // Compute leaderOwned
  const leaderOwned = useMemo(() => {
    return new Set(advisors
      .filter(a => a.tier === 'anchor' && (a.relationshipStage === 'Strategic' || a.relationshipStage === 'Scaling'))
      .map(a => a.id));
  }, [advisors]);

  // Compute leaderInvolved deals
  const leaderInvolved = useMemo(() => {
    return new Set(deals
      .filter(d => {
        const advisorIds = d.advisorIds?.length ? d.advisorIds : [d.advisorId];
        return advisorIds.some(id => leaderOwned.has(id)) || d.mrr >= 15000;
      })
      .map(d => d.id));
  }, [deals, leaderOwned]);

  // Generate signals
  const signals = useMemo(() => {
    const sigs: Signal[] = [];
    const now = new Date();

    // Critical deals
    deals.forEach(d => {
      if (d.health === 'At Risk' || d.health === 'Critical') {
        const rep = reps.find(r => r.id === d.repId);
        const advisorIds = d.advisorIds?.length ? d.advisorIds : [d.advisorId];
        const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || 'Unknown';
        sigs.push({
          type: 'deal_at_risk',
          text: `${d.name} is ${d.health}. Immediate action needed.`,
          severity: 'critical',
          repName: rep?.name || 'Unknown',
          advisorName,
          mrr: d.mrr,
          time: '2h ago',
        });
      }
    });

    // Override requests
    deals.forEach(d => {
      if (d.overrideRequested && !overrideActions[d.id]) {
        const rep = reps.find(r => r.id === d.repId);
        sigs.push({
          type: 'override_pending',
          text: `${d.name} has a pending forecast override request.`,
          severity: 'medium',
          repName: rep?.name || 'Unknown',
          mrr: d.mrr,
          time: '4h ago',
        });
      }
    });

    // Fading anchor partners
    advisors.forEach(a => {
      if (a.tier === 'anchor' && (a.pulse === 'Fading' || a.pulse === 'Flatline')) {
        const rep = reps.find(r => r.id === a.id);
        sigs.push({
          type: 'partner_fading',
          text: `${a.name} is ${a.pulse}. May need engagement intervention.`,
          severity: 'high',
          repName: 'Account Team',
          advisorName: a.name,
          mrr: a.mrr,
          time: '1d ago',
        });
      }
    });

    // Freefall trajectories
    advisors.forEach(a => {
      if (a.trajectory === 'Freefall') {
        sigs.push({
          type: 'trajectory_freefall',
          text: `${a.name} in freefall. Risk of complete disengagement.`,
          severity: 'critical',
          repName: 'Account Team',
          advisorName: a.name,
          mrr: a.mrr,
          time: '3d ago',
        });
      }
    });

    // Low win rates
    const avgWin = reps.length > 0 ? Math.round(reps.reduce((s, r) => s + r.winRate, 0) / reps.length) : 0;
    reps.forEach(r => {
      if (r.winRate < avgWin - 15) {
        sigs.push({
          type: 'low_win_rate',
          text: `${r.name}'s win rate (${r.winRate}%) is significantly below team average.`,
          severity: 'high',
          repName: r.name,
          time: '5d ago',
        });
      }
    });

    return sigs.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [deals, advisors, reps, overrideActions]);

  // Generate friction insights
  const frictionInsights = useMemo(() => {
    const insights: FrictionInsight[] = [];
    const frictionLevels: FrictionLevel[] = ['Critical', 'High', 'Moderate'];

    frictionLevels.forEach(level => {
      const advisorsWithFriction = advisors.filter(a => a.friction === level);
      if (advisorsWithFriction.length >= 2) {
        insights.push({
          issue: `${level} friction across multiple partners`,
          severity: level as FrictionLevel,
          advisorCount: advisorsWithFriction.length,
          names: advisorsWithFriction.map(a => a.name),
        });
      }
    });

    return insights;
  }, [advisors]);

  // Helper for multi-partner deal lookups
  const getDealAdvisorIds = (deal: Deal): string[] => {
    if (deal.advisorIds && deal.advisorIds.length > 0) return deal.advisorIds;
    return deal.advisorId ? [deal.advisorId] : [];
  };

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
      await fetch('/api/live/advisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedAdvisor, [field]: value }),
      });
    } catch (err) {
      console.error('Failed to update advisor:', err);
    }
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

  // ═══════════════════ RENDER FUNCTIONS ═══════════════════

  const renderCommandCenter = () => {
    const myDeals = allDeals.filter(d => leaderInvolved.has(d.id));

    return (
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-4">
          <KPICard label="Team MRR" value={formatCurrency(teamMRR)} change={`+${mrrChange}% QoQ`} changeType="positive" />
          <KPICard label="Commit / Target" value={`${commitPercentage}%`} change={`Gap: ${formatCurrency(commitGap)}`} changeType={commitPercentage >= 85 ? "positive" : "negative"} />
          <KPICard label="Avg Win Rate" value={`${avgWinRate}%`} change={`${avgCycle}d avg cycle`} changeType="neutral" />
          <KPICard label="At-Risk Deals" value={`${atRiskDeals.length}`} change={`${formatCurrency(atRiskDeals.reduce((s, d) => s + d.mrr, 0))} exposed`} changeType={atRiskDeals.length <= 2 ? "positive" : "negative"} />
          <KPICard label="Days Left in Q" value={`${DAYS_REMAINING}`} change="Q1 closes Mar 31" changeType="neutral" />
        </div>

        {/* My Deals */}
        {myDeals.length > 0 && (
          <div className="bg-white rounded-[10px] border-2 border-[#157A6E] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">My Deals <span className="text-12px font-normal text-gray-500">— deals you're personally involved in</span></h3>
              <span className="text-11px text-[#157A6E] font-semibold">{myDeals.length} active</span>
            </div>
            <div className="space-y-2">
              {myDeals.map(d => {
                const advisorIds = getDealAdvisorIds(d);
                const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || '?';
                const rep = reps.find(r => r.id === d.repId);
                return (
                  <div key={d.id} className="flex items-center justify-between px-4 py-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <DealHealthBadge health={d.health} />
                      <span className="text-13px font-semibold text-gray-800">{d.name}</span>
                      <span className="text-11px text-gray-500">{advisorName} · {rep?.name}</span>
                      {d.committed && <span className="text-9px bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold">COMMITTED</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-11px text-gray-500">{d.stage} · {d.daysInStage}d</span>
                      <span className="text-14px font-bold">{formatCurrency(d.mrr)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Needs Attention */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Needs Your Attention</h3>
            <span className="text-11px text-gray-400">{signals.length} items</span>
          </div>
          <div className="space-y-2">
            {signals.map((sig, i) => {
              const bgColor = sig.severity === 'critical' ? 'bg-red-50 border-red-200' : sig.severity === 'high' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200';
              const dotColor = sig.severity === 'critical' ? 'bg-red-500' : sig.severity === 'high' ? 'bg-amber-500' : 'bg-blue-500';
              const pillColor = sig.severity === 'critical' ? 'bg-red-100 text-red-700' : sig.severity === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
              return (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${bgColor}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                  <div className="flex-1">
                    <p className="text-13px font-semibold text-gray-800 leading-tight">{sig.text}</p>
                    <div className="flex gap-3 mt-2 text-10px">
                      <span className="text-gray-600">{sig.repName}</span>
                      {sig.mrr && <span className="font-bold text-gray-800">{formatCurrency(sig.mrr)}</span>}
                      <span className="text-gray-400">{sig.time}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-9px font-bold whitespace-nowrap ${pillColor}`}>
                    {sig.type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rep Commit vs Target */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Rep Commit vs Target</h3>
          <div className="space-y-4">
            {reps.map(rep => {
              const cp = rep.quotaTarget > 0 ? Math.round((rep.currentCommit / rep.quotaTarget) * 100) : 0;
              const ok = cp >= 85;
              return (
                <div key={rep.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-13px font-semibold text-gray-800">{rep.name}</span>
                      <EngLabel score={rep.engagementScore} />
                    </div>
                    <span className={`text-13px font-bold ${ok ? 'text-green-600' : 'text-red-600'}`}>{cp}%</span>
                  </div>
                  <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(cp, 100)}%` }} />
                    <div className="absolute inset-0 flex items-center justify-between px-2 text-10px font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                      <span>{formatCurrency(rep.currentCommit)}</span>
                      <span className="text-gray-400">{formatCurrency(rep.quotaTarget)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderForecast = () => {
    const weighted = allDeals.reduce((s, d) => s + d.mrr * (STAGE_WEIGHTS.find(sw => sw.stage === d.stage)?.weight || 0), 0);
    const pending = allDeals.filter(d => d.overrideRequested && !overrideActions[d.id]);
    const gapClosers = allDeals.filter(d => !d.committed && d.stage !== 'Stalled' && d.stage !== 'Closed Won').sort((a, b) => (b.mrr * b.probability) - (a.mrr * a.probability));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Weighted Pipeline" value={formatCurrency(weighted)} change="Stage-weighted" changeType="neutral" />
          <KPICard label="Team Commit" value={formatCurrency(teamCommit)} change={`${commitPercentage}% of target`} changeType={commitPercentage >= 85 ? "positive" : "negative"} />
          <KPICard label="Gap to Close" value={formatCurrency(commitGap)} change={`${allDeals.filter(d => d.stage === 'Stalled').length} stalled`} changeType="negative" />
          <KPICard label="Override Requests" value={`${pending.length}`} change="Pending review" changeType="neutral" />
        </div>

        {/* Forecast by Rep */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Forecast by Rep</h3>
          <div className="space-y-4">
            {reps.map(rep => {
              const rd = allDeals.filter(d => d.repId === rep.id);
              const rw = rd.reduce((s, d) => s + d.mrr * (STAGE_WEIGHTS.find(sw => sw.stage === d.stage)?.weight || 0), 0);
              const qp = rep.quotaTarget > 0 ? Math.round((rep.currentCommit / rep.quotaTarget) * 100) : 0;
              return (
                <div key={rep.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-14px font-bold text-gray-800">{rep.name}</span>
                      <EngLabel score={rep.engagementScore} />
                    </div>
                    <div className="flex gap-4 text-12px">
                      <span className="text-gray-500">Commit: <b className="text-gray-800">{formatCurrency(rep.currentCommit)}</b></span>
                      <span className="text-gray-500">Weighted: <b className="text-gray-800">{formatCurrency(rw)}</b></span>
                      <span className={`font-bold ${qp >= 90 ? 'text-green-600' : qp >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{qp}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {rd.map(d => {
                      const advisorIds = getDealAdvisorIds(d);
                      const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || '?';
                      return (
                        <div key={d.id} className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded text-11px">
                          <div className="flex items-center gap-2">
                            <DealHealthBadge health={d.health} />
                            <span className="font-semibold text-gray-800">{d.name}</span>
                            <span className="text-gray-500">({advisorName})</span>
                            {d.committed && <span className="text-9px bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold">COMMITTED</span>}
                            {leaderInvolved.has(d.id) && <span className="text-9px bg-[#157A6E] text-white px-1.5 py-0.5 rounded-full font-bold">YOU'RE ON THIS</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">{d.stage}</span>
                            <span className="text-gray-500">{d.probability}%</span>
                            <span className="font-bold text-gray-800">{formatCurrency(d.mrr)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Override Requests */}
        {pending.length > 0 && (
          <div className="bg-white rounded-[10px] border-2 border-amber-300 p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-1">Pending Override Requests</h3>
            <p className="text-11px text-gray-500 mb-4">CMs have requested forecast adjustments</p>
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
                        {d.overrideNote && <p className="text-11px text-amber-900 italic mt-2">"{d.overrideNote}"</p>}
                        {d.competitor && <p className="text-10px text-red-600 mt-1">Competitor: {d.competitor}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setOverrideActions(p => ({ ...p, [d.id]: 'approved' }))}
                                className="px-3 py-1.5 bg-green-600 text-white text-11px font-bold rounded hover:bg-green-700">
                          Approve
                        </button>
                        <button onClick={() => setOverrideActions(p => ({ ...p, [d.id]: 'denied' }))}
                                className="px-3 py-1.5 bg-gray-200 text-gray-800 text-11px font-bold rounded hover:bg-gray-300">
                          Deny
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gap Closers */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-1">Gap Closers</h3>
          <p className="text-11px text-gray-500 mb-4">Uncommitted deals ranked by expected value</p>
          <div className="space-y-2">
            {gapClosers.slice(0, 5).map(d => {
              const ev = Math.round(d.mrr * d.probability / 100);
              const advisorIds = getDealAdvisorIds(d);
              const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || '?';
              return (
                <div key={d.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="w-12 text-right">
                    <span className="text-14px font-bold text-gray-800">{formatCurrency(ev)}</span>
                    <p className="text-9px text-gray-500">EV</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-13px font-semibold text-gray-800">{d.name}</p>
                    <p className="text-10px text-gray-500">{advisorName} · {d.stage} · {d.probability}%</p>
                  </div>
                  <DealHealthBadge health={d.health} />
                  <span className="text-14px font-bold text-gray-800">{formatCurrency(d.mrr)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTeam = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Team Size" value={`${reps.length}`} change="Active CMs" changeType="neutral" />
          <KPICard label="Avg Win Rate" value={`${avgWinRate}%`} change="Team benchmark" changeType="neutral" />
          <KPICard label="Avg Cycle" value={`${avgCycle}d`} change="Days to close" changeType="neutral" />
          <KPICard label="Attention Needed" value={`${reps.filter(r => r.engagementScore === 'Fading' || r.winRate < 50).length}`} change="Underperforming" changeType={reps.filter(r => r.engagementScore === 'Fading' || r.winRate < 50).length === 0 ? "positive" : "negative"} />
        </div>

        {/* Team Coaching Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {reps.map(rep => {
            const repAdvisors = advisors.filter(a => {
              const repDeals = allDeals.filter(d => d.repId === rep.id);
              return repDeals.some(d => getDealAdvisorIds(d).includes(a.id));
            });
            const util = rep.partnerCapacity > 0 ? Math.round((rep.partnerCount / rep.partnerCapacity) * 100) : 0;
            const staleAnchors = repAdvisors.filter(a => a.tier === 'anchor' && (a.pulse === 'Fading' || a.pulse === 'Flatline'));
            const stalledDeals = allDeals.filter(d => d.repId === rep.id && (d.stage === 'Stalled' || d.daysInStage > 25));
            const flags: string[] = [];
            if (rep.winRate < avgWinRate - 10) flags.push(`Win rate ${rep.winRate}% — ${avgWinRate - rep.winRate}pts below team avg`);
            if (rep.avgCycle > avgCycle + 10) flags.push(`Avg cycle ${rep.avgCycle}d — ${rep.avgCycle - avgCycle}d slower than team`);
            if (staleAnchors.length > 0) flags.push(`${staleAnchors.length} anchor partner${staleAnchors.length > 1 ? 's' : ''} going cold`);
            if (stalledDeals.length > 0) flags.push(`${stalledDeals.length} deal${stalledDeals.length > 1 ? 's' : ''} stalled or aging`);
            const isAttention = rep.engagementScore === 'Fading' || flags.length >= 3;
            const isRising = rep.winRate >= 75 && rep.engagementScore === 'Strong';

            return (
              <div key={rep.id} className={`rounded-[10px] border-2 p-4 ${isAttention ? 'border-red-300 bg-red-50' : isRising ? 'border-green-300 bg-green-50' : 'border-[#e8e5e1] bg-white'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-15px font-bold text-gray-800">{rep.name}</span>
                      <EngLabel score={rep.engagementScore} />
                      {isRising && <span className="text-9px bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">RISING STAR</span>}
                      {isAttention && <span className="text-9px bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">NEEDS ATTENTION</span>}
                    </div>
                    <p className="text-11px text-gray-500">{rep.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-15px font-bold text-gray-800">{formatCurrency(rep.managedMRR)}</p>
                    <p className="text-10px text-gray-500">managed MRR</p>
                  </div>
                </div>

                {/* Benchmark bars */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Win Rate', value: rep.winRate, avg: avgWinRate, unit: '%', inverse: false },
                    { label: 'Cycle', value: rep.avgCycle, avg: avgCycle, unit: 'd', inverse: true },
                    { label: 'Capacity', value: util, avg: 60, unit: '%', inverse: false },
                  ].map(m => {
                    const good = m.inverse ? m.value <= m.avg : m.value >= m.avg;
                    return (
                      <div key={m.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-10px text-gray-500">{m.label}</span>
                          <span className={`text-12px font-bold ${good ? 'text-green-600' : 'text-red-600'}`}>{m.value}{m.unit}</span>
                        </div>
                        <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${good ? 'bg-green-400' : 'bg-red-400'}`} style={{ width: `${Math.min(m.value, 100)}%` }} />
                          <div className="absolute inset-y-0 w-0.5 bg-gray-600" style={{ left: `${Math.min(m.avg, 100)}%` }} title={`Team avg: ${m.avg}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tier mix */}
                <div className="flex gap-2 flex-wrap mb-2">
                  {[['anchor', rep.anchor], ['scaling', rep.scaling], ['building', rep.building]].filter(([, n]) => (n as number) > 0).map(([tier, n]) => (
                    <TierBadge key={tier} tier={tier as any} />
                  ))}
                </div>

                {/* Coaching flags */}
                {flags.length > 0 && (
                  <div className="border-t border-gray-300 pt-2">
                    {flags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-11px text-gray-700">
                        <span className="text-amber-500 flex-shrink-0 mt-0.5">⚠</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRelationships = () => {
    let filtered = advisors;
    if (relationshipFilter !== 'All') {
      filtered = filtered.filter(a => a.tier === relationshipFilter.toLowerCase());
    }
    if (myOnlyPartners) {
      filtered = filtered.filter(a => leaderOwned.has(a.id));
    }

    if (relationshipsView === 'detail' && selectedAdvisor) {
      const rep = reps.find(r => r.id === selectedAdvisor.id);
      const advDeals = allDeals.filter(d => getDealAdvisorIds(d).includes(selectedAdvisor.id));
      return (
        <div className="space-y-4">
          <button onClick={() => { setRelationshipsView('list'); setSelectedAdvisor(null); }}
                  className="flex items-center gap-1 text-12px text-[#157A6E] font-semibold hover:underline">
            <ArrowLeft className="w-3 h-3" /> Back to list
          </button>
          <AdvisorPanel
            advisor={selectedAdvisor}
            deals={advDeals}
            isOpen={true}
            onClose={() => { setRelationshipsView('list'); setSelectedAdvisor(null); }}
            onUpdateAdvisor={updateAdvisorField}
          />
        </div>
      );
    }

    const portfolioStats = {
      shown: filtered.length,
      shownMRR: filtered.reduce((s, a) => s + a.mrr, 0),
      avgMRR: filtered.length > 0 ? Math.round(filtered.reduce((s, a) => s + a.mrr, 0) / filtered.length) : 0,
      atRisk: filtered.filter(a => a.trajectory === 'Slipping' || a.trajectory === 'Freefall').length,
      discrepancies: filtered.filter(a => {
        const deals = allDeals.filter(d => getDealAdvisorIds(d).includes(a.id)).filter(d => d.overrideRequested);
        return deals.length > 0 || (a.friction === 'High' || a.friction === 'Critical');
      }).length,
    };

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          {['All', 'Anchor', 'Scaling', 'Building', 'Launching'].map(f => (
            <button key={f} onClick={() => setRelationshipFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-12px font-semibold transition-colors ${relationshipFilter === f ? 'bg-[#157A6E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f}
            </button>
          ))}
          <div className="w-0.5 h-5 bg-gray-300 mx-2" />
          <button onClick={() => setMyOnlyPartners(!myOnlyPartners)}
                  className={`px-3 py-1.5 rounded-full text-12px font-semibold transition-colors ${myOnlyPartners ? 'bg-[#157A6E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {myOnlyPartners ? 'My Partners ✓' : 'My Partners'}
          </button>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-4 gap-3">
          <KPICard label="Partners Shown" value={`${portfolioStats.shown}`} change={`${formatCurrency(portfolioStats.shownMRR)} MRR`} changeType="neutral" />
          <KPICard label="Avg MRR" value={formatCurrency(portfolioStats.avgMRR)} change="Per partner" changeType="neutral" />
          <KPICard label="At Risk" value={`${portfolioStats.atRisk}`} change="Declining trajectory" changeType={portfolioStats.atRisk === 0 ? "positive" : "negative"} />
          <KPICard label="Discrepancies" value={`${portfolioStats.discrepancies}`} change="CM override vs signals" changeType={portfolioStats.discrepancies === 0 ? "positive" : "negative"} />
        </div>

        {/* Partner Table */}
        <AdvisorTable
          advisors={filtered.sort((a, b) => b.mrr - a.mrr)}
          onAdvisorClick={(id) => {
            const a = advisors.find(x => x.id === id);
            if (a) {
              setSelectedAdvisor(a);
              setRelationshipsView('detail');
            }
          }}
        />
      </div>
    );
  };

  const renderPipeline = () => {
    const stages: DealStage[] = ['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Stalled'];
    const stageData = stages.map(s => ({
      stage: s,
      deals: allDeals.filter(d => d.stage === s),
      mrr: allDeals.filter(d => d.stage === s).reduce((sum, d) => sum + d.mrr, 0),
      count: allDeals.filter(d => d.stage === s).length,
    }));
    const maxMRR = Math.max(...stageData.map(s => s.mrr), 1);
    const myInvolved = allDeals.filter(d => leaderInvolved.has(d.id));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Total Pipeline" value={formatCurrency(teamPipeline)} change={`${allDeals.length} deals`} changeType="neutral" />
          <KPICard label="Weighted" value={formatCurrency(weightedPipeline)} change="Stage-weighted" changeType="neutral" />
          <KPICard label="Active Deals" value={`${activeDealCount}`} change={`${atRiskDeals.length} at risk`} changeType="neutral" />
          <KPICard label="My Involvement" value={`${myInvolved.length}`} change={`${formatCurrency(myInvolved.reduce((s, d) => s + d.mrr, 0))} MRR`} changeType="neutral" />
        </div>

        {/* Pipeline Funnel */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Pipeline Funnel</h3>
          <div className="space-y-3">
            {stageData.map((s, i) => {
              const next = stageData[i + 1];
              const conv = next && s.count > 0 ? Math.round((next.count / s.count) * 100) : null;
              const colors: Record<string, string> = { Discovery: 'bg-blue-400', Qualifying: 'bg-blue-500', Proposal: 'bg-teal-500', Negotiating: 'bg-green-500', Stalled: 'bg-gray-400' };
              return (
                <div key={s.stage}>
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-12px font-medium text-gray-700 flex-shrink-0">{s.stage}</span>
                    <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div className={`h-full rounded-lg flex items-center pl-3 ${colors[s.stage]}`} style={{ width: `${Math.max((s.mrr / maxMRR) * 100, 10)}%` }}>
                        <span className="text-10px font-bold text-white">{formatCurrency(s.mrr)}</span>
                      </div>
                    </div>
                    <span className="w-12 text-11px text-gray-600 text-right">{s.count} deal{s.count !== 1 ? 's' : ''}</span>
                  </div>
                  {conv !== null && s.stage !== 'Stalled' && (
                    <div className="ml-27 text-9px text-gray-500">↓ {conv}% conversion</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deal Management Table */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-1">Deal Management</h3>
          <p className="text-11px text-gray-500 mb-4">Review, flag, and take action on deals across your team</p>
          <div className="overflow-x-auto">
            <table className="w-full text-11px">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Deal</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Partner</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Rep</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Stage</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Health</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Confidence</th>
                  <th className="text-right px-2 py-2 font-semibold text-gray-700">MRR</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allDeals.sort((a, b) => b.mrr - a.mrr).map(d => {
                  const advisorIds = getDealAdvisorIds(d);
                  const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || '?';
                  const rep = reps.find(r => r.id === d.repId);
                  const action = dealActions[d.id];
                  return (
                    <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{d.name}</span>
                          {leaderInvolved.has(d.id) && <span className="text-8px bg-[#157A6E] text-white px-1.5 py-0.5 rounded-full font-bold">MINE</span>}
                          {d.overrideRequested && <span className="text-8px bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">OVERRIDE</span>}
                        </div>
                        {d.competitor && <p className="text-10px text-red-600">vs {d.competitor}</p>}
                      </td>
                      <td className="px-2 py-2 text-gray-700">{advisorName}</td>
                      <td className="px-2 py-2 text-gray-600">{rep?.name}</td>
                      <td className="px-2 py-2">
                        <span className="text-gray-800">{d.stage}</span>
                        <span className="text-gray-500 ml-2">{d.daysInStage}d</span>
                      </td>
                      <td className="px-2 py-2"><DealHealthBadge health={d.health} /></td>
                      <td className="px-2 py-2">{d.confidenceScore && <span className="text-11px bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{d.confidenceScore}</span>}</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-800">{formatCurrency(d.mrr)}</td>
                      <td className="px-3 py-2 text-right">
                        {action ? (
                          <span className={`text-10px font-bold ${action === 'flagged' ? 'text-amber-600' : 'text-green-600'}`}>
                            {action === 'flagged' ? 'Flagged ⚑' : 'Joined ✓'}
                          </span>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setDealActions(p => ({ ...p, [d.id]: 'flagged' }))}
                                    className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-10px font-bold hover:bg-amber-200">
                              ⚑ Flag
                            </button>
                            {!leaderInvolved.has(d.id) && (
                              <button onClick={() => setDealActions(p => ({ ...p, [d.id]: 'joined' }))}
                                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-10px font-bold hover:bg-green-200">
                                + Join
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline by Rep */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Pipeline by Rep</h3>
          <div className="space-y-3">
            {reps.map(rep => {
              const rd = allDeals.filter(d => d.repId === rep.id);
              const rm = rd.reduce((s, d) => s + d.mrr, 0);
              return (
                <div key={rep.id} className="border border-gray-100 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-13px font-semibold text-gray-800">{rep.name}</span>
                    <span className="text-12px font-semibold text-gray-600">{rd.length} deals · {formatCurrency(rm)}</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
                    {stages.map(st => {
                      const cnt = rd.filter(d => d.stage === st).length;
                      if (!cnt) return null;
                      const colors: Record<string, string> = { Discovery: 'bg-blue-400', Qualifying: 'bg-blue-500', Proposal: 'bg-teal-500', Negotiating: 'bg-green-500', Stalled: 'bg-gray-400' };
                      return (
                        <div key={st} className={`${colors[st]} flex items-center justify-center`} style={{ width: `${(cnt / rd.length) * 100}%` }}>
                          <span className="text-8px font-bold text-white">{cnt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderIntelligence = () => {
    const declining = advisors.filter(a => a.trajectory === 'Freefall' || a.trajectory === 'Slipping');
    const rising = advisors.filter(a => a.trajectory === 'Accelerating' || a.trajectory === 'Climbing');

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <KPICard label="Declining" value={`${declining.length}`} change={`${formatCurrency(declining.reduce((s, a) => s + a.mrr, 0))} at risk`} changeType={declining.length <= 1 ? "positive" : "negative"} />
          <KPICard label="Rising" value={`${rising.length}`} change={`${formatCurrency(rising.reduce((s, a) => s + a.mrr, 0))} growing`} changeType="positive" />
          <KPICard label="Systemic Issues" value={`${frictionInsights.length}`} change={`${frictionInsights.reduce((s, f) => s + f.advisorCount, 0)} partners affected`} changeType={frictionInsights.length === 0 ? "positive" : "negative"} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Declining */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-red-600 mb-4">Declining Partners</h3>
            {declining.length === 0 ? (
              <p className="text-12px text-gray-500 italic">None</p>
            ) : (
              <div className="space-y-2">
                {declining.sort((a, b) => b.mrr - a.mrr).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-13px font-semibold text-gray-800">{a.name}</span>
                        <PulseBadge pulse={a.pulse} />
                      </div>
                      <p className="text-10px text-gray-500">{a.company}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-12px font-bold text-red-600">{a.trajectory}</span>
                      <p className="text-13px font-bold text-gray-800">{formatCurrency(a.mrr)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rising */}
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-green-600 mb-4">Rising Partners</h3>
            {rising.length === 0 ? (
              <p className="text-12px text-gray-500 italic">None</p>
            ) : (
              <div className="space-y-2">
                {rising.sort((a, b) => b.mrr - a.mrr).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-13px font-semibold text-gray-800">{a.name}</span>
                        <PulseBadge pulse={a.pulse} />
                      </div>
                      <p className="text-10px text-gray-500">{a.company}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-12px font-bold text-green-600">{a.trajectory}</span>
                      <p className="text-13px font-bold text-gray-800">{formatCurrency(a.mrr)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Systemic Friction Patterns */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-1">Systemic Friction Patterns</h3>
          <p className="text-11px text-gray-500 mb-4">Issues appearing across multiple partners</p>
          {frictionInsights.length === 0 ? (
            <p className="text-12px text-gray-500 italic">No systemic issues detected</p>
          ) : (
            <div className="space-y-2">
              {frictionInsights.map((f, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FrictionBadge level={f.severity} />
                      <span className="text-14px font-bold text-gray-800">{f.issue}</span>
                    </div>
                    <span className="text-11px text-gray-500">{f.advisorCount} partners</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {f.names.map(n => (
                      <span key={n} className="text-10px px-2 py-1 bg-gray-100 rounded text-gray-700">{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSupplierAccountability = () => {
    const frictionLevels = [
      { level: 'Critical', advisors: advisors.filter(a => a.friction === 'Critical'), color: 'bg-red-600', mrr: advisors.filter(a => a.friction === 'Critical').reduce((s, a) => s + a.mrr, 0) },
      { level: 'High', advisors: advisors.filter(a => a.friction === 'High'), color: 'bg-red-500', mrr: advisors.filter(a => a.friction === 'High').reduce((s, a) => s + a.mrr, 0) },
      { level: 'Moderate', advisors: advisors.filter(a => a.friction === 'Moderate'), color: 'bg-amber-400', mrr: advisors.filter(a => a.friction === 'Moderate').reduce((s, a) => s + a.mrr, 0) },
      { level: 'Low', advisors: advisors.filter(a => a.friction === 'Low'), color: 'bg-green-500', mrr: advisors.filter(a => a.friction === 'Low').reduce((s, a) => s + a.mrr, 0) },
    ];
    const avgScore = advisors.length > 0 ? Math.round(advisors.reduce((s, a) => {
      const scores: Record<string, number> = { Low: 100, Moderate: 65, High: 30, Critical: 10 };
      return s + (scores[a.friction] || 50);
    }, 0) / advisors.length) : 0;
    const highFriction = advisors.filter(a => a.friction === 'High' || a.friction === 'Critical');

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Org Friction Score" value={`${avgScore}/100`} change={avgScore >= 70 ? 'Healthy' : avgScore >= 50 ? 'Needs attention' : 'Critical'} changeType={avgScore >= 70 ? "positive" : avgScore >= 50 ? "neutral" : "negative"} />
          <KPICard label="High Friction" value={`${highFriction.length}`} change={`${formatCurrency(highFriction.reduce((s, a) => s + a.mrr, 0))} MRR at risk`} changeType={highFriction.length === 0 ? "positive" : "negative"} />
          <KPICard label="Avg Win Rate" value={`${avgWinRate}%`} change="across team" changeType="neutral" />
          <KPICard label="Active Suppliers" value={`${new Set(allDeals.map(d => d.name.split(' ')[0])).size}`} change="in pipeline" changeType="neutral" />
        </div>

        {/* Friction Distribution */}
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
                <span className="text-11px text-gray-600">{f.level}: {f.advisors.length} ({formatCurrency(f.mrr)})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Standard Ratings */}
        {ratings && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">The Channel Standard Ratings</h3>
                <p className="text-11px text-gray-500 mt-1">Live supplier accountability data</p>
              </div>
              <a href="https://www.the-channel-standard.com" target="_blank" rel="noopener noreferrer" className="text-[#157A6E] text-11px font-semibold hover:underline">
                View Full Ratings →
              </a>
            </div>
            <SupplierAccountabilityCard data={ratings} loading={false} />
          </div>
        )}

        {/* Friction by Rep */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Friction by Rep</h3>
          <div className="space-y-3">
            {reps.map(rep => {
              const repAdvisors = advisors.filter(a => {
                const repDeals = allDeals.filter(d => d.repId === rep.id);
                return repDeals.some(d => getDealAdvisorIds(d).includes(a.id));
              });
              const rhf = repAdvisors.filter(a => a.friction === 'High' || a.friction === 'Critical');
              return (
                <div key={rep.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-13px font-bold text-gray-800">{rep.name}</span>
                      <EngLabel score={rep.engagementScore} />
                    </div>
                    <div className="flex items-center gap-2">
                      {rhf.length > 0 && <span className="text-11px font-semibold text-red-600">{rhf.length} high friction</span>}
                      <span className="text-12px font-semibold text-gray-700">{repAdvisors.length} partners</span>
                    </div>
                  </div>
                  {rhf.length > 0 && (
                    <div className="space-y-1">
                      {rhf.map(a => (
                        <div key={a.id} className="flex items-center justify-between px-2 py-1.5 bg-white rounded text-11px">
                          <div className="flex items-center gap-2">
                            <FrictionBadge level={a.friction} />
                            <span className="font-semibold text-gray-800">{a.name}</span>
                            <span className="text-gray-500">{a.company}</span>
                          </div>
                          <span className="font-bold text-gray-800">{formatCurrency(a.mrr)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Friction Cases */}
        {advisors.filter(a => a.friction === 'Critical').length > 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">
              Critical Friction Cases
              <span className="text-12px font-normal text-red-600 ml-2">({advisors.filter(a => a.friction === 'Critical').length} requiring attention)</span>
            </h3>
            <div className="space-y-2">
              {advisors.filter(a => a.friction === 'Critical').sort((a, b) => b.mrr - a.mrr).map(a => (
                <div key={a.id} className="p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100" onClick={() => handleAdvisorClick(a.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-13px font-semibold text-gray-800">{a.name}</span>
                        <FrictionBadge level={a.friction} />
                        <PulseBadge pulse={a.pulse} />
                        <TrajectoryBadge trajectory={a.trajectory} />
                      </div>
                      <p className="text-12px text-gray-600 mb-1">{a.company} · {a.location || 'Unknown'}</p>
                      <p className="text-11px text-gray-700 leading-tight">{a.diagnosis}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-14px font-bold text-red-600">{formatCurrency(a.mrr)}</p>
                      <p className="text-10px text-gray-500">MRR</p>
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

  // ═══════════════════ MAIN RENDER ═══════════════════

  const contentByView: Record<string, React.ReactNode> = {
    'command-center': renderCommandCenter(),
    'forecast': renderForecast(),
    'team': renderTeam(),
    'relationships': renderRelationships(),
    'pipeline': renderPipeline(),
    'intelligence': renderIntelligence(),
    'supplier-accountability': renderSupplierAccountability(),
  };

  return (
    <div className="flex h-screen bg-[#F7F5F2]">
      <Sidebar
        items={NAV_ITEMS_LEADER}
        activeView={activeView}
        onViewChange={setActiveView}
        role="leader"
        userName={userName}
        userInitials={userInitials}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar nudges={[]} userName={userName} userInitials={userInitials} role="leader" />
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
      <AIChat role="leader" selectedAdvisor={selectedAdvisor} live={true} />
    </div>
  );
}
