import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { jobQueries, clientQueries, projectQueries } from '@/lib/db/queries';
import { z } from 'zod';
import { reindexJob } from '@/lib/embeddings/reindex-service';

export const runtime = 'nodejs';

// GET /api/jobs/[id] - Get job details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const jobId = params.id;
    const job = await jobQueries.findById(jobId);

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    // Get related data
    let client = null;
    let project = null;
    
    if (job.client_id) {
      client = await clientQueries.findById(job.client_id);
    }
    
    if (job.project_id) {
      project = await projectQueries.findById(job.project_id);
    }

    // Get candidates/applications for this job
    const candidates = await jobQueries.getCandidates(jobId);

    const jobWithRelations = {
      ...job,
      client,
      project,
      applications: candidates.map(c => ({
        id: c.id,
        candidateId: c.id,
        status: c.application_status,
        stage: c.stage,
        createdAt: c.applied_at,
        candidate: {
          // Basic Information
          id: c.id,
          firstName: c.first_name,
          lastName: c.last_name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          dateOfBirth: c.date_of_birth,
          nationality: c.nationality,
          spokenLanguages: c.spoken_languages,
          timezone: c.timezone,
          
          // Professional Profile
          currentTitle: c.current_title,
          professionalHeadline: c.professional_headline,
          currentLocation: c.current_location,
          summary: c.summary,
          experienceYears: c.experience_years,
          seniorityLevel: c.seniority_level,
          
          // Skills & Expertise
          technicalSkills: c.technical_skills,
          softSkills: c.soft_skills,
          programmingLanguages: c.programming_languages,
          frameworks: c.frameworks,
          toolsAndPlatforms: c.tools_and_platforms,
          methodologies: c.methodologies,
          
          // Education
          educationLevel: c.education_level,
          universities: c.universities,
          degrees: c.degrees,
          graduationYear: c.graduation_year,
          certifications: c.certifications,
          
          // Work Preferences
          expectedSalary: c.expected_salary,
          preferredContractType: c.preferred_contract_type,
          freelancer: c.freelancer,
          remotePreference: c.remote_preference,
          relocationWillingness: c.relocation_willingness,
          mobilityCountries: c.mobility_countries,
          mobilityCities: c.mobility_cities,
          workPermitType: c.work_permit_type,
          availableFrom: c.available_from,
          noticePeriod: c.notice_period,
          
          // Industry & Experience
          primaryIndustry: c.primary_industry,
          functionalDomain: c.functional_domain,
          companies: c.companies,
          notableProjects: c.notable_projects,
          
          // Online Presence
          linkedinUrl: c.linkedin_url,
          githubUrl: c.github_url,
          portfolioUrl: c.portfolio_url,
          videoInterviewUrl: c.video_interview_url,
          personalWebsite: c.personal_website,
          
          // Notes & Metadata
          recruiterNotes: c.recruiter_notes,
          motivationalFitNotes: c.motivational_fit_notes,
          culturalFitScore: c.cultural_fit_score,
          matchingScore: c.matching_score,
          interviewScores: c.interview_scores,
          
          // Additional metadata
          tags: c.tags,
          source: c.source,
          sourceDetails: c.source_details,
          conversionStatus: c.conversion_status,
          referees: c.referees,
          referencesChecked: c.references_checked,
          backgroundCheckStatus: c.background_check_status,
          backgroundCheckDate: c.background_check_date,
          
          // Document fields
          originalCvUrl: c.original_cv_url,
          originalCvFileName: c.original_cv_file_name,
          originalCvUploadedAt: c.original_cv_uploaded_at,
          competenceFileUrl: c.competence_file_url,
          competenceFileUploadedAt: c.competence_file_uploaded_at,
          
          // Video fields
          videoTitle: c.video_title,
          videoDescription: c.video_description,
          videoUrl: c.video_url,
          videoThumbnailUrl: c.video_thumbnail_url,
          videoDuration: c.video_duration,
          videoUploadedAt: c.video_uploaded_at,
          videoStatus: c.video_status,
          
          // Client visibility
          clientVisible: c.client_visible,
          shareWithClient: c.share_with_client,
          clientRating: c.client_rating,
          
          // System fields
          status: c.status,
          archived: c.archived,
          gdprConsent: c.gdpr_consent,
          gdprConsentDate: c.gdpr_consent_date,
          createdBy: c.created_by,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }
      })),
      _count: { applications: candidates.length }
    };

    return NextResponse.json({
      success: true,
      data: jobWithRelations
    });

  } catch (error) {
    logger.error('Error fetching job:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch job'
    }, { status: 500 });
  }
}

// Schema for updating a job
const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  location: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  jobType: z.string().optional(),
  experienceLevel: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived', 'closed']).optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  pipelineStages: z.array(z.string()).optional(),
  hiringManagerId: z.string().optional(),
  recruiterId: z.string().optional(),
  notes: z.string().optional(),
});

// PUT /api/jobs/[id] - Update a job
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const jobId = params.id;
    const body = await request.json();
    
    const validatedData = updateJobSchema.parse(body);

    // Map field names to database columns
    const updateData: any = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.clientId !== undefined) updateData.client_id = validatedData.clientId;
    if (validatedData.projectId !== undefined) updateData.project_id = validatedData.projectId;
    if (validatedData.jobType !== undefined) updateData.job_type = validatedData.jobType;
    if (validatedData.experienceLevel !== undefined) updateData.experience_level = validatedData.experienceLevel;
    if (validatedData.salaryMin !== undefined) updateData.salary_min = validatedData.salaryMin;
    if (validatedData.salaryMax !== undefined) updateData.salary_max = validatedData.salaryMax;
    if (validatedData.salaryCurrency !== undefined) updateData.salary_currency = validatedData.salaryCurrency;
    if (validatedData.requirements !== undefined) updateData.requirements = validatedData.requirements;
    if (validatedData.responsibilities !== undefined) updateData.responsibilities = validatedData.responsibilities;
    if (validatedData.benefits !== undefined) updateData.benefits = validatedData.benefits;
    if (validatedData.requiredSkills !== undefined) updateData.required_skills = validatedData.requiredSkills;
    if (validatedData.preferredSkills !== undefined) updateData.preferred_skills = validatedData.preferredSkills;
    if (validatedData.pipelineStages !== undefined) updateData.pipeline_stages = validatedData.pipelineStages;
    if (validatedData.hiringManagerId !== undefined) updateData.hiring_manager_id = validatedData.hiringManagerId;
    if (validatedData.recruiterId !== undefined) updateData.recruiter_id = validatedData.recruiterId;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    
    // Map status
    if (validatedData.status !== undefined) {
      const statusMap: Record<string, string> = {
        'draft': 'DRAFT',
        'published': 'PUBLISHED',
        'archived': 'ARCHIVED',
        'closed': 'CLOSED'
      };
      updateData.status = statusMap[validatedData.status] || validatedData.status.toUpperCase();
      
      // Set published_at if publishing
      if (validatedData.status === 'published' || validatedData.status === 'active') {
        updateData.published_at = new Date();
      }
    }
    
    // Map urgency
    if (validatedData.urgency !== undefined) {
      updateData.urgency_level = validatedData.urgency.toUpperCase();
    }

    // Update the job
    const updatedJob = await jobQueries.update(jobId, updateData);

    if (!updatedJob) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    // Reindex for search (non-blocking)
    if (process.env.OPENAI_API_KEY) {
      reindexJob(jobId, 'update').catch(err => {
        logger.error('Failed to reindex job:', err);
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedJob
    });

  } catch (error: any) {
    logger.error('Error updating job:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update job'
    }, { status: 500 });
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const jobId = params.id;
    
    // Check if job exists first
    const job = await jobQueries.findById(jobId);
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    // Delete the job
    const deleted = await jobQueries.delete(jobId);

    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete job'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting job:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete job'
    }, { status: 500 });
  }
}