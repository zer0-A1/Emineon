import { Pool } from 'pg';

// Create connection pool for tests
const useSsl = (() => {
  const url = process.env.DATABASE_URL || '';
  return /neon\.tech/.test(url) || /sslmode=require/.test(url) || /\bssl=true\b/i.test(url);
})();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false as any,
  max: 5,
});

export interface TestUserData {
  user: any;
  client: any;
  project: any;
}

export async function createTestUser(): Promise<TestUserData> {
  // Create test user with deterministic data
  const testUserId = 'test-user-playwright';
  const testEmail = 'playwright@test.emineon.com';
  
  // Clean up existing test data
  await cleanupTestData(testUserId);
  
  // Create test user
  const userResult = await pool.query(
    `INSERT INTO users (id, email, name, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role, updated_at = NOW()
     RETURNING *`,
    [testUserId, testEmail, 'Playwright Test User', 'ADMIN']
  );
  const user = userResult.rows[0];

  // Create test client
  const clientResult = await pool.query(
    `INSERT INTO clients (name, industry, contact_person, email, phone, address, logo_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    ['Playwright Test Client', 'Software', 'Test Contact', 'contact@playwright-test-client.com', 
     '+1-555-TEST-001', 'Test Valley, Test State', 'https://via.placeholder.com/150']
  );
  const client = clientResult.rows[0];

  // Create test project
  const projectResult = await pool.query(
    `INSERT INTO projects (name, client_id, status, start_date, description, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    ['Playwright Test Project', client.id, 'ACTIVE', new Date(), 'Project for E2E testing']
  );
  const project = projectResult.rows[0];

  return { user, client, project };
}

export async function cleanupTestData(userId: string = 'test-user-playwright') {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Find test client
    const testClientResult = await client.query(
      'SELECT id FROM clients WHERE name = $1',
      ['Playwright Test Client']
    );

    if (testClientResult.rows.length > 0) {
      const testClientId = testClientResult.rows[0].id;

      // Delete in reverse order of dependencies
      // Delete applications for jobs in our test client's projects
      await client.query(
        `DELETE FROM applications 
         WHERE job_id IN (
           SELECT id FROM jobs 
           WHERE project_id IN (
             SELECT id FROM projects WHERE client_id = $1
           )
         )`,
        [testClientId]
      );

      // Delete jobs in our test client's projects
      await client.query(
        'DELETE FROM jobs WHERE project_id IN (SELECT id FROM projects WHERE client_id = $1)',
        [testClientId]
      );

      // Delete project activities
      await client.query(
        'DELETE FROM project_activities WHERE project_id IN (SELECT id FROM projects WHERE client_id = $1)',
        [testClientId]
      );

      // Delete projects for our test client
      await client.query('DELETE FROM projects WHERE client_id = $1', [testClientId]);
    }

    // Delete test client
    await client.query('DELETE FROM clients WHERE name = $1', ['Playwright Test Client']);

    // Delete test candidates
    await client.query('DELETE FROM candidates WHERE email LIKE $1', ['%test.candidate%']);

    // Delete the test user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.log('Cleanup error (may be expected):', error);
  } finally {
    client.release();
  }
}

export async function seedTestCandidates(userId: string, count: number = 5) {
  const candidates = [];
  
  for (let i = 0; i < count; i++) {
    // ensure unique emails across browsers/projects
    const unique = `${Date.now()}_${Math.floor(Math.random()*1e6)}_${i}`;
    const result = await pool.query(
      `INSERT INTO candidates (
        first_name, last_name, email, phone, current_location, 
        current_title, experience_years, conversion_status, technical_skills, 
        spoken_languages, expected_salary, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        `Test${i + 1}`,
        `Candidate${i + 1}`,
        `test.candidate${i + 1}.${unique}@example.com`,
        `+1555000${i + 1}000`,
        `Test City ${i + 1}`,
        `Senior Developer ${i + 1}`,
        5 + i,
        i % 2 === 0 ? 'ACTIVE' : 'PASSIVE',
        ['JavaScript', 'TypeScript', 'React', 'Node.js'],
        ['English', 'French'],
        `${100000 + (i * 10000)} USD`
      ]
    );
    candidates.push(result.rows[0]);
  }
  
  return candidates;
}

export async function seedTestJobs(projectId: string, count: number = 3) {
  const jobs = [];
  const jobTypes = ['Full Stack Developer', 'Data Engineer', 'DevOps Engineer'];
  
  for (let i = 0; i < count; i++) {
    const result = await pool.query(
      `INSERT INTO jobs (
        title, project_id, description, requirements, location, 
        salary_min, salary_max, contract_type, status, urgency_level,
        pipeline_stages, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        jobTypes[i % jobTypes.length],
        projectId,
        `Looking for an experienced ${jobTypes[i % jobTypes.length]} to join our team.`,
        ['5+ years experience', 'Strong communication skills', 'Team player'],
        `Test Location ${i + 1}`,
        120000 + i * 20000,
        150000 + i * 20000,
        'FULL_TIME',
        'ACTIVE',
        i === 0 ? 'HIGH' : 'MEDIUM',
        ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']
      ]
    );
    jobs.push(result.rows[0]);
  }
  
  return jobs;
}

// Close pool when tests are done
export async function closePool() {
  await pool.end();
}
