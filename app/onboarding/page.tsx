'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check, ChevronRight, ChevronLeft, Cloud, MessageSquare, Mail, Calendar,
  FileText, Upload, Download, Zap, CheckCircle2, AlertCircle,
  Bell, Clock, TrendingDown, BarChart3
} from 'lucide-react';

type Role = 'channel_manager' | 'sales_leader' | null;
type Step = 1 | 2 | 3 | 4 | 5;

interface NotificationConfig {
  morningBriefing: boolean;
  briefingTime: string;
  frictionAlerts: boolean;
  dealHealthChanges: boolean;
  weeklyDigest: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role>(null);
  const [connectedTools, setConnectedTools] = useState<string[]>([]);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    morningBriefing: true,
    briefingTime: '08:00',
    frictionAlerts: true,
    dealHealthChanges: true,
    weeklyDigest: true,
  });
  const [uploadedCSV, setUploadedCSV] = useState(false);

  const TOOLS = [
    { id: 'salesforce', name: 'Salesforce', icon: Cloud, desc: 'CRM & opportunity data' },
    { id: 'hubspot', name: 'HubSpot', icon: Cloud, desc: 'Deals & contacts' },
    { id: 'gmail', name: 'Gmail', icon: Mail, desc: 'Email communications' },
    { id: 'outlook', name: 'Outlook', icon: Mail, desc: 'Calendar & email' },
    { id: 'gong', name: 'Gong', icon: Zap, desc: 'Call recordings & insights' },
    { id: 'fireflies', name: 'Fireflies', icon: Cloud, desc: 'Meeting transcripts' },
    { id: 'slack', name: 'Slack', icon: MessageSquare, desc: 'Team communication' },
    { id: 'gcalendar', name: 'Google Calendar', icon: Calendar, desc: 'Schedule & availability' },
  ];

  const nextStep = () => {
    if (step === 1 && !role) return;
    if (step < 5) setStep((step + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const toggleTool = (toolId: string) => {
    setConnectedTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const handleComplete = async () => {
    try {
      // Save onboarding state
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          connectedTools,
          notificationConfig,
        }),
      });

      if (response.ok) {
        router.push(role === 'sales_leader' ? '/live/leader' : '/live/manager');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const progressPercent = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col">
      {/* Header with progress */}
      <div className="bg-white border-b border-[#e8e5e1] px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-newsreader text-2xl font-bold text-gray-900 mb-4">
            {step === 1 && 'Welcome to Channel Companion'}
            {step === 2 && 'Connect Your Tools'}
            {step === 3 && 'Import Partners'}
            {step === 4 && 'Configure Notifications'}
            {step === 5 && "You're All Set!"}
          </h1>
          <div className="w-full bg-[#e8e5e1] rounded-full h-2">
            <div
              className="bg-[#157A6E] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Step 1: Welcome & Role */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-[#999] text-[13px] font-medium mb-6">
                  Let's get started. First, tell us your role.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole('channel_manager')}
                  className={`p-6 rounded-[10px] border-2 transition-all ${
                    role === 'channel_manager'
                      ? 'border-[#157A6E] bg-[#F0FAF8]'
                      : 'border-[#e8e5e1] bg-white hover:border-[#157A6E]'
                  }`}
                >
                  <div className="mb-3">
                    <Cloud className={`w-8 h-8 ${role === 'channel_manager' ? 'text-[#157A6E]' : 'text-gray-400'}`} />
                  </div>
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-2">
                    Channel Manager
                  </h3>
                  <p className="text-[12px] text-gray-600 leading-relaxed">
                    Manage partners, track deals, monitor engagement
                  </p>
                  {role === 'channel_manager' && (
                    <div className="mt-4 flex items-center gap-2 text-[#157A6E] text-[12px] font-medium">
                      <Check className="w-4 h-4" /> Selected
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setRole('sales_leader')}
                  className={`p-6 rounded-[10px] border-2 transition-all ${
                    role === 'sales_leader'
                      ? 'border-[#157A6E] bg-[#F0FAF8]'
                      : 'border-[#e8e5e1] bg-white hover:border-[#157A6E]'
                  }`}
                >
                  <div className="mb-3">
                    <BarChart3 className={`w-8 h-8 ${role === 'sales_leader' ? 'text-[#157A6E]' : 'text-gray-400'}`} />
                  </div>
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-2">
                    Sales Leader
                  </h3>
                  <p className="text-[12px] text-gray-600 leading-relaxed">
                    Coach reps, manage forecasts, optimize pipeline
                  </p>
                  {role === 'sales_leader' && (
                    <div className="mt-4 flex items-center gap-2 text-[#157A6E] text-[12px] font-medium">
                      <Check className="w-4 h-4" /> Selected
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Connect Tools */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-[#999] text-[13px] font-medium mb-6">
                Connect your favorite tools. You can skip this and do it later.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {TOOLS.map(tool => {
                  const Icon = tool.icon;
                  const isConnected = connectedTools.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`p-4 rounded-[10px] border-2 transition-all text-left ${
                        isConnected
                          ? 'border-[#157A6E] bg-[#F0FAF8]'
                          : 'border-[#e8e5e1] bg-white hover:border-[#157A6E]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isConnected ? 'text-[#157A6E]' : 'text-gray-400'}`} />
                        {isConnected && <Check className="w-4 h-4 text-[#157A6E]" />}
                      </div>
                      <h4 className="font-medium text-gray-900 text-[13px] mb-1">{tool.name}</h4>
                      <p className="text-[11px] text-gray-500">{tool.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-[8px] flex gap-3">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-[12px] text-blue-900">
                  We'll guide you through each connection. You can also skip and connect later from settings.
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Import Partners */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-[#999] text-[13px] font-medium mb-6">
                How would you like to import partners?
              </p>

              <div className="space-y-3">
                {/* Import from CRM */}
                <button className="w-full p-4 rounded-[10px] border-2 border-[#e8e5e1] bg-white hover:border-[#157A6E] transition-all text-left">
                  <div className="flex items-start gap-3">
                    <Cloud className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-[13px]">Import from CRM</h4>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Connect to Salesforce or HubSpot to auto-sync contacts
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  </div>
                </button>

                {/* Upload CSV */}
                <button
                  onClick={() => setUploadedCSV(!uploadedCSV)}
                  className="w-full p-4 rounded-[10px] border-2 border-[#e8e5e1] bg-white hover:border-[#157A6E] transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <Upload className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-[13px]">Upload CSV</h4>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Upload a CSV file with partner data
                      </p>
                    </div>
                    {uploadedCSV && <Check className="w-4 h-4 text-[#157A6E] flex-shrink-0 mt-0.5" />}
                  </div>
                </button>

                {/* Sample Data */}
                <button className="w-full p-4 rounded-[10px] border-2 border-[#e8e5e1] bg-white hover:border-[#157A6E] transition-all text-left">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-[13px]">Start with Sample Data</h4>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Explore with pre-loaded demo partners and deals
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 border border-[#e8e5e1] rounded-[8px]">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-4 h-4 text-gray-600" />
                  <a href="#" className="text-[12px] font-medium text-[#157A6E] hover:underline">
                    Download CSV template
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Configure Notifications */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-[#999] text-[13px] font-medium mb-6">
                Configure how we keep you informed.
              </p>

              <div className="space-y-4">
                {/* Morning Briefing */}
                <div className="p-4 rounded-[10px] border border-[#e8e5e1] bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 text-[13px]">Morning Briefing</h4>
                        <p className="text-[12px] text-gray-500 mt-1">
                          Daily email summary of key metrics and alerts
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationConfig.morningBriefing}
                      onChange={(e) =>
                        setNotificationConfig(prev => ({ ...prev, morningBriefing: e.target.checked }))
                      }
                      className="w-4 h-4"
                    />
                  </div>
                  {notificationConfig.morningBriefing && (
                    <div className="mt-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={notificationConfig.briefingTime}
                        onChange={(e) =>
                          setNotificationConfig(prev => ({ ...prev, briefingTime: e.target.value }))
                        }
                        className="text-[12px] border border-[#e8e5e1] rounded-[6px] px-2 py-1"
                      />
                    </div>
                  )}
                </div>

                {/* Friction Alerts */}
                <div className="p-4 rounded-[10px] border border-[#e8e5e1] bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 text-[13px]">Friction Alerts</h4>
                        <p className="text-[12px] text-gray-500 mt-1">
                          Immediate notifications when friction is detected
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationConfig.frictionAlerts}
                      onChange={(e) =>
                        setNotificationConfig(prev => ({ ...prev, frictionAlerts: e.target.checked }))
                      }
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                {/* Deal Health Changes */}
                <div className="p-4 rounded-[10px] border border-[#e8e5e1] bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <TrendingDown className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 text-[13px]">Deal Health Changes</h4>
                        <p className="text-[12px] text-gray-500 mt-1">
                          Alerts when deal status moves to at-risk or closed
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationConfig.dealHealthChanges}
                      onChange={(e) =>
                        setNotificationConfig(prev => ({ ...prev, dealHealthChanges: e.target.checked }))
                      }
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                {/* Weekly Digest */}
                <div className="p-4 rounded-[10px] border border-[#e8e5e1] bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="w-5 h-5 text-[#157A6E] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 text-[13px]">Weekly Digest</h4>
                        <p className="text-[12px] text-gray-500 mt-1">
                          Friday summary of the week's key moments
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationConfig.weeklyDigest}
                      onChange={(e) =>
                        setNotificationConfig(prev => ({ ...prev, weeklyDigest: e.target.checked }))
                      }
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[#F0FAF8] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-[#157A6E]" />
                </div>
              </div>

              <div>
                <h2 className="font-newsreader text-2xl font-bold text-gray-900 mb-2">
                  You're All Set!
                </h2>
                <p className="text-gray-600 text-[13px]">
                  Welcome to Channel Companion. You're ready to start managing your partners with intelligence.
                </p>
              </div>

              <div className="bg-[#F0FAF8] rounded-[10px] p-6 space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#157A6E] flex-shrink-0" />
                  <span className="text-[12px] text-gray-700">Role selected: <span className="font-medium">{role === 'sales_leader' ? 'Sales Leader' : 'Channel Manager'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#157A6E] flex-shrink-0" />
                  <span className="text-[12px] text-gray-700">Notifications configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#157A6E] flex-shrink-0" />
                  <span className="text-[12px] text-gray-700">{connectedTools.length} tools connected</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Navigation Buttons */}
      <div className="bg-white border-t border-[#e8e5e1] px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F7F5F2] rounded-[8px] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? 'bg-[#157A6E] w-6' : 'bg-[#e8e5e1]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={step === 5 ? handleComplete : nextStep}
            disabled={step === 1 && !role}
            className="flex items-center gap-2 px-4 py-2 bg-[#157A6E] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#0f6960] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 5 ? 'Go to Dashboard' : 'Next'}
            {step !== 5 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
