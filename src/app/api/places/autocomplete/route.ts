export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return NextResponse.json({ error: 'Missing GOOGLE_MAPS_API_KEY' }, { status: 500 });
    const { searchParams } = new URL(req.url);
    const input = searchParams.get('input') || '';
    const sessiontoken = searchParams.get('sessiontoken') || undefined;
    const types = searchParams.get('types') || 'address';
    const components = searchParams.get('components') || undefined;
    if (!input) return NextResponse.json({ predictions: [] });

    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input);
    url.searchParams.set('key', key);
    url.searchParams.set('types', types);
    url.searchParams.set('language', 'en');
    if (components) url.searchParams.set('components', components);
    if (sessiontoken) url.searchParams.set('sessiontoken', sessiontoken);

    const res = await fetch(url.toString());
    const data = await res.json();
    return NextResponse.json({ predictions: data.predictions || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}


