const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up Neon database...\n');
    
    // Test connection
    console.log('1️⃣ Testing connection...');
    const test = await client.query('SELECT NOW()');
    console.log('✅ Connected:', test.rows[0].now);
    
    // Enable pgvector
    console.log('\n2️⃣ Enabling pgvector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('✅ pgvector enabled');
    
    // Create enums
    console.log('\n3️⃣ Creating enums...');
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
      try {
        await client.query(enumSql);
        console.log(`✅ Created enum: ${enumSql.match(/CREATE TYPE (\w+)/)[1]}`);
      } catch (err) {
        if (err.code === '42710') { // Type already exists
          console.log(`⏭️  Enum already exists: ${enumSql.match(/CREATE TYPE (\w+)/)[1]}`);
        } else {
          throw err;
        }
      }
    }
    
    // Create candidates table
    console.log('\n4️⃣ Creating candidates table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        date_of_birth TIMESTAMP,
        nationality TEXT,
        spoken_languages TEXT[],
        timezone TEXT,
        
        current_title TEXT,
        professional_headline TEXT,
        current_location TEXT,
        summary TEXT,
        experience_years INTEGER,
        seniority_level seniority_level,
        
        technical_skills TEXT[],
        soft_skills TEXT[],
        programming_languages TEXT[],
        frameworks TEXT[],
        tools_and_platforms TEXT[],
        methodologies TEXT[],
        
        education_level TEXT,
        universities TEXT[],
        degrees TEXT[],
        graduation_year INTEGER,
        certifications TEXT[],
        
        expected_salary TEXT,
        preferred_contract_type TEXT,
        freelancer BOOLEAN DEFAULT FALSE,
        remote_preference remote_preference,
        relocation_willingness BOOLEAN DEFAULT FALSE,
        mobility_countries TEXT[],
        mobility_cities TEXT[],
        work_permit_type TEXT,
        available_from TIMESTAMP,
        
        primary_industry TEXT,
        functional_domain TEXT,
        companies JSONB,
        notable_projects TEXT[],
        
        linkedin_url TEXT,
        github_url TEXT,
        portfolio_url TEXT,
        video_interview_url TEXT,
        
        recruiter_notes TEXT[],
        motivational_fit_notes TEXT,
        cultural_fit_score INTEGER,
        matching_score INTEGER,
        interview_scores JSONB,
        
        tags TEXT[],
        source TEXT,
        conversion_status candidate_status DEFAULT 'NEW',
        referees JSONB,
        
        original_cv_url TEXT,
        original_cv_file_name TEXT,
        original_cv_uploaded_at TIMESTAMP,
        competence_file_url TEXT,
        competence_file_uploaded_at TIMESTAMP,
        
        video_title TEXT,
        video_description TEXT,
        video_url TEXT,
        video_thumbnail_url TEXT,
        video_duration INTEGER,
        video_uploaded_at TIMESTAMP,
        
        status TEXT DEFAULT 'active',
        archived BOOLEAN DEFAULT FALSE,
        
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        
        embedding vector(1536)
      )
    `);
    console.log('✅ Created candidates table');
    
    // Create indexes
    console.log('\n5️⃣ Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_candidates_embedding ON candidates USING hnsw (embedding vector_cosine_ops)');
    console.log('✅ Created indexes');
    
    console.log('\n✅ Database setup complete!');
    
  } catch (err) {
    console.error('❌ Setup failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase().catch(console.error);
