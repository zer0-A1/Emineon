import { NextResponse } from 'next/server';
import { query } from '@/lib/db/neon-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test database connection
    const dbStart = Date.now();
    await query('SELECT 1 as test');
    const dbMs = Date.now() - dbStart;

    // Check other services
    const openAiOk = Boolean(process.env.OPENAI_API_KEY);

    return NextResponse.json({ 
      ok: true, 
      dbMs,
      services: {
        database: 'ok',
        openai: openAiOk ? 'ok' : 'missing key'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ 
      ok: false, 
      error: err?.message ?? 'Database connection error',
      services: {
        database: 'error',
        openai: Boolean(process.env.OPENAI_API_KEY) ? 'ok' : 'missing key'
      }
    }, { status: 500 });
  }
}