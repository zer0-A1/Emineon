import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema for candidate data
const CandidateDataSchema = z.object({
  fullName: z.string(),
  currentTitle: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    responsibilities: z.string(),
  })),
  education: z.array(z.string()),
  languages: z.array(z.string()),
});

// System prompt for CV parsing
const SYSTEM_PROMPT = `You are an expert CV/Resume parser. Extract structured information from the provided CV text and return it as JSON.

Please extract the following information:
- fullName: Complete name of the candidate
- currentTitle: Current job title or most recent position
- email: Email address if provided
- phone: Phone number if provided
- location: Current location/address
- yearsOfExperience: Estimated total years of professional experience (number)
- summary: Professional summary or objective (2-3 sentences)
- skills: Array of technical and professional skills
- certifications: Array of certifications, licenses, or professional qualifications
- experience: Array of work experience objects with company, title, startDate (YYYY-MM format), endDate (YYYY-MM format or "Present"), and responsibilities
- education: Array of educational qualifications
- languages: Array of languages with proficiency levels

Return only valid JSON without any markdown formatting or additional text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cvText, source = 'upload' } = body;

    if (!cvText || typeof cvText !== 'string') {
      return NextResponse.json(
        { error: 'CV text is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse CV using OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Please parse this CV and extract structured information:\n\n${cvText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let candidateData;
    try {
      candidateData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', aiResponse);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the extracted data
    const validatedData = CandidateDataSchema.parse({
      ...candidateData,
      id: `${source}_${Date.now()}`, // Generate unique ID
    });

    return NextResponse.json({
      success: true,
      candidateData: validatedData,
      source,
      processedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('CV parsing error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Invalid candidate data structure',
          details: error.errors
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to parse CV',
        message: error.message 
      },
      { status: 500 }
    );
  }
} 