#!/usr/bin/env node

/**
 * Environment Variable Check
 * Verifies the correct CHROMIUM_REMOTE_EXEC_PATH value
 */

console.log('🔧 CHROMIUM ENVIRONMENT VARIABLE CHECK');
console.log('=====================================');
console.log('');

console.log('📋 Current package versions:');
console.log('- @sparticuz/chromium-min: 137.0.0');
console.log('- puppeteer-core: 24.10.1');
console.log('');

console.log('✅ CORRECT Environment Variable:');
console.log('CHROMIUM_REMOTE_EXEC_PATH=https://github.com/Sparticuz/chromium/releases/download/v137.0.0/chromium-v137.0.0-pack.tar');
console.log('');

console.log('📝 Alternative URLs (if the above doesn\'t work):');
console.log('- https://github.com/Sparticuz/chromium/releases/download/v137.0.0/chromium-v137.0.0-pack.x64.tar');
console.log('- https://github.com/Sparticuz/chromium/releases/download/v137.0.0/chromium-v137.0.0-pack.arm64.tar');
console.log('');

console.log('⚠️  Note: Make sure to update this in Vercel environment variables');
console.log('🔗 Vercel Dashboard: https://vercel.com/dashboard');
console.log('');

console.log('🧪 Testing current production setup...');

// Test the current production endpoint
const https = require('https');

function testCurrentSetup() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'app-emineon.vercel.app',
      port: 443,
      path: '/api/competence-files/test-generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    };

    const testData = {
      candidateData: {
        id: "env-check",
        fullName: "Environment Check",
        currentTitle: "Test",
        email: "test@env.com",
        phone: "555-TEST",
        location: "Test City",
        yearsOfExperience: 1,
        skills: ["Testing"],
        certifications: [],
        experience: [],
        education: [],
        languages: ["English"],
        summary: "Environment variable test"
      },
      format: "pdf"
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(JSON.stringify(testData));
    req.end();
  });
}

testCurrentSetup()
  .then(result => {
    if (result.status === 200 && result.data.success) {
      if (result.data.url && result.data.url.includes('.pdf')) {
        console.log('✅ PDF Generation is working correctly!');
        console.log(`📄 Generated: ${result.data.url}`);
      } else {
        console.log('⚠️  HTML fallback is being used - environment variable needs updating');
        console.log(`📄 Generated: ${result.data.url || 'No URL returned'}`);
      }
    } else {
      console.log('❌ PDF Generation failed');
      console.log(`📝 Response: ${JSON.stringify(result.data, null, 2)}`);
    }
  })
  .catch(error => {
    console.log('❌ Test failed:', error.message);
  }); 