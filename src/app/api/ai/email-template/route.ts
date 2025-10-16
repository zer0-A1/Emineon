import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { aiEmailTemplateSchema } from '@/lib/validation';
import { openaiService } from '@/lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate the input
    const validatedData = aiEmailTemplateSchema.parse(body);
    
    // Generate email template using OpenAI
    const emailTemplate = await openaiService.generateEmailTemplate(validatedData);

    return NextResponse.json({
      success: true,
      data: {
        ...emailTemplate,
        input: validatedData,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating email template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate email template',
      },
      { status: 500 }
    );
  }
} 