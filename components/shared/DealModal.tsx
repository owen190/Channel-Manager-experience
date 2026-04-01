'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Deal, DealStage, DealHealth, Advisor } from '@/lib/types';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Partial<Deal>) => Promise<void>;
  editingDeal: Deal | null;
  advisors: Advisor[];
}

const STAGES: DealStage[] = ['Discovery', 'Qualifying', 'Proposal', 'Negotiating', 'Closed Won', 'Stalled'];
const HEALTH_OPTIONS: DealHealth[] = ['Healthy', 'Monitor', 'At Risk', 'Stalled'];

export function DealModal({ isOpen, onClose, onSave, editingDeal, advisors }: DealModalProps) {
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

  if (!isOpen) return null;

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError('');

    // Validation
    if (!formData.name?.trim()) {
      setError('Deal name is required');
      return;
    }
    if (!formData.advisorId) {
      setError('Advisor is required');
      return;
    }

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
        <div className="sticky top-0 bg-white border-b border-[#e8e5e1] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold font-['Newsreader'] text-gray-800">
            {editingDeal ? 'Edit Deal' : 'Create Deal'}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Deal Name
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Enter deal name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
            />
          </div>

          {/* Advisor (REQUIRED) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Advisor <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.advisorId || ''}
              onChange={e => handleChange('advisorId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
            >
              <option value="">Select an advisor</option>
              {advisors.map(adv => (
                <option key={adv.id} value={adv.id}>
                  {adv.name} · {adv.company}
                </option>
              ))}
            </select>
          </div>

          {/* Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Stage
            </label>
            <select
              value={formData.stage || 'Discovery'}
              onChange={e => handleChange('stage', e.target.value as DealStage)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
            >
              {STAGES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* MRR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              MRR ($)
            </label>
            <input
              type="number"
              value={formData.mrr || 0}
              onChange={e => handleChange('mrr', Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
            />
          </div>

          {/* Probability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Probability (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.probability || 50}
              onChange={e => handleChange('probability', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              placeholder="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
            />
          </div>

          {/* Health */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Health
            </label>
            <select
              value={formData.health || 'Healthy'}
              onChange={e => handleChange('health', e.target.value as DealHealth)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
            >
              {HEALTH_OPTIONS.map(h => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Close Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Close Date
            </label>
            <input
              type="date"
              value={formData.closeDate || ''}
              onChange={e => handleChange('closeDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
            />
          </div>

          {/* Competitor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Competitor
            </label>
            <input
              type="text"
              value={formData.competitor || ''}
              onChange={e => handleChange('competitor', e.target.value)}
              placeholder="Competitor name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
            />
          </div>

          {/* Override Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes
            </label>
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
        <div className="sticky bottom-0 bg-white border-t border-[#e8e5e1] px-6 py-4 flex items-center justify-end gap-3">
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
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
