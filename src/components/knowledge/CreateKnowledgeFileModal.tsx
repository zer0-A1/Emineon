'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Reuse the same steps from competence files for now (full copy behavior)
import { KnowledgeSelectionStep } from '@/components/knowledge/KnowledgeSelectionStep';
import { TemplateSelectionStep } from '@/components/competence-files/steps/TemplateSelectionStep';
import { JobDescriptionStep } from '@/components/competence-files/steps/JobDescriptionStep';
import { EditorStep } from '@/components/competence-files/steps/EditorStep';

import { useSegmentStore } from '@/stores/ai-generation-store';

interface CandidateData {
  id: string;
  fullName: string;
  currentTitle: string;
  email: string;
  phone: string;
  location: string;
  yearsOfExperience: number;
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
  summary: string;
}

interface CreateKnowledgeFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (fileUrl: string) => void;
  preselectedCandidate?: CandidateData | null;
  existingFileData?: any;
}

interface JobDescription {
  text: string;
  requirements: string[];
  skills: string[];
  responsibilities: string;
  title?: string;
  company?: string;
}

export function CreateKnowledgeFileModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedCandidate,
  existingFileData
}: CreateKnowledgeFileModalProps) {
  const { getToken } = useAuth();

  // Segment store
  const {
    segments,
    isLoading: segmentsLoading,
    loadFromAI,
    loadFromExisting,
    clearSegments
  } = useSegmentStore();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(preselectedCandidate || null);
  const [selectedTemplate, setSelectedTemplate] = useState<'rfp-annex' | 'proposal-appendix' | 'public-case' | 'internal-reference' | 'professional-classic' | 'emineon' | 'antaes'>('public-case');

  // Job Description state (reused for knowledge for now)
  const [jobDescription, setJobDescription] = useState<JobDescription>({
    text: '',
    requirements: [],
    skills: [],
    responsibilities: '',
    title: '',
    company: ''
  });
  const [jobInputMethod, setJobInputMethod] = useState<'text' | 'file' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [jobDescriptionFiles, setJobDescriptionFiles] = useState<File[]>([]);
  const [isJobDescriptionExpanded, setIsJobDescriptionExpanded] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  // Manager contact details
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPhone, setManagerPhone] = useState('');

  // Additional state for editor
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Processing feedback states
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // File upload and parsing handlers (copy of competence flow)
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsParsing(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      // Extract text from arbitrary knowledge files
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/files/extract-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Extraction failed: ${response.status}`);
      }

      const extracted = await response.json();
      const combinedText = extracted.texts ? extracted.texts.join('\n\n') : extracted.text || '';
      if (!combinedText.trim()) throw new Error('No text could be extracted from the uploaded files');

      // Feed text into the description for downstream generation
      setJobDescription((prev) => ({ ...prev, text: combinedText }));

    } catch (error) {
      console.error('Knowledge file parsing error:', error);
      alert(`Failed to process files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsParsing(false);
    }
  }, [getToken]);

  const handleTextParse = useCallback(async (text: string) => {
    // For knowledge, we directly use the raw text as input context
    setJobDescription((prev) => ({ ...prev, text }));
  }, []);

  const handleUrlParse = useCallback(async (url: string) => {
    setIsParsing(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch('/api/competence-files/parse-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ linkedinText: url }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to parse LinkedIn URL';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Invalid response format');
      }

      const newCandidate = {
        ...result.data,
        yearsOfExperience: typeof result.data?.yearsOfExperience === 'number' && Number.isFinite(result.data.yearsOfExperience)
          ? result.data.yearsOfExperience
          : 0,
        summary: result.data?.summary ?? '',
      } as CandidateData;

      if (!newCandidate.fullName) {
        throw new Error('Could not extract candidate name from LinkedIn profile');
      }

      setSelectedCandidate(newCandidate);

    } catch (error) {
      console.error('URL parsing error:', error);
      alert(`Failed to parse LinkedIn URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsParsing(false);
    }
  }, [getToken]);

  // Job description handlers (reused)
  const handleJobFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    console.log('📁 Knowledge files selected:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));

    setJobDescriptionFiles(files);
    setIsParsing(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      console.log('📤 Uploading files for text extraction...');
      const formData = new FormData();
      files.forEach(file => {
        console.log(`📎 Adding file to FormData: ${file.name} (${file.size} bytes)`);
        formData.append('files', file);
      });

      const response = await fetch('/api/files/extract-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📥 Text extraction response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📄 Text extraction result:', {
          hasTexts: !!result.texts,
          hasText: !!result.text,
          textsLength: result.texts?.length || 0,
          textLength: result.text?.length || 0,
          fileCount: result.fileCount || 0
        });

        const combinedText = result.texts ? result.texts.join('\n\n') : result.text || '';
        if (combinedText.trim()) {
          console.log('✅ Text extracted successfully, parsing with AI...');
          await parseJobDescription(combinedText);
        } else {
          throw new Error('No text could be extracted from the uploaded files');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Text extraction failed:', { status: response.status, error: errorData });
        throw new Error(errorData.error || `Failed to extract text from files (${response.status})`);
      }
    } catch (error) {
      console.error('💥 Error processing files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to process files: ${errorMessage}\n\nPlease check the console for more details and try again.`);
    } finally {
      setIsParsing(false);
    }
  };

  const parseJobDescription = async (text: string) => {
    try {
      console.log('🤖 Parsing description with AI...', { textLength: text.length });

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available for parsing');
      }

      const response = await fetch('/api/ai/job-description/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      console.log('🔍 Parsing response status:', response.status);

      if (response.ok) {
        const parsed = await response.json();
        console.log('✅ Description parsed successfully:', {
          title: parsed.title,
          company: parsed.company,
          requirementsCount: parsed.requirements?.length || 0,
          skillsCount: parsed.skills?.length || 0,
          hasResponsibilities: !!parsed.responsibilities
        });

        setJobDescription({
          text,
          requirements: parsed.requirements || [],
          skills: parsed.skills || [],
          responsibilities: parsed.responsibilities || '',
          title: parsed.title || '',
          company: parsed.company || ''
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('⚠️ Parsing failed, using text only:', { status: response.status, error: errorData });

        setJobDescription(prev => ({
          ...prev,
          text,
          requirements: [],
          skills: [],
          responsibilities: '',
          title: '',
          company: ''
        }));
      }
    } catch (error) {
      console.error('❌ Error parsing description:', error);
      setJobDescription(prev => ({
        ...prev,
        text,
        requirements: [],
        skills: [],
        responsibilities: '',
        title: '',
        company: ''
      }));
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        await transcribeAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
      alert('Failed to start voice recording. Please check microphone permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const { text } = await response.json();
        await parseJobDescription(text);
      } else {
        throw new Error('Failed to transcribe audio');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio. Please try again.');
    }
  };

  const handleSave = async () => {
    setIsAutoSaving(true);
    try {
      // Save as a knowledge document (content-only) via /api/knowledge
      const token = await getToken();
      const visible = segments
        .filter(s => s.visible)
        .sort((a, b) => a.order - b.order)
        .map(s => `## ${s.title}\n\n${s.content || ''}`)
        .join('\n\n');

      const payload = {
        kind: 'document',
        title: jobDescription.company ? `${jobDescription.company} – Reference` : 'Knowledge Reference',
        summary: 'Saved from editor',
        content: visible,
        tags: [],
        type: 'CASE_STUDY'
      };

      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const data = await res.json();
      // Exit modal and trigger refresh via onSuccess callback
      onSuccess(data?.data?.url || data?.data?.id || '');
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleGenerateDocument = async (format: 'pdf' | 'docx', finalEditorSegments?: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    visible: boolean;
    order: number;
    editable: boolean;
  }>) => {
    setIsGenerating(true);
    setProcessingStep('Initializing...');
    setProcessingProgress(0);

    try {
      if (!selectedTemplate) {
        throw new Error('Missing template selection');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      setProcessingStep('Preparing document content...');
      setProcessingProgress(15);

      let visibleSegments;

      if (finalEditorSegments) {
        visibleSegments = finalEditorSegments
          .filter(segment => segment.visible)
          .sort((a, b) => a.order - b.order)
          .map(segment => ({
            id: segment.id,
            type: segment.type,
            title: segment.title,
            content: segment.content,
            order: segment.order,
          }));
      } else {
        visibleSegments = segments
          .filter(segment => segment.visible)
          .sort((a, b) => a.order - b.order)
          .map(segment => ({
            id: segment.id,
            type: segment.type,
            title: segment.title,
            content: segment.content,
            order: segment.order,
          }));
      }

      setProcessingStep('Applying professional formatting...');
      setProcessingProgress(40);

      let response;

      if (format === 'pdf') {
        setProcessingStep('Processing with AI optimization...');
        setProcessingProgress(70);

        const candidateForPdf = selectedCandidate || {
          id: 'knowledge-reference',
          fullName: 'Knowledge Reference',
          currentTitle: 'Consulting Reference',
          email: '',
          phone: '',
          location: '',
          yearsOfExperience: 0,
          skills: [],
          certifications: [],
          experience: [],
          education: [],
          languages: [],
          summary: ''
        } as any;

        const mappedTemplate = (selectedTemplate === 'professional-classic') ? 'professional'
          : (selectedTemplate === 'emineon' || selectedTemplate === 'antaes') ? selectedTemplate
          : 'emineon';

        response = await fetch('/api/competence-files/structured-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            candidateData: candidateForPdf,
            jobDescription: jobDescription.text ? {
              text: jobDescription.text,
              requirements: jobDescription.requirements || [],
              skills: jobDescription.skills || [],
              responsibilities: jobDescription.responsibilities || [],
              title: jobDescription.title,
              company: jobDescription.company,
            } : undefined,
            clientName: jobDescription.company || managerName || 'Client',
            finalEditorSegments: visibleSegments,
            options: {
              template: mappedTemplate,
              format: 'pdf',
              logoUrl: undefined,
            },
          }),
        });
      } else {
        setProcessingStep('Generating document...');
        setProcessingProgress(50);

        const sections = visibleSegments.map(segment => ({
          id: segment.id,
          type: segment.type,
          title: segment.title,
          content: segment.content,
          visible: true,
          order: segment.order,
        }));

        response = await fetch('/api/competence-files/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            candidateData: (selectedCandidate || {
              id: 'knowledge-reference',
              fullName: 'Knowledge Reference',
              currentTitle: 'Consulting Reference',
              email: '',
              phone: '',
              location: '',
              yearsOfExperience: 0,
              skills: [],
              certifications: [],
              experience: [],
              education: [],
              languages: [],
              summary: ''
            }) as any,
            template: (selectedTemplate === 'professional-classic') ? 'professional' : (selectedTemplate === 'emineon' || selectedTemplate === 'antaes') ? selectedTemplate : 'emineon',
            sections,
            format,
            jobDescription: jobDescription.text ? jobDescription : undefined,
            managerContact: {
              name: managerName,
              email: managerEmail,
              phone: managerPhone,
            },
          }),
        });
      }

      setProcessingStep('Finalizing document...');
      setProcessingProgress(90);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Generation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      setProcessingStep('Complete');
      setProcessingProgress(100);

      if (result.success && (result.fileUrl || result.data?.fileUrl)) {
        const fileUrl = result.fileUrl || result.data?.fileUrl;

        alert(`Document generated successfully!`);
        onSuccess(fileUrl);
      } else {
        throw new Error(result.message || result.error || 'Document generation failed');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      alert(`Failed to generate document.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Language must be initialized before effects that depend on it
  const [language, setLanguage] = useState('en');

  // Client-side excerpt extractor to pre-optimize per section
  const extractKnowledgeExcerpt = useCallback((text: string, sectionType: string): string => {
    const src = (text || '').replace(/\r/g, '\n');
    if (!src) return '';
    const headings = [
      'CLIENT',
      'CONTEXT',
      'PROBLEM / OBJECTIVES',
      'PROBLEM',
      'OBJECTIVES',
      'SCOPE',
      'APPROACH & METHODS',
      'DELIVERABLES',
      'RESULTS',
      'RISKS & MITIGATIONS',
      'TEAM',
      'REFERENCE CONTACT',
      'CONFIDENTIALITY'
    ];
    const lines = src.split(/\n/);
    const isHeading = (line: string) => {
      const u = line.trim().toUpperCase();
      return headings.some(h => u === h || u.startsWith(h + ' ') || u.startsWith(h + ':') || u.startsWith(h + ' ('));
    };
    let current: string | null = null;
    const buckets: Record<string, string[]> = {};
    for (const h of headings) buckets[h] = [];
    for (const line of lines) {
      if (isHeading(line)) {
        const u = line.trim().toUpperCase();
        const match = headings.find(h => u === h || u.startsWith(h + ' ') || u.startsWith(h + ':') || u.startsWith(h + ' ('));
        current = match || null;
        continue;
      }
      if (current) buckets[current].push(line);
    }
    const toBlock = (arr: string[]) => arr.join('\n').trim();
    const slices: Record<string,string> = Object.fromEntries(headings.map(h => [h, toBlock(buckets[h])]));
    const key = sectionType.toUpperCase();
    switch (key){
      case 'K_HEADER': return [slices['CLIENT']||'', slices['REFERENCE CONTACT']||''].join('\n\n').trim();
      case 'K_CLIENT_CONTEXT': return slices['CONTEXT']||slices['CLIENT']||'';
      case 'K_PROBLEM_TRIGGER': return slices['PROBLEM / OBJECTIVES']||slices['PROBLEM']||'';
      case 'K_SCOPE_OBJECTIVES': return slices['SCOPE']||slices['PROBLEM / OBJECTIVES']||'';
      case 'K_APPROACH_METHODS': return slices['APPROACH & METHODS']||'';
      case 'K_DELIVERABLES': return slices['DELIVERABLES']||'';
      case 'K_RESULTS': return slices['RESULTS']||'';
      case 'K_RISKS_MITIGATIONS': return slices['RISKS & MITIGATIONS']||'';
      case 'K_TEAM_EFFORT': return slices['TEAM']||'';
      case 'K_TIMELINE_BUDGET': return slices['SCOPE']||'';
      case 'K_TESTIMONIAL': return slices['REFERENCE CONTACT']||'';
      case 'K_CONFIDENTIALITY_PERMISSIONS': return slices['CONFIDENTIALITY']||'';
      default: return '';
    }
  }, []);

  useEffect(() => {
    if (currentStep === 3) {
      // Template-specific segment layout
      const buildSeed = (): Array<{ id: string; title: string; type: string; order: number }> => {
        switch (selectedTemplate) {
          case 'public-case':
            return [
              { id: 'k-header', title: 'Header (ID Block)', type: 'K_HEADER', order: 0 },
              { id: 'k-client-context', title: 'Client Context', type: 'K_CLIENT_CONTEXT', order: 1 },
              { id: 'k-problem', title: 'Problem / Trigger', type: 'K_PROBLEM_TRIGGER', order: 2 },
              { id: 'k-approach', title: 'Approach & Methods', type: 'K_APPROACH_METHODS', order: 3 },
              { id: 'k-deliverables', title: 'Deliverables', type: 'K_DELIVERABLES', order: 4 },
              { id: 'k-results', title: 'Results (hard numbers first)', type: 'K_RESULTS', order: 5 },
              { id: 'k-testimonial', title: 'Client testimonial', type: 'K_TESTIMONIAL', order: 6 },
              { id: 'k-confidentiality', title: 'Confidentiality & Permissions', type: 'K_CONFIDENTIALITY_PERMISSIONS', order: 7 },
            ];
          case 'rfp-annex':
            return [
              { id: 'k-header', title: 'Header (ID Block)', type: 'K_HEADER', order: 0 },
              { id: 'k-client-context', title: 'Client Context', type: 'K_CLIENT_CONTEXT', order: 1 },
              { id: 'k-problem', title: 'Problem / Trigger', type: 'K_PROBLEM_TRIGGER', order: 2 },
              { id: 'k-scope', title: 'Scope & Objectives', type: 'K_SCOPE_OBJECTIVES', order: 3 },
              { id: 'k-approach', title: 'Approach & Methods', type: 'K_APPROACH_METHODS', order: 4 },
              { id: 'k-results', title: 'Results (hard numbers first)', type: 'K_RESULTS', order: 5 },
              { id: 'k-confidentiality', title: 'Confidentiality & Permissions', type: 'K_CONFIDENTIALITY_PERMISSIONS', order: 6 },
            ];
          case 'proposal-appendix':
            return [
              { id: 'k-header', title: 'Header (ID Block)', type: 'K_HEADER', order: 0 },
              { id: 'k-client-context', title: 'Client Context', type: 'K_CLIENT_CONTEXT', order: 1 },
              { id: 'k-problem', title: 'Problem / Trigger', type: 'K_PROBLEM_TRIGGER', order: 2 },
              { id: 'k-scope', title: 'Scope & Objectives', type: 'K_SCOPE_OBJECTIVES', order: 3 },
              { id: 'k-approach', title: 'Approach & Methods', type: 'K_APPROACH_METHODS', order: 4 },
              { id: 'k-deliverables', title: 'Deliverables', type: 'K_DELIVERABLES', order: 5 },
              { id: 'k-results', title: 'Results (hard numbers first)', type: 'K_RESULTS', order: 6 },
              { id: 'k-risks', title: 'Risks & Mitigations', type: 'K_RISKS_MITIGATIONS', order: 7 },
              { id: 'k-team', title: 'Team & Effort', type: 'K_TEAM_EFFORT', order: 8 },
              { id: 'k-confidentiality', title: 'Confidentiality & Permissions', type: 'K_CONFIDENTIALITY_PERMISSIONS', order: 9 },
            ];
          case 'internal-reference':
          default:
            return [
              { id: 'k-header', title: 'Header (ID Block)', type: 'K_HEADER', order: 0 },
              { id: 'k-client-context', title: 'Client Context', type: 'K_CLIENT_CONTEXT', order: 1 },
              { id: 'k-problem', title: 'Problem / Trigger', type: 'K_PROBLEM_TRIGGER', order: 2 },
              { id: 'k-scope', title: 'Scope & Objectives', type: 'K_SCOPE_OBJECTIVES', order: 3 },
              { id: 'k-approach', title: 'Approach & Methods', type: 'K_APPROACH_METHODS', order: 4 },
              { id: 'k-deliverables', title: 'Deliverables', type: 'K_DELIVERABLES', order: 5 },
              { id: 'k-results', title: 'Results (hard numbers first)', type: 'K_RESULTS', order: 6 },
              { id: 'k-risks', title: 'Risks & Mitigations', type: 'K_RISKS_MITIGATIONS', order: 7 },
              { id: 'k-team', title: 'Team & Effort', type: 'K_TEAM_EFFORT', order: 8 },
              { id: 'k-timeline', title: 'Timeline & Budget band', type: 'K_TIMELINE_BUDGET', order: 9 },
              { id: 'k-testimonial', title: 'Client testimonial', type: 'K_TESTIMONIAL', order: 10 },
              { id: 'k-confidentiality', title: 'Confidentiality & Permissions', type: 'K_CONFIDENTIALITY_PERMISSIONS', order: 11 },
            ];
        }
      };

      const seed = buildSeed().map(s => ({ ...s, content: '', status: 'idle' as const, editable: true, visible: true }));
      // Reset any previous CV-oriented segments before seeding knowledge ones
      try { (useSegmentStore.getState().clearSegments as any)(); } catch {}
      (useSegmentStore.getState().setSegments as any)(seed);

      (async () => {
        for (const section of seed) {
          try {
            // Pre-optimize using section excerpt to seed editor with refined, factual content
            const excerpt = extractKnowledgeExcerpt(jobDescription.text, section.type);
            const res = await fetch('/api/openai-responses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                segmentType: section.type,
                knowledgeData: { text: jobDescription.text, metadata: { template: selectedTemplate }, language },
                enhancementAction: 'optimize',
                existingContent: excerpt || jobDescription.text || '',
                order: section.order,
              })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const content = data.content || '';
            const htmlCandidate = data.htmlContent as string | undefined;
            const hasHtmlTags = !!(htmlCandidate && /<\/?[a-z][\s\S]*>/i.test(htmlCandidate));
            useSegmentStore.getState().updateSegment(section.id, { 
              content,
              htmlContent: hasHtmlTags ? htmlCandidate : undefined,
              status: 'done' 
            });
          } catch (e) {
            console.error('Knowledge section generation failed:', section.type, e);
            useSegmentStore.getState().updateSegment(section.id, { status: 'error' });
          }
        }
      })();
    }
  }, [currentStep, segments.length, jobDescription.text, language, selectedTemplate]);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return true; // source provided is optional; can pick template next
      case 2:
        return selectedTemplate !== null;
      default:
        return false;
    }
  };

  const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'nl', label: 'Nederlands' },
  ];

  const handleEditorLanguageChange = (newLang: string) => {
    if (newLang !== language) {
      if (window.confirm('Changing the language will regenerate all content in the new language. Continue?')) {
        setLanguage(newLang);
      }
    }
  };

  useEffect(() => {
    if (existingFileData && isOpen) {
      if (existingFileData.candidate) {
        const candidateData: CandidateData = {
          id: existingFileData.candidate.id,
          fullName: `${existingFileData.candidate.firstName} ${existingFileData.candidate.lastName}`,
          currentTitle: existingFileData.candidate.currentTitle || '',
          email: existingFileData.candidate.email || '',
          phone: existingFileData.candidate.phone || '',
          location: existingFileData.candidate.currentLocation || '',
          yearsOfExperience: existingFileData.candidate.experienceYears || 0,
          skills: [
            ...(existingFileData.candidate.technicalSkills || []),
            ...(existingFileData.candidate.softSkills || [])
          ],
          certifications: existingFileData.candidate.certifications || [],
          experience: (existingFileData.candidate.workExperiences || []).map((exp: any) => ({
            company: exp.company || '',
            title: exp.jobTitle || '',
            startDate: exp.startDate ? new Date(exp.startDate).toISOString().slice(0, 7) : '',
            endDate: exp.endDate ? new Date(exp.endDate).toISOString().slice(0, 7) : '',
            responsibilities: exp.responsibilities || ''
          })),
          education: existingFileData.candidate.degrees || [],
          languages: existingFileData.candidate.spokenLanguages || [],
          summary: existingFileData.candidate.summary || ''
        };

        setSelectedCandidate(candidateData);
      }

      if (existingFileData.metadata?.template) {
        setSelectedTemplate(existingFileData.metadata.template);
      }

      if (existingFileData.metadata?.jobDescription) {
        setJobDescription(existingFileData.metadata.jobDescription);
      }

      if (existingFileData.metadata?.managerContact) {
        const contact = existingFileData.metadata.managerContact;
        setManagerName(contact.name || '');
        setManagerEmail(contact.email || '');
        setManagerPhone(contact.phone || '');
      }

      loadFromExisting(existingFileData);
      setCurrentStep(4);
    }
  }, [existingFileData, isOpen, loadFromExisting]);

  if (!isOpen) return null;

  const isEditorStep = currentStep === 3;
  const modalClass = isEditorStep
    ? 'fixed inset-0 bg-white w-full h-full m-0 rounded-none flex flex-col z-50'
    : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  const innerClass = isEditorStep
    ? 'w-full h-full flex flex-col'
    : 'bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] m-4 flex flex-col';

  return (
    <div className={modalClass}>
      <div className={innerClass}>
        {/* Header: Always show stepper and exit button */}
        <div className={`flex items-center justify-between p-6 border-b flex-shrink-0 transition-all duration-300 ${headerCollapsed ? 'h-10 min-h-10 py-1' : ''}`} style={{ minHeight: headerCollapsed ? 40 : undefined, height: headerCollapsed ? 40 : undefined, overflow: 'hidden' }}>
          <div className={`${headerCollapsed ? 'truncate' : ''}`} style={{ maxWidth: headerCollapsed ? '80vw' : undefined }}>
            {!headerCollapsed && (
              <>
                <h2 className="text-xl font-semibold">Create Knowledge Reference</h2>
                <div className="flex items-center space-x-4 mt-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep === step 
                          ? 'bg-primary-600 text-white' 
                          : currentStep > step 
                            ? 'bg-success-600 text-white' 
                            : 'bg-secondary-200 text-secondary-600'
                      }`}>
                        {step}
                      </div>
                      <span className={`text-sm ${
                        currentStep === step ? 'text-primary-600 font-medium' : 'text-secondary-600'
                      }`}>
                        {step === 1 && 'Inputs'}
                        {step === 2 && 'Template'}
                        {step === 3 && 'Editor'}
                      </span>
                      {step < 4 && <span className="text-gray-300">→</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
            {headerCollapsed && (
              <span className="text-base font-semibold text-gray-700">Create Knowledge File</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {currentStep < 3 && (
              <select
                className="border rounded px-2 py-1 text-sm mr-2"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                aria-label="Select language"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setHeaderCollapsed((v) => !v)}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              title={headerCollapsed ? 'Show header' : 'Collapse header'}
              aria-label={headerCollapsed ? 'Show header' : 'Collapse header'}
            >
              {headerCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100 transition-colors ml-2"
              title="Close"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentStep === 1 && (
            <KnowledgeSelectionStep
              isParsing={isParsing}
              onFileUpload={handleFileUpload}
              onTextParse={handleTextParse}
            />
          )}

          {/* Step 2 is Template (handled below). Removed Job Description step. */}

          {currentStep === 2 && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Knowledge Template</h3>
                      <p className="text-gray-600">Choose how the reference will be formatted</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { id: 'public-case', name: 'Public Case Study', desc: 'For website/public communications' },
                        { id: 'proposal-appendix', name: 'Proposal Appendix', desc: 'Attach to proposals' },
                        { id: 'rfp-annex', name: 'RFP Annex / Shortlist', desc: 'Compact scoring-friendly format' },
                        { id: 'internal-reference', name: 'Internal Reference', desc: 'Detailed internal version' },
                      ].map((tpl) => (
                        <div
                          key={tpl.id}
                          className={`p-5 border rounded-xl cursor-pointer transition-all ${selectedTemplate === (tpl.id as any) ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:bg-neutral-50 border-neutral-200'}`}
                          onClick={() => setSelectedTemplate(tpl.id as any)}
                        >
                          <div className="font-semibold text-neutral-900">{tpl.name}</div>
                          <div className="text-sm text-neutral-600 mt-1">{tpl.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <ErrorBoundary>
              <EditorStep
                selectedCandidate={(selectedCandidate || {
                  id: 'knowledge-reference',
                  fullName: 'Knowledge Reference',
                  currentTitle: 'Consulting Reference',
                  email: '',
                  phone: '',
                  location: '',
                  yearsOfExperience: 0,
                  skills: [],
                  certifications: [],
                  experience: [],
                  education: [],
                  languages: [],
                  summary: ''
                }) as any}
                selectedTemplate={selectedTemplate}
                jobDescription={jobDescription}
                managerContact={{ name: managerName, email: managerEmail, phone: managerPhone }}
                onBack={handleBack}
                onSave={handleSave}
                onGenerateDocument={handleGenerateDocument}
                isGenerating={isGenerating}
                isAutoSaving={isAutoSaving}
                language={language}
                onLanguageChange={handleEditorLanguageChange}
              />
            </ErrorBoundary>
          )}
        </div>

        {currentStep < 3 && (
          <div className="flex items-center justify-between p-6 border-t bg-neutral-100 flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
            >
              {currentStep === 1 ? 'Select Template' : currentStep === 2 ? 'Continue to Editor' : 'Next'}
            </Button>
          </div>
        )}

        {isGenerating && processingStep && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-emineon">
              <div className="text-center">
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-100 border-t-primary-600 mx-auto"></div>
                </div>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  Creating Document
                </h3>
                <p className="text-sm text-secondary-600 mb-6">
                  {processingStep}
                </p>
                <div className="w-full bg-secondary-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-secondary-500 font-medium">
                  {processingProgress}% Complete
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


