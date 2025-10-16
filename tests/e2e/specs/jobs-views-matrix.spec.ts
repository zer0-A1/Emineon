import { test, expect } from '@playwright/test';
import { mockAuthentication, waitForApp } from '../helpers/auth';

/**
 * Comprehensive test suite for all job view modes and interactions
 * Tests the complete matrix of view modes, card states, and UI behaviors
 */
test.describe('Jobs Page - Complete View Matrix Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await page.goto('/jobs');
    await waitForApp(page);
  });

  test.describe('View Mode Transitions', () => {
    test('should correctly transition between all view modes', async ({ page }) => {
      // Start in default view (should be single-row)
      await expect(page.locator('[data-test="job-card"]').first()).toHaveClass(/h-16/);
      
      // Switch to List View
      await page.click('[data-test="view-list"]');
      await expect(page.locator('[data-test="jobs-container"]')).toHaveClass(/flex-col/);
      await expect(page.locator('[data-test="view-list"]')).toHaveClass(/bg-primary-100/);
      
      // Switch to Grid View
      await page.click('[data-test="view-grid"]');
      await expect(page.locator('[data-test="jobs-container"]')).toHaveClass(/grid/);
      await expect(page.locator('[data-test="view-grid"]')).toHaveClass(/bg-primary-100/);
      
      // Switch to Group by Client View
      await page.click('[data-test="view-client"]');
      await expect(page.locator('[data-test="client-section"]').first()).toBeVisible();
      await expect(page.locator('[data-test="view-client"]')).toHaveClass(/bg-primary-100/);
    });

    test('should persist view mode in session storage', async ({ page }) => {
      // Set to grid view
      await page.click('[data-test="view-grid"]');
      
      // Reload page
      await page.reload();
      await waitForApp(page);
      
      // Should still be in grid view
      await expect(page.locator('[data-test="jobs-container"]')).toHaveClass(/grid/);
      await expect(page.locator('[data-test="view-grid"]')).toHaveClass(/bg-primary-100/);
    });
  });

  test.describe('Card State Management', () => {
    test('should cycle through card states correctly', async ({ page }) => {
      await page.click('[data-test="view-list"]');
      
      const firstCard = page.locator('[data-test="job-card"]').first();
      const expandButton = firstCard.locator('[data-test="expand-button"]');
      
      // Start in compact state (single-row)
      await expect(firstCard).toHaveClass(/h-16/);
      
      // Click to detailed state
      await expandButton.click();
      await expect(firstCard.locator('[data-test="detailed-info"]')).toBeVisible();
      await expect(firstCard).not.toHaveClass(/h-16/);
      
      // Click to row state
      await expandButton.click();
      await expect(firstCard).toHaveClass(/h-20/);
      
      // Click back to compact
      await expandButton.click();
      await expect(firstCard).toHaveClass(/h-16/);
    });

    test('should handle bulk state changes', async ({ page }) => {
      await page.click('[data-test="view-list"]');
      
      // Click toolbar button to expand all
      await page.click('[data-test="toggle-view-all"]');
      
      // All cards should be expanded
      const cards = page.locator('[data-test="job-card"]');
      const count = await cards.count();
      for (let i = 0; i < Math.min(3, count); i++) {
        await expect(cards.nth(i).locator('[data-test="detailed-info"]')).toBeVisible();
      }
      
      // Click again for single row
      await page.click('[data-test="toggle-view-all"]');
      
      // All cards should be single row
      for (let i = 0; i < Math.min(3, count); i++) {
        await expect(cards.nth(i)).toHaveClass(/h-20/);
      }
    });

    test('should maintain individual card states when bulk toggling', async ({ page }) => {
      await page.click('[data-test="view-list"]');
      
      // Expand first card individually
      const firstCard = page.locator('[data-test="job-card"]').first();
      await firstCard.locator('[data-test="expand-button"]').click();
      
      // Bulk toggle
      await page.click('[data-test="toggle-view-all"]');
      
      // First card should maintain its state
      await expect(firstCard.locator('[data-test="detailed-info"]')).toBeVisible();
    });
  });

  test.describe('List View Specific Tests', () => {
    test('should display correct elements in single-row view', async ({ page }) => {
      await page.click('[data-test="view-list"]');
      
      const card = page.locator('[data-test="job-card"]').first();
      
      // Should show minimal info
      await expect(card.locator('[data-test="job-title"]')).toBeVisible();
      await expect(card.locator('[data-test="client-name"]')).toBeVisible();
      await expect(card.locator('[data-test="job-location"]')).toBeVisible();
      await expect(card.locator('[data-test="job-status"]')).toBeVisible();
      await expect(card.locator('[data-test="candidate-count"]')).toBeVisible();
      
      // Should NOT show detailed info
      await expect(card.locator('[data-test="job-description"]')).not.toBeVisible();
      await expect(card.locator('[data-test="pipeline-stages"]')).not.toBeVisible();
    });

    test('should make single-row cards clickable', async ({ page }) => {
      await page.click('[data-test="view-list"]');
      
      const card = page.locator('[data-test="job-card"]').first();
      const jobTitle = await card.locator('[data-test="job-title"]').textContent();
      
      // Click on card body (not buttons)
      await card.click({ position: { x: 100, y: 30 } });
      
      // Should navigate to job detail
      await expect(page).toHaveURL(/\/jobs\/[a-zA-Z0-9-]+$/);
      await expect(page.locator('h1')).toContainText(jobTitle || '');
    });

    test('should show blue bracket on all card states', async ({ page }) => {
      await page.click('[data-test="view-list"]');
      
      const card = page.locator('[data-test="job-card"]').first();
      
      // Check compact state
      await expect(card).toHaveClass(/border-l-4.*border-l-primary-500/);
      
      // Check detailed state
      await card.locator('[data-test="expand-button"]').click();
      await expect(card).toHaveClass(/border-l-4.*border-l-primary-500/);
      
      // Check row state
      await card.locator('[data-test="expand-button"]').click();
      await expect(card).toHaveClass(/border-l-4.*border-l-primary-500/);
    });
  });

  test.describe('Grid View Specific Tests', () => {
    test('should display vertical pipeline kanban', async ({ page }) => {
      await page.click('[data-test="view-grid"]');
      
      const card = page.locator('[data-test="job-card"]').first();
      
      // Should show pipeline
      await expect(card.locator('[data-test="pipeline-kanban"]')).toBeVisible();
      
      // Should show all stages
      const stages = ['sourced', 'screened', 'interview', 'offer', 'hired'];
      for (const stage of stages) {
        await expect(card.locator(`[data-test="stage-${stage}"]`)).toBeVisible();
      }
    });

    test('should show candidate chips in pipeline', async ({ page }) => {
      await page.click('[data-test="view-grid"]');
      
      const card = page.locator('[data-test="job-card"]').first();
      
      // Should show candidate chips
      const chips = card.locator('[data-test="candidate-chip"]');
      if (await chips.count() > 0) {
        await expect(chips.first()).toBeVisible();
        await expect(chips.first()).toHaveClass(/rounded-full/);
      }
    });

    test('should maintain proper grid layout', async ({ page }) => {
      await page.click('[data-test="view-grid"]');
      
      const container = page.locator('[data-test="jobs-container"]');
      await expect(container).toHaveClass(/grid/);
      await expect(container).toHaveClass(/grid-cols-1.*md:grid-cols-2.*lg:grid-cols-3/);
      
      // Cards should be consistent height
      const cards = page.locator('[data-test="job-card"]');
      const count = await cards.count();
      if (count > 1) {
        const firstCardBox = await cards.first().boundingBox();
        const secondCardBox = await cards.nth(1).boundingBox();
        expect(firstCardBox?.height).toBe(secondCardBox?.height);
      }
    });

    test('should align buttons properly in grid view', async ({ page }) => {
      await page.click('[data-test="view-grid"]');
      
      const card = page.locator('[data-test="job-card"]').first();
      
      // Buttons should be at bottom
      const buttonContainer = card.locator('[data-test="card-actions"]');
      await expect(buttonContainer).toBeVisible();
      await expect(buttonContainer).toHaveClass(/mt-auto/);
      
      // All buttons should be aligned
      await expect(buttonContainer.locator('[data-test="view-details"]')).toBeVisible();
      await expect(buttonContainer.locator('[data-test="add-candidate-dropdown"]')).toBeVisible();
    });

    test('should not allow expand/collapse in grid view', async ({ page }) => {
      await page.click('[data-test="view-grid"]');
      
      // Toolbar toggle should be hidden
      await expect(page.locator('[data-test="toggle-view-all"]')).not.toBeVisible();
      
      // Cards should not have expand buttons
      const card = page.locator('[data-test="job-card"]').first();
      await expect(card.locator('[data-test="expand-button"]')).not.toBeVisible();
    });
  });

  test.describe('Group by Client View Tests', () => {
    test('should group jobs by client correctly', async ({ page }) => {
      await page.click('[data-test="view-client"]');
      
      // Should show client sections
      const sections = page.locator('[data-test="client-section"]');
      await expect(sections.first()).toBeVisible();
      
      // Each section should have client header
      const firstSection = sections.first();
      await expect(firstSection.locator('[data-test="client-name"]')).toBeVisible();
      await expect(firstSection.locator('[data-test="job-count"]')).toBeVisible();
      
      // Should have jobs under each client
      await expect(firstSection.locator('[data-test="job-card"]').first()).toBeVisible();
    });

    test('should default to single-row view in client groups', async ({ page }) => {
      await page.click('[data-test="view-client"]');
      
      const card = page.locator('[data-test="client-section"]').first().locator('[data-test="job-card"]').first();
      await expect(card).toHaveClass(/h-16/);
    });

    test('should handle expand/collapse per client section', async ({ page }) => {
      await page.click('[data-test="view-client"]');
      
      const section = page.locator('[data-test="client-section"]').first();
      
      // Expand all in this section
      await section.locator('[data-test="toggle-view-all"]').click();
      
      // Cards in this section should be expanded
      const cards = section.locator('[data-test="job-card"]');
      await expect(cards.first().locator('[data-test="detailed-info"]')).toBeVisible();
      
      // Other sections should not be affected
      const otherSection = page.locator('[data-test="client-section"]').nth(1);
      if (await otherSection.isVisible()) {
        const otherCard = otherSection.locator('[data-test="job-card"]').first();
        await expect(otherCard).toHaveClass(/h-16/);
      }
    });

    test('should maintain blue bracket in client view', async ({ page }) => {
      await page.click('[data-test="view-client"]');
      
      const cards = page.locator('[data-test="job-card"]');
      const count = await cards.count();
      
      for (let i = 0; i < Math.min(3, count); i++) {
        await expect(cards.nth(i)).toHaveClass(/border-l-4.*border-l-primary-500/);
      }
    });
  });

  test.describe('Toolbar Button States', () => {
    test('should show correct button text in list view', async ({ page }) => {
      await page.click('[data-test="view-list"]');
      
      const button = page.locator('[data-test="toggle-view-all"]');
      
      // Initially should show "Expand All"
      await expect(button).toContainText('Expand All');
      
      // After clicking, should show "Single Row All"
      await button.click();
      await expect(button).toContainText('Single Row All');
      
      // After clicking again, should show "Compact All"
      await button.click();
      await expect(button).toContainText('Compact All');
    });

    test('should show correct button text in client view', async ({ page }) => {
      await page.click('[data-test="view-client"]');
      
      const section = page.locator('[data-test="client-section"]').first();
      const button = section.locator('[data-test="toggle-view-all"]');
      
      // Should have same behavior as list view
      await expect(button).toContainText('Expand All');
      
      await button.click();
      await expect(button).toContainText('Single Row All');
    });

    test('should hide toolbar button in grid view', async ({ page }) => {
      await page.click('[data-test="view-grid"]');
      
      // Toolbar button should not be visible
      await expect(page.locator('[data-test="toggle-view-all"]')).not.toBeVisible();
    });
  });

  test.describe('Search and Filter Integration', () => {
    test('should maintain view mode when searching', async ({ page }) => {
      // Set to grid view
      await page.click('[data-test="view-grid"]');
      
      // Search
      await page.fill('[data-test="search-jobs"]', 'Developer');
      await page.waitForTimeout(1000);
      
      // Should still be in grid view
      await expect(page.locator('[data-test="jobs-container"]')).toHaveClass(/grid/);
    });

    test('should maintain card states when filtering', async ({ page }) => {
      await page.click('[data-test="view-list"]');
      
      // Expand first card
      const firstCard = page.locator('[data-test="job-card"]').first();
      await firstCard.locator('[data-test="expand-button"]').click();
      
      // Apply filter
      await page.click('[data-test="filter-button"]');
      await page.click('[data-test="filter-status-active"]');
      await page.click('[data-test="apply-filters"]');
      
      // Expanded state should persist
      if (await firstCard.isVisible()) {
        await expect(firstCard.locator('[data-test="detailed-info"]')).toBeVisible();
      }
    });
  });

  test.describe('Hover States and Tooltips', () => {
    test('should show tooltips on view toggle buttons', async ({ page }) => {
      // List view tooltip
      await page.hover('[data-test="view-list"]');
      await expect(page.locator('text="List View"')).toBeVisible();
      
      // Grid view tooltip
      await page.hover('[data-test="view-grid"]');
      await expect(page.locator('text="Grid View"')).toBeVisible();
      
      // Client view tooltip
      await page.hover('[data-test="view-client"]');
      await expect(page.locator('text="Group by Client"')).toBeVisible();
    });
  });

  test.describe('Job Card Actions', () => {
    test('should handle card actions in all views', async ({ page }) => {
      const views = ['list', 'grid', 'client'];
      
      for (const view of views) {
        await page.click(`[data-test="view-${view}"]`);
        
        const card = view === 'client' 
          ? page.locator('[data-test="client-section"]').first().locator('[data-test="job-card"]').first()
          : page.locator('[data-test="job-card"]').first();
        
        // Menu should work
        await card.hover();
        await card.locator('[data-test="job-menu-button"]').click();
        await expect(page.locator('[data-test="job-menu"]')).toBeVisible();
        
        // Close menu
        await page.keyboard.press('Escape');
      }
    });

    test('should prevent event bubbling on button clicks', async ({ page }) => {
      await page.click('[data-test="view-list"]');
      
      const card = page.locator('[data-test="job-card"]').first();
      
      // Click menu button should not navigate
      await card.locator('[data-test="job-menu-button"]').click();
      await expect(page).toHaveURL(/\/jobs$/);
      
      // Click expand button should not navigate
      await page.keyboard.press('Escape');
      await card.locator('[data-test="expand-button"]').click();
      await expect(page).toHaveURL(/\/jobs$/);
    });
  });

  test.describe('Error Handling in Views', () => {
    test('should handle jobs with missing data gracefully', async ({ page }) => {
      // This assumes some jobs might have missing applications array
      await page.click('[data-test="view-grid"]');
      
      // Should not crash when rendering pipeline
      await expect(page.locator('[data-test="job-card"]').first()).toBeVisible();
      
      // Check console for errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Switch views - should not cause errors
      await page.click('[data-test="view-list"]');
      await page.click('[data-test="view-client"]');
      
      // No TypeError should occur
      expect(consoleErrors.filter(e => e.includes('TypeError'))).toHaveLength(0);
    });
  });

  test.describe('Performance in Different Views', () => {
    test('should render large job lists efficiently', async ({ page }) => {
      // List view performance
      const listStart = Date.now();
      await page.click('[data-test="view-list"]');
      await page.waitForSelector('[data-test="job-card"]');
      const listTime = Date.now() - listStart;
      expect(listTime).toBeLessThan(1000);
      
      // Grid view performance
      const gridStart = Date.now();
      await page.click('[data-test="view-grid"]');
      await page.waitForSelector('[data-test="job-card"]');
      const gridTime = Date.now() - gridStart;
      expect(gridTime).toBeLessThan(1500); // Grid view might be slower due to pipeline rendering
      
      // Client view performance
      const clientStart = Date.now();
      await page.click('[data-test="view-client"]');
      await page.waitForSelector('[data-test="client-section"]');
      const clientTime = Date.now() - clientStart;
      expect(clientTime).toBeLessThan(1000);
    });
  });
});
