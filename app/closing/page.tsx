'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, TrendingUp, Brain, BarChart3, Mail, Calendar } from 'lucide-react';

export default function ClosingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#1a1d23] flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-newsreader text-4xl md:text-5xl font-bold text-[#157A6E] mb-3">
            Channel Companion
          </h1>
          <p className="text-gray-300 text-base font-medium mb-1">
            by The Channel Standard
          </p>
          <p className="text-gray-500 text-sm">
            AI-Powered Channel Management Platform
          </p>
        </div>

        {/* What We Showed */}
        <div className="bg-[#F7F5F2] rounded-xl p-8 mb-8 border border-[#e8e5e1]">
          <h2 className="font-newsreader text-xl font-bold text-gray-900 mb-6">What You Just Saw</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Users, title: 'Partner Intelligence', desc: 'Real-time relationship health, personal context, and engagement signals for every partner in your portfolio.' },
              { icon: TrendingUp, title: 'Pipeline Management', desc: 'Stage-by-stage visibility with deal health scoring, timeline mismatch detection, and forecast confidence.' },
              { icon: Brain, title: 'AI Coaching', desc: 'Contextual AI assistant that knows your partners, preps your calls, and surfaces risks before they become losses.' },
              { icon: BarChart3, title: 'Strategic Analytics', desc: 'Advisor quadrants, tier analysis, quoting activity, and team capacity — all in one view for leaders.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-4 bg-white rounded-lg border border-[#e8e5e1]">
                <div className="w-9 h-9 bg-[#157A6E] rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-13px font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-12px text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outcomes */}
        <div className="bg-[#157A6E] rounded-xl p-8 mb-8 text-white">
          <h2 className="font-newsreader text-xl font-bold mb-6">What This Means for Your Team</h2>
          <div className="space-y-4">
            {[
              'Channel managers recover 10+ hours/week on partner triage and prep',
              'Surface at-risk revenue before it churns — not after',
              'Replace gut instinct with AI-driven portfolio strategy',
              'Give leaders real-time visibility without adding reporting burden to reps',
            ].map((outcome, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-[15px] leading-relaxed">{outcome}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-[#F7F5F2] rounded-xl p-8 border border-[#e8e5e1] text-center">
          <h2 className="font-newsreader text-xl font-bold text-gray-900 mb-2">Next Steps</h2>
          <p className="text-gray-600 text-sm mb-6">Ready to see how Channel Companion fits your team?</p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <a
              href="mailto:owen@thechannelstandard.com"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#157A6E] text-white rounded-lg hover:bg-[#126a5f] transition-colors text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              owen@thechannelstandard.com
            </a>
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e8e5e1] text-gray-700 rounded-lg hover:border-[#157A6E] hover:text-[#157A6E] transition-colors text-sm font-medium"
            >
              <Calendar className="w-4 h-4" />
              Book a Follow-Up
            </a>
          </div>
          <p className="text-gray-400 text-xs mt-4">Owen · The Channel Standard</p>
        </div>

        {/* Back to demo */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#157A6E] transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to demo
          </button>
        </div>
      </div>
    </div>
  );
}
