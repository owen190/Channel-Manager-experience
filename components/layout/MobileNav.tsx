'use client';

import { Zap, Brain, Handshake, DollarSign, TrendingUp, BarChart3, Users, Settings } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface MobileNavProps {
  items: NavItem[];
  activeView: string;
  onViewChange: (id: string) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Brain,
  Handshake,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
};

export function MobileNav({ items, activeView, onViewChange }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-solid border-[#e8e5e1] flex items-center justify-around h-16 md:hidden z-40">
      {items.map((item) => {
        const IconComponent = ICON_MAP[item.icon];
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 h-full transition-colors"
            title={item.label}
          >
            {IconComponent ? (
              <IconComponent
                className={`w-5 h-5 ${isActive ? 'text-[#157A6E]' : 'text-[#999]'}`}
              />
            ) : (
              <span className="w-5 h-5" />
            )}
            <span
              className={`text-[10px] font-medium ${
                isActive ? 'text-[#157A6E]' : 'text-[#999]'
              }`}
            >
              {item.label.split(' ')[0]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
