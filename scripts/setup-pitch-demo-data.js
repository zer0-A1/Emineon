// Setup script for pitch demo - populates database with realistic Data Engineer candidates
// Run this before your pitch to ensure you have perfect demo data

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mockDataEngineerCandidates = [
  {
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@techmail.com',
    phone: '+41 79 123 4567',
    currentTitle: 'Senior Data Engineer',
    currentLocation: 'Zurich, Switzerland',
    summary: 'Senior Data Engineer with extensive experience building scalable data pipelines and MongoDB clusters. Led data migration projects for Fortune 500 companies with focus on real-time analytics and cloud infrastructure.',
    experienceYears: 7,
    technicalSkills: ['MongoDB', 'TypeScript', 'SQL', 'Python', 'Apache Kafka', 'Docker', 'Kubernetes', 'AWS', 'Apache Spark', 'Redis'],
    softSkills: ['Leadership', 'Problem Solving', 'Communication', 'Team Collaboration', 'Mentoring'],
    programmingLanguages: ['TypeScript', 'Python', 'JavaScript', 'SQL', 'Bash'],
    frameworks: ['Express.js', 'Apache Kafka', 'Apache Spark', 'Docker', 'Kubernetes'],
    toolsAndPlatforms: ['AWS', 'MongoDB Atlas', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI'],
    methodologies: ['Agile', 'Scrum', 'DevOps', 'Data Modeling', 'ETL/ELT'],
    certifications: ['AWS Certified Solutions Architect', 'MongoDB Certified Developer', 'Certified Kubernetes Administrator'],
    linkedinUrl: 'https://linkedin.com/in/sarahchen-data',
    portfolioUrl: 'https://sarahchen.dev',
    seniorityLevel: 'SENIOR',
    primaryIndustry: 'Technology',
    remotePreference: 'HYBRID',
    expectedSalary: '€100,000 - €120,000',
    workPermitType: 'EU Citizen',
    nationality: 'Swiss',
    spokenLanguages: ['English (Native)', 'German (Fluent)', 'Mandarin (Native)'],
    tags: ['Data Engineering', 'MongoDB Expert', 'Cloud Architecture', 'Team Lead'],
    source: 'LinkedIn',
    status: 'ACTIVE',
    professionalHeadline: 'Senior Data Engineer | MongoDB & Cloud Expert | 7+ Years Experience'
  },
  {
    firstName: 'Marcus',
    lastName: 'Weber',
    email: 'marcus.weber@datatech.ch',
    phone: '+41 61 456 7890',
    currentTitle: 'Data Architect',
    currentLocation: 'Basel, Switzerland',
    summary: 'Data Architect specializing in NoSQL databases and real-time analytics. Expert in MongoDB sharding and replication strategies with extensive experience in financial services data platforms.',
    experienceYears: 9,
    technicalSkills: ['MongoDB', 'TypeScript', 'PostgreSQL', 'Redis', 'Node.js', 'Elasticsearch', 'Terraform', 'GCP', 'Apache Airflow', 'Scala'],
    softSkills: ['Strategic Thinking', 'Architecture Design', 'Technical Leadership', 'Stakeholder Management'],
    programmingLanguages: ['TypeScript', 'JavaScript', 'Scala', 'SQL', 'Python'],
    frameworks: ['Node.js', 'Express.js', 'Apache Airflow', 'Terraform', 'Apache Kafka'],
    toolsAndPlatforms: ['GCP', 'MongoDB', 'Elasticsearch', 'Redis', 'Terraform', 'Docker'],
    methodologies: ['Domain-Driven Design', 'Microservices', 'Event-Driven Architecture', 'Agile'],
    certifications: ['Google Cloud Professional Data Engineer', 'MongoDB Certified DBA', 'Elasticsearch Certified Engineer'],
    linkedinUrl: 'https://linkedin.com/in/marcusweber-arch',
    portfolioUrl: 'https://marcusweber.tech',
    seniorityLevel: 'SENIOR',
    primaryIndustry: 'Financial Services',
    remotePreference: 'HYBRID',
    expectedSalary: '€110,000 - €130,000',
    workPermitType: 'EU Citizen',
    nationality: 'Swiss',
    spokenLanguages: ['German (Native)', 'English (Fluent)', 'French (Intermediate)'],
    tags: ['Data Architecture', 'MongoDB DBA', 'Financial Services', 'Scalability Expert'],
    source: 'Referral',
    status: 'ACTIVE',
    professionalHeadline: 'Data Architect | MongoDB Expert | Financial Services Specialist'
  },
  {
    firstName: 'Elena',
    lastName: 'Popovich',
    email: 'elena.popovich@dataflow.tech',
    phone: '+41 22 789 0123',
    currentTitle: 'Full Stack Data Engineer',
    currentLocation: 'Geneva, Switzerland',
    summary: 'Full-stack engineer with focus on data engineering. Built end-to-end analytics platforms using modern tech stack. Strong background in both frontend TypeScript applications and backend data processing.',
    experienceYears: 5,
    technicalSkills: ['MongoDB', 'TypeScript', 'SQL Server', 'React', 'Express.js', 'Azure', 'Apache Spark', 'Databricks', 'Power BI', 'GraphQL'],
    softSkills: ['Full-Stack Development', 'Product Thinking', 'User Experience', 'Cross-functional Collaboration'],
    programmingLanguages: ['TypeScript', 'JavaScript', 'Python', 'SQL', 'C#'],
    frameworks: ['React', 'Express.js', 'Apache Spark', 'GraphQL', 'Material-UI'],
    toolsAndPlatforms: ['Azure', 'Databricks', 'Power BI', 'MongoDB Atlas', 'SQL Server', 'Visual Studio Code'],
    methodologies: ['Full-Stack Development', 'Agile', 'User-Centered Design', 'DevOps'],
    certifications: ['Microsoft Azure Data Engineer Associate', 'React Developer Certification'],
    linkedinUrl: 'https://linkedin.com/in/elena-popovich',
    portfolioUrl: 'https://elena-popovich.dev',
    seniorityLevel: 'MID_LEVEL',
    primaryIndustry: 'Technology',
    remotePreference: 'REMOTE',
    expectedSalary: '€85,000 - €105,000',
    workPermitType: 'EU Citizen',
    nationality: 'French',
    spokenLanguages: ['French (Native)', 'English (Fluent)', 'Russian (Native)'],
    tags: ['Full-Stack', 'Data Visualization', 'Azure Expert', 'Modern Tech Stack'],
    source: 'Company Website',
    status: 'ACTIVE',
    professionalHeadline: 'Full Stack Data Engineer | Azure & TypeScript Specialist'
  },
  {
    firstName: 'David',
    lastName: 'Martinez',
    email: 'david.martinez@bigdata.com',
    phone: '+41 21 234 5678',
    currentTitle: 'Senior Backend Engineer',
    currentLocation: 'Lausanne, Switzerland',
    summary: 'Backend engineer with strong data engineering skills. Experience with high-volume MongoDB deployments and real-time data processing. Specialized in building robust APIs and microservices architectures.',
    experienceYears: 6,
    technicalSkills: ['MongoDB', 'TypeScript', 'MySQL', 'Node.js', 'GraphQL', 'AWS Lambda', 'Docker', 'Jenkins', 'RabbitMQ', 'Microservices'],
    softSkills: ['API Design', 'System Architecture', 'Performance Optimization', 'Code Review'],
    programmingLanguages: ['TypeScript', 'JavaScript', 'Python', 'SQL', 'Go'],
    frameworks: ['Node.js', 'Express.js', 'GraphQL', 'AWS Lambda', 'Docker'],
    toolsAndPlatforms: ['AWS', 'MongoDB', 'MySQL', 'Jenkins', 'Docker', 'RabbitMQ'],
    methodologies: ['Microservices', 'API-First Design', 'TDD', 'Continuous Integration'],
    certifications: ['AWS Certified Developer', 'MongoDB Certified Developer'],
    linkedinUrl: 'https://linkedin.com/in/david-martinez-backend',
    portfolioUrl: 'https://davidmartinez.io',
    seniorityLevel: 'SENIOR',
    primaryIndustry: 'E-commerce',
    remotePreference: 'HYBRID',
    expectedSalary: '€95,000 - €115,000',
    workPermitType: 'EU Citizen',
    nationality: 'Spanish',
    spokenLanguages: ['Spanish (Native)', 'English (Fluent)', 'French (Intermediate)'],
    tags: ['Backend Expert', 'Microservices', 'High Performance', 'API Design'],
    source: 'GitHub',
    status: 'ACTIVE',
    professionalHeadline: 'Senior Backend Engineer | MongoDB & Microservices Expert'
  },
  {
    firstName: 'Ana',
    lastName: 'Kristoffersen',
    email: 'ana.kristoffersen@nordtech.no',
    phone: '+47 123 456 789',
    currentTitle: 'Data Platform Engineer',
    currentLocation: 'Oslo, Norway',
    summary: 'Data platform engineer with expertise in building robust ETL pipelines. Strong MongoDB and TypeScript background with focus on data quality and automated processing workflows.',
    experienceYears: 4,
    technicalSkills: ['MongoDB', 'TypeScript', 'PostgreSQL', 'Apache Airflow', 'Apache Kafka', 'Kubernetes', 'Azure', 'Snowflake', 'dbt', 'Python'],
    softSkills: ['Data Quality', 'Process Automation', 'Documentation', 'Training'],
    programmingLanguages: ['TypeScript', 'Python', 'SQL', 'JavaScript', 'Bash'],
    frameworks: ['Apache Airflow', 'Apache Kafka', 'dbt', 'Kubernetes', 'Docker'],
    toolsAndPlatforms: ['Azure', 'Snowflake', 'MongoDB', 'PostgreSQL', 'Kubernetes', 'Apache Airflow'],
    methodologies: ['DataOps', 'ETL/ELT', 'Data Pipeline Automation', 'Agile'],
    certifications: ['Microsoft Azure Data Fundamentals', 'Snowflake Certified Architect'],
    linkedinUrl: 'https://linkedin.com/in/ana-kristoffersen',
    portfolioUrl: 'https://ana-k.dev',
    seniorityLevel: 'MID_LEVEL',
    primaryIndustry: 'Healthcare',
    remotePreference: 'REMOTE',
    expectedSalary: '€75,000 - €95,000',
    workPermitType: 'Norwegian Citizen',
    nationality: 'Norwegian',
    spokenLanguages: ['Norwegian (Native)', 'English (Fluent)', 'Swedish (Fluent)'],
    tags: ['Data Platform', 'ETL Expert', 'Automation', 'Nordic Market'],
    source: 'Professional Network',
    status: 'ACTIVE',
    professionalHeadline: 'Data Platform Engineer | ETL & Automation Specialist'
  }
];

async function setupPitchDemoData() {
  try {
    console.log('🎯 Setting up Pitch Demo Data...');
    console.log('=' .repeat(50));

    // Clear existing demo candidates (optional - comment out if you want to keep existing data)
    console.log('\n🧹 Cleaning existing demo data...');
    await prisma.candidate.deleteMany({
      where: {
        email: {
          in: mockDataEngineerCandidates.map(c => c.email)
        }
      }
    });

    console.log('\n👥 Creating Data Engineer candidates...');
    
    for (const candidateData of mockDataEngineerCandidates) {
      try {
        const candidate = await prisma.candidate.create({
          data: {
            ...candidateData,
            lastUpdated: new Date(),
            archived: false,
            freelancer: false,
            relocationWillingness: true,
            recruiterNotes: [
              `Added for pitch demo - ${candidateData.currentTitle}`,
              `Skills match: MongoDB, TypeScript, SQL expertise`,
              `Location: ${candidateData.currentLocation}`,
              'Available for immediate interviews and placement'
            ]
          }
        });
        
        console.log(`✅ Created: ${candidate.firstName} ${candidate.lastName} (${candidate.currentTitle})`);
      } catch (error) {
        console.error(`❌ Failed to create ${candidateData.firstName} ${candidateData.lastName}:`, error.message);
      }
    }

    // Create a sample project for the demo
    console.log('\n🏗️  Creating demo project...');
    try {
      const demoProject = await prisma.project.create({
        data: {
          name: 'DataFlow Innovations - Data Engineers',
          description: 'Urgent requirement for 3 experienced Data Engineers with MongoDB, TypeScript, and SQL expertise for expanding fintech data platform.',
          clientName: 'DataFlow Innovations',
          clientContact: 'Emmanuel D.',
          clientEmail: 'emmanuel.dubois@dataflow-innovations.ch',
          totalPositions: 3,
          urgencyLevel: 'HIGH',
          priority: 'HIGH',
          status: 'ACTIVE',
          location: 'Zurich, Switzerland',
          isRemote: true,
          isHybrid: true,
          skillsRequired: ['MongoDB', 'TypeScript', 'SQL', 'ETL/ELT', 'Cloud Platforms'],
          experienceRequired: ['3+ years MongoDB', 'TypeScript proficiency', 'Real-time data processing'],
          budgetRange: '€80,000 - €120,000 per year',
          sourceEmail: 'Urgent email from Emmanuel requesting immediate hiring',
          sourceEmailSubject: 'URGENT: Need 3 Data Engineers - MongoDB, SQL, TypeScript - Immediate Start',
          parsedFromEmail: true,
          internalNotes: [
            'High priority client - fintech expansion project',
            'Immediate start required within 2 weeks',
            'Strong preference for European candidates'
          ],
          tags: ['Data Engineering', 'Fintech', 'Urgent', 'MongoDB'],
          activities: {
            create: [
              {
                type: 'PROJECT_CREATED',
                title: 'Project Created from Email',
                description: 'Project automatically created from Emmanuel\'s urgent request for Data Engineers',
                metadata: {
                  source: 'email_parsing',
                  urgency: 'HIGH',
                  skills: ['MongoDB', 'TypeScript', 'SQL']
                }
              }
            ]
          }
        }
      });
      
      console.log(`✅ Created demo project: ${demoProject.name} (ID: ${demoProject.id})`);
    } catch (error) {
      console.error('❌ Failed to create demo project:', error.message);
    }

    // Summary
    console.log('\n📊 Demo Data Summary:');
    const candidateCount = await prisma.candidate.count({
      where: {
        technicalSkills: {
          hasEvery: ['MongoDB', 'TypeScript']
        }
      }
    });
    
    const projectCount = await prisma.project.count({
      where: {
        clientName: 'DataFlow Innovations'
      }
    });

    console.log(`   👥 Data Engineer candidates: ${candidateCount}`);
    console.log(`   🏗️  Demo projects: ${projectCount}`);
    console.log(`   🎯 Skills focus: MongoDB, TypeScript, SQL`);
    console.log(`   📍 Locations: Switzerland, Norway, Europe`);

    console.log('\n🔗 Quick Test URLs:');
    console.log('   📊 Candidate search: http://localhost:3006/candidates');
    console.log('   🏗️  Projects: http://localhost:3006/projects');
    console.log('   🎯 AI Matching: http://localhost:3006/ai-tools');
    console.log('   🌐 Portal Manager: http://localhost:3006/admin/portal-manager');

    console.log('\n🎬 Ready for pitch demo! Run: node test-emmanuel-email.js');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupPitchDemoData()
    .then(() => {
      console.log('\n🎉 Pitch demo data setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  setupPitchDemoData,
  mockDataEngineerCandidates
}; 