import PQueue from 'p-queue';

// AI Queue Configuration
const AI_QUEUE_CONFIG = {
  concurrency: 5, // Max 5 concurrent OpenAI requests (adjust per OpenAI plan)
  interval: 1000, // 1 second intervals
  intervalCap: 5, // Max 5 requests per interval
  carryoverConcurrencyCount: true,
  autoStart: true,
  timeout: 30000, // 30 second timeout per request
} as const;

// Create AI queue with OpenAI rate limits in mind
export const aiQueue = new PQueue(AI_QUEUE_CONFIG);

// Create separate queues for different priority levels
export const highPriorityQueue = new PQueue({
  ...AI_QUEUE_CONFIG,
  concurrency: 3, // Higher priority gets fewer concurrent slots
});

export const normalPriorityQueue = new PQueue({
  ...AI_QUEUE_CONFIG,
  concurrency: 2,
});

// Queue metrics for monitoring
export const getQueueMetrics = () => ({
  aiQueue: {
    size: aiQueue.size,
    pending: aiQueue.pending,
    isPaused: aiQueue.isPaused,
  },
  highPriorityQueue: {
    size: highPriorityQueue.size,
    pending: highPriorityQueue.pending,
    isPaused: highPriorityQueue.isPaused,
  },
  normalPriorityQueue: {
    size: normalPriorityQueue.size,
    pending: normalPriorityQueue.pending,
    isPaused: normalPriorityQueue.isPaused,
  },
});

// Queue wrapper with retry logic
export async function addToQueue<T>(
  operation: () => Promise<T>,
  options: {
    priority?: 'high' | 'normal';
    maxRetries?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const { priority = 'normal', maxRetries = 3, operationName = 'AI Operation' } = options;
  const queue = priority === 'high' ? highPriorityQueue : normalPriorityQueue;
  
  const result = await queue.add(async () => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 ${operationName} - Attempt ${attempt}/${maxRetries} (Queue: ${priority})`);
        const result = await operation();
        console.log(`✅ ${operationName} - Success on attempt ${attempt}`);
        return result;
      } catch (error) {
        console.warn(`⚠️ ${operationName} - Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error(`❌ ${operationName} - All retries exhausted`);
          throw new Error(`AI generation failed for ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ ${operationName} - Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error(`${operationName}: Maximum retries exceeded`);
  });
  return result as T;
}

// Export queue instance for direct access if needed
export { aiQueue as default }; 