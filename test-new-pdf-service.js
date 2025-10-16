#!/usr/bin/env node

/**
 * Test script for the new PDF service implementation
 * Tests both development and production configurations
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ENDPOINT = '/api/competence-files/test-generate';

// Test data
const testCandidates = [
  {
    name: 'Simple Test',
    data: {
      candidateData: {
        id: 'test-simple',
        fullName: 'John Doe',
        currentTitle: 'Software Engineer',
        email: 'john@example.com',
        phone: '123-456-7890',
        location: 'Test City',
        yearsOfExperience: 3,
        skills: ['JavaScript', 'React'],
        certifications: [],
        experience: [{
          company: 'Test Co',
          title: 'Developer',
          startDate: '2021-01',
          endDate: 'Present',
          responsibilities: 'Testing the new PDF service'
        }],
        education: ['BS Computer Science'],
        languages: ['English'],
        summary: 'Testing the new PDF service implementation'
      },
      format: 'pdf'
    }
  },
  {
    name: 'Complex Test with Logo',
    data: {
      candidateData: {
        id: 'test-complex',
        fullName: 'Sarah Johnson',
        currentTitle: 'Senior Software Engineer',
        email: 'sarah@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        yearsOfExperience: 7,
        skills: ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'AWS'],
        certifications: ['AWS Certified Solutions Architect', 'React Professional'],
        experience: [
          {
            company: 'TechCorp Inc.',
            title: 'Senior Software Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            responsibilities: 'Led development team and implemented microservices architecture'
          },
          {
            company: 'StartupFlow',
            title: 'Software Engineer',
            startDate: '2018-06',
            endDate: '2019-12',
            responsibilities: 'Developed responsive web applications using React'
          }
        ],
        education: [
          'Master of Science in Computer Science | Stanford University',
          'Bachelor of Science in Software Engineering | UC Berkeley'
        ],
        languages: ['English (Native)', 'Spanish (Professional)'],
        summary: 'Experienced software engineer with expertise in full-stack development'
      },
      format: 'pdf',
      logoUrl: 'https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png'
    }
  }
];

// Helper function to make HTTP requests
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test function
async function runTests() {
  console.log('🧪 Testing New PDF Service Implementation');
  console.log('=' .repeat(50));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🎯 Endpoint: ${ENDPOINT}`);
  console.log('');

  let passedTests = 0;
  let totalTests = testCandidates.length;

  for (let i = 0; i < testCandidates.length; i++) {
    const test = testCandidates[i];
    console.log(`🔍 Test ${i + 1}/${totalTests}: ${test.name}`);
    
    try {
      const startTime = Date.now();
      const response = await makeRequest(`${BASE_URL}${ENDPOINT}`, test.data);
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status Code: ${response.statusCode}`);
      
      if (response.statusCode === 200 && response.data.success) {
        console.log('✅ Test PASSED');
        console.log(`📄 File URL: ${response.data.data.fileUrl}`);
        console.log(`📏 File Size: ${response.data.data.fileSize} bytes`);
        console.log(`📋 Format: ${response.data.data.format}`);
        
        if (response.data.warning) {
          console.log(`⚠️  Warning: ${response.data.warning}`);
        }
        
        passedTests++;
      } else {
        console.log('❌ Test FAILED');
        console.log(`💥 Error: ${response.data.error || 'Unknown error'}`);
        
        if (response.data.details) {
          console.log(`🔍 Details: ${response.data.details}`);
        }
      }
    } catch (error) {
      console.log('❌ Test FAILED');
      console.log(`💥 Network Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 Test Summary');
  console.log('=' .repeat(30));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! PDF service is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Health check function
async function healthCheck() {
  console.log('🏥 Health Check');
  console.log('-'.repeat(20));
  
  try {
    const response = await makeRequest(`${BASE_URL}${ENDPOINT}`, {});
    
    if (response.statusCode === 405) {
      // Try GET request for health check
      const urlObj = new URL(`${BASE_URL}${ENDPOINT}`);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      return new Promise((resolve) => {
        const req = client.get(`${BASE_URL}${ENDPOINT}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              console.log('✅ Service is healthy');
              console.log(`📊 Status: ${parsed.status}`);
              console.log(`🎯 Endpoint: ${parsed.endpoint}`);
              console.log(`🔧 Features: ${parsed.features.join(', ')}`);
              resolve();
            } catch (error) {
              console.log('❌ Health check failed');
              resolve();
            }
          });
        });
        
        req.on('error', () => {
          console.log('❌ Health check failed');
          resolve();
        });
      });
    }
  } catch (error) {
    console.log('❌ Health check failed');
  }
}

// Main execution
async function main() {
  await healthCheck();
  console.log('');
  await runTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, healthCheck }; 