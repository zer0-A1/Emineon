import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface UploadResponse {
  success: boolean;
  data?: {
    fileId: string;
    filename: string;
    size: number;
    mimeType: string;
    purpose: string;
  };
  error?: string;
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (32MB limit as per OpenAI docs)
    const maxSize = 32 * 1024 * 1024; // 32MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 32MB limit' },
        { status: 400 }
      );
    }

    // Validate file type - OpenAI supports PDFs and other document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Please upload PDF, DOC, DOCX, TXT, MD, or RTF files.' },
        { status: 400 }
      );
    }

    try {
      // Convert File to Buffer for OpenAI upload
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Upload file to OpenAI Files API
      const uploadedFile = await openai.files.create({
        file: new File([buffer], file.name, { type: file.type }),
        purpose: 'user_data', // As recommended in the docs
      });

      return NextResponse.json({
        success: true,
        data: {
          fileId: uploadedFile.id,
          filename: uploadedFile.filename,
          size: uploadedFile.bytes,
          mimeType: file.type,
          purpose: uploadedFile.purpose,
        }
      });

    } catch (uploadError: any) {
      console.error('OpenAI file upload error:', uploadError);
      
      // Handle specific OpenAI errors
      if (uploadError.status === 400) {
        return NextResponse.json(
          { success: false, error: 'Invalid file format or content' },
          { status: 400 }
        );
      } else if (uploadError.status === 413) {
        return NextResponse.json(
          { success: false, error: 'File too large' },
          { status: 413 }
        );
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to upload file to OpenAI' },
          { status: 500 }
        );
      }
    }

  } catch (error: unknown) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 