'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, ChevronLeft } from 'lucide-react';
import { advisors } from '@/lib/data/advisors';
import { deals } from '@/lib/data/deals';
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
}

function generateAdvisorResponse(advisor: Advisor, question: string): string {
  const lowerQ = question.toLowerCase();
  const advDeals = deals.filter(d => d.advisorId === advisor.id);
  const totalMRR = advDeals.reduce((sum, d) => sum + d.mrr, 0);

  if (lowerQ.includes('deal') || lowerQ.includes('pipeline') || lowerQ.includes('revenue')) {
    if (advDeals.length === 0) return `${advisor.name} doesn't have any active deals currently. Consider scheduling an exploratory call to identify partnership opportunities.`;
    const dealList = advDeals.map(d => `${d.name} ($${(d.mrr/1000).toFixed(1)}K, ${d.stage}, ${d.health})`).join('; ');
    return `${advisor.name} has ${advDeals.length} active deal${advDeals.length > 1 ? 's' : ''} totaling $${(totalMRR/1000).toFixed(1)}K MRR:\n\n${dealList}\n\n${advDeals.some(d => d.health === 'Stalled' || d.health === 'At Risk') ? 'Some deals need attention \u2014 consider addressing blockers directly.' : 'Pipeline looks healthy overall.'}`;
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
    if (advisor.hobbies) points.push(`Ask about their hobbies \u2014 they enjoy ${advisor.hobbies.toLowerCase()}`);
    if (advisor.friction !== 'Low') points.push(`Address ${advisor.friction.toLowerCase()} friction to rebuild trust`);
    points.push(`Best day to reach: ${advisor.bestDayToReach} via ${advisor.commPreference}`);
    return `Call prep for ${advisor.name}:\n\n${points.map(p => '\u2022 ' + p).join('\n')}\n\nTheir current pulse is ${advisor.pulse} with a ${advisor.trajectory} trajectory.`;
  }

  if (lowerQ.includes('risk') || lowerQ.includes('concern') || lowerQ.includes('worry') || lowerQ.includes('issue')) {
    const risks = [];
    if (advisor.pulse === 'Fading' || advisor.pulse === 'Flatline') risks.push(`Pulse is ${advisor.pulse} \u2014 engagement is dropping`);
    if (advisor.trajectory === 'Slipping' || advisor.trajectory === 'Freefall') risks.push(`Trajectory is ${advisor.trajectory} \u2014 relationship trending downward`);
    if (advisor.friction === 'High' || advisor.friction === 'Critical') risks.push(`Friction is ${advisor.friction} \u2014 unresolved operational issues`);
    if (advDeals.some(d => d.health === 'Stalled')) risks.push(`Has stalled deals that need unblocking`);
    if (advDeals.some(d => d.health === 'At Risk')) risks.push(`Has at-risk deals requiring immediate attention`);
    return risks.length > 0
      ? `Risk factors for ${advisor.name}:\n\n${risks.map(r => '\u2022 ' + r).join('\n')}\n\nRecommendation: ${advisor.trajectory === 'Freefall' ? 'Immediate personal outreach needed. Consider executive involvement.' : 'Schedule a focused check-in to address these concerns.'}`
      : `${advisor.name} looks healthy right now \u2014 ${advisor.pulse} pulse, ${advisor.trajectory} trajectory, ${advisor.friction} friction. No major red flags.`;
  }

  if (lowerQ.includes('history') || lowerQ.includes('relationship') || lowerQ.includes('background') || lowerQ.includes('who')) {
    return `${advisor.name} is a ${advisor.title} at ${advisor.company}.\n\nConnected since ${advisor.connectedSince}. Referred by ${advisor.referredBy}. Preferred communication: ${advisor.commPreference} on ${advisor.bestDayToReach}s.\n\nCurrent status: ${advisor.pulse} pulse, ${advisor.trajectory} trajectory, ${advisor.tone} tone.\n\n${advisor.diagnosis}`;
  }

  // Default contextual response
  return `${advisor.name} (${advisor.title}, ${advisor.company}) has a ${advisor.pulse} pulse with ${advisor.trajectory} trajectory. MRR: $${(advisor.mrr/1000).toFixed(1)}K across ${advDeals.length} deals.\n\nTry asking me about:\n\u2022 "How should I prep for a call?"\n\u2022 "What are the risks?"\n\u2022 "Tell me about their deals"\n\u2022 "What are their personal interests?"`;
}

function generateGeneralResponse(role: string, question: string): string {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('risk') || lowerQ.includes('concern')) {
    const atRisk = advisors.filter(a => a.trajectory === 'Freefall' || a.trajectory === 'Slipping');
    if (atRisk.length > 0) {
      return `${atRisk.length} advisors need attention:\n\n${atRisk.map(a => `\u2022 ${a.name} \u2014 ${a.trajectory} trajectory, ${a.pulse} pulse ($${(a.mrr/1000).toFixed(1)}K MRR)`).join('\n')}\n\nRecommend prioritizing outreach to anyone in Freefall first.`;
    }
    return 'No major risk signals across your portfolio right now. Keep monitoring engagement levels.';
  }

  if (lowerQ.includes('pipeline') || lowerQ.includes('deal')) {
    const totalMRR = deals.reduce((sum, d) => sum + d.mrr, 0);
    const healthy = deals.filter(d => d.health === 'Healthy').length;
    const stalled = deals.filter(d => d.health === 'Stalled').length;
    return `Pipeline overview: ${deals.length} active deals, $${(totalMRR/1000).toFixed(1)}K total MRR.\n\n${healthy} healthy, ${stalled} stalled. Focus on unblocking stalled deals to protect quarter-end numbers.`;
  }

  if (lowerQ.includes('top') || lowerQ.includes('best') || lowerQ.includes('performer')) {
    const top = [...advisors].sort((a, b) => b.mrr - a.mrr).slice(0, 5);
    return `Top 5 advisors by MRR:\n\n${top.map((a, i) => `${i+1}. ${a.name} \u2014 $${(a.mrr/1000).toFixed(1)}K (${a.pulse} pulse, ${a.trajectory})`).join('\n')}`;
  }

  return role === 'manager'
    ? 'I can help you with advisor insights, risk detection, call prep, and pipeline analysis. Try clicking on an advisor name to get contextual intelligence, or ask me about your portfolio.'
    : 'I can help with team performance, forecast accuracy, coaching needs, and capacity planning. Ask me anything about your team.';
}

function getProactiveMessage(role: 'manager' | 'leader'): string {
  if (role === 'manager') {
    return "Good morning, Jordan. Tom Bradley's account is showing friction in quoting \u2014 I'd recommend an executive check-in this week. Sarah Chen has $25.1K in pipeline ready for expansion. Want me to prep a briefing for either?";
  }
  return "Hi Priya. Javier is running at 57/30 partner capacity \u2014 we should discuss rebalancing. Marcus's cycle time is trending 8 days above average. Want me to pull the details?";
}

function getAdvisorInsight(advisor: Advisor): string {
  const advDeals = deals.filter(d => d.advisorId === advisor.id);
  const totalMRR = advDeals.reduce((sum, d) => sum + d.mrr, 0);
  const activeDealCount = advDeals.filter(d => d.stage !== 'Closed Won').length;

  const negotiating = advDeals.find(d => d.stage === 'Negotiating');
  const atRisk = advDeals.find(d => d.health === 'At Risk' || d.health === 'Stalled');

  let insight = `${advisor.name} has ${activeDealCount} active deal${activeDealCount !== 1 ? 's' : ''} worth $${(totalMRR/1000).toFixed(1)}K.`;

  if (negotiating) {
    insight += ` ${negotiating.name} is in Negotiating and looks ${negotiating.health === 'Healthy' ? 'healthy' : 'like it needs attention'}.`;
  }
  if (atRisk) {
    insight += ` ${atRisk.name} is ${atRisk.health.toLowerCase()} \u2014 worth a check-in.`;
  }

  insight += ` Best time to reach ${advisor.name.split(' ')[0]} is ${advisor.bestDayToReach} via ${advisor.commPreference?.toLowerCase() || 'email'}.`;
  return insight;
}

export function AIChat({ role, context, selectedAdvisor }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset messages when advisor changes
  useEffect(() => {
    if (selectedAdvisor) {
      setMessages([{
        id: '1',
        type: 'assistant',
        text: getAdvisorInsight(selectedAdvisor),
      }]);
    } else {
      setMessages([{
        id: '1',
        type: 'assistant',
        text: getProactiveMessage(role),
      }]);
    }
  }, [selectedAdvisor, role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const responseText = selectedAdvisor
        ? generateAdvisorResponse(selectedAdvisor, inputValue)
        : generateGeneralResponse(role, inputValue);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: responseText,
      }]);
      setIsLoading(false);
    }, 600);
  };

  // Suggested prompts based on context
  const suggestions = selectedAdvisor
    ? ['How should I prep for a call?', 'What are the risks?', 'Tell me about their deals', 'Personal interests?']
    : ['Who needs attention?', 'Pipeline overview', 'Top performers', 'At-risk advisors'];

  return (
    <>
      {/* Collapsed state: slim vertical tab on right edge */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#157A6E] text-white px-1.5 py-6 rounded-l-lg shadow-lg hover:shadow-xl transition-all z-40 flex flex-col items-center gap-1"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-medium [writing-mode:vertical-lr] rotate-180">Chat</span>
        </button>
      )}

      {/* Open state: clean minimal sidebar */}
      {isOpen && (
        <div className="w-[300px] h-full bg-white border-l border-solid border-[#e8e5e1] flex flex-col flex-shrink-0">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-[#e8e5e1] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#157A6E] rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {selectedAdvisor ? selectedAdvisor.name : 'AI Assistant'}
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Advisor context bar */}
          {selectedAdvisor && (
            <div className="px-4 py-2 bg-[#f0faf8] border-b border-[#e8e5e1] flex items-center gap-2.5 text-xs">
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
              <span className="text-gray-600">${(selectedAdvisor.mrr/1000).toFixed(1)}K</span>
              <span className="text-gray-600">{selectedAdvisor.trajectory}</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-3 flex flex-col gap-3">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap text-13px leading-1.6 ${
                  message.type === 'user'
                    ? 'bg-[#157A6E] text-white px-3.5 py-2 rounded-3xl rounded-br-sm'
                    : 'text-[#555555] text-left'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips */}
          {messages.length <= 2 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { handleSendDirect(s); }}
                  className="px-2.5 py-1 bg-[#faf9f7] border border-[#e0ddd9] rounded-full text-10px text-gray-700 hover:border-[#157A6E] hover:text-[#157A6E] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#e8e5e1]">
            <div className="flex items-center gap-2 bg-[#faf9f7] border border-[#e0ddd9] rounded-lg px-3 py-2.5 focus-within:border-[#157A6E] focus-within:bg-white transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={selectedAdvisor ? `Ask about ${selectedAdvisor.name.split(' ')[0]}...` : 'Ask a question...'}
                className="flex-1 bg-transparent text-12px text-gray-900 placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="p-1.5 text-[#157A6E] hover:bg-[#157A6E]/10 rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  function handleSendDirect(text: string) {
    if (!text.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), type: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setTimeout(() => {
      const responseText = selectedAdvisor
        ? generateAdvisorResponse(selectedAdvisor, text)
        : generateGeneralResponse(role, text);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'assistant', text: responseText }]);
      setIsLoading(false);
    }, 600);
  }
}
