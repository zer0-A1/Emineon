import { test, expect } from '@playwright/test';
import { mockAuthentication, waitForApp } from '../helpers/auth';

/**
 * Tests for data robustness, edge cases, and error handling
 * Ensures the application handles malformed data, missing fields, and API errors gracefully
 */
test.describe('Data Robustness & Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await waitForApp(page);
  });

  test.describe('Jobs Data Normalization', () => {
    test('should handle jobs with missing applications array', async ({ page }) => {
      // Mock API response with various data shapes
      await page.route('**/api/jobs', async (route) => {
        await route.fulfill({
          status: 200,
          json: {
            jobs: [
              {
                id: '1',
                title: 'Job with array',
                applications: [{ id: 'app1', candidateId: 'c1', status: 'sourced' }],
                client: { name: 'Client A' },
                pipeline: { sourced: 1, screened: 0, interview: 0, offer: 0, hired: 0 }
              },
              {
                id: '2',
                title: 'Job with null applications',
                applications: null,
                client: { name: 'Client B' },
                pipeline: { sourced: 0, screened: 0, interview: 0, offer: 0, hired: 0 }
              },
              {
                id: '3',
                title: 'Job with _applications',
                _applications: [{ id: 'app2', candidateId: 'c2', status: 'screened' }],
                client: { name: 'Client C' },
                pipeline: { sourced: 0, screened: 1, interview: 0, offer: 0, hired: 0 }
              },
              {
                id: '4',
                title: 'Job with no applications field',
                client: { name: 'Client D' },
                pipeline: { sourced: 0, screened: 0, interview: 0, offer: 0, hired: 0 }
              }
            ]
          }
        });
      });

      await page.goto('/jobs');

      // Should render all jobs without errors
      await expect(page.locator('[data-test="job-card"]')).toHaveCount(4);

      // Test grid view with pipeline
      await page.click('[data-test="view-grid"]');
      
      // Should not crash when rendering pipelines
      const cards = page.locator('[data-test="job-card"]');
      for (let i = 0; i < 4; i++) {
        await expect(cards.nth(i).locator('[data-test="pipeline-kanban"]')).toBeVisible();
      }

      // Check console for errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // No TypeError should occur
      expect(consoleErrors.filter(e => e.includes('TypeError'))).toHaveLength(0);
    });

    test('should handle jobs with missing client data', async ({ page }) => {
      await page.route('**/api/jobs', async (route) => {
        await route.fulfill({
          status: 200,
          json: {
            jobs: [
              {
                id: '1',
                title: 'Job with client',
                client: { name: 'Real Client', id: 'c1' }
              },
              {
                id: '2',
                title: 'Job with null client',
                client: null
              },
              {
                id: '3',
                title: 'Job with no client field'
              }
            ]
          }
        });
      });

      await page.goto('/jobs');

      // Test group by client view
      await page.click('[data-test="view-client"]');

      // Should handle missing clients gracefully
      await expect(page.locator('[data-test="client-section"]')).toBeVisible();
      
      // Should have "Unknown Client" section for jobs without clients
      await expect(page.locator('text=Unknown Client')).toBeVisible();
    });

    test('should handle malformed pipeline data', async ({ page }) => {
      await page.route('**/api/jobs', async (route) => {
        await route.fulfill({
          status: 200,
          json: {
            jobs: [
              {
                id: '1',
                title: 'Job with complete pipeline',
                pipeline: { sourced: 5, screened: 3, interview: 2, offer: 1, hired: 0 }
              },
              {
                id: '2',
                title: 'Job with partial pipeline',
                pipeline: { sourced: 2 }
              },
              {
                id: '3',
                title: 'Job with null pipeline',
                pipeline: null
              },
              {
                id: '4',
                title: 'Job with string pipeline values',
                pipeline: { sourced: '5', screened: 'three', interview: null }
              }
            ]
          }
        });
      });

      await page.goto('/jobs');
      await page.click('[data-test="view-grid"]');

      // All cards should render
      await expect(page.locator('[data-test="job-card"]')).toHaveCount(4);

      // Pipeline stages should handle bad data
      const cards = page.locator('[data-test="job-card"]');
      for (let i = 0; i < 4; i++) {
        const card = cards.nth(i);
        await expect(card.locator('[data-test="pipeline-kanban"]')).toBeVisible();
        
        // All stages should be present even with bad data
        const stages = ['sourced', 'screened', 'interview', 'offer', 'hired'];
        for (const stage of stages) {
          await expect(card.locator(`[data-test="stage-${stage}"]`)).toBeVisible();
        }
      }
    });
  });

  test.describe('Candidates Data Handling', () => {
    test('should handle candidates with missing fields', async ({ page }) => {
      await page.route('**/api/candidates', async (route) => {
        await route.fulfill({
          status: 200,
          json: {
            candidates: [
              {
                id: '1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                skills: ['React', 'Node.js']
              },
              {
                id: '2',
                firstName: 'Jane',
                // Missing lastName
                email: 'jane@example.com'
                // Missing skills
              },
              {
                id: '3',
                // Missing name fields
                email: 'anonymous@example.com'
              },
              {
                id: '4',
                firstName: 'Bob',
                lastName: 'Smith'
                // Missing email
              }
            ]
          }
        });
      });

      await page.goto('/candidates');

      // All candidates should render
      await expect(page.locator('[data-test="candidate-card"]')).toHaveCount(4);

      // Cards should handle missing data gracefully
      const cards = page.locator('[data-test="candidate-card"]');
      
      // Card with missing lastName
      await expect(cards.nth(1)).toContainText('Jane');
      
      // Card with missing name
      await expect(cards.nth(2)).toContainText('anonymous@example.com');
      
      // Card with missing email
      await expect(cards.nth(3)).toContainText('Bob Smith');
    });

    test('should handle CV parsing errors gracefully', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="upload-cv-btn"]');

      // Upload corrupted file
      await page.setInputFiles('[data-test="cv-file-input"]', {
        name: 'corrupted.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('corrupted pdf content')
      });

      // Mock parsing error
      await page.route('**/api/candidates/parse-cv', async (route) => {
        await route.fulfill({
          status: 400,
          json: { error: 'Failed to parse CV: Invalid PDF format' }
        });
      });

      await page.click('[data-test="upload-cv-submit"]');

      // Should show error message
      await expect(page.locator('[data-test="error-message"]')).toBeVisible();
      await expect(page.locator('text=Failed to parse CV')).toBeVisible();

      // Should allow retry
      await expect(page.locator('[data-test="retry-upload"]')).toBeVisible();
    });
  });

  test.describe('Search Error Handling', () => {
    test('should handle search API failures', async ({ page }) => {
      await page.goto('/candidates');

      // Mock search failure
      await page.route('**/api/candidates/search*', async (route) => {
        await route.fulfill({
          status: 500,
          json: { error: 'Search service unavailable' }
        });
      });

      // Perform search
      await page.fill('[data-test="search-input"]', 'test search');
      await page.waitForTimeout(1000);

      // Should show error state
      await expect(page.locator('[data-test="search-error"]')).toBeVisible();
      await expect(page.locator('text=Search service unavailable')).toBeVisible();

      // Should fall back to showing all candidates
      await expect(page.locator('[data-test="candidate-card"]').first()).toBeVisible();
    });

    test('should handle empty search results', async ({ page }) => {
      await page.goto('/candidates');

      await page.route('**/api/candidates/search*', async (route) => {
        await route.fulfill({
          status: 200,
          json: { candidates: [] }
        });
      });

      await page.fill('[data-test="search-input"]', 'no results query');
      await page.waitForTimeout(1000);

      // Should show no results message
      await expect(page.locator('[data-test="no-results"]')).toBeVisible();
      await expect(page.locator('text=No candidates found')).toBeVisible();

      // Should show search suggestions
      await expect(page.locator('[data-test="search-suggestions"]')).toBeVisible();
    });
  });

  test.describe('Document Generation Error Handling', () => {
    test('should handle competence file generation failures', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="candidate-card"]').first();
      await page.click('[data-test="generate-competence-file"]');

      // Mock generation failure
      await page.route('**/api/documents/generate-competence', async (route) => {
        await route.fulfill({
          status: 500,
          json: { error: 'Template rendering failed' }
        });
      });

      await page.selectOption('[data-test="template-select"]', 'antaes');
      await page.click('[data-test="generate-btn"]');

      // Should show error
      await expect(page.locator('[data-test="generation-error"]')).toBeVisible();
      await expect(page.locator('text=Template rendering failed')).toBeVisible();

      // Should allow retry
      await expect(page.locator('[data-test="retry-generation"]')).toBeVisible();
    });

    test('should handle PDF generation timeouts', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="candidate-card"]').first();
      await page.click('[data-test="tab-documents"]');
      await page.click('[data-test="generate-cv"]');

      // Mock timeout
      await page.route('**/api/documents/generate-pdf', async (route) => {
        // Delay response to simulate timeout
        await new Promise(resolve => setTimeout(resolve, 35000));
        await route.fulfill({
          status: 504,
          json: { error: 'PDF generation timed out' }
        });
      });

      await page.click('[data-test="generate-btn"]');

      // Should show timeout message after 30s
      await expect(page.locator('[data-test="generation-timeout"]')).toBeVisible({ timeout: 35000 });
      await expect(page.locator('text=generation is taking longer')).toBeVisible();
    });
  });

  test.describe('Pipeline Data Integrity', () => {
    test('should handle candidate status mismatches', async ({ page }) => {
      await page.route('**/api/jobs/*/candidates', async (route) => {
        await route.fulfill({
          status: 200,
          json: {
            candidates: [
              {
                id: '1',
                name: 'John Doe',
                status: 'invalid_status'
              },
              {
                id: '2',
                name: 'Jane Smith',
                status: null
              },
              {
                id: '3',
                name: 'Bob Johnson',
                status: 'SCREENED' // uppercase
              }
            ]
          }
        });
      });

      await page.goto('/jobs');
      await page.click('[data-test="job-card"]').first();

      // Should place candidates in appropriate stages
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Sourced")').locator('[data-test="candidate-card"]')).toHaveCount(2); // Invalid ones go to sourced
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Screened")').locator('[data-test="candidate-card"]')).toHaveCount(1);
    });

    test('should prevent invalid pipeline transitions', async ({ page }) => {
      await page.goto('/jobs');
      await page.click('[data-test="job-card"]').first();

      // Add candidate
      await page.click('[data-test="add-candidate-button"]');
      await page.click('[data-test="existing-candidate-tab"]');
      await page.click('[data-test="candidate-checkbox"]').first();
      await page.click('[data-test="add-to-job-button"]');

      // Try to drag from Sourced directly to Hired (invalid)
      const candidateCard = page.locator('[data-test="candidate-card"]').first();
      const hiredStage = page.locator('[data-test="pipeline-stage"]:has-text("Hired")');

      // Mock API rejection
      await page.route('**/api/candidates/*/status', async (route) => {
        await route.fulfill({
          status: 400,
          json: { error: 'Invalid status transition' }
        });
      });

      await candidateCard.dragTo(hiredStage);

      // Should show error
      await expect(page.locator('[data-test="transition-error"]')).toBeVisible();
      
      // Candidate should remain in original stage
      await expect(page.locator('[data-test="pipeline-stage"]:has-text("Sourced")').locator('[data-test="candidate-card"]')).toBeVisible();
    });
  });

  test.describe('Concurrent Update Handling', () => {
    test('should handle optimistic updates with rollback', async ({ page }) => {
      await page.goto('/jobs');

      // Delete job with failure
      await page.route('**/api/jobs/*/delete', async (route) => {
        await route.fulfill({
          status: 500,
          json: { error: 'Failed to delete job' }
        });
      });

      const jobCount = await page.locator('[data-test="job-card"]').count();
      
      // Try to delete
      await page.click('[data-test="job-card"]').first().locator('[data-test="delete-job"]');
      await page.click('[data-test="confirm-delete"]');

      // Should show error
      await expect(page.locator('[data-test="error-message"]')).toBeVisible();

      // Job should still be present (rollback)
      await expect(page.locator('[data-test="job-card"]')).toHaveCount(jobCount);
    });

    test('should handle stale data updates', async ({ page, context }) => {
      // Open two tabs
      const page2 = await context.newPage();
      await mockAuthentication(page2);

      // Load same job in both tabs
      await page.goto('/jobs');
      await page2.goto('/jobs');

      const jobId = await page.locator('[data-test="job-card"]').first().getAttribute('data-job-id');

      // Edit in first tab
      await page.click('[data-test="job-card"]').first().locator('[data-test="edit-job"]');
      await page.fill('[data-test="job-title"]', 'Updated Title 1');

      // Edit in second tab (with old data)
      await page2.click('[data-test="job-card"]').first().locator('[data-test="edit-job"]');
      await page2.fill('[data-test="job-title"]', 'Updated Title 2');

      // Save first tab
      await page.click('[data-test="save-job"]');
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();

      // Save second tab - should detect conflict
      await page2.click('[data-test="save-job"]');
      await expect(page2.locator('[data-test="conflict-dialog"]')).toBeVisible();

      // Should offer merge options
      await expect(page2.locator('[data-test="merge-changes"]')).toBeVisible();
      await expect(page2.locator('[data-test="overwrite-changes"]')).toBeVisible();
      await expect(page2.locator('[data-test="cancel-changes"]')).toBeVisible();

      await page2.close();
    });
  });

  test.describe('Network Resilience', () => {
    test('should retry failed requests automatically', async ({ page }) => {
      let attemptCount = 0;

      await page.route('**/api/jobs', async (route) => {
        attemptCount++;
        if (attemptCount < 3) {
          // Fail first 2 attempts
          await route.fulfill({
            status: 503,
            json: { error: 'Service temporarily unavailable' }
          });
        } else {
          // Succeed on 3rd attempt
          await route.fulfill({
            status: 200,
            json: { jobs: [{ id: '1', title: 'Test Job' }] }
          });
        }
      });

      await page.goto('/jobs');

      // Should eventually show jobs after retries
      await expect(page.locator('[data-test="job-card"]')).toBeVisible({ timeout: 10000 });
      expect(attemptCount).toBe(3);
    });

    test('should handle offline mode gracefully', async ({ page }) => {
      await page.goto('/jobs');

      // Go offline
      await page.context().setOffline(true);

      // Try to create job
      await page.click('[data-test="create-job-btn"]');
      await page.fill('[data-test="job-title"]', 'Offline Job');
      await page.click('[data-test="publish-job"]');

      // Should show offline message
      await expect(page.locator('[data-test="offline-message"]')).toBeVisible();
      await expect(page.locator('text=You are currently offline')).toBeVisible();

      // Should queue for later
      await expect(page.locator('[data-test="queued-for-sync"]')).toBeVisible();

      // Go back online
      await page.context().setOffline(false);

      // Should auto-sync
      await expect(page.locator('[data-test="sync-progress"]')).toBeVisible();
      await expect(page.locator('[data-test="sync-complete"]')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Memory and Performance', () => {
    test('should handle large candidate lists without memory leaks', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/candidates', async (route) => {
        const candidates = Array.from({ length: 1000 }, (_, i) => ({
          id: `candidate-${i}`,
          firstName: `Test${i}`,
          lastName: 'User',
          email: `test${i}@example.com`,
          skills: ['React', 'Node.js', 'TypeScript']
        }));

        await route.fulfill({
          status: 200,
          json: { candidates, total: 1000 }
        });
      });

      await page.goto('/candidates');

      // Check initial memory usage
      const initialMetrics = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Scroll through list
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(100);
      }

      // Check memory after scrolling
      const afterScrollMetrics = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory increase should be reasonable (less than 50MB)
      const memoryIncrease = afterScrollMetrics - initialMetrics;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  test.describe('Input Validation and Sanitization', () => {
    test('should handle XSS attempts in user input', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="create-candidate-btn"]');

      // Try XSS in various fields
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '"><script>alert("XSS")</script>'
      ];

      await page.fill('[data-test="candidate-firstname"]', xssPayloads[0]);
      await page.fill('[data-test="candidate-lastname"]', xssPayloads[1]);
      await page.fill('[data-test="candidate-summary"]', xssPayloads[2]);

      await page.click('[data-test="save-candidate-btn"]');

      // Should save but sanitize
      await expect(page.locator('[data-test="success-message"]')).toBeVisible();

      // Check that scripts are not executed
      const alerts: string[] = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });

      // View the candidate
      await page.click('[data-test="candidate-card"]').first();

      // No alerts should have fired
      expect(alerts).toHaveLength(0);

      // Text should be escaped/sanitized
      await expect(page.locator('[data-test="candidate-name"]')).not.toContainText('<script>');
    });

    test('should validate email formats', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="create-candidate-btn"]');

      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@@example.com',
        'user@example',
        'user @example.com'
      ];

      for (const email of invalidEmails) {
        await page.fill('[data-test="candidate-email"]', email);
        await page.click('[data-test="save-candidate-btn"]');

        // Should show validation error
        await expect(page.locator('[data-test="email-error"]')).toBeVisible();
        await expect(page.locator('[data-test="email-error"]')).toContainText('valid email');
      }
    });
  });
});
