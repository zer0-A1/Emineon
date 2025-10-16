import { NextRequest, NextResponse } from 'next/server';
import { 
  aiQueueService,
  type OpenAIRequest 
} from '@/lib/services/ai-queue-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, 
      candidateData, 
      jobDescription, 
      userId,
      priority = 5,
      sessionId,
      sectionType,
      currentContent,
      enhancementType = 'generate' 
    } = body;

    if (!type || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: type and userId' },
        { status: 400 }
      );
    }

    let jobId: string;

    // Handle different enrichment types
    switch (type) {
      case 'section_generation':
        if (!candidateData || !sectionType) {
          return NextResponse.json(
            { error: 'candidateData and sectionType required for section generation' },
            { status: 400 }
          );
        }

        const request: OpenAIRequest = {
          sectionType,
          candidateData,
          jobDescription,
          type: enhancementType,
          currentContent,
          token: userId,
          sessionId: sessionId || `session-${Date.now()}`,
        };

        jobId = await aiQueueService.addTask(request, priority);
        
        return NextResponse.json({
          success: true,
          jobId,
          message: `Section generation job ${jobId} queued successfully`,
        });

      case 'bulk_sections':
        if (!candidateData || !Array.isArray(body.sections)) {
          return NextResponse.json(
            { error: 'candidateData and sections array required for bulk generation' },
            { status: 400 }
          );
        }

        const batchRequests: OpenAIRequest[] = body.sections.map((section: string) => ({
          sectionType: section,
          candidateData,
          jobDescription,
          type: enhancementType,
          token: userId,
          sessionId: sessionId || `batch-session-${Date.now()}`,
        }));

        const jobIds = await aiQueueService.addBatchTasks(batchRequests, priority);
        
        return NextResponse.json({
          success: true,
          jobIds,
          message: `Batch generation with ${jobIds.length} jobs queued successfully`,
        });

      default:
        return NextResponse.json(
          { error: `Unknown enrichment job type: ${type}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error queuing enrichment job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to queue enrichment job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Enrichment API using p-queue' });
} 