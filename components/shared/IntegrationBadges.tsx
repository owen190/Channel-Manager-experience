'use client';

import { INTEGRATIONS } from '@/lib/constants';
import { Cloud, Mic, Flame, MessageSquare, Hash, Hexagon } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Cloud,
  Mic,
  Flame,
  MessageSquare,
  Hash,
  Hexagon,
};

interface IntegrationBadgesProps {
  showAll?: boolean;
}

export function IntegrationBadges({ showAll = false }: IntegrationBadgesProps) {
  const displayIntegrations = showAll ? INTEGRATIONS : INTEGRATIONS.slice(0, 4);

  return (
    <div className="flex gap-3 flex-wrap">
      {displayIntegrations.map((integration) => {
        const IconComponent = ICON_MAP[integration.icon];
        return (
          <div
            key={integration.name}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              integration.status === 'connected'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {IconComponent ? (
              <IconComponent className="w-3.5 h-3.5" />
            ) : (
              <span className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{integration.name}</span>
            {integration.status === 'connected' && (
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
            )}
          </div>
        );
      })}
    </div>
  );
}
