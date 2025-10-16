import { pool } from '../src/lib/db/neon-client';
import {
  generateEmbedding,
  toVectorLiteral,
  generateCandidateSearchText,
  generateJobSearchText,
  generateClientSearchText,
  generateProjectSearchText,
  generateCompetenceFileSearchText,
} from '../src/lib/embeddings/unified-embeddings';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BATCH_SIZE = 10;
const DELAY_MS = 1000; // Delay between batches to avoid rate limits

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateCandidateEmbeddings() {
  console.log('🔄 Updating candidate embeddings...');
  const client = await pool.connect();
  
  try {
    // Get all candidates without embeddings
    const result = await client.query(
      'SELECT * FROM candidates WHERE embedding IS NULL OR search_text IS NULL'
    );
    
    console.log(`Found ${result.rows.length} candidates to update`);
    
    for (let i = 0; i < result.rows.length; i += BATCH_SIZE) {
      const batch = result.rows.slice(i, i + BATCH_SIZE);
      
      await client.query('BEGIN');
      
      for (const candidate of batch) {
        try {
          const searchText = generateCandidateSearchText(candidate);
          const embedding = await generateEmbedding(searchText);
          const vectorLiteral = toVectorLiteral(embedding);
          
          await client.query(
            'UPDATE candidates SET embedding = $1::vector, search_text = $2, updated_at = NOW() WHERE id = $3',
            [vectorLiteral, searchText, candidate.id]
          );
          
          console.log(`✅ Updated candidate ${candidate.id}`);
        } catch (error) {
          console.error(`❌ Failed to update candidate ${candidate.id}:`, error);
        }
      }
      
      await client.query('COMMIT');
      
      if (i + BATCH_SIZE < result.rows.length) {
        console.log(`Processed ${i + batch.length}/${result.rows.length}, waiting...`);
        await sleep(DELAY_MS);
      }
    }
  } finally {
    client.release();
  }
}

async function updateJobEmbeddings() {
  console.log('🔄 Updating job embeddings...');
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM jobs WHERE embedding IS NULL OR search_text IS NULL'
    );
    
    console.log(`Found ${result.rows.length} jobs to update`);
    
    for (let i = 0; i < result.rows.length; i += BATCH_SIZE) {
      const batch = result.rows.slice(i, i + BATCH_SIZE);
      
      await client.query('BEGIN');
      
      for (const job of batch) {
        try {
          const searchText = generateJobSearchText(job);
          const embedding = await generateEmbedding(searchText);
          const vectorLiteral = toVectorLiteral(embedding);
          
          await client.query(
            'UPDATE jobs SET embedding = $1::vector, search_text = $2, updated_at = NOW() WHERE id = $3',
            [vectorLiteral, searchText, job.id]
          );
          
          console.log(`✅ Updated job ${job.id}`);
        } catch (error) {
          console.error(`❌ Failed to update job ${job.id}:`, error);
        }
      }
      
      await client.query('COMMIT');
      
      if (i + BATCH_SIZE < result.rows.length) {
        console.log(`Processed ${i + batch.length}/${result.rows.length}, waiting...`);
        await sleep(DELAY_MS);
      }
    }
  } finally {
    client.release();
  }
}

async function updateClientEmbeddings() {
  console.log('🔄 Updating client embeddings...');
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM clients WHERE embedding IS NULL OR search_text IS NULL'
    );
    
    console.log(`Found ${result.rows.length} clients to update`);
    
    for (let i = 0; i < result.rows.length; i += BATCH_SIZE) {
      const batch = result.rows.slice(i, i + BATCH_SIZE);
      
      await client.query('BEGIN');
      
      for (const clientRow of batch) {
        try {
          const searchText = generateClientSearchText(clientRow);
          const embedding = await generateEmbedding(searchText);
          const vectorLiteral = toVectorLiteral(embedding);
          
          await client.query(
            'UPDATE clients SET embedding = $1::vector, search_text = $2, updated_at = NOW() WHERE id = $3',
            [vectorLiteral, searchText, clientRow.id]
          );
          
          console.log(`✅ Updated client ${clientRow.id}`);
        } catch (error) {
          console.error(`❌ Failed to update client ${clientRow.id}:`, error);
        }
      }
      
      await client.query('COMMIT');
      
      if (i + BATCH_SIZE < result.rows.length) {
        console.log(`Processed ${i + batch.length}/${result.rows.length}, waiting...`);
        await sleep(DELAY_MS);
      }
    }
  } finally {
    client.release();
  }
}

async function updateProjectEmbeddings() {
  console.log('🔄 Updating project embeddings...');
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM projects WHERE embedding IS NULL OR search_text IS NULL'
    );
    
    console.log(`Found ${result.rows.length} projects to update`);
    
    for (let i = 0; i < result.rows.length; i += BATCH_SIZE) {
      const batch = result.rows.slice(i, i + BATCH_SIZE);
      
      await client.query('BEGIN');
      
      for (const project of batch) {
        try {
          const searchText = generateProjectSearchText(project);
          const embedding = await generateEmbedding(searchText);
          const vectorLiteral = toVectorLiteral(embedding);
          
          await client.query(
            'UPDATE projects SET embedding = $1::vector, search_text = $2, updated_at = NOW() WHERE id = $3',
            [vectorLiteral, searchText, project.id]
          );
          
          console.log(`✅ Updated project ${project.id}`);
        } catch (error) {
          console.error(`❌ Failed to update project ${project.id}:`, error);
        }
      }
      
      await client.query('COMMIT');
      
      if (i + BATCH_SIZE < result.rows.length) {
        console.log(`Processed ${i + batch.length}/${result.rows.length}, waiting...`);
        await sleep(DELAY_MS);
      }
    }
  } finally {
    client.release();
  }
}

async function updateCompetenceFileEmbeddings() {
  console.log('🔄 Updating competence file embeddings...');
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM competence_files WHERE embedding IS NULL OR search_text IS NULL'
    );
    
    console.log(`Found ${result.rows.length} competence files to update`);
    
    for (let i = 0; i < result.rows.length; i += BATCH_SIZE) {
      const batch = result.rows.slice(i, i + BATCH_SIZE);
      
      await client.query('BEGIN');
      
      for (const file of batch) {
        try {
          const searchText = generateCompetenceFileSearchText(file);
          const embedding = await generateEmbedding(searchText);
          const vectorLiteral = toVectorLiteral(embedding);
          
          await client.query(
            'UPDATE competence_files SET embedding = $1::vector, search_text = $2, updated_at = NOW() WHERE id = $3',
            [vectorLiteral, searchText, file.id]
          );
          
          console.log(`✅ Updated competence file ${file.id}`);
        } catch (error) {
          console.error(`❌ Failed to update competence file ${file.id}:`, error);
        }
      }
      
      await client.query('COMMIT');
      
      if (i + BATCH_SIZE < result.rows.length) {
        console.log(`Processed ${i + batch.length}/${result.rows.length}, waiting...`);
        await sleep(DELAY_MS);
      }
    }
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 Starting embedding generation for all entities...');
  console.log(`Using model: text-embedding-3-large (1536 dimensions)`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
  }
  
  try {
    // Update embeddings for each entity type
    await updateCandidateEmbeddings();
    await updateJobEmbeddings();
    await updateClientEmbeddings();
    await updateProjectEmbeddings();
    await updateCompetenceFileEmbeddings();
    
    console.log('✅ All embeddings updated successfully!');
  } catch (error) {
    console.error('❌ Error updating embeddings:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as generateAllEmbeddings };
