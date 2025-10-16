import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { candidate, query } = body || {};
    if (!candidate) return NextResponse.json({ error: 'candidate required' }, { status: 400 });

    // Prefer a dedicated summary key if provided
    const apiKey = process.env.OPENAI_API_KEY_SUMMARY || process.env.OPENAI_API_KEY;

    // Dev fallback: generate a lightweight heuristic sentence when no key is present
    if (!apiKey && process.env.NODE_ENV === 'development') {
      const name = candidate?.name || 'This candidate';
      const role = candidate?.currentRole || candidate?.current_title || candidate?.professionalHeadline;
      const loc = candidate?.location || candidate?.currentLocation;
      const topSkill = Array.isArray(candidate?.skills) && candidate.skills.length > 0
        ? candidate.skills.slice(0, 3).join(', ')
        : (Array.isArray(candidate?.technicalSkills) && candidate.technicalSkills.length > 0 ? candidate.technicalSkills.slice(0,2).join(', ') : undefined);
      const exp = candidate?.experienceYears ? `${candidate.experienceYears} years` : undefined;
      const intent = (query || '').trim();
      const pieces = [
        `${name} ${role ? `is a ${role}` : 'has relevant expertise'}`,
        loc ? `based in ${loc}` : undefined,
        topSkill ? `skilled in ${topSkill}` : undefined,
        exp ? `with ${exp} of experience` : undefined,
        intent ? `— aligned with “${intent}”.` : '.',
      ].filter(Boolean);
      const sentence = pieces.join(' ').replace(/\s+/g,' ').trim();
      return NextResponse.json({ ok: true, summary: sentence });
    }

    // If we have a key, call OpenAI
    const openai = new OpenAI({ apiKey: apiKey });
    const model = process.env.OPENAI_RESPONSES_MODEL || 'gpt-4.1-mini';

    const system = 'You generate one-sentence, concise, recruiting-friendly summaries linking a candidate profile to a search intent.';
    const user = `Search intent: ${query || 'general candidate discovery'}
Candidate (JSON): ${JSON.stringify(candidate).slice(0, 8000)}
Instruction: In one sentence (≤35 words), summarize the candidate and how they relate to the search. Use clear, positive language. Do not add hallucinated details.`;

    const res = await openai.responses.create({ model, input: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.3 });
    const text = (res.output_text || '').trim();
    return NextResponse.json({ ok: true, summary: text });
  } catch (err: any) {
    console.error('summarize candidate error', err);
    // In dev, do not block UX; return a safe fallback summary
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ ok: true, summary: 'Candidate summary unavailable; showing a generic description due to missing API key.' });
    }
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 });
  }
}


