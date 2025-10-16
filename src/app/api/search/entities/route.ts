export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const Query = z.object({
  q: z.string().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  filters: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const args = Query.parse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
      filters: searchParams.get('filters') ?? undefined,
    });

    const appId = process.env.ALGOLIA_APP_ID!;
    const searchKey = process.env.ALGOLIA_SEARCH_KEY!;
    if (!appId || !searchKey) {
      return NextResponse.json({ error: 'Algolia env not configured' }, { status: 500 });
    }

    const endpoint = `https://${appId}-dsn.algolia.net/1/indexes/emineon_entities/query`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': appId,
        'X-Algolia-API-Key': searchKey,
      },
      body: JSON.stringify({
        query: args.q,
        hitsPerPage: args.limit,
        filters: args.filters,
      }),
      // Never cache server-side search
      cache: 'no-store',
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Algolia error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    return NextResponse.json({ items: data.hits || [], total: data.nbHits || 0 });
  } catch (err: any) {
    console.error('search/entities failed', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}


