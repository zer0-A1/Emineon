'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { candidateFormSchema, type CandidateFormData } from '@/lib/validation';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Upload, 
  FileText, 
  Linkedin, 
  User, 
  MapPin, 
  Briefcase,
  GraduationCap,
  DollarSign,
  Calendar,
  Link as LinkIcon,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';

// Use the form-specific schema
const newCandidateSchema = candidateFormSchema;

type NewCandidateFormData = z.infer<typeof newCandidateSchema>;

// Form default values with required arrays and booleans
const formDefaultValues: NewCandidateFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: undefined,
  linkedinUrl: '',
  portfolioUrl: '',
  githubUrl: '',
  currentLocation: undefined,
  nationality: undefined,
  timezone: undefined,
  currentTitle: undefined,
  professionalHeadline: undefined,
  summary: undefined,
  seniorityLevel: undefined,
  primaryIndustry: undefined,
  functionalDomain: undefined,
  experienceYears: undefined,
  companies: undefined,
  technicalSkills: [],
  softSkills: [],
  toolsAndPlatforms: [],
  frameworks: [],
  programmingLanguages: [],
  spokenLanguages: [],
  methodologies: [],
  notableProjects: [],
  freelancer: false,
  degrees: [],
  certifications: [],
  universities: [],
  graduationYear: undefined,
  educationLevel: undefined,
  availableFrom: undefined,
  preferredContractType: undefined,
  expectedSalary: undefined,
  relocationWillingness: false,
  remotePreference: undefined,
  workPermitType: undefined,
  matchingScore: undefined,
  tags: [],
  archived: false,
  source: 'Manual Entry',
  recruiterNotes: [],
  interviewScores: undefined,
  videoInterviewUrl: '',
  culturalFitScore: undefined,
  motivationalFitNotes: undefined,
  referees: undefined,
  conversionStatus: undefined,
};

// Updated interface to match the CV parser service
interface ParsedData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  currentTitle?: string;
  currentCompany?: string;
  summary?: string;
  skills?: string[];
  experienceYears?: number;
  education?: {
    degree?: string;
    university?: string;
    year?: number;
  }[];
  workHistory?: {
    title?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];
  location?: {
    city?: string;
    country?: string;
  };
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
}

export default function NewCandidatePage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseMethod, setParseMethod] = useState<'none' | 'cv' | 'linkedin'>('none');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState(false);
  
  // State for different skill inputs
  const [technicalSkillsInput, setTechnicalSkillsInput] = useState('');
  const [softSkillsInput, setSoftSkillsInput] = useState('');
  const [frameworksInput, setFrameworksInput] = useState('');
  const [programmingLanguagesInput, setProgrammingLanguagesInput] = useState('');
  const [methodologiesInput, setMethodologiesInput] = useState('');
  const [toolsInput, setToolsInput] = useState('');
  const [spokenLanguagesInput, setSpokenLanguagesInput] = useState('');
  const [degreesInput, setDegreesInput] = useState('');
  const [certificationsInput, setCertificationsInput] = useState('');
  const [universitiesInput, setUniversitiesInput] = useState('');
  const [projectsInput, setProjectsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
    trigger,
  } = useForm<NewCandidateFormData>({
    resolver: zodResolver(newCandidateSchema),
    defaultValues: formDefaultValues,
  });

  // Drag and drop for CV upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setParseMethod('cv');
      setParseError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const parseCV = async () => {
    if (!uploadedFile) return;
    
    setIsParsing(true);
    setParseError(null);
    setParseSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('cv', uploadedFile);
      
      const token = await getToken();
      const response = await fetch('/api/candidates/parse-cv', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      const result = await response.json();
      console.log('CV parsing API response:', result);
      
      if (result.success && result.data) {
        console.log('Parsed CV data received:', result.data);
        fillFormWithParsedData(result.data);
        setParseSuccess(true);
        setTimeout(() => setParseSuccess(false), 5000);
      } else {
        console.error('CV parsing failed:', result.error);
        setParseError(result.error || 'Failed to parse CV');
      }
    } catch (error) {
      console.error('CV parsing error:', error);
      setParseError('Failed to parse CV. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const parseLinkedIn = async () => {
    if (!linkedinUrl.trim()) return;
    
    setIsParsing(true);
    setParseError(null);
    setParseSuccess(false);
    
    try {
      const token = await getToken();
      const response = await fetch('/api/candidates/parse-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ linkedinUrl }),
      });
      
      const result = await response.json();
      console.log('LinkedIn parsing API response:', result);
      
      if (result.success && result.data) {
        console.log('Parsed LinkedIn data received:', result.data);
        fillFormWithParsedData(result.data);
        setParseSuccess(true);
        setTimeout(() => setParseSuccess(false), 5000);
      } else {
        console.error('LinkedIn parsing failed:', result.error);
        setParseError(result.error || 'Failed to parse LinkedIn profile');
      }
    } catch (error) {
      console.error('LinkedIn parsing error:', error);
      setParseError('Failed to parse LinkedIn profile. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const fillFormWithParsedData = (data: ParsedData) => {
    console.log('Filling form with parsed data:', data);
    
    // Fill basic information
    if (data.firstName) setValue('firstName', data.firstName);
    if (data.lastName) setValue('lastName', data.lastName);
    if (data.email) setValue('email', data.email);
    if (data.phone) setValue('phone', data.phone);
    
    // Professional information
    if (data.currentTitle) setValue('currentTitle', data.currentTitle);
    if (data.summary) setValue('summary', data.summary);
    if (typeof data.experienceYears === 'number') setValue('experienceYears', data.experienceYears);
    
    // Skills - convert array to comma-separated string for input
    if (data.skills && data.skills.length > 0) {
      const skillsString = data.skills.join(', ');
      setTechnicalSkillsInput(skillsString);
      setValue('technicalSkills', data.skills);
    }
    
    // Location
    if (data.location?.city || data.location?.country) {
      const location = [data.location.city, data.location.country].filter(Boolean).join(', ');
      setValue('currentLocation', location);
    }
    
    // URLs
    if (data.linkedinUrl) setValue('linkedinUrl', data.linkedinUrl);
    if (data.portfolioUrl) setValue('portfolioUrl', data.portfolioUrl);
    if (data.githubUrl) setValue('githubUrl', data.githubUrl);
    
    // Set source based on parsing method
    const sourceValue = parseMethod === 'linkedin' ? 'LinkedIn' : 'CV Upload';
    setValue('source', sourceValue);
    
    // Force form validation and re-rendering
    trigger();
  };

  const onSubmit = async (data: NewCandidateFormData) => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      
      // Transform the form data to match API expectations
      const candidateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        currentTitle: data.currentTitle,
        currentLocation: data.currentLocation,
        summary: data.summary,
        experienceYears: data.experienceYears,
        technicalSkills: data.technicalSkills || [],
        softSkills: data.softSkills || [],
        toolsAndPlatforms: data.toolsAndPlatforms || [],
        frameworks: data.frameworks || [],
        programmingLanguages: data.programmingLanguages || [],
        spokenLanguages: data.spokenLanguages || [],
        methodologies: data.methodologies || [],
        notableProjects: data.notableProjects || [],
        freelancer: data.freelancer || false,
        degrees: data.degrees || [],
        certifications: data.certifications || [],
        universities: data.universities || [],
        graduationYear: data.graduationYear,
        educationLevel: data.educationLevel,
        linkedinUrl: data.linkedinUrl || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
        githubUrl: data.githubUrl || undefined,
        expectedSalary: data.expectedSalary,
        remotePreference: data.remotePreference,
        preferredContractType: data.preferredContractType,
        relocationWillingness: data.relocationWillingness || false,
        workPermitType: data.workPermitType,
        nationality: data.nationality,
        timezone: data.timezone,
        primaryIndustry: data.primaryIndustry,
        functionalDomain: data.functionalDomain,
        seniorityLevel: data.seniorityLevel,
        professionalHeadline: data.professionalHeadline,
        availableFrom: data.availableFrom,
        matchingScore: data.matchingScore,
        culturalFitScore: data.culturalFitScore,
        motivationalFitNotes: data.motivationalFitNotes,
        videoInterviewUrl: data.videoInterviewUrl,
        companies: data.companies,
        referees: data.referees,
        interviewScores: data.interviewScores,
        tags: data.tags || [],
        source: data.source,
        recruiterNotes: data.recruiterNotes || [],
        archived: data.archived || false,
        conversionStatus: data.conversionStatus,
      };

      const response = await api.candidates.create(candidateData as any, token || undefined);
      
      if (response.success) {
        router.push('/candidates');
      } else {
        throw new Error(response.error || 'Failed to create candidate');
      }
    } catch (error) {
      console.error('Error creating candidate:', error);
      alert('Failed to create candidate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearParseData = () => {
    setParseMethod('none');
    setUploadedFile(null);
    setLinkedinUrl('');
    setParseError(null);
    setParseSuccess(false);
  };

  // Helper functions for array field management
  const handleArrayFieldChange = (
    value: string, 
    setter: (value: string) => void, 
    fieldName: keyof NewCandidateFormData
  ) => {
    setter(value);
    const arrayValue = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue(fieldName, arrayValue as any);
  };

  const handleSkillsChange = (value: string) => {
    setTechnicalSkillsInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('technicalSkills', skillsArray);
  };

  const handleSoftSkillsChange = (value: string) => {
    setSoftSkillsInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('softSkills', skillsArray);
  };

  const handleFrameworksChange = (value: string) => {
    setFrameworksInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('frameworks', skillsArray);
  };

  const handleProgrammingLanguagesChange = (value: string) => {
    setProgrammingLanguagesInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('programmingLanguages', skillsArray);
  };

  const handleMethodologiesChange = (value: string) => {
    setMethodologiesInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('methodologies', skillsArray);
  };

  const handleToolsChange = (value: string) => {
    setToolsInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('toolsAndPlatforms', skillsArray);
  };

  const handleSpokenLanguagesChange = (value: string) => {
    setSpokenLanguagesInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('spokenLanguages', skillsArray);
  };

  const handleDegreesChange = (value: string) => {
    setDegreesInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('degrees', skillsArray);
  };

  const handleCertificationsChange = (value: string) => {
    setCertificationsInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('certifications', skillsArray);
  };

  const handleUniversitiesChange = (value: string) => {
    setUniversitiesInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('universities', skillsArray);
  };

  const handleProjectsChange = (value: string) => {
    setProjectsInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('notableProjects', skillsArray);
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('tags', skillsArray);
  };

  const handleNotesChange = (value: string) => {
    setNotesInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setValue('recruiterNotes', skillsArray);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link 
            href="/candidates" 
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-secondary-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary-900">Add New Candidate</h1>
            <p className="text-secondary-600 mt-1">
              Upload a CV, paste a LinkedIn URL, or enter candidate information manually
            </p>
          </div>
        </div>

        {/* Parsing Methods */}
        <Card variant="elevated">
          <CardHeader title="Import Candidate Information">
            <div></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Method Selection */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setParseMethod('cv')}
                  className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                    parseMethod === 'cv' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Upload CV/Resume</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setParseMethod('linkedin')}
                  className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                    parseMethod === 'linkedin' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Linkedin className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">LinkedIn URL</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setParseMethod('none')}
                  className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                    parseMethod === 'none' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Manual Entry</div>
                </button>
              </div>

              {/* CV Upload */}
              {parseMethod === 'cv' && (
                <div className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      isDragActive
                        ? 'border-blue-400 bg-blue-50'
                        : isDragReject
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          {isDragActive ? 'Drop your CV here' : 'Drag & drop your CV here'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          or click to browse (PDF, DOC, DOCX, TXT • Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {uploadedFile && (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={parseCV}
                        disabled={isParsing}
                        className="btn-primary flex items-center space-x-2"
                      >
                        {isParsing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Parsing CV...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            <span>Parse CV</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <X className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* LinkedIn URL */}
              {parseMethod === 'linkedin' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn Profile URL
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="flex-1 input-field"
                      />
                      <button
                        type="button"
                        onClick={parseLinkedIn}
                        disabled={isParsing || !linkedinUrl.trim()}
                        className="btn-primary flex items-center space-x-2"
                      >
                        {isParsing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Parsing...</span>
                          </>
                        ) : (
                          <>
                            <Linkedin className="h-4 w-4" />
                            <span>Parse</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Parse Status */}
              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <X className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{parseError}</p>
                    </div>
                  </div>
                </div>
              )}

              {parseSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm text-green-800">
                        Candidate information parsed successfully! Review and edit the form below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(parseMethod !== 'none' && (uploadedFile || linkedinUrl)) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearParseData}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear and start manual entry
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Candidate Information Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card variant="elevated">
            <CardHeader title="Basic Information">
              <User className="h-5 w-5 text-secondary-600" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 mb-2">
                    First Name *
                </label>
                <input
                    {...register('firstName')}
                  type="text"
                    id="firstName"
                  className="input-field"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    id="lastName"
                    className="input-field"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                  Email Address *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="input-field"
                    placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
                    Phone Number
                </label>
                <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className="input-field"
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card variant="elevated">
            <CardHeader title="Location">
              <MapPin className="h-5 w-5 text-secondary-600" />
            </CardHeader>
            <CardContent>
              <div>
                <label htmlFor="currentLocation" className="block text-sm font-medium text-secondary-700 mb-2">
                  Current Location
                </label>
                <input
                  {...register('currentLocation')}
                  type="text"
                  id="currentLocation"
                  className="input-field"
                  placeholder="San Francisco, CA, USA"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card variant="elevated">
            <CardHeader title="Professional Information">
              <Briefcase className="h-5 w-5 text-secondary-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label htmlFor="currentTitle" className="block text-sm font-medium text-secondary-700 mb-2">
                    Current Title
                  </label>
                  <input
                    {...register('currentTitle')}
                    type="text"
                    id="currentTitle"
                    className="input-field"
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <label htmlFor="professionalHeadline" className="block text-sm font-medium text-secondary-700 mb-2">
                    Professional Headline
                  </label>
                  <input
                    {...register('professionalHeadline')}
                    type="text"
                    id="professionalHeadline"
                    className="input-field"
                    placeholder="Senior Full-Stack Developer with 5+ years experience"
                  />
                </div>

                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-secondary-700 mb-2">
                    Professional Summary
                  </label>
                  <textarea
                    {...register('summary')}
                    id="summary"
                    rows={4}
                    className="input-field"
                    placeholder="Brief professional summary highlighting key experiences and achievements..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="experienceYears" className="block text-sm font-medium text-secondary-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      {...register('experienceYears', { valueAsNumber: true })}
                      type="number"
                      id="experienceYears"
                      min="0"
                      max="50"
                      className="input-field"
                      placeholder="5"
                    />
                    {errors.experienceYears && (
                      <p className="mt-1 text-sm text-error-600">{errors.experienceYears.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="seniorityLevel" className="block text-sm font-medium text-secondary-700 mb-2">
                      Seniority Level
                    </label>
                    <select
                      {...register('seniorityLevel')}
                      id="seniorityLevel"
                      className="input-field"
                    >
                      <option value="">Select level</option>
                      <option value="INTERN">Intern</option>
                      <option value="JUNIOR">Junior</option>
                      <option value="MID_LEVEL">Mid-Level</option>
                      <option value="SENIOR">Senior</option>
                      <option value="LEAD">Lead</option>
                      <option value="PRINCIPAL">Principal</option>
                      <option value="ARCHITECT">Architect</option>
                      <option value="DIRECTOR">Director</option>
                      <option value="VP">VP</option>
                      <option value="C_LEVEL">C-Level</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="primaryIndustry" className="block text-sm font-medium text-secondary-700 mb-2">
                      Primary Industry
                    </label>
                    <input
                      {...register('primaryIndustry')}
                      type="text"
                      id="primaryIndustry"
                      className="input-field"
                      placeholder="Technology, Finance, Healthcare"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="functionalDomain" className="block text-sm font-medium text-secondary-700 mb-2">
                    Functional Domain
                  </label>
                  <input
                    {...register('functionalDomain')}
                    type="text"
                    id="functionalDomain"
                    className="input-field"
                    placeholder="Frontend Development, Backend Engineering, DevOps"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    {...register('freelancer')}
                    type="checkbox"
                    id="freelancer"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor="freelancer" className="text-sm font-medium text-secondary-700">
                    Available for freelance work
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Technologies */}
          <Card variant="elevated">
            <CardHeader title="Skills & Technologies">
              <div className="h-5 w-5 text-secondary-600">🛠</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="technicalSkills" className="block text-sm font-medium text-secondary-700 mb-2">
                      Technical Skills
                    </label>
                    <input
                      type="text"
                      id="technicalSkills"
                      value={technicalSkillsInput}
                      onChange={(e) => handleSkillsChange(e.target.value)}
                  className="input-field"
                  placeholder="JavaScript, React, Node.js, TypeScript"
                />
                <p className="mt-1 text-xs text-secondary-500">
                  Separate skills with commas
                </p>
              </div>

              <div>
                    <label htmlFor="softSkills" className="block text-sm font-medium text-secondary-700 mb-2">
                      Soft Skills
                </label>
                <input
                      type="text"
                      id="softSkills"
                      value={softSkillsInput}
                      onChange={(e) => handleSoftSkillsChange(e.target.value)}
                      className="input-field"
                      placeholder="Leadership, Communication, Problem Solving"
                    />
                    <p className="mt-1 text-xs text-secondary-500">
                      Separate skills with commas
                    </p>
                  </div>

                  <div>
                    <label htmlFor="frameworks" className="block text-sm font-medium text-secondary-700 mb-2">
                      Frameworks
                    </label>
                    <input
                      type="text"
                      id="frameworks"
                      value={frameworksInput}
                      onChange={(e) => handleFrameworksChange(e.target.value)}
                      className="input-field"
                      placeholder="React, Angular, Vue.js, Express"
                    />
                    <p className="mt-1 text-xs text-secondary-500">
                      Separate frameworks with commas
                    </p>
                  </div>

                  <div>
                    <label htmlFor="programmingLanguages" className="block text-sm font-medium text-secondary-700 mb-2">
                      Programming Languages
                    </label>
                    <input
                      type="text"
                      id="programmingLanguages"
                      value={programmingLanguagesInput}
                      onChange={(e) => handleProgrammingLanguagesChange(e.target.value)}
                      className="input-field"
                      placeholder="JavaScript, Python, Java, Go"
                    />
                    <p className="mt-1 text-xs text-secondary-500">
                      Separate languages with commas
                    </p>
                  </div>

                  <div>
                    <label htmlFor="toolsAndPlatforms" className="block text-sm font-medium text-secondary-700 mb-2">
                      Tools & Platforms
                    </label>
                    <input
                      type="text"
                      id="toolsAndPlatforms"
                      value={toolsInput}
                      onChange={(e) => handleToolsChange(e.target.value)}
                      className="input-field"
                      placeholder="Docker, AWS, Git, Jenkins"
                    />
                    <p className="mt-1 text-xs text-secondary-500">
                      Separate tools with commas
                    </p>
                  </div>

                  <div>
                    <label htmlFor="methodologies" className="block text-sm font-medium text-secondary-700 mb-2">
                      Methodologies
                    </label>
                    <input
                      type="text"
                      id="methodologies"
                      value={methodologiesInput}
                      onChange={(e) => handleMethodologiesChange(e.target.value)}
                      className="input-field"
                      placeholder="Agile, Scrum, DevOps, TDD"
                    />
                    <p className="mt-1 text-xs text-secondary-500">
                      Separate methodologies with commas
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="spokenLanguages" className="block text-sm font-medium text-secondary-700 mb-2">
                    Spoken Languages
                  </label>
                  <input
                    type="text"
                    id="spokenLanguages"
                    value={spokenLanguagesInput}
                    onChange={(e) => handleSpokenLanguagesChange(e.target.value)}
                    className="input-field"
                    placeholder="English (Native), Spanish (Fluent), French (Conversational)"
                  />
                  <p className="mt-1 text-xs text-secondary-500">
                    Separate languages with commas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card variant="elevated">
            <CardHeader title="Work Experience">
              <Briefcase className="h-5 w-5 text-secondary-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label htmlFor="notableProjects" className="block text-sm font-medium text-secondary-700 mb-2">
                    Notable Projects
                  </label>
                  <input
                    type="text"
                    id="notableProjects"
                    value={projectsInput}
                    onChange={(e) => handleProjectsChange(e.target.value)}
                    className="input-field"
                    placeholder="E-commerce Platform, Mobile App, API Gateway"
                  />
                  <p className="mt-1 text-xs text-secondary-500">
                    Separate projects with commas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education & Certifications */}
          <Card variant="elevated">
            <CardHeader title="Education & Certifications">
              <GraduationCap className="h-5 w-5 text-secondary-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="degrees" className="block text-sm font-medium text-secondary-700 mb-2">
                      Degrees
                    </label>
                    <input
                      type="text"
                      id="degrees"
                      value={degreesInput}
                      onChange={(e) => handleDegreesChange(e.target.value)}
                      className="input-field"
                      placeholder="Bachelor of Computer Science, Master of Engineering"
                    />
                    <p className="mt-1 text-xs text-secondary-500">
                      Separate degrees with commas
                    </p>
                  </div>

                  <div>
                    <label htmlFor="universities" className="block text-sm font-medium text-secondary-700 mb-2">
                      Universities
                    </label>
                    <input
                      type="text"
                      id="universities"
                      value={universitiesInput}
                      onChange={(e) => handleUniversitiesChange(e.target.value)}
                      className="input-field"
                      placeholder="Stanford University, MIT"
                    />
                    <p className="mt-1 text-xs text-secondary-500">
                      Separate universities with commas
                    </p>
                  </div>

                  <div>
                    <label htmlFor="graduationYear" className="block text-sm font-medium text-secondary-700 mb-2">
                      Graduation Year
                    </label>
                    <input
                      {...register('graduationYear', { valueAsNumber: true })}
                  type="number"
                      id="graduationYear"
                      min="1950"
                      max="2030"
                      className="input-field"
                      placeholder="2020"
                    />
                  </div>

                  <div>
                    <label htmlFor="educationLevel" className="block text-sm font-medium text-secondary-700 mb-2">
                      Education Level
                    </label>
                    <select
                      {...register('educationLevel')}
                      id="educationLevel"
                      className="input-field"
                    >
                      <option value="">Select level</option>
                      <option value="HIGH_SCHOOL">High School</option>
                      <option value="ASSOCIATE">Associate Degree</option>
                      <option value="BACHELOR">Bachelor's Degree</option>
                      <option value="MASTER">Master's Degree</option>
                      <option value="PHD">PhD</option>
                      <option value="CERTIFICATION">Professional Certification</option>
                      <option value="BOOTCAMP">Bootcamp</option>
                      <option value="SELF_TAUGHT">Self-Taught</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="certifications" className="block text-sm font-medium text-secondary-700 mb-2">
                    Certifications
                  </label>
                  <input
                    type="text"
                    id="certifications"
                    value={certificationsInput}
                    onChange={(e) => handleCertificationsChange(e.target.value)}
                    className="input-field"
                    placeholder="AWS Certified Solutions Architect, Google Cloud Professional"
                  />
                  <p className="mt-1 text-xs text-secondary-500">
                    Separate certifications with commas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card variant="elevated">
            <CardHeader title="Personal Information">
              <User className="h-5 w-5 text-secondary-600" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-secondary-700 mb-2">
                    Nationality
                  </label>
                  <input
                    {...register('nationality')}
                    type="text"
                    id="nationality"
                    className="input-field"
                    placeholder="American, British, Canadian"
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-secondary-700 mb-2">
                    Timezone
                  </label>
                  <input
                    {...register('timezone')}
                    type="text"
                    id="timezone"
                    className="input-field"
                    placeholder="PST, EST, GMT+1"
                  />
                </div>

                <div>
                  <label htmlFor="workPermitType" className="block text-sm font-medium text-secondary-700 mb-2">
                    Work Permit Status
                  </label>
                  <input
                    {...register('workPermitType')}
                    type="text"
                    id="workPermitType"
                    className="input-field"
                    placeholder="US Citizen, H1B, Work Visa"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences & Compensation */}
          <Card variant="elevated">
            <CardHeader title="Preferences & Compensation">
              <DollarSign className="h-5 w-5 text-secondary-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="expectedSalary" className="block text-sm font-medium text-secondary-700 mb-2">
                      Expected Salary
                    </label>
                    <input
                      {...register('expectedSalary')}
                      type="text"
                      id="expectedSalary"
                      className="input-field"
                      placeholder="$100,000 - $120,000"
                    />
                  </div>

                  <div>
                    <label htmlFor="remotePreference" className="block text-sm font-medium text-secondary-700 mb-2">
                      Remote Work Preference
                    </label>
                    <select
                      {...register('remotePreference')}
                      id="remotePreference"
                      className="input-field"
                    >
                      <option value="">Select preference</option>
                      <option value="REMOTE">Remote</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="ONSITE">On-site</option>
                      <option value="FLEXIBLE">Flexible</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="preferredContractType" className="block text-sm font-medium text-secondary-700 mb-2">
                      Preferred Contract Type
                    </label>
                    <select
                      {...register('preferredContractType')}
                      id="preferredContractType"
                      className="input-field"
                    >
                      <option value="">Select type</option>
                      <option value="PERMANENT">Permanent</option>
                      <option value="FREELANCE">Freelance</option>
                      <option value="FIXED_TERM">Fixed Term</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERNSHIP">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="availableFrom" className="block text-sm font-medium text-secondary-700 mb-2">
                      Available From
                    </label>
                    <input
                      {...register('availableFrom', { valueAsDate: true })}
                      type="date"
                      id="availableFrom"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    {...register('relocationWillingness')}
                    type="checkbox"
                    id="relocationWillingness"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor="relocationWillingness" className="text-sm font-medium text-secondary-700">
                    Willing to relocate
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links & URLs */}
          <Card variant="elevated">
            <CardHeader title="Links & URLs">
              <LinkIcon className="h-5 w-5 text-secondary-600" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-secondary-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    {...register('linkedinUrl')}
                    type="url"
                    id="linkedinUrl"
                    className="input-field"
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>

                <div>
                  <label htmlFor="portfolioUrl" className="block text-sm font-medium text-secondary-700 mb-2">
                    Portfolio URL
                  </label>
                  <input
                    {...register('portfolioUrl')}
                    type="url"
                    id="portfolioUrl"
                    className="input-field"
                    placeholder="https://johndoe.dev"
                  />
                </div>

                <div>
                  <label htmlFor="githubUrl" className="block text-sm font-medium text-secondary-700 mb-2">
                    GitHub URL
                  </label>
                  <input
                    {...register('githubUrl')}
                    type="url"
                    id="githubUrl"
                    className="input-field"
                    placeholder="https://github.com/johndoe"
                  />
                </div>

                <div>
                  <label htmlFor="videoInterviewUrl" className="block text-sm font-medium text-secondary-700 mb-2">
                    Video Interview URL
                  </label>
                  <input
                    {...register('videoInterviewUrl')}
                    type="url"
                    id="videoInterviewUrl"
                    className="input-field"
                    placeholder="https://calendly.com/johndoe"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI & Scoring */}
          <Card variant="elevated">
            <CardHeader title="AI & Scoring">
              <div className="h-5 w-5 text-secondary-600">🤖</div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="matchingScore" className="block text-sm font-medium text-secondary-700 mb-2">
                    Matching Score (0-100)
                  </label>
                  <input
                    {...register('matchingScore', { valueAsNumber: true })}
                    type="number"
                    id="matchingScore"
                  min="0"
                    max="100"
                  className="input-field"
                    placeholder="85"
                />
              </div>

                <div>
                  <label htmlFor="culturalFitScore" className="block text-sm font-medium text-secondary-700 mb-2">
                    Cultural Fit Score (0-100)
                  </label>
                  <input
                    {...register('culturalFitScore', { valueAsNumber: true })}
                    type="number"
                    id="culturalFitScore"
                    min="0"
                    max="100"
                    className="input-field"
                    placeholder="90"
                  />
                </div>

                <div>
                  <label htmlFor="conversionStatus" className="block text-sm font-medium text-secondary-700 mb-2">
                    Conversion Status
                  </label>
                  <select
                    {...register('conversionStatus')}
                    id="conversionStatus"
                    className="input-field"
                  >
                    <option value="">Select status</option>
                    <option value="IN_PIPELINE">In Pipeline</option>
                    <option value="PLACED">Placed</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="motivationalFitNotes" className="block text-sm font-medium text-secondary-700 mb-2">
                  Motivational Fit Notes
                </label>
                <textarea
                  {...register('motivationalFitNotes')}
                  id="motivationalFitNotes"
                  rows={3}
                  className="input-field"
                  placeholder="Notes about candidate's motivation and cultural fit..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Meta Information */}
          <Card variant="elevated">
            <CardHeader title="Meta Information">
              <div className="h-5 w-5 text-secondary-600">📝</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-secondary-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    className="input-field"
                    placeholder="React Expert, Senior Developer, Remote Worker"
                  />
                  <p className="mt-1 text-xs text-secondary-500">
                    Separate tags with commas
                  </p>
                </div>

                <div>
                  <label htmlFor="source" className="block text-sm font-medium text-secondary-700 mb-2">
                    Source
                  </label>
                  <input
                    {...register('source')}
                    type="text"
                    id="source"
                    className="input-field"
                    placeholder="LinkedIn, Referral, Job Board"
                  />
                </div>

                <div>
                  <label htmlFor="recruiterNotes" className="block text-sm font-medium text-secondary-700 mb-2">
                    Recruiter Notes
                  </label>
                  <input
                    type="text"
                    id="recruiterNotes"
                    value={notesInput}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="input-field"
                    placeholder="Initial screening completed, Strong technical background"
                  />
                  <p className="mt-1 text-xs text-secondary-500">
                    Separate notes with commas
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    {...register('archived')}
                    type="checkbox"
                    id="archived"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor="archived" className="text-sm font-medium text-secondary-700">
                    Archive this candidate
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
              <div className="flex space-x-4 pt-6">
                <Link 
                  href="/candidates" 
                  className="flex-1 btn-secondary flex items-center justify-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Create Candidate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
      </div>
    </Layout>
  );
} 