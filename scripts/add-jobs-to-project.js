const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addJobsToDataFlowProject() {
  try {
    console.log('🔍 Finding DataFlow Innovations project...');
    
    // Find the DataFlow Innovations project
    const project = await prisma.project.findFirst({
      where: {
        clientName: {
          contains: 'DataFlow',
          mode: 'insensitive'
        }
      }
    });

    if (!project) {
      console.log('❌ DataFlow Innovations project not found');
      return;
    }

    console.log(`✅ Found project: ${project.name} (ID: ${project.id})`);

    // Check if jobs already exist
    const existingJobs = await prisma.job.findMany({
      where: { projectId: project.id }
    });

    if (existingJobs.length > 0) {
      console.log(`✅ Project already has ${existingJobs.length} jobs:`);
      existingJobs.forEach(job => {
        console.log(`   • ${job.title} (${job.status})`);
      });
      return;
    }

    console.log('🏗️  Creating job positions...');

    // Create the 3 Data Engineer positions
    const jobsToCreate = [
      {
        title: 'Senior Data Engineer - MongoDB Specialist',
        description: `Join DataFlow Innovations as a Senior Data Engineer focusing on MongoDB and real-time data processing.

We are seeking a highly skilled Senior Data Engineer to lead our data infrastructure initiatives. You will be responsible for designing and implementing scalable data solutions using MongoDB, SQL, and TypeScript.

Key Responsibilities:
• Design and implement MongoDB database schemas and optimization strategies
• Develop real-time data processing pipelines using modern technologies
• Lead technical architecture decisions for data infrastructure
• Mentor junior team members and drive best practices
• Collaborate with cross-functional teams on data strategy
• Ensure data quality, security, and performance optimization

Requirements:
• 5+ years of experience with MongoDB and database design
• Strong proficiency in SQL and TypeScript
• Experience with real-time data processing and ETL pipelines
• Knowledge of cloud platforms (AWS, GCP, or Azure)
• Experience with data visualization and analytics tools
• Strong problem-solving and leadership skills`,
        department: 'Engineering',
        location: 'Zurich',
        status: 'ACTIVE',
        isRemote: false,
        projectId: project.id,
        requirements: ['MongoDB', 'SQL', 'TypeScript', 'ETL', 'Cloud Platforms', '5+ years experience'],
        responsibilities: [
          'Design and implement MongoDB database schemas',
          'Develop real-time data processing pipelines',
          'Lead technical architecture decisions',
          'Mentor junior team members',
          'Collaborate on data strategy',
          'Ensure data quality and performance'
        ],
        benefits: ['Competitive salary', 'Modern tech stack', 'Leadership opportunities', 'Professional development'],
        employmentType: ['FULL_TIME'],
        experienceLevel: 'Senior (5+ years)',
        salaryMin: 100000,
        salaryMax: 130000,
        salaryCurrency: 'CHF',
      },
      {
        title: 'Data Engineer - Real-time Processing',
        description: `Join our growing team as a Data Engineer specializing in real-time data processing and analytics.

We are looking for a talented Data Engineer to help build and maintain our data infrastructure. You will work with cutting-edge technologies to process and analyze large volumes of data in real-time.

Key Responsibilities:
• Develop and maintain data processing pipelines
• Implement SQL queries and database optimizations
• Build TypeScript applications for data processing
• Monitor and troubleshoot data pipeline performance
• Collaborate with the data science team on analytics projects
• Participate in code reviews and technical discussions

Requirements:
• 3+ years of experience with data engineering
• Proficiency in MongoDB, SQL, and TypeScript
• Experience with real-time data processing frameworks
• Knowledge of ETL processes and data modeling
• Familiarity with cloud-based data solutions
• Strong analytical and problem-solving skills`,
        department: 'Engineering',
        location: 'Zurich',
        status: 'ACTIVE',
        isRemote: false,
        projectId: project.id,
        requirements: ['MongoDB', 'SQL', 'TypeScript', 'ETL', 'Real-time Processing', '3+ years experience'],
        responsibilities: [
          'Develop and maintain data processing pipelines',
          'Implement SQL queries and optimizations',
          'Build TypeScript data applications',
          'Monitor pipeline performance',
          'Collaborate on analytics projects',
          'Participate in code reviews'
        ],
        benefits: ['Competitive package', 'Modern technologies', 'Team collaboration', 'Growth opportunities'],
        employmentType: ['FULL_TIME'],
        experienceLevel: 'Mid-level (3+ years)',
        salaryMin: 85000,
        salaryMax: 110000,
        salaryCurrency: 'CHF',
      },
      {
        title: 'Junior Data Engineer - MongoDB & TypeScript',
        description: `Start your data engineering career with DataFlow Innovations as a Junior Data Engineer.

We are seeking a motivated Junior Data Engineer to join our team and grow their skills in data processing and analytics. This is an excellent opportunity to work with modern technologies and learn from experienced engineers.

Key Responsibilities:
• Assist in developing data processing pipelines
• Write and optimize SQL queries
• Develop TypeScript applications for data processing
• Support data quality and validation processes
• Learn and apply best practices in data engineering
• Contribute to documentation and knowledge sharing

Requirements:
• 1-3 years of experience with data technologies
• Basic knowledge of MongoDB and SQL
• Familiarity with TypeScript or JavaScript
• Understanding of data processing concepts
• Eagerness to learn and grow in data engineering
• Strong communication and teamwork skills`,
        department: 'Engineering',
        location: 'Zurich',
        status: 'ACTIVE',
        isRemote: false,
        projectId: project.id,
        requirements: ['MongoDB', 'SQL', 'TypeScript', 'Data Processing', '1-3 years experience'],
        responsibilities: [
          'Assist in developing data pipelines',
          'Write and optimize SQL queries',
          'Develop TypeScript applications',
          'Support data quality processes',
          'Learn best practices',
          'Contribute to documentation'
        ],
        benefits: ['Learning opportunities', 'Mentorship', 'Modern tech stack', 'Career growth'],
        employmentType: ['FULL_TIME'],
        experienceLevel: 'Junior (1-3 years)',
        salaryMin: 70000,
        salaryMax: 90000,
        salaryCurrency: 'CHF',
      }
    ];

    // Create the jobs
    const createdJobs = [];
    for (const jobData of jobsToCreate) {
      const job = await prisma.job.create({
        data: jobData
      });
      createdJobs.push(job);
      console.log(`✅ Created job: ${job.title}`);
    }

    // Add project activity
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        type: 'JOB_CREATED',
        title: 'Jobs Created for Pitch Demo',
        description: `${createdJobs.length} job positions created for DataFlow Innovations project`,
        metadata: {
          jobIds: createdJobs.map(j => j.id),
          jobTitles: createdJobs.map(j => j.title),
          source: 'pitch_demo_setup'
        }
      }
    });

    console.log(`🎉 Successfully created ${createdJobs.length} jobs for the DataFlow Innovations project!`);
    console.log('\n📋 Jobs created:');
    createdJobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title}`);
      console.log(`      💰 Salary: ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()} CHF`);
      console.log(`      📍 Location: ${job.location}`);
      console.log(`      🎯 Status: ${job.status}`);
      console.log('');
    });

    console.log(`🔗 View project: http://localhost:3008/projects/${project.id}`);

  } catch (error) {
    console.error('❌ Error creating jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addJobsToDataFlowProject(); 