import { CandidateData } from '@/types';
import { uploadToCloudinary } from '@/lib/cloudinary-config';
import { generatePDF } from '@/lib/pdf-service';

export interface GenerationOptions {
  format: 'pdf' | 'docx';
  template?: string;
  styling?: {
    fontSize?: string;
    fontFamily?: string;
    colorScheme?: string;
    margins?: string;
    logoUrl?: string;
    footerText?: string;
  };
  sections?: Array<{
    key: string;
    label: string;
    show: boolean;
    order: number;
  }>;
  metadata?: {
    clientName?: string;
    jobTitle?: string;
    generatedBy?: string;
  };
}

export interface GenerationResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  generationMethod: 'puppeteer' | 'docx-js' | 'libreoffice' | 'fallback';
  processingTime: number;
  error?: string;
}

export interface GenerationProgress {
  stage: string;
  progress: number;
  message: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

export class DocumentGenerationEngine {
  private static instance: DocumentGenerationEngine;
  
  static getInstance(): DocumentGenerationEngine {
    if (!DocumentGenerationEngine.instance) {
      DocumentGenerationEngine.instance = new DocumentGenerationEngine();
    }
    return DocumentGenerationEngine.instance;
  }

  /**
   * Main generation method with fallback chain
   */
  async generateDocument(
    candidateData: CandidateData,
    options: GenerationOptions,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const fileName = this.generateFileName(candidateData, options);

    onProgress?.({
      stage: 'initialization',
      progress: 10,
      message: 'Preparing document generation...'
    });

    // Try generation methods in order of preference
    const generationMethods = this.getGenerationMethods(options.format);

    for (const method of generationMethods) {
      try {
        onProgress?.({
          stage: 'processing',
          progress: 30,
          message: `Generating document using ${method}...`
        });

        const result = await this.executeGenerationMethod(
          method,
          candidateData,
          options,
          fileName,
          onProgress
        );

        if (result.success) {
          const processingTime = Date.now() - startTime;
          return {
            ...result,
            generationMethod: method,
            processingTime
          };
        }

        // Log failure and try next method
        console.warn(`Generation method ${method} failed:`, result.error);

      } catch (error) {
        console.error(`Generation method ${method} threw error:`, error);
      }
    }

    // All methods failed
    return {
      success: false,
      generationMethod: 'fallback',
      processingTime: Date.now() - startTime,
      error: 'All generation methods failed'
    };
  }

  /**
   * Get ordered list of generation methods based on format
   */
  private getGenerationMethods(format: 'pdf' | 'docx'): Array<'puppeteer' | 'docx-js' | 'libreoffice'> {
    if (format === 'pdf') {
      return ['puppeteer', 'libreoffice', 'docx-js']; // Puppeteer best for PDF
    } else {
      return ['docx-js', 'libreoffice', 'puppeteer']; // docx-js best for DOCX
    }
  }

  /**
   * Execute specific generation method
   */
  private async executeGenerationMethod(
    method: 'puppeteer' | 'docx-js' | 'libreoffice',
    candidateData: CandidateData,
    options: GenerationOptions,
    fileName: string,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    switch (method) {
      case 'puppeteer':
        return this.generateWithPuppeteer(candidateData, options, fileName, onProgress);
      
      case 'docx-js':
        return this.generateWithDocxJs(candidateData, options, fileName, onProgress);
      
      case 'libreoffice':
        return this.generateWithLibreOffice(candidateData, options, fileName, onProgress);
      
      default:
        throw new Error(`Unknown generation method: ${method}`);
    }
  }

  /**
   * Method 1: Puppeteer (Best for PDF) - Updated to use new PDF service
   */
  private async generateWithPuppeteer(
    candidateData: CandidateData,
    options: GenerationOptions,
    fileName: string,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    try {
      onProgress?.({
        stage: 'html-generation',
        progress: 40,
        message: 'Generating HTML template...'
      });

      // Generate HTML from template
      const htmlContent = await this.generateHTMLContent(candidateData, options);

      onProgress?.({
        stage: 'pdf-conversion',
        progress: 70,
        message: 'Converting to PDF using new service...'
      });

      // Use the new PDF service instead of launching browser manually
      console.log('🚀 Using new PDF service for document generation...');
      const pdfBuffer = await generatePDF(htmlContent);

      onProgress?.({
        stage: 'upload',
        progress: 90,
        message: 'Uploading to cloud storage...'
      });

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(
        pdfBuffer,
        fileName,
        'competence-files'
      );

      return {
        success: true,
        fileUrl: uploadResult.url,
        fileName,
        fileSize: pdfBuffer.length,
        generationMethod: 'puppeteer',
        processingTime: 0 // Will be set by caller
      };

    } catch (error) {
      console.error('❌ PDF generation with new service failed:', error);
      return {
        success: false,
        generationMethod: 'puppeteer',
        processingTime: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Method 2: docx.js (Best for DOCX)
   */
  private async generateWithDocxJs(
    candidateData: CandidateData,
    options: GenerationOptions,
    fileName: string,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    try {
      // Dynamic import to avoid bundling if not used
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

      onProgress?.({
        stage: 'docx-creation',
        progress: 50,
        message: 'Creating DOCX document...'
      });

      // Create document structure
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Header
            new Paragraph({
              text: candidateData.fullName,
              heading: HeadingLevel.TITLE,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: candidateData.currentTitle,
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            
            // Contact Information
            new Paragraph({
              children: [
                new TextRun(`Email: ${candidateData.email || 'Not provided'} | `),
                new TextRun(`Phone: ${candidateData.phone || 'Not provided'} | `),
                new TextRun(`Location: ${candidateData.location || 'Not provided'}`),
              ],
            }),

            // Summary Section
            ...(candidateData.summary ? [
              new Paragraph({
                text: 'Professional Summary',
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                text: candidateData.summary,
              }),
            ] : []),

            // Skills Section
            new Paragraph({
              text: 'Technical Skills',
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: candidateData.skills.join(', '),
            }),

            // Experience Section
            new Paragraph({
              text: 'Work Experience',
              heading: HeadingLevel.HEADING_1,
            }),
            ...candidateData.experience.flatMap(exp => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${exp.title} - ${exp.company}`,
                    bold: true,
                  }),
                ],
              }),
                             new Paragraph({
                 children: [
                   new TextRun({
                     text: `${exp.startDate} - ${exp.endDate}`,
                     italics: true,
                   }),
                 ],
               }),
              new Paragraph({
                text: exp.responsibilities,
              }),
            ]),

            // Education Section
            ...(candidateData.education.length > 0 ? [
              new Paragraph({
                text: 'Education',
                heading: HeadingLevel.HEADING_1,
              }),
              ...candidateData.education.map(edu => 
                new Paragraph({ text: edu })
              ),
            ] : []),

            // Certifications
            ...(candidateData.certifications.length > 0 ? [
              new Paragraph({
                text: 'Certifications',
                heading: HeadingLevel.HEADING_1,
              }),
              ...candidateData.certifications.map(cert => 
                new Paragraph({ text: cert })
              ),
            ] : []),
          ],
        }],
      });

      onProgress?.({
        stage: 'buffer-generation',
        progress: 80,
        message: 'Generating document buffer...'
      });

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);

      // Handle format conversion if needed
      let finalBuffer = buffer;
      let finalFileName = fileName;

      if (options.format === 'pdf') {
        // Convert DOCX to PDF using LibreOffice fallback
        const pdfResult = await this.convertDocxToPdf(buffer, fileName);
        if (pdfResult.success) {
          finalBuffer = pdfResult.buffer!;
          finalFileName = fileName.replace('.docx', '.pdf');
        }
      }

      onProgress?.({
        stage: 'upload',
        progress: 90,
        message: 'Uploading to cloud storage...'
      });

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(
        finalBuffer,
        finalFileName,
        'competence-files'
      );

      return {
        success: true,
        fileUrl: uploadResult.url,
        fileName: finalFileName,
        fileSize: finalBuffer.length,
        generationMethod: 'docx-js',
        processingTime: 0
      };

    } catch (error) {
      return {
        success: false,
        generationMethod: 'docx-js',
        processingTime: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Method 3: LibreOffice CLI (Fallback)
   */
  private async generateWithLibreOffice(
    candidateData: CandidateData,
    options: GenerationOptions,
    fileName: string,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    try {
      onProgress?.({
        stage: 'libreoffice-setup',
        progress: 30,
        message: 'Setting up LibreOffice conversion...'
      });

      // This would require LibreOffice to be installed on the server
      // For demo purposes, we'll simulate the process
      
      // In production, you would:
      // 1. Generate a temporary HTML or ODT file
      // 2. Use child_process to call: libreoffice --headless --convert-to pdf file.html
      // 3. Read the generated PDF file
      // 4. Upload to cloud storage

      // Simulate LibreOffice processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For now, return a mock result
      return {
        success: false,
        generationMethod: 'libreoffice',
        processingTime: 0,
        error: 'LibreOffice CLI method not implemented in demo'
      };

    } catch (error) {
      return {
        success: false,
        generationMethod: 'libreoffice',
        processingTime: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate HTML content from candidate data
   */
     private async generateHTMLContent(
     candidateData: CandidateData,
     options: GenerationOptions
   ): Promise<string> {
     const styling = options.styling || {
       fontFamily: 'Arial, sans-serif',
       fontSize: '12pt',
       colorScheme: '#007bff',
       margins: '20mm',
       logoUrl: undefined,
       footerText: undefined
     };
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: ${styling.fontFamily || 'Arial, sans-serif'};
          font-size: ${styling.fontSize || '12pt'};
          line-height: 1.4;
          margin: 0;
          padding: 20mm;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid ${styling.colorScheme || '#007bff'};
          margin-bottom: 20px;
          padding-bottom: 15px;
        }
        .name {
          font-size: 24pt;
          font-weight: bold;
          color: ${styling.colorScheme || '#007bff'};
          margin: 0;
        }
        .title {
          font-size: 14pt;
          color: #666;
          margin: 5px 0;
        }
        .contact {
          font-size: 10pt;
          color: #888;
        }
        .section {
          margin: 20px 0;
        }
        .section-title {
          font-size: 14pt;
          font-weight: bold;
          color: ${styling.colorScheme || '#007bff'};
          border-bottom: 1px solid ${styling.colorScheme || '#007bff'};
          margin-bottom: 10px;
          padding-bottom: 5px;
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .skill-tag {
          background: ${styling.colorScheme || '#007bff'}20;
          color: ${styling.colorScheme || '#007bff'};
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 10pt;
        }
        .experience-item {
          margin-bottom: 15px;
          border-left: 3px solid ${styling.colorScheme || '#007bff'};
          padding-left: 15px;
        }
        .job-title {
          font-weight: bold;
          font-size: 12pt;
        }
        .company-date {
          color: #666;
          font-size: 10pt;
          margin: 2px 0;
        }
        .footer {
          text-align: center;
          font-size: 9pt;
          color: #888;
          margin-top: 30px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        ${styling.logoUrl ? `
        .logo {
          float: right;
          max-height: 60px;
          max-width: 200px;
        }
        ` : ''}
      </style>
    </head>
    <body>
      <div class="header">
        ${styling.logoUrl ? `<img src="${styling.logoUrl}" class="logo" />` : ''}
        <h1 class="name">${candidateData.fullName}</h1>
        <p class="title">${candidateData.currentTitle}</p>
        <p class="contact">
          ${[candidateData.email, candidateData.phone, candidateData.location].filter(Boolean).join(' • ')}
        </p>
      </div>

      ${candidateData.summary ? `
      <div class="section">
        <h2 class="section-title">Professional Summary</h2>
        <p>${candidateData.summary}</p>
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">Technical Skills</h2>
        <div class="skills">
          ${candidateData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Work Experience</h2>
        ${candidateData.experience.map(exp => `
          <div class="experience-item">
            <div class="job-title">${exp.title}</div>
            <div class="company-date">${exp.company} • ${exp.startDate} - ${exp.endDate}</div>
            <p>${exp.responsibilities}</p>
          </div>
        `).join('')}
      </div>

      ${candidateData.education.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Education</h2>
        ${candidateData.education.map(edu => `<p>${edu}</p>`).join('')}
      </div>
      ` : ''}

      ${candidateData.certifications.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Certifications</h2>
        ${candidateData.certifications.map(cert => `<p>${cert}</p>`).join('')}
      </div>
      ` : ''}

      ${styling.footerText ? `
      <div class="footer">
        ${styling.footerText}
      </div>
      ` : ''}
    </body>
    </html>
    `;
  }

  /**
   * Generate appropriate filename
   */
  private generateFileName(candidateData: CandidateData, options: GenerationOptions): string {
    const baseName = candidateData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = options.format === 'pdf' ? 'pdf' : 'docx';
    
    return `${baseName}_Competence_File_${timestamp}.${extension}`;
  }



  /**
   * Convert DOCX buffer to PDF using available methods
   */
  private async convertDocxToPdf(docxBuffer: Buffer, fileName: string): Promise<{
    success: boolean;
    buffer?: Buffer;
    error?: string;
  }> {
    // This would typically involve:
    // 1. LibreOffice CLI conversion
    // 2. Online conversion service
    // 3. Other PDF generation libraries
    
    // For demo, return failure to trigger fallback
    return {
      success: false,
      error: 'DOCX to PDF conversion not implemented in demo'
    };
  }
}

// Export singleton instance
export const documentGenerator = DocumentGenerationEngine.getInstance(); 