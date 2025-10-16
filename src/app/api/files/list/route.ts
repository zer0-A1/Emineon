import { NextRequest, NextResponse } from 'next/server';
import { universalStorage } from '@/lib/universal-storage';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') || 'documents') as any;
    // candidateId is not used for listing by prefix across Vercel Blob public store,
    // but kept for future filtering when we persist metadata separately
    const files = await universalStorage.listFilesByCategory(category);
    return NextResponse.json({ success: true, files });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'failed_to_list' }, { status: 500 });
  }
}


