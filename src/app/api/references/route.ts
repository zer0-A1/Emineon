// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { z } from 'zod';

export const runtime = 'nodejs';

// GET /api/references?search=&status=&limit=20
export async function GET(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') || undefined;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where: any = {};
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { anonymizedLabel: { contains: search, mode: 'insensitive' } },
        { capabilities: { hasSome: search.split(/\s+/).filter(Boolean) } },
        { techStack: { hasSome: search.split(/\s+/).filter(Boolean) } },
      ];
    }
    if (status) where.status = status as any;

    const references = await db.clientReference.findMany({
      where,
      include: { outcomes: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    // @ts-ignore
    (NextResponse as any).revalidateTag?.('references:list');
    return NextResponse.json({ success: true, data: references });
  } catch (error) {
    console.error('Error listing references:', error);
    return NextResponse.json({ success: false, error: 'Failed to list references' }, { status: 500 });
  }
}

// POST /api/references (JSON)
export async function POST(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const schema = z.object({
      clientName: z.string().min(1),
      anonymizedLabel: z.string().optional(),
      logoPermission: z.boolean().optional(),
      industryVertical: z.string().optional(),
      subvertical: z.string().optional(),
      region: z.string().optional(),
      sizeBracket: z.string().optional(),
      services: z.array(z.string()).default([]),
      capabilities: z.array(z.string()).default([]),
      techStack: z.array(z.string()).default([]),
      timeframeStart: z.string().optional(),
      timeframeEnd: z.string().optional(),
      durationMonths: z.number().optional(),
      quoteText: z.string().optional(),
      quoteAuthor: z.string().optional(),
      quotePermission: z.boolean().optional(),
      referenceContactPermission: z.boolean().optional(),
      confidentialityLevel: z.enum(['PUBLIC','NAMED_NO_LOGO','ANONYMOUS','INTERNAL_ONLY']).optional(),
      languages: z.array(z.string()).default([]),
      ownerEmail: z.string().email().optional(),
      expiryDate: z.string().optional(),
      status: z.enum(['DRAFT','LEGAL_APPROVED','LIVE','RESTRICTED','EXPIRED']).optional(),
      outcomes: z.array(z.object({
        metric: z.string(), baseline: z.string().optional(), achieved: z.string().optional(), delta: z.string().optional(), method: z.string().optional(), measurementWindow: z.string().optional()
      })).default([]),
      proofSheetUrl: z.string().optional(),
      narrativeUrl: z.string().optional(),
      slidesUrl: z.string().optional(),
      evidenceLinks: z.array(z.string()).default([]),
      clientId: z.string().optional(),
      projectId: z.string().optional(),
    });

    const body = await request.json();
    const data = schema.parse(body);

    const created = await db.clientReference.create({
      data: {
        clientName: data.clientName,
        anonymizedLabel: data.anonymizedLabel,
        logoPermission: data.logoPermission ?? false,
        industryVertical: data.industryVertical,
        subvertical: data.subvertical,
        region: data.region,
        sizeBracket: data.sizeBracket,
        services: data.services,
        capabilities: data.capabilities,
        techStack: data.techStack,
        timeframeStart: data.timeframeStart ? new Date(data.timeframeStart) : null,
        timeframeEnd: data.timeframeEnd ? new Date(data.timeframeEnd) : null,
        durationMonths: data.durationMonths,
        quoteText: data.quoteText,
        quoteAuthor: data.quoteAuthor,
        quotePermission: data.quotePermission ?? false,
        referenceContactPermission: data.referenceContactPermission ?? false,
        confidentialityLevel: (data.confidentialityLevel || 'PUBLIC') as any,
        languages: data.languages,
        ownerEmail: data.ownerEmail,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status: (data.status || 'DRAFT') as any,
        proofSheetUrl: data.proofSheetUrl,
        narrativeUrl: data.narrativeUrl,
        slidesUrl: data.slidesUrl,
        evidenceLinks: data.evidenceLinks,
        clientId: data.clientId,
        projectId: data.projectId,
        outcomes: { create: data.outcomes.map(o => ({ ...o })) },
      },
      include: { outcomes: true },
    });
    try {
      const { revalidateTag } = await import('next/cache');
      revalidateTag('references:list');
      revalidateTag(`reference:${created.id}`);
    } catch {}
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating reference:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create reference' }, { status: 500 });
  }
}

// PUT /api/references/[id]
export async function PUT(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    const body = await request.json();
    const updated = await db.clientReference.update({ where: { id }, data: body, include: { outcomes: true } });
    try { const { revalidateTag } = await import('next/cache'); revalidateTag('references:list'); revalidateTag(`reference:${id}`); } catch {}
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating reference:', error);
    return NextResponse.json({ success: false, error: 'Failed to update reference' }, { status: 500 });
  }
}

// DELETE /api/references/[id]
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    await db.clientReference.delete({ where: { id } });
    try { const { revalidateTag } = await import('next/cache'); revalidateTag('references:list'); } catch {}
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reference:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete reference' }, { status: 500 });
  }
}

