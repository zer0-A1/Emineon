// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { embedText } from '@/lib/ai/embeddings';

type SourceType = 'CANDIDATE' | 'JOB' | 'PROJECT' | 'CLIENT';

export interface IndexItemInput {
  sourceType: SourceType;
  sourceId: string;
  title?: string;
  text: string;
  html?: string;
  metadata?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
}

export async function upsertSearchDocument(input: IndexItemInput) {
  const embedding = await embedText(input.text);
  const doc = await db.searchDocument.upsert({
    where: { sourceType_sourceId: { sourceType: input.sourceType, sourceId: input.sourceId } },
    create: {
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      title: input.title,
      text: input.text,
      html: input.html,
      metadata: input.metadata ?? {},
      permissions: input.permissions ?? {},
      embedding,
    },
    update: {
      title: input.title,
      text: input.text,
      html: input.html,
      metadata: input.metadata ?? {},
      permissions: input.permissions ?? {},
      embedding,
    },
  });
  // Update pgvector and tsvector columns if available; ignore errors if extension not installed
  const vecLiteral = `[${embedding.join(',')}]`;
  try {
    await db.$executeRawUnsafe(
      `UPDATE search_documents
       SET embedding_vec = $1::vector,
           tsv = to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(text,''))
       WHERE id = $2`,
      vecLiteral,
      (doc as any).id,
    );
  } catch (e) {
    // Non-fatal if pgvector not installed; hybrid route will fallback
    // console.error('pgvector update failed (non-fatal):', e);
  }
  return doc;
}

export async function rebuildCoreEntitiesIndex() {
  // Candidates
  const candidates = await db.candidate.findMany({
    where: { archived: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      currentTitle: true,
      summary: true,
      technicalSkills: true,
      softSkills: true,
      frameworks: true,
      programmingLanguages: true,
      toolsAndPlatforms: true,
      professionalHeadline: true,
      nationality: true,
      spokenLanguages: true,
      primaryIndustry: true,
      tags: true,
      address: true,
      experienceYears: true,
      degrees: true,
      certifications: true,
      universities: true,
      educationLevel: true,
      graduationYear: true,
      functionalDomain: true,
      expectedSalary: true,
      timezone: true,
      workPermitType: true,
      mobilityCountries: true,
      mobilityCities: true,
      remotePreference: true,
      preferredContractType: true,
      relocationWillingness: true,
      freelancer: true,
      originalCvUrl: true,
      originalCvFileName: true,
    }
  });
  for (const c of candidates) {
    const title = `${c.firstName} ${c.lastName}${c.currentTitle ? ' - ' + c.currentTitle : ''}`.trim();
    const text = [
      c.professionalHeadline,
      c.summary,
      c.currentTitle,
      `Skills: ${(c.technicalSkills || []).join(', ')}`,
      `Soft: ${(c.softSkills || []).join(', ')}`,
      `Frameworks: ${(c.frameworks || []).join(', ')}`,
      `Languages: ${(c.programmingLanguages || []).join(', ')}`,
      `Tools: ${(c.toolsAndPlatforms || []).join(', ')}`,
      `Industry: ${c.primaryIndustry || ''}`,
      `Spoken: ${(c.spokenLanguages || []).join(', ')}`,
      `Tags: ${(c.tags || []).join(', ')}`,
      `Nationality: ${c.nationality || ''}`,
      `Address: ${c.address || ''}`,
      `Experience Years: ${c.experienceYears ?? ''}`,
      `Degrees: ${(c.degrees || []).join(', ')}`,
      `Certifications: ${(c.certifications || []).join(', ')}`,
      `Universities: ${(c.universities || []).join(', ')}`,
      `Education Level: ${c.educationLevel || ''}`,
      `Graduation Year: ${c.graduationYear ?? ''}`,
      `Functional Domain: ${c.functionalDomain || ''}`,
      `Expected Salary: ${c.expectedSalary || ''}`,
      `Timezone: ${c.timezone || ''}`,
      `Work Permit: ${c.workPermitType || ''}`,
      `Mobility Countries: ${(c.mobilityCountries || []).join(', ')}`,
      `Mobility Cities: ${(c.mobilityCities || []).join(', ')}`,
      `Remote Preference: ${c.remotePreference || ''}`,
      `Contract Type: ${c.preferredContractType || ''}`,
      `Relocation: ${c.relocationWillingness ? 'Yes' : 'No'}`,
      `Freelancer: ${c.freelancer ? 'Yes' : 'No'}`,
      `Original CV: ${c.originalCvFileName || ''}`,
    ].filter(Boolean).join('\n');
    await upsertSearchDocument({
      sourceType: 'CANDIDATE',
      sourceId: c.id,
      title,
      text,
      metadata: { entity: 'candidate', originalCvUrl: c.originalCvUrl || undefined },
    });
  }

  // Jobs
  const jobs = await db.job.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      department: true,
      location: true,
      requirements: true,
      responsibilities: true,
      benefits: true,
    }
  });
  for (const j of jobs) {
    const title = j.title;
    const text = [
      j.description,
      `Department: ${j.department}`,
      `Location: ${j.location}`,
      `Requirements: ${(j.requirements || []).join(', ')}`,
      `Responsibilities: ${(j.responsibilities || []).join(', ')}`,
      `Benefits: ${(j.benefits || []).join(', ')}`,
    ].filter(Boolean).join('\n');
    await upsertSearchDocument({
      sourceType: 'JOB',
      sourceId: j.id,
      title,
      text,
      metadata: { entity: 'job' },
    });
  }

  // Projects
  const projects = await db.project.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      clientName: true,
      industryBackground: true,
      skillsRequired: true,
      experienceRequired: true,
      languageRequirements: true,
      tags: true,
      location: true,
    }
  });
  for (const p of projects) {
    const title = `${p.name} (${p.clientName})`;
    const text = [
      p.description,
      `Client: ${p.clientName}`,
      `Industry: ${p.industryBackground || ''}`,
      `Location: ${p.location || ''}`,
      `Skills: ${(p.skillsRequired || []).join(', ')}`,
      `Experience: ${(p.experienceRequired || []).join(', ')}`,
      `Languages: ${(p.languageRequirements || []).join(', ')}`,
      `Tags: ${(p.tags || []).join(', ')}`,
    ].filter(Boolean).join('\n');
    await upsertSearchDocument({
      sourceType: 'PROJECT',
      sourceId: p.id,
      title,
      text,
      metadata: { entity: 'project' },
    });
  }

  // Clients
  const clients = await db.client.findMany({
    select: {
      id: true,
      name: true,
      industry: true,
      email: true,
      phone: true,
      address: true,
      contactPerson: true,
    }
  });
  for (const c of clients) {
    const title = c.name;
    const text = [
      `Industry: ${c.industry || ''}`,
      `Contact: ${c.contactPerson || ''}`,
      `Email: ${c.email || ''}`,
      `Phone: ${c.phone || ''}`,
      `Address: ${c.address || ''}`,
    ].filter(Boolean).join('\n');
    await upsertSearchDocument({
      sourceType: 'CLIENT',
      sourceId: c.id,
      title,
      text,
      metadata: { entity: 'client' },
    });
  }
}

// Incremental indexers
export async function indexCandidateById(candidateId: string) {
  const c = await db.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      currentTitle: true,
      summary: true,
      technicalSkills: true,
      softSkills: true,
      frameworks: true,
      programmingLanguages: true,
      toolsAndPlatforms: true,
      professionalHeadline: true,
      nationality: true,
      spokenLanguages: true,
      primaryIndustry: true,
      tags: true,
      archived: true,
      address: true,
      experienceYears: true,
      degrees: true,
      certifications: true,
      universities: true,
      educationLevel: true,
      graduationYear: true,
      functionalDomain: true,
      expectedSalary: true,
      timezone: true,
      workPermitType: true,
      mobilityCountries: true,
      mobilityCities: true,
      remotePreference: true,
      preferredContractType: true,
      relocationWillingness: true,
      freelancer: true,
      originalCvUrl: true,
      originalCvFileName: true,
    },
  });
  if (!c) return;
  if (c.archived) {
    await removeFromIndex('CANDIDATE', candidateId);
    return;
  }
  const title = `${c.firstName} ${c.lastName}${c.currentTitle ? ' - ' + c.currentTitle : ''}`.trim();
  const text = [
    c.professionalHeadline,
    c.summary,
    c.currentTitle,
    `Skills: ${(c.technicalSkills || []).join(', ')}`,
    `Soft: ${(c.softSkills || []).join(', ')}`,
    `Frameworks: ${(c.frameworks || []).join(', ')}`,
    `Languages: ${(c.programmingLanguages || []).join(', ')}`,
    `Tools: ${(c.toolsAndPlatforms || []).join(', ')}`,
    `Industry: ${c.primaryIndustry || ''}`,
    `Spoken: ${(c.spokenLanguages || []).join(', ')}`,
    `Tags: ${(c.tags || []).join(', ')}`,
    `Nationality: ${c.nationality || ''}`,
    `Address: ${c.address || ''}`,
    `Experience Years: ${c.experienceYears ?? ''}`,
    `Degrees: ${(c.degrees || []).join(', ')}`,
    `Certifications: ${(c.certifications || []).join(', ')}`,
    `Universities: ${(c.universities || []).join(', ')}`,
    `Education Level: ${c.educationLevel || ''}`,
    `Graduation Year: ${c.graduationYear ?? ''}`,
    `Functional Domain: ${c.functionalDomain || ''}`,
    `Expected Salary: ${c.expectedSalary || ''}`,
    `Timezone: ${c.timezone || ''}`,
    `Work Permit: ${c.workPermitType || ''}`,
    `Mobility Countries: ${(c.mobilityCountries || []).join(', ')}`,
    `Mobility Cities: ${(c.mobilityCities || []).join(', ')}`,
    `Remote Preference: ${c.remotePreference || ''}`,
    `Contract Type: ${c.preferredContractType || ''}`,
    `Relocation: ${c.relocationWillingness ? 'Yes' : 'No'}`,
    `Freelancer: ${c.freelancer ? 'Yes' : 'No'}`,
    `Original CV: ${c.originalCvFileName || ''}`,
  ].filter(Boolean).join('\n');
  await upsertSearchDocument({ sourceType: 'CANDIDATE', sourceId: c.id, title, text, metadata: { entity: 'candidate', originalCvUrl: c.originalCvUrl || undefined } });
}

export async function indexJobById(jobId: string) {
  const j = await db.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      description: true,
      department: true,
      location: true,
      requirements: true,
      responsibilities: true,
      benefits: true,
    },
  });
  if (!j) return;
  const title = j.title;
  const text = [
    j.description,
    `Department: ${j.department}`,
    `Location: ${j.location}`,
    `Requirements: ${(j.requirements || []).join(', ')}`,
    `Responsibilities: ${(j.responsibilities || []).join(', ')}`,
    `Benefits: ${(j.benefits || []).join(', ')}`,
  ].filter(Boolean).join('\n');
  await upsertSearchDocument({ sourceType: 'JOB', sourceId: j.id, title, text, metadata: { entity: 'job' } });
}

export async function indexProjectById(projectId: string) {
  const p = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      clientName: true,
      industryBackground: true,
      skillsRequired: true,
      experienceRequired: true,
      languageRequirements: true,
      tags: true,
      location: true,
    },
  });
  if (!p) return;
  const title = `${p.name} (${p.clientName})`;
  const text = [
    p.description,
    `Client: ${p.clientName}`,
    `Industry: ${p.industryBackground || ''}`,
    `Location: ${p.location || ''}`,
    `Skills: ${(p.skillsRequired || []).join(', ')}`,
    `Experience: ${(p.experienceRequired || []).join(', ')}`,
    `Languages: ${(p.languageRequirements || []).join(', ')}`,
    `Tags: ${(p.tags || []).join(', ')}`,
  ].filter(Boolean).join('\n');
  await upsertSearchDocument({ sourceType: 'PROJECT', sourceId: p.id, title, text, metadata: { entity: 'project' } });
}

export async function indexClientById(clientId: string) {
  const c = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, industry: true, email: true, phone: true, address: true, contactPerson: true },
  });
  if (!c) return;
  const title = c.name;
  const text = [
    `Industry: ${c.industry || ''}`,
    `Contact: ${c.contactPerson || ''}`,
    `Email: ${c.email || ''}`,
    `Phone: ${c.phone || ''}`,
    `Address: ${c.address || ''}`,
  ].filter(Boolean).join('\n');
  await upsertSearchDocument({ sourceType: 'CLIENT', sourceId: c.id, title, text, metadata: { entity: 'client' } });
}

export async function removeFromIndex(sourceType: SourceType, sourceId: string) {
  await db.searchDocument.deleteMany({ where: { sourceType, sourceId } });
}


