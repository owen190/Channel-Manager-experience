'use client';

import { useState } from 'react';
import { Cloud, Shield, Zap, CheckCircle2, Edit2, Save, X } from 'lucide-react';

interface Capability {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  differentiator: string;
  proofPoint: string;
}

interface CaseStudy {
  id: string;
  industry: string;
  challenge: string;
  solution: string;
  result: string;
}

interface Win {
  id: string;
  partnerName: string;
  dealSize: number;
  product: string;
  timeToClose: number;
}

interface SupplierProfileProps {
  supplierId?: string;
  supplierName?: string;
  supplierTagline?: string;
  onSave?: (data: any) => void;
  editable?: boolean;
}

export function SupplierProfile({
  supplierId = 'aptum',
  supplierName = 'Aptum',
  supplierTagline = 'Infrastructure & Security for Enterprise Growth',
  onSave,
  editable = false,
}: SupplierProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(supplierName);
  const [editTagline, setEditTagline] = useState(supplierTagline);

  // Mock capabilities data
  const capabilities: Capability[] = [
    {
      id: 'hybrid-cloud',
      icon: <Cloud className="w-5 h-5 text-[#157A6E]" />,
      title: 'Hybrid Cloud & Multi-Cloud',
      description: 'Design, build, and manage cloud infrastructure across AWS, Azure, and on-premises environments with zero downtime migrations.',
      differentiator: 'True hybrid with cost optimization',
      proofPoint: 'Reduced infrastructure costs 40% for 200+ enterprises while improving uptime to 99.99%',
    },
    {
      id: 'security-ops',
      icon: <Shield className="w-5 h-5 text-[#157A6E]" />,
      title: 'Managed Security Operations',
      description: '24/7 threat monitoring, response, and compliance with SIEM, vulnerability management, and incident response services.',
      differentiator: 'Threat response in under 15 minutes',
      proofPoint: 'Protecting 500+ enterprise customers with zero data breaches over 3 years',
    },
    {
      id: 'network-transform',
      icon: <Zap className="w-5 h-5 text-[#157A6E]" />,
      title: 'Network Transformation',
      description: 'Legacy network modernization to SD-WAN, including bandwidth optimization and geo-redundancy across global infrastructure.',
      differentiator: 'Proven methodology with 100% success rate',
      proofPoint: 'Transformed networks for 150+ enterprises; 35% improvement in application performance',
    },
  ];

  // Mock case studies
  const caseStudies: CaseStudy[] = [
    {
      id: 'case-1',
      industry: 'Financial Services',
      challenge: 'Multi-region deployment with strict compliance requirements and performance demands',
      solution: 'Hybrid cloud architecture with automated failover and HIPAA-compliant security',
      result: 'Deployed in 6 weeks, 99.99% uptime, reduced infrastructure costs by 45%',
    },
    {
      id: 'case-2',
      industry: 'Healthcare',
      challenge: 'Legacy network unable to support telemedicine expansion without major overhaul',
      solution: 'SD-WAN rollout with managed bandwidth and traffic optimization',
      result: 'Completed in 8 weeks, 3x capacity increase, 60% cost savings',
    },
    {
      id: 'case-3',
      industry: 'Retail',
      challenge: 'Ransomware vulnerability across 500+ store locations',
      solution: 'Managed security operations with threat intelligence and EDR deployment',
      result: 'Protected across all locations, zero breaches, 95% faster threat detection',
    },
  ];

  // Mock wins
  const recentWins: Win[] = [
    {
      id: 'win-1',
      partnerName: 'Regional Tech Partner A',
      dealSize: 850000,
      product: 'Hybrid Cloud + Security Ops',
      timeToClose: 120,
    },
    {
      id: 'win-2',
      partnerName: 'Enterprise Advisor B',
      dealSize: 1200000,
      product: 'Network Transformation + Cloud',
      timeToClose: 180,
    },
    {
      id: 'win-3',
      partnerName: 'Strategic Partner C',
      dealSize: 650000,
      product: 'Managed Security Services',
      timeToClose: 90,
    },
  ];

  // What we don't do
  const doesNotOffer = [
    'Pure-play software development or custom application coding',
    'Consumer-grade cloud storage or file sync services',
    'Point-solution firewalls without integrated management',
    'Hardware resale without professional services integration',
    'Low-touch, self-service deployments (we build for enterprise complexity)',
  ];

  const handleSave = () => {
    if (onSave) {
      onSave({
        supplierName: editName,
        supplierTagline: editTagline,
      });
    }
    setIsEditing(false);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-12px font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[8px] text-13px focus:outline-none focus:border-[#157A6E]"
                  />
                </div>
                <div>
                  <label className="block text-12px font-medium text-gray-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e8e5e1] rounded-[8px] text-13px focus:outline-none focus:border-[#157A6E]"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#157A6E] to-[#0f6960] flex items-center justify-center text-white font-bold text-lg">
                    {editName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-['Newsreader'] text-gray-900">{editName}</h2>
                    <p className="text-13px text-gray-600">{editTagline}</p>
                  </div>
                </div>
              </>
            )}
          </div>
          {editable && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 bg-[#157A6E] text-white rounded-[8px] text-12px font-medium hover:bg-[#0f6960] flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(supplierName);
                      setEditTagline(supplierTagline);
                    }}
                    className="px-3 py-2 border border-[#e8e5e1] text-gray-700 rounded-[8px] text-12px font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 border border-[#e8e5e1] text-gray-700 rounded-[8px] text-12px font-medium hover:bg-gray-50 flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* What We Actually Do */}
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <h3 className="text-15px font-bold font-['Newsreader'] text-gray-900 mb-4">What We Actually Do</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {capabilities.map((cap) => (
            <div key={cap.id} className="border border-[#e8e5e1] rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                {cap.icon}
                <h4 className="font-semibold text-13px text-gray-900">{cap.title}</h4>
              </div>
              <p className="text-12px text-gray-600 mb-3">{cap.description}</p>
              <div className="bg-[#157A6E]/5 rounded-lg p-3 mb-3">
                <p className="text-11px text-[#157A6E] font-medium mb-1">Key Differentiator:</p>
                <p className="text-11px text-gray-700">{cap.differentiator}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-11px text-green-800 font-medium mb-1">Customer Proof Point:</p>
                <p className="text-11px text-green-700">{cap.proofPoint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What We Don't Do */}
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <h3 className="text-15px font-bold font-['Newsreader'] text-gray-900 mb-4">What We Don't Do</h3>
        <p className="text-12px text-gray-600 mb-4">
          Be clear with advisors about what we don't sell standalone. This helps partners avoid pitching the wrong solutions:
        </p>
        <ul className="space-y-2">
          {doesNotOffer.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-12px text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Case Studies */}
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <h3 className="text-15px font-bold font-['Newsreader'] text-gray-900 mb-4">Case Studies</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {caseStudies.map((study) => (
            <div key={study.id} className="border border-[#e8e5e1] rounded-lg p-4">
              <div className="mb-3">
                <p className="text-11px uppercase font-medium text-[#157A6E] mb-1">Industry</p>
                <p className="text-13px font-semibold text-gray-900">{study.industry}</p>
              </div>
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-11px font-medium text-gray-600 mb-1">Challenge</p>
                <p className="text-12px text-gray-700">{study.challenge}</p>
              </div>
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-11px font-medium text-gray-600 mb-1">Solution</p>
                <p className="text-12px text-gray-700">{study.solution}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-11px font-medium text-green-800 mb-1">Result</p>
                <p className="text-11px text-green-700">{study.result}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Win Wire */}
      <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
        <h3 className="text-15px font-bold font-['Newsreader'] text-gray-900 mb-4">Win Wire — Recent Wins</h3>
        <p className="text-12px text-gray-600 mb-4">Recent partner wins (showing deal momentum and typical deal sizes)</p>
        <div className="space-y-3">
          {recentWins.map((win) => (
            <div key={win.id} className="border border-[#e8e5e1] rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-11px text-gray-600 uppercase font-medium mb-1">Partner</p>
                  <p className="text-12px font-medium text-gray-900">{win.partnerName}</p>
                </div>
                <div>
                  <p className="text-11px text-gray-600 uppercase font-medium mb-1">Deal Size</p>
                  <p className="text-13px font-semibold text-[#157A6E]">{formatCurrency(win.dealSize)}</p>
                </div>
                <div>
                  <p className="text-11px text-gray-600 uppercase font-medium mb-1">Product</p>
                  <p className="text-12px text-gray-900">{win.product}</p>
                </div>
                <div>
                  <p className="text-11px text-gray-600 uppercase font-medium mb-1">Time to Close</p>
                  <p className="text-12px text-gray-900">{win.timeToClose} days</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
