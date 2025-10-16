'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { 
  ArrowLeft,
  Users, 
  Briefcase, 
  Calendar,
  MapPin,
  Edit,
  Share2,
  Building2,
  Target,
  Eye,
  CheckCircle2,
  Activity,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  MoreVertical,
  FileText,
  Clock
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description?: string;
  status: string;
  isRemote: boolean;
  location?: string;
  requirements: string[];
  seniorityLevel?: string;
  createdAt: string;
  applications: Array<{
    id: string;
    status: string;
    candidate: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      currentTitle?: string;
    };
  }>;
  _count: {
    applications: number;
  };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  clientName: string;
  totalPositions: number;
  filledPositions: number;
  urgencyLevel: string;
  status: string;
  location?: string;
  skillsRequired: string[];
  createdAt: string;
  jobs: Job[];
  candidates: Array<{
    id: string;
    status: string;
    candidate: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      currentTitle?: string;
    };
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    createdAt: string;
  }>;
  _count: {
    jobs: number;
    candidates: number;
    activities: number;
  };
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PUBLISHED': return 'bg-blue-100 text-blue-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
          <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.push('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
              <Badge className={getStatusColor(project.urgencyLevel)}>{project.urgencyLevel}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {project.clientName}
              </span>
              {project.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {project.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Positions</p>
                <p className="text-2xl font-bold text-gray-900">{project.totalPositions}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jobs Created</p>
                <p className="text-2xl font-bold text-gray-900">{project._count.jobs}</p>
              </div>
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Candidates</p>
                <p className="text-2xl font-bold text-gray-900">{project._count.candidates}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((project.filledPositions / project.totalPositions) * 100)}%
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'jobs', label: 'Jobs', count: project._count.jobs },
              { key: 'candidates', label: 'Candidates', count: project._count.candidates },
              { key: 'activity', label: 'Activity', count: project._count.activities },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm $\{
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - Jobs */}
        <div className="mt-6">
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              {project.jobs.length === 0 ? (
                <Card className="p-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs created yet</h3>
                  <p className="text-gray-600">Jobs will appear here when they are created for this project.</p>
                </Card>
              ) : (
                project.jobs.map((job) => (
                  <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.isRemote ? 'Remote' : job.location || 'Office'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {job._count.applications} applications
                          </span>
                        </div>

                        {job.description && (
                          <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                        )}

                        {job.requirements.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {job.requirements.slice(0, 5).map((req, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                {req}
                              </span>
                            ))}
                            {job.requirements.length > 5 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                +{job.requirements.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/jobs/${job.id}`)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Job
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
