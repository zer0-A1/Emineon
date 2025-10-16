export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return NextResponse.json({ error: 'Missing GOOGLE_MAPS_API_KEY' }, { status: 500 });
    const { searchParams } = new URL(req.url);
    const place_id = searchParams.get('place_id');
    const sessiontoken = searchParams.get('sessiontoken') || undefined;
    if (!place_id) return NextResponse.json({ error: 'place_id required' }, { status: 400 });

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', place_id);
    url.searchParams.set('fields', 'formatted_address,address_component,geometry');
    url.searchParams.set('key', key);
    if (sessiontoken) url.searchParams.set('sessiontoken', sessiontoken);

    const res = await fetch(url.toString());
    const data = await res.json();
    return NextResponse.json({ result: data.result || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}


