export interface CandidateDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  currentTitle: string | null;
  currentLocation: string | null;
  summary: string | null;
  experienceYears: number | null;
  technicalSkills: string[];
  softSkills: string[];
  programmingLanguages: string[];
  frameworks: string[];
  toolsAndPlatforms: string[];
  methodologies: string[];
  educationLevel: string | null;
  universities: string[];
  degrees: string[];
  graduationYear: number | null;
  certifications: string[];
  expectedSalary: string | null;
  preferredContractType: string | null;
  freelancer: boolean;
  remotePreference: string | null;
  relocationWillingness: boolean;
  availableFrom: string | null;
  seniorityLevel: string | null;
  professionalHeadline: string | null;
  spokenLanguages: string[];
  primaryIndustry: string | null;
  functionalDomain: string | null;
  tags: string[];
  source: string | null;
  matchingScore: number | null;
  status: string;
  createdAt: string;
  lastUpdated: string;
}

export interface ListCandidatesInput {
  search?: string;
  limit?: number; // default 50
  offset?: number; // default 0
  sort?: 'createdAt' | 'lastUpdated';
  order?: 'asc' | 'desc';
  ids?: string[];
}

