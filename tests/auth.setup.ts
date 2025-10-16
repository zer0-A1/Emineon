import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // For development, we'll use the auth bypass
  // In production, you would implement proper Clerk authentication here
  
  // Visit any page to establish session
  await page.goto('http://localhost:3000');
  
  // Check if we're redirected to sign-in
  if (page.url().includes('sign-in')) {
    console.log('Auth required - using development bypass');
    
    // For Clerk in development, you might need to:
    // 1. Set test user credentials
    // 2. Fill in email/password
    // 3. Click sign in
    
    // For now, we'll set a cookie or localStorage to bypass auth
    await page.context().addCookies([
      {
        name: 'dev-auth-bypass',
        value: 'true',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    // Store auth state
    await page.context().storageState({ path: authFile });
  }
});
