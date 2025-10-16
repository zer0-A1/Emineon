import { pool, query, getClient } from './neon-client';
import { 
  Candidate, CreateCandidate, UpdateCandidate,
  Job, CreateJob, UpdateJob,
  Client, CreateClient, UpdateClient,
  ClientContact, CreateClientContact, UpdateClientContact,
  Project, CreateProject, UpdateProject,
  Application, CreateApplication, UpdateApplication,
  Interview, CreateInterview, UpdateInterview,
  CompetenceFile, CreateCompetenceFile,
  User, UserPermission,
  Notification, CreateNotification,
  EmailTemplate, Message, TalentPool, TalentPoolCandidate,
  SavedSearch, SearchHistory, ProjectActivity,
  ClientComment, AIMatch, AIAssessment, AuditLog,
  UploadedFile, Settings
} from './types';
import { v4 as uuidv4 } from 'uuid';

// Candidate queries
export const candidateQueries = {
  async findAll(search?: string, limit?: number): Promise<Candidate[]> {
    try {
      console.log('🔍 Finding candidates with search:', search);
      
      if (search) {
        const hasLimit = typeof limit === 'number' && limit > 0;
        const sql = `SELECT * FROM candidates 
           WHERE archived = false 
             AND (first_name ILIKE $1 
               OR last_name ILIKE $1 
               OR email ILIKE $1
               OR current_title ILIKE $1
               OR current_location ILIKE $1)
           ORDER BY created_at DESC${hasLimit ? ' LIMIT $2' : ''}`;
        const params: any[] = [`%${search}%`];
        if (hasLimit) params.push(limit);
        const results = await query<Candidate>(sql, params);
        console.log(`✅ Found ${results.length} candidates with search`);
        return results;
      }
      
      const hasLimit = typeof limit === 'number' && limit > 0;
      const results = await query<Candidate>(
        `SELECT * FROM candidates WHERE archived = false ORDER BY created_at DESC${hasLimit ? ' LIMIT $1' : ''}`,
        hasLimit ? [limit] : undefined as any
      );
      console.log(`✅ Found ${results.length} candidates total`);
      return results;
    } catch (error) {
      console.error('❌ Error finding candidates:', error);
      throw error;
    }
  },

  async findByIds(ids: string[]): Promise<Candidate[]> {
    if (!ids || ids.length === 0) return [];
    try {
      // Use ANY($1) with uuid[] array parameter
      const results = await query<Candidate>(
        `SELECT * FROM candidates
         WHERE archived = false AND id = ANY($1)
         ORDER BY created_at DESC`,
        [ids]
      );
      return results;
    } catch (error) {
      console.error('❌ Error finding candidates by ids:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<Candidate | null> {
    const results = await query<Candidate>(
      'SELECT * FROM candidates WHERE id = $1',
      [id]
    );
    return results[0] || null;
  },

  async create(data: CreateCandidate): Promise<Candidate> {
    const id = uuidv4();
    const now = new Date();
    
    // Build column names and values dynamically
    const columns = ['id', 'created_at', 'updated_at'];
    const values: (string | Date)[] = [id, now, now];
    const placeholders = ['$1', '$2', '$3'];
    
    let placeholderIndex = 4;
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      columns.push(snake);
      // Allow primitive and JSON-serializable values; stringify objects/arrays
      let v: string | Date;
      if (value instanceof Date) {
        v = value as Date;
      } else if (typeof value === 'string') {
        v = value as string;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        v = String(value);
      } else if (value == null) {
        v = 'null';
      } else {
        v = JSON.stringify(value);
      }
      values.push(v);
      placeholders.push(`$${placeholderIndex}`);
      placeholderIndex++;
    }
    
    const results = await query<Candidate>(
      `INSERT INTO candidates (${columns.join(', ')}) 
       VALUES (${placeholders.join(', ')}) 
       RETURNING *`,
      values
    );
    
    return results[0];
  },

  async update(id: string, data: UpdateCandidate): Promise<Candidate | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }
    
    const updates: string[] = [];
    const values: any[] = [id, new Date()]; // id and updated_at
    let placeholderIndex = 3;
    
    for (const [key, value] of Object.entries(data)) {
      updates.push(`${key} = $${placeholderIndex}`);
      values.push(value);
      placeholderIndex++;
    }
    
    const results = await query<Candidate>(
      `UPDATE candidates 
       SET updated_at = $2, ${updates.join(', ')} 
       WHERE id = $1 
       RETURNING *`,
      values
    );
    
    return results[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const results = await query(
      'DELETE FROM candidates WHERE id = $1 RETURNING id',
      [id]
    );
    return results.length > 0;
  },

  async archive(id: string): Promise<Candidate | null> {
    const results = await query<Candidate>(
      'UPDATE candidates SET archived = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return results[0] || null;
  },

  // Get candidate with related data
  async findByIdWithRelations(id: string): Promise<any> {
    const candidate = await this.findById(id);
    if (!candidate) return null;

    // Get applications
    const applications = await query<Application>(
      `SELECT a.*, j.title as job_title, j.company as job_company 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE a.candidate_id = $1`,
      [id]
    );

    // Get competence files
    const competenceFiles = await query<CompetenceFile>(
      'SELECT * FROM competence_files WHERE candidate_id = $1 ORDER BY created_at DESC',
      [id]
    );

    // Get client comments
    const clientComments = await query<ClientComment>(
      'SELECT * FROM client_comments WHERE candidate_id = $1 ORDER BY created_at DESC',
      [id]
    );

    // Get AI matches
    const aiMatches = await query<AIMatch>(
      'SELECT * FROM ai_matches WHERE candidate_id = $1 ORDER BY match_score DESC',
      [id]
    );

    return {
      ...candidate,
      applications,
      competenceFiles,
      clientComments,
      aiMatches
    };
  }
};

// Job queries
export const jobQueries = {
  async findAll(filters?: { status?: string; urgency?: string; search?: string }): Promise<Job[]> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let placeholderIndex = 1;

    if (filters?.status) {
      whereClause += ` AND status = $${placeholderIndex}`;
      values.push(filters.status);
      placeholderIndex++;
    }

    if (filters?.urgency) {
      whereClause += ` AND urgency_level = $${placeholderIndex}`;
      values.push(filters.urgency);
      placeholderIndex++;
    }

    if (filters?.search) {
      whereClause += ` AND (title ILIKE $${placeholderIndex} OR description ILIKE $${placeholderIndex} OR company ILIKE $${placeholderIndex})`;
      values.push(`%${filters.search}%`);
      placeholderIndex++;
    }

    // Support both snake_case (production) and camelCase (some local DBs)
    try {
      // Prefer snake_case first
      return await query<Job>(
        `SELECT * FROM jobs ${whereClause} ORDER BY created_at DESC`,
        values
      );
    } catch (err: any) {
      if (err?.code === '42703') {
        // Fallback to camelCase timestamp
        return await query<Job>(
          `SELECT * FROM jobs ${whereClause} ORDER BY "createdAt" DESC`,
          values
        );
      }
      throw err;
    }
  },

  async findById(id: string): Promise<Job | null> {
    const results = await query<Job>(
      'SELECT * FROM jobs WHERE id = $1',
      [id]
    );
    return results[0] || null;
  },

  async create(data: CreateJob): Promise<Job> {
    const id = uuidv4();
    const now = new Date();
    
    const columns = ['id', 'created_at', 'updated_at'];
    const values: (string | Date)[] = [id, now, now];
    const placeholders = ['$1', '$2', '$3'];
    
    let placeholderIndex = 4;
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      columns.push(key);
      let v: string | Date;
      if (value instanceof Date) v = value as Date; else if (typeof value === 'string') v = value as string; else if (typeof value === 'number' || typeof value === 'boolean') v = String(value); else if (value == null) v = 'null'; else v = JSON.stringify(value);
      values.push(v);
      placeholders.push(`$${placeholderIndex}`);
      placeholderIndex++;
    }
    
    const results = await query<Job>(
      `INSERT INTO jobs (${columns.join(', ')}) 
       VALUES (${placeholders.join(', ')}) 
       RETURNING *`,
      values
    );
    
    return results[0];
  },

  async update(id: string, data: UpdateJob): Promise<Job | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }
    
    const updates: string[] = [];
    const values: any[] = [id, new Date()];
    let placeholderIndex = 3;
    
    for (const [key, value] of Object.entries(data)) {
      updates.push(`${key} = $${placeholderIndex}`);
      values.push(value);
      placeholderIndex++;
    }
    
    const results = await query<Job>(
      `UPDATE jobs 
       SET updated_at = $2, ${updates.join(', ')} 
       WHERE id = $1 
       RETURNING *`,
      values
    );
    
    return results[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const results = await query(
      'DELETE FROM jobs WHERE id = $1 RETURNING id',
      [id]
    );
    return results.length > 0;
  },

  async close(id: string, outcome: 'WON' | 'LOST', reason?: string): Promise<Job | null> {
    const results = await query<Job>(
      `UPDATE jobs 
       SET close_outcome = $2, close_reason = $3, closed_at = NOW(), updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [id, outcome, reason]
    );
    return results[0] || null;
  },

  // Get candidates for a job
  async getCandidates(jobId: string): Promise<any[]> {
    return query(
      `SELECT 
        c.*,
        a.stage,
        a.status as application_status,
        a.score as application_score,
        a.created_at as applied_at
       FROM applications a
       JOIN candidates c ON a.candidate_id = c.id
       WHERE a.job_id = $1
       ORDER BY a.created_at DESC`,
      [jobId]
    );
  }
};

// Application queries
export const applicationQueries = {
  async create(data: CreateApplication): Promise<Application> {
    const id = uuidv4();
    const now = new Date();
    
    const results = await query<Application>(
      `INSERT INTO applications (id, candidate_id, job_id, stage, status, source, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, data.candidate_id, data.job_id, data.stage || 'Applied', data.status || 'APPLIED', data.source || 'manual', data.notes || null, now, now]
    );
    
    return results[0];
  },

  async updateStage(candidateId: string, jobId: string, stage: string): Promise<Application | null> {
    const results = await query<Application>(
      `UPDATE applications 
       SET stage = $3, updated_at = NOW() 
       WHERE candidate_id = $1 AND job_id = $2 
       RETURNING *`,
      [candidateId, jobId, stage]
    );
    return results[0] || null;
  },

  async delete(candidateId: string, jobId: string): Promise<boolean> {
    const results = await query(
      'DELETE FROM applications WHERE candidate_id = $1 AND job_id = $2 RETURNING id',
      [candidateId, jobId]
    );
    return results.length > 0;
  }
};

// Competence file queries
export const competenceFileQueries = {
  async create(candidateId: string, fileName: string, fileUrl: string, templateName?: string): Promise<CompetenceFile> {
    const id = uuidv4();
    const now = new Date();
    
    const results = await query<CompetenceFile>(
      `INSERT INTO competence_files (id, candidate_id, file_name, file_url, template_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, candidateId, fileName, fileUrl, templateName, now, now]
    );
    
    return results[0];
  },

  async findByCandidateId(candidateId: string): Promise<CompetenceFile[]> {
    return query<CompetenceFile>(
      'SELECT * FROM competence_files WHERE candidate_id = $1 ORDER BY created_at DESC',
      [candidateId]
    );
  }
};

// Client queries
export const clientQueries = {
  async findAll(): Promise<Client[]> {
    return query<Client>('SELECT * FROM clients ORDER BY name ASC');
  },

  async findById(id: string): Promise<Client | null> {
    const results = await query<Client>('SELECT * FROM clients WHERE id = $1', [id]);
    return results[0] || null;
  },

  async create(data: CreateClient): Promise<Client> {
    const id = uuidv4();
    const now = new Date();
    
    const columns = ['id', 'created_at', 'updated_at'];
    const values = [id, now, now];
    const placeholders = ['$1', '$2', '$3'];
    
    let placeholderIndex = 4;
    for (const [key, value] of Object.entries(data)) {
      // Support both camelCase input and snake_case DB columns
      const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      columns.push(snake);
      values.push(value);
      placeholders.push(`$${placeholderIndex}`);
      placeholderIndex++;
    }
    
    const results = await query<Client>(
      `INSERT INTO clients (${columns.join(', ')}) 
       VALUES (${placeholders.join(', ')}) 
       RETURNING *`,
      values
    );
    
    return results[0];
  },

  async update(id: string, data: UpdateClient): Promise<Client | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }
    
    const updates: string[] = [];
    const values: any[] = [id, new Date()];
    let placeholderIndex = 3;
    
    for (const [key, value] of Object.entries(data)) {
      const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      updates.push(`${snake} = $${placeholderIndex}`);
      values.push(value);
      placeholderIndex++;
    }
    
    const results = await query<Client>(
      `UPDATE clients 
       SET updated_at = $2, ${updates.join(', ')} 
       WHERE id = $1 
       RETURNING *`,
      values
    );
    
    return results[0] || null;
  }
};

// Client Contacts queries
export const clientContactQueries = {
  async findByClientId(clientId: string): Promise<ClientContact[]> {
    return query<ClientContact>(
      'SELECT * FROM client_contacts WHERE client_id = $1 ORDER BY created_at DESC',
      [clientId]
    );
  },

  async create(data: CreateClientContact): Promise<ClientContact> {
    const id = uuidv4();
    const now = new Date();
    const columns = ['id', 'created_at', 'updated_at'];
    const values = [id, now, now];
    const placeholders = ['$1', '$2', '$3'];
    let idx = 4;
    for (const [key, value] of Object.entries(data)) {
      const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      columns.push(snake);
      values.push(value as any);
      placeholders.push(`$${idx}`);
      idx++;
    }
    const results = await query<ClientContact>(
      `INSERT INTO client_contacts (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    return results[0];
  },

  async update(id: string, data: UpdateClientContact): Promise<ClientContact | null> {
    if (Object.keys(data).length === 0) {
      const rows = await query<ClientContact>('SELECT * FROM client_contacts WHERE id = $1', [id]);
      return rows[0] || null;
    }
    const updates: string[] = [];
    const values: any[] = [id, new Date()];
    let idx = 3;
    for (const [key, value] of Object.entries(data)) {
      const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      updates.push(`${snake} = $${idx}`);
      values.push(value as any);
      idx++;
    }
    const results = await query<ClientContact>(
      `UPDATE client_contacts SET updated_at = $2, ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    return results[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const results = await query('DELETE FROM client_contacts WHERE id = $1 RETURNING id', [id]);
    return results.length > 0;
  }
};

// Project queries
export const projectQueries = {
  async findAll(filters?: { status?: string; client_id?: string }): Promise<Project[]> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let placeholderIndex = 1;

    if (filters?.status) {
      whereClause += ` AND status = $${placeholderIndex}`;
      values.push(filters.status);
      placeholderIndex++;
    }

    if (filters?.client_id) {
      whereClause += ` AND client_id = $${placeholderIndex}`;
      values.push(filters.client_id);
      placeholderIndex++;
    }

    return query<Project>(
      `SELECT * FROM projects ${whereClause} ORDER BY "createdAt" DESC`,
      values
    );
  },

  async findById(id: string): Promise<Project | null> {
    const results = await query<Project>('SELECT * FROM projects WHERE id = $1', [id]);
    return results[0] || null;
  },

  async create(data: CreateProject): Promise<Project> {
    const id = uuidv4();
    const now = new Date();
    
    const columns = ['id', 'created_at', 'updated_at'];
    const values = [id, now, now];
    const placeholders = ['$1', '$2', '$3'];
    
    let placeholderIndex = 4;
    for (const [key, value] of Object.entries(data)) {
      const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      columns.push(snake);
      values.push(value as any);
      placeholders.push(`$${placeholderIndex}`);
      placeholderIndex++;
    }
    
    const results = await query<Project>(
      `INSERT INTO projects (${columns.join(', ')}) 
       VALUES (${placeholders.join(', ')}) 
       RETURNING *`,
      values
    );
    
    return results[0];
  },

  async update(id: string, data: UpdateProject): Promise<Project | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }
    
    const updates: string[] = [];
    const values: any[] = [id, new Date()];
    let placeholderIndex = 3;
    
    for (const [key, value] of Object.entries(data)) {
      const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      updates.push(`${snake} = $${placeholderIndex}`);
      values.push(value as any);
      placeholderIndex++;
    }
    
    const results = await query<Project>(
      `UPDATE projects 
       SET updated_at = $2, ${updates.join(', ')} 
       WHERE id = $1 
       RETURNING *`,
      values
    );
    
    return results[0] || null;
  },

  // Get all jobs for a project
  async getJobs(projectId: string): Promise<Job[]> {
    try {
      return await query<Job>(
        'SELECT * FROM jobs WHERE project_id = $1 ORDER BY created_at DESC',
        [projectId]
      );
    } catch (err: any) {
      if (err?.code === '42703') {
        return await query<Job>(
          'SELECT * FROM jobs WHERE project_id = $1 ORDER BY "createdAt" DESC',
          [projectId]
        );
      }
      throw err;
    }
  }
};

// Interview queries
export const interviewQueries = {
  async create(data: CreateInterview): Promise<Interview> {
    const id = uuidv4();
    const now = new Date();
    
    const columns = ['id', 'created_at', 'updated_at'];
    const values = [id, now, now];
    const placeholders = ['$1', '$2', '$3'];
    
    let placeholderIndex = 4;
    for (const [key, value] of Object.entries(data)) {
      columns.push(key);
      values.push(value);
      placeholders.push(`$${placeholderIndex}`);
      placeholderIndex++;
    }
    
    const results = await query<Interview>(
      `INSERT INTO interviews (${columns.join(', ')}) 
       VALUES (${placeholders.join(', ')}) 
       RETURNING *`,
      values
    );
    
    return results[0];
  },

  async findByApplicationId(applicationId: string): Promise<Interview[]> {
    return query<Interview>(
      'SELECT * FROM interviews WHERE application_id = $1 ORDER BY interview_date DESC',
      [applicationId]
    );
  },

  async update(id: string, data: UpdateInterview): Promise<Interview | null> {
    if (Object.keys(data).length === 0) {
      const results = await query<Interview>('SELECT * FROM interviews WHERE id = $1', [id]);
      return results[0] || null;
    }
    
    const updates: string[] = [];
    const values: any[] = [id, new Date()];
    let placeholderIndex = 3;
    
    for (const [key, value] of Object.entries(data)) {
      updates.push(`${key} = $${placeholderIndex}`);
      values.push(value);
      placeholderIndex++;
    }
    
    const results = await query<Interview>(
      `UPDATE interviews 
       SET updated_at = $2, ${updates.join(', ')} 
       WHERE id = $1 
       RETURNING *`,
      values
    );
    
    return results[0] || null;
  }
};

// User queries
export const userQueries = {
  async findById(id: string): Promise<User | null> {
    const results = await query<User>('SELECT * FROM users WHERE id = $1', [id]);
    return results[0] || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const results = await query<User>('SELECT * FROM users WHERE email = $1', [email]);
    return results[0] || null;
  },

  async create(data: { id: string; email: string; name?: string; image?: string; role?: string }): Promise<User> {
    const now = new Date();
    const results = await query<User>(
      `INSERT INTO users (id, email, name, image, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET 
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         image = EXCLUDED.image,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [data.id, data.email, data.name, data.image, data.role || 'RECRUITER', now, now]
    );
    return results[0];
  }
};

// Notification queries
export const notificationQueries = {
  async create(data: CreateNotification): Promise<Notification> {
    const id = uuidv4();
    const now = new Date();
    
    const results = await query<Notification>(
      `INSERT INTO notifications (id, user_id, type, title, message, link, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, data.user_id, data.type, data.title, data.message, data.link, data.status || 'UNREAD', now, now]
    );
    
    return results[0];
  },

  async findByUserId(userId: string, status?: string): Promise<Notification[]> {
    if (status) {
      return query<Notification>(
        'SELECT * FROM notifications WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
        [userId, status]
      );
    }
    return query<Notification>(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
  },

  async markAsRead(id: string): Promise<Notification | null> {
    const results = await query<Notification>(
      'UPDATE notifications SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, 'READ']
    );
    return results[0] || null;
  }
};

// AI Match queries
export const aiMatchQueries = {
  async upsert(candidateId: string, jobId: string, matchScore: number, explanation?: string): Promise<AIMatch> {
    const id = uuidv4();
    const now = new Date();
    
    const results = await query<AIMatch>(
      `INSERT INTO ai_matches (id, candidate_id, job_id, match_score, explanation, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (candidate_id, job_id) DO UPDATE SET
         match_score = EXCLUDED.match_score,
         explanation = EXCLUDED.explanation,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [id, candidateId, jobId, matchScore, explanation, now, now]
    );
    
    return results[0];
  },

  async findByJobId(jobId: string): Promise<AIMatch[]> {
    return query<AIMatch>(
      'SELECT * FROM ai_matches WHERE job_id = $1 ORDER BY match_score DESC',
      [jobId]
    );
  }
};

// Export all queries as a single db object for compatibility
export const db = {
  candidate: candidateQueries,
  job: jobQueries,
  client: clientQueries,
  clientContact: clientContactQueries,
  project: projectQueries,
  application: applicationQueries,
  interview: interviewQueries,
  competenceFile: competenceFileQueries,
  user: userQueries,
  notification: notificationQueries,
  aiMatch: aiMatchQueries,
  
  // Convenience methods for backward compatibility
  getAllCandidates: candidateQueries.findAll,
  getCandidateById: candidateQueries.findById,
  createCandidate: candidateQueries.create,
  updateCandidate: candidateQueries.update,
  deleteCandidate: candidateQueries.delete,
};