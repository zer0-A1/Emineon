import { CandidateData } from '@/types';

export interface PromptContext {
  candidate: CandidateData;
  jobDescription?: string;
  clientName?: string;
  industryFocus?: string;
  tone?: 'professional' | 'consulting' | 'technical' | 'creative';
  targetAudience?: 'hr' | 'technical' | 'executive' | 'client';
}

export interface PromptModule {
  name: string;
  description: string;
  systemPrompt: string;
  userPrompt: (context: PromptContext) => string;
  schema?: any; // For OpenAI function calling
  maxTokens?: number;
  temperature?: number;
}

// Stage 1: Data Cleaning and Structuring
export const dataCleaningPrompt: PromptModule = {
  name: 'Data Cleaning',
  description: 'Clean and structure raw candidate data',
  maxTokens: 1000,
  temperature: 0.1,
  systemPrompt: `You are a professional data processor specializing in candidate profiles. Your task is to:
1. Fix grammar and spelling errors
2. Remove duplicate information
3. Standardize formatting
4. Ensure consistency in dates, locations, and job titles
5. Return clean, structured data without adding new information`,
  
  userPrompt: (context: PromptContext) => `
Please clean and structure this candidate data:

Name: ${context.candidate.fullName}
Title: ${context.candidate.currentTitle}
Summary: ${context.candidate.summary || 'Not provided'}
Skills: ${context.candidate.skills.join(', ')}
Experience: ${JSON.stringify(context.candidate.experience)}
Education: ${context.candidate.education.join(', ')}
Certifications: ${context.candidate.certifications.join(', ')}

Return the cleaned data in the same structure, fixing any grammar, spelling, or formatting issues.
`
};

// Stage 2: ATS-Friendly Enhancement
export const atsFriendlySummaryPrompt: PromptModule = {
  name: 'ATS Optimization',
  description: 'Optimize content for Applicant Tracking Systems',
  maxTokens: 800,
  temperature: 0.3,
  systemPrompt: `You are an ATS optimization expert. Transform candidate summaries to be:
1. Keyword-rich with relevant industry terms
2. Action-oriented with strong verbs
3. Quantified with metrics where possible
4. Formatted for ATS parsing
5. Professional and impactful`,
  
  userPrompt: (context: PromptContext) => `
Optimize this professional summary for ATS systems:

Current Summary: ${context.candidate.summary}
Skills: ${context.candidate.skills.slice(0, 10).join(', ')}
Industry Focus: ${context.industryFocus || 'General'}
Target Role: ${context.candidate.currentTitle}

${context.jobDescription ? `Job Requirements: ${context.jobDescription}` : ''}

Create an ATS-friendly summary that incorporates relevant keywords and showcases achievements.
`
};

// Stage 3: Soft Skills Enhancement
export const softSkillBoosterPrompt: PromptModule = {
  name: 'Soft Skills Enhancement',
  description: 'Enhance and articulate soft skills from experience',
  maxTokens: 600,
  temperature: 0.4,
  systemPrompt: `You are a career coach specializing in soft skills identification. From work experience, extract and articulate:
1. Leadership capabilities
2. Communication skills
3. Problem-solving abilities
4. Team collaboration
5. Adaptability and learning agility
6. Customer focus
7. Strategic thinking

Present these naturally within the context of their achievements.`,
  
  userPrompt: (context: PromptContext) => `
Analyze this work experience and enhance the soft skills presentation:

Experience: ${JSON.stringify(context.candidate.experience)}
Current Role: ${context.candidate.currentTitle}

Identify and articulate the soft skills demonstrated through their work experience.
Return enhanced descriptions that showcase these skills naturally.
`
};

// Translation Module
export const translatePrompt: PromptModule = {
  name: 'Translation',
  description: 'Translate content while maintaining professional tone',
  maxTokens: 1200,
  temperature: 0.2,
  systemPrompt: `You are a professional translator specializing in career documents. Translate content while:
1. Maintaining professional terminology
2. Preserving technical accuracy
3. Adapting cultural context appropriately
4. Keeping the same structure and formatting`,
  
  userPrompt: (context: PromptContext) => `
Translate this candidate profile to French, maintaining professional quality:

Summary: ${context.candidate.summary}
Experience highlights: ${context.candidate.experience.slice(0, 2).map(exp => exp.responsibilities).join('\n')}

Ensure technical terms are accurately translated and the professional tone is maintained.
`
};

// Industry-Specific Optimization
export const industryOptimizationPrompt: PromptModule = {
  name: 'Industry Optimization',
  description: 'Optimize content for specific industry requirements',
  maxTokens: 800,
  temperature: 0.3,
  systemPrompt: `You are an industry specialist who understands the unique requirements, terminology, and expectations of different sectors. Optimize candidate profiles to align with industry standards and expectations.`,
  
  userPrompt: (context: PromptContext) => `
Optimize this candidate profile for the ${context.industryFocus} industry:

Summary: ${context.candidate.summary}
Skills: ${context.candidate.skills.join(', ')}
Experience: ${context.candidate.experience[0]?.responsibilities || 'Not provided'}

Enhance the content with industry-specific terminology, highlight relevant experience, and ensure alignment with ${context.industryFocus} sector expectations.
`
};

// Tone Adjustment Module
export const toneAdjustmentPrompt: PromptModule = {
  name: 'Tone Adjustment',
  description: 'Adjust content tone for specific audiences',
  maxTokens: 600,
  temperature: 0.4,
  systemPrompt: `You are a communications expert who adapts content tone for different professional audiences. Adjust the language, style, and emphasis to match the target audience's expectations and preferences.`,
  
  userPrompt: (context: PromptContext) => `
Adjust this content for a ${context.tone} tone targeting ${context.targetAudience}:

Original Summary: ${context.candidate.summary}
Key Skills: ${context.candidate.skills.slice(0, 8).join(', ')}

Rewrite to match the ${context.tone} tone while maintaining factual accuracy and professionalism.
`
};

// Export all prompt modules
export const promptModules = {
  dataCleaningPrompt,
  atsFriendlySummaryPrompt,
  softSkillBoosterPrompt,
  translatePrompt,
  industryOptimizationPrompt,
  toneAdjustmentPrompt,
} as const;

export type PromptModuleKey = keyof typeof promptModules; 