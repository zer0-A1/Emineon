import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { jobQueries } from '@/lib/db/queries';
import { z } from 'zod';

export const runtime = 'nodejs';

// Schema for closing a job
const closeJobSchema = z.object({
  outcome: z.enum(['WON', 'LOST']),
  reason: z.string().optional(),
});

// POST /api/jobs/[id]/close - Close a job with an outcome
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const jobId = params.id;
    const body = await request.json();
    
    const validatedData = closeJobSchema.parse(body);

    // Check if job exists
    const job = await jobQueries.findById(jobId);
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    // Close the job with the specified outcome
    const closedJob = await jobQueries.close(jobId, validatedData.outcome, validatedData.reason);

    if (!closedJob) {
      return NextResponse.json({
        success: false,
        error: 'Failed to close job'
      }, { status: 500 });
    }

    logger.info(`Job ${jobId} closed with outcome: ${validatedData.outcome}`);

    return NextResponse.json({
      success: true,
      data: closedJob,
      message: `Job successfully closed as ${validatedData.outcome}`
    });

  } catch (error: any) {
    logger.error('Error closing job:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to close job'
    }, { status: 500 });
  }
}