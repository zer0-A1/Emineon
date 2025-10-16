import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FileTypeUtils, FileCategory } from '@/lib/universal-storage';

// Request validation schema
const UploadRequestSchema = z.object({
  category: z.enum(['cv-uploads', 'avatars', 'logos', 'documents', 'templates', 'applications', 'jobs']),
  userId: z.string().optional(),
  candidateId: z.string().optional(),
  jobId: z.string().optional(),
  applicationId: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file') as File;
    const jobId = form.get('jobId') as string;
    const candidateId = form.get('candidateId') as string;
    const metadataJson = form.get('metadata') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 25MB allowed.' },
        { status: 413 }
      );
    }

    // Parse and validate metadata
    let metadata;
    try {
      metadata = metadataJson ? JSON.parse(metadataJson) : {};
      UploadRequestSchema.parse(metadata);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid metadata format' },
        { status: 400 }
      );
    }

    const { category, userId, jobId: metadataJobId, applicationId, description, tags } = metadata;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload based on category using specialized utilities
    let uploadResult;
    
    switch (category as FileCategory) {
      case 'cv-uploads':
        uploadResult = await FileTypeUtils.uploadCV(buffer, file.name, candidateId, userId);
        break;
      
      case 'avatars':
        uploadResult = await FileTypeUtils.uploadAvatar(buffer, file.name, userId, candidateId);
        break;
      
      case 'logos':
        uploadResult = await FileTypeUtils.uploadLogo(buffer, file.name, metadata.companyName, userId);
        break;
      
      case 'documents':
        uploadResult = await FileTypeUtils.uploadDocument(buffer, file.name, userId, metadata.docType);
        break;
      
      case 'jobs':
        uploadResult = await FileTypeUtils.uploadJobFile(buffer, file.name, metadataJobId!, userId, metadata.fileType);
        break;
      
      case 'applications':
        uploadResult = await FileTypeUtils.uploadApplicationFile(buffer, file.name, applicationId!, candidateId, metadata.fileType);
        break;
      
      case 'templates':
        uploadResult = await FileTypeUtils.uploadTemplateAsset(buffer, file.name, userId, metadata.assetType);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid file category' },
          { status: 400 }
        );
    }

    console.log(`File uploaded successfully: ${file.name} (${category})`);

    return NextResponse.json({
      success: true,
      file: {
        id: `file_${Date.now()}`,
        url: uploadResult.url,
        fileName: uploadResult.fileName,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
        category,
        uploadedAt: new Date().toISOString(),
        metadata: uploadResult.metadata,
      },
    });

  } catch (error: unknown) {
    console.error('File upload error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check upload service status
export async function GET() {
  return NextResponse.json({
    service: 'Universal File Upload',
    status: 'operational',
    supportedCategories: [
      'cv-uploads',
      'avatars', 
      'logos',
      'documents',
      'templates',
      'applications',
      'jobs'
    ],
    maxFileSize: '25MB',
    timestamp: new Date().toISOString(),
  });
} 

// List candidate documents by prefix
export async function DELETE() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 405 });
}