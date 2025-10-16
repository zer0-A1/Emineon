import OpenAI from 'openai';
import { z } from 'zod';
import { addToQueue } from './queue';
import { parseAndValidateJson } from './json-utils';
import { 
  JobAnalysisSchema, 
  EnhancedSummarySchema, 
  SkillsSchema, 
  EnrichedExperienceSchema,
  AreasOfExpertiseSchema,
  OptimizedEducationSchema,
  ValuePropositionSchema,
  CoreCompetenciesSchema,
  TechnicalExpertiseSchema,
  type JobAnalysis,
  type EnhancedSummary,
  type OptimizedSkills,
  type EnrichedExperience,
  type AreasOfExpertise,
  type OptimizedEducation,
  type ValueProposition,
  type CoreCompetencies,
  type TechnicalExpertise
} from './schemas';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CandidateData {
  id: string;
  fullName: string;
  currentTitle: string;
  email?: string;
  phone?: string;
  location?: string;
  yearsOfExperience?: number;
  skills: string[];
  certifications: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    responsibilities: string;
  }>;
  education: string[];
  languages: string[];
  summary?: string;
}

export interface JobDescription {
  text: string;
  requirements: string[];
  skills: string[];
  responsibilities: string[];
  title?: string;
  company?: string;
}

export interface EnrichedContent {
  enhancedSummary: string;
  optimizedSkills: OptimizedSkills;
  enrichedExperience: EnrichedExperience[];
  areasOfExpertise: AreasOfExpertise;
  valueProposition: ValueProposition;
  optimizedEducation: OptimizedEducation;
  optimizedCertifications: string[];
  optimizedCoreCompetencies: CoreCompetencies;
  optimizedTechnicalExpertise: TechnicalExpertise;
}

export class OptimizedCompetenceEnrichmentService {
  
  /**
   * Main enrichment function with p-queue throttling and job analysis injection
   */
  async enrichCandidateForJob(
    candidateData: CandidateData,
    jobDescription?: JobDescription,
    clientName?: string
  ): Promise<EnrichedContent> {
    console.log('🚀 Starting p-queue optimized AI enrichment...');
    const startTime = Date.now();
    
    try {
      // Step 1: Analyze job requirements FIRST (sequential, required for other operations)
      const jobAnalysis = jobDescription 
        ? await this.analyzeJobRequirements(jobDescription)
        : null;
      
      console.log('📊 Job analysis completed, starting parallel enrichment...');
      
      // Step 2: Run all other operations in parallel with job analysis context
      const [
        enhancedSummary,
        optimizedSkills,
        enrichedExperience,
        areasOfExpertise,
        optimizedEducation,
        optimizedCertifications,
        optimizedCoreCompetencies,
        optimizedTechnicalExpertise,
        valueProposition
      ] = await Promise.all([
        this.generateEnhancedSummary(candidateData, jobDescription, clientName),
        this.optimizeSkills(candidateData, jobAnalysis),
        this.enrichWorkExperience(candidateData, jobAnalysis),
        this.generateAreasOfExpertise(candidateData, jobDescription),
        this.optimizeEducation(candidateData, jobDescription),
        this.optimizeCertifications(candidateData, jobDescription),
        this.optimizeCoreCompetencies(candidateData, jobDescription),
        this.optimizeTechnicalExpertise(candidateData, jobDescription),
        this.generateValueProposition(candidateData, jobDescription, clientName)
      ]);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ P-queue optimized AI enrichment completed in ${processingTime}ms`);
      
      return {
        enhancedSummary: enhancedSummary.summary,
        optimizedSkills,
        enrichedExperience,
        areasOfExpertise,
        valueProposition,
        optimizedEducation,
        optimizedCertifications,
        optimizedCoreCompetencies,
        optimizedTechnicalExpertise
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ P-queue AI enrichment failed after ${processingTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Analyze job requirements with p-queue throttling
   */
  private async analyzeJobRequirements(jobDescription: JobDescription): Promise<JobAnalysis> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert job requirements analyst. Analyze the given job description and extract key requirements, skills, and context information.

Return your analysis in the following JSON format:
{
  "coreRequirements": ["requirement1", "requirement2", ...],
  "technicalSkills": ["skill1", "skill2", ...],
  "softSkills": ["skill1", "skill2", ...],
  "experienceLevel": "junior|mid|senior|lead|executive",
  "industryContext": "description of industry context",
  "keyResponsibilities": ["responsibility1", "responsibility2", ...],
  "preferredQualifications": ["qualification1", "qualification2", ...],
  "companyContext": "optional company context",
  "roleComplexity": "junior|mid|senior|lead|executive",
  "urgencyLevel": "low|medium|high|critical"
}`
          },
          {
            role: 'user',
            content: `Job Description: ${jobDescription.text}
            
Additional Details:
- Title: ${jobDescription.title || 'Not specified'}
- Company: ${jobDescription.company || 'Not specified'}
- Requirements: ${jobDescription.requirements.join(', ')}
- Skills: ${jobDescription.skills.join(', ')}
- Responsibilities: ${jobDescription.responsibilities.join(', ')}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return parseAndValidateJson(content, JobAnalysisSchema, 'Job Analysis');
    }, { 
      priority: 'high', 
      operationName: 'Job Requirements Analysis' 
    });
  }

  /**
   * Generate enhanced summary with p-queue throttling
   */
  private async generateEnhancedSummary(
    candidateData: CandidateData,
    jobDescription?: JobDescription,
    clientName?: string
  ): Promise<EnhancedSummary> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume writer specializing in professional summaries. Create a compelling professional summary that highlights the candidate's key strengths and value proposition.

Return your response in the following JSON format:
{
  "summary": "Professional summary text",
  "keyStrengths": ["strength1", "strength2", ...],
  "valueProposition": "What unique value does this candidate bring",
  "clientAlignment": "How this candidate aligns with client needs (if applicable)"
}`
          },
          {
            role: 'user',
            content: `Candidate: ${candidateData.fullName}
Current Title: ${candidateData.currentTitle}
Years of Experience: ${candidateData.yearsOfExperience || 'Not specified'}
Skills: ${candidateData.skills.join(', ')}
Current Summary: ${candidateData.summary || 'Not provided'}
${jobDescription ? `\nJob Title: ${jobDescription.title}\nJob Requirements: ${jobDescription.requirements.join(', ')}` : ''}
${clientName ? `\nClient: ${clientName}` : ''}`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return parseAndValidateJson(content, EnhancedSummarySchema, 'Enhanced Summary');
    }, { 
      priority: 'normal', 
      operationName: 'Enhanced Summary Generation' 
    });
  }

  /**
   * Optimize skills with job analysis context
   */
  private async optimizeSkills(candidateData: CandidateData, jobAnalysis: JobAnalysis | null): Promise<OptimizedSkills> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert skills categorizer. Organize candidate skills into relevant categories and optimize them for professional presentation.

Return your response in the following JSON format:
{
  "technical": ["skill1", "skill2", ...],
  "functional": ["skill1", "skill2", ...],
  "leadership": ["skill1", "skill2", ...],
  "industry": ["skill1", "skill2", ...],
  "tools": ["tool1", "tool2", ...]
}`
          },
          {
            role: 'user',
            content: `Candidate Skills: ${candidateData.skills.join(', ')}
Current Title: ${candidateData.currentTitle}
${jobAnalysis ? `\nJob Requirements: ${jobAnalysis.coreRequirements.join(', ')}
Technical Skills Needed: ${jobAnalysis.technicalSkills.join(', ')}
Soft Skills Needed: ${jobAnalysis.softSkills.join(', ')}` : ''}`
          }
        ],
        temperature: 0.5,
        max_tokens: 600,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return parseAndValidateJson(content, SkillsSchema, 'Skills Optimization');
    }, { 
      priority: 'normal', 
      operationName: 'Skills Optimization' 
    });
  }

  /**
   * Enrich work experience with job analysis context
   */
  private async enrichWorkExperience(candidateData: CandidateData, jobAnalysis: JobAnalysis | null): Promise<EnrichedExperience[]> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at enhancing work experience descriptions. Transform basic job descriptions into compelling, achievement-focused narratives.

Return your response as a JSON array of experience objects:
[
  {
    "company": "Company Name",
    "title": "Job Title",
    "period": "Start Date - End Date",
    "enhancedDescription": "Enhanced description with achievements",
    "keyAchievements": ["achievement1", "achievement2", ...],
    "technicalEnvironment": ["tech1", "tech2", ...],
    "responsibilities": ["responsibility1", "responsibility2", ...],
    "businessImpact": "Impact on business outcomes",
    "teamSize": 5,
    "budget": "Budget managed (if applicable)"
  }
]`
          },
          {
            role: 'user',
            content: `Candidate Experience:
${candidateData.experience.map(exp => `
Company: ${exp.company}
Title: ${exp.title}
Period: ${exp.startDate} - ${exp.endDate}
Responsibilities: ${exp.responsibilities}
`).join('\n---\n')}

Current Title: ${candidateData.currentTitle}
${jobAnalysis ? `\nJob Context: ${jobAnalysis.industryContext}
Key Responsibilities Expected: ${jobAnalysis.keyResponsibilities.join(', ')}` : ''}`
          }
        ],
        temperature: 0.6,
        max_tokens: 1200,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      const experiences = parseAndValidateJson(content, EnrichedExperienceSchema.array(), 'Work Experience Enrichment');
      return experiences;
    }, { 
      priority: 'normal', 
      operationName: 'Work Experience Enrichment' 
    });
  }

  /**
   * Generate areas of expertise
   */
  private async generateAreasOfExpertise(candidateData: CandidateData, jobDescription?: JobDescription): Promise<AreasOfExpertise> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at identifying professional areas of expertise. Analyze the candidate's background and identify their core areas of expertise.

Return your response in the following JSON format:
{
  "primary": ["area1", "area2", ...],
  "secondary": ["area1", "area2", ...],
  "emerging": ["area1", "area2", ...],
  "industrySpecific": ["area1", "area2", ...]
}`
          },
          {
            role: 'user',
            content: `Candidate: ${candidateData.fullName}
Current Title: ${candidateData.currentTitle}
Skills: ${candidateData.skills.join(', ')}
Experience: ${candidateData.experience.map(exp => `${exp.title} at ${exp.company}`).join(', ')}
${jobDescription ? `\nTarget Role: ${jobDescription.title}` : ''}`
          }
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return parseAndValidateJson(content, AreasOfExpertiseSchema, 'Areas of Expertise');
    }, { 
      priority: 'normal', 
      operationName: 'Areas of Expertise Generation' 
    });
  }

  /**
   * Optimize education
   */
  private async optimizeEducation(candidateData: CandidateData, jobDescription?: JobDescription): Promise<OptimizedEducation> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at presenting educational background in the most compelling way. Optimize the candidate's education for professional presentation.

Return your response in the following JSON format:
{
  "formal": ["education1", "education2", ...],
  "certifications": ["cert1", "cert2", ...],
  "continuousLearning": ["learning1", "learning2", ...],
  "relevanceToRole": "How education is relevant to the target role"
}`
          },
          {
            role: 'user',
            content: `Education: ${candidateData.education.join(', ')}
Certifications: ${candidateData.certifications.join(', ')}
Current Title: ${candidateData.currentTitle}
${jobDescription ? `\nTarget Role: ${jobDescription.title}` : ''}`
          }
        ],
        temperature: 0.4,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return parseAndValidateJson(content, OptimizedEducationSchema, 'Education Optimization');
    }, { 
      priority: 'normal', 
      operationName: 'Education Optimization' 
    });
  }

  /**
   * Optimize certifications
   */
  private async optimizeCertifications(candidateData: CandidateData, jobDescription?: JobDescription): Promise<string[]> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at presenting certifications in the most compelling way. Optimize and prioritize the candidate's certifications.

Return your response as a JSON array of strings:
["certification1", "certification2", ...]`
          },
          {
            role: 'user',
            content: `Certifications: ${candidateData.certifications.join(', ')}
Current Title: ${candidateData.currentTitle}
${jobDescription ? `\nTarget Role: ${jobDescription.title}` : ''}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return parseAndValidateJson(content, z.string().array(), 'Certifications Optimization');
    }, { 
      priority: 'normal', 
      operationName: 'Certifications Optimization' 
    });
  }

  /**
   * Optimize core competencies
   */
  private async optimizeCoreCompetencies(candidateData: CandidateData, jobDescription?: JobDescription): Promise<CoreCompetencies> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at identifying core competencies. Analyze the candidate's background and identify their key competencies across different areas.

Return your response in the following JSON format:
{
  "technical": ["competency1", "competency2", ...],
  "business": ["competency1", "competency2", ...],
  "interpersonal": ["competency1", "competency2", ...],
  "strategic": ["competency1", "competency2", ...]
}`
          },
          {
            role: 'user',
            content: `Candidate: ${candidateData.fullName}
Current Title: ${candidateData.currentTitle}
Skills: ${candidateData.skills.join(', ')}
Experience: ${candidateData.experience.map(exp => `${exp.title} at ${exp.company}`).join(', ')}
${jobDescription ? `\nTarget Role: ${jobDescription.title}` : ''}`
          }
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return parseAndValidateJson(content, CoreCompetenciesSchema, 'Core Competencies');
    }, { 
      priority: 'normal', 
      operationName: 'Core Competencies Optimization' 
    });
  }

  /**
   * Optimize technical expertise
   */
  private async optimizeTechnicalExpertise(candidateData: CandidateData, jobDescription?: JobDescription): Promise<TechnicalExpertise> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at categorizing technical expertise. Organize the candidate's technical skills into relevant categories.

Return your response in the following JSON format:
{
  "languages": ["language1", "language2", ...],
  "frameworks": ["framework1", "framework2", ...],
  "tools": ["tool1", "tool2", ...],
  "platforms": ["platform1", "platform2", ...],
  "methodologies": ["methodology1", "methodology2", ...],
  "databases": ["database1", "database2", ...],
  "cloudServices": ["service1", "service2", ...]
}`
          },
          {
            role: 'user',
            content: `Technical Skills: ${candidateData.skills.join(', ')}
Current Title: ${candidateData.currentTitle}
${jobDescription ? `\nTarget Role: ${jobDescription.title}
Technical Requirements: ${jobDescription.skills.join(', ')}` : ''}`
          }
        ],
        temperature: 0.4,
        max_tokens: 600,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return parseAndValidateJson(content, TechnicalExpertiseSchema, 'Technical Expertise');
    }, { 
      priority: 'normal', 
      operationName: 'Technical Expertise Optimization' 
    });
  }

  /**
   * Generate value proposition
   */
  private async generateValueProposition(candidateData: CandidateData, jobDescription?: JobDescription, clientName?: string): Promise<ValueProposition> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating compelling value propositions. Create a strong value proposition that highlights what makes this candidate unique and valuable.

Return your response in the following JSON format:
{
  "summary": "Overall value proposition summary",
  "uniqueStrengths": ["strength1", "strength2", ...],
  "clientBenefit": "What benefit does this bring to the client",
  "differentiators": ["differentiator1", "differentiator2", ...],
  "roi": "Expected return on investment description"
}`
          },
          {
            role: 'user',
            content: `Candidate: ${candidateData.fullName}
Current Title: ${candidateData.currentTitle}
Experience: ${candidateData.yearsOfExperience} years
Skills: ${candidateData.skills.join(', ')}
${jobDescription ? `\nTarget Role: ${jobDescription.title}` : ''}
${clientName ? `\nClient: ${clientName}` : ''}`
          }
        ],
        temperature: 0.7,
        max_tokens: 600,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return parseAndValidateJson(content, ValuePropositionSchema, 'Value Proposition');
    }, { 
      priority: 'normal', 
      operationName: 'Value Proposition Generation' 
    });
  }
} 