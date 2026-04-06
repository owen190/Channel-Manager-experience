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

interface HeatData {
  /** Score from 0-1 where 1 = best performance */
  score: number;
  partners: number;
  mrr: number;
  pipeline: number;
  deals: number;
}

interface USAMapProps {
  advisorsByCity: Record<string, CityData>;
  onCityClick: (city: string) => void;
  selectedCity: string | null;
  /** If true, show state-level markers for all 50 states */
  showAllStates?: boolean;
  /** Optional: state-level aggregated data */
  stateData?: Record<string, { partners: number; mrr: number; pipeline: number; deals: number }>;
  /** Called when a state marker is clicked */
  onStateClick?: (stateAbbr: string) => void;
  selectedState?: string | null;
  /** Weather-map style heat map mode — colors state fills by performance */
  heatMode?: boolean;
  /** Per-state heat data for coloring (keyed by state abbreviation) */
  heatData?: Record<string, HeatData>;
  /** Title override */
  title?: string;
  /** Subtitle override */
  subtitle?: string;
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

// State capital/center coordinates for state-level markers (all 50 states + DC)
const STATE_CENTERS: Record<string, { coords: [number, number]; name: string }> = {
  AL: { coords: [-86.79, 32.81], name: 'Alabama' },
  AK: { coords: [-152.49, 63.59], name: 'Alaska' },
  AZ: { coords: [-111.66, 34.17], name: 'Arizona' },
  AR: { coords: [-92.37, 34.97], name: 'Arkansas' },
  CA: { coords: [-119.68, 36.78], name: 'California' },
  CO: { coords: [-105.55, 39.06], name: 'Colorado' },
  CT: { coords: [-72.76, 41.60], name: 'Connecticut' },
  DE: { coords: [-75.51, 39.16], name: 'Delaware' },
  FL: { coords: [-81.69, 28.12], name: 'Florida' },
  GA: { coords: [-83.44, 32.68], name: 'Georgia' },
  HI: { coords: [-157.50, 21.09], name: 'Hawaii' },
  ID: { coords: [-114.74, 44.24], name: 'Idaho' },
  IL: { coords: [-89.20, 40.35], name: 'Illinois' },
  IN: { coords: [-86.26, 40.27], name: 'Indiana' },
  IA: { coords: [-93.50, 42.01], name: 'Iowa' },
  KS: { coords: [-98.32, 38.53], name: 'Kansas' },
  KY: { coords: [-84.67, 37.67], name: 'Kentucky' },
  LA: { coords: [-91.87, 31.17], name: 'Louisiana' },
  ME: { coords: [-69.38, 45.37], name: 'Maine' },
  MD: { coords: [-76.64, 39.05], name: 'Maryland' },
  MA: { coords: [-71.53, 42.23], name: 'Massachusetts' },
  MI: { coords: [-84.54, 44.35], name: 'Michigan' },
  MN: { coords: [-94.64, 46.28], name: 'Minnesota' },
  MS: { coords: [-89.68, 32.74], name: 'Mississippi' },
  MO: { coords: [-92.29, 38.46], name: 'Missouri' },
  MT: { coords: [-109.64, 46.68], name: 'Montana' },
  NE: { coords: [-99.69, 41.49], name: 'Nebraska' },
  NV: { coords: [-116.42, 38.31], name: 'Nevada' },
  NH: { coords: [-71.58, 43.68], name: 'New Hampshire' },
  NJ: { coords: [-74.41, 40.31], name: 'New Jersey' },
  NM: { coords: [-106.25, 34.84], name: 'New Mexico' },
  NY: { coords: [-75.51, 42.93], name: 'New York' },
  NC: { coords: [-79.81, 35.63], name: 'North Carolina' },
  ND: { coords: [-100.47, 47.53], name: 'North Dakota' },
  OH: { coords: [-82.80, 40.39], name: 'Ohio' },
  OK: { coords: [-97.51, 35.57], name: 'Oklahoma' },
  OR: { coords: [-120.55, 43.94], name: 'Oregon' },
  PA: { coords: [-77.21, 40.88], name: 'Pennsylvania' },
  RI: { coords: [-71.53, 41.68], name: 'Rhode Island' },
  SC: { coords: [-80.95, 33.86], name: 'South Carolina' },
  SD: { coords: [-99.44, 44.30], name: 'South Dakota' },
  TN: { coords: [-86.58, 35.75], name: 'Tennessee' },
  TX: { coords: [-99.33, 31.17], name: 'Texas' },
  UT: { coords: [-111.59, 39.32], name: 'Utah' },
  VT: { coords: [-72.58, 44.07], name: 'Vermont' },
  VA: { coords: [-78.17, 37.77], name: 'Virginia' },
  WA: { coords: [-120.74, 47.38], name: 'Washington' },
  WV: { coords: [-80.61, 38.64], name: 'West Virginia' },
  WI: { coords: [-89.62, 44.27], name: 'Wisconsin' },
  WY: { coords: [-107.55, 43.00], name: 'Wyoming' },
  DC: { coords: [-77.01, 38.91], name: 'District of Columbia' },
};

// State name to abbreviation mapping for TopoJSON
const STATE_NAME_TO_ABBR: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  'District of Columbia': 'DC',
};

// Weather-map style heat color interpolation
// 0 = no data (gray), then gradient: blue → green → yellow → orange → red for intensity
const getHeatColor = (score: number, hasData: boolean): string => {
  if (!hasData) return '#e8e5e1';
  // Score 0-1, map through a warm gradient like a weather forecast
  if (score >= 0.85) return '#157A6E';  // Deep teal (excellent)
  if (score >= 0.7) return '#22A699';   // Teal-green
  if (score >= 0.55) return '#4CC9A0';  // Green
  if (score >= 0.4) return '#8BD87A';   // Light green
  if (score >= 0.3) return '#C5E063';   // Yellow-green
  if (score >= 0.2) return '#F3D44E';   // Yellow
  if (score >= 0.1) return '#F5A623';   // Orange
  return '#EF4444';                     // Red (poor)
};

// Memoize the map background to avoid re-rendering on every state change
const MapBackground = memo(({ solidOutline }: { solidOutline?: boolean }) => (
  <Geographies geography={GEO_URL}>
    {({ geographies }) =>
      geographies.map((geo) => (
        <Geography
          key={geo.rpid || geo.id || geo.properties?.name}
          geography={geo}
          fill={solidOutline ? '#e8e5e1' : '#e8e5e1'}
          stroke={solidOutline ? '#999' : '#d1cdc8'}
          strokeWidth={solidOutline ? 1 : 0.5}
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

// Heat map colored state fills
const HeatMapGeographies = memo(({
  heatData,
  onStateClick,
  selectedState,
  onHover,
}: {
  heatData: Record<string, HeatData>;
  onStateClick?: (abbr: string) => void;
  selectedState?: string | null;
  onHover: (abbr: string | null) => void;
}) => (
  <Geographies geography={GEO_URL}>
    {({ geographies }) =>
      geographies.map((geo) => {
        const stateName = geo.properties?.name;
        const abbr = STATE_NAME_TO_ABBR[stateName] || '';
        const data = heatData[abbr];
        const hasData = !!data && data.partners > 0;
        const fillColor = getHeatColor(data?.score || 0, hasData);
        const isSelected = selectedState === abbr;

        return (
          <Geography
            key={geo.rpid || geo.id || stateName}
            geography={geo}
            fill={fillColor}
            stroke={isSelected ? '#0d5a51' : '#ffffff'}
            strokeWidth={isSelected ? 2 : 0.8}
            onClick={() => abbr && onStateClick?.(abbr)}
            onMouseEnter={() => onHover(abbr)}
            onMouseLeave={() => onHover(null)}
            style={{
              default: {
                outline: 'none',
                fill: fillColor,
                filter: isSelected ? 'brightness(0.85) drop-shadow(0 0 4px rgba(21,122,110,0.5))' : 'none',
                transition: 'all 0.2s ease',
              },
              hover: {
                outline: 'none',
                fill: fillColor,
                filter: 'brightness(0.9)',
                cursor: hasData ? 'pointer' : 'default',
              },
              pressed: { outline: 'none' },
            }}
          />
        );
      })
    }
  </Geographies>
));
HeatMapGeographies.displayName = 'HeatMapGeographies';

export const USAMap: React.FC<USAMapProps> = ({
  advisorsByCity,
  onCityClick,
  selectedCity,
  showAllStates = false,
  stateData,
  onStateClick,
  selectedState,
  heatMode = false,
  heatData,
  title,
  subtitle,
}) => {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

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

  const getStateMarkerColor = (stateAbbr: string): string => {
    if (!stateData || !stateData[stateAbbr]) return '#c4c0bb';
    const data = stateData[stateAbbr];
    if (data.partners === 0) return '#c4c0bb';
    if (data.mrr >= 10000) return '#157A6E';
    if (data.mrr >= 5000) return '#2B9B92';
    if (data.mrr >= 1000) return '#45AFA6';
    return '#6FC4BC';
  };

  const getStateMarkerRadius = (stateAbbr: string): number => {
    if (!stateData || !stateData[stateAbbr]) return 3;
    const partners = stateData[stateAbbr].partners;
    if (partners >= 5) return 8;
    if (partners >= 3) return 6;
    if (partners >= 1) return 4.5;
    return 3;
  };

  return (
    <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold font-['Newsreader'] text-gray-800">{title || (heatMode ? 'Performance Heat Map' : 'Territory Map')}</h3>
        <div className="flex items-center gap-3">
          {selectedCity && !heatMode && (
            <button
              onClick={() => onCityClick(selectedCity)}
              className="text-[11px] text-[#157A6E] hover:underline"
            >
              Clear selection
            </button>
          )}
          {selectedState && onStateClick && (
            <button
              onClick={() => onStateClick(selectedState)}
              className="text-[11px] text-[#157A6E] hover:underline"
            >
              Clear state filter
            </button>
          )}
        </div>
      </div>
      {/* Heat map legend bar */}
      {heatMode && (
        <div className="mb-3">
          <p className="text-[10px] text-gray-400 mb-2">{subtitle || 'Partner performance by state · Click a state for details'}</p>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-400 mr-1">Low</span>
            {['#EF4444', '#F5A623', '#F3D44E', '#C5E063', '#8BD87A', '#4CC9A0', '#22A699', '#157A6E'].map((c, i) => (
              <div key={i} className="h-3 flex-1 first:rounded-l last:rounded-r" style={{ backgroundColor: c }} />
            ))}
            <span className="text-[9px] text-gray-400 ml-1">High</span>
            <span className="text-[9px] text-gray-300 ml-3">|</span>
            <div className="w-3 h-3 rounded-sm ml-1" style={{ backgroundColor: '#e8e5e1' }} />
            <span className="text-[9px] text-gray-400 ml-1">No data</span>
          </div>
        </div>
      )}
      {!heatMode && (
        <p className="text-[10px] text-gray-400 mb-3 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M16 8a6 6 0 0 1-12 0 6 6 0 0 1 12 0Z" /><path d="M2 21c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6" />
          </svg>
          {showAllStates ? 'All 50 states · Click a state for details' : 'Location via LinkedIn profiles'}
        </p>
      )}

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden bg-[#f9f7f5]">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          width={800}
          height={500}
          style={{ width: '100%', height: 'auto' }}
        >
          {/* Heat mode: colored state fills */}
          {heatMode && heatData && (
            <HeatMapGeographies
              heatData={heatData}
              onStateClick={onStateClick}
              selectedState={selectedState}
              onHover={setHoveredState}
            />
          )}

          {/* Normal mode: State boundaries with solid outline */}
          {!heatMode && <MapBackground solidOutline={showAllStates} />}

          {/* State-level markers (all 50 states) */}
          {showAllStates && Object.entries(STATE_CENTERS).map(([abbr, { coords, name }]) => {
            if (abbr === 'AK' || abbr === 'HI') return null; // Skip non-contiguous for AlbersUSA
            const isSelected = selectedState === abbr;
            const isHovered = hoveredState === abbr;
            const radius = getStateMarkerRadius(abbr);
            const color = getStateMarkerColor(abbr);
            const hasData = stateData && stateData[abbr] && stateData[abbr].partners > 0;

            return (
              <Marker key={abbr} coordinates={coords}>
                {isSelected && (
                  <>
                    <circle r={radius + 6} fill="none" stroke="#157A6E" strokeWidth="1.5" opacity="0.2">
                      <animate attributeName="r" from={radius + 4} to={radius + 12} dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle r={radius + 3} fill="none" stroke="#157A6E" strokeWidth="2" opacity="0.35" />
                  </>
                )}
                <circle
                  r={isHovered ? radius + 1.5 : radius}
                  fill={color}
                  stroke={isSelected ? '#0d5a51' : hasData ? '#ffffff' : '#d1cdc8'}
                  strokeWidth={isSelected ? 2 : hasData ? 1.2 : 0.5}
                  onMouseEnter={() => setHoveredState(abbr)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => onStateClick?.(abbr)}
                  style={{
                    cursor: 'pointer',
                    filter: isSelected
                      ? 'drop-shadow(0 0 5px rgba(21,122,110,0.6))'
                      : isHovered && hasData
                      ? 'drop-shadow(0 0 3px rgba(21,122,110,0.3))'
                      : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  y={0.5}
                  style={{
                    fontSize: '6px',
                    fontWeight: 700,
                    fill: hasData ? '#ffffff' : '#999',
                    pointerEvents: 'none',
                  }}
                >
                  {abbr}
                </text>
              </Marker>
            );
          })}

          {/* City markers (original behavior) */}
          {!showAllStates && cities.map(([city, data]) => {
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

        {/* Hover Tooltip for cities */}
        {hoveredCity && advisorsByCity[hoveredCity] && !showAllStates && (
          <div className="absolute bottom-3 left-3 bg-gray-900 text-white text-xs rounded-md px-3 py-2 pointer-events-none z-10 shadow-lg">
            <div className="font-semibold mb-0.5">{hoveredCity}</div>
            <div className="text-gray-300">{advisorsByCity[hoveredCity].count} partner{advisorsByCity[hoveredCity].count !== 1 ? 's' : ''}</div>
            <div className="text-gray-300">{formatMRR(advisorsByCity[hoveredCity].mrr)} MRR</div>
            <div className="text-gray-400 mt-1 text-[10px]">Click to filter</div>
          </div>
        )}

        {/* Hover Tooltip for states (heat mode) */}
        {hoveredState && heatMode && heatData && (
          <div className="absolute bottom-3 left-3 bg-gray-900 text-white text-xs rounded-md px-3 py-2 pointer-events-none z-10 shadow-lg">
            <div className="font-semibold mb-0.5">{STATE_CENTERS[hoveredState]?.name || hoveredState}</div>
            {heatData[hoveredState] && heatData[hoveredState].partners > 0 ? (
              <>
                <div className="text-gray-300">{heatData[hoveredState].partners} partner{heatData[hoveredState].partners !== 1 ? 's' : ''}</div>
                <div className="text-gray-300">{formatMRR(heatData[hoveredState].mrr)} MRR</div>
                <div className="text-gray-300">{formatMRR(heatData[hoveredState].pipeline)} pipeline</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-gray-400">Performance:</span>
                  <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(heatData[hoveredState].score * 100)}%`, backgroundColor: getHeatColor(heatData[hoveredState].score, true) }} />
                  </div>
                  <span className="text-gray-300 font-bold">{Math.round(heatData[hoveredState].score * 100)}%</span>
                </div>
              </>
            ) : (
              <div className="text-gray-400">No partners</div>
            )}
            <div className="text-gray-400 mt-1 text-[10px]">Click for details</div>
          </div>
        )}

        {/* Hover Tooltip for states (normal mode) */}
        {hoveredState && showAllStates && !heatMode && (
          <div className="absolute bottom-3 left-3 bg-gray-900 text-white text-xs rounded-md px-3 py-2 pointer-events-none z-10 shadow-lg">
            <div className="font-semibold mb-0.5">{STATE_CENTERS[hoveredState]?.name || hoveredState}</div>
            {stateData && stateData[hoveredState] ? (
              <>
                <div className="text-gray-300">{stateData[hoveredState].partners} partner{stateData[hoveredState].partners !== 1 ? 's' : ''}</div>
                <div className="text-gray-300">{formatMRR(stateData[hoveredState].mrr)} MRR</div>
                <div className="text-gray-300">{formatMRR(stateData[hoveredState].pipeline)} pipeline</div>
              </>
            ) : (
              <div className="text-gray-400">No partners</div>
            )}
            <div className="text-gray-400 mt-1 text-[10px]">Click for details</div>
          </div>
        )}
      </div>

      {/* City chips (only for city mode) */}
      {!showAllStates && (
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
      )}
    </div>
  );
};

export default USAMap;
