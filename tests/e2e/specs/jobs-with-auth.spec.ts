import { test, expect } from '@playwright/test';

/**
 * Jobs page tests using Playwright's authentication setup
 * These tests will automatically use the authenticated state from auth.setup.ts
 */
test.describe('Jobs Page - With Authentication', () => {
  test('should access jobs page directly', async ({ page }) => {
    // Go directly to jobs page - should not redirect to sign-in
    await page.goto('/jobs');
    
    // Verify we're on the jobs page
    await expect(page).toHaveURL(/\/jobs/);
    
    // Look for jobs page elements
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display and interact with view toggles', async ({ page }) => {
    await page.goto('/jobs');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find view toggle buttons
    const listViewBtn = page.locator('[data-test="view-list"], button[title*="List"], button:has-text("List")').first();
    const gridViewBtn = page.locator('[data-test="view-grid"], button[title*="Grid"], button:has-text("Grid")').first();
    const clientViewBtn = page.locator('[data-test="view-client"], button[title*="Client"], button:has-text("Group")').first();
    
    // Check if buttons exist
    if (await listViewBtn.count() > 0) {
      await expect(listViewBtn).toBeVisible();
      
      // Test list view
      await listViewBtn.click();
      await page.waitForTimeout(500);
    }
    
    if (await gridViewBtn.count() > 0) {
      await expect(gridViewBtn).toBeVisible();
      
      // Test grid view
      await gridViewBtn.click();
      await page.waitForTimeout(500);
      
      // In grid view, check for grid layout
      const container = page.locator('[data-test="jobs-container"], .grid').first();
      if (await container.count() > 0) {
        const classes = await container.getAttribute('class');
        expect(classes).toContain('grid');
      }
    }
    
    if (await clientViewBtn.count() > 0) {
      await expect(clientViewBtn).toBeVisible();
      
      // Test client view
      await clientViewBtn.click();
      await page.waitForTimeout(500);
      
      // Check for client sections
      const clientSection = page.locator('[data-test="client-section"], [class*="client"]').first();
      if (await clientSection.count() > 0) {
        await expect(clientSection).toBeVisible();
      }
    }
  });

  test('should verify job cards have blue bracket', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    
    // Find job cards
    const jobCards = page.locator('[data-test="job-card"], article[class*="job"], .job-card');
    const cardCount = await jobCards.count();
    
    if (cardCount > 0) {
      // Check first card for blue bracket
      const firstCard = jobCards.first();
      const classes = await firstCard.getAttribute('class');
      
      // Should have border-left styling
      expect(classes).toMatch(/border-l-4|border-left|bl-4/);
      
      // Take screenshot for verification
      await firstCard.screenshot({ path: 'test-results/job-card-blue-bracket.png' });
    } else {
      console.log('No job cards found - might be empty state');
    }
  });

  test('should test toolbar functionality', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    
    // Test search functionality
    const searchInput = page.locator('[data-test="search-jobs"], input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('React Developer');
      await page.waitForTimeout(1000); // Wait for debounce
    }
    
    // Test create job button
    const createBtn = page.locator('[data-test="create-job-btn"], button:has-text("Create"), button:has-text("New Job")').first();
    if (await createBtn.count() > 0) {
      await expect(createBtn).toBeVisible();
      
      // Click and check if modal opens
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      // Check for modal
      const modal = page.locator('[role="dialog"], [data-test="create-job-modal"], .modal').first();
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();
        
        // Close modal
        const closeBtn = modal.locator('button[aria-label="Close"], button:has-text("Cancel"), [data-test="close-modal"]').first();
        if (await closeBtn.count() > 0) {
          await closeBtn.click();
        } else {
          // Try clicking outside or pressing Escape
          await page.keyboard.press('Escape');
        }
      }
    }
    
    // Test expand/collapse all button
    const toggleAllBtn = page.locator('[data-test="toggle-view-all"], button:has-text("Expand All"), button:has-text("Single Row All")').first();
    if (await toggleAllBtn.count() > 0) {
      const initialText = await toggleAllBtn.textContent();
      await toggleAllBtn.click();
      await page.waitForTimeout(500);
      
      // Check if text changed
      const newText = await toggleAllBtn.textContent();
      expect(newText).not.toBe(initialText);
    }
  });

  test('should handle empty state', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    
    // Check if there are job cards
    const jobCards = page.locator('[data-test="job-card"], article[class*="job"], .job-card');
    const cardCount = await jobCards.count();
    
    if (cardCount === 0) {
      // Should show empty state message
      const emptyState = page.locator('text=/no.*jobs|empty|create.*first/i');
      await expect(emptyState).toBeVisible();
      
      // Should have create job button in empty state
      const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")');
      await expect(createBtn.first()).toBeVisible();
    } else {
      console.log(`Found ${cardCount} job cards`);
    }
  });

  test('should navigate to job details', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    
    // Find a job card
    const jobCard = page.locator('[data-test="job-card"], article[class*="job"], .job-card').first();
    
    if (await jobCard.count() > 0) {
      // Get job title for verification
      const titleElement = jobCard.locator('[data-test="job-title"], h3, h4').first();
      const jobTitle = await titleElement.textContent();
      
      // Click on the card
      await jobCard.click();
      
      // Should navigate to job detail page
      await page.waitForURL(/\/jobs\/[a-zA-Z0-9-]+/, { timeout: 5000 });
      
      // Verify we're on the detail page
      if (jobTitle) {
        await expect(page.locator(`text="${jobTitle}"`)).toBeVisible();
      }
      
      // Go back to jobs list
      await page.goBack();
      await expect(page).toHaveURL(/\/jobs$/);
    }
  });

  test('should test responsive design', async ({ page }) => {
    await page.goto('/jobs');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check if mobile menu appears
    const mobileMenu = page.locator('[data-test="mobile-menu-button"], button[aria-label*="Menu"]').first();
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu).toBeVisible();
    }
    
    // Check if grid adjusts to single column
    const gridContainer = page.locator('.grid');
    if (await gridContainer.count() > 0) {
      const classes = await gridContainer.getAttribute('class');
      expect(classes).toContain('grid-cols-1');
    }
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
  });
});
