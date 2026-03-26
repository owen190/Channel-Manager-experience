'use client';

import { PulseState } from '@/lib/types';

interface PulseBadgeProps {
  pulse: PulseState;
  size?: 'sm' | 'md';
}

const pulseConfig: Record<
  PulseState,
  { bg: string; text: string; label: string }
> = {
  Strong: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Strong',
  },
  Steady: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Steady',
  },
  Rising: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Rising',
  },
  Fading: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    label: 'Fading',
  },
  Flatline: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'Flatline',
  },
};

export function PulseBadge({ pulse, size = 'md' }: PulseBadgeProps) {
  const config = pulseConfig[pulse];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-block ${sizeClass} rounded font-semibold uppercase ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
