'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { X, Upload, FileText, Linkedin, User, Brain, CheckCircle, UserPlus, Loader2, Paperclip, Mic, MicOff, Eye, EyeOff, Plus, Trash2, Tag, Briefcase, Users, Star, Save, AlertCircle, Building, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Job {
  id: string;
  title: string;
  company: string;
  status: string;
  department?: string;
  location?: string;
}

interface TalentPool {
  id: string;
  name: string;
  count: number;
}

interface CreatedCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentTitle: string;
  currentLocation: string;
}

interface CreateCandidateModalProps {
  open: boolean;
  onClose: () => void;
  jobId?: string; // Optional job ID to automatically assign candidate to
  onCandidateCreated?: (candidate: CreatedCandidate) => void; // Callback when candidate is created
  onViewCandidate?: (candidateId: string) => void; // Callback to open candidate modal
  onRefreshCandidates?: () => void; // Callback to refresh candidates list
}

type Step = 'intake' | 'parsing' | 'review' | 'assign';

interface ParsedCandidate {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  timezone?: string;
  
  // Professional Profile
  currentTitle: string;
  professionalHeadline?: string;
  currentCompany?: string;
  currentLocation: string;
  summary: string;
  experienceYears: number;
  seniorityLevel: string;
  
  // Skills & Expertise (6 categories)
  technicalSkills: string[];
  softSkills: string[];
  programmingLanguages: string[];
  frameworks: string[];
  toolsAndPlatforms: string[];
  methodologies: string[];
  
  // Extended skill categories
  databases?: string[];
  cloudPlatforms?: string[];
  devOpsTools?: string[];
  testingTools?: string[];
  dataEngineeringTools?: string[];
  mlFrameworks?: string[];
  analyticsTools?: string[];
  mobileTechnologies?: string[];
  webTechnologies?: string[];
  securityTools?: string[];
  monitoringTools?: string[];
  messagingSystems?: string[];
  cmsPlatforms?: string[];
  crmErp?: string[];
  
  // Education
  educationLevel?: string;
  universities: string[];
  degrees: string[];
  graduationYear?: number;
  certifications: string[];
  education: Array<{
    degree: string;
    university: string;
    year: string;
    gpa?: string;
  }>;
  
  // Work Preferences
  expectedSalary: string;
  preferredContractType?: string;
  freelancer?: boolean;
  remotePreference: string;
  relocationWillingness?: boolean;
  mobilityCountries?: string[];
  mobilityCities?: string[];
  workPermitType?: string;
  availableFrom?: string;
  noticePeriod?: string;
  availability: string;
  
  // Industry & Experience
  primaryIndustry: string;
  functionalDomain?: string;
  notableProjects: string[];
  
  // Online Presence
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  personalWebsite?: string;
  videoUrl?: string;
  
  // Languages
  spokenLanguages: string[];
  nativeLanguage?: string;
  
  // Work History
  workExperience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
    achievements?: string;
    technologies?: string;
  }>;
  
  // Additional Information
  publications?: string[];
  awards?: string[];
  references?: Array<{
    name: string;
    title?: string;
    company?: string;
    email?: string;
    phone?: string;
  }>;
  hobbies?: string[];
  volunteerWork?: string[];
  projects?: any[];
}

interface ParsedData {
  // Basic Information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  timezone?: string;
  
  // Professional Profile
  currentTitle?: string;
  professionalHeadline?: string;
  currentCompany?: string;
  currentLocation?: string;
  summary?: string;
  experienceYears?: number;
  seniorityLevel?: string;
  
  // Skills (6 categories)
  technicalSkills?: string[];
  softSkills?: string[];
  programmingLanguages?: string[];
  frameworks?: string[];
  toolsAndPlatforms?: string[];
  methodologies?: string[];
  
  // Education
  educationLevel?: string;
  universities?: string[];
  degrees?: string[];
  graduationYear?: number;
  education?: Array<{
    degree: string;
    institution: string;
    year?: number;
    gpa?: string;
  }>;
  certifications?: string[];
  
  // Work Preferences
  expectedSalary?: string;
  preferredContractType?: string;
  freelancer?: boolean;
  remotePreference?: string;
  relocationWillingness?: boolean;
  mobilityCountries?: string[];
  mobilityCities?: string[];
  workPermitType?: string;
  availableFrom?: string;
  noticePeriod?: string;
  
  // Industry & Experience
  primaryIndustry?: string;
  functionalDomain?: string;
  
  // Online Presence
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  personalWebsite?: string;
  videoUrl?: string;
  
  // Languages
  languages?: string[];
  nativeLanguage?: string;
  
  // Work History
  workHistory?: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    achievements?: string[];
    technologies?: string[];
  }>;
  
  // Projects
  projects?: Array<{
    name: string;
    description?: string;
    role?: string;
    technologies?: string[];
    link?: string;
  }>;
  
  // Additional fields
  databases?: string[];
  cloudPlatforms?: string[];
  devOpsTools?: string[];
  testingTools?: string[];
  dataEngineeringTools?: string[];
  mlFrameworks?: string[];
  analyticsTools?: string[];
  mobileTechnologies?: string[];
  webTechnologies?: string[];
  securityTools?: string[];
  monitoringTools?: string[];
  messagingSystems?: string[];
  cmsPlatforms?: string[];
  crmErp?: string[];
  publications?: string[];
  awards?: string[];
  references?: Array<{
    name: string;
    title?: string;
    company?: string;
    email?: string;
    phone?: string;
  }>;
  hobbies?: string[];
  volunteerWork?: string[];
}

export function CreateCandidateModal({ open, onClose, jobId, onCandidateCreated, onViewCandidate, onRefreshCandidates }: CreateCandidateModalProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('intake');
  const [inputMethod, setInputMethod] = useState<'upload' | 'linkedin' | 'manual' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  // Stage to assign when dropped from Kanban
  const [assignStageId, setAssignStageId] = useState<string | null>(null);
  // Auto-parse coordination for drag/drop from kanban
  const [autoParseRequested, setAutoParseRequested] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMinimizeHint, setShowMinimizeHint] = useState(false);
  const [parsedCandidate, setParsedCandidate] = useState<ParsedCandidate | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedTalentPools, setSelectedTalentPools] = useState<string[]>([]);
  const [candidateTags, setCandidateTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCandidate, setCreatedCandidate] = useState<CreatedCandidate | null>(null);
  // Address & mobility
  const [address, setAddress] = useState('');
  const [placePredictions, setPlacePredictions] = useState<any[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesSession, setPlacesSession] = useState<string>('');
  const [mobilityCountries, setMobilityCountries] = useState<string[]>([]);
  const [mobilityCities, setMobilityCities] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const ensureSession = () => {
    if (!placesSession) setPlacesSession(crypto.randomUUID());
  };
  // Glow the minimize button only while parsing
  useEffect(() => {
    if (isParsing) {
      setShowMinimizeHint(true);
      const t = setTimeout(() => setShowMinimizeHint(false), 2200);
      try {
        localStorage.setItem('ccPill', JSON.stringify({ active: true, status: 'extracting' }));
      } catch {}
      return () => clearTimeout(t);
    } else {
      // parsing finished -> mark ready, keep pill visible if minimized
      try {
        localStorage.setItem('ccPill', JSON.stringify({ active: true, status: 'ready' }));
      } catch {}
    }
  }, [isParsing]);

  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const calcAge = (dob?: string) => {
    if (!dob) return '';
    const d = new Date(dob); const t = new Date();
    let age = t.getFullYear() - d.getFullYear();
    const m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
    return `${age}`;
  };
  const industries = [
    'Industrial Expertise','Banking','Insurance','Pharma & Biotech','Public Sector','Healthcare','Energy','Utilities','Telecommunications','Technology','Consumer Goods','Retail','Transportation','Logistics','Manufacturing','Automotive','Aerospace','Real Estate','Hospitality','Education','Media & Entertainment','Financial Services'
  ] as const;
  const practiceCatalog = [
    'Analytics',
    'Business Process Outsourcing (BPO)',
    'Change Management',
    'Cloud & Infrastructure',
    'Corporate Finance',
    'Customer & Marketing',
    'Cybersecurity',
    'Data & Analytics',
    'Digital Transformation',
    'Finance Transformation',
    'Human Capital',
    'Innovation & Design',
    'IT Strategy',
    'Mergers & Acquisitions (M&A)',
    'Operations',
    'Organization Design',
    'Pricing & Revenue Management',
    'Procurement',
    'Product Management',
    'Program/Project Management Office (PMO)',
    'Risk & Compliance',
    'Sales & Go-To-Market',
    'Strategy',
    'Supply Chain',
    'Sustainability / ESG',
    'Technology Consulting',
    'Process Excellence (Lean / Six Sigma)'
  ] as const;
  const functionalSkillsCatalog = [
    'Agile',
    'Scrum',
    'Kanban',
    'SAFe',
    'Waterfall',
    'Project Management',
    'Program Management',
    'PMO',
    'Business Analysis',
    'Requirements Engineering',
    'Stakeholder Management',
    'Change Management',
    'Organizational Change',
    'Process Improvement',
    'Lean',
    'Six Sigma',
    'Lean Six Sigma',
    'ITIL',
    'Service Management',
    'Quality Assurance',
    'Risk Management',
    'Governance',
    'Design Thinking',
    'Customer Journey Mapping',
    'Product Management',
    'OKRs',
    'KPIs'
  ] as const;
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [suggestedPools, setSuggestedPools] = useState<string[]>([]);
  // Mobility dropdown states
  const [countryQuery, setCountryQuery] = useState('');
  const countries: Array<{ code: string; name: string }> = [
    { code: 'CH', name: 'Switzerland' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'AT', name: 'Austria' },
    { code: 'IE', name: 'Ireland' },
  ];
  const [countrySuggestions, setCountrySuggestions] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  // UI toggles
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [showAssignJobs, setShowAssignJobs] = useState(false);
  // Practice Areas section is always expanded
  const [age, setAge] = useState<string>('');
  const [practiceSearch, setPracticeSearch] = useState('');
  const [showPracticeDropdown, setShowPracticeDropdown] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  // Skills section collapsibles (default collapsed)
  const [showSoftwareEngineering, setShowSoftwareEngineering] = useState(false);
  const [showDataAI, setShowDataAI] = useState(false);
  const [showPlatformsTools, setShowPlatformsTools] = useState(false);
  const [showFunctionalSkills, setShowFunctionalSkills] = useState(false);
  
  // Real data states
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [availableTalentPools, setAvailableTalentPools] = useState<TalentPool[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingTalentPools, setLoadingTalentPools] = useState(false);
  
  // Tag input states
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  // Dropdown visibility
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  // Structured address fields
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [addressCountry, setAddressCountry] = useState('');
  const [addressCountryCode, setAddressCountryCode] = useState('');
  const [addressCountryQuery, setAddressCountryQuery] = useState('');
  const [addressCountrySuggestions, setAddressCountrySuggestions] = useState<Array<{ code: string; name: string }>>([]);
  const [showAddressCountryDropdown, setShowAddressCountryDropdown] = useState(false);
  const [addressCityQuery, setAddressCityQuery] = useState('');
  const [addressCitySuggestions, setAddressCitySuggestions] = useState<any[]>([]);
  const [showAddressCityDropdown, setShowAddressCityDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const industryBoxRef = useRef<HTMLDivElement>(null);
  const practiceBoxRef = useRef<HTMLDivElement>(null);

  // Fetch real jobs and talent pools when modal opens
  useEffect(() => {
    if (open) {
      fetchJobs();
      fetchTalentPools();
      fetchAvailableTags();
    }
  }, [open]);

  // Auto-assign current job when jobId is provided
  useEffect(() => {
    if (jobId && availableJobs.length > 0) {
      const currentJob = availableJobs.find(job => job.id === jobId);
      if (currentJob && !selectedJobs.includes(jobId)) {
        setSelectedJobs([jobId]);
      }
    }
  }, [jobId, availableJobs, selectedJobs]);

  // Close industry/practice dropdowns on outside click
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (showIndustryDropdown) {
        if (industryBoxRef.current && !industryBoxRef.current.contains(e.target as Node)) {
          setShowIndustryDropdown(false);
        }
      }
      if (showPracticeDropdown) {
        if (practiceBoxRef.current && !practiceBoxRef.current.contains(e.target as Node)) {
          setShowPracticeDropdown(false);
        }
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [showIndustryDropdown, showPracticeDropdown]);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchTalentPools = async () => {
    setLoadingTalentPools(true);
    try {
      // For now, we'll use mock data since talent pools API might not exist yet
      // In the future, this would be: const response = await fetch('/api/talent-pools');
      const mockPools = [
        { id: '1', name: 'Frontend Specialists', count: 45 },
        { id: '2', name: 'Backend Engineers', count: 32 },
        { id: '3', name: 'Full Stack Developers', count: 78 },
        { id: '4', name: 'Senior Developers', count: 56 },
        { id: '5', name: 'Swiss Market', count: 156 },
        { id: '6', name: 'Remote Workers', count: 89 }
      ];
      setAvailableTalentPools(mockPools);
    } catch (error) {
      console.error('Error fetching talent pools:', error);
    } finally {
      setLoadingTalentPools(false);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      // Mock available tags - in production this could come from API
      const commonTags = [
        'Hot Candidate',
        'Top Talent',
        'Ready to Submit',
        'Needs Interview',
        'Internal Only',
        'Remote Preferred',
        'Local Only',
        'Urgent',
        'High Potential',
        'Culture Fit',
        'Technical Expert',
        'Leadership Material',
        'Quick Start',
        'Flexible',
        'Bilingual'
      ];
      setAvailableTags(commonTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // Quick Start Templates removed per UX request

  // Moved early return below all hooks to avoid changing hooks order

  const handleClose = () => {
    // Reset all state
    setCurrentStep('intake');
    setInputMethod(null);
    setUploadedFile(null);
    setLinkedinUrl('');
    setManualInput('');
    setIsRecording(false);
    setIsParsing(false);
    setParsedCandidate(null);
    setSelectedJobs([]);
    setSelectedTalentPools([]);
    setCandidateTags([]);
    setNotes('');
    setIsSubmitting(false);
    setCreatedCandidate(null);
    setTagInput('');
    setShowTagSuggestions(false);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setInputMethod('upload');
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type.includes('document'))) {
      setUploadedFile(file);
      setInputMethod('upload');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const startRecording = () => {
    setIsRecording(true);
    // Implement voice recording logic here
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Process recorded audio
  };

  // Tag input handlers
  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !candidateTags.includes(tag.trim())) {
      setCandidateTags([...candidateTags, tag.trim()]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    setCandidateTags(candidateTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput.trim());
      }
    } else if (e.key === 'Backspace' && !tagInput && candidateTags.length > 0) {
      removeTag(candidateTags[candidateTags.length - 1]);
    }
  };

  const filteredTagSuggestions = availableTags.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) && 
    !candidateTags.includes(tag)
  );

  const handleParse = async () => {
    setIsParsing(true);
    setCurrentStep('parsing');

    try {
      let parsedData: ParsedData | null = null;
      
      if (inputMethod === 'upload' && uploadedFile) {
        // Read file content for parsing
        const fileContent = await uploadedFile.text();
        
        // Use the CV parser API endpoint directly
        const formData = new FormData();
        formData.append('file', uploadedFile);
        const token = await getToken();
        const response = await fetch('/api/candidates/parse-cv', {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          body: formData,
        });
        if (!response.ok) {
          const errText = await response.text().catch(()=> '');
          throw new Error(errText || 'Failed to parse uploaded file');
        }
        const result = await response.json();
        if (result.success && result.data) {
          // The upload-cv endpoint returns a full candidate object, extract the parsed fields
          parsedData = result.data;
        } else {
          throw new Error(result.message || 'Failed to parse file');
        }
      } else if (inputMethod === 'linkedin' && linkedinUrl) {
        // Parse LinkedIn profile text
        const response = await fetch('/api/competence-files/parse-linkedin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: linkedinUrl }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to parse LinkedIn profile text');
        }
        
        const result = await response.json();
        if (result.success) {
          parsedData = result.data;
        } else {
          throw new Error(result.message || 'Failed to parse LinkedIn profile');
        }
      } else if (inputMethod === 'manual' && manualInput) {
        // Validate manual input length
        if (manualInput.trim().length < 50) {
          throw new Error('Please provide more detailed information. Your input should include at least basic candidate details like name, contact info, and experience.');
        }
        
        // Parse manual text input
        const response = await fetch('/api/competence-files/parse-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: manualInput }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to parse text input');
        }
        
        const result = await response.json();
        if (result.success) {
          parsedData = result.data;
        } else {
          throw new Error(result.message || 'Failed to parse text');
        }
      } else {
        throw new Error('Please provide input data to parse');
      }

      if (parsedData) {
        // Sanitizers to clean parsing artifacts like '***'
        const sanitizeText = (s?: string) => (s || '').replace(/\*\*\*+/g, '').replace(/\s{2,}/g, ' ').trim();
        const sanitizeArray = (arr?: string[]) => (arr || [])
          .map(sanitizeText)
          .filter(v => v && v !== '-' && v !== '—' && v !== '–');
        
        // Map the parsed data to our candidate structure with ALL fields
        const mappedCandidate: ParsedCandidate = {
          // Basic Information
          firstName: sanitizeText(parsedData.firstName || ''),
          lastName: sanitizeText(parsedData.lastName || ''),
          email: sanitizeText(parsedData.email || ''),
          phone: sanitizeText(parsedData.phone || ''),
          address: sanitizeText(parsedData.address || ''),
          dateOfBirth: sanitizeText(parsedData.dateOfBirth || ''),
          nationality: sanitizeText(parsedData.nationality || ''),
          gender: parsedData.gender || '',
          timezone: parsedData.timezone || '',
          
          // Professional Profile
          currentTitle: sanitizeText(parsedData.currentTitle || ''),
          currentCompany: sanitizeText(parsedData.currentCompany || ''),
          currentLocation: sanitizeText(parsedData.currentLocation || ''),
          summary: sanitizeText(parsedData.summary || ''),
          experienceYears: parsedData.experienceYears || 0,
          
          
          // Skills - all 6 main categories plus additional ones
          technicalSkills: sanitizeArray(parsedData.technicalSkills),
          softSkills: sanitizeArray(parsedData.softSkills),
          programmingLanguages: sanitizeArray(parsedData.programmingLanguages),
          frameworks: sanitizeArray(parsedData.frameworks),
          toolsAndPlatforms: sanitizeArray(parsedData.toolsAndPlatforms),
          methodologies: sanitizeArray(parsedData.methodologies),
          
          
          // Languages
          spokenLanguages: sanitizeArray(parsedData.languages),
          nativeLanguage: sanitizeText(parsedData.nativeLanguage || ''),
          
          // Online presence
          linkedinUrl: sanitizeText(parsedData.linkedinUrl || linkedinUrl || ''),
          githubUrl: sanitizeText(parsedData.githubUrl || ''),
          portfolioUrl: sanitizeText(parsedData.portfolioUrl || ''),
          personalWebsite: sanitizeText(parsedData.personalWebsite || ''),
          videoUrl: sanitizeText(parsedData.videoUrl || ''),
          
          // Professional profile
          seniorityLevel: parsedData.seniorityLevel || 
                         ((parsedData.experienceYears || 0) > 10 ? 'LEAD' :
                          (parsedData.experienceYears || 0) > 5 ? 'SENIOR' : 
                          (parsedData.experienceYears || 0) > 2 ? 'MID_LEVEL' : 'JUNIOR'),
          professionalHeadline: sanitizeText(parsedData.professionalHeadline || parsedData.currentTitle || ''),
          
          // Industry & domain
          primaryIndustry: sanitizeText(parsedData.primaryIndustry || 'Technology'),
          functionalDomain: sanitizeText(parsedData.functionalDomain || ''),
          
          // Work preferences
          availability: 'Available',
          expectedSalary: sanitizeText(parsedData.expectedSalary || ''),
          remotePreference: parsedData.remotePreference || 'HYBRID',
          preferredContractType: parsedData.preferredContractType || 'PERMANENT',
          relocationWillingness: parsedData.relocationWillingness || false,
          freelancer: parsedData.freelancer || false,
          workPermitType: sanitizeText(parsedData.workPermitType || ''),
          availableFrom: sanitizeText(parsedData.availableFrom || ''),
          noticePeriod: sanitizeText(parsedData.noticePeriod || ''),
          mobilityCountries: parsedData.mobilityCountries || [],
          mobilityCities: parsedData.mobilityCities || [],
          
          
          
          // Education - use parsed educationLevel or determine from education array
          educationLevel: parsedData.educationLevel || (() => {
            if (!parsedData.education || parsedData.education.length === 0) return 'OTHER';
            const degrees = parsedData.education.map(e => e.degree?.toLowerCase() || '');
            if (degrees.some(d => d.includes('phd') || d.includes('doctorate'))) return 'PHD';
            if (degrees.some(d => d.includes('master') || d.includes('mba'))) return 'MASTERS';
            if (degrees.some(d => d.includes('bachelor') || d.includes('ba') || d.includes('bs'))) return 'BACHELORS';
            if (degrees.some(d => d.includes('high school') || d.includes('secondary'))) return 'HIGH_SCHOOL';
            return 'OTHER';
          })(),
          graduationYear: parsedData.graduationYear || 
                         (parsedData.education && parsedData.education.length > 0 ? 
                          parsedData.education[0].year : undefined) || 
                         new Date().getFullYear(),
          
          // Arrays
          certifications: sanitizeArray(parsedData.certifications),
          degrees: parsedData.degrees || parsedData.education?.map(e => e.degree).filter(Boolean) || [],
          universities: parsedData.universities || parsedData.education?.map(e => e.institution).filter(Boolean) || [],
          notableProjects: parsedData.projects?.map(p => p.name) || [],
          publications: sanitizeArray(parsedData.publications),
          awards: parsedData.awards || [],
          hobbies: sanitizeArray(parsedData.hobbies),
          
          // Work experience - enhanced with achievements and technologies
          workExperience: (parsedData.workHistory || []).map((exp: any) => ({
            title: sanitizeText(exp.title || ''),
            company: sanitizeText(exp.company || ''),
            duration: `${sanitizeText(exp.startDate || '')} - ${sanitizeText(exp.endDate || '')}`.trim(),
            description: sanitizeText(exp.description || ''),
            achievements: exp.achievements?.join('. ') || '',
            technologies: exp.technologies?.join(', ') || ''
          })),
          
          // Education array - enhanced with GPA
          education: (parsedData.education || []).map((edu: any) => ({
            degree: sanitizeText(edu.degree || ''),
            university: sanitizeText(edu.institution || ''),
            year: String(edu.year || new Date().getFullYear()),
            gpa: edu.gpa || ''
          })),
          
          // Projects - complete structure
          projects: parsedData.projects || [],
          
          // References
          references: parsedData.references || [],
          
          // Volunteer work
          volunteerWork: parsedData.volunteerWork || [],
          
          // Extended skill categories (fallback to intelligent filtering if not parsed)
          databases: parsedData.databases || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['postgresql','mysql','mariadb','sql server','oracle','mongodb','redis','elasticsearch','dynamodb','sqlite','cassandra','neo4j'].includes(s.toLowerCase())
          ) || [],
          cloudPlatforms: parsedData.cloudPlatforms || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['aws','amazon web services','azure','gcp','google cloud','oracle cloud','alibaba cloud','cloudflare','digitalocean','linode'].includes(s.toLowerCase())
          ) || [],
          devOpsTools: parsedData.devOpsTools || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['docker','kubernetes','terraform','ansible','puppet','chef','helm','argo cd','flux','jenkins','github actions','gitlab ci','circleci','travis ci'].includes(s.toLowerCase())
          ) || [],
          testingTools: parsedData.testingTools || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['jest','mocha','jasmine','cypress','playwright','selenium','junit','pytest','karma','enzyme','vitest','testng','cucumber'].includes(s.toLowerCase())
          ) || [],
          dataEngineeringTools: parsedData.dataEngineeringTools || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['apache spark','hadoop','kafka','airflow','dbt','snowflake','redshift','bigquery','databricks','flink','storm','nifi'].includes(s.toLowerCase())
          ) || [],
          mlFrameworks: parsedData.mlFrameworks || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['tensorflow','pytorch','scikit-learn','xgboost','lightgbm','keras','mlflow','hugging face','opencv','spacy','nltk'].includes(s.toLowerCase())
          ) || [],
          analyticsTools: parsedData.analyticsTools || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['tableau','power bi','looker','google analytics','mixpanel','amplitude','segment','heap','datadog'].includes(s.toLowerCase())
          ) || [],
          mobileTechnologies: parsedData.mobileTechnologies || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['react native','flutter','swift','kotlin','android','ios','xamarin','capacitor','cordova','ionic'].includes(s.toLowerCase())
          ) || [],
          webTechnologies: parsedData.webTechnologies || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['next.js','nuxt','svelte','astro','webpack','vite','rollup','tailwind','sass','less','graphql','rest','websocket'].includes(s.toLowerCase())
          ) || [],
          securityTools: parsedData.securityTools || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['owasp','burp suite','nessus','metasploit','sonarqube','snyk','veracode','checkmarx'].includes(s.toLowerCase())
          ) || [],
          monitoringTools: parsedData.monitoringTools || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['prometheus','grafana','datadog','new relic','elastic apm','splunk','cloudwatch','appdynamics','dynatrace'].includes(s.toLowerCase())
          ) || [],
          messagingSystems: parsedData.messagingSystems || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['kafka','rabbitmq','activemq','sqs','sns','pub/sub','mqtt','zeromq','nats'].includes(s.toLowerCase())
          ) || [],
          cmsPlatforms: parsedData.cmsPlatforms || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['wordpress','drupal','joomla','strapi','contentful','sanity','ghost','directus'].includes(s.toLowerCase())
          ) || [],
          crmErp: parsedData.crmErp || sanitizeArray(parsedData.technicalSkills)?.filter((s: string) => 
            ['salesforce','hubspot','sap','oracle erp','netsuite','microsoft dynamics','zoho','pipedrive'].includes(s.toLowerCase())
          ) || []
        };

        setParsedCandidate(mappedCandidate);
        setCurrentStep('review');
      }
    } catch (error) {
      console.error('Parsing error:', error);
      alert(`Error parsing candidate data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCurrentStep('intake');
    } finally {
      setIsParsing(false);
    }
  };

  // Google Places Autocomplete handlers
  useEffect(() => {
    const run = async () => {
      if (!address || address.length < 3) { setPlacePredictions([]); return; }
      ensureSession();
      setPlacesLoading(true);
      try {
        const url = new URL('/api/places/autocomplete', location.origin);
        url.searchParams.set('input', address);
        if (placesSession) url.searchParams.set('sessiontoken', placesSession);
        const res = await fetch(url.toString());
        const js = await res.json();
        setPlacePredictions(js.predictions || []);
      } catch { setPlacePredictions([]); }
      finally { setPlacesLoading(false); }
    };
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [address, placesSession]);

  // Initialize address from parsed candidate when entering review
  useEffect(() => {
    if (currentStep === 'review') {
      setAddress(parsedCandidate?.currentLocation || '');
    }
  }, [currentStep, parsedCandidate]);

  // Initialize editable age from date of birth when available
  useEffect(() => {
    const computed = calcAge(dateOfBirth);
    if (!age && computed) setAge(computed);
  }, [dateOfBirth]);

  // Attempt to resolve parsed address into structured fields on entering review
  useEffect(() => {
    const run = async () => {
      if (currentStep !== 'review') return;
      if (!parsedCandidate?.currentLocation) return;
      if (addressStreet || addressCity || addressCountry) return;
      try {
        ensureSession();
        const url = new URL('/api/places/autocomplete', location.origin);
        url.searchParams.set('input', parsedCandidate.currentLocation);
        if (placesSession) url.searchParams.set('sessiontoken', placesSession);
        const res = await fetch(url.toString());
        const js = await res.json();
        const first = js.predictions?.[0];
        if (first) await choosePlace(first);
      } catch {}
    };
    run();
  }, [currentStep]);

  // Ensure scroll is at top when arriving on Assign & Save step
  useEffect(() => {
    if (currentStep === 'assign') {
      try { contentRef.current?.scrollTo({ top: 0, behavior: 'auto' }); } catch {}
    }
  }, [currentStep]);

  const choosePlace = async (prediction: any) => {
    try {
      ensureSession();
      const url = new URL('/api/places/details', location.origin);
      url.searchParams.set('place_id', prediction.place_id);
      if (placesSession) url.searchParams.set('sessiontoken', placesSession);
      const res = await fetch(url.toString());
      const js = await res.json();
      const result = js.result;
      if (result?.formatted_address) setAddress(result.formatted_address);
      // Extract city/country for defaults and structured fields
      const comps: Array<{ long_name: string; types: string[]; short_name?: string }> = result?.address_components || [];
      const city = comps.find(c => c.types.includes('locality'))?.long_name;
      const countryComp = comps.find(c => c.types.includes('country'));
      const country = countryComp?.long_name;
      const countryCode = countryComp?.short_name || '';
      const streetNumber = comps.find(c => c.types.includes('street_number'))?.long_name || '';
      const route = comps.find(c => c.types.includes('route'))?.long_name || '';
      const postal = comps.find(c => c.types.includes('postal_code'))?.long_name || '';
      setAddressStreet([route, streetNumber].filter(Boolean).join(' '));
      if (city) setAddressCity(city);
      if (postal) setAddressPostalCode(postal);
      if (country) setAddressCountry(country);
      if (countryCode) setAddressCountryCode(countryCode);
      if (country && !mobilityCountries.includes(country)) setMobilityCountries([...mobilityCountries, country]);
      if (city && !mobilityCities.includes(city)) setMobilityCities([...mobilityCities, city]);
      setPlacePredictions([]);
    } catch {}
  };

  // Infer industry, practice areas and talent pool suggestions from parsed data
  useEffect(() => {
    if (!parsedCandidate) return;
    if (!selectedIndustry) {
      const tx = `${parsedCandidate.primaryIndustry} ${parsedCandidate.currentTitle} ${(parsedCandidate.technicalSkills||[]).join(' ')}`.toLowerCase();
      if (tx.includes('bank')) setSelectedIndustry('Banking');
      else if (tx.includes('insur')) setSelectedIndustry('Insurance');
      else if (tx.includes('pharma')||tx.includes('biotech')) setSelectedIndustry('Pharma & Biotech');
      else if (tx.includes('health')) setSelectedIndustry('Healthcare');
      else if (tx.includes('energy')) setSelectedIndustry('Energy');
      else if (tx.includes('manufactur')) setSelectedIndustry('Manufacturing');
      else if (tx.includes('retail')) setSelectedIndustry('Retail');
      else setSelectedIndustry(parsedCandidate.primaryIndustry || 'Technology');
    }
    const suggestions: string[] = [];
    const text = `${parsedCandidate.currentTitle} ${parsedCandidate.summary} ${(parsedCandidate.methodologies||[]).join(' ')} ${(parsedCandidate.technicalSkills||[]).join(' ')}`.toLowerCase();
    if (text.includes('pmo')||text.includes('project')) suggestions.push('Project/Program Management Office (PMO)');
    if (text.includes('change')) suggestions.push('Change Management');
    if (text.includes('supply')) suggestions.push('Supply Chain');
    if (text.includes('security')) suggestions.push('Cybersecurity');
    if (text.includes('data')||text.includes('analytics')) suggestions.push('Data & Analytics');
    if (text.includes('strategy')) suggestions.push('Strategy');
    if (text.includes('process')||text.includes('lean')||text.includes('six sigma')) suggestions.push('Process Excellence (Lean/Six Sigma)');
    if (practiceAreas.length === 0) setPracticeAreas(Array.from(new Set(suggestions)).slice(0,3));
    const pools: string[] = [];
    if (text.includes('react')||text.includes('frontend')) pools.push('Frontend Specialists');
    if (text.includes('backend')||text.includes('java')||text.includes('node')) pools.push('Backend Engineers');
    if (text.includes('full')) pools.push('Full Stack Developers');
    if (parsedCandidate.seniorityLevel==='SENIOR'||parsedCandidate.seniorityLevel==='LEAD') pools.push('Senior Developers');
    setSuggestedPools(Array.from(new Set(pools)));
  }, [parsedCandidate]);

  // Country search suggestions
  useEffect(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) { setCountrySuggestions([]); return; }
    setCountrySuggestions(countries.filter(c => c.name.toLowerCase().includes(q)));
  }, [countryQuery]);

  const sortedPractices = useMemo(() => [...practiceCatalog].sort((a,b)=> a.localeCompare(b)), []);
  const filteredPractices = useMemo(() => {
    const q = practiceSearch.trim().toLowerCase();
    if (!q) return sortedPractices;
    return sortedPractices.filter(p => p.toLowerCase().includes(q));
  }, [practiceSearch, sortedPractices]);
  const sortedIndustries = useMemo(() => [...industries].sort((a,b)=> a.localeCompare(b)), []);
  const filteredIndustries = useMemo(() => {
    const q = industrySearch.trim().toLowerCase();
    if (!q) return sortedIndustries;
    return sortedIndustries.filter(i => i.toLowerCase().includes(q));
  }, [industrySearch, sortedIndustries]);

  // City search suggestions constrained by selected country
  useEffect(() => {
    const run = async () => {
      if (!cityQuery || !selectedCountryCode) { setCitySuggestions([]); return; }
      ensureSession();
      try {
        const url = new URL('/api/places/autocomplete', location.origin);
        url.searchParams.set('input', cityQuery);
        url.searchParams.set('types', '(cities)');
        url.searchParams.set('components', `country:${selectedCountryCode}`);
        if (placesSession) url.searchParams.set('sessiontoken', placesSession);
        const res = await fetch(url.toString());
        const js = await res.json();
        setCitySuggestions(js.predictions || []);
      } catch { setCitySuggestions([]); }
    };
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [cityQuery, selectedCountryCode, placesSession]);

  // Address country suggestions
  useEffect(() => {
    const q = addressCountryQuery.trim().toLowerCase();
    if (!q) { setAddressCountrySuggestions([]); return; }
    setAddressCountrySuggestions(countries.filter(c => c.name.toLowerCase().includes(q)));
  }, [addressCountryQuery]);

  // Address city suggestions (country optional)
  useEffect(() => {
    const run = async () => {
      if (!addressCityQuery) { setAddressCitySuggestions([]); return; }
      ensureSession();
      try {
        const url = new URL('/api/places/autocomplete', location.origin);
        url.searchParams.set('input', addressCityQuery);
        url.searchParams.set('types', '(cities)');
        if (addressCountryCode) url.searchParams.set('components', `country:${addressCountryCode}`);
        if (placesSession) url.searchParams.set('sessiontoken', placesSession);
        const res = await fetch(url.toString());
        const js = await res.json();
        setAddressCitySuggestions(js.predictions || []);
      } catch { setAddressCitySuggestions([]); }
    };
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [addressCityQuery, addressCountryCode, placesSession]);

  useEffect(() => {
    const handler = (e: Event) => {
      const anyEvent = e as CustomEvent<{ file: File; stageId?: string; jobId?: string }>;
      const detail = anyEvent.detail;
      if (!detail?.file) return;
      try {
        setUploadedFile(detail.file);
        setInputMethod('upload');
        // Always normalize to 'sourced' per requirement
        setAssignStageId('sourced');
        if (detail.jobId && !jobId) {
          setSelectedJobs([detail.jobId]);
        }
        // Defer parsing until state is committed and modal is open
        setAutoParseRequested(true);
      } catch {}
    };
    document.addEventListener('emineon:candidate-upload' as any, handler as any);
    return () => document.removeEventListener('emineon:candidate-upload' as any, handler as any);
  }, [jobId]);

  // Run auto-parse once when prerequisites are satisfied
  useEffect(() => {
    if (open && autoParseRequested && inputMethod === 'upload' && uploadedFile) {
      setAutoParseRequested(false);
      // Allow one tick to ensure state batching has flushed
      const t = setTimeout(() => { handleParse(); }, 0);
      return () => clearTimeout(t);
    }
  }, [open, autoParseRequested, inputMethod, uploadedFile]);

  if (!open) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (!parsedCandidate) {
        throw new Error('No candidate data to submit');
      }

      // Prepare candidate data for API
      const candidateData = {
        ...parsedCandidate,
        // Ensure required fields are present with safe fallbacks
        email: parsedCandidate.email || `${(parsedCandidate.firstName || 'candidate')}${(parsedCandidate.lastName || 'new')}`.replace(/\s+/g, '').toLowerCase() + '@temp.generated',
        tags: candidateTags,
        notes,
        address,
        dateOfBirth,
        mobilityCountries,
        mobilityCities,
        primaryIndustry: selectedIndustry || parsedCandidate.primaryIndustry,
        functionalDomain: practiceAreas.join(', '),
        selectedJobs,
        talentPools: availableTalentPools.filter(p=> selectedTalentPools.includes(p.id)).map(p=> p.name),
        source: inputMethod === 'upload' ? 'resume_upload' : 
                inputMethod === 'linkedin' ? 'linkedin_import' : 'manual_entry'
      };

      console.log('Submitting candidate data:', candidateData);

      const token = await getToken();
      
      // Check if we have an uploaded CV file to include
      const hasUploadedFile = uploadedFile && inputMethod === 'upload';
      
      let response;
      if (hasUploadedFile) {
        // Send as FormData to include the CV file
        const formData = new FormData();
        formData.append('candidateData', JSON.stringify(candidateData));
        formData.append('cvFile', uploadedFile);
        
        console.log('📎 Submitting candidate with CV file:', uploadedFile.name);
        
        response = await fetch('/api/candidates', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // Send as JSON only
        response = await fetch('/api/candidates', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(candidateData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(()=>({}));
        if (response.status === 409) {
          // If duplicate, link existing candidate to job context (no alert)
          const existingId = errorData?.id;
          const jobTargetId = (selectedJobs && selectedJobs[0]) || jobId;
          if (existingId && jobTargetId) {
            try {
              const tokenDup = await getToken();
              await fetch(`/api/jobs/${jobTargetId}/candidates`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${tokenDup}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ candidateId: existingId })
              });
            } catch {}
          }
          // Notify parent (job page) to optimistically add card if handler provided
          if (existingId && typeof onCandidateCreated === 'function') {
            onCandidateCreated({
              id: existingId,
              firstName: parsedCandidate?.firstName || '',
              lastName: parsedCandidate?.lastName || '',
              email: parsedCandidate?.email || '',
              phone: parsedCandidate?.phone || '',
              currentTitle: parsedCandidate?.currentTitle || '',
              currentLocation: parsedCandidate?.currentLocation || '',
              experienceYears: parsedCandidate?.experienceYears || 0,
              technicalSkills: parsedCandidate?.technicalSkills || [],
            } as any);
          }
          if (onRefreshCandidates) onRefreshCandidates();
          setIsSubmitting(false);
          onClose();
          return;
        }
        throw new Error(errorData.message || errorData.error || 'Failed to create candidate');
      }

      const result = await response.json();
      
      if (result.success) {
        const createdCandidateData = {
          id: result.data.id,
          ...parsedCandidate,
          assignedJobs: selectedJobs,
          talentPools: selectedTalentPools,
          tags: candidateTags,
            notes,
            stage: 'sourced'
        };
        
        // CV file is now handled directly by the candidate creation API
        setCreatedCandidate(createdCandidateData);
        
        // Refresh the candidates list
        if (onRefreshCandidates) {
          onRefreshCandidates();
        }
        
        // Determine all jobs to assign (selected in modal + current job context)
        const targetJobIds = Array.from(new Set([
          ...(Array.isArray(selectedJobs) ? selectedJobs : []),
          ...(jobId ? [jobId] : []),
        ].filter(Boolean))) as string[];

        if (targetJobIds.length > 0) {
          try {
            // Assign candidate to each job, then set stage to 'sourced'
            for (const jid of targetJobIds) {
              try {
                await fetch(`/api/jobs/${jid}/candidates`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ candidateId: result.data.id }),
            });
              } catch {}

              try {
                await fetch(`/api/jobs/${jid}/candidates`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ candidateId: result.data.id, stage: 'sourced' })
                });
              } catch {}
            }

            // Add to job if jobId is provided
            if (jobId && result.data?.id) {
              try {
                const addToJobResponse = await fetch(`/api/jobs/${jobId}/candidates`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    candidateId: result.data.id,
                    stage: 'sourced',
                    source: 'manual'
                  })
                });
                
                if (!addToJobResponse.ok) {
                  const errorData = await addToJobResponse.json();
                  console.error('Failed to add candidate to job:', errorData);
                  alert('Candidate created but failed to add to job pipeline. Please add manually.');
                } else {
                  console.log('Successfully added candidate to job pipeline');
                }
              } catch (error) {
                console.error('Error adding candidate to job:', error);
                alert('Candidate created but failed to add to job pipeline. Please add manually.');
              }
            }
            
            // Notify parent and close
            if (jobId) {
              onCandidateCreated?.(createdCandidateData);
              onClose();
              return;
            }
          } catch (error) {
            console.error('Error assigning candidate to jobs:', error);
          }
        }
        
        // Fall back to Assign step if no job context
        setCurrentStep('assign');
      } else {
        throw new Error(result.message || 'Failed to create candidate');
      }
    } catch (error) {
      console.error('Error creating candidate:', error);
      alert(`Error creating candidate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };



  const steps = [
    { id: 'intake', label: 'Smart Intake', icon: Upload },
    { id: 'parsing', label: 'Smart Extract', icon: Brain },
    { id: 'review', label: 'Review & Edit', icon: CheckCircle },
    { id: 'assign', label: 'Assign & Save', icon: UserPlus }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const isReady = isMinimized && !isParsing;

  const Pill = (
    <button
      onClick={() => setIsMinimized(false)}
      className={`fixed bottom-4 right-4 z-[60] px-4 py-2 rounded-full shadow-emineon flex items-center space-x-2 transition-colors ${isReady ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#0A2F5A] hover:bg-[#083248] text-white'}`}
      title={isReady ? 'Ready - open editor' : 'Working - view progress'}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isReady ? 'bg-white/20' : 'bg-white/10'}`}>
        <Brain className={`h-4 w-4 ${isReady ? 'text-white' : 'text-white animate-pulse'}`} />
      </div>
      <span className="text-sm font-medium">
        {isParsing ? 'Extracting…' : 'Ready'}
      </span>
    </button>
  );

  if (isMinimized) {
    return <>{Pill}</>;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          if (isParsing) {
            setIsMinimized(true);
          }
        }
      }}
    >
      <div data-test="create-candidate-modal" className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0A2F5A]/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-[#0A2F5A]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Candidate</h2>
              <p className="text-gray-600">
                {currentStep === 'intake' && 'Upload CV, paste LinkedIn, or start manually'}
                {currentStep === 'parsing' && 'Extracting candidate information...'}
                {currentStep === 'review' && 'Review and edit candidate profile'}
                {currentStep === 'assign' && 'Assign to jobs and save candidate'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(true)}
              disabled={!isParsing}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isParsing ? 'bg-[#0A2F5A] text-white hover:bg-[#083248]' : 'bg-gray-100 text-gray-500 cursor-not-allowed'} ${showMinimizeHint && isParsing ? 'ring-2 ring-primary-300 animate-pulse' : ''}`}
              title={isParsing ? 'Minimize while extracting' : 'Available during extraction'}
            >
              <div className="flex items-center space-x-2">
                <Brain className={`h-4 w-4 ${isParsing ? 'animate-pulse' : ''}`} />
                <span>Minimize</span>
              </div>
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-[#0A2F5A]/10 text-[#0A2F5A]' : 
                    isCompleted ? 'bg-green-100 text-green-700' : 
                    'text-gray-500'
                  }`}>
                    <StepIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-green-300' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="p-6 overflow-y-auto max-h-[calc(95vh-220px)]">
          {/* Step 1: Smart Intake */}
          {currentStep === 'intake' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#0A2F5A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="h-8 w-8 text-[#0A2F5A]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    How would you like to add this candidate?
                  </h3>
                  <p className="text-gray-600">
                    Choose your preferred method to get started
                  </p>
                </div>
              </div>

              {/* Input Methods */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Upload CV */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    inputMethod === 'upload' ? 'border-[#0A2F5A] bg-[#0A2F5A]/5' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">Upload CV/Resume</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Drag & drop or click to upload
                  </p>
                  {uploadedFile && (
                    <div className="text-sm text-[#0A2F5A] font-medium">
                      ✓ {uploadedFile.name}
                    </div>
                  )}
                  <input
                    data-test="cv-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* LinkedIn Profile Text */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    inputMethod === 'linkedin' ? 'border-[#0A2F5A] bg-[#0A2F5A]/5' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setInputMethod('linkedin')}
                >
                  <Linkedin className="h-8 w-8 text-[#0A2F5A] mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">LinkedIn Profile</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Paste LinkedIn profile text
                  </p>
                  {inputMethod === 'linkedin' && (
                    <textarea
                      placeholder="Copy and paste the LinkedIn profile text here..."
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm h-24 resize-none"
                      autoFocus
                    />
                  )}
                </div>

                {/* Manual Entry */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    inputMethod === 'manual' ? 'border-[#0A2F5A] bg-[#0A2F5A]/5' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setInputMethod('manual')}
                >
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">Manual Entry</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Start from scratch
                  </p>
                </div>
              </div>

              {/* Manual Input Area */}
              {inputMethod === 'manual' && (
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      placeholder="Enter candidate details here... Include at least:
• Full name and contact information
• Current role and experience
• Key skills and qualifications
• Education or certifications

Example:
John Smith, john@email.com, +41 79 123 4567
Senior Software Engineer at TechCorp with 5 years experience
Skills: React, TypeScript, Python, AWS
Bachelor's in Computer Science from ETH Zurich"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="w-full h-40 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-[#0A2F5A] focus:border-[#0A2F5A] text-sm"
                    />
                    <div className="absolute bottom-3 left-3 text-xs text-gray-400">
                      {manualInput.length}/50 min
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2 rounded-lg transition-colors ${
                          isRecording ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {isRecording && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                      <span>Recording... Click to stop</span>
                    </div>
                  )}
                  
                  {inputMethod === 'manual' && manualInput.length > 0 && manualInput.length < 50 && (
                    <div className="flex items-center space-x-2 text-amber-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Please provide more details for better parsing results (minimum 50 characters)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Start Templates removed per UX request */}

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <button
                  onClick={handleParse}
                  disabled={!inputMethod || (inputMethod === 'linkedin' && !linkedinUrl.trim()) || (inputMethod === 'manual' && !manualInput.trim()) || (inputMethod === 'upload' && !uploadedFile)}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <Brain className="h-4 w-4" />
                  <span>Extract Profile</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: AI Parsing */}
          {currentStep === 'parsing' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[#0A2F5A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-[#0A2F5A] animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Processing candidate information...
              </h3>
              <p className="text-gray-600 mb-8">
                {uploadedFile ? `Analyzing ${uploadedFile.name}` : 'Extracting and structuring profile data'}
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#0A2F5A] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#0A2F5A] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#0A2F5A] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Edit */}
          {currentStep === 'review' && parsedCandidate && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Review & Edit Candidate Profile
                </h3>
                <p className="text-gray-600">
                  Confirm the extracted information and make any necessary adjustments
                </p>
              </div>

              {/* Professional Summary at top */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Professional Summary</h4>
                  <button type="button" onClick={()=> setSummaryExpanded(v=>!v)} className="text-sm text-[#0A2F5A] underline">
                    {summaryExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                <textarea
                  value={parsedCandidate.summary}
                  onChange={(e) => setParsedCandidate({...parsedCandidate, summary: e.target.value})}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${summaryExpanded ? 'h-48 resize-y' : 'h-24 resize-none'}`}
                  placeholder="Brief professional summary..."
                />
              </div>

              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      data-test="candidate-firstname"
                      type="text"
                      value={parsedCandidate.firstName}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      data-test="candidate-lastname"
                      type="text"
                      value={parsedCandidate.lastName}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      data-test="candidate-email"
                      type="email"
                      value={parsedCandidate.email}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      data-test="candidate-phone"
                      type="tel"
                      value={parsedCandidate.phone}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Years"
                      min={0}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={parsedCandidate.nationality || ''}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, nationality: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <input
                      type="text"
                      value={parsedCandidate.timezone || ''}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, timezone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g. Europe/Zurich"
                    />
                  </div>
                  {/* Removed Full Address field per UX */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g. Bahnhofstrasse 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <div className="relative">
                      <input
                        value={addressCityQuery}
                        onChange={(e)=> { setAddressCityQuery(e.target.value); setShowAddressCityDropdown(true); }}
                        onFocus={()=> setShowAddressCityDropdown(true)}
                        placeholder={addressCountryCode ? 'Search cities...' : 'Select a country first'}
                        disabled={!addressCountryCode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      />
                      {showAddressCityDropdown && addressCountryCode && addressCityQuery && addressCitySuggestions.length>0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-56 overflow-auto">
                          {addressCitySuggestions.map((p)=> (
                            <button
                              key={p.place_id}
                              type="button"
                              className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                              onClick={() => {
                                const name = p.structured_formatting?.main_text || p.description;
                                setAddressCity(name);
                                setAddressCityQuery('');
                                setShowAddressCityDropdown(false);
                              }}
                            >{p.structured_formatting?.main_text || p.description}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={addressPostalCode}
                      onChange={(e) => setAddressPostalCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <div className="relative">
                      <input
                        value={addressCountryQuery}
                        onChange={(e)=> { setAddressCountryQuery(e.target.value); setShowAddressCountryDropdown(true); }}
                        onFocus={()=> setShowAddressCountryDropdown(true)}
                        placeholder="Search countries..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {showAddressCountryDropdown && addressCountryQuery && addressCountrySuggestions.length>0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-56 overflow-auto">
                          {addressCountrySuggestions.map((c)=> (
                            <button
                              key={c.code}
                              type="button"
                              className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                              onClick={() => {
                                setAddressCountry(c.name);
                                setAddressCountryCode(c.code);
                                setAddressCountryQuery(c.name);
                                setShowAddressCountryDropdown(false);
                              }}
                            >{c.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Skills & Technologies */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Skills & Technologies</h4>
                <div className="space-y-4">
                  {/* Software Engineering */}
                  <div>
                    <button type="button" className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg" onClick={()=> setShowSoftwareEngineering(v=>!v)}>
                      <span className="font-medium text-gray-900">Software Engineering</span>
                      <span className="text-gray-500">{showSoftwareEngineering ? 'Hide' : 'Show'}</span>
                    </button>
                    {showSoftwareEngineering && (
                      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Programming Languages */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                      Programming Languages
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {parsedCandidate.programmingLanguages?.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center">
                          {skill}
                                <button onClick={() => { const newSkills = parsedCandidate.programmingLanguages?.filter((_, i) => i !== index) || []; setParsedCandidate({...parsedCandidate, programmingLanguages: newSkills}); }} className="ml-2 text-purple-600 hover:text-purple-800"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                          <input type="text" placeholder="Add programming language..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setParsedCandidate({ ...parsedCandidate, programmingLanguages: [...(parsedCandidate.programmingLanguages || []), e.currentTarget.value.trim()] }); e.currentTarget.value = ''; } }} />
                  </div>
                  {/* Frameworks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <span className="w-3 h-3 bg-[#0A2F5A] rounded-full mr-2"></span>
                      Frameworks & Libraries
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {parsedCandidate.frameworks?.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-[#0A2F5A]/10 text-[#0A2F5A] rounded-full text-sm flex items-center">
                          {skill}
                                <button onClick={() => { const newSkills = parsedCandidate.frameworks?.filter((_, i) => i !== index) || []; setParsedCandidate({...parsedCandidate, frameworks: newSkills}); }} className="ml-2 text-[#0A2F5A] hover:text-[#083248]"><X className="h-3 w-3" /></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add framework..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setParsedCandidate({ ...parsedCandidate, frameworks: [...(parsedCandidate.frameworks || []), e.currentTarget.value.trim()] }); e.currentTarget.value = ''; } }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Data & AI */}
                  <div>
                    <button type="button" className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg" onClick={()=> setShowDataAI(v=>!v)}>
                      <span className="font-medium text-gray-900">Data & AI</span>
                      <span className="text-gray-500">{showDataAI ? 'Hide' : 'Show'}</span>
                          </button>
                    {showDataAI && (
                      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Data Engineering Tools */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Data Engineering</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.dataEngineeringTools?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, dataEngineeringTools: parsedCandidate.dataEngineeringTools?.filter((_,i)=> i!==index) })} className="ml-2 text-teal-700 hover:text-teal-900"><X className="h-3 w-3"/></button>
                        </span>
                      ))}
                    </div>
                          <input type="text" placeholder="Add data tool..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, dataEngineeringTools: [...(parsedCandidate.dataEngineeringTools||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* ML Frameworks */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ML / AI Frameworks</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.mlFrameworks?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, mlFrameworks: parsedCandidate.mlFrameworks?.filter((_,i)=> i!==index) })} className="ml-2 text-rose-700 hover:text-rose-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add ML framework..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, mlFrameworks: [...(parsedCandidate.mlFrameworks||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* Analytics Tools */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Analytics Tools</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.analyticsTools?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, analyticsTools: parsedCandidate.analyticsTools?.filter((_,i)=> i!==index) })} className="ml-2 text-indigo-700 hover:text-indigo-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add analytics tool..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, analyticsTools: [...(parsedCandidate.analyticsTools||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Platforms & Tools */}
                  <div>
                    <button type="button" className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg" onClick={()=> setShowPlatformsTools(v=>!v)}>
                      <span className="font-medium text-gray-900">Platforms & Tools</span>
                      <span className="text-gray-500">{showPlatformsTools ? 'Hide' : 'Show'}</span>
                    </button>
                    {showPlatformsTools && (
                      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tools & Platforms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                      Tools & Platforms
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {parsedCandidate.toolsAndPlatforms?.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm flex items-center">
                          {skill}
                                <button onClick={() => { const newSkills = parsedCandidate.toolsAndPlatforms?.filter((_, i) => i !== index) || []; setParsedCandidate({...parsedCandidate, toolsAndPlatforms: newSkills}); }} className="ml-2 text-orange-600 hover:text-orange-800"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                          <input type="text" placeholder="Add tool or platform..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setParsedCandidate({ ...parsedCandidate, toolsAndPlatforms: [...(parsedCandidate.toolsAndPlatforms || []), e.currentTarget.value.trim()] }); e.currentTarget.value = ''; } }} />
                        </div>
                        {/* Databases */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Databases</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.databases?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, databases: parsedCandidate.databases?.filter((_,i)=> i!==index) })} className="ml-2 text-gray-600 hover:text-gray-800"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add database..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, databases: [...(parsedCandidate.databases||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* Cloud Platforms */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cloud Platforms</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.cloudPlatforms?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, cloudPlatforms: parsedCandidate.cloudPlatforms?.filter((_,i)=> i!==index) })} className="ml-2 text-blue-700 hover:text-blue-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add cloud platform..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, cloudPlatforms: [...(parsedCandidate.cloudPlatforms||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* DevOps Tools */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">DevOps Tools</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.devOpsTools?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, devOpsTools: parsedCandidate.devOpsTools?.filter((_,i)=> i!==index) })} className="ml-2 text-amber-700 hover:text-amber-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add devops tool..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, devOpsTools: [...(parsedCandidate.devOpsTools||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* Testing Tools */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Testing Tools</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.testingTools?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, testingTools: parsedCandidate.testingTools?.filter((_,i)=> i!==index) })} className="ml-2 text-purple-700 hover:text-purple-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add testing tool..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, testingTools: [...(parsedCandidate.testingTools||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                      {/* Mobile Tech */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Tech</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.mobileTechnologies?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, mobileTechnologies: parsedCandidate.mobileTechnologies?.filter((_,i)=> i!==index) })} className="ml-2 text-yellow-700 hover:text-yellow-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add mobile tech..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, mobileTechnologies: [...(parsedCandidate.mobileTechnologies||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* Web */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Web</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.webTechnologies?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, webTechnologies: parsedCandidate.webTechnologies?.filter((_,i)=> i!==index) })} className="ml-2 text-cyan-700 hover:text-cyan-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add web tech..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, webTechnologies: [...(parsedCandidate.webTechnologies||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* Security */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Security</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.securityTools?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, securityTools: parsedCandidate.securityTools?.filter((_,i)=> i!==index) })} className="ml-2 text-red-700 hover:text-red-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add security tool..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, securityTools: [...(parsedCandidate.securityTools||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* Monitoring */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Monitoring & Observability</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.monitoringTools?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-lime-100 text-lime-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, monitoringTools: parsedCandidate.monitoringTools?.filter((_,i)=> i!==index) })} className="ml-2 text-lime-700 hover:text-lime-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add monitoring tool..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, monitoringTools: [...(parsedCandidate.monitoringTools||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* Messaging */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Messaging / Streaming</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.messagingSystems?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-fuchsia-100 text-fuchsia-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, messagingSystems: parsedCandidate.messagingSystems?.filter((_,i)=> i!==index) })} className="ml-2 text-fuchsia-700 hover:text-fuchsia-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add messaging system..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, messagingSystems: [...(parsedCandidate.messagingSystems||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* CMS */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enterprise Solutions — CMS</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.cmsPlatforms?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, cmsPlatforms: parsedCandidate.cmsPlatforms?.filter((_,i)=> i!==index) })} className="ml-2 text-slate-700 hover:text-slate-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add CMS..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, cmsPlatforms: [...(parsedCandidate.cmsPlatforms||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                        {/* CRM / ERP */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enterprise Solutions — CRM / ERP</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.crmErp?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-stone-100 text-stone-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => setParsedCandidate({ ...parsedCandidate, crmErp: parsedCandidate.crmErp?.filter((_,i)=> i!==index) })} className="ml-2 text-stone-700 hover:text-stone-900"><X className="h-3 w-3"/></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add CRM/ERP..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e)=>{ if(e.key==='Enter'&& e.currentTarget.value.trim()){ setParsedCandidate({ ...parsedCandidate, crmErp: [...(parsedCandidate.crmErp||[]), e.currentTarget.value.trim()] }); e.currentTarget.value=''; } }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Functional Skills */}
                  <div>
                    <button type="button" className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg" onClick={()=> setShowFunctionalSkills(v=>!v)}>
                      <span className="font-medium text-gray-900">Functional Skills</span>
                      <span className="text-gray-500">{showFunctionalSkills ? 'Hide' : 'Show'}</span>
                    </button>
                    {showFunctionalSkills && (
                      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Soft Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Soft Skills
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {parsedCandidate.softSkills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center">
                          {skill}
                                <button onClick={() => { const newSkills = parsedCandidate.softSkills.filter((_, i) => i !== index); setParsedCandidate({...parsedCandidate, softSkills: newSkills}); }} className="ml-2 text-green-600 hover:text-green-800"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                          <input type="text" placeholder="Add soft skill..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setParsedCandidate({ ...parsedCandidate, softSkills: [...parsedCandidate.softSkills, e.currentTarget.value.trim()] }); e.currentTarget.value = ''; } }} />
                  </div>
                        {/* Agile Methodologies */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                            Agile Methodologies
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {parsedCandidate.methodologies?.map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center">
                                {skill}
                                <button onClick={() => { const newSkills = parsedCandidate.methodologies?.filter((_, i) => i !== index) || []; setParsedCandidate({...parsedCandidate, methodologies: newSkills}); }} className="ml-2 text-indigo-600 hover:text-indigo-800"><X className="h-3 w-3" /></button>
                              </span>
                            ))}
                          </div>
                          <input type="text" placeholder="Add methodology..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyPress={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setParsedCandidate({ ...parsedCandidate, methodologies: [...(parsedCandidate.methodologies || []), e.currentTarget.value.trim()] }); e.currentTarget.value = ''; } }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Professional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Headline</label>
                    <input
                      type="text"
                      value={parsedCandidate.professionalHeadline || ''}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, professionalHeadline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g. Senior Software Engineer specializing in React"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={parsedCandidate.experienceYears}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, experienceYears: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seniority Level</label>
                    <select
                      value={parsedCandidate.seniorityLevel}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, seniorityLevel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="INTERN">Intern</option>
                      <option value="JUNIOR">Junior</option>
                      <option value="MID_LEVEL">Mid-level</option>
                      <option value="SENIOR">Senior</option>
                      <option value="LEAD">Lead</option>
                      <option value="PRINCIPAL">Principal</option>
                      <option value="ARCHITECT">Architect</option>
                      <option value="DIRECTOR">Director</option>
                      <option value="VP">VP</option>
                      <option value="C_LEVEL">C-Level</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Industry</label>
                    <select
                      value={selectedIndustry}
                      onChange={(e)=> setSelectedIndustry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select...</option>
                      {industries.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Functional Domain</label>
                    <input
                      type="text"
                      value={parsedCandidate.functionalDomain || ''}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, functionalDomain: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g. Software Development, Product Management"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={parsedCandidate.linkedinUrl || ''}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, linkedinUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Work Preferences */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Work Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remote Preference</label>
                    <select
                      value={parsedCandidate.remotePreference}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, remotePreference: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="REMOTE">Remote Only</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="ONSITE">On-site</option>
                      <option value="FLEXIBLE">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                    <select
                      value={parsedCandidate.preferredContractType || ''}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, preferredContractType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select...</option>
                      <option value="PERMANENT">Permanent</option>
                      <option value="FREELANCE">Freelance</option>
                      <option value="FIXED_TERM">Fixed Term</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERNSHIP">Internship</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-4 pt-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={parsedCandidate.relocationWillingness || false}
                        onChange={(e) => setParsedCandidate({...parsedCandidate, relocationWillingness: e.target.checked})}
                        className="h-4 w-4 text-[#0A2F5A] focus:ring-[#0A2F5A] border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Open to relocation</span>
                    </label>
                  </div>
                </div>
                {/* Mobility */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Countries combobox */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobility Countries</label>
                      <input
                      value={countryQuery}
                      onChange={(e)=> { setCountryQuery(e.target.value); setShowCountryDropdown(true); }}
                      onFocus={()=> setShowCountryDropdown(true)}
                      placeholder="Search countries..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {showCountryDropdown && countryQuery && countrySuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-56 overflow-auto">
                        {countrySuggestions.map((c)=> (
                          <button
                            key={c.code}
                            type="button"
                            className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                            onClick={() => {
                              if(!mobilityCountries.includes(c.name)) setMobilityCountries([...mobilityCountries, c.name]);
                              setSelectedCountryCode(c.code);
                              setCountryQuery(c.name);
                              setCountrySuggestions([]);
                              setShowCountryDropdown(false);
                            }}
                          >{c.name}</button>
                        ))}
                  </div>
                    )}
                    {mobilityCountries.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mobilityCountries.map((c)=> (
                          <span key={c} className="px-2 py-1 bg-gray-200 rounded-full text-xs">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Cities combobox (country optional) */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobility Cities</label>
                    <input
                      value={cityQuery}
                      onChange={(e)=> { setCityQuery(e.target.value); setShowCityDropdown(true); }}
                      onFocus={()=> setShowCityDropdown(true)}
                      placeholder="Search cities..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {showCityDropdown && citySuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-56 overflow-auto">
                        {citySuggestions.map((p)=> (
                          <button
                            key={p.place_id}
                            type="button"
                            className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                            onClick={() => {
                              const name = p.structured_formatting?.main_text || p.description;
                              if(!mobilityCities.includes(name)) setMobilityCities([...mobilityCities, name]);
                              setCityQuery('');
                              setCitySuggestions([]);
                              setShowCityDropdown(false);
                            }}
                          >{p.structured_formatting?.main_text || p.description}</button>
                        ))}
                      </div>
                    )}
                    {mobilityCities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mobilityCities.map((c)=> (
                          <span key={c} className="px-2 py-1 bg-gray-200 rounded-full text-xs">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Availability & Compensation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Availability & Compensation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                    <input
                      type="date"
                      value={parsedCandidate.availableFrom || ''}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, availableFrom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary</label>
                    <input
                      type="text"
                      value={parsedCandidate.expectedSalary}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, expectedSalary: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g. CHF 100,000 - 120,000"
                    />
                  </div>
                </div>
              </div>

              {/* Education & Certifications */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Education & Certifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Education Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                    <select
                      value={parsedCandidate.educationLevel || ''}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, educationLevel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                    >
                      <option value="">Select...</option>
                      <option value="HIGH_SCHOOL">High School</option>
                      <option value="ASSOCIATE">Associate Degree</option>
                      <option value="BACHELOR">Bachelor's Degree</option>
                      <option value="MASTER">Master's Degree</option>
                      <option value="PHD">PhD</option>
                      <option value="CERTIFICATION">Professional Certification</option>
                      <option value="BOOTCAMP">Bootcamp</option>
                      <option value="SELF_TAUGHT">Self-taught</option>
                    </select>

                    {/* Degrees */}
                    <label className="block text-sm font-medium text-gray-700 mb-2">Degrees</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {parsedCandidate.degrees?.map((degree, index) => (
                        <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center">
                          {degree}
                          <button
                            onClick={() => {
                              const newDegrees = parsedCandidate.degrees?.filter((_, i) => i !== index) || [];
                              setParsedCandidate({...parsedCandidate, degrees: newDegrees});
                            }}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add degree..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setParsedCandidate({
                            ...parsedCandidate,
                            degrees: [...(parsedCandidate.degrees || []), e.currentTarget.value.trim()]
                          });
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>

                  {/* Certifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                    <input
                      type="number"
                      value={parsedCandidate.graduationYear || ''}
                      onChange={(e) => setParsedCandidate({...parsedCandidate, graduationYear: parseInt(e.target.value) || undefined})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                      placeholder="e.g. 2020"
                    />

                    <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {parsedCandidate.certifications?.map((cert, index) => (
                        <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center">
                          {cert}
                          <button
                            onClick={() => {
                              const newCerts = parsedCandidate.certifications?.filter((_, i) => i !== index) || [];
                              setParsedCandidate({...parsedCandidate, certifications: newCerts});
                            }}
                            className="ml-2 text-yellow-600 hover:text-yellow-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add certification..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setParsedCandidate({
                            ...parsedCandidate,
                            certifications: [...(parsedCandidate.certifications || []), e.currentTarget.value.trim()]
                          });
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Summary moved above */}

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setCurrentStep('intake')}>
                  Back
                </Button>
                <button
                  onClick={() => setCurrentStep('assign')}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>Continue to Assignment</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Assign & Save */}
          {currentStep === 'assign' && !createdCandidate && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Assign & Save Candidate
                </h3>
                <p className="text-gray-600">
                  Assign to jobs and configure settings
                </p>
              </div>

              {/* Job Assignments (expandable) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Assign to Jobs
                  {jobId && (
                    <span className="ml-2 px-2 py-1 bg-[#0A2F5A]/10 text-[#0A2F5A] text-xs rounded-full">
                      Auto-assigned
                    </span>
                  )}
                </h4>
                  <button type="button" onClick={()=> setShowAssignJobs(v=>!v)} className="text-sm text-[#0A2F5A] underline">{showAssignJobs ? 'Collapse' : 'Expand'}</button>
                </div>
                {showAssignJobs && (
                  <> 
                {loadingJobs ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-600">Loading jobs...</span>
                  </div>
                ) : availableJobs.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No active jobs found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {availableJobs.map((job) => {
                      const isCurrentJob = job.id === jobId;
                      return (
                        <div key={job.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                          isCurrentJob ? 'border-[#0A2F5A]/30 bg-[#0A2F5A]/5' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedJobs.includes(job.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedJobs([...selectedJobs, job.id]);
                                } else {
                                  setSelectedJobs(selectedJobs.filter(id => id !== job.id));
                                }
                              }}
                              className="h-4 w-4 text-[#0A2F5A] focus:ring-[#0A2F5A] border-gray-300 rounded"
                            />
                            <div>
                              <h5 className={`font-medium ${isCurrentJob ? 'text-[#0A2F5A]' : 'text-gray-900'}`}>
                                {job.title}
                                {isCurrentJob && (
                                  <span className="ml-2 text-xs text-[#0A2F5A]/80 font-normal">(Current Job)</span>
                                )}
                              </h5>
                              <p className={`text-sm ${isCurrentJob ? 'text-[#0A2F5A]/70' : 'text-gray-600'}`}>
                                {job.location || 'Location not specified'} • {job.status || 'Active'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {job.department || 'General'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    )}
                  </>
                )}
              </div>

              {/* Industries (always visible with autocomplete) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 flex items-center"><Building className="h-5 w-5 mr-2"/>Industries</h4>
                  </div>
                <div className="relative" ref={industryBoxRef}>
                          <input
                    value={industrySearch}
                    onChange={(e)=> { setIndustrySearch(e.target.value); setShowIndustryDropdown(true); }}
                    onFocus={()=> setShowIndustryDropdown(true)}
                    placeholder="Search industries..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  {showIndustryDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-56 overflow-auto">
                      {filteredIndustries.map((i)=> (
                        <button
                          key={i}
                          type="button"
                          className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                          onClick={()=> { setSelectedIndustry(i); setIndustrySearch(''); setShowIndustryDropdown(false); }}
                        >{i}</button>
                      ))}
                      {filteredIndustries.length===0 && (
                        <div className="px-3 py-2 text-xs text-gray-500">No matches</div>
                      )}
                          </div>
                  )}
                  {selectedIndustry && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs flex items-center">
                        {selectedIndustry}
                        <button className="ml-2 text-indigo-700" onClick={()=> setSelectedIndustry('')}><X className="h-3 w-3"/></button>
                      </span>
                        </div>
                  )}
                      </div>
              </div>

              {/* Practice Areas (always visible with autocomplete) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 flex items-center"><Tag className="h-5 w-5 mr-2"/>Practice Areas</h4>
                </div>
                <>
                    <div className="relative mb-2" ref={practiceBoxRef}>
                      <input
                        value={practiceSearch}
                        onChange={(e)=> { setPracticeSearch(e.target.value); setShowPracticeDropdown(true); }}
                        onFocus={()=> setShowPracticeDropdown(true)}
                        placeholder="Search practice areas..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {showPracticeDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-56 overflow-auto">
                          {filteredPractices.map((p)=> (
                            <button
                              key={p}
                              type="button"
                              className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                              onClick={() => {
                                setPracticeAreas(prev => prev.includes(p) ? prev : [...prev, p]);
                                setPracticeSearch('');
                                setShowPracticeDropdown(false);
                              }}
                            >{p}</button>
                          ))}
                          {filteredPractices.length===0 && (
                            <div className="px-3 py-2 text-xs text-gray-500">No matches</div>
                          )}
                  </div>
                )}
                    </div>
                    {practiceAreas.length>0 && (
                      <div className="flex flex-wrap gap-2">
                        {practiceAreas.map((p) => (
                          <span key={p} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center">
                            {p}
                            <button className="ml-2 text-blue-700" onClick={()=> setPracticeAreas(prev => prev.filter(x=> x!==p))}><X className="h-3 w-3"/></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
              </div>

              {/* Tags and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Tag className="h-5 w-5 mr-2" />
                    Tags
                  </h4>
                  
                  {/* Selected Tags */}
                  {candidateTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {candidateTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0A2F5A]/10 text-[#0A2F5A]"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[#0A2F5A]/60 hover:bg-[#0A2F5A]/20 hover:text-[#0A2F5A]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tag Input with Autocomplete */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type to add tags... (Press Enter or comma to add)"
                      value={tagInput}
                      onChange={(e) => handleTagInputChange(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                      onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2F5A] focus:border-[#0A2F5A] text-sm"
                    />
                    
                    {/* Autocomplete Suggestions */}
                    {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredTagSuggestions.slice(0, 8).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Type and press Enter or comma to add custom tags. Click suggestions to add quickly.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Notes</h4>
                  <textarea
                    placeholder="Add notes about this candidate..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setCurrentStep('review')}>
                  Back
                </Button>
                <button
                  data-test="submit-candidate"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Candidate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {createdCandidate && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Candidate Added Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                {parsedCandidate?.firstName} {parsedCandidate?.lastName} has been added to your talent pipeline
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      // Close modal and open candidate modal
                      onClose();
                      if (onViewCandidate) {
                        onViewCandidate(createdCandidate.id);
                      }
                    }}
                    className="btn-primary flex items-center justify-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Candidate</span>
                  </button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reset all form state and start over
                      setCreatedCandidate(null);
                      setCurrentStep('intake');
                      setUploadedFile(null);
                      setManualInput('');
                      setParsedCandidate({
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        currentTitle: '',
                        currentLocation: '',
                        summary: '',
                        experienceYears: 0,
                        technicalSkills: [],
                        softSkills: [],
                        spokenLanguages: [],
                        linkedinUrl: '',
                        githubUrl: '',
                        portfolioUrl: '',
                        seniorityLevel: 'JUNIOR',
                        primaryIndustry: '',
                        availability: '',
                        expectedSalary: '',
                        remotePreference: 'HYBRID',
                        professionalHeadline: '',
                        nationality: '',
                        timezone: '',
                        workPermitType: 'CITIZEN',
                        availableFrom: '',
                        graduationYear: new Date().getFullYear(),
                        educationLevel: 'BACHELOR',
                        functionalDomain: '',
                        preferredContractType: 'PERMANENT',
                        relocationWillingness: false,
                        freelancer: false,
                        programmingLanguages: [],
                        frameworks: [],
                        toolsAndPlatforms: [],
                        methodologies: [],
                        certifications: [],
                        degrees: [],
                        universities: [],
                        notableProjects: [],
                        workExperience: [],
                        education: []
                      });
                      setSelectedJobs(jobId ? [jobId] : []);
                      setSelectedTalentPools([]);
                      setCandidateTags([]);
                      setTagInput('');
                      setNotes('');
                      setIsSubmitting(false);
                      setIsParsing(false);
                      // Reset other states
                      setLinkedinUrl('');
                      setInputMethod(null);
                    }}
                    className="flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Another</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 