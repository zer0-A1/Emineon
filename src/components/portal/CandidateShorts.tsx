'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Heart, 
  MessageSquare, 
  Share2, 
  MoreVertical,
  Star,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Briefcase,
  ExternalLink,
  Download,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface CandidateVideo {
  id: string;
  candidateId: string;
  candidateName: string;
  currentRole: string;
  location: string;
  experience: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  title: string;
  description: string;
  skills: string[];
  clientRating?: number;
  competenceFileUrl?: string;
  linkedinUrl?: string;
  fit: {
    technical: number;
    cultural: number;
    overall: number;
  };
  uploadedAt: string;
}

interface CandidateShortsProps {
  jobId: string;
  candidates: CandidateVideo[];
  onRate: (candidateId: string, rating: number) => void;
  onComment: (candidateId: string, comment: string) => void;
  onShare: (candidateId: string) => void;
  onClose: () => void;
}

export default function CandidateShorts({ 
  jobId, 
  candidates, 
  onRate, 
  onComment, 
  onShare,
  onClose 
}: CandidateShortsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [videoProgress, setVideoProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentCandidate = candidates[currentIndex];

  // Handle video controls
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  // Auto-play when video is ready
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const handleCanPlay = () => {
        setIsPlaying(true);
      };
      
      const handleTimeUpdate = () => {
        if (video.duration) {
          setVideoProgress((video.currentTime / video.duration) * 100);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setVideoProgress(0);
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handlePrevious();
      }
      if (e.key === 'ArrowRight' && currentIndex < candidates.length - 1) {
        handleNext();
      }
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isPlaying, candidates.length]);

  const handleVideoClick = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentIndex < candidates.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
      setVideoProgress(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
      setVideoProgress(0);
    }
  };

  const handleRating = (rating: number) => {
    onRate(currentCandidate.candidateId, rating);
  };

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      onComment(currentCandidate.candidateId, newComment);
      setNewComment('');
      setShowComments(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentCandidate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-white text-center">
          <p className="text-lg">No candidate videos available</p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-black/60" />
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black bg-opacity-60 rounded-full p-3 text-white hover:bg-opacity-80 transition-all"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Emineon Logo */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center space-x-2 bg-black bg-opacity-60 rounded-full px-4 py-2 backdrop-blur-sm">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-white font-semibold text-sm">Emineon</span>
        </div>
      </div>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 z-10 bg-white bg-opacity-10 backdrop-blur-sm rounded-full p-4 text-white hover:bg-opacity-20 transition-all shadow-lg"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Next button */}
      {currentIndex < candidates.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 z-10 bg-white bg-opacity-10 backdrop-blur-sm rounded-full p-4 text-white hover:bg-opacity-20 transition-all shadow-lg"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Main video container - Mobile 16:9 aspect ratio */}
      <div className="relative w-full max-w-sm mx-auto" style={{ aspectRatio: '9/16' }}>
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl h-full relative">
          
          {/* Video Player */}
          <video
            ref={videoRef}
            src={currentCandidate.videoUrl}
            poster={currentCandidate.thumbnailUrl}
            className="w-full h-full object-cover cursor-pointer"
            onClick={handleVideoClick}
            muted={isMuted}
            loop
            playsInline
          />

          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
              <div className="bg-primary-500 bg-opacity-80 rounded-full p-4 shadow-lg">
                <Play className="h-12 w-12 text-white ml-1" />
              </div>
            </div>
          )}

          {/* Video Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600 bg-opacity-50">
            <div 
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${videoProgress}%` }}
            />
          </div>

          {/* Top info overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{currentCandidate.candidateName}</p>
                  <p className="text-xs text-gray-300">
                    {currentIndex + 1} of {candidates.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="bg-black bg-opacity-40 rounded-full p-2 backdrop-blur-sm hover:bg-opacity-60 transition-all"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <div className="bg-black bg-opacity-40 rounded-full px-2 py-1 backdrop-blur-sm">
                  <span className="text-xs">{formatDuration(currentCandidate.duration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <div className="text-white space-y-3">
              {/* Candidate Info */}
              <div>
                <h3 className="text-lg font-bold">{currentCandidate.candidateName}</h3>
                <p className="text-gray-300 text-sm">{currentCandidate.currentRole}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{currentCandidate.location}</span>
                  <span>•</span>
                  <Briefcase className="h-3 w-3" />
                  <span>{currentCandidate.experience}</span>
                </div>
              </div>

              {/* Video Title */}
              <div>
                <p className="font-medium text-sm">{currentCandidate.title}</p>
                <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                  {currentCandidate.description}
                </p>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1">
                {currentCandidate.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} className="bg-primary-500 bg-opacity-80 text-white border-none text-xs px-2 py-0.5">
                    {skill}
                  </Badge>
                ))}
                {currentCandidate.skills.length > 3 && (
                  <Badge className="bg-gray-500 bg-opacity-80 text-white border-none text-xs px-2 py-0.5">
                    +{currentCandidate.skills.length - 3}
                  </Badge>
                )}
              </div>

              {/* Fit Score */}
              <div className="bg-black bg-opacity-50 rounded-lg p-2 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Overall Fit</span>
                  <span className="font-bold text-primary-300">{currentCandidate.fit.overall}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      currentCandidate.fit.overall >= 80 ? 'bg-green-500' :
                      currentCandidate.fit.overall >= 60 ? 'bg-yellow-500' : 'bg-red-400'
                    }`}
                    style={{ width: `${currentCandidate.fit.overall}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side Actions */}
          <div className="absolute right-2 bottom-20 flex flex-col space-y-3">
            {/* Star Rating */}
            <div className="flex flex-col items-center space-y-1">
              <div className="bg-black bg-opacity-50 rounded-full p-2 backdrop-blur-sm">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div className="flex space-x-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className={`h-3 w-3 transition-all ${
                      currentCandidate.clientRating && star <= currentCandidate.clientRating
                        ? 'text-yellow-400'
                        : 'text-gray-400'
                    } hover:scale-110`}
                  >
                    <Star className="h-full w-full fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Button */}
            <div className="flex flex-col items-center">
              <button 
                onClick={() => setShowComments(!showComments)}
                className="bg-black bg-opacity-50 rounded-full p-2 backdrop-blur-sm hover:bg-opacity-70 transition-all"
              >
                <MessageSquare className="h-5 w-5 text-white" />
              </button>
              <span className="text-white text-xs mt-1">Comment</span>
            </div>

            {/* Share Button */}
            <div className="flex flex-col items-center">
              <button 
                onClick={() => onShare(currentCandidate.candidateId)}
                className="bg-black bg-opacity-50 rounded-full p-2 backdrop-blur-sm hover:bg-opacity-70 transition-all"
              >
                <Share2 className="h-5 w-5 text-white" />
              </button>
              <span className="text-white text-xs mt-1">Share</span>
            </div>

            {/* Download Competence File */}
            {currentCandidate.competenceFileUrl && (
              <div className="flex flex-col items-center">
                <a 
                  href={currentCandidate.competenceFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black bg-opacity-50 rounded-full p-2 backdrop-blur-sm hover:bg-opacity-70 transition-all"
                >
                  <Download className="h-5 w-5 text-white" />
                </a>
                <span className="text-white text-xs mt-1">CV</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Comment</h3>
              <button 
                onClick={() => setShowComments(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this candidate..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4 resize-none"
              rows={4}
            />
            
            <div className="flex items-center justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowComments(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCommentSubmit}
                disabled={!newComment.trim()}
                className="bg-primary-500 hover:bg-primary-600"
              >
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
        <div className="bg-black bg-opacity-40 rounded-full px-4 py-2 backdrop-blur-sm">
          <p className="text-xs">Use ← → arrows or side buttons to navigate • Space to play/pause • ESC to close</p>
        </div>
      </div>
    </div>
  );
} 