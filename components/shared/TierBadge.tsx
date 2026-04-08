'use client';

import { PartnerTier } from '@/lib/types';

interface TierBadgeProps {
  tier: PartnerTier;
}

const tierConfig: Record<
  PartnerTier,
  { bg: string; text: string; label: string }
> = {
  anchor: {
    bg: 'bg-tcs-teal',
    text: 'text-white',
    label: 'ANCHOR',
  },
  scaling: {
    bg: 'bg-amber-500',
    text: 'text-white',
    label: 'SCALING',
  },
  building: {
    bg: 'bg-gray-400',
    text: 'text-white',
    label: 'BUILDING',
  },
  launching: {
    bg: 'bg-blue-500',
    text: 'text-white',
    label: 'LAUNCHING',
  },
};

const fallback = { bg: 'bg-gray-300', text: 'text-gray-700', label: 'PARTNER' };

export function TierBadge({ tier }: TierBadgeProps) {
  const config = tierConfig[tier] || fallback;

  return (
    <span
      className={`inline-block px-3 py-1 rounded text-sm font-semibold uppercase ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
