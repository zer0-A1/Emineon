import { OpenAI } from 'openai';
import { pool } from '@/lib/db/neon-client';

// Initialize OpenAI client
let openai: OpenAI | null = null;

// Initialize OpenAI only if API key is available
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Unified embedding configuration
const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-large',
  dimensions: 1536,
} as const;

// Cache for embeddings to avoid redundant API calls
const embeddingCache = new Map<string, number[]>();

/**
 * Generate embedding for a text using OpenAI text-embedding-3-large
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  // Check cache first
  const cacheKey = `${EMBEDDING_CONFIG.model}:${text}`;
  const cached = embeddingCache.get(cacheKey);
  if (cached) return cached;

  // If OpenAI is not available, fail explicitly
  if (!openai) {
    throw new Error('OPENAI_API_KEY is not configured. Embedding generation is required and cannot proceed without it.');
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_CONFIG.model,
      input: text,
      dimensions: EMBEDDING_CONFIG.dimensions,
    });

    const embedding = response.data[0].embedding;
    
    // Cache the result
    embeddingCache.set(cacheKey, embedding);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Convert a vector array to PostgreSQL vector literal format
 */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.map((v) => (Number.isFinite(v) ? v.toFixed(6) : 0)).join(',')}]`;
}

/**
 * Generate comprehensive search text for candidates
 */
export function generateCandidateSearchText(candidate: any): string {
  const parts = [
    candidate.first_name,
    candidate.last_name,
    candidate.email,
    candidate.current_title,
    candidate.professional_headline,
    candidate.current_location,
    candidate.summary,
    // Personal & identity
    candidate.address,
    candidate.timezone,
    candidate.date_of_birth,
    candidate.nationality,
    // Professional metrics
    candidate.primary_industry,
    candidate.functional_domain,
    String(candidate.experience_years || ''),
    candidate.seniority_level,
    // Work preferences
    candidate.expected_salary,
    candidate.preferred_contract_type,
    candidate.freelancer ? 'freelancer' : undefined,
    candidate.remote_preference,
    candidate.relocation_willingness ? 'willing to relocate' : undefined,
    ...(candidate.mobility_countries || []),
    ...(candidate.mobility_cities || []),
    candidate.work_permit_type,
    candidate.available_from,
    candidate.notice_period,
    ...(candidate.technical_skills || []),
    ...(candidate.soft_skills || []),
    ...(candidate.programming_languages || []),
    ...(candidate.frameworks || []),
    ...(candidate.tools_and_platforms || []),
    ...(candidate.methodologies || []),
    ...(candidate.certifications || []),
    ...(candidate.spoken_languages || []),
    ...(candidate.universities || []),
    ...(candidate.degrees || []),
    ...(candidate.tags || []),
    ...(candidate.notable_projects || []),
    // Links & online presence
    candidate.linkedin_url,
    candidate.github_url,
    candidate.portfolio_url,
    candidate.personal_website,
    candidate.video_url,
    // Scoring & fit
    String(candidate.cultural_fit_score || ''),
    String(candidate.matching_score || ''),
    JSON.stringify(candidate.interview_scores || {}),
    // Notes & metadata
    ...(candidate.recruiter_notes || []),
    candidate.motivational_fit_notes,
    candidate.source,
    candidate.source_details,
    candidate.conversion_status,
    // Client visibility
    candidate.client_visible ? 'client visible' : undefined,
    candidate.share_with_client ? 'shared with client' : undefined,
    String(candidate.client_rating || ''),
    // Compliance & background
    candidate.gdpr_consent ? 'gdpr consent' : undefined,
    candidate.gdpr_consent_date,
    candidate.references_checked ? 'references checked' : undefined,
    candidate.background_check_status,
    candidate.background_check_date,
    // Documents
    candidate.original_cv_file_name,
    candidate.original_cv_url,
    candidate.original_cv_uploaded_at,
    candidate.competence_file_url,
    candidate.competence_file_uploaded_at,
    // Video
    candidate.video_title,
    candidate.video_description,
    candidate.video_thumbnail_url,
    String(candidate.video_duration || ''),
    candidate.video_uploaded_at,
    candidate.video_status,
    // System
    candidate.status,
    candidate.archived ? 'archived' : undefined,
    candidate.created_by,
    candidate.created_at,
    candidate.updated_at,
  ].filter(Boolean);

  // Add companies if they exist
  if (candidate.companies && typeof candidate.companies === 'object') {
    if (Array.isArray(candidate.companies)) {
      parts.push(...candidate.companies.map((c: any) => c.name || c).filter(Boolean));
    } else {
      parts.push(JSON.stringify(candidate.companies));
    }
  }

  return parts.join(' ');
}

/**
 * Generate comprehensive search text for jobs
 */
export function generateJobSearchText(job: any): string {
  const parts = [
    job.title,
    job.description,
    job.company,
    job.department,
    job.location,
    job.job_type,
    job.experience_level,
    job.contract_type,
    job.remote_preference,
    ...(job.locations || []),
    ...(job.requirements || []),
    ...(job.responsibilities || []),
    ...(job.nice_to_have || []),
    ...(job.benefits || []),
    ...(job.required_skills || []),
    ...(job.preferred_skills || []),
    ...(job.required_languages || []),
    ...(job.required_certifications || []),
  ].filter(Boolean);

  return parts.join(' ');
}

/**
 * Generate comprehensive search text for clients
 */
export function generateClientSearchText(client: any): string {
  const parts = [
    client.name,
    client.industry,
    client.company_size,
    client.notes,
    client.city,
    client.country,
    client.contact_person,
    ...(client.tags || []),
  ].filter(Boolean);

  return parts.join(' ');
}

/**
 * Generate comprehensive search text for client contacts
 */
export function generateClientContactSearchText(contact: any): string {
  const parts = [
    contact.name,
    contact.title,
    contact.role,
    contact.department,
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin_url,
    contact.notes,
    ...(contact.tags || []),
    contact.influence_level,
    String(contact.relationship_strength || ''),
    contact.is_decision_maker ? 'decision maker' : undefined,
  ].filter(Boolean);
  return parts.join(' ');
}

/**
 * Generate comprehensive search text for projects
 */
export function generateProjectSearchText(project: any): string {
  const parts = [
    project.name,
    project.description,
    project.client_name,
    project.notes,
    ...(project.objectives || []),
    ...(project.deliverables || []),
    ...(project.tags || []),
  ].filter(Boolean);

  return parts.join(' ');
}

/**
 * Generate comprehensive search text for competence files
 */
export function generateCompetenceFileSearchText(file: any): string {
  const parts = [
    file.file_name,
    file.template_name,
  ].filter(Boolean);

  // Add content if it exists
  if (file.content) {
    if (typeof file.content === 'string') {
      parts.push(file.content);
    } else if (typeof file.content === 'object') {
      // Extract text from JSON content structure
      const extractText = (obj: any): string[] => {
        const texts: string[] = [];
        if (typeof obj === 'string') {
          texts.push(obj);
        } else if (Array.isArray(obj)) {
          obj.forEach(item => texts.push(...extractText(item)));
        } else if (obj && typeof obj === 'object') {
          Object.values(obj).forEach(value => texts.push(...extractText(value)));
        }
        return texts;
      };
      parts.push(...extractText(file.content));
    }
  }

  return parts.join(' ');
}

/**
 * Update embeddings for a specific entity
 */
export async function updateEntityEmbedding(
  tableName: string,
  entityId: string,
  searchText: string
): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Generate embedding
    const embedding = await generateEmbedding(searchText);
    const vectorLiteral = toVectorLiteral(embedding);
    
    // Update the entity with embedding and search_text
    await client.query(
      `UPDATE ${tableName} 
       SET embedding = $1::vector, 
           search_text = $2,
           updated_at = NOW() 
       WHERE id = $3`,
      [vectorLiteral, searchText, entityId]
    );
    
    console.log(`✅ Updated embedding for ${tableName}:${entityId}`);
  } catch (error) {
    console.error(`❌ Failed to update embedding for ${tableName}:${entityId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Batch update embeddings for multiple entities
 */
export async function batchUpdateEmbeddings(
  tableName: string,
  entities: Array<{ id: string; searchText: string }>
): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const entity of entities) {
      try {
        const embedding = await generateEmbedding(entity.searchText);
        const vectorLiteral = toVectorLiteral(embedding);
        
        await client.query(
          `UPDATE ${tableName} 
           SET embedding = $1::vector, 
               search_text = $2,
               updated_at = NOW() 
           WHERE id = $3`,
          [vectorLiteral, entity.searchText, entity.id]
        );
      } catch (error) {
        console.error(`Failed to update embedding for ${entity.id}:`, error);
        // Continue with other entities
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ Batch updated ${entities.length} embeddings in ${tableName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Failed batch update for ${tableName}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Search using vector similarity
 */
export async function vectorSearch(
  tableName: string,
  queryText: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<any[]> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(queryText);
    const vectorLiteral = toVectorLiteral(queryEmbedding);
    
    // Perform vector search
    const result = await pool.query(
      `SELECT *, 
        1 - (embedding <=> $1::vector) as similarity
       FROM ${tableName}
       WHERE embedding IS NOT NULL
       AND 1 - (embedding <=> $1::vector) > $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [vectorLiteral, threshold, limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error(`Vector search error for ${tableName}:`, error);
    throw error;
  }
}

/**
 * Hybrid search combining vector and text search
 */
export async function hybridSearch(
  tableName: string,
  queryText: string,
  limit: number = 10,
  vectorWeight: number = 0.7
): Promise<any[]> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(queryText);
    const vectorLiteral = toVectorLiteral(queryEmbedding);
    
    // Perform hybrid search
    const result = await pool.query(
      `WITH vector_results AS (
        SELECT *, 
          1 - (embedding <=> $1::vector) as vector_score
        FROM ${tableName}
        WHERE embedding IS NOT NULL
      ),
      text_results AS (
        SELECT *,
          ts_rank(to_tsvector('english', search_text), plainto_tsquery('english', $2)) as text_score
        FROM ${tableName}
        WHERE search_text IS NOT NULL
        AND to_tsvector('english', search_text) @@ plainto_tsquery('english', $2)
      )
      SELECT DISTINCT ON (id) *,
        (COALESCE(vector_score, 0) * $3 + COALESCE(text_score, 0) * (1 - $3)) as combined_score
      FROM (
        SELECT * FROM vector_results
        UNION ALL
        SELECT *, 0 as vector_score FROM text_results
      ) combined
      ORDER BY id, combined_score DESC
      LIMIT $4`,
      [vectorLiteral, queryText, vectorWeight, limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error(`Hybrid search error for ${tableName}:`, error);
    throw error;
  }
}
