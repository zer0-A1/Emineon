import OpenAI from 'openai';

// Lazy initialization to prevent build-time errors
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required for CV parsing');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface JobGenerationInput {
  title: string;
  department: string;
  location: string;
  experienceLevel?: string;
  keyRequirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  salaryRange?: string;
  isRemote?: boolean;
}

export interface GeneratedJobDescription {
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  tags: string[];
}

export interface CandidateRankingInput {
  jobDescription: string;
  candidates: Array<{
    id: string;
    fullName: string;
    currentTitle?: string;
    technicalSkills: string[];
    experienceYears?: number;
  }>;
}

export interface CandidateRanking {
  candidateId: string;
  score: number;
  reasoning: string;
}

export interface EmailTemplateInput {
  templateType: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  tone: string;
  customInstructions?: string;
  includeJobDetails?: boolean;
  includeCompanyInfo?: boolean;
}

export interface GeneratedEmailTemplate {
  subject: string;
  body: string;
  templateType: string;
  tone: string;
}

class OpenAIService {
  async generateJobDescription(input: JobGenerationInput): Promise<GeneratedJobDescription> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.log('No OpenAI API key found, returning mock job description');
        return this.getMockJobDescription(input);
      }

      const prompt = `Generate a comprehensive job description for the following position:

Title: ${input.title}
Department: ${input.department}
Location: ${input.location}
${input.experienceLevel ? `Experience Level: ${input.experienceLevel}` : ''}
${input.isRemote ? 'Remote Work: Available' : ''}
${input.salaryRange ? `Salary Range: ${input.salaryRange}` : ''}

Key Requirements:
${input.keyRequirements?.map(req => `- ${req}`).join('\n') || '- Relevant experience in the field'}

Please provide a JSON response with the following structure:
{
  "description": "A compelling 2-3 paragraph job description",
  "requirements": ["Array of 5-8 specific requirements"],
  "responsibilities": ["Array of 6-10 key responsibilities"],
  "benefits": ["Array of 4-6 benefits and perks"],
  "tags": ["Array of 3-5 relevant tags/keywords"]
}

Make the content professional, engaging, and specific to the role.`;

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      return {
        description: parsed.description || 'Generated job description',
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
        responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
        benefits: Array.isArray(parsed.benefits) ? parsed.benefits : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      };

    } catch (error) {
      console.error('OpenAI job generation error:', error);
      return this.getMockJobDescription(input);
    }
  }

  async rankCandidates(input: CandidateRankingInput): Promise<CandidateRanking[]> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.log('No OpenAI API key found, returning mock candidate rankings');
        return this.getMockCandidateRankings(input.candidates);
      }

      const candidatesText = input.candidates.map(candidate => 
        `ID: ${candidate.id}
Name: ${candidate.fullName}
Title: ${candidate.currentTitle || 'Not specified'}
Experience: ${candidate.experienceYears || 0} years
Skills: ${candidate.technicalSkills.join(', ')}`
      ).join('\n\n');

      const prompt = `Rank the following candidates for this job based on their fit:

JOB DESCRIPTION:
${input.jobDescription}

CANDIDATES:
${candidatesText}

Please provide a JSON array of rankings with this structure:
[
  {
    "candidateId": "candidate_id",
    "score": 85,
    "reasoning": "Brief explanation of why this candidate is a good/poor fit"
  }
]

Score from 0-100 where:
- 90-100: Excellent fit
- 80-89: Very good fit  
- 70-79: Good fit
- 60-69: Moderate fit
- Below 60: Poor fit

Consider experience level, skills match, and role relevance.`;

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid response format');
      }

      return parsed.map(item => ({
        candidateId: item.candidateId,
        score: Math.min(100, Math.max(0, item.score || 50)),
        reasoning: item.reasoning || 'AI-generated ranking'
      }));

    } catch (error) {
      console.error('OpenAI candidate ranking error:', error);
      return this.getMockCandidateRankings(input.candidates);
    }
  }

  async generateEmailTemplate(input: EmailTemplateInput): Promise<GeneratedEmailTemplate> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.log('No OpenAI API key found, returning mock email template');
        return this.getMockEmailTemplate(input);
      }

      const prompt = `Generate a professional email template with the following specifications:

Template Type: ${input.templateType}
Candidate Name: ${input.candidateName}
Job Title: ${input.jobTitle}
Company Name: ${input.companyName}
Tone: ${input.tone}
${input.customInstructions ? `Custom Instructions: ${input.customInstructions}` : ''}
Include Job Details: ${input.includeJobDetails ? 'Yes' : 'No'}
Include Company Info: ${input.includeCompanyInfo ? 'Yes' : 'No'}

Please provide a JSON response with the following structure:
{
  "subject": "Email subject line",
  "body": "Email body content with proper formatting and placeholders",
  "templateType": "${input.templateType}",
  "tone": "${input.tone}"
}

Guidelines:
- Keep the tone ${input.tone.toLowerCase()}
- Use proper email formatting
- Include relevant placeholders like [CANDIDATE_NAME], [JOB_TITLE], etc.
- Make it engaging and professional
- Ensure the content matches the template type`;

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      return {
        subject: parsed.subject || 'Generated Email Subject',
        body: parsed.body || 'Generated email content',
        templateType: input.templateType,
        tone: input.tone,
      };

    } catch (error) {
      console.error('OpenAI email template generation error:', error);
      return this.getMockEmailTemplate(input);
    }
  }

  private getMockJobDescription(input: JobGenerationInput): GeneratedJobDescription {
    return {
      description: `We are seeking a talented ${input.title} to join our ${input.department} team in ${input.location}. This role offers an exciting opportunity to work with cutting-edge technologies and contribute to innovative projects that make a real impact. The ideal candidate will bring strong technical skills, collaborative spirit, and passion for excellence to our dynamic team environment.`,
      requirements: [
        `${input.experienceLevel || 'Mid-level'} experience in relevant technologies`,
        'Strong problem-solving and analytical skills',
        'Excellent communication and teamwork abilities',
        'Bachelor\'s degree in related field or equivalent experience',
        'Experience with modern development practices and tools'
      ],
      responsibilities: [
        'Design and develop high-quality software solutions',
        'Collaborate with cross-functional teams on project delivery',
        'Participate in code reviews and technical discussions',
        'Contribute to architectural decisions and best practices',
        'Mentor junior team members and share knowledge',
        'Stay current with industry trends and emerging technologies'
      ],
      benefits: [
        'Competitive salary and equity package',
        'Comprehensive health, dental, and vision insurance',
        'Flexible work arrangements and remote options',
        'Professional development and learning opportunities',
        'Generous PTO and company holidays'
      ],
      tags: ['Technology', 'Innovation', 'Growth', 'Collaboration', 'Impact']
    };
  }

  private getMockCandidateRankings(candidates: Array<{ id: string; fullName: string; experienceYears?: number; technicalSkills: string[] }>): CandidateRanking[] {
    // Return mock rankings based on experience and skills match
    return candidates.map(candidate => ({
      candidateId: candidate.id,
      score: Math.min(90, (candidate.experienceYears || 0) * 8 + Math.random() * 20),
      reasoning: `Strong match with ${candidate.experienceYears || 0} years experience and relevant skills: ${candidate.technicalSkills.slice(0, 2).join(', ')}`
    })).sort((a, b) => b.score - a.score);
  }

  private getMockEmailTemplate(input: EmailTemplateInput): GeneratedEmailTemplate {
    const templates = {
      COMMUNICATION: {
        subject: `Exciting ${input.jobTitle} Opportunity at ${input.companyName}`,
        body: `Hi ${input.candidateName},

I hope this email finds you well. I came across your profile and was impressed by your background and experience.

We have an exciting ${input.jobTitle} position at ${input.companyName} that I believe would be a great fit for your skills and career goals.

${input.includeJobDetails ? `This role offers the opportunity to work with cutting-edge technologies and make a significant impact on our growing team.` : ''}

${input.includeCompanyInfo ? `${input.companyName} is a dynamic company focused on innovation and growth, offering excellent benefits and career development opportunities.` : ''}

Would you be interested in learning more about this opportunity? I'd love to schedule a brief call to discuss how this role aligns with your career aspirations.

Best regards,
[YOUR_NAME]
[YOUR_TITLE]
${input.companyName}`
      },
      FOLLOW_UP: {
        subject: `Following up on ${input.jobTitle} opportunity`,
        body: `Hi ${input.candidateName},

I wanted to follow up on our previous conversation regarding the ${input.jobTitle} position at ${input.companyName}.

I hope you've had a chance to consider the opportunity. If you have any questions or would like to discuss next steps, please don't hesitate to reach out.

Looking forward to hearing from you.

Best regards,
[YOUR_NAME]`
      },
      INTERVIEW_INVITE: {
        subject: `Interview Invitation - ${input.jobTitle} at ${input.companyName}`,
        body: `Dear ${input.candidateName},

Thank you for your interest in the ${input.jobTitle} position at ${input.companyName}. We were impressed with your application and would like to invite you for an interview.

Please let us know your availability for the coming week, and we'll schedule a convenient time.

We look forward to speaking with you soon.

Best regards,
[YOUR_NAME]
[YOUR_TITLE]
${input.companyName}`
      },
      REJECTION: {
        subject: `Update on your ${input.jobTitle} application`,
        body: `Dear ${input.candidateName},

Thank you for your interest in the ${input.jobTitle} position at ${input.companyName} and for taking the time to interview with our team.

After careful consideration, we have decided to move forward with another candidate whose experience more closely aligns with our current needs.

We were impressed with your qualifications and encourage you to apply for future opportunities that match your background.

Thank you again for your time and interest in ${input.companyName}.

Best regards,
[YOUR_NAME]`
      },
      OFFER: {
        subject: `Job Offer - ${input.jobTitle} at ${input.companyName}`,
        body: `Dear ${input.candidateName},

Congratulations! We are pleased to extend an offer for the ${input.jobTitle} position at ${input.companyName}.

We believe your skills and experience will be a valuable addition to our team. Please find the detailed offer information attached.

We're excited about the possibility of you joining our team and look forward to your response.

Best regards,
[YOUR_NAME]
[YOUR_TITLE]
${input.companyName}`
      }
    };

    const template = templates[input.templateType as keyof typeof templates] || templates.COMMUNICATION;
    
    return {
      subject: template.subject,
      body: template.body,
      templateType: input.templateType,
      tone: input.tone,
    };
  }

  // Legacy method for backward compatibility
  async parseCV(prompt: string): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return JSON.stringify({
          fullName: 'John Doe',
          email: 'john.doe@email.com',
          phone: '+1-555-0123',
          currentTitle: 'Software Engineer',
          experienceYears: 3,
          technicalSkills: ['JavaScript', 'React', 'Node.js']
        });
      }

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || '{}';
    } catch (error) {
      console.error('OpenAI CV parsing error:', error);
      return JSON.stringify({
        fullName: 'John Doe',
        email: 'john.doe@email.com',
        experienceYears: 3,
        technicalSkills: ['JavaScript', 'React', 'Node.js']
      });
    }
  }
}

export const openaiService = new OpenAIService(); 