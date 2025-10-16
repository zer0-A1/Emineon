import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up pgvector & search columns on current DATABASE_URL...');
  // Enable extension (if available) and setup columns/indexes. Run idempotently.
  const statements = [
    `CREATE EXTENSION IF NOT EXISTS vector;`,
    `ALTER TABLE "search_documents" ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);`,
    `ALTER TABLE "search_documents" ADD COLUMN IF NOT EXISTS tsv tsvector;`,
    `CREATE INDEX IF NOT EXISTS idx_search_documents_embedding_vec ON "search_documents" USING ivfflat (embedding_vec vector_cosine_ops) WITH (lists = 100);`,
    `CREATE INDEX IF NOT EXISTS idx_search_documents_tsv ON "search_documents" USING GIN (tsv);`,
  ];

  for (const sql of statements) {
    try {
      console.log('➡️  Executing:', sql.replace(/\s+/g, ' ').trim());
      // Use executeRawUnsafe to allow running CREATE EXTENSION etc.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await (prisma as any).$executeRawUnsafe(sql);
    } catch (e: any) {
      console.warn('⚠️  Statement failed (continuing):', e?.message || e);
    }
  }

  console.log('✅ pgvector setup completed.');
}

main()
  .catch((e) => {
    console.error('❌ pgvector setup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
