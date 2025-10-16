import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables
console.log('🔧 Configuring Cloudinary...');

// Check if CLOUDINARY_URL is available (single URL format)
if (process.env.CLOUDINARY_URL) {
  console.log('✅ Using CLOUDINARY_URL configuration');
  // Cloudinary will automatically parse the CLOUDINARY_URL
} else {
  // Fallback to individual environment variables
  console.log('🔧 Using individual environment variables');
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'emineon';
  const apiKey = process.env.CLOUDINARY_API_KEY || '452814944399829';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'c1vCg07L1avVzo-WludXlXhYgDs';
  
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  
  console.log('🔧 Cloudinary configured with:', {
    cloud_name: cloudName,
    api_key: apiKey ? apiKey.substring(0, 5) + '...' : 'not set',
    api_secret: apiSecret ? '***' : 'not set'
  });
}

// Verify configuration
const config = cloudinary.config();
console.log('✅ Cloudinary config verified:', { 
  cloud_name: config.cloud_name,
  api_key: config.api_key ? config.api_key.substring(0, 5) + '...' : 'not set'
});

export const uploadToCloudinary = async (
  buffer: Buffer,
  filename: string,
  folder: string = 'competence-files'
): Promise<{ url: string; publicId: string }> => {
  console.log('📤 Attempting upload to cloud_name:', cloudinary.config().cloud_name);
  
  // Validate configuration before upload
  const currentConfig = cloudinary.config();
  if (!currentConfig.cloud_name || !currentConfig.api_key || !currentConfig.api_secret) {
    throw new Error('Cloudinary configuration is incomplete. Please check environment variables.');
  }
  
  // Determine resource type based on file extension
  const fileExtension = filename.toLowerCase().split('.').pop();
  let resourceType: 'auto' | 'raw' | 'image' | 'video' = 'auto';
  
  // For PDFs and other documents, use 'raw' to preserve binary integrity
  if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
    resourceType = 'raw';
    console.log('📄 Uploading as raw file type for PDF/document');
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '')) {
    resourceType = 'image';
    console.log('🖼️ Uploading as image file type');
  } else {
    resourceType = 'auto';
    console.log('🔄 Using auto detection for file type');
  }
  
  // Remove extension from public_id to avoid double extensions
  const publicId = filename.replace(/\.[^/.]+$/, '');
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: `emineon-ats/${folder}`,
        public_id: publicId,
        overwrite: true,
        type: 'upload',
        invalidate: true,
        // For raw files, don't apply any transformations
        ...(resourceType === 'raw' && { 
          format: fileExtension,
          flags: 'attachment' // This ensures proper download behavior
        })
      },
      (error: any, result: any) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary upload successful:', result.secure_url);
          resolve({
            url: result!.secure_url,
            publicId: result!.public_id
          });
        }
      }
    ).end(buffer);
  });
};

export const uploadImageToCloudinary = async (
  buffer: Buffer,
  filename: string,
  transformations?: any[]
): Promise<{ url: string; publicId: string }> => {
  console.log('📤 Uploading image to Cloudinary...');
  
  // Validate configuration before upload
  const currentConfig = cloudinary.config();
  if (!currentConfig.cloud_name || !currentConfig.api_key || !currentConfig.api_secret) {
    throw new Error('Cloudinary configuration is incomplete. Please check environment variables.');
  }
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'emineon-ats/images',
        public_id: filename,
        overwrite: true,
        transformation: transformations || [
          { width: 400, height: 400, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      },
      (error: any, result: any) => {
        if (error) {
          console.error('❌ Cloudinary image upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary image upload successful:', result.secure_url);
          resolve({
            url: result!.secure_url,
            publicId: result!.public_id
          });
        }
      }
    ).end(buffer);
  });
};

export default cloudinary; 