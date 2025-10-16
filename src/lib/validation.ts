import { z } from 'zod';

// Enums
export const JobStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED']);
export const LanguageEnum = z.enum(['EN', 'ES', 'FR', 'DE', 'PT', 'IT', 'NL', 'PL', 'RU', 'ZH', 'JA', 'KO']);
export const ApplicationStatusEnum = z.enum(['PENDING', 'REVIEWING', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER_EXTENDED', 'HIRED', 'REJECTED', 'WITHDRAWN']);
export const InterviewTypeEnum = z.enum(['PHONE_SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'FINAL', 'VIDEO_ONE_WAY']);
export const InterviewStatusEnum = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']);
export const CandidateStatusEnum = z.enum(['NEW', 'ACTIVE', 'PASSIVE', 'DO_NOT_CONTACT', 'BLACKLISTED']);
export const EmploymentTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'TEMPORARY']);
export const NoticePeriodEnum = z.enum(['IMMEDIATE', 'ONE_WEEK', 'TWO_WEEKS', 'ONE_MONTH', 'TWO_MONTHS', 'THREE_MONTHS', 'SIX_MONTHS', 'OTHER']);
export const SalaryTypeEnum = z.enum(['ANNUAL', 'MONTHLY', 'DAILY', 'HOURLY']);
export const EducationLevelEnum = z.enum(['HIGH_SCHOOL', 'BACHELORS', 'MASTERS', 'PHD', 'OTHER']);

// Helper function to map old education level values to new ones
export const mapEducationLevel = (level?: string): string | undefined => {
  if (!level) return undefined;
  const mappings: Record<string, string> = {
    'BACHELOR': 'BACHELORS',
    'MASTER': 'MASTERS',
    'DOCTORATE': 'PHD',
    'PROFESSIONAL': 'OTHER',
    'ASSOCIATE': 'OTHER',
    'CERTIFICATION': 'OTHER',
    'BOOTCAMP': 'OTHER',
    'SELF_TAUGHT': 'OTHER'
  };
  return mappings[level] || level;
};

// Helper to map UI/parsed contract types to DB enum
// UI can send: PERMANENT | FIXED_TERM | CONTRACT | FREELANCE | INTERNSHIP
// DB expects: FULL_TIME | PART_TIME | CONTRACT | FREELANCE | INTERNSHIP
export const mapContractType = (val?: string): string | undefined => {
  if (!val) return undefined;
  const v = String(val).toUpperCase();
  const direct = ['FULL_TIME','PART_TIME','CONTRACT','FREELANCE','INTERNSHIP'] as const;
  if ((direct as readonly string[]).includes(v)) return v;
  const map: Record<string,string> = {
    PERMANENT: 'FULL_TIME',
    FIXED_TERM: 'CONTRACT',
  };
  return map[v] || undefined;
};

// Base candidate schema with comprehensive field structure
export const candidateSchema = z.object({
  // 🧱 1. Identification & Contact (9 fields)
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  currentLocation: z.string().optional(),
  nationality: z.string().optional(),
  timezone: z.string().optional(),
  
  // 🧠 2. Professional Summary (6 fields)
  currentTitle: z.string().optional(),
  professionalHeadline: z.string().optional(),
  summary: z.string().optional(),
  seniorityLevel: z.enum(['INTERN', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'PRINCIPAL', 'ARCHITECT', 'DIRECTOR', 'VP', 'C_LEVEL']).optional(),
  primaryIndustry: z.string().optional(),
  functionalDomain: z.string().optional(),
  
  // 🛠 3. Skills & Technologies (7 fields)
  technicalSkills: z.array(z.string()).optional().transform(val => val ?? []),
  softSkills: z.array(z.string()).optional().transform(val => val ?? []),
  toolsAndPlatforms: z.array(z.string()).optional().transform(val => val ?? []),
  frameworks: z.array(z.string()).optional().transform(val => val ?? []),
  programmingLanguages: z.array(z.string()).optional().transform(val => val ?? []),
  spokenLanguages: z.array(z.string()).optional().transform(val => val ?? []),
  methodologies: z.array(z.string()).optional().transform(val => val ?? []),
  
  // 💼 4. Work Experience (4 fields - removed consultantType, managementExperience)
  experienceYears: z.number().int().min(0).max(50).optional(),
  companies: z.any().optional(), // JSON field
  notableProjects: z.array(z.string()).optional().transform(val => val ?? []),
  freelancer: z.boolean().optional().transform(val => val ?? false),
  
  // 🎓 5. Education & Certifications (5 fields - removed ongoingTraining)
  degrees: z.array(z.string()).optional().transform(val => val ?? []),
  certifications: z.array(z.string()).optional().transform(val => val ?? []),
  universities: z.array(z.string()).optional().transform(val => val ?? []),
  graduationYear: z.number().int().optional(),
  educationLevel: z.enum(['HIGH_SCHOOL', 'BACHELORS', 'MASTERS', 'PHD', 'OTHER']).optional(),
  
  // ⚙️ 6. Logistics & Preferences (6 fields)
  availableFrom: z.date().optional(),
  preferredContractType: z.enum(['PERMANENT', 'FREELANCE', 'FIXED_TERM', 'CONTRACT', 'INTERNSHIP']).optional(),
  expectedSalary: z.string().optional(),
  relocationWillingness: z.boolean().optional().transform(val => val ?? false),
  remotePreference: z.enum(['REMOTE', 'HYBRID', 'ONSITE', 'FLEXIBLE']).optional(),
  workPermitType: z.string().optional(),
  
  // 🤖 7. AI/ATS Specific Fields (3 fields)
  matchingScore: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional().transform(val => val ?? []),
  archived: z.boolean().optional().transform(val => val ?? false),
  
  // 💡 Meta Fields (8 fields)
  source: z.string().optional(),
  recruiterNotes: z.array(z.string()).optional().transform(val => val ?? []),
  interviewScores: z.any().optional(), // JSON field
  videoInterviewUrl: z.string().url().optional(),
  culturalFitScore: z.number().min(0).max(100).optional(),
  motivationalFitNotes: z.string().optional(),
  referees: z.any().optional(), // JSON field
  conversionStatus: z.enum(['IN_PIPELINE', 'PLACED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD']).optional(),
});

// Form schema for React Hook Form (consistent input/output types)
export const candidateFormSchema = z.object({
  // 🧱 1. Identification & Contact (9 fields)
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  currentLocation: z.string().optional(),
  nationality: z.string().optional(),
  timezone: z.string().optional(),
  
  // 🧠 2. Professional Summary (6 fields)
  currentTitle: z.string().optional(),
  professionalHeadline: z.string().optional(),
  summary: z.string().optional(),
  seniorityLevel: z.enum(['INTERN', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'PRINCIPAL', 'ARCHITECT', 'DIRECTOR', 'VP', 'C_LEVEL']).optional(),
  primaryIndustry: z.string().optional(),
  functionalDomain: z.string().optional(),
  
  // 🛠 3. Skills & Technologies (7 fields) - arrays that can be empty
  technicalSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  toolsAndPlatforms: z.array(z.string()),
  frameworks: z.array(z.string()),
  programmingLanguages: z.array(z.string()),
  spokenLanguages: z.array(z.string()),
  methodologies: z.array(z.string()),
  
  // 💼 4. Work Experience (4 fields)
  experienceYears: z.number().int().min(0).max(50).optional(),
  companies: z.any().optional(),
  notableProjects: z.array(z.string()),
  freelancer: z.boolean(),
  
  // 🎓 5. Education & Certifications (5 fields)
  degrees: z.array(z.string()),
  certifications: z.array(z.string()),
  universities: z.array(z.string()),
  graduationYear: z.number().int().optional(),
  educationLevel: z.enum(['HIGH_SCHOOL', 'BACHELORS', 'MASTERS', 'PHD', 'OTHER']).optional(),
  
  // ⚙️ 6. Logistics & Preferences (6 fields)
  availableFrom: z.date().optional(),
  preferredContractType: z.enum(['PERMANENT', 'FREELANCE', 'FIXED_TERM', 'CONTRACT', 'INTERNSHIP']).optional(),
  expectedSalary: z.string().optional(),
  relocationWillingness: z.boolean(),
  remotePreference: z.enum(['REMOTE', 'HYBRID', 'ONSITE', 'FLEXIBLE']).optional(),
  workPermitType: z.string().optional(),
  
  // 🤖 7. AI/ATS Specific Fields (3 fields)
  matchingScore: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()),
  archived: z.boolean(),
  
  // 💡 Meta Fields (8 fields)
  source: z.string().optional(),
  recruiterNotes: z.array(z.string()),
  interviewScores: z.any().optional(),
  videoInterviewUrl: z.string().url().optional().or(z.literal('')),
  culturalFitScore: z.number().min(0).max(100).optional(),
  motivationalFitNotes: z.string().optional(),
  referees: z.any().optional(),
  conversionStatus: z.enum(['IN_PIPELINE', 'PLACED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD']).optional(),
});

// API schema with transforms (for backend validation)
export const candidateApiSchema = candidateSchema;

// Transform function to convert form data to API data
export function transformFormToApiData(formData: z.infer<typeof candidateFormSchema>): z.infer<typeof candidateSchema> {
  return {
    ...formData,
    // Transform empty strings to undefined for URLs
    linkedinUrl: formData.linkedinUrl === '' ? undefined : formData.linkedinUrl,
    portfolioUrl: formData.portfolioUrl === '' ? undefined : formData.portfolioUrl,
    githubUrl: formData.githubUrl === '' ? undefined : formData.githubUrl,
    videoInterviewUrl: formData.videoInterviewUrl === '' ? undefined : formData.videoInterviewUrl,
  };
}

// Create candidate schema (for API)
export const createCandidateSchema = candidateSchema.omit({
  // Remove auto-generated fields
});

// Update candidate schema (for API)
export const updateCandidateSchema = candidateSchema.partial();

// LinkedIn parsing schema
export const linkedinParsingSchema = z.object({
  linkedinUrl: z.string().url('Valid LinkedIn URL is required'),
});

// Full LinkedIn data schema (for extension use)
export const linkedinDataSchema = z.object({
  linkedinUrl: z.string().url('Valid LinkedIn URL is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  currentTitle: z.string().optional(),
  currentCompany: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  profileImage: z.string().url().optional(),
  summary: z.string().optional(),
  workHistory: z.array(z.object({
    title: z.string(),
    company: z.string(),
    duration: z.string().optional(),
  })).optional(),
  extractedAt: z.string(),
  source: z.literal('linkedin_extension'),
});

// Legacy compatibility schemas for forms that still use old field names
export const legacyCandidateFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  currentTitle: z.string().optional(),
  currentCompany: z.string().optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  technicalSkills: z.array(z.string()).optional().transform(val => val ?? []),
  summary: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  currentLocation: z.string().optional(),
  expectedSalary: z.string().optional(),
  remotePreference: z.enum(['REMOTE', 'HYBRID', 'ONSITE', 'FLEXIBLE']).optional(),
  tags: z.array(z.string()).optional().transform(val => val ?? []),
});

// Job application schema
export const jobApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  coverLetter: z.string().optional(),
  referralCode: z.string().optional(),
  cvUrl: z.string().url().optional(),
  source: z.string().optional().default('website'),
});

// CV parsing schema
export const cvParsingSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  currentTitle: z.string().optional(),
  experienceYears: z.number().optional(),
  technicalSkills: z.array(z.string()).optional(),
  summary: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  currentLocation: z.string().optional(),
  degrees: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  universities: z.array(z.string()).optional(),
  companies: z.any().optional(),
});

// Search and filter schemas
export const candidateSearchSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seniorityLevel: z.string().optional(),
  primaryIndustry: z.string().optional(),
  remotePreference: z.string().optional(),
  experienceYears: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export type CandidateFormData = z.infer<typeof candidateSchema>;
export type LegacyCandidateFormData = z.infer<typeof legacyCandidateFormSchema>;
export type JobApplicationData = z.infer<typeof jobApplicationSchema>;
export type CVParsingData = z.infer<typeof cvParsingSchema>;
export type CandidateSearchData = z.infer<typeof candidateSearchSchema>;

// Job schemas
export const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  language: LanguageEnum.default('EN'),
  status: JobStatusEnum.default('DRAFT'),
});

export const updateJobSchema = jobSchema.partial();

// Application schemas
export const applicationSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
  coverLetter: z.string().optional(),
  cvUrl: z.string().url().optional(),
  referralCode: z.string().optional(),
  status: ApplicationStatusEnum.default('PENDING'),
});

export const publicApplicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  jobId: z.string(),
  coverLetter: z.string().optional(),
  referralCode: z.string().optional(),
});

// Referral schemas
export const referralSchema = z.object({
  candidateId: z.string(),
  referrerName: z.string().min(1, 'Referrer name is required'),
});

// Evaluation schemas
export const evaluationSchema = z.object({
  candidateId: z.string(),
  rating: z.number().min(1).max(5),
  notes: z.string().optional(),
  criteria: z.record(z.any()).optional(),
});

// Interview schemas
export const interviewSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
  type: InterviewTypeEnum,
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  location: z.string().optional(),
  videoInterviewUrl: z.string().url().optional(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const scheduleInterviewSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
  interviewerIds: z.array(z.string()),
  type: InterviewTypeEnum,
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(480),
  location: z.string().optional(),
});

// AI schemas
export const aiJobDescriptionSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  keyRequirements: z.array(z.string()).optional(),
  experience: z.string().optional(),
});

export const aiEmailTemplateSchema = z.object({
  templateType: z.enum(['COMMUNICATION', 'FOLLOW_UP', 'INTERVIEW_INVITE', 'REJECTION', 'OFFER']),
  candidateName: z.string().min(1, 'Candidate name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  companyName: z.string().min(1, 'Company name is required'),
  tone: z.enum(['PROFESSIONAL', 'FRIENDLY', 'CASUAL', 'FORMAL']).default('PROFESSIONAL'),
  customInstructions: z.string().optional(),
  includeJobDetails: z.boolean().default(true),
  includeCompanyInfo: z.boolean().default(true),
});

// Workflow schemas
export const workflowRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  trigger: z.string().min(1, 'Trigger is required'),
  conditions: z.record(z.any()),
  actions: z.record(z.any()),
  isActive: z.boolean().default(true),
});

// Type exports
export type CandidateInput = z.infer<typeof candidateSchema>;
export type CandidateFormInput = z.infer<typeof legacyCandidateFormSchema>;
export type CandidateParsingInput = z.infer<typeof cvParsingSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;

// Transform function for legacy form data to new candidate structure
export function transformCandidateFormData(legacyData: LegacyCandidateFormData): Partial<CandidateFormData> {
  return {
    firstName: legacyData.firstName,
    lastName: legacyData.lastName,
    email: legacyData.email,
    phone: legacyData.phone,
    currentTitle: legacyData.currentTitle,
    experienceYears: legacyData.experienceYears,
    technicalSkills: legacyData.technicalSkills,
    summary: legacyData.summary,
    linkedinUrl: legacyData.linkedinUrl,
    portfolioUrl: legacyData.portfolioUrl,
    currentLocation: legacyData.currentLocation,
    expectedSalary: legacyData.expectedSalary,
    remotePreference: legacyData.remotePreference,
    tags: legacyData.tags,
    source: 'manual_entry',
  };
}

export type AIEmailTemplateData = z.infer<typeof aiEmailTemplateSchema>; 