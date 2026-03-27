'use client';

import { useState } from 'react';
import { MapPin, Cake, GraduationCap, Briefcase, Phone, CalendarDays, Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { Advisor, Deal, EngagementScore } from '@/lib/types';
import { deals } from '@/lib/data/deals';
import { PulseBadge } from './PulseBadge';
import { TrajectoryBadge } from './TrajectoryBadge';
import { SentimentBadge } from './SentimentBadge';
import { FrictionBadge } from './FrictionBadge';
import { DealHealthBadge } from './DealHealthBadge';
import { TierBadge } from './TierBadge';

interface AdvisorPanelProps {
  advisor: Advisor | null;
  deals: Deal[];
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'personal' | 'deals' | 'notes' | 'activity' | 'ai-prep';

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

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 left-64 bg-black bg-opacity-50 z-60"
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
            {(['overview', 'personal', 'deals', 'ai-prep', 'notes', 'activity'] as TabType[]).map(
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
                  {tab === 'ai-prep' ? 'AI Prep' : tab}
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

                {/* Personal Intel */}
                {advisor.personalIntel && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">
                      Personal Intel
                    </h3>
                    <p className="text-sm text-gray-700">
                      {advisor.personalIntel}
                    </p>
                  </div>
                )}
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
                    {advisor.tsds?.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">TSDs</dt>
                        <dd className="font-medium text-gray-900">
                          {advisor.tsds.join(', ')}
                        </dd>
                      </div>
                    )}
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
              <div className="space-y-3">
                {advisorDeals.length === 0 ? (
                  <p className="text-sm text-gray-600">No deals found</p>
                ) : (
                  advisorDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="border border-tcs-border rounded-lg p-4"
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
                  ))
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
                <div className="border-t border-tcs-border pt-4 flex gap-2">
                  <button className="flex-1 py-2 px-4 border border-tcs-border rounded-lg text-sm hover:bg-tcs-bg flex items-center justify-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Log Call
                  </button>
                  <button className="flex-1 py-2 px-4 border border-tcs-border rounded-lg text-sm hover:bg-tcs-bg flex items-center justify-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> Schedule
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-3">
                {advisor.activity.length === 0 ? (
                  <p className="text-sm text-gray-600">No activity</p>
                ) : (
                  advisor.activity.map((item, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-gray-300 pl-4 py-2"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <SentimentBadge tone={item.sentiment} />
                        <span className="text-xs text-gray-500">{item.time}</span>
                      </div>
                      <p className="text-sm text-gray-700">{item.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'ai-prep' && (
              <div className="space-y-6">
                {/* Call Prep Summary */}
                <div className="p-4 bg-gradient-to-r from-tcs-teal to-teal-600 rounded-lg text-white">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Call Prep Summary</p>
                      <p className="text-xs mt-2 opacity-90">
                        Based on {advisor.name}'s current pulse ({advisor.pulse}) and {advisor.trajectory} trajectory, here's your prep for the next conversation:
                      </p>
                    </div>
                  </div>
                </div>

                {/* Suggested Talking Points */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase flex items-center gap-2">
                    <Target className="w-4 h-4 text-tcs-teal" />
                    Suggested Talking Points
                  </h3>
                  <ul className="space-y-2">
                    {advisorDeals.length > 0 && (
                      <li className="text-sm text-gray-700 flex gap-2">
                        <span className="text-tcs-teal font-bold">•</span>
                        <span>
                          {advisorDeals.length === 1
                            ? `Check in on ${advisorDeals[0].name} status—currently in ${advisorDeals[0].stage} stage`
                            : `Follow up on ${advisor.name}'s ${advisorDeals.length} active deals—especially ${advisorDeals[0].name} which is ${advisorDeals[0].health.toLowerCase()}`}
                        </span>
                      </li>
                    )}
                    {advisor.personalIntel && (
                      <li className="text-sm text-gray-700 flex gap-2">
                        <span className="text-tcs-teal font-bold">•</span>
                        <span>Bring up their background: {advisor.personalIntel}</span>
                      </li>
                    )}
                    {advisor.hobbies && (
                      <li className="text-sm text-gray-700 flex gap-2">
                        <span className="text-tcs-teal font-bold">•</span>
                        <span>Ask about their hobbies—they enjoy {advisor.hobbies.toLowerCase()}</span>
                      </li>
                    )}
                    {advisor.friction !== 'Low' && (
                      <li className="text-sm text-gray-700 flex gap-2">
                        <span className="text-tcs-teal font-bold">•</span>
                        <span>Address {advisor.friction.toLowerCase()} friction—show understanding and commitment to resolving concerns</span>
                      </li>
                    )}
                    {(advisor.trajectory === 'Slipping' || advisor.trajectory === 'Freefall') && (
                      <li className="text-sm text-gray-700 flex gap-2">
                        <span className="text-tcs-teal font-bold">•</span>
                        <span>Re-engagement strategy: Demonstrate renewed commitment and propose high-impact initiatives</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Relationship Health Check */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase flex items-center gap-2">
                    <Heart className="w-4 h-4 text-tcs-teal" />
                    Relationship Health Check
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Engagement</span>
                      <EngagementLabel score={advisor.engagementBreakdown.engagement} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Pipeline Strength</span>
                      <EngagementLabel score={advisor.engagementBreakdown.pipelineStrength} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Responsiveness</span>
                      <EngagementLabel score={advisor.engagementBreakdown.responsiveness} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Growth Potential</span>
                      <EngagementLabel score={advisor.engagementBreakdown.growthPotential} />
                    </div>
                  </div>
                </div>

                {/* Personal Connection Points */}
                {(advisor.birthday || advisor.family || advisor.hobbies || advisor.funFact) && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-tcs-teal" />
                      Personal Connection Points
                    </h3>
                    <ul className="space-y-2">
                      {advisor.birthday && (
                        <li className="text-sm text-gray-700 flex gap-2">
                          <span className="text-tcs-teal font-bold">•</span>
                          <span>Birthday: {advisor.birthday} — send a note or greeting</span>
                        </li>
                      )}
                      {advisor.family && (
                        <li className="text-sm text-gray-700 flex gap-2">
                          <span className="text-tcs-teal font-bold">•</span>
                          <span>Family: {advisor.family}</span>
                        </li>
                      )}
                      {advisor.hobbies && (
                        <li className="text-sm text-gray-700 flex gap-2">
                          <span className="text-tcs-teal font-bold">•</span>
                          <span>Hobbies: {advisor.hobbies}</span>
                        </li>
                      )}
                      {advisor.funFact && (
                        <li className="text-sm text-gray-700 flex gap-2">
                          <span className="text-tcs-teal font-bold">•</span>
                          <span>Fun Fact: {advisor.funFact}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Next Steps Recommendation */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-tcs-teal" />
                    Next Steps Recommendation
                  </h3>
                  <div className="bg-tcs-bg rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      {advisorDeals.some((d) => d.health === 'Stalled' || d.health === 'At Risk')
                        ? 'Re-engagement & Unblock: '
                        : advisorDeals.length > 0 && advisorDeals.some((d) => d.health === 'Healthy')
                          ? 'Expansion Conversation: '
                          : 'Exploration Meeting: '}
                    </p>
                    <p className="text-xs text-gray-700">
                      {advisorDeals.some((d) => d.health === 'Stalled' || d.health === 'At Risk')
                        ? `Focus on specific unblocking—understand blockers on ${advisorDeals[0].name} and propose concrete next steps to get momentum back.`
                        : advisorDeals.length > 0 && advisorDeals.some((d) => d.health === 'Healthy')
                          ? `Discuss expansion opportunities beyond current deals. Advisor is engaged and there's strong pipeline potential.`
                          : `Schedule exploratory call to understand ${advisor.name}'s strategic priorities and identify partnership opportunities.`}
                    </p>
                    <div className="pt-2 border-t border-gray-200 space-y-1">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Best Day to Reach:</span> {advisor.bestDayToReach}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Preferred Channel:</span> {advisor.commPreference}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-900 uppercase mb-1">
                        Diagnosis
                      </p>
                      <p className="text-sm text-gray-700 italic">
                        "{advisor.diagnosis}"
                      </p>
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
