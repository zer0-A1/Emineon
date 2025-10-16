#!/usr/bin/env node

/**
 * Quick Deployment Status Check
 * Verifies that the new PDF service is deployed and working
 */

const https = require('https');

const PRODUCTION_URL = 'https://app-emineon.vercel.app';

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Deployment-Check/1.0'
      },
      timeout: 10000
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function checkDeployment() {
  console.log('🔍 Checking deployment status...');
  console.log(`🌐 URL: ${PRODUCTION_URL}`);
  console.log('');

  try {
    // Check health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await makeRequest(`${PRODUCTION_URL}/api/health`);
    
    if (healthResponse.statusCode === 200) {
      console.log('✅ Health endpoint: OK');
    } else {
      console.log(`❌ Health endpoint failed: ${healthResponse.statusCode}`);
      return false;
    }

    // Quick PDF test
    console.log('\n2️⃣ Testing PDF generation...');
    const testData = {
      candidateData: {
        id: "deployment-check",
        fullName: "Deployment Test",
        currentTitle: "Test Engineer",
        email: "test@deployment.com",
        phone: "123-456-7890",
        location: "Test City",
        yearsOfExperience: 1,
        skills: ["Testing"],
        certifications: [],
        experience: [{
          company: "Test Co",
          title: "Tester",
          startDate: "2024-01",
          endDate: "Present",
          responsibilities: "Testing deployment"
        }],
        education: ["Test Degree"],
        languages: ["English"],
        summary: "Quick deployment test"
      },
      format: "pdf"
    };

    const pdfResponse = await makeRequest(
      `${PRODUCTION_URL}/api/competence-files/test-generate`,
      'POST',
      testData
    );

    if (pdfResponse.statusCode === 200 && pdfResponse.body.success) {
      console.log('✅ PDF generation: OK');
      console.log(`📎 Generated: ${pdfResponse.body.url}`);
      console.log(`📏 Size: ${pdfResponse.body.size || 'Unknown'} bytes`);
    } else {
      console.log(`❌ PDF generation failed: ${pdfResponse.statusCode}`);
      console.log('Response:', pdfResponse.body);
      return false;
    }

    console.log('\n🎉 Deployment is ready and working!');
    console.log('\n📋 Next steps:');
    console.log('   • Run full test suite: node test-production-deployment.js');
    console.log('   • Add CHROMIUM_REMOTE_EXEC_PATH to Vercel environment variables');
    console.log('   • Test with complex PDFs and logo integration');
    
    return true;

  } catch (error) {
    console.log(`❌ Deployment check failed: ${error.message}`);
    return false;
  }
}

checkDeployment().then(success => {
  process.exit(success ? 0 : 1);
}); 