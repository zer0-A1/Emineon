import { query } from '@/lib/db/neon-client';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { getTools } from '@/lib/copilot/registry';
import { v4 as uuidv4 } from 'uuid';
export async function GET() {
  const tools = getTools();
  return NextResponse.json({
    success: true,
    tools: Object.values(tools).map(t => ({ name: t.name, description: t.description })),
  });
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    tool: z.string().min(1),
    input: z.any(),
    idempotencyKey: z.string().min(8).max(120).optional(),
    role: z.string().optional(),
    dryRun: z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  const { tool: toolName, input, idempotencyKey, role, dryRun } = parsed.data;
  const tools = getTools();
  const tool = tools[toolName];
  if (!tool) return NextResponse.json({ success: false, error: 'Unknown tool' }, { status: 404 });

  // For now, skip idempotency check as copilot_audit table doesn't exist
  
  // Validate + authorize
  const inputParsed = tool.inputSchema.safeParse(input);
  if (!inputParsed.success) return NextResponse.json({ success: false, error: inputParsed.error.flatten() }, { status: 400 });
  const ctx = { userId, role };
  const allowed = await tool.authorize(ctx, inputParsed.data);
  if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  // Create a simple audit ID for tracking
  const auditId = uuidv4();

  if (dryRun) {
    return NextResponse.json({ success: true, dryRun: true, auditId });
  }

  try {
    const result = await tool.handler(ctx, inputParsed.data);
    return NextResponse.json({ success: true, result, auditId });
  } catch (error: any) {
    console.error('Tool execution error:', error);
    return NextResponse.json({ success: false, error: String(error?.message || error), auditId }, { status: 500 });
  }
}


