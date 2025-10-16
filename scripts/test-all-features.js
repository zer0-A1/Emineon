#!/usr/bin/env node

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const API_BASE = 'http://localhost:3001/api';

// Color logging
const log = {
  section: (msg) => console.log('\n' + '='.repeat(60) + '\n' + msg + '\n' + '='.repeat(60)),
  success: (msg) => console.log('\x1b[32m✓\x1b[0m', msg),
  error: (msg) => console.log('\x1b[31m✗\x1b[0m', msg),
  info: (msg) => console.log('\x1b[36mℹ\x1b[0m', msg),
  warn: (msg) => console.log('\x1b[33m⚠\x1b[0m', msg),
};

async function apiCall(method, path, body = null) {
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
    
    return { 
      success: response.ok, 
      status: response.status, 
      data,
      response 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function testCandidateFeatures() {
  log.section('1. CANDIDATE MANAGEMENT');
  
  // Create a candidate
  log.info('Creating candidate...');
  const candidate = await apiCall('POST', '/candidates', {
    firstName: 'Test',
    lastName: 'Developer',
    email: `test${Date.now()}@example.com`,
    currentTitle: 'Senior Full Stack Developer',
    currentLocation: 'Remote',
    technicalSkills: ['JavaScript', 'Python', 'React', 'Node.js'],
    experienceYears: 8,
  });
  
  if (candidate.success) {
    log.success(`Created candidate: ${candidate.data.data.id}`);
    const candidateId = candidate.data.data.id;
    
    // Get candidate
    const getCandidate = await apiCall('GET', `/candidates/${candidateId}`);
    if (getCandidate.success && getCandidate.data?.data) {
      log.success(`Retrieved candidate: ${getCandidate.data.data.first_name} ${getCandidate.data.data.last_name}`);
    } else {
      log.warn('Could not retrieve candidate details');
    }
    
    // Update candidate
    const update = await apiCall('PUT', `/candidates/${candidateId}`, {
      technicalSkills: ['JavaScript', 'Python', 'React', 'Node.js', 'Docker'],
    });
    log.success('Updated candidate skills');
    
    // Search candidates
    const search = await apiCall('GET', '/candidates?search=test');
    log.success(`Text search found ${search.data.data.length} candidates`);
    
    // Reindex for vector search
    log.info('Triggering reindexing...');
    const reindex = await apiCall('POST', `/candidates/${candidateId}/reindex`, { trigger: 'manual' });
    if (reindex.success) {
      log.success('Reindexing triggered');
    } else {
      log.error(`Reindexing failed: ${reindex.data.error}`);
    }
    
    return candidateId;
  } else {
    log.error(`Failed to create candidate: ${candidate.data.error}`);
    return null;
  }
}

async function testJobFeatures(candidateId) {
  log.section('2. JOB MANAGEMENT');
  
  // Create a job
  log.info('Creating job...');
  const job = await apiCall('POST', '/jobs', {
    title: 'Senior Full Stack Engineer',
    description: 'We need a senior engineer to lead our team.',
    location: 'Remote',
    department: 'Engineering',
    contractType: 'full_time',
    remotePreference: 'remote',
    salaryMin: 140000,
    salaryMax: 180000,
    requirements: ['5+ years experience', 'React expertise', 'Node.js proficiency'],
    benefits: ['Health insurance', 'Stock options', 'Flexible hours'],
    status: 'published',
    pipelineStages: ['Applied', 'Screening', 'Technical', 'Final', 'Offer'],
  });
  
  if (job.success) {
    log.success(`Created job: ${job.data.data.id}`);
    const jobId = job.data.data.id;
    
    // Add candidate to job
    if (candidateId) {
      const addCandidate = await apiCall('POST', `/jobs/${jobId}/candidates`, {
        candidateId,
        stage: 'Screening',
        source: 'Test Suite',
      });
      if (addCandidate.success) {
        log.success('Added candidate to job pipeline');
      } else {
        log.error(`Failed to add candidate: ${addCandidate.data.error}`);
      }
    }
    
    // Get job candidates
    const jobCandidates = await apiCall('GET', `/jobs/${jobId}/candidates`);
    log.success(`Job has ${jobCandidates.data.data.length} candidates`);
    
    return jobId;
  } else {
    log.error(`Failed to create job: ${job.data.error}`);
    return null;
  }
}

async function testClientProjectFeatures() {
  log.section('3. CLIENT & PROJECT MANAGEMENT');
  
  // Create client
  const client = await apiCall('POST', '/clients', {
    name: `Test Client ${Date.now()}`,
    contactPerson: 'John Test',
    contactEmail: 'john@testclient.com',
    industry: 'Technology',
  });
  
  if (client.success) {
    log.success(`Created client: ${client.data.data.id}`);
    
    // Create project
    const project = await apiCall('POST', '/projects', {
      name: 'Test Project',
      description: 'A test project for the test client',
      clientId: client.data.data.id,
      status: 'ACTIVE',
    });
    
    if (project.success) {
      log.success(`Created project: ${project.data.data.id}`);
    } else {
      log.error(`Failed to create project: ${project.data.error}`);
    }
  } else {
    log.error(`Failed to create client: ${client.data.error}`);
  }
}

async function testVectorSearch() {
  log.section('4. VECTOR SEARCH');
  
  // Wait a bit for embeddings to be generated
  log.info('Waiting for embeddings...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const queries = [
    'full stack developer',
    'python engineer',
    'react developer',
    'senior engineer remote',
  ];
  
  for (const q of queries) {
    const result = await apiCall('GET', `/candidates/vector-search?q=${encodeURIComponent(q)}`);
    if (result.success && result.data.data.length > 0) {
      log.success(`Vector search "${q}": Found ${result.data.data.length} results`);
      result.data.data.slice(0, 2).forEach(c => {
        log.info(`  - ${c.first_name} ${c.last_name} (${c.current_title}) - Score: ${c._score?.toFixed(3)}`);
      });
    } else {
      log.warn(`Vector search "${q}": No results`);
    }
  }
}

async function testCompetenceFiles(candidateId) {
  log.section('5. COMPETENCE FILE GENERATION');
  
  if (!candidateId) {
    log.warn('Skipping - no candidate ID');
    return;
  }
  
  const competenceFile = await apiCall('POST', '/competence-files/generate', {
    candidateId,
    template: 'default',
    format: 'pdf',
  });
  
  if (competenceFile.success) {
    log.success('Generated competence file');
  } else {
    log.error(`Failed to generate competence file: ${competenceFile.data?.error || 'Unknown error'}`);
  }
}

async function runAllTests() {
  console.log('\n🚀 EMINEON ATS - COMPREHENSIVE FEATURE TEST\n');
  
  try {
    // Test health
    const health = await apiCall('GET', '/health');
    if (health.success) {
      log.success('Health check passed');
      log.info(`Database: ${health.data.dbMs}ms`);
      log.info(`Services: ${JSON.stringify(health.data.services)}`);
    } else {
      log.error('Health check failed');
      return;
    }
    
    // Run tests
    const candidateId = await testCandidateFeatures();
    const jobId = await testJobFeatures(candidateId);
    await testClientProjectFeatures();
    await testVectorSearch();
    await testCompetenceFiles(candidateId);
    
    log.section('✅ TEST SUITE COMPLETE');
    
  } catch (error) {
    log.error(`Test suite error: ${error.message}`);
    console.error(error);
  }
}

// Run tests
runAllTests();
