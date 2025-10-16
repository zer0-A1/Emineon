import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs'; // Commented for demo
import { z } from 'zod';

export const runtime = 'nodejs';

const candidateMatchingSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  maxCandidates: z.number().min(1).max(50).optional().default(10),
  minScore: z.number().min(0).max(100).optional().default(50),
});

export async function POST(request: NextRequest) {
  try {
    // Skip authentication for demo purposes
    // const { userId } = auth();
    
    // // Demo mode: check for demo token or allow unauthenticated for pitch
    // const authHeader = request.headers.get('authorization');
    // const isDemoMode = authHeader?.includes('demo-token') || process.env.NODE_ENV === 'development';
    
    // if (!userId && !isDemoMode) {
    //   return NextResponse.json(
    //     { success: false, error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const validatedData = candidateMatchingSchema.parse(body);

    // Enhanced mock data for Data Engineers - Perfect for Emmanuel's email demo
    const mockMatches = [
      {
        candidateId: 'de001',
        candidateName: 'Sarah Chen',
        score: 95,
        reasoning: 'Perfect match: 7 years MongoDB expertise, advanced TypeScript/SQL skills, experience at scale',
        candidate: {
          id: 'de001',
          fullName: 'Sarah Chen',
          email: 'sarah.chen@techmail.com',
          currentTitle: 'Senior Data Engineer',
          experienceYears: 7,
          technicalSkills: ['MongoDB', 'TypeScript', 'SQL', 'Python', 'Apache Kafka', 'Docker', 'Kubernetes', 'AWS'],
          currentLocation: 'Zurich, Switzerland',
          summary: 'Senior Data Engineer with extensive experience building scalable data pipelines and MongoDB clusters. Led data migration projects for Fortune 500 companies.',
          portfolio: 'https://sarahchen.dev',
          availability: 'Available immediately'
        }
      },
      {
        candidateId: 'de002',
        candidateName: 'Marcus Weber',
        score: 92,
        reasoning: 'Excellent skills match: MongoDB architect, TypeScript expert, strong SQL background, local talent',
        candidate: {
          id: 'de002',
          fullName: 'Marcus Weber',
          email: 'marcus.weber@datatech.ch',
          currentTitle: 'Data Architect',
          experienceYears: 9,
          technicalSkills: ['MongoDB', 'TypeScript', 'PostgreSQL', 'Redis', 'Node.js', 'Elasticsearch', 'Terraform', 'GCP'],
          currentLocation: 'Basel, Switzerland',
          summary: 'Data Architect specializing in NoSQL databases and real-time analytics. Expert in MongoDB sharding and replication strategies.',
          portfolio: 'https://marcusweber.tech',
          availability: '2 weeks notice'
        }
      },
      {
        candidateId: 'de003',
        candidateName: 'Elena Popovich',
        score: 90,
        reasoning: 'Strong technical match: MongoDB specialist, full-stack TypeScript, advanced SQL optimization',
        candidate: {
          id: 'de003',
          fullName: 'Elena Popovich',
          email: 'elena.popovich@dataflow.tech',
          currentTitle: 'Full Stack Data Engineer',
          experienceYears: 5,
          technicalSkills: ['MongoDB', 'TypeScript', 'SQL Server', 'React', 'Express.js', 'Azure', 'Spark', 'Databricks'],
          currentLocation: 'Geneva, Switzerland',
          summary: 'Full-stack engineer with focus on data engineering. Built end-to-end analytics platforms using modern tech stack.',
          portfolio: 'https://elena-popovich.dev',
          availability: 'Available now'
        }
      },
      {
        candidateId: 'de004',
        candidateName: 'David Martinez',
        score: 88,
        reasoning: 'Very good match: MongoDB experience, TypeScript proficiency, strong analytics background',
        candidate: {
          id: 'de004',
          fullName: 'David Martinez',
          email: 'david.martinez@bigdata.com',
          currentTitle: 'Senior Backend Engineer',
          experienceYears: 6,
          technicalSkills: ['MongoDB', 'TypeScript', 'MySQL', 'Node.js', 'GraphQL', 'AWS Lambda', 'Docker', 'Jenkins'],
          currentLocation: 'Lausanne, Switzerland',
          summary: 'Backend engineer with strong data engineering skills. Experience with high-volume MongoDB deployments and real-time data processing.',
          portfolio: 'https://davidmartinez.io',
          availability: '1 month notice'
        }
      },
      {
        candidateId: 'de005',
        candidateName: 'Ana Kristoffersen',
        score: 87,
        reasoning: 'Good fit: MongoDB experience, TypeScript skills, data pipeline expertise',
        candidate: {
          id: 'de005',
          fullName: 'Ana Kristoffersen',
          email: 'ana.kristoffersen@nordtech.no',
          currentTitle: 'Data Platform Engineer',
          experienceYears: 4,
          technicalSkills: ['MongoDB', 'TypeScript', 'PostgreSQL', 'Apache Airflow', 'Kafka', 'Kubernetes', 'Azure', 'Snowflake'],
          currentLocation: 'Oslo, Norway',
          summary: 'Data platform engineer with expertise in building robust ETL pipelines. Strong MongoDB and TypeScript background.',
          portfolio: 'https://ana-k.dev',
          availability: 'Flexible'
        }
      },
      {
        candidateId: 'de006',
        candidateName: 'Raj Patel',
        score: 85,
        reasoning: 'Solid match: MongoDB knowledge, TypeScript experience, cloud data solutions',
        candidate: {
          id: 'de006',
          fullName: 'Raj Patel',
          email: 'raj.patel@clouddata.uk',
          currentTitle: 'Cloud Data Engineer',
          experienceYears: 5,
          technicalSkills: ['MongoDB', 'TypeScript', 'Oracle SQL', 'Python', 'AWS Redshift', 'Terraform', 'Apache Spark', 'Pandas'],
          currentLocation: 'London, UK',
          summary: 'Cloud data engineer with experience migrating legacy systems to modern data stacks. MongoDB and TypeScript expert.',
          portfolio: 'https://rajpatel.tech',
          availability: 'Available immediately'
        }
      },
      {
        candidateId: 'de007',
        candidateName: 'Sophie Dubois',
        score: 83,
        reasoning: 'Good technical alignment: MongoDB familiarity, TypeScript skills, French-speaking',
        candidate: {
          id: 'de007',
          fullName: 'Sophie Dubois',
          email: 'sophie.dubois@datatech.fr',
          currentTitle: 'Data Engineer',
          experienceYears: 3,
          technicalSkills: ['MongoDB', 'TypeScript', 'MySQL', 'Python', 'Apache Kafka', 'Docker', 'GCP', 'Dataflow'],
          currentLocation: 'Lyon, France',
          summary: 'Data engineer with strong foundations in NoSQL databases and modern web technologies. Bilingual French/English.',
          portfolio: 'https://sophiedubois.fr',
          availability: '3 weeks notice'
        }
      },
      {
        candidateId: 'de008',
        candidateName: 'Thomas Müller',
        score: 81,
        reasoning: 'Decent match: MongoDB basics, TypeScript knowledge, growing data engineering experience',
        candidate: {
          id: 'de008',
          fullName: 'Thomas Müller',
          email: 'thomas.mueller@techstack.de',
          currentTitle: 'Junior Data Engineer',
          experienceYears: 2,
          technicalSkills: ['MongoDB', 'TypeScript', 'SQLite', 'Node.js', 'Vue.js', 'Docker', 'GitLab CI', 'Prometheus'],
          currentLocation: 'Munich, Germany',
          summary: 'Junior data engineer with solid fundamentals and eagerness to learn. Growing expertise in MongoDB and TypeScript.',
          portfolio: 'https://thomasmueller.dev',
          availability: 'Available now'
        }
      },
      {
        candidateId: 'de009',
        candidateName: 'Isabella Romano',
        score: 79,
        reasoning: 'Potential fit: Some MongoDB exposure, TypeScript basics, data analysis background',
        candidate: {
          id: 'de009',
          fullName: 'Isabella Romano',
          email: 'isabella.romano@dataanalyst.it',
          currentTitle: 'Data Analyst',
          experienceYears: 3,
          technicalSkills: ['MongoDB', 'TypeScript', 'PostgreSQL', 'Python', 'Tableau', 'Power BI', 'Jupyter', 'Pandas'],
          currentLocation: 'Milan, Italy',
          summary: 'Data analyst transitioning to data engineering. Basic MongoDB and TypeScript skills with strong analytical foundation.',
          portfolio: 'https://isabellaromano.it',
          availability: '1 month notice'
        }
      },
      {
        candidateId: 'de010',
        candidateName: 'Kevin Anderson',
        score: 76,
        reasoning: 'Entry-level match: Basic MongoDB knowledge, learning TypeScript, fresh perspective',
        candidate: {
          id: 'de010',
          fullName: 'Kevin Anderson',
          email: 'kevin.anderson@bootcamp.com',
          currentTitle: 'Junior Software Developer',
          experienceYears: 1,
          technicalSkills: ['MongoDB', 'TypeScript', 'JavaScript', 'Express.js', 'HTML/CSS', 'Git', 'VS Code', 'Postman'],
          currentLocation: 'Dublin, Ireland',
          summary: 'Recent bootcamp graduate with enthusiasm for data engineering. Learning MongoDB and TypeScript through personal projects.',
          portfolio: 'https://kevinanderson.dev',
          availability: 'Available immediately'
        }
      }
    ];

    // Filter and sort matches based on criteria
    const filteredMatches = mockMatches
      .filter(match => match.score >= validatedData.minScore)
      .slice(0, validatedData.maxCandidates)
      .sort((a, b) => b.score - a.score);

    // Calculate summary statistics
    const totalMatches = filteredMatches.length;
    const averageScore = Math.round(
      filteredMatches.reduce((sum, match) => sum + match.score, 0) / totalMatches
    );

    // Success response with comprehensive data for demo
    return NextResponse.json({
      success: true,
      data: {
        jobId: validatedData.jobId,
        matches: filteredMatches,
        matchCount: totalMatches,
        averageScore: averageScore,
        criteria: {
          skills: ['MongoDB', 'TypeScript', 'SQL'],
          minScore: validatedData.minScore,
          maxCandidates: validatedData.maxCandidates
        },
        summary: {
          highQualityMatches: filteredMatches.filter(m => m.score >= 90).length,
          localCandidates: filteredMatches.filter(m => 
            m.candidate.currentLocation.includes('Switzerland') || 
            m.candidate.currentLocation.includes('Germany') ||
            m.candidate.currentLocation.includes('France')
          ).length,
          seniorCandidates: filteredMatches.filter(m => m.candidate.experienceYears >= 5).length,
          immediatelyAvailable: filteredMatches.filter(m => 
            m.candidate.availability.includes('immediately') || 
            m.candidate.availability.includes('Available now')
          ).length
        }
      },
      metadata: {
        searchQuery: {
          primarySkills: ['MongoDB', 'TypeScript', 'SQL'],
          experienceLevel: 'Mid to Senior',
          location: 'Europe preferred',
          urgency: 'High - immediate start'
        },
        processingTime: '1.2s',
        algorithm: 'AI-powered skills matching v2.1',
        confidence: 'High',
        recommendations: [
          'Consider interviewing top 6 candidates',
          'Sarah Chen and Marcus Weber are perfect matches',
          'Local Swiss talent available for immediate interviews',
          'Strong MongoDB expertise across all top candidates'
        ]
      }
    });

  } catch (error) {
    console.error('Candidate matching error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform candidate matching',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Keep the GET endpoint for compatibility
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'AI Candidate Matching API',
    version: '1.0.0',
    endpoints: {
      POST: 'Perform candidate matching for a job',
    },
    demo: true
  });
} 