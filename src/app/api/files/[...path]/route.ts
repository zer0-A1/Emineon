import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Join the path segments
    const filePath = params.path.join('/');
    
    // Construct the full file path
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await fs.readFile(fullPath);
    
    // Get file extension to determine content type
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(fullPath)}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });

  } catch (error: unknown) {
    console.error('Error in file handler:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to serve file',
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 