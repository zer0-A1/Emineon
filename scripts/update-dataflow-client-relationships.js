const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateDataFlowClientRelationships() {
  try {
    console.log('🔄 Updating DataFlow Innovations Client Relationships...');

    // Find the DataFlow client
    const client = await prisma.client.findUnique({
      where: { id: 'client-dataflow-innovations' }
    });

    if (!client) {
      console.log('❌ DataFlow Innovations client not found.');
      return;
    }

    // Find the DataFlow project
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
      console.log('❌ DataFlow Innovations project not found.');
      return;
    }

    console.log(`✅ Found project: ${project.name} with ${project.jobs.length} jobs`);

    // Update the project to link to the client
    await prisma.project.update({
      where: { id: project.id },
      data: { clientId: client.id }
    });

    console.log('✅ Updated project with client relationship');

    // Update all jobs in the project to link to the client
    if (project.jobs.length > 0) {
      await prisma.job.updateMany({
        where: { projectId: project.id },
        data: { clientId: client.id }
      });
      console.log(`✅ Updated ${project.jobs.length} jobs with client relationship`);
    }

    // Verify the relationships
    const updatedClient = await prisma.client.findUnique({
      where: { id: client.id },
      include: {
        projects: {
          include: {
            jobs: true
          }
        },
        jobs: true
      }
    });

    console.log('\n🎯 DataFlow Innovations Client Portal Relationships Updated!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Client ID: ${updatedClient.id}`);
    console.log(`🏢 Company: ${updatedClient.name}`);
    console.log(`📊 Projects: ${updatedClient.projects.length}`);
    console.log(`💼 Direct Jobs: ${updatedClient.jobs.length}`);
    console.log(`💼 Total Jobs (via projects): ${updatedClient.projects.reduce((total, p) => total + p.jobs.length, 0)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Client portal ready with proper relationships!');

  } catch (error) {
    console.error('❌ Error updating DataFlow client relationships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDataFlowClientRelationships(); 