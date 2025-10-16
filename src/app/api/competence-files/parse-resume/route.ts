import { candidateQueries } from '@/lib/db/queries';
import { query } from '@/lib/db/neon-client';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supported file types based on OpenAI documentation
const SUPPORTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'text/x-markdown': '.md',
  'application/octet-stream': '.md', // Some systems detect .md files as octet-stream
  'text/html': '.html'
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Check if this is a JSON request with text content
    const contentType = request.headers.get('content-type') || '';
    
    let candidateData;
    let uploadedFileId: string | null = null;

    // Define the prompt for structured extraction
    const extractionPrompt = `Please analyze this resume content and extract structured information.

Extract all available information and return a JSON object with the following structure:

{
  "fullName": "string",
  "currentTitle": "string", 
  "email": "string",
  "phone": "string",
  "location": "string",
  "yearsOfExperience": number,
  "skills": ["string"],
  "certifications": ["string"],
  "experience": [
    {
      "company": "string",
      "title": "string", 
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "responsibilities": "string"
    }
  ],
  "education": ["string"],
  "languages": ["string"],
  "summary": "string"
}

Instructions:
- Extract all available information from the content
- If some fields are not available, use empty strings or arrays
- For yearsOfExperience, calculate based on work history (if not explicitly stated)
- For summary, create a brief professional summary based on the resume content
- Ensure all text is properly formatted and clean
- Return ONLY the JSON object, no additional text or formatting

Return the JSON object now:`;

    if (contentType.includes('application/json')) {
      // Handle direct text input
      const body = await request.json();
      const { text } = body;

      if (!text || typeof text !== 'string') {
        return NextResponse.json({ 
          error: 'No text provided',
          message: 'Please provide resume text to parse'
        }, { status: 400 });
      }

      if (text.trim().length < 50) {
        return NextResponse.json({
          error: 'Text too short',
          message: 'Please provide more detailed resume information'
        }, { status: 400 });
      }

      console.log(`📝 Processing resume text (${text.length} characters)`);

      try {
        // Use OpenAI Responses API for text processing
        const response = await openai.responses.create({
          model: "gpt-4o",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `${extractionPrompt}

Resume Content:
${text}`
                }
              ]
            }
          ]
        });

        // Extract the response content
        const responseMessage = response.output[0];
        if (!responseMessage || responseMessage.type !== 'message') {
          throw new Error('No valid response from Responses API');
        }

        const textContent = responseMessage.content[0];
        if (!textContent || textContent.type !== 'output_text') {
          throw new Error('No text content in Responses API response');
        }

        const responseContent = textContent.text;

        // Parse the JSON response
        let cleanedResponse;
        try {
          // Clean the response in case there's any markdown formatting
          cleanedResponse = responseContent.replace(/```json\n?|\n?```/g, '').trim();
          candidateData = JSON.parse(cleanedResponse);
        } catch (parseError) {
          console.error('❌ Failed to parse Responses API response as JSON:', parseError);
          
          // Try to extract JSON from the response
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            candidateData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in Responses API response');
          }
        }

      } catch (responsesError: any) {
        throw new Error(`OpenAI Responses API failed: ${responsesError.message}. Please try again or contact support if the issue persists.`);
      }

      // Store original text for text input
      candidateData.originalText = text.substring(0, 500) + (text.length > 500 ? '...' : '');

    } else {
      // Handle file upload
      // Get the uploaded file from FormData
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ 
          error: 'No file provided',
          message: 'Please upload a resume file (PDF, DOCX, TXT, MD, or HTML)'
        }, { status: 400 });
      }

      // Validate file type (check both MIME type and file extension)
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const isValidMimeType = Object.keys(SUPPORTED_FILE_TYPES).includes(file.type);
      const isValidExtension = ['pdf', 'docx', 'txt', 'md', 'html'].includes(fileExtension || '');
      
      if (!isValidMimeType && !isValidExtension) {
        return NextResponse.json({
          error: 'Invalid file type',
          message: `Unsupported file type: ${file.type} (${file.name}). Supported formats: PDF, DOCX, TXT, MD, HTML`
        }, { status: 400 });
      }

      // Validate file size (32MB limit for OpenAI API, but we'll use 25MB for safety)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        return NextResponse.json({
          error: 'File too large',
          message: 'File size must be less than 25MB'
        }, { status: 400 });
      }

      console.log(`📁 Processing file: ${file.name} (${file.size} bytes, ${file.type})`);

      // Try different approaches based on file type
      const isPdfOrDocx = file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (isPdfOrDocx) {
        // For PDF/DOCX files, try the Responses API with file upload first
        try {
          console.log('☁️ Uploading file to OpenAI for PDF/DOCX processing...');
          
          const uploadedFile = await openai.files.create({
            file: file,
            purpose: "user_data",
          });

          uploadedFileId = uploadedFile.id;
          console.log(`✅ File uploaded to OpenAI: ${uploadedFile.id}`);

          // Use the Responses API with the uploaded file
          console.log('🤖 Processing PDF/DOCX with Responses API (file upload method)...');
          
          const response = await openai.responses.create({
            model: "gpt-4o",
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_file",
                    file_id: uploadedFile.id,
                  },
                  {
                    type: "input_text",
                    text: extractionPrompt
                  }
                ]
              }
            ]
          });

          // Check if response has the correct structure
          if (!response.output || response.output.length === 0) {
            throw new Error('No output from Responses API');
          }

          const responseMessage = response.output[0];
          if (!responseMessage || responseMessage.type !== 'message') {
            throw new Error('Invalid response format from Responses API');
          }

          if (!responseMessage.content || responseMessage.content.length === 0) {
            throw new Error('No content in response from Responses API');
          }

          const textContent = responseMessage.content[0];
          if (!textContent || textContent.type !== 'output_text') {
            throw new Error('No text content in response from Responses API');
          }

          const fileUploadResponse = textContent.text;
          
          if (!fileUploadResponse) {
            throw new Error('No response text from OpenAI Responses API');
          }

          console.log('📋 Raw OpenAI response length:', fileUploadResponse.length);

          // Parse the JSON response
          try {
            const cleanedResponse = fileUploadResponse.replace(/```json\n?|\n?```/g, '').trim();
            candidateData = JSON.parse(cleanedResponse);
            console.log('✅ Successfully parsed PDF/DOCX with Responses API (file upload)');
          } catch (parseError) {
            console.error('❌ Failed to parse Responses API response as JSON:', parseError);
            
            // Try to extract JSON from the response
            const jsonMatch = fileUploadResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              candidateData = JSON.parse(jsonMatch[0]);
              console.log('✅ Successfully extracted JSON from Responses API response');
            } else {
              throw new Error('No valid JSON found in Responses API response');
            }
          }

        } catch (fileUploadError: any) {
          console.warn('⚠️ File upload method failed, trying base64 method:', fileUploadError.message);
          
          // Fallback to base64 encoding for PDF/DOCX
          try {
            console.log('🔄 Converting PDF/DOCX to base64 for Responses API...');
            
            const arrayBuffer = await file.arrayBuffer();
            const base64String = Buffer.from(arrayBuffer).toString('base64');
            
            console.log('🤖 Processing PDF/DOCX with Responses API (base64 method)...');
            
            const response = await openai.responses.create({
              model: "gpt-4o",
              input: [
                {
                  role: "user",
                  content: [
                    {
                      type: "input_file",
                      filename: file.name,
                      file_data: `data:${file.type};base64,${base64String}`,
                    },
                    {
                      type: "input_text",
                      text: extractionPrompt
                    }
                  ]
                }
              ]
            });

            // Check response structure for base64 method
            if (!response.output || response.output.length === 0) {
              throw new Error('No output from Responses API (base64)');
            }

            const responseMessage = response.output[0];
            if (!responseMessage || responseMessage.type !== 'message') {
              throw new Error('Invalid response format from Responses API (base64)');
            }

            if (!responseMessage.content || responseMessage.content.length === 0) {
              throw new Error('No content in response from Responses API (base64)');
            }

            const textContent = responseMessage.content[0];
            if (!textContent || textContent.type !== 'output_text') {
              throw new Error('No text content in response from Responses API (base64)');
            }

            const base64Response = textContent.text;
            
            if (!base64Response) {
              throw new Error('No response text from OpenAI Responses API (base64)');
            }

            console.log('📋 Base64 response length:', base64Response.length);

            // Parse the JSON response
            try {
              const cleanedResponse = base64Response.replace(/```json\n?|\n?```/g, '').trim();
              candidateData = JSON.parse(cleanedResponse);
              console.log('✅ Successfully parsed PDF/DOCX with Responses API (base64)');
            } catch (parseError) {
              console.error('❌ Failed to parse base64 response as JSON:', parseError);
              
              // Try to extract JSON from the response
              const jsonMatch = base64Response.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                candidateData = JSON.parse(jsonMatch[0]);
                console.log('✅ Successfully extracted JSON from base64 response');
              } else {
                throw new Error('No valid JSON found in base64 response');
              }
            }

          } catch (base64Error: any) {
            throw new Error(`OpenAI Responses API failed for PDF/DOCX processing: ${base64Error.message}. Please try again or contact support if the issue persists.`);
          }
        }
      } else {
        // For text files (TXT, MD, HTML), use Responses API with base64 encoding
        try {
          console.log('🔄 Converting text file to base64 for Responses API...');
          
          const arrayBuffer = await file.arrayBuffer();
          const base64String = Buffer.from(arrayBuffer).toString('base64');
          
          console.log('🤖 Processing text file with Responses API...');
          
          const response = await openai.responses.create({
            model: "gpt-4o",
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_file",
                    filename: file.name,
                    file_data: `data:${file.type};base64,${base64String}`,
                  },
                  {
                    type: "input_text",
                    text: extractionPrompt
                  }
                ]
              }
            ]
          });

          // Check response structure for text files
          if (!response.output || response.output.length === 0) {
            throw new Error('No output from Responses API');
          }

          const responseMessage = response.output[0];
          if (!responseMessage || responseMessage.type !== 'message') {
            throw new Error('Invalid response format from Responses API');
          }

          if (!responseMessage.content || responseMessage.content.length === 0) {
            throw new Error('No content in response from Responses API');
          }

          const textContent = responseMessage.content[0];
          if (!textContent || textContent.type !== 'output_text') {
            throw new Error('No text content in response from Responses API');
          }

          const textFileResponse = textContent.text;
          
          if (!textFileResponse) {
            throw new Error('No response text from OpenAI Responses API');
          }

          console.log('📋 Text file response length:', textFileResponse.length);

          // Parse the JSON response
          try {
            const cleanedResponse = textFileResponse.replace(/```json\n?|\n?```/g, '').trim();
            candidateData = JSON.parse(cleanedResponse);
            console.log('✅ Successfully parsed text file with Responses API');
          } catch (parseError) {
            console.error('❌ Failed to parse text file response as JSON:', parseError);
            
            // Try to extract JSON from the response
            const jsonMatch = textFileResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              candidateData = JSON.parse(jsonMatch[0]);
              console.log('✅ Successfully extracted JSON from text file response');
            } else {
              throw new Error('No valid JSON found in text file response');
            }
          }

          // Store file metadata for file uploads
          candidateData.originalFileName = file.name;
          candidateData.fileType = file.type;

        } catch (textFileError: any) {
          throw new Error(`OpenAI Responses API failed for text file processing: ${textFileError.message}. Please try again or contact support if the issue persists.`);
        }
      }
    }

    // Validate required fields
    if (!candidateData.fullName) {
      throw new Error('Could not extract candidate name from resume');
    }

    // Add metadata
    candidateData.source = contentType.includes('application/json') ? 'text_input' : 'resume_upload';

    // --- NEW: Create or update candidate in the database ---
    const [firstName, ...lastNameParts] = candidateData.fullName.split(' ');
    const lastName = lastNameParts.join(' ');
    const email = candidateData.email || `${candidateData.fullName.replace(/\s+/g, '').toLowerCase()}@temp.generated`;

    // Try to find existing candidate by email or name
    let dbCandidate = null;
    const existingCandidates = await query(
      `SELECT * FROM candidates 
       WHERE email = $1 
       OR (first_name = $2 AND last_name = $3)
       LIMIT 1`,
      [email, firstName || '', lastName || '']
    );
    
    if (existingCandidates.length > 0) {
      dbCandidate = existingCandidates[0];
    } else {
      // Create new candidate
      dbCandidate = await candidateQueries.create({
        first_name: firstName || 'Unknown',
        last_name: lastName || '',
        email: email,
        current_title: candidateData.currentTitle || '',
        phone: candidateData.phone || null,
        current_location: candidateData.location || null,
        experience_years: candidateData.yearsOfExperience || null,
        summary: candidateData.summary || null,
        technical_skills: candidateData.skills || [],
        certifications: candidateData.certifications || [],
        spoken_languages: candidateData.languages || [],
        status: 'ACTIVE',
        gdpr_consent: true,
        gdpr_consent_date: new Date()
      });
    }

    // Build the response candidate object
    const responseCandidate = {
      id: dbCandidate.id,
      fullName: `${dbCandidate.first_name} ${dbCandidate.last_name}`.trim(),
      currentTitle: dbCandidate.current_title,
      email: dbCandidate.email,
      phone: dbCandidate.phone,
      location: dbCandidate.current_location,
      yearsOfExperience: typeof dbCandidate.experience_years === 'number' && Number.isFinite(dbCandidate.experience_years) ? dbCandidate.experience_years : 0,
      skills: dbCandidate.technical_skills,
      certifications: dbCandidate.certifications,
      experience: candidateData.experience || [],
      education: candidateData.education || [],
      languages: dbCandidate.spoken_languages,
      summary: dbCandidate.summary || ''
    };

    // Clean up uploaded file if it exists
    if (uploadedFileId) {
      try {
        await openai.files.del(uploadedFileId);
        console.log('🗑️ Cleaned up uploaded file:', uploadedFileId);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up uploaded file:', cleanupError);
      }
    }

    return NextResponse.json({
      success: true,
      data: responseCandidate,
      message: 'Resume parsed and candidate saved successfully'
    });

  } catch (error: any) {
    console.error('💥 Resume parsing error:', error);
    console.error('🔧 DEBUG: Error details:', {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      stack: error?.stack?.split('\n').slice(0, 5) // First 5 lines of stack trace
    });
    
    // Handle specific error types
    let errorMessage = 'There was an error processing your resume. Please try again.';
    let statusCode = 500;
    
    // OpenAI specific errors
    if (error?.status === 401) {
      console.error('🔧 DEBUG: OpenAI authentication failed');
      statusCode = 500;
      errorMessage = 'AI service authentication failed. Please contact support.';
    } else if (error?.status === 429) {
      console.error('🔧 DEBUG: OpenAI rate limit exceeded');
      statusCode = 500;
      errorMessage = 'Service is temporarily busy. Please try again in a few moments.';
    } else if (error?.status === 400) {
      console.error('🔧 DEBUG: OpenAI bad request');
      statusCode = 400;
      if (error?.message?.includes('Invalid MIME type')) {
        errorMessage = 'The file format is not supported. Please use PDF, DOCX, TXT, MD, or HTML format.';
      } else if (error?.message?.includes('too large')) {
        errorMessage = 'File is too large. Maximum file size is 25MB.';
      } else {
        errorMessage = error.message || 'Invalid request format';
      }
    } else if (error?.message?.includes('Could not extract')) {
      console.error('🔧 DEBUG: Could not extract candidate information');
      statusCode = 422;
      errorMessage = 'Could not extract candidate information from the resume. Please ensure the file contains clear candidate details with name, experience, and skills.';
    } else if (error?.message?.includes('Authentication') || error?.message?.includes('Unauthorized')) {
      console.error('🔧 DEBUG: Authentication error');
      statusCode = 401;
      errorMessage = 'Authentication failed. Please refresh the page and try again.';
    } else if (error?.message?.includes('API key') || error?.message?.includes('Configuration Error')) {
      console.error('🔧 DEBUG: API key or configuration error');
      statusCode = 500;
      errorMessage = 'Service temporarily unavailable. Please try again later.';
    } else if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      console.error('🔧 DEBUG: Network connection error');
      statusCode = 500;
      errorMessage = 'Network connection error. Please check your internet connection and try again.';
    } else if (error?.message?.includes('fetch')) {
      console.error('🔧 DEBUG: Fetch/network error');
      statusCode = 500;
      errorMessage = 'Network error occurred. Please try again.';
    } else {
      console.error('🔧 DEBUG: Unknown error type');
      errorMessage = error.message || errorMessage;
    }
    
    return NextResponse.json({
      success: false,
      error: error.name || 'ParseError',
      message: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? {
        originalError: error?.message,
        errorType: error?.name,
        statusCode: error?.status
      } : undefined
    }, { status: statusCode });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Resume parsing endpoint',
    supportedFormats: ['PDF', 'DOCX', 'TXT', 'MD', 'HTML'],
    maxFileSize: '25MB',
    authentication: 'required',
    endpoint: '/api/competence-files/parse-resume',
    status: 'active'
  });
} 