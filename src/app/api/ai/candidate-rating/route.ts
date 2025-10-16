// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RatingRequest {
  candidateId?: string;
  candidateData?: any;
  mode: 'single' | 'batch';
}

interface CandidateRating {
  candidateId: string;
  rating: number; // 1.0 - 5.0
  breakdown: {
    technicalSkills: number;
    experience: number;
    education: number;
    careerProgression: number;
    marketValue: number;
  };
  reasoning: string;
  strengths: string[];
  developmentAreas: string[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('⭐ AI Candidate Rating API called');
    
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const body: RatingRequest = await request.json();
    const { candidateId, candidateData, mode } = body;

    if (mode === 'single' && candidateId) {
      // Rate a single candidate by ID
      const candidate = await db.candidate.findUnique({
        where: { id: candidateId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          currentTitle: true,
          currentLocation: true,
          summary: true,
          technicalSkills: true,
          softSkills: true,
          experienceYears: true,
          expectedSalary: true,
          degrees: true,
          certifications: true,
          universities: true,
          graduationYear: true,
          workExperiences: {
            select: {
              title: true,
              company: true,
              description: true,
              startDate: true,
              endDate: true,
            }
          }
        }
      });

      if (!candidate) {
        return NextResponse.json({
          success: false,
          error: 'Candidate not found'
        }, { status: 404 });
      }

      const rating = await generateCandidateRating(candidate);
      
      // Update candidate rating in database
      await db.candidate.update({
        where: { id: candidateId },
        data: { 
          matchingScore: rating.rating,
          lastUpdated: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        data: rating
      });

    } else if (mode === 'batch') {
      // Rate multiple candidates
      const candidates = await db.candidate.findMany({
        where: { archived: false },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          currentTitle: true,
          summary: true,
          technicalSkills: true,
          experienceYears: true,
          degrees: true,
          certifications: true,
          workExperiences: {
            select: {
              title: true,
              company: true,
              description: true,
            }
          }
        },
        take: 20 // Limit for performance
      });

      const ratings: CandidateRating[] = [];
      
      for (const candidate of candidates) {
        try {
          const rating = await generateCandidateRating(candidate);
          ratings.push(rating);
          
          // Update in database
          await db.candidate.update({
            where: { id: candidate.id },
            data: { 
              matchingScore: rating.rating,
              lastUpdated: new Date()
            }
          });
        } catch (error) {
          console.error('Failed to rate candidate:', candidate.id, error);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          ratings,
          totalProcessed: ratings.length,
          totalCandidates: candidates.length
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request parameters'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ AI Rating error:', error);
    return NextResponse.json({
      success: false,
      error: 'AI rating failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateCandidateRating(candidate: any): Promise<CandidateRating> {
  const candidateProfile = `
    Name: ${candidate.firstName} ${candidate.lastName}
    Current Role: ${candidate.currentTitle || 'Not specified'}
    Experience: ${candidate.experienceYears || 0} years
    Summary: ${candidate.summary || 'No summary available'}
    Technical Skills: ${candidate.technicalSkills?.join(', ') || 'None listed'}
    Soft Skills: ${candidate.softSkills?.join(', ') || 'None listed'}
    Education: ${candidate.degrees?.join(', ') || 'Not specified'}
    Universities: ${candidate.universities?.join(', ') || 'Not specified'}
    Certifications: ${candidate.certifications?.join(', ') || 'None'}
    Graduation Year: ${candidate.graduationYear || 'Not specified'}
    Work Experience: ${candidate.workExperiences?.map((exp: any) => 
      `${exp.title} at ${exp.company}: ${exp.description}`
    ).join('; ') || 'No experience listed'}
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert recruiter and talent evaluator. Rate candidates on a 1.0-5.0 scale based on their overall professional profile.

RATING CRITERIA (Each 0-1.0, totaled for final score):
1. Technical Skills (0-1.0): Depth, breadth, and relevance of technical abilities
2. Experience Quality (0-1.0): Years of experience, role progression, company quality
3. Education & Certifications (0-1.0): Degree quality, university reputation, relevant certifications
4. Career Progression (0-1.0): Growth trajectory, leadership roles, increasing responsibilities
5. Market Value (0-1.0): Overall desirability in current job market

RATING SCALE:
- 4.5-5.0: Exceptional talent (top 5% of professionals)
- 4.0-4.4: Excellent candidate (top 15% of professionals)
- 3.5-3.9: Strong candidate (top 30% of professionals)
- 3.0-3.4: Good candidate (average professional)
- 2.5-2.9: Developing candidate (below average)
- 2.0-2.4: Junior/Entry level
- 1.0-1.9: Significant development needed

Be REALISTIC and HONEST. Not everyone can be 4.0+. Consider market standards and realistic expectations.`
        },
        {
          role: 'user',
          content: `
CANDIDATE PROFILE:
${candidateProfile}

Rate this candidate and respond with ONLY a JSON object in this exact format:
{
  "rating": 3.8,
  "breakdown": {
    "technicalSkills": 0.8,
    "experience": 0.7,
    "education": 0.8,
    "careerProgression": 0.7,
    "marketValue": 0.8
  },
  "reasoning": "Strong technical skills with solid experience. Good educational background from reputable university. Steady career progression with increasing responsibilities.",
  "strengths": ["Strong Python skills", "Machine learning expertise", "Leadership experience"],
  "developmentAreas": ["Cloud certifications", "Public speaking", "Team management"]
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const result = completion.choices[0]?.message?.content;
    if (result) {
      try {
        const parsed = JSON.parse(result);
        return {
          candidateId: candidate.id,
          rating: Math.max(1.0, Math.min(5.0, parsed.rating || 3.0)), // Ensure 1.0-5.0 range
          breakdown: parsed.breakdown || {
            technicalSkills: 0.6,
            experience: 0.6,
            education: 0.6,
            careerProgression: 0.6,
            marketValue: 0.6
          },
          reasoning: parsed.reasoning || 'AI analysis completed',
          strengths: parsed.strengths || [],
          developmentAreas: parsed.developmentAreas || []
        };
      } catch (parseError) {
        console.error('Failed to parse AI rating response:', parseError);
        throw new Error('Invalid AI response format');
      }
    } else {
      throw new Error('No response from AI');
    }
  } catch (aiError) {
    console.error('AI rating failed for candidate:', candidate.id, aiError);
    
    // Fallback rating based on simple heuristics
    const fallbackRating = calculateFallbackRating(candidate);
    return {
      candidateId: candidate.id,
      rating: fallbackRating,
      breakdown: {
        technicalSkills: 0.6,
        experience: 0.6,
        education: 0.6,
        careerProgression: 0.6,
        marketValue: 0.6
      },
      reasoning: 'Fallback rating due to AI service unavailability',
      strengths: ['Professional experience'],
      developmentAreas: ['Further assessment needed']
    };
  }
}

function calculateFallbackRating(candidate: any): number {
  let score = 2.5; // Base score
  
  // Experience factor
  const years = candidate.experienceYears || 0;
  if (years >= 10) score += 0.8;
  else if (years >= 5) score += 0.6;
  else if (years >= 2) score += 0.4;
  else if (years >= 1) score += 0.2;
  
  // Skills factor
  const skillCount = candidate.technicalSkills?.length || 0;
  if (skillCount >= 8) score += 0.4;
  else if (skillCount >= 5) score += 0.3;
  else if (skillCount >= 3) score += 0.2;
  else if (skillCount >= 1) score += 0.1;
  
  // Education factor
  if (candidate.degrees?.some((degree: string) => degree.toLowerCase().includes('phd'))) {
    score += 0.5;
  } else if (candidate.degrees?.some((degree: string) => degree.toLowerCase().includes('master'))) {
    score += 0.3;
  } else if (candidate.degrees?.some((degree: string) => degree.toLowerCase().includes('bachelor'))) {
    score += 0.2;
  }
  
  // Certifications factor
  const certCount = candidate.certifications?.length || 0;
  if (certCount >= 3) score += 0.2;
  else if (certCount >= 1) score += 0.1;
  
  return Math.max(1.0, Math.min(5.0, score));
}
