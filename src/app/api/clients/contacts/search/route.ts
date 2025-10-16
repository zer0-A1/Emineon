import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { hybridSearch } from '@/lib/embeddings/unified-embeddings';

export async function GET(request: NextRequest) {
  const authResult = await handleAuth();
  if (!authResult.isAuthenticated && authResult.response) return authResult.response;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit') || 20);
  const clientId = searchParams.get('clientId');
  if (!q.trim()) return NextResponse.json({ success: true, data: [] });
  try {
    // Hybrid vector+text search on all contacts; filter by client if provided
    const rows = await hybridSearch('client_contacts', q, Math.min(100, Math.max(1, limit)), 0.7);
    const filtered = clientId ? rows.filter((r:any)=> r.client_id === clientId) : rows;
    return NextResponse.json({ success: true, data: filtered.slice(0, limit) });
  } catch (e:any) {
    return NextResponse.json({ success: false, error: e?.message || 'Search failed' }, { status: 500 });
  }
}


