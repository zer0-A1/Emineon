import { query } from '@/lib/db/neon-client';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    // Require authentication
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ Authentication required for AI copilot');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated for AI copilot:', userId);

    const body = await request.json();
    const { message, fileIds } = body;
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.length > 0)
      ? process.env.NEXT_PUBLIC_SITE_URL
      : request.nextUrl.origin;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get context counts using direct SQL queries
    let candidateCount = 0;
    let jobCount = 0;
    
    try {
      const candidateResult = await query('SELECT COUNT(*) as count FROM candidates WHERE archived = false');
      candidateCount = parseInt(candidateResult[0]?.count || '0');
      
      const jobResult = await query('SELECT COUNT(*) as count FROM jobs WHERE status != $1', ['ARCHIVED']);
      jobCount = parseInt(jobResult[0]?.count || '0');
    } catch (dbError) {
      console.error('Failed to get counts:', dbError);
      // Continue without counts rather than failing the whole request
    }

    const hybridSearch = async (q: string, types?: string[], limit = 5) => {
      try {
        const res = await fetch(`${baseUrl}/api/ai/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, sourceTypes: types, limit })
        });
        if (!res.ok) return [] as any[];
        const data = await res.json();
        return (data as any).data || [];
      } catch (error) {
        console.error('AI search error:', error);
        return [] as any[];
      }
    };

    const listLatestJobs = async (limit = 3) => {
      try {
        const url = new URL(`${baseUrl}/api/jobs`);
        url.searchParams.set('page', '1');
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString());
        if (!res.ok) return [] as any[];
        const data = await res.json();
        return (data as any).jobs || [];
      } catch {
        return [] as any[];
      }
    };

    const searchTerms = message.toLowerCase();
    let hybridResults: any[] = [];
    let jobs: any[] = [];
    if (searchTerms.includes('mongo') || searchTerms.includes('find') || searchTerms.includes('search') || searchTerms.includes('candidate')) {
      hybridResults = await hybridSearch(message, ['CANDIDATE','JOB','PROJECT','CLIENT'], 8);
    }
    if (searchTerms.includes('latest jobs') || searchTerms.includes('list') || searchTerms.includes('jobs')) {
      jobs = await listLatestJobs(3);
    }

    const systemPrompt = `You are an AI assistant for Emineon. You have access to real data and can search the database.

Current database context:
- Total candidates: ${candidateCount}
- Total jobs: ${jobCount}
- Search results returned: ${hybridResults.length}

${hybridResults.length > 0 ? `\nTop matches:\n${hybridResults.map((r: any) => `- [${r.sourceType}] ${r.title || r.sourceId} (score ${(r.score || 0).toFixed(2)})`).slice(0,5).join('\n')}` : ''}

${jobs.length > 0 ? `\nLatest Jobs:\n${jobs.map((j: any) => `- ${j.title} in ${j.location || 'Remote'} - ${j.status}`).join('\n')}` : ''}

You can help with:
- Searching and analyzing real candidate data
- Finding specific candidates or jobs
- Analyzing uploaded documents (CVs, job descriptions, company documents)
- Matching candidates to job requirements based on uploaded documents
- General recruitment advice and best practices
- Interview questions and strategies
- Job description writing
- Candidate evaluation criteria
- Market insights and trends
- Communication templates
- Recruitment process optimization

Provide detailed, actionable insights based on real data when available. If you found specific candidates or jobs, include them in your response with details. When working with uploaded documents, reference specific content and provide detailed analysis.`;

    // Canned roadmap answers (for investor demo)
    const q = String(message).toLowerCase();
    const canned = [
      {
        test: (t: string) => /roadmap\s+overview|year\s*1|year\s*2|year\s*3|milestones/.test(t),
        answer: 'Roadmap overview — Year 1: foundation and data quality; ship end‑to‑end consulting workflows and reliable deployment. Year 2: scale and automation; key integrations and matching v2; improve onboarding and low‑touch expansion. Year 3: ecosystem and analytics; partner add‑ons and delivery benchmarks.'
      },
      {
        test: (t: string) => /what\s+is\s+emineon|why\s+emineon|summary/.test(t),
        answer: 'Emineon OS is a consulting operating system that unifies candidate intelligence, delivery operations, matching, client collaboration and reporting. Swiss‑engineered, privacy‑first, intentionally simple. ROI: one additional placement or project engagement covers the subscription.'
      },
      {
        test: (t: string) => /target\s+market|sam|tam|som|expansion|launch\s+region/.test(t),
        answer: 'Target market: Central & Western Europe with Switzerland as launchpad; priority expansion to DACH + France + Benelux (≈ 40k firms SAM). TAM ≈ CHF 143M/yr; SAM ≈ CHF 71M/yr; SOM ≈ CHF 3.6M by Year 7.'
      },
      {
        test: (t: string) => /segments|icp|customers/.test(t),
        answer: 'Segments: consulting companies (management/IT/engineering), staffing & recruitment agencies (SMB/mid), executive search firms.'
      },
      {
        test: (t: string) => /pricing|packages|plans|cost/.test(t),
        answer: 'Pricing (monthly): Starter CHF 99 (1 + 15), Growth CHF 198 (2 + 30), Professional CHF 297 (3 + 45), Enterprise CHF 495 (5 + 75+).' 
      },
      {
        test: (t: string) => /market\s+size|penetration|numbers/.test(t),
        answer: '40k target firms; average annual value ≈ CHF 3.6k per client; base penetration 2.5% by Year 7 → ~1k clients (conservative 1% → ~400; aggressive 5% → ~2k).'
      },
      {
        test: (t: string) => /team\s+roadmap|hiring|fte|headcount/.test(t),
        answer: 'Team plan: 2025–26 grow 3 → 5 FTE (Founder + Engineers + CSMs). Years 2–7 trajectory: 8 → 12 → 18 → 30 → 50 FTE as ARR scales; early CSMs commission‑only.'
      },
      {
        test: (t: string) => /business\s+development|go\s*to\s*market|g2m|sales\s+strategy|leads/.test(t),
        answer: 'BD: founder‑led + referrals; advisor/partner intros; demo briefs and fast trials. Targets: Y1 200–300 convos → 20–35 logos; Y2 400–600 → 60–100; Y3 800–1200 → 120–200. Lead→Trial 25–30%, Trial→Paid 35–45%.'
      },
      {
        test: (t: string) => /financial\s+plan|revenue|costs|arr|runway/.test(t),
        answer: 'Costs ≈ 260–320k (Y1), 320–420k (Y2), 420–520k (Y3). Revenue ≈ 60–120k (Y1), 250–500k (Y2), 600k–1.2M (Y3). Maintain 12+ months runway; treat AI spend as COGS; infra variable.'
      },
      {
        test: (t: string) => /differentiation|moat|advantage|why\s+now|positioning/.test(t),
        answer: 'Differentiation: opinionated OS for consulting workflows (speed + readability), Swiss trust & compliance, pragmatic AI, clear time‑to‑value. Moats: data‑sovereignty, operational simplicity, outcomes focus.'
      }
    ];
    const cannedHit = canned.find(c => c.test(q));
    if (cannedHit) {
      return NextResponse.json({ message: cannedHit.answer, role: 'assistant' });
    }

    // Prepare messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // If there are file IDs, include them in the user message
    if (fileIds && fileIds.length > 0) {
      const safeFileIds = (fileIds as string[]).filter(f => typeof f === 'string' && f.length > 0);
      const userContent: any[] = [];

      // Add file inputs
      safeFileIds.forEach((fileId: string) => {
        userContent.push({ type: 'input_file', file_id: fileId });
      });

      // Add text input
      userContent.push({ type: 'input_text', text: message });

      messages.push({ role: 'user', content: userContent });
    } else {
      // Regular text message
      messages.push({
        role: 'user',
        content: message
      });
    }

    // Quick intent router for candidates/jobs
    const intent = message.toLowerCase();
    
    // For now, skip the copilot tools endpoint as it needs updating
    // We'll rely on the direct AI response below

    // Use the responses API if we have files, otherwise use chat completions
    if (fileIds && fileIds.length > 0) {
      const response = await openai.responses.create({
        model: 'gpt-4o',
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
          messages.find((m) => m.role === 'user') as any,
        ],
      });

      return NextResponse.json({
        message: response.output_text,
        role: 'assistant'
      });
    } else {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

      return NextResponse.json({
        message: assistantMessage,
        role: 'assistant'
      });
    }

  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 400) {
      return NextResponse.json(
        { error: error?.message || error?.error?.message || 'Invalid request or file format' },
        { status: 400 }
      );
    } else if (error.status === 404) {
      return NextResponse.json(
        { error: 'File not found. Please re-upload the file.' },
        { status: 404 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to process your request' },
        { status: 500 }
      );
    }
  }
} 