'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  Settings, 
  BarChart3,
  Send,
  Search,
  Filter,
  Clock,
  MapPin,
  X,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  type: 'technical' | 'personality' | 'cognitive';
  description: string;
  duration: number;
  questions: number;
  status: 'draft' | 'active' | 'completed';
  candidates: number;
  averageScore: number;
  createdAt: string;
  tags?: string[];
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  status: 'invited' | 'started' | 'completed' | 'expired';
  score?: number;
  invitedAt: string;
  startedAt?: string;
  completedAt?: string;
  tags?: string[];
  rank?: number;
  duration?: string;
  points?: number;
  maxPoints?: number;
  percentage?: number;
  skills?: {
    name: string;
    score: number;
    maxScore: number;
    percentage: number;
  }[];
  history?: {
    action: string;
    timestamp: string;
    location?: string;
  }[];
  country?: string;
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [currentTab, setCurrentTab] = useState<'candidates' | 'questions' | 'settings' | 'insights'>('candidates');
  const [showCandidateDrawer, setShowCandidateDrawer] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [drawerTab, setDrawerTab] = useState<'report' | 'candidate'>('report');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock assessment data
  const [assessment] = useState<Assessment>({
    id: assessmentId,
    title: 'Full-stack - Agile, Java, JavaScript, React, SQL - Expert',
    type: 'technical',
    description: 'Comprehensive assessment for senior full-stack developers',
    duration: 120,
    questions: 25,
    status: 'active',
    candidates: 8,
    averageScore: 52,
    createdAt: '2024-01-15T10:00:00Z',
    tags: ['Java', 'JavaScript', 'React', 'SQL', 'Agile']
  });

  // Mock candidates data
  const [candidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'Achille BRAHIRI',
      email: 'abrahiri@gmail.com',
      status: 'expired',
      invitedAt: '2024-06-13T15:41:00Z',
      rank: 4,
      country: 'France'
    },
    {
      id: '2',
      name: 'Naoufal BENHMIMOU',
      email: 'Naoufal.ben@gmail.com',
      status: 'completed',
      score: 52,
      invitedAt: '2024-05-15T08:38:00Z',
      completedAt: '2024-05-15T10:15:00Z',
      rank: 1,
      duration: '97 minutes',
      points: 52,
      maxPoints: 100,
      percentage: 52,
      country: 'Morocco',
      skills: [
        { name: 'Java', score: 18, maxScore: 25, percentage: 72 },
        { name: 'JavaScript', score: 15, maxScore: 25, percentage: 60 },
        { name: 'React', score: 12, maxScore: 25, percentage: 48 },
        { name: 'SQL', score: 7, maxScore: 25, percentage: 28 }
      ],
      history: [
        { action: 'Test completed', timestamp: '2024-05-15T10:15:00Z', location: 'Casablanca, Morocco' },
        { action: 'Test started', timestamp: '2024-05-15T08:38:00Z', location: 'Casablanca, Morocco' },
        { action: 'Invitation sent', timestamp: '2024-05-15T08:00:00Z' }
      ]
    },
    {
      id: '3',
      name: 'Killian Lucas',
      email: 'contact.killian.lucas@gmail.com',
      status: 'expired',
      invitedAt: '2024-04-06T09:58:00Z',
      rank: 3,
      country: 'France'
    },
    {
      id: '4',
      name: 'John ALLOU',
      email: 'bjohnalloupro@gmail.com',
      status: 'expired',
      invitedAt: '2024-03-13T11:04:00Z',
      tags: ['Genève'],
      rank: 2,
      country: 'Switzerland'
    }
  ]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      invited: { color: 'bg-blue-100 text-blue-800', icon: Send },
      started: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertCircle;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
              <p className="text-gray-600 mt-1">{assessment.description}</p>
            </div>
          </div>
          <Button className="btn-primary flex items-center">
            <Send className="h-4 w-4 mr-2" />
            Send test
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'candidates', label: 'Candidates', icon: Users, count: assessment.candidates },
              { id: 'questions', label: 'Questions', icon: FileText, count: assessment.questions },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'insights', label: 'Insights', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  currentTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.count && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {currentTab === 'candidates' && (
          <div>
            {/* Candidates Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">All (8)</span>
                  <span className="text-red-600 font-medium">To review (8) •</span>
                  <span>Rejected (0)</span>
                  <span>Passed (0)</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Java
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        JavaScript
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        React
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCandidates.map((candidate) => (
                      <tr 
                        key={candidate.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setShowCandidateDrawer(true);
                          setDrawerTab('report');
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                              <div className="text-sm text-gray-500">{candidate.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(candidate.invitedAt)}</div>
                          <div className="text-sm text-gray-500">{getStatusBadge(candidate.status)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.score ? `${candidate.score}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.skills?.find(s => s.name === 'Java')?.percentage || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.skills?.find(s => s.name === 'JavaScript')?.percentage || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.skills?.find(s => s.name === 'React')?.percentage || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle invite action
                            }}
                          >
                            Invite
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Other tab contents */}
        {currentTab === 'questions' && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Questions Management</h3>
            <p className="text-gray-500">Manage and configure assessment questions</p>
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment Settings</h3>
            <p className="text-gray-500">Configure assessment parameters and options</p>
          </div>
        )}

        {currentTab === 'insights' && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment Insights</h3>
            <p className="text-gray-500">View analytics and performance metrics</p>
          </div>
        )}
      </div>

      {/* Optimized Candidate Drawer */}
      {showCandidateDrawer && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-xl">
            {/* Fixed Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedCandidate.name}</h3>
                    <p className="text-sm text-gray-500">{selectedCandidate.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCandidateDrawer(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex space-x-6 mt-4">
                <button
                  onClick={() => setDrawerTab('report')}
                  className={`pb-2 border-b-2 font-medium text-sm ${
                    drawerTab === 'report'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Report
                </button>
                <button
                  onClick={() => setDrawerTab('candidate')}
                  className={`pb-2 border-b-2 font-medium text-sm ${
                    drawerTab === 'candidate'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Candidate
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {drawerTab === 'report' && (
                  <div className="space-y-6">
                    {selectedCandidate.status === 'completed' ? (
                      <>
                        {/* Score Overview */}
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold text-gray-900">Overall Score</h4>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-3xl font-bold text-gray-900">
                                {selectedCandidate.percentage}%
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">Rank</div>
                                <div className="text-lg font-semibold text-gray-900">#{selectedCandidate.rank}</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${selectedCandidate.percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 mt-2">
                              <span>{selectedCandidate.points} points</span>
                              <span>{selectedCandidate.maxPoints} total</span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Skills Breakdown */}
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold text-gray-900">Skills Breakdown</h4>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {selectedCandidate.skills?.map((skill, index) => (
                                <div key={index}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                                    <span className="text-sm text-gray-500">{skill.score}/{skill.maxScore}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full" 
                                      style={{ width: `${skill.percentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-right text-sm text-gray-500 mt-1">
                                    {skill.percentage}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Test Details */}
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold text-gray-900">Test Details</h4>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Duration:</span>
                                <div className="font-medium">{selectedCandidate.duration}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Completed:</span>
                                <div className="font-medium">{formatDate(selectedCandidate.completedAt!)}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Location:</span>
                                <div className="font-medium">{selectedCandidate.country}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Status:</span>
                                <div className="font-medium">{getStatusBadge(selectedCandidate.status)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <Card>
                        <CardContent className="text-center py-8">
                          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="font-medium text-gray-900 mb-2">No Report Available</h4>
                          <p className="text-gray-500">
                            {selectedCandidate.status === 'expired' 
                              ? 'This candidate\'s test has expired'
                              : 'This candidate hasn\'t completed the test yet'
                            }
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {drawerTab === 'candidate' && (
                  <div className="space-y-6">
                    {/* Candidate Info */}
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold text-gray-900">Candidate Information</h4>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Email:</span>
                            <span className="font-medium">{selectedCandidate.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Country:</span>
                            <span className="font-medium">{selectedCandidate.country}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Invited:</span>
                            <span className="font-medium">{formatDate(selectedCandidate.invitedAt)}</span>
                          </div>
                          {selectedCandidate.tags && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Tags:</span>
                              <div className="flex gap-1">
                                {selectedCandidate.tags.map((tag, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Activity History */}
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold text-gray-900">Activity History</h4>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedCandidate.history?.map((activity, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                                <div className="text-sm text-gray-500">{formatDate(activity.timestamp)}</div>
                                {activity.location && (
                                  <div className="text-xs text-gray-400 flex items-center mt-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {activity.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 