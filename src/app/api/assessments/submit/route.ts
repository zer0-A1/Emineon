import { NextRequest, NextResponse } from 'next/server';
import { universalStorage } from '@/lib/universal-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body?.token || '');
    const answers = body?.answers || {};

    if (!token || typeof answers !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    // Mock scoring
    const score = Math.floor(Math.random() * 100);
    const result = { score, maxScore: 100, submittedAt: new Date().toISOString() };

    // Persist attempt JSON in blob storage for later retrieval
    const payload = Buffer.from(JSON.stringify({ token, answers, result }, null, 2));
    try {
      await universalStorage.uploadFile(payload, `assessment_${token}.json`, 'application/json', 'assessments', {
        description: 'Assessment attempt',
        tags: ['assessment', 'attempt'],
      });
    } catch {}

    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Submit failed' }, { status: 500 });
  }
}


