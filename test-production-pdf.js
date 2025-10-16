#!/usr/bin/env node

/**
 * Production PDF Service Test
 * Tests the new serverless PDF generation in production
 */

const https = require('https');

const PRODUCTION_URL = 'https://app-emineon.vercel.app';
const TEST_TIMEOUT = 60000; // 60 seconds for serverless cold start

// Test candidate data
const testCandidate = {
  candidateData: {
    id: "prod-test-pdf",
    fullName: "Production PDF Test",
    currentTitle: "Software Engineer",
    email: "test@production.com",
    phone: "+1 555-PDF-TEST",
    location: "Production City",
    yearsOfExperience: 5,
    skills: ["JavaScript", "React", "Node.js", "PDF Generation"],
    certifications: ["Serverless Certification"],
    experience: [{
      company: "Production Co",
      title: "Senior Engineer",
      startDate: "2020-01",
      endDate: "Present",
      responsibilities: "Testing serverless PDF generation with Chromium"
    }],
    education: ["BS Computer Science"],
    languages: ["English"],
    summary: "Testing the new serverless PDF generation service in production"
  },
  format: "pdf"
};

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
        'User-Agent': 'Production-PDF-Test/1.0'
      },
      timeout: TEST_TIMEOUT
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
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

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testProductionPDF() {
  console.log('🚀 PRODUCTION PDF SERVICE TEST');
  console.log('============================================');
  console.log(`🌐 Testing: ${PRODUCTION_URL}`);
  console.log(`⏱️  Timeout: ${TEST_TIMEOUT}ms`);
  console.log(`📅 Started: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Endpoint...');
    const startTime1 = Date.now();
    const healthResult = await makeRequest(`${PRODUCTION_URL}/api/health`);
    const responseTime1 = Date.now() - startTime1;
    
    if (healthResult.status === 200) {
      console.log(`✅ Health Check - SUCCESS (${responseTime1}ms)`);
      console.log(`💬 Message: ${healthResult.data.message || 'OK'}`);
    } else {
      console.log(`❌ Health Check - FAILED (${healthResult.status})`);
      console.log(`📝 Response: ${JSON.stringify(healthResult.data, null, 2)}`);
    }
    console.log('');

    // Test 2: PDF Generation with Serverless Chromium
    console.log('2️⃣ Testing PDF Generation (Serverless Chromium)...');
    console.log('📋 Sending candidate data...');
    console.log(`👤 Candidate: ${testCandidate.candidateData.fullName}`);
    console.log('⏳ This may take 30-60 seconds for cold start...');
    
    const startTime2 = Date.now();
    const pdfResult = await makeRequest(
      `${PRODUCTION_URL}/api/competence-files/test-generate`,
      'POST',
      testCandidate
    );
    const responseTime2 = Date.now() - startTime2;
    
    if (pdfResult.status === 200 && pdfResult.data.success) {
      console.log(`✅ PDF Generation - SUCCESS (${responseTime2}ms)`);
      console.log(`📄 PDF URL: ${pdfResult.data.url}`);
      console.log(`📊 File Size: ${pdfResult.data.size || 'Unknown'} bytes`);
      console.log(`🔧 Environment: ${pdfResult.data.environment || 'Unknown'}`);
      
      if (pdfResult.data.url && pdfResult.data.url.includes('.pdf')) {
        console.log('✅ PDF file generated successfully');
      } else {
        console.log('⚠️  HTML fallback was used (PDF generation may have failed)');
      }
    } else {
      console.log(`❌ PDF Generation - FAILED (${pdfResult.status})`);
      console.log(`📝 Response: ${JSON.stringify(pdfResult.data, null, 2)}`);
    }
    console.log('');

    // Test 3: Environment Variable Check
    console.log('3️⃣ Testing Environment Configuration...');
    const envTestCandidate = {
      candidateData: {
        id: "env-test",
        fullName: "Environment Test",
        currentTitle: "Test Engineer",
        email: "env@test.com",
        phone: "555-ENV-TEST",
        location: "Test City",
        yearsOfExperience: 1,
        skills: ["Testing"],
        certifications: [],
        experience: [{
          company: "Test Co",
          title: "Tester",
          startDate: "2024-01",
          endDate: "Present",
          responsibilities: "Testing environment variables"
        }],
        education: ["Test Degree"],
        languages: ["English"],
        summary: "Testing environment variable configuration"
      },
      format: "pdf"
    };

    const startTime3 = Date.now();
    const envResult = await makeRequest(
      `${PRODUCTION_URL}/api/competence-files/test-generate`,
      'POST',
      envTestCandidate
    );
    const responseTime3 = Date.now() - startTime3;

    if (envResult.status === 200 && envResult.data.success) {
      console.log(`✅ Environment Test - SUCCESS (${responseTime3}ms)`);
      console.log(`📄 URL: ${envResult.data.url}`);
      
      // Check if it's actually a PDF or HTML fallback
      if (envResult.data.url && envResult.data.url.includes('.pdf')) {
        console.log('✅ CHROMIUM_REMOTE_EXEC_PATH is working correctly');
      } else {
        console.log('⚠️  Using HTML fallback - check CHROMIUM_REMOTE_EXEC_PATH');
      }
    } else {
      console.log(`❌ Environment Test - FAILED (${envResult.status})`);
      console.log(`📝 Response: ${JSON.stringify(envResult.data, null, 2)}`);
    }

    console.log('');
    console.log('============================================');
    console.log('📊 PRODUCTION PDF TEST SUMMARY');
    console.log('============================================');
    
    const tests = [
      { name: 'Health Check', result: healthResult.status === 200 },
      { name: 'PDF Generation', result: pdfResult.status === 200 && pdfResult.data.success },
      { name: 'Environment Config', result: envResult.status === 200 && envResult.data.success }
    ];
    
    const passed = tests.filter(t => t.result).length;
    const total = tests.length;
    const successRate = Math.round((passed / total) * 100);
    
    console.log(`📈 Tests Passed: ${passed}/${total}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log('');
    
    tests.forEach((test, index) => {
      const status = test.result ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${test.name}`);
    });
    
    console.log('');
    if (successRate === 100) {
      console.log('🎉 ALL TESTS PASSED - PRODUCTION READY!');
    } else if (successRate >= 66) {
      console.log('⚠️  MOSTLY WORKING - MINOR ISSUES DETECTED');
    } else {
      console.log('❌ MAJOR ISSUES - NEEDS ATTENTION');
    }
    
    console.log(`📅 Completed: ${new Date().toISOString()}`);
    console.log(`🔗 Production URL: ${PRODUCTION_URL}`);

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testProductionPDF().catch(console.error); 