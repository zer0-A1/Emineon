#!/usr/bin/env node

/**
 * 🧪 LOGO UPLOAD TESTING SCRIPT
 * 
 * Tests logo upload functionality for production deployment
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTION_URL = 'https://app-emineon-ev5r7gkyt-david-bicrawais-projects.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Create a simple test image (1x1 PNG)
function createTestImage() {
  // Base64 encoded 1x1 transparent PNG
  const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
  return Buffer.from(base64PNG, 'base64');
}

async function testLogoUpload(baseUrl, testName) {
  log(`\n🧪 Testing ${testName}...`, 'cyan');
  
  try {
    // Test GET endpoint first
    log('📋 Testing GET endpoint...', 'blue');
    const getResponse = await fetch(`${baseUrl}/api/competence-files/test-logo-upload`);
    const getResult = await getResponse.json();
    
    if (getResponse.ok) {
      log('✅ GET endpoint working', 'green');
      log(`   Status: ${getResult.status}`, 'blue');
      log(`   Endpoint: ${getResult.endpoint}`, 'blue');
    } else {
      log('❌ GET endpoint failed', 'red');
      return false;
    }

    // Test POST with file upload
    log('📤 Testing POST with file upload...', 'blue');
    
    // Create FormData with test image
    const formData = new FormData();
    const testImageBuffer = createTestImage();
    const testFile = new File([testImageBuffer], 'test-logo.png', { type: 'image/png' });
    formData.append('file', testFile);

    const postResponse = await fetch(`${baseUrl}/api/competence-files/test-logo-upload`, {
      method: 'POST',
      body: formData,
    });

    const postResult = await postResponse.json();

    if (postResponse.ok && postResult.success) {
      log('✅ Logo upload successful!', 'green');
      log(`   Logo URL: ${postResult.data.logoUrl}`, 'green');
      log(`   File size: ${postResult.data.fileSize} bytes`, 'blue');
      log(`   File type: ${postResult.data.fileType}`, 'blue');
      return true;
    } else {
      log('❌ Logo upload failed', 'red');
      log(`   Error: ${postResult.error || 'Unknown error'}`, 'red');
      log(`   Message: ${postResult.message || 'No message'}`, 'red');
      if (postResult.details) {
        log(`   Details: ${postResult.details}`, 'yellow');
      }
      return false;
    }

  } catch (error) {
    log(`❌ Test failed with error: ${error.message}`, 'red');
    return false;
  }
}

async function testAuthenticatedUpload(baseUrl, testName) {
  log(`\n🔐 Testing ${testName} (with auth)...`, 'cyan');
  
  try {
    // Test the authenticated endpoint
    const formData = new FormData();
    const testImageBuffer = createTestImage();
    const testFile = new File([testImageBuffer], 'auth-test-logo.png', { type: 'image/png' });
    formData.append('file', testFile);

    const response = await fetch(`${baseUrl}/api/competence-files/upload-logo`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (response.status === 401) {
      log('✅ Authentication working correctly (401 Unauthorized)', 'green');
      log(`   Message: ${result.message}`, 'blue');
      return true;
    } else if (response.ok && result.success) {
      log('✅ Authenticated upload successful!', 'green');
      log(`   Logo URL: ${result.data.logoUrl}`, 'green');
      return true;
    } else {
      log('❌ Unexpected response from authenticated endpoint', 'red');
      log(`   Status: ${response.status}`, 'red');
      log(`   Error: ${result.error || 'Unknown error'}`, 'red');
      return false;
    }

  } catch (error) {
    log(`❌ Auth test failed with error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('🚀 LOGO UPLOAD TESTING SUITE', 'bright');
  log('================================', 'bright');
  
  const results = [];

  // Test production deployment
  log('\n📡 Testing Production Deployment...', 'magenta');
  const prodTest = await testLogoUpload(PRODUCTION_URL, 'Production Test Upload');
  results.push({ name: 'Production Test Upload', success: prodTest });

  const prodAuthTest = await testAuthenticatedUpload(PRODUCTION_URL, 'Production Auth Test');
  results.push({ name: 'Production Auth Test', success: prodAuthTest });

  // Test local development (if available)
  try {
    const healthCheck = await fetch(`${LOCAL_URL}/api/health`);
    if (healthCheck.ok) {
      log('\n🏠 Testing Local Development...', 'magenta');
      const localTest = await testLogoUpload(LOCAL_URL, 'Local Test Upload');
      results.push({ name: 'Local Test Upload', success: localTest });
    }
  } catch (error) {
    log('\n⚠️ Local development server not available', 'yellow');
  }

  // Summary
  log('\n📊 TEST RESULTS SUMMARY', 'bright');
  log('========================', 'bright');
  
  let passedTests = 0;
  let totalTests = results.length;

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
    if (result.success) passedTests++;
  });

  log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 All logo upload tests passed! The fix is working correctly.', 'green');
  } else {
    log('\n⚠️ Some tests failed. Please check the error messages above.', 'yellow');
  }

  return passedTests === totalTests;
}

// Run the tests
runTests().catch(error => {
  log(`💥 Test suite failed: ${error.message}`, 'red');
  process.exit(1);
}); 