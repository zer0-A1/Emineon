'use client';

import { useState, useEffect } from 'react';

export function useCandidatesList() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearchQuery, setHasSearchQuery] = useState(false);

  const loadAllCandidates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiResponse = await fetch('/api/candidates', { headers: { 'Content-Type': 'application/json' } });
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        if (apiData.success) setCandidates(apiData.data);
        else setError(apiData.error || 'Failed to load candidates');
      } else setError('Failed to load candidates from database');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load candidates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAllCandidates(); }, []);

  const handleSearch = (results: any[], hasQuery: boolean) => {
    setSearchResults(results);
    setHasSearchQuery(hasQuery);
  };

  const displayCandidates = hasSearchQuery ? searchResults : candidates;

  return {
    candidates: displayCandidates,
    isLoading,
    error,
    handleSearch,
    hasSearchQuery,
    totalCandidates: candidates.length,
    searchResultsCount: searchResults.length,
    reload: loadAllCandidates,
  };
}


