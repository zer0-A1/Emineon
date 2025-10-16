#!/usr/bin/env node

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3002/api';

// Color logging
const log = {
  success: (msg) => console.log('\x1b[32m✓\x1b[0m', msg),
  error: (msg) => console.log('\x1b[31m✗\x1b[0m', msg),
  info: (msg) => console.log('\x1b[36mℹ\x1b[0m', msg),
  section: (msg) => console.log('\n\x1b[1m' + msg + '\x1b[0m'),
};

async function testEndpoint(method, path, body = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();
    
    if (response.status === expectedStatus) {
      log.success(`${method} ${path} - Status: ${response.status}`);
      return { success: true, data };
    } else {
      log.error(`${method} ${path} - Status: ${response.status} (expected ${expectedStatus})`);
      console.log('  Response:', data);
      return { success: false, data };
    }
  } catch (error) {
    log.error(`${method} ${path} - Error: ${error.message}`);
    return { success: false, error };
  }
}

async function runTests() {
  log.section('🧪 Comprehensive Emineon ATS Test Suite');
  
  // Track created resources for cleanup
  const createdResources = {
    candidates: [],
    jobs: [],
    clients: [],
    projects: [],
  };

  try {
    // 1. Test Health
    log.section('1. Health Check');
    await testEndpoint('GET', '/health');

    // 2. Test Candidates
    log.section('2. Candidate Management');
    
    // Create candidate
    const candidateRes = await testEndpoint('POST', '/candidates', {
      firstName: 'Test',
      lastName: 'Engineer',
      email: `test.engineer${Date.now()}@example.com`,
      phone: '+1-555-000-1234',
      currentTitle: 'Senior Software Engineer',
      currentLocation: 'San Francisco, CA',
      experienceYears: 8,
      seniorityLevel: 'SENIOR',
      technicalSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      programmingLanguages: ['JavaScript', 'TypeScript', 'Python'],
      frameworks: ['React', 'Next.js', 'Express'],
      expectedSalary: '$150,000 - $180,000',
      remotePreference: 'HYBRID',
    });
    
    if (candidateRes.success) {
      createdResources.candidates.push(candidateRes.data.data.id);
      log.info(`  Created candidate: ${candidateRes.data.data.id}`);
      
      // Get candidate
      await testEndpoint('GET', `/candidates/${candidateRes.data.data.id}`);
      
      // Search candidates
      await testEndpoint('GET', '/candidates?search=engineer');
    }

    // 3. Test Jobs
    log.section('3. Job Management');
    
    // Create job
    const jobRes = await testEndpoint('POST', '/jobs', {
      title: 'Full Stack Developer',
      description: 'We are looking for a full stack developer.',
      location: 'Remote',
      department: 'Engineering',
      contractType: 'permanent',
      remotePreference: 'remote',
      salaryMin: 120000,
      salaryMax: 160000,
      requirements: ['3+ years experience', 'React expertise'],
      responsibilities: ['Build features', 'Review code'],
      benefits: ['Health insurance', 'Stock options'],
      status: 'published',
      pipelineStages: ['Applied', 'Screening', 'Interview', 'Offer'],
    });
    
    if (jobRes.success) {
      createdResources.jobs.push(jobRes.data.data.id);
      log.info(`  Created job: ${jobRes.data.data.id}`);
      
      // Get job
      await testEndpoint('GET', `/jobs/${jobRes.data.data.id}`);
      
      // Add candidate to job
      if (createdResources.candidates.length > 0) {
        await testEndpoint('POST', `/jobs/${jobRes.data.data.id}/candidates`, {
          candidateId: createdResources.candidates[0],
          stage: 'Screening',
          source: 'Test',
        });
      }
    }

    // 4. Test Clients
    log.section('4. Client Management');
    
    // Create client
    const clientRes = await testEndpoint('POST', '/clients', {
      name: `Test Client ${Date.now()}`,
      contactPerson: 'John Doe',
      contactEmail: 'john@testclient.com',
      industry: 'Technology',
    });
    
    if (clientRes.success) {
      createdResources.clients.push(clientRes.data.data.id);
      log.info(`  Created client: ${clientRes.data.data.id}`);
    }

    // 5. Test Projects
    log.section('5. Project Management');
    
    // Create project
    const projectRes = await testEndpoint('POST', '/projects', {
      name: 'Test Project',
      description: 'A test project',
      clientId: createdResources.clients[0],
      status: 'ACTIVE',
    });
    
    if (projectRes.success) {
      createdResources.projects.push(projectRes.data.data.id);
      log.info(`  Created project: ${projectRes.data.data.id}`);
    }

    // 6. Test Vector Search
    log.section('6. Vector Search');
    
    // Trigger reindexing
    if (createdResources.candidates.length > 0) {
      await testEndpoint('POST', `/candidates/${createdResources.candidates[0]}/reindex`, {
        trigger: 'manual'
      });
      
      // Wait for indexing
      log.info('  Waiting for embedding generation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test vector search
      await testEndpoint('GET', '/candidates/vector-search?q=senior%20software%20engineer');
    }

    // 7. Test Database Relationships
    log.section('7. Database Relationships');
    
    // Get job with candidates
    if (createdResources.jobs.length > 0) {
      const jobWithCandidates = await testEndpoint('GET', `/jobs/${createdResources.jobs[0]}/candidates`);
      if (jobWithCandidates.success && jobWithCandidates.data.data.length > 0) {
        log.success('  Job-Candidate relationship working');
      }
    }

    // Summary
    log.section('📊 Test Summary');
    log.info(`  Candidates created: ${createdResources.candidates.length}`);
    log.info(`  Jobs created: ${createdResources.jobs.length}`);
    log.info(`  Clients created: ${createdResources.clients.length}`);
    log.info(`  Projects created: ${createdResources.projects.length}`);

  } catch (error) {
    log.error(`Test suite error: ${error.message}`);
  }

  // Cleanup would go here in a real test suite
  log.section('✅ Test suite completed');
}

// Run tests
runTests().catch(console.error);
