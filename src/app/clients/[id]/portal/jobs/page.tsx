'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Search,
  Filter,
  Plus,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle,
  Eye,
  Star,
  ChevronDown,
  SortAsc,
  SortDesc,
  Grid,
  List,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Job {
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
  salaryRange?: string;
  description: string;
  hiringManager: string;
  recruiter: string;
}

interface JobsPageData {
  jobs: Job[];
  summary: {
    totalJobs: number;
    activeJobs: number;
    totalCandidates: number;
    averageDaysOpen: number;
    pendingActions: number;
  };
}

export default function ClientJobsPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [jobsData, setJobsData] = useState<JobsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'filled'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'daysOpen' | 'candidates' | 'lastActivity'>('lastActivity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for demo
  useEffect(() => {
    const mockData: JobsPageData = {
      jobs: [
        {
          id: '1',
          title: 'Senior Full Stack Developer',
          department: 'Engineering',
          location: 'Zurich, Switzerland',
          status: 'active',
          candidatesCount: 12,
          stagesCount: { sourcing: 3, screening: 4, interview: 3, assessment: 1, offer: 1 },
          priority: 'high',
          daysOpen: 15,
          lastActivity: '2 hours ago',
          targetHireDate: '2024-03-15',
          salaryRange: '100,000 - 130,000 CHF',
          description: 'We are seeking a talented Senior Full Stack Developer...',
          hiringManager: 'Thomas Weber',
          recruiter: 'Lisa Martinez'
        },
        {
          id: '2',
          title: 'Product Manager',
          department: 'Product',
          location: 'Remote',
          status: 'active',
          candidatesCount: 8,
          stagesCount: { sourcing: 2, screening: 3, interview: 2, assessment: 1, offer: 0 },
          priority: 'medium',
          daysOpen: 8,
          lastActivity: '1 day ago',
          targetHireDate: '2024-04-01',
          salaryRange: '90,000 - 110,000 CHF',
          description: 'Looking for an experienced Product Manager...',
          hiringManager: 'Sarah Johnson',
          recruiter: 'Mike Chen'
        },
        {
          id: '3',
          title: 'UX Designer',
          department: 'Design',
          location: 'Basel, Switzerland',
          status: 'active',
          candidatesCount: 6,
          stagesCount: { sourcing: 4, screening: 1, interview: 1, assessment: 0, offer: 0 },
          priority: 'low',
          daysOpen: 22,
          lastActivity: '3 days ago',
          salaryRange: '75,000 - 95,000 CHF',
          description: 'Seeking a creative UX Designer...',
          hiringManager: 'Emma Rodriguez',
          recruiter: 'Lisa Martinez'
        },
        {
          id: '4',
          title: 'DevOps Engineer',
          department: 'Engineering',
          location: 'Zurich, Switzerland',
          status: 'paused',
          candidatesCount: 4,
          stagesCount: { sourcing: 2, screening: 1, interview: 1, assessment: 0, offer: 0 },
          priority: 'medium',
          daysOpen: 45,
          lastActivity: '1 week ago',
          salaryRange: '95,000 - 120,000 CHF',
          description: 'Infrastructure specialist needed...',
          hiringManager: 'Alex Turner',
          recruiter: 'Mike Chen'
        },
        {
          id: '5',
          title: 'Marketing Director',
          department: 'Marketing',
          location: 'Geneva, Switzerland',
          status: 'active',
          candidatesCount: 15,
          stagesCount: { sourcing: 5, screening: 6, interview: 3, assessment: 1, offer: 0 },
          priority: 'high',
          daysOpen: 30,
          lastActivity: '5 hours ago',
          targetHireDate: '2024-03-30',
          salaryRange: '120,000 - 150,000 CHF',
          description: 'Strategic marketing leadership role...',
          hiringManager: 'David Kim',
          recruiter: 'Lisa Martinez'
        }
      ],
      summary: {
        totalJobs: 5,
        activeJobs: 4,
        totalCandidates: 45,
        averageDaysOpen: 24,
        pendingActions: 7
      }
    };

    setTimeout(() => {
      setJobsData(mockData);
      setLoading(false);
    }, 1000);
  }, [clientId]);

  // Filter and search logic
  const filteredJobs = jobsData?.jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  }) || [];

  // Sort logic
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'daysOpen':
        aValue = a.daysOpen;
        bValue = b.daysOpen;
        break;
      case 'candidates':
        aValue = a.candidatesCount;
        bValue = b.candidatesCount;
        break;
      case 'lastActivity':
        aValue = a.lastActivity;
        bValue = b.lastActivity;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const departments = Array.from(new Set(jobsData?.jobs.map(job => job.department) || []));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'filled': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6 p-4 sm:p-6">
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

  if (!jobsData) return null;

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Active Positions</h1>
            <p className="text-gray-600 mt-1">Manage and monitor your hiring pipeline</p>
          </div>
          <Link href={`/clients/${clientId}/portal`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Jobs</p>
                <p className="text-lg sm:text-xl font-bold">{jobsData.summary.totalJobs}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Active</p>
                <p className="text-lg sm:text-xl font-bold">{jobsData.summary.activeJobs}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Candidates</p>
                <p className="text-lg sm:text-xl font-bold">{jobsData.summary.totalCandidates}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Avg Days</p>
                <p className="text-lg sm:text-xl font-bold">{jobsData.summary.averageDaysOpen}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                <p className="text-lg sm:text-xl font-bold">{jobsData.summary.pendingActions}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search positions by title, department, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm sm:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>

                {/* Active filters count */}
                {(statusFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all') && (
                  <Badge variant="outline" className="text-xs">
                    {[statusFilter, priorityFilter, departmentFilter].filter(f => f !== 'all').length} active
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'} hover:bg-gray-50 transition-colors rounded-l-lg`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'} hover:bg-gray-50 transition-colors rounded-r-lg`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* Sort */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as any);
                  }}
                  className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="lastActivity-desc">Recent Activity</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="daysOpen-asc">Days Open (Low)</option>
                  <option value="daysOpen-desc">Days Open (High)</option>
                  <option value="candidates-desc">Most Candidates</option>
                  <option value="candidates-asc">Least Candidates</option>
                </select>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="filled">Filled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Results */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <p className="text-sm text-gray-600">
            Showing {sortedJobs.length} of {jobsData.jobs.length} positions
          </p>
        </div>

        {/* Jobs Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {sortedJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-medium transition-all duration-200 cursor-pointer group">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate text-sm sm:text-base">
                          {job.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{job.department}</p>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(job.status)} text-xs`}>{job.status}</Badge>
                    </div>

                    {/* Priority and Candidates */}
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getPriorityColor(job.priority)} text-xs`}>{job.priority}</Badge>
                      <Badge variant="outline" className="text-xs">{job.candidatesCount} candidates</Badge>
                    </div>

                    {/* Pipeline Indicators */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Pipeline Progress</p>
                      <div className="flex items-center space-x-1">
                        {Object.entries(job.stagesCount).map(([stage, count]) => (
                          <div key={stage} className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${count > 0 ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                            <span className="text-xs text-gray-600">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {job.daysOpen} days open
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {job.lastActivity}
                      </div>
                    </div>

                    {/* Action */}
                    <Link href={`/clients/${clientId}/portal/jobs/${job.id}`}>
                      <Button variant="outline" size="sm" className="w-full group-hover:bg-primary-50 group-hover:border-primary-200 transition-colors text-xs sm:text-sm">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        View Pipeline
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {sortedJobs.map((job) => (
                  <div key={job.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors text-sm sm:text-base">
                            {job.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">{job.department} • {job.location}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge className={`${getStatusColor(job.status)} text-xs`}>{job.status}</Badge>
                          <Badge className={`${getPriorityColor(job.priority)} text-xs`}>{job.priority}</Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {job.candidatesCount} candidates
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {job.daysOpen} days open
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {job.lastActivity}
                        </span>
                        {job.targetHireDate && (
                          <span className="flex items-center">
                            <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Target: {job.targetHireDate}
                          </span>
                        )}
                      </div>

                      {/* Pipeline Progress */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="text-xs font-medium text-gray-700">Pipeline:</span>
                        {Object.entries(job.stagesCount).map(([stage, count]) => (
                          <div key={stage} className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${count > 0 ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                            <span className="text-xs text-gray-600 capitalize">{stage}</span>
                            <span className="text-xs font-medium text-gray-900">{count}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <Link href={`/clients/${clientId}/portal/jobs/${job.id}`}>
                          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            View Pipeline
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {sortedJobs.length === 0 && (
          <Card className="text-center py-8 sm:py-12">
            <CardContent>
              <Briefcase className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No positions found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all'
                  ? 'Try adjusting your search or filters to find more positions.'
                  : 'No active positions at the moment.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setDepartmentFilter('all');
                  }}
                  className="text-sm"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
} 