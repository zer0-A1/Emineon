// Emineon ATS Extension Popup Script

class EmineonPopup {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadConfiguration();
    this.bindEvents();
    await this.checkConnection();
    await this.loadStats();
  }

  async loadConfiguration() {
    try {
      const config = await chrome.storage.sync.get(['emineonApiUrl', 'emineonApiKey']);
      
      if (config.emineonApiUrl) {
        document.getElementById('apiUrl').value = config.emineonApiUrl;
      }
      
      if (config.emineonApiKey) {
        document.getElementById('apiKey').value = config.emineonApiKey;
      }

      // Show appropriate section based on configuration
      if (config.emineonApiUrl && config.emineonApiKey) {
        document.getElementById('configSection').style.display = 'none';
        document.getElementById('statusSection').style.display = 'block';
      } else {
        document.getElementById('configSection').style.display = 'block';
        document.getElementById('statusSection').style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  bindEvents() {
    // Save configuration
    document.getElementById('saveConfig').addEventListener('click', () => {
      this.saveConfiguration();
    });

    // Test connection
    document.getElementById('testConnection').addEventListener('click', () => {
      this.testConnection();
    });

    // Open ATS
    document.getElementById('openATS').addEventListener('click', () => {
      this.openATS();
    });

    // Help links
    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      // Open the actual GitHub repository README
      chrome.tabs.create({ url: 'https://github.com/David-tech-creator/app-emineon/blob/main/chrome-extension/README.md' });
    });

    document.getElementById('supportLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.storage.sync.get(['emineonApiUrl']).then(config => {
        if (config.emineonApiUrl) {
          chrome.tabs.create({ url: config.emineonApiUrl });
        } else {
          chrome.tabs.create({ url: 'mailto:support@emineon.com' });
        }
      });
    });

    // Enter key in form fields
    document.getElementById('apiUrl').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveConfiguration();
    });

    document.getElementById('apiKey').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveConfiguration();
    });
  }

  async saveConfiguration() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const saveButton = document.getElementById('saveConfig');

    if (!apiUrl || !apiKey) {
      this.showError('Please fill in both ATS URL and API Key');
      return;
    }

    // Validate URL format
    try {
      new URL(apiUrl);
    } catch {
      this.showError('Please enter a valid URL');
      return;
    }

    // Show loading state
    saveButton.innerHTML = '<div class="spinner"></div> Saving...';
    saveButton.disabled = true;

    try {
      // Test the configuration
      const testResult = await this.testApiConnection(apiUrl, apiKey);
      
      if (testResult.success) {
        // Save configuration
        await chrome.storage.sync.set({
          emineonApiUrl: apiUrl,
          emineonApiKey: apiKey
        });

        // Update UI
        document.getElementById('configSection').style.display = 'none';
        document.getElementById('statusSection').style.display = 'block';
        
        this.updateConnectionStatus('connected', 'Connected');
        this.showSuccess('Configuration saved successfully!');
        
        // Load stats
        await this.loadStats();
      } else {
        throw new Error(testResult.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Configuration save error:', error);
      this.showError(`Failed to save configuration: ${error.message}`);
    } finally {
      saveButton.innerHTML = 'Save Configuration';
      saveButton.disabled = false;
    }
  }

  async testConnection() {
    const testButton = document.getElementById('testConnection');
    testButton.innerHTML = '<div class="spinner"></div> Testing...';
    testButton.disabled = true;

    try {
      const config = await chrome.storage.sync.get(['emineonApiUrl', 'emineonApiKey']);
      
      if (!config.emineonApiUrl || !config.emineonApiKey) {
        throw new Error('Configuration not found');
      }

      const result = await this.testApiConnection(config.emineonApiUrl, config.emineonApiKey);
      
      if (result.success) {
        this.updateConnectionStatus('connected', 'Connected');
        this.showSuccess('Connection test successful!');
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      this.updateConnectionStatus('error', 'Connection Failed');
      this.showError(`Connection test failed: ${error.message}`);
    } finally {
      testButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Test Connection
      `;
      testButton.disabled = false;
    }
  }

  async testApiConnection(apiUrl, apiKey) {
    try {
      if (!apiUrl || !apiKey) {
        return { 
          success: false, 
          error: 'Please provide both ATS URL and API Key' 
        };
      }

      // Validate URL format
      try {
        new URL(apiUrl);
      } catch {
        return { 
          success: false, 
          error: 'Invalid URL format' 
        };
      }

      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          data: data 
        };
      } else {
        const errorText = await response.text();
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${errorText || response.statusText}` 
        };
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to ATS. Please check the URL and try again.' 
        };
      }
      return { 
        success: false, 
        error: `Connection failed: ${error.message}` 
      };
    }
  }

  async openATS() {
    try {
      const config = await chrome.storage.sync.get(['emineonApiUrl']);
      
      if (config.emineonApiUrl) {
        chrome.tabs.create({ url: config.emineonApiUrl });
      } else {
        this.showError('ATS URL not configured');
      }
    } catch (error) {
      console.error('Error opening ATS:', error);
      this.showError('Failed to open ATS');
    }
  }

  async checkConnection() {
    try {
      const config = await chrome.storage.sync.get(['emineonApiUrl', 'emineonApiKey']);
      
      if (!config.emineonApiUrl || !config.emineonApiKey) {
        this.updateConnectionStatus('disconnected', 'Not Configured');
        return;
      }

      const result = await this.testApiConnection(config.emineonApiUrl, config.emineonApiKey);
      
      if (result.success) {
        this.updateConnectionStatus('connected', 'Connected');
      } else {
        this.updateConnectionStatus('error', 'Connection Error');
        console.error('Connection check failed:', result.error);
      }
    } catch (error) {
      console.error('Connection check error:', error);
      this.updateConnectionStatus('error', 'Connection Error');
    }
  }

  async loadStats() {
    try {
      const stats = await chrome.storage.local.get(['candidatesAdded', 'successfulImports', 'recentActivity']);
      
      // Update candidates added
      const candidatesAdded = stats.candidatesAdded || 0;
      document.getElementById('candidatesAdded').textContent = candidatesAdded;
      
      // Calculate success rate
      const successfulImports = stats.successfulImports || 0;
      const successRate = candidatesAdded > 0 ? Math.round((successfulImports / candidatesAdded) * 100) : 0;
      document.getElementById('successRate').textContent = `${successRate}%`;
      
      // Update recent activity
      const recentActivity = stats.recentActivity || [];
      this.updateRecentActivity(recentActivity);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  updateRecentActivity(activities) {
    const recentList = document.getElementById('recentList');
    
    if (activities.length === 0) {
      recentList.innerHTML = '<div class="activity-item"><span class="activity-text">No recent activity</span></div>';
      return;
    }

    recentList.innerHTML = activities
      .slice(0, 3) // Show only last 3 activities
      .map(activity => `
        <div class="activity-item">
          <span class="activity-text">${activity.text}</span>
          <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
        </div>
      `).join('');
  }

  formatTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  updateConnectionStatus(status, text) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    indicator.className = `status-indicator ${status}`;
    statusText.textContent = text;
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      padding: 12px;
      border-radius: 6px;
      color: white;
      font-size: 13px;
      z-index: 1000;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
    `;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EmineonPopup();
});

// Load saved configuration
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const config = await chrome.storage.sync.get(['emineonApiUrl', 'emineonApiKey']);
    
    // Set default values if not configured
    document.getElementById('apiUrl').value = config.emineonApiUrl || 'https://app-emineon.vercel.app';
    document.getElementById('apiKey').value = config.emineonApiKey || 'Test12345';
    
    // Test connection on load
    testConnection();
    
    // Load stats
    loadStats();
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
});

// Save configuration
document.getElementById('saveConfig').addEventListener('click', async () => {
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!apiUrl || !apiKey) {
    showStatus('Please fill in all fields', 'error');
    return;
  }
  
  try {
    await chrome.storage.sync.set({
      emineonApiUrl: apiUrl,
      emineonApiKey: apiKey
    });
    
    showStatus('Configuration saved successfully!', 'success');
    
    // Test connection after saving
    setTimeout(testConnection, 1000);
  } catch (error) {
    console.error('Error saving configuration:', error);
    showStatus('Error saving configuration', 'error');
  }
});

// Test connection
document.getElementById('testConnection').addEventListener('click', testConnection);

async function testConnection() {
  const statusElement = document.getElementById('connectionStatus');
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!apiUrl || !apiKey) {
    statusElement.textContent = 'Please configure API settings';
    statusElement.className = 'status error';
    return;
  }
  
  statusElement.textContent = 'Testing connection...';
  statusElement.className = 'status';
  
  try {
    // Try to reach the Emineon ATS API
    const possibleEndpoints = [
      '/api/health',
      '/api/status',
      '/api/candidates',
      '/api/candidates/parse-linkedin'
    ];
    
    let connected = false;
    
    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-API-Key': apiKey,
            'Accept': 'application/json'
          }
        });
        
        if (response.status !== 404) {
          connected = true;
          break;
        }
      } catch (error) {
        // Continue to next endpoint
        continue;
      }
    }
    
    if (connected) {
      statusElement.textContent = 'Connected to Emineon ATS ✓';
      statusElement.className = 'status success';
    } else {
      statusElement.textContent = 'Cannot reach API endpoints (may still work)';
      statusElement.className = 'status warning';
    }
  } catch (error) {
    console.error('Connection test error:', error);
    statusElement.textContent = 'Connection failed - Check URL and network';
    statusElement.className = 'status error';
  }
}

async function loadStats() {
  try {
    const stats = await chrome.storage.local.get(['candidatesAdded', 'lastActivity']);
    
    document.getElementById('candidatesAdded').textContent = stats.candidatesAdded || 0;
    
    if (stats.lastActivity) {
      const lastDate = new Date(stats.lastActivity);
      document.getElementById('lastActivity').textContent = lastDate.toLocaleDateString();
    } else {
      document.getElementById('lastActivity').textContent = 'Never';
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function showStatus(message, type) {
  const statusDiv = document.createElement('div');
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = message;
  statusDiv.style.cssText = `
    margin-top: 10px;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#fff3cd'};
    color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#856404'};
    border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#ffeaa7'};
  `;
  
  const container = document.querySelector('.config-section');
  container.appendChild(statusDiv);
  
  setTimeout(() => {
    if (statusDiv.parentNode) {
      statusDiv.parentNode.removeChild(statusDiv);
    }
  }, 3000);
} 