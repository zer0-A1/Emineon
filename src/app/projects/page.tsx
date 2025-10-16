'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Users, 
  FileText,
  Calendar,
  Edit3,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  List,
  Grid3X3,
  Briefcase,
  MapPin
} from 'lucide-react';
import { AnimatedPageTitle } from '@/components/ui/AnimatedPageTitle';

interface Project {
  id: string;
  name: string;
  description?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  totalPositions: number;
  filledPositions: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'PLANNING';
  location?: string;
  isRemote: boolean;
  isHybrid: boolean;
  skillsRequired: string[];
  budgetRange?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  candidatesSourced: number;
  candidatesScreened: number;
  candidatesInterviewed: number;
  candidatesPresented: number;
  candidatesHired: number;
  jobs: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
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
    createdAt: string;
  }>;
  _count: {
    jobs: number;
    candidates: number;
    activities: number;
    documents: number;
  };
}

// Utility function to create project summary
const getProjectSummary = (project: Project) => {
  if (!project.description) return '';
  
  // If this appears to be an email-based project, create a better summary
  if (project.description.includes('URGENT need') || project.description.includes('We have an') || project.description.length > 200) {
    const urgencyText = project.urgencyLevel === 'CRITICAL' ? 'Urgent requirement' : 'New requirement';
    const positionText = project.totalPositions > 1 ? `${project.totalPositions} positions` : '1 position';
    const skillsText = project.skillsRequired.length > 0 
      ? ` requiring ${project.skillsRequired.slice(0, 3).join(', ')}${project.skillsRequired.length > 3 ? ' +more' : ''}`
      : '';
    const locationText = project.location ? ` in ${project.location}` : '';
    
    return `${urgencyText} for ${positionText}${skillsText}${locationText} from ${project.clientName}.`;
  }
  
  // For regular projects, show truncated description
  return project.description.length > 150 
    ? `${project.description.substring(0, 150)}...` 
    : project.description;
};

// Project Actions Dropdown Component
const ProjectActionsDropdown = ({ project, onRefresh }: { project: Project; onRefresh: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      onRefresh();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2"
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Implement edit functionality
                  alert('Edit project functionality coming soon!');
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit3 className="w-4 h-4" />
                Edit Project
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowDeleteConfirm(true);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete Project
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "<strong>{project.name}</strong>"? 
              This will permanently remove the project and all associated data.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, urgencyFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (urgencyFilter) params.append('urgency', urgencyFilter);
      
      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const data = await response.json();
      // The API returns { success: true, data: [...] }
      setProjects(data.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on search query
  const filteredProjects = (projects || []).filter(project => {
    // Search logic
    const matchesSearch = !searchQuery.trim() || 
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.status?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    
    switch (selectedFilter) {
      case 'all':
        matchesFilter = true;
        break;
      case 'active':
        matchesFilter = project.status === 'ACTIVE';
        break;
      case 'critical':
        matchesFilter = project.urgencyLevel === 'CRITICAL';
        break;
      default:
        matchesFilter = true;
    }
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PLANNING': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = (project: Project) => {
    return project.totalPositions > 0 
      ? Math.round((project.filledPositions / project.totalPositions) * 100)
      : 0;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <AnimatedPageTitle title="Projects" Icon={Briefcase} />
              <p className="text-gray-600 mt-1">
                Manage multi-position recruitment projects and track progress
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={() => setShowCreateModal(true)}
                variant="primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { 
              label: 'Active Projects', 
              value: (projects || []).filter(p => p.status === 'ACTIVE').length, 
              change: '+8%', 
              icon: CheckCircle2, 
              filter: 'active',
              color: 'blue'
            },
            { 
              label: 'Critical Projects', 
              value: (projects || []).filter(p => p.urgencyLevel === 'CRITICAL').length, 
              change: '+2 this week', 
              icon: AlertCircle, 
              filter: 'critical',
              color: 'red'
            },
            { 
              label: 'Total Positions', 
              value: (projects || []).reduce((sum, p) => sum + p.totalPositions, 0), 
              change: '+23%', 
              icon: Users, 
              filter: null,
              color: 'green'
            },
            { 
              label: 'Filled Positions', 
              value: (projects || []).reduce((sum, p) => sum + p.filledPositions, 0), 
              change: '-2 positions', 
              icon: TrendingUp, 
              filter: null,
              color: 'purple'
            }
          ].map((stat, index) => (
            <Card 
              key={index} 
              className={`p-6 cursor-pointer hover:shadow-lg transition-all duration-200 ${
                stat.filter && selectedFilter === stat.filter ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => stat.filter && setSelectedFilter(selectedFilter === stat.filter ? 'all' : stat.filter)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm ${
                      stat.change.includes('+') ? 'text-green-600' : 
                      stat.change.includes('-') ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'red' ? 'bg-red-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                  'bg-purple-100'
                }`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'red' ? 'text-red-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    'text-purple-600'
                  }`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, clients, or skills..."
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filters and Actions */}
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="PLANNING">Planning</option>
            </select>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Urgency</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>

            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none border-0"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none border-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter || urgencyFilter
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first project'
                }
              </p>
              {!searchTerm && !statusFilter && !urgencyFilter && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              )}
            </Card>
          ) : (
            filteredProjects.map((project) => (
              <Card key={project.id} className="p-6 hover:shadow-lg glow-card transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      <Badge className={getUrgencyColor(project.urgencyLevel)}>
                        {project.urgencyLevel}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
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
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {getProjectSummary(project) && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {getProjectSummary(project)}
                      </p>
                    )}

                    {Array.isArray(project.skillsRequired) && project.skillsRequired.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.skillsRequired.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                        {project.skillsRequired.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                            +{project.skillsRequired.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <ProjectActionsDropdown 
                      project={project} 
                      onRefresh={fetchProjects} 
                    />
                  </div>
                </div>

                {/* Progress and Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {project.filledPositions}/{project.totalPositions} positions
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(project)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {getProgressPercentage(project)}% complete
                    </span>
                  </div>

                  {/* Pipeline Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {project._count.candidates}
                      </div>
                      <div className="text-xs text-gray-600">Candidates</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {project._count.jobs}
                      </div>
                      <div className="text-xs text-gray-600">Jobs</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Recent Activity
                    </div>
                    {Array.isArray(project.activities) && project.activities.length > 0 ? (
                      <div className="space-y-1">
                        {project.activities.slice(0, 2).map((activity) => (
                          <div key={activity.id} className="text-xs text-gray-600">
                            <span className="font-medium">{activity.title}</span>
                            <span className="ml-2 text-gray-500">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">No recent activity</div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Create Project Modal */}
        <CreateProjectModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </Layout>
  );
} 