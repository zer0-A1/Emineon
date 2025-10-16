import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AnalyzeResult = {
  skills: string[];
  types: Array<'technical' | 'functional' | 'softskills' | 'cognitive' | 'personality' | 'language'>;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  languages?: string[];
  tags?: string[];
  categories?: Record<string, string[]>; // category -> skills/topics
};

const FALLBACK_SKILLS = [
  'JavaScript','TypeScript','React','Node.js','HTML','CSS','SQL','Python','Java','AWS','Docker','Kubernetes','CI/CD','Testing','Leadership','Communication'
];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const text: string = body?.text || '';
    const preferTypes: string[] = Array.isArray(body?.preferTypes) ? body.preferTypes : [];

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Simple heuristic extraction without OpenAI
      const lc = text.toLowerCase();
      const skills = FALLBACK_SKILLS.filter(s => lc.includes(s.toLowerCase()));
      const categoryMap: Record<string, string[]> = {
        Technical: skills.filter(s => ['react','node','javascript','typescript','java','python','aws','docker','kubernetes','sql','html','css'].some(k => s.toLowerCase().includes(k))),
        Functional: skills.filter(s => ['product','qa','scrum','kanban','pm'].some(k => s.toLowerCase().includes(k))),
        'Soft skills': skills.filter(s => ['communication','leadership','team','collaboration','ownership','problem'].some(k => s.toLowerCase().includes(k))),
        Language: skills.filter(s => ['english','french','spanish','german'].some(k => s.toLowerCase().includes(k))),
      };

      const res: AnalyzeResult = {
        skills: skills.length ? skills : FALLBACK_SKILLS.slice(0, 6),
        types: (preferTypes as AnalyzeResult['types']) || ['technical'],
        duration: 45,
        difficulty: 'intermediate',
        languages: ['English'],
        tags: [],
        categories: categoryMap
      };
      return NextResponse.json({ success: true, data: res });
    }

    const prompt = `You will analyze a job description or free-form brief to design a candidate assessment. 
Extract the following as concise JSON (valid JSON only):
{
  "skills": ["distinct skill keywords"],
  "types": ["technical|functional|softskills|cognitive|personality|language"],
  "duration": 30-120,
  "difficulty": "beginner|intermediate|advanced",
  "languages": ["en", ...],
  "tags": ["short tags"],
  "categories": { "Technical": ["React","Node"], "Functional": ["Product","QA"], "Soft skills": ["Communication"], "Language": ["English"] }
}
Consider any explicit preferences: ${preferTypes.join(', ') || 'none'}.
TEXT:\n${text}`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert assessment analyst. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 600
      })
    });

    if (!resp.ok) {
      throw new Error(`OpenAI error: ${resp.status} ${resp.statusText}`);
    }
    const json = await resp.json();
    const content: string | undefined = json?.choices?.[0]?.message?.content;
    const parsed: AnalyzeResult = JSON.parse(content || '{}');

    const result: AnalyzeResult = {
      skills: Array.isArray(parsed?.skills) ? parsed.skills.slice(0, 40) : [],
      types: Array.isArray(parsed?.types) ? parsed.types as AnalyzeResult['types'] : ['technical'],
      duration: Number(parsed?.duration) || 60,
      difficulty: ['beginner','intermediate','advanced'].includes(parsed?.difficulty as any) ? parsed.difficulty as any : 'intermediate',
      languages: Array.isArray(parsed?.languages) ? parsed.languages : ['English'],
      tags: Array.isArray(parsed?.tags) ? parsed.tags.slice(0, 12) : [],
      categories: parsed?.categories && typeof parsed.categories === 'object' ? parsed.categories : undefined
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('Assessments analyze error:', err);
    return NextResponse.json({ success: false, error: 'Failed to analyze' }, { status: 500 });
  }
}


