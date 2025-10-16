#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const OpenAI = require('openai');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function debugVectorSearch() {
  try {
    console.log('🔍 Debugging Vector Search\n');
    
    // 1. Check OpenAI key
    console.log('1. OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
    
    // 2. Generate test embedding
    console.log('\n2. Generating test embedding for "backend developer python"...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: 'backend developer python',
      dimensions: 1536,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log('✅ Embedding generated, dimensions:', queryEmbedding.length);
    
    // 3. Check candidates with embeddings
    console.log('\n3. Checking candidates in database...');
    const candidateCheck = await pool.query(`
      SELECT id, first_name, last_name, current_title, 
             embedding IS NOT NULL as has_embedding,
             array_length(embedding::real[], 1) as embedding_dim
      FROM candidates
    `);
    console.log('Total candidates:', candidateCheck.rows.length);
    candidateCheck.rows.forEach(c => {
      console.log(`  - ${c.first_name} ${c.last_name} (${c.current_title}): ${c.has_embedding ? '✅ Has embedding' : '❌ No embedding'} ${c.embedding_dim ? `(${c.embedding_dim} dims)` : ''}`);
    });
    
    // 4. Direct vector search
    console.log('\n4. Performing direct vector search...');
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    
    const searchResult = await pool.query(`
      SELECT id, first_name, last_name, email, current_title,
             1 - (embedding <=> $1::vector) as similarity
      FROM candidates
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 5
    `, [embeddingString]);
    
    console.log('Search results:', searchResult.rows.length);
    searchResult.rows.forEach(r => {
      console.log(`  - ${r.first_name} ${r.last_name} (${r.current_title}): similarity ${r.similarity?.toFixed(4)}`);
    });
    
    // 5. Test the actual query from the API
    console.log('\n5. Testing exact API query...');
    const apiQuery = `
      SELECT 
        id, first_name, last_name, email, phone, current_title, current_location,
        professional_headline, experience_years, seniority_level,
        technical_skills, programming_languages, frameworks,
        expected_salary, remote_preference, freelancer,
        primary_industry, functional_domain, universities,
        degrees, certifications, spoken_languages, tags,
        source, status, created_at, updated_at,
        original_cv_url, original_cv_file_name,
        1 - (embedding <=> $1::vector) as similarity
      FROM candidates
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `;
    
    const apiResult = await pool.query(apiQuery, [embeddingString, 10]);
    console.log('API query results:', apiResult.rows.length);
    if (apiResult.rows.length > 0) {
      console.log('First result:', {
        name: `${apiResult.rows[0].first_name} ${apiResult.rows[0].last_name}`,
        title: apiResult.rows[0].current_title,
        similarity: apiResult.rows[0].similarity?.toFixed(4)
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugVectorSearch();
