# E2E Test Authentication Setup Guide

## Overview

The Emineon ATS application uses Clerk for authentication. To run E2E tests, you need to properly authenticate or bypass the authentication system.

## Current Situation

1. The application redirects all unauthenticated requests to `/sign-in`
2. Clerk middleware is enforced on all routes except those in the `publicRoutes` array
3. The development environment still requires valid Clerk authentication

## Authentication Options for E2E Testing

### Option 1: Use Clerk Test Mode (Recommended)

1. **Set up Clerk test credentials**:
   ```bash
   # In your .env or .env.test file
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_TEST_MODE=true
   ```

2. **Create a test user in Clerk Dashboard**:
   - Go to https://dashboard.clerk.com
   - Create a test user with known credentials
   - Use these credentials in your tests

3. **Implement actual sign-in flow in tests**:
   ```typescript
   async function signIn(page: Page) {
     await page.goto('/sign-in');
     await page.fill('[data-test="email-input"]', 'test@example.com');
     await page.fill('[data-test="password-input"]', 'testpassword');
     await page.click('[data-test="sign-in-button"]');
     await page.waitForURL('/');
   }
   ```

### Option 2: Modify Middleware for Test Environment

1. **Update `src/middleware.ts`** to bypass auth in test mode:
   ```typescript
   export default authMiddleware({
     publicRoutes: [
       '/',
       '/sign-in(.*)',
       '/sign-up(.*)',
       // Add this for test environment
       ...(process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true' 
         ? ['/(.*)', '/api/(.*)'] 
         : []),
     ],
   });
   ```

2. **Set environment variable when running tests**:
   ```bash
   TEST_MODE=true npm run test:e2e
   ```

### Option 3: Mock Clerk on the Server Side

1. **Create a test-specific Next.js configuration**:
   ```javascript
   // next.config.test.js
   module.exports = {
     ...baseConfig,
     experimental: {
       instrumentationHook: true,
     },
   };
   ```

2. **Create instrumentation to mock Clerk**:
   ```typescript
   // src/instrumentation.ts
   export async function register() {
     if (process.env.TEST_MODE === 'true') {
       // Mock Clerk server-side
       const { auth } = await import('@clerk/nextjs');
       (auth as any).mockReturnValue({
         userId: 'test-user-id',
         sessionId: 'test-session-id',
       });
     }
   }
   ```

### Option 4: Use Development Bypass (Current Attempt)

The current test setup attempts to use development bypass methods, but they're not working because:

1. The middleware still enforces authentication even in development
2. The Clerk client-side SDK validates sessions against the backend
3. Mock cookies and localStorage values are not sufficient

## Recommended Solution

For immediate E2E testing, the best approach is:

1. **Create a test-specific build** with authentication disabled:
   ```bash
   # Create a test build script
   NEXT_PUBLIC_CLERK_ENABLED=false NODE_ENV=test npm run build
   ```

2. **Or modify the application** to support test mode:
   - Add a `TEST_MODE` environment variable
   - Update middleware to skip auth when `TEST_MODE=true`
   - Update Clerk providers to render children directly in test mode

3. **Use real Clerk test accounts**:
   - Set up Clerk development instance
   - Create test users via Clerk API
   - Use actual sign-in flow in tests

## Example Test Setup with Real Authentication

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authenticated Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in with real credentials
    await page.goto('/sign-in');
    await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL!);
    await page.click('button[type="submit"]');
    
    // Wait for password field
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/');
  });
  
  test('should access protected routes', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page).toHaveURL('/jobs');
    // ... rest of test
  });
});
```

## Environment Variables for Testing

Create a `.env.test` file:

```bash
# Clerk Test Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Test User Credentials
TEST_USER_EMAIL=test@emineon.com
TEST_USER_PASSWORD=TestPassword123!

# Test Mode Flag
TEST_MODE=true
NODE_ENV=test
```

## Running Tests

```bash
# Load test environment and run tests
source .env.test && npm run test:e2e
```

## Next Steps

1. Choose one of the authentication approaches above
2. Update the application code if necessary to support test mode
3. Update test files to use the chosen authentication method
4. Run tests with proper environment configuration

The most sustainable solution is to modify the middleware to support a test mode that bypasses authentication when appropriate environment variables are set.
