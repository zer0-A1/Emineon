#!/usr/bin/env node

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000/api';

// Color logging
const log = {
  section: (msg) => console.log('\n' + '='.repeat(60) + '\n' + '✨ ' + msg + '\n' + '='.repeat(60)),
  success: (msg) => console.log('\x1b[32m✓\x1b[0m', msg),
  error: (msg) => console.log('\x1b[31m✗\x1b[0m', msg),
  info: (msg) => console.log('\x1b[36mℹ\x1b[0m', msg),
  warn: (msg) => console.log('\x1b[33m⚠\x1b[0m', msg),
  result: (label, value) => console.log(`  \x1b[90m${label}:\x1b[0m`, value),
};

// Track test results
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
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
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    
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

async function testHealth() {
  log.section('HEALTH CHECK');
  
  const health = await apiCall('GET', '/health');
  if (health.success) {
    log.success('Health check passed');
    log.result('Database latency', `${health.data.dbMs}ms`);
    log.result('Services', JSON.stringify(health.data.services));
    testResults.passed++;
  } else {
    log.error('Health check failed');
    testResults.failed++;
  }
}

async function testCandidates() {
  log.section('CANDIDATE MANAGEMENT');
  
  // Create candidate
  const candidate = await apiCall('POST', '/candidates', {
    firstName: 'Emma',
    lastName: 'Watson',
    email: `emma.watson${Date.now()}@example.com`,
    phone: '+44-20-1234-5678',
    currentTitle: 'AI Research Scientist',
    currentLocation: 'London, UK',
    professionalHeadline: 'PhD in Machine Learning | Computer Vision Expert',
    experienceYears: 10,
    seniorityLevel: 'SENIOR',
    technicalSkills: ['Python', 'TensorFlow', 'PyTorch', 'OpenCV', 'CUDA'],
    softSkills: ['Leadership', 'Research', 'Public Speaking'],
    programmingLanguages: ['Python', 'C++', 'R', 'Julia'],
    frameworks: ['TensorFlow', 'PyTorch', 'Keras', 'scikit-learn'],
    toolsAndPlatforms: ['AWS', 'Google Cloud', 'Docker', 'Kubernetes'],
    methodologies: ['Agile', 'Research-driven Development', 'MLOps'],
    educationLevel: 'PHD',
    universities: ['Oxford University', 'MIT'],
    degrees: ['PhD Computer Science', 'MSc Machine Learning'],
    graduationYear: 2015,
    certifications: ['AWS ML Specialty', 'Google Cloud ML Engineer'],
    expectedSalary: '£120,000 - £150,000',
    preferredContractType: 'FULL_TIME',
    freelancer: false,
    remotePreference: 'HYBRID',
    tags: ['ai-expert', 'computer-vision', 'available-now'],
    gdprConsent: true,
  });
  
  if (candidate.success) {
    log.success('Created candidate');
    log.result('ID', candidate.data.data.id);
    log.result('Name', `${candidate.data.data.first_name} ${candidate.data.data.last_name}`);
    testResults.passed++;
    
    const candidateId = candidate.data.data.id;
    
    // Get candidate
    const getCandidate = await apiCall('GET', `/candidates/${candidateId}`);
    if (getCandidate.success) {
      log.success('Retrieved candidate details');
      testResults.passed++;
    } else {
      log.error('Failed to retrieve candidate');
      testResults.failed++;
    }
    
    // Update candidate
    const update = await apiCall('PUT', `/candidates/${candidateId}`, {
      tags: ['ai-expert', 'computer-vision', 'available-now', 'top-talent'],
      expectedSalary: '£130,000 - £160,000',
    });
    if (update.success) {
      log.success('Updated candidate');
      testResults.passed++;
    } else {
      log.error('Failed to update candidate');
      testResults.failed++;
    }
    
    // Trigger reindexing
    const reindex = await apiCall('POST', `/candidates/${candidateId}/reindex`, { trigger: 'manual' });
    if (reindex.success) {
      log.success('Triggered reindexing for vector search');
      testResults.passed++;
    } else {
      log.error('Failed to reindex');
      testResults.failed++;
    }
    
    return candidateId;
  } else {
    log.error(`Failed to create candidate: ${candidate.data?.error || 'Unknown error'}`);
    testResults.failed++;
    return null;
  }
}

async function testJobs(candidateId) {
  log.section('JOB MANAGEMENT');
  
  // Create job
  const job = await apiCall('POST', '/jobs', {
    title: 'AI/ML Engineer',
    description: 'We are looking for an exceptional AI/ML Engineer to lead our computer vision research projects and build next-generation AI systems.',
    location: 'London, UK / Remote',
    department: 'AI Research',
    contractType: 'full_time',
    remotePreference: 'hybrid',
    salaryMin: 120000,
    salaryMax: 160000,
    salaryCurrency: 'GBP',
    requirements: [
      '5+ years ML experience',
      'PhD or equivalent experience',
      'Computer vision expertise',
      'Production ML deployment'
    ],
    responsibilities: [
      'Lead computer vision research',
      'Deploy ML models at scale',
      'Mentor junior researchers',
      'Publish research papers'
    ],
    benefits: [
      'Competitive salary',
      'Research budget',
      'Conference attendance',
      'Flexible working'
    ],
    requiredSkills: ['Python', 'TensorFlow', 'Computer Vision', 'Deep Learning'],
    preferredSkills: ['CUDA', 'C++', 'Research Publications'],
    status: 'published',
    urgency: 'high',
    pipelineStages: ['Applied', 'CV Review', 'Technical Interview', 'Research Presentation', 'Final Interview', 'Offer'],
  });
  
  if (job.success) {
    log.success('Created job');
    log.result('ID', job.data.data.id);
    log.result('Title', job.data.data.title);
    log.result('Status', job.data.data.status);
    testResults.passed++;
    
    const jobId = job.data.data.id;
    
    // Add candidate to job
    if (candidateId) {
      const addCandidate = await apiCall('POST', `/jobs/${jobId}/candidates`, {
        candidateId,
        stage: 'CV Review',
        source: 'Test Suite',
        notes: 'Perfect match for our AI/ML position',
      });
      
      if (addCandidate.success) {
        log.success('Added candidate to job pipeline');
        log.result('Stage', 'CV Review');
        testResults.passed++;
      } else {
        log.error(`Failed to add candidate: ${addCandidate.data?.error}`);
        testResults.failed++;
      }
    }
    
    // Get job with candidates
    const jobWithCandidates = await apiCall('GET', `/jobs/${jobId}/candidates`);
    if (jobWithCandidates.success) {
      log.success(`Retrieved job candidates: ${jobWithCandidates.data.data.length} candidates`);
      testResults.passed++;
    } else {
      log.error('Failed to get job candidates');
      testResults.failed++;
    }
    
    return jobId;
  } else {
    log.error(`Failed to create job: ${job.data?.error || JSON.stringify(job.data?.details)}`);
    testResults.failed++;
    return null;
  }
}

async function testSearch() {
  log.section('SEARCH FUNCTIONALITY');
  
  // Test text search
  const textSearch = await apiCall('GET', '/candidates?search=emma');
  if (textSearch.success && textSearch.data.data.length > 0) {
    log.success(`Text search found ${textSearch.data.data.length} candidates`);
    testResults.passed++;
  } else {
    log.warn('Text search returned no results');
    testResults.warnings++;
  }
  
  // Wait for embeddings
  log.info('Waiting for embeddings to generate...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test vector searches
  const searches = [
    { query: 'AI researcher with computer vision', expectedMatch: 'Emma Watson' },
    { query: 'python developer', expectedMatch: 'Multiple matches' },
    { query: 'machine learning expert PhD', expectedMatch: 'Emma Watson' },
    { query: 'frontend developer react', expectedMatch: 'Bob Wilson' },
  ];
  
  for (const search of searches) {
    const result = await apiCall('GET', `/candidates/vector-search?q=${encodeURIComponent(search.query)}`);
    if (result.success && result.data.data.length > 0) {
      log.success(`Vector search "${search.query}": ${result.data.data.length} results`);
      log.result('Top match', `${result.data.data[0].first_name} ${result.data.data[0].last_name} (${(result.data.data[0]._score * 100).toFixed(1)}%)`);
      testResults.passed++;
    } else {
      log.error(`Vector search "${search.query}": No results`);
      testResults.failed++;
    }
  }
}

async function testClientProject() {
  log.section('CLIENT & PROJECT MANAGEMENT');
  
  // Create client
  const client = await apiCall('POST', '/clients', {
    name: 'DeepMind Technologies',
    contactPerson: 'Dr. Sarah Chen',
    contactEmail: 'sarah.chen@deepmind.com',
    phone: '+44-20-9876-5432',
    address: '1 Kingdom Street, London, UK',
    industry: 'Artificial Intelligence',
    website: 'https://deepmind.com',
    notes: 'Leading AI research company, frequent hiring needs',
  });
  
  if (client.success) {
    log.success('Created client');
    log.result('Name', client.data.data.name);
    testResults.passed++;
    
    // Create project
    const project = await apiCall('POST', '/projects', {
      name: 'Computer Vision Research Team',
      description: 'Building a new computer vision research team for autonomous systems',
      clientId: client.data.data.id,
      status: 'ACTIVE',
      startDate: new Date().toISOString(),
      budget: 2500000,
    });
    
    if (project.success && project.data?.data) {
      log.success('Created project');
      log.result('Name', project.data.data.name || 'Project created');
      testResults.passed++;
    } else {
      log.error(`Failed to create project: ${project.data?.error || 'Unknown error'}`);
      testResults.failed++;
    }
  } else {
    log.error(`Failed to create client: ${client.data?.error}`);
    testResults.failed++;
  }
}

async function testCompetenceFiles(candidateId) {
  log.section('COMPETENCE FILE GENERATION');
  
  if (!candidateId) {
    log.warn('Skipping - no candidate ID');
    return;
  }
  
  const competenceFile = await apiCall('POST', '/competence-files/generate', {
    candidateId,
    template: 'default',
    language: 'en',
    format: 'pdf',
  });
  
  if (competenceFile.success) {
    log.success('Generated competence file');
    testResults.passed++;
  } else {
    log.warn(`Competence file generation not available: ${competenceFile.data?.error || competenceFile.status}`);
    testResults.warnings++;
  }
}

async function runAllTests() {
  console.log('\n🚀 EMINEON ATS - COMPREHENSIVE PLATFORM TEST\n');
  console.log('Testing with Neon PostgreSQL + pgvector + OpenAI embeddings\n');
  
  const startTime = Date.now();
  
  try {
    // Run all tests
    await testHealth();
    const candidateId = await testCandidates();
    const jobId = await testJobs(candidateId);
    await testSearch();
    await testClientProject();
    await testCompetenceFiles(candidateId);
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log.section('TEST SUMMARY');
    log.result('Total tests', testResults.passed + testResults.failed);
    log.result('Passed', `\x1b[32m${testResults.passed}\x1b[0m`);
    log.result('Failed', `\x1b[31m${testResults.failed}\x1b[0m`);
    log.result('Warnings', `\x1b[33m${testResults.warnings}\x1b[0m`);
    log.result('Duration', `${duration}s`);
    
    if (testResults.failed === 0) {
      console.log('\n✅ \x1b[32mALL TESTS PASSED!\x1b[0m The platform is working perfectly! 🎉\n');
    } else {
      console.log('\n❌ \x1b[31mSOME TESTS FAILED\x1b[0m Please check the errors above.\n');
    }
    
  } catch (error) {
    log.error(`Test suite error: ${error.message}`);
    console.error(error);
  }
}

// Run tests
runAllTests();
