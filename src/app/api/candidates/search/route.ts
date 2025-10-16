import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { SearchService } from '@/lib/services/search-service';
import { performanceMonitor } from '@/lib/monitoring/performance';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    status: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    location: z.string().optional(),
    experienceMin: z.number().optional(),
    experienceMax: z.number().optional(),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    availability: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    contractType: z.array(z.string()).optional(),
  }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().default('lastUpdated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = searchSchema.parse(body);

    // Search with performance monitoring
    const results = await performanceMonitor.measureAsync(
      'api:candidates:search',
      async () => {
        return await SearchService.searchCandidates(
          validatedData.query || '',
          validatedData.filters || {},
          {
            page: validatedData.page,
            limit: validatedData.limit,
            sortBy: validatedData.sortBy,
            sortOrder: validatedData.sortOrder,
          }
        );
      },
      {
        userId,
        query: validatedData.query,
        page: validatedData.page,
      }
    );

    // Invalidate cache if needed (handled in SearchService)

    return NextResponse.json(results);
  } catch (error) {
    console.error('Candidate search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search candidates' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const data = {
      query: searchParams.get('q') || '',
      filters: {
        status: searchParams.get('status')?.split(',').filter(Boolean),
        skills: searchParams.get('skills')?.split(',').filter(Boolean),
        location: searchParams.get('location') || undefined,
        experienceMin: searchParams.get('experienceMin') 
          ? parseInt(searchParams.get('experienceMin')!) 
          : undefined,
        experienceMax: searchParams.get('experienceMax')
          ? parseInt(searchParams.get('experienceMax')!)
          : undefined,
      },
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'lastUpdated',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const validatedData = searchSchema.parse(data);

    const results = await SearchService.searchCandidates(
      validatedData.query,
      validatedData.filters || {},
      {
        page: validatedData.page,
        limit: validatedData.limit,
        sortBy: validatedData.sortBy,
        sortOrder: validatedData.sortOrder,
      }
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Candidate search error:', error);
    return NextResponse.json(
      { error: 'Failed to search candidates' },
      { status: 500 }
    );
  }
}
