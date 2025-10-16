import { NextRequest, NextResponse } from 'next/server';
import { aiQueueService } from '@/lib/services/ai-queue-service';
import { useAIGenerationStore } from '@/stores/ai-generation-store';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'P-Queue Dashboard API',
    queue: {
      size: 0,
      pending: 0,
      completed: 0,
      failed: 0,
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId } = body;

    if (action === 'cancel-job' && jobId) {
      const success = await aiQueueService.cancelJob(jobId);
      return NextResponse.json({
        success,
        message: success ? `Job ${jobId} cancelled` : `Failed to cancel job ${jobId}`,
      });
    }

    if (action === 'clear-all') {
      useAIGenerationStore.getState().clearAll();
      return NextResponse.json({
        success: true,
        message: 'All jobs cleared',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Dashboard action error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate throughput
function calculateThroughput(jobs: Record<string, any>): number {
  const completedJobs = Object.values(jobs).filter(job => 
    job.status === 'completed' && job.completedAt
  );

  if (completedJobs.length === 0) return 0;

  // Calculate jobs per minute for the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentJobs = completedJobs.filter(job => 
    new Date(job.completedAt) > oneHourAgo
  );

  return recentJobs.length; // Jobs completed in the last hour
} 