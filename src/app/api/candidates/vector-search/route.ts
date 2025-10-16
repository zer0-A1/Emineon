import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { searchCandidatesByVector } from '@/lib/embeddings/neon-embeddings';

export async function GET(request: NextRequest) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required',
      }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      // Fallback to regular search
      return NextResponse.redirect(
        new URL(`/api/candidates?search=${encodeURIComponent(query)}`, request.url)
      );
    }

    try {
      // Perform vector search - now returns full candidate objects
      const candidates = await searchCandidatesByVector(query, limit);

      // Transform results to match UI expectations
      const transformedResults = candidates.map((candidate, index) => ({
        // Keep all original fields
        ...candidate,
        
        // Add/override UI-specific fields
        id: index + 1,
        databaseId: candidate.id,
        
        // Name fields
        name: `${candidate.first_name || 'Unknown'} ${candidate.last_name || 'User'}`,
        firstName: candidate.first_name || 'Unknown',
        lastName: candidate.last_name || 'User',
        avatar: `${(candidate.first_name || 'U').charAt(0)}${(candidate.last_name || '').charAt(0)}`,
        
        // Professional info
        currentRole: candidate.current_title || 'Not specified',
        currentTitle: candidate.current_title,
        title: candidate.current_title,
        professionalHeadline: candidate.professional_headline,
        company: candidate.companies?.[0] || 'Not specified',
        
        // Location and experience
        location: candidate.current_location || 'Not specified',
        currentLocation: candidate.current_location,
        experience: `${candidate.experience_years || 0} years`,
        experienceYears: candidate.experience_years,
        
        // Skills
        skills: candidate.technical_skills || [],
        technicalSkills: candidate.technical_skills || [],
        softSkills: candidate.soft_skills || [],
        programmingLanguages: candidate.programming_languages || [],
        frameworks: candidate.frameworks || [],
        
        // Scoring
        rating: Math.round((candidate._score || 0) * 5 * 100) / 100,
        score: candidate._score ? 'Strong' : 'Good',
        
        // Other fields
        email: candidate.email || 'no-email@example.com',
        phone: candidate.phone || '',
        summary: candidate.summary || '',
        expectedSalary: candidate.expected_salary || 'Negotiable',
        source: candidate.source || 'Manual',
        status: candidate.status || 'Active',
        
        // Required fields that were missing
        education: candidate.education_level || candidate.degrees?.join(', ') || 'Not specified',
        languages: candidate.spoken_languages || [],
        availability: candidate.available_from ? new Date(candidate.available_from).toLocaleDateString() : 'Immediate',
        lastInteraction: candidate.updated_at ? new Date(candidate.updated_at).toLocaleDateString() : 'N/A',
        
        // Complex fields - provide empty arrays/objects if not available
        workExperience: candidate.work_experience || [],
        timeline: candidate.timeline || [],
        
        // Optional fields
        linkedinUrl: candidate.linkedin_url,
        portfolioUrl: candidate.portfolio_url,
        originalCvUrl: candidate.original_cv_url,
        originalCvFileName: candidate.original_cv_file_name,
        originalCvUploadedAt: candidate.original_cv_uploaded_at,
      }));
      
      return NextResponse.json({
        success: true,
        data: transformedResults,
        total: transformedResults.length,
        searchType: 'vector',
      });

    } catch (vectorError: any) {
      console.error('Vector search failed:', vectorError);
      
      // Fallback to regular search if vector search fails
      if (vectorError.message?.includes('API key')) {
        return NextResponse.json({
          success: false,
          error: 'OpenAI API key not configured properly',
          fallbackUrl: `/api/candidates?search=${encodeURIComponent(query)}`,
        }, { status: 500 });
      }

      throw vectorError;
    }

  } catch (error: any) {
    console.error('Error in vector search:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}
