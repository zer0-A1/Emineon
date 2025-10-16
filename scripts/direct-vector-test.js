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

async function testVectorSearchDirectly() {
  console.log('🔍 Direct Vector Search Test\n');
  
  try {
    // 1. Generate embedding
    console.log('Generating embedding for "python developer"...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: 'python developer',
      dimensions: 1536,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    console.log('✅ Embedding generated\n');
    
    // 2. Run the exact query from the API
    const searchQuery = `
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
    
    console.log('Running vector search query...');
    const results = await pool.query(searchQuery, [embeddingString, 10]);
    console.log(`✅ Found ${results.rows.length} results\n`);
    
    if (results.rows.length > 0) {
      console.log('Top 5 results:');
      results.rows.slice(0, 5).forEach((r, i) => {
        console.log(`${i + 1}. ${r.first_name} ${r.last_name} - ${r.current_title}`);
        console.log(`   Similarity: ${r.similarity.toFixed(4)}`);
        console.log(`   Skills: ${r.technical_skills?.join(', ') || 'N/A'}`);
        console.log('');
      });
      
      // 3. Test the API endpoint
      console.log('\n📡 Testing API endpoint...');
      const apiResponse = await fetch('http://localhost:3001/api/candidates/vector-search?q=python%20developer');
      const apiData = await apiResponse.json();
      console.log('API Response:', {
        success: apiData.success,
        results: apiData.data?.length || 0,
        searchType: apiData.searchType
      });
      
      if (apiData.data && apiData.data.length > 0) {
        console.log('\nAPI Results:');
        apiData.data.slice(0, 3).forEach((c, i) => {
          console.log(`${i + 1}. ${c.first_name} ${c.last_name} - ${c.current_title}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

testVectorSearchDirectly();
