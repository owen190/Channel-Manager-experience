'use client';

import { useState, useMemo } from 'react';
import { Clock, AlertTriangle, ChevronDown, ChevronRight, ArrowLeft, MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays, Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, X } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AIChat } from '@/components/shared/AIChat';
import { KPICard } from '@/components/shared/KPICard';
import { MorningBriefing } from '@/components/shared/MorningBriefing';
import { AdvisorTable } from '@/components/shared/AdvisorTable';
import { AdvisorPanel } from '@/components/shared/AdvisorPanel';
import { DealHealthBadge } from '@/components/shared/DealHealthBadge';
import { PulseBadge } from '@/components/shared/PulseBadge';
import { TrajectoryBadge } from '@/components/shared/TrajectoryBadge';
import { SentimentBadge } from '@/components/shared/SentimentBadge';
import { FrictionBadge } from '@/components/shared/FrictionBadge';
import { TierBadge } from '@/components/shared/TierBadge';
import { NAV_ITEMS_LEADER, QUARTER_END, DAYS_REMAINING, STAGE_WEIGHTS } from '@/lib/constants';
import { EngagementScore } from '@/lib/types';
import { reps } from '@/lib/data/reps';
import { advisors } from '@/lib/data/advisors';
import { deals } from '@/lib/data/deals';
import { leaderBriefing } from '@/lib/data/briefings';
import { Advisor, Nudge, Deal, DealStage, OverrideRequest, ForecastHistoryEntry } from '@/lib/types';

function EngLabel({ score }: { score: EngagementScore }) {
  const colors: Record<EngagementScore, string> = {
    Strong: 'bg-green-100 text-green-800',
    Steady: 'bg-amber-100 text-amber-800',
    Fading: 'bg-red-100 text-red-800',
  };
  return <span className={`px-2 py-0.5 rounded-full text-11px font-semibold ${colors[score]}`}>{score}</span>;
}

export default function LeaderDashboard() {
  const [activeView, setActiveViewRaw] = useState('command-center');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Clear transient state when switching views
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
  const [expandedReps, setExpandedReps] = useState<string[]>([]);
  const [inlineTab, setInlineTab] = useState<'overview' | 'personal' | 'deals' | 'notes' | 'activity'>('overview');
  const [relationshipsView, setRelationshipsView] = useState<'list' | 'detail'>('list');
  const [expandedKPIPanel, setExpandedKPIPanel] = useState<string | null>(null);
  const [expandedForecastRep, setExpandedForecastRep] = useState<string | null>(null);
  const [expandedHistoricalQuarter, setExpandedHistoricalQuarter] = useState<string | null>(null);
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [expandedStage, setExpandedStage] = useState<DealStage | null>(null);
  const [expandedPipelineRep, setExpandedPipelineRep] = useState<string | null>(null);

  const userName = 'Priya M.';
  const userInitials = 'PM';

  const teamMRR = reps.reduce((sum, rep) => sum + rep.managedMRR, 0);
  const prevTeamMRR = teamMRR * 0.942;
  const mrrChange = ((teamMRR - prevTeamMRR) / prevTeamMRR * 100).toFixed(1);

  const teamTarget = reps.reduce((sum, rep) => sum + rep.quotaTarget, 0);
  const teamCommit = reps.reduce((sum, rep) => sum + rep.currentCommit, 0);
  const commitGap = teamTarget - teamCommit;
  const commitPercentage = Math.round((teamCommit / teamTarget) * 100);

  const allDeals = deals;
  const teamPipeline = allDeals.reduce((sum, deal) => sum + deal.mrr, 0);
  const weightedPipeline = allDeals.reduce((sum, deal) => {
    const stageWeight = STAGE_WEIGHTS.find(sw => sw.stage === deal.stage)?.weight || 0;
    return sum + (deal.mrr * stageWeight);
  }, 0);

  const activeDealCount = allDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled').length;
  const healthyDeals = allDeals.filter(d => d.health === 'Healthy').length;
  const atRiskDeals = allDeals.filter(d => d.health === 'At Risk' || d.health === 'Stalled').length;
  const healthyPercentage = Math.round((healthyDeals / allDeals.length) * 100);
  const atRiskPercentage = Math.round((atRiskDeals / allDeals.length) * 100);
  const stalledDealsCount = allDeals.filter(d => d.stage === 'Stalled').length;

  const historicalForecast: ForecastHistoryEntry[] = [
    { quarter: 'Q2 2025', target: 1100000, actual: 1050000, percentage: 95 },
    { quarter: 'Q3 2025', target: 1150000, actual: 1080000, percentage: 94 },
    { quarter: 'Q4 2025', target: 1200000, actual: 1140000, percentage: 95 },
    { quarter: 'Q1 2026', target: 1200000, actual: teamMRR, percentage: commitPercentage }
  ];

  const overrideRequests: OverrideRequest[] = [
    {
      dealId: 'deal-5',
      dealName: 'FiberFirst Capacity Planning Initiative',
      repName: 'Natasha Volkov',
      advisorName: 'James Wu',
      mrr: 7400,
      reason: 'Deal in early stage but close date set aggressively - technical evaluation still pending',
      status: 'pending',
      requestDate: '2026-03-25'
    },
    {
      dealId: 'deal-6',
      dealName: 'FiberFirst Signal Quality Improvement',
      repName: 'Natasha Volkov',
      advisorName: 'James Wu',
      mrr: 4200,
      reason: 'Aggressive close date given stage - still in discovery phase',
      status: 'pending',
      requestDate: '2026-03-24'
    }
  ];

  const frictionInsights = [
    { issue: 'Quoting >72hrs', count: 14, severity: 'HIGH' as const },
    { issue: 'Install timeline misses', count: 8, severity: 'MODERATE' as const },
    { issue: 'Post-sale support gaps', count: 6, severity: 'MODERATE' as const },
    { issue: 'Training complaints', count: 3, severity: 'LOW' as const }
  ];

  const competitiveLandscape = [
    { competitor: 'Lumen', dealCount: 6, pipelineAtRisk: 82000 },
    { competitor: 'Comcast Business', dealCount: 4, pipelineAtRisk: 45000 },
    { competitor: 'Spectrum Enterprise', dealCount: 3, pipelineAtRisk: 28000 }
  ];

  const diagnosticMatrix = [
    { pattern: 'High friction + stalled', repsAffected: 'Natasha, Thomas', impact: '$70K risk', action: 'Escalate quoting SLA' },
    { pattern: 'Over-capacity', repsAffected: 'Javier', impact: 'Burnout risk', action: 'Redistribute 15+ partners' },
    { pattern: 'Under-loaded', repsAffected: 'Thomas', impact: 'Lost opportunity', action: 'Assign 10 from Javier' },
    { pattern: 'Forecast gap widening', repsAffected: 'Marcus, Natasha', impact: '$89K gap', action: 'Weekly commit reviews' }
  ];

  const stageTimelineMismatches = allDeals.filter(d => {
    if (d.stage === 'Discovery' && d.daysInStage > 25) return true;
    if (d.stage === 'Qualifying' && d.daysInStage > 20) return true;
    if (d.stage === 'Proposal' && d.daysInStage > 15) return true;
    return false;
  });

  const nudges: Nudge[] = [
    { id: 'nudge-1', title: '5 days left in Q1', description: 'Team needs $127K to hit target', time: 'now', type: 'quarter', priority: 'critical' },
    { id: 'nudge-2', title: 'Override Approval Pending', description: '2 deals waiting for decision', time: 'now', type: 'override', priority: 'high' },
    { id: 'nudge-3', title: 'Capacity Crisis', description: 'Ernie at 57/30 partners', time: '2h', type: 'capacity', priority: 'critical' }
  ];

  const toggleRepExpansion = (repId: string) => {
    setExpandedReps(prev =>
      prev.includes(repId) ? prev.filter(id => id !== repId) : [...prev, repId]
    );
  };

  const formatCurrency = (num: number): string => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num}`;
  };

  const handleAdvisorClick = (advisorId: string) => {
    const advisor = advisors.find(a => a.id === advisorId);
    if (advisor) {
      setSelectedAdvisor(advisor);
      if (activeView === 'relationships') {
        setRelationshipsView('detail');
      } else {
        setPanelOpen(true);
      }
    }
  };

  const getDaysInStageColor = (days: number): string => {
    if (days > 20) return 'bg-red-100 text-red-700';
    if (days > 10) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  const getEngagementScore = (pulse: string): number => {
    const scoreMap: Record<string, number> = {
      'Strong': 90,
      'Steady': 60,
      'Rising': 75,
      'Fading': 30,
      'Flatline': 10,
    };
    return scoreMap[pulse] || 50;
  };

  const filteredAdvisors = useMemo(() => {
    if (relationshipFilter === 'All') return advisors;
    if (relationshipFilter === 'At Risk') return advisors.filter(a => a.pulse === 'Fading' || a.pulse === 'Flatline');
    if (relationshipFilter === 'Top 10') return advisors.filter(a => a.tier === 'top10');
    if (relationshipFilter === 'New') return advisors.filter(a => a.connectedSince > '2025-09-01');
    return advisors;
  }, [relationshipFilter]);

  const portfolioSummary = useMemo(() => {
    const summary = {
      totalAdvisors: filteredAdvisors.length,
      totalMRR: filteredAdvisors.reduce((sum, a) => sum + a.mrr, 0),
      strongCount: filteredAdvisors.filter(a => a.pulse === 'Strong').length,
      steadyCount: filteredAdvisors.filter(a => a.pulse === 'Steady').length,
      fadingCount: filteredAdvisors.filter(a => a.pulse === 'Fading').length,
      flatlineCount: filteredAdvisors.filter(a => a.pulse === 'Flatline').length,
      risingCount: filteredAdvisors.filter(a => a.pulse === 'Rising').length,
    };
    return summary;
  }, [filteredAdvisors]);

  const stageDistribution = useMemo(() => {
    const stages: Record<DealStage, number> = {
      'Discovery': 0,
      'Qualifying': 0,
      'Proposal': 0,
      'Negotiating': 0,
      'Closed Won': 0,
      'Stalled': 0
    };
    allDeals.forEach(deal => {
      stages[deal.stage]++;
    });
    return stages;
  }, []);

  const repPipelineData = useMemo(() => {
    return reps.map(rep => {
      const repDeals = allDeals.filter(d => d.repId === rep.id);
      const repPipeline = repDeals.reduce((sum, d) => sum + d.mrr, 0);
      const stageBreakdown: Record<DealStage, number> = {
        'Discovery': 0,
        'Qualifying': 0,
        'Proposal': 0,
        'Negotiating': 0,
        'Closed Won': 0,
        'Stalled': 0
      };
      repDeals.forEach(deal => {
        stageBreakdown[deal.stage]++;
      });
      return {
        repId: rep.id,
        repName: rep.name,
        totalPipeline: repPipeline,
        dealCount: repDeals.length,
        stageBreakdown
      };
    });
  }, []);

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F7F5F2' }}>
      <Sidebar
        items={NAV_ITEMS_LEADER}
        activeView={activeView}
        onViewChange={setActiveView}
        role="leader"
        userName={userName}
        userInitials={userInitials}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          nudges={nudges}
          userName={userName}
          userInitials={userInitials}
          pageTitle={activeView === 'command-center' ? 'Command Center' : activeView === 'forecast' ? 'Forecast' : activeView === 'team' ? 'Team' : activeView === 'relationships' ? 'Relationships' : activeView === 'pipeline' ? 'Pipeline' : 'Intelligence'}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">

            {activeView === 'command-center' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #157A6E 0%, #0f5250 100%)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-widest opacity-90">Q1 2026</p>
                      <h2 className="text-3xl font-bold mt-2">Q1 Forecast: {formatCurrency(teamCommit)} of {formatCurrency(teamTarget)}</h2>
                      <p className="text-sm mt-3 opacity-90">{formatCurrency(commitGap)} gap to target · {DAYS_REMAINING} days remaining</p>
                    </div>
                    <div className="flex gap-12 text-right">
                      <div>
                        <p className="text-sm opacity-80">Reps</p>
                        <p className="text-3xl font-bold">6</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-80">Active Deals</p>
                        <p className="text-3xl font-bold">{activeDealCount}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-80">Team MRR</p>
                        <p className="text-3xl font-bold">{formatCurrency(teamMRR)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div
                    className="bg-white border border-[#e8e5e1] rounded-[10px] p-5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'team-mrr' ? null : 'team-mrr')}
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Team MRR</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(teamMRR)}</p>
                    <p className="text-11px text-gray-600 mt-1">+{mrrChange}% growth</p>
                  </div>
                  <div
                    className="bg-white border border-[#e8e5e1] rounded-[10px] p-5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'avg-deal' ? null : 'avg-deal')}
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Avg Deal Size</p>
                    <p className="text-2xl font-bold text-gray-900">$45.2K</p>
                    <p className="text-11px text-gray-600 mt-1">+$2.1K vs last month</p>
                  </div>
                  <div
                    className="bg-white border border-[#e8e5e1] rounded-[10px] p-5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'win-rate' ? null : 'win-rate')}
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Win Rate</p>
                    <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>68%</p>
                    <p className="text-11px text-gray-600 mt-1">Industry avg: 62%</p>
                  </div>
                  <div
                    className="bg-white border border-[#e8e5e1] rounded-[10px] p-5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'cycle-time' ? null : 'cycle-time')}
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Cycle Time</p>
                    <p className="text-2xl font-bold text-gray-900">42 days</p>
                    <p className="text-11px text-gray-600 mt-1">-3 days vs Q4</p>
                  </div>
                  <div
                    className="bg-white border border-[#e8e5e1] rounded-[10px] p-5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'at-risk' ? null : 'at-risk')}
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">At Risk $</p>
                    <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>$182K</p>
                    <p className="text-11px text-gray-600 mt-1">15% of pipeline</p>
                  </div>
                </div>

                {expandedKPIPanel && (
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    {expandedKPIPanel === 'team-mrr' && (
                      <div>
                        <h4 className="text-13px font-bold text-gray-900 mb-4">Team MRR Breakdown by Rep</h4>
                        <div className="space-y-2">
                          {reps.map(rep => (
                            <div key={rep.id} className="flex items-center justify-between p-3 bg-[#F7F5F2] rounded-lg">
                              <span className="text-13px font-medium text-gray-900">{rep.name}</span>
                              <span className="text-13px font-bold" style={{ color: '#157A6E' }}>{formatCurrency(rep.managedMRR)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {expandedKPIPanel === 'avg-deal' && (
                      <div>
                        <h4 className="text-13px font-bold text-gray-900 mb-4">Top 5 Deals by Size</h4>
                        <div className="space-y-2">
                          {allDeals
                            .sort((a, b) => b.mrr - a.mrr)
                            .slice(0, 5)
                            .map((deal, idx) => (
                              <div key={deal.id} className="flex items-center justify-between p-3 bg-[#F7F5F2] rounded-lg">
                                <div className="flex-1">
                                  <span className="text-13px font-medium text-gray-900">{deal.name}</span>
                                  <p className="text-11px text-gray-600">{advisors.find(a => a.id === deal.advisorId)?.name}</p>
                                </div>
                                <span className="text-13px font-bold" style={{ color: '#157A6E' }}>{formatCurrency(deal.mrr)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {expandedKPIPanel === 'win-rate' && (
                      <div>
                        <h4 className="text-13px font-bold text-gray-900 mb-4">Win vs Loss by Rep</h4>
                        <div className="space-y-3">
                          {reps.map(rep => {
                            const repDeals = allDeals.filter(d => d.repId === rep.id);
                            const wins = repDeals.filter(d => d.stage === 'Closed Won').length;
                            const losses = repDeals.filter(d => d.stage === 'Stalled').length;
                            const total = wins + losses || 1;
                            const winRate = Math.round((wins / total) * 100);
                            return (
                              <div key={rep.id} className="p-3 bg-[#F7F5F2] rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-13px font-medium text-gray-900">{rep.name}</span>
                                  <span className="text-12px font-bold" style={{ color: '#16a34a' }}>{winRate}%</span>
                                </div>
                                <div className="flex gap-2 text-11px text-gray-600">
                                  <span>Wins: {wins}</span>
                                  <span>Losses: {losses}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {expandedKPIPanel === 'cycle-time' && (
                      <div>
                        <h4 className="text-13px font-bold text-gray-900 mb-4">Cycle Time by Rep</h4>
                        <div className="space-y-2">
                          {reps.map(rep => {
                            const repDeals = allDeals.filter(d => d.repId === rep.id && (d.stage === 'Closed Won' || d.stage === 'Stalled'));
                            const avgCycleTime = repDeals.length > 0
                              ? Math.round(repDeals.reduce((sum, d) => sum + d.daysInStage, 0) / repDeals.length)
                              : 0;
                            return (
                              <div key={rep.id} className="flex items-center justify-between p-3 bg-[#F7F5F2] rounded-lg">
                                <span className="text-13px font-medium text-gray-900">{rep.name}</span>
                                <span className="text-13px font-bold text-gray-900">{avgCycleTime} days</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {expandedKPIPanel === 'at-risk' && (
                      <div>
                        <h4 className="text-13px font-bold text-gray-900 mb-4">At-Risk Deals</h4>
                        <div className="space-y-2">
                          {allDeals
                            .filter(d => d.health === 'At Risk' || d.health === 'Stalled')
                            .map(deal => {
                              const rep = reps.find(r => r.id === deal.repId);
                              const advisor = advisors.find(a => a.id === deal.advisorId);
                              return (
                                <div key={deal.id} className="p-3 bg-[#F7F5F2] rounded-lg border-l-4" style={{ borderLeftColor: '#ef4444' }}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-13px font-medium text-gray-900">{deal.name}</span>
                                    <span className="text-12px font-bold" style={{ color: '#ef4444' }}>{formatCurrency(deal.mrr)}</span>
                                  </div>
                                  <p className="text-11px text-gray-600">{rep?.name} · {advisor?.name}</p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white border border-[#e8e5e1] rounded-[10px]">
                    <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Team Performance</h3>
                    </div>
                    <div className="divide-y divide-[#f0ede9]">
                      {reps.map((rep) => {
                        const quotaPercentage = Math.round((rep.currentCommit / rep.quotaTarget) * 100);
                        return (
                          <div key={rep.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#F7F5F2]/50 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-[#157A6E] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {rep.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-13px font-semibold text-gray-900">{rep.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-1.5 flex-1 max-w-[120px] bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full"
                                    style={{
                                      width: `${Math.min(quotaPercentage, 100)}%`,
                                      backgroundColor: quotaPercentage >= 90 ? '#16a34a' : quotaPercentage >= 80 ? '#f59e0b' : '#ef4444',
                                    }}
                                  />
                                </div>
                                <span className="text-11px text-gray-600">{quotaPercentage}%</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-13px font-bold" style={{ color: '#157A6E' }}>{formatCurrency(rep.managedMRR)}</p>
                              <p className="text-11px text-gray-500">{rep.activeDeals} active</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                    <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Coaching Signals</h3>
                    </div>
                    <div className="divide-y divide-[#f0ede9]">
                      <div className="px-5 py-4 flex items-start gap-3 hover:bg-[#F7F5F2]/50 transition-colors">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                        <div className="min-w-0">
                          <p className="text-13px font-semibold text-gray-900">Natasha over capacity</p>
                          <p className="text-11px text-gray-600 mt-0.5">57/30 partners</p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-10px font-semibold bg-red-100 text-red-700 rounded">URGENT</span>
                        </div>
                      </div>
                      <div className="px-5 py-4 flex items-start gap-3 hover:bg-[#F7F5F2]/50 transition-colors">
                        <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                        <div className="min-w-0">
                          <p className="text-13px font-semibold text-gray-900">Marcus cycle time</p>
                          <p className="text-11px text-gray-600 mt-0.5">+8 days above avg</p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-10px font-semibold bg-amber-100 text-amber-700 rounded">WATCH</span>
                        </div>
                      </div>
                      <div className="px-5 py-4 flex items-start gap-3 hover:bg-[#F7F5F2]/50 transition-colors">
                        <Target className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }} />
                        <div className="min-w-0">
                          <p className="text-13px font-semibold text-gray-900">Thomas on track</p>
                          <p className="text-11px text-gray-600 mt-0.5">92% to quota goal</p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-10px font-semibold bg-green-100 text-green-700 rounded">STRONG</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Forecast by Rep</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F7F5F2]">
                        <tr className="border-b border-[#e8e5e1]">
                          <th className="px-5 py-3 text-left text-11px font-semibold text-gray-700 uppercase">Rep</th>
                          <th className="px-5 py-3 text-right text-11px font-semibold text-gray-700 uppercase">Quota</th>
                          <th className="px-5 py-3 text-right text-11px font-semibold text-gray-700 uppercase">Committed</th>
                          <th className="px-5 py-3 text-right text-11px font-semibold text-gray-700 uppercase">Best Case</th>
                          <th className="px-5 py-3 text-right text-11px font-semibold text-gray-700 uppercase">Gap</th>
                          <th className="px-5 py-3 text-left text-11px font-semibold text-gray-700 uppercase">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reps.map((rep) => {
                          const quotaPercentage = Math.round((rep.currentCommit / rep.quotaTarget) * 100);
                          return (
                            <tr
                              key={rep.id}
                              className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]/30 transition-colors cursor-pointer"
                              onClick={() => setExpandedForecastRep(expandedForecastRep === rep.id ? null : rep.id)}
                            >
                              <td className="px-5 py-3 text-13px font-semibold text-gray-900">{rep.name}</td>
                              <td className="px-5 py-3 text-right text-13px text-gray-700">{formatCurrency(rep.quotaTarget)}</td>
                              <td className="px-5 py-3 text-right text-13px font-semibold text-gray-900">{formatCurrency(rep.currentCommit)}</td>
                              <td className="px-5 py-3 text-right text-13px text-gray-700">{formatCurrency(rep.quotaTarget * 1.1)}</td>
                              <td className="px-5 py-3 text-right text-13px text-gray-700">{formatCurrency(rep.quotaTarget - rep.currentCommit)}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full"
                                      style={{
                                        width: `${Math.min(quotaPercentage, 100)}%`,
                                        backgroundColor: quotaPercentage >= 90 ? '#16a34a' : quotaPercentage >= 80 ? '#f59e0b' : '#ef4444',
                                      }}
                                    />
                                  </div>
                                  <span className="text-11px text-gray-600 w-8 text-right">{quotaPercentage}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {expandedForecastRep && (
                    <div className="px-5 py-4 border-t border-[#f0ede9] bg-[#F7F5F2]">
                      <h4 className="text-13px font-bold text-gray-900 mb-3">Deals for {reps.find(r => r.id === expandedForecastRep)?.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {allDeals
                          .filter(d => d.repId === expandedForecastRep)
                          .map(deal => {
                            const advisor = advisors.find(a => a.id === deal.advisorId);
                            return (
                              <div key={deal.id} className="p-3 bg-white rounded-lg border border-[#e8e5e1]">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-13px font-semibold text-gray-900">{deal.name}</p>
                                    <p className="text-11px text-gray-600">{advisor?.name}</p>
                                    <p className="text-11px text-gray-600 mt-1">{deal.stage}</p>
                                  </div>
                                  <span className="text-13px font-bold" style={{ color: '#157A6E' }}>{formatCurrency(deal.mrr)}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeView === 'forecast' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Commit vs Target Tracker</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-6 mb-6">
                      <div>
                        <p className="text-10px text-gray-600 uppercase mb-1">Target</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(teamTarget)}</p>
                      </div>
                      <div>
                        <p className="text-10px text-gray-600 uppercase mb-1">Current</p>
                        <p className="text-lg font-bold" style={{ color: '#157A6E' }}>{formatCurrency(teamCommit)}</p>
                      </div>
                      <div>
                        <p className="text-10px text-gray-600 uppercase mb-1">Gap</p>
                        <p className="text-lg font-bold" style={{ color: '#ef4444' }}>{formatCurrency(commitGap)}</p>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${Math.min((teamCommit / teamTarget) * 100, 100)}%`, backgroundColor: '#157A6E' }}
                      />
                    </div>
                    <p className="text-11px text-gray-600 mt-2">{commitPercentage}% to target</p>
                  </div>
                </div>

                {overrideRequests.length > 0 && (
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                    <div className="px-5 py-3.5 border-b border-[#f0ede9] border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Pending Override Requests</h3>
                    </div>
                    <div className="divide-y divide-[#e8e5e1]">
                      {overrideRequests.map((req) => (
                        <div key={req.dealId} className="px-5 py-4 flex items-center justify-between hover:bg-[#F7F5F2]/30 transition-colors">
                          <div>
                            <p className="text-13px font-semibold text-gray-900">{req.dealName}</p>
                            <p className="text-11px text-gray-600 mt-0.5">{req.repName} · {req.advisorName} · {formatCurrency(req.mrr)}/mo</p>
                            <p className="text-11px text-gray-500 mt-1">{req.reason}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => alert(`Override approved for ${req.dealName}`)} className="px-3 py-1.5 text-11px font-semibold bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">Approve</button>
                            <button onClick={() => alert(`Override denied for ${req.dealName}`)} className="px-3 py-1.5 text-11px font-semibold bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">Deny</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Historical Forecast Accuracy</h3>
                  </div>
                  <div className="divide-y divide-[#e8e5e1]">
                    {historicalForecast.map((item) => (
                      <div key={item.quarter}>
                        <div
                          className="px-5 py-4 flex items-center justify-between hover:bg-[#F7F5F2]/30 cursor-pointer transition-colors"
                          onClick={() => setExpandedHistoricalQuarter(expandedHistoricalQuarter === item.quarter ? null : item.quarter)}
                        >
                          <div>
                            <p className="text-13px font-semibold text-gray-900">{item.quarter}</p>
                            <p className="text-11px text-gray-600">Target: {formatCurrency(item.target)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-13px font-semibold text-gray-900">{formatCurrency(item.actual)}</p>
                            <p className="text-11px" style={{ color: item.percentage >= 90 ? '#16a34a' : '#f59e0b' }}>{item.percentage}% accuracy</p>
                          </div>
                        </div>
                        {expandedHistoricalQuarter === item.quarter && (
                          <div className="px-5 py-4 bg-[#F7F5F2] border-t border-[#e8e5e1]">
                            <div className="grid grid-cols-2 gap-4 max-w-md">
                              <div>
                                <p className="text-11px text-gray-600 mb-1">Target Revenue</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(item.target)}</p>
                              </div>
                              <div>
                                <p className="text-11px text-gray-600 mb-1">Actual Revenue</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(item.actual)}</p>
                              </div>
                              <div>
                                <p className="text-11px text-gray-600 mb-1">Variance</p>
                                <p className="text-lg font-bold" style={{ color: item.actual >= item.target ? '#16a34a' : '#f59e0b' }}>
                                  {formatCurrency(item.actual - item.target)}
                                </p>
                              </div>
                              <div>
                                <p className="text-11px text-gray-600 mb-1">Accuracy %</p>
                                <p className="text-lg font-bold" style={{ color: item.percentage >= 90 ? '#16a34a' : '#f59e0b' }}>
                                  {item.percentage}%
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'team' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 gap-4">
                  {reps.map((rep) => {
                    const repDeals = allDeals.filter(d => d.repId === rep.id);
                    const isExpanded = expandedReps.includes(rep.id);
                    const quotaPercentage = Math.round((rep.currentCommit / rep.quotaTarget) * 100);
                    const repAdvisors = advisors.filter(a => repDeals.some(d => d.advisorId === a.id));
                    const winRate = (() => {
                      const wins = repDeals.filter(d => d.stage === 'Closed Won').length;
                      const losses = repDeals.filter(d => d.stage === 'Stalled').length;
                      const total = wins + losses || 1;
                      return Math.round((wins / total) * 100);
                    })();
                    const avgCycleTime = (() => {
                      const completedDeals = repDeals.filter(d => d.stage === 'Closed Won' || d.stage === 'Stalled');
                      if (completedDeals.length === 0) return 0;
                      return Math.round(completedDeals.reduce((sum, d) => sum + d.daysInStage, 0) / completedDeals.length);
                    })();
                    const capacityUtilization = (() => {
                      if (rep.partnerCapacity === 0) return 0;
                      return Math.round((rep.partnerCount / rep.partnerCapacity) * 100);
                    })();

                    return (
                      <div key={rep.id} className="bg-white border border-[#e8e5e1] rounded-[10px]">
                        <div
                          className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[#F7F5F2]/30 transition-colors"
                          onClick={() => toggleRepExpansion(rep.id)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 rounded-full bg-[#157A6E] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {rep.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1">
                              <p className="text-13px font-semibold text-gray-900">{rep.name}</p>
                              <p className="text-11px text-gray-600">{rep.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-13px font-bold" style={{ color: '#157A6E' }}>{formatCurrency(rep.managedMRR)}</p>
                              <p className="text-11px text-gray-500">{quotaPercentage}% quota</p>
                            </div>
                            <div className="text-right">
                              <p className="text-13px font-semibold text-gray-900">{rep.partnerCount}/{rep.partnerCapacity}</p>
                              <p className="text-11px text-gray-500">partners</p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-5 py-4 border-t border-[#e8e5e1] space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                                <p className="text-11px text-gray-600 mb-1">Win Rate</p>
                                <p className="text-lg font-bold text-gray-900">{winRate}%</p>
                              </div>
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                                <p className="text-11px text-gray-600 mb-1">Avg Cycle Time</p>
                                <p className="text-lg font-bold text-gray-900">{avgCycleTime} days</p>
                              </div>
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                                <p className="text-11px text-gray-600 mb-1">Capacity Utilization</p>
                                <p className="text-lg font-bold text-gray-900">{capacityUtilization}%</p>
                              </div>
                            </div>

                            {repAdvisors.length > 0 && (
                              <div className="border-t border-[#e8e5e1] pt-4">
                                <h4 className="text-12px uppercase font-bold tracking-widest text-[#888] mb-3">Advisor Quadrant</h4>
                                <div className="relative w-full h-[250px] bg-[#F7F5F2] rounded-lg p-4 flex items-end justify-start" style={{ border: '1px solid #e8e5e1' }}>
                                  <svg className="absolute inset-0 w-full h-full" style={{ color: '#d1d5db' }}>
                                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="1" strokeDasharray="4" />
                                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="4" />
                                  </svg>
                                  <div className="absolute top-1 left-2 text-10px text-gray-500 font-semibold">Stars</div>
                                  <div className="absolute top-1 right-2 text-10px text-gray-500 font-semibold">Growth</div>
                                  <div className="absolute bottom-1 left-2 text-10px text-gray-500 font-semibold">Watch</div>
                                  <div className="absolute bottom-1 right-2 text-10px text-gray-500 font-semibold">Harvest</div>

                                  {repAdvisors.map(advisor => {
                                    const engagementScore = getEngagementScore(advisor.pulse);
                                    const mrrMax = Math.max(...repAdvisors.map(a => a.mrr), 500000);
                                    const xPercent = (engagementScore / 100) * 100;
                                    const yPercent = (advisor.mrr / mrrMax) * 100;
                                    const colorMap: Record<string, string> = {
                                      'Strategic': '#157A6E',
                                      'Key': '#f59e0b',
                                      'Growth': '#16a34a',
                                      'Emerging': '#8b5cf6'
                                    };
                                    const color = colorMap[advisor.tier] || '#6b7280';
                                    return (
                                      <div
                                        key={advisor.id}
                                        className="absolute w-5 h-5 rounded-full flex items-center justify-center cursor-pointer hover:scale-125 transition-transform"
                                        style={{
                                          left: `${xPercent}%`,
                                          bottom: `${yPercent}%`,
                                          backgroundColor: color,
                                          transform: 'translate(-50%, 50%)',
                                        }}
                                        title={`${advisor.name} (${advisor.pulse})`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="border-t border-[#e8e5e1] pt-4">
                              <h4 className="text-12px uppercase font-bold tracking-widest text-[#888] mb-3">Top 3 Advisors by MRR</h4>
                              <div className="space-y-2">
                                {repAdvisors
                                  .sort((a, b) => b.mrr - a.mrr)
                                  .slice(0, 3)
                                  .map(advisor => (
                                    <div key={advisor.id} className="flex items-center justify-between p-3 bg-[#F7F5F2] rounded-lg">
                                      <div className="flex items-center gap-2 flex-1">
                                        <span className="text-13px font-medium text-gray-900">{advisor.name}</span>
                                        <PulseBadge pulse={advisor.pulse} />
                                      </div>
                                      <span className="text-13px font-bold" style={{ color: '#157A6E' }}>{formatCurrency(advisor.mrr)}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeView === 'relationships' && (
              <div className="h-full max-w-7xl mx-auto">
                {/* List view: filters + portfolio summary + advisor list */}
                {relationshipsView === 'list' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {['All', 'At Risk', 'Top 10', 'New'].map(filter => (
                        <button
                          key={filter}
                          onClick={() => setRelationshipFilter(filter)}
                          className={`px-4 py-2 rounded-full text-13px font-semibold transition-colors ${
                            relationshipFilter === filter
                              ? 'text-white'
                              : 'bg-white border border-[#e8e5e1] text-gray-900 hover:bg-[#F7F5F2]'
                          }`}
                          style={relationshipFilter === filter ? { backgroundColor: '#157A6E' } : {}}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>

                    <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888] mb-3">Portfolio Summary</h3>
                      <div className="flex flex-wrap gap-6">
                        <div>
                          <p className="text-11px text-gray-600 mb-1">Total Advisors</p>
                          <p className="text-xl font-bold text-gray-900">{portfolioSummary.totalAdvisors}</p>
                        </div>
                        <div>
                          <p className="text-11px text-gray-600 mb-1">Total MRR</p>
                          <p className="text-xl font-bold" style={{ color: '#157A6E' }}>{formatCurrency(portfolioSummary.totalMRR)}</p>
                        </div>
                        <div className="flex gap-3 items-center text-11px">
                          <span className="text-green-600 font-semibold">Strong {portfolioSummary.strongCount}</span>
                          <span className="text-blue-600 font-semibold">Steady {portfolioSummary.steadyCount}</span>
                          <span className="text-emerald-600 font-semibold">Rising {portfolioSummary.risingCount}</span>
                          <span className="text-amber-600 font-semibold">Fading {portfolioSummary.fadingCount}</span>
                          <span className="text-red-600 font-semibold">Flatline {portfolioSummary.flatlineCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                      <div className="divide-y divide-[#f0ede9]">
                        {filteredAdvisors.map((advisor) => (
                          <div
                            key={advisor.id}
                            className="px-5 py-4 flex items-center gap-4 hover:bg-[#F7F5F2]/50 transition-colors cursor-pointer"
                            onClick={() => handleAdvisorClick(advisor.id)}
                          >
                            <div className="w-10 h-10 rounded-full bg-[#157A6E] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {advisor.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-13px font-semibold text-gray-900">{advisor.name}</p>
                              <p className="text-11px text-gray-600">{advisor.company}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <PulseBadge pulse={advisor.pulse} />
                              <TrajectoryBadge trajectory={advisor.trajectory} />
                              <span className="text-13px font-bold" style={{ color: '#157A6E' }}>{formatCurrency(advisor.mrr)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Detail view: back button + full advisor profile */}
                {relationshipsView === 'detail' && selectedAdvisor && (
                  <div className="flex flex-col overflow-hidden h-full">
                    <div className="bg-white rounded-t-xl border border-b-0 border-[#e8e5e1] p-6 flex items-start gap-4 border-b border-[#f0ede9] pb-4">
                      <button
                        onClick={() => { setRelationshipsView('list'); setSelectedAdvisor(null); }}
                        className="p-1.5 hover:bg-[#F7F5F2] rounded-lg transition-colors flex-shrink-0 mt-1"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                      </button>
                      <div className="w-12 h-12 rounded-full bg-[#157A6E] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                        {selectedAdvisor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-lg font-bold text-gray-900 truncate">{selectedAdvisor.name}</h2>
                          {selectedAdvisor.tier && <TierBadge tier={selectedAdvisor.tier} />}
                        </div>
                        <p className="text-13px text-gray-600 mb-2">{selectedAdvisor.title} · {selectedAdvisor.company}</p>
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
                        <p className="text-xl font-bold" style={{ color: '#157A6E' }}>{formatCurrency(selectedAdvisor.mrr)}</p>
                      </div>
                    </div>

                    <div className="bg-white border-x border-[#e8e5e1] border-b border-[#f0ede9] flex">
                      {(['overview', 'personal', 'deals', 'notes', 'activity'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setInlineTab(tab)}
                          className="flex-1 px-4 py-3 text-13px font-semibold uppercase tracking-widest transition-colors border-b-2"
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
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Quick Stats</h3>
                              <dl className="space-y-3 text-13px">
                                <div className="flex justify-between"><dt className="text-gray-600">Tier</dt><dd className="font-medium"><TierBadge tier={selectedAdvisor.tier} /></dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Pulse</dt><dd className="font-medium"><PulseBadge pulse={selectedAdvisor.pulse} /></dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Connected Since</dt><dd className="font-medium">{selectedAdvisor.connectedSince}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Company</dt><dd className="font-medium">{selectedAdvisor.company}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Best Day to Reach</dt><dd className="font-medium">{selectedAdvisor.bestDayToReach}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Comm Preference</dt><dd className="font-medium">{selectedAdvisor.commPreference}</dd></div>
                              </dl>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: '#f0f9f7', borderLeftColor: '#157A6E' }}>
                              <p className="text-13px italic text-gray-700">"{selectedAdvisor.diagnosis}"</p>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Recent Activity</h3>
                              <div className="space-y-3">
                                {selectedAdvisor.activity.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="border-l-2 border-gray-300 pl-4 py-2">
                                    <div className="flex items-center gap-2 mb-1"><SentimentBadge tone={item.sentiment} /><span className="text-11px text-gray-500">{item.time}</span></div>
                                    <p className="text-13px text-gray-700">{item.text}</p>
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
                                  <div className="flex justify-between"><dt className="text-gray-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</dt><dd className="font-medium">{selectedAdvisor.location}</dd></div>
                                )}
                                {selectedAdvisor.birthday && (
                                  <div className="flex justify-between"><dt className="text-gray-600 flex items-center gap-1.5"><Cake className="w-3.5 h-3.5" /> Birthday</dt><dd className="font-medium">{selectedAdvisor.birthday}</dd></div>
                                )}
                                {selectedAdvisor.education && (
                                  <div className="flex justify-between"><dt className="text-gray-600 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Education</dt><dd className="font-medium">{selectedAdvisor.education}</dd></div>
                                )}
                              </dl>
                            </div>
                            {selectedAdvisor.family && <div><h3 className="font-bold text-gray-900 mb-2 text-12px uppercase tracking-widest text-[#888]">Family</h3><p className="text-13px text-gray-700">{selectedAdvisor.family}</p></div>}
                            {selectedAdvisor.hobbies && <div><h3 className="font-bold text-gray-900 mb-2 text-12px uppercase tracking-widest text-[#888]">Hobbies & Interests</h3><p className="text-13px text-gray-700">{selectedAdvisor.hobbies}</p></div>}
                            {selectedAdvisor.funFact && <div><h3 className="font-bold text-gray-900 mb-2 text-12px uppercase tracking-widest text-[#888]">Fun Fact</h3><p className="text-13px text-gray-700">{selectedAdvisor.funFact}</p></div>}
                          </div>
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Channel Relationships</h3>
                              <dl className="space-y-3 text-13px">
                                {selectedAdvisor.tsds?.length > 0 && <div className="flex justify-between"><dt className="text-gray-600">TSDs</dt><dd className="font-medium">{selectedAdvisor.tsds.join(', ')}</dd></div>}
                                {selectedAdvisor.previousCompanies?.length > 0 && <div className="flex justify-between"><dt className="text-gray-600">Previous Companies</dt><dd className="font-medium">{selectedAdvisor.previousCompanies.join(', ')}</dd></div>}
                                {selectedAdvisor.mutualConnections?.length > 0 && <div className="flex justify-between"><dt className="text-gray-600">Mutual Connections</dt><dd className="font-medium">{selectedAdvisor.mutualConnections.join(', ')}</dd></div>}
                              </dl>
                            </div>
                          </div>
                        </div>
                      )}

                      {inlineTab === 'deals' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  <div className="flex justify-between"><dt>MRR:</dt><dd className="font-medium text-gray-900">${(deal.mrr / 1000).toFixed(1)}K</dd></div>
                                  <div className="flex justify-between"><dt>Stage:</dt><dd className="font-medium text-gray-900">{deal.stage}</dd></div>
                                  <div className="flex justify-between"><dt>Days in Stage:</dt><dd className="font-medium text-gray-900">{deal.daysInStage}</dd></div>
                                </dl>
                                <div className="bg-gray-200 rounded h-2 mb-1 overflow-hidden">
                                  <div className="h-2 rounded" style={{ width: `${deal.probability}%`, backgroundColor: '#157A6E' }} />
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
                            <div key={idx} className="p-3 rounded-lg text-13px text-gray-700" style={{ backgroundColor: '#F7F5F2' }}>• {note}</div>
                          ))}
                          <div className="flex gap-2 pt-4 border-t border-[#e8e5e1]">
                            <button className="py-2 px-4 border border-[#e8e5e1] rounded-lg text-13px hover:bg-[#F7F5F2] flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Log Call</button>
                            <button className="py-2 px-4 border border-[#e8e5e1] rounded-lg text-13px hover:bg-[#F7F5F2] flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Schedule</button>
                          </div>
                        </div>
                      )}

                      {inlineTab === 'activity' && (
                        <div className="max-w-2xl space-y-3">
                          {selectedAdvisor.activity.map((item, idx) => (
                            <div key={idx} className="border-l-2 border-gray-300 pl-4 py-2">
                              <div className="flex items-center gap-2 mb-1"><SentimentBadge tone={item.sentiment} /><span className="text-11px text-gray-500">{item.time}</span></div>
                              <p className="text-13px text-gray-700">{item.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeView === 'pipeline' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    className="bg-white border border-[#e8e5e1] rounded-[10px] p-5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'total-pipeline' ? null : 'total-pipeline')}
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Total Pipeline</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(teamPipeline)}</p>
                  </div>
                  <div
                    className="bg-white border border-[#e8e5e1] rounded-[10px] p-5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'weighted-pipeline' ? null : 'weighted-pipeline')}
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Weighted Pipeline</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(weightedPipeline)}</p>
                  </div>
                  <div
                    className="bg-white border border-[#e8e5e1] rounded-[10px] p-5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'healthy-deals' ? null : 'healthy-deals')}
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Healthy Deals</p>
                    <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>{healthyPercentage}%</p>
                  </div>
                  <div
                    className="bg-white border border-[#e8e5e1] rounded-[10px] p-5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedKPIPanel(expandedKPIPanel === 'at-risk-deals' ? null : 'at-risk-deals')}
                  >
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">At Risk / Stalled</p>
                    <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{atRiskPercentage}% ({stalledDealsCount} stalled)</p>
                  </div>
                </div>

                {expandedKPIPanel && (
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    {expandedKPIPanel === 'total-pipeline' && (
                      <div>
                        <h4 className="text-13px font-bold text-gray-900 mb-4">Pipeline Summary</h4>
                        <p className="text-11px text-gray-600">Total Pipeline Value: <span className="text-13px font-bold text-gray-900">{formatCurrency(teamPipeline)}</span></p>
                        <p className="text-11px text-gray-600 mt-2">Active Deals: <span className="text-13px font-bold text-gray-900">{activeDealCount}</span></p>
                      </div>
                    )}
                    {expandedKPIPanel === 'weighted-pipeline' && (
                      <div>
                        <h4 className="text-13px font-bold text-gray-900 mb-4">Weighted Pipeline Value</h4>
                        <p className="text-11px text-gray-600">Weighted by stage probability: <span className="text-13px font-bold text-gray-900">{formatCurrency(weightedPipeline)}</span></p>
                      </div>
                    )}
                    {expandedKPIPanel === 'healthy-deals' && (
                      <div>
                        <h4 className="text-13px font-bold text-gray-900 mb-4">Healthy Deals ({healthyDeals})</h4>
                        <div className="space-y-2">
                          {allDeals
                            .filter(d => d.health === 'Healthy')
                            .map(deal => (
                              <div key={deal.id} className="flex items-center justify-between p-3 bg-[#F7F5F2] rounded-lg">
                                <span className="text-13px font-medium text-gray-900">{deal.name}</span>
                                <span className="text-13px font-bold" style={{ color: '#16a34a' }}>{formatCurrency(deal.mrr)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {expandedKPIPanel === 'at-risk-deals' && (
                      <div>
                        <h4 className="text-13px font-bold text-gray-900 mb-4">At-Risk / Stalled Deals ({atRiskDeals})</h4>
                        <div className="space-y-2">
                          {allDeals
                            .filter(d => d.health === 'At Risk' || d.health === 'Stalled')
                            .map(deal => (
                              <div key={deal.id} className="flex items-center justify-between p-3 bg-[#F7F5F2] rounded-lg border-l-4" style={{ borderLeftColor: '#ef4444' }}>
                                <div>
                                  <span className="text-13px font-medium text-gray-900">{deal.name}</span>
                                  <p className="text-11px text-gray-600">{deal.stage}</p>
                                </div>
                                <span className="text-13px font-bold" style={{ color: '#ef4444' }}>{formatCurrency(deal.mrr)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Pipeline by Stage</h3>
                  </div>
                  <div className="p-5">
                    <div className="flex gap-1 h-12 mb-4">
                      {(['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'] as const).map(stage => {
                        const stageBorderColors: Record<string, string> = {
                          'Discovery': '#2563eb',
                          'Qualifying': '#4f46e5',
                          'Proposal': '#f59e0b',
                          'Negotiating': '#fb923c',
                          'Closed Won': '#16a34a',
                          'Stalled': '#ef4444',
                        };
                        const count = stageDistribution[stage];
                        const totalDeals = Object.values(stageDistribution).reduce((a, b) => a + b, 0);
                        const percentage = totalDeals > 0 ? (count / totalDeals) * 100 : 0;
                        return (
                          <div
                            key={stage}
                            className="flex-1 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center text-white text-10px font-bold"
                            style={{ backgroundColor: stageBorderColors[stage], width: `${percentage}%` }}
                            onClick={() => setExpandedStage(expandedStage === stage ? null : stage)}
                            title={`${stage}: ${count} deals`}
                          >
                            {count > 0 && <span>{count}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 flex-wrap text-11px">
                      {(['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'] as const).map(stage => {
                        const stageBorderColors: Record<string, string> = {
                          'Discovery': '#2563eb',
                          'Qualifying': '#4f46e5',
                          'Proposal': '#f59e0b',
                          'Negotiating': '#fb923c',
                          'Closed Won': '#16a34a',
                          'Stalled': '#ef4444',
                        };
                        return (
                          <div key={stage} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageBorderColors[stage] }} />
                            <span className="text-gray-600">{stage} ({stageDistribution[stage]})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {expandedStage && (
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                    <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Deals in {expandedStage}</h3>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allDeals
                          .filter(d => d.stage === expandedStage)
                          .map(deal => {
                            const advisor = advisors.find(a => a.id === deal.advisorId);
                            const rep = reps.find(r => r.id === deal.repId);
                            return (
                              <div key={deal.id} className="p-4 bg-[#F7F5F2] rounded-lg border border-[#e8e5e1]">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="text-13px font-semibold text-gray-900">{deal.name}</h4>
                                  <DealHealthBadge health={deal.health} />
                                </div>
                                <p className="text-11px text-gray-600 mb-2">
                                  <span className="font-medium">{advisor?.name}</span>
                                  {rep && <span className="text-gray-400"> · {rep.name}</span>}
                                </p>
                                <div className="space-y-1 text-11px mb-3">
                                  <p className="text-gray-600">MRR: <span className="font-bold text-gray-900">{formatCurrency(deal.mrr)}</span></p>
                                  <p className="text-gray-600">Days in stage: <span className="font-bold text-gray-900">{deal.daysInStage}</span></p>
                                  <p className="text-gray-600">Probability: <span className="font-bold text-gray-900">{deal.probability}%</span></p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Pipeline by Rep</h3>
                  </div>
                  <div className="divide-y divide-[#e8e5e1]">
                    {repPipelineData.map((repData) => {
                      const stageBorderColors: Record<string, string> = {
                        'Discovery': '#2563eb',
                        'Qualifying': '#4f46e5',
                        'Proposal': '#f59e0b',
                        'Negotiating': '#fb923c',
                        'Closed Won': '#16a34a',
                        'Stalled': '#ef4444',
                      };
                      return (
                        <div key={repData.repId}>
                          <div
                            className="px-5 py-4 flex items-center justify-between hover:bg-[#F7F5F2]/30 transition-colors cursor-pointer"
                            onClick={() => setExpandedPipelineRep(expandedPipelineRep === repData.repId ? null : repData.repId)}
                          >
                            <div className="flex-1">
                              <p className="text-13px font-semibold text-gray-900">{repData.repName}</p>
                              <p className="text-11px text-gray-600">{repData.dealCount} deals</p>
                            </div>
                            <div className="flex items-center gap-4 flex-1 mx-6">
                              <div className="flex gap-0.5 h-6 flex-1">
                                {(['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'] as const).map(stage => {
                                  const count = repData.stageBreakdown[stage];
                                  const percentage = repData.dealCount > 0 ? (count / repData.dealCount) * 100 : 0;
                                  return (
                                    count > 0 && (
                                      <div
                                        key={stage}
                                        className="rounded-sm"
                                        style={{
                                          backgroundColor: stageBorderColors[stage],
                                          width: `${percentage}%`,
                                          height: '100%',
                                        }}
                                        title={`${stage}: ${count}`}
                                      />
                                    )
                                  );
                                })}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-13px font-bold" style={{ color: '#157A6E' }}>{formatCurrency(repData.totalPipeline)}</p>
                            </div>
                          </div>
                          {expandedPipelineRep === repData.repId && (
                            <div className="px-5 py-4 bg-[#F7F5F2] border-t border-[#e8e5e1]">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {allDeals
                                  .filter(d => d.repId === repData.repId)
                                  .map(deal => {
                                    const advisor = advisors.find(a => a.id === deal.advisorId);
                                    return (
                                      <div key={deal.id} className="p-3 bg-white rounded-lg border border-[#e8e5e1]">
                                        <div className="flex items-start justify-between mb-1">
                                          <h4 className="text-13px font-semibold text-gray-900">{deal.name}</h4>
                                          <DealHealthBadge health={deal.health} />
                                        </div>
                                        <p className="text-11px text-gray-600 mb-1">{advisor?.name}</p>
                                        <p className="text-11px text-gray-600">Stage: <span className="font-bold">{deal.stage}</span></p>
                                        <p className="text-13px font-bold" style={{ color: '#157A6E' }}>{formatCurrency(deal.mrr)}</p>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {stageTimelineMismatches.length > 0 && (
                  <div className="bg-white rounded-[10px] border border-[#e8e5e1]">
                    <div className="px-5 py-3.5 border-b border-[#f0ede9] border-l-4" style={{ borderLeftColor: '#ef4444' }}>
                      <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Stage/Timeline Mismatches</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stageTimelineMismatches.map(deal => {
                          const advisor = advisors.find(a => a.id === deal.advisorId);
                          const rep = reps.find(r => r.id === deal.repId);
                          return (
                            <div key={deal.id} className="bg-white border border-[#e8e5e1] rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#ef4444' }}>
                              <p className="text-13px font-semibold text-gray-900">{deal.name}</p>
                              <p className="text-11px text-gray-600 mb-2">
                                <span className="cursor-pointer hover:underline" onClick={() => advisor && handleAdvisorClick(advisor.id)} style={{ color: '#157A6E' }}>{advisor?.name}</span>
                                {rep && <span className="text-gray-400"> · {rep.name}</span>}
                              </p>
                              <div className="space-y-1 text-11px">
                                <p className="flex items-center gap-1"><span className="font-medium">Stage:</span> {deal.stage} <AlertTriangle className="w-3 h-3" style={{ color: '#f59e0b' }} /> {deal.daysInStage}d in stage</p>
                                <p><span className="font-medium">Close Date:</span> {deal.closeDate}</p>
                                <p><span className="font-medium">MRR:</span> {formatCurrency(deal.mrr)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeView === 'intelligence' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Friction Insights</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-13px">
                      <thead className="border-b border-[#e8e5e1]">
                        <tr className="bg-[#F7F5F2]">
                          <th className="px-5 py-3 text-left font-semibold text-gray-900">Issue</th>
                          <th className="px-5 py-3 text-center font-semibold text-gray-900">Count</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-900">Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {frictionInsights.map((item, idx) => (
                          <tr key={idx} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]/50">
                            <td className="px-5 py-3 text-gray-900">{item.issue}</td>
                            <td className="px-5 py-3 text-center text-gray-600">{item.count}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-1 rounded text-11px font-semibold ${
                                item.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                                item.severity === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {item.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Competitive Landscape</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-13px">
                      <thead className="border-b border-[#e8e5e1]">
                        <tr className="bg-[#F7F5F2]">
                          <th className="px-5 py-3 text-left font-semibold text-gray-900">Competitor</th>
                          <th className="px-5 py-3 text-center font-semibold text-gray-900">Deal Count</th>
                          <th className="px-5 py-3 text-right font-semibold text-gray-900">Pipeline At Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competitiveLandscape.map((item, idx) => (
                          <tr key={idx} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]/50">
                            <td className="px-5 py-3 text-gray-900">{item.competitor}</td>
                            <td className="px-5 py-3 text-center text-gray-600">{item.dealCount}</td>
                            <td className="px-5 py-3 text-right font-semibold" style={{ color: '#ef4444' }}>{formatCurrency(item.pipelineAtRisk)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Diagnostic Matrix</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-13px">
                      <thead className="border-b border-[#e8e5e1]">
                        <tr className="bg-[#F7F5F2]">
                          <th className="px-5 py-3 text-left font-semibold text-gray-900">Pattern</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-900">Reps Affected</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-900">Impact</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-900">Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diagnosticMatrix.map((item, idx) => (
                          <tr key={idx} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]/50">
                            <td className="px-5 py-3 text-gray-900 font-medium">{item.pattern}</td>
                            <td className="px-5 py-3 text-gray-600">{item.repsAffected}</td>
                            <td className="px-5 py-3 text-gray-600">{item.impact}</td>
                            <td className="px-5 py-3 text-gray-600">{item.action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Stage/Timeline Mismatches</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stageTimelineMismatches.map(deal => {
                        const advisor = advisors.find(a => a.id === deal.advisorId);
                        const rep = reps.find(r => r.id === deal.repId);
                        return (
                          <div key={deal.id} className="bg-white border border-[#e8e5e1] rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
                            <p className="text-13px font-semibold text-gray-900">{deal.name}</p>
                            <p className="text-11px text-gray-600 mb-2">
                              <span className="cursor-pointer hover:underline" onClick={() => advisor && handleAdvisorClick(advisor.id)} style={{ color: '#157A6E' }}>{advisor?.name}</span>
                              {rep && <span className="text-gray-400"> · {rep.name}</span>}
                            </p>
                            <div className="space-y-1 text-11px">
                              <p className="flex items-center gap-1"><span className="font-medium">Stage:</span> {deal.stage} <AlertTriangle className="w-3 h-3" style={{ color: '#f59e0b' }} /> {deal.daysInStage}d in stage</p>
                              <p><span className="font-medium">Close Date:</span> {deal.closeDate}</p>
                              <p><span className="font-medium">MRR:</span> {formatCurrency(deal.mrr)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          <AIChat role="leader" selectedAdvisor={selectedAdvisor} />
        </div>
      </div>
    </div>
  );
}
