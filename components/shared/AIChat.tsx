'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Minus, Maximize2 } from 'lucide-react';
import { advisors as staticAdvisors } from '@/lib/data/advisors';
import { deals as staticDeals } from '@/lib/data/deals';
import { Advisor } from '@/lib/types';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
}

interface AIChatProps {
  role: 'manager' | 'leader';
  context?: string;
  selectedAdvisor?: Advisor | null;
  live?: boolean;
}

// ============ STATIC RESPONSE GENERATORS (demo mode) ============

function generateAdvisorResponse(advisor: Advisor, question: string): string {
  const lowerQ = question.toLowerCase();
  const advDeals = staticDeals.filter(d => d.advisorId === advisor.id);
  const totalMRR = advDeals.reduce((sum, d) => sum + d.mrr, 0);

  if (lowerQ.includes('deal') || lowerQ.includes('pipeline') || lowerQ.includes('revenue')) {
    if (advDeals.length === 0) return `${advisor.name} doesn't have any active deals currently. Consider scheduling an exploratory call to identify partnership opportunities.`;
    const dealList = advDeals.map(d => `${d.name} ($${(d.mrr/1000).toFixed(1)}K, ${d.stage}, ${d.health})`).join('; ');
    return `${advisor.name} has ${advDeals.length} active deal${advDeals.length > 1 ? 's' : ''} totaling $${(totalMRR/1000).toFixed(1)}K MRR:\n\n${dealList}\n\n${advDeals.some(d => d.health === 'Stalled' || d.health === 'At Risk') ? 'Some deals need attention — consider addressing blockers directly.' : 'Pipeline looks healthy overall.'}`;
  }

  if (lowerQ.includes('hobby') || lowerQ.includes('personal') || lowerQ.includes('interest') || lowerQ.includes('connect')) {
    const parts = [];
    if (advisor.hobbies) parts.push(`Hobbies: ${advisor.hobbies}`);
    if (advisor.family) parts.push(`Family: ${advisor.family}`);
    if (advisor.funFact) parts.push(`Fun fact: ${advisor.funFact}`);
    if (advisor.birthday) parts.push(`Birthday: ${advisor.birthday}`);
    return parts.length > 0
      ? `Here's what we know about ${advisor.name} personally:\n\n${parts.join('\n\n')}\n\nUse these as natural conversation starters to strengthen the relationship.`
      : `We don't have much personal info on ${advisor.name} yet. Try asking about their interests on your next call.`;
  }

  if (lowerQ.includes('prep') || lowerQ.includes('call') || lowerQ.includes('meeting') || lowerQ.includes('talk')) {
    const points = [];
    if (advDeals.length > 0) points.push(`Check in on ${advDeals[0].name} (${advDeals[0].stage} stage, ${advDeals[0].health})`);
    if (advisor.personalIntel) points.push(`Background: ${advisor.personalIntel}`);
    if (advisor.hobbies) points.push(`Ask about their hobbies — they enjoy ${advisor.hobbies.toLowerCase()}`);
    if (advisor.friction !== 'Low') points.push(`Address ${advisor.friction.toLowerCase()} friction to rebuild trust`);
    points.push(`Best day to reach: ${advisor.bestDayToReach} via ${advisor.commPreference}`);
    return `Call prep for ${advisor.name}:\n\n${points.map(p => '• ' + p).join('\n')}\n\nTheir current pulse is ${advisor.pulse} with a ${advisor.trajectory} trajectory.`;
  }

  if (lowerQ.includes('risk') || lowerQ.includes('concern') || lowerQ.includes('worry') || lowerQ.includes('issue')) {
    const risks = [];
    if (advisor.pulse === 'Fading' || advisor.pulse === 'Flatline') risks.push(`Pulse is ${advisor.pulse} — engagement is dropping`);
    if (advisor.trajectory === 'Slipping' || advisor.trajectory === 'Freefall') risks.push(`Trajectory is ${advisor.trajectory} — relationship trending downward`);
    if (advisor.friction === 'High' || advisor.friction === 'Critical') risks.push(`Friction is ${advisor.friction} — unresolved operational issues`);
    if (advDeals.some(d => d.health === 'Stalled')) risks.push(`Has stalled deals that need unblocking`);
    if (advDeals.some(d => d.health === 'At Risk')) risks.push(`Has at-risk deals requiring immediate attention`);
    return risks.length > 0
      ? `Risk factors for ${advisor.name}:\n\n${risks.map(r => '• ' + r).join('\n')}\n\nRecommendation: ${advisor.trajectory === 'Freefall' ? 'Immediate personal outreach needed. Consider executive involvement.' : 'Schedule a focused check-in to address these concerns.'}`
      : `${advisor.name} looks healthy right now — ${advisor.pulse} pulse, ${advisor.trajectory} trajectory, ${advisor.friction} friction. No major red flags.`;
  }

  if (lowerQ.includes('history') || lowerQ.includes('relationship') || lowerQ.includes('background') || lowerQ.includes('who')) {
    return `${advisor.name} is a ${advisor.title} at ${advisor.company}.\n\nConnected since ${advisor.connectedSince}. Referred by ${advisor.referredBy}. Preferred communication: ${advisor.commPreference} on ${advisor.bestDayToReach}s.\n\nCurrent status: ${advisor.pulse} pulse, ${advisor.trajectory} trajectory, ${advisor.tone} tone.\n\n${advisor.diagnosis}`;
  }

  return `${advisor.name} (${advisor.title}, ${advisor.company}) has a ${advisor.pulse} pulse with ${advisor.trajectory} trajectory. MRR: $${(advisor.mrr/1000).toFixed(1)}K across ${advDeals.length} deals.\n\nTry asking me about:\n• "How should I prep for a call?"\n• "What are the risks?"\n• "Tell me about their deals"\n• "What are their personal interests?"`;
}

function generateGeneralResponse(role: string, question: string): string {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('risk') || lowerQ.includes('concern')) {
    const atRisk = staticAdvisors.filter(a => a.trajectory === 'Freefall' || a.trajectory === 'Slipping');
    if (atRisk.length > 0) {
      return `${atRisk.length} advisors need attention:\n\n${atRisk.map(a => `• ${a.name} — ${a.trajectory} trajectory, ${a.pulse} pulse ($${(a.mrr/1000).toFixed(1)}K MRR)`).join('\n')}\n\nRecommend prioritizing outreach to anyone in Freefall first.`;
    }
    return 'No major risk signals across your portfolio right now. Keep monitoring engagement levels.';
  }

  if (lowerQ.includes('pipeline') || lowerQ.includes('deal')) {
    const totalMRR = staticDeals.reduce((sum, d) => sum + d.mrr, 0);
    const healthy = staticDeals.filter(d => d.health === 'Healthy').length;
    const stalled = staticDeals.filter(d => d.health === 'Stalled').length;
    return `Pipeline overview: ${staticDeals.length} active deals, $${(totalMRR/1000).toFixed(1)}K total MRR.\n\n${healthy} healthy, ${stalled} stalled. Focus on unblocking stalled deals to protect quarter-end numbers.`;
  }

  if (lowerQ.includes('top') || lowerQ.includes('best') || lowerQ.includes('performer')) {
    const top = [...staticAdvisors].sort((a, b) => b.mrr - a.mrr).slice(0, 5);
    return `Top 5 advisors by MRR:\n\n${top.map((a, i) => `${i+1}. ${a.name} — $${(a.mrr/1000).toFixed(1)}K (${a.pulse} pulse, ${a.trajectory})`).join('\n')}`;
  }

  return role === 'manager'
    ? 'I can help you with advisor insights, risk detection, call prep, and pipeline analysis. Try clicking on an advisor name to get contextual intelligence, or ask me about your portfolio.'
    : 'I can help with team performance, forecast accuracy, coaching needs, and capacity planning. Ask me anything about your team.';
}

function getProactiveMessage(role: 'manager' | 'leader'): string {
  if (role === 'manager') {
    return "Good morning, Jordan. Tom Bradley's account is showing friction in quoting — I'd recommend an executive check-in this week. Sarah Chen has $25.1K in pipeline ready for expansion. Want me to prep a briefing for either?";
  }
  return "Hi Priya. Javier is running at 57/30 partner capacity — we should discuss rebalancing. Marcus's cycle time is trending 8 days above average. Want me to pull the details?";
}

function getAdvisorInsight(advisor: Advisor): string {
  const advDeals = staticDeals.filter(d => d.advisorId === advisor.id);
  const totalMRR = advDeals.reduce((sum, d) => sum + d.mrr, 0);
  const activeDealCount = advDeals.filter(d => d.stage !== 'Closed Won').length;
  const negotiating = advDeals.find(d => d.stage === 'Negotiating');
  const atRisk = advDeals.find(d => d.health === 'At Risk' || d.health === 'Stalled');

  let insight = `${advisor.name} has ${activeDealCount} active deal${activeDealCount !== 1 ? 's' : ''} worth $${(totalMRR/1000).toFixed(1)}K.`;
  if (negotiating) insight += ` ${negotiating.name} is in Negotiating and looks ${negotiating.health === 'Healthy' ? 'healthy' : 'like it needs attention'}.`;
  if (atRisk) insight += ` ${atRisk.name} is ${atRisk.health.toLowerCase()} — worth a check-in.`;
  insight += ` Best time to reach ${advisor.name.split(' ')[0]} is ${advisor.bestDayToReach} via ${advisor.commPreference?.toLowerCase() || 'email'}.`;
  return insight;
}

// ============ LIVE API CALLER ============

async function callLiveAI(
  message: string,
  role: string,
  advisorId?: string,
  conversationHistory?: Message[]
): Promise<string> {
  try {
    const res = await fetch('/api/live/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        role,
        advisorId: advisorId || undefined,
        conversationHistory: conversationHistory?.map(m => ({ type: m.type, text: m.text })),
      }),
    });
    const data = await res.json();
    if (!res.ok) return `AI error: ${data?.error || res.status}`;
    return data.response || 'No response from AI.';
  } catch (err: any) {
    console.error('[AIChat] API call failed:', err);
    return `Could not reach AI service: ${err.message}`;
  }
}

// ============ COMPONENT ============

export function AIChat({ role, context, selectedAdvisor, live = false }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset messages when advisor changes
  useEffect(() => {
    if (live) {
      const name = role === 'manager' ? 'Jordan' : 'Priya';
      const greeting = selectedAdvisor
        ? `I have context on ${selectedAdvisor.name}. What would you like to know?`
        : `Hi ${name}. I have access to your live portfolio data. Ask me anything about your partners, pipeline, or team.`;
      setMessages([{ id: '1', type: 'assistant', text: greeting }]);
    } else {
      if (selectedAdvisor) {
        setMessages([{ id: '1', type: 'assistant', text: getAdvisorInsight(selectedAdvisor) }]);
      } else {
        setMessages([{ id: '1', type: 'assistant', text: getProactiveMessage(role) }]);
      }
    }
    if (!isOpen && selectedAdvisor) {
      setHasUnread(true);
    }
  }, [selectedAdvisor, role, live]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), type: 'user', text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    let responseText: string;

    if (live) {
      responseText = await callLiveAI(
        text,
        role,
        selectedAdvisor?.id,
        updatedMessages
      );
    } else {
      await new Promise(resolve => setTimeout(resolve, 600));
      responseText = selectedAdvisor
        ? generateAdvisorResponse(selectedAdvisor, text)
        : generateGeneralResponse(role, text);
    }

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      text: responseText,
    }]);
    setIsLoading(false);
  };

  const handleSend = () => sendMessage(inputValue);

  const suggestions = selectedAdvisor
    ? ['How should I prep for a call?', 'What are the risks?', 'Tell me about their deals', 'Personal interests?']
    : ['Who needs attention?', 'Pipeline overview', 'Top performers', 'At-risk advisors'];

  // Floating icon (closed state)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#157A6E] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
      >
        <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="w-2 h-2 bg-white rounded-full" />
          </span>
        )}
      </button>
    );
  }

  // Chat panel (open state)
  const panelWidth = isExpanded ? 'w-[480px]' : 'w-[380px]';
  const panelHeight = isExpanded ? 'h-[600px]' : 'h-[500px]';

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${panelWidth} ${panelHeight} bg-white rounded-2xl shadow-2xl border border-[#e8e5e1] flex flex-col overflow-hidden transition-all duration-200`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e8e5e1] bg-gradient-to-r from-[#157A6E] to-[#1a9282] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white leading-tight">
              {selectedAdvisor ? selectedAdvisor.name : 'AI Assistant'}
            </h3>
            <div className="flex items-center gap-1.5">
              {live && <span className="text-[9px] font-bold text-emerald-200 bg-white/15 px-1.5 py-0.5 rounded">LIVE</span>}
              {selectedAdvisor && <span className="text-[9px] text-white/70">{selectedAdvisor.company}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title={isExpanded ? 'Shrink' : 'Expand'}>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Minimize">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setIsOpen(false); setMessages([]); }} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Advisor context bar */}
      {selectedAdvisor && (
        <div className="px-4 py-2 bg-[#f0faf8] border-b border-[#e8e5e1] flex items-center gap-2.5 text-xs flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
            selectedAdvisor.pulse === 'Strong' ? 'bg-green-100 text-green-700' :
            selectedAdvisor.pulse === 'Rising' ? 'bg-emerald-100 text-emerald-700' :
            selectedAdvisor.pulse === 'Steady' ? 'bg-blue-100 text-blue-700' :
            selectedAdvisor.pulse === 'Fading' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            {selectedAdvisor.pulse}
          </span>
          <span className="text-gray-600 font-medium">${(selectedAdvisor.mrr/1000).toFixed(1)}K MRR</span>
          <span className={`text-[10px] font-medium ${
            selectedAdvisor.trajectory === 'Accelerating' || selectedAdvisor.trajectory === 'Climbing' ? 'text-green-600' :
            selectedAdvisor.trajectory === 'Slipping' || selectedAdvisor.trajectory === 'Freefall' ? 'text-red-600' :
            'text-gray-500'
          }`}>{selectedAdvisor.trajectory}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-3 flex flex-col gap-3">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap text-[12px] leading-[1.6] ${
              message.type === 'user'
                ? 'bg-[#157A6E] text-white px-3.5 py-2 rounded-2xl rounded-br-sm'
                : 'bg-[#F7F5F2] text-gray-700 px-3.5 py-2.5 rounded-2xl rounded-bl-sm border border-[#e8e5e1]'
            }`}>
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#F7F5F2] border border-[#e8e5e1] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#157A6E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#157A6E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#157A6E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="px-2.5 py-1 bg-[#faf9f7] border border-[#e0ddd9] rounded-full text-[10px] text-gray-700 hover:border-[#157A6E] hover:text-[#157A6E] hover:bg-teal-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#e8e5e1] flex-shrink-0 bg-white">
        <div className="flex items-center gap-2 bg-[#faf9f7] border border-[#e0ddd9] rounded-xl px-3 py-2.5 focus-within:border-[#157A6E] focus-within:bg-white focus-within:shadow-sm transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={selectedAdvisor ? `Ask about ${selectedAdvisor.name.split(' ')[0]}...` : 'Ask anything about your portfolio...'}
            className="flex-1 bg-transparent text-[12px] text-gray-900 placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="p-1.5 bg-[#157A6E] text-white rounded-lg hover:bg-[#126a5f] transition-colors disabled:opacity-30 disabled:hover:bg-[#157A6E]"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
