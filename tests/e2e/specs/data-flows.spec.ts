import { test, expect } from '@playwright/test';
import { createTestUser, cleanupTestData, seedTestCandidates, seedTestJobs } from '../helpers/test-user-pg';
import { authenticateAsTestUser } from '../helpers/auth';

test.describe('Data Flow and Integrity Tests', () => {
  let testUserId: string;
  let testClientId: string;
  let testProjectId: string;

  test.beforeAll(async () => {
    // Use existing test data from global setup
    testUserId = process.env.TEST_USER_ID || 'test-user-playwright';
    testClientId = process.env.TEST_CLIENT_ID || '';
    testProjectId = process.env.TEST_PROJECT_ID || '';
  });

  test.describe('Client → Project → Job Data Flow', () => {
    test('should maintain referential integrity when creating job hierarchy', async ({ page }) => {
      await page.goto('/jobs');
      
      // Create a new job
      await page.getByTestId('create-job-button').click();
      await page.waitForSelector('[data-test="create-job-modal"]');
      
      // Fill job details
      await page.getByTestId('job-title').fill('Data Flow Test Job');
      await page.getByTestId('job-description').fill('Testing referential integrity between client, project, and job');
      
      // Publish job
      await page.getByTestId('publish-job').click();
      
      // Wait for success and navigation
      await page.waitForURL(/\/jobs\/[a-zA-Z0-9]+/, { timeout: 10000 });
      
      // Verify job is linked to correct project and client
      await expect(page.locator('text=Playwright Test Project')).toBeVisible();
      await expect(page.locator('text=Playwright Test Client')).toBeVisible();
    });

    test('should cascade updates from client to related entities', async ({ page }) => {
      // Navigate to a job detail page
      const jobs = await seedTestJobs(testProjectId, 1);
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Verify client information is displayed
      await expect(page.locator('text=Playwright Test Client')).toBeVisible();
      
      // TODO: Add client update functionality and verify cascade
    });
  });

  test.describe('Candidate → Application → Job Data Flow', () => {
    test('should create application when adding candidate to job', async ({ page }) => {
      // Create test data
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(2);
      
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Add existing candidate to job
      await page.getByTestId('add-candidate-dropdown').click();
      await page.getByTestId('add-existing-candidate').click();
      
      // Select a candidate
      await page.waitForSelector('text=Select Candidates');
      await page.locator(`text=${candidates[0].firstName} ${candidates[0].lastName}`).first().click();
      await page.getByRole('button', { name: 'Add Selected' }).click();
      
      // Verify candidate appears in pipeline
      await expect(page.getByTestId('pipeline-stage').first()).toContainText(`${candidates[0].firstName} ${candidates[0].lastName}`);
    });

    test('should move candidate through pipeline stages', async ({ page }) => {
      // Create test data
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(1);
      
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Add candidate to job
      await page.getByTestId('add-candidate-dropdown').click();
      await page.getByTestId('add-existing-candidate').click();
      await page.waitForSelector('text=Select Candidates');
      await page.locator(`text=${candidates[0].firstName} ${candidates[0].lastName}`).first().click();
      await page.getByRole('button', { name: 'Add Selected' }).click();
      
      // Wait for candidate to appear in first stage
      await page.waitForSelector('[data-test="candidate-card"]');
      
      // Drag candidate to next stage
      const candidateCard = page.getByTestId('candidate-card').first();
      const targetStage = page.getByTestId('pipeline-stage').nth(1);
      
      await candidateCard.dragTo(targetStage);
      
      // Verify candidate moved
      await expect(targetStage).toContainText(`${candidates[0].firstName} ${candidates[0].lastName}`);
    });

    test('should update application status when candidate stage changes', async ({ page }) => {
      // This tests the synchronization between pipeline stages and application status
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(1);
      
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Add candidate and move through stages
      await page.getByTestId('add-candidate-dropdown').click();
      await page.getByTestId('add-existing-candidate').click();
      await page.waitForSelector('text=Select Candidates');
      await page.locator(`text=${candidates[0].firstName} ${candidates[0].lastName}`).first().click();
      await page.getByRole('button', { name: 'Add Selected' }).click();
      
      // Move to Interview stage
      await page.waitForSelector('[data-test="candidate-card"]');
      const candidateCard = page.getByTestId('candidate-card').first();
      const interviewStage = page.getByTestId('pipeline-stage').filter({ hasText: 'Interview' });
      
      await candidateCard.dragTo(interviewStage);
      
      // Click on candidate to view details
      await candidateCard.click();
      
      // Verify status updated
      await expect(page.locator('text=Interview')).toBeVisible();
    });
  });

  test.describe('Job Lifecycle and Data Consistency', () => {
    test('should maintain data consistency when closing job as Won', async ({ page }) => {
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(2);
      
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Add candidates to job
      for (const candidate of candidates) {
        await page.getByTestId('add-candidate-dropdown').click();
        await page.getByTestId('add-existing-candidate').click();
        await page.waitForSelector('text=Select Candidates');
        await page.locator(`text=${candidate.firstName} ${candidate.lastName}`).first().click();
        await page.getByRole('button', { name: 'Add Selected' }).click();
        await page.waitForTimeout(500); // Small delay between additions
      }
      
      // Move one candidate to Hired stage
      const candidateCard = page.getByTestId('candidate-card').first();
      const hiredStage = page.getByTestId('pipeline-stage').filter({ hasText: 'Hired' });
      await candidateCard.dragTo(hiredStage);
      
      // Close job as Won
      await page.getByTestId('set-outcome-button').click();
      await page.getByTestId('outcome-won').click();
      await page.getByTestId('close-reason-select').selectOption('Candidate Hired');
      await page.getByTestId('close-notes').fill('Successfully placed candidate');
      await page.getByTestId('confirm-close').click();
      
      // Verify job status updated
      await expect(page.getByTestId('job-status')).toContainText('Won');
      
      // Verify congratulations message appears
      await expect(page.locator('text=Congratulations! Placement secured')).toBeVisible();
    });

    test('should prevent data corruption when deleting job with candidates', async ({ page }) => {
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(1);
      
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Add candidate to job
      await page.getByTestId('add-candidate-dropdown').click();
      await page.getByTestId('add-existing-candidate').click();
      await page.waitForSelector('text=Select Candidates');
      await page.locator(`text=${candidates[0].firstName} ${candidates[0].lastName}`).first().click();
      await page.getByRole('button', { name: 'Add Selected' }).click();
      
      // Navigate back to jobs list
      await page.goto('/jobs');
      
      // Delete the job
      await page.locator(`[data-test="job-card"]`).filter({ hasText: jobs[0].title }).hover();
      await page.locator(`[data-test="job-card"]`).filter({ hasText: jobs[0].title }).getByRole('button').last().click();
      await page.getByTestId('delete-job').click();
      
      // Confirm deletion
      await page.getByRole('button', { name: 'Delete' }).click();
      
      // Verify job is removed
      await expect(page.locator(`text=${jobs[0].title}`)).not.toBeVisible();
      
      // Verify candidate still exists
      await page.goto('/candidates');
      await expect(page.locator(`text=${candidates[0].firstName} ${candidates[0].lastName}`)).toBeVisible();
    });
  });

  test.describe('Search and Data Retrieval', () => {
    test('should search across all candidate data fields', async ({ page }) => {
      const candidates = await seedTestCandidates(5);
      
      await page.goto('/candidates');
      
      // Search by email
      await page.getByTestId('search-candidates').fill(candidates[0].email);
      await page.waitForTimeout(500); // Debounce delay
      
      await expect(page.getByTestId('candidate-card')).toHaveCount(1);
      await expect(page.locator(`text=${candidates[0].firstName}`)).toBeVisible();
      
      // Clear and search by skill
      await page.getByTestId('search-candidates').clear();
      await page.getByTestId('search-candidates').fill('TypeScript');
      await page.waitForTimeout(500);
      
      // Should find multiple candidates with TypeScript skill
      const visibleCards = await page.getByTestId('candidate-card').count();
      expect(visibleCards).toBeGreaterThan(0);
    });

    test('should maintain search context when navigating', async ({ page }) => {
      await seedTestCandidates(10);
      
      await page.goto('/candidates');
      
      // Perform search
      await page.getByTestId('search-candidates').fill('Senior Developer');
      await page.waitForTimeout(500);
      
      const searchResultCount = await page.getByTestId('candidate-card').count();
      expect(searchResultCount).toBeGreaterThan(0);
      
      // Click on a candidate
      await page.getByTestId('candidate-card').first().click();
      
      // Navigate back
      await page.goBack();
      
      // Search should be preserved
      await expect(page.getByTestId('search-candidates')).toHaveValue('Senior Developer');
      await expect(page.getByTestId('candidate-card')).toHaveCount(searchResultCount);
    });
  });

  test.describe('Concurrent Data Operations', () => {
    test('should handle concurrent candidate additions', async ({ page, context }) => {
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(3);
      
      // Open two tabs
      const page1 = page;
      const page2 = await context.newPage();
      
      await page1.goto(`/jobs/${jobs[0].id}`);
      await page2.goto(`/jobs/${jobs[0].id}`);
      
      // Add different candidates in each tab simultaneously
      const addCandidate = async (page: any, candidate: any) => {
        await page.getByTestId('add-candidate-dropdown').click();
        await page.getByTestId('add-existing-candidate').click();
        await page.waitForSelector('text=Select Candidates');
        await page.locator(`text=${candidate.firstName} ${candidate.lastName}`).first().click();
        await page.getByRole('button', { name: 'Add Selected' }).click();
      };
      
      // Add candidates concurrently
      await Promise.all([
        addCandidate(page1, candidates[0]),
        addCandidate(page2, candidates[1])
      ]);
      
      // Refresh both pages
      await page1.reload();
      await page2.reload();
      
      // Both candidates should be visible in both tabs
      await expect(page1.locator(`text=${candidates[0].firstName}`)).toBeVisible();
      await expect(page1.locator(`text=${candidates[1].firstName}`)).toBeVisible();
      await expect(page2.locator(`text=${candidates[0].firstName}`)).toBeVisible();
      await expect(page2.locator(`text=${candidates[1].firstName}`)).toBeVisible();
      
      await page2.close();
    });

    test('should handle race conditions in pipeline updates', async ({ page }) => {
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(2);
      
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Add both candidates
      for (const candidate of candidates) {
        await page.getByTestId('add-candidate-dropdown').click();
        await page.getByTestId('add-existing-candidate').click();
        await page.waitForSelector('text=Select Candidates');
        await page.locator(`text=${candidate.firstName} ${candidate.lastName}`).first().click();
        await page.getByRole('button', { name: 'Add Selected' }).click();
        await page.waitForTimeout(300);
      }
      
      // Move both candidates simultaneously
      const cards = await page.getByTestId('candidate-card').all();
      const targetStage = page.getByTestId('pipeline-stage').nth(1);
      
      // Drag both cards quickly
      for (const card of cards) {
        await card.dragTo(targetStage);
      }
      
      // Verify both moved successfully
      await expect(targetStage.getByTestId('candidate-card')).toHaveCount(2);
    });
  });

  test.describe('Data Validation and Constraints', () => {
    test('should enforce unique email constraint for candidates', async ({ page }) => {
      const existingCandidate = await seedTestCandidates(1);
      
      await page.goto('/candidates');
      await page.getByTestId('create-candidate-button').click();
      
      // Try to create candidate with duplicate email
      await page.getByTestId('candidate-firstname').fill('Duplicate');
      await page.getByTestId('candidate-lastname').fill('Test');
      await page.getByTestId('candidate-email').fill(existingCandidate[0].email);
      await page.getByTestId('candidate-phone').fill('+1234567890');
      
      // Continue to assignment
      await page.getByRole('button', { name: 'Continue to Assignment' }).click();
      
      // Try to save
      await page.getByTestId('submit-candidate').click();
      
      // Should show error
      await expect(page.locator('text=already exists')).toBeVisible();
    });

    test('should validate required fields before submission', async ({ page }) => {
      await page.goto('/jobs');
      await page.getByTestId('create-job-button').click();
      
      // Try to publish without required fields
      await page.getByTestId('publish-job').click();
      
      // Should show validation errors
      await expect(page.locator('text=Job title is required')).toBeVisible();
      await expect(page.locator('text=Job description is required')).toBeVisible();
    });
  });

  test.describe('Data Export and Import', () => {
    test('should maintain data integrity during bulk operations', async ({ page }) => {
      const candidates = await seedTestCandidates(10);
      
      await page.goto('/candidates');
      
      // Select all candidates
      await page.getByTestId('select-all-checkbox').click();
      
      // Verify all are selected
      const checkboxes = await page.locator('[data-test="candidate-checkbox"]:checked').count();
      expect(checkboxes).toBe(10);
      
      // TODO: Test bulk export when implemented
      // TODO: Test bulk delete when implemented
    });
  });

  test.describe('Activity and Audit Trail', () => {
    test('should track all data modifications', async ({ page }) => {
      const jobs = await seedTestJobs(testProjectId, 1);
      
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Make several changes
      const candidates = await seedTestCandidates(1);
      
      // Add candidate
      await page.getByTestId('add-candidate-dropdown').click();
      await page.getByTestId('add-existing-candidate').click();
      await page.waitForSelector('text=Select Candidates');
      await page.locator(`text=${candidates[0].firstName} ${candidates[0].lastName}`).first().click();
      await page.getByRole('button', { name: 'Add Selected' }).click();
      
      // Move candidate
      await page.waitForSelector('[data-test="candidate-card"]');
      const candidateCard = page.getByTestId('candidate-card').first();
      const targetStage = page.getByTestId('pipeline-stage').nth(1);
      await candidateCard.dragTo(targetStage);
      
      // TODO: Verify activity log when UI is implemented
    });
  });
});
