import { prisma } from '../src/lib/prisma';

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
  const [clients, jobs] = await Promise.all([
    prisma.client.findMany({ select: { id: true, name: true } }),
    prisma.job.findMany({ where: { clientId: null }, include: { project: true } })
  ]);

  const clientEntries = clients
    .map(c => ({ ...c, norm: normalize(c.name) }))
    .sort((a, b) => b.name.length - a.name.length); // prefer longer names

  let byProject = 0;
  let byText = 0;
  let skipped = 0;

  for (const job of jobs) {
    // 1) Try exact (case-insensitive) match against project.clientName
    const projName = job.project?.clientName?.trim();
    if (projName) {
      const match = clientEntries.find(c => c.name.toLowerCase() === projName.toLowerCase());
      if (match) {
        await prisma.job.update({ where: { id: job.id }, data: { clientId: match.id } });
        byProject++;
        continue;
      }
    }

    // 2) Fuzzy: look for client name substrings in job text fields
    const haystack = normalize([
      job.title,
      job.description,
      ...(job.requirements || []),
      ...(job.responsibilities || [])
    ].filter(Boolean).join(' '));

    if (!haystack) { skipped++; continue; }

    const hits: { clientId: string; name: string; score: number }[] = [];
    for (const c of clientEntries) {
      if (!c.norm || c.norm.length < 3) continue;
      if (haystack.includes(c.norm)) {
        // simple score by length of name
        hits.push({ clientId: c.id, name: c.name, score: c.norm.length });
      }
    }

    if (hits.length === 1) {
      await prisma.job.update({ where: { id: job.id }, data: { clientId: hits[0].clientId } });
      byText++;
      continue;
    }
    if (hits.length > 1) {
      // choose best by largest score (longest match)
      hits.sort((a, b) => b.score - a.score);
      await prisma.job.update({ where: { id: job.id }, data: { clientId: hits[0].clientId } });
      byText++;
      continue;
    }

    skipped++;
  }

  console.log(`Backfill complete: ${byProject} via project.clientName, ${byText} via text match, ${skipped} skipped.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


