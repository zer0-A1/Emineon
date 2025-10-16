'use client';

import { useEffect, useState } from 'react';
import PdfSinglePageViewer from './PdfSinglePageViewer';
import { CandidateFieldDisplay } from './CandidateFieldDisplay';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Calendar, 
  MessageSquare, 
  Download, 
  Send, 
  UserPlus, 
  CalendarPlus,
  Edit3,
  ExternalLink,
  Clock,
  Briefcase,
  GraduationCap,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  DollarSign,
  Globe,
  Building,
  Languages,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  Settings
} from 'lucide-react';

interface Candidate {
  id: number;
  databaseId?: string;
  name: string;
  location: string;
  experience: string;
  currentRole: string;
  score: string;
  status: string;
  avatar: string;
  skills: string[];
  rating: number;
  email: string;
  phone: string;
  company: string;
  summary: string;
  education: string;
  languages: string[];
  availability: string;
  expectedSalary: string;
  availableFrom?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  lastInteraction: string;
  source: string;
  // New fields
  dateOfBirth?: string;
  age?: number;
  nationality?: string;
  timezone?: string;
  workPermitType?: string;
  address?: { street?: string; city?: string; postalCode?: string; country?: string };
  mobilityCountries?: string[];
  mobilityCities?: string[];
  professionalHeadline?: string;
  seniorityLevel?: string;
  functionalDomain?: string;
  primaryIndustry?: string;
  preferredContractType?: string;
  remotePreference?: string;
  relocationWillingness?: boolean;
  programmingLanguages?: string[];
  frameworks?: string[];
  toolsAndPlatforms?: string[];
  databases?: string[];
  cloudPlatforms?: string[];
  devOpsTools?: string[];
  testingTools?: string[];
  dataEngineeringTools?: string[];
  mlFrameworks?: string[];
  analyticsTools?: string[];
  mobileTechnologies?: string[];
  webTechnologies?: string[];
  securityTools?: string[];
  monitoringTools?: string[];
  messagingSystems?: string[];
  cmsPlatforms?: string[];
  crmErp?: string[];
  methodologies?: string[];
  workExperience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  timeline: Array<{
    date: string;
    action: string;
    type: string;
    details?: string;
  }>;
  // CV file information
  originalCvUrl?: string;
  originalCvFileName?: string;
  originalCvUploadedAt?: string;
  degrees?: string[];
  certifications?: string[];
  competenceFileUrl?: string;
}

interface CandidateProfileModalProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  initialEditMode?: boolean;
  onRefresh?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function CandidateProfileModal({ 
  candidate, 
  isOpen, 
  onClose,
  initialEditMode = false,
  onRefresh,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false
}: CandidateProfileModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [showAddToJobModal, setShowAddToJobModal] = useState(false);
  const [showCreateCompetenceModal, setShowCreateCompetenceModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedCandidate, setEditedCandidate] = useState(candidate);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewTab, setPreviewTab] = useState<'cv' | 'competence' | 'other'>('cv');
  const [editingSection, setEditingSection] = useState<Record<string, boolean>>({
    summary: false,
    personal: false,
    address: false,
    professional: false,
  });
  const [savingSection, setSavingSection] = useState<Record<string, boolean>>({});

  const updateCandidateSection = async (sectionKey: string, payload: Record<string, any>) => {
    if (!candidate.databaseId) return;
    setSavingSection((s) => ({ ...s, [sectionKey]: true }));
    try {
      const res = await fetch(`/api/candidates/${candidate.databaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Update failed');
      setEditingSection((e) => ({ ...e, [sectionKey]: false }));
      onRefresh?.();
    } catch (err) {
      console.error('Update section failed', err);
      alert('Failed to save changes');
    } finally {
      setSavingSection((s) => ({ ...s, [sectionKey]: false }));
    }
  };

  useEffect(() => {
    if (candidate.originalCvUrl) setPreviewTab('cv');
    else if (candidate.competenceFileUrl) setPreviewTab('competence');
    else setPreviewTab('other');
  }, [candidate.originalCvUrl, candidate.competenceFileUrl]);

  // PDF worker config handled inside PdfSinglePageViewer

  if (!isOpen) return null;

  const handleEdit = () => {
    setIsEditMode(true);
    setEditedCandidate(candidate);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedCandidate(candidate);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/candidates/${candidate.databaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: editedCandidate.name.split(' ')[0],
          lastName: editedCandidate.name.split(' ').slice(1).join(' '),
          email: editedCandidate.email,
          phone: editedCandidate.phone,
          currentTitle: editedCandidate.currentRole,
          currentLocation: editedCandidate.location,
          summary: editedCandidate.summary,
          technicalSkills: editedCandidate.skills,
          expectedSalary: editedCandidate.expectedSalary,
        }),
      });

      if (response.ok) {
        setIsEditMode(false);
        // Refresh the candidates list
        onRefresh?.();
      } else {
        alert('Failed to update candidate');
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      alert('Failed to update candidate');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/candidates/${candidate.databaseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onClose();
        // Refresh the page to update the candidates list
        window.location.reload();
      } else {
        alert('Failed to delete candidate');
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      alert('Failed to delete candidate');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'application': return FileText;
      case 'interview': return MessageSquare;
      case 'scheduling': return Calendar;
      case 'email': return Mail;
      case 'call': return Phone;
      case 'stage_change': return TrendingUp;
      default: return Clock;
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type) {
      case 'application': return 'bg-blue-500';
      case 'interview': return 'bg-green-500';
      case 'scheduling': return 'bg-purple-500';
      case 'email': return 'bg-orange-500';
      case 'call': return 'bg-indigo-500';
      case 'stage_change': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: string) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    switch (score.toLowerCase()) {
      case 'very strong':
        return 'bg-green-100 text-green-800';
      case 'strong':
        return 'bg-blue-100 text-blue-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'interview scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'under review':
        return 'bg-yellow-100 text-yellow-800';
      case 'long list':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'profile', label: 'Profile', icon: UserPlus },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'communications', label: 'Communications', icon: MessageSquare },
    { id: 'assign', label: 'Assign', icon: Building },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'documents', label: 'Documents', icon: Download }
  ];

  return (
    <div id="candidate-modal-root" className="fixed inset-0 z-50" style={{ left: 'var(--sidebar-width, 0px)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-0 flex">
        <div className="w-full h-full bg-white shadow-xl rounded-none overflow-hidden text-left align-middle transition-all transform flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-[#0A2F5A]/10 rounded-full flex items-center justify-center text-[#0A2F5A] font-bold text-2xl shadow-lg">
                {candidate.avatar}
              </div>
              <div>
                {isEditMode ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editedCandidate.name}
                      onChange={(e) => setEditedCandidate({...editedCandidate, name: e.target.value})}
                      className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-[#0A2F5A] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editedCandidate.currentRole}
                      onChange={(e) => setEditedCandidate({...editedCandidate, currentRole: e.target.value})}
                      className="text-gray-600 font-medium bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#0A2F5A]"
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900"
                        onDoubleClick={() => setIsEditMode(true)}
                        title="Double-click to edit"
                        style={{cursor:'text'}}
                    >
                      {candidate.name}
                    </h2>
                    <p className="text-gray-600 font-medium" onDoubleClick={() => setIsEditMode(true)} title="Double-click to edit" style={{cursor:'text'}}>{candidate.currentRole}</p>
                  </div>
                )}
                <div className="flex items-center space-x-3 mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < candidate.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600 font-medium">({candidate.rating}/5)</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getScoreColor(candidate.score)}`}>
                    {candidate.score}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(candidate.status)}`}>
                    {candidate.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="group relative p-2 rounded-lg bg-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Previous"
                title="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="pointer-events-none absolute left-1/2 -top-8 -translate-x-1/2 z-[1000] hidden group-hover:block bg-[#0A2F5A] text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">Previous</span>
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="group relative p-2 rounded-lg bg-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Next"
                title="Next"
              >
                <ChevronRight className="h-5 w-5" />
                <span className="pointer-events-none absolute left-1/2 -top-8 -translate-x-1/2 z-[1000] hidden group-hover:block bg-[#0A2F5A] text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">Next</span>
              </button>
              {isEditMode ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {/* Edit button removed; users can double-click fields to edit */}
                  <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-lg hover:bg-gray-100" title="Delete">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                </>
              )}
              <button onClick={() => { try { onClose(); if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/candidates')) { window.location.href = '/candidates'; } } catch {} }} className="ml-2 p-2 rounded-lg hover:bg-gray-100" title="Close">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-3 border-b border-gray-200">
            <div className="flex justify-start space-x-6 pl-3">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <TabIcon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center space-x-1 pr-2">
              <button onClick={() => setShowCreateCompetenceModal(true)} className="group relative p-2 rounded hover:bg-gray-100" title="Create Competence File">
                <Send className="h-5 w-5 text-gray-700" />
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0A2F5A] text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">Create Competence File</span>
              </button>
              <button onClick={() => setShowAddToJobModal(true)} className="group relative p-2 rounded hover:bg-gray-100" title="Add to Job">
                <UserPlus className="h-5 w-5 text-gray-700" />
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0A2F5A] text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">Add to Job</span>
              </button>
              <button onClick={() => setShowScheduleModal(true)} className="group relative p-2 rounded hover:bg-gray-100" title="Schedule Interview">
                <CalendarPlus className="h-5 w-5 text-gray-700" />
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0A2F5A] text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">Schedule Interview</span>
              </button>
              <button onClick={() => setShowEmailModal(true)} className="group relative p-2 rounded hover:bg-gray-100" title="Send Email">
                <Mail className="h-5 w-5 text-gray-700" />
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0A2F5A] text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">Send Email</span>
              </button>
              <button onClick={() => window.open(`tel:${candidate.phone}`, '_self')} className="group relative p-2 rounded hover:bg-gray-100" title="Call">
                <Phone className="h-5 w-5 text-gray-700" />
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0A2F5A] text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">Call</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-2">
                {/* Left: details (1/2) */}
                <div id="details-col" className="space-y-4 xl:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900">Professional Summary</h3>
                    </div>
                    {isEditMode ? (
                      <div className="space-y-2">
                        <textarea defaultValue={candidate.summary} className="w-full border border-gray-300 rounded p-2 text-sm" rows={4} onChange={(e)=>setEditedCandidate({...editedCandidate, summary: e.target.value})} />
                        <div className="flex justify-end">
                          <button disabled={!!savingSection.summary} onClick={()=>updateCandidateSection('summary', { summary: editedCandidate.summary })} className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm disabled:opacity-50">Save</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700">{candidate.summary}</p>
                    )}
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {isEditMode ? (
                        <>
                          <div>
                            <span className="text-gray-500">Email</span>
                            <input defaultValue={candidate.email} onChange={(e)=>setEditedCandidate({...editedCandidate, email: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div>
                            <span className="text-gray-500">Phone</span>
                            <input defaultValue={candidate.phone} onChange={(e)=>setEditedCandidate({...editedCandidate, phone: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div>
                            <span className="text-gray-500">Date of Birth</span>
                            <input type="date" defaultValue={candidate.dateOfBirth ? candidate.dateOfBirth.substring(0,10) : ''} onChange={(e)=>setEditedCandidate({...editedCandidate, dateOfBirth: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div>
                            <span className="text-gray-500">Nationality</span>
                            <input defaultValue={candidate.nationality} onChange={(e)=>setEditedCandidate({...editedCandidate, nationality: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div>
                            <span className="text-gray-500">Timezone</span>
                            <input defaultValue={candidate.timezone} onChange={(e)=>setEditedCandidate({...editedCandidate, timezone: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" placeholder="e.g. Europe/Zurich" />
                          </div>
                          <div>
                            <span className="text-gray-500">Work Permit</span>
                            <input defaultValue={candidate.workPermitType} onChange={(e)=>setEditedCandidate({...editedCandidate, workPermitType: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <button disabled={!!savingSection.personal} onClick={()=>updateCandidateSection('personal', {
                              email: editedCandidate.email,
                              phone: editedCandidate.phone,
                              dateOfBirth: editedCandidate.dateOfBirth ? new Date(editedCandidate.dateOfBirth) : null,
                              nationality: editedCandidate.nationality,
                              timezone: editedCandidate.timezone,
                              workPermitType: editedCandidate.workPermitType,
                            })} className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm disabled:opacity-50">Save</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div><span className="text-gray-500">Email</span><div className="text-gray-900">{candidate.email}</div></div>
                          <div><span className="text-gray-500">Phone</span><div className="text-gray-900">{candidate.phone}</div></div>
                          {candidate.dateOfBirth && (<div><span className="text-gray-500">Date of Birth</span><div className="text-gray-900">{candidate.dateOfBirth}</div></div>)}
                          {typeof candidate.age === 'number' && (<div><span className="text-gray-500">Age</span><div className="text-gray-900">{candidate.age}</div></div>)}
                          {candidate.nationality && (<div><span className="text-gray-500">Nationality</span><div className="text-gray-900">{candidate.nationality}</div></div>)}
                          {candidate.timezone && (<div><span className="text-gray-500">Timezone</span><div className="text-gray-900">{candidate.timezone}</div></div>)}
                          {candidate.workPermitType && (<div><span className="text-gray-500">Work Permit</span><div className="text-gray-900">{candidate.workPermitType}</div></div>)}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900">Address & Mobility</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isEditMode ? (
                        <>
                          <div className="text-sm">
                            <label className="text-gray-500">Location</label>
                            <input defaultValue={candidate.location} onChange={(e)=>setEditedCandidate({...editedCandidate, location: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <input placeholder="Street" defaultValue={candidate.address?.street} onChange={(e)=>setEditedCandidate({...editedCandidate, address: { ...(editedCandidate.address||{}), street: e.target.value }})} className="border border-gray-300 rounded px-2 py-1" />
                              <input placeholder="Postal Code" defaultValue={candidate.address?.postalCode} onChange={(e)=>setEditedCandidate({...editedCandidate, address: { ...(editedCandidate.address||{}), postalCode: e.target.value }})} className="border border-gray-300 rounded px-2 py-1" />
                              <input placeholder="City" defaultValue={candidate.address?.city} onChange={(e)=>setEditedCandidate({...editedCandidate, address: { ...(editedCandidate.address||{}), city: e.target.value }})} className="border border-gray-300 rounded px-2 py-1" />
                              <input placeholder="Country" defaultValue={candidate.address?.country} onChange={(e)=>setEditedCandidate({...editedCandidate, address: { ...(editedCandidate.address||{}), country: e.target.value }})} className="border border-gray-300 rounded px-2 py-1" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Mobility Countries (comma-separated)</div>
                              <input defaultValue={(candidate.mobilityCountries||[]).join(', ')} onChange={(e)=>setEditedCandidate({...editedCandidate, mobilityCountries: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full border border-gray-300 rounded px-2 py-1" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Mobility Cities (comma-separated)</div>
                              <input defaultValue={(candidate.mobilityCities||[]).join(', ')} onChange={(e)=>setEditedCandidate({...editedCandidate, mobilityCities: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full border border-gray-300 rounded px-2 py-1" />
                            </div>
                            <div className="flex justify-end">
                              <button disabled={!!savingSection.address} onClick={()=>updateCandidateSection('address', {
                                currentLocation: editedCandidate.location,
                                address: editedCandidate.address,
                                mobilityCountries: editedCandidate.mobilityCountries,
                                mobilityCities: editedCandidate.mobilityCities,
                              })} className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm disabled:opacity-50">Save</button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm">
                            <div className="text-gray-900">{candidate.location}</div>
                            <div className="text-xs text-gray-500">{[candidate.address?.street, candidate.address?.postalCode, candidate.address?.city, candidate.address?.country].filter(Boolean).join(', ')}</div>
                          </div>
                          <div className="space-y-2">
                            {candidate.mobilityCountries && candidate.mobilityCountries.length>0 && (
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Mobility Countries</div>
                                <div className="flex flex-wrap gap-2">{candidate.mobilityCountries.map((c,i)=>(<span key={i} className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs">{c}</span>))}</div>
                              </div>
                            )}
                            {candidate.mobilityCities && candidate.mobilityCities.length>0 && (
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Mobility Cities</div>
                                <div className="flex flex-wrap gap-2">{candidate.mobilityCities.map((c,i)=>(<span key={i} className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs">{c}</span>))}</div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900">Professional Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {isEditMode ? (
                        <>
                          <div>
                            <span className="text-gray-500">Headline</span>
                            <input defaultValue={candidate.professionalHeadline} onChange={(e)=>setEditedCandidate({...editedCandidate, professionalHeadline: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div>
                            <span className="text-gray-500">Current Role</span>
                            <input defaultValue={candidate.currentRole} onChange={(e)=>setEditedCandidate({...editedCandidate, currentRole: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div>
                            <span className="text-gray-500">Primary Industry</span>
                            <input defaultValue={candidate.primaryIndustry} onChange={(e)=>setEditedCandidate({...editedCandidate, primaryIndustry: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div>
                            <span className="text-gray-500">Functional Domain</span>
                            <input defaultValue={candidate.functionalDomain} onChange={(e)=>setEditedCandidate({...editedCandidate, functionalDomain: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div>
                            <span className="text-gray-500">Seniority</span>
                            <input defaultValue={candidate.seniorityLevel} onChange={(e)=>setEditedCandidate({...editedCandidate, seniorityLevel: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div>
                            <span className="text-gray-500">Available From</span>
                            <input type="date" defaultValue={candidate.availableFrom ? candidate.availableFrom.substring(0,10) : ''} onChange={(e)=>setEditedCandidate({...editedCandidate, availableFrom: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-gray-500">Expected Salary</span>
                            <input defaultValue={candidate.expectedSalary} onChange={(e)=>setEditedCandidate({...editedCandidate, expectedSalary: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <button disabled={!!savingSection.professional} onClick={()=>updateCandidateSection('professional', {
                              professionalHeadline: editedCandidate.professionalHeadline,
                              currentTitle: editedCandidate.currentRole,
                              primaryIndustry: editedCandidate.primaryIndustry,
                              functionalDomain: editedCandidate.functionalDomain,
                              seniorityLevel: editedCandidate.seniorityLevel,
                              availableFrom: editedCandidate.availableFrom ? new Date(editedCandidate.availableFrom) : null,
                              expectedSalary: editedCandidate.expectedSalary,
                            })} className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm disabled:opacity-50">Save</button>
                          </div>
                        </>
                      ) : (
                        <>
                          {candidate.professionalHeadline && (<div><span className="text-gray-500">Headline</span><div className="text-gray-900">{candidate.professionalHeadline}</div></div>)}
                          <div><span className="text-gray-500">Current Role</span><div className="text-gray-900">{candidate.currentRole}</div></div>
                          {candidate.primaryIndustry && (<div><span className="text-gray-500">Primary Industry</span><div className="text-gray-900">{candidate.primaryIndustry}</div></div>)}
                          {candidate.functionalDomain && (<div><span className="text-gray-500">Functional Domain</span><div className="text-gray-900">{candidate.functionalDomain}</div></div>)}
                          {candidate.seniorityLevel && (<div><span className="text-gray-500">Seniority</span><div className="text-gray-900">{candidate.seniorityLevel}</div></div>)}
                          <div><span className="text-gray-500">Availability</span><div className="text-gray-900">{candidate.availability}</div></div>
                          {candidate.expectedSalary && (<div><span className="text-gray-500">Expected Salary</span><div className="text-gray-900">{candidate.expectedSalary}</div></div>)}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Key Skills</h3>
                    <div className="flex flex-wrap gap-2">{(candidate.skills || []).slice(0, 20).map((s,i)=>(<span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{s}</span>))}</div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Education & Certifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {candidate.degrees && candidate.degrees.length>0 && (<div><div className="text-gray-500">Degrees</div><ul className="list-disc list-inside">{candidate.degrees.map((d,i)=>(<li key={i}>{d}</li>))}</ul></div>)}
                      {candidate.certifications && candidate.certifications.length>0 && (<div><div className="text-gray-500">Certifications</div><ul className="list-disc list-inside">{candidate.certifications.map((c,i)=>(<li key={i}>{c}</li>))}</ul></div>)}
                    </div>
                  </div>

                  {/* Professional Experience */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                      Professional Experience
                    </h3>
                    {/* Summary */}
                    {candidate.experience && (
                      <div className="text-sm text-gray-700 mb-3">{candidate.experience}</div>
                    )}
                    {/* Experiences 1-N (latest first) */}
                    <div className="space-y-3">
                      {(candidate.workExperience || []).slice().reverse().map((job, idx) => (
                        <div key={idx} className="border-l-2 border-primary-200 pl-3">
                          <div className="text-sm font-medium text-gray-900">{job.role} • {job.company}</div>
                          <div className="text-xs text-gray-500 mb-1">{job.duration}</div>
                          {job.description && (
                            <div className="text-sm text-gray-700">{job.description}</div>
                          )}
                        </div>
                      ))}
                      {(!candidate.workExperience || candidate.workExperience.length===0) && (
                        <div className="text-sm text-gray-500">No experience listed</div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Right: Preview (1/2) */}
                <div id="preview-col" className="space-y-4 xl:col-span-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">Preview</h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50 border-b flex items-center gap-2">
                        <button
                          onClick={() => setPreviewTab('cv')}
                          className={`text-sm px-2 py-1 rounded-md border ${previewTab==='cv' ? 'bg-white text-gray-900 border-gray-300' : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'}`}
                        >Original CV</button>
                        <button
                          onClick={() => setPreviewTab('competence')}
                          className={`text-sm px-2 py-1 rounded-md border ${previewTab==='competence' ? 'bg-white text-gray-900 border-gray-300' : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'}`}
                        >Competence File</button>
                        <button
                          onClick={() => setPreviewTab('other')}
                          className={`text-sm px-2 py-1 rounded-md border ${previewTab==='other' ? 'bg-white text-gray-900 border-gray-300' : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'}`}
                        >Other</button>
                      </div>
                      <div>
                        {previewTab === 'cv' && (
                          candidate.originalCvUrl ? (
                            <PdfSinglePageViewer url={candidate.originalCvUrl} />
                          ) : (
                            <div className="p-6 text-sm text-gray-500">Original CV is not available.</div>
                          )
                        )}
                        {previewTab === 'competence' && (
                          candidate.competenceFileUrl ? (
                            <PdfSinglePageViewer url={candidate.competenceFileUrl} />
                          ) : (
                            <div className="p-6 text-sm text-gray-500">Competence File is not available.</div>
                          )
                        )}
                        {previewTab === 'other' && (
                          <div className="p-6 text-sm text-gray-500">No other documents available.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="p-6">
                <CandidateFieldDisplay 
                  candidate={candidate} 
                  isEditMode={isEditMode}
                  collapsible={false}
                  onFieldChange={(field, value) => {
                    if (isEditMode) {
                      setEditedCandidate({...editedCandidate, [field]: value});
                    }
                  }}
                />
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="p-6">
                <CandidateFieldDisplay 
                  candidate={candidate} 
                  isEditMode={isEditMode}
                  collapsible={false}
                  onFieldChange={(field, value) => {
                    if (isEditMode) {
                      setEditedCandidate({...editedCandidate, [field]: value});
                    }
                  }}
                />
              </div>
            )}

            {activeTab === 'communications' && (
              <div className="p-4 space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
                      Communication History
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm" placeholder="Search communications..." />
                      </div>
                      <select className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm">
                        <option>Email</option>
                        <option>LinkedIn</option>
                        <option>WhatsApp</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded p-3 flex items-start gap-3">
                      <div className="p-1.5 bg-blue-500 rounded"><Mail className="h-3 w-3 text-white" /></div>
                      <div className="flex-1 text-sm">
                        <div className="flex justify-between text-gray-600"><span>Outbound • Email</span><span>Today</span></div>
                        <div className="text-gray-900">Subject: Intro and next steps</div>
                        <div className="text-gray-700">Hi Stephane, thanks for your time earlier...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-400" />
                  Activity Timeline
                </h3>
                <div className="space-y-6">
                  {candidate.timeline.map((item, index) => {
                    const TimelineIcon = getTimelineIcon(item.type);
                    const colorClass = getTimelineColor(item.type);
                    
                    return (
                      <div key={index} className="flex items-start space-x-4">
                        <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <TimelineIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-900">{item.action}</p>
                          {item.details && (
                            <p className="text-sm text-gray-600 mt-1">{item.details}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2 font-medium">{item.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-gray-400" />
                  Documents & Files
                </h3>
                
                {candidate.originalCvUrl ? (
                  <div className="space-y-4">
                    {/* CV File */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Original CV</h4>
                            <p className="text-sm text-gray-500">{candidate.originalCvFileName || 'CV Document'}</p>
                            {candidate.originalCvUploadedAt && (
                              <p className="text-xs text-gray-400">
                                Uploaded {new Date(candidate.originalCvUploadedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(candidate.originalCvUrl, '_blank')}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              if (!candidate.originalCvUrl) return;
                              const link = document.createElement('a');
                              link.href = candidate.originalCvUrl;
                              link.download = candidate.originalCvFileName || 'cv.pdf';
                              link.click();
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
                    <p className="text-gray-500">This candidate doesn't have any documents uploaded yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'assign' && (
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-gray-400" />
                    Assign to Jobs
                  </h3>
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Job Assignment</h3>
                    <p className="text-gray-500">Assign this candidate to specific jobs or talent pools.</p>
                  </div>
                </div>
              </div>
            )}

            {/* End of tab content */}
          </div>
        </div>
      </div>
    </div>
  );
}
