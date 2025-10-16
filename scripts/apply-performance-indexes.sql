-- Performance optimization indexes for Emineon ATS

-- Applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_job_candidate ON emineon.applications ("jobId", "candidateId");
CREATE INDEX IF NOT EXISTS idx_applications_stage ON emineon.applications (stage) WHERE stage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applications_status ON emineon.applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON emineon.applications ("createdAt" DESC);

-- Candidates table indexes
CREATE INDEX IF NOT EXISTS idx_candidates_email ON emineon.candidates (email);
CREATE INDEX IF NOT EXISTS idx_candidates_updated ON emineon.candidates (last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON emineon.candidates (status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_location ON emineon.candidates (current_location) WHERE current_location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_title ON emineon.candidates (current_title) WHERE current_title IS NOT NULL;

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_project_status ON emineon.jobs (project_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON emineon.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_close_outcome ON emineon.jobs (close_outcome) WHERE close_outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_created ON emineon.jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_owner ON emineon.jobs (owner) WHERE owner IS NOT NULL;

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_client_status ON emineon.projects (client_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON emineon.projects (status);

-- Full-text search indexes for candidates
CREATE INDEX IF NOT EXISTS idx_candidates_search ON emineon.candidates USING GIN(
  to_tsvector('english', 
    COALESCE(first_name, '') || ' ' || 
    COALESCE(last_name, '') || ' ' || 
    COALESCE(email, '') || ' ' || 
    COALESCE(current_title, '') || ' ' ||
    COALESCE(current_location, '') || ' ' ||
    COALESCE(professional_headline, '') || ' ' ||
    array_to_string(technical_skills, ' ') || ' ' ||
    array_to_string(soft_skills, ' ')
  )
);

-- Full-text search indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_search ON emineon.jobs USING GIN(
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(location, '') || ' ' ||
    array_to_string(required_skills, ' ')
  )
);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_applications_job_stage_status ON emineon.applications (job_id, stage, status);
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON emineon.candidates USING GIN(technical_skills);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON emineon.jobs USING GIN(required_skills);

-- Index for activity tracking
CREATE INDEX IF NOT EXISTS idx_project_activity_project_created ON emineon.project_activities (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_activity_type ON emineon.project_activities (type);

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_jobs ON emineon.jobs (id, title, project_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_pending_applications ON emineon.applications (candidate_id, job_id) WHERE status = 'PENDING';

-- Client table indexes
CREATE INDEX IF NOT EXISTS idx_clients_active ON emineon.clients (id, name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_clients_email ON emineon.clients (email) WHERE email IS NOT NULL;

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON emineon.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON emineon.users (role);

-- Performance view for job statistics
CREATE OR REPLACE VIEW emineon.job_performance_stats AS
SELECT 
  j.id,
  j.title,
  j.status,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT CASE WHEN a.stage = 'hired' THEN a.id END) as hired_count,
  COUNT(DISTINCT CASE WHEN a.stage = 'rejected' THEN a.id END) as rejected_count,
  AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at))/86400)::numeric(10,2) as avg_time_to_process_days
FROM emineon.jobs j
LEFT JOIN emineon.applications a ON j.id = a.job_id
GROUP BY j.id, j.title, j.status;
