import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenAIClient } from '@/lib/ai/openai-client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    // Soft auth: allow in dev/local even if unauthenticated to avoid blocking parsing during setup
    const isDev = process.env.NODE_ENV !== 'production';
    if (!userId && !isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let text: string | undefined;
    let uploadedFile: { name: string; type: string; base64: string } | null = null;
    if (contentType.includes('application/json')) {
      const body = await request.json();
      text = body?.text;
      if (!text || typeof text !== 'string') {
        return NextResponse.json({ error: 'Job description text is required' }, { status: 400 });
      }
    } else {
      // Allow file uploads directly, process via OpenAI Responses API with structured output
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No text or file provided' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      uploadedFile = { name: file.name, type: file.type || 'application/octet-stream', base64 };
    }
    // Build structured extraction via Responses API with JSON schema
    const client = getOpenAIClient();
    const jsonSchema = {
      name: 'job_extraction_schema',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', default: '' },
          company: { type: 'string', default: '' },
          location: { type: 'string', default: '' },
          contractType: { type: 'string', enum: ['permanent', 'fixed-term', 'contractor', 'internship', 'temporary', 'unknown'], default: 'unknown' },
          workMode: { type: 'string', enum: ['onsite', 'hybrid', 'remote', 'unknown'], default: 'unknown' },
          department: { type: 'string', default: '' },
          salary: { type: 'string', default: '' },
          startDate: { type: 'string', default: '' },
          experienceLevel: { type: 'string', default: '' },
          seniority: { type: 'string', default: '' },
          primaryIndustry: { type: 'string', default: '' },
          functionalDomain: { type: 'string', default: '' },
          languages: { type: 'array', items: { type: 'string' }, default: [] },
          skills: { type: 'array', items: { type: 'string' }, default: [] },
          requirements: { type: 'array', items: { type: 'string' }, default: [] },
          responsibilities: { type: 'array', items: { type: 'string' }, default: [] },
          benefits: { type: 'array', items: { type: 'string' }, default: [] },
          tags: { type: 'array', items: { type: 'string' }, default: [] },
          description: { type: 'string', default: '' },
          summary: { type: 'string', default: '' }
        },
        required: ['title']
      }
    } as const;

    const instructions = `You are an expert HR analyst.
Extract and normalize a job into the JSON schema. Keep arrays concise (<= 12 items each). Infer missing fields if obvious.
Normalize:
- contractType -> one of: permanent | fixed-term | contractor | internship | temporary | unknown
- workMode -> one of: onsite | hybrid | remote | unknown
Return strictly the JSON object for the schema.`;

    const inputBlocks: any[] = [];
    if (uploadedFile) {
      inputBlocks.push({
        role: 'user',
        content: [
          { type: 'input_file', filename: uploadedFile.name, file_data: `data:${uploadedFile.type};base64,${uploadedFile.base64}` },
          { type: 'input_text', text: instructions }
        ],
      });
    } else if (text) {
      inputBlocks.push({ role: 'user', content: [{ type: 'input_text', text }, { type: 'input_text', text: instructions }] });
    } else {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      input: inputBlocks,
      response_format: {
        type: 'json_schema',
        json_schema: jsonSchema as any,
      },
      temperature: 0.2,
      max_output_tokens: 2000,
    } as any);

    const out = response.output?.[0] as any;
    const raw = out?.content?.[0]?.text || out?.content?.[0]?.output_text || out?.content?.[0]?.json || '';
    let parsed: any = {};
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      // If schema enforced, OpenAI may already return object-like
      parsed = out?.content?.[0] ?? {};
    }

    // Post-normalize fields
    const norm = (s?: string) => (s || '').trim();
    const normalizeContract = (s?: string) => {
      const v = (s || '').toLowerCase();
      if (v.includes('intern')) return 'internship';
      if (v.includes('fixed')) return 'fixed-term';
      if (v.includes('contract')) return 'contractor';
      if (v.includes('temp')) return 'temporary';
      if (v.includes('perm') || v.includes('permanent') || v.includes('full-time')) return 'permanent';
      return ['permanent','fixed-term','contractor','internship','temporary'].includes(v) ? v : 'unknown';
    };
    const normalizeWorkMode = (s?: string) => {
      const v = (s || '').toLowerCase();
      if (v.includes('remote')) return 'remote';
      if (v.includes('hybrid')) return 'hybrid';
      if (v.includes('onsite') || v.includes('on-site') || v.includes('office')) return 'onsite';
      return ['onsite','hybrid','remote'].includes(v) ? v : 'unknown';
    };

    const result = {
      title: norm(parsed.title),
      company: norm(parsed.company),
      location: norm(parsed.location),
      contractType: normalizeContract(parsed.contractType),
      workMode: normalizeWorkMode(parsed.workMode),
      department: norm(parsed.department),
      salary: norm(parsed.salary),
      startDate: norm(parsed.startDate),
      experienceLevel: norm(parsed.experienceLevel || parsed.seniority),
      seniority: norm(parsed.seniority),
      primaryIndustry: norm(parsed.primaryIndustry),
      functionalDomain: norm(parsed.functionalDomain),
      languages: Array.isArray(parsed.languages) ? parsed.languages.map(norm).filter(Boolean) : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills.map(norm).filter(Boolean) : [],
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements.map(norm).filter(Boolean) : [],
      responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities.map(norm).filter(Boolean) : [],
      benefits: Array.isArray(parsed.benefits) ? parsed.benefits.map(norm).filter(Boolean) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(norm).filter(Boolean) : [],
      description: norm(parsed.description),
      summary: norm(parsed.summary),
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error parsing job description:', error);
    return NextResponse.json(
      { error: 'Failed to parse job description' },
      { status: 500 }
    );
  }
} 