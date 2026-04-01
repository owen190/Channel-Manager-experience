'use client';

import { useState, useEffect } from 'react';
import { MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays, Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { Advisor, Deal, EngagementScore } from '@/lib/types';
import { deals } from '@/lib/data/deals';
import { SERVICE_CATALOG } from '@/lib/constants';
import { PulseBadge } from './PulseBadge';
import { TrajectoryBadge } from './TrajectoryBadge';
import { SentimentBadge } from './SentimentBadge';
import { FrictionBadge } from './FrictionBadge';
import { DealHealthBadge } from './DealHealthBadge';
import { TierBadge } from './TierBadge';
import { ActivityTimeline } from './ActivityTimeline';
import { PerAdvisorRating } from './RatingsDisplay';

interface AdvisorPanelProps {
  advisor: Advisor | null;
  deals: Deal[];
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'personal' | 'deals' | 'notes' | 'activity' | 'collaboration';

function EngagementLabel({ score }: { score: EngagementScore }) {
  const colors = {
    Strong: 'bg-green-100 text-green-700',
    Steady: 'bg-blue-100 text-blue-700',
    Fading: 'bg-pink-100 text-pink-700',
  };

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${colors[score]}`}>
      {score}
    </span>
  );
}

export function AdvisorPanel({
  advisor,
  deals,
  isOpen,
  onClose,
}: AdvisorPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [notes, setNotes] = useState<string[]>(advisor?.notes || []);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [sharedMeetings, setSharedMeetings] = useState<Record<string, boolean>>({});
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);
  const [ratings, setRatings] = useState<any>(null);
  const [logCallOpen, setLogCallOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [callDate, setCallDate] = useState('');
  const [callDuration, setCallDuration] = useState('');
  const [callSummary, setCallSummary] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [scheduleConfirmation, setScheduleConfirmation] = useState(false);

  // Fetch ratings data
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await fetch('/api/live/ratings');
        const data = await res.json();
        setRatings(data);
      } catch (err) {
        console.error('Failed to fetch ratings:', err);
      }
    };

    if (isOpen) {
      fetchRatings();
    }
  }, [isOpen]);

  if (!advisor) return null;

  const advisorDeals = deals.filter((d) => d.advisorId === advisor.id);
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote]);
      setNewNote('');
      setIsAddingNote(false);
    }
  };

  const handleSaveCall = () => {
    if (callDate && callDuration && callSummary.trim()) {
      const callNote = `Call on ${callDate} (${callDuration}m): ${callSummary}`;
      setNotes([...notes, callNote]);
      setCallDate('');
      setCallDuration('');
      setCallSummary('');
      setLogCallOpen(false);
    }
  };

  const handleSaveSchedule = () => {
    if (scheduleDate && scheduleTime && scheduleDescription.trim()) {
      setScheduleConfirmation(true);
      setTimeout(() => {
        const scheduleNote = `Scheduled: ${scheduleDate} at ${scheduleTime} - ${scheduleDescription}`;
        setNotes([...notes, scheduleNote]);
        setScheduleDate('');
        setScheduleTime('');
        setScheduleDescription('');
        setScheduleOpen(false);
        setScheduleConfirmation(false);
      }, 1500);
    }
  };

  return (
    <>
      {/* Invisible click-away backdrop (no darkening) */}
      {isOpen && (
        <div
          className="fixed inset-0 left-64 z-60"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[420px] max-w-[calc(100vw-256px)] bg-white shadow-xl z-70 transform transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b border-tcs-border p-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-tcs-teal rounded-full flex items-center justify-center text-white text-xl font-bold">
                {getInitials(advisor.name)}
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900">
                  {advisor.name}
                </h2>
                <p className="text-sm text-gray-600">{advisor.title}</p>
                <p className="text-xs text-gray-500">{advisor.company}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Quick Stats - Pulse & Trajectory */}
          <div className="px-6 py-4 bg-tcs-bg border-b border-tcs-border flex gap-4">
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1 uppercase">Pulse</div>
              <PulseBadge pulse={advisor.pulse} size="sm" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1 uppercase">Trajectory</div>
              <TrajectoryBadge trajectory={advisor.trajectory} />
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-tcs-border flex">
            {(['overview', 'personal', 'deals', 'notes', 'activity', 'collaboration'] as TabType[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium uppercase transition-colors ${
                    activeTab === tab
                      ? 'text-tcs-teal border-b-2 border-tcs-teal'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.replace('-', ' ')}
                </button>
              )
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1 uppercase">
                      Tone
                    </div>
                    <SentimentBadge tone={advisor.tone} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1 uppercase">
                      Intent
                    </div>
                    <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                      {advisor.intent}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1 uppercase">
                      Friction
                    </div>
                    <FrictionBadge level={advisor.friction} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1 uppercase">
                      Deal Health
                    </div>
                    <DealHealthBadge health={advisor.dealHealth} />
                  </div>
                </div>

                {/* MRR */}
                <div className="p-4 bg-tcs-bg rounded-lg">
                  <div className="text-xs text-gray-600 mb-1 uppercase">MRR</div>
                  <div className="text-3xl font-bold text-tcs-teal">
                    ${(advisor.mrr / 1000).toFixed(1)}K
                  </div>
                </div>

                {/* Relationship Context */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">
                    Relationship Context
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Connected Since</dt>
                      <dd className="font-medium text-gray-900">
                        {advisor.connectedSince}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Best Day</dt>
                      <dd className="font-medium text-gray-900">
                        {advisor.bestDayToReach}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Comm Pref</dt>
                      <dd className="font-medium text-gray-900">
                        {advisor.commPreference}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Referred By</dt>
                      <dd className="font-medium text-gray-900">
                        {advisor.referredBy}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Relationship Breakdown */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">
                    Relationship Breakdown
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Engagement</div>
                      <EngagementLabel
                        score={advisor.engagementBreakdown.engagement}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        Pipeline Strength
                      </div>
                      <EngagementLabel
                        score={advisor.engagementBreakdown.pipelineStrength}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        Responsiveness
                      </div>
                      <EngagementLabel
                        score={advisor.engagementBreakdown.responsiveness}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">
                        Growth Potential
                      </div>
                      <EngagementLabel
                        score={advisor.engagementBreakdown.growthPotential}
                      />
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm italic text-gray-700">
                    "{advisor.diagnosis}"
                  </p>
                </div>

                {/* Supplier Rating */}
                {ratings && (
                  <PerAdvisorRating data={ratings} advisorId={advisor.id} />
                )}

                {/* Personal Intel */}
                {advisor.personalIntel && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">
                      Personal Intel
                    </h3>
                    <p className="text-sm text-gray-700">
                      {advisor.personalIntel}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2 italic">Compiled from CRM notes, call transcripts, and LinkedIn</p>
                  </div>
                )}

                {/* White Space Analysis */}
                {(() => {
                  // Seeded random function for consistent MRR estimation
                  const seededRandom = (seed: string): number => {
                    let hash = 0;
                    for (let i = 0; i < seed.length; i++) {
                      const char = seed.charCodeAt(i);
                      hash = ((hash << 5) - hash) + char;
                      hash = hash & hash;
                    }
                    return Math.abs(hash) % 1000 / 1000;
                  };

                  // Detect products the advisor is selling
                  const productsSellingSet = new Set<string>();
                  advisorDeals.forEach((deal) => {
                    const dealFirstWord = deal.name.split(' ')[0].toLowerCase();
                    SERVICE_CATALOG.forEach((product) => {
                      if (dealFirstWord.includes(product.toLowerCase()) || product.toLowerCase().includes(dealFirstWord)) {
                        productsSellingSet.add(product);
                      }
                    });
                  });

                  const productsSelling = Array.from(productsSellingSet);
                  const opportunities = SERVICE_CATALOG.filter((p) => !productsSelling.includes(p));
                  const coverage = SERVICE_CATALOG.length > 0 ? Math.round((productsSelling.length / SERVICE_CATALOG.length) * 100) : 0;

                  // Calculate total estimated opportunity MRR
                  const totalOpportunityMRR = opportunities.reduce((sum, product) => {
                    const rand = seededRandom(advisor.id + product);
                    const estimatedMRR = Math.round(50 + rand * 150); // Range 50K-200K
                    return sum + estimatedMRR;
                  }, 0);

                  return (
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">
                        White Space Analysis
                      </h3>

                      {/* Products Selling */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Products Selling</p>
                        {productsSelling.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {productsSelling.map((product) => (
                              <span key={product} className="inline-block px-2.5 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium">
                                {product}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No products detected</p>
                        )}
                      </div>

                      {/* Coverage Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <p className="text-xs text-gray-600 font-medium">Catalog Coverage</p>
                          <span className="text-xs font-medium text-gray-900">{coverage}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${coverage}%` }}
                          />
                        </div>
                      </div>

                      {/* Opportunities */}
                      {opportunities.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2 font-medium">Opportunities</p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {opportunities.map((product) => (
                              <span key={product} className="inline-block px-2.5 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                {product}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Estimated Opportunity MRR */}
                      {opportunities.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Est. Opportunity MRR</p>
                          <p className="text-sm font-bold text-gray-900">${(totalOpportunityMRR / 1000).toFixed(1)}K</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="space-y-6">
                {/* Profile */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">
                    Profile
                  </h3>
                  <dl className="space-y-2 text-sm">
                    {advisor.location && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</dt>
                        <dd className="font-medium text-gray-900">
                          {advisor.location}
                        </dd>
                      </div>
                    )}
                    {advisor.birthday && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 flex items-center gap-1.5"><Cake className="w-3.5 h-3.5" /> Birthday</dt>
                        <dd className="font-medium text-gray-900">
                          {advisor.birthday}
                        </dd>
                      </div>
                    )}
                    {advisor.education && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Education</dt>
                        <dd className="font-medium text-gray-900">
                          {advisor.education}
                        </dd>
                      </div>
                    )}
                    {advisor.title && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Title</dt>
                        <dd className="font-medium text-gray-900">
                          {advisor.title}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Family */}
                {advisor.family && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">
                      Family
                    </h3>
                    <p className="text-sm text-gray-700">{advisor.family}</p>
                  </div>
                )}

                {/* Hobbies */}
                {advisor.hobbies && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">
                      Hobbies & Interests
                    </h3>
                    <p className="text-sm text-gray-700">{advisor.hobbies}</p>
                  </div>
                )}

                {/* Fun Fact */}
                {advisor.funFact && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">
                      Fun Fact
                    </h3>
                    <p className="text-sm text-gray-700">{advisor.funFact}</p>
                  </div>
                )}

                {/* Channel Relationships */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">
                    Channel Relationships
                  </h3>
                  <dl className="space-y-2 text-sm">
                    {advisor.previousCompanies?.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Previous Companies</dt>
                        <dd className="font-medium text-gray-900">
                          {advisor.previousCompanies.join(', ')}
                        </dd>
                      </div>
                    )}
                    {advisor.mutualConnections?.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Mutual Connections</dt>
                        <dd className="font-medium text-gray-900">
                          {advisor.mutualConnections.join(', ')}
                        </dd>
                      </div>
                    )}
                    {advisor.sharedClients?.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Shared Clients</dt>
                        <dd className="font-medium text-gray-900">
                          {advisor.sharedClients.join(', ')}
                        </dd>
                      </div>
                    )}
                    {advisor.referredBy && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Referred By</dt>
                        <dd className="font-medium text-gray-900">
                          {advisor.referredBy}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="space-y-4">
                {advisorDeals.length === 0 ? (
                  <p className="text-sm text-gray-600">No deals found</p>
                ) : (
                  advisorDeals.map((deal) => {
                    // Mock meeting summaries for each deal
                    const meetingSummaries = [
                      {
                        id: `${deal.id}-meeting-1`,
                        date: '2026-03-22',
                        participants: ['Sarah Chen', 'VP Infrastructure'],
                        duration: 45,
                        summary: 'Discussed current infrastructure pain points and migration timeline. Key decision: approved phased approach over 6 months.',
                        actionItems: ['Prepare detailed migration plan', 'Schedule technical deep-dive'],
                        decisions: ['Phased 6-month migration', 'Maintain existing vendor during transition']
                      },
                      {
                        id: `${deal.id}-meeting-2`,
                        date: '2026-03-18',
                        participants: ['Procurement Lead', 'CFO'],
                        duration: 30,
                        summary: 'Budget allocation confirmed. Discussed pricing models and ROI metrics. Client confirmed Q2 budget availability.',
                        actionItems: ['Send pricing proposal', 'Schedule CFO alignment call'],
                        decisions: ['Allocated $1.2M budget', 'ROI analysis required']
                      },
                      {
                        id: `${deal.id}-meeting-3`,
                        date: '2026-03-10',
                        participants: ['IT Director', 'Operations Manager'],
                        duration: 60,
                        summary: 'Initial discovery. Identified 3 critical infrastructure gaps. Advisor is champion and pushing for quick decision.',
                        actionItems: ['Send technical assessment', 'Set up vendor meetings'],
                        decisions: ['Move forward with RFP process', 'Target 30-day evaluation']
                      }
                    ];

                    // Deal story
                    const dealStory = `${deal.name} was discovered in early March during infrastructure audit conversation. Sarah Chen (VP Infra) is the key sponsor and has been vocal about modernizing their legacy systems. They identified pain points around uptime reliability and cost optimization. Presented hybrid cloud solution on March 10th with strong initial interest. Budget confirmed in latest meeting (March 22nd) with phased 6-month implementation timeline. Currently in proposal stage with high confidence (${deal.probability}%) and committed status.`;

                    return (
                      <div
                        key={deal.id}
                        className="border border-tcs-border rounded-lg overflow-hidden"
                      >
                        {/* Deal Header */}
                        <div
                          className="bg-white p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {deal.name}
                            </h4>
                            <DealHealthBadge health={deal.health} />
                          </div>
                          <dl className="space-y-1 text-xs text-gray-600 mb-3">
                            <div className="flex justify-between">
                              <dt>MRR:</dt>
                              <dd className="font-medium text-gray-900">
                                ${(deal.mrr / 1000).toFixed(1)}K
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt>Stage:</dt>
                              <dd className="font-medium text-gray-900">
                                {deal.stage}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt>Days in Stage:</dt>
                              <dd className="font-medium text-gray-900">
                                {deal.daysInStage}
                              </dd>
                            </div>
                            {deal.confidenceScore && (
                              <div className="flex justify-between">
                                <dt>Confidence:</dt>
                                <dd className="font-medium text-gray-900">
                                  {deal.confidenceScore}
                                </dd>
                              </div>
                            )}
                          </dl>
                          <div className="bg-gray-100 rounded h-2 mb-2">
                            <div
                              className="bg-tcs-teal h-2 rounded"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-600">
                            Probability: {deal.probability}%
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedDeal === deal.id && (
                          <div className="border-t border-tcs-border bg-gray-50 p-4 space-y-4">
                            {/* Deal Story */}
                            <div>
                              <h5 className="font-semibold text-xs text-gray-900 uppercase mb-2">Deal Story</h5>
                              <p className="text-xs text-gray-700 leading-relaxed">{dealStory}</p>
                            </div>

                            {/* Meeting History */}
                            <div>
                              <h5 className="font-semibold text-xs text-gray-900 uppercase mb-2">Meeting History</h5>
                              <div className="space-y-2">
                                {meetingSummaries.map((meeting, idx) => (
                                  <div key={meeting.id} className="bg-white rounded border border-gray-200 p-3 text-xs">
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="font-medium text-gray-900">
                                        {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {meeting.participants.join(', ')} · {meeting.duration}m
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={sharedMeetings[meeting.id] || false}
                                        onChange={(e) => setSharedMeetings({ ...sharedMeetings, [meeting.id]: e.target.checked })}
                                        className="w-3.5 h-3.5 cursor-pointer"
                                        title="Share with advisor"
                                      />
                                    </div>
                                    <p className="text-gray-600 mb-2">{meeting.summary}</p>
                                    <div className="flex gap-3">
                                      <div>
                                        <p className="font-medium text-gray-700 mb-0.5">Key Decisions:</p>
                                        {meeting.decisions.map((d, i) => (
                                          <p key={i} className="text-gray-600">• {d}</p>
                                        ))}
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-700 mb-0.5">Action Items:</p>
                                        {meeting.actionItems.map((a, i) => (
                                          <p key={i} className="text-gray-600">• {a}</p>
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 italic">
                                      {sharedMeetings[meeting.id] ? '✓ Shared with advisor' : 'Internal only'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {notes.map((note, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-tcs-bg rounded-lg text-sm text-gray-700"
                    >
                      • {note}
                    </div>
                  ))}
                </div>
                {!isAddingNote ? (
                  <button
                    onClick={() => setIsAddingNote(true)}
                    className="w-full py-2 px-4 border border-tcs-border rounded-lg text-sm text-tcs-teal hover:bg-tcs-bg transition-colors"
                  >
                    + Add Note
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a note..."
                      className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddNote}
                        className="flex-1 py-2 px-4 bg-tcs-teal text-white rounded-lg text-sm font-medium hover:bg-opacity-90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingNote(false);
                          setNewNote('');
                        }}
                        className="flex-1 py-2 px-4 border border-tcs-border rounded-lg text-sm hover:bg-tcs-bg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <div className="border-t border-tcs-border pt-4 space-y-3">
                  {!logCallOpen ? (
                    <button
                      onClick={() => setLogCallOpen(true)}
                      className="w-full py-2 px-4 border border-tcs-border rounded-lg text-sm hover:bg-tcs-bg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" /> Log Call
                    </button>
                  ) : (
                    <div className="space-y-2 bg-tcs-bg p-3 rounded-lg">
                      <input
                        type="date"
                        value={callDate}
                        onChange={(e) => setCallDate(e.target.value)}
                        className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
                        placeholder="Date"
                      />
                      <input
                        type="number"
                        value={callDuration}
                        onChange={(e) => setCallDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
                        placeholder="Duration (minutes)"
                      />
                      <textarea
                        value={callSummary}
                        onChange={(e) => setCallSummary(e.target.value)}
                        className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
                        placeholder="Summary..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCall}
                          className="flex-1 py-2 px-4 bg-tcs-teal text-white rounded-lg text-sm font-medium hover:bg-opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setLogCallOpen(false);
                            setCallDate('');
                            setCallDuration('');
                            setCallSummary('');
                          }}
                          className="flex-1 py-2 px-4 border border-tcs-border rounded-lg text-sm hover:bg-tcs-bg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!scheduleOpen ? (
                    <button
                      onClick={() => setScheduleOpen(true)}
                      className="w-full py-2 px-4 border border-tcs-border rounded-lg text-sm hover:bg-tcs-bg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CalendarDays className="w-3.5 h-3.5" /> Schedule
                    </button>
                  ) : (
                    <div className="space-y-2 bg-tcs-bg p-3 rounded-lg">
                      {scheduleConfirmation ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="text-center">
                            <p className="text-sm font-medium text-tcs-teal mb-1">Meeting scheduled!</p>
                            <p className="text-xs text-gray-600">{scheduleDate} at {scheduleTime}</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
                            placeholder="Date"
                          />
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
                            placeholder="Time"
                          />
                          <textarea
                            value={scheduleDescription}
                            onChange={(e) => setScheduleDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
                            placeholder="Description..."
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveSchedule}
                              className="flex-1 py-2 px-4 bg-tcs-teal text-white rounded-lg text-sm font-medium hover:bg-opacity-90"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setScheduleOpen(false);
                                setScheduleDate('');
                                setScheduleTime('');
                                setScheduleDescription('');
                              }}
                              className="flex-1 py-2 px-4 border border-tcs-border rounded-lg text-sm hover:bg-tcs-bg"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <ActivityTimeline advisorId={advisor.id} />
            )}

            {activeTab === 'collaboration' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-900 font-medium">What the advisor sees</p>
                  <p className="text-xs text-blue-700 mt-1">Only summaries and stories marked as "shared" appear in the advisor's portal</p>
                </div>

                {advisorDeals.length === 0 ? (
                  <p className="text-sm text-gray-600">No deals with shared content</p>
                ) : (
                  advisorDeals.map((deal) => {
                    // Count shared meetings for this deal
                    const sharedMeetingCount = Object.entries(sharedMeetings)
                      .filter(([key, val]) => key.startsWith(deal.id) && val)
                      .length;

                    return (
                      <div key={deal.id} className="border border-tcs-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{deal.name}</h4>
                          <span className="text-xs bg-tcs-teal/10 text-tcs-teal px-2 py-1 rounded">
                            {sharedMeetingCount} shared
                          </span>
                        </div>

                        <dl className="space-y-1 text-xs text-gray-600 mb-3">
                          <div className="flex justify-between">
                            <dt>Stage:</dt>
                            <dd className="font-medium text-gray-900">{deal.stage}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>MRR:</dt>
                            <dd className="font-medium text-gray-900">${(deal.mrr / 1000).toFixed(1)}K</dd>
                          </div>
                        </dl>

                        {sharedMeetingCount > 0 && (
                          <div className="bg-green-50 rounded-lg p-3 mb-3">
                            <p className="text-xs font-medium text-green-900 mb-2">Shared with Advisor:</p>
                            <ul className="space-y-1 text-xs text-green-800">
                              <li>✓ {sharedMeetingCount} meeting summaries</li>
                              <li>✓ Deal story & journey</li>
                              <li>✓ Key decisions & action items</li>
                            </ul>
                          </div>
                        )}

                        {sharedMeetingCount === 0 && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600">No content shared yet. Mark meetings as shared in the Deals tab to make them visible to this advisor.</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                <div className="border-t border-tcs-border pt-4 mt-6">
                  <p className="text-xs font-medium text-gray-600 mb-3">Shared Documents</p>
                  <div className="space-y-2">
                    <div className="border border-tcs-border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Technical Architecture Plan</p>
                        <p className="text-xs text-gray-500">Shared 3 days ago</p>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Shared</span>
                    </div>
                    <div className="border border-tcs-border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">ROI Analysis</p>
                        <p className="text-xs text-gray-500">Internal only</p>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">Private</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
