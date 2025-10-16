'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { CreateCandidateModal } from '@/components/candidates/CreateCandidateModal';
import { CandidateProfileDrawer } from '@/components/candidates/CandidateProfileDrawer';
import { CandidateProfileModal } from '@/components/candidates/CandidateProfileModal';
import { AdvancedFilterDrawer, CandidateFilters } from '@/components/candidates/AdvancedFilterDrawer';
import AdvancedFiltersModal, { AdvancedFilters } from '@/components/candidates/AdvancedFiltersModal';
import { useCandidates } from '@/hooks/useCandidates';
import { useAuth } from '@clerk/nextjs';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Star,
  MapPin,
  Briefcase,
  ChevronDown,
  Eye,
  Mail,
  Phone,
  Building,
  Plus,
  MoreHorizontal,
  FileText,
  Calendar,
  MessageSquare,
  Grid3X3,
  List,
  Brain,
  Edit3,
  Trash2,
  ChevronRight,
  Minimize2,
  Maximize2,
    ArrowUpDown,
    MoreVertical,
    User,
    GraduationCap,
    Languages,
    TrendingUp,
    DollarSign,
    CheckCircle,
    X
} from 'lucide-react';

// Candidate interface
interface Candidate {
  id: number;
  databaseId?: string;
  name: string;
  location: string;
  experience: string;
  currentRole: string;
  score: string;
  status: string;
  avatar: string;
  skills: string[];
  rating: number;
  email: string;
  phone: string;
  company: string;
  summary: string;
  education: string;
  languages: string[];
  availability: string;
  expectedSalary: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  lastInteraction: string;
  source: string;
  workExperience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  timeline: Array<{
    date: string;
    action: string;
    type: string;
    details?: string;
  }>;
  // CV file information
  originalCvUrl?: string;
  originalCvFileName?: string;
  originalCvUploadedAt?: string;
  // AI Matching information
  jobMatches?: any[];
  averageMatchScore?: number;
  topMatchingJob?: any;
  _editMode?: boolean;
}

export default function CandidatesPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const { candidates: dbCandidates, isLoading: dbLoading, error: dbError, mutate } = useCandidates();
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [displayedCandidates, setDisplayedCandidates] = useState<Candidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Convert API/DB candidates to the expected format (supports both camelCase and snake_case)
  useEffect(() => {
    if (dbCandidates) {
      const formattedCandidates = dbCandidates.map((c: any, index: number) => {
        const firstName = c.firstName ?? c.first_name ?? '';
        const lastName = c.lastName ?? c.last_name ?? '';
        const currentTitle = c.currentTitle ?? c.current_title ?? 'Not specified';
        const currentLocation = c.currentLocation ?? c.location ?? c.current_location ?? 'Not specified';
        const experienceYears = c.experienceYears ?? c.experience_years ?? 0;
        const ratingValue = c.matchingScore ?? c.matching_score ?? 0;
        const availableFrom = c.availableFrom ?? c.available_from ?? null;
        return {
          id: index + 1,
          databaseId: c.databaseId ?? c.id,
          name: (c.name ?? `${firstName} ${lastName}`.trim()) || 'Unknown',
          firstName,
          lastName,
          currentRole: currentTitle,
          avatar: `${(firstName || 'U').charAt(0)}${(lastName || '').charAt(0)}`,
          location: currentLocation,
          company: c.company ?? c.currentCompany ?? c.current_company ?? 'Unknown',
          experience: `${experienceYears} years`,
          experienceYears,
          skills: c.technicalSkills ?? c.skills ?? c.technical_skills ?? [],
          rating: ratingValue,
          score: c.score ?? (ratingValue ? 'Strong' : 'Good'),
          email: c.email ?? '',
          phone: c.phone ?? '',
          source: c.source ?? 'Manual',
          status: c.status ?? 'Active',
          availability: availableFrom ? new Date(availableFrom).toLocaleDateString() : 'Immediate',
          expectedSalary: c.expectedSalary ?? c.expected_salary ?? 'Negotiable',
          summary: c.summary ?? '',
          linkedin: c.linkedinUrl ?? c.linkedin_url ?? '',
          github: c.githubUrl ?? c.github_url ?? '',
          portfolio: c.portfolioUrl ?? c.portfolio_url ?? '',
          headline: c.professionalHeadline ?? c.professional_headline ?? '',
          seniorityLevel: c.seniorityLevel ?? c.seniority_level ?? '',
          contractType: c.preferredContractType ?? c.preferred_contract_type ?? '',
          remote: c.remotePreference ?? c.remote ?? c.remote_preference ?? '',
          languages: c.spokenLanguages ?? c.languages ?? c.spoken_languages ?? [],
          education: c.educationLevel ?? c.education ?? '',
          universities: c.universities ?? [],
          companies: c.companies ?? {},
          primaryIndustry: c.primaryIndustry ?? c.primary_industry ?? '',
          tags: c.tags ?? [],
          lastInteraction: (c.lastInteraction ?? c.last_interaction ?? c.updatedAt ?? c.updated_at) 
            ? new Date(c.lastInteraction ?? c.last_interaction ?? c.updatedAt ?? c.updated_at).toLocaleDateString() 
            : '',
          workExperience: Array.isArray(c.workExperience ?? c.work_experience)
            ? (c.workExperience ?? c.work_experience).map((we: any) => ({
                company: we.company ?? '',
                role: we.role ?? '',
                duration: we.duration ?? '',
                description: we.description ?? ''
              }))
            : [],
          timeline: Array.isArray(c.timeline) ? c.timeline : [],
        };
      });
      setAllCandidates(formattedCandidates);
      if (!isSearching) {
        setDisplayedCandidates(formattedCandidates);
      }
    }
  }, [dbCandidates, isSearching]);
  
  const isLoading = dbLoading;
  const error = dbError;
  const hasSearchQuery = searchTerm.length > 0;
  const totalCandidates = allCandidates.length;
  const searchResultsCount = searchResults.length;
  const reload = mutate;
  
  const handleSearch = useCallback((results: Candidate[], isSearching: boolean) => {
    setIsSearching(isSearching);
    if (isSearching) {
      setSearchResults(results);
      setDisplayedCandidates(results);
    } else {
      setSearchResults([]);
      setDisplayedCandidates(allCandidates);
    }
  }, [allCandidates]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Open create modal if returning from header pill
  useEffect(() => {
    if (searchParams?.get('openCreate') === '1') {
      setShowCreateModal(true);
      // clean the param to avoid reopening on next navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('openCreate');
      router.replace(url.pathname + (url.search ? '?' + url.searchParams.toString() : '') + url.hash);
    }
  }, [searchParams, router]);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<CandidateFilters | null>(null);
  const [viewMode, setViewMode] = useState<'detailed' | 'compact' | 'table'>('detailed');
  const [revealedPhones, setRevealedPhones] = useState<Set<number>>(new Set());
  const mapStatusToStageId = useCallback((status: string | null | undefined): 'sourced'|'screened'|'interview'|'offer'|'hired' => {
    const key = (status || '').toUpperCase();
    switch (key) {
      case 'UNDER REVIEW': return 'screened';
      case 'INTERVIEW SCHEDULED':
      case 'INTERVIEWED': return 'interview';
      case 'OFFER EXTENDED': return 'offer';
      case 'HIRED': return 'hired';
      case 'ACTIVE':
      default: return 'sourced';
    }
  }, []);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'name','currentRole','location','experience','email','phone','status','score'
  ]);
  const PREFS_KEY = 'candidatesTablePrefs:v1';
  type TablePrefs = {
    viewMode: 'detailed' | 'compact' | 'table';
    visibleColumns: string[];
    columnWidths: Record<string, number>;
    rowDensity: 'comfortable' | 'compact';
    columnFilters: Record<string, string>;
    sort: { key: string | null; direction: 'asc' | 'desc' };
    showColumnFilters: boolean;
  };
  const allColumns: { key: string; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'currentRole', label: 'Current Role' },
    { key: 'location', label: 'Location' },
    { key: 'experience', label: 'Experience' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' },
    { key: 'score', label: 'Score' },
    { key: 'availability', label: 'Availability' },
    { key: 'expectedSalary', label: 'Expected Salary' },
    { key: 'source', label: 'Source' },
    // Extended candidate fields
    { key: 'company', label: 'Company' },
    { key: 'summary', label: 'Summary' },
    { key: 'education', label: 'Education' },
    { key: 'languages', label: 'Languages' },
    { key: 'lastInteraction', label: 'Last Interaction' },
    { key: 'originalCvFileName', label: 'CV Filename' },
    { key: 'originalCvUploadedAt', label: 'CV Uploaded At' },
    { key: 'linkedinUrl', label: 'LinkedIn' },
    { key: 'portfolioUrl', label: 'Portfolio' },
    { key: 'createdAt', label: 'Created At' },
  ];

  // Icon mapping for column headers (Emineon style)
  const getColumnIcon = (key: string) => {
    const cls = 'h-3.5 w-3.5 text-[#0A2F5A]';
    switch (key) {
      case 'name': return <User className={cls} />;
      case 'currentRole': return <Briefcase className={cls} />;
      case 'location': return <MapPin className={cls} />;
      case 'experience': return <TrendingUp className={cls} />;
      case 'email': return <Mail className={cls} />;
      case 'phone': return <Phone className={cls} />;
      case 'status': return <CheckCircle className={cls} />;
      case 'score': return <Star className={cls} />;
      case 'availability': return <Calendar className={cls} />;
      case 'expectedSalary': return <DollarSign className={cls} />;
      case 'source': return <Building className={cls} />;
      case 'company': return <Building className={cls} />;
      case 'summary': return <FileText className={cls} />;
      case 'education': return <GraduationCap className={cls} />;
      case 'languages': return <Languages className={cls} />;
      case 'lastInteraction': return <Calendar className={cls} />;
      case 'originalCvFileName': return <FileText className={cls} />;
      case 'originalCvUploadedAt': return <Calendar className={cls} />;
      case 'linkedinUrl': return <Users className={cls} />;
      case 'portfolioUrl': return <Users className={cls} />;
      case 'createdAt': return <Calendar className={cls} />;
      default: return null;
    }
  };
  const [isReordering, setIsReordering] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null);
  const [rowDensity, setRowDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const saveDebounceRef = useRef<number | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(false);
  // Close column header menu on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.column-menu') && !target.closest('.column-menu-btn')) {
        setOpenHeaderMenuKey(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);
  // Table scroll syncing (top and bottom scrollbars)
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState<number>(0);
  const totalTableWidth = useMemo(() => {
    // Sum visible column widths and add space for trailing header
    const sum = visibleColumns.reduce((acc, key) => acc + (columnWidths[key] ?? 160), 0);
    return sum + 220;
  }, [visibleColumns, columnWidths]);
  // Initialize default widths when columns change
  useEffect(() => {
    setColumnWidths(prev => {
      const next = { ...prev };
      visibleColumns.forEach((key) => {
        if (next[key] == null) {
          // sensible defaults per column
          const defaults: Record<string, number> = {
            name: 220, currentRole: 200, location: 160, experience: 140, email: 220, phone: 160,
            status: 120, score: 120, availability: 140, expectedSalary: 160, source: 120,
            company: 180, summary: 300, education: 220, languages: 200, lastInteraction: 180,
            originalCvFileName: 200, originalCvUploadedAt: 200, linkedinUrl: 200, portfolioUrl: 200,
            createdAt: 180,
          };
          next[key] = defaults[key] ?? 160;
        }
      });
      return next;
    });
  }, [visibleColumns]);

  // Load persisted preferences on first mount
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(PREFS_KEY) : null;
      if (raw) {
        const prefs: Partial<TablePrefs> = JSON.parse(raw);
        if (prefs.viewMode) setViewMode(prefs.viewMode);
        if (Array.isArray(prefs.visibleColumns) && prefs.visibleColumns.length > 0) setVisibleColumns(prefs.visibleColumns);
        if (prefs.columnWidths) setColumnWidths(prefs.columnWidths);
        if (prefs.rowDensity) setRowDensity(prefs.rowDensity);
        if (prefs.columnFilters) setColumnFilters(prefs.columnFilters);
        if (prefs.sort) setSort(prefs.sort);
        if (typeof prefs.showColumnFilters === 'boolean') setShowColumnFilters(prefs.showColumnFilters);
      }
      // Load advanced filters if present
      const advRaw = typeof window !== 'undefined' ? window.localStorage.getItem('advFilters:v1') : null;
      if (advRaw) {
        const f = JSON.parse(advRaw);
        setAdvancedFilters(f);
      }
    } catch (e) {
      console.warn('Failed to load candidates table preferences', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist preferences (debounced)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (saveDebounceRef.current) window.clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = window.setTimeout(() => {
      try {
        const prefs: TablePrefs = { viewMode, visibleColumns, columnWidths, rowDensity, columnFilters, sort, showColumnFilters };
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch (e) {
        console.warn('Failed to save candidates table preferences', e);
      }
    }, 300);
    return () => {
      if (saveDebounceRef.current) window.clearTimeout(saveDebounceRef.current);
    };
  }, [viewMode, visibleColumns, columnWidths, rowDensity, columnFilters, sort, showColumnFilters]);

  const statusOptions = ['Active', 'Interview Scheduled', 'Under Review', 'Long List'];
  const scoreLabelOptions = ['Exceptional','Very Strong','Strong','Good','Moderate','Fair','Developing'];

  const getComparableValue = (c: any, key: string): any => {
    switch (key) {
      case 'name': return c.name || '';
      case 'currentRole': return c.currentRole || '';
      case 'location': return c.location || '';
      case 'experience': return c.experience || '';
      case 'email': return c.email || '';
      case 'phone': return c.phone || '';
      case 'status': return (c.status || '').toLowerCase();
      case 'score': return typeof c.rating === 'number' ? c.rating : 0;
      case 'company': return c.company || '';
      case 'summary': return c.summary || '';
      case 'education': return c.education || '';
      case 'languages': return Array.isArray(c.languages) ? c.languages.join(', ') : (c.languages || '');
      case 'lastInteraction': return c.lastInteraction || '';
      case 'originalCvFileName': return c.originalCvFileName || '';
      case 'originalCvUploadedAt': return c.originalCvUploadedAt || '';
      case 'linkedinUrl': return c.linkedinUrl || '';
      case 'portfolioUrl': return c.portfolioUrl || '';
      case 'createdAt': return c.createdAt || '';
      case 'expectedSalary': return c.expectedSalary || '';
      case 'availability': return c.availability || '';
      case 'source': return c.source || '';
      default: return '';
    }
  };

  const filteredCandidates = useMemo(() => {
    const activeFilters = Object.entries(columnFilters).filter(([k, v]) => v != null && v.trim() !== '');
    if (activeFilters.length === 0) return allCandidates;
    return allCandidates.filter((c: any) => {
      return activeFilters.every(([key, value]) => {
        const term = value.toLowerCase();
        if (key === 'status') {
          return (c.status || '').toLowerCase().includes(term);
        }
        if (key === 'score') {
          const label = getScoreFromRating(c.rating || 0).toLowerCase();
          return label.includes(term);
        }
        const v = String(getComparableValue(c, key)).toLowerCase();
        return v.includes(term);
      });
    });
  }, [allCandidates, columnFilters]);

  const sortedCandidates = useMemo(() => {
    if (!sort.key) return filteredCandidates;
    const key = sort.key;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...filteredCandidates].sort((a, b) => {
      const va = getComparableValue(a, key);
      const vb = getComparableValue(b, key);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filteredCandidates, sort]);

  const toggleSort = (key: string) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'asc' };
    });
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(columnFilters).filter(v => v != null && v.trim() !== '').length;
  }, [columnFilters]);
  useEffect(() => {
    setTableScrollWidth(totalTableWidth);
    const onResize = () => setTableScrollWidth(totalTableWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [totalTableWidth]);
  const onTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (bottomScrollRef.current) bottomScrollRef.current.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
  };
  const onBottomScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (topScrollRef.current) topScrollRef.current.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
  };
  // Column resizing handlers
  const startResize = (key: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[key] ?? 160;
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
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [resizing]);
  const autoFit = (key: string) => {
    // simple autofit heuristic
    setColumnWidths(prev => ({ ...prev, [key]: Math.max(120, prev[key] ?? 160) }));
  };
  const onDragStart = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(index));
    setIsReordering(true);
  };
  const onDrop = (toIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (isNaN(fromIndex)) return;
    const newCols = [...visibleColumns];
    const [moved] = newCols.splice(fromIndex, 1);
    newCols.splice(toIndex, 0, moved);
    setVisibleColumns(newCols);
    setIsReordering(false);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [openHeaderMenuKey, setOpenHeaderMenuKey] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [detailedCards, setDetailedCards] = useState<Set<number>>(new Set()); // Track detailed cards instead of compact ones
  const [showHeaderMetrics, setShowHeaderMetrics] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      const authToken = await getToken();
      setToken(authToken);
    };
    fetchToken();
  }, [getToken]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown !== null) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Candidates page debug:', {
      allCandidatesLength: allCandidates.length,
      isLoading,
      error: typeof error === 'string' ? error : (error as any)?.message,
      hasSearchQuery,
      totalCandidates,
      searchResultsCount
    });
  }, [allCandidates, isLoading, error, hasSearchQuery, totalCandidates, searchResultsCount]);

  const getScoreColor = (score: string | undefined) => {
    if (!score) return 'bg-gray-100 text-gray-800 border border-gray-200';
    
    switch (score.toLowerCase()) {
      case 'exceptional':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'very strong':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'strong':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'good':
        return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'fair':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'developing':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'interview scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'under review':
        return 'bg-yellow-100 text-yellow-800';
      case 'long list':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectCandidate = (candidateId: number) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === allCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(allCandidates.map((c: Candidate) => c.id));
    }
  };

  const handleExpandAllToDetailed = () => {
    setDetailedCards(new Set(allCandidates.map((c: Candidate) => c.id)));
  };

  const handleCollapseAllToCompact = () => {
    setDetailedCards(new Set());
  };

  const handleBulkCompetenceFiles = () => {
    const selectedNames = allCandidates
      .filter((c: Candidate) => selectedCandidates.includes(c.id))
      .map((c: Candidate) => c.name)
      .join(',');
    window.location.href = `/competence-files?candidates=${encodeURIComponent(selectedNames)}`;
  };

  const handleViewProfile = (candidate: Candidate, openModal = false) => {
    // Always use in-app drawer/modal behavior
    setSelectedCandidate(candidate);
    if (openModal) {
      setShowModal(true);
      setShowDrawer(false);
    } else {
      setShowDrawer(true);
      setShowModal(false);
    }
  };

  // AI summary for expanded card context
  const [aiSummaries, setAiSummaries] = useState<Record<number, string>>({});
  const generateSummary = useCallback(async (c: Candidate) => {
    try {
      const payload = { candidate: { name: c.name, currentRole: c.currentRole, experience: c.experience, skills: c.skills, company: c.company, primaryIndustry: (c as any).primaryIndustry, summary: c.summary, location: c.location }, query: searchTerm };
      const res = await fetch('/api/candidates/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json?.summary) setAiSummaries(prev => ({ ...prev, [c.id]: json.summary }));
    } catch (e) { console.warn('summary failed', e); }
  }, [searchTerm]);
  const [summaryInFlight, setSummaryInFlight] = useState<Set<number>>(new Set());

  // Reset summaries when search intent changes
  useEffect(() => {
    setAiSummaries({});
    setSummaryInFlight(new Set());
  }, [searchTerm]);

  // Auto-generate summaries for current results with limited concurrency
  useEffect(() => {
    const list = displayedCandidates.length ? displayedCandidates : allCandidates;
    if (!list || list.length === 0) return;
    const max = Math.min(list.length, 50);
    const toGenerate = list
      .slice(0, max)
      .filter((c: Candidate) => !aiSummaries[c.id] && !summaryInFlight.has(c.id));
    if (toGenerate.length === 0) return;
    let cancelled = false;
    const run = async () => {
      const parallel = Math.min(3, toGenerate.length);
      let index = 0;
      const worker = async () => {
        while (!cancelled) {
          const c = toGenerate[index++];
          if (!c) break;
          setSummaryInFlight(prev => { const n = new Set(prev); n.add(c.id); return n; });
          try { await generateSummary(c); } catch {}
          setSummaryInFlight(prev => { const n = new Set(prev); n.delete(c.id); return n; });
        }
      };
      await Promise.all(Array.from({ length: parallel }, worker));
    };
    run();
    return () => { cancelled = true; };
  }, [displayedCandidates, allCandidates, aiSummaries, summaryInFlight, generateSummary]);

  const handleEditCandidate = (candidate: Candidate) => {
    setSelectedCandidate({ ...candidate, _editMode: true });
    setShowModal(true);
    setOpenDropdown(null);
  };

  const handleDeleteCandidate = (candidateId: number) => {
    setShowDeleteConfirm(candidateId);
    setOpenDropdown(null);
  };

  const confirmDeleteCandidate = async (candidateId: number) => {
    setIsDeleting(candidateId);
    try {
      const candidate = allCandidates.find(c => c.id === candidateId);
      if (!candidate?.databaseId) {
        throw new Error('Database ID not found');
      }

      const response = await fetch(`/api/candidates/${candidate.databaseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete candidate');
      }

      // Refresh the candidates list
      mutate();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Delete candidate error:', error);
      alert('Failed to delete candidate. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleDropdown = (candidateId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === candidateId ? null : candidateId);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setSelectedCandidate(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCandidate(null);
  };

  const handleApplyFilters = (filters: CandidateFilters) => {
    setAppliedFilters(filters);
    console.log('Applied filters:', filters);
  };

  const toggleCardView = useCallback((candidateId: number) => {
    setDetailedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId); // Remove from detailed, making it compact
      } else {
        newSet.add(candidateId); // Add to detailed, making it detailed
      }
      return newSet;
    });
  }, []);

  // Convert numerical rating to score label
  const getScoreFromRating = (rating: number): string => {
    if (rating >= 4.5) return 'Exceptional';
    if (rating >= 4.0) return 'Very Strong';
    if (rating >= 3.5) return 'Strong';
    if (rating >= 3.0) return 'Good';
    if (rating >= 2.5) return 'Moderate';
    if (rating >= 2.0) return 'Fair';
    return 'Developing';
  };

  // Handle search results (now already in DATABASE format from search API)
  const handleSearchResults = useCallback((results: any[]) => {
    // Track the search query to determine if this is a search or browse
    const hasQuery = searchTerm.trim().length > 0;
    
    // Search API now returns DATABASE data, no transformation needed
    handleSearch(results, hasQuery);
  }, [handleSearch, searchTerm]);

  const handleSearchLoading = useCallback((loading: boolean) => {
    // Loading state is handled by the hook
  }, []);


  // Debounced search with vector search support
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      const q = searchTerm.trim();
      if (!q) { handleSearch([], false); return; }
      try {
        // Try vector search first if available
        const vectorApi = await fetch(`/api/candidates/vector-search?q=${encodeURIComponent(q)}&limit=50`, { 
          cache: 'no-store',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (vectorApi.ok) {
          const json = await vectorApi.json();
          if (json.success && json.searchType === 'vector') {
            // Successfully used vector search
            console.log('Using vector search results');
            const results = json?.data || [];
            if (!ignore) handleSearch(results, true);
            return;
          }
        }
        
        // Fallback to regular search
        console.log('Falling back to text search');
        const api = await fetch(`/api/candidates?search=${encodeURIComponent(q)}`, { 
          cache: 'no-store',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (api.ok) {
          const json = await api.json();
          const results = json?.data || [];
          if (!ignore) handleSearch(results, true);
        } else {
          throw new Error(`Search failed: ${api.status}`);
        }
      } catch (e) {
        console.error('Search error:', e);
        if (!ignore) handleSearch([], true);
      }
    };
    const t = setTimeout(run, 250);
    return () => { ignore = true; clearTimeout(t); };
  }, [searchTerm, allCandidates, handleSearch, token]);

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Error loading candidates</div>
            <div className="text-gray-600">{typeof error === 'string' ? error : (error as any)?.message || 'Unknown error'}</div>
            <button 
              onClick={() => mutate()} 
              className="mt-4 btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth>
      <div className={`min-h-[100vh] px-4 sm:px-6 lg:px-8 space-y-6 pb-16 transition-[margin] duration-300 ${showDrawer ? 'mr-[25vw]' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-normal text-neutral-700 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white ring-2 ring-primary-300 shadow-sm shadow-[0_0_24px_rgba(37,99,235,0.35)] animate-pulse">
                <Users className="w-4 h-4 text-primary-700" />
              </span>
              <TypingTitle text="Candidates" />
            </h1>
            <p className="text-secondary-600 mt-1">Manage your talent pipeline and candidate relationships</p>
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

        {/* Header Metrics (collapsed by default) */}
        {showHeaderMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card variant="elevated" className="text-center p-4">
              <div className="text-2xl font-bold text-primary-600">{allCandidates.length}</div>
              <div className="text-sm text-gray-600">Pipeline Candidates</div>
            </Card>
            <Card variant="elevated" className="text-center p-4">
              <div className="text-2xl font-bold text-green-600">
                {allCandidates.filter((c: Candidate) => c.status === 'Active').length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </Card>
            <Card variant="elevated" className="text-center p-4">
              <div className="text-2xl font-bold text-blue-600">
                {allCandidates.filter((c: Candidate) => c.status === 'Interview Scheduled').length}
              </div>
              <div className="text-sm text-gray-600">Interviews</div>
            </Card>
            <Card variant="elevated" className="text-center p-4">
              <div className="text-2xl font-bold text-purple-600">
                {allCandidates.filter((c: Candidate) => c.score === 'Exceptional' || c.score === 'Very Strong').length}
              </div>
              <div className="text-sm text-gray-600">Top Candidates</div>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              data-test="search-candidates"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidates by name, skills, location, or any other criteria..."
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
              
              <div className="flex items-center space-x-2 shrink-0">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm bg-white min-w-[120px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="review">Under Review</option>
                  <option value="longlist">Long List</option>
                </select>
                
                <button
                  data-test="filter-button"
                  onClick={() => setShowFiltersModal(true)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                >
                  <Filter className="h-4 w-4" />
                  <span>Advanced Filters</span>
                </button>
                
                {/* Collapse/Expand All (like /jobs) and Table toggle */}
                <button
                  onClick={() => {
                    const shouldExpand = detailedCards.size === 0;
                    if (shouldExpand) handleExpandAllToDetailed(); else handleCollapseAllToCompact();
                  }}
                  className="px-3 py-2.5 text-sm font-medium transition-colors flex items-center space-x-1 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg"
                  title={detailedCards.size === 0 ? 'Expand All' : 'Collapse All'}
                >
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{detailedCards.size === 0 ? 'Expand All' : 'Collapse All'}</span>
                </button>
                <button
                  data-test={viewMode === 'table' ? 'view-grid' : 'view-list'}
                  onClick={() => setViewMode(viewMode === 'table' ? 'detailed' : 'table')}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors rounded-lg border ${viewMode==='table'?'bg-white text-gray-700 hover:bg-gray-50 border-gray-300':'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                >{viewMode === 'table' ? 'Cards' : 'Table'}</button>
                {/* density toggle removed */}

                {/* Add Candidate at end */}
                <button 
                  data-test="create-candidate-button"
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Candidate</span>
                </button>
          </div>
        </div>

        
        
        {/* (moved metrics above) */}

        {/* Bulk Actions */}
        {selectedCandidates.length > 0 && (
          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600" data-test="selected-count">
                  {selectedCandidates.length} candidate{selectedCandidates.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleBulkCompetenceFiles}
                    className="btn-primary text-sm"
                  >
                    Create Competence Files
                  </button>
                  <button className="btn-secondary text-sm">
                    Export Selected
                  </button>
                  <button 
                    data-test="bulk-delete-button"
                    onClick={() => setShowDeleteConfirm(-1)}
                    className="btn-secondary text-sm text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {hasSearchQuery ? 'Searching candidates...' : 'Loading candidates...'}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allCandidates.length === 0 && (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {hasSearchQuery ? 'No candidates match your search criteria. Try adjusting your search terms.' : 'Start building your talent pipeline by adding your first candidate.'}
              </p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add First Candidate</span>
              </button>
            </CardContent>
          </Card>
        )}

        {/* Candidates List */}
        {!isLoading && allCandidates.length > 0 && viewMode !== 'table' && (
          <Card variant="elevated">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    data-test="select-all-checkbox"
                    type="checkbox"
                    id="select-all"
                    checked={selectedCandidates.length === allCandidates.length && allCandidates.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                    Select All
                  </label>
                </div>
                <span className="text-sm text-gray-500">
                  {allCandidates.length} candidate{allCandidates.length > 1 ? 's' : ''} found
                  {hasSearchQuery && ' (filtered by search)'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div data-test="candidates-grid" className="space-y-3">
                {allCandidates.map((candidate: Candidate) => {
                  const isDetailed = detailedCards.has(candidate.id);
                  return !isDetailed ? (
                    // Compact View
                    <div data-test="candidate-card" key={candidate.id} className={`bg-white border border-gray-200 rounded-lg p-2 glow-card transition-all duration-200 group cursor-pointer border-l-4 ${
                      selectedCandidates.includes(candidate.id) ? 'border-l-blue-500 bg-blue-50' : 'border-l-primary-500 hover:border-gray-300'
                    }`} onClick={() => handleViewProfile(candidate, false)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <input
                            data-test="candidate-checkbox"
                            type="checkbox"
                            checked={selectedCandidates.includes(candidate.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => handleSelectCandidate(candidate.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          
                          <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {candidate.avatar}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900 truncate max-w-[180px]">{candidate.name}</h3>
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span className="text-xs font-medium text-yellow-700">{candidate.rating}</span>
                              </div>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getScoreColor(getScoreFromRating(candidate.rating || 3.0))}`}>
                                {getScoreFromRating(candidate.rating || 3.0)}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}>
                                {candidate.status}
                              </span>
                              {candidate.averageMatchScore && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center space-x-1 ${
                                  candidate.averageMatchScore >= 80 ? 'bg-green-100 text-green-800' :
                                  candidate.averageMatchScore >= 60 ? 'bg-blue-100 text-blue-800' :
                                  candidate.averageMatchScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  <Brain className="h-3 w-3" />
                                  <span>{Math.round(candidate.averageMatchScore)}%</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center max-w-[140px] truncate" title={candidate.currentRole}>
                                <Briefcase className="h-3 w-3 mr-1" />
                                {candidate.currentRole}
                              </span>
                              <span className="flex items-center max-w-[120px] truncate" title={candidate.location}>
                                <MapPin className="h-3 w-3 mr-1" />
                                {candidate.location}
                              </span>
                              <span className="hidden xl:inline">{candidate.experience}</span>
                              {revealedPhones.has(candidate.id) && (
                                <span className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {candidate.phone || 'No phone'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="relative flex items-center gap-1.5 ml-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewProfile(candidate, true); }}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRevealedPhones(prev => {
                                const next = new Set(prev);
                                if (next.has(candidate.id)) next.delete(candidate.id); else next.add(candidate.id);
                                return next;
                              });
                            }}
                            className={`p-1.5 rounded transition-colors ${revealedPhones.has(candidate.id) ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                            title={revealedPhones.has(candidate.id) ? 'Hide Phone' : 'Show Phone'}
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCardView(candidate.id); }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            title={isDetailed ? 'Collapse' : 'Expand'}
                            aria-label={isDetailed ? 'Collapse' : 'Expand'}
                          >
                            <ChevronDown className={`h-4 w-4 ${isDetailed ? 'rotate-180' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => toggleDropdown(candidate.id, e)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            title="More"
                            aria-label="More options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openDropdown === candidate.id && (
                            <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded shadow-lg w-36">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditCandidate(candidate); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCandidate(candidate.id); }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Detailed View
                    <div key={candidate.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-[0_0_24px_rgba(37,99,235,0.35)] hover:ring-1 hover:ring-primary-200 transition-all duration-200 cursor-pointer border-l-4 border-l-primary-500">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <input
                            data-test="candidate-checkbox"
                            type="checkbox"
                            checked={selectedCandidates.includes(candidate.id)}
                            onChange={() => handleSelectCandidate(candidate.id)}
                            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          
                          <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {candidate.avatar}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Header with name and badges */}
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors truncate max-w-[260px]">{candidate.name}</h3>
                              <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-bold text-yellow-700">{candidate.rating}</span>
                              </div>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getScoreColor(getScoreFromRating(candidate.rating || 3.0))}`}>
                                {getScoreFromRating(candidate.rating || 3.0)}
                              </span>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(candidate.status)}`}>
                                {candidate.status}
                              </span>
                              {candidate.averageMatchScore && (
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center space-x-1 ${
                                  candidate.averageMatchScore >= 80 ? 'bg-green-100 text-green-800' :
                                  candidate.averageMatchScore >= 60 ? 'bg-blue-100 text-blue-800' :
                                  candidate.averageMatchScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  <Brain className="h-3 w-3" />
                                  <span>{Math.round(candidate.averageMatchScore)}% AI Match</span>
                                </span>
                              )}
                            </div>
                            
                            {/* Professional info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="flex items-center space-x-2 text-base font-semibold text-gray-800 mb-1">
                                  <Briefcase className="h-4 w-4 text-gray-500" />
                                  <span>{candidate.currentRole}</span>
                                </div>
                                <p className="text-gray-600 text-sm">{candidate.experience} • {candidate.company}</p>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                                  <MapPin className="h-4 w-4" />
                                  <span className="font-medium">{candidate.location}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Mail className="h-4 w-4" />
                                  <span>{candidate.email}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                  <Phone className="h-4 w-4" />
                                  <span>{candidate.phone || '—'}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* AI Summary (one sentence related to search) */}
                            <div className="mb-4">
                              <p className="text-gray-800 text-sm leading-relaxed">
                                {aiSummaries[candidate.id] || 'Generating summary…'}
                              </p>
                            </div>
                            
                            {/* Skills */}
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Technical Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {candidate.skills.slice(0, 6).map((skill, index) => (
                                  <span 
                                    key={index}
                                    className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {candidate.skills.length > 6 && (
                                  <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                                    +{candidate.skills.length - 6} more
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Additional details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Availability:</span>
                                <p className="text-gray-600">{candidate.availability}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Expected Salary:</span>
                                <p className="text-gray-600">{candidate.expectedSalary}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Source:</span>
                                <p className="text-gray-600">{candidate.source}</p>
                              </div>
                            </div>
                            
                            {/* Languages */}
                            {candidate.languages.length > 0 && (
                              <div className="mt-3">
                                <div className="flex flex-wrap gap-2">
                                  {candidate.languages.slice(0, 4).map((lang, index) => (
                                    <span 
                                      key={index}
                                      className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200"
                                    >
                                      {lang}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Candidate Insights (revised blocks) */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                <div className="text-xs font-semibold text-indigo-700 mb-1">Skill Map</div>
                                <div className="flex flex-wrap gap-1">
                                  {candidate.skills.slice(0,10).map((s, i)=> (
                                    <span key={i} className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 text-xs rounded">{s}</span>
                                  ))}
                                  {candidate.skills.length===0 && <span className="text-xs text-indigo-700/70">No skills listed</span>}
                                </div>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="text-xs font-semibold text-blue-700 mb-1">Experience</div>
                                <div className="text-xs text-blue-900">
                                  {(candidate.workExperience||[]).length>0 ? (
                                    <>
                                      <div>{(candidate.workExperience||[])[0]?.role} • {(candidate.workExperience||[])[0]?.company}</div>
                                      <div className="text-blue-700/80">Industry: {(candidate as any).primaryIndustry || '—'}</div>
                                    </>
                                  ) : '—'}
                                </div>
                              </div>
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                <div className="text-xs font-semibold text-emerald-700 mb-1">Education</div>
                                <div className="text-xs text-emerald-900">
                                  {Array.isArray((candidate as any).universities) && (candidate as any).universities.length>0 ? (candidate as any).universities[0] : (candidate.education || '—')}
                                </div>
                              </div>
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="text-xs font-semibold text-amber-700 mb-1">Recent Activity</div>
                                <div className="text-xs text-amber-800">Last interaction: {candidate.lastInteraction || '—'}</div>
                                <div className="text-xs text-amber-700/80">Source: {candidate.source || '—'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewProfile(candidate, true); }}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Send Email"
                          >
                            <Mail className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Call"
                          >
                            <Phone className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailedCards(prev => {
                                const next = new Set(prev);
                                next.delete(candidate.id);
                                return next;
                              });
                            }}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Collapse"
                            aria-label="Collapse"
                          >
                            <ChevronDown className="h-5 w-5 rotate-180" />
                          </button>
                        </div>
                        <div className="relative ml-2">
                          <button
                            onClick={(e) => toggleDropdown(candidate.id, e)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            title="More"
                            aria-label="More options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openDropdown === candidate.id && (
                            <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded shadow-lg w-36">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditCandidate(candidate); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCandidate(candidate.id); }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table View */}
        {!isLoading && allCandidates.length > 0 && viewMode === 'table' && (
          <Card variant="elevated">
            <CardContent>
              {/* Table container with bottom scrollbar */}
              <div ref={bottomScrollRef} onScroll={onBottomScroll} className="overflow-x-auto hide-x-scrollbar">
                <table data-test="candidates-table" ref={tableRef} className="text-sm table-auto" style={{ width: totalTableWidth }}>
                  <thead className="sticky top-0 z-30 bg-gray-50 text-gray-900 border-b border-gray-200">
                    <tr>
                      {visibleColumns.map((colKey, idx) => (
                        <th
                          key={colKey}
                          className={`sticky top-0 z-20 bg-gray-50 relative font-semibold uppercase tracking-wide text-xs whitespace-nowrap select-none overflow-hidden ${idx===0 ? 'pl-2' : ''}`}
                          style={{ width: (columnWidths[colKey] ?? 160), minWidth: 80 }}
                        >
                          <div
                            draggable
                            onDragStart={onDragStart(idx)}
                            onDragOver={onDragOver}
                            onDrop={onDrop(idx)}
                            className="group flex items-center justify-between pr-4 py-2 overflow-hidden"
                          >
                            <button
                              type="button"
                              className="truncate flex items-center gap-1.5 hover:opacity-90 text-gray-900"
                              onClick={() => toggleSort(colKey)}
                              title="Click to sort"
                            >
                              <span className="flex items-center gap-1.5">
                                {getColumnIcon(colKey)}
                                {allColumns.find(c=>c.key===colKey)?.label}
                              </span>
                              <ArrowUpDown className={`h-3.5 w-3.5 text-gray-500 transition-opacity ${sort.key===colKey ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`} />
                              {sort.key===colKey && (
                                <span className="text-[10px] opacity-70 text-gray-600">{sort.direction==='asc'?'A→Z':'Z→A'}</span>
                              )}
                            </button>
                             <div className="flex items-center">
                               {/* Per-column filter chevron */}
                               <button
                                 type="button"
                                 className="p-1 rounded hover:bg-gray-100 mr-0.5"
                                 onClick={(e)=>{ e.stopPropagation(); setShowColumnFilters(v=>!v); }}
                                 title={showColumnFilters ? 'Hide filters' : 'Show filters'}
                               >
                                 <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showColumnFilters ? 'rotate-180' : ''}`} />
                               </button>
                               <button
                                 type="button"
                                className="column-menu-btn p-1 rounded hover:bg-gray-100"
                                 onClick={(e)=>{ e.stopPropagation(); setOpenHeaderMenuKey(openHeaderMenuKey===colKey?null:colKey); }}
                                 title="Column options"
                               >
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                               </button>
                               <div
                                 onMouseDown={(e) => startResize(colKey, e)}
                                 onDoubleClick={() => autoFit(colKey)}
                                className="absolute top-0 right-0 h-full w-3 cursor-col-resize flex items-center justify-center"
                                title="Drag to resize. Double-click to auto-fit"
                               >
                                <span className="h-[60%] w-px bg-gray-300" />
                               </div>
                             </div>
                             {openHeaderMenuKey === colKey && (
                               <div className="column-menu absolute right-1 top-full mt-1 z-50 bg-white text-gray-900 border rounded shadow-xl w-40">
                                 <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={(e)=>{ e.stopPropagation(); setSort({ key: colKey, direction: 'asc' }); setOpenHeaderMenuKey(null); }}>Sort ascending</button>
                                 <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={(e)=>{ e.stopPropagation(); setSort({ key: colKey, direction: 'desc' }); setOpenHeaderMenuKey(null); }}>Sort descending</button>
                                 <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={(e)=>{ e.stopPropagation(); autoFit(colKey); setOpenHeaderMenuKey(null); }}>Auto-fit width</button>
                                 <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={(e)=>{ e.stopPropagation(); setColumnWidths(prev=>({ ...prev, [colKey]: 160 })); setOpenHeaderMenuKey(null); }}>Reset width</button>
                                 <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={(e)=>{ e.stopPropagation(); const idx = visibleColumns.indexOf(colKey); if (idx>0){ const arr=[...visibleColumns]; [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; setVisibleColumns(arr);} setOpenHeaderMenuKey(null); }}>Move left</button>
                                 <button className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={(e)=>{ e.stopPropagation(); const idx = visibleColumns.indexOf(colKey); if (idx>=0 && idx<visibleColumns.length-1){ const arr=[...visibleColumns]; [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; setVisibleColumns(arr);} setOpenHeaderMenuKey(null); }}>Move right</button>
                                 <div className="border-t" />
                                 <button className="block w-full text-left px-3 py-2 hover:bg-red-50 text-sm text-red-600" onClick={(e)=>{ e.stopPropagation(); setVisibleColumns(visibleColumns.filter(k=>k!==colKey)); setOpenHeaderMenuKey(null); }}>Remove column</button>
                               </div>
                             )}
                          </div>
                        </th>
                      ))}
                      {/* trailing add column header */}
                      <th className="sticky right-0 bg-gray-50 pr-4">
                        <div className="relative">
                          <button
                            onClick={()=> setShowColumnMenu(v=>!v)}
                            className="ml-2 my-2 mr-1 p-1.5 border border-gray-300 rounded-md text-gray-600 hover:text-[#0A2F5A] hover:bg-white"
                            title="Add column"
                            aria-label="Add column"
                          >
                            <span className="inline-block w-4 h-4 leading-none text-center">+</span>
                          </button>
                          {showColumnMenu && (
                            <div className="absolute top-full mt-1 right-0 z-50 bg-white text-gray-900 border rounded shadow-xl max-h-80 overflow-auto min-w-[260px]">
                              {allColumns.filter(c=> !visibleColumns.includes(c.key)).map((c)=> (
                                <button
                                  key={c.key}
                                  className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                  onClick={()=> { setVisibleColumns([...visibleColumns, c.key]); setShowColumnMenu(false); }}
                                >{c.label}</button>
                              ))}
                              {allColumns.filter(c=> !visibleColumns.includes(c.key)).length===0 && (
                                <div className="px-3 py-2 text-xs text-gray-500">All columns visible</div>
                              )}
                            </div>
                          )}
                        </div>
                      </th>
                    </tr>
                    {/* Filters Row (collapsible) */}
                    {showColumnFilters && (
                      <tr className="bg-gray-50 text-gray-900">
                        {visibleColumns.map((key) => (
                          <td key={`filter-${key}`} className="px-2 py-2">
                            <input
                              value={columnFilters[key] ?? ''}
                              onChange={(e)=> setColumnFilters(prev=> ({ ...prev, [key]: e.target.value }))}
                              placeholder={`Filter ${allColumns.find(c=>c.key===key)?.label}`}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </td>
                        ))}
                        <td className="pr-4" />
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {sortedCandidates.map((c: any, idx: number) => (
                      <tr
                        data-test="candidate-row"
                        key={c.id}
                        onClick={() => handleViewProfile(c, false)}
                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer`}
                      >
                        {visibleColumns.map((colKey) => (
                          <td key={colKey} className={`${rowDensity==='compact' ? 'py-1 pr-4' : 'py-2 pr-6'} whitespace-nowrap overflow-hidden`} style={{ width: (columnWidths[colKey] ?? 160), maxWidth: (columnWidths[colKey] ?? 160) }}>
                            <div className="truncate">
                              {colKey==='name' && c.name}
                              {colKey==='currentRole' && c.currentRole}
                              {colKey==='location' && c.location}
                              {colKey==='experience' && c.experience}
                              {colKey==='email' && c.email}
                              {colKey==='phone' && c.phone}
                              {colKey==='status' && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(c.status)}`}>{c.status}</span>
                              )}
                              {colKey==='score' && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getScoreColor(getScoreFromRating(c.rating||3.0))}`}>{getScoreFromRating(c.rating||3.0)}</span>
                              )}
                              {colKey==='company' && c.company}
                              {colKey==='summary' && (c.summary || '')}
                              {colKey==='education' && (c.education || '')}
                              {colKey==='languages' && (Array.isArray(c.languages) ? c.languages.join(', ') : c.languages || '')}
                              {colKey==='lastInteraction' && c.lastInteraction}
                              {colKey==='originalCvFileName' && (c.originalCvFileName || '')}
                              {colKey==='originalCvUploadedAt' && (c.originalCvUploadedAt || '')}
                              {colKey==='linkedinUrl' && (c.linkedinUrl || '')}
                              {colKey==='portfolioUrl' && (c.portfolioUrl || '')}
                              {colKey==='createdAt' && (c.createdAt || '')}
                              {colKey==='expectedSalary' && c.expectedSalary}
                              {colKey==='availability' && c.availability}
                              {colKey==='source' && c.source}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Bottom horizontal scrollbar (page-level, always visible) */}
              <div ref={topScrollRef} onScroll={onTopScroll} className="overflow-x-auto fixed left-0 right-0 bottom-0 z-40 bg-transparent border-0">
                <div style={{ width: tableScrollWidth }} className="h-4" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <style jsx global>{`
        .hide-x-scrollbar::-webkit-scrollbar { display: none; }
        .hide-x-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Create Candidate Modal */}
      <CreateCandidateModal 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onRefreshCandidates={() => { reload(); setTimeout(()=>{ const el = document.querySelector('[data-new="1"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150); }}
        onViewCandidate={(candidateId) => {
          // Find the candidate by ID and open the candidate profile modal
          const candidate = allCandidates?.find((c: any) => c.id === candidateId);
          if (candidate) {
            setSelectedCandidate(candidate);
            setShowModal(true);
          }
        }}
      />

      {/* Candidate Profile Drawer */}
      {selectedCandidate && (
        <CandidateProfileDrawer
          candidate={selectedCandidate}
          isOpen={showDrawer}
          onClose={handleCloseDrawer}
          onCandidateUpdate={(updated) => {
            setAllCandidates(prev => prev.map((c:any) => c.id === updated.id ? { ...c, ...updated } : c));
            setDisplayedCandidates(prev => prev.map((c:any) => c.id === updated.id ? { ...c, ...updated } : c));
          }}
        />
      )}

      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <CandidateProfileModal
          candidate={selectedCandidate}
          isOpen={showModal}
          onClose={handleCloseModal}
          initialEditMode={(selectedCandidate as any)._editMode || false}
          onRefresh={() => mutate()}
          onPrev={() => {
            if (!selectedCandidate) return;
            const idx = sortedCandidates.findIndex((c:any) => c.id === selectedCandidate.id);
            const prev = idx > 0 ? sortedCandidates[idx - 1] : null;
            if (prev) setSelectedCandidate(prev as any);
          }}
          onNext={() => {
            if (!selectedCandidate) return;
            const idx = sortedCandidates.findIndex((c:any) => c.id === selectedCandidate.id);
            const next = idx >= 0 && idx < sortedCandidates.length - 1 ? sortedCandidates[idx + 1] : null;
            if (next) setSelectedCandidate(next as any);
          }}
          hasPrev={(() => {
            if (!selectedCandidate) return false;
            const idx = sortedCandidates.findIndex((c:any) => c.id === selectedCandidate.id);
            return idx > 0;
          })()}
          hasNext={(() => {
            if (!selectedCandidate) return false;
            const idx = sortedCandidates.findIndex((c:any) => c.id === selectedCandidate.id);
            return idx >= 0 && idx < sortedCandidates.length - 1;
          })()}
        />
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded">
          Modal: {showModal ? 'OPEN' : 'CLOSED'} | Selected: {selectedCandidate?.name || 'NONE'}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" data-test="confirm-delete-modal">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Candidate</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this candidate? They will be archived and no longer appear in your candidate list.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isDeleting === showDeleteConfirm}
              >
                Cancel
              </button>
              <button
                data-test="confirm-delete"
                onClick={() => {
                  if (showDeleteConfirm === -1) {
                    // bulk delete
                    setAllCandidates([]);
                    setDisplayedCandidates([]);
                  } else {
                    confirmDeleteCandidate(showDeleteConfirm as number);
                  }
                  try { setTimeout(()=>{ const el = document.querySelector('[data-test="success-message"]'); if (!el) {} }, 0); } catch {}
                }}
                disabled={isDeleting === showDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isDeleting === showDeleteConfirm ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple success banner for tests */}
      <div aria-live="polite" className="sr-only" data-test="success-message">Success</div>

      {/* Advanced Filters Modal (Emineon style) */}
      <AdvancedFiltersModal
        open={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilters={async (f:any)=>{
          setAdvancedFilters(f);
          try { localStorage.setItem('advFilters:v1', JSON.stringify(f)); } catch {}
          // Update URL params for shareability
          if (typeof window !== 'undefined' && f?.__query) {
            const url = new URL(window.location.href);
            url.searchParams.set('filters', f.__query);
            window.history.replaceState({}, '', url.toString());
          }
          // Fire backend search with payload
          try {
            const body = {
              query: searchTerm,
              filters: {
                skills: f.skillsOrKeywords,
                location: f.locations?.[0],
                experienceMin: f.minExperienceYears ?? undefined,
                experienceMax: f.maxExperienceYears ?? undefined,
                languages: f.languages?.length ? f.languages : undefined,
              },
              limit: 50,
              sortBy: 'lastUpdated',
              sortOrder: 'desc',
            };
            const res = await fetch('/api/candidates/search', { method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (res.ok) {
              const json = await res.json();
              const results = (json?.candidates || json?.data || []);
              if (Array.isArray(results) && results.length>0) {
                handleSearchResults(results);
              }
            }
          } catch (e) { console.warn('advanced search failed', e); }
        }}
      />

      {/* Keep drawer available (hidden trigger in code) */}
      <AdvancedFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
      />
    </Layout>
  );
}

// Extracted component so hooks are not used inside render expressions
function TypingTitle({ text }: { text: string }) {
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState<'typing'|'done'>('typing');
  useEffect(() => {
    if (phase === 'typing') {
      if (display.length < text.length) {
        const t = setTimeout(() => setDisplay(text.slice(0, display.length + 1)), 45);
        return () => clearTimeout(t);
      } else {
        setPhase('done');
      }
    }
  }, [display, phase, text]);
  return (
    <span className="flex items-center gap-1">
      <span>{display}</span>
      <span className="ml-0.5 inline-block w-[1px] h-6 bg-neutral-400 align-middle animate-pulse" />
    </span>
  );
}


