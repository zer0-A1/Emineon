# 🛠 Troubleshooting: Buttons Not Appearing

## Quick Debugging Steps

### Step 1: Check Extension Status
1. Go to `chrome://extensions/`
2. Find "Emineon ATS - LinkedIn Sourcing"
3. Check if:
   - ✅ Extension is **enabled** (toggle on)
   - ✅ No **errors** shown in red
   - ✅ **Reload** button available (click it)

### Step 2: Check Page URL
Ensure you're on a supported LinkedIn page:
- ✅ `https://www.linkedin.com/search/results/people`
- ✅ `https://www.linkedin.com/search/results/people/?keywords=...`
- ✅ `https://www.linkedin.com/in/[username]`

### Step 3: Console Debugging
1. **Open Developer Tools**: F12 or Right-click → Inspect
2. **Go to Console tab**
3. **Reload the page**
4. **Look for extension messages**:

**Expected Output:**
```
Emineon ATS Extension loaded on LinkedIn
Search page detected
Adding search result buttons
Found X search result cards
```

**If you see:**
- `❌ No messages`: Extension not loading
- `❌ "Found 0 search result cards"`: Selector issue
- `❌ Errors in red`: JavaScript errors

### Step 4: Manual Debug Script
Copy and paste this into the console:

```javascript
// Copy the contents of debug-linkedin.js here
```

### Step 5: Manual Button Test
If extension loaded but no buttons, try:
```javascript
new LinkedInScraper().addEmineonButtons();
```

## Common Issues & Solutions

### Issue 1: Extension Not Loading
**Symptoms:** No console messages, no extension activity
**Solutions:**
1. Reload extension in chrome://extensions/
2. Check if extension is enabled
3. Try disabling/enabling extension
4. Clear browser cache and reload

### Issue 2: Wrong Page Detection
**Symptoms:** Extension loads but doesn't detect search page
**Solutions:**
1. Check URL matches supported patterns
2. Wait 5-10 seconds for LinkedIn to fully load
3. Try refreshing the page
4. Check if you're logged into LinkedIn

### Issue 3: No Search Results Found
**Symptoms:** "Found 0 search result cards" in console
**Solutions:**
1. LinkedIn may have updated their selectors
2. Wait longer for page to load completely
3. Try scrolling down to trigger more results
4. Check if search actually has results

### Issue 4: Buttons Created But Not Visible
**Symptoms:** Console shows buttons added but not visible
**Solutions:**
1. Check if buttons are hidden by CSS
2. Look for buttons in unexpected locations
3. Try different zoom levels
4. Check for CSS conflicts

### Issue 5: Permission Errors
**Symptoms:** Chrome API errors in console
**Solutions:**
1. Extension may need permission reload
2. Check if content script has proper permissions
3. Try reinstalling extension

## Advanced Debugging

### Check LinkedIn DOM Structure
```javascript
// See current page structure
console.log('Search containers:');
document.querySelectorAll('.search-results-container, .search-results').forEach((el, i) => {
  console.log(`Container ${i}:`, el.className);
});

// See candidate cards
console.log('Candidate elements:');
document.querySelectorAll('a[href*="/in/"]').forEach((link, i) => {
  if (i < 3) {
    console.log(`Candidate ${i}:`, link.closest('li')?.className);
  }
});
```

### Force Button Creation
```javascript
// Force create a test button
const testButton = document.createElement('button');
testButton.innerHTML = 'Test Button';
testButton.style.cssText = `
  background: red;
  color: white;
  padding: 8px;
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 9999;
`;
document.body.appendChild(testButton);
```

## Getting Help

If buttons still don't appear after trying these steps:

1. **Copy console output** from debug script
2. **Take screenshot** of LinkedIn page
3. **Note browser version** and extension version
4. **Share URL** you're testing on (without personal info)

## Quick Fixes to Try

1. **Reload Extension**: chrome://extensions/ → Find extension → Click reload
2. **Refresh LinkedIn**: Ctrl+F5 or Cmd+Shift+R
3. **Wait Longer**: LinkedIn can take 10+ seconds to fully load
4. **Try Different Search**: Test with different keywords
5. **Check Network**: Ensure good internet connection
6. **Disable Other Extensions**: Temporarily disable other LinkedIn extensions

Most issues are resolved by reloading the extension and refreshing LinkedIn! 🔄 