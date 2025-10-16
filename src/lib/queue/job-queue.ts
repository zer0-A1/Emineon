// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import Bull, { Queue, Job } from 'bull';
import { getRedisClient } from '../cache/redis-client';
import * as Sentry from '@sentry/nextjs';

const prisma = new PrismaClient();

// Job types
export enum JobType {
  CANDIDATE_ENRICHMENT = 'candidate-enrichment',
  EMAIL_NOTIFICATION = 'email-notification',
  RESUME_PARSING = 'resume-parsing',
  AI_MATCHING = 'ai-matching',
  REPORT_GENERATION = 'report-generation',
  DATA_EXPORT = 'data-export',
  SEARCH_INDEXING = 'search-indexing',
  CLEANUP_OLD_DATA = 'cleanup-old-data',
}

// Queue configuration
const defaultJobOptions = {
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
};

// Create queues
const queues: Map<JobType, Queue> = new Map();

function getQueue(jobType: JobType): Queue {
  if (!queues.has(jobType)) {
    const queue = new Bull(jobType, {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions,
    });

    queues.set(jobType, queue);
  }

  return queues.get(jobType)!;
}

// Job processors
export const jobProcessors = {
  [JobType.CANDIDATE_ENRICHMENT]: async (job: Job) => {
    const { candidateId } = job.data;
    
    try {
      const candidate = await db.candidate.findUnique({
        where: { id: candidateId },
      });

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Simulate enrichment process
      const enrichedData = {
        summary: `Experienced ${candidate.currentTitle || 'professional'} with ${candidate.experienceYears || 0} years of experience`,
        skills: candidate.technicalSkills || [],
        areasOfExpertise: deriveExpertiseAreas(candidate),
        lastUpdated: new Date(),
      };

      // Update candidate with enriched data
      await db.candidate.update({
        where: { id: candidateId },
        data: {
          professionalHeadline: enrichedData.summary,
          lastUpdated: enrichedData.lastUpdated,
        },
      });

      // Mark enrichment job as completed
      await db.enrichmentJob.update({
        where: {
          candidateId_type: {
            candidateId,
            type: 'summary',
          },
        },
        data: {
          status: 'completed',
          completedAt: new Date(),
          result: enrichedData,
        },
      });

      return enrichedData;
    } catch (error) {
      // Log error
      await db.enrichmentJob.update({
        where: {
          candidateId_type: {
            candidateId,
            type: 'summary',
          },
        },
        data: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  },

  [JobType.EMAIL_NOTIFICATION]: async (job: Job) => {
    const { to, subject, template, data } = job.data;
    
    // Here you would integrate with your email service
    console.log('Sending email:', { to, subject, template });
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { sent: true, messageId: `msg_${Date.now()}` };
  },

  [JobType.RESUME_PARSING]: async (job: Job) => {
    const { fileUrl, candidateId } = job.data;
    
    // Here you would integrate with resume parsing service
    console.log('Parsing resume:', { fileUrl, candidateId });
    
    // Simulate parsing
    const parsedData = {
      skills: ['JavaScript', 'React', 'Node.js'],
      experience: '5 years',
      education: 'Bachelor of Computer Science',
    };
    
    // Update candidate with parsed data
    if (candidateId) {
      await db.candidate.update({
        where: { id: candidateId },
        data: {
          technicalSkills: parsedData.skills,
          lastUpdated: new Date(),
        },
      });
    }
    
    return parsedData;
  },

  [JobType.AI_MATCHING]: async (job: Job) => {
    const { jobId, limit = 50 } = job.data;
    
    const jobDetails = await db.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          select: { candidateId: true },
        },
      },
    });

    if (!jobDetails) {
      throw new Error('Job not found');
    }

    // Get candidates not already applied
    const appliedCandidateIds = jobDetails.applications.map(a => a.candidateId);
    
    const candidates = await db.candidate.findMany({
      where: {
        id: { notIn: appliedCandidateIds },
        status: { in: ['NEW', 'ACTIVE'] },
      },
      take: limit,
    });

    // Calculate match scores
    const matches = candidates.map(candidate => {
      const score = calculateMatchScore(jobDetails, candidate);
      return {
        candidateId: candidate.id,
        jobId,
        score,
        reasons: generateMatchReasons(jobDetails, candidate),
      };
    });

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    return {
      jobId,
      topMatches: matches.slice(0, 10),
      totalCandidates: matches.length,
    };
  },

  [JobType.REPORT_GENERATION]: async (job: Job) => {
    const { type, filters, format = 'pdf' } = job.data;
    
    // Generate report based on type
    console.log('Generating report:', { type, filters, format });
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      reportUrl: `https://reports.example.com/${type}_${Date.now()}.${format}`,
      generatedAt: new Date(),
    };
  },

  [JobType.DATA_EXPORT]: async (job: Job) => {
    const { entityType, filters, format = 'csv' } = job.data;
    
    // Export data based on entity type
    console.log('Exporting data:', { entityType, filters, format });
    
    // Simulate data export
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      exportUrl: `https://exports.example.com/${entityType}_${Date.now()}.${format}`,
      recordCount: 1000,
      exportedAt: new Date(),
    };
  },

  [JobType.SEARCH_INDEXING]: async (job: Job) => {
    const { entityType, entityId, action = 'index' } = job.data;
    
    // Update search index
    console.log('Updating search index:', { entityType, entityId, action });
    
    // Here you would integrate with Elasticsearch or similar
    
    return {
      indexed: true,
      entityType,
      entityId,
    };
  },

  [JobType.CLEANUP_OLD_DATA]: async (job: Job) => {
    const { daysToKeep = 90 } = job.data;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Clean up old activities
    const deletedActivities = await db.projectActivity.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
    
    // Clean up old notifications
    // Add more cleanup logic as needed
    
    return {
      deletedActivities: deletedActivities.count,
      cleanedAt: new Date(),
    };
  },
};

// Helper functions
function deriveExpertiseAreas(candidate: any): string[] {
  const areas: string[] = [];
  
  if (candidate.technicalSkills?.length > 0) {
    // Derive from skills
    if (candidate.technicalSkills.some((s: string) => 
      ['React', 'Vue', 'Angular'].includes(s))) {
      areas.push('Frontend Development');
    }
    if (candidate.technicalSkills.some((s: string) => 
      ['Node.js', 'Python', 'Java'].includes(s))) {
      areas.push('Backend Development');
    }
  }
  
  return areas;
}

function calculateMatchScore(job: any, candidate: any): number {
  let score = 0;
  
  // Skill matching
  if (job.requiredSkills && candidate.technicalSkills) {
    const matchingSkills = job.requiredSkills.filter((skill: string) =>
      candidate.technicalSkills.includes(skill)
    );
    score += (matchingSkills.length / job.requiredSkills.length) * 50;
  }
  
  // Experience matching
  if (job.experienceRequired && candidate.experienceYears) {
    if (candidate.experienceYears >= job.experienceRequired) {
      score += 25;
    }
  }
  
  // Location matching
  if (job.location && candidate.currentLocation) {
    if (job.location === candidate.currentLocation) {
      score += 25;
    }
  }
  
  return Math.round(score);
}

function generateMatchReasons(job: any, candidate: any): string[] {
  const reasons: string[] = [];
  
  if (job.requiredSkills && candidate.technicalSkills) {
    const matchingSkills = job.requiredSkills.filter((skill: string) =>
      candidate.technicalSkills.includes(skill)
    );
    if (matchingSkills.length > 0) {
      reasons.push(`Matches ${matchingSkills.length} required skills`);
    }
  }
  
  if (job.experienceRequired && candidate.experienceYears) {
    if (candidate.experienceYears >= job.experienceRequired) {
      reasons.push(`Has ${candidate.experienceYears} years experience`);
    }
  }
  
  return reasons;
}

// Queue management functions
export async function addJob(
  jobType: JobType,
  data: any,
  options?: Bull.JobOptions
): Promise<Job> {
  const queue = getQueue(jobType);
  const job = await queue.add(data, options);
  
  // Log job creation
  console.log(`Job ${job.id} added to ${jobType} queue`);
  
  return job;
}

export async function getJob(jobType: JobType, jobId: string): Promise<Job | null> {
  const queue = getQueue(jobType);
  return await queue.getJob(jobId);
}

export async function getQueueStatus(jobType: JobType) {
  const queue = getQueue(jobType);
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

// Initialize queue processors
export function initializeQueues() {
  Object.entries(jobProcessors).forEach(([jobType, processor]) => {
    const queue = getQueue(jobType as JobType);
    
    queue.process(processor);
    
    // Error handling
    queue.on('error', (error) => {
      console.error(`Queue ${jobType} error:`, error);
      Sentry.captureException(error, {
        tags: { queue: jobType },
      });
    });
    
    queue.on('failed', (job, error) => {
      console.error(`Job ${job.id} in ${jobType} failed:`, error);
      Sentry.captureException(error, {
        tags: { queue: jobType, jobId: job.id },
        extra: { jobData: job.data },
      });
    });
    
    queue.on('completed', (job, result) => {
      console.log(`Job ${job.id} in ${jobType} completed`);
    });
  });
  
  console.log('All queues initialized');
}

// Cleanup function
export async function closeQueues() {
  for (const [jobType, queue] of queues.entries()) {
    await queue.close();
    console.log(`Queue ${jobType} closed`);
  }
}
