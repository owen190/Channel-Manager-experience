'use client';

import { useState, useMemo } from 'react';
import { Advisor, PulseState, FrictionLevel, PartnerTier } from '@/lib/types';
import { PulseBadge } from './PulseBadge';
import { TrajectoryBadge } from './TrajectoryBadge';
import { SentimentBadge } from './SentimentBadge';
import { FrictionBadge } from './FrictionBadge';
import { TierBadge } from './TierBadge';

interface AdvisorTableProps {
  advisors: Advisor[];
  onAdvisorClick: (id: string) => void;
}

type SortField =
  | 'name'
  | 'pulse'
  | 'trajectory'
  | 'tone'
  | 'friction'
  | 'tier'
  | 'mrr'
  | 'lastContact';

export function AdvisorTable({ advisors, onAdvisorClick }: AdvisorTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pulseFilter, setPulseFilter] = useState<PulseState | 'all'>('all');
  const [frictionFilter, setFrictionFilter] = useState<FrictionLevel | 'all'>(
    'all'
  );
  const [tierFilter, setTierFilter] = useState<PartnerTier | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const pulseStates: PulseState[] = [
    'Strong',
    'Steady',
    'Rising',
    'Fading',
    'Flatline',
  ];
  const frictionLevels: FrictionLevel[] = [
    'Low',
    'Moderate',
    'High',
    'Critical',
  ];
  const tiers: PartnerTier[] = ['anchor', 'scaling', 'building', 'launching'];

  const filteredAndSorted = useMemo(() => {
    let result = advisors.filter((advisor) => {
      const matchesSearch =
        advisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        advisor.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPulse = pulseFilter === 'all' || advisor.pulse === pulseFilter;
      const matchesFriction =
        frictionFilter === 'all' || advisor.friction === frictionFilter;
      const matchesTier = tierFilter === 'all' || advisor.tier === tierFilter;

      return matchesSearch && matchesPulse && matchesFriction && matchesTier;
    });

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'pulse':
          aVal = a.pulse;
          bVal = b.pulse;
          break;
        case 'trajectory':
          aVal = a.trajectory;
          bVal = b.trajectory;
          break;
        case 'tone':
          aVal = a.tone;
          bVal = b.tone;
          break;
        case 'friction':
          aVal = a.friction;
          bVal = b.friction;
          break;
        case 'tier':
          aVal = a.tier;
          bVal = b.tier;
          break;
        case 'mrr':
          aVal = a.mrr;
          bVal = b.mrr;
          break;
        case 'lastContact':
          aVal = a.lastContact;
          bVal = b.lastContact;
          break;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [advisors, searchTerm, pulseFilter, frictionFilter, tierFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-lg p-4 border border-tcs-border space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search advisors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-tcs-border rounded-lg focus:outline-none focus:border-tcs-teal"
            />
          </div>

          <select
            value={pulseFilter}
            onChange={(e) => setPulseFilter(e.target.value as PulseState | 'all')}
            className="px-4 py-2 border border-tcs-border rounded-lg focus:outline-none focus:border-tcs-teal bg-white"
          >
            <option value="all">All Pulses</option>
            {pulseStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          <select
            value={frictionFilter}
            onChange={(e) =>
              setFrictionFilter(e.target.value as FrictionLevel | 'all')
            }
            className="px-4 py-2 border border-tcs-border rounded-lg focus:outline-none focus:border-tcs-teal bg-white"
          >
            <option value="all">All Friction</option>
            {frictionLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as PartnerTier | 'all')}
            className="px-4 py-2 border border-tcs-border rounded-lg focus:outline-none focus:border-tcs-teal bg-white"
          >
            <option value="all">All Tiers</option>
            {tiers.map((tier) => (
              <option key={tier} value={tier}>
                {tier === 'anchor' ? 'ANCHOR' : tier === 'scaling' ? 'SCALING' : tier === 'building' ? 'BUILDING' : 'LAUNCHING'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-tcs-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-tcs-bg border-b border-tcs-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}>
                  Advisor {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('pulse')}>
                  Pulse {sortField === 'pulse' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('trajectory')}>
                  Trajectory {sortField === 'trajectory' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('tone')}>
                  Tone {sortField === 'tone' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('friction')}>
                  Friction {sortField === 'friction' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('tier')}>
                  Tier {sortField === 'tier' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('mrr')}>
                  MRR {sortField === 'mrr' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => handleSort('lastContact')}>
                  Last C... {sortField === 'lastContact' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tcs-border">
              {filteredAndSorted.map((advisor) => (
                <tr
                  key={advisor.id}
                  className="hover:bg-tcs-bg cursor-pointer transition-colors"
                  onClick={() => onAdvisorClick(advisor.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <TierBadge tier={advisor.tier} />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {advisor.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {advisor.title} · {advisor.company}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <PulseBadge pulse={advisor.pulse} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <TrajectoryBadge trajectory={advisor.trajectory} />
                  </td>
                  <td className="px-6 py-4">
                    <SentimentBadge tone={advisor.tone} />
                  </td>
                  <td className="px-6 py-4">
                    <FrictionBadge level={advisor.friction} />
                  </td>
                  <td className="px-6 py-4">
                    <TierBadge tier={advisor.tier} />
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    ${(advisor.mrr / 1000).toFixed(1)}K
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {advisor.lastContact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
