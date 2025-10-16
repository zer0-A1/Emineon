#!/usr/bin/env node

/**
 * 🧪 COMPETENCE FILE CREATOR MODAL - PRODUCTION TEST SUITE
 * 
 * Comprehensive testing for all competence file modal functionality
 * Tests: Resume parsing, LinkedIn parsing, PDF generation, logo upload
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

// Test data
const testLinkedInProfile = `John Smith
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

const testResumeText = `SARAH JOHNSON
Senior Software Engineer
Email: sarah.johnson@email.com
Phone: +1 (555) 123-4567
Location: San Francisco, CA

PROFESSIONAL SUMMARY
Experienced software engineer with over 7 years of expertise in full-stack development, focusing on React, Node.js, and cloud technologies. Demonstrated ability to lead development teams and deliver scalable web applications.

TECHNICAL SKILLS
• Programming Languages: JavaScript, TypeScript, Python, Java
• Frontend: React, Vue.js, Angular, HTML5, CSS3, SASS
• Backend: Node.js, Express.js, Django, Spring Boot
• Databases: PostgreSQL, MongoDB, Redis
• Cloud & DevOps: AWS, Azure, Docker, Kubernetes, Git, Jenkins
• Tools: JIRA, Figma

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2021)
• React Professional Developer Certification (2020)
• Node.js Certified Developer (2019)

PROFESSIONAL EXPERIENCE

TechCorp Inc. | Senior Software Engineer | Jan 2020 - Present
• Led a team of 5 developers in building a customer-facing web application serving 100K+ users
• Implemented microservices architecture using Node.js and Docker, improving system scalability by 300%
• Designed and developed RESTful APIs and GraphQL endpoints for mobile and web applications
• Reduced application load time by 40% through code optimization and caching strategies
• Mentored junior developers and conducted code reviews to maintain high code quality standards

StartupFlow | Software Engineer | Jun 2018 - Dec 2019
• Developed responsive web applications using React and Redux for state management
• Built real-time features using WebSocket connections and Socket.io
• Integrated third-party APIs including payment gateways (Stripe, PayPal) and social media platforms
• Collaborated with UX/UI designers to implement pixel-perfect user interfaces
• Participated in agile development processes and sprint planning sessions

WebSolutions Ltd | Junior Developer | Mar 2016 - May 2018
• Created dynamic websites using HTML5, CSS3, JavaScript, and jQuery
• Developed WordPress themes and plugins for client projects
• Performed website maintenance, bug fixes, and performance optimizations
• Assisted in database design and implementation using MySQL
• Gained experience in version control systems (Git) and deployment processes

EDUCATION
Master of Science in Computer Science | Stanford University | 2014-2016
Bachelor of Science in Software Engineering | UC Berkeley | 2010-2014

LANGUAGES
English (Native), Spanish (Professional), French (Conversational)`;

// Create a simple test image (1x1 PNG)
function createTestImage() {
  // Base64 encoded 1x1 transparent PNG
  const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
  return Buffer.from(base64PNG, 'base64');
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = (urlObj.protocol === 'https:' ? https : require('http')).request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test functions
async function testDailyQuote(baseUrl) {
  log('\n📅 Testing Daily Quote API...', 'cyan');
  
  try {
    const response = await makeRequest(`${baseUrl}/api/daily-quote`);
    
    if (response.status === 200 && response.data.success) {
      log(`✅ Daily Quote: "${response.data.data.quote.text}" - ${response.data.data.quote.author}`, 'green');
      log(`💡 Tip: ${response.data.data.tip}`, 'blue');
      return true;
    } else {
      log(`❌ Daily Quote failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Daily Quote error: ${error.message}`, 'red');
    return false;
  }
}

async function testLinkedInParsing(baseUrl) {
  log('\n🔗 Testing LinkedIn Profile Parsing...', 'cyan');
  
  try {
    const response = await makeRequest(`${baseUrl}/api/competence-files/test-linkedin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        linkedinText: testLinkedInProfile
      })
    });
    
    if (response.status === 200 && response.data.success) {
      const candidate = response.data.data;
      log(`✅ LinkedIn parsed: ${candidate.fullName} - ${candidate.currentTitle}`, 'green');
      log(`📍 Location: ${candidate.location}`, 'blue');
      log(`🛠️ Skills: ${candidate.skills.slice(0, 3).join(', ')}...`, 'blue');
      return candidate;
    } else {
      log(`❌ LinkedIn parsing failed: ${response.status}`, 'red');
      log(`Error: ${JSON.stringify(response.data, null, 2)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ LinkedIn parsing error: ${error.message}`, 'red');
    return null;
  }
}

async function testResumeParsing(baseUrl) {
  log('\n📄 Testing Resume Text Parsing...', 'cyan');
  
  try {
    // Create a temporary text file
    const tempFile = 'temp-resume-test.txt';
    fs.writeFileSync(tempFile, testResumeText);
    
    // Read file and create form data
    const fileContent = fs.readFileSync(tempFile);
    const boundary = '----formdata-boundary-' + Math.random().toString(36);
    
    let formData = '';
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="file"; filename="${tempFile}"\r\n`;
    formData += `Content-Type: text/plain\r\n\r\n`;
    formData += fileContent.toString();
    formData += `\r\n--${boundary}--\r\n`;
    
    const response = await makeRequest(`${baseUrl}/api/competence-files/parse-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData)
      },
      body: formData
    });
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    if (response.status === 200 && response.data.success) {
      const candidate = response.data.data;
      log(`✅ Resume parsed: ${candidate.fullName} - ${candidate.currentTitle}`, 'green');
      log(`📧 Email: ${candidate.email}`, 'blue');
      log(`🎓 Education: ${candidate.education[0]}`, 'blue');
      return candidate;
    } else {
      log(`❌ Resume parsing failed: ${response.status}`, 'red');
      log(`Error: ${JSON.stringify(response.data, null, 2)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Resume parsing error: ${error.message}`, 'red');
    return null;
  }
}

async function testPDFGeneration(baseUrl, candidateData) {
  log('\n🖨️ Testing PDF Generation...', 'cyan');
  
  try {
    const response = await makeRequest(`${baseUrl}/api/competence-files/test-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        candidateData: {
          ...candidateData,
          id: `test-modal-${Date.now()}`
        },
        format: 'pdf'
      })
    });
    
    if (response.status === 200 && response.data.success) {
      log(`✅ PDF generated successfully`, 'green');
      log(`📎 URL: ${response.data.data.fileUrl}`, 'blue');
      log(`📊 Size: ${response.data.data.fileSize} bytes`, 'blue');
      return response.data.data;
    } else {
      log(`❌ PDF generation failed: ${response.status}`, 'red');
      log(`Error: ${JSON.stringify(response.data, null, 2)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ PDF generation error: ${error.message}`, 'red');
    return null;
  }
}

async function testLogoUpload(baseUrl) {
  log('\n🖼️ Testing Logo Upload...', 'cyan');
  
  try {
    const imageBuffer = createTestImage();
    const boundary = '----formdata-boundary-' + Math.random().toString(36);
    
    let formData = '';
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="file"; filename="test-logo.png"\r\n`;
    formData += `Content-Type: image/png\r\n\r\n`;
    
    const formDataBuffer = Buffer.concat([
      Buffer.from(formData, 'utf8'),
      imageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
    ]);
    
    const response = await makeRequest(`${baseUrl}/api/competence-files/simple-logo-test`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formDataBuffer.length
      },
      body: formDataBuffer
    });
    
    if (response.status === 200 && response.data.success) {
      log(`✅ Logo uploaded successfully`, 'green');
      log(`📎 URL: ${response.data.data.logoUrl}`, 'blue');
      return response.data.data;
    } else {
      log(`❌ Logo upload failed: ${response.status}`, 'red');
      log(`Error: ${JSON.stringify(response.data, null, 2)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Logo upload error: ${error.message}`, 'red');
    return null;
  }
}

async function testHealthCheck(baseUrl) {
  log('\n🏥 Testing Health Check...', 'cyan');
  
  try {
    const response = await makeRequest(`${baseUrl}/api/health`);
    
    if (response.status === 200 && response.data.status === 'healthy') {
      log(`✅ Health check passed`, 'green');
      log(`🕐 Timestamp: ${response.data.timestamp}`, 'blue');
      return true;
    } else {
      log(`❌ Health check failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runCompetenceModalTests() {
  log('🚀 COMPETENCE FILE CREATOR MODAL - PRODUCTION TEST SUITE', 'bright');
  log('=' .repeat(60), 'cyan');
  
  const results = {
    healthCheck: false,
    dailyQuote: false,
    linkedinParsing: false,
    resumeParsing: false,
    pdfGeneration: false,
    logoUpload: false
  };
  
  // Test both production and local if available
  const testUrls = [
    { name: 'Production', url: PRODUCTION_URL },
    { name: 'Local', url: LOCAL_URL }
  ];
  
  for (const { name, url } of testUrls) {
    log(`\n🌐 Testing ${name} Environment: ${url}`, 'magenta');
    log('-'.repeat(50), 'cyan');
    
    try {
      // Health check first
      const healthOk = await testHealthCheck(url);
      if (name === 'Production') results.healthCheck = healthOk;
      
      if (!healthOk && name === 'Local') {
        log(`⚠️ Skipping local tests - server not running`, 'yellow');
        continue;
      }
      
      // Daily quote test
      const quoteOk = await testDailyQuote(url);
      if (name === 'Production') results.dailyQuote = quoteOk;
      
      // LinkedIn parsing test
      const linkedinCandidate = await testLinkedInParsing(url);
      if (name === 'Production') results.linkedinParsing = !!linkedinCandidate;
      
      // Resume parsing test
      const resumeCandidate = await testResumeParsing(url);
      if (name === 'Production') results.resumeParsing = !!resumeCandidate;
      
      // PDF generation test (use LinkedIn candidate if available, otherwise resume candidate)
      const testCandidate = linkedinCandidate || resumeCandidate;
      if (testCandidate) {
        const pdfResult = await testPDFGeneration(url, testCandidate);
        if (name === 'Production') results.pdfGeneration = !!pdfResult;
      }
      
      // Logo upload test
      const logoResult = await testLogoUpload(url);
      if (name === 'Production') results.logoUpload = !!logoResult;
      
    } catch (error) {
      log(`❌ ${name} environment error: ${error.message}`, 'red');
    }
  }
  
  // Summary
  log('\n📊 TEST RESULTS SUMMARY', 'bright');
  log('=' .repeat(60), 'cyan');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test.replace(/([A-Z])/g, ' $1').toUpperCase()}`, color);
  });
  
  log(`\n🎯 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`, 
      successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  if (successRate >= 80) {
    log('🎉 Competence File Creator Modal is production ready!', 'green');
  } else if (successRate >= 60) {
    log('⚠️ Some issues detected, but core functionality works', 'yellow');
  } else {
    log('🚨 Critical issues detected, needs attention', 'red');
  }
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runCompetenceModalTests().catch(console.error);
}

module.exports = { runCompetenceModalTests }; 