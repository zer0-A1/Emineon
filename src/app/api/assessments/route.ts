import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/assessments - save assessment definition (stub persistence)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    // In a real implementation, persist to DB (assessment, questions, links)
    const saved = {
      id: `asm_${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error('Save assessment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save assessment' }, { status: 500 });
  }
}


