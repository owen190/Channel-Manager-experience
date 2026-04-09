'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, ChevronDown, ChevronRight, ArrowLeft,
  MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays,
  Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, X, RefreshCw, Users,
  TrendingDown, TrendingUp, BarChart3, Star, Shield, CheckCircle, ArrowUpRight, ArrowDownLeft,
  Settings, DollarSign, Brain, Zap, Download, Plus, Edit, MoreHorizontal,
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

// Seeded random for mock data
function seededRandom(seed: string, min: number = 0, max: number = 1): number {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (Math.sin(hash) * 10000 - Math.floor(Math.sin(hash) * 10000)) * (max - min) + min;
}

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
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Forecast state
  const [expandedForecastRep, setExpandedForecastRep] = useState<string | null>(null);

  // Team state
  const [teamExpandedCM, setTeamExpandedCM] = useState<string | null>(null);

  // Relationships state
  const [relationshipsView, setRelationshipsView] = useState<'list' | 'detail'>('list');
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [myOnlyPartners, setMyOnlyPartners] = useState(false);
  const [showFullUSA, setShowFullUSA] = useState(true);
  const [territoryRegion, setTerritoryRegion] = useState<string | null>(null);
  const [territoryExceptions, setTerritoryExceptions] = useState<string[]>([]);
  const [territoryRemoved, setTerritoryRemoved] = useState<string[]>([]);
  const [relationshipViewMode, setRelationshipViewMode] = useState<'my' | 'all'>('all');

  // Pipeline state
  const [pipelineTimeframe, setPipelineTimeframe] = useState<'all' | '30d' | '45d' | 'quarter' | 'ytd'>('all');
  const [pipelineFilter, setPipelineFilter] = useState<{ cm: string; stage: string; health: string }>({ cm: '', stage: '', health: '' });
  const [expandedStage, setExpandedStage] = useState<DealStageType | null>(null);

  // Supplier accountability state
  const [frictionCategories, setFrictionCategories] = useState<Record<string, number>>({
    Onboarding: 12, Billing: 8, Support: 15, Product: 6, Communication: 9,
  });

  // Team management state
  const [cadenceRules, setCadenceRules] = useState<Record<string, number>>({
    anchor: 7, scaling: 10, building: 14, launching: 21,
  });
  const [alertThresholds, setAlertThresholds] = useState({
    dealPushThreshold: 50000, dealPushCount: 2, cadenceComplianceThreshold: 80,
  });
  const [notifSettings, setNotifSettings] = useState({
    escalationAlerts: true, weeklyDigest: true, realtimeCritical: true,
  });

  // Deal actions
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
    setTeamExpandedCM(null);
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
      // Load territory settings
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
    advisors.forEach(a => {
      if (a.tier === 'anchor' && (a.pulse === 'Fading' || a.pulse === 'Flatline')) {
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
        <div className="grid grid-cols-5 gap-4">
          <KPICard label="Team MRR" value={formatCurrency(teamMRR)} change={`+${mrrChange}% QoQ`} changeType="positive" />
          <KPICard label="Commit / Target" value={`${commitPercentage}%`} change={`Gap: ${formatCurrency(commitGap)}`} changeType={commitPercentage >= 85 ? "positive" : "negative"} />
          <KPICard label="Avg Win Rate" value={`${avgWinRate}%`} change={`${avgCycle}d avg cycle`} changeType="neutral" />
          <KPICard label="At-Risk Deals" value={`${atRiskDeals.length}`} change={`${formatCurrency(atRiskDeals.reduce((s, d) => s + d.mrr, 0))} exposed`} changeType={atRiskDeals.length <= 2 ? "positive" : "negative"} />
          <KPICard label="Days Left in Q" value={`${DAYS_REMAINING}`} change="Q1 closes Mar 31" changeType="neutral" />
        </div>

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
                  <div key={d.id} className="flex items-center justify-between px-4 py-3 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100" onClick={() => setSelectedDeal(d)}>
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

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Forecast by Rep</h3>
          <div className="space-y-4">
            {reps.map(rep => {
              const rd = allDeals.filter(d => d.repId === rep.id);
              const rw = rd.reduce((s, d) => s + d.mrr * (STAGE_WEIGHTS.find(sw => sw.stage === d.stage)?.weight || 0), 0);
              const qp = rep.quotaTarget > 0 ? Math.round((rep.currentCommit / rep.quotaTarget) * 100) : 0;
              const expanded = expandedForecastRep === rep.id;
              return (
                <div key={rep.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setExpandedForecastRep(expanded ? null : rep.id)}>
                    <div className="flex items-center gap-2">
                      <span className="text-14px font-bold text-gray-800">{rep.name}</span>
                      <EngLabel score={rep.engagementScore} />
                    </div>
                    <div className="flex gap-4 text-12px items-center">
                      <span className="text-gray-500">Commit: <b className="text-gray-800">{formatCurrency(rep.currentCommit)}</b></span>
                      <span className="text-gray-500">Weighted: <b className="text-gray-800">{formatCurrency(rw)}</b></span>
                      <span className={`font-bold ${qp >= 90 ? 'text-green-600' : qp >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{qp}%</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  {expanded && (
                    <div className="space-y-1 border-t border-gray-200 pt-3">
                      {rd.map(d => {
                        const advisorIds = getDealAdvisorIds(d);
                        const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || '?';
                        return (
                          <div key={d.id} className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded text-11px cursor-pointer hover:bg-gray-100" onClick={() => setSelectedDeal(d)}>
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
                  )}
                </div>
              );
            })}
          </div>
        </div>

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

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-1">Gap Closers</h3>
          <p className="text-11px text-gray-500 mb-4">Uncommitted deals ranked by expected value</p>
          <div className="space-y-2">
            {gapClosers.slice(0, 10).map(d => {
              const ev = Math.round(d.mrr * d.probability / 100);
              const advisorIds = getDealAdvisorIds(d);
              const advisorName = advisors.find(a => a.id === advisorIds[0])?.name || '?';
              return (
                <div key={d.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => setSelectedDeal(d)}>
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
            const expanded = teamExpandedCM === rep.id;

            return (
              <div key={rep.id} className={`rounded-[10px] border-2 p-4 ${isAttention ? 'border-red-300 bg-red-50' : isRising ? 'border-green-300 bg-green-50' : 'border-[#e8e5e1] bg-white'}`}>
                <div className="flex items-start justify-between mb-3 cursor-pointer" onClick={() => setTeamExpandedCM(expanded ? null : rep.id)}>
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

                <div className="flex gap-2 flex-wrap mb-2">
                  {[['anchor', rep.anchor], ['scaling', rep.scaling], ['building', rep.building]].filter(([, n]) => (n as number) > 0).map(([tier, n]) => (
                    <TierBadge key={tier} tier={tier as any} />
                  ))}
                </div>

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

                {expanded && (
                  <div className="border-t border-gray-300 mt-3 pt-3 space-y-2 text-11px">
                    <div className="p-2 bg-opacity-50 bg-blue-100 rounded">
                      <p className="font-semibold text-gray-800">Activity Breakdown</p>
                      <p className="text-gray-600">Meetings: {Math.floor(seededRandom(rep.id + 'meetings', 5, 25))}, Calls: {Math.floor(seededRandom(rep.id + 'calls', 10, 35))}, Emails: {Math.floor(seededRandom(rep.id + 'emails', 40, 80))}</p>
                    </div>
                    <div className="p-2 bg-opacity-50 bg-amber-100 rounded">
                      <p className="font-semibold text-gray-800">Coaching Flags</p>
                      <p className="text-gray-600">QBR count: {Math.floor(seededRandom(rep.id + 'qbr', 2, 8))}, Cadence compliance: {Math.floor(seededRandom(rep.id + 'cadence', 60, 95))}%</p>
                    </div>
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
    };

    const stageDistribution = {
      Prospect: filtered.filter(a => a.relationshipStage === 'Prospect').length,
      Onboarding: filtered.filter(a => a.relationshipStage === 'Onboarding').length,
      Activated: filtered.filter(a => a.relationshipStage === 'Activated').length,
      Scaling: filtered.filter(a => a.relationshipStage === 'Scaling').length,
      Strategic: filtered.filter(a => a.relationshipStage === 'Strategic').length,
    };

    return (
      <div className="space-y-4">
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

        <div className="grid grid-cols-4 gap-3">
          <KPICard label="Partners Shown" value={`${portfolioStats.shown}`} change={`${formatCurrency(portfolioStats.shownMRR)} MRR`} changeType="neutral" />
          <KPICard label="Avg MRR" value={formatCurrency(portfolioStats.avgMRR)} change="Per partner" changeType="neutral" />
          <KPICard label="At Risk" value={`${portfolioStats.atRisk}`} change="Declining trajectory" changeType={portfolioStats.atRisk === 0 ? "positive" : "negative"} />
          <KPICard label="Stage Distribution" value={`${portfolioStats.shown}`} change={`${stageDistribution.Strategic + stageDistribution.Scaling} strategic/scaling`} changeType="neutral" />
        </div>

        {showFullUSA && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Territory Map</h3>
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

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Stage Distribution</h3>
          <div className="flex h-6 rounded-lg overflow-hidden">
            {Object.entries(stageDistribution).map(([stage, count]) => {
              if (count === 0) return null;
              const colors: Record<string, string> = {
                Prospect: 'bg-blue-400', Onboarding: 'bg-blue-500', Activated: 'bg-teal-500',
                Scaling: 'bg-green-500', Strategic: 'bg-green-600',
              };
              return (
                <div key={stage} className={`${colors[stage]}`} style={{ width: `${(count / portfolioStats.shown) * 100}%` }} title={`${stage}: ${count}`} />
              );
            })}
          </div>
          <div className="flex gap-4 flex-wrap mt-3">
            {Object.entries(stageDistribution).filter(([, count]) => count > 0).map(([stage, count]) => (
              <div key={stage} className="text-11px text-gray-600">
                <span className="font-semibold">{stage}:</span> {count}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPipeline = () => {
    const stages: DealStageType[] = ['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Stalled'];
    let filtered = allDeals;
    if (pipelineFilter.cm) {
      filtered = filtered.filter(d => d.repId === pipelineFilter.cm);
    }
    if (pipelineFilter.stage) {
      filtered = filtered.filter(d => d.stage === pipelineFilter.stage);
    }
    if (pipelineFilter.health) {
      filtered = filtered.filter(d => d.health === pipelineFilter.health);
    }

    const stageData = stages.map(s => ({
      stage: s,
      deals: filtered.filter(d => d.stage === s),
      mrr: filtered.filter(d => d.stage === s).reduce((sum, d) => sum + d.mrr, 0),
      count: filtered.filter(d => d.stage === s).length,
    }));
    const maxMRR = Math.max(...stageData.map(s => s.mrr), 1);

    const lostReasonCounts = filtered
      .filter(d => d.stage === 'Closed Lost' && d.lostReason)
      .reduce((acc, d) => {
        acc[d.lostReason || 'unknown'] = (acc[d.lostReason || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const pushyDeals = filtered
      .filter(d => d.pushHistory && d.pushHistory.length > 0)
      .sort((a, b) => (b.pushHistory?.length || 0) - (a.pushHistory?.length || 0));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Total Pipeline" value={formatCurrency(filtered.reduce((sum, d) => sum + d.mrr, 0))} change={`${filtered.length} deals`} changeType="neutral" />
          <KPICard label="Weighted" value={formatCurrency(filtered.reduce((s, d) => s + d.mrr * (STAGE_WEIGHTS.find(sw => sw.stage === d.stage)?.weight || 0), 0))} change="Stage-weighted" changeType="neutral" />
          <KPICard label="Active Deals" value={`${filtered.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled').length}`} change={`${filtered.filter(d => d.health === 'At Risk').length} at risk`} changeType="neutral" />
          <KPICard label="My Involvement" value={`${filtered.filter(d => leaderInvolved.has(d.id)).length}`} change={`${formatCurrency(filtered.filter(d => leaderInvolved.has(d.id)).reduce((s, d) => s + d.mrr, 0))} MRR`} changeType="neutral" />
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Filters</h3>
          <div className="flex gap-4 flex-wrap">
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
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Pipeline Funnel</h3>
          <div className="space-y-3">
            {stageData.map((s, i) => {
              const next = stageData[i + 1];
              const conv = next && s.count > 0 ? Math.round((next.count / s.count) * 100) : null;
              const colors: Record<string, string> = { Discovery: 'bg-blue-400', Qualifying: 'bg-blue-500', Proposal: 'bg-teal-500', Negotiating: 'bg-green-500', Stalled: 'bg-gray-400' };
              const expanded = expandedStage === s.stage;
              return (
                <div key={s.stage}>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedStage(expanded ? null : s.stage)}>
                    <span className="w-24 text-12px font-medium text-gray-700 flex-shrink-0">{s.stage}</span>
                    <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div className={`h-full rounded-lg flex items-center pl-3 ${colors[s.stage]}`} style={{ width: `${Math.max((s.mrr / maxMRR) * 100, 10)}%` }}>
                        <span className="text-10px font-bold text-white">{formatCurrency(s.mrr)}</span>
                      </div>
                    </div>
                    <span className="w-12 text-11px text-gray-600 text-right">{s.count} deal{s.count !== 1 ? 's' : ''}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  </div>
                  {conv !== null && s.stage !== 'Stalled' && (
                    <div className="ml-27 text-9px text-gray-500">↓ {conv}% conversion</div>
                  )}
                  {expanded && s.deals.length > 0 && (
                    <div className="ml-4 mt-2 space-y-1">
                      {s.deals.map(d => (
                        <div key={d.id} className="px-3 py-2 bg-gray-50 rounded text-11px cursor-pointer hover:bg-gray-100" onClick={() => setSelectedDeal(d)}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">{d.name}</span>
                            <span className="text-gray-600">{formatCurrency(d.mrr)}</span>
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
                      <td className="px-2 py-2">
                        <span className="text-gray-800">{d.stage}</span>
                        <span className="text-gray-500 ml-2">{d.daysInStage}d</span>
                      </td>
                      <td className="px-2 py-2"><DealHealthBadge health={d.health} /></td>
                      <td className="px-2 py-2 text-right font-bold text-gray-800">{formatCurrency(d.mrr)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {Object.keys(lostReasonCounts).length > 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Closed-Lost Analysis</h3>
            <div className="space-y-2">
              {Object.entries(lostReasonCounts).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-11px font-semibold text-gray-700 capitalize">{reason.replace(/-/g, ' ')}</span>
                  <span className="text-11px font-bold text-red-600">{count} deals</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pushyDeals.length > 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Push History</h3>
            <div className="space-y-2">
              {pushyDeals.slice(0, 10).map(d => (
                <div key={d.id} className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" onClick={() => setSelectedDeal(d)}>
                  <div className="flex items-center justify-between">
                    <span className="text-11px font-semibold text-gray-800">{d.name}</span>
                    <span className="text-10px font-bold text-amber-600">{d.pushHistory?.length || 0} pushes</span>
                  </div>
                  {d.pushHistory && d.pushHistory.length > 0 && (
                    <p className="text-10px text-gray-500 mt-1">Latest: {d.pushHistory[d.pushHistory.length - 1].toPeriod}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderIntelligence = () => {
    const trajectories = {
      Accelerating: advisors.filter(a => a.trajectory === 'Accelerating'),
      Stable: advisors.filter(a => a.trajectory === 'Stable'),
      Decelerating: advisors.filter(a => a.trajectory === 'Slipping'),
      Freefall: advisors.filter(a => a.trajectory === 'Freefall'),
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(trajectories).map(([traj, list]) => (
            <KPICard
              key={traj}
              label={traj}
              value={`${list.length}`}
              change={`${formatCurrency(list.reduce((s, a) => s + a.mrr, 0))} MRR`}
              changeType={traj === 'Accelerating' ? 'positive' : traj === 'Freefall' ? 'negative' : 'neutral'}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(trajectories).map(([traj, list]) => (
            <div key={traj} className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
              <h3 className={`text-[15px] font-semibold font-['Newsreader'] mb-4 ${traj === 'Accelerating' ? 'text-green-600' : traj === 'Freefall' ? 'text-red-600' : 'text-gray-800'}`}>
                {traj} ({list.length})
              </h3>
              {list.length === 0 ? (
                <p className="text-12px text-gray-500 italic">None</p>
              ) : (
                <div className="space-y-2">
                  {list.sort((a, b) => b.mrr - a.mrr).map(a => (
                    <div key={a.id} className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" onClick={() => handleAdvisorClick(a.id)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-11px font-semibold text-gray-800">{a.name}</p>
                          <p className="text-10px text-gray-500">{a.company}</p>
                        </div>
                        <p className="text-12px font-bold text-gray-800">{formatCurrency(a.mrr)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Systemic Friction Patterns</h3>
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
                      <span key={n} className="text-10px px-2 py-1 bg-gray-100 rounded text-gray-700 cursor-pointer hover:bg-gray-200" onClick={() => handleAdvisorClick(advisors.find(a => a.name === n)?.id || '')}>
                        {n}
                      </span>
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
      { level: 'Critical', advisors: advisors.filter(a => a.friction === 'Critical'), color: 'bg-red-600' },
      { level: 'High', advisors: advisors.filter(a => a.friction === 'High'), color: 'bg-red-500' },
      { level: 'Moderate', advisors: advisors.filter(a => a.friction === 'Moderate'), color: 'bg-amber-400' },
      { level: 'Low', advisors: advisors.filter(a => a.friction === 'Low'), color: 'bg-green-500' },
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
          <KPICard label="Partners" value={`${advisors.length}`} change="total" changeType="neutral" />
        </div>

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
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-3">Friction by Category</h3>
          <div className="space-y-2">
            {Object.entries(frictionCategories).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-11px font-semibold text-gray-700">{cat}</span>
                <span className="text-11px font-bold text-red-600">{count} cases</span>
              </div>
            ))}
          </div>
        </div>

        {ratings && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">The Channel Standard Ratings</h3>
                <p className="text-11px text-gray-500 mt-1">Live supplier accountability data</p>
              </div>
              <a href="https://www.the-channel-standard.com" target="_blank" rel="noopener noreferrer" className="text-[#157A6E] text-11px font-semibold hover:underline">
                View Full →
              </a>
            </div>
            <SupplierAccountabilityCard data={ratings} loading={false} />
          </div>
        )}

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
                      {rhf.length > 0 && <span className="text-11px font-semibold text-red-600">{rhf.length} high</span>}
                      <span className="text-12px font-semibold text-gray-700">{repAdvisors.length} total</span>
                    </div>
                  </div>
                  {rhf.length > 0 && (
                    <div className="space-y-1">
                      {rhf.map(a => (
                        <div key={a.id} className="flex items-center justify-between px-2 py-1.5 bg-white rounded text-11px cursor-pointer hover:bg-gray-50" onClick={() => handleAdvisorClick(a.id)}>
                          <div className="flex items-center gap-2">
                            <FrictionBadge level={a.friction} />
                            <span className="font-semibold text-gray-800">{a.name}</span>
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

        {advisors.filter(a => a.friction === 'Critical').length > 0 && (
          <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
            <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">
              Critical Friction Cases
              <span className="text-12px font-normal text-red-600 ml-2">({advisors.filter(a => a.friction === 'Critical').length})</span>
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

  const renderTeamManagement = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Active CMs" value={`${reps.length}`} change={`${reps.reduce((s, r) => s + r.partnerCount, 0)} partners`} changeType="neutral" />
          <KPICard label="Avg Quota" value={formatCurrency(teamTarget / reps.length)} change="Per rep" changeType="neutral" />
          <KPICard label="Team Attainment" value={`${commitPercentage}%`} change="vs target" changeType={commitPercentage >= 85 ? "positive" : "negative"} />
          <KPICard label="Total MRR" value={formatCurrency(teamMRR)} change="under management" changeType="neutral" />
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">My Channel Managers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-11px">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Territory</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Partners</th>
                  <th className="text-left px-2 py-2 font-semibold text-gray-700">Active Deals</th>
                  <th className="text-right px-2 py-2 font-semibold text-gray-700">Quota</th>
                  <th className="text-right px-2 py-2 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {reps.map(rep => {
                  const deals = allDeals.filter(d => d.repId === rep.id);
                  const status = rep.engagementScore === 'Fading' ? 'At Risk' : rep.engagementScore === 'Strong' ? 'Strong' : 'Steady';
                  return (
                    <tr key={rep.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold text-gray-800">{rep.name}</td>
                      <td className="px-2 py-2 text-gray-600">{rep.territories?.[0] || 'Unassigned'}</td>
                      <td className="px-2 py-2 text-gray-700">{rep.partnerCount} / {rep.partnerCapacity}</td>
                      <td className="px-2 py-2 text-gray-700">{deals.filter(d => d.stage !== 'Closed Won').length}</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-800">{formatCurrency(rep.quotaTarget)}</td>
                      <td className="px-2 py-2 text-right"><EngLabel score={rep.engagementScore} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Cadence Rules</h3>
          <p className="text-11px text-gray-500 mb-4">Days between required touches by tier</p>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(cadenceRules).map(([tier, days]) => (
              <div key={tier} className="border border-gray-200 rounded-lg p-3">
                <label className="text-10px font-semibold text-gray-600 uppercase">{tier}</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setCadenceRules(p => ({ ...p, [tier]: parseInt(e.target.value) || 0 }))}
                  className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-13px font-bold text-gray-800"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            {Object.entries(notifSettings).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-11px font-semibold text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <button
                  onClick={() => setNotifSettings(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                  className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Alert Thresholds</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-10px font-semibold text-gray-600">Deal Push Threshold</label>
              <input
                type="number"
                value={alertThresholds.dealPushThreshold}
                onChange={(e) => setAlertThresholds(p => ({ ...p, dealPushThreshold: parseInt(e.target.value) || 0 }))}
                className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-12px font-bold"
              />
              <p className="text-9px text-gray-500 mt-1">MRR</p>
            </div>
            <div>
              <label className="text-10px font-semibold text-gray-600">Deal Push Count</label>
              <input
                type="number"
                value={alertThresholds.dealPushCount}
                onChange={(e) => setAlertThresholds(p => ({ ...p, dealPushCount: parseInt(e.target.value) || 0 }))}
                className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-12px font-bold"
              />
              <p className="text-9px text-gray-500 mt-1">Pushes</p>
            </div>
            <div>
              <label className="text-10px font-semibold text-gray-600">Cadence Compliance</label>
              <input
                type="number"
                value={alertThresholds.cadenceComplianceThreshold}
                onChange={(e) => setAlertThresholds(p => ({ ...p, cadenceComplianceThreshold: parseInt(e.target.value) || 0 }))}
                className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-12px font-bold"
              />
              <p className="text-9px text-gray-500 mt-1">%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
          <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800 mb-4">Reassignment Log</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[
              { advisor: 'John Smith', from: 'Sarah Chen', to: 'Marcus Johnson', date: '2 days ago' },
              { advisor: 'Tech Startup Inc', from: 'Marcus Johnson', to: 'Sarah Chen', date: '5 days ago' },
              { advisor: 'Global Corp', from: 'Unassigned', to: 'Sarah Chen', date: '1 week ago' },
            ].map((entry, i) => (
              <div key={i} className="p-2.5 bg-gray-50 rounded text-10px">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{entry.advisor}</p>
                    <p className="text-gray-600">{entry.from} → {entry.to}</p>
                  </div>
                  <p className="text-gray-500">{entry.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
    'team-management': renderTeamManagement(),
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
