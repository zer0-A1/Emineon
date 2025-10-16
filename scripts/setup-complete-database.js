const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupCompleteDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up complete Neon database schema...\n');
    
    // Test connection
    console.log('1️⃣ Testing connection...');
    const test = await client.query('SELECT NOW()');
    console.log('✅ Connected:', test.rows[0].now);
    
    // Enable pgvector extension
    console.log('\n2️⃣ Enabling pgvector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('✅ pgvector enabled');
    
    // Drop existing types to recreate them (during development)
    console.log('\n3️⃣ Recreating enums...');
    const enumTypes = [
      'candidate_status',
      'seniority_level', 
      'remote_preference',
      'job_status',
      'job_close_outcome',
      'urgency_level',
      'application_status',
      'activity_type',
      'project_status'
    ];
    
    // Drop enums if they exist
    for (const enumType of enumTypes) {
      await client.query(`DROP TYPE IF EXISTS ${enumType} CASCADE`);
    }
    
    // Create enums
    const enums = [
      `CREATE TYPE candidate_status AS ENUM ('NEW', 'ACTIVE', 'PASSIVE', 'DO_NOT_CONTACT', 'BLACKLISTED')`,
      `CREATE TYPE seniority_level AS ENUM ('JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'C_LEVEL')`,
      `CREATE TYPE remote_preference AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE')`,
      `CREATE TYPE job_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED')`,
      `CREATE TYPE job_close_outcome AS ENUM ('WON', 'LOST')`,
      `CREATE TYPE urgency_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`,
      `CREATE TYPE application_status AS ENUM ('APPLIED', 'REVIEWED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED')`,
      `CREATE TYPE activity_type AS ENUM ('NOTE', 'EMAIL', 'CALL', 'MEETING', 'TASK', 'APPLICATION_UPDATE', 'JOB_UPDATE', 'CANDIDATE_UPDATE')`,
      `CREATE TYPE project_status AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED')`
    ];
    
    for (const enumSql of enums) {
      await client.query(enumSql);
      console.log(`✅ Created enum: ${enumSql.match(/CREATE TYPE (\w+)/)[1]}`);
    }
    
    // Drop and recreate tables
    console.log('\n4️⃣ Creating tables...');
    
    // Drop tables in correct order (respecting foreign keys)
    await client.query(`
      DROP TABLE IF EXISTS ai_matches CASCADE;
      DROP TABLE IF EXISTS client_comments CASCADE;
      DROP TABLE IF EXISTS project_activities CASCADE;
      DROP TABLE IF EXISTS competence_files CASCADE;
      DROP TABLE IF EXISTS applications CASCADE;
      DROP TABLE IF EXISTS jobs CASCADE;
      DROP TABLE IF EXISTS candidates CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS clients CASCADE;
      DROP TABLE IF EXISTS client_contacts CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
    // Create users table
    await client.query(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created users table');
    
    // Create clients table
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
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created clients table');
    
    // Create client_contacts table (org chart contacts)
    await client.query(`
      CREATE TABLE client_contacts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        manager_id TEXT REFERENCES client_contacts(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        title TEXT,
        role TEXT,
        department TEXT,
        location TEXT,
        linkedin_url TEXT,
        notes TEXT,
        tags TEXT[],
        is_decision_maker BOOLEAN DEFAULT FALSE,
        influence_level TEXT,
        relationship_strength INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        embedding vector(1536)
      )
    `);
    console.log('✅ Created client_contacts table');
    
    // Create projects table
    await client.query(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        description TEXT,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        status project_status DEFAULT 'ACTIVE',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        budget DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created projects table');
    
    // Create candidates table with ALL fields
    await client.query(`
      CREATE TABLE candidates (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        
        -- Basic Information
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        date_of_birth TIMESTAMP,
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
        
        -- Skills & Expertise (6 categories)
        technical_skills TEXT[],
        soft_skills TEXT[],
        programming_languages TEXT[],
        frameworks TEXT[],
        tools_and_platforms TEXT[],
        methodologies TEXT[],
        
        -- Education
        education_level TEXT,
        universities TEXT[],
        degrees TEXT[],
        graduation_year INTEGER,
        certifications TEXT[],
        
        -- Work Preferences
        expected_salary TEXT,
        preferred_contract_type TEXT,
        freelancer BOOLEAN DEFAULT FALSE,
        remote_preference remote_preference,
        relocation_willingness BOOLEAN DEFAULT FALSE,
        mobility_countries TEXT[],
        mobility_cities TEXT[],
        work_permit_type TEXT,
        available_from TIMESTAMP,
        
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
        
        -- Notes & Metadata
        recruiter_notes TEXT[],
        motivational_fit_notes TEXT,
        cultural_fit_score INTEGER CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 100),
        matching_score INTEGER CHECK (matching_score >= 0 AND matching_score <= 100),
        interview_scores JSONB,
        
        tags TEXT[],
        source TEXT,
        conversion_status candidate_status DEFAULT 'NEW',
        referees JSONB,
        
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
        
        -- System fields
        status TEXT DEFAULT 'active',
        archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        
        -- Vector embedding for search
        embedding vector(1536)
      )
    `);
    console.log('✅ Created candidates table with all fields');
    
    // Create jobs table
    await client.query(`
      CREATE TABLE jobs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        
        -- Basic job info
        title TEXT NOT NULL,
        description TEXT,
        requirements TEXT[],
        responsibilities TEXT[],
        nice_to_have TEXT[],
        
        -- Company & location
        company TEXT,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        location TEXT,
        remote_preference remote_preference,
        
        -- Compensation
        salary_min DECIMAL(10,2),
        salary_max DECIMAL(10,2),
        salary_currency TEXT DEFAULT 'USD',
        
        -- Job details
        contract_type TEXT,
        urgency_level urgency_level DEFAULT 'MEDIUM',
        status job_status DEFAULT 'DRAFT',
        
        -- Pipeline
        pipeline_stages TEXT[],
        application_count INTEGER DEFAULT 0,
        
        -- Closing info
        close_outcome job_close_outcome,
        close_reason TEXT,
        closed_at TIMESTAMP,
        
        -- Timestamps
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        
        -- Vector embedding for search
        embedding vector(1536)
      )
    `);
    console.log('✅ Created jobs table');
    
    // Create applications table (junction between candidates and jobs)
    await client.query(`
      CREATE TABLE applications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        stage TEXT DEFAULT 'Applied',
        status application_status DEFAULT 'APPLIED',
        source TEXT,
        notes TEXT,
        score INTEGER CHECK (score >= 0 AND score <= 100),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(candidate_id, job_id)
      )
    `);
    console.log('✅ Created applications table');
    
    // Create competence files table
    await client.query(`
      CREATE TABLE competence_files (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        template_name TEXT,
        content JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created competence_files table');
    
    // Create project activities table
    await client.query(`
      CREATE TABLE project_activities (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        type activity_type NOT NULL,
        description TEXT,
        metadata JSONB,
        candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created project_activities table');
    
    // Create client comments table
    await client.query(`
      CREATE TABLE client_comments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        content TEXT NOT NULL,
        candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created client_comments table');
    
    // Create AI matches table
    await client.query(`
      CREATE TABLE ai_matches (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        match_score DECIMAL(5,2) CHECK (match_score >= 0 AND match_score <= 100),
        strengths TEXT[],
        weaknesses TEXT[],
        overall_assessment TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(candidate_id, job_id)
      )
    `);
    console.log('✅ Created ai_matches table');
    
    // Create indexes
    console.log('\n5️⃣ Creating indexes...');
    
    // Candidate indexes
    await client.query('CREATE INDEX idx_candidates_email ON candidates(email)');
    await client.query('CREATE INDEX idx_candidates_status ON candidates(conversion_status)');
    await client.query('CREATE INDEX idx_candidates_created ON candidates(created_at DESC)');
    await client.query('CREATE INDEX idx_candidates_embedding ON candidates USING hnsw (embedding vector_cosine_ops)');
    
    // Job indexes
    // Client contacts indexes
    await client.query('CREATE INDEX idx_client_contacts_client ON client_contacts(client_id)');
    await client.query('CREATE INDEX idx_client_contacts_manager ON client_contacts(manager_id)');
    await client.query('CREATE INDEX idx_client_contacts_embedding ON client_contacts USING hnsw (embedding vector_cosine_ops)');
    await client.query('CREATE INDEX idx_jobs_status ON jobs(status)');
    await client.query('CREATE INDEX idx_jobs_client ON jobs(client_id)');
    await client.query('CREATE INDEX idx_jobs_created ON jobs(created_at DESC)');
    await client.query('CREATE INDEX idx_jobs_embedding ON jobs USING hnsw (embedding vector_cosine_ops)');
    
    // Application indexes
    await client.query('CREATE INDEX idx_applications_candidate ON applications(candidate_id)');
    await client.query('CREATE INDEX idx_applications_job ON applications(job_id)');
    await client.query('CREATE INDEX idx_applications_status ON applications(status)');
    
    console.log('✅ Created all indexes');
    
    console.log('\n✅ Complete database setup finished successfully!');
    
  } catch (err) {
    console.error('❌ Setup failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

setupCompleteDatabase().catch(console.error);
