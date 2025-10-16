import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { z } from 'zod';
import { query } from '@/lib/db/neon-client';
import { generateEmbedding, toVectorLiteral } from '@/lib/embeddings/unified-embeddings';

const Query = z.object({
  q: z.string().default(''),
  limit: z.coerce.number().min(1).max(200).default(50),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const args = Query.parse({
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || undefined,
    });

    const q = args.q.trim();
    if (!q) return NextResponse.json({ items: [], total: 0 });

    // Compute embedding using text-embedding-3-large (1536 dims)
    const emb = await generateEmbedding(q);
    const vecLiteral = toVectorLiteral(emb);

    // Use candidates table directly; our schema uses vector column 'embedding'
    const rows = await query<any>(
      `SELECT id AS "sourceId", 1 - (embedding <=> $1::vector) AS score
       FROM candidates
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vecLiteral, args.limit]
    );

    const items = rows.map(r => ({ objectID: r.sourceId, score: Number(r.score) || 0 }));
    return NextResponse.json({ items, total: items.length });
  } catch (err: any) {
    console.error('candidates-vector search failed', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}


