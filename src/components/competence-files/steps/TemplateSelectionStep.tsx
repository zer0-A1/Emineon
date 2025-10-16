'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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

interface TemplateSelectionStepProps {
  selectedCandidate: CandidateData;
  selectedTemplate: 'professional' | 'professional-classic' | 'modern' | 'minimal' | 'emineon' | 'antaes';
  onTemplateSelect: (template: 'professional' | 'professional-classic' | 'modern' | 'minimal' | 'emineon' | 'antaes') => void;
  jobDescription?: {
    text: string;
    requirements: string[];
    skills: string[];
    responsibilities: string;
    title?: string;
    company?: string;
  };
}

export function TemplateSelectionStep({
  selectedCandidate,
  selectedTemplate,
  onTemplateSelect,
  jobDescription
}: TemplateSelectionStepProps) {
  const templates = [
    {
      id: 'professional-classic' as const,
      name: 'Professional Classic',
      description: 'Premium business template for corporate environments with elegant styling',
      color: 'bg-slate-100 border-slate-300',
      textColor: 'text-slate-800'
    },
    {
      id: 'antaes' as const,
      name: 'Antaes',
      description: 'Executive-level template with premium styling',
      color: 'bg-purple-100 border-purple-300',
      textColor: 'text-purple-800'
    },
    {
      id: 'emineon' as const,
      name: 'Emineon',
      description: 'Professional consulting template with clean design',
      color: 'bg-blue-100 border-blue-300',
      textColor: 'text-blue-800'
    },
    {
      id: 'professional' as const,
      name: 'Professional',
      description: 'Standard business template with classic layout',
      color: 'bg-gray-100 border-gray-300',
      textColor: 'text-gray-800'
    },
    {
      id: 'modern' as const,
      name: 'Modern',
      description: 'Contemporary design with clean lines',
      color: 'bg-green-100 border-green-300',
      textColor: 'text-green-800'
    },
    {
      id: 'minimal' as const,
      name: 'Minimal',
      description: 'Clean, simple layout focusing on content',
      color: 'bg-orange-100 border-orange-300',
      textColor: 'text-orange-800'
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Template</h3>
              <p className="text-gray-600">Choose a professional template for your competence file</p>
            </div>

            {/* AI Optimization Preview */}
            {jobDescription && (jobDescription.text || jobDescription.title) && (
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-2">AI-Powered Content Optimization</h4>
                    <p className="text-blue-800 text-sm mb-3">
                      Based on the job description{jobDescription.title && ` for "${jobDescription.title}"`}, 
                      AI will automatically optimize the content with relevant information that highlights 
                      your candidate's alignment with the role requirements.
                    </p>
                    {jobDescription.skills && jobDescription.skills.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Key Skills to Highlight:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {jobDescription.skills.slice(0, 5).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                          {jobDescription.skills.length > 5 && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                              +{jobDescription.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-blue-600">
                      Content will be intelligently generated and optimized in the next step
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Candidate Info */}
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {selectedCandidate.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium">{selectedCandidate.fullName}</h4>
                  <p className="text-gray-600">{selectedCandidate.currentTitle}</p>
                  <p className="text-sm text-gray-500">{selectedCandidate.location}</p>
                </div>
              </div>
            </Card>
            
            {/* Template Selection */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Choose Your Template</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate === template.id
                        ? 'ring-2 ring-primary-500 bg-primary-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onTemplateSelect(template.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className={`w-6 h-6 rounded ${template.color}`}></div>
                          <h5 className="font-semibold text-gray-900">{template.name}</h5>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 