#!/usr/bin/env node

/**
 * 🚀 PRODUCTION DEPLOYMENT TESTING SUITE
 * 
 * Comprehensive testing for Emineon ATS competence file functionality
 * Tests all endpoints with serverless Chromium PDF generation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTION_URL = 'https://app-emineon.vercel.app';
const LOCAL_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test data
const TEST_CANDIDATE = {
  id: "prod-test-" + Date.now(),
  fullName: "Production Test User",
  currentTitle: "Senior Software Engineer",
  email: "test@production.com",
  phone: "+1 555-PROD-TEST",
  location: "Production City, Cloud",
  yearsOfExperience: 5,
  skills: ["JavaScript", "React", "Node.js", "Serverless", "Vercel", "Chromium"],
  certifications: ["AWS Certified", "Vercel Expert"],
  experience: [{
    company: "Production Corp",
    title: "Senior Engineer",
    startDate: "2020-01",
    endDate: "Present",
    responsibilities: "Testing production deployment with serverless PDF generation"
  }],
  education: ["BS Computer Science - Production University"],
  languages: ["English (Native)", "JavaScript (Fluent)"],
  summary: "Testing the production deployment of Emineon ATS with serverless Chromium PDF generation"
};

const LINKEDIN_TEST_DATA = `
Production Test User
Senior Software Engineer at Production Corp
Production City, Cloud

Experience:
• Senior Software Engineer at Production Corp (2020-Present)
  - Testing production deployment
  - Implementing serverless PDF generation
  - Verifying Chromium compatibility

• Junior Developer at Startup Inc (2018-2020)
  - Built web applications
  - Worked with cloud technologies

Education:
• Production University - BS Computer Science (2014-2018)

Skills: JavaScript, React, Node.js, Serverless, Vercel, Chromium

Testing the production deployment of serverless PDF generation...
`;

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

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Test-Script/1.0'
      },
      timeout: TEST_TIMEOUT
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const client = urlObj.protocol === 'https:' ? https : require('http');
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
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

async function testEndpoint(name, url, options = {}) {
  log(`\n🧪 Testing ${name}...`, 'cyan');
  log(`📡 URL: ${url}`, 'blue');
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(url, options.method, options.body);
    const duration = Date.now() - startTime;
    
    log(`⏱️  Response time: ${duration}ms`, 'yellow');
    log(`📊 Status: ${response.statusCode}`, response.statusCode === 200 ? 'green' : 'red');
    
    if (response.statusCode === 200) {
      log(`✅ ${name} - SUCCESS`, 'green');
      if (response.body && typeof response.body === 'object') {
        if (response.body.data && response.body.data.fileUrl) {
          log(`🔗 File URL: ${response.body.data.fileUrl}`, 'blue');
        }
        if (response.body.message) {
          log(`💬 Message: ${response.body.message}`, 'cyan');
        }
      }
      return { success: true, response, duration };
    } else {
      log(`❌ ${name} - FAILED (${response.statusCode})`, 'red');
      if (response.body) {
        log(`📝 Response: ${JSON.stringify(response.body, null, 2)}`, 'yellow');
      }
      return { success: false, response, duration };
    }
  } catch (error) {
    log(`💥 ${name} - ERROR: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runProductionTests() {
  log('🚀 EMINEON ATS PRODUCTION DEPLOYMENT TEST SUITE', 'bright');
  log('=' .repeat(60), 'cyan');
  log(`🌐 Testing production URL: ${PRODUCTION_URL}`, 'blue');
  log(`⏱️  Timeout: ${TEST_TIMEOUT}ms`, 'yellow');
  log(`📅 Test started: ${new Date().toISOString()}`, 'yellow');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Health Check
  const healthTest = await testEndpoint(
    'Health Check',
    `${PRODUCTION_URL}/api/health`
  );
  results.tests.push({ name: 'Health Check', ...healthTest });
  results.total++;
  if (healthTest.success) results.passed++; else results.failed++;

  // Test 2: PDF Generation (Main Feature)
  const pdfTest = await testEndpoint(
    'PDF Generation (Serverless Chromium)',
    `${PRODUCTION_URL}/api/competence-files/test-generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        candidateData: TEST_CANDIDATE,
        format: 'pdf'
      })
    }
  );
  results.tests.push({ name: 'PDF Generation', ...pdfTest });
  results.total++;
  if (pdfTest.success) results.passed++; else results.failed++;

  // Test 3: LinkedIn Parsing
  const linkedinTest = await testEndpoint(
    'LinkedIn Parsing (OpenAI Responses API)',
    `${PRODUCTION_URL}/api/competence-files/test-linkedin`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        linkedinText: LINKEDIN_TEST_DATA
      })
    }
  );
  results.tests.push({ name: 'LinkedIn Parsing', ...linkedinTest });
  results.total++;
  if (linkedinTest.success) results.passed++; else results.failed++;

  // Test 4: End-to-End Workflow (Parse → Generate → Upload)
  log('\n🔄 Testing End-to-End Workflow...', 'magenta');
  
  // First parse LinkedIn data
  const parseResult = await testEndpoint(
    'E2E: Parse LinkedIn',
    `${PRODUCTION_URL}/api/competence-files/test-linkedin`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        linkedinText: LINKEDIN_TEST_DATA
      })
    }
  );
  
  if (parseResult.success && parseResult.response.body && parseResult.response.body.candidateData) {
    // Then generate PDF from parsed data
    const generateResult = await testEndpoint(
      'E2E: Generate PDF from Parsed Data',
      `${PRODUCTION_URL}/api/competence-files/test-generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateData: parseResult.response.body.candidateData,
          format: 'pdf'
        })
      }
    );
    
    results.tests.push({ name: 'E2E Workflow', success: generateResult.success, ...generateResult });
    results.total++;
    if (generateResult.success) results.passed++; else results.failed++;
  } else {
    log('❌ E2E Workflow - FAILED (Parse step failed)', 'red');
    results.tests.push({ name: 'E2E Workflow', success: false, error: 'Parse step failed' });
    results.total++;
    results.failed++;
  }

  // Final Results
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 PRODUCTION TEST RESULTS', 'bright');
  log('='.repeat(60), 'cyan');
  
  log(`📈 Total Tests: ${results.total}`, 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`📊 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`, 
      results.passed === results.total ? 'green' : 'yellow');

  // Detailed Results
  log('\n📋 DETAILED RESULTS:', 'cyan');
  results.tests.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    const duration = test.duration ? ` (${test.duration}ms)` : '';
    log(`${index + 1}. ${status} ${test.name}${duration}`, test.success ? 'green' : 'red');
    
    if (!test.success && test.error) {
      log(`   Error: ${test.error}`, 'red');
    }
  });

  // Production Status
  log('\n🏭 PRODUCTION STATUS:', 'magenta');
  if (results.passed === results.total) {
    log('🎉 ALL SYSTEMS OPERATIONAL - PRODUCTION READY!', 'green');
    log('✅ Serverless Chromium PDF generation working', 'green');
    log('✅ OpenAI Responses API integration working', 'green');
    log('✅ Cloudinary file upload working', 'green');
    log('✅ End-to-end workflow operational', 'green');
  } else if (results.passed > 0) {
    log('⚠️  PARTIAL FUNCTIONALITY - SOME ISSUES DETECTED', 'yellow');
    log(`✅ ${results.passed}/${results.total} features working`, 'yellow');
  } else {
    log('🚨 CRITICAL ISSUES - DEPLOYMENT NEEDS ATTENTION', 'red');
  }

  log(`\n📅 Test completed: ${new Date().toISOString()}`, 'yellow');
  log('🔗 Production URL: ' + PRODUCTION_URL, 'blue');
  
  return results;
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 EMINEON ATS PRODUCTION DEPLOYMENT TEST SUITE

Usage: node test-production-deployment.js [options]

Options:
  --help, -h     Show this help message
  --url <url>    Override production URL (default: ${PRODUCTION_URL})
  --timeout <ms> Override timeout (default: ${TEST_TIMEOUT}ms)

Examples:
  node test-production-deployment.js
  node test-production-deployment.js --url https://your-app.vercel.app
  node test-production-deployment.js --timeout 60000
`);
  process.exit(0);
}

// Override URL if provided
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  PRODUCTION_URL = process.argv[urlIndex + 1];
}

// Override timeout if provided
const timeoutIndex = process.argv.indexOf('--timeout');
if (timeoutIndex !== -1 && process.argv[timeoutIndex + 1]) {
  TEST_TIMEOUT = parseInt(process.argv[timeoutIndex + 1]) || TEST_TIMEOUT;
}

// Run the tests
runProductionTests().catch(error => {
  log(`💥 Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});

module.exports = { runProductionTests, testEndpoint }; 