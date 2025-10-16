import { query } from '@/lib/db/neon-client';
import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { generateEmbedding } from '@/lib/embeddings/neon-embeddings';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const authResult = await handleAuth();
  if (!authResult.isAuthenticated && authResult.response) {
    return authResult.response;
  }
  
  try {
    const body = await req.json();
    const { query: searchQuery, sourceTypes, limit = 20 } = body as {
      query: string;
      sourceTypes?: ('CANDIDATE' | 'JOB' | 'PROJECT' | 'CLIENT')[];
      limit?: number;
    };
    
    if (!searchQuery || typeof searchQuery !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('🔍 AI Search called with query:', searchQuery);
    console.log('Source types:', sourceTypes);

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(searchQuery);
    const vecLiteral = `[${queryEmbedding.join(',')}]`;

    let results: any[] = [];

    // Search based on source types
    if (!sourceTypes || sourceTypes.length === 0 || sourceTypes.includes('CANDIDATE')) {
      // Prefer vector search, fallback to text search
      try {
        const candidateResults = await query(
          `SELECT 
            id,
            first_name,
            last_name,
            email,
            current_title,
            current_location,
            summary,
            1 - (embedding <=> $1::vector) as similarity,
            'CANDIDATE' as source_type
          FROM candidates
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> $1::vector
          LIMIT $2`,
          [vecLiteral, limit]
        );

        results.push(...candidateResults.map(r => ({
          id: r.id,
          sourceType: 'CANDIDATE',
          sourceId: r.id,
          title: `${r.first_name} ${r.last_name} - ${r.current_title || 'Candidate'}`,
          snippet: r.summary || `${r.current_title} at ${r.current_location}`,
          metadata: {
            email: r.email,
            location: r.current_location
          },
          score: r.similarity,
          vecScore: r.similarity,
          lexScore: 0
        })));
      } catch {
        const candidateText = await query(
          `SELECT 
            id,
            first_name,
            last_name,
            email,
            current_title,
            current_location,
            summary,
            'CANDIDATE' as source_type
          FROM candidates
          WHERE (
            first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR
            current_title ILIKE $1 OR summary ILIKE $1 OR current_location ILIKE $1
          )
          LIMIT $2`,
          [`%${searchQuery}%`, limit]
        );

        results.push(...candidateText.map(r => ({
          id: r.id,
          sourceType: 'CANDIDATE',
          sourceId: r.id,
          title: `${r.first_name} ${r.last_name} - ${r.current_title || 'Candidate'}`,
          snippet: r.summary || `${r.current_title} at ${r.current_location}`,
          metadata: { email: r.email, location: r.current_location },
          score: 0.5,
          vecScore: 0,
          lexScore: 0.5,
        })));
      }
    }

    if (!sourceTypes || sourceTypes.length === 0 || sourceTypes.includes('JOB')) {
      // Prefer vector search, fallback to text search
      try {
        const jobResults = await query(
          `SELECT 
            id,
            title,
            description,
            location,
            status,
            1 - (embedding <=> $1::vector) as similarity,
            'JOB' as source_type
          FROM jobs
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> $1::vector
          LIMIT $2`,
          [vecLiteral, limit]
        );

        results.push(...jobResults.map(r => ({
          id: r.id,
          sourceType: 'JOB',
          sourceId: r.id,
          title: `${r.title} - ${r.location}`,
          snippet: r.description ? r.description.substring(0, 400) : '',
          metadata: { status: r.status, location: r.location },
          score: r.similarity,
          vecScore: r.similarity,
          lexScore: 0,
        })));
      } catch {
        const jobText = await query(
          `SELECT 
            id,
            title,
            description,
            location,
            status,
            'JOB' as source_type
          FROM jobs
          WHERE (
            title ILIKE $1 OR location ILIKE $1 OR description ILIKE $1
          )
          AND status != 'CLOSED'
          LIMIT $2`,
          [`%${searchQuery}%`, limit]
        );
        results.push(...jobText.map(r => ({
          id: r.id,
          sourceType: 'JOB',
          sourceId: r.id,
          title: `${r.title} - ${r.location}`,
          snippet: r.description ? r.description.substring(0, 400) : '',
          metadata: { status: r.status, location: r.location },
          score: 0.5,
          vecScore: 0,
          lexScore: 0.5,
        })));
      }
    }

    if (!sourceTypes || sourceTypes.length === 0 || sourceTypes.includes('PROJECT')) {
      // Prefer vector search for projects, fallback to text search
      try {
        const projectVec = await query(
          `SELECT 
            id,
            name,
            description,
            status,
            1 - (embedding <=> $1::vector) as similarity,
            'PROJECT' as source_type
          FROM projects
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> $1::vector
          LIMIT $2`,
          [vecLiteral, limit]
        );

        results.push(...projectVec.map(r => ({
          id: r.id,
          sourceType: 'PROJECT',
          sourceId: r.id,
          title: r.name,
          snippet: r.description || '',
          metadata: { status: r.status },
          score: r.similarity,
          vecScore: r.similarity,
          lexScore: 0,
        })));
      } catch {
        const projectText = await query(
          `SELECT 
            id,
            name,
            description,
            status,
            'PROJECT' as source_type
          FROM projects
          WHERE name ILIKE $1 OR description ILIKE $1
          LIMIT $2`,
          [`%${searchQuery}%`, limit]
        );
        results.push(...projectText.map(r => ({
          id: r.id,
          sourceType: 'PROJECT',
          sourceId: r.id,
          title: r.name,
          snippet: r.description || '',
          metadata: { status: r.status },
          score: 0.5,
          vecScore: 0,
          lexScore: 0.5,
        })));
      }
    }

    if (!sourceTypes || sourceTypes.length === 0 || sourceTypes.includes('CLIENT')) {
      // Prefer vector search for clients, fallback to text search
      try {
        const clientVec = await query(
          `SELECT 
            id,
            name,
            industry,
            website,
            1 - (embedding <=> $1::vector) as similarity,
            'CLIENT' as source_type
          FROM clients
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> $1::vector
          LIMIT $2`,
          [vecLiteral, limit]
        );

        results.push(...clientVec.map(r => ({
          id: r.id,
          sourceType: 'CLIENT',
          sourceId: r.id,
          title: r.name,
          snippet: r.industry || '',
          metadata: { website: r.website },
          score: r.similarity,
          vecScore: r.similarity,
          lexScore: 0,
        })));
      } catch {
        const clientText = await query(
          `SELECT 
            id,
            name,
            industry,
            website,
            'CLIENT' as source_type
          FROM clients
          WHERE name ILIKE $1 OR industry ILIKE $1
          LIMIT $2`,
          [`%${searchQuery}%`, limit]
        );
        results.push(...clientText.map(r => ({
          id: r.id,
          sourceType: 'CLIENT',
          sourceId: r.id,
          title: r.name,
          snippet: r.industry || '',
          metadata: { website: r.website },
          score: 0.5,
          vecScore: 0,
          lexScore: 0.5,
        })));
      }
    }

    // Sort all results by score
    results.sort((a, b) => b.score - a.score);

    // Limit to requested number
    results = results.slice(0, limit);

    console.log(`✅ AI Search returning ${results.length} results`);

    return NextResponse.json({
      data: results
    });

  } catch (err: any) {
    console.error('AI search error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


