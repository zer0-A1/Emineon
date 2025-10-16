#!/usr/bin/env node

/**
 * Direct E2E Test Runner
 * Runs comprehensive E2E tests directly against the API
 */

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Helper functions
async function runTest(name, fn) {
  totalTests++;
  console.log(`\n🧪 Running: ${name}`);
  try {
    await fn();
    passedTests++;
    testResults.push({ name, status: '✅ PASSED' });
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    failedTests++;
    testResults.push({ name, status: '❌ FAILED', error: error.message });
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

// Test Suite
async function runE2ETests() {
  console.log('=' .repeat(60));
  console.log('EMINEON ATS - E2E TEST EXECUTION');
  console.log('=' .repeat(60));
  console.log(`API Base URL: ${API_BASE}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // 1. Health Check
  await runTest('API Health Check', async () => {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    
    if (!response.ok) throw new Error(`Status ${response.status}`);
    if (!data.ok) throw new Error('Health check failed');
    if (!data.services.database === 'ok') throw new Error('Database not healthy');
    
    console.log(`  ✓ Database response time: ${data.dbMs}ms`);
    console.log(`  ✓ Services: ${JSON.stringify(data.services)}`);
  });

  // 2. Create Candidate
  let testCandidateId;
  await runTest('Create Candidate', async () => {
    const candidateData = {
      firstName: 'E2E',
      lastName: `Test-${Date.now()}`,
      email: `e2e-${Date.now()}@test.com`,
      phone: '+1-555-E2E-TEST',
      currentTitle: 'Senior Python Developer',
      currentLocation: 'San Francisco, CA',
      summary: 'E2E test candidate with expertise in Python, Django, and React',
      experienceYears: 10,
      technicalSkills: ['Python', 'Django', 'React', 'PostgreSQL', 'Docker'],
      expectedSalary: '$150,000 - $200,000',
    };

    const response = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Status ${response.status}: ${data.error}`);
    if (!data.success) throw new Error('Create failed');
    
    testCandidateId = data.data.databaseId || data.data.id;
    console.log(`  ✓ Created candidate ID: ${testCandidateId}`);
  });

  // 3. Vector Search
  await runTest('Vector Search for Python Developer', async () => {
    // Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(`${API_BASE}/candidates/vector-search?q=Python+Django+developer`);
    const data = await response.json();
    
    if (!response.ok) throw new Error(`Status ${response.status}: ${data.error}`);
    if (!data.success) throw new Error('Search failed');
    if (!data.searchType === 'vector') throw new Error('Not using vector search');
    
    console.log(`  ✓ Found ${data.data.length} candidates`);
    console.log(`  ✓ Search type: ${data.searchType}`);
    
    if (data.data.length > 0) {
      const topResult = data.data[0];
      console.log(`  ✓ Top result: ${topResult.name} (score: ${topResult._score || topResult.score})`);
    }
  });

  // 4. Create Job
  let testJobId;
  await runTest('Create Job', async () => {
    const jobData = {
      title: 'E2E Test - Senior React Developer',
      description: 'This is an E2E test job for a Senior React Developer with excellent benefits and remote work options.',
      location: 'Remote (US)',
      department: 'Engineering',
      jobType: 'full-time',
      contractType: 'permanent',
      salaryMin: 130000,
      salaryMax: 180000,
      requiredSkills: ['React', 'TypeScript', 'Node.js'],
      requirements: ['5+ years React experience', 'TypeScript proficiency'],
      status: 'published',
      urgency: 'medium',
    };

    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Status ${response.status}: ${data.error}`);
    if (!data.success) throw new Error('Create job failed');
    
    testJobId = data.data.id;
    console.log(`  ✓ Created job ID: ${testJobId}`);
  });

  // 5. Add Candidate to Pipeline
  await runTest('Add Candidate to Job Pipeline', async () => {
    if (!testJobId || !testCandidateId) {
      throw new Error('Missing test data');
    }

    const response = await fetch(`${API_BASE}/jobs/${testJobId}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: testCandidateId,
        stage: 'Applied',
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Status ${response.status}: ${data.error}`);
    if (!data.success) throw new Error('Add to pipeline failed');
    
    console.log(`  ✓ Added candidate to job pipeline`);
  });

  // 6. CV Upload Test
  await runTest('CV Upload and Parse', async () => {
    const cvContent = `Jane E2E Developer
Senior Full Stack Engineer
jane.e2e.${Date.now()}@example.com | +1-555-1234

SUMMARY
Experienced full-stack engineer with expertise in React, Node.js, and cloud technologies.

SKILLS
• Languages: JavaScript, TypeScript, Python
• Frontend: React, Next.js, Vue.js
• Backend: Node.js, Express, GraphQL
• Cloud: AWS, Docker, Kubernetes

EXPERIENCE
Tech Lead - TechCorp (2020-Present)
• Led team of 6 engineers
• Built scalable microservices
• Improved performance by 60%

EDUCATION
B.S. Computer Science - MIT (2015)`;

    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', Buffer.from(cvContent), {
      filename: 'e2e-test-cv.txt',
      contentType: 'text/plain',
    });

    const response = await fetch(`${API_BASE}/candidates/upload-cv`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Status ${response.status}: ${data.error}`);
    if (!data.success) throw new Error('CV upload failed');
    
    console.log(`  ✓ CV parsed successfully`);
    console.log(`  ✓ Extracted name: ${data.data.first_name} ${data.data.last_name}`);
  });

  // 7. Search Performance
  await runTest('Search Performance Test', async () => {
    const queries = [
      'Python backend developer',
      'React frontend engineer',
      'Full stack JavaScript',
      'Machine learning',
      'DevOps Kubernetes',
    ];

    const times = [];
    
    for (const query of queries) {
      const start = Date.now();
      const response = await fetch(`${API_BASE}/candidates/vector-search?q=${encodeURIComponent(query)}`);
      const duration = Date.now() - start;
      
      const data = await response.json();
      if (!response.ok) throw new Error(`Search failed for "${query}"`);
      
      times.push(duration);
      console.log(`  ✓ "${query}": ${duration}ms (${data.data?.length || 0} results)`);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`  ✓ Average search time: ${avgTime.toFixed(0)}ms`);
    
    if (avgTime > 500) {
      throw new Error(`Search too slow: ${avgTime}ms average`);
    }
  });

  // 8. Data Persistence Test
  await runTest('Data Persistence', async () => {
    // Create unique candidate
    const uniqueData = {
      firstName: 'Persistence',
      lastName: 'Test',
      email: `persist-${Date.now()}@test.com`,
      currentTitle: 'Persistence Test Engineer',
      technicalSkills: ['Unique-Skill-999'],
    };

    // Create
    const createResponse = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uniqueData),
    });

    const created = await createResponse.json();
    if (!createResponse.ok) throw new Error('Create failed');
    
    const candidateId = created.data.databaseId || created.data.id;

    // Retrieve
    const getResponse = await fetch(`${API_BASE}/candidates/${candidateId}`);
    const retrieved = await getResponse.json();
    
    if (!getResponse.ok) throw new Error('Retrieve failed');
    if (retrieved.data.email !== uniqueData.email) throw new Error('Data mismatch');
    
    console.log(`  ✓ Data persisted and retrieved correctly`);
  });

  // 9. Job Management
  await runTest('Job Management Workflow', async () => {
    // List jobs
    const listResponse = await fetch(`${API_BASE}/jobs?limit=5&status=PUBLISHED`);
    const jobs = await listResponse.json();
    
    if (!listResponse.ok) throw new Error('List jobs failed');
    console.log(`  ✓ Found ${jobs.data?.length || 0} published jobs`);

    if (testJobId) {
      // Get specific job
      const getResponse = await fetch(`${API_BASE}/jobs/${testJobId}`);
      const job = await getResponse.json();
      
      if (!getResponse.ok) throw new Error('Get job failed');
      console.log(`  ✓ Retrieved job: ${job.data.title}`);

      // Update job
      const updateResponse = await fetch(`${API_BASE}/jobs/${testJobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urgency: 'high' }),
      });

      const updated = await updateResponse.json();
      if (!updateResponse.ok) throw new Error('Update job failed');
      console.log(`  ✓ Updated job urgency`);
    }
  });

  // 10. UI Access Test
  await runTest('UI Access Test', async () => {
    const response = await fetch(BASE_URL);
    
    if (!response.ok) throw new Error(`Status ${response.status}`);
    
    const html = await response.text();
    if (html.includes('sign-in') || html.includes('Sign in')) {
      console.log(`  ⚠️  Authentication required for UI`);
    } else {
      console.log(`  ✓ UI accessible without authentication`);
    }
  });

  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('E2E TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log('\nDetailed Results:');
  testResults.forEach(result => {
    console.log(`  ${result.status} ${result.name}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  console.log('\n' + '=' .repeat(60));
  console.log(`Completed at: ${new Date().toISOString()}`);
  console.log('=' .repeat(60));

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runE2ETests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
