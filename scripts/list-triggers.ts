#!/usr/bin/env tsx
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT event_object_table AS table, trigger_name, action_timing, event_manipulation, action_statement
     FROM information_schema.triggers
     WHERE trigger_schema = 'public'
     ORDER BY event_object_table, trigger_name`
  );
  for (const r of rows) {
    console.log(`${r.table} | ${r.trigger_name} | ${r.action_timing} ${r.event_manipulation}`);
    console.log(r.action_statement);
    console.log('---');
  }
}

main().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1)});


