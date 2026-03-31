'use client';

import { useState, useEffect } from 'react';
import {
  MessageCircle,
  Mic,
  Zap,
  DollarSign,
  Mail,
  Calendar,
  Activity,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface TimelineItem {
  id: string;
  type: 'note' | 'transcript' | 'signal' | 'deal_update' | 'activity';
  timestamp: string;
  title: string;
  description: string;
  source: string;
  icon: string;
}

interface TimelineResponse {
  items?: TimelineItem[];
  total?: number;
  offset?: number;
  limit?: number;
  error?: string;
}

interface ActivityTimelineProps {
  advisorId: string;
}

type FilterType = 'all' | 'notes' | 'calls' | 'signals' | 'deals';

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageCircle: <MessageCircle className="w-4 h-4" />,
  Mic: <Mic className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  DollarSign: <DollarSign className="w-4 h-4" />,
  Mail: <Mail className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
};

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

function groupByDate(items: TimelineItem[]): Record<string, TimelineItem[]> {
  const groups: Record<string, TimelineItem[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Earlier: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  items.forEach((item) => {
    const itemDate = new Date(item.timestamp);
    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    if (itemDateOnly.getTime() === today.getTime()) {
      groups.Today.push(item);
    } else if (itemDateOnly.getTime() === yesterday.getTime()) {
      groups.Yesterday.push(item);
    } else if (itemDateOnly.getTime() > weekAgo.getTime()) {
      groups['This Week'].push(item);
    } else {
      groups.Earlier.push(item);
    }
  });

  return groups;
}

export function ActivityTimeline({ advisorId }: ActivityTimelineProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [offset, setOffset] = useState(0);
  const limit = 30;

  useEffect(() => {
    fetchTimeline();
  }, [advisorId, offset]);

  useEffect(() => {
    filterItems();
  }, [items, activeFilter]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/live/timeline?advisorId=${advisorId}&offset=${offset}&limit=${limit}`);
      const data: TimelineResponse = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load timeline');
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;
    if (activeFilter !== 'all') {
      const typeMap: Record<FilterType, string[]> = {
        all: [],
        notes: ['note'],
        calls: ['transcript'],
        signals: ['signal'],
        deals: ['deal_update'],
      };
      filtered = items.filter((item) => typeMap[activeFilter].includes(item.type));
    }
    setFilteredItems(filtered);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-tcs-teal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-600">No activity found</p>
      </div>
    );
  }

  const grouped = groupByDate(filteredItems);

  return (
    <div className="space-y-4">
      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap pb-4 border-b border-tcs-border">
        {(['all', 'notes', 'calls', 'signals', 'deals'] as FilterType[]).map((filter) => (
          <button
            key={filter}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setActiveFilter(filter);
              setOffset(0);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-tcs-teal text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([dateGroup, groupItems]) => {
          if (groupItems.length === 0) return null;
          return (
            <div key={dateGroup}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                {dateGroup}
              </h3>
              <div className="space-y-2">
                {groupItems.map((item) => {
                  const isExpanded = expandedItems.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="border border-tcs-border rounded-lg p-3 hover:bg-tcs-bg transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-tcs-teal mt-0.5">
                          {ICON_MAP[item.icon] || <Activity className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {item.title}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatTimeAgo(item.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {item.source}
                            </span>
                            {item.description.length > 100 && (
                              <button
                                onClick={() => toggleExpanded(item.id)}
                                className="text-xs text-tcs-teal hover:underline flex items-center gap-1"
                              >
                                {isExpanded ? (
                                  <>
                                    Show less
                                    <ChevronDown className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    Show more
                                    <ChevronRight className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          {isExpanded && (
                            <p className="text-xs text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {offset + limit < items.length && (
        <div className="pt-4 text-center">
          <button
            onClick={() => setOffset(offset + limit)}
            className="px-4 py-2 border border-tcs-border rounded-lg text-sm font-medium text-tcs-teal hover:bg-tcs-bg transition-colors"
          >
            Load more activity
          </button>
        </div>
      )}
    </div>
  );
}
