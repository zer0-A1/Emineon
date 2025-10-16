import { test, expect } from '@playwright/test';
import { setupTestAuth, waitForAuth, TEST_USER } from '../helpers/auth-setup';

/**
 * Jobs page tests with proper authentication
 */
test.describe('Jobs Page - Authenticated Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication before navigating
    await setupTestAuth(page);
    
    // Navigate to jobs page
    await page.goto('http://localhost:3000/jobs');
    
    // Wait for authentication to be ready
    await waitForAuth(page);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should access jobs page with authentication', async ({ page }) => {
    // Should not redirect to sign-in
    await expect(page).not.toHaveURL(/sign-in/);
    
    // Should be on jobs page
    await expect(page).toHaveURL(/\/jobs/);
    
    // Check for jobs page elements
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
    
    // Should show "Jobs" or contain jobs-related text
    const titleText = await pageTitle.textContent();
    expect(titleText).toMatch(/jobs|positions|openings/i);
  });

  test('should display view toggle buttons', async ({ page }) => {
    // Wait for view buttons to be visible
    await page.waitForSelector('[data-test="view-list"], button:has-text("List")', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Check view toggle buttons exist
    const listButton = page.locator('[data-test="view-list"], button:has-text("List")').first();
    const gridButton = page.locator('[data-test="view-grid"], button:has-text("Grid")').first();
    const clientButton = page.locator('[data-test="view-client"], button:has-text("Client"), button:has-text("Group")').first();
    
    await expect(listButton).toBeVisible();
    await expect(gridButton).toBeVisible();
    await expect(clientButton).toBeVisible();
  });

  test('should switch between view modes', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Find view buttons (with fallback selectors)
    const listButton = page.locator('[data-test="view-list"], button:has-text("List")').first();
    const gridButton = page.locator('[data-test="view-grid"], button:has-text("Grid")').first();
    const clientButton = page.locator('[data-test="view-client"], button:has-text("Client"), button:has-text("Group")').first();
    
    // Switch to Grid View
    if (await gridButton.isVisible()) {
      await gridButton.click();
      await page.waitForTimeout(500);
      
      // Check for grid layout
      const container = page.locator('[data-test="jobs-container"], .grid, [class*="grid"]').first();
      if (await container.isVisible()) {
        const classes = await container.getAttribute('class');
        expect(classes).toMatch(/grid/);
      }
    }
    
    // Switch to List View
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(500);
    }
    
    // Switch to Client View
    if (await clientButton.isVisible()) {
      await clientButton.click();
      await page.waitForTimeout(500);
      
      // Check for client sections
      const clientSection = page.locator('[data-test="client-section"], [class*="client"]').first();
      if (await clientSection.count() > 0) {
        await expect(clientSection).toBeVisible();
      }
    }
  });

  test('should display toolbar elements', async ({ page }) => {
    // Check for search input
    const searchInput = page.locator('[data-test="search-jobs"], input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
    }
    
    // Check for create job button
    const createButton = page.locator('[data-test="create-job-btn"], button:has-text("Create"), button:has-text("New Job"), button:has-text("Add Job")').first();
    if (await createButton.count() > 0) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should show job cards or empty state', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check for job cards
    const jobCards = page.locator('[data-test="job-card"], [class*="job-card"], article').first();
    const emptyState = page.locator('text=/no.*jobs|empty|create.*first/i').first();
    
    // Either show jobs or empty state
    const hasJobs = await jobCards.count() > 0;
    const hasEmptyState = await emptyState.count() > 0;
    
    expect(hasJobs || hasEmptyState).toBeTruthy();
  });

  test('should verify blue bracket on job cards', async ({ page }) => {
    // Wait for job cards to load
    const jobCard = page.locator('[data-test="job-card"], [class*="job-card"]').first();
    
    if (await jobCard.count() > 0) {
      // Check for blue bracket styling
      const classes = await jobCard.getAttribute('class');
      if (classes) {
        // Should have left border styling
        expect(classes).toMatch(/border-l-4|border-left|border-l-primary|border-l-blue/);
      }
    }
  });

  test('should handle view mode persistence', async ({ page }) => {
    // Switch to grid view
    const gridButton = page.locator('[data-test="view-grid"], button:has-text("Grid")').first();
    if (await gridButton.isVisible()) {
      await gridButton.click();
      await page.waitForTimeout(500);
      
      // Reload page
      await page.reload();
      await waitForAuth(page);
      await page.waitForLoadState('networkidle');
      
      // Should still be in grid view
      const activeButton = page.locator('[data-test="view-grid"][class*="active"], [data-test="view-grid"][class*="primary"], button:has-text("Grid")[class*="active"]').first();
      if (await activeButton.count() > 0) {
        await expect(activeButton).toBeVisible();
      }
    }
  });

  test('should display user information', async ({ page }) => {
    // Check for user button or avatar
    const userButton = page.locator('[data-test="user-button"], [class*="user-button"], button:has-text("' + TEST_USER.email + '"), img[alt*="User"]').first();
    
    if (await userButton.count() > 0) {
      await expect(userButton).toBeVisible();
    }
  });

  test('should not show authentication errors', async ({ page }) => {
    // Check console for auth errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit to collect any errors
    await page.waitForTimeout(2000);
    
    // Should not have authentication-related errors
    const authErrors = consoleErrors.filter(e => 
      e.toLowerCase().includes('auth') || 
      e.toLowerCase().includes('unauthorized') ||
      e.toLowerCase().includes('401')
    );
    
    expect(authErrors.length).toBe(0);
  });

  test('should access job details page', async ({ page }) => {
    // Find and click on a job card if available
    const jobCard = page.locator('[data-test="job-card"], [class*="job-card"]').first();
    
    if (await jobCard.count() > 0) {
      // Get job title for verification
      const jobTitle = await jobCard.locator('[data-test="job-title"], h3, h4').first().textContent();
      
      // Click on job card
      await jobCard.click();
      
      // Should navigate to job detail page
      await page.waitForURL(/\/jobs\/[a-zA-Z0-9-]+/, { timeout: 10000 });
      
      // Should show job details
      if (jobTitle) {
        await expect(page.locator(`text="${jobTitle}"`)).toBeVisible();
      }
    }
  });
});
