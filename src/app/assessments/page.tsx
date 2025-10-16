'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Send, Grid, List, Code, Brain, Award, 
  X, ChevronDown, ChevronUp, ClipboardList, Edit, Shield, Copy, ArrowRight,
  UserPlus, UserCheck, Calendar, Plus, Settings, Search, Clock, Users, 
  FileText, CheckCircle, AlertCircle, Eye, Download, 
  Filter, Star, Building, Phone, Mail, MapPin, 
  Globe, Zap, Activity, TrendingUp, Briefcase, ArrowUpRight, ArrowLeft, Play,
  BarChart3, MoreVertical, Mic, Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { AnimatedPageTitle } from '@/components/ui/AnimatedPageTitle';
import { FileText as FileTextIcon } from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  type: 'technical' | 'personality' | 'cognitive';
  description: string;
  duration: number;
  questions: number;
  status: 'draft' | 'active' | 'completed';
  candidates: number;
  averageScore: number;
  createdAt: string;
  aiGenerated?: boolean;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  status: 'invited' | 'started' | 'completed' | 'expired';
  score?: number;
  invitedAt: string;
  startedAt?: string;
  completedAt?: string;
  tags?: string[];
  // Additional fields for detailed view
  rank?: number;
  duration?: string;
  points?: number;
  maxPoints?: number;
  percentage?: number;
  skills?: {
    name: string;
    score: number;
    maxScore: number;
    percentage: number;
  }[];
  history?: {
    action: string;
    timestamp: string;
    location?: string;
  }[];
  country?: string;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType] = useState('all');
  const [selectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'candidates' | 'score'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
  const [showHeaderMetrics, setShowHeaderMetrics] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'details' | 'questions' | 'settings'>('list');
  const [settingsTab, setSettingsTab] = useState<'general' | 'communication'>('general');
  // Persist created assessments locally (later: load from API)
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  
  // Candidate drawer states
  const [showCandidateDrawer, setShowCandidateDrawer] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateDrawerTab, setCandidateDrawerTab] = useState<'report' | 'candidate'>('report');
  
  // Create Assessment Modal States (enhanced)
  const [createStep, setCreateStep] = useState<'describe' | 'analyze' | 'editor' | 'summary'>('describe');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedExperience, setSelectedExperience] = useState<'junior' | 'senior' | 'expert'>('senior');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [describeText, setDescribeText] = useState('');
  const [describeUploading, setDescribeUploading] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeDuration, setAnalyzeDuration] = useState<number>(60);
  const [analyzeDifficulty, setAnalyzeDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [categoryMap, setCategoryMap] = useState<Record<string, string[]>>({});
  const [categoryNewTag, setCategoryNewTag] = useState<Record<string, string>>({});

  const handleAddCategoryTag = (category: string) => {
    const value = (categoryNewTag[category] || '').trim();
    if (!value) return;
    setCategoryMap((prev) => ({
      ...prev,
      [category]: Array.from(new Set([...(prev[category] || []), value]))
    }));
    setCategoryNewTag((prev) => ({ ...prev, [category]: '' }));
  };

  const handleRemoveCategoryTag = (category: string, tag: string) => {
    setCategoryMap((prev) => ({
      ...prev,
      [category]: (prev[category] || []).filter((t) => t !== tag)
    }));
  };

  // Centralized analyze handler (used on step transition and in-page)
  const runAnalyze = async () => {
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    try {
      const res = await fetch('/api/assessments/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: describeText, preferTypes: selectedTypes })
      });
      const json = await res.json();
      if (json?.success) {
        const data = json.data;
        if (Array.isArray(data?.skills)) setSelectedSkills(data.skills);
        if (Array.isArray(data?.types)) setSelectedTypes(data.types);
        if (data?.duration) setAnalyzeDuration(Number(data.duration));
        if (data?.difficulty) setAnalyzeDifficulty(data.difficulty);
        if (data?.categories) setCategoryMap(data.categories);
      } else {
        setAnalyzeError('AI analysis failed');
      }
    } catch {
      setAnalyzeError('AI analysis failed');
    } finally {
      setAnalyzeLoading(false);
    }
  };
  type BlockKind = 'multiple_choice' | 'code' | 'debugging' | 'architecture' | 'scenario' | 'take_home' | 'language' | 'personality' | 'cognitive';
  const [builderBlocks, setBuilderBlocks] = useState<Array<{ id: string; kind: BlockKind; label: string; duration: number; weight: number; difficulty: 'beginner' | 'intermediate' | 'advanced' }>>([]);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const [generatingLoading, setGeneratingLoading] = useState(false);

  const assessmentTypeCatalog: { id: string; label: string; group: 'Technical' | 'Functional' | 'Other' }[] = [
    { id: 'technical_mcq', label: 'MCQ', group: 'Technical' },
    { id: 'technical_code', label: 'Coding', group: 'Technical' },
    { id: 'debugging', label: 'Debugging', group: 'Technical' },
    { id: 'architecture', label: 'Architecture', group: 'Technical' },
    { id: 'functional_pm', label: 'Product/PM', group: 'Functional' },
    { id: 'functional_qa', label: 'QA', group: 'Functional' },
    { id: 'language', label: 'Language', group: 'Other' },
    { id: 'personality', label: 'Personality', group: 'Other' },
    { id: 'cognitive', label: 'Cognitive', group: 'Other' },
  ];

  const assessmentTemplates: Array<{ id: string; name: string; description: string; tags: string[]; blocks: Array<{ kind: BlockKind; label: string; duration: number; weight: number; difficulty: 'beginner' | 'intermediate' | 'advanced' }> }> = [
    {
      id: 'tpl_fe_senior',
      name: 'Frontend Senior (React)',
      description: 'Balanced MCQ, coding and debugging tasks focused on React/JS/TS.',
      tags: ['React', 'TypeScript', 'Debugging'],
      blocks: [
        { kind: 'multiple_choice', label: 'React/TS MCQ', duration: 15, weight: 5, difficulty: 'intermediate' },
        { kind: 'code', label: 'React Coding', duration: 30, weight: 8, difficulty: 'advanced' },
        { kind: 'debugging', label: 'Bug Fixing', duration: 20, weight: 6, difficulty: 'intermediate' },
      ],
    },
    {
      id: 'tpl_be_java',
      name: 'Backend Senior (Java)',
      description: 'Java, Spring, architecture and debugging focus.',
      tags: ['Java', 'Spring', 'Architecture'],
      blocks: [
        { kind: 'multiple_choice', label: 'Java/Spring MCQ', duration: 15, weight: 5, difficulty: 'intermediate' },
        { kind: 'architecture', label: 'System Design', duration: 25, weight: 7, difficulty: 'advanced' },
        { kind: 'debugging', label: 'Log Analysis', duration: 15, weight: 5, difficulty: 'intermediate' },
      ],
    },
    {
      id: 'tpl_fullstack_mid',
      name: 'Fullstack Mid',
      description: 'Fullstack tasks with moderate coding and MCQ.',
      tags: ['Node', 'React', 'REST'],
      blocks: [
        { kind: 'multiple_choice', label: 'Web MCQ', duration: 12, weight: 4, difficulty: 'beginner' },
        { kind: 'code', label: 'API Coding', duration: 25, weight: 6, difficulty: 'intermediate' },
      ],
    },
  ];
  
  // Available roles
  const roles = [
    'Front-end', 'Back-end', 'Full-stack',
    'Mobile', 'Data engineer', 'Data scientist',
    'SRE / DevOps', 'Cybersecurity', 'Embedded',
    'Other'
  ];
  
  // Available skills (this would typically come from an API)
  const availableSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
    'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'Git', 'CI/CD', 'Jenkins', 'GitHub Actions',
    'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Bootstrap',
    'REST APIs', 'GraphQL', 'Microservices', 'WebSockets',
    'Jest', 'Cypress', 'Selenium', 'Unit Testing',
    'Agile', 'Scrum', 'Kanban', 'Project Management',
    'Machine Learning', 'Data Analysis', 'TensorFlow', 'PyTorch',
    'Cybersecurity', 'Penetration Testing', 'Network Security',
    'Bash', 'PowerShell', 'Linux', 'Windows Server'
  ];
  
  const filteredSkills = availableSkills.filter(skill =>
    skill.toLowerCase().includes(skillSearchQuery.toLowerCase()) &&
    !selectedSkills.includes(skill)
  );
  
  // Invite modal state
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    tags: '',
    customMessage: '',
    emailSubject: 'Technical assessment',
    introTitle: 'Welcome. You\'ve been invited to take an assessment.',
    introText: 'Thank you for your interest in our company. We would like to invite you to take a technical assessment.',
    endTitle: 'Your assessment has been successfully submitted',
    endText: 'Thank you for completing the assessment. We will review your results and get back to you soon.'
  });

  const [inviteStep, setInviteStep] = useState<'form' | 'preview' | 'settings'>('form');
  const [inviteSettings, setInviteSettings] = useState({
    testName: '',
    languages: {
      english: true,
      french: false,
      spanish: false
    },
    invitationExpiry: 30,
    simplifiedReport: true,
    timerType: 'per-question',
    noTimeLimit: false,
    testIntegrity: {
      unusualActivity: true,
      copyPasteBlocking: true,
      followUpQuestions: false,
      webcamProctoring: false,
      fullScreenMode: false
    },
    customBranding: true,
    logoFile: null as File | null
  });

  // Generated questions state (from AI)
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  const [testCandidates, setTestCandidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'Achille BRAHIRI',
      email: 'abrahiri@gmail.com',
      status: 'expired',
      invitedAt: '2024-06-13T15:41:00Z',
      history: [
        { action: 'Invitation expired', timestamp: '2024-06-13T15:41:00Z' },
        { action: 'Assessment sent', timestamp: '2024-05-14T15:41:00Z', location: 'By LEFEBVRE' }
      ]
    },
    {
      id: '2',
      name: 'Naoufal BENHMIMOU',
      email: 'Naoufal.ben@gmail.com',
      status: 'completed',
      score: 52,
      rank: 3,
      duration: '1 h 2 min',
      points: 1520,
      maxPoints: 2100,
      percentage: 72,
      invitedAt: '2024-05-15T08:38:00Z',
      completedAt: '2024-05-15T10:15:00Z',
      startedAt: '2024-05-15T07:36:00Z',
      country: 'France',
      skills: [
        { name: 'Language knowledge', score: 120, maxScore: 180, percentage: 67 },
        { name: 'Problem solving', score: 260, maxScore: 390, percentage: 67 },
        { name: 'Reliability', score: 60, maxScore: 60, percentage: 100 }
      ],
      history: [
        { action: 'Assessment completed', timestamp: '2024-05-15T08:38:00Z', location: 'France' },
        { action: 'Assessment started', timestamp: '2024-05-15T07:36:00Z', location: 'France' },
        { action: 'Assessment opened', timestamp: '2024-05-15T04:06:00Z', location: 'France' },
        { action: 'Assessment sent', timestamp: '2024-05-14T15:41:00Z', location: 'By LEFEBVRE' }
      ]
    },
    {
      id: '3',
      name: 'Killian Lucas',
      email: 'contact.killian.lucas@gmail.com',
      status: 'expired',
      invitedAt: '2024-04-06T09:58:00Z',
      history: [
        { action: 'Invitation expired', timestamp: '2024-04-06T09:58:00Z' },
        { action: 'Test sent', timestamp: '2024-03-07T09:58:00Z', location: 'By LEFEBVRE' }
      ]
    },
    {
      id: '4',
      name: 'John ALLOU',
      email: 'bjohnalloupro@gmail.com',
      status: 'expired',
      invitedAt: '2024-03-13T11:04:00Z',
      tags: ['Genève'],
      history: [
        { action: 'Invitation expired', timestamp: '2024-03-13T11:04:00Z' },
        { action: 'Test sent', timestamp: '2024-02-13T11:04:00Z', location: 'By LEFEBVRE' }
      ]
    }
  ]);

  // Load candidates from API to link assessments to the database
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/candidates', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = await res.json();
        // Map API candidates into local Candidate shape (best-effort)
        const mapped: Candidate[] = (data?.candidates || data || []).slice(0, 25).map((c: any, idx: number) => ({
          id: String(c.id ?? idx + 1),
          name: c.name || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Candidate',
          email: c.email || 'unknown@example.com',
          status: 'invited',
          invitedAt: new Date().toISOString(),
          tags: c.technicalSkills || c.tags || [],
        }));
        if (mapped.length) setTestCandidates(mapped);
      } catch {}
    })();
  }, [getToken]);

  // Filter real assessments (created by user)
  const filteredAssessments: Assessment[] = assessments.filter((a) => {
    const matchesSearch =
      (a.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (a.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (a.tags || []).some((t) => (t || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || a.type === (selectedType as any);
    const matchesStatus = selectedStatus === 'all' || a.status === (selectedStatus as any);
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      'draft': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      'completed': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
      'invited': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Invited' },
      'started': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Started' },
      'expired': { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleInviteCandidate = () => {
    if (inviteForm.name && inviteForm.email && selectedAssessment) {
      const newCandidate: Candidate = {
        id: Date.now().toString(),
        name: inviteForm.name,
        email: inviteForm.email,
        status: 'invited',
        invitedAt: new Date().toISOString(),
        tags: inviteForm.tags ? inviteForm.tags.split(',').map(t => t.trim()) : undefined
      };
      
      setTestCandidates([...testCandidates, newCandidate]);
      setInviteForm({ 
        name: '', 
        email: '', 
        tags: '',
        customMessage: '',
        emailSubject: 'Technical assessment',
        introTitle: 'Welcome. You\'ve been invited to take a test.',
        introText: 'Thank you for your interest in our company. We would like to invite you to take a technical assessment.',
        endTitle: 'Your assessment has been successfully submitted',
        endText: 'Thank you for completing the assessment. We will review your results and get back to you soon.'
      });
      setShowInviteModal(false);
      setInviteStep('form');
      
      // In this demo view, we are not tracking per-assessment candidate counts on candidate items
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateAssessment = () => {
    // Generate test name based on selections
    const testName = `${selectedRole} - ${selectedSkills.slice(0, 3).join(', ')} - ${selectedExperience.charAt(0).toUpperCase() + selectedExperience.slice(1)}`;
    
    // Create new assessment
    const newAssessment: Assessment = {
      id: Date.now().toString(),
      title: testName,
      type: 'technical',
      description: `${selectedExperience.charAt(0).toUpperCase() + selectedExperience.slice(1)}-level assessment for ${selectedRole} developers`,
      duration: selectedExperience === 'junior' ? 60 : selectedExperience === 'senior' ? 90 : 120,
      questions: selectedExperience === 'junior' ? 15 : selectedExperience === 'senior' ? 20 : 25,
      status: 'draft',
      candidates: 0,
      averageScore: 0,
      createdAt: new Date().toISOString().split('T')[0],
      tags: selectedSkills,
      difficulty: selectedExperience === 'junior' ? 'beginner' : selectedExperience === 'senior' ? 'intermediate' : 'advanced'
    };
    
    // Add to local list and navigate to questions
    setAssessments(prev => [newAssessment, ...prev]);
    setSelectedAssessment(newAssessment);
    setCurrentView('questions');
  };

  const resetCreateModal = () => {
    setCreateStep('describe');
    setSelectedRole('');
    setSelectedExperience('senior');
    setSelectedSkills([]);
    setSkillSearchQuery('');
    setGeneratedQuestions([]);
    setSelectedTypes([]);
    setSelectedTemplateId('');
    setBuilderBlocks([]);
    setDescribeText('');
    setIsDictating(false);
    setAnalyzeError(null);
    setAnalyzeLoading(false);
    setEditorFullscreen(false);
  };

  // Voice dictation handlers (Web Speech API)
  const startDictation = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    if (!recognitionRef.current) {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setDescribeText((prev) => (prev ? prev + ' ' : '') + transcript.trim());
      };
      rec.onerror = () => setIsDictating(false);
      rec.onend = () => setIsDictating(false);
      recognitionRef.current = rec;
    }
    try {
      recognitionRef.current.start();
      setIsDictating(true);
    } catch {}
  };

  const stopDictation = () => {
    try {
      recognitionRef.current?.stop?.();
    } finally {
      setIsDictating(false);
    }
  };

  const handleCloseCreateModal = () => {
    resetCreateModal();
    setShowCreateModal(false);
  };

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  const handleGenerateAI = async () => {
    try {
      const token = await getToken();
      const body = {
        jobTitle: selectedRole || 'Software Engineer',
        jobDescription: selectedSkills.join(', '),
        assessmentType: 'technical',
        skillLevel: selectedExperience === 'junior' ? 'beginner' : selectedExperience === 'senior' ? 'intermediate' : 'advanced',
        duration: selectedExperience === 'junior' ? 60 : selectedExperience === 'senior' ? 90 : 120,
        focusAreas: selectedSkills,
        includeCodeChallenges: true,
      };
      const res = await fetch('/api/assessments/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json?.success && Array.isArray(json.questions)) {
        // Ensure an assessment is selected for editor view
        if (!selectedAssessment) {
          setSelectedAssessment({
            id: `temp_${Date.now()}`,
            title: selectedRole || 'Assessment',
            description: selectedSkills.join(', '),
            type: 'technical',
            duration: analyzeDuration,
            questions: json.questions.length,
            status: 'draft',
            candidates: 0,
            averageScore: 0,
            createdAt: new Date().toISOString(),
          } as any);
        }
        setGeneratedQuestions(json.questions);
        setCurrentView('questions');
      } else {
        alert('Failed to generate questions');
      }
    } catch (e) {
      alert('AI generation failed');
    }
  };

  // Generate questions from Step 2 tags (categories) using OpenAI API
  const generateFromTags = async (append: boolean = false) => {
    try {
      setGeneratingLoading(true);
      const token = await getToken();
      const focusAreas = Array.from(
        new Set(
          Object.values(categoryMap || {})
            .flat()
            .filter(Boolean)
        )
      );

      const body = {
        jobTitle: selectedRole || 'Assessment',
        jobDescription: Object.entries(categoryMap)
          .map(([cat, tags]) => `${cat}: ${tags?.join(', ')}`)
          .join(' | '),
        assessmentType: 'technical',
        skillLevel: analyzeDifficulty,
        duration: analyzeDuration,
        focusAreas,
        includeCodeChallenges: true,
      };

      const res = await fetch('/api/assessments/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      let questions: any[] = [];
      if (json?.success && Array.isArray(json.questions)) {
        questions = json.questions as any[];
      }

      // Assign categories heuristically based on tag matches
      const lowerCatMap: Record<string, string[]> = Object.fromEntries(
        Object.entries(categoryMap || {}).map(([cat, tags]) => [
          cat,
          (tags || []).map((t) => String(t).toLowerCase()),
        ])
      );

      const categorized = (questions || []).map((q: any, idx: number) => {
        const text = String(q.question || '').toLowerCase();
        let matched: string | undefined;
        for (const [cat, tags] of Object.entries(lowerCatMap)) {
          if (tags.some((t) => t && text.includes(t))) {
            matched = cat;
            break;
          }
        }
        return { ...q, id: q.id || `ai_${Date.now()}_${idx}`, category: matched || 'Uncategorized' };
      });

      if (append) {
        setGeneratedQuestions(prev => [...prev, ...categorized]);
      } else {
        setGeneratedQuestions(categorized);
      }
      return categorized;
    } catch (e) {
      console.error('generateFromTags failed', e);
      return [] as any[];
    }
    finally {
      setGeneratingLoading(false);
    }
  };

  const addManualQuestionGlobal = () => {
    setGeneratedQuestions(prev => ([
      ...prev,
      { id: `manual_${Date.now()}`,
        type: 'text',
        question: '',
        options: [],
        weight: 1,
        difficulty: analyzeDifficulty,
        category: 'Uncategorized' }
    ]));
  };

  const addRandomBlockGlobal = async () => {
    await generateFromTags(true);
  };

  // ----- Generated questions editing helpers -----
  const updateGeneratedQuestion = (idx: number, key: string, value: any) => {
    setGeneratedQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [key]: value } : q));
  };

  const computeCategoryCounts = () => {
    const counts: Record<string, number> = {};
    (generatedQuestions || []).forEach((q: any) => {
      const cat = (q.category || 'Uncategorized') as string;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  };

  const addGeneratedOption = (idx: number) => {
    setGeneratedQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      const opts = Array.isArray(q.options) ? q.options : [];
      return { ...q, options: [...opts, ''] };
    }));
  };

  const updateGeneratedOption = (idx: number, optIdx: number, value: string) => {
    setGeneratedQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      const opts = Array.isArray(q.options) ? [...q.options] : [];
      opts[optIdx] = value;
      return { ...q, options: opts };
    }));
  };

  const removeGeneratedOption = (idx: number, optIdx: number) => {
    setGeneratedQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      const opts = Array.isArray(q.options) ? q.options.filter((_: any, oi: number) => oi !== optIdx) : [];
      return { ...q, options: opts };
    }));
  };

  const addGeneratedQuestion = () => {
    setGeneratedQuestions(prev => ([
      ...prev,
      { id: `custom_${Date.now()}`, type: 'text', question: '', options: [], weight: 1, difficulty: 'beginner' }
    ]));
  };

  const removeGeneratedQuestion = (idx: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // ----- Save assessment & Bulk invite -----
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [jobsOptions, setJobsOptions] = useState<Array<{ id: string; title: string }>>([]);

  const toggleCandidateSelect = (id: string) => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllCandidates = () => {
    setSelectedCandidateIds(new Set(testCandidates.map(c => c.id)));
  };

  const clearAllCandidates = () => {
    setSelectedCandidateIds(new Set());
  };

  // Load jobs for linking
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/jobs', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.jobs || [];
        setJobsOptions(arr.map((j: any) => ({ id: j.id, title: j.title })));
      } catch {}
    })();
  }, [getToken]);

  const handleSaveAssessment = async () => {
    try {
      const token = await getToken();
      const payload = {
        title: selectedAssessment?.title || selectedRole,
        description: selectedAssessment?.description || selectedSkills.join(', '),
        questions: generatedQuestions,
        jobId: selectedJobId || null,
      };
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.success) {
        // Update local list so it appears immediately in the homepage
        const saved: Assessment = {
          id: json.id || String(Date.now()),
          title: payload.title || 'Assessment',
          description: payload.description || '',
          type: 'technical',
          duration: analyzeDuration || 0,
          questions: Array.isArray(generatedQuestions) ? generatedQuestions.length : 0,
          status: 'draft',
          candidates: 0,
          averageScore: 0,
          createdAt: new Date().toISOString(),
          tags: selectedSkills,
          difficulty: analyzeDifficulty || 'intermediate',
        };
        setAssessments(prev => [saved, ...prev]);
        setShowCreateModal(false);
        setCurrentView('list');
      } else {
        alert('Failed to save assessment');
      }
    } catch {
      alert('Failed to save assessment');
    }
  };

  const handleBulkInvite = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/assessments/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          assessmentId: selectedAssessment?.id || 'temp',
          candidateIds: Array.from(selectedCandidateIds),
          jobId: selectedJobId || null,
          message: inviteForm.customMessage,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        alert(`Invitations sent: ${json.invites.length}`);
      } else {
        alert('Failed to send invitations');
      }
    } catch {
      alert('Failed to send invitations');
    }
  };

  if (currentView === 'questions' && selectedAssessment) {
    return (
      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setCurrentView('list')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedAssessment.title}</h1>
                <p className="text-gray-600 mt-1">{selectedAssessment.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3"></div>
          </div>

          {generatingLoading && (
            <div className="mb-6 border rounded-xl p-6 bg-primary-50 flex items-start">
              <div className="mr-3 mt-1"><Loader2 className="h-5 w-5 animate-spin text-primary-600" /></div>
              <div>
                <div className="font-medium text-gray-900">Generating your assessment…</div>
                <div className="text-sm text-gray-700">This will take just a moment while we create questions from your selections.</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentView('details')}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                <Users className="h-4 w-4 inline mr-2" />
                Candidates
              </button>
              <button
                onClick={() => setCurrentView('questions')}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Questions
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Settings
              </button>
              <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Insights
              </button>
            </nav>
          </div>

          {/* Assessment Overview (dynamic from categories) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.keys(categoryMap).map((cat) => {
              const count = generatedQuestions.filter((q: any) => (q.category || 'Uncategorized') === cat).length;
              const minutes = Math.max(3, Math.round(count * 2));
              const points = count * 10;
              return (
                <div key={cat} className="p-4 rounded-lg border bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cat}</p>
                      <p className="text-xs text-gray-600">~{count} questions</p>
                    </div>
                    <div className="text-gray-600">
                      <span className="text-lg font-bold">{points} pts</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">{minutes} min</div>
                </div>
              );
            })}
          </div>

          {/* Assessment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Total points: {generatedQuestions.length * 10}</p>
                  <p className="text-xs text-gray-600">Total questions: {generatedQuestions.length}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Total time: {Math.max(5, Math.round(generatedQuestions.length * 2))} min</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">Expected average score</span>
              <span className="text-2xl font-bold text-blue-600">{Math.max(40, 100 - generatedQuestions.length)}%</span>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Your assessment section */}
          <div className="bg-gray-800 text-white p-6 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                <span className="font-medium">Your assessment</span>
              </div>
              <div className="flex items-center space-x-2"></div>
            </div>

            {/* Job link and Bulk invite bar */}
            <div className="bg-gray-700 p-4 rounded-lg mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <label className="text-sm">Link to job:</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
                >
                  <option value="">None</option>
                  {jobsOptions.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" className="text-white border-white hover:bg-gray-600" onClick={handleSaveAssessment}>
                  Save Assessment
                </Button>
                <Button variant="outline" className="text-white border-white hover:bg-gray-600" onClick={() => {
                  const token = Math.random().toString(36).slice(2);
                  sessionStorage.setItem(`assessment_preview_${token}` , JSON.stringify({ title: selectedAssessment?.title || selectedRole, duration: analyzeDuration, questions: generatedQuestions }));
                  const url = `${window.location.origin}/assessments/take?token=${token}&duration=${analyzeDuration}`;
                  window.open(url, '_blank');
                }}>
                  Preview
                </Button>
                <Button variant="outline" className="text-white border-white hover:bg-gray-600" onClick={() => {
                  const token = Math.random().toString(36).slice(2);
                  sessionStorage.setItem(`assessment_preview_${token}` , JSON.stringify({ title: selectedAssessment?.title || selectedRole, duration: analyzeDuration, questions: generatedQuestions }));
                  const url = `${window.location.origin}/assessments/take?token=${token}&duration=${analyzeDuration}`;
                  navigator.clipboard.writeText(url).catch(()=>{});
                }}>
                  Copy assessment URL
                </Button>
                <Button className="bg-green-600 hover:bg-green-500" onClick={() => setCurrentView('details')}>
                  Invite candidates
                </Button>
              </div>
            </div>

            {/* Removed top-level add buttons per request */}

            {/* Generated Questions Editor */}
            {generatedQuestions.length > 0 && (
              <div className="bg-white text-gray-900 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Generated Questions</h3>
                  <div className="flex items-center space-x-4">
                    {/* Category summary */}
                    <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600">
                      {Object.entries(computeCategoryCounts()).map(([cat, cnt]) => (
                        <span key={cat} className="px-2 py-0.5 bg-gray-100 rounded">
                          {cat}: {cnt}
                        </span>
                      ))}
                    </div>
                    <Button variant="outline" onClick={addGeneratedQuestion}>Add question</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {generatedQuestions.map((q: any, idx: number) => (
                    <div key={q.id ?? idx} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <select
                            value={q.type}
                            onChange={(e) => updateGeneratedQuestion(idx, 'type', e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="text">Text</option>
                            <option value="code">Code</option>
                            <option value="rating">Rating</option>
                          </select>
                          <select
                            value={q.category || ''}
                            onChange={(e) => updateGeneratedQuestion(idx, 'category', e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            title="Category"
                          >
                            <option value="">Uncategorized</option>
                            {Object.keys(categoryMap).map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <select
                            value={q.difficulty || 'beginner'}
                            onChange={(e) => updateGeneratedQuestion(idx, 'difficulty', e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={q.weight || 1}
                            onChange={(e) => updateGeneratedQuestion(idx, 'weight', Number(e.target.value))}
                            className="w-16 border rounded px-2 py-1 text-sm"
                            title="Weight"
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => removeGeneratedQuestion(idx)}>Remove</Button>
                      </div>
                      <textarea
                        className="w-full border rounded p-2 text-sm"
                        rows={3}
                        value={q.question || ''}
                        onChange={(e) => updateGeneratedQuestion(idx, 'question', e.target.value)}
                        placeholder="Edit question text"
                      />
                      {q.type === 'multiple_choice' && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Options</span>
                            <Button variant="outline" size="sm" onClick={() => addGeneratedOption(idx)}>Add option</Button>
                          </div>
                          {(q.options || []).map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center space-x-2">
                              <input
                                className="flex-1 border rounded px-2 py-1 text-sm"
                                value={opt}
                                onChange={(e) => updateGeneratedOption(idx, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <Button variant="outline" size="sm" onClick={() => removeGeneratedOption(idx, optIdx)}>Remove</Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Removed grouped-by-category summary per user request */}
              </div>
            )}
            {/* Removed candidate selection section for cleaner assessment layout */}

            {/* Removed static demo blocks */}
          </div>

          {/* Removed tip section */}
        </div>
      </Layout>
    );
  } else if (currentView === 'settings' && selectedAssessment) {
    return (
      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setCurrentView('list')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedAssessment.title}</h1>
                <p className="text-gray-600 mt-1">{selectedAssessment.description}</p>
              </div>
            </div>
            <Button className="btn-primary">
              Save
            </Button>
          </div>

          {/* Main Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentView('details')}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                <Users className="h-4 w-4 inline mr-2" />
                Candidates
              </button>
              <button
                onClick={() => setCurrentView('questions')}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Questions
              </button>
              <button className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                <Settings className="h-4 w-4 inline mr-2" />
                Settings
              </button>
              <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Insights
              </button>
            </nav>
          </div>

          {/* Settings Sub-tabs */}
          <div className="bg-gray-50 border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setSettingsTab('general')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  settingsTab === 'general'
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                GENERAL
              </button>
              <button
                onClick={() => setSettingsTab('communication')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  settingsTab === 'communication'
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                COMMUNICATION
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="bg-white">
            {settingsTab === 'general' && (
              <div className="p-6 space-y-8">
                {/* Test Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name your assessment
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedAssessment.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    In which language should questions be asked to the candidates?
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">English</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">French</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Spanish</span>
                    </label>
                  </div>
                </div>

                {/* Invitation Expiry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of days after which invitations expire
                  </label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Simplified Report */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do you want to send candidates a simplified report at the end of their test?
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="simplified-report"
                        defaultChecked
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="simplified-report"
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                {/* Timer Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How would you like to time the candidate?
                  </label>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Timer per Question */}
                    <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          name="timer-type"
                          defaultChecked
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 font-medium text-gray-900">TIMER PER QUESTION</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Each question is timed. When the timer for a question ends, the candidate automatically moves to the next question.
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Candidates can't revisit previous questions, even if they didn't use the full time allotted for that question.
                      </p>
                      <p className="text-sm text-blue-600 font-medium">(recommended)</p>
                    </div>

                    {/* Global Timer */}
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          name="timer-type"
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 font-medium text-gray-900">GLOBAL TIMER</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Candidates have a set amount of time to complete the entire test and can pace themselves as they wish.
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        Candidates can revisit previous questions to check or update answers before submitting the test.
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Allotted time (minutes)
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                          />
                          <span className="text-sm text-gray-600">No time limit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Integrity */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Test integrity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Unusual activity alerts</h4>
                        <p className="text-sm text-gray-600">
                          Candidate reports will include alerts if suspicious activity is detected when analyzing the candidate's code.
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                        <label className="toggle-label block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer"></label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Copy/paste blocking</h4>
                        <p className="text-sm text-gray-600">
                          Candidates can't paste text from outside the environment.
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                        <label className="toggle-label block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer"></label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Follow-up questions</h4>
                        <p className="text-sm text-gray-600">
                          Candidates will sometimes answer follow-up questions after coding exercises. These questions are generated by ChatGPT and let you check candidates understand the code they provided.{' '}
                          <a href="#" className="text-blue-600 hover:underline">Find out more</a>
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                        <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Webcam proctoring</h4>
                        <p className="text-sm text-gray-600">
                          Candidates must activate their webcam before starting the test. Periodic snapshots will be taken.{' '}
                          <a href="#" className="text-blue-600 hover:underline">Find out more</a>
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                        <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Full-screen mode</h4>
                        <p className="text-sm text-gray-600">
                          Candidates must enter full-screen mode before starting the test. Exiting full-screen mode or switching to another monitor will trigger an alert.
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                        <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'communication' && (
              <div className="p-6 space-y-8">
                {/* Test Communication and Branding */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Test communication and branding</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Choose which version to use for the logo, invitation email, and test start and end messages.
                  </p>
                  
                  <div className="flex items-center space-x-4 mb-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="branding-version"
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Default version</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="branding-version"
                        defaultChecked
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Custom version for this test</span>
                    </label>
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Logo</h4>
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        <img 
                          src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png"
                          alt="Emineon Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">4MB max • 500x500px • JPG, PNG, GIF</p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Upload</Button>
                          <Button variant="outline" size="sm">Delete</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email subject
                  </label>
                  <input
                    type="text"
                    defaultValue="Technical assessment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email body
                  </label>
                  <div className="border border-gray-300 rounded-lg">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex items-center space-x-2">
                      <Button variant="outline" size="sm">B</Button>
                      <Button variant="outline" size="sm">I</Button>
                      <Button variant="outline" size="sm">≡</Button>
                      <Button variant="outline" size="sm">•</Button>
                      <Button variant="outline" size="sm">🔗</Button>
                      <Button variant="outline" size="sm">🖼</Button>
                      <Button variant="outline" size="sm">✏️</Button>
                      <span className="text-sm text-gray-600">[[LINK]]</span>
                      <span className="text-sm text-gray-600">[[NAME]]</span>
                      <div className="ml-auto">
                        <label className="flex items-center text-sm text-gray-600">
                          <input type="checkbox" className="mr-2" />
                          Source
                        </label>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-900 mb-2">Bonjour Mourchidi,</p>
                      <p className="text-sm text-gray-900 mb-2">
                        Comme convenu, vous trouverez ci-dessous le lien vers le test technique pour le poste de développeur full-stack chez notre client, Salt Mobile :
                      </p>
                      <p className="text-sm text-blue-600 underline mb-2">Open the test</p>
                      <p className="text-sm text-gray-900">
                        Nous vous souhaitons bonne chance pour votre candidature à Salt Mobile.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Introduction Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Introduction title
                  </label>
                  <input
                    type="text"
                    defaultValue="Welcome. You've been invited to take a test."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Introduction Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Introduction text
                  </label>
                  <div className="border border-gray-300 rounded-lg">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex items-center space-x-2">
                      <select className="text-sm border-none bg-transparent">
                        <option>Paragraph</option>
                      </select>
                      <Button variant="outline" size="sm">B</Button>
                      <Button variant="outline" size="sm">I</Button>
                      <Button variant="outline" size="sm">≡</Button>
                      <Button variant="outline" size="sm">•</Button>
                      <Button variant="outline" size="sm">🔗</Button>
                      <Button variant="outline" size="sm">🖼</Button>
                      <Button variant="outline" size="sm">✏️</Button>
                      <div className="ml-auto">
                        <label className="flex items-center text-sm text-gray-600">
                          <input type="checkbox" className="mr-2" />
                          Source
                        </label>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-900 mb-2">
                        You can take our tutorial first so you feel comfortable and perform your best.
                      </p>
                      <p className="text-sm text-gray-900 font-bold">
                        You must complete this test on your own.
                      </p>
                    </div>
                  </div>
                </div>

                {/* End Page Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title of your assessment's end page
                  </label>
                  <input
                    type="text"
                    defaultValue="Your assessment has been successfully submitted"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* End Page Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text for your assessment's end page
                  </label>
                  <div className="border border-gray-300 rounded-lg">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex items-center space-x-2">
                      <select className="text-sm border-none bg-transparent">
                        <option>Paragraph</option>
                      </select>
                      <Button variant="outline" size="sm">B</Button>
                      <Button variant="outline" size="sm">I</Button>
                      <Button variant="outline" size="sm">≡</Button>
                      <Button variant="outline" size="sm">•</Button>
                      <Button variant="outline" size="sm">🔗</Button>
                      <Button variant="outline" size="sm">🖼</Button>
                      <Button variant="outline" size="sm">✏️</Button>
                      <div className="ml-auto">
                        <label className="flex items-center text-sm text-gray-600">
                          <input type="checkbox" className="mr-2" />
                          Source
                        </label>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-900 mb-2">Thank you for completing the test.</p>
                      <p className="text-sm text-gray-900">The recruiter has received your results.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  } else if (currentView === 'details' && selectedAssessment) {
    return (
      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setCurrentView('list')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedAssessment.title}</h1>
                <p className="text-gray-600 mt-1">{selectedAssessment.description}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Send test
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentView('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentView === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Candidates
              </button>
              <button
                onClick={() => setCurrentView('questions')}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Questions
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Settings
              </button>
              <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Insights
              </button>
            </nav>
          </div>

          {/* Status Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button className="px-4 py-2 text-sm font-medium bg-white rounded-md shadow-sm text-gray-900">
                <Users className="h-4 w-4 inline mr-2" />
                All ({testCandidates.length})
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                To review ({testCandidates.filter(c => c.status === 'started' || c.status === 'completed').length}) <span className="ml-1 w-2 h-2 bg-red-500 rounded-full inline-block"></span>
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Rejected ({testCandidates.filter(c => c.status === 'expired').length})
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Passed ({testCandidates.filter(c => c.status === 'completed' && (c.score ?? 0) >= 60).length})
              </button>
            </div>
            
            <div className="flex items-center space-x-2 ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or tag"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    {/* Removed tech-specific columns */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testCandidates.map((candidate) => (
                    <tr 
                      key={candidate.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setShowCandidateDrawer(true);
                        setCandidateDrawerTab('report');
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(candidate.invitedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {candidate.status === 'completed' && candidate.score !== undefined ? (
                          <span className="text-sm font-medium text-gray-900">{candidate.score}%</span>
                        ) : candidate.status === 'started' ? (
                          <span className="text-sm text-gray-600">In progress</span>
                        ) : candidate.status === 'expired' ? (
                          <span className="text-sm text-gray-600">Expired</span>
                        ) : (
                          <span className="text-sm text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowInviteModal(true);
                            setInviteStep('form');
                          }}
                        >
                          Invite
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Enhanced Invite Modal */}
        {showInviteModal && (selectedAssessment || currentView === 'details') && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {inviteStep === 'form' && 'Invite candidates'}
                    {inviteStep === 'preview' && 'Preview invitation'}
                    {inviteStep === 'settings' && 'Test settings'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Test: {selectedAssessment?.title || 'Assessment'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteStep('form');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setInviteStep('form')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      inviteStep === 'form'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <UserPlus className="h-4 w-4 inline mr-2" />
                    Invite
                  </button>
                  <button
                    onClick={() => setInviteStep('preview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      inviteStep === 'preview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Eye className="h-4 w-4 inline mr-2" />
                    Preview
                  </button>
                  <button
                    onClick={() => setInviteStep('settings')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      inviteStep === 'settings'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Settings className="h-4 w-4 inline mr-2" />
                    Settings
                  </button>
                </nav>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {inviteStep === 'form' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={inviteForm.name}
                          onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                          placeholder="Ada Lovelace"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                        <input
                          type="email"
                          value={inviteForm.email}
                          onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                          placeholder="ada@example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                      <input
                        type="text"
                        value={inviteForm.tags}
                        onChange={(e) => setInviteForm({...inviteForm, tags: e.target.value})}
                        placeholder="Location, contract type, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                      <input
                        type="text"
                        value={inviteForm.emailSubject}
                        onChange={(e) => setInviteForm({...inviteForm, emailSubject: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Message</label>
                      <textarea
                        value={inviteForm.customMessage}
                        onChange={(e) => setInviteForm({...inviteForm, customMessage: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {inviteStep === 'preview' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-4">Email Preview</h4>
                      <div className="bg-white p-6 rounded border">
                        <div className="border-b pb-4 mb-4">
                          <p className="text-sm text-gray-600">Subject: {inviteForm.emailSubject}</p>
                          <p className="text-sm text-gray-600">To: {inviteForm.email}</p>
                        </div>
                        
                        {inviteSettings.customBranding && (
                          <div className="mb-6">
                            <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded text-sm font-bold">
                              Emineon
                            </div>
                          </div>
                        )}

                        <h3 className="text-xl font-semibold text-gray-900 mb-4">{inviteForm.introTitle}</h3>
                        <p className="text-gray-700 mb-4">{inviteForm.introText}</p>
                        
                        {inviteForm.customMessage && (
                          <div className="bg-blue-50 p-4 rounded mb-4">
                            <p className="text-gray-700">{inviteForm.customMessage}</p>
                          </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded mb-6">
                          <h4 className="font-medium text-gray-900 mb-2">Assessment Details</h4>
                          <p className="text-sm text-gray-600">Test: {selectedAssessment?.title || 'Assessment'}</p>
                          <p className="text-sm text-gray-600">Duration: {selectedAssessment?.duration || 0} minutes</p>
                          <p className="text-sm text-gray-600">Questions: {selectedAssessment?.questions || 0}</p>
                        </div>

                        <div className="text-center">
                          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
                            Start Assessment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {inviteStep === 'settings' && (
                  <div className="space-y-8">
                    {/* General Settings */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">General Settings</h4>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Test name</label>
                          <input
                            type="text"
                            value={inviteSettings.testName}
                            onChange={(e) => setInviteSettings({...inviteSettings, testName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Languages</label>
                          <div className="space-y-2">
                            {Object.entries(inviteSettings.languages).map(([lang, checked]) => (
                              <label key={lang} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => setInviteSettings({
                                    ...inviteSettings,
                                    languages: { ...inviteSettings.languages, [lang]: e.target.checked }
                                  })}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700 capitalize">{lang}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Invitation expiry (days)</label>
                          <input
                            type="number"
                            value={inviteSettings.invitationExpiry}
                            onChange={(e) => setInviteSettings({...inviteSettings, invitationExpiry: parseInt(e.target.value)})}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Timer Options</label>
                          <div className="grid grid-cols-2 gap-4">
                            <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer ${
                                inviteSettings.timerType === 'per-question' 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setInviteSettings({...inviteSettings, timerType: 'per-question'})}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">Timer per Question</h5>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Recommended</span>
                              </div>
                              <p className="text-sm text-gray-600">Each question has its own time limit</p>
                            </div>
                            
                            <div 
                              className={`p-4 border-2 rounded-lg cursor-pointer ${
                                inviteSettings.timerType === 'global' 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setInviteSettings({...inviteSettings, timerType: 'global'})}
                            >
                              <h5 className="font-medium text-gray-900 mb-2">Global Timer</h5>
                              <p className="text-sm text-gray-600">One timer for the entire test</p>
                              {inviteSettings.timerType === 'global' && (
                                <label className="flex items-center mt-3">
                                  <input
                                    type="checkbox"
                                    checked={inviteSettings.noTimeLimit}
                                    onChange={(e) => setInviteSettings({...inviteSettings, noTimeLimit: e.target.checked})}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">No time limit</span>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Test Integrity */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Test Integrity</h4>
                      <div className="space-y-4">
                        {Object.entries(inviteSettings.testIntegrity).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </h5>
                              <p className="text-xs text-gray-500">
                                {key === 'unusualActivity' && 'Get notified of suspicious behavior'}
                                {key === 'copyPasteBlocking' && 'Prevent copy/paste in the test'}
                                {key === 'followUpQuestions' && 'Ask additional questions based on answers'}
                                {key === 'webcamProctoring' && 'Record candidate during the test'}
                                {key === 'fullScreenMode' && 'Force full-screen mode during test'}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <button
                                onClick={() => setInviteSettings({
                                  ...inviteSettings,
                                  testIntegrity: { ...inviteSettings.testIntegrity, [key]: !value }
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  value ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    value ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              {(key === 'followUpQuestions' || key === 'webcamProctoring') && (
                                <button className="ml-3 text-xs text-blue-600 hover:text-blue-800">
                                  Find out more
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Communication & Branding */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Communication & Branding</h4>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Version</label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="branding"
                                checked={!inviteSettings.customBranding}
                                onChange={() => setInviteSettings({...inviteSettings, customBranding: false})}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Default</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="branding"
                                checked={inviteSettings.customBranding}
                                onChange={() => setInviteSettings({...inviteSettings, customBranding: true})}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Custom</span>
                            </label>
                          </div>
                        </div>

                        {inviteSettings.customBranding && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">Logo</label>
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                  <img 
                                    src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png"
                                    alt="Emineon Logo"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-2">4MB max • 500x500px • JPG, PNG, GIF</p>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm">Upload</Button>
                                    <Button variant="outline" size="sm">Delete</Button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Introduction title</label>
                              <input
                                type="text"
                                value={inviteForm.introTitle}
                                onChange={(e) => setInviteForm({...inviteForm, introTitle: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Introduction text</label>
                              <textarea
                                value={inviteForm.introText}
                                onChange={(e) => setInviteForm({...inviteForm, introText: e.target.value})}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">End page title</label>
                              <input
                                type="text"
                                value={inviteForm.endTitle}
                                onChange={(e) => setInviteForm({...inviteForm, endTitle: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">End page text</label>
                              <textarea
                                value={inviteForm.endText}
                                onChange={(e) => setInviteForm({...inviteForm, endText: e.target.value})}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteStep('form');
                  }}
                >
                  Cancel
                </Button>
                <div className="flex space-x-3">
                  {inviteStep === 'preview' && (
                    <Button 
                      variant="outline"
                      onClick={() => setInviteStep('form')}
                    >
                      Back to Form
                    </Button>
                  )}
                  {inviteStep === 'settings' && (
                    <Button 
                      variant="outline"
                      onClick={() => setInviteStep('form')}
                    >
                      Back to Form
                    </Button>
                  )}
                  {inviteStep === 'form' && (
                    <>
                      <Button 
                        variant="outline"
                        onClick={() => setInviteStep('settings')}
                      >
                        Settings
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setInviteStep('preview')}
                        disabled={!inviteForm.email}
                      >
                        Preview
                      </Button>
                    </>
                  )}
                  <Button 
                    onClick={handleInviteCandidate}
                    className="btn-primary"
                    disabled={!inviteForm.email}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  return (
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <AnimatedPageTitle title="Assessments" Icon={FileTextIcon} />
            <p className="text-neutral-600 mt-1">Create and manage technical assessments for candidates</p>
          </div>
          <button
            type="button"
            onClick={() => setShowHeaderMetrics(v => !v)}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800"
            aria-expanded={showHeaderMetrics}
          >
            {showHeaderMetrics ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
            <span>{showHeaderMetrics ? 'Hide header overview' : 'Show header overview'}</span>
          </button>
        </div>

        {/* Header Metrics (collapsed by default) */}
        {showHeaderMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">Total Tests</p><p className="text-2xl font-bold text-neutral-900">{assessments.length}</p></div><FileText className="h-8 w-8 text-blue-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">Active</p><p className="text-2xl font-bold text-neutral-900">{assessments.filter(a=>a.status==='active').length}</p></div><TrendingUp className="h-8 w-8 text-green-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">Completed</p><p className="text-2xl font-bold text-neutral-900">{assessments.filter(a=>a.status==='completed').length}</p></div><CheckCircle className="h-8 w-8 text-emerald-600" /></div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-neutral-600">Avg Candidates/Test</p><p className="text-2xl font-bold text-neutral-900">{assessments.length ? Math.round(assessments.reduce((s,a)=>s+(a.candidates||0),0)/assessments.length) : 0}</p></div><Users className="h-8 w-8 text-purple-600" /></div></CardContent></Card>
          </div>
        )}

        {/* Search and Filters - Clients-like row */}
        <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
          <div className="relative flex-1 w-full min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by test name, domain, or candidate"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
                <Grid className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button 
              variant="outline"
              className="border-primary-500 text-primary-600 hover:bg-primary-50"
              onClick={() => {/* optional export */}}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Assessment</span>
            </button>
          </div>
        </div>

        {/* Tests Display - Grid or List View */}
        {viewMode === 'list' ? (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-0">
                      Tests
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Candidates
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Domains
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Last activity
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Timeline
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-4 min-w-0">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-8 w-8 mt-1">
                            <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                              <Code className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4 min-w-0 flex-1">
                            <button
                              onClick={() => {
                                router.push(`/assessments/${assessment.id}`);
                              }}
                              className="text-sm font-semibold text-gray-900 hover:text-blue-600 text-left block truncate max-w-xs"
                              title={assessment.title}
                            >
                              <span className="line-clamp-2 leading-tight">
                                {assessment.title}
                              </span>
                            </button>
                            <div className="text-sm text-gray-500 truncate max-w-xs" title={assessment.description}>
                              {assessment.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assessment.candidates}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1 max-w-32">
                          {assessment.tags?.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {assessment.tags && assessment.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{assessment.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(assessment.createdAt)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assessment.duration} min
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssessment(assessment);
                            setInviteSettings(prev => ({ ...prev, testName: assessment.title }));
                            setShowInviteModal(true);
                            setInviteStep('form');
                          }}
                        >
                          Invite
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssessments.map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow cursor-pointer h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Code className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setCurrentView('details');
                          }}
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600 text-left block w-full"
                          title={assessment.title}
                        >
                          <span className="line-clamp-2 leading-tight">
                            {assessment.title}
                          </span>
                        </button>
                        <p className="text-xs text-gray-500 mt-1 capitalize">{assessment.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {assessment.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {assessment.tags?.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate max-w-20"
                        title={tag}
                      >
                        {tag}
                      </span>
                    ))}
                    {assessment.tags && assessment.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{assessment.tags.length - 2}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 text-xs">Duration</p>
                      <p className="font-medium text-sm">{assessment.duration} min</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Questions</p>
                      <p className="font-medium text-sm">{assessment.questions}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Candidates</p>
                      <p className="font-medium text-sm">{assessment.candidates}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Avg Score</p>
                      <p className="font-medium text-sm">{assessment.averageScore}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-1 min-w-0 flex-1">
                      {getStatusBadge(assessment.status)}
                      {assessment.aiGenerated && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Brain className="h-3 w-3 mr-1" />
                          AI
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-3 py-1 h-7 flex-shrink-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAssessment(assessment);
                        setInviteSettings(prev => ({ ...prev, testName: assessment.title }));
                        setShowInviteModal(true);
                        setInviteStep('form');
                      }}
                    >
                      Invite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Drawer */}
      {showCandidateDrawer && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
          <div className="bg-white w-full max-w-2xl h-full overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCandidate.name}</h3>
                  <p className="text-sm text-gray-600">{selectedCandidate.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCandidateDrawer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setCandidateDrawerTab('report')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    candidateDrawerTab === 'report'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Report
                </button>
                <button
                  onClick={() => setCandidateDrawerTab('candidate')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    candidateDrawerTab === 'candidate'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Candidate
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto h-full">
              {candidateDrawerTab === 'report' && (
                <div className="space-y-6">
                  {selectedCandidate.status === 'completed' ? (
                    <>
                      {/* Score Summary */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">Better than</h4>
                          <div className="flex items-center space-x-2">
                            <Award className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm font-medium text-gray-600">Rank</span>
                          </div>
                        </div>
                        <div className="flex items-end space-x-4">
                          <div className="text-4xl font-bold text-yellow-600">{selectedCandidate.percentage}%</div>
                          <div className="text-lg text-gray-600 mb-1">of professionals</div>
                          <div className="ml-auto text-right">
                            <div className="text-2xl font-bold text-gray-900">{selectedCandidate.rank}/4</div>
                            <div className="text-sm text-gray-500">Rank</div>
                          </div>
                        </div>
                      </div>

                      {/* Test Details */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Clock className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="text-sm text-gray-500">Duration</div>
                          <div className="font-semibold text-gray-900">{selectedCandidate.duration}</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <CheckCircle className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="text-sm text-gray-500">Points</div>
                          <div className="font-semibold text-gray-900">
                            {selectedCandidate.points} / {selectedCandidate.maxPoints} ({selectedCandidate.percentage}%)
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <TrendingUp className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="text-sm text-gray-500">Score</div>
                          <div className="font-semibold text-gray-900">{selectedCandidate.score}%</div>
                        </div>
                      </div>

                      {/* Skills Breakdown */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Skills Assessment</h4>
                        <div className="space-y-4">
                          {selectedCandidate.skills?.map((skill, index) => (
                            <div key={index}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                                <span className="text-sm text-gray-500">
                                  Better than {skill.percentage}% of professionals
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${skill.percentage}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{skill.score} / {skill.maxScore}pts</span>
                                <span>{skill.percentage}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Update Status */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Update status</h4>
                        <div className="flex space-x-3">
                          <button className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium hover:bg-yellow-200 transition-colors">
                            <Users className="h-4 w-4 inline mr-2" />
                            To review
                          </button>
                          <button className="flex-1 px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium hover:bg-red-200 transition-colors">
                            <X className="h-4 w-4 inline mr-2" />
                            Rejected
                          </button>
                          <button className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium hover:bg-green-200 transition-colors">
                            <CheckCircle className="h-4 w-4 inline mr-2" />
                            Passed
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-3">
                        <button className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">
                          Actions
                          <ChevronDown className="h-4 w-4 inline ml-2" />
                        </button>
                        <button className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors">
                          View detailed report
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Non-completed status */}
                      <div className="text-center py-12">
                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          {selectedCandidate.status === 'expired' ? (
                            <AlertCircle className="h-8 w-8 text-red-500" />
                          ) : selectedCandidate.status === 'invited' ? (
                            <Mail className="h-8 w-8 text-blue-500" />
                          ) : (
                            <Clock className="h-8 w-8 text-yellow-500" />
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {selectedCandidate.status === 'expired' && 'Test Expired'}
                          {selectedCandidate.status === 'invited' && 'Invitation Sent'}
                          {selectedCandidate.status === 'started' && 'Test In Progress'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {selectedCandidate.status === 'expired' && 'This candidate\'s test invitation has expired.'}
                          {selectedCandidate.status === 'invited' && 'Waiting for the candidate to start the test.'}
                          {selectedCandidate.status === 'started' && 'The candidate is currently taking the test.'}
                        </p>
                        
                        {selectedCandidate.status === 'expired' && (
                          <button className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors">
                            Invite again
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {candidateDrawerTab === 'candidate' && (
                <div className="space-y-6">
                  {/* History */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <h4 className="text-lg font-semibold text-gray-900">History</h4>
                    </div>
                    <div className="space-y-4">
                      {selectedCandidate.history?.map((event, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                              {event.action.includes('completed') && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {event.action.includes('started') && <Play className="h-4 w-4 text-blue-600" />}
                              {event.action.includes('opened') && <Eye className="h-4 w-4 text-blue-600" />}
                              {event.action.includes('sent') && <Send className="h-4 w-4 text-gray-600" />}
                              {event.action.includes('expired') && <AlertCircle className="h-4 w-4 text-red-600" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{event.action}</p>
                              <p className="text-sm text-gray-500">{formatDate(event.timestamp)}</p>
                            </div>
                            {event.location && (
                              <p className="text-sm text-gray-500">{event.location}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Update Status */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Update status</h4>
                    <div className="flex space-x-3">
                      <button className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium hover:bg-yellow-200 transition-colors">
                        <Users className="h-4 w-4 inline mr-2" />
                        To review
                      </button>
                      <button className="flex-1 px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium hover:bg-red-200 transition-colors">
                        <X className="h-4 w-4 inline mr-2" />
                        Rejected
                      </button>
                      <button className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium hover:bg-green-200 transition-colors">
                        <CheckCircle className="h-4 w-4 inline mr-2" />
                        Passed
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">
                      Actions
                      <ChevronDown className="h-4 w-4 inline ml-2" />
                    </button>
                    {selectedCandidate.status === 'completed' && (
                      <button className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors">
                        View detailed report
                      </button>
                    )}
                    {selectedCandidate.status === 'expired' && (
                      <button className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors">
                        Invite again
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary-900">Create a new test</h2>
                  <p className="text-primary-700">
                    {createStep === 'describe' && 'Describe the role: paste, drag & drop, or dictate'}
                    {createStep === 'analyze' && 'AI suggestions: types, skills, duration, difficulty'}
                    {createStep === 'editor' && 'Preview and edit questions; generate with AI'}
                    {createStep === 'summary' && 'Review and create your assessment'}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-gray-600 space-x-2">
                    <span className={`px-2 py-0.5 rounded ${createStep==='describe'?'bg-primary-100 text-primary-800':'bg-gray-100'}`}>1. Describe</span>
                    <span>→</span>
                    <span className={`px-2 py-0.5 rounded ${createStep==='analyze'?'bg-primary-100 text-primary-800':'bg-gray-100'}`}>2. Analyze</span>
                    <span>→</span>
                    <span className={`px-2 py-0.5 rounded ${createStep==='editor'?'bg-primary-100 text-primary-800':'bg-gray-100'}`}>3. Editor</span>
                    <span>→</span>
                    <span className={`px-2 py-0.5 rounded ${createStep==='summary'?'bg-primary-100 text-primary-800':'bg-gray-100'}`}>4. Summary</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleCloseCreateModal();
                    setCurrentView('list');
                  }}
                  className="px-3 py-2 text-sm text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
                  title="Back to assessments"
                >
                  Back to assessments
                </button>
                <button
                  onClick={handleCloseCreateModal}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {createStep === 'describe' && (
                <div className="space-y-6">
                  <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 flex items-start">
                    <div className="mr-3 mt-1">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">✨</span>
                    </div>
                  <div>
                      <h3 className="font-semibold text-gray-900">Hi David!</h3>
                      <p className="text-gray-700">I'll help you create a new assessment quickly and easily. You can:</p>
                      <ul className="mt-2 text-sm text-gray-700 space-y-1">
                        <li className="flex items-center"><span className="mr-2">T</span> Type or paste the role description</li>
                        <li className="flex items-center">Drag & drop files (PDF, DOCX, TXT)</li>
                        <li className="flex items-center"><Mic className="h-4 w-4 mr-2" /> Use voice dictation</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Assessment for (e.g., Senior Frontend Engineer)"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <select
                        value={selectedExperience}
                        onChange={(e) => setSelectedExperience(e.target.value as any)}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="junior">Junior</option>
                        <option value="senior">Senior</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>

                    <div className="relative">
                      <textarea
                        placeholder="Paste your description here, or start typing to describe the role…"
                        value={describeText}
                        onChange={(e) => setDescribeText(e.target.value)}
                        className="w-full h-40 border border-dashed border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="absolute right-3 bottom-3 flex items-center gap-2 text-gray-500">
                        {/* Attachment removed as requested */}
                        {!isDictating ? (
                          <button onClick={startDictation} className="p-2 hover:text-gray-700" title="Dictate"><Mic className="h-5 w-5" /></button>
                        ) : (
                          <button onClick={stopDictation} className="p-2 text-red-600" title="Stop">Stop</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {createStep === 'analyze' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">2. AI analysis & selections</h3>
                    {analyzeLoading && (
                      <div className="border rounded-xl p-6 bg-primary-50 flex items-start">
                        <div className="mr-3 mt-1"><Loader2 className="h-5 w-5 animate-spin text-primary-600" /></div>
                        <div>
                          <div className="font-medium text-gray-900">Analyzing your input…</div>
                          <div className="text-sm text-gray-700">This will take just a moment while we extract the key information.</div>
                        </div>
                      </div>
                    )}
                    {analyzeError && <div className="mb-4 text-sm text-red-600">{analyzeError}</div>}

                    {/* Test title */}
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-1">Test title</div>
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder="e.g., Senior Front-end Assessment"
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Duration (minutes)</div>
                        <input type="number" min={10} max={180} value={analyzeDuration} onChange={(e) => setAnalyzeDuration(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Difficulty</div>
                        <select value={analyzeDifficulty} onChange={(e) => setAnalyzeDifficulty(e.target.value as any)} className="w-full border rounded px-3 py-2">
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    {/* Organized categories */}
                    {Object.keys(categoryMap).length > 0 && (
                      <div className="mt-6 space-y-4">
                        {Object.entries(categoryMap).map(([cat, items]) => (
                          <div key={cat} className="border rounded-lg p-3">
                            <div className="font-semibold text-sm mb-2">{cat}</div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {items.map((s) => (
                                <span key={s} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border">
                                  {s}
                                  <button className="ml-1 text-gray-500" title="Use in skills" onClick={() => setSelectedSkills((prev) => prev.includes(s) ? prev : [...prev, s])}>+</button>
                                  <button className="ml-1 text-gray-400" title="Remove" onClick={() => handleRemoveCategoryTag(cat, s)}>×</button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={categoryNewTag[cat] || ''}
                                onChange={(e) => setCategoryNewTag((p) => ({ ...p, [cat]: e.target.value }))}
                                placeholder={`Add a ${cat.toLowerCase()} tag`}
                                className="flex-1 border rounded px-3 py-2 text-sm"
                              />
                              <button className="px-3 py-2 border rounded text-sm" onClick={() => handleAddCategoryTag(cat)}>Add</button>
                            </div>
                          </div>
                        ))}
                            </div>
                          )}
                  </div>
                </div>
              )}

              {false && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Pick a template (optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assessmentTemplates.map((tpl) => (
                        <label
                          key={tpl.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedTemplateId === tpl.id
                              ? 'border-primary-400 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">{tpl.name}</div>
                              <div className="text-sm text-gray-600 mb-2">{tpl.description}</div>
                              <div className="flex flex-wrap gap-2">
                                {tpl.tags.map((tg) => (
                                  <span key={tg} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                    {tg}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="tpl"
                              checked={selectedTemplateId === tpl.id}
                              onChange={() => setSelectedTemplateId(tpl.id)}
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {false && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">2. What is the required experience?</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'junior', label: 'Junior', description: '1-3 years' },
                        { value: 'senior', label: 'Senior', description: '3-5 years' },
                        { value: 'expert', label: 'Expert', description: '5+ years' }
                      ].map((level) => (
                        <label
                          key={level.value}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedExperience === level.value
                              ? 'border-primary-400 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="experience"
                            value={level.value}
                            checked={selectedExperience === level.value}
                            onChange={(e) => setSelectedExperience(e.target.value as 'junior' | 'senior' | 'expert')}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                            selectedExperience === level.value
                              ? 'border-primary-400 bg-primary-400'
                              : 'border-gray-300'
                          }`}>
                            {selectedExperience === level.value && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{level.label}</div>
                            <div className="text-sm text-gray-500">{level.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {false && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      3. Which skills do you want to test? ({selectedSkills.length} selected)
                    </h3>
                    
                    {/* Selected Skills */}
                    {selectedSkills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 border border-primary-200"
                            >
                              {skill}
                              <button
                                onClick={() => removeSkill(skill)}
                                className="ml-2 text-primary-600 hover:text-primary-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search for a language, framework, or technical skill"
                        value={skillSearchQuery}
                        onChange={(e) => setSkillSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Available Skills */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                      {filteredSkills.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => addSkill(skill)}
                          className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {createStep === 'editor' && (
                <div className="space-y-6">
                  {generatingLoading && (
                    <div className="border rounded-xl p-6 bg-primary-50 flex items-start">
                      <div className="mr-3 mt-1"><Loader2 className="h-5 w-5 animate-spin text-primary-600" /></div>
                      <div>
                        <div className="font-medium text-gray-900">Generating your assessment…</div>
                        <div className="text-sm text-gray-700">This will take just a moment while we create questions from your selections.</div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">3. Editor - preview and modify questions</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditorFullscreen((v) => !v)}>{editorFullscreen ? 'Exit full screen' : 'Full screen'}</Button>
                      <Button variant="outline" onClick={handleGenerateAI}><Brain className="h-4 w-4 mr-2" />AI Generate</Button>
                      <Button variant="outline" onClick={() => setGeneratedQuestions([])}>Clear</Button>
                    </div>
                  </div>
                  <div className={`border rounded-lg p-4 bg-gray-50 ${editorFullscreen ? 'fixed inset-4 z-[60] bg-white overflow-y-auto' : 'max-h-[50vh] overflow-y-auto'}`}>
                    {editorFullscreen && (
                      <div className="flex justify-end mb-2">
                        <Button variant="outline" size="sm" onClick={() => setEditorFullscreen(false)}>Close</Button>
                      </div>
                    )}
                    {generatedQuestions.length === 0 && (
                      <div className="text-sm text-gray-500">No questions yet. Use AI Generate or add manually.</div>
                    )}
                    <div className="space-y-3">
                      {generatedQuestions.map((q, idx) => (
                        <div key={q.id || idx} className="bg-white border rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">{q.type?.toUpperCase()} • weight {q.weight || 1} • {q.difficulty || 'intermediate'}</div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={async () => {
                                const res = await fetch('/api/assessments/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q.question, type: q.type, context: selectedRole }) });
                                const js = await res.json();
                                setGeneratedQuestions(prev => prev.map((x, i) => i === idx ? { ...x, _answer: js?.answer || 'N/A' } : x));
                              }}>View answer</Button>
                              <Button variant="outline" size="sm" onClick={() => setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx))}>Delete</Button>
                            </div>
                          </div>
                          <Textarea value={q.question} onChange={(e) => setGeneratedQuestions(prev => prev.map((x, i) => i === idx ? { ...x, question: e.target.value } : x))} />
                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {q.options.map((opt: string, oi: number) => (
                                <Input key={oi} value={opt} onChange={(e) => setGeneratedQuestions(prev => prev.map((x, i) => i === idx ? { ...x, options: x.options.map((oo: string, ooi: number) => ooi === oi ? e.target.value : oo) } : x))} />
                              ))}
                              <Button variant="outline" size="sm" onClick={() => setGeneratedQuestions(prev => prev.map((x, i) => i === idx ? { ...x, options: [...(x.options || []), ''] } : x))}>Add option</Button>
                            </div>
                          )}
                          {q._answer && <div className="mt-2 text-sm text-gray-700"><span className="font-medium">Answer:</span> {q._answer}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {createStep === 'summary' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-primary-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Review your assessment</h3>
                      <p className="text-gray-600">Proceed to generate questions or customize blocks.</p>
                    </div>

                    {/* Test Details */}
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 mb-2">Test name:</h4>
                        <p className="text-gray-700 mb-4">
                          {selectedRole} - {selectedExperience.charAt(0).toUpperCase() + selectedExperience.slice(1)}
                          <button className="ml-2 text-primary-600 hover:text-primary-700">
                            <Edit className="h-4 w-4 inline" />
                          </button>
                        </p>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                              <Clock className="h-5 w-5 text-primary-500" />
                            </div>
                            <div className="text-sm text-gray-500">Duration</div>
                            <div className="font-semibold text-gray-900">
                              {selectedExperience === 'junior' ? '3-5 min' : selectedExperience === 'senior' ? '3-5 min' : '3-5 min'} 
                              ({selectedExperience === 'junior' ? '~7' : selectedExperience === 'senior' ? '~7' : '~7'} questions)
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                              <Globe className="h-5 w-5 text-primary-500" />
                            </div>
                            <div className="text-sm text-gray-500">Language</div>
                            <div className="font-semibold text-gray-900">English</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                              <Shield className="h-5 w-5 text-primary-500" />
                            </div>
                            <div className="text-sm text-gray-500">Anti-cheating</div>
                            <div className="font-semibold text-gray-900">Default options</div>
                          </div>
                        </div>

                        <button className="text-primary-600 hover:text-primary-700 font-medium">
                          Edit settings
                        </button>
                      </div>
                    </div>

                    {/* Test Structure */}
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 mb-4">Test structure:</h4>
                      <div className="bg-white border border-primary-200 rounded-lg p-4">
                        <div className="space-y-2">
                          {builderBlocks.length === 0 && (
                            <div className="text-sm text-gray-600">No blocks added yet. Go to Blocks and add sections.</div>
                          )}
                          {builderBlocks.map((b, i) => (
                            <div key={b.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                                <span className="font-medium text-gray-900">{i + 1}. {b.label}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                                {b.duration} min • weight {b.weight} • {b.difficulty}
                          </div>
                              <div className="text-sm text-gray-500 capitalize">{b.kind.replace('_', ' ')}</div>
                          </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-primary-50">
              <div className="flex items-center space-x-4">
                {createStep !== 'describe' && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (createStep === 'analyze') setCreateStep('describe');
                      else if (createStep === 'editor') setCreateStep('analyze');
                      else if (createStep === 'summary') setCreateStep('editor');
                    }}
                    className="border-primary-300 text-primary-700 hover:bg-primary-100"
                  >
                    Back
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {createStep === 'summary' && (
                  <Button variant="outline" className="border-primary-300 text-primary-700 hover:bg-primary-100">
                    Share test link
                  </Button>
                )}
                
                {createStep !== 'summary' ? (
                  <Button 
                    onClick={() => {
                      if (createStep === 'describe' && (selectedRole || describeText)) { if (!draftTitle) { const exp = selectedExperience ? selectedExperience.charAt(0).toUpperCase() + selectedExperience.slice(1) : ''; const suggested = selectedRole ? `${exp ? exp + ' ' : ''}${selectedRole} Assessment` : (describeText ? `${(describeText.split(/\n|\.|,/)[0] || '').trim().split(/\s+/).slice(0, 6).join(' ')} - Assessment` : 'New Assessment'); setDraftTitle(suggested); } setCreateStep('analyze'); runAnalyze(); }
                      else if (createStep === 'analyze') {
                        // Create draft assessment and seed questions per categories
                        const draftId = `draft_${Date.now()}`;
                        if (!selectedAssessment) {
                          setSelectedAssessment({
                            id: draftId,
                            title: draftTitle || selectedRole || 'Assessment',
                            description: Object.keys(categoryMap).join(', '),
                            type: 'technical',
                            duration: analyzeDuration,
                            questions: 0,
                            status: 'draft',
                            candidates: 0,
                            averageScore: 0,
                            createdAt: new Date().toISOString(),
                          } as any);
                        }
                        // Generate questions from tags via OpenAI and move to editor
                        (async () => {
                          const qs = await generateFromTags();
                          if (!qs.length) {
                            // Fallback minimal seed if AI returned nothing
                            const seed: any[] = Object.keys(categoryMap || {}).map((cat) => ({ id: `seed_${cat}`, type: 'text', question: `Category: ${cat}`, category: cat, weight: 1, difficulty: analyzeDifficulty }));
                            if (seed.length) setGeneratedQuestions(seed);
                          }
                        })();
                        setCurrentView('questions');
                      }
                      else if (createStep === 'editor') setCreateStep('summary');
                    }}
                    disabled={
                      (createStep === 'describe' && !selectedRole && !describeText)
                    }
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    {createStep === 'describe' && 'Next: analyze'}
                    {createStep === 'analyze' && 'Next: editor'}
                    {createStep === 'editor' && 'Next: summary'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      const token = Math.random().toString(36).slice(2);
                      const url = `${window.location.origin}/assessments/take?token=${token}&duration=${analyzeDuration}`;
                      navigator.clipboard.writeText(url).catch(() => {});
                      alert('Share link copied to clipboard');
                    }}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Copy share link
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}