import { test, expect } from '@playwright/test';

/**
 * Simple UI test for Jobs page without database dependencies
 * Tests the UI functionality we've been working on
 */
test.describe('Jobs Page UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to jobs page
    await page.goto('http://localhost:3000/jobs');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display jobs page with view toggles', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Jobs');
    
    // Check view toggle buttons exist
    await expect(page.locator('[data-test="view-list"]')).toBeVisible();
    await expect(page.locator('[data-test="view-grid"]')).toBeVisible();
    await expect(page.locator('[data-test="view-client"]')).toBeVisible();
  });

  test('should switch between different view modes', async ({ page }) => {
    // Start in default view
    const jobsContainer = page.locator('[data-test="jobs-container"]');
    
    // Switch to List View
    await page.click('[data-test="view-list"]');
    await expect(page.locator('[data-test="view-list"]')).toHaveClass(/bg-primary-100/);
    
    // Switch to Grid View
    await page.click('[data-test="view-grid"]');
    await expect(page.locator('[data-test="view-grid"]')).toHaveClass(/bg-primary-100/);
    await expect(jobsContainer).toHaveClass(/grid/);
    
    // Switch to Group by Client View
    await page.click('[data-test="view-client"]');
    await expect(page.locator('[data-test="view-client"]')).toHaveClass(/bg-primary-100/);
  });

  test('should show hover tooltips on view buttons', async ({ page }) => {
    // Hover over List View
    await page.hover('[data-test="view-list"]');
    await expect(page.locator('[role="tooltip"]:has-text("List View")')).toBeVisible();
    
    // Hover over Grid View
    await page.hover('[data-test="view-grid"]');
    await expect(page.locator('[role="tooltip"]:has-text("Grid View")')).toBeVisible();
    
    // Hover over Client View
    await page.hover('[data-test="view-client"]');
    await expect(page.locator('[role="tooltip"]:has-text("Group by Client")')).toBeVisible();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // If no jobs, should show appropriate message
    const jobCards = page.locator('[data-test="job-card"]');
    const jobCount = await jobCards.count();
    
    if (jobCount === 0) {
      await expect(page.locator('text=/no.*jobs|create.*first.*job/i')).toBeVisible();
    } else {
      // If jobs exist, test the UI
      await expect(jobCards.first()).toBeVisible();
    }
  });

  test('should display toolbar with correct buttons', async ({ page }) => {
    // Check search bar
    await expect(page.locator('[data-test="search-jobs"]')).toBeVisible();
    
    // Check create job button
    await expect(page.locator('[data-test="create-job-btn"]')).toBeVisible();
    
    // In list view, should show expand/collapse button
    await page.click('[data-test="view-list"]');
    const toggleButton = page.locator('[data-test="toggle-view-all"]');
    
    // Button should exist in list view
    await expect(toggleButton).toBeVisible();
    
    // Button text should be one of the expected values
    const buttonText = await toggleButton.textContent();
    expect(['Expand All', 'Single Row All', 'Compact All']).toContain(buttonText?.trim());
    
    // In grid view, button should be hidden
    await page.click('[data-test="view-grid"]');
    await expect(toggleButton).not.toBeVisible();
  });

  test('should verify job card has blue bracket', async ({ page }) => {
    const jobCards = page.locator('[data-test="job-card"]');
    const cardCount = await jobCards.count();
    
    if (cardCount > 0) {
      // Check all views
      const views = ['list', 'grid', 'client'];
      
      for (const view of views) {
        await page.click(`[data-test="view-${view}"]`);
        await page.waitForTimeout(500); // Wait for view transition
        
        // Get first visible card
        let card;
        if (view === 'client') {
          // In client view, cards are nested under client sections
          card = page.locator('[data-test="client-section"]').first().locator('[data-test="job-card"]').first();
        } else {
          card = page.locator('[data-test="job-card"]').first();
        }
        
        // Check for blue bracket class
        if (await card.isVisible()) {
          const classes = await card.getAttribute('class');
          expect(classes).toContain('border-l-4');
          expect(classes).toMatch(/border-l-(primary-500|blue-500)/);
        }
      }
    }
  });

  test('should handle job card interactions', async ({ page }) => {
    await page.click('[data-test="view-list"]');
    
    const jobCard = page.locator('[data-test="job-card"]').first();
    const cardCount = await page.locator('[data-test="job-card"]').count();
    
    if (cardCount > 0) {
      // Test hover state
      await jobCard.hover();
      
      // Menu button should be visible on hover
      const menuButton = jobCard.locator('[data-test="job-menu-button"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        
        // Menu should open
        await expect(page.locator('[data-test="job-menu"]')).toBeVisible();
        
        // Close menu
        await page.keyboard.press('Escape');
      }
      
      // Test expand button if present
      const expandButton = jobCard.locator('[data-test="expand-button"]');
      if (await expandButton.isVisible()) {
        // Get initial height
        const initialBox = await jobCard.boundingBox();
        const initialHeight = initialBox?.height || 0;
        
        // Click expand
        await expandButton.click();
        await page.waitForTimeout(300); // Wait for animation
        
        // Card should be expanded
        const expandedBox = await jobCard.boundingBox();
        const expandedHeight = expandedBox?.height || 0;
        
        expect(expandedHeight).toBeGreaterThan(initialHeight);
      }
    }
  });

  test('should verify grid view shows pipeline', async ({ page }) => {
    await page.click('[data-test="view-grid"]');
    await page.waitForTimeout(500);
    
    const gridCard = page.locator('[data-test="job-card"]').first();
    const cardCount = await page.locator('[data-test="job-card"]').count();
    
    if (cardCount > 0 && await gridCard.isVisible()) {
      // Should show pipeline kanban
      const pipeline = gridCard.locator('[data-test="pipeline-kanban"]');
      await expect(pipeline).toBeVisible();
      
      // Should have all stages
      const stages = ['sourced', 'screened', 'interview', 'offer', 'hired'];
      for (const stage of stages) {
        await expect(gridCard.locator(`[data-test="stage-${stage}"]`)).toBeVisible();
      }
    }
  });

  test('should verify client view grouping', async ({ page }) => {
    await page.click('[data-test="view-client"]');
    await page.waitForTimeout(500);
    
    const clientSections = page.locator('[data-test="client-section"]');
    const sectionCount = await clientSections.count();
    
    if (sectionCount > 0) {
      // Each section should have client name and job count
      const firstSection = clientSections.first();
      await expect(firstSection.locator('[data-test="client-name"]')).toBeVisible();
      await expect(firstSection.locator('[data-test="job-count"]')).toBeVisible();
      
      // Should have jobs under the section
      await expect(firstSection.locator('[data-test="job-card"]').first()).toBeVisible();
      
      // Toggle button should exist
      const toggleButton = firstSection.locator('[data-test="toggle-view-all"]');
      await expect(toggleButton).toBeVisible();
    }
  });

  test('should not show star icon in job titles', async ({ page }) => {
    const jobCards = page.locator('[data-test="job-card"]');
    const cardCount = await jobCards.count();
    
    if (cardCount > 0) {
      // Check in all views
      for (const view of ['list', 'grid', 'client']) {
        await page.click(`[data-test="view-${view}"]`);
        await page.waitForTimeout(300);
        
        // Get job title elements
        const titleElements = page.locator('[data-test="job-title"]');
        const titleCount = await titleElements.count();
        
        // Check first few titles for star icon
        for (let i = 0; i < Math.min(3, titleCount); i++) {
          const titleText = await titleElements.nth(i).textContent();
          expect(titleText).not.toContain('⭐');
          expect(titleText).not.toContain('★');
          
          // Also check for star SVG or icon element
          const starIcon = titleElements.nth(i).locator('svg[data-icon="star"], .star-icon, [class*="star"]');
          await expect(starIcon).not.toBeVisible();
        }
      }
    }
  });

  test('should handle responsive behavior', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // View buttons should still work
    await expect(page.locator('[data-test="view-list"]')).toBeVisible();
    await expect(page.locator('[data-test="view-grid"]')).toBeVisible();
    await expect(page.locator('[data-test="view-client"]')).toBeVisible();
    
    // Grid should adjust columns
    await page.click('[data-test="view-grid"]');
    const container = page.locator('[data-test="jobs-container"]');
    const classes = await container.getAttribute('class');
    expect(classes).toContain('grid-cols-1'); // Single column on mobile
    
    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
});
