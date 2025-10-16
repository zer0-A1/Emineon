import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { openaiService } from '@/lib/services';
import { z } from 'zod';

export const runtime = 'nodejs';

const generateJobDescriptionSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'executive']).optional(),
  industry: z.string().optional(),
  companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  keySkills: z.array(z.string()).optional(),
  isRemote: z.boolean().optional(),
  salaryRange: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = generateJobDescriptionSchema.parse(body);

    // Generate job description using OpenAI
    const jobDescription = await openaiService.generateJobDescription({
      title: validatedData.title,
      department: validatedData.department,
      location: validatedData.location,
      keyRequirements: validatedData.keySkills || [],
      experienceLevel: validatedData.experienceLevel,
    });

    return NextResponse.json({
      success: true,
      data: jobDescription,
    });
  } catch (error) {
    console.error('Job description generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate job description' },
      { status: 500 }
    );
  }
} 