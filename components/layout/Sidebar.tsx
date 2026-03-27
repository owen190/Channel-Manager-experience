'use client';

import { Zap, Brain, Handshake, DollarSign, TrendingUp, BarChart3, Users } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Brain,
  Handshake,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
};

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  activeView: string;
  onViewChange: (id: string) => void;
  role: 'manager' | 'leader';
  userName: string;
  userInitials: string;
}

export function Sidebar({
  items,
  activeView,
  onViewChange,
  role,
  userName,
  userInitials,
}: SidebarProps) {
  const subtitle =
    role === 'manager'
      ? 'Partner Intelligence'
      : 'Sales Operations';

  return (
    <div className="w-64 h-screen bg-tcs-dark text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 p-6">
        <h1 className="font-newsreader text-2xl font-bold text-tcs-teal mb-1">
          Channel Companion
        </h1>
        <p className="text-xs text-gray-400 uppercase tracking-wider">
          {subtitle}
        </p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {items.map((item) => {
          const IconComponent = ICON_MAP[item.icon];
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all border-l-2 ${
                activeView === item.id
                  ? 'bg-gray-700 border-l-tcs-teal text-tcs-teal'
                  : 'border-l-transparent text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              {IconComponent ? (
                <IconComponent className="w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-700 px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-tcs-teal rounded-full flex items-center justify-center text-sm font-bold">
          {userInitials}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{userName}</div>
          <div className="text-xs text-gray-500">{role}</div>
        </div>
      </div>
    </div>
  );
}
