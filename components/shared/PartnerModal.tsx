'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Advisor, PartnerTier } from '@/lib/types';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPartner: Advisor | null;
  onSave: (advisor: Partial<Advisor>) => Promise<void>;
  existingCompanies?: string[];
}

export function PartnerModal({
  isOpen,
  onClose,
  editingPartner,
  onSave,
  existingCompanies = [],
}: PartnerModalProps) {
  const [loading, setLoading] = useState(false);
  const [companyInputValue, setCompanyInputValue] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [formData, setFormData] = useState<Partial<Advisor>>({
    name: '',
    title: '',
    company: '',
    location: '',
    mrr: 0,
    tier: 'building' as PartnerTier,
    connectedSince: new Date().toISOString().split('T')[0],
    commPreference: '',
    bestDayToReach: '',
    referredBy: '',
    personalIntel: '',
  });

  const isEditMode = !!editingPartner;

  // Update form data when editingPartner changes
  useEffect(() => {
    if (editingPartner) {
      setFormData({
        id: editingPartner.id,
        name: editingPartner.name,
        title: editingPartner.title,
        company: editingPartner.company,
        location: editingPartner.location,
        mrr: editingPartner.mrr,
        tier: editingPartner.tier,
        connectedSince: editingPartner.connectedSince,
        commPreference: editingPartner.commPreference,
        bestDayToReach: editingPartner.bestDayToReach,
        referredBy: editingPartner.referredBy,
        personalIntel: editingPartner.personalIntel,
      });
      setCompanyInputValue(editingPartner.company || '');
    } else {
      setFormData({
        name: '',
        title: '',
        company: '',
        location: '',
        mrr: 0,
        tier: 'building' as PartnerTier,
        connectedSince: new Date().toISOString().split('T')[0],
        commPreference: '',
        bestDayToReach: '',
        referredBy: '',
        personalIntel: '',
      });
      setCompanyInputValue('');
    }
    setShowCompanyDropdown(false);
  }, [editingPartner, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Failed to save partner:', err);
      alert('Failed to save partner');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e8e5e1] px-6 py-4 flex items-center justify-between">
          <h2 className="text-18px font-semibold font-['Newsreader'] text-gray-900">
            {isEditMode ? `Edit ${editingPartner?.name}` : 'Add Partner'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name & Title Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-12px font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                placeholder="Partner name"
              />
            </div>
            <div>
              <label className="block text-12px font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                placeholder="Job title"
              />
            </div>
          </div>

          {/* Company & Location Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-12px font-medium text-gray-700 mb-2">Company *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={companyInputValue}
                  onChange={(e) => {
                    setCompanyInputValue(e.target.value);
                    setShowCompanyDropdown(true);
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                  placeholder="Company name"
                />
                {showCompanyDropdown && (companyInputValue || existingCompanies.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[10px] shadow-md z-10 max-h-60 overflow-y-auto">
                    {existingCompanies
                      .filter(c => c.toLowerCase().includes(companyInputValue.toLowerCase()))
                      .slice(0, 5)
                      .map(company => (
                        <button
                          key={company}
                          type="button"
                          onClick={() => {
                            setCompanyInputValue(company);
                            handleChange('company', company);
                            setShowCompanyDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-13px text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {company}
                        </button>
                      ))}
                    {companyInputValue && !existingCompanies.includes(companyInputValue) && (
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('company', companyInputValue);
                          setShowCompanyDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-13px text-[#157A6E] font-medium hover:bg-[#157A6E]/5 transition-colors border-t border-gray-200"
                      >
                        + Create "{companyInputValue}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-12px font-medium text-gray-700 mb-2">Location (City, State)</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                placeholder="e.g., San Francisco, CA"
              />
            </div>
          </div>

          {/* MRR & Tier Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-12px font-medium text-gray-700 mb-2">MRR</label>
              <input
                type="number"
                value={formData.mrr || 0}
                onChange={(e) => handleChange('mrr', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-12px font-medium text-gray-700 mb-2">Tier</label>
              <select
                value={formData.tier || 'building'}
                onChange={(e) => handleChange('tier', e.target.value as PartnerTier)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent bg-white"
              >
                <option value="anchor">Anchor</option>
                <option value="scaling">Scaling</option>
                <option value="building">Building</option>
                <option value="launching">Launching</option>
              </select>
            </div>
          </div>

          {/* Connected Since & Best Day to Reach Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-12px font-medium text-gray-700 mb-2">Connected Since</label>
              <input
                type="date"
                value={formData.connectedSince || ''}
                onChange={(e) => handleChange('connectedSince', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-12px font-medium text-gray-700 mb-2">Best Day to Reach</label>
              <input
                type="text"
                value={formData.bestDayToReach || ''}
                onChange={(e) => handleChange('bestDayToReach', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                placeholder="e.g., Tuesday morning"
              />
            </div>
          </div>

          {/* Communication Preference & Referred By Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-12px font-medium text-gray-700 mb-2">Communication Preference</label>
              <input
                type="text"
                value={formData.commPreference || ''}
                onChange={(e) => handleChange('commPreference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                placeholder="e.g., Email, Phone"
              />
            </div>
            <div>
              <label className="block text-12px font-medium text-gray-700 mb-2">Referred By</label>
              <input
                type="text"
                value={formData.referredBy || ''}
                onChange={(e) => handleChange('referredBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
                placeholder="Who referred this partner"
              />
            </div>
          </div>

          {/* Personal Intel */}
          <div>
            <label className="block text-12px font-medium text-gray-700 mb-2">Personal Intel</label>
            <textarea
              value={formData.personalIntel || ''}
              onChange={(e) => handleChange('personalIntel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-13px focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:border-transparent"
              placeholder="Personal notes about this partner"
              rows={4}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[#e8e5e1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-13px font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#157A6E] text-white rounded-lg text-13px font-medium hover:bg-[#12675b] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
