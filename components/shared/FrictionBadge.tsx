'use client';

import { FrictionLevel } from '@/lib/types';

interface FrictionBadgeProps {
  level: FrictionLevel;
}

const frictionConfig: Record<
  FrictionLevel,
  { bg: string; text: string; label: string }
> = {
  Low: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Low',
  },
  Moderate: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Moderate',
  },
  High: {
    bg: 'bg-orange-200',
    text: 'text-orange-800',
    label: 'High',
  },
  Critical: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Critical',
  },
};

export function FrictionBadge({ level }: FrictionBadgeProps) {
  const config = frictionConfig[level];

  return (
    <span
      className={`inline-block px-3 py-1 rounded text-sm font-semibold uppercase ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
