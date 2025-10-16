import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AssessmentService, type AIAssessmentInput } from '@/lib/services/assessment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input: AIAssessmentInput = {
      jobTitle: body.jobTitle || 'Software Engineer',
      jobDescription: body.jobDescription || '',
      assessmentType: body.assessmentType || 'technical',
      skillLevel: body.skillLevel || 'intermediate',
      duration: Number(body.duration) || 60,
      focusAreas: Array.isArray(body.focusAreas) ? body.focusAreas : undefined,
      includeCodeChallenges: Boolean(body.includeCodeChallenges),
    };

    const service = new AssessmentService();
    const questions = await service.generateAIAssessment(input);

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error('Assessment generation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate assessment' }, { status: 500 });
  }
}
