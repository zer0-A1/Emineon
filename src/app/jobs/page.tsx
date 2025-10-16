'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { CreateJobModal } from '@/components/jobs/CreateJobModal';
import { CreateCandidateModal } from '@/components/candidates/CreateCandidateModal';
import { AddCandidateDropdown } from '@/components/jobs/AddCandidateDropdown';
import { AddExistingCandidateModal } from '@/components/jobs/AddExistingCandidateModal';
import { useJobsList } from '../../hooks/useJobsList';
import { AnimatedPageTitle } from '@/components/ui/AnimatedPageTitle';
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Upload,
  MoreHorizontal,
  MapPin,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Building2,
  Briefcase,
  Target,
  Eye,
  UserPlus,
  Share2,
  ChevronDown,
  Star,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  Copy,
  Maximize2,
  Minimize2,
  DollarSign,
  UserCheck,
  MessageSquare,
  FileText,
  Award,
  Activity,
  X
} from 'lucide-react';

export default function JobsPage() {
  const router = useRouter();
  
  // Use the same pattern as candidates page
  const { 
    jobs: allJobs, 
    isLoading, 
    error, 
    handleSearch,
    hasSearchQuery,
    totalJobs,
    searchResultsCount,
    reload,
    removeFromList,
  } = useJobsList();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  // Force list view only
  const [viewMode, setViewMode] = useState<'list'>('list');
  const initializedRef = useRef(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateCandidateModal, setShowCreateCandidateModal] = useState(false);
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [showHeaderMetrics, setShowHeaderMetrics] = useState(false);
  // Cache applications for jobs expanded in the list
  const [applicationsByJob, setApplicationsByJob] = useState<Record<string, any[]>>({});

  const loadJobApplications = useCallback(async (jobId: string, force: boolean = false) => {
    try {
      if (!force && applicationsByJob[jobId]) return;
      const res = await fetch(`/api/jobs/${jobId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      const jobData = json?.data ?? json;
      const apps: any[] = Array.isArray(jobData?.applications) ? jobData.applications : [];
      setApplicationsByJob(prev => ({ ...prev, [jobId]: apps }));
    } catch {}
  }, [applicationsByJob]);
  
  // Job card expansion state - default to compact card view
  const [detailedJobs, setDetailedJobs] = useState<Set<string>>(new Set());
  // Third density: single-row compact view (like candidates page)
  const [rowJobs, setRowJobs] = useState<Set<string>>(new Set());

  // Handle search with the same pattern as candidates page
  const handleSearchResults = useCallback((results: any[]) => {
    // Track the search query to determine if this is a search or browse
    const hasQuery = searchTerm.trim().length > 0;
    
    // Search component returns DATABASE data, no transformation needed
    handleSearch(results, hasQuery);
  }, [handleSearch, searchTerm]);

  const handleSearchLoading = useCallback((loading: boolean) => {
    // no-op
  }, []);

  // Toggle individual job card view: compact -> detailed -> row -> compact
  const toggleJobView = useCallback((jobId: string) => {
    // List view: compact -> detailed -> row -> compact
    setDetailedJobs(prevDetailed => {
      const detailed = new Set(prevDetailed);
      const isDetailed = detailed.has(jobId);
      const isRow = rowJobs.has(jobId);
      if (!isDetailed && !isRow) {
        detailed.add(jobId);
        setRowJobs(prev => { const s = new Set(prev); s.delete(jobId); return s; });
      } else if (isDetailed) {
        detailed.delete(jobId);
        setRowJobs(prev => { const s = new Set(prev); s.add(jobId); return s; });
      } else {
        setRowJobs(prev => { const s = new Set(prev); s.delete(jobId); return s; });
      }
      return detailed;
    });
  }, [rowJobs]);



  // Jobs are loaded by the hook; implement DB FTS client search

  // Transform API data to match UI expectations
  const transformJob = (job: any) => ({
    id: job.id,
    title: job.title,
    company: job.client?.name || 'Emineon',
    location: job.location,
    contractType: job.employmentType?.[0] || 'Permanent',
    workMode: job.isRemote ? 'Remote' : 'Hybrid',
    status: (() => {
      if (job.status === 'CLOSED') {
        if ((job as any).closeOutcome === 'WON') return 'Won';
        if ((job as any).closeOutcome === 'LOST') return 'Lost';
        return 'Closed';
      }
      return job.status === 'ACTIVE' ? 'Active' : job.status === 'DRAFT' ? 'Draft' : job.status;
    })(),
    priority: 'Medium', // Default priority
    candidates: job._count?.applications || 0,
    applications: job._count?.applications || 0,
    daysToFill: (() => {
      const created = job.createdAt ? new Date(job.createdAt).getTime() : Date.now();
      const diff = Date.now() - created;
      const day = 24 * 60 * 60 * 1000;
      const val = Math.floor(diff / day);
      return Number.isFinite(val) ? Math.max(0, val) : 0;
    })(),
    // SLA progress based on real SLA deadline and current date
    slaProgress: (() => {
      const now = Date.now();
      const slaDays: number = typeof job.slaDays === 'number' ? job.slaDays : 10;
      const dayMs = 24 * 60 * 60 * 1000;
      const totalMs = Math.max(1, slaDays * dayMs);
      if (job.slaDeadline) {
        const deadline = new Date(job.slaDeadline).getTime();
        const start = deadline - totalMs;
        const elapsed = now - start;
        const pct = Math.round(Math.min(100, Math.max(0, (elapsed / totalMs) * 100)));
        return pct;
      }
      // Fallback: use createdAt as start
      const createdAt = job.createdAt ? new Date(job.createdAt).getTime() : now;
      const elapsed = now - createdAt;
      const pct = Math.round(Math.min(100, Math.max(0, (elapsed / totalMs) * 100)));
      return pct;
    })(),
    skills: job.requirements?.filter((req: string) => req.startsWith('Skill:')).map((req: string) => req.replace('Skill: ', '')) || [],
    salary: job.salaryMin && job.salaryMax 
      ? `${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k`
      : job.salaryMin 
        ? `${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k+`
        : 'Salary not specified',
    posted: new Date(job.createdAt).toLocaleDateString(),
    owner: 'David V', // Default owner
    description: job.description,
    shortDescription: (() => {
      try {
        const title = job.title || '';
        const company = job.client?.name || 'Company';
        const loc = job.location || 'Location';
        const contract = (job.employmentType?.[0]) || 'Permanent';
        const mode = job.isRemote ? 'Remote' : 'Hybrid';
        const skills = (job.requirements?.filter((req: string) => req.startsWith('Skill:')).map((req: string) => req.replace('Skill: ', '')) || []).slice(0,3);
        const salary = (job.salaryMin && job.salaryMax)
          ? `${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k`
          : (job.salaryMin ? `${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k+` : 'Salary not specified');
        const parts = [
          `${title} at ${company}`,
          `${loc} • ${contract}, ${mode}`,
          skills.length ? `Key: ${skills.join(', ')}` : undefined,
          salary
        ].filter(Boolean);
        return parts.join(' • ');
      } catch {
        return job.description || '';
      }
    })(),
    client: job.client ? { id: job.client.id, name: job.client.name, logoUrl: job.client.logoUrl } : null,
    pipelineStages: Array.isArray(job.pipelineStages) && job.pipelineStages.length > 0
      ? job.pipelineStages
      : ['Sourced', 'Screened', 'Interviewed', 'Offer', 'Hired'],
    // Pipeline: compute from applications using same mapping as job detail kanban
    pipeline: (() => {
      const mapStatusToStageId = (status: string | null | undefined): 'sourced'|'screened'|'interview'|'offer'|'hired' => {
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
      const counts: Record<'sourced'|'screened'|'interview'|'offer'|'hired', number> = {
        sourced: 0, screened: 0, interview: 0, offer: 0, hired: 0
      };
      const apps = Array.isArray(job.applications) ? job.applications : [];
      apps.forEach((a: any) => { counts[mapStatusToStageId(a?.status)]++; });
      return { ...counts, total: (job._count?.applications || 0) };
    })()
  });

  // Transform jobs from the hook (same pattern as candidates)
  const transformedJobs = useMemo(() => (allJobs as any[]).map((job: any) => transformJob(job)), [allJobs]);

  // Full-text search via server endpoint
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!searchTerm.trim()) {
        handleSearch([], false);
        return;
      }
      try {
        const params = new URLSearchParams();
        params.set('q', searchTerm.trim());
        params.set('limit', '50');
        const res = await fetch(`/api/search/jobs-fts?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const ids: string[] = (data.items || []).map((x: any) => x.objectID);
        const results = transformedJobs.filter(j => ids.includes(j.id));
        if (!ignore) handleSearch(results, true);
      } catch (e) {
        if (!ignore) handleSearch([], true);
      }
    };
    const t = setTimeout(run, 250);
    return () => { ignore = true; clearTimeout(t); };
  }, [searchTerm, transformedJobs, handleSearch]);

  // Live KPI stats derived from current jobs data
  const stats = useMemo(() => {
    const totalJobs = transformedJobs.length;
    const activeJobs = transformedJobs.filter((j: any) => j.status.toLowerCase() === 'active');

    // Active count
    const activeCount = activeJobs.length;

    // SLA Risk: active jobs with SLA progress < 70%
    const slaRiskCount = activeJobs.filter((j: any) => (j.slaProgress ?? 0) < 70).length;

    // Candidates: sum of applications across all jobs
    const totalCandidates = transformedJobs.reduce((sum: number, j: any) => sum + (j.applications || 0), 0);

    // Avg. Days to Fill: average of daysActive across all jobs
    const avgDays = transformedJobs.length
      ? Math.round(transformedJobs.reduce((sum: number, j: any) => sum + (j.daysToFill || 0), 0) / transformedJobs.length)
      : 0;

    // Simple trend placeholders until we have historical data
    const activeChange = '+8%';
    const slaChange = '+2 this week';
    const candidatesChange = '+23%';
    const daysChange = '-2 days';

    return [
      { label: 'Active', value: String(activeCount), change: activeChange, icon: CheckCircle2, filter: 'active', action: 'filter' },
      { label: 'SLA Risk', value: String(slaRiskCount), change: slaChange, icon: AlertCircle, filter: 'sla-risk', action: 'filter' },
      { label: 'Candidates', value: totalCandidates.toLocaleString(), change: candidatesChange, icon: Users, filter: null, action: 'navigate', path: '/candidates' },
      { label: 'Avg. Days to Fill', value: String(avgDays), change: daysChange, icon: Clock, filter: null, action: 'navigate', path: '/analytics' }
    ];
  }, [transformedJobs]);

  const handleStatClick = (stat: any) => {
    if (stat.action === 'filter' && stat.filter) {
      setSelectedFilter(stat.filter);
    } else if (stat.action === 'navigate' && stat.path) {
      router.push(stat.path);
    }
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const handleFindBestMatchesFromCard = (jobId: string) => {
    // Navigate to job detail with preselected matching tab and trigger flag
    router.push(`/jobs/${jobId}?tab=matching&ai=1`);
  };

  const handleAddExistingCandidate = (jobId: string) => {
    setSelectedJobId(jobId);
    setShowAddExistingModal(true);
  };

  const handleCreateNewCandidate = (jobId: string) => {
    setSelectedJobId(jobId);
    setShowCreateCandidateModal(true);
  };

  const handleEditJob = (job: any) => {
    setEditingJob(job);
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingJobId(jobId);
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Optimistically remove from list, then reload in background
        removeFromList(jobId);
        reload();
        alert('Job deleted successfully');
      } else {
        const errorData = await response.json();
        alert(`Error deleting job: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Error deleting job. Please try again.');
    } finally {
      setDeletingJobId(null);
      setOpenDropdown(null);
    }
  };

  const handleDuplicateJob = (job: any) => {
    // Create a copy of the job data for the create modal
    const duplicateData = {
      title: `${job.title} (Copy)`,
      company: job.company,
      location: job.location,
      contractType: job.contractType,
      workMode: job.workMode,
      description: job.description,
      skills: job.skills,
      salary: job.salary,
      department: job.department,
      status: 'draft', // Always start as draft
    };
    
    // You could set this data in the create modal if it supports pre-filling
    setShowCreateModal(true);
    setOpenDropdown(null);
  };

  const toggleDropdown = (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenDropdown(openDropdown === jobId ? null : jobId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // Persist UI state in sessionStorage: viewMode, selectedFilter, searchTerm, expanded cards
  useEffect(() => {
    try {
      const savedView = sessionStorage.getItem('jobs:viewMode');
      const savedFilter = sessionStorage.getItem('jobs:selectedFilter');
      const savedSearch = sessionStorage.getItem('jobs:searchTerm');
      const savedExpanded = sessionStorage.getItem('jobs:detailedJobs');
      const savedRow = sessionStorage.getItem('jobs:rowJobs');
      // Force list-only mode; ignore any previously saved grid/client
      try {
        sessionStorage.removeItem('jobs:viewMode');
        sessionStorage.removeItem('jobs:detailedJobs');
        sessionStorage.removeItem('jobs:rowJobs');
      } catch {}
      setViewMode('list');
      if (savedFilter) setSelectedFilter(savedFilter);
      if (typeof savedSearch === 'string') setSearchTerm(savedSearch);
      if (savedExpanded) {
        const ids: string[] = JSON.parse(savedExpanded);
        if (Array.isArray(ids)) setDetailedJobs(new Set(ids));
      }
      if (savedRow) {
        const ids: string[] = JSON.parse(savedRow);
        if (Array.isArray(ids)) setRowJobs(new Set(ids));
      }
      initializedRef.current = true;
    } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem('jobs:viewMode', viewMode); } catch {}
  }, [viewMode]);

  useEffect(() => {
    try { sessionStorage.setItem('jobs:selectedFilter', selectedFilter); } catch {}
  }, [selectedFilter]);

  useEffect(() => {
    try { sessionStorage.setItem('jobs:searchTerm', searchTerm); } catch {}
  }, [searchTerm]);

  useEffect(() => {
    try { sessionStorage.setItem('jobs:detailedJobs', JSON.stringify(Array.from(detailedJobs))); } catch {}
  }, [detailedJobs]);
  useEffect(() => {
    try { sessionStorage.setItem('jobs:rowJobs', JSON.stringify(Array.from(rowJobs))); } catch {}
  }, [rowJobs]);

  // Default to single-row on first load (both list and client views) if no saved state
  // Run this after filteredJobs is ready by deferring to next tick
  // Note: This effect depends on filteredJobs; it is redefined below after filteredJobs is declared using a second effect.

  const filteredJobs = useMemo(() => transformedJobs.filter((job: any) => {
    let matchesFilter = true;
    
    switch (selectedFilter) {
      case 'all':
        matchesFilter = true;
        break;
      case 'active':
        matchesFilter = job.status.toLowerCase() === 'active';
        break;
      case 'sla-risk':
        // Jobs that are at risk of missing SLA (active jobs with low progress)
        matchesFilter = job.status === 'Active' && job.slaProgress < 70;
        break;
      case 'draft':
        matchesFilter = job.status.toLowerCase() === 'draft';
        break;
      default:
        matchesFilter = job.status.toLowerCase() === selectedFilter.toLowerCase();
    }
    
    return matchesFilter;
  }), [transformedJobs, selectedFilter]);

  // After filteredJobs is available: set default single-row for first load
  useEffect(() => {
    if (!initializedRef.current) return;
    if (rowJobs.size > 0 || detailedJobs.size > 0) return;
    const ids = (filteredJobs || []).map((j: any) => j.id);
    if (ids.length > 0) setRowJobs(new Set(ids));
  }, [filteredJobs, rowJobs.size, detailedJobs.size, initializedRef]);

  // Helpers to render stage chips consistent with pipeline kanban
  const canonicalizeStage = (s: string) => {
    const m: Record<string,string> = { applied: 'sourced', screening: 'screened', interviewing: 'interview', submitted: 'interview' };
    const key = (s || '').toLowerCase();
    return m[key] || key;
  };
  const stageColor = (stageId: string) => {
    switch (stageId) {
      case 'sourced': return 'bg-gray-100 text-gray-800';
      case 'screened': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-yellow-100 text-yellow-800';
      case 'offer': return 'bg-orange-100 text-orange-800';
      case 'hired': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // For compact pipeline bar scaling: use the max total candidates across the current list
  const maxPipelineTotal = useMemo(() => {
    const list = filteredJobs.length > 0 ? filteredJobs : transformedJobs;
    const totals = list.map((j: any) => {
      const p = j.pipeline || { applied: 0, screening: 0, interview: 0, offer: 0 };
      return (p.applied || 0) + (p.screening || 0) + (p.interview || 0) + (p.offer || 0);
    });
    const max = Math.max(0, ...totals);
    return Math.max(1, max);
  }, [filteredJobs, transformedJobs]);

  const allExpanded = useMemo(() => (
    filteredJobs.length > 0 && detailedJobs.size === filteredJobs.length && rowJobs.size === 0
  ), [filteredJobs, detailedJobs, rowJobs]);

  // Toggle all job cards view
  const allRow = useMemo(() => (
    filteredJobs.length > 0 && rowJobs.size === filteredJobs.length && detailedJobs.size === 0
  ), [filteredJobs, rowJobs, detailedJobs]);

  // Cycle all cards between Compact -> Detailed -> Single Row -> Compact
  const cycleAllJobsView = useCallback(() => {
    const ids = filteredJobs.map(job => job.id);
    // List view: prefer expanding when currently Single Row
    if (allRow) {
      // Single Row -> Detailed
      setDetailedJobs(new Set(ids));
      setRowJobs(new Set());
      // preload applications for newly expanded jobs
      ids.forEach(id => { loadJobApplications(id, true); });
      return;
    }
    if (allExpanded) {
      // Detailed -> Single Row
      setDetailedJobs(new Set());
      setRowJobs(new Set(ids));
      return;
    }
    // Compact/mixed -> Detailed
    setDetailedJobs(new Set(ids));
    setRowJobs(new Set());
    ids.forEach(id => { loadJobApplications(id, true); });
  }, [filteredJobs, allExpanded, allRow, viewMode]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Layout fullWidth>
    <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <AnimatedPageTitle title="Jobs" Icon={Briefcase} />
              <p className="mt-1 text-sm text-gray-500">Manage your job postings and track hiring progress</p>
            </div>
            <button
              type="button"
              onClick={() => setShowHeaderMetrics(v => !v)}
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800"
              aria-expanded={showHeaderMetrics}
            >
              {showHeaderMetrics ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.47 8.47a.75.75 0 011.06 0l7 7a.75.75 0 11-1.06 1.06L12 9.56l-6.47 6.97a.75.75 0 11-1.06-1.06l7-7z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.53 15.53a.75.75 0 01-1.06 0l-7-7a.75.75 0 111.06-1.06L12 13.44l6.47-6.97a.75.75 0 111.06 1.06l-7 7z" clipRule="evenodd" /></svg>
              )}
              <span>{showHeaderMetrics ? 'Hide header overview' : 'Show header overview'}</span>
            </button>
          </div>
        </div>

        {/* Header Overview (collapsed by default) */}
        {showHeaderMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className={`bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg cursor-pointer hover:scale-105 ${
                  stat.filter && selectedFilter === stat.filter ? 'ring-2 ring-primary-500 bg-primary-50 border-primary-200' : 'border-gray-200'
                }`}
                onClick={() => handleStatClick(stat)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-xs mt-1 ${
                        stat.label === 'SLA Risk' ? 'text-orange-600' : 'text-green-600'
                      }`}>{stat.change}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      stat.label === 'SLA Risk' ? 'bg-orange-50' : 'bg-primary-50'
                    }`}>
                      <stat.icon className={`h-6 w-6 ${
                        stat.label === 'SLA Risk' ? 'text-orange-600' : 'text-primary-600'
                      }`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-center mb-4">
          <div className="flex-1 relative w-full min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              data-test="search-jobs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs, companies, locations, or any other criteria..."
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                type="button"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
            
              <div className="flex items-center space-x-2 shrink-0 text-sm">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-[120px]"
              >
                <option value="all">All Jobs</option>
                <option value="active">Active</option>
                <option value="sla-risk">SLA Risk</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>

                {/* Expand/Collapse/Row All Controls */}
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cycleAllJobsView}
                    className="text-xs py-2 px-3"
                    title={allRow ? 'Expand All' : (allExpanded ? 'Single Row All' : 'Expand All')}
                  >
                    {allRow ? <Maximize2 className="h-3 w-3 mr-1" /> : allExpanded ? <List className="h-3 w-3 mr-1" /> : <Maximize2 className="h-3 w-3 mr-1" />}
                    {allRow ? 'Expand All' : (allExpanded ? 'Single Row All' : 'Expand All')}
                  </Button>
                </div>

              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1.5 focus:outline-none bg-primary-50 text-primary-600`}
                  title="List view"
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

                {/* Advanced Filters */}
                <button
                  data-test="filter-button"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                  onClick={() => alert('Advanced filters coming soon')}
                >
                  <Filter className="h-4 w-4" />
                  <span>Advanced Filters</span>
                </button>
                <button 
                  data-test="create-job-btn"
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Job</span>
                </button>
          </div>
        </div>

              {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          </div>
        )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-6">
            {hasSearchQuery 
              ? "No jobs match your search criteria. Try adjusting your search terms." 
              : allJobs.length === 0 
                ? "Get started by creating your first job posting." 
                : "Try adjusting your filters."}
          </p>
          {allJobs.length === 0 && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Job
            </Button>
          )}
        </div>
      )}

      {/* Jobs List */}
      {!isLoading && !error && filteredJobs.length > 0 && (
        <div className="space-y-8">
          {/* Grouped by client view */}
          {Object.entries(
            filteredJobs.reduce((acc: Record<string, any[]>, job: any) => {
              const key = job.client?.name || 'Unassigned Client';
              acc[key] = acc[key] || [];
              acc[key].push(job);
              return acc;
            }, {})
          ).map(([clientName, jobs]) => (
            <div key={clientName}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Jobs</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-sm font-semibold text-gray-900">{clientName}</span>
                </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{jobs.length} job{jobs.length === 1 ? '' : 's'}</span>
              </div>
                  <div className={'space-y-4'}>
                {jobs.map((job: any) => {
                  const isDetailed = detailedJobs.has(job.id);
                  return (
                        <Card data-test="job-card" key={job.id} className={`bg-white shadow-sm hover:shadow-md hover:shadow-[0_0_24px_rgba(37,99,235,0.35)] hover:ring-1 hover:ring-primary-200 transition-shadow border-l-4 border-l-primary-500`}>
                          <CardContent 
                            className={rowJobs.has(job.id) ? 'p-2.5 cursor-pointer' : 'p-4'}
                            onClick={() => { if (rowJobs.has(job.id)) handleViewJob(job.id); }}
                          >
                            {/* Header and content reused below */}
                            {/* JOB_CARD_CONTENT_START */}
                            {/* The content from original card rendering is below; no changes except layout switches */}
                            {/* Header */}
                            {rowJobs.has(job.id) ? (
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold">
                                    {String(job.company || 'J').split(' ').map((w: string)=>w[0]).join('').slice(0,2).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                                      
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>{job.status}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                      <span className="flex items-center"><Building2 className="h-3.5 w-3.5 mr-1" />{job.company}</span>
                                      <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1" />{job.location}</span>
                                      <span className="flex items-center"><Briefcase className="h-3.5 w-3.5 mr-1" />{job.contractType}</span>
                                      <span className="flex items-center"><Users className="h-3.5 w-3.5 mr-1" />{job.applications} applicants</span>
                                      <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1" />{job.daysToFill} days</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={(e) => { e.stopPropagation(); loadJobApplications(job.id, true); setDetailedJobs(prev => { const s = new Set(prev); s.add(job.id); return s; }); setRowJobs(prev => { const s = new Set(prev); s.delete(job.id); return s; }); }} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Expand">
                                    <ChevronDown className="h-4 w-4" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleViewJob(job.id); }} className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="View job">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <div className="relative">
                                    <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors" onClick={(e) => toggleDropdown(job.id, e)} title="More actions">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                    {openDropdown === job.id && (
                                      <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                        <button data-test="edit-job" onClick={() => handleEditJob(job)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Job
                                        </button>
                                        <button onClick={() => handleDuplicateJob(job)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                          <Copy className="h-4 w-4 mr-2" />
                                          Duplicate Job
                                        </button>
                                        <hr className="my-1" />
                                        <button onClick={() => handleDeleteJob(job.id)} disabled={deletingJobId === job.id} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          {deletingJobId === job.id ? 'Deleting...' : 'Delete Job'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="font-semibold text-gray-900 truncate text-lg">{job.title}</h3>
                                    
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                    <div className="flex items-center"><Building2 className="h-4 w-4 mr-1 flex-shrink-0" /><span className="truncate">{job.company}</span></div>
                                    <div className="flex items-center"><MapPin className="h-4 w-4 mr-1 flex-shrink-0" /><span className="truncate">{job.location}</span></div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>{job.status}</span>
                                  {/* Expand/Collapse chevron */}
                                  <button onClick={(e) => {
                                    e.stopPropagation();
                                    const isDetailed = detailedJobs.has(job.id);
                                    if (isDetailed) {
                                      // Collapse to single-row
                                      setDetailedJobs(prev => { const s = new Set(prev); s.delete(job.id); return s; });
                                      setRowJobs(prev => { const s = new Set(prev); s.add(job.id); return s; });
                                    } else {
                                      // Expand to detailed
                                      loadJobApplications(job.id);
                                      setDetailedJobs(prev => { const s = new Set(prev); s.add(job.id); return s; });
                                      setRowJobs(prev => { const s = new Set(prev); s.delete(job.id); return s; });
                                    }
                                  }} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Toggle details">
                                    <ChevronDown className={`h-4 w-4 text-gray-500 ${detailedJobs.has(job.id) ? 'rotate-180' : ''}`} />
                                  </button>
                                  {/* Remove collapse button with opposing arrows (Minimize) */}
                                  <div className="relative">
                                    <button className="p-1 hover:bg-gray-100 rounded" onClick={(e) => toggleDropdown(job.id, e)}>
                                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                    </button>
                                    {openDropdown === job.id && (
                                      <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                        <button data-test="edit-job" onClick={() => handleEditJob(job)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"><Edit className="h-4 w-4 mr-2" />Edit Job</button>
                                        <button onClick={() => handleDuplicateJob(job)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"><Copy className="h-4 w-4 mr-2" />Duplicate Job</button>
                                        <hr className="my-1" />
                                        <button onClick={() => handleDeleteJob(job.id)} disabled={deletingJobId === job.id} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50"><Trash2 className="h-4 w-4 mr-2" />{deletingJobId === job.id ? 'Deleting...' : 'Delete Job'}</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* SLA Progress */}
                            {detailedJobs.has(job.id) && job.status === 'Active' && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-gray-600">SLA Progress</span>
                                  <span className="font-medium">{job.slaProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`${job.slaProgress >= 80 ? 'bg-green-500' : job.slaProgress >= 60 ? 'bg-yellow-500' : 'bg-red-500'} h-2 rounded-full`}
                                    style={{ width: `${job.slaProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Pipeline: mini kanban with headers and candidate cards per stage */}
                            {detailedJobs.has(job.id) && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="text-gray-600">Pipeline</span>
                                  <span className="text-gray-500">{(applicationsByJob[job.id]?.length ?? job.applications ?? 0)} applications</span>
                                </div>
                                {(() => {
                                  const stageOrder: Array<{ id: 'sourced'|'screened'|'interview'|'offer'|'hired'; label: string; color: string }>= [
                                    { id: 'sourced', label: 'Sourced', color: 'border-gray-200' },
                                    { id: 'screened', label: 'Screened', color: 'border-blue-200' },
                                    { id: 'interview', label: 'Interview', color: 'border-yellow-200' },
                                    { id: 'offer', label: 'Offer', color: 'border-orange-200' },
                                    { id: 'hired', label: 'Hired', color: 'border-green-200' },
                                  ];
                                  const apps = Array.isArray(applicationsByJob[job.id]) ? applicationsByJob[job.id] : [];
                                  const cardsByStage: Record<string, Array<{ name: string; role: string }>> = {};
                                  stageOrder.forEach(s => { cardsByStage[s.id] = []; });
                                  (apps || []).forEach((a: any) => {
                                    // Prefer stored stage
                                    let stage: 'sourced'|'screened'|'interview'|'offer'|'hired' = canonicalizeStage((a?.stage || '').toLowerCase()) as any;
                                    if (!stage) {
                                      const status = (a?.status || '').toUpperCase();
                                      switch (status) {
                                        case 'REVIEWING': stage = 'screened'; break;
                                        case 'INTERVIEW_SCHEDULED':
                                        case 'INTERVIEWED': stage = 'interview'; break;
                                        case 'OFFER_EXTENDED': stage = 'offer'; break;
                                        case 'HIRED': stage = 'hired'; break;
                                        default: stage = 'sourced';
                                      }
                                    }
                                    const nm = a?.candidate?.fullName || a?.candidate?.name || `${a?.candidate?.firstName ?? ''} ${a?.candidate?.lastName ?? ''}`.trim() || 'Candidate';
                                    const rl = a?.candidate?.currentTitle || a?.candidate?.current_role || a?.candidate?.currentRole || a?.candidate?.title || '—';
                                    cardsByStage[stage].push({ name: nm, role: rl });
                                  });
                                  return (
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                      {stageOrder.map(s => (
                                        <div key={s.id} className={`rounded-lg p-3 border ${s.id==='sourced'?'bg-gray-50 border-gray-200': s.id==='screened'?'bg-blue-50 border-blue-200': s.id==='interview'?'bg-yellow-50 border-yellow-200': s.id==='offer'?'bg-orange-50 border-orange-200':'bg-green-50 border-green-200'}`}>
                                          <div className={`text-xs font-semibold mb-2 ${s.id==='sourced'?'text-gray-700': s.id==='screened'?'text-blue-700': s.id==='interview'?'text-yellow-700': s.id==='offer'?'text-orange-700':'text-green-700'}`}>{s.label}</div>
                                          <div className="space-y-2">
                                            {(cardsByStage[s.id] || []).length > 0 ? (
                                              (cardsByStage[s.id] || []).slice(0, 3).map((c, idx) => (
                                                <div key={idx} className="bg-white border border-gray-200 rounded p-2 hover:shadow-[0_0_24px_rgba(37,99,235,0.35)] hover:ring-1 hover:ring-primary-200 transition-shadow">
                                                  <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                                                  <div className="text-xs text-gray-600 truncate">{c.role}</div>
                                                </div>
                                              ))
                                            ) : (
                                              <div className={`text-xs italic ${s.id==='sourced'?'text-gray-400': s.id==='screened'?'text-blue-400': s.id==='interview'?'text-yellow-600': s.id==='offer'?'text-orange-500':'text-green-600'}`}>No candidates</div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Skills */}
                            {detailedJobs.has(job.id) && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-1">
                                {job.skills.slice(0, 3).map((skill: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{skill}</span>
                                ))}
                                {job.skills.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">+{job.skills.length - 3} more</span>
                                )}
                              </div>
                            </div>
                            )}

                            {/* Actions */}
                            <div className={`pt-4 border-t border-gray-100 ${detailedJobs.has(job.id) ? 'flex items-center justify-between' : 'hidden'}`}>
                              <div className="flex items-center space-x-4">
                                <Button variant="outline" size="sm" onClick={() => handleViewJob(job.id)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <AddCandidateDropdown onAddExisting={() => handleAddExistingCandidate(job.id)} onCreateNew={() => handleCreateNewCandidate(job.id)} onFindBestMatches={() => handleFindBestMatchesFromCard(job.id)} />
                              </div>
                              <Button variant="outline" size="sm">
                                <Share2 className="h-4 w-4 mr-1" />
                                Share
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
          
        </div>
      )}

      {/* Create Job Modal */}
      <CreateJobModal 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />

      {/* Edit Job Modal */}
      <CreateJobModal 
        open={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setEditingJob(null);
        }}
        editingJob={editingJob}
      />

      {/* Create New Candidate Modal */}
      <CreateCandidateModal 
        open={showCreateCandidateModal} 
        onClose={() => setShowCreateCandidateModal(false)}
        jobId={selectedJobId || undefined}
      />

      {/* Add Existing Candidate Modal */}
      <AddExistingCandidateModal 
        open={showAddExistingModal} 
        onClose={() => setShowAddExistingModal(false)}
        jobId={selectedJobId || ''}
        onCandidateAdded={() => {
          setShowAddExistingModal(false);
          // Optionally refresh jobs or show success message
        }}
      />
      </div>
    </Layout>
  );
}
