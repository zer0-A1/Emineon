'use client';

import { useState } from 'react';
import { 
  X, 
  Search, 
  Check, 
  Building2, 
  MapPin, 
  Calendar, 
  DollarSign,
  Users,
  Star,
  Clock,
  Briefcase
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  workMode: string;
  status: string;
  priority: string;
  salary?: string;
  postedDate: string;
  candidatesCount: number;
  description: string;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  currentRole: string;
  skills: string[];
}

interface AddToJobModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onAddToJob: (jobId: string, candidateId: string) => void;
}

// Mock active jobs data
const mockActiveJobs: Job[] = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'UBS Investment Bank',
    location: 'Zurich, Switzerland',
    contractType: 'Permanent',
    workMode: 'Hybrid',
    status: 'Active',
    priority: 'High',
    salary: 'CHF 120,000 - 150,000',
    postedDate: '2024-01-15',
    candidatesCount: 24,
    description: 'Looking for an experienced React developer to join our frontend team.'
  },
  {
    id: '2',
    title: 'Backend Engineer (Python)',
    company: 'Credit Suisse',
    location: 'Geneva, Switzerland',
    contractType: 'Permanent',
    workMode: 'Remote',
    status: 'Active',
    priority: 'Medium',
    salary: 'CHF 110,000 - 140,000',
    postedDate: '2024-01-10',
    candidatesCount: 18,
    description: 'Python backend engineer for financial services platform.'
  },
  {
    id: '3',
    title: 'Full Stack Developer',
    company: 'Nestlé Digital',
    location: 'Lausanne, Switzerland',
    contractType: 'Fixed-term',
    workMode: 'On-site',
    status: 'Active',
    priority: 'High',
    salary: 'CHF 100,000 - 130,000',
    postedDate: '2024-01-12',
    candidatesCount: 12,
    description: 'Full stack developer for consumer goods e-commerce platform.'
  },
  {
    id: '4',
    title: 'DevOps Engineer',
    company: 'Roche Pharmaceuticals',
    location: 'Basel, Switzerland',
    contractType: 'Permanent',
    workMode: 'Hybrid',
    status: 'Active',
    priority: 'Medium',
    salary: 'CHF 115,000 - 145,000',
    postedDate: '2024-01-08',
    candidatesCount: 8,
    description: 'DevOps engineer to support pharmaceutical research platforms.'
  },
  {
    id: '5',
    title: 'Lead Software Architect',
    company: 'ABB Technology',
    location: 'Baden, Switzerland',
    contractType: 'Permanent',
    workMode: 'Hybrid',
    status: 'Active',
    priority: 'High',
    salary: 'CHF 150,000 - 180,000',
    postedDate: '2024-01-05',
    candidatesCount: 6,
    description: 'Technical lead for industrial automation software systems.'
  }
];

export function AddToJobModal({ isOpen, candidate, onClose, onAddToJob }: AddToJobModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !candidate) return null;

  const filteredJobs = mockActiveJobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedJobId) return;
    
    setIsSubmitting(true);
    
    try {
      await onAddToJob(selectedJobId, candidate.id);
      onClose();
      setSelectedJobId(null);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding candidate to job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSkillMatch = (jobTitle: string, candidateSkills: string[]) => {
    const jobKeywords = jobTitle.toLowerCase().split(' ');
    const matches = candidateSkills.filter(skill => 
      jobKeywords.some(keyword => skill.toLowerCase().includes(keyword) || keyword.includes(skill.toLowerCase()))
    );
    return Math.min(matches.length, 3); // Cap at 3 for display
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add to Job</h2>
              <p className="text-gray-600 mt-1">
                Add <span className="font-medium">{candidate.firstName} {candidate.lastName}</span> to an active job position
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title, company, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Candidate Summary */}
          <div className="p-6 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                {candidate.firstName[0]}{candidate.lastName[0]}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{candidate.firstName} {candidate.lastName}</h3>
                <p className="text-sm text-gray-600">{candidate.currentRole}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {candidate.skills.slice(0, 4).map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                  {candidate.skills.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{candidate.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'No active jobs available'}
                  </p>
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const skillMatch = getSkillMatch(job.title, candidate.skills);
                  const isSelected = selectedJobId === job.id;
                  
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-primary-600 border-primary-600 text-white' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>

                      <div className="pr-8">
                        {/* Job Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 mr-1" />
                                {job.company}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.location}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                              {job.priority} Priority
                            </span>
                            {skillMatch > 0 && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                {skillMatch} skill{skillMatch > 1 ? 's' : ''} match
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Briefcase className="h-4 w-4 mr-2" />
                            <span>{job.contractType}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{job.workMode}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span>{job.salary}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{job.candidatesCount} candidates</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3">{job.description}</p>

                        {/* Posted Date */}
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedJobId ? 'Job selected' : 'Select a job to continue'}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedJobId || isSubmitting}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    selectedJobId && !isSubmitting
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Adding...' : 'Add to Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 