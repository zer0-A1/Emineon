/**
 * Chunking utilities for large text content
 */

const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks

export interface TextChunk {
  text: string;
  start: number;
  end: number;
  metadata?: any;
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): TextChunk[] {
  if (!text || text.length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    
    // Try to break at a sentence or word boundary
    let actualEnd = end;
    if (end < text.length) {
      // Look for sentence boundaries first
      const sentenceEnd = text.lastIndexOf('.', end);
      const questionEnd = text.lastIndexOf('?', end);
      const exclamationEnd = text.lastIndexOf('!', end);
      
      const bestSentenceEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd);
      
      if (bestSentenceEnd > start + chunkSize / 2) {
        actualEnd = bestSentenceEnd + 1;
      } else {
        // Fall back to word boundary
        const wordEnd = text.lastIndexOf(' ', end);
        if (wordEnd > start + chunkSize / 2) {
          actualEnd = wordEnd;
        }
      }
    }

    chunks.push({
      text: text.slice(start, actualEnd).trim(),
      start,
      end: actualEnd
    });

    // Move start position with overlap
    start = actualEnd - overlap;
    if (start < 0) start = 0;
    
    // Prevent infinite loop
    if (start >= text.length - 1) break;
  }

  return chunks;
}

/**
 * Combine candidate data into searchable text with smart chunking
 */
export function prepareCandidateTextChunks(candidate: any): TextChunk[] {
  const sections: { [key: string]: string } = {};

  // Group related information into sections
  sections.basicInfo = [
    `Name: ${candidate.first_name} ${candidate.last_name}`,
    candidate.email ? `Email: ${candidate.email}` : null,
    candidate.phone ? `Phone: ${candidate.phone}` : null,
    candidate.current_title ? `Current Title: ${candidate.current_title}` : null,
    candidate.current_location ? `Location: ${candidate.current_location}` : null,
  ].filter(Boolean).join('\n');

  sections.professional = [
    candidate.professional_headline ? `Headline: ${candidate.professional_headline}` : null,
    candidate.summary ? `Summary: ${candidate.summary}` : null,
    candidate.experience_years ? `Experience: ${candidate.experience_years} years` : null,
    candidate.seniority_level ? `Seniority: ${candidate.seniority_level}` : null,
  ].filter(Boolean).join('\n');

  sections.skills = [
    candidate.technical_skills?.length ? `Technical Skills: ${candidate.technical_skills.join(', ')}` : null,
    candidate.soft_skills?.length ? `Soft Skills: ${candidate.soft_skills.join(', ')}` : null,
    candidate.programming_languages?.length ? `Programming Languages: ${candidate.programming_languages.join(', ')}` : null,
    candidate.frameworks?.length ? `Frameworks: ${candidate.frameworks.join(', ')}` : null,
    candidate.tools_and_platforms?.length ? `Tools: ${candidate.tools_and_platforms.join(', ')}` : null,
    candidate.methodologies?.length ? `Methodologies: ${candidate.methodologies.join(', ')}` : null,
  ].filter(Boolean).join('\n');

  sections.education = [
    candidate.education_level ? `Education Level: ${candidate.education_level}` : null,
    candidate.universities?.length ? `Universities: ${candidate.universities.join(', ')}` : null,
    candidate.degrees?.length ? `Degrees: ${candidate.degrees.join(', ')}` : null,
    candidate.graduation_year ? `Graduation Year: ${candidate.graduation_year}` : null,
    candidate.certifications?.length ? `Certifications: ${candidate.certifications.join(', ')}` : null,
  ].filter(Boolean).join('\n');

  sections.preferences = [
    candidate.expected_salary ? `Expected Salary: ${candidate.expected_salary}` : null,
    candidate.remote_preference ? `Remote Preference: ${candidate.remote_preference}` : null,
    candidate.freelancer ? 'Open to Freelance' : null,
    candidate.relocation_willingness ? 'Willing to Relocate' : null,
    candidate.work_permit_type ? `Work Permit: ${candidate.work_permit_type}` : null,
  ].filter(Boolean).join('\n');

  // Combine all sections
  const fullText = Object.entries(sections)
    .filter(([_, content]) => content.trim().length > 0)
    .map(([section, content]) => `[${section.toUpperCase()}]\n${content}`)
    .join('\n\n');

  // If text is small enough, return as single chunk
  if (fullText.length <= CHUNK_SIZE) {
    return [{
      text: fullText,
      start: 0,
      end: fullText.length,
      metadata: { type: 'full' }
    }];
  }

  // Otherwise, chunk it
  const chunks = chunkText(fullText);
  
  // Add metadata to chunks
  return chunks.map((chunk, index) => ({
    ...chunk,
    metadata: {
      type: 'chunk',
      index,
      total: chunks.length
    }
  }));
}

/**
 * Extract text from documents for chunking
 */
export async function extractDocumentText(fileUrl: string): Promise<string | null> {
  if (!fileUrl) return null;
  
  try {
    // Call the extract-text API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/files/extract-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl }),
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.text || null;
    }
  } catch (error) {
    console.error('Failed to extract document text:', error);
  }
  
  return null;
}
