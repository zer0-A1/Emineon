// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authResult = await handleAuth();
  if (!authResult.isAuthenticated && authResult.response) return authResult.response;
  try {
    const db = await db.$queryRawUnsafe(`SELECT current_database() AS db, version() AS ver`);
    const reg = await db.$queryRawUnsafe(`SELECT to_regclass('public.search_documents')::text AS regclass`);
    const tables = await db.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    const envSet = process.env.DATABASE_URL ? 'set' : 'unset';

    const dbRow = Array.isArray(db) ? db[0] : db as any;
    const regRow = Array.isArray(reg) ? reg[0] : reg as any;
    const tableList = Array.isArray(tables) ? tables.map((r: any) => r.table_name) : [];

    return NextResponse.json({
      database: dbRow?.db,
      version: dbRow?.ver,
      hasSearchDocuments: !!regRow?.regclass,
      regclass: regRow?.regclass,
      tables: tableList,
      databaseUrlEnv: envSet,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'debug failed' }, { status: 500 });
  }
}


