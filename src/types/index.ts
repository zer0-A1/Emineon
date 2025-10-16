// Core types for Emineon ATS

// Updated candidate interface matching new 40+ field structure
export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  currentTitle?: string | null;
  professionalHeadline?: string | null;
  currentLocation?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  experienceYears?: number | null;
  technicalSkills: string[];
  softSkills: string[];
  primaryIndustry?: string | null;
  seniorityLevel?: string | null;
  expectedSalary?: string | null;
  remotePreference?: string | null;
  tags: string[];
  status: string;
  conversionStatus?: string | null;
  matchingScore?: number | null;
  source?: string | null;
  createdAt: Date;
  lastUpdated: Date;
}

// Job interface
export interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  status: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceLevel?: string;
  employmentType: string[];
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  isRemote: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  
  // Pipeline and SLA fields
  pipelineStages?: string[];
  slaDeadline?: Date;
  slaDays?: number;
  
  // Additional computed fields
  applications?: number;
  candidates?: number;
  daysToFill?: number;
  slaProgress?: number;
}

// Application interface
export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  status: string;
  coverLetter?: string;
  cvUrl?: string;
  referralCode?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interview interface
export interface Interview {
  id: string;
  candidateId: string;
  jobId: string;
  interviewerId: string;
  type: string;
  status: string;
  scheduledAt: Date;
  duration: number;
  location?: string;
  videoInterviewUrl?: string;
  notes?: string;
  rating?: number;
  calendarEventId?: string;
  meetingLink?: string;
  dialInDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Assessment interface
export interface Assessment {
  id: string;
  candidateId: string;
  type: string;
  questions: any; // JSON
  answers?: any; // JSON
  score?: number;
  maxScore: number;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Evaluation interface
export interface Evaluation {
  id: string;
  candidateId: string;
  evaluatorId: string;
  rating: number;
  notes?: string;
  criteria?: any; // JSON
  createdAt: Date;
  updatedAt: Date;
}

// Referral interface
export interface Referral {
  id: string;
  candidateId: string;
  referrerId: string;
  referrerName: string;
  code: string;
  isUsed: boolean;
  reward?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Search and filter types
export interface SearchFilters {
  search?: string;
  status?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CandidateFilters extends SearchFilters {
  seniorityLevel?: string;
  primaryIndustry?: string;
  remotePreference?: string;
  experienceYears?: {
    min?: number;
    max?: number;
  };
  skills?: string[];
  location?: string;
  source?: string;
}

// Form data types
export interface CandidateFormData {
  fullName: string;
  email: string;
  phone?: string;
  currentTitle?: string;
  professionalHeadline?: string;
  summary?: string;
  technicalSkills: string[];
  experienceYears?: number;
  currentLocation?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  expectedSalary?: string;
  remotePreference?: string;
  tags: string[];
}

export interface JobFormData {
  title: string;
  description: string;
  department: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceLevel?: string;
  employmentType: string[];
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  isRemote: boolean;
}

// Utility types
export type CandidateStatus = 'NEW' | 'ACTIVE' | 'PASSIVE' | 'DO_NOT_CONTACT' | 'BLACKLISTED';
export type JobStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';
export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'INTERVIEW_SCHEDULED' | 'INTERVIEWED' | 'OFFER_EXTENDED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
export type InterviewType = 'PHONE_SCREENING' | 'TECHNICAL' | 'BEHAVIORAL' | 'FINAL' | 'VIDEO_ONE_WAY';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
export type AssessmentType = 'TECHNICAL' | 'PERSONALITY' | 'COGNITIVE' | 'SKILLS_BASED' | 'CUSTOM';
export type AssessmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export type SeniorityLevel = 'INTERN' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR' | 'LEAD' | 'PRINCIPAL' | 'ARCHITECT' | 'DIRECTOR' | 'VP' | 'C_LEVEL';
export type RemotePreference = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'FLEXIBLE';
export type ConversionStatus = 'IN_PIPELINE' | 'PLACED' | 'REJECTED' | 'WITHDRAWN' | 'ON_HOLD';

// Types for the application

export interface CandidateData {
  id: string;
  fullName: string;
  currentTitle: string;
  email?: string;
  phone?: string;
  location?: string;
  photo?: string;
  yearsOfExperience?: number;
  summary?: string;
  skills: string[];
  certifications: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    responsibilities: string;
  }>;
  education: string[];
  languages: string[];
}

export interface JobDescription {
  text: string;
  requirements: string[];
  skills: string[];
  responsibilities: string;
  title?: string;
  company?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
} 