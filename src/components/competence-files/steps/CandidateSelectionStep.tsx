'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Upload, 
  FileText, 
  Link, 
  Loader2,
  Users,
  Search,
  X,
  CheckCircle
} from 'lucide-react';

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

interface CandidateSelectionStepProps {
  selectedCandidate: CandidateData | null;
  onCandidateSelected: (candidate: CandidateData) => void;
  isParsing: boolean;
  onFileUpload: (files: File[]) => void;
  onTextParse: (text: string) => void;
  onUrlParse: (url: string) => void;
}

export function CandidateSelectionStep({
  selectedCandidate,
  onCandidateSelected,
  isParsing,
  onFileUpload,
  onTextParse,
  onUrlParse
}: CandidateSelectionStepProps) {
  const { getToken } = useAuth();
  const [inputMethod, setInputMethod] = useState<'file' | 'text' | 'url' | 'existing'>('file');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  
  // Existing candidates state
  const [existingCandidates, setExistingCandidates] = useState<CandidateData[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateData[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      // Remove legacy .doc which we do not support in extraction API
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/html': ['.html'],
      'text/markdown': ['.md'],
      'text/x-markdown': ['.md']
    },
    maxSize: 25 * 1024 * 1024, // 25MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles);
      }
    }
  });

  // Load existing candidates when switching to existing method
  useEffect(() => {
    if (inputMethod === 'existing') {
      loadExistingCandidates();
    }
  }, [inputMethod]);

  // Filter candidates based on search
  useEffect(() => {
    if (candidateSearch.trim()) {
      const filtered = existingCandidates.filter(candidate =>
        candidate.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        candidate.currentTitle.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        candidate.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(candidateSearch.toLowerCase()))
      );
      setFilteredCandidates(filtered);
    } else {
      setFilteredCandidates(existingCandidates);
    }
  }, [candidateSearch, existingCandidates]);

  const loadExistingCandidates = async () => {
    setIsLoadingCandidates(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/candidates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setExistingCandidates(data.candidates || []);
        setFilteredCandidates(data.candidates || []);
      } else {
        console.error('Failed to load candidates');
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleTextParseClick = () => {
    if (textInput.trim()) {
      onTextParse(textInput.trim());
    }
  };

  const handleUrlParseClick = () => {
    if (urlInput.trim()) {
      onUrlParse(urlInput.trim());
    }
  };

  const handleSelectExistingCandidate = (candidate: CandidateData) => {
    onCandidateSelected(candidate);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        <div className="max-w-2xl mx-auto space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Candidate Information</h3>
            <p className="text-gray-600">Choose how you'd like to add candidate information</p>
          </div>
          
          {/* Input Method Selection */}
          <div className="flex gap-2 justify-center flex-wrap">
            <Button
              onClick={() => setInputMethod('file')}
              variant={inputMethod === 'file' ? 'primary' : 'outline'}
              className="flex-1 min-w-[120px] max-w-[150px]"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <Button
              onClick={() => setInputMethod('text')}
              variant={inputMethod === 'text' ? 'primary' : 'outline'}
              className="flex-1 min-w-[120px] max-w-[150px]"
            >
              <FileText className="h-4 w-4 mr-2" />
              Paste Text
            </Button>
            <Button
              onClick={() => setInputMethod('url')}
              variant={inputMethod === 'url' ? 'primary' : 'outline'}
              className="flex-1 min-w-[120px] max-w-[150px]"
            >
              <Link className="h-4 w-4 mr-2" />
              LinkedIn URL
            </Button>
            <Button
              onClick={() => setInputMethod('existing')}
              variant={inputMethod === 'existing' ? 'primary' : 'outline'}
              className="flex-1 min-w-[120px] max-w-[150px]"
            >
              <Users className="h-4 w-4 mr-2" />
              Existing
            </Button>
          </div>
          
          {/* File Upload */}
          {inputMethod === 'file' && (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : isDragReject 
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
              } ${isParsing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                {...getInputProps()}
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.docx,.txt,.html,.md"
                className="hidden"
                disabled={isParsing}
              />
              <Upload className={`h-12 w-12 mx-auto mb-4 ${
                isDragActive ? 'text-blue-500' : isDragReject ? 'text-red-500' : 'text-gray-400'
              }`} />
              <p className={`text-lg font-medium mb-2 ${
                isDragActive ? 'text-blue-900' : isDragReject ? 'text-red-900' : 'text-gray-900'
              }`}>
                {isDragActive ? 'Drop your resume here!' : 'Upload Resume/CV'}
              </p>
              <p className={`mb-4 ${
                isDragActive ? 'text-blue-700' : isDragReject ? 'text-red-700' : 'text-gray-600'
              }`}>
                {isDragReject 
                  ? 'File type not supported' 
                  : 'Drag & drop or click to browse • PDF, DOCX, TXT, HTML, MD files • Max 25MB'
                }
              </p>
              {!isDragActive && !isParsing && (
                <Button onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
                  {isParsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Choose File'
                  )}
                </Button>
              )}
            </div>
          )}
          
          {/* Text Input */}
          {inputMethod === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Resume/CV Text
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste the candidate resume or CV text here..."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button 
                onClick={handleTextParseClick}
                disabled={!textInput.trim() || isParsing}
                className="w-full mt-4"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Parsing...
                  </>
                ) : (
                  'Parse Text'
                )}
              </Button>
            </div>
          )}
          
          {/* URL Input */}
          {inputMethod === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button 
                onClick={handleUrlParseClick}
                disabled={!urlInput.trim() || isParsing}
                className="w-full mt-4"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Parsing...
                  </>
                ) : (
                  'Parse LinkedIn Profile'
                )}
              </Button>
            </div>
          )}

          {/* Existing Candidates Selection */}
          {inputMethod === 'existing' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Existing Candidates
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, title, email, or skills..."
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {candidateSearch && (
                    <button
                      onClick={() => setCandidateSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {isLoadingCandidates ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Loading candidates...</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">
                        {candidateSearch ? 'No candidates found matching your search.' : 'No candidates found.'}
                      </p>
                    </div>
                  ) : (
                    filteredCandidates.map((candidate) => (
                      <Card 
                        key={candidate.id} 
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedCandidate?.id === candidate.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectExistingCandidate(candidate)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{candidate.fullName}</h4>
                              {selectedCandidate?.id === candidate.id && (
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{candidate.currentTitle}</p>
                            <p className="text-sm text-gray-500 mb-3">{candidate.email}</p>
                            
                            {candidate.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {candidate.skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {candidate.skills.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{candidate.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{candidate.yearsOfExperience} yrs exp</p>
                            <p>{candidate.location}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Processing Indicator */}
          {isParsing && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Processing candidate information...</p>
            </div>
          )}

          {/* Selected Candidate Display */}
          {selectedCandidate && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Candidate Selected</h4>
              </div>
              <p className="text-green-800">{selectedCandidate.fullName}</p>
              <p className="text-sm text-green-700">{selectedCandidate.currentTitle}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 