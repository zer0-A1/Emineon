#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_FILES = [
  { name: 'test-resume.txt', type: 'text/plain', description: 'Plain Text Resume' }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testDocumentParsing() {
  log('\n🔍 Testing Document Parsing with Updated OpenAI Responses API...', 'blue');
  
  const results = [];
  
  for (const testFile of TEST_FILES) {
    log(`\n📄 Testing ${testFile.description} (${testFile.name})...`, 'yellow');
    
    if (!fs.existsSync(testFile.name)) {
      log(`❌ File ${testFile.name} not found`, 'red');
      results.push({ file: testFile.name, success: false, error: 'File not found' });
      continue;
    }
    
         try {
       const fetch = (await import('node-fetch')).default;
       const FormData = (await import('form-data')).default;
       const formData = new FormData();
       formData.append('file', fs.createReadStream(testFile.name));
       
       const response = await fetch(`${BASE_URL}/api/competence-files/parse-resume`, {
         method: 'POST',
         body: formData
       });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        log(`✅ ${testFile.description} parsed successfully!`, 'green');
        log(`   👤 Name: ${result.data.fullName}`, 'green');
        log(`   💼 Title: ${result.data.currentTitle}`, 'green');
        log(`   📧 Email: ${result.data.email}`, 'green');
        log(`   🏢 Experience: ${result.data.yearsOfExperience} years`, 'green');
        log(`   🛠️ Skills: ${result.data.skills.length} skills found`, 'green');
        
        results.push({ 
          file: testFile.name, 
          success: true, 
          data: result.data,
          processingTime: response.headers.get('x-response-time') || 'N/A'
        });
      } else {
        log(`❌ ${testFile.description} parsing failed: ${result.message || result.error}`, 'red');
        results.push({ 
          file: testFile.name, 
          success: false, 
          error: result.message || result.error 
        });
      }
    } catch (error) {
      log(`❌ ${testFile.description} parsing error: ${error.message}`, 'red');
      results.push({ file: testFile.name, success: false, error: error.message });
    }
  }
  
  return results;
}

async function testLinkedInParsing() {
  log('\n🔗 Testing LinkedIn Import...', 'blue');
  
  const linkedinText = `John Smith
Software Engineer at Google
San Francisco, CA

Experience:
• Software Engineer at Google (2020-Present)
  - Developed large-scale web applications
  - Led team of 3 junior developers
  - Implemented CI/CD pipelines

• Junior Developer at Startup Inc (2019-2020)
  - Built responsive web interfaces
  - Worked with REST APIs

Education:
• Stanford University - BS Computer Science (2015-2019)

Skills: JavaScript, React, Node.js, Python, AWS, Docker, Kubernetes

Experienced software engineer with 5 years in full-stack development. Passionate about building scalable web applications using React, Node.js, and cloud technologies.`;

  try {
    const result = await makeRequest(`${BASE_URL}/api/competence-files/parse-linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkedinText })
    });
    
    if (result.success && result.data.success) {
      log('✅ LinkedIn parsing successful!', 'green');
      log(`   👤 Name: ${result.data.data.fullName}`, 'green');
      log(`   💼 Title: ${result.data.data.currentTitle}`, 'green');
      log(`   📍 Location: ${result.data.data.location}`, 'green');
      return { success: true, data: result.data.data };
    } else {
      log(`❌ LinkedIn parsing failed: ${result.data?.message || result.error}`, 'red');
      return { success: false, error: result.data?.message || result.error };
    }
  } catch (error) {
    log(`❌ LinkedIn parsing error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testPDFGeneration(candidateData) {
  log('\n📄 Testing PDF Generation...', 'blue');
  
  try {
    const result = await makeRequest(`${BASE_URL}/api/competence-files/test-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateData, format: 'pdf' })
    });
    
    if (result.success && result.data.success) {
      log('✅ PDF generation successful!', 'green');
      log(`   📄 PDF URL: ${result.data.pdfUrl}`, 'green');
      log(`   📊 File size: ${result.data.fileSize} bytes`, 'green');
      return { success: true, pdfUrl: result.data.pdfUrl };
    } else {
      log(`❌ PDF generation failed: ${result.data?.message || result.error}`, 'red');
      return { success: false, error: result.data?.message || result.error };
    }
  } catch (error) {
    log(`❌ PDF generation error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTest() {
  log('🚀 Starting Comprehensive Competence File Workflow Test', 'bold');
  log('=' .repeat(60), 'blue');
  
  const startTime = Date.now();
  
  // Test 1: Document Parsing
  const parsingResults = await testDocumentParsing();
  
  // Test 2: LinkedIn Import
  const linkedinResult = await testLinkedInParsing();
  
  // Test 3: PDF Generation (using parsed data or LinkedIn data)
  let pdfResult = { success: false };
  const successfulParsing = parsingResults.find(r => r.success);
  const candidateData = successfulParsing?.data || linkedinResult?.data;
  
  if (candidateData) {
    pdfResult = await testPDFGeneration(candidateData);
  } else {
    log('\n❌ No candidate data available for PDF generation test', 'red');
  }
  
  // Summary
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  
  log('\n📊 TEST SUMMARY', 'bold');
  log('=' .repeat(60), 'blue');
  
  const successfulParsingCount = parsingResults.filter(r => r.success).length;
  const totalParsing = parsingResults.length;
  
  log(`📄 Document Parsing: ${successfulParsingCount}/${totalParsing} successful`, 
      successfulParsingCount === totalParsing ? 'green' : 'yellow');
  
  log(`🔗 LinkedIn Import: ${linkedinResult.success ? 'SUCCESS' : 'FAILED'}`, 
      linkedinResult.success ? 'green' : 'red');
  
  log(`📄 PDF Generation: ${pdfResult.success ? 'SUCCESS' : 'FAILED'}`, 
      pdfResult.success ? 'green' : 'red');
  
  const overallSuccess = successfulParsingCount > 0 && linkedinResult.success && pdfResult.success;
  log(`\n🎯 Overall Status: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`, 
      overallSuccess ? 'green' : 'red');
  
  log(`⏱️ Total execution time: ${totalTime}s`, 'blue');
  
  if (overallSuccess) {
    log('\n🎉 Competence File Modal is fully functional!', 'green');
    log('✅ Document parsing with OpenAI Responses API working', 'green');
    log('✅ LinkedIn import working', 'green');
    log('✅ PDF generation working', 'green');
  } else {
    log('\n⚠️ Some functionality needs attention:', 'yellow');
    if (successfulParsingCount === 0) log('   - Document parsing needs fixing', 'red');
    if (!linkedinResult.success) log('   - LinkedIn import needs fixing', 'red');
    if (!pdfResult.success) log('   - PDF generation needs fixing', 'red');
  }
  
  return {
    parsing: { successful: successfulParsingCount, total: totalParsing },
    linkedin: linkedinResult.success,
    pdf: pdfResult.success,
    overall: overallSuccess,
    executionTime: totalTime
  };
}

// Run the test
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = { runComprehensiveTest }; 