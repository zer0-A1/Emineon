import { candidateQueries, jobQueries, clientQueries, projectQueries } from '@/lib/db/queries';
import { query } from '@/lib/db/neon-client';
import { z } from 'zod';

export type RBACContext = { userId: string; role?: string | null };

export type Tool<Input, Output> = {
  name: string;
  description: string;
  inputSchema: z.ZodType<Input>;
  authorize: (ctx: RBACContext, input: Input) => Promise<boolean> | boolean;
  handler: (ctx: RBACContext, input: Input) => Promise<Output>;
};

export type ToolMap = Record<string, Tool<any, any>>;

// Helpers: role, masking, tenant scope
const elevated = (role?: string | null) => role === 'admin' || role === 'manager';
const maskEmail = (email?: string | null, role?: string | null) =>
  !email ? undefined : elevated(role) ? email : email.replace(/(^.).*(@.*$)/, '$1***$2');
const maskPhone = (phone?: string | null, role?: string | null) =>
  !phone ? undefined : elevated(role) ? phone : phone.replace(/.(?=.{2})/g, '*');

function tenantWhere(_ctx: RBACContext) {
  // If you add organization/tenant fields to tables, plug them here.
  return {} as any;
}

// Sample tools
const getCandidateById: Tool<{ id: string }, any> = {
  name: 'getCandidateById',
  description: 'Fetch a candidate by id',
  inputSchema: z.object({ id: z.string().min(1) }),
  authorize: () => true,
  handler: async (ctx, input) => {
    const candidate = await candidateQueries.findById(input.id);
    if (!candidate) throw new Error('Candidate not found');
    return {
      id: candidate.id,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      email: maskEmail(candidate.email, ctx.role),
      phone: maskPhone(candidate.phone, ctx.role),
      currentTitle: candidate.current_title,
      currentLocation: candidate.current_location,
      experienceYears: candidate.experience_years,
      skills: candidate.technical_skills,
      spokenLanguages: candidate.spoken_languages,
    };
  },
};

const searchCandidates: Tool<{ q: string; limit?: number }, any[]> = {
  name: 'searchCandidates',
  description: 'Search candidates by name/title/email',
  inputSchema: z.object({ q: z.string().min(2), limit: z.number().int().min(1).max(50).optional() }),
  authorize: () => true,
  handler: async (ctx, input) => {
    const limit = input.limit ?? 25;
    const q = input.q;
    
    // Use candidateQueries.findAll with search parameter
    const results = await candidateQueries.findAll(q);
    
    // Limit results
    const limitedResults = results.slice(0, limit);
    
    return limitedResults.map(r => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      currentTitle: r.current_title,
      email: maskEmail(r.email, ctx.role),
      phone: maskPhone(r.phone, ctx.role),
      topSkills: (r.technical_skills || []).slice(0, 5),
    }));
  },
};

const updateJob: Tool<{ id: string; data: Partial<{ title: string; status: string; description: string }> }, any> = {
  name: 'updateJob',
  description: 'Update basic job fields',
  inputSchema: z.object({
    id: z.string().min(1),
    data: z.object({ title: z.string().min(1).optional(), status: z.string().optional(), description: z.string().optional() }),
  }),
  authorize: (ctx) => ctx.role === 'admin' || ctx.role === 'manager',
  handler: async (_ctx, input) => {
    const job = await jobQueries.update(input.id, input.data);
    return job;
  },
};

const updateCompetenceSections: Tool<{ id: string; sections: any[] }, { updated: boolean }> = {
  name: 'updateCompetenceSections',
  description: 'Replace competence file sectionsConfig',
  inputSchema: z.object({ id: z.string().min(1), sections: z.array(z.any()).min(1) }),
  authorize: (ctx) => ctx.role === 'admin' || ctx.role === 'editor',
  handler: async (_ctx, input) => {
    // TODO: Implement competence file update with Neon
    // For now, return success
    return { updated: true };
  },
};

const getJobs: Tool<{ q?: string; limit?: number }, any[]> = {
  name: 'getJobs',
  description: 'List jobs with optional text search',
  inputSchema: z.object({ q: z.string().optional(), limit: z.number().int().min(1).max(100).optional() }),
  authorize: () => true,
  handler: async (ctx, input) => {
    const limit = input.limit ?? 20;
    const q = input.q?.trim();
    let jobs;
    if (q) {
      // Search with query
      const results = await query(
        `SELECT id, title, status, location, client_id, project_id, created_at 
         FROM jobs 
         WHERE (title ILIKE $1 OR location ILIKE $1 OR description ILIKE $1)
         ORDER BY created_at DESC
         LIMIT $2`,
        [`%${q}%`, limit]
      );
      jobs = results.map(j => ({
        id: j.id,
        title: j.title,
        status: j.status,
        location: j.location,
        clientId: j.client_id,
        projectId: j.project_id,
        createdAt: j.created_at
      }));
    } else {
      // Get all jobs
      const allJobs = await jobQueries.findAll();
      jobs = allJobs.slice(0, limit).map(j => ({
        id: j.id,
        title: j.title,
        status: j.status,
        location: j.location,
        clientId: j.client_id,
        projectId: j.project_id,
        createdAt: j.created_at
      }));
    }
    return jobs;
  },
};

const searchJobs: Tool<{ q: string; status?: string; limit?: number }, any[]> = {
  name: 'searchJobs',
  description: 'Search jobs by title/description/location with optional status filter',
  inputSchema: z.object({ q: z.string().min(2), status: z.string().optional(), limit: z.number().int().min(1).max(50).optional() }),
  authorize: () => true,
  handler: async (ctx, input) => {
    const limit = input.limit ?? 20;
    const q = input.q;
    
    let whereClause = `WHERE (title ILIKE $1 OR location ILIKE $1 OR description ILIKE $1)`;
    const params: any[] = [`%${q}%`];
    
    if (input.status) {
      whereClause += ` AND status = $2`;
      params.push(input.status);
    }
    
    const list = await query(
      `SELECT * FROM jobs ${whereClause} ORDER BY created_at DESC LIMIT ${limit}`,
      params
    );
    
    return list.map(j => ({
      id: j.id,
      title: j.title,
      location: j.location,
      status: j.status,
      createdAt: j.created_at
    }));
  },
};

// Cross-database search for candidates and jobs with a single query
const searchCandidatesAndJobs: Tool<{ q: string; limit?: number }, { candidates: any[]; jobs: any[] }> = {
  name: 'searchCandidatesAndJobs',
  description: 'Unified search across candidates and jobs using one natural query',
  inputSchema: z.object({ q: z.string().min(2), limit: z.number().int().min(1).max(50).optional() }),
  authorize: () => true,
  handler: async (ctx, input) => {
    const limit = input.limit ?? 10;
    const q = input.q.trim();

    // Tokenize query into terms (simple heuristic)
    const rawTerms = q.split(/[^A-Za-z0-9+]+/).map(t => t.trim()).filter(Boolean);
    const terms = Array.from(new Set(rawTerms.map(t => t.toLowerCase())));
    const capVariants = Array.from(new Set(rawTerms.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())));
    const variants = Array.from(new Set([...terms, ...capVariants, q]));

    // Detect possible location tokens (extend as needed)
    const locationLexicon = new Set([
      'zurich','geneva','lausanne','basel','bern','switzerland','remote','remoto','hybrid','onsite','on-site',
      'paris','london','berlin','madrid','barcelona','amsterdam','brussels','vienna','milan','rome'
    ]);
    const locationTokens = terms.filter(t => locationLexicon.has(t));

    // Try Algolia recall first
    try {
      const [candHits, jobHits] = await Promise.all([
        searchClient.initIndex(CANDIDATES_INDEX).search(q, { hitsPerPage: limit }).then(r => r.hits as any[]),
        searchClient.initIndex(JOBS_INDEX).search(q, { hitsPerPage: limit }).then(r => r.hits as any[]),
      ]);
      const candidateIds = (candHits || []).map(h => String(h.objectID));
      const jobIds = (jobHits || []).map(h => String(h.objectID));
      const [candRows, jobRows] = await Promise.all([
        candidateIds.length ? db.candidate.findMany({ where: { AND: [tenantWhere(ctx)], id: { in: candidateIds } }, select: { id: true, firstName: true, lastName: true, currentTitle: true, email: true, phone: true, technicalSkills: true, currentLocation: true } }) : Promise.resolve([] as any[]),
        jobIds.length ? db.job.findMany({ where: { AND: [tenantWhere(ctx)], id: { in: jobIds } }, select: { id: true, title: true, status: true, location: true, createdAt: true } }) : Promise.resolve([] as any[]),
      ]);
      if (candRows.length + jobRows.length > 0) {
        return {
          candidates: candRows.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}`.trim(), currentTitle: c.currentTitle, location: c.currentLocation, email: maskEmail(c.email, ctx.role), phone: maskPhone(c.phone, ctx.role), topSkills: (c.technicalSkills || []).slice(0, 5) })),
          jobs: jobRows,
        };
      }

      // If Algolia returned hits but we couldn't hydrate (IDs mismatch), return hits directly
      if ((candHits?.length || 0) + (jobHits?.length || 0) > 0) {
        const candFromHits = (candHits || []).slice(0, limit).map((h: any) => ({
          id: String(h.objectID),
          name: (h.fullName || `${h.firstName || ''} ${h.lastName || ''}`).trim(),
          currentTitle: h.currentTitle,
          location: h.currentLocation,
          email: maskEmail(h.email, ctx.role),
          phone: undefined as any,
          topSkills: Array.isArray(h.technicalSkills) ? h.technicalSkills.slice(0, 5) : [],
        }));
        const jobsFromHits = (jobHits || []).slice(0, limit).map((h: any) => ({
          id: String(h.objectID),
          title: h.title,
          status: h.status || 'ACTIVE',
          location: h.location,
          createdAt: h.createdAt || new Date().toISOString(),
        }));
        return { candidates: candFromHits, jobs: jobsFromHits } as any;
      }
    } catch {}

    const [candidates, jobs] = await Promise.all([
      db.candidate.findMany({
        where: {
          AND: [tenantWhere(ctx)],
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { currentTitle: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { currentLocation: { contains: q, mode: 'insensitive' } },
            { technicalSkills: { hasSome: variants } as any },
            { programmingLanguages: { hasSome: variants } as any },
            { toolsAndPlatforms: { hasSome: variants } as any },
            { tags: { hasSome: variants } as any },
            ...terms.map((t) => ({
              OR: [
                { currentTitle: { contains: t, mode: 'insensitive' } },
                { technicalSkills: { hasSome: [t] } as any },
                { programmingLanguages: { hasSome: [t] } as any },
                { toolsAndPlatforms: { hasSome: [t] } as any },
                { currentLocation: { contains: t, mode: 'insensitive' } },
              ],
            })),
          ],
        },
        take: limit,
        orderBy: { lastUpdated: 'desc' },
        select: { id: true, firstName: true, lastName: true, currentTitle: true, email: true, phone: true, technicalSkills: true, currentLocation: true },
      }),
      db.job.findMany({
        where: {
          AND: [tenantWhere(ctx)],
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
            ...terms.map((t) => ({
              OR: [
                { title: { contains: t, mode: 'insensitive' } },
                { description: { contains: t, mode: 'insensitive' } },
                { location: { contains: t, mode: 'insensitive' } },
              ],
            })),
            ...(locationTokens.length
              ? locationTokens.map((lt) => ({ location: { contains: lt, mode: 'insensitive' } }))
              : []),
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, status: true, location: true, createdAt: true },
      }),
    ]);

    return {
      candidates: candidates.map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`.trim(),
        currentTitle: c.currentTitle,
        location: c.currentLocation,
        email: maskEmail(c.email, ctx.role),
        phone: maskPhone(c.phone, ctx.role),
        topSkills: (c.technicalSkills || []).slice(0, 5),
      })),
      jobs,
    };
  },
};

const closeJob: Tool<{ id: string }, { id: string; status: string }> = {
  name: 'closeJob',
  description: 'Set a job status to CLOSED',
  inputSchema: z.object({ id: z.string().min(1) }),
  authorize: (ctx) => elevated(ctx.role),
  handler: async (_ctx, input) => {
    const job = await db.job.update({ where: { id: input.id }, data: { status: 'CLOSED' as any } });
    return { id: job.id, status: job.status as any };
  },
};

const assignCandidateToJob: Tool<{ candidateId: string; jobId: string }, { applicationId: string }> = {
  name: 'assignCandidateToJob',
  description: 'Assign a candidate to a job by creating an Application entry',
  inputSchema: z.object({ candidateId: z.string().min(1), jobId: z.string().min(1) }),
  authorize: (ctx) => elevated(ctx.role),
  handler: async (_ctx, input) => {
    const application = await db.application.create({
      data: {
        candidateId: input.candidateId,
        jobId: input.jobId,
        status: 'APPLIED' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    });
    return { applicationId: application.id };
  },
};

const getJobById: Tool<{ id: string }, any> = {
  name: 'getJobById',
  description: 'Fetch job details by id',
  inputSchema: z.object({ id: z.string().min(1) }),
  authorize: () => true,
  handler: async (ctx, input) => {
    const job = await db.job.findFirst({ where: { AND: [tenantWhere(ctx)], id: input.id } });
    if (!job) throw new Error('Job not found');
    return job;
  },
};

const getProjectById: Tool<{ id: string }, any> = {
  name: 'getProjectById',
  description: 'Fetch a project by id',
  inputSchema: z.object({ id: z.string().min(1) }),
  authorize: () => true,
  handler: async (ctx, input) => {
    const project = await db.project.findFirst({ where: { AND: [tenantWhere(ctx)], id: input.id } });
    if (!project) throw new Error('Project not found');
    return project;
  },
};

const getClientById: Tool<{ id: string }, any> = {
  name: 'getClientById',
  description: 'Fetch a client by id',
  inputSchema: z.object({ id: z.string().min(1) }),
  authorize: () => true,
  handler: async (ctx, input) => {
    const client = await db.client.findFirst({ where: { AND: [tenantWhere(ctx)], id: input.id } });
    if (!client) throw new Error('Client not found');
    return client;
  },
};

const getAssessments: Tool<{ candidateId?: string; limit?: number }, any[]> = {
  name: 'getAssessments',
  description: 'List candidate assessments with optional filter',
  inputSchema: z.object({ candidateId: z.string().optional(), limit: z.number().int().min(1).max(100).optional() }),
  authorize: () => true,
  handler: async (ctx, input) => {
    const where: any = { AND: [tenantWhere(ctx)] };
    if (input.candidateId) where.candidateId = input.candidateId;
    const list = await db.candidateAssessment.findMany({ where, orderBy: { createdAt: 'desc' }, take: input.limit ?? 20 });
    return list;
  },
};

const updateCandidateTags: Tool<{ id: string; add?: string[]; remove?: string[] }, any> = {
  name: 'updateCandidateTags',
  description: 'Add/remove tags on a candidate',
  inputSchema: z.object({ id: z.string().min(1), add: z.array(z.string().min(1)).optional(), remove: z.array(z.string().min(1)).optional() }),
  authorize: (ctx) => elevated(ctx.role),
  handler: async (_ctx, input) => {
    const cand = await db.candidate.findUnique({ where: { id: input.id } });
    if (!cand) throw new Error('Candidate not found');
    const current = new Set(cand.tags || []);
    (input.add || []).forEach(t => current.add(t));
    (input.remove || []).forEach(t => current.delete(t));
    const updated = await db.candidate.update({ where: { id: input.id }, data: { tags: Array.from(current) } });
    return { id: updated.id, tags: updated.tags };
  },
};

export function getTools(): ToolMap {
  return {
    [getCandidateById.name]: getCandidateById,
    [searchCandidates.name]: searchCandidates,
    [updateJob.name]: updateJob,
    [updateCompetenceSections.name]: updateCompetenceSections,
    [searchJobs.name]: searchJobs,
    [closeJob.name]: closeJob,
    [assignCandidateToJob.name]: assignCandidateToJob,
    [getJobById.name]: getJobById,
    [getJobs.name]: getJobs,
    [getProjectById.name]: getProjectById,
    [getClientById.name]: getClientById,
    [getAssessments.name]: getAssessments,
    [updateCandidateTags.name]: updateCandidateTags,
    // Combined cross-collection search
    [searchCandidatesAndJobs.name]: searchCandidatesAndJobs,
  };
}


