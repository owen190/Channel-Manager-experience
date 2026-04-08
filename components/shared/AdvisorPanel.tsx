'use client';

import { useState, useEffect } from 'react';
import { MapPin, Cake, GraduationCap, Briefcase, Phone, Mail, CalendarDays, Sparkles, Target, Heart, MessageCircle, Lightbulb, AlertCircle, Pencil, Check, X as XIcon } from 'lucide-react';
import { Advisor, Deal, EngagementScore, PartnerTier, RelationshipStage } from '@/lib/types';
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
  onUpdateAdvisor?: (field: string, value: any) => void;
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
  onUpdateAdvisor,
}: AdvisorPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [notes, setNotes] = useState<string[]>(advisor?.notes || []);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [sharedMeetings, setSharedMeetings] = useState<Record<string, boolean>>({});
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);
  const [ratings, setRatings] = useState<any>(null);
  const [logCallOpen, setLogCallOpen] = useState(false);
  const [logContactType, setLogContactType] = useState<'call' | 'email'>('call');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [callDate, setCallDate] = useState('');
  const [callDuration, setCallDuration] = useState('');
  const [callSummary, setCallSummary] = useState('');
  const [callSentiment, setCallSentiment] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [scheduleConfirmation, setScheduleConfirmation] = useState(false);
  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

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

  const advisorDeals = deals.filter((d) => d.advisorIds?.includes(advisor.id) || d.advisorId === advisor.id);
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

  // Inline editing helpers
  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditingValue(String(currentValue ?? ''));
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const saveEditing = (field: string) => {
    if (onUpdateAdvisor) {
      const value = field === 'mrr' ? parseInt(editingValue) || 0 : editingValue;
      onUpdateAdvisor(field, value);
    }
    setEditingField(null);
    setEditingValue('');
  };

  const renderEditableField = (field: string, currentValue: any, options?: { type?: string; selectOptions?: { value: string; label: string }[] }) => {
    if (editingField === field) {
      if (options?.selectOptions) {
        return (
          <div className="flex items-center gap-1">
            <select
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              className="px-2 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-tcs-teal bg-white"
              autoFocus
            >
              {options.selectOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button onClick={() => saveEditing(field)} className="text-green-600 hover:text-green-700"><Check className="w-3 h-3" /></button>
            <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600"><XIcon className="w-3 h-3" /></button>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1">
          <input
            type={options?.type || 'text'}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveEditing(field); if (e.key === 'Escape') cancelEditing(); }}
            className="px-2 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-tcs-teal w-full max-w-[180px]"
            autoFocus
          />
          <button onClick={() => saveEditing(field)} className="text-green-600 hover:text-green-700"><Check className="w-3 h-3" /></button>
          <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600"><XIcon className="w-3 h-3" /></button>
        </div>
      );
    }
    return (
      <span
        className={`font-medium text-gray-900 ${onUpdateAdvisor ? 'cursor-pointer hover:text-tcs-teal group/edit' : ''}`}
        onClick={() => onUpdateAdvisor && startEditing(field, currentValue)}
      >
        {currentValue || '—'}
        {onUpdateAdvisor && <Pencil className="w-2.5 h-2.5 inline ml-1 opacity-0 group-hover/edit:opacity-50" />}
      </span>
    );
  };

  const handleSaveCall = () => {
    const isEmail = logContactType === 'email';
    if (isEmail ? (callDate && callSummary.trim()) : (callDate && callDuration && callSummary.trim())) {
      const logNote = isEmail
        ? `Email on ${callDate}: ${callSummary}${callSentiment ? ` [Sentiment: ${callSentiment}]` : ''}`
        : `Call on ${callDate} (${callDuration}m): ${callSummary}${callSentiment ? ` [Sentiment: ${callSentiment}]` : ''}`;
      setNotes([...notes, logNote]);
      setCallDate('');
      setCallDuration('');
      setCallSummary('');
      setCallSentiment('');
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
                {editingField === 'name' ? (
                  <div className="flex items-center gap-1 mb-1">
                    <input value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEditing('name'); if (e.key === 'Escape') cancelEditing(); }} className="px-2 py-0.5 border border-gray-200 rounded text-sm font-bold focus:outline-none focus:ring-1 focus:ring-tcs-teal" autoFocus />
                    <button onClick={() => saveEditing('name')} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={cancelEditing} className="text-gray-400"><XIcon className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <h2 className={`font-bold text-lg text-gray-900 ${onUpdateAdvisor ? 'cursor-pointer hover:text-tcs-teal' : ''}`} onClick={() => onUpdateAdvisor && startEditing('name', advisor.name)}>
                    {advisor.name}
                    {onUpdateAdvisor && <Pencil className="w-3 h-3 inline ml-1 opacity-0 hover:opacity-50" />}
                  </h2>
                )}
                {editingField === 'title' ? (
                  <div className="flex items-center gap-1 mb-0.5">
                    <input value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEditing('title'); if (e.key === 'Escape') cancelEditing(); }} className="px-2 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-tcs-teal" autoFocus />
                    <button onClick={() => saveEditing('title')} className="text-green-600"><Check className="w-3 h-3" /></button>
                    <button onClick={cancelEditing} className="text-gray-400"><XIcon className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <p className={`text-sm text-gray-600 ${onUpdateAdvisor ? 'cursor-pointer hover:text-tcs-teal' : ''}`} onClick={() => onUpdateAdvisor && startEditing('title', advisor.title)}>
                    {advisor.title}{onUpdateAdvisor && <Pencil className="w-2.5 h-2.5 inline ml-1 opacity-0 hover:opacity-50" />}
                  </p>
                )}
                <p className="text-xs text-gray-500">{advisor.company}</p>
                {(advisor.phone || advisor.email) && (
                  <div className="flex items-center gap-3 mt-1">
                    {advisor.phone && (
                      <button onClick={() => { setLogContactType('call'); setLogCallOpen(true); setActiveTab('notes'); }} className="text-xs text-[#157A6E] hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {advisor.phone}
                      </button>
                    )}
                    {advisor.email && (
                      <button onClick={() => { setLogContactType('email'); setLogCallOpen(true); setActiveTab('notes'); }} className="text-xs text-[#157A6E] hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {advisor.email}
                      </button>
                    )}
                  </div>
                )}
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
                  {editingField === 'mrr' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-tcs-teal">$</span>
                      <input type="number" value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEditing('mrr'); if (e.key === 'Escape') cancelEditing(); }} className="w-32 px-2 py-1 border border-gray-200 rounded text-xl font-bold focus:outline-none focus:ring-1 focus:ring-tcs-teal" autoFocus />
                      <button onClick={() => saveEditing('mrr')} className="text-green-600"><Check className="w-4 h-4" /></button>
                      <button onClick={cancelEditing} className="text-gray-400"><XIcon className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className={`text-3xl font-bold text-tcs-teal ${onUpdateAdvisor ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={() => onUpdateAdvisor && startEditing('mrr', advisor.mrr)}>
                      ${(advisor.mrr / 1000).toFixed(1)}K
                      {onUpdateAdvisor && <Pencil className="w-3.5 h-3.5 inline ml-2 opacity-0 hover:opacity-50" />}
                    </div>
                  )}
                </div>

                {/* Relationship Context */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">
                    Relationship Context
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Tier</dt>
                      <dd>{renderEditableField('tier', advisor.tier, { selectOptions: [{ value: 'anchor', label: 'Anchor' }, { value: 'scaling', label: 'Scaling' }, { value: 'building', label: 'Building' }, { value: 'launching', label: 'Launching' }] })}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Stage</dt>
                      <dd>{renderEditableField('relationshipStage', advisor.relationshipStage || 'Prospect', { selectOptions: [{ value: 'Prospect', label: 'Prospect' }, { value: 'Onboarding', label: 'Onboarding' }, { value: 'Activated', label: 'Activated' }, { value: 'Scaling', label: 'Scaling' }, { value: 'Strategic', label: 'Strategic' }] })}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Connected Since</dt>
                      <dd>{renderEditableField('connectedSince', advisor.connectedSince, { type: 'date' })}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Best Day</dt>
                      <dd>{renderEditableField('bestDayToReach', advisor.bestDayToReach)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Comm Pref</dt>
                      <dd>{renderEditableField('commPreference', advisor.commPreference)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Referred By</dt>
                      <dd>{renderEditableField('referredBy', advisor.referredBy)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Phone</dt>
                      <dd>{renderEditableField('phone', advisor.phone || '', { type: 'tel' })}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Email</dt>
                      <dd>{renderEditableField('email', advisor.email || '', { type: 'email' })}</dd>
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
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">
                    Personal Intel
                  </h3>
                  {editingField === 'personalIntel' ? (
                    <div className="space-y-2">
                      <textarea value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tcs-teal" rows={4} autoFocus />
                      <div className="flex gap-2">
                        <button onClick={() => saveEditing('personalIntel')} className="px-3 py-1 bg-tcs-teal text-white rounded text-xs font-medium hover:bg-opacity-90">Save</button>
                        <button onClick={cancelEditing} className="px-3 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm text-gray-700 ${onUpdateAdvisor ? 'cursor-pointer hover:text-tcs-teal' : ''}`} onClick={() => onUpdateAdvisor && startEditing('personalIntel', advisor.personalIntel)}>
                      {advisor.personalIntel || '—'}
                      {onUpdateAdvisor && <Pencil className="w-2.5 h-2.5 inline ml-1 opacity-0 hover:opacity-50" />}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2 italic">Compiled from CRM notes, call transcripts, and LinkedIn</p>
                </div>

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
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</dt>
                      <dd>{renderEditableField('location', advisor.location)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600 flex items-center gap-1.5"><Cake className="w-3.5 h-3.5" /> Birthday</dt>
                      <dd>{renderEditableField('birthday', advisor.birthday)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Education</dt>
                      <dd>{renderEditableField('education', advisor.education)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Title</dt>
                      <dd>{renderEditableField('title', advisor.title)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Family */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">
                    Family
                  </h3>
                  {editingField === 'family' ? (
                    <div className="space-y-2">
                      <textarea value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tcs-teal" rows={2} autoFocus />
                      <div className="flex gap-2">
                        <button onClick={() => saveEditing('family')} className="px-3 py-1 bg-tcs-teal text-white rounded text-xs font-medium">Save</button>
                        <button onClick={cancelEditing} className="px-3 py-1 border border-gray-200 rounded text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm text-gray-700 ${onUpdateAdvisor ? 'cursor-pointer hover:text-tcs-teal' : ''}`} onClick={() => onUpdateAdvisor && startEditing('family', advisor.family)}>
                      {advisor.family || '—'}{onUpdateAdvisor && <Pencil className="w-2.5 h-2.5 inline ml-1 opacity-0 hover:opacity-50" />}
                    </p>
                  )}
                </div>

                {/* Hobbies */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">
                    Hobbies & Interests
                  </h3>
                  {editingField === 'hobbies' ? (
                    <div className="space-y-2">
                      <textarea value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tcs-teal" rows={2} autoFocus />
                      <div className="flex gap-2">
                        <button onClick={() => saveEditing('hobbies')} className="px-3 py-1 bg-tcs-teal text-white rounded text-xs font-medium">Save</button>
                        <button onClick={cancelEditing} className="px-3 py-1 border border-gray-200 rounded text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm text-gray-700 ${onUpdateAdvisor ? 'cursor-pointer hover:text-tcs-teal' : ''}`} onClick={() => onUpdateAdvisor && startEditing('hobbies', advisor.hobbies)}>
                      {advisor.hobbies || '—'}{onUpdateAdvisor && <Pencil className="w-2.5 h-2.5 inline ml-1 opacity-0 hover:opacity-50" />}
                    </p>
                  )}
                </div>

                {/* Fun Fact */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase">
                    Fun Fact
                  </h3>
                  {editingField === 'funFact' ? (
                    <div className="space-y-2">
                      <textarea value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tcs-teal" rows={2} autoFocus />
                      <div className="flex gap-2">
                        <button onClick={() => saveEditing('funFact')} className="px-3 py-1 bg-tcs-teal text-white rounded text-xs font-medium">Save</button>
                        <button onClick={cancelEditing} className="px-3 py-1 border border-gray-200 rounded text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm text-gray-700 ${onUpdateAdvisor ? 'cursor-pointer hover:text-tcs-teal' : ''}`} onClick={() => onUpdateAdvisor && startEditing('funFact', advisor.funFact)}>
                      {advisor.funFact || '—'}{onUpdateAdvisor && <Pencil className="w-2.5 h-2.5 inline ml-1 opacity-0 hover:opacity-50" />}
                    </p>
                  )}
                </div>

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
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setLogContactType('call'); setLogCallOpen(true); }}
                        className="flex-1 py-2 px-4 border border-tcs-border rounded-lg text-sm hover:bg-tcs-bg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" /> Log Call
                      </button>
                      <button
                        onClick={() => { setLogContactType('email'); setLogCallOpen(true); }}
                        className="flex-1 py-2 px-4 border border-tcs-border rounded-lg text-sm hover:bg-tcs-bg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" /> Log Email
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-tcs-bg p-3 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        {logContactType === 'call' ? 'Log Call' : 'Log Email'}
                      </p>
                      <input
                        type="date"
                        value={callDate}
                        onChange={(e) => setCallDate(e.target.value)}
                        className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
                        placeholder="Date"
                      />
                      {logContactType === 'call' && (
                        <input
                          type="number"
                          value={callDuration}
                          onChange={(e) => setCallDuration(e.target.value)}
                          className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
                          placeholder="Duration (minutes)"
                        />
                      )}
                      <textarea
                        value={callSummary}
                        onChange={(e) => setCallSummary(e.target.value)}
                        className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
                        placeholder={logContactType === 'call' ? 'Call summary...' : 'Email summary...'}
                        rows={3}
                      />
                      <select
                        value={callSentiment}
                        onChange={(e) => setCallSentiment(e.target.value)}
                        className="w-full px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal bg-white"
                      >
                        <option value="">Sentiment (optional)</option>
                        <option value="Positive">Positive</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Negative">Negative</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCall}
                          className="flex-1 py-2 px-4 bg-tcs-teal text-white rounded-lg text-sm font-medium hover:bg-opacity-90"
                        >
                          {logContactType === 'call' ? 'Save Call' : 'Save Email'}
                        </button>
                        <button
                          onClick={() => {
                            setLogCallOpen(false);
                            setCallDate('');
                            setCallDuration('');
                            setCallSummary('');
                            setCallSentiment('');
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
