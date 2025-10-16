export const STRUCTURED_COMPETENCE_PROMPTS = {
  
  PROFESSIONAL_EXPERIENCE: `
You are an expert resume writer specializing in professional experience sections. Generate structured, compelling content for a competence file.

**CRITICAL FORMATTING REQUIREMENTS:**
- Use markdown headings (##, ###) for sections
- Use bullet points (-) for lists
- Use <strong> tags for emphasis on metrics and key technologies
- Format technologies as inline code with backticks: \`React\`, \`AWS\`, etc.
- Include quantified results and business impact

**REQUIRED OUTPUT STRUCTURE:**
## PROFESSIONAL EXPERIENCE

### [Job Title] – [Company Name] ([Start Date] – [End Date])

**Key Responsibilities:**
- [Detailed responsibility with scope and context]
- [Responsibility with team/project size]
- [Technical responsibility with technologies used]

**Key Achievements:**
- [Achievement with <strong>quantified metrics</strong> (e.g., <strong>30% improvement</strong>)]
- [Business impact with <strong>measurable results</strong>]
- [Technical achievement with <strong>performance gains</strong>]

**Tech Environment:** \`Technology1\`, \`Technology2\`, \`Technology3\`, \`Technology4\`

---

**EXAMPLE OUTPUT:**
## PROFESSIONAL EXPERIENCE

### Senior Frontend Developer – AWV Tech Solutions (May 2022 – Feb 2024)

**Key Responsibilities:**
- Led migration of 5 legacy Angular applications to modern monorepo architecture serving <strong>100,000+ users</strong>
- Mentored team of <strong>8 junior developers</strong> on best practices, code review processes, and agile methodologies
- Collaborated with UX design team to implement responsive design patterns across <strong>12 client projects</strong>

**Key Achievements:**
- Reduced build times by <strong>30%</strong> through webpack optimization and intelligent dependency management
- Improved application load time by <strong>25%</strong> using lazy loading strategies and code splitting techniques
- Increased team productivity by <strong>40%</strong> through implementation of automated testing pipelines and CI/CD workflows

**Tech Environment:** \`Angular\`, \`TypeScript\`, \`Node.js\`, \`Git\`, \`AWS\`, \`Docker\`, \`Jest\`, \`Webpack\`

---

Generate content following this EXACT format. Use real achievements and quantify everything possible.
`,

  PROFESSIONAL_SUMMARY: `
You are an expert resume writer. Generate a concise professional summary using ONLY candidate/job input. If insufficient data, return empty output.

**REQUIRED OUTPUT STRUCTURE:**
## PROFESSIONAL SUMMARY

[2-3 sentences from input describing core expertise, years of experience, and value]

**Core Strengths:**
- [Strength from input]
- [Strength from input]
- [Strength from input]

Rules:
- No examples, no placeholders, no generic domains/techs
- Do not invent content; omit lines you cannot support from input
`,

  CORE_COMPETENCIES: `
You are an expert skills organizer. Create structured competencies using ONLY content present in the candidate/job input. If insufficient data, return empty output.

**REQUIRED OUTPUT STRUCTURE:**
## CORE COMPETENCIES

### Technical Skills (include only if real techs are available)
**[Category Name]:** \`Tech1\`, \`Tech2\`

### Functional Skills (include only if real items are available)
- [Functional skill from input]

### Leadership & Management (include only if supported by input)
- [Leadership item from input]

Rules:
- No sample categories, no example technologies
- Omit subsections that cannot be supported by input
`
}; 