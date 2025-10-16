#!/usr/bin/env tsx
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function show(table: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    table
  );
  console.log(`Table ${table}:`);
  for (const r of rows) console.log(`  ${r.column_name} :: ${r.data_type}`);
}

async function main() {
  await show('sync_outbox');
  await show('candidates');
}

main().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1)});


