'use client';

import React, { useState, useMemo } from 'react';

interface CityData {
  city: string;
  state: string;
  count: number;
  mrr: number;
  advisors: Array<{ id: string; name: string; mrr: number }>;
}

interface USAMapProps {
  advisorsByCity: Record<string, CityData>;
  onCityClick: (city: string) => void;
  selectedCity: string | null;
}

const formatMRR = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value}`;
};

// Approximate lat/lng to SVG coordinates for a 520x340 viewBox
// Covering continental US roughly: lng -125 to -67, lat 24 to 50
const CITY_COORDS: Record<string, [number, number]> = {
  'Boston, MA': [468, 72],
  'New York, NY': [452, 92],
  'Miami, FL': [430, 290],
  'Atlanta, GA': [380, 220],
  'Chicago, IL': [320, 100],
  'Dallas, TX': [265, 230],
  'Austin, TX': [255, 250],
  'Denver, CO': [195, 135],
  'Seattle, WA': [80, 35],
  'San Francisco, CA': [55, 120],
  'San Jose, CA': [55, 130],
  'Sunnyvale, CA': [52, 128],
  'Los Angeles, CA': [65, 185],
  'Phoenix, AZ': [130, 210],
  'Portland, OR': [75, 60],
  'Minneapolis, MN': [285, 65],
  'Detroit, MI': [360, 95],
  'Philadelphia, PA': [445, 105],
  'Washington, DC': [430, 125],
  'Charlotte, NC': [405, 190],
  'Nashville, TN': [360, 185],
  'Houston, TX': [275, 265],
  'St. Louis, MO': [315, 155],
  'Kansas City, MO': [285, 145],
  'Indianapolis, IN': [340, 130],
  'Columbus, OH': [365, 125],
  'Salt Lake City, UT': [150, 115],
  'Las Vegas, NV': [110, 170],
  'Raleigh, NC': [420, 180],
  'Tampa, FL': [400, 275],
  'Orlando, FL': [410, 265],
  'Pittsburgh, PA': [395, 110],
  'Cleveland, OH': [365, 105],
  'Cincinnati, OH': [355, 140],
  'Milwaukee, WI': [310, 85],
  'San Antonio, TX': [245, 260],
  'San Diego, CA': [75, 200],
  'Sacramento, CA': [55, 105],
  'Richmond, VA': [420, 150],
  'Jacksonville, FL': [405, 245],
  'Memphis, TN': [325, 195],
  'Louisville, KY': [350, 155],
  'Baltimore, MD': [435, 120],
  'Oklahoma City, OK': [260, 195],
  'Omaha, NE': [265, 115],
  'Albuquerque, NM': [170, 195],
  'Tucson, AZ': [135, 225],
  'New Orleans, LA': [330, 260],
  'Boise, ID': [120, 70],
};

// Simplified USA continental outline path
const USA_OUTLINE = 'M 30,55 L 50,50 L 60,30 L 80,25 L 95,30 L 80,50 L 72,80 L 55,95 L 48,115 L 50,135 L 60,160 L 65,185 L 75,205 L 60,210 L 55,220 L 80,225 L 100,235 L 130,240 L 145,235 L 165,225 L 185,220 L 195,225 L 210,240 L 225,260 L 245,275 L 270,280 L 295,270 L 310,265 L 325,270 L 340,275 L 355,278 L 370,275 L 385,260 L 395,250 L 405,260 L 415,270 L 425,280 L 435,295 L 430,300 L 415,290 L 400,285 L 395,275 L 385,280 L 370,285 L 360,290 L 350,285 L 335,280 L 320,275 L 305,270 L 290,275 L 325,265 L 340,260 L 360,250 L 380,245 L 395,240 L 410,250 L 420,255 L 425,260 L 430,275 L 435,290 L 440,280 L 445,260 L 450,240 L 455,225 L 460,200 L 458,175 L 460,155 L 455,135 L 460,120 L 465,105 L 460,100 L 470,90 L 478,80 L 485,75 L 490,65 L 485,55 L 475,50 L 465,45 L 458,50 L 452,55 L 445,58 L 440,60 L 435,65 L 430,70 L 428,80 L 430,85 L 435,95 L 440,100 L 445,105 L 447,115 L 442,120 L 435,125 L 430,130 L 425,140 L 420,150 L 415,160 L 408,170 L 400,180 L 395,185 L 385,195 L 375,200 L 370,210 L 365,220 L 360,225 L 355,230 L 350,232 L 340,230 L 330,225 L 320,220 L 310,215 L 305,205 L 300,195 L 295,185 L 290,170 L 285,155 L 280,140 L 275,125 L 270,110 L 265,100 L 255,90 L 245,80 L 235,70 L 220,65 L 200,60 L 185,55 L 170,50 L 155,48 L 140,50 L 125,55 L 110,55 L 95,55 L 80,55 L 60,55 L 45,55 Z';

// Simpler, cleaner USA outline
const USA_PATH = `M 35,52 C 35,52 50,48 60,30 C 65,22 80,22 95,28 C 95,28 85,45 75,70
  C 65,95 52,110 50,130 C 48,150 58,170 68,195 C 73,207 78,215 65,218
  C 55,220 80,230 115,238 C 150,246 175,230 200,228 C 220,245 240,265 265,278
  C 290,278 310,268 330,272 C 350,276 370,278 385,265
  C 395,255 405,260 420,275 C 430,285 438,298 440,290
  C 445,268 452,240 458,210 C 462,185 460,160 458,140
  C 460,120 468,100 480,80 C 488,68 492,58 485,52
  C 478,46 465,42 455,50 C 445,56 435,62 430,72
  C 425,82 432,92 440,105 C 445,112 442,122 435,130
  C 425,142 415,158 405,175 C 395,188 380,200 370,215
  C 360,228 345,232 330,225 C 315,218 300,200 290,175
  C 280,150 270,120 260,100 C 250,80 235,68 215,62
  C 195,55 170,48 145,50 C 120,52 95,55 60,55 Z`;

export const USAMap: React.FC<USAMapProps> = ({ advisorsByCity, onCityClick, selectedCity }) => {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Get list of cities with data, sorted by MRR
  const cities = useMemo(() => {
    return Object.entries(advisorsByCity)
      .filter(([city]) => CITY_COORDS[city]) // only plot known cities
      .sort((a, b) => b[1].mrr - a[1].mrr);
  }, [advisorsByCity]);

  const maxMRR = useMemo(() => Math.max(...cities.map(([, d]) => d.mrr), 1), [cities]);

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Determine dot radius based on partner count
  const getDotRadius = (count: number): number => {
    if (count >= 5) return 10;
    if (count >= 3) return 8;
    if (count >= 2) return 6.5;
    return 5;
  };

  // Color intensity based on MRR
  const getDotColor = (mrr: number): string => {
    const ratio = mrr / maxMRR;
    if (ratio > 0.7) return '#157A6E';
    if (ratio > 0.4) return '#2B9B92';
    if (ratio > 0.2) return '#45AFA6';
    return '#6FC4BC';
  };

  return (
    <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">Territory Map</h3>
        <div className="flex items-center gap-3">
          {selectedCity && (
            <button
              onClick={() => onCityClick(selectedCity)}
              className="text-[11px] text-[#157A6E] hover:underline"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mb-3 flex items-center gap-1">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M16 8a6 6 0 0 1-12 0 6 6 0 0 1 12 0Z" /><path d="M2 21c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6" />
        </svg>
        Location via LinkedIn profiles
      </p>

      {/* SVG Map */}
      <div className="relative">
        <svg
          viewBox="0 0 520 320"
          width="100%"
          style={{ maxHeight: '280px' }}
          className="rounded-lg bg-[#f9f7f5]"
          onMouseMove={handleMouseMove}
        >
          {/* US outline fill */}
          <path
            d={USA_PATH}
            fill="#e8e5e1"
            stroke="#d1cdc8"
            strokeWidth="1"
            opacity="0.6"
          />

          {/* City dots */}
          {cities.map(([city, data]) => {
            const coords = CITY_COORDS[city];
            if (!coords) return null;
            const isSelected = selectedCity === city;
            const isHovered = hoveredCity === city;
            const radius = getDotRadius(data.count);

            return (
              <g key={city}>
                {/* Glow for selected */}
                {isSelected && (
                  <circle
                    cx={coords[0]}
                    cy={coords[1]}
                    r={radius + 5}
                    fill="none"
                    stroke="#157A6E"
                    strokeWidth="2"
                    opacity="0.3"
                  >
                    <animate attributeName="r" from={radius + 3} to={radius + 8} dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Main dot */}
                <circle
                  cx={coords[0]}
                  cy={coords[1]}
                  r={isHovered ? radius + 2 : radius}
                  fill={getDotColor(data.mrr)}
                  stroke={isSelected ? '#157A6E' : '#ffffff'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                  onClick={() => onCityClick(city)}
                  style={{
                    cursor: 'pointer',
                    filter: isSelected ? 'drop-shadow(0 0 4px rgba(21,122,110,0.5))' : isHovered ? 'drop-shadow(0 0 3px rgba(21,122,110,0.3))' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
                {/* Count label for dots with 2+ partners */}
                {data.count >= 2 && (
                  <text
                    x={coords[0]}
                    y={coords[1] + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: radius > 7 ? '8px' : '7px',
                      fontWeight: 700,
                      fill: '#ffffff',
                      pointerEvents: 'none',
                    }}
                  >
                    {data.count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredCity && advisorsByCity[hoveredCity] && (
          <div
            className="absolute bg-gray-900 text-white text-xs rounded-md px-3 py-2 pointer-events-none z-10 shadow-lg"
            style={{
              left: Math.min(Math.max(mousePos.x + 12, 10), 350),
              top: Math.max(mousePos.y - 60, 5),
            }}
          >
            <div className="font-semibold mb-1">{hoveredCity}</div>
            <div className="text-gray-300">{advisorsByCity[hoveredCity].count} partner{advisorsByCity[hoveredCity].count !== 1 ? 's' : ''}</div>
            <div className="text-gray-300">{formatMRR(advisorsByCity[hoveredCity].mrr)} MRR</div>
            <div className="text-gray-400 mt-1 text-[10px]">Click to filter</div>
          </div>
        )}
      </div>

      {/* City chips - top cities */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {cities.slice(0, 10).map(([city, data]) => {
          const isSelected = selectedCity === city;
          return (
            <button
              key={city}
              onClick={() => onCityClick(city)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                isSelected
                  ? 'bg-[#157A6E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {city.split(',')[0]} ({data.count})
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default USAMap;
