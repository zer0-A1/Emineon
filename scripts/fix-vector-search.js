#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { OpenAI } = require('openai');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function debugVectorSearch() {
  console.log('🔍 Debugging Vector Search Issue\n');
  
  try {
    // 1. Generate a test embedding
    console.log('1. Generating test embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: 'python developer',
      dimensions: 1536,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    
    // 2. Test direct query
    console.log('\n2. Testing direct SQL query...');
    const directQuery = `
      SELECT 
        id, first_name, last_name, current_title,
        1 - (embedding <=> $1::vector) as similarity
      FROM candidates
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 5
    `;
    
    const directResult = await pool.query(directQuery, [embeddingString]);
    console.log('Direct query results:', directResult.rows.length);
    directResult.rows.forEach(r => {
      console.log(`  - ${r.first_name} ${r.last_name}: ${r.similarity.toFixed(4)}`);
    });
    
    // 3. Test the exact query from neon-embeddings.ts
    console.log('\n3. Testing exact API query structure...');
    const apiQuery = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        current_title,
        current_location,
        professional_headline,
        experience_years,
        seniority_level,
        technical_skills,
        programming_languages,
        frameworks,
        expected_salary,
        remote_preference,
        freelancer,
        primary_industry,
        functional_domain,
        universities,
        degrees,
        certifications,
        spoken_languages,
        tags,
        source,
        status,
        created_at,
        updated_at,
        original_cv_url,
        original_cv_file_name,
        1 - (embedding <=> $1::vector) as similarity
      FROM candidates
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `;
    
    const apiResult = await pool.query(apiQuery, [embeddingString, 10]);
    console.log('API query results:', apiResult.rows.length);
    
    // 4. Test with logging
    console.log('\n4. Running query with detailed logging...');
    
    // Import the actual function
    const { query } = require('../src/lib/db/neon-client.js');
    console.log('Using query function from neon-client');
    
    const results = await query(apiQuery, [embeddingString, 10]);
    console.log('Query function results:', results.length);
    
    if (results.length > 0) {
      console.log('First result:', {
        name: `${results[0].first_name} ${results[0].last_name}`,
        title: results[0].current_title,
        similarity: results[0].similarity
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugVectorSearch();
