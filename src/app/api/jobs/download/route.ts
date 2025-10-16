import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { generatePDF } from '@/lib/pdf-service';
import { z } from 'zod';

const downloadJobSchema = z.object({
  jobData: z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    contractType: z.string(),
    workMode: z.string(),
    description: z.string(),
    skills: z.array(z.string()),
    salary: z.string().optional(),
    department: z.string().optional(),
    startDate: z.string().optional(),
    languages: z.array(z.string()).optional(),
    priority: z.string().optional(),
    logoUrl: z.string().optional(),
    selectedFields: z.object({
      title: z.boolean(),
      company: z.boolean(),
      location: z.boolean(),
      contractType: z.boolean(),
      workMode: z.boolean(),
      department: z.boolean(),
      salary: z.boolean(),
      description: z.boolean(),
      skills: z.boolean(),
      languages: z.boolean(),
      startDate: z.boolean(),
      duration: z.boolean(),
      priority: z.boolean(),
    }).optional(),
  }),
  format: z.enum(['pdf', 'docx']),
  logoUrl: z.string().optional(),
  selectedFields: z.object({
    title: z.boolean(),
    company: z.boolean(),
    location: z.boolean(),
    contractType: z.boolean(),
    workMode: z.boolean(),
    department: z.boolean(),
    salary: z.boolean(),
    description: z.boolean(),
    skills: z.boolean(),
    languages: z.boolean(),
    startDate: z.boolean(),
    duration: z.boolean(),
    priority: z.boolean(),
  }).optional(),
  selectedTemplate: z.object({
    id: z.string(),
    name: z.string(),
    colorHex: z.string(),
    font: z.string(),
  }).optional(),
  customStyleConfig: z.object({
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
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Authentication required to download job description'
      }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = downloadJobSchema.parse(body);
    const { jobData, format, selectedTemplate, customStyleConfig } = validatedData;

    // Generate HTML content for the job description
    const selectedFields = validatedData.selectedFields || jobData.selectedFields || {
      title: true,
      company: true,
      location: true,
      contractType: true,
      workMode: true,
      department: true,
      salary: true,
      description: true,
      skills: true,
      languages: true,
      startDate: true,
      duration: false,
      priority: false
    };
    const htmlContent = generateJobDescriptionHTML(jobData, selectedFields, selectedTemplate, customStyleConfig);

    if (format === 'pdf') {
      // For PDF generation, we'll use a simple HTML to PDF conversion
      // In production, you might want to use puppeteer or similar
      const pdfBuffer = await generatePDFFromHTML(htmlContent);
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${jobData.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
        },
      });
    } else {
      // For DOCX generation
      const docxBuffer = await generateDOCXFromHTML(htmlContent, jobData);
      
      return new NextResponse(docxBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${jobData.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx"`,
        },
      });
    }

  } catch (error) {
    console.error('Job description download error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate job description document' },
      { status: 500 }
    );
  }
}

function generateJobDescriptionHTML(jobData: any, selectedFields: any, selectedTemplate?: any, customStyleConfig?: any): string {
  // Use custom style config if available, otherwise fall back to template or defaults
  const styleConfig = customStyleConfig || selectedTemplate?.styleConfig;
  const primaryColor = styleConfig?.primaryColor || selectedTemplate?.colorHex || '#007bff';
  const titleFont = styleConfig?.titleFont || selectedTemplate?.font || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
  const bodyFont = styleConfig?.bodyFont || selectedTemplate?.font || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
  const titleColor = styleConfig?.titleColor || primaryColor;
  const titleSize = styleConfig?.titleSize || '28px';
  const titleWeight = styleConfig?.titleWeight || '700';
  const subtitleColor = styleConfig?.subtitleColor || '#666';
  const subtitleFont = styleConfig?.subtitleFont || titleFont;
  const subtitleSize = styleConfig?.subtitleSize || '20px';
  const subtitleWeight = styleConfig?.subtitleWeight || '600';
  const bodyColor = styleConfig?.bodyColor || '#333';
  const bodySize = styleConfig?.bodySize || '16px';
  const bodyWeight = styleConfig?.bodyWeight || '400';
  const sectionHeaderColor = styleConfig?.sectionHeaderColor || primaryColor;
  const sectionHeaderFont = styleConfig?.sectionHeaderFont || titleFont;
  const sectionHeaderSize = styleConfig?.sectionHeaderSize || '20px';
  const sectionHeaderWeight = styleConfig?.sectionHeaderWeight || '600';
  const sectionHeaderBackground = styleConfig?.sectionHeaderBackground || '#f8f9fa';
  const borderColor = styleConfig?.borderColor || primaryColor;
  const borderRadius = styleConfig?.borderRadius || '8px';
  const tagBackground = styleConfig?.tagBackground || primaryColor;
  const tagColor = styleConfig?.tagColor || '#ffffff';
  const tagBorderRadius = styleConfig?.tagBorderRadius || '20px';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${jobData.title} - ${jobData.company}</title>
      <style>
        body {
          font-family: ${bodyFont};
          line-height: 1.6;
          color: ${bodyColor};
          font-size: ${bodySize};
          font-weight: ${bodyWeight};
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 2px solid ${borderColor};
          padding-bottom: 20px;
        }
        .header-content h1 {
          margin: 0 0 10px 0;
          color: ${titleColor};
          font-family: ${titleFont};
          font-size: ${titleSize};
          font-weight: ${titleWeight};
        }
        .header-content h2 {
          margin: 0 0 10px 0;
          color: ${subtitleColor};
          font-family: ${subtitleFont};
          font-size: ${subtitleSize};
          font-weight: ${subtitleWeight};
        }
        .header-content .location {
          color: ${bodyColor};
          font-size: ${bodySize};
        }
        .logo {
          max-height: 80px;
          max-width: 200px;
        }
        .job-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
          padding: 20px;
          background-color: ${sectionHeaderBackground};
          border-radius: ${borderRadius};
        }
        .detail-item {
          text-align: center;
        }
        .detail-label {
          font-weight: bold;
          color: ${sectionHeaderColor};
          font-size: 14px;
          margin-bottom: 5px;
        }
        .detail-value {
          color: ${bodyColor};
          font-size: ${bodySize};
        }
        .section {
          margin: 30px 0;
        }
        .section h3 {
          color: ${sectionHeaderColor};
          font-family: ${sectionHeaderFont};
          font-size: ${sectionHeaderSize};
          font-weight: ${sectionHeaderWeight};
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid ${borderColor};
        }
        .description {
          white-space: pre-wrap;
          line-height: 1.7;
          color: ${bodyColor};
          font-size: ${bodySize};
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 15px;
        }
        .skill-tag {
          background-color: ${tagBackground};
          color: ${tagColor};
          padding: 6px 12px;
          border-radius: ${tagBorderRadius};
          font-size: 14px;
          font-weight: 500;
        }
        .languages {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 15px;
        }
        .language-tag {
          background-color: ${tagBackground};
          color: ${tagColor};
          padding: 6px 12px;
          border-radius: ${tagBorderRadius};
          font-size: 14px;
          font-weight: 500;
        }
        @media print {
          body {
            padding: 20px;
          }
          .header {
            page-break-inside: avoid;
          }
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          ${selectedFields.title ? `<h1>${jobData.title || 'Job Title'}</h1>` : ''}
          ${selectedFields.company ? `<h2>${jobData.company || 'Company Name'}</h2>` : ''}
          ${selectedFields.location ? `<div class="location">📍 ${jobData.location || 'Location'}</div>` : ''}
        </div>
        ${jobData.logoUrl ? `<img src="${jobData.logoUrl}" alt="Company logo" class="logo">` : ''}
      </div>

      <div class="job-details">
        ${selectedFields.contractType ? `
          <div class="detail-item">
            <div class="detail-label">Contract Type</div>
            <div class="detail-value">${jobData.contractType || 'Permanent'}</div>
          </div>
        ` : ''}
        ${selectedFields.workMode ? `
          <div class="detail-item">
            <div class="detail-label">Work Mode</div>
            <div class="detail-value">${jobData.workMode || 'Hybrid'}</div>
          </div>
        ` : ''}
        ${selectedFields.department && jobData.department ? `
          <div class="detail-item">
            <div class="detail-label">Department</div>
            <div class="detail-value">${jobData.department}</div>
          </div>
        ` : ''}
        ${selectedFields.salary && jobData.salary ? `
          <div class="detail-item">
            <div class="detail-label">Salary</div>
            <div class="detail-value">${jobData.salary}</div>
          </div>
        ` : ''}
        ${selectedFields.startDate && jobData.startDate ? `
          <div class="detail-item">
            <div class="detail-label">Start Date</div>
            <div class="detail-value">${new Date(jobData.startDate).toLocaleDateString()}</div>
          </div>
        ` : ''}
        ${selectedFields.priority && jobData.priority ? `
          <div class="detail-item">
            <div class="detail-label">Priority</div>
            <div class="detail-value">${jobData.priority}</div>
          </div>
        ` : ''}
      </div>

      ${selectedFields.description ? `
        <div class="section">
          <h3>Job Description</h3>
          <div class="description">${jobData.description || 'Job description will be provided.'}</div>
        </div>
      ` : ''}

      ${selectedFields.skills && jobData.skills && jobData.skills.length > 0 ? `
        <div class="section">
          <h3>Required Skills</h3>
          <div class="skills">
            ${jobData.skills.map((skill: string) => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${selectedFields.languages && jobData.languages && jobData.languages.length > 0 ? `
        <div class="section">
          <h3>Language Requirements</h3>
          <div class="languages">
            ${jobData.languages.map((language: string) => `<span class="language-tag">${language}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

async function generatePDFFromHTML(html: string): Promise<Buffer> {
  try {
    console.log('🚀 Generating PDF from HTML using puppeteer service');
    return await generatePDF(html);
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw new Error('Failed to generate PDF');
  }
}

async function generateDOCXFromHTML(html: string, jobData: any): Promise<Buffer> {
  // Simple DOCX generation
  // In production, you'd use docx library or similar
  // For now, we'll create a basic DOCX structure
  
  const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
      </w:pPr>
      <w:r>
        <w:t>${jobData.title}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>${jobData.company}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>${jobData.location}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>${jobData.description}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  // This is a simplified DOCX structure
  // In production, you'd create a proper ZIP file with all required DOCX components
  return Buffer.from(docxContent);
} 