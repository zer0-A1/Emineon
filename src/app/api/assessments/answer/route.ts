import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const question: string = body?.question || '';
    const type: string = body?.type || 'text';
    const context: string = body?.context || '';

    if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback mock answer
      return NextResponse.json({ success: true, answer: 'Example answer (mock). Configure OPENAI_API_KEY for AI answers.' });
    }

    const prompt = `Provide a concise, correct answer for the assessment question below. If multiple choice, include the correct option only. If coding, provide a high-level reference solution. Keep it short.\n\nType: ${type}\nContext: ${context}\n\nQuestion: ${question}`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Return only the answer, no preface.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 400
      })
    });

    if (!resp.ok) throw new Error(`OpenAI error: ${resp.status} ${resp.statusText}`);
    const json = await resp.json();
    const content: string = json?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ success: true, answer: content.trim() });
  } catch (err) {
    console.error('Answer generation error:', err);
    return NextResponse.json({ success: false, error: 'Failed to generate answer' }, { status: 500 });
  }
}


