#!/usr/bin/env node

const fetch = require('node-fetch');

async function testUISearchFlow() {
  console.log('🔍 Testing UI Search Flow\n');
  
  const searches = [
    'python',
    'python developer',
    'react',
    'machine learning',
    'emma'
  ];
  
  for (const query of searches) {
    console.log(`\n📝 Testing search: "${query}"`);
    
    // 1. Test vector search endpoint
    try {
      const vectorResponse = await fetch(`http://localhost:3000/api/candidates/vector-search?q=${encodeURIComponent(query)}&limit=50`, {
        cache: 'no-store'
      });
      
      console.log(`Vector Search Response Status: ${vectorResponse.status}`);
      
      if (vectorResponse.ok) {
        const vectorData = await vectorResponse.json();
        console.log(`Vector Search Success: ${vectorData.success}`);
        console.log(`Search Type: ${vectorData.searchType}`);
        console.log(`Results: ${vectorData.data?.length || 0}`);
        
        if (vectorData.data && vectorData.data.length > 0) {
          console.log('Top 3 matches:');
          vectorData.data.slice(0, 3).forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.first_name} ${c.last_name} - ${c.current_title}`);
          });
        }
      } else {
        console.log(`Vector search failed: ${vectorResponse.status}`);
      }
    } catch (error) {
      console.error(`Vector search error: ${error.message}`);
    }
    
    // 2. Test fallback search endpoint
    try {
      const regularResponse = await fetch(`http://localhost:3000/api/candidates?search=${encodeURIComponent(query)}`, {
        cache: 'no-store'
      });
      
      console.log(`\nRegular Search Response Status: ${regularResponse.status}`);
      
      if (regularResponse.ok) {
        const regularData = await regularResponse.json();
        console.log(`Results: ${regularData.data?.length || 0}`);
        
        if (regularData.data && regularData.data.length > 0) {
          console.log('Top matches:');
          regularData.data.slice(0, 3).forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.name} - ${c.title}`);
          });
        }
      }
    } catch (error) {
      console.error(`Regular search error: ${error.message}`);
    }
  }
  
  // Test empty search
  console.log('\n📝 Testing empty search reset');
  try {
    const emptyResponse = await fetch('http://localhost:3000/api/candidates?search=', {
      cache: 'no-store'
    });
    
    if (emptyResponse.ok) {
      const data = await emptyResponse.json();
      console.log(`Empty search returns all candidates: ${data.data?.length || 0}`);
    }
  } catch (error) {
    console.error(`Empty search error: ${error.message}`);
  }
}

testUISearchFlow();
