// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { embedTextSmall1536, toVectorLiteral } from '@/lib/embeddings';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const schema = z.object({ query: z.string().min(2), topK: z.number().int().min(1).max(20).optional() });
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    const { query, topK = 5 } = parsed.data;

    // Get embedding
    const vec = await embedTextSmall1536(query);
    const vecLiteral = toVectorLiteral(vec);

    // Try pgvector similarity (<->). If vector column not available, fallback to simple LIKE search.
    try {
      const rows: Array<{ id: string; title: string | null; text: string | null; score: number }>
        = await db.$queryRawUnsafe(
          `SELECT id, title, text, 1 - (embedding <#> ($1)::vector) AS score
           FROM "search_documents"
           ORDER BY embedding <-> ($1)::vector
           LIMIT $2`,
          vecLiteral,
          topK,
        );
      return NextResponse.json({ success: true, results: rows });
    } catch (e) {
      // Fallback: naive LIKE search
      const docs = await db.searchDocument.findMany({
        where: { OR: [{ title: { contains: query, mode: 'insensitive' } }, { text: { contains: query, mode: 'insensitive' } }] },
        take: topK,
        select: { id: true, title: true, text: true },
      });
      const results = docs.map(d => ({ ...d, score: 0.1 }));
      return NextResponse.json({ success: true, results, fallback: true });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Search failed' }, { status: 500 });
  }
}


