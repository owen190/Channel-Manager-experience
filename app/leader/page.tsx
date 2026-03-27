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

  // Team MRR
  const teamMRR = reps.reduce((sum, rep) => sum + rep.managedMRR, 0);
  const prevTeamMRR = teamMRR * 0.942; // 6.2% growth inverse
  const mrrChange = ((teamMRR - prevTeamMRR) / prevTeamMRR * 100).toFixed(1);

  // Team targets and commits
  const teamTarget = reps.reduce((sum, rep) => sum + rep.quotaTarget, 0); // $1.2M
  const teamCommit = reps.reduce((sum, rep) => sum + rep.currentCommit, 0); // $1.073M
  const commitGap = teamTarget - teamCommit; // $127K
  const commitPercentage = Math.round((teamCommit / teamTarget) * 100);

  // Pipeline calculations
  const allDeals = deals;
  const teamPipeline = allDeals.reduce((sum, deal) => sum + deal.mrr, 0);
  const weightedPipeline = allDeals.reduce((sum, deal) => {
    const stageWeight = STAGE_WEIGHTS.find(sw => sw.stage === deal.stage)?.weight || 0;
    return sum + (deal.mrr * stageWeight);
  }, 0);

  // Active deals count
  const activeDealCount = allDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Stalled').length;

  // Forecast accuracy (last quarter)
  const forecastAccuracy = 78;

  // Team pulse distribution
  const teamPulseDistribution = {
    Strong: 28,
    Steady: 35,
    Rising: 22,
    Fading: 18,
    Flatline: 12
  };

  // Healthy deals percentage
  const healthyDeals = allDeals.filter(d => d.health === 'Healthy').length;
  const atRiskDeals = allDeals.filter(d => d.health === 'At Risk' || d.health === 'Stalled').length;
  const healthyPercentage = Math.round((healthyDeals / allDeals.length) * 100);
  const atRiskPercentage = Math.round((atRiskDeals / allDeals.length) * 100);

  // Best case calculation
  const bestCase = allDeals.reduce((sum, deal) => {
    const stageWeight = STAGE_WEIGHTS.find(sw => sw.stage === deal.stage)?.weight || 0;
    return sum + (deal.mrr * Math.max(0.5, stageWeight)); // Conservative 50% minimum
  }, 0);

  // Historical forecast
  const historicalForecast: ForecastHistoryEntry[] = [
    { quarter: 'Q2 2025', target: 1100000, actual: 1050000, percentage: 95 },
    { quarter: 'Q3 2025', target: 1150000, actual: 1080000, percentage: 94 },
    { quarter: 'Q4 2025', target: 1200000, actual: 1140000, percentage: 95 },
    { quarter: 'Q1 2026', target: 1200000, actual: teamMRR, percentage: commitPercentage }
  ];

  // Override requests (pending)
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

  // Friction insights
  const frictionInsights = [
    { issue: 'Quoting >72hrs', count: 14, severity: 'HIGH' as const },
    { issue: 'Install timeline misses', count: 8, severity: 'MODERATE' as const },
    { issue: 'Post-sale support gaps', count: 6, severity: 'MODERATE' as const },
    { issue: 'Training complaints', count: 3, severity: 'LOW' as const }
  ];

  // Competitive landscape
  const competitiveLandscape = [
    { competitor: 'Lumen', dealCount: 6, pipelineAtRisk: 82000 },
    { competitor: 'Comcast Business', dealCount: 4, pipelineAtRisk: 45000 },
    { competitor: 'Spectrum Enterprise', dealCount: 3, pipelineAtRisk: 28000 }
  ];

  // Diagnostic matrix
  const diagnosticMatrix = [
    {
      pattern: 'High friction + stalled',
      repsAffected: 'Natasha, Thomas',
      impact: '$70K risk',
      action: 'Escalate quoting SLA'
    },
    {
      pattern: 'Over-capacity',
      repsAffected: 'Javier',
      impact: 'Burnout risk',
      action: 'Redistribute 15+ partners'
    },
    {
      pattern: 'Under-loaded',
      repsAffected: 'Thomas',
      impact: 'Lost opportunity',
      action: 'Assign 10 from Javier'
    },
    {
      pattern: 'Forecast gap widening',
      repsAffected: 'Marcus, Natasha',
      impact: '$89K gap',
      action: 'Weekly commit reviews'
    }
  ];

  // Stage vs timeline mismatch alerts
  const stageMismatchAlerts = [
    { rep: 'Natasha', dealCount: 3, stage: 'Discovery', daysInStage: 30 },
    { rep: 'Thomas', dealCount: 2, stage: 'Proposal', daysInStage: 21 },
    { rep: 'Marcus', dealCount: 1, stage: 'Negotiate', daysInStage: 14 }
  ];

  // CRM hygiene - reps with stale notes
  const crmHygiene = [
    { rep: 'Natasha Volkov', dealsWithStaleNotes: 3 },
    { rep: 'Thomas Anderson', dealsWithStaleNotes: 2 },
    { rep: 'Javier Romero', dealsWithStaleNotes: 1 }
  ];

  // Nudges
  const nudges: Nudge[] = [
    {
      id: 'nudge-1',
      title: '5 days left in Q1',
      description: 'Team needs $127K to hit target',
      time: 'now',
      type: 'quarter',
      priority: 'critical'
    },
    {
      id: 'nudge-2',
      title: 'Override Approval Pending',
      description: '2 deals waiting for decision',
      time: 'now',
      type: 'override',
      priority: 'high'
    },
    {
      id: 'nudge-3',
      title: 'Capacity Crisis',
      description: 'Ernie at 57/30 partners',
      time: '2h',
      type: 'capacity',
      priority: 'critical'
    }
  ];

  // Helper functions
  const getRepStatusBadgeColor = (percentage: number): string => {
    if (percentage > 90) return 'bg-green-100 text-green-800';
    if (percentage >= 80) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  const getCapacityColor = (current: number, capacity: number): string => {
    const percentage = (current / capacity) * 100;
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 83) return 'bg-amber-500';
    return 'bg-green-500';
  };

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

  const handleAdvisorSelect = (advisor: Advisor) => {
    setSelectedAdvisor(advisor);
    setPanelOpen(true);
  };

  const handleAdvisorClick = (advisorId: string) => {
    const advisor = advisors.find(a => a.id === advisorId);
    if (advisor) {
      setSelectedAdvisor(advisor);
      setPanelOpen(true);
    }
  };

  // ==================== COMMAND CENTER VIEW ====================

  const renderCommandCenter = () => (
    <div className="space-y-6">
      {/* Forecast Banner */}
      <div className="bg-gradient-to-r from-[#157A6E] to-emerald-600 rounded-xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Q1 Forecast: $960K of $1.2M</h2>
            <p className="text-emerald-50">Gap of $240K to reach target</p>
          </div>
          <div className="flex gap-12 text-right">
            <div>
              <p className="text-sm opacity-80">Reps</p>
              <p className="text-3xl font-bold">6</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Total Deals</p>
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
          <p className="text-[10px] uppercase font-semibold text-gray-600 mb-2">Team MRR</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(teamMRR)}</p>
          <p className="text-[11px] text-gray-600 mt-1">+{mrrChange}% growth</p>
        </div>
        <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
          <p className="text-[10px] uppercase font-semibold text-gray-600 mb-2">Avg Deal Size</p>
          <p className="text-2xl font-bold text-gray-900">$45.2K</p>
          <p className="text-[11px] text-gray-600 mt-1">+$2.1K vs last month</p>
        </div>
        <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
          <p className="text-[10px] uppercase font-semibold text-gray-600 mb-2">Win Rate</p>
          <p className="text-2xl font-bold text-[#16a34a]">68%</p>
          <p className="text-[11px] text-gray-600 mt-1">Industry avg: 62%</p>
        </div>
        <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
          <p className="text-[10px] uppercase font-semibold text-gray-600 mb-2">Cycle Time</p>
          <p className="text-2xl font-bold text-gray-900">42 days</p>
          <p className="text-[11px] text-gray-600 mt-1">-3 days vs Q4</p>
        </div>
        <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
          <p className="text-[10px] uppercase font-semibold text-gray-600 mb-2">At Risk $</p>
          <p className="text-2xl font-bold text-[#ef4444]">$182K</p>
          <p className="text-[11px] text-gray-600 mt-1">15% of pipeline</p>
        </div>
      </div>

      {/* Team Performance & Coaching Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Performance */}
        <div className="lg:col-span-2 bg-white border border-[#e8e5e1] rounded-[10px]">
          <div className="px-5 py-4 border-b border-[#f0ede9]">
            <h3 className="text-xs uppercase font-bold text-gray-700">Team Performance</h3>
          </div>
          <div className="divide-y divide-[#f0ede9]">
            {reps.map((rep) => {
              const repDeals = allDeals.filter(d => d.repId === rep.id);
              const repCommitPercentage = Math.round((rep.currentCommit / rep.commitTarget) * 100);
              const quotaPercentage = Math.round((rep.currentCommit / rep.quotaTarget) * 100);
              return (
                <div key={rep.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#F7F5F2]/50 transition-colors">
                  {/* Rep Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#157A6E] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {rep.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {/* Rep Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{rep.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 flex-1 max-w-[120px] bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${quotaPercentage >= 90 ? 'bg-[#16a34a]' : quotaPercentage >= 80 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'}`}
                          style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{quotaPercentage}%</span>
                    </div>
                  </div>
                  {/* MRR Metric */}
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#157A6E]">{formatCurrency(rep.managedMRR)}</p>
                    <p className="text-xs text-gray-500">{rep.activeDeals} active</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coaching Signals */}
        <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
          <div className="px-5 py-4 border-b border-[#f0ede9]">
            <h3 className="text-xs uppercase font-bold text-gray-700">Coaching Signals</h3>
          </div>
          <div className="divide-y divide-[#f0ede9]">
            <div className="px-5 py-4 flex items-start gap-3 hover:bg-[#F7F5F2]/50 transition-colors">
              <AlertCircle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900">Natasha over capacity</p>
                <p className="text-[11px] text-gray-600 mt-0.5">57/30 partners</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded">URGENT</span>
              </div>
            </div>
            <div className="px-5 py-4 flex items-start gap-3 hover:bg-[#F7F5F2]/50 transition-colors">
              <Lightbulb className="w-4 h-4 text-[#f59e0b] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900">Marcus cycle time</p>
                <p className="text-[11px] text-gray-600 mt-0.5">+8 days above avg</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">WATCH</span>
              </div>
            </div>
            <div className="px-5 py-4 flex items-start gap-3 hover:bg-[#F7F5F2]/50 transition-colors">
              <Target className="w-4 h-4 text-[#16a34a] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900">Thomas on track</p>
                <p className="text-[11px] text-gray-600 mt-0.5">92% to quota goal</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded">STRONG</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast by Rep Table */}
      <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
        <div className="px-5 py-4 border-b border-[#f0ede9]">
          <h3 className="text-xs uppercase font-bold text-gray-700">Forecast by Rep</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F5F2]">
              <tr className="border-b border-[#e8e5e1]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Rep</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">Quota</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">Committed</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">Best Case</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">Gap</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {reps.map((rep) => {
                const quotaPercentage = Math.round((rep.currentCommit / rep.quotaTarget) * 100);
                return (
                  <tr key={rep.id} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]/30 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-900">{rep.name}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(rep.quotaTarget)}</td>
                    <td className="px-5 py-3 text-right text-gray-900 font-semibold">{formatCurrency(rep.currentCommit)}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(rep.quotaTarget * 1.1)}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(rep.quotaTarget - rep.currentCommit)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${quotaPercentage >= 90 ? 'bg-[#16a34a]' : quotaPercentage >= 80 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'}`}
                            style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-8 text-right">{quotaPercentage}%</span>
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
  );

  // ==================== FORECAST VIEW ====================

  const renderForecast = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Forecast</h1>

      {/* Commit vs Target */}
      <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
        <div className="px-5 py-4 border-b border-[#f0ede9]">
          <h3 className="text-xs uppercase font-bold text-gray-700">Commit vs Target Tracker</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-xs text-gray-600 mb-1">Target</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(teamTarget)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Current Commit</p>
              <p className="text-3xl font-bold text-[#157A6E]">{formatCurrency(teamCommit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Gap</p>
              <p className="text-3xl font-bold text-[#ef4444]">{formatCurrency(commitGap)}</p>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#157A6E] transition-all"
              style={{ width: `${Math.min((teamCommit / teamTarget) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">{commitPercentage}% to target</p>
        </div>
      </div>

      {/* Historical Forecast */}
      <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
        <div className="px-5 py-4 border-b border-[#f0ede9]">
          <h3 className="text-xs uppercase font-bold text-gray-700">Historical Forecast Accuracy</h3>
        </div>
        <div className="divide-y divide-[#e8e5e1]">
          {historicalForecast.map((item) => (
            <div key={item.quarter} className="px-5 py-4 flex items-center justify-between hover:bg-[#F7F5F2]/30">
              <div>
                <p className="font-semibold text-gray-900">{item.quarter}</p>
                <p className="text-xs text-gray-600">Target: {formatCurrency(item.target)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.actual)}</p>
                <p className={`text-xs ${item.percentage >= 90 ? 'text-[#16a34a]' : 'text-[#f59e0b]'}`}>{item.percentage}% accuracy</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ==================== TEAM VIEW ====================

  const renderTeam = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Team</h1>

      {/* Rep Details */}
      <div className="grid grid-cols-1 gap-6">
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
                    <p className="font-semibold text-gray-900">{rep.name}</p>
                    <p className="text-xs text-gray-600">{rep.title}</p>
                  </div>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm font-bold text-[#157A6E]">{formatCurrency(rep.managedMRR)}</p>
                  <p className="text-xs text-gray-600">{quotaPercentage}% quota</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>

              {isExpanded && (
                <div className="px-5 py-4 border-t border-[#e8e5e1] space-y-4">
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Managed MRR</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(rep.managedMRR)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Active Deals</p>
                      <p className="text-lg font-bold text-gray-900">{rep.activeDeals}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Partner Capacity</p>
                      <p className="text-lg font-bold text-gray-900">{rep.partnerCount}/{rep.partnerCapacity}</p>
                    </div>
                  </div>

                  {/* Deals */}
                  {repDeals.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Recent Deals</p>
                      <div className="space-y-2">
                        {repDeals.slice(0, 3).map((deal) => (
                          <div key={deal.id} className="flex items-center justify-between p-2 bg-[#F7F5F2] rounded text-sm">
                            <div>
                              <p className="font-semibold text-gray-900">{deal.name}</p>
                              <p className="text-xs text-gray-600">{deal.stage}</p>
                            </div>
                            <p className="font-bold text-gray-900">{formatCurrency(deal.mrr)}</p>
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
  );

  // ==================== RELATIONSHIPS VIEW ====================

  const renderRelationships = () => {
    if (selectedAdvisor && panelOpen) {
      const advisorDeals = deals.filter(d => selectedAdvisor.deals.includes(d.id));
      const tabs = ['overview', 'personal', 'deals', 'notes', 'activity'] as const;
      return (
        <div className="space-y-0">
          <div className="mb-6">
            <button onClick={() => { setSelectedAdvisor(null); setPanelOpen(false); setInlineTab('overview'); }} className="flex items-center gap-2 text-[#157A6E] hover:underline text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Back to All Advisors</button>
            <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-[#157A6E] rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">{selectedAdvisor.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1"><h1 className="text-2xl font-bold text-gray-900">{selectedAdvisor.name}</h1>{selectedAdvisor.tier && <TierBadge tier={selectedAdvisor.tier} />}</div>
                  <p className="text-gray-600">{selectedAdvisor.title} · {selectedAdvisor.company}</p>
                  <div className="flex items-center gap-4 mt-3"><PulseBadge pulse={selectedAdvisor.pulse} size="sm" /><TrajectoryBadge trajectory={selectedAdvisor.trajectory} /><SentimentBadge tone={selectedAdvisor.tone} /><FrictionBadge level={selectedAdvisor.friction} /><DealHealthBadge health={selectedAdvisor.dealHealth} /></div>
                </div>
                <div className="text-right"><p className="text-xs text-gray-500 uppercase">MRR</p><p className="text-3xl font-bold text-[#157A6E]">${(selectedAdvisor.mrr / 1000).toFixed(1)}K</p></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-t-[10px] border border-b-0 border-[#e8e5e1] flex">
            {tabs.map(tab => (<button key={tab} onClick={() => setInlineTab(tab)} className={`flex-1 px-4 py-3 text-sm font-medium uppercase transition-colors ${inlineTab === tab ? 'text-[#157A6E] border-b-2 border-[#157A6E] bg-white' : 'text-gray-500 hover:text-gray-900 bg-gray-50'}`}>{tab}</button>))}
          </div>
          <div className="bg-white rounded-b-[10px] border border-[#e8e5e1] p-6 min-h-[500px]">
            {inlineTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div><h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">Relationship Context</h3><dl className="space-y-2 text-sm"><div className="flex justify-between"><dt className="text-gray-600">Connected Since</dt><dd className="font-medium">{selectedAdvisor.connectedSince}</dd></div><div className="flex justify-between"><dt className="text-gray-600">Best Day to Reach</dt><dd className="font-medium">{selectedAdvisor.bestDayToReach}</dd></div><div className="flex justify-between"><dt className="text-gray-600">Comm Preference</dt><dd className="font-medium">{selectedAdvisor.commPreference}</dd></div><div className="flex justify-between"><dt className="text-gray-600">Referred By</dt><dd className="font-medium">{selectedAdvisor.referredBy}</dd></div></dl></div>
                </div>
                <div className="space-y-6">
                  {selectedAdvisor.personalIntel && <div><h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">Personal Intel</h3><p className="text-sm text-gray-700">{selectedAdvisor.personalIntel}</p></div>}
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded"><p className="text-sm italic text-gray-700">"{selectedAdvisor.diagnosis}"</p></div>
                </div>
              </div>
            )}
            {inlineTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div><h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">Profile</h3><dl className="space-y-3 text-sm">{selectedAdvisor.location && <div className="flex justify-between"><dt className="text-gray-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</dt><dd className="font-medium">{selectedAdvisor.location}</dd></div>}{selectedAdvisor.birthday && <div className="flex justify-between"><dt className="text-gray-600 flex items-center gap-1.5"><Cake className="w-3.5 h-3.5" /> Birthday</dt><dd className="font-medium">{selectedAdvisor.birthday}</dd></div>}{selectedAdvisor.education && <div className="flex justify-between"><dt className="text-gray-600 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Education</dt><dd className="font-medium">{selectedAdvisor.education}</dd></div>}</dl></div>
                  {selectedAdvisor.family && <div><h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">Family</h3><p className="text-sm text-gray-700">{selectedAdvisor.family}</p></div>}
                </div>
              </div>
            )}
            {inlineTab === 'deals' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{advisorDeals.length === 0 ? <p className="text-sm text-gray-600 col-span-full">No deals found</p> : advisorDeals.map(deal => (<div key={deal.id} className="border border-[#e8e5e1] rounded-[10px] p-4"><div className="flex items-start justify-between mb-3"><h4 className="font-semibold text-gray-900">{deal.name}</h4><DealHealthBadge health={deal.health} /></div><dl className="space-y-1 text-xs text-gray-600 mb-3"><div className="flex justify-between"><dt>MRR:</dt><dd className="font-medium text-gray-900">${(deal.mrr / 1000).toFixed(1)}K</dd></div><div className="flex justify-between"><dt>Stage:</dt><dd className="font-medium text-gray-900">{deal.stage}</dd></div></dl></div>))}</div>
            )}
            {inlineTab === 'notes' && (
              <div className="max-w-2xl space-y-4">{selectedAdvisor.notes.map((note, idx) => (<div key={idx} className="p-3 bg-[#F7F5F2] rounded-lg text-sm text-gray-700">• {note}</div>))}</div>
            )}
            {inlineTab === 'activity' && (
              <div className="max-w-2xl space-y-3">{selectedAdvisor.activity.map((item, idx) => (<div key={idx} className="border-l-2 border-gray-300 pl-4 py-2"><div className="flex items-center gap-2 mb-1"><SentimentBadge tone={item.sentiment} /><span className="text-xs text-gray-500">{item.time}</span></div><p className="text-sm text-gray-700">{item.text}</p></div>))}</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Relationships</h1>
        <AdvisorTable advisors={advisors} onAdvisorClick={(id) => { handleAdvisorClick(id); setInlineTab('overview'); }} />
      </div>
    );
  };

  // ==================== PIPELINE VIEW ====================

  const renderPipeline = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>

      {/* Pipeline KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
          <p className="text-xs uppercase font-semibold text-gray-600 mb-2">Total Pipeline</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(teamPipeline)}</p>
        </div>
        <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
          <p className="text-xs uppercase font-semibold text-gray-600 mb-2">Weighted Pipeline</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(weightedPipeline)}</p>
        </div>
        <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
          <p className="text-xs uppercase font-semibold text-gray-600 mb-2">Healthy Deals</p>
          <p className="text-2xl font-bold text-[#16a34a]">{healthyPercentage}%</p>
        </div>
        <div className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
          <p className="text-xs uppercase font-semibold text-gray-600 mb-2">At Risk</p>
          <p className="text-2xl font-bold text-[#ef4444]">{atRiskPercentage}%</p>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
        <div className="px-5 py-4 border-b border-[#f0ede9]">
          <h3 className="text-xs uppercase font-bold text-gray-700">All Deals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F5F2]">
              <tr className="border-b border-[#e8e5e1]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Deal Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Rep</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700">MRR</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Stage</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Health</th>
              </tr>
            </thead>
            <tbody>
              {allDeals.slice(0, 10).map((deal) => {
                const rep = reps.find(r => r.id === deal.repId);
                return (
                  <tr key={deal.id} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]/30 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-900">{deal.name}</td>
                    <td className="px-5 py-3 text-gray-700">{rep?.name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(deal.mrr)}</td>
                    <td className="px-5 py-3 text-gray-700">{deal.stage}</td>
                    <td className="px-5 py-3"><DealHealthBadge health={deal.health} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ==================== INTELLIGENCE VIEW ====================

  const renderIntelligence = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Intelligence</h1>

      {/* Friction Insights */}
      <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
        <div className="px-5 py-4 border-b border-[#f0ede9]">
          <h3 className="text-xs uppercase font-bold text-gray-700">Friction Insights</h3>
        </div>
        <div className="divide-y divide-[#e8e5e1]">
          {frictionInsights.map((insight, idx) => (
            <div key={idx} className="px-5 py-4 flex items-center justify-between hover:bg-[#F7F5F2]/30 transition-colors">
              <div>
                <p className="font-semibold text-gray-900">{insight.issue}</p>
                <p className="text-xs text-gray-600 mt-1">{insight.count} reps affected</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                insight.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                insight.severity === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>
                {insight.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Landscape */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {competitiveLandscape.map((comp) => (
          <div key={comp.competitor} className="bg-white border border-[#e8e5e1] rounded-[10px] p-5">
            <h4 className="font-bold text-gray-900 mb-4">{comp.competitor}</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">{comp.dealCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Pipeline at Risk</p>
                <p className="text-lg font-bold text-[#ef4444]">{formatCurrency(comp.pipelineAtRisk)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Diagnostic Matrix */}
      <div className="bg-white border border-[#e8e5e1] rounded-[10px]">
        <div className="px-5 py-4 border-b border-[#f0ede9]">
          <h3 className="text-xs uppercase font-bold text-gray-700">Diagnostic Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F5F2]">
              <tr className="border-b border-[#e8e5e1]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Pattern</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Reps Affected</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Impact</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {diagnosticMatrix.map((item, idx) => (
                <tr key={idx} className="border-b border-[#e8e5e1] hover:bg-[#F7F5F2]/30 transition-colors">
                  <td className="px-5 py-3 font-semibold text-gray-900">{item.pattern}</td>
                  <td className="px-5 py-3 text-gray-700">{item.repsAffected}</td>
                  <td className="px-5 py-3 text-[#ef4444] font-medium">{item.impact}</td>
                  <td className="px-5 py-3 text-[#157A6E] font-medium">{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="flex h-screen bg-[#F7F5F2]">
      {/* Sidebar */}
      <Sidebar
        items={NAV_ITEMS_LEADER}
        activeView={activeView}
        onViewChange={setActiveView}
        role="leader"
        userName={userName}
        userInitials={userInitials}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}
        <TopBar
          nudges={nudges}
          userName={userName}
          userInitials={userInitials}
          pageTitle={activeView === 'command-center' ? 'Command Center' : activeView === 'forecast' ? 'Forecast' : activeView === 'team' ? 'Team' : activeView === 'relationships' ? 'Relationships' : activeView === 'pipeline' ? 'Pipeline' : 'Intelligence'}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {activeView === 'command-center' && renderCommandCenter()}
              {activeView === 'forecast' && renderForecast()}
              {activeView === 'team' && renderTeam()}
              {activeView === 'relationships' && renderRelationships()}
              {activeView === 'pipeline' && renderPipeline()}
              {activeView === 'intelligence' && renderIntelligence()}
            </div>
            <AIChat role="leader" selectedAdvisor={selectedAdvisor} />
          </div>
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
