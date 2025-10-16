import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { jobQueries, candidateQueries, applicationQueries } from '@/lib/db/queries';
import { z } from 'zod';

// GET /api/jobs/[id]/candidates - Get all candidates for a job
export async function GET(
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
    
    // Check if job exists
    const job = await jobQueries.findById(jobId);
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    // Get all candidates for this job
    const candidates = await jobQueries.getCandidates(jobId);

    return NextResponse.json({
      success: true,
      data: candidates
    });

  } catch (error) {
    logger.error('Error fetching job candidates:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch job candidates'
    }, { status: 500 });
  }
}

// Schema for adding a candidate to a job
const addCandidateSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  stage: z.string().default('sourced'),
  source: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/jobs/[id]/candidates - Add a candidate to a job
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
    
    const validatedData = addCandidateSchema.parse(body);

    // Check if job exists
    const job = await jobQueries.findById(jobId);
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    // Check if candidate exists
    const candidate = await candidateQueries.findById(validatedData.candidateId);
    if (!candidate) {
      return NextResponse.json({
        success: false,
        error: 'Candidate not found'
      }, { status: 404 });
    }

    // Create application (candidate-job relationship)
    const application = await applicationQueries.create({
      candidate_id: validatedData.candidateId,
      job_id: jobId,
      stage: validatedData.stage,
      status: 'APPLIED',
      source: validatedData.source || 'manual',
      notes: validatedData.notes,
    });

    logger.info(`Added candidate ${validatedData.candidateId} to job ${jobId}`);

    // Return the candidate with application info
    const result = {
      ...candidate,
      applicationId: application.id,
      stage: application.stage,
      applicationStatus: application.status,
      appliedAt: application.created_at,
    };

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 });

  } catch (error: any) {
    logger.error('Error adding candidate to job:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      return NextResponse.json({
        success: false,
        error: 'Candidate is already added to this job'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to add candidate to job'
    }, { status: 500 });
  }
}

// Schema for updating candidate stage
const updateCandidateStageSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  stage: z.string().min(1, 'Stage is required'),
});

// PUT /api/jobs/[id]/candidates - Update candidate stage in job pipeline
export async function PUT(
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
    
    const validatedData = updateCandidateStageSchema.parse(body);

    // Update application stage
    const updatedApplication = await applicationQueries.updateStage(
      validatedData.candidateId,
      jobId,
      validatedData.stage
    );

    if (!updatedApplication) {
      return NextResponse.json({
        success: false,
        error: 'Application not found'
      }, { status: 404 });
    }

    logger.info(`Updated candidate ${validatedData.candidateId} stage to ${validatedData.stage} in job ${jobId}`);

    return NextResponse.json({
      success: true,
      data: updatedApplication
    });

  } catch (error: any) {
    logger.error('Error updating candidate stage:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update candidate stage'
    }, { status: 500 });
  }
}

// Schema for removing a candidate
const removeCandidateSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
});

// DELETE /api/jobs/[id]/candidates - Remove a candidate from a job
export async function DELETE(
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
    
    const validatedData = removeCandidateSchema.parse(body);

    // Delete the application
    const deleted = await applicationQueries.delete(validatedData.candidateId, jobId);

    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Application not found'
      }, { status: 404 });
    }

    logger.info(`Removed candidate ${validatedData.candidateId} from job ${jobId}`);

    return NextResponse.json({
      success: true,
      message: 'Candidate removed from job successfully'
    });

  } catch (error: any) {
    logger.error('Error removing candidate from job:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to remove candidate from job'
    }, { status: 500 });
  }
}