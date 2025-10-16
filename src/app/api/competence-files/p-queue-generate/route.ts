import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { 
  generateCompetenceFile, 
  CandidateData, 
  JobDescription 
} from '@/lib/services/competence-file-queue-service';

// Request validation schema
const CompetenceFileRequestSchema = z.object({
  candidateData: z.object({
    id: z.string().optional(),
    fullName: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    currentTitle: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    currentLocation: z.string().optional(),
    yearsOfExperience: z.number().optional(),
    skills: z.array(z.string()),
    certifications: z.array(z.string()).optional(),
    experience: z.array(z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      responsibilities: z.string(),
    })).optional(),
    education: z.array(z.string()).optional(),
    degrees: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    spokenLanguages: z.array(z.string()).optional(),
    summary: z.string().optional(),
  }),
  jobDescription: z.object({
    title: z.string().optional(),
    jobTitle: z.string().optional(),
    company: z.string().optional(),
    client: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
    text: z.string().optional(),
  }).optional(),
  options: z.object({
    maxRetries: z.number().default(2),
    includeJobContext: z.boolean().default(true),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API key not configured. AI generation requires OPENAI_API_KEY environment variable.' 
        },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CompetenceFileRequestSchema.parse(body);
    
    const { candidateData, jobDescription, options } = validatedData;

    console.log(`🚀 P-Queue Competence File Generation Request`);
    console.log(`👤 Candidate: ${candidateData.fullName}`);
    console.log(`🎯 Job: ${jobDescription?.title || 'General Position'}`);
    console.log(`⚙️ Options:`, options);

    // Validate candidate data
    if (!candidateData.fullName || !candidateData.currentTitle) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required candidate information: fullName and currentTitle are required' 
        },
        { status: 400 }
      );
    }

    if (!candidateData.skills || candidateData.skills.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Candidate must have at least one skill listed' 
        },
        { status: 400 }
      );
    }

    // Start competence file generation using p-queue
    const startTime = Date.now();
    
    console.log('🔄 Starting sequential competence file generation with p-queue...');

    const result = await generateCompetenceFile(
      candidateData as CandidateData,
      jobDescription as JobDescription,
      options?.maxRetries || 2
    );

    const totalTime = Date.now() - startTime;

    if (result.success) {
      console.log('✅ P-Queue competence file generation completed successfully');
      console.log(`📊 Stats: ${result.sections.length} sections, ${result.totalTokens} tokens, ${totalTime}ms`);

      // Group sections by title for easy access
      const sectionsGrouped = result.sections.reduce((acc, section) => {
        acc[section.title] = {
          order: section.order,
          content: section.content,
          processingTime: section.processingTime,
          tokensUsed: section.tokensUsed,
        };
        return acc;
      }, {} as Record<string, any>);

      return NextResponse.json({
        success: true,
        message: 'Competence file generated successfully using p-queue',
        data: {
          sessionId: result.sessionId,
          sections: result.sections,
          sectionsGrouped,
          candidateName: candidateData.fullName,
          jobTitle: jobDescription?.title || 'General Position',
          totalSections: result.sections.length,
          successfulSections: result.sections.filter(s => s.success).length,
          failedSections: result.sections.filter(s => !s.success).length,
        },
        performance: {
          totalTime: result.totalTime,
          totalTokens: result.totalTokens,
          averageTimePerSection: Math.round(result.totalTime / result.sections.length),
          averageTokensPerSection: Math.round(result.totalTokens / result.sections.length),
        },
        processingMethod: 'p-queue-sequential',
        queueConcurrency: 3,
        timestamp: new Date().toISOString(),
      });

    } else {
      console.error('❌ P-Queue competence file generation failed');
      console.error('🔍 Errors:', result.errors);

      const successfulSections = result.sections.filter(s => s.success);
      const failedSections = result.sections.filter(s => !s.success);

      return NextResponse.json(
        {
          success: false,
          error: 'Competence file generation partially failed',
          data: {
            sessionId: result.sessionId,
            sections: result.sections,
            candidateName: candidateData.fullName,
            jobTitle: jobDescription?.title || 'General Position',
            totalSections: result.sections.length,
            successfulSections: successfulSections.length,
            failedSections: failedSections.length,
          },
          errors: result.errors,
          performance: {
            totalTime: result.totalTime,
            totalTokens: result.totalTokens,
            completionRate: `${successfulSections.length}/${result.sections.length}`,
          },
          processingMethod: 'p-queue-sequential',
          timestamp: new Date().toISOString(),
        },
        { status: 207 } // Multi-status: some sections succeeded, some failed
      );
    }

  } catch (error) {
    console.error('💥 P-Queue competence file generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: `Competence file generation failed: ${errorMessage}`,
        processingMethod: 'p-queue-sequential',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'P-Queue Competence File Generator',
    status: 'operational',
    description: 'Sequential competence file generation using p-queue with OpenAI Responses API',
    features: {
      sequentialGeneration: true,
      concurrency: 3,
      retryLogic: true,
      jobTracking: true,
      zustandIntegration: true,
      openaiResponsesAPI: true,
    },
    supportedSections: [
      'HEADER',
      'PROFESSIONAL SUMMARY',
      'FUNCTIONAL SKILLS',
      'TECHNICAL SKILLS',
      'AREAS OF EXPERTISE',
      'EDUCATION',
      'CERTIFICATIONS',
      'LANGUAGES',
      'PROFESSIONAL EXPERIENCES SUMMARY',
      'PROFESSIONAL EXPERIENCE 1',
      'PROFESSIONAL EXPERIENCE 2',
      'PROFESSIONAL EXPERIENCE 3',
      '... (up to 5 professional experiences)',
    ],
    authentication: 'required',
    endpoint: '/api/competence-files/p-queue-generate',
    timestamp: new Date().toISOString(),
  });
} 