interface VideoMetadata {
  duration: number;
  resolution: {
    width: number;
    height: number;
  };
  fileSize: number;
  format: string;
  bitrate?: number;
  frameRate?: number;
}

interface VideoUploadOptions {
  candidateId: string;
  title?: string;
  description?: string;
  generateThumbnail?: boolean;
  maxDuration?: number; // in seconds
  maxFileSize?: number; // in bytes
}

interface VideoProcessingResult {
  url: string;
  thumbnailUrl?: string;
  metadata: VideoMetadata;
  publicId: string;
}

class VideoService {
  private readonly maxDuration = 300; // 5 minutes max
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB max
  private readonly allowedFormats = ['mp4', 'webm', 'mov', 'avi'];

  private readonly CLOUDINARY_CONFIG = {
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  /**
   * Validate video file before upload
   */
  validateVideo(file: File, options?: Partial<VideoUploadOptions>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxDuration = options?.maxDuration || this.maxDuration;
    const maxFileSize = options?.maxFileSize || this.maxFileSize;

    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxFileSize)})`);
    }

    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.allowedFormats.includes(extension)) {
      errors.push(`Format .${extension} not supported. Allowed formats: ${this.allowedFormats.join(', ')}`);
    }

    // Check MIME type
    if (!file.type.startsWith('video/')) {
      errors.push('File must be a video file');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract video metadata using JavaScript
   */
  async extractMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          resolution: {
            width: video.videoWidth,
            height: video.videoHeight
          },
          fileSize: file.size,
          format: file.type,
        });
      };

      video.onerror = () => {
        reject(new Error('Failed to extract video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate video thumbnail
   */
  async generateThumbnail(file: File, timeSeconds: number = 1): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      };

      video.onseeked = () => {
        try {
          ctx.drawImage(video, 0, 0);
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to generate thumbnail'));
      };

      video.src = URL.createObjectURL(file);
      video.currentTime = timeSeconds;
    });
  }

  /**
   * Upload video to cloud storage (Cloudinary)
   */
  async uploadVideo(
    file: File, 
    options: VideoUploadOptions
  ): Promise<VideoProcessingResult> {
    // Validate file first
    const validation = this.validateVideo(file, options);
    if (!validation.valid) {
      throw new Error(`Video validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      // Extract metadata
      const metadata = await this.extractMetadata(file);

      // Check duration
      if (metadata.duration > (options.maxDuration || this.maxDuration)) {
        throw new Error(`Video duration (${Math.round(metadata.duration)}s) exceeds maximum allowed duration (${options.maxDuration || this.maxDuration}s)`);
      }

      // Generate thumbnail if requested
      let thumbnailUrl: string | undefined;
      if (options.generateThumbnail) {
        try {
          const thumbnailDataUrl = await this.generateThumbnail(file);
          // In a real implementation, you would upload this thumbnail to storage
          thumbnailUrl = thumbnailDataUrl; // For demo purposes
        } catch (error) {
          console.warn('Failed to generate thumbnail:', error);
        }
      }

      // Prepare upload data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'emineon_videos'); // Configure in Cloudinary
      formData.append('folder', `emineon-ats/candidate-videos/${options.candidateId}`);
      
      if (options.title) {
        formData.append('context', `title=${options.title}`);
      }

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload video to cloud storage');
      }

      const result = await response.json();

      // If thumbnail wasn't generated locally, use Cloudinary's auto-generated thumbnail
      if (!thumbnailUrl && result.public_id) {
        thumbnailUrl = `https://res.cloudinary.com/emineon/video/upload/${result.public_id}.jpg`;
      }

      return {
        url: result.secure_url,
        thumbnailUrl,
        metadata: {
          ...metadata,
          duration: result.duration || metadata.duration,
          resolution: {
            width: result.width || metadata.resolution.width,
            height: result.height || metadata.resolution.height,
          },
          bitrate: result.bit_rate,
          frameRate: result.frame_rate,
        },
        publicId: result.public_id,
      };

    } catch (error) {
      console.error('Video upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete video from cloud storage
   */
  async deleteVideo(publicId: string): Promise<boolean> {
    try {
      // In a real implementation, you would call Cloudinary's destroy API
      // This requires server-side implementation due to security
      console.log('Deleting video with public ID:', publicId);
      
      const response = await fetch('/api/videos/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete video:', error);
      return false;
    }
  }

  /**
   * Get optimized video URL for different quality levels
   */
  getOptimizedVideoUrl(
    publicId: string, 
    quality: 'auto' | 'low' | 'medium' | 'high' = 'auto',
    format: 'mp4' | 'webm' = 'mp4'
  ): string {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    let qualityParam = '';
    switch (quality) {
      case 'low':
        qualityParam = 'q_30,w_480';
        break;
      case 'medium':
        qualityParam = 'q_50,w_720';
        break;
      case 'high':
        qualityParam = 'q_80,w_1080';
        break;
      default:
        qualityParam = 'q_auto,w_auto';
    }

    return `https://res.cloudinary.com/${cloudName}/video/upload/${qualityParam},f_${format}/${publicId}`;
  }

  /**
   * Generate video thumbnail URL
   */
  getThumbnailUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      timeOffset?: number; // seconds into video
      quality?: 'auto' | 'low' | 'medium' | 'high';
    } = {}
  ): string {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const { width = 400, height = 300, timeOffset = 1, quality = 'auto' } = options;
    
    return `https://res.cloudinary.com/${cloudName}/video/upload/so_${timeOffset},w_${width},h_${height},c_fill,q_${quality}/${publicId}.jpg`;
  }

  /**
   * Check if browser supports video format
   */
  checkVideoSupport(): {
    mp4: boolean;
    webm: boolean;
    canPlay: boolean;
  } {
    const video = document.createElement('video');
    
    return {
      mp4: video.canPlayType('video/mp4') !== '',
      webm: video.canPlayType('video/webm') !== '',
      canPlay: video.canPlayType !== undefined,
    };
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Create video preview for upload interface
   */
  createVideoPreview(file: File): Promise<{
    previewUrl: string;
    cleanup: () => void;
  }> {
    return new Promise((resolve) => {
      const previewUrl = URL.createObjectURL(file);
      
      resolve({
        previewUrl,
        cleanup: () => URL.revokeObjectURL(previewUrl)
      });
    });
  }

  /**
   * Compress video for mobile upload (client-side)
   */
  async compressVideo(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: string;
    } = {}
  ): Promise<Blob> {
    // This is a simplified implementation
    // In production, you might use libraries like ffmpeg.wasm
    const { maxWidth = 720, maxHeight = 720, quality = 0.7, format = 'mp4' } = options;
    
    // For now, return the original file
    // In a real implementation, you would use video compression
    console.log('Video compression would be applied here', { maxWidth, maxHeight, quality, format });
    return file;
  }
}

// Export singleton instance
export const videoService = new VideoService();

// Export types
export type { 
  VideoMetadata, 
  VideoUploadOptions, 
  VideoProcessingResult 
}; 