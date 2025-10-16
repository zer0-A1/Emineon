import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { pool, query, testConnection } from '../src/lib/db/neon-client';

async function setupNeonDatabase() {
  console.log('🚀 Setting up Neon database...\n');
  
  try {
    // Test connection
    console.log('1️⃣ Testing connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Neon database');
    }
    
    // Enable pgvector
    console.log('\n2️⃣ Enabling pgvector extension...');
    await query('CREATE EXTENSION IF NOT EXISTS vector');
    
    // Create enums
    console.log('\n3️⃣ Creating enums...');
    const enumQueries = [
      `CREATE TYPE candidate_status AS ENUM ('NEW', 'ACTIVE', 'PASSIVE', 'DO_NOT_CONTACT', 'BLACKLISTED')`,
      `CREATE TYPE seniority_level AS ENUM ('INTERN', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL')`,
      `CREATE TYPE remote_preference AS ENUM ('ONSITE', 'HYBRID', 'REMOTE')`,
      `CREATE TYPE job_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED')`,
      `CREATE TYPE job_close_outcome AS ENUM ('WON', 'LOST')`,
      `CREATE TYPE urgency_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`,
      `CREATE TYPE application_status AS ENUM ('ACTIVE', 'REJECTED', 'WITHDRAWN', 'HIRED')`,
      `CREATE TYPE activity_type AS ENUM ('STATUS_CHANGE', 'STAGE_CHANGE', 'NOTE_ADDED', 'FILE_UPLOADED', 'CANDIDATE_ADDED', 'CANDIDATE_REMOVED', 'JOB_CREATED', 'JOB_UPDATED', 'OTHER')`,
      `CREATE TYPE project_status AS ENUM ('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')`,
    ];
    
    for (const query of enumQueries) {
      try {
        await pool.query(query);
        console.log(`   ✅ Created enum: ${query.match(/CREATE TYPE (\w+)/)?.[1]}`);
      } catch (error: any) {
        if (error.code === '42710') { // Type already exists
          console.log(`   ⏭️  Enum already exists: ${query.match(/CREATE TYPE (\w+)/)?.[1]}`);
        } else {
          throw error;
        }
      }
    }
    
    // Create tables
    console.log('\n4️⃣ Creating tables...');
    
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('   ✅ Created users table');
    
    // Clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        website TEXT,
        industry TEXT,
        size TEXT,
        description TEXT,
        logo_url TEXT,
        primary_color TEXT,
        primary_contact_name TEXT,
        primary_contact_email TEXT,
        primary_contact_phone TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('   ✅ Created clients table');
    
    // Projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        client_id UUID REFERENCES clients(id),
        status project_status DEFAULT 'PLANNING',
        start_date DATE,
        end_date DATE,
        budget REAL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('   ✅ Created projects table');
    
    // Candidates table with ALL fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Basic Information
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        
        -- Professional Profile
        current_title TEXT,
        professional_headline TEXT,
        current_location TEXT,
        summary TEXT,
        experience_years INTEGER,
        seniority_level seniority_level,
        
        -- Skills & Expertise (as JSONB arrays)
        technical_skills JSONB,
        soft_skills JSONB,
        programming_languages JSONB,
        frameworks JSONB,
        tools_and_platforms JSONB,
        methodologies JSONB,
        
        -- Education
        education_level TEXT,
        universities JSONB,
        degrees JSONB,
        graduation_year INTEGER,
        certifications JSONB,
        
        -- Work Preferences
        expected_salary TEXT,
        preferred_contract_type TEXT,
        freelancer BOOLEAN DEFAULT false,
        remote_preference remote_preference,
        relocation_willingness BOOLEAN DEFAULT false,
        mobility_countries JSONB,
        mobility_cities JSONB,
        work_permit_type TEXT,
        available_from DATE,
        
        -- Industry & Experience
        primary_industry TEXT,
        functional_domain TEXT,
        companies JSONB,
        notable_projects JSONB,
        
        -- Personal Details
        nationality TEXT,
        spoken_languages JSONB,
        timezone TEXT,
        address TEXT,
        date_of_birth DATE,
        
        -- Online Presence
        linkedin_url TEXT,
        github_url TEXT,
        portfolio_url TEXT,
        video_interview_url TEXT,
        
        -- Notes & Metadata
        recruiter_notes JSONB,
        motivational_fit_notes TEXT,
        cultural_fit_score REAL,
        matching_score REAL,
        interview_scores JSONB,
        tags JSONB,
        source TEXT,
        conversion_status TEXT,
        referees JSONB,
        
        -- Documents
        original_cv_url TEXT,
        original_cv_file_name TEXT,
        competence_file_url TEXT,
        
        -- Video
        video_title TEXT,
        video_description TEXT,
        
        -- Client Sharing
        profile_token TEXT,
        client_visible BOOLEAN DEFAULT false,
        share_with_client BOOLEAN DEFAULT false,
        client_rating REAL,
        collaboration_notes TEXT,
        
        -- Status
        status candidate_status DEFAULT 'NEW',
        archived BOOLEAN DEFAULT false,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
        
        -- Vector embedding
        embedding vector(1536)
      )
    `);
    console.log('   ✅ Created candidates table');
    
    // Jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        company TEXT,
        location TEXT,
        description TEXT,
        requirements JSONB,
        responsibilities JSONB,
        
        -- Job Details
        job_type TEXT,
        experience_level TEXT,
        salary_min REAL,
        salary_max REAL,
        salary_currency TEXT DEFAULT 'EUR',
        benefits JSONB,
        
        -- Skills
        required_skills JSONB,
        preferred_skills JSONB,
        
        -- Pipeline
        pipeline_stages JSONB DEFAULT '["Applied", "Screening", "Interview", "Offer", "Hired"]'::jsonb,
        
        -- Metadata
        department TEXT,
        reporting_to TEXT,
        team_size INTEGER,
        
        -- Project/Client
        project_id UUID REFERENCES projects(id),
        client_id UUID REFERENCES clients(id),
        
        -- Status
        status job_status DEFAULT 'DRAFT',
        urgency urgency_level DEFAULT 'MEDIUM',
        published_at TIMESTAMP,
        closed_at TIMESTAMP,
        close_outcome job_close_outcome,
        close_reason TEXT,
        
        -- Created by
        created_by UUID REFERENCES users(id),
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        
        -- Full-text search
        search_vector TEXT
      )
    `);
    console.log('   ✅ Created jobs table');
    
    // Applications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID REFERENCES jobs(id) NOT NULL,
        candidate_id UUID REFERENCES candidates(id) NOT NULL,
        
        -- Pipeline
        stage TEXT NOT NULL DEFAULT 'Applied',
        status application_status DEFAULT 'ACTIVE',
        
        -- Scores & Notes
        score REAL,
        notes TEXT,
        internal_notes TEXT,
        
        -- Timestamps
        applied_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_activity_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        
        UNIQUE(job_id, candidate_id)
      )
    `);
    console.log('   ✅ Created applications table');
    
    // Project Activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id),
        job_id UUID REFERENCES jobs(id),
        candidate_id UUID REFERENCES candidates(id),
        user_id UUID REFERENCES users(id),
        
        type activity_type NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('   ✅ Created project_activities table');
    
    // Competence Files table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS competence_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID REFERENCES candidates(id) NOT NULL,
        
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        template_name TEXT,
        content TEXT,
        metadata JSONB,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('   ✅ Created competence_files table');
    
    // AI Matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID REFERENCES candidates(id) NOT NULL,
        job_id UUID REFERENCES jobs(id) NOT NULL,
        
        score REAL NOT NULL,
        reasoning TEXT,
        skills_match JSONB,
        experience_match JSONB,
        cultural_fit_match JSONB,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        
        UNIQUE(candidate_id, job_id)
      )
    `);
    console.log('   ✅ Created ai_matches table');
    
    // Client Comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID REFERENCES candidates(id) NOT NULL,
        client_id UUID REFERENCES clients(id) NOT NULL,
        user_id UUID REFERENCES users(id),
        
        comment TEXT NOT NULL,
        rating INTEGER,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('   ✅ Created client_comments table');
    
    // Create indexes
    console.log('\n5️⃣ Creating indexes...');
    
    const indexes = [
      `CREATE INDEX IF NOT EXISTS candidates_embedding_idx ON candidates USING hnsw (embedding vector_cosine_ops)`,
      `CREATE INDEX IF NOT EXISTS candidates_status_idx ON candidates(status)`,
      `CREATE INDEX IF NOT EXISTS candidates_archived_idx ON candidates(archived)`,
      `CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status)`,
      `CREATE INDEX IF NOT EXISTS jobs_project_idx ON jobs(project_id)`,
      `CREATE INDEX IF NOT EXISTS jobs_client_idx ON jobs(client_id)`,
      `CREATE INDEX IF NOT EXISTS applications_job_idx ON applications(job_id)`,
      `CREATE INDEX IF NOT EXISTS applications_candidate_idx ON applications(candidate_id)`,
      `CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status)`,
      `CREATE INDEX IF NOT EXISTS activities_project_idx ON project_activities(project_id)`,
      `CREATE INDEX IF NOT EXISTS activities_job_idx ON project_activities(job_id)`,
      `CREATE INDEX IF NOT EXISTS activities_candidate_idx ON project_activities(candidate_id)`,
      `CREATE INDEX IF NOT EXISTS competence_files_candidate_idx ON competence_files(candidate_id)`,
      `CREATE INDEX IF NOT EXISTS ai_matches_score_idx ON ai_matches(score)`,
      `CREATE INDEX IF NOT EXISTS client_comments_candidate_idx ON client_comments(candidate_id)`,
      `CREATE INDEX IF NOT EXISTS client_comments_client_idx ON client_comments(client_id)`,
    ];
    
    for (const index of indexes) {
      await pool.query(index);
      console.log(`   ✅ Created index: ${index.match(/CREATE INDEX IF NOT EXISTS (\w+)/)?.[1]}`);
    }
    
    console.log('\n✅ Neon database setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupNeonDatabase().catch(console.error);
