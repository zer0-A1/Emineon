// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { rebuildCoreEntitiesIndex } from '@/lib/ai/search-index';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const authResult = await handleAuth();
  if (!authResult.isAuthenticated && authResult.response) {
    return authResult.response;
  }
  try {
    // One-time safety: ensure table/columns/indexes exist in prod
    // This is idempotent and will no-op if already present
    // Create table with Prisma-expected camelCase columns
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "search_documents" (
          "id" text PRIMARY KEY,
          "sourceType" text NOT NULL,
          "sourceId" text NOT NULL,
          "title" text,
          "text" text NOT NULL,
          "html" text,
          "metadata" jsonb DEFAULT '{}'::jsonb,
          "permissions" jsonb DEFAULT '{}'::jsonb,
          "embedding" jsonb,
          "createdAt" timestamptz DEFAULT now(),
          "updatedAt" timestamptz DEFAULT now()
        );
      `);
    } catch {}
    try {
      await db.$executeRawUnsafe(`
        ALTER TABLE "search_documents"
        ADD CONSTRAINT IF NOT EXISTS "search_documents_source_unique"
        UNIQUE ("sourceType", "sourceId");
      `);
    } catch {}
    // Try enabling vector and adding optional vector column and indexes
    try { await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`); } catch {}
    try { await db.$executeRawUnsafe(`ALTER TABLE "search_documents" ADD COLUMN IF NOT EXISTS "embedding_vec" vector(1536);`); } catch {}
    try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_search_documents_embedding_vec ON "search_documents" USING ivfflat ("embedding_vec" vector_cosine_ops) WITH (lists = 100);`); } catch {}
    // Optional lexical index (expression) without extra column
    try { await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_search_documents_tsv ON "search_documents" USING GIN ((to_tsvector('simple', coalesce("title",'') || ' ' || coalesce("text",''))));`); } catch {}
    await rebuildCoreEntitiesIndex();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Reindex error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


