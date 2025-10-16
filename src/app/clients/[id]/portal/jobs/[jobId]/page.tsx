'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  FileText,
  Video,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Phone,
  Mail,
  ExternalLink,
  Plus,
  Filter,
  Download,
  Share2,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit3,
  Flag,
  Users,
  Award,
  Settings,
  Play
} from 'lucide-react';
import CandidateShorts from '@/components/portal/CandidateShorts';
import { ClientCandidateDrawer } from '@/components/portal/ClientCandidateDrawer';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

interface JobPipelineData {
  job: {
    id: string;
    title: string;
    department: string;
    location: string;
    description: string;
    requirements: string[];
    salaryRange: string;
    status: 'active' | 'paused' | 'filled';
    priority: 'high' | 'medium' | 'low';
    hiringManager: string;
    recruiter: string;
    targetHireDate?: string;
    assessmentRequirements?: Array<{
      type: string;
      required: boolean;
      description: string;
    }>;
  };
  candidates: Candidate[];
  stageDefinitions: Record<string, {
    name: string;
    description: string;
    color: string;
  }>;
}

export default function JobPipelinePage() {
  const params = useParams();
  const clientId = params.id as string;
  const jobId = params.jobId as string;
  const [pipelineData, setPipelineData] = useState<JobPipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showVideoShorts, setShowVideoShorts] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Mock data for demo
  useEffect(() => {
    const mockData: JobPipelineData = {
      job: {
        id: jobId,
        title: 'Senior Full Stack Developer',
        department: 'Engineering',
        location: 'Zurich, Switzerland',
        description: 'We are seeking a talented Senior Full Stack Developer to join our engineering team...',
        requirements: [
          '5+ years experience with React and Node.js',
          'Experience with TypeScript and modern web technologies',
          'Strong problem-solving skills',
          'Experience with cloud platforms (AWS/Azure)',
          'Excellent communication skills'
        ],
        salaryRange: '100,000 - 130,000 CHF',
        status: 'active',
        priority: 'high',
        hiringManager: 'Thomas Weber',
        recruiter: 'Lisa Martinez',
        targetHireDate: '2024-03-15',
        assessmentRequirements: [
          { type: 'Technical Coding Assessment', required: true, description: 'React and Node.js coding challenge' },
          { type: 'System Design Interview', required: true, description: 'Architectural problem solving' },
          { type: 'Cultural Fit Assessment', required: false, description: 'Team dynamics evaluation' }
        ]
      },
      stageDefinitions: {
        sourcing: { name: 'Sourcing', description: 'Identifying potential candidates', color: 'bg-blue-100 text-blue-800' },
        screening: { name: 'Screening', description: 'Initial qualification review', color: 'bg-yellow-100 text-yellow-800' },
        interview: { name: 'Interview', description: 'Interview process', color: 'bg-purple-100 text-purple-800' },
        assessment: { name: 'Assessment', description: 'Technical and cultural evaluation', color: 'bg-orange-100 text-orange-800' },
        offer: { name: 'Offer', description: 'Final decision and offer', color: 'bg-green-100 text-green-800' }
      },
      candidates: [
        {
          id: '1',
          name: 'Alex Mueller',
          email: 'alex.mueller@email.com',
          phone: '+41 79 123 4567',
          location: 'Zurich, Switzerland',
          currentRole: 'Full Stack Developer at TechStart',
          experience: '6 years',
          education: 'MSc Computer Science, ETH Zurich',
          skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          videoThumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
          videoDuration: 30,
          videoTitle: 'Technical Introduction & Problem-Solving Approach',
          videoDescription: 'Hi, I\'m Alex! I discuss my experience with React and Node.js, showcase a recent project, and explain my approach to solving complex technical challenges.',
          competenceFileUrl: 'https://example.com/alex-mueller-cv.pdf',
          stage: 'interview',
          clientRating: 4,
          clientComments: 'Strong technical background, good cultural fit potential.',
          nextAction: 'Schedule system design interview',
          fit: { technical: 85, cultural: 78, experience: 90, overall: 84 },
          scheduledInterviews: [
            { date: '2024-02-15 14:00', type: 'Technical Interview', status: 'completed' },
            { date: '2024-02-18 10:00', type: 'System Design', status: 'scheduled' }
          ],
          assessments: [
            { type: 'Coding Challenge', status: 'completed', score: 85, completedDate: '2024-02-12' }
          ],
          timeline: [
            { date: '2024-02-10', action: 'Added to pipeline' },
            { date: '2024-02-12', action: 'Completed coding assessment', note: 'Score: 85/100' },
            { date: '2024-02-15', action: 'Completed technical interview', note: 'Positive feedback from engineering team' }
          ]
        },
        {
          id: '2',
          name: 'Emma Schmidt',
          email: 'emma.schmidt@email.com',
          phone: '+41 78 987 6543',
          location: 'Basel, Switzerland',
          currentRole: 'Senior Developer at DevCorp',
          experience: '7 years',
          education: 'BSc Software Engineering, University of Basel',
          skills: ['React', 'Vue.js', 'Node.js', 'Docker', 'Kubernetes'],
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
          videoThumbnail: 'https://images.unsplash.com/photo-1494790108755-2616b332c7c4?w=300&h=300&fit=crop&crop=face',
          videoDuration: 45,
          videoTitle: 'Leadership & Architecture Experience',
          videoDescription: 'Hello! I\'m Emma. In this video, I walk through my experience leading development teams, my passion for DevOps, and how I approach system architecture decisions.',
          competenceFileUrl: 'https://example.com/emma-schmidt-cv.pdf',
          stage: 'assessment',
          clientRating: 5,
          clientComments: 'Excellent candidate, very impressed with technical skills and communication.',
          nextAction: 'Complete cultural fit assessment',
          fit: { technical: 92, cultural: 88, experience: 95, overall: 92 },
          scheduledInterviews: [
            { date: '2024-02-14 09:00', type: 'Technical Interview', status: 'completed' },
            { date: '2024-02-16 15:00', type: 'Cultural Fit', status: 'completed' }
          ],
          assessments: [
            { type: 'Coding Challenge', status: 'passed', score: 92, completedDate: '2024-02-11' },
            { type: 'System Design', status: 'passed', score: 88, completedDate: '2024-02-14' }
          ]
        },
        {
          id: '3',
          name: 'David Chen',
          email: 'david.chen@email.com',
          phone: '+41 76 555 0123',
          location: 'Geneva, Switzerland',
          currentRole: 'Full Stack Engineer at StartupXYZ',
          experience: '5 years',
          education: 'MSc Computer Science, EPFL',
          skills: ['React', 'Node.js', 'Python', 'AWS', 'MongoDB'],
          stage: 'screening',
          nextAction: 'Schedule initial technical screen',
          fit: { technical: 80, cultural: 75, experience: 82, overall: 79 },
          timeline: [
            { date: '2024-02-16', action: 'Added to pipeline' },
            { date: '2024-02-17', action: 'Resume reviewed', note: 'Strong technical background' }
          ]
        }
      ]
    };

    setTimeout(() => {
      setPipelineData(mockData);
      setLoading(false);
    }, 1000);
  }, [jobId]);

  const handleRateCandidate = (candidateId: string, rating: number) => {
    if (!pipelineData) return;
    
    setPipelineData(prev => ({
      ...prev!,
      candidates: prev!.candidates.map(c => 
        c.id === candidateId ? { ...c, clientRating: rating } : c
      )
    }));
  };

  const handleAddComment = (candidateId: string) => {
    if (!pipelineData || !newComment.trim()) return;
    
    setPipelineData(prev => ({
      ...prev!,
      candidates: prev!.candidates.map(c => 
        c.id === candidateId ? { ...c, clientComments: newComment } : c
      )
    }));
    
    setNewComment('');
    setShowCommentModal(null);
  };

  const handleVideoComment = (candidateId: string, comment: string) => {
    console.log('Adding video comment for candidate', candidateId, comment);
  };

  const handleVideoShare = (candidateId: string) => {
    console.log('Sharing video for candidate', candidateId);
  };

  const handleCandidateCommentAdd = (candidateId: string, comment: string) => {
    if (!pipelineData) return;
    
    setPipelineData(prev => ({
      ...prev!,
      candidates: prev!.candidates.map(c => 
        c.id === candidateId ? { 
          ...c, 
          clientComments: c.clientComments 
            ? `${c.clientComments}\n\n[${new Date().toLocaleDateString()}] ${comment}`
            : comment
        } : c
      )
    }));
  };

  const handleRequestSubmit = (candidateId: string, request: any) => {
    console.log('Submitting request for candidate', candidateId, request);
    // Here you would typically send the request to your API
  };

  const getCandidatesWithVideos = () => {
    return pipelineData?.candidates.filter(candidate => candidate.videoUrl).map(candidate => ({
      id: candidate.id,
      candidateId: candidate.id,
      candidateName: candidate.name,
      currentRole: candidate.currentRole,
      location: candidate.location,
      experience: candidate.experience,
      videoUrl: candidate.videoUrl!,
      thumbnailUrl: candidate.videoThumbnail || candidate.avatar || '',
      duration: candidate.videoDuration || 60,
      title: candidate.videoTitle || 'Candidate Introduction',
      description: candidate.videoDescription || 'Learn more about this candidate',
      skills: candidate.skills,
      clientRating: candidate.clientRating,
      competenceFileUrl: candidate.competenceFileUrl,
      linkedinUrl: candidate.linkedinUrl,
      fit: candidate.fit,
      uploadedAt: new Date().toISOString()
    })) || [];
  };

  const filteredCandidates = pipelineData?.candidates.filter(candidate => 
    selectedStage === 'all' || candidate.stage === selectedStage
  ) || [];

  const getCandidatesByStage = (stage: string) => {
    return pipelineData?.candidates.filter(c => c.stage === stage) || [];
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!pipelineData) return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/clients/${clientId}/portal`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Portal
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{pipelineData.job.title}</h1>
              <p className="text-gray-600">
                {pipelineData.job.department} • {pipelineData.job.location}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowVideoShorts(true)}
            >
              <Video className="h-4 w-4 mr-2" />
              View Shorts
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Pipeline
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Job Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Position Overview</h2>
              <div className="flex items-center space-x-2">
                <Badge className={`bg-${pipelineData.job.priority === 'high' ? 'red' : pipelineData.job.priority === 'medium' ? 'yellow' : 'green'}-100 text-${pipelineData.job.priority === 'high' ? 'red' : pipelineData.job.priority === 'medium' ? 'yellow' : 'green'}-800`}>
                  {pipelineData.job.priority} priority
                </Badge>
                <Badge variant="outline">
                  {pipelineData.candidates.length} candidates
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Job Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Salary: {pipelineData.job.salaryRange}</p>
                  <p>Hiring Manager: {pipelineData.job.hiringManager}</p>
                  <p>Recruiter: {pipelineData.job.recruiter}</p>
                  {pipelineData.job.targetHireDate && (
                    <p>Target Hire Date: {pipelineData.job.targetHireDate}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Key Requirements</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {pipelineData.job.requirements.slice(0, 3).map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Assessment Requirements</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {pipelineData.job.assessmentRequirements?.map((assessment, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className={`h-3 w-3 mr-2 ${assessment.required ? 'text-red-500' : 'text-gray-400'}`} />
                      {assessment.type}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(pipelineData.stageDefinitions).map(([stageKey, stage]) => {
            const stageCandidates = getCandidatesByStage(stageKey);
            return (
              <Card key={stageKey} className="h-fit">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">{stage.name}</h3>
                    <Badge className={`${stage.color} text-xs px-2 py-1`}>
                      {stageCandidates.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-1" title={stage.description}>
                    {stage.description}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {stageCandidates.map((candidate) => (
                      <div key={candidate.id} className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md">
                        {/* Header with name and rating */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate" title={candidate.name}>
                              {candidate.name}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-0.5 flex-shrink-0 ml-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRateCandidate(candidate.id, star)}
                                className={`h-2.5 w-2.5 ${
                                  candidate.clientRating && star <= candidate.clientRating
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                } hover:scale-110 transition-transform`}
                              >
                                <Star className="h-full w-full fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Role and location */}
                        <div className="mb-1.5 space-y-0.5">
                          <p className="text-xs text-gray-600 truncate" title={candidate.currentRole}>
                            {candidate.currentRole}
                          </p>
                          <p className="text-xs text-gray-500 truncate" title={candidate.location}>
                            {candidate.location}
                          </p>
                        </div>

                        {/* Fit Score - Compact version */}
                        <div className="mb-1.5">
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-gray-600">Fit</span>
                            <span className="font-semibold text-primary-700">{candidate.fit.overall}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full transition-all ${
                                candidate.fit.overall >= 80 ? 'bg-green-500' :
                                candidate.fit.overall >= 60 ? 'bg-yellow-500' : 'bg-red-400'
                              }`}
                              style={{ width: `${candidate.fit.overall}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Skills - More compact */}
                        <div className="mb-1.5">
                          <div className="flex flex-wrap gap-0.5">
                            {candidate.skills.slice(0, 2).map((skill) => (
                              <span 
                                key={skill} 
                                className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-center max-w-[65px] truncate"
                                title={skill}
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 2 && (
                              <span 
                                className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded font-medium"
                                title={candidate.skills.slice(2).join(', ')}
                              >
                                +{candidate.skills.length - 2}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions - More compact */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {candidate.videoUrl && (
                                <button 
                                  onClick={() => setShowVideoShorts(true)}
                                  className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                  title="Watch video"
                                >
                                  <Play className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                onClick={() => setShowCommentModal(candidate.id)}
                                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                title="Add comment"
                              >
                                <MessageSquare className="h-3 w-3" />
                              </button>
                            </div>
                            <button 
                              onClick={() => setSelectedCandidate(candidate)}
                              className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 hover:text-primary-900 font-medium px-2 py-1 rounded transition-all flex items-center space-x-1"
                              title="View details"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Details</span>
                            </button>
                          </div>

                          {/* Comments/Actions - Compact */}
                          {candidate.clientComments && (
                            <div className="p-1.5 bg-blue-50 rounded text-xs">
                              <p className="text-blue-800 line-clamp-1" title={candidate.clientComments}>
                                {candidate.clientComments}
                              </p>
                            </div>
                          )}

                          {candidate.nextAction && (
                            <div className="p-1.5 bg-yellow-50 rounded text-xs">
                              <p className="text-yellow-800 line-clamp-1" title={candidate.nextAction}>
                                Next: {candidate.nextAction}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comment Modal */}
        {showCommentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Comment</h3>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this candidate..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
                rows={4}
              />
              <div className="flex items-center justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCommentModal(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleAddComment(showCommentModal)}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Video Shorts Modal */}
        {showVideoShorts && (
          <CandidateShorts
            jobId={jobId}
            candidates={getCandidatesWithVideos()}
            onRate={handleRateCandidate}
            onComment={handleVideoComment}
            onShare={handleVideoShare}
            onClose={() => setShowVideoShorts(false)}
          />
        )}

        {/* Client Candidate Drawer */}
        <ClientCandidateDrawer
          candidate={selectedCandidate}
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onRatingChange={handleRateCandidate}
          onCommentAdd={handleCandidateCommentAdd}
          onRequestSubmit={handleRequestSubmit}
        />
      </div>
    </Layout>
  );
} 