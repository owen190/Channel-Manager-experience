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

// Engagement label helper
function EngLabel({ score }: { score: EngagementScore }) {
  const colors: Record<EngagementScore, string> = {
    Strong: 'bg-green-100 text-green-800',
    Steady: 'bg-amber-100 text-amber-800',
    Fading: 'bg-red-100 text-red-800',
  };
  return <span className={`px-2 py-0.5 rounded-full text-11px font-semibold ${colors[score]}`}>{score}</span>;
}

export default function LeaderDashboard() {
  const [activeView, setActiveView] = useState('command-center');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedReps, setExpandedReps] = useState<string[]>([]);
  const [inlineTab, setInlineTab] = useState<'overview' | 'personal' | 'deals' | 'notes' | 'activity'>('overview');

  // Leader info
  const userName = 'Priya M.';
  const userInitials = 'PM';

  // ==================== Data Calculations ====================

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

  // Stage/timeline mismatch deals
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

  // Helper functions
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
      setPanelOpen(true);
    }
  };

  const getDaysInStageColor = (days: number): string => {
    if (days > 20) return 'bg-red-100 text-red-700';
    if (days > 10) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  // ==================== MAIN RENDER ====================

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

            {/* ========== COMMAND CENTER VIEW ========== */}
            {activeView === 'command-center' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Forecast Banner */}
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

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Team MRR</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(teamMRR)}</p>
                    <p className="text-11px text-gray-600 mt-1">+{mrrChange}% growth</p>
                  </div>
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Avg Deal Size</p>
                    <p className="text-2xl font-bold text-gray-900">$45.2K</p>
                    <p className="text-11px text-gray-600 mt-1">+$2.1K vs last month</p>
                  </div>
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Win Rate</p>
                    <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>68%</p>
                    <p className="text-11px text-gray-600 mt-1">Industry avg: 62%</p>
                  </div>
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Cycle Time</p>
                    <p className="text-2xl font-bold text-gray-900">42 days</p>
                    <p className="text-11px text-gray-600 mt-1">-3 days vs Q4</p>
                  </div>
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">At Risk $</p>
                    <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>$182K</p>
                    <p className="text-11px text-gray-600 mt-1">15% of pipeline</p>
                  </div>
                </div>

                {/* Team Performance & Coaching Signals */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Team Performance */}
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

                  {/* Coaching Signals */}
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

                {/* Forecast by Rep Table */}
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
                            <tr key={rep.id} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]/30 transition-colors">
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
                </div>
              </div>
            )}

            {/* ========== FORECAST VIEW ========== */}
            {activeView === 'forecast' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Commit vs Target */}
                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Commit vs Target Tracker</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <p className="text-11px text-gray-600 uppercase mb-1">Target</p>
                        <p className="text-3xl font-bold text-gray-900">{formatCurrency(teamTarget)}</p>
                      </div>
                      <div>
                        <p className="text-11px text-gray-600 uppercase mb-1">Current Commit</p>
                        <p className="text-3xl font-bold" style={{ color: '#157A6E' }}>{formatCurrency(teamCommit)}</p>
                      </div>
                      <div>
                        <p className="text-11px text-gray-600 uppercase mb-1">Gap</p>
                        <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>{formatCurrency(commitGap)}</p>
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

                {/* Override Requests */}
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
                            <button className="px-3 py-1.5 text-11px font-semibold bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">Approve</button>
                            <button className="px-3 py-1.5 text-11px font-semibold bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">Deny</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historical Forecast */}
                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Historical Forecast Accuracy</h3>
                  </div>
                  <div className="divide-y divide-[#e8e5e1]">
                    {historicalForecast.map((item) => (
                      <div key={item.quarter} className="px-5 py-4 flex items-center justify-between hover:bg-[#F7F5F2]/30">
                        <div>
                          <p className="text-13px font-semibold text-gray-900">{item.quarter}</p>
                          <p className="text-11px text-gray-600">Target: {formatCurrency(item.target)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-13px font-semibold text-gray-900">{formatCurrency(item.actual)}</p>
                          <p className="text-11px" style={{ color: item.percentage >= 90 ? '#16a34a' : '#f59e0b' }}>{item.percentage}% accuracy</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========== TEAM VIEW ========== */}
            {activeView === 'team' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Rep Cards */}
                <div className="grid grid-cols-1 gap-4">
                  {reps.map((rep) => {
                    const repDeals = allDeals.filter(d => d.repId === rep.id);
                    const isExpanded = expandedReps.includes(rep.id);
                    const quotaPercentage = Math.round((rep.currentCommit / rep.quotaTarget) * 100);

                    return (
                      <div key={rep.id} className="bg-white border border-[#e8e5e1] rounded-[10px]">
                        <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[#F7F5F2]/30 transition-colors" onClick={() => toggleRepExpansion(rep.id)}>
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
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                                <p className="text-11px text-gray-600 mb-1">Managed MRR</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(rep.managedMRR)}</p>
                              </div>
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                                <p className="text-11px text-gray-600 mb-1">Active Deals</p>
                                <p className="text-lg font-bold text-gray-900">{rep.activeDeals}</p>
                              </div>
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                                <p className="text-11px text-gray-600 mb-1">Partner Capacity</p>
                                <p className="text-lg font-bold text-gray-900">{rep.partnerCount}/{rep.partnerCapacity}</p>
                              </div>
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                                <p className="text-11px text-gray-600 mb-1">Quota Progress</p>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full" style={{ width: `${Math.min(quotaPercentage, 100)}%`, backgroundColor: quotaPercentage >= 90 ? '#16a34a' : quotaPercentage >= 80 ? '#f59e0b' : '#ef4444' }} />
                                  </div>
                                  <span className="text-11px font-semibold">{quotaPercentage}%</span>
                                </div>
                              </div>
                            </div>

                            {repDeals.length > 0 && (
                              <div>
                                <p className="text-12px font-bold uppercase tracking-widest text-[#888] mb-2">Recent Deals</p>
                                <div className="space-y-2">
                                  {repDeals.slice(0, 3).map((deal) => (
                                    <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                                      <div>
                                        <p className="text-13px font-semibold text-gray-900">{deal.name}</p>
                                        <p className="text-11px text-gray-600">{deal.stage} · {deal.daysInStage}d</p>
                                      </div>
                                      <div className="text-right flex items-center gap-3">
                                        <DealHealthBadge health={deal.health} />
                                        <p className="text-13px font-bold" style={{ color: '#157A6E' }}>{formatCurrency(deal.mrr)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========== RELATIONSHIPS VIEW (Master-Detail) ========== */}
            {activeView === 'relationships' && (
              <div className="flex gap-6 h-full max-w-7xl mx-auto">
                {/* Left Panel: Advisor List */}
                <div className="w-80 flex flex-col bg-white rounded-xl border border-[#e8e5e1]">
                  {/* Filter Pills */}
                  <div className="px-6 py-4 border-b border-[#f0ede9] flex gap-2 flex-wrap">
                    {['All', 'At Risk', 'Top 10', 'New'].map(filter => (
                      <button
                        key={filter}
                        className="px-3 py-1 rounded-full text-11px font-semibold border border-[#e8e5e1] hover:bg-[#F7F5F2]"
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {/* Advisor List */}
                  <div className="flex-1 overflow-y-auto">
                    {advisors.map(advisor => (
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

                {/* Right Panel: Advisor Detail */}
                {selectedAdvisor ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Detail Header */}
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

                    {/* Tabs */}
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

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto bg-white rounded-b-xl border border-t-0 border-[#e8e5e1] p-6">
                      {inlineTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Relationship Context</h3>
                              <dl className="space-y-2 text-13px">
                                <div className="flex justify-between"><dt className="text-gray-600">Connected Since</dt><dd className="font-medium">{selectedAdvisor.connectedSince}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Best Day to Reach</dt><dd className="font-medium">{selectedAdvisor.bestDayToReach}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Comm Preference</dt><dd className="font-medium">{selectedAdvisor.commPreference}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Referred By</dt><dd className="font-medium">{selectedAdvisor.referredBy}</dd></div>
                              </dl>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 mb-3 text-12px uppercase tracking-widest text-[#888]">Engagement Breakdown</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center"><span className="text-13px text-gray-600">Engagement</span><EngLabel score={selectedAdvisor.engagementBreakdown.engagement} /></div>
                                <div className="flex justify-between items-center"><span className="text-13px text-gray-600">Pipeline Strength</span><EngLabel score={selectedAdvisor.engagementBreakdown.pipelineStrength} /></div>
                                <div className="flex justify-between items-center"><span className="text-13px text-gray-600">Responsiveness</span><EngLabel score={selectedAdvisor.engagementBreakdown.responsiveness} /></div>
                                <div className="flex justify-between items-center"><span className="text-13px text-gray-600">Growth Potential</span><EngLabel score={selectedAdvisor.engagementBreakdown.growthPotential} /></div>
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
                ) : (
                  <div className="flex-1 bg-white rounded-xl border border-[#e8e5e1] flex items-center justify-center">
                    <p className="text-13px text-gray-600">Select an advisor to view details</p>
                  </div>
                )}
              </div>
            )}

            {/* ========== PIPELINE VIEW ========== */}
            {activeView === 'pipeline' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Pipeline KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Total Pipeline</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(teamPipeline)}</p>
                  </div>
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Weighted Pipeline</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(weightedPipeline)}</p>
                  </div>
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">Healthy Deals</p>
                    <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>{healthyPercentage}%</p>
                  </div>
                  <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                    <p className="text-10px uppercase font-semibold text-[#888] mb-2">At Risk / Stalled</p>
                    <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{atRiskPercentage}% ({stalledDealsCount} stalled)</p>
                  </div>
                </div>

                {/* Stage/Timeline Mismatch Alerts */}
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

                {/* Kanban Board */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4" style={{ minWidth: '1920px' }}>
                    {(['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'] as const).map(stage => {
                      const stageBorderColors: Record<string, string> = {
                        'Discovery': '#2563eb',
                        'Qualifying': '#4f46e5',
                        'Proposal': '#f59e0b',
                        'Negotiating': '#fb923c',
                        'Closed Won': '#16a34a',
                        'Stalled': '#ef4444',
                      };
                      const stageDeals = allDeals.filter(d => d.stage === stage);
                      const stageMRR = stageDeals.reduce((sum, d) => sum + d.mrr, 0);

                      return (
                        <div key={stage} className="flex-1 min-w-[280px]">
                          <div className="bg-white border border-[#e8e5e1] rounded-xl p-4 mb-3 border-t-4" style={{ borderTopColor: stageBorderColors[stage] }}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-13px font-bold text-gray-900">{stage}</h3>
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-11px font-semibold bg-gray-100 text-gray-700">{stageDeals.length}</span>
                            </div>
                            <p className="text-13px font-semibold" style={{ color: '#157A6E' }}>${(stageMRR / 1000).toFixed(1)}K MRR</p>
                          </div>
                          <div className="flex flex-col gap-3">
                            {stageDeals.length === 0 ? (
                              <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                                <p className="text-11px text-gray-500">No deals in this stage</p>
                              </div>
                            ) : (
                              stageDeals.map(deal => {
                                const advisor = advisors.find(a => a.id === deal.advisorId);
                                const rep = reps.find(r => r.id === deal.repId);
                                return (
                                  <div key={deal.id} className="bg-white border border-[#e8e5e1] rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="text-13px font-bold text-gray-900 mb-2">{deal.name}</h4>
                                    <p className="text-11px text-gray-600 mb-1">
                                      <span className="font-medium cursor-pointer hover:underline" onClick={() => advisor && handleAdvisorClick(advisor.id)} style={{ color: '#157A6E' }}>{advisor?.name || 'Unknown'}</span>
                                      {rep && <span className="text-gray-400"> · {rep.name}</span>}
                                    </p>
                                    <div className="mb-2">
                                      <p className="text-11px text-gray-600">MRR</p>
                                      <p className="text-13px font-bold text-gray-900">${(deal.mrr / 1000).toFixed(1)}K</p>
                                    </div>
                                    <div className="mb-2"><DealHealthBadge health={deal.health} /></div>
                                    <div className={`px-2 py-1 rounded text-11px font-medium mb-2 inline-block ${getDaysInStageColor(deal.daysInStage)}`}>{deal.daysInStage}d in stage</div>
                                    <div className="mb-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-11px text-gray-600">Probability</p>
                                        <p className="text-11px font-semibold text-gray-700">{deal.probability}%</p>
                                      </div>
                                      <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${deal.probability}%`, backgroundColor: '#157A6E' }} />
                                      </div>
                                    </div>
                                    {deal.confidenceScore && (
                                      <div className="flex items-center gap-1">
                                        <p className="text-11px text-gray-600">Confidence:</p>
                                        <div className="px-2 py-0.5 rounded text-11px font-semibold text-white" style={{ backgroundColor: deal.confidenceScore === 'High' ? '#16a34a' : deal.confidenceScore === 'Medium' ? '#f59e0b' : '#ef4444' }}>{deal.confidenceScore}</div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========== INTELLIGENCE VIEW ========== */}
            {activeView === 'intelligence' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Friction Insights */}
                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Friction Insights</h3>
                  </div>
                  <div className="divide-y divide-[#e8e5e1]">
                    {frictionInsights.map((insight, idx) => (
                      <div key={idx} className="px-5 py-4 flex items-center justify-between hover:bg-[#F7F5F2]/30 transition-colors">
                        <div>
                          <p className="text-13px font-semibold text-gray-900">{insight.issue}</p>
                          <p className="text-11px text-gray-600 mt-1">{insight.count} reps affected</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-11px font-bold ${
                          insight.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                          insight.severity === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>{insight.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competitive Landscape */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {competitiveLandscape.map((comp) => (
                    <div key={comp.competitor} className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
                      <h4 className="text-13px font-bold text-gray-900 mb-4">{comp.competitor}</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-11px text-gray-600 mb-1">Active Deals</p>
                          <p className="text-2xl font-bold text-gray-900">{comp.dealCount}</p>
                        </div>
                        <div>
                          <p className="text-11px text-gray-600 mb-1">Pipeline at Risk</p>
                          <p className="text-lg font-bold" style={{ color: '#ef4444' }}>{formatCurrency(comp.pipelineAtRisk)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Diagnostic Matrix */}
                <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
                  <div className="px-5 py-3.5 border-b border-[#f0ede9]">
                    <h3 className="text-12px uppercase font-bold tracking-widest text-[#888]">Diagnostic Matrix</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F7F5F2]">
                        <tr className="border-b border-[#e8e5e1]">
                          <th className="px-5 py-3 text-left text-11px font-semibold text-gray-700 uppercase">Pattern</th>
                          <th className="px-5 py-3 text-left text-11px font-semibold text-gray-700 uppercase">Reps Affected</th>
                          <th className="px-5 py-3 text-left text-11px font-semibold text-gray-700 uppercase">Impact</th>
                          <th className="px-5 py-3 text-left text-11px font-semibold text-gray-700 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diagnosticMatrix.map((item, idx) => (
                          <tr key={idx} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]/30 transition-colors">
                            <td className="px-5 py-3 text-13px font-semibold text-gray-900">{item.pattern}</td>
                            <td className="px-5 py-3 text-13px text-gray-700">{item.repsAffected}</td>
                            <td className="px-5 py-3 text-13px font-medium" style={{ color: '#ef4444' }}>{item.impact}</td>
                            <td className="px-5 py-3 text-13px font-medium" style={{ color: '#157A6E' }}>{item.action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
          <AIChat role="leader" selectedAdvisor={selectedAdvisor} />
        </div>
      </div>

      {/* Advisor Panel */}
      <AdvisorPanel
        isOpen={panelOpen && activeView !== 'relationships'}
        onClose={() => setPanelOpen(false)}
        advisor={selectedAdvisor}
        deals={selectedAdvisor ? deals.filter(d => selectedAdvisor.deals.includes(d.id)) : []}
      />
    </div>
  );
}
