// Database type definitions

// Enums - ALL from the database schema
export type CandidateStatus = 'NEW' | 'ACTIVE' | 'PASSIVE' | 'DO_NOT_CONTACT' | 'BLACKLISTED';
export type SeniorityLevel = 'JUNIOR' | 'MID_LEVEL' | 'SENIOR' | 'LEAD' | 'C_LEVEL';
export type RemotePreference = 'ON_SITE' | 'HYBRID' | 'REMOTE';
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'CLOSED';
export type JobCloseOutcome = 'WON' | 'LOST';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ApplicationStatus = 'APPLIED' | 'REVIEWED' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
export type ActivityType = 'NOTE' | 'EMAIL' | 'CALL' | 'MEETING' | 'TASK' | 'APPLICATION_UPDATE' | 'JOB_UPDATE' | 'CANDIDATE_UPDATE';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type EducationLevel = 'HIGH_SCHOOL' | 'BACHELORS' | 'MASTERS' | 'PHD' | 'OTHER';
export type ContractType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP';
export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';
export type FileType = 'CV' | 'COMPETENCE' | 'OTHER';
export type TemplateType = 'EMAIL' | 'MESSAGE';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export type VideoStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
export type SearchType = 'CANDIDATE' | 'JOB' | 'GLOBAL';
export type UserRole = 'ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'CLIENT';
export type PermissionType = 'READ' | 'WRITE' | 'DELETE' | 'MANAGE';

// Main types
export interface User {
  id: string; // TEXT primary key for Clerk integration
  email: string;
  name?: string;
  image?: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface UserPermission {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id?: string; // Null for global permissions
  permission_type: PermissionType;
  created_at: Date;
  updated_at: Date;
}

export interface Client {
  id: string;
  name: string;
  contact_person?: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  industry?: string;
  website?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClientContact {
  id: string;
  client_id: string;
  manager_id?: string | null;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  role?: string;
  department?: string;
  location?: string;
  linkedin_url?: string;
  notes?: string;
  tags?: string[];
  is_decision_maker?: boolean;
  influence_level?: string;
  relationship_strength?: number;
  created_at: Date;
  updated_at: Date;
  // Search & AI
  embedding?: number[];
  search_text?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  status: ProjectStatus;
  start_date?: Date;
  end_date?: Date;
  budget?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Candidate {
  id: string;
  
  // 📋 Basic Information
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  date_of_birth?: Date;
  nationality?: string;
  spoken_languages?: string[];
  timezone?: string;
  
  // 💼 Professional Profile
  current_title?: string;
  professional_headline?: string;
  current_location?: string;
  summary?: string;
  experience_years?: number;
  seniority_level?: SeniorityLevel;
  
  // 🛠 Skills & Expertise (6 categories)
  technical_skills?: string[];
  soft_skills?: string[];
  programming_languages?: string[];
  frameworks?: string[];
  tools_and_platforms?: string[];
  methodologies?: string[];
  
  // 🎓 Education
  education_level?: EducationLevel;
  universities?: string[];
  degrees?: string[];
  graduation_year?: number;
  certifications?: string[];
  
  // 💰 Work Preferences
  expected_salary?: string;
  preferred_contract_type?: ContractType;
  freelancer?: boolean;
  remote_preference?: RemotePreference;
  relocation_willingness?: boolean;
  mobility_countries?: string[];
  mobility_cities?: string[];
  work_permit_type?: string;
  available_from?: Date;
  notice_period?: string;
  
  // 🏢 Industry & Experience
  primary_industry?: string;
  functional_domain?: string;
  companies?: any; // JSONB - {current, previous, positions}
  notable_projects?: string[];
  
  // 🔗 Online Presence
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  video_interview_url?: string;
  personal_website?: string;
  
  // 📝 Notes & Metadata
  recruiter_notes?: string[];
  motivational_fit_notes?: string;
  cultural_fit_score?: number;
  matching_score?: number;
  interview_scores?: any; // JSONB
  tags?: string[];
  source?: string;
  source_details?: any; // JSONB
  conversion_status?: CandidateStatus;
  referees?: any; // JSONB
  references_checked?: boolean;
  background_check_status?: string;
  background_check_date?: Date;
  
  // 📄 Document Content
  original_cv_url?: string;
  original_cv_file_name?: string;
  original_cv_uploaded_at?: Date;
  competence_file_url?: string;
  competence_file_uploaded_at?: Date;
  
  // 🎥 Video Content
  video_title?: string;
  video_description?: string;
  video_url?: string;
  video_thumbnail_url?: string;
  video_duration?: number;
  video_uploaded_at?: Date;
  video_status?: VideoStatus;
  
  // 👥 Client Visibility
  client_visible?: boolean;
  share_with_client?: boolean;
  client_rating?: number;
  
  // 📊 Status & System
  status?: string;
  archived?: boolean;
  gdpr_consent: boolean;
  gdpr_consent_date: Date;
  created_by?: string; // User ID who created
  created_at: Date;
  updated_at: Date;
  
  // 🔍 Search & AI
  embedding?: number[]; // pgvector(1536)
  search_text?: string; // Generated text for full-text search
}

export interface Job {
  id: string;
  
  // Basic Info
  client_id?: string;
  project_id?: string;
  title: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  location?: string;
  job_type?: string;
  experience_level?: string;
  
  // Compensation
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  
  // Skills
  required_skills?: string[];
  preferred_skills?: string[];
  
  // Status & Workflow
  status: JobStatus;
  urgency?: UrgencyLevel;
  pipeline_stages?: any; // JSONB - array of stage names
  
  // People
  hiring_manager_id?: string;
  recruiter_id?: string;
  
  // Dates
  published_at?: Date;
  closed_at?: Date;
  
  // Outcome
  close_outcome?: JobCloseOutcome;
  close_reason?: string;
  
  // Notes
  notes?: string;
  
  // System
  created_at: Date;
  updated_at: Date;
  
  // Search & AI
  embedding?: number[]; // pgvector(1536)
  search_text?: string;
}

export interface Application {
  id: string;
  candidate_id: string;
  job_id: string;
  status: ApplicationStatus;
  stage?: string;
  applied_date: Date;
  source?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Interview {
  id: string;
  application_id: string;
  interviewer_id?: string;
  interview_date: Date;
  interview_type: string;
  feedback?: string;
  score?: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface UploadedFile {
  id: string;
  entity_type: string; // 'candidate', 'job', 'client'
  entity_id: string;
  file_name: string;
  file_url: string;
  file_type: FileType;
  file_size?: number;
  uploaded_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CompetenceFile {
  id: string;
  candidate_id: string;
  file_name: string;
  file_url: string;
  template_name?: string;
  generated_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_type: TemplateType;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  sender_id?: string;
  recipient_id?: string; // For internal messages
  candidate_id?: string;
  job_id?: string;
  subject?: string;
  body: string;
  message_type: string; // 'email', 'sms', 'internal'
  status: MessageStatus;
  sent_at: Date;
  read_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  status: NotificationStatus;
  created_at: Date;
  updated_at: Date;
}

export interface TalentPool {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TalentPoolCandidate {
  id: string;
  talent_pool_id: string;
  candidate_id: string;
  added_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SearchHistory {
  id: string;
  user_id?: string;
  query: string;
  search_type: SearchType;
  results_count?: number;
  searched_at: Date;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query_string: string;
  filters?: any; // JSONB
  search_type: SearchType;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id?: string;
  activity_type: ActivityType;
  description: string;
  activity_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ClientComment {
  id: string;
  client_id: string;
  candidate_id?: string;
  job_id?: string;
  user_id?: string;
  comment_text: string;
  rating?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AIMatch {
  id: string;
  candidate_id: string;
  job_id: string;
  match_score: number;
  explanation?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AIAssessment {
  id: string;
  candidate_id: string;
  assessment_type: string;
  score?: number;
  report?: any; // JSONB
  generated_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any; // JSONB
  new_value?: any; // JSONB
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface Settings {
  id: string;
  key: string;
  value: any; // JSONB
  created_at: Date;
  updated_at: Date;
}

// Helper types for creating/updating
export type CreateCandidate = Omit<Candidate, 'id' | 'created_at' | 'updated_at' | 'embedding' | 'search_text'>;
export type UpdateCandidate = Partial<CreateCandidate>;

export type CreateJob = Omit<Job, 'id' | 'created_at' | 'updated_at' | 'embedding' | 'search_text'>;
export type UpdateJob = Partial<CreateJob>;

export type CreateClient = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type UpdateClient = Partial<CreateClient>;

export type CreateClientContact = Omit<ClientContact, 'id' | 'created_at' | 'updated_at' | 'embedding' | 'search_text'>;
export type UpdateClientContact = Partial<CreateClientContact>;

export type CreateProject = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProject = Partial<CreateProject>;

export type CreateApplication = Omit<Application, 'id' | 'created_at' | 'updated_at'>;
export type UpdateApplication = Partial<CreateApplication>;

export type CreateInterview = Omit<Interview, 'id' | 'created_at' | 'updated_at'>;
export type UpdateInterview = Partial<CreateInterview>;

export type CreateCompetenceFile = Omit<CompetenceFile, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCompetenceFile = Partial<CreateCompetenceFile>;

export type CreateNotification = Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
export type UpdateNotification = Partial<CreateNotification>;
