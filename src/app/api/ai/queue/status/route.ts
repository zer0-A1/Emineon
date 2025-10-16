// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const job = await db.aIJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      error: job.error,
      result: job.result || null,
      updatedAt: job.updatedAt,
    });
  } catch (err) {
    console.error('Queue status error', err);
    return NextResponse.json({ error: 'status_failed' }, { status: 500 });
  }
}


