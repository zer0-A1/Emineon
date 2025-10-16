// LinkedIn Extension Debug Script
// Run this in the browser console on LinkedIn search results page

console.log('🔍 LinkedIn Extension Debug Script');
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);

// Check if extension loaded
if (typeof LinkedInScraper !== 'undefined') {
  console.log('✅ Extension loaded successfully');
} else {
  console.log('❌ Extension not loaded or LinkedInScraper not found');
}

// Check for search result containers
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

console.log('\n📋 Container Detection:');
debugSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`${selector}: ${elements.length} elements`);
  if (elements.length > 0 && elements.length < 10) {
    console.log(`  → Classes: ${elements[0].className}`);
  }
});

// Check for profile links
const profileLinks = document.querySelectorAll('a[href*="/in/"]');
console.log(`\n👤 Found ${profileLinks.length} profile links`);

if (profileLinks.length > 0) {
  console.log('\n🎯 Profile Link Analysis (first 3):');
  profileLinks.forEach((link, index) => {
    if (index < 3) {
      const parentLi = link.closest('li');
      const parentDiv = link.closest('div[class*="result"]');
      console.log(`Link ${index}:`);
      console.log(`  URL: ${link.href}`);
      console.log(`  Parent LI: ${parentLi?.className || 'none'}`);
      console.log(`  Parent Div: ${parentDiv?.className || 'none'}`);
    }
  });
}

// Check if any extension buttons exist
const existingButtons = document.querySelectorAll('.emineon-search-btn, .emineon-add-candidate-btn');
console.log(`\n🔘 Existing Extension Buttons: ${existingButtons.length}`);

// Manual test - try to add buttons
console.log('\n🧪 Manual Test:');
try {
  if (typeof LinkedInScraper !== 'undefined') {
    const scraper = new LinkedInScraper();
    scraper.addEmineonButtons();
    console.log('✅ Manual button addition attempted');
  } else {
    console.log('❌ Cannot test - LinkedInScraper not available');
  }
} catch (error) {
  console.log('❌ Error during manual test:', error);
}

// Check extension configuration
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.sync.get(['emineonApiUrl', 'emineonApiKey'], (result) => {
    console.log('\n⚙️ Extension Configuration:');
    console.log('API URL:', result.emineonApiUrl || 'Not set');
    console.log('API Key:', result.emineonApiKey ? '***configured***' : 'Not set');
  });
} else {
  console.log('\n⚙️ Chrome storage not available');
}

console.log('\n📊 Debug complete! Check output above for issues.');
console.log('If buttons still not appearing, copy this output and share with developer.'); 