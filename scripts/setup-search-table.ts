import { PrismaClient } from '@prisma/client';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  const prisma = new PrismaClient();
  try {
    console.log('Using DATABASE_URL:', dbUrl.replace(/:[^:@/]+@/, ':[REDACTED]@'));
    try {
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
      console.log('pgvector extension ensured');
    } catch (e) {
      console.warn('pgvector CREATE EXTENSION failed (non-fatal):', (e as any)?.message || e);
    }

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "search_documents" (
        "id"         text PRIMARY KEY,
        "sourceType" text NOT NULL,
        "sourceId"   text NOT NULL,
        "title"      text,
        "text"       text NOT NULL,
        "html"       text,
        "metadata"   jsonb DEFAULT '{}'::jsonb,
        "permissions" jsonb DEFAULT '{}'::jsonb,
        "embedding"  jsonb,
        "createdAt"  timestamptz DEFAULT now(),
        "updatedAt"  timestamptz DEFAULT now()
      );
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "search_documents"
      ADD CONSTRAINT IF NOT EXISTS "search_documents_source_unique"
      UNIQUE ("sourceType","sourceId");
    `);
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "search_documents"
        ADD COLUMN IF NOT EXISTS "embedding_vec" vector(1536);
      `);
    } catch (e) {
      console.warn('embedding_vec add failed (non-fatal):', (e as any)?.message || e);
    }
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_search_documents_embedding_vec
        ON "search_documents" USING ivfflat ("embedding_vec" vector_cosine_ops) WITH (lists = 100);
      `);
    } catch (e) {
      console.warn('embedding_vec index failed (non-fatal):', (e as any)?.message || e);
    }
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_search_documents_tsv
      ON "search_documents"
      USING GIN ((to_tsvector('simple', coalesce("title",'') || ' ' || coalesce("text",''))));
    `);
    console.log('search_documents table and indexes ensured');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});


