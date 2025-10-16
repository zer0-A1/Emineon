// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Minimal worker endpoint for Vercel Queues development (local polling)
// In production, configure Vercel Queues consumer to this route.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { records } = body || {};
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: 'records array required' }, { status: 400 });
    }

    for (const record of records) {
      const { type, payload } = record.body || {};
      const jobId = payload?.jobId as string | undefined;
      try {
        if (jobId) await db.aIJob.update({ where: { id: jobId }, data: { status: 'in_progress', progress: { percentage: 5, message: 'Started' } } });
        switch (type) {
          case 'generate_pdf': {
            // Call HTTP endpoint to avoid tight coupling
            await fetch('/api/competence-files/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            break;
          }
          case 'ai_optimize': {
            const mod = await import('@/app/api/openai-responses/route');
            (mod as any)?.handleQueuedOptimize?.(payload);
            break;
          }
          default:
            console.warn('Unknown queue job type:', type);
        }
        if (jobId) await db.aIJob.update({ where: { id: jobId }, data: { status: 'completed', progress: { percentage: 100, message: 'Done' } } });
      } catch (e) {
        console.error('Queue job failed', type, e);
        if (jobId) await db.aIJob.update({ where: { id: jobId }, data: { status: 'failed', error: String(e) } });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Worker failed', err);
    return NextResponse.json({ error: 'worker_failed' }, { status: 500 });
  }
}


