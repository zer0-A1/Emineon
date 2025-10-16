import { updateCandidateEmbedding } from './openai-embeddings';

/**
 * Hook to update embeddings when a candidate is created or updated
 */
export async function onCandidateChange(candidateId: string, trigger: 'create' | 'update' | 'cv-upload') {
  // Run in background - don't block the main operation
  setTimeout(async () => {
    try {
      console.log(`🔄 Updating embeddings for candidate ${candidateId} (trigger: ${trigger})`);
      await updateCandidateEmbedding(candidateId);
      console.log(`✅ Embeddings updated for candidate ${candidateId}`);
    } catch (error) {
      console.error(`❌ Failed to update embeddings for candidate ${candidateId}:`, error);
      // Could add to a retry queue here
    }
  }, 0);
}

/**
 * Batch update embeddings for multiple candidates
 */
export async function onBulkCandidateChange(candidateIds: string[]) {
  // Process in background
  setTimeout(async () => {
    console.log(`🔄 Updating embeddings for ${candidateIds.length} candidates...`);
    
    for (const candidateId of candidateIds) {
      try {
        await updateCandidateEmbedding(candidateId);
        console.log(`✅ Updated embedding for candidate ${candidateId}`);
        
        // Rate limiting for OpenAI
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to update embedding for candidate ${candidateId}:`, error);
      }
    }
    
    console.log('✅ Batch embedding update complete');
  }, 0);
}
