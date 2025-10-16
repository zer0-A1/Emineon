// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// Database queries handled through db import

// Validation schemas
export const CandidateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  phone: z.string().optional(),
  currentLocation: z.string().optional(),
  currentTitle: z.string().optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
  technicalSkills: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  expectedSalary: z.string().optional(),
});

export const JobSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  projectId: z.string().cuid(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED']),
  owner: z.string(),
  location: z.string().optional(),
  employmentType: z.array(z.string()).optional(),
  requiredSkills: z.array(z.string()).optional(),
  pipelineStages: z.array(z.string()).optional(),
});

export const ApplicationSchema = z.object({
  jobId: z.string().cuid(),
  candidateId: z.string().cuid(),
  status: z.enum(['PENDING', 'REVIEWING', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER_EXTENDED', 'HIRED', 'REJECTED', 'WITHDRAWN']),
  stage: z.string(),
});

export class DataIntegrityService {
  // Validate data before database operations
  static async validateCandidate(data: any): Promise<z.infer<typeof CandidateSchema>> {
    try {
      return CandidateSchema.parse(data);
    } catch (error) {
      Sentry.captureException(error, {
        extra: { invalidData: data },
      });
      throw new Error('Invalid candidate data');
    }
  }

  static async validateJob(data: any): Promise<z.infer<typeof JobSchema>> {
    try {
      return JobSchema.parse(data);
    } catch (error) {
      Sentry.captureException(error, {
        extra: { invalidData: data },
      });
      throw new Error('Invalid job data');
    }
  }

  static async validateApplication(data: any): Promise<z.infer<typeof ApplicationSchema>> {
    try {
      return ApplicationSchema.parse(data);
    } catch (error) {
      Sentry.captureException(error, {
        extra: { invalidData: data },
      });
      throw new Error('Invalid application data');
    }
  }

  // Check referential integrity
  static async checkReferentialIntegrity(): Promise<{
    orphanedApplications: number;
    orphanedActivities: number;
    duplicateApplications: number;
  }> {
    // Find applications without valid job or candidate
    const orphanedApplications = await db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Application" a
      WHERE NOT EXISTS (SELECT 1 FROM "Job" j WHERE j.id = a.job_id)
         OR NOT EXISTS (SELECT 1 FROM "Candidate" c WHERE c.id = a.candidate_id)
    `;

    // Find activities without valid project
    const orphanedActivities = await db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "ProjectActivity" pa
      WHERE NOT EXISTS (SELECT 1 FROM "Project" p WHERE p.id = pa.project_id)
    `;

    // Find duplicate applications (same candidate in same job)
    const duplicateApplications = await db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM (
        SELECT job_id, candidate_id, COUNT(*) as cnt
        FROM "Application"
        GROUP BY job_id, candidate_id
        HAVING COUNT(*) > 1
      ) duplicates
    `;

    return {
      orphanedApplications: Number(orphanedApplications[0].count),
      orphanedActivities: Number(orphanedActivities[0].count),
      duplicateApplications: Number(duplicateApplications[0].count),
    };
  }

  // Clean up orphaned records
  static async cleanupOrphanedRecords(): Promise<{
    deletedApplications: number;
    deletedActivities: number;
  }> {
    // Delete orphaned applications
    const deletedApplications = await db.$executeRaw`
      DELETE FROM "Application" a
      WHERE NOT EXISTS (SELECT 1 FROM "Job" j WHERE j.id = a.job_id)
         OR NOT EXISTS (SELECT 1 FROM "Candidate" c WHERE c.id = a.candidate_id)
    `;

    // Delete orphaned activities
    const deletedActivities = await db.$executeRaw`
      DELETE FROM "ProjectActivity" pa
      WHERE NOT EXISTS (SELECT 1 FROM "Project" p WHERE p.id = pa.project_id)
    `;

    return {
      deletedApplications,
      deletedActivities,
    };
  }

  // Ensure data consistency in transactions
  static async createApplicationWithIntegrity(
    jobId: string,
    candidateId: string,
    stage: string = 'sourced'
  ) {
    return await db.$transaction(async (tx) => {
      // Verify job exists and is active
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true, status: true, projectId: true }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      if (job.status !== 'ACTIVE') {
        throw new Error('Job is not active');
      }

      // Verify candidate exists
      const candidate = await tx.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true }
      });

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Check for existing application
      const existing = await tx.application.findFirst({
        where: { jobId, candidateId }
      });

      if (existing) {
        throw new Error('Candidate already applied to this job');
      }

      // Create application
      const application = await tx.application.create({
        data: {
          jobId,
          candidateId,
          status: 'PENDING',
          stage,
          createdAt: new Date(),
        }
      });

      // Create activity log
      await tx.projectActivity.create({
        data: {
          projectId: job.projectId,
          type: 'CANDIDATE_ADDED',
          description: `Candidate added to pipeline`,
          metadata: {
            candidateId,
            jobId,
            applicationId: application.id,
          },
          createdAt: new Date(),
        }
      });

      return application;
    });
  }

  // Move candidate with integrity checks
  static async moveCandidateStageWithIntegrity(
    applicationId: string,
    newStage: string
  ) {
    return await db.$transaction(async (tx) => {
      // Get current application
      const application = await tx.application.findUnique({
        where: { id: applicationId },
        include: { job: true }
      });

      if (!application) {
        throw new Error('Application not found');
      }

      // Validate stage exists in pipeline
      const validStages = application.job.pipelineStages || 
        ['sourced', 'screened', 'interview', 'offer', 'hired'];
      
      if (!validStages.map(s => s.toLowerCase()).includes(newStage.toLowerCase())) {
        throw new Error('Invalid stage for this job pipeline');
      }

      // Update application
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: {
          stage: newStage,
          updatedAt: new Date(),
        }
      });

      // Log activity
      await tx.projectActivity.create({
        data: {
          projectId: application.job.projectId,
          type: 'CANDIDATE_STAGE_CHANGED',
          description: `Candidate moved from ${application.stage} to ${newStage}`,
          metadata: {
            applicationId,
            oldStage: application.stage,
            newStage,
            candidateId: application.candidateId,
            jobId: application.jobId,
          },
          createdAt: new Date(),
        }
      });

      return updated;
    });
  }

  // Batch operations with integrity
  static async batchAddCandidatesToJob(
    jobId: string,
    candidateIds: string[]
  ) {
    return await db.$transaction(async (tx) => {
      // Verify job
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true, status: true, projectId: true }
      });

      if (!job || job.status !== 'ACTIVE') {
        throw new Error('Invalid or inactive job');
      }

      // Get existing applications
      const existing = await tx.application.findMany({
        where: {
          jobId,
          candidateId: { in: candidateIds }
        },
        select: { candidateId: true }
      });

      const existingCandidateIds = new Set(existing.map(a => a.candidateId));
      const newCandidateIds = candidateIds.filter(id => !existingCandidateIds.has(id));

      // Verify all new candidates exist
      const candidateCount = await tx.candidate.count({
        where: { id: { in: newCandidateIds } }
      });

      if (candidateCount !== newCandidateIds.length) {
        throw new Error('Some candidates do not exist');
      }

      // Create applications
      const applications = await tx.application.createMany({
        data: newCandidateIds.map(candidateId => ({
          jobId,
          candidateId,
          status: 'PENDING' as const,
          stage: 'sourced',
          createdAt: new Date(),
        }))
      });

      // Log activity
      await tx.projectActivity.create({
        data: {
          projectId: job.projectId,
          type: 'BULK_CANDIDATES_ADDED',
          description: `${applications.count} candidates added to job`,
          metadata: {
            jobId,
            candidateIds: newCandidateIds,
            count: applications.count,
          },
          createdAt: new Date(),
        }
      });

      return {
        added: applications.count,
        skipped: existingCandidateIds.size,
        total: candidateIds.length,
      };
    });
  }

  // Data sanitization
  static sanitizeInput(input: string): string {
    // Remove potential XSS
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }

  // Monitor data health
  static async getDataHealthMetrics() {
    const [
      totalCandidates,
      totalJobs,
      totalApplications,
      activeJobs,
      pendingApplications,
      integrityCheck
    ] = await Promise.all([
      db.candidate.count(),
      db.job.count(),
      db.application.count(),
      db.job.count({ where: { status: 'ACTIVE' } }),
      db.application.count({ where: { status: 'PENDING' } }),
      this.checkReferentialIntegrity()
    ]);

    return {
      counts: {
        totalCandidates,
        totalJobs,
        totalApplications,
        activeJobs,
        pendingApplications,
      },
      integrity: integrityCheck,
      health: {
        status: integrityCheck.orphanedApplications === 0 && 
                integrityCheck.duplicateApplications === 0 ? 'healthy' : 'needs_attention',
        lastChecked: new Date(),
      }
    };
  }
}

// Scheduled integrity checks
export async function scheduleIntegrityChecks() {
  // Run every hour
  setInterval(async () => {
    try {
      const metrics = await DataIntegrityService.getDataHealthMetrics();
      
      if (metrics.health.status === 'needs_attention') {
        Sentry.captureMessage('Data integrity issues detected', {
          level: 'warning',
          extra: metrics,
        });
        
        // Attempt cleanup
        await DataIntegrityService.cleanupOrphanedRecords();
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  }, 60 * 60 * 1000); // 1 hour
}
