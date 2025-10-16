import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Authentication required for email generation'
      }, { status: 401 });
    }

    console.log('✅ Email generation request from user:', userId);

    const body = await request.json();
    const { purpose, context, personalize, currentEmailContent } = body;

    if (!purpose) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'Email purpose is required'
      }, { status: 400 });
    }

    console.log('📝 Generating email for purpose:', purpose);

    // Define email templates and prompts based on purpose
    const emailPrompts = {
      initial_outreach: {
        systemPrompt: "You are an expert recruiter writing personalized outreach emails to potential candidates.",
        userPrompt: `Generate a professional initial outreach email for a candidate. 
        Context: ${context || 'General recruitment outreach'}
        
        The email should be:
        - Professional but friendly
        - Personalized and engaging
        - Clear about the opportunity
        - Include a call to action
        - Not too long (under 200 words)`
      },
      follow_up: {
        systemPrompt: "You are a recruiter following up with candidates who have shown interest.",
        userPrompt: `Generate a follow-up email for a candidate application.
        Context: ${context || 'Following up on application'}
        
        The email should:
        - Acknowledge their application
        - Provide next steps
        - Show continued interest
        - Be encouraging and professional`
      },
      interview_invite: {
        systemPrompt: "You are a recruiter inviting candidates for interviews.",
        userPrompt: `Generate an interview invitation email.
        Context: ${context || 'Interview invitation'}
        
        The email should:
        - Congratulate them on moving forward
        - Provide clear interview details
        - Include preparation instructions
        - Be professional and welcoming`
      },
      interview_reminder: {
        systemPrompt: "You are sending a friendly reminder about an upcoming interview.",
        userPrompt: `Generate an interview reminder email.
        Context: ${context || 'Interview reminder'}
        
        The email should:
        - Remind about the interview details
        - Include any last-minute instructions
        - Be brief and helpful
        - Include contact information for questions`
      },
      offer_letter: {
        systemPrompt: "You are extending a job offer to a successful candidate.",
        userPrompt: `Generate a job offer email.
        Context: ${context || 'Job offer'}
        
        The email should:
        - Congratulate the candidate
        - Outline the offer details
        - Express excitement about them joining
        - Provide next steps for acceptance`
      },
      rejection: {
        systemPrompt: "You are writing a respectful rejection email to maintain good candidate relationships.",
        userPrompt: `Generate a polite rejection email.
        Context: ${context || 'Application rejection'}
        
        The email should:
        - Be respectful and empathetic
        - Thank them for their time
        - Encourage future applications
        - Keep the door open for other opportunities`
      },
      reference_check: {
        systemPrompt: "You are requesting references for a candidate.",
        userPrompt: `Generate a reference check request email.
        Context: ${context || 'Reference check request'}
        
        The email should:
        - Explain the purpose clearly
        - Provide candidate information
        - Ask specific questions
        - Be professional and respectful of their time`
      },
      onboarding: {
        systemPrompt: "You are providing onboarding information to a new hire.",
        userPrompt: `Generate an onboarding information email.
        Context: ${context || 'New hire onboarding'}
        
        The email should:
        - Welcome them to the team
        - Provide essential first-day information
        - Include contact details for questions
        - Express excitement about their start`
      }
    };

    const promptConfig = emailPrompts[purpose as keyof typeof emailPrompts];
    
    if (!promptConfig) {
      return NextResponse.json({
        error: 'Invalid purpose',
        message: 'Unknown email purpose specified'
      }, { status: 400 });
    }

    // Add personalization context if requested
    let finalPrompt = promptConfig.userPrompt;
    if (personalize && currentEmailContent) {
      finalPrompt += `\n\nCurrent email context: ${currentEmailContent.substring(0, 500)}`;
      finalPrompt += `\n\nPlease personalize the email based on this context.`;
    }

    finalPrompt += `\n\nRespond with a JSON object containing 'subject' and 'body' fields. The body should be in HTML format for rich text display.`;

    // Call OpenAI for email generation
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: promptConfig.systemPrompt + " Always respond with valid JSON containing 'subject' and 'body' fields."
        },
        {
          role: "user",
          content: finalPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const generatedText = completion.choices[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('No email generated');
    }

    // Parse the JSON response
    let emailData;
    try {
      emailData = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('Failed to parse email JSON:', parseError);
      // Try to extract subject and body from the text
      const lines = generatedText.split('\n').filter(line => line.trim());
      emailData = {
        subject: lines[0] || 'Generated Email',
        body: generatedText.replace(lines[0], '').trim()
      };
    }

    // Ensure we have both subject and body
    if (!emailData.subject || !emailData.body) {
      throw new Error('Generated email missing required fields');
    }

    // Convert plain text body to HTML if needed
    if (!emailData.body.includes('<') && !emailData.body.includes('>')) {
      emailData.body = emailData.body
        .split('\n\n')
        .map((paragraph: string) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
    }

    console.log('🤖 Email generated successfully for purpose:', purpose);

    return NextResponse.json({
      success: true,
      data: {
        subject: emailData.subject,
        body: emailData.body,
        purpose: purpose,
        generatedAt: new Date().toISOString()
      },
      metadata: {
        purpose,
        personalized: personalize,
        hasContext: !!context
      }
    });

  } catch (error) {
    console.error('❌ Email generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Generation failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 