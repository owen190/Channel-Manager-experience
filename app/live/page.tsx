'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, DollarSign, UserCheck, FileText, Mic, Activity,
  Plus, Edit, Trash2, Save, X, ChevronDown, ChevronRight,
  ArrowLeft, RefreshCw, Zap, Upload, TrendingUp,
} from 'lucide-react';

type Tab = 'advisors' | 'deals' | 'reps' | 'notes' | 'transcripts' | 'signals' | 'activity';

// ============ HELPERS ============

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/live/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error || `API error: ${res.status}`;
    console.error(`[LiveAdmin] ${opts?.method || 'GET'} /api/live/${path} failed:`, msg);
    throw new Error(msg);
  }
  return data;
}

// ============ MAIN PAGE ============

export default function LiveAdmin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('advisors');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'advisors', label: 'Advisors', icon: Users },
    { id: 'deals', label: 'Deals', icon: DollarSign },
    { id: 'reps', label: 'Reps', icon: UserCheck },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'transcripts', label: 'Transcripts', icon: Mic },
    { id: 'signals', label: 'Signals', icon: Zap },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e5e1] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-[#157A6E]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-newsreader text-xl font-bold text-gray-900">Channel Companion — Live Admin</h1>
            <p className="text-11px text-gray-500">Enter real partner data, call notes, and transcripts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} className="px-3 py-1.5 text-12px font-medium text-gray-600 border border-[#e0ddd9] rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => router.push('/live/manager')} className="px-4 py-1.5 text-12px font-semibold border border-[#157A6E] text-[#157A6E] rounded-lg hover:bg-[#157A6E]/5">
            Manager View →
          </button>
          <button onClick={() => router.push('/live/leader')} className="px-4 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg hover:bg-[#126a5f]">
            Leader View →
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#e8e5e1] px-6">
        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-3 text-13px font-medium flex items-center gap-2 border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-[#157A6E] text-[#157A6E]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activeTab === 'advisors' && <AdvisorsPanel key={refreshKey} />}
        {activeTab === 'deals' && <DealsPanel key={refreshKey} />}
        {activeTab === 'reps' && <RepsPanel key={refreshKey} />}
        {activeTab === 'notes' && <NotesPanel key={refreshKey} />}
        {activeTab === 'transcripts' && <TranscriptsPanel key={refreshKey} />}
        {activeTab === 'signals' && <SignalsPanel key={refreshKey} />}
        {activeTab === 'activity' && <ActivityPanel key={refreshKey} />}
      </div>
    </div>
  );
}

// ============ ADVISORS PANEL ============

function AdvisorsPanel() {
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api('advisors');
      setAdvisors(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (advisor: any) => {
    setSaving(true);
    setError(null);
    try {
      await api('advisors', { method: 'POST', body: JSON.stringify(advisor) });
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`advisors?id=${id}`, { method: 'DELETE' });
      await load();
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{advisors.length} Advisors</h2>
        <button onClick={() => setEditing({ id: '', name: '', title: '', company: '', mrr: 0, pulse: 'Steady', trajectory: 'Stable', tone: 'Neutral', intent: 'Moderate', friction: 'Low', dealHealth: 'Healthy', tier: 'other' })} className="px-3 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg hover:bg-[#126a5f] flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Advisor
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-12px text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {editing && (
        <AdvisorForm
          advisor={editing}
          onSave={save}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      <div className="space-y-2">
        {advisors.map(a => (
          <div key={a.id} className="bg-white rounded-lg border border-[#e8e5e1]">
            <div className="px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
              <div className="flex items-center gap-3">
                {expanded === a.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <div>
                  <p className="text-13px font-semibold text-gray-900">{a.name}</p>
                  <p className="text-11px text-gray-500">{a.title} · {a.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-13px font-bold text-[#157A6E]">${(a.mrr / 1000).toFixed(1)}K</span>
                <span className={cn('px-2 py-0.5 rounded-full text-10px font-semibold',
                  a.pulse === 'Strong' ? 'bg-green-100 text-green-700' :
                  a.pulse === 'Rising' ? 'bg-emerald-100 text-emerald-700' :
                  a.pulse === 'Fading' ? 'bg-amber-100 text-amber-700' :
                  a.pulse === 'Flatline' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                )}>{a.pulse}</span>
                <button onClick={(e) => { e.stopPropagation(); setEditing(a); }} className="p-1 text-gray-400 hover:text-[#157A6E]"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); remove(a.id); }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            {expanded === a.id && (
              <div className="px-4 pb-4 pt-1 border-t border-[#f0ede9]">
                <div className="grid grid-cols-3 gap-3 text-11px">
                  <div><span className="text-gray-500">Trajectory:</span> <span className="font-medium">{a.trajectory}</span></div>
                  <div><span className="text-gray-500">Tone:</span> <span className="font-medium">{a.tone}</span></div>
                  <div><span className="text-gray-500">Intent:</span> <span className="font-medium">{a.intent}</span></div>
                  <div><span className="text-gray-500">Friction:</span> <span className="font-medium">{a.friction}</span></div>
                  <div><span className="text-gray-500">Tier:</span> <span className="font-medium">{a.tier}</span></div>
                  <div><span className="text-gray-500">Connected:</span> <span className="font-medium">{a.connectedSince || '—'}</span></div>
                </div>
                {a.personalIntel && <p className="text-11px text-gray-600 mt-2 italic">{a.personalIntel}</p>}
                {a.diagnosis && <p className="text-11px text-blue-600 mt-1">{a.diagnosis}</p>}
              </div>
            )}
          </div>
        ))}
        {advisors.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-13px">No advisors yet. Add your first partner above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ ADVISOR FORM ============

function AdvisorForm({ advisor, onSave, onCancel, saving }: { advisor: any; onSave: (a: any) => void; onCancel: () => void; saving?: boolean }) {
  const [form, setForm] = useState(advisor);
  const set = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  return (
    <div className="bg-white rounded-lg border border-[#e8e5e1] p-5 mb-4">
      <h3 className="text-13px font-bold text-gray-900 mb-4">{form.id ? 'Edit Advisor' : 'New Advisor'}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Input label="Name" value={form.name} onChange={v => set('name', v)} />
        <Input label="Title" value={form.title} onChange={v => set('title', v)} />
        <Input label="Company" value={form.company} onChange={v => set('company', v)} />
        <Input label="MRR ($)" value={form.mrr} type="number" onChange={v => set('mrr', Number(v))} />
        <Select label="Pulse" value={form.pulse} options={['Strong', 'Steady', 'Rising', 'Fading', 'Flatline']} onChange={v => set('pulse', v)} />
        <Select label="Trajectory" value={form.trajectory} options={['Accelerating', 'Climbing', 'Stable', 'Slipping', 'Freefall']} onChange={v => set('trajectory', v)} />
        <Select label="Tone" value={form.tone} options={['Warm', 'Neutral', 'Cool']} onChange={v => set('tone', v)} />
        <Select label="Intent" value={form.intent} options={['Strong', 'Moderate', 'Low']} onChange={v => set('intent', v)} />
        <Select label="Friction" value={form.friction} options={['Low', 'Moderate', 'High', 'Critical']} onChange={v => set('friction', v)} />
        <Select label="Tier" value={form.tier} options={['top10', 'next20', 'other']} onChange={v => set('tier', v)} />
        <Input label="Connected Since" value={form.connectedSince || ''} onChange={v => set('connectedSince', v)} placeholder="2024-01-15" />
        <Input label="Location" value={form.location || ''} onChange={v => set('location', v)} />
        <Input label="Comm Preference" value={form.commPreference || ''} onChange={v => set('commPreference', v)} placeholder="Email, Phone, Teams" />
        <Input label="Best Day" value={form.bestDayToReach || ''} onChange={v => set('bestDayToReach', v)} placeholder="Tuesday" />
        <Input label="Referred By" value={form.referredBy || ''} onChange={v => set('referredBy', v)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <TextArea label="Personal Intel" value={form.personalIntel || ''} onChange={v => set('personalIntel', v)} />
        <TextArea label="Diagnosis" value={form.diagnosis || ''} onChange={v => set('diagnosis', v)} />
        <Input label="Hobbies" value={form.hobbies || ''} onChange={v => set('hobbies', v)} />
        <Input label="Family" value={form.family || ''} onChange={v => set('family', v)} />
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg flex items-center gap-1.5 disabled:opacity-50"><Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}</button>
        <button onClick={onCancel} disabled={saving} className="px-4 py-1.5 text-12px font-medium text-gray-600 border border-[#e0ddd9] rounded-lg flex items-center gap-1.5 disabled:opacity-50"><X className="w-3.5 h-3.5" /> Cancel</button>
      </div>
    </div>
  );
}

// ============ DEALS PANEL ============

function DealsPanel() {
  const [deals, setDeals] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [reps, setReps] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [d, a, r] = await Promise.all([api('deals'), api('advisors'), api('reps')]);
      setDeals(Array.isArray(d) ? d : []); setAdvisors(Array.isArray(a) ? a : []); setReps(Array.isArray(r) ? r : []);
    } catch (err: any) { setError(err.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (deal: any) => {
    setError(null);
    try {
      await api('deals', { method: 'POST', body: JSON.stringify(deal) });
      setEditing(null); await load();
    } catch (err: any) { setError(`Save failed: ${err.message}`); }
  };

  const emptyDeal = { id: '', name: '', advisorId: '', repId: '', mrr: 0, health: 'Healthy', stage: 'Discovery', probability: 50, daysInStage: 0, committed: false, forecastHistory: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{deals.length} Deals</h2>
        <button onClick={() => setEditing(emptyDeal)} className="px-3 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg hover:bg-[#126a5f] flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Deal
        </button>
      </div>

      {editing && (
        <div className="bg-white rounded-lg border border-[#e8e5e1] p-5 mb-4">
          <h3 className="text-13px font-bold text-gray-900 mb-4">{editing.id ? 'Edit Deal' : 'New Deal'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input label="Deal Name" value={editing.name} onChange={v => setEditing((e: any) => ({ ...e, name: v }))} />
            <Select label="Advisor" value={editing.advisorId} options={advisors.map(a => a.id)} optionLabels={advisors.map(a => a.name)} onChange={v => setEditing((e: any) => ({ ...e, advisorId: v }))} />
            <Select label="Rep" value={editing.repId} options={reps.map(r => r.id)} optionLabels={reps.map(r => r.name)} onChange={v => setEditing((e: any) => ({ ...e, repId: v }))} />
            <Input label="MRR ($)" value={editing.mrr} type="number" onChange={v => setEditing((e: any) => ({ ...e, mrr: Number(v) }))} />
            <Select label="Stage" value={editing.stage} options={['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled']} onChange={v => setEditing((e: any) => ({ ...e, stage: v }))} />
            <Select label="Health" value={editing.health} options={['Healthy', 'Monitor', 'At Risk', 'Stalled']} onChange={v => setEditing((e: any) => ({ ...e, health: v }))} />
            <Input label="Probability (%)" value={editing.probability} type="number" onChange={v => setEditing((e: any) => ({ ...e, probability: Number(v) }))} />
            <Input label="Days in Stage" value={editing.daysInStage} type="number" onChange={v => setEditing((e: any) => ({ ...e, daysInStage: Number(v) }))} />
            <Input label="Close Date" value={editing.closeDate || ''} onChange={v => setEditing((e: any) => ({ ...e, closeDate: v }))} placeholder="2026-04-15" />
            <Input label="Competitor" value={editing.competitor || ''} onChange={v => setEditing((e: any) => ({ ...e, competitor: v }))} />
            <Select label="Confidence" value={editing.confidenceScore || 'Medium'} options={['High', 'Medium', 'Low']} onChange={v => setEditing((e: any) => ({ ...e, confidenceScore: v }))} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => save(editing)} className="px-4 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
            <button onClick={() => setEditing(null)} className="px-4 py-1.5 text-12px font-medium text-gray-600 border border-[#e0ddd9] rounded-lg flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {deals.map(d => {
          const adv = advisors.find(a => a.id === d.advisorId);
          return (
            <div key={d.id} className="bg-white rounded-lg border border-[#e8e5e1] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-13px font-semibold text-gray-900">{d.name}</p>
                <p className="text-11px text-gray-500">{adv?.name || d.advisorId} · {d.stage} · {d.health}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-13px font-bold text-[#157A6E]">${(d.mrr / 1000).toFixed(1)}K</span>
                <span className="text-11px text-gray-500">{d.probability}%</span>
                <button onClick={() => setEditing(d)} className="p-1 text-gray-400 hover:text-[#157A6E]"><Edit className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          );
        })}
        {deals.length === 0 && <EmptyState icon={DollarSign} text="No deals yet. Add advisors first, then create deals." />}
      </div>
    </div>
  );
}

// ============ REPS PANEL ============

function RepsPanel() {
  const [reps, setReps] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const data = await api('reps'); setReps(Array.isArray(data) ? data : []); }
    catch (err: any) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (rep: any) => {
    setError(null);
    try {
      await api('reps', { method: 'POST', body: JSON.stringify(rep) });
      setEditing(null); await load();
    } catch (err: any) { setError(`Save failed: ${err.message}`); }
  };

  const emptyRep = { id: '', name: '', title: '', managedMRR: 0, activeDeals: 0, quotaTarget: 0, closedWon: 0, commitTarget: 0, currentCommit: 0, partnerCount: 0, partnerCapacity: 30, top10: 0, next20: 0, other: 0, winRate: 0, avgCycle: 0, engagementScore: 'Steady', dealsWonQTD: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{reps.length} Reps</h2>
        <button onClick={() => setEditing(emptyRep)} className="px-3 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Rep</button>
      </div>

      {editing && (
        <div className="bg-white rounded-lg border border-[#e8e5e1] p-5 mb-4">
          <h3 className="text-13px font-bold text-gray-900 mb-4">{editing.id ? 'Edit Rep' : 'New Rep'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input label="Name" value={editing.name} onChange={v => setEditing((e: any) => ({ ...e, name: v }))} />
            <Input label="Title" value={editing.title} onChange={v => setEditing((e: any) => ({ ...e, title: v }))} />
            <Input label="Managed MRR" value={editing.managedMRR} type="number" onChange={v => setEditing((e: any) => ({ ...e, managedMRR: Number(v) }))} />
            <Input label="Quota Target" value={editing.quotaTarget} type="number" onChange={v => setEditing((e: any) => ({ ...e, quotaTarget: Number(v) }))} />
            <Input label="Win Rate (%)" value={editing.winRate} type="number" onChange={v => setEditing((e: any) => ({ ...e, winRate: Number(v) }))} />
            <Input label="Avg Cycle (days)" value={editing.avgCycle} type="number" onChange={v => setEditing((e: any) => ({ ...e, avgCycle: Number(v) }))} />
            <Input label="Partner Count" value={editing.partnerCount} type="number" onChange={v => setEditing((e: any) => ({ ...e, partnerCount: Number(v) }))} />
            <Input label="Partner Capacity" value={editing.partnerCapacity} type="number" onChange={v => setEditing((e: any) => ({ ...e, partnerCapacity: Number(v) }))} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => save(editing)} className="px-4 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
            <button onClick={() => setEditing(null)} className="px-4 py-1.5 text-12px font-medium text-gray-600 border border-[#e0ddd9] rounded-lg flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {reps.map(r => (
          <div key={r.id} className="bg-white rounded-lg border border-[#e8e5e1] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-13px font-semibold text-gray-900">{r.name}</p>
              <p className="text-11px text-gray-500">{r.title} · {r.partnerCount}/{r.partnerCapacity} partners</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-13px font-bold text-[#157A6E]">${(r.managedMRR / 1000).toFixed(0)}K</span>
              <span className="text-11px text-gray-500">{r.winRate}% win</span>
              <button onClick={() => setEditing(r)} className="p-1 text-gray-400 hover:text-[#157A6E]"><Edit className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {reps.length === 0 && <EmptyState icon={UserCheck} text="No reps yet. Add your channel managers." />}
      </div>
    </div>
  );
}

// ============ NOTES PANEL ============

function NotesPanel() {
  const [notes, setNotes] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [newNote, setNewNote] = useState({ advisorId: '', content: '', noteType: 'general', author: 'Owen', source: 'Manual' });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const [n, a] = await Promise.all([api('notes'), api('advisors')]);
      setNotes(Array.isArray(n) ? n : []); setAdvisors(Array.isArray(a) ? a : []);
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!newNote.content.trim()) return;
    try {
      await api('notes', { method: 'POST', body: JSON.stringify(newNote) });
      setNewNote({ advisorId: '', content: '', noteType: 'general', author: 'Owen', source: 'Manual' });
      setShowForm(false); await load();
    } catch (err: any) { alert(`Save failed: ${err.message}`); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{notes.length} Notes</h2>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Note</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-[#e8e5e1] p-5 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Select label="Advisor" value={newNote.advisorId} options={['', ...advisors.map(a => a.id)]} optionLabels={['(None)', ...advisors.map(a => a.name)]} onChange={v => setNewNote(n => ({ ...n, advisorId: v }))} />
            <Select label="Type" value={newNote.noteType} options={['general', 'call_note', 'meeting_note', 'email', 'transcript']} onChange={v => setNewNote(n => ({ ...n, noteType: v }))} />
            <Input label="Author" value={newNote.author} onChange={v => setNewNote(n => ({ ...n, author: v }))} />
            <Select label="Source" value={newNote.source || 'Manual'} options={['Manual', 'Gong', 'Fireflies', 'CRM', 'Email']} onChange={v => setNewNote(n => ({ ...n, source: v }))} />
          </div>
          <TextArea label="Content" value={newNote.content} onChange={v => setNewNote(n => ({ ...n, content: v }))} rows={4} />
          <div className="flex gap-2 mt-3">
            <button onClick={save} className="px-4 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-12px font-medium text-gray-600 border border-[#e0ddd9] rounded-lg"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {notes.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map((n: any) => {
          const adv = advisors.find(a => a.id === n.advisorId);
          return (
            <div key={n.id} className="bg-white rounded-lg border border-[#e8e5e1] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-10px font-semibold bg-gray-100 text-gray-600">{n.noteType}</span>
                {adv && <span className="text-11px text-[#157A6E] font-medium">{adv.name}</span>}
                <span className="text-10px text-gray-400 ml-auto">{n.author} · {n.source} · {new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-12px text-gray-700 whitespace-pre-wrap">{n.content}</p>
            </div>
          );
        })}
        {notes.length === 0 && <EmptyState icon={FileText} text="No notes yet. Add call notes, meeting notes, or emails." />}
      </div>
    </div>
  );
}

// ============ TRANSCRIPTS PANEL ============

function TranscriptsPanel() {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTranscript, setNewTranscript] = useState({ advisorId: '', title: '', source: 'manual', content: '', summary: '', durationMinutes: 0 });

  const load = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([api('transcripts'), api('advisors')]);
      setTranscripts(Array.isArray(t) ? t : []); setAdvisors(Array.isArray(a) ? a : []);
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!newTranscript.content.trim()) return;
    try {
      await api('transcripts', { method: 'POST', body: JSON.stringify(newTranscript) });
      setNewTranscript({ advisorId: '', title: '', source: 'manual', content: '', summary: '', durationMinutes: 0 });
      setShowForm(false); await load();
    } catch (err: any) { alert(`Save failed: ${err.message}`); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{transcripts.length} Transcripts</h2>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Transcript</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-[#e8e5e1] p-5 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Input label="Title" value={newTranscript.title} onChange={v => setNewTranscript(t => ({ ...t, title: v }))} placeholder="Q4 Pipeline Review with Sarah" />
            <Select label="Advisor" value={newTranscript.advisorId} options={['', ...advisors.map(a => a.id)]} optionLabels={['(None)', ...advisors.map(a => a.name)]} onChange={v => setNewTranscript(t => ({ ...t, advisorId: v }))} />
            <Select label="Source" value={newTranscript.source} options={['manual', 'gong', 'fireflies']} onChange={v => setNewTranscript(t => ({ ...t, source: v }))} />
            <Input label="Duration (min)" value={newTranscript.durationMinutes} type="number" onChange={v => setNewTranscript(t => ({ ...t, durationMinutes: Number(v) }))} />
          </div>
          <TextArea label="Transcript Content" value={newTranscript.content} onChange={v => setNewTranscript(t => ({ ...t, content: v }))} rows={6} placeholder="Paste full transcript here..." />
          <TextArea label="Summary (optional)" value={newTranscript.summary || ''} onChange={v => setNewTranscript(t => ({ ...t, summary: v }))} rows={2} />
          <div className="flex gap-2 mt-3">
            <button onClick={save} className="px-4 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-12px font-medium text-gray-600 border border-[#e0ddd9] rounded-lg"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {transcripts.map((t: any) => {
          const adv = advisors.find(a => a.id === t.advisorId);
          return (
            <div key={t.id} className="bg-white rounded-lg border border-[#e8e5e1] p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-13px font-semibold text-gray-900">{t.title}</p>
                  <p className="text-11px text-gray-500">{adv?.name || ''} · {t.source} · {t.durationMinutes}min</p>
                </div>
                <span className="text-10px text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
              {t.summary && <p className="text-12px text-blue-600 mb-1">{t.summary}</p>}
              <p className="text-11px text-gray-600 line-clamp-3">{t.content.substring(0, 300)}...</p>
            </div>
          );
        })}
        {transcripts.length === 0 && <EmptyState icon={Mic} text="No transcripts yet. Paste call transcripts from Gong or Fireflies." />}
      </div>
    </div>
  );
}

// ============ SIGNALS PANEL ============

const SIGNAL_TYPES = [
  { value: 'quote_request', label: 'Quote Request' },
  { value: 'product_inquiry', label: 'Product Inquiry' },
  { value: 'pricing_request', label: 'Pricing Request' },
  { value: 'demo_request', label: 'Demo Request' },
  { value: 'technical_eval', label: 'Technical Evaluation' },
  { value: 'training_completed', label: 'Training Completed' },
  { value: 'portal_login', label: 'Portal Login' },
  { value: 'spec_download', label: 'Spec/Doc Download' },
];

function SignalsPanel() {
  const [signals, setSignals] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [intents, setIntents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkCSV, setBulkCSV] = useState('');
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSignal, setNewSignal] = useState({
    advisorId: '', signalType: 'quote_request', product: '', value: 0, notes: '', source: 'Manual',
    occurredAt: new Date().toISOString().split('T')[0],
  });

  const load = useCallback(async () => {
    try {
      const [s, a, i] = await Promise.all([api('signals'), api('advisors'), api('intent')]);
      setSignals(Array.isArray(s) ? s : []);
      setAdvisors(Array.isArray(a) ? a : []);
      setIntents(Array.isArray(i) ? i : []);
    } catch (err: any) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!newSignal.advisorId) { setError('Select an advisor'); return; }
    setError(null);
    try {
      await api('signals', { method: 'POST', body: JSON.stringify({
        ...newSignal,
        value: newSignal.value || undefined,
        occurredAt: new Date(newSignal.occurredAt).toISOString(),
      })});
      setNewSignal({ advisorId: '', signalType: 'quote_request', product: '', value: 0, notes: '', source: 'Manual', occurredAt: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      await load();
    } catch (err: any) { setError(`Save failed: ${err.message}`); }
  };

  const bulkImport = async () => {
    setError(null); setBulkResult(null);
    try {
      const lines = bulkCSV.trim().split('\n').filter(l => l.trim());
      if (lines.length < 2) { setError('Need a header row + at least 1 data row'); return; }
      const headers = lines[0].split(/[,\t]/).map(h => h.trim().toLowerCase());
      const signals = lines.slice(1).map(line => {
        const cols = line.split(/[,\t]/).map(c => c.trim());
        const row: any = {};
        headers.forEach((h, i) => {
          if (h === 'advisor' || h === 'advisor_name' || h === 'advisorname') {
            const adv = advisors.find((a: any) => a.name.toLowerCase().includes(cols[i]?.toLowerCase()));
            if (adv) row.advisorId = adv.id;
          } else if (h === 'advisorid' || h === 'advisor_id') {
            row.advisorId = cols[i];
          } else if (h === 'type' || h === 'signal' || h === 'signaltype' || h === 'signal_type') {
            // Map friendly names to signal types
            const val = cols[i]?.toLowerCase().replace(/\s+/g, '_');
            const match = SIGNAL_TYPES.find(st => st.value === val || st.label.toLowerCase().replace(/\s+/g, '_') === val);
            row.signalType = match?.value || val || 'product_inquiry';
          } else if (h === 'product') {
            row.product = cols[i];
          } else if (h === 'value' || h === 'amount' || h === 'mrr') {
            row.value = parseFloat(cols[i]?.replace(/[$,K]/gi, '')) || 0;
            if (cols[i]?.toLowerCase().includes('k')) row.value *= 1000;
          } else if (h === 'date' || h === 'occurred' || h === 'occurredat' || h === 'occurred_at') {
            row.occurredAt = new Date(cols[i]).toISOString();
          } else if (h === 'notes' || h === 'note') {
            row.notes = cols[i];
          } else if (h === 'source') {
            row.source = cols[i];
          }
        });
        if (!row.occurredAt) row.occurredAt = new Date().toISOString();
        if (!row.signalType) row.signalType = 'product_inquiry';
        return row;
      }).filter(r => r.advisorId);

      if (signals.length === 0) {
        setError('No valid rows found. Make sure there\'s an "advisor" or "advisor_name" column matching your advisors.');
        return;
      }

      const result = await api('signals', { method: 'POST', body: JSON.stringify(signals) });
      setBulkResult(`Imported ${result.imported} signals`);
      setBulkCSV('');
      setShowBulk(false);
      await load();
    } catch (err: any) { setError(`Import failed: ${err.message}`); }
  };

  const remove = async (id: string) => {
    try { await api(`signals?id=${id}`, { method: 'DELETE' }); await load(); }
    catch (err: any) { setError(`Delete failed: ${err.message}`); }
  };

  const intentColors: Record<string, string> = {
    Hot: 'bg-red-100 text-red-700',
    Warm: 'bg-amber-100 text-amber-700',
    Interested: 'bg-blue-100 text-blue-700',
    Cold: 'bg-gray-100 text-gray-500',
  };

  const signalTypeColors: Record<string, string> = {
    quote_request: 'bg-red-100 text-red-700',
    pricing_request: 'bg-orange-100 text-orange-700',
    demo_request: 'bg-violet-100 text-violet-700',
    technical_eval: 'bg-indigo-100 text-indigo-700',
    product_inquiry: 'bg-blue-100 text-blue-700',
    spec_download: 'bg-cyan-100 text-cyan-700',
    training_completed: 'bg-green-100 text-green-700',
    portal_login: 'bg-gray-100 text-gray-600',
  };

  return (
    <div>
      {/* Revenue Intent Scoreboard */}
      {intents.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#157A6E]" /> Revenue Intent
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {intents.filter((i: any) => i.signals90d > 0).sort((a: any, b: any) => b.score - a.score).map((intent: any) => (
              <div key={intent.advisorId} className="bg-white rounded-lg border border-[#e8e5e1] p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-13px font-semibold text-gray-900">{intent.advisorName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-10px font-bold ${intentColors[intent.label] || 'bg-gray-100'}`}>{intent.label}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${intent.score >= 70 ? 'bg-red-400' : intent.score >= 40 ? 'bg-amber-400' : intent.score >= 15 ? 'bg-blue-400' : 'bg-gray-300'}`}
                         style={{ width: `${intent.score}%` }} />
                  </div>
                  <span className="text-11px font-semibold text-gray-600">{intent.score}</span>
                </div>
                <div className="text-10px text-gray-500 space-y-0.5">
                  <div>{intent.signals30d} signals (30d) · {intent.quoteCount30d} quotes</div>
                  {intent.topProducts.length > 0 && <div>Products: {intent.topProducts.join(', ')}</div>}
                  {intent.totalEstimatedValue > 0 && <div>Est. value: ${(intent.totalEstimatedValue / 1000).toFixed(1)}K</div>}
                </div>
              </div>
            ))}
          </div>
          {intents.filter((i: any) => i.signals90d > 0).length === 0 && (
            <p className="text-12px text-gray-400 italic">Log engagement signals below to see Revenue Intent scores.</p>
          )}
        </div>
      )}

      {/* Signals List Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{signals.length} Engagement Signals</h2>
        <div className="flex gap-2">
          <button onClick={() => { setShowBulk(true); setShowForm(false); }} className="px-3 py-1.5 text-12px font-medium text-gray-600 border border-[#e0ddd9] rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Bulk Import
          </button>
          <button onClick={() => { setShowForm(true); setShowBulk(false); }} className="px-3 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg hover:bg-[#126a5f] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Log Signal
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-12px text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {bulkResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <span className="text-12px text-green-700">{bulkResult}</span>
          <button onClick={() => setBulkResult(null)} className="text-green-400 hover:text-green-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Bulk Import Form */}
      {showBulk && (
        <div className="bg-white rounded-lg border border-[#e8e5e1] p-5 mb-4">
          <h3 className="text-13px font-bold text-gray-900 mb-2">Bulk Import from CSV/TSV</h3>
          <p className="text-11px text-gray-500 mb-3">
            Paste CSV or tab-separated data. Required columns: <strong>advisor</strong> (or advisor_name) + <strong>type</strong> (signal type).
            Optional: product, value, date, notes, source.
          </p>
          <p className="text-10px text-gray-400 mb-2 font-mono">
            Example: advisor, type, product, value, date, notes<br />
            Sarah Chen, quote_request, SD-WAN, 5000, 2026-03-15, Urgent deployment
          </p>
          <TextArea label="" value={bulkCSV} onChange={setBulkCSV} rows={8} placeholder="Paste your CSV/TSV data here..." />
          <div className="flex gap-2 mt-3">
            <button onClick={bulkImport} className="px-4 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Import</button>
            <button onClick={() => setShowBulk(false)} className="px-4 py-1.5 text-12px font-medium text-gray-600 border border-[#e0ddd9] rounded-lg"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {/* Single Signal Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-[#e8e5e1] p-5 mb-4">
          <h3 className="text-13px font-bold text-gray-900 mb-4">Log Engagement Signal</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Select label="Advisor *" value={newSignal.advisorId} options={['', ...advisors.map((a: any) => a.id)]} optionLabels={['(Select)', ...advisors.map((a: any) => a.name)]} onChange={v => setNewSignal(s => ({ ...s, advisorId: v }))} />
            <Select label="Signal Type" value={newSignal.signalType} options={SIGNAL_TYPES.map(st => st.value)} optionLabels={SIGNAL_TYPES.map(st => st.label)} onChange={v => setNewSignal(s => ({ ...s, signalType: v }))} />
            <Input label="Product" value={newSignal.product} onChange={v => setNewSignal(s => ({ ...s, product: v }))} placeholder="SD-WAN, UCaaS, etc." />
            <Input label="Est. Value ($)" value={newSignal.value || ''} type="number" onChange={v => setNewSignal(s => ({ ...s, value: Number(v) }))} placeholder="5000" />
            <Input label="Date" value={newSignal.occurredAt} onChange={v => setNewSignal(s => ({ ...s, occurredAt: v }))} placeholder="2026-03-15" />
            <Select label="Source" value={newSignal.source} options={['Manual', 'CRM', 'Portal', 'Email', 'Gong']} onChange={v => setNewSignal(s => ({ ...s, source: v }))} />
          </div>
          <div className="mt-3">
            <Input label="Notes" value={newSignal.notes} onChange={v => setNewSignal(s => ({ ...s, notes: v }))} placeholder="Optional context..." />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="px-4 py-1.5 text-12px font-semibold bg-[#157A6E] text-white rounded-lg flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Log Signal</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-12px font-medium text-gray-600 border border-[#e0ddd9] rounded-lg"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {/* Signals List */}
      <div className="space-y-2">
        {signals.map((s: any) => {
          const adv = advisors.find((a: any) => a.id === s.advisorId);
          const typeLabel = SIGNAL_TYPES.find(st => st.value === s.signalType)?.label || s.signalType;
          return (
            <div key={s.id} className="bg-white rounded-lg border border-[#e8e5e1] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-10px font-semibold whitespace-nowrap ${signalTypeColors[s.signalType] || 'bg-gray-100 text-gray-600'}`}>{typeLabel}</span>
                <div>
                  <p className="text-13px font-medium text-gray-900">{adv?.name || 'Unknown'} {s.product ? `— ${s.product}` : ''}</p>
                  <p className="text-11px text-gray-500">
                    {new Date(s.occurredAt).toLocaleDateString()}
                    {s.value ? ` · $${(s.value/1000).toFixed(1)}K` : ''}
                    {s.source ? ` · ${s.source}` : ''}
                    {s.notes ? ` · ${s.notes}` : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => remove(s.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          );
        })}
        {signals.length === 0 && <EmptyState icon={Zap} text="No engagement signals yet. Log quoting activity, product inquiries, demo requests, and more." />}
      </div>
    </div>
  );
}

// ============ ACTIVITY PANEL ============

function ActivityPanel() {
  const [activity, setActivity] = useState<any[]>([]);
  const load = useCallback(async () => { setActivity(await api('activity')); }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Activity Log</h2>
      <div className="space-y-2">
        {activity.map((a: any) => (
          <div key={a.id} className="bg-white rounded-lg border border-[#e8e5e1] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded text-10px font-semibold bg-gray-100 text-gray-600">{a.activityType}</span>
              <p className="text-12px text-gray-700">{a.description}</p>
            </div>
            <span className="text-10px text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
          </div>
        ))}
        {activity.length === 0 && <EmptyState icon={Activity} text="Activity will appear here as you add data." />}
      </div>
    </div>
  );
}

// ============ SHARED COMPONENTS ============

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: any; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-10px font-semibold text-gray-500 uppercase mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-1.5 text-12px border border-[#e0ddd9] rounded-lg bg-white focus:outline-none focus:border-[#157A6E]" />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="block text-10px font-semibold text-gray-500 uppercase mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full px-3 py-1.5 text-12px border border-[#e0ddd9] rounded-lg bg-white focus:outline-none focus:border-[#157A6E] resize-none" />
    </div>
  );
}

function Select({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: string[]; optionLabels?: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-10px font-semibold text-gray-500 uppercase mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-1.5 text-12px border border-[#e0ddd9] rounded-lg bg-white focus:outline-none focus:border-[#157A6E]">
        {options.map((opt, i) => (
          <option key={opt} value={opt}>{optionLabels ? optionLabels[i] : opt}</option>
        ))}
      </select>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-13px">{text}</p>
    </div>
  );
}
