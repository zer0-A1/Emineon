// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { z } from 'zod';

export const runtime = 'nodejs';

// GET /api/opportunities?stage=&limit=
export async function GET(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const where: any = {};
    if (stage) where.stage = stage as any;

    const items = await db.opportunity.findMany({ where, orderBy: { updatedAt: 'desc' }, take: limit });
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Error listing opportunities:', error);
    return NextResponse.json({ success: false, error: 'Failed to list opportunities' }, { status: 500 });
  }
}

// POST /api/opportunities
export async function POST(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const schema = z.object({
      name: z.string().min(1),
      clientId: z.string().optional(),
      value: z.number().int().optional(),
      currency: z.string().optional(),
      probability: z.number().int().min(0).max(100).optional(),
      stage: z.enum(['LEAD','QUALIFIED','PROPOSAL','SHORTLIST','NEGOTIATION','WON','LOST']).optional(),
      ownerEmail: z.string().email().optional(),
      nextStep: z.string().optional(),
      closeDate: z.string().optional(),
    });
    const body = await request.json();
    const data = schema.parse(body);

    const created = await db.opportunity.create({
      data: {
        name: data.name,
        clientId: data.clientId,
        value: data.value || null,
        currency: data.currency || 'EUR',
        probability: data.probability || null,
        stage: (data.stage || 'LEAD') as any,
        ownerEmail: data.ownerEmail,
        nextStep: data.nextStep,
        closeDate: data.closeDate ? new Date(data.closeDate) : null,
      }
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create opportunity' }, { status: 500 });
  }
}

// PUT /api/opportunities (stage update)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const schema = z.object({ id: z.string(), stage: z.enum(['LEAD','QUALIFIED','PROPOSAL','SHORTLIST','NEGOTIATION','WON','LOST']) });
    const body = await request.json();
    const data = schema.parse(body);

    const updated = await db.opportunity.update({ where: { id: data.id }, data: { stage: data.stage as any } });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json({ success: false, error: 'Failed to update opportunity' }, { status: 500 });
  }
}

// DELETE /api/opportunities?id=
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) return authResult.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    await db.opportunity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete opportunity' }, { status: 500 });
  }
}

