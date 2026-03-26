'use client';

import { BriefingItem } from '@/lib/types';

interface MorningBriefingProps {
  actNow: BriefingItem[];
  capitalize: BriefingItem[];
  nurture: BriefingItem[];
}

interface BriefingColumnProps {
  title: string;
  items: BriefingItem[];
  dotColor: string;
  borderColor: string;
}

function BriefingColumn({
  title,
  items,
  dotColor,
  borderColor,
}: BriefingColumnProps) {
  return (
    <div className={`border-t-4 ${borderColor} bg-white rounded-lg p-6`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${dotColor}`} />
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="text-sm">
            <div className="font-semibold text-tcs-teal mb-1">
              {item.advisorName}
            </div>
            {item.dealName && (
              <div className="text-gray-700 font-medium mb-1">
                {item.dealName}
              </div>
            )}
            <div className="text-gray-600 italic mb-1">{item.action}</div>
            {item.personalHook && (
              <div className="text-gray-500 text-xs mb-1">{item.personalHook}</div>
            )}
            {item.mrrAtRisk && (
              <div className="text-red-600 font-medium text-xs">
                ${(item.mrrAtRisk / 1000).toFixed(1)}K at risk
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MorningBriefing({
  actNow,
  capitalize,
  nurture,
}: MorningBriefingProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BriefingColumn
        title="Act Now"
        items={actNow}
        dotColor="bg-red-500"
        borderColor="border-red-500"
      />
      <BriefingColumn
        title="Capitalize"
        items={capitalize}
        dotColor="bg-amber-500"
        borderColor="border-amber-500"
      />
      <BriefingColumn
        title="Nurture"
        items={nurture}
        dotColor="bg-green-500"
        borderColor="border-green-500"
      />
    </div>
  );
}
