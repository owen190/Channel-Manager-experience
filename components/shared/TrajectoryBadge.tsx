'use client';

import { Trajectory } from '@/lib/types';

interface TrajectoryBadgeProps {
  trajectory: Trajectory;
}

const trajectoryConfig: Record<
  Trajectory,
  { arrow: string; color: string; label: string }
> = {
  Accelerating: {
    arrow: 'â²',
    color: 'text-green-600',
    label: 'Accelerating',
  },
  Climbing: {
    arrow: 'â²',
    color: 'text-blue-600',
    label: 'Climbing',
  },
  Stable: {
    arrow: 'â¶',
    color: 'text-orange-600',
    label: 'Stable',
  },
  Slipping: {
    arrow: 'â¼',
    color: 'text-pink-600',
    label: 'Slipping',
  },
  Freefall: {
    arrow: 'â¼',
    color: 'text-red-600',
    label: 'Freefall',
  },
};

export function TrajectoryBadge({ trajectory }: TrajectoryBadgeProps) {
  const config = trajectoryConfig[trajectory];

  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${config.color}`}>
      <span className="text-lg">{config.arrow}</span>
      <span className="text-sm uppercase">{config.label}</span>
    </span>
  );
}
