'use client';

import { useRouter } from 'next/navigation';
import { Handshake, BarChart3 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center p-4">
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="font-newsreader text-5xl md:text-6xl font-bold text-[#157A6E] mb-4">
          Channel Companion
        </h1>
        <p className="text-gray-400 text-lg md:text-xl mb-2">
          AI-Powered Channel Management Platform
        </p>
        <p className="text-gray-600 text-sm">
          by The Channel Standard
        </p>
      </div>

      {/* Role Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 max-w-4xl w-full">
        {/* Channel Manager Card */}
        <button
          onClick={() => router.push('/manager')}
          className="bg-white rounded-xl shadow-lg p-8 text-left transition-all duration-300 hover:shadow-2xl hover:border-2 hover:border-[#157A6E] hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:ring-offset-2 focus:ring-offset-[#0F1115]"
        >
          <div className="text-[#157A6E] mb-4"><Handshake className="w-10 h-10" /></div>
          <h2 className="font-newsreader text-2xl font-bold text-[#0F1115] mb-1">
            Channel Manager
          </h2>
          <p className="text-[#157A6E] text-sm font-medium mb-4">
            Jordan R.
          </p>
          <p className="text-gray-700 mb-6">
            Your daily operating tool. Advisor relationships, pipeline management, intelligence insights, and AI-powered coaching.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-600">
            <span className="bg-gray-100 px-3 py-1 rounded-full">Command Center</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">Intelligence Hub</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">Relationships</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">Pipeline</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">Strategic</span>
          </div>
        </button>

        {/* Sales Leader Card */}
        <button
          onClick={() => router.push('/leader')}
          className="bg-white rounded-xl shadow-lg p-8 text-left transition-all duration-300 hover:shadow-2xl hover:border-2 hover:border-[#157A6E] hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#157A6E] focus:ring-offset-2 focus:ring-offset-[#0F1115]"
        >
          <div className="text-[#157A6E] mb-4"><BarChart3 className="w-10 h-10" /></div>
          <h2 className="font-newsreader text-2xl font-bold text-[#0F1115] mb-1">
            Sales Leader
          </h2>
          <p className="text-[#157A6E] text-sm font-medium mb-4">
            Priya M.
          </p>
          <p className="text-gray-700 mb-6">
            Team oversight dashboard. Forecast tracking, capacity management, team coaching, and strategic intelligence.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-600">
            <span className="bg-gray-100 px-3 py-1 rounded-full">Command Center</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">Forecast</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">Team</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">Relationships</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">Pipeline</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">Intelligence</span>
          </div>
        </button>
      </div>

      {/* Integration Footer */}
      <div className="text-center text-gray-500 text-sm border-t border-gray-800 pt-8 max-w-4xl w-full">
        <p>Integrates with Salesforce • Gong • Fireflies • Microsoft Teams</p>
      </div>
    </div>
  );
}
