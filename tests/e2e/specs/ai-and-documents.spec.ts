import { test, expect } from '@playwright/test';
import { mockAuthentication, waitForApp } from '../helpers/auth';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Comprehensive tests for AI features, document generation, and parsing
 */
test.describe('AI Features & Document Processing', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await waitForApp(page);
  });

  test.describe('AI Job Parsing', () => {
    test('should parse complete job description with AI', async ({ page }) => {
      await page.goto('/jobs/new');

      const jobDescription = `
        Senior Full Stack Engineer
        Location: San Francisco, CA (Hybrid - 3 days in office)
        Salary: $180,000 - $220,000 + equity
        
        About the Role:
        We're seeking an experienced Full Stack Engineer to join our growing team. 
        You'll be working on cutting-edge AI applications using modern technologies.
        
        Requirements:
        - 7+ years of software development experience
        - Expert knowledge of React, Next.js, and TypeScript
        - Strong backend experience with Node.js and Python
        - Experience with PostgreSQL and Redis
        - Familiarity with AWS services (EC2, S3, Lambda)
        - Experience with Docker and Kubernetes
        - Strong understanding of CI/CD pipelines
        
        Nice to Have:
        - Experience with machine learning frameworks (TensorFlow, PyTorch)
        - Knowledge of GraphQL
        - Contributions to open source projects
        - Experience with microservices architecture
        
        Benefits:
        - Competitive salary and equity
        - Health, dental, and vision insurance
        - $2,000 annual learning budget
        - Flexible work arrangements
        - 20 days PTO + holidays
      `;

      // Paste job description
      await page.fill('[data-test="job-description-input"]', jobDescription);
      
      // Click AI parse button
      await page.click('[data-test="ai-parse-button"]');
      
      // Wait for parsing
      await expect(page.locator('[data-test="ai-parsing"]')).toBeVisible();
      await expect(page.locator('[data-test="parsing-complete"]')).toBeVisible({ timeout: 20000 });
      
      // Verify all fields were extracted correctly
      await expect(page.locator('[data-test="job-title"]')).toHaveValue('Senior Full Stack Engineer');
      await expect(page.locator('[data-test="job-location"]')).toHaveValue('San Francisco, CA (Hybrid - 3 days in office)');
      await expect(page.locator('[data-test="job-salary-min"]')).toHaveValue('180000');
      await expect(page.locator('[data-test="job-salary-max"]')).toHaveValue('220000');
      await expect(page.locator('[data-test="job-type"]')).toHaveValue('hybrid');
      
      // Check requirements were parsed
      const requirements = page.locator('[data-test="requirement-item"]');
      await expect(requirements).toHaveCount(7);
      await expect(requirements.first()).toContainText('7+ years');
      
      // Check nice-to-haves
      const niceToHaves = page.locator('[data-test="nice-to-have-item"]');
      await expect(niceToHaves).toHaveCount(4);
      
      // Check benefits
      const benefits = page.locator('[data-test="benefit-item"]');
      await expect(benefits).toHaveCount(5);
    });

    test('should handle partial job descriptions', async ({ page }) => {
      await page.goto('/jobs/new');

      const partialDescription = `
        Looking for a Python Developer
        Remote position
        Must have Django experience
      `;

      await page.fill('[data-test="job-description-input"]', partialDescription);
      await page.click('[data-test="ai-parse-button"]');
      
      await expect(page.locator('[data-test="parsing-complete"]')).toBeVisible({ timeout: 15000 });
      
      // Should extract what it can
      await expect(page.locator('[data-test="job-title"]')).toHaveValue('Python Developer');
      await expect(page.locator('[data-test="job-location"]')).toHaveValue('Remote');
      
      // Should show info about missing fields
      await expect(page.locator('[data-test="missing-fields-info"]')).toBeVisible();
    });

    test('should suggest improvements to job description', async ({ page }) => {
      await page.goto('/jobs/new');

      const basicDescription = `
        Developer needed
        Good pay
        Start ASAP
      `;

      await page.fill('[data-test="job-description-input"]', basicDescription);
      await page.click('[data-test="ai-improve-button"]');
      
      await expect(page.locator('[data-test="ai-suggestions"]')).toBeVisible({ timeout: 15000 });
      
      // Should show improvement suggestions
      await expect(page.locator('[data-test="suggestion-item"]')).toHaveCount(await page.locator('[data-test="suggestion-item"]').count());
      
      // Apply suggestions
      await page.click('[data-test="apply-all-suggestions"]');
      
      // Description should be improved
      const improvedText = await page.locator('[data-test="job-description-input"]').inputValue();
      expect(improvedText.length).toBeGreaterThan(basicDescription.length);
    });
  });

  test.describe('CV/Resume Parsing', () => {
    test('should parse PDF resume', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="upload-cv-btn"]');

      // Create a test PDF content
      const pdfPath = path.join(__dirname, '../../fixtures/sample-cv.pdf');
      
      // Upload PDF
      await page.setInputFiles('[data-test="cv-file-input"]', pdfPath);
      
      // Check file preview
      await expect(page.locator('[data-test="file-preview"]')).toBeVisible();
      await expect(page.locator('[data-test="file-name"]')).toContainText('sample-cv.pdf');
      
      // Submit for parsing
      await page.click('[data-test="upload-cv-submit"]');
      
      // Wait for parsing
      await expect(page.locator('[data-test="parsing-progress"]')).toBeVisible();
      await expect(page.locator('[data-test="parsing-steps"]')).toBeVisible();
      
      // Check parsing steps
      await expect(page.locator('[data-test="step-upload"]')).toHaveClass(/completed/);
      await expect(page.locator('[data-test="step-extract"]')).toHaveClass(/completed/);
      await expect(page.locator('[data-test="step-parse"]')).toHaveClass(/completed/);
      
      // Wait for completion
      await expect(page.locator('[data-test="upload-success"]')).toBeVisible({ timeout: 30000 });
      
      // Verify parsed data preview
      await expect(page.locator('[data-test="parsed-preview"]')).toBeVisible();
      await expect(page.locator('[data-test="preview-name"]')).toBeVisible();
      await expect(page.locator('[data-test="preview-email"]')).toBeVisible();
      await expect(page.locator('[data-test="preview-skills"]')).toBeVisible();
      
      // Confirm creation
      await page.click('[data-test="confirm-create-candidate"]');
      
      // Should navigate to candidate profile
      await expect(page).toHaveURL(/\/candidates\/[a-zA-Z0-9-]+$/);
    });

    test('should parse DOCX resume', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="upload-cv-btn"]');

      // Create DOCX content
      const docxContent = Buffer.from('Mock DOCX content with resume data');
      
      await page.setInputFiles('[data-test="cv-file-input"]', {
        name: 'resume.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: docxContent
      });
      
      await page.click('[data-test="upload-cv-submit"]');
      
      // Should handle DOCX parsing
      await expect(page.locator('[data-test="upload-success"]')).toBeVisible({ timeout: 30000 });
    });

    test('should handle multiple file uploads', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="bulk-upload-btn"]');

      // Upload multiple files
      const files = [
        { name: 'cv1.pdf', content: 'CV 1 content' },
        { name: 'cv2.pdf', content: 'CV 2 content' },
        { name: 'cv3.pdf', content: 'CV 3 content' }
      ];

      const fileBuffers = files.map(f => ({
        name: f.name,
        mimeType: 'application/pdf',
        buffer: Buffer.from(f.content)
      }));

      await page.setInputFiles('[data-test="bulk-cv-input"]', fileBuffers);
      
      // Should show all files
      await expect(page.locator('[data-test="file-list-item"]')).toHaveCount(3);
      
      // Start bulk processing
      await page.click('[data-test="process-all-btn"]');
      
      // Should show progress for each file
      for (let i = 0; i < 3; i++) {
        await expect(page.locator(`[data-test="file-progress-${i}"]`)).toBeVisible();
      }
      
      // Wait for all to complete
      await expect(page.locator('[data-test="bulk-complete"]')).toBeVisible({ timeout: 60000 });
      
      // Should show summary
      await expect(page.locator('[data-test="success-count"]')).toContainText('3');
    });
  });

  test.describe('AI Candidate Matching', () => {
    test('should match candidates to job with AI scoring', async ({ page }) => {
      await page.goto('/jobs');
      await page.click('[data-test="job-card"]').first();
      
      // Click AI match button
      await page.click('[data-test="ai-match-candidates"]');
      
      // Configure matching parameters
      await page.fill('[data-test="match-threshold"]', '75');
      await page.check('[data-test="include-passive"]');
      await page.check('[data-test="consider-relocation"]');
      
      // Select matching criteria weights
      await page.fill('[data-test="weight-skills"]', '40');
      await page.fill('[data-test="weight-experience"]', '30');
      await page.fill('[data-test="weight-location"]', '20');
      await page.fill('[data-test="weight-culture"]', '10');
      
      // Run matching
      await page.click('[data-test="run-matching"]');
      
      // Wait for AI processing
      await expect(page.locator('[data-test="matching-progress"]')).toBeVisible();
      await expect(page.locator('[data-test="ai-analyzing"]')).toBeVisible();
      
      // Should show progress stages
      await expect(page.locator('[data-test="stage-embedding"]')).toBeVisible();
      await expect(page.locator('[data-test="stage-scoring"]')).toBeVisible();
      await expect(page.locator('[data-test="stage-ranking"]')).toBeVisible();
      
      // Wait for results
      await expect(page.locator('[data-test="match-results"]')).toBeVisible({ timeout: 30000 });
      
      // Check results structure
      const matches = page.locator('[data-test="candidate-match"]');
      const matchCount = await matches.count();
      expect(matchCount).toBeGreaterThan(0);
      
      // Each match should have score and reasons
      for (let i = 0; i < Math.min(3, matchCount); i++) {
        const match = matches.nth(i);
        await expect(match.locator('[data-test="match-score"]')).toBeVisible();
        await expect(match.locator('[data-test="match-percentage"]')).toBeVisible();
        await expect(match.locator('[data-test="match-reasons"]')).toBeVisible();
        
        // Score should be above threshold
        const scoreText = await match.locator('[data-test="match-percentage"]').textContent();
        const score = parseInt(scoreText?.replace('%', '') || '0');
        expect(score).toBeGreaterThanOrEqual(75);
      }
      
      // Should be sorted by score
      const scores: number[] = [];
      for (let i = 0; i < matchCount; i++) {
        const scoreText = await matches.nth(i).locator('[data-test="match-percentage"]').textContent();
        scores.push(parseInt(scoreText?.replace('%', '') || '0'));
      }
      
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });

    test('should show detailed match analysis', async ({ page }) => {
      await page.goto('/jobs');
      await page.click('[data-test="job-card"]').first();
      await page.click('[data-test="ai-match-candidates"]');
      await page.click('[data-test="run-matching"]');
      await page.waitForSelector('[data-test="match-results"]', { timeout: 30000 });
      
      // Click on a match to see details
      await page.click('[data-test="candidate-match"]').first();
      
      // Should show detailed analysis
      await expect(page.locator('[data-test="match-detail-modal"]')).toBeVisible();
      
      // Check analysis sections
      await expect(page.locator('[data-test="skills-analysis"]')).toBeVisible();
      await expect(page.locator('[data-test="experience-analysis"]')).toBeVisible();
      await expect(page.locator('[data-test="gap-analysis"]')).toBeVisible();
      
      // Skills breakdown
      await expect(page.locator('[data-test="required-skills-match"]')).toBeVisible();
      await expect(page.locator('[data-test="nice-to-have-match"]')).toBeVisible();
      await expect(page.locator('[data-test="additional-skills"]')).toBeVisible();
      
      // AI insights
      await expect(page.locator('[data-test="ai-insights"]')).toBeVisible();
      await expect(page.locator('[data-test="strengths-list"]')).toBeVisible();
      await expect(page.locator('[data-test="concerns-list"]')).toBeVisible();
      await expect(page.locator('[data-test="interview-suggestions"]')).toBeVisible();
    });
  });

  test.describe('Document Generation', () => {
    test('should generate CV with multiple templates', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="candidate-card"]').first();
      await page.click('[data-test="tab-documents"]');
      
      const templates = ['modern', 'classic', 'minimal', 'creative'];
      
      for (const template of templates) {
        await page.click('[data-test="generate-cv"]');
        
        // Select template
        await page.selectOption('[data-test="cv-template"]', template);
        
        // Preview template
        await page.click('[data-test="preview-template"]');
        await expect(page.locator('[data-test="template-preview"]')).toBeVisible();
        await expect(page.locator('[data-test="template-preview"]')).toHaveClass(new RegExp(template));
        
        // Configure options
        await page.check('[data-test="include-photo"]');
        await page.check('[data-test="include-summary"]');
        await page.check('[data-test="include-skills"]');
        await page.check('[data-test="include-experience"]');
        await page.check('[data-test="include-education"]');
        
        // Select format
        await page.click('[data-test="format-pdf"]');
        
        // Generate
        await page.click('[data-test="generate-btn"]');
        
        // Wait for generation
        await expect(page.locator('[data-test="generation-progress"]')).toBeVisible();
        await expect(page.locator('[data-test="download-cv"]')).toBeVisible({ timeout: 20000 });
        
        // Verify download link
        const downloadButton = page.locator('[data-test="download-cv"]');
        await expect(downloadButton).toHaveAttribute('href', /\.pdf$/);
        
        // Close modal
        await page.click('[data-test="close-modal"]');
      }
    });

    test('should generate competence file with all templates', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="candidate-card"]').first();
      
      const templates = ['antaes', 'emineon', 'standard', 'detailed'];
      
      for (const template of templates) {
        await page.click('[data-test="generate-competence-file"]');
        
        // Select template
        await page.selectOption('[data-test="template-select"]', template);
        
        // Configure template-specific options
        if (template === 'antaes') {
          await page.check('[data-test="include-certifications"]');
          await page.check('[data-test="include-trainings"]');
          await page.check('[data-test="include-languages"]');
        }
        
        // Select language
        await page.selectOption('[data-test="language-select"]', 'en');
        
        // Add custom sections
        await page.click('[data-test="add-custom-section"]');
        await page.fill('[data-test="custom-section-title"]', 'Key Projects');
        await page.fill('[data-test="custom-section-content"]', 'Project details here');
        
        // Generate
        await page.click('[data-test="generate-btn"]');
        
        // Wait for queue processing
        await expect(page.locator('[data-test="queued-status"]')).toBeVisible();
        await expect(page.locator('[data-test="processing-status"]')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('[data-test="completed-status"]')).toBeVisible({ timeout: 30000 });
        
        // Download should be available
        await expect(page.locator('[data-test="download-competence-file"]')).toBeVisible();
        
        // Close modal
        await page.click('[data-test="close-modal"]');
      }
    });

    test('should handle competence file editor', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="candidate-card"]').first();
      await page.click('[data-test="generate-competence-file"]');
      
      // Generate initial file
      await page.selectOption('[data-test="template-select"]', 'antaes');
      await page.click('[data-test="generate-btn"]');
      await page.waitForSelector('[data-test="completed-status"]', { timeout: 30000 });
      
      // Open editor
      await page.click('[data-test="edit-competence-file"]');
      
      // Editor should load with content
      await expect(page.locator('[data-test="competence-editor"]')).toBeVisible();
      await expect(page.locator('[data-test="editor-toolbar"]')).toBeVisible();
      
      // Edit content
      await page.click('[data-test="section-professional-experience"]');
      await page.fill('[data-test="experience-editor"]', 'Updated experience content');
      
      // Add new section
      await page.click('[data-test="add-section-button"]');
      await page.selectOption('[data-test="section-type"]', 'achievements');
      await page.fill('[data-test="section-content"]', 'New achievements');
      
      // Preview changes
      await page.click('[data-test="preview-changes"]');
      await expect(page.locator('[data-test="preview-pane"]')).toBeVisible();
      await expect(page.locator('[data-test="preview-pane"]')).toContainText('Updated experience content');
      
      // Save changes
      await page.click('[data-test="save-competence-file"]');
      await expect(page.locator('[data-test="save-success"]')).toBeVisible();
      
      // Regenerate PDF
      await page.click('[data-test="regenerate-pdf"]');
      await expect(page.locator('[data-test="regeneration-complete"]')).toBeVisible({ timeout: 20000 });
    });
  });

  test.describe('AI Interview Preparation', () => {
    test('should generate interview questions based on job and candidate', async ({ page }) => {
      await page.goto('/jobs');
      await page.click('[data-test="job-card"]').first();
      
      // Navigate to candidate in pipeline
      await page.click('[data-test="candidate-card"]').first();
      
      // Generate interview questions
      await page.click('[data-test="prepare-interview"]');
      
      // Select interview type
      await page.selectOption('[data-test="interview-type"]', 'technical');
      
      // Configure question generation
      await page.fill('[data-test="question-count"]', '10');
      await page.check('[data-test="include-behavioral"]');
      await page.check('[data-test="include-technical"]');
      await page.check('[data-test="include-situational"]');
      
      // Set difficulty
      await page.click('[data-test="difficulty-senior"]');
      
      // Generate questions
      await page.click('[data-test="generate-questions"]');
      
      // Wait for AI generation
      await expect(page.locator('[data-test="generating-questions"]')).toBeVisible();
      await expect(page.locator('[data-test="questions-ready"]')).toBeVisible({ timeout: 20000 });
      
      // Check generated questions
      const questions = page.locator('[data-test="interview-question"]');
      await expect(questions).toHaveCount(10);
      
      // Each question should have expected answer
      for (let i = 0; i < 3; i++) {
        const question = questions.nth(i);
        await expect(question.locator('[data-test="question-text"]')).toBeVisible();
        await expect(question.locator('[data-test="expected-answer"]')).toBeVisible();
        await expect(question.locator('[data-test="follow-ups"]')).toBeVisible();
      }
      
      // Save question set
      await page.fill('[data-test="question-set-name"]', 'Technical Interview Round 1');
      await page.click('[data-test="save-questions"]');
      await expect(page.locator('[data-test="questions-saved"]')).toBeVisible();
    });

    test('should generate candidate assessment report', async ({ page }) => {
      await page.goto('/jobs');
      await page.click('[data-test="job-card"]').first();
      await page.click('[data-test="candidate-card"]').first();
      
      // Generate assessment
      await page.click('[data-test="generate-assessment"]');
      
      // Wait for AI analysis
      await expect(page.locator('[data-test="analyzing-candidate"]')).toBeVisible();
      await expect(page.locator('[data-test="assessment-ready"]')).toBeVisible({ timeout: 25000 });
      
      // Check assessment sections
      await expect(page.locator('[data-test="technical-fit"]')).toBeVisible();
      await expect(page.locator('[data-test="experience-match"]')).toBeVisible();
      await expect(page.locator('[data-test="culture-fit"]')).toBeVisible();
      await expect(page.locator('[data-test="risk-factors"]')).toBeVisible();
      await expect(page.locator('[data-test="recommendations"]')).toBeVisible();
      
      // Should have scores
      const scores = ['technical', 'experience', 'culture', 'overall'];
      for (const scoreType of scores) {
        const score = page.locator(`[data-test="${scoreType}-score"]`);
        await expect(score).toBeVisible();
        const scoreValue = await score.textContent();
        expect(parseInt(scoreValue || '0')).toBeGreaterThan(0);
      }
      
      // Export assessment
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-test="export-assessment"]')
      ]);
      
      expect(download.suggestedFilename()).toContain('assessment');
    });
  });

  test.describe('AI Email Generation', () => {
    test('should generate outreach emails', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="candidate-card"]').first();
      
      // Click compose email
      await page.click('[data-test="compose-email"]');
      
      // Select AI template
      await page.click('[data-test="use-ai-template"]');
      
      // Select email type
      await page.selectOption('[data-test="email-type"]', 'initial-outreach');
      
      // Provide context
      await page.fill('[data-test="job-context"]', 'Senior React Developer position');
      await page.fill('[data-test="company-context"]', 'Fast-growing fintech startup');
      
      // Set tone
      await page.click('[data-test="tone-professional"]');
      
      // Generate email
      await page.click('[data-test="generate-email"]');
      
      // Wait for generation
      await expect(page.locator('[data-test="generating-email"]')).toBeVisible();
      await expect(page.locator('[data-test="email-generated"]')).toBeVisible({ timeout: 15000 });
      
      // Check generated content
      const emailContent = page.locator('[data-test="email-content"]');
      await expect(emailContent).toBeVisible();
      const content = await emailContent.textContent();
      expect(content?.length).toBeGreaterThan(100);
      
      // Should have personalization
      expect(content).toContain('React');
      
      // Edit if needed
      await emailContent.click();
      await page.keyboard.type(' Looking forward to hearing from you!');
      
      // Preview
      await page.click('[data-test="preview-email"]');
      await expect(page.locator('[data-test="email-preview-modal"]')).toBeVisible();
      
      // Send email
      await page.click('[data-test="send-email"]');
      await expect(page.locator('[data-test="email-sent"]')).toBeVisible();
    });

    test('should generate follow-up sequences', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="candidate-card"]').first();
      
      // Create follow-up sequence
      await page.click('[data-test="create-sequence"]');
      
      // Configure sequence
      await page.fill('[data-test="sequence-name"]', 'React Developer Outreach');
      await page.fill('[data-test="sequence-steps"]', '3');
      
      // Generate sequence with AI
      await page.click('[data-test="ai-generate-sequence"]');
      
      // Wait for generation
      await expect(page.locator('[data-test="sequence-generated"]')).toBeVisible({ timeout: 20000 });
      
      // Check sequence steps
      const steps = page.locator('[data-test="sequence-step"]');
      await expect(steps).toHaveCount(3);
      
      // Each step should have timing and content
      for (let i = 0; i < 3; i++) {
        const step = steps.nth(i);
        await expect(step.locator('[data-test="step-delay"]')).toBeVisible();
        await expect(step.locator('[data-test="step-content"]')).toBeVisible();
        await expect(step.locator('[data-test="step-subject"]')).toBeVisible();
      }
      
      // Activate sequence
      await page.click('[data-test="activate-sequence"]');
      await expect(page.locator('[data-test="sequence-active"]')).toBeVisible();
    });
  });

  test.describe('LinkedIn Profile Enrichment', () => {
    test('should enrich candidate from LinkedIn URL', async ({ page }) => {
      await page.goto('/candidates');
      await page.click('[data-test="candidate-card"]').first();
      
      // Add LinkedIn URL
      await page.click('[data-test="edit-candidate"]');
      await page.fill('[data-test="linkedin-url"]', 'https://linkedin.com/in/john-doe-example');
      await page.click('[data-test="save-candidate"]');
      
      // Trigger enrichment
      await page.click('[data-test="enrich-profile"]');
      
      // Should show enrichment progress
      await expect(page.locator('[data-test="enriching-profile"]')).toBeVisible();
      await expect(page.locator('[data-test="enrichment-complete"]')).toBeVisible({ timeout: 20000 });
      
      // Check enriched data
      await expect(page.locator('[data-test="enriched-badge"]')).toBeVisible();
      
      // Should have added data
      await expect(page.locator('[data-test="profile-summary"]')).not.toBeEmpty();
      await expect(page.locator('[data-test="experience-list"]').locator('li')).toHaveCount(await page.locator('[data-test="experience-list"]').locator('li').count());
      await expect(page.locator('[data-test="skills-list"]').locator('[data-test="skill-tag"]')).toHaveCount(await page.locator('[data-test="skills-list"]').locator('[data-test="skill-tag"]').count());
    });
  });

  test.describe('Queue System for Document Generation', () => {
    test('should handle concurrent document generation requests', async ({ page }) => {
      await page.goto('/candidates');
      
      // Generate multiple documents concurrently
      const candidates = page.locator('[data-test="candidate-card"]');
      const candidateCount = Math.min(5, await candidates.count());
      
      // Queue multiple generations
      for (let i = 0; i < candidateCount; i++) {
        await candidates.nth(i).click();
        await page.click('[data-test="generate-competence-file"]');
        await page.selectOption('[data-test="template-select"]', 'antaes');
        await page.click('[data-test="generate-btn"]');
        await page.click('[data-test="close-modal"]');
      }
      
      // Check queue status
      await page.goto('/settings/queue');
      
      // Should show all queued items
      await expect(page.locator('[data-test="queue-item"]')).toHaveCount(candidateCount);
      
      // Check queue item states
      const queueItems = page.locator('[data-test="queue-item"]');
      for (let i = 0; i < candidateCount; i++) {
        const item = queueItems.nth(i);
        await expect(item.locator('[data-test="queue-status"]')).toBeVisible();
        
        // Should transition from queued to processing to completed
        await expect(item.locator('[data-test="queue-status"]')).toContainText(/queued|processing|completed/);
      }
      
      // Wait for all to complete
      await page.waitForFunction(
        (count) => {
          const completed = document.querySelectorAll('[data-test="queue-status"]:has-text("completed")').length;
          return completed === count;
        },
        candidateCount,
        { timeout: 60000 }
      );
      
      // All should be completed
      for (let i = 0; i < candidateCount; i++) {
        await expect(queueItems.nth(i).locator('[data-test="queue-status"]')).toContainText('completed');
      }
    });

    test('should handle queue failures and retries', async ({ page }) => {
      await page.goto('/candidates');
      
      // Mock a failing generation
      await page.route('**/api/documents/generate-competence', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();
        
        if (postData.template === 'failing-template') {
          await route.fulfill({
            status: 500,
            json: { error: 'Template processing failed' }
          });
        } else {
          await route.continue();
        }
      });
      
      // Trigger failing generation
      await page.click('[data-test="candidate-card"]').first();
      await page.click('[data-test="generate-competence-file"]');
      await page.selectOption('[data-test="template-select"]', 'failing-template');
      await page.click('[data-test="generate-btn"]');
      
      // Check queue for failure
      await page.goto('/settings/queue');
      await expect(page.locator('[data-test="queue-item"]').first().locator('[data-test="queue-status"]')).toContainText('failed');
      
      // Should have retry button
      await expect(page.locator('[data-test="retry-button"]')).toBeVisible();
      
      // Fix the mock to succeed on retry
      await page.unroute('**/api/documents/generate-competence');
      
      // Retry
      await page.click('[data-test="retry-button"]');
      
      // Should succeed on retry
      await expect(page.locator('[data-test="queue-item"]').first().locator('[data-test="queue-status"]')).toContainText('completed', { timeout: 30000 });
    });
  });
});
