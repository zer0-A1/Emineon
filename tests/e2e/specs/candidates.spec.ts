import { test, expect } from '@playwright/test';
import { mockAuthentication, waitForApp } from '../helpers/auth';
import { seedTestCandidates } from '../helpers/test-user-pg';

test.describe('Candidates Management', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await page.goto('/candidates');
    await waitForApp(page);
  });

  test.describe('Create Candidate', () => {
    test('should create a new candidate manually', async ({ page }) => {
      // Click create candidate button
      await page.click('[data-test="create-candidate-button"]');
      
      // Wait for modal
      await page.waitForSelector('[data-test="create-candidate-modal"]');
      
      // Fill in candidate details
      await page.fill('[data-test="candidate-firstname"]', 'John');
      await page.fill('[data-test="candidate-lastname"]', 'Doe');
      await page.fill('[data-test="candidate-email"]', 'john.doe@example.com');
      await page.fill('[data-test="candidate-phone"]', '+1234567890');
      await page.fill('[data-test="candidate-location"]', 'New York, NY');
      await page.fill('[data-test="candidate-title"]', 'Senior Software Engineer');
      await page.fill('[data-test="candidate-experience"]', '8');
      
      // Add technical skills
      await page.click('[data-test="candidate-skills-input"]');
      await page.fill('[data-test="candidate-skills-input"]', 'JavaScript');
      await page.keyboard.press('Enter');
      await page.fill('[data-test="candidate-skills-input"]', 'React');
      await page.keyboard.press('Enter');
      
      // Submit
      await page.click('[data-test="submit-candidate"]');
      
      // Verify success
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      
      // Verify candidate appears in list
      await page.goto('/candidates');
      await expect(page.locator('text=John Doe')).toBeVisible();
    });

    test('should create candidate from CV upload', async ({ page }) => {
      // Click create candidate button
      await page.click('[data-test="create-candidate-button"]');
      
      // Switch to CV upload tab
      await page.click('[data-test="cv-upload-tab"]');
      
      // Upload CV file
      const fileInput = page.locator('[data-test="cv-file-input"]');
      await fileInput.setInputFiles('./tests/fixtures/sample-cv.pdf');
      
      // Wait for parsing
      await expect(page.locator('[data-test="parsing-indicator"]')).toBeVisible();
      await expect(page.locator('[data-test="parsing-complete"]')).toBeVisible({ timeout: 30000 });
      
      // Review and submit parsed data
      await page.click('[data-test="submit-candidate"]');
      
      // Verify success
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      // Click create candidate button
      await page.click('[data-test="create-candidate-button"]');
      
      // Try to submit without required fields
      await page.click('[data-test="submit-candidate"]');
      
      // Check for validation errors
      await expect(page.locator('[data-test="error-firstname"]')).toBeVisible();
      await expect(page.locator('[data-test="error-lastname"]')).toBeVisible();
      await expect(page.locator('[data-test="error-email"]')).toBeVisible();
    });
  });

  test.describe('Read/List Candidates', () => {
    test.beforeEach(async ({ page }) => {
      // Seed test candidates
      const userId = process.env.TEST_USER_ID || 'test-user-playwright';
      await seedTestCandidates(userId, 10);
      await page.reload();
    });

    test('should display candidates list', async ({ page }) => {
      // Verify table headers
      await expect(page.locator('[data-test="candidates-table"]')).toBeVisible();
      await expect(page.locator('th:has-text("Name")')).toBeVisible();
      await expect(page.locator('th:has-text("Email")')).toBeVisible();
      await expect(page.locator('th:has-text("Location")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      
      // Verify at least one candidate is shown
      await expect(page.locator('[data-test="candidate-row"]').first()).toBeVisible();
    });

    test('should search candidates', async ({ page }) => {
      // Search by name
      await page.fill('[data-test="search-candidates"]', 'Test1');
      await page.keyboard.press('Enter');
      
      // Verify filtered results
      await expect(page.locator('[data-test="candidate-row"]')).toHaveCount(1);
      await expect(page.locator('text=Test1 Candidate1')).toBeVisible();
    });

    test('should filter by status', async ({ page }) => {
      // Click filter button
      await page.click('[data-test="filter-button"]');
      
      // Select ACTIVE status
      await page.click('[data-test="filter-status-active"]');
      
      // Apply filter
      await page.click('[data-test="apply-filters"]');
      
      // Verify only active candidates shown
      const statusBadges = page.locator('[data-test="candidate-status"]');
      await expect(statusBadges).toHaveText(['ACTIVE', 'ACTIVE', 'ACTIVE']);
    });

    test('should paginate results', async ({ page }) => {
      // Verify pagination controls
      await expect(page.locator('[data-test="pagination"]')).toBeVisible();
      
      // Go to next page
      await page.click('[data-test="next-page"]');
      
      // Verify different candidates shown
      await expect(page.locator('[data-test="current-page"]')).toHaveText('2');
    });

    test('should switch between grid and list view', async ({ page }) => {
      // Switch to grid view
      await page.click('[data-test="view-grid"]');
      
      // Verify grid layout
      await expect(page.locator('[data-test="candidates-grid"]')).toBeVisible();
      await expect(page.locator('[data-test="candidate-card"]').first()).toBeVisible();
      
      // Switch back to list view
      await page.click('[data-test="view-list"]');
      
      // Verify table layout
      await expect(page.locator('[data-test="candidates-table"]')).toBeVisible();
    });
  });

  test.describe('Update Candidate', () => {
    test('should edit candidate details', async ({ page }) => {
      // Seed a candidate
      const userId = process.env.TEST_USER_ID || 'test-user-playwright';
      await seedTestCandidates(userId, 1);
      await page.reload();
      
      // Click edit on first candidate
      await page.click('[data-test="candidate-row"] [data-test="edit-candidate"]');
      
      // Wait for edit modal
      await page.waitForSelector('[data-test="edit-candidate-modal"]');
      
      // Update fields
      await page.fill('[data-test="candidate-title"]', 'Lead Software Engineer');
      await page.fill('[data-test="candidate-experience"]', '10');
      await page.fill('[data-test="candidate-location"]', 'San Francisco, CA');
      
      // Save changes
      await page.click('[data-test="save-candidate"]');
      
      // Verify success
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      
      // Verify changes reflected in list
      await expect(page.locator('text=Lead Software Engineer')).toBeVisible();
      await expect(page.locator('text=San Francisco, CA')).toBeVisible();
    });

    test('should update candidate status', async ({ page }) => {
      // Click on candidate row to open details
      await page.click('[data-test="candidate-row"]');
      
      // Wait for candidate detail drawer
      await page.waitForSelector('[data-test="candidate-detail"]');
      
      // Change status
      await page.click('[data-test="candidate-status-select"]');
      await page.click('[data-test="status-option-passive"]');
      
      // Verify status updated
      await expect(page.locator('[data-test="candidate-status"]')).toHaveText('PASSIVE');
    });

    test('should add notes to candidate', async ({ page }) => {
      // Open candidate details
      await page.click('[data-test="candidate-row"]');
      
      // Click add note
      await page.click('[data-test="add-note-button"]');
      
      // Enter note
      await page.fill('[data-test="note-content"]', 'Great candidate for senior positions');
      await page.click('[data-test="save-note"]');
      
      // Verify note added
      await expect(page.locator('[data-test="candidate-note"]')).toContainText('Great candidate for senior positions');
    });
  });

  test.describe('Delete Candidate', () => {
    test('should delete a candidate with confirmation', async ({ page }) => {
      // Seed a candidate
      const userId = process.env.TEST_USER_ID || 'test-user-playwright';
      await seedTestCandidates(userId, 1);
      await page.reload();
      
      // Click delete on candidate
      await page.click('[data-test="candidate-row"] [data-test="delete-candidate"]');
      
      // Confirm deletion in modal
      await page.waitForSelector('[data-test="confirm-delete-modal"]');
      await page.click('[data-test="confirm-delete"]');
      
      // Verify success message
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      
      // Verify candidate removed from list
      await expect(page.locator('[data-test="candidate-row"]')).toHaveCount(0);
      await expect(page.locator('text=No candidates found')).toBeVisible();
    });

    test('should cancel deletion', async ({ page }) => {
      // Click delete on candidate
      await page.click('[data-test="candidate-row"] [data-test="delete-candidate"]');
      
      // Cancel deletion
      await page.waitForSelector('[data-test="confirm-delete-modal"]');
      await page.click('[data-test="cancel-delete"]');
      
      // Verify candidate still exists
      await expect(page.locator('[data-test="candidate-row"]')).toHaveCount(1);
    });
  });

  test.describe('Candidate Actions', () => {
    test('should add candidate to job', async ({ page }) => {
      // Open candidate details
      await page.click('[data-test="candidate-row"]');
      
      // Click add to job
      await page.click('[data-test="add-to-job-button"]');
      
      // Select job from dropdown
      await page.waitForSelector('[data-test="job-select-modal"]');
      await page.click('[data-test="job-option"]');
      
      // Confirm assignment
      await page.click('[data-test="assign-to-job"]');
      
      // Verify success
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
    });

    test('should export candidate CV', async ({ page }) => {
      // Open candidate details
      await page.click('[data-test="candidate-row"]');
      
      // Click export CV
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-test="export-cv-button"]')
      ]);
      
      // Verify download started
      expect(download.suggestedFilename()).toContain('.pdf');
    });

    test('should share candidate profile', async ({ page }) => {
      // Open candidate details
      await page.click('[data-test="candidate-row"]');
      
      // Click share button
      await page.click('[data-test="share-candidate-button"]');
      
      // Verify share modal
      await expect(page.locator('[data-test="share-modal"]')).toBeVisible();
      
      // Copy link
      await page.click('[data-test="copy-link-button"]');
      
      // Verify copied message
      await expect(page.locator('[data-test="link-copied"]')).toBeVisible();
    });
  });

  test.describe('Bulk Operations', () => {
    test('should select multiple candidates', async ({ page }) => {
      // Seed multiple candidates
      const userId = process.env.TEST_USER_ID || 'test-user-playwright';
      await seedTestCandidates(userId, 5);
      await page.reload();
      
      // Select all checkbox
      await page.click('[data-test="select-all-checkbox"]');
      
      // Verify all selected
      await expect(page.locator('[data-test="selected-count"]')).toHaveText('5 selected');
      
      // Verify bulk actions visible
      await expect(page.locator('[data-test="bulk-actions"]')).toBeVisible();
    });

    test('should bulk delete candidates', async ({ page }) => {
      // Select multiple candidates
      await page.click('[data-test="select-all-checkbox"]');
      
      // Click bulk delete
      await page.click('[data-test="bulk-delete-button"]');
      
      // Confirm deletion
      await page.waitForSelector('[data-test="confirm-bulk-delete-modal"]');
      await page.click('[data-test="confirm-bulk-delete"]');
      
      // Verify all deleted
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
      await expect(page.locator('text=No candidates found')).toBeVisible();
    });

    test('should bulk update status', async ({ page }) => {
      // Select multiple candidates
      await page.click('[data-test="candidate-checkbox"]').first();
      await page.click('[data-test="candidate-checkbox"]').nth(1);
      
      // Click bulk status update
      await page.click('[data-test="bulk-status-button"]');
      
      // Select new status
      await page.click('[data-test="bulk-status-active"]');
      
      // Apply changes
      await page.click('[data-test="apply-bulk-status"]');
      
      // Verify status updated
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();
    });
  });
});
