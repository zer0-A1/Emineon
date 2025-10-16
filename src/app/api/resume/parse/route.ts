import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ResumeSchema } from '@/lib/resume/schema';
import { openaiService } from '@/lib/openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
  text: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = RequestSchema.parse(body);

    // Try OpenAI normalization; if unavailable, fall back to heuristic
    let resume;
    try {
      const prompt = `You are given raw resume text. Map it to this JSON schema strictly. Make bullets concise and quantifiable. Deduplicate skills. Infer missing periods when obvious.

Schema:
${ResumeSchema.toString?.() || 'Resume { basics{name,title,location,email,phone,links,summary}, skills[{category,items[]}], experience[{id,role,company,period,location,bullets[],tech[]}], projects?, education?, extras? }'}

Return ONLY JSON.`;
      const content = await openaiService.parseCV(`${prompt}\n\nRESUME:\n${text}`);
      const parsed = JSON.parse(content);
      resume = ResumeSchema.parse(parsed);
    } catch {
      const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
      const guessName = lines[0]?.slice(0, 80) || '';
      resume = ResumeSchema.parse({ basics: { name: guessName, title: '', summary: '' }, skills: [], experience: [] });
    }

    return NextResponse.json({ success: true, resume });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Parse failed' }, { status: 400 });
  }
}


