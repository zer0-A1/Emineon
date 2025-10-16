import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/assessments/invite - send invitations to candidates (stub)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { assessmentId, candidateIds = [], jobId, message } = body || {};
    if (!assessmentId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ error: 'Missing assessmentId or candidateIds' }, { status: 400 });
    }

    // In a real implementation: persist invites, enqueue emails, track tokens, etc.
    const invites = candidateIds.map((cid: string) => ({
      id: `inv_${Date.now()}_${cid}`,
      assessmentId,
      candidateId: cid,
      jobId: jobId || null,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      message: message || null,
    }));

    return NextResponse.json({ success: true, invites });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send invites' }, { status: 500 });
  }
}


