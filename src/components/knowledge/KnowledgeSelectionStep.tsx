'use client';

import React, { useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface KnowledgeSelectionStepProps {
  isParsing: boolean;
  onFileUpload: (files: File[]) => void;
  onTextParse: (text: string) => void;
}

export function KnowledgeSelectionStep({ isParsing, onFileUpload, onTextParse }: KnowledgeSelectionStepProps) {
  const [inputMethod, setInputMethod] = React.useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = React.useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/html': ['.html', '.htm'],
      'text/markdown': ['.md']
    },
    maxSize: 25 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onFileUpload(acceptedFiles);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) onFileUpload(files);
  };

  const handleTextParseClick = () => {
    if (textInput.trim()) onTextParse(textInput.trim());
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Knowledge Source</h3>
            <p className="text-gray-600">Choose how you'd like to add knowledge/reference content</p>
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={() => setInputMethod('file')} variant={inputMethod === 'file' ? 'primary' : 'outline'} className="flex-1 min-w-[140px] max-w-[180px]">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document(s)
            </Button>
            <Button onClick={() => setInputMethod('text')} variant={inputMethod === 'text' ? 'primary' : 'outline'} className="flex-1 min-w-[140px] max-w-[180px]">
              <FileText className="h-4 w-4 mr-2" />
              Paste Source Text
            </Button>
          </div>

          {inputMethod === 'file' && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : isDragReject ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              } ${isParsing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                {...getInputProps()}
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.html,.htm,.md"
                className="hidden"
                disabled={isParsing}
              />
              <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-blue-500' : isDragReject ? 'text-red-500' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium mb-2 ${isDragActive ? 'text-blue-900' : isDragReject ? 'text-red-900' : 'text-gray-900'}`}>
                {isDragActive ? 'Drop your documents here!' : 'Upload document(s)'}
              </p>
              <p className={`${isDragActive ? 'text-blue-700' : isDragReject ? 'text-red-700' : 'text-gray-600'} mb-4`}>
                {isDragReject ? 'File type not supported' : 'Drag & drop or click to browse • PDF, DOC/DOCX, PPT/PPTX, TXT, HTML/MD • Max 25MB'}
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

          {inputMethod === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Paste knowledge/reference text</label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste the case study / reference / deliverable text here..."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={handleTextParseClick} disabled={!textInput.trim() || isParsing} className="w-full mt-4">
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

          {isParsing && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Processing content...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


