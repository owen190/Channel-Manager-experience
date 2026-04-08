'use client';
import { useState } from 'react';
import { ArrowLeft, Save, CheckCircle, Settings as SettingsIcon, Users, Zap, Bell, Link2, GraduationCap } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { NAV_ITEMS_MANAGER } from '@/lib/constants';

export default function SettingsPage() {
  const [cadence, setCadence] = useState({ anchor: 7, scaling: 14, building: 21, launching: 10 });
  const [companyName, setCompanyName] = useState('Aptum');
  const [userName, setUserName] = useState('Owen');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-screen bg-[#F7F5F2]">
      <Sidebar
        items={NAV_ITEMS_MANAGER}
        activeView="settings"
        onViewChange={() => {}}
        role="manager"
        userName="Owen"
        userInitials="O"
      />

      <div className="flex-1 flex flex-col">
        <TopBar
          nudges={[] as any}
          userName="Owen"
          userInitials="O"
          pageTitle="Settings"
        />

        <div className="flex-1 overflow-auto">
          <div className="max-w-[800px] mx-auto py-8 px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <a href="/live/manager" className="text-12px text-[#157A6E] hover:underline flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back to Dashboard
                </a>
                <h1 className="text-xl font-semibold font-['Newsreader'] text-gray-800">Settings</h1>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#157A6E] text-white text-13px font-semibold rounded-lg hover:bg-[#0f5550] transition-colors">
                {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>

            <div className="space-y-6">
              {/* General */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <SettingsIcon className="w-4 h-4 text-[#157A6E]" />
                  <h2 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900">General</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-11px font-semibold text-gray-700 mb-1 block">Company Name</label>
                    <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full text-13px border border-[#e8e5e1] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#157A6E]" />
                  </div>
                  <div>
                    <label className="text-11px font-semibold text-gray-700 mb-1 block">Your Name</label>
                    <input value={userName} onChange={e => setUserName(e.target.value)} className="w-full text-13px border border-[#e8e5e1] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#157A6E]" />
                  </div>
                </div>
              </div>

              {/* Cadence Rules */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-[#157A6E]" />
                  <h2 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900">Cadence Rules</h2>
                </div>
                <p className="text-11px text-gray-500 mb-4">Set how often you should contact partners in each tier. Action items are auto-generated when cadence lapses.</p>
                <div className="space-y-3">
                  {[
                    { key: 'anchor' as const, label: 'Anchor', desc: 'Your core strategic partners', color: 'bg-[#157A6E]' },
                    { key: 'scaling' as const, label: 'Scaling', desc: 'High-growth partners expanding fast', color: 'bg-amber-400' },
                    { key: 'building' as const, label: 'Building', desc: 'Developing partners with potential', color: 'bg-gray-400' },
                    { key: 'launching' as const, label: 'Launching', desc: 'New partners in accelerated onboarding', color: 'bg-blue-400' },
                  ].map(tier => (
                    <div key={tier.key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-sm ${tier.color}`} />
                      <div className="flex-1">
                        <p className="text-12px font-semibold text-gray-800">{tier.label}</p>
                        <p className="text-[10px] text-gray-500">{tier.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-11px text-gray-500">Every</span>
                        <input type="number" value={cadence[tier.key]} onChange={e => setCadence(prev => ({ ...prev, [tier.key]: parseInt(e.target.value) || 0 }))} className="w-16 text-13px text-center border border-[#e8e5e1] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#157A6E]" />
                        <span className="text-11px text-gray-500">days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-4 h-4 text-[#157A6E]" />
                  <h2 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900">Notifications</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-12px font-semibold text-gray-800">Email Notifications</p>
                      <p className="text-[10px] text-gray-500">Daily digest of overdue actions and signals</p>
                    </div>
                    <button onClick={() => setEmailNotifs(!emailNotifs)} className={`w-10 h-5.5 rounded-full transition-colors relative ${emailNotifs ? 'bg-[#157A6E]' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${emailNotifs ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-12px font-semibold text-gray-800">In-App Notifications</p>
                      <p className="text-[10px] text-gray-500">Real-time alerts for critical signals and deal updates</p>
                    </div>
                    <button onClick={() => setInAppNotifs(!inAppNotifs)} className={`w-10 h-5.5 rounded-full transition-colors relative ${inAppNotifs ? 'bg-[#157A6E]' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${inAppNotifs ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Integrations */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Link2 className="w-4 h-4 text-[#157A6E]" />
                  <h2 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900">Integrations</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Salesforce', status: 'connected', desc: 'CRM sync' },
                    { name: 'Gong', status: 'connected', desc: 'Call intelligence' },
                    { name: 'Fireflies', status: 'connected', desc: 'Meeting transcripts' },
                    { name: 'Microsoft Teams', status: 'connected', desc: 'Communication' },
                    { name: 'Slack', status: 'available', desc: 'Team messaging' },
                    { name: 'HubSpot', status: 'available', desc: 'Marketing automation' },
                  ].map(int => (
                    <div key={int.name} className="flex items-center gap-3 p-3 border border-[#e8e5e1] rounded-lg">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${int.status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {int.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-12px font-semibold text-gray-800">{int.name}</p>
                        <p className="text-[10px] text-gray-500">{int.desc}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${int.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {int.status === 'connected' ? 'Connected' : 'Available'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Onboarding */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-4 h-4 text-[#157A6E]" />
                  <h2 className="text-[15px] font-semibold font-['Newsreader'] text-gray-900">Guided Onboarding</h2>
                </div>
                <p className="text-11px text-gray-500 mb-3">Re-run the guided setup to reconfigure your workspace, import partners, or update your cadence rules.</p>
                <a href="/onboarding" className="inline-flex items-center gap-2 px-4 py-2 text-12px font-semibold text-[#157A6E] border border-[#157A6E] rounded-lg hover:bg-teal-50 transition-colors">
                  Launch Onboarding Guide →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
