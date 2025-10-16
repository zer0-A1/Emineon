import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function setupPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ PINECONE_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('🚀 Setting up Pinecone...');
  
  const pc = new Pinecone({
    apiKey: apiKey
  });

  try {
    // List existing indexes
    const indexes = await pc.listIndexes();
    console.log('📊 Existing indexes:', indexes);
    
    const indexName = 'emineon-candidates';
    const indexExists = indexes.indexes?.some(index => index.name === indexName);
    
    if (indexExists) {
      console.log(`✅ Index '${indexName}' already exists`);
      
      // Get index stats
      const index = pc.index(indexName);
      const stats = await index.describeIndexStats();
      console.log('📈 Index stats:', stats);
    } else {
      console.log(`📝 Creating index '${indexName}'...`);
      
      // Create new index
      await pc.createIndex({
        name: indexName,
        dimension: 1536, // OpenAI embedding size
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1' // Use us-east-1 for free tier
          }
        }
      });
      
      console.log(`✅ Index '${indexName}' created successfully!`);
      
      // Wait for index to be ready
      console.log('⏳ Waiting for index to be ready...');
      let ready = false;
      while (!ready) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const indexes = await pc.listIndexes();
        const index = indexes.indexes?.find(i => i.name === indexName);
        ready = index?.status?.ready === true;
        if (!ready) {
          console.log('⏳ Still initializing...');
        }
      }
      
      console.log('✅ Index is ready!');
    }
    
    // Test the connection
    const index = pc.index(indexName);
    const testVector = Array(1536).fill(0.1);
    
    console.log('🧪 Testing index with sample vector...');
    await index.upsert([{
      id: 'test-vector',
      values: testVector,
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    }]);
    
    // Query test
    const queryResponse = await index.query({
      vector: testVector,
      topK: 1,
      includeMetadata: true
    });
    
    console.log('✅ Test query successful:', queryResponse.matches?.[0]);
    
    // Clean up test vector
    await index.deleteOne('test-vector');
    console.log('🧹 Cleaned up test vector');
    
    console.log('\n🎉 Pinecone setup complete!');
    console.log(`📍 Index: ${indexName}`);
    console.log('📏 Dimension: 1536');
    console.log('📐 Metric: cosine');
    
  } catch (error) {
    console.error('❌ Error setting up Pinecone:', error);
    process.exit(1);
  }
}

setupPinecone().catch(console.error);
