'use client';

import { useState, useMemo } from 'react';
import { Clock, AlertTriangle, Flag, ShieldAlert, DollarSign, Brain, Activity, TrendingDown, TrendingUp, Zap, Users, ChevronDown, ChevronUp, X } from 'lucide-react';
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
  const [drillDown, setDrillDown] = useState<{ label: string; advisorIds: string[] } | null>(null);

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

  // ===== INTELLIGENCE HUB COMPUTED DATA =====

  // Risk Radar: Score each advisor by combining negative signals
  const riskRadar = useMemo(() => {
    return advisors.map(a => {
      let score = 0;
      // Pulse risk
      if (a.pulse === 'Flatline') score += 30;
      else if (a.pulse === 'Fading') score += 20;
      // Trajectory risk
      if (a.trajectory === 'Freefall') score += 30;
      else if (a.trajectory === 'Slipping') score += 15;
      // Deal health risk
      if (a.dealHealth === 'Stalled') score += 25;
      else if (a.dealHealth === 'At Risk') score += 20;
      else if (a.dealHealth === 'Monitor') score += 10;
      // Friction risk
      if (a.friction === 'Critical') score += 25;
      else if (a.friction === 'High') score += 15;
      else if (a.friction === 'Moderate') score += 5;
      // Intent risk
      if (a.intent === 'Low') score += 10;
      // Tone risk
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

  // Revenue at Risk
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

  // AI Insights Feed (dynamically generated from data)
  const aiInsights = useMemo(() => {
    const insights: { icon: string; text: string; type: 'critical' | 'warning' | 'positive' | 'info' }[] = [];

    // Critical: Freefall advisors
    const freefallAdvisors = advisors.filter(a => a.trajectory === 'Freefall');
    if (freefallAdvisors.length > 0) {
      const names = freefallAdvisors.map(a => a.name).join(' and ');
      const totalMRR = freefallAdvisors.reduce((sum, a) => sum + a.mrr, 0);
      insights.push({ icon: 'alert', text: `${names} ${freefallAdvisors.length === 1 ? 'is' : 'are'} in freefall trajectory with $${(totalMRR / 1000).toFixed(1)}K MRR at stake. Immediate re-engagement needed.`, type: 'critical' });
    }

    // Warning: Stalled deals with high MRR
    const bigStalledDeals = deals.filter(d => d.health === 'Stalled').sort((a, b) => b.mrr - a.mrr);
    if (bigStalledDeals.length > 0) {
      const topDeal = bigStalledDeals[0];
      const advisor = advisors.find(a => a.id === topDeal.advisorId);
      insights.push({ icon: 'dollar', text: `${topDeal.name} has been stalled for ${topDeal.daysInStage} days ($${(topDeal.mrr / 1000).toFixed(1)}K). ${advisor?.name || 'Advisor'} may need a fresh approach or executive sponsor involvement.`, type: 'warning' });
    }

    // Positive: Climbing advisors
    const climbingAdvisors = advisors.filter(a => a.trajectory === 'Climbing' || a.trajectory === 'Accelerating');
    if (climbingAdvisors.length > 0) {
      const topClimber = climbingAdvisors.sort((a, b) => b.mrr - a.mrr)[0];
      insights.push({ icon: 'trending', text: `${climbingAdvisors.length} advisors are trending upward. ${topClimber.name} leads with $${(topClimber.mrr / 1000).toFixed(1)}K MRR and ${topClimber.trajectory.toLowerCase()} trajectory\u2014consider expanding their portfolio.`, type: 'positive' });
    }

    // Info: Engagement gap
    const fadingCount = advisors.filter(a => a.pulse === 'Fading' || a.pulse === 'Flatline').length;
    if (fadingCount > 0) {
      const fadingMRR = advisors.filter(a => a.pulse === 'Fading' || a.pulse === 'Flatline').reduce((sum, a) => sum + a.mrr, 0);
      insights.push({ icon: 'users', text: `${fadingCount} advisors showing fading or flatline engagement, representing $${(fadingMRR / 1000).toFixed(1)}K in MRR. Prioritize personal outreach this week.`, type: 'warning' });
    }

    // Positive: Healthy pipeline ratio
    const healthyRatio = Math.round((deals.filter(d => d.health === 'Healthy').length / deals.length) * 100);
    insights.push({ icon: 'zap', text: `${healthyRatio}% of your pipeline is healthy. Focus energy on the ${deals.filter(d => d.health !== 'Healthy').length} deals that need attention to protect quarter-end targets.`, type: 'info' });

    return insights.slice(0, 5);
  }, []);

  // Engagement Heatmap data
  const engagementHeatmap = useMemo(() => {
    const now = new Date('2026-03-26');
    return advisors.map(a => {
      // Simulate last contact from activity data
      const lastActivity = a.activity?.[0];
      let daysSinceContact = 0;
      if (lastActivity && lastActivity.time) {
        // time is like "2 days ago", "1 week ago", etc. — parse it
        const timeStr = lastActivity.time;
        const match = timeStr.match(/(\d+)\s*(day|week|month|hour)/i);
        if (match) {
          const num = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          daysSinceContact = unit === 'week' ? num * 7 : unit === 'month' ? num * 30 : unit === 'hour' ? 0 : num;
        }
      } else {
        daysSinceContact = 30;
      }
      return { advisor: a, daysSinceContact };
    }).sort((a, b) => b.daysSinceContact - a.daysSinceContact);
  }, []);

  // Helper: get advisors by filter for drill-down
  const getAdvisorsByPulse = (pulse: string) => advisors.filter(a => a.pulse === pulse).map(a => a.id);
  const getAdvisorsByTrajectory = (trajectory: string) => advisors.filter(a => a.trajectory === trajectory).map(a => a.id);
  const getAdvisorsByTone = (tone: string) => advisors.filter(a => a.tone === tone).map(a => a.id);
  const getAdvisorsByIntent = (intent: string) => advisors.filter(a => a.intent === intent).map(a => a.id);
  const getAdvisorsByFriction = (friction: string) => advisors.filter(a => a.friction === friction).map(a => a.id);

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
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Intelligence Hub</h1>

                {/* ===== AI INSIGHTS FEED ===== */}
                <div className="bg-gradient-to-r from-tcs-teal to-emerald-600 rounded-lg p-6 text-white">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5" />
                    <h2 className="font-bold text-lg">AI Insights</h2>
                  </div>
                  <div className="space-y-3">
                    {aiInsights.map((insight, idx) => (
                      <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${
                        insight.type === 'critical' ? 'bg-red-500/20' :
                        insight.type === 'warning' ? 'bg-amber-500/20' :
                        insight.type === 'positive' ? 'bg-green-500/20' :
                        'bg-white/10'
                      }`}>
                        <div className="mt-0.5 flex-shrink-0">
                          {insight.icon === 'alert' && <AlertTriangle className="w-4 h-4" />}
                          {insight.icon === 'dollar' && <DollarSign className="w-4 h-4" />}
                          {insight.icon === 'trending' && <TrendingUp className="w-4 h-4" />}
                          {insight.icon === 'users' && <Users className="w-4 h-4" />}
                          {insight.icon === 'zap' && <Zap className="w-4 h-4" />}
                        </div>
                        <p className="text-sm leading-relaxed">{insight.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ===== REVENUE AT RISK + RISK SUMMARY ROW ===== */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border border-red-200 p-5 md:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-red-500" />
                      <p className="text-xs uppercase tracking-wider text-gray-600">Revenue at Risk</p>
                    </div>
                    <p className="font-newsreader text-3xl font-bold text-red-600">${(revenueAtRisk.total / 1000).toFixed(1)}K</p>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-red-600 font-medium">At Risk ({revenueAtRisk.atRisk.count})</span>
                        <span className="font-semibold">${(revenueAtRisk.atRisk.mrr / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-red-500 font-medium">Stalled ({revenueAtRisk.stalled.count})</span>
                        <span className="font-semibold">${(revenueAtRisk.stalled.mrr / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-amber-600 font-medium">Monitor ({revenueAtRisk.monitor.count})</span>
                        <span className="font-semibold">${(revenueAtRisk.monitor.mrr / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-tcs-border p-5">
                    <p className="text-xs uppercase tracking-wider text-gray-600 mb-1">Deals</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(dealHealthCounts).map(([health, count]) => {
                        const colors: Record<string, string> = { Healthy: 'text-green-600', Monitor: 'text-amber-600', 'At Risk': 'text-red-500', Stalled: 'text-red-700' };
                        return (
                          <button key={health} onClick={() => setDrillDown({ label: `${health} Deals`, advisorIds: deals.filter(d => d.health === health).map(d => d.advisorId).filter((v, i, a) => a.indexOf(v) === i) })} className="text-left hover:bg-tcs-bg rounded p-1 transition-colors">
                            <span className={`text-xl font-bold ${colors[health] || 'text-tcs-teal'}`}>{count}</span>
                            <span className="text-xs text-gray-500 ml-1">{health}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-tcs-border p-5">
                    <p className="text-xs uppercase tracking-wider text-gray-600 mb-1">Pulse</p>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(pulseDistribution).map(([pulse, count]) => {
                        const colors: Record<string, string> = { Strong: 'text-green-600', Steady: 'text-blue-600', Rising: 'text-emerald-500', Fading: 'text-amber-600', Flatline: 'text-red-600' };
                        return (
                          <button key={pulse} onClick={() => setDrillDown({ label: `${pulse} Pulse`, advisorIds: getAdvisorsByPulse(pulse) })} className="text-left hover:bg-tcs-bg rounded p-1 transition-colors">
                            <span className={`text-lg font-bold ${colors[pulse] || 'text-tcs-teal'}`}>{count}</span>
                            <span className="text-xs text-gray-500 ml-1">{pulse}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-tcs-border p-5">
                    <p className="text-xs uppercase tracking-wider text-gray-600 mb-1">Trajectory</p>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(trajectoryDistribution).map(([trajectory, count]) => {
                        const colors: Record<string, string> = { Accelerating: 'text-green-600', Climbing: 'text-emerald-500', Stable: 'text-blue-600', Slipping: 'text-amber-600', Freefall: 'text-red-600' };
                        return (
                          <button key={trajectory} onClick={() => setDrillDown({ label: `${trajectory} Trajectory`, advisorIds: getAdvisorsByTrajectory(trajectory) })} className="text-left hover:bg-tcs-bg rounded p-1 transition-colors">
                            <span className={`text-lg font-bold ${colors[trajectory] || 'text-tcs-teal'}`}>{count}</span>
                            <span className="text-xs text-gray-500 ml-1">{trajectory}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ===== DRILL-DOWN PANEL ===== */}
                {drillDown && (
                  <div className="bg-white rounded-lg border border-tcs-teal p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 text-sm">{drillDown.label} ({drillDown.advisorIds.length} advisors)</h3>
                      <button onClick={() => setDrillDown(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {drillDown.advisorIds.map(id => {
                        const adv = advisors.find(a => a.id === id);
                        if (!adv) return null;
                        return (
                          <button key={id} onClick={() => handleAdvisorClick(id)} className="flex items-center gap-2 px-3 py-2 bg-tcs-bg rounded-lg hover:bg-tcs-teal/10 transition-colors text-left">
                            <div className="w-8 h-8 rounded-full bg-tcs-teal text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {adv.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-tcs-teal">{adv.name}</p>
                              <p className="text-xs text-gray-500">${(adv.mrr / 1000).toFixed(1)}K MRR</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ===== COMPACT STATS ROW: Tone / Intent / Friction ===== */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg border border-tcs-border p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-600 mb-2">Tone</p>
                    <div className="flex gap-3">
                      {Object.entries(sentimentCounts).map(([tone, count]) => {
                        const colors: Record<string, string> = { Warm: 'text-green-600', Neutral: 'text-gray-600', Cool: 'text-blue-600' };
                        return (
                          <button key={tone} onClick={() => setDrillDown({ label: `${tone} Tone`, advisorIds: getAdvisorsByTone(tone) })} className="flex-1 text-center hover:bg-tcs-bg rounded p-1 transition-colors">
                            <div className={`text-xl font-bold ${colors[tone]}`}>{count}</div>
                            <div className="text-xs text-gray-500">{tone}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-tcs-border p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-600 mb-2">Intent</p>
                    <div className="flex gap-3">
                      {Object.entries(intentCounts).map(([intent, count]) => {
                        const colors: Record<string, string> = { Strong: 'text-green-600', Moderate: 'text-amber-600', Low: 'text-red-500' };
                        return (
                          <button key={intent} onClick={() => setDrillDown({ label: `${intent} Intent`, advisorIds: getAdvisorsByIntent(intent) })} className="flex-1 text-center hover:bg-tcs-bg rounded p-1 transition-colors">
                            <div className={`text-xl font-bold ${colors[intent]}`}>{count}</div>
                            <div className="text-xs text-gray-500">{intent}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-tcs-border p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-600 mb-2">Friction</p>
                    <div className="flex gap-3">
                      {Object.entries(frictionCounts).map(([level, count]) => {
                        const colors: Record<string, string> = { Low: 'text-green-600', Moderate: 'text-amber-600', High: 'text-orange-600', Critical: 'text-red-600' };
                        return (
                          <button key={level} onClick={() => setDrillDown({ label: `${level} Friction`, advisorIds: getAdvisorsByFriction(level) })} className="flex-1 text-center hover:bg-tcs-bg rounded p-1 transition-colors">
                            <div className={`text-xl font-bold ${colors[level]}`}>{count}</div>
                            <div className="text-xs text-gray-500">{level}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ===== RISK RADAR ===== */}
                <div className="bg-white rounded-lg border border-tcs-border overflow-hidden">
                  <div className="p-5 border-b border-tcs-border flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <h2 className="font-bold text-lg text-gray-900">Risk Radar</h2>
                    <span className="text-xs text-gray-500 ml-2">Priority-ranked by combined risk signals</span>
                  </div>
                  <div className="divide-y divide-tcs-border">
                    {riskRadar.slice(0, 10).map((item, idx) => {
                      const riskLevel = item.score >= 50 ? 'CRITICAL' : item.score >= 30 ? 'HIGH' : item.score >= 15 ? 'MODERATE' : 'LOW';
                      const riskColor = item.score >= 50 ? 'bg-red-100 text-red-700 border-red-200' : item.score >= 30 ? 'bg-orange-100 text-orange-700 border-orange-200' : item.score >= 15 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200';
                      const barWidth = Math.min(100, (item.score / 80) * 100);
                      const barColor = item.score >= 50 ? 'bg-red-500' : item.score >= 30 ? 'bg-orange-500' : item.score >= 15 ? 'bg-amber-500' : 'bg-green-500';

                      return (
                        <div key={item.advisor.id} className="flex items-center gap-4 px-5 py-3 hover:bg-tcs-bg transition-colors">
                          <div className="text-xs text-gray-400 font-mono w-5 text-right">{idx + 1}</div>
                          <button onClick={() => handleAdvisorClick(item.advisor.id)} className="flex items-center gap-3 min-w-[180px] text-left">
                            <div className="w-8 h-8 rounded-full bg-tcs-teal text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {item.advisor.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-tcs-teal hover:underline">{item.advisor.name}</p>
                              <p className="text-xs text-gray-500">{item.advisor.company}</p>
                            </div>
                          </button>
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${barWidth}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 min-w-[200px] justify-end">
                            {item.atRiskMRR > 0 && (
                              <span className="text-xs text-red-600 font-medium">${(item.atRiskMRR / 1000).toFixed(1)}K at risk</span>
                            )}
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${riskColor}`}>{riskLevel}</span>
                          </div>
                          <div className="flex gap-1 min-w-[120px]">
                            <PulseBadge pulse={item.advisor.pulse} size="sm" />
                            <TrajectoryBadge trajectory={item.advisor.trajectory} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ===== ENGAGEMENT HEATMAP ===== */}
                <div className="bg-white rounded-lg border border-tcs-border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-tcs-teal" />
                    <h2 className="font-bold text-lg text-gray-900">Engagement Heatmap</h2>
                    <span className="text-xs text-gray-500 ml-2">Days since last contact</span>
                  </div>
                  <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                    {engagementHeatmap.map(item => {
                      const heatColor = item.daysSinceContact <= 3 ? 'bg-green-500'
                        : item.daysSinceContact <= 7 ? 'bg-green-300'
                        : item.daysSinceContact <= 14 ? 'bg-amber-300'
                        : item.daysSinceContact <= 21 ? 'bg-orange-400'
                        : 'bg-red-500';
                      return (
                        <button
                          key={item.advisor.id}
                          onClick={() => handleAdvisorClick(item.advisor.id)}
                          className="group relative flex flex-col items-center"
                          title={`${item.advisor.name} - ${item.daysSinceContact}d ago`}
                        >
                          <div className={`w-full aspect-square rounded-lg ${heatColor} flex items-center justify-center text-white text-xs font-bold transition-transform group-hover:scale-110`}>
                            {item.advisor.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">{item.advisor.name.split(' ')[1]}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-tcs-border">
                    <span className="text-xs text-gray-500">Legend:</span>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" /><span className="text-xs text-gray-600">0-3d</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-300" /><span className="text-xs text-gray-600">4-7d</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-300" /><span className="text-xs text-gray-600">8-14d</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-400" /><span className="text-xs text-gray-600">15-21d</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-xs text-gray-600">22d+</span></div>
                  </div>
                </div>

                {/* ===== FRICTION INSIGHTS ===== */}
                <div className="bg-white rounded-lg border border-tcs-border p-5">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Supplier Friction Insights</h2>
                  <div className="space-y-2">
                    {frictionInsights.map((insight, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-tcs-bg rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 text-sm">{insight.issue}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {insight.advisorNames.map((name, nameIdx) => {
                              const adv = advisors.find(a => a.name === name);
                              return (
                                <span key={nameIdx}>
                                  <span className="text-tcs-teal hover:underline cursor-pointer" onClick={() => adv && handleAdvisorClick(adv.id)}>{name}</span>
                                  {nameIdx < insight.advisorNames.length - 1 && ', '}
                                </span>
                              );
                            })}
                          </span>
                        </div>
                        <FrictionBadge level={insight.severity} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ===== DIAGNOSTIC MATRIX ===== */}
                <div className="bg-white rounded-lg border border-tcs-border overflow-hidden">
                  <div className="p-5 border-b border-tcs-border">
                    <h2 className="font-bold text-lg text-gray-900">Diagnostic Matrix</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-tcs-bg border-b border-tcs-border">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold text-gray-700">Advisor</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-700">Pulse</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-700">Deal Health</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-700">Friction</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-700">Diagnosis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-tcs-border">
                        {diagnosticMatrix.slice(0, 10).map((row, idx) => {
                          const advisor = advisors.find(a => a.name === row.advisor);
                          return (
                          <tr key={idx} className="hover:bg-tcs-bg">
                            <td className="px-5 py-3 font-medium">
                              <span className="text-tcs-teal hover:underline cursor-pointer" onClick={() => advisor && handleAdvisorClick(advisor.id)}>{row.advisor}</span>
                            </td>
                            <td className="px-5 py-3"><PulseBadge pulse={row.pulse} size="sm" /></td>
                            <td className="px-5 py-3"><DealHealthBadge health={row.dealHealth} /></td>
                            <td className="px-5 py-3"><FrictionBadge level={row.friction} /></td>
                            <td className="px-5 py-3 text-xs text-gray-600 max-w-sm">{row.diagnosis.substring(0, 80)}...</td>
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
                  <div className="flex gap-4" style={{ minWidth: '1920px' }}>
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
                        <div key={stage} className="flex-1 min-w-[280px]">
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
