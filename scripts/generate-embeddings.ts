#!/usr/bin/env node
import { config } from 'dotenv';
import { updateAllCandidateEmbeddings } from '@/lib/embeddings/openai-embeddings';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

async function main() {
  console.log('🚀 Starting embedding generation...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
    console.log('Please add your OpenAI API key to .env.local or .env file:');
    console.log('OPENAI_API_KEY=sk-...');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  try {
    await updateAllCandidateEmbeddings();
    console.log('✅ Embedding generation complete!');
  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
    process.exit(1);
  }
}

main().catch(console.error);
