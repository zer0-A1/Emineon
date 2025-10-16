'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { Layout } from '@/components/layout/Layout';
import { CreateJobModal } from '@/components/jobs/CreateJobModal';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { PipelineKanban } from '@/components/jobs/PipelineKanban';
import { CandidateProfileDrawer } from '@/components/candidates/CandidateProfileDrawer';
import { AddCandidateDropdown } from '@/components/jobs/AddCandidateDropdown';
import { AddExistingCandidateModal } from '@/components/jobs/AddExistingCandidateModal';
import { CreateCandidateModal } from '@/components/candidates/CreateCandidateModal';
import {
  ArrowLeft,
  Edit,
  Share2,
  MoreHorizontal,
  Users,
  Calendar,
  MapPin,
  Building2,
  Star,
  Eye,
  UserPlus,
  Settings,
  AlertCircle,
  Loader2,
  Brain,
  Zap,
  Target,
  X,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Trash2
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  workMode: string;
  status: string;
  priority: string;
  candidates: number;
  applications: number;
  daysToFill: number;
  slaProgress: number;
  skills: string[];
  salary: string;
  posted: string;
  owner: string;
  description: string;
  
  // Pipeline and SLA fields
  pipelineStages?: string[];
  slaDeadline?: Date;
  slaDays?: number;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentLocation: string;
  stage: string;
  rating: number;
  avatar?: string;
  lastInteraction: string;
  availability: string;
  source: string;
  skills: string[];
  experience: string;
  currentRole: string;
  notes: string;
  resumeUrl?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  tags: string[];
  timeline: Array<{
    date: string;
    action: string;
    type: string;
  }>;
  // Additional fields for compatibility
  name?: string;
  title?: string;
  location?: string;
  matchScore?: number;
  status?: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: authLoaded } = useAuth();
  
  const jobId = params?.id as string;
  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeOutcome, setCloseOutcome] = useState<'WON'|'LOST'|' '>(' ' as any);
  const [closeReason, setCloseReason] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const winReasons = ['Candidate Hired', 'Best Value', 'Strong Cultural Fit', 'Met Timeline', 'Excellent Skills Match'];
  const lossReasons = ['Position Cancelled', 'Lost to Competitor', 'Budget Constraints', 'Timeline Missed', 'Profile Mismatch'];

  // Candidate management modals
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [showCreateCandidateModal, setShowCreateCandidateModal] = useState(false);
  
  // AI Matching state
  const [showAIMatching, setShowAIMatching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [autoTriggeredMatching, setAutoTriggeredMatching] = useState(false);
  const [matchingByCandidate, setMatchingByCandidate] = useState<Record<string, { score: number; reasoning?: string; keyMatches?: string[]; gaps?: string[]; recommendations?: string[] }>>({});
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [candidateViewMode, setCandidateViewMode] = useState<'cards'|'table'>('cards');
  // Table prefs for candidates view
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['name','currentRole','currentLocation','email','phone','rating']);
  const allColumns: { key: string; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'currentRole', label: 'Current Role' },
    { key: 'currentLocation', label: 'Location' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'rating', label: 'Rating' },
    { key: 'availability', label: 'Availability' },
    { key: 'source', label: 'Source' },
    { key: 'experience', label: 'Experience' },
    { key: 'lastInteraction', label: 'Last Interaction' },
  ];
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const PREFS_KEY = (jobId ? `job:${jobId}:candidatesTablePrefs:v1` : 'job:candidatesTablePrefs:v1');

  useEffect(() => {
    // load prefs
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        if (Array.isArray(prefs.visibleColumns) && prefs.visibleColumns.length > 0) setVisibleColumns(prefs.visibleColumns);
        if (prefs.columnWidths) setColumnWidths(prefs.columnWidths);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    // persist prefs (debounced-ish)
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ visibleColumns, columnWidths }));
    } catch {}
  }, [PREFS_KEY, visibleColumns, columnWidths]);

  useEffect(() => {
    // init default widths
    setColumnWidths(prev => {
      const next = { ...prev } as Record<string, number>;
      visibleColumns.forEach((k) => { if (next[k] == null) next[k] = 160; });
      return next;
    });
  }, [visibleColumns]);

  const startResize = (key: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; const startWidth = columnWidths[key] ?? 160;
    setResizing({ key, startX, startWidth });
  };
  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(80, Math.min(600, resizing.startWidth + delta));
      setColumnWidths(prev => ({ ...prev, [resizing.key]: newWidth }));
    };
    const onUp = () => setResizing(null);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [resizing]);

  const onDragStartCol = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(index)); setIsReordering(true);
  };
  const onDropCol = (toIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (isNaN(fromIndex)) return;
    const newCols = [...visibleColumns];
    const [moved] = newCols.splice(fromIndex, 1);
    newCols.splice(toIndex, 0, moved);
    setVisibleColumns(newCols); setIsReordering(false);
  };
  const onDragOverCol = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // AI Matching function
  const handleAIMatching = async () => {
    if (!job?.id) return;
    
    setIsMatching(true);
    try {
      const token = await getToken();
      // Build job context from overview description on the page
      const response = await fetch('/api/ai/candidate-job-matching', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          jobId: job.id,
          mode: 'job-to-candidates',
          limit: 30,
          jobDescription: `${job.title}\n${job.description}\nSkills: ${(job as any).requirements?.join?.(', ') || ''}`,
          candidateIds: candidates.map(c => c.id),
          scope: 'jobCandidatesOnly'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setMatchingResults(result.data.matches);
        // Apply scores to visible candidates for Matching tab
        const scoreMap: Record<string, number> = {};
        const byId: Record<string, { score: number; reasoning?: string; keyMatches?: string[]; gaps?: string[]; recommendations?: string[] }> = {};
        (result.data.matches || []).forEach((m: any) => {
          if (m.candidateId) {
            scoreMap[m.candidateId] = m.score;
            byId[m.candidateId] = {
              score: m.score,
              reasoning: m.reasoning,
              keyMatches: m.keyMatches || [],
              gaps: m.gaps || [],
              recommendations: m.recommendations || []
            };
          }
        });
        setMatchingByCandidate(byId);
        setCandidates(prev => prev.map(c => ({ ...c, rating: Math.max(1, Math.min(5, Math.round(((scoreMap[c.id] || c.rating*20) / 20)))) })));
        // Keep insights inline in Matching tab; modal not auto-opened
      } else {
        console.error('AI matching failed response:', result);
        alert('AI matching failed: ' + (result.error || 'Unknown error') + (result.details ? ' - ' + result.details : ''));
      }
    } catch (error) {
      console.error('AI matching error:', error);
      alert('AI matching failed. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  // Handle deep-linking to Matching tab and optional auto AI trigger from query params
  useEffect(() => {
    const tab = searchParams?.get('tab');
    const ai = searchParams?.get('ai');
    if (tab === 'matching') {
      setActiveTab('candidates');
    }
    if (tab === 'matching' && ai && !autoTriggeredMatching && job) {
      setAutoTriggeredMatching(true);
      handleAIMatching();
    }
  }, [searchParams, job]);

  // Persist last active tab per job
  useEffect(() => {
    if (!jobId) return;
    try {
      const saved = sessionStorage.getItem(`job:${jobId}:activeTab`);
      if (saved && ['pipeline','overview','candidates','matching','settings'].includes(saved)) {
        setActiveTab(saved);
      }
    } catch {}
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    try {
      sessionStorage.setItem(`job:${jobId}:activeTab`, activeTab);
    } catch {}
  }, [jobId, activeTab]);

  // Persist expanded insights per job in sessionStorage
  useEffect(() => {
    if (!jobId) return;
    try {
      const raw = sessionStorage.getItem(`job:${jobId}:expandedInsights`);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        if (Array.isArray(ids)) {
          setExpandedInsights(new Set(ids));
        }
      }
    } catch {}
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    try {
      const arr = Array.from(expandedInsights);
      sessionStorage.setItem(`job:${jobId}:expandedInsights`, JSON.stringify(arr));
    } catch {}
  }, [jobId, expandedInsights]);

  // Wait for Clerk to be fully loaded before making API calls
  const isFullyLoaded = userLoaded && authLoaded;

  // Pipeline stages: hard-programmed across all jobs
  const getStageColor = (stageName: string, index: number) => {
    const stageColorMap: Record<string, string> = {
      'sourced': 'bg-gray-100',
      'screened': 'bg-blue-100',
      'interview': 'bg-yellow-100',
      'offer': 'bg-orange-100',
      'hired': 'bg-green-100',
      'phone': 'bg-blue-100',
      'technical': 'bg-yellow-100',
      'assessment': 'bg-purple-100',
      'reference': 'bg-orange-100',
      'final': 'bg-green-100'
    };
    
    const key = stageName.toLowerCase();
    if (stageColorMap[key]) return stageColorMap[key];
    
    // Default colors based on position
    const defaultColors = ['bg-gray-100', 'bg-blue-100', 'bg-yellow-100', 'bg-purple-100', 'bg-orange-100', 'bg-green-100'];
    return defaultColors[index % defaultColors.length];
  };

  const stageAlias: Record<string, string> = {
    'applied': 'sourced',
    'screening': 'screened',
    'interviewing': 'interview',
    'submitted': 'interview',
  };

  const canonicalizeStage = (s: string) => stageAlias[s] || s;

  const canonicalCandidates = candidates.map((c) => ({
    ...c,
    stage: canonicalizeStage((c.stage || '').toLowerCase()),
  }));

  const pipelineStages = [
    { id: 'sourced', name: 'Sourced' },
    { id: 'screened', name: 'Screened' },
    { id: 'interview', name: 'Interviewed' },
    { id: 'offer', name: 'Offer' },
    { id: 'hired', name: 'Hired' },
  ].map((s, index) => ({
    id: s.id,
    name: s.name,
    color: getStageColor(s.id, index),
    count: canonicalCandidates.filter((c) => c.stage === s.id).length,
    description: `${s.name} stage`,
  }));

  // Fetch real job data when authentication is ready
  useEffect(() => {
    if (!isFullyLoaded || !user || !jobId) {
      return;
    }

    const fetchJobData = async (retryCount = 0) => {
      const maxRetries = 3;
      
      try {
        setLoading(true);
        setError(null);
        setApiError(null);

        // Get authentication token with retry
        let token = await getToken();
        
        // If no token on first try, wait a bit and retry
        if (!token && retryCount < maxRetries) {
          console.log(`🔄 No token available, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          token = await getToken();
        }
        
        if (!token) {
          console.error('❌ No authentication token available after retries');
          setError('Authentication failed. Please refresh the page.');
          return;
        }

        console.log('🔍 Fetching job data for:', jobId);

        // Fetch job details with retry logic
        const jobResponse = await fetch(`/api/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!jobResponse.ok) {
          const errorData = await jobResponse.json().catch(() => ({}));
          console.error('❌ Job API error:', errorData);
          
          // Retry on 401 errors (token might be stale)
          if (jobResponse.status === 401 && retryCount < maxRetries) {
            console.log(`🔄 Auth error, retrying... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchJobData(retryCount + 1);
          }
          
          if (jobResponse.status === 401) {
            setError('Authentication failed. Please refresh the page.');
          } else if (jobResponse.status === 404) {
            setError('Job not found.');
          } else {
            setError(errorData.error || 'Failed to load job data.');
          }
          return;
        }

        const response = await jobResponse.json();
        console.log('✅ Job response:', response);
        
        // Extract the job data from the response
        const jobData = response.data || response;

        // Calculate real statistics
        const totalApplications = jobData._count?.applications || 0;
        const daysActive = jobData.createdAt 
          ? Math.floor((new Date().getTime() - new Date(jobData.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        // Calculate SLA progress based on deadline
        let slaProgress = 0;
        if (jobData.slaDeadline && jobData.slaDays) {
          const slaDeadlineDate = new Date(jobData.slaDeadline);
          const now = new Date();
          const totalSlaTime = jobData.slaDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
          const timeElapsed = now.getTime() - (slaDeadlineDate.getTime() - totalSlaTime);
          slaProgress = Math.min(100, Math.max(0, (timeElapsed / totalSlaTime) * 100));
        } else {
          // Fallback: use 10 days standard SLA
          const createdAt = new Date(jobData.createdAt);
          const standardSlaDays = 10;
          const totalSlaTime = standardSlaDays * 24 * 60 * 60 * 1000;
          const timeElapsed = new Date().getTime() - createdAt.getTime();
          slaProgress = Math.min(100, Math.max(0, (timeElapsed / totalSlaTime) * 100));
        }

        // Transform API data to match UI expectations
        const transformedJob: Job = {
          id: jobData.id || jobId,
          title: jobData.title || 'Unknown Job',
          company: (jobData as any).client?.name || jobData.company || 'Company Name',
          location: jobData.location || 'Location Not Specified',
          contractType: jobData.employmentType?.[0] || 'Permanent',
          workMode: jobData.isRemote ? 'Remote' : 'Hybrid',
          status: jobData.status === 'ACTIVE' ? 'Active' : (jobData.status || 'Draft'),
          priority: 'Medium', // Default priority
          candidates: totalApplications,
          applications: totalApplications,
          daysToFill: daysActive,
          slaProgress: Math.round(slaProgress),
          skills: jobData.requirements?.filter((req: string) => req?.startsWith?.('Skill:')).map((req: string) => req.replace('Skill: ', '')) || [],
          salary: jobData.salaryMin && jobData.salaryMax 
            ? `${jobData.salaryCurrency || 'CHF'} ${(jobData.salaryMin / 1000).toFixed(0)}k - ${(jobData.salaryMax / 1000).toFixed(0)}k`
            : jobData.salaryMin 
              ? `${jobData.salaryCurrency || 'CHF'} ${(jobData.salaryMin / 1000).toFixed(0)}k+`
              : 'Salary not specified',
          posted: jobData.createdAt ? new Date(jobData.createdAt).toLocaleDateString() : 'Unknown',
          owner: 'David V', // Default owner
          description: jobData.description || 'No description available.',
          
          // Pipeline and SLA fields
          pipelineStages: jobData.pipelineStages || ['Sourced', 'Screened', 'Interviewing', 'Offer', 'Hired'],
          slaDeadline: jobData.slaDeadline ? new Date(jobData.slaDeadline) : undefined,
          slaDays: jobData.slaDays || 10
        };

        setJob(transformedJob);

                 // Transform candidates from applications
        const transformedCandidates: Candidate[] = (jobData.applications || []).map((app: any) => {
           const candidate = app.candidate || {};
          const mapStatusToStageId = (status: string | null | undefined): string => {
            const key = (status || '').toUpperCase();
            switch (key) {
              case 'PENDING': return 'sourced';
              case 'REVIEWING': return 'screened';
              case 'INTERVIEW_SCHEDULED': return 'interview';
              case 'INTERVIEWED': return 'interview';
              case 'OFFER_EXTENDED': return 'offer';
              case 'HIRED': return 'hired';
              case 'REJECTED':
              case 'WITHDRAWN':
              default: return 'sourced';
            }
          };
           return {
             id: candidate.id || `candidate-${Math.random()}`,
             firstName: candidate.firstName || 'Unknown',
             lastName: candidate.lastName || 'Candidate',
             email: candidate.email || 'email@example.com',
             phone: candidate.phone || 'Phone not provided',
             currentLocation: candidate.currentLocation || 'Location not specified',
            stage: (() => {
              const fromStage = canonicalizeStage((app?.stage || '').toLowerCase());
              if (fromStage) return fromStage;
              return mapStatusToStageId(app.status);
            })(),
             rating: 4.0, // Default rating
             avatar: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1494790108755-2616b612b47c' : '1507003211169-0a1dd7228f2d'}?w=150&h=150&fit=crop&crop=face`,
             lastInteraction: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recently',
             availability: 'Available',
             source: 'Application',
             skills: candidate.technicalSkills || [],
             experience: candidate.experienceYears ? `${candidate.experienceYears} years` : '0 years',
             currentRole: candidate.currentTitle || 'Professional',
             notes: `Applied for ${transformedJob.title}`,
             tags: candidate.technicalSkills?.slice(0, 3) || [],
             resumeUrl: (candidate as any).originalCvUrl || undefined,
             timeline: [
               { 
                 date: app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], 
                 action: 'Applied to position', 
                 type: 'application' 
               }
             ],
             // Additional fields for compatibility
             name: `${candidate.firstName || 'Unknown'} ${candidate.lastName || 'Candidate'}`,
             title: candidate.currentTitle || 'Professional',
             location: candidate.currentLocation || 'Location not specified',
             matchScore: 85, // Default match score
             status: candidate.status || 'ACTIVE'
           };
         });

        setCandidates(transformedCandidates);

      } catch (fetchError) {
        console.error('💥 Error fetching job data:', fetchError);
        
        // Retry on network errors
        if (retryCount < maxRetries) {
          console.log(`🔄 Network error, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchJobData(retryCount + 1);
        }
        
        setError('Failed to load job data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [isFullyLoaded, user, jobId, getToken]);

  // After adding candidates, refresh the job candidates list
  const handleCandidateAddedOptimistic = (candidate: any) => {
    // Update UI optimistically
    setCandidates(prev => [{
      id: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email || '',
      phone: candidate.phone || '',
      currentLocation: candidate.currentLocation || '',
      stage: (candidate as any).stage || 'sourced',
      rating: 4.0,
      lastInteraction: new Date().toISOString(),
      availability: 'Available',
      source: 'Manual',
      skills: candidate.technicalSkills || [],
      experience: candidate.experienceYears ? `${candidate.experienceYears} years` : '—',
      currentRole: candidate.currentTitle || '—',
      notes: `Added to ${job?.title || 'job'}`,
      tags: (candidate.technicalSkills || []).slice(0,3),
      timeline: [{ date: new Date().toISOString().split('T')[0], action: 'Added to job', type: 'added' }],
    } as any, ...prev]);

    // Re-fetch applications to ensure server truth
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/jobs/${jobId}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' as RequestCache });
        if (res.ok) {
          const response = await res.json();
          const jobData = response.data || response;
          const transformedCandidates: Candidate[] = (jobData.applications || []).map((app: any) => ({
            id: app.candidate?.id,
            firstName: app.candidate?.firstName,
            lastName: app.candidate?.lastName,
            email: app.candidate?.email,
            phone: app.candidate?.phone || '',
            currentLocation: app.candidate?.currentLocation || '',
            stage: ((): string => {
              const key = (app.status || '').toUpperCase();
              switch (key) {
                case 'PENDING': return 'sourced';
                case 'REVIEWING': return 'screened';
                case 'INTERVIEW_SCHEDULED': return 'interview';
                case 'INTERVIEWED': return 'interview';
                case 'OFFER_EXTENDED': return 'offer';
                case 'HIRED': return 'hired';
                default: return 'sourced';
              }
            })(),
            rating: 4.0,
            avatar: undefined,
            lastInteraction: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recently',
            availability: 'Available',
            source: 'Application',
            skills: app.candidate?.technicalSkills || [],
            experience: app.candidate?.experienceYears ? `${app.candidate?.experienceYears} years` : '—',
            currentRole: app.candidate?.currentTitle || '—',
            notes: `Applied for ${jobData.title}`,
            tags: app.candidate?.technicalSkills?.slice(0,3) || [],
            resumeUrl: app.candidate?.originalCvUrl || undefined,
            timeline: [ { date: app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], action: 'Applied to position', type: 'application' } ],
            name: `${app.candidate?.firstName} ${app.candidate?.lastName}`,
            title: app.candidate?.currentTitle || '—',
            location: app.candidate?.currentLocation || '—',
            matchScore: 85,
            status: app.candidate?.status || 'ACTIVE'
          }));
          setCandidates(transformedCandidates);
        }
      } catch {}
    })();
  };

  // Pipeline handlers with safe checks
  const handleCandidateMove = async (candidateId: string, newStage: string) => {
    if (!candidateId || !newStage) return;
    
    // Optimistically update the UI
    setCandidates((prev: Candidate[]) => 
      prev.map(candidate => 
        candidate.id === candidateId 
          ? { 
              ...candidate, 
              stage: newStage,
              timeline: [
                { 
                  date: new Date().toISOString().split('T')[0], 
                  action: `Moved to ${pipelineStages.find((s: any) => s.id === newStage)?.name || newStage}`, 
                  type: 'stage_change' 
                },
                ...candidate.timeline
              ]
            }
          : candidate
      )
    );

    // Persist stage change to backend
    try {
      const token = await getToken();
      await fetch(`/api/jobs/${jobId}/candidates`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candidateId, stage: newStage })
      });
    } catch (error) {
      console.error('Failed to update candidate stage:', error);
      // Optionally refetch or revert
    }
  };

  const handleCandidateSelect = (candidate: Candidate) => {
    if (candidate) {
    setSelectedCandidate(candidate);
    }
  };

  // Handle candidate addition callbacks
  const handleCandidateAdded = (newCandidate: any) => {
    // Refresh candidates list or add to local state
    console.log('Candidate added to job:', newCandidate);
    
    // Convert to local candidate format and add to state
    const candidateForState: Candidate = {
      id: newCandidate.id,
      firstName: newCandidate.firstName || '',
      lastName: newCandidate.lastName || '',
      email: newCandidate.email || '',
      phone: newCandidate.phone || '',
      currentLocation: newCandidate.currentLocation || '',
      stage: (newCandidate as any).stage || 'sourced', // Default stage for newly added candidates
      rating: 0,
      lastInteraction: new Date().toISOString(),
      availability: 'Available',
      source: 'Manual',
      skills: newCandidate.technicalSkills || [],
      experience: `${newCandidate.experienceYears || 0} years`,
      currentRole: newCandidate.currentTitle || '',
      notes: '',
      tags: [],
      timeline: [{
        date: new Date().toISOString(),
        action: 'Added to job',
        type: 'system'
      }]
    };

    setCandidates(prev => [candidateForState, ...prev]);
    
    // Update job candidate count
    setJob(prev => prev ? { ...prev, candidates: prev.candidates + 1, applications: prev.applications + 1 } : null);

    // After optimistic add, refetch server state without cache to reconcile
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/jobs/${jobId}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' as RequestCache });
        if (res.ok) {
          const response = await res.json();
          const jobData = response.data || response;
          const transformedCandidates: Candidate[] = (jobData.applications || []).map((app: any) => ({
            id: app.candidate?.id,
            firstName: app.candidate?.firstName,
            lastName: app.candidate?.lastName,
            email: app.candidate?.email,
            phone: app.candidate?.phone || '',
            currentLocation: app.candidate?.currentLocation || '',
            stage: ((): string => {
              const key = (app.status || '').toUpperCase();
              switch (key) {
                case 'PENDING': return 'sourced';
                case 'REVIEWING': return 'screened';
                case 'INTERVIEW_SCHEDULED': return 'interviewing';
                case 'INTERVIEWED': return 'submitted';
                case 'OFFER_EXTENDED': return 'offer';
                case 'HIRED': return 'hired';
                default: return 'sourced';
              }
            })(),
            rating: 4.0,
            avatar: undefined,
            lastInteraction: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recently',
            availability: 'Available',
            source: 'Application',
            skills: app.candidate?.technicalSkills || [],
            experience: app.candidate?.experienceYears ? `${app.candidate?.experienceYears} years` : '—',
            currentRole: app.candidate?.currentTitle || '—',
            notes: `Applied for ${jobData.title}`,
            tags: app.candidate?.technicalSkills?.slice(0,3) || [],
            resumeUrl: app.candidate?.originalCvUrl || undefined,
            timeline: [ { date: app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], action: 'Applied to position', type: 'application' } ],
            name: `${app.candidate?.firstName} ${app.candidate?.lastName}`,
            title: app.candidate?.currentTitle || '—',
            location: app.candidate?.currentLocation || '—',
            matchScore: 85,
            status: app.candidate?.status || 'ACTIVE'
          }));
          setCandidates(transformedCandidates);
        }
      } catch {}
    })();
  };

  const handleCandidateCreated = (newCandidate: any) => {
    console.log('New candidate created:', newCandidate);
    // Ensure the pipeline tab is visible when a candidate is added
    setActiveTab('pipeline');
    handleCandidateAddedOptimistic(newCandidate);
  };

  // Handle candidate removal
  const handleCandidateRemove = async (candidateId: string) => {
    if (!candidateId || !jobId) return;

    try {
      console.log(`🗑️ Removing candidate ${candidateId} from job ${jobId}`);
      
      // Optimistically remove from UI
      const candidateToRemove = candidates.find(c => c.id === candidateId);
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      
      // Update job counts
      setJob(prev => prev ? { 
        ...prev, 
        candidates: Math.max(0, prev.candidates - 1), 
        applications: Math.max(0, prev.applications - 1) 
      } : null);

      // Call API to remove candidate from job
      const token = await getToken();
      const response = await fetch(`/api/jobs/${jobId}/candidates`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candidateId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove candidate');
      }

      const result = await response.json();
      console.log('✅ Candidate removed successfully:', result);

    } catch (error) {
      console.error('💥 Error removing candidate:', error);
      
      // Revert optimistic update on error
      const candidateToRestore = candidates.find(c => c.id === candidateId);
      if (candidateToRestore) {
        setCandidates(prev => [...prev, candidateToRestore]);
        setJob(prev => prev ? { 
          ...prev, 
          candidates: prev.candidates + 1, 
          applications: prev.applications + 1 
        } : null);
      }
      
      alert('Failed to remove candidate. Please try again.');
    }
  };

  const tabs = [
    { id: 'applications', label: 'Applications', icon: UserPlus },
    { id: 'pipeline', label: 'Pipeline', icon: Users },
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'candidates', label: 'Candidates', icon: UserPlus },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    if (!priority) return 'text-gray-600';
    
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const renderTabContent = () => {
    if (!job) return null;

    switch (activeTab) {
      case 'applications':
        return (
          <div className="space-y-6">
            <PipelineKanban
              candidates={canonicalCandidates}
              stages={[
                { id: 'applied', name: 'Applied', color: 'bg-blue-50', count: candidates.filter(c=> (c as any).applicationStage === 'applied').length },
                { id: 'long-list', name: 'Long List', color: 'bg-purple-50', count: candidates.filter(c=> (c as any).applicationStage === 'long-list').length },
                { id: 'short-list', name: 'Short List', color: 'bg-yellow-50', count: candidates.filter(c=> (c as any).applicationStage === 'short-list').length },
                { id: 'outreach', name: 'Outreach', color: 'bg-orange-50', count: candidates.filter(c=> (c as any).applicationStage === 'outreach').length },
                { id: 'sourced', name: 'Sourced', color: 'bg-gray-50', count: candidates.filter(c=> (c.stage || '').toLowerCase() === 'sourced').length },
              ]}
              onCandidateMove={(id, newStage) => {
                // Map moves to applicationStage except sourced, which maps to pipeline stage
                if (newStage === 'sourced') {
                  handleCandidateMove(id, 'sourced');
                  return;
                }
                setCandidates(prev => prev.map(c => c.id === id ? { ...(c as any), applicationStage: newStage } : c));
                // TODO: persist applicationStage via API if model supports it
              }}
              onCandidateSelect={handleCandidateSelect}
              onAddCandidate={() => setShowAddExistingModal(true)}
              onCandidateRemove={handleCandidateRemove}
              onFileDrop={async (stageId: string, file: File) => {
                try {
                  setShowCreateCandidateModal(true);
                  setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('emineon:candidate-upload', { detail: { file, stageId, jobId } }));
                  }, 0);
                } catch {}
              }}
              AddCandidateComponent={() => (
                <AddCandidateDropdown
                  onAddExisting={() => setShowAddExistingModal(true)}
                  onCreateNew={() => setShowCreateCandidateModal(true)}
                  onFindBestMatches={() => {
                    setActiveTab('matching');
                    handleAIMatching();
                  }}
                />
              )}
            />
          </div>
        );
      case 'pipeline':
        return (
          <div className="space-y-6">
            {/* Pipeline Header removed per request */}

          <PipelineKanban 
            candidates={canonicalCandidates}
            stages={pipelineStages}
            onCandidateMove={handleCandidateMove}
            onCandidateSelect={handleCandidateSelect}
              onAddCandidate={() => setShowAddExistingModal(true)}
              onCandidateRemove={handleCandidateRemove}
              onFileDrop={async (stageId: string, file: File) => {
                try {
                  setShowCreateCandidateModal(true);
                  setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('emineon:candidate-upload', { detail: { file, stageId, jobId } }));
                  }, 0);
                } catch {}
              }}
            AddCandidateComponent={() => (
              <AddCandidateDropdown
                onAddExisting={() => setShowAddExistingModal(true)}
                onCreateNew={() => setShowCreateCandidateModal(true)}
                onFindBestMatches={() => {
                  setActiveTab('matching');
                  handleAIMatching();
                }}
              />
            )}
            />
          </div>
        );
      
      case 'candidates':
        return (
          <div className="space-y-6">
            {/* Candidates Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Candidates</h3>
                <p className="text-sm text-gray-600">{candidates.length} candidates in this job</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button onClick={handleAIMatching} disabled={isMatching} variant="primary">
                  {isMatching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      AI Matching...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Find Best Matches
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCandidateViewMode(candidateViewMode==='cards'?'table':'cards')}
                >
                  {candidateViewMode==='cards' ? 'Table View' : 'Card View'}
                </Button>
                <AddCandidateDropdown
                  onAddExisting={() => setShowAddExistingModal(true)}
                  onCreateNew={() => setShowCreateCandidateModal(true)}
                  onFindBestMatches={handleAIMatching}
                />
              </div>
            </div>

            {/* Candidates List/Table */}
            {candidateViewMode==='cards' ? (
              <Card>
                <CardContent className="p-0">
                  {candidates.length === 0 ? (
                    <div className="text-center py-12">
                      <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates yet</h3>
                      <p className="text-gray-500 mb-4">Start building your candidate pipeline</p>
                      <AddCandidateDropdown
                        onAddExisting={() => setShowAddExistingModal(true)}
                        onCreateNew={() => setShowCreateCandidateModal(true)}
                        onFindBestMatches={handleAIMatching}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {candidates.map((c) => (
                        <div
                          key={c.id}
                          className="group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-gray-300"
                          onClick={() => {
                            const dbId = (c as any).databaseId || c.id;
                            if (typeof dbId === 'string') {
                              window.location.href = `/candidates/${dbId}`;
                            } else {
                              setSelectedCandidate(c);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {c.firstName?.[0] || '?'}{c.lastName?.[0] || '?'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-gray-900 truncate">{c.firstName} {c.lastName}</p>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.rating >= 4 ? 'bg-green-100 text-green-700' : c.rating >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {c.rating >= 4 ? 'Very Strong' : c.rating >= 3 ? 'Moderate' : 'Developing'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 truncate">{c.currentRole || '—'}{c.source ? ` • ${c.source}` : ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="hidden sm:flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-4 w-4 ${i < (c.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedInsights(prev => {
                                    const next = new Set(prev);
                                    if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                                    return next;
                                  });
                                }}
                                className="text-xs"
                              >
                                {expandedInsights.has(c.id) ? 'Hide insights' : 'Show insights'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleCandidateRemove(c.id); }}
                                className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                                aria-label="Remove candidate"
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                            <span>Active since: {c.lastInteraction || '—'}</span>
                            <div className="flex flex-wrap gap-1">
                              {c.skills.slice(0, 3).map((skill, i) => (
                                <span key={i} className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded">{skill}</span>
                              ))}
                              {c.skills.length === 0 && (
                                <span className="px-2 py-0.5 bg-neutral-50 text-neutral-400 rounded">No insights</span>
                              )}
                            </div>
                          </div>
                          {expandedInsights.has(c.id) && (
                            <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
                              {matchingByCandidate[c.id] ? (
                                <div className="space-y-3">
                                  {matchingByCandidate[c.id].keyMatches && matchingByCandidate[c.id].keyMatches!.length > 0 && (
                                    <div>
                                      <div className="text-green-700 font-medium mb-1">Key matches</div>
                                      <ul className="list-disc ml-5 text-green-700">
                                        {matchingByCandidate[c.id].keyMatches!.map((km, i) => (
                                          <li key={i}>{km}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {matchingByCandidate[c.id].gaps && matchingByCandidate[c.id].gaps!.length > 0 && (
                                    <div>
                                      <div className="text-orange-700 font-medium mb-1">Potential gaps</div>
                                      <ul className="list-disc ml-5 text-orange-700">
                                        {matchingByCandidate[c.id].gaps!.map((gap, i) => (
                                          <li key={i}>{gap}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {matchingByCandidate[c.id].recommendations && matchingByCandidate[c.id].recommendations!.length > 0 && (
                                    <div>
                                      <div className="text-blue-700 font-medium mb-1">Recommendations</div>
                                      <ul className="list-disc ml-5 text-blue-700">
                                        {matchingByCandidate[c.id].recommendations!.map((rec, i) => (
                                          <li key={i}>{rec}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {matchingByCandidate[c.id].reasoning && (
                                    <div className="text-gray-700">
                                      <div className="font-medium mb-1">Why this candidate matches</div>
                                      <p className="leading-relaxed text-gray-600">{matchingByCandidate[c.id].reasoning}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-500 text-sm">No insights yet. Use "Find Best Matches" to generate AI insights.</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="p-3 flex items-center gap-2 border-b">
                    <span className="text-sm text-gray-600">Columns:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {visibleColumns.map((colKey, idx) => {
                        const col = allColumns.find(c=>c.key===colKey)!;
                        return (
                          <div key={colKey} draggable onDragStart={onDragStartCol(idx)} onDragOver={onDragOverCol} onDrop={onDropCol(idx)} className={`px-2 py-1 rounded border text-xs cursor-move flex items-center gap-1 ${isReordering?'bg-gray-100':'bg-white'}`}>
                            <span>{col.label}</span>
                            <button className="ml-1 text-gray-400 hover:text-red-600" title="Remove column" onClick={(e)=>{ e.stopPropagation(); setVisibleColumns(visibleColumns.filter(k=>k!==colKey)); }}>×</button>
                          </div>
                        );
                      })}
                      <div className="relative">
                        <button onClick={()=> setShowColumnMenu(v=>!v)} className="px-2 py-1 text-xs border rounded">+ Add</button>
                        {showColumnMenu && (
                          <div className="absolute z-50 mt-1 bg-white border rounded shadow-xl max-h-80 overflow-auto min-w-[220px]">
                            {allColumns.filter(c=> !visibleColumns.includes(c.key)).map((c)=> (
                              <button key={c.key} className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={()=> { setVisibleColumns([...visibleColumns, c.key]); setShowColumnMenu(false); }}>{c.label}</button>
                            ))}
                            {allColumns.filter(c=> !visibleColumns.includes(c.key)).length===0 && (
                              <div className="px-3 py-2 text-xs text-gray-500">All columns visible</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm table-fixed">
                      <thead className="bg-gray-100">
                        <tr>
                          {visibleColumns.map((colKey) => (
                            <th key={colKey} className="relative text-left px-4 py-2 font-semibold uppercase tracking-wide text-xs whitespace-nowrap select-none overflow-hidden" style={{ width: (columnWidths[colKey] ?? 160), minWidth: 80 }}>
                              <div className="pr-4">
                                <span className="truncate">{allColumns.find(c=>c.key===colKey)?.label}</span>
                                <div onMouseDown={(e) => startResize(colKey, e)} className="absolute top-0 right-0 h-full w-2 cursor-col-resize" title="Drag to resize" />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map((c, idx) => (
                          <tr key={c.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer`} onClick={()=> setSelectedCandidate(c)}>
                            {visibleColumns.map((colKey) => (
                              <td key={colKey} className="px-4 py-2 whitespace-nowrap overflow-hidden" style={{ width: (columnWidths[colKey] ?? 160), maxWidth: (columnWidths[colKey] ?? 160) }}>
                                <div className="truncate">
                                  {colKey==='name' && (<>{c.firstName} {c.lastName}</>)}
                                  {colKey==='currentRole' && c.currentRole}
                                  {colKey==='currentLocation' && c.currentLocation}
                                  {colKey==='email' && c.email}
                                  {colKey==='phone' && c.phone}
                                  {colKey==='rating' && c.rating}
                                  {colKey==='availability' && c.availability}
                                  {colKey==='source' && c.source}
                                  {colKey==='experience' && c.experience}
                                  {colKey==='lastInteraction' && c.lastInteraction}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      case 'overview':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Job Description</h3>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {job.description}
                  </pre>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Requirements</h3>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {job.skills?.map((skill: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {skill}
                        </span>
                      )) || <span className="text-gray-500">No skills specified</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Job Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Salary Range</span>
                      <span className="font-medium">{job.salary}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Contract Type</span>
                      <span className="font-medium">{job.contractType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Work Mode</span>
                      <span className="font-medium">{job.workMode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Posted</span>
                      <span className="font-medium">{job.posted}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-12">
            <div className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-500">This feature is under development</p>
          </div>
        );
    }
  };

  // Loading state
  if (!isFullyLoaded || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading job details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorBoundary>
        <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">Error Loading Job</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    // Trigger refetch by updating a dependency
                    window.location.reload();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
                <Button onClick={() => window.history.back()} variant="outline">
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
      </ErrorBoundary>
    );
  }

  // Safe guard - if no job data, show error
  if (!job) {
    return (
      <ErrorBoundary>
        <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">Job Not Found</h1>
              <p className="text-gray-600 mb-4">The requested job could not be found.</p>
              <Button onClick={() => window.history.back()} variant="outline">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <Layout fullWidth>
      {/* Header */}
      <div className="mb-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (job) {
                  setEditingJob({
                    id: job.id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    contractType: job.contractType?.toLowerCase?.() || 'permanent',
                    workMode: job.workMode?.toLowerCase?.() || 'hybrid',
                    description: job.description,
                    department: undefined,
                    priority: (job as any).priority || 'medium',
                    status: job.status?.toLowerCase?.() === 'active' ? 'active' : 'draft',
                    skills: job.skills || [],
                    pipelineStages: job.pipelineStages || ['Sourced','Screened','Interviewing','Offer','Hired'],
                    slaDays: job.slaDays || 10,
                  });
                  setShowEditModal(true);
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              data-test="set-outcome-button"
              variant="outline" 
              size="sm"
              onClick={() => setShowCloseModal(true)}
            >
              Set Outcome
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Job Header Info */}
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold text-gray-900">{job!.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job!.status)}`}>
                  {job!.status}
                </span>
              </div>
              {/* Breadcrumb-like path: Jobs / Client / Job title */}
              <div className="flex items-center space-x-2 text-gray-500 mb-1 text-xs">
                <button onClick={() => window.location.assign('/jobs')} className="hover:underline">Jobs</button>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => {
                    const clientId = (job as any).client?.id;
                    if (clientId) window.location.assign(`/clients/${clientId}`);
                  }}
                  className="hover:underline"
                >
                  {(job as any).client?.name || (job as any).project?.clientName || job!.company}
                </button>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900">{job!.title}</span>
              </div>
            </div>
            {/* Minimalist KPIs aligned right */}
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <div className="text-right">
                <div className="text-xs text-gray-500">Applications</div>
                <div className="font-semibold text-gray-900">{job!.applications || 0}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">In Pipeline</div>
                <div className="font-semibold text-gray-900">{job!.candidates || 0}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Days Active</div>
                <div className="font-semibold text-gray-900">{job!.daysToFill || 0}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">SLA Progress</div>
                <div className="font-semibold text-gray-900">{job!.slaProgress || 0}%</div>
              </div>
            </div>
          </div>

          {/* Quick Stats moved to header; keep subtle divider */}
          <div className="pt-1 border-t border-gray-100" />
          {/* Close CTA when in final stage */}
          {(pipelineStages.find(s => s.id === 'hired')?.count ?? 0) > 0 && job?.status?.toLowerCase() !== 'closed' && (
            <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
              <div className="text-sm text-gray-800">
                Looks like you have candidates in Hired. Would you like to close this job?
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowCloseModal(true)}>
                  Close Job
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <div className="-mb-px flex items-center justify-between">
            <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px] px-4 sm:px-6 lg:px-8">
        {renderTabContent()}
      </div>

      {/* Candidate Drawer */}
      {selectedCandidate && (
        <CandidateProfileDrawer
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          candidate={(() => {
            const c = selectedCandidate as Candidate;
            const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown Candidate';
            return {
              id: Number.isFinite(Number(c.id)) ? Number(c.id) : Date.now(),
              databaseId: c.id,
              name: fullName,
              location: c.currentLocation || '—',
              experience: c.experience || '—',
              currentRole: c.currentRole || '—',
              score: (c.rating >= 4 ? 'Very Strong' : c.rating >= 3 ? 'Moderate' : 'Developing') as any,
              status: (c.status as any) || 'ACTIVE',
              avatar: `${(c.firstName || 'U')[0] || 'U'}${(c.lastName || 'U')[0] || 'U'}`,
              skills: c.skills || [],
              rating: c.rating || 0,
              email: c.email || '',
              phone: c.phone || '',
              company: '',
              summary: c.notes || '',
              education: '',
              languages: [],
              availability: c.availability || '',
              expectedSalary: c.expectedSalary || '',
              linkedinUrl: undefined,
              portfolioUrl: undefined,
              lastInteraction: c.lastInteraction || '',
              source: c.source || 'job',
              workExperience: [],
              timeline: (c.timeline || []).map(t => ({ date: t.date, action: t.action, type: t.type })),
              originalCvUrl: c.resumeUrl,
              originalCvFileName: c.resumeUrl ? 'CV.pdf' : undefined,
              originalCvUploadedAt: undefined,
              // optional extended fields with safe defaults
              degrees: [],
              certifications: [],
              universities: [],
              programmingLanguages: [],
              frameworks: [],
              toolsAndPlatforms: [],
              databases: [],
              cloudPlatforms: [],
              devOpsTools: [],
              testingTools: [],
              dataEngineeringTools: [],
              mlFrameworks: [],
              analyticsTools: [],
              mobileTechnologies: [],
              webTechnologies: [],
              securityTools: [],
              monitoringTools: [],
              messagingSystems: [],
              cmsPlatforms: [],
              crmErp: [],
              methodologies: [],
            };
          })()}
        />
      )}

      {/* Edit Job Modal */}
      <CreateJobModal 
        open={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setEditingJob(null);
        }}
        editingJob={editingJob}
      />

      {/* Add Existing Candidate Modal */}
      <AddExistingCandidateModal
        open={showAddExistingModal}
        onClose={() => setShowAddExistingModal(false)}
        jobId={jobId}
        onCandidateAdded={handleCandidateAdded}
      />

      {/* Create New Candidate Modal */}
      <CreateCandidateModal
        open={showCreateCandidateModal}
        onClose={() => setShowCreateCandidateModal(false)}
        jobId={jobId}
        onCandidateCreated={handleCandidateCreated}
      />

      {/* AI Matching Results Modal */}
      {showAIMatching && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowAIMatching(false)} />
            <div className="relative bg-white rounded-lg max-w-5xl w-full p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">✨ AI Matching Results</h3>
                    <p className="text-gray-600">Best matching candidates for "{job?.title}"</p>
                  </div>
                </div>
                <button onClick={() => setShowAIMatching(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {matchingResults.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                  <p className="text-gray-600">Try adjusting job requirements or check candidate database</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Found {matchingResults.length} potential matches
                      </span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      Candidates are ranked by AI compatibility score based on skills, experience, and job requirements.
                    </p>
                  </div>
                  
                  {matchingResults.map((match, index) => (
                    <div key={match.candidateId} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                            #{index + 1}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              Candidate ID: {match.candidateId}
                            </h4>
                            <div className="flex items-center space-x-3 mt-1">
                              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                                match.score >= 80 ? 'bg-green-100 text-green-800' :
                                match.score >= 60 ? 'bg-blue-100 text-blue-800' :
                                match.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                <Zap className="h-4 w-4" />
                                <span>{match.score}% AI Match</span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {match.score >= 80 ? '🎯 Excellent Match' :
                                 match.score >= 60 ? '👍 Good Fit' :
                                 match.score >= 40 ? '⚡ Moderate Fit' : '⚠️ Poor Fit'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // View candidate details
                              window.open(`/candidates?search=${match.candidateId}`, '_blank');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            onClick={async () => {
                              // Add candidate to job
                              try {
                                const response = await fetch(`/api/jobs/${jobId}/candidates`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ candidateId: match.candidateId })
                                });
                                if (response.ok) {
                                  alert('Candidate added to job!');
                                  window.location.reload();
                                } else {
                                  alert('Failed to add candidate');
                                }
                              } catch (error) {
                                alert('Error adding candidate');
                              }
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add to Job
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <h5 className="font-medium text-green-700 mb-3 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Key Matches
                          </h5>
                          <ul className="space-y-2">
                            {match.keyMatches?.map((keyMatch: string, idx: number) => (
                              <li key={idx} className="text-green-600 text-sm flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                {keyMatch}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-orange-700 mb-3 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Potential Gaps
                          </h5>
                          <ul className="space-y-2">
                            {match.gaps?.map((gap: string, idx: number) => (
                              <li key={idx} className="text-orange-600 text-sm flex items-start">
                                <span className="text-orange-500 mr-2">•</span>
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-blue-700 mb-3 flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            AI Recommendations
                          </h5>
                          <ul className="space-y-2">
                            {match.recommendations?.map((rec: string, idx: number) => (
                              <li key={idx} className="text-blue-600 text-sm flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-medium text-gray-700 mb-2">💡 AI Analysis</h5>
                        <p className="text-gray-600 text-sm leading-relaxed">{match.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowAIMatching(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Job Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCloseModal(false)} />
          <div data-test="close-job-modal" className="relative z-10 max-w-lg w-full mx-auto mt-24 bg-white rounded-xl shadow-lg border overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0A2F5A]/10 flex items-center justify-center text-[#0A2F5A] font-semibold">✔</div>
              <div>
                <div className="text-gray-900 font-semibold">Close Job</div>
                <div className="text-xs text-gray-600">Mark this opportunity as Won or Lost and log the reason.</div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-800 mb-1">Outcome</div>
                <div className="flex gap-2">
                  <button
                    data-test="outcome-won"
                    onClick={() => { setCloseOutcome('WON'); setCloseReason(''); }}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${closeOutcome==='WON'?'bg-green-50 text-green-700 border-green-200':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >Won</button>
                  <button
                    data-test="outcome-lost"
                    onClick={() => { setCloseOutcome('LOST'); setCloseReason(''); }}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${closeOutcome==='LOST'?'bg-red-50 text-red-700 border-red-200':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >Lost</button>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 mb-1">Reason</div>
                <select
                  data-test="close-reason-select"
                  value={closeReason}
                  onChange={(e)=> setCloseReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="" disabled>{closeOutcome==='WON' ? 'Select a win reason' : closeOutcome==='LOST' ? 'Select a loss reason' : 'Select outcome first'}</option>
                  {(closeOutcome==='WON' ? winReasons : closeOutcome==='LOST' ? lossReasons : []).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 mb-1">Notes (optional)</div>
                <textarea
                  data-test="close-notes"
                  value={closeNotes}
                  onChange={(e)=> setCloseNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Anything we should remember about this outcome?"
                />
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <Button variant="outline" onClick={()=> setShowCloseModal(false)}>Cancel</Button>
              <Button
                data-test="confirm-close"
                onClick={async ()=>{
                  if (!job) return;
                  if (closeOutcome !== 'WON' && closeOutcome !== 'LOST') return alert('Select outcome');
                  if (!closeReason) return alert('Select a reason');
                  try {
                    const token = await getToken();
                    const res = await fetch(`/api/jobs/${job.id}/close`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...(token?{ 'Authorization': `Bearer ${token}` }: {}) },
                      body: JSON.stringify({ outcome: closeOutcome, reason: closeReason, notes: closeNotes })
                    });
                    if (res.ok) {
                      setJob(prev => prev ? { ...prev, status: closeOutcome==='WON' ? 'Won' : 'Lost' } : prev);
                      // Show single homepage-style typed message only when WON
                      if (closeOutcome === 'WON') {
                        showWinLoseBanner('Congratulations! Placement secured');
                      }
                      setShowCloseModal(false);
                    } else {
                      const j = await res.json().catch(()=>({}));
                      alert(j.error || 'Failed to close job');
                    }
                  } catch (e) {
                    alert('Failed to close job');
                  }
                }}
              >Confirm Close</Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
    </ErrorBoundary>
  );
}

function TypingCongrats() {
  const messages = [
    'Congratulations! Placement secured 🎉',
    'Fantastic work – client won! 🏆',
    'Another win for the team 🌟',
    'Great job! Offer accepted 🤝',
    'Success! Position filled ✅'
  ];
  const [idx, setIdx] = React.useState(0);
  const [display, setDisplay] = React.useState('');
  const [phase, setPhase] = React.useState<'typing'|'pause'|'deleting'>('typing');

  React.useEffect(() => {
    const full = messages[idx % messages.length];
    if (phase === 'typing') {
      if (display.length < full.length) {
        const t = setTimeout(() => setDisplay(full.slice(0, display.length + 1)), 35);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase('pause'), 800);
        return () => clearTimeout(t);
      }
    }
    if (phase === 'pause') {
      const t = setTimeout(() => setPhase('deleting'), 900);
      return () => clearTimeout(t);
    }
    if (phase === 'deleting') {
      if (display.length > 0) {
        const t = setTimeout(() => setDisplay(display.slice(0, -1)), 20);
        return () => clearTimeout(t);
      } else {
        setIdx((i) => (i + 1) % messages.length);
        setPhase('typing');
      }
    }
  }, [display, phase, idx]);

  return (
    <div className="relative text-sm text-gray-800">
      <span>{display}</span>
      <span className="ml-0.5 inline-block w-1 h-4 bg-gray-800 align-middle animate-pulse" />
    </div>
  );
}

function showWinLoseBanner(text: string) {
  try {
    const id = `winlose-${Date.now()}`;
    const wrap = document.createElement('div');
    wrap.id = id;
    wrap.className = 'fixed inset-0 z-[60] flex items-center justify-center pointer-events-none';
    wrap.innerHTML = `
      <div class="bg-white/95 backdrop-blur border border-neutral-200 rounded-2xl shadow-xl px-6 py-5 pointer-events-auto">
        <div class="flex items-center justify-center mb-3">
          <div class="w-16 h-16 rounded-full bg-white ring-4 ring-primary-200 shadow-[0_0_40px_rgba(37,99,235,0.35)] flex items-center justify-center animate-pulse">
            <img src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png" alt="Emineon" class="w-10 h-10" />
          </div>
        </div>
        <div class="text-center">
          <h3 class="text-lg md:text-xl font-normal text-neutral-700"><span class="font-semibold" id="wl-typed"></span></h3>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    // Typewriter effect: single message
    const el = document.getElementById('wl-typed');
    let i = 0;
    const step = () => {
      if (!el) return;
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i += 1;
        setTimeout(step, 35);
      } else {
        setTimeout(() => {
          const node = document.getElementById(id);
          if (node && node.parentNode) node.parentNode.removeChild(node);
        }, 1200);
      }
    };
    step();
  } catch {}
} 