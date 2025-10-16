'use client';

import { useEffect, useRef, useState } from 'react';
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
  MessageCircle,
  Reply,
  ArrowRight,
  Filter,
  Search,
  Eye,
  Paperclip
} from 'lucide-react';
import { CreateCompetenceFileModal } from '@/components/competence-files/CreateCompetenceFileModal';
import { AddToJobModal } from './AddToJobModal';
import React from 'react';

interface CommunicationMessage {
  id: string;
  type: 'email' | 'linkedin' | 'whatsapp' | 'phone' | 'sms';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  timestamp: string;
  sender: string;
  recipient: string;
  status: 'sent' | 'delivered' | 'read' | 'replied';
  attachments?: Array<{
    name: string;
    type: string;
    size: string;
  }>;
  threadId?: string;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentLocation: string;
  stage: string;
  rating: number;
  avatar?: string;
  lastInteraction: string;
  availability: string;
  source: string;
  skills: string[];
  experience: string;
  currentRole: string;
  notes: string;
  resumeUrl?: string;
  summary?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  expectedSalary?: string;
  noticePeriod?: string;
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
  tags: string[];
  timeline: Array<{
    date: string;
    action: string;
    type: string;
    details?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  workHistory?: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface CandidateDrawerProps {
  candidate: Candidate | null;
  stages: PipelineStage[];
  onClose: () => void;
  onStageChange: (candidateId: string, newStage: string) => void;
  onRatingChange: (candidateId: string, newRating: number) => void;
  onNotesUpdate: (candidateId: string, notes: string) => void;
}

export function CandidateDrawer({ 
  candidate, 
  stages, 
  onClose, 
  onStageChange, 
  onRatingChange, 
  onNotesUpdate 
}: CandidateDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isCompetenceFileModalOpen, setIsCompetenceFileModalOpen] = useState(false);
  const [isAddToJobModalOpen, setIsAddToJobModalOpen] = useState(false);
  const [communicationFilter, setCommunicationFilter] = useState<'email' | 'linkedin' | 'whatsapp'>('email');
  const [communicationSearch, setCommunicationSearch] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeText, setComposeText] = useState('');
  const composeInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Inline editing states for Overview sections
  const [editingSummary, setEditingSummary] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState<string>('');

  const [editingPersonal, setEditingPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personal, setPersonal] = useState<{
    email: string;
    phone: string;
    dateOfBirth?: string;
    nationality?: string;
    timezone?: string;
    workPermitType?: string;
  }>({ email: '', phone: '' });

  const [editingAddress, setEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [addr, setAddr] = useState<{ street?: string; city?: string; postalCode?: string; country?: string }>({});
  const [mobilityCountries, setMobilityCountries] = useState<string[]>([]);
  const [mobilityCities, setMobilityCities] = useState<string[]>([]);

  const [editingProfessional, setEditingProfessional] = useState(false);
  const [savingProfessional, setSavingProfessional] = useState(false);
  const [professional, setProfessional] = useState<{
    professionalHeadline?: string;
    currentRole: string;
    primaryIndustry?: string;
    functionalDomain?: string;
    seniorityLevel?: string;
    availability?: string;
    expectedSalary?: string;
    noticePeriod?: string;
    linkedinUrl?: string;
  }>({ currentRole: '' });

  useEffect(() => {
    if (!candidate) return;
    // Seed locals from candidate when opening/when candidate changes
    setSummaryText(candidate.summary || '');
    setPersonal({
      email: candidate.email,
      phone: candidate.phone,
      dateOfBirth: candidate.dateOfBirth,
      nationality: candidate.nationality,
      timezone: candidate.timezone,
      workPermitType: candidate.workPermitType,
    });
    setCurrentLocation(candidate.currentLocation);
    setAddr(candidate.address || {});
    setMobilityCountries(candidate.mobilityCountries || []);
    setMobilityCities(candidate.mobilityCities || []);
    setProfessional({
      professionalHeadline: candidate.professionalHeadline,
      currentRole: candidate.currentRole,
      primaryIndustry: candidate.primaryIndustry,
      functionalDomain: candidate.functionalDomain,
      seniorityLevel: candidate.seniorityLevel,
      availability: candidate.availability,
      expectedSalary: candidate.expectedSalary,
      noticePeriod: candidate.noticePeriod,
      linkedinUrl: candidate.linkedinUrl,
    });
  }, [candidate]);

  const patchCandidate = async (payload: Record<string, any>) => {
    try {
      const targetId = (candidate as any)?.databaseId || candidate?.id;
      if (!targetId) {
        alert('No candidate selected');
        return false;
      }
      const res = await fetch(`/api/candidates/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || `Failed to update candidate`);
      }
      return true;
    } catch (err) {
      console.error('PATCH /api/candidates failed', err);
      alert('Failed to save changes');
      return false;
    }
  };

  // Communications state must be declared unconditionally (do not depend on candidate presence)
  const storageKey = `candidateComms:${candidate?.id ?? 'none'}`;
  const [communications, setCommunications] = useState<CommunicationMessage[]>([]);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCommunications(parsed);
      } else {
        setCommunications([]);
      }
    } catch {
      setCommunications([]);
    }
  }, [storageKey]);
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(communications)); } catch {}
  }, [communications, storageKey]);

  if (!candidate) return null;

  // Convert candidate data for competence file modal
  const competenceFileCandidate = candidate ? {
    id: candidate.id,
    fullName: `${candidate.firstName} ${candidate.lastName}`,
    currentTitle: candidate.currentRole,
    email: candidate.email,
    phone: candidate.phone,
    location: candidate.currentLocation,
    yearsOfExperience: parseInt(candidate.experience) || 5,
    skills: candidate.skills,
    certifications: [],
    experience: candidate.workHistory?.map(job => ({
      company: job.company,
      title: job.role,
      startDate: '2020-01', // Mock data
      endDate: job.duration.includes('Present') ? 'Present' : '2023-12',
      responsibilities: job.description
    })) || [],
    education: candidate.education?.map(edu => edu.degree) || [],
    languages: ['English (Professional)', 'German (Intermediate)'], // Mock data
    summary: candidate.notes || `Experienced ${candidate.currentRole} with strong technical skills`
  } : null;

  // Convert candidate data for Add to Job modal
  const addToJobCandidate = candidate ? {
    id: candidate.id,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    currentRole: candidate.currentRole,
    skills: candidate.skills
  } : null;

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

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'linkedin': return LinkIcon;
      case 'whatsapp': return MessageSquare;
      case 'phone': return Phone;
      case 'sms': return MessageCircle;
      default: return MessageSquare;
    }
  };

  const getCommunicationColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-500';
      case 'linkedin': return 'bg-blue-700';
      case 'whatsapp': return 'bg-green-500';
      case 'phone': return 'bg-purple-500';
      case 'sms': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return Send;
      case 'delivered': return CheckCircle2;
      case 'read': return Eye;
      case 'replied': return Reply;
      default: return Clock;
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const updatedNotes = candidate.notes ? `${candidate.notes}\n\n${newNote}` : newNote;
      onNotesUpdate(candidate.id, updatedNotes);
      setNewNote('');
    }
  };

  const handleCreateCompetenceFile = (fileData: any) => {
    console.log('Competence file created:', fileData);
    // Handle competence file creation
    setIsCompetenceFileModalOpen(false);
  };

  const handleAddToJob = async (jobId: string, candidateId: string) => {
    console.log('Adding candidate to job:', { jobId, candidateId });
    // Handle adding candidate to job
    // This would typically call an API to add the candidate to the job pipeline
    
    // Mock success
    alert(`Successfully added ${candidate.firstName} ${candidate.lastName} to the selected job!`);
  };


  const filteredCommunications = communications.filter(comm => {
    const matchesFilter = comm.type === communicationFilter;
    const matchesSearch = communicationSearch === '' || 
      comm.content.toLowerCase().includes(communicationSearch.toLowerCase()) ||
      comm.subject?.toLowerCase().includes(communicationSearch.toLowerCase()) ||
      comm.sender.toLowerCase().includes(communicationSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Compose send handler (UI-only for now, integration added later)
  const handleSendMessage = () => {
    const channel = communicationFilter;
    if (!composeText.trim()) return;
    const now = new Date();
    const msg: CommunicationMessage = {
      id: `${now.getTime()}`,
      type: channel,
      direction: 'outbound',
      subject: channel === 'email' && composeSubject.trim() ? composeSubject.trim() : undefined,
      content: composeText.trim(),
      timestamp: now.toISOString(),
      sender: 'recruiter@emineon.com',
      recipient: channel === 'email' ? candidate.email : `${candidate.firstName} ${candidate.lastName}`,
      status: 'sent'
    };
    setCommunications(prev => [msg, ...prev]);
    setComposeText('');
    if (channel === 'email') setComposeSubject('');
    // Focus back to input
    setTimeout(() => composeInputRef.current?.focus(), 0);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'communications', label: 'Communications', icon: MessageCircle },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'documents', label: 'Documents', icon: Download },
    { id: 'notes', label: 'Notes', icon: Edit3 }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-white shadow-large rounded-l-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-tl-2xl">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#0A2F5A]/10 rounded-full flex items-center justify-center text-[#0A2F5A] font-bold text-xl shadow-medium">
                {candidate.firstName[0]}{candidate.lastName[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h2>
                <p className="text-gray-600 font-medium">{candidate.currentRole}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => onRatingChange(candidate.id, i + 1)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-4 w-4 cursor-pointer transition-colors ${
                            i < candidate.rating ? 'text-yellow-500 fill-current' : 'text-gray-400 hover:text-yellow-500'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-700">({candidate.rating}/5)</span>
                  </div>
                  <select
                    value={candidate.stage}
                    onChange={(e) => onStageChange(candidate.id, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2F5A] focus:border-transparent text-sm bg-white text-gray-900"
                  >
                    {stages.map(stage => (
                      <option key={stage.id} value={stage.id} className="text-gray-900">{stage.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <button 
                onClick={() => setIsCompetenceFileModalOpen(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Competence File
              </button>
              <button 
                onClick={() => setIsAddToJobModalOpen(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add to Job
              </button>
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-accent-600 to-accent-700 text-white rounded-xl hover:from-accent-700 hover:to-accent-800 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5">
                <Send className="h-4 w-4 mr-2" />
                Submit to Client
              </button>
              <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule Interview
              </button>
              <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </button>
              <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 px-6 border-b border-gray-200 bg-white">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-neutral-50 to-neutral-100">
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6">
                {/* Professional Summary (top) */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Professional Summary</h3>
                    <button
                      className="p-1.5 rounded hover:bg-gray-100"
                      onClick={() => setEditingSummary(!editingSummary)}
                      title={editingSummary ? 'Cancel' : 'Edit'}
                    >
                      {editingSummary ? <X className="h-4 w-4 text-gray-600" /> : <Edit3 className="h-4 w-4 text-gray-600" />}
                    </button>
                  </div>
                  {editingSummary ? (
                    <div className="space-y-3">
                      <textarea
                        value={summaryText}
                        onChange={(e)=>setSummaryText(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        rows={4}
                      />
                      <div className="flex justify-end">
                        <button
                          disabled={savingSummary}
                          onClick={async ()=>{
                            setSavingSummary(true);
                            const ok = await patchCandidate({ summary: summaryText });
                            setSavingSummary(false);
                            if (ok) setEditingSummary(false);
                          }}
                          className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm disabled:opacity-50"
                        >Save</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{summaryText || '—'}</p>
                  )}
                </div>
                {/* Personal Information */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <button className="p-1.5 rounded hover:bg-gray-100" onClick={()=>setEditingPersonal(!editingPersonal)} title={editingPersonal ? 'Cancel' : 'Edit'}>
                      {editingPersonal ? <X className="h-4 w-4 text-gray-600" /> : <Edit3 className="h-4 w-4 text-gray-600" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {editingPersonal ? (
                      <>
                        <div>
                          <span className="text-gray-500">Email</span>
                          <input value={personal.email} onChange={(e)=>setPersonal({...personal, email: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                        <div>
                          <span className="text-gray-500">Phone</span>
                          <input value={personal.phone} onChange={(e)=>setPersonal({...personal, phone: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                        <div>
                          <span className="text-gray-500">Date of Birth</span>
                          <input type="date" value={personal.dateOfBirth ? personal.dateOfBirth.substring(0,10) : ''} onChange={(e)=>setPersonal({...personal, dateOfBirth: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                        <div>
                          <span className="text-gray-500">Nationality</span>
                          <input value={personal.nationality || ''} onChange={(e)=>setPersonal({...personal, nationality: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                        <div>
                          <span className="text-gray-500">Timezone</span>
                          <input value={personal.timezone || ''} onChange={(e)=>setPersonal({...personal, timezone: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" placeholder="e.g. Europe/Zurich" />
                        </div>
                        <div>
                          <span className="text-gray-500">Work Permit</span>
                          <input value={personal.workPermitType || ''} onChange={(e)=>setPersonal({...personal, workPermitType: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <button
                            disabled={savingPersonal}
                            onClick={async ()=>{
                              setSavingPersonal(true);
                              const ok = await patchCandidate({
                                email: personal.email,
                                phone: personal.phone,
                                dateOfBirth: personal.dateOfBirth ? new Date(personal.dateOfBirth) : null,
                                nationality: personal.nationality,
                                timezone: personal.timezone,
                                workPermitType: personal.workPermitType,
                              });
                              setSavingPersonal(false);
                              if (ok) setEditingPersonal(false);
                            }}
                            className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm disabled:opacity-50"
                          >Save</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div><span className="text-gray-500">Email</span><div className="text-gray-900">{personal.email}</div></div>
                        <div><span className="text-gray-500">Phone</span><div className="text-gray-900">{personal.phone}</div></div>
                        {personal.dateOfBirth && (<div><span className="text-gray-500">Date of Birth</span><div className="text-gray-900">{personal.dateOfBirth}</div></div>)}
                        {typeof candidate.age === 'number' && (<div><span className="text-gray-500">Age</span><div className="text-gray-900">{candidate.age}</div></div>)}
                        {personal.nationality && (<div><span className="text-gray-500">Nationality</span><div className="text-gray-900">{personal.nationality}</div></div>)}
                        {personal.timezone && (<div><span className="text-gray-500">Timezone</span><div className="text-gray-900">{personal.timezone}</div></div>)}
                        {personal.workPermitType && (<div><span className="text-gray-500">Work Permit</span><div className="text-gray-900">{personal.workPermitType}</div></div>)}
                      </>
                    )}
                  </div>
                </div>
                {/* Address & Mobility */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-primary-600" />
                      Address & Mobility
                    </h3>
                    <button className="p-1.5 rounded hover:bg-gray-100" onClick={()=>setEditingAddress(!editingAddress)} title={editingAddress ? 'Cancel' : 'Edit'}>
                      {editingAddress ? <X className="h-4 w-4 text-gray-600" /> : <Edit3 className="h-4 w-4 text-gray-600" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editingAddress ? (
                      <>
                        <div className="space-y-2 text-sm">
                          <div className="text-gray-500">Location</div>
                          <input value={currentLocation} onChange={(e)=>setCurrentLocation(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <input placeholder="Street" value={addr.street || ''} onChange={(e)=>setAddr({...addr, street: e.target.value})} className="border border-gray-300 rounded px-2 py-1" />
                            <input placeholder="Postal Code" value={addr.postalCode || ''} onChange={(e)=>setAddr({...addr, postalCode: e.target.value})} className="border border-gray-300 rounded px-2 py-1" />
                            <input placeholder="City" value={addr.city || ''} onChange={(e)=>setAddr({...addr, city: e.target.value})} className="border border-gray-300 rounded px-2 py-1" />
                            <input placeholder="Country" value={addr.country || ''} onChange={(e)=>setAddr({...addr, country: e.target.value})} className="border border-gray-300 rounded px-2 py-1" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Mobility Countries (comma-separated)</div>
                            <input value={mobilityCountries.join(', ')} onChange={(e)=>setMobilityCountries(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} className="w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Mobility Cities (comma-separated)</div>
                            <input value={mobilityCities.join(', ')} onChange={(e)=>setMobilityCities(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} className="w-full border border-gray-300 rounded px-2 py-1" />
                          </div>
                          <div className="flex justify-end">
                            <button
                              disabled={savingAddress}
                              onClick={async ()=>{
                                setSavingAddress(true);
                                const ok = await patchCandidate({
                                  currentLocation,
                                  address: addr,
                                  mobilityCountries,
                                  mobilityCities,
                                });
                                setSavingAddress(false);
                                if (ok) setEditingAddress(false);
                              }}
                              className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm disabled:opacity-50"
                            >Save</button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 text-sm">
                          <div className="text-gray-900">{currentLocation || '—'}</div>
                          <div className="text-xs text-gray-500">{[addr.street, addr.postalCode, addr.city, addr.country].filter(Boolean).join(', ')}</div>
                        </div>
                        <div className="space-y-2">
                          {mobilityCountries.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Mobility Countries</div>
                              <div className="flex flex-wrap gap-2">
                                {mobilityCountries.map((c, i) => (
                                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{c}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {mobilityCities.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Mobility Cities</div>
                              <div className="flex flex-wrap gap-2">
                                {mobilityCities.map((c, i) => (
                                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{c}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Professional Details */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-primary-600" />
                      Professional Details
                    </h3>
                    <button className="p-1.5 rounded hover:bg-gray-100" onClick={()=>setEditingProfessional(!editingProfessional)} title={editingProfessional ? 'Cancel' : 'Edit'}>
                      {editingProfessional ? <X className="h-4 w-4 text-gray-600" /> : <Edit3 className="h-4 w-4 text-gray-600" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {editingProfessional ? (
                      <>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Professional Headline</label>
                            <input value={professional.professionalHeadline || ''} onChange={(e)=>setProfessional({...professional, professionalHeadline: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Current Role</label>
                            <input value={professional.currentRole} onChange={(e)=>setProfessional({...professional, currentRole: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Seniority Level</label>
                            <input value={professional.seniorityLevel || ''} onChange={(e)=>setProfessional({...professional, seniorityLevel: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Functional Domain</label>
                            <input value={professional.functionalDomain || ''} onChange={(e)=>setProfessional({...professional, functionalDomain: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Primary Industry</label>
                            <input value={professional.primaryIndustry || ''} onChange={(e)=>setProfessional({...professional, primaryIndustry: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Availability</label>
                            <input value={professional.availability || ''} onChange={(e)=>setProfessional({...professional, availability: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Expected Salary</label>
                            <input value={professional.expectedSalary || ''} onChange={(e)=>setProfessional({...professional, expectedSalary: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Notice Period</label>
                            <input value={professional.noticePeriod || ''} onChange={(e)=>setProfessional({...professional, noticePeriod: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">LinkedIn URL</label>
                            <input value={professional.linkedinUrl || ''} onChange={(e)=>setProfessional({...professional, linkedinUrl: e.target.value})} className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Last Interaction</label>
                            <p className="text-sm text-gray-600">{candidate.lastInteraction}</p>
                          </div>
                          <div className="flex justify-end">
                            <button
                              disabled={savingProfessional}
                              onClick={async ()=>{
                                setSavingProfessional(true);
                                const ok = await patchCandidate({
                                  professionalHeadline: professional.professionalHeadline,
                                  currentTitle: professional.currentRole,
                                  primaryIndustry: professional.primaryIndustry,
                                  functionalDomain: professional.functionalDomain,
                                  seniorityLevel: professional.seniorityLevel,
                                  availability: professional.availability,
                                  expectedSalary: professional.expectedSalary,
                                  noticePeriod: professional.noticePeriod,
                                  linkedinUrl: professional.linkedinUrl,
                                });
                                setSavingProfessional(false);
                                if (ok) setEditingProfessional(false);
                              }}
                              className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm disabled:opacity-50"
                            >Save</button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {professional.professionalHeadline && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Professional Headline</label>
                              <p className="text-sm text-gray-600">{professional.professionalHeadline}</p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-700">Experience</label>
                            <p className="text-sm text-gray-600">{candidate.experience}</p>
                          </div>
                          {professional.seniorityLevel && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Seniority Level</label>
                              <p className="text-sm text-gray-600">{professional.seniorityLevel}</p>
                            </div>
                          )}
                          {professional.functionalDomain && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Functional Domain</label>
                              <p className="text-sm text-gray-600">{professional.functionalDomain}</p>
                            </div>
                          )}
                          {professional.primaryIndustry && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Primary Industry</label>
                              <p className="text-sm text-gray-600">{professional.primaryIndustry}</p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-700">Availability</label>
                            <p className="text-sm text-gray-600">{professional.availability || '—'}</p>
                          </div>
                          {professional.expectedSalary && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Expected Salary</label>
                              <p className="text-sm text-gray-600">{professional.expectedSalary}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {professional.noticePeriod && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Notice Period</label>
                              <p className="text-sm text-gray-600">{professional.noticePeriod}</p>
                            </div>
                          )}
                          {professional.linkedinUrl && (
                            <div className="flex items-center text-sm">
                              <LinkIcon className="h-4 w-4 mr-3 text-gray-400" />
                              <a href={professional.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 flex items-center font-medium">
                                LinkedIn Profile
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-700">Last Interaction</label>
                            <p className="text-sm text-gray-600">{candidate.lastInteraction}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Work Preferences - omitted in overview to mirror Review & Edit layout */}

                {/* Skills & Technologies */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary-600" />
                    Skills & Technologies
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Technical Skills</label>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-soft"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Extended categories */}
                    {candidate.programmingLanguages && candidate.programmingLanguages.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Programming Languages</label>
                        <div className="flex flex-wrap gap-2">
                          {candidate.programmingLanguages.map((s, i)=>(<span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{s}</span>))}
                        </div>
                      </div>
                    )}
                    {candidate.frameworks && candidate.frameworks.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Frameworks & Libraries</label>
                        <div className="flex flex-wrap gap-2">
                          {candidate.frameworks.map((s, i)=>(<span key={i} className="px-2 py-1 bg-[#0A2F5A]/10 text-[#0A2F5A] rounded text-xs">{s}</span>))}
                        </div>
                      </div>
                    )}
                    {candidate.toolsAndPlatforms && candidate.toolsAndPlatforms.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Tools & Platforms</label>
                        <div className="flex flex-wrap gap-2">
                          {candidate.toolsAndPlatforms.map((s, i)=>(<span key={i} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">{s}</span>))}
                        </div>
                      </div>
                    )}
                    {candidate.databases && candidate.databases.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Databases</label><div className="flex flex-wrap gap-2">{candidate.databases.map((s,i)=>(<span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.cloudPlatforms && candidate.cloudPlatforms.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Cloud Platforms</label><div className="flex flex-wrap gap-2">{candidate.cloudPlatforms.map((s,i)=>(<span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.devOpsTools && candidate.devOpsTools.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">DevOps Tools</label><div className="flex flex-wrap gap-2">{candidate.devOpsTools.map((s,i)=>(<span key={i} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.testingTools && candidate.testingTools.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Testing Tools</label><div className="flex flex-wrap gap-2">{candidate.testingTools.map((s,i)=>(<span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.dataEngineeringTools && candidate.dataEngineeringTools.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Data Engineering</label><div className="flex flex-wrap gap-2">{candidate.dataEngineeringTools.map((s,i)=>(<span key={i} className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.mlFrameworks && candidate.mlFrameworks.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">ML / AI Frameworks</label><div className="flex flex-wrap gap-2">{candidate.mlFrameworks.map((s,i)=>(<span key={i} className="px-2 py-1 bg-rose-100 text-rose-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.analyticsTools && candidate.analyticsTools.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Analytics Tools</label><div className="flex flex-wrap gap-2">{candidate.analyticsTools.map((s,i)=>(<span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.mobileTechnologies && candidate.mobileTechnologies.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Mobile Tech</label><div className="flex flex-wrap gap-2">{candidate.mobileTechnologies.map((s,i)=>(<span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.webTechnologies && candidate.webTechnologies.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Web</label><div className="flex flex-wrap gap-2">{candidate.webTechnologies.map((s,i)=>(<span key={i} className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.securityTools && candidate.securityTools.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Security</label><div className="flex flex-wrap gap-2">{candidate.securityTools.map((s,i)=>(<span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.monitoringTools && candidate.monitoringTools.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Monitoring & Observability</label><div className="flex flex-wrap gap-2">{candidate.monitoringTools.map((s,i)=>(<span key={i} className="px-2 py-1 bg-lime-100 text-lime-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.messagingSystems && candidate.messagingSystems.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Messaging / Streaming</label><div className="flex flex-wrap gap-2">{candidate.messagingSystems.map((s,i)=>(<span key={i} className="px-2 py-1 bg-fuchsia-100 text-fuchsia-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {(candidate.cmsPlatforms && candidate.cmsPlatforms.length>0) && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Enterprise Solutions — CMS</label><div className="flex flex-wrap gap-2">{candidate.cmsPlatforms.map((s,i)=>(<span key={i} className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {(candidate.crmErp && candidate.crmErp.length>0) && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Enterprise Solutions — CRM / ERP</label><div className="flex flex-wrap gap-2">{candidate.crmErp.map((s,i)=>(<span key={i} className="px-2 py-1 bg-stone-100 text-stone-800 rounded text-xs">{s}</span>))}</div></div>)}
                    {candidate.methodologies && candidate.methodologies.length>0 && (<div><label className="text-sm font-medium text-gray-700 mb-2 block">Methodologies</label><div className="flex flex-wrap gap-2">{candidate.methodologies.map((s,i)=>(<span key={i} className="px-2 py-1 bg-sky-100 text-sky-800 rounded text-xs">{s}</span>))}</div></div>)}

                    {candidate.tags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {candidate.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-soft"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work History */}
                {candidate.workHistory && candidate.workHistory.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-primary-600" />
                      Work History
                    </h3>
                    <div className="space-y-4">
                      {candidate.workHistory.map((job, index) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-4">
                          <h4 className="font-medium text-gray-900">{job.role}</h4>
                          <p className="text-sm text-gray-600">{job.company} • {job.duration}</p>
                          <p className="text-sm text-gray-500 mt-1">{job.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {candidate.education && candidate.education.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2 text-primary-600" />
                      Education
                    </h3>
                    <div className="space-y-3">
                      {candidate.education.map((edu, index) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-4">
                          <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                          <p className="text-sm text-gray-600">{edu.institution} • {edu.year}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'communications' && (
              <div className="p-6 space-y-6">
                {/* Communication Filters and Search */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MessageCircle className="h-5 w-5 mr-2 text-primary-600" />
                      Communication History
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search conversations..."
                          value={communicationSearch}
                          onChange={(e) => setCommunicationSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm w-full sm:w-64"
                        />
                      </div>
                      
                      {/* Filter */}
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          value={communicationFilter}
                          onChange={(e) => setCommunicationFilter(e.target.value as any)}
                          className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm appearance-none bg-white"
                        >
                          <option value="email">Emails</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="whatsapp">WhatsApp</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Communication Stats - Smaller version */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { type: 'email', count: communications.filter((c: CommunicationMessage) => c.type === 'email').length, color: 'bg-blue-500', icon: Mail },
                      { type: 'linkedin', count: communications.filter((c: CommunicationMessage) => c.type === 'linkedin').length, color: 'bg-blue-700', icon: LinkIcon },
                      { type: 'whatsapp', count: communications.filter((c: CommunicationMessage) => c.type === 'whatsapp').length, color: 'bg-green-500', icon: MessageSquare },
                    ].map((stat: any) => {
                      const IconComponent = stat.icon;
                      return (
                        <button
                          key={stat.type}
                          onClick={() => setCommunicationFilter(stat.type as any)}
                          className={`text-center p-2 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg hover:shadow-md transition-all duration-200 ${
                            communicationFilter === stat.type ? 'ring-2 ring-primary-500' : ''
                          }`}
                        >
                          <div className={`w-6 h-6 ${stat.color} rounded-md flex items-center justify-center mx-auto mb-1`}>
                            <IconComponent className="h-3 w-3 text-white" />
                          </div>
                          <div className="text-sm font-bold text-gray-900">{stat.count}</div>
                          <div className="text-xs text-gray-600 capitalize">{stat.type}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Communication Timeline + In-drawer chat */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft">
                  <div className="space-y-3">
                    {filteredCommunications.length === 0 ? (
                      <div className="text-center py-6">
                        <MessageCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No communications found matching your criteria.</p>
                      </div>
                    ) : (
                      filteredCommunications
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((comm) => {
                          const IconComponent = getCommunicationIcon(comm.type);
                          const StatusIconComponent = getStatusIcon(comm.status);
                          const colorClass = getCommunicationColor(comm.type);
                          
                          return (
                            <div key={comm.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200">
                              <div className="flex items-start space-x-3">
                                {/* Channel Icon */}
                                <div className={`p-1.5 rounded-md ${colorClass} shadow-soft flex-shrink-0`}>
                                  <IconComponent className="h-3 w-3 text-white" />
                                </div>
                                
                                {/* Message Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        comm.direction === 'inbound' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {comm.direction === 'inbound' ? '← Received' : '→ Sent'}
                                      </span>
                                      <span className="text-xs text-gray-500 capitalize">{comm.type}</span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-1">
                                      <StatusIconComponent className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">{new Date(comm.timestamp).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  
                                  {comm.subject && (
                                    <h4 className="font-medium text-gray-900 text-sm mb-1">{comm.subject}</h4>
                                  )}
                                  
                                  <p className="text-gray-700 text-sm mb-2 line-clamp-2">{comm.content}</p>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                      <span className="font-medium">From:</span> {comm.sender} 
                                      <span className="mx-1">•</span>
                                      <span className="font-medium">To:</span> {comm.recipient}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      {comm.attachments && comm.attachments.length > 0 && (
                                        <span className="inline-flex items-center text-xs text-gray-500">
                                          <Paperclip className="h-3 w-3 mr-1" />
                                          {comm.attachments.length}
                                        </span>
                                      )}
                                      
                                      <button className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center">
                                        Reply
                                        <ArrowRight className="h-3 w-3 ml-1" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* In-drawer composer */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Compose ({communicationFilter})</h4>
                  { communicationFilter === 'email' && (
                    <input
                      value={composeSubject}
                      onChange={(e)=>setComposeSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  )}
                  <textarea
                    ref={composeInputRef}
                    value={composeText}
                    onChange={(e)=>setComposeText(e.target.value)}
                    rows={3}
                    placeholder={`Write a ${communicationFilter}…`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-500">To: {communicationFilter === 'email' ? (candidate.email || `${candidate.firstName} ${candidate.lastName}`) : `${candidate.firstName} ${candidate.lastName}`}</div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!composeText.trim()}
                      className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
                    >
                      <Send className="h-3 w-3 mr-1" /> Send
                    </button>
                  </div>
                </div>

                {/* Quick Actions for Communication */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-soft">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button 
                      className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                    >
                      <Mail className="h-3 w-3 mr-2" />
                      Send Email
                    </button>
                    
                    <button 
                      onClick={() => candidate.linkedinUrl && window.open(candidate.linkedinUrl, '_blank')}
                      className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                    >
                      <LinkIcon className="h-3 w-3 mr-2" />
                      LinkedIn
                    </button>
                    
                    <button 
                      onClick={() => window.open(`https://wa.me/${candidate.phone.replace(/\D/g, '')}`, '_blank')}
                      className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                    >
                      <MessageSquare className="h-3 w-3 mr-2" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="p-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary-600" />
                    Activity Timeline
                  </h3>
                  <div className="space-y-4">
                    {candidate.timeline.map((item, index) => {
                      const TimelineIcon = getTimelineIcon(item.type);
                      const colorClass = getTimelineColor(item.type);
                      
                      return (
                        <div key={index} className="flex items-start space-x-4">
                          <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <TimelineIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{item.action}</p>
                            {item.details && (
                              <p className="text-sm text-gray-500 mt-1">{item.details}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="p-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Download className="h-5 w-5 mr-2 text-primary-600" />
                    Documents & Files
                  </h3>
                  <div className="space-y-4">
                    {candidate.resumeUrl && (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-red-500" />
                          <div>
                            <p className="font-medium text-gray-900">Resume</p>
                            <p className="text-sm text-gray-500">From candidate profile</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <a href={candidate.resumeUrl} download className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">No additional documents uploaded</p>
                      <label className="mt-2 inline-flex items-center px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const form = new FormData();
                            form.append('file', file);
                            form.append('candidateId', candidate.id);
                            form.append('metadata', JSON.stringify({ category: 'documents' }));
                            try {
                              const res = await fetch('/api/files/upload', { method: 'POST', body: form });
                              const json = await res.json();
                              if (!res.ok || !json?.success) throw new Error(json?.error || 'Upload failed');
                              // Append to documents list in UI
                              setCommunications((prev)=>prev); // no-op to keep React happy
                              alert('Document uploaded');
                            } catch (err) {
                              console.error(err);
                              alert('Failed to upload document');
                            } finally {
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        Upload document
                      </label>
                      {/* List recent candidate documents */}
                      <div className="mt-4 text-left max-h-40 overflow-y-auto">
                        <CandidateDocuments candidateId={candidate.id} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="p-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Edit3 className="h-5 w-5 mr-2 text-primary-600" />
                    Notes & Comments
                  </h3>
                  
                  {/* Existing Notes */}
                  {candidate.notes && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Previous Notes</h4>
                        <button
                          onClick={() => setIsEditingNotes(!isEditingNotes)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {isEditingNotes ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                      {isEditingNotes ? (
                        <div className="space-y-3">
                          <textarea
                            defaultValue={candidate.notes}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            rows={4}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                // Handle save
                                setIsEditingNotes(false);
                              }}
                              className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setIsEditingNotes(false)}
                              className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{candidate.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Add New Note */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Add New Note</label>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add your notes about this candidate..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      rows={4}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <CreateCompetenceFileModal
        isOpen={isCompetenceFileModalOpen}
        onClose={() => setIsCompetenceFileModalOpen(false)}
        onSuccess={handleCreateCompetenceFile}
        preselectedCandidate={competenceFileCandidate}
      />
      
      <AddToJobModal
        isOpen={isAddToJobModalOpen}
        candidate={addToJobCandidate}
        onClose={() => setIsAddToJobModalOpen(false)}
        onAddToJob={handleAddToJob}
      />
    </div>
  );
} 

// Lightweight client component to list candidate documents from Vercel Blob by prefix
function CandidateDocuments({ candidateId }: { candidateId: string }) {
  const [files, setFiles] = React.useState<Array<{ url: string; name: string }>>([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        // Heuristic: list 'documents' category via public index endpoint if available in future
        // For now, try to fetch a JSON index if exposed; otherwise no-op
        const res = await fetch(`/api/files/list?category=documents&candidateId=${candidateId}`).catch(() => null as any);
        if (!res || !res.ok) return;
        const data = await res.json();
        if (!ignore && Array.isArray(data?.files)) {
          setFiles(data.files.map((f: any) => ({ url: f.url, name: f.fileName || 'document' })));
        }
      } catch {
        // ignore
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [candidateId]);

  if (loading) return <div className="text-xs text-gray-500">Loading documents…</div>;
  if (files.length === 0) return null;
  return (
    <ul className="space-y-2">
      {files.map((f, idx) => (
        <li key={idx} className="flex items-center justify-between text-sm">
          <span className="truncate mr-2">{f.name}</span>
          <a href={f.url} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-700">Open</a>
        </li>
      ))}
    </ul>
  );
}