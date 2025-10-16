# Chunking & Reindexing Architecture

## Overview

The system uses **text-embedding-3-large** (1536 dimensions) for high-quality embeddings with automatic chunking and reindexing when content changes.

## Chunking Strategy

### Why Chunking?
- OpenAI has token limits for embeddings
- Large documents (CVs, competence files) need to be split
- Overlapping chunks ensure context preservation

### Chunk Configuration
```typescript
const CHUNK_SIZE = 1000;      // Characters per chunk
const CHUNK_OVERLAP = 200;    // Overlap between chunks
```

### Smart Chunking Features
1. **Sentence Boundary Detection** - Prefers breaking at sentence ends
2. **Word Boundary Fallback** - Falls back to word boundaries if needed
3. **Section Preservation** - Groups related information together
4. **Metadata Tracking** - Each chunk knows its position and context

## Reindexing System

### Automatic Triggers
The system automatically reindexes candidates when:

1. **Create** - New candidate added
2. **Update** - Profile information changed
3. **CV Upload** - New CV document uploaded
4. **Competence File Upload** - New competence file added
5. **Skill Update** - Technical/soft skills modified
6. **Profile Update** - Major profile changes

### Database Triggers
```sql
-- PostgreSQL trigger notifies on changes
CREATE TRIGGER candidate_change_trigger
AFTER INSERT OR UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION notify_candidate_change();
```

### Reindex Flow
```
1. Candidate Change Detected
   ↓
2. Extract All Content
   - Basic info
   - Skills & experience
   - CV content (if uploaded)
   - Competence file content
   ↓
3. Smart Chunking
   - Split large content
   - Preserve context
   - Group related info
   ↓
4. Generate Embedding
   - Use text-embedding-3-large
   - Combine all chunks
   - Create single vector
   ↓
5. Update Database
   - Store in candidates.embedding
   - Update timestamps
   - Log activity
```

## API Endpoints

### Manual Reindex
```bash
POST /api/candidates/{id}/reindex
{
  "trigger": "manual",
  "changedFields": ["skills", "summary"]
}
```

### Batch Operations
```typescript
// Reindex all candidates without embeddings
await reindexCandidatesByCriteria({
  missingEmbedding: true
});

// Reindex recently updated
await reindexCandidatesByCriteria({
  updatedAfter: new Date('2024-01-01')
});
```

## Performance Optimizations

1. **Caching** - Embeddings are cached in memory
2. **Debouncing** - Rapid updates are debounced (1s)
3. **Batch Processing** - Multiple candidates can be processed together
4. **Rate Limiting** - Respects OpenAI API limits
5. **Background Processing** - Reindexing is async, doesn't block UI

## Content Extraction

### Supported Formats
- PDF documents
- DOCX files
- TXT files
- HTML content
- Markdown

### Extraction Process
```typescript
// Automatic extraction for documents
const cvContent = await extractDocumentText(candidate.original_cv_url);
const competenceContent = await extractDocumentText(competenceFile.file_url);
```

## Setup

Run the setup script to initialize the reindexing system:
```bash
npm run db:setup-reindex
```

This will:
1. Create database triggers
2. Setup notification listeners
3. Reindex any candidates missing embeddings

## Monitoring

Check reindex activity in the `project_activities` table:
```sql
SELECT * FROM project_activities 
WHERE type = 'OTHER' 
AND description LIKE '%reindex%'
ORDER BY created_at DESC;
```
