'use client';

import { useState } from 'react';
import { Nudge } from '@/lib/types';

interface SmartNudgesProps {
  nudges: Nudge[];
}

const nudgeConfig = {
  forecast: { color: 'border-l-red-500', icon: 'ð' },
  capacity: { color: 'border-l-orange-500', icon: 'ð¦' },
  stall: { color: 'border-l-pink-500', icon: 'â¸ï¸' },
  engagement: { color: 'border-l-blue-500', icon: 'ð¬' },
  win: { color: 'border-l-green-500', icon: 'ð' },
  competitive: { color: 'border-l-purple-500', icon: 'âï¸' },
  quarter: { color: 'border-l-yellow-500', icon: 'ð' },
  override: { color: 'border-l-indigo-500', icon: 'â¡' },
  hygiene: { color: 'border-l-gray-500', icon: 'ð§¹' },
};

export function SmartNudges({ nudges }: SmartNudgesProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = nudges.length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-tcs-bg rounded-lg transition-colors"
      >
        ð
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[400px] bg-white border border-tcs-border rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="border-b border-tcs-border px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Smart Nudges</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              Ã
            </button>
          </div>

          {/* Mark All Read */}
          <div className="border-b border-tcs-border px-4 py-2">
            <button className="text-xs text-tcs-teal font-medium hover:underline">
              Mark all as read
            </button>
          </div>

          {/* Nudges List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-tcs-border">
            {nudges.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-600">
                No nudges at the moment
              </div>
            ) : (
              nudges.map((nudge) => {
                const config =
                  nudgeConfig[nudge.type as keyof typeof nudgeConfig] ||
                  nudgeConfig.hygiene;

                return (
                  <div
                    key={nudge.id}
                    className={`border-l-4 ${config.color} p-4 hover:bg-tcs-bg transition-colors cursor-pointer`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">
                        {config.icon}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-sm mb-1">
                          {nudge.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {nudge.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{nudge.time}</span>
                          <span
                            className={`px-2 py-1 rounded font-semibold uppercase ${
                              nudge.priority === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : nudge.priority === 'high'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {nudge.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
