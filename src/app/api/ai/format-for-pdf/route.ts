import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface FormatRequest {
  content: string;
  sectionType: string;
  candidateData?: any;
}

// Get OpenAI instance
function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required for formatting');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { content, sectionType, candidateData }: FormatRequest = await request.json();

    if (!content || !sectionType) {
      return NextResponse.json(
        { success: false, error: 'Missing content or sectionType' },
        { status: 400 }
      );
    }

    console.log(`🎨 Formatting ${sectionType} content for PDF...`);

    const systemPrompt = getSystemPrompt(sectionType);
    const userPrompt = getUserPrompt(content, sectionType, candidateData);

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const formattedContent = completion.choices[0]?.message?.content;

    if (!formattedContent) {
      throw new Error('No formatted content received from OpenAI');
    }

    console.log(`✅ Successfully formatted ${sectionType} content`);

    return NextResponse.json({
      success: true,
      formattedContent,
      originalLength: content.length,
      formattedLength: formattedContent.length
    });

  } catch (error) {
    console.error('❌ PDF formatting error:', error);
    const { content: originalContent } = await request.json().catch(() => ({ content: '' }));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Formatting failed',
        originalContent // Fallback to original content
      },
      { status: 500 }
    );
  }
}

function getSystemPrompt(sectionType: string): string {
  const basePrompt = `You are a professional document formatter specializing in competence files and resumes. Your task is to take raw content and format it beautifully for PDF generation while preserving all important information.

CRITICAL FORMATTING RULES:
- Use markdown formatting (**bold**, *italic*)
- Create clear section headers with **bold text**
- Use bullet points (•) for lists
- Maintain professional language
- Keep all quantifiable results and metrics
- Ensure content flows logically
- Break long paragraphs into digestible chunks`;

  switch (sectionType.toLowerCase()) {
    case 'functional skills':
      return `${basePrompt}

FOR FUNCTIONAL SKILLS SECTIONS:
- Group related skills into logical categories (e.g., **Leadership & Management**, **Strategic Planning**, **Communication**)
- Each category should have 3-5 bullet points with specific achievements
- Include quantifiable results where available
- Use active voice and action verbs
- Format like:

**Category Name**
• Specific achievement with quantifiable result
• Another achievement with impact measurement
• Third achievement with business outcome

**Next Category**
• Achievement with metrics
• Achievement with specific example`;

    case 'technical skills':
      return `${basePrompt}

FOR TECHNICAL SKILLS SECTIONS:
- Group by technology categories (e.g., **Programming Languages**, **Cloud Platforms**, **Development Tools**)
- List specific technologies and proficiency levels
- Include years of experience where relevant
- Format like:

**Programming & Development**
• Python, JavaScript, Java (5+ years each)
• React, Node.js, TypeScript (3+ years)

**Cloud & Infrastructure**
• AWS, Azure, Google Cloud Platform
• Docker, Kubernetes, Terraform`;

    case 'areas of expertise':
      return `${basePrompt}

FOR AREAS OF EXPERTISE SECTIONS:
- Create numbered list of key expertise areas
- Each area should have 2-3 supporting bullet points
- Focus on strategic and high-level capabilities
- Format like:

1. **Digital Transformation Leadership**
   • Strategic planning and execution of enterprise-wide initiatives
   • Implementation of emerging technologies and innovation frameworks

2. **Program Management Excellence**
   • Multi-million dollar program oversight with proven ROI
   • Cross-functional team leadership across diverse geographies`;

    default:
      return `${basePrompt}

FORMAT THE CONTENT WITH:
- Clear structure and logical flow
- Proper use of headers and bullet points
- Professional language and terminology
- Preserved quantifiable metrics and achievements`;
  }
}

function getUserPrompt(content: string, sectionType: string, candidateData?: any): string {
  return `Format this ${sectionType} content for a professional competence file PDF. 

ORIGINAL CONTENT:
${content}

CANDIDATE CONTEXT:
${candidateData ? `Name: ${candidateData.fullName || 'N/A'}
Title: ${candidateData.currentTitle || 'N/A'}
Experience: ${candidateData.yearsOfExperience || 'N/A'} years` : 'No additional context provided'}

REQUIREMENTS:
1. Maintain ALL important information from the original content
2. Structure it professionally with clear categories and bullet points
3. Ensure quantifiable achievements and metrics are preserved
4. Use markdown formatting for headers (**bold**) and emphasis (*italic*)
5. Create logical groupings that make sense for this type of content
6. Make it scannable and easy to read in a PDF format

Return ONLY the formatted content, no explanations or additional text.`;
} 