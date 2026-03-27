'use client';

import { useState, useMemo } from 'react';
import { Clock, AlertTriangle, Flag } from 'lucide-react';
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

import { advisors } from '@/lib/data/advisors';
import { deals } from '@/lib/data/deals';
import { managerNudges } from '@/lib/data/nudges';
import { managerBriefing } from '@/lib/data/briefings';
import { NAV_ITEMS_MANAGER, STAGE_WEIGHTS, QUARTER_END, DAYS_REMAINING } from '@/lib/constants';
import { Advisor, Deal, DealHealth, FrictionLevel, DiagnosticRow } from '@/lib/types';

export default function ManagerPage() {
  const [activeView, setActiveView] = useState('command-center');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedKPI, setExpandedKPI] = useState<string | null>(null);
  const [dealFilter, setDealFilter] = useState({ health: 'all', stage: 'all' });

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

  const quarterGap = 1200000 - 184200; // $1.2M target - total MRR

  // Weighted pipeline calculation
  const weightedPipeline = useMemo(() => {
    return deals.reduce((sum, deal) => {
      const weight = STAGE_WEIGHTS.find(w => w.stage === deal.stage)?.weight || 0;
      return sum + (deal.mrr * weight);
    }, 0);
  }, []);

  // Handles for advisor selection
  const handleAdvisorClick = (advisorId: string) => {
    const advisor = advisors.find(a => a.id === advisorId);
    if (advisor) {
      setSelectedAdvisor(advisor);
      setPanelOpen(true);
    }
  };

  // Pulse distribution
  const pulseDistribution = {
    Strong: advisors.filter(a => a.pulse === 'Strong').length,
    Steady: advisors.filter(a => a.pulse === 'Steady').length,
    Rising: advisors.filter(a => a.pulse === 'Rising').length,
    Fading: advisors.filter(a => a.pulse === 'Fading').length,
    Flatline: advisors.filter(a => a.pulse === 'Flatline').length,
  };

  // Trajectory distribution
  const trajectoryDistribution = {
    Accelerating: advisors.filter(a => a.trajectory === 'Accelerating').length,
    Climbing: advisors.filter(a => a.trajectory === 'Climbing').length,
    Stable: advisors.filter(a => a.trajectory === 'Stable').length,
    Slipping: advisors.filter(a => a.trajectory === 'Slipping').length,
    Freefall: advisors.filter(a => a.trajectory === 'Freefall').length,
  };

  // Sentiment overview
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

  // Deal health summary
  const dealHealthCounts = {
    Healthy: deals.filter(d => d.health === 'Healthy').length,
    Monitor: deals.filter(d => d.health === 'Monitor').length,
    'At Risk': deals.filter(d => d.health === 'At Risk').length,
    Stalled: deals.filter(d => d.health === 'Stalled').length,
  };

  // Supplier friction insights
  const frictionInsights = [
    { issue: 'Quoting turnaround >72hrs', advisorCount: 4, advisorNames: ['Tom Bradley', 'Alex Morgan', 'Nina Patel', 'Chris Donovan'], severity: 'High' as FrictionLevel },
    { issue: 'Install timelines not met', advisorCount: 3, advisorNames: ['Tom Bradley', 'Alex Morgan', 'Nina Patel'], severity: 'Moderate' as FrictionLevel },
    { issue: 'Post-sale support gaps', advisorCount: 2, advisorNames: ['Nina Patel', 'Chris Donovan'], severity: 'Moderate' as FrictionLevel },
    { issue: 'Training materials outdated', advisorCount: 1, advisorNames: ['Chris Donovan'], severity: 'Low' as FrictionLevel },
  ];

  // Diagnostic matrix
  const diagnosticMatrix: DiagnosticRow[] = advisors.map(a => ({
    advisor: a.name,
    pulse: a.pulse,
    dealHealth: a.dealHealth,
    friction: a.friction,
    diagnosis: a.diagnosis,
  }));

  // Stage/Timeline mismatch alerts
  const stageTimelineMismatches = deals.filter(d => {
    const closeDate = new Date(d.closeDate);
    const now = new Date('2026-03-26');
    const daysUntilClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilClose <= 5 && ['Discovery', 'Qualifying'].includes(d.stage);
  });

  // Filtered deals for pipeline view
  const filteredDeals = deals.filter(d => {
    const healthMatch = dealFilter.health === 'all' || d.health === dealFilter.health;
    const stageMatch = dealFilter.stage === 'all' || d.stage === dealFilter.stage;
    return healthMatch && stageMatch;
  });

  // Closing this month
  const closingThisMonth = deals.filter(d => {
    const closeDate = new Date(d.closeDate);
    return closeDate.getMonth() === 2 && closeDate.getFullYear() === 2026;
  });

  // Days in stage color logic
  const getDaysInStageColor = (daysInStage: number) => {
    if (daysInStage < 7) return 'text-green-600 bg-green-50';
    if (daysInStage < 14) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  // Action item aging color
  const getActionItemColor = (daysOld: number) => {
    if (daysOld === 0) return 'text-green-600 bg-green-50';
    if (daysOld <= 5) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  // Last modified hygiene check
  const isHygieneIssue = (lastModified: string) => {
    const lastModDate = new Date(lastModified);
    const now = new Date('2026-03-26');
    const daysSince = Math.ceil((now.getTime() - lastModDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince > 14;
  };

  // Strategic KPIs
  const strategicKPIs = {
    retention: '94%',
    revenueGrowth: '+12.4%',
    engagement: avgEngagement,
    pipelineVelocity: '+8.3%',
  };

  // Quota tracking
  const quotaTarget = 1200000;
  const quotaProgress = (totalMRR / quotaTarget) * 100;

  // Stalled deals count
  const stalledDealsCount = deals.filter(d => d.stage === 'Stalled').length;

  return (
    <div className="flex h-screen bg-tcs-bg">
      {/* Sidebar */}
      <Sidebar
        items={NAV_ITEMS_MANAGER}
        activeView={activeView}
        onViewChange={setActiveView}
        role="manager"
        userName="Eric C."
        userInitials="EC"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar nudges={managerNudges} userName="Eric C." userInitials="EC" />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {/* ========== COMMAND CENTER VIEW ========== */}
            {activeView === 'command-center' && (
              <div className="space-y-8">
                {/* Quarter Alert Banner */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-4">
                  <div className="text-red-500"><Clock className="w-10 h-10" /></div>
                  <div>
                    <h2 className="font-bold text-lg text-red-900 mb-1">
                      {DAYS_REMAINING} Days Remaining in Q1 2026
                    </h2>
                    <p className="text-red-700">
                      ${(quarterGap / 1000).toFixed(1)}K gap to $1.2M target
                    </p>
                  </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <KPICard
                    label="Total MRR"
                    value={`$${(totalMRR / 1000).toFixed(1)}K`}
                    change="+8.3% vs last month"
                    changeType="positive"
                    detail={
                      <div>
                        <h4 className="font-semibold mb-3">Advisor MRR Breakdown</h4>
                        <table className="w-full text-sm">
                          <thead className="border-b">
                            <tr>
                              <th className="text-left pb-2">Advisor</th>
                              <th className="text-right pb-2">MRR</th>
                            </tr>
                          </thead>
                          <tbody className="space-y-1">
                            {advisors.sort((a, b) => b.mrr - a.mrr).slice(0, 5).map(a => (
                              <tr key={a.id}>
                                <td className="py-1">
                                  <span
                                    className="text-tcs-teal hover:underline cursor-pointer"
                                    onClick={() => handleAdvisorClick(a.id)}
                                  >
                                    {a.name}
                                  </span>
                                </td>
                                <td className="text-right font-semibold">${(a.mrr / 1000).toFixed(1)}K</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    }
                  />

                  <KPICard
                    label="Active Deals"
                    value={activeDealCount.toString()}
                    change="+5 new this week"
                    changeType="positive"
                    detail={
                      <div>
                        <h4 className="font-semibold mb-3">Deals by Stage</h4>
                        <div className="space-y-2 text-sm">
                          {['Negotiating', 'Proposal', 'Qualifying', 'Discovery'].map(stage => (
                            <div key={stage} className="flex justify-between">
                              <span>{stage}:</span>
                              <strong>{deals.filter(d => d.stage === stage).length}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                  />

                  <KPICard
                    label="Healthy Pipeline"
                    value={`${healthyPercent}%`}
                    change="-3% from last week"
                    changeType="negative"
                    detail={
                      <div>
                        <h4 className="font-semibold mb-3">Health Breakdown</h4>
                        <div className="space-y-2 text-sm">
                          {Object.entries(dealHealthCounts).map(([health, count]) => (
                            <div key={health} className="flex justify-between">
                              <span>{health}:</span>
                              <strong>{count} deals</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                  />

                  <KPICard
                    label="Avg Engagement"
                    value={avgEngagement}
                    change={`Improved from Steady`}
                    changeType="positive"
                    detail={
                      <div>
                        <h4 className="font-semibold mb-3">Engagement Distribution</h4>
                        <div className="space-y-2 text-sm">
                          {Object.entries(pulseDistribution).map(([pulse, count]) => (
                            <div key={pulse} className="flex justify-between">
                              <span>{pulse}:</span>
                              <strong>{count} advisors</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </div>

                {/* Morning Briefing */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Morning Briefing</h2>
                  <MorningBriefing
                    actNow={managerBriefing.actNow}
                    capitalize={managerBriefing.capitalize}
                    nurture={managerBriefing.nurture}
                  />
                </div>

                {/* Today's Calendar */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Today's Calendar</h3>
                  <div className="space-y-3">
                    {[
                      { time: '9:00 AM', title: 'Strategy call with Sarah Chen', type: 'call' },
                      { time: '10:30 AM', title: 'Pipeline review', type: 'meeting' },
                      { time: '1:00 PM', title: 'Nina Patel follow-up', type: 'call' },
                      { time: '3:30 PM', title: 'Training webinar', type: 'training' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-3 hover:bg-tcs-bg rounded-lg transition-colors">
                        <div className="text-sm font-semibold text-tcs-teal min-w-max">{item.time}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {advisors.slice(0, 5).map((advisor, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 hover:bg-tcs-bg rounded-lg transition-colors">
                        <SentimentBadge tone={advisor.tone} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{advisor.activity[0]?.text || 'No activity'}</p>
                          <p className="text-xs text-gray-500">{advisor.activity[0]?.time || ''} •
                            <span
                              className="text-tcs-teal hover:underline cursor-pointer ml-1"
                              onClick={() => handleAdvisorClick(advisor.id)}
                            >
                              {advisor.name}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ========== INTELLIGENCE HUB VIEW ========== */}
            {activeView === 'intelligence' && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">Intelligence Hub</h1>

                {/* Pulse Distribution */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Pulse Distribution</h2>
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(pulseDistribution).map(([pulse, count]) => (
                      <div key={pulse} className="text-center">
                        <div className="text-3xl font-bold text-tcs-teal mb-2">{count}</div>
                        <div className="text-xs uppercase text-gray-600">{pulse}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trajectory Trends */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Trajectory Trends</h2>
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(trajectoryDistribution).map(([trajectory, count]) => (
                      <div key={trajectory} className="text-center">
                        <div className="text-3xl font-bold text-tcs-teal mb-2">{count}</div>
                        <div className="text-xs uppercase text-gray-600">{trajectory}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sentiment Overview */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg border border-tcs-border p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Tone Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(sentimentCounts).map(([tone, count]) => (
                        <div key={tone} className="flex justify-between text-sm">
                          <span>{tone}</span>
                          <strong>{count} advisors</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-tcs-border p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Intent Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(intentCounts).map(([intent, count]) => (
                        <div key={intent} className="flex justify-between text-sm">
                          <span>{intent}</span>
                          <strong>{count} advisors</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-tcs-border p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Friction Level</h3>
                    <div className="space-y-2">
                      {Object.entries(frictionCounts).map(([level, count]) => (
                        <div key={level} className="flex justify-between text-sm">
                          <span>{level}</span>
                          <strong>{count} advisors</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Deal Health Summary */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Deal Health Summary</h2>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(dealHealthCounts).map(([health, count]) => (
                      <div key={health} className="text-center">
                        <div className="text-3xl font-bold text-tcs-teal mb-2">{count}</div>
                        <div className="text-xs uppercase text-gray-600">{health}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supplier Friction Insights */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Supplier Friction Insights</h2>
                  <div className="space-y-3">
                    {frictionInsights.map((insight, idx) => (
                      <div key={idx} className="flex items-start justify-between p-4 bg-tcs-bg rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{insight.issue}</p>
                          <div className="text-sm text-gray-600 mt-2">
                            {insight.advisorCount} advisors affected:
                            <div className="mt-1 space-x-2">
                              {insight.advisorNames.map((name, nameIdx) => {
                                const adv = advisors.find(a => a.name === name);
                                return (
                                  <span key={nameIdx}>
                                    <span
                                      className="text-tcs-teal hover:underline cursor-pointer"
                                      onClick={() => adv && handleAdvisorClick(adv.id)}
                                    >
                                      {name}
                                    </span>
                                    {nameIdx < insight.advisorNames.length - 1 && <span>,</span>}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <FrictionBadge level={insight.severity} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diagnostic Matrix */}
                <div className="bg-white rounded-lg border border-tcs-border overflow-hidden">
                  <div className="p-6 border-b border-tcs-border">
                    <h2 className="font-bold text-lg text-gray-900">Diagnostic Matrix</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-tcs-bg border-b border-tcs-border">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">Advisor</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">Pulse</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">Deal Health</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">Friction</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">Diagnosis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-tcs-border">
                        {diagnosticMatrix.slice(0, 10).map((row, idx) => {
                          const advisor = advisors.find(a => a.name === row.advisor);
                          return (
                          <tr key={idx} className="hover:bg-tcs-bg">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              <span
                                className="text-tcs-teal hover:underline cursor-pointer"
                                onClick={() => advisor && handleAdvisorClick(advisor.id)}
                              >
                                {row.advisor}
                              </span>
                            </td>
                            <td className="px-6 py-4"><PulseBadge pulse={row.pulse} size="sm" /></td>
                            <td className="px-6 py-4"><DealHealthBadge health={row.dealHealth} /></td>
                            <td className="px-6 py-4"><FrictionBadge level={row.friction} /></td>
                            <td className="px-6 py-4 text-xs text-gray-600 max-w-sm">{row.diagnosis.substring(0, 80)}...</td>
                          </tr>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========== RELATIONSHIPS VIEW ========== */}
            {activeView === 'relationships' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Relationships</h1>
                <AdvisorTable advisors={advisors} onAdvisorClick={handleAdvisorClick} />
              </div>
            )}

            {/* ========== PIPELINE VIEW ========== */}
            {activeView === 'pipeline' && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>

                {/* Pipeline Summary KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <KPICard
                    label="Total Pipeline"
                    value={`$${(deals.reduce((sum, d) => sum + d.mrr, 0) / 1000).toFixed(1)}K`}
                    changeType="neutral"
                  />
                  <KPICard
                    label="Weighted Pipeline"
                    value={`$${(weightedPipeline / 1000).toFixed(1)}K`}
                    changeType="neutral"
                  />
                  <KPICard
                    label="Closing This Month"
                    value={closingThisMonth.length.toString()}
                    change={`$${(closingThisMonth.reduce((sum, d) => sum + d.mrr, 0) / 1000).toFixed(1)}K MRR`}
                    changeType="neutral"
                  />
                  <KPICard
                    label="Stalled Deals"
                    value={stalledDealsCount.toString()}
                    change={`$${(deals.filter(d => d.stage === 'Stalled').reduce((sum, d) => sum + d.mrr, 0) / 1000).toFixed(1)}K stuck`}
                    changeType="negative"
                  />
                </div>

                {/* Stage/Timeline Mismatch Alerts */}
                {stageTimelineMismatches.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="font-bold text-lg text-red-900 mb-4">Stage/Timeline Mismatches</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stageTimelineMismatches.map(deal => {
                        const advisor = advisors.find(a => a.id === deal.advisorId);
                        return (
                        <div key={deal.id} className="bg-white border border-red-200 rounded-lg p-4">
                          <p className="font-semibold text-gray-900">{deal.name}</p>
                          <p className="text-xs text-gray-600 mb-2">
                            <span
                              className="text-tcs-teal hover:underline cursor-pointer"
                              onClick={() => advisor && handleAdvisorClick(advisor.id)}
                            >
                              {advisor?.name}
                            </span>
                          </p>
                          <div className="space-y-1 text-xs">
                            <p className="flex items-center gap-1"><span className="font-medium">Stage:</span> {deal.stage} <AlertTriangle className="w-3 h-3 text-amber-500 inline" /> aggressive close date</p>
                            <p><span className="font-medium">Close Date:</span> {deal.closeDate}</p>
                            <p><span className="font-medium">Probability:</span> {deal.probability}%</p>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filter Bar */}
                <div className="bg-white rounded-lg border border-tcs-border p-4 flex gap-4">
                  <select
                    value={dealFilter.health}
                    onChange={(e) => setDealFilter({ ...dealFilter, health: e.target.value })}
                    className="px-4 py-2 border border-tcs-border rounded-lg focus:outline-none focus:border-tcs-teal bg-white"
                  >
                    <option value="all">All Health</option>
                    <option value="Healthy">Healthy</option>
                    <option value="Monitor">Monitor</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Stalled">Stalled</option>
                  </select>

                  <select
                    value={dealFilter.health}
                    onChange={(e) => setDealFilter({ ...dealFilter, health: e.target.value })}
                    className="px-4 py-2 border border-tcs-border rounded-lg focus:outline-none focus:border-tcs-teal bg-white"
                  >
                    <option value="all">All Health</option>
                    <option value="Healthy">Healthy</option>
                    <option value="Monitor">Monitor</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Stalled">Stalled</option>
                  </select>
                </div>

                {/* Kanban Board */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-6 min-w-full pr-4">
                    {(['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'] as const).map(stage => {
                      const stageBorderColors = {
                        'Discovery': 'border-t-blue-500',
                        'Qualifying': 'border-t-indigo-500',
                        'Proposal': 'border-t-amber-500',
                        'Negotiating': 'border-t-orange-500',
                        'Closed Won': 'border-t-green-500',
                        'Stalled': 'border-t-red-500',
                      };

                      const stageDeals = deals.filter(d =>
                        d.stage === stage &&
                        (dealFilter.health === 'all' || d.health === dealFilter.health)
                      );

                      const stageMRR = stageDeals.reduce((sum, d) => sum + d.mrr, 0);

                      return (
                        <div key={stage} className="flex-shrink-0 w-full" style={{ minWidth: '320px' }}>
                          {/* Column Header */}
                          <div className={`bg-white border-4 border-t-4 border-tcs-border rounded-lg p-4 mb-3 ${stageBorderColors[stage]}`}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-gray-900">{stage}</h3>
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                {stageDeals.length}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-tcs-teal">
                              ${(stageMRR / 1000).toFixed(1)}K MRR
                            </p>
                          </div>

                          {/* Cards Container */}
                          <div className="flex flex-col gap-3">
                            {stageDeals.length === 0 ? (
                              <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                                <p className="text-xs text-gray-500">No deals in this stage</p>
                              </div>
                            ) : (
                              stageDeals.map(deal => {
                                const advisor = advisors.find(a => a.id === deal.advisorId);
                                return (
                                  <div
                                    key={deal.id}
                                    className="bg-white border border-tcs-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    {/* Deal Name */}
                                    <h4 className="font-bold text-gray-900 text-sm mb-2">{deal.name}</h4>

                                    {/* Advisor Name (Clickable) */}
                                    <p className="text-xs text-gray-600 mb-2">
                                      <span
                                        className="text-tcs-teal hover:underline cursor-pointer font-medium"
                                        onClick={() => advisor && handleAdvisorClick(advisor.id)}
                                      >
                                        {advisor?.name || 'Unknown'}
                                      </span>
                                    </p>

                                    {/* MRR Value */}
                                    <div className="mb-2">
                                      <p className="text-xs text-gray-600">MRR</p>
                                      <p className="font-bold text-sm text-gray-900">${(deal.mrr / 1000).toFixed(1)}K</p>
                                    </div>

                                    {/* Health Badge */}
                                    <div className="mb-2">
                                      <DealHealthBadge health={deal.health} />
                                    </div>

                                    {/* Days in Stage */}
                                    <div className={`px-2 py-1 rounded text-xs font-medium mb-2 inline-block ${getDaysInStageColor(deal.daysInStage)}`}>
                                      {deal.daysInStage}d in stage
                                    </div>

                                    {/* Probability Bar */}
                                    <div className="mb-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-gray-600">Probability</p>
                                        <p className="text-xs font-semibold text-gray-700">{deal.probability}%</p>
                                      </div>
                                      <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className="bg-tcs-teal h-1.5 rounded-full transition-all"
                                          style={{ width: `${deal.probability}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Confidence Score */}
                                    {deal.confidenceScore && (
                                      <div className="flex items-center gap-1">
                                        <p className="text-xs text-gray-600">Confidence:</p>
                                        <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                          deal.confidenceScore === 'High' ? 'bg-green-100 text-green-700' :
                                          deal.confidenceScore === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                          'bg-red-100 text-red-700'
                                        }`}>
                                          {deal.confidenceScore}
                                        </div>
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

            {/* ========== STRATEGIC VIEW ========== */}
            {activeView === 'strategic' && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">Strategic View</h1>

                {/* Revenue Metrics */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-6">Revenue Metrics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Total MRR</p>
                      <p className="font-bold text-2xl text-gray-900">${(totalMRR / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Avg per Advisor</p>
                      <p className="font-bold text-2xl text-gray-900">${((totalMRR / advisors.length) / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Top Advisor</p>
                      <p className="font-bold text-2xl text-gray-900">${(Math.max(...advisors.map(a => a.mrr)) / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Revenue at Risk</p>
                      <p className="font-bold text-2xl text-red-600">${(deals.filter(d => d.health === 'At Risk' || d.health === 'Stalled').reduce((sum, d) => sum + d.mrr, 0) / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Pipeline Value</p>
                      <p className="font-bold text-2xl text-gray-900">${(weightedPipeline / 1000).toFixed(1)}K</p>
                    </div>
                  </div>
                </div>

                {/* Engagement Health */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-6">Engagement Health</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Avg Days Between Contact</p>
                      <p className="font-bold text-2xl text-gray-900">7.2</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Contacted This Week</p>
                      <p className="font-bold text-2xl text-gray-900">{Math.round(advisors.length * 0.6)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Strong Engagement</p>
                      <p className="font-bold text-2xl text-green-600">{pulseDistribution.Strong}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Fading/Flatline</p>
                      <p className="font-bold text-2xl text-red-600">{pulseDistribution.Fading + pulseDistribution.Flatline}</p>
                    </div>
                  </div>
                </div>

                {/* Pipeline Performance */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-6">Pipeline Performance</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Healthy %</p>
                      <p className="font-bold text-2xl text-gray-900">{healthyPercent}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Avg Deal Cycle</p>
                      <p className="font-bold text-2xl text-gray-900">45 days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Win Rate</p>
                      <p className="font-bold text-2xl text-gray-900">72%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Stalled Deals</p>
                      <p className="font-bold text-2xl text-orange-600">{stalledDealsCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Closing This Month</p>
                      <p className="font-bold text-2xl text-green-600">{closingThisMonth.length}</p>
                    </div>
                  </div>
                </div>

                {/* Supplier Friction Summary */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-6">Supplier Friction Summary</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Avg Level</p>
                      <p className="font-bold text-2xl text-gray-900">Moderate</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">High Friction</p>
                      <p className="font-bold text-2xl text-red-600">{frictionCounts.High + frictionCounts.Critical}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Top Source</p>
                      <p className="font-bold text-xl text-gray-900">Quoting</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 uppercase">Friction-Caused Stalls</p>
                      <p className="font-bold text-2xl text-orange-600">3</p>
                    </div>
                  </div>
                </div>

                {/* Strategic KPIs Highlight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Retention Rate', value: strategicKPIs.retention, color: 'green' },
                    { label: 'Revenue Growth', value: strategicKPIs.revenueGrowth, color: 'green' },
                    { label: 'Engagement Health', value: strategicKPIs.engagement, color: 'blue' },
                    { label: 'Pipeline Velocity', value: strategicKPIs.pipelineVelocity, color: 'green' },
                  ].map((kpi, idx) => (
                    <div key={idx} className={`bg-${kpi.color}-50 border border-${kpi.color}-200 rounded-lg p-6`}>
                      <p className={`text-xs text-${kpi.color}-700 mb-1 uppercase`}>{kpi.label}</p>
                      <p className={`font-bold text-3xl text-${kpi.color}-900`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Quota Tracking */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Quota Tracking</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">Closed-Won vs Target</span>
                        <span className="text-sm font-bold text-gray-900">${(totalMRR / 1000).toFixed(1)}K / ${(quotaTarget / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-tcs-teal h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(quotaProgress, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{quotaProgress.toFixed(1)}% of quota target</p>
                    </div>
                  </div>
                </div>

                {/* Automated Alert Rules */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Automated Alert Rules</h2>
                  <div className="space-y-3">
                    {[
                      { name: 'Flatline Detection', status: 'Active' },
                      { name: 'Deal Stall Alert', status: 'Active' },
                      { name: 'Friction Spike', status: 'Active' },
                      { name: 'Engagement Spike', status: 'Active' },
                      { name: 'Competitive Mention', status: 'Inactive' },
                    ].map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-tcs-bg rounded-lg">
                        <p className="font-medium text-gray-900">{rule.name}</p>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.status === 'Active'}
                            readOnly
                            className="rounded"
                          />
                          <span className="text-xs font-semibold">{rule.status}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="bg-white rounded-lg border border-tcs-border p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Notification Preferences</h2>
                  <p className="text-sm text-gray-600 mb-4">Choose where you receive notifications</p>
                  <div className="space-y-2">
                    {['Platform', 'Microsoft Teams', 'Email', 'Slack'].map((channel, idx) => (
                      <label key={idx} className="flex items-center gap-3 p-3 hover:bg-tcs-bg rounded-lg cursor-pointer transition-colors">
                        <input type="checkbox" defaultChecked={idx < 2} className="rounded" />
                        <span className="text-sm font-medium text-gray-900">{channel}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advisor Panel Slide-Over */}
      <AdvisorPanel
        advisor={selectedAdvisor}
        deals={deals}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      {/* AI Chat Floating Button */}
      <AIChat role="manager" />
    </div>
  );
}
