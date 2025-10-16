#!/usr/bin/env tsx
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT pg_get_functiondef(p.oid) AS def
     FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname='public' AND p.proname='sync_outbox_enqueue'`
  );
  console.log(rows[0]?.def || 'no def');
}

main().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1)});


