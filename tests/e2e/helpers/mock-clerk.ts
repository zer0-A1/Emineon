import { Page } from '@playwright/test';

/**
 * Mock Clerk authentication for E2E tests
 * This approach intercepts Clerk API calls and provides mock responses
 */

export const MOCK_USER = {
  id: 'user_2abc123xyz789',
  email: 'test@emineon.com',
  emailAddresses: [{
    id: 'email_123',
    emailAddress: 'test@emineon.com',
    verification: { status: 'verified' }
  }],
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  username: 'testuser',
  profileImageUrl: 'https://img.clerk.com/test-user.png',
  hasImage: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const MOCK_SESSION = {
  id: 'sess_2xyz789abc123',
  clientId: 'client_123',
  userId: MOCK_USER.id,
  status: 'active',
  lastActiveAt: new Date().toISOString(),
  expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  abandonAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export async function mockClerkAPI(page: Page) {
  // Intercept Clerk API calls
  await page.route('**/api.clerk.com/**', async (route) => {
    const url = route.request().url();
    
    // Mock session endpoint
    if (url.includes('/sessions')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: [MOCK_SESSION],
          client: {
            sessions: [MOCK_SESSION],
            sign_in: null,
            sign_up: null,
            last_active_session_id: MOCK_SESSION.id
          }
        })
      });
      return;
    }
    
    // Mock user endpoint
    if (url.includes('/users') || url.includes('/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER)
      });
      return;
    }
    
    // Mock client endpoint
    if (url.includes('/client')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            object: 'client',
            id: 'client_123',
            sessions: [MOCK_SESSION],
            sign_in: null,
            sign_up: null,
            last_active_session_id: MOCK_SESSION.id
          }
        })
      });
      return;
    }
    
    // Default response for other endpoints
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  // Intercept Clerk frontend API
  await page.route('**/clerk.accounts.dev/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('/client')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            sessions: [MOCK_SESSION],
            last_active_session_id: MOCK_SESSION.id
          }
        })
      });
      return;
    }
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
}

export async function setupClerkAuth(page: Page) {
  // First, mock the API responses
  await mockClerkAPI(page);
  
  // Set up cookies
  await page.context().addCookies([
    {
      name: '__client',
      value: JSON.stringify({
        sessions: [MOCK_SESSION.id],
        last_active_session_id: MOCK_SESSION.id
      }),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    },
    {
      name: '__session',
      value: MOCK_SESSION.id,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }
  ]);
  
  // Inject Clerk state
  await page.addInitScript(() => {
    // Mock Clerk global
    (window as any).Clerk = {
      session: {
        id: 'sess_2xyz789abc123',
        userId: 'user_2abc123xyz789',
        status: 'active',
        lastActiveAt: new Date().toISOString(),
        user: {
          id: 'user_2abc123xyz789',
          primaryEmailAddress: {
            emailAddress: 'test@emineon.com'
          },
          firstName: 'Test',
          lastName: 'User',
          fullName: 'Test User',
          profileImageUrl: 'https://img.clerk.com/test-user.png'
        }
      },
      user: {
        id: 'user_2abc123xyz789',
        primaryEmailAddress: {
          emailAddress: 'test@emineon.com'
        },
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        profileImageUrl: 'https://img.clerk.com/test-user.png'
      },
      client: {
        sessions: [{
          id: 'sess_2xyz789abc123',
          userId: 'user_2abc123xyz789',
          status: 'active'
        }],
        lastActiveSessionId: 'sess_2xyz789abc123'
      },
      loaded: true,
      __unstable__environment: {
        authUrl: '',
        displayName: 'Test'
      }
    };
    
    // Override Clerk hooks
    if ((window as any).__clerk_ssr_state) {
      (window as any).__clerk_ssr_state = {
        sessionId: 'sess_2xyz789abc123',
        userId: 'user_2abc123xyz789',
        user: (window as any).Clerk.user,
        session: (window as any).Clerk.session
      };
    }
  });
}
