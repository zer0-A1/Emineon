// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { z } from 'zod';
import { FileTypeUtils } from '@/lib/universal-storage';

export const runtime = 'nodejs';

// GET /api/knowledge?search=&type=&clientId=&projectId=&limit=20
export async function GET(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const type = (searchParams.get('type') || '').trim();
    const clientId = searchParams.get('clientId') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const whereDoc: any = {};
    if (search) {
      whereDoc.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: search.split(/\s+/).filter(Boolean) } },
      ];
    }
    if (type) whereDoc.type = type as any;
    if (clientId) whereDoc.clientId = clientId;
    if (projectId) whereDoc.projectId = projectId;

    const [documents, posts] = await Promise.all([
      db.knowledgeDocument.findMany({
        where: whereDoc,
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      db.teamPost.findMany({
        where: search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { tags: { hasSome: search.split(/\s+/).filter(Boolean) } },
              ],
            }
          : undefined,
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
    ]);

    // @ts-ignore
    (NextResponse as any).revalidateTag?.('knowledge:list');
    return NextResponse.json({ success: true, data: { documents, posts } });
  } catch (error) {
    console.error('Error listing knowledge:', error);
    return NextResponse.json({ success: false, error: 'Failed to list knowledge' }, { status: 500 });
  }
}

// POST /api/knowledge
// - Multipart formdata with kind=document to upload file and create KnowledgeDocument
// - JSON body with kind=post to create TeamPost
export async function POST(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const kind = (form.get('kind') as string) || 'document';
      if (kind !== 'document') {
        return NextResponse.json({ success: false, error: 'Invalid kind for multipart' }, { status: 400 });
      }

      const file = form.get('file') as File | null;
      const title = (form.get('title') as string) || (file ? file.name : 'Untitled');
      const summary = (form.get('summary') as string) || undefined;
      const type = (form.get('type') as string) || 'CASE_STUDY';
      const tags = ((form.get('tags') as string) || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const clientId = (form.get('clientId') as string) || undefined;
      const projectId = (form.get('projectId') as string) || undefined;

      if (!file) {
        return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await FileTypeUtils.uploadDocument(buffer, file.name, undefined, type);

      const doc = await db.knowledgeDocument.create({
        data: {
          title,
          summary,
          url: upload.url,
          content: null,
          tags,
          industry: undefined,
          clientId,
          projectId,
          type: type as any,
          isFeatured: false,
          createdBy: undefined,
          updatedBy: undefined,
        },
      });
      try {
        const { revalidateTag } = await import('next/cache');
        revalidateTag('knowledge:list');
        revalidateTag(`knowledge:${doc.id}`);
      } catch {}
      return NextResponse.json({ success: true, data: doc }, { status: 201 });
    }

    // JSON for posts or document without file
    const baseSchema = z.object({ kind: z.enum(['post', 'document']) });
    const base = baseSchema.parse(await request.json());

    if (base.kind === 'post') {
      const postSchema = z.object({
        kind: z.literal('post'),
        title: z.string().min(1),
        content: z.string().min(1),
        tags: z.array(z.string()).default([]),
        authorEmail: z.string().email().optional(),
      });
      const parsed = postSchema.parse(base);
      const post = await db.teamPost.create({
        data: {
          title: parsed.title,
          content: parsed.content,
          tags: parsed.tags,
          authorEmail: parsed.authorEmail,
        },
      });
      return NextResponse.json({ success: true, data: post }, { status: 201 });
    }

    // JSON document (content-only knowledge reference)
    const docSchema = z.object({
      kind: z.literal('document'),
      title: z.string().min(1),
      summary: z.string().optional(),
      content: z.string().min(1),
      tags: z.array(z.string()).default([]),
      type: z.string().default('CASE_STUDY'),
      clientId: z.string().optional(),
      projectId: z.string().optional(),
    });
    const parsedDoc = docSchema.parse(base);

    const doc = await db.knowledgeDocument.create({
      data: {
        title: parsedDoc.title,
        summary: parsedDoc.summary,
        url: null,
        content: parsedDoc.content,
        tags: parsedDoc.tags,
        industry: undefined,
        clientId: parsedDoc.clientId,
        projectId: parsedDoc.projectId,
        type: parsedDoc.type as any,
        isFeatured: false,
        createdBy: undefined,
        updatedBy: undefined,
      },
    });
    try {
      const { revalidateTag } = await import('next/cache');
      revalidateTag('knowledge:list');
      revalidateTag(`knowledge:${doc.id}`);
    } catch {}
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge item:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create knowledge item' }, { status: 500 });
  }
}

// PUT /api/knowledge?id=...
export async function PUT(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    const body = await request.json();
    const updated = await db.knowledgeDocument.update({ where: { id }, data: body });
    try { const { revalidateTag } = await import('next/cache'); revalidateTag('knowledge:list'); revalidateTag(`knowledge:${id}`); } catch {}
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating knowledge document:', error);
    return NextResponse.json({ success: false, error: 'Failed to update knowledge document' }, { status: 500 });
  }
}

// DELETE /api/knowledge?id=...
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    await db.knowledgeDocument.delete({ where: { id } });
    try { const { revalidateTag } = await import('next/cache'); revalidateTag('knowledge:list'); } catch {}
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge document:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete knowledge document' }, { status: 500 });
  }
}

