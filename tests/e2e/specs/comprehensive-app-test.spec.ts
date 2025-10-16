import { test, expect, Page } from '@playwright/test';
import { mockAuthentication, waitForApp } from '../helpers/auth';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper function to take screenshots on failure
async function takeScreenshotOnFailure(page: Page, testName: string) {
  await page.screenshot({ path: `test-results/failures/${testName}-${Date.now()}.png`, fullPage: true });
}

test.describe('Emineon ATS - Comprehensive E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication with Clerk
    await mockAuthentication(page);
    await page.goto(BASE_URL);
    await waitForApp(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await takeScreenshotOnFailure(page, testInfo.title);
    }
  });

  test.describe('1. Authentication & Access Control', () => {
    test('should handle authentication flow correctly', async ({ page }) => {
      // Clear auth and try to access protected route
      await page.context().clearCookies();
      await page.goto(`${BASE_URL}/jobs`);
      
      // Should redirect to login
      await expect(page).toHaveURL(/sign-in/);
      
      // Mock sign in
      await mockAuthentication(page);
      await page.goto(`${BASE_URL}/jobs`);
      
      // Should now access protected route
      await expect(page).toHaveURL(`${BASE_URL}/jobs`);
    });

    test('should display user profile and allow sign out', async ({ page }) => {
      // Check user button is visible
      await expect(page.locator('[data-test="user-button"]')).toBeVisible();
      
      // Click user button
      await page.click('[data-test="user-button"]');
      
      // Check profile menu appears
      await expect(page.locator('[data-test="user-menu"]')).toBeVisible();
      await expect(page.locator('[data-test="user-email"]')).toBeVisible();
      
      // Sign out
      await page.click('[data-test="sign-out"]');
      
      // Should redirect to home
      await expect(page).toHaveURL(BASE_URL);
    });
  });

  test.describe('2. Navigation & Layout', () => {
    test('should navigate through all main sections', async ({ page }) => {
      const sections = [
        { nav: 'nav-dashboard', url: '/dashboard', title: 'Dashboard' },
        { nav: 'nav-jobs', url: '/jobs', title: 'Jobs' },
        { nav: 'nav-candidates', url: '/candidates', title: 'Candidates' },
        { nav: 'nav-projects', url: '/projects', title: 'Projects' },
        { nav: 'nav-clients', url: '/clients', title: 'Clients' },
        { nav: 'nav-search', url: '/search', title: 'Search' },
        { nav: 'nav-reports', url: '/reports', title: 'Reports' },
        { nav: 'nav-settings', url: '/settings', title: 'Settings' },
      ];

      for (const section of sections) {
        await page.click(`[data-test="${section.nav}"]`);
        await expect(page).toHaveURL(new RegExp(section.url));
        await expect(page.locator('h1, h2')).toContainText(section.title);
      }
    });

    test('should handle responsive navigation', async ({ page }) => {
      // Test mobile navigation
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mobile menu button should be visible
      await expect(page.locator('[data-test="mobile-menu-button"]')).toBeVisible();
      
      // Open mobile menu
      await page.click('[data-test="mobile-menu-button"]');
      
      // Navigation should be visible
      await expect(page.locator('[data-test="mobile-nav"]')).toBeVisible();
      
      // Navigate via mobile menu
      await page.click('[data-test="mobile-nav-jobs"]');
      await expect(page).toHaveURL(/\/jobs/);
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });

  test.describe('3. Jobs - All Views and Interactions', () => {
    test('should test all job view modes thoroughly', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs`);
      
      // Test List View
      await page.click('[data-test="view-list"]');
      await expect(page.locator('[data-test="jobs-container"]')).toHaveClass(/flex-col/);
      
      // Test Grid View
      await page.click('[data-test="view-grid"]');
      await expect(page.locator('[data-test="jobs-container"]')).toHaveClass(/grid/);
      
      // Test Group by Client View
      await page.click('[data-test="view-client"]');
      await expect(page.locator('[data-test="client-section"]').first()).toBeVisible();
      
      // Verify each view has proper styling
      // List view - single row cards
      await page.click('[data-test="view-list"]');
      const listCards = page.locator('[data-test="job-card"]');
      await expect(listCards.first()).toHaveClass(/h-16/); // Single row height
      
      // Test expand/collapse functionality
      await page.click('[data-test="toggle-view-all"]');
      await expect(page.locator('[data-test="expanded-info"]').first()).toBeVisible();
      
      // Test individual card expand
      const firstCard = page.locator('[data-test="job-card"]').first();
      await firstCard.locator('[data-test="expand-button"]').click();
      await expect(firstCard.locator('[data-test="detailed-info"]')).toBeVisible();
    });

    test('should test job card interactions in all views', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs`);
      
      // Test in List View
      await page.click('[data-test="view-list"]');
      
      // Single row card should be clickable
      const jobCard = page.locator('[data-test="job-card"]').first();
      await jobCard.click();
      await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9-]+$/);
      await page.goBack();
      
      // Test card actions
      await jobCard.hover();
      await jobCard.locator('[data-test="job-menu-button"]').click();
      await expect(page.locator('[data-test="job-menu"]')).toBeVisible();
      
      // Test Edit
      await page.click('[data-test="edit-job"]');
      await expect(page.locator('[data-test="edit-job-modal"]')).toBeVisible();
      await page.click('[data-test="close-modal"]');
      
      // Test Duplicate
      await jobCard.locator('[data-test="job-menu-button"]').click();
      await page.click('[data-test="duplicate-job"]');
      await expect(page.locator('[data-test="duplicate-job-modal"]')).toBeVisible();
      await page.click('[data-test="close-modal"]');
      
      // Test Delete
      await jobCard.locator('[data-test="job-menu-button"]').click();
      await page.click('[data-test="delete-job"]');
      await expect(page.locator('[data-test="confirm-delete-modal"]')).toBeVisible();
      await page.click('[data-test="cancel-delete"]');
    });

    test('should test grid view pipeline display', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs`);
      await page.click('[data-test="view-grid"]');
      
      // Grid cards should show vertical pipeline
      const gridCard = page.locator('[data-test="job-card"]').first();
      await expect(gridCard.locator('[data-test="pipeline-kanban"]')).toBeVisible();
      
      // Check pipeline stages
      const stages = ['sourced', 'screened', 'interview', 'offer', 'hired'];
      for (const stage of stages) {
        await expect(gridCard.locator(`[data-test="stage-${stage}"]`)).toBeVisible();
      }
      
      // Check candidate chips in stages
      await expect(gridCard.locator('[data-test="candidate-chip"]').first()).toBeVisible();
    });

    test('should test group by client view functionality', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs`);
      await page.click('[data-test="view-client"]');
      
      // Check client sections
      await expect(page.locator('[data-test="client-section"]')).toHaveCount(await page.locator('[data-test="client-section"]').count());
      
      // Check each client section has jobs
      const clientSections = page.locator('[data-test="client-section"]');
      for (let i = 0; i < await clientSections.count(); i++) {
        const section = clientSections.nth(i);
        await expect(section.locator('[data-test="client-name"]')).toBeVisible();
        await expect(section.locator('[data-test="job-count"]')).toBeVisible();
        await expect(section.locator('[data-test="job-card"]').first()).toBeVisible();
      }
      
      // Test expand/collapse in client view
      const firstSection = clientSections.first();
      await firstSection.locator('[data-test="toggle-view-all"]').click();
      await expect(firstSection.locator('[data-test="expanded-info"]').first()).toBeVisible();
    });

    test('should verify blue bracket on all job cards', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs`);
      
      // Check in all views
      const views = ['list', 'grid', 'client'];
      for (const view of views) {
        await page.click(`[data-test="view-${view}"]`);
        const cards = page.locator('[data-test="job-card"]');
        for (let i = 0; i < Math.min(3, await cards.count()); i++) {
          await expect(cards.nth(i)).toHaveClass(/border-l-4.*border-l-primary-500/);
        }
      }
    });
  });

  test.describe('4. Candidates - Complete Flow', () => {
    test('should test manual candidate creation', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      
      // Click create button
      await page.click('[data-test="create-candidate-btn"]');
      
      // Fill all fields
      await page.fill('[data-test="candidate-firstname"]', 'John');
      await page.fill('[data-test="candidate-lastname"]', 'Doe');
      await page.fill('[data-test="candidate-email"]', `john.doe${Date.now()}@test.com`);
      await page.fill('[data-test="candidate-phone"]', '+1234567890');
      await page.fill('[data-test="candidate-title"]', 'Senior Developer');
      await page.fill('[data-test="candidate-location"]', 'San Francisco, CA');
      await page.fill('[data-test="candidate-experience"]', '8');
      await page.fill('[data-test="candidate-summary"]', 'Experienced developer with strong skills');
      
      // Add skills
      const skills = ['JavaScript', 'React', 'Node.js', 'TypeScript'];
      for (const skill of skills) {
        await page.fill('[data-test="candidate-skill-input"]', skill);
        await page.keyboard.press('Enter');
      }
      
      // Add languages
      await page.click('[data-test="add-language"]');
      await page.selectOption('[data-test="language-select"]', 'English');
      await page.selectOption('[data-test="language-level"]', 'Native');
      
      // Save
      await page.click('[data-test="save-candidate-btn"]');
      
      // Verify success
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      await expect(page.locator('text=John Doe')).toBeVisible();
    });

    test('should test CV upload and parsing', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      
      // Click upload CV
      await page.click('[data-test="upload-cv-btn"]');
      
      // Upload file
      const cvContent = `
        Jane Smith
        Senior Software Engineer
        jane.smith@email.com | +1-555-123-4567
        
        SUMMARY
        10+ years of experience in full-stack development
        
        SKILLS
        Python, Django, React, PostgreSQL, AWS
        
        EXPERIENCE
        Tech Corp (2020-Present)
        Senior Software Engineer
        - Led team of 5 developers
        - Implemented microservices architecture
      `;
      
      await page.setInputFiles('[data-test="cv-file-input"]', {
        name: 'cv-test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(cvContent)
      });
      
      // Submit
      await page.click('[data-test="upload-cv-submit"]');
      
      // Wait for parsing
      await expect(page.locator('[data-test="parsing-progress"]')).toBeVisible();
      await expect(page.locator('[data-test="upload-success"]')).toBeVisible({ timeout: 30000 });
      
      // Verify candidate created
      await expect(page.locator('text=Jane Smith')).toBeVisible();
    });

    test('should test candidate search and filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      
      // Vector search
      await page.fill('[data-test="search-input"]', 'React developer with TypeScript');
      await page.waitForTimeout(1000); // Debounce
      
      // Verify search results
      await expect(page.locator('[data-test="search-indicator"]')).toBeVisible();
      await expect(page.locator('[data-test="candidate-card"]').first()).toBeVisible();
      
      // Test filters
      await page.click('[data-test="filter-button"]');
      
      // Experience filter
      await page.fill('[data-test="filter-experience-min"]', '5');
      await page.fill('[data-test="filter-experience-max"]', '10');
      
      // Location filter
      await page.fill('[data-test="filter-location"]', 'San Francisco');
      
      // Skills filter
      await page.fill('[data-test="filter-skills"]', 'React');
      await page.keyboard.press('Enter');
      
      // Apply filters
      await page.click('[data-test="apply-filters"]');
      
      // Verify filtered results
      await expect(page.locator('[data-test="filter-badge"]')).toBeVisible();
    });

    test('should test candidate profile modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      
      // Click on candidate card
      await page.click('[data-test="candidate-card"]', { position: { x: 10, y: 10 } });
      
      // Verify modal opens
      await expect(page.locator('[data-test="candidate-profile-modal"]')).toBeVisible();
      
      // Check all tabs
      const tabs = ['overview', 'experience', 'skills', 'documents', 'notes', 'activity'];
      for (const tab of tabs) {
        await page.click(`[data-test="tab-${tab}"]`);
        await expect(page.locator(`[data-test="${tab}-content"]`)).toBeVisible();
      }
      
      // Test edit mode
      await page.click('[data-test="edit-candidate"]');
      await expect(page.locator('[data-test="edit-form"]')).toBeVisible();
      
      // Cancel edit
      await page.click('[data-test="cancel-edit"]');
      
      // Close modal
      await page.click('[data-test="close-modal"]');
    });
  });

  test.describe('5. Document Generation & Templates', () => {
    test('should test CV/Resume generation', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      await page.click('[data-test="candidate-card"]').first();
      
      // Open documents tab
      await page.click('[data-test="tab-documents"]');
      
      // Generate CV
      await page.click('[data-test="generate-cv"]');
      
      // Select template
      await page.selectOption('[data-test="cv-template"]', 'modern');
      
      // Select format
      await page.click('[data-test="format-pdf"]');
      
      // Customize sections
      await page.uncheck('[data-test="include-photo"]');
      await page.check('[data-test="include-references"]');
      
      // Generate
      await page.click('[data-test="generate-btn"]');
      
      // Wait for generation
      await expect(page.locator('[data-test="generation-progress"]')).toBeVisible();
      await expect(page.locator('[data-test="download-cv"]')).toBeVisible({ timeout: 20000 });
    });

    test('should test competence file generation', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      await page.click('[data-test="candidate-card"]').first();
      
      // Generate competence file
      await page.click('[data-test="generate-competence-file"]');
      
      // Select template
      await page.selectOption('[data-test="template-select"]', 'antaes');
      
      // Configure options
      await page.check('[data-test="include-certifications"]');
      await page.check('[data-test="include-projects"]');
      
      // Select language
      await page.selectOption('[data-test="language-select"]', 'en');
      
      // Generate
      await page.click('[data-test="generate-btn"]');
      
      // Wait for generation
      await expect(page.locator('[data-test="generation-status"]')).toBeVisible();
      await expect(page.locator('[data-test="download-competence-file"]')).toBeVisible({ timeout: 30000 });
      
      // Test download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-test="download-competence-file"]')
      ]);
      
      expect(download.suggestedFilename()).toContain('competence');
    });
  });

  test.describe('6. AI Features & Copilot', () => {
    test('should test AI job parsing', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs/new`);
      
      const jobDescription = `
        Senior Full Stack Engineer
        Location: Remote (US timezone)
        Salary: $150k-$200k + equity
        
        We're looking for an experienced engineer to join our team.
        
        Requirements:
        - 7+ years of software development experience
        - Expert in React, Node.js, and TypeScript
        - Experience with AWS and microservices
        - Strong communication skills
        
        Nice to have:
        - Python experience
        - Machine learning knowledge
        - Open source contributions
      `;
      
      // Paste job description
      await page.fill('[data-test="job-description-input"]', jobDescription);
      
      // Click AI parse
      await page.click('[data-test="ai-parse-button"]');
      
      // Wait for parsing
      await expect(page.locator('[data-test="ai-parsing"]')).toBeVisible();
      await expect(page.locator('[data-test="parsing-complete"]')).toBeVisible({ timeout: 15000 });
      
      // Verify fields populated
      await expect(page.locator('[data-test="job-title"]')).toHaveValue('Senior Full Stack Engineer');
      await expect(page.locator('[data-test="job-location"]')).toHaveValue('Remote (US timezone)');
      await expect(page.locator('[data-test="job-salary-min"]')).toHaveValue('150000');
      await expect(page.locator('[data-test="job-salary-max"]')).toHaveValue('200000');
      
      // Verify requirements extracted
      const requirements = page.locator('[data-test="requirement-item"]');
      await expect(requirements).toHaveCount(4);
    });

    test('should test AI candidate matching', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs`);
      await page.click('[data-test="job-card"]').first();
      
      // Click AI match
      await page.click('[data-test="ai-match-candidates"]');
      
      // Configure matching
      await page.fill('[data-test="match-threshold"]', '80');
      await page.check('[data-test="include-passive"]');
      
      // Run matching
      await page.click('[data-test="run-matching"]');
      
      // Wait for results
      await expect(page.locator('[data-test="matching-progress"]')).toBeVisible();
      await expect(page.locator('[data-test="match-results"]')).toBeVisible({ timeout: 20000 });
      
      // Verify results
      const matches = page.locator('[data-test="candidate-match"]');
      await expect(matches.first()).toBeVisible();
      
      // Check match score
      await expect(matches.first().locator('[data-test="match-score"]')).toBeVisible();
      
      // Add top match to pipeline
      await matches.first().locator('[data-test="add-to-pipeline"]').click();
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
    });

    test('should test AI screening questions', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs`);
      await page.click('[data-test="job-card"]').first();
      
      // Generate screening questions
      await page.click('[data-test="generate-screening"]');
      
      // Wait for AI generation
      await expect(page.locator('[data-test="generating-questions"]')).toBeVisible();
      await expect(page.locator('[data-test="questions-generated"]')).toBeVisible({ timeout: 15000 });
      
      // Review questions
      const questions = page.locator('[data-test="screening-question"]');
      await expect(questions).toHaveCount(await questions.count());
      
      // Edit a question
      await questions.first().locator('[data-test="edit-question"]').click();
      await page.fill('[data-test="question-text"]', 'Updated screening question');
      await page.click('[data-test="save-question"]');
      
      // Save all questions
      await page.click('[data-test="save-screening-questions"]');
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
    });
  });

  test.describe('7. Pipeline & Kanban Management', () => {
    test('should test complete pipeline workflow', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs`);
      await page.click('[data-test="job-card"]').first();
      
      // Add candidate to pipeline
      await page.click('[data-test="add-candidate-button"]');
      await page.click('[data-test="existing-candidate-tab"]');
      await page.click('[data-test="candidate-checkbox"]').first();
      await page.click('[data-test="add-to-job-button"]');
      
      // Verify candidate in Sourced stage
      const sourcedStage = page.locator('[data-test="pipeline-stage"]:has-text("Sourced")');
      await expect(sourcedStage.locator('[data-test="candidate-card"]')).toBeVisible();
      
      // Drag through pipeline stages
      const candidateCard = sourcedStage.locator('[data-test="candidate-card"]').first();
      const stages = ['Screened', 'Interview', 'Offer', 'Hired'];
      
      for (const stageName of stages) {
        const targetStage = page.locator(`[data-test="pipeline-stage"]:has-text("${stageName}")`);
        await candidateCard.dragTo(targetStage);
        await page.waitForTimeout(500); // Wait for update
        
        // Verify moved
        await expect(targetStage.locator('[data-test="candidate-card"]')).toBeVisible();
        
        // Update status notes
        await candidateCard.click();
        await page.fill('[data-test="stage-notes"]', `Moved to ${stageName}`);
        await page.click('[data-test="save-notes"]');
      }
      
      // Verify in Hired stage
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Hired")').locator('[data-test="candidate-card"]')).toBeVisible();
    });

    test('should test pipeline filters and search', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs`);
      await page.click('[data-test="job-card"]').first();
      
      // Search in pipeline
      await page.fill('[data-test="pipeline-search"]', 'John');
      await page.waitForTimeout(500);
      
      // Filter by stage
      await page.click('[data-test="stage-filter"]');
      await page.click('[data-test="filter-interview"]');
      
      // Verify filtered view
      await expect(page.locator('[data-test="filtered-indicator"]')).toBeVisible();
    });
  });

  test.describe('8. Search Functionality', () => {
    test('should test global search', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      
      // Perform search
      await page.fill('[data-test="global-search"]', 'Senior React Developer Remote');
      await page.click('[data-test="search-btn"]');
      
      // Wait for results
      await expect(page.locator('[data-test="search-results"]')).toBeVisible();
      
      // Check all result sections
      await expect(page.locator('[data-test="candidates-results"]')).toBeVisible();
      await expect(page.locator('[data-test="jobs-results"]')).toBeVisible();
      await expect(page.locator('[data-test="projects-results"]')).toBeVisible();
      
      // Test result interaction
      await page.click('[data-test="candidate-result"]').first();
      await expect(page.locator('[data-test="candidate-profile-modal"]')).toBeVisible();
      await page.click('[data-test="close-modal"]');
      
      // Test filters
      await page.click('[data-test="search-filters"]');
      await page.check('[data-test="filter-candidates-only"]');
      await page.click('[data-test="apply-search-filters"]');
      
      // Verify filtered results
      await expect(page.locator('[data-test="jobs-results"]')).not.toBeVisible();
    });

    test('should test advanced search', async ({ page }) => {
      await page.goto(`${BASE_URL}/search/advanced`);
      
      // Configure advanced search
      await page.selectOption('[data-test="search-type"]', 'candidates');
      await page.fill('[data-test="skills-must-have"]', 'React, TypeScript');
      await page.fill('[data-test="skills-nice-to-have"]', 'Python, AWS');
      await page.fill('[data-test="experience-min"]', '5');
      await page.fill('[data-test="location-radius"]', '50');
      await page.fill('[data-test="location-center"]', 'San Francisco, CA');
      
      // Run search
      await page.click('[data-test="run-advanced-search"]');
      
      // Verify results
      await expect(page.locator('[data-test="advanced-results"]')).toBeVisible();
      await expect(page.locator('[data-test="result-score"]').first()).toBeVisible();
    });
  });

  test.describe('9. Projects & Clients', () => {
    test('should test client creation and management', async ({ page }) => {
      await page.goto(`${BASE_URL}/clients`);
      
      // Create client
      await page.click('[data-test="create-client-btn"]');
      
      // Fill client details
      await page.fill('[data-test="client-name"]', 'Test Corp Inc');
      await page.fill('[data-test="client-website"]', 'https://testcorp.com');
      await page.fill('[data-test="client-industry"]', 'Technology');
      await page.fill('[data-test="client-size"]', '500-1000');
      
      // Add contact
      await page.click('[data-test="add-contact"]');
      await page.fill('[data-test="contact-name"]', 'John Smith');
      await page.fill('[data-test="contact-email"]', 'john@testcorp.com');
      await page.fill('[data-test="contact-phone"]', '+1234567890');
      await page.selectOption('[data-test="contact-role"]', 'Hiring Manager');
      
      // Save
      await page.click('[data-test="save-client-btn"]');
      
      // Verify created
      await expect(page.locator('text=Test Corp Inc')).toBeVisible();
    });

    test('should test project creation and tracking', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects`);
      
      // Create project
      await page.click('[data-test="create-project-btn"]');
      
      // Fill project details
      await page.fill('[data-test="project-name"]', 'Q1 Engineering Hiring');
      await page.selectOption('[data-test="project-client"]', { index: 1 });
      await page.fill('[data-test="project-start-date"]', '2024-01-01');
      await page.fill('[data-test="project-end-date"]', '2024-03-31');
      await page.fill('[data-test="project-positions"]', '10');
      await page.fill('[data-test="project-budget"]', '1000000');
      
      // Add milestones
      await page.click('[data-test="add-milestone"]');
      await page.fill('[data-test="milestone-name"]', 'First 5 hires');
      await page.fill('[data-test="milestone-date"]', '2024-02-01');
      
      // Save
      await page.click('[data-test="save-project-btn"]');
      
      // Verify created
      await expect(page.locator('text=Q1 Engineering Hiring')).toBeVisible();
    });

    test('should test project dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects`);
      await page.click('[data-test="project-card"]').first();
      
      // Check dashboard sections
      await expect(page.locator('[data-test="project-overview"]')).toBeVisible();
      await expect(page.locator('[data-test="project-timeline"]')).toBeVisible();
      await expect(page.locator('[data-test="project-jobs"]')).toBeVisible();
      await expect(page.locator('[data-test="project-metrics"]')).toBeVisible();
      
      // Add job to project
      await page.click('[data-test="add-job-to-project"]');
      await page.click('[data-test="job-checkbox"]').first();
      await page.click('[data-test="add-selected-jobs"]');
      
      // Verify job added
      await expect(page.locator('[data-test="project-job-card"]')).toBeVisible();
    });
  });

  test.describe('10. Reports & Analytics', () => {
    test('should test report generation', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      
      // Generate recruitment report
      await page.click('[data-test="new-report"]');
      await page.selectOption('[data-test="report-type"]', 'recruitment-metrics');
      await page.fill('[data-test="report-period-start"]', '2024-01-01');
      await page.fill('[data-test="report-period-end"]', '2024-12-31');
      
      // Configure report
      await page.check('[data-test="include-pipeline-metrics"]');
      await page.check('[data-test="include-source-analysis"]');
      await page.check('[data-test="include-time-to-hire"]');
      
      // Generate
      await page.click('[data-test="generate-report"]');
      
      // Wait for generation
      await expect(page.locator('[data-test="report-generating"]')).toBeVisible();
      await expect(page.locator('[data-test="report-ready"]')).toBeVisible({ timeout: 20000 });
      
      // View report
      await page.click('[data-test="view-report"]');
      await expect(page.locator('[data-test="report-viewer"]')).toBeVisible();
      
      // Export report
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-test="export-pdf"]')
      ]);
      
      expect(download.suggestedFilename()).toContain('recruitment-report');
    });

    test('should test dashboard analytics', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Check all widgets
      await expect(page.locator('[data-test="active-jobs-widget"]')).toBeVisible();
      await expect(page.locator('[data-test="candidates-widget"]')).toBeVisible();
      await expect(page.locator('[data-test="pipeline-widget"]')).toBeVisible();
      await expect(page.locator('[data-test="metrics-widget"]')).toBeVisible();
      
      // Test date range filter
      await page.click('[data-test="date-range"]');
      await page.click('[data-test="last-30-days"]');
      
      // Verify data updates
      await expect(page.locator('[data-test="loading-indicator"]')).toBeVisible();
      await expect(page.locator('[data-test="loading-indicator"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('11. Settings & Configuration', () => {
    test('should test user settings', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      
      // Profile settings
      await page.click('[data-test="tab-profile"]');
      await page.fill('[data-test="user-name"]', 'Test User Updated');
      await page.fill('[data-test="user-title"]', 'Senior Recruiter');
      await page.click('[data-test="save-profile"]');
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      
      // Notification settings
      await page.click('[data-test="tab-notifications"]');
      await page.check('[data-test="email-new-candidates"]');
      await page.uncheck('[data-test="email-daily-summary"]');
      await page.click('[data-test="save-notifications"]');
      
      // Email templates
      await page.click('[data-test="tab-templates"]');
      await page.click('[data-test="edit-template"]').first();
      await page.fill('[data-test="template-subject"]', 'Updated Subject Line');
      await page.click('[data-test="save-template"]');
    });

    test('should test team management', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings/team`);
      
      // Invite team member
      await page.click('[data-test="invite-member"]');
      await page.fill('[data-test="invite-email"]', 'newmember@company.com');
      await page.selectOption('[data-test="invite-role"]', 'recruiter');
      await page.click('[data-test="send-invite"]');
      
      // Verify invite sent
      await expect(page.locator('[data-test="invite-sent"]')).toBeVisible();
      
      // Manage permissions
      await page.click('[data-test="team-member"]').first();
      await page.click('[data-test="edit-permissions"]');
      await page.check('[data-test="permission-view-candidates"]');
      await page.check('[data-test="permission-edit-jobs"]');
      await page.uncheck('[data-test="permission-delete-data"]');
      await page.click('[data-test="save-permissions"]');
    });
  });

  test.describe('12. Integrations', () => {
    test('should test email integration', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings/integrations`);
      
      // Configure email
      await page.click('[data-test="configure-email"]');
      await page.selectOption('[data-test="email-provider"]', 'gmail');
      await page.click('[data-test="connect-gmail"]');
      
      // Mock OAuth flow
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-test="email-connected"]')).toBeVisible();
      
      // Test email sync
      await page.click('[data-test="sync-emails"]');
      await expect(page.locator('[data-test="sync-progress"]')).toBeVisible();
      await expect(page.locator('[data-test="sync-complete"]')).toBeVisible({ timeout: 10000 });
    });

    test('should test calendar integration', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings/integrations`);
      
      // Configure calendar
      await page.click('[data-test="configure-calendar"]');
      await page.selectOption('[data-test="calendar-provider"]', 'google');
      await page.click('[data-test="connect-calendar"]');
      
      // Mock OAuth flow
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-test="calendar-connected"]')).toBeVisible();
      
      // Schedule interview
      await page.goto(`${BASE_URL}/jobs`);
      await page.click('[data-test="job-card"]').first();
      await page.click('[data-test="candidate-card"]').first();
      await page.click('[data-test="schedule-interview"]');
      
      // Fill interview details
      await page.fill('[data-test="interview-date"]', '2024-02-01');
      await page.fill('[data-test="interview-time"]', '14:00');
      await page.fill('[data-test="interview-duration"]', '60');
      await page.selectOption('[data-test="interview-type"]', 'technical');
      
      // Send invite
      await page.click('[data-test="send-calendar-invite"]');
      await expect(page.locator('[data-test="invite-sent"]')).toBeVisible();
    });
  });

  test.describe('13. Error Handling & Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Go offline
      await page.context().setOffline(true);
      
      // Try to save
      await page.goto(`${BASE_URL}/candidates`);
      await page.click('[data-test="create-candidate-btn"]');
      await page.fill('[data-test="candidate-firstname"]', 'Test');
      await page.click('[data-test="save-candidate-btn"]');
      
      // Should show error
      await expect(page.locator('[data-test="error-message"]')).toBeVisible();
      await expect(page.locator('text=Network error')).toBeVisible();
      
      // Go back online
      await page.context().setOffline(false);
      
      // Retry should work
      await page.click('[data-test="retry-button"]');
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
    });

    test('should handle validation errors', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs/new`);
      
      // Try to save without required fields
      await page.click('[data-test="publish-job"]');
      
      // Check validation messages
      await expect(page.locator('[data-test="error-title"]')).toBeVisible();
      await expect(page.locator('[data-test="error-description"]')).toBeVisible();
      await expect(page.locator('[data-test="error-location"]')).toBeVisible();
    });

    test('should handle large data sets', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      
      // Should virtualize list
      const visibleCards = await page.locator('[data-test="candidate-card"]').count();
      const totalCount = await page.locator('[data-test="total-count"]').textContent();
      
      if (parseInt(totalCount || '0') > 50) {
        expect(visibleCards).toBeLessThan(50); // Virtualization active
      }
      
      // Test infinite scroll
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // More items should load
      const newCount = await page.locator('[data-test="candidate-card"]').count();
      expect(newCount).toBeGreaterThan(visibleCards);
    });

    test('should handle concurrent updates', async ({ page, context }) => {
      // Open two tabs
      const page2 = await context.newPage();
      
      // Both edit same job
      await page.goto(`${BASE_URL}/jobs`);
      await page2.goto(`${BASE_URL}/jobs`);
      
      const jobCard = '[data-test="job-card"]:first-child';
      
      // Edit in first tab
      await page.click(`${jobCard} [data-test="edit-job"]`);
      await page.fill('[data-test="job-title"]', 'Updated by Tab 1');
      
      // Edit in second tab
      await page2.click(`${jobCard} [data-test="edit-job"]`);
      await page2.fill('[data-test="job-title"]', 'Updated by Tab 2');
      
      // Save both
      await page.click('[data-test="save-job"]');
      await page2.click('[data-test="save-job"]');
      
      // Second should show conflict
      await expect(page2.locator('[data-test="conflict-error"]')).toBeVisible();
      
      // Close tabs
      await page2.close();
    });
  });

  test.describe('14. Performance & Optimization', () => {
    test('should load pages within performance budget', async ({ page }) => {
      const pages = [
        { url: '/dashboard', maxTime: 2000 },
        { url: '/jobs', maxTime: 2500 },
        { url: '/candidates', maxTime: 3000 },
        { url: '/search', maxTime: 2000 }
      ];
      
      for (const pageTest of pages) {
        const startTime = Date.now();
        await page.goto(`${BASE_URL}${pageTest.url}`);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(pageTest.maxTime);
      }
    });

    test('should handle search efficiently', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      
      // Type search query
      const searchInput = page.locator('[data-test="search-input"]');
      await searchInput.fill('React developer with 5 years experience');
      
      // Should debounce (not search immediately)
      await page.waitForTimeout(300);
      await expect(page.locator('[data-test="search-indicator"]')).not.toBeVisible();
      
      // Should search after debounce
      await page.waitForTimeout(800);
      await expect(page.locator('[data-test="search-indicator"]')).toBeVisible();
    });
  });

  test.describe('15. Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(`${BASE_URL}/jobs`);
      
      // Tab through interface
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Navigate to create button
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Activate with Enter
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-test="create-job-modal"]')).toBeVisible();
      
      // Escape to close
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-test="create-job-modal"]')).not.toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      
      // Check main navigation
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
      
      // Check buttons have labels
      const createButton = page.locator('[data-test="create-candidate-btn"]');
      await expect(createButton).toHaveAttribute('aria-label', /create|add/i);
      
      // Check form inputs
      await createButton.click();
      const firstNameInput = page.locator('[data-test="candidate-firstname"]');
      await expect(firstNameInput).toHaveAttribute('aria-label', /first name/i);
    });
  });

  test.describe('16. Data Export & Import', () => {
    test('should export candidates to CSV', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      
      // Select candidates
      await page.click('[data-test="select-all-checkbox"]');
      
      // Export
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-test="export-csv"]')
      ]);
      
      expect(download.suggestedFilename()).toContain('candidates');
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should import candidates from file', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      
      // Click import
      await page.click('[data-test="import-candidates"]');
      
      // Upload file
      const csvContent = `First Name,Last Name,Email,Phone,Title
John,Import,john.import@test.com,+1234567890,Developer
Jane,Import,jane.import@test.com,+0987654321,Designer`;
      
      await page.setInputFiles('[data-test="import-file"]', {
        name: 'candidates.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      });
      
      // Preview import
      await page.click('[data-test="preview-import"]');
      await expect(page.locator('[data-test="import-preview"]')).toBeVisible();
      await expect(page.locator('text=John Import')).toBeVisible();
      
      // Confirm import
      await page.click('[data-test="confirm-import"]');
      await expect(page.locator('[data-test="import-progress"]')).toBeVisible();
      await expect(page.locator('[data-test="import-complete"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('17. Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // iPhone 12 Pro viewport
      await page.setViewportSize({ width: 390, height: 844 });
      
      await page.goto(`${BASE_URL}/jobs`);
      
      // Mobile menu should work
      await page.click('[data-test="mobile-menu-button"]');
      await expect(page.locator('[data-test="mobile-nav"]')).toBeVisible();
      
      // Cards should stack vertically
      const jobsContainer = page.locator('[data-test="jobs-container"]');
      await expect(jobsContainer).toHaveCSS('flex-direction', 'column');
      
      // Test swipe actions
      const jobCard = page.locator('[data-test="job-card"]').first();
      await jobCard.swipe({ direction: 'left', distance: 100 });
      await expect(page.locator('[data-test="swipe-actions"]')).toBeVisible();
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });

  test.describe('18. Browser Extension', () => {
    test('should test LinkedIn integration', async ({ page, context }) => {
      // Note: This is a simplified test as we can't actually install extensions in Playwright
      // In real testing, you'd use a browser with the extension pre-installed
      
      await page.goto(`${BASE_URL}/settings/integrations`);
      
      // Check extension status
      await expect(page.locator('[data-test="extension-status"]')).toBeVisible();
      
      // Download extension
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-test="download-extension"]')
      ]);
      
      expect(download.suggestedFilename()).toContain('emineon-extension');
    });
  });

  test.describe('19. Outlook Add-in', () => {
    test('should test Outlook add-in configuration', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings/integrations`);
      
      // Configure Outlook
      await page.click('[data-test="configure-outlook"]');
      
      // Get manifest URL
      const manifestUrl = await page.locator('[data-test="manifest-url"]').textContent();
      expect(manifestUrl).toContain('outlook-addin-manifest.xml');
      
      // Copy manifest URL
      await page.click('[data-test="copy-manifest-url"]');
      await expect(page.locator('[data-test="copied-indicator"]')).toBeVisible();
    });
  });

  test.describe('20. Queue System & Background Jobs', () => {
    test('should test competence file generation queue', async ({ page }) => {
      await page.goto(`${BASE_URL}/candidates`);
      
      // Generate multiple competence files
      for (let i = 0; i < 3; i++) {
        await page.click(`[data-test="candidate-card"]:nth-child(${i + 1})`);
        await page.click('[data-test="generate-competence-file"]');
        await page.selectOption('[data-test="template-select"]', 'antaes');
        await page.click('[data-test="generate-btn"]');
        await page.click('[data-test="close-modal"]');
      }
      
      // Check queue status
      await page.goto(`${BASE_URL}/settings/queue`);
      await expect(page.locator('[data-test="queue-items"]')).toBeVisible();
      await expect(page.locator('[data-test="queue-item"]')).toHaveCount(3);
      
      // Wait for processing
      await page.waitForTimeout(5000);
      await page.reload();
      
      // Check completed
      await expect(page.locator('[data-test="queue-item-completed"]')).toHaveCount(3);
    });
  });

  test.describe('21. Data Integrity & Consistency', () => {
    test('should maintain referential integrity', async ({ page }) => {
      // Create job
      await page.goto(`${BASE_URL}/jobs/new`);
      const jobTitle = `Integrity Test Job ${Date.now()}`;
      await page.fill('[data-test="job-title"]', jobTitle);
      await page.fill('[data-test="job-description"]', 'Test description');
      await page.fill('[data-test="job-location"]', 'Test Location');
      await page.click('[data-test="publish-job"]');
      
      // Add candidate to job
      await page.goto(`${BASE_URL}/jobs`);
      await page.click(`text=${jobTitle}`);
      await page.click('[data-test="add-candidate-button"]');
      await page.click('[data-test="existing-candidate-tab"]');
      await page.click('[data-test="candidate-checkbox"]').first();
      await page.click('[data-test="add-to-job-button"]');
      
      // Delete job
      await page.goto(`${BASE_URL}/jobs`);
      await page.click(`[data-test="job-card"]:has-text("${jobTitle}") [data-test="delete-job"]`);
      await page.click('[data-test="confirm-delete"]');
      
      // Verify candidate still exists but not linked to deleted job
      await page.goto(`${BASE_URL}/candidates`);
      await page.click('[data-test="candidate-card"]').first();
      await page.click('[data-test="tab-activity"]');
      await expect(page.locator(`text=${jobTitle}`)).not.toBeVisible();
    });
  });

  test.describe('22. Full Workflow Tests', () => {
    test('should complete end-to-end recruitment workflow', async ({ page }) => {
      // 1. Create client
      await page.goto(`${BASE_URL}/clients`);
      await page.click('[data-test="create-client-btn"]');
      await page.fill('[data-test="client-name"]', 'E2E Test Client');
      await page.click('[data-test="save-client-btn"]');
      
      // 2. Create project
      await page.goto(`${BASE_URL}/projects`);
      await page.click('[data-test="create-project-btn"]');
      await page.fill('[data-test="project-name"]', 'E2E Test Project');
      await page.selectOption('[data-test="project-client"]', 'E2E Test Client');
      await page.click('[data-test="save-project-btn"]');
      
      // 3. Create job
      await page.goto(`${BASE_URL}/jobs/new`);
      await page.fill('[data-test="job-title"]', 'E2E Test Position');
      await page.fill('[data-test="job-description"]', 'Full stack developer needed');
      await page.fill('[data-test="job-location"]', 'Remote');
      await page.selectOption('[data-test="job-client"]', 'E2E Test Client');
      await page.selectOption('[data-test="job-project"]', 'E2E Test Project');
      await page.click('[data-test="publish-job"]');
      
      // 4. Upload candidate CV
      await page.goto(`${BASE_URL}/candidates`);
      await page.click('[data-test="upload-cv-btn"]');
      const cvContent = `
        E2E Test Candidate
        Full Stack Developer
        e2e.test@example.com
        
        10 years experience in React and Node.js
      `;
      await page.setInputFiles('[data-test="cv-file-input"]', {
        name: 'e2e-cv.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(cvContent)
      });
      await page.click('[data-test="upload-cv-submit"]');
      await page.waitForSelector('[data-test="upload-success"]', { timeout: 30000 });
      
      // 5. Match candidate to job
      await page.goto(`${BASE_URL}/jobs`);
      await page.click('text=E2E Test Position');
      await page.click('[data-test="ai-match-candidates"]');
      await page.click('[data-test="run-matching"]');
      await page.waitForSelector('[data-test="match-results"]', { timeout: 20000 });
      
      // 6. Add to pipeline
      await page.click('[data-test="candidate-match"]').first().locator('[data-test="add-to-pipeline"]');
      
      // 7. Move through stages
      const stages = ['Screened', 'Interview', 'Offer'];
      for (const stage of stages) {
        const candidateCard = page.locator('[data-test="candidate-card"]').first();
        const targetStage = page.locator(`[data-test="pipeline-stage"]:has-text("${stage}")`);
        await candidateCard.dragTo(targetStage);
        await page.waitForTimeout(500);
      }
      
      // 8. Generate competence file
      await page.click('[data-test="candidate-card"]').first();
      await page.click('[data-test="generate-competence-file"]');
      await page.selectOption('[data-test="template-select"]', 'antaes');
      await page.click('[data-test="generate-btn"]');
      await page.waitForSelector('[data-test="download-competence-file"]', { timeout: 30000 });
      
      // 9. Hire candidate
      await page.click('[data-test="close-modal"]');
      const candidateCard = page.locator('[data-test="candidate-card"]').first();
      const hiredStage = page.locator('[data-test="pipeline-stage"]:has-text("Hired")');
      await candidateCard.dragTo(hiredStage);
      
      // 10. Close job as won
      await page.click('[data-test="set-outcome-button"]');
      await page.click('[data-test="outcome-won"]');
      await page.fill('[data-test="close-notes"]', 'Successfully hired E2E test candidate');
      await page.click('[data-test="confirm-close"]');
      
      // Verify success
      await expect(page.locator('text=Congratulations')).toBeVisible();
    });
  });
});
