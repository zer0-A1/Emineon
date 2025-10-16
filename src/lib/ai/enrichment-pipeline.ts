import { CandidateData } from '@/types';
import { promptModules, PromptContext, PromptModule } from '@/lib/prompts';
import { z } from 'zod';

// Enhanced candidate data schema for validation
const EnhancedCandidateSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1),
  currentTitle: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  photo: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  summary: z.string().min(50).optional(),
  skills: z.array(z.string()).min(1),
  certifications: z.array(z.string()),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    responsibilities: z.string().min(10)
  })),
  education: z.array(z.string()),
  languages: z.array(z.string())
});

export interface EnrichmentOptions {
  jobDescription?: string;
  clientName?: string;
  industryFocus?: string;
  tone?: 'professional' | 'consulting' | 'technical' | 'creative';
  targetAudience?: 'hr' | 'technical' | 'executive' | 'client';
  enableTranslation?: boolean;
  targetLanguage?: 'french' | 'german' | 'spanish';
  customPrompts?: string[];
}

export interface EnrichmentResult {
  stage: number;
  name: string;
  originalData: any;
  enhancedData: any;
  metrics: {
    tokensUsed: number;
    processingTime: number;
    confidence: number;
  };
  errors?: string[];
}

export interface PipelineResult {
  success: boolean;
  finalData: CandidateData;
  stages: EnrichmentResult[];
  totalTokens: number;
  totalTime: number;
  errors: string[];
}

export class EnrichmentPipeline {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Main pipeline execution - runs all 3 stages sequentially
   */
  async processCandidate(
    candidateData: CandidateData,
    options: EnrichmentOptions = {}
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const stages: EnrichmentResult[] = [];
    const errors: string[] = [];
    let currentData = candidateData;
    let totalTokens = 0;

    const context: PromptContext = {
      candidate: currentData,
      jobDescription: options.jobDescription,
      clientName: options.clientName,
      industryFocus: options.industryFocus,
      tone: options.tone || 'professional',
      targetAudience: options.targetAudience || 'hr'
    };

    try {
      // Stage 1: Data Cleaning and Structuring
      console.log('🔄 Stage 1: Cleaning and structuring data...');
      const stage1Result = await this.executeStage(
        1,
        'Data Cleaning & Structuring',
        promptModules.dataCleaningPrompt,
        context,
        currentData
      );
      stages.push(stage1Result);
      totalTokens += stage1Result.metrics.tokensUsed;
      
      if (stage1Result.enhancedData) {
        currentData = { ...currentData, ...stage1Result.enhancedData };
        context.candidate = currentData;
      }

      // Stage 2: ATS Optimization and Content Enhancement
      console.log('🔄 Stage 2: ATS optimization and content enhancement...');
      const stage2Result = await this.executeStage(
        2,
        'ATS Optimization & Enhancement',
        promptModules.atsFriendlySummaryPrompt,
        context,
        currentData
      );
      stages.push(stage2Result);
      totalTokens += stage2Result.metrics.tokensUsed;

      if (stage2Result.enhancedData) {
        currentData = { ...currentData, ...stage2Result.enhancedData };
        context.candidate = currentData;
      }

      // Stage 3: Final Optimization (Industry + Tone + Soft Skills)
      console.log('🔄 Stage 3: Final optimization and personalization...');
      const stage3Tasks = [
        promptModules.softSkillBoosterPrompt,
        ...(options.industryFocus ? [promptModules.industryOptimizationPrompt] : []),
        ...(options.tone !== 'professional' ? [promptModules.toneAdjustmentPrompt] : [])
      ];

      for (const promptModule of stage3Tasks) {
        const stageResult = await this.executeStage(
          3,
          `Final Optimization: ${promptModule.name}`,
          promptModule,
          context,
          currentData
        );
        stages.push(stageResult);
        totalTokens += stageResult.metrics.tokensUsed;

        if (stageResult.enhancedData) {
          currentData = { ...currentData, ...stageResult.enhancedData };
          context.candidate = currentData;
        }
      }

      // Optional: Translation
      if (options.enableTranslation) {
        console.log('🔄 Translation stage...');
        const translationResult = await this.executeStage(
          4,
          'Translation',
          promptModules.translatePrompt,
          context,
          currentData
        );
        stages.push(translationResult);
        totalTokens += translationResult.metrics.tokensUsed;
      }

      // Validate final data
      const validationResult = this.validateEnhancedData(currentData);
      if (!validationResult.success) {
        errors.push(...validationResult.errors);
      }

      const totalTime = Date.now() - startTime;

      return {
        success: errors.length === 0,
        finalData: currentData,
        stages,
        totalTokens,
        totalTime,
        errors
      };

    } catch (error) {
      console.error('Pipeline execution failed:', error);
      errors.push(`Pipeline failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        finalData: candidateData, // Return original data on failure
        stages,
        totalTokens,
        totalTime: Date.now() - startTime,
        errors
      };
    }
  }

  /**
   * Execute a single pipeline stage
   */
  private async executeStage(
    stageNumber: number,
    stageName: string,
    promptModule: PromptModule,
    context: PromptContext,
    currentData: any
  ): Promise<EnrichmentResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.callOpenAI(promptModule, context);
      const processingTime = Date.now() - startTime;

      return {
        stage: stageNumber,
        name: stageName,
        originalData: JSON.parse(JSON.stringify(currentData)), // Deep clone
        enhancedData: response.data,
        metrics: {
          tokensUsed: response.usage?.total_tokens || 0,
          processingTime,
          confidence: this.calculateConfidence(response)
        }
      };

    } catch (error) {
      console.error(`Stage ${stageNumber} failed:`, error);
      return {
        stage: stageNumber,
        name: stageName,
        originalData: currentData,
        enhancedData: null,
        metrics: {
          tokensUsed: 0,
          processingTime: Date.now() - startTime,
          confidence: 0
        },
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Call OpenAI API with structured prompts
   */
  private async callOpenAI(
    promptModule: PromptModule,
    context: PromptContext
  ): Promise<any> {
    const payload = {
      model: 'gpt-4-1106-preview',
      messages: [
        {
          role: 'system',
          content: promptModule.systemPrompt
        },
        {
          role: 'user', 
          content: promptModule.userPrompt(context)
        }
      ],
      max_tokens: promptModule.maxTokens || 800,
      temperature: promptModule.temperature || 0.3,
      response_format: { type: 'json_object' }
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    try {
      const parsedContent = JSON.parse(result.choices[0].message.content);
      return {
        data: parsedContent,
        usage: result.usage
      };
    } catch (parseError) {
      throw new Error(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  }

  /**
   * Calculate confidence score based on response quality
   */
  private calculateConfidence(response: any): number {
    // Simple heuristic - can be made more sophisticated
    const finishReason = response.choices?.[0]?.finish_reason;
    const hasContent = response.choices?.[0]?.message?.content?.length > 50;
    
    if (finishReason === 'stop' && hasContent) {
      return 0.9;
    } else if (finishReason === 'length') {
      return 0.7;
    } else {
      return 0.3;
    }
  }

  /**
   * Validate enhanced data against schema
   */
  private validateEnhancedData(data: any): { success: boolean; errors: string[] } {
    try {
      EnhancedCandidateSchema.parse(data);
      return { success: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return { success: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Quick single-prompt enhancement for inline suggestions
   */
  async quickEnhance(
    content: string,
    promptType: keyof typeof promptModules,
    context: Partial<PromptContext> = {}
  ): Promise<{ enhanced: string; tokensUsed: number }> {
    const promptModule = promptModules[promptType];
    const mockCandidate: CandidateData = {
      id: 'temp',
      fullName: 'Candidate',
      currentTitle: 'Professional',
      skills: [],
      certifications: [],
      experience: [],
      education: [],
      languages: [],
      summary: content
    };

    const fullContext: PromptContext = {
      candidate: mockCandidate,
      tone: 'professional',
      targetAudience: 'hr',
      ...context
    };

    try {
      const response = await this.callOpenAI(promptModule, fullContext);
      return {
        enhanced: response.data.summary || response.data.content || content,
        tokensUsed: response.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error('Quick enhance failed:', error);
      return { enhanced: content, tokensUsed: 0 };
    }
  }
}

// Export singleton instance
export const enrichmentPipeline = new EnrichmentPipeline(
  process.env.OPENAI_API_KEY || ''
); 