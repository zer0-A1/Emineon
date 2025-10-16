import { test, expect } from '@playwright/test';

test.describe('Basic Navigation Test', () => {
  test('should load homepage and navigate', async ({ page }) => {
    // Go to homepage
    await page.goto('http://localhost:3000');
    
    // Print page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Take screenshot
    await page.screenshot({ path: 'homepage.png' });
    
    // Look for any visible text
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body');
    console.log('Page contains text:', bodyText?.substring(0, 200) + '...');
    
    // Try to find links
    const links = await page.locator('a').all();
    console.log('Found links:', links.length);
    
    // Click on Jobs if exists
    const jobsLink = page.locator('a:has-text("Jobs")').first();
    if (await jobsLink.isVisible()) {
      await jobsLink.click();
      await page.waitForLoadState('networkidle');
      console.log('Navigated to:', page.url());
    }
    
    // Go to candidates page directly
    await page.goto('http://localhost:3000/candidates');
    await page.waitForLoadState('networkidle');
    
    // Look for any candidate-related elements
    const candidateElements = await page.locator('*:has-text("candidate")').count();
    console.log('Elements with "candidate" text:', candidateElements);
    
    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log('Found buttons:', buttons.length);
    for (let i = 0; i < Math.min(5, buttons.length); i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: ${text}`);
    }
    
    // Look for search input
    const searchInputs = await page.locator('input[type="text"]').all();
    console.log('Found text inputs:', searchInputs.length);
    
    // Try searching
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      await page.waitForTimeout(1000);
      console.log('Performed search');
    }
  });
});
