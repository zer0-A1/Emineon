# Scaling & Performance Recommendations for Emineon ATS

## Database Architecture

### Current Issues
- Single PostgreSQL instance (single point of failure)
- All data types in one database
- No read replicas
- Limited connection pooling

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                           │
│              (Rate limiting, Auth, Routing)              │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────────────┐                     ┌───────────────┐
│   Next.js     │                     │   Next.js     │
│   Instance 1  │                     │   Instance 2  │
└───────────────┘                     └───────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Redis Cluster                         │
│            (Cache + Session + Queue)                     │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  PostgreSQL   │   │    Vector     │   │     S3/R2     │
│   Primary     │   │   Database    │   │  Object Store │
└───────────────┘   └───────────────┘   └───────────────┘
        │
┌───────────────┐
│  PostgreSQL   │
│  Read Replica │
└───────────────┘
```

## Specific Improvements

### 1. Database Optimization

#### Connection Pooling with PgBouncer
```yaml
# pgbouncer.ini
[databases]
emineon_ats = host=postgres.example.com dbname=emineon_ats

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
reserve_pool_size = 10
```

#### Read/Write Split
```typescript
// src/lib/prisma-read-write.ts
export const prismaWrite = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});

export const prismaRead = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_REPLICA_URL }
  }
});

// Usage
const candidates = await prismaRead.candidate.findMany(); // Read operations
await prismaWrite.candidate.create({ ... }); // Write operations
```

### 2. Caching Strategy

#### Multi-Level Cache
```typescript
// src/lib/cache/multi-level.ts
class MultiLevelCache {
  private l1: Map<string, any> = new Map(); // In-memory
  private l2: Redis; // Redis
  private l3: CloudflareKV; // Edge cache
  
  async get(key: string) {
    // Check L1
    if (this.l1.has(key)) {
      return this.l1.get(key);
    }
    
    // Check L2
    const l2Value = await this.l2.get(key);
    if (l2Value) {
      this.l1.set(key, l2Value);
      return l2Value;
    }
    
    // Check L3
    const l3Value = await this.l3.get(key);
    if (l3Value) {
      await this.l2.set(key, l3Value, 'EX', 300);
      this.l1.set(key, l3Value);
      return l3Value;
    }
    
    return null;
  }
}
```

#### Cache Patterns
```typescript
// 1. Cache-aside for candidate search
const SEARCH_CACHE_TTL = 300; // 5 minutes

async function searchCandidates(query: string) {
  const cacheKey = `search:${createHash(query)}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from DB
  const results = await performSearch(query);
  
  // Cache results
  await redis.setex(cacheKey, SEARCH_CACHE_TTL, JSON.stringify(results));
  
  return results;
}

// 2. Write-through for candidate updates
async function updateCandidate(id: string, data: any) {
  // Update database
  const candidate = await prisma.candidate.update({
    where: { id },
    data
  });
  
  // Update cache
  await redis.setex(`candidate:${id}`, 3600, JSON.stringify(candidate));
  
  // Invalidate search caches
  await redis.del(`search:*`);
  
  return candidate;
}
```

### 3. File Storage Optimization

#### Move to S3-Compatible Storage
```typescript
// src/lib/storage/s3-storage.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Storage {
  private client: S3Client;
  
  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.S3_ENDPOINT, // Can use R2, MinIO, etc
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      }
    });
  }
  
  async uploadFile(file: Buffer, key: string) {
    await this.client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: 'application/pdf',
      Metadata: {
        uploadedAt: new Date().toISOString()
      }
    }));
    
    // Generate CDN URL
    return `${process.env.CDN_URL}/${key}`;
  }
  
  async getPresignedUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key
    });
    
    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }
}
```

### 4. Search Infrastructure

#### Elasticsearch for Full-Text + Vector Search
```typescript
// src/lib/search/elasticsearch.ts
export class ElasticsearchService {
  async indexCandidate(candidate: any) {
    await this.client.index({
      index: 'candidates',
      id: candidate.id,
      body: {
        ...candidate,
        suggest: {
          input: [
            candidate.firstName,
            candidate.lastName,
            candidate.currentTitle,
            ...candidate.technicalSkills
          ],
          weight: candidate.matchingScore || 1
        },
        embedding: {
          type: 'dense_vector',
          dims: 1536,
          index: true,
          similarity: 'cosine'
        }
      }
    });
  }
  
  async search(query: string, filters?: any) {
    const response = await this.client.search({
      index: 'candidates',
      body: {
        query: {
          bool: {
            should: [
              // Text search
              {
                multi_match: {
                  query,
                  fields: ['firstName^2', 'lastName^2', 'currentTitle', 'technicalSkills'],
                  type: 'best_fields',
                  fuzziness: 'AUTO'
                }
              },
              // Vector search
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                    params: {
                      query_vector: await this.getEmbedding(query)
                    }
                  }
                }
              }
            ],
            filter: filters
          }
        },
        suggest: {
          text: query,
          simple_phrase: {
            phrase: {
              field: 'suggest',
              size: 5,
              gram_size: 3,
              direct_generator: [{
                field: 'suggest',
                suggest_mode: 'popular'
              }]
            }
          }
        }
      }
    });
    
    return response;
  }
}
```

### 5. Background Job Processing

#### BullMQ with Redis
```typescript
// src/lib/queue/queues.ts
import { Queue, Worker } from 'bullmq';

// Separate queues by priority
export const queues = {
  embeddings: new Queue('embeddings', { connection: redis }),
  emails: new Queue('emails', { connection: redis }),
  exports: new Queue('exports', { connection: redis }),
  analytics: new Queue('analytics', { connection: redis })
};

// Worker with concurrency control
new Worker('embeddings', async (job) => {
  const { candidateId } = job.data;
  await generateAndStoreEmbedding(candidateId);
}, {
  connection: redis,
  concurrency: 5,
  limiter: {
    max: 100,
    duration: 60000 // 100 jobs per minute
  }
});
```

### 6. API Optimization

#### GraphQL for Efficient Data Fetching
```typescript
// src/graphql/schema.ts
export const typeDefs = gql`
  type Candidate {
    id: ID!
    firstName: String!
    lastName: String!
    # Only fetch what's needed
    applications(first: Int, after: String): ApplicationConnection!
    matchScore(jobId: ID!): Float
  }
  
  type Query {
    candidate(id: ID!): Candidate
    searchCandidates(
      query: String!
      filters: CandidateFilters
      first: Int = 50
      after: String
    ): CandidateConnection!
  }
`;

// DataLoader for N+1 prevention
const candidateLoader = new DataLoader(async (ids) => {
  const candidates = await prisma.candidate.findMany({
    where: { id: { in: ids } }
  });
  return ids.map(id => candidates.find(c => c.id === id));
});
```

### 7. Monitoring & Observability

#### Performance Monitoring
```typescript
// src/lib/monitoring/apm.ts
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('emineon-ats');

export function traceAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

// Usage
const candidates = await traceAsync('db.candidates.search', async () => {
  return prisma.candidate.findMany({ ... });
});
```

## Migration Plan

### Phase 1: Foundation (2-4 weeks)
1. Implement Redis caching
2. Add pgvector to PostgreSQL
3. Set up monitoring

### Phase 2: Search Enhancement (4-6 weeks)
1. Deploy Elasticsearch
2. Implement hybrid search
3. Migrate from Vercel Blob to S3

### Phase 3: Scale Preparation (6-8 weeks)
1. Add read replicas
2. Implement GraphQL API
3. Add job queues

### Phase 4: Advanced Features (8-12 weeks)
1. Multi-region deployment
2. Advanced analytics
3. ML-based ranking

## Cost Estimation

### Current Setup (~$500/month)
- Vercel: $200
- PostgreSQL: $200
- Blob Storage: $100

### Scaled Setup (~$2000-3000/month)
- Kubernetes Cluster: $500
- PostgreSQL (Primary + Replica): $600
- Elasticsearch: $400
- Redis Cluster: $300
- S3 Storage: $200
- CDN: $200
- Monitoring: $200
- Vector DB: $300-800
