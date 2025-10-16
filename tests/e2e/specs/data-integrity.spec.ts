import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { createTestUser, cleanupTestData, seedTestCandidates, seedTestJobs } from '../helpers/test-user-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

test.describe('Database Integrity and Consistency Tests', () => {
  let testUserId: string;
  let testClientId: string;
  let testProjectId: string;

  test.beforeAll(async () => {
    testUserId = process.env.TEST_USER_ID || 'test-user-playwright';
    testClientId = process.env.TEST_CLIENT_ID || '';
    testProjectId = process.env.TEST_PROJECT_ID || '';
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.describe('Referential Integrity', () => {
    test('should maintain foreign key constraints', async () => {
      // Test that we cannot create orphaned records
      
      // Verify job requires valid project
      try {
        await prisma.job.create({
          data: {
            title: 'Orphaned Job',
            description: 'This should fail',
            projectId: 'non-existent-project-id',
            status: 'ACTIVE',
            owner: testUserId,
          }
        });
        throw new Error('Should have failed with foreign key constraint');
      } catch (error: any) {
        expect(error.code).toBe('P2003'); // Foreign key constraint failed
      }

      // Verify application requires valid job and candidate
      try {
        await prisma.application.create({
          data: {
            jobId: 'non-existent-job',
            candidateId: 'non-existent-candidate',
            status: 'PENDING',
            stage: 'sourced',
          }
        });
        throw new Error('Should have failed with foreign key constraint');
      } catch (error: any) {
        expect(error.code).toBe('P2003');
      }
    });

    test('should cascade deletes properly', async () => {
      // Create a project with jobs and applications
      const project = await prisma.project.create({
        data: {
          name: 'Cascade Test Project',
          clientId: testClientId,
          clientName: 'Test Client',
          status: 'ACTIVE',
          description: 'Testing cascade deletes',
          totalPositions: 1,
        }
      });

      const job = await prisma.job.create({
        data: {
          title: 'Cascade Test Job',
          description: 'Testing cascade',
          projectId: project.id,
          status: 'ACTIVE',
          owner: testUserId,
        }
      });

      const candidate = await prisma.candidate.create({
        data: {
          email: `cascade-test-${Date.now()}@example.com`,
          firstName: 'Cascade',
          lastName: 'Test',
          lastUpdated: new Date(),
        }
      });

      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          status: 'PENDING',
          stage: 'sourced',
        }
      });

      // Delete the job - application should be cascade deleted
      await prisma.job.delete({ where: { id: job.id } });

      // Verify application was deleted
      const deletedApp = await prisma.application.findUnique({
        where: { id: application.id }
      });
      expect(deletedApp).toBeNull();

      // Verify candidate still exists
      const stillExists = await prisma.candidate.findUnique({
        where: { id: candidate.id }
      });
      expect(stillExists).not.toBeNull();

      // Cleanup
      await prisma.candidate.delete({ where: { id: candidate.id } });
      await prisma.project.delete({ where: { id: project.id } });
    });
  });

  test.describe('Data Consistency', () => {
    test('should maintain consistent status transitions', async () => {
      const job = await prisma.job.create({
        data: {
          title: 'Status Test Job',
          description: 'Testing status consistency',
          projectId: testProjectId,
          status: 'DRAFT',
          owner: testUserId,
        }
      });

      // Valid transitions
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'ACTIVE' }
      });

      const activeJob = await prisma.job.findUnique({ where: { id: job.id } });
      expect(activeJob?.status).toBe('ACTIVE');

      // Close job with outcome
      await prisma.job.update({
        where: { id: job.id },
        data: { 
          status: 'CLOSED',
          closeOutcome: 'WON',
          closeReason: 'Candidate Hired',
          closedAt: new Date()
        }
      });

      const closedJob = await prisma.job.findUnique({ where: { id: job.id } });
      expect(closedJob?.status).toBe('CLOSED');
      expect(closedJob?.closeOutcome).toBe('WON');
      expect(closedJob?.closedAt).not.toBeNull();

      // Cleanup
      await prisma.job.delete({ where: { id: job.id } });
    });

    test('should maintain application stage consistency', async () => {
      const job = await prisma.job.create({
        data: {
          title: 'Stage Test Job',
          description: 'Testing stage consistency',
          projectId: testProjectId,
          status: 'ACTIVE',
          owner: testUserId,
          pipelineStages: ['Sourced', 'Screened', 'Interview', 'Offer', 'Hired'],
        }
      });

      const candidate = await prisma.candidate.create({
        data: {
          email: `stage-test-${Date.now()}@example.com`,
          firstName: 'Stage',
          lastName: 'Test',
          lastUpdated: new Date(),
        }
      });

      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          status: 'PENDING',
          stage: 'sourced',
        }
      });

      // Update to valid stages
      const validStages = ['sourced', 'screened', 'interview', 'offer', 'hired'];
      for (const stage of validStages) {
        await prisma.application.update({
          where: { id: application.id },
          data: { stage }
        });

        const updated = await prisma.application.findUnique({
          where: { id: application.id }
        });
        expect(updated?.stage).toBe(stage);
      }

      // Cleanup
      await prisma.application.delete({ where: { id: application.id } });
      await prisma.candidate.delete({ where: { id: candidate.id } });
      await prisma.job.delete({ where: { id: job.id } });
    });
  });

  test.describe('Data Validation', () => {
    test('should enforce email uniqueness for candidates', async () => {
      const email = `unique-test-${Date.now()}@example.com`;
      
      await prisma.candidate.create({
        data: {
          email,
          firstName: 'First',
          lastName: 'Candidate',
          lastUpdated: new Date(),
        }
      });

      // Try to create another with same email
      try {
        await prisma.candidate.create({
          data: {
            email,
            firstName: 'Second',
            lastName: 'Candidate',
            lastUpdated: new Date(),
          }
        });
        throw new Error('Should have failed with unique constraint');
      } catch (error: any) {
        expect(error.code).toBe('P2002'); // Unique constraint failed
      }

      // Cleanup
      await prisma.candidate.delete({ where: { email } });
    });

    test('should enforce required fields', async () => {
      // Test job creation without required fields
      try {
        await prisma.job.create({
          data: {
            title: 'Missing Fields Job',
            // Missing required: description, projectId, status, owner
          } as any
        });
        throw new Error('Should have failed with required field validation');
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }

      // Test candidate creation without required fields
      try {
        await prisma.candidate.create({
          data: {
            firstName: 'Missing Email',
            // Missing required: email, lastUpdated
          } as any
        });
        throw new Error('Should have failed with required field validation');
      } catch (error: any) {
        expect(error.code).toBeDefined();
      }
    });
  });

  test.describe('Transaction Integrity', () => {
    test('should rollback on transaction failure', async () => {
      const candidateEmail = `transaction-test-${Date.now()}@example.com`;
      
      try {
        await prisma.$transaction(async (tx) => {
          // Create a candidate
          const candidate = await tx.candidate.create({
            data: {
              email: candidateEmail,
              firstName: 'Transaction',
              lastName: 'Test',
              lastUpdated: new Date(),
            }
          });

          // Create a job
          const job = await tx.job.create({
            data: {
              title: 'Transaction Test Job',
              description: 'Testing transactions',
              projectId: testProjectId,
              status: 'ACTIVE',
              owner: testUserId,
            }
          });

          // Try to create an invalid application (force failure)
          await tx.application.create({
            data: {
              jobId: job.id,
              candidateId: candidate.id,
              status: 'INVALID_STATUS' as any, // This should fail
              stage: 'sourced',
            }
          });
        });
      } catch (error) {
        // Transaction should have rolled back
      }

      // Verify candidate was not created
      const candidate = await prisma.candidate.findUnique({
        where: { email: candidateEmail }
      });
      expect(candidate).toBeNull();
    });
  });

  test.describe('Data Aggregation and Counts', () => {
    test('should maintain accurate counts', async () => {
      // Create job with applications
      const job = await prisma.job.create({
        data: {
          title: 'Count Test Job',
          description: 'Testing counts',
          projectId: testProjectId,
          status: 'ACTIVE',
          owner: testUserId,
        }
      });

      const candidateEmails = Array.from({ length: 5 }, (_, i) => 
        `count-test-${Date.now()}-${i}@example.com`
      );

      const candidates = await Promise.all(
        candidateEmails.map(email => 
          prisma.candidate.create({
            data: {
              email,
              firstName: 'Count',
              lastName: 'Test',
              lastUpdated: new Date(),
            }
          })
        )
      );

      // Create applications
      await Promise.all(
        candidates.map((candidate, i) => 
          prisma.application.create({
            data: {
              jobId: job.id,
              candidateId: candidate.id,
              status: 'PENDING',
              stage: i === 0 ? 'hired' : 'sourced',
            }
          })
        )
      );

      // Verify counts
      const jobWithCounts = await prisma.job.findUnique({
        where: { id: job.id },
        include: {
          _count: {
            select: { applications: true }
          }
        }
      });

      expect(jobWithCounts?._count.applications).toBe(5);

      // Verify stage counts
      const hiredCount = await prisma.application.count({
        where: {
          jobId: job.id,
          stage: 'hired'
        }
      });
      expect(hiredCount).toBe(1);

      // Cleanup
      await prisma.application.deleteMany({ where: { jobId: job.id } });
      await prisma.candidate.deleteMany({ 
        where: { email: { in: candidateEmails } } 
      });
      await prisma.job.delete({ where: { id: job.id } });
    });
  });

  test.describe('Concurrent Operations', () => {
    test('should handle concurrent updates correctly', async () => {
      const candidate = await prisma.candidate.create({
        data: {
          email: `concurrent-test-${Date.now()}@example.com`,
          firstName: 'Concurrent',
          lastName: 'Test',
          lastUpdated: new Date(),
          expectedSalary: '100000',
        }
      });

      // Simulate concurrent updates
      const updates = Array.from({ length: 10 }, (_, i) => 
        prisma.candidate.update({
          where: { id: candidate.id },
          data: { 
            expectedSalary: `${100000 + (i * 1000)}`,
            lastUpdated: new Date()
          }
        })
      );

      await Promise.all(updates);

      // Verify final state
      const updated = await prisma.candidate.findUnique({
        where: { id: candidate.id }
      });

      expect(updated).not.toBeNull();
      expect(updated?.expectedSalary).toBeDefined();

      // Cleanup
      await prisma.candidate.delete({ where: { id: candidate.id } });
    });
  });
});
