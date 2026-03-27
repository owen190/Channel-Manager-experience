'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AIChat } from '@/components/shared/AIChat';
import { KPICard } from '@/components/shared/KPICard';
import { MorningBriefing } from '@/components/shared/MorningBriefing';
import { AdvisorTable } from '@/components/shared/AdvisorTable';
import { AdvisorPanel } from '@/components/shared/AdvisorPanel';
import { IntegrationBadges } from '@/components/shared/IntegrationBadges';
import { DealHealthBadge } from '@/components/shared/DealHealthBadge';
import { NAV_ITEMS_LEADER, QUARTER_END, DAYS_REMAINING, STAGE_WEIGHTS } from '@/lib/constants';
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

  // Leader info
  const userName = 'Bobby H.';
  const userInitials = 'BH';

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
      repName: 'Angelo DiMartino',
      advisorName: 'James Wu',
      mrr: 7400,
      reason: 'Deal in early stage but close date set aggressively - technical evaluation still pending',
      status: 'pending',
      requestDate: '2026-03-25'
    },
    {
      dealId: 'deal-6',
      dealName: 'FiberFirst Signal Quality Improvement',
      repName: 'Angelo DiMartino',
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
      repsAffected: 'Angelo, Derek W',
      impact: '$70K risk',
      action: 'Escalate quoting SLA'
    },
    {
      pattern: 'Over-capacity',
      repsAffected: 'Ernie',
      impact: 'Burnout risk',
      action: 'Redistribute 15+ partners'
    },
    {
      pattern: 'Under-loaded',
      repsAffected: 'Derek W',
      impact: 'Lost opportunity',
      action: 'Assign 10 from Ernie'
    },
    {
      pattern: 'Forecast gap widening',
      repsAffected: 'Chris H, Angelo',
      impact: '$89K gap',
      action: 'Weekly commit reviews'
    }
  ];

  // Stage vs timeline mismatch alerts
  const stageMismatchAlerts = [
    { rep: 'Angelo', dealCount: 3, stage: 'Discovery', daysInStage: 30 },
    { rep: 'Derek Walker', dealCount: 2, stage: 'Proposal', daysInStage: 21 },
    { rep: 'Chris Hewitt', dealCount: 1, stage: 'Negotiate', daysInStage: 14 }
  ];

  // CRM hygiene - reps with stale notes
  const crmHygiene = [
    { rep: 'Angelo DiMartino', dealsWithStaleNotes: 3 },
    { rep: 'Derek Walker', dealsWithStaleNotes: 2 },
    { rep: 'Ernie Vasquez', dealsWithStaleNotes: 1 }
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

  // ==================== RENDER VIEWS ====================

  const renderCommandCenter = () => (
    <div className="space-y-8">
      {/* Quarter End Alert Banner */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-6 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">â°</span>
          <div>
            <h3 className="font-bold text-red-900 text-lg">
              5 Days Remaining in Q1 2026
            </h3>
            <p className="text-red-800">
              Team needs <span className="font-bold">${formatCurrency(commitGap).slice(1)}</span> to hit <span className="font-bold">$1.2M</span> target
            </p>
          </div>
        </div>
      </div>

      {/* Team KPI Cards */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Team KPIs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Team MRR"
            value={formatCurrency(teamMRR)}
            change={`+${mrrChange}%`}
            changeType="positive"
          />
          <KPICard
            label="Team Pipeline"
            value={formatCurrency(teamPipeline)}
            detail={<div className="text-sm text-gray-600">Weighted: {formatCurrency(weightedPipeline)}</div>}
          />
          <KPICard
            label="Forecast Accuracy"
            value={`${forecastAccuracy}%`}
            detail={<div className="text-sm text-gray-600">Last quarter close rate</div>}
          />
          <KPICard
            label="Active Deals"
            value={activeDealCount.toString()}
            detail={<div className="text-sm text-gray-600">Across 6 reps</div>}
          />
        </div>
      </div>

      {/* Team Snapshot Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Team Snapshot (6 Reps)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reps.map((rep) => {
            const repDeals = allDeals.filter(d => d.repId === rep.id);
            const repCommitPercentage = Math.round((rep.currentCommit / rep.commitTarget) * 100);
            const capacityPercentage = Math.round((rep.partnerCount / rep.partnerCapacity) * 100);
            const isOverCapacity = rep.partnerCount > rep.partnerCapacity;

            return (
              <div
                key={rep.id}
                className="bg-white border border-tcs-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveView('team')}
              >
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900">{rep.name}</h3>
                  <p className="text-xs text-gray-600">{rep.title}</p>
                </div>

                {/* Managed MRR */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700">Managed MRR</span>
                    <span className="text-sm font-bold text-tcs-teal">{formatCurrency(rep.managedMRR)}</span>
                  </div>
                </div>

                {/* Active Deals */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Active Deals: {rep.activeDeals}
                  </div>
                </div>

                {/* Commit vs Target Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700">Commit vs Target</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${getRepStatusBadgeColor(repCommitPercentage)}`}>
                      {repCommitPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${repCommitPercentage > 90 ? 'bg-green-500' : repCommitPercentage >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(repCommitPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Partner Capacity */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700">Partner Capacity</span>
                    <span className="text-xs font-bold">{rep.partnerCount}/{rep.partnerCapacity}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={getCapacityColor(rep.partnerCount, rep.partnerCapacity)}
                      style={{ width: `${Math.min((rep.partnerCount / rep.partnerCapacity) * 100, 100)}%` }}
                    />
                  </div>
                  {isOverCapacity && <p className="text-xs text-red-600 font-semibold mt-1">Over Capacity â ï¸</p>}
                </div>

                {/* Partner Tier Breakdown */}
                <div className="mb-4 flex gap-2">
                  <div className="flex-1 text-center p-2 bg-blue-50 rounded text-xs">
                    <div className="font-bold text-blue-900">{rep.top10}</div>
                    <div className="text-blue-700 text-xs">Top 10</div>
                  </div>
                  <div className="flex-1 text-center p-2 bg-purple-50 rounded text-xs">
                    <div className="font-bold text-purple-900">{rep.next20}</div>
                    <div className="text-purple-700 text-xs">Next 20</div>
                  </div>
                  <div className="flex-1 text-center p-2 bg-gray-50 rounded text-xs">
                    <div className="font-bold text-gray-900">{rep.other}</div>
                    <div className="text-gray-700 text-xs">Other</div>
                  </div>
                </div>

                {/* Top Concern */}
                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-xs text-orange-900">{rep.topConcern}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VP Morning Briefing */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">VP Morning Briefing</h2>
        <MorningBriefing
          actNow={leaderBriefing.actNow}
          capitalize={leaderBriefing.capitalize}
          nurture={leaderBriefing.nurture}
        />
      </div>

      {/* Override Approval Queue */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Override Approval Queue</h2>
        <div className="space-y-3">
          {overrideRequests.filter(r => r.status === 'pending').map((override) => (
            <div key={override.dealId} className="bg-white border border-tcs-border rounded-lg p-4 flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{override.dealName}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">{override.repName}</span> | {override.advisorName}
                </p>
                <p className="text-sm text-gray-700 mt-2">{override.reason}</p>
                <p className="text-xs text-gray-500 mt-2">Requested: {override.requestDate}</p>
              </div>
              <div className="ml-4 flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-600">MRR</p>
                  <p className="font-bold text-lg text-tcs-teal">{formatCurrency(override.mrr)}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-100 text-green-800 rounded font-semibold text-sm hover:bg-green-200 transition-colors">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-100 text-red-800 rounded font-semibold text-sm hover:bg-red-200 transition-colors">
                    Deny
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Status */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Integration Status</h2>
        <IntegrationBadges />
      </div>
    </div>
  );

  const renderForecast = () => (
    <div className="space-y-8">
      {/* Commit vs Target Tracker */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Commit vs Target Tracker</h2>
        <div className="bg-white border border-tcs-border rounded-lg p-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Team Commit</p>
              <p className="text-4xl font-bold text-tcs-teal">{formatCurrency(teamCommit)}</p>
              <p className="text-xs text-gray-600 mt-1">Target: {formatCurrency(teamTarget)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-semibold">Gap to Target</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(commitGap)}</p>
              <p className="text-xs text-gray-600 mt-1">{commitPercentage}% of target</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-2">
                <span>Current Commit</span>
                <span>{commitPercentage}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-tcs-teal"
                  style={{ width: `${Math.min(commitPercentage, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-2">
                <span>Weighted Pipeline</span>
                <span className="text-tcs-teal">{formatCurrency(weightedPipeline)}</span>
              </div>
              <p className="text-xs text-gray-600">Best Case: {formatCurrency(bestCase)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Rep Forecast Table */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Per-Rep Forecast</h2>
        <div className="bg-white border border-tcs-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-tcs-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Rep</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Target</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Commit</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">%</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Weighted Pipe</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Gap</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {reps.map((rep) => {
                const percentage = Math.round((rep.currentCommit / rep.commitTarget) * 100);
                const gap = rep.commitTarget - rep.currentCommit;
                const repPipeline = allDeals
                  .filter(d => d.repId === rep.id)
                  .reduce((sum, deal) => {
                    const stageWeight = STAGE_WEIGHTS.find(sw => sw.stage === deal.stage)?.weight || 0;
                    return sum + (deal.mrr * stageWeight);
                  }, 0);

                let statusColor = 'bg-green-100 text-green-800';
                let statusLabel = 'Strong';
                if (percentage < 70) {
                  statusColor = 'bg-red-100 text-red-800';
                  statusLabel = 'Behind';
                } else if (percentage < 80) {
                  statusColor = 'bg-orange-100 text-orange-800';
                  statusLabel = 'At Risk';
                } else if (percentage < 90) {
                  statusColor = 'bg-yellow-100 text-yellow-800';
                  statusLabel = 'On Track';
                }

                return (
                  <tr key={rep.id} className="border-b border-tcs-border hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{rep.name}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(rep.commitTarget)}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(rep.currentCommit)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{percentage}%</td>
                    <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(repPipeline)}</td>
                    <td className="px-6 py-4 text-right text-red-600 font-medium">{formatCurrency(gap)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Forecast Tracker */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Historical Forecast Tracker (Last 4 Quarters)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {historicalForecast.map((entry) => (
            <div key={entry.quarter} className="bg-white border border-tcs-border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{entry.quarter}</h4>
              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-xs text-gray-600">Target</p>
                  <p className="font-bold text-gray-900">{formatCurrency(entry.target)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Actual</p>
                  <p className="font-bold text-gray-900">{formatCurrency(entry.actual)}</p>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={entry.percentage >= 90 ? 'bg-green-500' : entry.percentage >= 80 ? 'bg-amber-500' : 'bg-red-500'}
                  style={{ width: `${entry.percentage}%` }}
                />
              </div>
              <p className="text-sm font-bold text-gray-900">{entry.percentage}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weighted Pipeline by Stage */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Weighted Pipeline by Stage</h2>
        <div className="bg-white border border-tcs-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-tcs-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Stage</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Raw Value</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Weight %</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Weighted Value</th>
              </tr>
            </thead>
            <tbody>
              {STAGE_WEIGHTS.map((sw) => {
                const stageDeals = allDeals.filter(d => d.stage === sw.stage);
                const rawValue = stageDeals.reduce((sum, d) => sum + d.mrr, 0);
                const weightedValue = rawValue * sw.weight;
                return (
                  <tr key={sw.stage} className="border-b border-tcs-border hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{sw.stage}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(rawValue)}</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-semibold">{(sw.weight * 100).toFixed(0)}%</td>
                    <td className="px-6 py-4 text-right text-tcs-teal font-semibold">{formatCurrency(weightedValue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage vs Timeline Mismatch Alerts */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Stage vs Timeline Mismatch Alerts</h2>
        <div className="space-y-3">
          {stageMismatchAlerts.map((alert, idx) => (
            <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <span className="text-2xl">â ï¸</span>
              <div className="flex-1">
                <h4 className="font-bold text-orange-900">{alert.rep}</h4>
                <p className="text-sm text-orange-800 mt-1">
                  {alert.dealCount} deal{alert.dealCount > 1 ? 's' : ''} in <span className="font-semibold">{alert.stage}</span> for {alert.daysInStage}+ days
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast Override Requests */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Forecast Override Requests</h2>
        <div className="space-y-3">
          {overrideRequests.filter(r => r.status === 'pending').map((override) => (
            <div key={override.dealId} className="bg-white border border-tcs-border rounded-lg p-4 flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{override.dealName}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">{override.repName}</span> | {override.advisorName}
                </p>
                <p className="text-sm text-gray-700 mt-2">{override.reason}</p>
              </div>
              <div className="ml-4 flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-600">MRR</p>
                  <p className="font-bold text-lg text-tcs-teal">{formatCurrency(override.mrr)}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-100 text-green-800 rounded font-semibold text-sm hover:bg-green-200 transition-colors">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-100 text-red-800 rounded font-semibold text-sm hover:bg-red-200 transition-colors">
                    Deny
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-8">
      {/* Team Capacity Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Team Capacity Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reps.map((rep) => {
            const capacityPercentage = (rep.partnerCount / rep.partnerCapacity) * 100;
            const isOverCapacity = rep.partnerCount > rep.partnerCapacity;

            return (
              <div key={rep.id} className="bg-white border border-tcs-border rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900">{rep.name}</h3>
                  <p className="text-xs text-gray-600">{rep.title}</p>
                </div>

                {/* Capacity Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700">Capacity</span>
                    <span className="text-xs font-bold">{rep.partnerCount}/{rep.partnerCapacity}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={getCapacityColor(rep.partnerCount, rep.partnerCapacity)}
                      style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                    />
                  </div>
                  {isOverCapacity && (
                    <p className="text-xs text-red-600 font-bold mt-2">â ï¸ OVER CAPACITY</p>
                  )}
                </div>

                {/* Tier Breakdown */}
                <div className="mb-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Top 10:</span>
                    <span className="font-bold text-blue-600">{rep.top10}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Next 20:</span>
                    <span className="font-bold text-purple-600">{rep.next20}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Other:</span>
                    <span className="font-bold text-gray-600">{rep.other}</span>
                  </div>
                </div>

                {/* MRR */}
                <div className="mb-4 p-3 bg-tcs-bg rounded">
                  <p className="text-xs text-gray-600">Managed MRR</p>
                  <p className="font-bold text-lg text-tcs-teal">{formatCurrency(rep.managedMRR)}</p>
                </div>

                {/* Engagement Score */}
                <div className="mb-4">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    rep.engagementScore === 'Strong' ? 'bg-green-100 text-green-800' :
                    rep.engagementScore === 'Steady' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {rep.engagementScore} Engagement
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">{rep.topConcern}</p>
                </div>

                {/* Prep 1:1 Button */}
                <button className="w-full mt-4 px-4 py-2 bg-tcs-teal text-white rounded font-semibold text-sm hover:bg-opacity-90 transition-colors">
                  Prep 1:1 Meeting
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Leaderboard */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Team Leaderboard</h2>
        <div className="bg-white border border-tcs-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-tcs-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Rep</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">MRR</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Deals Won (QTD)</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Win Rate</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Avg Cycle</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Commit %</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {reps.map((rep) => {
                const commitPercentage = Math.round((rep.currentCommit / rep.commitTarget) * 100);
                return (
                  <tr key={rep.id} className="border-b border-tcs-border hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{rep.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-tcs-teal">{formatCurrency(rep.managedMRR)}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{rep.dealsWonQTD}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{rep.winRate}%</td>
                    <td className="px-6 py-4 text-right text-gray-700">{rep.avgCycle} days</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{commitPercentage}%</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        rep.engagementScore === 'Strong' ? 'bg-green-100 text-green-800' :
                        rep.engagementScore === 'Steady' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {rep.engagementScore}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRM Hygiene Summary */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">CRM Hygiene Summary (Stale Notes &gt;14 days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {crmHygiene.map((item) => (
            <div key={item.rep} className="bg-white border border-tcs-border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900">{item.rep}</h4>
              <div className="mt-3 p-3 bg-orange-50 rounded">
                <p className="text-2xl font-bold text-orange-600">{item.dealsWithStaleNotes}</p>
                <p className="text-xs text-orange-700 mt-1">Deals with stale notes</p>
              </div>
              <button className="w-full mt-4 px-3 py-2 bg-orange-100 text-orange-800 rounded font-semibold text-xs hover:bg-orange-200 transition-colors">
                Review & Update
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRelationships = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Key Partner Relationships</h2>
      <AdvisorTable
        advisors={advisors}
        onAdvisorClick={(id: string) => {
          const adv = advisors.find(a => a.id === id);
          if (adv) { setSelectedAdvisor(adv); setPanelOpen(true); }
        }}
      />
      {selectedAdvisor && panelOpen && (
        <AdvisorPanel
          advisor={selectedAdvisor}
          deals={deals.filter(d => selectedAdvisor.deals.includes(d.id))}
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );

  const renderPipeline = () => (
    <div className="space-y-8">
      {/* Team Pipeline Overview KPIs */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Team Pipeline Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Pipeline"
            value={formatCurrency(teamPipeline)}
          />
          <KPICard
            label="Weighted Pipeline"
            value={formatCurrency(weightedPipeline)}
          />
          <KPICard
            label="Healthy Deals"
            value={`${healthyPercentage}%`}
            change={`${healthyDeals} deals`}
            changeType="positive"
          />
          <KPICard
            label="At Risk Deals"
            value={`${atRiskPercentage}%`}
            change={`${atRiskDeals} deals`}
            changeType="negative"
          />
        </div>
      </div>

      {/* Pipeline by Rep (Expandable) */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pipeline by Rep</h2>
        <div className="space-y-3">
          {reps.map((rep) => {
            const repDeals = allDeals.filter(d => d.repId === rep.id);
            const repPipeline = repDeals.reduce((sum, d) => sum + d.mrr, 0);
            const isExpanded = expandedReps.includes(rep.id);

            return (
              <div key={rep.id} className="border border-tcs-border rounded-lg overflow-hidden">
                {/* Header - Expandable */}
                <button
                  onClick={() => toggleRepExpansion(rep.id)}
                  className="w-full bg-white hover:bg-gray-50 p-4 flex justify-between items-center transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <span className="text-lg">{isExpanded ? 'â¼' : 'â¶'}</span>
                    <div>
                      <h4 className="font-bold text-gray-900">{rep.name}</h4>
                      <p className="text-xs text-gray-600">
                        {repDeals.length} deals | {formatCurrency(repPipeline)} pipeline
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-lg text-tcs-teal">{formatCurrency(repPipeline)}</span>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-tcs-border p-4 space-y-3">
                    {repDeals.slice(0, 4).map((deal) => {
                      const advisor = advisors.find(a => a.id === deal.advisorId);
                      const daysOldColor = deal.daysInStage > 30 ? 'text-red-600' : deal.daysInStage > 14 ? 'text-orange-600' : 'text-gray-600';

                      return (
                        <div key={deal.id} className="bg-white border border-tcs-border rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-semibold text-gray-900 text-sm">{deal.name}</h5>
                              <p className="text-xs text-gray-600">{advisor?.name}</p>
                            </div>
                            <DealHealthBadge health={deal.health} />
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                            <div>
                              <span className="text-gray-600">MRR</span>
                              <p className="font-bold">{formatCurrency(deal.mrr)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Stage</span>
                              <p className="font-bold">{deal.stage}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Probability</span>
                              <p className="font-bold">{deal.probability}%</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Days in Stage</span>
                              <p className={`font-bold ${daysOldColor}`}>{deal.daysInStage}d</p>
                            </div>
                          </div>
                          {deal.actionItems && deal.actionItems.length > 0 && (
                            <div className="text-xs space-y-1">
                              {deal.actionItems.slice(0, 2).map((action) => (
                                <div key={action.id} className={`flex justify-between items-start ${
                                  action.status === 'overdue' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  <span className="font-medium">{action.text}</span>
                                  <span className="text-xs ml-2">{action.daysOld}d</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {repDeals.length > 4 && (
                      <p className="text-xs text-gray-600 text-center py-2">
                        +{repDeals.length - 4} more deal{repDeals.length - 4 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderIntelligence = () => (
    <div className="space-y-8">
      {/* Team Pulse Distribution */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Team Pulse Distribution (Aggregated)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(teamPulseDistribution).map(([pulse, count]) => {
            const colors: Record<string, { bg: string; text: string }> = {
              Strong: { bg: 'bg-green-100', text: 'text-green-800' },
              Steady: { bg: 'bg-blue-100', text: 'text-blue-800' },
              Rising: { bg: 'bg-purple-100', text: 'text-purple-800' },
              Fading: { bg: 'bg-orange-100', text: 'text-orange-800' },
              Flatline: { bg: 'bg-red-100', text: 'text-red-800' }
            };

            return (
              <div key={pulse} className={`${colors[pulse].bg} rounded-lg p-4 text-center`}>
                <p className={`text-3xl font-bold ${colors[pulse].text}`}>{count}</p>
                <p className={`text-sm font-semibold ${colors[pulse].text} mt-1`}>{pulse}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Friction Insights */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Friction Insights (Team-Wide)</h2>
        <div className="space-y-3">
          {frictionInsights.map((insight, idx) => {
            const severityColors: Record<string, string> = {
              HIGH: 'border-l-red-500 bg-red-50',
              MODERATE: 'border-l-orange-500 bg-orange-50',
              LOW: 'border-l-yellow-500 bg-yellow-50'
            };

            return (
              <div key={idx} className={`border-l-4 ${severityColors[insight.severity]} rounded-lg p-4`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{insight.issue}</h4>
                    <p className="text-sm text-gray-700 mt-1">{insight.count} advisors affected</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    insight.severity === 'HIGH' ? 'bg-red-200 text-red-800' :
                    insight.severity === 'MODERATE' ? 'bg-orange-200 text-orange-800' :
                    'bg-yellow-200 text-yellow-800'
                  }`}>
                    {insight.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Competitive Landscape */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Competitive Landscape</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {competitiveLandscape.map((comp) => (
            <div key={comp.competitor} className="bg-white border border-tcs-border rounded-lg p-4">
              <h4 className="font-bold text-gray-900">{comp.competitor}</h4>
              <div className="mt-3 space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Active Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{comp.dealCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Pipeline at Risk</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(comp.pipelineAtRisk)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostic Matrix */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Diagnostic Matrix (Team-Level)</h2>
        <div className="bg-white border border-tcs-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-tcs-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Pattern</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Reps Affected</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Impact</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {diagnosticMatrix.map((item, idx) => (
                <tr key={idx} className="border-b border-tcs-border hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{item.pattern}</td>
                  <td className="px-6 py-4 text-gray-700">{item.repsAffected}</td>
                  <td className="px-6 py-4 text-red-600 font-medium">{item.impact}</td>
                  <td className="px-6 py-4 text-tcs-teal font-medium">{item.action}</td>
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
    <div className="flex h-screen bg-tcs-bg">
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
      <div className="flex-1 flex flex-col">
        {/* TopBar */}
        <TopBar
          nudges={nudges}
          userName={userName}
          userInitials={userInitials}
          searchPlaceholder="Search reps, deals, advisors..."
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'command-center' && renderCommandCenter()}
          {activeView === 'forecast' && renderForecast()}
          {activeView === 'team' && renderTeam()}
          {activeView === 'relationships' && renderRelationships()}
          {activeView === 'pipeline' && renderPipeline()}
          {activeView === 'intelligence' && renderIntelligence()}
        </div>
      </div>

      {/* AI Chat */}
      <AIChat role="leader" />
    </div>
  );
}
