import { NextRequest, NextResponse } from 'next/server';
import { responsesCreateWithRetry, buildIdempotencyKey } from '@/lib/ai/openai-client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { intent, text, role, extra } = await req.json();
    const prompt = `ROLE: ${role || 'Candidate CV'}\nINTENT: ${intent}\nEXTRA: ${extra || ''}\n\nTEXT:\n${text}\n\nRULES:\n- Keep facts, do not add claims\n- Preserve bullet/section structure when present\n- Improve clarity and concision; recruiters and ATS friendly\n- Return HTML only`;
    const response = await responsesCreateWithRetry({
      input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
      idempotencyKey: buildIdempotencyKey(prompt.slice(0, 256)),
    }, { maxRetries: 2 });
    const msg = response.output?.[0];
    const txt = msg?.type === 'message' ? (msg.content?.[0]?.type === 'output_text' ? msg.content?.[0]?.text : '') : '';
    return NextResponse.json({ success: true, html: txt || '' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'ai_edit_failed' }, { status: 500 });
  }
}


