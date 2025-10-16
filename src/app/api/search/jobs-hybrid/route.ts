// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { embedTextSmall1536, toVectorLiteral } from '@/lib/embeddings';

const Query = z.object({
  q: z.string().default(''),
  limit: z.coerce.number().min(1).max(200).default(50),
  wVec: z.coerce.number().min(0).max(1).optional(),
  wLex: z.coerce.number().min(0).max(1).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const args = Query.parse({
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || undefined,
      wVec: searchParams.get('wVec') || undefined,
      wLex: searchParams.get('wLex') || undefined,
    });

    const q = args.q.trim();
    if (!q) return NextResponse.json({ items: [], total: 0 });

    const wVec = args.wVec ?? 0.6;
    const wLex = args.wLex ?? 0.4;

    // Compute embedding for semantic search
    let vecLiteral: string | null = null;
    try {
      const emb = await embedTextSmall1536(q);
      vecLiteral = toVectorLiteral(emb);
    } catch (e) {
      vecLiteral = null;
    }

    // Vector and lexical queries
    let vectorRows: Array<{ sourceId: string; vec_score: number }> = [];
    if (vecLiteral) {
      try {
        vectorRows = await db.$queryRawUnsafe(
          `SELECT "sourceId", 1 - (embedding_vec <=> $1::vector) AS vec_score
           FROM search_documents
           WHERE "sourceType" = 'JOB' AND embedding_vec IS NOT NULL
           ORDER BY embedding_vec <=> $1::vector
           LIMIT $2`,
          vecLiteral,
          args.limit,
        );
      } catch {}
    }

    let lexicalRows: Array<{ sourceId: string; lex_score: number }> = [];
    try {
      lexicalRows = await db.$queryRawUnsafe(
        `SELECT "sourceId", ts_rank(tsv, plainto_tsquery('simple', $1)) AS lex_score
         FROM search_documents
         WHERE "sourceType" = 'JOB' AND tsv @@ plainto_tsquery('simple', $1)
         ORDER BY lex_score DESC
         LIMIT $2`,
        q,
        args.limit,
      );
    } catch {}

    // Merge and rerank
    const byId: Record<string, { vec?: number; lex?: number }> = {};
    for (const r of vectorRows) {
      if (!byId[r.sourceId]) byId[r.sourceId] = {};
      byId[r.sourceId].vec = Number(r.vec_score) || 0;
    }
    for (const r of lexicalRows) {
      if (!byId[r.sourceId]) byId[r.sourceId] = {};
      byId[r.sourceId].lex = Number(r.lex_score) || 0;
    }

    const maxLex = Math.max(0, ...Object.values(byId).map(v => v.lex ?? 0));
    const items = Object.entries(byId)
      .map(([id, s]) => {
        const vec = s.vec ?? 0;
        const lexRaw = s.lex ?? 0;
        const lex = maxLex > 0 ? lexRaw / maxLex : 0;
        const score = wVec * vec + wLex * lex;
        return { objectID: id, score, vec_score: vec, lex_score: lexRaw };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, args.limit);

    return NextResponse.json({ items, total: items.length });
  } catch (err: any) {
    console.error('jobs-hybrid search failed', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}


