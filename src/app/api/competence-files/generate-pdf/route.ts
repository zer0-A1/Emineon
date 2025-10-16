// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generatePDF } from '@/lib/pdf-service';
// Types for the request
interface SegmentContent {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}



// 🏗️ STEP 1: SEGMENT STRUCTURING
interface StructuredSegment {
  order: number;
  title: string;
  content: string;
  type: 'header' | 'summary' | 'skills' | 'experience' | 'experience-summary' | 'education' | 'static' | 'dynamic';
  formatting: 'paragraph' | 'list' | 'table' | 'columns';
  priority: 'high' | 'medium' | 'low';
}

// ENHANCED SEGMENT STRUCTURING with better recognition
function structureSegments(segments: SegmentContent[], candidateData: unknown, template: string): StructuredSegment[] {
  console.log('🏗️ STEP 1: Structuring segments with proper normalization...');
  
  const structuredSegments: StructuredSegment[] = segments
    .filter(segment => segment.content && segment.content.trim() !== '')
    .sort((a, b) => a.order - b.order)
    .map((segment, index) => {
      let type: StructuredSegment['type'] = 'dynamic';
      let formatting: StructuredSegment['formatting'] = 'paragraph';
      let priority: StructuredSegment['priority'] = 'medium';
      
      const titleUpper = segment.title.toUpperCase();
      const titleLower = segment.title.toLowerCase();
      
      // Enhanced section recognition with experience summary detection
      if (titleUpper.includes('HEADER') || titleUpper.includes('NAME')) {
        type = 'header';
        priority = 'high';
      } else if (titleUpper.includes('SUMMARY') || titleUpper.includes('EXECUTIVE') || titleUpper.includes('PROFILE')) {
        type = 'summary';
        priority = 'high';
      } else if (
        titleUpper.includes('SKILL') || 
        titleUpper.includes('COMPETENC') || 
        titleUpper.includes('EXPERTISE') ||
        titleUpper.includes('TECHNICAL') ||
        titleUpper.includes('FUNCTIONAL')
      ) {
        type = 'skills';
        formatting = 'list';
        priority = 'high';
      } else if (
        titleUpper.includes('PROFESSIONAL EXPERIENCES SUMMARY') ||
        titleLower.includes('experiences summary') ||
        titleLower.includes('experience summary') ||
        (titleUpper.includes('EXPERIENCE') && titleUpper.includes('SUMMARY'))
      ) {
        type = 'experience-summary';
        formatting = 'paragraph';
        priority = 'high';
      } else if (
        titleUpper.includes('EXPERIENCE') || 
        titleUpper.includes('EMPLOYMENT') ||
        titleUpper.includes('PROFESSIONAL EXPERIENCE') ||
        titleLower.includes('experience 1') ||
        titleLower.includes('experience 2') ||
        titleLower.includes('experience 3') ||
        titleLower.includes('professional experiences') ||
        titleLower.match(/professional experience \d+/)
      ) {
        type = 'experience';
        formatting = 'paragraph';
        priority = 'high';
      } else if (
        titleUpper.includes('EDUCATION') || 
        titleUpper.includes('QUALIFICATION') ||
        titleUpper.includes('ACADEMIC') ||
        titleUpper.includes('DEGREE')
      ) {
        type = 'education';
        formatting = 'list';
        priority = 'medium';
      } else if (
        titleUpper.includes('LANGUAGE') || 
        titleUpper.includes('CERTIFICATION') ||
        titleUpper.includes('CERT ') ||
        titleUpper.includes('LICENSE')
      ) {
        type = 'static';
        formatting = 'columns';
        priority = 'medium';
      }
      
      console.log(`📋 Structured segment: "${segment.title}" -> type: ${type}, formatting: ${formatting}`);
      
      return {
        order: index,
        title: segment.title,
        content: segment.content,
        type,
        formatting,
        priority
      };
    });

  console.log(`✅ Structured ${structuredSegments.length} segments`);
  return structuredSegments;
}

// 🧹 STEP 2: CONTENT CLEANING & NORMALIZATION
function cleanAndNormalizeContent(content: string, formatting: StructuredSegment['formatting']): string {
  let cleanedContent = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  switch (formatting) {
    case 'list':
      cleanedContent = cleanedContent
        .split('\n')
        .filter(Boolean)
        .map(line => {
          line = line.trim();
          if (!line.match(/^[•\-\*]/)) {
            if (line.includes(':') || /^[A-Z\s&]+$/.test(line)) {
              return `**${line}**`;
            }
            return `• ${line}`;
          }
          return line.replace(/^[•\-\*]\s*/, '• ');
        })
        .join('\n');
      break;
      
    case 'columns':
      cleanedContent = cleanedContent
        .split('\n')
        .filter(Boolean)
        .map(line => line.trim())
        .map(line => line.match(/^[•\-\*]/) ? line : `• ${line}`)
        .join('\n');
      break;
      
    case 'paragraph':
    default:
      cleanedContent = cleanedContent
        .split('\n')
        .filter(Boolean)
        .map(line => line.trim())
        .join('\n\n');
      break;
  }

  return cleanedContent;
}

// 🎨 STEP 3: ENHANCED SEMANTIC FORMATTING with OpenAI responses API integration
async function applySemanticFormatting(content: string, segmentType: StructuredSegment['type'], template: string, candidateData?: unknown, jobDescription?: unknown): Promise<string> {
  console.log(`🎨 Applying semantic formatting for type: ${segmentType} via OpenAI responses API`);
  
  try {
    // Call OpenAI responses API with final editor content
    console.log(`📡 Calling OpenAI responses API for ${segmentType} with finalEditorContent`);
    
    const response = await fetch('/api/openai-responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        finalEditorContent: content,
        sectionType: segmentType.toUpperCase(),
        candidateData,
        jobDescription,
        // finalEditorContent automatically triggers format_for_pdf enhancement
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error ${response.status}: ${errorData.error || 'Request failed'}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.content) {
      throw new Error(`OpenAI API returned: ${result.error || 'No content generated'}`);
    }

    console.log(`✅ OpenAI formatting successful for ${segmentType} (${result.content.length} chars)`);
    return result.content;
    
  } catch (error) {
    console.error(`❌ OpenAI formatting failed for ${segmentType}:`, error);
    console.log(`🔄 Falling back to local formatting for ${segmentType}`);
    
    // Fallback to local formatting functions
    try {
      switch (segmentType) {
        case 'header':
          return await formatHeaderContent(content, template);
        case 'summary':
          return await formatSummaryContent(content, template);
        case 'skills':
          return await formatSkillsContent(content, template);
        case 'experience':
          return await formatExperienceContent(content, template);
        case 'experience-summary':
          return await formatExperienceSummaryContent(content, template);
        case 'education':
          return formatEducationContent(content);
        case 'static':
          return formatStaticContent(content, template);
        default:
          return await applyGeneralFormatting(content);
      }
    } catch (fallbackError) {
      console.error(`❌ Fallback formatting also failed for ${segmentType}:`, fallbackError);
      return convertMarkdownToHTML(content);
    }
  }
}

// ✨ HEADER FORMATTING
async function formatHeaderContent(content: string, template: string): Promise<string> {
  console.log('🔧 Formatting header content...');
  
  const lines = content.split('\n').filter(line => line.trim());
  let formattedHtml = '<div class="header-section">';
  
  for (const line of lines) {
    const cleanLine = convertMarkdownToHTML(line.trim());
    if (cleanLine.includes('@') || cleanLine.includes('phone') || cleanLine.includes('+')) {
      formattedHtml += `<div class="contact-info">${cleanLine}</div>`;
    } else if (cleanLine.match(/\d+\s*(years|yrs)/i)) {
      formattedHtml += `<div class="experience-info">${cleanLine}</div>`;
    } else {
      formattedHtml += `<div class="header-info">${cleanLine}</div>`;
    }
  }
  
  formattedHtml += '</div>';
  return formattedHtml;
}

// ✨ PROFESSIONAL SUMMARY FORMATTING
async function formatSummaryContent(content: string, template: string): Promise<string> {
  console.log('🔧 Formatting professional summary...');
  
  const cleanContent = convertMarkdownToHTML(content);
  const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());
  
  let formattedHtml = '<div class="summary-section">';
  
  paragraphs.forEach((paragraph, index) => {
    const cleanParagraph = paragraph.trim();
    if (cleanParagraph.length > 0) {
      formattedHtml += `<p class="summary-paragraph ${index === 0 ? 'summary-opening' : ''}">${cleanParagraph}</p>`;
    }
  });
  
  formattedHtml += '</div>';
  return formattedHtml;
}

// NEW: Comprehensive markdown to HTML converter
function convertMarkdownToHTML(content: string): string {
  return content
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    
    // Bold text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    
    // Bullet points with various markers
    .replace(/^[•▸\-\*]\s*(.+)$/gm, '<li>$1</li>')
    
    // Line breaks
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>')
    
    // Wrap orphaned list items in <ul>
    .replace(/(<li>.*?<\/li>)/g, (match) => {
      // Don't wrap if already in a list
      if (match.includes('<ul>') || match.includes('<ol>')) {
        return match;
      }
      return `<ul>${match}</ul>`;
    })
    
    // Clean up any remaining markdown artifacts
    .replace(/^\s*[\-\*\+]\s*/gm, '')
    .replace(/^\s*\d+\.\s*/gm, '')
    
    // Wrap content in paragraphs if not already wrapped
    .replace(/^(?!<[uo]l|<h[1-6]|<p|<div)(.+)$/gm, '<p>$1</p>')
    
    // Clean up empty tags
    .replace(/<p><\/p>/g, '')
    .replace(/<li><\/li>/g, '')
    .replace(/(<ul>|<ol>)\s*(<\/ul>|<\/ol>)/g, '');
}

// ✨ ENHANCED SKILLS FORMATTING (Technical Skills, Functional Skills, Areas of Expertise)
async function formatSkillsContent(content: string, template: string): Promise<string> {
  console.log('🔧 Formatting skills content with comprehensive structure...');
  
  try {
    const lines = content.split('\n').filter(line => line.trim());
    let formattedHtml = '<div class="skills-section">';
    
    let currentCategory = '';
    let currentSkills: string[] = [];
    let currentSubItems: string[] = [];
    let isInSubSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for main category headers (bold text, all caps, numbered, or hash)
      if (trimmedLine.match(/^(\*\*.*\*\*|[A-Z][A-Z\s&]+:?$|^\d+\.\s*\*\*.*\*\*|^#{1,3}\s*)/)) {
        // Save previous category
        if (currentCategory && (currentSkills.length > 0 || currentSubItems.length > 0)) {
          formattedHtml += formatSkillCategory(currentCategory, currentSkills, currentSubItems);
          currentSkills = [];
          currentSubItems = [];
        }
        
        // Start new category
        currentCategory = trimmedLine
          .replace(/^#{1,3}\s*/, '')
          .replace(/^\d+\.\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/:$/, '')
          .trim();
        isInSubSection = false;
      } 
      // Check for sub-category headers (with dash or lower case starting)
      else if (trimmedLine.match(/^(-\s*\*\*.*\*\*|-\s*[A-Za-z].*:$|[a-z].*:$)/)) {
        // Save any pending sub-items
        if (currentSubItems.length > 0) {
          currentSkills.push(`<div class="skill-subcategory-items">${currentSubItems.join(', ')}</div>`);
          currentSubItems = [];
        }
        
        const subCategory = trimmedLine
          .replace(/^-\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/:$/, '')
          .trim();
        currentSkills.push(`<div class="skill-subheader"><strong>${subCategory}:</strong></div>`);
        isInSubSection = true;
      }
      // Regular skill items
      else if (trimmedLine.length > 0) {
        const skill = trimmedLine
          .replace(/^[•▸\-\*]\s*/, '')
          .replace(/\*\*/g, '')
          .trim();
        
        if (skill.length > 0) {
          if (isInSubSection) {
            currentSubItems.push(skill);
          } else {
            currentSkills.push(skill);
          }
        }
      }
    }
    
    // Add final category
    if (currentCategory && (currentSkills.length > 0 || currentSubItems.length > 0)) {
      formattedHtml += formatSkillCategory(currentCategory, currentSkills, currentSubItems);
    }
    
    // If no categories found, treat as single list
    if (!currentCategory && currentSkills.length === 0 && currentSubItems.length === 0) {
      const allSkills = lines.map(line => 
        line.replace(/^[•▸\-\*]\s*/, '').replace(/\*\*/g, '').trim()
      ).filter(skill => skill.length > 0);
      
      formattedHtml += `<div class="skill-items-grid">
        ${allSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>`;
    }
    
    formattedHtml += '</div>';
    console.log('✅ Skills content formatted with comprehensive structure');
    return formattedHtml;
    
  } catch (error) {
    console.error('❌ Error formatting skills content:', error);
    // Fallback: convert basic content
    const basicHtml = convertMarkdownToHTML(content);
    return `<div class="skills-section">${basicHtml}</div>`;
  }
}

// Helper function to format skill categories with enhanced visual structure
function formatSkillCategory(category: string, skills: string[], subItems: string[]): string {
  let categoryHtml = `<div class="skill-category">
    <h4 class="skill-category-title">${category}</h4>`;
  
  if (skills.length > 0) {
    // Check if skills contain HTML (sub-categories)
    const hasSubCategories = skills.some(skill => skill.includes('<div'));
    
    if (hasSubCategories) {
      categoryHtml += `<div class="skill-content">${skills.join('')}</div>`;
    } else {
      categoryHtml += `<div class="skill-items-grid">
        ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>`;
    }
  }
  
  if (subItems.length > 0) {
    categoryHtml += `<div class="skill-items-grid">
      ${subItems.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
    </div>`;
  }
  
  categoryHtml += '</div>';
  return categoryHtml;
}

// ✨ ENHANCED PROFESSIONAL EXPERIENCE FORMATTING
async function formatExperienceContent(content: string, template: string): Promise<string> {
  console.log('🔧 Formatting professional experience with comprehensive structure...');
  
  try {
    const lines = content.split('\n').filter(line => line.trim());
    let formattedHtml = '<div class="experience-section">';
    
    let currentExperience = '';
    let currentCompany = '';
    let currentRole = '';
    let currentDates = '';
    let currentSection = '';
    let currentItems: string[] = [];
    let isFirstExperience = true;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if it's a company/role line (contains company name and dates)
      if (trimmedLine.includes(' - ') && trimmedLine.match(/\d{4}/)) {
        // Save previous experience
        if (currentExperience && !isFirstExperience) {
          if (currentItems.length > 0) {
            formattedHtml += formatExperienceSubsection(currentSection, currentItems);
          }
          formattedHtml += '</div></div>'; // Close previous experience content and item
          currentItems = [];
        }
        
        // Parse new experience with enhanced parsing
        const cleanLine = trimmedLine.replace(/\*\*/g, '').trim();
        const parts = cleanLine.split(' - ');
        currentCompany = parts[0].trim();
        
        // Enhanced role and date parsing
        const roleAndDatePart = parts.slice(1).join(' - ').trim();
        const dateMatch = roleAndDatePart.match(/(\d{4}[-\/]\d{2}|\d{4})\s*[-–—]\s*(\d{4}[-\/]\d{2}|\d{4}|Present|Current)$/i);
        
        if (dateMatch) {
          currentDates = dateMatch[0];
          currentRole = roleAndDatePart.replace(dateMatch[0], '').trim();
        } else {
          // Fallback parsing
          const roleMatch = roleAndDatePart.match(/^(.+?)(?:\s+(\d{4}.*)|$)/);
          currentRole = roleMatch ? roleMatch[1].trim() : roleAndDatePart;
          currentDates = roleMatch && roleMatch[2] ? roleMatch[2] : '';
        }
        
        // Start new experience with enhanced header
        formattedHtml += `<div class="experience-item">
          <div class="experience-header">
            <div class="company-info">
              <h3 class="company-name">${currentCompany}</h3>
              <div class="role-title">${currentRole}</div>
            </div>
            <div class="experience-dates">${currentDates}</div>
          </div>
          <div class="experience-content">`;
        
        currentExperience = currentCompany;
        currentSection = 'Key Responsibilities';
        isFirstExperience = false;
      } 
      // Enhanced section header detection
      else if (trimmedLine.match(/^(\*\*.*\*\*|[A-Z][A-Za-z\s&]+:)$/)) {
        // Save previous section
        if (currentItems.length > 0) {
          formattedHtml += formatExperienceSubsection(currentSection, currentItems);
          currentItems = [];
        }
        
        // Start new section with enhanced recognition
        currentSection = trimmedLine
          .replace(/\*\*/g, '')
          .replace(/:$/, '')
          .trim();
      }
      // Enhanced item detection and categorization
      else if (trimmedLine.match(/^[•▸\-\*]\s*/) || (trimmedLine.length > 10 && currentExperience)) {
        const item = trimmedLine
          .replace(/^[•▸\-\*]\s*/, '')
          .replace(/\*\*/g, '')
          .trim();
        
        if (item && item.length > 3) {
          currentItems.push(item);
        }
      }
      // Handle multi-line content that might be part of previous item
      else if (trimmedLine.length > 0 && currentExperience && !trimmedLine.match(/^[A-Z][A-Z\s]+:?$/)) {
        const cleanItem = trimmedLine.replace(/\*\*/g, '').trim();
        if (cleanItem.length > 5) {
          currentItems.push(cleanItem);
        }
      }
    }
    
    // Close final sections and experience
    if (currentItems.length > 0) {
      formattedHtml += formatExperienceSubsection(currentSection, currentItems);
    }
    
    if (currentExperience) {
      formattedHtml += '</div></div>'; // Close final experience content and item
    }
    
    formattedHtml += '</div>';
    console.log('✅ Professional experience formatted with comprehensive structure');
    return formattedHtml;
    
  } catch (error) {
    console.error('❌ Error formatting experience content:', error);
    // Enhanced fallback
    const basicHtml = convertMarkdownToHTML(content);
    return `<div class="experience-section">${basicHtml}</div>`;
  }
}

// Helper function to format experience subsections with enhanced structure
function formatExperienceSubsection(sectionTitle: string, items: string[]): string {
  if (!sectionTitle || items.length === 0) return '';
  
  // Enhanced section type detection
  const sectionType = detectExperienceSection(sectionTitle);
  const sectionClass = `experience-subsection ${sectionType}`;
  
  let formattedItems = '';
  
  // Special formatting for different section types
  switch (sectionType) {
    case 'achievements':
      formattedItems = items.map(item => 
        `<li class="achievement-item">${item}</li>`
      ).join('');
      break;
      
    case 'technical-environment':
      formattedItems = items.map(item => 
        `<span class="tech-tag">${item}</span>`
      ).join('');
      return `<div class="${sectionClass}">
        <h5 class="subsection-title">${sectionTitle}</h5>
        <div class="tech-environment">${formattedItems}</div>
      </div>`;
      
    case 'responsibilities':
    default:
      formattedItems = items.map(item => 
        `<li class="responsibility-item">${item}</li>`
      ).join('');
      break;
  }
  
  return `<div class="${sectionClass}">
    <h5 class="subsection-title">${sectionTitle}</h5>
    <ul class="subsection-list">${formattedItems}</ul>
  </div>`;
}

// Helper function to detect experience section types
function detectExperienceSection(sectionTitle: string): string {
  const title = sectionTitle.toLowerCase();
  
  if (title.includes('achievement') || title.includes('accomplishment') || title.includes('result')) {
    return 'achievements';
  } else if (title.includes('technical') || title.includes('environment') || title.includes('technology') || title.includes('stack')) {
    return 'technical-environment';
  } else if (title.includes('responsibility') || title.includes('duties') || title.includes('role')) {
    return 'responsibilities';
  } else {
    return 'general';
  }
}

function formatEducationContent(content: string): string {
  console.log('🔧 Formatting education content...');
  
  const lines = content.split('\n').filter(line => line.trim());
  let formattedHtml = '<div class="education-section">';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Clean the line of markdown syntax
    const cleanLine = trimmedLine
      .replace(/^[•▸\-\*]\s*/, '')
      .replace(/\*\*/g, '')
      .trim();
    
    if (cleanLine.length > 0) {
      formattedHtml += `<div class="education-item">
        <p>${cleanLine}</p>
      </div>`;
    }
  }
  
  formattedHtml += '</div>';
  console.log('✅ Education content formatted successfully');
  return formattedHtml;
}

// ✨ ENHANCED STATIC CONTENT FORMATTING (Certifications, Languages)
function formatStaticContent(content: string, template: string): string {
  console.log('🔧 Formatting static content with enhanced structure...');
  
  const lines = content.split('\n').filter(line => line.trim());
  let formattedHtml = '<div class="static-section">';
  
  // Check if content has categories or is just a list
  const hasCategories = lines.some(line => 
    line.match(/^(###|##|\*\*.*\*\*|[A-Z][A-Z\s&]+:?$)/)
  );
  
  // Detect content type for special formatting
  const contentType = detectStaticContentType(content);
  
  if (hasCategories) {
    let currentCategory = '';
    let currentItems: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for category headers
      if (trimmedLine.match(/^(###|##|\*\*.*\*\*|[A-Z][A-Z\s&]+:?$)/)) {
        // Save previous category
        if (currentCategory && currentItems.length > 0) {
          formattedHtml += formatStaticCategory(currentCategory, currentItems, contentType);
          currentItems = [];
        }
        
        // Start new category
        currentCategory = trimmedLine
          .replace(/^#{1,3}\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/:$/, '')
          .trim();
      } else if (trimmedLine.length > 0) {
        // Add item
        const item = trimmedLine
          .replace(/^[•▸\-\*]\s*/, '')
          .replace(/\*\*/g, '')
          .trim();
        if (item.length > 0) {
          currentItems.push(item);
        }
      }
    }
    
    // Add final category
    if (currentCategory && currentItems.length > 0) {
      formattedHtml += formatStaticCategory(currentCategory, currentItems, contentType);
    }
  } else {
    // No categories, just format as single list
    const items = lines.map(line => 
      line.replace(/^[•▸\-\*]\s*/, '').replace(/\*\*/g, '').trim()
    ).filter(item => item.length > 0);
    
    if (contentType === 'certifications') {
      formattedHtml += `<div class="certification-badges">
        ${items.map(item => formatCertificationItem(item)).join('')}
      </div>`;
    } else if (contentType === 'languages') {
      formattedHtml += `<div class="language-list">
        ${items.map(item => formatLanguageItem(item)).join('')}
      </div>`;
    } else {
      formattedHtml += `<div class="static-items">
        ${items.map(item => `<span class="static-item">${item}</span>`).join('')}
      </div>`;
    }
  }
  
  formattedHtml += '</div>';
  console.log('✅ Static content formatted with enhanced structure');
  return formattedHtml;
}

// Helper function to detect static content type
function detectStaticContentType(content: string): string {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('certification') || contentLower.includes('certified') || 
      contentLower.includes('license') || contentLower.includes('credential')) {
    return 'certifications';
  } else if (contentLower.includes('language') || contentLower.includes('english') || 
             contentLower.includes('french') || contentLower.includes('spanish') ||
             contentLower.includes('native') || contentLower.includes('fluent') ||
             contentLower.includes('professional') || contentLower.includes('conversational')) {
    return 'languages';
  } else {
    return 'general';
  }
}

// Helper function to format static categories based on content type
function formatStaticCategory(category: string, items: string[], contentType: string): string {
  let categoryHtml = `<div class="static-category ${contentType}">
    <h4 class="static-category-title">${category}</h4>`;
  
  if (contentType === 'certifications') {
    categoryHtml += `<div class="certification-badges">
      ${items.map(item => formatCertificationItem(item)).join('')}
    </div>`;
  } else if (contentType === 'languages') {
    categoryHtml += `<div class="language-list">
      ${items.map(item => formatLanguageItem(item)).join('')}
    </div>`;
  } else {
    categoryHtml += `<div class="static-items">
      ${items.map(item => `<span class="static-item">${item}</span>`).join('')}
    </div>`;
  }
  
  categoryHtml += '</div>';
  return categoryHtml;
}

// Enhanced certification formatting with badge-style elements
function formatCertificationItem(item: string): string {
  // Parse certification with optional provider/date
  const certMatch = item.match(/^(.+?)(?:\s*[-–—]\s*(.+?))?(?:\s*\((.+?)\))?$/);
  
  if (certMatch) {
    const certName = certMatch[1].trim();
    const provider = certMatch[2] ? certMatch[2].trim() : '';
    const dateOrLevel = certMatch[3] ? certMatch[3].trim() : '';
    
    return `<div class="certification-badge">
      <div class="cert-name">${certName}</div>
      ${provider ? `<div class="cert-provider">${provider}</div>` : ''}
      ${dateOrLevel ? `<div class="cert-date">${dateOrLevel}</div>` : ''}
    </div>`;
  } else {
    return `<div class="certification-badge">
      <div class="cert-name">${item}</div>
    </div>`;
  }
}

// Enhanced language formatting with professional display
function formatLanguageItem(item: string): string {
  // Parse language with level (French - Native, English - Professional, etc.)
  const langMatch = item.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  
  if (langMatch) {
    const language = langMatch[1].trim();
    const level = langMatch[2].trim();
    
    // Determine level class for styling
    const levelClass = getLevelClass(level);
    
    return `<div class="language-item ${levelClass}">
      <span class="language-name">${language}</span>
      <span class="language-level">${level}</span>
    </div>`;
  } else {
    return `<div class="language-item">
      <span class="language-name">${item}</span>
    </div>`;
  }
}

// Helper function to get CSS class for language proficiency level
function getLevelClass(level: string): string {
  const levelLower = level.toLowerCase();
  
  if (levelLower.includes('native') || levelLower.includes('mother tongue')) {
    return 'level-native';
  } else if (levelLower.includes('fluent') || levelLower.includes('advanced')) {
    return 'level-fluent';
  } else if (levelLower.includes('professional') || levelLower.includes('business')) {
    return 'level-professional';
  } else if (levelLower.includes('intermediate')) {
    return 'level-intermediate';
  } else if (levelLower.includes('basic') || levelLower.includes('elementary')) {
    return 'level-basic';
  } else {
    return 'level-general';
  }
}

async function applyGeneralFormatting(content: string): Promise<string> {
  console.log('🔧 Applying general formatting...');
  
  // Convert markdown to HTML
  const htmlContent = convertMarkdownToHTML(content);
  
  console.log('✅ General formatting applied successfully');
  return `<div class="general-content">${htmlContent}</div>`;
}

// Main formatting pipeline
async function formatContentForPDF(
  segments: SegmentContent[], 
  candidateData: unknown, 
  template: string = 'professional-classic',
  jobDescription?: unknown
): Promise<SegmentContent[]> {
  console.log('🎯 STEP 4: Applying 5-step formatting pipeline...');
  
  // Step 1: Structure segments
  const structuredSegments = structureSegments(segments, candidateData, template);
  
  // Step 2-3: Clean and format content
  const formattedSegments: SegmentContent[] = [];
  
  for (const segment of structuredSegments) {
    try {
      console.log(`📝 Processing segment: ${segment.title}`);
      
      // Step 2: Clean content
      const cleanedContent = cleanAndNormalizeContent(segment.content, segment.formatting);
      
      // Step 3: Apply semantic formatting with OpenAI API
      const formattedContent = await applySemanticFormatting(cleanedContent, segment.type, template, candidateData, jobDescription);
      
      formattedSegments.push({
        id: `formatted_${segment.order}`,
        type: segment.type,
        title: segment.title,
        content: formattedContent,
        order: segment.order
      });
      
      console.log(`✅ Formatted segment: ${segment.title}`);
    } catch (error) {
      console.error(`❌ Error formatting segment ${segment.title}:`, error);
      // Fallback to original content
      formattedSegments.push({
        id: `fallback_${segment.order}`,
        type: segment.type,
        title: segment.title,
        content: segment.content,
        order: segment.order
      });
    }
  }
  
  console.log(`✅ Completed formatting pipeline: ${formattedSegments.length} segments processed`);
  return formattedSegments;
}

// 🏗️ STEP 4: ENHANCED HTML GENERATION with modular structure
function generateHTMLFromSegments(segments: SegmentContent[], candidateData: { fullName: string; currentTitle: string; email: string; phone: string; location: string; yearsOfExperience: number; }, template: string = 'professional-classic'): string {
  const headerData = {
    fullName: candidateData.fullName,
    currentTitle: candidateData.currentTitle,
    // Do not expose PII in header
    email: '',
    phone: '',
    location: '',
    yearsOfExperience: candidateData.yearsOfExperience
  };
  
  const styles = getTemplateStyles(template);
  
  const sectionsHTML = segments
    .filter(segment => segment.content && segment.content.trim() !== '')
    .sort((a, b) => a.order - b.order)
    .map(segment => {
      if (segment.title.toUpperCase().includes('HEADER') || segment.title.toUpperCase().includes('NAME')) {
        return '';
      }
      
      return `
        <section class="content-section" data-section-type="${segment.type}">
          <h2 class="section-title">${segment.title}</h2>
          <div class="section-content">
            ${segment.content}
          </div>
        </section>
      `;
    })
    .filter(Boolean)
    .join('');
  
  const headerHTML = `
    <header class="document-header">
      <div class="candidate-info">
        <h1 class="candidate-name">${headerData.fullName}</h1>
        <div class="candidate-title">${headerData.currentTitle}</div>
        <div class="contact-info"></div>
      </div>
    </header>
  `;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headerData.fullName} - Professional Competence File</title>
      <style>
        ${styles}
      </style>
    </head>
    <body>
      <div class="competence-document ${template}-template">
        ${headerHTML}
        <main class="document-content">
          ${sectionsHTML}
        </main>
      </div>
    </body>
    </html>
  `;
}

// 🎨 STEP 5: ENHANCED TEMPLATE STYLES with comprehensive structured formatting
function getTemplateStyles(template: string): string {
  const baseStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 8px;
      line-height: 1.6;
      color: #232629;
      background: white;
    }
    
    .competence-document {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px;
      background: white;
    }
    
    /* ===== HEADER STYLES ===== */
    .document-header {
      text-align: center;
      border-bottom: 1px solid #333333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .candidate-name {
      font-size: 20px;
      font-weight: 700;
      color: #333333;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    
    .candidate-title {
      font-size: 8px;
      font-weight: 500;
      color: #666666;
      margin-bottom: 15px;
    }
    
    .contact-info {
      font-size: 8px;
      color: #777777;
    }
    
    .contact-row {
      margin: 4px 0;
    }
    
    .contact-item {
      margin: 0 15px;
      font-weight: 400;
    }
    
    .contact-item:first-child {
      margin-left: 0;
    }
    
    .contact-item:last-child {
      margin-right: 0;
    }
    
    /* ===== SECTION HEADERS ===== */
    .section-title {
      font-size: 8px;
      font-weight: 600;
      color: #333333;
      padding: 8px 0;
      margin: 20px 0 15px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .content-section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-content {
      padding: 0 5px;
    }
    
    /* ===== PROFESSIONAL SUMMARY STYLES ===== */
    .summary-section {
      margin-bottom: 20px;
    }
    
    .summary-paragraph {
      margin-bottom: 12px;
      font-size: 8px;
      line-height: 1.7;
      text-align: justify;
      color: #444444;
    }
    
    .summary-opening {
      font-weight: 500;
    }
    
    /* ===== SIMPLIFIED SKILLS STYLES ===== */
    .skills-section {
      margin-bottom: 25px;
    }

    /* NEW: Enhanced Skills Category Structure */
    .skills-category {
      margin-bottom: 20px;
      page-break-inside: avoid;
      border-left: 4px solid #FFB800;
      padding-left: 16px;
      background: #fefefe;
      padding: 12px 16px;
      border-radius: 4px;
    }

    .skills-subtitle {
      font-size: 8px;
      font-weight: 600;
      color: #073C51;
      margin-bottom: 8px;
      margin-top: 0;
    }

    .skills-list {
      list-style: none;
      padding: 0;
      margin: 0 0 8px 0;
    }

    .skill-item {
      color: #FFB800;
      font-weight: 500;
      margin-bottom: 4px;
      font-size: 8px;
      line-height: 1.4;
    }

    .skill-item::before {
      content: "●";
      color: #FFB800;
      font-weight: bold;
      margin-right: 8px;
    }

    .skills-description {
      font-style: italic;
      color: #666666;
      font-size: 8px;
      margin: 8px 0 0 0;
      line-height: 1.3;
    }

    /* LEGACY: Original skill styles for backward compatibility */
    .skill-category {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    
    .skill-category-title {
      font-size: 8px;
      font-weight: 600;
      color: #333333;
      margin-bottom: 8px;
    }
    
    .skill-items-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }
    
    .skill-tag {
      background: #f5f5f5;
      color: #333333;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 500;
      border: 1px solid #e0e0e0;
      display: inline-block;
      margin: 2px;
      white-space: nowrap;
    }
    
    .skill-content {
      margin-bottom: 12px;
    }
    
    .skill-subheader {
      font-weight: 600;
      color: #555555;
      margin: 6px 0 4px 0;
      font-size: 8px;
    }
    
    .skill-subcategory-items {
      margin-left: 12px;
      color: #666666;
    }
    
    /* ===== SIMPLIFIED PROFESSIONAL EXPERIENCE STYLES ===== */
    .experience-section {
      margin-bottom: 25px;
    }
    
    .experience-item {
      margin-bottom: 20px;
      page-break-inside: avoid;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .experience-header {
      background: #f8f8f8;
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-name {
      font-size: 8px;
      font-weight: 600;
      color: #333333;
      margin-bottom: 4px;
    }
    
    .role-title {
      font-size: 8px;
      font-weight: 500;
      color: #666666;
    }
    
    .experience-dates {
      font-size: 8px;
      font-weight: 500;
      color: #777777;
      background: #ffffff;
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      white-space: nowrap;
    }
    
    .experience-content {
      padding: 16px;
    }
    
    .experience-subsection {
      margin-bottom: 14px;
    }
    
    .subsection-title {
      font-size: 8px;
      font-weight: 600;
      color: #333333;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .subsection-list {
      margin-left: 16px;
      margin-bottom: 12px;
    }
    
    .responsibility-item, .achievement-item {
      margin-bottom: 6px;
      font-size: 8px;
      line-height: 1.5;
      color: #444444;
    }
    
    .achievement-item {
      color: #333333;
      font-weight: 500;
    }
    
    .tech-tag {
      background: #f0f0f0;
      color: #555555;
      padding: 3px 6px;
      border-radius: 3px;
      font-size: 8px;
      font-weight: 500;
      border: 1px solid #ddd;
      white-space: nowrap;
    }

    /* ===== NEW ENHANCED EXPERIENCE STYLES ===== */
    .experience-entry {
      margin-bottom: 25px;
      page-break-inside: avoid;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
      background: white;
    }

    .company-header {
      background: #f8f9fa;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .experience-entry .company-name {
      font-size: 8px;
      font-weight: 600;
      color: #073C51;
      margin: 0 0 4px 0;
    }

    .experience-entry .role-title {
      font-size: 8px;
      font-weight: 500;
      color: #FFB800;
      margin: 0 0 4px 0;
    }

    .duration {
      font-size: 8px;
      color: #666666;
      margin: 0;
    }

    .role-overview,
    .responsibilities,
    .achievements,
    .technical-environment {
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .role-overview:last-child,
    .responsibilities:last-child,
    .achievements:last-child,
    .technical-environment:last-child {
      border-bottom: none;
    }

    .role-overview h5,
    .responsibilities h5,
    .achievements h5,
    .technical-environment h5 {
      font-size: 8px;
      font-weight: 600;
      color: #073C51;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .role-overview p {
      font-size: 8px;
      line-height: 1.4;
      color: #555555;
      margin: 0;
    }

    .responsibilities ul,
    .achievements ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .responsibilities li,
    .achievements li {
      font-size: 8px;
      line-height: 1.4;
      color: #555555;
      margin-bottom: 4px;
      padding-left: 12px;
      position: relative;
    }

    .responsibilities li::before,
    .achievements li::before {
      content: "●";
      color: #FFB800;
      font-weight: bold;
      position: absolute;
      left: 0;
      top: 0;
    }

    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tech-tag.enhanced {
      background: #f0f8ff;
      color: #073C51;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 8px;
      font-weight: 500;
      border: 1px solid #d0e7ff;
      white-space: nowrap;
    }
    
    /* ===== SIMPLIFIED EXPERIENCES SUMMARY STYLES ===== */
    .experience-summary-section {
      margin-bottom: 25px;
    }
    
    .summary-overview {
      margin-bottom: 16px;
    }
    
    .summary-experience-item {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    
    .summary-experience-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .summary-company {
      font-weight: 600;
      color: #333333;
      font-size: 8px;
    }
    
    .summary-role-dates {
      font-size: 8px;
      color: #777777;
      font-weight: 500;
      background: #ffffff;
      padding: 4px 6px;
      border-radius: 3px;
      border: 1px solid #ddd;
    }
    
    .summary-highlights {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    
    .summary-highlight {
      font-size: 8px;
      color: #555555;
      line-height: 1.4;
    }
    
    /* ===== SIMPLIFIED CERTIFICATION STYLES ===== */
    .certification-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .certification-badge {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 10px 12px;
      min-width: 180px;
      text-align: center;
    }
    
    .cert-name {
      font-weight: 600;
      color: #333333;
      font-size: 8px;
      margin-bottom: 4px;
    }
    
    .cert-provider {
      font-size: 8px;
      color: #666666;
      font-weight: 500;
      margin-bottom: 2px;
    }
    
    .cert-date {
      font-size: 8px;
      color: #777777;
    }
    
    /* ===== SIMPLIFIED LANGUAGE STYLES ===== */
    .language-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 15px;
    }
    
    .language-item {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 120px;
    }
    
    .language-name {
      font-weight: 600;
      color: #333333;
      font-size: 8px;
    }
    
    .language-level {
      font-size: 8px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 3px;
      color: white;
      background: #666666;
    }
    
    /* ===== SIMPLIFIED EDUCATION STYLES ===== */
    .education-section {
      margin-bottom: 20px;
    }
    
    .education-item {
      background: #f8f8f8;
      border-left: 3px solid #333333;
      padding: 10px 14px;
      margin-bottom: 8px;
      border-radius: 0 4px 4px 0;
    }
    
    .education-item p {
      margin: 0;
      font-size: 8px;
      line-height: 1.4;
      color: #444444;
    }
    
    /* ===== SIMPLIFIED STATIC CONTENT STYLES ===== */
    .static-section {
      margin-bottom: 20px;
    }
    
    .static-category {
      margin-bottom: 14px;
    }
    
    .static-category-title {
      font-size: 8px;
      font-weight: 600;
      color: #333333;
      margin-bottom: 8px;
    }
    
    .static-items {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .static-item {
      background: #f5f5f5;
      color: #444444;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 500;
      border: 1px solid #e0e0e0;
    }
    
    /* ===== GENERAL CONTENT STYLES ===== */
    .general-content {
      margin-bottom: 20px;
    }
    
    .general-content p {
      margin-bottom: 10px;
      font-size: 8px;
      line-height: 1.5;
      color: #444444;
    }
    
    .general-content ul {
      margin-left: 16px;
      margin-bottom: 12px;
    }
    
    .general-content li {
      margin-bottom: 4px;
      font-size: 8px;
      line-height: 1.4;
      color: #444444;
    }
    
    /* ===== PRINT OPTIMIZATION ===== */
    @media print {
      .competence-document {
        padding: 15px;
        max-width: none;
      }
      
      .section-title {
        color: #333333 !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      
      .experience-item,
      .skill-category,
      .certification-badge {
        page-break-inside: avoid;
      }
      
      .skill-tag,
      .tech-tag,
      .certification-badge,
      .language-item {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
  `;

  // Template-specific styles - enhanced
  if (template === 'antaes') {
    return baseStyles + `
      /* Antaes Template - Professional Clean Design */
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.6;
        color: #2c3e50;
        background: #ffffff;
        font-size: 8px;
        margin: 0;
        padding: 0;
      }
      
      .competence-document {
        max-width: 210mm;
        margin: 0 auto;
        background: white;
        min-height: 297mm;
        padding: 25mm 20mm;
        position: relative;
      }
      
      /* Header - Clean Professional Layout */
      .document-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #2c3e50;
      }
      
      .candidate-info {
        flex: 1;
      }
      
      .candidate-name {
        font-size: 26px;
        font-weight: 700;
        color: #2c3e50;
        margin: 0 0 8px 0;
        letter-spacing: -0.3px;
      }
      
      .candidate-title {
        font-size: 8px;
        font-weight: 600;
        color: #e67e22;
        margin-bottom: 12px;
      }
      
      .contact-info {
        font-size: 8px;
        color: #7f8c8d;
        line-height: 1.5;
      }
      
      .contact-row {
        margin-bottom: 4px;
      }
      
      .contact-item {
        margin-right: 15px;
        font-weight: 500;
      }
      
      /* Section Styling - Clean and Organized */
      .section {
        margin-bottom: 24px;
        page-break-inside: avoid;
        position: relative;
      }
      
      .section-title {
        font-size: 8px;
        font-weight: 700;
        color: #2c3e50;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 15px;
        padding-bottom: 6px;
        border-bottom: 1px solid #2c3e50;
      }

      /* Blue open bracket for sections with bracketClass */
      .section.has-bracket:before {
        content: "";
        position: absolute;
        left: -6px;
        top: 8px;
        width: 10px;
        height: 22px;
        border-left: 4px solid #2c3e50;
        border-top: 4px solid #2c3e50;
        border-bottom: 4px solid #2c3e50;
        border-right: none;
        border-radius: 6px 0 0 6px;
      }
      
      .section-content {
        font-size: 8px;
        line-height: 1.6;
        color: #34495e;
      }
      
      /* Skills Section - Organized Categories */
      .skills-section {
        margin: 15px 0;
      }
      
      .skills-category {
        margin-bottom: 18px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 4px solid #e67e22;
      }
      
      .skills-subtitle {
        font-size: 8px;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .skills-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }
      
      .skill-tag {
        display: inline-block;
        background: #ecf0f1;
        color: #2c3e50;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 8px;
        font-weight: 600;
        border: 1px solid #bdc3c7;
        white-space: nowrap;
      }

      /* Technical environment chips */
      .technical-environment-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 6px;
      }

      .tech-tag {
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        background: #ecf3f8;
        border-radius: 14px;
        font-weight: 600;
        color: #2c3e50;
        font-size: 8px;
        border: 1px solid #c8d9e6;
        position: relative;
        padding-left: 22px;
        white-space: nowrap;
      }

      .tech-tag:before {
        content: "";
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 6px;
        height: 6px;
        background: #2c3e50;
        border-radius: 50%;
      }
      
      /* Experience Section - Professional Format */
      .experience-block {
        margin-bottom: 25px;
        padding: 18px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 4px solid #2c3e50;
        page-break-inside: avoid;
        position: relative;
      }

      /* Blue open bracket decoration */
      .experience-block:before {
        content: "";
        position: absolute;
        left: -6px;
        top: 14px;
        width: 10px;
        height: 22px;
        border-left: 4px solid #2c3e50;
        border-top: 4px solid #2c3e50;
        border-bottom: 4px solid #2c3e50;
        border-right: none;
        border-radius: 6px 0 0 6px;
      }
      
      .company-name {
        font-size: 15px;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 3px;
      }
      
      .job-title {
        font-size: 8px;
        font-weight: 600;
        color: #e67e22;
        margin-bottom: 6px;
      }
      
      .job-dates {
        font-size: 8px;
        color: #7f8c8d;
        font-weight: 600;
        margin-bottom: 12px;
      }
      
      .experience-content ul {
        list-style: none;
        padding-left: 0;
        margin: 10px 0;
      }
      
      .experience-content li {
        position: relative;
        padding-left: 18px;
        margin-bottom: 6px;
        line-height: 1.5;
        color: #34495e;
      }
      
      .experience-content li:before {
        content: "•";
        color: #e67e22;
        font-weight: bold;
        position: absolute;
        left: 0;
        top: 0;
      }
      
      /* Bullet Point Lists */
      .section-content ul {
        list-style: none;
        padding-left: 0;
        margin: 12px 0;
      }
      
      .section-content li {
        position: relative;
        padding-left: 18px;
        margin-bottom: 6px;
        line-height: 1.5;
        color: #34495e;
      }
      
      .section-content li:before {
        content: "•";
        color: #e67e22;
        font-weight: bold;
        position: absolute;
        left: 0;
        top: 0;
      }
      
      /* Typography Enhancements */
      .section-content strong {
        font-weight: 700;
        color: #2c3e50;
      }
      
      .section-content em {
        font-style: italic;
        color: #7f8c8d;
      }
      
      /* Print Optimization */
      @media print {
        body { 
          font-size: 8px;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        .competence-document { 
          max-width: none; 
          margin: 0; 
          padding: 15mm;
        }
        .section { 
          page-break-inside: avoid; 
        }
        .experience-block {
          page-break-inside: avoid;
        }
      }
      
      /* Mobile Responsiveness */
      @media (max-width: 768px) {
        .document-header { 
          flex-direction: column; 
          gap: 15px;
        }
        .candidate-name { 
          font-size: 22px; 
        }
        .section-title { 
          font-size: 8px; 
        }
      }
    `;
  } else {
    return baseStyles + `
      /* Professional Classic Template Specific Styles */
      .candidate-name {
        color: #333333;
      }
      
      .section-title {
        color: #333333;
        border-bottom-color: #e0e0e0;
      }
      
      .document-header {
        border-bottom-color: #333333;
      }
    `;
  }

  // Emineon specific styling to match reference design
  if (template === 'emineon') {
    const primary = '#073C51';
    const accent = '#FFB800';
    return baseStyles + `
      .document-header { border-bottom: 1px solid ${primary}; }
      .candidate-name { color: ${primary}; }
      .candidate-title { color: ${accent}; font-weight: 700; }
      .section-title { color: ${primary}; border-bottom: 1px solid ${primary}; font-weight: 800; }

      /* Grey card with blue open bracket */
      .experience-item, .summary-experience-item, .education-item, .static-item {
        background: #f5f7fa;
        border: 1px solid #e2e8f0;
        border-left: 4px solid ${primary};
        border-radius: 8px;
        position: relative;
      }
      .experience-item:before, .summary-experience-item:before, .education-item:before, .skills-category:before {
        content: "";
        position: absolute; left: -6px; top: 14px; width: 10px; height: 22px;
        border-left: 4px solid ${primary}; border-top: 4px solid ${primary}; border-bottom: 4px solid ${primary};
        border-right: none; border-radius: 6px 0 0 6px;
      }

      .company-name { color: ${primary}; font-weight: 700; }
      .role-title { color: ${accent}; font-weight: 700; }

      /* Yellow bullet lists */
      .responsibilities li::before, .achievements li::before { color: ${accent}; }

      /* Pill tags with yellow dot */
      .tech-tag, .skill-tag, .static-item { 
        background: #eef4f8; color: ${primary}; border-radius: 999px; padding: 4px 10px; border: 1px solid #d1d9e0; 
      }
      .tech-tag { position: relative; padding-left: 18px; }
      .tech-tag:before { content:""; position:absolute; left:8px; width:6px; height:6px; background:${accent}; border-radius:50%; }
    `;
  }
}

// Helper function to convert segments to sections format
function convertSegmentsToSections(segments: SegmentContent[], candidateData: any): any[] {
  return segments.map((segment, index) => ({
    key: segment.type,
    label: segment.title,
    show: true,
    order: segment.order || index + 1,
    content: segment.content
  }));
}

// NEW: Enhanced Antaes HTML generator using processed segments
async function generateAntaesHTMLFromSegments(segments: SegmentContent[], candidateData: any, jobDescription?: any, managerContact?: any): Promise<string> {
  console.log('🎨 Generating Antaes HTML with processed segments');
  
  // Group segments by type for easy access
  const segmentMap = new Map<string, SegmentContent>();
  segments.forEach(segment => {
    segmentMap.set(segment.type.toLowerCase(), segment);
  });

  // Extract header data
  const headerData = {
    fullName: candidateData.fullName || 'Professional',
    currentTitle: candidateData.currentTitle || 'Consultant',
    yearsOfExperience: candidateData.yearsOfExperience || 'Multiple',
    location: candidateData.location || '',
    email: candidateData.email || '',
    phone: candidateData.phone || ''
  };

  // Generate sections HTML using processed content with beautiful formatting
  const sectionsHTMLPromises = segments
    .sort((a, b) => a.order - b.order)
    .map(async segment => {
      const sectionClass = `section-${segment.type.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Transform content to beautiful HTML based on segment type
      const beautifulContent = await transformContentToBeautifulHTML(segment.content, segment.type, candidateData);
      const bracketClass = segment.type.toLowerCase().includes('experience') ? ' has-bracket' : '';
      
      return `
        <div class="section ${sectionClass}${bracketClass}" id="${segment.type.toLowerCase()}">
          <h2 class="section-title">${segment.title.toUpperCase()}</h2>
          <div class="section-content">
            ${beautifulContent}
          </div>
        </div>
      `;
    });
  
  const sectionsHTML = (await Promise.all(sectionsHTMLPromises)).join('');

  // Complete Antaes template with processed content
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${headerData.fullName} - Competence File</title>
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
            font-size: 8px;
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
            font-size: 28px;
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
            font-size: 8px;
            font-weight: 500;
            color: #444B54;
            margin-bottom: 12px;
          }
          
          .location-info {
            font-size: 8px;
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
            font-size: 8px;
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
            font-size: 15px;
            font-weight: 700;
            color: #073C51;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid #073C51;
          }
          
          .section-content {
            font-size: 8px;
            line-height: 1.7;
          }
          
          /* Enhanced Content Formatting for Processed Content */
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
          
          /* Beautiful Content Formatting */
          .skills-container {
            margin: 12px 0;
          }
          
          .skills-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          }
          
          /* Legacy skill-item styles - replaced by new skills-section styles below */
          .skills-list .skill-item {
            position: relative;
            padding: 8px 12px 8px 24px;
            margin: 0;
            background: #f8f9fb;
            border-left: 3px solid #FFB800;
            border-radius: 4px;
            line-height: 1.4;
            font-size: 8px;
            font-weight: 500;
          }
          
          .skills-list .skill-item:before {
            content: "•";
            color: #FFB800;
            font-weight: bold;
            position: absolute;
            left: 8px;
            top: 8px;
          }
          
          /* Ensure certifications don't render under education lists */
          .education-section .certification-badge { display: none; }

          /* Print Optimization */
          @media print {
            body { 
              font-size: 8px; 
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
            .logo-image {
              opacity: 1 !important;
              visibility: visible !important;
              display: block !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background: transparent !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- ANTAES LOGO - Centered Above Header -->
          <div style="width:100%;text-align:center;margin-bottom:10px;">
            <img src="https://res.cloudinary.com/emineon/image/upload/f_auto,q_auto,c_fit,w_200,h_100/Antaes_logo" alt="ANTAES" style="height:60px;width:auto;display:inline-block;" />
          </div>
          <!-- HEADER - Content on left, logo on right -->
          <div class="header">
            <div class="header-content">
              <h1>${headerData.fullName}</h1>
              <div class="header-role">${headerData.currentTitle}</div>
              ${managerContact && (managerContact.name || managerContact.email || managerContact.phone) ? `
                <div class="manager-contact" style="margin-top:6px; font-size:12px; color:#475569; line-height:1.4;">
                  <div class="manager-label" style="font-weight:600; color:#334155; text-transform:uppercase; letter-spacing:.5px; margin-bottom:2px;">Manager Details</div>
                  ${managerContact.name ? `<div><span style=\"font-weight:600; color:#1f2937;\">Manager:</span> ${managerContact.name}</div>` : ''}
                  ${managerContact.email ? `<div><span style=\"font-weight:600; color:#1f2937;\">Email:</span> ${managerContact.email}</div>` : ''}
                  ${managerContact.phone ? `<div><span style=\"font-weight:600; color:#1f2937;\">Phone:</span> ${managerContact.phone}</div>` : ''}
                </div>
              ` : ''}
            </div>
            <div class="header-logo">
              <img src="https://res.cloudinary.com/emineon/image/upload/f_auto,q_auto,c_fit,w_200,h_100/Antaes_logo" 
                   alt="ANTAES" 
                   class="logo-image" 
                   style="width: 150px; height: 80px; object-fit: contain; display: block !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; opacity: 1 !important; visibility: visible !important; background: transparent !important;" 
                   onload="this.style.opacity='1';" />
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
            ${sectionsHTML}
          </div>
        </div>
      </body>
    </html>
  `;
}

// ✨ PROFESSIONAL EXPERIENCES SUMMARY FORMATTING
async function formatExperienceSummaryContent(content: string, template: string): Promise<string> {
  console.log('🔧 Formatting professional experiences summary...');
  
  try {
    const lines = content.split('\n').filter(line => line.trim());
    let formattedHtml = '<div class="experience-summary-section">';
    
    // Check if content has multiple experiences or is a general summary
    const hasMultipleExperiences = lines.some(line => 
      line.includes(' - ') && line.match(/\d{4}/)
    );
    
    if (hasMultipleExperiences) {
      // Format as condensed experience list
      let currentExperience = '';
      let currentDetails: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.includes(' - ') && trimmedLine.match(/\d{4}/)) {
          // Save previous experience
          if (currentExperience) {
            formattedHtml += formatSummaryExperienceItem(currentExperience, currentDetails);
            currentDetails = [];
          }
          
          // Parse new experience
          const cleanLine = trimmedLine.replace(/\*\*/g, '').trim();
          const parts = cleanLine.split(' - ');
          const company = parts[0].trim();
          const roleAndDates = parts.slice(1).join(' - ').trim();
          
          currentExperience = `${company} - ${roleAndDates}`;
        } else if (trimmedLine.length > 0) {
          // Add detail line
          const detail = trimmedLine
            .replace(/^[•▸\-\*]\s*/, '')
            .replace(/\*\*/g, '')
            .trim();
          if (detail.length > 3) {
            currentDetails.push(detail);
          }
        }
      }
      
      // Add final experience
      if (currentExperience) {
        formattedHtml += formatSummaryExperienceItem(currentExperience, currentDetails);
      }
    } else {
      // Format as general summary paragraphs
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
      
      if (paragraphs.length > 0) {
        formattedHtml += '<div class="summary-overview">';
        paragraphs.forEach((paragraph, index) => {
          const cleanParagraph = convertMarkdownToHTML(paragraph.trim());
          const summaryClass = index === 0 ? 'summary-opening' : '';
          formattedHtml += `<p class="summary-paragraph ${summaryClass}">${cleanParagraph}</p>`;
        });
        formattedHtml += '</div>';
      } else {
        // Single paragraph
        const cleanContent = convertMarkdownToHTML(content);
        formattedHtml += `<div class="summary-overview">
          <p class="summary-paragraph summary-opening">${cleanContent}</p>
        </div>`;
      }
    }
    
    formattedHtml += '</div>';
    console.log('✅ Professional experiences summary formatted successfully');
    return formattedHtml;
    
  } catch (error) {
    console.error('❌ Error formatting experience summary:', error);
    const basicHtml = convertMarkdownToHTML(content);
    return `<div class="experience-summary-section">${basicHtml}</div>`;
  }
}

// Helper function to format condensed experience items for summary
function formatSummaryExperienceItem(experienceHeader: string, details: string[]): string {
  const [company, roleAndDates] = experienceHeader.split(' - ');
  
  let summaryHtml = `<div class="summary-experience-item">
    <div class="summary-experience-header">
      <span class="summary-company">${company}</span>
      <span class="summary-role-dates">${roleAndDates}</span>
    </div>`;
  
  if (details.length > 0) {
    // Show only key highlights (max 3 items)
    const highlights = details.slice(0, 3);
    summaryHtml += `<div class="summary-highlights">
      ${highlights.map(detail => `<span class="summary-highlight">• ${detail}</span>`).join('')}
    </div>`;
  }
  
  summaryHtml += '</div>';
  return summaryHtml;
}

// AI-powered content formatting for PDF generation - temporarily disabled
async function formatContentWithAI(content: string, sectionType: string, candidateData?: any): Promise<string | null> {
  // Temporarily disabled to fix URL parsing errors in server environment
  // Falls back to direct content processing which works well
  console.log(`🔧 AI formatting disabled for ${sectionType}, using direct processing`);
  return null;
}

// Enhanced content transformation for beautiful PDF formatting
async function transformContentToBeautifulHTML(content: string, segmentType: string, candidateData?: any): Promise<string> {
  if (!content || content.trim() === '') {
    return '<p>No content available</p>';
  }

  // Clean the content first (remove only script/style tags, keep formatting)
  const cleanContent = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim();

  console.log(`🎨 RAW CONTENT for ${segmentType}: ${cleanContent.substring(0, 200)}...`);

  // 🚨 CRITICAL FIX: Check if content is already well-formatted HTML from template
  const isAlreadyFormattedHTML = cleanContent.includes('<div class="') || 
                                 cleanContent.includes('<ul class="') || 
                                 cleanContent.includes('skill-category-title') ||
                                 cleanContent.includes('technical-skill-category') ||
                                 cleanContent.includes('functional-skill-category');

  if (isAlreadyFormattedHTML) {
    console.log(`✅ Content already well-formatted for ${segmentType}, skipping transformation`);
    return cleanContent;
  }

  // 🚀 BYPASS ALL TRANSFORMATIONS - Return raw content as-is with minimal formatting
  console.log(`🔧 BYPASSING TRANSFORMATIONS for ${segmentType} - returning raw content with basic HTML conversion`);
  
  // Convert markdown-style bold to HTML bold and convert line breaks to HTML
  let htmlContent = cleanContent
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  
  return `<div class="content-section">${htmlContent}</div>`;
}

// NEW: Enhanced function to handle skills content matching Antaes CSS structure
function transformSkillsContentDirect(content: string, segmentType: string): string {
  console.log(`🔧 Processing skills content directly for ${segmentType}: ${content.substring(0, 200)}...`);
  
  // Convert markdown-style bold to HTML bold
  let htmlContent = content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Process line by line to maintain structure
  const lines = htmlContent.split('\n').filter(line => line.trim());
  let result = '';
  
  let currentCategoryName = '';
  let categorySkills: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if it's a bold category header like "<strong>Leadership & Management</strong>"
    if (line.includes('<strong>') && line.includes('</strong>') && !line.includes(':')) {
      // Save previous category if exists
      if (currentCategoryName && categorySkills.length > 0) {
        result += formatSkillsCategory(currentCategoryName, categorySkills);
        categorySkills = [];
      }
      
      // Start new category - extract text from <strong> tags
      currentCategoryName = line.replace(/<\/?strong>/g, '').trim();
      console.log(`🏷️ Found category: ${currentCategoryName}`);
    }
    // Check if it's a category header with colon (fallback format)
    else if (line.includes(':') && (line.includes('<strong>') || /^[A-Z]/.test(line))) {
      // Save previous category if exists
      if (currentCategoryName && categorySkills.length > 0) {
        result += formatSkillsCategory(currentCategoryName, categorySkills);
        categorySkills = [];
      }
      
      // Start new category
      currentCategoryName = line.replace(/<\/?strong>/g, '').replace(/:$/, '').trim();
      console.log(`🏷️ Found category with colon: ${currentCategoryName}`);
    }
    // Check if it's a bullet point with detailed skill description
    else if ((line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) && currentCategoryName) {
      // Extract skill details for current category
      const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
      
      // Look for nested bold skills like "**Transformational Leadership:** description"
      const skillMatch = cleanLine.match(/<strong>([^<]+)<\/strong>:\s*(.*)/);
      if (skillMatch) {
        const skillName = skillMatch[1].trim();
        const skillDescription = skillMatch[2].trim();
        categorySkills.push(`${skillName}: ${skillDescription}`);
        console.log(`📌 Added detailed skill: ${skillName}`);
      } else {
        // Regular bullet point content
        categorySkills.push(cleanLine.replace(/<\/?strong>/g, ''));
      }
    }
    // Check if it's skills for current category (comma-separated on next line)
    else if (currentCategoryName && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*') && !line.includes('<strong>')) {
      // Split skills by comma
      const skills = line.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
      categorySkills.push(...skills);
      console.log(`📝 Added skills to ${currentCategoryName}: ${skills.join(', ')}`);
    }
    // Check if it's a numbered item (Areas of Expertise: 1. Digital Transformation...)
    else if (/^\d+\./.test(line)) {
      result += `<div class="expertise-item">
        <strong>${line.replace(/^\d+\.\s*/, '').replace(/<\/?strong>/g, '')}</strong>
      </div>`;
    }
    // Check if it's a bullet point or other content
    else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      result += `<ul class="section-content"><li>${line.replace(/^[•\-\*]\s*/, '')}</li></ul>`;
    }
    // Regular descriptive text
    else if (!currentCategoryName) {
      result += `<p class="section-content">${line}</p>`;
    }
  }
  
  // Add final category if exists
  if (currentCategoryName && categorySkills.length > 0) {
    result += formatSkillsCategory(currentCategoryName, categorySkills);
  }
  
  console.log(`✅ Transformed skills content for ${segmentType}: ${result.substring(0, 300)}...`);
  return result;
}

// Helper function to format a skills category with proper Antaes styling
function formatSkillsCategory(categoryName: string, skills: string[]): string {
  // Remove duplicates and clean skills
  const uniqueSkills = Array.from(new Set(skills.map(skill => skill.trim()))).filter(skill => skill.length > 0);
  
  return `
    <div class="skills-category">
      <h4 class="skills-subtitle">${categoryName}</h4>
      <div class="skills-tags">
        ${uniqueSkills.map(skill => `
          <span class="skill-tag">${skill}</span>
        `).join('')}
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎯 PDF Generation Request received');
    // Sanitize incoming body to avoid nulls violating strict types downstream
    const body = await request.json();
    
    // Optional: offload to queue if requested
    if (body?.enqueue === true) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ai/queue/enqueue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'generate_pdf', payload: body })
        });
        if (res.ok) {
          return NextResponse.json({ success: true, queued: true });
        }
      } catch (e) {
        console.warn('Queue enqueue failed, processing inline', e);
      }
    }
    
    // Check if we're using preview HTML approach
    if (body.usePreviewHTML && body.previewHTML) {
      console.log('🎯 Using preview HTML for PDF generation');
      
      // Extract the complete HTML with all styles preserved
      let finalHTML = body.previewHTML;
      
      // Only remove problematic transform styles that break PDF layout
      finalHTML = finalHTML.replace(/style="[^"]*transform[^"]*"/gi, '');
      
      // Ensure PDF-specific optimizations with page break rules and smaller margins
      finalHTML = finalHTML.replace(/<style>/gi, `<style>
        /* PDF-specific optimizations */
        @page { 
          margin: 10mm 12mm; /* Minimal margins - content goes almost to edges */
          size: A4;
        }
        
        /* Page break rules - prevent sections from splitting */
        .section-title, .preview-h3, .candidate-name, h1, h2, h3 {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        .section-card, .preview-section, .experience-block {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: auto !important;
          break-after: auto !important;
        }
        
        .section-divider, hr {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* Ensure sections stay together */
        .section-title + .section-divider + .section-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Manager details should stay with header */
        .header, .manager-contact {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            font-size: 12px !important;
          }
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .container { 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 0 !important;
            max-width: none !important;
          }
          iframe { display: none !important; }
          
          /* Force small font sizes to match preview exactly */
          .candidate-name { font-size: 1.1rem !important; }
          .candidate-role { font-size: 0.75rem !important; }
          .candidate-years { font-size: 0.7rem !important; }
          .section-title { font-size: 0.75rem !important; }
          .section-card, .section-content, .preview-li, ul li, p { font-size: 0.8rem !important; }
          .section-card-title { font-size: 0.8rem !important; }
          
          /* Remove any container padding to let page margins control spacing */
          .header { padding: 20px 0 !important; }
          .section-card { margin-left: 0 !important; margin-right: 0 !important; }
          
          /* Force colors in PDF */
          .section-card, .preview-section { 
            background: #f5f7fa !important; 
            border-left: 4px solid #073C51 !important;
          }
          .preview-ul li::marker { color: #FFC300 !important; }
          .section-title { color: #073C51 !important; border-bottom: 1px solid #073C51 !important; }
          .tag::before { background: #FFB800 !important; }
        }
      </style>
      <style>`);

      // Generate PDF from the preview HTML
      const pdfBuffer = await generatePDF(finalHTML);
      
      // Upload to Vercel Blob
      const fileName = `${body.candidateData?.fullName?.replace(/\s+/g, '_') || 'competence_file'}_${Date.now()}.pdf`;
      const blob = await put(fileName, pdfBuffer, {
        access: 'public',
        contentType: 'application/pdf',
      });

      // Save to database for /competence-files page
      try {
        // Check if candidate exists in database
        const candidateExists = await db.candidate.findUnique({
          where: { id: body.candidateData.id }
        });

        if (candidateExists) {
          await db.competenceFile.create({
            data: {
              fileName: fileName,
              candidateId: body.candidateData.id,
              filePath: fileName,
              downloadUrl: blob.url,
              format: 'pdf',
              status: 'READY',
              version: 1,
              metadata: {
                template: body.template || 'unknown',
                templateName: body.template === 'antaes' ? 'Antaes Template' : 'Emineon Template',
                generationMethod: 'preview-html',
                managerContact: body.managerContact,
                generationTimestamp: new Date().toISOString(),
                previewGenerated: true
              },
              sectionsConfig: {
                usePreviewHTML: true,
                originalHTML: body.previewHTML
              },
              generatedBy: 'editor',
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          });
          console.log('✅ Competence file saved to database');
        } else {
          console.log('⚠️ Candidate not found in database, PDF generated but not saved to competence files list');
        }
      } catch (dbError) {
        console.error('❌ Failed to save competence file to database:', dbError);
        // Continue anyway - PDF was generated successfully
      }

      console.log('✅ PDF generated successfully from preview HTML');
      
      return NextResponse.json({
        success: true,
        downloadUrl: blob.url,
        fileName: fileName,
        message: 'PDF generated successfully from preview'
      });
    }
    
    // Original segment-based approach
    const { candidateData: rawCandidate, segments, jobDescription, managerContact, template = 'professional-classic', client, jobTitle } = body;
    const candidateData = {
      ...rawCandidate,
      email: rawCandidate?.email ?? '',
      phone: rawCandidate?.phone ?? '',
      location: rawCandidate?.location ?? '',
      yearsOfExperience: typeof rawCandidate?.yearsOfExperience === 'number' && Number.isFinite(rawCandidate.yearsOfExperience)
        ? rawCandidate.yearsOfExperience
        : undefined,
    } as any;

    if (!candidateData || !segments) {
      return NextResponse.json(
        { success: false, message: 'Missing required data: candidateData and segments are required' },
        { status: 400 }
      );
    }

    console.log(`📋 Processing ${segments.length} segments with template: ${template}`);
    console.log(`👤 Candidate: ${candidateData.fullName}`);
    console.log(`💼 Position: ${jobTitle || 'N/A'} at ${client || 'N/A'}`);

    // Log the segments content for debugging
    console.log('🔍 Segments content preview:');
    segments.forEach((segment: SegmentContent, index: number) => {
      console.log(`  ${index + 1}. ${segment.title} (${segment.type}): ${segment.content?.substring(0, 100)}...`);
    });

    // Generate HTML content based on template type
    let htmlContent: string;
    
    if (template === 'antaes') {
      console.log('🎨 Using Antaes template with DIRECT content processing (no pipeline)');
      
      // Use segments directly without processing pipeline
      htmlContent = await generateAntaesHTMLFromSegments(
        segments, 
        candidateData, 
        jobDescription, 
        managerContact
      );
    } else {
      console.log('🎨 Using Professional Classic template with 5-step pipeline processing');
      // STEP 1-5: Enhanced 5-Step Pipeline Processing for non-Antaes templates
      const processedSegments = await formatContentForPDF(segments, candidateData, template, jobDescription);
      htmlContent = generateHTMLFromSegments(processedSegments, candidateData, template);
    }

    // Generate unique filename with timestamp and candidate info
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const sanitizedName = candidateData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const templateName = template === 'professional-classic' ? 'Professional_Classic' : 
                        template === 'antaes' ? 'Antaes' :
                        template.charAt(0).toUpperCase() + template.slice(1);
    const fileName = `${sanitizedName}_${client || 'Client'}_${templateName}_Competence_File_${timestamp}.pdf`;

    // Generate PDF using serverless-compatible PDF service
    console.log('🖨️ Generating PDF using serverless PDF service...');
    const pdfBuffer = await generatePDF(htmlContent);

    // Upload to Vercel Blob with unique filename (allow overwrite)
    const { url } = await put(fileName, pdfBuffer, {
      access: 'public',
      addRandomSuffix: false, // Use our custom filename
      allowOverwrite: true, // Allow overwriting existing files
    });

    const endTime = Date.now();
    const processingTime = `${((endTime - startTime) / 1000).toFixed(2)}s`;

    // Save metadata to database using Prisma
    try {
      // Check if candidate exists before creating competence file
      const candidateExists = await db.candidate.findUnique({
        where: { id: candidateData.id }
      });

      if (candidateExists) {
        await db.competenceFile.create({
          data: {
            fileName: fileName,
            candidateId: candidateData.id,
            filePath: fileName,
            downloadUrl: url,
            format: 'pdf',
            status: 'READY',
            version: 1,
            metadata: {
              client: client || 'Client',
              jobTitle: jobTitle || 'Position',
              template,
              templateName,
              segmentsCount: segments.length,
              processingMethod: template === 'antaes' ? 'direct-content' : '5-step-pipeline',
              processingTime,
              generationTimestamp: new Date().toISOString()
            },
            sectionsConfig: JSON.parse(JSON.stringify(segments)),
            generatedBy: 'system', // Since we removed auth
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        console.log('✅ Metadata saved to database');
      } else {
        console.log('⚠️ Candidate not found in database, skipping metadata save');
        console.log('📎 PDF generated successfully but not linked to candidate record');
      }
    } catch (dbError) {
      console.error('Database save error:', dbError);
      console.log('⚠️ Continuing with PDF generation despite database error');
    }

    console.log(`✅ PDF generated successfully in ${processingTime}`);
    console.log(`📎 File URL: ${url}`);
    console.log(`📊 Segments processed: ${segments.length}`);
    console.log(`🎨 Template: ${template}`);
    console.log(`🔧 Processing method: ${template === 'antaes' ? 'direct-content' : '5-step-pipeline'}`);

    return NextResponse.json({
      success: true,
      fileUrl: url,
      fileName,
      templateName: templateName,
      processingMethod: template === 'antaes' ? 'direct-content' : '5-step-pipeline',
      processingTime,
      segmentsProcessed: segments.length,
      candidateName: candidateData.fullName,
      jobTitle: jobTitle || 'Position',
      clientName: client || 'Client',
      generationTimestamp: new Date().toISOString(),
    });

  } catch (error) {
    const endTime = Date.now();
    const processingTime = `${((endTime - startTime) / 1000).toFixed(2)}s`;
    
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate PDF from editor content', 
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
} 