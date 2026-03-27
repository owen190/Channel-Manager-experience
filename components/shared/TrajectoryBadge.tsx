'use client';

import { Trajectory } from '@/lib/types';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

interface TrajectoryBadgeProps {
  trajectory: Trajectory;
}

const trajectoryConfig: Record<
  Trajectory,
  { Icon: LucideIcon; color: string; label: string }
> = {
  Accelerating: {
    Icon: TrendingUp,
    color: 'text-green-600',
    label: 'Accelerating',
  },
  Climbing: {
    Icon: TrendingUp,
    color: 'text-blue-600',
    label: 'Climbing',
  },
  Stable: {
    Icon: ArrowRight,
    color: 'text-orange-600',
    label: 'Stable',
  },
  Slipping: {
    Icon: TrendingDown,
    color: 'text-pink-600',
    label: 'Slipping',
  },
  Freefall: {
    Icon: TrendingDown,
    color: 'text-red-600',
    label: 'Freefall',
  },
};

export function TrajectoryBadge({ trajectory }: TrajectoryBadgeProps) {
  const config = trajectoryConfig[trajectory];
  const IconComp = config.Icon;

  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${config.color}`}>
      <IconComp className="w-4 h-4" />
      <span className="text-sm uppercase">{config.label}</span>
    </span>
  );
}
