import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { enhancedCVParser } from '@/lib/services/cv-parser-enhanced';

export async function POST(request: NextRequest) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Accept images and documents; Responses API handles all via input_file
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html',
      'text/markdown',
      'image/png',
      'image/jpeg',
      'image/webp'
    ];

    if (file.type && !validTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Please upload PDF, DOCX, TXT, HTML, MD, or image files (PNG/JPEG/WEBP).' 
      }, { status: 400 });
    }

    // Read file buffer and parse using enhanced CV parser
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedData = await enhancedCVParser.parseFromFile(buffer, file.name, file.type);

    // Return the parsed data
    return NextResponse.json({ 
      success: true, 
      data: parsedData,
      message: 'CV parsed successfully' 
    });

  } catch (error: any) {
    console.error('CV parsing error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to parse CV',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}