const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary (same as in cloudinary-config.ts)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'emineon';
const apiKey = process.env.CLOUDINARY_API_KEY || '452814944399829';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'c1vCg07L1avVzo-WludXlXhYgDs';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

async function uploadIcon(iconPath, iconName) {
  try {
    console.log(`📤 Uploading ${iconName}...`);
    
    const result = await cloudinary.uploader.upload(iconPath, {
      resource_type: 'image',
      folder: 'emineon-ats/icons',
      public_id: iconName.replace('.png', ''),
      overwrite: true,
      quality: 'auto',
      format: 'png'
    });
    
    console.log(`✅ ${iconName} uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error uploading ${iconName}:`, error);
    throw error;
  }
}

async function uploadAllIcons() {
  const iconsDir = path.join(__dirname, '../outlook-addin/icons');
  const iconSizes = [16, 25, 32, 48, 80, 128];
  
  console.log('🚀 Starting icon upload to Cloudinary...');
  
  const urls = {};
  
  for (const size of iconSizes) {
    const iconPath = path.join(iconsDir, `emineon-${size}.png`);
    const iconName = `emineon-${size}`;
    
    if (fs.existsSync(iconPath)) {
      const url = await uploadIcon(iconPath, `${iconName}.png`);
      urls[`icon${size}`] = url;
    } else {
      console.warn(`⚠️ Icon file not found: ${iconPath}`);
    }
  }
  
  console.log('\n🎉 All icons uploaded successfully!');
  console.log('📋 URLs for manifest:');
  Object.entries(urls).forEach(([key, url]) => {
    console.log(`${key}: ${url}`);
  });
  
  return urls;
}

// Run the upload
if (require.main === module) {
  uploadAllIcons().catch(console.error);
}

module.exports = { uploadAllIcons }; 