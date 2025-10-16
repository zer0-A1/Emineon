import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { clientContactQueries } from '@/lib/db/queries';
import { z } from 'zod';
import { generateClientContactSearchText, updateEntityEmbedding } from '@/lib/embeddings/unified-embeddings';

const updateSchema = z.object({
  clientId: z.string().optional(),
  managerId: z.string().nullable().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isDecisionMaker: z.boolean().optional(),
  influenceLevel: z.string().optional(),
  relationshipStrength: z.number().int().min(0).max(100).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await handleAuth();
  if (!authResult.isAuthenticated && authResult.response) return authResult.response;
  const body = await request.json();
  const v = updateSchema.parse(body);
  const data: any = {};
  if (v.clientId !== undefined) data.client_id = v.clientId;
  if (v.managerId !== undefined) data.manager_id = v.managerId;
  if (v.name !== undefined) data.name = v.name;
  if (v.email !== undefined) data.email = v.email;
  if (v.phone !== undefined) data.phone = v.phone;
  if (v.title !== undefined) data.title = v.title;
  if (v.role !== undefined) data.role = v.role;
  if (v.department !== undefined) data.department = v.department;
  if (v.location !== undefined) data.location = v.location;
  if (v.linkedinUrl !== undefined) data.linkedin_url = v.linkedinUrl;
  if (v.notes !== undefined) data.notes = v.notes;
  if (v.tags !== undefined) data.tags = v.tags;
  if (v.isDecisionMaker !== undefined) data.is_decision_maker = v.isDecisionMaker;
  if (v.influenceLevel !== undefined) data.influence_level = v.influenceLevel;
  if (v.relationshipStrength !== undefined) data.relationship_strength = v.relationshipStrength;

  const updated = await clientContactQueries.update(params.id, data);
  if (!updated) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  try {
    const searchText = generateClientContactSearchText(updated);
    updateEntityEmbedding('client_contacts', updated.id, searchText).catch(()=>{});
  } catch {}
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await handleAuth();
  if (!authResult.isAuthenticated && authResult.response) return authResult.response;
  const ok = await clientContactQueries.delete(params.id);
  if (!ok) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}


