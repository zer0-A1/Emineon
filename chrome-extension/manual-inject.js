// Manual Emineon ATS Button Injector
// Copy and paste this entire script into the browser console on LinkedIn

console.log('🚀 Manual Emineon ATS Button Injector');

// Create a simple button injector that works even if extension is blocked
class ManualEmineonInjector {
  constructor() {
    this.processedCards = new Set();
    this.inject();
  }

  inject() {
    console.log('Injecting Emineon buttons manually...');
    
    if (this.isSearchPage()) {
      this.addSearchButtons();
    } else if (this.isProfilePage()) {
      this.addProfileButton();
    } else {
      console.log('Not on a supported LinkedIn page');
    }
  }

  isSearchPage() {
    return window.location.pathname.includes('/search/');
  }

  isProfilePage() {
    return window.location.pathname.includes('/in/');
  }

  addSearchButtons() {
    // Find all profile links
    const profileLinks = document.querySelectorAll('a[href*="/in/"]');
    console.log(`Found ${profileLinks.length} profile links`);

    profileLinks.forEach((link, index) => {
      const card = link.closest('li') || link.closest('div');
      if (!card || card.querySelector('.manual-emineon-btn')) return;

      const button = this.createButton(link.href, 'small');
      
      // Try to place button near the link
      try {
        const container = link.parentElement;
        container.appendChild(button);
        console.log(`Added button ${index + 1}`);
      } catch (error) {
        console.log(`Could not add button ${index + 1}:`, error);
      }
    });
  }

  addProfileButton() {
    if (document.querySelector('.manual-emineon-btn')) return;

    const button = this.createButton(window.location.href, 'large');
    
    // Try to add to profile header
    const header = document.querySelector('.pv-top-card') || 
                   document.querySelector('.ph5') || 
                   document.querySelector('main');
    
    if (header) {
      const container = document.createElement('div');
      container.style.cssText = `
        margin: 16px 0;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e1e5e9;
      `;
      container.appendChild(button);
      header.insertBefore(container, header.firstChild);
      console.log('Added profile button');
    }
  }

  createButton(profileUrl, size = 'small') {
    const button = document.createElement('button');
    button.className = 'manual-emineon-btn';
    
    const isLarge = size === 'large';
    button.style.cssText = `
      background: linear-gradient(135deg, #0A2F5A 0%, #008080 100%);
      color: white;
      border: none;
      border-radius: ${isLarge ? '24px' : '16px'};
      padding: ${isLarge ? '12px 20px' : '6px 12px'};
      font-size: ${isLarge ? '14px' : '12px'};
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 8px;
      transition: all 0.3s ease;
      z-index: 999;
      position: relative;
    `;
    
    button.innerHTML = `
      <svg width="${isLarge ? '16' : '12'}" height="${isLarge ? '16' : '12'}" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
      </svg>
      ${isLarge ? 'Add to Emineon ATS' : 'Add to ATS'}
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleClick(button, profileUrl);
    });

    button.addEventListener('mouseenter', () => {
      button.style.background = 'linear-gradient(135deg, #0A2F5A 0%, #006666 100%)';
      button.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'linear-gradient(135deg, #0A2F5A 0%, #008080 100%)';
      button.style.transform = 'translateY(0)';
    });

    return button;
  }

  handleClick(button, profileUrl) {
    const originalHtml = button.innerHTML;
    
    button.innerHTML = `
      <div style="width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s linear infinite;"></div>
      Processing...
    `;
    
    // Add spin animation
    if (!document.querySelector('#manual-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'manual-spinner-style';
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
    
    // Extract candidate data from LinkedIn page
    const candidateData = this.extractCandidateData(profileUrl);
    
    // Send to actual Emineon ATS API
    this.sendToEmineonATS(candidateData).then(result => {
      if (result.success) {
        button.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2"/>
          </svg>
          Added!
        `;
        button.style.background = '#10B981';
        
        // Show notification
        this.showNotification('✅ Candidate added to Emineon ATS!', 'success');
      } else {
        button.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
          </svg>
          Error
        `;
        button.style.background = '#EF4444';
        
        this.showNotification(`❌ ${result.error || 'Failed to add candidate'}`, 'error');
        
        // Reset button after 3 seconds
        setTimeout(() => {
          button.innerHTML = originalHtml;
          button.style.background = 'linear-gradient(135deg, #0A2F5A 0%, #008080 100%)';
        }, 3000);
      }
    }).catch(error => {
      console.error('Error adding candidate:', error);
      
      button.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
        </svg>
        Error
      `;
      button.style.background = '#EF4444';
      
      this.showNotification('❌ Failed to add candidate. Check console for details.', 'error');
      
      // Reset button after 3 seconds
      setTimeout(() => {
        button.innerHTML = originalHtml;
        button.style.background = 'linear-gradient(135deg, #0A2F5A 0%, #008080 100%)';
      }, 3000);
    });
  }

  extractCandidateData(profileUrl) {
    const data = {
      linkedinUrl: profileUrl,
      extractedAt: new Date().toISOString(),
      source: 'manual_injection'
    };

    // Extract name from profile page
    const nameSelectors = [
      'h1.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      '.pv-top-card--list h1',
      '.pv-top-card-v2-ctas h1',
      'h1[data-anonymize="person-name"]'
    ];
    
    for (const selector of nameSelectors) {
      const nameElement = document.querySelector(selector);
      if (nameElement) {
        const fullName = nameElement.textContent.trim();
        const nameParts = fullName.split(' ');
        data.firstName = nameParts[0];
        data.lastName = nameParts.slice(1).join(' ');
        break;
      }
    }

    // Extract current title and company
    const titleSelectors = [
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      '.pv-top-card--list .pv-top-card-v2-ctas .text-body-medium',
      '[data-anonymize="job-title"]'
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement) {
        const titleText = titleElement.textContent.trim();
        if (titleText.includes(' at ')) {
          const [title, company] = titleText.split(' at ');
          data.currentTitle = title.trim();
          data.currentCompany = company.trim();
        } else {
          data.currentTitle = titleText;
        }
        break;
      }
    }

    // Extract location
    const locationSelectors = [
      '.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .text-body-small',
      '.pv-top-card-v2-ctas .text-body-small',
      '[data-anonymize="location"]'
    ];

    for (const selector of locationSelectors) {
      const locationElement = document.querySelector(selector);
      if (locationElement && locationElement.textContent.includes(',')) {
        const locationText = locationElement.textContent.trim();
        data.currentLocation = locationText;
        break;
      }
    }

    return data;
  }

  async sendToEmineonATS(candidateData) {
    try {
      const apiUrl = 'https://app-emineon.vercel.app';
      const apiKey = 'Test12345';
      
      console.log('Sending to Emineon ATS:', {
        url: apiUrl,
        candidateUrl: candidateData.linkedinUrl
      });

      // Try multiple possible API endpoints
      const possibleEndpoints = [
        '/api/candidates/parse-linkedin',
        '/api/candidates/linkedin',
        '/api/candidates/add',
        '/api/candidates',
        '/api/linkedin/import'
      ];

      let lastError = null;
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${apiUrl}${endpoint}`);
          
          const response = await fetch(`${apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'X-API-Key': apiKey,
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              linkedinUrl: candidateData.linkedinUrl,
              extractedData: candidateData,
              source: candidateData.source || 'manual_injection',
              firstName: candidateData.firstName,
              lastName: candidateData.lastName,
              currentTitle: candidateData.currentTitle,
              currentCompany: candidateData.currentCompany,
              currentLocation: candidateData.currentLocation,
              profileUrl: candidateData.linkedinUrl
            })
          });

          console.log(`Response status: ${response.status}`);
          
          if (response.ok) {
            const result = await response.json();
            console.log('Success response:', result);
            return { success: true, data: result };
          } else if (response.status === 404) {
            // Try next endpoint
            continue;
          } else {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            lastError = errorData;
            console.log(`Endpoint ${endpoint} failed:`, errorData);
          }
        } catch (fetchError) {
          console.log(`Fetch error for ${endpoint}:`, fetchError);
          lastError = fetchError;
          continue;
        }
      }

      // If all endpoints failed, return the last error
      throw new Error(lastError?.message || 'All API endpoints failed');

    } catch (error) {
      console.error('Error sending to Emineon ATS:', error);
      
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'API connection failed. CORS or network error.' 
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10B981' : '#EF4444'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
}

// Run the manual injector
new ManualEmineonInjector();

console.log('🎉 Manual injection complete! Look for Emineon buttons on the page.'); 