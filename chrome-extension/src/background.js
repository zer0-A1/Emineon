// Emineon ATS Extension Background Service Worker

class EmineonBackground {
  constructor() {
    this.init();
  }

  init() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Handle tab updates to inject content script
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });
  }

  handleInstallation(details) {
    console.log('Emineon ATS Extension installed:', details.reason);
    
    if (details.reason === 'install') {
      // First time installation
      this.showWelcomeNotification();
      this.openSetupPage();
    } else if (details.reason === 'update') {
      // Extension updated
      this.handleUpdate(details.previousVersion);
    }
  }

  showWelcomeNotification() {
    try {
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create('welcome', {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          title: 'Emineon ATS Extension Installed',
          message: 'Click the extension icon to configure your ATS connection.'
        }, (notificationId) => {
          if (chrome.runtime.lastError) {
            console.log('Notification error:', chrome.runtime.lastError.message);
          } else {
            console.log('Welcome notification created:', notificationId);
          }
        });
      }
    } catch (error) {
      console.log('Notification not available:', error);
    }
  }

  openSetupPage() {
    // Open the extension popup for initial setup
    try {
      chrome.action.openPopup();
    } catch (error) {
      console.log('Could not open popup automatically:', error);
    }
  }

  handleUpdate(previousVersion) {
    console.log(`Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    
    // Handle any migration logic here
    this.migrateData(previousVersion);
  }

  async migrateData(previousVersion) {
    try {
      // Example migration logic
      if (previousVersion && previousVersion < '1.0.0') {
        // Migrate old storage format if needed
        const oldData = await chrome.storage.local.get(['oldFormatData']);
        if (oldData.oldFormatData) {
          // Convert to new format
          await chrome.storage.local.set({
            candidatesAdded: oldData.oldFormatData.count || 0,
            recentActivity: []
          });
          // Remove old data
          await chrome.storage.local.remove(['oldFormatData']);
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'CANDIDATE_ADDED':
          await this.handleCandidateAdded(message.data);
          sendResponse({ success: true });
          break;
          
        case 'GET_CONFIG':
          const config = await this.getConfiguration();
          sendResponse({ success: true, config });
          break;
          
        case 'TEST_CONNECTION':
          const testResult = await this.testConnection(message.data);
          sendResponse(testResult);
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleCandidateAdded(candidateData) {
    try {
      // Update statistics
      const stats = await chrome.storage.local.get(['candidatesAdded', 'successfulImports', 'recentActivity']);
      
      const candidatesAdded = (stats.candidatesAdded || 0) + 1;
      const successfulImports = (stats.successfulImports || 0) + 1;
      const recentActivity = stats.recentActivity || [];
      
      // Add to recent activity
      recentActivity.unshift({
        text: `Added ${candidateData.firstName} ${candidateData.lastName}`,
        timestamp: new Date().toISOString(),
        type: 'candidate_added'
      });
      
      // Keep only last 10 activities
      if (recentActivity.length > 10) {
        recentActivity.splice(10);
      }
      
      // Save updated stats
      await chrome.storage.local.set({
        candidatesAdded,
        successfulImports,
        recentActivity
      });
      
      // Show success notification
      try {
        if (chrome.notifications && chrome.notifications.create) {
          chrome.notifications.create(`candidate-${Date.now()}`, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'Candidate Added to Emineon ATS',
            message: `${candidateData.firstName} ${candidateData.lastName} has been successfully added to your ATS.`
          }, (notificationId) => {
            if (chrome.runtime.lastError) {
              console.log('Notification error:', chrome.runtime.lastError.message);
            } else {
              console.log('Success notification created:', notificationId);
            }
          });
        }
      } catch (error) {
        console.log('Notification not available:', error);
      }
      
    } catch (error) {
      console.error('Error handling candidate added:', error);
    }
  }

  async getConfiguration() {
    try {
      const config = await chrome.storage.sync.get(['emineonApiUrl', 'emineonApiKey']);
      return config;
    } catch (error) {
      console.error('Error getting configuration:', error);
      return {};
    }
  }

  async testConnection(config) {
    try {
      if (!config.apiUrl || !config.apiKey) {
        return { 
          success: false, 
          error: 'Configuration not found. Please set your ATS URL and API Key.' 
        };
      }

      const response = await fetch(`${config.apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
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
      return { 
        success: false, 
        error: `Connection failed: ${error.message}` 
      };
    }
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    // Only process when page is completely loaded
    if (changeInfo.status !== 'complete') return;
    
    // Check if it's a LinkedIn page
    if (tab.url && this.isLinkedInPage(tab.url)) {
      // Inject content script if not already injected
      this.injectContentScript(tabId);
    }
  }

  isLinkedInPage(url) {
    return url.includes('linkedin.com/in/') || 
           url.includes('linkedin.com/search/results/people/');
  }

  async injectContentScript(tabId) {
    try {
      // Check if content script is already injected
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.emineonExtensionLoaded
      });

      if (!results[0].result) {
        // Content script not loaded, inject it
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['src/content.js']
        });

        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['src/content.css']
        });
      }
    } catch (error) {
      console.error('Error injecting content script:', error);
    }
  }
}

// Initialize background service
new EmineonBackground(); 