// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MatchingRequest {
  jobId?: string;
  candidateId?: string;
  jobDescription?: string;
  candidateProfile?: string;
  mode: 'job-to-candidates' | 'candidate-to-jobs';
  limit?: number;
  candidateIds?: string[];
  scope?: 'jobCandidatesOnly' | 'all';
}

interface MatchingScore {
  candidateId?: string;
  jobId?: string;
  score: number;
  reasoning: string;
  keyMatches: string[];
  gaps: string[];
  recommendations: string[];
}

async function safeExtractTextFromUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());
    const lowerUrl = url.toLowerCase();

    // PDF
    if (contentType.includes('pdf') || lowerUrl.endsWith('.pdf')) {
      try {
        const pdfParseMod: any = await import('pdf-parse');
        const pdfParse = pdfParseMod?.default || pdfParseMod;
        const data = await pdfParse(buf);
        return (data.text || '').trim() || null;
      } catch {}
    }

    // DOCX
    if (contentType.includes('word') || lowerUrl.endsWith('.docx')) {
      try {
        const mammothMod: any = await import('mammoth');
        const mammoth = mammothMod?.default || mammothMod;
        const result = await mammoth.extractRawText({ buffer: buf });
        return (result.value || '').trim() || null;
      } catch {}
    }

    // TXT
    if (contentType.includes('text') || lowerUrl.endsWith('.txt')) {
      return buf.toString('utf-8');
    }
  } catch {}
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    const body: MatchingRequest = await request.json();
    const { jobId, candidateId, jobDescription, candidateProfile, mode, limit = 10, candidateIds = [], scope = 'all' } = body;

    if (mode === 'job-to-candidates') {
      return await findCandidatesForJob({ jobId, jobDescription, limit, candidateIds, scope });
    } else {
      return await findJobsForCandidate({ candidateId, candidateProfile, limit });
    }

  } catch (error: any) {
    console.error('❌ AI Matching error (root):', error);
    return NextResponse.json({ success: false, error: 'AI matching failed', details: error?.message || 'Unknown error' }, { status: 500 });
  }
}

async function findCandidatesForJob({ jobId, jobDescription, limit, candidateIds, scope }: {
  jobId?: string;
  jobDescription?: string;
  limit: number;
  candidateIds: string[];
  scope: 'jobCandidatesOnly' | 'all';
}) {
  console.log('🔍 Finding candidates for job...');

  // Get job details if jobId provided
  let job: any = null;
  if (jobId) {
    job = await db.job.findUnique({
      where: { id: jobId },
      select: {
        title: true,
        description: true,
        requirements: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        employmentType: true,
        client: { select: { name: true, industry: true } },
      }
    });
  }

  const salaryString = job?.salaryMin || job?.salaryMax ? `${job?.salaryCurrency || 'CHF'} ${job?.salaryMin ? Math.round((job.salaryMin)/1000)+'k' : ''}${job?.salaryMax ? ' - '+Math.round((job.salaryMax)/1000)+'k' : ''}` : 'Not specified';
  const jobContext = job ? 
    `Client: ${job.client?.name || 'N/A'}${job.client?.industry ? ' ('+job.client.industry+')' : ''}
Job Title: ${job.title}
Description: ${job.description}
Requirements: ${(job.requirements || []).join(', ')}
Location: ${job.location}
Salary: ${salaryString}
Type: ${(job.employmentType || []).join(', ')}` :
    jobDescription;

  // Determine candidate set
  let candidates: any[] = [];
  const uniqueIds = (candidateIds || []).filter(Boolean);
  if (uniqueIds.length > 0) {
    candidates = await db.candidate.findMany({
      where: { id: { in: uniqueIds }, archived: false },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        currentTitle: true, currentLocation: true, summary: true,
        technicalSkills: true, softSkills: true, experienceYears: true,
        expectedSalary: true, remotePreference: true, degrees: true,
        certifications: true,
        originalCvUrl: true,
      }
    });
  } else if (scope === 'jobCandidatesOnly' && jobId) {
    const apps = await db.application.findMany({
      where: { jobId },
      select: {
        candidate: {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            currentTitle: true, currentLocation: true, summary: true,
            technicalSkills: true, softSkills: true, experienceYears: true,
            expectedSalary: true, remotePreference: true, degrees: true,
            certifications: true,
            originalCvUrl: true,
          }
        }
      }
    });
    candidates = apps.map(a => a.candidate).filter(Boolean);
  } else {
    candidates = await db.candidate.findMany({
      where: { archived: false },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        currentTitle: true, currentLocation: true, summary: true,
        technicalSkills: true, softSkills: true, experienceYears: true,
        expectedSalary: true, remotePreference: true, degrees: true,
        certifications: true,
        originalCvUrl: true,
      },
      take: 50,
    });
  }

  console.log(`📊 Analyzing ${candidates.length} candidates...`);

  const matchingResults: MatchingScore[] = [];

  for (const candidate of candidates) {
    // Optional: Extract CV text (best-effort)
    let cvText: string | null = null;
    try {
      cvText = await safeExtractTextFromUrl(candidate.originalCvUrl);
      if (cvText && cvText.length > 4000) {
        cvText = cvText.slice(0, 4000) + '...';
      }
    } catch {}

    const candidateProfile = `
Name: ${candidate.firstName} ${candidate.lastName}
Current Role: ${candidate.currentTitle || 'Not specified'}
Location: ${candidate.currentLocation || 'Not specified'}
Experience: ${candidate.experienceYears || 0} years
Summary: ${candidate.summary || 'No summary available'}
Technical Skills: ${candidate.technicalSkills?.join(', ') || 'None listed'}
Soft Skills: ${candidate.softSkills?.join(', ') || 'None listed'}
Education: ${candidate.degrees?.join(', ') || 'Not specified'}
Certifications: ${candidate.certifications?.join(', ') || 'None'}
Expected Salary: ${candidate.expectedSalary || 'Not specified'}
Remote Preference: ${candidate.remotePreference || 'Not specified'}
Primary CV URL: ${candidate.originalCvUrl || 'N/A'}
${cvText ? `CV Extract (truncated): ${cvText}` : ''}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `You are an expert recruiter and talent matcher.
Analyze the match ONLY using the provided JOB and CANDIDATE data.
Be precise, concise, and transparent. If information is missing, mark it clearly as a gap.
Do NOT invent or infer unstated experience, titles, companies, or credentials.

SCORING CRITERIA:
- Technical Skills Match (0-30 points)
- Experience Relevance (0-25 points)  
- Education & Certifications (0-15 points)
- Location & Remote Compatibility (0-10 points)
- Salary Alignment (0-10 points)
- Soft Skills & Culture Fit (0-10 points)

TOTAL SCORE: 0-100 (where 80+ = Excellent, 60-79 = Good, 40-59 = Moderate, <40 = Poor)

Provide SPECIFIC reasoning citing exact skills/titles/years from the input. Be HONEST about gaps.`
          },
          {
            role: 'user',
            content: `
JOB REQUIREMENTS:
${jobContext}

CANDIDATE PROFILE:
${candidateProfile}

Analyze this match and respond with ONLY a JSON object in this exact format:
{
  "score": 85,
  "reasoning": "Strong technical match with React and Node.js experience. 5 years experience aligns well with senior role requirements.",
  "keyMatches": ["React expertise", "Node.js experience", "5+ years experience", "Remote work preference"],
  "gaps": ["No AWS certification", "Limited mobile development experience"],
  "recommendations": ["Consider AWS training", "Evaluate mobile development needs"]
}`
          }
        ],
        max_tokens: 500,
      });

      const result = completion.choices[0]?.message?.content;
      if (result) {
        try {
          const parsed = JSON.parse(result);
          matchingResults.push({
            candidateId: candidate.id,
            score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
            reasoning: parsed.reasoning || 'No reasoning provided',
            keyMatches: parsed.keyMatches || [],
            gaps: parsed.gaps || [],
            recommendations: parsed.recommendations || []
          });
        } catch (parseError) {
          console.error('Failed to parse AI response for candidate:', candidate.id, parseError);
        }
      } else {
        console.error('Empty completion for candidate:', candidate.id);
      }
    } catch (aiError: any) {
      console.error('AI matching failed for candidate:', candidate.id, aiError?.message || aiError);
    }
  }

  const topMatches = matchingResults
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({ success: true, data: { matches: topMatches, totalAnalyzed: candidates.length, jobContext: jobContext?.substring(0, 100) + '...' } });
}

async function findJobsForCandidate({ candidateId, candidateProfile, limit }: {
  candidateId?: string;
  candidateProfile?: string;
  limit: number;
}) {
  console.log('🔍 Finding jobs for candidate...');

  let candidate = null;
  if (candidateId) {
    candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      select: {
        firstName: true,
        lastName: true,
        currentTitle: true,
        summary: true,
        technicalSkills: true,
        experienceYears: true,
        expectedSalary: true,
        currentLocation: true,
        remotePreference: true,
      }
    });
  }

  const candidateContext = candidate ? 
    `Name: ${candidate.firstName} ${candidate.lastName}
     Current Role: ${candidate.currentTitle}
     Experience: ${candidate.experienceYears} years
     Skills: ${candidate.technicalSkills?.join(', ')}
     Location: ${candidate.currentLocation}
     Expected Salary: ${candidate.expectedSalary}
     Remote Preference: ${candidate.remotePreference}
     Summary: ${candidate.summary}` :
    candidateProfile;

  const jobs = await db.job.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      location: true,
      salaryMin: true,
      salaryMax: true,
      salaryCurrency: true,
      employmentType: true,
      client: { select: { name: true } }
    },
    take: 30,
  });

  const matchingResults: MatchingScore[] = [];

  for (const job of jobs) {
    const jobProfile = `
      Client: ${job.client?.name || 'N/A'}
      Title: ${job.title}
      Description: ${job.description}
      Requirements: ${(job.requirements || []).join(', ')}
      Location: ${job.location}
      Salary: ${(job.salaryMin || job.salaryMax) ? `${job.salaryCurrency || 'CHF'} ${job.salaryMin ? Math.round(job.salaryMin/1000)+'k' : ''}${job.salaryMax ? ' - '+Math.round(job.salaryMax/1000)+'k' : ''}` : 'Not specified'}
      Type: ${(job.employmentType || []).join(', ')}
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `You are an expert recruiter analyzing job-candidate fit. Score how well this candidate matches this job position.

SCORING CRITERIA:
- Skills Alignment (0-35 points)
- Experience Level Match (0-25 points)
- Location/Remote Compatibility (0-15 points)
- Salary Expectations vs Offer (0-15 points)
- Career Growth Potential (0-10 points)

TOTAL SCORE: 0-100 (where 80+ = Perfect Match, 60-79 = Good Fit, 40-59 = Possible, <40 = Poor Fit)`
          },
          {
            role: 'user',
            content: `
CANDIDATE PROFILE:
${candidateContext}

JOB OPPORTUNITY:
${jobProfile}

Analyze this match and respond with ONLY a JSON object:
{
  "score": 85,
  "reasoning": "Excellent skills match with strong experience level alignment",
  "keyMatches": ["React expertise matches requirement", "Senior level experience"],
  "gaps": ["No cloud experience mentioned"],
  "recommendations": ["Perfect for senior role", "Consider cloud training"]
}`
          }
        ],
        max_tokens: 400,
      });

      const result = completion.choices[0]?.message?.content;
      if (result) {
        try {
          const parsed = JSON.parse(result);
          matchingResults.push({
            jobId: job.id,
            score: parsed.score || 0,
            reasoning: parsed.reasoning || 'No reasoning provided',
            keyMatches: parsed.keyMatches || [],
            gaps: parsed.gaps || [],
            recommendations: parsed.recommendations || []
          });
        } catch (parseError) {
          console.error('Failed to parse AI response for job:', job.id, parseError);
        }
      }
    } catch (aiError) {
      console.error('AI matching failed for job:', job.id, aiError);
    }
  }

  const topMatches = matchingResults.sort((a, b) => b.score - a.score).slice(0, limit);

  return NextResponse.json({ success: true, data: { matches: topMatches, totalAnalyzed: jobs.length, candidateContext: candidateContext?.substring(0, 100) + '...' } });
}
