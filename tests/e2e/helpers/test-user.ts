import { PrismaClient } from '@prisma/client';
import type { User, Client, Project } from '@prisma/client';

const prisma = new PrismaClient();

export interface TestUserData {
  user: User;
  client: Client;
  project: Project;
}

export async function createTestUser(): Promise<TestUserData> {
  // Create test user with deterministic data
  const testUserId = 'test-user-playwright';
  const testEmail = 'playwright@test.emineon.com';
  
  // Clean up existing test data
  await cleanupTestData(testUserId);
  
  // Create test user
  const user = await prisma.user.create({
    data: {
      id: testUserId,
      email: testEmail,
      firstName: 'Playwright',
      lastName: 'Test User',
      role: 'ADMIN',
    },
  });

  // Create test client
  const client = await prisma.client.create({
    data: {
      name: 'Playwright Test Client',
      industry: 'Software',
      contactPerson: 'Test Contact',
      email: 'contact@playwright-test-client.com',
      phone: '+1-555-TEST-001',
      address: 'Test Valley, Test State',
      logoUrl: 'https://via.placeholder.com/150',
    },
  });

  // Create test project
  const project = await prisma.project.create({
    data: {
      name: 'Playwright Test Project',
      clientName: client.name,
      clientId: client.id,
      status: 'ACTIVE',
      startDate: new Date(),
      description: 'Project for E2E testing',
      totalPositions: 5,
    },
  });

  return { user, client, project };
}

export async function cleanupTestData(userId: string = 'test-user-playwright') {
  try {
    // Delete in reverse order of dependencies
    // Find test client
    const testClient = await prisma.client.findFirst({
      where: { name: 'Playwright Test Client' },
    });

    if (testClient) {
      // Delete project activities for projects with our test client
      await prisma.projectActivity.deleteMany({
        where: {
          project: {
            clientId: testClient.id,
          },
        },
      });

      // Delete applications for jobs in our test client's projects
      await prisma.application.deleteMany({
        where: {
          job: {
            project: {
              clientId: testClient.id,
            },
          },
        },
      });

      // Delete jobs in our test client's projects
      await prisma.job.deleteMany({
        where: {
          project: {
            clientId: testClient.id,
          },
        },
      });

      // Delete projects for our test client
      await prisma.project.deleteMany({
        where: {
          clientId: testClient.id,
        },
      });
    }

    // Delete test client
    await prisma.client.deleteMany({
      where: {
        name: 'Playwright Test Client',
      },
    });

    // Delete candidates (they don't have a user relationship in the schema)
    await prisma.candidate.deleteMany({
      where: {
        email: {
          contains: 'test.candidate',
        },
      },
    });

    // Delete the test user
    await prisma.user.deleteMany({
      where: {
        id: userId,
      },
    });
  } catch (error) {
    console.log('Cleanup error (may be expected):', error);
  }
}

export async function seedTestCandidates(userId: string, count: number = 5) {
  const candidates = [];
  
  for (let i = 0; i < count; i++) {
    const candidate = await prisma.candidate.create({
      data: {
        firstName: `Test${i + 1}`,
        lastName: `Candidate${i + 1}`,
        email: `test.candidate${i + 1}@example.com`,
        phone: `+1555000${i + 1}000`,
        currentLocation: `Test City ${i + 1}`,
        currentTitle: `Senior Developer ${i + 1}`,
        experienceYears: 5 + i,
        status: i % 2 === 0 ? 'ACTIVE' : 'PASSIVE',
        technicalSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
        spokenLanguages: ['English', 'French'],
        expectedSalary: `${100000 + (i * 10000)} USD`,
        lastUpdated: new Date(),
      },
    });
    candidates.push(candidate);
  }
  
  return candidates;
}

export async function seedTestJobs(projectId: string, count: number = 3) {
  const jobs = [];
  const jobTypes = ['Full Stack Developer', 'Data Engineer', 'DevOps Engineer'];
  
  for (let i = 0; i < count; i++) {
    const job = await prisma.job.create({
      data: {
        title: jobTypes[i % jobTypes.length],
        projectId: projectId,
        description: `Looking for an experienced ${jobTypes[i % jobTypes.length]} to join our team.`,
        requirements: ['5+ years experience', 'Strong communication skills', 'Team player'],
        location: `Test Location ${i + 1}`,
        salary: `$${120 + i * 20}k - $${150 + i * 20}k`,
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        urgency: i === 0 ? 'HIGH' : 'MEDIUM',
        pipelineStages: ['Sourced', 'Screened', 'Interview', 'Offer', 'Hired'],
        slaDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        slaDays: 30,
      },
    });
    jobs.push(job);
  }
  
  return jobs;
}
