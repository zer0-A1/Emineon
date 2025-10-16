import { test, expect } from '@playwright/test';

test.describe('Basic Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport to avoid mobile detection
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should navigate to candidates page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on candidates navigation
    await page.click('[data-test="nav-candidates"]');
    
    // Verify we're on candidates page
    await expect(page).toHaveURL(/\/candidates/);
    
    // Wait for candidates to load
    await page.waitForSelector('[data-test="candidates-grid"]', { timeout: 10000 });
    
    // Verify search input is visible
    await expect(page.locator('[data-test="search-candidates"]')).toBeVisible();
    
    // Verify create candidate button is visible
    await expect(page.locator('[data-test="create-candidate-btn"]')).toBeVisible();
  });

  test('should navigate to jobs page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on jobs navigation
    await page.click('[data-test="nav-jobs"]');
    
    // Verify we're on jobs page
    await expect(page).toHaveURL(/\/jobs/);
    
    // Verify create job button is visible
    await expect(page.locator('[data-test="create-job-btn"]')).toBeVisible();
  });

  test('should search candidates', async ({ page }) => {
    await page.goto('/candidates');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for search input
    const searchInput = page.locator('[data-test="search-candidates"]');
    await searchInput.waitFor({ state: 'visible' });
    
    // Type in search
    await searchInput.fill('python developer');
    
    // Wait for search results (debounce)
    await page.waitForTimeout(1500);
    
    // Check if we have candidate cards
    const candidateCards = page.locator('[data-test="candidate-card"]');
    const count = await candidateCards.count();
    
    // We should have at least one result
    expect(count).toBeGreaterThan(0);
  });

  test('should open create candidate modal', async ({ page }) => {
    await page.goto('/candidates');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click create candidate button
    await page.click('[data-test="create-candidate-btn"]');
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Verify modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Jobs
    await page.click('[data-test="nav-jobs"]');
    await expect(page).toHaveURL(/\/jobs/);
    
    // Navigate to Projects
    await page.click('[data-test="nav-projects"]');
    await expect(page).toHaveURL(/\/projects/);
    
    // Navigate to Candidates
    await page.click('[data-test="nav-candidates"]');
    await expect(page).toHaveURL(/\/candidates/);
    
    // Go back to dashboard
    await page.click('[data-test="nav-dashboard"]');
    await expect(page).toHaveURL(/\/$/);
  });
});
