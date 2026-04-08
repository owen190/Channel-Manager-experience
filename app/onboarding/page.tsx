'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check, ChevronRight, ChevronLeft, Cloud, MessageSquare, Mail, Calendar,
  Upload, Zap, CheckCircle2, AlertCircle, Bell, Clock, TrendingDown, BarChart3,
  Send, Loader2, UserPlus, Target, Heart, Sparkles, ArrowRight
} from 'lucide-react';

type Role = 'channel_manager' | 'sales_leader' | null;

interface NotificationConfig {
  morningBriefing: boolean;
  briefingTime: string;
  frictionAlerts: boolean;
  dealHealthChanges: boolean;
  weeklyDigest: boolean;
}

interface ChatMessage {
  type: 'user' | 'assistant';
  text: string;
}

// localStorage helpers
function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'role', label: 'Your Role' },
  { id: 'tools', label: 'Tools' },
  { id: 'partner', label: 'Your First Play' },
  { id: 'playbook', label: 'AI Playbook' },
  { id: 'notifications', label: 'Alerts' },
  { id: 'complete', label: 'Ready' },
];

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

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [role, setRole] = useState<Role>(null);
  const [connectedTools, setConnectedTools] = useState<string[]>([]);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    morningBriefing: true,
    briefingTime: '08:00',
    frictionAlerts: true,
    dealHealthChanges: true,
    weeklyDigest: true,
  });

  // Partner targeting state
  const [partnerName, setPartnerName] = useState('');
  const [partnerCompany, setPartnerCompany] = useState('');
  const [partnerSituation, setPartnerSituation] = useState<'losing' | 'targeting' | ''>('');
  const [partnerContext, setPartnerContext] = useState('');

  // AI playbook dialogue state
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedSteps, setAiGeneratedSteps] = useState<Array<{day: number; label: string; desc: string; phase: string}>>([]);
  const [playbookSaved, setPlaybookSaved] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiLoading]);

  // When entering the playbook step, start the AI conversation
  useEffect(() => {
    if (currentStep === 4 && aiMessages.length === 0 && partnerName) {
      const situationText = partnerSituation === 'losing'
        ? `losing touch with`
        : `trying to build a relationship with`;
      const initialMsg = `Great — let's build a playbook for ${partnerName} at ${partnerCompany || 'their company'}. You mentioned you're ${situationText} them.${partnerContext ? ` Here's what you shared: "${partnerContext}"` : ''}

Before I put together an action plan, I have a few questions:

1. **What has the relationship looked like recently?** (e.g., frequent calls, gone quiet, never really got started)
2. **Do you have any common interests or connections** with ${partnerName} — shared hobbies, mutual industry contacts, attended the same events?
3. **What's the ideal outcome** you're hoping for in the next 30 days?`;

      setAiMessages([{ type: 'assistant', text: initialMsg }]);
    }
  }, [currentStep, partnerName, partnerCompany, partnerSituation, partnerContext, aiMessages.length]);

  const sendAiMessage = async (text: string) => {
    if (!text.trim()) return;
    const newUserMsg: ChatMessage = { type: 'user', text };
    setAiMessages(prev => [...prev, newUserMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const systemContext = `You are a channel management strategist helping a supplier's channel manager build a relationship playbook during their onboarding to Channel Companion.

CONTEXT:
- Partner name: ${partnerName}
- Partner company: ${partnerCompany || 'Unknown'}
- Situation: The channel manager is ${partnerSituation === 'losing' ? 'losing this partner / the relationship is declining' : 'trying to win or build a new relationship with this partner'}
- Additional context from the channel manager: ${partnerContext || 'None provided yet'}

YOUR JOB: Have a conversational dialogue to understand the relationship deeply, then build an actionable playbook.

DIALOGUE PHASE (if you don't have enough info yet):
Ask about:
- What the relationship has looked like (history, frequency of contact, quality)
- Common interests, shared hobbies, mutual connections in the industry
- What specifically triggered the decline or what's blocking the new relationship
- What a win looks like for the channel manager
Keep questions warm and conversational — this is onboarding, not an interrogation. Ask 1-2 questions at a time max.

PLAYBOOK GENERATION (when you have enough context — usually after 2-3 exchanges):
Generate a concrete, relationship-focused playbook. Format as:

1. Brief strategy explanation (2-3 sentences)
2. JSON code block:

\`\`\`json
[
  {"day": 1, "label": "Action title", "desc": "What to do and how", "phase": "Phase Name"},
  {"day": 3, "label": "Action title", "desc": "Detailed description", "phase": "Phase Name"}
]
\`\`\`

3. Ask if they want to adjust anything

PLAYBOOK RULES:
- Use the partner's actual name in steps
- Focus on relationship-building actions: personal touches, shared interests, mutual connections
- Include 6-10 steps over 30 days
- Mix professional touchpoints with personal ones (e.g., share an article about their hobby, intro to a mutual contact)
- For declining relationships: start with listening and low-pressure reconnection
- For new relationships: start with research and warm outreach
- Be specific — "Send ${partnerName} the cloud security whitepaper they mentioned at the last event" not "Share resources"

If the user asks to revise, regenerate the FULL JSON block. Always output the complete updated playbook.`;

      const priorHistory = aiMessages.map(m => ({ type: m.type, text: m.text }));

      const res = await fetch('/api/live/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          role: 'manager',
          systemPrompt: systemContext,
          conversationHistory: priorHistory,
          maxTokens: 4096,
        }),
      });
      const data = await res.json();
      const responseText = data.response || 'I couldn\'t generate a response. Try describing the relationship in more detail.';

      setAiMessages(prev => [...prev, { type: 'assistant', text: responseText }]);

      // Extract JSON steps
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const steps = JSON.parse(jsonMatch[1]);
          if (Array.isArray(steps) && steps.length > 0 && steps[0].label && steps[0].day !== undefined) {
            setAiGeneratedSteps(steps);
          }
        } catch (parseErr) {
          console.error('Failed to parse AI playbook JSON:', parseErr);
        }
      }
    } catch (err) {
      setAiMessages(prev => [...prev, { type: 'assistant', text: 'Could not reach AI service. Try again in a moment.' }]);
    }

    setAiLoading(false);
  };

  const savePlaybookAndContinue = () => {
    if (aiGeneratedSteps.length > 0) {
      const existingPlaybooks = loadFromStorage<any[]>('cc_launchedPlaybooks', []);
      const newPlaybook = {
        templateId: `onboarding-${Date.now()}`,
        advisorId: partnerName.toLowerCase().replace(/\s+/g, '-'),
        advisorName: partnerName,
        launchedAt: new Date().toISOString(),
        priority: partnerSituation === 'losing' ? 'critical' as const : 'high' as const,
        completedSteps: [] as number[],
        skippedSteps: [] as number[],
        customSteps: aiGeneratedSteps,
        notes: partnerContext,
        playbookName: `${partnerSituation === 'losing' ? 'Win Back' : 'Build Relationship'}: ${partnerName}`,
      };
      saveToStorage('cc_launchedPlaybooks', [...existingPlaybooks, newPlaybook]);
      setPlaybookSaved(true);
    }
    nextStep();
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!role;
      case 3: return !!partnerName.trim() && !!partnerSituation;
      default: return true;
    }
  };

  const toggleTool = (toolId: string) => {
    setConnectedTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const handleComplete = () => {
    router.push(role === 'sales_leader' ? '/live/leader' : '/live/manager');
  };

  const progressPercent = ((currentStep) / (STEPS.length - 1)) * 100;

  // Format AI message text (handle bold markdown)
  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className={`${i > 0 ? 'mt-2' : ''} ${line === '' ? 'mt-1' : ''}`}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e5e1] px-8 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-newsreader text-xl font-bold text-gray-900">
              Channel Companion
            </h1>
            <span className="text-[11px] text-[#999] font-medium">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex-1 flex items-center">
                <div
                  className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                    i < currentStep ? 'bg-[#157A6E]' : i === currentStep ? 'bg-[#157A6E]/60' : 'bg-[#e8e5e1]'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <span key={s.id} className={`text-[9px] font-medium transition-colors ${
                i <= currentStep ? 'text-[#157A6E]' : 'text-[#ccc]'
              }`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl">

          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="text-center space-y-8 py-12">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-[#F0FAF8] rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-[#157A6E]" />
                </div>
              </div>
              <div>
                <h2 className="font-newsreader text-3xl font-bold text-gray-900 mb-3">
                  Welcome to Channel Companion
                </h2>
                <p className="text-gray-600 text-[14px] leading-relaxed max-w-md mx-auto">
                  Let's set up your workspace and build your first relationship playbook — it only takes a few minutes.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="p-4 bg-white rounded-[10px] border border-[#e8e5e1]">
                  <Target className="w-6 h-6 text-[#157A6E] mx-auto mb-2" />
                  <p className="text-[11px] text-gray-600 font-medium">Connect tools</p>
                </div>
                <div className="p-4 bg-white rounded-[10px] border border-[#e8e5e1]">
                  <Heart className="w-6 h-6 text-[#157A6E] mx-auto mb-2" />
                  <p className="text-[11px] text-gray-600 font-medium">Target a partner</p>
                </div>
                <div className="p-4 bg-white rounded-[10px] border border-[#e8e5e1]">
                  <Sparkles className="w-6 h-6 text-[#157A6E] mx-auto mb-2" />
                  <p className="text-[11px] text-gray-600 font-medium">Build a playbook</p>
                </div>
              </div>
              <button
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#157A6E] text-white text-[14px] font-medium rounded-[10px] hover:bg-[#0f6960] transition-colors"
              >
                Let's get started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Role */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-newsreader text-2xl font-bold text-gray-900 mb-2">
                  What's your role?
                </h2>
                <p className="text-[#999] text-[13px]">
                  This helps us tailor your experience and show the right views.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole('channel_manager')}
                  className={`p-6 rounded-[10px] border-2 transition-all text-left ${
                    role === 'channel_manager'
                      ? 'border-[#157A6E] bg-[#F0FAF8]'
                      : 'border-[#e8e5e1] bg-white hover:border-[#157A6E]/40'
                  }`}
                >
                  <UserPlus className={`w-7 h-7 mb-3 ${role === 'channel_manager' ? 'text-[#157A6E]' : 'text-gray-400'}`} />
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-1">
                    Channel Manager
                  </h3>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    Manage partners, track deals, and grow relationships
                  </p>
                  {role === 'channel_manager' && (
                    <div className="mt-3 flex items-center gap-1.5 text-[#157A6E] text-[11px] font-semibold">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setRole('sales_leader')}
                  className={`p-6 rounded-[10px] border-2 transition-all text-left ${
                    role === 'sales_leader'
                      ? 'border-[#157A6E] bg-[#F0FAF8]'
                      : 'border-[#e8e5e1] bg-white hover:border-[#157A6E]/40'
                  }`}
                >
                  <BarChart3 className={`w-7 h-7 mb-3 ${role === 'sales_leader' ? 'text-[#157A6E]' : 'text-gray-400'}`} />
                  <h3 className="font-newsreader text-lg font-bold text-gray-900 mb-1">
                    Sales Leader
                  </h3>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    Coach reps, manage forecasts, and optimize pipeline
                  </p>
                  {role === 'sales_leader' && (
                    <div className="mt-3 flex items-center gap-1.5 text-[#157A6E] text-[11px] font-semibold">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Connect Tools */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-newsreader text-2xl font-bold text-gray-900 mb-2">
                  Connect your tools
                </h2>
                <p className="text-[#999] text-[13px]">
                  We'll pull in data from these to give you real-time intelligence. You can skip this and connect later.
                </p>
              </div>

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
                          : 'border-[#e8e5e1] bg-white hover:border-[#157A6E]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isConnected ? 'text-[#157A6E]' : 'text-gray-400'}`} />
                        {isConnected && <Check className="w-4 h-4 text-[#157A6E]" />}
                      </div>
                      <h4 className="font-medium text-gray-900 text-[13px] mb-0.5">{tool.name}</h4>
                      <p className="text-[11px] text-gray-500">{tool.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Target a Partner */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-newsreader text-2xl font-bold text-gray-900 mb-2">
                  Let's make your first play
                </h2>
                <p className="text-[#999] text-[13px] leading-relaxed">
                  Think of a partner you're trying to win over — or one you're starting to lose. We'll help you build an AI-powered playbook to strengthen that relationship.
                </p>
              </div>

              {/* Situation selection */}
              <div>
                <label className="text-[12px] font-semibold text-gray-700 block mb-2">What's the situation?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPartnerSituation('losing')}
                    className={`p-4 rounded-[10px] border-2 transition-all text-left ${
                      partnerSituation === 'losing'
                        ? 'border-[#157A6E] bg-[#F0FAF8]'
                        : 'border-[#e8e5e1] bg-white hover:border-[#157A6E]/40'
                    }`}
                  >
                    <TrendingDown className={`w-5 h-5 mb-2 ${partnerSituation === 'losing' ? 'text-[#157A6E]' : 'text-gray-400'}`} />
                    <h4 className="font-medium text-gray-900 text-[13px]">Losing a partner</h4>
                    <p className="text-[11px] text-gray-500 mt-1">They're going quiet, moving to a competitor, or disengaging</p>
                  </button>
                  <button
                    onClick={() => setPartnerSituation('targeting')}
                    className={`p-4 rounded-[10px] border-2 transition-all text-left ${
                      partnerSituation === 'targeting'
                        ? 'border-[#157A6E] bg-[#F0FAF8]'
                        : 'border-[#e8e5e1] bg-white hover:border-[#157A6E]/40'
                    }`}
                  >
                    <Target className={`w-5 h-5 mb-2 ${partnerSituation === 'targeting' ? 'text-[#157A6E]' : 'text-gray-400'}`} />
                    <h4 className="font-medium text-gray-900 text-[13px]">Targeting a partner</h4>
                    <p className="text-[11px] text-gray-500 mt-1">You want to build a new relationship or deepen an existing one</p>
                  </button>
                </div>
              </div>

              {/* Partner details */}
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 block mb-1.5">Partner's name</label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={e => setPartnerName(e.target.value)}
                    placeholder="e.g., Sarah Johnson"
                    className="w-full px-3 py-2.5 rounded-[8px] border border-[#e8e5e1] text-[13px] focus:outline-none focus:border-[#157A6E] bg-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 block mb-1.5">Company / TSD</label>
                  <input
                    type="text"
                    value={partnerCompany}
                    onChange={e => setPartnerCompany(e.target.value)}
                    placeholder="e.g., Telarus, Avant, Intelisys"
                    className="w-full px-3 py-2.5 rounded-[8px] border border-[#e8e5e1] text-[13px] focus:outline-none focus:border-[#157A6E] bg-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 block mb-1.5">
                    Quick context <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={partnerContext}
                    onChange={e => setPartnerContext(e.target.value)}
                    placeholder={partnerSituation === 'losing'
                      ? "What's happening? e.g., They haven't returned my last 3 calls, I heard they're looking at a competitor..."
                      : "What do you know? e.g., Met them at a conference, they focus on UCaaS deals in healthcare..."
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-[8px] border border-[#e8e5e1] text-[13px] focus:outline-none focus:border-[#157A6E] bg-white placeholder:text-gray-400 resize-none"
                  />
                </div>
              </div>

              {partnerName && partnerSituation && (
                <div className="p-3 bg-[#F0FAF8] rounded-[8px] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#157A6E] flex-shrink-0" />
                  <p className="text-[12px] text-[#157A6E] font-medium">
                    Next, our AI will ask a few questions to build a personalized playbook for {partnerName}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: AI Playbook Dialogue */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-newsreader text-2xl font-bold text-gray-900 mb-1">
                  Building your playbook for {partnerName}
                </h2>
                <p className="text-[#999] text-[12px]">
                  Chat with our AI strategist — it'll ask about the relationship and craft an action plan.
                </p>
              </div>

              {/* Chat area */}
              <div className="bg-white rounded-[10px] border border-[#e8e5e1] flex flex-col" style={{ height: 'calc(100vh - 340px)', minHeight: '400px' }}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-[10px] px-4 py-3 text-[13px] leading-relaxed ${
                        msg.type === 'user'
                          ? 'bg-[#157A6E] text-white'
                          : 'bg-[#F7F5F2] text-gray-800'
                      }`}>
                        {msg.type === 'assistant' ? formatMessage(msg.text) : msg.text}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#F7F5F2] rounded-[10px] px-4 py-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#157A6E]" />
                        <span className="text-[12px] text-gray-500">Thinking...</span>
                      </div>
                    </div>
                  )}

                  {/* Playbook preview */}
                  {aiGeneratedSteps.length > 0 && (
                    <div className="bg-[#F0FAF8] border border-[#157A6E]/20 rounded-[10px] p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-[#157A6E]" />
                        <span className="text-[13px] font-semibold text-[#157A6E]">Playbook Ready — {aiGeneratedSteps.length} steps</span>
                      </div>
                      {aiGeneratedSteps.slice(0, 4).map((step, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full bg-[#157A6E]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-[#157A6E]">D{step.day}</span>
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-gray-900">{step.label}</p>
                            <p className="text-[11px] text-gray-500">{step.phase}</p>
                          </div>
                        </div>
                      ))}
                      {aiGeneratedSteps.length > 4 && (
                        <p className="text-[11px] text-gray-500 pl-11">+ {aiGeneratedSteps.length - 4} more steps...</p>
                      )}
                      <p className="text-[11px] text-gray-500 italic mt-2">
                        You can ask the AI to revise, or continue to save this playbook.
                      </p>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-[#e8e5e1] p-3 flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendAiMessage(aiInput);
                      }
                    }}
                    placeholder="Tell the AI about your relationship with this partner..."
                    className="flex-1 px-3 py-2 rounded-[8px] border border-[#e8e5e1] text-[13px] focus:outline-none focus:border-[#157A6E] bg-[#F7F5F2] placeholder:text-gray-400"
                    disabled={aiLoading}
                  />
                  <button
                    onClick={() => sendAiMessage(aiInput)}
                    disabled={!aiInput.trim() || aiLoading}
                    className="px-3 py-2 bg-[#157A6E] text-white rounded-[8px] hover:bg-[#0f6960] transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Notifications */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-newsreader text-2xl font-bold text-gray-900 mb-2">
                  Stay in the loop
                </h2>
                <p className="text-[#999] text-[13px]">
                  Configure how Channel Companion keeps you informed. All of these can be changed later in Settings.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-[10px] border border-[#e8e5e1] bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-[#157A6E]" />
                      <div>
                        <h4 className="font-medium text-gray-900 text-[13px]">Morning Briefing</h4>
                        <p className="text-[11px] text-gray-500">Daily summary of key metrics and alerts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notificationConfig.morningBriefing && (
                        <input
                          type="time"
                          value={notificationConfig.briefingTime}
                          onChange={(e) => setNotificationConfig(prev => ({ ...prev, briefingTime: e.target.value }))}
                          className="text-[11px] border border-[#e8e5e1] rounded-[6px] px-2 py-1"
                        />
                      )}
                      <input
                        type="checkbox"
                        checked={notificationConfig.morningBriefing}
                        onChange={(e) => setNotificationConfig(prev => ({ ...prev, morningBriefing: e.target.checked }))}
                        className="w-4 h-4 accent-[#157A6E]"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-[10px] border border-[#e8e5e1] bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-[#157A6E]" />
                      <div>
                        <h4 className="font-medium text-gray-900 text-[13px]">Friction Alerts</h4>
                        <p className="text-[11px] text-gray-500">Immediate notification when friction is detected</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationConfig.frictionAlerts}
                      onChange={(e) => setNotificationConfig(prev => ({ ...prev, frictionAlerts: e.target.checked }))}
                      className="w-4 h-4 accent-[#157A6E]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-[10px] border border-[#e8e5e1] bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="w-5 h-5 text-[#157A6E]" />
                      <div>
                        <h4 className="font-medium text-gray-900 text-[13px]">Deal Health Changes</h4>
                        <p className="text-[11px] text-gray-500">Alerts when deals move to at-risk or closed</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationConfig.dealHealthChanges}
                      onChange={(e) => setNotificationConfig(prev => ({ ...prev, dealHealthChanges: e.target.checked }))}
                      className="w-4 h-4 accent-[#157A6E]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-[10px] border border-[#e8e5e1] bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-[#157A6E]" />
                      <div>
                        <h4 className="font-medium text-gray-900 text-[13px]">Weekly Digest</h4>
                        <p className="text-[11px] text-gray-500">Friday summary of the week's key moments</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationConfig.weeklyDigest}
                      onChange={(e) => setNotificationConfig(prev => ({ ...prev, weeklyDigest: e.target.checked }))}
                      className="w-4 h-4 accent-[#157A6E]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Complete */}
          {currentStep === 6 && (
            <div className="text-center space-y-8 py-12">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-[#F0FAF8] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-[#157A6E]" />
                </div>
              </div>

              <div>
                <h2 className="font-newsreader text-3xl font-bold text-gray-900 mb-3">
                  You're all set!
                </h2>
                <p className="text-gray-600 text-[14px] leading-relaxed max-w-md mx-auto">
                  Your workspace is ready and your first playbook is live. Time to start building stronger partner relationships.
                </p>
              </div>

              <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-6 max-w-sm mx-auto space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#157A6E] flex-shrink-0" />
                  <span className="text-[13px] text-gray-700">
                    Role: <span className="font-medium">{role === 'sales_leader' ? 'Sales Leader' : 'Channel Manager'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#157A6E] flex-shrink-0" />
                  <span className="text-[13px] text-gray-700">
                    {connectedTools.length > 0 ? `${connectedTools.length} tools connected` : 'Tools can be connected later'}
                  </span>
                </div>
                {playbookSaved && (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#157A6E] flex-shrink-0" />
                    <span className="text-[13px] text-gray-700">
                      Playbook for <span className="font-medium">{partnerName}</span> is active
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#157A6E] flex-shrink-0" />
                  <span className="text-[13px] text-gray-700">Notifications configured</span>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#157A6E] text-white text-[14px] font-semibold rounded-[10px] hover:bg-[#0f6960] transition-colors"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer nav — hidden on welcome and complete steps */}
      {currentStep > 0 && currentStep < 6 && (
        <div className="bg-white border-t border-[#e8e5e1] px-8 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={prevStep}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-[#F7F5F2] rounded-[8px] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-2">
              {/* Skip option for tools and notifications */}
              {(currentStep === 2 || currentStep === 5) && (
                <button
                  onClick={nextStep}
                  className="px-4 py-2 text-[12px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              )}

              {/* Skip option for partner step */}
              {currentStep === 3 && (
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-4 py-2 text-[12px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip — I'll do this later
                </button>
              )}

              {/* Special button for playbook step */}
              {currentStep === 4 ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="px-4 py-2 text-[12px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={savePlaybookAndContinue}
                    className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-[8px] transition-colors ${
                      aiGeneratedSteps.length > 0
                        ? 'bg-[#157A6E] text-white hover:bg-[#0f6960]'
                        : 'bg-[#e8e5e1] text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={aiGeneratedSteps.length === 0}
                  >
                    Save Playbook & Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#157A6E] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#0f6960] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
