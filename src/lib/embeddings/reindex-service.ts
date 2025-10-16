import { pool, query } from '@/lib/db/neon-client';
import { generateEmbedding } from './neon-embeddings';
import { prepareCandidateTextChunks, extractDocumentText } from './chunking';
import { Candidate } from '@/lib/db/types';

export type ReindexTrigger = 
  | 'create'
  | 'update'
  | 'cv-upload'
  | 'competence-file-upload'
  | 'skill-update'
  | 'profile-update'
  | 'manual';

/**
 * Reindex a candidate when their data changes
 */
export async function reindexCandidate(
  candidateId: string, 
  trigger: ReindexTrigger,
  changedFields?: string[]
): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log(`🔄 Reindexing candidate ${candidateId} due to ${trigger}`);
    
    // Get full candidate data
    const candidateResult = await client.query(
      'SELECT * FROM candidates WHERE id = $1',
      [candidateId]
    );
    
    if (candidateResult.rows.length === 0) {
      throw new Error('Candidate not found');
    }
    
    const candidate = candidateResult.rows[0];
    
    // Extract additional content if documents are updated
    let cvContent: string | null = null;
    let competenceContent: string | null = null;
    
    if (trigger === 'cv-upload' || trigger === 'create') {
      cvContent = await extractDocumentText(candidate.original_cv_url);
    }
    
    if (trigger === 'competence-file-upload') {
      // Get latest competence file
      const competenceResult = await client.query(
        'SELECT file_url FROM competence_files WHERE candidate_id = $1 ORDER BY created_at DESC LIMIT 1',
        [candidateId]
      );
      if (competenceResult.rows.length > 0) {
        competenceContent = await extractDocumentText(competenceResult.rows[0].file_url);
      }
    }
    
    // Prepare chunks with all content
    const candidateWithContent = {
      ...candidate,
      cv_content: cvContent,
      competence_content: competenceContent,
    };
    
    const chunks = prepareCandidateTextChunks(candidateWithContent);
    
    // Generate embedding for primary searchable content
    const primaryText = chunks.map(c => c.text).join(' | ');
    const embedding = await generateEmbedding(primaryText);
    
    // Update candidate with new embedding
    await client.query(
      `UPDATE candidates 
       SET embedding = $1, 
           updated_at = NOW()
       WHERE id = $2`,
      [`[${embedding.join(',')}]`, candidateId]
    );
    
    // Log the reindex event (skip for now - activity_type enum doesn't have REINDEX value)
    // await client.query(
    //   `INSERT INTO project_activities (candidate_id, type, description, metadata)
    //    VALUES ($1, $2, $3, $4)`,
    //   [
    //     candidateId,
    //     'CANDIDATE_UPDATE',
    //     `Candidate reindexed: ${trigger}`,
    //     JSON.stringify({
    //       trigger,
    //       changedFields,
    //       timestamp: new Date().toISOString(),
    //       chunkCount: chunks.length
    //     })
    //   ]
    // );
    
    console.log(`✅ Successfully reindexed candidate ${candidateId}`);
    
  } catch (error) {
    console.error(`❌ Failed to reindex candidate ${candidateId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Batch reindex multiple candidates
 */
export async function batchReindexCandidates(
  candidateIds: string[],
  trigger: ReindexTrigger
): Promise<void> {
  console.log(`🔄 Batch reindexing ${candidateIds.length} candidates`);
  
  const results = await Promise.allSettled(
    candidateIds.map(id => reindexCandidate(id, trigger))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`✅ Batch reindex complete: ${successful} successful, ${failed} failed`);
  
  if (failed > 0) {
    const errors = results
      .filter(r => r.status === 'rejected')
      .map((r, i) => `${candidateIds[i]}: ${(r as any).reason}`);
    console.error('Failed reindexes:', errors);
  }
}

/**
 * Reindex a job when its data changes
 */
export async function reindexJob(
  jobId: string,
  action: 'create' | 'update' | 'delete'
): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log(`🔄 Reindexing job ${jobId} due to ${action}`);
    
    if (action === 'delete') {
      console.log(`Job ${jobId} deleted, skipping reindex`);
      return;
    }
    
    // Get full job data
    const jobResult = await client.query(
      'SELECT * FROM jobs WHERE id = $1',
      [jobId]
    );
    
    if (jobResult.rows.length === 0) {
      throw new Error('Job not found');
    }
    
    const job = jobResult.rows[0];
    
    // Generate comprehensive text for embedding
    const textParts = [
      job.title,
      job.description,
      job.location,
      job.job_type,
      job.experience_level,
      ...(job.requirements || []),
      ...(job.responsibilities || []),
      ...(job.benefits || []),
      ...(job.required_skills || []),
      ...(job.preferred_skills || []),
    ].filter(Boolean);
    
    const text = textParts.join(' ');
    
    // Generate embedding
    const embedding = await generateEmbedding(text);
    
    // Update job with embedding
    await client.query(
      'UPDATE jobs SET embedding = $1::vector, updated_at = NOW() WHERE id = $2',
      [`[${embedding.join(',')}]`, jobId]
    );
    
    console.log(`✅ Successfully reindexed job ${jobId}`);
    
  } catch (error) {
    console.error(`❌ Failed to reindex job ${jobId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reindex candidates based on specific criteria
 */
export async function reindexCandidatesByCriteria(
  criteria: {
    status?: string;
    updatedAfter?: Date;
    missingEmbedding?: boolean;
  },
  trigger: ReindexTrigger = 'manual'
): Promise<void> {
  const client = await pool.connect();
  
  try {
    let query = 'SELECT id FROM candidates WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (criteria.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(criteria.status);
      paramIndex++;
    }
    
    if (criteria.updatedAfter) {
      query += ` AND updated_at > $${paramIndex}`;
      params.push(criteria.updatedAfter);
      paramIndex++;
    }
    
    if (criteria.missingEmbedding) {
      query += ' AND embedding IS NULL';
    }
    
    const result = await client.query(query, params);
    const candidateIds = result.rows.map(r => r.id);
    
    if (candidateIds.length === 0) {
      console.log('No candidates found matching criteria');
      return;
    }
    
    console.log(`Found ${candidateIds.length} candidates to reindex`);
    await batchReindexCandidates(candidateIds, trigger);
    
  } finally {
    client.release();
  }
}

/**
 * Setup database triggers for automatic reindexing
 */
export async function setupReindexTriggers(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Create a function to notify about candidate changes
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_candidate_change()
      RETURNS TRIGGER AS $$
      BEGIN
        PERFORM pg_notify(
          'candidate_changed',
          json_build_object(
            'id', NEW.id,
            'operation', TG_OP,
            'changed_fields', 
            CASE 
              WHEN TG_OP = 'UPDATE' THEN
                (SELECT array_agg(key) 
                 FROM jsonb_each(to_jsonb(NEW)) n
                 JOIN jsonb_each(to_jsonb(OLD)) o ON n.key = o.key
                 WHERE n.value IS DISTINCT FROM o.value)
              ELSE NULL
            END
          )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create trigger for candidate updates
    await client.query(`
      CREATE TRIGGER candidate_change_trigger
      AFTER INSERT OR UPDATE ON candidates
      FOR EACH ROW
      EXECUTE FUNCTION notify_candidate_change();
    `);
    
    console.log('✅ Reindex triggers setup complete');
    
  } catch (error) {
    console.error('Failed to setup triggers:', error);
    // Triggers might already exist
  } finally {
    client.release();
  }
}

/**
 * Listen for candidate changes and trigger reindexing
 */
export async function startReindexListener(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('LISTEN candidate_changed');
    
    client.on('notification', async (msg) => {
      if (msg.channel === 'candidate_changed' && msg.payload) {
        try {
          const data = JSON.parse(msg.payload);
          const trigger: ReindexTrigger = data.operation === 'INSERT' ? 'create' : 'update';
          
          // Debounce rapid updates
          setTimeout(() => {
            reindexCandidate(data.id, trigger, data.changed_fields).catch(console.error);
          }, 1000);
          
        } catch (error) {
          console.error('Failed to process candidate change notification:', error);
        }
      }
    });
    
    console.log('📡 Reindex listener started');
    
  } catch (error) {
    console.error('Failed to start reindex listener:', error);
    client.release();
  }
}
