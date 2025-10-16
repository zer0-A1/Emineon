import { chromium, FullConfig } from '@playwright/test';
import { createTestUser } from '../helpers/test-user-pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Override DATABASE_URL for tests to use Neon
process.env.DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_kDYdf2A7rmNz@ep-jolly-shadow-agc4ewcs-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function globalSetup(config: FullConfig) {
  console.log('🚀 Running global setup...');
  
  try {
    // Create test data
    const testData = await createTestUser();
    
    // Store test data in environment variables for tests to use
    process.env.TEST_USER_ID = testData.user.id;
    process.env.TEST_CLIENT_ID = testData.client.id;
    process.env.TEST_PROJECT_ID = testData.project.id;
    
    console.log('✅ Test data created successfully');
    
    // Create browser storage state for authenticated user
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Mock authentication by setting cookies/storage
    await page.goto('http://localhost:3000');
    const envIds = {
      TEST_USER_ID: process.env.TEST_USER_ID,
      TEST_CLIENT_ID: process.env.TEST_CLIENT_ID,
      TEST_PROJECT_ID: process.env.TEST_PROJECT_ID,
    };
    await page.evaluate((ids) => {
      // Set mock auth data in localStorage
      localStorage.setItem('test-auth', JSON.stringify({
        userId: ids.TEST_USER_ID,
        email: 'playwright@test.emineon.com',
        role: 'ADMIN',
      }));
      // Also expose ids for app code that reads them in tests if needed
      localStorage.setItem('test-env', JSON.stringify(ids));
    }, envIds);
    
    // Save storage state
    await context.storageState({ path: 'tests/e2e/.auth/user.json' });
    
    await browser.close();
    
    console.log('✅ Global setup completed');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;