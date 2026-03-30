'use client';

import { Bell, Settings, Search, X, Home } from 'lucide-react';
import { Nudge } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  nudges: Nudge[];
  userName: string;
  userInitials: string;
  pageTitle?: string;
  role?: 'manager' | 'leader';
}

const MANAGER_NOTIFICATIONS = [
  { id: 'n1', text: 'Tom Bradley hasn\'t responded in 14 days', time: '2h ago', type: 'warning' as const },
  { id: 'n2', text: 'Sarah Chen\'s deal moved to Negotiating', time: '4h ago', type: 'success' as const },
  { id: 'n3', text: 'New Gong call summary: Mike Rivera check-in', time: '6h ago', type: 'info' as const },
  { id: 'n4', text: 'FiberFirst Capacity deal stalled — 35 days in Qualifying', time: '1d ago', type: 'warning' as const },
  { id: 'n5', text: 'Quarter closes in 5 days — 3 deals need attention', time: '1d ago', type: 'warning' as const },
];

const LEADER_NOTIFICATIONS = [
  { id: 'n1', text: 'Natasha has 4 stalled deals — coaching recommended', time: '1h ago', type: 'warning' as const },
  { id: 'n2', text: 'Javier at 190% partner capacity — rebalancing needed', time: '3h ago', type: 'warning' as const },
  { id: 'n3', text: 'Diego closed 3 deals this week — top performer', time: '5h ago', type: 'success' as const },
  { id: 'n4', text: 'Marcus\'s cycle time trending 8 days above average', time: '1d ago', type: 'info' as const },
];

export function TopBar({
  nudges,
  userName,
  userInitials,
  pageTitle = 'Command Center',
  role = 'manager',
}: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const notifications = role === 'manager' ? MANAGER_NOTIFICATIONS : LEADER_NOTIFICATIONS;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setShowSettings(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-[52px] bg-white border-b border-[#e8e5e1] flex items-center px-6 justify-between">
      {/* Left Section - Home + Page Title */}
      <div className="flex-1 flex items-center gap-3">
        <button
          onClick={() => router.push('/')}
          className="w-[30px] h-[30px] flex items-center justify-center border border-[#e0ddd9] rounded-[8px] hover:bg-gray-50 hover:border-[#157A6E] transition-colors text-gray-500 hover:text-[#157A6E]"
          aria-label="Home"
          title="Switch persona"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
        <h1
          className="text-[18px] font-[600] text-gray-900"
          style={{ fontFamily: 'Newsreader, serif' }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search advisors, deals..."
            className="w-[220px] pl-9 pr-3 py-1.5 border border-[#e0ddd9] rounded-[8px] text-[12px] bg-[#faf9f7] focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            className={`w-[34px] h-[34px] flex items-center justify-center border rounded-[8px] hover:bg-gray-50 transition-colors ${showNotifications ? 'border-[#157A6E] bg-gray-50 text-[#157A6E]' : 'border-[#e0ddd9] text-gray-600'}`}
            aria-label="Notifications"
            onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
          >
            <Bell className="w-4 h-4" />
          </button>
          {notifications.length > 0 && !showNotifications && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {notifications.length > 9 ? '9+' : notifications.length}
            </div>
          )}

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[340px] bg-white border border-[#e8e5e1] rounded-xl shadow-xl z-50">
              <div className="px-4 py-3 border-b border-[#f0ede9] flex items-center justify-between">
                <h3 className="text-13px font-semibold text-gray-900">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="px-4 py-3 border-b border-[#f5f3f0] last:border-0 hover:bg-[#F7F5F2] transition-colors cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'warning' ? 'bg-amber-400' : n.type === 'success' ? 'bg-green-400' : 'bg-blue-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-12px text-gray-800 leading-snug">{n.text}</p>
                        <p className="text-10px text-gray-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative" ref={settingsRef}>
          <button
            className={`w-[34px] h-[34px] flex items-center justify-center border rounded-[8px] hover:bg-gray-50 transition-colors ${showSettings ? 'border-[#157A6E] bg-gray-50 text-[#157A6E]' : 'border-[#e0ddd9] text-gray-600'}`}
            aria-label="Settings"
            onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
          >
            <Settings className="w-4 h-4" />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-[220px] bg-white border border-[#e8e5e1] rounded-xl shadow-xl z-50">
              <div className="px-4 py-3 border-b border-[#f0ede9]">
                <h3 className="text-13px font-semibold text-gray-900">Settings</h3>
              </div>
              <div className="py-1">
                {[
                  { label: 'Display Preferences', desc: 'Theme & layout' },
                  { label: 'Notification Settings', desc: 'Alerts & digests' },
                  { label: 'Integration Status', desc: '4 connected' },
                  { label: 'Data Sources', desc: 'CRM, Gong, Fireflies' },
                ].map((item, i) => (
                  <button key={i} className="w-full px-4 py-2.5 text-left hover:bg-[#F7F5F2] transition-colors">
                    <p className="text-12px font-medium text-gray-800">{item.label}</p>
                    <p className="text-10px text-gray-400">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
