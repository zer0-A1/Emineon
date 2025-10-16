import { OpenAI } from 'openai';
// Lazy import for Google Document AI to avoid bundling in edge contexts
let DocumentAI: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DocumentAI = require('@google-cloud/documentai');
} catch (_) {
  DocumentAI = null;
}
import { z } from 'zod';

// Complete schema matching all 80+ database fields
const CandidateSchema = z.object({
  // Basic Information
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().email().nullish(),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  dateOfBirth: z.string().nullish(),
  nationality: z.string().nullish(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).nullish(),
  timezone: z.string().nullish(),
  
  // Professional Profile
  currentTitle: z.string().nullish(),
  professionalHeadline: z.string().nullish(),
  currentCompany: z.string().nullish(),
  currentLocation: z.string().nullish(),
  summary: z.string().nullish(),
  experienceYears: z.number().min(0).max(50).nullish(),
  seniorityLevel: z.string().nullish(),
  
  // Skills (all 6 categories)
  technicalSkills: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  programmingLanguages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  toolsAndPlatforms: z.array(z.string()).default([]),
  methodologies: z.array(z.string()).default([]),
  
  // Additional skill categories
  databases: z.array(z.string()).default([]),
  cloudPlatforms: z.array(z.string()).default([]),
  operatingSystems: z.array(z.string()).default([]),
  
  // Education
  educationLevel: z.string().nullish(),
  universities: z.array(z.string()).default([]),
  degrees: z.array(z.string()).default([]),
  graduationYear: z.number().min(1950).max(2030).nullish(),
  education: z.array(z.object({
    degree: z.string().nullish(),
    institution: z.string().nullish(),
    year: z.number().nullish(),
    gpa: z.string().nullish(),
    fieldOfStudy: z.string().nullish()
  })).default([]),
  certifications: z.array(z.string()).default([]),
  
  // Work Preferences
  expectedSalary: z.string().nullish(),
  expectedSalaryMin: z.number().nullish(),
  expectedSalaryMax: z.number().nullish(),
  salaryCurrency: z.string().nullish(),
  preferredContractType: z.enum(['PERMANENT', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'PARTTIME']).nullish(),
  freelancer: z.boolean().nullish(),
  remotePreference: z.string().nullish(),
  relocationWillingness: z.boolean().nullish(),
  mobilityCountries: z.array(z.string()).default([]),
  mobilityCities: z.array(z.string()).default([]),
  workPermitType: z.string().nullish(),
  availableFrom: z.string().nullish(),
  noticePeriod: z.string().nullish(),
  
  // Industry & Experience
  primaryIndustry: z.string().nullish(),
  industries: z.array(z.string()).default([]),
  functionalDomain: z.string().nullish(),
  functionalExpertise: z.array(z.string()).default([]),
  
  // Online Presence
  linkedinUrl: z.string().nullish(),
  githubUrl: z.string().nullish(),
  portfolioUrl: z.string().nullish(),
  personalWebsite: z.string().nullish(),
  videoUrl: z.string().nullish(),
  otherUrls: z.array(z.string()).default([]),
  
  // Languages
  languages: z.array(z.union([
    z.string(),
    z.object({
      language: z.string().nullish(),
      name: z.string().nullish(),
      proficiency: z.string().nullish()
    })
  ])).default([]),
  nativeLanguage: z.string().nullish(),
  languageProficiencies: z.array(z.object({
    language: z.string().nullish(),
    proficiency: z.string().nullish(),
  })).default([]),
  
  // Work History
  workHistory: z.array(z.object({
    title: z.string(),
    company: z.string(),
    startDate: z.string().nullish(),
    endDate: z.string().nullish(),
    location: z.string().nullish(),
    description: z.string().nullish(),
    achievements: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
    teamSize: z.number().nullable(),
    reportingTo: z.string().nullable()
  })).default([]),
  
  // Projects
  projects: z.array(z.object({
    name: z.string(),
    description: z.string().nullish(),
    role: z.string().nullish(),
    technologies: z.array(z.string()).default([]),
    link: z.string().nullish(),
    duration: z.string().nullish(),
    teamSize: z.number().nullish()
  })).default([]),
  
  // Additional Information
  publications: z.array(z.string()).default([]),
  awards: z.array(z.object({
    title: z.string(),
    issuer: z.string().nullish(),
    date: z.string().nullish(),
    description: z.string().nullish()
  })).default([]),
  references: z.array(z.object({
    name: z.string(),
    title: z.string().nullish(),
    company: z.string().nullish(),
    email: z.string().email().nullish(),
    phone: z.string().nullish(),
    relationship: z.string().nullish()
  })).default([]),
  hobbies: z.array(z.string()).default([]),
  volunteerWork: z.array(z.object({
    organization: z.string(),
    role: z.string().nullish(),
    startDate: z.string().nullish(),
    endDate: z.string().nullish(),
    description: z.string().nullish()
  })).default([]),
  
  // Additional fields
  militaryService: z.boolean().nullish(),
  securityClearance: z.string().nullish(),
  drivingLicense: z.array(z.string()).default([]),
  emergencyContact: z.object({
    name: z.string().nullish(),
    phone: z.string().nullish(),
    relationship: z.string().nullish()
  }).nullish(),
  
  // Metadata
  lastUpdated: z.string().nullish(),
  source: z.string().nullish(),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullish()
});

export type ParsedCandidateData = z.infer<typeof CandidateSchema>;

export class EnhancedCVParserService {
  private openai: OpenAI | null = null;
  private useDocAI: boolean = process.env.USE_GOOGLE_DOCAI === 'true';
  // Canonical JSON Schema for Responses API strict output
  private static readonly candidateJsonSchema: any = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    additionalProperties: false,
    properties: {
      // Basic Information
      firstName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      lastName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      email: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      phone: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      address: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      dateOfBirth: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      nationality: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      gender: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      timezone: { anyOf: [{ type: 'string' }, { type: 'null' }] },

      // Professional Profile
      currentTitle: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      professionalHeadline: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      currentCompany: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      currentLocation: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      summary: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      experienceYears: { anyOf: [{ type: 'number' }, { type: 'null' }] },
      seniorityLevel: { anyOf: [{ type: 'string' }, { type: 'null' }] },

      // Skills
      technicalSkills: { type: 'array', items: { type: 'string' } },
      softSkills: { type: 'array', items: { type: 'string' } },
      programmingLanguages: { type: 'array', items: { type: 'string' } },
      frameworks: { type: 'array', items: { type: 'string' } },
      toolsAndPlatforms: { type: 'array', items: { type: 'string' } },
      methodologies: { type: 'array', items: { type: 'string' } },
      databases: { type: 'array', items: { type: 'string' } },
      cloudPlatforms: { type: 'array', items: { type: 'string' } },
      operatingSystems: { type: 'array', items: { type: 'string' } },

      // Education
      educationLevel: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      universities: { type: 'array', items: { type: 'string' } },
      degrees: { type: 'array', items: { type: 'string' } },
      graduationYear: { anyOf: [{ type: 'number' }, { type: 'null' }] },
      education: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            degree: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            institution: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            year: { anyOf: [{ type: 'number' }, { type: 'null' }] },
            gpa: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            fieldOfStudy: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
          required: ['degree', 'institution', 'year', 'gpa', 'fieldOfStudy']
        }
      },
      certifications: { type: 'array', items: { type: 'string' } },

      // Work Preferences
      expectedSalary: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      expectedSalaryMin: { anyOf: [{ type: 'number' }, { type: 'null' }] },
      expectedSalaryMax: { anyOf: [{ type: 'number' }, { type: 'null' }] },
      salaryCurrency: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      preferredContractType: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      freelancer: { anyOf: [{ type: 'boolean' }, { type: 'null' }] },
      remotePreference: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      relocationWillingness: { anyOf: [{ type: 'boolean' }, { type: 'null' }] },
      mobilityCountries: { type: 'array', items: { type: 'string' } },
      mobilityCities: { type: 'array', items: { type: 'string' } },
      workPermitType: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      availableFrom: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      noticePeriod: { anyOf: [{ type: 'string' }, { type: 'null' }] },

      // Industry & Experience
      primaryIndustry: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      industries: { type: 'array', items: { type: 'string' } },
      functionalDomain: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      functionalExpertise: { type: 'array', items: { type: 'string' } },

      // Online Presence
      linkedinUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      githubUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      portfolioUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      personalWebsite: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      videoUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      otherUrls: { type: 'array', items: { type: 'string' } },

      // Languages
      languages: { 
        type: 'array', 
        items: { 
          anyOf: [
            { type: 'string' },
            { 
              type: 'object',
              additionalProperties: false,
              properties: {
                language: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                proficiency: { anyOf: [{ type: 'string' }, { type: 'null' }] }
              },
              required: ['language','name','proficiency']
            }
          ] 
        } 
      },
      nativeLanguage: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      languageProficiencies: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            language: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            proficiency: { anyOf: [{ type: 'string' }, { type: 'null' }] }
          },
          required: ['language','proficiency']
        }
      },

      // Work History
      workHistory: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            company: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            startDate: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            endDate: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            location: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            achievements: { type: 'array', items: { type: 'string' } },
            technologies: { type: 'array', items: { type: 'string' } },
            teamSize: { anyOf: [{ type: 'number' }, { type: 'null' }] },
            reportingTo: { anyOf: [{ type: 'string' }, { type: 'null' }] }
          },
          required: ['title', 'company', 'startDate', 'endDate', 'location', 'description', 'achievements', 'technologies', 'teamSize', 'reportingTo']
        }
      },

      // Projects
      projects: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            role: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            technologies: { type: 'array', items: { type: 'string' } },
            link: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            duration: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            teamSize: { anyOf: [{ type: 'number' }, { type: 'null' }] }
          },
          required: ['name', 'description', 'role', 'technologies', 'link', 'duration', 'teamSize']
        }
      },

      // Additional Information
      publications: { type: 'array', items: { type: 'string' } },
      awards: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            issuer: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            date: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            description: { anyOf: [{ type: 'string' }, { type: 'null' }] }
          },
          required: ['title', 'issuer', 'date', 'description']
        }
      },
      references: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            company: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            email: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            phone: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            relationship: { anyOf: [{ type: 'string' }, { type: 'null' }] }
          },
          required: ['name', 'title', 'company', 'email', 'phone', 'relationship']
        }
      },
      hobbies: { type: 'array', items: { type: 'string' } },
      volunteerWork: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            organization: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            role: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            startDate: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            endDate: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            description: { anyOf: [{ type: 'string' }, { type: 'null' }] }
          },
          required: ['organization', 'role', 'startDate', 'endDate', 'description']
        }
      },

      // Additional fields
      militaryService: { anyOf: [{ type: 'boolean' }, { type: 'null' }] },
      securityClearance: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      drivingLicense: { type: 'array', items: { type: 'string' } },
      emergencyContact: {
        anyOf: [
          { type: 'null' },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              phone: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              relationship: { anyOf: [{ type: 'string' }, { type: 'null' }] }
            },
            required: ['name', 'phone', 'relationship']
          }
        ]
      },

      // Metadata
      lastUpdated: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      source: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      tags: { type: 'array', items: { type: 'string' } },
      notes: { anyOf: [{ type: 'string' }, { type: 'null' }] }
    },
    required: [
      // Basic Information
      'firstName','lastName','email','phone','address','dateOfBirth','nationality','gender','timezone',
      // Professional Profile
      'currentTitle','professionalHeadline','currentCompany','currentLocation','summary','experienceYears','seniorityLevel',
      // Skills
      'technicalSkills','softSkills','programmingLanguages','frameworks','toolsAndPlatforms','methodologies','databases','cloudPlatforms','operatingSystems',
      // Education
      'educationLevel','universities','degrees','graduationYear','education','certifications',
      // Work Preferences
      'expectedSalary','expectedSalaryMin','expectedSalaryMax','salaryCurrency','preferredContractType','freelancer','remotePreference','relocationWillingness','mobilityCountries','mobilityCities','workPermitType','availableFrom','noticePeriod',
      // Industry & Experience
      'primaryIndustry','industries','functionalDomain','functionalExpertise',
      // Online Presence
      'linkedinUrl','githubUrl','portfolioUrl','personalWebsite','videoUrl','otherUrls',
      // Languages
      'languages','nativeLanguage','languageProficiencies',
      // Work History
      'workHistory',
      // Projects
      'projects',
      // Additional Information
      'publications','awards','references','hobbies','volunteerWork',
      // Additional fields
      'militaryService','securityClearance','drivingLicense','emergencyContact',
      // Metadata
      'lastUpdated','source','tags','notes'
    ]
  };

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is required for CV parsing');
      }
      
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  async parseFromFile(fileBuffer: Buffer, fileName: string, mimeType?: string): Promise<ParsedCandidateData> {
    try {
      // Feature-flagged Google Document AI path (strict schema via Responses API; no text fallback)
      if (this.useDocAI && DocumentAI && process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_LOCATION && process.env.GOOGLE_DOCAI_PROCESSOR_ID) {
        console.log('Attempting CV parse using Google Document AI processor...');
        const text = await this.extractTextWithDocAI(fileBuffer);
        if (text && text.trim().length > 0) {
          console.log('Successfully extracted text with Document AI. Parsing with Responses API (json_schema strict).');
          const client = this.getOpenAI();
          const respDocAi: any = await (client as any).responses.create({
            model: 'gpt-4o-mini',
            input: [
              {
                role: 'user',
                content: [
                  { type: 'input_text', text: 'Extract a complete candidate profile from this CV text. Return strict JSON, null for unknown. Never invent.' },
                  { type: 'input_text', text }
                ]
              }
            ],
            text: {
              format: {
                type: 'json_schema',
                name: 'CandidateProfile',
                schema: EnhancedCVParserService.candidateJsonSchema,
                strict: true
              }
            },
            temperature: 0,
            max_output_tokens: 8192
          });
          const output = ((): string => {
            const r: any = respDocAi;
            if (!r) return '';
            if (typeof r.output_text === 'string' && r.output_text.trim()) return r.output_text.trim();
            if (Array.isArray(r.output)) {
              const parts: string[] = [];
              for (const out of r.output) {
                if (Array.isArray(out?.content)) {
                  for (const c of out.content) {
                    const t = c?.text || c?.output_text;
                    if (typeof t === 'string') parts.push(t);
                  }
                }
              }
              return parts.join('\n').trim();
            }
            return '';
          })();
          if (!output) throw new Error('Empty parse response (DocAI path)');
          const parsedDocAi = JSON.parse(output);
          const validatedDocAi = CandidateSchema.parse(parsedDocAi);
          return this.postProcessData(validatedDocAi);
        }
      }

      console.log('Attempting CV parse using OpenAI directly...');
      const client = this.getOpenAI();
      const base64File = fileBuffer.toString('base64');
      const dataUrl = `data:${mimeType || 'application/octet-stream'};base64,${base64File}`;

      // Single flow: Responses API with input_file and json_schema strict mode for ALL file types
      const resp: any = await (client as any).responses.create({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_file', filename: fileName, file_data: dataUrl },
              { type: 'input_text', text: 'Extract a complete candidate profile from this CV. Return strict JSON, null for unknown. Never invent.' }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'CandidateProfile',
            schema: EnhancedCVParserService.candidateJsonSchema,
            strict: true
          }
        },
        temperature: 0,
        max_output_tokens: 8192
      });

      // Responses API parsing (robust extraction)
      const extractOutputText = (r: any): string => {
        if (!r) return '';
        if (typeof r.output_text === 'string' && r.output_text.trim()) return r.output_text.trim();
        if (Array.isArray(r.output)) {
          const parts: string[] = [];
          for (const out of r.output) {
            if (Array.isArray(out?.content)) {
              for (const c of out.content) {
                const t = c?.text || c?.output_text;
                if (typeof t === 'string') parts.push(t);
              }
            }
          }
          return parts.join('\n').trim();
        }
        return '';
      };

      const rawText = extractOutputText(resp);
      if (!rawText) throw new Error('Empty parse response');

      // Strict parse only — no repair or text-based fallbacks
      const parsed: any = JSON.parse(rawText);
      const validated = CandidateSchema.parse(parsed);
      return this.postProcessData(validated);
      
    } catch (error) {
      console.error('CV parsing error:', error);
      throw new Error(`Failed to parse CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextWithDocAI(fileBuffer: Buffer): Promise<string> {
    const projectId = process.env.GOOGLE_PROJECT_ID as string;
    const location = process.env.GOOGLE_LOCATION as string; // e.g., 'eu' or 'us'
    const processorId = process.env.GOOGLE_DOCAI_PROCESSOR_ID as string;
    if (!DocumentAI) throw new Error('Document AI SDK not installed');
    const { DocumentProcessorServiceClient } = DocumentAI.v1;
    const client = new DocumentProcessorServiceClient();
    const name = client.processorPath(projectId, location, processorId);
    const request = {
      name,
      rawDocument: {
        content: fileBuffer.toString('base64'),
        mimeType: 'application/pdf', // DocAI accepts many types; pdf/docx/images auto-detected
      },
    } as any;
    const [result] = await client.processDocument(request);
    const doc = result.document;
    const text = (doc?.text as string) || '';
    return text;
  }

  async parseFromText(textContent: string): Promise<ParsedCandidateData> {
    try {
      const client = this.getOpenAI();
      
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert CV/Resume parser. Extract ALL information from the text and return it as a JSON object matching this exact schema:

${JSON.stringify(CandidateSchema.shape, null, 2)}

IMPORTANT RULES:
1. Extract EVERY piece of information you can find
2. For educationLevel, use ONLY: HIGH_SCHOOL, BACHELORS, MASTERS, PHD, or OTHER
3. For dates, use format: MM/YYYY or "Present" for current positions
4. Calculate experienceYears from work history
5. Categorize skills into the 6 main categories correctly
6. Extract salary expectations with currency
7. Parse all URLs completely
8. For missing fields, use null
9. Return ONLY valid JSON without any markdown formatting`
          },
          {
            role: 'user',
            content: textContent
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      const parsedData = JSON.parse(result);
      const validatedData = CandidateSchema.parse(parsedData);
      
      return this.postProcessData(validatedData);
      
    } catch (error) {
      console.error('Text parsing error:', error);
      throw new Error(`Failed to parse text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private postProcessData(data: ParsedCandidateData): ParsedCandidateData {
    // Normalize enums to our allowed uppercase values
    const mapSeniority = (val?: string | null) => {
      if (!val) return null;
      const v = String(val).toUpperCase().replace(/\s+/g, '_');
      const allowed = ['JUNIOR','MID_LEVEL','SENIOR','LEAD','EXECUTIVE'];
      return allowed.includes(v) ? (v as any) : null;
    };
    const mapEducation = (val?: string | null) => {
      if (!val) return null;
      const v = String(val).toUpperCase();
      const map: Record<string,string> = {
        "BACHELOR": 'BACHELORS',
        "BACHELOR'S": 'BACHELORS',
        "BSC": 'BACHELORS',
        "MSC": 'MASTERS',
        "MASTER": 'MASTERS',
        "MASTER'S": 'MASTERS',
        "DOCTORATE": 'PHD',
        "PH.D": 'PHD',
      };
      const normalized = map[v] || v;
      const allowed = ['HIGH_SCHOOL','BACHELORS','MASTERS','PHD','OTHER'];
      return allowed.includes(normalized) ? (normalized as any) : 'OTHER';
    };
    const mapProficiency = (val?: string | null) => {
      if (!val) return null;
      const v = String(val).toUpperCase().replace(/[^A-Z_]/g, ' ').replace(/\s+/g, ' ').trim();
      const synonyms: Record<string,string> = {
        'NATIVE': 'NATIVE', 'MOTHER TONGUE': 'NATIVE', 'MOTHER-TONGUE': 'NATIVE',
        'FLUENT': 'FLUENT', 'VERY GOOD': 'FLUENT', 'EXCELLENT': 'FLUENT',
        'ADVANCED': 'ADVANCED',
        'INTERMEDIATE': 'INTERMEDIATE', 'DAILY CONVERSATIONS': 'INTERMEDIATE',
        'BASIC': 'BASIC', 'BEGINNER': 'BASIC'
      };
      return synonyms[v] || null;
    };
    const mapRemotePreference = (val?: string | null) => {
      if (!val) return null;
      const v = String(val).toUpperCase();
      if (['REMOTE','HYBRID','ONSITE','FLEXIBLE'].includes(v)) return v as any;
      const map: Record<string,string> = {
        'YES': 'REMOTE',
        'NO': 'ONSITE',
      };
      return (map[v] as any) || null;
    };

    data.seniorityLevel = mapSeniority(data.seniorityLevel) as any;
    data.educationLevel = mapEducation(data.educationLevel) as any;

    if (Array.isArray(data.languageProficiencies)) {
      data.languageProficiencies = data.languageProficiencies.map(lp => ({
        language: (lp as any)?.language ?? null,
        proficiency: mapProficiency((lp as any)?.proficiency) as any,
      }));
    }

    data.remotePreference = mapRemotePreference(data.remotePreference) as any;

    if (typeof data.linkedinUrl === 'string' && data.linkedinUrl && !/^https?:\/\//i.test(data.linkedinUrl)) {
      data.linkedinUrl = `https://${data.linkedinUrl}`;
    }

    // Normalize languages to array of strings
    if (Array.isArray(data.languages)) {
      data.languages = data.languages
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            return item.language || item.name || undefined;
          }
          return undefined;
        })
        .filter((v: any) => typeof v === 'string' && v.trim().length > 0);
    } else {
      data.languages = [];
    }

    // Coerce optional education fields to safe values
    if (Array.isArray(data.education)) {
      data.education = data.education.map((e: any) => ({
        degree: e?.degree || '',
        institution: e?.institution || '',
        year: typeof e?.year === 'number' ? e.year : undefined,
        gpa: typeof e?.gpa === 'string' ? e.gpa : undefined,
        fieldOfStudy: typeof e?.fieldOfStudy === 'string' ? e.fieldOfStudy : undefined,
      }));
    }

    // Calculate experience years if not provided
    if (!data.experienceYears && data.workHistory.length > 0) {
      data.experienceYears = this.calculateExperienceYears(data.workHistory);
    }
    
    // Determine seniority level based on experience
    if (!data.seniorityLevel && data.experienceYears) {
      if (data.experienceYears < 2) data.seniorityLevel = 'JUNIOR';
      else if (data.experienceYears < 5) data.seniorityLevel = 'MID_LEVEL';
      else if (data.experienceYears < 10) data.seniorityLevel = 'SENIOR';
      else if (data.experienceYears < 15) data.seniorityLevel = 'LEAD';
      else data.seniorityLevel = 'EXECUTIVE';
    }
    
    // Extract current title and company from most recent work history
    if (data.workHistory.length > 0 && !data.currentTitle) {
      const currentJob = data.workHistory.find(job => 
        job.endDate === 'Present' || job.endDate === null
      ) || data.workHistory[0];
      
      if (currentJob) {
        data.currentTitle = data.currentTitle || currentJob.title;
        data.currentCompany = data.currentCompany || currentJob.company;
      }
    }
    
    // Clean and validate URLs
    const urlFields = ['linkedinUrl', 'githubUrl', 'portfolioUrl', 'personalWebsite', 'videoUrl'];
    urlFields.forEach(field => {
      const url = (data as any)[field];
      if (url && typeof url === 'string') {
        (data as any)[field] = this.cleanUrl(url);
      }
    });
    
    // Ensure unique values in arrays
    const arrayFields = [
      'technicalSkills', 'softSkills', 'programmingLanguages', 
      'frameworks', 'toolsAndPlatforms', 'methodologies',
      'universities', 'degrees', 'certifications', 'languages',
      'mobilityCountries', 'mobilityCities', 'industries',
      'functionalExpertise', 'tags', 'drivingLicense'
    ];
    
    arrayFields.forEach(field => {
      if (Array.isArray((data as any)[field])) {
        const unique: any[] = [];
        const seen = new Set<string>();
        for (const v of (data as any)[field] as any[]) {
          const key = typeof v === 'string' ? v : JSON.stringify(v);
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(v);
          }
        }
        (data as any)[field] = unique;
      }
    });
    
    // Add metadata
    data.lastUpdated = new Date().toISOString();
    data.source = data.source || 'cv_upload';
    
    return data;
  }

  private calculateExperienceYears(workHistory: any[]): number {
    let totalMonths = 0;
    const now = new Date();
    
    workHistory.forEach(job => {
      if (!job.startDate) return;
      
      const start = this.parseDate(job.startDate);
      const end = job.endDate === 'Present' || !job.endDate 
        ? now 
        : this.parseDate(job.endDate);
      
      if (start && end) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                      (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
      }
    });
    
    return Math.round(totalMonths / 12);
  }

  private parseDate(dateStr: string): Date | null {
    // Handle MM/YYYY format
    const match = dateStr.match(/(\d{1,2})\/(\d{4})/);
    if (match) {
      return new Date(parseInt(match[2]), parseInt(match[1]) - 1);
    }
    
    // Try parsing as regular date
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  private cleanUrl(url: string): string | null {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      return null;
    }
  }

  // Attempt to repair common JSON malformations: trailing commas, smart quotes, stray code fences
  private cleanJsonResponse(input: string): string {
    let s = input.trim();
    // Strip markdown fences
    s = s.replace(/^```(json)?/gi, '').replace(/```$/gi, '').trim();
    // Replace smart quotes with regular quotes
    s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    // Remove trailing commas before closing braces/brackets
    s = s.replace(/,\s*([}\]])/g, '$1');
    // Ensure it starts with { and ends with }
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start >= 0 && end > start) {
      s = s.slice(start, end + 1);
    }
    return s;
  }

  // Map parsed data to database fields
  mapToDatabase(parsed: ParsedCandidateData): any {
    return {
      // Basic Information
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      address: parsed.address,
      date_of_birth: parsed.dateOfBirth,
      nationality: parsed.nationality,
      gender: parsed.gender,
      timezone: parsed.timezone,
      
      // Professional Profile
      current_title: parsed.currentTitle,
      professional_headline: parsed.professionalHeadline,
      current_company: parsed.currentCompany,
      current_location: parsed.currentLocation,
      summary: parsed.summary,
      experience_years: parsed.experienceYears,
      seniority_level: parsed.seniorityLevel,
      
      // Skills
      technical_skills: parsed.technicalSkills,
      soft_skills: parsed.softSkills,
      programming_languages: parsed.programmingLanguages,
      frameworks: parsed.frameworks,
      tools_and_platforms: parsed.toolsAndPlatforms,
      methodologies: parsed.methodologies,
      databases: parsed.databases,
      cloud_platforms: parsed.cloudPlatforms,
      operating_systems: parsed.operatingSystems,
      
      // Education
      education_level: parsed.educationLevel,
      universities: parsed.universities,
      degrees: parsed.degrees,
      graduation_year: parsed.graduationYear,
      certifications: parsed.certifications,
      
      // Work Preferences
      expected_salary: parsed.expectedSalary,
      expected_salary_min: parsed.expectedSalaryMin,
      expected_salary_max: parsed.expectedSalaryMax,
      salary_currency: parsed.salaryCurrency,
      preferred_contract_type: parsed.preferredContractType,
      freelancer: parsed.freelancer,
      remote_preference: parsed.remotePreference,
      relocation_willingness: parsed.relocationWillingness,
      mobility_countries: parsed.mobilityCountries,
      mobility_cities: parsed.mobilityCities,
      work_permit_type: parsed.workPermitType,
      available_from: parsed.availableFrom,
      notice_period: parsed.noticePeriod,
      
      // Industry & Experience
      primary_industry: parsed.primaryIndustry,
      industries: parsed.industries,
      functional_domain: parsed.functionalDomain,
      functional_expertise: parsed.functionalExpertise,
      
      // Online Presence
      linkedin_url: parsed.linkedinUrl,
      github_url: parsed.githubUrl,
      portfolio_url: parsed.portfolioUrl,
      personal_website: parsed.personalWebsite,
      video_url: parsed.videoUrl,
      other_urls: parsed.otherUrls,
      
      // Languages
      spoken_languages: parsed.languages,
      native_language: parsed.nativeLanguage,
      language_proficiencies: parsed.languageProficiencies,
      
      // Complex fields as JSON
      education: parsed.education,
      work_history: parsed.workHistory,
      projects: parsed.projects,
      publications: parsed.publications,
      awards: parsed.awards,
      references: parsed.references,
      hobbies: parsed.hobbies,
      volunteer_work: parsed.volunteerWork,
      
      // Additional fields
      military_service: parsed.militaryService,
      security_clearance: parsed.securityClearance,
      driving_license: parsed.drivingLicense,
      emergency_contact: parsed.emergencyContact,
      
      // Metadata
      tags: parsed.tags,
      notes: parsed.notes,
      
      // System fields
      source: 'cv_upload',
      gdpr_consent: true,
      gdpr_consent_date: new Date(),
      updated_at: new Date()
    };
  }
}

export const enhancedCVParser = new EnhancedCVParserService();
