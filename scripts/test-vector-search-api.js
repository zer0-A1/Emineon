#!/usr/bin/env node

const fetch = require('node-fetch');

async function testVectorSearch() {
  console.log('🔍 Testing Vector Search API\n');
  
  const searches = [
    'python developer',
    'backend engineer',
    'frontend developer',
    'jane smith',
    'alice johnson'
  ];
  
  for (const query of searches) {
    console.log(`\nSearching for: "${query}"`);
    
    try {
      const response = await fetch(`http://localhost:3001/api/candidates/vector-search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success}`);
      console.log(`Results: ${data.data?.length || 0}`);
      console.log(`Search Type: ${data.searchType}`);
      
      if (data.data && data.data.length > 0) {
        console.log('Top results:');
        data.data.slice(0, 3).forEach((c, i) => {
          console.log(`  ${i + 1}. ${c.first_name} ${c.last_name} - ${c.current_title} (score: ${c._score?.toFixed(4) || 'N/A'})`);
        });
      }
      
      if (data.error) {
        console.log(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(`Failed: ${error.message}`);
    }
  }
  
  // Also test regular search for comparison
  console.log('\n\n📝 Testing Regular Search API for comparison\n');
  
  for (const query of ['python', 'jane']) {
    console.log(`\nSearching for: "${query}"`);
    
    try {
      const response = await fetch(`http://localhost:3001/api/candidates?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success}`);
      console.log(`Results: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        console.log('Results:');
        data.data.forEach((c, i) => {
          console.log(`  ${i + 1}. ${c.name} - ${c.title}`);
        });
      }
    } catch (error) {
      console.error(`Failed: ${error.message}`);
    }
  }
}

testVectorSearch();
