// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { normalPriorityQueue } from '@/lib/ai/queue';

export const runtime = 'nodejs';

// Minimal enqueue endpoint for AI/PDF jobs using Vercel Queues
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, payload, priority } = body || {};

    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }

    // Create DB job record first
    const job = await db.aIJob.create({
      data: {
        type: type,
        status: 'pending',
        payload: payload || {},
        progress: { percentage: 0, message: 'Queued' },
      },
      select: { id: true },
    });

    // Attempt to enqueue to Vercel Queues if available; otherwise fallback to in-memory queue
    try {
      // Avoid static bundling by using eval(import)
      const mod: any = await (eval('import')('@vercel/queues'));
      const queue = new mod.Queue('ai-tasks');
      await queue.send({ type, payload: { ...payload, jobId: job.id }, priority: priority || 'normal', ts: Date.now() });
      return NextResponse.json({ success: true, provider: 'vercel-queues', jobId: job.id });
    } catch (e) {
      // Fallback: execute asynchronously on local in-memory queue
      await normalPriorityQueue.add(async () => {
        try {
          // Dispatch by type using internal handlers via dynamic imports
          switch (type) {
            case 'generate_pdf': {
              const mod = await import('@/app/api/competence-files/generate/route');
              (mod as any)?.handleQueuedGenerate?.({ ...(payload || {}), jobId: job.id });
              break;
            }
            case 'ai_optimize': {
              const mod = await import('@/app/api/openai-responses/route');
              (mod as any)?.handleQueuedOptimize?.({ ...(payload || {}), jobId: job.id });
              break;
            }
            default:
              console.warn('Local queue: unknown job type', type);
          }
          await db.aIJob.update({ where: { id: job.id }, data: { status: 'completed', progress: { percentage: 100, message: 'Done' } } });
        } catch (err) {
          console.error('Local queue job failed', err);
          await db.aIJob.update({ where: { id: job.id }, data: { status: 'failed', error: String(err) } });
        }
      });
      return NextResponse.json({ success: true, provider: 'local-queue', jobId: job.id });
    }
  } catch (err) {
    console.error('Enqueue failed', err);
    return NextResponse.json({ error: 'enqueue_failed' }, { status: 500 });
  }
}


