import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CandidateData {
  id: string;
  fullName: string;
  currentTitle: string;
  email?: string;
  phone?: string;
  location?: string;
  yearsOfExperience?: number;
  skills: string[];
  certifications: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    responsibilities: string;
  }>;
  education: string[];
  languages: string[];
  summary?: string;
}

export interface JobDescription {
  text: string;
  requirements: string[];
  skills: string[];
  responsibilities: string[];
  title?: string;
  company?: string;
}

export interface EnrichedContent {
  enhancedSummary: string;
  optimizedSkills: {
    technical: string[];
    functional: string[];
    leadership: string[];
  };
  enrichedExperience: Array<{
    company: string;
    title: string;
    period: string;
    enhancedDescription: string;
    keyAchievements: string[];
    technicalEnvironment: string[];
    responsibilities: string[];
  }>;
  areasOfExpertise: string[];
  valueProposition: string;
  optimizedEducation: string[];
  optimizedCertifications: string[];
  optimizedCoreCompetencies: string[];
  optimizedTechnicalExpertise: string[];
}

export class CompetenceEnrichmentService {
  
  /**
   * Generic retry wrapper for OpenAI API calls - FAILS if AI cannot generate content
   */
  private async retryWithOpenAI<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 ${operationName} - Attempt ${attempt}/${maxRetries}`);
        const result = await operation();
        console.log(`✅ ${operationName} - Success on attempt ${attempt}`);
        return result;
      } catch (error) {
        console.warn(`⚠️ ${operationName} - Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error(`❌ ${operationName} - All retries exhausted, NO FALLBACKS - AI generation required`);
          throw new Error(`AI generation failed for ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ ${operationName} - Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached due to throw above
    throw new Error(`AI generation failed for ${operationName}: Maximum retries exceeded`);
  }

  /**
   * Main enrichment function that processes candidate data with job description context
   * OPTIMIZED: Uses parallel processing for maximum speed
   */
  async enrichCandidateForJob(
    candidateData: CandidateData,
    jobDescription?: JobDescription,
    clientName?: string
  ): Promise<EnrichedContent> {
    console.log('🚀 Starting ULTRA-FAST parallel AI enrichment for competence file...');
    const startTime = Date.now();
    
    try {
      // PARALLEL PROCESSING: Execute all AI operations simultaneously for maximum speed
      const [
        jobAnalysis,
        enhancedSummary,
        optimizedSkills,
        enrichedExperience,
        areasOfExpertise,
        optimizedEducation,
        optimizedCertifications,
        optimizedCoreCompetencies,
        optimizedTechnicalExpertise,
        valueProposition
      ] = await Promise.all([
        // Step 1: Analyze job requirements (if provided)
        jobDescription ? this.analyzeJobRequirementsWithRetry(jobDescription) : Promise.resolve(null),
        
        // Step 2: Generate enhanced professional summary
        this.generateEnhancedSummaryWithRetry(candidateData, jobDescription, clientName),
        
        // Step 3: Optimize and categorize skills
        this.optimizeSkillsWithRetry(candidateData, null), // Will get jobAnalysis later if needed
        
        // Step 4: Enrich work experience with detailed achievements
        this.enrichWorkExperienceWithRetry(candidateData, null), // Will get jobAnalysis later if needed
        
        // Step 5: Generate areas of expertise
        this.generateAreasOfExpertiseWithRetry(candidateData, jobDescription),
        
        // Step 6: Optimize academic background
        this.optimizeEducationWithRetry(candidateData, jobDescription),
        
        // Step 7: Optimize certifications
        this.optimizeCertificationsWithRetry(candidateData, jobDescription),
        
        // Step 8: Optimize Core Competencies
        this.optimizeCoreCompetenciesWithRetry(candidateData, jobDescription),
        
        // Step 9: Optimize Technical Expertise
        this.optimizeTechnicalExpertiseWithRetry(candidateData, jobDescription),
        
        // Step 10: Create value proposition
        this.generateValuePropositionWithRetry(candidateData, jobDescription, clientName)
      ]);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ ULTRA-FAST parallel AI enrichment completed in ${processingTime}ms`);
      
      return {
        enhancedSummary,
        optimizedSkills,
        enrichedExperience,
        areasOfExpertise,
        valueProposition,
        optimizedEducation,
        optimizedCertifications,
        optimizedCoreCompetencies,
        optimizedTechnicalExpertise
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ AI enrichment failed after ${processingTime}ms:`, error);
      throw error; // Re-throw to ensure no fallbacks are used
    }
  }

  /**
   * Retry wrapper methods for each AI operation - ALWAYS succeed
   */
  private async analyzeJobRequirementsWithRetry(jobDescription: JobDescription) {
    return this.retryWithOpenAI(
      () => this.analyzeJobRequirements(jobDescription),
      'Job Requirements Analysis'
    );
  }

  private async generateEnhancedSummaryWithRetry(candidateData: CandidateData, jobDescription?: JobDescription, clientName?: string) {
    return this.retryWithOpenAI(
      () => this.generateEnhancedSummary(candidateData, jobDescription, clientName),
      'Enhanced Summary Generation'
    );
  }

  private async optimizeSkillsWithRetry(candidateData: CandidateData, jobAnalysis: any) {
    return this.retryWithOpenAI(
      () => this.optimizeSkills(candidateData, jobAnalysis),
      'Skills Optimization'
    );
  }

  private async enrichWorkExperienceWithRetry(candidateData: CandidateData, jobAnalysis: any) {
    return this.retryWithOpenAI(
      () => this.enrichWorkExperience(candidateData, jobAnalysis),
      'Work Experience Enrichment'
    );
  }

  private async generateAreasOfExpertiseWithRetry(candidateData: CandidateData, jobDescription?: JobDescription) {
    return this.retryWithOpenAI(
      () => this.generateAreasOfExpertise(candidateData, jobDescription),
      'Areas of Expertise Generation'
    );
  }

  private async optimizeEducationWithRetry(candidateData: CandidateData, jobDescription?: JobDescription) {
    return this.retryWithOpenAI(
      () => this.optimizeEducation(candidateData, jobDescription),
      'Education Optimization'
    );
  }

  private async optimizeCertificationsWithRetry(candidateData: CandidateData, jobDescription?: JobDescription) {
    return this.retryWithOpenAI(
      () => this.optimizeCertifications(candidateData, jobDescription),
      'Certifications Optimization'
    );
  }

  private async optimizeCoreCompetenciesWithRetry(candidateData: CandidateData, jobDescription?: JobDescription) {
    return this.retryWithOpenAI(
      () => this.optimizeCoreCompetencies(candidateData, jobDescription),
      'Core Competencies Optimization'
    );
  }

  private async optimizeTechnicalExpertiseWithRetry(candidateData: CandidateData, jobDescription?: JobDescription) {
    return this.retryWithOpenAI(
      () => this.optimizeTechnicalExpertise(candidateData, jobDescription),
      'Technical Expertise Optimization'
    );
  }

  private async generateValuePropositionWithRetry(candidateData: CandidateData, jobDescription?: JobDescription, clientName?: string) {
    return this.retryWithOpenAI(
      () => this.generateValueProposition(candidateData, jobDescription, clientName),
      'Value Proposition Generation'
    );
  }

  /**
   * Analyze job requirements to understand what to emphasize - NEVER fails
   */
  private async analyzeJobRequirements(jobDescription: JobDescription) {
    // Robust job description parsing - handle ANY format
    const jobText = jobDescription.text || '';
    const jobTitle = jobDescription.title || 'Professional Role';
    const company = jobDescription.company || 'Target Company';
    
    // Extract requirements from text if not provided in structured format
    const requirements = jobDescription.requirements?.length > 0 
      ? jobDescription.requirements 
      : this.extractRequirementsFromText(jobText);
    
    // Extract skills from text if not provided in structured format  
    const skills = jobDescription.skills?.length > 0
      ? jobDescription.skills
      : this.extractSkillsFromText(jobText);
    
    // Extract responsibilities from text if not provided in structured format
    const responsibilities = jobDescription.responsibilities?.length > 0
      ? jobDescription.responsibilities
      : this.extractResponsibilitiesFromText(jobText);

    const prompt = `Analyze this job description and extract key requirements that should be emphasized in a candidate profile:

Job Title: ${jobTitle}
Company: ${company}
Job Description: ${jobText || 'Professional role with growth opportunities'}
Requirements: ${Array.isArray(requirements) ? requirements.join(', ') : (requirements || 'Professional experience and skills')}
Required Skills: ${Array.isArray(skills) ? skills.join(', ') : (skills || 'Professional and technical skills')}
Responsibilities: ${Array.isArray(responsibilities) ? responsibilities.join(', ') : (responsibilities || 'Professional responsibilities and duties')}

Return ONLY a valid JSON object with this exact structure:
{
  "keySkillsRequired": ["skill1", "skill2"],
  "experienceEmphasis": ["area1", "area2"],
  "industryContext": "industry/domain",
  "seniorityLevel": "mid",
  "technicalFocus": ["tech1", "tech2"],
  "softSkillsNeeded": ["skill1", "skill2"],
  "clientFacing": false,
  "leadershipRequired": false
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert recruiter who analyzes job requirements. Return ONLY valid JSON without any additional text, markdown, or formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No job analysis content received');
    }
    
    // Clean the content to ensure it's valid JSON
    let cleanContent = content;
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    const parsed = JSON.parse(cleanContent);
    // Validate the structure
    if (!parsed.keySkillsRequired || !Array.isArray(parsed.keySkillsRequired)) {
      throw new Error('Invalid job analysis structure');
    }
    return parsed;
  }

  /**
   * Generate enhanced professional summary tailored to job and client
   */
  private async generateEnhancedSummary(
    candidateData: CandidateData,
    jobDescription?: JobDescription,
    clientName?: string
  ): Promise<string> {
    const jobContext = jobDescription ? `
Target Role: ${jobDescription.title || 'Not specified'}
Target Company: ${jobDescription.company || clientName || 'Client'}
Key Requirements: ${Array.isArray(jobDescription.requirements) ? jobDescription.requirements.join(', ') : (jobDescription.requirements || 'Professional qualifications')}
Required Skills: ${Array.isArray(jobDescription.skills) ? jobDescription.skills.join(', ') : (jobDescription.skills || 'Professional skills')}
` : '';

    const prompt = `Create a professional summary for this candidate that aligns with the target role using ONLY verifiable information:

CANDIDATE PROFILE:
Name: ${candidateData.fullName}
Current Title: ${candidateData.currentTitle}
Experience: ${candidateData.yearsOfExperience || 'Multiple'} years
Core Skills: ${candidateData.skills.join(', ')}
Education: ${candidateData.education.join(', ')}
Current Summary: ${candidateData.summary || 'Not provided'}

ACTUAL WORK EXPERIENCE:
${candidateData.experience.map(exp => 
  `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate}): ${exp.responsibilities}`
).join('\n')}

${jobContext}

Create a concise 3-4 sentence professional summary that:
1. Uses ONLY information directly from their actual CV and experience
2. Highlights their relevant REAL job titles, companies, and years of experience
3. Emphasizes skills that are explicitly listed in their skill set
4. Focuses on the TYPES of work they've done, not fabricated results or metrics
5. Uses natural, professional language without corporate buzzwords
6. NEVER invents achievements, metrics, or accomplishments not stated in their CV

CRITICAL PROHIBITIONS:
- NO fabricated metrics, percentages, or quantified achievements
- NO invented accomplishments or results not in their CV
- NO buzzwords like "spearheaded", "leveraged", "transformed", "optimized"
- NO claims about impact or results unless explicitly stated in their experience

ACCEPTABLE CONTENT:
- Their actual job titles and companies
- Their real years of experience
- Skills explicitly listed in their profile
- Types of work/responsibilities they actually performed
- Industries they've worked in
- Educational background they actually have

Write in third person and make it sound professional but truthful and grounded in their actual background.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional CV writer who creates truthful summaries based strictly on actual candidate data. You NEVER fabricate achievements or metrics.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Reduced temperature for more conservative responses
      max_tokens: 250
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No enhanced summary generated');
    }
    return result;
  }

  /**
   * Optimize and categorize skills based on job requirements
   */
  private async optimizeSkills(candidateData: CandidateData, jobAnalysis: any) {
    const prompt = `Analyze and categorize these candidate skills, optimizing them for the target role:

CANDIDATE SKILLS: ${candidateData.skills.join(', ')}
CERTIFICATIONS: ${candidateData.certifications.join(', ')}
EXPERIENCE TITLES: ${candidateData.experience.map(exp => exp.title).join(', ')}

${jobAnalysis ? `
TARGET ROLE REQUIREMENTS:
Required Skills: ${jobAnalysis.keySkillsRequired?.join(', ') || 'Professional skills'}
Technical Focus: ${jobAnalysis.technicalFocus?.join(', ') || 'Technical expertise'}
Soft Skills Needed: ${jobAnalysis.softSkillsNeeded?.join(', ') || 'Professional skills'}
Leadership Required: ${jobAnalysis.leadershipRequired || false}
` : ''}

Return a JSON object categorizing skills into:
{
  "technical": ["technical skills, tools, programming languages, platforms"],
  "functional": ["business skills, domain expertise, methodologies"],
  "leadership": ["management, mentoring, strategic skills"]
}

CRITICAL REQUIREMENTS:
1. ONLY use skills explicitly mentioned in the candidate's profile or certifications
2. ONLY infer skills that are directly evident from their actual job titles and responsibilities
3. DO NOT add skills the candidate doesn't actually have
4. Prioritize skills that match the job requirements from their REAL skill set
5. Use professional terminology but stay truthful to their actual capabilities
6. Include ALL relevant skills - no limits on quantity`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a skills optimization expert. Return only valid JSON with categorized professional skills.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 600
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No skills optimization content received');
    }
    
    // Clean the content to ensure it's valid JSON
    let cleanContent = content;
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    const parsed = JSON.parse(cleanContent);
    // Validate the structure
    if (!parsed.technical || !Array.isArray(parsed.technical)) {
      throw new Error('Invalid skills structure');
    }
    return parsed;
  }

  /**
   * Enrich work experience with detailed achievements and technical environment
   */
  private async enrichWorkExperience(candidateData: CandidateData, jobAnalysis: any) {
    const enrichedExperience = [];
    
    for (const exp of candidateData.experience) { // Process ALL experience roles
      const prompt = `Enhance this work experience entry ONLY using information that can be directly inferred from the provided data:

ROLE: ${exp.title} at ${exp.company}
PERIOD: ${exp.startDate} - ${exp.endDate}
RESPONSIBILITIES: ${exp.responsibilities}

CANDIDATE CONTEXT:
Overall Experience: ${candidateData.yearsOfExperience || 'Multiple'} years
Skills: ${candidateData.skills.join(', ')}

${jobAnalysis ? `
TARGET ROLE ALIGNMENT:
Focus on: ${jobAnalysis.experienceEmphasis?.join(', ') || 'Professional experience'}
Technical Emphasis: ${jobAnalysis.technicalFocus?.join(', ') || 'Technical skills'}
Industry: ${jobAnalysis.industryContext || 'Professional'}
` : ''}

Return a JSON object with:
{
  "enhancedDescription": "Concise 1-2 sentence role overview based ONLY on actual responsibilities provided",
  "keyAchievements": ["Achievements that can be directly inferred from their actual responsibilities - NO fabricated metrics, percentages, or specific numbers"],
  "technicalEnvironment": ["technologies, tools, platforms explicitly mentioned in their skills OR commonly used in their specific role/company"],
  "responsibilities": ["key responsibilities taken directly from their actual job description"]
}

CRITICAL REQUIREMENTS - MUST FOLLOW:
1. NEVER invent specific metrics (NO "reduced by 30%", "increased by 25%", "saved $X", etc.)
2. NEVER add achievements not directly supported by their actual responsibilities
3. Base ALL content strictly on what they actually did according to their CV
4. If responsibilities are vague, keep achievements equally general but professional
5. Only mention technologies that are in their skills list OR extremely common for their role
6. Use professional language but avoid corporate buzzwords
7. Focus on the TYPE of work they did, not imaginary RESULTS they achieved

FORBIDDEN CONTENT:
- Any specific percentages, dollar amounts, or time savings
- Phrases like "reduced costs by X%", "improved efficiency by X%", "increased revenue by X%"
- Achievements that aren't clearly supported by their actual job description
- Technologies not mentioned in their skills unless absolutely standard for the role

ACCEPTABLE ACHIEVEMENTS:
- "Managed software development lifecycle for multiple projects"
- "Led technical reviews and code quality initiatives" 
- "Collaborated with cross-functional teams to deliver solutions"
- "Mentored junior developers in best practices"
- "Implemented technical solutions aligned with business requirements"

Write achievements that reflect what someone in their exact role and company would realistically accomplish based on their actual responsibilities.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a professional CV writer who enhances job descriptions while maintaining complete accuracy and truthfulness. You NEVER fabricate metrics or achievements not supported by the actual CV data.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Reduced temperature for more conservative responses
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error(`No experience enrichment generated for ${exp.company}`);
      }
      
      // Clean the content to ensure it's valid JSON
      let cleanContent = content;
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const enrichedData = JSON.parse(cleanContent);
      enrichedExperience.push({
        company: exp.company,
        title: exp.title,
        period: `${exp.startDate} - ${exp.endDate}`,
        enhancedDescription: enrichedData.enhancedDescription || exp.responsibilities,
        keyAchievements: enrichedData.keyAchievements || [],
        technicalEnvironment: enrichedData.technicalEnvironment || [],
        responsibilities: enrichedData.responsibilities || [exp.responsibilities]
      });
    }
    
    return enrichedExperience;
  }

  /**
   * Generate areas of expertise based on experience and job requirements
   */
  private async generateAreasOfExpertise(candidateData: CandidateData, jobDescription?: JobDescription) {
    const prompt = `Generate areas of expertise for this candidate based on their background:

CANDIDATE PROFILE:
Title: ${candidateData.currentTitle}
Experience: ${candidateData.yearsOfExperience || 'Multiple'} years
Skills: ${candidateData.skills.join(', ')}
Companies: ${candidateData.experience.map(exp => exp.company).join(', ')}

${jobDescription ? `
TARGET ROLE: ${jobDescription.title || 'Professional Role'}
REQUIRED SKILLS: ${Array.isArray(jobDescription.skills) ? jobDescription.skills.join(', ') : (jobDescription.skills || 'Professional skills')}
KEY RESPONSIBILITIES: ${Array.isArray(jobDescription.responsibilities) ? jobDescription.responsibilities.slice(0, 3).join(', ') : (jobDescription.responsibilities || 'Professional duties')}
` : ''}

Return a JSON array of 8-12 concise expertise tags that:
1. Are DIRECTLY derived from the candidate's actual job titles, responsibilities, and skills
2. Use short, professional terminology (2-4 words maximum)
3. Align with the target role requirements ONLY if the candidate actually has that experience
4. Are specific enough to demonstrate expertise they would realistically have
5. Cover both technical and business aspects from their ACTUAL background
6. Focus on key competencies rather than comprehensive lists

CRITICAL: Base every expertise area on concrete evidence from their CV. Keep tags short and impactful.

Example format: ["Program Management", "Engineering Leadership", "P&L Ownership", "Project Management"]

Return only the JSON array.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expertise mapping specialist who identifies specific areas of professional expertise. Return only a valid JSON array.' },
        { role: 'user', content: prompt }
            ],
      temperature: 0.5,
      max_tokens: 400
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No areas of expertise content received');
    }
    
    // Clean the content to ensure it's valid JSON
    let cleanContent = content;
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    const parsed = JSON.parse(cleanContent);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid areas of expertise format');
    }
    return parsed;
  }

  /**
   * Optimize education background using AI
   */
  private async optimizeEducation(candidateData: CandidateData, jobDescription?: JobDescription) {
    if (!candidateData.education || candidateData.education.length === 0) {
      return [];
    }

    const prompt = `Optimize and enhance this education background for professional presentation:

CANDIDATE EDUCATION:
${candidateData.education.join('\n')}

CANDIDATE PROFILE:
Current Title: ${candidateData.currentTitle}
Experience: ${candidateData.yearsOfExperience || 'Multiple'} years

${jobDescription ? `
TARGET ROLE: ${jobDescription.title || 'Professional Role'}
REQUIRED SKILLS: ${jobDescription.skills?.join(', ') || 'Professional skills'}
` : ''}

Return a JSON array of optimized education entries that:
1. Present education in professional, standardized format
2. Highlight relevant coursework or specializations for the target role
3. Include graduation years if mentioned
4. Emphasize academic achievements that support career progression
5. Use consistent formatting and professional language

Example format: ["Master of Business Administration, Harvard Business School (2018)", "Bachelor of Science in Computer Science, MIT (2016) - Magna Cum Laude"]

Return only the JSON array.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an education optimization expert who enhances academic backgrounds for professional presentation. Return only a valid JSON array.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 400
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No education optimization content received');
    }
    
    // Clean the content to ensure it's valid JSON
    let cleanContent = content;
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    const parsed = JSON.parse(cleanContent);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid education optimization format');
    }
    return parsed;
  }

  /**
   * Optimize certifications using AI
   */
  private async optimizeCertifications(candidateData: CandidateData, jobDescription?: JobDescription) {
    if (!candidateData.certifications || candidateData.certifications.length === 0) {
      return [];
    }

    const prompt = `Optimize and enhance this certifications list for professional presentation:

CANDIDATE CERTIFICATIONS:
${candidateData.certifications.join('\n')}

CANDIDATE PROFILE:
Current Title: ${candidateData.currentTitle}
Experience: ${candidateData.yearsOfExperience || 'Multiple'} years

${jobDescription ? `
TARGET ROLE: ${jobDescription.title || 'Professional Role'}
REQUIRED SKILLS: ${jobDescription.skills?.join(', ') || 'Professional skills'}
ROLE REQUIREMENTS: ${jobDescription.requirements?.join(', ') || 'Professional requirements'}
` : ''}

Return a JSON array of enhanced certification descriptions that:
1. Are DIRECTLY based on the candidate's actual certifications
2. Include relevant details about the certification value and expertise
3. Use professional, human language without corporate buzzwords
4. Emphasize certifications most relevant to the target role (if provided)
5. Maintain accuracy and authenticity

CRITICAL: Base every certification on the actual data provided. Do not add certifications not listed.

Example format: ["Microsoft Azure Solutions Architect Expert - Advanced cloud architecture certification", "PMP Project Management Professional - Comprehensive project management expertise"]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career consultant who optimizes professional certifications for maximum impact while maintaining complete accuracy.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No certifications optimization content received');
    }

    try {
      const cleanContent = content.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      const optimizedCertifications = JSON.parse(cleanContent);
      
      if (!Array.isArray(optimizedCertifications)) {
        throw new Error('Response is not an array');
      }

      return optimizedCertifications;
    } catch (error) {
      console.error('Error parsing certifications optimization:', error);
      throw new Error('Failed to parse certifications optimization from AI response');
    }
  }

  /**
   * Optimize core competencies using AI
   */
  private async optimizeCoreCompetencies(candidateData: CandidateData, jobDescription?: JobDescription) {
    if (!candidateData.skills || candidateData.skills.length === 0) {
      return [];
    }

    const prompt = `Analyze and optimize core competencies for professional presentation:

CANDIDATE SKILLS:
${candidateData.skills.join(', ')}

CANDIDATE PROFILE:
Current Title: ${candidateData.currentTitle}
Experience: ${candidateData.yearsOfExperience || 'Multiple'} years

${jobDescription ? `
TARGET ROLE: ${jobDescription.title || 'Professional Role'}
REQUIRED SKILLS: ${jobDescription.skills?.join(', ') || 'Professional skills'}
ROLE REQUIREMENTS: ${jobDescription.requirements?.join(', ') || 'Professional requirements'}
` : ''}

Return a JSON array of core competencies that:
1. Focus on functional and soft skills from the candidate's actual skill set
2. Emphasize leadership, management, and business skills
3. Use professional terminology that reflects real expertise
4. Prioritize skills most relevant to the target role (if provided)
5. Avoid technical/programming skills (save those for technical expertise)
6. Use natural, human language without AI buzzwords

CRITICAL: Only include competencies directly derived from the candidate's actual skills.

Example format: ["Strategic Planning", "Team Leadership", "Project Management", "Business Analysis", "Client Relationship Management"]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career consultant who identifies and optimizes core professional competencies while maintaining complete accuracy.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No core competencies optimization content received');
    }

    try {
      const cleanContent = content.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      const optimizedCompetencies = JSON.parse(cleanContent);
      
      if (!Array.isArray(optimizedCompetencies)) {
        throw new Error('Response is not an array');
      }

      return optimizedCompetencies;
    } catch (error) {
      console.error('Error parsing core competencies optimization:', error);
      throw new Error('Failed to parse core competencies optimization from AI response');
    }
  }

  /**
   * Optimize technical expertise using AI
   */
  private async optimizeTechnicalExpertise(candidateData: CandidateData, jobDescription?: JobDescription) {
    if (!candidateData.skills || candidateData.skills.length === 0) {
      return [];
    }

    const prompt = `Analyze and optimize technical expertise for professional presentation:

CANDIDATE SKILLS:
${candidateData.skills.join(', ')}

CANDIDATE PROFILE:
Current Title: ${candidateData.currentTitle}
Experience: ${candidateData.yearsOfExperience || 'Multiple'} years

${jobDescription ? `
TARGET ROLE: ${jobDescription.title || 'Professional Role'}
REQUIRED SKILLS: ${jobDescription.skills?.join(', ') || 'Professional skills'}
ROLE REQUIREMENTS: ${jobDescription.requirements?.join(', ') || 'Professional requirements'}
` : ''}

Return a JSON array of technical expertise that:
1. Focus on technical, programming, and technology skills from the candidate's actual skill set
2. Include programming languages, frameworks, tools, and platforms
3. Emphasize technical skills most relevant to the target role (if provided)
4. Use proper technical terminology and industry standards
5. Avoid soft skills and management skills (save those for core competencies)
6. Use natural, human language without AI buzzwords

CRITICAL: Only include technical expertise directly derived from the candidate's actual skills.

Example format: ["JavaScript", "React.js", "Node.js", "Python", "AWS Cloud Services", "Docker", "PostgreSQL", "REST APIs"]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical recruiter who identifies and optimizes technical expertise while maintaining complete accuracy.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No technical expertise optimization content received');
    }

    try {
      const cleanContent = content.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      const optimizedExpertise = JSON.parse(cleanContent);
      
      if (!Array.isArray(optimizedExpertise)) {
        throw new Error('Response is not an array');
      }

      return optimizedExpertise;
    } catch (error) {
      console.error('Error parsing technical expertise optimization:', error);
      throw new Error('Failed to parse technical expertise optimization from AI response');
    }
  }

  /**
   * Generate value proposition tailored to client needs
   */
  private async generateValueProposition(candidateData: CandidateData, jobDescription?: JobDescription, clientName?: string) {
    const prompt = `Create a compelling value proposition for this candidate targeting the specific client and role:

CANDIDATE:
Name: ${candidateData.fullName}
Title: ${candidateData.currentTitle}
Experience: ${candidateData.yearsOfExperience || 'Multiple'} years
Key Skills: ${candidateData.skills.join(', ')}
Recent Role: ${candidateData.experience[0]?.title} at ${candidateData.experience[0]?.company}

${jobDescription ? `
TARGET ROLE: ${jobDescription.title || 'Professional Role'}
CLIENT: ${jobDescription.company || clientName || 'the client'}
KEY REQUIREMENTS: ${jobDescription.requirements?.join(', ') || 'Professional qualifications'}
` : ''}

Write a comprehensive value proposition that:
1. Clearly states what unique value the candidate brings
2. Connects their experience to the client's specific needs
3. Highlights their competitive advantage
4. Uses confident, professional language

Focus on business impact and measurable value delivery.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a strategic positioning expert who creates compelling value propositions for executive candidates.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No value proposition generated');
    }
    return result;
  }

  /**
   * Helper methods to extract information from unstructured job text
   */
  private extractRequirementsFromText(text: string): string[] {
    const requirements = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('experience') || lowerText.includes('year')) {
      requirements.push('Professional experience');
    }
    if (lowerText.includes('degree') || lowerText.includes('education') || lowerText.includes('bachelor') || lowerText.includes('master')) {
      requirements.push('Educational qualifications');
    }
    if (lowerText.includes('skill') || lowerText.includes('technical') || lowerText.includes('programming')) {
      requirements.push('Technical skills');
    }
    if (lowerText.includes('leadership') || lowerText.includes('manage') || lowerText.includes('team')) {
      requirements.push('Leadership experience');
    }
    if (lowerText.includes('communication') || lowerText.includes('presentation')) {
      requirements.push('Communication skills');
    }
    
    return requirements.length > 0 ? requirements : ['Professional qualifications', 'Relevant experience'];
  }

  private extractSkillsFromText(text: string): string[] {
    const skills: string[] = [];
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'azure', 'docker', 'kubernetes',
      'management', 'leadership', 'communication', 'analysis', 'design', 'strategy', 'planning',
      'project management', 'agile', 'scrum', 'git', 'api', 'database', 'cloud', 'devops'
    ];
    
    const lowerText = text.toLowerCase();
    commonSkills.forEach(skill => {
      if (lowerText.includes(skill)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });
    
    return skills.length > 0 ? skills : ['Professional Skills', 'Technical Expertise'];
  }

  private extractResponsibilitiesFromText(text: string): string[] {
    const responsibilities = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('develop') || lowerText.includes('build') || lowerText.includes('create')) {
      responsibilities.push('Development and implementation');
    }
    if (lowerText.includes('manage') || lowerText.includes('lead') || lowerText.includes('supervise')) {
      responsibilities.push('Management and leadership');
    }
    if (lowerText.includes('collaborate') || lowerText.includes('work with') || lowerText.includes('team')) {
      responsibilities.push('Collaboration and teamwork');
    }
    if (lowerText.includes('analyze') || lowerText.includes('research') || lowerText.includes('evaluate')) {
      responsibilities.push('Analysis and research');
    }
    if (lowerText.includes('design') || lowerText.includes('architect') || lowerText.includes('plan')) {
      responsibilities.push('Design and planning');
    }
    
    return responsibilities.length > 0 ? responsibilities : ['Professional duties', 'Project execution'];
  }
}

// Export singleton instance
export const competenceEnrichmentService = new CompetenceEnrichmentService(); 