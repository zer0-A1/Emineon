import { test, expect } from '@playwright/test';
import { mockAuthentication, waitForApp } from '../helpers/auth';
import { seedTestCandidates, seedTestJobs } from '../helpers/test-user-pg';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    
    // Seed test data
    const userId = process.env.TEST_USER_ID || 'test-user-playwright';
    const projectId = process.env.TEST_PROJECT_ID || '';
    
    // Seed diverse candidates for search
    await seedTestCandidates(userId, 10);
    await seedTestJobs(projectId, 5);
    
    await page.goto('/search');
    await waitForApp(page);
  });

  test.describe('Global Search', () => {
    test('should search across all entities', async ({ page }) => {
      // Enter search query
      await page.fill('[data-test="global-search-input"]', 'Developer');
      await page.keyboard.press('Enter');
      
      // Verify search results sections
      await expect(page.locator('[data-test="search-results"]')).toBeVisible();
      await expect(page.locator('[data-test="candidates-results"]')).toBeVisible();
      await expect(page.locator('[data-test="jobs-results"]')).toBeVisible();
      
      // Verify at least one result in each category
      await expect(page.locator('[data-test="candidate-result"]').first()).toBeVisible();
      await expect(page.locator('[data-test="job-result"]').first()).toBeVisible();
    });

    test('should show search suggestions', async ({ page }) => {
      // Start typing
      await page.fill('[data-test="global-search-input"]', 'Sen');
      
      // Wait for suggestions
      await expect(page.locator('[data-test="search-suggestions"]')).toBeVisible();
      
      // Verify suggestions appear
      await expect(page.locator('[data-test="suggestion-item"]').first()).toBeVisible();
      
      // Click a suggestion
      await page.click('[data-test="suggestion-item"]').first();
      
      // Verify search executed
      await expect(page.locator('[data-test="search-results"]')).toBeVisible();
    });

    test('should filter search results by type', async ({ page }) => {
      // Perform search
      await page.fill('[data-test="global-search-input"]', 'Engineer');
      await page.keyboard.press('Enter');
      
      // Filter by candidates only
      await page.click('[data-test="filter-type-candidates"]');
      
      // Verify only candidate results shown
      await expect(page.locator('[data-test="candidates-results"]')).toBeVisible();
      await expect(page.locator('[data-test="jobs-results"]')).not.toBeVisible();
      
      // Filter by jobs only
      await page.click('[data-test="filter-type-jobs"]');
      
      // Verify only job results shown
      await expect(page.locator('[data-test="jobs-results"]')).toBeVisible();
      await expect(page.locator('[data-test="candidates-results"]')).not.toBeVisible();
    });

    test('should handle empty search results', async ({ page }) => {
      // Search for non-existent term
      await page.fill('[data-test="global-search-input"]', 'xyznonexistent123');
      await page.keyboard.press('Enter');
      
      // Verify no results message
      await expect(page.locator('[data-test="no-results"]')).toBeVisible();
      await expect(page.locator('text=No results found')).toBeVisible();
    });
  });

  test.describe('Candidate Search', () => {
    test('should search candidates by name', async ({ page }) => {
      await page.goto('/candidates');
      
      // Search by first name
      await page.fill('[data-test="search-candidates"]', 'Test1');
      await page.keyboard.press('Enter');
      
      // Verify results
      await expect(page.locator('[data-test="candidate-row"]:has-text("Test1")')).toBeVisible();
      await expect(page.locator('[data-test="candidate-row"]')).toHaveCount(1);
    });

    test('should search candidates by skills', async ({ page }) => {
      await page.goto('/candidates');
      
      // Search by skill
      await page.fill('[data-test="search-candidates"]', 'JavaScript');
      await page.keyboard.press('Enter');
      
      // Verify results show candidates with JavaScript skill
      const results = page.locator('[data-test="candidate-row"]');
      await expect(results.first()).toBeVisible();
      
      // Click on first result to verify skills
      await results.first().click();
      await expect(page.locator('[data-test="candidate-skills"]:has-text("JavaScript")')).toBeVisible();
    });

    test('should search candidates by location', async ({ page }) => {
      await page.goto('/candidates');
      
      // Search by location
      await page.fill('[data-test="search-candidates"]', 'Test City');
      await page.keyboard.press('Enter');
      
      // Verify results
      const results = page.locator('[data-test="candidate-row"]');
      await expect(results.first()).toBeVisible();
    });

    test('should use advanced candidate filters', async ({ page }) => {
      await page.goto('/candidates');
      
      // Open advanced search
      await page.click('[data-test="advanced-search-button"]');
      
      // Set experience range
      await page.fill('[data-test="experience-min"]', '5');
      await page.fill('[data-test="experience-max"]', '10');
      
      // Set status
      await page.click('[data-test="status-filter"]');
      await page.click('[data-test="status-active"]');
      
      // Set availability
      await page.click('[data-test="availability-filter"]');
      await page.click('[data-test="availability-immediate"]');
      
      // Apply filters
      await page.click('[data-test="apply-advanced-search"]');
      
      // Verify filtered results
      const results = page.locator('[data-test="candidate-row"]');
      await expect(results.first()).toBeVisible();
      
      // Verify filters applied indicator
      await expect(page.locator('[data-test="active-filters-count"]')).toBeVisible();
    });

    test('should save search criteria', async ({ page }) => {
      await page.goto('/candidates');
      
      // Perform a search
      await page.fill('[data-test="search-candidates"]', 'Senior Developer');
      await page.keyboard.press('Enter');
      
      // Save search
      await page.click('[data-test="save-search-button"]');
      
      // Name the saved search
      await page.fill('[data-test="saved-search-name"]', 'Senior Developers Search');
      await page.click('[data-test="confirm-save-search"]');
      
      // Verify saved
      await expect(page.locator('[data-test="search-saved-message"]')).toBeVisible();
      
      // Access saved searches
      await page.click('[data-test="saved-searches-dropdown"]');
      await expect(page.locator('[data-test="saved-search-item"]:has-text("Senior Developers Search")')).toBeVisible();
    });
  });

  test.describe('Job Search', () => {
    test('should search jobs by title', async ({ page }) => {
      await page.goto('/jobs');
      
      // Search by job title
      await page.fill('[data-test="search-jobs"]', 'Full Stack');
      await page.keyboard.press('Enter');
      
      // Verify results
      await expect(page.locator('[data-test="job-card"]:has-text("Full Stack")')).toBeVisible();
    });

    test('should search jobs by location', async ({ page }) => {
      await page.goto('/jobs');
      
      // Search by location
      await page.fill('[data-test="search-jobs"]', 'Remote');
      await page.keyboard.press('Enter');
      
      // Verify results
      const results = page.locator('[data-test="job-card"]');
      await expect(results.first()).toBeVisible();
    });

    test('should use job search filters', async ({ page }) => {
      await page.goto('/jobs');
      
      // Open filters
      await page.click('[data-test="filter-button"]');
      
      // Filter by employment type
      await page.click('[data-test="employment-type-filter"]');
      await page.click('[data-test="employment-fulltime"]');
      
      // Filter by urgency
      await page.click('[data-test="urgency-filter"]');
      await page.click('[data-test="urgency-high"]');
      
      // Filter by status
      await page.click('[data-test="status-filter"]');
      await page.click('[data-test="status-active"]');
      
      // Apply filters
      await page.click('[data-test="apply-filters"]');
      
      // Verify results filtered
      await expect(page.locator('[data-test="job-card"]').first()).toBeVisible();
      await expect(page.locator('[data-test="active-filters"]')).toBeVisible();
    });
  });

  test.describe('Quick Search', () => {
    test('should use header quick search', async ({ page }) => {
      // Use the quick search in header
      await page.click('[data-test="header-search"]');
      await page.fill('[data-test="header-search-input"]', 'React');
      
      // Verify instant results dropdown
      await expect(page.locator('[data-test="quick-search-results"]')).toBeVisible();
      
      // Click view all results
      await page.click('[data-test="view-all-results"]');
      
      // Verify redirected to search page with results
      await expect(page).toHaveURL(/\/search\?q=React/);
      await expect(page.locator('[data-test="search-results"]')).toBeVisible();
    });

    test('should use keyboard shortcuts for search', async ({ page }) => {
      // Press Cmd/Ctrl + K to open search
      await page.keyboard.press('Control+k');
      
      // Verify search modal opens
      await expect(page.locator('[data-test="command-palette"]')).toBeVisible();
      
      // Type search query
      await page.keyboard.type('Developer');
      
      // Navigate results with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      
      // Select with Enter
      await page.keyboard.press('Enter');
      
      // Verify navigation to selected item
      await expect(page.locator('[data-test="candidate-detail"], [data-test="job-detail"]')).toBeVisible();
    });
  });

  test.describe('Search History', () => {
    test('should track search history', async ({ page }) => {
      // Perform multiple searches
      await page.fill('[data-test="global-search-input"]', 'JavaScript');
      await page.keyboard.press('Enter');
      
      await page.fill('[data-test="global-search-input"]', 'Senior Developer');
      await page.keyboard.press('Enter');
      
      await page.fill('[data-test="global-search-input"]', 'Remote');
      await page.keyboard.press('Enter');
      
      // Open search history
      await page.click('[data-test="search-history-button"]');
      
      // Verify recent searches
      await expect(page.locator('[data-test="history-item"]:has-text("Remote")')).toBeVisible();
      await expect(page.locator('[data-test="history-item"]:has-text("Senior Developer")')).toBeVisible();
      await expect(page.locator('[data-test="history-item"]:has-text("JavaScript")')).toBeVisible();
    });

    test('should clear search history', async ({ page }) => {
      // Perform a search
      await page.fill('[data-test="global-search-input"]', 'Test Search');
      await page.keyboard.press('Enter');
      
      // Open search history
      await page.click('[data-test="search-history-button"]');
      
      // Clear history
      await page.click('[data-test="clear-history-button"]');
      await page.click('[data-test="confirm-clear-history"]');
      
      // Verify history cleared
      await expect(page.locator('[data-test="history-empty"]')).toBeVisible();
    });
  });

  test.describe('AI-Powered Search', () => {
    test('should use AI search for natural language queries', async ({ page }) => {
      // Toggle AI search mode
      await page.click('[data-test="ai-search-toggle"]');
      
      // Enter natural language query
      await page.fill('[data-test="global-search-input"]', 'Find me senior developers with React experience available immediately');
      await page.keyboard.press('Enter');
      
      // Wait for AI processing
      await expect(page.locator('[data-test="ai-processing"]')).toBeVisible();
      await expect(page.locator('[data-test="ai-processing"]')).not.toBeVisible({ timeout: 10000 });
      
      // Verify smart results
      await expect(page.locator('[data-test="ai-search-results"]')).toBeVisible();
      await expect(page.locator('[data-test="relevance-score"]').first()).toBeVisible();
    });

    test('should show AI search explanations', async ({ page }) => {
      // Use AI search
      await page.click('[data-test="ai-search-toggle"]');
      await page.fill('[data-test="global-search-input"]', 'Developers who can start next week');
      await page.keyboard.press('Enter');
      
      // Wait for results
      await expect(page.locator('[data-test="ai-search-results"]')).toBeVisible();
      
      // Hover over result to see explanation
      await page.hover('[data-test="candidate-result"]').first();
      
      // Verify AI explanation tooltip
      await expect(page.locator('[data-test="ai-match-explanation"]')).toBeVisible();
      await expect(page.locator('[data-test="ai-match-explanation"]')).toContainText('availability');
    });
  });

  test.describe('Search Export', () => {
    test('should export search results', async ({ page }) => {
      // Perform a search
      await page.fill('[data-test="global-search-input"]', 'Developer');
      await page.keyboard.press('Enter');
      
      // Wait for results
      await expect(page.locator('[data-test="search-results"]')).toBeVisible();
      
      // Export results
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-test="export-results-button"]')
      ]);
      
      // Verify download
      expect(download.suggestedFilename()).toContain('search-results');
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/);
    });

    test('should select specific results for export', async ({ page }) => {
      // Perform a search
      await page.fill('[data-test="global-search-input"]', 'Engineer');
      await page.keyboard.press('Enter');
      
      // Select specific results
      await page.click('[data-test="result-checkbox"]').first();
      await page.click('[data-test="result-checkbox"]').nth(1);
      
      // Export selected
      await page.click('[data-test="export-selected-button"]');
      
      // Verify export options
      await expect(page.locator('[data-test="export-format-modal"]')).toBeVisible();
      
      // Select CSV format
      await page.click('[data-test="format-csv"]');
      
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-test="confirm-export"]')
      ]);
      
      // Verify download
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });
});
