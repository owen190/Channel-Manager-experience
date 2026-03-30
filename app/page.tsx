'use client';

import { useRouter } from 'next/navigation';
import { Handshake, BarChart3, Cloud, Mic, Flame, MessageSquare } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#1a1d23] flex flex-col items-center justify-center p-4">
      {/* Header Section */}
      <div className="text-center mb-10">
        <h1 className="font-newsreader text-5xl md:text-6xl font-bold text-[#157A6E] mb-4">
          Channel Companion
        </h1>
        <p className="text-gray-300 text-base md:text-lg mb-6 font-medium">
          by The Channel Standard
        </p>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Stop managing partners blind. Start managing them with intelligence.
        </p>
      </div>

      {/* Role Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl w-full">
        {/* Channel Manager Card */}
        <button
          onClick={() => router.push('/manager')}
          className="bg-[#F7F5F2] rounded-xl shadow-lg p-8 text-left transition-all duration-300 hover:shadow-2xl hover:border-2 hover:border-[#157A6E] hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:ring-offset-2 focus:ring-offset-[#1a1d23] border border-[#e8e5e1]"
        >
          <div className="text-[#157A6E] mb-4"><Handshake className="w-10 h-10" /></div>
          <h2 className="font-newsreader text-2xl font-bold text-[#0F1115] mb-1">
            Channel Manager
          </h2>
          <p className="text-[#157A6E] text-sm font-medium mb-4">
            Jordan R.
          </p>
          <p className="text-gray-600 mb-6 leading-relaxed text-[15px]">
            See which partners need you today, which deals are at risk, and what to do about it — before your first call.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-600">
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Command Center</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Intelligence Hub</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Relationships</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Pipeline</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Strategic</span>
          </div>
        </button>

        {/* Sales Leader Card */}
        <button
          onClick={() => router.push('/leader')}
          className="bg-[#F7F5F2] rounded-xl shadow-lg p-8 text-left transition-all duration-300 hover:shadow-2xl hover:border-2 hover:border-[#157A6E] hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:ring-offset-2 focus:ring-offset-[#1a1d23] border border-[#e8e5e1]"
        >
          <div className="text-[#157A6E] mb-4"><BarChart3 className="w-10 h-10" /></div>
          <h2 className="font-newsreader text-2xl font-bold text-[#0F1115] mb-1">
            Sales Leader
          </h2>
          <p className="text-[#157A6E] text-sm font-medium mb-4">
            Priya M.
          </p>
          <p className="text-gray-600 mb-6 leading-relaxed text-[15px]">
            Know which reps need coaching, which forecasts to trust, and where your pipeline is leaking — without asking for a report.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-600">
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Command Center</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Forecast</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Team</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Relationships</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Pipeline</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#e8e5e1]">Intelligence</span>
          </div>
        </button>
      </div>

      {/* Integration Footer */}
      <div className="text-center max-w-4xl w-full border-t border-gray-700/50 pt-8">
        <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-4">Connected Integrations</p>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="flex items-center gap-2 text-gray-400">
            <Cloud className="w-5 h-5" />
            <span className="text-sm font-medium">Salesforce</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Mic className="w-5 h-5" />
            <span className="text-sm font-medium">Gong</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-medium">Fireflies</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Microsoft Teams</span>
          </div>
        </div>
      </div>
    </div>
  );
}
