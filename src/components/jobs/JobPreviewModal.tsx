'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { X, Download, Eye, FileText, Image } from 'lucide-react';
import { type JobTemplate, type StyleConfig } from '@/data/job-templates';

interface JobPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobData: {
    title: string;
    company: string;
    location: string;
    contractType: string;
    workMode: string;
    description: string;
    skills: string[];
    salary?: string;
    department?: string;
    startDate?: string;
    languages?: string[];
    priority?: string;
  };
  logoUrl?: string;
  selectedFields: {
    title: boolean;
    company: boolean;
    location: boolean;
    contractType: boolean;
    workMode: boolean;
    department: boolean;
    salary: boolean;
    description: boolean;
    skills: boolean;
    languages: boolean;
    startDate: boolean;
    duration: boolean;
    priority: boolean;
  };
  selectedTemplate?: JobTemplate | null;
  customStyleConfig?: StyleConfig;
  onDownload: (format: 'pdf' | 'docx') => void;
}

export function JobPreviewModal({ 
  isOpen, 
  onClose, 
  jobData, 
  logoUrl, 
  selectedFields, 
  selectedTemplate,
  customStyleConfig,
  onDownload 
}: JobPreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Use custom style config if available, otherwise fall back to template or defaults
  const styleConfig = customStyleConfig || selectedTemplate?.styleConfig;
  const primaryColor = styleConfig?.primaryColor || selectedTemplate?.colorHex || '#3B82F6';
  const titleFont = styleConfig?.titleFont || selectedTemplate?.font || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
  const bodyFont = styleConfig?.bodyFont || selectedTemplate?.font || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
  const titleColor = styleConfig?.titleColor || primaryColor;
  const subtitleColor = styleConfig?.subtitleColor || '#6B7280';
  const bodyColor = styleConfig?.bodyColor || '#374151';
  const sectionHeaderColor = styleConfig?.sectionHeaderColor || primaryColor;
  const borderColor = styleConfig?.borderColor || primaryColor;
  const tagBackground = styleConfig?.tagBackground || '#EFF6FF';
  const tagColor = styleConfig?.tagColor || primaryColor;
  const tagBorder = styleConfig?.tagBorder || '#DBEAFE';
  const tagBorderRadius = styleConfig?.tagBorderRadius || '0.375rem';

  if (!isOpen) return null;

  const handleDownload = async (format: 'pdf' | 'docx') => {
    setIsDownloading(true);
    try {
      await onDownload(format);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Eye className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Job Description Preview</h2>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => handleDownload('pdf')}
              disabled={isDownloading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={() => handleDownload('docx')}
              disabled={isDownloading}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download DOCX
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Card>
            <CardContent className="p-8">
              <div 
                className="w-full bg-white text-black"
                style={{ 
                  fontFamily: bodyFont,
                  lineHeight: '1.6',
                  color: bodyColor
                }}
              >
                {/* Header */}
                <div 
                  className="flex items-start justify-between mb-8 pb-6 border-b-2"
                  style={{ borderColor: borderColor }}
                >
                  <div className="flex-1">
                    {selectedFields.title && (
                      <h1 
                        className="text-3xl font-bold mb-2"
                        style={{ 
                          color: titleColor,
                          fontFamily: titleFont,
                          fontSize: styleConfig?.titleSize || '2rem',
                          fontWeight: styleConfig?.titleWeight || '700'
                        }}
                      >
                        {jobData.title || 'Job Title'}
                      </h1>
                    )}
                    {selectedFields.company && (
                      <h2 
                        className="text-xl mb-2 font-normal"
                        style={{ 
                          color: subtitleColor,
                          fontFamily: styleConfig?.subtitleFont || titleFont,
                          fontSize: styleConfig?.subtitleSize || '1.25rem',
                          fontWeight: styleConfig?.subtitleWeight || '600'
                        }}
                      >
                        {jobData.company || 'Company Name'}
                      </h2>
                    )}
                    {selectedFields.location && (
                      <div 
                        className="text-base"
                        style={{ color: bodyColor }}
                      >
                        📍 {jobData.location || 'Location'}
                      </div>
                    )}
                  </div>
                  <div className="ml-6">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Company logo" 
                        className="max-h-20 max-w-48 object-contain"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Details Grid */}
                <div 
                  className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 p-6 rounded-lg"
                  style={{ 
                    backgroundColor: styleConfig?.sectionHeaderBackground || '#F9FAFB',
                    borderRadius: styleConfig?.borderRadius || '0.5rem'
                  }}
                >
                  {selectedFields.contractType && (
                    <div className="text-center">
                      <div 
                        className="font-bold text-sm mb-1"
                        style={{ color: sectionHeaderColor }}
                      >
                        Contract Type
                      </div>
                      <div style={{ color: bodyColor }} className="capitalize">
                        {jobData.contractType || 'Permanent'}
                      </div>
                    </div>
                  )}
                  {selectedFields.workMode && (
                    <div className="text-center">
                      <div 
                        className="font-bold text-sm mb-1"
                        style={{ color: sectionHeaderColor }}
                      >
                        Work Mode
                      </div>
                      <div style={{ color: bodyColor }} className="capitalize">
                        {jobData.workMode || 'Hybrid'}
                      </div>
                    </div>
                  )}
                  {selectedFields.department && jobData.department && (
                    <div className="text-center">
                      <div 
                        className="font-bold text-sm mb-1"
                        style={{ color: sectionHeaderColor }}
                      >
                        Department
                      </div>
                      <div style={{ color: bodyColor }}>{jobData.department}</div>
                    </div>
                  )}
                  {selectedFields.salary && jobData.salary && (
                    <div className="text-center">
                      <div 
                        className="font-bold text-sm mb-1"
                        style={{ color: sectionHeaderColor }}
                      >
                        Salary
                      </div>
                      <div style={{ color: bodyColor }}>{jobData.salary}</div>
                    </div>
                  )}
                  {selectedFields.startDate && jobData.startDate && (
                    <div className="text-center">
                      <div 
                        className="font-bold text-sm mb-1"
                        style={{ color: sectionHeaderColor }}
                      >
                        Start Date
                      </div>
                      <div style={{ color: bodyColor }}>
                        {new Date(jobData.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {selectedFields.priority && jobData.priority && (
                    <div className="text-center">
                      <div 
                        className="font-bold text-sm mb-1"
                        style={{ color: sectionHeaderColor }}
                      >
                        Priority
                      </div>
                      <div style={{ color: bodyColor }} className="capitalize">{jobData.priority}</div>
                    </div>
                  )}
                </div>

                {/* Job Description */}
                {selectedFields.description && (
                  <div className="mb-8">
                    <h3 
                      className="text-xl font-semibold mb-4"
                      style={{ 
                        color: sectionHeaderColor,
                        fontFamily: styleConfig?.sectionHeaderFont || titleFont,
                        fontSize: styleConfig?.sectionHeaderSize || '1.125rem',
                        fontWeight: styleConfig?.sectionHeaderWeight || '600'
                      }}
                    >
                      Job Description
                    </h3>
                    <div 
                      className="text-base leading-relaxed whitespace-pre-wrap"
                      style={{ 
                        color: bodyColor,
                        fontFamily: bodyFont,
                        fontSize: styleConfig?.bodySize || '1rem'
                      }}
                    >
                      {jobData.description || 'Job description will appear here...'}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedFields.skills && jobData.skills && jobData.skills.length > 0 && (
                  <div className="mb-8">
                    <h3 
                      className="text-xl font-semibold mb-4"
                      style={{ 
                        color: sectionHeaderColor,
                        fontFamily: styleConfig?.sectionHeaderFont || titleFont,
                        fontSize: styleConfig?.sectionHeaderSize || '1.125rem',
                        fontWeight: styleConfig?.sectionHeaderWeight || '600'
                      }}
                    >
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {jobData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm font-medium border"
                          style={{
                            backgroundColor: tagBackground,
                            color: tagColor,
                            borderColor: tagBorder,
                            borderRadius: tagBorderRadius
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {selectedFields.languages && jobData.languages && jobData.languages.length > 0 && (
                  <div className="mb-8">
                    <h3 
                      className="text-xl font-semibold mb-4"
                      style={{ 
                        color: sectionHeaderColor,
                        fontFamily: styleConfig?.sectionHeaderFont || titleFont,
                        fontSize: styleConfig?.sectionHeaderSize || '1.125rem',
                        fontWeight: styleConfig?.sectionHeaderWeight || '600'
                      }}
                    >
                      Language Requirements
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {jobData.languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm font-medium border"
                          style={{
                            backgroundColor: tagBackground,
                            color: tagColor,
                            borderColor: tagBorder,
                            borderRadius: tagBorderRadius
                          }}
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 