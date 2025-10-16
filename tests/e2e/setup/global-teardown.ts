import { FullConfig } from '@playwright/test';
import { cleanupTestData, closePool } from '../helpers/test-user-pg';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global teardown...');
  
  try {
    // Clean up test data
    await cleanupTestData();
    
    // Close database connection pool
    await closePool();
    
    console.log('✅ Global teardown completed');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - we want teardown to complete even if there are errors
  }
}

export default globalTeardown;
