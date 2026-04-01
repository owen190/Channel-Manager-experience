'use client';

import { Bell, Settings, Search, X, Home } from 'lucide-react';
import { Nudge } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { NotificationCenter } from '@/components/shared/NotificationCenter';

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
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const userId = 'user-1'; // In a real app, get from session/auth

  const notifications = role === 'manager' ? MANAGER_NOTIFICATIONS : LEADER_NOTIFICATIONS;

  // Close dropdowns on outside click and handle keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
      <div className="h-[52px] bg-white border-b border-[#e8e5e1] flex items-center px-4 md:px-6 justify-between">
        {/* Left Section - Home + Page Title */}
      <div className="flex-1 flex items-center gap-2 md:gap-3 min-w-0">
        <button
          onClick={() => router.push('/')}
          className="w-[30px] h-[30px] flex-shrink-0 flex items-center justify-center border border-[#e0ddd9] rounded-[8px] hover:bg-gray-50 hover:border-[#157A6E] transition-colors text-gray-500 hover:text-[#157A6E]"
          aria-label="Home"
          title="Switch persona"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
        <h1
          className="text-[16px] md:text-[18px] font-[600] text-gray-900 truncate"
          style={{ fontFamily: 'Newsreader, serif' }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3 ml-2 md:ml-0">
        {/* Search Input - Hidden on mobile */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowGlobalSearch(true)}
            placeholder="Search (Cmd+K)..."
            className="w-[220px] pl-9 pr-3 py-1.5 border border-[#e0ddd9] rounded-[8px] text-[12px] bg-[#faf9f7] focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            className={`w-[34px] h-[34px] flex items-center justify-center border rounded-[8px] hover:bg-gray-50 transition-colors ${showNotifications ? 'border-[#157A6E] bg-gray-50 text-[#157A6E]' : 'border-[#e0ddd9] text-gray-600'}`}
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-4 h-4" />
          </button>
          {notifications.length > 0 && !showNotifications && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {notifications.length > 9 ? '9+' : notifications.length}
            </div>
          )}
        </div>
        <NotificationCenter
          userId={userId}
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        {/* Settings */}
        <button
          className="w-[34px] h-[34px] flex items-center justify-center border border-[#e0ddd9] rounded-[8px] hover:bg-gray-50 hover:border-[#157A6E] transition-colors text-gray-600 hover:text-[#157A6E]"
          aria-label="Settings"
          onClick={() => router.push('/settings')}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
    </>
  );
}
