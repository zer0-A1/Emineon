import { NextRequest, NextResponse } from 'next/server';
import { linkedinParsingSchema } from '@/lib/validation';
import { cvParserService } from '@/lib/services/cv-parser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    console.log('LinkedIn parsing request received');

    const body = await request.json();
    
    // Validate the input
    const validatedData = linkedinParsingSchema.parse(body);
    
    // Validate LinkedIn URL format
    const linkedinUrlPattern = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    
    if (!linkedinUrlPattern.test(validatedData.linkedinUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)',
        },
        { status: 400 }
      );
    }

    const parsedData = await cvParserService.parseLinkedInProfile(validatedData.linkedinUrl);

    return NextResponse.json({
      success: true,
      data: parsedData,
      message: 'LinkedIn profile parsed successfully',
      note: 'This is a demo version. Full LinkedIn integration requires LinkedIn API access.',
    });
  } catch (error) {
    console.error('LinkedIn parsing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse LinkedIn profile',
      },
      { status: 500 }
    );
  }
} 