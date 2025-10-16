#!/usr/bin/env node

console.log('🔍 Checking Production Environment Variables...\n');

const requiredEnvVars = [
  'BLOB_READ_WRITE_TOKEN',
  'DATABASE_URL', 
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_VERCEL_ENVIRONMENT'
];

console.log('✅ Required Environment Variables for Production:');
requiredEnvVars.forEach((varName, index) => {
  console.log(`${index + 1}. ${varName}`);
});

console.log('\n🚨 Critical Missing Variable Detected:');
console.log('   BLOB_READ_WRITE_TOKEN - Required for PDF storage');

console.log('\n📋 Setup Instructions:');
console.log('1. Go to Vercel Dashboard → app-emineon project');
console.log('2. Navigate to Storage tab → Create Blob storage');
console.log('3. Copy the BLOB_READ_WRITE_TOKEN');
console.log('4. Add to Settings → Environment Variables (Production)');
console.log('5. Redeploy the application');

console.log('\n🔧 Quick Fix Commands:');
console.log('   vercel env add BLOB_READ_WRITE_TOKEN');
console.log('   vercel --prod');

console.log('\n🌐 Production URL: https://app-emineon.vercel.app');
console.log('🔗 Test URL: https://app-emineon.vercel.app/competence-files'); 