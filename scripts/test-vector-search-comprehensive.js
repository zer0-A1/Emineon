#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { OpenAI } = require('openai');
const fetch = require('node-fetch');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const API_BASE = 'http://localhost:3000/api';

// Color logging
const log = {
  section: (msg) => console.log('\n' + '='.repeat(60) + '\n' + msg + '\n' + '='.repeat(60)),
  success: (msg) => console.log('\x1b[32m✓\x1b[0m', msg),
  error: (msg) => console.log('\x1b[31m✗\x1b[0m', msg),
  info: (msg) => console.log('\x1b[36mℹ\x1b[0m', msg),
  warn: (msg) => console.log('\x1b[33m⚠\x1b[0m', msg),
  debug: (msg) => console.log('\x1b[90m[DEBUG]\x1b[0m', msg),
};

async function testVectorSearchComprehensive() {
  log.section('🔍 COMPREHENSIVE VECTOR SEARCH TESTING');
  
  try {
    // 1. Check database state
    log.section('1. DATABASE STATE CHECK');
    
    const candidateCount = await pool.query('SELECT COUNT(*) FROM candidates');
    log.info(`Total candidates in database: ${candidateCount.rows[0].count}`);
    
    const embeddingCount = await pool.query('SELECT COUNT(*) FROM candidates WHERE embedding IS NOT NULL');
    log.info(`Candidates with embeddings: ${embeddingCount.rows[0].count}`);
    
    const sampleCandidates = await pool.query(`
      SELECT id, first_name, last_name, current_title, 
             array_length(embedding::real[], 1) as embedding_dim,
             technical_skills
      FROM candidates 
      WHERE embedding IS NOT NULL 
      LIMIT 5
    `);
    
    console.log('\nSample candidates with embeddings:');
    sampleCandidates.rows.forEach(c => {
      console.log(`  - ${c.first_name} ${c.last_name} (${c.current_title})`);
      console.log(`    Embedding dimensions: ${c.embedding_dim}`);
      console.log(`    Skills: ${c.technical_skills?.join(', ') || 'None'}`);
    });
    
    // 2. Test direct SQL vector search
    log.section('2. DIRECT SQL VECTOR SEARCH TEST');
    
    const searchTerms = [
      'python developer',
      'frontend react',
      'data scientist',
      'machine learning',
      'backend engineer'
    ];
    
    for (const term of searchTerms) {
      log.info(`\nSearching for: "${term}"`);
      
      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: term,
        dimensions: 1536,
      });
      const queryEmbedding = embeddingResponse.data[0].embedding;
      const embeddingString = `[${queryEmbedding.join(',')}]`;
      
      // Direct SQL search
      const sqlResults = await pool.query(`
        SELECT 
          id, first_name, last_name, current_title,
          1 - (embedding <=> $1::vector) as similarity
        FROM candidates
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT 3
      `, [embeddingString]);
      
      console.log('  SQL Results:');
      sqlResults.rows.forEach((r, i) => {
        console.log(`    ${i + 1}. ${r.first_name} ${r.last_name} - ${r.current_title} (${(r.similarity * 100).toFixed(1)}%)`);
      });
    }
    
    // 3. Test API endpoint
    log.section('3. API ENDPOINT TEST');
    
    for (const term of searchTerms) {
      log.info(`\nAPI search for: "${term}"`);
      
      const response = await fetch(`${API_BASE}/candidates/vector-search?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        log.success(`Found ${data.data.length} results`);
        console.log('  Top 3 results:');
        data.data.slice(0, 3).forEach((c, i) => {
          console.log(`    ${i + 1}. ${c.first_name} ${c.last_name} - ${c.current_title} (${(c._score * 100).toFixed(1)}%)`);
        });
      } else {
        log.error(`No results returned`);
        if (data.error) {
          console.log(`  Error: ${data.error}`);
        }
      }
    }
    
    // 4. Test search quality
    log.section('4. SEARCH QUALITY TEST');
    
    const qualityTests = [
      {
        query: 'senior python developer with django experience',
        expectedSkills: ['Python', 'Django'],
        description: 'Should find Python developers with Django'
      },
      {
        query: 'javascript react frontend engineer',
        expectedSkills: ['JavaScript', 'React'],
        description: 'Should find React developers'
      },
      {
        query: 'AI machine learning data scientist',
        expectedSkills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning'],
        description: 'Should find ML/AI specialists'
      }
    ];
    
    for (const test of qualityTests) {
      log.info(`\nTesting: ${test.description}`);
      log.debug(`Query: "${test.query}"`);
      
      const response = await fetch(`${API_BASE}/candidates/vector-search?q=${encodeURIComponent(test.query)}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const topResult = data.data[0];
        log.success(`Top match: ${topResult.first_name} ${topResult.last_name} - ${topResult.current_title}`);
        
        // Check if skills match
        const hasExpectedSkills = test.expectedSkills.some(skill => 
          topResult.technical_skills?.some(s => s.toLowerCase().includes(skill.toLowerCase())) ||
          topResult.programming_languages?.some(s => s.toLowerCase().includes(skill.toLowerCase())) ||
          topResult.frameworks?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        );
        
        if (hasExpectedSkills) {
          log.success('✅ Skills match expectations');
        } else {
          log.warn('⚠️  Skills don\'t match expectations');
          console.log(`  Expected: ${test.expectedSkills.join(', ')}`);
          console.log(`  Found: ${[
            ...(topResult.technical_skills || []),
            ...(topResult.programming_languages || []),
            ...(topResult.frameworks || [])
          ].join(', ')}`);
        }
      } else {
        log.error('No results found');
      }
    }
    
    // 5. Performance test
    log.section('5. PERFORMANCE TEST');
    
    const performanceRuns = 5;
    const times = [];
    
    for (let i = 0; i < performanceRuns; i++) {
      const start = Date.now();
      const response = await fetch(`${API_BASE}/candidates/vector-search?q=python%20developer`);
      await response.json();
      const duration = Date.now() - start;
      times.push(duration);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    log.info(`Average response time: ${avgTime.toFixed(0)}ms`);
    log.info(`Min: ${Math.min(...times)}ms, Max: ${Math.max(...times)}ms`);
    
    // 6. Edge cases
    log.section('6. EDGE CASE TESTS');
    
    const edgeCases = [
      { query: '', description: 'Empty query' },
      { query: 'asdfghjklqwertyuiop', description: 'Nonsense query' },
      { query: 'python AND java OR react', description: 'Boolean-like query' },
      { query: '软件工程师', description: 'Non-English query' },
      { query: 'developer with 10+ years experience $200k+ salary remote', description: 'Complex natural language' }
    ];
    
    for (const test of edgeCases) {
      log.info(`\nTesting: ${test.description}`);
      
      const response = await fetch(`${API_BASE}/candidates/vector-search?q=${encodeURIComponent(test.query)}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.data?.length > 0) {
          log.success(`Handled successfully: ${data.data.length} results`);
        } else if (test.query === '') {
          log.warn('Empty query rejected as expected');
        } else {
          log.info('No results (which may be correct)');
        }
      } else {
        log.error(`Failed: ${data.error}`);
      }
    }
    
    // Summary
    log.section('📊 VECTOR SEARCH TEST SUMMARY');
    log.success('All tests completed');
    
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Run the comprehensive test
testVectorSearchComprehensive();
