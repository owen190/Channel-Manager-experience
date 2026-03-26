'use client';

import { INTEGRATIONS } from '@/lib/constants';

interface IntegrationBadgesProps {
  showAll?: boolean;
}

export function IntegrationBadges({ showAll = false }: IntegrationBadgesProps) {
  const displayIntegrations = showAll ? INTEGRATIONS : INTEGRATIONS.slice(0, 4);

  return (
    <div className="flex gap-3 flex-wrap">
      {displayIntegrations.map((integration) => (
        <div
          key={integration.name}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            integration.status === 'connected'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <span className="text-sm">{integration.icon}</span>
          <span className="hidden sm:inline">{integration.name}</span>
          {integration.status === 'connected' && (
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
          )}
        </div>
      ))}
    </div>
  );
}
