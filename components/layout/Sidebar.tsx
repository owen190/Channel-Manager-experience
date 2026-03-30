'use client';

import { Zap, Brain, Handshake, DollarSign, TrendingUp, BarChart3, Users } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Brain,
  Handshake,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
};

export interface NavItem {
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
  const router = useRouter();
  return (
    <div className="w-56 h-screen bg-white border-r border-solid border-[#e8e5e1] flex flex-col">
      {/* Brand Section */}
      <div className="px-5 py-6 cursor-pointer group" onClick={() => router.push('/')}>
        <h1 className="font-newsreader text-lg font-bold text-[#157A6E] whitespace-pre-line leading-tight mb-2 group-hover:opacity-80 transition-opacity">
          Channel{'\n'}Companion
        </h1>
        <p className="text-[10px] uppercase tracking-[1.5px] text-[#999] font-medium">
          Partner Intelligence
        </p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-5 py-6 space-y-1">
        {items.map((item) => {
          const IconComponent = ICON_MAP[item.icon];
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#157A6E] text-white'
                  : 'text-[#666] hover:bg-[#f5f3f0] hover:text-[#333]'
              }`}
              style={{
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {IconComponent ? (
                <IconComponent className="w-4 h-4 flex-shrink-0" />
              ) : (
                <span className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-solid border-[#e8e5e1] px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#157A6E] text-white flex items-center justify-center flex-shrink-0" style={{ fontSize: '12px', fontWeight: 600 }}>
          {userInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[#333] truncate">{userName}</div>
          <div className="text-[11px] text-[#999] truncate">{role === 'manager' ? 'Channel Manager' : 'Sales Leader'}</div>
        </div>
      </div>
    </div>
  );
}
