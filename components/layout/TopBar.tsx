'use client';

import { SmartNudges } from '@/components/shared/SmartNudges';
import { Settings } from 'lucide-react';
import { Nudge } from '@/lib/types';

interface TopBarProps {
  nudges: Nudge[];
  userName: string;
  userInitials: string;
  searchPlaceholder?: string;
}

export function TopBar({
  nudges,
  userName,
  userInitials,
  searchPlaceholder = 'Search...',
}: TopBarProps) {
  return (
    <div className="h-16 bg-white border-b border-tcs-border flex items-center px-6 justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-6 flex-1">
        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider min-w-max">
          Command Center
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="flex-1 max-w-xs px-4 py-2 border border-tcs-border rounded-lg text-sm focus:outline-none focus:border-tcs-teal"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* SmartNudges */}
        <SmartNudges nudges={nudges} />

        {/* Settings */}
        <button className="p-2 hover:bg-tcs-bg rounded-lg transition-colors text-gray-600">
          <Settings className="w-5 h-5" />
        </button>

        {/* User Chip */}
        <div className="flex items-center gap-2 pl-4 border-l border-tcs-border">
          <div className="w-8 h-8 bg-tcs-teal rounded-full flex items-center justify-center text-white text-xs font-bold">
            {userInitials}
          </div>
          <span className="text-sm font-medium text-gray-900 hidden sm:inline">
            {userName}
          </span>
        </div>
      </div>
    </div>
  );
}
