/* global Office */

// Emineon Email Composer - JavaScript
// Copyright (c) 2024 Emineon ATS. All rights reserved.

let selectedTemplate = null;
let currentCategory = 'candidate';
let templates = {};

// Initialize when Office.js is ready
Office.onReady((info) => {
    if (info.host === Office.HostApplication.Outlook) {
        console.log('✅ Emineon Email Composer loaded');
        
        // Initialize icons
        lucide.createIcons();
        
        // Load templates
        loadTemplates();
        
        // Set up context
        setupContext();
    }
});

/**
 * Load email templates
 */
function loadTemplates() {
    console.log('📄 Loading email templates...');
    
    templates = {
        candidate: {
            'application-received': {
                title: 'Application Received',
                description: 'Acknowledge candidate application with next steps',
                subject: 'Thank you for your application - {{position}}',
                body: `Dear {{candidateName}},

Thank you for your interest in the {{position}} role at {{company}}. We have received your application and are currently reviewing all submissions.

Our team will carefully review your qualifications and experience. If your background aligns with our requirements, we will reach out within the next 5-7 business days to discuss next steps.

In the meantime, please feel free to explore more about our company and culture on our website.

Best regards,
{{recruiterName}}
{{company}} Recruitment Team`,
                tags: ['Professional', 'Auto']
            },
            'interview-invitation': {
                title: 'Interview Invitation',
                description: 'Invite candidate for interview with details',
                subject: 'Interview Invitation - {{position}} at {{company}}',
                body: `Dear {{candidateName}},

We are pleased to invite you for an interview for the {{position}} role at {{company}}.

Interview Details:
📅 Date: {{interviewDate}}
🕐 Time: {{interviewTime}}
📍 Location: {{interviewLocation}}
👥 Interview Panel: {{interviewers}}

The interview will take approximately {{duration}} minutes and will cover your experience, technical skills, and cultural fit.

Please confirm your attendance by replying to this email. If you have any questions or need to reschedule, please don't hesitate to contact me.

Looking forward to meeting you!

Best regards,
{{recruiterName}}`,
                tags: ['Formal', 'Scheduling']
            },
            'follow-up': {
                title: 'Candidate Follow-up',
                description: 'Professional follow-up after interview',
                subject: 'Following up on your interview - {{position}}',
                body: `Dear {{candidateName}},

Thank you for taking the time to interview with us for the {{position}} role yesterday. It was a pleasure meeting you and learning more about your experience.

We were impressed by your {{highlights}} and believe you would be a valuable addition to our team.

We are currently finalizing our decision process and will update you on the outcome within the next {{timeframe}} business days.

If you have any questions in the meantime, please feel free to reach out.

Best regards,
{{recruiterName}}`,
                tags: ['Follow-up', 'Warm']
            },
            'rejection-feedback': {
                title: 'Constructive Rejection',
                description: 'Professional rejection with helpful feedback',
                subject: 'Update on your application - {{position}}',
                body: `Dear {{candidateName}},

Thank you for your interest in the {{position}} role and for the time you invested in our interview process.

After careful consideration, we have decided to move forward with another candidate whose experience more closely aligns with our current requirements.

However, we were impressed by {{positives}} and encourage you to apply for future opportunities that match your skills and experience.

We will keep your profile on file and reach out if suitable positions become available.

Thank you again for your interest in {{company}}.

Best regards,
{{recruiterName}}`,
                tags: ['Respectful', 'Feedback']
            }
        },
        client: {
            'project-proposal': {
                title: 'Project Proposal',
                description: 'Present recruitment project proposal to client',
                subject: 'Recruitment Partnership Proposal - {{company}}',
                body: `Dear {{clientName}},

Thank you for considering Emineon for your recruitment needs. Based on our discussion, I've prepared a tailored proposal for your {{department}} hiring requirements.

Project Overview:
🎯 Positions: {{positions}}
📊 Timeline: {{timeline}}
💰 Investment: {{budget}}
📈 Success Metrics: {{metrics}}

Our approach includes comprehensive candidate sourcing, thorough screening, and dedicated project management to ensure we find the right talent for your organization.

I'd love to schedule a call to discuss this proposal in detail and answer any questions you may have.

Best regards,
{{recruiterName}}`,
                tags: ['Professional', 'Business']
            }
        },
        interview: {
            'interview-confirmation': {
                title: 'Interview Confirmation',
                description: 'Confirm interview details with candidate',
                subject: 'Interview Confirmation - {{position}} on {{date}}',
                body: `Dear {{candidateName}},

This email confirms your upcoming interview for the {{position}} role:

📅 Date: {{date}}
🕐 Time: {{time}}
📍 Location: {{location}}
👥 Interviewer(s): {{interviewers}}

Please bring:
• Updated copy of your resume
• Portfolio/work samples (if applicable)
• Valid ID
• Any questions about the role or company

If you need to reschedule or have any questions, please contact me immediately.

We look forward to meeting you!

Best regards,
{{recruiterName}}`,
                tags: ['Confirmation', 'Details']
            }
        }
    };
    
    // Load current category templates
    loadCategoryTemplates(currentCategory);
}

/**
 * Load templates for specific category
 */
function loadCategoryTemplates(category) {
    const templateGrid = document.getElementById('templateGrid');
    templateGrid.innerHTML = '';
    
    const categoryTemplates = templates[category] || {};
    
    Object.keys(categoryTemplates).forEach(templateId => {
        const template = categoryTemplates[templateId];
        const templateCard = document.createElement('div');
        templateCard.className = 'template-card';
        templateCard.onclick = () => selectTemplate(templateId);
        
        templateCard.innerHTML = `
            <div class="template-title">${template.title}</div>
            <div class="template-desc">${template.description}</div>
            <div class="template-tags">
                ${template.tags.map(tag => `<span class="template-tag">${tag}</span>`).join('')}
            </div>
        `;
        
        templateGrid.appendChild(templateCard);
    });
}

/**
 * Select template category
 */
function selectCategory(category) {
    console.log('📂 Selecting category:', category);
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Load templates for category
    currentCategory = category;
    loadCategoryTemplates(category);
}

/**
 * Select specific template
 */
function selectTemplate(templateId) {
    console.log('📄 Selecting template:', templateId);
    
    // Update selected card
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.target.closest('.template-card').classList.add('selected');
    
    // Store selected template
    selectedTemplate = {
        id: templateId,
        category: currentCategory,
        data: templates[currentCategory][templateId]
    };
    
    console.log('✅ Template selected:', selectedTemplate);
}

/**
 * Setup email context
 */
function setupContext() {
    // Check if this is a reply/forward
    if (Office.context.mailbox.item) {
        Office.context.mailbox.item.subject.getAsync((result) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
                const subject = result.value || 'New Email';
                const contextElement = document.getElementById('replyContext');
                
                if (subject.startsWith('Re:') || subject.startsWith('Fwd:')) {
                    contextElement.innerHTML = `<strong>${subject}</strong>`;
                } else {
                    contextElement.innerHTML = '<strong>New Email</strong>';
                }
            }
        });
    }
}

/**
 * AI Writing Functions
 */
function generateEmail() {
    const prompt = document.getElementById('aiPrompt').value.trim();
    
    if (!prompt) {
        showNotification('Please enter a description for your email', 'warning');
        return;
    }
    
    console.log('🤖 Generating email with AI:', prompt);
    
    // Simulate AI generation (replace with real OpenAI integration)
    showNotification('AI email generation coming soon!', 'info');
    
    // For demo, could show a generated template based on prompt
    // This would integrate with OpenAI API in production
}

function improveEmail() {
    console.log('✨ Improving email tone...');
    showNotification('AI tone improvement coming soon!', 'info');
}

function makeShorter() {
    console.log('📏 Making email shorter...');
    showNotification('AI text shortening coming soon!', 'info');
}

function makeFormal() {
    console.log('🎩 Making email more formal...');
    showNotification('AI formality adjustment coming soon!', 'info');
}

/**
 * Quick Actions
 */
function insertTemplate() {
    if (!selectedTemplate) {
        showNotification('Please select a template first', 'warning');
        return;
    }
    
    console.log('📝 Inserting template:', selectedTemplate);
    
    // Insert into email body
    const { subject, body } = selectedTemplate.data;
    
    try {
        // Set subject
        Office.context.mailbox.item.subject.setAsync(subject, (result) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
                console.log('✅ Subject set');
            }
        });
        
        // Set body
        Office.context.mailbox.item.body.setAsync(body, { coercionType: Office.CoercionType.Text }, (result) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
                console.log('✅ Body set');
                showNotification('Template inserted successfully!', 'success');
            } else {
                console.error('❌ Failed to set body:', result.error);
                showNotification('Failed to insert template', 'error');
            }
        });
        
    } catch (error) {
        console.error('❌ Error inserting template:', error);
        showNotification('Error inserting template', 'error');
    }
}

function addCalendarLink() {
    console.log('📅 Adding calendar link...');
    showNotification('Calendar integration coming soon!', 'info');
}

function addSignature() {
    console.log('✍️ Adding signature...');
    
    const signature = `
    
Best regards,
Your Name
Senior Recruitment Consultant
Emineon ATS

📧 your.email@emineon.com
📞 +1 (555) 123-4567
🌐 www.emineon.com`;

    try {
        Office.context.mailbox.item.body.getAsync(Office.CoercionType.Text, (result) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
                const currentBody = result.value || '';
                const newBody = currentBody + signature;
                
                Office.context.mailbox.item.body.setAsync(newBody, { coercionType: Office.CoercionType.Text }, (setResult) => {
                    if (setResult.status === Office.AsyncResultStatus.Succeeded) {
                        showNotification('Signature added!', 'success');
                    }
                });
            }
        });
    } catch (error) {
        console.error('❌ Error adding signature:', error);
        showNotification('Error adding signature', 'error');
    }
}

function scheduleEmail() {
    console.log('⏰ Scheduling email...');
    showNotification('Email scheduling coming soon!', 'info');
}

/**
 * Utility Functions
 */
function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Create temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#059669' : type === 'warning' ? '#D97706' : type === 'error' ? '#EF4444' : '#0891B2'};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        const aiPrompt = document.getElementById('aiPrompt');
        if (document.activeElement === aiPrompt) {
            generateEmail();
        }
    }
    
    if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        insertTemplate();
    }
});

console.log('🎯 Emineon Email Composer initialized'); 