import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration with authentication setup
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },

  projects: [
    // Setup project that runs authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },
    
    // Cleanup project
    {
      name: 'cleanup',
      testMatch: /global\.teardown\.ts/,
    },
    
    // Main test project that depends on setup
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use the authenticated state from setup
        storageState: path.join(__dirname, 'playwright/.auth/user.json'),
      },
      dependencies: ['setup'],
    },
    
    // Additional browsers if needed
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: path.join(__dirname, 'playwright/.auth/user.json'),
      },
      dependencies: ['setup'],
    },
  ],
  
  // Global timeout
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 5000
  },
  
  // Output folder for test artifacts
  outputDir: 'test-results/',
  
  // Folder for test artifacts such as screenshots, videos, traces
  use: {
    actionTimeout: 0,
  },
});
