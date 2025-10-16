import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { projectQueries, clientQueries, jobQueries } from '@/lib/db/queries';
import { z } from 'zod';

// Schema for creating a new project
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  clientId: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  budget: z.number().optional(),
});

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    // Get projects with optional filters
    const projects = await projectQueries.findAll({ 
      status: status || undefined, 
      client_id: clientId || undefined 
    });

    // Get related data for each project
    const projectsWithRelations = await Promise.all(
      projects.map(async (project) => {
        // Get client info if available
        let client = null;
        if (project.client_id) {
          client = await clientQueries.findById(project.client_id);
        }
        
        // Get jobs for this project
        const jobs = await projectQueries.getJobs(project.id);
        
        return {
          ...project,
          client,
          jobs,
          _count: { jobs: jobs.length }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: projectsWithRelations
    });

  } catch (error) {
    logger.error('Error fetching projects:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch projects'
    }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Map fields to database columns
    const projectData = {
      name: validatedData.name,
      description: validatedData.description,
      client_id: validatedData.clientId,
      status: validatedData.status,
      start_date: validatedData.startDate,
      end_date: validatedData.endDate,
      budget: validatedData.budget,
    };

    // Create the project
    const project = await projectQueries.create(projectData);

    logger.info('Project created successfully:', project.id);

    // Get client info if available
    let client = null;
    if (project.client_id) {
      client = await clientQueries.findById(project.client_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        client,
        jobs: [],
        _count: { jobs: 0 }
      }
    }, { status: 201 });

  } catch (error: any) {
    logger.error('Error creating project:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create project'
    }, { status: 500 });
  }
}