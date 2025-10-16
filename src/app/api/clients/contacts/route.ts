import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { clientContactQueries } from '@/lib/db/queries';
import { generateClientContactSearchText, updateEntityEmbedding } from '@/lib/embeddings/unified-embeddings';
import { z } from 'zod';

const createSchema = z.object({
  clientId: z.string().min(1),
  managerId: z.string().optional(),
  name: z.string().min(1),
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

export async function POST(request: NextRequest) {
  const authResult = await handleAuth();
  if (!authResult.isAuthenticated && authResult.response) return authResult.response;
  const body = await request.json();
  const v = createSchema.parse(body);
  const contact = await clientContactQueries.create({
    client_id: v.clientId,
    manager_id: v.managerId,
    name: v.name,
    email: v.email,
    phone: v.phone,
    title: v.title,
    role: v.role,
    department: v.department,
    location: v.location,
    linkedin_url: v.linkedinUrl,
    notes: v.notes,
    tags: v.tags,
    is_decision_maker: v.isDecisionMaker,
    influence_level: v.influenceLevel,
    relationship_strength: v.relationshipStrength,
  });
  // Update vector embedding asynchronously (fire-and-forget)
  try {
    const searchText = generateClientContactSearchText(contact);
    updateEntityEmbedding('client_contacts', contact.id, searchText).catch(()=>{});
  } catch {}
  return NextResponse.json({ success: true, data: contact }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const authResult = await handleAuth();
  if (!authResult.isAuthenticated && authResult.response) return authResult.response;
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  if (!clientId) return NextResponse.json({ success: false, error: 'clientId is required' }, { status: 400 });
  const contacts = await clientContactQueries.findByClientId(clientId);
  return NextResponse.json({ success: true, data: contacts });
}


