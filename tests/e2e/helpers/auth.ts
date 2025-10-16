import { Page } from '@playwright/test';

export async function mockAuthentication(page: Page, userId: string = 'test-user-playwright') {
  // Mock Clerk authentication by setting development bypass
  await page.addInitScript(() => {
    // Override window.location.hostname to trigger development bypass
    Object.defineProperty(window, '__TEST_MODE__', {
      value: true,
      writable: false,
    });
  });

  // Set auth cookie for development bypass
  await page.context().addCookies([
    {
      name: 'dev-user-id',
      value: userId,
      domain: 'localhost',
      path: '/',
    },
  ]);
}

export async function waitForApp(page: Page) {
  // Wait for the app to be fully loaded
  if (page.url() === 'about:blank') {
    await page.goto('/');
  }
  await page.waitForLoadState('networkidle');
  // Wait for common layout elements
  await page.waitForSelector('[data-test="app-layout"]', { timeout: 10000 }).catch(() => {
    // Fallback to waiting for any main content
    return page.waitForSelector('main', { timeout: 10000 });
  });
}
