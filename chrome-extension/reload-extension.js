// Chrome Extension Auto-Reload Helper
// Run this in the console on chrome://extensions/ to quickly reload the extension

console.log('🔄 Reloading Emineon ATS Extension...');

// Find the extension card
const extensionCards = document.querySelectorAll('extensions-item');
let emineonExtension = null;

extensionCards.forEach(card => {
  const nameElement = card.shadowRoot.querySelector('#name');
  if (nameElement && nameElement.textContent.includes('Emineon ATS')) {
    emineonExtension = card;
  }
});

if (emineonExtension) {
  // Click the reload button
  const reloadButton = emineonExtension.shadowRoot.querySelector('#reload-button');
  if (reloadButton) {
    reloadButton.click();
    console.log('✅ Extension reloaded successfully!');
  } else {
    console.log('❌ Could not find reload button');
  }
} else {
  console.log('❌ Could not find Emineon ATS extension');
}

// Provide manual instructions
console.log(`
📝 Manual reload instructions:
1. Go to chrome://extensions/
2. Find "Emineon ATS - LinkedIn Sourcing"
3. Click the reload button (🔄)
4. Go back to LinkedIn and test
`); 