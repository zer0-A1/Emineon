'use client';

import useSWR from 'swr';
import { api, CandidateResponse } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

export function useCandidates() {
  const { getToken } = useAuth();

  const fetcher = async (): Promise<any[]> => {
    try {
      console.log('🔍 useCandidates: Fetching candidates...');
      const token = await getToken();
      console.log('🔐 useCandidates: Got token:', !!token);
      
      const response = await api.candidates.list(token || undefined);
      console.log('📡 useCandidates: API response:', response);
      
      if (!response.success) {
        console.error('❌ useCandidates: API error:', response.error);
        throw new Error(response.error || 'Failed to fetch candidates');
      }
      
      console.log(`✅ useCandidates: Got ${response.data?.length || 0} candidates`);
      return response.data || [];
    } catch (error) {
      console.error('❌ useCandidates: Fetch error:', error);
      throw error;
    }
  };

  const { data, error, isLoading, mutate } = useSWR<any[]>(
    'candidates',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false, // Don't retry on error to avoid blocking
      errorRetryCount: 0, // No retries
    }
  );

  return {
    candidates: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useCandidatesWithSearch(searchParams?: {
  search?: string;
  status?: string;
  skills?: string;
  location?: string;
  source?: string;
}) {
  const { getToken } = useAuth();

  const fetcher = async (): Promise<CandidateResponse[]> => {
    const token = await getToken();
    const response = await api.candidates.list(token || undefined, searchParams);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch candidates');
    }
    
    return response.data || [];
  };

  // Create a cache key that includes search parameters
  const cacheKey = searchParams 
    ? `candidates-${JSON.stringify(searchParams)}`
    : 'candidates';

  const { data, error, isLoading, mutate } = useSWR<CandidateResponse[]>(
    cacheKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    candidates: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useCandidate(id: string) {
  const { getToken } = useAuth();

  const fetcher = async (): Promise<CandidateResponse> => {
    if (!id) throw new Error('No candidate ID provided');
    
    const token = await getToken();
    const response = await api.candidates.get(id, token || undefined);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch candidate');
    }
    
    if (!response.data) {
      throw new Error('Candidate not found');
    }
    
    return response.data;
  };

  const { data, error, isLoading, mutate } = useSWR<CandidateResponse>(
    id ? `candidate-${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    candidate: data,
    isLoading,
    error,
    mutate,
  };
} 