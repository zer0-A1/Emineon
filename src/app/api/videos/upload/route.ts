import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const candidateId = formData.get('candidateId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'File must be a video' },
        { status: 400 }
      );
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: `emineon-ats/candidate-videos/${candidateId}`,
          context: {
            title: title || 'Candidate Video',
            description: description || '',
            candidateId,
          },
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 1080, height: 1920, crop: 'limit' } // Optimize for mobile
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const result = uploadResponse as any;

    // Generate thumbnail URL
    const thumbnailUrl = cloudinary.url(result.public_id, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { width: 400, height: 600, crop: 'fill' },
        { start_offset: '1' } // Thumbnail from 1 second in
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        thumbnailUrl,
        duration: result.duration,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      }
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    });

    if (result.result === 'ok') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete video' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Video deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
} 