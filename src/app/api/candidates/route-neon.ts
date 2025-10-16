import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { mapContractType } from '@/lib/validation';
import { handleAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { updateCandidateEmbedding } from '@/lib/embeddings/neon-embeddings';

// Helper function to generate candidate rating
async function generateCandidateRating(candidate: any): Promise<number> {
  // Simple rating based on available data
  let score = 0;
  if (candidate.experience_years > 5) score += 2;
  else if (candidate.experience_years > 2) score += 1;
  
  if (candidate.technical_skills?.length > 5) score += 2;
  else if (candidate.technical_skills?.length > 3) score += 1;
  
  if (candidate.certifications?.length > 0) score += 1;
  
  return Math.min(5, score);
}

// Helper function to get score label from rating
function getScoreFromRating(rating: number): string {
  if (rating >= 4.5) return 'Very Strong';
  if (rating >= 3.5) return 'Strong';
  if (rating >= 2.5) return 'Good';
  if (rating >= 1.5) return 'Average';
  return 'Needs Review';
}

export async function GET(request: NextRequest) {
  try {
    logger.api.request('GET', '/api/candidates');
    
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      logger.api.response('GET', '/api/candidates', 401);
      return authResult.response;
    }
    
    logger.api.auth('/api/candidates', authResult.userId || undefined);

    // Parse search params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    // Build filters for search
    const filters: any = {};
    if (search) {
      // For Neon, we'll use the text search function
      filters.search = search;
    }

    // Fetch candidates from database
    logger.db.query('findMany', 'candidates');
    const candidates = await db.candidate.findMany({
      where: { archived: false },
      orderBy: { created_at: 'desc' },
    });

    logger.db.query('findMany', 'candidates', candidates.length);

    // Transform candidates for frontend
    const transformedCandidates = await Promise.all(
      candidates.map(async (candidate, index) => {
        const rating = candidate.matching_score || await generateCandidateRating(candidate);
        
        return {
          id: index + 1,
          databaseId: candidate.id,
          name: `${candidate.first_name || 'Unknown'} ${candidate.last_name || 'User'}`,
          location: candidate.current_location || 'Not specified',
          experience: `${candidate.experience_years || 0} years`,
          currentRole: candidate.current_title || 'Not specified',
          score: getScoreFromRating(rating),
          status: candidate.status || 'NEW',
          avatar: (candidate.first_name?.charAt(0) || 'U') + (candidate.last_name?.charAt(0) || 'U'),
          skills: candidate.technical_skills || [],
          rating: rating,
          email: candidate.email || 'no-email@example.com',
          phone: candidate.phone || '',
          company: 'Not specified',
          summary: candidate.summary || 'No summary available',
          education: candidate.degrees?.join(', ') || 'Not specified',
          languages: candidate.spoken_languages || [],
          availability: candidate.available_from ? new Date(candidate.available_from).toLocaleDateString() : 'Available',
          expectedSalary: candidate.expected_salary || 'Not specified',
          linkedinUrl: candidate.linkedin_url,
          portfolioUrl: candidate.portfolio_url,
          lastInteraction: candidate.created_at || new Date().toISOString(),
          source: candidate.source || 'database',
          workExperience: [],
          timeline: [
            {
              date: candidate.created_at || new Date().toISOString(),
              action: 'Candidate added',
              type: 'application',
              details: 'Added to database'
            }
          ],
          // CV file information
          originalCvUrl: candidate.original_cv_url,
          originalCvFileName: candidate.original_cv_file_name,
          // Additional fields
          freelancer: candidate.freelancer,
          remotePreference: candidate.remote_preference,
          primaryIndustry: candidate.primary_industry,
          functionalDomain: candidate.functional_domain,
          nationality: candidate.nationality,
          certifications: candidate.certifications,
          tags: candidate.tags,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: transformedCandidates,
      total: transformedCandidates.length
    });
  } catch (error) {
    console.error('❌ Database error fetching candidates:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown database error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    // Handle both JSON and FormData
    const contentType = request.headers.get('content-type');
    let body: any;
    let cvFile: File | null = null;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      cvFile = formData.get('cvFile') as File;
      
      const candidateDataString = formData.get('candidateData') as string;
      if (candidateDataString) {
        body = JSON.parse(candidateDataString);
      } else {
        body = {
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          currentTitle: formData.get('currentTitle'),
          currentLocation: formData.get('currentLocation'),
          summary: formData.get('summary'),
        };
      }
    } else {
      body = await request.json();
    }

    // Map fields to database columns
    const candidateData: any = {
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      date_of_birth: body.dateOfBirth,
      mobility_countries: body.mobilityCountries || [],
      mobility_cities: body.mobilityCities || [],
      current_title: body.currentTitle,
      current_location: body.currentLocation,
      summary: body.summary,
      experience_years: body.experienceYears ? parseInt(body.experienceYears) : null,
      technical_skills: body.technicalSkills || [],
      soft_skills: body.softSkills || [],
      spoken_languages: body.spokenLanguages || [],
      linkedin_url: body.linkedinUrl,
      github_url: body.githubUrl,
      portfolio_url: body.portfolioUrl,
      seniority_level: body.seniorityLevel,
      primary_industry: body.primaryIndustry,
      expected_salary: body.expectedSalary,
      remote_preference: body.remotePreference,
      nationality: body.nationality,
      timezone: body.timezone,
      education_level: body.educationLevel,
      universities: body.universities || [],
      degrees: body.degrees || [],
      graduation_year: body.graduationYear ? parseInt(body.graduationYear) : null,
      programming_languages: body.programmingLanguages || [],
      frameworks: body.frameworks || [],
      tools_and_platforms: body.toolsAndPlatforms || [],
      certifications: body.certifications || [],
      methodologies: body.methodologies || [],
      companies: body.companies || {},
      recruiter_notes: body.recruiterNotes || [],
      freelancer: body.freelancer || false,
      video_interview_url: body.videoInterviewUrl,
      notable_projects: body.notableProjects || [],
      functional_domain: body.functionalDomain,
      preferred_contract_type: mapContractType(body.preferredContractType) || body.preferredContractType,
      relocation_willingness: body.relocationWillingness || false,
      work_permit_type: body.workPermitType,
      available_from: body.availableFrom,
      motivational_fit_notes: body.motivationalFitNotes,
      cultural_fit_score: body.culturalFitScore,
      tags: body.tags || [],
      source: body.source || 'manual',
      referees: body.referees || {},
      conversion_status: body.conversionStatus || 'new',
      client_visible: body.clientVisible || false,
      share_with_client: body.shareWithClient || false,
      status: body.status || 'NEW',
    };

    // Create candidate
    const newCandidate = await db.candidate.create(candidateData);

    // Update embedding asynchronously
    if (process.env.OPENAI_API_KEY) {
      updateCandidateEmbedding(newCandidate.id).catch(err => {
        console.error('Failed to update candidate embedding:', err);
      });
    }

    return NextResponse.json({
      success: true,
      data: newCandidate,
      message: 'Candidate created successfully'
    });

  } catch (error: any) {
    console.error('Error creating candidate:', error);
    
    if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      return NextResponse.json({
        success: false,
        error: 'A candidate with this email already exists'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create candidate'
    }, { status: 500 });
  }
}
