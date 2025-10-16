// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { FileTypeUtils } from '@/lib/universal-storage';

export const runtime = 'nodejs';

async function extractTextFromFile(file: File): Promise<{ text: string; contentType: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  const contentType = file.type || (name.endsWith('.pdf')
    ? 'application/pdf'
    : name.endsWith('.docx')
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : name.endsWith('.txt')
    ? 'text/plain'
    : name.endsWith('.pptx')
    ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    : 'application/octet-stream');

  try {
    if (contentType === 'application/pdf') {
      const pdfParse: any = (await import('pdf-parse')).default ?? (await import('pdf-parse'));
      const data = await pdfParse(buffer);
      return { text: data.text || '', contentType };
    }
    if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth: any = (await import('mammoth')).default ?? (await import('mammoth'));
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value || '', contentType };
    }
    if (contentType === 'text/plain') {
      const text = buffer.toString('utf-8');
      return { text, contentType };
    }
    // PPTX or others: best-effort placeholder; conversion can be enhanced later
    return { text: '', contentType };
  } catch (e) {
    console.warn('Extract text failed:', e);
    return { text: '', contentType };
  }
}

// POST /api/references/convert (multipart form-data: file, optional clientName)
export async function POST(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const form = await request.formData();
    const file = form.get('file') as File | null;
    const clientName = (form.get('clientName') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }

    // Upload original doc
    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await FileTypeUtils.uploadDocument(buffer, file.name, undefined, 'reference-source');

    // Extract text for draft prefill
    const { text } = await extractTextFromFile(file);

    const created = await db.clientReference.create({
      data: {
        clientName: clientName || file.name.replace(/\.[^.]+$/, ''),
        anonymizedLabel: null,
        logoPermission: false,
        services: [],
        capabilities: [],
        techStack: [],
        languages: [],
        status: 'DRAFT',
        proofSheetUrl: upload.url,
        sourceUrl: upload.url,
        extractedText: text || null,
        outcomes: { create: [] },
      },
      include: { outcomes: true },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Reference convert error:', error);
    return NextResponse.json({ success: false, error: 'Failed to convert reference' }, { status: 500 });
  }
}

