import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ResumeSchema } from '@/lib/resume/schema';

export const runtime = 'nodejs';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export async function POST(request: NextRequest) {
  try {
    const { resume, job } = await request.json();
    const baseResume = ResumeSchema.parse(resume);
    const jobText: string = typeof job === 'string' ? job : '';

    const client = getOpenAI();

    // Mock/heuristic fallback if no API key
    if (!client) {
      const boosted = { ...baseResume } as any;
      // Simple heuristic: ensure a short summary and prepend one quantified bullet to the latest entry
      const jobHint = jobText ? ` Tailored for: ${jobText.substring(0, 120)}…` : '';
      boosted.basics = {
        ...(boosted.basics || {}),
        summary:
          boosted.basics?.summary ||
          `Results-driven professional with impact across ${
            (boosted.skills?.[0]?.items?.slice(0, 3) || []).join(', ') || 'key areas'
          }.${jobHint}`,
      };
      if (boosted.experience?.length) {
        const last = boosted.experience[boosted.experience.length - 1];
        last.bullets = [
          'Delivered measurable outcomes (↑ efficiency, ↓ cost) by owning end-to-end initiatives.',
          ...(last.bullets || []),
        ];
      }
      const validated = ResumeSchema.parse(boosted);
      return NextResponse.json({ success: true, resume: validated });
    }

    const system =
      'You are an expert resume editor. Improve the resume for clarity, impact, and ATS alignment. Maintain structure and return valid JSON matching the ResumeSchema.';
    const user = `Resume JSON:\n${JSON.stringify(baseResume)}\n\nJob description (optional):\n${jobText}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    let text = completion.choices?.[0]?.message?.content || '{}';
    let json: any;
    try { json = JSON.parse(text); } catch { json = {}; }
    const improved = ResumeSchema.parse(json);
    return NextResponse.json({ success: true, resume: improved });
  } catch (error: any) {
    console.error('Optimize resume error:', error);
    return NextResponse.json({ success: false, error: 'Failed to optimize resume.', message: error?.message }, { status: 500 });
  }
}


