// Emineon ATS LinkedIn Extension - Content Script
console.log('Emineon ATS Extension loaded on LinkedIn');

// Check if we're being blocked
try {
  if (typeof chrome === 'undefined') {
    console.warn('Chrome APIs not available - extension may be blocked');
  }
} catch (error) {
  console.warn('Chrome API access error:', error);
}

class LinkedInScraper {
  constructor() {
    this.isProcessing = false;
    this.processedCards = new Set(); // Track which cards we've already processed
    this.retryCount = 0;
    this.maxRetries = 3;
    this.init();
  }

  init() {
    try {
      // Wait for page to load with multiple attempts
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.safeAddButtons());
      } else {
        this.safeAddButtons();
      }

      // Handle navigation changes (LinkedIn is SPA)
      this.observeUrlChanges();
      
      // Observe for new search result cards being loaded
      this.observeSearchResults();
      
      // Retry mechanism for blocked scripts
      this.setupRetryMechanism();
    } catch (error) {
      console.error('Error initializing LinkedInScraper:', error);
      this.retryInit();
    }
  }

  safeAddButtons() {
    try {
      this.addEmineonButtons();
    } catch (error) {
      console.error('Error adding buttons:', error);
      // Retry after delay
      setTimeout(() => {
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retrying button addition (attempt ${this.retryCount})`);
          this.safeAddButtons();
        }
      }, 2000);
    }
  }

  retryInit() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`Retrying initialization (attempt ${this.retryCount})`);
      setTimeout(() => this.init(), 3000);
    }
  }

  setupRetryMechanism() {
    // Check every 10 seconds if buttons should be there but aren't
    setInterval(() => {
      if (this.isSearchPage() || this.isProfilePage()) {
        const existingButtons = document.querySelectorAll('.emineon-search-btn, .emineon-add-candidate-btn');
        if (existingButtons.length === 0) {
          console.log('No buttons found, attempting to add...');
          this.safeAddButtons();
        }
      }
    }, 10000);
  }

  observeUrlChanges() {
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.processedCards.clear(); // Reset processed cards on navigation
        setTimeout(() => this.safeAddButtons(), 2000); // Wait for content to load
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  observeSearchResults() {
    // Watch for new search result cards being added dynamically
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if new search result cards were added
            if (node.matches && (
                node.matches('.entity-result') || 
                node.matches('.search-result') ||
                node.querySelector('.entity-result') ||
                node.querySelector('.search-result')
              )) {
              shouldProcess = true;
            }
          }
        });
      });

      if (shouldProcess) {
        setTimeout(() => this.safeAddButtons(), 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addEmineonButtons() {
    console.log('Adding Emineon buttons - URL:', window.location.href);
    
    if (this.isProfilePage()) {
      console.log('Profile page detected');
      this.addProfileButton();
    } else if (this.isSearchPage()) {
      console.log('Search page detected');
      this.addSearchResultButtons();
    }
  }

  isProfilePage() {
    return (window.location.pathname.includes('/in/') && 
           !window.location.pathname.includes('/search/')) ||
           window.location.pathname.includes('/recruiter/profile/');
  }

  isSearchPage() {
    return window.location.pathname.includes('/search/results/people') ||
           window.location.pathname.includes('/search/results/all') ||
           window.location.pathname.startsWith('/search/') ||
           window.location.pathname.includes('/recruiter/') ||
           window.location.pathname.includes('/talent/');
  }

  isRecruiterPage() {
    return window.location.pathname.includes('/recruiter/') ||
           window.location.pathname.includes('/talent/');
  }

  addProfileButton() {
    // Remove existing button if present
    const existingButton = document.querySelector('.emineon-add-candidate-btn');
    if (existingButton) existingButton.remove();

    // Find the action buttons container
    const actionContainer = this.findProfileActionContainer();
    if (!actionContainer) {
      console.log('Could not find profile action container');
      return;
    }

    // Create Emineon button
    const emineonButton = this.createProfileButton();
    actionContainer.appendChild(emineonButton);
    console.log('Profile button added successfully');
  }

  addSearchResultButtons() {
    console.log('Adding search result buttons');
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    // Find all search result cards for both regular LinkedIn and Recruiter
    let searchCards = document.querySelectorAll([
      // Regular LinkedIn search selectors
      '.entity-result', 
      '.search-result',
      '.search-results .result-card',
      '.search-results-container .search-result',
      '.search-result__wrapper',
      '.search-entity-result',
      
      // New comprehensive selectors based on current LinkedIn structure
      '.search-results-container .result',
      '.search-results-container li',
      '.search-results .entity-result',
      '.search-results .search-result',
      '.reusable-search-simple-insight',
      '.entity-result-universal-image',
      
      // LinkedIn Recruiter search selectors
      '.search-result__info',
      '.recruiter-results .result-card',
      '.talent-search .search-result',
      '[data-control-name="search_srp_result"]',
      '.recruiter-results__list-item',
      '.search-results-container .result-card',
      
      // Additional comprehensive selectors
      '[data-entity-urn]',
      '.reusable-search-result',
      '.search-noresults__recommendation-card',
      
      // Fallback selectors - very broad
      'div[data-view-name="search-result"]',
      'div[aria-label*="Result"]',
      'li[data-occludable-entity-urn]'
    ].join(', '));
    
    console.log(`Found ${searchCards.length} search result cards`);
    
    // If no cards found with specific selectors, try aggressive fallback
    if (searchCards.length === 0) {
      console.log('No search cards found with specific selectors. Trying aggressive fallback...');
      
      // Look for any list item that contains a profile link
      const allListItems = document.querySelectorAll('li');
      const candidateCards = [];
      
      allListItems.forEach(li => {
        const profileLink = li.querySelector('a[href*="/in/"]');
        if (profileLink) {
          candidateCards.push(li);
        }
      });
      
      if (candidateCards.length > 0) {
        console.log(`Aggressive fallback found ${candidateCards.length} candidate cards`);
        searchCards = candidateCards;
      } else {
        console.log('Aggressive fallback also found no cards');
      }
    }
    
    // Debug: Log what we found
    if (searchCards.length === 0) {
      console.log('No search cards found. Checking for common LinkedIn containers...');
      
      // Debug selectors to understand the page structure
      const debugSelectors = [
        '.search-results-container',
        '.search-results',
        '.entity-result',
        '.search-result',
        '[data-entity-urn]',
        'li[data-occludable-entity-urn]',
        '.artdeco-list',
        '.reusable-search'
      ];
      
      debugSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`${selector}: ${elements.length} elements found`);
      });
      
      // Try to find any element that contains profile links
      const profileLinks = document.querySelectorAll('a[href*="/in/"]');
      console.log(`Found ${profileLinks.length} profile links on page`);
      
      if (profileLinks.length > 0) {
        console.log('Profile links found, but parent containers not detected properly');
        // Get parent containers of profile links
        profileLinks.forEach((link, index) => {
          if (index < 3) { // Log first 3 for debugging
            console.log(`Profile link ${index} parent classes:`, link.closest('li')?.className || link.closest('div')?.className);
          }
        });
      }
    }

    searchCards.forEach((card, index) => {
      const cardId = `search-card-${index}`;
      
      // Skip if already processed
      if (this.processedCards.has(cardId)) return;
      
      // Skip if button already exists
      if (card.querySelector('.emineon-search-btn')) return;

      // Find the candidate profile link (different patterns for regular vs recruiter)
      const profileLink = card.querySelector('a[href*="/in/"]') || 
                         card.querySelector('a[href*="/recruiter/profile/"]') ||
                         card.querySelector('a[href*="/talent/profile/"]') ||
                         card.querySelector('a[data-control-name="search_srp_result"]');
      
      if (!profileLink) {
        console.log(`No profile link found in card ${index}`);
        return;
      }

      const profileUrl = profileLink.href;
      console.log(`Processing card ${index} with profile URL: ${profileUrl}`);
      
      // Create search result button
      const emineonButton = this.createSearchButton(profileUrl);
      
      // Find where to place the button
      const buttonContainer = this.findSearchButtonContainer(card);
      if (buttonContainer) {
        buttonContainer.appendChild(emineonButton);
        this.processedCards.add(cardId);
        console.log(`Search button added for card ${index} - URL: ${window.location.pathname}`);
      } else {
        console.log(`Could not find button container for card ${index}`);
      }
    });
  }

  findProfileActionContainer() {
    // Try multiple selectors for different LinkedIn layouts
    const selectors = [
      // Regular LinkedIn selectors
      '.pv-s-profile-actions',
      '.pv-top-card-v2-ctas',
      '.pv-top-card__actions',
      '.ph5.pb5 .pv-text-details__left-panel .pv-top-card-v2-ctas',
      '.artdeco-card.pv-top-card',
      '.pv-top-card-profile-picture + div',
      
      // LinkedIn Recruiter selectors
      '.recruiter-profile-actions',
      '.profile-topcard-actions',
      '.profile-topcard',
      '.recruiter-profile-header',
      '.talent-profile-actions',
      '.profile-topcard-summary-info',
      '.profile-topcard-summary-info-section'
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) {
        console.log(`Found profile container with selector: ${selector}`);
        return container;
      }
    }

    // Fallback: create our own container
    const profileCard = document.querySelector('.pv-top-card') || 
                       document.querySelector('.pv-top-card-v2') ||
                       document.querySelector('[data-member-id]') ||
                       document.querySelector('.recruiter-profile-header') ||
                       document.querySelector('.profile-topcard');
    if (profileCard) {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'emineon-button-container';
      buttonContainer.style.cssText = `
        margin-top: 16px;
        padding: 12px;
        border-top: 1px solid #e5e5e5;
      `;
      profileCard.appendChild(buttonContainer);
      console.log('Created fallback profile container');
      return buttonContainer;
    }

    return null;
  }

  findSearchButtonContainer(card) {
    // Try to find the actions container in the search card
    const selectors = [
      // Regular LinkedIn selectors
      '.entity-result__actions',
      '.search-result__actions', 
      '.entity-result__summary',
      '.search-result__info',
      '.entity-result__content',
      '.search-result__wrapper',
      '.search-entity-result__summary',
      '.reusable-search__result-container',
      
      // LinkedIn Recruiter selectors
      '.result-card__actions',
      '.recruiter-result__actions',
      '.talent-result__actions',
      '.search-result__meta',
      '.result-card__contents',
      '.search-result__summary',
      
      // Additional comprehensive selectors
      '.entity-result__item',
      '.search-result__details',
      '.result-card__contents',
      '.search-result-card__info'
    ];

    for (const selector of selectors) {
      const container = card.querySelector(selector);
      if (container) {
        console.log(`Found button container with selector: ${selector}`);
        return container;
      }
    }

    // Try to find any container within the card that has some content
    const potentialContainers = card.querySelectorAll('div');
    for (const container of potentialContainers) {
      // Look for a div that contains text content but isn't too nested
      if (container.textContent.trim().length > 10 && 
          container.children.length < 10 &&
          !container.querySelector('.emineon-search-btn')) {
        console.log(`Found potential container with content`);
        return container;
      }
    }

    // Final fallback: create container at the bottom of the card
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'emineon-search-button-container';
    buttonContainer.style.cssText = `
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e5e5e5;
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 4px;
      padding: 8px;
    `;
    
    // Try to append to the card
    try {
      card.appendChild(buttonContainer);
      console.log('Created fallback search button container');
      return buttonContainer;
    } catch (error) {
      console.log('Could not append button container to card:', error);
      
      // Last resort: create floating container
      const floatingContainer = document.createElement('div');
      floatingContainer.className = 'emineon-floating-button-container';
      floatingContainer.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 999;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 4px;
        padding: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;
      
      // Make card relative if it isn't already
      if (card.style.position !== 'relative' && card.style.position !== 'absolute') {
        card.style.position = 'relative';
      }
      
      card.appendChild(floatingContainer);
      console.log('Created floating button container');
      return floatingContainer;
    }
  }

  createProfileButton() {
    const button = document.createElement('button');
    button.className = 'emineon-add-candidate-btn';
    button.style.cssText = `
      background: linear-gradient(135deg, #0A2F5A 0%, #008080 100%);
      color: white;
      border: none;
      border-radius: 24px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      margin: 8px 0;
    `;
    
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      </svg>
      Add to Emineon ATS
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleAddCandidate(button, window.location.href);
    });

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 12px rgba(10, 47, 90, 0.4)';
      button.style.background = 'linear-gradient(135deg, #0A2F5A 0%, #006666 100%)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
      button.style.background = 'linear-gradient(135deg, #0A2F5A 0%, #008080 100%)';
    });

    return button;
  }

  createSearchButton(profileUrl) {
    const button = document.createElement('button');
    button.className = 'emineon-search-btn';
    button.style.cssText = `
      background: linear-gradient(135deg, #0A2F5A 0%, #008080 100%);
      color: white;
      border: none;
      border-radius: 16px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.3s ease;
    `;
    
    button.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      </svg>
      Add to ATS
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleAddCandidate(button, profileUrl);
    });

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 2px 8px rgba(10, 47, 90, 0.4)';
      button.style.background = 'linear-gradient(135deg, #0A2F5A 0%, #006666 100%)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
      button.style.background = 'linear-gradient(135deg, #0A2F5A 0%, #008080 100%)';
    });

    return button;
  }

  async handleAddCandidate(button, linkedinUrl = null) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const originalHTML = button.innerHTML;
    const originalStyle = button.style.cssText;
    
    try {
      // Update button state
      button.innerHTML = `
        <div class="emineon-spinner" style="
          width: 12px; 
          height: 12px; 
          border: 2px solid rgba(255,255,255,0.3); 
          border-radius: 50%; 
          border-top-color: white; 
          animation: spin 1s ease-in-out infinite;
        "></div>
        Processing...
      `;
      button.disabled = true;

      // Add spinner animation
      if (!document.querySelector('#emineon-spinner-style')) {
        const style = document.createElement('style');
        style.id = 'emineon-spinner-style';
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      // Extract candidate data (use provided URL or current page)
      const candidateData = this.extractCandidateData(linkedinUrl);
      
      // Send to Emineon ATS
      const result = await this.sendToEmineonATS(candidateData);
      
      if (result.success) {
        button.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Added to ATS
        `;
        button.style.background = '#10B981';
        
        // Show success notification
        this.showNotification('Candidate added to Emineon ATS successfully!', 'success');
        
        // Update extension stats
        this.updateExtensionStats();
      } else {
        throw new Error(result.error || 'Failed to add candidate');
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      button.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Error - Try Again
      `;
      button.style.background = '#EF4444';
      
      this.showNotification('Failed to add candidate. Please try again.', 'error');
      
      // Reset button after 3 seconds
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.style.cssText = originalStyle;
        button.disabled = false;
      }, 3000);
    } finally {
      this.isProcessing = false;
    }
  }

  extractCandidateData(linkedinUrl = null) {
    const data = {
      linkedinUrl: linkedinUrl || window.location.href,
      extractedAt: new Date().toISOString(),
      source: this.isRecruiterPage() ? 'linkedin_recruiter_extension' : 'linkedin_extension'
    };

    // If we have a specific URL (from search results), use that
    if (linkedinUrl && linkedinUrl !== window.location.href) {
      // For search results, extract basic info from the card
      return this.extractSearchCardData(linkedinUrl);
    }

    // Extract name from profile page (different selectors for regular vs recruiter)
    const nameSelectors = [
      // Regular LinkedIn selectors
      'h1.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      '.pv-top-card--list h1',
      '.pv-top-card-v2-ctas h1',
      'h1[data-anonymize="person-name"]',
      
      // LinkedIn Recruiter selectors
      '.profile-topcard h1',
      '.recruiter-profile-header h1',
      '.profile-topcard-summary-info h1',
      '.talent-profile h1'
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

    // Extract current title and company (different selectors for regular vs recruiter)
    const titleSelectors = [
      // Regular LinkedIn selectors
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      '.pv-top-card--list .pv-top-card-v2-ctas .text-body-medium',
      '[data-anonymize="job-title"]',
      
      // LinkedIn Recruiter selectors
      '.profile-topcard .profile-topcard__title',
      '.recruiter-profile-header .title',
      '.profile-topcard-summary-info .title',
      '.talent-profile .current-position'
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

    // Extract location (different selectors for regular vs recruiter)
    const locationSelectors = [
      // Regular LinkedIn selectors
      '.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .text-body-small',
      '.pv-top-card-v2-ctas .text-body-small',
      '[data-anonymize="location"]',
      
      // LinkedIn Recruiter selectors
      '.profile-topcard .profile-topcard__location',
      '.recruiter-profile-header .location',
      '.profile-topcard-summary-info .location',
      '.talent-profile .location'
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

  extractSearchCardData(linkedinUrl) {
    // For search results, we work with limited data
    const isRecruiterUrl = linkedinUrl.includes('/recruiter/') || linkedinUrl.includes('/talent/');
    
    return {
      linkedinUrl: linkedinUrl,
      extractedAt: new Date().toISOString(),
      source: isRecruiterUrl ? 'linkedin_recruiter_extension_search' : 'linkedin_extension_search',
      firstName: 'Unknown',
      lastName: 'Candidate',
      currentTitle: 'Position from LinkedIn',
      currentLocation: 'Location from LinkedIn'
    };
  }

  async sendToEmineonATS(candidateData) {
    try {
      // Get stored API configuration
      const config = await chrome.storage.sync.get(['emineonApiUrl', 'emineonApiKey']);
      
      // Use the actual Emineon Vercel URL if not configured
      const apiUrl = config.emineonApiUrl || 'https://app-emineon.vercel.app';
      const apiKey = config.emineonApiKey || 'Test12345';
      
      console.log('Sending to Emineon ATS:', {
        url: apiUrl,
        hasApiKey: !!apiKey,
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
              'X-API-Key': apiKey, // Alternative auth header
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              linkedinUrl: candidateData.linkedinUrl,
              extractedData: candidateData,
              source: candidateData.source || 'linkedin_extension',
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
      
      // If it's a CORS error, provide specific guidance
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'API connection failed. Please check your API configuration in the extension popup.' 
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `emineon-notification emineon-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 350px;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  updateExtensionStats() {
    // Send message to background script to update stats
    chrome.runtime.sendMessage({
      action: 'updateStats',
      type: 'candidateAdded',
      timestamp: new Date().toISOString()
    }).catch(error => {
      console.log('Could not update extension stats:', error);
    });
  }
}

// Initialize the scraper
new LinkedInScraper(); 