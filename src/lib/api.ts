const BASE_URL = '';

export interface CreateCandidateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentTitle?: string;
  currentLocation?: string;
  summary?: string;
  experienceYears?: number;
  technicalSkills?: string[];
  softSkills?: string[];
  toolsAndPlatforms?: string[];
  frameworks?: string[];
  programmingLanguages?: string[];
  spokenLanguages?: string[];
  methodologies?: string[];
  notableProjects?: string[];
  freelancer?: boolean;
  degrees?: string[];
  certifications?: string[];
  universities?: string[];
  graduationYear?: number;
  educationLevel?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  expectedSalary?: string;
  remotePreference?: string;
  preferredContractType?: string;
  relocationWillingness?: boolean;
  workPermitType?: string;
  nationality?: string;
  timezone?: string;
  primaryIndustry?: string;
  functionalDomain?: string;
  seniorityLevel?: string;
  professionalHeadline?: string;
  availableFrom?: Date;
  matchingScore?: number;
  culturalFitScore?: number;
  motivationalFitNotes?: string;
  videoInterviewUrl?: string;
  companies?: any;
  referees?: any;
  interviewScores?: any;
  tags?: string[];
  source?: string;
  recruiterNotes?: string[];
  archived?: boolean;
  conversionStatus?: string;
}

export interface CandidateResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  currentTitle?: string | null;
  currentLocation?: string | null;
  summary?: string | null;
  experienceYears?: number | null;
  technicalSkills: string[];
  softSkills: string[];
  toolsAndPlatforms: string[];
  frameworks: string[];
  programmingLanguages: string[];
  spokenLanguages: string[];
  methodologies: string[];
  notableProjects: string[];
  freelancer: boolean;
  degrees: string[];
  certifications: string[];
  universities: string[];
  graduationYear?: number | null;
  educationLevel?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  expectedSalary?: string | null;
  remotePreference?: string | null;
  preferredContractType?: string | null;
  relocationWillingness: boolean;
  workPermitType?: string | null;
  nationality?: string | null;
  timezone?: string | null;
  primaryIndustry?: string | null;
  functionalDomain?: string | null;
  seniorityLevel?: string | null;
  professionalHeadline?: string | null;
  availableFrom?: Date | null;
  matchingScore?: number | null;
  culturalFitScore?: number | null;
  motivationalFitNotes?: string | null;
  videoInterviewUrl?: string | null;
  companies?: any;
  referees?: any;
  interviewScores?: any;
  tags: string[];
  source?: string | null;
  recruiterNotes: string[];
  archived: boolean;
  conversionStatus?: string | null;
  status: string;
  createdAt: string;
  lastUpdated: string;
}

export interface LegacyCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentTitle?: string;
  currentCompany?: string;
  currentLocation?: string;
  summary?: string;
  experienceYears?: number;
  technicalSkills?: string[];
  softSkills?: string[];
  toolsAndPlatforms?: string[];
  frameworks?: string[];
  programmingLanguages?: string[];
  spokenLanguages?: string[];
  methodologies?: string[];
  notableProjects?: string[];
  freelancer?: boolean;
  degrees?: string[];
  certifications?: string[];
  universities?: string[];
  graduationYear?: number;
  educationLevel?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  expectedSalary?: string;
  remotePreference?: string;
  preferredContractType?: string;
  relocationWillingness?: boolean;
  workPermitType?: string;
  nationality?: string;
  timezone?: string;
  primaryIndustry?: string;
  functionalDomain?: string;
  seniorityLevel?: string;
  professionalHeadline?: string;
  availableFrom?: Date | null;
  matchingScore?: number;
  culturalFitScore?: number;
  motivationalFitNotes?: string;
  videoInterviewUrl?: string | null;
  companies?: any;
  referees?: any;
  interviewScores?: any;
  tags?: string[];
  source?: string;
  recruiterNotes?: string[];
  archived?: boolean;
  conversionStatus?: string;
  status?: string;
  createdAt?: string;
  lastUpdated?: string;
}

export interface CandidateListResponse {
  success: boolean;
  data: {
    candidates: CandidateResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CandidateSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  tags?: string;
  seniorityLevel?: string;
  primaryIndustry?: string;
  remotePreference?: string;
  experienceYears?: {
    min?: number;
    max?: number;
  };
}

export interface JobResponse {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  language: string;
  status: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  experienceLevel?: string | null;
  employmentType: string[];
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  isRemote: boolean;
  publicToken?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  expiresAt?: string | null;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  department: string;
  location: string;
  language?: string;
  status?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceLevel?: string;
  employmentType?: string[];
  benefits?: string[];
  requirements?: string[];
  responsibilities?: string[];
  isRemote?: boolean;
  expiresAt?: Date;
}

export interface JobListResponse {
  success: boolean;
  data: {
    jobs: JobResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface JobSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  department?: string;
}

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}, token?: string) {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout to accommodate heavier queries

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      return { ...data, status: response.status };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`Request timeout for ${endpoint}`);
        return { success: false, error: 'Request timeout', status: 408 };
      }
      
      console.error(`Request failed for ${endpoint}:`, error);
      return { success: false, error: error.message || 'Network error', status: 0 };
    }
  }

  candidates = {
    list: async (token?: string, searchParams?: {
      search?: string;
      status?: string;
      skills?: string;
      location?: string;
      source?: string;
      limit?: string;
    }) => {
      let url = '/api/candidates';
      
      if (searchParams) {
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
          if (typeof value === 'string' && value.trim()) {
            params.append(key, value);
          }
        });
        
        if (!params.has('limit')) {
          params.append('limit', '200');
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      } else {
        // Default limit when no params are provided
        url += '?limit=200';
      }
      
      return this.request(url, {}, token);
    },

    create: async (candidateData: CreateCandidateRequest, token?: string) => {
      return this.request('/api/candidates', {
        method: 'POST',
        body: JSON.stringify(candidateData),
      }, token);
    },

    get: async (id: string, token?: string) => {
      return this.request(`/api/candidates/${id}`, {}, token);
    },

    update: async (id: string, candidateData: Partial<CreateCandidateRequest>, token?: string) => {
      return this.request(`/api/candidates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(candidateData),
      }, token);
    },

    delete: async (id: string, token?: string) => {
      return this.request(`/api/candidates/${id}`, {
        method: 'DELETE',
      }, token);
    },

    // Mock data for development
    mockCandidates: (): CandidateResponse[] => [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        currentTitle: 'Senior Software Engineer',
        currentLocation: 'San Francisco, CA',
        summary: 'Experienced full-stack developer with expertise in React and Node.js',
        experienceYears: 5,
        technicalSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        softSkills: ['Leadership', 'Communication'],
        toolsAndPlatforms: ['Docker', 'AWS'],
        frameworks: ['React', 'Express'],
        programmingLanguages: ['JavaScript', 'TypeScript'],
        spokenLanguages: ['English', 'Spanish'],
        methodologies: ['Agile', 'Scrum'],
        notableProjects: ['E-commerce Platform', 'Mobile App'],
        freelancer: false,
        degrees: ['Bachelor of Computer Science'],
        certifications: ['AWS Certified'],
        universities: ['Stanford University'],
        graduationYear: 2018,
        educationLevel: 'BACHELOR',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        portfolioUrl: 'https://johndoe.dev',
        githubUrl: 'https://github.com/johndoe',
        expectedSalary: '$120,000',
        remotePreference: 'HYBRID',
        preferredContractType: 'PERMANENT',
        relocationWillingness: false,
        workPermitType: 'US Citizen',
        nationality: 'American',
        timezone: 'PST',
        primaryIndustry: 'Technology',
        functionalDomain: 'Frontend Development',
        seniorityLevel: 'SENIOR',
        professionalHeadline: 'Senior Full-Stack Developer',
        availableFrom: null,
        matchingScore: 85,
        culturalFitScore: 90,
        motivationalFitNotes: 'Highly motivated and team-oriented',
        videoInterviewUrl: null,
        companies: null,
        referees: null,
        interviewScores: null,
        tags: ['React Expert', 'Senior Developer'],
        source: 'LinkedIn',
        recruiterNotes: ['Initial screening completed'],
        archived: false,
        conversionStatus: 'IN_PIPELINE',
        status: 'ACTIVE',
        createdAt: '2024-01-15T10:00:00Z',
        lastUpdated: '2024-01-15T10:00:00Z',
      },
    ],

    // Helper to get candidate by ID
    getCandidateById: (id: string): CandidateResponse | undefined => {
      return api.candidates.mockCandidates().find((candidate: CandidateResponse) => candidate.id === id);
    },

    // Helper to format candidate name
    formatCandidateName: (candidate: CandidateResponse): string => {
      return `${candidate.firstName} ${candidate.lastName}`;
    },

    // Helper to get candidate initials
    getCandidateInitials: (candidate: CandidateResponse): string => {
      return `${candidate.firstName[0]}${candidate.lastName[0]}`;
    },

    // Helper to format candidate experience
    formatExperience: (candidate: CandidateResponse): string => {
      if (!candidate.experienceYears) return 'No experience listed';
      return `${candidate.experienceYears} year${candidate.experienceYears !== 1 ? 's' : ''} experience`;
    },

    // Helper to get candidate skills count
    getSkillsCount: (candidate: CandidateResponse): number => {
      return (candidate.technicalSkills?.length || 0) + (candidate.softSkills?.length || 0);
    },
  };

  jobs = {
    list: async (token?: string, searchParams?: JobSearchParams) => {
      let url = '/api/jobs';
      
      if (searchParams) {
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      return this.request(url, {}, token);
    },

    create: async (jobData: CreateJobRequest, token?: string) => {
      return this.request('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      }, token);
    },

    get: async (id: string, token?: string) => {
      return this.request(`/api/jobs/${id}`, {}, token);
    },

    update: async (id: string, jobData: Partial<CreateJobRequest>, token?: string) => {
      return this.request(`/api/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(jobData),
      }, token);
    },

    delete: async (id: string, token?: string) => {
      return this.request(`/api/jobs/${id}`, {
        method: 'DELETE',
      }, token);
    },

    // Mock data for development
    mockJobs: (): JobResponse[] => [
      {
        id: '1',
        title: 'Senior Software Engineer',
        description: 'We are looking for a senior software engineer with experience in React, Node.js, and TypeScript.',
        department: 'Engineering',
        location: 'San Francisco, CA',
        language: 'EN',
        status: 'ACTIVE',
        salaryMin: 120000,
        salaryMax: 160000,
        salaryCurrency: 'USD',
        experienceLevel: 'Senior',
        employmentType: ['FULL_TIME'],
        benefits: ['Health Insurance', '401k', 'Remote Work'],
        requirements: ['5+ years experience', 'React expertise', 'Node.js knowledge'],
        responsibilities: ['Lead development team', 'Code reviews', 'Architecture decisions'],
        isRemote: false,
        publicToken: 'job_123_abc',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        publishedAt: '2024-01-15T10:00:00Z',
        expiresAt: null,
      },
      {
        id: '2',
        title: 'Product Manager',
        description: 'Product manager to lead our mobile app development team.',
        department: 'Product',
        location: 'New York, NY',
        language: 'EN',
        status: 'ACTIVE',
        salaryMin: 100000,
        salaryMax: 140000,
        salaryCurrency: 'USD',
        experienceLevel: 'Mid-Level',
        employmentType: ['FULL_TIME'],
        benefits: ['Health Insurance', '401k', 'Stock Options'],
        requirements: ['3+ years PM experience', 'Mobile app experience', 'Agile methodology'],
        responsibilities: ['Product roadmap', 'Stakeholder management', 'Feature prioritization'],
        isRemote: true,
        publicToken: 'job_456_def',
        createdAt: '2024-01-14T10:00:00Z',
        updatedAt: '2024-01-14T10:00:00Z',
        publishedAt: '2024-01-14T10:00:00Z',
        expiresAt: null,
      },
    ],

    // Helper to get job by ID
    getJobById: (id: string): JobResponse | undefined => {
      return api.jobs.mockJobs().find((job: JobResponse) => job.id === id);
    },

    // Helper to format salary range
    formatSalaryRange: (job: JobResponse): string => {
      if (!job.salaryMin && !job.salaryMax) return 'Salary not specified';
      if (job.salaryMin && job.salaryMax) {
        return `${job.salaryCurrency || '$'}${job.salaryMin.toLocaleString()} - ${job.salaryCurrency || '$'}${job.salaryMax.toLocaleString()}`;
      }
      if (job.salaryMin) return `From ${job.salaryCurrency || '$'}${job.salaryMin.toLocaleString()}`;
      if (job.salaryMax) return `Up to ${job.salaryCurrency || '$'}${job.salaryMax.toLocaleString()}`;
      return 'Salary not specified';
    },

    // Helper to check if job is remote
    isRemoteJob: (job: JobResponse): boolean => {
      return job.isRemote || job.location.toLowerCase().includes('remote');
    },

    // Helper to get job status color
    getStatusColor: (status: string): string => {
      switch (status.toLowerCase()) {
        case 'active': return 'bg-green-100 text-green-800 border-green-200';
        case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'closed': return 'bg-red-100 text-red-800 border-red-200';
        case 'archived': return 'bg-gray-100 text-gray-600 border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    },
  };
}

export const api = new ApiClient(); 