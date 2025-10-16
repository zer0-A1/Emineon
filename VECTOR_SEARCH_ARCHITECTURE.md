# Enhanced Vector Search Architecture for Emineon ATS

## Current Issues
- Embeddings stored as JSON (inefficient)
- Cosine similarity calculated in JavaScript (slow)
- Limited to 1000 candidates for vector search
- No proper indexing for vector operations

## Recommended Solution: Hybrid Approach

### Option 1: PostgreSQL with pgvector (Recommended for Start)
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Modify search_documents table
ALTER TABLE search_documents 
ADD COLUMN embedding_vector vector(1536); -- OpenAI embedding dimension

-- Create proper index
CREATE INDEX ON search_documents 
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);
```

**Pros:**
- Minimal infrastructure change
- Native PostgreSQL integration
- Good performance up to ~1M vectors
- Supports exact and approximate search

**Cons:**
- Requires database migration
- Limited to PostgreSQL features

### Option 2: Dedicated Vector Database (For Scale)

#### Pinecone Integration
```typescript
// src/lib/vector-db/pinecone.ts
import { PineconeClient } from '@pinecone-database/pinecone';

export class PineconeVectorStore {
  private client: PineconeClient;
  private index: string = 'candidates';
  
  async upsertCandidate(candidateId: string, embedding: number[], metadata: any) {
    await this.client.index(this.index).upsert({
      vectors: [{
        id: candidateId,
        values: embedding,
        metadata: {
          ...metadata,
          timestamp: Date.now()
        }
      }]
    });
  }
  
  async search(queryEmbedding: number[], topK: number = 50) {
    const results = await this.client.index(this.index).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true
    });
    
    return results.matches;
  }
}
```

#### Alternatives:
- **Weaviate** - Open source, GraphQL API
- **Qdrant** - Rust-based, very fast
- **Milvus** - Highly scalable
- **ChromaDB** - Simple, embedded option

### Option 3: Elasticsearch with Vector Support
```typescript
// Elasticsearch 8.0+ with kNN
await esClient.index({
  index: 'candidates',
  body: {
    ...candidateData,
    embedding: {
      type: 'dense_vector',
      dims: 1536,
      index: true,
      similarity: 'cosine'
    }
  }
});
```

## Implementation Strategy

### Phase 1: Quick Win (1-2 weeks)
1. Implement pgvector in existing PostgreSQL
2. Migrate JSON embeddings to vector type
3. Add proper vector indexes

### Phase 2: Scale Preparation (1 month)
1. Add Redis caching layer
2. Implement background job queue for embeddings
3. Add monitoring and metrics

### Phase 3: Advanced Search (2-3 months)
1. Integrate dedicated vector database
2. Implement hybrid search (keyword + vector)
3. Add re-ranking algorithms
4. Implement feedback loop for search quality

## Search Quality Improvements

### 1. Hybrid Search
```typescript
async function hybridSearch(query: string) {
  // Run in parallel
  const [textResults, vectorResults] = await Promise.all([
    // Traditional text search
    searchByText(query),
    // Vector similarity search
    searchByVector(query)
  ]);
  
  // Combine and re-rank
  return reRankResults(textResults, vectorResults);
}
```

### 2. Multi-Modal Embeddings
- Combine text embeddings with:
  - Skills graph embeddings
  - Experience timeline embeddings
  - Document structure embeddings

### 3. Query Expansion
```typescript
async function expandQuery(query: string) {
  // Use LLM to expand query
  const expanded = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'system',
      content: 'Expand this recruiting search query with synonyms and related terms'
    }, {
      role: 'user',
      content: query
    }]
  });
  
  return expanded.choices[0].message.content;
}
```

## Performance Metrics to Track
- Query latency (p50, p95, p99)
- Recall@K (how many relevant results in top K)
- Click-through rate on search results
- Time to first meaningful result
- Search abandonment rate
