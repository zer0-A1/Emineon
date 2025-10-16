import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { candidateQueries } from '@/lib/db/queries';
import { reindexCandidate } from '@/lib/embeddings/reindex-service';

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

    const { id } = params;

    // Fetch candidate
    const candidate = await candidateQueries.findById(id);

    if (!candidate) {
      return NextResponse.json({
        success: false,
        error: 'Candidate not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: candidate,
    });

  } catch (error: any) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

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

    const { id } = params;
    const body = await request.json();

    // Map frontend fields to database fields
    const updateData: any = {};
    
    // Basic fields
    if (body.firstName !== undefined) updateData.first_name = body.firstName;
    if (body.lastName !== undefined) updateData.last_name = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    
    // Professional fields
    if (body.currentTitle !== undefined) updateData.current_title = body.currentTitle;
    if (body.currentLocation !== undefined) updateData.current_location = body.currentLocation;
    if (body.experienceYears !== undefined) updateData.experience_years = body.experienceYears;
    if (body.seniorityLevel !== undefined) updateData.seniority_level = body.seniorityLevel;
    
    // Skills arrays
    if (body.technicalSkills !== undefined) updateData.technical_skills = body.technicalSkills;
    if (body.programmingLanguages !== undefined) updateData.programming_languages = body.programmingLanguages;
    if (body.frameworks !== undefined) updateData.frameworks = body.frameworks;
    
    // Other fields
    if (body.expectedSalary !== undefined) updateData.expected_salary = body.expectedSalary;
    if (body.remotePreference !== undefined) updateData.remote_preference = body.remotePreference;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.archived !== undefined) updateData.archived = body.archived;

    // Update candidate
    const updatedCandidate = await candidateQueries.update(id, updateData);

    if (!updatedCandidate) {
      return NextResponse.json({
        success: false,
        error: 'Candidate not found',
      }, { status: 404 });
    }

    // Trigger reindexing in the background
    const changedFields = Object.keys(updateData);
    reindexCandidate(id, 'update', changedFields).catch(err => {
      console.error('Failed to reindex candidate:', err);
    });

    return NextResponse.json({
      success: true,
      data: updatedCandidate,
    });

  } catch (error: any) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

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

    const { id } = params;

    // Delete candidate
    await candidateQueries.delete(id);

    // Trigger reindexing to remove from search
    reindexCandidate(id, 'delete').catch(err => {
      console.error('Failed to remove candidate from index:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}