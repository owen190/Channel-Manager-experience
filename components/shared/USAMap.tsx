'use client';

import React, { useState, useMemo, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

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

// City lat/lng coordinates for marker placement
const CITY_LATLNG: Record<string, [number, number]> = {
  'Boston, MA': [-71.06, 42.36],
  'New York, NY': [-74.01, 40.71],
  'Miami, FL': [-80.19, 25.76],
  'Atlanta, GA': [-84.39, 33.75],
  'Chicago, IL': [-87.63, 41.88],
  'Dallas, TX': [-96.80, 32.78],
  'Austin, TX': [-97.74, 30.27],
  'Denver, CO': [-104.99, 39.74],
  'Seattle, WA': [-122.33, 47.61],
  'San Francisco, CA': [-122.42, 37.77],
  'San Jose, CA': [-121.89, 37.34],
  'Sunnyvale, CA': [-122.04, 37.37],
  'Los Angeles, CA': [-118.24, 34.05],
  'Phoenix, AZ': [-112.07, 33.45],
  'Portland, OR': [-122.68, 45.52],
  'Minneapolis, MN': [-93.27, 44.98],
  'Detroit, MI': [-83.05, 42.33],
  'Philadelphia, PA': [-75.17, 39.95],
  'Washington, DC': [-77.04, 38.91],
  'Charlotte, NC': [-80.84, 35.23],
  'Nashville, TN': [-86.78, 36.16],
  'Houston, TX': [-95.37, 29.76],
  'St. Louis, MO': [-90.20, 38.63],
  'Kansas City, MO': [-94.58, 39.10],
  'Indianapolis, IN': [-86.16, 39.77],
  'Columbus, OH': [-82.99, 39.96],
  'Salt Lake City, UT': [-111.89, 40.76],
  'Las Vegas, NV': [-115.14, 36.17],
  'Raleigh, NC': [-78.64, 35.78],
  'Tampa, FL': [-82.46, 27.95],
  'Orlando, FL': [-81.38, 28.54],
  'Pittsburgh, PA': [-80.00, 40.44],
  'Cleveland, OH': [-81.69, 41.50],
  'Cincinnati, OH': [-84.51, 39.10],
  'Milwaukee, WI': [-87.91, 43.04],
  'San Antonio, TX': [-98.49, 29.42],
  'San Diego, CA': [-117.16, 32.72],
  'Sacramento, CA': [-121.49, 38.58],
  'Richmond, VA': [-77.44, 37.54],
  'Jacksonville, FL': [-81.66, 30.33],
  'Memphis, TN': [-90.05, 35.15],
  'Louisville, KY': [-85.76, 38.25],
  'Baltimore, MD': [-76.61, 39.29],
  'Oklahoma City, OK': [-97.52, 35.47],
  'Omaha, NE': [-95.93, 41.26],
  'Albuquerque, NM': [-106.65, 35.08],
  'Tucson, AZ': [-110.93, 32.22],
  'New Orleans, LA': [-90.07, 29.95],
  'Boise, ID': [-116.20, 43.62],
};

// Memoize the map background to avoid re-rendering on every state change
const MapBackground = memo(() => (
  <Geographies geography={GEO_URL}>
    {({ geographies }) =>
      geographies.map((geo) => (
        <Geography
          key={geo.rpid || geo.id || geo.properties?.name}
          geography={geo}
          fill="#e8e5e1"
          stroke="#d1cdc8"
          strokeWidth={0.5}
          style={{
            default: { outline: 'none', fill: '#e8e5e1' },
            hover: { outline: 'none', fill: '#ddd9d4' },
            pressed: { outline: 'none' },
          }}
        />
      ))
    }
  </Geographies>
));
MapBackground.displayName = 'MapBackground';

export const USAMap: React.FC<USAMapProps> = ({ advisorsByCity, onCityClick, selectedCity }) => {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  // Get list of cities with data, sorted by MRR
  const cities = useMemo(() => {
    return Object.entries(advisorsByCity)
      .filter(([city]) => CITY_LATLNG[city])
      .sort((a, b) => b[1].mrr - a[1].mrr);
  }, [advisorsByCity]);

  const maxMRR = useMemo(() => Math.max(...cities.map(([, d]) => d.mrr), 1), [cities]);

  const getDotRadius = (count: number): number => {
    if (count >= 5) return 9;
    if (count >= 3) return 7;
    if (count >= 2) return 5.5;
    return 4;
  };

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

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden bg-[#f9f7f5]">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          width={800}
          height={500}
          style={{ width: '100%', height: 'auto' }}
        >
          {/* State boundaries */}
          <MapBackground />

          {/* City markers */}
          {cities.map(([city, data]) => {
            const coords = CITY_LATLNG[city];
            if (!coords) return null;
            const isSelected = selectedCity === city;
            const isHovered = hoveredCity === city;
            const radius = getDotRadius(data.count);

            return (
              <Marker key={city} coordinates={coords}>
                {/* Pulse ring for selected */}
                {isSelected && (
                  <>
                    <circle r={radius + 6} fill="none" stroke="#157A6E" strokeWidth="1.5" opacity="0.2">
                      <animate attributeName="r" from={radius + 4} to={radius + 12} dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle r={radius + 3} fill="none" stroke="#157A6E" strokeWidth="2" opacity="0.35" />
                  </>
                )}
                {/* Main dot */}
                <circle
                  r={isHovered ? radius + 1.5 : radius}
                  fill={getDotColor(data.mrr)}
                  stroke={isSelected ? '#0d5a51' : '#ffffff'}
                  strokeWidth={isSelected ? 2 : 1.2}
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                  onClick={() => onCityClick(city)}
                  style={{
                    cursor: 'pointer',
                    filter: isSelected
                      ? 'drop-shadow(0 0 5px rgba(21,122,110,0.6))'
                      : isHovered
                      ? 'drop-shadow(0 0 3px rgba(21,122,110,0.3))'
                      : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
                {/* Count label */}
                {data.count >= 2 && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    y={0.5}
                    style={{
                      fontSize: radius > 6 ? '7px' : '6px',
                      fontWeight: 700,
                      fill: '#ffffff',
                      pointerEvents: 'none',
                    }}
                  >
                    {data.count}
                  </text>
                )}
              </Marker>
            );
          })}
        </ComposableMap>

        {/* Hover Tooltip - positioned absolutely over the map */}
        {hoveredCity && advisorsByCity[hoveredCity] && (
          <div className="absolute bottom-3 left-3 bg-gray-900 text-white text-xs rounded-md px-3 py-2 pointer-events-none z-10 shadow-lg">
            <div className="font-semibold mb-0.5">{hoveredCity}</div>
            <div className="text-gray-300">{advisorsByCity[hoveredCity].count} partner{advisorsByCity[hoveredCity].count !== 1 ? 's' : ''}</div>
            <div className="text-gray-300">{formatMRR(advisorsByCity[hoveredCity].mrr)} MRR</div>
            <div className="text-gray-400 mt-1 text-[10px]">Click to filter</div>
          </div>
        )}
      </div>

      {/* City chips */}
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
