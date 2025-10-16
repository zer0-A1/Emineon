import PQueue from 'p-queue';
import { useAIGenerationStore, JobStatus, JobType, AIJob, generateJobId } from '@/stores/ai-generation-store';
import { CandidateData, JobDescription } from '@/types';

export interface OpenAIRequest {
  sectionType: string;
  candidateData: CandidateData;
  jobDescription?: JobDescription;
  type: 'generate' | 'improve' | 'expand' | 'rewrite';
  currentContent?: string;
  token: string;
  sessionId?: string;
}

export interface QueueTaskResult {
  success: boolean;
  data?: string;
  error?: string;
  tokensUsed?: number;
  processingTime: number;
}

class AIQueueService {
  private queue: PQueue;
  private retryQueue: PQueue;
  
  constructor() {
    // Main processing queue with max 5 concurrent tasks
    this.queue = new PQueue({
      concurrency: 5,
      interval: 1000, // Rate limiting: max 5 requests per second
      intervalCap: 5,
    });
    
    // Retry queue with lower concurrency
    this.retryQueue = new PQueue({
      concurrency: 2,
      interval: 2000, // Slower rate for retries
      intervalCap: 2,
    });
    
    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.queue.on('add', () => {
      useAIGenerationStore.getState().setQueueSize(this.queue.size);
    });

    this.queue.on('next', () => {
      useAIGenerationStore.getState().setConcurrentJobs(this.queue.pending);
    });

    this.queue.on('idle', () => {
      useAIGenerationStore.getState().setProcessing(false);
      useAIGenerationStore.getState().setConcurrentJobs(0);
    });

    this.queue.on('error', (error) => {
      console.error('Queue error:', error);
    });
  }

  /**
   * Add an OpenAI API task to the queue with retry logic
   */
  async addTask(
    request: OpenAIRequest,
    priority: number = 5,
    maxRetries: number = 3
  ): Promise<string> {
    const jobId = generateJobId(JobType.SECTION_GENERATION, request.sectionType);
    
    // Create job in store
    const job: Omit<AIJob, 'createdAt'> = {
      id: jobId,
      type: JobType.SECTION_GENERATION,
      status: JobStatus.PENDING,
      progress: {
        percentage: 0,
        message: `Queued for processing: ${request.sectionType}`,
      },
      retryCount: 0,
      maxRetries,
      priority,
      metadata: {
        sectionType: request.sectionType,
        type: request.type,
      },
    };
    
    useAIGenerationStore.getState().addJob(job);
    useAIGenerationStore.getState().setProcessing(true);

    // Add task to queue
    this.queue.add(
      async () => this.processTask(jobId, request, maxRetries),
      { priority }
    );

    return jobId;
  }

  /**
   * Process a single OpenAI API task
   */
  private async processTask(
    jobId: string,
    request: OpenAIRequest,
    maxRetries: number,
    retryCount: number = 0
  ): Promise<QueueTaskResult> {
    const startTime = Date.now();
    
    try {
      // Update job status to in progress
      useAIGenerationStore.getState().updateJob(jobId, {
        status: JobStatus.IN_PROGRESS,
        startedAt: new Date(),
      });

      useAIGenerationStore.getState().updateJobProgress(jobId, {
        percentage: 20,
        message: `Generating ${request.sectionType}...`,
        stage: 'ai_generation',
      });

      console.log(`🚀 Processing AI task ${jobId} for section: ${request.sectionType}`);

      // Make OpenAI API call
      const response = await fetch('/api/ai/generate-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.token}`,
        },
        body: JSON.stringify({
          type: request.type,
          sectionType: request.sectionType,
          currentContent: request.currentContent || '',
          candidateData: request.candidateData,
          jobDescription: request.jobDescription,
          sessionId: request.sessionId,
        }),
      });

      const processingTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.suggestion || !result.suggestion.trim()) {
        throw new Error('API returned empty content');
      }

      // Update job status to completed
      useAIGenerationStore.getState().updateJob(jobId, {
        status: JobStatus.COMPLETED,
        result: result.suggestion,
        completedAt: new Date(),
      });

      useAIGenerationStore.getState().updateJobProgress(jobId, {
        percentage: 100,
        message: `${request.sectionType} completed successfully`,
        stage: 'completed',
      });

      console.log(`✅ AI task ${jobId} completed successfully in ${processingTime}ms`);

      return {
        success: true,
        data: result.suggestion,
        processingTime,
        tokensUsed: result.tokensUsed || 0,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ AI task ${jobId} failed:`, errorMessage);

      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying task ${jobId} (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Update job status for retry
        useAIGenerationStore.getState().updateJob(jobId, {
          status: JobStatus.RETRY_SCHEDULED,
          error: `Retry ${retryCount + 1}/${maxRetries}: ${errorMessage}`,
          retryCount: retryCount + 1,
        });

        useAIGenerationStore.getState().updateJobProgress(jobId, {
          percentage: 50,
          message: `Retrying... (${retryCount + 1}/${maxRetries})`,
          stage: 'retrying',
        });

        // Add to retry queue with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.processTask(jobId, request, maxRetries, retryCount + 1);
      }

      // Max retries exceeded
      useAIGenerationStore.getState().updateJob(jobId, {
        status: JobStatus.FAILED,
        error: errorMessage,
        completedAt: new Date(),
      });

      useAIGenerationStore.getState().updateJobProgress(jobId, {
        percentage: 0,
        message: `Failed: ${errorMessage}`,
        stage: 'failed',
      });

      return {
        success: false,
        error: errorMessage,
        processingTime,
      };
    }
  }

  /**
   * Process multiple tasks in parallel (batch processing)
   */
  async addBatchTasks(
    requests: OpenAIRequest[],
    priority: number = 5,
    maxRetries: number = 3
  ): Promise<string[]> {
    console.log(`📦 Adding batch of ${requests.length} AI tasks to queue`);
    
    const jobIds = await Promise.all(
      requests.map(request => this.addTask(request, priority, maxRetries))
    );

    return jobIds;
  }

  /**
   * Wait for a specific job to complete
   */
  async waitForJob(jobId: string, timeoutMs: number = 30000): Promise<QueueTaskResult> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const job = useAIGenerationStore.getState().getJob(jobId);
        
        if (!job) {
          reject(new Error(`Job ${jobId} not found`));
          return;
        }

        if (job.status === JobStatus.COMPLETED) {
          resolve({
            success: true,
            data: job.result,
            processingTime: Date.now() - startTime,
          });
          return;
        }

        if (job.status === JobStatus.FAILED) {
          resolve({
            success: false,
            error: job.error || 'Job failed',
            processingTime: Date.now() - startTime,
          });
          return;
        }

        if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Job ${jobId} timeout after ${timeoutMs}ms`));
          return;
        }

        // Check again in 500ms
        setTimeout(checkStatus, 500);
      };

      checkStatus();
    });
  }

  /**
   * Wait for multiple jobs to complete
   */
  async waitForBatch(jobIds: string[], timeoutMs: number = 60000): Promise<QueueTaskResult[]> {
    console.log(`⏳ Waiting for batch of ${jobIds.length} jobs to complete...`);
    
    const results = await Promise.all(
      jobIds.map(jobId => this.waitForJob(jobId, timeoutMs))
    );

    const successful = results.filter(r => r.success).length;
    console.log(`✅ Batch completed: ${successful}/${jobIds.length} successful`);

    return results;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      useAIGenerationStore.getState().updateJob(jobId, {
        status: JobStatus.CANCELLED,
        completedAt: new Date(),
      });
      
      console.log(`🚫 Job ${jobId} cancelled`);
      return true;
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const store = useAIGenerationStore.getState();
    
    return {
      queueSize: this.queue.size,
      pending: this.queue.pending,
      concurrency: this.queue.concurrency,
      isIdle: this.queue.size === 0 && this.queue.pending === 0,
      
      // From store
      totalJobs: store.totalJobs,
      activeJobs: store.getActiveJobsCount(),
      completedJobs: store.completedJobs.length,
      failedJobs: store.failedJobs.length,
      successRate: store.successRate,
    };
  }

  /**
   * Clear completed jobs from store
   */
  clearCompleted() {
    useAIGenerationStore.getState().clearCompleted();
  }

  /**
   * Clear failed jobs from store
   */
  clearFailed() {
    useAIGenerationStore.getState().clearFailed();
  }

  /**
   * Pause the queue
   */
  pause() {
    this.queue.pause();
    console.log('🔒 Queue paused');
  }

  /**
   * Resume the queue
   */
  resume() {
    this.queue.start();
    console.log('▶️ Queue resumed');
  }

  /**
   * Get health status
   */
  getHealth() {
    return {
      isHealthy: true,
      queueSize: this.queue.size,
      isPaused: this.queue.isPaused,
      concurrency: this.queue.concurrency,
      pending: this.queue.pending,
    };
  }
}

// Export singleton instance
export const aiQueueService = new AIQueueService();

// Convenience function for single AI requests
export async function generateAIContent(
  sectionType: string,
  candidateData: CandidateData,
  token: string,
  type: 'generate' | 'improve' | 'expand' | 'rewrite' = 'generate',
  jobDescription?: JobDescription,
  currentContent?: string,
  priority: number = 5
): Promise<string> {
  const request: OpenAIRequest = {
    sectionType,
    candidateData,
    jobDescription,
    type,
    currentContent,
    token,
    sessionId: `session-${Date.now()}`,
  };

  const jobId = await aiQueueService.addTask(request, priority);
  const result = await aiQueueService.waitForJob(jobId);
  
  if (!result.success) {
    throw new Error(result.error || 'AI generation failed');
  }
  
  return result.data || '';
}

// Convenience function for batch AI requests
export async function generateAIContentBatch(
  requests: Omit<OpenAIRequest, 'sessionId'>[],
  priority: number = 5
): Promise<string[]> {
  const sessionId = `batch-session-${Date.now()}`;
  const fullRequests = requests.map(req => ({ ...req, sessionId }));

  const jobIds = await aiQueueService.addBatchTasks(fullRequests, priority);
  const results = await aiQueueService.waitForBatch(jobIds);
  
  return results.map(result => {
    if (!result.success) {
      throw new Error(result.error || 'AI generation failed');
    }
    return result.data || '';
  });
} 