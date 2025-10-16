'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  MessageSquare, 
  FileText, 
  Download, 
  ExternalLink, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  Clock, 
  User, 
  ThumbsUp, 
  ThumbsDown, 
  Send, 
  Flag, 
  Users, 
  Globe,
  Play,
  Heart,
  Share2,
  Building,
  Award,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Plus,
  ChevronRight,
  Video,
  Paperclip,
  Link as LinkIcon,
  DollarSign,
  UserPlus,
  CalendarPlus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentRole: string;
  experience: string;
  education: string;
  skills: string[];
  avatar?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  videoDuration?: number;
  videoTitle?: string;
  videoDescription?: string;
  competenceFileUrl?: string;
  stage: 'sourcing' | 'screening' | 'interview' | 'assessment' | 'offer';
  clientRating?: number;
  clientComments?: string;
  internalNotes?: string;
  nextAction?: string;
  scheduledInterviews?: Array<{
    date: string;
    type: string;
    status: 'scheduled' | 'completed' | 'cancelled';
  }>;
  assessments?: Array<{
    type: string;
    status: 'pending' | 'completed' | 'passed' | 'failed';
    score?: number;
    completedDate?: string;
  }>;
  timeline?: Array<{
    date: string;
    action: string;
    note?: string;
  }>;
  fit: {
    technical: number;
    cultural: number;
    experience: number;
    overall: number;
  };
}

interface ClientRequest {
  id: string;
  type: 'interview' | 'assessment' | 'information' | 'feedback' | 'reference';
  status: 'pending' | 'approved' | 'declined' | 'completed';
  title: string;
  description: string;
  requestedAt: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
}

interface ClientCandidateDrawerProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onRatingChange: (candidateId: string, rating: number) => void;
  onCommentAdd: (candidateId: string, comment: string) => void;
  onRequestSubmit: (candidateId: string, request: Omit<ClientRequest, 'id' | 'requestedAt' | 'status'>) => void;
}

export function ClientCandidateDrawer({
  candidate,
  isOpen,
  onClose,
  onRatingChange,
  onCommentAdd,
  onRequestSubmit
}: ClientCandidateDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    type: 'interview' as ClientRequest['type'],
    title: '',
    description: '',
    priority: 'medium' as ClientRequest['priority'],
    dueDate: ''
  });

  // Mock data for demonstration
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([
    {
      id: '1',
      type: 'interview',
      status: 'pending',
      title: 'Schedule Technical Interview',
      description: 'Request for a 1-hour technical interview to assess candidate\'s full-stack development skills',
      requestedAt: '2024-02-15 10:30',
      dueDate: '2024-02-20',
      priority: 'high'
    },
    {
      id: '2',
      type: 'assessment',
      status: 'approved',
      title: 'Request Portfolio Review',
      description: 'Please provide detailed feedback on candidate\'s GitHub projects and portfolio',
      requestedAt: '2024-02-14 14:20',
      priority: 'medium'
    }
  ]);

  const [candidateComments, setCandidateComments] = useState([
    {
      id: '1',
      author: 'You',
      content: 'Very impressed with the technical skills demonstrated. Would like to move forward with interview.',
      timestamp: '2024-02-15 09:15',
      type: 'feedback'
    },
    {
      id: '2',
      author: 'HR Team',
      content: 'Candidate shows strong alignment with our company culture and values.',
      timestamp: '2024-02-14 16:30',
      type: 'assessment'
    }
  ]);

  useEffect(() => {
    if (candidate?.clientRating) {
      setNewRating(candidate.clientRating);
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const handleRatingClick = (rating: number) => {
    setNewRating(rating);
    onRatingChange(candidate.id, rating);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    onCommentAdd(candidate.id, newComment);
    setCandidateComments(prev => [
      {
        id: Date.now().toString(),
        author: 'You',
        content: newComment,
        timestamp: new Date().toLocaleString(),
        type: 'feedback'
      },
      ...prev
    ]);
    setNewComment('');
  };

  const handleSubmitRequest = () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) return;
    
    onRequestSubmit(candidate.id, newRequest);
    setClientRequests(prev => [
      {
        id: Date.now().toString(),
        ...newRequest,
        requestedAt: new Date().toLocaleString(),
        status: 'pending'
      },
      ...prev
    ]);
    
    setNewRequest({
      type: 'interview',
      title: '',
      description: '',
      priority: 'medium',
      dueDate: ''
    });
    setShowRequestModal(false);
  };

  const getFitColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'interview': return Calendar;
      case 'assessment': return Target;
      case 'information': return FileText;
      case 'feedback': return MessageSquare;
      case 'reference': return Users;
      default: return FileText;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'requests', label: 'Requests', icon: Send },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-large rounded-l-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-tl-2xl">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-[#0A2F5A]/10 flex items-center justify-center text-[#0A2F5A] text-xl font-bold shadow-medium">
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{candidate.name}</h2>
                <p className="text-sm text-gray-600">{candidate.currentRole}</p>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-700">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{candidate.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span>{candidate.experience}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-center p-3 bg-white rounded-xl shadow-medium border border-gray-200">
                <div className={`text-2xl font-bold text-gray-900`}>
                  {candidate.fit.overall}%
                </div>
                <div className="text-xs text-gray-600">Overall Fit</div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Rating & Actions Bar */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-neutral-50 to-neutral-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingClick(star)}
                        className={`h-5 w-5 ${
                          newRating >= star ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        <Star className="h-full w-full fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>Tech: {candidate.fit.technical}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>Culture: {candidate.fit.cultural}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Experience: {candidate.fit.experience}%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {candidate.videoUrl && (
                  <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Video
                  </button>
                )}
                <button 
                  onClick={() => setShowRequestModal(true)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 text-sm font-medium shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Make Request
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-neutral-50 to-neutral-100">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <a href={`mailto:${candidate.email}`} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                          {candidate.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <a href={`tel:${candidate.phone}`} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                          {candidate.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary-600" />
                    Skills & Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 shadow-soft">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-primary-600" />
                    Education
                  </h3>
                  <p className="text-gray-700">{candidate.education}</p>
                </div>

                {/* Assessment Status */}
                {candidate.assessments && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Assessment Status</h3>
                    <div className="space-y-2">
                      {candidate.assessments.map((assessment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Target className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{assessment.type}</span>
                          </div>
                          <Badge className={getRequestStatusColor(assessment.status)}>
                            {assessment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interviews */}
                {candidate.scheduledInterviews && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Interview Schedule</h3>
                    <div className="space-y-2">
                      {candidate.scheduledInterviews.map((interview, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="font-medium">{interview.type}</span>
                              <p className="text-sm text-gray-600">{interview.date}</p>
                            </div>
                          </div>
                          <Badge className={getRequestStatusColor(interview.status)}>
                            {interview.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Actions */}
                {candidate.nextAction && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Next Action Required
                    </h3>
                    <p className="text-yellow-800">{candidate.nextAction}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-6">
                {/* Add New Comment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Your Feedback</h3>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this candidate..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={4}
                  />
                  <div className="flex justify-end mt-3">
                    <Button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                </div>

                {/* Previous Comments */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Comments</h3>
                  <div className="space-y-4">
                    {candidateComments.map((comment) => (
                      <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{comment.author}</span>
                          <span className="text-sm text-gray-500">{comment.timestamp}</span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                        <Badge variant="outline" className="mt-2">
                          {comment.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-6">
                {/* Submit New Request */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Your Requests</h3>
                  <Button 
                    onClick={() => setShowRequestModal(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </div>

                {/* Request List */}
                <div className="space-y-4">
                  {clientRequests.map((request) => {
                    const Icon = getRequestTypeIcon(request.type);
                    return (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">{request.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                            </div>
                          </div>
                          <Badge className={getRequestStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Requested: {request.requestedAt}</span>
                          {request.dueDate && <span>Due: {request.dueDate}</span>}
                          <Badge variant="outline" className={`text-xs ${
                            request.priority === 'high' ? 'border-red-300 text-red-700' :
                            request.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                            'border-green-300 text-green-700'
                          }`}>
                            {request.priority} priority
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Documents & Files</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Competence File */}
                  {candidate.competenceFileUrl && (
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-primary-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Competence File</h4>
                          <p className="text-sm text-gray-600">Professional assessment and skills overview</p>
                        </div>
                                                  <div className="flex space-x-2">
                            <a href={candidate.competenceFileUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </a>
                            <a href={candidate.competenceFileUrl} download>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </a>
                          </div>
                      </div>
                    </div>
                  )}

                  {/* Resume */}
                  {candidate.resumeUrl && (
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Resume/CV</h4>
                          <p className="text-sm text-gray-600">Complete career history and qualifications</p>
                        </div>
                                                  <div className="flex space-x-2">
                            <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </a>
                            <a href={candidate.resumeUrl} download>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </a>
                          </div>
                      </div>
                    </div>
                  )}

                  {/* Video Introduction */}
                  {candidate.videoUrl && (
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Video className="h-8 w-8 text-purple-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Video Introduction</h4>
                          <p className="text-sm text-gray-600">Personal introduction and presentation</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Watch
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Portfolio */}
                  {candidate.portfolioUrl && (
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-8 w-8 text-green-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Portfolio</h4>
                          <p className="text-sm text-gray-600">Work samples and project showcase</p>
                        </div>
                                                  <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open
                            </Button>
                          </a>
                      </div>
                    </div>
                  )}

                  {/* LinkedIn */}
                  {candidate.linkedinUrl && (
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <LinkIcon className="h-8 w-8 text-blue-500" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">LinkedIn Profile</h4>
                          <p className="text-sm text-gray-600">Professional network and connections</p>
                        </div>
                                                  <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open
                            </Button>
                          </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Submit New Request</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, type: e.target.value as ClientRequest['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="interview">Interview Request</option>
                  <option value="assessment">Assessment Request</option>
                  <option value="information">Information Request</option>
                  <option value="feedback">Feedback Request</option>
                  <option value="reference">Reference Check</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief title for your request"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide details about what you need"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, priority: e.target.value as ClientRequest['priority'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newRequest.dueDate}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowRequestModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitRequest}
                disabled={!newRequest.title.trim() || !newRequest.description.trim()}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 