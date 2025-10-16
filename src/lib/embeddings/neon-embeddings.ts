import { OpenAI } from 'openai';
import * as neonClient from '@/lib/db/neon-client';
import { Candidate } from '@/lib/db/types';

const { pool, query } = neonClient;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for embeddings to avoid redundant API calls
const embeddingCache = new Map<string, number[]>();

/**
 * Generate embedding for a text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Check cache first
  const cached = embeddingCache.get(text);
  if (cached) return cached;

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large', // Best model for accuracy
      input: text,
      dimensions: 1536, // Standard dimension for text-embedding-3-large
    });

    const embedding = response.data[0].embedding;
    
    // Cache the result
    embeddingCache.set(text, embedding);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate comprehensive text from candidate data for embedding
 */
export function generateCandidateText(candidate: any): string {
  const parts = [
    // Name and basic info
    `${candidate.first_name} ${candidate.last_name}`,
    candidate.email,
    candidate.phone,
    
    // Professional
    candidate.current_title,
    candidate.professional_headline,
    candidate.current_location,
    candidate.summary,
    candidate.experience_years ? `${candidate.experience_years} years experience` : null,
    candidate.seniority_level,
    
    // Skills - handle JSONB arrays
    Array.isArray(candidate.technical_skills) ? candidate.technical_skills.join(' ') : null,
    Array.isArray(candidate.soft_skills) ? candidate.soft_skills.join(' ') : null,
    Array.isArray(candidate.programming_languages) ? candidate.programming_languages.join(' ') : null,
    Array.isArray(candidate.frameworks) ? candidate.frameworks.join(' ') : null,
    Array.isArray(candidate.tools_and_platforms) ? candidate.tools_and_platforms.join(' ') : null,
    Array.isArray(candidate.methodologies) ? candidate.methodologies.join(' ') : null,
    
    // Education
    candidate.education_level,
    Array.isArray(candidate.universities) ? candidate.universities.join(' ') : null,
    Array.isArray(candidate.degrees) ? candidate.degrees.join(' ') : null,
    candidate.graduation_year ? `graduated ${candidate.graduation_year}` : null,
    Array.isArray(candidate.certifications) ? candidate.certifications.join(' ') : null,
    
    // Work preferences
    candidate.expected_salary,
    candidate.preferred_contract_type,
    candidate.freelancer ? 'freelancer' : null,
    candidate.remote_preference,
    candidate.relocation_willingness ? 'willing to relocate' : null,
    Array.isArray(candidate.mobility_countries) ? candidate.mobility_countries.join(' ') : null,
    Array.isArray(candidate.mobility_cities) ? candidate.mobility_cities.join(' ') : null,
    candidate.work_permit_type,
    
    // Industry
    candidate.primary_industry,
    candidate.functional_domain,
    Array.isArray(candidate.notable_projects) ? candidate.notable_projects.join(' ') : null,
    
    // Personal
    candidate.nationality,
    Array.isArray(candidate.spoken_languages) ? candidate.spoken_languages.join(' ') : null,
    candidate.timezone,
    candidate.address,
    
    // URLs
    candidate.linkedin_url ? 'linkedin profile' : null,
    candidate.github_url ? 'github profile' : null,
    candidate.portfolio_url ? 'portfolio website' : null,
    
    // Notes and tags
    Array.isArray(candidate.recruiter_notes) ? candidate.recruiter_notes.join(' ') : null,
    candidate.motivational_fit_notes,
    Array.isArray(candidate.tags) ? candidate.tags.join(' ') : null,
    candidate.source,
    
    // Video metadata
    candidate.video_title,
    candidate.video_description,
  ].filter(Boolean);

  return parts.join(' | ');
}


/**
 * Search candidates using vector similarity in Neon
 */
export async function searchCandidatesByVector(
  query: string,
  limit: number = 50,
  filters?: {
    archived?: boolean;
    status?: string;
    location?: string;
    skills?: string[];
  }
): Promise<any[]> {
  console.log('[Vector Search] Starting search for:', query);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not set. Falling back to text search.');
    return searchCandidatesByText(query, limit, filters);
  }
  
  try {
    // Generate embedding for the search query
    console.log('[Vector Search] Generating embedding...');
    const queryEmbedding = await generateEmbedding(query);
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    console.log('[Vector Search] Embedding generated, dimensions:', queryEmbedding.length);
    
    // Build query with filters
    let whereClause = 'WHERE embedding IS NOT NULL';
    const params: any[] = [embeddingString, limit];
    let paramIndex = 3;
    
    if (filters?.archived !== undefined) {
      whereClause += ` AND archived = $${paramIndex}`;
      params.push(filters.archived);
      paramIndex++;
    }
    
    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters?.location) {
      whereClause += ` AND current_location ILIKE $${paramIndex}`;
      params.push(`%${filters.location}%`);
      paramIndex++;
    }
    
    // Vector similarity search with pgvector
    const searchQuery = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        current_title,
        current_location,
        professional_headline,
        experience_years,
        seniority_level,
        technical_skills,
        programming_languages,
        frameworks,
        expected_salary,
        remote_preference,
        freelancer,
        primary_industry,
        functional_domain,
        universities,
        degrees,
        certifications,
        spoken_languages,
        tags,
        source,
        status,
        created_at,
        updated_at,
        original_cv_url,
        original_cv_file_name,
        1 - (embedding <=> $1::vector) as similarity
      FROM candidates
      ${whereClause}
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `;
    
    console.log('[Vector Search] Query:', searchQuery.substring(0, 200) + '...');
    console.log('[Vector Search] Where clause:', whereClause);
    console.log('[Vector Search] Params count:', params.length);
    console.log('[Vector Search] Limit:', limit);
    console.log('[Vector Search] First param is embedding:', params[0]?.substring(0, 50) + '...');
    console.log('[Vector Search] Query function type:', typeof query);
    
    if (typeof query !== 'function') {
      console.error('[Vector Search] query is not a function, using pool.query instead');
      const res = await pool.query<Candidate & { similarity: number }>(searchQuery, params);
      const results = res.rows;
      console.log('[Vector Search] Pool query results:', results.length);
      return results.map(row => ({
        ...row,
        _score: row.similarity,
      }));
    }
    
    const results = await query<Candidate & { similarity: number }>(searchQuery, params);
    console.log('[Vector Search] Raw results from DB:', results);
    console.log('[Vector Search] Found results:', results.length);
    
    if (results.length > 0) {
      console.log('[Vector Search] First result sample:', {
        id: results[0].id,
        name: `${results[0].first_name} ${results[0].last_name}`,
        similarity: results[0].similarity
      });
    }
    
    // Return raw results - let the API handle transformation
    const mappedResults = results.map(row => ({
      ...row,
      _score: row.similarity,
    }));
    
    console.log('[Vector Search] Returning results:', mappedResults.length);
    return mappedResults;
    
  } catch (error) {
    console.error('[Vector Search] Failed, falling back to text search:', error);
    return searchCandidatesByText(query, limit, filters);
  }
}

/**
 * Fallback text search using PostgreSQL full-text search
 */
async function searchCandidatesByText(
  query: string,
  limit: number = 50,
  filters?: any
): Promise<any[]> {
  try {
    // Build search query
    let whereClause = `WHERE (
      first_name ILIKE $1 OR 
      last_name ILIKE $1 OR 
      email ILIKE $1 OR
      current_title ILIKE $1 OR
      professional_headline ILIKE $1 OR
      summary ILIKE $1 OR
      CAST(technical_skills AS TEXT) ILIKE $1 OR
      CAST(programming_languages AS TEXT) ILIKE $1 OR
      CAST(frameworks AS TEXT) ILIKE $1
    )`;
    
    const params: any[] = [`%${query}%`, limit];
    let paramIndex = 3;
    
    if (filters?.archived !== undefined) {
      whereClause += ` AND archived = $${paramIndex}`;
      params.push(filters.archived);
      paramIndex++;
    }
    
    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    const searchQuery = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        current_title,
        current_location,
        professional_headline,
        experience_years,
        technical_skills,
        programming_languages,
        frameworks,
        expected_salary,
        remote_preference,
        status,
        created_at,
        updated_at
      FROM candidates
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $2
    `;
    
    const results = await query<Candidate>(searchQuery, params);
    return results;
    
  } catch (error) {
    console.error('Text search failed:', error);
    return [];
  }
}


/**
 * Search jobs using vector similarity
 */
export async function searchJobsByVector(
  query: string,
  limit: number = 50
): Promise<any[]> {
  if (!process.env.OPENAI_API_KEY) {
    return searchJobsByText(query, limit);
  }
  
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    // For now, use text search as jobs don't have embeddings yet
    // TODO: Add job embeddings
    return searchJobsByText(query, limit);
    
  } catch (error) {
    console.error('Job vector search failed:', error);
    return searchJobsByText(query, limit);
  }
}

/**
 * Text search for jobs
 */
async function searchJobsByText(
  query: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const searchQuery = `
      SELECT 
        id,
        title,
        company,
        location,
        description,
        job_type,
        experience_level,
        salary_min,
        salary_max,
        salary_currency,
        required_skills,
        status,
        urgency,
        created_at,
        updated_at
      FROM jobs
      WHERE (
        title ILIKE $1 OR 
        company ILIKE $1 OR 
        location ILIKE $1 OR
        description ILIKE $1 OR
        CAST(required_skills AS TEXT) ILIKE $1
      )
      AND status != 'CLOSED'
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const results = await query<any>(searchQuery, [`%${query}%`, limit]);
    return results;
    
  } catch (error) {
    console.error('Job text search failed:', error);
    return [];
  }
}
