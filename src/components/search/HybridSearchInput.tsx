'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface HybridSearchInputProps {
  onResults: (results: any[]) => void;
  onLoading: (loading: boolean) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  searchType: 'candidates' | 'jobs';
  filters?: Record<string, any>;
  className?: string;
}

export function HybridSearchInput({ 
  onResults, 
  onLoading, 
  onQueryChange,
  placeholder = "Search...", 
  searchType,
  filters = {},
  className = ""
}: HybridSearchInputProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchStats, setSearchStats] = useState<any>(null);

  useEffect(() => {
    onLoadingRef.current(false);
  }, []);
  
  const onResultsRef = useRef(onResults);
  const onLoadingRef = useRef(onLoading);
  const onQueryChangeRef = useRef(onQueryChange);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onResultsRef.current = onResults;
    onLoadingRef.current = onLoading;
    onQueryChangeRef.current = onQueryChange;
  }, [onResults, onLoading, onQueryChange]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setError(null);
      setSearchStats(null);
      setIsLoading(false);
      onResultsRef.current([]);
      onLoadingRef.current(false);
      return;
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);
    onLoadingRef.current(true);

    try {
      const params = new URLSearchParams();
      params.set('q', searchQuery.trim());
      params.set('limit', '50');
      const endpoint = searchType === 'candidates' ? '/api/search/candidates-vector' : '/api/search/jobs-hybrid';
      const res = await fetch(`${endpoint}?${params.toString()}`, { signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (signal.aborted) return;

      const hits = data.items || [];
      const ids = hits.map((hit: any) => hit.objectID);

      if (ids.length === 0) {
        onResultsRef.current([]);
        setSearchStats({ total: 0, processingTime: 0 });
        return;
      }

      const apiEndpoint = searchType === 'candidates' ? '/api/candidates' : '/api/jobs';
      const idsParam = encodeURIComponent(ids.join(','));
      const apiResponse = await fetch(`${apiEndpoint}?ids=${idsParam}`, {
        signal,
        headers: { 'Content-Type': 'application/json' }
      });

      if (signal.aborted) return;
      if (!apiResponse.ok) throw new Error(`API request failed: ${apiResponse.status}`);

      const apiData = await apiResponse.json();
      if (!apiData.success && !apiData.jobs && !apiData.data) {
        throw new Error(apiData.error || 'API request failed');
      }

      const allRecords = searchType === 'candidates' ? apiData.data : apiData.jobs || apiData.data;
      const searchResults = ids.map(id => allRecords.find((item: any) => item.databaseId === id || item.id === id)).filter(Boolean);

      onResultsRef.current(searchResults);
      setSearchStats({ total: data.total || 0, processingTime: 0 });

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      onResultsRef.current([]);
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        onLoadingRef.current(false);
      }
    }
  }, [searchType]);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    debounceTimerRef.current = setTimeout(() => { performSearch(query); }, 300);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [query, filters, performSearch]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleClear = () => {
    setQuery('');
    setError(null);
    setSearchStats(null);
    onQueryChangeRef.current?.('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onQueryChangeRef.current?.(e.target.value);
          }}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
        />
        {isLoading && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          </div>
        )}
        {query && !isLoading && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>
      {searchStats && query && (
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>
            {searchStats.total || 0} result{(searchStats.total || 0) !== 1 ? 's' : ''} found 
            {searchStats.processingTime && ` in ${searchStats.processingTime}ms`}
          </span>
          <span>for "{query}"</span>
        </div>
      )}
      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          Search error: {error}
        </div>
      )}
    </div>
  );
}


