'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users, Clock, AlertCircle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJobSocket } from '@/hooks/useWebSocket';
import { performanceMonitor } from '@/lib/monitoring/performance';
import { usePerformance } from '@/lib/monitoring/use-performance';

interface Candidate {
  id: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentTitle?: string;
  currentLocation?: string;
  stage: string;
  appliedAt?: Date;
  profileToken?: string;
  matchingScore?: number;
}

interface Stage {
  id: string;
  name: string;
  candidates: Candidate[];
}

interface OptimisticUpdate {
  applicationId: string;
  fromStage: string;
  toStage: string;
  timestamp: number;
}

interface OptimisticPipelineKanbanProps {
  jobId: string;
  initialCandidates: Candidate[];
  stages: string[];
  onCandidateClick?: (candidate: Candidate) => void;
  onStageChange?: (candidateId: string, newStage: string) => void;
  readOnly?: boolean;
}

export function OptimisticPipelineKanban({
  jobId,
  initialCandidates,
  stages,
  onCandidateClick,
  onStageChange,
  readOnly = false,
}: OptimisticPipelineKanbanProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, OptimisticUpdate>>(new Map());
  const [isUpdating, setIsUpdating] = useState(false);
  const socket = useJobSocket(jobId);
  const { measureOperation } = usePerformance('OptimisticPipelineKanban');

  // Subscribe to real-time updates
  useEffect(() => {
    if (!socket.connected) return;

    const handlePipelineUpdate = (data: any) => {
      measureOperation('handlePipelineUpdate', async () => {
        // Remove optimistic update as it's now confirmed
        setOptimisticUpdates(prev => {
          const next = new Map(prev);
          next.delete(data.applicationId);
          return next;
        });

        // Update candidate with server data
        setCandidates(prev => prev.map(candidate => 
          candidate.applicationId === data.applicationId
            ? { ...candidate, stage: data.newStage }
            : candidate
        ));
      });
    };

    const handleCandidateAdded = (data: any) => {
      measureOperation('handleCandidateAdded', async () => {
        const newCandidate: Candidate = {
          id: data.application.candidateId,
          applicationId: data.application.id,
          firstName: data.application.candidate.firstName,
          lastName: data.application.candidate.lastName,
          email: data.application.candidate.email,
          currentTitle: data.application.candidate.currentTitle,
          currentLocation: data.application.candidate.currentLocation,
          stage: data.application.stage,
          appliedAt: new Date(data.application.createdAt),
          profileToken: data.application.candidate.profileToken,
        };

        setCandidates(prev => [...prev, newCandidate]);
      });
    };

    const handleBatchUpdate = (data: any) => {
      measureOperation('handleBatchUpdate', async () => {
        if (data.updates.stage) {
          setCandidates(prev => prev.map(candidate =>
            data.applicationIds.includes(candidate.applicationId)
              ? { ...candidate, stage: data.updates.stage }
              : candidate
          ));
        }
      });
    };

    const unsubscribePipeline = socket.on('pipeline:updated', handlePipelineUpdate);
    const unsubscribeAdded = socket.on('candidate:added', handleCandidateAdded);
    const unsubscribeBatch = socket.on('candidates:batch:updated', handleBatchUpdate);

    return () => {
      unsubscribePipeline();
      unsubscribeAdded();
      unsubscribeBatch();
    };
  }, [socket, measureOperation]);

  // Process candidates into stages with optimistic updates
  const stageData = useMemo(() => {
    return stages.map(stageName => {
      const stageCandidates = candidates
        .filter(candidate => {
          // Check if there's an optimistic update
          const optimisticUpdate = optimisticUpdates.get(candidate.applicationId);
          if (optimisticUpdate) {
            return optimisticUpdate.toStage === stageName;
          }
          return candidate.stage === stageName;
        })
        .sort((a, b) => {
          // Sort by match score if available, otherwise by applied date
          if (a.matchingScore !== undefined && b.matchingScore !== undefined) {
            return b.matchingScore - a.matchingScore;
          }
          const dateA = a.appliedAt?.getTime() || 0;
          const dateB = b.appliedAt?.getTime() || 0;
          return dateB - dateA;
        });

      return {
        id: stageName,
        name: stageName,
        candidates: stageCandidates,
      };
    });
  }, [candidates, stages, optimisticUpdates]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || readOnly) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const candidateId = draggableId;
    const candidate = candidates.find(c => c.applicationId === candidateId);
    if (!candidate) return;

    const fromStage = source.droppableId;
    const toStage = destination.droppableId;

    // Apply optimistic update immediately
    const optimisticUpdate: OptimisticUpdate = {
      applicationId: candidateId,
      fromStage,
      toStage,
      timestamp: Date.now(),
    };

    setOptimisticUpdates(prev => new Map(prev).set(candidateId, optimisticUpdate));
    setIsUpdating(true);

    try {
      // Emit socket event for real-time update
      socket.emit('candidate:move', {
        applicationId: candidateId,
        jobId,
        newStage: toStage,
        candidateId: candidate.id,
      });

      // Call parent handler if provided
      if (onStageChange) {
        await measureOperation('onStageChange', async () => {
          onStageChange(candidate.id, toStage);
        });
      }
    } catch (error) {
      console.error('Failed to move candidate:', error);
      
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const next = new Map(prev);
        next.delete(candidateId);
        return next;
      });
      
      // Show error message (you can integrate with your toast system)
      alert('Failed to move candidate. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }, [candidates, readOnly, socket, jobId, onStageChange, measureOperation]);

  // Clean up old optimistic updates (older than 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOptimisticUpdates(prev => {
        const next = new Map(prev);
        let hasChanges = false;
        
        next.forEach((update, key) => {
          if (now - update.timestamp > 30000) { // 30 seconds
            next.delete(key);
            hasChanges = true;
          }
        });
        
        return hasChanges ? next : prev;
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" data-test="pipeline-kanban">
        {stageData.map((stage, index) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium capitalize">{stage.name}</h3>
                <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {stage.candidates.length}
                </span>
              </div>
              {index < stageData.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            <Droppable droppableId={stage.id} isDropDisabled={readOnly}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "min-h-[500px] rounded-lg border-2 border-dashed p-3 transition-colors",
                    snapshot.isDraggingOver 
                      ? "border-primary bg-primary/5" 
                      : "border-border",
                    readOnly && "opacity-60"
                  )}
                  data-test="pipeline-stage"
                >
                  {stage.candidates.map((candidate, index) => {
                    const hasOptimisticUpdate = optimisticUpdates.has(candidate.applicationId);
                    
                    return (
                      <Draggable
                        key={candidate.applicationId}
                        draggableId={candidate.applicationId}
                        index={index}
                        isDragDisabled={readOnly}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: hasOptimisticUpdate ? 0.7 : 1,
                            }}
                            className={cn(
                              "mb-2 transition-all",
                              hasOptimisticUpdate && "animate-pulse"
                            )}
                          >
                            <Card
                              className={cn(
                                "p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary",
                                snapshot.isDragging && "shadow-lg ring-2 ring-primary",
                                hasOptimisticUpdate && "ring-1 ring-primary/50"
                              )}
                              onClick={() => !snapshot.isDragging && onCandidateClick?.(candidate)}
                              data-test="candidate-card"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm">
                                      {candidate.firstName} {candidate.lastName}
                                    </h4>
                                    {candidate.currentTitle && (
                                      <p className="text-xs text-muted-foreground">
                                        {candidate.currentTitle}
                                      </p>
                                    )}
                                  </div>
                                  {hasOptimisticUpdate && (
                                    <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                                  )}
                                </div>
                                
                                {candidate.currentLocation && (
                                  <p className="text-xs text-muted-foreground">
                                    📍 {candidate.currentLocation}
                                  </p>
                                )}
                                
                                {candidate.matchingScore !== undefined && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Target className="h-3 w-3" />
                                    <span className="font-medium">
                                      {candidate.matchingScore}% match
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {candidate.appliedAt 
                                      ? new Date(candidate.appliedAt).toLocaleDateString()
                                      : 'Recently added'
                                    }
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  
                  {stage.candidates.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p>No candidates in this stage</p>
                      {!readOnly && (
                        <p className="text-xs mt-1">Drag candidates here</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
      
      {isUpdating && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-sm">Updating pipeline...</span>
        </div>
      )}
    </DragDropContext>
  );
}
