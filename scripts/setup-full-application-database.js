const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupFullApplicationDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up COMPLETE Emineon ATS database schema...\n');
    
    // Test connection
    console.log('1️⃣ Testing connection...');
    const test = await client.query('SELECT NOW()');
    console.log('✅ Connected:', test.rows[0].now);
    
    // Enable required extensions
    console.log('\n2️⃣ Enabling extensions...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm'); // For text search
    console.log('✅ Extensions enabled');
    
    // Drop existing types to recreate them
    console.log('\n3️⃣ Creating enums...');
    const enumTypes = [
      'candidate_status',
      'seniority_level', 
      'remote_preference',
      'job_status',
      'job_close_outcome',
      'urgency_level',
      'application_status',
      'activity_type',
      'project_status',
      'education_level',
      'contract_type',
      'notification_type',
      'notification_status',
      'file_type',
      'template_type',
      'message_status',
      'video_status',
      'search_type',
      'user_role',
      'permission_type'
    ];
    
    // Drop enums if they exist
    for (const enumType of enumTypes) {
      await client.query(`DROP TYPE IF EXISTS ${enumType} CASCADE`);
    }
    
    // Create all enums
    const enumDefinitions = {
      candidate_status: ['NEW', 'ACTIVE', 'PASSIVE', 'DO_NOT_CONTACT', 'BLACKLISTED'],
      seniority_level: ['JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'C_LEVEL'],
      remote_preference: ['ON_SITE', 'HYBRID', 'REMOTE'],
      job_status: ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'CLOSED'],
      job_close_outcome: ['WON', 'LOST'],
      urgency_level: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      application_status: ['APPLIED', 'REVIEWED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'],
      activity_type: ['NOTE', 'EMAIL', 'CALL', 'MEETING', 'TASK', 'APPLICATION_UPDATE', 'JOB_UPDATE', 'CANDIDATE_UPDATE', 'STATUS_CHANGE', 'DOCUMENT_UPLOAD'],
      project_status: ['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD'],
      education_level: ['HIGH_SCHOOL', 'BACHELORS', 'MASTERS', 'PHD', 'OTHER'],
      contract_type: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'TEMPORARY'],
      notification_type: ['EMAIL', 'SMS', 'IN_APP', 'WEBHOOK'],
      notification_status: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ'],
      file_type: ['CV', 'COVER_LETTER', 'PORTFOLIO', 'CERTIFICATE', 'OTHER'],
      template_type: ['COMPETENCE', 'EMAIL', 'CONTRACT', 'OFFER_LETTER'],
      message_status: ['DRAFT', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
      video_status: ['PROCESSING', 'READY', 'FAILED'],
      search_type: ['CANDIDATE', 'JOB', 'CLIENT', 'PROJECT', 'GLOBAL'],
      user_role: ['ADMIN', 'RECRUITER', 'CLIENT', 'CANDIDATE', 'VIEWER'],
      permission_type: ['READ', 'WRITE', 'DELETE', 'ADMIN']
    };
    
    for (const [enumName, values] of Object.entries(enumDefinitions)) {
      const enumSql = `CREATE TYPE ${enumName} AS ENUM (${values.map(v => `'${v}'`).join(', ')})`;
      await client.query(enumSql);
      console.log(`✅ Created enum: ${enumName}`);
    }
    
    // Drop all tables in correct order
    console.log('\n4️⃣ Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS search_history CASCADE;
      DROP TABLE IF EXISTS saved_searches CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS email_templates CASCADE;
      DROP TABLE IF EXISTS document_templates CASCADE;
      DROP TABLE IF EXISTS ai_matches CASCADE;
      DROP TABLE IF EXISTS ai_assessments CASCADE;
      DROP TABLE IF EXISTS client_comments CASCADE;
      DROP TABLE IF EXISTS project_activities CASCADE;
      DROP TABLE IF EXISTS competence_files CASCADE;
      DROP TABLE IF EXISTS uploaded_files CASCADE;
      DROP TABLE IF EXISTS applications CASCADE;
      DROP TABLE IF EXISTS job_views CASCADE;
      DROP TABLE IF EXISTS job_shares CASCADE;
      DROP TABLE IF EXISTS interview_slots CASCADE;
      DROP TABLE IF EXISTS interviews CASCADE;
      DROP TABLE IF EXISTS evaluations CASCADE;
      DROP TABLE IF EXISTS talent_pools CASCADE;
      DROP TABLE IF EXISTS talent_pool_candidates CASCADE;
      DROP TABLE IF EXISTS jobs CASCADE;
      DROP TABLE IF EXISTS candidates CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS clients CASCADE;
      DROP TABLE IF EXISTS user_permissions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS settings CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
    `);
    console.log('✅ Dropped existing tables');
    
    // Create tables
    console.log('\n5️⃣ Creating tables...');
    
    // 1. Settings table (for global app settings)
    await client.query(`
      CREATE TABLE settings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        key TEXT UNIQUE NOT NULL,
        value JSONB,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created settings table');
    
    // 2. Users table (extended with roles and preferences)
    await client.query(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        image TEXT,
        role user_role DEFAULT 'RECRUITER',
        phone TEXT,
        timezone TEXT DEFAULT 'UTC',
        locale TEXT DEFAULT 'en',
        preferences JSONB DEFAULT '{}',
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created users table');
    
    // 3. User permissions table
    await client.query(`
      CREATE TABLE user_permissions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        resource TEXT NOT NULL,
        permission permission_type NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, resource, permission)
      )
    `);
    console.log('✅ Created user_permissions table');
    
    // 4. Clients table (extended)
    await client.query(`
      CREATE TABLE clients (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        website TEXT,
        industry TEXT,
        company_size TEXT,
        logo_url TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        postal_code TEXT,
        tax_id TEXT,
        billing_email TEXT,
        notes TEXT,
        tags TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created clients table');
    
    // 5. Projects table (extended)
    await client.query(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        description TEXT,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        status project_status DEFAULT 'ACTIVE',
        start_date DATE,
        end_date DATE,
        budget DECIMAL(12,2),
        currency TEXT DEFAULT 'USD',
        success_fee_percentage DECIMAL(5,2),
        retainer_fee DECIMAL(12,2),
        team_members TEXT[],
        tags TEXT[],
        objectives TEXT[],
        deliverables TEXT[],
        notes TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created projects table');
    
    // 6. Candidates table (comprehensive)
    await client.query(`
      CREATE TABLE candidates (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        
        -- Basic Information
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        date_of_birth DATE,
        nationality TEXT,
        spoken_languages TEXT[],
        timezone TEXT,
        
        -- Professional Profile
        current_title TEXT,
        professional_headline TEXT,
        current_location TEXT,
        summary TEXT,
        experience_years INTEGER,
        seniority_level seniority_level,
        
        -- Skills & Expertise
        technical_skills TEXT[],
        soft_skills TEXT[],
        programming_languages TEXT[],
        frameworks TEXT[],
        tools_and_platforms TEXT[],
        methodologies TEXT[],
        
        -- Education
        education_level education_level,
        universities TEXT[],
        degrees TEXT[],
        graduation_year INTEGER,
        certifications TEXT[],
        
        -- Work Preferences
        expected_salary TEXT,
        preferred_contract_type contract_type,
        freelancer BOOLEAN DEFAULT FALSE,
        remote_preference remote_preference,
        relocation_willingness BOOLEAN DEFAULT FALSE,
        mobility_countries TEXT[],
        mobility_cities TEXT[],
        work_permit_type TEXT,
        available_from DATE,
        notice_period TEXT,
        
        -- Industry & Experience
        primary_industry TEXT,
        functional_domain TEXT,
        companies JSONB,
        notable_projects TEXT[],
        
        -- Online Presence
        linkedin_url TEXT,
        github_url TEXT,
        portfolio_url TEXT,
        video_interview_url TEXT,
        personal_website TEXT,
        
        -- Notes & Metadata
        recruiter_notes TEXT[],
        motivational_fit_notes TEXT,
        cultural_fit_score INTEGER CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 100),
        matching_score INTEGER CHECK (matching_score >= 0 AND matching_score <= 100),
        interview_scores JSONB,
        
        -- Additional metadata
        tags TEXT[],
        source TEXT,
        source_details JSONB,
        conversion_status candidate_status DEFAULT 'NEW',
        referees JSONB,
        references_checked BOOLEAN DEFAULT FALSE,
        background_check_status TEXT,
        background_check_date DATE,
        
        -- Document fields
        original_cv_url TEXT,
        original_cv_file_name TEXT,
        original_cv_uploaded_at TIMESTAMP,
        competence_file_url TEXT,
        competence_file_uploaded_at TIMESTAMP,
        
        -- Video fields
        video_title TEXT,
        video_description TEXT,
        video_url TEXT,
        video_thumbnail_url TEXT,
        video_duration INTEGER,
        video_uploaded_at TIMESTAMP,
        video_status video_status,
        
        -- Client visibility
        client_visible BOOLEAN DEFAULT FALSE,
        share_with_client BOOLEAN DEFAULT FALSE,
        client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
        
        -- System fields
        status TEXT DEFAULT 'active',
        archived BOOLEAN DEFAULT FALSE,
        gdpr_consent BOOLEAN DEFAULT TRUE,
        gdpr_consent_date TIMESTAMP DEFAULT NOW(),
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        
        -- Search and AI
        embedding vector(1536),
        search_text TEXT GENERATED ALWAYS AS (
          LOWER(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || 
          COALESCE(email, '') || ' ' || COALESCE(current_title, '') || ' ' || 
          COALESCE(summary, '') || ' ' || COALESCE(current_location, ''))
        ) STORED
      )
    `);
    console.log('✅ Created candidates table');
    
    // 7. Jobs table (comprehensive)
    await client.query(`
      CREATE TABLE jobs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        
        -- Basic job info
        title TEXT NOT NULL,
        description TEXT,
        requirements TEXT[],
        responsibilities TEXT[],
        nice_to_have TEXT[],
        benefits TEXT[],
        
        -- Company & location
        company TEXT,
        department TEXT,
        team_size INTEGER,
        reports_to TEXT,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        location TEXT,
        locations TEXT[],
        remote_preference remote_preference,
        
        -- Compensation
        salary_min DECIMAL(12,2),
        salary_max DECIMAL(12,2),
        salary_currency TEXT DEFAULT 'USD',
        salary_period TEXT DEFAULT 'YEAR',
        bonus_structure TEXT,
        equity_offered BOOLEAN DEFAULT FALSE,
        equity_details TEXT,
        
        -- Job details
        contract_type contract_type,
        urgency_level urgency_level DEFAULT 'MEDIUM',
        status job_status DEFAULT 'DRAFT',
        positions_available INTEGER DEFAULT 1,
        
        -- Pipeline configuration
        pipeline_stages TEXT[] DEFAULT ARRAY['Applied', 'Screening', 'Interview', 'Offer', 'Hired'],
        stage_configs JSONB,
        application_count INTEGER DEFAULT 0,
        hired_count INTEGER DEFAULT 0,
        
        -- Requirements
        experience_min INTEGER,
        experience_max INTEGER,
        required_languages TEXT[],
        required_certifications TEXT[],
        security_clearance TEXT,
        travel_percentage INTEGER,
        
        -- Closing info
        close_outcome job_close_outcome,
        close_reason TEXT,
        closed_at TIMESTAMP,
        
        -- Publishing
        published_at TIMESTAMP,
        expires_at TIMESTAMP,
        is_featured BOOLEAN DEFAULT FALSE,
        views_count INTEGER DEFAULT 0,
        apply_url TEXT,
        
        -- Internal notes
        internal_notes TEXT,
        hiring_manager TEXT,
        interview_process TEXT,
        
        -- System fields
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        
        -- Search and AI
        embedding vector(1536),
        search_text TEXT GENERATED ALWAYS AS (
          LOWER(COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || 
          COALESCE(company, '') || ' ' || COALESCE(location, ''))
        ) STORED
      )
    `);
    console.log('✅ Created jobs table');
    
    // 8. Applications table (comprehensive)
    await client.query(`
      CREATE TABLE applications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        
        -- Application details
        stage TEXT DEFAULT 'Applied',
        status application_status DEFAULT 'APPLIED',
        source TEXT,
        source_details JSONB,
        
        -- Scoring and evaluation
        score INTEGER CHECK (score >= 0 AND score <= 100),
        ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
        recruiter_score INTEGER CHECK (recruiter_score >= 0 AND recruiter_score <= 100),
        
        -- Notes and feedback
        notes TEXT,
        rejection_reason TEXT,
        withdrawal_reason TEXT,
        
        -- Offer details
        offer_extended BOOLEAN DEFAULT FALSE,
        offer_date DATE,
        offer_amount DECIMAL(12,2),
        offer_accepted BOOLEAN,
        start_date DATE,
        
        -- Tracking
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        
        UNIQUE(candidate_id, job_id)
      )
    `);
    console.log('✅ Created applications table');
    
    // 9. Interviews table
    await client.query(`
      CREATE TABLE interviews (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
        candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        
        -- Interview details
        type TEXT CHECK (type IN ('PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL', 'CULTURAL')),
        round INTEGER DEFAULT 1,
        scheduled_at TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        location TEXT,
        meeting_link TEXT,
        
        -- Participants
        interviewer_ids TEXT[],
        coordinator_id TEXT REFERENCES users(id),
        
        -- Status and outcome
        status TEXT DEFAULT 'SCHEDULED',
        outcome TEXT,
        feedback TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        
        -- Notes
        preparation_notes TEXT,
        internal_notes TEXT,
        
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created interviews table');
    
    // 10. Uploaded files table
    await client.query(`
      CREATE TABLE uploaded_files (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
        application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
        
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type file_type NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        
        extracted_text TEXT,
        metadata JSONB,
        
        uploaded_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created uploaded_files table');
    
    // 11. Competence files table (extended)
    await client.query(`
      CREATE TABLE competence_files (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        template_name TEXT,
        template_type template_type DEFAULT 'COMPETENCE',
        
        content JSONB,
        version INTEGER DEFAULT 1,
        is_latest BOOLEAN DEFAULT TRUE,
        
        generated_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created competence_files table');
    
    // 12. Email templates table
    await client.query(`
      CREATE TABLE email_templates (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        category TEXT,
        variables TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created email_templates table');
    
    // 13. Messages table (for email/sms tracking)
    await client.query(`
      CREATE TABLE messages (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        
        -- Recipients
        to_email TEXT,
        to_phone TEXT,
        candidate_id TEXT REFERENCES candidates(id) ON DELETE SET NULL,
        
        -- Message details
        type notification_type NOT NULL,
        subject TEXT,
        body TEXT,
        template_id TEXT REFERENCES email_templates(id),
        
        -- Status tracking
        status message_status DEFAULT 'DRAFT',
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        bounced_at TIMESTAMP,
        
        -- Metadata
        metadata JSONB,
        error_message TEXT,
        
        sent_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created messages table');
    
    // 14. Notifications table (in-app notifications)
    await client.query(`
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type notification_type DEFAULT 'IN_APP',
        status notification_status DEFAULT 'PENDING',
        
        -- Links and actions
        link TEXT,
        action_type TEXT,
        action_data JSONB,
        
        -- Related entities
        candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
        application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
        
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created notifications table');
    
    // 15. Talent pools table
    await client.query(`
      CREATE TABLE talent_pools (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        description TEXT,
        criteria JSONB,
        is_dynamic BOOLEAN DEFAULT FALSE,
        
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created talent_pools table');
    
    // 16. Talent pool candidates (junction table)
    await client.query(`
      CREATE TABLE talent_pool_candidates (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        talent_pool_id TEXT NOT NULL REFERENCES talent_pools(id) ON DELETE CASCADE,
        candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        
        added_by TEXT REFERENCES users(id),
        added_at TIMESTAMP DEFAULT NOW() NOT NULL,
        
        UNIQUE(talent_pool_id, candidate_id)
      )
    `);
    console.log('✅ Created talent_pool_candidates table');
    
    // 17. Search history table
    await client.query(`
      CREATE TABLE search_history (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        query TEXT NOT NULL,
        search_type search_type NOT NULL,
        filters JSONB,
        results_count INTEGER,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created search_history table');
    
    // 18. Saved searches table
    await client.query(`
      CREATE TABLE saved_searches (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        name TEXT NOT NULL,
        query TEXT NOT NULL,
        search_type search_type NOT NULL,
        filters JSONB,
        
        notify_on_new BOOLEAN DEFAULT FALSE,
        last_notified TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created saved_searches table');
    
    // 19. Project activities table (comprehensive audit log)
    await client.query(`
      CREATE TABLE project_activities (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        
        type activity_type NOT NULL,
        description TEXT,
        metadata JSONB,
        
        -- Related entities
        candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
        
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created project_activities table');
    
    // 20. Client comments table
    await client.query(`
      CREATE TABLE client_comments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        
        content TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        
        -- Related entities
        candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
        
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created client_comments table');
    
    // 21. AI matches table
    await client.query(`
      CREATE TABLE ai_matches (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        
        candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        
        match_score DECIMAL(5,2) CHECK (match_score >= 0 AND match_score <= 100),
        
        -- Detailed analysis
        strengths TEXT[],
        weaknesses TEXT[],
        missing_skills TEXT[],
        overall_assessment TEXT,
        recommendations TEXT,
        
        -- Scoring breakdown
        skill_match_score INTEGER,
        experience_match_score INTEGER,
        location_match_score INTEGER,
        salary_match_score INTEGER,
        culture_match_score INTEGER,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(candidate_id, job_id)
      )
    `);
    console.log('✅ Created ai_matches table');
    
    // 22. AI assessments table (for storing AI evaluations)
    await client.query(`
      CREATE TABLE ai_assessments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        
        candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
        application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
        
        assessment_type TEXT NOT NULL,
        prompt TEXT,
        response TEXT,
        
        scores JSONB,
        insights JSONB,
        
        model_used TEXT,
        tokens_used INTEGER,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created ai_assessments table');
    
    // 23. Audit logs table
    await client.query(`
      CREATE TABLE audit_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        
        old_values JSONB,
        new_values JSONB,
        
        ip_address INET,
        user_agent TEXT,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created audit_logs table');
    
    // Create indexes
    console.log('\n6️⃣ Creating indexes...');
    
    // Candidate indexes
    await client.query('CREATE INDEX idx_candidates_email ON candidates(email)');
    await client.query('CREATE INDEX idx_candidates_status ON candidates(conversion_status)');
    await client.query('CREATE INDEX idx_candidates_created ON candidates(created_at DESC)');
    await client.query('CREATE INDEX idx_candidates_search ON candidates USING gin(search_text gin_trgm_ops)');
    await client.query('CREATE INDEX idx_candidates_skills ON candidates USING gin(technical_skills)');
    await client.query('CREATE INDEX idx_candidates_location ON candidates(current_location)');
    await client.query('CREATE INDEX idx_candidates_embedding ON candidates USING hnsw (embedding vector_cosine_ops)');
    
    // Job indexes
    await client.query('CREATE INDEX idx_jobs_status ON jobs(status)');
    await client.query('CREATE INDEX idx_jobs_client ON jobs(client_id)');
    await client.query('CREATE INDEX idx_jobs_created ON jobs(created_at DESC)');
    await client.query('CREATE INDEX idx_jobs_search ON jobs USING gin(search_text gin_trgm_ops)');
    await client.query('CREATE INDEX idx_jobs_location ON jobs(location)');
    await client.query('CREATE INDEX idx_jobs_embedding ON jobs USING hnsw (embedding vector_cosine_ops)');
    
    // Application indexes
    await client.query('CREATE INDEX idx_applications_candidate ON applications(candidate_id)');
    await client.query('CREATE INDEX idx_applications_job ON applications(job_id)');
    await client.query('CREATE INDEX idx_applications_status ON applications(status)');
    await client.query('CREATE INDEX idx_applications_stage ON applications(stage)');
    
    // Activity indexes
    await client.query('CREATE INDEX idx_activities_candidate ON project_activities(candidate_id)');
    await client.query('CREATE INDEX idx_activities_job ON project_activities(job_id)');
    await client.query('CREATE INDEX idx_activities_created ON project_activities(created_at DESC)');
    
    // Other important indexes
    await client.query('CREATE INDEX idx_interviews_scheduled ON interviews(scheduled_at)');
    await client.query('CREATE INDEX idx_notifications_user ON notifications(user_id, status)');
    await client.query('CREATE INDEX idx_messages_status ON messages(status)');
    await client.query('CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC)');
    
    console.log('✅ Created all indexes');
    
    // Create triggers for updated_at
    console.log('\n7️⃣ Creating triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    const tablesWithUpdatedAt = [
      'users', 'clients', 'projects', 'candidates', 'jobs', 
      'applications', 'interviews', 'competence_files', 'email_templates',
      'talent_pools', 'saved_searches', 'client_comments', 'settings'
    ];
    
    for (const table of tablesWithUpdatedAt) {
      await client.query(`
        CREATE TRIGGER update_${table}_updated_at 
        BEFORE UPDATE ON ${table} 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }
    console.log('✅ Created update triggers');
    
    // Insert default settings
    console.log('\n8️⃣ Inserting default data...');
    await client.query(`
      INSERT INTO settings (key, value, description) VALUES
      ('app_name', '"Emineon ATS"', 'Application name'),
      ('default_pipeline_stages', '["Applied", "Screening", "Interview", "Offer", "Hired"]', 'Default pipeline stages for new jobs'),
      ('email_from', '"noreply@emineon.com"', 'Default from email address'),
      ('max_file_size', '10485760', 'Maximum file upload size in bytes'),
      ('supported_file_types', '["pdf", "doc", "docx", "txt", "rtf"]', 'Supported file types for uploads')
    `);
    console.log('✅ Inserted default settings');
    
    console.log('\n✅ COMPLETE Emineon ATS database setup finished successfully!');
    console.log('\n📊 Created:');
    console.log('   - 23 tables');
    console.log('   - 19 enum types');
    console.log('   - 40+ indexes');
    console.log('   - Update triggers');
    console.log('   - Default settings');
    
  } catch (err) {
    console.error('❌ Setup failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

setupFullApplicationDatabase().catch(console.error);
