# Vector Search Implementation Guide

## Prerequisites

1. **OpenAI API Key** - Add to your `.env.local`:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

2. **PostgreSQL with pgvector** (Optional for production optimization)

## Quick Start

### 1. Install Dependencies (Already done)
The required packages are already installed:
- `openai` - For generating embeddings
- `ioredis` - For caching (optional)
- Other dependencies

### 2. Run Database Migration
First, ensure the search_documents table exists:

```bash
npx prisma migrate deploy
```

### 3. Generate Embeddings for Existing Candidates

Run the embedding generation script:

```bash
npx tsx scripts/generate-embeddings.ts
```

This will:
- Process all existing candidates
- Extract text from CVs (if available)
- Generate embeddings for each candidate
- Store them in the search_documents table

### 4. Test Vector Search

Test the vector search API directly:

```bash
# Test with a semantic query
curl "http://localhost:3002/api/candidates/vector-search?q=senior%20react%20developer%20with%20aws%20experience"
```

## How It Works

### Search Flow
1. User types in search box
2. Frontend tries vector search first (`/api/candidates/vector-search`)
3. If OpenAI is configured, returns semantic results
4. If not, falls back to text search automatically

### What's Searchable
- **All 70+ candidate fields** including:
  - Basic info (name, email, phone)
  - Professional details (title, location, experience)
  - Skills (technical, soft, programming languages, frameworks, tools, methodologies)
  - Education (universities, degrees, certifications)
  - Work preferences (salary, contract type, remote, relocation)
  - Industry & domain expertise
  - Personal details (nationality, languages, timezone)
  - Online presence (LinkedIn, GitHub, portfolio)
  - Notes, tags, and metadata
  - **Full CV content** (automatically extracted)
  - **Competence file content**

### Automatic Updates
- New candidates: Embeddings generated on creation
- CV uploads: Re-indexed with document content
- Profile updates: Can trigger re-indexing

## Production Considerations

### 1. Rate Limiting
OpenAI has rate limits. The system includes:
- 100ms delay between embedding generations
- Retry logic for failed requests
- Graceful fallback to text search

### 2. Costs
- OpenAI charges per token
- text-embedding-3-small: ~$0.02 per 1M tokens
- Average candidate profile: ~500-1000 tokens
- Cost: ~$0.02-0.04 per 1000 candidates

### 3. Performance Optimization
For production with many candidates:

```sql
-- Add pgvector extension (optional)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to search_documents
ALTER TABLE search_documents 
ADD COLUMN embedding_vector vector(1536);

-- Create index for fast similarity search
CREATE INDEX idx_search_documents_embedding 
ON search_documents 
USING ivfflat (embedding_vector vector_cosine_ops);
```

### 4. Environment Variables
```env
# Required
OPENAI_API_KEY=sk-your-key-here

# Optional
REDIS_URL=redis://localhost:6379
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

## Monitoring

Check the logs for:
- "🔄 Updating embeddings for candidate..."
- "✅ Embeddings updated for candidate..."
- "Using vector search results" (in browser console)

## Troubleshooting

### No search results
1. Check if OpenAI API key is set
2. Run embedding generation script
3. Check browser console for errors

### Slow search
1. Implement Redis caching
2. Use pgvector for production
3. Reduce embedding dimension

### High costs
1. Cache embeddings aggressively
2. Only update changed fields
3. Use batch processing

## Next Steps

1. Add OpenAI API key to environment
2. Generate embeddings for existing data
3. Test the search functionality
4. Monitor usage and costs
5. Optimize for production if needed
