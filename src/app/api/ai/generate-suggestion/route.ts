import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate structured content prompts for each section type
function generateStructuredContentPrompt(sectionType: string, candidateContext: string): string {
  const baseInstructions = `${candidateContext}

CRITICAL INSTRUCTIONS:
- Generate content SPECIFIC to the ${sectionType.toUpperCase()} section ONLY
- DO NOT include content from other sections
- Use proper bullet points (•) and bold text (**text**) for structure
- Follow the exact format specified for this section
- Make content professional, detailed, and compelling
- Base content on the candidate's actual data when available
- Return ONLY the formatted content for this section, no explanations
- Make the content rich and comprehensive with specific details`;

  switch (sectionType) {
    case 'header':
      return `${baseInstructions}

SECTION: HEADER (Personal Information Only)
Generate ONLY header/contact information with:
- Full name (large, prominent)
- Role title 
- Years of experience
- Location
- Contact details if available

Format:
**${candidateContext.includes('Name:') ? candidateContext.split('Name:')[1].split('\n')[0].trim() : '[Full Name]'}**
${candidateContext.includes('Current Title:') ? candidateContext.split('Current Title:')[1].split('\n')[0].trim() : '[Role Title]'}
${candidateContext.includes('Experience Level:') ? candidateContext.split('Experience Level:')[1].split('\n')[0].trim() : '[X]+ years'} of experience
${candidateContext.includes('Location:') ? candidateContext.split('Location:')[1].split('\n')[0].trim() : '[Location]'}

DO NOT include summary, skills, or experience details here.`;

    case 'summary':
      return `${baseInstructions}

SECTION: PROFESSIONAL SUMMARY (Executive Overview Only)
Generate a compelling 4-5 sentence professional summary that:
- Opens with years of experience and core expertise
- Highlights 3-4 key technical competencies
- Emphasizes leadership and strategic capabilities
- Mentions industry experience or domain expertise
- Concludes with value proposition and career focus

Write as a flowing paragraph. Focus ONLY on high-level professional identity.
DO NOT include specific technical skills lists or detailed experience.

Example style:
"Seasoned [Role] with [X]+ years of experience in [domain]. Expert in [key technologies/methodologies] with proven track record of [type of achievements]. Demonstrated leadership in [areas] and strategic expertise in [domains]. Passionate about [professional focus] and committed to [value proposition]."`;

    case 'functional-skills':
      return `${baseInstructions}

SECTION: FUNCTIONAL SKILLS (Comprehensive Professional Competencies)
Generate a comprehensive list of functional skills organized by categories with detailed explanations:

**Leadership & Team Management**
• Cross-functional team leadership and mentoring
• Agile coaching and team development
• Stakeholder management and communication
• Change management and organizational transformation
• Conflict resolution and team building

Proven ability to lead diverse teams through complex transformations, fostering collaboration and driving high-performance cultures. Expert in agile methodologies and continuous improvement practices.

**Strategic Planning & Business Analysis**
• Business strategy development and implementation
• Requirements gathering and business analysis
• Market research and competitive analysis
• Strategic roadmap development
• Performance optimization and KPI management
• Risk assessment and mitigation strategies

Strategic thinker with expertise in translating business vision into executable roadmaps. Skilled in balancing competing priorities while ensuring alignment with organizational objectives.

**Project & Program Management**
• Project lifecycle management (initiation to closure)
• Resource planning and allocation
• Budget management and cost control
• Timeline management and milestone tracking
• Quality assurance and deliverable management
• Vendor and contractor management

Experienced in managing complex, multi-million dollar projects across diverse industries. Expert in PMI methodologies, agile frameworks, and hybrid project management approaches.

**Process Improvement & Methodology**
• Process analysis and optimization
• Lean Six Sigma methodologies
• Business process reengineering
• Workflow automation and digitization
• Standard operating procedure development
• Continuous improvement initiatives

Champion of operational excellence with a track record of identifying inefficiencies and implementing scalable solutions that drive measurable business value.

**Communication & Stakeholder Management**
• Executive presentation and reporting
• Technical documentation and writing
• Cross-cultural communication
• Negotiation and persuasion
• Training and knowledge transfer
• Public speaking and facilitation

Exceptional communicator capable of translating complex technical concepts into business language for diverse audiences, from C-suite executives to technical teams.

**Analytical & Problem-Solving Skills**
• Data analysis and interpretation
• Root cause analysis
• Critical thinking and decision-making
• Financial analysis and modeling
• Performance metrics and reporting
• Trend analysis and forecasting

Strong analytical mindset with ability to synthesize complex information, identify patterns, and develop data-driven solutions to business challenges.

Focus on management, process, analytical, and soft skills. DO NOT include technical tools or programming languages here.`;

    case 'technical-skills':
      return `${baseInstructions}

SECTION: TECHNICAL SKILLS (Technology & Tools Expertise)
Generate categorized technical competencies with detailed explanations:

**Programming & Development**
• ${candidateContext.includes('Core Skills:') ? 
  candidateContext.split('Core Skills:')[1].split('\n')[0].split(',').slice(0, 4).map(s => s.trim()).join(', ') : 
  'JavaScript, Python, Java, TypeScript'}
• Modern frameworks and libraries
• API design and microservices architecture
• Code quality and testing methodologies

Extensive experience in full-stack development with expertise in modern programming paradigms. Proficient in building scalable, maintainable applications using industry best practices.

**Cloud & Infrastructure**
• AWS, Azure, Google Cloud Platform
• Docker, Kubernetes, containerization
• CI/CD pipelines and DevOps practices
• Infrastructure as Code (Terraform, CloudFormation)

Deep expertise in cloud-native architectures and modern deployment strategies. Skilled in designing resilient, scalable infrastructure solutions that support business growth.

**Data & Analytics**
• Database design and optimization (SQL, NoSQL)
• Data pipeline development and ETL processes
• Business intelligence and reporting tools
• Machine learning and data science frameworks

Proven ability to architect and implement data solutions that drive business insights. Expert in transforming raw data into actionable intelligence through advanced analytics.

Focus on technical tools, programming languages, and platforms. DO NOT include soft skills or management capabilities.`;

    case 'areas-of-expertise':
      return `${baseInstructions}

SECTION: AREAS OF EXPERTISE (Industry Domains)
Generate 4-6 specific industry/domain expertise areas:

${candidateContext.includes('Education:') && candidateContext.includes('finance') ? 'Financial Services' : 'Information Technology'}
Digital Transformation & Innovation
${candidateContext.includes('consulting') ? 'Strategic Consulting' : 'Enterprise Software Development'}
${candidateContext.includes('bank') || candidateContext.includes('financial') ? 'Banking & Capital Markets' : 'Cloud Computing & Architecture'}
Data Analytics & Business Intelligence
${candidateContext.includes('healthcare') ? 'Healthcare Technology' : 'Agile Methodologies & DevOps'}

Each line should be a specific domain or industry area. Base on candidate's background.
DO NOT include technical skills or tools here.`;

    case 'education':
      return `${baseInstructions}

SECTION: EDUCATION (Academic Background)
Generate educational background with relevant details:

• **${candidateContext.includes('Education:') ? 
  candidateContext.split('Education:')[1].split('\n')[0].split(',')[0].trim() : 
  'Master of Science in Computer Science'}** - [University Name] ([Year])
• **Bachelor's Degree** - [Institution] ([Year])
• **Professional Development** - Advanced certifications in relevant technologies
• **Continuing Education** - Industry workshops and specialized training programs

Include relevant coursework, academic achievements, or thesis topics if applicable.
Focus ONLY on formal education and academic qualifications.`;

    case 'certifications':
      return `${baseInstructions}

SECTION: CERTIFICATIONS (Professional Credentials)
Generate relevant professional certifications:

• **AWS Certified Solutions Architect** - Amazon Web Services (2023)
• **Certified Scrum Master (CSM)** - Scrum Alliance (2022)
• **Project Management Professional (PMP)** - PMI (2021)
• **Google Cloud Professional Developer** - Google Cloud (2023)
• **Microsoft Azure Fundamentals** - Microsoft (2022)
• **ITIL Foundation** - AXELOS (2021)

Base certifications on candidate's technical skills and experience level.
Include relevant dates and issuing organizations.
Focus ONLY on professional certifications and credentials.`;

    case 'languages':
      return `${baseInstructions}

SECTION: LANGUAGES (Communication Skills)
Generate language proficiencies in a clean format:

**English** (Native/Professional) | **French** (Professional) | **Spanish** (Conversational) | **German** (Basic)

Or in list format:
• English - Native/Professional proficiency
• French - Professional working proficiency  
• Spanish - Conversational proficiency
• German - Basic proficiency

Base on candidate's location and background. Include proficiency levels.
Focus ONLY on spoken/written languages.`;

    case 'experiences-summary':
      return `${baseInstructions}

SECTION: PROFESSIONAL EXPERIENCES SUMMARY (Career Timeline)
Generate concise one-line summaries for each role:

**Senior Software Engineer** – TechCorp Solutions (2020 - Present)
**Software Developer** – Innovation Labs (2018 - 2020)  
**Junior Developer** – StartupTech (2016 - 2018)
**Software Engineering Intern** – Global Systems (2015 - 2016)

Each line should include: **Job Title** – Company Name (Start Date - End Date)
Keep each line concise and professional.
Focus ONLY on job titles, companies, and dates.`;

    case 'experience':
      return `${baseInstructions}

SECTION: DETAILED PROFESSIONAL EXPERIENCE (Single Role Detail)
Generate ONE detailed experience block with this EXACT structure:

**TechCorp Solutions**
Senior Software Engineer
January 2020 - Present

**Company Description/Context**
Leading technology consultancy specializing in enterprise digital transformation and cloud migration solutions. Serves Fortune 500 clients across financial services, healthcare, and retail sectors with innovative software solutions.

**Key Responsibilities**
• Lead development of scalable microservices architecture serving 10M+ daily users
• Mentor team of 8 junior developers and coordinate cross-functional initiatives
• Design and implement CI/CD pipelines reducing deployment time by 75%
• Collaborate with product managers and stakeholders to define technical requirements
• Conduct code reviews and establish development best practices across teams

**Major Achievements**
• Architected cloud migration strategy that reduced infrastructure costs by 40%
• Delivered critical e-commerce platform upgrade ahead of schedule, increasing revenue by $2M annually
• Implemented automated testing framework improving code quality and reducing bugs by 60%
• Led emergency response team during system outages, achieving 99.9% uptime SLA

**Technical Environment**
• Languages: Java, Python, JavaScript, TypeScript
• Frameworks: Spring Boot, React, Node.js, Angular
• Cloud: AWS (EC2, Lambda, RDS, S3), Docker, Kubernetes
• Tools: Jenkins, Git, JIRA, Confluence

Generate this structure for the most recent/relevant experience with specific, quantifiable details.`;

    default:
      return `${baseInstructions}

Generate professional, detailed content for the ${sectionType} section based on the candidate information provided.
Make it specific to this section type and avoid generic descriptions.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, sectionType, currentContent, candidateData, jobDescription } = await request.json();

    if (!type || !sectionType || !candidateData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique request ID and session ID for complete isolation
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const requestId = `${sectionType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🤖 [${requestId}] [SESSION: ${sessionId}] AI Suggestion Request:`, {
      type,
      sectionType,
      candidateFullName: candidateData.fullName,
      contentLength: currentContent?.length || 0,
      hasJobDescription: !!jobDescription
    });

    let prompt = '';
    let systemPrompt = `You are an expert HR professional and executive resume writer with 15+ years of experience. You specialize in creating compelling, ATS-optimized competence files that highlight candidates' unique value propositions and achievements.

🚨 CRITICAL TRUTHFULNESS REQUIREMENT:
- NEVER fabricate metrics, percentages, revenue figures, or specific achievements
- NEVER make up company names, dollar amounts, or performance statistics  
- NEVER create fake achievements like "reduced costs by X%" or "increased revenue by $X"
- ONLY use information that can be verified from the actual CV data provided
- When creating examples, use general professional language without specific false metrics
- Focus on responsibilities and capabilities rather than fabricated achievements

🚨 CRITICAL SECTION ISOLATION INSTRUCTIONS:
1. SESSION ID: ${sessionId}
2. REQUEST ID: ${requestId}
3. TARGET SECTION: ${sectionType.toUpperCase()}
4. You MUST generate content EXCLUSIVELY for the ${sectionType.toUpperCase()} section ONLY
5. DO NOT include any content that belongs to other sections
6. IGNORE any content that is not directly relevant to ${sectionType}
7. Focus ONLY on the specific requirements for the ${sectionType} section
8. Return content that is laser-focused on this section's purpose
9. DO NOT generate generic text that could apply to multiple sections
10. Each section must have UNIQUE, SPECIFIC content

FORBIDDEN CONTENT:
- Do not include generic phrases like "Comprehensive academic foundation"
- Do not include content that could belong to other sections
- Do not generate the same content for different sections
- Do not include broad overviews that span multiple areas

SECTION VALIDATION: The content you generate will be validated to ensure it's unique to ${sectionType.toUpperCase()} only.`;
    
    // Enhanced context with strict section filtering
    const candidateContext = `
🎯 SECTION-SPECIFIC REQUEST
SESSION: ${sessionId}
REQUEST: ${requestId}
TARGET: ${sectionType.toUpperCase()} SECTION ONLY

Candidate Profile (filtered for ${sectionType} relevance):
- Name: ${candidateData.fullName}
- Current Title: ${candidateData.currentTitle}
- Experience Level: ${candidateData.yearsOfExperience} years
- Relevant Skills (top 6): ${candidateData.skills?.slice(0, 6).join(', ') || 'Not specified'}
- Education: ${candidateData.education?.join(', ') || 'Not specified'}
- Location: ${candidateData.location || 'Not specified'}
${candidateData.experience && candidateData.experience.length > 0 ? `- Recent Role: ${candidateData.experience[0]?.title} at ${candidateData.experience[0]?.company}` : ''}
${jobDescription ? `

Target Job Alignment (for ${sectionType} section):
- Position: ${jobDescription.title || 'Not specified'}
- Company: ${jobDescription.company || 'Not specified'}
- Top Requirements: ${jobDescription.requirements?.slice(0, 3).join(', ') || 'Not specified'}
- Key Skills: ${jobDescription.skills?.slice(0, 6).join(', ') || 'Not specified'}` : ''}

🚨 STRICT ISOLATION: Generate content ONLY for ${sectionType.toUpperCase()}. Do not include any content from other sections.
CONTENT MUST BE UNIQUE TO ${sectionType.toUpperCase()} SECTION.
`;

    console.log(`📝 [${requestId}] Candidate Context for AI (${sectionType}):`, {
      name: candidateData.fullName,
      title: candidateData.currentTitle,
      skillsCount: candidateData.skills?.length || 0,
      experienceCount: candidateData.experience?.length || 0,
      hasJobContext: !!jobDescription,
      targetSection: sectionType,
      sessionId
    });

    switch (type) {
      case 'generate':
        prompt = generateStructuredContentPrompt(sectionType, candidateContext);
        console.log(`🎯 [${requestId}] Generated prompt for section: ${sectionType}`);
        console.log(`📋 [${requestId}] Prompt length: ${prompt.length} characters`);
        break;
        
      case 'improve':
        prompt = `${candidateContext}

🎯 SECTION: ${sectionType.toUpperCase()} IMPROVEMENT TASK
Current Content: ${currentContent}

ENHANCEMENT OBJECTIVES:
1. **Clarity & Impact**: Use strong action verbs and quantifiable achievements
2. **Professional Tone**: Executive-level language for senior roles
3. **Value Proposition**: Highlight unique strengths specific to ${sectionType}
4. **ATS Optimization**: Include relevant keywords naturally for ${sectionType}
5. **Readability**: Clear structure and flow for ${sectionType} content
6. **Specificity**: Concrete examples relevant to ${sectionType} only

STRICT GUIDELINES:
- Enhance ONLY ${sectionType.toUpperCase()} content
- Do not add content from other sections
- Keep factual information accurate
- Use metrics where applicable to ${sectionType}
- Stay focused EXCLUSIVELY on ${sectionType} requirements

🚨 SECTION VALIDATION: Content must be uniquely relevant to ${sectionType.toUpperCase()} only.
Return ONLY the improved ${sectionType} content with proper formatting.`;
        break;
        
      case 'expand':
        prompt = `${candidateContext}

🎯 SECTION: ${sectionType.toUpperCase()} EXPANSION TASK
Current Content: ${currentContent}

EXPANSION OBJECTIVES FOR ${sectionType.toUpperCase()}:
1. **Section-Specific Depth**: Add relevant detail for ${sectionType} only
2. **Industry Context**: Include terminology specific to ${sectionType}
3. **Professional Impact**: Highlight achievements relevant to ${sectionType}
4. **Technical Depth**: Expand on aspects specific to ${sectionType}
5. **Business Value**: Connect to outcomes relevant to ${sectionType}
6. **Comprehensive Coverage**: Cover all aspects of ${sectionType} thoroughly

EXPANSION STRATEGIES FOR ${sectionType}:
- Add specific examples relevant to ${sectionType}
- Include methodologies applicable to ${sectionType}
- Describe approaches specific to ${sectionType}
- Add context about ${sectionType} applications
- Include frameworks relevant to ${sectionType}

🚨 CRITICAL: Expand ONLY ${sectionType.toUpperCase()} content. Do not add content from other sections.
Return ONLY the expanded ${sectionType} content with proper formatting.`;
        break;
        
      case 'rewrite':
        prompt = `${candidateContext}

🎯 SECTION: ${sectionType.toUpperCase()} REWRITE TASK
Current Content: ${currentContent}

REWRITE OBJECTIVES FOR ${sectionType.toUpperCase()}:
1. **Fresh Perspective**: New approach specific to ${sectionType}
2. **Strategic Positioning**: Position for ${sectionType} excellence
3. **Market Relevance**: Align with ${sectionType} industry trends
4. **Competitive Edge**: Emphasize ${sectionType} differentiators
5. **Future-Forward**: Include ${sectionType} innovation aspects
6. **Compelling Narrative**: Create ${sectionType}-focused story

REWRITE APPROACHES FOR ${sectionType}:
- Lead with ${sectionType} achievements
- Use ${sectionType}-specific terminology
- Emphasize ${sectionType} leadership
- Position for ${sectionType} advancement
- Create ${sectionType}-oriented narrative

🚨 CRITICAL: Rewrite ONLY ${sectionType.toUpperCase()} content. Do not include other sections.
Return ONLY the rewritten ${sectionType} content with proper formatting.`;
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid suggestion type' }, { status: 400 });
    }

    console.log(`🚀 [${requestId}] Sending isolated request to OpenAI for ${sectionType}...`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
      presence_penalty: 0.2, // Encourage more diverse content
      frequency_penalty: 0.2, // Reduce repetition more aggressively
      user: `${userId}-${sessionId}-${sectionType}`, // Unique user ID per section
    });

    const suggestion = completion.choices[0]?.message?.content;

    if (!suggestion) {
      console.error(`❌ [${requestId}] No suggestion generated from OpenAI`);
      return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
    }

    // Content validation to ensure section-specific content
    const isContentAppropriate = validateSectionContent(sectionType, suggestion);
    
    if (!isContentAppropriate) {
      console.warn(`⚠️ [${requestId}] Generated content may not be specific to ${sectionType}`);
    }

    console.log(`✅ [${requestId}] AI suggestion generated successfully for ${sectionType}:`, {
      type,
      sectionType,
      suggestionLength: suggestion.length,
      preview: suggestion.substring(0, 100) + '...',
      sessionId,
      isContentAppropriate
    });

    console.log(`🔍 [${requestId}] Full AI Response for ${sectionType}:`, suggestion);

    return NextResponse.json({ 
      suggestion,
      requestId,
      sectionType,
      sessionId,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Error generating AI suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to validate if content is appropriate for the section
function validateSectionContent(sectionType: string, content: string): boolean {
  const contentLower = content.toLowerCase();
  
  // Define section-specific keywords that should be present
  const sectionKeywords: Record<string, string[]> = {
    'summary': ['experienced', 'professional', 'expertise', 'background', 'proven'],
    'functional-skills': ['leadership', 'management', 'strategic', 'planning', 'coordination'],
    'technical-skills': ['programming', 'development', 'technology', 'software', 'systems'],
    'areas-of-expertise': ['domain', 'industry', 'sector', 'specialization', 'expertise'],
    'education': ['degree', 'university', 'education', 'academic', 'study'],
    'certifications': ['certified', 'certification', 'credential', 'license', 'accredited'],
    'languages': ['language', 'fluent', 'proficient', 'native', 'conversational'],
    'experiences-summary': ['experience', 'role', 'position', 'company', 'employment']
  };
  
  const keywords = sectionKeywords[sectionType] || [];
  const hasRelevantKeywords = keywords.some(keyword => contentLower.includes(keyword));
  
  // Check for generic phrases that shouldn't be in specific sections
  const genericPhrases = [
    'comprehensive academic foundation',
    'providing theoretical knowledge',
    'all sections have the same content'
  ];
  
  const hasGenericContent = genericPhrases.some(phrase => contentLower.includes(phrase));
  
  return hasRelevantKeywords && !hasGenericContent;
} 