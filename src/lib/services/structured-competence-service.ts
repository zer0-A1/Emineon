import OpenAI from 'openai';
import { addToQueue } from '../ai/queue';
import { STRUCTURED_COMPETENCE_PROMPTS } from '../prompts/structured-prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CandidateData {
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

interface JobDescription {
  text: string;
  requirements: string[];
  skills: string[];
  responsibilities: string[];
  title?: string;
  company?: string;
}

export class StructuredCompetenceService {
  
  /**
   * Generate structured professional experience
   */
  async generateStructuredExperience(
    candidateData: CandidateData,
    jobDescription?: JobDescription
  ): Promise<string> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: STRUCTURED_COMPETENCE_PROMPTS.PROFESSIONAL_EXPERIENCE
          },
          {
            role: 'user',
            content: `Generate structured professional experience content for:

**Candidate Information:**
- Name: ${candidateData.fullName}
- Current Title: ${candidateData.currentTitle}
- Years of Experience: ${candidateData.yearsOfExperience || 'Not specified'}

**Experience Details:**
${candidateData.experience?.map((exp, index) => `
**Experience ${index + 1}:**
- Job Title: ${exp.title}
- Company: ${exp.company}
- Period: ${exp.startDate} - ${exp.endDate}
- Responsibilities: ${exp.responsibilities}
`).join('\n') || 'No experience data provided'}

**Skills Available:** ${candidateData.skills?.join(', ') || 'No skills provided'}

${jobDescription ? `
**Target Role Context:**
- Target Job: ${jobDescription.title || 'Not specified'}
- Target Company: ${jobDescription.company || 'Not specified'}
- Required Skills: ${jobDescription.skills?.join(', ') || 'Not specified'}
- Key Requirements: ${jobDescription.requirements?.join(', ') || 'Not specified'}
` : ''}

**IMPORTANT:** Follow the EXACT markdown formatting specified. Include quantified metrics in <strong> tags and format technologies as inline code with backticks.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return content;
    }, { 
      priority: 'normal', 
      operationName: 'Structured Experience Generation' 
    });
  }

  /**
   * Generate structured professional summary
   */
  async generateStructuredSummary(
    candidateData: CandidateData,
    jobDescription?: JobDescription
  ): Promise<string> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: STRUCTURED_COMPETENCE_PROMPTS.PROFESSIONAL_SUMMARY
          },
          {
            role: 'user',
            content: `Generate a compelling professional summary for:

**Candidate:** ${candidateData.fullName}
**Current Title:** ${candidateData.currentTitle}
**Years of Experience:** ${candidateData.yearsOfExperience || 'Not specified'}
**Key Skills:** ${candidateData.skills?.join(', ') || 'No skills provided'}
**Current Summary:** ${candidateData.summary || 'No summary provided'}

${jobDescription ? `
**Target Role Context:**
- Target Position: ${jobDescription.title || 'Not specified'}
- Industry: ${jobDescription.company || 'Not specified'}
- Key Requirements: ${jobDescription.requirements?.join(', ') || 'Not specified'}
` : ''}

**IMPORTANT:** Follow the EXACT markdown formatting. Use <strong> tags for emphasis and backticks for technologies.`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return content;
    }, { 
      priority: 'high', 
      operationName: 'Structured Summary Generation' 
    });
  }

  /**
   * Generate structured core competencies
   */
  async generateStructuredCompetencies(
    candidateData: CandidateData,
    jobDescription?: JobDescription
  ): Promise<string> {
    return addToQueue(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: STRUCTURED_COMPETENCE_PROMPTS.CORE_COMPETENCIES
          },
          {
            role: 'user',
            content: `Generate structured core competencies for:

**Candidate:** ${candidateData.fullName}
**Current Title:** ${candidateData.currentTitle}
**Skills:** ${candidateData.skills?.join(', ') || 'No skills provided'}
**Experience:** ${candidateData.experience?.map(exp => `${exp.title} at ${exp.company}`).join(', ') || 'No experience provided'}

${jobDescription ? `
**Target Role Context:**
- Target Position: ${jobDescription.title || 'Not specified'}
- Required Skills: ${jobDescription.skills?.join(', ') || 'Not specified'}
- Key Responsibilities: ${jobDescription.responsibilities?.join(', ') || 'Not specified'}
` : ''}

**IMPORTANT:** Organize skills into Technical, Functional, and Leadership categories. Use backticks for technologies and <strong> tags for metrics.`
          }
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return content;
    }, { 
      priority: 'normal', 
      operationName: 'Structured Competencies Generation' 
    });
  }

  /**
   * Generate complete structured competence file
   */
  async generateCompleteStructuredFile(
    candidateData: CandidateData,
    jobDescription?: JobDescription,
    clientName?: string
  ): Promise<string> {
    console.log('🚀 Starting complete structured competence file generation...');
    
    try {
      // Generate all sections in parallel
      const [
        summaryContent,
        competenciesContent,
        experienceContent,
        educationContent,
        certificationsContent
      ] = await Promise.all([
        this.generateStructuredSummary(candidateData, jobDescription),
        this.generateStructuredCompetencies(candidateData, jobDescription),
        this.generateStructuredExperience(candidateData, jobDescription),
        this.generateEducationSection(candidateData),
        this.generateCertificationsSection(candidateData)
      ]);

      // Generate header
      const headerContent = this.generateHeaderSection(candidateData);

      // Combine all sections
      const structuredContent = [
        headerContent,
        summaryContent,
        competenciesContent,
        experienceContent,
        educationContent,
        certificationsContent,
        this.generateFooterSection(clientName)
      ].filter(Boolean).join('\n\n');

      console.log('✅ Complete structured competence file generation completed');
      return structuredContent;

    } catch (error) {
      console.error('❌ Structured competence file generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate header section
   */
  private generateHeaderSection(candidateData: CandidateData): string {
    return `# ${candidateData.fullName.toUpperCase()}
## ${candidateData.currentTitle}

**Contact Information:**
- **Email:** ${candidateData.email || 'Not provided'}
- **Phone:** ${candidateData.phone || 'Not provided'}
- **Location:** ${candidateData.location || 'Not provided'}

---`;
  }

  /**
   * Generate education section
   */
  private generateEducationSection(candidateData: CandidateData): string {
    if (!candidateData.education || candidateData.education.length === 0) {
      return '';
    }

    return `## EDUCATION

${candidateData.education.map((edu) => `- ${edu}`).join('\n')}

---`;
  }

  /**
   * Generate certifications section
   */
  private generateCertificationsSection(candidateData: CandidateData): string {
    if (!candidateData.certifications || candidateData.certifications.length === 0) {
      return '';
    }

    return `## CERTIFICATIONS

${candidateData.certifications.map((cert) => `- ${cert}`).join('\n')}

---`;
  }

  /**
   * Generate footer section
   */
  private generateFooterSection(clientName?: string): string {
    return `---

*Generated on ${new Date().toLocaleDateString()} ${clientName ? `for ${clientName}` : 'by Emineon ATS'}*`;
  }
}

export const structuredCompetenceService = new StructuredCompetenceService(); 