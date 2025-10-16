import { pool } from '../src/lib/db/neon-client';
import {
  generateEmbedding,
  toVectorLiteral,
  generateCandidateSearchText,
  generateJobSearchText,
  generateClientSearchText,
  generateProjectSearchText,
} from '../src/lib/embeddings/unified-embeddings';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function seedTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting test data seed with embeddings...');
    
    await client.query('BEGIN');
    
    // 1. Create test users
    console.log('Creating test users...');
    const userResult = await client.query(
      `INSERT INTO users (email, name, role, created_at, updated_at)
       VALUES 
       ('admin@test.com', 'Admin User', 'ADMIN', NOW(), NOW()),
       ('recruiter@test.com', 'Recruiter User', 'RECRUITER', NOW(), NOW()),
       ('viewer@test.com', 'Viewer User', 'VIEWER', NOW(), NOW())
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`
    );
    console.log(`Created ${userResult.rowCount} test users`);
    
    // 2. Create test clients with embeddings
    console.log('Creating test clients...');
    const clientsData = [
      {
        name: 'TechCorp Solutions',
        industry: 'Software Development',
        contact_person: 'John Tech',
        email: 'contact@techcorp.com',
        phone: '+1-555-0101',
        address: '123 Tech Street, Silicon Valley',
        company_size: '100-500',
        notes: 'Leading software development company specializing in AI and ML solutions',
        tags: ['AI', 'ML', 'Software', 'Enterprise'],
      },
      {
        name: 'FinanceHub Inc',
        industry: 'Financial Services',
        contact_person: 'Sarah Finance',
        email: 'hr@financehub.com',
        phone: '+1-555-0102',
        address: '456 Wall Street, New York',
        company_size: '500-1000',
        notes: 'Global financial services provider with focus on digital banking',
        tags: ['Finance', 'Banking', 'Fintech'],
      },
      {
        name: 'HealthTech Innovations',
        industry: 'Healthcare Technology',
        contact_person: 'Dr. Health',
        email: 'careers@healthtech.com',
        phone: '+1-555-0103',
        address: '789 Medical Plaza, Boston',
        company_size: '50-100',
        notes: 'Healthcare technology startup revolutionizing patient care',
        tags: ['Healthcare', 'MedTech', 'Startup'],
      },
    ];
    
    const clientIds = [];
    for (const clientData of clientsData) {
      const searchText = generateClientSearchText(clientData);
      const embedding = await generateEmbedding(searchText);
      const vectorLiteral = toVectorLiteral(embedding);
      
      const result = await client.query(
        `INSERT INTO clients 
         (name, industry, contact_person, email, phone, address, company_size, notes, tags, embedding, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector, NOW(), NOW())
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          clientData.name,
          clientData.industry,
          clientData.contact_person,
          clientData.email,
          clientData.phone,
          clientData.address,
          clientData.company_size,
          clientData.notes,
          clientData.tags,
          vectorLiteral,
        ]
      );
      clientIds.push(result.rows[0].id);
    }
    console.log(`Created ${clientIds.length} test clients with embeddings`);
    
    // 3. Create test projects with embeddings
    console.log('Creating test projects...');
    const projectsData = [
      {
        name: 'AI Platform Development',
        description: 'Build next-generation AI platform for enterprise clients',
        client_id: clientIds[0],
        client_name: 'TechCorp Solutions',
        status: 'ACTIVE',
        objectives: ['Build scalable AI infrastructure', 'Implement ML pipelines', 'Create user-friendly interface'],
        tags: ['AI', 'Development', 'Enterprise'],
      },
      {
        name: 'Digital Banking App',
        description: 'Mobile-first digital banking application',
        client_id: clientIds[1],
        client_name: 'FinanceHub Inc',
        status: 'ACTIVE',
        objectives: ['Create secure banking app', 'Implement real-time transactions', 'Build analytics dashboard'],
        tags: ['Mobile', 'Banking', 'Security'],
      },
      {
        name: 'Patient Portal System',
        description: 'Comprehensive patient management and portal system',
        client_id: clientIds[2],
        client_name: 'HealthTech Innovations',
        status: 'ON_HOLD',
        objectives: ['Patient record management', 'Appointment scheduling', 'Telemedicine integration'],
        tags: ['Healthcare', 'Portal', 'Patient Care'],
      },
    ];
    
    const projectIds = [];
    for (const projectData of projectsData) {
      const searchText = generateProjectSearchText(projectData);
      const embedding = await generateEmbedding(searchText);
      const vectorLiteral = toVectorLiteral(embedding);
      
      const result = await client.query(
        `INSERT INTO projects 
         (name, description, client_id, client_name, status, objectives, tags, embedding, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, NOW(), NOW())
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          projectData.name,
          projectData.description,
          projectData.client_id,
          projectData.client_name,
          projectData.status,
          projectData.objectives,
          projectData.tags,
          vectorLiteral,
        ]
      );
      projectIds.push(result.rows[0].id);
    }
    console.log(`Created ${projectIds.length} test projects with embeddings`);
    
    // 4. Create test jobs with embeddings
    console.log('Creating test jobs...');
    const jobsData = [
      {
        title: 'Senior AI Engineer',
        description: 'We are looking for an experienced AI Engineer to lead our ML initiatives',
        project_id: projectIds[0],
        company: 'TechCorp Solutions',
        location: 'San Francisco, CA',
        remote_preference: 'HYBRID',
        requirements: ['5+ years ML experience', 'Python expertise', 'Deep learning knowledge'],
        required_skills: ['Python', 'TensorFlow', 'PyTorch', 'MLOps'],
        salary_min: 150000,
        salary_max: 250000,
        contract_type: 'FULL_TIME',
        status: 'PUBLISHED',
        urgency_level: 'HIGH',
      },
      {
        title: 'Full Stack Developer - Fintech',
        description: 'Join our team building next-gen financial applications',
        project_id: projectIds[1],
        company: 'FinanceHub Inc',
        location: 'New York, NY',
        remote_preference: 'REMOTE',
        requirements: ['3+ years full stack experience', 'React/Node.js', 'Financial systems knowledge'],
        required_skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
        salary_min: 120000,
        salary_max: 180000,
        contract_type: 'FULL_TIME',
        status: 'PUBLISHED',
        urgency_level: 'MEDIUM',
      },
      {
        title: 'Healthcare Software Architect',
        description: 'Design and implement healthcare software solutions',
        project_id: projectIds[2],
        company: 'HealthTech Innovations',
        location: 'Boston, MA',
        remote_preference: 'ON_SITE',
        requirements: ['7+ years software architecture', 'Healthcare domain knowledge', 'HIPAA compliance'],
        required_skills: ['Java', 'Microservices', 'AWS', 'FHIR'],
        salary_min: 140000,
        salary_max: 200000,
        contract_type: 'FULL_TIME',
        status: 'PUBLISHED',
        urgency_level: 'LOW',
      },
    ];
    
    const jobIds = [];
    for (const jobData of jobsData) {
      const searchText = generateJobSearchText(jobData);
      const embedding = await generateEmbedding(searchText);
      const vectorLiteral = toVectorLiteral(embedding);
      
      const result = await client.query(
        `INSERT INTO jobs 
         (title, description, project_id, company, location, remote_preference, requirements, 
          required_skills, salary_min, salary_max, contract_type, status, urgency_level, 
          embedding, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::vector, NOW(), NOW())
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          jobData.title,
          jobData.description,
          jobData.project_id,
          jobData.company,
          jobData.location,
          jobData.remote_preference,
          jobData.requirements,
          jobData.required_skills,
          jobData.salary_min,
          jobData.salary_max,
          jobData.contract_type,
          jobData.status,
          jobData.urgency_level,
          vectorLiteral,
        ]
      );
      jobIds.push(result.rows[0].id);
    }
    console.log(`Created ${jobIds.length} test jobs with embeddings`);
    
    // 5. Create test candidates with embeddings
    console.log('Creating test candidates...');
    const candidatesData = [
      {
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice.johnson@example.com',
        phone: '+1-555-1001',
        current_location: 'San Francisco, CA',
        current_title: 'Senior ML Engineer',
        experience_years: 7,
        technical_skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'AWS'],
        programming_languages: ['Python', 'R', 'SQL', 'JavaScript'],
        summary: 'Experienced ML engineer with expertise in deep learning and computer vision',
        expected_salary: '180000-220000',
        conversion_status: 'ACTIVE',
      },
      {
        first_name: 'Bob',
        last_name: 'Smith',
        email: 'bob.smith@example.com',
        phone: '+1-555-1002',
        current_location: 'New York, NY',
        current_title: 'Full Stack Developer',
        experience_years: 5,
        technical_skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Docker'],
        programming_languages: ['JavaScript', 'TypeScript', 'Python', 'Go'],
        summary: 'Full stack developer with strong experience in fintech applications',
        expected_salary: '140000-170000',
        conversion_status: 'ACTIVE',
      },
      {
        first_name: 'Carol',
        last_name: 'Williams',
        email: 'carol.williams@example.com',
        phone: '+1-555-1003',
        current_location: 'Boston, MA',
        current_title: 'Software Architect',
        experience_years: 10,
        technical_skills: ['Java', 'Spring Boot', 'Microservices', 'Kubernetes', 'AWS'],
        programming_languages: ['Java', 'Kotlin', 'Python', 'Scala'],
        summary: 'Seasoned architect with healthcare domain expertise and HIPAA compliance knowledge',
        expected_salary: '170000-210000',
        conversion_status: 'PASSIVE',
      },
      {
        first_name: 'David',
        last_name: 'Brown',
        email: 'david.brown@example.com',
        phone: '+1-555-1004',
        current_location: 'Austin, TX',
        current_title: 'DevOps Engineer',
        experience_years: 6,
        technical_skills: ['Kubernetes', 'Terraform', 'Jenkins', 'AWS', 'GitLab CI'],
        programming_languages: ['Python', 'Go', 'Bash', 'Ruby'],
        summary: 'DevOps specialist with expertise in cloud infrastructure and CI/CD pipelines',
        expected_salary: '150000-180000',
        conversion_status: 'ACTIVE',
      },
      {
        first_name: 'Emma',
        last_name: 'Davis',
        email: 'emma.davis@example.com',
        phone: '+1-555-1005',
        current_location: 'Seattle, WA',
        current_title: 'Data Scientist',
        experience_years: 4,
        technical_skills: ['Python', 'R', 'SQL', 'Tableau', 'Spark'],
        programming_languages: ['Python', 'R', 'SQL', 'Julia'],
        summary: 'Data scientist specializing in predictive analytics and business intelligence',
        expected_salary: '130000-160000',
        conversion_status: 'ACTIVE',
      },
    ];
    
    const candidateIds = [];
    for (const candidateData of candidatesData) {
      const searchText = generateCandidateSearchText(candidateData);
      const embedding = await generateEmbedding(searchText);
      const vectorLiteral = toVectorLiteral(embedding);
      
      const result = await client.query(
        `INSERT INTO candidates 
         (first_name, last_name, email, phone, current_location, current_title, 
          experience_years, technical_skills, programming_languages, summary, 
          expected_salary, conversion_status, embedding, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::vector, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE 
         SET embedding = EXCLUDED.embedding, updated_at = NOW()
         RETURNING id`,
        [
          candidateData.first_name,
          candidateData.last_name,
          candidateData.email,
          candidateData.phone,
          candidateData.current_location,
          candidateData.current_title,
          candidateData.experience_years,
          candidateData.technical_skills,
          candidateData.programming_languages,
          candidateData.summary,
          candidateData.expected_salary,
          candidateData.conversion_status,
          vectorLiteral,
        ]
      );
      candidateIds.push(result.rows[0].id);
    }
    console.log(`Created ${candidateIds.length} test candidates with embeddings`);
    
    // 6. Create some applications
    console.log('Creating test applications...');
    const applications = [
      { candidate_id: candidateIds[0], job_id: jobIds[0], stage: 'Interview' },
      { candidate_id: candidateIds[1], job_id: jobIds[1], stage: 'Screening' },
      { candidate_id: candidateIds[2], job_id: jobIds[2], stage: 'Applied' },
      { candidate_id: candidateIds[3], job_id: jobIds[0], stage: 'Applied' },
      { candidate_id: candidateIds[4], job_id: jobIds[1], stage: 'Interview' },
    ];
    
    for (const app of applications) {
      await client.query(
        `INSERT INTO applications (candidate_id, job_id, stage, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (candidate_id, job_id) DO UPDATE 
         SET stage = EXCLUDED.stage, updated_at = NOW()`,
        [app.candidate_id, app.job_id, app.stage]
      );
    }
    console.log(`Created ${applications.length} test applications`);
    
    await client.query('COMMIT');
    console.log('✅ Test data seeded successfully with embeddings!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 Starting test data seed...');
  
  try {
    await seedTestData();
    console.log('✅ All test data seeded successfully!');
  } catch (error) {
    console.error('❌ Error in seed process:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as seedTestDataWithEmbeddings };
