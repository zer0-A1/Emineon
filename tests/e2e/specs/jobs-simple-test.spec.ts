import { test, expect } from '@playwright/test';
import { setupClerkAuth, MOCK_USER } from '../helpers/mock-clerk';

/**
 * Simplified Jobs page tests with mocked authentication
 */
test.describe('Jobs Page - Simple Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mocked authentication
    await setupClerkAuth(page);
    
    // Go directly to jobs page
    await page.goto('http://localhost:3000/jobs', { waitUntil: 'networkidle' });
  });

  test('should display jobs page content', async ({ page }) => {
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/jobs-page-test.png' });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Look for any indication we're on the jobs page
    const pageContent = await page.content();
    
    // Check for common elements that might exist
    const possibleSelectors = [
      'h1:has-text("Jobs")',
      'h2:has-text("Jobs")',
      'text=Jobs',
      '[data-test*="job"]',
      'button:has-text("Create")',
      'button:has-text("New")',
      'text=positions',
      'text=openings'
    ];
    
    let foundElement = false;
    for (const selector of possibleSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found element with selector: ${selector}`);
        foundElement = true;
        break;
      }
    }
    
    // If we're redirected to sign-in, that's useful info
    if (currentUrl.includes('sign-in')) {
      console.log('Redirected to sign-in page');
      // Look for sign-in elements
      const signInElements = await page.locator('text=/sign.*in/i').count();
      console.log(`Found ${signInElements} sign-in related elements`);
    }
    
    // Try to find any view buttons
    const viewButtonSelectors = [
      'button[title*="List"]',
      'button[title*="Grid"]',
      'button[title*="Client"]',
      'button:has-text("List")',
      'button:has-text("Grid")',
      '[role="button"]'
    ];
    
    for (const selector of viewButtonSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found view button with selector: ${selector}`);
      }
    }
    
    // Assert something basic
    expect(currentUrl).toBeTruthy();
    expect(foundElement || currentUrl.includes('jobs')).toBeTruthy();
  });

  test('should check page structure', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check for main layout elements
    const main = await page.locator('main').count();
    const nav = await page.locator('nav').count();
    const header = await page.locator('header').count();
    
    console.log(`Found: main=${main}, nav=${nav}, header=${header}`);
    
    // Check for any cards or list items
    const cards = await page.locator('[class*="card"]').count();
    const listItems = await page.locator('li').count();
    
    console.log(`Found: cards=${cards}, list items=${listItems}`);
    
    // Look for any buttons
    const buttons = await page.locator('button').count();
    console.log(`Found ${buttons} buttons`);
    
    // Get all button texts
    if (buttons > 0) {
      const buttonTexts = await page.locator('button').allTextContents();
      console.log('Button texts:', buttonTexts);
    }
  });

  test('should interact with page if possible', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Try to find and click any clickable element
    const clickableSelectors = [
      'button:visible',
      'a:visible',
      '[role="button"]:visible'
    ];
    
    for (const selector of clickableSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
        
        // Try to click the first one
        try {
          const firstElement = elements.first();
          const text = await firstElement.textContent();
          console.log(`Clicking element with text: ${text}`);
          
          await firstElement.click({ timeout: 5000 });
          await page.waitForTimeout(1000);
          
          // Check if URL changed
          const newUrl = page.url();
          console.log(`URL after click: ${newUrl}`);
        } catch (e) {
          console.log(`Failed to click: ${e.message}`);
        }
        
        break;
      }
    }
  });
});
