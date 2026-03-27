'use client';

import { Bell, Settings, Search } from 'lucide-react';
import { Nudge } from '@/lib/types';
import { useState } from 'react';

interface TopBarProps {
  nudges: Nudge[];
  userName: string;
  userInitials: string;
  pageTitle?: string;
}

export function TopBar({
  nudges,
  userName,
  userInitials,
  pageTitle = 'Command Center',
}: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const nudgeCount = nudges.length;

  return (
    <div className="h-[52px] bg-white border-b border-[#e8e5e1] flex items-center px-6 justify-between">
      {/* Left Section - Page Title */}
      <div className="flex-1">
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
        <div className="relative">
          <button
            className="w-[34px] h-[34px] flex items-center justify-center border border-[#e0ddd9] rounded-[8px] hover:bg-gray-50 transition-colors text-gray-600"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          {nudgeCount > 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {nudgeCount > 9 ? '9+' : nudgeCount}
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          className="w-[34px] h-[34px] flex items-center justify-center border border-[#e0ddd9] rounded-[8px] hover:bg-gray-50 transition-colors text-gray-600"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
