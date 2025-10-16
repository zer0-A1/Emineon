import { test, expect } from '@playwright/test';
import { mockAuthentication, waitForApp } from '../helpers/auth';
import { seedTestCandidates, seedTestJobs } from '../helpers/test-user-pg';

test.describe('AI Copilot End-to-End (Neon-backed)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);

    const userId = process.env.TEST_USER_ID || 'test-user-playwright';
    const projectId = process.env.TEST_PROJECT_ID || '';

    // Seed minimal fixtures
    await seedTestCandidates(userId, 3);
    if (projectId) {
      await seedTestJobs(projectId, 2);
    }
  });

  test('AI search returns Neon-backed results (candidates/jobs/clients/projects)', async ({ page, request }) => {
    // Ensure app is reachable
    await page.goto('/');
    await waitForApp(page);

    // Hit AI search API directly (vector preferred, text fallback)
    const aiSearch = await request.post('/api/ai/search', {
      data: { query: 'developer', sourceTypes: ['CANDIDATE','JOB','CLIENT','PROJECT'], limit: 5 },
    });
    expect(aiSearch.ok()).toBeTruthy();
    const aiData = await aiSearch.json();
    expect(Array.isArray(aiData.data)).toBeTruthy();
    expect(aiData.data.length).toBeGreaterThan(0);

    // Note: Copilot chat/stream endpoints are auth-protected in prod; AI search is sufficient to validate Neon integration E2E
  });
});


