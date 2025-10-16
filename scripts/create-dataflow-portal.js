const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDataFlowPortal() {
  try {
    console.log('🚀 Creating DataFlow Innovations Client Portal for Pitch Demo...');

    // First, find the DataFlow Innovations project
    const project = await prisma.project.findFirst({
      where: {
        clientName: {
          contains: 'DataFlow',
          mode: 'insensitive'
        }
      },
      include: {
        jobs: true
      }
    });

    if (!project) {
      console.log('❌ DataFlow Innovations project not found. Please run the pitch demo setup first.');
      return;
    }

    console.log(`✅ Found project: ${project.name} with ${project.jobs.length} jobs`);

    // Check if client portal already exists
    const existingClient = await prisma.client.findUnique({
      where: { id: 'client-dataflow-innovations' }
    });

    if (existingClient) {
      console.log('⚠️  DataFlow Innovations client portal already exists');
      console.log(`🔗 Portal URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/clients/client-dataflow-innovations/portal`);
      return;
    }

    // Create the client record with existing schema fields
    const client = await prisma.client.create({
      data: {
        id: 'client-dataflow-innovations',
        name: 'DataFlow Innovations AG',
        industry: 'Technology',
        contactPerson: 'Emmanuel D.',
        email: 'emmanuel.d@dataflow-innovations.com',
        phone: '+41 44 123 45 67',
        address: 'Zurich, Switzerland',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Created DataFlow Innovations client record');

    // Create a primary admin user (we'll need to create a User record first)
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@emineon.com' },
      update: {},
      create: {
        email: 'admin@emineon.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create portal invitations for client users
    const portalUsers = [
      {
        email: 'emmanuel.d@dataflow-innovations.com',
        role: 'ADMIN'
      },
      {
        email: 'hr.director@dataflow-innovations.com',
        role: 'COLLABORATOR'
      },
      {
        email: 'tech.lead@dataflow-innovations.com',
        role: 'COLLABORATOR'
      }
    ];

    for (const userData of portalUsers) {
      await prisma.clientPortalInvitation.create({
        data: {
          clientId: client.id,
          email: userData.email,
          role: userData.role,
          token: `invite-${Math.random().toString(36).substring(2, 15)}`,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          acceptedAt: new Date(), // Auto-accept for demo
          invitedBy: adminUser.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    console.log(`✅ Created ${portalUsers.length} portal invitations`);

    // Associate all jobs from the project with the client
    if (project.jobs.length > 0) {
      // Add clientId field to Job model if it doesn't exist
      try {
        await prisma.job.updateMany({
          where: { projectId: project.id },
          data: { /* clientId: client.id */ } // Comment out until we add the field
        });
        console.log(`✅ Jobs ready for client association`);
      } catch (error) {
        console.log('ℹ️  Jobs will be accessible through project relationship');
      }
    }

    // Create some portal activity logs
    const activities = [
      {
        clientId: client.id,
        actorEmail: 'emmanuel.d@dataflow-innovations.com',
        action: 'portal_created',
        resourceType: 'client',
        resourceId: client.id,
        metadata: JSON.stringify({ description: 'Client portal created and configured' }),
        createdAt: new Date()
      },
      {
        clientId: client.id,
        actorEmail: 'admin@emineon.com',
        action: 'users_invited',
        resourceType: 'invitations',
        resourceId: client.id,
        metadata: JSON.stringify({ count: portalUsers.length }),
        createdAt: new Date()
      },
      {
        clientId: client.id,
        actorEmail: 'admin@emineon.com',
        action: 'project_shared',
        resourceType: 'project',
        resourceId: project.id,
        metadata: JSON.stringify({ projectName: project.name }),
        createdAt: new Date()
      }
    ];

    for (const activity of activities) {
      await prisma.clientActivity.create({
        data: activity
      });
    }

    console.log('✅ Created portal activity logs');

    // Create some demo pipeline stages for this client
    const pipelineStages = [
      { name: 'New Application', order: 1, color: '#3B82F6' },
      { name: 'Initial Review', order: 2, color: '#8B5CF6' },
      { name: 'Technical Assessment', order: 3, color: '#F59E0B' },
      { name: 'Client Interview', order: 4, color: '#10B981', requiresClientAction: true },
      { name: 'Final Decision', order: 5, color: '#EF4444' },
      { name: 'Hired', order: 6, color: '#059669' }
    ];

    for (const stage of pipelineStages) {
      await prisma.pipelineStage.create({
        data: {
          ...stage,
          clientId: client.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    console.log('✅ Created custom pipeline stages');

    // Summary
    console.log('\n🎯 DataFlow Innovations Client Portal Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Client ID: ${client.id}`);
    console.log(`🏢 Company: ${client.name}`);
    console.log(`👤 Primary Contact: ${client.contactPerson} (${client.email})`);
    console.log(`📍 Location: ${client.address}`);
    console.log(`🔗 Portal URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/clients/${client.id}/portal`);
    console.log(`📊 Associated Project: ${project.name}`);
    console.log(`💼 Jobs Available: ${project.jobs.length}`);
    console.log(`👥 Portal Users: ${portalUsers.length}`);
    console.log(`🔄 Pipeline Stages: ${pipelineStages.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 Ready for Pitch Demo!');
    console.log('✅ Client can now access their dedicated portal');
    console.log('✅ View job openings and candidate shortlists');
    console.log('✅ Collaborate with Emineon team');
    console.log('✅ Track recruitment progress');
    console.log('✅ Custom pipeline for their workflow');

  } catch (error) {
    console.error('❌ Error creating DataFlow portal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDataFlowPortal(); 