'use client';

import { Tone } from '@/lib/types';

interface SentimentBadgeProps {
  tone: Tone;
}

const toneConfig: Record<
  Tone,
  { bg: string; text: string; label: string }
> = {
  Warm: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Warm',
  },
  Neutral: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'Neutral',
  },
  Cool: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Cool',
  },
};

export function SentimentBadge({ tone }: SentimentBadgeProps) {
  const config = toneConfig[tone];

  return (
    <span
      className={`inline-block px-3 py-1 rounded text-sm font-semibold uppercase ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
