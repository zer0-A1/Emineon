// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { structuredCompetenceService } from '@/lib/services/structured-competence-service';
import { generatePDF } from '@/lib/pdf-service';
import { put } from '@vercel/blob';
import { getQueueMetrics } from '@/lib/ai/queue';
// Helper function to convert editor segments to structured markdown
function convertEditorSegmentsToMarkdown(
  segments: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    order: number;
  }>,
  candidateData: { fullName: string; currentTitle: string; email?: string; phone?: string; location?: string }
): string {
  // Sort segments by order
  const sortedSegments = segments.sort((a, b) => a.order - b.order);
  
  // Build structured markdown
  let markdown = `# ${candidateData.fullName}\n\n`;
  markdown += `**${candidateData.currentTitle}**\n\n`;
  
  // Do not include personal contact information in the header
  
  // Add each segment
  sortedSegments.forEach(segment => {
    if (segment.content && segment.content.trim()) {
      markdown += `## ${segment.title}\n\n`;
      
      // Clean and format the content
      let content = segment.content.trim();
      
      // Convert HTML to markdown if needed
      content = content
        .replace(/<strong>/gi, '**')
        .replace(/<\/strong>/gi, '**')
        .replace(/<em>/gi, '*')
        .replace(/<\/em>/gi, '*')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags
      
      // Clean up whitespace
      content = content
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple newlines to double
        .replace(/^\s+|\s+$/g, '') // Trim
        .replace(/\s+/g, ' '); // Multiple spaces to single
      
      markdown += content + '\n\n';
    }
  });
  
  return markdown;
}

// Request validation schema
const StructuredRequestSchema = z.object({
  candidateData: z.object({
    id: z.string(),
    fullName: z.string(),
    currentTitle: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    yearsOfExperience: z.number().optional(),
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
    summary: z.string().optional(),
  }),
  jobDescription: z.object({
    text: z.string(),
    requirements: z.array(z.string()),
    skills: z.array(z.string()),
    responsibilities: z.array(z.string()),
    title: z.string().optional(),
    company: z.string().optional(),
  }).optional(),
  clientName: z.string().optional(),
  finalEditorSegments: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    content: z.string(),
    order: z.number(),
  })).optional(),
  options: z.object({
    template: z.enum(['emineon', 'antaes', 'professional']).default('professional'),
    logoUrl: z.string().optional(),
    format: z.enum(['pdf', 'html', 'markdown']).default('pdf'),
  }).optional(),
});

// Copy the preview HTML generator function from LivePreview in EditorStep.tsx here:
function generatePreviewHTML({ segments, candidate, template, font, fontSize }: {
  segments: Array<{ id: string; title: string; content: string; visible: boolean; order: number; editable: boolean }>;
  candidate: { fullName: string; currentTitle: string };
  template: string;
  font: string;
  fontSize: number;
}): string {
  // Sort and filter segments
  const visibleSegments = segments
    .filter(segment => segment.visible && segment.content?.trim())
    .sort((a, b) => a.order - b.order);

  if (visibleSegments.length === 0) {
    return `
      <div style="padding: 40px; text-align: center; color: #666; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h3 style="margin-bottom: 16px;">Preview</h3>
        <p>Your competence file preview will appear here as you edit the content.</p>
      </div>
    `;
  }

  // Emineon colors
  const primary = '#073C51';
  const accent = '#FFB800';

  // --- HEADER ---
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${candidate.fullName} - Competence File</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: ${fontSize}px;
          background: #fff;
          color: #1e293b;
          margin: 0;
        }
        .container {
          max-width: 900px;
          margin: 40px auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 24px 0 rgba(30,41,59,0.07);
          overflow: hidden;
          padding-left: 48px;
          padding-right: 48px;
        }
        .header { padding: 40px 40px 16px 40px; }
        .candidate-name { font-size: 1.6rem; font-weight: 700; color: ${primary}; margin-bottom: 0.2rem; }
        .candidate-role { font-size: 0.95rem; font-weight: 700; color: ${accent}; margin-bottom: 0.2rem; }
        .header-divider { border: none; border-top: 1px solid ${primary}; margin: 18px 0 0 0; opacity:.2 }
        .section-title { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: ${primary}; margin: 2.2em 0 .2rem 0; }
        .section-divider { border: none; border-top: 1px solid ${primary}; margin: 8px 0 18px 0; opacity:.8 }

        /* Emineon card with blue open bracket */
        .section-card { background: #f5f7fa; border-radius: 10px; border: 1px solid #e2e8f0; padding: 22px 28px 18px 28px; margin-bottom: 24px; position: relative; display: flex; align-items: stretch; }
        .section-card-bracket { width: 8px; min-width: 8px; height: 100%; background: ${primary}; opacity:.9; border-top-left-radius: 14px; border-bottom-left-radius: 14px; margin-right: 18px; position: relative; }
        .section-card-bracket:before { content:""; position:absolute; left:-6px; top:14px; width:10px; height:22px; border-left:4px solid ${primary}; border-top:4px solid ${primary}; border-bottom:4px solid ${primary}; border-right:none; border-radius:6px 0 0 6px; }

        ul.custom-bullets { list-style: none; margin: 0 0 .5rem 0; padding:0; }
        ul.custom-bullets li { position:relative; padding-left:16px; margin-bottom:.3em; }
        ul.custom-bullets li:before { content:"•"; position:absolute; left:0; color:${accent}; font-weight:700; }

        /* Pill tags with yellow dot */
        .tag { display:inline-flex; align-items:center; background:#eef4f8; color:${primary}; border-radius:999px; padding:.28em .9em; font-size:.85rem; font-weight:600; margin:0 .35em .35em 0; position:relative; padding-left:1.3em; border:1px solid #d1d9e0; }
        .tag:before { content:""; position:absolute; left:.6em; width:6px; height:6px; background:${accent}; border-radius:50%; }

        @media (max-width: 700px) { .container { margin:0; border-radius:0; } .header { padding:24px 16px 12px 16px; } .section-card { padding:12px 8px 10px 8px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="candidate-name">${candidate.fullName}</div>
          <div class="candidate-role">${candidate.currentTitle}</div>
          <hr class="header-divider" />
        </div>
  `;

  // --- SECTIONS ---
  visibleSegments.forEach(segment => {
    const content = segment.content.trim();
    if (!content) return;

    // Convert lines that look like tags into .tag spans when preceded by "Technical Environment"
    const isTechEnv = /TECHNICAL ENVIRONMENT/i.test(segment.title);
    const transformed = isTechEnv
      ? content
          .split(/[,\n]/)
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => `<span class="tag">${s}</span>`)
          .join(' ')
      : content;

    html += `
      <div class="section-block">
        <div class="section-title">${segment.title}</div>
        <hr class="section-divider" />
        <div class="section-card">
          <div class="section-card-bracket"></div>
          <div style="flex:1;">
            ${transformed}
          </div>
        </div>
      </div>
    `;
  });

  html += `
        <div class="footer">Powered by Emineon</div>
      </div>
    </body>
    </html>
  `;
  // Replace **text** with <strong>text</strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return html;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API key not configured' 
        },
        { status: 500 }
      );
    }

    // Parse and sanitize request BEFORE validation to tolerate nulls/empties coming from parsers/DB
    const body = await request.json();
    if (body.candidateData) {
      const cd = body.candidateData;
      // Normalize primitives
      if (cd.phone == null) cd.phone = '';
      if (cd.location == null) cd.location = '';
      if (cd.summary === null) cd.summary = '';
      // yearsOfExperience: drop if null/NaN; coerce numeric strings
      if (cd.yearsOfExperience === null || cd.yearsOfExperience === undefined || Number.isNaN(cd.yearsOfExperience)) {
        delete cd.yearsOfExperience;
      } else if (typeof cd.yearsOfExperience === 'string') {
        const n = Number(cd.yearsOfExperience);
        if (Number.isFinite(n)) cd.yearsOfExperience = n; else delete cd.yearsOfExperience;
      }
      // Arrays: ensure arrays, filter falsy/empty strings
      cd.skills = Array.isArray(cd.skills) ? cd.skills.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0) : [];
      cd.certifications = Array.isArray(cd.certifications) ? cd.certifications.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0) : [];
      cd.education = Array.isArray(cd.education) ? cd.education : [];
      cd.languages = Array.isArray(cd.languages) ? cd.languages : [];
      cd.experience = Array.isArray(cd.experience) ? cd.experience : [];
    }
    const { candidateData, jobDescription, clientName, finalEditorSegments, options } = StructuredRequestSchema.parse(body);

    console.log(`🎯 Structured Competence File Generation`);
    console.log(`👤 Candidate: ${candidateData.fullName}`);
    console.log(`🎯 Job: ${jobDescription?.title || 'General Position'}`);
    console.log(`🎨 Template: ${options?.template || 'professional'}`);
    console.log(`📊 Queue Metrics:`, getQueueMetrics());

    let structuredMarkdown: string;
    let contentTime: number;
    const startTime = Date.now();

    // 🚀 CRITICAL FIX: Use final editor content if provided
    if (finalEditorSegments && finalEditorSegments.length > 0) {
      console.log(`🎯 USING FINAL EDITOR CONTENT (${finalEditorSegments.length} segments) - SKIPPING AI REGENERATION`);
      console.log(`📝 Editor segments:`, finalEditorSegments.map(s => ({
        title: s.title,
        type: s.type,
        contentLength: s.content?.length || 0,
        contentPreview: s.content?.substring(0, 100) || ''
      })));
      
      // Convert editor segments to structured markdown format
      structuredMarkdown = convertEditorSegmentsToMarkdown(finalEditorSegments, candidateData);
      contentTime = Date.now() - startTime;
      console.log(`✅ Final editor content conversion completed in ${contentTime}ms`);
    } else {
      console.log(`🤖 GENERATING NEW CONTENT using AI (no final editor content provided)`);
      // Generate structured content using AI
      structuredMarkdown = await structuredCompetenceService.generateCompleteStructuredFile(
        candidateData,
        jobDescription,
        clientName
      );
      contentTime = Date.now() - startTime;
      console.log(`✅ Structured content generation completed in ${contentTime}ms`);
    }

    // Return markdown if requested
    if (options?.format === 'markdown') {
      return NextResponse.json({
        success: true,
        data: {
          structuredContent: structuredMarkdown,
          candidateName: candidateData.fullName,
          format: 'markdown'
        },
        metrics: {
          contentGenerationTime: contentTime,
          queueMetrics: getQueueMetrics(),
        },
        processingMethod: 'structured-markdown',
      });
    }

    // Generate HTML
    const htmlStartTime = Date.now();
    const htmlContent = generatePreviewHTML({
      segments: (finalEditorSegments ?? []).map(s => ({
        ...s,
        visible: true,
        editable: true
      })),
      candidate: candidateData,
      template: options?.template ?? 'professional',
      font: 'Arial',
      fontSize: 12
    });

    const htmlTime = Date.now() - htmlStartTime;
    console.log(`✅ HTML rendering completed in ${htmlTime}ms`);

    // Generate PDF
    console.log('🔄 Generating PDF from structured HTML...');
    const pdfStartTime = Date.now();
    
    const pdfBuffer = await generatePDF(htmlContent);

    const pdfTime = Date.now() - pdfStartTime;
    console.log(`✅ PDF generation completed in ${pdfTime}ms`);

    // Upload to Vercel Blob
    const fileName = `${candidateData.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${clientName?.replace(/[^a-zA-Z0-9]/g, '_') || 'General'}_Structured_Competence_File_${Date.now()}.pdf`;
    
    const uploadResult = await put(fileName, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    // Save to database (NEW: ensure all generated files are persisted)
    let dbRecord = null;
    try {
      dbRecord = await db.competenceFile.create({
        data: {
          fileName: fileName,
          candidateId: candidateData.id,
          templateId: null, // Could be extended if template info is available
          filePath: fileName,
          downloadUrl: uploadResult.url,
                     format: 'pdf',
           status: 'READY',
          version: 1,
          metadata: {
            client: clientName || 'Unknown Client',
            jobTitle: jobDescription?.title || 'Unknown Position',
            template: options?.template || 'professional',
            segmentsCount: finalEditorSegments?.length || 0,
            processingMethod: finalEditorSegments ? 'final-editor-content' : 'structured-pdf-complete',
            processingTime: Date.now() - startTime,
            generationTimestamp: new Date().toISOString(),
          },
          sectionsConfig: finalEditorSegments ? JSON.parse(JSON.stringify(finalEditorSegments)) : null,
          generatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      console.log('✅ Structured competence file metadata saved to database');

      // Update candidate top-level fields for quick access in portal lists
      try {
        await db.candidate.update({
          where: { id: candidateData.id },
          data: {
            competenceFileUrl: uploadResult.url,
            competenceFileType: 'pdf',
            competenceFileUploadedAt: new Date(),
          }
        });
      } catch (candUpdateErr) {
        console.warn('Candidate update warning (structured-generate):', candUpdateErr);
      }
    } catch (dbError) {
      console.error('Database save error (structured-generate):', dbError);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Complete structured generation finished in ${totalTime}ms`);
    console.log(`📊 Final Queue Metrics:`, getQueueMetrics());

    return NextResponse.json({
      success: true,
      data: dbRecord ? {
        ...dbRecord,
        fileUrl: dbRecord.downloadUrl,
        fileName: dbRecord.fileName,
        format: dbRecord.format,
        candidateName: candidateData.fullName,
        jobTitle: jobDescription?.title || 'General Position',
        client: clientName || 'Unknown Client',
        structuredContent: structuredMarkdown,
        htmlContent: htmlContent,
      } : {
        // fallback if DB save failed
        structuredContent: structuredMarkdown,
        htmlContent: htmlContent,
        candidateName: candidateData.fullName,
        jobTitle: jobDescription?.title || 'General Position',
        client: clientName || 'Unknown Client',
        fileName: fileName,
        fileUrl: uploadResult.url,
        format: 'pdf',
      },
      metrics: {
        contentGenerationTime: contentTime,
        htmlRenderingTime: htmlTime,
        pdfGenerationTime: pdfTime,
        totalTime,
        queueMetrics: getQueueMetrics(),
      },
      processingMethod: finalEditorSegments ? 'final-editor-content' : 'structured-pdf-complete',
    });

  } catch (error) {
    console.error('❌ Structured generation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Generation failed',
        queueMetrics: getQueueMetrics(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Structured Competence File Generator',
    status: 'operational',
    description: 'Generate competence files with structured markdown formatting optimized for PDF output',
    features: {
      structuredMarkdown: true,
      semanticHTML: true,
      pdfOptimized: true,
      templateSupport: ['emineon', 'antaes', 'professional'],
      pQueueThrottling: true,
      multiFormat: ['pdf', 'html', 'markdown'],
      structuredPrompts: true,
      quantifiedMetrics: true,
      technologyTags: true,
    },
    outputFormats: ['pdf', 'html', 'markdown'],
    queueMetrics: getQueueMetrics(),
    timestamp: new Date().toISOString(),
  });
} 