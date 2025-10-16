'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  Eye,
  Filter,
  Plus,
  BarChart3,
  Target,
  Activity,
  Bell,
  Search,
  UserCheck,
  FileText,
  Video,
  Download,
  Share2,
  Settings,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ClientPortalData {
  client: {
    id: string;
    name: string;
    logo?: string;
    industry: string;
    primaryContact: string;
    email: string;
  };
  activeJobs: Array<{
    id: string;
    title: string;
    department: string;
    location: string;
    status: 'active' | 'paused' | 'filled';
    candidatesCount: number;
    stagesCount: {
      sourcing: number;
      screening: number;
      interview: number;
      assessment: number;
      offer: number;
    };
    priority: 'high' | 'medium' | 'low';
    daysOpen: number;
    lastActivity: string;
    targetHireDate?: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'candidate_added' | 'stage_change' | 'comment' | 'interview_scheduled' | 'assessment_completed';
    jobId: string;
    jobTitle: string;
    candidateName?: string;
    message: string;
    timestamp: string;
    requiresAttention?: boolean;
  }>;
  metrics: {
    totalCandidates: number;
    interviewsScheduled: number;
    pendingFeedback: number;
    offersExtended: number;
  };
}

export default function ClientPortalPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [portalData, setPortalData] = useState<ClientPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Get client name based on client ID
  const getClientData = (clientId: string) => {
    const clientMapping: { [key: string]: { name: string; industry: string; primaryContact: string; email: string } } = {
      'client-dataflow-innovations': {
        name: 'DataFlow Innovations AG',
        industry: 'Technology',
        primaryContact: 'Emmanuel D.',
        email: 'emmanuel.d@dataflow-innovations.com'
      },
      'client-alpinebank': {
        name: 'Alpine Banking Solutions',
        industry: 'Financial Services',
        primaryContact: 'Marcus Weber',
        email: 'marcus.weber@alpinebank.com'
      },
      'client-globalfinance': {
        name: 'Global Finance Partners',
        industry: 'Investment Banking',
        primaryContact: 'Elena Rossi',
        email: 'elena.rossi@globalfinance.com'
      },
      'client-luxurywatch': {
        name: 'Swiss Luxury Timepieces',
        industry: 'Luxury Goods',
        primaryContact: 'Hans Mueller',
        email: 'hans.mueller@luxurywatch.com'
      },
      'client-biopharma': {
        name: 'BioPharma Innovations',
        industry: 'Pharmaceuticals',
        primaryContact: 'Dr. Anna Schmidt',
        email: 'anna.schmidt@biopharma.com'
      },
      'client-healthtech': {
        name: 'HealthTech Research Group',
        industry: 'Medical Technology',
        primaryContact: 'Prof. Thomas Klein',
        email: 'thomas.klein@healthtech.com'
      },
      'client-foodglobal': {
        name: 'Global Food Solutions',
        industry: 'Food & Beverage',
        primaryContact: 'Marie Dubois',
        email: 'marie.dubois@foodglobal.com'
      },
      'client-insuranceplus': {
        name: 'Insurance Plus Group',
        industry: 'Insurance',
        primaryContact: 'Robert Johnson',
        email: 'robert.johnson@insuranceplus.com'
      },
      'client-prestige': {
        name: 'Prestige Craft Manufacturing',
        industry: 'Luxury Manufacturing',
        primaryContact: 'Isabella Franconi',
        email: 'isabella.franconi@prestige.com'
      }
    };

    return clientMapping[clientId] || {
      name: 'Demo Client Solutions',
      industry: 'Technology',
      primaryContact: 'John Smith',
      email: 'john.smith@democlient.com'
    };
  };

  // Mock data for demo - replace with actual API call
  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        // Try to fetch real data from API
        const response = await fetch(`/api/clients/${clientId}/portal`);
        if (response.ok) {
          const data = await response.json();
          setPortalData(data);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('API not available, using mock data');
      }

      // Fallback to mock data
      const clientData = getClientData(clientId);
      
      const mockData: ClientPortalData = {
        client: {
          id: clientId,
          name: clientData.name,
          industry: clientData.industry,
          primaryContact: clientData.primaryContact,
          email: clientData.email,
          logo: '/api/placeholder/120/120'
        },
        activeJobs: clientId === 'client-dataflow-innovations' ? [
          {
            id: '1',
            title: 'Senior Data Engineer - MongoDB',
            department: 'Engineering',
            location: 'Zurich, Switzerland',
            status: 'active',
            candidatesCount: 15,
            stagesCount: {
              sourcing: 6,
              screening: 4,
              interview: 3,
              assessment: 1,
              offer: 1
            },
            priority: 'high',
            daysOpen: 12,
            lastActivity: '3 hours ago',
            targetHireDate: '2024-03-15'
          },
          {
            id: '2',
            title: 'Data Engineer - TypeScript/SQL',
            department: 'Engineering',
            location: 'Zurich, Switzerland',
            status: 'active',
            candidatesCount: 12,
            stagesCount: {
              sourcing: 5,
              screening: 3,
              interview: 2,
              assessment: 1,
              offer: 1
            },
            priority: 'high',
            daysOpen: 12,
            lastActivity: '5 hours ago',
            targetHireDate: '2024-03-15'
          },
          {
            id: '3',
            title: 'Full Stack Data Engineer',
            department: 'Engineering',
            location: 'Remote (Europe)',
            status: 'active',
            candidatesCount: 8,
            stagesCount: {
              sourcing: 4,
              screening: 2,
              interview: 1,
              assessment: 1,
              offer: 0
            },
            priority: 'high',
            daysOpen: 12,
            lastActivity: '1 day ago',
            targetHireDate: '2024-03-15'
          }
        ] : [
          {
            id: '1',
            title: 'Senior Full Stack Developer',
            department: 'Engineering',
            location: 'Zurich, Switzerland',
            status: 'active',
            candidatesCount: 12,
            stagesCount: {
              sourcing: 3,
              screening: 4,
              interview: 3,
              assessment: 1,
              offer: 1
            },
            priority: 'high',
            daysOpen: 15,
            lastActivity: '2 hours ago',
            targetHireDate: '2024-03-15'
          },
          {
            id: '2',
            title: 'Product Manager',
            department: 'Product',
            location: 'Remote',
            status: 'active',
            candidatesCount: 8,
            stagesCount: {
              sourcing: 2,
              screening: 3,
              interview: 2,
              assessment: 1,
              offer: 0
            },
            priority: 'medium',
            daysOpen: 8,
            lastActivity: '1 day ago',
            targetHireDate: '2024-04-01'
          },
          {
            id: '3',
            title: 'UX Designer',
            department: 'Design',
            location: 'Basel, Switzerland',
            status: 'active',
            candidatesCount: 6,
            stagesCount: {
              sourcing: 4,
              screening: 1,
              interview: 1,
              assessment: 0,
              offer: 0
            },
            priority: 'low',
            daysOpen: 22,
            lastActivity: '3 days ago'
          }
        ],
        recentActivity: clientId === 'client-dataflow-innovations' ? [
          {
            id: '1',
            type: 'candidate_added',
            jobId: '1',
            jobTitle: 'Senior Data Engineer - MongoDB',
            candidateName: 'Marcus Weber',
            message: 'Excellent MongoDB architect with 9 years experience added to pipeline',
            timestamp: '3 hours ago'
          },
          {
            id: '2',
            type: 'stage_change',
            jobId: '2',
            jobTitle: 'Data Engineer - TypeScript/SQL',
            candidateName: 'Elena Popovich',
            message: 'Moved to Interview stage - technical skills verified',
            timestamp: '5 hours ago',
            requiresAttention: true
          },
          {
            id: '3',
            type: 'assessment_completed',
            jobId: '1',
            jobTitle: 'Senior Data Engineer - MongoDB',
            candidateName: 'David Martinez',
            message: 'MongoDB performance assessment completed - 95% score',
            timestamp: '1 day ago',
            requiresAttention: true
          },
          {
            id: '4',
            type: 'candidate_added',
            jobId: '3',
            jobTitle: 'Full Stack Data Engineer',
            candidateName: 'Ana Kristoffersen',
            message: 'ETL pipeline specialist with strong TypeScript background',
            timestamp: '1 day ago'
          },
          {
            id: '5',
            type: 'interview_scheduled',
            jobId: '2',
            jobTitle: 'Data Engineer - TypeScript/SQL',
            candidateName: 'Sarah Johnson',
            message: 'Technical interview scheduled for tomorrow 2 PM',
            timestamp: '2 days ago'
          }
        ] : [
          {
            id: '1',
            type: 'candidate_added',
            jobId: '1',
            jobTitle: 'Senior Full Stack Developer',
            candidateName: 'Alex Mueller',
            message: 'New candidate added to pipeline',
            timestamp: '2 hours ago'
          },
          {
            id: '2',
            type: 'stage_change',
            jobId: '1',
            jobTitle: 'Senior Full Stack Developer',
            candidateName: 'Emma Schmidt',
            message: 'Moved to Interview stage',
            timestamp: '4 hours ago',
            requiresAttention: true
          },
          {
            id: '3',
            type: 'assessment_completed',
            jobId: '2',
            jobTitle: 'Product Manager',
            candidateName: 'David Chen',
            message: 'Technical assessment completed - awaiting your review',
            timestamp: '1 day ago',
            requiresAttention: true
          }
        ],
        metrics: clientId === 'client-dataflow-innovations' ? {
          totalCandidates: 35,
          interviewsScheduled: 8,
          pendingFeedback: 3,
          offersExtended: 2
        } : {
          totalCandidates: 26,
          interviewsScheduled: 6,
          pendingFeedback: 4,
          offersExtended: 1
        }
      };

      setTimeout(() => {
        setPortalData(mockData);
        setLoading(false);
      }, 1000);
    };

    fetchPortalData();
  }, [clientId]);

  const filteredJobs = portalData?.activeJobs.filter(job => 
    activeFilter === 'all' || job.priority === activeFilter
  ) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'candidate_added': return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'stage_change': return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'assessment_completed': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'interview_scheduled': return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!portalData) return null;

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                Welcome back, {portalData.client.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Track your recruitment pipeline and collaborate with our team
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Candidates</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{portalData.metrics.totalCandidates}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Across all active positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Interviews Scheduled</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{portalData.metrics.interviewsScheduled}</p>
                </div>
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Next 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Feedback</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{portalData.metrics.pendingFeedback}</p>
                </div>
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Awaiting your input</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Offers Extended</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{portalData.metrics.offersExtended}</p>
                </div>
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Pending acceptance</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Active Jobs */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <h2 className="text-lg font-semibold">Active Positions</h2>
                  
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    {/* Quick Search */}
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search positions..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      />
                    </div>
                    
                    {/* Priority Filter */}
                    <div className="flex rounded-lg border border-gray-300">
                      {['all', 'high', 'medium', 'low'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setActiveFilter(filter as any)}
                          className={`px-2 sm:px-3 py-1 text-xs font-medium capitalize ${
                            activeFilter === filter
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-500 hover:text-gray-700'
                          } transition-colors`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0 sm:mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{job.title}</h3>
                            <Badge className={`${getPriorityColor(job.priority)} text-xs`}>
                              {job.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {job.candidatesCount} candidates
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            {job.department} • {job.location}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                            <span>{job.daysOpen} days open</span>
                            <span>Last activity: {job.lastActivity}</span>
                            {job.targetHireDate && (
                              <span>Target: {job.targetHireDate}</span>
                            )}
                          </div>
                        </div>
                        <Link href={`/clients/${clientId}/portal/jobs/${job.id}`} className="w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            View Pipeline
                          </Button>
                        </Link>
                      </div>

                      {/* Pipeline Stage Indicators */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        {Object.entries(job.stagesCount).map(([stage, count]) => (
                          <div key={stage} className="flex items-center space-x-1">
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${count > 0 ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                            <span className="text-xs text-gray-600 capitalize">{stage}</span>
                            <span className="text-xs font-medium text-gray-900">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link href={`/clients/${clientId}/portal/jobs`}>
                    <Button variant="outline" fullWidth>
                      View All Positions
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Recent Activity</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {portalData.recentActivity.map((activity) => (
                    <div key={activity.id} className={`p-2 sm:p-3 rounded-lg ${activity.requiresAttention ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.jobTitle} {activity.candidateName && `• ${activity.candidateName}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                        </div>
                        {activity.requiresAttention && (
                          <div className="flex-shrink-0">
                            <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                              Review
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link href={`/clients/${clientId}/portal/activity`}>
                    <Button variant="outline" fullWidth>
                      View All Activity
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Link href={`/clients/${clientId}/portal/candidates`}>
                <div className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mb-2 sm:mb-3" />
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Review Candidates</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Rank and provide feedback</p>
                </div>
              </Link>

              <Link href={`/clients/${clientId}/portal/assessments`}>
                <div className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-2 sm:mb-3" />
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Manage Assessments</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Set requirements and review results</p>
                </div>
              </Link>

              <Link href={`/clients/${clientId}/portal/interviews`}>
                <div className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <Video className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 mb-2 sm:mb-3" />
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Schedule Interviews</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Coordinate interview times</p>
                </div>
              </Link>

              <Link href={`/clients/${clientId}/portal/communications`}>
                <div className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mb-2 sm:mb-3" />
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Communications</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Chat with your recruitment team</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 