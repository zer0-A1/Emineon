'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@clerk/nextjs';
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
  FileText,
  Loader2,
  Plus,
  Check,
  Upload,
  Sparkles,
  DollarSign,
  Users,
  Clock,
  Briefcase,
  Target,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight,
  Copy,
  Eye,
  Settings,
  UserPlus,
  Share2,
  Mic,
  MicOff,
  Send,
  Paperclip,
  Type,
  Code,
  BarChart3,
  Palette,
  Database,
  Shield,
  Wrench,
  Calculator,
  Megaphone,
  Truck,
  GraduationCap,
  Heart,
  Scale,
  ChefHat,
  HardHat,
  PenTool,
  Camera,
  Smartphone,
  Coins,
  Presentation,
  Brain,
  Monitor,
  Gamepad2,
  FlaskConical,
  Stethoscope,
  TreePine,
  Plane,
  ShoppingCart,
  BookOpen,
  Languages,
  MessageSquare,
  Headphones,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Search,
  MapPin as LocationPin,
  Download,
  FileDown,
  Image as ImageIcon,
  Trash2,
  Layout,
  Filter,
  Star
} from 'lucide-react';
import { JobPreviewModal } from './JobPreviewModal';
import { jobTemplates, jobTemplateCategories, type JobTemplate, type StyleConfig, stylePresets } from '@/data/job-templates';
import StyleCustomizer from './StyleCustomizer';

// Enhanced form schema following E2E flow
const jobSchema = z.object({
  // Existing fields
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  contractType: z.enum(['permanent', 'freelance', 'fixed-term', 'internship']),
  startDate: z.string().optional(),
  duration: z.string().optional(),
  salary: z.string().optional(),
  workMode: z.enum(['on-site', 'remote', 'hybrid']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  skills: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default([]),
  department: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  owner: z.string().min(1, 'Job owner is required'),
  status: z.enum(['draft', 'active']).default('draft'),
  
  // Project fields (now optional)
  projectId: z.string().optional(), // For existing project selection
  projectName: z.string().optional(), // For new project creation
  totalPositions: z.number().optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high']).optional(),
  projectDescription: z.string().optional(),
  isRemote: z.boolean().default(false),
  isHybrid: z.boolean().default(false),
  clientContact: z.string().optional(),
  clientEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  slaDate: z.string().optional(), // Closing date
  vertical: z.string().optional(),
  budgetRange: z.string().optional(),
  endDate: z.string().optional(),
  industryBackground: z.string().optional(),
  
  // Pipeline configuration (fixed across platform)
  pipelineStages: z.array(z.string()).min(1, 'At least one pipeline stage is required').default(['Sourced', 'Screened', 'Interviewed', 'Offer', 'Hired'])
});

type JobFormData = z.infer<typeof jobSchema>;

interface CreateJobModalProps {
  open: boolean;
  onClose: () => void;
  editingJob?: any;
}

const contractTypes = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'fixed-term', label: 'Fixed-term' },
  { value: 'internship', label: 'Internship' },
];

const currencies = ['CHF', 'EUR', 'USD', 'GBP'];

const recentClients = [
  'Acme Corporation',
  'TechStart AG',
  'Global Solutions Ltd',
  'Innovation Hub',
  'Digital Dynamics',
];

const urgencyLevels = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const verticals = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Government',
  'Non-Profit',
  'Consulting',
  'Real Estate',
  'Other'
];

const industryBackgrounds = [
  'Medical/Healthcare',
  'Financial Services',
  'Technology',
  'Manufacturing',
  'Retail/E-commerce',
  'Education',
  'Government/Public Sector',
  'Non-Profit',
  'Consulting',
  'Real Estate',
  'Energy/Utilities',
  'Transportation/Logistics',
  'Media/Entertainment',
  'Telecommunications',
  'Other'
];

const popularJobTitles = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
  'DevOps Engineer',
  'Business Analyst',
  'Project Manager',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
];

export function CreateJobModal({ open, onClose, editingJob }: CreateJobModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<'template' | 'intake' | 'analysis' | 'review' | 'configure' | 'success'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // AI Matching state
  const [showAIMatching, setShowAIMatching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  
  // AI Matching function
  const handleAIMatching = async () => {
    if (!createdJobId) return;
    
    setIsMatching(true);
    try {
      const response = await fetch('/api/ai/candidate-job-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: createdJobId,
          mode: 'job-to-candidates',
          limit: 10
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setMatchingResults(result.data.matches);
        setShowAIMatching(true);
      } else {
        alert('AI matching failed: ' + result.error);
      }
    } catch (error) {
      console.error('AI matching error:', error);
      alert('AI matching failed. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };
  
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customStyleConfig, setCustomStyleConfig] = useState<StyleConfig>(stylePresets.modern);
  const [showStyleCustomizer, setShowStyleCustomizer] = useState(false);
  const [customPost, setCustomPost] = useState('');
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  // New state for projects and pipeline management
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectOption, setSelectedProjectOption] = useState<'existing' | 'new' | 'none'>('none');
  const [pipelineStages, setPipelineStages] = useState<string[]>(['Sourced', 'Screened', 'Interviewed', 'Offer', 'Hired']);
  const [newStageName, setNewStageName] = useState<string>('');
  const stageSuggestions: string[] = [
    'Phone Screen', 'Technical Interview', 'Panel Interview', 'Client Interview', 'Case Study', 'Assessment', 'Reference Check', 'Background Check', 'Submitted to Client', 'Shortlist'
  ];
  
  // Additional state variables
  const [jobDescription, setJobDescription] = useState('');
  const [createdJob, setCreatedJob] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Field selection state for template customization
  const [selectedFields, setSelectedFields] = useState({
    title: true,
    company: true,
    location: true,
    contractType: true,
    workMode: true,
    department: true,
    salary: true,
    description: true,
    skills: true,
    languages: true,
    startDate: true,
    duration: false,
    priority: false
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      // Existing fields
      title: '',
      company: '',
      location: '',
      contractType: 'permanent' as const,
      workMode: 'hybrid' as const,
      priority: 'medium' as const,
      status: 'draft' as const,
      startDate: '',
      description: '',
      owner: user?.fullName || user?.firstName + ' ' + user?.lastName || '',
      skills: [] as string[],
      languages: [] as string[],
      duration: '',
      salary: '',
      department: '',
      
      // Project fields (now optional)
      projectId: '',
      projectName: '',
      totalPositions: 1,
      urgencyLevel: 'medium' as const,
      projectDescription: '',
      isRemote: false,
      isHybrid: false,
      clientContact: '',
      clientEmail: '',
      clientPhone: '',
      slaDate: '',
      vertical: '',
      budgetRange: '',
      endDate: '',
      industryBackground: '',
      
      // Pipeline configuration
      pipelineStages: ['Sourced', 'Screened', 'Interviewed', 'Offer', 'Hired']
    }
  });

  const handleTitleChange = (value: string) => {
    setValue('title', value);
    if (value.length > 0) {
      const suggestions = popularJobTitles.filter(title =>
        title.toLowerCase().includes(value.toLowerCase())
      );
      setTitleSuggestions(suggestions.slice(0, 5));
    } else {
      setTitleSuggestions([]);
    }
  };

  const handleClientChange = (value: string) => {
    setValue('company', value);
    if (value.length > 0) {
      const suggestions = recentClients.filter(client =>
        client.toLowerCase().includes(value.toLowerCase())
      );
      setCompanySuggestions(suggestions.slice(0, 5));
    } else {
      setCompanySuggestions([]);
    }
  };

  // Template selection functions
  const handleTemplateSelect = (template: JobTemplate) => {
    setSelectedTemplate(template);
    
    // Update selected fields based on template
    const newSelectedFields = { ...selectedFields };
    template.sections.forEach(section => {
      if (section.key in newSelectedFields) {
        newSelectedFields[section.key as keyof typeof selectedFields] = section.show;
      }
    });
    setSelectedFields(newSelectedFields);
    
    // Pre-fill form with template sample content
    setValue('title', template.sampleContent.title);
    setValue('description', template.sampleContent.description);
  };

  const handleTemplateConfirm = () => {
    if (selectedTemplate) {
      // Set initial style config from template
      setCustomStyleConfig(selectedTemplate.styleConfig);
      setCurrentStep('intake');
    }
  };

  // Style customization handlers
  const handleStyleChange = (newStyle: StyleConfig) => {
    setCustomStyleConfig(newStyle);
  };

  const handlePresetChange = (presetName: string) => {
    const preset = stylePresets[presetName];
    if (preset) {
      setCustomStyleConfig(preset);
    }
  };

  // Effect to populate form when editing
  useEffect(() => {
    if (editingJob && open) {
      // Load pipeline stages when editing
      if (Array.isArray(editingJob.pipelineStages) && editingJob.pipelineStages.length > 0) {
        setPipelineStages(editingJob.pipelineStages);
        setValue('pipelineStages', editingJob.pipelineStages as any);
      }
      console.log('Populating form for editing:', editingJob);
      
      // Set form values from editing job
      setValue('title', editingJob.title || '');
      setValue('company', editingJob.company || '');
      setValue('location', editingJob.location || '');
      setValue('contractType', editingJob.contractType?.toLowerCase() || 'permanent');
      setValue('workMode', editingJob.workMode?.toLowerCase() || 'hybrid');
      setValue('description', editingJob.description || '');
      setValue('salary', editingJob.salary || '');
      setValue('department', editingJob.department || '');
      setValue('owner', editingJob.owner || user?.fullName || '');
      setValue('skills', editingJob.skills || []);
      setValue('status', editingJob.status?.toLowerCase() || 'draft');
      
      // New fields
      setValue('projectName', editingJob.projectName || '');
      setValue('totalPositions', editingJob.totalPositions || 1);
      setValue('urgencyLevel', editingJob.urgencyLevel?.toLowerCase() || 'medium');
      setValue('projectDescription', editingJob.projectDescription || '');
      setValue('isRemote', editingJob.isRemote || false);
      setValue('isHybrid', editingJob.isHybrid || false);
      setValue('clientContact', editingJob.clientContact || '');
      setValue('clientEmail', editingJob.clientEmail || '');
      setValue('clientPhone', editingJob.clientPhone || '');
      setValue('slaDate', editingJob.slaDate || editingJob.expiresAt || '');
      setValue('vertical', editingJob.vertical || '');
      setValue('budgetRange', editingJob.budgetRange || '');
      setValue('endDate', editingJob.endDate || '');
      setValue('industryBackground', editingJob.industryBackground || '');
      
      // Skip template selection and go directly to review for editing
      setCurrentStep('review');
      setParsedData({
        title: editingJob.title,
        company: editingJob.company,
        location: editingJob.location,
        contractType: editingJob.contractType?.toLowerCase(),
        workMode: editingJob.workMode?.toLowerCase(),
        description: editingJob.description,
        salary: editingJob.salary,
        department: editingJob.department,
        skills: editingJob.skills || [],
        projectName: editingJob.projectName,
        totalPositions: editingJob.totalPositions,
        urgencyLevel: editingJob.urgencyLevel?.toLowerCase(),
        projectDescription: editingJob.projectDescription,
        isRemote: editingJob.isRemote,
        isHybrid: editingJob.isHybrid,
        clientContact: editingJob.clientContact,
        clientEmail: editingJob.clientEmail,
        clientPhone: editingJob.clientPhone,
        vertical: editingJob.vertical,
        budgetRange: editingJob.budgetRange,
        industryBackground: editingJob.industryBackground,
      });
    } else if (open && !editingJob) {
      // Reset for new job creation
      setCurrentStep('template');
      setParsedData(null);
      setPipelineStages(['Sourced', 'Screened', 'Interviewed', 'Offer', 'Hired']);
      setValue('pipelineStages', ['Sourced', 'Screened', 'Interviewed', 'Offer', 'Hired'] as any);
    }
  }, [editingJob, open, setValue, user]);

  // Keep form value in sync with local pipeline stages state
  useEffect(() => {
    try { setValue('pipelineStages', pipelineStages as any, { shouldDirty: true }); } catch {}
  }, [pipelineStages, setValue]);

  // Pipeline stage management helpers
  const addStage = () => {
    const name = (newStageName || '').trim();
    if (!name) return;
    if (pipelineStages.some(s => s.toLowerCase() === name.toLowerCase())) {
      setNewStageName('');
      return;
    }
    setPipelineStages(prev => [...prev, name]);
    setNewStageName('');
  };
  const updateStage = (index: number, name: string) => {
    setPipelineStages(prev => prev.map((s, i) => (i === index ? name : s)));
  };
  const removeStage = (index: number) => {
    setPipelineStages(prev => prev.filter((_, i) => i !== index));
  };
  const moveStageUp = (index: number) => {
    if (index <= 0) return;
    setPipelineStages(prev => {
      const next = [...prev];
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      return next;
    });
  };
  const moveStageDown = (index: number) => {
    if (index >= pipelineStages.length - 1) return;
    setPipelineStages(prev => {
      const next = [...prev];
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
      return next;
    });
  };

  const filteredTemplates = jobTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                         template.industry?.toLowerCase().includes(templateSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Enhanced AI parsing function with real GPT integration
  const parseJobDescription = async (text: string) => {
    setIsProcessing(true);
    setCurrentStep('analysis');
    
    try {
      console.log('🔄 Starting job description parsing...', { textLength: text.length });
      
      // Call the AI job description parsing API
      const response = await fetch('/api/ai/job-description/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ API Result:', result);
      const parsed = result?.data ?? result;
      
      // Enhanced parsed data with AI extraction - properly map API response
      const aiRawTitle = parsed?.title || extractTitle(text) || 'Senior Software Developer';
      const aiParsedData: Partial<JobFormData> = {
        title: normalizeJobTitle(aiRawTitle),
        company: parsed?.company || extractCompany(text) || 'Tech Company',
        location: parsed?.location || extractLocation(text) || 'Zurich, Switzerland',
        // Fix contract type mapping - API may return 'contract' but form expects 'fixed-term'
        contractType: parsed?.contractType === 'contract' ? 'fixed-term' : 
                     (parsed?.contractType || extractContractType(text) || 'permanent'),
        workMode: parsed?.workMode || extractWorkMode(text) || 'hybrid',
        description: parsed?.description || text,
        skills: parsed?.skills || parsed?.requirements || extractSkills(text),
        languages: parsed?.languages || extractLanguages(text),
        department: parsed?.department || extractDepartment(text),
        priority: parsed?.priority || 'medium',
        // Use actual user name instead of hardcoded string
        owner: user?.fullName || user?.firstName + ' ' + user?.lastName || 'Current User',
        salary: parsed?.salary || '',
        duration: parsed?.duration || '',
        // Handle start date properly
        startDate: parsed?.startDate ? formatDateForInput(parsed.startDate) : ''
      };

      console.log('🎯 Parsed Data:', aiParsedData);
      setParsedData({ ...aiParsedData, requirements: parsed?.requirements || [], responsibilities: parsed?.responsibilities || [] });
      
      // Pre-fill form with parsed data - ensure proper type casting and force re-render
      console.log('📝 Setting form values...');
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        if (aiParsedData.title) {
          console.log('Setting title:', aiParsedData.title);
          setValue('title', aiParsedData.title, { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.company) {
          console.log('Setting company:', aiParsedData.company);
          setValue('company', aiParsedData.company, { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.location) {
          console.log('Setting location:', aiParsedData.location);
          setValue('location', aiParsedData.location, { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.contractType) {
          console.log('Setting contractType:', aiParsedData.contractType);
          setValue('contractType', aiParsedData.contractType as 'permanent' | 'freelance' | 'fixed-term' | 'internship', { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.workMode) {
          console.log('Setting workMode:', aiParsedData.workMode);
          setValue('workMode', aiParsedData.workMode as 'on-site' | 'remote' | 'hybrid', { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.description) {
          console.log('Setting description:', aiParsedData.description.substring(0, 100) + '...');
          setValue('description', aiParsedData.description, { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.skills && Array.isArray(aiParsedData.skills)) {
          console.log('Setting skills:', aiParsedData.skills);
          setValue('skills', aiParsedData.skills, { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.languages && Array.isArray(aiParsedData.languages)) {
          console.log('Setting languages:', aiParsedData.languages);
          setValue('languages', aiParsedData.languages, { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.priority) {
          console.log('Setting priority:', aiParsedData.priority);
          setValue('priority', aiParsedData.priority as 'low' | 'medium' | 'high', { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.owner) {
          console.log('Setting owner:', aiParsedData.owner);
          setValue('owner', aiParsedData.owner, { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.department) {
          console.log('Setting department:', aiParsedData.department);
          setValue('department', aiParsedData.department, { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.salary) {
          console.log('Setting salary:', aiParsedData.salary);
          setValue('salary', aiParsedData.salary, { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.duration) {
          console.log('Setting duration:', aiParsedData.duration);
          setValue('duration', aiParsedData.duration, { shouldValidate: true, shouldDirty: true });
        }
        if (aiParsedData.startDate) {
          console.log('Setting startDate:', aiParsedData.startDate);
          setValue('startDate', aiParsedData.startDate, { shouldValidate: true, shouldDirty: true });
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ AI parsing failed, using fallback:', error);
      
      // Fallback to local extraction with same fixes
      const fbRawTitle = extractTitle(text) || 'Senior Software Developer';
      const fallbackParsedData: Partial<JobFormData> = {
        title: normalizeJobTitle(fbRawTitle),
        company: extractCompany(text) || 'Tech Company',
        location: extractLocation(text) || 'Zurich, Switzerland',
        contractType: extractContractType(text) || 'permanent',
        workMode: extractWorkMode(text) || 'hybrid',
        description: text,
        skills: extractSkills(text),
        languages: extractLanguages(text),
        department: extractDepartment(text),
        priority: 'medium',
        owner: user?.fullName || user?.firstName + ' ' + user?.lastName || 'Current User',
        salary: '',
        duration: '',
        startDate: ''
      };

      console.log('🔄 Using fallback data:', fallbackParsedData);
      setParsedData(fallbackParsedData);
      
      // Pre-fill form with fallback data
      setTimeout(() => {
        if (fallbackParsedData.title) setValue('title', fallbackParsedData.title, { shouldValidate: true, shouldDirty: true });
        if (fallbackParsedData.company) setValue('company', fallbackParsedData.company, { shouldValidate: true, shouldDirty: true });
        if (fallbackParsedData.location) setValue('location', fallbackParsedData.location, { shouldValidate: true, shouldDirty: true });
        if (fallbackParsedData.contractType) setValue('contractType', fallbackParsedData.contractType as 'permanent' | 'freelance' | 'fixed-term' | 'internship', { shouldValidate: true, shouldDirty: true });
        if (fallbackParsedData.workMode) setValue('workMode', fallbackParsedData.workMode as 'on-site' | 'remote' | 'hybrid', { shouldValidate: true, shouldDirty: true });
        if (fallbackParsedData.description) setValue('description', fallbackParsedData.description, { shouldValidate: true, shouldDirty: true });
        if (fallbackParsedData.skills && Array.isArray(fallbackParsedData.skills)) setValue('skills', fallbackParsedData.skills, { shouldValidate: true, shouldDirty: true });
        if (fallbackParsedData.languages && Array.isArray(fallbackParsedData.languages)) setValue('languages', fallbackParsedData.languages, { shouldValidate: true, shouldDirty: true });
        if (fallbackParsedData.priority) setValue('priority', fallbackParsedData.priority as 'low' | 'medium' | 'high', { shouldValidate: true, shouldDirty: true });
        if (fallbackParsedData.owner) setValue('owner', fallbackParsedData.owner, { shouldValidate: true, shouldDirty: true });
        if (fallbackParsedData.department) setValue('department', fallbackParsedData.department, { shouldValidate: true, shouldDirty: true });
      }, 100);
    }

    setIsProcessing(false);
    setCurrentStep('review');
  };

  // Simple extraction functions (in real implementation, these would use AI)
  const extractTitle = (text: string) => {
    const titlePatterns = [
      /(?:position|role|job):\s*([^\n]+)/i,
      /(?:we are looking for|seeking|hiring)\s+(?:a|an)?\s*([^\n]+)/i,
      /^([^\n]+)(?:\s*-\s*job|position)/i
    ];
    
    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  };
  
  const extractCompany = (text: string) => {
    const companyPatterns = [
      /company:\s*([^\n]+)/i,
      /at\s+([A-Z][a-zA-Z\s&]+)(?:\s+we|,)/,
      /([A-Z][a-zA-Z\s&]+)\s+is\s+(?:looking|seeking|hiring)/
    ];
    
    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  };

  const extractLocation = (text: string) => {
    const locationPatterns = [
      /location:\s*([^\n]+)/i,
      /(?:based in|located in|office in)\s+([^\n,]+)/i,
      /(Zurich|Geneva|Basel|Bern|Switzerland)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  };

  const extractContractType = (text: string): 'permanent' | 'freelance' | 'fixed-term' | 'internship' => {
    if (/contract|contractor/i.test(text)) return 'fixed-term'; // Map contract to fixed-term
    if (/freelance|freelancer/i.test(text)) return 'freelance';
    if (/fixed.term|temporary|temp/i.test(text)) return 'fixed-term';
    if (/intern|internship/i.test(text)) return 'internship';
    return 'permanent';
  };

  const extractWorkMode = (text: string): 'on-site' | 'remote' | 'hybrid' => {
    if (/remote/i.test(text)) return 'remote';
    if (/on.site|office/i.test(text)) return 'on-site';
    return 'hybrid';
  };

  const extractSkills = (text: string): string[] => {
    const skillPatterns = [
      /(?:skills|technologies|requirements):\s*([^\n]+)/i,
      /(?:experience with|knowledge of)\s+([^\n]+)/i
    ];
    
    const commonSkills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'AWS'];
    const foundSkills: string[] = [];
    
    commonSkills.forEach(skill => {
      if (new RegExp(skill, 'i').test(text)) {
        foundSkills.push(skill);
      }
    });
    
    return foundSkills.length > 0 ? foundSkills : ['Programming', 'Problem Solving'];
  };

  const extractLanguages = (text: string): string[] => {
    const languages: string[] = [];
    if (/english/i.test(text)) languages.push('English');
    if (/german|deutsch/i.test(text)) languages.push('German');
    if (/french|français/i.test(text)) languages.push('French');
    return languages;
  };

  const extractDepartment = (text: string): string => {
    if (/engineering|development|software/i.test(text)) return 'Technology';
    if (/marketing/i.test(text)) return 'Marketing';
    if (/sales/i.test(text)) return 'Sales';
    if (/design|ux|ui/i.test(text)) return 'Design';
    return 'Technology';
  };

  // Ensure title is concise and job-like (not a sentence)
  const normalizeJobTitle = (raw: string): string => {
    let t = (raw || '').trim();
    if (!t) return 'Senior Software Developer';
    // Keep only first line
    t = t.split('\n')[0].trim();
    // Remove trailing punctuation and sentences after dash/colon if too long
    if (t.length > 90 && /[:\-–]/.test(t)) {
      t = t.split(/[:\-–]/)[0].trim();
    }
    // Remove sentence-like endings
    t = t.replace(/[\.!?]+$/g, '').trim();
    // Collapse multiple spaces
    t = t.replace(/\s{2,}/g, ' ');
    // Trim leading role phrases
    t = t.replace(/^(we are|we're|seeking|hiring|looking for)\s+(an?|the)?\s*/i, '');
    // Capitalize words properly (keep acronyms)
    t = t.split(' ').map(w => {
      if (w.toUpperCase() === w && w.length <= 4) return w; // ACRONYM
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
    // Enforce reasonable length
    if (t.length > 80) t = t.slice(0, 80).trim();
    return t;
  };

  // Logo upload functionality
  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/competence-files/upload-logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }
      
      const result = await response.json();
      if (result.success) {
        setLogoUrl(result.data.logoUrl);
        setLogoFile(file);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoUrl('');
  };

  // Download job description functionality
  const downloadJobDescription = async (format: 'pdf' | 'docx') => {
    try {
      const jobData = {
        title: selectedFields.title ? watch('title') : '',
        company: selectedFields.company ? watch('company') : '',
        location: selectedFields.location ? watch('location') : '',
        contractType: selectedFields.contractType ? watch('contractType') : '',
        workMode: selectedFields.workMode ? watch('workMode') : '',
        description: selectedFields.description ? watch('description') : '',
        skills: selectedFields.skills ? watch('skills') : [],
        salary: selectedFields.salary ? watch('salary') : '',
        department: selectedFields.department ? watch('department') : '',
        startDate: selectedFields.startDate ? watch('startDate') : '',
        languages: selectedFields.languages ? watch('languages') : [],
        priority: selectedFields.priority ? watch('priority') : '',
        logoUrl: logoUrl,
        selectedFields: selectedFields
      };

      console.log('Downloading job description with data:', jobData);

      const response = await fetch('/api/jobs/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobData,
          format,
          logoUrl,
          selectedFields,
          selectedTemplate,
          customStyleConfig
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download error response:', errorText);
        throw new Error(`Failed to generate document: ${response.status}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Generated document is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${watch('title') || 'job-description'}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to format date for input field
  const formatDateForInput = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    } catch {
      return '';
    }
  };

  // Helper function to extract text from different file types
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const text = reader.result as string;
        resolve(text);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // For now, only handle text files directly
      // In production, you'd want to use libraries for PDF/DOCX parsing
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reject(new Error('File type not supported for direct text extraction'));
      }
    });
  };

  // Improved file upload handler with better error handling
  const handleFileUpload = async (fileOrFiles: File | FileList | File[]) => {
    setIsProcessing(true);
    setCurrentStep('analysis');
    try {
      const files: File[] = Array.isArray(fileOrFiles)
        ? fileOrFiles
        : (fileOrFiles instanceof FileList ? Array.from(fileOrFiles) : [fileOrFiles]);

      console.log('📁 Processing uploaded files:', files.map(f => `${f.name} (${f.type})`));

      // If all text files, read directly
      const allText = files.every(f => f.type === 'text/plain' || f.name.toLowerCase().endsWith('.txt'));
      if (allText) {
        const texts = await Promise.all(files.map(extractTextFromFile));
        await parseJobDescription(texts.join('\n\n'));
        return;
      }

      // Retrieve auth token via API helper to avoid hook usage here
      let token: string | null = null;
      try {
        const tRes = await fetch('/api/auth/check', { cache: 'no-store' });
        if (tRes.ok) {
          const tJson = await tRes.json().catch(() => null);
          token = tJson?.token || null;
        }
      } catch {}

      const formData = new FormData();
      files.forEach(f => formData.append('files', f));

      console.log('📤 Uploading files for text extraction (job modal)...');
      const response = await fetch('/api/files/extract-text', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const combinedText = result.texts ? result.texts.join('\n\n') : result.text || '';
        if (combinedText.trim()) {
          await parseJobDescription(combinedText);
          return;
        }
        throw new Error('No text could be extracted from the uploaded files');
      }

      // Fallback: send first file directly to AI parser (parity with competence modal)
      const errorText = await response.text().catch(() => '');
      console.warn('⚠️ Text extraction failed in job modal, falling back to AI parse.', errorText);
      const fd = new FormData();
      fd.append('file', files[0]);
      const aiRes = await fetch('/api/ai/job-description/parse', { method: 'POST', body: fd });
      if (!aiRes.ok) {
        const t = await aiRes.text().catch(() => '');
        throw new Error(t || `Direct job file parse failed: ${aiRes.status}`);
      }
      const parsed = await aiRes.json();
      const composedText = [
        parsed.title && parsed.company ? `${parsed.title} at ${parsed.company}` : (parsed.title || parsed.company || ''),
        Array.isArray(parsed.responsibilities) ? parsed.responsibilities.join('\n') : (parsed.responsibilities || '')
      ].filter(Boolean).join('\n\n');
      setJobDescription(composedText);
    } catch (error) {
      console.error('❌ File upload error (job modal):', error);
      setIsProcessing(false);
      setCurrentStep('intake');
      alert(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Wrapper for file input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      const allowed = ['.pdf', '.docx', '.txt', '.md', '.html'];
      const filtered = files.filter(f => allowed.includes('.' + (f.name.split('.').pop() || '').toLowerCase()));
      if (filtered.length === 0) {
        alert('Please upload a PDF, DOCX, TXT, MD, or HTML file.');
        return;
      }
      handleFileUpload(filtered);
    }
  };

  const handleParseJob = () => {
    if (jobDescription.trim()) {
      parseJobDescription(jobDescription);
    }
  };

  // Voice recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Here you would typically send the audio to a speech-to-text service
        // For now, we'll simulate it
        setIsRecording(false);
        setChatMessage(prev => prev + ' [Voice input transcribed]');
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleChatSubmit = () => {
    if (chatMessage.trim()) {
      setJobDescription(chatMessage);
      parseJobDescription(chatMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Normalize/clean pipeline stages
      const cleanedStages = (pipelineStages || [])
        .map(s => (s || '').trim())
        .filter(s => s.length > 0);

      // Map form data to new API schema
      const apiData = {
        // Existing fields
        title: data.title,
        company: data.company,
        location: data.location,
        contractType: data.contractType,
        workMode: data.workMode,
        startDate: data.startDate,
        duration: data.duration,
        salary: data.salary,
        status: data.status || 'draft',
        description: data.description,
        skills: data.skills || [],
        languages: data.languages || [],
        department: data.department,
        priority: data.priority,
        owner: data.owner,
        requirements: data.requirements || [],
        responsibilities: data.responsibilities || [],
        benefits: data.benefits || [],
        experienceLevel: data.experienceLevel,
        
        // Pipeline stages
        pipelineStages: cleanedStages.length > 0 ? cleanedStages : ['Sourced', 'Screened', 'Interviewed', 'Offer', 'Hired'],
        
        // Project information (conditional based on selection)
        ...(selectedProjectOption === 'existing' && data.projectId ? { 
          projectId: data.projectId 
        } : {}),
        ...(selectedProjectOption === 'new' ? {
        projectName: data.projectName,
        totalPositions: data.totalPositions,
        urgencyLevel: data.urgencyLevel,
        projectDescription: data.projectDescription,
        isRemote: data.isRemote,
        isHybrid: data.isHybrid,
        clientContact: data.clientContact,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        expiresAt: data.slaDate, // Map slaDate to expiresAt for database
        vertical: data.vertical,
        budgetRange: data.budgetRange,
        endDate: data.endDate,
        industryBackground: data.industryBackground,
        } : {}),
      };

      console.log('Form data:', data);
      console.log('API data:', apiData);

      // Ensure contractType is valid
      if (!['permanent', 'freelance', 'fixed-term', 'internship'].includes(apiData.contractType)) {
        console.error('Invalid contractType:', apiData.contractType, 'falling back to permanent');
        apiData.contractType = 'permanent';
      }

      // Ensure owner is present (server validates non-empty)
      if (!apiData.owner || (apiData.owner as string).trim().length === 0) {
        apiData.owner = 'Current User';
      }

      const isEditing = !!editingJob;
      const url = isEditing ? `/api/jobs/${editingJob.id}` : '/api/jobs';
      const method = isEditing ? 'PUT' : 'POST';

      // Add auth header if available (token may not be needed in dev)
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        const job = await response.json();
        console.log(`Job ${isEditing ? 'updated' : 'created'} successfully:`, job);
        
        // Save the created job ID for AI matching
        const newJobId = job?.id || job?.data?.id;
        if (newJobId) setCreatedJobId(newJobId);
        
        // If publishing, confirm and close the modal immediately
        if ((data.status || 'draft') === 'active') {
          try { alert('Job published successfully'); } catch {}
          // Refresh the jobs page if we're on it to reflect the new job and pipeline
          if (window.location.pathname === '/jobs') {
            window.location.reload();
          }
          resetModal();
          onClose();
          return;
        }

        // Otherwise show success screen for draft saves
        setCurrentStep('success');
        setCreatedJob(job?.data || job); // Store job data for success screen
        setTimeout(scrollToTop, 100); // Auto-scroll to top for success step
      } else {
        let msg = '';
        let details = '';
        try {
          const errorData = await response.json();
          console.error('API Error JSON:', errorData);
          msg = errorData?.error || errorData?.message || '';
          details = errorData?.details || errorData?.code || '';
          if (!msg) msg = JSON.stringify(errorData);
        } catch {
          const txt = await response.text();
          console.error('API Error TEXT:', txt);
          msg = txt;
        }
        const combined = details && !msg.includes(details) ? `${msg} - ${details}` : msg;
        alert(`Error ${isEditing ? 'updating' : 'creating'} job: ${combined || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${editingJob ? 'updating' : 'creating'} job:`, error);
      alert(`Error ${editingJob ? 'updating' : 'creating'} job. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setCurrentStep('template');
    setChatMessage('');
    setJobDescription('');
    setParsedData(null);
    setIsProcessing(false);
    setIsRecording(false);
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    setSelectedTemplate(null);
    setSelectedCategory('All');
    setTemplateSearchQuery('');
    setCustomStyleConfig(stylePresets.modern);
    setShowStyleCustomizer(false);
    setLogoFile(null);
    setLogoUrl('');
    setShowPreviewModal(false);
    reset();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Fetch existing projects when modal opens
  useEffect(() => {
    if (open) {
      fetchExistingProjects();
    }
  }, [open]);

  const fetchExistingProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch('/api/projects?limit=50');
      if (response.ok) {
        const data = await response.json();
        setExistingProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Pipeline stages are fixed; no add/remove/reorder functions

  // Auto-scroll to top when step changes
  const scrollToTop = () => {
    // Try multiple selectors to find the modal content
    const modalContent = document.querySelector('.modal-content') ||
                        document.querySelector('[class*="overflow-y-auto"]') ||
                        document.querySelector('[class*="max-h-"]');
    
    if (modalContent) {
      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Fallback: scroll the window
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Enhanced step navigation with auto-scroll
  const goToNextStep = () => {
    if (currentStep === 'template') setCurrentStep('intake');
    else if (currentStep === 'intake') setCurrentStep('analysis');
    else if (currentStep === 'analysis') setCurrentStep('review');
    else if (currentStep === 'review') setCurrentStep('configure');
    
    // Auto-scroll to top after a brief delay to allow for step transition
    setTimeout(scrollToTop, 100);
  };

  const goToPreviousStep = () => {
    if (currentStep === 'configure') setCurrentStep('review');
    else if (currentStep === 'review') setCurrentStep('analysis');
    else if (currentStep === 'analysis') setCurrentStep('intake');
    else if (currentStep === 'intake') setCurrentStep('template');
    
    // Auto-scroll to top after a brief delay to allow for step transition
    setTimeout(scrollToTop, 100);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div data-test="create-job-modal" className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0A2F5A]/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-[#0A2F5A]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingJob ? 'Edit Job' : 'Create a Job'}
              </h2>
              <p className="text-gray-600">
                {editingJob ? 'Update job details and settings' : (
                  <>
                    {currentStep === 'template' && 'Choose a template that matches your job posting style'}
                    {currentStep === 'intake' && 'Chat with AI to create your job posting'}
                    {currentStep === 'analysis' && 'Analyzing your job description...'}
                    {currentStep === 'review' && 'Review and edit the extracted information'}
                    {currentStep === 'configure' && 'Configure job settings and publish'}
                  </>
                )}
              </p>
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
            <div className={`flex items-center space-x-2 ${currentStep === 'template' ? 'text-primary-600' : currentStep === 'intake' || currentStep === 'analysis' || currentStep === 'review' || currentStep === 'configure' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'template' ? 'bg-primary-100 text-primary-600' : currentStep === 'intake' || currentStep === 'analysis' || currentStep === 'review' || currentStep === 'configure' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {currentStep === 'intake' || currentStep === 'analysis' || currentStep === 'review' || currentStep === 'configure' ? <CheckCircle className="h-4 w-4" /> : <Layout className="h-4 w-4" />}
              </div>
              <span className="font-medium">Template</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep === 'intake' ? 'text-primary-600' : currentStep === 'analysis' || currentStep === 'review' || currentStep === 'configure' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'intake' ? 'bg-primary-100 text-primary-600' : currentStep === 'analysis' || currentStep === 'review' || currentStep === 'configure' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {currentStep === 'analysis' || currentStep === 'review' || currentStep === 'configure' ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <span className="font-medium">Smart Intake</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep === 'analysis' ? 'text-primary-600' : currentStep === 'review' || currentStep === 'configure' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'analysis' ? 'bg-primary-100 text-primary-600' : currentStep === 'review' || currentStep === 'configure' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {currentStep === 'review' || currentStep === 'configure' ? <CheckCircle className="h-4 w-4" /> : '2'}
              </div>
              <span className="font-medium">Smart Analysis</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep === 'review' ? 'text-primary-600' : currentStep === 'configure' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'review' ? 'bg-primary-100 text-primary-600' : currentStep === 'configure' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {currentStep === 'configure' ? <CheckCircle className="h-4 w-4" /> : '3'}
              </div>
              <span className="font-medium">Review & Edit</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep === 'configure' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 'configure' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                4
              </div>
              <span className="font-medium">Configure & Publish</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)] modal-content">
          {/* Step 0: Template Selection */}
          {currentStep === 'template' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Layout className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Job Template</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Select a professional template that matches your industry and company style. Each template is optimized for different types of roles and organizations.
                </p>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">All Categories</option>
                    {jobTemplateCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Template Preview */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: template.colorHex }}
                        >
                          {template.name.charAt(0)}
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                          {template.category}
                        </span>
                        <span className="text-gray-500" style={{ fontFamily: template.font }}>
                          {template.font}
                        </span>
                      </div>
                    </div>

                    {/* Sample Content Preview */}
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="font-medium" style={{ color: template.colorHex }}>
                          {template.sampleContent.title}
                        </div>
                        <div className="line-clamp-2">
                          {template.sampleContent.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {selectedTemplate ? `Selected: ${selectedTemplate.name}` : 'Please select a template to continue'}
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={goToNextStep}
                    className="px-6"
                  >
                    Skip Template
                  </Button>
                  <Button
                    onClick={handleTemplateConfirm}
                    disabled={!selectedTemplate}
                    className="px-6"
                  >
                    Continue with Template
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Smart Job Intake - Chat Interface */}
          {currentStep === 'intake' && (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 border border-primary-100">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Hi {user?.firstName || 'there'}!</h3>
                    <p className="text-gray-600 leading-relaxed">
                      I'll help you create a job posting quickly and easily. You can:
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-gray-600">
                      <li className="flex items-center space-x-2">
                        <Type className="h-4 w-4 text-primary-500" />
                        <span>Type or paste your job description</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4 text-primary-500" />
                        <span>Drag & drop files (PDF, DOCX, TXT)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Mic className="h-4 w-4 text-primary-500" />
                        <span>Use voice dictation</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Chat Input Area */}
              <div className="space-y-4">
                {/* Drag & Drop Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ${
                    isDragOver 
                      ? 'border-primary-400 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {/* Chat Input */}
                  <div className="p-4">
                    <div className="relative">
                      <textarea
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Paste your job description here, or start typing to describe the role you're hiring for..."
                        className="w-full min-h-[120px] max-h-[300px] p-4 pr-20 border-0 resize-none focus:outline-none text-gray-900 placeholder-gray-500 bg-transparent"
                        style={{ fontSize: '16px', lineHeight: '1.5' }}
                      />
                      
                      {/* Input Actions */}
                      <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                        {/* File Upload */}
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt,.md,.html"
                          onChange={handleFileInputChange}
                          className="hidden"
                          id="file-upload-chat"
                        />
                        <label
                          htmlFor="file-upload-chat"
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Upload file"
                        >
                          <Paperclip className="h-5 w-5" />
                        </label>

                        {/* Voice Recording */}
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`p-2 rounded-lg transition-colors ${
                            isRecording 
                              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                          title={isRecording ? 'Stop recording' : 'Start voice recording'}
                        >
                          {isRecording ? (
                            <MicOff className="h-5 w-5 animate-pulse" />
                          ) : (
                            <Mic className="h-5 w-5" />
                          )}
                        </button>

                        {/* Send Button */}
                        <button
                          onClick={handleChatSubmit}
                          disabled={!chatMessage.trim()}
                          className={`p-2 rounded-lg transition-colors ${
                            chatMessage.trim()
                              ? 'text-white bg-primary-600 hover:bg-primary-700'
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                          title="Process job description"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Drag & Drop Overlay */}
                  {isDragOver && (
                    <div className="absolute inset-0 bg-primary-50 bg-opacity-90 rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-primary-600 mx-auto mb-3" />
                        <p className="text-lg font-semibold text-primary-900">Drop your file here</p>
                        <p className="text-sm text-primary-700">PDF, DOCX, or TXT files supported</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Create Options */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Quick create templates:</p>
                  <div className="overflow-x-auto">
                    <div className="flex space-x-3 pb-2" style={{ minWidth: 'max-content' }}>
                      <button
                        onClick={() => setChatMessage("Job Title: Senior Software Engineer\n\nCompany: TechCorp AG\nLocation: Zurich, Switzerland\nContract Type: Permanent\nWork Mode: Hybrid (3 days office, 2 days remote)\nDepartment: Engineering\nSalary: CHF 110,000 - 140,000\nStart Date: Immediate\nPriority: High\n\nJob Description:\nWe are seeking a highly skilled Senior Software Engineer to join our growing engineering team. You will be responsible for designing, developing, and maintaining scalable web applications using modern technologies. This role offers the opportunity to work on cutting-edge projects and mentor junior developers.\n\nKey Responsibilities:\n- Design and develop high-quality software solutions\n- Collaborate with cross-functional teams to deliver features\n- Code review and mentor junior developers\n- Participate in architecture decisions\n- Ensure code quality and best practices\n\nRequired Skills:\n- 5+ years of experience in software development\n- Proficiency in JavaScript, TypeScript, React, Node.js\n- Experience with cloud platforms (AWS, Azure)\n- Strong knowledge of databases (PostgreSQL, MongoDB)\n- Experience with microservices architecture\n- Knowledge of CI/CD pipelines\n- Excellent problem-solving skills\n\nPreferred Skills:\n- Experience with Docker and Kubernetes\n- Knowledge of GraphQL and REST APIs\n- Familiarity with agile methodologies\n- Previous experience in fintech or healthcare\n\nLanguages: English (fluent), German (conversational)\n\nWhat We Offer:\n- Competitive salary and equity package\n- Flexible working arrangements\n- Professional development opportunities\n- Health insurance and wellness benefits\n- Modern office in central Zurich")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Code className="h-4 w-4" />
                        <span>Software Engineer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Job Title: Senior Product Manager\n\nCompany: InnovateCorp\nLocation: Basel, Switzerland\nContract Type: Permanent\nWork Mode: Hybrid (2 days office, 3 days remote)\nDepartment: Product\nSalary: CHF 120,000 - 150,000\nStart Date: March 2024\nPriority: High\n\nJob Description:\nWe are looking for an experienced Senior Product Manager to drive our product strategy and execution. You will lead cross-functional teams to deliver innovative solutions that delight our customers and drive business growth. This role requires a strategic thinker with strong analytical skills and excellent stakeholder management abilities.\n\nKey Responsibilities:\n- Define and execute product roadmap and strategy\n- Conduct market research and competitive analysis\n- Collaborate with engineering, design, and marketing teams\n- Gather and prioritize product requirements\n- Analyze product metrics and user feedback\n- Lead product launches and go-to-market strategies\n- Manage stakeholder expectations and communications\n\nRequired Skills:\n- 5+ years of product management experience\n- Strong analytical and data-driven decision making\n- Experience with agile development methodologies\n- Proficiency in product management tools (Jira, Figma, Analytics)\n- Excellent communication and presentation skills\n- Experience with B2B or SaaS products\n- Strong understanding of UX/UI principles\n\nPreferred Skills:\n- MBA or equivalent business education\n- Technical background or engineering degree\n- Experience in fintech or healthcare industry\n- Knowledge of A/B testing and experimentation\n- Previous startup or scale-up experience\n\nLanguages: English (fluent), German (fluent), French (basic)\n\nWhat We Offer:\n- Competitive salary with performance bonuses\n- Equity participation program\n- Flexible working arrangements\n- Budget for conferences and training\n- Comprehensive health and wellness benefits\n- Modern office space in Basel city center")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Product Manager</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Job Title: Senior UX Designer\n\nCompany: DesignStudio Ltd\nLocation: Geneva, Switzerland\nContract Type: Permanent\nWork Mode: Hybrid (2 days office, 3 days remote)\nDepartment: Design\nSalary: CHF 85,000 - 115,000\nStart Date: April 2024\nPriority: Medium\n\nJob Description:\nWe are seeking a talented Senior UX Designer to join our creative team and help shape the future of digital experiences. You will be responsible for creating intuitive, user-centered designs that solve complex problems and delight our users. This role offers the opportunity to work on diverse projects across web and mobile platforms.\n\nKey Responsibilities:\n- Conduct user research and usability testing\n- Create wireframes, prototypes, and high-fidelity designs\n- Collaborate with product managers and developers\n- Develop and maintain design systems\n- Present design concepts to stakeholders\n- Iterate designs based on user feedback and analytics\n- Mentor junior designers and promote design thinking\n\nRequired Skills:\n- 4+ years of UX/UI design experience\n- Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)\n- Strong understanding of user-centered design principles\n- Experience with user research and testing methodologies\n- Knowledge of responsive and mobile design\n- Understanding of accessibility standards (WCAG)\n- Excellent visual design and typography skills\n\nPreferred Skills:\n- Experience with design systems and component libraries\n- Knowledge of HTML/CSS and front-end development\n- Familiarity with prototyping tools (Principle, Framer)\n- Background in psychology or human-computer interaction\n- Experience in B2B or enterprise software design\n\nLanguages: English (fluent), French (fluent), German (conversational)\n\nWhat We Offer:\n- Competitive salary and creative freedom\n- State-of-the-art design tools and equipment\n- Flexible working arrangements\n- Professional development budget\n- Creative workshops and design conferences\n- Beautiful studio space in Geneva")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Palette className="h-4 w-4" />
                        <span>UX Designer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Job Title: Senior Data Scientist\n\nCompany: DataTech Analytics\nLocation: Lausanne, Switzerland\nContract Type: Permanent\nWork Mode: Remote\nDepartment: Data Science\nSalary: CHF 130,000 - 160,000\nStart Date: May 2024\nPriority: High\n\nJob Description:\nWe are seeking an experienced Senior Data Scientist to join our AI/ML team and drive data-driven insights across our organization. You will work with large datasets, develop predictive models, and collaborate with cross-functional teams to solve complex business problems using advanced analytics and machine learning techniques.\n\nKey Responsibilities:\n- Design and implement machine learning models and algorithms\n- Analyze large, complex datasets to extract actionable insights\n- Collaborate with engineers to deploy models in production\n- Present findings and recommendations to stakeholders\n- Mentor junior data scientists and analysts\n- Stay current with latest ML/AI research and techniques\n- Lead data science projects from conception to deployment\n\nRequired Skills:\n- PhD or Master's in Data Science, Statistics, Computer Science, or related field\n- 5+ years of experience in data science and machine learning\n- Proficiency in Python, R, SQL, and statistical analysis\n- Experience with ML frameworks (TensorFlow, PyTorch, scikit-learn)\n- Knowledge of cloud platforms (AWS, GCP, Azure)\n- Strong experience with data visualization tools\n- Excellent analytical and problem-solving skills\n\nPreferred Skills:\n- Experience with deep learning and neural networks\n- Knowledge of MLOps and model deployment pipelines\n- Familiarity with big data technologies (Spark, Hadoop)\n- Experience in NLP or computer vision\n- Previous experience in fintech or healthcare\n- Publications in peer-reviewed journals\n\nLanguages: English (fluent), German (conversational), French (basic)\n\nWhat We Offer:\n- Highly competitive salary and equity package\n- Fully remote work with flexible hours\n- Access to cutting-edge technology and datasets\n- Conference and research publication support\n- Comprehensive benefits package\n- Collaborative and innovative work environment")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Database className="h-4 w-4" />
                        <span>Data Scientist</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Job Title: Senior DevOps Engineer\n\nCompany: CloudTech Solutions\nLocation: Bern, Switzerland\nContract Type: Permanent\nWork Mode: Hybrid (3 days office, 2 days remote)\nDepartment: Infrastructure\nSalary: CHF 115,000 - 145,000\nStart Date: Immediate\nPriority: High\n\nJob Description:\nWe are looking for an experienced Senior DevOps Engineer to lead our infrastructure automation and cloud operations. You will be responsible for designing, implementing, and maintaining scalable, secure, and reliable infrastructure solutions. This role is critical to enabling our development teams to deliver high-quality software efficiently.\n\nKey Responsibilities:\n- Design and maintain CI/CD pipelines and automation tools\n- Manage cloud infrastructure on AWS/Azure/GCP\n- Implement monitoring, logging, and alerting systems\n- Ensure security best practices and compliance\n- Collaborate with development teams on deployment strategies\n- Troubleshoot production issues and optimize performance\n- Lead infrastructure as code initiatives\n\nRequired Skills:\n- 5+ years of DevOps or infrastructure engineering experience\n- Expertise in cloud platforms (AWS, Azure, or GCP)\n- Proficiency in Infrastructure as Code (Terraform, CloudFormation)\n- Experience with containerization (Docker, Kubernetes)\n- Strong knowledge of CI/CD tools (Jenkins, GitLab CI, GitHub Actions)\n- Scripting skills (Python, Bash, PowerShell)\n- Experience with monitoring tools (Prometheus, Grafana, ELK Stack)\n\nPreferred Skills:\n- Certification in AWS, Azure, or GCP\n- Experience with service mesh technologies (Istio, Linkerd)\n- Knowledge of security scanning and compliance tools\n- Experience with database administration\n- Previous experience in fintech or regulated industries\n\nLanguages: English (fluent), German (fluent)\n\nWhat We Offer:\n- Competitive salary with performance bonuses\n- Cutting-edge technology stack\n- Flexible working arrangements\n- Professional certification support\n- Comprehensive health and pension benefits\n- Modern office in Bern with excellent transport links")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Shield className="h-4 w-4" />
                        <span>DevOps Engineer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Looking for a Frontend Developer with React experience...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Monitor className="h-4 w-4" />
                        <span>Frontend Developer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("We're hiring a Backend Developer to build scalable APIs...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Database className="h-4 w-4" />
                        <span>Backend Developer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Looking for a Business Analyst to optimize our processes...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Calculator className="h-4 w-4" />
                        <span>Business Analyst</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Job Title: Digital Marketing Manager\n\nCompany: GrowthCorp\nLocation: Lucerne, Switzerland\nContract Type: Permanent\nWork Mode: Hybrid (2 days office, 3 days remote)\nDepartment: Marketing\nSalary: CHF 75,000 - 95,000\nStart Date: June 2024\nPriority: Medium\n\nJob Description:\nWe are seeking a dynamic Digital Marketing Manager to drive our online presence and lead generation efforts. You will develop and execute comprehensive digital marketing strategies across multiple channels to increase brand awareness, generate leads, and drive revenue growth. This role offers the opportunity to work with cutting-edge marketing technologies and data analytics.\n\nKey Responsibilities:\n- Develop and execute digital marketing strategies and campaigns\n- Manage social media presence and content marketing\n- Optimize SEO/SEM and paid advertising campaigns\n- Analyze marketing metrics and ROI\n- Collaborate with sales team on lead generation\n- Manage marketing automation and CRM systems\n- Create compelling content across various digital channels\n\nRequired Skills:\n- 3+ years of digital marketing experience\n- Proficiency in Google Analytics, Google Ads, Facebook Ads\n- Experience with marketing automation tools (HubSpot, Marketo)\n- Strong understanding of SEO/SEM best practices\n- Knowledge of social media marketing and content creation\n- Excellent analytical and data interpretation skills\n- Strong written and verbal communication skills\n\nPreferred Skills:\n- Experience with B2B marketing and lead generation\n- Knowledge of email marketing best practices\n- Familiarity with CRM systems (Salesforce, HubSpot)\n- Basic understanding of HTML/CSS\n- Certification in Google Analytics or Google Ads\n- Previous experience in SaaS or technology companies\n\nLanguages: English (fluent), German (fluent), French (conversational)\n\nWhat We Offer:\n- Competitive salary with performance incentives\n- Flexible working arrangements\n- Marketing technology budget\n- Professional development opportunities\n- Health and wellness benefits\n- Dynamic and creative work environment")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Megaphone className="h-4 w-4" />
                        <span>Marketing Manager</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Looking for a Sales Representative to drive revenue growth...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Coins className="h-4 w-4" />
                        <span>Sales Representative</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("We're hiring an HR Manager to support our growing team...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Users className="h-4 w-4" />
                        <span>HR Manager</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Looking for an Accountant to manage our financial operations...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Calculator className="h-4 w-4" />
                        <span>Accountant</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("We need a Customer Support Specialist to help our clients...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Headphones className="h-4 w-4" />
                        <span>Customer Support</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Looking for a Graphic Designer to create visual content...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <PenTool className="h-4 w-4" />
                        <span>Graphic Designer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("We're hiring a Content Writer to create engaging content...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Content Writer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Looking for a Project Manager to coordinate our initiatives...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Presentation className="h-4 w-4" />
                        <span>Project Manager</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("We need a QA Engineer to ensure product quality...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <FlaskConical className="h-4 w-4" />
                        <span>QA Engineer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Looking for a Photographer to capture our brand story...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Photographer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("We're hiring a Mobile Developer to build our app...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>Mobile Developer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("Looking for a Game Developer to create interactive experiences...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Gamepad2 className="h-4 w-4" />
                        <span>Game Developer</span>
                      </button>
                      <button
                        onClick={() => setChatMessage("We need a System Administrator to manage our IT infrastructure...")}
                        className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Wrench className="h-4 w-4" />
                        <span>System Admin</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="flex items-center justify-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-700 font-medium">Recording... Click the microphone to stop</span>
                  </div>
                )}

                {/* Help Text */}
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> to process, or <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Shift + Enter</kbd> for new line
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Smart Analysis */}
          {currentStep === 'analysis' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-12 w-12 text-primary-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing your job description...</h3>
                <p className="text-gray-600">This will take just a moment while we extract the key information</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Edit */}
          {currentStep === 'review' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">Analysis completed! Review and edit the extracted information below.</span>
                </div>
              </div>

              {/* Single column layout for all form fields */}
              <div className="space-y-6">
                {/* AI Extracted Highlights */}
                {parsedData && (
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-primary-600" />
                        <span>AI Extracted Highlights</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Top Requirements</h5>
                          {(parsedData.requirements || []).length === 0 ? (
                            <p className="text-sm text-gray-500">None detected</p>
                          ) : (
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                              {(parsedData.requirements || []).slice(0, 8).map((req: string, i: number) => (
                                <li key={i}>{req}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Key Responsibilities</h5>
                          {(parsedData.responsibilities || []).length === 0 ? (
                            <p className="text-sm text-gray-500">None detected</p>
                          ) : (
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                              {(parsedData.responsibilities || []).slice(0, 8).map((r: string, i: number) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Field Selection */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-primary-600" />
                      <span>Template Fields</span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">Select which fields to include in your job posting template:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedFields).map(([field, selected]) => (
                        <label key={field} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => setSelectedFields(prev => ({ ...prev, [field]: e.target.checked }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                      ))}
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
                      {selectedFields.title && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                          <input
                            data-test="job-title"
                            {...register('title')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g., Senior Software Engineer"
                          />
                          {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
                        </div>
                      )}

                      {selectedFields.company && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                          <input
                            {...register('company')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g., Tech Corp"
                          />
                          {errors.company && <p className="text-red-600 text-sm mt-1">{errors.company.message}</p>}
                        </div>
                      )}

                      {selectedFields.location && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                          <input
                            {...register('location')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g., Zurich, Switzerland"
                          />
                          {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>}
                        </div>
                      )}

                      {selectedFields.contractType && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type *</label>
                          <select
                            {...register('contractType')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="permanent">Permanent</option>
                            <option value="freelance">Freelance</option>
                            <option value="fixed-term">Fixed-term</option>
                            <option value="internship">Internship</option>
                          </select>
                        </div>
                      )}

                      {selectedFields.workMode && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
                          <select
                            {...register('workMode')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="hybrid">Hybrid</option>
                            <option value="remote">Remote</option>
                            <option value="on-site">On-site</option>
                          </select>
                        </div>
                      )}

                      {selectedFields.startDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                          <input
                            type="date"
                            {...register('startDate')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>}
                        </div>
                      )}

                      {selectedFields.salary && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                          <input
                            {...register('salary')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g., CHF 80k - 120k"
                          />
                        </div>
                      )}

                      {selectedFields.department && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                          <select
                            {...register('department')}
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
                      )}

                      {selectedFields.description && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                          <textarea
                            data-test="job-description"
                            {...register('description')}
                            rows={8}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Describe the role, responsibilities, and requirements..."
                          />
                          {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>



                {/* Client Information */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Users className="h-5 w-5 text-primary-600" />
                      <span>Client Information</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Contact Person</label>
                        <input
                          {...register('clientContact')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., Emmanuel Dubois"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                        <input
                          type="email"
                          {...register('clientEmail')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., emmanuel@company.com"
                        />
                        {errors.clientEmail && <p className="text-red-600 text-sm mt-1">{errors.clientEmail.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Phone</label>
                        <input
                          {...register('clientPhone')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., +41 22 123 4567"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vertical</label>
                        <select
                          {...register('vertical')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select vertical...</option>
                          {verticals.map(vertical => (
                            <option key={vertical} value={vertical}>{vertical}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline & Budget */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-primary-600" />
                      <span>Timeline & Budget</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SLA Date (Closing Date)</label>
                        <input
                          type="date"
                          {...register('slaDate')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          {...register('endDate')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                        <input
                          {...register('budgetRange')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., €500k - €750k"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry Background</label>
                        <select
                          {...register('industryBackground')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select industry background...</option>
                          {industryBackgrounds.map(industry => (
                            <option key={industry} value={industry}>{industry}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional fields for skills and other details */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary-600" />
                    <span>Additional Details</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedFields.priority && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          {...register('priority')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Owner *</label>
                      <input
                        {...register('owner')}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., Sarah Johnson"
                      />
                      {errors.owner && <p className="text-red-600 text-sm mt-1">{errors.owner.message}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Tags */}
              {selectedFields.skills && (
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Code className="h-5 w-5 text-primary-600" />
                      <span>Required Skills</span>
                    </h4>
                    <div className="space-y-3">
                      {/* Display current skills */}
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-300 rounded-lg bg-gray-50">
                        {(watch('skills') || []).length > 0 ? (
                                                        (watch('skills') || []).map((skill: string, index: number) => (
                            <span 
                              key={index} 
                              className="flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentSkills = watch('skills') || [];
                                  const newSkills = currentSkills.filter((_, i) => i !== index);
                                  setValue('skills', newSkills);
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
                                const currentSkills = watch('skills') || [];
                                if (!currentSkills.includes(value)) {
                                  setValue('skills', [...currentSkills, value]);
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
                          const currentSkills = watch('skills') || [];
                          if (!currentSkills.includes(value)) {
                            setValue('skills', [...currentSkills, value]);
                            input.value = '';
                          }
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Suggested skills based on job description */}
                  {parsedData?.skills && parsedData.skills.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm text-gray-600">Suggested skills from job description:</span>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills
                          .filter((skill: string) => !(watch('skills') || []).includes(skill))
                          .map((skill: string, index: number) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                const currentSkills = watch('skills') || [];
                                setValue('skills', [...currentSkills, skill]);
                              }}
                              className="px-3 py-1 border border-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-100 transition-colors"
                            >
                              + {skill}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Project Information (Optional) */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Briefcase className="h-5 w-5 text-primary-600" />
                      <span>Add to Project (Optional)</span>
                    </h4>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Project Selection Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Options</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="projectOption"
                            value="none"
                            checked={selectedProjectOption === 'none'}
                            onChange={(e) => setSelectedProjectOption(e.target.value as 'existing' | 'new' | 'none')}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Create job without project</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="projectOption"
                            value="existing"
                            checked={selectedProjectOption === 'existing'}
                            onChange={(e) => setSelectedProjectOption(e.target.value as 'existing' | 'new' | 'none')}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Add to existing project</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="projectOption"
                            value="new"
                            checked={selectedProjectOption === 'new'}
                            onChange={(e) => setSelectedProjectOption(e.target.value as 'existing' | 'new' | 'none')}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Create new project</span>
                        </label>
                      </div>
                    </div>

                    {/* Existing Project Selection */}
                    {selectedProjectOption === 'existing' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
                        {loadingProjects ? (
                          <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                            Loading projects...
                          </div>
                        ) : (
                          <select
                            {...register('projectId')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Select a project...</option>
                            {existingProjects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name} - {project.clientName}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* New Project Creation */}
                    {selectedProjectOption === 'new' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                          <input
                            {...register('projectName')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="e.g., DataFlow Innovations - Data Engineers"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Positions</label>
                            <input
                              type="number"
                              min="1"
                              {...register('totalPositions', { valueAsNumber: true })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="5"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                            <select
                              {...register('urgencyLevel')}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                          <textarea
                            {...register('projectDescription')}
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Describe the project, context, and objectives..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Style Customization */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Palette className="h-5 w-5 text-primary-600" />
                      <span>Style Customization</span>
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStyleCustomizer(!showStyleCustomizer)}
                    >
                      {showStyleCustomizer ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide Customizer
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Customize Style
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {showStyleCustomizer && (
                    <StyleCustomizer
                      styleConfig={customStyleConfig}
                      onStyleChange={handleStyleChange}
                      onPresetChange={handlePresetChange}
                      className="mt-4"
                    />
                  )}
                  
                  {!showStyleCustomizer && (
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">Current style: <span className="font-medium">{selectedTemplate?.name || 'Modern'}</span></p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: customStyleConfig.primaryColor }}
                          />
                          <span className="text-xs">Primary Color</span>
                        </div>
                        <div className="text-xs" style={{ fontFamily: customStyleConfig.titleFont }}>
                          {customStyleConfig.titleFont} Font
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preview & Download Section with Company Logo */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <Eye className="h-5 w-5 text-primary-600" />
                        <span>Preview & Download</span>
                      </h4>
                    </div>
                    
                    {/* Company Logo Section on the same line */}
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700">Company Logo:</span>
                      {logoUrl ? (
                        <div className="relative">
                          <img 
                            src={logoUrl} 
                            alt="Company logo" 
                            className="h-12 w-12 object-contain border border-gray-200 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={handleLogoRemove}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <Trash2 className="h-2 w-2" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-12 w-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                          className="hidden"
                          id="logo-upload-preview"
                        />
                        <label
                          htmlFor="logo-upload-preview"
                          className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                      size="lg"
                    >
                      <Eye className="h-5 w-5 mr-2" />
                      Preview Job Description
                    </Button>
                    
                    <div className="text-center text-sm text-gray-500">
                      Preview your job description with logo and selected fields before downloading
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Quick Download:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => downloadJobDescription('pdf')}
                          className="w-full"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => downloadJobDescription('docx')}
                          className="w-full"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Word
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                                      onClick={goToNextStep}
                >
                  Back to Intake
                </Button>
                
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setValue('status', 'draft');
                      handleSubmit(onSubmit)();
                    }}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Continue to Configure
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Step 4: Configure & Publish */}
          {currentStep === 'configure' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">Configure job settings and distribution channels</span>
                </div>
              </div>

              {/* Pipeline Configuration */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary-600" />
                    <span>Pipeline Configuration</span>
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pipeline Stages
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStage(); } }}
                          placeholder="Add a stage (e.g., Technical Interview)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                        <button type="button" onClick={addStage} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                          Add
                        </button>
                      </div>

                      {/* Editable list */}
                      <div className="mt-3 space-y-2">
                        {/* Suggestion chips */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {stageSuggestions.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                if (!pipelineStages.some(x => x.toLowerCase() === s.toLowerCase())) {
                                  setPipelineStages(prev => [...prev, s]);
                                }
                              }}
                              className="px-2 py-1 rounded-full text-xs border border-gray-300 hover:bg-gray-50"
                            >
                              + {s}
                            </button>
                          ))}
                        </div>

                        {pipelineStages.map((stage, index) => (
                          <div key={`${stage}-${index}`} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={stage}
                              onChange={(e) => updateStage(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            />
                            <button type="button" onClick={() => moveStageUp(index)} className="px-2 py-1 border rounded text-xs">↑</button>
                            <button type="button" onClick={() => moveStageDown(index)} className="px-2 py-1 border rounded text-xs">↓</button>
                            <button type="button" onClick={() => removeStage(index)} className="px-2 py-1 border rounded text-xs text-red-600">Remove</button>
                          </div>
                        ))}
                      </div>

                      {/* Pipeline Preview with proper spacing and kanban colors */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                        <h5 className="text-sm font-medium text-blue-900 mb-3">Pipeline Preview:</h5>
                        <div className="flex items-center space-x-2 text-sm">
                          {pipelineStages.map((stage, index) => {
                            // Get colors that match the kanban board
                            const getStageColor = (stageName: string, stageIndex: number) => {
                              const lowerStage = stageName.toLowerCase();
                              if (lowerStage.includes('sourced') || lowerStage.includes('source')) return 'bg-gray-100 text-gray-800';
                              if (lowerStage.includes('screen') || lowerStage.includes('phone')) return 'bg-blue-100 text-blue-800';
                              if (lowerStage.includes('interview') || lowerStage.includes('technical')) return 'bg-yellow-100 text-yellow-800';
                              if (lowerStage.includes('submit') || lowerStage.includes('assessment')) return 'bg-purple-100 text-purple-800';
                              if (lowerStage.includes('offer') || lowerStage.includes('reference')) return 'bg-orange-100 text-orange-800';
                              if (lowerStage.includes('hired') || lowerStage.includes('final')) return 'bg-green-100 text-green-800';
                              
                              // Fallback colors based on position
                              const colors = [
                                'bg-gray-100 text-gray-800',
                                'bg-blue-100 text-blue-800', 
                                'bg-yellow-100 text-yellow-800',
                                'bg-purple-100 text-purple-800',
                                'bg-orange-100 text-orange-800',
                                'bg-green-100 text-green-800'
                              ];
                              return colors[stageIndex % colors.length];
                            };
                            
                            return (
                              <div key={index} className="flex items-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(stage, index)}`}>
                                  {stage}
                                </span>
                                {index < pipelineStages.length - 1 && (
                                  <ArrowRight className="h-3 w-3 mx-2 text-blue-600" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recruiter Owner
                        </label>
                        <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          <option value="sarah">Sarah Chen</option>
                          <option value="marcus">Marcus Weber</option>
                          <option value="anna">Anna Müller</option>
                          <option value="current">Current User</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Manager
                        </label>
                        <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          <option value="">Select Account Manager</option>
                          <option value="john">John Smith</option>
                          <option value="lisa">Lisa Johnson</option>
                          <option value="mike">Mike Davis</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distribution Configuration */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-primary-600" />
                    <span>Distribution Channels</span>
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Internal Job Board */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">Emineon Job Board</span>
                          </div>
                          <input type="checkbox" defaultChecked className="rounded" />
                        </div>
                        <p className="text-sm text-gray-600">Internal company job board</p>
                        <p className="text-xs text-green-600 mt-1">Free</p>
                      </div>

                      {/* LinkedIn */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Linkedin className="h-5 w-5 text-blue-700" />
                            <span className="font-medium">LinkedIn</span>
                          </div>
                          <input type="checkbox" className="rounded" />
                        </div>
                        <p className="text-sm text-gray-600">Professional network posting</p>
                      </div>

                      {/* Indeed */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Search className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">Indeed</span>
                          </div>
                          <input type="checkbox" className="rounded" />
                        </div>
                        <p className="text-sm text-gray-600">Global job search platform</p>
                      </div>

                      {/* Jobup.ch */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <LocationPin className="h-5 w-5 text-red-600" />
                            <span className="font-medium">Jobup.ch</span>
                          </div>
                          <input type="checkbox" className="rounded" />
                        </div>
                        <p className="text-sm text-gray-600">Swiss job portal</p>
                      </div>
                    </div>

                    {/* Social Media Promotion */}
                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                        <Share2 className="h-4 w-4 text-gray-600" />
                        <span>Social Media Promotion</span>
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input type="checkbox" className="rounded" />
                          <Linkedin className="h-4 w-4 text-blue-700" />
                          <span className="text-sm">LinkedIn Post</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input type="checkbox" className="rounded" />
                          <Twitter className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Twitter</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input type="checkbox" className="rounded" />
                          <Facebook className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">Facebook</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input type="checkbox" className="rounded" />
                          <Instagram className="h-4 w-4 text-pink-600" />
                          <span className="text-sm">Instagram</span>
                        </label>
                      </div>
                    </div>

                    {/* Auto-generated Social Media Post Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-600" />
                        <span>Post Preview</span>
                      </h5>
                      
                      {!showPostEditor ? (
                        <>
                          <div className="bg-white border border-gray-200 rounded p-3 text-sm">
                            {customPost ? (
                              <div className="whitespace-pre-wrap">{customPost}</div>
                            ) : (
                              <>
                                <p>🚀 We're hiring a <strong>{watch('title') || 'Software Engineer'}</strong> for {watch('company') || 'our client'} in {watch('location') || 'Zurich'}!</p>
                                <p className="mt-2">✨ {watch('contractType') === 'fixed-term' ? 'Fixed-term opportunity' : 'Permanent position'}</p>
                                <p>📍 {watch('workMode') === 'remote' ? 'Remote work' : watch('workMode') === 'hybrid' ? 'Hybrid work' : 'On-site'}</p>
                                <p className="mt-2">Apply now 👉 [link]</p>
                                <p className="text-gray-500 mt-2">#hiring #jobs #{watch('department')?.toLowerCase().replace(' ', '') || 'tech'}</p>
                              </>
                            )}
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setShowPostEditor(true)}
                            >
                              <PenTool className="h-4 w-4 mr-1" />
                              Edit Post
                            </Button>
                            {customPost && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setCustomPost('');
                                  setShowPostEditor(false);
                                }}
                              >
                                Reset to Default
                              </Button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            value={customPost || `🚀 We're hiring a ${watch('title') || 'Software Engineer'} for ${watch('company') || 'our client'} in ${watch('location') || 'Zurich'}!

✨ ${watch('contractType') === 'fixed-term' ? 'Fixed-term opportunity' : 'Permanent position'}
📍 ${watch('workMode') === 'remote' ? 'Remote work' : watch('workMode') === 'hybrid' ? 'Hybrid work' : 'On-site'}

Apply now 👉 [link]

#hiring #jobs #${watch('department')?.toLowerCase().replace(' ', '') || 'tech'}`}
                            onChange={(e) => setCustomPost(e.target.value)}
                            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Customize your social media post..."
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {customPost?.length || 0} characters
                            </span>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setShowPostEditor(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => setShowPostEditor(false)}
                                className="bg-primary-600 hover:bg-primary-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Save Post
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                >
                  Back to Review
                </Button>
                
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setValue('status', 'draft');
                      handleSubmit(onSubmit)();
                    }}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    data-test="publish-job"
                    type="button"
                    onClick={() => {
                      setValue('status', 'active');
                      handleSubmit(onSubmit)();
                    }}
                                         className="bg-green-600 hover:bg-green-700 text-white"
                   >
                     <Zap className="h-4 w-4 mr-2" />
                     Publish Job
                   </Button>
                 </div>
               </div>
             </div>
           )}

          {/* Step 5: Success & Next Actions */}
          {currentStep === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Job Created Successfully!</h3>
                <p className="text-gray-600">
                  Your job "{watch('title') || 'New Job'}" has been {watch('status') === 'active' ? 'published and is now live' : 'saved as draft'}
                </p>
              </div>

              {/* Job Summary */}
              <Card className="text-left">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Job Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Title:</span>
                      <p className="font-medium">{watch('title')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Company:</span>
                      <p className="font-medium">{watch('company')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <p className="font-medium">{watch('location')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className={`font-medium ${watch('status') === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {watch('status') === 'active' ? 'Published' : 'Draft'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Actions */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">What would you like to do next?</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => {
                      if (createdJob?.id) {
                        window.location.href = `/jobs/${createdJob.id}`;
                      }
                    }}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Job Details
                  </Button>
                  
                  <Button
                    onClick={handleAIMatching}
                    disabled={isMatching || !createdJobId}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isMatching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        AI Matching...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        ✨ AI Matching
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (createdJob?.id) {
                        window.location.href = `/jobs/${createdJob.id}#candidates`;
                      }
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Candidates
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Copy job link to clipboard
                      navigator.clipboard.writeText(`${window.location.origin}/apply/${createdJob?.publicToken || createdJob?.id}`);
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Job Link
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetModal();
                      setCurrentStep('intake');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Another Job
                  </Button>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
         </div>
       </div>
       
       {/* Job Preview Modal */}
       <JobPreviewModal
         isOpen={showPreviewModal}
         onClose={() => setShowPreviewModal(false)}
         jobData={{
           title: watch('title') || '',
           company: watch('company') || '',
           location: watch('location') || '',
           contractType: watch('contractType') || 'permanent',
           workMode: watch('workMode') || 'hybrid',
           description: watch('description') || '',
           skills: watch('skills') || [],
           salary: watch('salary'),
           department: watch('department'),
           startDate: watch('startDate'),
           languages: watch('languages') || [],
           priority: watch('priority')
         }}
         logoUrl={logoUrl || undefined}
         selectedFields={selectedFields}
         selectedTemplate={selectedTemplate}
        customStyleConfig={customStyleConfig}
         onDownload={downloadJobDescription}
       />
       
       {/* AI Matching Results Modal */}
       {showAIMatching && (
         <div className="fixed inset-0 z-60 overflow-y-auto">
           <div className="flex items-center justify-center min-h-screen px-4">
             <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowAIMatching(false)} />
             <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                     <Brain className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-semibold text-gray-900">✨ AI Matching Results</h3>
                     <p className="text-gray-600">Top matching candidates for this position</p>
                   </div>
                 </div>
                 <button onClick={() => setShowAIMatching(false)} className="text-gray-400 hover:text-gray-600">
                   <X className="h-6 w-6" />
                 </button>
               </div>
               
               <div className="space-y-4">
                 {matchingResults.map((match, index) => (
                   <div key={match.candidateId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center space-x-3">
                         <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                         <div>
                           <h4 className="font-semibold text-gray-900">Candidate ID: {match.candidateId}</h4>
                           <div className="flex items-center space-x-2 mt-1">
                             <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                               match.score >= 80 ? 'bg-green-100 text-green-800' :
                               match.score >= 60 ? 'bg-blue-100 text-blue-800' :
                               match.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                               'bg-red-100 text-red-800'
                             }`}>
                               <Star className="h-4 w-4" />
                               <span>{match.score}% Match</span>
                             </div>
                             <span className="text-xs text-gray-500">
                               {match.score >= 80 ? 'Excellent Match' :
                                match.score >= 60 ? 'Good Fit' :
                                match.score >= 40 ? 'Moderate Fit' : 'Poor Fit'}
                             </span>
                           </div>
                         </div>
                       </div>
                       <Button
                         size="sm"
                         onClick={() => {
                           // Add candidate to job
                           window.location.href = `/jobs/${createdJobId}#candidates`;
                         }}
                       >
                         Add to Job
                       </Button>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                       <div>
                         <h5 className="font-medium text-green-700 mb-2">✅ Key Matches</h5>
                         <ul className="space-y-1">
                           {match.keyMatches?.map((keyMatch: string, idx: number) => (
                             <li key={idx} className="text-green-600">• {keyMatch}</li>
                           ))}
                         </ul>
                       </div>
                       <div>
                         <h5 className="font-medium text-orange-700 mb-2">⚠️ Gaps</h5>
                         <ul className="space-y-1">
                           {match.gaps?.map((gap: string, idx: number) => (
                             <li key={idx} className="text-orange-600">• {gap}</li>
                           ))}
                         </ul>
                       </div>
                     </div>
                     
                     <div className="mt-3">
                       <h5 className="font-medium text-gray-700 mb-2">💡 AI Reasoning</h5>
                       <p className="text-gray-600 text-sm">{match.reasoning}</p>
                     </div>
                     
                     {match.recommendations && match.recommendations.length > 0 && (
                       <div className="mt-3">
                         <h5 className="font-medium text-blue-700 mb-2">🎯 Recommendations</h5>
                         <ul className="space-y-1">
                           {match.recommendations.map((rec: string, idx: number) => (
                             <li key={idx} className="text-blue-600 text-sm">• {rec}</li>
                           ))}
                         </ul>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
               
               <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                 <Button variant="outline" onClick={() => setShowAIMatching(false)}>
                   Close
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
  );
}
