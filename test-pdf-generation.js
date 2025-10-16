#!/usr/bin/env node

/**
 * 🧪 PDF GENERATION TEST SCRIPT
 * 
 * Tests PDF generation functionality locally and in production
 */

const https = require('https');
const fs = require('fs');

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

// Test candidate data
const testCandidate = {
  id: "pdf-test-" + Date.now(),
  fullName: "PDF Test User",
  currentTitle: "Software Engineer",
  email: "test@pdftest.com",
  phone: "+1 555-PDF-TEST",
  location: "Test City, PDF State",
  yearsOfExperience: 5,
  skills: ["JavaScript", "React", "Node.js", "PDF Generation"],
  certifications: ["PDF Testing Certification"],
  experience: [
    {
      company: "PDF Test Company",
      title: "Senior PDF Engineer",
      startDate: "2020-01",
      endDate: "Present",
      responsibilities: "Testing PDF generation functionality and ensuring proper file integrity"
    }
  ],
  education: ["BS Computer Science - PDF University"],
  languages: ["English (Native)", "PDF (Fluent)"],
  summary: "Experienced engineer specializing in PDF generation and file integrity testing"
};

async function testPDFGeneration(baseUrl, testName) {
  log(`\n🧪 Testing ${testName}...`, 'cyan');
  
  try {
    const response = await fetch(`${baseUrl}/api/competence-files/test-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateData: testCandidate,
        format: 'pdf'
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      log('✅ PDF generation successful!', 'green');
      log(`   File URL: ${result.data.fileUrl}`, 'green');
      log(`   File size: ${result.data.fileSize} bytes`, 'blue');
      log(`   Format: ${result.data.format}`, 'blue');
      
      // Test if the PDF URL is accessible
      try {
        const pdfResponse = await fetch(result.data.fileUrl);
        if (pdfResponse.ok) {
          const contentType = pdfResponse.headers.get('content-type');
          log(`   Content-Type: ${contentType}`, 'blue');
          
          if (contentType && contentType.includes('application/pdf')) {
            log('✅ PDF URL returns correct content type', 'green');
          } else {
            log('⚠️ PDF URL does not return PDF content type', 'yellow');
          }
        } else {
          log('❌ PDF URL is not accessible', 'red');
        }
      } catch (urlError) {
        log(`⚠️ Could not test PDF URL: ${urlError.message}`, 'yellow');
      }
      
      return true;
    } else {
      log('❌ PDF generation failed', 'red');
      log(`   Error: ${result.error || 'Unknown error'}`, 'red');
      log(`   Message: ${result.message || 'No message'}`, 'red');
      if (result.warning) {
        log(`   Warning: ${result.warning}`, 'yellow');
      }
      return false;
    }

  } catch (error) {
    log(`❌ Test failed with error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('🚀 PDF GENERATION TESTING SUITE', 'bright');
  log('==================================', 'bright');
  
  const results = [];

  // Test local development (if available)
  try {
    const healthCheck = await fetch(`${LOCAL_URL}/api/health`);
    if (healthCheck.ok) {
      log('\n🏠 Testing Local Development...', 'magenta');
      const localTest = await testPDFGeneration(LOCAL_URL, 'Local PDF Generation');
      results.push({ name: 'Local PDF Generation', success: localTest });
    }
  } catch (error) {
    log('\n⚠️ Local development server not available', 'yellow');
  }

  // Test production deployment
  log('\n📡 Testing Production Deployment...', 'magenta');
  const prodTest = await testPDFGeneration(PRODUCTION_URL, 'Production PDF Generation');
  results.push({ name: 'Production PDF Generation', success: prodTest });

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
    log('\n🎉 All PDF generation tests passed! PDFs should be working correctly.', 'green');
  } else {
    log('\n⚠️ Some tests failed. Check the error messages above.', 'yellow');
  }

  return passedTests === totalTests;
}

// Run the tests
runTests().catch(error => {
  log(`💥 Test suite failed: ${error.message}`, 'red');
  process.exit(1);
}); 