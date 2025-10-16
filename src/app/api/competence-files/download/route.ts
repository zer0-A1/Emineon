import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('filename');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      );
    }

    console.log('📥 Downloading file from:', fileUrl);

    // Fetch the file from Cloudinary
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch file:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch file from storage' },
        { status: response.status }
      );
    }

    const fileBuffer = await response.arrayBuffer();
    console.log('✅ File fetched successfully, size:', fileBuffer.byteLength);

    // Determine content type based on file extension
    const isPdf = fileUrl.toLowerCase().includes('.pdf');
    const contentType = isPdf ? 'application/pdf' : 'application/octet-stream';
    
    // Create response with proper headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileBuffer.byteLength.toString());
    headers.set('Content-Disposition', `attachment; filename="${fileName || 'download.pdf'}"`);
    headers.set('Cache-Control', 'public, max-age=3600');
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('💥 Download error:', error);
    return NextResponse.json(
      { 
        error: 'Download failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 