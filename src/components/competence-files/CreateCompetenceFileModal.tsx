'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ChevronDown, Brain } from 'lucide-react';


// Import step components
import { CandidateSelectionStep } from './steps/CandidateSelectionStep';
import { TemplateSelectionStep } from './steps/TemplateSelectionStep';
import { JobDescriptionStep } from './steps/JobDescriptionStep';
import { EditorStep } from './steps/EditorStep';
import { useSegmentStore } from '@/stores/ai-generation-store';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';


// Types
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

interface CreateCompetenceFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (fileUrl: string) => void;
  preselectedCandidate?: CandidateData | null;
  existingFileData?: any; // For editing existing competence files
}

interface JobDescription {
  text: string;
  requirements: string[];
  skills: string[];
  responsibilities: string;
  title?: string;
  company?: string;
}

export function CreateCompetenceFileModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  preselectedCandidate,
  existingFileData
}: CreateCompetenceFileModalProps) {
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
  const [selectedTemplate, setSelectedTemplate] = useState<'professional' | 'professional-classic' | 'modern' | 'minimal' | 'emineon' | 'antaes'>('professional-classic');
  
  // Job Description state
  const [jobDescription, setJobDescription] = useState<JobDescription>({
    text: '',
    requirements: [],
    skills: [],
    responsibilities: '',
    title: '',
    company: ''
  });
  const [jobInputMethod, setJobInputMethod] = useState<'existing' | 'text' | 'file' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [jobDescriptionFiles, setJobDescriptionFiles] = useState<File[]>([]);
  const [isJobDescriptionExpanded, setIsJobDescriptionExpanded] = useState(false);
  
  // Manager contact details
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPhone, setManagerPhone] = useState('');

  // Additional state for editor
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | undefined>(undefined);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showReadyBadge, setShowReadyBadge] = useState(false);
  const [showMinimizeHint, setShowMinimizeHint] = useState(false);

  // Processing feedback states
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // File upload and parsing handlers
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsParsing(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      // FAST PATH: locally extract text first, then parse via JSON (avoids slow file upload to OpenAI)
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const extractRes = await fetch('/api/files/extract-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!extractRes.ok) {
        // Fallback: send the original file directly to the parser API (slower but robust)
        const primaryErrorText = await extractRes.text().catch(() => '');
        console.warn('⚠️ Text extraction failed, falling back to direct file parsing. Error:', primaryErrorText);

        const fd = new FormData();
        fd.append('file', files[0]);
        const fileParseRes = await fetch('/api/competence-files/parse-resume', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          // Do not set Content-Type when sending FormData; browser sets boundary
          body: fd,
        });

        if (!fileParseRes.ok) {
          const t = await fileParseRes.text().catch(() => '');
          throw new Error(t || `Direct file parse failed: ${fileParseRes.status}`);
        }

        const parsed = await fileParseRes.json();
        if (!parsed.success || !parsed.data) {
          throw new Error(parsed.message || 'Invalid response format from direct file parse');
        }

        const newCandidate = {
          ...parsed.data,
          yearsOfExperience: typeof parsed.data?.yearsOfExperience === 'number' && Number.isFinite(parsed.data.yearsOfExperience)
            ? parsed.data.yearsOfExperience
            : 0,
          summary: parsed.data?.summary ?? '',
        } as CandidateData;

        if (!newCandidate.fullName) {
          throw new Error('Could not extract candidate name from file. Please ensure the file contains clear candidate information.');
        }

        setSelectedCandidate(newCandidate);
        return; // Fallback path succeeded, stop here
      }

      const extracted = await extractRes.json();
      const combinedText = extracted.texts ? extracted.texts.join('\n\n') : extracted.text || '';
      if (!combinedText.trim()) throw new Error('No text could be extracted from the uploaded files');

      // Now pass text to parse-resume (fast JSON path)
      const response = await fetch('/api/competence-files/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: combinedText })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.message || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Invalid response format from server');
      }
      
      const newCandidate = {
        ...result.data,
        yearsOfExperience: typeof result.data?.yearsOfExperience === 'number' && Number.isFinite(result.data.yearsOfExperience)
          ? result.data.yearsOfExperience
          : 0,
        summary: result.data?.summary ?? '',
      } as CandidateData;
      
      if (!newCandidate.fullName) {
        throw new Error('Could not extract candidate name from file. Please ensure the file contains clear candidate information.');
      }
      
      setSelectedCandidate(newCandidate);
      
    } catch (error) {
      console.error('File parsing error:', error);
      alert(`Failed to parse CV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsParsing(false);
    }
  }, [getToken]);

  const handleTextParse = useCallback(async (text: string) => {
    setIsParsing(true);
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      const response = await fetch('/api/competence-files/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorMessage = 'Failed to parse text';
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
        throw new Error('Could not extract candidate name from text');
      }
      
      setSelectedCandidate(newCandidate);
      
    } catch (error) {
      console.error('Text parsing error:', error);
      alert(`Failed to parse text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsParsing(false);
    }
  }, [getToken]);

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

  // Job description handlers
  const handleJobFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    console.log('📁 Job description files selected:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
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
        const errorText = await response.text().catch(() => '');
        console.warn('⚠️ Text extraction failed for job description. Falling back to direct file parsing via OpenAI.', errorText);

        // Fallback: send first file directly to OpenAI job-description parser
        const fd = new FormData();
        fd.append('file', files[0]);
        const fileParseRes = await fetch('/api/ai/job-description/parse', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fd,
        });
        if (!fileParseRes.ok) {
          const t = await fileParseRes.text().catch(() => '');
          throw new Error(t || `Direct job file parse failed: ${fileParseRes.status}`);
        }

        const parsed = await fileParseRes.json();
        console.log('✅ Job description parsed via OpenAI file path');
        const composedText = [
          parsed.title && parsed.company ? `${parsed.title} at ${parsed.company}` : (parsed.title || parsed.company || ''),
          Array.isArray(parsed.responsibilities) ? parsed.responsibilities.join('\n') : (parsed.responsibilities || '')
        ].filter(Boolean).join('\n\n');
        setJobDescription({
          text: composedText,
          requirements: parsed.requirements || [],
          skills: parsed.skills || [],
          responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities.join('\n') : (parsed.responsibilities || ''),
          title: parsed.title || '',
          company: parsed.company || ''
        });
        return;
      }
    } catch (error) {
      console.error('💥 Error processing job description files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to process job description files: ${errorMessage}\n\nPlease check the console for more details and try again.`);
    } finally {
      setIsParsing(false);
    }
  };

  const parseJobDescription = async (text: string) => {
    try {
      console.log('🤖 Parsing job description with AI...', { textLength: text.length });
      
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available for job parsing');
      }
      
      const response = await fetch('/api/ai/job-description/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      
      console.log('🔍 Job parsing response status:', response.status);
      
      if (response.ok) {
        const parsed = await response.json();
        console.log('✅ Job description parsed successfully:', {
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
        console.warn('⚠️ Job parsing failed, using text only:', { status: response.status, error: errorData });
        
        // Fallback: just set the text
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
      console.error('❌ Error parsing job description:', error);
      
      // Fallback: just set the text
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

  // Document generation handlers
  const handleSave = async () => {
    setIsAutoSaving(true);
    try {
      // Save a draft competence file server-side
      const token = await getToken();
      const payload: any = {
        candidateId: selectedCandidate?.id,
        candidateData: selectedCandidate ? {
          ...selectedCandidate,
          fullName: selectedCandidate.fullName || [selectedCandidate?.fullName].filter(Boolean).join(' ').trim(),
        } : undefined,
        template: selectedTemplate,
        jobDescription,
        managerContact: { name: managerName, email: managerEmail, phone: managerPhone },
        language,
        segments,
      };

      const res = await fetch('/api/competence-files/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payload, saveOnly: true, format: 'pdf' }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(()=> '');
        throw new Error(errText || 'Failed to save competence file');
      }

      const json = await res.json().catch(()=> ({}));
      // Notify parent to refresh list and close the modal
      if (typeof onSuccess === 'function') onSuccess(json?.fileUrl || 'saved');
      if (typeof onClose === 'function') onClose();
    } catch (error) {
      console.error('Error saving draft:', error);
      alert(`Failed to save competence file. ${error instanceof Error ? error.message : ''}`);
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
      if (!selectedCandidate || !selectedTemplate) {
        throw new Error('Missing candidate or template selection');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      setProcessingStep('Preparing document content...');
      setProcessingProgress(15);
      console.log('🎯 Modal - handleGenerateDocument called with:', {
        format,
        finalEditorSegmentsProvided: !!finalEditorSegments,
        finalEditorSegmentsCount: finalEditorSegments?.length || 0,
        storeSegmentsCount: segments.length,
        finalEditorSegments: finalEditorSegments?.map((s: any) => ({
          id: s.id,
          title: s.title,
          type: s.type,
          visible: s.visible,
          contentLength: s.content?.length || 0,
          hasContent: !!s.content && s.content.trim().length > 0
        }))
      });

      // Use final editor content if provided, otherwise fall back to store segments
      let visibleSegments;
      
      if (finalEditorSegments) {
        console.log('🎯 Using final editor content for PDF generation:', {
          segmentsCount: finalEditorSegments.length,
          segments: finalEditorSegments.map((s: any) => ({
            title: s.title,
            type: s.type,
            visible: s.visible,
            contentLength: s.content?.length || 0,
            contentPreview: s.content?.substring(0, 100) || ''
          }))
        });
        
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
        console.log('⚠️ No final editor content provided, using store segments');
        // Fallback to store segments (original behavior)
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

      console.log('📋 Modal - Final visibleSegments being sent to API:', {
        count: visibleSegments.length,
        segments: visibleSegments.map(s => ({
          id: s.id,
          title: s.title,
          type: s.type,
          contentLength: s.content?.length || 0,
          hasContent: !!s.content && s.content.trim().length > 0,
          contentPreview: s.content?.substring(0, 150) || ''
        }))
      });

      setProcessingStep('Applying professional formatting...');
      setProcessingProgress(40);

      let response;
      
      if (format === 'pdf') {
        // Use the new structured-generate endpoint with p-queue throttling
        console.log('🎯 Using structured-generate endpoint with p-queue optimization...');
        console.log('📄 Final segments being sent to structured PDF API:', {
          count: visibleSegments.length,
          segments: visibleSegments.map(s => ({
            title: s.title,
            type: s.type,
            contentLength: s.content?.length || 0,
            contentPreview: s.content?.substring(0, 150) || ''
          }))
        });
        
        setProcessingStep('Processing with AI optimization...');
        setProcessingProgress(70);
        
        response = await fetch('/api/competence-files/structured-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            candidateData: selectedCandidate,
            jobDescription: jobDescription.text ? {
              text: jobDescription.text,
              requirements: jobDescription.requirements || [],
              skills: jobDescription.skills || [],
              responsibilities: jobDescription.responsibilities || [],
              title: jobDescription.title,
              company: jobDescription.company,
            } : undefined,
            clientName: jobDescription.company || managerName || 'Client',
            finalEditorSegments: visibleSegments, // 🚀 CRITICAL FIX: Send final editor content
            options: {
              template: selectedTemplate === 'professional-classic' ? 'professional' : 
                       selectedTemplate === 'antaes' ? 'antaes' : 
                       selectedTemplate === 'emineon' ? 'emineon' : 'professional',
              format: 'pdf',
              logoUrl: undefined, // Can be added later
            },
          }),
        });
      } else {
        // Use the existing generate endpoint for other formats
        console.log('📄 Using generate endpoint for document generation...');
        
        setProcessingStep('Generating document...');
        setProcessingProgress(50);
        
        // Convert segments to sections format expected by the API
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
            candidateData: selectedCandidate,
            template: selectedTemplate,
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
        const fileName = result.fileName || result.data?.fileName || `${selectedCandidate.fullName}_${selectedTemplate}_Competence_File.pdf`;
        
        console.log(`✅ ${format.toUpperCase()} document generated successfully!`);
        console.log(`📎 File URL: ${fileUrl}`);
        
        // Show queue metrics if available
        if (result.metrics?.queueMetrics) {
          console.log('📊 Queue Metrics:', result.metrics.queueMetrics);
        }
        
        // Auto-download the PDF file using the download proxy
        if (format === 'pdf') {
          try {
            const downloadUrl = `/api/competence-files/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(fileName)}`;
            
          const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
            console.log(`📥 Auto-downloading via proxy: ${fileName}`);
          } catch (downloadError) {
            console.error('Auto-download failed:', downloadError);
            console.log('📎 PDF generated successfully, you can download it manually from the competence files list');
          }
        }
        
        // Show success message
        alert(`Document generated successfully!\n\nYour ${format.toUpperCase()} file has been ${format === 'pdf' ? 'downloaded' : 'created'}.`);
        
        // Call success callback to refresh the competence files list
        onSuccess(fileUrl);
      } else {
        throw new Error(result.message || result.error || 'Document generation failed');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      alert(`Failed to generate document.\n\nPlease try again or contact support if the issue persists.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Update segments when candidate changes or when moving to step 4
  useEffect(() => {
    if (selectedCandidate && currentStep === 4 && segments.length === 0) {
      console.log('🚀 Starting AI content generation for all segments...');
      
      const jobData = jobDescription.text ? jobDescription : { text: '', requirements: [], skills: [], responsibilities: '' };
      
      loadFromAI(jobData, selectedCandidate).catch(error => {
        console.error('💥 Critical error during AI content generation:', error);
        alert(`❌ AI content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your internet connection and try again.`);
        // Go back to step 3 on failure
        setCurrentStep(3);
      });
    }
  }, [selectedCandidate, currentStep, segments.length, jobDescription, loadFromAI]);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return selectedCandidate !== null;
      case 2:
        // Job description is optional - can proceed without it
        return true;
      case 3:
        return selectedTemplate !== null;
      default:
        return false;
    }
  };

  // Add supported languages
  const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'nl', label: 'Nederlands' },
  ];

  // Add language state
  const [language, setLanguage] = useState('en');

  // Handler for language change in editor
  const handleEditorLanguageChange = (newLang: string) => {
    if (newLang !== language) {
      if (window.confirm('Changing the language will regenerate all content in the new language. Continue?')) {
        setLanguage(newLang);
        // Optionally, reset segments or trigger regeneration here if needed
        // For now, EditorStep will handle regeneration on prop change
      }
    }
  };

  // Load existing file data when editing
  useEffect(() => {
    if (existingFileData && isOpen) {
      console.log('📝 Loading existing competence file for editing:', existingFileData);
      
      // Set candidate data from file
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
      
      // Set template from metadata
      if (existingFileData.metadata?.template) {
        setSelectedTemplate(existingFileData.metadata.template);
      }
      
      // Set job description from metadata
      if (existingFileData.metadata?.jobDescription) {
        setJobDescription(existingFileData.metadata.jobDescription);
      }
      
      // Set manager contact from metadata
      if (existingFileData.metadata?.managerContact) {
        const contact = existingFileData.metadata.managerContact;
        setManagerName(contact.name || '');
        setManagerEmail(contact.email || '');
        setManagerPhone(contact.phone || '');
      }
      
      // Load the segments from existing file data
      loadFromExisting(existingFileData);
      setEditingFileId(existingFileData.id);
      
      // Skip to editor step for editing
      setCurrentStep(4);
      
      console.log('✅ Existing competence file loaded for editing');
    }
  }, [existingFileData, isOpen]);

  // Ready when no async processing is running (post-extraction or post-generation)
  const isReady = !isParsing && !isGenerating;

  useEffect(() => {
    if (isReady) {
      setShowReadyBadge(true);
      const t = setTimeout(() => setShowReadyBadge(false), 2500);
      return () => clearTimeout(t);
    }
  }, [isReady]);

  useEffect(() => {
    if (isParsing || isGenerating) {
      setShowMinimizeHint(true);
      const t = setTimeout(() => setShowMinimizeHint(false), 2200);
      // persist pill state globally so it survives route changes
      try {
        localStorage.setItem('cfPill', JSON.stringify({
          active: true,
          status: isParsing ? 'extracting' : 'generating',
          progress: isGenerating ? processingProgress : 0,
        }));
      } catch {}
      return () => clearTimeout(t);
    }
    // when idle/ready, update pill state to ready (kept visible until clicked)
    try {
      localStorage.setItem('cfPill', JSON.stringify({ active: true, status: 'ready' }));
    } catch {}
  }, [isParsing, isGenerating]);

  if (!isOpen) return null;

  // Determine modal size based on step
  const isEditorStep = currentStep === 4;
  const modalClass = isEditorStep
    ? 'fixed inset-0 bg-white w-full h-full m-0 rounded-none flex flex-col z-50' // Full page for editor
    : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  const innerClass = isEditorStep
    ? 'w-full h-full flex flex-col' // Full page for editor
    : 'bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] m-4 flex flex-col overflow-hidden';

  // Bottom-right pill when minimized
  const Pill = (
    <button
      onClick={() => setIsMinimized(false)}
      className={`fixed bottom-4 right-4 z-[60] px-4 py-2 rounded-full shadow-emineon flex items-center space-x-2 transition-colors ${isReady ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#0A2F5A] hover:bg-[#083248] text-white'}`}
      title={isReady ? 'Ready - open editor' : 'Working - view progress'}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isReady ? 'bg-white/20' : 'bg-white/10'}`}>
        <Brain className={`h-4 w-4 ${isReady ? 'text-white' : 'text-white animate-pulse'}`} />
      </div>
      <span className="text-sm font-medium">
        {isParsing ? 'Extracting…' : isGenerating ? `Generating ${processingProgress}%` : 'Ready'}
      </span>
      {showReadyBadge && <span className="ml-2 text-[10px] px-2 py-0.5 bg-white/20 rounded-full">Ready</span>}
    </button>
  );

  if (isMinimized) {
    return <>{Pill}</>;
  }

  return (
    <div
      className={modalClass}
      onClick={() => {
        if (isParsing) setIsMinimized(true);
      }}
    >
      <div className={innerClass} onClick={(e) => e.stopPropagation()}>
        {/* Header: Always show stepper and exit button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold">Create Competence File</h2>
            <div className="flex items-center space-x-4 mt-2">
              {[1, 2, 3, 4].map((step) => (
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
                    {step === 1 && 'Candidate'}
                    {step === 2 && 'Job Description'}
                    {step === 3 && 'Template'}
                    {step === 4 && 'Editor'}
                  </span>
                  {step < 4 && <span className="text-gray-300">→</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Language selector (always visible) */}
            {currentStep < 4 && (
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
              onClick={() => setIsMinimized(true)}
              onMouseEnter={() => setShowMinimizeHint(false)}
              className={`relative p-2 rounded transition-all ${
                (showMinimizeHint || isParsing)
                  ? 'ring-2 ring-primary-300 shadow-[0_0_24px_rgba(37,99,235,0.55)] bg-white animate-[pulse_1.6s_ease-in-out_infinite]'
                  : 'hover:bg-gray-100'
              }`}
              title="Minimize"
              aria-label="Minimize"
            >
              <ChevronDown className="h-5 w-5" />
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
          {isParsing ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#0A2F5A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-8 w-8 text-[#0A2F5A] animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Extracting candidate information...</h3>
                <p className="text-gray-600">Analyzing input and structuring the profile</p>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Candidate Selection */}
              {currentStep === 1 && (
                <CandidateSelectionStep
                  selectedCandidate={selectedCandidate}
                  onCandidateSelected={setSelectedCandidate}
                  isParsing={isParsing}
                  onFileUpload={handleFileUpload}
                  onTextParse={handleTextParse}
                  onUrlParse={handleUrlParse}
                />
              )}

              {/* Step 2: Job Description & Manager Details */}
              {currentStep === 2 && (
                <JobDescriptionStep
                  jobDescription={jobDescription}
                  onJobDescriptionUpdate={setJobDescription}
                  jobInputMethod={jobInputMethod}
                  onJobInputMethodChange={setJobInputMethod}
                  isRecording={isRecording}
                  onStartRecording={startVoiceRecording}
                  onStopRecording={stopVoiceRecording}
                  isParsing={isParsing}
                  jobDescriptionFiles={jobDescriptionFiles}
                  onJobFileSelect={handleJobFileSelect}
                  isJobDescriptionExpanded={isJobDescriptionExpanded}
                  onToggleJobDescriptionExpanded={() => setIsJobDescriptionExpanded(!isJobDescriptionExpanded)}
                  managerName={managerName}
                  onManagerNameChange={setManagerName}
                  managerEmail={managerEmail}
                  onManagerEmailChange={setManagerEmail}
                  managerPhone={managerPhone}
                  onManagerPhoneChange={setManagerPhone}
                />
              )}

              {/* Step 3: Template Selection */}
              {currentStep === 3 && selectedCandidate && (
                <TemplateSelectionStep
                  selectedCandidate={selectedCandidate}
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={setSelectedTemplate}
                  jobDescription={jobDescription}
                />
              )}

              {/* Step 4: AI-Enhanced Editor */}
              {currentStep === 4 && selectedCandidate && (
                <ErrorBoundary>
                  <EditorStep
                    selectedCandidate={selectedCandidate}
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
                    competenceFileId={editingFileId}
                  />
                </ErrorBoundary>
              )}
            </>
          )}
        </div>

        {/* Footer with navigation buttons */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between p-6 border-t bg-neutral-100 flex-shrink-0 rounded-b-2xl">
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
              {currentStep === 2 ? 'Select Template' : currentStep === 3 ? 'Continue to Editor' : 'Next'}
            </Button>
          </div>
        )}

        {/* Processing Feedback Overlay */}
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
      {isMinimized && Pill}
    </div>
  );
} 