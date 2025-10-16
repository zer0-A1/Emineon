import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { publicApplicationSchema } from '@/lib/validation';
import { workflowEngine } from '@/lib/services/workflow';

// Mock applications data
const mockApplications: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mockApplications,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch applications',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the data
    const validatedData = publicApplicationSchema.parse(body);
    
    // Create or find candidate
    const candidate = {
      id: Math.random().toString(36).substr(2, 9),
      name: validatedData.name,
      email: validatedData.email,
      skills: [],
      experience: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Create application
    const application = {
      id: Math.random().toString(36).substr(2, 9),
      candidateId: candidate.id,
      jobId: validatedData.jobId,
      status: 'PENDING',
      coverLetter: validatedData.coverLetter,
      referralCode: validatedData.referralCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to mock data
    mockApplications.push(application);

    // Trigger workflow
    await workflowEngine.executeWorkflows({
      event: 'application_created',
      data: {
        application,
        candidate,
        resourceType: 'application',
        applicationId: application.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        application,
        candidate,
      },
      message: 'Application submitted successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit application',
      },
      { status: 500 }
    );
  }
} 