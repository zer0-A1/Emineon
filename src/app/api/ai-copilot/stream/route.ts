// Neon-backed vector/text search utilities
import { searchCandidatesByVector } from '@/lib/embeddings/neon-embeddings';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Enhanced candidate search tool with better error handling
const candidateSearchTool = tool({
  name: 'search_candidates',
  description: 'Search for candidates in the database based on skills, experience, or other criteria',
  parameters: z.object({
    query: z.string().describe('Search query for candidates (skills, experience, role, etc.)'),
    filters: z.object({
      experienceYears: z.number().nullable().optional(),
      skills: z.array(z.string()).nullable().optional(),
      location: z.string().nullable().optional(),
      seniorityLevel: z.enum(['INTERN', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'PRINCIPAL', 'ARCHITECT', 'DIRECTOR', 'VP', 'C_LEVEL']).nullable().optional(),
    }).nullable().optional(),
    limit: z.number().default(10).describe('Maximum number of candidates to return'),
  }),
  execute: async (input) => {
    try {
      // Map filters for Neon-backed search
      const filters = {
        location: input.filters?.location || undefined,
      } as {
        location?: string;
      };

      const results = await searchCandidatesByVector(
        input.query,
        input.limit,
        filters
      );

      return {
        success: true,
        count: results.length,
        candidates: results.map((r: any) => ({
          id: r.id,
          name: `${r.first_name} ${r.last_name}`.trim(),
          email: r.email,
          skills: r.technical_skills,
          summary: r.professional_headline || r.summary,
          location: r.current_location,
          experience: r.experience_years,
          seniority: r.seniority_level,
          status: r.status,
          _score: r._score,
        })),
        query: input.query,
        filters: input.filters
      };
    } catch (error) {
      console.error('Error searching candidates:', error);
      return {
        success: false,
        error: 'Failed to search candidates',
        candidates: []
      };
    }
  },
});

// Job analysis tool with enhanced AI processing
const jobAnalysisTool = tool({
  name: 'analyze_job_description',
  description: 'Analyze a job description to extract requirements, skills, and generate insights',
  parameters: z.object({
    jobDescription: z.string().describe('The job description text to analyze'),
    includeMatching: z.boolean().default(false).describe('Whether to include candidate matching recommendations'),
  }),
  execute: async (input) => {
    try {
      const prompt = `Analyze this job description and extract key information in JSON format:

Job Description:
${input.jobDescription}

Return a JSON object with:
{
  "jobTitle": "extracted job title",
  "requiredSkills": ["skill1", "skill2", ...],
  "optionalSkills": ["skill1", "skill2", ...],
  "experienceLevel": "entry/junior/mid/senior/lead",
  "location": "location or remote",
  "responsibilities": ["responsibility1", "responsibility2", ...],
  "qualifications": ["qualification1", "qualification2", ...],
  "salaryRange": "if mentioned",
  "companySize": "if mentioned",
  "industry": "if mentioned",
  "workType": "remote/hybrid/onsite",
  "keyInsights": ["insight1", "insight2", ...],
  "matchingCriteria": {
    "mustHave": ["skill1", "skill2"],
    "niceToHave": ["skill1", "skill2"],
    "experienceYears": number,
    "locationPreference": "string"
  }
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const analysis = response.choices[0]?.message?.content;
      let structuredAnalysis;
      
      try {
        structuredAnalysis = JSON.parse(analysis || '{}');
      } catch {
        structuredAnalysis = {
          jobTitle: 'Could not parse',
          requiredSkills: [],
          experienceLevel: 'unknown',
          keyInsights: [analysis || 'Analysis failed']
        };
      }

      return {
        success: true,
        analysis: structuredAnalysis,
        originalDescription: input.jobDescription.substring(0, 500) + '...',
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing job description:', error);
      return {
        success: false,
        error: 'Failed to analyze job description'
      };
    }
  },
});

// Simplified streaming copilot agent without MCP tools
const streamingCopilotAgent = new Agent({
  name: 'Emineon Streaming Copilot',
  instructions: `You are an advanced AI copilot for Emineon, a sophisticated recruitment platform. You provide real-time assistance with:

1. **Candidate Search & Analysis**
   - Find candidates based on skills, experience, location
   - Analyze candidate profiles and fit
   - Provide interview recommendations

2. **Job Description Analysis**
   - Extract requirements and skills from job descriptions
   - Generate matching criteria
   - Assess role complexity and market positioning

3. **Recruitment Strategy**
   - Provide best practices and guidance
   - Suggest sourcing strategies
   - Recommend interview processes

4. **General AI Assistant**
   - Answer questions about recruitment best practices
   - Provide market insights and trends
   - Help with communication and strategy

Response policy:
- Always produce thorough, evidence‑based and practical guidance.
- Structure answers with short headings and bullet points where helpful (no emojis or decorative characters).
- Prefer concrete details, metrics, and next steps over generic statements.
- Keep a professional tone consistent with Emineon’s brand.
- When using tools, explain what you did and why.
`,
  tools: [
    candidateSearchTool,
    jobAnalysisTool,
  ],
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ Authentication required for AI copilot streaming');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated for AI copilot streaming:', userId);

    // Parse the request body
    const body = await request.json() as { 
      messages?: any[]; 
      query?: string; 
      maxTurns?: number;
      stream?: boolean;
    };
    
    const { messages, query, maxTurns = 10, stream = true } = body;
    const input = query || messages || '';

    if (!input) {
      return NextResponse.json(
        { success: false, error: 'Query or messages are required' },
        { status: 400 }
      );
    }

    // --- BEGIN: Pre-programmed roadmap FAQ ---
    const extractText = (msg: any): string => {
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg) && msg.length > 0) {
        const last = msg[msg.length - 1];
        if (typeof last === 'string') return last;
        if (last?.content) return String(last.content);
      }
      return '';
    };

    const q = extractText(input).toLowerCase();

    const canned: Array<{ match: (t: string) => boolean; answer: string }> = [
      {
        match: (t) => /what\s+is\s+emineon|why\s+emineon|what\s+do\s+you\s+do|summary/.test(t),
        answer:
          '**Overview**\nEmineon OS is a consulting operating system that unifies candidate intelligence, delivery operations, matching, client collaboration, and reporting. It is Swiss‑engineered, privacy‑first, and intentionally simple.\n\n**Problem We Solve**\nFragmented tool stacks (spreadsheets, legacy ATS/CRM/ERP, ad‑hoc files) create blind spots and slow delivery.\n\n**Scope**\n- Candidate OS with complete, editable profiles (80+ fields grouped by category)\n- Parsing (CV + LinkedIn), documents (upload, preview, competence files)\n- Matching and search (structured now, hybrid/vector next)\n- Communications timeline and quick actions; notes; assignments to jobs\n\n**Outcomes**\n- Faster, more reliable delivery operations in one system\n- Clear time‑to‑value: one additional placement or project engagement typically covers the subscription'
      },
      {
        match: (t) => /vision|mission|purpose/.test(t),
        answer:
          '**Purpose**\nBuild a focused consulting OS with fast time‑to‑value, simple operations, and pragmatic AI.\n\n**Principles**\n- Ship outcomes, not features\n- Keep the UI readable and fast\n- Prefer pragmatic AI with human control\n- Optimize for operational reliability and data quality\n\n**Positioning**\nSwiss credibility and data‑sovereignty posture, opinionated workflows, and a clear ROI narrative.'
      },
      {
        match: (t) => /target\s+market|launch\s+region|expansion|sam|tam|som/.test(t),
        answer:
          '**Target Market**\n- Launch: Central and Western Europe with Switzerland\n- Priority expansion: DACH + France + Benelux\n\n**Market Size (indicative)**\n- SAM ≈ 40,000 firms\n- TAM ≈ CHF 143M/year, SAM ≈ CHF 71M/year, SOM ≈ CHF 3.6M by Year 7\n\n**Strategic Advantage**\nSwiss engineering credibility, regulatory and data‑sovereignty advantages, and an opinionated OS that reduces operational complexity.'
      },
      {
        match: (t) => /customer\s+segments|who\s+are\s+your\s+customers|icp/.test(t),
        answer:
          '**Customer Segments / ICP**\n- Consulting companies (management/IT/engineering) with fragmented stacks\n- Staffing and recruitment agencies (SMB/mid) overwhelmed by admin and tool sprawl\n- Executive search firms seeking better digital client experience and faster matching'
      },
      {
        match: (t) => /pricing|packages|plans|cost/.test(t),
        answer:
          '**Pricing (monthly, excl. tax)**\n- Starter: CHF 99 (1 manager + 15 resources)\n- Growth: CHF 198 (2 + 30)\n- Professional: CHF 297 (3 + 45)\n- Enterprise: CHF 495 (5 + 75+)\n\nAligned to team size and operational complexity; kept simple for low‑friction adoption.'
      },
      {
        match: (t) => /market\s+size|numbers|overview|penetration/.test(t),
        answer:
          '**Market Size and Penetration**\n- Target firms: ≈ 40,000\n- Average annual value per client: ≈ CHF 3.6k\n\n**Scenarios by Year 7**\n- Conservative: 1% → ~400 clients\n- Base case: 2.5% → ~1,000 clients\n- Aggressive: 5% → ~2,000 clients'
      },
      {
        match: (t) => /roadmap\s+overview|year\s*1|year\s*2|year\s*3|milestones/.test(t),
        answer:
          '**Roadmap Overview**\n\n**Year 1 — Foundation and Data Quality**\n- Candidate OS v1 (all fields visible/editable), Emineon UI\n- Parsing pipeline (CV + LinkedIn), documents upload/preview/competence files\n- Delivery ops: notes, timeline, communications; assignments to jobs\n- Platform: performance, error handling, observability; staging→prod deployment\n\n**Year 2 — Scale, Automation, Integrations**\n- Matching v2: hybrid + vector search; explainable ranking\n- Integrations: email, calendar, storage; selective CRM/HRIS touchpoints\n- Automation: outreach/follow‑up templates; bulk ops with guardrails\n- Onboarding: guided setup, presets, saved searches, permissioned sharing\n\n**Year 3 — Ecosystem and Analytics**\n- Ecosystem: plugin interface and curated marketplace\n- Analytics: delivery metrics (throughput, cycle time), analytics packages, benchmarks\n- Enterprise: multi‑office/brand rollouts'
      },
      {
        match: (t) => /year\s*1\b|foundation|data\s+quality/.test(t),
        answer:
          '**Year 1 — Detailed Scope**\n- Profiles: 80+ user‑facing fields grouped by category; inline edit everywhere (modal + drawer)\n- Parsing: CV/LinkedIn endpoints; client‑side orchestration; manual entry and upload flows\n- Documents: original CV and competence file preview; reliable upload and storage\n- Ops: communications with quick actions; notes and timeline for auditability\n- UX: single OS for intake, profiles, matching, delivery, and reporting\n- SRE: performance hooks, logging, observability, and a clean path to production'
      },
      {
        match: (t) => /year\s*2\b|scale|automation|integrations/.test(t),
        answer:
          '**Year 2 — Detailed Scope**\n- Matching v2: hybrid/vector backends; scoring that combines semantic and structured signals\n- Integrations: outbound email and calendar hooks; storage providers; selective CRM/HRIS syncs\n- Automation: templated outreach and follow‑ups; bulk edit flows with safety checks\n- Growth UX: guided onboarding with presets; saved searches and permissioned sharing'
      },
      {
        match: (t) => /year\s*3\b|ecosystem|analytics|benchmark/.test(t),
        answer:
          '**Year 3 — Detailed Scope**\n- Ecosystem: public interface for partners; curated marketplace for compliant add‑ons\n- Analytics: delivery dashboards, SLA tracking, throughput and cycle times; opt‑in cross‑client benchmarks\n- Enterprise: multi‑office and multi‑brand deployments; org‑level governance'
      },
      {
        match: (t) => /team\s+roadmap|hiring|fte|headcount/.test(t),
        answer:
          '**Team Roadmap**\n- 2025–26: 3 → 5 FTE (Founder + Engineers + CSMs)\n- Years 2–7: 8 → 12 → 18 → 30 → 50 FTE as ARR scales (engineering, CSM, sales, product, marketing, finance/HR)\n- Early CSMs are commission‑only to control fixed costs'
      },
      {
        match: (t) => /business\s+development|go\s*to\s*market|g2m|sales\s+strategy|leads/.test(t),
        answer:
          '**Business Development Strategy**\n- Motions: founder‑led + referrals; advisor/partner introductions in DACH/Benelux; demo briefs and fast trials\n- Targets (illustrative):\n  - Year 1: 200–300 conversations → 50–80 trials → 20–35 logos\n  - Year 2: 400–600 conversations → 120–180 trials → 60–100 logos\n  - Year 3: 800–1200 conversations → 240–360 trials → 120–200 logos\n- Conversions: Lead→Trial 25–30%, Trial→Paid 35–45%\n- Adoption: 2‑hour guided setup; first‑day value (competence file, candidate review, client share link); 30‑day checklist and office hours'
      },
      {
        match: (t) => /financial\s+plan|revenue|costs|arr|runway|spend/.test(t),
        answer:
          '**Financial Plan (orders of magnitude)**\n- Costs: ≈ 260–320k (Year 1), 320–420k (Year 2), 420–520k (Year 3)\n- Revenue: ≈ 60–120k (Year 1), 250–500k (Year 2), 600k–1.2M (Year 3)\n- Posture: maintain 12+ months runway; treat AI spend as COGS; keep infrastructure variable; monthly financials and quarterly roadmap reviews'
      },
      {
        match: (t) => /differentiation|moat|why\s+now|advantage|positioning/.test(t),
        answer:
          '**Differentiation and Moat**\n- Opinionated OS for consulting workflows (speed and readability)\n- Swiss trust and compliance posture\n- Pragmatic AI with clear time‑to‑value\n- Moats: data‑sovereignty, operational simplicity, and outcomes focus'
      },
      {
        match: (t) => /onboarding|first\s+value|trial|adoption/.test(t),
        answer:
          '**Onboarding and First Value**\n- Guided 2‑hour setup: import data, configure profiles, connect email/storage\n- First‑day value: competence file generation, candidate review, client share link\n- 30‑day checklist and office hours; saved searches and permissioned sharing'
      },
      {
        match: (t) => /retention|expansion|csms|upsell|cross\s*sell/.test(t),
        answer:
          '**Retention and Expansion**\n- Commission‑only CSMs early; quarterly usage reviews\n- Propose modules (matching, analytics) and additional seats\n- Playbooks for multi‑office and multi‑brand rollouts'
      },
      {
        match: (t) => /metrics|kpis|dashboard/.test(t),
        answer:
          '**Metrics and Cadence**\n- Core KPIs: MRR, churn, logo churn, CAC payback, time to first value, active users\n- Reviews: monthly pipeline + financials; quarterly strategy and roadmap (re‑baselining by evidence)'
      },
      {
        match: (t) => /governance|process|rfc|review/.test(t),
        answer:
          '**Governance**\n- Quarterly reviews with re‑baselining by evidence\n- Small RFCs for material changes; bias to shipping'
      }
    ];

    const hit = canned.find(c => c.match(q));
    if (hit) {
      if (!stream) {
        return NextResponse.json({ success: true, output: hit.answer });
      }
      const streamResponse = new ReadableStream({
        start(controller) {
          const payload = JSON.stringify({ type: 'final_result', data: { success: true, output: hit.answer } });
          controller.enqueue(`data: ${payload}\n\n`);
          controller.enqueue(`data: [DONE]\n\n`);
          controller.close();
        }
      });
      return new NextResponse(streamResponse as any, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }
    // --- END: Pre-programmed roadmap FAQ ---

    console.log(`Streaming AI Copilot Query from ${userId}:`, typeof input === 'string' ? input : 'Messages array');

    if (stream) {
      // Create streaming response
      const result = await run(streamingCopilotAgent, input, {
        maxTurns,
        stream: true,
      });

      // Create a ReadableStream that emits SSE data
      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of result) {
              // Send different types of events to the client
              const eventData = JSON.stringify({
                type: event.type,
                data: event,
                timestamp: new Date().toISOString(),
              });
              
              controller.enqueue(`data: ${eventData}\n\n`);
              
              // Log significant events
              if (event.type === 'run_item_stream_event') {
                console.log(`Stream event: ${event.type}`);
              }
            }
            
            // Send final result
            const finalData = JSON.stringify({
              type: 'final_result',
              data: {
                success: true,
                output: result.finalOutput,
                metadata: {
                  turns: result.newItems?.length || 0,
                  timestamp: new Date().toISOString(),
                }
              }
            });
            controller.enqueue(`data: ${finalData}\n\n`);
            controller.enqueue(`data: [DONE]\n\n`);
            controller.close();
          } catch (err) {
            console.error('Error in stream response:', err);
            controller.error(err);
          }
        }
      });

      return new NextResponse(streamResponse as any, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-stream fallback
    const result = await run(streamingCopilotAgent, input, { maxTurns, stream: false });
    return NextResponse.json({ success: true, output: result.finalOutput });
  } catch (error) {
    console.error('Streaming copilot API error:', error);
    return NextResponse.json({ success: false, error: 'Copilot error' }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Handle GET requests with a simple health check
export async function GET() {
  return NextResponse.json({
    status: 'Streaming AI Copilot API is operational',
    features: [
      'Real-time streaming responses',
      'Advanced candidate search',
      'Job description analysis',
      'Local tool integration',
      'Multi-turn conversations',
      'Tool calling with feedback'
    ],
    timestamp: new Date().toISOString()
  });
} 