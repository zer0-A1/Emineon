import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { openaiService } from '@/lib/openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ bullet: z.string().min(3), tone: z.string().optional() });

export async function POST(req: NextRequest) {
  try {
    const { bullet, tone } = Body.parse(await req.json());
    const prompt = `Rewrite this resume bullet to be concise, impact-driven, quantifiable, and ATS-friendly. Preserve truthfulness. Tone: ${tone || 'professional'}.

Original: ${bullet}

Return only the rewritten bullet.`;
    const content = await openaiService.parseCV(prompt);
    const text = content?.trim().replace(/^"|"$/g, '') || bullet;
    return NextResponse.json({ success: true, bullet: text });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Refine failed' }, { status: 400 });
  }
}


