// Test candidates API endpoint
async function testCandidatesAPI() {
  console.log('🔍 Testing candidates API endpoint...\n');
  
  try {
    // Test 1: Basic API call
    console.log('Test 1: Basic API call to /api/candidates');
    const response = await fetch('http://localhost:3000/api/candidates', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`✅ API returned ${data.data?.length || 0} candidates`);
    } else {
      console.log('❌ API returned error:', data.error);
    }
    
    // Test 2: Check data structure
    if (data.data && data.data.length > 0) {
      console.log('\nTest 2: First candidate structure:');
      const firstCandidate = data.data[0];
      console.log('Keys:', Object.keys(firstCandidate).slice(0, 10).join(', '), '...');
      console.log('Sample candidate:', {
        id: firstCandidate.id,
        databaseId: firstCandidate.databaseId,
        name: firstCandidate.name,
        email: firstCandidate.email,
        currentTitle: firstCandidate.currentTitle
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to test API:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testCandidatesAPI();
