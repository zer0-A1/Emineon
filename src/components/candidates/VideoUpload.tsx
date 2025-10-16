'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  Video, 
  X, 
  Play, 
  Pause, 
  RefreshCw, 
  Check, 
  AlertCircle,
  FileVideo,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { videoService } from '@/lib/videoService';

interface VideoUploadProps {
  candidateId: string;
  onUploadComplete?: (videoData: {
    url: string;
    thumbnailUrl: string;
    duration: number;
    publicId: string;
  }) => void;
  onUploadError?: (error: string) => void;
  maxDuration?: number; // in seconds
  maxFileSize?: number; // in bytes
  title?: string;
  description?: string;
}

interface UploadState {
  status: 'idle' | 'selecting' | 'preview' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function VideoUpload({
  candidateId,
  onUploadComplete,
  onUploadError,
  maxDuration = 300,
  maxFileSize = 100 * 1024 * 1024,
  title,
  description
}: VideoUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadState({ status: 'selecting', progress: 0 });

    try {
      // Validate file
      const validation = videoService.validateVideo(file, {
        maxDuration,
        maxFileSize
      });

      if (!validation.valid) {
        setUploadState({
          status: 'error',
          progress: 0,
          error: validation.errors.join(', ')
        });
        onUploadError?.(validation.errors.join(', '));
        return;
      }

      // Extract metadata
      const metadata = await videoService.extractMetadata(file);
      setVideoMetadata(metadata);

      // Create preview
      const preview = await videoService.createVideoPreview(file);
      setPreviewUrl(preview.previewUrl);
      setSelectedFile(file);

      setUploadState({ status: 'preview', progress: 0 });

    } catch (error) {
      const errorMessage = 'Failed to process video file';
      setUploadState({
        status: 'error',
        progress: 0,
        error: errorMessage
      });
      onUploadError?.(errorMessage);
    }
  }, [maxDuration, maxFileSize, onUploadError]);

  const handleUpload = async () => {
    if (!selectedFile || !candidateId) return;

    setUploadState({ status: 'uploading', progress: 0 });

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('candidateId', candidateId);
      
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadState(prev => ({ ...prev, progress }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setUploadState({ status: 'success', progress: 100 });
              onUploadComplete?.(response.data);
              resolve(response.data);
            } else {
              throw new Error(response.error || 'Upload failed');
            }
          } else {
            throw new Error(`Upload failed with status ${xhr.status}`);
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/videos/upload');
        xhr.send(formData);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({
        status: 'error',
        progress: 0,
        error: errorMessage
      });
      onUploadError?.(errorMessage);
    }
  };

  const handleReset = () => {
    setUploadState({ status: 'idle', progress: 0 });
    setSelectedFile(null);
    setPreviewUrl(null);
    setVideoMetadata(null);
    setIsPlaying(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      handleFileSelect(videoFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  if (uploadState.status === 'success') {
    return (
      <div className="text-center p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Video Uploaded Successfully!
        </h3>
        <p className="text-gray-600 mb-4">
          Your video presentation is now available in the client portal.
        </p>
        <Button onClick={handleReset} variant="outline">
          Upload Another Video
        </Button>
      </div>
    );
  }

  if (uploadState.status === 'preview' && previewUrl && videoMetadata) {
    return (
      <div className="space-y-6">
        {/* Video Preview */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={previewUrl}
            className="w-full h-64 object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Play/Pause Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="bg-black bg-opacity-50 text-white p-4 rounded-full hover:bg-opacity-70 transition-all"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Video Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Video Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Duration:</span>
              <span className="ml-2 font-medium">{formatDuration(videoMetadata.duration)}</span>
            </div>
            <div>
              <span className="text-gray-600">File Size:</span>
              <span className="ml-2 font-medium">{formatFileSize(videoMetadata.fileSize)}</span>
            </div>
            <div>
              <span className="text-gray-600">Resolution:</span>
              <span className="ml-2 font-medium">
                {videoMetadata.resolution.width} × {videoMetadata.resolution.height}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Format:</span>
              <span className="ml-2 font-medium">{videoMetadata.format}</span>
            </div>
          </div>
        </div>

        {/* Upload Controls */}
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleUpload}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
          
          <Button variant="outline" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (uploadState.status === 'uploading') {
    return (
      <div className="space-y-6">
        <div className="text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Uploading Video...
          </h3>
          <p className="text-gray-600 mb-4">
            {uploadState.progress}% complete
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadState.progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (uploadState.status === 'error') {
    return (
      <div className="text-center p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Failed
        </h3>
        <p className="text-gray-600 mb-4">
          {uploadState.error}
        </p>
        <Button onClick={handleReset} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
            <FileVideo className="h-8 w-8 text-gray-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Your Video Presentation
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your video file here, or click to browse
            </p>
            
            <div className="text-sm text-gray-500">
              <p>Supported formats: MP4, WebM, MOV, AVI</p>
              <p>Maximum size: {formatFileSize(maxFileSize)}</p>
              <p>Maximum duration: {formatDuration(maxDuration)}</p>
            </div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Video Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Record in portrait mode (9:16) for best mobile viewing</li>
              <li>• Ensure good lighting and clear audio</li>
              <li>• Keep your introduction concise and engaging</li>
              <li>• Highlight your key skills and experience</li>
              <li>• Practice beforehand to appear confident</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 