'use client';

import { useState, useEffect } from 'react';
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
  Paperclip,
  Smile,
  MessageCircle,
  Reply,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';

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

interface SwissCandidate {
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
  linkedinUrl?: string;
  portfolioUrl?: string;
  lastInteraction: string;
  source: string;
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
  communications?: CommunicationMessage[];
  // CV file information (real data from DB when available)
  originalCvUrl?: string;
  originalCvFileName?: string;
  originalCvUploadedAt?: string;
  // Extended profile fields (optional)
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
  degrees?: string[];
  certifications?: string[];
  universities?: string[];
  graduationYear?: number;
  // Skills taxonomy
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
}

interface CandidateProfileDrawerProps {
  candidate: SwissCandidate;
  isOpen: boolean;
  onClose: () => void;
  initialEditMode?: boolean;
  onCandidateUpdate?: (updatedCandidate: SwissCandidate) => void;
}

export function CandidateProfileDrawer({ 
  candidate, 
  isOpen, 
  onClose,
  initialEditMode = false,
  onCandidateUpdate
}: CandidateProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showAddToJobModal, setShowAddToJobModal] = useState(false);
  const [showCreateCompetenceModal, setShowCreateCompetenceModal] = useState(false);
  
  // Editing state management
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [editedCandidate, setEditedCandidate] = useState<SwissCandidate>(candidate);
  const [editingSection, setEditingSection] = useState<Record<string, boolean>>({
    summary: false,
    personal: false,
    address: false,
    professional: false,
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [communicationFilter, setCommunicationFilter] = useState<'all' | 'email' | 'linkedin' | 'whatsapp'>('all');
  const [communicationSearch, setCommunicationSearch] = useState('');

  // Sync editedCandidate when candidate prop changes
  useEffect(() => {
    setEditedCandidate(candidate);
  }, [candidate]);

  if (!isOpen) return null;

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

  // Mock communication data - in real app this would come from API
  const mockCommunications: CommunicationMessage[] = [
    {
      id: '1',
      type: 'email',
      direction: 'outbound',
      subject: 'Senior Frontend Developer Position - Zurich',
      content: 'Hi Zachary, I hope this email finds you well. I came across your profile and was impressed by your experience in React and TypeScript. We have an exciting opportunity for a Senior Frontend Developer position at our Zurich office that I believe would be a perfect fit for your skills...',
      timestamp: '2024-01-15T10:30:00Z',
      sender: 'recruiter@emineon.com',
      recipient: candidate.email,
      status: 'read'
    },
    {
      id: '2',
      type: 'email',
      direction: 'inbound',
      subject: 'Re: Senior Frontend Developer Position - Zurich',
      content: 'Thank you for reaching out! I\'m definitely interested in learning more about this opportunity. The role sounds very exciting and aligns well with my career goals. I\'d love to schedule a call to discuss this further. I\'m available this week for a conversation.',
      timestamp: '2024-01-15T14:45:00Z',
      sender: candidate.email,
      recipient: 'recruiter@emineon.com',
      status: 'replied'
    },
    {
      id: '3',
      type: 'linkedin',
      direction: 'outbound',
      content: 'Hi Zachary, I noticed your impressive background in frontend development. We have some exciting opportunities that might interest you. Would you be open to a brief conversation?',
      timestamp: '2024-01-10T09:15:00Z',
      sender: 'LinkedIn Recruiter',
      recipient: candidate.name,
      status: 'read'
    },
    {
      id: '4',
      type: 'whatsapp',
      direction: 'inbound',
      content: 'Hi! Just wanted to confirm our interview scheduled for tomorrow at 2 PM. Looking forward to speaking with you!',
      timestamp: '2024-01-16T16:20:00Z',
      sender: candidate.name,
      recipient: 'Recruiter',
      status: 'delivered'
    },
    {
      id: '5',
      type: 'phone',
      direction: 'outbound',
      content: 'Phone call - Initial screening discussion (Duration: 25 minutes)',
      timestamp: '2024-01-12T11:00:00Z',
      sender: 'Recruiter',
      recipient: candidate.name,
      status: 'delivered'
    }
  ];

  const filteredCommunications = mockCommunications.filter(comm => {
    const matchesFilter = communicationFilter === 'all' || comm.type === communicationFilter;
    const matchesSearch = communicationSearch === '' || 
      comm.content.toLowerCase().includes(communicationSearch.toLowerCase()) ||
      comm.subject?.toLowerCase().includes(communicationSearch.toLowerCase()) ||
      comm.sender.toLowerCase().includes(communicationSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'profile', label: 'Profile', icon: UserPlus },
    { id: 'preferences', label: 'Preferences', icon: Briefcase },
    { id: 'communications', label: 'Communications', icon: MessageCircle },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'documents', label: 'Documents', icon: Download },
    { id: 'notes', label: 'Notes', icon: Edit3 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Keep page interactive: no overlay click-to-close. Drawer stays open and content updates on card click. */}
      {/* Drawer */}
      <div data-test="candidate-detail" className="pointer-events-auto h-full w-[25vw] min-w-[340px] bg-white shadow-large transform transition-transform duration-300 ease-in-out rounded-l-2xl overflow-x-hidden">
        <div className="flex flex-col h-full">
          {/* Header - compact for 25vw */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-tl-2xl">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#0A2F5A]/10 rounded-full flex items-center justify-center text-[#0A2F5A] font-bold text-base shadow-medium">
                {candidate.avatar}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 truncate max-w-[180px]" title={candidate.name}>
                  {candidate.name}
                </h2>
                <p className="text-gray-600 text-xs font-medium truncate max-w-[200px]" title={candidate.currentRole}>{candidate.currentRole}</p>
                <div className="flex items-center space-x-2 mt-1 text-gray-700">
                  <a href={`mailto:${candidate.email}`} title={candidate.email} className="inline-flex items-center text-primary-600 hover:text-primary-700 text-[11px] max-w-[120px] truncate">
                    <Mail className="h-3.5 w-3.5 mr-1 text-gray-500" />{candidate.email}
                  </a>
                  <a href={`tel:${candidate.phone}`} title={candidate.phone} className="inline-flex items-center text-primary-600 hover:text-primary-700 text-[11px] max-w-[90px] truncate">
                    <Phone className="h-3.5 w-3.5 mr-1 text-gray-500" />{candidate.phone}
                  </a>
                  <span className="inline-flex items-center text-[11px] text-gray-700 max-w-[110px] truncate" title={candidate.location}>
                    <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />{candidate.location}
                  </span>
                  </div>
                  </div>
                </div>
            <div className="flex items-center space-x-2">
              {!isEditMode ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
                  title="Edit"
                  data-test="edit-candidate"
                >
                  <Edit3 className="h-6 w-6" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (onCandidateUpdate) {
                        onCandidateUpdate(editedCandidate);
                      }
                      setIsEditMode(false);
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditedCandidate(candidate);
                      setIsEditMode(false);
                    }}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </>
              )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button 
                onClick={() => setShowCreateCompetenceModal(true)}
                className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200 text-xs shadow-soft"
                title="Create Competence File"
              >
                <Send className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setShowAddToJobModal(true)}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 text-xs shadow-soft"
                title="Add to Job"
                data-test="add-to-job-button"
              >
                <UserPlus className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setShowScheduleModal(true)}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-xs shadow-soft"
                title="Schedule Interview"
              >
                <CalendarPlus className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setShowEmailModal(true)}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-xs shadow-soft"
                title="Send Email"
              >
                <Mail className="h-4 w-4" />
              </button>
              <button 
                onClick={() => window.open(`tel:${candidate.phone}`, '_self')}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-xs shadow-soft"
                title="Call"
              >
                <Phone className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs - compact chips */}
          <div className="flex flex-wrap items-center gap-1.5 px-2 border-b border-gray-200 bg-white">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {activeTab === 'overview' && (
              <div className="p-2">
                <CandidateFieldDisplay 
                  candidate={isEditMode ? editedCandidate : candidate} 
                  isEditMode={isEditMode}
                  collapsible={false}
                  onFieldChange={(field, value) => {
                    if (isEditMode) {
                      setEditedCandidate({ ...editedCandidate, [field]: value });
                    }
                  }}
                />
              </div>
            )}

            {activeTab === 'communications' && (
              <div className="p-2 space-y-2 overflow-x-hidden">
                {/* Communication Filters and Search */}
                <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-soft">
                  {/* One compact row: channels + search + filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Channel buttons */}
                    <div className="flex items-center gap-2">
                      {[
                        { type: 'email', label: 'Email', icon: Mail, color: 'text-blue-700' },
                        { type: 'linkedin', label: 'LinkedIn', icon: LinkIcon, color: 'text-blue-600' },
                        { type: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-600' },
                      ].map((c) => {
                        const Icon = c.icon;
                        const isActive = communicationFilter === (c.type as any);
                        return (
                          <button
                            key={c.type}
                            onClick={() => setCommunicationFilter(c.type as any)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-sm ${isActive ? 'bg-white border-gray-300 text-gray-900' : 'bg-transparent border-transparent text-gray-600 hover:text-gray-800'}`}
                            title={c.label}
                          >
                            <Icon className={`h-4 w-4 ${c.color}`} />
                            <span className="hidden sm:inline">{c.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 min-w-[160px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={communicationSearch}
                        onChange={(e) => setCommunicationSearch(e.target.value)}
                        className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm w-full"
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
                        <option value="all">All Channels</option>
                        <option value="email">Email</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Communication Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-soft">
                  <div className="space-y-3">
                    {filteredCommunications.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No communications found matching your criteria.</p>
                      </div>
                    ) : (
                      filteredCommunications
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((comm) => {
                          const IconComponent = getCommunicationIcon(comm.type);
                          const StatusIconComponent = getStatusIcon(comm.status);
                          const colorClass = getCommunicationColor(comm.type);
                          
                          return (
                            <div key={comm.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 overflow-x-hidden">
                              <div className="flex items-start gap-3">
                                {/* Channel Icon */}
                                <div className={`p-1.5 rounded-md ${colorClass} shadow-soft flex-shrink-0`}>
                                  <IconComponent className="h-3 w-3 text-white" />
                                </div>
                                
                                {/* Message Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
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
                                      <span className="text-xs text-gray-500">
                                        {new Date(comm.timestamp).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {comm.subject && (
                                    <h4 className="font-medium text-gray-900 text-sm mb-1 break-words">{comm.subject}</h4>
                                  )}
                                  
                                  <div className="text-sm text-gray-700 mb-2 break-words">
                                    <p className="whitespace-pre-line break-words">{comm.content}</p>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                      <span className="font-medium">From:</span> {comm.sender} 
                                      <span className="mx-2">•</span>
                                      <span className="font-medium">To:</span> {comm.recipient}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      {comm.attachments && comm.attachments.length > 0 && (
                                        <span className="inline-flex items-center text-xs text-gray-500">
                                          <Paperclip className="h-3 w-3 mr-1" />
                                          {comm.attachments.length} attachment{comm.attachments.length > 1 ? 's' : ''}
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

                {/* Quick Actions for Communication */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-soft">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button 
                      onClick={() => setShowEmailModal(true)}
                      className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                    >
                      <Mail className="h-3 w-3 mr-2" />
                      Send Email
                    </button>
                    
                    <button 
                      onClick={() => window.open(candidate.linkedinUrl, '_blank')}
                      className="flex items-center justify-center px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                    >
                      <LinkIcon className="h-3 w-3 mr-2" />
                      LinkedIn
                    </button>
                    
                    <button 
                      onClick={() => window.open(`https://wa.me/${candidate.phone.replace(/\D/g, '')}`, '_blank')}
                      className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                    >
                      <MessageSquare className="h-3 w-3 mr-2" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="p-2">
                <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary-600" />
                    Activity Timeline
                  </h3>
                  <div className="space-y-4">
                    {(candidate.timeline || []).map((event, index) => {
                      const IconComponent = getTimelineIcon(event.type);
                      const colorClass = getTimelineColor(event.type);
                      
                      return (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                          <div className={`p-2 rounded-lg ${colorClass} shadow-soft`}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{event.action}</h4>
                              <span className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            {event.details && (
                              <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="p-2">
                <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-soft">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center">
                    <Download className="h-4 w-4 mr-2 text-primary-600" />
                    Documents & Files
                  </h4>
                  {candidate.originalCvUrl ? (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{candidate.originalCvFileName || 'CV Document'}</h4>
                              <p className="text-xs text-gray-500">Uploaded {candidate.originalCvUploadedAt ? new Date(candidate.originalCvUploadedAt).toLocaleDateString() : 'recently'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(candidate.originalCvUrl as string, '_blank')}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View CV"
                              data-test="export-cv-button"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-soft">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="p-2">
                <CandidateFieldDisplay 
                  candidate={isEditMode ? editedCandidate : candidate} 
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
              <div className="p-2">
                <CandidateFieldDisplay 
                  candidate={isEditMode ? editedCandidate : candidate} 
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

            {activeTab === 'notes' && (
              <div className="p-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Edit3 className="h-5 w-5 mr-2 text-primary-600" />
                    Notes & Comments
                  </h3>
                  
                  {/* Add New Note */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        AD
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a note about this candidate..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          rows={3}
                        />
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <Paperclip className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <Smile className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => setNewNote('')}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => {
                                // Add note logic here
                                setNewNote('');
                              }}
                              className="px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-soft"
                            >
                              Add Note
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Existing Notes */}
                  <div className="space-y-4">
                    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-soft">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          JD
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">John Doe</h4>
                            <span className="text-xs text-gray-500">2 hours ago</span>
                          </div>
                          <p className="text-gray-700 text-sm">Excellent technical skills and great communication. Would be a perfect fit for the senior developer role.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-soft">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          MS
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">Maria Schmidt</h4>
                            <span className="text-xs text-gray-500">1 day ago</span>
                          </div>
                          <p className="text-gray-700 text-sm">Initial phone screening completed. Candidate shows strong interest and has relevant experience.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add to Job Modal */}
      {showAddToJobModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowAddToJobModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add to Job</h3>
                <button onClick={() => setShowAddToJobModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Job Position</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Choose a job...</option>
                    <option value="1">Senior Frontend Developer - Zurich</option>
                    <option value="2">UX Designer - Geneva</option>
                    <option value="3">Product Manager - Basel</option>
                    <option value="4">DevOps Engineer - Bern</option>
                    <option value="5">Data Scientist - Lugano</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Add any notes about why this candidate is a good fit..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowAddToJobModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowAddToJobModal(false);
                      // Add success notification logic here
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                  >
                    Add to Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Competence File Modal */}
      {showCreateCompetenceModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCreateCompetenceModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create Competence File</h3>
                <button onClick={() => setShowCreateCompetenceModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="cv">CV/Resume</option>
                    <option value="cover-letter">Cover Letter</option>
                    <option value="portfolio">Portfolio Summary</option>
                    <option value="competence-profile">Competence Profile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="modern">Modern Professional</option>
                    <option value="classic">Classic Corporate</option>
                    <option value="creative">Creative Design</option>
                    <option value="swiss">Swiss Style</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowCreateCompetenceModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowCreateCompetenceModal(false);
                      // Navigate to competence file creation with candidate data
                      window.open('/competence-files?candidate=' + candidate.id, '_blank');
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                  >
                    Create Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowScheduleModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Schedule Interview</h3>
                <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="phone">Phone Screening</option>
                    <option value="video">Video Interview</option>
                    <option value="in-person">In-Person Interview</option>
                    <option value="technical">Technical Assessment</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input 
                      type="time" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowScheduleModal(false);
                      // Add calendar integration logic here
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowEmailModal(false)} />
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Send Email</h3>
                <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <input 
                    type="email" 
                    value={candidate.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Select a template...</option>
                    <option value="interview-invitation">Interview Invitation</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="rejection">Rejection (Kind)</option>
                    <option value="offer">Job Offer</option>
                    <option value="custom">Custom Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input 
                    type="text" 
                    placeholder="Email subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={6}
                    placeholder="Type your message here..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowEmailModal(false);
                      // Add email sending logic here
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 