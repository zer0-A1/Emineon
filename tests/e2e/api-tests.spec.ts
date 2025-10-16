import { test, expect } from '@playwright/test';

test.describe('API Tests - Core Functionality', () => {
  const API_BASE = 'http://localhost:3000/api';

  test('Health check', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    console.log('Health check:', data);
  });

  test('Create and search candidates', async ({ request }) => {
    // Create a candidate
    const candidateData = {
      firstName: 'Test',
      lastName: `User-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      phone: '+1-555-0123',
      currentTitle: 'Senior Developer',
      currentLocation: 'San Francisco, CA',
      summary: 'Experienced developer with React and Node.js expertise',
      experienceYears: 8,
      technicalSkills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
      expectedSalary: '$150,000 - $180,000',
    };

    const createResponse = await request.post(`${API_BASE}/candidates`, {
      data: candidateData,
    });
    
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    expect(created.success).toBe(true);
    expect(created.data.email).toBe(candidateData.email);
    console.log('Created candidate:', created.data.id);

    // Search for the candidate using vector search
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for indexing
    
    const searchResponse = await request.get(`${API_BASE}/candidates/vector-search?q=React+Node.js+developer`);
    expect(searchResponse.ok()).toBeTruthy();
    const searchResults = await searchResponse.json();
    expect(searchResults.success).toBe(true);
    expect(searchResults.searchType).toBe('vector');
    expect(searchResults.data.length).toBeGreaterThan(0);
    
    // Check if our candidate is in results
    const foundCandidate = searchResults.data.find((c: any) => c.email === candidateData.email);
    expect(foundCandidate).toBeTruthy();
    console.log('Found candidate in vector search with score:', foundCandidate._score);
  });

  test('Upload and parse CV', async ({ request }) => {
    const cvContent = `John Smith
Senior Full Stack Engineer
john.smith@techcorp.com | +1-555-9876 | New York, NY

SUMMARY
10+ years building scalable web applications with React, Node.js, and cloud technologies.

TECHNICAL SKILLS
• Languages: JavaScript, TypeScript, Python, Go
• Frontend: React, Next.js, Vue.js, Redux
• Backend: Node.js, Express, NestJS, GraphQL
• Databases: PostgreSQL, MongoDB, Redis
• Cloud: AWS, Google Cloud, Docker, Kubernetes

EXPERIENCE
Tech Lead - MegaCorp (2020-Present)
• Led team of 8 engineers building microservices platform
• Reduced deployment time by 80% with CI/CD automation
• Mentored junior developers and conducted technical interviews

EDUCATION
M.S. Computer Science - Stanford University (2013)
B.S. Computer Engineering - MIT (2011)`;

    // Create form data with file
    const formData = new FormData();
    const file = new File([cvContent], 'test-cv.txt', { type: 'text/plain' });
    formData.append('file', file);

    const uploadResponse = await request.post(`${API_BASE}/candidates/upload-cv`, {
      multipart: {
        file: {
          name: 'test-cv.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from(cvContent),
        },
      },
    });

    expect(uploadResponse.ok()).toBeTruthy();
    const result = await uploadResponse.json();
    expect(result.success).toBe(true);
    expect(result.data.first_name).toBe('John');
    expect(result.data.last_name).toBe('Smith');
    expect(result.data.email).toBe('john.smith@techcorp.com');
    expect(result.data.experience_years).toBe(10);
    console.log('CV parsed successfully, created candidate:', result.data.id);
  });

  test('Create and manage jobs', async ({ request }) => {
    // Create a job
    const jobData = {
      title: 'Senior React Developer',
      description: 'We are looking for an experienced React developer to build amazing user interfaces for our SaaS platform.',
      location: 'Remote',
      department: 'Engineering',
      contractType: 'full-time',
      salaryMin: 120000,
      salaryMax: 180000,
      salaryCurrency: 'USD',
      requiredSkills: ['React', 'TypeScript', 'GraphQL'],
      preferredSkills: ['Next.js', 'Tailwind CSS'],
      requirements: ['5+ years React experience', 'Strong TypeScript skills'],
      status: 'PUBLISHED',
    };

    const createResponse = await request.post(`${API_BASE}/jobs`, {
      data: jobData,
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    expect(created.success).toBe(true);
    expect(created.data.title).toBe(jobData.title);
    const jobId = created.data.id;
    console.log('Created job:', jobId);

    // Get job details
    const getResponse = await request.get(`${API_BASE}/jobs/${jobId}`);
    expect(getResponse.ok()).toBeTruthy();
    const job = await getResponse.json();
    expect(job.data.id).toBe(jobId);

    // Close the job as won
    const closeResponse = await request.post(`${API_BASE}/jobs/${jobId}/close`, {
      data: {
        outcome: 'WON',
        reason: 'Candidate accepted offer',
      },
    });

    expect(closeResponse.ok()).toBeTruthy();
    const closed = await closeResponse.json();
    expect(closed.success).toBe(true);
    expect(closed.data.close_outcome).toBe('WON');
    console.log('Job closed successfully');
  });

  test('Add candidate to job pipeline', async ({ request }) => {
    // First, get a job and a candidate
    const jobsResponse = await request.get(`${API_BASE}/jobs?limit=1`);
    const jobs = await jobsResponse.json();
    expect(jobs.data.length).toBeGreaterThan(0);
    const jobId = jobs.data[0].id;

    const candidatesResponse = await request.get(`${API_BASE}/candidates?limit=1`);
    const candidates = await candidatesResponse.json();
    expect(candidates.data.length).toBeGreaterThan(0);
    const candidateId = candidates.data[0].databaseId;

    // Add candidate to job
    const addResponse = await request.post(`${API_BASE}/jobs/${jobId}/candidates`, {
      data: {
        candidateId,
        stage: 'Applied',
      },
    });

    expect(addResponse.ok()).toBeTruthy();
    const result = await addResponse.json();
    expect(result.success).toBe(true);
    console.log('Added candidate to job pipeline');

    // Update candidate stage
    const updateResponse = await request.put(`${API_BASE}/jobs/${jobId}/candidates`, {
      data: {
        candidateId,
        stage: 'Interview',
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    console.log('Updated candidate stage');
  });

  test('Create client and project', async ({ request }) => {
    // Create client
    const clientData = {
      name: `Test Company ${Date.now()}`,
      contactPerson: 'John Doe',
      contactEmail: 'john@testcompany.com',
      phone: '+1-555-0000',
      industry: 'Technology',
      website: 'https://testcompany.com',
    };

    const clientResponse = await request.post(`${API_BASE}/clients`, {
      data: clientData,
    });

    expect(clientResponse.ok()).toBeTruthy();
    const client = await clientResponse.json();
    expect(client.success).toBe(true);
    const clientId = client.data.id;
    console.log('Created client:', clientId);

    // Create project
    const projectData = {
      name: 'Q1 Hiring Initiative',
      clientId,
      description: 'Hiring 5 engineers for Q1',
      budget: 250000,
      status: 'ACTIVE',
    };

    const projectResponse = await request.post(`${API_BASE}/projects`, {
      data: projectData,
    });

    expect(projectResponse.ok()).toBeTruthy();
    const project = await projectResponse.json();
    expect(project.success).toBe(true);
    console.log('Created project:', project.data.id);
  });

  test('Performance: Vector search speed', async ({ request }) => {
    const queries = [
      'Python developer with Django',
      'React frontend engineer',
      'DevOps Kubernetes expert',
      'Machine learning data scientist',
      'Full stack JavaScript developer',
    ];

    const times: number[] = [];

    for (const query of queries) {
      const start = Date.now();
      const response = await request.get(`${API_BASE}/candidates/vector-search?q=${encodeURIComponent(query)}`);
      const duration = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      times.push(duration);
      console.log(`Search "${query}": ${duration}ms`);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average search time: ${avgTime}ms`);
    expect(avgTime).toBeLessThan(500); // Should be fast
  });
});
