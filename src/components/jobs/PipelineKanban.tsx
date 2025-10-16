'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Star, 
  MapPin, 
  Clock, 
  Briefcase, 
  Mail, 
  Calendar, 
  MessageSquare,
  User,
  Phone,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ChevronDown
} from 'lucide-react';

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
  expectedSalary?: string;
  noticePeriod?: string;
  tags: string[];
  timeline: Array<{
    date: string;
    action: string;
    type: string;
  }>;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  count: number;
  description?: string;
}

interface PipelineKanbanProps {
  candidates: Candidate[];
  stages: PipelineStage[];
  onCandidateMove: (candidateId: string, newStage: string) => void;
  onCandidateSelect: (candidate: Candidate) => void;
  onAddCandidate: () => void;
  onCandidateRemove?: (candidateId: string) => void;
  AddCandidateComponent?: () => React.ReactElement;
  onStageEdit?: (stageId: string) => void;
  onStageDelete?: (stageId: string) => void;
  onFileDrop?: (stageId: string, file: File) => void;
}

/**
 * PipelineKanban Component
 * 
 * A drag-and-drop Kanban board for managing candidates through recruitment pipeline stages.
 * Features:
 * - Drag and drop candidates between stages
 * - Visual feedback during drag operations
 * - Custom drag image for better UX
 * - Real-time stage updates
 * - Search and filter functionality
 * 
 * @param candidates - Array of candidate objects
 * @param stages - Array of pipeline stage objects
 * @param onCandidateMove - Callback when candidate is moved to new stage
 * @param onCandidateSelect - Callback when candidate card is clicked
 * @param onAddCandidate - Callback when add candidate button is clicked
 */
export function PipelineKanban({ 
  candidates, 
  stages, 
  onCandidateMove, 
  onCandidateSelect, 
  onAddCandidate,
  onCandidateRemove,
  AddCandidateComponent,
  onStageEdit,
  onStageDelete,
  onFileDrop
}: PipelineKanbanProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Ensure newly added candidates are collapsed by default
  useEffect(() => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      candidates.forEach((c) => {
        if (!next.has(c.id)) next.add(c.id);
      });
      // Optionally prune removed candidates
      for (const id of Array.from(next)) {
        if (!candidates.find((c) => c.id === id)) next.delete(id);
      }
      return next;
    });
  }, [candidates]);

  // No stage menu; deletion handled via inline X button

  const isCollapsed = (id: string) => collapsedIds.has(id);
  const toggleCollapsed = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const expandAll = () => setCollapsedIds(new Set());
  const collapseAll = () => setCollapsedIds(new Set(candidates.map((c) => c.id)));

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.currentRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = selectedStage === 'all' || candidate.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const getCandidatesByStage = useCallback((stageId: string) => {
    return filteredCandidates.filter(candidate => candidate.stage === stageId);
  }, [filteredCandidates]);

  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    setDraggedCandidate(candidateId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', candidateId);
    
    // Find the candidate data
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      // Create a custom drag image
      const dragImage = document.createElement('div');
      dragImage.className = 'bg-white p-3 rounded-lg shadow-lg border-2 border-primary-400 max-w-xs';
      dragImage.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
            ${candidate.firstName[0]}${candidate.lastName[0]}
          </div>
          <div>
            <div class="font-medium text-gray-900 text-sm">${candidate.firstName} ${candidate.lastName}</div>
            <div class="text-xs text-gray-500">${candidate.currentRole}</div>
          </div>
        </div>
      `;
      
      // Add to body temporarily
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.left = '-1000px';
      document.body.appendChild(dragImage);
      
      // Set as drag image
      e.dataTransfer.setDragImage(dragImage, 75, 30);
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 100);
    }
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the stage area
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    // If a file is dropped, forward to onFileDrop
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      const file = dt.files[0];
      if (file && onFileDrop) {
        onFileDrop(stageId, file);
        setDraggedCandidate(null);
        setDragOverStage(null);
        return;
      }
    }

    if (draggedCandidate) {
      // Find the candidate to check if they're already in this stage
      const candidate = candidates.find(c => c.id === draggedCandidate);
      
      if (candidate && candidate.stage !== stageId) {
        console.log(`Moving candidate ${draggedCandidate} from ${candidate.stage} to ${stageId}`);
        onCandidateMove(draggedCandidate, stageId);
      }
    }
    
    setDraggedCandidate(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedCandidate(null);
    setDragOverStage(null);
  };

  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case 'sourced': return User;
      case 'screened': return CheckCircle2;
      case 'interviewing': return MessageSquare;
      case 'submitted': return TrendingUp;
      case 'offer': return Award;
      case 'hired': return CheckCircle2;
      default: return User;
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'top talent': return 'bg-purple-100 text-purple-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'remote': return 'bg-blue-100 text-blue-800';
      case 'local': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show overall empty state if no candidates exist
  if (candidates.length === 0) {
    return (
      <div className="space-y-6">
        {/* Pipeline Controls - Simplified for empty state */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-2 text-gray-500">
              <User className="h-5 w-5" />
              <span className="font-medium">Candidate Pipeline</span>
            </div>
            {AddCandidateComponent ? (
              <AddCandidateComponent />
            ) : (
              <button 
                onClick={onAddCandidate}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Candidate
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start building your candidate pipeline by adding your first candidate. You can upload a CV, 
            import from LinkedIn, or create manually.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {AddCandidateComponent ? (
              <AddCandidateComponent />
            ) : (
              <button 
                onClick={onAddCandidate}
                className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Candidate
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates, skills, roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm w-64"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="all">All Stages ({filteredCandidates.length})</option>
                {stages.map(stage => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name} ({getCandidatesByStage(stage.id).length})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // If any collapsed, expand all; otherwise collapse all
                const anyCollapsed = candidates.some((c) => collapsedIds.has(c.id));
                if (anyCollapsed) expandAll(); else collapseAll();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              title="Expand/Collapse All"
            >
              {candidates.some((c) => collapsedIds.has(c.id)) ? 'Expand All' : 'Collapse All'}
            </button>
            {AddCandidateComponent ? (
              <AddCandidateComponent />
            ) : (
              <button 
                onClick={onAddCandidate}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Candidate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Summary removed per request */}

      {/* Kanban Board */}
      <div className="flex space-x-6 overflow-x-auto pb-6">
        {stages.map((stage) => {
          const stageCandidates = getCandidatesByStage(stage.id);
          const StageIcon = getStageIcon(stage.id);
          const isDropTarget = dragOverStage === stage.id;
          
          return (
            <div data-test="pipeline-stage" key={stage.id} className="flex-shrink-0 w-80">
              {/* Stage Header */}
              <div 
                className={`${stage.color} rounded-lg p-2 mb-2 border-2 transition-all relative ${
                  isDropTarget ? 'border-primary-400 border-dashed bg-primary-50' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <StageIcon className="h-4 w-4 text-gray-700" />
                    <h3 className="font-semibold text-gray-900 text-sm">{stage.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="bg-white px-1.5 py-0.5 rounded-full text-xs font-medium text-gray-600">
                      {stageCandidates.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const count = stageCandidates.length;
                        const warning = count > 0
                          ? `This stage contains ${count} candidate${count === 1 ? '' : 's'}. Deleting the stage will also delete these candidates from this job. Continue?`
                          : 'Delete this stage?';
                        const ok = typeof window !== 'undefined' ? window.confirm(warning) : true;
                        if (ok && onStageDelete) onStageDelete(stage.id);
                      }}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-white/60 rounded"
                      title="Delete stage"
                      aria-label="Delete stage"
                    >
                      {/* Minimalist Emineon-styled X */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Remove stage description to save vertical space */}
              </div>

              {/* Drop Zone */}
              <div
                className={`min-h-[200px] rounded-lg border-2 border-dashed transition-all ${
                  isDropTarget 
                    ? 'border-primary-400 bg-primary-50' 
                    : 'border-transparent'
                } ${draggedCandidate ? 'border-gray-300' : ''}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Candidate Cards */}
                <div className="space-y-3 p-2">
                  {stageCandidates.map((candidate) => (
                    <div
                      data-test="candidate-card"
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onCandidateSelect(candidate)}
                      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-move group relative border-l-4 border-l-primary-500 ${
                        draggedCandidate === candidate.id ? 'opacity-50 transform scale-95 shadow-lg border-primary-300' : ''
                      }`}
                    >
                      {/* Expand/Collapse Icon */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCollapsed(candidate.id); }}
                        className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
                        aria-label={isCollapsed(candidate.id) ? 'Expand card' : 'Collapse card'}
                        title={isCollapsed(candidate.id) ? 'Expand' : 'Collapse'}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${!isCollapsed(candidate.id) ? 'rotate-180' : ''}`} />
                      </button>
                      {/* Candidate Header */}
                      <div className="flex items-start justify-between mb-3 pr-8">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {candidate.firstName[0]}{candidate.lastName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {candidate.firstName} {candidate.lastName}
                            </h4>
                            <p className="text-sm text-gray-500 truncate">{candidate.currentRole}</p>
                            {/* Stars under role */}
                            <div className="mt-1 flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < candidate.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onCandidateRemove && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Remove ${candidate.firstName} ${candidate.lastName} from this job?`)) {
                                    onCandidateRemove(candidate.id);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Remove from job"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Removed 3-dots menu per request */}

                      {/* Candidate Details */}
                      {!isCollapsed(candidate.id) && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{candidate.currentLocation}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{candidate.availability}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{candidate.source} • {candidate.experience}</span>
                        </div>
                        {candidate.expectedSalary && (
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="truncate">💰 {candidate.expectedSalary}</span>
                          </div>
                        )}
                      </div>
                      )}

                      {/* Skills */}
                      {!isCollapsed(candidate.id) && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {candidate.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{candidate.skills.length - 3}
                          </span>
                        )}
                      </div>
                      )}

                      {/* Tags */}
                      {!isCollapsed(candidate.id) && candidate.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {candidate.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      {!isCollapsed(candidate.id) && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Last: {candidate.lastInteraction}
                        </span>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle email action
                            }}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          >
                            <Mail className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle calendar action
                            }}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          >
                            <Calendar className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle message action
                            }}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      )}

                      {/* Progress Indicator */}
                      {!isCollapsed(candidate.id) && candidate.notes && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800 border-l-2 border-yellow-400">
                          <div className="flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span className="truncate">{candidate.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty State */}
                  {stageCandidates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No candidates in {stage.name.toLowerCase()}</p>
                      {stage.id === 'sourced' && (
                        AddCandidateComponent ? (
                          <div className="mt-2">
                            <AddCandidateComponent />
                          </div>
                        ) : (
                          <button 
                            onClick={onAddCandidate}
                            className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                          >
                            Add your first candidate
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* Drop Target Indicator */}
                  {isDropTarget && draggedCandidate && (
                    <div className="flex items-center justify-center h-16 border-2 border-dashed border-primary-400 rounded-lg bg-primary-50 text-primary-600">
                      <div className="text-center">
                        <Plus className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">Drop here to move candidate</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Pipeline Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">Conversion Rate:</span>
            <span className="font-medium">23%</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600">Avg. Time to Hire:</span>
            <span className="font-medium">18 days</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-yellow-600" />
            <span className="text-gray-600">Avg. Rating:</span>
            <span className="font-medium">4.2/5</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-gray-600">At Risk:</span>
            <span className="font-medium">2 candidates</span>
          </div>
        </div>
      </div>
    </div>
  );
} 