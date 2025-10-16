import { CandidateData } from '@/types';
import { generatePDF } from '@/lib/pdf-service';

interface GenerationOptions {
  template: {
    id: string;
    name: string;
    colorHex: string;
    font: string;
    client?: string;
    footerText?: string;
  };
  customization: {
    colorHex: string;
    font: string;
    logoUrl?: string;
    footerText?: string;
  };
  sections: Array<{
    key: string;
    label: string;
    show: boolean;
    order: number;
  }>;
}

export class PdfGenerator {
  private candidateData: CandidateData;
  private options: GenerationOptions;

  constructor(candidateData: CandidateData, options: GenerationOptions) {
    this.candidateData = candidateData;
    this.options = options;
  }

  // Generate HTML content for PDF
  private generateHTML(): string {
    const { template, customization, sections } = this.options;
    const { candidateData } = this;

    // Sort sections by order
    const sortedSections = sections
      .filter(section => section.show)
      .sort((a, b) => a.order - b.order);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Competence File - ${candidateData.fullName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=${customization.font.replace(' ', '+')}:wght@300;400;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: '${customization.font}', Arial, sans-serif; 
            margin: 0;
            padding: 40px;
            color: #333; 
            line-height: 1.6; 
            background: white;
          }
          
          .header { 
            border-bottom: 3px solid ${customization.colorHex}; 
            padding-bottom: 30px; 
            margin-bottom: 40px; 
            position: relative;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }
          
          .header-content {
            flex: 1;
          }
          
          .logo {
            max-height: 80px;
            max-width: 200px;
            object-fit: contain;
            margin-left: 20px;
          }
          
          .name { 
            font-size: 32px; 
            font-weight: 700; 
            color: ${customization.colorHex}; 
            margin-bottom: 8px;
          }
          
          .title { 
            font-size: 20px; 
            color: #666; 
            font-weight: 400;
            margin-bottom: 15px;
          }
          
          .contact-info { 
            display: flex; 
            gap: 25px; 
            flex-wrap: wrap; 
            font-size: 14px;
          }
          
          .contact-item { 
            color: #666; 
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .section { 
            margin-bottom: 35px; 
            page-break-inside: avoid;
          }
          
          .section-title { 
            font-size: 18px; 
            font-weight: 600; 
            color: ${customization.colorHex}; 
            margin-bottom: 15px; 
            border-bottom: 2px solid #f0f0f0; 
            padding-bottom: 8px; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .section-content {
            padding-left: 10px;
          }
          
          .skill-list { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 10px; 
          }
          
          .skill { 
            background: ${customization.colorHex}15; 
            color: ${customization.colorHex}; 
            padding: 6px 14px; 
            border-radius: 20px; 
            font-size: 13px;
            font-weight: 500;
            border: 1px solid ${customization.colorHex}30;
          }
          
          .experience-item, .education-item {
            margin-bottom: 20px;
            padding-left: 15px;
            border-left: 3px solid ${customization.colorHex}30;
          }
          
          .experience-title {
            font-weight: 600;
            font-size: 16px;
            color: #333;
            margin-bottom: 5px;
          }
          
          .experience-company {
            color: ${customization.colorHex};
            font-weight: 500;
            margin-bottom: 3px;
          }
          
          .experience-dates {
            color: #666;
            font-size: 13px;
            margin-bottom: 8px;
            font-style: italic;
          }
          
          .experience-description {
            color: #555;
            line-height: 1.5;
          }
          
          .summary-text {
            color: #555;
            line-height: 1.7;
            font-size: 15px;
          }
          
          .languages-list, .certifications-list {
            list-style: none;
            padding-left: 15px;
          }
          
          .languages-list li, .certifications-list li {
            margin-bottom: 8px;
            position: relative;
            color: #555;
          }
          
          .languages-list li:before, .certifications-list li:before {
            content: "•";
            color: ${customization.colorHex};
            font-weight: bold;
            position: absolute;
            left: -15px;
          }
          
          .footer {
            margin-top: 50px; 
            text-align: center; 
            color: #999; 
            font-size: 11px;
            border-top: 1px solid #eee;
            padding-top: 20px;
            font-style: italic;
          }
          
          @media print { 
            body { 
              margin: 20px; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header { 
              page-break-after: avoid; 
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
            <div class="name">${candidateData.fullName}</div>
            <div class="title">${candidateData.currentTitle || 'Professional'}</div>
            <div class="contact-info">
              ${candidateData.email ? `<div class="contact-item">📧 ${candidateData.email}</div>` : ''}
              ${candidateData.phone ? `<div class="contact-item">📞 ${candidateData.phone}</div>` : ''}
              ${candidateData.location ? `<div class="contact-item">📍 ${candidateData.location}</div>` : ''}
            </div>
          </div>
          ${customization.logoUrl ? `<img src="${customization.logoUrl}" alt="Company Logo" class="logo" />` : ''}
        </div>

        ${sortedSections.map(section => this.renderSection(section)).join('')}

        <div class="footer">
          ${customization.footerText || template.footerText || `Generated on ${new Date().toLocaleDateString()} by ${template.client || 'Emineon'}`}
        </div>
      </body>
      </html>
    `;
  }

  private renderSection(section: { key: string; label: string }): string {
    const { candidateData } = this;

    switch (section.key) {
      case 'summary':
        return candidateData.summary ? `
          <div class="section">
            <div class="section-title">${section.label}</div>
            <div class="section-content">
              <div class="summary-text">${candidateData.summary}</div>
            </div>
          </div>
        ` : '';

      case 'skills':
        return candidateData.skills && candidateData.skills.length > 0 ? `
          <div class="section">
            <div class="section-title">${section.label}</div>
            <div class="section-content">
              <div class="skill-list">
                ${candidateData.skills.map((skill: string) => `<span class="skill">${skill}</span>`).join('')}
              </div>
            </div>
          </div>
        ` : '';

      case 'experience':
        return candidateData.experience && candidateData.experience.length > 0 ? `
          <div class="section">
            <div class="section-title">${section.label}</div>
            <div class="section-content">
              ${candidateData.experience.map((exp: any) => `
                <div class="experience-item">
                  <div class="experience-title">${exp.title}</div>
                  <div class="experience-company">${exp.company}</div>
                  <div class="experience-dates">${exp.startDate} - ${exp.endDate}</div>
                  <div class="experience-description">${exp.responsibilities}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : '';

      case 'education':
        return candidateData.education && candidateData.education.length > 0 ? `
          <div class="section">
            <div class="section-title">${section.label}</div>
            <div class="section-content">
              ${candidateData.education.map((edu: string) => `
                <div class="education-item">
                  <div>${edu}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : '';

      case 'certifications':
        return candidateData.certifications && candidateData.certifications.length > 0 ? `
          <div class="section">
            <div class="section-title">${section.label}</div>
            <div class="section-content">
              <ul class="certifications-list">
                ${candidateData.certifications.map((cert: string) => `<li>${cert}</li>`).join('')}
              </ul>
            </div>
          </div>
        ` : '';

      case 'languages':
        return candidateData.languages && candidateData.languages.length > 0 ? `
          <div class="section">
            <div class="section-title">${section.label}</div>
            <div class="section-content">
              <ul class="languages-list">
                ${candidateData.languages.map((lang: string) => `<li>${lang}</li>`).join('')}
              </ul>
            </div>
          </div>
        ` : '';

      default:
        return '';
    }
  }

  // Main PDF generation method using new service
  async generate(): Promise<Buffer> {
    console.log('🚀 Generating PDF using new PDF service...');
    const html = this.generateHTML();
    
    try {
      const pdfBuffer = await generatePDF(html);
      console.log('✅ PDF generated successfully using new service');
      return pdfBuffer;
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw error;
    }
  }
}

// Export utility function
export async function generateCompetenceFilePdf(
  candidateData: CandidateData,
  options: GenerationOptions
): Promise<Buffer> {
  const generator = new PdfGenerator(candidateData, options);
  return await generator.generate();
} 