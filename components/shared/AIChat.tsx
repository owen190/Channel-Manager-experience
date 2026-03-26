'use client';

import { useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
}

interface AIChatProps {
  role: 'manager' | 'leader';
  context?: string;
}

const SAMPLE_RESPONSES = {
  manager: {
    sarah: 'Sarah Chen is your top performer this quarter. She has 5 deals in the pipeline totaling $450K, with a Strong pulse and steady trajectory. Last contact was 2 days ago.',
    risk: 'You have 3 advisors at risk: Tom Bradley (Fading pulse, High friction), Nina Patel (Slipping trajectory), and Marcus Johnson (Critical friction due to account consolidation). Recommend immediate outreach.',
    pipeline: 'Your total pipeline is $2.3M across 28 active deals. Top advisors: Sarah Chen ($450K), David Kim ($380K), and Lisa Wong ($320K). 65% of deals are in Proposal or Negotiating stage.',
    nina: 'Nina Patel connected 18 months ago. Cool tone with Moderate friction around response time. 2 deals in pipeline ($180K total). Best to reach Tuesday mornings via Teams.',
    tom: 'Tom Bradley shows Fading pulse with High friction. Main issue: capacity constraints with 8 active deals. Recommend consolidation strategy. Last contact 5 days ago.',
  },
  leader: {
    risk: 'You have 2 reps at risk of missing commit: Alex Rodriguez (-$120K from target) and Jordan Lee (-$85K from target). Both need coaching on deal closure.',
    coaching: 'Recommend coaching for: Sarah Park (win rate 45%, below team avg of 58%), and Marcus Chen (average deal cycle 120 days vs team avg 85). Both have strong engagement.',
    capacity: 'Capacity utilization: Alex Rodriguez at 95% (28/30 partners), Sarah Park at 72% (22/30). Recommend capacity planning for Alex.',
    forecast: 'Q1 forecast tracking at 87% of target ($1.8M actual vs $2.1M target). On pace for -13% variance. Top performers: Sarah (125% target), David (110% target).',
  },
};

export function AIChat({ role, context }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      text: role === 'manager'
        ? 'Ask me about your partners. I can help with advisor insights, risk detection, pipeline analysis, and more.'
        : 'Ask me about your team. I can help with forecast, coaching needs, capacity issues, and performance.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const responses = SAMPLE_RESPONSES[role];
      let responseText = 'I understand your question. Let me help with that.';

      const lowerInput = inputValue.toLowerCase();
      for (const [key, value] of Object.entries(responses)) {
        if (lowerInput.includes(key)) {
          responseText = value;
          break;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: responseText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-tcs-teal rounded-full flex items-center justify-center text-2xl shadow-lg hover:shadow-xl transition-shadow z-40"
      >
        ð¬
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] h-[450px] bg-white rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-tcs-teal text-white px-4 py-4 flex items-center justify-between">
            <h3 className="font-semibold">
              {role === 'manager'
                ? 'Ask about your partners'
                : 'Ask about your team'}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-xl"
            >
              Ã
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-tcs-teal text-white rounded-br-none'
                      : 'bg-tcs-bg text-gray-900 rounded-bl-none'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-tcs-bg text-gray-600 px-4 py-2 rounded-lg rounded-bl-none text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-tcs-border p-4 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="px-4 py-2 bg-tcs-teal text-white rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
