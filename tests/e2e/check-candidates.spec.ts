import { test, expect } from '@playwright/test';

test.describe('Check Candidates Page', () => {
  test('should access candidates page on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Go directly to candidates
    await page.goto('http://localhost:3000/candidates');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'candidates-page.png', fullPage: true });
    
    // Print URL
    console.log('Current URL:', page.url());
    
    // Check for auth redirect
    if (page.url().includes('sign-in') || page.url().includes('clerk')) {
      console.log('Redirected to auth page');
      // In dev mode, we should bypass auth
    }
    
    // Wait a bit and check content
    await page.waitForTimeout(3000);
    
    // Look for any visible content
    const pageContent = await page.textContent('body');
    console.log('Page content (first 500 chars):', pageContent?.substring(0, 500));
    
    // Look for specific elements
    const hasSearchInput = await page.locator('input[placeholder*="Search"]').count() > 0;
    console.log('Has search input:', hasSearchInput);
    
    const hasCreateButton = await page.locator('button:has-text("Add Candidate")').count() > 0;
    console.log('Has Add Candidate button:', hasCreateButton);
    
    const hasCandidateCards = await page.locator('[class*="candidate"]').count() > 0;
    console.log('Has candidate elements:', hasCandidateCards);
    
    // List all visible buttons
    const buttons = await page.locator('button:visible').all();
    console.log('\nVisible buttons:');
    for (const button of buttons) {
      const text = await button.textContent();
      if (text?.trim()) {
        console.log('-', text.trim());
      }
    }
    
    // Check if we need to handle auth
    const signInButton = page.locator('button:has-text("Sign in")');
    if (await signInButton.isVisible()) {
      console.log('Found sign in button, clicking...');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
  });
});
