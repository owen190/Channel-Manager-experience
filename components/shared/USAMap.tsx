'use client';

import React, { useState } from 'react';

interface RegionData {
  count: number;
  mrr: number;
  advisors: Array<{ id: string; name: string; mrr: number }>;
}

interface USAMapProps {
  advisorsByRegion: Record<string, RegionData>;
  onRegionClick: (region: string) => void;
  selectedRegion: string | null;
}

type RegionName = 'West' | 'Southwest' | 'Midwest' | 'Southeast' | 'Northeast';

const formatMRR = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value}`;
};

// Proper US region paths - simplified but recognizable
const REGION_PATHS: Record<RegionName, string> = {
  West: 'M 30,30 L 180,30 L 180,55 L 200,55 L 200,120 L 210,120 L 210,190 L 180,190 L 175,230 L 150,280 L 130,280 L 120,310 L 100,310 L 80,290 L 30,290 Z',
  Midwest: 'M 200,55 L 370,45 L 380,60 L 390,55 L 400,60 L 380,80 L 370,140 L 360,170 L 320,190 L 300,200 L 270,200 L 250,190 L 210,190 L 210,120 L 200,120 Z',
  Southwest: 'M 120,310 L 130,280 L 150,280 L 175,230 L 180,190 L 250,190 L 270,200 L 280,220 L 270,260 L 260,280 L 280,340 L 250,370 L 120,370 Z',
  Southeast: 'M 270,200 L 300,200 L 320,190 L 360,170 L 370,190 L 400,190 L 420,200 L 440,220 L 440,240 L 420,260 L 440,280 L 430,300 L 410,310 L 380,320 L 350,330 L 320,340 L 290,340 L 280,340 L 260,280 L 270,260 L 280,220 Z',
  Northeast: 'M 370,45 L 420,35 L 470,40 L 490,50 L 490,80 L 480,90 L 470,100 L 460,130 L 440,150 L 430,170 L 420,200 L 400,190 L 370,190 L 360,170 L 370,140 L 380,80 L 390,55 L 400,60 L 380,60 Z',
};

const REGION_LABELS: Record<RegionName, [number, number]> = {
  West: [130, 160],
  Midwest: [300, 120],
  Southwest: [190, 290],
  Southeast: [370, 260],
  Northeast: [440, 100],
};

const REGION_COLORS: Record<string, { base: string; hover: string; selected: string }> = {
  high: { base: '#157A6E', hover: '#0f5550', selected: '#157A6E' },
  medHigh: { base: '#2B9B92', hover: '#1d8880', selected: '#2B9B92' },
  medium: { base: '#45AFA6', hover: '#359d94', selected: '#45AFA6' },
  medLow: { base: '#6FC4BC', hover: '#55b5ac', selected: '#6FC4BC' },
  low: { base: '#A8D9D3', hover: '#8fccc5', selected: '#A8D9D3' },
  empty: { base: '#e8e5e1', hover: '#ddd9d4', selected: '#e8e5e1' },
};

const getRegionColor = (data: RegionData | undefined): string => {
  if (!data || data.count === 0) return REGION_COLORS.empty.base;
  if (data.mrr > 300000) return REGION_COLORS.high.base;
  if (data.mrr > 150000) return REGION_COLORS.medHigh.base;
  if (data.mrr > 80000) return REGION_COLORS.medium.base;
  if (data.mrr > 30000) return REGION_COLORS.medLow.base;
  return REGION_COLORS.low.base;
};

const REGIONS: RegionName[] = ['West', 'Midwest', 'Southwest', 'Southeast', 'Northeast'];

export const USAMap: React.FC<USAMapProps> = ({ advisorsByRegion, onRegionClick, selectedRegion }) => {
  const [hoveredRegion, setHoveredRegion] = useState<RegionName | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Territory Map</h3>
        {selectedRegion && (
          <button
            onClick={() => onRegionClick(selectedRegion)}
            className="text-11px text-[#157A6E] hover:underline"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* SVG Map */}
      <div className="relative">
        <svg
          viewBox="0 0 520 390"
          width="100%"
          style={{ maxHeight: '280px' }}
          className="rounded-lg bg-[#f9f7f5]"
          onMouseMove={handleMouseMove}
        >
          {REGIONS.map((region) => {
            const data = advisorsByRegion[region];
            const isSelected = selectedRegion === region;
            const isHovered = hoveredRegion === region;
            const fillColor = getRegionColor(data);

            return (
              <g key={region}>
                <path
                  d={REGION_PATHS[region]}
                  fill={fillColor}
                  stroke={isSelected ? '#157A6E' : '#ffffff'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  onMouseEnter={() => setHoveredRegion(region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => onRegionClick(region)}
                  style={{
                    cursor: 'pointer',
                    opacity: isHovered ? 0.85 : isSelected ? 1 : 0.92,
                    filter: isSelected ? 'drop-shadow(0 0 6px rgba(21,122,110,0.4))' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
                {/* Region label */}
                {data && data.count > 0 && (
                  <>
                    <text
                      x={REGION_LABELS[region][0]}
                      y={REGION_LABELS[region][1] - 8}
                      textAnchor="middle"
                      style={{ fontSize: '11px', fontWeight: 600, fill: data.mrr > 150000 ? '#fff' : '#374151', pointerEvents: 'none' }}
                    >
                      {region}
                    </text>
                    <text
                      x={REGION_LABELS[region][0]}
                      y={REGION_LABELS[region][1] + 8}
                      textAnchor="middle"
                      style={{ fontSize: '10px', fontWeight: 500, fill: data.mrr > 150000 ? 'rgba(255,255,255,0.85)' : '#6B7280', pointerEvents: 'none' }}
                    >
                      {data.count} · {formatMRR(data.mrr)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredRegion && advisorsByRegion[hoveredRegion] && (
          <div
            className="absolute bg-gray-900 text-white text-xs rounded-md px-3 py-2 pointer-events-none z-10 shadow-lg"
            style={{ left: Math.min(mousePos.x + 12, 300), top: mousePos.y - 50 }}
          >
            <div className="font-semibold mb-1">{hoveredRegion}</div>
            <div className="text-gray-300">{advisorsByRegion[hoveredRegion].count} partners</div>
            <div className="text-gray-300">{formatMRR(advisorsByRegion[hoveredRegion].mrr)} MRR</div>
            <div className="text-gray-400 mt-1 text-[10px]">Click to filter</div>
          </div>
        )}
      </div>

      {/* Region legend chips */}
      <div className="flex flex-wrap gap-2 mt-3">
        {REGIONS.map((region) => {
          const data = advisorsByRegion[region];
          if (!data || data.count === 0) return null;
          const isSelected = selectedRegion === region;
          return (
            <button
              key={region}
              onClick={() => onRegionClick(region)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                isSelected
                  ? 'bg-[#157A6E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {region} ({data.count})
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default USAMap;
