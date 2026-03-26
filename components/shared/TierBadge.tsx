'use client';

import { PartnerTier } from '@/lib/types';

interface TierBadgeProps {
  tier: PartnerTier;
}

const tierConfig: Record<
  PartnerTier,
  { bg: string; text: string; label: string }
> = {
  top10: {
    bg: 'bg-tcs-teal',
    text: 'text-white',
    label: 'TOP 10',
  },
  next20: {
    bg: 'bg-blue-600',
    text: 'text-white',
    label: 'NEXT 20',
  },
  other: {
    bg: 'bg-gray-300',
    text: 'text-gray-700',
    label: 'OTHER',
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
