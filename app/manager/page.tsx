'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  Flag,
  ShieldAlert,
  DollarSign,
  Brain,
  Activity,
  TrendingDown,
  TrendingUp,
  Zap,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  ArrowLeft,
  MapPin,
  Cake,
  GraduationCap,
  Briefcase,
  Phone,
  CalendarDays,
  Sparkles,
  Target,
  Heart,
  MessageCircle,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { KPICard } from '@/components/shared/KPICard';
import { MorningBriefing } from '@/components/shared/MorningBriefing';
import { AdvisorTable } from '@/components/shared/AdvisorTable';
import { AdvisorPanel } from '@/components/shared/AdvisorPanel';
import { AIChat } from '@/components/shared/AIChat';
import { DealHealthBadge } from '@/components/shared/DealHealthBadge';
import { PulseBadge } from '@/components/shared/PulseBadge';
import { FrictionBadge } from '@/components/shared/FrictionBadge';
import { SentimentBadge } from '@/components/shared/SentimentBadge';
import { TrajectoryBadge } from '@/components/shared/TrajectoryBadge';
import { TierBadge } from '@/components/shared/TierBadge';

import { advisors } from '@/lib/data/advisors';
import { deals } from '@/lib/data/deals';
import { managerNudges } from '@/lib/data/nudges';
import { managerBriefing } from '@/lib/data/briefings';
import { NAV_ITEMS_MANAGER, STAGE_WEIGHTS, QUARTER_END, DAYS_REMAINING } from '@/lib/constants';
import { Advisor, Deal, DealHealth, FrictionLevel, DiagnosticRow, EngagementScore } from '@/lib/types';

type DealStage = 'Discovery' | 'Qualifying' | 'Proposal' | 'Negotiating' | 'Closed Won' | 'Stalled';

export default function ManagerPage() {
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

  // Clear transient state when switching views
  const setActiveView = (view: string) => {
    setActiveViewRaw(view);
    if (view !== 'relationships') {
      setSelectedAdvisor(null);
      setPanelOpen(false);
    }
    setExpandedKPIPanel(null);
    setExpandedKPI(null);
    setDrillDown(null);
    setPipelineKPIExpanded(null);
    setExpandedStage(null);
    setInlineTab('overview');
  };

  const calculateEngagementScore = (pulse: string): number => {
    const scoreMap: Record<string, number> = {
      'Strong': 90,
      'Steady': 60,
      'Rising': 75,
      'Fading': 30,
      'Flatline': 10,
    };
    return scoreMap[pulse] || 0;
  };

  const getTierColor = (tier: string): string => {
    const colorMap: Record<string, string> = {
      'top10': '#157A6E',
      'next20': '#2563eb',
      'other': '#9ca3af',
    };
    return colorMap[tier] || '#9ca3af';
  };

  const calculateQuotesData = (advisor: Advisor): { submitted: number; won: number } => {
    const tierMultiplier: Record<string, number> = {
      'top10': 45,
      'next20': 28,
      'other': 12,
    };
    const tier = advisor.tier || 'other';
    const baseFactor = tierMultiplier[tier] || 12;
    const submitted = Math.floor(5 + (baseFactor * (advisor.mrr / 10000)));
    const conversionRate = 0.3 + ((advisor.mrr % 7) / 7) * 0.4;
    const won = Math.floor(submitted * conversionRate);
    return { submitted, won };
  };

  // Calculate metrics
  const totalMRR = useMemo(() => advisors.reduce((sum, a) => sum + a.mrr, 0), []);
  const activeDealCount = useMemo(() => deals.filter(d => !['Stalled', 'Closed Won'].includes(d.stage)).length, []);
  const healthyDealCount = useMemo(() => deals.filter(d => d.health === 'Healthy').length, []);
  const healthyPercent = useMemo(() => Math.round((healthyDealCount / deals.length) * 100), []);

  const avgEngagement = useMemo(() => {
    const strong = advisors.filter(a => a.pulse === 'Strong').length;
    const steady = advisors.filter(a => a.pulse === 'Steady').length;
    return strong > steady ? 'Strong' : 'Steady';
  }, []);

  const quarterGap = 1200000 - totalMRR;

  const weightedPipeline = useMemo(() => {
    return deals.reduce((sum, deal) => {
      const weight = STAGE_WEIGHTS.find(w => w.stage === deal.stage)?.weight || 0;
      return sum + (deal.mrr * weight);
    }, 0);
  }, []);

  const handleAdvisorClick = (advisorId: string) => {
    const advisor = advisors.find(a => a.id === advisorId);
    if (advisor) {
      setSelectedAdvisor(advisor);
      if (activeView !== 'relationships') {
        setPanelOpen(true);
      } else {
        setRelationshipsView('detail');
      }
    }
  };

  const pulseDistribution = {
    Strong: advisors.filter(a => a.pulse === 'Strong').length,
    Steady: advisors.filter(a => a.pulse === 'Steady').length,
    Rising: advisors.filter(a => a.pulse === 'Rising').length,
    Fading: advisors.filter(a => a.pulse === 'Fading').length,
    Flatline: advisors.filter(a => a.pulse === 'Flatline').length,
  };

  const trajectoryDistribution = {
    Accelerating: advisors.filter(a => a.trajectory === 'Accelerating').length,
    Climbing: advisors.filter(a => a.trajectory === 'Climbing').length,
    Stable: advisors.filter(a => a.trajectory === 'Stable').length,
    Slipping: advisors.filter(a => a.trajectory === 'Slipping').length,
    Freefall: advisors.filter(a => a.trajectory === 'Freefall').length,
  };

  const sentimentCounts = {
    Warm: advisors.filter(a => a.tone === 'Warm').length,
    Neutral: advisors.filter(a => a.tone === 'Neutral').length,
    Cool: advisors.filter(a => a.tone === 'Cool').length,
  };

  const intentCounts = {
    Strong: advisors.filter(a => a.intent === 'Strong').length,
    Moderate: advisors.filter(a => a.intent === 'Moderate').length,
    Low: advisors.filter(a => a.intent === 'Low').length,
  };

  const frictionCounts = {
    Low: advisors.filter(a => a.friction === 'Low').length,
    Moderate: advisors.filter(a => a.friction === 'Moderate').length,
    High: advisors.filter(a => a.friction === 'High').length,
    Critical: advisors.filter(a => a.friction === 'Critical').length,
  };

  const dealHealthCounts = {
    Healthy: deals.filter(d => d.health === 'Healthy').length,
    Monitor: deals.filter(d => d.health === 'Monitor').length,
    'At Risk': deals.filter(d => d.health === 'At Risk').length,
    Stalled: deals.filter(d => d.health === 'Stalled').length,
  };

  const stageTimelineMismatches = deals.filter(d => {
    const closeDate = new Date(d.closeDate);
    const now = new Date('2026-03-26');
    const daysUntilClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilClose <= 5 && ['Discovery', 'Qualifying'].includes(d.stage);
  });

  const filteredDeals = deals.filter(d => {
    const healthMatch = dealFilter.health === 'all' || d.health === dealFilter.health;
    const stageMatch = dealFilter.stage === 'all' || d.stage === dealFilter.stage;
    return healthMatch && stageMatch;
  });

  const closingThisMonth = deals.filter(d => {
    const closeDate = new Date(d.closeDate);
    return closeDate.getMonth() === 2 && closeDate.getFullYear() === 2026;
  });

  const getDaysInStageColor = (daysInStage: number) => {
    if (daysInStage < 7) return 'text-green-600 bg-green-50';
    if (daysInStage < 14) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const strategicKPIs = {
    retention: '94%',
    revenueGrowth: '+12.4%',
    engagement: avgEngagement,
    pipelineVelocity: '+8.3%',
  };

  const quotaTarget = 1200000;
  const quotaProgress = (totalMRR / quotaTarget) * 100;

  const stalledDealsCount = deals.filter(d => d.stage === 'Stalled').length;

  const riskRadar = useMemo(() => {
    return advisors.map(a => {
      let score = 0;
      if (a.pulse === 'Flatline') score += 30;
      else if (a.pulse === 'Fading') score += 20;
      if (a.trajectory === 'Freefall') score += 30;
      else if (a.trajectory === 'Slipping') score += 15;
      if (a.dealHealth === 'Stalled') score += 25;
      else if (a.dealHealth === 'At Risk') score += 20;
      else if (a.dealHealth === 'Monitor') score += 10;
      if (a.friction === 'Critical') score += 25;
      else if (a.friction === 'High') score += 15;
      else if (a.friction === 'Moderate') score += 5;
      if (a.intent === 'Low') score += 10;
      if (a.tone === 'Cool') score += 10;

      const advisorDeals = deals.filter(d => d.advisorId === a.id);
      const atRiskMRR = advisorDeals
        .filter(d => ['At Risk', 'Stalled', 'Monitor'].includes(d.health))
        .reduce((sum, d) => sum + d.mrr, 0);

      return { advisor: a, score, atRiskMRR, dealCount: advisorDeals.length };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
  }, []);

  const revenueAtRisk = useMemo(() => {
    const atRiskDeals = deals.filter(d => d.health === 'At Risk');
    const stalledDeals = deals.filter(d => d.health === 'Stalled');
    const monitorDeals = deals.filter(d => d.health === 'Monitor');
    return {
      total: [...atRiskDeals, ...stalledDeals, ...monitorDeals].reduce((sum, d) => sum + d.mrr, 0),
      atRisk: { count: atRiskDeals.length, mrr: atRiskDeals.reduce((sum, d) => sum + d.mrr, 0) },
      stalled: { count: stalledDeals.length, mrr: stalledDeals.reduce((sum, d) => sum + d.mrr, 0) },
      monitor: { count: monitorDeals.length, mrr: monitorDeals.reduce((sum, d) => sum + d.mrr, 0) },
    };
  }, []);

  const aiInsights = useMemo(() => {
    const insights: { icon: string; text: string; type: 'critical' | 'warning' | 'positive' | 'info' }[] = [];

    const freefallAdvisors = advisors.filter(a => a.trajectory === 'Freefall');
    if (freefallAdvisors.length > 0) {
      const names = freefallAdvisors.map(a => a.name).join(' and ');
      const totalMRRVal = freefallAdvisors.reduce((sum, a) => sum + a.mrr, 0);
      insights.push({ icon: 'alert', text: `${names} ${freefallAdvisors.length === 1 ? 'is' : 'are'} in freefall trajectory with $${(totalMRRVal / 1000).toFixed(1)}K MRR at stake. Immediate re-engagement needed.`, type: 'critical' });
    }

    const bigStalledDeals = deals.filter(d => d.health === 'Stalled').sort((a, b) => b.mrr - a.mrr);
    if (bigStalledDeals.length > 0) {
      const topDeal = bigStalledDeals[0];
      const advisor = advisors.find(a => a.id === topDeal.advisorId);
      insights.push({ icon: 'dollar', text: `${topDeal.name} has been stalled for ${topDeal.daysInStage} days ($${(topDeal.mrr / 1000).toFixed(1)}K). ${advisor?.name || 'Advisor'} may need a fresh approach or executive sponsor involvement.`, type: 'warning' });
    }

    const climbingAdvisors = advisors.filter(a => a.trajectory === 'Climbing' || a.trajectory === 'Accelerating');
    if (climbingAdvisors.length > 0) {
      const topClimber = climbingAdvisors.sort((a, b) => b.mrr - a.mrr)[0];
      insights.push({ icon: 'trending', text: `${climbingAdvisors.length} advisors are trending upward. ${topClimber.name} leads with $${(topClimber.mrr / 1000).toFixed(1)}K MRR and ${topClimber.trajectory.toLowerCase()} trajectory—consider expanding their portfolio.`, type: 'positive' });
    }

    const fadingCount = advisors.filter(a => a.pulse === 'Fading' || a.pulse === 'Flatline').length;
    if (fadingCount > 0) {
      const fadingMRR = advisors.filter(a => a.pulse === 'Fading' || a.pulse === 'Flatline').reduce((sum, a) => sum + a.mrr, 0);
      insights.push({ icon: 'users', text: `${fadingCount} advisors showing fading or flatline engagement, representing $${(fadingMRR / 1000).toFixed(1)}K in MRR. Prioritize personal outreach this week.`, type: 'warning' });
    }

    const healthyRatio = Math.round((deals.filter(d => d.health === 'Healthy').length / deals.length) * 100);
    insights.push({ icon: 'zap', text: `${healthyRatio}% of your pipeline is healthy. Focus energy on the ${deals.filter(d => d.health !== 'Healthy').length} deals that need attention to protect quarter-end targets.`, type: 'info' });

    return insights.slice(0, 5);
  }, []);

  const topMovers = useMemo(() => {
    const advisorsWithChange = advisors
      .map(a => ({
        advisor: a,
        previousTrajectory: a.trajectory === 'Freefall' ? 'Stable' : a.trajectory === 'Slipping' ? 'Stable' : undefined,
      }))
      .filter(a => a.advisor.trajectory === 'Climbing' || a.advisor.trajectory === 'Accelerating' || a.advisor.trajectory === 'Freefall' || a.advisor.trajectory === 'Slipping')
      .sort((a, b) => b.advisor.mrr - a.advisor.mrr)
      .slice(0, 6);

    return {
      up: advisorsWithChange.filter(a => a.advisor.trajectory === 'Climbing' || a.advisor.trajectory === 'Accelerating'),
      down: advisorsWithChange.filter(a => a.advisor.trajectory === 'Freefall' || a.advisor.trajectory === 'Slipping'),
    };
  }, []);

  const pulseSignals = {
    Strong: advisors.filter(a => a.pulse === 'Strong').length,
    Steady: advisors.filter(a => a.pulse === 'Steady').length,
    Fading: advisors.filter(a => a.pulse === 'Fading').length,
    Flatline: advisors.filter(a => a.pulse === 'Flatline').length,
    Rising: advisors.filter(a => a.pulse === 'Rising').length,
    Climbing: advisors.filter(a => a.trajectory === 'Climbing' || a.trajectory === 'Accelerating').length,
    Freefall: advisors.filter(a => a.trajectory === 'Freefall').length,
  };

  const EngLabel = ({ score }: { score: EngagementScore }) => {
    const colors = { Strong: 'bg-green-100 text-green-700', Steady: 'bg-blue-100 text-blue-700', Fading: 'bg-pink-100 text-pink-700' };
    return <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${colors[score]}`}>{score}</span>;
  };

  const getFilteredAdvisors = () => {
    switch (relationshipFilter) {
      case 'At Risk':
        return advisors.filter(a => ['Slipping', 'Freefall'].includes(a.trajectory) || ['Fading', 'Flatline'].includes(a.pulse));
      case 'Top 10':
        return advisors.filter(a => a.tier === 'top10');
      case 'New':
        return advisors.filter(a => {
          const connected = new Date(a.connectedSince);
          const sixMonthsAgo = new Date('2025-09-01');
          return connected > sixMonthsAgo;
        });
      default:
        return advisors;
    }
  };

  const filteredAdvisors = getFilteredAdvisors();

  const portfolioStats = {
    totalAdvisors: filteredAdvisors.length,
    totalMRRFiltered: filteredAdvisors.reduce((sum, a) => sum + a.mrr, 0),
    pulseStats: {
      Strong: filteredAdvisors.filter(a => a.pulse === 'Strong').length,
      Steady: filteredAdvisors.filter(a => a.pulse === 'Steady').length,
      Fading: filteredAdvisors.filter(a => a.pulse === 'Fading').length,
      Flatline: filteredAdvisors.filter(a => a.pulse === 'Flatline').length,
    },
  };

  const morningBriefingItems = [
    ...(managerBriefing.actNow || []),
    ...(managerBriefing.capitalize || []),
    ...(managerBriefing.nurture || []),
  ];

  const topActNow = (managerBriefing.actNow || []).slice(0, 1);
  const topCapitalize = (managerBriefing.capitalize || []).slice(0, 1);
  const topNurture = (managerBriefing.nurture || []).slice(0, 1);

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F7F5F2' }}>
      <Sidebar
        items={NAV_ITEMS_MANAGER}
        activeView={activeView}
        onViewChange={setActiveView}
        role="manager"
        userName="Jordan R."
        userInitials="JR"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar nudges={managerNudges} userName="Jordan R." userInitials="JR" pageTitle={activeView === 'command-center' ? 'Command Center' : activeView === 'intelligence-hub' ? 'Intelligence Hub' : activeView === 'relationships' ? 'Relationships' : activeView === 'pipeline' ? 'Pipeline' : 'Strategic'} />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {/* ========== COMMAND CENTER VIEW ========== */}
            {activeView === 'command-center' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #157A6E 0%, #0f5250 100%)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-widest opacity-90">Q1 2026</p>
                      <h2 className="text-3xl font-bold mt-2">{DAYS_REMAINING} Days Left in Q1</h2>
                      <p className="text-sm mt-3 opacity-90">${(quarterGap / 1000).toFixed(1)}K gap to $1.2M target ({Math.round((totalMRR / 1200000) * 100)}%)</p>
                    </div>
                    <Clock className="w-12 h-12 opacity-80" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'mrr' ? null : 'mrr')}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <KPICard
                      label="Total MRR"
                      value={`$${(totalMRR / 1000).toFixed(1)}K`}
                      change="+8.3% vs last month"
                      changeType="positive"
                    />
                  </div>
                  <div
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'deals' ? null : 'deals')}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <KPICard
                      label="Active Deals"
                      value={activeDealCount.toString()}
                      change="+5 new this week"
                      changeType="positive"
                    />
                  </div>
                  <div
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'pipeline' ? null : 'pipeline')}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <KPICard
                      label="Healthy Pipeline %"
                      value={`${healthyPercent}%`}
                      change="-3% from last week"
                      changeType="negative"
                    />
                  </div>
                  <div
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'engagement' ? null : 'engagement')}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <KPICard
                      label="Avg Engagement"
                      value={avgEngagement}
                      change="Improved from Steady"
                      changeType="positive"
                    />
                  </div>
                </div>

                {expandedKPIPanel && (
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6 animate-in fade-in slide-in-from-top-2">
                    {expandedKPIPanel === 'mrr' && (
                      <div>
                        <h3 className="text-13px uppercase font-bold tracking-widest text-[#888] mb-4">Top 5 Advisors by MRR</h3>
                        <div className="space-y-3">
                          {advisors.sort((a, b) => b.mrr - a.mrr).slice(0, 5).map((advisor, idx) => (
                            <div key={advisor.id} className="flex items-center justify-between pb-3 border-b border-[#f0ede9] last:border-0">
                              <div className="flex items-center gap-3">
                                <span className="text-13px font-medium text-gray-900">{idx + 1}. {advisor.name}</span>
                              </div>
                              <span className="text-13px font-bold" style={{ color: '#157A6E' }}>${(advisor.mrr / 1000).toFixed(1)}K</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {expandedKPIPanel === 'deals' && (
                      <div>
                        <h3 className="text-13px uppercase font-bold tracking-widest text-[#888] mb-4">5 Most Recent Active Deals</h3>
                        <div className="space-y-3">
                          {deals
                            .filter(d => !['Stalled', 'Closed Won'].includes(d.stage))
                            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
                            .slice(0, 5)
                            .map((deal, idx) => (
                              <div key={deal.id} className="flex items-center justify-between pb-3 border-b border-[#f0ede9] last:border-0">
                                <div className="flex-1">
                                  <p className="text-13px font-medium text-gray-900">{deal.name}</p>
                                  <p className="text-11px text-gray-600">{deal.stage}</p>
                                </div>
                                <DealHealthBadge health={deal.health} />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {expandedKPIPanel === 'pipeline' && (
                      <div>
                        <h3 className="text-13px uppercase font-bold tracking-widest text-[#888] mb-4">Pipeline Health Breakdown</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2">
                            <span className="text-13px text-gray-700">Healthy</span>
                            <span className="text-13px font-bold text-green-600">{dealHealthCounts.Healthy}</span>
                          </div>
                          <div className="flex items-center justify-between pb-2">
                            <span className="text-13px text-gray-700">Monitor</span>
                            <span className="text-13px font-bold text-yellow-600">{dealHealthCounts.Monitor}</span>
                          </div>
                          <div className="flex items-center justify-between pb-2">
                            <span className="text-13px text-gray-700">At Risk</span>
                            <span className="text-13px font-bold text-orange-600">{dealHealthCounts['At Risk']}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-13px text-gray-700">Stalled</span>
                            <span className="text-13px font-bold text-red-600">{dealHealthCounts.Stalled}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {expandedKPIPanel === 'engagement' && (
                      <div>
                        <h3 className="text-13px uppercase font-bold tracking-widest text-[#888] mb-4">Pulse Distribution</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2">
                            <span className="text-13px text-gray-700">Strong</span>
                            <span className="text-13px font-bold text-green-600">{pulseDistribution.Strong}</span>
                          </div>
                          <div className="flex items-center justify-between pb-2">
                            <span className="text-13px text-gray-700">Steady</span>
                            <span className="text-13px font-bold text-blue-600">{pulseDistribution.Steady}</span>
                          </div>
                          <div className="flex items-center justify-between pb-2">
                            <span className="text-13px text-gray-700">Fading</span>
                            <span className="text-13px font-bold text-yellow-600">{pulseDistribution.Fading}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-13px text-gray-700">Flatline</span>
                            <span className="text-13px font-bold text-red-600">{pulseDistribution.Flatline}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6 border-l-4" style={{ borderLeftColor: '#ef4444' }}>
                    <p className="text-10px uppercase font-semibold tracking-widest text-[#888] mb-2">Risk Alert</p>
                    <h3 className="font-bold text-gray-900 mb-2">Tom Bradley</h3>
                    <p className="text-13px text-gray-700">At-risk account flagged for friction in quoting process. Recommend executive check-in this week.</p>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6 border-l-4" style={{ borderLeftColor: '#157A6E' }}>
                    <p className="text-10px uppercase font-semibold tracking-widest text-[#888] mb-2">Opportunity</p>
                    <h3 className="font-bold text-gray-900 mb-2">Sarah Chen</h3>
                    <p className="text-13px text-gray-700">Strong trajectory with $45K pipeline growth. Ready for portfolio expansion—consider tier upgrade.</p>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6 border-l-4" style={{ borderLeftColor: '#2563eb' }}>
                    <p className="text-10px uppercase font-semibold tracking-widest text-[#888] mb-2">Info</p>
                    <h3 className="font-bold text-gray-900 mb-2">Portfolio Health</h3>
                    <p className="text-13px text-gray-700">3 advisors entering fading status. Schedule 1-on-1s to prevent pipeline decline.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-[#e8e5e1]">
                    <div className="px-6 py-4 border-b border-[#f0ede9] flex items-center justify-between">
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">
                        Morning Briefing <span className="inline-block ml-2 px-2 py-0.5 rounded-full text-10px font-bold bg-[#157A6E] text-white">{morningBriefingItems.length} items</span>
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {topActNow.slice(0, 1).map((item, idx) => (
                        <div key={`act-${idx}`} className="text-13px text-gray-700 pb-2 border-b border-[#f0ede9]">
                          <span className="text-11px uppercase font-bold text-[#888]">Act Now: </span>
                          {item.advisorName ? `${item.advisorName}, ${item.dealName}` : item.dealName}
                          {item.mrrAtRisk && <span className="ml-2 font-bold text-red-600">${(item.mrrAtRisk / 1000).toFixed(1)}K</span>}
                        </div>
                      ))}
                      {topCapitalize.slice(0, 1).map((item, idx) => (
                        <div key={`cap-${idx}`} className="text-13px text-gray-700 pb-2 border-b border-[#f0ede9]">
                          <span className="text-11px uppercase font-bold text-[#888]">Capitalize: </span>
                          {item.advisorName ? `${item.advisorName}, ${item.dealName}` : item.dealName}
                          {item.mrrAtRisk && <span className="ml-2 font-bold text-green-600">${(item.mrrAtRisk / 1000).toFixed(1)}K</span>}
                        </div>
                      ))}
                      {topNurture.slice(0, 1).map((item, idx) => (
                        <div key={`nur-${idx}`} className="text-13px text-gray-700">
                          <span className="text-11px uppercase font-bold text-[#888]">Nurture: </span>
                          {item.advisorName ? `${item.advisorName}, ${item.dealName}` : item.dealName}
                          {item.mrrAtRisk && <span className="ml-2 font-bold text-blue-600">${(item.mrrAtRisk / 1000).toFixed(1)}K</span>}
                        </div>
                      ))}
                      <button
                        onClick={() => setShowBriefing(true)}
                        className="w-full mt-3 py-2 text-13px font-semibold text-[#157A6E] border-t border-[#f0ede9] pt-3 hover:text-[#0f5250]"
                      >
                        View Full Briefing →
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e8e5e1]">
                    <div className="px-6 py-4 border-b border-[#f0ede9]">
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Pipeline Snapshot</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      {['Discovery', 'Proposal', 'Negotiating', 'Qualifying'].map(stage => {
                        const stageDeals = deals.filter(d => d.stage === stage);
                        const stageMRR = stageDeals.reduce((sum, d) => sum + d.mrr, 0);
                        const maxMRR = Math.max(
                          deals.filter(d => d.stage === 'Discovery').reduce((sum, d) => sum + d.mrr, 0),
                          deals.filter(d => d.stage === 'Proposal').reduce((sum, d) => sum + d.mrr, 0),
                          deals.filter(d => d.stage === 'Negotiating').reduce((sum, d) => sum + d.mrr, 0),
                          deals.filter(d => d.stage === 'Qualifying').reduce((sum, d) => sum + d.mrr, 0)
                        );
                        const percentage = maxMRR > 0 ? (stageMRR / maxMRR) * 100 : 0;
                        return (
                          <div key={stage}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-13px font-medium text-gray-900">{stage}</span>
                              <span className="text-11px text-gray-600">${(stageMRR / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full" style={{ width: `${percentage}%`, backgroundColor: '#157A6E' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showBriefing && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10">
                <div className="bg-white rounded-xl border border-[#e8e5e1] w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#f0ede9] flex items-center justify-between">
                    <h2 className="text-18px font-bold text-gray-900">Morning Briefing</h2>
                    <button
                      onClick={() => setShowBriefing(false)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <MorningBriefing actNow={managerBriefing.actNow} capitalize={managerBriefing.capitalize} nurture={managerBriefing.nurture} />
                  </div>
                </div>
              </div>
            )}

            {/* ========== INTELLIGENCE HUB VIEW ========== */}
            {activeView === 'intelligence-hub' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div
                    onClick={() => setDrillDown(drillDown?.label === 'Strong' ? null : { label: 'Strong', advisorIds: advisors.filter(a => a.pulse === 'Strong').map(a => a.id) })}
                    className="bg-white rounded-xl border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Strong</p>
                    <p className="text-24px font-bold text-gray-900">{pulseSignals.Strong}</p>
                  </div>
                  <div
                    onClick={() => setDrillDown(drillDown?.label === 'Steady' ? null : { label: 'Steady', advisorIds: advisors.filter(a => a.pulse === 'Steady').map(a => a.id) })}
                    className="bg-white rounded-xl border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Steady</p>
                    <p className="text-24px font-bold text-gray-900">{pulseSignals.Steady}</p>
                  </div>
                  <div
                    onClick={() => setDrillDown(drillDown?.label === 'Fading' ? null : { label: 'Fading', advisorIds: advisors.filter(a => a.pulse === 'Fading').map(a => a.id) })}
                    className="bg-white rounded-xl border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Fading</p>
                    <p className="text-24px font-bold text-gray-900">{pulseSignals.Fading}</p>
                  </div>
                  <div
                    onClick={() => setDrillDown(drillDown?.label === 'Flatline' ? null : { label: 'Flatline', advisorIds: advisors.filter(a => a.pulse === 'Flatline').map(a => a.id) })}
                    className="bg-white rounded-xl border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Flatline</p>
                    <p className="text-24px font-bold text-gray-900">{pulseSignals.Flatline}</p>
                  </div>
                  <div
                    onClick={() => setDrillDown(drillDown?.label === 'Climbing' ? null : { label: 'Climbing', advisorIds: advisors.filter(a => a.trajectory === 'Climbing' || a.trajectory === 'Accelerating').map(a => a.id) })}
                    className="bg-white rounded-xl border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Climbing</p>
                    <p className="text-24px font-bold text-gray-900" style={{ color: '#16a34a' }}>{pulseSignals.Climbing}</p>
                  </div>
                  <div
                    onClick={() => setDrillDown(drillDown?.label === 'Freefall' ? null : { label: 'Freefall', advisorIds: advisors.filter(a => a.trajectory === 'Freefall').map(a => a.id) })}
                    className="bg-white rounded-xl border border-[#e8e5e1] p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Freefall</p>
                    <p className="text-24px font-bold text-gray-900" style={{ color: '#ef4444' }}>{pulseSignals.Freefall}</p>
                  </div>
                </div>

                {drillDown && (
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-13px uppercase font-bold tracking-widest text-[#888]">{drillDown.label} Advisors</h3>
                      <button onClick={() => setDrillDown(null)} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {advisors.filter(a => drillDown.advisorIds.includes(a.id)).map(advisor => (
                        <div
                          key={advisor.id}
                          onClick={() => handleAdvisorClick(advisor.id)}
                          className="p-4 bg-gray-50 rounded-lg border border-[#e8e5e1] cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <p className="text-13px font-medium text-gray-900">{advisor.name}</p>
                          <p className="text-11px text-gray-600 mb-2">{advisor.company}</p>
                          <div className="flex gap-2">
                            <PulseBadge pulse={advisor.pulse} size="sm" />
                            <span className="text-11px font-semibold text-gray-900">${(advisor.mrr / 1000).toFixed(1)}K</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-[#e8e5e1]">
                    <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">AI Insights Feed</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      {aiInsights.map((insight, idx) => (
                        <div key={idx} className="border-l-4 pl-4 py-2" style={{ borderLeftColor: insight.type === 'critical' ? '#ef4444' : insight.type === 'warning' ? '#f59e0b' : insight.type === 'positive' ? '#16a34a' : '#2563eb' }}>
                          <p className="text-13px text-gray-700">{insight.text}</p>
                          <p className="text-11px text-gray-500 mt-1">2 hours ago</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e8e5e1]">
                    <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Risk Radar</h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {riskRadar.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 pb-3 border-b border-[#f0ede9] last:border-0">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-700">
                            {item.advisor.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-13px font-medium text-gray-900 truncate">{item.advisor.name}</p>
                            <p className="text-11px text-gray-600">${(item.atRiskMRR / 1000).toFixed(1)}K at risk</p>
                          </div>
                          <div className="px-3 py-1 rounded-full text-11px font-bold text-white" style={{ backgroundColor: item.score > 60 ? '#ef4444' : item.score > 40 ? '#f59e0b' : '#fb923c' }}>
                            {item.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-4">Revenue at Risk</p>
                    <p className="text-28px font-bold mb-4" style={{ color: '#ef4444' }}>${(revenueAtRisk.total / 1000).toFixed(1)}K</p>
                    <div className="space-y-2 text-13px">
                      <div className="flex justify-between">
                        <span className="text-gray-600">At Risk:</span>
                        <span className="font-medium text-gray-900">${(revenueAtRisk.atRisk.mrr / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stalled:</span>
                        <span className="font-medium text-gray-900">${(revenueAtRisk.stalled.mrr / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monitor:</span>
                        <span className="font-medium text-gray-900">${(revenueAtRisk.monitor.mrr / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-4">Top Movers</p>
                    <div className="space-y-3">
                      {topMovers.up.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 pb-2 border-b border-[#f0ede9]">
                          <TrendingUp className="w-4 h-4" style={{ color: '#16a34a' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-13px font-medium text-gray-900">{item.advisor.name}</p>
                          </div>
                          <span className="text-11px text-gray-600 whitespace-nowrap">${(item.advisor.mrr / 1000).toFixed(1)}K</span>
                        </div>
                      ))}
                      {topMovers.down.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 pb-2 border-b border-[#f0ede9]">
                          <TrendingDown className="w-4 h-4" style={{ color: '#ef4444' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-13px font-medium text-gray-900">{item.advisor.name}</p>
                          </div>
                          <span className="text-11px text-gray-600 whitespace-nowrap">${(item.advisor.mrr / 1000).toFixed(1)}K</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-4">Portfolio Signals</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-11px text-gray-600">Tone</span>
                          <span className="text-11px font-medium text-gray-900">{sentimentCounts.Warm + sentimentCounts.Neutral}/{advisors.length}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                          <div className="bg-blue-500" style={{ width: `${(sentimentCounts.Warm / advisors.length) * 100}%` }} />
                          <div className="bg-gray-400" style={{ width: `${(sentimentCounts.Neutral / advisors.length) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-11px text-gray-600">Intent</span>
                          <span className="text-11px font-medium text-gray-900">{intentCounts.Strong}/{advisors.length}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-green-500" style={{ width: `${(intentCounts.Strong / advisors.length) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-11px text-gray-600">Friction</span>
                          <span className="text-11px font-medium text-gray-900">{frictionCounts.Low}/{advisors.length}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-green-500" style={{ width: `${(frictionCounts.Low / advisors.length) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== RELATIONSHIPS VIEW ========== */}
            {activeView === 'relationships' && (
              <div className="flex gap-6 h-full max-w-7xl mx-auto">
                <div className="w-64 flex flex-col bg-white rounded-xl border border-[#e8e5e1]">
                  <div className="px-6 py-4 border-b border-[#f0ede9] flex gap-2 flex-wrap">
                    {['All', 'At Risk', 'Top 10', 'New'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setRelationshipFilter(filter)}
                        className="px-3 py-1 rounded-full text-11px font-semibold border transition-colors"
                        style={{
                          backgroundColor: relationshipFilter === filter ? '#157A6E' : 'transparent',
                          color: relationshipFilter === filter ? 'white' : '#666',
                          borderColor: relationshipFilter === filter ? '#157A6E' : '#e8e5e1',
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {filteredAdvisors.map(advisor => (
                      <div
                        key={advisor.id}
                        onClick={() => handleAdvisorClick(advisor.id)}
                        className="px-6 py-4 border-b border-[#f0ede9] cursor-pointer hover:bg-[#F7F5F2] transition-colors"
                        style={{
                          backgroundColor: selectedAdvisor?.id === advisor.id ? '#f0f9f7' : undefined,
                          borderLeftWidth: selectedAdvisor?.id === advisor.id ? '4px' : '0px',
                          borderLeftColor: selectedAdvisor?.id === advisor.id ? '#157A6E' : undefined,
                        }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-[#157A6E] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {advisor.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-13px font-medium text-gray-900 truncate">{advisor.name}</p>
                            <p className="text-11px text-gray-600 truncate">{advisor.company}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <PulseBadge pulse={advisor.pulse} size="sm" />
                          <span className="text-11px font-semibold text-gray-900 ml-auto">${(advisor.mrr / 1000).toFixed(1)}K</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedAdvisor ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="bg-white rounded-t-xl border border-b-0 border-[#e8e5e1] p-6 flex items-start gap-6 border-b border-[#f0ede9] pb-4">
                      <div className="w-16 h-16 rounded-full bg-[#157A6E] text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
                        {selectedAdvisor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-24px font-bold text-gray-900">{selectedAdvisor.name}</h2>
                          {selectedAdvisor.tier && <TierBadge tier={selectedAdvisor.tier} />}
                        </div>
                        <p className="text-13px text-gray-600 mb-3">{selectedAdvisor.title} · {selectedAdvisor.company}</p>
                        <div className="flex gap-2 flex-wrap">
                          <PulseBadge pulse={selectedAdvisor.pulse} size="sm" />
                          <TrajectoryBadge trajectory={selectedAdvisor.trajectory} />
                          <SentimentBadge tone={selectedAdvisor.tone} />
                          <FrictionBadge level={selectedAdvisor.friction} />
                          <DealHealthBadge health={selectedAdvisor.dealHealth} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-11px text-gray-500 uppercase mb-1">MRR</p>
                        <p className="text-28px font-bold" style={{ color: '#157A6E' }}>${(selectedAdvisor.mrr / 1000).toFixed(1)}K</p>
                      </div>
                    </div>

                    <div className="bg-white border-b border-[#f0ede9] flex">
                      {(['overview', 'personal', 'deals', 'notes', 'activity'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setInlineTab(tab)}
                          className="flex-1 px-6 py-3 text-13px font-semibold uppercase tracking-widest transition-colors border-b-2"
                          style={{
                            color: inlineTab === tab ? '#157A6E' : '#888',
                            borderBottomColor: inlineTab === tab ? '#157A6E' : 'transparent',
                          }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white rounded-b-xl border border-t-0 border-[#e8e5e1] p-6">
                      {inlineTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Relationship Context</h3>
                              <dl className="space-y-2 text-13px">
                                <div className="flex justify-between">
                                  <dt className="text-gray-600">Connected Since</dt>
                                  <dd className="font-medium">{selectedAdvisor.connectedSince}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-gray-600">Best Day to Reach</dt>
                                  <dd className="font-medium">{selectedAdvisor.bestDayToReach}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-gray-600">Comm Preference</dt>
                                  <dd className="font-medium">{selectedAdvisor.commPreference}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-gray-600">Referred By</dt>
                                  <dd className="font-medium">{selectedAdvisor.referredBy}</dd>
                                </div>
                              </dl>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Engagement Breakdown</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-13px text-gray-600">Engagement</span>
                                  <EngLabel score={selectedAdvisor.engagementBreakdown.engagement} />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-13px text-gray-600">Pipeline Strength</span>
                                  <EngLabel score={selectedAdvisor.engagementBreakdown.pipelineStrength} />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-13px text-gray-600">Responsiveness</span>
                                  <EngLabel score={selectedAdvisor.engagementBreakdown.responsiveness} />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-13px text-gray-600">Growth Potential</span>
                                  <EngLabel score={selectedAdvisor.engagementBreakdown.growthPotential} />
                                </div>
                              </div>
                            </div>
                            {selectedAdvisor.personalIntel && (
                              <div>
                                <h3 className="font-bold text-gray-900 mb-2 text-12px uppercase tracking-widest text-[#888]">Personal Intel</h3>
                                <p className="text-13px text-gray-700">{selectedAdvisor.personalIntel}</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-6">
                            <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: '#f0f9f7', borderLeftColor: '#157A6E' }}>
                              <p className="text-13px italic text-gray-700">"{selectedAdvisor.diagnosis}"</p>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Active Deals ({selectedAdvisor.deals.length})</h3>
                              <div className="space-y-2">
                                {deals.filter(d => selectedAdvisor.deals.includes(d.id)).slice(0, 3).map(deal => (
                                  <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                                    <div>
                                      <p className="text-13px font-medium text-gray-900">{deal.name}</p>
                                      <p className="text-11px text-gray-500">{deal.stage} · {deal.daysInStage}d</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-13px font-bold" style={{ color: '#157A6E' }}>${(deal.mrr / 1000).toFixed(1)}K</p>
                                      <DealHealthBadge health={deal.health} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Recent Activity</h3>
                              <div className="space-y-2">
                                {selectedAdvisor.activity.slice(0, 4).map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-2">
                                    <SentimentBadge tone={item.sentiment} />
                                    <div>
                                      <p className="text-13px text-gray-700">{item.text}</p>
                                      <p className="text-11px text-gray-400">{item.time}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {inlineTab === 'personal' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Profile</h3>
                              <dl className="space-y-3 text-13px">
                                {selectedAdvisor.location && (
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</dt>
                                    <dd className="font-medium">{selectedAdvisor.location}</dd>
                                  </div>
                                )}
                                {selectedAdvisor.birthday && (
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600 flex items-center gap-1.5"><Cake className="w-3.5 h-3.5" /> Birthday</dt>
                                    <dd className="font-medium">{selectedAdvisor.birthday}</dd>
                                  </div>
                                )}
                                {selectedAdvisor.education && (
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Education</dt>
                                    <dd className="font-medium">{selectedAdvisor.education}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                            {selectedAdvisor.family && (
                              <div>
                                <h3 className="font-bold text-gray-900 mb-2 text-12px uppercase tracking-widest text-[#888]">Family</h3>
                                <p className="text-13px text-gray-700">{selectedAdvisor.family}</p>
                              </div>
                            )}
                            {selectedAdvisor.hobbies && (
                              <div>
                                <h3 className="font-bold text-gray-900 mb-2 text-12px uppercase tracking-widest text-[#888]">Hobbies & Interests</h3>
                                <p className="text-13px text-gray-700">{selectedAdvisor.hobbies}</p>
                              </div>
                            )}
                            {selectedAdvisor.funFact && (
                              <div>
                                <h3 className="font-bold text-gray-900 mb-2 text-12px uppercase tracking-widest text-[#888]">Fun Fact</h3>
                                <p className="text-13px text-gray-700">{selectedAdvisor.funFact}</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Channel Relationships</h3>
                              <dl className="space-y-3 text-13px">
                                {selectedAdvisor.tsds?.length > 0 && (
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">TSDs</dt>
                                    <dd className="font-medium">{selectedAdvisor.tsds.join(', ')}</dd>
                                  </div>
                                )}
                                {selectedAdvisor.previousCompanies?.length > 0 && (
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">Previous Companies</dt>
                                    <dd className="font-medium">{selectedAdvisor.previousCompanies.join(', ')}</dd>
                                  </div>
                                )}
                                {selectedAdvisor.mutualConnections?.length > 0 && (
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">Mutual Connections</dt>
                                    <dd className="font-medium">{selectedAdvisor.mutualConnections.join(', ')}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          </div>
                        </div>
                      )}

                      {inlineTab === 'deals' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {deals.filter(d => selectedAdvisor.deals.includes(d.id)).length === 0 ? (
                            <p className="text-13px text-gray-600 col-span-full">No deals found</p>
                          ) : (
                            deals.filter(d => selectedAdvisor.deals.includes(d.id)).map(deal => (
                              <div key={deal.id} className="bg-white border border-[#e8e5e1] rounded-xl p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="text-13px font-semibold text-gray-900">{deal.name}</h4>
                                  <DealHealthBadge health={deal.health} />
                                </div>
                                <dl className="space-y-1 text-11px text-gray-600 mb-3">
                                  <div className="flex justify-between">
                                    <dt>MRR:</dt>
                                    <dd className="font-medium text-gray-900">${(deal.mrr / 1000).toFixed(1)}K</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt>Stage:</dt>
                                    <dd className="font-medium text-gray-900">{deal.stage}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt>Days in Stage:</dt>
                                    <dd className="font-medium text-gray-900">{deal.daysInStage}</dd>
                                  </div>
                                </dl>
                                <div className="bg-gray-200 rounded h-2 mb-1 overflow-hidden">
                                  <div className="bg-[#157A6E] h-2 rounded" style={{ width: `${deal.probability}%` }} />
                                </div>
                                <p className="text-11px text-gray-500">Probability: {deal.probability}%</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {inlineTab === 'notes' && (
                        <div className="max-w-2xl space-y-4">
                          {selectedAdvisor.notes.map((note, idx) => (
                            <div key={idx} className="p-3 rounded-lg text-13px text-gray-700" style={{ backgroundColor: '#F7F5F2' }}>
                              • {note}
                            </div>
                          ))}
                          <div className="flex gap-2 pt-4 border-t border-[#e8e5e1]">
                            <button className="py-2 px-4 border border-[#e8e5e1] rounded-lg text-13px hover:bg-[#F7F5F2] flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" /> Log Call
                            </button>
                            <button className="py-2 px-4 border border-[#e8e5e1] rounded-lg text-13px hover:bg-[#F7F5F2] flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5" /> Schedule
                            </button>
                          </div>
                        </div>
                      )}

                      {inlineTab === 'activity' && (
                        <div className="max-w-2xl space-y-3">
                          {selectedAdvisor.activity.map((item, idx) => (
                            <div key={idx} className="border-l-2 border-gray-300 pl-4 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <SentimentBadge tone={item.sentiment} />
                                <span className="text-11px text-gray-500">{item.time}</span>
                              </div>
                              <p className="text-13px text-gray-700">{item.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 bg-white rounded-xl border border-[#e8e5e1] p-6 flex flex-col items-center justify-center">
                    <div className="text-center space-y-6 max-w-md">
                      <div>
                        <h3 className="text-16px font-bold text-gray-900 mb-2">Portfolio Summary</h3>
                        <p className="text-13px text-gray-600">Overview of your advisor network</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#F7F5F2] rounded-lg p-4">
                          <p className="text-11px uppercase font-semibold text-[#888] mb-1">Total Advisors</p>
                          <p className="text-24px font-bold text-gray-900">{portfolioStats.totalAdvisors}</p>
                        </div>
                        <div className="bg-[#F7F5F2] rounded-lg p-4">
                          <p className="text-11px uppercase font-semibold text-[#888] mb-1">Total MRR</p>
                          <p className="text-24px font-bold text-gray-900">${(portfolioStats.totalMRRFiltered / 1000).toFixed(1)}K</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-11px uppercase font-semibold text-[#888] mb-3">Pulse Distribution</p>
                        <div className="h-8 bg-gray-100 rounded-full overflow-hidden flex">
                          {portfolioStats.pulseStats.Strong > 0 && (
                            <div className="bg-green-500 flex items-center justify-center text-white text-10px font-bold" style={{ width: `${(portfolioStats.pulseStats.Strong / portfolioStats.totalAdvisors) * 100}%` }} title="Strong">
                              {portfolioStats.totalAdvisors > 0 && portfolioStats.pulseStats.Strong > 0 ? portfolioStats.pulseStats.Strong : ''}
                            </div>
                          )}
                          {portfolioStats.pulseStats.Steady > 0 && (
                            <div className="bg-blue-500 flex items-center justify-center text-white text-10px font-bold" style={{ width: `${(portfolioStats.pulseStats.Steady / portfolioStats.totalAdvisors) * 100}%` }} title="Steady">
                              {portfolioStats.totalAdvisors > 0 && portfolioStats.pulseStats.Steady > 0 ? portfolioStats.pulseStats.Steady : ''}
                            </div>
                          )}
                          {portfolioStats.pulseStats.Fading > 0 && (
                            <div className="bg-yellow-500 flex items-center justify-center text-white text-10px font-bold" style={{ width: `${(portfolioStats.pulseStats.Fading / portfolioStats.totalAdvisors) * 100}%` }} title="Fading">
                              {portfolioStats.totalAdvisors > 0 && portfolioStats.pulseStats.Fading > 0 ? portfolioStats.pulseStats.Fading : ''}
                            </div>
                          )}
                          {portfolioStats.pulseStats.Flatline > 0 && (
                            <div className="bg-red-500 flex items-center justify-center text-white text-10px font-bold" style={{ width: `${(portfolioStats.pulseStats.Flatline / portfolioStats.totalAdvisors) * 100}%` }} title="Flatline">
                              {portfolioStats.totalAdvisors > 0 && portfolioStats.pulseStats.Flatline > 0 ? portfolioStats.pulseStats.Flatline : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-13px text-gray-600">Select an advisor from the list to view their full profile</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========== PIPELINE VIEW ========== */}
            {activeView === 'pipeline' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div
                    onClick={() => setPipelineKPIExpanded(pipelineKPIExpanded === 'total' ? null : 'total')}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <KPICard
                      label="Total Pipeline"
                      value={`$${(deals.reduce((sum, d) => sum + d.mrr, 0) / 1000).toFixed(1)}K`}
                      changeType="neutral"
                    />
                  </div>
                  <div
                    onClick={() => setPipelineKPIExpanded(pipelineKPIExpanded === 'weighted' ? null : 'weighted')}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <KPICard
                      label="Weighted Pipeline"
                      value={`$${(weightedPipeline / 1000).toFixed(1)}K`}
                      changeType="neutral"
                    />
                  </div>
                  <div
                    onClick={() => setPipelineKPIExpanded(pipelineKPIExpanded === 'closing' ? null : 'closing')}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <KPICard
                      label="Closing This Month"
                      value={closingThisMonth.length.toString()}
                      change={`$${(closingThisMonth.reduce((sum, d) => sum + d.mrr, 0) / 1000).toFixed(1)}K MRR`}
                      changeType="neutral"
                    />
                  </div>
                  <div
                    onClick={() => setPipelineKPIExpanded(pipelineKPIExpanded === 'stalled' ? null : 'stalled')}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <KPICard
                      label="Stalled Deals"
                      value={stalledDealsCount.toString()}
                      change={`$${(deals.filter(d => d.stage === 'Stalled').reduce((sum, d) => sum + d.mrr, 0) / 1000).toFixed(1)}K stuck`}
                      changeType="negative"
                    />
                  </div>
                </div>

                {pipelineKPIExpanded && (
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6 animate-in fade-in slide-in-from-top-2">
                    {pipelineKPIExpanded === 'total' && (
                      <div>
                        <h3 className="text-13px uppercase font-bold tracking-widest text-[#888] mb-4">Pipeline Breakdown by Stage</h3>
                        <div className="space-y-3">
                          {(['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'] as const).map(stage => {
                            const stageDealsMRR = deals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.mrr, 0);
                            return (
                              <div key={stage} className="flex items-center justify-between pb-2 border-b border-[#f0ede9] last:border-0">
                                <span className="text-13px text-gray-900">{stage}</span>
                                <span className="text-13px font-bold" style={{ color: '#157A6E' }}>${(stageDealsMRR / 1000).toFixed(1)}K</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {pipelineKPIExpanded === 'weighted' && (
                      <div>
                        <h3 className="text-13px uppercase font-bold tracking-widest text-[#888] mb-4">Top 5 Deals by Weighted Value</h3>
                        <div className="space-y-3">
                          {deals
                            .map(d => ({
                              ...d,
                              weight: STAGE_WEIGHTS.find(w => w.stage === d.stage)?.weight || 0,
                            }))
                            .sort((a, b) => (b.mrr * b.weight) - (a.mrr * a.weight))
                            .slice(0, 5)
                            .map((deal, idx) => {
                              const advisor = advisors.find(a => a.id === deal.advisorId);
                              return (
                                <div key={deal.id} className="flex items-center justify-between pb-2 border-b border-[#f0ede9] last:border-0">
                                  <div>
                                    <p className="text-13px font-medium text-gray-900">{deal.name}</p>
                                    <p className="text-11px text-gray-600">{advisor?.name}</p>
                                  </div>
                                  <span className="text-13px font-bold" style={{ color: '#157A6E' }}>${((deal.mrr * deal.weight) / 1000).toFixed(1)}K</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {pipelineKPIExpanded === 'closing' && (
                      <div>
                        <h3 className="text-13px uppercase font-bold tracking-widest text-[#888] mb-4">Deals Closing This Month</h3>
                        <div className="space-y-3">
                          {closingThisMonth.length === 0 ? (
                            <p className="text-13px text-gray-600">No deals closing this month</p>
                          ) : (
                            closingThisMonth.map((deal, idx) => {
                              const advisor = advisors.find(a => a.id === deal.advisorId);
                              return (
                                <div key={deal.id} className="flex items-center justify-between pb-2 border-b border-[#f0ede9] last:border-0">
                                  <div>
                                    <p className="text-13px font-medium text-gray-900">{deal.name}</p>
                                    <p className="text-11px text-gray-600">{advisor?.name} · {deal.closeDate}</p>
                                  </div>
                                  <span className="text-13px font-bold" style={{ color: '#157A6E' }}>${(deal.mrr / 1000).toFixed(1)}K</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {pipelineKPIExpanded === 'stalled' && (
                      <div>
                        <h3 className="text-13px uppercase font-bold tracking-widest text-[#888] mb-4">Stalled Deals</h3>
                        <div className="space-y-3">
                          {deals.filter(d => d.stage === 'Stalled').length === 0 ? (
                            <p className="text-13px text-gray-600">No stalled deals</p>
                          ) : (
                            deals.filter(d => d.stage === 'Stalled').map((deal, idx) => {
                              const advisor = advisors.find(a => a.id === deal.advisorId);
                              return (
                                <div key={deal.id} className="flex items-center justify-between pb-2 border-b border-[#f0ede9] last:border-0">
                                  <div>
                                    <p className="text-13px font-medium text-gray-900">{deal.name}</p>
                                    <p className="text-11px text-gray-600">{advisor?.name} · {deal.daysInStage}d stalled</p>
                                  </div>
                                  <span className="text-13px font-bold text-red-600">${(deal.mrr / 1000).toFixed(1)}K</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {stageTimelineMismatches.length > 0 && (
                  <div className="bg-white rounded-xl border border-[#e8e5e1]">
                    <div className="px-5 py-3.5 border-b border-[#f0ede9] border-l-4" style={{ borderLeftColor: '#ef4444' }}>
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Stage/Timeline Mismatches</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stageTimelineMismatches.map(deal => {
                          const advisor = advisors.find(a => a.id === deal.advisorId);
                          return (
                            <div key={deal.id} className="bg-white border border-[#e8e5e1] rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#ef4444' }}>
                              <p className="text-13px font-semibold text-gray-900">{deal.name}</p>
                              <p className="text-11px text-gray-600 mb-2">
                                <span
                                  className="cursor-pointer hover:underline"
                                  onClick={() => advisor && handleAdvisorClick(advisor.id)}
                                  style={{ color: '#157A6E' }}
                                >
                                  {advisor?.name}
                                </span>
                              </p>
                              <div className="space-y-1 text-11px">
                                <p className="flex items-center gap-1"><span className="font-medium">Stage:</span> {deal.stage} <AlertTriangle className="w-3 h-3" style={{ color: '#f59e0b' }} /> aggressive close date</p>
                                <p><span className="font-medium">Close Date:</span> {deal.closeDate}</p>
                                <p><span className="font-medium">Probability:</span> {deal.probability}%</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-[#e8e5e1]">
                  <div className="px-6 py-4 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Pipeline by Stage</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex gap-4 overflow-x-auto pb-4 flex-wrap">
                      {(['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'] as const).map(stage => {
                        const stageBorderColors: Record<string, string> = {
                          'Discovery': '#2563eb',
                          'Qualifying': '#4f46e5',
                          'Proposal': '#f59e0b',
                          'Negotiating': '#fb923c',
                          'Closed Won': '#16a34a',
                          'Stalled': '#ef4444',
                        };

                        const stageDeals = deals.filter(d => d.stage === stage);
                        const stageMRR = stageDeals.reduce((sum, d) => sum + d.mrr, 0);
                        const isExpanded = expandedStage === stage;

                        return (
                          <div key={stage} className="flex-1 min-w-[200px]">
                            <button
                              onClick={() => setExpandedStage(isExpanded ? null : stage)}
                              className="w-full bg-white border border-[#e8e5e1] rounded-xl p-4 mb-3 border-t-4 hover:shadow-md transition-shadow text-left"
                              style={{ borderTopColor: stageBorderColors[stage] }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-13px font-bold text-gray-900">{stage}</h3>
                                  <p className="text-13px font-semibold mt-1" style={{ color: '#157A6E' }}>
                                    ${(stageMRR / 1000).toFixed(1)}K MRR
                                  </p>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-11px font-semibold bg-gray-100 text-gray-700">
                                    {stageDeals.length}
                                  </span>
                                  {isExpanded ? <ChevronUp className="w-4 h-4 mt-2" /> : <ChevronDown className="w-4 h-4 mt-2" />}
                                </div>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="space-y-2">
                                {stageDeals.length === 0 ? (
                                  <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                                    <p className="text-11px text-gray-500">No deals in this stage</p>
                                  </div>
                                ) : (
                                  stageDeals.map(deal => {
                                    const advisor = advisors.find(a => a.id === deal.advisorId);
                                    return (
                                      <div
                                        key={deal.id}
                                        className="bg-white border border-[#e8e5e1] rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                                      >
                                        <h4 className="text-13px font-bold text-gray-900 mb-2">{deal.name}</h4>
                                        <p className="text-11px text-gray-600 mb-2">
                                          <span
                                            className="font-medium cursor-pointer hover:underline"
                                            onClick={() => advisor && handleAdvisorClick(advisor.id)}
                                            style={{ color: '#157A6E' }}
                                          >
                                            {advisor?.name || 'Unknown'}
                                          </span>
                                        </p>

                                        <div className="mb-2">
                                          <p className="text-11px text-gray-600">MRR</p>
                                          <p className="text-13px font-bold text-gray-900">${(deal.mrr / 1000).toFixed(1)}K</p>
                                        </div>

                                        <div className="mb-2">
                                          <DealHealthBadge health={deal.health} />
                                        </div>

                                        <div className={`px-2 py-1 rounded text-11px font-medium mb-2 inline-block ${getDaysInStageColor(deal.daysInStage)}`}>
                                          {deal.daysInStage}d in stage
                                        </div>

                                        <div className="mb-2">
                                          <div className="flex items-center justify-between mb-1">
                                            <p className="text-11px text-gray-600">Probability</p>
                                            <p className="text-11px font-semibold text-gray-700">{deal.probability}%</p>
                                          </div>
                                          <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div
                                              className="h-1.5 rounded-full transition-all"
                                              style={{ width: `${deal.probability}%`, backgroundColor: '#157A6E' }}
                                            />
                                          </div>
                                        </div>

                                        {deal.confidenceScore && (
                                          <div className="flex items-center gap-1">
                                            <p className="text-11px text-gray-600">Confidence:</p>
                                            <div
                                              className="px-2 py-0.5 rounded text-11px font-semibold text-white"
                                              style={{
                                                backgroundColor: deal.confidenceScore === 'High' ? '#16a34a' : deal.confidenceScore === 'Medium' ? '#f59e0b' : '#ef4444',
                                              }}
                                            >
                                              {deal.confidenceScore}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== STRATEGIC VIEW ========== */}
            {activeView === 'strategic' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Total Advisors</p>
                    <p className="text-28px font-bold text-gray-900">{advisors.length}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Portfolio MRR</p>
                    <p className="text-28px font-bold text-gray-900">${(totalMRR / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Retention Rate</p>
                    <p className="text-28px font-bold text-gray-900">94%</p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Avg MRR/Advisor</p>
                    <p className="text-28px font-bold text-gray-900">${((totalMRR / advisors.length) / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">% Climbing/Strong</p>
                    <p className="text-28px font-bold text-gray-900">{Math.round(((pulseSignals.Climbing + pulseSignals.Strong) / advisors.length) * 100)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-4">Advisor Quadrant</p>
                    <div className="relative h-96 bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 text-10px font-semibold text-gray-600">Low</div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 text-10px font-semibold text-gray-600">High</div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-2 text-10px font-semibold text-gray-600">Low MRR</div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-2 text-10px font-semibold text-gray-600">High MRR</div>

                      <div className="absolute inset-4 border-l border-b border-gray-300" />
                      <div className="absolute top-1/2 left-0 right-0 border-t border-gray-300 -translate-y-1/2" />

                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-9px font-semibold text-gray-500">Stars</div>
                      <div className="absolute top-2 right-2 text-9px font-semibold text-gray-500">Growth</div>
                      <div className="absolute bottom-2 left-2 text-9px font-semibold text-gray-500">Harvest</div>
                      <div className="absolute bottom-2 right-2 text-9px font-semibold text-gray-500">Watch</div>

                      {advisors.map(advisor => {
                        const engagementScore = calculateEngagementScore(advisor.pulse);
                        const maxEngagement = 100;
                        const engagementX = (engagementScore / maxEngagement) * 80 + 10;

                        const maxMRR = Math.max(...advisors.map(a => a.mrr));
                        const mrrY = 100 - ((advisor.mrr / maxMRR) * 80 + 10);

                        const tierColor = getTierColor(advisor.tier || 'other');

                        return (
                          <div
                            key={advisor.id}
                            onClick={() => handleAdvisorClick(advisor.id)}
                            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer hover:w-5 hover:h-5 hover:shadow-lg transition-all"
                            style={{
                              left: `${engagementX}%`,
                              top: `${mrrY}%`,
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: tierColor,
                            }}
                            title={`${advisor.name} - $${(advisor.mrr / 1000).toFixed(1)}K`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e8e5e1]">
                    <div className="px-6 py-4 border-b border-[#f0ede9]">
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Tier Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#f0ede9]">
                            <th className="px-6 py-3 text-left text-11px uppercase font-bold text-[#888]">Tier</th>
                            <th className="px-6 py-3 text-left text-11px uppercase font-bold text-[#888]">Count</th>
                            <th className="px-6 py-3 text-left text-11px uppercase font-bold text-[#888]">MRR</th>
                            <th className="px-6 py-3 text-left text-11px uppercase font-bold text-[#888]">Avg MRR</th>
                            <th className="px-6 py-3 text-left text-11px uppercase font-bold text-[#888]">Avg Engagement</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['top10', 'next20', 'other'].map((tier, idx) => {
                            const tierAdvisors = advisors.filter(a => a.tier === tier);
                            const tierMRR = tierAdvisors.reduce((sum, a) => sum + a.mrr, 0);
                            const avgMRR = tierAdvisors.length > 0 ? tierMRR / tierAdvisors.length : 0;
                            const tierLabels: Record<string, string> = {
                              'top10': 'Top 10',
                              'next20': 'Next 20',
                              'other': 'Other',
                            };

                            const strongCount = tierAdvisors.filter(a => a.pulse === 'Strong').length;
                            const steadyCount = tierAdvisors.filter(a => a.pulse === 'Steady').length;
                            const avgEngagementTier = tierAdvisors.length > 0
                              ? (strongCount * 90 + steadyCount * 60 + (tierAdvisors.length - strongCount - steadyCount) * 30) / tierAdvisors.length
                              : 0;

                            return (
                              <tr key={tier} className="border-b border-[#f0ede9] hover:bg-[#F7F5F2]">
                                <td className="px-6 py-3 text-13px font-bold text-gray-900">{tierLabels[tier]}</td>
                                <td className="px-6 py-3 text-13px font-medium text-gray-900">{tierAdvisors.length}</td>
                                <td className="px-6 py-3 text-13px font-medium text-gray-900">${(tierMRR / 1000).toFixed(1)}K</td>
                                <td className="px-6 py-3 text-13px font-medium text-gray-900">${(avgMRR / 1000).toFixed(1)}K</td>
                                <td className="px-6 py-3 text-13px font-medium text-gray-900">{Math.round(avgEngagementTier)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-4">Supplier Activity</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-13px">
                        <thead>
                          <tr className="border-b border-[#f0ede9]">
                            <th className="px-3 py-2 text-left text-11px uppercase font-bold text-[#888]">Advisor</th>
                            <th className="px-3 py-2 text-center text-11px uppercase font-bold text-[#888]">Quotes</th>
                            <th className="px-3 py-2 text-center text-11px uppercase font-bold text-[#888]">Won</th>
                            <th className="px-3 py-2 text-center text-11px uppercase font-bold text-[#888]">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {advisors.slice(0, 8).map((advisor, idx) => {
                            const quotesData = calculateQuotesData(advisor);
                            const rate = quotesData.submitted > 0 ? Math.round((quotesData.won / quotesData.submitted) * 100) : 0;
                            return (
                              <tr key={advisor.id} className="border-b border-[#f0ede9] hover:bg-[#F7F5F2]">
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => handleAdvisorClick(advisor.id)}
                                    className="text-[#157A6E] font-medium cursor-pointer hover:underline"
                                  >
                                    {advisor.name}
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-center font-medium text-gray-900">{quotesData.submitted}</td>
                                <td className="px-3 py-2 text-center font-medium text-gray-900">{quotesData.won}</td>
                                <td className="px-3 py-2 text-center font-medium text-gray-900">{rate}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-4">Cohort Trajectory</p>
                    <div className="space-y-4">
                      {['Q4 2025', 'Q1 2026'].map(quarter => (
                        <div key={quarter}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-13px font-medium text-gray-900">{quarter}</span>
                            <span className="text-11px text-gray-600">${(totalMRR / 1000).toFixed(1)}K</span>
                          </div>
                          <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="flex-1 bg-[#16a34a]" style={{ width: '35%' }} title="Strong" />
                            <div className="flex-1 bg-[#2563eb]" style={{ width: '35%' }} title="Steady" />
                            <div className="flex-1 bg-[#f59e0b]" style={{ width: '20%' }} title="Fading" />
                            <div className="flex-1 bg-[#ef4444]" style={{ width: '10%' }} title="Flatline" />
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-3 mt-4 text-11px">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16a34a' }} />
                          <span>Strong</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2563eb' }} />
                          <span>Steady</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                          <span>Fading</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                          <span>Flatline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#e8e5e1] p-6">
                  <p className="text-10px uppercase font-semibold text-[#888] mb-4">AI-Recommended Next Moves</p>
                  <ol className="space-y-3">
                    {[
                      'Re-engage Tom Bradley this week (fading pulse, $45K at risk)',
                      'Expand Sarah Chen\'s portfolio to Enterprise tier (strong trajectory)',
                      'Schedule friction review call with Nina Patel (quoting delays)',
                      'Executive sponsorship for $120K deal (in negotiating 28 days)',
                      'Personal outreach to 3 flatline advisors (preventive retention)',
                    ].map((move, idx) => (
                      <li key={idx} className="flex gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-11px font-bold"
                          style={{ backgroundColor: '#157A6E' }}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-13px text-gray-700 pt-0.5">{move}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>

          <AIChat role="manager" selectedAdvisor={selectedAdvisor} />
        </div>
      </div>

      <AdvisorPanel
        advisor={selectedAdvisor}
        deals={deals}
        isOpen={panelOpen && activeView !== 'relationships'}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}
