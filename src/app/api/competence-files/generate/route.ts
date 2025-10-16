// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePDF } from '@/lib/pdf-service';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { type EnrichedContent } from '@/lib/ai/competence-enrichment';

// Function to extract client information from job description
function extractClientInfo(jobDescription?: JobDescription): { client: string; jobTitle: string } {
  if (!jobDescription) {
    return { client: 'Unknown Client', jobTitle: 'Unknown Position' };
  }

  let client = 'Unknown Client';
  let jobTitle = jobDescription.title || 'Unknown Position';

  // Extract company name from job description text or company field
  if (jobDescription.company) {
    client = jobDescription.company;
  } else if (jobDescription.text) {
    // Common patterns for company names in job descriptions
    const companyPatterns = [
      /(?:at|for|with|join)\s+([A-Z][A-Za-z\s&-]+?)(?:\s+(?:is|are|has|offers|provides|seeks|looking|hiring))/i,
      /([A-Z][A-Za-z\s&-]+?)\s+(?:is|are)\s+(?:hiring|looking|seeking|recruiting)/i,
      /(?:Company|Organization|Firm):\s*([A-Z][A-Za-z\s&-]+)/i,
      /([A-Z][A-Za-z\s&-]+?)\s+(?:AG|GmbH|Ltd|Inc|Corp|LLC|SA|SE|NV|BV|AB|AS|Oy|SpA|SRL|SARL|Sàrl)/i,
      /([A-Z][A-Za-z\s&-]+?)\s+(?:Bank|Investment|Consulting|Technology|Software|Solutions|Group|Holdings|Partners|Capital|Management|Services|International|Global|Digital|Systems|Innovations|Corporation|Company)/i
    ];

    for (const pattern of companyPatterns) {
      const match = jobDescription.text.match(pattern);
      if (match && match[1]) {
        client = match[1].trim();
        break;
      }
    }

    // Clean up common suffixes/prefixes
    client = client
      .replace(/^(The|A|An)\s+/i, '')
      .replace(/\s+(team|department|division|group)$/i, '')
      .trim();

    // If still unknown, try to extract from requirements or responsibilities
    if (client === 'Unknown Client') {
      const allText = [
        jobDescription.text,
        Array.isArray(jobDescription.requirements) ? jobDescription.requirements.join(' ') : (jobDescription.requirements || ''),
        Array.isArray(jobDescription.responsibilities) ? jobDescription.responsibilities.join(' ') : (jobDescription.responsibilities || '')
      ].join(' ');

      // Look for well-known company names
      const knownCompanies = [
        'UBS', 'Credit Suisse', 'Deutsche Bank', 'JPMorgan', 'Goldman Sachs',
        'McKinsey', 'BCG', 'Bain', 'Deloitte', 'PwC', 'EY', 'KPMG',
        'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix',
        'Spotify', 'Airbnb', 'Uber', 'Tesla', 'SpaceX', 'PayPal',
        'Salesforce', 'Oracle', 'SAP', 'Adobe', 'IBM', 'Intel',
        'Cisco', 'VMware', 'ServiceNow', 'Workday', 'Snowflake'
      ];

      for (const company of knownCompanies) {
        if (allText.toLowerCase().includes(company.toLowerCase())) {
          client = company;
          break;
        }
      }
    }
  }

  return { client, jobTitle };
}

// Request schema validation
const GenerateRequestSchema = z.object({
  candidateData: z.object({
    id: z.string(),
    fullName: z.string(),
    currentTitle: z.string(),
    email: z.string().nullable().optional().transform(v => v ?? ''),
    phone: z.string().nullable().optional().transform(v => v ?? ''),
    location: z.string().nullable().optional().transform(v => v ?? ''),
    yearsOfExperience: z.union([z.number(), z.string()]).optional().transform(v => {
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }),
    summary: z.string().nullable().optional().transform(v => v ?? ''),
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
  }),
  template: z.string(),
  sections: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    content: z.string(),
    visible: z.boolean(),
    order: z.number(),
  })),
  format: z.enum(['pdf', 'docx']),
  jobDescription: z.object({
    text: z.string(),
    requirements: z.array(z.string()),
    skills: z.array(z.string()),
    responsibilities: z.array(z.string()),
    title: z.string().optional(),
    company: z.string().optional(),
  }).optional(),
  managerContact: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
});

interface ExperienceItem {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

interface CandidateData {
  id: string;
  fullName: string;
  currentTitle: string;
  email: string;
  phone: string;
  location: string;
  yearsOfExperience: number;
  skills: string[];
  certifications: string[];
  experience: ExperienceItem[];
  education: string[];
  languages: string[];
  summary: string;
}

interface JobDescription {
  text: string;
  requirements: string[];
  skills: string[];
  responsibilities: string[];
  title?: string;
  company?: string;
}

interface ManagerContact {
  name?: string;
  email?: string;
  phone?: string;
}

// Function to highlight text based on job requirements
function convertMarkdownToHTML(text: string): string {
  if (!text) return text;
  
  // Convert markdown formatting to HTML
  let htmlText = text
    // Convert **bold** to <strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert bullet points that start with * to proper list items (do this first)
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    // Convert remaining *italic* to <em> (after bullet points are handled)
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    // Convert multiple consecutive list items to proper ul structure
    .replace(/(<li>.*?<\/li>\s*)+/g, (match) => `<ul>${match}</ul>`)
    // Convert line breaks to proper spacing
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  // Wrap in paragraph tags if not already structured
  if (!htmlText.includes('<p>') && !htmlText.includes('<ul>') && !htmlText.includes('<div>')) {
    htmlText = `<p>${htmlText}</p>`;
  }
  
  return htmlText;
}

function highlightRelevantContent(text: string, jobDescription?: JobDescription, template?: string): string {
  if (!jobDescription || !text) return text;
  
  // Get accent color based on template
  const accentColor = template === 'antaes' ? '#FFB800' : '#FF8C00';
  
  // Combine all job-related keywords
  const keywords = [
    ...(Array.isArray(jobDescription.requirements) ? jobDescription.requirements : []),
    ...(Array.isArray(jobDescription.skills) ? jobDescription.skills : []),
    ...(Array.isArray(jobDescription.responsibilities) ? jobDescription.responsibilities : [])
  ].filter(keyword => keyword && keyword.length > 2); // Filter out short words
  
  let highlightedText = text;
  
  // Highlight each keyword (case-insensitive)
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<span style="border-bottom: 1px solid ${accentColor}; font-weight: 600;">$1</span>`);
  });
  
  return highlightedText;
}

// AI-Enhanced Experience Generation
function generateEnrichedExperienceHTML(enrichedExperience: any[]): string {
  if (!enrichedExperience || enrichedExperience.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">PROFESSIONAL EXPERIENCES</h2>
        <div class="section-content">
          <p>No professional experience provided.</p>
        </div>
      </div>
    `;
  }

  // Generate Professional Experiences Summary first
  const experiencesSummary = enrichedExperience.map(exp => {
    const title = (exp && exp.title) ? exp.title : 'Role';
    const company = (exp && exp.company) ? exp.company : 'Company';
    const computedPeriod = [exp?.startDate, exp?.endDate].filter(Boolean).join(' - ');
    const period = (exp && exp.period) ? exp.period : computedPeriod;
    return `
      <div class="experience-summary-item">
        <strong>${title}</strong> at <strong>${company}</strong>${period ? ` (${period})` : ''}
      </div>
    `;
  }).join('');

  // Generate detailed experience blocks with AI-enriched content
  const detailedExperiences = enrichedExperience.map(exp => {
    const title = (exp && exp.title) ? exp.title : 'Role';
    const company = (exp && exp.company) ? exp.company : 'Company';
    const computedPeriod = [exp?.startDate, exp?.endDate].filter(Boolean).join(' - ');
    const period = (exp && exp.period) ? exp.period : computedPeriod;
    const description = (exp && (exp.enhancedDescription || exp.description)) ? (exp.enhancedDescription || exp.description) : '';

    const responsibilitiesArr = Array.isArray(exp?.responsibilities)
      ? exp.responsibilities
      : (typeof exp?.responsibilities === 'string'
          ? exp.responsibilities.split(/[.;]\s*|\n/).map((s: string) => s.trim()).filter(Boolean)
          : []);

    const achievementsArr = Array.isArray(exp?.keyAchievements)
      ? exp.keyAchievements
      : (typeof exp?.keyAchievements === 'string'
          ? exp.keyAchievements.split(/[.;]\s*|\n/).map((s: string) => s.trim()).filter(Boolean)
          : []);

    const techEnvArr = Array.isArray(exp?.technicalEnvironment)
      ? exp.technicalEnvironment
      : (typeof exp?.technicalEnvironment === 'string'
          ? exp.technicalEnvironment.split(/,|\n/).map((s: string) => s.trim()).filter(Boolean)
          : []);

    return `
      <div class="experience-block">
        <div class="exp-header">
          <div class="exp-company">${company}</div>
          <div class="exp-title">${title}</div>
          <div class="exp-dates">${period || ''}</div>
        </div>
        
        ${description ? `
        <div class="exp-section">
          <div class="exp-section-title">Role Overview</div>
          <p class="exp-description">${description}</p>
        </div>
        ` : ''}
        
        ${responsibilitiesArr.length > 0 ? `
        <div class="exp-section">
          <div class="exp-section-title">Key Responsibilities</div>
          <ul class="exp-responsibilities">
            ${responsibilitiesArr.map((responsibility: string) => `<li>${responsibility}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${achievementsArr.length > 0 ? `
        <div class="exp-section">
          <div class="exp-section-title">Key Achievements</div>
          <ul class="exp-achievements">
            ${achievementsArr.map((achievement: string) => `<li>${achievement}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${techEnvArr.length > 0 ? `
        <div class="exp-section">
          <div class="exp-section-title">Technical Environment</div>
          <div class="technical-environment-grid">
            ${techEnvArr.map((tech: string) => `<span class="tech-tag">${tech}</span>`).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <!-- PROFESSIONAL EXPERIENCES SUMMARY -->
    <div class="section">
      <h2 class="section-title">PROFESSIONAL EXPERIENCES SUMMARY</h2>
      <div class="section-content">
        <div class="experiences-summary">
          ${experiencesSummary}
        </div>
      </div>
    </div>

    <!-- PROFESSIONAL EXPERIENCES -->
    <div class="section">
      <h2 class="section-title">PROFESSIONAL EXPERIENCES</h2>
      <div class="section-content">
        ${detailedExperiences}
      </div>
    </div>
  `;
}

// Fallback function for when AI enrichment is not available
function generateExperienceHTML(experience: ExperienceItem[]): string {
  if (!experience || experience.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">PROFESSIONAL EXPERIENCES</h2>
        <div class="section-content">
          <p>No professional experience provided.</p>
        </div>
      </div>
    `;
  }

  // Generate Professional Experiences Summary first
  const experiencesSummary = experience.map(exp => {
    const duration = `${exp.startDate} - ${exp.endDate}`;
    return `
      <div class="experience-summary-item">
        <strong>${exp.title}</strong> at <strong>${exp.company}</strong> (${duration})
      </div>
    `;
  }).join('');

  // Generate detailed experience blocks
  const detailedExperiences = experience.map(exp => {
    const duration = `${exp.startDate} - ${exp.endDate}`;
    
    // Format responsibilities into bullet points
    const formatResponsibilities = (responsibilities: string) => {
      if (!responsibilities) return '<li>No specific responsibilities listed</li>';
      
      // Split by periods, semicolons, or line breaks and clean up
      const items = responsibilities
        .split(/[.;]\s*|\n/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      if (items.length === 0) {
        return `<li>${responsibilities}</li>`;
      }
      
      return items.map(item => `<li>${item}</li>`).join('');
    };

    return `
      <div class="experience-block">
        <div class="exp-header">
          <div class="exp-company">${exp.company}</div>
          <div class="exp-title">${exp.title}</div>
          <div class="exp-dates">${duration}</div>
        </div>
        
        <div class="exp-section">
          <div class="exp-section-title">Key Responsibilities</div>
          <ul class="exp-responsibilities">
            ${formatResponsibilities(exp.responsibilities)}
          </ul>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!-- PROFESSIONAL EXPERIENCES SUMMARY -->
    <div class="section">
      <h2 class="section-title">PROFESSIONAL EXPERIENCES SUMMARY</h2>
      <div class="section-content">
        <div class="experiences-summary">
          ${experiencesSummary}
        </div>
      </div>
    </div>

    <!-- PROFESSIONAL EXPERIENCES -->
    <div class="section">
      <h2 class="section-title">PROFESSIONAL EXPERIENCES</h2>
      <div class="section-content">
        ${detailedExperiences}
      </div>
    </div>
  `;
}

export function generateSectionsHTML(sections: any[], candidateData: CandidateData, generateFunctionalSkills: Function, experienceHTML: string, jobDescription?: JobDescription, template?: string, enrichedContent?: EnrichedContent): string {
  // Generate the sections content
  const sectionsContent = sections
    .sort((a, b) => a.order - b.order)
    .map(section => {
      if (section.type === 'header') return ''; // Header is handled separately
      
      let sectionContent = section.content;
      
      // For empty sections, generate default content based on type
      if (!sectionContent || sectionContent.trim().length === 0) {
        switch (section.type) {
          case 'summary':
            sectionContent = candidateData.summary || 'Professional summary to be provided.';
            break;
          case 'functional-skills':
          case 'core-competencies':
            sectionContent = generateFunctionalSkills(candidateData.skills);
            break;
          case 'experience':
          case 'professional-experience':
            return experienceHTML;
          case 'education':
            // Use AI-optimized education if available
            const educationData = enrichedContent?.optimizedEducation || candidateData.education;
            sectionContent = educationData?.map(edu => `<div class="education-item">${edu}</div>`).join('') || 'Education details to be provided.';
            break;
          case 'certifications':
            // Use AI-optimized certifications if available
            const certificationsData = enrichedContent?.optimizedCertifications || candidateData.certifications;
            sectionContent = certificationsData?.map(cert => `<div class="cert-item">${cert}</div>`).join('') || 'Professional certifications to be provided.';
            break;
          case 'languages':
            sectionContent = candidateData.languages?.map(lang => `<div class="language-item">${lang}</div>`).join('') || 'Language skills to be provided.';
            break;
          default:
            sectionContent = 'Content to be provided.';
        }
      }
      
      // Convert markdown to HTML first, then apply highlighting
      const htmlContent = convertMarkdownToHTML(sectionContent);
      const highlightedContent = highlightRelevantContent(htmlContent, jobDescription, template);
      
      return `
        <div class="section">
          <h2 class="section-title">${section.title}</h2>
          <div class="section-content">
            ${section.type === 'summary' ? `<p class="summary-text">${highlightedContent}</p>` : 
              section.type === 'languages' ? `<div class="languages-grid">${highlightedContent}</div>` :
              highlightedContent}
          </div>
        </div>
      `;
    }).join('');
  
  // For Antaes template, we need to return just the sections content
  // The full HTML wrapper will be handled by the calling function
  return sectionsContent;
}

export function generateAntaesCompetenceFileHTML(candidateData: CandidateData, sections?: any[], jobDescription?: JobDescription, managerContact?: ManagerContact, enrichedContent?: EnrichedContent): string {
  // Use AI-enriched experience if available, otherwise fallback to original
  const experienceHTML = enrichedContent?.enrichedExperience ? 
    generateEnrichedExperienceHTML(enrichedContent.enrichedExperience) : 
    generateExperienceHTML(candidateData.experience);
  
  // Generate functional skills with explanatory text - use AI-optimized skills if available
  const generateFunctionalSkills = (skills: string[]) => {
    // Use AI-optimized functional skills if available
    const functionalSkills = enrichedContent?.optimizedSkills?.functional || skills;
    if (!functionalSkills || functionalSkills.length === 0) return '';
    
    const skillCategories: Record<string, { skills: string[]; description: string }> = {
      'Leadership & Management': {
        skills: functionalSkills.filter(skill => 
          skill.toLowerCase().includes('lead') || 
          skill.toLowerCase().includes('manage') || 
          skill.toLowerCase().includes('team') ||
          skill.toLowerCase().includes('project')
        ),
        description: 'Proven ability to guide teams and manage complex projects with strategic oversight and operational excellence.'
      },
      'Communication & Collaboration': {
        skills: functionalSkills.filter(skill => 
          skill.toLowerCase().includes('communication') || 
          skill.toLowerCase().includes('presentation') || 
          skill.toLowerCase().includes('stakeholder')
        ),
        description: 'Strong interpersonal skills enabling effective collaboration across diverse teams and stakeholder groups.'
      },
      'Problem Solving & Analysis': {
        skills: functionalSkills.filter(skill => 
          skill.toLowerCase().includes('analysis') || 
          skill.toLowerCase().includes('problem') || 
          skill.toLowerCase().includes('research')
        ),
        description: 'Analytical mindset with systematic approach to identifying solutions and optimizing processes.'
      },
      'Innovation & Strategy': {
        skills: functionalSkills.filter(skill => 
          skill.toLowerCase().includes('innovation') || 
          skill.toLowerCase().includes('strategy') || 
          skill.toLowerCase().includes('planning')
        ),
        description: 'Forward-thinking approach to business challenges with focus on sustainable growth and competitive advantage.'
      }
    };
    
    // If no categorized skills found, do not add any placeholder bucket
    const categorizedSkills = Object.values(skillCategories).some(cat => cat.skills.length > 0);
    if (!categorizedSkills) return '';
    
    return Object.entries(skillCategories)
      .filter(([_, category]) => category.skills.length > 0)
      .map(([categoryName, category]) => {
        // Determine column class based on number of skills
        let columnClass = '';
        if (category.skills.length >= 15) {
          columnClass = ' multi-column-large';
        } else if (category.skills.length >= 8) {
          columnClass = ' multi-column';
        }
        
        return `
        <div class="functional-skill-category">
          <div class="skill-category-title">${categoryName}</div>
          <ul class="skill-list${columnClass}">
            ${category.skills.map(skill => `<li>${skill}</li>`).join('')}
          </ul>
          <p class="skill-description">${category.description}</p>
        </div>
      `;
      }).join('');
  };

  // Generate technical skills with explanatory text
  const generateTechnicalSkills = (skills: string[]) => {
    const technicalSkills = enrichedContent?.optimizedSkills?.technical || skills;
    if (!technicalSkills || technicalSkills.length === 0) return '';
    
    const techCategories: Record<string, { skills: string[]; description: string }> = {
      'Programming Languages': {
        skills: technicalSkills.filter(skill => 
          ['javascript', 'python', 'java', 'typescript', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'].some(lang => 
            skill.toLowerCase().includes(lang)
          )
        ),
        description: 'Proficient in multiple programming languages with deep understanding of software development principles.'
      },
      'Frameworks & Libraries': {
        skills: technicalSkills.filter(skill => 
          ['react', 'angular', 'vue', 'node', 'express', 'django', 'spring', 'laravel', '.net'].some(framework => 
            skill.toLowerCase().includes(framework)
          )
        ),
        description: 'Extensive experience with modern frameworks enabling rapid development and scalable solutions.'
      },
      'Databases & Storage': {
        skills: technicalSkills.filter(skill => 
          ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite'].some(db => 
            skill.toLowerCase().includes(db)
          )
        ),
        description: 'Comprehensive database management skills across relational and NoSQL technologies.'
      },
      'Cloud & DevOps': {
        skills: technicalSkills.filter(skill => 
          ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible'].some(cloud => 
            skill.toLowerCase().includes(cloud)
          )
        ),
        description: 'Advanced cloud computing and DevOps expertise for scalable infrastructure management.'
      },
      'Tools & Technologies': {
        skills: technicalSkills.filter(skill => 
          !['javascript', 'python', 'java', 'typescript', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
            'react', 'angular', 'vue', 'node', 'express', 'django', 'spring', 'laravel', '.net',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible'].some(tech => 
            skill.toLowerCase().includes(tech)
          )
        ),
        description: 'Diverse technical toolkit supporting efficient development workflows and project delivery.'
      }
    };
    
    // If no categorized skills found, create a general category
    const categorizedSkills = Object.values(techCategories).some(cat => cat.skills.length > 0);
    if (!categorizedSkills) {
      techCategories['Technical Competencies'] = {
        skills: skills,
        description: 'Comprehensive technical skill set acquired through hands-on experience and professional development.'
      };
    }
    
    return Object.entries(techCategories)
      .filter(([_, category]) => category.skills.length > 0)
      .map(([categoryName, category]) => {
        // Determine column class based on number of skills
        let columnClass = '';
        if (category.skills.length >= 15) {
          columnClass = ' multi-column-large';
        } else if (category.skills.length >= 8) {
          columnClass = ' multi-column';
        }
        
        return `
        <div class="technical-skill-category">
          <div class="skill-category-title">${categoryName}</div>
          <ul class="skill-list${columnClass}">
            ${category.skills.map(skill => `<li>${skill}</li>`).join('')}
          </ul>
          <p class="skill-description">${category.description}</p>
        </div>
      `;
      }).join('');
  };

  // Generate areas of expertise based on role and skills
  const generateAreasOfExpertise = (currentTitle: string, skills: string[]): string[] => {
    const expertiseAreas: string[] = [];
    
    // Add based on current title
    if (currentTitle.toLowerCase().includes('software') || currentTitle.toLowerCase().includes('developer')) {
      expertiseAreas.push('Software Development & Engineering');
    }
    if (currentTitle.toLowerCase().includes('senior') || currentTitle.toLowerCase().includes('lead')) {
      expertiseAreas.push('Technical Leadership & Mentoring');
    }
    if (currentTitle.toLowerCase().includes('full') || currentTitle.toLowerCase().includes('stack')) {
      expertiseAreas.push('Full-Stack Development');
    }
    if (currentTitle.toLowerCase().includes('frontend') || currentTitle.toLowerCase().includes('ui')) {
      expertiseAreas.push('User Interface Development');
    }
    if (currentTitle.toLowerCase().includes('backend') || currentTitle.toLowerCase().includes('api')) {
      expertiseAreas.push('Backend Systems & APIs');
    }
    if (currentTitle.toLowerCase().includes('devops') || currentTitle.toLowerCase().includes('infrastructure')) {
      expertiseAreas.push('DevOps & Infrastructure');
    }
    if (currentTitle.toLowerCase().includes('data') || currentTitle.toLowerCase().includes('analytics')) {
      expertiseAreas.push('Data Analysis & Business Intelligence');
    }
    if (currentTitle.toLowerCase().includes('architect')) {
      expertiseAreas.push('System Architecture & Design');
    }
    if (currentTitle.toLowerCase().includes('manager') || currentTitle.toLowerCase().includes('director')) {
      expertiseAreas.push('Project Management & Strategy');
    }
    
    // Add based on skills
    if (skills.some(skill => skill.toLowerCase().includes('cloud') || skill.toLowerCase().includes('aws') || skill.toLowerCase().includes('azure'))) {
      expertiseAreas.push('Cloud Computing & Scalability');
    }
    if (skills.some(skill => skill.toLowerCase().includes('agile') || skill.toLowerCase().includes('scrum'))) {
      expertiseAreas.push('Agile Methodologies & Process Optimization');
    }
    
    // Ensure we have at least 6 areas
    const defaultAreas = [
      'Digital Transformation',
      'Technology Innovation',
      'Process Optimization',
      'Quality Assurance',
      'Cross-functional Collaboration',
      'Continuous Learning & Development'
    ];
    
    while (expertiseAreas.length < 6) {
      const nextArea = defaultAreas.find(area => !expertiseAreas.includes(area));
      if (nextArea) {
        expertiseAreas.push(nextArea);
      } else {
        break;
      }
    }
    
    return expertiseAreas.slice(0, 6);
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${candidateData.fullName} - Competence File</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #232629;
          background: #ffffff;
          font-size: 9px;
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          min-height: 297mm;
          padding: 30px;
          position: relative;
          padding-bottom: 80px;
        }
        
        /* Header Styling - Logo on right, content on left */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #073C51;
        }
        
        .header-content {
          flex: 1;
          text-align: left;
        }
        
        .header-logo {
          flex-shrink: 0;
          margin-left: 20px;
        }
        
        .logo-image {
          height: 70px;
          width: auto;
          max-width: 250px;
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
        }
        
        .header h1 {
          font-size: 22px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }
        
        .header-role {
          font-size: 8px;
          font-weight: 600;
          color: #FFB800;
          margin-bottom: 4px;
        }
        
        .header-experience {
          font-size: 9px;
          font-weight: 500;
          color: #444B54;
          margin-bottom: 12px;
        }
        
        .location-info {
          font-size: 9px;
          color: #444B54;
          margin-bottom: 12px;
          font-weight: 500;
        }
        
        .manager-contact {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e9ecef;
        }
        
        .manager-label {
          font-size: 9px;
          font-weight: 600;
          color: #073C51;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .contact-item {
          color: #444B54;
          font-size: 8px;
          margin-bottom: 3px;
        }
        
        .contact-label {
          font-weight: 700;
          color: #232629;
        }
        
        /* Content Area */
        .content {
          margin-bottom: 60px;
        }
        
        /* Section Styling */
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 9px;
          font-weight: 700;
          color: #073C51;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid #073C51;
        }
        
        .section-content {
          font-size: 9px;
          line-height: 1.7;
        }
        
        /* Content Formatting */
        .section-content p {
          margin-bottom: 12px;
          line-height: 1.7;
        }
        
        .section-content ul {
          margin: 12px 0;
          padding-left: 0;
          list-style: none;
        }
        
        .section-content li {
          position: relative;
          padding-left: 20px;
          margin-bottom: 8px;
          line-height: 1.6;
        }
        
        .section-content li:before {
          content: "•";
          color: #FFB800;
          font-weight: bold;
          position: absolute;
          left: 0;
          top: 0;
        }
        
        .section-content strong {
          font-weight: 700;
          color: #073C51;
        }
        
        .section-content em {
          font-style: italic;
          color: #444B54;
        }
        
        /* Professional Summary */
        .summary-text {
          font-weight: 400;
          line-height: 1.8;
          color: #444B54;
          text-align: justify;
        }
        
        /* Functional Skills */
        .functional-skill-category {
          margin-bottom: 18px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #073C51;
        }
        
        .skill-category-title {
          font-size: 9px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 8px;
        }
        
        .skill-list {
          list-style: none;
          padding-left: 0;
          margin-bottom: 8px;
        }
        
        .skill-list.multi-column {
          column-count: 2;
          column-gap: 20px;
          column-fill: balance;
        }
        
        .skill-list.multi-column-large {
          column-count: 3;
          column-gap: 15px;
          column-fill: balance;
        }
        
        .skill-list li {
          position: relative;
          padding-left: 15px;
          margin-bottom: 4px;
          color: #444B54;
          font-weight: 500;
          break-inside: avoid;
        }
        
        .skill-list li:before {
          content: "•";
          color: #FFB800;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        .skill-description {
          font-style: italic;
          color: #666;
          font-size: 9px;
          line-height: 1.5;
        }
        
        /* Technical Skills */
        .technical-skill-category {
          margin-bottom: 18px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #FFB800;
        }
        
        /* Areas of Expertise */
        .expertise-areas {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .expertise-item {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: #f8f9fa;
          border-radius: 20px;
          font-weight: 500;
          color: #073C51;
          font-size: 9px;
          border: 1px solid #e9ecef;
          position: relative;
          padding-left: 20px;
        }
        
        .expertise-item:before {
          content: "";
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #FFB800;
          border-radius: 50%;
        }
        
        /* Education & Certifications */
        .education-item, .cert-item {
          margin-bottom: 16px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 3px solid #FFB800;
        }
        
        .education-degree, .cert-name {
          font-weight: 600;
          color: #232629;
        }
        
        .education-year, .cert-year {
          color: #FFB800;
          font-weight: 600;
          font-size: 8px;
        }
        
        .education-description, .cert-description {
          color: #444B54;
          font-size: 9px;
          line-height: 1.5;
          margin-top: 6px;
          font-style: italic;
        }
        
        /* Languages */
        .languages-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .language-item {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: #f8f9fa;
          border-radius: 20px;
          font-weight: 500;
          color: #073C51;
          font-size: 9px;
          border: 1px solid #e9ecef;
          position: relative;
          padding-left: 20px;
        }
        
        .language-item:before {
          content: "";
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #073C51;
          border-radius: 50%;
        }
        
        /* Experience Summary */
        .experiences-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #073C51;
          position: relative;
        }
        .experiences-summary:before {
          content: "";
          position: absolute;
          left: -6px;
          top: 12px;
          width: 10px;
          height: 22px;
          border-left: 4px solid #073C51;
          border-top: 4px solid #073C51;
          border-bottom: 4px solid #073C51;
          border-right: none;
          border-radius: 6px 0 0 6px;
        }
        
        .experience-summary-item {
          margin-bottom: 8px;
          color: #444B54;
          line-height: 1.6;
          font-size: 8px;
        }
        
        /* Experience Blocks */
        .experience-block {
          margin-bottom: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #073C51;
          page-break-inside: avoid;
          position: relative;
        }

        /* decorative blue open bracket */
        .experience-block:before {
          content: "";
          position: absolute;
          left: -6px;
          top: 18px;
          width: 10px;
          height: 22px;
          border-left: 4px solid #073C51;
          border-top: 4px solid #073C51;
          border-bottom: 4px solid #073C51;
          border-right: none;
          border-radius: 6px 0 0 6px;
        }
        
        .exp-header {
          margin-bottom: 15px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .exp-company {
          font-size: 8px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 4px;
        }
        
        .exp-title {
          font-size: 9px;
          font-weight: 600;
          color: #FFB800;
          margin-bottom: 4px;
        }
        
        .exp-dates {
          font-size: 8px;
          color: #444B54;
          font-weight: 600;
        }
        
        .exp-section {
          margin-bottom: 12px;
        }
        
        .exp-section-title {
          font-size: 8px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .exp-description {
          color: #444B54;
          line-height: 1.6;
          margin-bottom: 8px;
          font-style: italic;
          font-size: 8px;
        }
        
        .exp-responsibilities, .exp-achievements, .exp-technical {
          list-style: none;
          padding-left: 0;
        }
        
        .exp-responsibilities li, .exp-achievements li, .exp-technical li {
          position: relative;
          padding-left: 15px;
          margin-bottom: 6px;
          color: #444B54;
          line-height: 1.6;
          font-weight: 500;
          font-size: 8px;
        }
        
        .exp-responsibilities li:before, .exp-achievements li:before, .exp-technical li:before {
          content: "•";
          color: #FFB800;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        /* Technical Environment Grid */
        .technical-environment-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }
        
        .tech-item, .tech-tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          background: #eef4f8;
          border-radius: 16px;
          font-weight: 600;
          color: #073C51;
          font-size: 9px;
          border: 1px solid #d1d9e0;
          white-space: nowrap;
          position: relative;
          padding-left: 18px;
        }

        .tech-item:before, .tech-tag:before {
          content: "";
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #FFB800;
          border-radius: 50%;
        }
        
        /* Page counter for PDF generation */
        @page {
          margin: 20mm;
          @bottom-left {
            content: counter(page);
            font-family: 'Inter', sans-serif;
            font-size: 9px;
            font-weight: 600;
            color: #073C51;
          }
          @bottom-center {
            content: "Partnership for Excellence";
            font-family: 'Inter', sans-serif;
            font-size: 8px;
            color: #444B54;
          }
        }
        
        /* Print Optimization */
        @media print {
          body { 
            font-size: 9px; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .container { 
            max-width: none; 
            margin: 0; 
            padding: 20px;
            padding-bottom: 60px;
          }
          .section { 
            page-break-inside: avoid; 
          }
          .experience-block { 
            page-break-inside: avoid; 
          }
          .logo-image {
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: transparent !important;
          }
          .header-logo {
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
          }
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .header { 
            text-align: left;
          }
          .contact-info { 
            justify-content: flex-start;
            flex-direction: column; 
            gap: 10px;
          }
          .expertise-areas { 
            grid-template-columns: 1fr; 
          }
          .languages-grid { 
            grid-template-columns: 1fr; 
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER - Content on left, logo on right -->
        <div class="header">
          <div class="header-content">
            <h1>${candidateData.fullName}</h1>
            <div class="header-role">${candidateData.currentTitle}</div>
            ${managerContact && (managerContact.name || managerContact.email || managerContact.phone) ? `
              <div class="manager-contact" style="border:none; padding-top:8px;">
                <div class="manager-label" style="font-size:11px; color:#334155;">Manager Details</div>
                ${managerContact.name ? `<div class="contact-item" style=\"font-size:12px;\"><span class="contact-label">Manager:</span> ${managerContact.name}</div>` : ''}
                ${managerContact.email ? `<div class="contact-item" style=\"font-size:12px;\"><span class="contact-label">Email:</span> ${managerContact.email}</div>` : ''}
                ${managerContact.phone ? `<div class="contact-item" style=\"font-size:12px;\"><span class="contact-label">Phone:</span> ${managerContact.phone}</div>` : ''}
              </div>
            ` : ''}
          </div>
          <div class="header-logo">
            <img src="https://res.cloudinary.com/emineon/image/upload/w_200,h_100,c_fit,q_100,f_png/Antaes_logo" 
                 alt="ANTAES" 
                 class="logo-image" 
                 style="width: 150px; height: 80px; object-fit: contain; display: block !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; opacity: 1 !important; visibility: visible !important; background: transparent !important;" 
                 onload="this.style.opacity='1';" 
                 onerror="console.error('Antaes logo failed to load:', this.src);" />
          </div>
        </div>
        
        <div class="content">
          ${managerContact && (managerContact.name || managerContact.email || managerContact.phone) ? `
          <div class="section">
            <h2 class="section-title">MANAGER DETAILS</h2>
            <div class="section-content">
              <ul>
                ${managerContact.name ? `<li><strong>Manager:</strong> ${managerContact.name}</li>` : ''}
                ${managerContact.email ? `<li><strong>Email:</strong> ${managerContact.email}</li>` : ''}
                ${managerContact.phone ? `<li><strong>Phone:</strong> ${managerContact.phone}</li>` : ''}
              </ul>
            </div>
          </div>
          ` : ''}
          <!-- EXECUTIVE SUMMARY -->
          ${candidateData.summary ? `
          <div class="section">
            <h2 class="section-title">EXECUTIVE SUMMARY</h2>
            <div class="section-content">
              <p class="summary-text">${candidateData.summary}</p>
        </div>
          </div>
          ` : ''}

          <!-- CORE COMPETENCIES -->
          ${candidateData.skills && candidateData.skills.length > 0 ? `
          <div class="section">
            <h2 class="section-title">CORE COMPETENCIES</h2>
            <div class="section-content">
              ${generateFunctionalSkills(enrichedContent?.optimizedCoreCompetencies || enrichedContent?.optimizedSkills?.functional || candidateData.skills)}
        </div>
          </div>
          ` : ''}

          <!-- TECHNICAL EXPERTISE -->
          ${candidateData.skills && candidateData.skills.length > 0 ? `
          <div class="section">
            <h2 class="section-title">TECHNICAL EXPERTISE</h2>
            <div class="section-content">
              ${generateTechnicalSkills(enrichedContent?.optimizedTechnicalExpertise || enrichedContent?.optimizedSkills?.technical || candidateData.skills)}
        </div>
          </div>
          ` : ''}

          <!-- AREAS OF EXPERTISE -->
          <div class="section">
            <h2 class="section-title">AREAS OF EXPERTISE</h2>
            <div class="section-content">
              <div class="expertise-areas">
                ${(enrichedContent?.areasOfExpertise || generateAreasOfExpertise(candidateData.currentTitle, candidateData.skills)).map(area => `
                  <div class="expertise-item"><strong>${area}</strong></div>
                `).join('')}
        </div>
      </div>
          </div>

          <!-- ACADEMIC BACKGROUND -->
          ${(enrichedContent?.optimizedEducation || candidateData.education) && (enrichedContent?.optimizedEducation || candidateData.education).length > 0 ? `
          <div class="section">
            <h2 class="section-title">ACADEMIC BACKGROUND</h2>
            <div class="section-content">
              <ul>
                ${((enrichedContent?.optimizedEducation || candidateData.education) as string[]).filter(edu => {
                  const t = (edu || '').toLowerCase();
                  return !(
                    t.includes('certified') || t.includes('certification') || t.includes('certificate') ||
                    t.includes('cissp') || t.includes('pmp') || t.includes('prince2') || t.includes('scrum') ||
                    t.includes('aws') || t.includes('azure') || t.includes('gcp') || t.includes('itil') ||
                    t.includes('comptia') || t.includes('oracle certified') || t.includes('microsoft certified') || t.includes('google cloud')
                  );
                }).map(edu => {
                  const yearMatch = edu.match(/(\d{4})|(\d{2}\/\d{2}\/\d{4})|(\d{4}-\d{4})|(\d{4}\s*-\s*\d{4})/);
                  let year = '';
                  let cleanEdu = edu;
                  if (yearMatch) {
                    year = yearMatch[1] || yearMatch[0];
                    cleanEdu = edu.replace(/\(\d{4}\)|\d{4}|\d{2}\/\d{2}\/\d{4}|\d{4}-\d{4}|\d{4}\s*-\s*\d{4}/g, '').trim();
                    cleanEdu = cleanEdu.replace(/,\s*$|^\s*,/, '').trim();
                  }
                  if (!year && edu.toLowerCase().includes('recent')) {
                    year = new Date().getFullYear().toString();
                  }
                  return `<li><strong>${cleanEdu || edu}</strong>${year ? ` — <span class="education-year">${year}</span>` : ''}</li>`;
                }).join('')}
              </ul>
            </div>
          </div>
          ` : ''}

          <!-- PROFESSIONAL CERTIFICATIONS -->
          ${(() => {
            const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
            const provided = (candidateData.certifications || []).map(normalize).filter(Boolean);
            const source = (enrichedContent?.optimizedCertifications || candidateData.certifications) || [];
            const filtered = provided.length > 0 ? source.filter(c => provided.includes(normalize(c))) : (candidateData.certifications || []);
            return filtered.length > 0 ? `
    <div class="section">
            <h2 class="section-title">PROFESSIONAL CERTIFICATIONS</h2>
      <div class="section-content">
              <ul>
                ${filtered.map(cert => {
                  const yearMatch = cert.match(/(\d{4})|(\d{2}\/\d{2}\/\d{4})|(\d{4}-\d{4})|(\d{4}\s*-\s*\d{4})/);
                  let year = '';
                  let cleanCert = cert;
                  if (yearMatch) {
                    year = yearMatch[1] || yearMatch[0];
                    cleanCert = cert.replace(/\(\d{4}\)|\d{4}|\d{2}\/\d{2}\/\d{4}|\d{4}-\d{4}|\d{4}\s*-\s*\d{4}/g, '').trim();
                    cleanCert = cleanCert.replace(/,\s*$|^\s*,/, '').trim();
                  }
                  return `<li><strong>${cleanCert || cert}</strong>${year ? ` — <span class="cert-year">${year}</span>` : ''}</li>`;
                }).join('')}
              </ul>
      </div>
    </div>
          ` : '';
          })()}

          <!-- LANGUAGES -->
          ${candidateData.languages && candidateData.languages.length > 0 ? `
    <div class="section">
            <h2 class="section-title">LANGUAGES</h2>
      <div class="section-content">
              <div class="languages-grid">
                ${candidateData.languages.map(lang => `
                  <div class="language-item">${lang}</div>
                `).join('')}
      </div>
    </div>
          </div>
          ` : ''}



          <!-- DETAILED PROFESSIONAL EXPERIENCES -->
          ${experienceHTML}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template-specific styling configurations
function getTemplateStyles(template: string) {
  const styles = {
    professional: {
      primaryColor: '#073C51',
      accentColor: '#FFB800',
      fontFamily: 'Inter',
      headerStyle: 'border-bottom: 1px solid #073C51;',
      logoStyle: 'height: 80px; width: auto;'
    },
    modern: {
      primaryColor: '#1f2937',
      accentColor: '#3b82f6',
      fontFamily: 'Inter',
      headerStyle: 'border-bottom: 3px solid #3b82f6;',
      logoStyle: 'height: 75px; width: auto;'
    },
    minimal: {
      primaryColor: '#374151',
      accentColor: '#6b7280',
      fontFamily: 'Inter',
      headerStyle: 'border-bottom: 1px solid #e5e7eb;',
      logoStyle: 'height: 70px; width: auto;'
    },
    emineon: {
      primaryColor: '#073C51',
      accentColor: '#FFB800',
      fontFamily: 'Inter',
      headerStyle: 'border-bottom: 3px solid #FFB800; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);',
      logoStyle: 'height: 85px; width: auto;'
    }
  };
  
  return styles[template as keyof typeof styles] || styles.professional;
}

export function generateCompetenceFileHTML(candidateData: CandidateData, sections?: any[], jobDescription?: JobDescription, managerContact?: ManagerContact, enrichedContent?: EnrichedContent, template: string = 'professional'): string {
  // Use AI-enriched experience if available, otherwise fallback to original
  const experienceHTML = enrichedContent?.enrichedExperience ? 
    generateEnrichedExperienceHTML(enrichedContent.enrichedExperience) : 
    generateExperienceHTML(candidateData.experience);
  
  // Template-specific styling configurations
  const templateStyles = getTemplateStyles(template);
  
  // Generate functional skills with explanatory text
  const generateFunctionalSkills = (skills: string[]) => {
    if (!skills || skills.length === 0) return '';
    
    const skillCategories: Record<string, { skills: string[]; description: string }> = {
      'Leadership & Management': {
        skills: skills.filter(skill => 
          skill.toLowerCase().includes('lead') || 
          skill.toLowerCase().includes('manage') || 
          skill.toLowerCase().includes('team') ||
          skill.toLowerCase().includes('project')
        ),
        description: 'Proven ability to guide teams and manage complex projects with strategic oversight and operational excellence.'
      },
      'Communication & Collaboration': {
        skills: skills.filter(skill => 
          skill.toLowerCase().includes('communication') || 
          skill.toLowerCase().includes('presentation') || 
          skill.toLowerCase().includes('stakeholder')
        ),
        description: 'Strong interpersonal skills enabling effective collaboration across diverse teams and stakeholder groups.'
      },
      'Problem Solving & Analysis': {
        skills: skills.filter(skill => 
          skill.toLowerCase().includes('analysis') || 
          skill.toLowerCase().includes('problem') || 
          skill.toLowerCase().includes('research')
        ),
        description: 'Analytical mindset with systematic approach to identifying solutions and optimizing processes.'
      },
      'Innovation & Strategy': {
        skills: skills.filter(skill => 
          skill.toLowerCase().includes('innovation') || 
          skill.toLowerCase().includes('strategy') || 
          skill.toLowerCase().includes('planning')
        ),
        description: 'Forward-thinking approach to business challenges with focus on sustainable growth and competitive advantage.'
      }
    };
    
    // If no categorized skills found, do not add any placeholder bucket
    const categorizedSkills = Object.values(skillCategories).some(cat => cat.skills.length > 0);
    if (!categorizedSkills) return '';
    
    return Object.entries(skillCategories)
      .filter(([_, category]) => category.skills.length > 0)
      .map(([categoryName, category]) => `
        <div class="functional-skill-category">
          <div class="skill-category-title">${categoryName}</div>
          <ul class="skill-list">
            ${category.skills.map(skill => `<li>${skill}</li>`).join('')}
          </ul>
          <p class="skill-description">${category.description}</p>
        </div>
      `).join('');
  };

  // Generate technical skills with explanatory text
  const generateTechnicalSkills = (skills: string[]) => {
    if (!skills || skills.length === 0) return '';
    
    const techCategories: Record<string, { skills: string[]; description: string }> = {
      'Programming Languages': {
        skills: skills.filter(skill => 
          ['javascript', 'python', 'java', 'typescript', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'].some(lang => 
            skill.toLowerCase().includes(lang)
          )
        ),
        description: 'Proficient in multiple programming languages with deep understanding of software development principles.'
      },
      'Frameworks & Libraries': {
        skills: skills.filter(skill => 
          ['react', 'angular', 'vue', 'node', 'express', 'django', 'spring', 'laravel', '.net'].some(framework => 
            skill.toLowerCase().includes(framework)
          )
        ),
        description: 'Extensive experience with modern frameworks enabling rapid development and scalable solutions.'
      },
      'Databases & Storage': {
        skills: skills.filter(skill => 
          ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite'].some(db => 
            skill.toLowerCase().includes(db)
          )
        ),
        description: 'Comprehensive database management skills across relational and NoSQL technologies.'
      },
      'Cloud & DevOps': {
        skills: skills.filter(skill => 
          ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible'].some(cloud => 
            skill.toLowerCase().includes(cloud)
          )
        ),
        description: 'Advanced cloud computing and DevOps expertise for scalable infrastructure management.'
      },
      'Tools & Technologies': {
        skills: skills.filter(skill => 
          !['javascript', 'python', 'java', 'typescript', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
            'react', 'angular', 'vue', 'node', 'express', 'django', 'spring', 'laravel', '.net',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible'].some(tech => 
            skill.toLowerCase().includes(tech)
          )
        ),
        description: 'Diverse technical toolkit supporting efficient development workflows and project delivery.'
      }
    };
    
    // If no categorized skills found, create a general category
    const categorizedSkills = Object.values(techCategories).some(cat => cat.skills.length > 0);
    if (!categorizedSkills) {
      techCategories['Technical Competencies'] = {
        skills: skills,
        description: 'Comprehensive technical skill set acquired through hands-on experience and professional development.'
      };
    }
    
    return Object.entries(techCategories)
      .filter(([_, category]) => category.skills.length > 0)
      .map(([categoryName, category]) => {
        // Determine column class based on number of skills
        let columnClass = '';
        if (category.skills.length >= 15) {
          columnClass = ' multi-column-large';
        } else if (category.skills.length >= 8) {
          columnClass = ' multi-column';
        }
        
        return `
        <div class="technical-skill-category">
          <div class="skill-category-title">${categoryName}</div>
          <ul class="skill-list${columnClass}">
            ${category.skills.map(skill => `<li>${skill}</li>`).join('')}
          </ul>
          <p class="skill-description">${category.description}</p>
        </div>
      `;
      }).join('');
  };

  // Generate areas of expertise based on role and skills
  const generateAreasOfExpertise = (currentTitle: string, skills: string[]): string[] => {
    const expertiseAreas: string[] = [];
    
    // Add based on current title
    if (currentTitle.toLowerCase().includes('software') || currentTitle.toLowerCase().includes('developer')) {
      expertiseAreas.push('Software Development & Engineering');
    }
    if (currentTitle.toLowerCase().includes('senior') || currentTitle.toLowerCase().includes('lead')) {
      expertiseAreas.push('Technical Leadership & Mentoring');
    }
    if (currentTitle.toLowerCase().includes('full') || currentTitle.toLowerCase().includes('stack')) {
      expertiseAreas.push('Full-Stack Development');
    }
    if (currentTitle.toLowerCase().includes('frontend') || currentTitle.toLowerCase().includes('ui')) {
      expertiseAreas.push('User Interface Development');
    }
    if (currentTitle.toLowerCase().includes('backend') || currentTitle.toLowerCase().includes('api')) {
      expertiseAreas.push('Backend Systems & APIs');
    }
    if (currentTitle.toLowerCase().includes('devops') || currentTitle.toLowerCase().includes('infrastructure')) {
      expertiseAreas.push('DevOps & Infrastructure');
    }
    if (currentTitle.toLowerCase().includes('data') || currentTitle.toLowerCase().includes('analytics')) {
      expertiseAreas.push('Data Analysis & Business Intelligence');
    }
    if (currentTitle.toLowerCase().includes('architect')) {
      expertiseAreas.push('System Architecture & Design');
    }
    if (currentTitle.toLowerCase().includes('manager') || currentTitle.toLowerCase().includes('director')) {
      expertiseAreas.push('Project Management & Strategy');
    }
    
    // Add based on skills
    if (skills.some(skill => skill.toLowerCase().includes('cloud') || skill.toLowerCase().includes('aws') || skill.toLowerCase().includes('azure'))) {
      expertiseAreas.push('Cloud Computing & Scalability');
    }
    if (skills.some(skill => skill.toLowerCase().includes('agile') || skill.toLowerCase().includes('scrum'))) {
      expertiseAreas.push('Agile Methodologies & Process Optimization');
    }
    
    // Ensure we have at least 6 areas
    const defaultAreas = [
      'Digital Transformation',
      'Technology Innovation',
      'Process Optimization',
      'Quality Assurance',
      'Cross-functional Collaboration',
      'Continuous Learning & Development'
    ];
    
    while (expertiseAreas.length < 6) {
      const nextArea = defaultAreas.find(area => !expertiseAreas.includes(area));
      if (nextArea) {
        expertiseAreas.push(nextArea);
      } else {
        break;
      }
    }
    
    return expertiseAreas.slice(0, 6);
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${candidateData.fullName} - Competence File</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #232629;
          background: #ffffff;
          font-size: 9px;
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          min-height: 297mm;
          padding: 30px;
          position: relative;
          padding-bottom: 80px;
        }
        
        /* Header Styling - Clean layout with logo on right */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 25px;
          ${templateStyles.headerStyle}
        }
        
        .header-left {
          flex: 1;
        }
        
        .header h1 {
          font-size: 24px;
          font-weight: 700;
          color: ${templateStyles.primaryColor};
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        
        .header-role {
          font-size: 9px;
          font-weight: 600;
          color: ${templateStyles.accentColor};
          margin-bottom: 5px;
        }
        
        .header-experience {
          font-size: 8px;
          font-weight: 500;
          color: #444B54;
          margin-bottom: 15px;
        }
        
        .location-info {
          font-size: 9px;
          color: #444B54;
          margin-bottom: 12px;
          font-weight: 500;
        }
        
        .manager-contact {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e9ecef;
        }
        
        .manager-label {
          font-size: 9px;
          font-weight: 600;
          color: ${templateStyles.primaryColor};
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .contact-item {
          color: #444B54;
          font-size: 8px;
          margin-bottom: 3px;
        }
        
        .contact-label {
          font-weight: 700;
          color: #232629;
        }
        
        .header-logo {
          flex-shrink: 0;
          margin-left: 30px;
        }
        
        .logo-image {
          ${templateStyles.logoStyle}
        }
        
        /* Content Area */
        .content {
          margin-bottom: 60px;
        }
        
        /* Section Styling */
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 8px;
          font-weight: 700;
          color: ${templateStyles.primaryColor};
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid ${templateStyles.primaryColor};
        }
        
        .section-content {
          font-size: 9px;
          line-height: 1.7;
        }
        
        /* Content Formatting */
        .section-content p {
          margin-bottom: 12px;
          line-height: 1.7;
        }
        
        .section-content ul {
          margin: 12px 0;
          padding-left: 0;
          list-style: none;
        }
        
        .section-content li {
          position: relative;
          padding-left: 20px;
          margin-bottom: 8px;
          line-height: 1.6;
        }
        
        .section-content li:before {
          content: "•";
          color: ${templateStyles.accentColor};
          font-weight: bold;
          position: absolute;
          left: 0;
          top: 0;
        }
        
        .section-content strong {
          font-weight: 700;
          color: ${templateStyles.primaryColor};
        }
        
        .section-content em {
          font-style: italic;
          color: #444B54;
        }
        
        /* Professional Summary */
        .summary-text {
          font-weight: 400;
          line-height: 1.8;
          color: #444B54;
          text-align: justify;
        }
        
        /* Functional Skills */
        .functional-skill-category {
          margin-bottom: 18px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #073C51;
        }
        
        .skill-category-title {
          font-size: 9px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 8px;
        }
        
        .skill-list {
          list-style: none;
          padding-left: 0;
          margin-bottom: 8px;
        }
        
        .skill-list.multi-column {
          column-count: 2;
          column-gap: 20px;
          column-fill: balance;
        }
        
        .skill-list.multi-column-large {
          column-count: 3;
          column-gap: 15px;
          column-fill: balance;
        }
        
        .skill-list li {
          position: relative;
          padding-left: 15px;
          margin-bottom: 4px;
          color: #444B54;
          font-weight: 500;
          break-inside: avoid;
        }
        
        .skill-list li:before {
          content: "•";
          color: #FFB800;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        .skill-description {
          font-style: italic;
          color: #666;
          font-size: 9px;
          line-height: 1.5;
        }
        
        /* Technical Skills */
        .technical-skill-category {
          margin-bottom: 18px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #FFB800;
        }
        
        /* Areas of Expertise */
        .expertise-areas {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .expertise-item {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: #f8f9fa;
          border-radius: 20px;
          font-weight: 500;
          color: #073C51;
          font-size: 9px;
          border: 1px solid #e9ecef;
          position: relative;
          padding-left: 20px;
        }
        
        .expertise-item:before {
          content: "";
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #FFB800;
          border-radius: 50%;
        }
        
        /* Education & Certifications */
        .education-item, .cert-item {
          margin-bottom: 16px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 3px solid #FFB800;
        }
        
        .education-degree, .cert-name {
          font-weight: 600;
          color: #232629;
        }
        
        .education-year, .cert-year {
          color: #FFB800;
          font-weight: 600;
          font-size: 8px;
        }
        
        .education-description, .cert-description {
          color: #444B54;
          font-size: 9px;
          line-height: 1.5;
          margin-top: 6px;
          font-style: italic;
        }
        
        /* Languages */
        .languages-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .language-item {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: #f8f9fa;
          border-radius: 20px;
          font-weight: 500;
          color: #073C51;
          font-size: 9px;
          border: 1px solid #e9ecef;
          position: relative;
          padding-left: 20px;
        }
        
        .language-item:before {
          content: "";
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #073C51;
          border-radius: 50%;
        }
        
        /* Experience Summary */
        .experiences-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #073C51;
        }
        
        .experience-summary-item {
          margin-bottom: 10px;
          color: #444B54;
          line-height: 1.6;
        }
        
        /* Experience Blocks */
        .experience-block {
          margin-bottom: 30px;
          padding: 25px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #073C51;
          page-break-inside: avoid;
          position: relative;
        }

        /* Blue open bracket decoration */
        .experience-block:before {
          content: "";
          position: absolute;
          left: -6px;
          top: 18px;
          width: 10px;
          height: 22px;
          border-left: 4px solid #073C51;
          border-top: 4px solid #073C51;
          border-bottom: 4px solid #073C51;
          border-right: none;
          border-radius: 6px 0 0 6px;
        }
        
        .exp-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .exp-company {
          font-size: 9px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 5px;
        }
        
        .exp-title {
          font-size: 8px;
          font-weight: 600;
          color: #FFB800;
          margin-bottom: 5px;
        }
        
        .exp-dates {
          font-size: 9px;
          color: #444B54;
          font-weight: 600;
        }
        
        .exp-section {
          margin-bottom: 15px;
        }
        
        .exp-section-title {
          font-size: 9px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .exp-description {
          color: #444B54;
          line-height: 1.6;
          margin-bottom: 10px;
          font-style: italic;
        }
        
        .exp-responsibilities, .exp-achievements, .exp-technical {
          list-style: none;
          padding-left: 0;
        }
        
        .exp-responsibilities li, .exp-achievements li, .exp-technical li {
          position: relative;
          padding-left: 15px;
          margin-bottom: 8px;
          color: #444B54;
          line-height: 1.6;
          font-weight: 500;
        }
        
        .exp-responsibilities li:before, .exp-achievements li:before, .exp-technical li:before {
          content: "•";
          color: #FFB800;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        /* Technical Environment Grid */
        .technical-environment-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }
        
        .tech-item {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: #eaf2f6;
          border-radius: 16px;
          font-weight: 600;
          color: #073C51;
          font-size: 9px;
          border: 1px solid #cfe0ea;
          white-space: nowrap;
          position: relative;
          padding-left: 22px;
        }

        .tech-item:before {
          content: "";
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #073C51;
          border-radius: 50%;
        }
        
        /* Footer - appears on every page */
        .footer {
          position: fixed;
          bottom: 20px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 30px;
          border-top: 1px solid #e9ecef;
          background: white;
          font-size: 9px;
          color: #444B54;
        }
        
        .footer-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .footer-logo {
          height: 20px;
          width: auto;
          opacity: 0.7;
        }
        
        .footer-text {
          font-weight: 500;
          color: #444B54;
        }
        
        .page-number {
          font-weight: 600;
          color: #073C51;
        }
        
        /* Print Optimization */
        @media print {
          body { 
            font-size: 9px; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .container { 
            max-width: none; 
            margin: 0; 
            padding: 20px;
            padding-bottom: 60px;
          }
          .section { 
            page-break-inside: avoid; 
          }
          .experience-block { 
            page-break-inside: avoid; 
          }
          .footer {
            position: fixed;
            bottom: 0;
          }
        }
        
        /* Page counter for PDF generation */
        @page {
          margin: 20mm;
          @bottom-left {
            content: counter(page);
            font-family: 'Inter', sans-serif;
            font-size: 9px;
            font-weight: 600;
            color: #073C51;
          }
          @bottom-center {
            content: "Powered by EMINEON • forge your edge";
            font-family: 'Inter', sans-serif;
            font-size: 8px;
            color: #444B54;
          }
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .header { 
            flex-direction: column; 
            align-items: flex-start;
          }
          .header-logo { 
            margin-left: 0; 
            margin-top: 15px; 
          }
          .contact-info { 
            flex-direction: column; 
            gap: 10px;
          }
          .expertise-areas { 
            grid-template-columns: 1fr; 
          }
          .languages-grid { 
            grid-template-columns: 1fr; 
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER - Clean layout with logo on right -->
        <div class="header">
          <div class="header-left">
            <h1>${candidateData.fullName}</h1>
            <div class="header-role">${candidateData.currentTitle}</div>
            ${managerContact && (managerContact.name || managerContact.email || managerContact.phone) ? `
              <div class="manager-contact">
                <div class="manager-label">For inquiries, contact:</div>
                ${managerContact.name ? `<div class="contact-item"><span class="contact-label">Manager:</span> ${managerContact.name}</div>` : ''}
                ${managerContact.email ? `<div class="contact-item"><span class="contact-label">Email:</span> ${managerContact.email}</div>` : ''}
                ${managerContact.phone ? `<div class="contact-item"><span class="contact-label">Phone:</span> ${managerContact.phone}</div>` : ''}
            </div>
            ` : ''}
          </div>
          <div class="header-logo">
            <img src="https://res.cloudinary.com/emineon/image/upload/w_200,h_100,c_fit,q_100,f_png/Antaes_logo" alt="ANTAES" class="logo-image" />
          </div>
        </div>

        <div class="content">
          ${managerContact && (managerContact.name || managerContact.email || managerContact.phone) ? `
          <div class="section">
            <h2 class="section-title">MANAGER DETAILS</h2>
            <div class="section-content">
              <ul>
                ${managerContact.name ? `<li><strong>Manager:</strong> ${managerContact.name}</li>` : ''}
                ${managerContact.email ? `<li><strong>Email:</strong> ${managerContact.email}</li>` : ''}
                ${managerContact.phone ? `<li><strong>Phone:</strong> ${managerContact.phone}</li>` : ''}
              </ul>
            </div>
          </div>
          ` : ''}
          <!-- PROFESSIONAL SUMMARY -->
          ${candidateData.summary ? `
          <div class="section">
            <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
            <div class="section-content">
              <p class="summary-text">${candidateData.summary}</p>
              ${enrichedContent?.valueProposition ? `
              <div style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-left: 4px solid #FFB800; border-radius: 4px;">
                <p style="font-weight: 600; color: #073C51; margin-bottom: 8px;">Value Proposition:</p>
                <p style="font-style: italic; color: #444B54;">${enrichedContent.valueProposition}</p>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <!-- FUNCTIONAL SKILLS -->
          ${candidateData.skills && candidateData.skills.length > 0 ? `
          <div class="section">
            <h2 class="section-title">FUNCTIONAL SKILLS</h2>
            <div class="section-content">
              ${generateFunctionalSkills(enrichedContent?.optimizedSkills?.functional || candidateData.skills)}
            </div>
          </div>
          ` : ''}

          <!-- TECHNICAL SKILLS -->
          ${candidateData.skills && candidateData.skills.length > 0 ? `
          <div class="section">
            <h2 class="section-title">TECHNICAL SKILLS</h2>
            <div class="section-content">
              ${generateTechnicalSkills(enrichedContent?.optimizedSkills?.technical || candidateData.skills)}
            </div>
          </div>
          ` : ''}

          <!-- AREAS OF EXPERTISE -->
          <div class="section">
            <h2 class="section-title">AREAS OF EXPERTISE</h2>
            <div class="section-content">
              <div class="expertise-areas">
                ${(enrichedContent?.areasOfExpertise || generateAreasOfExpertise(candidateData.currentTitle, candidateData.skills)).map(area => `
                  <div class="expertise-item"><strong>${area}</strong></div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- EDUCATION -->
          ${(enrichedContent?.optimizedEducation || candidateData.education) && (enrichedContent?.optimizedEducation || candidateData.education).length > 0 ? `
          <div class="section">
            <h2 class="section-title">EDUCATION</h2>
            <div class="section-content">
              ${(enrichedContent?.optimizedEducation || candidateData.education).map(edu => `
                <div class="education-item">
                  <div class="education-degree"><strong>${edu}</strong></div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- CERTIFICATIONS -->
          ${(enrichedContent?.optimizedCertifications || candidateData.certifications) && (enrichedContent?.optimizedCertifications || candidateData.certifications).length > 0 ? `
          <div class="section">
            <h2 class="section-title">CERTIFICATIONS</h2>
            <div class="section-content">
              ${(enrichedContent?.optimizedCertifications || candidateData.certifications).map(cert => `
                <div class="cert-item">
                  <div class="cert-name"><strong>${cert}</strong></div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- LANGUAGES -->
          ${candidateData.languages && candidateData.languages.length > 0 ? `
          <div class="section">
            <h2 class="section-title">LANGUAGES</h2>
            <div class="section-content">
              <div class="languages-grid">
                ${candidateData.languages.map(lang => `
                  <div class="language-item">${lang}</div>
                `).join('')}
              </div>
            </div>
          </div>
          ` : ''}

          <!-- PROFESSIONAL EXPERIENCE -->
          ${experienceHTML}
        </div>
      </div>
    </body>
    </html>
  `;
}

// 🛡️ RATE LIMITING: Prevent auto-save loops
const saveRequests = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      candidateData, 
      template, 
      sections, 
      format = 'pdf', 
      saveOnly = false, 
      jobDescription, 
      managerContact 
    } = body;

    console.log('🚀 ===== COMPETENCE FILE GENERATION REQUEST =====');
    console.log(`📋 Request details: format=${format}, saveOnly=${saveOnly}, sectionsCount=${sections?.length || 0}`);
    console.log(`👤 Candidate: ${candidateData?.fullName || 'Unknown'}`);
    console.log(`📄 Template: ${template || 'None'}`);
    console.log(`🎯 Job Description: ${jobDescription ? 'PROVIDED' : 'NOT PROVIDED'}`);
    
    // ENHANCED SECTION ANALYSIS
    if (sections && sections.length > 0) {
      console.log('🔍 ===== DETAILED SECTION ANALYSIS =====');
      sections.forEach((section: any, index: number) => {
        const contentLength = section.content?.length || 0;
        const hasContent = section.content && section.content.trim().length > 0;
        const isGenerationFailed = hasContent && section.content.includes('Generation failed');
        const isTryRegenerating = hasContent && section.content.includes('Try regenerating');
        const isErrorMessage = hasContent && (
          section.content.includes('Generation failed') || 
          section.content.includes('Try regenerating') ||
          section.content.includes('Error:') ||
          section.content.startsWith('Failed to')
        );
        const isValidContent = hasContent && !isErrorMessage;
        
        console.log(`  ${index + 1}. ${section.title || section.type || 'Unnamed'}`);
        console.log(`     📝 Content Length: ${contentLength} chars`);
        console.log(`     ✅ Has Content: ${hasContent}`);
        console.log(`     ❌ Is Error Message: ${isErrorMessage}`);
        console.log(`     🔍 Contains "Generation failed": ${isGenerationFailed}`);
        console.log(`     🔍 Contains "Try regenerating": ${isTryRegenerating}`);
        console.log(`     ✅ Is Valid Content: ${isValidContent}`);
        if (hasContent) {
          const preview = contentLength > 50 ? section.content.substring(0, 50) + '...' : section.content;
          console.log(`     📄 Content Preview: "${preview}"`);
        }
        console.log(`     🎯 Type: ${section.type}, Order: ${section.order}, Visible: ${section.visible}`);
        console.log('     ─────────────────────────────────────────');
      });
      
      // Test detection logic explicitly
      const hasAnyValidContent = sections.some((section: any) => {
        if (!section.content || section.content.trim().length === 0) {
          return false;
        }
        const isErrorMessage = section.content.includes('Generation failed') || 
                              section.content.includes('Try regenerating') ||
                              section.content.includes('Error:') ||
                              section.content.startsWith('Failed to');
        return !isErrorMessage;
      });
      
      console.log(`🎯 FINAL DETECTION RESULT: ${hasAnyValidContent ? 'HAS VALID CONTENT' : 'NO VALID CONTENT'}`);
      console.log(`🚀 Will ${hasAnyValidContent ? 'SKIP' : 'RUN'} AI enrichment`);
    } else {
      console.log('❌ No sections provided in request');
    }
    console.log('🚀 ============================================');

    if (!candidateData || !candidateData.fullName) {
      return NextResponse.json(
        { success: false, message: 'Missing candidate data' },
        { status: 400 }
      );
    }

    // Extract client information from job description
    const { client, jobTitle } = extractClientInfo(jobDescription);

    // 🔥 SEGMENT-BASED GENERATION: Use segments if provided with content
    const hasContentfulSections = sections && sections.length > 0 && 
      sections.some((section: { content?: string; type?: string; title?: string }) => {
        if (!section.content || section.content.trim().length === 0) {
          return false;
        }
        // Check if content is an error message
        const isErrorMessage = section.content?.includes('Generation failed') || 
                              section.content?.includes('Try regenerating') ||
                              section.content?.includes('Error:') ||
                              section.content?.startsWith('Failed to');
        return !isErrorMessage;
      });

    console.log(`📋 Section analysis: ${sections?.length || 0} sections provided, ${hasContentfulSections ? 'WITH' : 'WITHOUT'} content`);
    
    // Debug: Log all sections with their content status
    if (sections && sections.length > 0) {
      console.log('🔍 Section content analysis:');
      sections.forEach((section: { content?: string; type?: string; title?: string; order?: number; visible?: boolean }, index: number) => {
        const contentPreview = section.content ? 
          (section.content.length > 100 ? section.content.substring(0, 100) + '...' : section.content) : 
          'NO CONTENT';
        const hasContent = section.content && section.content.trim().length > 0;
        const isErrorMessage = hasContent && section.content && (
          section.content.includes('Generation failed') || 
          section.content.includes('Try regenerating') ||
          section.content.includes('Error:') ||
          section.content.startsWith('Failed to')
        );
        const isValidContent = hasContent && !isErrorMessage;
        console.log(`  ${index + 1}. ${section.title || section.type} (order: ${section.order})`);
        console.log(`     Content: ${isValidContent ? '✅ VALID' : isErrorMessage ? '⚠️ ERROR' : '❌ EMPTY'} - "${contentPreview}"`);
        console.log(`     Type: ${section.type}, Visible: ${section.visible}`);
      });
    }

    // 🚀 QUEUE-BASED AI ENRICHMENT: Use Redis queue for scalable processing
    let enrichedContent: EnrichedContent | undefined;
    
    // CRITICAL: Only proceed with AI-generated content if no contentful sections provided
    if (!saveOnly && format === 'pdf' && !hasContentfulSections) {
      if (!process.env.OPENAI_API_KEY) {
        console.error('❌ CRITICAL: OpenAI API key is required for AI enrichment!');
        return NextResponse.json(
          { success: false, message: 'AI enrichment is required but OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.' },
          { status: 500 }
        );
      }

      try {
        console.log('🚀 Starting P-QUEUE AI enrichment for ultra-fast processing...');
        const startTime = Date.now();
        
        // Import the AI queue service
        const { aiQueueService } = await import('@/lib/services/ai-queue-service');
        
        // Create unique session ID for tracking
        const sessionId = `cf-${candidateData.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`📝 Processing AI enrichment with p-queue for candidate: ${candidateData.fullName}`);
        
        // Prepare enrichment requests for parallel processing
        const enrichmentRequests = [
          {
            sectionType: 'summary',
            candidateData,
            jobDescription,
            type: 'generate' as const,
            token: userId,
            sessionId,
          },
          {
            sectionType: 'technical_skills',
            candidateData,
            jobDescription,
            type: 'generate' as const,
            token: userId,
            sessionId,
          },
          {
            sectionType: 'experience',
            candidateData,
            jobDescription,
            type: 'generate' as const,
            token: userId,
            sessionId,
          },
        ];

        console.log(`🎯 Queuing ${enrichmentRequests.length} AI enrichment tasks`);
        
        // Process all enrichment tasks in parallel using p-queue
        const jobIds = await aiQueueService.addBatchTasks(enrichmentRequests, 8); // Very high priority
        const results = await aiQueueService.waitForBatch(jobIds, 90000); // 90 second timeout
        
        // Build enriched content from results
        enrichedContent = {
          enhancedSummary: '',
          optimizedSkills: { technical: [], functional: [], leadership: [] },
          enrichedExperience: [],
          areasOfExpertise: [],
          valueProposition: '',
          optimizedEducation: [],
          optimizedCertifications: [],
          optimizedCoreCompetencies: [],
          optimizedTechnicalExpertise: [],
        };

        // Map results to enriched content
        enrichmentRequests.forEach((request, index) => {
          const result = results[index];
          if (result.success) {
            switch (request.sectionType) {
              case 'summary':
                if (typeof result.data === 'string') {
                  enrichedContent!.enhancedSummary = result.data;
                }
                break;
              case 'technical_skills':
                if (typeof result.data === 'string') {
                  enrichedContent!.optimizedSkills.technical = result.data.split(',').map((s: string) => s.trim());
                }
                break;
              case 'experience':
                if (result.data && typeof result.data === 'object') {
                  enrichedContent!.enrichedExperience = [result.data as any];
                }
                break;
            }
          }
        });

        const successfulTasks = results.filter(r => r.success).length;
        const processingTime = Date.now() - startTime;
        
        console.log(`🎉 P-QUEUE enrichment completed: ${successfulTasks}/${enrichmentRequests.length} successful in ${processingTime}ms`);

        if (successfulTasks === 0) {
          throw new Error('All AI enrichment tasks failed');
        }
        
        // Update candidate data with AI-enhanced summary
        if (enrichedContent?.enhancedSummary) {
          candidateData.summary = enrichedContent.enhancedSummary;
        }
        
      } catch (enrichmentError) {
        console.error('❌ CRITICAL: AI enrichment failed completely:', enrichmentError);
        
        // NO FALLBACKS - Return error to ensure only AI content is used
        return NextResponse.json(
          { 
            success: false, 
            message: 'AI enrichment failed. Only AI-generated content is allowed. Please try again or contact support.',
            error: enrichmentError instanceof Error ? enrichmentError.message : 'Unknown enrichment error'
          },
          { status: 500 }
        );
      }
    } else if (hasContentfulSections) {
      console.log('✅ Using segment-based content, skipping AI enrichment');
    }

    // Handle draft saving (save only, no file generation)
    if (saveOnly || format === 'draft') {
      // Find or create candidate first
      let candidate = await db.candidate.findFirst({
        where: {
          OR: [
            { id: candidateData.id },
            { email: candidateData.email || '' },
            { 
              AND: [
                { firstName: candidateData.fullName.split(' ')[0] || '' },
                { lastName: candidateData.fullName.split(' ').slice(1).join(' ') || '' }
              ]
            }
          ]
        }
      });

      if (!candidate) {
        // Create candidate if not found - use email or generate a unique identifier
        const email = candidateData.email || `${candidateData.fullName.replace(/\s+/g, '').toLowerCase()}@temp.generated`;
        
        candidate = await db.candidate.create({
          data: {
            firstName: candidateData.fullName.split(' ')[0] || 'Unknown',
            lastName: candidateData.fullName.split(' ').slice(1).join(' ') || '',
            email: email,
            currentTitle: candidateData.currentTitle,
            phone: candidateData.phone || null,
            currentLocation: candidateData.location || null,
            experienceYears: candidateData.yearsOfExperience || null,
            summary: candidateData.summary || null,
            technicalSkills: candidateData.skills || [],
            certifications: candidateData.certifications || [],
            spokenLanguages: candidateData.languages || [],
            lastUpdated: new Date(),
            status: 'ACTIVE'
          }
        });
      }
    }

    // Generate HTML content based on template with proper styling
    let htmlContent: string;
    if (template === 'antaes') {
      // Antaes template has its own specialized HTML generator
      htmlContent = generateAntaesCompetenceFileHTML(candidateData, sections, jobDescription, managerContact, enrichedContent);
    } else if (template === 'emineon') {
      // Emineon template uses clean Antaes styling but with Emineon branding
      htmlContent = generateEmineonCompetenceFileHTML(candidateData, sections, jobDescription, managerContact, enrichedContent);
    } else {
      // All other templates (professional, modern, minimal) use the generic generator
      htmlContent = generateCompetenceFileHTML(candidateData, sections, jobDescription, managerContact, enrichedContent, template);
    }

    let fileBuffer: Buffer;
    let fileFormat = format;
    let contentType: string;

    if (format === 'pdf') {
      try {
        console.log('🚀 Starting OPTIMIZED PDF generation...');
        const startTime = Date.now();
        
        // OPTIMIZATION: Generate PDF with reduced timeout and optimized settings
        fileBuffer = await generatePDF(htmlContent);
        contentType = 'application/pdf';
        
        const generationTime = Date.now() - startTime;
        console.log(`✅ PDF generated successfully in ${generationTime}ms`);
        
      } catch (pdfError) {
        console.error('❌ PDF generation failed:', pdfError);
        
        // Fallback to HTML
        fileBuffer = Buffer.from(htmlContent, 'utf8');
        fileFormat = 'html';
        contentType = 'text/html';
      }
    } else {
      // For non-PDF formats, return HTML
      fileBuffer = Buffer.from(htmlContent, 'utf8');
      fileFormat = 'html';
      contentType = 'text/html';
    }

    const filename = `${candidateData.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${client.replace(/[^a-zA-Z0-9]/g, '_')}_Competence_File.${fileFormat}`;

    // OPTIMIZATION: Parallel file upload and database operations
    
    if (!saveOnly) {
      // Find or create candidate first to ensure valid candidateId
      let candidate = await db.candidate.findFirst({
        where: {
          OR: [
            { id: candidateData.id },
            { email: candidateData.email || '' },
            { 
              AND: [
                { firstName: candidateData.fullName.split(' ')[0] || '' },
                { lastName: candidateData.fullName.split(' ').slice(1).join(' ') || '' }
              ]
            }
          ]
        }
      });

      if (!candidate) {
        // Create candidate if not found
        const email = candidateData.email || `${candidateData.fullName.replace(/\s+/g, '').toLowerCase()}@temp.generated`;
        
        candidate = await db.candidate.create({
          data: {
            firstName: candidateData.fullName.split(' ')[0] || 'Unknown',
            lastName: candidateData.fullName.split(' ').slice(1).join(' ') || '',
            email: email,
            currentTitle: candidateData.currentTitle,
            phone: candidateData.phone || null,
            currentLocation: candidateData.location || null,
            experienceYears: candidateData.yearsOfExperience || null,
            summary: candidateData.summary || null,
            technicalSkills: candidateData.skills || [],
            certifications: candidateData.certifications || [],
            spokenLanguages: candidateData.languages || [],
            lastUpdated: new Date(),
            status: 'ACTIVE'
          }
        });
        
        console.log(`✅ Created new candidate: ${candidate.id} for ${candidateData.fullName}`);
      } else {
        console.log(`✅ Found existing candidate: ${candidate.id} for ${candidateData.fullName}`);
      }
      
      // Update candidateData.id to use the valid database ID
      candidateData.id = candidate.id;
    }

    type UploadResult = { url: string; pathname: string; contentType: string; contentDisposition: string };
    type DatabaseResult = any;
    
    // Upload to Vercel Blob first
    const uploadResult: UploadResult = await put(filename, fileBuffer, {
      access: 'public',
      contentType: contentType,
    });
    
    // Save to database (if not draft) using the validated candidate ID
    const databaseResult: DatabaseResult = !saveOnly ? await db.competenceFile.create({
      data: {
        fileName: filename,
        candidateId: candidateData.id, // Now using validated candidate ID
        templateId: null,
        filePath: filename,
        downloadUrl: uploadResult.url, // Use upload result directly
        format: fileFormat,
        status: 'READY',
        version: 1,
        metadata: {
          client,
          jobTitle,
          template,
          sectionsCount: sections?.length || 0,
          hasJobDescription: !!jobDescription,
          aiEnriched: true
        },
        sectionsConfig: sections || null,
        generatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }) : null;

    console.log('✅ QUEUE-OPTIMIZED competence file generation completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Competence file generated successfully with AI enrichment',
      fileUrl: uploadResult.url,
      filename: filename,
      format: fileFormat,
      client: client,
      jobTitle: jobTitle,
      aiEnriched: true,
      processingMethod: 'queue-based'
    });

  } catch (error) {
    console.error('❌ Competence file generation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate competence file',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check service status
export async function GET() {
  return NextResponse.json({
    service: 'Competence File Generator',
    status: 'operational',
    features: {
      cvParsing: !!process.env.OPENAI_API_KEY,
      pdfGeneration: true,
      docxGeneration: true,
      fileStorage: true, // Local file storage is always available
    },
    timestamp: new Date().toISOString(),
  });
}

// Add this new function after the generateAntaesCompetenceFileHTML function (around line 1380)

export function generateEmineonCompetenceFileHTML(candidateData: CandidateData, sections?: any[], jobDescription?: JobDescription, managerContact?: ManagerContact, enrichedContent?: EnrichedContent): string {
  // Get template styles
  const templateStyles = getTemplateStyles('emineon');
  
  // Use AI-enriched experience if available, otherwise fallback to original
  const experienceHTML = enrichedContent?.enrichedExperience ? 
    generateEnrichedExperienceHTML(enrichedContent.enrichedExperience) : 
    generateExperienceHTML(candidateData.experience);
  
  // Generate functional skills with explanatory text - use AI-optimized skills if available
  const generateFunctionalSkills = (skills: string[]) => {
    // Use AI-optimized functional skills if available
    const functionalSkills = enrichedContent?.optimizedSkills?.functional || skills;
    if (!functionalSkills || functionalSkills.length === 0) return '';
    
    const skillCategories: Record<string, { skills: string[]; description: string }> = {
      'Leadership & Management': {
        skills: skills.filter(skill => 
          skill.toLowerCase().includes('lead') || 
          skill.toLowerCase().includes('manage') || 
          skill.toLowerCase().includes('team') ||
          skill.toLowerCase().includes('project')
        ),
        description: 'Proven ability to guide teams and manage complex projects with strategic oversight and operational excellence.'
      },
      'Communication & Collaboration': {
        skills: skills.filter(skill => 
          skill.toLowerCase().includes('communication') || 
          skill.toLowerCase().includes('presentation') || 
          skill.toLowerCase().includes('stakeholder')
        ),
        description: 'Strong interpersonal skills enabling effective collaboration across diverse teams and stakeholder groups.'
      },
      'Problem Solving & Analysis': {
        skills: skills.filter(skill => 
          skill.toLowerCase().includes('analysis') || 
          skill.toLowerCase().includes('problem') || 
          skill.toLowerCase().includes('research')
        ),
        description: 'Analytical mindset with systematic approach to identifying solutions and optimizing processes.'
      },
      'Innovation & Strategy': {
        skills: skills.filter(skill => 
          skill.toLowerCase().includes('innovation') || 
          skill.toLowerCase().includes('strategy') || 
          skill.toLowerCase().includes('planning')
        ),
        description: 'Forward-thinking approach to business challenges with focus on sustainable growth and competitive advantage.'
      }
    };
    
    // If no categorized skills found, create a general category
    const categorizedSkills = Object.values(skillCategories).some(cat => cat.skills.length > 0);
    if (!categorizedSkills) {
      skillCategories['Core Competencies'] = {
        skills: skills.slice(0, 6),
        description: 'Comprehensive skill set developed through professional experience and continuous learning initiatives.'
      };
    }
    
    return Object.entries(skillCategories)
      .filter(([_, category]) => category.skills.length > 0)
      .map(([categoryName, category]) => {
        // Determine column class based on number of skills
        let columnClass = '';
        if (category.skills.length >= 15) {
          columnClass = ' multi-column-large';
        } else if (category.skills.length >= 8) {
          columnClass = ' multi-column';
        }
        
        return `
        <div class="functional-skill-category">
          <div class="skill-category-title">${categoryName}</div>
          <ul class="skill-list${columnClass}">
            ${category.skills.map(skill => `<li>${skill}</li>`).join('')}
          </ul>
          <p class="skill-description">${category.description}</p>
        </div>
      `;
      }).join('');
  };

  // Generate technical skills with properly structured categories
  const generateTechnicalSkills = (skills: string[]) => {
    if (!skills || skills.length === 0) return '';
    
    const techCategories: Record<string, { skills: string[]; description: string }> = {
      'Programming Languages': {
        skills: skills.filter(skill => 
          ['javascript', 'python', 'java', 'typescript', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'].some(lang => 
            skill.toLowerCase().includes(lang)
          )
        ),
        description: 'Proficient in multiple programming languages with deep understanding of software development principles.'
      },
      'Frameworks & Libraries': {
        skills: skills.filter(skill => 
          ['react', 'angular', 'vue', 'node', 'express', 'django', 'spring', 'laravel', '.net'].some(framework => 
            skill.toLowerCase().includes(framework)
          )
        ),
        description: 'Extensive experience with modern frameworks enabling rapid development and scalable solutions.'
      },
      'Cloud & Infrastructure': {
        skills: skills.filter(skill => 
          ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible'].some(cloud => 
            skill.toLowerCase().includes(cloud)
          )
        ),
        description: 'Advanced cloud computing and DevOps expertise for scalable infrastructure management.'
      },
      'Databases & Storage': {
        skills: skills.filter(skill => 
          ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite'].some(db => 
            skill.toLowerCase().includes(db)
          )
        ),
        description: 'Comprehensive database management skills across relational and NoSQL technologies.'
      },
      'Development Tools': {
        skills: skills.filter(skill => 
          !['javascript', 'python', 'java', 'typescript', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
            'react', 'angular', 'vue', 'node', 'express', 'django', 'spring', 'laravel', '.net',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible'].some(tech => 
            skill.toLowerCase().includes(tech)
          )
        ),
        description: 'Diverse technical toolkit supporting efficient development workflows and project delivery.'
      }
    };
    
    // If no categorized skills found, create a general category
    const categorizedSkills = Object.values(techCategories).some(cat => cat.skills.length > 0);
    if (!categorizedSkills) {
      techCategories['Technical Competencies'] = {
        skills: skills,
        description: 'Comprehensive technical skill set acquired through hands-on experience and professional development.'
      };
    }
    
    return Object.entries(techCategories)
      .filter(([_, category]) => category.skills.length > 0)
      .map(([categoryName, category]) => {
        return `
        <div class="technical-skill-category">
          <div class="skill-category-title">${categoryName}</div>
          <ul class="skill-list">
            ${category.skills.map(skill => `<li>${skill}</li>`).join('')}
          </ul>
          <p class="skill-description">${category.description}</p>
        </div>
      `;
      }).join('');
  };

  // Generate areas of expertise based on role and skills  
  const generateAreasOfExpertise = (currentTitle: string, skills: string[]): string[] => {
    const expertiseAreas: string[] = [];
    
    // Add based on current title
    if (currentTitle.toLowerCase().includes('software') || currentTitle.toLowerCase().includes('developer')) {
      expertiseAreas.push('Software Development & Engineering');
    }
    if (currentTitle.toLowerCase().includes('senior') || currentTitle.toLowerCase().includes('lead')) {
      expertiseAreas.push('Technical Leadership & Mentoring');
    }
    if (currentTitle.toLowerCase().includes('full') || currentTitle.toLowerCase().includes('stack')) {
      expertiseAreas.push('Full-Stack Development');
    }
    if (currentTitle.toLowerCase().includes('frontend') || currentTitle.toLowerCase().includes('ui')) {
      expertiseAreas.push('User Interface Development');
    }
    if (currentTitle.toLowerCase().includes('backend') || currentTitle.toLowerCase().includes('api')) {
      expertiseAreas.push('Backend Systems & APIs');
    }
    if (currentTitle.toLowerCase().includes('devops') || currentTitle.toLowerCase().includes('infrastructure')) {
      expertiseAreas.push('DevOps & Infrastructure');
    }
    if (currentTitle.toLowerCase().includes('data') || currentTitle.toLowerCase().includes('analytics')) {
      expertiseAreas.push('Data Analysis & Business Intelligence');
    }
    if (currentTitle.toLowerCase().includes('architect')) {
      expertiseAreas.push('System Architecture & Design');
    }
    if (currentTitle.toLowerCase().includes('manager') || currentTitle.toLowerCase().includes('director')) {
      expertiseAreas.push('Project Management & Strategy');
    }
    
    // Add based on skills
    if (skills.some(skill => skill.toLowerCase().includes('cloud') || skill.toLowerCase().includes('aws') || skill.toLowerCase().includes('azure'))) {
      expertiseAreas.push('Cloud Computing & Scalability');
    }
    if (skills.some(skill => skill.toLowerCase().includes('agile') || skill.toLowerCase().includes('scrum'))) {
      expertiseAreas.push('Agile Methodologies & Process Optimization');
    }
    
    // Ensure we have at least 6 areas
    const defaultAreas = [
      'Digital Transformation',
      'Technology Innovation', 
      'Process Optimization',
      'Quality Assurance',
      'Cross-functional Collaboration',
      'Continuous Learning & Development'
    ];
    
    while (expertiseAreas.length < 6) {
      const nextArea = defaultAreas.find(area => !expertiseAreas.includes(area));
      if (nextArea) {
        expertiseAreas.push(nextArea);
      } else {
        break;
      }
    }
    
    return expertiseAreas.slice(0, 6);
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${candidateData.fullName} - Competence File</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #232629;
          background: #ffffff;
          font-size: 9px;
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          min-height: 297mm;
          padding: 30px;
          position: relative;
          padding-bottom: 80px;
        }
        
        /* Header Styling - Logo on right, content on left */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #073C51;
        }
        
        .header-content {
          flex: 1;
          text-align: left;
        }
        
        .header-logo {
          flex-shrink: 0;
          margin-left: 20px;
        }
        
        .logo-image {
          height: 70px;
          width: auto;
          max-width: 250px;
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
        }
        
        .header h1 {
          font-size: 22px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }
        
        .header-role {
          font-size: 8px;
          font-weight: 600;
          color: #FFB800;
          margin-bottom: 4px;
        }
        
        .header-experience {
          font-size: 9px;
          font-weight: 500;
          color: #444B54;
          margin-bottom: 12px;
        }
        
        .location-info {
          font-size: 9px;
          color: #444B54;
          margin-bottom: 12px;
          font-weight: 500;
        }
        
        .manager-contact {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e9ecef;
        }
        
        .manager-label {
          font-size: 9px;
          font-weight: 600;
          color: #073C51;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .contact-item {
          color: #444B54;
          font-size: 8px;
          margin-bottom: 3px;
        }
        
        .contact-label {
          font-weight: 700;
          color: #232629;
        }
        
        .header-logo {
          flex-shrink: 0;
          margin-left: 30px;
        }
        
        .logo-image {
          ${templateStyles.logoStyle}
        }
        
        /* Content Area */
        .content {
          margin-bottom: 60px;
        }
        
        /* Section Styling */
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 8px;
          font-weight: 700;
          color: ${templateStyles.primaryColor};
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid ${templateStyles.primaryColor};
        }
        
        .section-content {
          font-size: 9px;
          line-height: 1.7;
        }
        
        /* Content Formatting */
        .section-content p {
          margin-bottom: 12px;
          line-height: 1.7;
        }
        
        .section-content ul {
          margin: 12px 0;
          padding-left: 0;
          list-style: none;
        }
        
        .section-content li {
          position: relative;
          padding-left: 20px;
          margin-bottom: 8px;
          line-height: 1.6;
        }
        
        .section-content li:before {
          content: "•";
          color: ${templateStyles.accentColor};
          font-weight: bold;
          position: absolute;
          left: 0;
          top: 0;
        }
        
        .section-content strong {
          font-weight: 700;
          color: ${templateStyles.primaryColor};
        }
        
        .section-content em {
          font-style: italic;
          color: #444B54;
        }
        
        /* Professional Summary */
        .summary-text {
          font-weight: 400;
          line-height: 1.8;
          color: #444B54;
          text-align: justify;
        }
        
        /* Functional Skills */
        .functional-skill-category {
          margin-bottom: 18px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #073C51;
        }
        
        .skill-category-title {
          font-size: 9px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 8px;
        }
        
        .skill-list {
          list-style: none;
          padding-left: 0;
          margin-bottom: 8px;
        }
        
        .skill-list.multi-column {
          column-count: 2;
          column-gap: 20px;
          column-fill: balance;
        }
        
        .skill-list.multi-column-large {
          column-count: 3;
          column-gap: 15px;
          column-fill: balance;
        }
        
        .skill-list li {
          position: relative;
          padding-left: 15px;
          margin-bottom: 4px;
          color: #444B54;
          font-weight: 500;
          break-inside: avoid;
        }
        
        .skill-list li:before {
          content: "•";
          color: #FFB800;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        .skill-description {
          font-style: italic;
          color: #666;
          font-size: 9px;
          line-height: 1.5;
        }
        
        /* Technical Skills - Enhanced Structure */
        .technical-skill-category {
          margin-bottom: 18px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #FFB800;
          page-break-inside: avoid;
        }
        
        /* Areas of Expertise */
        .expertise-areas {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .expertise-item {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: #f8f9fa;
          border-radius: 20px;
          font-weight: 500;
          color: #073C51;
          font-size: 9px;
          border: 1px solid #e9ecef;
          position: relative;
          padding-left: 20px;
        }
        
        .expertise-item:before {
          content: "";
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #FFB800;
          border-radius: 50%;
        }
        
        /* Education & Certifications */
        .education-item, .cert-item {
          margin-bottom: 16px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 3px solid #FFB800;
        }
        
        .education-degree, .cert-name {
          font-weight: 600;
          color: #232629;
        }
        
        .education-year, .cert-year {
          color: #FFB800;
          font-weight: 600;
          font-size: 8px;
        }
        
        .education-description, .cert-description {
          color: #444B54;
          font-size: 9px;
          line-height: 1.5;
          margin-top: 6px;
          font-style: italic;
        }
        
        /* Languages */
        .languages-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .language-item {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: #f8f9fa;
          border-radius: 20px;
          font-weight: 500;
          color: #073C51;
          font-size: 9px;
          border: 1px solid #e9ecef;
          position: relative;
          padding-left: 20px;
        }
        
        .language-item:before {
          content: "";
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #073C51;
          border-radius: 50%;
        }
        
        /* Experience Summary */
        .experiences-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #073C51;
        }
        
        .experience-summary-item {
          margin-bottom: 8px;
          color: #444B54;
          line-height: 1.6;
          font-size: 8px;
        }
        
        /* Experience Blocks */
        .experience-block {
          margin-bottom: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #073C51;
          page-break-inside: avoid;
          position: relative;
        }
        /* Decorative blue open bracket to match reference */
        .experience-block:before {
          content: "";
          position: absolute;
          left: -6px;
          top: 18px;
          width: 10px;
          height: 22px;
          border-left: 4px solid #073C51;
          border-top: 4px solid #073C51;
          border-bottom: 4px solid #073C51;
          border-right: none;
          border-radius: 6px 0 0 6px;
        }
        
        .exp-header {
          margin-bottom: 15px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .exp-company {
          font-size: 8px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 4px;
        }
        
        .exp-title {
          font-size: 9px;
          font-weight: 600;
          color: #FFB800;
          margin-bottom: 4px;
        }
        
        .exp-dates {
          font-size: 8px;
          color: #444B54;
          font-weight: 600;
        }
        
        .exp-section {
          margin-bottom: 12px;
        }
        
        .exp-section-title {
          font-size: 8px;
          font-weight: 700;
          color: #073C51;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .exp-description {
          color: #444B54;
          line-height: 1.6;
          margin-bottom: 8px;
          font-style: italic;
          font-size: 8px;
        }
        
        .exp-responsibilities, .exp-achievements, .exp-technical {
          list-style: none;
          padding-left: 0;
        }
        
        .exp-responsibilities li, .exp-achievements li, .exp-technical li {
          position: relative;
          padding-left: 15px;
          margin-bottom: 6px;
          color: #444B54;
          line-height: 1.6;
          font-weight: 500;
          font-size: 8px;
        }
        
        .exp-responsibilities li:before, .exp-achievements li:before, .exp-technical li:before {
          content: "•";
          color: #FFB800;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        /* Technical Environment Grid */
        /* Make technical environment render as yellow-bullet list (like reference) */
        .technical-environment-grid { margin-top: 6px; }
        .tech-tag {
          display: block;
          position: relative;
          padding-left: 15px;
          margin-bottom: 6px;
          color: #444B54;
          line-height: 1.6;
          font-weight: 500;
          font-size: 8px;
        }
        .tech-tag:before {
          content: "•";
          color: #FFB800;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        /* Page counter for PDF generation */
        @page {
          margin: 20mm;
          @bottom-left {
            content: counter(page);
            font-family: 'Inter', sans-serif;
            font-size: 9px;
            font-weight: 600;
            color: #073C51;
          }
          @bottom-center {
            content: "Powered by EMINEON • forge your edge";
            font-family: 'Inter', sans-serif;
            font-size: 8px;
            color: #444B54;
          }
        }
        
        /* Print Optimization */
        @media print {
          body { 
            font-size: 9px; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .container { 
            max-width: none; 
            margin: 0; 
            padding: 20px;
            padding-bottom: 60px;
          }
          .section { 
            page-break-inside: avoid; 
          }
          .experience-block { 
            page-break-inside: avoid; 
          }
          .logo-image {
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: transparent !important;
          }
          .header-logo {
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
          }
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .header { 
            text-align: left;
          }
          .contact-info { 
            justify-content: flex-start;
            flex-direction: column; 
            gap: 10px;
          }
          .expertise-areas { 
            grid-template-columns: 1fr; 
          }
          .languages-grid { 
            grid-template-columns: 1fr; 
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER - Content on left, logo on right -->
        <div class="header">
          <div class="header-content">
            <h1>${candidateData.fullName}</h1>
            <div class="header-role">${candidateData.currentTitle}</div>
            ${candidateData.yearsOfExperience ? `<div class="header-experience">${candidateData.yearsOfExperience} years of experience</div>` : ''}
            ${managerContact && (managerContact.name || managerContact.email || managerContact.phone) ? `
              <div class="manager-contact">
                <div class="manager-label">For inquiries, contact:</div>
                ${managerContact.name ? `<div class="contact-item"><span class="contact-label">Manager:</span> ${managerContact.name}</div>` : ''}
                ${managerContact.email ? `<div class="contact-item"><span class="contact-label">Email:</span> ${managerContact.email}</div>` : ''}
                ${managerContact.phone ? `<div class="contact-item"><span class="contact-label">Phone:</span> ${managerContact.phone}</div>` : ''}
              </div>
            ` : ''}
          </div>
          <div class="header-logo">
            <img src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png" 
                 alt="EMINEON" 
                 class="logo-image" 
                 style="width: 150px; height: 80px; object-fit: contain; display: block !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; opacity: 1 !important; visibility: visible !important; background: transparent !important;" 
                 onload="this.style.opacity='1';" 
                 onerror="console.error('Emineon logo failed to load:', this.src);" />
          </div>
        </div>
        
        <div class="content">
          ${managerContact && (managerContact.name || managerContact.email || managerContact.phone) ? `
          <div class="section">
            <h2 class="section-title">MANAGER DETAILS</h2>
            <div class="section-content">
              <ul>
                ${managerContact.name ? `<li><strong>Manager:</strong> ${managerContact.name}</li>` : ''}
                ${managerContact.email ? `<li><strong>Email:</strong> ${managerContact.email}</li>` : ''}
                ${managerContact.phone ? `<li><strong>Phone:</strong> ${managerContact.phone}</li>` : ''}
              </ul>
            </div>
          </div>
          ` : ''}
          <!-- EXECUTIVE SUMMARY -->
          ${candidateData.summary ? `
          <div class="section">
            <h2 class="section-title">EXECUTIVE SUMMARY</h2>
            <div class="section-content">
              <p class="summary-text">${candidateData.summary}</p>
            </div>
          </div>
          ` : ''}

          <!-- CORE COMPETENCIES -->
          ${candidateData.skills && candidateData.skills.length > 0 ? `
          <div class="section">
            <h2 class="section-title">CORE COMPETENCIES</h2>
            <div class="section-content">
              ${generateFunctionalSkills(enrichedContent?.optimizedCoreCompetencies || enrichedContent?.optimizedSkills?.functional || candidateData.skills)}
            </div>
          </div>
          ` : ''}

          <!-- TECHNICAL EXPERTISE -->
          ${candidateData.skills && candidateData.skills.length > 0 ? `
          <div class="section">
            <h2 class="section-title">TECHNICAL EXPERTISE</h2>
            <div class="section-content">
              ${generateTechnicalSkills(enrichedContent?.optimizedTechnicalExpertise || enrichedContent?.optimizedSkills?.technical || candidateData.skills)}
            </div>
          </div>
          ` : ''}

          <!-- AREAS OF EXPERTISE -->
          <div class="section">
            <h2 class="section-title">AREAS OF EXPERTISE</h2>
            <div class="section-content">
              <div class="expertise-areas">
                ${(enrichedContent?.areasOfExpertise || generateAreasOfExpertise(candidateData.currentTitle, candidateData.skills)).map(area => `
                  <div class="expertise-item"><strong>${area}</strong></div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- EDUCATION -->
          ${candidateData.education && candidateData.education.length > 0 ? `
          <div class="section">
            <h2 class="section-title">EDUCATION</h2>
            <div class="section-content">
              ${candidateData.education.map(edu => `
                <div class="education-item">
                  <div class="education-degree"><strong>${edu}</strong></div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- CERTIFICATIONS -->
          ${candidateData.certifications && candidateData.certifications.length > 0 ? `
          <div class="section">
            <h2 class="section-title">CERTIFICATIONS</h2>
            <div class="section-content">
              ${candidateData.certifications.map(cert => {
                // Extract year from certification if present
                const yearMatch = cert.match(/\b(19|20)\d{2}\b/);
                const year = yearMatch ? yearMatch[0] : null;
                const cleanCert = cert.replace(/\b(19|20)\d{2}\b/g, '').trim();
                
                // Generate description based on certification type
                let description = 'Professional certification validating specialized expertise and industry knowledge.';
                if (cert.toLowerCase().includes('aws') || cert.toLowerCase().includes('azure') || cert.toLowerCase().includes('cloud')) {
                  description = 'Cloud computing certification validating modern infrastructure expertise.';
                } else if (cert.toLowerCase().includes('project') || cert.toLowerCase().includes('pmp') || cert.toLowerCase().includes('agile')) {
                  description = 'Project management certification demonstrating leadership capabilities.';
                } else if (cert.toLowerCase().includes('security') || cert.toLowerCase().includes('cissp')) {
                  description = 'Security certification validating risk management expertise.';
                } else if (cert.toLowerCase().includes('scrum') || cert.toLowerCase().includes('agile')) {
                  description = 'Agile methodology certification for effective team collaboration.';
                } else if (cert.toLowerCase().includes('data') || cert.toLowerCase().includes('analytics')) {
                  description = 'Data analytics certification for strategic decision-making.';
                }
                
                return `
                  <div class="cert-item">
                    <div class="cert-name"><strong>${cleanCert || cert}</strong></div>
                    ${year ? `<div class="cert-year">Obtained: ${year}</div>` : ''}
                    <div class="cert-description"><em>${description}</em></div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}

          <!-- LANGUAGES -->
          ${candidateData.languages && candidateData.languages.length > 0 ? `
          <div class="section">
            <h2 class="section-title">LANGUAGES</h2>
            <div class="section-content">
              <div class="languages-grid">
                ${candidateData.languages.map(lang => `
                  <div class="language-item">${lang}</div>
                `).join('')}
              </div>
            </div>
          </div>
          ` : ''}

          <!-- DETAILED PROFESSIONAL EXPERIENCES -->
          ${experienceHTML}
        </div>
      </div>
    </body>
    </html>
  `;
}
