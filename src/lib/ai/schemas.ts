import { z } from 'zod';

// Job Analysis Schema
export const JobAnalysisSchema = z.object({
  coreRequirements: z.array(z.string()),
  technicalSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  experienceLevel: z.string(),
  industryContext: z.string(),
  keyResponsibilities: z.array(z.string()),
  preferredQualifications: z.array(z.string()),
  companyContext: z.string().optional(),
  roleComplexity: z.enum(['junior', 'mid', 'senior', 'lead', 'executive']),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// Enhanced Summary Schema
export const EnhancedSummarySchema = z.object({
  summary: z.string(),
  keyStrengths: z.array(z.string()),
  valueProposition: z.string(),
  clientAlignment: z.string().optional(),
});

// Skills Optimization Schema
export const SkillsSchema = z.object({
  technical: z.array(z.string()),
  functional: z.array(z.string()),
  leadership: z.array(z.string()),
  industry: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
});

// Experience Enrichment Schema
export const EnrichedExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  period: z.string(),
  enhancedDescription: z.string(),
  keyAchievements: z.array(z.string()),
  technicalEnvironment: z.array(z.string()),
  responsibilities: z.array(z.string()),
  businessImpact: z.string().optional(),
  teamSize: z.number().optional(),
  budget: z.string().optional(),
});

// Areas of Expertise Schema
export const AreasOfExpertiseSchema = z.object({
  primary: z.array(z.string()),
  secondary: z.array(z.string()),
  emerging: z.array(z.string()).optional(),
  industrySpecific: z.array(z.string()).optional(),
});

// Education Optimization Schema
export const OptimizedEducationSchema = z.object({
  formal: z.array(z.string()),
  certifications: z.array(z.string()),
  continuousLearning: z.array(z.string()).optional(),
  relevanceToRole: z.string().optional(),
});

// Value Proposition Schema
export const ValuePropositionSchema = z.object({
  summary: z.string(),
  uniqueStrengths: z.array(z.string()),
  clientBenefit: z.string(),
  differentiators: z.array(z.string()),
  roi: z.string().optional(),
});

// Core Competencies Schema
export const CoreCompetenciesSchema = z.object({
  technical: z.array(z.string()),
  business: z.array(z.string()),
  interpersonal: z.array(z.string()),
  strategic: z.array(z.string()).optional(),
});

// Technical Expertise Schema
export const TechnicalExpertiseSchema = z.object({
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  tools: z.array(z.string()),
  platforms: z.array(z.string()),
  methodologies: z.array(z.string()),
  databases: z.array(z.string()).optional(),
  cloudServices: z.array(z.string()).optional(),
});

// Export all schemas as a collection
export const AIResponseSchemas = {
  JobAnalysisSchema,
  EnhancedSummarySchema,
  SkillsSchema,
  EnrichedExperienceSchema,
  AreasOfExpertiseSchema,
  OptimizedEducationSchema,
  ValuePropositionSchema,
  CoreCompetenciesSchema,
  TechnicalExpertiseSchema,
} as const;

// Type exports for TypeScript
export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;
export type EnhancedSummary = z.infer<typeof EnhancedSummarySchema>;
export type OptimizedSkills = z.infer<typeof SkillsSchema>;
export type EnrichedExperience = z.infer<typeof EnrichedExperienceSchema>;
export type AreasOfExpertise = z.infer<typeof AreasOfExpertiseSchema>;
export type OptimizedEducation = z.infer<typeof OptimizedEducationSchema>;
export type ValueProposition = z.infer<typeof ValuePropositionSchema>;
export type CoreCompetencies = z.infer<typeof CoreCompetenciesSchema>;
export type TechnicalExpertise = z.infer<typeof TechnicalExpertiseSchema>; 