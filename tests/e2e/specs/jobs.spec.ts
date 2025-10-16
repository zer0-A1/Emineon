import { test, expect } from '@playwright/test';
import { mockAuthentication, waitForApp } from '../helpers/auth';
import { seedTestJobs, seedTestCandidates } from '../helpers/test-user-pg';

test.describe('Jobs Management', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await page.goto('/jobs');
    await waitForApp(page);
  });

  test.describe('Create Job', () => {
    test('should create a new job manually', async ({ page }) => {
      // Click create job button
      await page.click('[data-test="create-job-button"]');
      
      // Wait for modal
      await page.waitForSelector('[data-test="create-job-modal"]');
      
      // Fill in job details
      await page.fill('[data-test="job-title"]', 'Senior React Developer');
      await page.fill('[data-test="job-description"]', 'We are looking for an experienced React developer...');
      await page.fill('[data-test="job-location"]', 'Remote');
      await page.fill('[data-test="job-salary"]', '$120k - $150k');
      
      // Select employment type
      await page.click('[data-test="employment-type-select"]');
      await page.click('[data-test="employment-type-fulltime"]');
      
      // Set urgency
      await page.click('[data-test="urgency-select"]');
      await page.click('[data-test="urgency-high"]');
      
      // Configure pipeline stages
      await page.click('[data-test="add-stage-button"]');
      await page.fill('[data-test="new-stage-input"]', 'Technical Interview');
      await page.keyboard.press('Enter');
      
      // Set SLA
      await page.fill('[data-test="sla-days"]', '30');
      
      // Submit
      await page.click('[data-test="publish-job"]');
      
      // Verify success
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      
      // Verify job appears in list
      await page.goto('/jobs');
      await expect(page.locator('text=Senior React Developer')).toBeVisible();
    });

    test('should create job from AI parsing', async ({ page }) => {
      // Click create job button
      await page.click('[data-test="create-job-button"]');
      
      // Paste job description
      const jobDescription = `
        We are seeking a Full Stack Developer with 5+ years of experience.
        Location: New York, NY (Hybrid)
        Salary: $130,000 - $160,000
        
        Requirements:
        - Strong experience with React and Node.js
        - AWS cloud experience
        - Excellent communication skills
      `;
      
      await page.fill('[data-test="job-description-input"]', jobDescription);
      
      // Click AI parse button
      await page.click('[data-test="ai-parse-button"]');
      
      // Wait for parsing
      await expect(page.locator('[data-test="parsing-indicator"]')).toBeVisible();
      await expect(page.locator('[data-test="parsing-complete"]')).toBeVisible({ timeout: 10000 });
      
      // Verify fields populated
      await expect(page.locator('[data-test="job-title"]')).toHaveValue('Full Stack Developer');
      await expect(page.locator('[data-test="job-location"]')).toHaveValue('New York, NY (Hybrid)');
      
      // Submit
      await page.click('[data-test="publish-job"]');
      
      // Verify success
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
    });

    test('should save job as draft', async ({ page }) => {
      // Click create job button
      await page.click('[data-test="create-job-button"]');
      
      // Fill minimal details
      await page.fill('[data-test="job-title"]', 'Draft Job');
      
      // Save as draft
      await page.click('[data-test="save-draft"]');
      
      // Verify saved
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      
      // Verify appears in drafts
      await page.goto('/jobs?status=draft');
      await expect(page.locator('text=Draft Job')).toBeVisible();
      await expect(page.locator('[data-test="status-pill"]:has-text("DRAFT")')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      // Click create job button
      await page.click('[data-test="create-job-button"]');
      
      // Try to publish without required fields
      await page.click('[data-test="publish-job"]');
      
      // Check for validation errors
      await expect(page.locator('[data-test="error-title"]')).toBeVisible();
      await expect(page.locator('[data-test="error-description"]')).toBeVisible();
    });
  });

  test.describe('Read/List Jobs', () => {
    test.beforeEach(async ({ page }) => {
      // Seed test jobs
      const projectId = process.env.TEST_PROJECT_ID || '';
      await seedTestJobs(projectId, 5);
      await page.reload();
    });

    test('should display jobs list', async ({ page }) => {
      // Verify job cards visible
      await expect(page.locator('[data-test="job-card"]').first()).toBeVisible();
      
      // Verify job details shown
      await expect(page.locator('[data-test="job-title"]').first()).toBeVisible();
      await expect(page.locator('[data-test="job-location"]').first()).toBeVisible();
      await expect(page.locator('[data-test="job-status"]').first()).toBeVisible();
    });

    test('should search jobs', async ({ page }) => {
      // Search by title
      await page.fill('[data-test="search-jobs"]', 'Full Stack');
      await page.keyboard.press('Enter');
      
      // Verify filtered results
      const jobCards = page.locator('[data-test="job-card"]');
      await expect(jobCards).toHaveCount(1);
      await expect(page.locator('text=Full Stack Developer')).toBeVisible();
    });

    test('should filter by status', async ({ page }) => {
      // Click filter button
      await page.click('[data-test="filter-button"]');
      
      // Select ACTIVE status
      await page.click('[data-test="filter-status-active"]');
      
      // Apply filter
      await page.click('[data-test="apply-filters"]');
      
      // Verify only active jobs shown
      const statusPills = page.locator('[data-test="job-status"]');
      for (const pill of await statusPills.all()) {
        await expect(pill).toHaveText('ACTIVE');
      }
    });

    test('should filter by urgency', async ({ page }) => {
      // Click filter button
      await page.click('[data-test="filter-button"]');
      
      // Select HIGH urgency
      await page.click('[data-test="filter-urgency-high"]');
      
      // Apply filter
      await page.click('[data-test="apply-filters"]');
      
      // Verify only high urgency jobs shown
      await expect(page.locator('[data-test="urgency-badge"]:has-text("HIGH")')).toBeVisible();
    });

    test('should switch between grid and list view', async ({ page }) => {
      // Default is grid view
      await expect(page.locator('[data-test="jobs-grid"]')).toBeVisible();
      
      // Switch to list view
      await page.click('[data-test="view-list"]');
      
      // Verify list layout
      await expect(page.locator('[data-test="jobs-list"]')).toBeVisible();
      
      // Switch back to grid view
      await page.click('[data-test="view-grid"]');
      
      // Verify grid layout
      await expect(page.locator('[data-test="jobs-grid"]')).toBeVisible();
    });

    test('should show job pipeline stats', async ({ page }) => {
      // Verify pipeline stats visible on job cards
      await expect(page.locator('[data-test="pipeline-stats"]').first()).toBeVisible();
      
      // Click expand all to see detailed stats
      await page.click('[data-test="expand-all"]');
      
      // Verify detailed pipeline stages shown
      await expect(page.locator('[data-test="pipeline-detailed"]').first()).toBeVisible();
      await expect(page.locator('[data-test="stage-count"]').first()).toBeVisible();
    });
  });

  test.describe('Update Job', () => {
    test('should edit job details', async ({ page }) => {
      // Seed a job
      const projectId = process.env.TEST_PROJECT_ID || '';
      await seedTestJobs(projectId, 1);
      await page.reload();
      
      // Click edit on job card
      await page.click('[data-test="job-card"] [data-test="edit-job"]');
      
      // Wait for edit modal
      await page.waitForSelector('[data-test="edit-job-modal"]');
      
      // Update fields
      await page.fill('[data-test="job-title"]', 'Updated Job Title');
      await page.fill('[data-test="job-salary"]', '$140k - $180k');
      
      // Change status
      await page.click('[data-test="job-status-select"]');
      await page.click('[data-test="status-paused"]');
      
      // Save changes
      await page.click('[data-test="save-job"]');
      
      // Verify success
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      
      // Verify changes reflected
      await expect(page.locator('text=Updated Job Title')).toBeVisible();
      await expect(page.locator('[data-test="job-status"]:has-text("PAUSED")')).toBeVisible();
    });

    test('should update job urgency', async ({ page }) => {
      // Navigate to job detail
      await page.click('[data-test="job-card"]');
      
      // Wait for job detail page
      await page.waitForSelector('[data-test="job-detail"]');
      
      // Click urgency badge to edit
      await page.click('[data-test="urgency-badge"]');
      
      // Select new urgency
      await page.click('[data-test="urgency-critical"]');
      
      // Verify updated
      await expect(page.locator('[data-test="urgency-badge"]:has-text("CRITICAL")')).toBeVisible();
    });

    test('should close job with outcome', async ({ page }) => {
      // Navigate to job detail
      await page.click('[data-test="job-card"]');
      
      // Click Set Outcome button
      await page.click('[data-test="set-outcome-button"]');
      
      // Wait for close modal
      await page.waitForSelector('[data-test="close-job-modal"]');
      
      // Select Won
      await page.click('[data-test="outcome-won"]');
      
      // Select reason
      await page.selectOption('[data-test="close-reason-select"]', 'Candidate accepted offer');
      
      // Add notes
      await page.fill('[data-test="close-notes"]', 'Great match for the client');
      
      // Confirm close
      await page.click('[data-test="confirm-close"]');
      
      // Verify success message appears
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      
      // Verify congratulatory message for Won
      await expect(page.locator('text=Congratulations! Placement secured')).toBeVisible();
      
      // Verify job status updated
      await page.goto('/jobs');
      await expect(page.locator('[data-test="job-status"]:has-text("Won")')).toBeVisible();
    });
  });

  test.describe('Delete Job', () => {
    test('should delete a job with confirmation', async ({ page }) => {
      // Seed a job
      const projectId = process.env.TEST_PROJECT_ID || '';
      await seedTestJobs(projectId, 1);
      await page.reload();
      
      // Click delete on job card
      await page.click('[data-test="job-card"] [data-test="delete-job"]');
      
      // Confirm deletion in modal
      await page.waitForSelector('[data-test="confirm-delete-modal"]');
      await page.click('[data-test="confirm-delete"]');
      
      // Verify success message
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      
      // Verify job removed from list
      await expect(page.locator('[data-test="job-card"]')).toHaveCount(0);
    });
  });

  test.describe('Job Pipeline/Kanban', () => {
    test.beforeEach(async ({ page }) => {
      // Seed job and candidates
      const projectId = process.env.TEST_PROJECT_ID || '';
      const userId = process.env.TEST_USER_ID || 'test-user-playwright';
      const [job] = await seedTestJobs(projectId, 1);
      await seedTestCandidates(userId, 3);
      
      // Navigate to job detail
      await page.goto(`/jobs/${job.id}`);
      await waitForApp(page);
    });

    test('should display pipeline kanban', async ({ page }) => {
      // Verify pipeline stages
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Sourced")')).toBeVisible();
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Screened")')).toBeVisible();
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Interview")')).toBeVisible();
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Offer")')).toBeVisible();
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Hired")')).toBeVisible();
    });

    test('should add existing candidate to job', async ({ page }) => {
      // Click add candidate button
      await page.click('[data-test="add-candidate-button"]');
      
      // Select existing candidate tab
      await page.click('[data-test="existing-candidate-tab"]');
      
      // Search for candidate
      await page.fill('[data-test="search-candidates"]', 'Test1');
      
      // Select candidate
      await page.click('[data-test="candidate-checkbox"]');
      
      // Add to job
      await page.click('[data-test="add-to-job-button"]');
      
      // Verify candidate appears in pipeline
      await expect(page.locator('[data-test="candidate-card"]:has-text("Test1")')).toBeVisible();
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Sourced") [data-test="candidate-card"]')).toBeVisible();
    });

    test('should drag candidate between stages', async ({ page }) => {
      // Add a candidate first
      await page.click('[data-test="add-candidate-button"]');
      await page.click('[data-test="existing-candidate-tab"]');
      await page.click('[data-test="candidate-checkbox"]');
      await page.click('[data-test="add-to-job-button"]');
      
      // Wait for candidate to appear
      const candidateCard = page.locator('[data-test="candidate-card"]').first();
      await candidateCard.waitFor();
      
      // Drag from Sourced to Screened
      const screenedStage = page.locator('[data-test="pipeline-stage"]:has-text("Screened")');
      
      await candidateCard.dragTo(screenedStage);
      
      // Verify candidate moved
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Screened") [data-test="candidate-card"]')).toBeVisible();
    });

    test('should remove candidate from job', async ({ page }) => {
      // Add a candidate first
      await page.click('[data-test="add-candidate-button"]');
      await page.click('[data-test="existing-candidate-tab"]');
      await page.click('[data-test="candidate-checkbox"]');
      await page.click('[data-test="add-to-job-button"]');
      
      // Click remove on candidate card
      await page.click('[data-test="candidate-card"] [data-test="remove-candidate"]');
      
      // Confirm removal
      await page.click('[data-test="confirm-remove"]');
      
      // Verify candidate removed
      await expect(page.locator('[data-test="candidate-card"]')).toHaveCount(0);
    });

    test('should show candidate details drawer', async ({ page }) => {
      // Add a candidate first
      await page.click('[data-test="add-candidate-button"]');
      await page.click('[data-test="existing-candidate-tab"]');
      await page.click('[data-test="candidate-checkbox"]');
      await page.click('[data-test="add-to-job-button"]');
      
      // Click on candidate card
      await page.click('[data-test="candidate-card"]');
      
      // Verify drawer opens with details
      await expect(page.locator('[data-test="candidate-drawer"]')).toBeVisible();
      await expect(page.locator('[data-test="candidate-name"]')).toBeVisible();
      await expect(page.locator('[data-test="candidate-email"]')).toBeVisible();
      await expect(page.locator('[data-test="candidate-skills"]')).toBeVisible();
    });

    test('should filter candidates in pipeline', async ({ page }) => {
      // Add multiple candidates
      await page.click('[data-test="add-candidate-button"]');
      await page.click('[data-test="existing-candidate-tab"]');
      await page.click('[data-test="select-all-checkbox"]');
      await page.click('[data-test="add-to-job-button"]');
      
      // Filter by name
      await page.fill('[data-test="pipeline-search"]', 'Test1');
      
      // Verify filtered results
      await expect(page.locator('[data-test="candidate-card"]:visible')).toHaveCount(1);
      await expect(page.locator('[data-test="candidate-card"]:has-text("Test1")')).toBeVisible();
    });
  });

  test.describe('Job Actions', () => {
    test('should duplicate a job', async ({ page }) => {
      // Seed a job
      const projectId = process.env.TEST_PROJECT_ID || '';
      await seedTestJobs(projectId, 1);
      await page.reload();
      
      // Click duplicate on job card
      await page.click('[data-test="job-card"] [data-test="duplicate-job"]');
      
      // Verify duplicate modal
      await page.waitForSelector('[data-test="duplicate-job-modal"]');
      
      // Modify title
      await page.fill('[data-test="job-title"]', 'Copy of Full Stack Developer');
      
      // Create duplicate
      await page.click('[data-test="create-duplicate"]');
      
      // Verify success
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      
      // Verify duplicate appears
      await expect(page.locator('text=Copy of Full Stack Developer')).toBeVisible();
    });

    test('should share job posting', async ({ page }) => {
      // Navigate to job detail
      await page.click('[data-test="job-card"]');
      
      // Click share button
      await page.click('[data-test="share-job-button"]');
      
      // Verify share modal
      await expect(page.locator('[data-test="share-modal"]')).toBeVisible();
      
      // Copy public link
      await page.click('[data-test="copy-public-link"]');
      
      // Verify copied
      await expect(page.locator('[data-test="link-copied"]')).toBeVisible();
    });

    test('should export job details', async ({ page }) => {
      // Navigate to job detail
      await page.click('[data-test="job-card"]');
      
      // Click export button
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-test="export-job-button"]')
      ]);
      
      // Verify download
      expect(download.suggestedFilename()).toContain('job-details');
    });
  });

  test.describe('Bulk Job Operations', () => {
    test('should bulk update job status', async ({ page }) => {
      // Seed multiple jobs
      const projectId = process.env.TEST_PROJECT_ID || '';
      await seedTestJobs(projectId, 3);
      await page.reload();
      
      // Select multiple jobs
      await page.click('[data-test="select-job-checkbox"]').first();
      await page.click('[data-test="select-job-checkbox"]').nth(1);
      
      // Click bulk status update
      await page.click('[data-test="bulk-status-button"]');
      
      // Select new status
      await page.click('[data-test="bulk-status-paused"]');
      
      // Apply changes
      await page.click('[data-test="apply-bulk-status"]');
      
      // Verify status updated
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      await expect(page.locator('[data-test="job-status"]:has-text("PAUSED")')).toHaveCount(2);
    });

    test('should bulk delete jobs', async ({ page }) => {
      // Select all jobs
      await page.click('[data-test="select-all-checkbox"]');
      
      // Click bulk delete
      await page.click('[data-test="bulk-delete-button"]');
      
      // Confirm deletion
      await page.waitForSelector('[data-test="confirm-bulk-delete-modal"]');
      await page.click('[data-test="confirm-bulk-delete"]');
      
      // Verify all deleted
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      await expect(page.locator('text=No jobs found')).toBeVisible();
    });
  });
});
