import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { setupReindexTriggers, reindexCandidatesByCriteria } from '../src/lib/embeddings/reindex-service';
import { testConnection } from '../src/lib/db/neon-client';

async function setupReindexSystem() {
  console.log('🔧 Setting up reindex system...\n');
  
  try {
    // Test connection
    console.log('1️⃣ Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
    
    // Setup database triggers
    console.log('\n2️⃣ Setting up database triggers...');
    await setupReindexTriggers();
    
    // Reindex candidates without embeddings
    console.log('\n3️⃣ Checking for candidates without embeddings...');
    await reindexCandidatesByCriteria(
      { missingEmbedding: true },
      'manual'
    );
    
    console.log('\n✅ Reindex system setup complete!');
    console.log('\nThe system will now automatically reindex candidates when:');
    console.log('- New candidates are created');
    console.log('- Candidate profiles are updated');
    console.log('- CV or competence files are uploaded');
    console.log('- Skills or other key fields change');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupReindexSystem().catch(console.error);
