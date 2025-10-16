import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { CandidateData } from '@/types';

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

export class DocxGenerator {
  private candidateData: CandidateData;
  private options: GenerationOptions;

  constructor(candidateData: CandidateData, options: GenerationOptions) {
    this.candidateData = candidateData;
    this.options = options;
  }

  // Convert hex color to RGB values
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 30, g: 64, b: 175 }; // Default blue
  }

  // Create styled heading
  private createHeading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph {
    const color = this.hexToRgb(this.options.customization.colorHex);
    
    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold: true,
          size: level === HeadingLevel.HEADING_1 ? 32 : 24,
          color: `${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`,
          font: this.options.customization.font,
        }),
      ],
      heading: level,
      spacing: { after: 200 },
    });
  }

  // Create paragraph with styling
  private createParagraph(text: string, bold: boolean = false): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold,
          size: 22,
          font: this.options.customization.font,
        }),
      ],
      spacing: { after: 100 },
    });
  }

  // Create bullet point
  private createBulletPoint(text: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: `• ${text}`,
          size: 22,
          font: this.options.customization.font,
        }),
      ],
      spacing: { after: 50 },
      indent: { left: 360 },
    });
  }

  // Generate header section
  private generateHeader(): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Name
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: this.candidateData.fullName,
          bold: true,
          size: 48,
          font: this.options.customization.font,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));

    // Title
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: this.candidateData.currentTitle,
          size: 28,
          font: this.options.customization.font,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));

    // Contact information
    const contactInfo: string[] = [];
    if (this.candidateData.email) contactInfo.push(this.candidateData.email);
    if (this.candidateData.phone) contactInfo.push(this.candidateData.phone);
    if (this.candidateData.location) contactInfo.push(this.candidateData.location);

    if (contactInfo.length > 0) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: contactInfo.join(' • '),
            size: 22,
            font: this.options.customization.font,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }));
    }

    return paragraphs;
  }

  // Generate summary section
  private generateSummary(): Paragraph[] {
    if (!this.candidateData.summary) return [];
    
    return [
      this.createHeading('Professional Summary', HeadingLevel.HEADING_2),
      this.createParagraph(this.candidateData.summary),
    ];
  }

  // Generate experience section
  private generateExperience(): Paragraph[] {
    if (!this.candidateData.experience || this.candidateData.experience.length === 0) return [];
    
    const paragraphs: Paragraph[] = [
      this.createHeading('Work Experience', HeadingLevel.HEADING_2),
    ];

    this.candidateData.experience.forEach((exp) => {
      // Company and title
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: `${exp.title} at ${exp.company}`,
            bold: true,
            size: 24,
            font: this.options.customization.font,
          }),
        ],
        spacing: { after: 100 },
      }));

      // Dates
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: `${exp.startDate} - ${exp.endDate}`,
            size: 20,
            font: this.options.customization.font,
            italics: true,
          }),
        ],
        spacing: { after: 100 },
      }));

      // Responsibilities
      paragraphs.push(this.createParagraph(exp.responsibilities));
      paragraphs.push(new Paragraph({ children: [], spacing: { after: 200 } })); // Spacing
    });

    return paragraphs;
  }

  // Generate skills section
  private generateSkills(): Paragraph[] {
    if (!this.candidateData.skills || this.candidateData.skills.length === 0) return [];
    
    const paragraphs: Paragraph[] = [
      this.createHeading('Technical Skills', HeadingLevel.HEADING_2),
    ];

    this.candidateData.skills.forEach((skill) => {
      paragraphs.push(this.createBulletPoint(skill));
    });

    return paragraphs;
  }

  // Generate education section
  private generateEducation(): Paragraph[] {
    if (!this.candidateData.education || this.candidateData.education.length === 0) return [];
    
    const paragraphs: Paragraph[] = [
      this.createHeading('Education', HeadingLevel.HEADING_2),
    ];

    this.candidateData.education.forEach((edu) => {
      paragraphs.push(this.createBulletPoint(edu));
    });

    return paragraphs;
  }

  // Generate certifications section
  private generateCertifications(): Paragraph[] {
    if (!this.candidateData.certifications || this.candidateData.certifications.length === 0) return [];
    
    const paragraphs: Paragraph[] = [
      this.createHeading('Certifications', HeadingLevel.HEADING_2),
    ];

    this.candidateData.certifications.forEach((cert) => {
      paragraphs.push(this.createBulletPoint(cert));
    });

    return paragraphs;
  }

  // Generate languages section
  private generateLanguages(): Paragraph[] {
    if (!this.candidateData.languages || this.candidateData.languages.length === 0) return [];
    
    const paragraphs: Paragraph[] = [
      this.createHeading('Languages', HeadingLevel.HEADING_2),
    ];

    this.candidateData.languages.forEach((lang) => {
      paragraphs.push(this.createBulletPoint(lang));
    });

    return paragraphs;
  }

  // Generate footer
  private generateFooter(): Paragraph[] {
    return [
      new Paragraph({ children: [], spacing: { after: 300 } }), // Spacing
      new Paragraph({
        children: [
          new TextRun({
            text: this.options.customization.footerText || 'Generated with Emineon ATS',
            size: 18,
            font: this.options.customization.font,
            italics: true,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ];
  }

  // Main generation method
  async generate(): Promise<Buffer> {
    const allParagraphs: Paragraph[] = [];

    // Get enabled sections in order
    const enabledSections = this.options.sections
      .filter(section => section.show)
      .sort((a, b) => a.order - b.order);

    // Generate sections based on configuration
    enabledSections.forEach((section) => {
      switch (section.key) {
        case 'header':
          allParagraphs.push(...this.generateHeader());
          break;
        case 'summary':
          allParagraphs.push(...this.generateSummary());
          break;
        case 'experience':
          allParagraphs.push(...this.generateExperience());
          break;
        case 'skills':
          allParagraphs.push(...this.generateSkills());
          break;
        case 'education':
          allParagraphs.push(...this.generateEducation());
          break;
        case 'certifications':
          allParagraphs.push(...this.generateCertifications());
          break;
        case 'languages':
          allParagraphs.push(...this.generateLanguages());
          break;
      }
    });

    // Add footer
    allParagraphs.push(...this.generateFooter());

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: allParagraphs,
        },
      ],
    });

    // Generate buffer
    return await Packer.toBuffer(doc);
  }
}

// Export utility function
export async function generateCompetenceFileDocx(
  candidateData: CandidateData,
  options: GenerationOptions
): Promise<Buffer> {
  const generator = new DocxGenerator(candidateData, options);
  return await generator.generate();
} 