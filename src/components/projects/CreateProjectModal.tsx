// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import {
  X,
  ChevronDown,
  ChevronUp,
  Building2,
  MapPin,
  Calendar,
  Users,
  Plus,
  Minus,
  Briefcase,
  DollarSign,
  Clock,
  AlertCircle,
  Globe,
  Target,
  Mail,
  Phone,
  FileText,
  Sparkles,
  Copy,
  Loader2,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  Settings,
  Share2,
  Zap,
  Brain,
  UserPlus,
  Trash2,
  Type,
  Paperclip,
  Mic,
  Send,
  PenTool,
  Code
} from 'lucide-react';

// Enhanced project schema for the end-to-end workflow
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientContact: z.string().optional(),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  hiringManager: z.string().optional(),
  slaDate: z.string().optional(),
  vertical: z.string().optional(),
  totalPositions: z.number().min(1, 'At least one position is required'),
  urgencyLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budgetRange: z.string().optional(),
  hourlyRateMin: z.number().optional(),
  hourlyRateMax: z.number().optional(),
  currency: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  isHybrid: z.boolean().optional(),
  skillsRequired: z.array(z.string()).optional(),
  experienceRequired: z.array(z.string()).optional(),
  industryBackground: z.string().optional(),
  languageRequirements: z.array(z.string()).optional(),
  assignedRecruiter: z.string().optional(),
  internalNotes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  // Job positions within the project
  jobPositions: z.array(z.object({
    title: z.string().min(1, 'Job title is required')
  })).min(1, 'At least one job position is required')
});

// Project creation interfaces
interface JobData {
  title: string;
  company: string;
  location: string;
  description: string;
  contractType: string;
  workMode: string;
  startDate: string;
  salary: string;
  department: string;
  priority: string;
  owner: string;
  status: 'draft' | 'active';
  skills: string[];
}

interface JobPosition {
  id: string;
  title: string;
  level: string;
  count: number;
  urgency: string;
  skills: string[];
  isCompleted?: boolean;
}

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  emailData?: {
    emailContent: string;
    emailSubject: string;
    senderEmail: string;
  };
}

const urgencyLevels = [
  { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800' }
];

const priorityLevels = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' }
];

const currencies = ['EUR', 'USD', 'CHF', 'GBP'];

const verticals = [
  'Consulting',
  'Engineering', 
  'Information Technology',
  'Finance & Banking',
  'Healthcare & Life Sciences',
  'Manufacturing',
  'Retail & E-commerce',
  'Media & Entertainment',
  'Education',
  'Real Estate',
  'Legal',
  'Marketing & Advertising',
  'Human Resources',
  'Operations',
  'Sales',
  'Other'
];

const commonSkills = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js',
  'SQL', 'MongoDB', 'AWS', 'Azure', 'Docker', 'Kubernetes',
  'Machine Learning', 'Data Analysis', 'Project Management',
  'Agile', 'Scrum', 'DevOps', 'CI/CD', 'Git'
];

const commonLanguages = [
  'English', 'German', 'French', 'Spanish', 'Italian', 'Portuguese',
  'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish'
];

export function CreateProjectModal({ open, onClose, emailData }: CreateProjectModalProps) {
  const [currentStep, setCurrentStep] = useState<'basics' | 'roles' | 'skills' | 'timeline' | 'positions' | 'job-creation'>('basics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectType, setProjectType] = useState('recruitment');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [jobCreationStep, setJobCreationStep] = useState<'intake' | 'analysis' | 'review' | 'config'>('intake');
  const [isProcessingJob, setIsProcessingJob] = useState(false);
  const [currentJobData, setCurrentJobData] = useState<JobData>({
    title: '',
    company: '',
    location: '',
    description: '',
    contractType: 'full-time',
    workMode: 'hybrid',
    startDate: '',
    salary: '',
    department: '',
    priority: 'medium',
    owner: '',
    status: 'draft',
    skills: []
  });
  const [clientJobPositions, setClientJobPositions] = useState<string[]>([]);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
    reset
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      urgencyLevel: 'MEDIUM',
      priority: 'MEDIUM',
      currency: 'EUR',
      isRemote: false,
      isHybrid: false,
      skillsRequired: [] as string[],
      experienceRequired: [] as string[],
      languageRequirements: [] as string[],
      internalNotes: [] as string[],
      tags: [] as string[],
      jobPositions: [{
        title: ''
      }]
    }
  });

  const watchedValues = watch();
  const jobPositions = watch('jobPositions') || [];
  
  // Create positions array for job creation workflow
  const positions = jobPositions.map((position, index) => ({
    id: index,
    title: position.title,
    skills: [] // Will be populated during job creation
  }));
  
  // Get current form data for job creation
  const data = getValues();

  useEffect(() => {
    if (emailData && open) {
      parseEmailData();
    }
  }, [emailData, open]);

  const parseEmailData = useCallback(async () => {
    if (!emailData) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/projects/parse-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailContent: emailData.emailContent,
          emailSubject: emailData.emailSubject,
          senderEmail: emailData.senderEmail,
        }),
      });

      if (response.ok) {
        const parsedData = await response.json();
        
        // Populate form with parsed data
        Object.entries(parsedData).forEach(([key, value]) => {
          if (value && key !== 'id') {
            setValue(key as keyof ProjectFormData, value as any);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing email:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const addJobPosition = () => {
    const currentPositions = getValues('jobPositions');
    setValue('jobPositions', [...currentPositions, { title: '' }]);
  };

  const removeJobPosition = (index: number) => {
    const currentPositions = getValues('jobPositions');
    if (currentPositions.length > 1) {
      setValue('jobPositions', currentPositions.filter((_, i) => i !== index));
    }
  };

  const addSkill = (skill: string, field: 'skillsRequired' | 'experienceRequired' | 'languageRequirements') => {
    const currentSkills = getValues(field) || [];
    if (!currentSkills.includes(skill)) {
      setValue(field, [...currentSkills, skill]);
    }
  };

  const removeSkill = (skill: string, field: 'skillsRequired' | 'experienceRequired' | 'languageRequirements') => {
    const currentSkills = getValues(field) || [];
    setValue(field, currentSkills.filter(s => s !== skill));
  };

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const projectData = {
        ...data,
        createdJobs: jobPositions
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const result = await response.json();
        handleClose();
        // Optionally show success notification or redirect
      } else {
        console.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep('basics');
    setCurrentJobIndex(0);
    setJobCreationStep('intake');
    setCurrentJobData({
      title: '',
      company: '',
      location: '',
      description: '',
      contractType: 'full-time',
      workMode: 'hybrid',
      startDate: '',
      salary: '',
      department: '',
      priority: 'medium',
      owner: '',
      status: 'draft',
      skills: []
    });
    setClientJobPositions([]);
    setIsProcessingJob(false);
    onClose();
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep === 'basics') setCurrentStep('roles');
    else if (currentStep === 'roles') setCurrentStep('skills');
    else if (currentStep === 'skills') setCurrentStep('timeline');
    else if (currentStep === 'timeline') setCurrentStep('positions');
    else if (currentStep === 'positions') setCurrentStep('job-creation');
  };

  const prevStep = () => {
    if (currentStep === 'positions') setCurrentStep('timeline');
    else if (currentStep === 'job-creation') setCurrentStep('positions');
    else if (currentStep === 'timeline') setCurrentStep('skills');
    else if (currentStep === 'skills') setCurrentStep('roles');
    else if (currentStep === 'roles') setCurrentStep('basics');
  };

  // Job creation workflow functions
  const startJobCreation = () => {
    setCurrentStep('job-creation');
    setCurrentJobIndex(0);
    setJobCreationStep('intake');
    setCurrentJobData({
      title: positions[0]?.title || '',
      description: '',
      location: data.location || '',
      skills: [...(data.skillsRequired || [])],
      company: data.clientName || '',
      contractType: 'full-time',
      workMode: 'hybrid',
      startDate: '',
      salary: '',
      department: '',
      priority: 'medium',
      owner: '',
      status: 'draft'
    });
  };

  const processJobWithAI = async () => {
    setIsProcessingJob(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract information from job description
    const description = currentJobData?.description || '';
    const extractedData = {
      ...currentJobData,
      title: extractJobTitle(description) || currentJobData?.title,
      location: extractJobLocation(description) || data.location,
      skills: [...(data.skillsRequired || []), ...extractJobSkills(description)],
      workMode: extractWorkMode(description),
      requirements: extractRequirements(description)
    };

    setCurrentJobData(extractedData);
    setIsProcessingJob(false);
    setJobCreationStep('analysis');
  };

  const skipAIAnalysis = () => {
    setJobCreationStep('analysis');
  };

  const continueToReview = () => {
    setJobCreationStep('review');
  };

  const continueToConfiguration = () => {
    setJobCreationStep('config');
  };

  const saveJobAndContinue = () => {
    // Save current job to created jobs array
    const jobToSave = {
      ...currentJobData,
      positionIndex: currentJobIndex,
      positionTitle: positions[currentJobIndex]?.title
    };
    
    setClientJobPositions(prev => [...prev, jobToSave.title]);

    // Move to next job or complete
    if (currentJobIndex < positions.length - 1) {
      const nextIndex = currentJobIndex + 1;
      setCurrentJobIndex(nextIndex);
      setJobCreationStep('intake');
      setCurrentJobData({
        title: positions[nextIndex]?.title || '',
        description: '',
        location: data.location || '',
        skills: [...(data.skillsRequired || [])],
        company: data.clientName || ''
      });
    } else {
      // All jobs completed, go to review
      setCurrentStep('review');
    }
  };

  // Helper functions for AI extraction
  const extractJobTitle = (text: string): string => {
    // Simple extraction logic - in real implementation, use AI
    const lines = text.split('\n');
    return lines[0]?.trim() || '';
  };

  const extractJobLocation = (text: string): string => {
    const locationKeywords = ['location', 'based in', 'office in', 'remote', 'hybrid'];
    // Simple extraction logic
    return 'Remote';
  };

  const extractJobSkills = (text: string): string[] => {
    const skillKeywords = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
    return skillKeywords.slice(0, 5); // Limit to 5 skills
  };

  const extractWorkMode = (text: string): string => {
    if (text.toLowerCase().includes('remote')) return 'remote';
    if (text.toLowerCase().includes('hybrid')) return 'hybrid';
    return 'on-site';
  };

  const extractRequirements = (text: string): string[] => {
    // Extract requirements from text
    return ['Bachelor\'s degree', '3+ years experience', 'Strong communication skills'];
  };

  // Fix the onChange handlers with proper typing
  const updateJobData = (field: keyof JobData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCurrentJobData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addSkillToJobData = (skill: string) => {
    setCurrentJobData((prev) => ({ 
      ...prev, 
      skills: [...prev.skills, skill]
    }));
  };

  const removeSkillFromJobData = (skillIndex: number) => {
    setCurrentJobData((prev) => ({ 
      ...prev, 
      skills: prev.skills.filter((_, index) => index !== skillIndex)
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">New Project</h2>
              <p className="text-gray-600">Create individual job postings</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 ${currentStep === 'basics' ? 'text-primary-600' : (currentStep === 'roles' || currentStep === 'skills' || currentStep === 'timeline' || currentStep === 'positions' || currentStep === 'job-creation') ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'basics' ? 'bg-primary-100 text-primary-600' : (currentStep === 'roles' || currentStep === 'skills' || currentStep === 'timeline' || currentStep === 'positions' || currentStep === 'job-creation') ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {(currentStep === 'positions' || currentStep === 'job-creation') ? <CheckCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <span className="font-medium">Details</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep === 'roles' ? 'text-primary-600' : (currentStep === 'skills' || currentStep === 'timeline' || currentStep === 'positions' || currentStep === 'job-creation') ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'roles' ? 'bg-primary-100 text-primary-600' : (currentStep === 'skills' || currentStep === 'timeline' || currentStep === 'positions' || currentStep === 'job-creation') ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {(currentStep === 'skills' || currentStep === 'job-creation') ? <CheckCircle className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              </div>
              <span className="font-medium">Positions</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep === 'skills' ? 'text-primary-600' : currentStep === 'timeline' || currentStep === 'positions' || currentStep === 'job-creation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'skills' ? 'bg-primary-100 text-primary-600' : (currentStep === 'timeline' || currentStep === 'positions' || currentStep === 'job-creation') ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {currentStep === 'job-creation' ? <CheckCircle className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
              </div>
              <span className="font-medium">Job Creation</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep === 'timeline' || currentStep === 'positions' || currentStep === 'job-creation' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'timeline' || currentStep === 'positions' || currentStep === 'job-creation' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                <Eye className="h-4 w-4" />
              </div>
              <span className="font-medium">Review</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Project Details */}
            {currentStep === 'basics' && (
              <div className="space-y-6">
                {emailData && isAnalyzing && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-700">Analyzing email content...</span>
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <Input
                      {...register('name')}
                      placeholder="e.g., DataFlow Innovations - Data Engineers"
                      className={errors.name ? 'border-red-300' : ''}
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client/Company *
                    </label>
                    <Input
                      {...register('clientName')}
                      placeholder="e.g., DataFlow Innovations"
                      className={errors.clientName ? 'border-red-300' : ''}
                    />
                    {errors.clientName && (
                      <p className="text-red-600 text-sm mt-1">{errors.clientName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Positions *
                    </label>
                    <Input
                      type="number"
                      {...register('totalPositions', { valueAsNumber: true })}
                      min="1"
                      placeholder="5"
                      className={errors.totalPositions ? 'border-red-300' : ''}
                    />
                    {errors.totalPositions && (
                      <p className="text-red-600 text-sm mt-1">{errors.totalPositions.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <Input
                      {...register('location')}
                      placeholder="e.g., Carouge, Geneva"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency Level
                    </label>
                    <select
                      {...register('urgencyLevel')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {urgencyLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {priorityLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description
                  </label>
                  <Textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Describe the project, context, and objectives..."
                  />
                </div>

                {/* Work Arrangement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Work Arrangement
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('isRemote')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Remote Work Available</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('isHybrid')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Hybrid Work Available</span>
                    </label>
                  </div>
                </div>

                {/* Advanced Options */}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep('roles')}
                    className="flex items-center space-x-2"
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span>Advanced Options</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Job Positions */}
            {currentStep === 'roles' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Job Positions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addJobPosition}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Position</span>
                  </Button>
                </div>

                <div className="space-y-4">
                  {jobPositions.map((position, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Job Title *
                          </label>
                          <Input
                            {...register(`jobPositions.${index}.title`)}
                            placeholder="e.g., Senior Data Engineer"
                            className="max-w-md"
                          />
                        </div>
                        {jobPositions.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeJobPosition(index)}
                            className="text-red-600 hover:text-red-700 ml-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Next Steps</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        After defining your positions, you'll go through a detailed job creation process for each role. This includes AI-powered job description creation, requirements analysis, and configuration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Job Creation Workflow */}
            {currentStep === 'job-creation' && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">
                        Creating Job {currentJobIndex + 1} of {jobPositions.length}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {jobPositions[currentJobIndex]?.title}
                      </p>
                    </div>
                    <div className="text-sm text-blue-600">
                      {jobPositions.length} of {jobPositions.length} completed
                    </div>
                  </div>
                  
                  {/* Job Creation Progress */}
                  <div className="flex items-center space-x-2 mt-4">
                    {['intake', 'analysis', 'review', 'config'].map((step, index) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          jobCreationStep === step ? 'bg-blue-600 text-white' :
                          ['intake', 'analysis', 'review', 'config'].indexOf(jobCreationStep) > index ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {['intake', 'analysis', 'review', 'config'].indexOf(jobCreationStep) > index ? 
                            <CheckCircle className="w-4 h-4" /> : 
                            index + 1
                          }
                        </div>
                        <span className={`ml-2 text-sm ${
                          jobCreationStep === step ? 'text-blue-600 font-medium' :
                          ['intake', 'analysis', 'review', 'config'].indexOf(jobCreationStep) > index ? 'text-green-600' :
                          'text-gray-400'
                        }`}>
                          {step === 'intake' && 'Smart Intake'}
                          {step === 'analysis' && 'Smart Analysis'}
                          {step === 'review' && 'Review & Edit'}
                          {step === 'config' && 'Configure & Publish'}
                        </span>
                        {index < 3 && <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Smart Intake */}
                {jobCreationStep === 'intake' && (
                  <div className="space-y-4">
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        AI-Powered Job Description Creation
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Describe the role or paste an existing job description. Our AI will help create a comprehensive job posting.
                      </p>
                      <Textarea
                        placeholder={`Describe the ${jobPositions[currentJobIndex]?.title} position, requirements, responsibilities, and any specific details...`}
                        rows={6}
                        className="mb-4"
                        value={currentJobData?.description || ''}
                        onChange={updateJobData('description')}
                      />
                      <div className="flex justify-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={skipAIAnalysis}
                        >
                          Skip AI Analysis
                        </Button>
                        <Button
                          type="button"
                          onClick={processJobWithAI}
                          disabled={!currentJobData?.description || isProcessingJob}
                          className="bg-primary-600 hover:bg-primary-700 text-white"
                        >
                          {isProcessingJob ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 mr-2" />
                              Analyze with AI
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Job Creation Footer for Intake */}
                    <div className="flex justify-between pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep('roles')}
                      >
                        Back to Positions
                      </Button>
                      <div className="flex space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={skipAIAnalysis}
                        >
                          Skip AI Analysis
                        </Button>
                        <Button
                          type="button"
                          onClick={processJobWithAI}
                          disabled={!currentJobData?.description || isProcessingJob}
                          className="bg-primary-600 hover:bg-primary-700 text-white"
                        >
                          {isProcessingJob ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              Analyze with AI
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Smart Analysis */}
                {jobCreationStep === 'analysis' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-medium text-green-900">Analysis Complete</h3>
                      </div>
                      <p className="text-green-700 mb-4">
                        AI has successfully analyzed the job description and extracted key information.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-800">Job Title:</span> {currentJobData?.title}
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Company:</span> {currentJobData?.company}
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Location:</span> {currentJobData?.location || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Work Mode:</span> {currentJobData?.workMode}
                        </div>
                      </div>
                      {currentJobData?.skills && currentJobData.skills.length > 0 && (
                        <div className="mt-4">
                          <span className="font-medium text-green-800">Skills:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {currentJobData.skills.map((skill: any, index: any) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                                          <div className="flex justify-between pt-6 border-t border-gray-200">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setJobCreationStep('intake')}
                        >
                          Back to Intake
                        </Button>
                        <Button
                          type="button"
                          onClick={continueToReview}
                          className="bg-primary-600 hover:bg-primary-700 text-white"
                        >
                          Continue to Review
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                  </div>
                )}

                {/* Review & Edit */}
                {jobCreationStep === 'review' && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">Analysis completed! Review and edit the extracted information below.</span>
                      </div>
                    </div>

                    {/* Template Fields */}
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <Settings className="h-5 w-5 text-primary-600" />
                          <span>Template Fields</span>
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">Select which fields to include in your job posting template:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            'title', 'company', 'location', 'contractType', 'workMode', 
                            'department', 'salary', 'description', 'skills', 'languages', 
                            'startDate', 'duration', 'priority'
                          ].map((field) => (
                            <label key={field} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                defaultChecked={true}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Style Customization */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <Type className="h-5 w-5 text-primary-600" />
                            <span>Style Customization</span>
                          </h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                          >
                            Customize Style
                          </Button>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p className="mb-2">Current style: <span className="font-medium">Tech Startup</span></p>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: '#0A2F5A' }}
                              />
                              <span className="text-xs">Primary Color</span>
                            </div>
                            <div className="text-xs" style={{ fontFamily: 'Inter' }}>
                              Inter Font
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Basic Information */}
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <Briefcase className="h-5 w-5 text-primary-600" />
                          <span>Basic Information</span>
                        </h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                            <input
                              type="text"
                              value={currentJobData?.title || ''}
                              onChange={updateJobData('title')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., Senior Software Engineer"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                            <input
                              type="text"
                              value={currentJobData?.company || data.clientName || ''}
                              onChange={updateJobData('company')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., TechCorp AG"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                            <input
                              type="text"
                              value={currentJobData?.location || data.location || ''}
                              onChange={updateJobData('location')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., Zurich, Switzerland"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type *</label>
                            <select
                              value={currentJobData?.contractType || 'permanent'}
                              onChange={updateJobData('contractType')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="permanent">Permanent</option>
                              <option value="freelance">Freelance</option>
                              <option value="fixed-term">Fixed-term</option>
                              <option value="internship">Internship</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
                            <select
                              value={currentJobData?.workMode || 'hybrid'}
                              onChange={updateJobData('workMode')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="hybrid">Hybrid</option>
                              <option value="remote">Remote</option>
                              <option value="on-site">On-site</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                            <input
                              type="date"
                              value={currentJobData?.startDate || ''}
                              onChange={updateJobData('startDate')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                            <input
                              type="text"
                              value={currentJobData?.salary || ''}
                              onChange={updateJobData('salary')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., CHF 80k - 120k"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select
                              value={currentJobData?.department || data.vertical || ''}
                              onChange={updateJobData('department')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="">Select Department</option>
                              <option value="Technology">Technology</option>
                              <option value="Product">Product</option>
                              <option value="Design">Design</option>
                              <option value="Marketing">Marketing</option>
                              <option value="Sales">Sales</option>
                              <option value="Data & Analytics">Data & Analytics</option>
                              <option value="Operations">Operations</option>
                              <option value="Finance">Finance</option>
                              <option value="Human Resources">Human Resources</option>
                              <option value="Legal">Legal</option>
                              <option value="Customer Success">Customer Success</option>
                              <option value="Business Development">Business Development</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                            <textarea
                              value={currentJobData?.description || ''}
                              onChange={updateJobData('description')}
                              rows={8}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Describe the role, responsibilities, and requirements..."
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Additional Details */}
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <Target className="h-5 w-5 text-primary-600" />
                          <span>Additional Details</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                              value={currentJobData?.priority || 'medium'}
                              onChange={updateJobData('priority')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Owner *</label>
                            <input
                              type="text"
                              value={currentJobData?.owner || 'David V'}
                              onChange={updateJobData('owner')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., Sarah Johnson"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Required Skills */}
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <Code className="h-5 w-5 text-primary-600" />
                          <span>Required Skills</span>
                        </h4>
                        <div className="space-y-3">
                          {/* Display current skills */}
                          <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-300 rounded-lg bg-gray-50">
                            {(currentJobData?.skills || []).length > 0 ? (
                              // @ts-ignore
                              (currentJobData?.skills || []).map((skill, index) => (
                                <span 
                                  key={index} 
                                  className="flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                                >
                                  <span>{skill}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      // @ts-ignore
                                      const newSkills = (currentJobData?.skills || []).filter((_, i) => i !== index);
                                      setCurrentJobData((prev: any) => ({ ...prev, skills: newSkills }));
                                    }}
                                    className="ml-1 text-primary-600 hover:text-primary-800"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">No skills added yet</span>
                            )}
                          </div>
                          
                          {/* Add new skill input */}
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Add a skill (e.g., React, Python, Leadership)"
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const value = (e.target as HTMLInputElement).value.trim();
                                  if (value) {
                                    const currentSkills = currentJobData?.skills || [];
                                    if (!currentSkills.includes(value)) {
                                      setCurrentJobData((prev: any) => ({ ...prev, skills: [...currentSkills, value] }));
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={(e) => {
                                const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                                const value = input.value.trim();
                                if (value) {
                                  const currentSkills = currentJobData?.skills || [];
                                  if (!currentSkills.includes(value)) {
                                    setCurrentJobData((prev: any) => ({ ...prev, skills: [...currentSkills, value] }));
                                    input.value = '';
                                  }
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Suggested skills from job description */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-600">Suggested skills from job description:</span>
                            <div className="flex flex-wrap gap-2">
                              {['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Kubernetes', 'Agile', 'REST API', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Microservices', 'CI/CD', 'UX/UI']
                                .filter(skill => !(currentJobData?.skills || []).includes(skill))
                                .map((skill, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={(e) => {
                                      const currentSkills = currentJobData?.skills || [];
                                      setCurrentJobData((prev: any) => ({ ...prev, skills: [...currentSkills, skill] }));
                                    }}
                                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-100 transition-colors"
                                  >
                                    + {skill}
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Preview & Download Section */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                              <Eye className="h-5 w-5 text-primary-600" />
                              <span>Preview & Download</span>
                            </h4>
                          </div>
                          
                          {/* Company Logo Section */}
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700">Company Logo:</span>
                            <div className="h-12 w-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-gray-400" />
                            </div>
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Upload Logo
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Job Description
                          </Button>
                          <p className="text-sm text-gray-600 text-center">
                            Preview your job description with logo and selected fields before downloading
                          </p>
                          
                          <div className="flex justify-center space-x-3">
                            <span className="text-sm font-medium text-gray-700">Quick Download:</span>
                            <Button type="button" variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                            <Button type="button" variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Word
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setJobCreationStep('analysis')}
                      >
                        Back to Analysis
                      </Button>
                      
                      <div className="flex space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            // Save as draft and continue
                            const jobData = { ...currentJobData, status: 'draft' };
                            setCurrentJobData(jobData);
                            setJobCreationStep('config');
                          }}
                        >
                          Save as Draft
                        </Button>
                        <Button
                          type="button"
                          onClick={continueToConfiguration}
                          disabled={!currentJobData?.title}
                          className="bg-primary-600 hover:bg-primary-700 text-white"
                        >
                          Configure & Publish
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configure & Publish */}
                {jobCreationStep === 'config' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Settings className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">Configure & Publish Job</h3>
                          <p className="text-blue-700 text-sm">
                            Final step: Configure job settings and choose publication options
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-3">
                          <h4 className="font-medium text-blue-900">Job Details</h4>
                          <div><span className="text-blue-700">Title:</span> <span className="font-medium">{currentJobData?.title}</span></div>
                          <div><span className="text-blue-700">Company:</span> <span className="font-medium">{currentJobData?.company}</span></div>
                          <div><span className="text-blue-700">Location:</span> <span className="font-medium">{currentJobData?.location}</span></div>
                          <div><span className="text-blue-700">Work Mode:</span> <span className="font-medium">{currentJobData?.workMode}</span></div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-medium text-blue-900">Publication Settings</h4>
                          <div><span className="text-blue-700">Status:</span> <span className="font-medium">{currentJobData?.status === 'active' ? 'Will Publish' : 'Save as Draft'}</span></div>
                          <div><span className="text-blue-700">Priority:</span> <span className="font-medium capitalize">{currentJobData?.priority || 'medium'}</span></div>
                          <div><span className="text-blue-700">Owner:</span> <span className="font-medium">{currentJobData?.owner}</span></div>
                          <div><span className="text-blue-700">Skills:</span> <span className="font-medium">{(currentJobData?.skills || []).length} skills</span></div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-3">Publication Options</h4>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="jobStatus"
                              value="draft"
                              checked={currentJobData?.status !== 'active'}
                              onChange={() => setCurrentJobData((prev: any) => ({ ...prev, status: 'draft' }))}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-gray-900">Save as Draft</div>
                              <div className="text-sm text-gray-600">Job will be saved but not published. You can publish it later.</div>
                            </div>
                          </label>
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="jobStatus"
                              value="active"
                              checked={currentJobData?.status === 'active'}
                              onChange={() => setCurrentJobData((prev: any) => ({ ...prev, status: 'active' }))}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-gray-900">Publish Immediately</div>
                              <div className="text-sm text-gray-600">Job will be published and made available to candidates right away.</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setJobCreationStep('review')}
                      >
                        Back to Review
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={saveJobAndContinue}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {currentJobIndex < jobPositions.length - 1 ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Save & Continue to Next Job
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Save & Complete All Jobs
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review & Publish */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Project Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {watchedValues.name}</div>
                        <div><span className="font-medium">Client:</span> {watchedValues.clientName}</div>
                        {watchedValues.hiringManager && (
                          <div><span className="font-medium">Hiring Manager:</span> {watchedValues.hiringManager}</div>
                        )}
                        {watchedValues.vertical && (
                          <div><span className="font-medium">Vertical:</span> {watchedValues.vertical}</div>
                        )}
                        {watchedValues.slaDate && (
                          <div><span className="font-medium">SLA Date:</span> {new Date(watchedValues.slaDate).toLocaleDateString()}</div>
                        )}
                        <div><span className="font-medium">Total Positions:</span> {watchedValues.totalPositions}</div>
                        <div><span className="font-medium">Urgency:</span> {watchedValues.urgencyLevel}</div>
                        <div><span className="font-medium">Priority:</span> {watchedValues.priority}</div>
                        {watchedValues.location && (
                          <div><span className="font-medium">Location:</span> {watchedValues.location}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Created Jobs ({jobPositions.length})</h4>
                      <div className="space-y-2 text-sm">
                        {jobPositions.length > 0 ? (
                          jobPositions.map((job, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                              <div>
                                <div className="font-medium text-gray-900">{job.title}</div>
                                <div className="text-gray-600 text-xs">{job.company} • {job.location}</div>
                              </div>
                              <span className="text-green-600 text-xs font-medium">✓ Ready</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500">No jobs created yet</div>
                        )}
                        
                        {/* Show remaining positions */}
                        {jobPositions.slice(jobPositions.length).map((position, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <span className="font-medium">{position.title}</span>
                            <span className="text-gray-500 text-xs">Pending</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {jobPositions.length < watchedValues.totalPositions && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-yellow-800 font-medium">
                          {watchedValues.totalPositions - jobPositions.length} job{watchedValues.totalPositions - jobPositions.length > 1 ? 's' : ''} still need to be created
                        </span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        Complete the job creation process for all positions before creating the project.
                      </p>
                    </div>
                  )}

                  {watchedValues.skillsRequired && watchedValues.skillsRequired.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {watchedValues.skillsRequired.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Publishing Section */}
                {jobPositions.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-primary-600" />
                      <span>Job Publishing Options</span>
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Choose how you want to handle the created jobs. You can save them as drafts or publish them immediately.
                    </p>
                    
                    <div className="space-y-4">
                      {jobPositions.map((job, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{job.title}</h5>
                            <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <select
                              value={job.status || 'draft'}
                              onChange={(e) => {
                                const updatedJobs = [...jobPositions];
                                updatedJobs[index] = { ...job, status: e.target.value };
                                setJobPositionsList(updatedJobs);
                              }}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="draft">Save as Draft</option>
                              <option value="active">Publish Immediately</option>
                            </select>
                            {job.status === 'active' && (
                              <span className="text-green-600 text-sm font-medium">Will Publish</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> Jobs marked as "Publish Immediately" will be made available to candidates right after project creation.
                        Draft jobs can be published later from the project dashboard.
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900">Next Steps</h4>
                      <p className="text-sm text-green-700 mt-1">
                        After creating this project, we'll automatically:
                      </p>
                      <ul className="text-sm text-green-700 mt-2 list-disc list-inside space-y-1">
                        {jobPositions.length > 0 ? (
                          <>
                            <li>Create the project with {jobPositions.length} job{jobPositions.length > 1 ? 's' : ''}</li>
                            <li>Run AI candidate matching against our database</li>
                            <li>Generate a client portal for project collaboration</li>
                            <li>Set up automated progress tracking and reporting</li>
                          </>
                        ) : (
                          <>
                            <li>Create the project structure</li>
                            <li>Set up project dashboard and tracking</li>
                            <li>Generate a client portal for collaboration</li>
                            <li>Enable job creation for remaining positions</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
          {/* Footer - Inside content area like CreateJobModal */}
          {currentStep !== 'job-creation' && (
            <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
              <div>
                {currentStep !== 'basics' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                  >
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                
                {currentStep === 'roles' ? (
                  <Button
                    type="button"
                    onClick={startJobCreation}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Start Job Creation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : currentStep !== 'review' ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
