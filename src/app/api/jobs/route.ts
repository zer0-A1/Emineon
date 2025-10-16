import { NextRequest, NextResponse } from 'next/server';
import { handleAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { jobQueries, clientQueries } from '@/lib/db/queries';
import { z } from 'zod';
import { reindexJob } from '@/lib/embeddings/reindex-service';
import { universalStorage } from '@/lib/universal-storage';

// Re-using the text extraction logic from the knowledge ingestion refactor
let DocumentAI: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DocumentAI = require('@google-cloud/documentai');
} catch (_) {
  DocumentAI = null;
}

async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType.startsWith('text/')) {
        return buffer.toString('utf-8');
    }

    const projectId = process.env.GOOGLE_PROJECT_ID as string;
    const location = process.env.GOOGLE_LOCATION as string;
    const processorId = process.env.GOOGLE_DOCAI_PROCESSOR_ID as string;

    if (!DocumentAI || !projectId || !location || !processorId) {
      console.error('Document AI is not configured, cannot extract text from file.');
      return '';
    }
    
    const { DocumentProcessorServiceClient } = DocumentAI.v1;
    const client = new DocumentProcessorServiceClient();
    const name = client.processorPath(projectId, location, processorId);
    
    const request = {
      name,
      rawDocument: {
        content: buffer.toString('base64'),
        mimeType,
      },
    } as any;
  
    const [result] = await client.processDocument(request);
    const doc = result.document;
    return (doc?.text as string) || '';
}

export const runtime = 'nodejs';

// GET /api/jobs - List all jobs
export async function GET(request: NextRequest) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');
    const search = searchParams.get('search');

    // Get all jobs with optional filters
    const jobs = await jobQueries.findAll({ 
      status: status || undefined, 
      urgency: urgency || undefined, 
      search: search || undefined 
    });
    
    // Get related data for each job
    const jobsWithRelations = await Promise.all(
      jobs.map(async (job) => {
        // Get client info if available
        let client = null;
        if (job.client_id) {
          client = await clientQueries.findById(job.client_id);
        }
        
        // Get application count
        const applications = await jobQueries.getCandidates(job.id);
        
        return {
          ...job,
          client,
          applications,
          _count: { applications: applications.length }
        };
      })
    );

    return NextResponse.json({
      success: true,
      jobs: jobsWithRelations
    });

  } catch (error) {
    logger.error('Error fetching jobs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch jobs'
    }, { status: 500 });
  }
}

// Schema for creating a job
const createJobSchema = z.object({
  // Basic fields
  title: z.string().min(1, 'Job title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(1, 'Location is required'),
  
  // Client/Project
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  
  // Job details
  jobType: z.string().optional(),
  experienceLevel: z.string().optional(),
  contractType: z.string().optional(),
  remotePreference: z.string().optional(),
  
  // Compensation
  salary: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().default('EUR'),
  
  // Requirements & Skills
  requirements: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  
  // Status
  status: z.enum(['draft', 'published', 'active']).default('draft'),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  
  // Pipeline
  pipelineStages: z.array(z.string()).default(['Applied', 'Screening', 'Interview', 'Offer', 'Hired']),
  
  // People
  hiringManagerId: z.string().optional(),
  recruiterId: z.string().optional(),
  
  // Notes
  notes: z.string().optional(),
});

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    // Handle authentication
    const authResult = await handleAuth();
    if (!authResult.isAuthenticated && authResult.response) {
      return authResult.response;
    }

    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    let file: File | null = null;

    if (contentType.includes('application/json')) {
      // Accept pure JSON requests
      body = await request.json();
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      // Accept multipart requests with optional file and fields
      const formData = await request.formData();
      file = formData.get('jobDescriptionFile') as File | null;
      const jsonData = formData.get('jsonData') as string;
      body = jsonData ? JSON.parse(jsonData) : {};
      if (!jsonData) {
        const pairs = Array.from(formData.entries());
        for (const pair of pairs) {
          const key = pair[0];
          const value = pair[1];
          if (key !== 'jobDescriptionFile') {
            try {
              body[key] = JSON.parse(value as string);
            } catch {
              body[key] = value;
            }
          }
        }
      }
    } else {
      // Unsupported content type
      return NextResponse.json({ success: false, error: 'Unsupported Content-Type' }, { status: 415 });
    }

    logger.info('Creating job with data:', body);
    
    let validatedData = createJobSchema.parse(body);
    let jobDescriptionUrl: string | undefined;
    
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // 1. Upload file to GCS
      const uploadResult = await universalStorage.uploadFile(buffer, file.name, file.type, 'jobs', {
        userId: authResult.userId || 'system-job-creation',
        description: `Job description for: ${validatedData.title}`
      });
      jobDescriptionUrl = uploadResult.url;

      // 2. If description is empty, extract text from file to populate it
      if (!validatedData.description) {
        const extractedText = await extractTextFromFile(buffer, file.type);
        if (extractedText) {
          validatedData.description = extractedText;
        }
      }
    }

    // Parse salary range if provided
    let salaryMin = validatedData.salaryMin;
    let salaryMax = validatedData.salaryMax;
    
    if (!salaryMin && !salaryMax && validatedData.salary) {
      const salaryMatch = validatedData.salary.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:[-–to]\s*(\d+(?:,\d+)*(?:\.\d+)?))?/i);
      if (salaryMatch) {
        salaryMin = parseFloat(salaryMatch[1].replace(/,/g, ''));
        if (salaryMatch[2]) {
          salaryMax = parseFloat(salaryMatch[2].replace(/,/g, ''));
        }
      }
    }

    // Map status
    const statusMap: Record<string, string> = {
      'draft': 'DRAFT',
      'published': 'PUBLISHED',
      'active': 'PUBLISHED'
    };

    // Map urgency
    const urgencyMap: Record<string, string> = {
      'low': 'LOW',
      'medium': 'MEDIUM',
      'high': 'HIGH',
      'critical': 'CRITICAL'
    };

    // Create job data matching the database schema
    const jobData: any = {
      title: validatedData.title,
      description: validatedData.description,
      location: validatedData.location,
      job_description_url: jobDescriptionUrl, // Add the GCS URL to the database record
      client_id: validatedData.clientId,
      project_id: validatedData.projectId,
      department: (validatedData as any).department, // Maintain compatibility
      contract_type: (() => {
        const ct = validatedData.contractType?.toLowerCase();
        if (ct === 'permanent' || ct === 'full-time' || ct === 'full_time') return 'FULL_TIME';
        if (ct === 'part-time' || ct === 'part_time') return 'PART_TIME';
        if (ct === 'contract') return 'CONTRACT';
        if (ct === 'freelance') return 'FREELANCE';
        if (ct === 'internship') return 'INTERNSHIP';
        if (ct === 'temporary') return 'TEMPORARY';
        return undefined;
      })(),
      remote_preference: validatedData.remotePreference?.toUpperCase(),
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: validatedData.salaryCurrency,
      requirements: [...(validatedData.requirements || []), ...(validatedData.requiredSkills || [])],
      responsibilities: validatedData.responsibilities,
      benefits: validatedData.benefits,
      nice_to_have: validatedData.preferredSkills,
      status: (statusMap[validatedData.status] || 'DRAFT') as any,
      urgency_level: urgencyMap[validatedData.urgency] || 'MEDIUM',
      pipeline_stages: validatedData.pipelineStages,
      hiring_manager: validatedData.hiringManagerId,
      internal_notes: validatedData.notes,
      published_at: validatedData.status !== 'draft' ? new Date() : undefined,
    };

    // Remove undefined values
    Object.keys(jobData).forEach(key => {
      if (jobData[key] === undefined) delete jobData[key];
    });

    // Create the job
    const job = await jobQueries.create(jobData);

    logger.info('Job created successfully:', job.id);

    // Reindex for search (non-blocking)
    if (process.env.OPENAI_API_KEY) {
      reindexJob(job.id, 'create').catch(err => {
        logger.error('Failed to index job:', err);
      });
    }

    return NextResponse.json({
      success: true,
      data: job
    }, { status: 201 });

  } catch (error: any) {
    logger.error('Error creating job:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create job'
    }, { status: 500 });
  }
}