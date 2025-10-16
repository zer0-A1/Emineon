const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDataEngineerCandidates() {
  try {
    console.log('🔍 Creating 10 Data Engineer candidates for pitch demo...');

    // Check if candidates already exist
    const existingCandidates = await prisma.candidate.findMany({
      where: {
        OR: [
          { email: { contains: 'sarah.chen.data@gmail.com' } },
          { email: { contains: 'marcus.weber.eng@gmail.com' } },
          { email: { contains: 'elena.popovic.dev@gmail.com' } }
        ]
      }
    });

    if (existingCandidates.length > 0) {
      console.log(`⚠️  Found ${existingCandidates.length} existing candidates - skipping creation`);
      return;
    }

    const candidates = [
      {
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen.data@gmail.com',
        phone: '+41 79 123 4567',
        location: 'Zurich, Switzerland',
        summary: 'Senior Data Engineer with 6+ years of experience in MongoDB, real-time data processing, and TypeScript. Expert in designing scalable data pipelines and implementing ETL processes for financial services.',
        experience: 6,
        skills: ['MongoDB', 'TypeScript', 'SQL', 'Apache Kafka', 'Python', 'Docker', 'Kubernetes', 'AWS', 'Apache Spark', 'Redis'],
        availability: 'IMMEDIATE',
        expectedSalary: 125000,
        salaryExpectation: 'CHF 120,000 - 130,000',
        educationLevel: 'MASTERS',
        workType: 'HYBRID',
        matchScore: 95,
        yearsOfExperience: 6,
        linkedinUrl: 'https://linkedin.com/in/sarah-chen-data-engineer',
        githubUrl: 'https://github.com/sarah-chen-data'
      },
      {
        firstName: 'Marcus',
        lastName: 'Weber',
        email: 'marcus.weber.eng@gmail.com',
        phone: '+41 79 234 5678',
        location: 'Basel, Switzerland',
        summary: 'Full-stack Data Engineer specializing in MongoDB and TypeScript. 5 years of experience building high-performance data systems for e-commerce and fintech companies.',
        experience: 5,
        skills: ['MongoDB', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Elasticsearch', 'GraphQL', 'React', 'Docker', 'Azure'],
        availability: 'TWO_WEEKS',
        expectedSalary: 115000,
        salaryExpectation: 'CHF 110,000 - 120,000',
        educationLevel: 'BACHELOR',
        workType: 'REMOTE',
        matchScore: 92,
        yearsOfExperience: 5,
        linkedinUrl: 'https://linkedin.com/in/marcus-weber-engineer',
        githubUrl: 'https://github.com/marcus-weber-dev'
      },
      {
        firstName: 'Elena',
        lastName: 'Popović',
        email: 'elena.popovic.dev@gmail.com',
        phone: '+41 79 345 6789',
        location: 'Geneva, Switzerland',
        summary: 'Data Engineering specialist with strong MongoDB and SQL expertise. 4 years of experience in real-time analytics and data pipeline optimization for healthcare and research institutions.',
        experience: 4,
        skills: ['MongoDB', 'SQL', 'Python', 'Apache Airflow', 'Pandas', 'NumPy', 'Snowflake', 'dbt', 'Git', 'Linux'],
        availability: 'ONE_MONTH',
        expectedSalary: 105000,
        salaryExpectation: 'CHF 100,000 - 110,000',
        educationLevel: 'MASTERS',
        workType: 'HYBRID',
        matchScore: 89,
        yearsOfExperience: 4,
        linkedinUrl: 'https://linkedin.com/in/elena-popovic-data',
        githubUrl: 'https://github.com/elena-popovic-data'
      },
      {
        firstName: 'David',
        lastName: 'Martinez',
        email: 'david.martinez.data@gmail.com',
        phone: '+41 79 456 7890',
        location: 'Lausanne, Switzerland',
        summary: 'Senior MongoDB Developer with TypeScript expertise. 7 years of experience in database design, performance optimization, and real-time data processing for multinational corporations.',
        experience: 7,
        skills: ['MongoDB', 'TypeScript', 'JavaScript', 'SQL', 'Apache Kafka', 'Elasticsearch', 'Docker', 'Kubernetes', 'AWS', 'Terraform'],
        availability: 'TWO_WEEKS',
        expectedSalary: 135000,
        salaryExpectation: 'CHF 130,000 - 140,000',
        educationLevel: 'MASTERS',
        workType: 'HYBRID',
        matchScore: 94,
        yearsOfExperience: 7,
        linkedinUrl: 'https://linkedin.com/in/david-martinez-mongodb',
        githubUrl: 'https://github.com/david-martinez-db'
      },
      {
        firstName: 'Ana',
        lastName: 'Kristoffersen',
        email: 'ana.kristoffersen@gmail.com',
        phone: '+41 79 567 8901',
        location: 'Bern, Switzerland',
        summary: 'Full-stack engineer with deep MongoDB and TypeScript knowledge. 3 years of focused experience in data engineering, ETL processes, and real-time analytics for startups and scale-ups.',
        experience: 3,
        skills: ['MongoDB', 'TypeScript', 'Node.js', 'SQL', 'Redis', 'GraphQL', 'React', 'Express.js', 'Docker', 'GCP'],
        availability: 'IMMEDIATE',
        expectedSalary: 95000,
        salaryExpectation: 'CHF 90,000 - 100,000',
        educationLevel: 'BACHELOR',
        workType: 'REMOTE',
        matchScore: 87,
        yearsOfExperience: 3,
        linkedinUrl: 'https://linkedin.com/in/ana-kristoffersen-dev',
        githubUrl: 'https://github.com/ana-kristoffersen'
      },
      {
        firstName: 'Thomas',
        lastName: 'Schneider',
        email: 'thomas.schneider.data@gmail.com',
        phone: '+41 79 678 9012',
        location: 'St. Gallen, Switzerland',
        summary: 'Data Engineer with expertise in MongoDB, SQL, and TypeScript. 5 years of experience building scalable data infrastructure for IoT and manufacturing companies.',
        experience: 5,
        skills: ['MongoDB', 'SQL', 'TypeScript', 'Python', 'Apache Spark', 'Hadoop', 'Cassandra', 'Kafka', 'Jenkins', 'AWS'],
        availability: 'ONE_MONTH',
        expectedSalary: 112000,
        salaryExpectation: 'CHF 110,000 - 115,000',
        educationLevel: 'MASTERS',
        workType: 'HYBRID',
        matchScore: 91,
        yearsOfExperience: 5,
        linkedinUrl: 'https://linkedin.com/in/thomas-schneider-data',
        githubUrl: 'https://github.com/thomas-schneider-eng'
      },
      {
        firstName: 'Lucia',
        lastName: 'Rossi',
        email: 'lucia.rossi.engineer@gmail.com',
        phone: '+41 79 789 0123',
        location: 'Lugano, Switzerland',
        summary: 'MongoDB and TypeScript specialist with 4 years of experience in real-time data processing and analytics. Strong background in financial data systems and regulatory compliance.',
        experience: 4,
        skills: ['MongoDB', 'TypeScript', 'SQL', 'Node.js', 'Redis', 'Apache Kafka', 'Docker', 'PostgreSQL', 'Git', 'Grafana'],
        availability: 'TWO_WEEKS',
        expectedSalary: 108000,
        salaryExpectation: 'CHF 105,000 - 110,000',
        educationLevel: 'BACHELOR',
        workType: 'HYBRID',
        matchScore: 88,
        yearsOfExperience: 4,
        linkedinUrl: 'https://linkedin.com/in/lucia-rossi-data',
        githubUrl: 'https://github.com/lucia-rossi-dev'
      },
      {
        firstName: 'Philippe',
        lastName: 'Dubois',
        email: 'philippe.dubois.data@gmail.com',
        phone: '+41 79 890 1234',
        location: 'Neuchâtel, Switzerland',
        summary: 'Senior Data Engineer with 8 years of experience in MongoDB, SQL, and TypeScript. Expert in building enterprise-grade data platforms and mentoring junior developers.',
        experience: 8,
        skills: ['MongoDB', 'SQL', 'TypeScript', 'Python', 'Apache Airflow', 'Snowflake', 'dbt', 'Kubernetes', 'Azure', 'Terraform'],
        availability: 'ONE_MONTH',
        expectedSalary: 145000,
        salaryExpectation: 'CHF 140,000 - 150,000',
        educationLevel: 'MASTERS',
        workType: 'HYBRID',
        matchScore: 96,
        yearsOfExperience: 8,
        linkedinUrl: 'https://linkedin.com/in/philippe-dubois-senior',
        githubUrl: 'https://github.com/philippe-dubois-data'
      },
      {
        firstName: 'Katarina',
        lastName: 'Müller',
        email: 'katarina.muller.dev@gmail.com',
        phone: '+41 79 901 2345',
        location: 'Winterthur, Switzerland',
        summary: 'Data Engineer with 3 years of hands-on experience in MongoDB and TypeScript. Specialized in real-time data streaming and ETL pipeline development for e-commerce platforms.',
        experience: 3,
        skills: ['MongoDB', 'TypeScript', 'SQL', 'Node.js', 'Apache Kafka', 'Redis', 'React', 'Express.js', 'Docker', 'AWS'],
        availability: 'IMMEDIATE',
        expectedSalary: 92000,
        salaryExpectation: 'CHF 90,000 - 95,000',
        educationLevel: 'BACHELOR',
        workType: 'REMOTE',
        matchScore: 85,
        yearsOfExperience: 3,
        linkedinUrl: 'https://linkedin.com/in/katarina-muller-data',
        githubUrl: 'https://github.com/katarina-muller-dev'
      },
      {
        firstName: 'Alessandro',
        lastName: 'Ferrari',
        email: 'alessandro.ferrari.eng@gmail.com',
        phone: '+41 79 012 3456',
        location: 'Zug, Switzerland',
        summary: 'Full-stack Data Engineer with 6 years of experience in MongoDB, TypeScript, and SQL. Strong background in cryptocurrency and blockchain data analysis with proven track record in high-frequency trading systems.',
        experience: 6,
        skills: ['MongoDB', 'TypeScript', 'SQL', 'Python', 'Apache Spark', 'Kafka', 'Elasticsearch', 'Docker', 'Kubernetes', 'GCP'],
        availability: 'TWO_WEEKS',
        expectedSalary: 128000,
        salaryExpectation: 'CHF 125,000 - 130,000',
        educationLevel: 'MASTERS',
        workType: 'HYBRID',
        matchScore: 93,
        yearsOfExperience: 6,
        linkedinUrl: 'https://linkedin.com/in/alessandro-ferrari-data',
        githubUrl: 'https://github.com/alessandro-ferrari-eng'
      }
    ];

    console.log('📊 Creating candidates with matching scores...');

    const createdCandidates = [];
    for (const candidateData of candidates) {
      const candidate = await prisma.candidate.create({
        data: {
          firstName: candidateData.firstName,
          lastName: candidateData.lastName,
          email: candidateData.email,
          phone: candidateData.phone,
          currentLocation: candidateData.location,
          summary: candidateData.summary,
          technicalSkills: candidateData.skills,
          experienceYears: candidateData.yearsOfExperience,
          expectedSalary: candidateData.salaryExpectation,
          educationLevel: candidateData.educationLevel,
          linkedinUrl: candidateData.linkedinUrl,
          githubUrl: candidateData.githubUrl,
          status: 'ACTIVE',
          lastUpdated: new Date()
        }
      });

      createdCandidates.push({
        ...candidate,
        matchScore: candidateData.matchScore
      });

      console.log(`✅ Created: ${candidateData.firstName} ${candidateData.lastName} (${candidateData.matchScore}% match)`);
    }

    console.log('\n🎯 Candidate Summary:');
    console.log('─'.repeat(60));
    createdCandidates
      .sort((a, b) => b.matchScore - a.matchScore)
      .forEach((candidate, index) => {
        console.log(`${index + 1}. ${candidate.firstName} ${candidate.lastName}`);
        console.log(`   📧 ${candidate.email}`);
        console.log(`   📍 ${candidate.currentLocation}`);
        console.log(`   💼 ${candidate.experienceYears} years experience`);
        console.log(`   🎯 ${candidate.matchScore}% match score`);
        console.log(`   💰 ${candidate.expectedSalary}`);
        console.log(`   ⏰ Available: ${candidate.availability}`);
        console.log('');
      });

    console.log('✨ All 10 Data Engineer candidates created successfully!');
    console.log('\n🔥 Key Highlights:');
    console.log('• All candidates have MongoDB + TypeScript + SQL skills');
    console.log('• Match scores range from 85% to 96%');
    console.log('• Mix of experience levels (3-8 years)');
    console.log('• Various Swiss locations for geographic diversity');
    console.log('• Different availability windows for realistic scenarios');
    console.log('• Salary expectations align with market rates');

  } catch (error) {
    console.error('❌ Error creating candidates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDataEngineerCandidates(); 