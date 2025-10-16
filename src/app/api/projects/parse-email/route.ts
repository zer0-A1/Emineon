// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client (optional for demo)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const parseEmailSchema = z.object({
  emailContent: z.string().min(1, 'Email content is required'),
  emailSubject: z.string().min(1, 'Email subject is required'),
  senderEmail: z.string().email('Valid sender email is required'),
  receivedDate: z.string().optional(),
});

// POST /api/projects/parse-email - Parse email and create project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailContent, emailSubject, senderEmail, receivedDate } = parseEmailSchema.parse(body);

    let parsedData;

    // Try OpenAI first, fallback to rule-based parsing
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are an expert recruitment assistant. Parse the following email to extract project information for a recruitment opportunity. 

Extract the following information and return it as a JSON object:
{
  "projectName": "string - descriptive name for the project",
  "clientName": "string - company/client name",
  "clientContact": "string - contact person name if mentioned",
  "totalPositions": "number - how many positions needed",
  "description": "string - project description and context",
  "location": "string - work location if mentioned",
  "isRemote": "boolean - if remote work is mentioned",
  "isHybrid": "boolean - if hybrid work is mentioned",
  "skillsRequired": "array of strings - technical skills needed",
  "experienceRequired": "array of strings - experience requirements",
  "industryBackground": "string - industry context if mentioned",
  "languageRequirements": "array of strings - language requirements",
  "urgencyLevel": "LOW|MEDIUM|HIGH|CRITICAL - based on timeline/urgency",
  "priority": "LOW|MEDIUM|HIGH|CRITICAL - based on importance indicators",
  "budgetRange": "string - budget/rate information if mentioned",
  "startDate": "string - ISO date if start date mentioned",
  "endDate": "string - ISO date if deadline mentioned",
  "keyRequirements": "array of strings - main requirements",
  "additionalInfo": "string - any other relevant information"
}

Be intelligent about extracting information. For example:
- If email mentions "5 Data Engineers", totalPositions = 5, projectName could be "Data Engineers - [ClientName]"
- Extract specific technologies, frameworks, and skills mentioned
- Infer urgency from words like "urgent", "ASAP", "immediately", etc.
- Look for salary/rate information
- Identify if it's contract, permanent, or not specified
- Extract location details and remote work preferences

Only return the JSON object, no other text.`
            },
            {
              role: "user",
              content: `Email Subject: ${emailSubject}\n\nEmail Content:\n${emailContent}`
            }
          ],
          temperature: 0.1,
        });

        const aiResponse = completion.choices[0]?.message?.content;
        if (aiResponse) {
          parsedData = JSON.parse(aiResponse);
        }
      } catch (error) {
        console.log('OpenAI parsing failed, using rule-based fallback:', error instanceof Error ? error.message : 'Unknown error');
        parsedData = null;
      }
    }

    // Fallback to rule-based parsing if OpenAI is unavailable or failed
    if (!parsedData) {
      parsedData = parseEmailWithRules(emailContent, emailSubject, senderEmail);
    }

    // Create the project with parsed data
    const project = await db.project.create({
      data: {
        name: parsedData.projectName || `Project from ${parsedData.clientName}`,
        description: parsedData.description,
        clientName: parsedData.clientName,
        clientContact: parsedData.clientContact,
        clientEmail: senderEmail,
        totalPositions: parsedData.totalPositions || 1,
        urgencyLevel: parsedData.urgencyLevel || 'MEDIUM',
        priority: parsedData.priority || 'MEDIUM',
        location: parsedData.location,
        isRemote: parsedData.isRemote || false,
        isHybrid: parsedData.isHybrid || false,
        skillsRequired: parsedData.skillsRequired || [],
        experienceRequired: parsedData.experienceRequired || [],
        industryBackground: parsedData.industryBackground,
        languageRequirements: parsedData.languageRequirements || [],
        budgetRange: parsedData.budgetRange,
        startDate: parsedData.startDate && parsedData.startDate !== '' && !isNaN(Date.parse(parsedData.startDate)) ? new Date(parsedData.startDate) : null,
        endDate: parsedData.endDate && parsedData.endDate !== '' && !isNaN(Date.parse(parsedData.endDate)) ? new Date(parsedData.endDate) : null,
        sourceEmail: emailContent,
        sourceEmailSubject: emailSubject,
        sourceEmailDate: receivedDate ? new Date(receivedDate) : new Date(),
        parsedFromEmail: true,
        internalNotes: [
          `Project created from email parsing`,
          `Key requirements: ${parsedData.keyRequirements?.join(', ') || 'Not specified'}`,
          parsedData.additionalInfo || ''
        ].filter(Boolean),
        tags: ['Email Generated', 'Auto-Parsed', parsedData.industryBackground || 'Technology'].filter(Boolean),
        activities: {
          create: [
            {
              type: 'PROJECT_CREATED',
              title: 'Project Created from Email',
              description: `Project automatically created from email: "${emailSubject}"`,
              metadata: {
                source: 'email_parsing',
                senderEmail,
                originalSubject: emailSubject,
                parsedData: parsedData,
                parsingMethod: openai ? 'openai' : 'rule_based'
              }
            },
            {
              type: 'EMAIL_RECEIVED',
              title: 'Client Email Received',
              description: `Email received from ${senderEmail}`,
              metadata: {
                emailSubject,
                emailContent: emailContent.substring(0, 500) + '...',
                senderEmail,
              }
            }
          ]
        }
      },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            jobs: true,
            candidates: true,
            activities: true,
            documents: true,
          }
        }
      }
    });

    // Generate suggested job positions based on the project
    const jobSuggestions = generateJobSuggestionsWithRules(project, parsedData);

    // Automatically create actual Job records for pitch demo
    const createdJobs = [];
    for (const suggestion of jobSuggestions) {
      const job = await db.job.create({
        data: {
          title: suggestion.title,
          description: suggestion.description + '\n\nResponsibilities:\n- ' + suggestion.responsibilities.join('\n- '),
          department: 'Engineering',
          location: parsedData.location || 'Zurich',
          status: 'ACTIVE',
          isRemote: parsedData.isRemote || false,
          projectId: project.id,
          requirements: suggestion.requirements || [],
          responsibilities: suggestion.responsibilities || [],
          benefits: suggestion.benefits || [],
          employmentType: ['FULL_TIME'],
          experienceLevel: suggestion.experienceLevel || 'Mid-level',
          salaryMin: parsedData.budgetRange ? 80000 : null,
          salaryMax: parsedData.budgetRange ? 120000 : null,
          salaryCurrency: 'CHF',
        }
      });
      createdJobs.push(job);
    }

    // Create project activity for job creation
    if (createdJobs.length > 0) {
      await db.projectActivity.create({
        data: {
          projectId: project.id,
          type: 'JOB_CREATED',
          title: 'Jobs Created',
          description: `${createdJobs.length} job position(s) automatically created from email requirements`,
          metadata: {
            jobIds: createdJobs.map(j => j.id),
            jobTitles: createdJobs.map(j => j.title),
            source: 'email_parsing_auto_creation'
          }
        }
      });
    }

    return NextResponse.json({
      project,
      parsedData,
      jobSuggestions,
      createdJobs,
      message: `Project created successfully from email with ${createdJobs.length} job positions`
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error parsing email and creating project:', error);
    return NextResponse.json(
      { error: 'Failed to parse email and create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Rule-based email parsing for demo purposes
function parseEmailWithRules(emailContent: string, emailSubject: string, senderEmail: string) {
  const content = (emailContent + ' ' + emailSubject).toLowerCase();
  
  // Extract company name from email domain
  const emailDomain = senderEmail.split('@')[1];
  let clientName = emailDomain?.split('.')[0] || 'Unknown Client';
  
  // Look for company name mentions in the email
  const companyMatches = emailContent.match(/we are ([^,.\n]+)/i) || 
                         emailContent.match(/company[:\s]+([^,.\n]+)/i) ||
                         emailContent.match(/at ([^,.\n]+)/i);
  if (companyMatches && companyMatches[1]) {
    clientName = companyMatches[1].trim();
  }

  // Extract contact name (often from signature)
  let clientContact = '';
  const nameMatches = emailContent.match(/best regards[,:\s]*\n?([^\n]+)/i) ||
                      emailContent.match(/regards[,:\s]*\n?([^\n]+)/i) ||
                      emailContent.match(/sincerely[,:\s]*\n?([^\n]+)/i);
  if (nameMatches && nameMatches[1]) {
    clientContact = nameMatches[1].trim();
  }

  // Extract number of positions
  const positionMatches = content.match(/(\d+)\s+(data\s+engineers?|developers?|positions?|people|candidates?)/) ||
                          content.match(/(need|require|looking\s+for)\s+(\d+)/) ||
                          content.match(/(\d+)\s+(experienced|senior|junior|mid|positions?)/);
  let totalPositions = 1;
  if (positionMatches) {
    totalPositions = parseInt(positionMatches[1] || positionMatches[2] || '1') || 1;
  }

  // Extract skills (common tech skills)
  const skillsRegex = /(mongodb|typescript|javascript|sql|python|react|node\.?js|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|docker|kubernetes|aws|azure|gcp|mysql|postgresql|redis|elasticsearch|kafka|spark|hadoop|git|jenkins|ci\/cd|agile|scrum|devops|machine\s+learning|ai|data\s+science|etl|big\s+data|cloud|microservices|rest\s+api|graphql|nosql)/gi;
  const skillMatches = emailContent.match(skillsRegex) || [];
  const skillsRequired = Array.from(new Set(skillMatches.map(skill => 
    skill.replace(/\s+/g, ' ').trim()
      .replace(/node\.?js/i, 'Node.js')
      .replace(/mongodb/i, 'MongoDB')
      .replace(/typescript/i, 'TypeScript')
      .replace(/javascript/i, 'JavaScript')
      .replace(/sql/i, 'SQL')
  )));

  // Extract experience requirements
  const experienceMatches = emailContent.match(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/gi) ||
                            emailContent.match(/(minimum|min|at least)\s+(\d+)\s*years?/gi) ||
                            emailContent.match(/(senior|junior|mid|experienced|expert|proficient)/gi);
  const experienceRequired = experienceMatches?.map(exp => exp.trim()) || [];
  if (skillsRequired.length > 0 && experienceRequired.length === 0) {
    experienceRequired.push('3+ years experience', 'Professional experience required');
  }

  // Detect urgency
  let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
  if (content.includes('urgent') || content.includes('asap') || content.includes('immediately') || 
      content.includes('rush') || content.includes('critical') || emailSubject.toUpperCase().includes('URGENT')) {
    urgencyLevel = 'HIGH';
  }
  if (content.includes('flexible') || content.includes('when available')) {
    urgencyLevel = 'LOW';
  }

  // Extract location
  let location = '';
  let isRemote = false;
  let isHybrid = false;
  
  const locationMatches = emailContent.match(/(zurich|geneva|basel|bern|lausanne|london|berlin|paris|amsterdam|stockholm|oslo|copenhagen|madrid|barcelona|milan|rome|vienna|prague|budapest|warsaw|dublin|edinburgh|manchester|birmingham|bristol)/gi);
  if (locationMatches) {
    location = locationMatches[0];
  }
  
  if (content.includes('remote') || content.includes('work from home') || content.includes('wfh')) {
    isRemote = true;
  }
  if (content.includes('hybrid') || (content.includes('remote') && content.includes('office'))) {
    isHybrid = true;
  }

  // Extract budget information
  let budgetRange = '';
  const budgetMatches = emailContent.match(/[€$£]\s?(\d{1,3}(?:[,\.]\d{3})*)\s?[-–]\s?[€$£]?\s?(\d{1,3}(?:[,\.]\d{3})*)/g) ||
                        emailContent.match(/budget[:\s]*[€$£]?\s?(\d{1,3}(?:[,\.]\d{3})*)/gi) ||
                        emailContent.match(/salary[:\s]*[€$£]?\s?(\d{1,3}(?:[,\.]\d{3})*)/gi);
  if (budgetMatches) {
    budgetRange = budgetMatches[0];
  }

  // Generate project name and description
  const roleMatch = emailContent.match(/(data\s+engineer|software\s+engineer|developer|analyst|scientist|architect|manager)/gi);
  const primaryRole = roleMatch ? roleMatch[0] : 'Professional';
  const projectName = `${clientName} - ${primaryRole}${totalPositions > 1 ? 's' : ''}`;
  
  const description = `${clientName} is seeking ${totalPositions} ${primaryRole}${totalPositions > 1 ? 's' : ''} with expertise in ${skillsRequired.slice(0, 3).join(', ')}. ${urgencyLevel === 'HIGH' ? 'This is an urgent requirement with immediate start needed.' : 'Looking for qualified professionals to join their growing team.'}`;

  return {
    projectName,
    clientName,
    clientContact,
    totalPositions,
    description,
    location,
    isRemote,
    isHybrid,
    skillsRequired,
    experienceRequired,
    industryBackground: clientName.toLowerCase().includes('bank') || clientName.toLowerCase().includes('finance') ? 'Financial Services' : 'Technology',
    languageRequirements: location?.toLowerCase().includes('zurich') || location?.toLowerCase().includes('switzerland') ? ['English', 'German'] : ['English'],
    urgencyLevel,
    priority: urgencyLevel,
    budgetRange,
    startDate: '',
    endDate: '',
    keyRequirements: skillsRequired.slice(0, 5),
    additionalInfo: `Parsed from email with ${skillsRequired.length} technical skills identified. ${isRemote ? 'Remote work possible.' : ''} ${isHybrid ? 'Hybrid arrangement available.' : ''}`
  };
}

// Rule-based job suggestions for demo
function generateJobSuggestionsWithRules(project: any, parsedData: any) {
  const suggestions = [];
  const totalPositions = project.totalPositions || 1;
  const skills = project.skillsRequired || [];
  
  if (totalPositions === 1) {
    suggestions.push({
      title: `Senior ${skills[0] || 'Technology'} Specialist - ${project.clientName}`,
      description: `Lead ${skills[0] || 'technology'} development and implementation for ${project.clientName}. Work with cutting-edge technologies in a dynamic environment.`,
      requirements: project.skillsRequired,
      responsibilities: [
        `Develop and maintain ${skills[0] || 'technology'} solutions`,
        'Collaborate with cross-functional teams',
        'Mentor junior developers',
        'Ensure code quality and best practices'
      ],
      experienceLevel: 'Senior',
      benefits: ['Competitive salary', 'Professional development', 'Modern tech stack', 'Team collaboration'],
      priority: 1
    });
  } else {
    // Multiple positions - create varied roles
    suggestions.push({
      title: `Senior ${skills[0] || 'Technology'} Engineer - ${project.clientName}`,
      description: `Lead ${skills[0] || 'technology'} initiatives and guide technical decisions at ${project.clientName}.`,
      requirements: project.skillsRequired,
      responsibilities: [
        'Lead technical architecture decisions',
        'Mentor team members',
        'Drive best practices implementation',
        'Collaborate on strategic initiatives'
      ],
      experienceLevel: 'Senior',
      benefits: ['Leadership opportunities', 'Competitive package', 'Modern tech stack'],
      priority: 1
    });

    if (totalPositions >= 2) {
      suggestions.push({
        title: `Mid-Level ${skills[0] || 'Technology'} Developer - ${project.clientName}`,
        description: `Contribute to ${skills[0] || 'technology'} development projects at ${project.clientName} with growth opportunities.`,
        requirements: project.skillsRequired.slice(0, 3), // Fewer requirements for mid-level
        responsibilities: [
          'Develop features and functionality',
          'Participate in code reviews',
          'Collaborate with senior team members',
          'Contribute to project planning'
        ],
        experienceLevel: 'Mid-Level',
        benefits: ['Growth opportunities', 'Mentorship program', 'Competitive salary'],
        priority: 2
      });
    }

    if (totalPositions >= 3) {
      suggestions.push({
        title: `${skills[0] || 'Technology'} Specialist - ${project.clientName}`,
        description: `Specialized role focusing on ${skills.slice(0, 2).join(' and ')} development at ${project.clientName}.`,
        requirements: project.skillsRequired.slice(0, 4),
        responsibilities: [
          `Focus on ${skills[0] || 'technology'} implementation`,
          'Support technical solutions',
          'Learn and adapt to new technologies',
          'Contribute to team objectives'
        ],
        experienceLevel: 'Mid-Level to Senior',
        benefits: ['Specialization opportunities', 'Professional development', 'Team environment'],
        priority: 2
      });
    }
  }

  return suggestions;
}

// Legacy OpenAI function (kept for compatibility if API key is added later)
async function generateJobSuggestions(project: any, parsedData: any) {
  if (!openai) {
    return generateJobSuggestionsWithRules(project, parsedData);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Based on the project information, suggest specific job positions that should be created. 

Return a JSON array of job suggestions with this structure:
[
  {
    "title": "string - specific job title",
    "description": "string - detailed job description",
    "requirements": "array of strings - specific requirements for this role",
    "responsibilities": "array of strings - key responsibilities",
    "experienceLevel": "string - Junior/Mid/Senior/Lead/etc",
    "benefits": "array of strings - benefits to highlight",
    "priority": "number - 1-5, where 1 is highest priority"
  }
]

For example, if the project needs "5 Data Engineers", you might suggest:
- Senior Data Engineer (2 positions)
- Mid-Level Data Engineer (2 positions) 
- Junior Data Engineer (1 position)

Or if it's more specific, create role variations based on the requirements.`
        },
        {
          role: "user",
          content: `Project: ${project.name}
Client: ${project.clientName}
Total Positions: ${project.totalPositions}
Skills Required: ${project.skillsRequired.join(', ')}
Experience Required: ${project.experienceRequired.join(', ')}
Industry: ${project.industryBackground || 'Not specified'}
Description: ${project.description || 'Not provided'}

Additional Context: ${parsedData.additionalInfo || 'None'}`
        }
      ],
      temperature: 0.3,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (aiResponse) {
      try {
        return JSON.parse(aiResponse);
      } catch (error) {
        console.error('Failed to parse job suggestions:', aiResponse);
      }
    }
  } catch (error) {
    console.error('Error generating job suggestions:', error);
  }

  // Fallback to rule-based suggestions
  return generateJobSuggestionsWithRules(project, parsedData);
} 