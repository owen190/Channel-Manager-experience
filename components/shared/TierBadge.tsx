'use client';

import { PartnerTier } from '@/lib/types';

interface TierBadgeProps {
  tier: PartnerTier;
}

const tierConfig: Record<
  PartnerTier,
  { bg: string; text: string; label: string }
> = {
  platinum: {
    bg: 'bg-tcs-teal',
    text: 'text-white',
    label: 'PLATINUM',
  },
  gold: {
    bg: 'bg-amber-500',
    text: 'text-white',
    label: 'GOLD',
  },
  silver: {
    bg: 'bg-gray-400',
    text: 'text-white',
    label: 'SILVER',
  },
  onboarding: {
    bg: 'bg-blue-500',
    text: 'text-white',
    label: 'ONBOARDING',
  },
};

export function TierBadge({ tier }: TierBadgeProps) {
  const config = tierConfig[tier];

  return (
    <span
      className={`inline-block px-3 py-1 rounded text-sm font-semibold uppercase ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
