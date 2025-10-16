// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
// Mock data store (in real implementation, this would be a database)
const mockCompetenceFiles = [
  {
    id: '1',
    candidateId: '1',
    candidateName: 'Sarah Johnson',
    candidateTitle: 'Senior Frontend Engineer',
    template: 'emineon',
    templateName: 'Emineon Professional',
    client: 'UBS Investment Bank',
    job: 'Senior React Developer',
    status: 'Generated',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    version: 1,
    downloadCount: 3,
    isAnonymized: false,
    fileName: 'Sarah_Johnson_UBS_Competence_File.pdf',
    fileUrl: 'https://res.cloudinary.com/emineon/raw/upload/v1749930214/emineon-ats/competence-files/Test_Download_Fix_1749930214191',
    format: 'pdf',
    sections: [
      { id: 'header', title: 'Header', content: 'Sarah Johnson\nSenior Frontend Engineer\nEmail: sarah.johnson@email.com\nPhone: +1 234 567 8900\nLocation: New York, NY', type: 'header', visible: true, order: 0 },
      { id: 'summary', title: 'Professional Summary', content: 'Experienced frontend engineer with 8+ years of expertise in React, TypeScript, and modern web development. Proven track record of leading teams and delivering scalable, high-performance applications. Strong background in UX/UI design principles and agile development methodologies.', type: 'summary', visible: true, order: 1 },
      { id: 'skills', title: 'Technical Skills', content: 'React, TypeScript, JavaScript, Node.js, HTML5, CSS3, SASS, Redux, GraphQL, REST APIs, Webpack, Jest, Cypress, Git, Docker, AWS, Agile/Scrum', type: 'functional-skills', visible: true, order: 2 },
      { id: 'experience', title: 'Professional Experience', content: 'Senior Frontend Engineer at TechCorp (2020-Present)\n• Led development of customer-facing web applications serving 100K+ users\n• Implemented responsive design patterns improving mobile engagement by 40%\n• Mentored junior developers and established coding standards\n\nFrontend Engineer at StartupXYZ (2018-2020)\n• Built React-based dashboard reducing load times by 60%\n• Collaborated with design team to implement pixel-perfect UIs\n• Integrated third-party APIs and payment systems', type: 'experience', visible: true, order: 3 }
    ],
    candidateData: {
      id: '1',
      fullName: 'Sarah Johnson',
      currentTitle: 'Senior Frontend Engineer',
      email: 'sarah.johnson@email.com',
      phone: '+1 234 567 8900',
      location: 'New York, NY',
      yearsOfExperience: 8,
      skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'HTML5', 'CSS3', 'SASS', 'Redux', 'GraphQL', 'REST APIs'],
      certifications: ['AWS Certified Developer', 'React Professional Certification'],
      experience: [
        {
          company: 'TechCorp',
          title: 'Senior Frontend Engineer',
          startDate: '2020-01',
          endDate: 'Present',
          responsibilities: 'Led development of customer-facing web applications serving 100K+ users. Implemented responsive design patterns improving mobile engagement by 40%. Mentored junior developers and established coding standards.'
        },
        {
          company: 'StartupXYZ',
          title: 'Frontend Engineer',
          startDate: '2018-06',
          endDate: '2020-01',
          responsibilities: 'Built React-based dashboard reducing load times by 60%. Collaborated with design team to implement pixel-perfect UIs. Integrated third-party APIs and payment systems.'
        }
      ],
      education: ['BS Computer Science - MIT (2016)', 'Frontend Development Bootcamp - General Assembly (2017)'],
      languages: ['English (Native)', 'Spanish (Conversational)', 'French (Basic)'],
      summary: 'Experienced frontend engineer with 8+ years of expertise in React, TypeScript, and modern web development. Proven track record of leading teams and delivering scalable, high-performance applications.'
    }
  },
  {
    id: '2',
    candidateId: '2',
    candidateName: 'David Chen',
    candidateTitle: 'Backend Engineer',
    template: 'antaes',
    templateName: 'Antaes Consulting',
    client: 'Credit Suisse',
    job: 'Python Developer',
    status: 'Draft',
    createdAt: '2024-01-14T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    version: 2,
    downloadCount: 0,
    isAnonymized: true,
    fileName: 'David_Chen_CS_Competence_File.pdf',
    fileUrl: null,
    format: 'pdf',
    sections: [
      { id: 'header', title: 'Header', content: 'David Chen\nBackend Engineer\nEmail: [REDACTED]\nPhone: [REDACTED]\nLocation: San Francisco, CA', type: 'header', visible: true, order: 0 },
      { id: 'summary', title: 'Executive Summary', content: 'Backend engineer with expertise in Python, Django, and distributed systems. Strong background in API development and database optimization.', type: 'summary', visible: true, order: 1 }
    ],
    candidateData: {
      id: '2',
      fullName: 'David Chen',
      currentTitle: 'Backend Engineer',
      email: 'david.chen@email.com',
      phone: '+1 555 123 4567',
      location: 'San Francisco, CA',
      yearsOfExperience: 6,
      skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'REST APIs', 'GraphQL'],
      certifications: ['AWS Solutions Architect', 'Python Professional Certification'],
      experience: [
        {
          company: 'DataTech Inc',
          title: 'Backend Engineer',
          startDate: '2019-03',
          endDate: 'Present',
          responsibilities: 'Developed and maintained scalable backend services handling millions of requests daily. Optimized database queries improving response times by 50%. Implemented microservices architecture.'
        }
      ],
      education: ['MS Computer Science - Stanford (2018)', 'BS Software Engineering - UC Berkeley (2016)'],
      languages: ['English (Fluent)', 'Mandarin (Native)', 'Japanese (Intermediate)'],
      summary: 'Backend engineer with expertise in Python, Django, and distributed systems. Strong background in API development and database optimization.'
    }
  }
];

// GET - Get specific competence file by ID
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
            summary: true
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

    // Format the response to match the expected interface
    const formattedFile = {
      id: competenceFile.id,
      candidateId: competenceFile.candidateId,
      candidateName: `${competenceFile.candidate?.firstName} ${competenceFile.candidate?.lastName}`,
      candidateTitle: competenceFile.candidate?.currentTitle || '',
      template: competenceFile.template?.name || 'Unknown',
      templateName: competenceFile.template?.name || 'Unknown Template',
      client: (competenceFile.metadata as any)?.client || 'Unknown Client',
      job: (competenceFile.metadata as any)?.jobTitle || 'Unknown Position',
      status: competenceFile.status,
      createdAt: competenceFile.createdAt.toISOString(),
      updatedAt: competenceFile.updatedAt.toISOString(),
      version: competenceFile.version,
      downloadCount: competenceFile.downloadCount,
      isAnonymized: competenceFile.isAnonymized,
      fileName: competenceFile.fileName,
      fileUrl: competenceFile.downloadUrl,
      format: competenceFile.format,
      sections: competenceFile.sectionsConfig || [],
      candidateData: competenceFile.candidate ? {
        id: competenceFile.candidate.id,
        fullName: `${competenceFile.candidate.firstName} ${competenceFile.candidate.lastName}`,
        currentTitle: competenceFile.candidate.currentTitle,
        email: competenceFile.candidate.email,
        phone: competenceFile.candidate.phone,
        location: competenceFile.candidate.currentLocation,
        yearsOfExperience: competenceFile.candidate.experienceYears,
        skills: competenceFile.candidate.technicalSkills,
        certifications: competenceFile.candidate.certifications,
        languages: competenceFile.candidate.spokenLanguages,
        summary: competenceFile.candidate.summary
      } : null
    };

    return NextResponse.json({
      success: true,
      data: formattedFile
    });

  } catch (error) {
    console.error('Error fetching competence file:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch competence file'
      },
      { status: 500 }
    );
  }
}

// PUT - Update competence file
export async function PUT(
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
    const body = await request.json();
    const { sections, status, isAnonymized, ...updateData } = body;

    // First check if the file exists
    const existingFile = await db.competenceFile.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!existingFile) {
      return NextResponse.json(
        { success: false, message: 'Competence file not found' },
        { status: 404 }
      );
    }

    // Update the file in the database
    const updatedFile = await db.competenceFile.update({
      where: { id },
      data: {
        sectionsConfig: sections || existingFile.sectionsConfig,
        status: status || existingFile.status,
        isAnonymized: isAnonymized !== undefined ? isAnonymized : existingFile.isAnonymized,
        version: existingFile.version + 1,
        updatedAt: new Date()
      },
      include: {
        candidate: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('📝 Updated competence file:', {
      id,
      candidate: `${updatedFile.candidate?.firstName} ${updatedFile.candidate?.lastName}`,
      sectionsCount: sections?.length || 0,
      status: status || updatedFile.status
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedFile.id,
        candidateId: updatedFile.candidateId,
        candidateName: `${updatedFile.candidate?.firstName} ${updatedFile.candidate?.lastName}`,
        status: updatedFile.status,
        version: updatedFile.version,
        updatedAt: updatedFile.updatedAt.toISOString(),
        sections: updatedFile.sectionsConfig
      }
    });

  } catch (error) {
    console.error('Error updating competence file:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update competence file'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete competence file
export async function DELETE(
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
    
    // First check if the file exists in the database
    const competenceFile = await db.competenceFile.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            firstName: true,
            lastName: true
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

    // Delete the file from the database
    await db.competenceFile.delete({
      where: { id }
    });

    console.log('🗑️ Deleted competence file:', {
      id,
      candidate: `${competenceFile.candidate?.firstName} ${competenceFile.candidate?.lastName}`,
      fileName: competenceFile.fileName,
      status: competenceFile.status
    });

    return NextResponse.json({
      success: true,
      message: 'Competence file deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting competence file:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete competence file'
      },
      { status: 500 }
    );
  }
} 