import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { seedTestCandidates, seedTestJobs } from '../helpers/test-user-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

test.describe('Performance and Optimization Tests', () => {
  let testProjectId: string;

  test.beforeAll(async () => {
    testProjectId = process.env.TEST_PROJECT_ID || '';
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.describe('Page Load Performance', () => {
    test('should load candidates page within acceptable time', async ({ page }) => {
      // Seed a large number of candidates
      await seedTestCandidates(50);
      
      const startTime = Date.now();
      await page.goto('/candidates');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Verify candidates are displayed
      await expect(page.getByTestId('candidate-card').first()).toBeVisible({ timeout: 1000 });
    });

    test('should handle large job pipeline efficiently', async ({ page }) => {
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(30);
      
      // Add all candidates to the job
      const job = await prisma.job.findUnique({ where: { id: jobs[0].id } });
      
      await Promise.all(
        candidates.map(candidate => 
          prisma.application.create({
            data: {
              jobId: job!.id,
              candidateId: candidate.id,
              status: 'PENDING',
              stage: 'sourced',
            }
          })
        )
      );
      
      const startTime = Date.now();
      await page.goto(`/jobs/${job!.id}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Pipeline should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Verify candidates are displayed
      await expect(page.getByTestId('candidate-card').first()).toBeVisible({ timeout: 1000 });
      
      // Cleanup
      await prisma.application.deleteMany({ where: { jobId: job!.id } });
    });
  });

  test.describe('Search Performance', () => {
    test('should search candidates efficiently', async ({ page }) => {
      await seedTestCandidates(100);
      
      await page.goto('/candidates');
      await page.waitForLoadState('networkidle');
      
      // Measure search response time
      const searchInput = page.getByTestId('search-candidates');
      
      const startTime = Date.now();
      await searchInput.fill('Developer');
      
      // Wait for search results to update
      await page.waitForTimeout(600); // Debounce + processing
      const searchTime = Date.now() - startTime;
      
      // Search should complete within 1 second
      expect(searchTime).toBeLessThan(1000);
      
      // Verify results are filtered
      const resultsCount = await page.getByTestId('candidate-card').count();
      expect(resultsCount).toBeGreaterThan(0);
      expect(resultsCount).toBeLessThan(100); // Should be filtered
    });

    test('should handle complex search queries', async ({ page }) => {
      await page.goto('/candidates');
      
      // Complex search with multiple terms
      const searchInput = page.getByTestId('search-candidates');
      await searchInput.fill('Senior Developer TypeScript React Node.js');
      
      await page.waitForTimeout(600);
      
      // Should return relevant results
      const resultsCount = await page.getByTestId('candidate-card').count();
      expect(resultsCount).toBeGreaterThan(0);
    });
  });

  test.describe('UI Responsiveness', () => {
    test('should handle rapid interactions smoothly', async ({ page }) => {
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(10);
      
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Rapidly add multiple candidates
      for (let i = 0; i < 5; i++) {
        await page.getByTestId('add-candidate-dropdown').click();
        await page.getByTestId('add-existing-candidate').click();
        await page.waitForSelector('text=Select Candidates', { timeout: 2000 });
        await page.locator(`text=${candidates[i].firstName} ${candidates[i].lastName}`).first().click();
        await page.getByRole('button', { name: 'Add Selected' }).click();
        
        // Should not freeze or crash
        await expect(page.getByTestId('pipeline-stage').first()).toBeVisible();
      }
      
      // All candidates should be visible
      const addedCandidates = await page.getByTestId('candidate-card').count();
      expect(addedCandidates).toBe(5);
    });

    test('should handle view mode switching efficiently', async ({ page }) => {
      await seedTestCandidates(50);
      await page.goto('/candidates');
      
      // Switch between view modes rapidly
      for (let i = 0; i < 5; i++) {
        const viewButton = page.getByTestId(i % 2 === 0 ? 'view-list' : 'view-grid');
        
        const startTime = Date.now();
        await viewButton.click();
        await page.waitForLoadState('domcontentloaded');
        const switchTime = Date.now() - startTime;
        
        // View switch should be instant (< 500ms)
        expect(switchTime).toBeLessThan(500);
      }
    });
  });

  test.describe('Data Loading Optimization', () => {
    test('should implement pagination or virtualization for large datasets', async ({ page }) => {
      // Create a large dataset
      const candidateEmails = Array.from({ length: 200 }, (_, i) => 
        `perf-test-${Date.now()}-${i}@example.com`
      );
      
      await prisma.candidate.createMany({
        data: candidateEmails.map((email, i) => ({
          email,
          firstName: `Perf${i}`,
          lastName: 'Test',
          lastUpdated: new Date(),
          currentTitle: `Developer ${i}`,
          experienceYears: Math.floor(Math.random() * 10) + 1,
        }))
      });
      
      await page.goto('/candidates');
      
      // Check if pagination or lazy loading is implemented
      const initialCards = await page.getByTestId('candidate-card').count();
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      const afterScrollCards = await page.getByTestId('candidate-card').count();
      
      // Either pagination (limited initial load) or infinite scroll (more after scroll)
      expect(initialCards).toBeLessThanOrEqual(100); // Reasonable initial load
      
      // Cleanup
      await prisma.candidate.deleteMany({
        where: { email: { in: candidateEmails } }
      });
    });
  });

  test.describe('Memory Management', () => {
    test('should not leak memory during extended use', async ({ page, context }) => {
      // Monitor memory usage during repeated operations
      const metrics = [];
      
      for (let i = 0; i < 10; i++) {
        await page.goto('/candidates');
        await page.waitForLoadState('networkidle');
        
        // Perform some operations
        await page.getByTestId('search-candidates').fill(`Test ${i}`);
        await page.waitForTimeout(500);
        
        // Navigate to jobs
        await page.goto('/jobs');
        await page.waitForLoadState('networkidle');
        
        // Collect metrics
        const performanceMetrics = await page.evaluate(() => {
          if ('memory' in performance) {
            return {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            };
          }
          return null;
        });
        
        if (performanceMetrics) {
          metrics.push(performanceMetrics);
        }
      }
      
      // Memory usage should not continuously increase
      if (metrics.length > 2) {
        const firstHeapSize = metrics[0].usedJSHeapSize;
        const lastHeapSize = metrics[metrics.length - 1].usedJSHeapSize;
        
        // Allow for some increase but not more than 50%
        expect(lastHeapSize).toBeLessThan(firstHeapSize * 1.5);
      }
    });
  });

  test.describe('Concurrent Request Handling', () => {
    test('should handle multiple simultaneous API requests', async ({ page }) => {
      const jobs = await seedTestJobs(testProjectId, 3);
      
      await page.goto('/jobs');
      
      // Open multiple job detail pages in quick succession
      const pagePromises = jobs.map(async (job) => {
        const newPage = await page.context().newPage();
        await newPage.goto(`/jobs/${job.id}`);
        return newPage;
      });
      
      const pages = await Promise.all(pagePromises);
      
      // All pages should load successfully
      for (const p of pages) {
        await expect(p.locator('[data-test="pipeline-stage"]').first()).toBeVisible();
        await p.close();
      }
    });
  });

  test.describe('Optimistic UI Updates', () => {
    test('should provide immediate feedback for user actions', async ({ page }) => {
      const jobs = await seedTestJobs(testProjectId, 1);
      const candidates = await seedTestCandidates(1);
      
      await page.goto(`/jobs/${jobs[0].id}`);
      
      // Add candidate
      await page.getByTestId('add-candidate-dropdown').click();
      await page.getByTestId('add-existing-candidate').click();
      await page.waitForSelector('text=Select Candidates');
      await page.locator(`text=${candidates[0].firstName} ${candidates[0].lastName}`).first().click();
      
      // Measure time from click to UI update
      const startTime = Date.now();
      await page.getByRole('button', { name: 'Add Selected' }).click();
      
      // Candidate should appear immediately (optimistic update)
      await expect(page.getByTestId('candidate-card').first()).toBeVisible({ timeout: 500 });
      const updateTime = Date.now() - startTime;
      
      // UI should update within 500ms
      expect(updateTime).toBeLessThan(500);
    });
  });
});
