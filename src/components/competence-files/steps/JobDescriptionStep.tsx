'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { 
  FileText,
  Mic,
  MicOff,
  Upload,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// Types
interface JobDescription {
  text: string;
  requirements: string[];
  skills: string[];
  responsibilities: string;
  title?: string;
  company?: string;
}

interface JobDescriptionStepProps {
  jobDescription: JobDescription;
  onJobDescriptionUpdate: (jobDescription: JobDescription) => void;
  jobInputMethod: 'existing' | 'text' | 'file' | 'voice';
  onJobInputMethodChange: (method: 'existing' | 'text' | 'file' | 'voice') => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isParsing: boolean;
  jobDescriptionFiles: File[];
  onJobFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isJobDescriptionExpanded: boolean;
  onToggleJobDescriptionExpanded: () => void;
  managerName: string;
  onManagerNameChange: (name: string) => void;
  managerEmail: string;
  onManagerEmailChange: (email: string) => void;
  managerPhone: string;
  onManagerPhoneChange: (phone: string) => void;
}

export function JobDescriptionStep({
  jobDescription,
  onJobDescriptionUpdate,
  jobInputMethod,
  onJobInputMethodChange,
  isRecording,
  onStartRecording,
  onStopRecording,
  isParsing,
  jobDescriptionFiles,
  onJobFileSelect,
  isJobDescriptionExpanded,
  onToggleJobDescriptionExpanded,
  managerName,
  onManagerNameChange,
  managerEmail,
  onManagerEmailChange,
  managerPhone,
  onManagerPhoneChange
}: JobDescriptionStepProps) {

  // Hidden file input (same pattern as CV upload)
  const jobFileInputRef = useRef<HTMLInputElement>(null);

  // Existing jobs state
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState('');

  useEffect(() => {
    if (jobInputMethod === 'existing') {
      const controller = new AbortController();
      const load = async () => {
        setJobsLoading(true);
        try {
          const params = new URLSearchParams();
          params.set('limit', '25');
          if (jobSearch.trim()) params.set('search', jobSearch.trim());
          const res = await fetch(`/api/jobs?${params.toString()}`, { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            setJobs(data.jobs || []);
          }
        } catch (e) {
          // ignore abort or network errors here
        } finally {
          setJobsLoading(false);
        }
      };
      load();
      return () => controller.abort();
    }
  }, [jobInputMethod, jobSearch]);

  // Job description file dropzone
  const { getRootProps: getJobRootProps, getInputProps: getJobInputProps, isDragActive: isJobDragActive, isDragReject: isJobDragReject } = useDropzone({
    noClick: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/html': ['.html']
    },
    maxSize: 25 * 1024 * 1024, // 25MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        console.log('📁 Files dropped:', acceptedFiles.map(f => f.name));
        
        // Create a FileList-like object (avoid duplicate keys)
        const fileList: Partial<FileList> & { length: number; item: (n: number) => File | null } = {
          length: acceptedFiles.length,
          item: (index: number) => acceptedFiles[index] || null,
        } as any;
        acceptedFiles.forEach((f, i) => (fileList as any)[i] = f);
        
        // Create a synthetic event for compatibility
        const syntheticEvent = {
          target: { 
            files: fileList as FileList
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onJobFileSelect(syntheticEvent);
      }
    }
  });

  const handleJobTextChange = (text: string) => {
    onJobDescriptionUpdate({
      ...jobDescription,
      text
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        <div className="max-w-2xl mx-auto space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Description & Manager Details</h3>
            <p className="text-gray-600">Add job requirements and manager contact information</p>
          </div>
          
          {/* Job Input Method Selection */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Add Job Description</h4>
            <div className="flex gap-2 justify-center mb-4">
              <Button
                onClick={() => onJobInputMethodChange('existing')}
                variant={jobInputMethod === 'existing' ? 'primary' : 'outline'}
                className="flex-1 max-w-[150px]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Existing Job
              </Button>
              <Button
                onClick={() => onJobInputMethodChange('text')}
                variant={jobInputMethod === 'text' ? 'primary' : 'outline'}
                className="flex-1 max-w-[150px]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Text Input
              </Button>
              <Button
                onClick={() => onJobInputMethodChange('file')}
                variant={jobInputMethod === 'file' ? 'primary' : 'outline'}
                className="flex-1 max-w-[150px]"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <Button
                onClick={() => onJobInputMethodChange('voice')}
                variant={jobInputMethod === 'voice' ? 'primary' : 'outline'}
                className="flex-1 max-w-[150px]"
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice
              </Button>
            </div>
            
            {/* Text Input */}
            {jobInputMethod === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description Text
                </label>
                <Textarea
                  value={jobDescription.text}
                  onChange={(e) => handleJobTextChange(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="h-48"
                />
              </div>
            )}

            {/* Existing Job Selection */}
            {jobInputMethod === 'existing' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Existing Job
                </label>
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="Search by title, description, location..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
                  {jobsLoading ? (
                    <div className="p-4 text-sm text-gray-600">Loading jobs...</div>
                  ) : jobs.length === 0 ? (
                    <div className="p-4 text-sm text-gray-600">No jobs found.</div>
                  ) : (
                    jobs.map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-gray-50"
                        onClick={() => {
                          onJobDescriptionUpdate({
                            text: job.description || '',
                            requirements: job.requirements || [],
                            skills: [],
                            responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : (job.responsibilities || ''),
                            title: job.title || '',
                            company: job.client?.name || ''
                          });
                        }}
                      >
                        <div className="font-medium text-gray-900">{job.title}</div>
                        <div className="text-xs text-gray-500">
                          {job.client?.name ? `${job.client.name} • ` : ''}{job.location}
                        </div>
                        {job.description && (
                          <div className="text-xs text-gray-600 line-clamp-2 mt-1">{job.description}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* File Upload with Drag & Drop */}
            {jobInputMethod === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Job Description File
                </label>
                <div 
                  {...getJobRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isJobDragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : isJobDragReject 
                        ? 'border-red-400 bg-red-50' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {/* Dropzone-controlled input */}
                  <input {...getJobInputProps()} />
                  <Upload className={`h-8 w-8 mx-auto mb-2 ${
                    isJobDragActive ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <p className="text-sm text-gray-600 mb-2">
                    {isJobDragActive 
                      ? 'Drop job description files here...' 
                      : 'Drag & drop job description files here, or click to browse'
                    }
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Supports PDF, DOCX, TXT, MD, HTML (max 25MB)
                  </p>
                  {/* Hidden input mirroring CV upload behavior */}
                  <input
                    ref={jobFileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.md,.html"
                    className="hidden"
                    onChange={onJobFileSelect}
                  />
                  <Button
                    onClick={(e) => { e.stopPropagation(); jobFileInputRef.current?.click(); }}
                    disabled={isParsing}
                    type="button"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Choose Files'
                    )}
                  </Button>
                  
                  {jobDescriptionFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {jobDescriptionFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Voice Recording */}
            {jobInputMethod === 'voice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record Job Description
                </label>
                <Card className="p-6 text-center">
                  <div className="space-y-4">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                      isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-100'
                    }`}>
                      {isRecording ? (
                        <MicOff className="h-8 w-8 text-red-600" />
                      ) : (
                        <Mic className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                      </p>
                      <Button
                        onClick={isRecording ? onStopRecording : onStartRecording}
                        variant={isRecording ? 'secondary' : 'primary'}
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="h-4 w-4 mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-2" />
                            Start Recording
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
          
          {/* Parsed Job Description Display */}
          {jobDescription.text && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-semibold text-gray-900">Job Description</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleJobDescriptionExpanded}
                >
                  {isJobDescriptionExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
                             {jobDescription.title && (
                <div className="mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                    {jobDescription.title}
                  </span>
                  {jobDescription.company && (
                    <Badge variant="secondary" className="ml-2">{jobDescription.company}</Badge>
                  )}
                </div>
              )}
              
              <div className={`${isJobDescriptionExpanded ? '' : 'line-clamp-3'}`}>
                <p className="text-sm text-gray-600">{jobDescription.text}</p>
              </div>
              
              {isJobDescriptionExpanded && (
                <div className="mt-4 space-y-4">
                  {jobDescription.requirements.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Requirements</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {jobDescription.requirements.map((req, index) => (
                          <li key={index} className="text-sm text-gray-600">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {jobDescription.skills.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Skills</h5>
                      <div className="flex flex-wrap gap-1">
                        {jobDescription.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {jobDescription.responsibilities && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Responsibilities</h5>
                      <p className="text-sm text-gray-600">{jobDescription.responsibilities}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
          
          {/* Manager Contact Details */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Manager Contact Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Name
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => onManagerNameChange(e.target.value)}
                  placeholder="Enter manager full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Email
                </label>
                <input
                  type="email"
                  value={managerEmail}
                  onChange={(e) => onManagerEmailChange(e.target.value)}
                  placeholder="manager@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Phone
                </label>
                <input
                  type="tel"
                  value={managerPhone}
                  onChange={(e) => onManagerPhoneChange(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Processing Indicator */}
          {isParsing && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Processing job description...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 