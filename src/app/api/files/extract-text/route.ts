import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';

// Lazy import for Google Document AI
let DocumentAI: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DocumentAI = require('@google-cloud/documentai');
} catch (_) {
  DocumentAI = null;
}

async function extractTextWithDocAI(fileBuffer: Buffer, mimeType: string): Promise<string> {
  const projectId = process.env.GOOGLE_PROJECT_ID as string;
  const location = process.env.GOOGLE_LOCATION as string; // e.g., 'eu' or 'us'
  const processorId = process.env.GOOGLE_DOCAI_PROCESSOR_ID as string;

  if (!DocumentAI) {
    throw new Error('Document AI SDK not available on the server.');
  }
  if (!projectId || !location || !processorId) {
    throw new Error('Google Document AI environment variables are not configured.');
  }

  const { DocumentProcessorServiceClient } = DocumentAI.v1;
  const client = new DocumentProcessorServiceClient();
  const name = client.processorPath(projectId, location, processorId);
  
  const request = {
    name,
    rawDocument: {
      content: fileBuffer.toString('base64'),
      mimeType,
    },
  } as any;

  const [result] = await client.processDocument(request);
  const doc = result.document;
  return (doc?.text as string) || '';
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // For plain text files, just return the content.
    if (file.type.startsWith('text/')) {
        const text = buffer.toString('utf-8');
        return NextResponse.json({ success: true, text });
    }

    // For other file types (PDF, DOCX, images), use Document AI.
    const text = await extractTextWithDocAI(buffer, file.type);
    
    if (!text || text.trim().length === 0) {
        return NextResponse.json({ success: false, error: 'Failed to extract text from the document.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, text });

  } catch (error: any) {
    console.error('Text extraction error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to extract text' }, { status: 500 });
  }
} 