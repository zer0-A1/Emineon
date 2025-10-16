import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import OpenAI from 'openai';

export const runtime = 'nodejs';

// Initialize OpenAI (fallback to mock if not configured)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

interface EmailAnalysisRequest {
  subject: string;
  body: string;
  sender: string;
  senderEmail?: string;
}

interface EmailAnalysisResponse {
  emailType: string;
  priority: 'Low' | 'Medium' | 'High';
  confidence: number;
  suggestions: string[];
  summary: string;
  entities: {
    candidates?: string[];
    companies?: string[];
    positions?: string[];
    skills?: string[];
  };
  nextActions: string[];
}

export async function POST(request: NextRequest) {
  try {
    // For Outlook add-in, we'll allow unauthenticated requests
    // In production, you might want to implement API key authentication
    
    const body: EmailAnalysisRequest = await request.json();
    const { subject, body: emailBody, sender, senderEmail } = body;

    if (!subject && !emailBody) {
      return NextResponse.json(
        { error: 'Subject or body is required' },
        { status: 400 }
      );
    }

    // Perform AI analysis
    const analysis = await analyzeEmail({
      subject: subject || '',
      body: emailBody || '',
      sender: sender || '',
      senderEmail: senderEmail || ''
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in email analysis:', error);
    
    // Return fallback analysis
    const fallbackAnalysis = getFallbackAnalysis({});
    return NextResponse.json(fallbackAnalysis);
  }
}

async function analyzeEmail(emailData: EmailAnalysisRequest): Promise<EmailAnalysisResponse> {
  const content = `${emailData.subject} ${emailData.body}`.toLowerCase();
  
  try {
    if (openai) {
      // Use OpenAI for intelligent analysis
      const prompt = `
        Analyze this recruitment-related email and provide structured insights:
        
        Subject: ${emailData.subject}
        From: ${emailData.sender}
        Body: ${emailData.body}
        
        Please analyze and respond with:
        1. Email type (Candidate Application, Job Inquiry, Interview Request, Client Communication, General)
        2. Priority level (Low, Medium, High)
        3. Key entities (candidate names, company names, job positions, skills mentioned)
        4. Suggested next actions
        5. Brief summary
        
        Focus on recruitment and talent acquisition context.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant specialized in recruitment and talent acquisition. Analyze emails to help recruiters identify opportunities and next actions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const aiResponse = completion.choices[0]?.message?.content || '';
      return parseAIResponse(aiResponse, emailData);
    }
  } catch (aiError) {
    console.log('OpenAI unavailable, using rule-based analysis');
  }

  // Fallback to rule-based analysis
  return getRuleBasedAnalysis(emailData);
}

function parseAIResponse(aiResponse: string, emailData: EmailAnalysisRequest): EmailAnalysisResponse {
  // Parse AI response and extract structured data
  // This is a simplified parser - in production you'd want more robust parsing
  
  const lines = aiResponse.split('\n').filter(line => line.trim());
  
  let emailType = 'General';
  let priority: 'Low' | 'Medium' | 'High' = 'Medium';
  let summary = 'AI analysis of recruitment email';
  const suggestions: string[] = [];
  const nextActions: string[] = [];
  const entities = {
    candidates: [] as string[],
    companies: [] as string[],
    positions: [] as string[],
    skills: [] as string[]
  };

  // Extract information from AI response
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    if (lower.includes('email type') || lower.includes('type:')) {
      if (lower.includes('candidate')) emailType = 'Candidate Application';
      else if (lower.includes('job') || lower.includes('inquiry')) emailType = 'Job Inquiry';
      else if (lower.includes('interview')) emailType = 'Interview Request';
      else if (lower.includes('client')) emailType = 'Client Communication';
    }
    
    if (lower.includes('priority') || lower.includes('priority:')) {
      if (lower.includes('high')) priority = 'High';
      else if (lower.includes('low')) priority = 'Low';
      else priority = 'Medium';
    }
    
    if (lower.includes('action') || lower.includes('suggest')) {
      nextActions.push(line.trim());
    }
  }

  // Generate suggestions based on email type
  const typeSuggestions = generateSuggestionsByType(emailType);
  suggestions.push(...typeSuggestions);

  return {
    emailType,
    priority,
    confidence: 0.85,
    suggestions,
    summary,
    entities,
    nextActions: nextActions.length > 0 ? nextActions : generateNextActions(emailType)
  };
}

function getRuleBasedAnalysis(emailData: EmailAnalysisRequest): EmailAnalysisResponse {
  const content = `${emailData.subject} ${emailData.body}`.toLowerCase();
  
  // Determine email type using keywords
  let emailType = 'General';
  if (content.includes('cv') || content.includes('resume') || content.includes('application')) {
    emailType = 'Candidate Application';
  } else if (content.includes('job') || content.includes('position') || content.includes('role') || content.includes('opening')) {
    emailType = 'Job Inquiry';
  } else if (content.includes('interview') || content.includes('meeting') || content.includes('schedule')) {
    emailType = 'Interview Request';
  } else if (content.includes('client') || content.includes('project') || content.includes('requirement')) {
    emailType = 'Client Communication';
  }

  // Determine priority
  let priority: 'Low' | 'Medium' | 'High' = 'Medium';
  if (content.includes('urgent') || content.includes('asap') || content.includes('immediately') || content.includes('deadline')) {
    priority = 'High';
  } else if (content.includes('when you have time') || content.includes('no rush') || content.includes('whenever')) {
    priority = 'Low';
  }

  // Extract entities
  const entities = extractEntities(emailData);
  
  // Generate suggestions
  const suggestions = generateSuggestionsByType(emailType);
  
  // Generate next actions
  const nextActions = generateNextActions(emailType);
  
  // Generate summary
  const summary = generateSummary(emailType, emailData.sender);

  return {
    emailType,
    priority,
    confidence: 0.75,
    suggestions,
    summary,
    entities,
    nextActions
  };
}

function extractEntities(emailData: EmailAnalysisRequest) {
  const content = `${emailData.subject} ${emailData.body}`;
  const entities = {
    candidates: [] as string[],
    companies: [] as string[],
    positions: [] as string[],
    skills: [] as string[]
  };

  // Extract potential candidate names (simple heuristic)
  if (emailData.sender && !emailData.sender.includes('@')) {
    entities.candidates.push(emailData.sender);
  }

  // Extract company names (common patterns)
  const companyPatterns = [
    /\b([A-Z][a-z]+ (?:Inc|Corp|Ltd|LLC|GmbH|AG|SA))\b/g,
    /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g
  ];
  
  companyPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      entities.companies.push(...matches.slice(0, 3)); // Limit to 3
    }
  });

  // Extract job positions
  const positionKeywords = [
    'developer', 'engineer', 'manager', 'director', 'analyst', 'designer',
    'consultant', 'specialist', 'coordinator', 'lead', 'senior', 'junior',
    'architect', 'administrator', 'technician', 'representative'
  ];
  
  positionKeywords.forEach(keyword => {
    if (content.toLowerCase().includes(keyword)) {
      // Find the full job title around the keyword
      const regex = new RegExp(`\\b\\w*\\s*${keyword}\\s*\\w*\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        entities.positions.push(...matches.slice(0, 3));
      }
    }
  });

  // Extract technical skills
  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'react', 'node.js',
    'sql', 'mongodb', 'aws', 'azure', 'docker', 'kubernetes',
    'machine learning', 'data analysis', 'project management',
    'agile', 'scrum', 'devops', 'ci/cd', 'git'
  ];
  
  skillKeywords.forEach(skill => {
    if (content.toLowerCase().includes(skill.toLowerCase())) {
      entities.skills.push(skill);
    }
  });

  return entities;
}

function generateSuggestionsByType(emailType: string): string[] {
  switch (emailType) {
    case 'Candidate Application':
      return [
        'Add candidate to database',
        'Parse CV/Resume',
        'Schedule screening call',
        'Review application against open positions'
      ];
    case 'Job Inquiry':
      return [
        'Create job posting',
        'Share job requirements',
        'Schedule consultation',
        'Send job description'
      ];
    case 'Interview Request':
      return [
        'Schedule interview',
        'Prepare interview questions',
        'Send calendar invite',
        'Confirm interview details'
      ];
    case 'Client Communication':
      return [
        'Update project status',
        'Schedule client meeting',
        'Create project task',
        'Review requirements'
      ];
    default:
      return [
        'Add to contacts',
        'Create follow-up task',
        'Categorize communication',
        'Set reminder'
      ];
  }
}

function generateNextActions(emailType: string): string[] {
  switch (emailType) {
    case 'Candidate Application':
      return [
        'Review candidate profile',
        'Check against open positions',
        'Schedule initial screening'
      ];
    case 'Job Inquiry':
      return [
        'Prepare job description',
        'Assess client requirements',
        'Schedule discovery call'
      ];
    case 'Interview Request':
      return [
        'Confirm availability',
        'Prepare interview materials',
        'Send meeting details'
      ];
    case 'Client Communication':
      return [
        'Review project requirements',
        'Update project timeline',
        'Prepare status report'
      ];
    default:
      return [
        'Categorize and file',
        'Set appropriate follow-up',
        'Add to CRM system'
      ];
  }
}

function generateSummary(emailType: string, sender: string): string {
  const senderName = sender || 'Contact';
  
  switch (emailType) {
    case 'Candidate Application':
      return `Candidate application received from ${senderName}. Review profile and assess fit for open positions.`;
    case 'Job Inquiry':
      return `Job inquiry from ${senderName}. Potential new opportunity requiring assessment and follow-up.`;
    case 'Interview Request':
      return `Interview-related communication from ${senderName}. Coordinate scheduling and preparation.`;
    case 'Client Communication':
      return `Client communication from ${senderName}. Review requirements and provide appropriate response.`;
    default:
      return `General recruitment communication from ${senderName}. Categorize and determine next steps.`;
  }
}

function getFallbackAnalysis(emailData: any): EmailAnalysisResponse {
  return {
    emailType: 'General',
    priority: 'Medium',
    confidence: 0.5,
    suggestions: ['Add to contacts', 'Create follow-up task'],
    summary: 'Basic email analysis (AI service unavailable)',
    entities: {
      candidates: [],
      companies: [],
      positions: [],
      skills: []
    },
    nextActions: ['Review email content', 'Determine appropriate action']
  };
} 