'use client';

import { DealHealth } from '@/lib/types';

interface DealHealthBadgeProps {
  health: DealHealth;
}

const healthConfig: Record<
  DealHealth,
  { bg: string; text: string; label: string }
> = {
  Healthy: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Healthy',
  },
  Monitor: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Monitor',
  },
  'At Risk': {
    bg: 'bg-orange-200',
    text: 'text-orange-800',
    label: 'At Risk',
  },
  Stalled: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    label: 'Stalled',
  },
};

export function DealHealthBadge({ health }: DealHealthBadgeProps) {
  const config = healthConfig[health];

  return (
    <span
      className={`inline-block px-3 py-1 rounded text-sm font-semibold uppercase ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
