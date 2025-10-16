'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Sparkles, MessageCircle, Brain, Search, FileText, Users, Briefcase, Upload, File, X, AlertCircle, CheckCircle, Database, Zap, Target, TrendingUp, Plus, Mic, AudioLines } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Layout } from '@/components/layout/Layout';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: UploadedDocument[];
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  fileId?: string; // OpenAI file ID
  purpose?: string;
  status?: 'uploading' | 'completed' | 'error';
  uploadProgress?: number;
}



interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
  category: 'search' | 'analysis' | 'outreach' | 'reports';
}

const quickActions: QuickAction[] = [
  {
    id: 'find-candidates-by-jd',
    title: 'Match Candidates to Job',
    description: 'Upload a job description and find matching candidates',
    icon: <Target className="w-5 h-5" />,
    prompt: 'I have uploaded a job description. Please analyze it and find the best matching candidates from our database.',
    category: 'search'
  },
  {
    id: 'analyze-cv-database',
    title: 'CV Database Analysis',
    description: 'Analyze uploaded CV against our candidate database',
    icon: <Database className="w-5 h-5" />,
    prompt: 'I have uploaded a CV. Please analyze it and find similar candidates in our database, identify skill gaps, and suggest improvements.',
    category: 'analysis'
  },
  {
    id: 'company-wide-search',
    title: 'Company-wide Search',
    description: 'Search across all candidates, jobs, and company data',
    icon: <Search className="w-5 h-5" />,
    prompt: 'Help me search across our entire database for specific skills, experience, or criteria',
    category: 'search'
  },
  {
    id: 'talent-pipeline-analysis',
    title: 'Talent Pipeline Analysis',
    description: 'Analyze current talent pipeline and identify gaps',
    icon: <TrendingUp className="w-5 h-5" />,
    prompt: 'Analyze our current talent pipeline, identify skill gaps, and suggest sourcing strategies',
    category: 'analysis'
  },
  {
    id: 'competitive-analysis',
    title: 'Competitive Talent Analysis',
    description: 'Compare our talent pool against market standards',
    icon: <Brain className="w-5 h-5" />,
    prompt: 'Analyze our talent pool against current market trends and competitor insights',
    category: 'analysis'
  },
  {
    id: 'bulk-outreach',
    title: 'Bulk Outreach Generator',
    description: 'Generate personalized outreach for multiple candidates',
    icon: <MessageCircle className="w-5 h-5" />,
    prompt: 'Help me create personalized outreach messages for a group of candidates based on specific criteria',
    category: 'outreach'
  },
  {
    id: 'client-insights',
    title: 'Client Success Report',
    description: 'Generate insights and reports for client relationships',
    icon: <FileText className="w-5 h-5" />,
    prompt: 'Generate a comprehensive client success report with placement analytics and recommendations',
    category: 'reports'
  },
  {
    id: 'skill-demand-analysis',
    title: 'Skill Demand Analysis',
    description: 'Analyze market demand for specific skills',
    icon: <Zap className="w-5 h-5" />,
    prompt: 'Analyze the current market demand for specific technical skills and suggest candidate development strategies',
    category: 'analysis'
  }
];

export default function AICopilotPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hasStarted, setHasStarted] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const uploadsRef = useRef<UploadedDocument[]>([]);

  useEffect(() => {
    uploadsRef.current = uploadedDocuments;
  }, [uploadedDocuments]);

  // Global drag handlers to avoid flicker between children
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter((c) => c + 1);
      setIsDragOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter((c) => {
        const next = Math.max(0, c - 1);
        if (next === 0) setIsDragOver(false);
        return next;
      });
    };
    const onDropGlobal = (e: DragEvent) => {
      e.preventDefault();
      // If we arrived here due to a redirect from homepage drop, skip this native drop once
      try {
        const skip = sessionStorage.getItem('ai_skip_drop');
        if (skip === '1') {
          sessionStorage.removeItem('ai_skip_drop');
          return; // prevent duplicate attachment (sessionStorage handoff will handle it)
        }
      } catch {}
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) {
        // @ts-ignore
        onDrop(files as any);
      }
      setDragCounter(0);
      setIsDragOver(false);
    };

    window.addEventListener('dragover', onDragOver as any);
    window.addEventListener('dragenter', onDragEnter as any);
    window.addEventListener('dragleave', onDragLeave as any);
    window.addEventListener('drop', onDropGlobal as any);
    return () => {
      window.removeEventListener('dragover', onDragOver as any);
      window.removeEventListener('dragenter', onDragEnter as any);
      window.removeEventListener('dragleave', onDragLeave as any);
      window.removeEventListener('drop', onDropGlobal as any);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // We'll attach the homepage handoff in a ref and trigger it after onDrop is declared
  const homepageFilesRef = useRef<{ name: string; type: string; data: string }[] | null>(null);
  // removed: initial handoff effect handled later after onDrop is defined

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const onScroll = () => {
      try {
        const el = document.scrollingElement || document.documentElement;
        const atBottom = (window.innerHeight + window.scrollY) >= (el.scrollHeight - 200);
        setShowJumpToBottom(!atBottom);
      } catch {}
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const typeOutAssistantMessage = useCallback((fullText: string) => {
    const messageId = Date.now().toString() + 'ai-stream';
    const startMessage: Message = {
      id: messageId,
      type: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, startMessage]);
    let index = 0;
    const step = Math.max(1, Math.floor(fullText.length / 400));
    const interval = setInterval(() => {
      index = Math.min(fullText.length, index + step);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: fullText.slice(0, index) } : m));
      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 10);
  }, []);

  // Minimal safe Markdown (bold + paragraphs + line breaks)
  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const mdToHtml = (text: string) => {
    const escaped = escapeHtml(text);
    // bold **text**
    const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // line breaks and paragraphs
    const withBreaks = withBold.replace(/\n/g, '<br />');
    // optional simple paragraphs on double line breaks
    const html = withBreaks.replace(/(<br \/>\s*){2,}/g, '</p><p>');
    return `<p>${html}</p>`;
  };

  // Render attached uploads chip list in the input bar
  const renderUploadChips = () => {
    if (uploadedDocuments.length === 0) return null;
    return (
      <div className="absolute -top-14 left-0 right-0 pb-2">
        <div className="flex flex-wrap gap-2">
          {uploadedDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 shadow-sm">
              <div className={`h-6 w-6 rounded-md flex items-center justify-center ${doc.status === 'uploading' ? 'bg-primary-100' : 'bg-primary-200'}`}>
                {doc.status === 'uploading' ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-primary-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  <File className="h-3.5 w-3.5 text-primary-700" />
                )}
              </div>
              <div className="text-xs text-neutral-800 max-w-[220px] truncate" title={doc.name}>{doc.name}</div>
              <button onClick={()=> setUploadedDocuments(prev => prev.filter(d => d.id !== doc.id))} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Handle initial message from URL parameter
  const initialMessageSentRef = useRef(false);
  useEffect(() => {
    const initialMessage = searchParams.get('message');
    if (initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      setInputValue(initialMessage);
      setTimeout(() => {
        handleSendMessage(initialMessage);
        setInputValue('');
      }, 200);
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('message');
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  }, [searchParams]);

  // Load candidates data
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await api.candidates.list(token);
        if (response.success) {
          setCandidates(response.data);
        }
      } catch (error) {
        console.error('Error loading candidates:', error);
      }
    };
    loadCandidates();
  }, [getToken]);

  // Handoff from homepage: read files from sessionStorage and attach once
  useEffect(() => {
    (async () => {
      try {
        const raw = sessionStorage.getItem('ai_dropped_files');
        if (!raw) return;
        const items = JSON.parse(raw) as { name: string; type: string; data: string }[];
        sessionStorage.removeItem('ai_dropped_files');
        if (!Array.isArray(items) || items.length === 0) return;
        const toFile = async (item: { name: string; type: string; data: string }) => {
          const res = await fetch(item.data);
          const blob = await res.blob();
          // Ensure we create a real File with name and type preserved
          const file = new (globalThis as any).File([blob], item.name || 'document.pdf', {
            type: item.type || (blob && (blob as any).type) || 'application/pdf',
          });
          return file as File;
        };
        const files = await Promise.all(items.map(toFile));
        onDrop(files);
      } catch {}
    })();
  }, []);

  // After onDrop exists, process homepage files (call once after mount + onDrop defined)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      if (!homepageFilesRef.current || homepageFilesRef.current.length === 0) return;
      // Guard: if homepage signaled skip (native drop will also fire), clear and return once
      const skip = sessionStorage.getItem('ai_skip_drop');
      if (skip === '1') {
        sessionStorage.removeItem('ai_skip_drop');
      }
      const toFile = async (item: { name: string; type: string; data: string }) => {
        const res = await fetch(item.data);
        const blob = await res.blob();
        const file = new (globalThis as any).File([blob], item.name || 'document.pdf', {
          type: item.type || (blob && (blob as any).type) || 'application/pdf',
        });
        return file as File;
      };
      const reconstructed = await Promise.all(homepageFilesRef.current.map(toFile));
      homepageFilesRef.current = null;
      // call after next tick to ensure onDrop is in scope
      setTimeout(() => onDrop(reconstructed), 0);
    })();
    return () => { mounted = false; };
  }, []);

  let __deferredHomepageRun: (()=>void) | null = null;

  // Document upload functionality using Vercel Blob
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsAnalyzing(true);
    
    for (const file of acceptedFiles) {
      const newDoc: UploadedDocument = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'uploading',
        uploadProgress: 0,
      };

      setUploadedDocuments(prev => [...prev, newDoc]);

      try {
        // Upload to Vercel Blob and extract content
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const uploadResult = await response.json();
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        // Update document with results
        const updatedDoc: UploadedDocument = {
          ...newDoc,
          status: 'completed',
          fileId: uploadResult.data.fileId,
          purpose: uploadResult.data.purpose
        };

        setUploadedDocuments(prev => 
          prev.map(doc => doc.id === newDoc.id ? updatedDoc : doc)
        );
        
        // No verbose system message in chat; show a subtle toast-like hint above the input for 2s
        try {
          const hintId = `upload-hint-${Date.now()}`;
          const hint = document.createElement('div');
          hint.id = hintId;
          hint.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-white/95 border border-neutral-200 shadow-md rounded-full px-3 py-1 text-xs text-neutral-700';
          hint.textContent = 'Document attached';
          document.body.appendChild(hint);
          setTimeout(()=>{
            const el = document.getElementById(hintId);
            if (el && el.parentNode) el.parentNode.removeChild(el);
          }, 2000);
        } catch {}
      } catch (error) {
        console.error('Error processing file:', error);
        
        // Update document status to error
        setUploadedDocuments(prev => 
          prev.map(doc => doc.id === newDoc.id ? { ...doc, status: 'error' } : doc)
        );
        
        const errorMessage: Message = {
          id: Date.now().toString() + 'err',
          type: 'system',
          content: `❌ **Error processing ${file.name}:** Upload failed. Please try again.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
    
    setIsAnalyzing(false);
  }, []);

  // Wait until all uploads finish or timeout. Returns true if finished, false on timeout.
  const waitForUploads = useCallback(async (timeoutMs: number = 20000): Promise<boolean> => {
    const start = Date.now();
    return new Promise<boolean>((resolve) => {
      const check = () => {
        const hasUploading = uploadsRef.current.some(d => d.status === 'uploading');
        if (!hasUploading) return resolve(true);
        if (Date.now() - start > timeoutMs) return resolve(false);
        setTimeout(check, 250);
      };
      check();
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeDocument = (docId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() && uploadedDocuments.length === 0) return;

    // Special: show canned roadmap questions as clickable pills
    if (content.trim().toLowerCase() === 'show roadmap faqs') {
      const faqs = [
        'Emineon summary',
        'Target market and expansion',
        'Customer segments / ICP',
        'Pricing and plans',
        'Market size numbers and penetration',
        'Roadmap overview (Year 1 / Year 2 / Year 3)',
        'Year 1 focus',
        'Year 2 focus',
        'Year 3 focus',
        'Team roadmap and hiring plan',
        'Business development strategy',
        'Financial plan overview',
        'Differentiation / moat / why now',
        'Onboarding and first value',
        'Retention and expansion',
        'Core metrics and governance'
      ];
      const id = Date.now().toString() + 'assistant-faqs';
      setMessages(prev => [...prev, { id, type: 'assistant', content: '[[FAQ_RENDER]]', timestamp: new Date() }]);
      setTimeout(() => {
        const container = document.getElementById(id);
        if (!container) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-wrap gap-2';
        faqs.forEach((q) => {
          const btn = document.createElement('button');
          btn.textContent = q;
          btn.className = 'px-3 py-1.5 text-sm rounded-full bg-primary-50 text-primary-800 border border-primary-200 hover:bg-primary-100 transition';
          btn.onclick = () => handleSendMessage(q);
          wrapper.appendChild(btn);
        });
        container.innerHTML = '';
        container.appendChild(wrapper);
      }, 0);
      return;
    }

    if (!hasStarted) setHasStarted(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      attachments: uploadedDocuments.filter(doc => doc.status === 'completed').length > 0 ? uploadedDocuments.filter(doc => doc.status === 'completed') : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      let response;
      const hadAnyUploads = uploadedDocuments.length > 0;
      // If there are uploads in progress, wait for them to complete (up to timeout)
      if (uploadedDocuments.some(d => d.status === 'uploading')) {
        await waitForUploads(20000);
      }
      
      // Easter egg: Emineon hero story when user asks about Emineon
      const lowerEarly = content.toLowerCase();
      if (lowerEarly.includes('emineon') && (lowerEarly.includes('who') || lowerEarly.includes('what') || lowerEarly.includes('about') || lowerEarly.includes('story') || lowerEarly.includes('mission') || lowerEarly.includes('vision'))) {
        const heroStory = `Emineon began with a simple question: what if recruitment felt personal again?\n\nIn a world of inbox overloads and neglected candidates, a tiny team set out to build an assistant that never forgets context, never loses momentum, and always moves the story forward.\n\nToday, Emineon is that teammate. It reads the room in real time—turning messy data into decisions, transforming job descriptions into shortlists, and helping teams communicate with clarity and care.\n\nBut the real hero isn’t the AI. It’s you. Emineon just lifts the busywork off your shoulders so you can do the unforgettable parts: building trust, championing people, and creating teams that change trajectories.\n\nThe mission is simple: respect time, elevate talent, and make every interaction feel human—at scale.`;
        typeOutAssistantMessage(heroStory);
        setIsLoading(false);
        return;
      }

      // Use the chat endpoint with document context if available
      const requestBody: any = {
        message: content.trim(),
        context: {
          candidateCount: candidates.length
        }
      };

      // If there are uploaded documents, include their file IDs
      const completedDocs = uploadedDocuments.filter(doc => doc.status === 'completed' && doc.fileId);
      if (completedDocs.length > 0) {
        requestBody.fileIds = completedDocs.map(doc => doc.fileId);
      }

      // Intent: if user asks for candidates with skill (e.g., "java developer"), route to tools.searchCandidates first
      const lower = content.toLowerCase();
      if (/\b(java|python|react|node|sql|aws|azure|golang|kotlin|scala|typescript|postgres|mongodb)\b/.test(lower) || /developer|engineer|candidate/.test(lower)) {
        const toolRes = await fetch('/api/copilot/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'searchCandidates', input: { q: content, limit: 10 } }),
        });
      // Intent: jobs search with optional status/location filters
      if (/\bjobs?\b/.test(lower) || /open roles|vacancies|positions/.test(lower)) {
        const statusMatch = lower.match(/\b(open|active|closed|draft|published)\b/);
        const locationMatch = lower.match(/in\s+([a-zA-Z\s-]{2,})$/);
        const qForJobs = content;
        const toolRes = await fetch('/api/copilot/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'searchJobs', input: { q: qForJobs, status: statusMatch?.[1]?.toUpperCase(), limit: 10 } }),
        });
        if (toolRes.ok) {
          const json = await toolRes.json();
          if (json.success && Array.isArray(json.result) && json.result.length > 0) {
            const list = json.result as any[];
            const summary = list.map((j: any, i: number) => `${i+1}. ${j.title} — ${j.location || 'Remote'} [${j.status}]`).join('\n');
            const assistantMessage: Message = {
              id: Date.now().toString() + 'ai',
              type: 'assistant',
              content: `Here are ${list.length} matching job(s):\n\n${summary}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
            return;
          }
        }
      }

      // Intent: close job
      const closeJobMatch = lower.match(/close job\s+([a-z0-9\-_]+)/);
      if (closeJobMatch && closeJobMatch[1]) {
        const toolRes = await fetch('/api/copilot/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'closeJob', input: { id: closeJobMatch[1] } }),
        });
        if (toolRes.ok) {
          const json = await toolRes.json();
          if (json.success) {
            const assistantMessage: Message = {
              id: Date.now().toString() + 'ai',
              type: 'assistant',
              content: `Job ${json.result.id} has been closed.`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
            return;
          }
        }
      }

      // Intent: close job by title
      const closeByTitleMatch = lower.match(/close job\s+(.+)/);
      if (closeByTitleMatch && !/close job\s+[a-z0-9\-_]+/.test(lower)) {
        const titleQuery = closeByTitleMatch[1].trim();
        const searchRes = await fetch('/api/copilot/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'searchJobs', input: { q: titleQuery, limit: 1 } }),
        });
        if (searchRes.ok) {
          const js = await searchRes.json();
          const job = js?.result?.[0];
          if (job?.id) {
            const toolRes = await fetch('/api/copilot/tools', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tool: 'closeJob', input: { id: job.id } }),
            });
            if (toolRes.ok) {
              const json = await toolRes.json();
              if (json.success) {
                const assistantMessage: Message = {
                  id: Date.now().toString() + 'ai',
                  type: 'assistant',
                  content: `Job "${job.title}" (${job.id}) has been closed.`,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                setIsLoading(false);
                return;
              }
            }
          }
        }
      }

      // Intent: assign candidate to job
      const assignMatch = lower.match(/assign candidate\s+([a-z0-9\-_]+)\s+to\s+job\s+([a-z0-9\-_]+)/);
      if (assignMatch && assignMatch[1] && assignMatch[2]) {
        const toolRes = await fetch('/api/copilot/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'assignCandidateToJob', input: { candidateId: assignMatch[1], jobId: assignMatch[2] } }),
        });
        if (toolRes.ok) {
          const json = await toolRes.json();
          if (json.success) {
            const assistantMessage: Message = {
              id: Date.now().toString() + 'ai',
              type: 'assistant',
              content: `Assigned candidate to job. Application ID: ${json.result.applicationId}.`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
            return;
          }
        }
      }

      // Intent: assign candidate by names to job by title
      const assignByNames = lower.match(/assign\s+(?:candidate\s+)?(.+?)\s+to\s+job\s+(.+)/);
      if (assignByNames && assignByNames[1] && assignByNames[2]) {
        const candidateQuery = assignByNames[1].trim();
        const jobQuery = assignByNames[2].trim();
        const candRes = await fetch('/api/copilot/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'searchCandidates', input: { q: candidateQuery, limit: 1 } }),
        });
        const jobRes = await fetch('/api/copilot/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'searchJobs', input: { q: jobQuery, limit: 1 } }),
        });
        if (candRes.ok && jobRes.ok) {
          const candJson = await candRes.json();
          const jobJson = await jobRes.json();
          const cand = candJson?.result?.[0];
          const job = jobJson?.result?.[0];
          if (cand?.id && job?.id) {
            const toolRes = await fetch('/api/copilot/tools', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tool: 'assignCandidateToJob', input: { candidateId: cand.id, jobId: job.id } }),
            });
            if (toolRes.ok) {
              const json = await toolRes.json();
              if (json.success) {
                const assistantMessage: Message = {
                  id: Date.now().toString() + 'ai',
                  type: 'assistant',
                  content: `Assigned ${cand.firstName ?? ''} ${cand.lastName ?? ''} (${cand.id}) to job "${job.title}" (${job.id}). Application ID: ${json.result.applicationId}.`,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                setIsLoading(false);
                return;
              }
            }
          }
        }
      }
        if (toolRes.ok) {
          const json = await toolRes.json();
          if (json.success && Array.isArray(json.result) && json.result.length > 0) {
            const list = json.result as any[];
            const summary = list.map((c: any, i: number) => `${i+1}. ${c.firstName} ${c.lastName} — ${c.currentTitle || ''}`).join('\n');
            const assistantMessage: Message = {
              id: Date.now().toString() + 'ai',
              type: 'assistant',
              content: `I found ${list.length} matching candidate(s):\n\n${summary}\n\nYou can ask for details like "get candidate ${list[0]?.id}" or refine the search.`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
            return;
          }
        }
      }

      response = await fetch('/api/ai-copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Try to surface a clearer error message from the server
        let serverMsg = 'Failed to get AI response';
        try {
          const errJson = await response.json();
          serverMsg = errJson?.error || errJson?.message || response.statusText || serverMsg;
        } catch {}
        throw new Error(serverMsg);
      }

      const data = await response.json();
      
      let responseContent = data.message || data.response;

      // If the response includes candidate data, format it nicely
      if (data.candidates && data.candidates.length > 0) {
        responseContent += '\n\n**📋 Matching Candidates:**\n\n';
        data.candidates.forEach((candidate: any, index: number) => {
          responseContent += `**${index + 1}. ${candidate.name}**\n`;
          responseContent += `• **Skills:** ${candidate.skills?.join(', ') || 'Not specified'}\n`;
          responseContent += `• **Experience:** ${candidate.experience || 'Not specified'}\n`;
          responseContent += `• **Location:** ${candidate.location || 'Not specified'}\n`;
          if (candidate.email) {
            responseContent += `• **Contact:** ${candidate.email}\n`;
          }
          responseContent += '\n';
        });
      }

      // Stream out the assistant message content for a natural typing feel
      typeOutAssistantMessage(responseContent);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + 'error',
        type: 'system',
        content: `❌ ${error instanceof Error ? error.message : 'Sorry, I encountered an error processing your request. Please try again.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const filteredActions = activeCategory === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.category === activeCategory);

  // Hero rotating type/delete heading

  return (
    <Layout fullWidth>
      <div className="min-h-[100vh] px-4 sm:px-6 lg:px-8">
        {isDragOver && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none select-none">
            <div className="text-center px-6 py-8 bg-white/90 rounded-2xl shadow-xl border border-neutral-200 pointer-events-auto">
              <div className="text-lg font-semibold text-neutral-900 mb-2">Add anything</div>
              <div className="text-sm text-neutral-600">Drop any file here to add it to the conversation.</div>
            </div>
          </div>
        )}
        {!hasStarted && messages.length === 0 ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center text-center select-none">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-white ring-4 ring-primary-200 shadow-[0_0_40px_rgba(37,99,235,0.35)] flex items-center justify-center animate-pulse">
                <Image 
                  src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png" 
                  alt="Emineon Logo" 
                  width={56} 
                  height={56} 
                />
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-normal text-neutral-700 mb-6">What's on the agenda today?</h1>
            <div className="w-full max-w-3xl">
              <div className="relative flex items-center gap-2 bg-white border border-neutral-300 rounded-full px-3 py-2 shadow-sm">
                {renderUploadChips()}
                <button
                  className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50"
                  onClick={() => (document.getElementById('ai-file-picker-idle') as HTMLInputElement)?.click()}
                  title="Attach documents"
                >
                  <Plus className="w-5 h-5 text-neutral-700" />
                </button>
                <input id="ai-file-picker-idle" type="file" multiple hidden accept=".pdf,.doc,.docx,.txt" onChange={(e)=>{ const files = Array.from(e.target.files || []); if(files.length){ onDrop(files as any);} (e.target as HTMLInputElement).value=''; }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleSendMessage(inputValue); } }}
                  placeholder="Ask anything"
                  className="flex-1 px-3 py-3 outline-none text-neutral-900 placeholder-neutral-500 bg-transparent"
                />
                <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50" title="Voice">
                  <Mic className="w-5 h-5 text-neutral-700" />
                </button>
                <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50" title="Transcribe">
                  <AudioLines className="w-5 h-5 text-neutral-700" />
                </button>
              </div>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1">
          {/* Chat Interface only */}
          <div className="col-span-1">
            <div className="flex flex-col items-center">
              {/* Messages */}
              <div className="p-6 space-y-8 max-w-3xl w-full mx-auto pb-48">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {(message.type === 'assistant' || message.type === 'system') && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                        {message.type === 'system' ? (
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Image 
                            src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png" 
                            alt="Emineon Logo" 
                            width={16} 
                            height={16} 
                            className="w-4 h-4 object-contain opacity-70"
                          />
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] ${
                        message.type === 'user'
                          ? 'rounded-2xl px-4 py-3 bg-primary-600 text-white shadow-sm'
                          : 'px-0 py-0 bg-transparent text-neutral-900'
                      } ${message.type === 'system' ? 'text-amber-700' : ''}`}
                    >
                      <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                        {message.type === 'assistant' || message.type === 'system' ? (
                          message.content === '[[FAQ_RENDER]]' ? (
                            <div id={message.id}></div>
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: mdToHtml(message.content) }} />
                          )
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                      </div>
                      
                      {/* Show attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.attachments.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 bg-white/20 rounded px-2 py-1">
                              <File className="w-3 h-3" />
                              <span className="text-xs">{doc.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {message.type !== 'user' && (
                        <div className="text-[11px] mt-2 text-neutral-400">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    {/* No timestamp under user messages */}
                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white ring-2 ring-primary-300 shadow-[0_0_20px_rgba(37,99,235,0.35)] animate-pulse">
                      <Image 
                        src="https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png" 
                        alt="Emineon Logo" 
                        width={16} 
                        height={16} 
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    <div className="rounded-xl px-0 py-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="fixed bottom-0 left-0 right-0 z-30 bg-neutral-50/60 backdrop-blur supports-[backdrop-filter]:bg-neutral-50/50 px-4 sm:px-6 lg:px-8 py-4">
                <div className="max-w-3xl mx-auto" onDragOver={(e)=>{e.preventDefault();}} onDrop={(e)=>{e.preventDefault(); const files = Array.from(e.dataTransfer.files||[]); if(files.length){ /* rely on global drop to avoid double */ } }}>
                  <div
                    className="relative flex items-center gap-2 bg-white border border-neutral-300 rounded-full px-3 py-2 shadow-sm"
                    onDragOver={(e)=>{ e.preventDefault(); }}
                    onDrop={(e)=>{ e.preventDefault(); const files = Array.from(e.dataTransfer.files||[]); if(files.length){ /* rely on global drop to avoid double */ } }}
                  >
                    {renderUploadChips()}
                    <button
                      className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50"
                      title="Attach documents"
                      onClick={() => (document.getElementById('ai-file-picker') as HTMLInputElement)?.click()}
                      disabled={isLoading}
                    >
                      <Plus className="w-5 h-5 text-neutral-700" />
                    </button>
                    <input id="ai-file-picker" type="file" multiple hidden accept=".pdf,.doc,.docx,.txt" onChange={(e)=>{ const files = Array.from(e.target.files || []); if(files.length){ onDrop(files as any);} (e.target as HTMLInputElement).value=''; }} />
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask anything"
                      className="flex-1 px-3 py-3 outline-none text-neutral-900 placeholder-neutral-500 bg-transparent"
                      disabled={isLoading}
                      onDragOver={(e)=>{ e.preventDefault(); }}
                      onDrop={(e)=>{ e.preventDefault(); const files = Array.from(e.dataTransfer.files||[]); if(files.length){ /* rely on global drop to avoid double */ } }}
                    />
                    <button
                      onClick={() => handleSendMessage(inputValue)}
                      disabled={(!inputValue.trim() && uploadedDocuments.length === 0) || isLoading}
                      className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-50 disabled:text-neutral-400"
                      title="Send"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-neutral-500 mt-2 flex items-center justify-start">
                    <span>Press Enter to send • Shift+Enter for new line</span>
                  </div>
                </div>
              </div>

              {showJumpToBottom && (
                <button
                  onClick={scrollToBottom}
                  className="fixed bottom-24 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 h-10 w-10 rounded-full bg-white shadow-md border border-neutral-200 flex items-center justify-center"
                  title="Jump to latest"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-neutral-600"><path fillRule="evenodd" d="M11.47 8.47a.75.75 0 011.06 0l7 7a.75.75 0 11-1.06 1.06L12 9.56l-6.47 6.97a.75.75 0 11-1.06-1.06l7-7z" clipRule="evenodd" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </Layout>
  );
} 