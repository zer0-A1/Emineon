import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enrichmentPipeline, EnrichmentOptions } from '@/lib/ai/enrichment-pipeline';
import { documentGenerator, GenerationOptions } from '@/lib/generation/document-generator';
import { CandidateData } from '@/types';

// Request schema validation
const GenerateRequestSchema = z.object({
  candidateData: z.object({
    id: z.string(),
    fullName: z.string(),
    currentTitle: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    photo: z.string().optional(),
    yearsOfExperience: z.number().optional(),
    summary: z.string().optional(),
    skills: z.array(z.string()),
    certifications: z.array(z.string()),
    experience: z.array(z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      responsibilities: z.string()
    })),
    education: z.array(z.string()),
    languages: z.array(z.string())
  }),
  options: z.object({
    format: z.enum(['pdf', 'docx']),
    enableAIEnrichment: z.boolean().default(true),
    enrichmentOptions: z.object({
      jobDescription: z.string().optional(),
      clientName: z.string().optional(),
      industryFocus: z.string().optional(),
      tone: z.enum(['professional', 'consulting', 'technical', 'creative']).optional(),
      targetAudience: z.enum(['hr', 'technical', 'executive', 'client']).optional(),
      enableTranslation: z.boolean().optional(),
      targetLanguage: z.enum(['french', 'german', 'spanish']).optional()
    }).optional(),
    styling: z.object({
      fontSize: z.string().optional(),
      fontFamily: z.string().optional(),
      colorScheme: z.string().optional(),
      margins: z.string().optional(),
      logoUrl: z.string().optional(),
      footerText: z.string().optional()
    }).optional(),
    sections: z.array(z.object({
      key: z.string(),
      label: z.string(),
      show: z.boolean(),
      order: z.number()
    })).optional(),
    metadata: z.object({
      clientName: z.string().optional(),
      jobTitle: z.string().optional(),
      generatedBy: z.string().optional()
    }).optional()
  })
});

type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { candidateData, options } = GenerateRequestSchema.parse(body);

    // Track processing stages for response
    const processingStages = [];
    let enhancedCandidateData = candidateData;

    // Stage 1: AI Enrichment (if enabled)
    if (options.enableAIEnrichment && options.enrichmentOptions) {
      try {
        console.log('🤖 Starting AI enrichment pipeline...');
        
        const enrichmentResult = await enrichmentPipeline.processCandidate(
          candidateData,
          options.enrichmentOptions
        );

        processingStages.push({
          stage: 'ai-enrichment',
          success: enrichmentResult.success,
          details: {
            stages: enrichmentResult.stages.length,
            totalTokens: enrichmentResult.totalTokens,
            totalTime: enrichmentResult.totalTime,
            errors: enrichmentResult.errors
          }
        });

        if (enrichmentResult.success) {
          enhancedCandidateData = enrichmentResult.finalData;
          console.log('✅ AI enrichment completed successfully');
        } else {
          console.warn('⚠️ AI enrichment failed, using original data:', enrichmentResult.errors);
        }

      } catch (enrichmentError) {
        console.error('❌ AI enrichment error:', enrichmentError);
        processingStages.push({
          stage: 'ai-enrichment',
          success: false,
          details: { error: enrichmentError instanceof Error ? enrichmentError.message : String(enrichmentError) }
        });
      }
    }

    // Stage 2: Document Generation with Fallback Engine
    console.log('📄 Starting document generation...');
    
    const generationOptions: GenerationOptions = {
      format: options.format,
      styling: options.styling,
      sections: options.sections,
      metadata: options.metadata
    };

    const generationResult = await documentGenerator.generateDocument(
      enhancedCandidateData,
      generationOptions,
      (progress) => {
        // Progress updates could be sent via WebSocket in real implementation
        console.log(`📊 Generation progress: ${progress.progress}% - ${progress.message}`);
      }
    );

    processingStages.push({
      stage: 'document-generation',
      success: generationResult.success,
      details: {
        method: generationResult.generationMethod,
        processingTime: generationResult.processingTime,
        fileSize: generationResult.fileSize,
        error: generationResult.error
      }
    });

    // Stage 3: Response Formation
    if (generationResult.success) {
      console.log('✅ Document generation completed successfully');
      
      return NextResponse.json({
        success: true,
        data: {
          fileUrl: generationResult.fileUrl,
          fileName: generationResult.fileName,
          fileSize: generationResult.fileSize,
          generationMethod: generationResult.generationMethod,
          processingTime: generationResult.processingTime
        },
        processingStages,
        metadata: {
          aiEnhanced: options.enableAIEnrichment,
          originalCandidate: candidateData.fullName,
          enhancedFields: options.enableAIEnrichment ? getEnhancedFields(candidateData, enhancedCandidateData) : [],
          timestamp: new Date().toISOString()
        }
      });

    } else {
      console.error('❌ Document generation failed:', generationResult.error);
      
      return NextResponse.json({
        success: false,
        error: generationResult.error || 'Document generation failed',
        processingStages,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 API route error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        metadata: { timestamp: new Date().toISOString() }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      metadata: { timestamp: new Date().toISOString() }
    }, { status: 500 });
  }
}

/**
 * Compare original and enhanced candidate data to identify changed fields
 */
function getEnhancedFields(original: CandidateData, enhanced: CandidateData): string[] {
  const changes: string[] = [];

  // Check each field for changes
  if (original.summary !== enhanced.summary) {
    changes.push('summary');
  }

  if (JSON.stringify(original.skills) !== JSON.stringify(enhanced.skills)) {
    changes.push('skills');
  }

  if (JSON.stringify(original.experience) !== JSON.stringify(enhanced.experience)) {
    changes.push('experience');
  }

  if (JSON.stringify(original.education) !== JSON.stringify(enhanced.education)) {
    changes.push('education');
  }

  if (JSON.stringify(original.certifications) !== JSON.stringify(enhanced.certifications)) {
    changes.push('certifications');
  }

  return changes;
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: '2.0.0',
    features: {
      aiEnrichment: true,
      fallbackGeneration: true,
      cloudinaryIntegration: true,
      multiFormatSupport: ['pdf', 'docx'],
      promptModules: Object.keys(enrichmentPipeline).length
    },
    timestamp: new Date().toISOString()
  });
} 