'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, ChevronDown } from 'lucide-react';
import { Deal, DealStage, DealHealth, Advisor } from '@/lib/types';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Partial<Deal>) => Promise<void>;
  onSavePartner?: (partner: Partial<Advisor>) => Promise<void>;
  editingDeal: Deal | null;
  advisors: Advisor[];
  existingCompanies?: string[];
}

const STAGES: DealStage[] = ['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'];
const HEALTH_OPTIONS: DealHealth[] = ['Healthy', 'Monitor', 'At Risk', 'Stalled'];

export function DealModal({ isOpen, onClose, onSave, onSavePartner, editingDeal, advisors, existingCompanies = [] }: DealModalProps) {
  const [formData, setFormData] = useState<Partial<Deal>>(
    editingDeal || {
      name: '',
      advisorId: '',
      stage: 'Discovery',
      mrr: 0,
      probability: 50,
      health: 'Healthy',
      closeDate: '',
      competitor: '',
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Advisor search state
  const [advisorSearch, setAdvisorSearch] = useState('');
  const [showAdvisorDropdown, setShowAdvisorDropdown] = useState(false);
  const [showNewAdvisorForm, setShowNewAdvisorForm] = useState(false);
  const [newAdvisor, setNewAdvisor] = useState({ name: '', company: '', title: '' });
  const [newAdvisorCompanySearch, setNewAdvisorCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const advisorDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Reset form when editingDeal changes
  useEffect(() => {
    if (isOpen) {
      setFormData(editingDeal || {
        name: '', advisorId: '', stage: 'Discovery', mrr: 0,
        probability: 50, health: 'Healthy', closeDate: '', competitor: '',
      });
      setAdvisorSearch('');
      setShowAdvisorDropdown(false);
      setShowNewAdvisorForm(false);
      setError('');

      // Set advisor search text if editing
      if (editingDeal?.advisorId) {
        const adv = advisors.find(a => a.id === editingDeal.advisorId);
        if (adv) setAdvisorSearch(`${adv.name} · ${adv.company}`);
      }
    }
  }, [isOpen, editingDeal]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (advisorDropdownRef.current && !advisorDropdownRef.current.contains(e.target as Node)) {
        setShowAdvisorDropdown(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isOpen) return null;

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filtered advisors based on search
  const filteredAdvisors = advisorSearch.trim()
    ? advisors.filter(a =>
        a.name.toLowerCase().includes(advisorSearch.toLowerCase()) ||
        a.company?.toLowerCase().includes(advisorSearch.toLowerCase())
      )
    : advisors;

  const selectedAdvisorObj = advisors.find(a => a.id === formData.advisorId);

  // Filtered companies for new advisor form
  const filteredCompanies = newAdvisorCompanySearch.trim()
    ? existingCompanies.filter(c => c.toLowerCase().includes(newAdvisorCompanySearch.toLowerCase()))
    : existingCompanies;

  const handleSelectAdvisor = (adv: Advisor) => {
    handleChange('advisorId', adv.id);
    setAdvisorSearch(`${adv.name} · ${adv.company}`);
    setShowAdvisorDropdown(false);
  };

  const handleCreateAndSelectAdvisor = async () => {
    if (!newAdvisor.name.trim()) return;
    if (onSavePartner) {
      try {
        await onSavePartner({
          name: newAdvisor.name,
          company: newAdvisor.company || newAdvisorCompanySearch,
          title: newAdvisor.title,
        } as Partial<Advisor>);
        // After save, the advisors list will update — for now set search text
        setAdvisorSearch(`${newAdvisor.name} · ${newAdvisor.company || newAdvisorCompanySearch}`);
        setShowNewAdvisorForm(false);
        setNewAdvisor({ name: '', company: '', title: '' });
        setNewAdvisorCompanySearch('');
      } catch (err) {
        setError('Failed to create advisor');
      }
    }
  };

  const handleSave = async () => {
    setError('');
    if (!formData.name?.trim()) { setError('Deal name is required'); return; }
    if (!formData.advisorId) { setError('Advisor is required'); return; }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save deal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e8e5e1] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold font-['Newsreader'] text-gray-800">
            {editingDeal ? 'Edit Deal' : 'Create Deal'}
          </h2>
          <button onClick={onClose} disabled={saving} className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Deal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deal Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g., UCaaS Migration, SD-WAN Upgrade"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
            />
          </div>

          {/* Advisor Search Combo-box */}
          <div ref={advisorDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Advisor <span className="text-red-500">*</span>
            </label>

            {!showNewAdvisorForm ? (
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={advisorSearch}
                  onChange={e => {
                    setAdvisorSearch(e.target.value);
                    setShowAdvisorDropdown(true);
                    // Clear selection if user types
                    if (formData.advisorId && selectedAdvisorObj) {
                      const currentText = `${selectedAdvisorObj.name} · ${selectedAdvisorObj.company}`;
                      if (e.target.value !== currentText) {
                        handleChange('advisorId', '');
                      }
                    }
                  }}
                  onFocus={() => setShowAdvisorDropdown(true)}
                  placeholder="Search advisors by name or company..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                />

                {/* Dropdown */}
                {showAdvisorDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                    {filteredAdvisors.slice(0, 8).map(adv => (
                      <button
                        key={adv.id}
                        onClick={() => handleSelectAdvisor(adv)}
                        className={`w-full text-left px-3 py-2.5 hover:bg-[#F0F9F8] transition-colors flex items-center gap-3 ${
                          formData.advisorId === adv.id ? 'bg-[#157A6E]/5' : ''
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-[#157A6E] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {adv.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-12px font-medium text-gray-800">{adv.name}</p>
                          <p className="text-[10px] text-gray-500">{adv.company} · {adv.title || 'Partner'}</p>
                        </div>
                      </button>
                    ))}
                    {filteredAdvisors.length === 0 && (
                      <p className="px-3 py-2 text-12px text-gray-400 italic">No advisors match "{advisorSearch}"</p>
                    )}
                    {/* Create new advisor option */}
                    <button
                      onClick={() => {
                        setShowNewAdvisorForm(true);
                        setShowAdvisorDropdown(false);
                        setNewAdvisor({ name: advisorSearch, company: '', title: '' });
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#157A6E]/5 transition-colors flex items-center gap-2 border-t border-gray-100 text-[#157A6E]"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-12px font-medium">
                        {advisorSearch.trim() ? `Create "${advisorSearch}"` : 'Create new advisor'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Inline New Advisor Form */
              <div className="border border-[#157A6E]/30 rounded-lg p-4 bg-[#157A6E]/5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-12px font-semibold text-[#157A6E]">New Advisor</p>
                  <button
                    onClick={() => { setShowNewAdvisorForm(false); }}
                    className="text-11px text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={newAdvisor.name}
                  onChange={e => setNewAdvisor(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                />
                {/* Company combo-box */}
                <div ref={companyDropdownRef} className="relative">
                  <input
                    type="text"
                    value={newAdvisorCompanySearch}
                    onChange={e => {
                      setNewAdvisorCompanySearch(e.target.value);
                      setNewAdvisor(prev => ({ ...prev, company: e.target.value }));
                      setShowCompanyDropdown(true);
                    }}
                    onFocus={() => setShowCompanyDropdown(true)}
                    placeholder="Company name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                  />
                  {showCompanyDropdown && filteredCompanies.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[150px] overflow-y-auto">
                      {filteredCompanies.slice(0, 5).map(c => (
                        <button
                          key={c}
                          onClick={() => {
                            setNewAdvisor(prev => ({ ...prev, company: c }));
                            setNewAdvisorCompanySearch(c);
                            setShowCompanyDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-12px hover:bg-gray-50 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                      {newAdvisorCompanySearch.trim() && !filteredCompanies.includes(newAdvisorCompanySearch) && (
                        <button
                          onClick={() => {
                            setNewAdvisor(prev => ({ ...prev, company: newAdvisorCompanySearch }));
                            setShowCompanyDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-12px text-[#157A6E] font-medium hover:bg-[#157A6E]/5 border-t border-gray-100"
                        >
                          + Create "{newAdvisorCompanySearch}"
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={newAdvisor.title}
                  onChange={e => setNewAdvisor(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Title (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                />
                <button
                  onClick={handleCreateAndSelectAdvisor}
                  disabled={!newAdvisor.name.trim()}
                  className="px-4 py-2 text-12px font-medium bg-[#157A6E] text-white rounded-lg hover:bg-[#0f5550] transition-colors disabled:opacity-50"
                >
                  Create Advisor & Attach
                </button>
              </div>
            )}
          </div>

          {/* Two column row: Stage + Health */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stage</label>
              <select
                value={formData.stage || 'Discovery'}
                onChange={e => handleChange('stage', e.target.value as DealStage)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Health</label>
              <select
                value={formData.health || 'Healthy'}
                onChange={e => handleChange('health', e.target.value as DealHealth)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
              >
                {HEALTH_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* Two column row: MRR + Probability */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">MRR ($)</label>
              <input
                type="number"
                value={formData.mrr || 0}
                onChange={e => handleChange('mrr', Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability || 50}
                onChange={e => handleChange('probability', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
              />
            </div>
          </div>

          {/* Two column row: Close Date + Competitor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Close Date</label>
              <input
                type="date"
                value={formData.closeDate || ''}
                onChange={e => handleChange('closeDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Competitor</label>
              <input
                type="text"
                value={formData.competitor || ''}
                onChange={e => handleChange('competitor', e.target.value)}
                placeholder="Competitor name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={formData.overrideNote || ''}
              onChange={e => handleChange('overrideNote', e.target.value)}
              placeholder="Add any notes about this deal"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#e8e5e1] px-6 py-4 flex items-center justify-end gap-3 z-10">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-white bg-[#157A6E] hover:bg-[#126B5F] rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingDeal ? 'Update Deal' : 'Create Deal'}
          </button>
        </div>
      </div>
    </div>
  );
}
