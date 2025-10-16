import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Playwright authentication setup
 * This file runs once before all tests to set up authentication state
 */

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate', async ({ page, context }) => {
  // Option 1: Use real Clerk authentication flow
  if (process.env.USE_REAL_AUTH === 'true') {
    // Go to sign-in page
    await page.goto('http://localhost:3000/sign-in');
    
    // Wait for Clerk to load
    await page.waitForLoadState('networkidle');
    
    // Fill in credentials
    const email = process.env.TEST_USER_EMAIL || 'test@emineon.com';
    const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    
    // Clerk uses different field names, try multiple selectors
    const emailSelectors = [
      'input[name="identifier"]',
      'input[type="email"]',
      'input[name="email"]',
      '#identifier-field'
    ];
    
    for (const selector of emailSelectors) {
      const field = page.locator(selector);
      if (await field.count() > 0) {
        await field.fill(email);
        break;
      }
    }
    
    // Click continue/next button
    const continueButton = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Next")').first();
    await continueButton.click();
    
    // Wait for password field
    await page.waitForTimeout(1000);
    
    // Fill password
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      '#password-field'
    ];
    
    for (const selector of passwordSelectors) {
      const field = page.locator(selector);
      if (await field.count() > 0) {
        await field.fill(password);
        break;
      }
    }
    
    // Click sign in button
    const signInButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Continue")').first();
    await signInButton.click();
    
    // Wait for redirect to home page
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    
    // Save authentication state
    await context.storageState({ path: authFile });
    
    console.log('✅ Authentication successful, state saved');
    return;
  }
  
  // Option 2: Mock authentication for development/testing
  // This approach sets up the necessary cookies and localStorage
  
  // Set up development authentication cookies
  await context.addCookies([
    {
      name: '__session',
      value: 'mock_session_token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    },
    {
      name: '__client_uat',
      value: '0', // Disable Clerk's user agent tracking
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }
  ]);
  
  // Navigate to the app to set up localStorage
  await page.goto('http://localhost:3000');
  
  // Inject authentication state into the page
  await page.evaluate(() => {
    // Mock Clerk's session storage
    const mockSession = {
      id: 'sess_mock_e2e_test',
      status: 'active',
      lastActiveAt: new Date().toISOString(),
      actor: null,
      user: {
        id: 'user_mock_e2e_test',
        primaryEmailAddress: {
          id: 'email_mock',
          emailAddress: 'test@emineon.com'
        },
        emailAddresses: [{
          id: 'email_mock',
          emailAddress: 'test@emineon.com',
          verification: { status: 'verified' }
        }],
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        username: 'testuser',
        hasImage: false,
        profileImageUrl: 'https://img.clerk.com/default-profile.png'
      }
    };
    
    // Set Clerk client state
    sessionStorage.setItem('__clerk_client_state', JSON.stringify({
      sessions: [mockSession],
      session: mockSession,
      user: mockSession.user,
      lastActiveSessionId: mockSession.id
    }));
    
    // Set development mode flags
    localStorage.setItem('__clerk_db_jwt', 'mock_jwt_token');
    localStorage.setItem('__dev_browser', 'true');
    sessionStorage.setItem('__clerk_debug', '1');
  });
  
  // Reload to apply the state
  await page.reload();
  
  // Wait a bit for React to process
  await page.waitForTimeout(2000);
  
  // Save the storage state
  await context.storageState({ path: authFile });
  
  console.log('✅ Mock authentication state saved');
});

// Export a test that uses the authenticated state
export const authenticatedTest = setup.extend({
  storageState: authFile,
});
