// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
// Helper function to get template display name
function getTemplateDisplayName(template: string): string {
  switch (template) {
    case 'antaes':
      return 'Antaes Consulting';
    case 'emineon':
      return 'Emineon Professional';
    case 'modern':
      return 'Modern Template';
    case 'minimal':
      return 'Minimal Template';
    default:
      return 'Professional Template';
  }
}

// GET - List all competence files for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        {
          candidate: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { currentTitle: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        { fileName: { contains: search, mode: 'insensitive' } },
        {
          metadata: {
            path: ['client'],
            string_contains: search
          }
        },
        {
          metadata: {
            path: ['jobTitle'],
            string_contains: search
          }
        }
      ];
    }
    
    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Fetch competence files from database
    const competenceFiles = await db.competenceFile.findMany({
      where: whereClause,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            currentTitle: true,
            email: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to match frontend interface
    const transformedFiles = competenceFiles.map(file => {
      const metadata = file.metadata as any || {};
      const candidateName = `${file.candidate.firstName} ${file.candidate.lastName}`.trim();
      
      return {
        id: file.id,
        candidateId: file.candidateId,
        candidateName,
        candidateTitle: file.candidate.currentTitle || 'Unknown Title',
        template: metadata.template || 'unknown',
        templateName: file.template?.name || getTemplateDisplayName(metadata.template),
        client: metadata.client || 'Unknown Client',
        job: metadata.jobTitle || 'Unknown Position',
        status: file.status,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
        version: file.version,
        downloadCount: file.downloadCount,
        isAnonymized: file.isAnonymized,
        fileName: file.fileName,
        fileUrl: file.downloadUrl,
        format: file.format,
        sections: file.sectionsConfig || []
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedFiles
    });

  } catch (error) {
    console.error('Error fetching competence files:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch competence files'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new competence file (save sections)
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      candidateId, 
      candidateName,
      candidateTitle,
      template, 
      templateName,
      client,
      job,
      sections, 
      status = 'Draft',
      isAnonymized = false
    } = body;

    // In a real implementation, this would save to database
    const newCompetenceFile = {
      id: Date.now().toString(),
      candidateId,
      candidateName,
      candidateTitle,
      template,
      templateName,
      client,
      job,
      status,
      sections,
      isAnonymized,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      downloadCount: 0,
      fileName: `${candidateName?.replace(/[^a-zA-Z0-9]/g, '_')}_Competence_File.pdf`,
      fileUrl: null,
      format: 'pdf'
    };

    console.log('💾 Saved competence file:', {
      id: newCompetenceFile.id,
      candidate: candidateName,
      template,
      sectionsCount: sections?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: newCompetenceFile
    });

  } catch (error) {
    console.error('Error creating competence file:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create competence file'
      },
      { status: 500 }
    );
  }
} 