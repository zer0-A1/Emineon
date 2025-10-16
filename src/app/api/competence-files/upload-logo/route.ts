import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { uploadImageToCloudinary } from '@/lib/cloudinary-config';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - REQUIRED for all users
    const { userId } = auth();

    if (!userId) {
      console.log('❌ Authentication required for logo upload');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Authentication required to upload logo'
      }, { status: 401 });
    }

    console.log('✅ User authenticated for logo upload:', userId);
    console.log('📤 Logo upload endpoint called');

    // Get the uploaded file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided',
        message: 'Please upload a logo file'
      }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type',
        message: 'Please upload a PNG, JPG, SVG, or WebP image'
      }, { status: 400 });
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large',
        message: 'Logo file size must be less than 2MB'
      }, { status: 400 });
    }

    console.log(`📁 Processing logo: ${file.name} (${file.size} bytes, ${file.type})`);

    try {
      // Convert file to buffer for Cloudinary upload
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate a unique filename for the logo
      const timestamp = Date.now();
      const filename = `logo_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Upload to Cloudinary with image optimizations
      console.log('☁️ Uploading logo to Cloudinary...');
      const result = await uploadImageToCloudinary(buffer, filename, [
        { width: 200, height: 200, crop: 'limit' }, // Limit size for logos
        { quality: 'auto' }, // Optimize quality
        { format: 'auto' } // Auto format selection
      ]);

      console.log('✅ Logo uploaded successfully:', result.url);

      return NextResponse.json({
        success: true,
        data: {
          logoUrl: result.url,
          publicId: result.publicId,
          originalName: file.name,
          fileSize: file.size,
          fileType: file.type
        },
        message: 'Logo uploaded successfully'
      });

    } catch (uploadError: any) {
      console.error('❌ Cloudinary upload error:', uploadError);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload logo to cloud storage';
      let errorDetails = uploadError?.message || 'Unknown upload error';
      
      if (uploadError?.message?.includes('Invalid API Key')) {
        errorMessage = 'Cloud storage configuration error';
        errorDetails = 'Please check Cloudinary API credentials';
      } else if (uploadError?.message?.includes('timeout')) {
        errorMessage = 'Upload timeout';
        errorDetails = 'Please try again with a smaller file';
      } else if (uploadError?.message?.includes('network')) {
        errorMessage = 'Network error';
        errorDetails = 'Please check your internet connection and try again';
      }
      
      return NextResponse.json({
        error: 'Upload failed',
        message: errorMessage,
        details: errorDetails
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 Logo upload error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while uploading the logo.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Logo upload endpoint',
    supportedFormats: ['PNG', 'JPG', 'SVG', 'WebP'],
    maxFileSize: '2MB',
    authentication: 'required',
    endpoint: '/api/competence-files/upload-logo',
    status: 'active'
  });
} 