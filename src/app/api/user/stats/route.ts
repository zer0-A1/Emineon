import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock user statistics - in a real app, these would come from the database
    const stats = {
      totalCandidates: 1247,
      activeCandidates: 892,
      totalJobs: 35,
      activeJobs: 18,
      applicationsSent: 156,
      interviewsScheduled: 23,
      hires: 8,
      conversionRate: '12.3%',
      averageTimeToHire: '18 days',
      topSkills: ['React', 'Node.js', 'Python', 'AWS', 'TypeScript'],
      recentActivity: [
        { type: 'candidate_added', count: 12, label: 'New Candidates' },
        { type: 'job_posted', count: 3, label: 'Jobs Posted' },
        { type: 'interview_completed', count: 8, label: 'Interviews Completed' },
        { type: 'hire_made', count: 2, label: 'Hires Made' }
      ]
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
} 