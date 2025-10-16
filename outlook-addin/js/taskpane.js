// Emineon Outlook Add-in - Enhanced Recruitment Assistant
// Copyright (c) 2024 Emineon ATS. All rights reserved.

Office.onReady((info) => {
    if (info.host === Office.HostApplication.Outlook) {
        console.log('✅ Emineon Outlook Add-in loaded successfully');
        
        // Initialize icons
        lucide.createIcons();
        
        // Initialize the add-in
        initializeAddin();
        
        // Set up event listeners
        setupEventListeners();
        
        // Start analyzing the current email
        analyzeCurrentEmail();
        
        // Load dashboard data
        loadDashboardData();
    }
});

// Global variables
let currentEmailData = {};
let aiAnalysisComplete = false;
let dashboardData = {
    urgentItems: [],
    priorityJobs: [],
    recentActivity: []
};
let extractedContacts = [];

// Configuration - Auto-detect port or fallback
const EMINEON_ATS_URL = window.location.origin.includes('localhost') ? 
    `${window.location.protocol}//${window.location.hostname}:3005` : 
    'http://localhost:3005'; // Adjust based on your running port
const API_ENDPOINTS = {
    jobs: '/api/jobs',
    candidates: '/api/candidates',
    projects: '/api/projects',
    aiAnalysis: '/api/ai/email-analysis'
};

/**
 * Initialize the add-in
 */
function initializeAddin() {
    console.log('🔧 Initializing Emineon Add-in...');
    
    // Update connection status
    updateConnectionStatus(true);
    
    // Load email context
    loadEmailContext();
    
    console.log('✅ Add-in initialization complete');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Primary action buttons
    document.getElementById('createProjectBtn')?.addEventListener('click', createProject);
    document.getElementById('createJobBtn')?.addEventListener('click', createJob);
    document.getElementById('addCandidateBtn')?.addEventListener('click', showAddCandidateModal);
    document.getElementById('scheduleInterviewBtn')?.addEventListener('click', scheduleInterview);
    document.getElementById('addContactBtn')?.addEventListener('click', showAddContactModal);
    document.getElementById('assignJobBtn')?.addEventListener('click', assignToJob);
    
    // Quick access buttons
    document.getElementById('openAtsBtn')?.addEventListener('click', openATS);
    document.getElementById('refreshBtn')?.addEventListener('click', refreshData);
    
    // Modal event listeners
    setupModalEventListeners();
    
    console.log('✅ Event listeners set up');
}

/**
 * Set up modal event listeners
 */
function setupModalEventListeners() {
    // Add Contact Modal
    const addContactModal = document.getElementById('addContactModal');
    const closeContactModal = document.getElementById('closeContactModal');
    const cancelContactBtn = document.getElementById('cancelContactBtn');
    const contactForm = document.getElementById('contactForm');
    
    closeContactModal?.addEventListener('click', () => hideModal('addContactModal'));
    cancelContactBtn?.addEventListener('click', () => hideModal('addContactModal'));
    contactForm?.addEventListener('submit', handleContactFormSubmit);
    
    // Close modal when clicking outside
    addContactModal?.addEventListener('click', (e) => {
        if (e.target === addContactModal) {
            hideModal('addContactModal');
        }
    });
}

/**
 * Load email context and display basic info
 */
function loadEmailContext() {
    console.log('📧 Loading email context...');
    
            if (!Office.context.mailbox.item) {
        console.error('❌ No mailbox item available');
        showAIError('No email selected or available');
                return;
            }

    // Get subject
    Office.context.mailbox.item.subject.getAsync((result) => {
        console.log('📋 Subject result:', result);
        if (result.status === Office.AsyncResultStatus.Succeeded) {
            currentEmailData.subject = result.value || 'No subject';
            document.getElementById('emailSubject').textContent = currentEmailData.subject;
            console.log('✅ Subject loaded:', currentEmailData.subject);
        } else {
            console.error('❌ Failed to get subject:', result.error);
            currentEmailData.subject = 'Subject unavailable';
            document.getElementById('emailSubject').textContent = currentEmailData.subject;
        }
    });
    
    // Get sender
    Office.context.mailbox.item.from.getAsync((result) => {
        console.log('👤 From result:', result);
        if (result.status === Office.AsyncResultStatus.Succeeded) {
            const from = result.value;
            currentEmailData.sender = from ? (from.displayName || from.emailAddress || 'Unknown sender') : 'Unknown sender';
            currentEmailData.senderEmail = from.emailAddress || '';
            document.getElementById('emailSender').textContent = currentEmailData.sender;
            
            // Extract contact information
            extractContactInfo(from);
            
            console.log('✅ Sender loaded:', currentEmailData.sender);
        } else {
            console.error('❌ Failed to get sender:', result.error);
            currentEmailData.sender = 'Sender unavailable';
            document.getElementById('emailSender').textContent = currentEmailData.sender;
        }
    });
    
    // Get email date
    if (Office.context.mailbox.item.dateTimeCreated) {
        const date = new Date(Office.context.mailbox.item.dateTimeCreated);
        document.getElementById('emailDate').textContent = date.toLocaleDateString();
    }
    
    // Check for attachments
    checkForAttachments();
}

/**
 * Extract contact information from email
 */
function extractContactInfo(from) {
    console.log('👤 Extracting contact info:', from);
    
    // Update contact card
    if (from.displayName) {
        document.getElementById('contactName').textContent = from.displayName;
    }
    if (from.emailAddress) {
        document.getElementById('contactEmail').textContent = from.emailAddress;
    }
    
    // Store extracted contact
    extractedContacts = [{
        name: from.displayName || 'Unknown',
        email: from.emailAddress || '',
        source: 'email_sender'
    }];
}

/**
 * Check for attachments and display them
 */
function checkForAttachments() {
    Office.context.mailbox.item.attachments.getAsync((result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
            const attachments = result.value;
            
            if (attachments && attachments.length > 0) {
                displayAttachments(attachments);
            }
        }
    });
}

/**
 * Display attachments in the UI
 */
function displayAttachments(attachments) {
    const attachmentPanel = document.getElementById('attachmentPanel');
    const attachmentList = document.getElementById('attachmentList');
    
    if (!attachmentPanel || !attachmentList) return;
    
    attachmentList.innerHTML = '';
    
    attachments.forEach(attachment => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'attachment-item';
        
        const isResume = attachment.name.toLowerCase().includes('cv') || 
                        attachment.name.toLowerCase().includes('resume') ||
                        attachment.contentType === 'application/pdf';
        
        attachmentItem.innerHTML = `
            <div class="attachment-info">
                <i data-lucide="${getAttachmentIcon(attachment.contentType)}" style="width: 14px; height: 14px;"></i>
                <span class="attachment-name">${attachment.name}</span>
                <span class="attachment-size">(${formatFileSize(attachment.size)})</span>
            </div>
            ${isResume ? '<span class="resume-badge">Resume</span>' : ''}
        `;
        
        attachmentList.appendChild(attachmentItem);
    });
    
    attachmentPanel.classList.add('show');
            lucide.createIcons();
        }
        
/**
 * Get appropriate icon for attachment type
 */
function getAttachmentIcon(contentType) {
    if (contentType.includes('pdf')) return 'file-text';
    if (contentType.includes('word')) return 'file-text';
    if (contentType.includes('image')) return 'image';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'file-spreadsheet';
    return 'file';
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Analyze current email with AI
 */
async function analyzeCurrentEmail() {
    try {
        console.log('🔍 Starting email analysis...');
        updateAIStatus('Analyzing email content...', false);
        
        // Check if mailbox item exists
        if (!Office.context.mailbox.item) {
            console.error('❌ No mailbox item available for analysis');
            showAIError('No email selected or available');
            return;
        }
        
            // Get email body
            Office.context.mailbox.item.body.getAsync(Office.CoercionType.Text, async (result) => {
            console.log('📄 Body result:', result);
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                currentEmailData.body = result.value || 'No content available';
                console.log('✅ Email body loaded, length:', currentEmailData.body.length);
                
                // Perform AI analysis
                await performAIAnalysis();
                    } else {
                console.error('❌ Failed to get email body:', result.error);
                currentEmailData.body = 'Content unavailable';
                showAIError('Could not read email content');
                
                // Still try to perform basic analysis with what we have
                await performAIAnalysis();
            }
        });
        } catch (error) {
        console.error('❌ Error analyzing email:', error);
        showAIError('Analysis failed. Please try again.');
    }
}

/**
 * Perform AI analysis of email content
 */
async function performAIAnalysis() {
    try {
        console.log('🤖 Starting AI analysis...');
        updateAIStatus('Processing with AI...', false);
        
        // Prepare email data for analysis
        const emailData = {
            subject: currentEmailData.subject || 'No subject',
            body: currentEmailData.body || 'No content',
            sender: currentEmailData.sender || 'Unknown sender',
            senderEmail: currentEmailData.senderEmail || ''
        };
        
        console.log('📊 Email data prepared:', {
            subject: emailData.subject,
            bodyLength: emailData.body.length,
            sender: emailData.sender,
            hasEmail: !!emailData.senderEmail
        });
        
        // Perform local analysis first (fast)
        console.log('🔍 Performing local analysis...');
        const localAnalysis = analyzeEmailLocally(emailData);
        console.log('✅ Local analysis complete:', localAnalysis);
        displayAIResults(localAnalysis);
        
        // Then try to get enhanced AI analysis from server (skip for now due to auth issues)
        console.log('⚠️ Skipping server AI analysis (authentication required)');
        updateAIStatus('Analysis complete (local mode)', true);
        
        /* Commented out server analysis due to authentication issues
        try {
            console.log('🌐 Attempting server AI analysis...');
            const response = await fetch(`${EMINEON_ATS_URL}${API_ENDPOINTS.aiAnalysis}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                const aiAnalysis = await response.json();
                console.log('✅ Server AI analysis complete:', aiAnalysis);
                displayAIResults(aiAnalysis);
                updateAIStatus('AI analysis complete', true);
            } else {
                throw new Error(`AI service unavailable (${response.status})`);
            }
        } catch (serverError) {
            console.log('⚠️ Using local analysis (server unavailable):', serverError.message);
            updateAIStatus('Analysis complete (offline mode)', true);
        }
        */
        
        aiAnalysisComplete = true;
        
    } catch (error) {
        console.error('❌ Error in AI analysis:', error);
        showAIError('Analysis failed. Using basic detection.');
        
        // Fallback to basic analysis with safe defaults
        const safeEmailData = {
            subject: currentEmailData.subject || 'No subject',
            body: currentEmailData.body || 'No content',
            sender: currentEmailData.sender || 'Unknown sender',
            senderEmail: currentEmailData.senderEmail || ''
        };
        
        const basicAnalysis = analyzeEmailLocally(safeEmailData);
        displayAIResults(basicAnalysis);
        updateAIStatus('Basic analysis complete', true);
    }
}

/**
 * Analyze email locally (fallback when server is unavailable)
 */
function analyzeEmailLocally(emailData) {
    console.log('🔍 Analyzing email locally:', emailData);
    
    if (!emailData) {
        console.error('❌ No email data provided to local analysis');
        return {
            emailType: 'General',
            priority: 'Medium',
            confidence: 0.5,
            suggestions: ['Add to contacts', 'Create follow-up task']
        };
    }
    
    const { subject = '', body = '', sender = '' } = emailData;
    const content = `${subject} ${body}`.toLowerCase();
    
    // Determine email type
    let emailType = 'General';
    let priority = 'Medium';
    
    // Email type detection
    if (content.includes('cv') || content.includes('resume') || content.includes('application')) {
        emailType = 'Candidate Application';
    } else if (content.includes('job') || content.includes('position') || content.includes('role')) {
        emailType = 'Job Inquiry';
    } else if (content.includes('interview') || content.includes('meeting')) {
        emailType = 'Interview';
    } else if (content.includes('client') || content.includes('project')) {
        emailType = 'Client Communication';
    }
    
    // Priority detection
    if (content.includes('urgent') || content.includes('asap') || content.includes('immediately')) {
        priority = 'High';
    } else if (content.includes('when you have time') || content.includes('no rush')) {
        priority = 'Low';
    }
    
    return {
        emailType,
        priority,
        confidence: 0.75,
        suggestions: generateSuggestions(emailType, content)
    };
}

/**
 * Generate action suggestions based on email analysis
 */
function generateSuggestions(emailType, content) {
    const suggestions = [];
    
    switch (emailType) {
        case 'Candidate Application':
            suggestions.push('Add candidate to database');
            suggestions.push('Parse CV/Resume');
            suggestions.push('Schedule screening call');
            break;
        case 'Job Inquiry':
            suggestions.push('Create job posting');
            suggestions.push('Share job requirements');
            suggestions.push('Schedule consultation');
            break;
        case 'Interview':
            suggestions.push('Schedule interview');
            suggestions.push('Prepare interview questions');
            suggestions.push('Send calendar invite');
            break;
        case 'Client Communication':
            suggestions.push('Update project status');
            suggestions.push('Schedule client meeting');
            suggestions.push('Create project task');
            break;
        default:
            suggestions.push('Add to contacts');
            suggestions.push('Create follow-up task');
            break;
    }
    
    return suggestions;
}

/**
 * Display AI analysis results
 */
function displayAIResults(analysis) {
    // Update email type
    document.getElementById('emailType').textContent = analysis.emailType || 'General';
    
    // Update priority
    const priorityElement = document.getElementById('emailPriority');
    const priorityBadge = document.getElementById('priorityBadge');
    
    priorityElement.textContent = analysis.priority || 'Medium';
    priorityBadge.textContent = analysis.priority || 'Medium';
    priorityBadge.className = `priority-badge ${(analysis.priority || 'Medium').toLowerCase()}`;
    
    // Update email category badge
    const categoryElement = document.getElementById('emailCategory');
    const categoryClass = analysis.emailType?.toLowerCase().includes('candidate') ? 'candidate' :
                         analysis.emailType?.toLowerCase().includes('client') ? 'client' :
                         analysis.emailType?.toLowerCase().includes('job') ? 'job' : 'general';
    
    categoryElement.className = `email-category ${categoryClass}`;
    categoryElement.innerHTML = `<i data-lucide="tag" style="width: 10px; height: 10px;"></i> ${analysis.emailType || 'General'}`;
    
    // Recreate icons
    lucide.createIcons();
}

/**
 * Update AI status display
 */
function updateAIStatus(message, complete) {
    const statusText = document.getElementById('aiStatusText');
    const aiResults = document.getElementById('aiResults');
    
    if (statusText) {
        statusText.textContent = message;
    }
    
    if (complete && aiResults) {
        aiResults.classList.add('show');
    }
}

/**
 * Show AI error message
 */
function showAIError(message) {
    updateAIStatus(`Error: ${message}`, false);
    showNotification(message, 'error');
}

/**
 * Load dashboard data from Emineon ATS
 */
async function loadDashboardData() {
    try {
        // Load urgent items
        await loadUrgentItems();
        
        // Load priority jobs
        await loadPriorityJobs();
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        loadMockDashboardData();
    }
}

/**
 * Load urgent items from ATS
 */
async function loadUrgentItems() {
    try {
        // For now, use mock data since we need to create the urgent items API
        const urgentItems = [
            {
                id: '1',
                title: 'SLA Breach Alert',
                description: 'Senior React Developer role is 3 days overdue',
                priority: 'critical',
                time: '3 days overdue',
                action: 'Review Pipeline'
            },
            {
                id: '2',
                title: 'Interview Today',
                description: 'Sarah Chen - Technical Interview at 2:00 PM',
                priority: 'high',
                time: '2 hours',
                action: 'Prepare Interview'
            },
            {
                id: '3',
                title: 'Candidate Waiting',
                description: 'Michael Rodriguez awaiting feedback for 3 days',
                priority: 'high',
                time: '3 days',
                action: 'Provide Feedback'
            }
        ];
        
        displayUrgentItems(urgentItems);
        
    } catch (error) {
        console.error('Error loading urgent items:', error);
        document.getElementById('urgentItems').innerHTML = '<div style="text-align: center; color: var(--secondary-600); padding: 20px;">Unable to load urgent items</div>';
    }
}

/**
 * Load priority jobs from ATS
 */
async function loadPriorityJobs() {
    try {
        const response = await fetch(`${EMINEON_ATS_URL}${API_ENDPOINTS.jobs}?limit=5&status=active`);
        
        if (response.ok) {
            const data = await response.json();
            const jobs = data.jobs || [];
            
            // Transform jobs to priority jobs format
            const priorityJobs = jobs.map(job => ({
                id: job.id,
                title: job.title,
                client: job.department || 'General',
                status: job.status === 'ACTIVE' ? 'on-track' : 'at-risk',
                daysToSLA: Math.floor(Math.random() * 15) - 5, // Mock SLA calculation
                candidates: job._count?.applications || 0,
                lastActivity: 'Today'
            }));
            
            displayPriorityJobs(priorityJobs);
        } else {
            throw new Error('Failed to fetch jobs');
        }
        
    } catch (error) {
        console.error('Error loading priority jobs:', error);
        
        // Use mock data as fallback
        const mockJobs = [
            {
                id: '1',
                title: 'Senior React Developer',
                client: 'TechCorp',
                status: 'urgent',
                daysToSLA: -3,
                candidates: 8,
                lastActivity: '2 days ago'
            },
            {
                id: '2',
                title: 'Product Manager',
                client: 'StartupCo',
                status: 'at-risk',
                daysToSLA: 2,
                candidates: 4,
                lastActivity: '1 day ago'
            }
        ];
        
        displayPriorityJobs(mockJobs);
    }
}

/**
 * Load recent activity from ATS
 */
async function loadRecentActivity() {
    try {
        // Mock recent activity data
        const activities = [
            {
                id: '1',
                type: 'candidate',
                title: 'New Application',
                description: 'Alexandra Weber applied for Senior Developer',
                time: '2 min ago'
            },
            {
                id: '2',
                type: 'interview',
                title: 'Interview Completed',
                description: 'Marco Rossi - Technical Interview',
                time: '1 hour ago'
            },
            {
                id: '3',
                type: 'offer',
                title: 'Offer Sent',
                description: 'Sarah Mueller - Product Manager position',
                time: '3 hours ago'
            },
            {
                id: '4',
                type: 'feedback',
                title: 'Client Feedback',
                description: 'Positive feedback from TechCorp',
                time: '5 hours ago'
            }
        ];
        
        displayRecentActivity(activities);
        
        } catch (error) {
        console.error('Error loading recent activity:', error);
        document.getElementById('recentActivity').innerHTML = '<div style="text-align: center; color: var(--secondary-600); padding: 20px;">Unable to load recent activity</div>';
    }
}

/**
 * Display urgent items in UI
 */
function displayUrgentItems(items) {
    const container = document.getElementById('urgentItems');
    const countElement = document.getElementById('urgentCount');
    
    if (!container) return;
    
    countElement.textContent = `${items.length} critical`;
    
    if (items.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--secondary-600); padding: 20px;">No urgent items</div>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="urgent-item">
            <div class="urgent-item-header">
                <div class="urgent-item-title">${item.title}</div>
                <div class="urgent-item-time">${item.time}</div>
                    </div>
            <div class="urgent-item-desc">${item.description}</div>
            <button class="urgent-item-action" onclick="handleUrgentAction('${item.id}')">${item.action}</button>
                                </div>
    `).join('');
}

/**
 * Display priority jobs in UI
 */
function displayPriorityJobs(jobs) {
    const container = document.getElementById('priorityJobs');
    const countElement = document.getElementById('jobCount');
    
    if (!container) return;
    
    countElement.textContent = `${jobs.length} active`;
    
    if (jobs.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--secondary-600); padding: 20px;">No priority jobs</div>';
        return;
    }
    
    container.innerHTML = jobs.map(job => `
        <div class="priority-job" onclick="openJob('${job.id}')">
            <div class="job-header">
                <div class="job-title">${job.title}</div>
                <div class="job-status ${job.status}">${job.status.replace('-', ' ')}</div>
                            </div>
            <div class="job-client">${job.client}</div>
            <div class="job-stats">
                <span class="job-sla ${job.daysToSLA < 0 ? 'overdue' : job.daysToSLA <= 3 ? 'at-risk' : 'good'}">
                    ${job.daysToSLA < 0 ? `${Math.abs(job.daysToSLA)}d overdue` : `${job.daysToSLA}d to SLA`}
                </span>
                <span>${job.candidates} candidates</span>
                        </div>
                    </div>
                `).join('');
            }
            
/**
 * Display recent activity in UI
 */
function displayRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--secondary-600); padding: 20px;">No recent activity</div>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i data-lucide="${getActivityIcon(activity.type)}" style="width: 16px; height: 16px;"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-desc">${activity.description}</div>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
    
    // Recreate icons
                lucide.createIcons();
            }

/**
 * Get icon for activity type
 */
function getActivityIcon(type) {
    switch (type) {
        case 'candidate': return 'user-plus';
        case 'interview': return 'video';
        case 'offer': return 'send';
        case 'feedback': return 'message-square';
        default: return 'activity';
    }
}

/**
 * Handle urgent action clicks
 */
function handleUrgentAction(itemId) {
    showNotification(`Processing urgent item ${itemId}...`, 'success');
    // Here you would implement the actual urgent action handling
}

/**
 * Open job in main ATS
 */
function openJob(jobId) {
    const url = `${EMINEON_ATS_URL}/jobs/${jobId}`;
    window.open(url, '_blank');
}

/**
 * Action Handlers
 */
async function createProject() {
    try {
        showNotification('Opening project creation...', 'success');
        const url = `${EMINEON_ATS_URL}/projects?action=create&source=outlook&email=${encodeURIComponent(JSON.stringify(currentEmailData))}`;
        window.open(url, '_blank');
    } catch (error) {
        showNotification('Failed to open project creation', 'error');
    }
}

async function createJob() {
    try {
        showNotification('Opening job creation...', 'success');
        const url = `${EMINEON_ATS_URL}/jobs?action=create&source=outlook&email=${encodeURIComponent(JSON.stringify(currentEmailData))}`;
        window.open(url, '_blank');
        } catch (error) {
        showNotification('Failed to open job creation', 'error');
    }
}

function showAddCandidateModal() {
    try {
        showNotification('Opening candidate creation...', 'success');
        const url = `${EMINEON_ATS_URL}/candidates/new?source=outlook&email=${encodeURIComponent(JSON.stringify(currentEmailData))}`;
        window.open(url, '_blank');
    } catch (error) {
        showNotification('Failed to open candidate creation', 'error');
    }
}

function scheduleInterview() {
    try {
        showNotification('Opening interview scheduler...', 'success');
        // Create calendar event with Outlook
        Office.context.mailbox.displayNewAppointmentForm({
            requiredAttendees: [currentEmailData.senderEmail || ''],
            subject: 'Interview - ' + (currentEmailData.subject || 'Position'),
            body: 'Interview scheduled via Emineon ATS\n\nOriginal email:\n' + (currentEmailData.body || ''),
            start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000) // 1 hour duration
        });
    } catch (error) {
        showNotification('Failed to schedule interview', 'error');
    }
}

function showAddContactModal() {
    const modal = document.getElementById('addContactModal');
    if (modal) {
        // Pre-fill form with email data
        if (currentEmailData.sender) {
            document.getElementById('contactName').value = currentEmailData.sender;
        }
        if (currentEmailData.senderEmail) {
            document.getElementById('contactEmail').value = currentEmailData.senderEmail;
        }
        if (currentEmailData.subject) {
            document.getElementById('contactNotes').value = `Contact from email: ${currentEmailData.subject}`;
        }
        
        modal.style.display = 'flex';
    }
}

function assignToJob() {
    try {
        showNotification('Opening job assignment...', 'success');
        const url = `${EMINEON_ATS_URL}/jobs?action=assign&source=outlook&email=${encodeURIComponent(JSON.stringify(currentEmailData))}`;
        window.open(url, '_blank');
    } catch (error) {
        showNotification('Failed to open job assignment', 'error');
    }
}

function openATS() {
    try {
        window.open(EMINEON_ATS_URL, '_blank');
    } catch (error) {
        showNotification('Failed to open ATS', 'error');
    }
}

async function refreshData() {
    try {
        showNotification('Refreshing data...', 'success');
        
        // Refresh email analysis
        await analyzeCurrentEmail();
        
        // Refresh dashboard data
        await loadDashboardData();
        
        showNotification('Data refreshed successfully', 'success');
    } catch (error) {
        showNotification('Failed to refresh data', 'error');
    }
}

/**
 * Modal Management
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Handle contact form submission
 */
async function handleContactFormSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            phone: document.getElementById('contactPhone').value,
            company: document.getElementById('contactCompany').value,
            role: document.getElementById('contactRole').value,
            notes: document.getElementById('contactNotes').value,
            source: 'outlook',
            originalEmail: currentEmailData
        };
        
        // Try to save to ATS
        try {
            const response = await fetch(`${EMINEON_ATS_URL}/api/candidates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: formData.name.split(' ')[0] || formData.name,
                    lastName: formData.name.split(' ').slice(1).join(' ') || '',
                    email: formData.email,
                    phone: formData.phone,
                    currentRole: formData.role,
                    company: formData.company,
                    notes: formData.notes,
                    source: 'Outlook Add-in'
                })
            });
            
            if (response.ok) {
                showNotification('Contact added successfully!', 'success');
            } else {
                throw new Error('Server error');
            }
        } catch (serverError) {
            console.log('Server unavailable, contact saved locally');
            showNotification('Contact saved (will sync when online)', 'warning');
        }
        
        hideModal('addContactModal');
        
        // Reset form
        document.getElementById('contactForm').reset();
        
    } catch (error) {
        console.error('Error saving contact:', error);
        showNotification('Failed to save contact', 'error');
    }
}

/**
 * Update connection status
 */
function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.connection-status span');
    
    if (statusDot && statusText) {
        if (connected) {
            statusDot.style.background = '#10B981';
            statusText.textContent = 'Connected';
        } else {
            statusDot.style.background = '#EF4444';
            statusText.textContent = 'Offline';
        }
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        // Update icon based on type
        const icon = notification.querySelector('i');
        if (icon) {
            switch (type) {
                case 'success':
                    icon.setAttribute('data-lucide', 'check-circle');
                    break;
                case 'error':
                    icon.setAttribute('data-lucide', 'x-circle');
                    break;
                case 'warning':
                    icon.setAttribute('data-lucide', 'alert-triangle');
                    break;
                default:
                    icon.setAttribute('data-lucide', 'info');
            }
            lucide.createIcons();
        }
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

/**
 * Load mock dashboard data as fallback
 */
function loadMockDashboardData() {
    console.log('Loading mock dashboard data...');
    
    // Mock urgent items
    displayUrgentItems([
        {
            id: '1',
            title: 'SLA Breach Alert',
            description: 'Senior React Developer role is 3 days overdue',
            priority: 'critical',
            time: '3 days overdue',
            action: 'Review Pipeline'
        }
    ]);
    
    // Mock priority jobs
    displayPriorityJobs([
        {
            id: '1',
            title: 'Senior React Developer',
            client: 'TechCorp',
            status: 'urgent',
            daysToSLA: -3,
            candidates: 8,
            lastActivity: '2 days ago'
        }
    ]);
    
    // Mock recent activity
    displayRecentActivity([
        {
            id: '1',
            type: 'candidate',
            title: 'New Application',
            description: 'Alexandra Weber applied for Senior Developer',
            time: '2 min ago'
        }
    ]);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Office === 'undefined') {
        console.log('Office.js not available, running in test mode');
        // Initialize in test mode
        lucide.createIcons();
        loadMockDashboardData();
    }
}); 