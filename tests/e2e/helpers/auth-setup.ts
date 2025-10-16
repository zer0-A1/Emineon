import { Page } from '@playwright/test';

/**
 * Enhanced authentication setup for E2E tests with Clerk
 * This handles authentication in multiple ways:
 * 1. Development mode bypass
 * 2. Mock Clerk session
 * 3. Direct token injection
 */

// Test user data matching what Clerk would provide
export const TEST_USER = {
  id: 'user_test_playwright_e2e',
  email: 'test@emineon.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  imageUrl: 'https://img.clerk.com/test-user.png'
};

// Mock Clerk session data
const MOCK_SESSION = {
  id: 'sess_test_playwright',
  userId: TEST_USER.id,
  status: 'active',
  lastActiveAt: new Date().toISOString(),
  expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

/**
 * Set up authentication for E2E tests
 * This bypasses Clerk authentication in test environment
 */
export async function setupTestAuth(page: Page) {
  // Method 1: Set development bypass cookie
  await page.context().addCookies([
    {
      name: '__dev_user_id',
      value: TEST_USER.id,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    },
    {
      name: '__session',
      value: JSON.stringify(MOCK_SESSION),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }
  ]);

  // Method 2: Inject Clerk client-side state
  await page.addInitScript(() => {
    // Override window.__clerk_client_state
    (window as any).__clerk_client_state = {
      session: {
        id: 'sess_test_playwright',
        userId: 'user_test_playwright_e2e',
        status: 'active',
        user: {
          id: 'user_test_playwright_e2e',
          primaryEmailAddress: {
            emailAddress: 'test@emineon.com'
          },
          firstName: 'Test',
          lastName: 'User',
          fullName: 'Test User',
          imageUrl: 'https://img.clerk.com/test-user.png'
        }
      },
      user: {
        id: 'user_test_playwright_e2e',
        primaryEmailAddress: {
          emailAddress: 'test@emineon.com'
        },
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        imageUrl: 'https://img.clerk.com/test-user.png'
      }
    };

    // Override Clerk's useAuth hook
    if ((window as any).Clerk) {
      (window as any).Clerk.session = {
        id: 'sess_test_playwright',
        userId: 'user_test_playwright_e2e',
        status: 'active'
      };
      (window as any).Clerk.user = {
        id: 'user_test_playwright_e2e',
        primaryEmailAddress: {
          emailAddress: 'test@emineon.com'
        },
        firstName: 'Test',
        lastName: 'User'
      };
    }
  });

  // Method 3: Set localStorage items that Clerk uses
  // Note: evaluateOnNewDocument is not available in Playwright, use addInitScript instead
  await page.addInitScript(() => {
    // Set Clerk tokens in localStorage
    try {
      localStorage.setItem('__clerk_db_jwt', 'eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc18yeG0xdkNXZldrWWpRYmVxZzZGNldqbEFNV1oiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTcwMDAwMDAwMCwiaXNzIjoiaHR0cHM6Ly9uZXh0LWJ1bm55LTMyLmNsZXJrLmFjY291bnRzLmRldiIsIm5iZiI6MTcwMDAwMDAwMCwic2lkIjoic2Vzc190ZXN0X3BsYXl3cmlnaHQiLCJzdWIiOiJ1c2VyX3Rlc3RfcGxheXdyaWdodF9lMmUifQ');
      localStorage.setItem('__clerk_client_jwt', 'eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc18yeG0xdkNXZldrWWpRYmVxZzZGNldqbEFNV1oiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTcwMDAwMDAwMCwiaXNzIjoiaHR0cHM6Ly9uZXh0LWJ1bm55LTMyLmNsZXJrLmFjY291bnRzLmRldiIsIm5iZiI6MTcwMDAwMDAwMCwic2lkIjoic2Vzc190ZXN0X3BsYXl3cmlnaHQiLCJzdWIiOiJ1c2VyX3Rlc3RfcGxheXdyaWdodF9lMmUifQ');
    } catch (e) {
      console.log('Failed to set localStorage items:', e);
    }
  });
}

/**
 * Alternative: Use actual Clerk test mode
 * This requires setting up test keys in environment
 */
export async function setupClerkTestMode(page: Page) {
  // Set test mode environment
  await page.addInitScript(() => {
    (window as any).__clerk_test_mode = true;
    (window as any).__clerk_frontend_api = 'https://next-bunny-32.clerk.accounts.dev';
  });

  // Add test session token
  const testToken = process.env.CLERK_TEST_TOKEN || 'test_token_placeholder';
  await page.context().addCookies([
    {
      name: '__session_test',
      value: testToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }
  ]);
}

/**
 * Wait for authentication to be ready
 */
export async function waitForAuth(page: Page) {
  // Wait for Clerk to initialize
  await page.waitForFunction(() => {
    return (window as any).Clerk !== undefined;
  }, { timeout: 10000 }).catch(() => {
    console.log('Clerk not found, assuming dev mode');
  });

  // Wait for session to be ready
  await page.waitForFunction(() => {
    const clerk = (window as any).Clerk;
    return clerk?.session?.userId || (window as any).__clerk_client_state?.session?.userId;
  }, { timeout: 5000 }).catch(() => {
    console.log('Session not found, proceeding anyway');
  });
}

/**
 * Sign out helper for tests
 */
export async function signOut(page: Page) {
  // Clear all auth cookies
  await page.context().clearCookies();
  
  // Clear localStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Get current user from page context
 */
export async function getCurrentUser(page: Page) {
  return await page.evaluate(() => {
    const clerk = (window as any).Clerk;
    if (clerk?.user) {
      return clerk.user;
    }
    const state = (window as any).__clerk_client_state;
    return state?.user || null;
  });
}
