import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { reindexCandidate } from '@/lib/embeddings/reindex-service';

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

    const candidateId = params.id;
    const body = await request.json();
    const trigger = body.trigger || 'manual';
    const changedFields = body.changedFields;

    // Reindex the candidate
    await reindexCandidate(candidateId, trigger, changedFields);

    return NextResponse.json({
      success: true,
      message: `Candidate ${candidateId} reindexed successfully`,
      trigger,
    });

  } catch (error: any) {
    console.error('Error reindexing candidate:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to reindex candidate',
    }, { status: 500 });
  }
}
