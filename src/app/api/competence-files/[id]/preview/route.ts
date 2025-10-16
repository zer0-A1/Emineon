// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
// Import generation functions and AI enrichment service
import { generateAntaesCompetenceFileHTML, generateCompetenceFileHTML } from '../../generate/route';
import { competenceEnrichmentService } from '@/lib/ai/competence-enrichment';

// GET - Generate HTML preview of competence file with AI enrichment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Fetch competence file from database with all necessary relations
    const competenceFile = await db.competenceFile.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            currentTitle: true,
            email: true,
            phone: true,
            currentLocation: true,
            experienceYears: true,
            technicalSkills: true,
            certifications: true,
            spokenLanguages: true,
            summary: true,
            degrees: true,
            softSkills: true,
            workExperiences: {
              select: {
                id: true,
                company: true,
                jobTitle: true,
                startDate: true,
                endDate: true,
                responsibilities: true,
                achievements: true,
                technologies: true
              },
              orderBy: {
                startDate: 'desc'
              }
            }
          }
        },
        template: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!competenceFile) {
      return NextResponse.json(
        { success: false, message: 'Competence file not found' },
        { status: 404 }
      );
    }

    // Format candidate data for AI enrichment
    const candidateData = {
      id: competenceFile.candidate?.id || '',
      fullName: `${competenceFile.candidate?.firstName} ${competenceFile.candidate?.lastName}`,
      currentTitle: competenceFile.candidate?.currentTitle || '',
      email: competenceFile.candidate?.email || '',
      phone: competenceFile.candidate?.phone || '',
      location: competenceFile.candidate?.currentLocation || '',
      yearsOfExperience: competenceFile.candidate?.experienceYears || 0,
      skills: [
        ...(competenceFile.candidate?.technicalSkills || []),
        ...(competenceFile.candidate?.softSkills || [])
      ],
      certifications: competenceFile.candidate?.certifications || [],
      experience: (competenceFile.candidate?.workExperiences || []).map(exp => ({
        company: exp.company || '',
        title: exp.jobTitle || '',
        startDate: exp.startDate ? new Date(exp.startDate).toISOString().slice(0, 7) : '',
        endDate: exp.endDate ? new Date(exp.endDate).toISOString().slice(0, 7) : '',
        responsibilities: exp.responsibilities || ''
      })),
      education: competenceFile.candidate?.degrees || [],
      languages: competenceFile.candidate?.spokenLanguages || [],
      summary: competenceFile.candidate?.summary || ''
    };

    // Get sections from competence file metadata or generate default sections
    const sections = (competenceFile.metadata as any)?.sections || [];

    const templateName = competenceFile.template?.name || 'Unknown';
    const candidateName = candidateData.fullName;
    
    // Parse job description from metadata if available
    const jobDescription = (competenceFile.metadata as any)?.jobDescription;

    console.log('🔍 Generating AI-enhanced preview for competence file:', {
      id,
      candidate: candidateName,
      template: templateName,
      hasJobDescription: !!jobDescription
    });

    // Generate AI-enhanced content
    let enrichedContent;
    try {
      console.log('🤖 Starting AI enrichment for preview...');
      enrichedContent = await competenceEnrichmentService.enrichCandidateForJob(
        candidateData,
        jobDescription,
        templateName.toLowerCase().includes('antaes') ? 'Antaes' : undefined
      );
      console.log('✅ AI enrichment completed for preview');
    } catch (error) {
      console.warn('⚠️ AI enrichment failed for preview, showing basic content:', error);
      enrichedContent = null;
    }

    // Generate HTML using the same logic as PDF generation with AI enrichment
    let htmlContent: string;
    
    // Determine template type based on template name or metadata
    const isAntaesTemplate = templateName.toLowerCase().includes('antaes') || 
                            (competenceFile.metadata as any)?.template === 'antaes';
    
    if (isAntaesTemplate) {
      htmlContent = generateAntaesCompetenceFileHTML(candidateData, sections, jobDescription, undefined, enrichedContent || undefined);
    } else {
      htmlContent = generateCompetenceFileHTML(candidateData, sections, jobDescription, undefined, enrichedContent || undefined);
    }

    // Add preview-specific styling and indicators
    const previewHTML = htmlContent.replace(
      '<body>',
      `<body>
        <div class="preview-indicator" style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #0A2F5A;
          color: white;
          padding: 8px 16px;
          text-align: center;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
          📄 PREVIEW MODE - ${candidateName} • ${templateName} • ${enrichedContent ? 'AI-Enhanced' : 'Basic'} • Version ${competenceFile.version}
        </div>
        <div style="margin-top: 40px;">`
    ).replace(
      '</body>',
      `</div></body>`
    );

    return new NextResponse(previewHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to generate preview'
      },
      { status: 500 }
    );
  }
} 