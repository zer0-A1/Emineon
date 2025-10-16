'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus, 
  Search, 
  X,
  Filter, 
  Download, 
  Eye, 
  MoreHorizontal,
  FileText,
  Calendar,
  User,
  Building2,
  Share2,
  Settings,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { AnimatedPageTitle } from '@/components/ui/AnimatedPageTitle';
import dynamic from 'next/dynamic';
const CreateCompetenceFileModal = dynamic(() => import('@/components/competence-files/CreateCompetenceFileModal').then(m => m.CreateCompetenceFileModal), { ssr: false, loading: () => null });
import { CreateTemplateModal } from '@/components/competence-files/CreateTemplateModal';

// Interface for competence file data
interface CompetenceFile {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateTitle: string;
  template: string;
  templateName: string;
  client: string;
  job: string;
  status: 'GENERATED' | 'DRAFT' | 'ARCHIVED' | 'FAILED' | 'Generated' | 'Draft' | 'Archived' | 'Failed' | 'READY' | 'Ready' | 'GENERATING' | 'Generating' | 'ERROR' | 'Error';
  createdAt: string;
  updatedAt: string;
  version: number;
  downloadCount: number;
  isAnonymized: boolean;
  fileName: string;
  fileUrl: string | null;
  format: string;
  sections?: any[];
  candidateData?: any;
}

const statusColors = {
  'GENERATED': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'Generated': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'READY': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'Ready': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'DRAFT': 'bg-amber-100 text-amber-800 border border-amber-200',
  'Draft': 'bg-amber-100 text-amber-800 border border-amber-200',
  'GENERATING': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Generating': 'bg-blue-100 text-blue-800 border border-blue-200',
  'ARCHIVED': 'bg-slate-100 text-slate-800 border border-slate-200',
  'Archived': 'bg-slate-100 text-slate-800 border border-slate-200',
  'FAILED': 'bg-red-100 text-red-800 border border-red-200',
  'Failed': 'bg-red-100 text-red-800 border border-red-200',
  'ERROR': 'bg-red-100 text-red-800 border border-red-200',
  'Error': 'bg-red-100 text-red-800 border border-red-200'
};

export default function CompetenceFilesPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [competenceFiles, setCompetenceFiles] = useState<CompetenceFile[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<CompetenceFile | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);
  
  // Multi-select state (always enabled)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Fetch competence files on component mount
  useEffect(() => {
    fetchCompetenceFiles();
  }, [searchQuery, selectedFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowActions(null);
    };
    
    if (showActions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActions]);

  const fetchCompetenceFiles = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedFilter !== 'all') params.append('status', selectedFilter);
      
      const response = await fetch(`/api/competence-files?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setCompetenceFiles(result.data || []);
      } else {
        console.error('Failed to fetch competence files');
      }
    } catch (error) {
      console.error('Error fetching competence files:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = competenceFiles.filter((file: CompetenceFile) => {
    const matchesSearch = (file.candidateName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (file.client?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (file.job?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || (file.status?.toLowerCase() || '') === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateFile = (fileData: any) => {
    const newFile: CompetenceFile = {
      id: Date.now().toString(),
      candidateId: fileData.candidateId || 'unknown',
      candidateName: fileData.candidateName || 'Unknown Candidate',
      candidateTitle: fileData.candidateTitle || 'Unknown Title',
      template: fileData.template || 'professional',
      templateName: fileData.templateName || 'Professional Template',
      client: fileData.client || 'Unknown Client',
      job: fileData.job || 'Unknown Job',
      status: 'Generated',
      fileName: fileData.fileName || 'competence_file.pdf',
      fileUrl: fileData.fileUrl || null,
      format: fileData.format || 'pdf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      downloadCount: 0,
      isAnonymized: false,
      sections: fileData.sections || [],
      candidateData: fileData.candidateData || null
    };
    setCompetenceFiles([newFile, ...competenceFiles]);
  };

  const handleCreateTemplate = (templateData: any) => {
    const newTemplate = {
      id: Date.now().toString(),
      ...templateData
    };
    setTemplates([newTemplate, ...templates]);
  };

  const handleDownload = (file: CompetenceFile) => {
    if (!file.fileUrl) {
      if (file.status === 'Draft') {
        alert('Cannot download draft files. Please generate the file first.');
      } else {
        alert('File URL not available for download. Please regenerate the file.');
      }
      return;
    }

    try {
      // Use download proxy to ensure proper file delivery
      const downloadUrl = `/api/competence-files/download?url=${encodeURIComponent(file.fileUrl)}&filename=${encodeURIComponent(file.fileName || `${file.candidateName}_competence_file.${file.format || 'pdf'}`)}`;
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.fileName || `${file.candidateName}_competence_file.${file.format || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Update download count
      setCompetenceFiles((files: CompetenceFile[]) => 
        files.map((f: CompetenceFile) => 
          f.id === file.id 
            ? { ...f, downloadCount: (f.downloadCount || 0) + 1 }
            : f
        )
      );
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again or contact support.');
    }
  };

  const handlePreview = (file: CompetenceFile) => {
    // If file has a download URL (Vercel blob), open it directly
    if (file.fileUrl) {
      console.log('🔗 Opening PDF directly from Vercel blob:', file.fileUrl);
      window.open(file.fileUrl, '_blank');
    } else {
      // Fallback to generated preview endpoint
      console.log('📄 Using generated preview endpoint for:', file.id);
      const previewUrl = `/api/competence-files/${file.id}/preview`;
      window.open(previewUrl, '_blank');
    }
  };

  const handleModify = async (file: CompetenceFile) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/competence-files/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        const fileData = result.data;
        
        // Set the file data and reopen the modal in edit mode
        setSelectedFile(fileData);
        setIsCreateModalOpen(true);
      } else {
        alert('Failed to load file for editing');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Failed to load file for editing');
    }
  };

  const handleDelete = async (file: CompetenceFile) => {
    if (!confirm(`Are you sure you want to delete the competence file for ${file.candidateName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`/api/competence-files/${file.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setCompetenceFiles((files: CompetenceFile[]) => 
          files.filter((f: CompetenceFile) => f.id !== file.id)
        );
        alert('Competence file deleted successfully');
      } else {
        alert('Failed to delete competence file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete competence file');
    }
  };

  // Multi-select handlers (always enabled)
  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(file => file.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    const selectedFileNames = Array.from(selectedFiles)
      .map(id => competenceFiles.find(f => f.id === id)?.candidateName)
      .filter(Boolean)
      .join(', ');
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} competence file(s) for: ${selectedFileNames}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = await getToken();
      const deletePromises = Array.from(selectedFiles).map(fileId =>
        fetch(`/api/competence-files/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      );

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failCount = results.filter(result => result.status === 'rejected').length;

      // Remove successfully deleted files from state
      setCompetenceFiles((files: CompetenceFile[]) => 
        files.filter((f: CompetenceFile) => !selectedFiles.has(f.id))
      );

      // Reset selection
      setSelectedFiles(new Set());

      // Show result message
      if (failCount === 0) {
        alert(`Successfully deleted ${successCount} competence file(s)`);
      } else {
        alert(`Deleted ${successCount} file(s), but ${failCount} failed to delete`);
      }
    } catch (error) {
      console.error('Error during bulk delete:', error);
      alert('Failed to delete selected files');
    }
  };

  return (
    <Layout fullWidth>
      <div className="space-y-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <AnimatedPageTitle title="Competence Files" Icon={FileText} />
          <p className="text-sm text-gray-500 mt-1">Create and manage polished, client-facing candidate profiles</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Competence Files ({competenceFiles.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates ({templates.length})
            </button>
          </nav>
        </div>

        {/* Removed summary stats to keep header minimalist and maximize space */}

        {/* Search and Filters */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 items-center w-full">
            <div className="relative flex-1 w-full min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'files' ? "Search by candidate, client, or job..." : "Search templates..."}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  type="button"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            {activeTab === 'files' && (
              <div className="hidden md:flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="ready">Ready</option>
                  <option value="generated">Generated</option>
                  <option value="generating">Generating</option>
                  <option value="draft">Draft</option>
                  <option value="error">Error</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0">
              <Button 
                onClick={() => setIsCreateTemplateModalOpen(true)}
                variant="outline"
                className="border-primary-500 text-primary-600 hover:bg-primary-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary flex items-center space-x-2"
                data-testid="create-competence-file-btn"
              >
                <Plus className="h-4 w-4" />
                <span>Create Competence File</span>
              </button>
            </div>
          </div>

          {/* Multi-select controls moved below as discreet checkbox */}
        </div>

        {/* Content */}
        {activeTab === 'files' ? (
          <div className="space-y-4">
            {filteredFiles.length > 0 && (
              <div className="flex items-center justify-between -mb-2">
                <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                    onChange={selectAllFiles}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Select all</span>
                </label>
                {selectedFiles.size > 0 && (
                  <Button
                    onClick={handleBulkDelete}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete selected ({selectedFiles.size})
                  </Button>
                )}
              </div>
            )}
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No competence files found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first competence file to get started'
                  }
                </p>
                {!searchQuery && selectedFilter === 'all' && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Competence File
                  </Button>
                )}
              </div>
            ) : (
              filteredFiles.map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Selection checkbox (always visible) */}
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">{file.candidateName}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${statusColors[file.status as keyof typeof statusColors]} font-medium text-xs px-3 py-1 rounded-full shadow-sm`}>
                                <div className="flex items-center space-x-1">
                                  {file.status === 'GENERATED' || file.status === 'Generated' || file.status === 'READY' || file.status === 'Ready' ? (
                                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                                  ) : file.status === 'DRAFT' || file.status === 'Draft' ? (
                                    <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                                  ) : file.status === 'GENERATING' || file.status === 'Generating' ? (
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                                  ) : file.status === 'FAILED' || file.status === 'Failed' || file.status === 'ERROR' || file.status === 'Error' ? (
                                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                                  ) : (
                                    <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                                  )}
                                  <span className="capitalize">{file.status === 'READY' || file.status === 'Ready' ? 'Ready' : file.status.toLowerCase()}</span>
                                </div>
                            </Badge>
                            {file.isAnonymized && (
                                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                                  <div className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span>Anonymized</span>
                                  </div>
                              </Badge>
                            )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1">{file.candidateTitle}</p>
                          
                          <div className="flex items-center space-x-6 mt-2 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Building2 className="h-3 w-3" />
                              <span>{file.client}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{file.job}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Created {file.createdAt}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="h-3 w-3" />
                              <span>{file.downloadCount} downloads</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePreview(file)}
                          title={file.fileUrl ? 'Open PDF in new tab' : 'Generate preview'}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {file.fileUrl ? 'View PDF' : 'Preview'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(file)}
                          disabled={!file.fileUrl}
                          className={!file.fileUrl ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        
                        {/* Actions Dropdown */}
                        <div className="relative">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowActions(showActions === file.id ? null : file.id)}
                          >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                          
                          {showActions === file.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleModify(file);
                                    setShowActions(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit className="h-4 w-4 mr-3" />
                                  Modify
                                </button>
                                <button
                                  onClick={() => {
                                    handlePreview(file);
                                    setShowActions(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <ExternalLink className="h-4 w-4 mr-3" />
                                  {file.fileUrl ? 'Open PDF' : 'Open Preview'}
                                </button>
                                <div className="border-t border-gray-100"></div>
                                <button
                                  onClick={() => {
                                    handleDelete(file);
                                    setShowActions(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-3" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Templates List */
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600 mb-4">
                  Create your first template to standardize competence file generation
                </p>
                <Button onClick={() => setIsCreateTemplateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            ) : (
              templates.filter(template => 
                (template.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
              ).map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium text-xs px-3 py-1 rounded-full shadow-sm">
                                <div className="flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                                  <span>Active</span>
                                </div>
                            </Badge>
                            {template.isClientSpecific && (
                                <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
                                  <div className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                    <span>Client-specific</span>
                                  </div>
                              </Badge>
                            )}
                            </div>
                          </div>
                          
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-6 mt-2 text-xs text-gray-500">
                            {template.client && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="h-3 w-3" />
                                <span>{template.client}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span>{template.sections?.length || 0} sections</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Created {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Modals */}
      <CreateCompetenceFileModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedFile(null);
        }}
        onSuccess={(message) => {
          console.log('✅ Competence file generated:', message);
          setSelectedFile(null);
          // Add a small delay to ensure the database operation is complete
          setTimeout(() => {
            fetchCompetenceFiles(); // Refresh the list
          }, 500);
        }}
        preselectedCandidate={selectedFile?.candidateData || null}
        existingFileData={selectedFile}
      />
      
      <CreateTemplateModal
        open={isCreateTemplateModalOpen}
        onClose={() => setIsCreateTemplateModalOpen(false)}
        onSave={handleCreateTemplate}
      />
    </Layout>
  );
} 