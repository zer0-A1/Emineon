import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { candidateQueries } from '@/lib/db/queries';
import { handleAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { reindexCandidate } from '@/lib/embeddings/reindex-service';
import { uploadFileToVercelBlob } from '@/lib/vercel-blob';
import { FileTypeUtils } from '@/lib/universal-storage';
import { v4 as uuidv4 } from 'uuid';
import { CandidatesRepo } from '@/lib/data/repos/candidates.repo';
import { mapContractType, mapEducationLevel } from '@/lib/validation';

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
  console.log('🎯 GET /api/candidates - Request received');
  
  try {
    logger.api.request('GET', '/api/candidates');
    
    // Handle authentication (strict in production, relaxed in dev)
    if (process.env.NODE_ENV === 'production') {
      console.log('🔐 Checking authentication (production)...');
      const authResult = await handleAuth();
      if (!authResult.isAuthenticated && authResult.response) {
        console.log('❌ Authentication failed');
        logger.api.response('GET', '/api/candidates', 401);
        return authResult.response;
      }
      console.log('✅ Authentication passed:', authResult.userId);
      logger.api.auth('/api/candidates', authResult.userId || undefined);
    } else {
      console.log('🧪 Dev mode: skipping strict auth for /api/candidates');
    }

    // Parse search params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const idsParam = searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
    const limitParam = parseInt(searchParams.get('limit') || '0', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 1000 ? limitParam : 300;
    console.log('🔍 Search param:', search);

    // Build filters for search
    const filters: any = {};
    if (search) {
      // For Neon, we'll use the text search function
      filters.search = search;
    }

    // Fetch candidates from database
    console.log('📊 Fetching candidates from database...');
    logger.db.query('findMany', 'candidates');
    const candidates = await CandidatesRepo.list({
      ids: ids.length > 0 ? ids : undefined,
      search: ids.length === 0 ? search || undefined : undefined,
      limit,
      offset: 0,
      sort: 'createdAt',
      order: 'desc',
    });

    console.log(`✅ Found ${candidates.length} candidates in database`);
    logger.db.query('findMany', 'candidates', candidates.length);

    // Transform candidates for frontend
    const transformedCandidates = candidates.slice(0, limit).map((c, index) => ({
      id: index + 1,
      databaseId: c.id,
      name: `${c.firstName || 'Unknown'} ${c.lastName || 'User'}`.trim(),
      avatar: `${(c.firstName || 'U').charAt(0)}${(c.lastName || 'U').charAt(0)}`,
      experience: `${c.experienceYears || 0} years`,
      score: getScoreFromRating((c.matchingScore ?? 0)),
      ...c,
    }));

    console.log(`✅ Returning ${transformedCandidates.length} transformed candidates`);
    
    return NextResponse.json({
      success: true,
      data: transformedCandidates,
      total: transformedCandidates.length
    });
  } catch (error) {
    console.error('❌ Database error fetching candidates:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
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

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: firstName, lastName, and email are required'
      }, { status: 400 });
    }

    // Map ALL fields from frontend to database columns - COMPREHENSIVE
    const candidateData: any = {
      // 📋 Basic Information
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email?.toLowerCase().trim(),
      phone: body.phone,
      
      // 💼 Professional Profile  
      current_title: body.currentTitle,
      professional_headline: body.professionalHeadline,
      current_location: body.currentLocation,
      summary: body.summary,
      experience_years: body.experienceYears ? parseInt(body.experienceYears.toString()) : null,
      seniority_level: body.seniorityLevel,
      
      // 🛠 Skills & Expertise (ALL 6 CATEGORIES!)
      technical_skills: body.technicalSkills || [],
      soft_skills: body.softSkills || [],
      programming_languages: body.programmingLanguages || [],
      frameworks: body.frameworks || [],
      tools_and_platforms: body.toolsAndPlatforms || [],
      methodologies: body.methodologies || [],
      
      // 🎓 Education
      education_level: mapEducationLevel(body.educationLevel) || body.educationLevel,
      universities: body.universities || [],
      degrees: body.degrees || [],
      graduation_year: body.graduationYear ? parseInt(body.graduationYear.toString()) : null,
      certifications: body.certifications || [],
      
      // 💰 Work Preferences
      expected_salary: body.expectedSalary,
      preferred_contract_type: mapContractType(body.preferredContractType) || body.preferredContractType,
      freelancer: body.freelancer === true || body.freelancer === 'true',
      remote_preference: body.remotePreference,
      relocation_willingness: body.relocationWillingness === true || body.relocationWillingness === 'true',
      mobility_countries: body.mobilityCountries || [],
      mobility_cities: body.mobilityCities || [],
      work_permit_type: body.workPermitType,
      available_from: body.availableFrom ? new Date(body.availableFrom) : null,
      notice_period: body.noticePeriod,
      
      // 🏢 Industry & Experience
      primary_industry: body.primaryIndustry,
      functional_domain: body.functionalDomain,
      companies: body.companies || body.pastCompanies || null, // JSONB - accepts both field names
      notable_projects: body.notableProjects || [],
      
      // 🌍 Personal Details
      nationality: body.nationality,
      spoken_languages: body.spokenLanguages || [],
      timezone: body.timezone,
      address: body.address,
      date_of_birth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      
      // 🔗 Online Presence
      linkedin_url: body.linkedinUrl,
      github_url: body.githubUrl,
      portfolio_url: body.portfolioUrl,
      video_interview_url: body.videoInterviewUrl,
      personal_website: body.personalWebsite,
      
      // 📝 Notes & Metadata
      recruiter_notes: body.recruiterNotes || [],
      motivational_fit_notes: body.motivationalFitNotes,
      cultural_fit_score: body.culturalFitScore ? parseInt(body.culturalFitScore.toString()) : null,
      tags: body.tags || [],
      source: body.source || 'manual',
      source_details: body.sourceDetails || null, // JSONB
      referees: body.referees || body.references || null, // JSONB - accepts both field names
      references_checked: body.referencesChecked === true || body.referencesChecked === 'true',
      
      // 📄 Document Content (these will be populated when files are uploaded)
      original_cv_url: body.originalCvUrl || body.cvUrl,
      original_cv_file_name: body.originalCvFileName || body.cvFileName,
      original_cv_uploaded_at: body.originalCvUploadedAt ? new Date(body.originalCvUploadedAt) : null,
      competence_file_url: body.competenceFileUrl,
      competence_file_uploaded_at: body.competenceFileUploadedAt ? new Date(body.competenceFileUploadedAt) : null,
      
      // Video fields (part of Online Presence)
      video_title: body.videoTitle,
      video_description: body.videoDescription,
      video_url: body.videoUrl,
      video_thumbnail_url: body.videoThumbnailUrl,
      video_duration: body.videoDuration ? parseInt(body.videoDuration.toString()) : null,
      video_uploaded_at: body.videoUploadedAt ? new Date(body.videoUploadedAt) : null,
      video_status: body.videoStatus,
      
      // Additional fields for AI and matching
      matching_score: body.matchingScore ? parseInt(body.matchingScore.toString()) : null,
      interview_scores: body.interviewScores || null, // JSONB
      conversion_status: body.conversionStatus || 'NEW',
      
      // Client visibility settings
      client_visible: body.clientVisible === true || body.clientVisible === 'true',
      share_with_client: body.shareWithClient === true || body.shareWithClient === 'true',
      client_rating: body.clientRating ? parseInt(body.clientRating.toString()) : null,
      
      // Background check
      background_check_status: body.backgroundCheckStatus,
      background_check_date: body.backgroundCheckDate ? new Date(body.backgroundCheckDate) : null,
      
      // System fields
      status: body.status || 'active',
      archived: false,
      gdpr_consent: body.gdprConsent !== false, // Default true unless explicitly false
      gdpr_consent_date: body.gdprConsentDate ? new Date(body.gdprConsentDate) : new Date(),
    };

    // Filter out undefined/null values to avoid SQL errors
    const cleanedData = Object.fromEntries(
      Object.entries(candidateData).filter(([_, value]) => value !== undefined)
    );

    // Create candidate
    const newCandidate = await candidateQueries.create(cleanedData);

    // If a CV file was uploaded with the form, store it in blob and attach to candidate
    if (cvFile) {
      try {
        const buffer = Buffer.from(await cvFile.arrayBuffer());
        const uploadRes = await FileTypeUtils.uploadCV(buffer, cvFile.name || 'cv.pdf', newCandidate.id, authResult.userId || 'system');
        await candidateQueries.update(newCandidate.id, {
          original_cv_url: uploadRes.url,
          original_cv_file_name: cvFile.name || 'cv.pdf',
          original_cv_uploaded_at: new Date(),
        });
      } catch (e) {
        console.error('Failed to upload and attach CV file:', e);
      }
    }

    // Reindex candidate asynchronously
    if (process.env.OPENAI_API_KEY) {
      reindexCandidate(newCandidate.id, 'create').catch(err => {
        console.error('Failed to reindex candidate:', err);
      });
    }

    // Ensure we return the latest candidate state (including CV fields if uploaded)
    let candidateToReturn = newCandidate;
    try {
      candidateToReturn = await candidateQueries.findById(newCandidate.id);
    } catch (e) {
      console.warn('Could not refetch candidate after creation, returning initial object.');
    }

    return NextResponse.json({
      success: true,
      data: candidateToReturn,
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
