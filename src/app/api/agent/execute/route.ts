// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

type ToolResult = { type: string; payload: any };

async function runDbQuery(payload: any): Promise<ToolResult> {
  const { query } = await import('@/lib/db/neon-client');
  // Very simple passthrough; in production restrict/validate
  const { table, where = {}, limit = 20 } = payload || {};
  if (!table) throw new Error('Table required');
  
  try {
    // Build a simple query - in production this should be properly parameterized
    let sql = `SELECT * FROM ${table}`;
    const conditions = Object.entries(where).map(([key, value]) => `${key} = '${value}'`);
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` LIMIT ${limit}`;
    
    const items = await query(sql);
    return { type: 'db_query', payload: { items } };
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function runSearch(payload: any): Promise<ToolResult> {
  const { query } = await import('@/lib/db/neon-client');
  const q = payload?.q ?? '';
  const limit = Math.min(Number(payload?.limit ?? 20), 100);
  
  try {
    // Simple text search across candidates
    const sql = `
      SELECT * FROM candidates 
      WHERE search_text ILIKE $1 
      LIMIT $2
    `;
    const searchTerm = `%${q}%`;
    const hits = await query(sql, [searchTerm, limit]);
    
    return { type: 'search', payload: { items: hits || [], total: hits.length || 0 } };
  } catch (err: any) {
    throw new Error(`Search error: ${err.message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Define simple tools contract
    const tools = [
      { name: 'db_query', type: 'function', input_schema: { type: 'object', additionalProperties: true } as any },
      { name: 'search_entities', type: 'function', input_schema: { type: 'object', additionalProperties: true } as any },
    ] as any;

    const plan = await openai.responses.create({
      model: process.env.OPENAI_RESPONSES_MODEL || 'gpt-4.1-mini',
      input: [
        { role: 'system', content: 'You are a planner. Choose the best tool and return structured JSON.' },
        { role: 'user', content: JSON.stringify(body || {}) },
      ],
      tools,
      tool_choice: 'auto' as any,
      temperature: 0,
    });

    const toolCall = (plan as any)?.output?.find?.((o: any) => o.type === 'tool_use') || (plan as any)?.output?.[0];

    // Fallback routing if model didn't pick a tool
    if (!toolCall) {
      if (typeof body?.query === 'string' && body.query.trim().length > 0) {
        const result = await runSearch({ q: body.query, limit: body.limit, filters: body.filters });
        return NextResponse.json({ ok: true, result });
      }
      if (body?.model) {
        const result = await runDbQuery(body);
        return NextResponse.json({ ok: true, result });
      }
      return NextResponse.json({ error: 'No tool selected' }, { status: 400 });
    }

    let result: ToolResult;
    const toolName = toolCall.name || toolCall?.tool_name;
    const toolArgs = toolCall.arguments || toolCall?.input || {};
    switch (toolName) {
      case 'db_query':
        result = await runDbQuery(toolArgs);
        break;
      case 'search_entities':
        result = await runSearch(toolArgs);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported tool' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error('/agent/execute failed', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}


