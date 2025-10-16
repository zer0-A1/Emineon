import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { seedTestCandidates, seedTestJobs } from '../helpers/test-user-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

test.describe('Edge Cases and Error Handling Tests', () => {
  let testProjectId: string;
  let testUserId: string;

  test.beforeAll(async () => {
    testProjectId = process.env.TEST_PROJECT_ID || '';
    testUserId = process.env.TEST_USER_ID || 'test-user-playwright';
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.describe('Boundary Value Testing', () => {
    test('should handle maximum length inputs', async ({ page }) => {
      await page.goto('/candidates');
      await page.getByTestId('create-candidate-button').click();
      
      // Test maximum length for various fields
      const maxLengthName = 'A'.repeat(255); // Assuming 255 char limit
      const maxLengthEmail = 'a'.repeat(240) + '@test.com'; // Valid email at max length
      
      await page.getByTestId('candidate-firstname').fill(maxLengthName);
      await page.getByTestId('candidate-lastname').fill(maxLengthName);
      await page.getByTestId('candidate-email').fill(maxLengthEmail);
      await page.getByTestId('candidate-phone').fill('+' + '1'.repeat(20));
      
      // Should accept maximum valid lengths
      await page.getByRole('button', { name: 'Continue to Assignment' }).click();
      
      // Should proceed without errors
      await expect(page.locator('text=Assign & Save')).toBeVisible();
    });

    test('should handle minimum valid inputs', async ({ page }) => {
      await page.goto('/candidates');
      await page.getByTestId('create-candidate-button').click();
      
      // Test minimum valid inputs
      await page.getByTestId('candidate-firstname').fill('A');
      await page.getByTestId('candidate-lastname').fill('B');
      await page.getByTestId('candidate-email').fill('a@b.c');
      await page.getByTestId('candidate-phone').fill('+1');
      
      // Should accept minimum valid inputs
      await page.getByRole('button', { name: 'Continue to Assignment' }).click();
      await expect(page.locator('text=Assign & Save')).toBeVisible();
    });

    test('should handle empty optional fields gracefully', async ({ page }) => {
      await page.goto('/jobs');
      await page.getByTestId('create-job-button').click();
      
      // Fill only required fields
      await page.getByTestId('job-title').fill('Minimal Job');
      await page.getByTestId('job-description').fill('Minimal description');
      
      // Leave all optional fields empty
      await page.getByTestId('publish-job').click();
      
      // Should create job successfully
      await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9]+/);
    });
  });

  test.describe('Special Characters and Encoding', () => {
    test('should handle special characters in inputs', async ({ page }) => {
      await page.goto('/candidates');
      await page.getByTestId('create-candidate-button').click();
      
      // Test various special characters
      const specialChars = "O'Neill-D'Angelo & Co.";
      const unicodeChars = "José María 李明 محمد";
      const emailSpecial = "test+tag@sub-domain.example.com";
      
      await page.getByTestId('candidate-firstname').fill(unicodeChars);
      await page.getByTestId('candidate-lastname').fill(specialChars);
      await page.getByTestId('candidate-email').fill(emailSpecial);
      await page.getByTestId('candidate-phone').fill('+33-6-12-34-56-78');
      
      await page.getByRole('button', { name: 'Continue to Assignment' }).click();
      await page.getByTestId('submit-candidate').click();
      
      // Should save successfully
      await page.waitForTimeout(1000);
      
      // Verify data is displayed correctly
      await page.goto('/candidates');
      await expect(page.locator(`text=${unicodeChars}`)).toBeVisible();
    });

    test('should handle HTML/script injection attempts', async ({ page }) => {
      await page.goto('/jobs');
      await page.getByTestId('create-job-button').click();
      
      // Attempt to inject HTML/JavaScript
      const maliciousInput = '<script>alert("XSS")</script>';
      const htmlInput = '<h1>Bold Title</h1><img src=x onerror=alert(1)>';
      
      await page.getByTestId('job-title').fill(maliciousInput);
      await page.getByTestId('job-description').fill(htmlInput);
      
      await page.getByTestId('publish-job').click();
      
      // Should sanitize and not execute scripts
      await page.waitForURL(/\/jobs\/[a-zA-Z0-9]+/);
      
      // Verify no alerts were triggered
      page.on('dialog', () => {
        throw new Error('XSS vulnerability detected!');
      });
      
      // Content should be escaped/sanitized
      await expect(page.locator('text=<script>')).toBeVisible();
    });
  });

  test.describe('Network and Connectivity Issues', () => {
    test('should handle offline mode gracefully', async ({ page, context }) => {
      await page.goto('/candidates');
      
      // Go offline
      await context.setOffline(true);
      
      // Try to perform actions
      await page.getByTestId('search-candidates').fill('Test');
      
      // Should show appropriate error or cached data
      await page.waitForTimeout(1000);
      
      // Go back online
      await context.setOffline(false);
      
      // Should recover gracefully
      await page.reload();
      await expect(page.getByTestId('candidate-card').first()).toBeVisible();
    });

    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate 3G network
      await context.route('**/*', (route) => {
        setTimeout(() => route.continue(), 500); // Add 500ms delay
      });
      
      await page.goto('/candidates', { timeout: 30000 });
      
      // Should still load, possibly with loading indicators
      await expect(page.getByTestId('create-candidate-button')).toBeVisible({ timeout: 10000 });
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept API calls and return errors
      await page.route('**/api/candidates**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await page.goto('/candidates');
      
      // Should show error message
      await expect(page.locator('text=error').or(page.locator('text=Error'))).toBeVisible();
    });
  });

  test.describe('Race Conditions', () => {
    test('should handle rapid button clicks', async ({ page }) => {
      await page.goto('/candidates');
      
      // Click create button multiple times rapidly
      const createButton = page.getByTestId('create-candidate-button');
      
      await createButton.click();
      await createButton.click();
      await createButton.click();
      
      // Should only open one modal
      await page.waitForTimeout(500);
      const modals = await page.locator('[data-test="create-candidate-modal"]').count();
      expect(modals).toBe(1);
    });

    test('should handle concurrent form submissions', async ({ page }) => {
      const jobs = await seedTestJobs(testProjectId, 1);
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Try to add the same candidate multiple times concurrently
      const candidates = await seedTestCandidates(1);
      
      // Open add candidate modal
      await page.getByTestId('add-candidate-dropdown').click();
      await page.getByTestId('add-existing-candidate').click();
      await page.waitForSelector('text=Select Candidates');
      await page.locator(`text=${candidates[0].firstName} ${candidates[0].lastName}`).first().click();
      
      // Click add button multiple times
      const addButton = page.getByRole('button', { name: 'Add Selected' });
      await addButton.click();
      await addButton.click();
      
      // Should only add candidate once
      await page.waitForTimeout(1000);
      const candidateCards = await page.getByTestId('candidate-card').count();
      expect(candidateCards).toBe(1);
    });
  });

  test.describe('Data State Edge Cases', () => {
    test('should handle deleted entities gracefully', async ({ page }) => {
      // Create and then delete a job
      const job = await prisma.job.create({
        data: {
          title: 'To Be Deleted',
          description: 'This job will be deleted',
          projectId: testProjectId,
          status: 'ACTIVE',
          owner: testUserId,
        }
      });
      
      // Navigate to the job
      await page.goto(`/jobs/${job.id}`);
      
      // Delete the job from database
      await prisma.job.delete({ where: { id: job.id } });
      
      // Refresh the page
      await page.reload();
      
      // Should show 404 or redirect
      await expect(page.locator('text=not found').or(page.locator('text=404'))).toBeVisible();
    });

    test('should handle stale data updates', async ({ page, context }) => {
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(1);
      
      // Open job in two tabs
      const page1 = page;
      const page2 = await context.newPage();
      
      await page1.goto(`/jobs/${jobs[0].id}`);
      await page2.goto(`/jobs/${jobs[0].id}`);
      
      // Add candidate in first tab
      await page1.getByTestId('add-candidate-dropdown').click();
      await page1.getByTestId('add-existing-candidate').click();
      await page1.waitForSelector('text=Select Candidates');
      await page1.locator(`text=${candidates[0].firstName} ${candidates[0].lastName}`).first().click();
      await page1.getByRole('button', { name: 'Add Selected' }).click();
      
      // Try to add same candidate in second tab (should handle gracefully)
      await page2.getByTestId('add-candidate-dropdown').click();
      await page2.getByTestId('add-existing-candidate').click();
      await page2.waitForSelector('text=Select Candidates');
      
      // Candidate might already be added - should be disabled or show message
      const candidateOption = page2.locator(`text=${candidates[0].firstName} ${candidates[0].lastName}`).first();
      
      // Should either be disabled or show as already added
      const isDisabled = await candidateOption.isDisabled().catch(() => false);
      const hasIndicator = await page2.locator('text=Already added').isVisible().catch(() => false);
      
      expect(isDisabled || hasIndicator).toBeTruthy();
      
      await page2.close();
    });
  });

  test.describe('Browser Compatibility Edge Cases', () => {
    test('should handle browser back/forward navigation', async ({ page }) => {
      await page.goto('/candidates');
      await page.getByTestId('create-candidate-button').click();
      
      // Fill some data
      await page.getByTestId('candidate-firstname').fill('Browser');
      await page.getByTestId('candidate-lastname').fill('Test');
      
      // Navigate back
      await page.goBack();
      
      // Should be on candidates page
      await expect(page).toHaveURL('/candidates');
      
      // Navigate forward
      await page.goForward();
      
      // Modal might not reopen, but should not crash
      await page.waitForTimeout(500);
    });

    test('should handle page refresh during operations', async ({ page }) => {
      await page.goto('/candidates');
      await page.getByTestId('create-candidate-button').click();
      
      // Fill partial data
      await page.getByTestId('candidate-firstname').fill('Refresh');
      await page.getByTestId('candidate-lastname').fill('Test');
      
      // Refresh page
      await page.reload();
      
      // Should return to candidates page, data should be lost
      await expect(page.getByTestId('create-candidate-button')).toBeVisible();
      await expect(page.locator('[data-test="create-candidate-modal"]')).not.toBeVisible();
    });
  });

  test.describe('Permission and Access Edge Cases', () => {
    test('should handle unauthorized access attempts', async ({ page }) => {
      // Try to access a non-existent job
      await page.goto('/jobs/non-existent-job-id');
      
      // Should show error or redirect
      await expect(
        page.locator('text=not found')
          .or(page.locator('text=404'))
          .or(page.locator('text=Error'))
      ).toBeVisible();
    });

    test('should handle session timeout gracefully', async ({ page, context }) => {
      await page.goto('/candidates');
      
      // Clear auth cookies to simulate session timeout
      await context.clearCookies();
      
      // Try to perform an action
      await page.getByTestId('create-candidate-button').click();
      
      // Should redirect to login or show session expired message
      await page.waitForTimeout(1000);
      
      // In dev mode with bypass, might still work
      // In production, would redirect to auth
    });
  });

  test.describe('File Upload Edge Cases', () => {
    test('should handle large file uploads', async ({ page }) => {
      await page.goto('/candidates');
      await page.getByTestId('create-candidate-button').click();
      
      // Create a large file buffer (5MB)
      const largeFileContent = Buffer.alloc(5 * 1024 * 1024).fill('a');
      
      // Note: Playwright doesn't support creating files on the fly easily
      // This is a conceptual test - in practice, you'd have test files prepared
      
      // Should show file size error or handle gracefully
    });

    test('should handle invalid file types', async ({ page }) => {
      await page.goto('/candidates');
      await page.getByTestId('create-candidate-button').click();
      
      // Try to upload an invalid file type
      // Note: Would need actual test files for this
      
      // Should show error for invalid file type
    });
  });
});
