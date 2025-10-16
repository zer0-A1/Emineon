import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { skills, candidateData } = await request.json();

    const prompt = `
You are an AI assistant helping to enhance and categorize professional skills for a competence file.

Current Skills: ${skills.join(', ')}
Candidate: ${candidateData?.fullName || 'Unknown'}
Current Title: ${candidateData?.currentTitle || 'Unknown'}
Industry: ${candidateData?.industry || 'Unknown'}

Please enhance these skills by:
1. Adding relevant missing skills for this role/industry
2. Categorizing them into groups (Technical, Soft Skills, Industry-Specific, etc.)
3. Using professional terminology
4. Ensuring they're relevant and current

Return a JSON object with categorized skills:
{
  "technical": ["skill1", "skill2"],
  "soft": ["skill1", "skill2"],
  "industry": ["skill1", "skill2"],
  "tools": ["tool1", "tool2"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional career coach. Return only valid JSON with categorized skills.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error('No response generated');
    }

    // Parse the JSON response
    const enhancedSkills = JSON.parse(response);

    return NextResponse.json({ enhancedSkills });
  } catch (error) {
    console.error('Error enhancing skills:', error);
    return NextResponse.json(
      { error: 'Failed to enhance skills' },
      { status: 500 }
    );
  }
} 