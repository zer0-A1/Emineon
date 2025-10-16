import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { projectQueries, clientQueries, jobQueries } from '@/lib/db/queries';
import { z } from 'zod';

// Schema for updating a project
const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  clientId: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  budget: z.number().optional(),
});

// GET /api/projects/[id] - Get project details
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

    const projectId = params.id;
    const project = await projectQueries.findById(projectId);

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    // Get related data
    let client = null;
    if (project.client_id) {
      client = await clientQueries.findById(project.client_id);
    }

    // Get jobs for this project
    const jobs = await projectQueries.getJobs(projectId);

    const projectWithRelations = {
      ...project,
      client,
      jobs,
      _count: { jobs: jobs.length }
    };

    return NextResponse.json({
      success: true,
      data: projectWithRelations
    });

  } catch (error) {
    logger.error('Error fetching project:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch project'
    }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update a project
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

    const projectId = params.id;
    const body = await request.json();
    
    const validatedData = updateProjectSchema.parse(body);

    // Map field names to database columns
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.clientId !== undefined) updateData.client_id = validatedData.clientId;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.startDate !== undefined) updateData.start_date = validatedData.startDate;
    if (validatedData.endDate !== undefined) updateData.end_date = validatedData.endDate;
    if (validatedData.budget !== undefined) updateData.budget = validatedData.budget;

    // Update the project
    const updatedProject = await projectQueries.update(projectId, updateData);

    if (!updatedProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedProject
    });

  } catch (error: any) {
    logger.error('Error updating project:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update project'
    }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete a project
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

    const projectId = params.id;
    
    // Check if project exists and has jobs
    const project = await projectQueries.findById(projectId);
    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    const jobs = await projectQueries.getJobs(projectId);
    if (jobs.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete project with existing jobs'
      }, { status: 400 });
    }

    // Soft delete by archiving
    const archivedProject = await projectQueries.update(projectId, { status: 'ARCHIVED' });

    if (!archivedProject) {
      return NextResponse.json({
        success: false,
        error: 'Failed to archive project'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Project archived successfully'
    });

  } catch (error) {
    logger.error('Error deleting project:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete project'
    }, { status: 500 });
  }
}