// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { DataIntegrityService } from '@/lib/services/data-integrity';
import { performanceMonitor } from '@/lib/monitoring/performance';
import { getWebSocketServer } from '@/lib/websocket/socket-server';
import { z } from 'zod';

const batchAddSchema = z.object({
  candidateIds: z.array(z.string().cuid()).min(1).max(100),
  stage: z.string().optional().default('sourced'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.id;
    const body = await request.json();
    const validatedData = batchAddSchema.parse(body);

    // Perform batch operation with monitoring
    const result = await performanceMonitor.measureAsync(
      'api:jobs:candidates:batchAdd',
      async () => {
        return await DataIntegrityService.batchAddCandidatesToJob(
          jobId,
          validatedData.candidateIds
        );
      },
      {
        userId,
        jobId,
        candidateCount: validatedData.candidateIds.length,
      }
    );

    // Emit real-time update
    const socketServer = getWebSocketServer();
    if (socketServer) {
      socketServer.emitToJob(jobId, 'candidates:batch:added', {
        jobId,
        added: result.added,
        skipped: result.skipped,
        total: result.total,
        addedBy: userId,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Batch add candidates error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to add candidates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

const batchUpdateSchema = z.object({
  applicationIds: z.array(z.string().cuid()).min(1).max(100),
  updates: z.object({
    stage: z.string().optional(),
    status: z.enum(['PENDING', 'REVIEWING', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER_EXTENDED', 'HIRED', 'REJECTED', 'WITHDRAWN']).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.id;
    const body = await request.json();
    const validatedData = batchUpdateSchema.parse(body);

    // Perform batch update with transaction
    const result = await performanceMonitor.measureAsync(
      'api:jobs:candidates:batchUpdate',
      async () => {
        const { query } = await import('@/lib/db/neon-client');

        try {
          return await db.$transaction(async (tx) => {
            // Update all applications
            const updateResult = await tx.application.updateMany({
              where: {
                id: { in: validatedData.applicationIds },
                jobId, // Ensure applications belong to this job
              },
              data: {
                ...validatedData.updates,
                updatedAt: new Date(),
              },
            });

            // Log activity
            await tx.projectActivity.create({
              data: {
                projectId: (await tx.job.findUnique({
                  where: { id: jobId },
                  select: { projectId: true },
                }))!.projectId,
                type: 'BULK_CANDIDATE_UPDATE',
                description: `Bulk updated ${updateResult.count} candidates`,
                metadata: {
                  jobId,
                  applicationIds: validatedData.applicationIds,
                  updates: validatedData.updates,
                  updatedBy: userId,
                },
              },
            });

            return updateResult;
          });
        } finally {
          await db.$disconnect();
        }
      },
      {
        userId,
        jobId,
        applicationCount: validatedData.applicationIds.length,
      }
    );

    // Emit real-time updates
    const socketServer = getWebSocketServer();
    if (socketServer) {
      socketServer.emitToJob(jobId, 'candidates:batch:updated', {
        jobId,
        applicationIds: validatedData.applicationIds,
        updates: validatedData.updates,
        count: result.count,
        updatedBy: userId,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error('Batch update candidates error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update candidates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

const batchDeleteSchema = z.object({
  applicationIds: z.array(z.string().cuid()).min(1).max(100),
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.id;
    const body = await request.json();
    const validatedData = batchDeleteSchema.parse(body);

    // Perform batch delete
    const result = await performanceMonitor.measureAsync(
      'api:jobs:candidates:batchDelete',
      async () => {
        const { query } = await import('@/lib/db/neon-client');

        try {
          return await db.$transaction(async (tx) => {
            // Get applications before deletion for logging
            const applications = await tx.application.findMany({
              where: {
                id: { in: validatedData.applicationIds },
                jobId,
              },
              select: {
                candidateId: true,
              },
            });

            // Delete applications
            const deleteResult = await tx.application.deleteMany({
              where: {
                id: { in: validatedData.applicationIds },
                jobId,
              },
            });

            // Log activity
            await tx.projectActivity.create({
              data: {
                projectId: (await tx.job.findUnique({
                  where: { id: jobId },
                  select: { projectId: true },
                }))!.projectId,
                type: 'BULK_CANDIDATE_REMOVED',
                description: `Removed ${deleteResult.count} candidates from job`,
                metadata: {
                  jobId,
                  applicationIds: validatedData.applicationIds,
                  candidateIds: applications.map(a => a.candidateId),
                  removedBy: userId,
                },
              },
            });

            return deleteResult;
          });
        } finally {
          await db.$disconnect();
        }
      },
      {
        userId,
        jobId,
        applicationCount: validatedData.applicationIds.length,
      }
    );

    // Emit real-time updates
    const socketServer = getWebSocketServer();
    if (socketServer) {
      socketServer.emitToJob(jobId, 'candidates:batch:removed', {
        jobId,
        applicationIds: validatedData.applicationIds,
        count: result.count,
        removedBy: userId,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error('Batch delete candidates error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to remove candidates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
