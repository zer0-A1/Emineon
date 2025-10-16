// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
// import { loggingService } from './logging';

export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'text' | 'code' | 'rating';
  question: string;
  options?: string[];
  weight: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface CreateAssessmentInput {
  candidateId: string;
  type: 'TECHNICAL' | 'PERSONALITY' | 'COGNITIVE' | 'SKILLS_BASED' | 'CUSTOM';
  questions: AssessmentQuestion[];
  maxScore: number;
  expiresIn?: number; // hours
}

export interface AIAssessmentInput {
  jobTitle: string;
  jobDescription: string;
  assessmentType: 'technical' | 'personality' | 'cognitive';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  focusAreas?: string[];
  includeCodeChallenges?: boolean;
}

export class AssessmentService {
  private openaiApiKey = process.env.OPENAI_API_KEY;

  async generateAIAssessment(input: AIAssessmentInput): Promise<AssessmentQuestion[]> {
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not configured, using mock questions');
      return this.generateMockQuestions(input);
    }

    try {
      const prompt = this.buildAssessmentPrompt(input);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert assessment designer who creates comprehensive, fair, and relevant assessment questions for recruitment purposes.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content;
      
      if (!generatedContent) {
        throw new Error('No content generated from OpenAI');
      }

      return this.parseAIQuestions(generatedContent, input);
    } catch (error) {
      console.error('Error generating AI assessment:', error);
      loggingService.log({
        action: 'AI Assessment Generation Failed',
        resource: 'assessment',
        level: 'ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error', input }
      });
      
      // Fallback to mock questions
      return this.generateMockQuestions(input);
    }
  }

  private buildAssessmentPrompt(input: AIAssessmentInput): string {
    const { jobTitle, jobDescription, assessmentType, skillLevel, duration, focusAreas, includeCodeChallenges } = input;
    
    return `Create a comprehensive ${assessmentType} assessment for a ${jobTitle} position.

Job Description:
${jobDescription}

Assessment Requirements:
- Type: ${assessmentType}
- Skill Level: ${skillLevel}
- Duration: ${duration} minutes
- Focus Areas: ${focusAreas?.join(', ') || 'General competencies'}
- Include Code Challenges: ${includeCodeChallenges ? 'Yes' : 'No'}

Please generate 10-15 assessment questions that are:
1. Relevant to the job requirements
2. Appropriate for ${skillLevel} level candidates
3. Diverse in question types (multiple choice, short answer, practical scenarios)
4. ${includeCodeChallenges && assessmentType === 'technical' ? 'Include 2-3 coding challenges' : ''}

Format each question as JSON with the following structure:
{
  "type": "multiple_choice|text|code|rating",
  "question": "Question text",
  "options": ["option1", "option2", "option3", "option4"] (for multiple choice only),
  "weight": 1-5,
  "difficulty": "beginner|intermediate|advanced"
}

Return a valid JSON array of questions.`;
  }

  private parseAIQuestions(content: string, input: AIAssessmentInput): AssessmentQuestion[] {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      
      return questions.map((q: any, index: number) => ({
        id: `ai_question_${Date.now()}_${index}`,
        type: q.type || 'text',
        question: q.question,
        options: q.options,
        weight: q.weight || 1,
        difficulty: q.difficulty || input.skillLevel
      }));
    } catch (error) {
      console.error('Error parsing AI questions:', error);
      return this.generateMockQuestions(input);
    }
  }

  private generateMockQuestions(input: AIAssessmentInput): AssessmentQuestion[] {
    const { assessmentType, skillLevel, jobTitle } = input;
    
    if (assessmentType === 'technical') {
      return [
        {
          id: 'mock_1',
          type: 'multiple_choice',
          question: `What is the most important consideration when designing a scalable ${jobTitle.toLowerCase()} solution?`,
          options: ['Performance optimization', 'Code readability', 'Security measures', 'All of the above'],
          weight: 3,
          difficulty: skillLevel
        },
        {
          id: 'mock_2',
          type: 'text',
          question: `Describe your approach to handling error scenarios in a ${jobTitle.toLowerCase()} application.`,
          weight: 4,
          difficulty: skillLevel
        },
        {
          id: 'mock_3',
          type: 'code',
          question: 'Write a function that efficiently finds the maximum element in an array.',
          weight: 5,
          difficulty: skillLevel
        }
      ];
    } else if (assessmentType === 'personality') {
      return [
        {
          id: 'mock_p1',
          type: 'rating',
          question: 'I prefer to work independently rather than in a team.',
          weight: 2,
          difficulty: skillLevel
        },
        {
          id: 'mock_p2',
          type: 'multiple_choice',
          question: 'When facing a challenging deadline, you typically:',
          options: ['Plan meticulously', 'Adapt as needed', 'Seek team input', 'Focus on priorities'],
          weight: 3,
          difficulty: skillLevel
        }
      ];
    } else {
      return [
        {
          id: 'mock_c1',
          type: 'multiple_choice',
          question: 'If A > B and B > C, which statement is always true?',
          options: ['A = C', 'A > C', 'C > A', 'Cannot determine'],
          weight: 3,
          difficulty: skillLevel
        },
        {
          id: 'mock_c2',
          type: 'text',
          question: 'Solve this pattern: 2, 4, 8, 16, ? - Explain your reasoning.',
          weight: 4,
          difficulty: skillLevel
        }
      ];
    }
  }

  async createAssessment(input: CreateAssessmentInput) {
    const expiresAt = input.expiresIn 
      ? new Date(Date.now() + input.expiresIn * 60 * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default

    try {
      // In a real implementation, you would save to database
      console.log('Creating assessment for candidate:', input.candidateId);
      
      return {
        id: `assessment_${Date.now()}`,
        candidateId: input.candidateId,
        type: input.type,
        questions: input.questions,
        maxScore: input.maxScore,
        status: 'NOT_STARTED',
        expiresAt,
        createdAt: new Date(),
      };
    } catch (error) {
      loggingService.log({
        action: 'Assessment Creation Failed',
        resource: 'assessment',
        level: 'ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error', input }
      });
      throw error;
    }
  }

  async submitAssessment(assessmentId: string, answers: Record<string, any>) {
    try {
      console.log('Submitting assessment:', assessmentId, answers);
      
      // Calculate score based on answers (mock implementation)
      const score = Math.floor(Math.random() * 100);
      
      return {
        assessmentId,
        score,
        maxScore: 100,
        completedAt: new Date(),
      };
    } catch (error) {
      loggingService.log({
        action: 'Assessment Submission Failed',
        resource: 'assessment',
        level: 'ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error', assessmentId, answers }
      });
      throw error;
    }
  }

  async getAssessmentResults(candidateId: string) {
    try {
      console.log('Getting assessment results for candidate:', candidateId);
      
      // Mock implementation - would fetch from database
      return [];
    } catch (error) {
      loggingService.log({
        action: 'Assessment Results Retrieval Failed',
        resource: 'assessment',
        level: 'ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error', candidateId }
      });
      throw error;
    }
  }
}

export const assessmentService = new AssessmentService(); 