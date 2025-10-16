// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// Schema for creating/updating job templates
const JobTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  industry: z.string().optional(),
  features: z.array(z.string()).default([]),
  colorScheme: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
  }),
  styleConfig: z.object({
    titleFont: z.string(),
    titleSize: z.string(),
    titleWeight: z.string(),
    titleColor: z.string(),
    subtitleFont: z.string(),
    subtitleSize: z.string(),
    subtitleWeight: z.string(),
    subtitleColor: z.string(),
    bodyFont: z.string(),
    bodySize: z.string(),
    bodyWeight: z.string(),
    bodyColor: z.string(),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    backgroundColor: z.string(),
    borderColor: z.string(),
    spacing: z.enum(['compact', 'normal', 'spacious']),
    borderRadius: z.string(),
    borderWidth: z.string(),
    sectionHeaderFont: z.string(),
    sectionHeaderSize: z.string(),
    sectionHeaderWeight: z.string(),
    sectionHeaderColor: z.string(),
    sectionHeaderBackground: z.string(),
    bulletStyle: z.enum(['disc', 'circle', 'square', 'none', 'custom']),
    bulletColor: z.string(),
    listIndent: z.string(),
    tagBackground: z.string(),
    tagColor: z.string(),
    tagBorder: z.string(),
    tagBorderRadius: z.string(),
  }),
  sections: z.array(z.object({
    key: z.string(),
    label: z.string(),
    show: z.boolean(),
    order: z.number(),
  })),
  sampleContent: z.object({
    title: z.string(),
    description: z.string(),
    responsibilities: z.array(z.string()),
    requirements: z.array(z.string()),
    benefits: z.array(z.string()),
  }).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

// GET - List all job templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (industry) {
      where.industry = industry;
    }
    
    if (activeOnly) {
      where.isActive = true;
    }

    const templates = await db.jobTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      templates
    });

  } catch (error: any) {
    console.error('Error fetching job templates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch templates',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Create a new job template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = JobTemplateSchema.parse(body);

    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await db.jobTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const template = await db.jobTemplate.create({
      data: {
        ...validatedData,
        colorScheme: validatedData.colorScheme as any,
        styleConfig: validatedData.styleConfig as any,
        sections: validatedData.sections as any,
        sampleContent: validatedData.sampleContent as any || undefined,
      }
    });

    return NextResponse.json({
      success: true,
      template
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating job template:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Invalid template data',
          details: error.errors 
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create template',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT - Update an existing job template
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = JobTemplateSchema.partial().parse(body);

    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await db.jobTemplate.updateMany({
        where: { 
          isDefault: true,
          id: { not: templateId }
        },
        data: { isDefault: false }
      });
    }

    const template = await db.jobTemplate.update({
      where: { id: templateId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      template
    });

  } catch (error: any) {
    console.error('Error updating job template:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Invalid template data',
          details: error.errors 
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update template',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a job template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    await db.jobTemplate.delete({
      where: { id: templateId }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting job template:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete template',
        message: error.message 
      },
      { status: 500 }
    );
  }
} 