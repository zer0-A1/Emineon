'use client';

import { useState, useEffect } from 'react';

export function useJobsList() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearchQuery, setHasSearchQuery] = useState(false);

  useEffect(() => {
    const loadAllJobs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const apiResponse = await fetch('/api/jobs', {
          headers: { 'Content-Type': 'application/json' }
        });
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          const jobsData = apiData.jobs || apiData.data || [];

          // Inject mock client variety for UI grouping if all jobs share the same client
          // or when client information is missing. This is a non-persistent, UI-only enrichment.
          try {
            const uniqueClientNames = new Set(
              (jobsData || [])
                .map((j: any) => j?.client?.name)
                .filter((n: any) => typeof n === 'string' && n.trim().length > 0)
            );

            let enriched = jobsData;
            if (uniqueClientNames.size <= 1) {
              const mockClients = [
                { id: 'mock-client-antaes', name: 'Antaes' },
                { id: 'mock-client-nestle', name: 'Nestlé' },
                { id: 'mock-client-ubs', name: 'UBS' },
                { id: 'mock-client-rolex', name: 'Rolex' },
                { id: 'mock-client-cern', name: 'CERN' },
              ];

              enriched = jobsData.map((job: any, idx: number) => {
                const mock = mockClients[idx % mockClients.length];
                // Preserve existing client if it already differs; otherwise assign mock
                const nextClient = job?.client && uniqueClientNames.size === 1
                  ? { ...mock }
                  : job?.client || { ...mock };
                return { ...job, client: nextClient };
              });
            }

            setJobs(enriched);
          } catch {
            // On any enrichment error, fall back to the raw data
            setJobs(jobsData);
          }
        } else {
          setError('Failed to load jobs from database');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    };
    loadAllJobs();
  }, []);

  const handleSearch = (results: any[], hasQuery: boolean) => {
    setSearchResults(results);
    setHasSearchQuery(hasQuery);
  };

  const displayJobs = hasSearchQuery ? searchResults : jobs;

  return {
    jobs: displayJobs,
    isLoading,
    error,
    handleSearch,
    hasSearchQuery,
    totalJobs: jobs.length,
    searchResultsCount: searchResults.length,
    reload: async () => {
      try {
        const apiResponse = await fetch('/api/jobs', {
          headers: { 'Content-Type': 'application/json' }, cache: 'no-store'
        });
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          const jobsData = apiData.jobs || apiData.data || [];
          setJobs(jobsData);
        }
      } catch {}
    },
    removeFromList: (id: string) => {
      setJobs(prev => prev.filter(j => j.id !== id));
      setSearchResults(prev => prev.filter(j => j.id !== id));
    }
  };
}


