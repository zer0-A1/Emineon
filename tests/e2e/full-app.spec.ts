import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

const testCandidate = {
  firstName: 'John',
  lastName: `Test-${Date.now()}`,
  email: `john.test-${Date.now()}@example.com`,
  phone: '+1 555-123-4567',
  currentTitle: 'Senior Software Engineer',
  location: 'San Francisco, CA',
  experience: '8',
  skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  summary: 'Experienced full-stack developer with expertise in modern web technologies.',
};

const testJob = {
  title: 'Senior React Developer',
  description: 'We are looking for an experienced React developer to join our team and build amazing user interfaces.',
  location: 'Remote',
  department: 'Engineering',
  contractType: 'full-time',
  salaryMin: '120000',
  salaryMax: '180000',
  requirements: ['5+ years React experience', 'TypeScript proficiency', 'REST API integration'],
};

const testCV = `John Doe
Senior Software Engineer
john.doe@example.com | +1 (555) 123-4567 | San Francisco, CA

SUMMARY
Experienced senior software engineer with 8 years of expertise in full-stack development.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python
Frameworks: React, Node.js, Express
Databases: PostgreSQL, MongoDB`;

test.describe('Emineon ATS - Full Application Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test.describe('Authentication & Navigation', () => {
    test('should load the homepage', async ({ page }) => {
      await expect(page).toHaveTitle(/Emineon/);
      await expect(page.locator('text=AI-First Recruitment Platform')).toBeVisible();
    });

    test('should navigate to main sections', async ({ page }) => {
      // Navigate to Jobs
      await page.click('[data-test="nav-jobs"]');
      await expect(page).toHaveURL(/\/jobs/);
      
      // Navigate to Candidates
      await page.click('[data-test="nav-candidates"]');
      await expect(page).toHaveURL(/\/candidates/);
      
      // Navigate to Projects
      await page.click('[data-test="nav-projects"]');
      await expect(page).toHaveURL(/\/projects/);
    });
  });

  test.describe('Candidate Management', () => {
    test('should create a new candidate manually', async ({ page }) => {
      await page.goto('http://localhost:3000/candidates');
      
      // Click create candidate button
      await page.click('[data-test="create-candidate-btn"]');
      
      // Fill in candidate form
      await page.fill('[data-test="candidate-firstname"]', testCandidate.firstName);
      await page.fill('[data-test="candidate-lastname"]', testCandidate.lastName);
      await page.fill('[data-test="candidate-email"]', testCandidate.email);
      await page.fill('[data-test="candidate-phone"]', testCandidate.phone);
      await page.fill('[data-test="candidate-title"]', testCandidate.currentTitle);
      await page.fill('[data-test="candidate-location"]', testCandidate.location);
      await page.fill('[data-test="candidate-experience"]', testCandidate.experience);
      await page.fill('[data-test="candidate-summary"]', testCandidate.summary);
      
      // Add skills
      for (const skill of testCandidate.skills) {
        await page.fill('[data-test="candidate-skill-input"]', skill);
        await page.press('[data-test="candidate-skill-input"]', 'Enter');
      }
      
      // Submit form
      await page.click('[data-test="save-candidate-btn"]');
      
      // Verify candidate was created
      await expect(page.locator(`text=${testCandidate.firstName} ${testCandidate.lastName}`)).toBeVisible();
    });

    test('should upload and parse CV', async ({ page }) => {
      await page.goto('http://localhost:3000/candidates');
      
      // Click upload CV button
      await page.click('[data-test="upload-cv-btn"]');
      
      // Create and upload a test file
      const fileName = 'test-cv.txt';
      await page.setInputFiles('[data-test="cv-file-input"]', {
        name: fileName,
        mimeType: 'text/plain',
        buffer: Buffer.from(testCV)
      });
      
      // Submit upload
      await page.click('[data-test="upload-cv-submit"]');
      
      // Wait for processing
      await page.waitForSelector('[data-test="upload-success"]', { timeout: 10000 });
      
      // Verify candidate was created from CV
      await expect(page.locator('text=John Doe')).toBeVisible();
    });

    test('should search candidates using vector search', async ({ page }) => {
      await page.goto('http://localhost:3000/candidates');
      
      // Wait for candidates to load
      await page.waitForSelector('[data-test="candidate-card"]');
      
      // Search for Python developer
      await page.fill('[data-test="search-input"]', 'python developer');
      
      // Wait for search results
      await page.waitForTimeout(1000); // Debounce delay
      
      // Verify search results show Python-related candidates
      const results = await page.locator('[data-test="candidate-card"]').count();
      expect(results).toBeGreaterThan(0);
      
      // Clear search
      await page.fill('[data-test="search-input"]', '');
      await page.waitForTimeout(1000);
    });

    test('should view candidate profile', async ({ page }) => {
      await page.goto('http://localhost:3000/candidates');
      
      // Click on first candidate
      await page.click('[data-test="candidate-card"]:first-child');
      
      // Verify profile modal opens
      await expect(page.locator('[data-test="candidate-profile-modal"]')).toBeVisible();
      
      // Check profile sections
      await expect(page.locator('[data-test="profile-summary"]')).toBeVisible();
      await expect(page.locator('[data-test="profile-skills"]')).toBeVisible();
      await expect(page.locator('[data-test="profile-experience"]')).toBeVisible();
      
      // Close modal
      await page.click('[data-test="close-modal"]');
    });
  });

  test.describe('Job Management', () => {
    test('should create a new job', async ({ page }) => {
      await page.goto('http://localhost:3000/jobs');
      
      // Click create job button
      await page.click('[data-test="create-job-btn"]');
      
      // Fill in job form
      await page.fill('[data-test="job-title"]', testJob.title);
      await page.fill('[data-test="job-description"]', testJob.description);
      await page.fill('[data-test="job-location"]', testJob.location);
      await page.fill('[data-test="job-department"]', testJob.department);
      
      // Set contract type
      await page.selectOption('[data-test="job-contract-type"]', testJob.contractType);
      
      // Set salary range
      await page.fill('[data-test="job-salary-min"]', testJob.salaryMin);
      await page.fill('[data-test="job-salary-max"]', testJob.salaryMax);
      
      // Add requirements
      for (const req of testJob.requirements) {
        await page.fill('[data-test="job-requirement-input"]', req);
        await page.press('[data-test="job-requirement-input"]', 'Enter');
      }
      
      // Publish job
      await page.click('[data-test="publish-job-btn"]');
      
      // Verify job was created
      await expect(page.locator(`text=${testJob.title}`)).toBeVisible();
    });

    test('should add candidate to job pipeline', async ({ page }) => {
      // First navigate to a job
      await page.goto('http://localhost:3000/jobs');
      await page.click('[data-test="job-card"]:first-child');
      
      // Click add candidate button
      await page.click('[data-test="add-candidate-to-job"]');
      
      // Search and select a candidate
      await page.fill('[data-test="candidate-search"]', 'John');
      await page.waitForTimeout(500);
      await page.click('[data-test="candidate-result"]:first-child');
      
      // Add to pipeline
      await page.click('[data-test="add-to-pipeline-btn"]');
      
      // Verify candidate appears in pipeline
      await expect(page.locator('[data-test="pipeline-candidate"]')).toBeVisible();
    });

    test('should move candidate through pipeline stages', async ({ page }) => {
      // Navigate to job detail with candidates
      await page.goto('http://localhost:3000/jobs');
      await page.click('[data-test="job-card"]:first-child');
      
      // Find a candidate in the pipeline
      const candidate = page.locator('[data-test="pipeline-candidate"]:first-child');
      
      // Drag to next stage
      const nextStage = page.locator('[data-test="pipeline-stage"]:nth-child(2)');
      await candidate.dragTo(nextStage);
      
      // Verify candidate moved
      await expect(nextStage.locator('[data-test="pipeline-candidate"]')).toBeVisible();
    });

    test('should close job as won', async ({ page }) => {
      await page.goto('http://localhost:3000/jobs');
      await page.click('[data-test="job-card"]:first-child');
      
      // Click close job button
      await page.click('[data-test="close-job-btn"]');
      
      // Select outcome
      await page.click('[data-test="outcome-won"]');
      await page.fill('[data-test="close-reason"]', 'Candidate accepted offer');
      
      // Confirm close
      await page.click('[data-test="confirm-close-btn"]');
      
      // Verify congratulations message
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      await expect(page.locator('text=Congratulations')).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('should perform global search', async ({ page }) => {
      await page.goto('http://localhost:3000/search');
      
      // Search for React
      await page.fill('[data-test="global-search"]', 'React developer remote');
      await page.click('[data-test="search-btn"]');
      
      // Verify results sections
      await expect(page.locator('[data-test="search-candidates-section"]')).toBeVisible();
      await expect(page.locator('[data-test="search-jobs-section"]')).toBeVisible();
      
      // Check that results are relevant
      const candidateResults = await page.locator('[data-test="search-candidate-result"]').count();
      const jobResults = await page.locator('[data-test="search-job-result"]').count();
      
      expect(candidateResults + jobResults).toBeGreaterThan(0);
    });
  });

  test.describe('AI Features', () => {
    test('should parse job description with AI', async ({ page }) => {
      await page.goto('http://localhost:3000/jobs/new');
      
      // Paste a job description
      const jobDescription = `
        We're looking for a Senior Full Stack Developer to join our team.
        Requirements:
        - 5+ years of experience with React and Node.js
        - Strong TypeScript skills
        - Experience with PostgreSQL and Redis
        - Remote work available
        Salary: $130k-$170k
      `;
      
      await page.fill('[data-test="job-description-input"]', jobDescription);
      await page.click('[data-test="parse-with-ai-btn"]');
      
      // Wait for AI parsing
      await page.waitForSelector('[data-test="parsing-complete"]', { timeout: 10000 });
      
      // Verify fields were populated
      await expect(page.inputValue('[data-test="job-title"]')).toContain('Full Stack Developer');
      await expect(page.inputValue('[data-test="job-salary-min"]')).toBe('130000');
      await expect(page.inputValue('[data-test="job-salary-max"]')).toBe('170000');
    });

    test('should get AI recommendations for candidates', async ({ page }) => {
      await page.goto('http://localhost:3000/jobs');
      await page.click('[data-test="job-card"]:first-child');
      
      // Click AI match button
      await page.click('[data-test="ai-match-candidates"]');
      
      // Wait for recommendations
      await page.waitForSelector('[data-test="ai-recommendations"]', { timeout: 15000 });
      
      // Verify recommendations are shown
      const recommendations = await page.locator('[data-test="ai-recommendation"]').count();
      expect(recommendations).toBeGreaterThan(0);
    });
  });

  test.describe('Competence Files', () => {
    test('should generate competence file', async ({ page }) => {
      await page.goto('http://localhost:3000/candidates');
      await page.click('[data-test="candidate-card"]:first-child');
      
      // Click generate competence file
      await page.click('[data-test="generate-competence-file"]');
      
      // Select template
      await page.selectOption('[data-test="template-select"]', 'antaes');
      
      // Generate file
      await page.click('[data-test="generate-btn"]');
      
      // Wait for generation
      await page.waitForSelector('[data-test="download-competence-file"]', { timeout: 15000 });
      
      // Verify download button is available
      await expect(page.locator('[data-test="download-competence-file"]')).toBeEnabled();
    });
  });

  test.describe('Projects & Clients', () => {
    test('should create a new client', async ({ page }) => {
      await page.goto('http://localhost:3000/clients');
      
      await page.click('[data-test="create-client-btn"]');
      
      await page.fill('[data-test="client-name"]', 'Test Company Inc');
      await page.fill('[data-test="client-contact"]', 'John Smith');
      await page.fill('[data-test="client-email"]', 'contact@testcompany.com');
      await page.fill('[data-test="client-industry"]', 'Technology');
      
      await page.click('[data-test="save-client-btn"]');
      
      await expect(page.locator('text=Test Company Inc')).toBeVisible();
    });

    test('should create a project for client', async ({ page }) => {
      await page.goto('http://localhost:3000/projects');
      
      await page.click('[data-test="create-project-btn"]');
      
      await page.fill('[data-test="project-name"]', 'Q4 Hiring Initiative');
      await page.selectOption('[data-test="project-client"]', { index: 1 });
      await page.fill('[data-test="project-description"]', 'Hiring 10 engineers for Q4');
      await page.fill('[data-test="project-budget"]', '500000');
      
      await page.click('[data-test="save-project-btn"]');
      
      await expect(page.locator('text=Q4 Hiring Initiative')).toBeVisible();
    });
  });

  test.describe('Performance & Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);
      
      await page.goto('http://localhost:3000/candidates');
      
      // Try to create a candidate
      await page.click('[data-test="create-candidate-btn"]');
      await page.fill('[data-test="candidate-firstname"]', 'Test');
      await page.fill('[data-test="candidate-lastname"]', 'User');
      await page.click('[data-test="save-candidate-btn"]');
      
      // Should show error message
      await expect(page.locator('[data-test="error-message"]')).toBeVisible();
      
      // Go back online
      await page.context().setOffline(false);
    });

    test('should load large candidate list efficiently', async ({ page }) => {
      await page.goto('http://localhost:3000/candidates');
      
      // Measure load time
      const startTime = Date.now();
      await page.waitForSelector('[data-test="candidate-card"]');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check virtualization is working (not all candidates rendered)
      const visibleCards = await page.locator('[data-test="candidate-card"]').count();
      const totalCount = await page.locator('[data-test="total-count"]').textContent();
      
      if (parseInt(totalCount || '0') > 20) {
        expect(visibleCards).toBeLessThanOrEqual(20);
      }
    });
  });
});

test.describe('Data Integrity Tests', () => {
  test('should maintain data consistency across operations', async ({ page }) => {
    // Create a candidate
    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.goto('http://localhost:3000/candidates');
    await page.click('[data-test="create-candidate-btn"]');
    await page.fill('[data-test="candidate-email"]', uniqueEmail);
    await page.fill('[data-test="candidate-firstname"]', 'Data');
    await page.fill('[data-test="candidate-lastname"]', 'Test');
    await page.click('[data-test="save-candidate-btn"]');
    
    // Verify in list
    await page.waitForSelector(`text=${uniqueEmail}`);
    
    // Search for the candidate
    await page.fill('[data-test="search-input"]', uniqueEmail);
    await page.waitForTimeout(1000);
    
    // Should find exactly one result
    const searchResults = await page.locator('[data-test="candidate-card"]').count();
    expect(searchResults).toBe(1);
    
    // Add to a job and verify
    await page.goto('http://localhost:3000/jobs');
    await page.click('[data-test="job-card"]:first-child');
    await page.click('[data-test="add-candidate-to-job"]');
    await page.fill('[data-test="candidate-search"]', uniqueEmail);
    await page.waitForTimeout(500);
    await page.click('[data-test="candidate-result"]:first-child');
    await page.click('[data-test="add-to-pipeline-btn"]');
    
    // Verify candidate is in pipeline
    await expect(page.locator(`[data-test="pipeline-candidate"]:has-text("${uniqueEmail}")`)).toBeVisible();
  });
});
