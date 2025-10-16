// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { embedTextSmall1536 } from '@/lib/embeddings';
import { universalStorage } from '@/lib/universal-storage';
import { enhancedCVParser } from '@/lib/services/cv-parser-enhanced'; // Re-using text extraction logic

// Lazy import for Google Document AI
let DocumentAI: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DocumentAI = require('@google-cloud/documentai');
} catch (_) {
  DocumentAI = null;
}

async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
    // For plain text files, just return the content.
    if (mimeType.startsWith('text/')) {
        return buffer.toString('utf-8');
    }

    // For other file types (PDF, DOCX, images), use Document AI.
    const projectId = process.env.GOOGLE_PROJECT_ID as string;
    const location = process.env.GOOGLE_LOCATION as string;
    const processorId = process.env.GOOGLE_DOCAI_PROCESSOR_ID as string;

    if (!DocumentAI || !projectId || !location || !processorId) {
      console.error('Document AI is not configured, falling back to basic text extraction.');
      // Basic fallback for non-text files if DocAI is not set up
      return 'Unsupported file type for text extraction without Document AI.';
    }
    
    const { DocumentProcessorServiceClient } = DocumentAI.v1;
    const client = new DocumentProcessorServiceClient();
    const name = client.processorPath(projectId, location, processorId);
    
    const request = {
      name,
      rawDocument: {
        content: buffer.toString('base64'),
        mimeType,
      },
    } as any;
  
    const [result] = await client.processDocument(request);
    const doc = result.document;
    return (doc?.text as string) || '';
}


export async function POST(req: NextRequest) {
  // Allow either Clerk user or internal token for automation
  const { userId } = auth();
  const token = req.headers.get('x-ingest-token');
  const internalOk = token && process.env.KNOWLEDGE_INGEST_TOKEN && token === process.env.KNOWLEDGE_INGEST_TOKEN;
  if (!userId && !internalOk) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const textContent = formData.get('text') as string | null;
    const sourceType = formData.get('sourceType') as 'CANDIDATE' | 'JOB' | 'PROJECT' | 'CLIENT' | undefined;
    const sourceId = formData.get('sourceId') as string | undefined;

    let documentTitle = title;
    let extractedText = textContent;

    if (file) {
      documentTitle = title || file.name;
      const buffer = Buffer.from(await file.arrayBuffer());

      // 1. Upload file to GCS
      await universalStorage.uploadFile(buffer, file.name, file.type, 'documents', {
        userId: userId || 'system-ingest',
        description: `Knowledge base document: ${documentTitle}`
      });
      
      // 2. Extract text from file
      extractedText = await extractTextFromFile(buffer, file.type);

    }

    if (!documentTitle || !extractedText) {
      return NextResponse.json({ success: false, error: 'Document title and text content (or a file) are required.' }, { status: 400 });
    }

    // 3. Compute embedding
    const vec = await embedTextSmall1536(`${documentTitle}\n\n${extractedText}`);

    // 4. Store in SearchDocument
    const doc = await db.searchDocument.create({
      data: {
        title: documentTitle,
        text: extractedText,
        sourceType: sourceType ?? 'CLIENT',
        sourceId: sourceId ?? 'manual-upload',
        embedding: (vec as any),
      },
    });

    return NextResponse.json({ success: true, id: doc.id });

  } catch (error: any) {
    console.error('Knowledge ingestion error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to ingest document' }, { status: 500 });
  }
}


