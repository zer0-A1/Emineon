// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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
    if (!q) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const rows: Array<{ sourceId: string; rank: number }> = await db.$queryRawUnsafe(
      `SELECT "sourceId", ts_rank(tsv, plainto_tsquery('simple', $1)) AS rank
       FROM search_documents
       WHERE "sourceType" = 'JOB' AND tsv @@ plainto_tsquery('simple', $1)
       ORDER BY rank DESC
       LIMIT $2`,
      q,
      args.limit,
    );

    const items = rows.map(r => ({ objectID: r.sourceId, rank: r.rank }));
    return NextResponse.json({ items, total: items.length });
  } catch (err: any) {
    console.error('jobs-fts search failed', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}


