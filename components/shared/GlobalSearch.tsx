'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Loader2,
  Users,
  DollarSign,
  FileText,
  Mic,
  Zap,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'advisor' | 'deal' | 'note' | 'transcript' | 'signal';
  title: string;
  subtitle: string;
  description: string;
}

interface SearchResponse {
  advisors: SearchResult[];
  deals: SearchResult[];
  notes: SearchResult[];
  transcripts: SearchResult[];
  signals: SearchResult[];
  total: number;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  advisor: <Users className="w-4 h-4" />,
  deal: <DollarSign className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
  transcript: <Mic className="w-4 h-4" />,
  signal: <Zap className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  advisors: 'Advisors',
  deals: 'Deals',
  notes: 'Notes',
  transcripts: 'Calls',
  signals: 'Signals',
};

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('globalSearchRecent');
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored).slice(0, 5));
        } catch {
          // ignore
        }
      }
      inputRef.current?.focus();
    }
    setQuery('');
    setSelectedIndex(-1);
  }, [isOpen]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // This would be handled by parent, but we can set focus here
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle search
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (query.length < 2) {
        setResults(null);
        return;
      }
      performSearch();
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/live/search?q=${encodeURIComponent(query)}`);
      const data: SearchResponse = await res.json();
      if (res.ok) {
        setResults(data);
        setSelectedIndex(-1);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAllResults = (): Array<SearchResult & { category: string }> => {
    if (!results) return [];
    const all: Array<SearchResult & { category: string }> = [];
    results.advisors.forEach((r) => all.push({ ...r, category: 'advisors' }));
    results.deals.forEach((r) => all.push({ ...r, category: 'deals' }));
    results.notes.forEach((r) => all.push({ ...r, category: 'notes' }));
    results.transcripts.forEach((r) => all.push({ ...r, category: 'transcripts' }));
    results.signals.forEach((r) => all.push({ ...r, category: 'signals' }));
    return all;
  };

  const handleNavigate = (result: SearchResult & { category: string }) => {
    // Save to recent searches
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('globalSearchRecent', JSON.stringify(updated));

    // Navigate based on type
    if (result.type === 'advisor') {
      router.push(`/live?advisorId=${result.id}`);
    } else if (result.type === 'deal') {
      router.push(`/live?dealId=${result.id}`);
    } else if (result.type === 'note') {
      router.push(`/live?noteId=${result.id}`);
    } else if (result.type === 'transcript') {
      router.push(`/live?transcriptId=${result.id}`);
    }

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allResults = getAllResults();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i < allResults.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : allResults.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleNavigate(allResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const allResults = getAllResults();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-[80px] z-50 flex justify-center">
        <div className="w-full max-w-[600px] mx-4 bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="border-b border-tcs-border px-4 py-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search advisors, deals, notes, calls..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-tcs-teal" />
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="px-4 py-6">
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                      Recent Searches
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.map((search) => (
                        <button
                          key={search}
                          onClick={() => setQuery(search)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors flex items-center gap-2"
                        >
                          <Search className="w-3 h-3 text-gray-400" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {recentSearches.length === 0 && (
                  <p className="text-sm text-gray-600 text-center">Start typing to search...</p>
                )}
              </div>
            )}

            {!loading && query.length >= 2 && allResults.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-600">No results found for "{query}"</p>
              </div>
            )}

            {!loading && query.length >= 2 && allResults.length > 0 && (
              <div className="divide-y divide-tcs-border">
                {/* Group results by category */}
                {Object.keys(CATEGORY_LABELS).map((category) => {
                  const categoryResults = allResults.filter((r) => r.category === category);
                  if (categoryResults.length === 0) return null;

                  return (
                    <div key={category}>
                      <div className="px-4 py-2 bg-tcs-bg sticky top-0">
                        <h3 className="text-xs font-semibold text-gray-600 uppercase">
                          {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                        </h3>
                      </div>
                      {categoryResults.map((result, idx) => {
                        const globalIdx = allResults.indexOf(result);
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleNavigate(result)}
                            className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                              globalIdx === selectedIndex
                                ? 'bg-blue-50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-tcs-teal mt-0.5">
                              {ICON_MAP[result.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {result.title}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {result.subtitle}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                {result.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-tcs-border px-4 py-2 bg-tcs-bg text-xs text-gray-600 flex items-center justify-between">
            <span>Use arrow keys to navigate, enter to select</span>
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </>
  );
}
