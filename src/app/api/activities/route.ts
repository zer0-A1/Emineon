// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { z } from 'zod';

export const runtime = 'nodejs';

// GET /api/activities?limit=20
export async function GET(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const [tasks, meetings, clientActivities] = await Promise.all([
      db.activityTask.findMany({ orderBy: { dueDate: 'asc' }, take: limit }),
      db.meetingEvent.findMany({ orderBy: { startsAt: 'asc' }, take: limit }),
      db.clientActivity.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
    ]);

    // @ts-ignore
    (NextResponse as any).revalidateTag?.('activities:list');
    return NextResponse.json({ success: true, data: { tasks, meetings, clientActivities } });
  } catch (error) {
    console.error('Error listing activities:', error);
    return NextResponse.json({ success: false, error: 'Failed to list activities' }, { status: 500 });
  }
}

// POST /api/activities (create task or meeting)
export async function POST(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ success: false, error: 'Invalid content type' }, { status: 400 });
    }

    const body = await request.json();

    if (body?.kind === 'task') {
      const schema = z.object({
        kind: z.literal('task'),
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).optional(),
        ownerEmail: z.string().email().optional(),
        clientId: z.string().optional(),
        projectId: z.string().optional(),
      });
      const data = schema.parse(body);
      const created = await db.activityTask.create({
        data: {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          priority: (data.priority || 'MEDIUM') as any,
          ownerEmail: data.ownerEmail,
          clientId: data.clientId,
          projectId: data.projectId,
        }
      });
      try { const { revalidateTag } = await import('next/cache'); revalidateTag('activities:list'); } catch {}
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (body?.kind === 'meeting') {
      const schema = z.object({
        kind: z.literal('meeting'),
        title: z.string().min(1),
        description: z.string().optional(),
        startsAt: z.string(),
        endsAt: z.string().optional(),
        location: z.string().optional(),
        organizer: z.string().optional(),
        attendees: z.array(z.string()).default([]),
        clientId: z.string().optional(),
        projectId: z.string().optional(),
      });
      const data = schema.parse(body);
      const created = await db.meetingEvent.create({
        data: {
          title: data.title,
          description: data.description,
          startsAt: new Date(data.startsAt),
          endsAt: data.endsAt ? new Date(data.endsAt) : null,
          location: data.location,
          organizer: data.organizer,
          attendees: data.attendees,
          clientId: data.clientId,
          projectId: data.projectId,
        }
      });
      try { const { revalidateTag } = await import('next/cache'); revalidateTag('activities:list'); } catch {}
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: 'Unknown kind' }, { status: 400 });
  } catch (error) {
    console.error('Error creating activity:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create activity' }, { status: 500 });
  }
}

