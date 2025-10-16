import PQueue from 'p-queue';
import { useAIGenerationStore, JobStatus, JobType, generateJobId } from '@/stores/ai-generation-store';

// Types for competence file generation
export interface CandidateData {
  id?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  currentTitle: string;
  email?: string;
  phone?: string;
  location?: string;
  currentLocation?: string;
  yearsOfExperience?: number;
  skills: string[];
  certifications?: string[];
  experience?: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    responsibilities: string;
  }>;
  education?: string[];
  degrees?: string[];
  languages?: string[];
  spokenLanguages?: string[];
  summary?: string;
}

export interface JobDescription {
  title?: string;
  jobTitle?: string;
  company?: string;
  client?: string;
  requirements?: string[];
  skills?: string[];
  responsibilities?: string[];
  text?: string;
}

export interface SectionRequest {
  order: number;
  title: string;
  payload: {
    candidateData: CandidateData;
    jobData?: JobDescription;
  };
}

export interface SectionResult {
  order: number;
  title: string;
  content: string;
  success: boolean;
  error?: string;
  processingTime?: number;
  tokensUsed?: number;
}

export interface CompetenceFileGenerationResult {
  success: boolean;
  sections: SectionResult[];
  totalTime: number;
  totalTokens: number;
  errors: string[];
  sessionId: string;
}

class CompetenceFileQueueService {
  private queue: PQueue;
  
  constructor() {
    // Sequential processing with concurrency: 3 as requested
    this.queue = new PQueue({
      concurrency: 3,
      interval: 1000, // Rate limiting: max 3 requests per second
      intervalCap: 3,
    });
  }

  /**
   * Generate a complete competence file using sequential processing
   */
  async generateCompetenceFile(
    candidateData: CandidateData,
    jobDescription?: JobDescription,
    maxRetries: number = 2
  ): Promise<CompetenceFileGenerationResult> {
    const sessionId = `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    console.log(`🚀 Starting competence file generation - Session: ${sessionId}`);
    console.log(`👤 Candidate: ${candidateData.fullName}`);
    console.log(`🎯 Job: ${jobDescription?.title || 'General Position'}`);

    // Define all sections in the correct order, up to CERTIFICATIONS
    const sections: SectionRequest[] = [
      { order: 0, title: 'HEADER', payload: { candidateData, jobData: jobDescription } },
      { order: 1, title: 'PROFESSIONAL SUMMARY', payload: { candidateData, jobData: jobDescription } },
      { order: 2, title: 'FUNCTIONAL SKILLS', payload: { candidateData, jobData: jobDescription } },
      { order: 3, title: 'TECHNICAL SKILLS', payload: { candidateData, jobData: jobDescription } },
      { order: 4, title: 'LANGUAGES', payload: { candidateData, jobData: jobDescription } },
      { order: 5, title: 'AREAS OF EXPERTISE', payload: { candidateData, jobData: jobDescription } },
      { order: 6, title: 'EDUCATION', payload: { candidateData, jobData: jobDescription } },
      { order: 7, title: 'CERTIFICATIONS', payload: { candidateData, jobData: jobDescription } },
    ];

    // Add individual professional experience sections based on candidate data
    const experienceCount = candidateData.experience?.length || 3; // Default to 3 if no data
    const experienceSections: SectionRequest[] = [];
    for (let i = 0; i < Math.min(experienceCount, 5); i++) { // Max 5 experiences
      experienceSections.push({
        order: 9 + i, // Will be re-ordered after insertion
        title: `PROFESSIONAL EXPERIENCE ${i + 1}`,
        payload: { candidateData, jobData: jobDescription }
      });
    }

    // Insert PROFESSIONAL EXPERIENCES SUMMARY right before the first experience section
    if (experienceSections.length > 0) {
      sections.push({
        order: 8,
        title: 'PROFESSIONAL EXPERIENCES SUMMARY',
        payload: { candidateData, jobData: jobDescription }
      });
      // Add all experience sections after the summary
      experienceSections.forEach((section, idx) => {
        section.order = 9 + idx;
        sections.push(section);
      });
    }

    console.log(`📋 Total sections to generate: ${sections.length}`);

    // After all sections have been added (including experience summary and experiences),
    // sort the sections array by the 'order' property to guarantee correct order
    sections.sort((a, b) => a.order - b.order);

    // Track generation state
    let results: SectionResult[] = [];
    const errors: string[] = [];
    let totalTokens = 0;

    // Create master job for tracking overall progress
    const masterJobId = generateJobId(JobType.COMPETENCE_FILE_GENERATION, sessionId);
    
    useAIGenerationStore.getState().addJob({
      id: masterJobId,
      type: JobType.COMPETENCE_FILE_GENERATION,
      status: JobStatus.IN_PROGRESS,
      progress: {
        percentage: 0,
        message: `Generating ${sections.length} sections for ${candidateData.fullName}`,
        stage: 'initialization',
      },
      retryCount: 0,
      maxRetries,
      priority: 10,
      metadata: {
        sessionId,
        candidateName: candidateData.fullName,
        totalSections: sections.length,
      },
    });

    try {
      // Process all sections with Promise.all for parallel execution within concurrency limits
      const sectionPromises: Promise<SectionResult>[] = sections.map(section => 
        this.queue.add(() => this.generateSection(section, maxRetries, sessionId, masterJobId)) as Promise<SectionResult>
      );

      // Wait for all sections to complete
      const sectionResults = await Promise.all(sectionPromises) as SectionResult[];
      
      // Process results
      for (const result of sectionResults) {
        results.push(result);
        
        if (result.success) {
          totalTokens += result.tokensUsed || 0;
          console.log(`✅ Section ${result.title} completed`);
        } else {
          errors.push(`${result.title}: ${result.error || 'Unknown error'}`);
          console.error(`❌ Section ${result.title} failed:`, result.error);
        }

        // Update progress
        const progress = Math.round((results.length / sections.length) * 100);
        useAIGenerationStore.getState().updateJobProgress(masterJobId, {
          percentage: progress,
          message: `Completed ${results.length}/${sections.length} sections`,
          stage: 'generation',
        });
      }

      const totalTime = Date.now() - startTime;
      const successfulSections = results.filter(r => r.success).length;
      const failed = results.length - successfulSections;

      console.log(`📊 Generation Summary:`);
      console.log(`   ✅ Successful: ${successfulSections}/${sections.length}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   ⏱️ Total Time: ${totalTime}ms`);
      console.log(`   🔤 Total Tokens: ${totalTokens}`);

      // Update master job status
      if (failed === 0) {
        useAIGenerationStore.getState().updateJob(masterJobId, {
          status: JobStatus.COMPLETED,
          result: results,
          completedAt: new Date(),
        });
      } else {
        useAIGenerationStore.getState().updateJob(masterJobId, {
          status: JobStatus.FAILED,
          error: `${failed} sections failed to generate`,
          completedAt: new Date(),
        });
      }

      // Sort results by order to ensure correct sequence
      results.sort((a, b) => a.order - b.order);

      return {
        success: failed === 0,
        sections: results,
        totalTime,
        totalTokens,
        errors,
        sessionId,
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`💥 Competence file generation failed:`, errorMessage);
      
      useAIGenerationStore.getState().updateJob(masterJobId, {
        status: JobStatus.FAILED,
        error: errorMessage,
        completedAt: new Date(),
      });

      errors.push(errorMessage);

      return {
        success: false,
        sections: results,
        totalTime,
        totalTokens,
        errors,
        sessionId,
      };
    }
  }

  /**
   * Generate a single section with retry logic
   */
  private async generateSection(
    section: SectionRequest,
    maxRetries: number,
    sessionId: string,
    masterJobId?: string,
    retryCount: number = 0
  ): Promise<SectionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Generating section: ${section.title} (order: ${section.order})`);
      
      const response = await fetch('/api/openai-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: section.title,
          candidateData: section.payload.candidateData,
          jobData: section.payload.jobData,
          order: section.order,
        }),
      });

      const processingTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }));
        throw new Error(`API error ${response.status}: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Section generation failed');
      }

      if (!result.content || result.content.trim().length === 0) {
        throw new Error('Generated content is empty');
      }

      console.log(`✅ Section ${section.title} generated successfully in ${processingTime}ms`);

      return {
        order: section.order,
        title: section.title,
        content: result.content,
        success: true,
        processingTime,
        tokensUsed: result.tokensUsed || 0,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Section ${section.title} failed:`, errorMessage);

      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying section ${section.title} (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Add delay before retry (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.generateSection(section, maxRetries, sessionId, masterJobId, retryCount + 1);
      }

      // All retries exhausted
      console.error(`💥 Section ${section.title} failed after ${maxRetries} retries`);

      return {
        order: section.order,
        title: section.title,
        content: '',
        success: false,
        error: errorMessage,
        processingTime,
      };
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      pending: this.queue.pending,
      size: this.queue.size,
      isPaused: this.queue.isPaused,
      concurrency: this.queue.concurrency,
    };
  }

  /**
   * Pause the queue
   */
  pause() {
    this.queue.pause();
    console.log('🔄 Competence file generation queue paused');
  }

  /**
   * Resume the queue
   */
  resume() {
    this.queue.start();
    console.log('▶️ Competence file generation queue resumed');
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue.clear();
    console.log('🗑️ Competence file generation queue cleared');
  }
}

// Export singleton instance
export const competenceFileQueueService = new CompetenceFileQueueService();

/**
 * Convenience function to generate a full competence file
 */
export async function generateCompetenceFile(
  candidateData: CandidateData,
  jobDescription?: JobDescription,
  maxRetries: number = 2
): Promise<CompetenceFileGenerationResult> {
  return competenceFileQueueService.generateCompetenceFile(candidateData, jobDescription, maxRetries);
}

/**
 * Export the class for direct instantiation if needed
 */
export default CompetenceFileQueueService; 