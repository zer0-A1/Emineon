#!/usr/bin/env node

const BASE_URL = 'https://app-emineon-ev5r7gkyt-david-bicrawais-projects.vercel.app';

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

async function testServerlessPDFGeneration() {
  log('\n🔧 Testing Serverless PDF Generation...', 'blue');
  
  const testData = {
    candidateData: {
      id: 'prod-serverless-test',
      fullName: 'Production Serverless Test',
      currentTitle: 'DevOps Engineer',
      email: 'test@production.com',
      phone: '555-123-4567',
      location: 'Production City',
      yearsOfExperience: 5,
      skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', '@sparticuz/chromium'],
      certifications: ['AWS Solutions Architect', 'Kubernetes Administrator'],
      experience: [{
        company: 'Production Co',
        title: 'DevOps Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        responsibilities: 'Testing serverless PDF generation with @sparticuz/chromium in Vercel production environment'
      }],
      education: ['MS Computer Science'],
      languages: ['English', 'Spanish'],
      summary: 'Testing enhanced serverless Chromium PDF generation in Vercel production environment with optimized flags'
    },
    format: 'pdf'
  };

  const result = await makeRequest(`${BASE_URL}/api/competence-files/test-generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  });

  if (result.success && result.data.success) {
    if (result.data.data.format === 'pdf') {
      log('✅ PDF Generation: SUCCESS - Serverless Chromium working!', 'green');
      log(`   📄 File: ${result.data.data.fileName}`, 'green');
      log(`   📊 Size: ${result.data.data.fileSize} bytes`, 'green');
      log(`   🔗 URL: ${result.data.data.fileUrl}`, 'green');
      return { success: true, format: 'pdf' };
    } else {
      log('⚠️ PDF Generation: FALLBACK - HTML generated instead', 'yellow');
      log(`   ❌ Error: ${result.data.error || 'Unknown error'}`, 'yellow');
      return { success: false, format: 'html', error: result.data.error };
    }
  } else {
    log('❌ PDF Generation: FAILED', 'red');
    log(`   Error: ${result.error || result.data?.error || 'Unknown error'}`, 'red');
    return { success: false, error: result.error || result.data?.error };
  }
}

async function testLinkedInParsing() {
  log('\n🔗 Testing LinkedIn Profile Parsing...', 'blue');
  
  const linkedinText = `Sarah Johnson
Senior Frontend Developer at Microsoft
Seattle, WA

About:
Passionate frontend developer with 6 years of experience building modern web applications. Specialized in React, TypeScript, and cloud technologies.

Experience:
• Senior Frontend Developer at Microsoft (2021-Present)
  - Lead development of Azure portal components
  - Mentor junior developers and conduct code reviews
  - Implement accessibility standards and performance optimizations

• Frontend Developer at Amazon (2019-2021)
  - Built customer-facing e-commerce features
  - Collaborated with UX designers on user interface improvements
  - Developed reusable component libraries

• Junior Developer at Startup XYZ (2018-2019)
  - Created responsive web applications
  - Worked with REST APIs and GraphQL

Education:
• University of Washington - BS Computer Science (2014-2018)

Skills: React, TypeScript, JavaScript, HTML5, CSS3, Node.js, GraphQL, AWS, Azure, Git

Certifications:
• Microsoft Azure Developer Associate
• AWS Certified Developer`;

  const result = await makeRequest(`${BASE_URL}/api/competence-files/parse-linkedin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ linkedinText })
  });

  if (result.success && result.data.success) {
    log('✅ LinkedIn Parsing: SUCCESS', 'green');
    log(`   👤 Name: ${result.data.data.fullName}`, 'green');
    log(`   💼 Title: ${result.data.data.currentTitle}`, 'green');
    log(`   📍 Location: ${result.data.data.location}`, 'green');
    log(`   🎯 Skills: ${result.data.data.skills.slice(0, 5).join(', ')}...`, 'green');
    log(`   📚 Experience: ${result.data.data.experience.length} positions`, 'green');
    return { success: true, data: result.data.data };
  } else {
    log('❌ LinkedIn Parsing: FAILED', 'red');
    log(`   Error: ${result.error || result.data?.error || 'Unknown error'}`, 'red');
    return { success: false, error: result.error || result.data?.error };
  }
}

async function testEndToEndWorkflow() {
  log('\n🔄 Testing End-to-End Workflow...', 'blue');
  
  // First parse LinkedIn
  const linkedinResult = await testLinkedInParsing();
  if (!linkedinResult.success) {
    log('❌ End-to-End: FAILED - LinkedIn parsing failed', 'red');
    return { success: false, step: 'linkedin' };
  }

  // Then generate PDF from parsed data
  const pdfResult = await makeRequest(`${BASE_URL}/api/competence-files/test-generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidateData: {
        ...linkedinResult.data,
        id: 'e2e_test_' + Date.now()
      },
      format: 'pdf'
    })
  });

  if (pdfResult.success && pdfResult.data.success) {
    log('✅ End-to-End: SUCCESS - LinkedIn → PDF workflow complete!', 'green');
    log(`   📄 Generated: ${pdfResult.data.data.fileName}`, 'green');
    log(`   📊 Format: ${pdfResult.data.data.format}`, 'green');
    return { success: true, format: pdfResult.data.data.format };
  } else {
    log('❌ End-to-End: FAILED - PDF generation failed', 'red');
    return { success: false, step: 'pdf' };
  }
}

async function main() {
  log('🚀 Production Fixes Testing Suite', 'bold');
  log('Testing serverless PDF generation and LinkedIn parsing fixes...', 'blue');
  
  const startTime = Date.now();
  
  // Test individual components
  const pdfResult = await testServerlessPDFGeneration();
  const linkedinResult = await testLinkedInParsing();
  
  // Test end-to-end workflow
  const e2eResult = await testEndToEndWorkflow();
  
  const totalTime = Date.now() - startTime;
  
  // Summary
  log('\n📊 Test Results Summary:', 'bold');
  log(`🔧 PDF Generation: ${pdfResult.success ? '✅ WORKING' : '❌ FAILED'}`, 
      pdfResult.success ? 'green' : 'red');
  log(`🔗 LinkedIn Parsing: ${linkedinResult.success ? '✅ WORKING' : '❌ FAILED'}`, 
      linkedinResult.success ? 'green' : 'red');
  log(`🔄 End-to-End Workflow: ${e2eResult.success ? '✅ WORKING' : '❌ FAILED'}`, 
      e2eResult.success ? 'green' : 'red');
  
  const overallSuccess = pdfResult.success && linkedinResult.success && e2eResult.success;
  log(`\n🎯 Overall Status: ${overallSuccess ? '✅ ALL FIXES WORKING' : '❌ ISSUES REMAIN'}`, 
      overallSuccess ? 'green' : 'red');
  
  if (!overallSuccess) {
    log('\n🔧 Issues Found:', 'yellow');
    if (!pdfResult.success) {
      log(`   - PDF Generation: ${pdfResult.error || 'Falling back to HTML'}`, 'red');
    }
    if (!linkedinResult.success) {
      log(`   - LinkedIn Parsing: ${linkedinResult.error || 'Authentication or parsing error'}`, 'red');
    }
    if (!e2eResult.success) {
      log(`   - End-to-End: Failed at ${e2eResult.step} step`, 'red');
    }
  }
  
  log(`\n⏱️ Total execution time: ${totalTime}ms`, 'blue');
  
  return {
    pdf: pdfResult.success,
    linkedin: linkedinResult.success,
    endToEnd: e2eResult.success,
    overall: overallSuccess,
    executionTime: totalTime
  };
}

// Run the tests
main().catch(console.error); 