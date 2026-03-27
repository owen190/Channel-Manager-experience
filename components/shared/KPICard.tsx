'use client';

import { ReactNode, useState } from 'react';

interface KPICardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
  detail?: ReactNode;
}

export function KPICard({
  label,
  value,
  change,
  changeType = 'neutral',
  onClick,
  detail,
}: KPICardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (detail) {
      setIsOpen(!isOpen);
    }
    onClick?.();
  };

  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const changeArrow = {
    positive: '\u2191',
    negative: '\u2193',
    neutral: '\u2192',
  };

  return (
    <div className="w-full">
      <div
        className={`bg-white border border-tcs-border rounded-lg p-6 cursor-pointer transition-all ${
          detail ? 'hover:border-tcs-teal' : ''
        }`}
        onClick={handleClick}
      >
        <div className="text-xs uppercase tracking-wider text-gray-600 mb-2">
          {label}
        </div>
        <div className="font-newsreader text-4xl font-bold text-gray-900 mb-3">
          {value}
        </div>
        {change && (
          <div className={`text-sm font-medium ${changeColors[changeType]}`}>
            <span className="mr-1">{changeArrow[changeType]}</span>
            {change}
          </div>
        )}
      </div>
      {detail && isOpen && (
        <div className="mt-4 p-4 bg-tcs-bg border border-tcs-border rounded-lg">
          {detail}
        </div>
      )}
    </div>
  );
}
