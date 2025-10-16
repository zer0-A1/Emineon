#!/usr/bin/env node

// Load environment
require('dotenv').config({ path: '.env.local' });

// Set up module aliases
const path = require('path');
const tsNode = require('ts-node');

// Register TypeScript
tsNode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2020',
    lib: ['es2020'],
    moduleResolution: 'node',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: false,
    paths: {
      '@/*': [path.join(__dirname, '../src/*')]
    }
  }
});

// Now we can import TypeScript modules
async function testSearchFunction() {
  console.log('🔍 Testing searchCandidatesByVector function directly\n');
  
  try {
    const { searchCandidatesByVector } = require('../src/lib/embeddings/neon-embeddings');
    
    console.log('Calling searchCandidatesByVector("python developer", 10)...\n');
    
    const results = await searchCandidatesByVector('python developer', 10);
    
    console.log('\nResults:', results.length);
    
    if (results.length > 0) {
      console.log('\nFirst 3 results:');
      results.slice(0, 3).forEach((candidate, i) => {
        console.log(`${i + 1}. ${candidate.first_name} ${candidate.last_name}`);
        console.log(`   Title: ${candidate.current_title}`);
        console.log(`   Score: ${candidate._score?.toFixed(4) || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No results returned');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Exit to close the pool
  process.exit(0);
}

testSearchFunction();
