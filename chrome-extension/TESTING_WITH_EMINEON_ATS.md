# 🚀 Testing Emineon ATS Integration

## Quick Setup

### 1. Extension Configuration
1. **Reload Extension**: Go to `chrome://extensions/` → Find "Emineon ATS" → Click reload (🔄)
2. **Open Extension Popup**: Click the Emineon extension icon in Chrome toolbar
3. **Check Default Settings**:
   - **API URL**: Should be `https://app-emineon.vercel.app`
   - **API Key**: Should be `Test12345`
4. **Test Connection**: Click "Test Connection" button
   - Should show connection status

### 2. LinkedIn Testing
1. **Go to LinkedIn Search**: `https://www.linkedin.com/search/results/people/?keywords=engineer`
2. **Look for Buttons**: Small "Add to ATS" buttons should appear on candidate cards
3. **Test Button Click**: Click any "Add to ATS" button
4. **Watch Console**: Press F12 → Console tab to see API calls

## Expected Behavior

### ✅ Success Case
- Button shows "Processing..." with spinner
- Console shows: "Trying endpoint: https://app-emineon.vercel.app/api/..."
- Button turns green and shows "Added!"
- Success notification appears
- Candidate data sent to Emineon ATS

### ❌ API Endpoint Issues
If you see errors like:
- "All API endpoints failed"
- "404 Not Found" for all endpoints
- CORS errors

**This means the Emineon ATS doesn't have the expected API endpoints yet.**

## API Endpoints Being Tested

The extension tries these endpoints in order:
1. `/api/candidates/parse-linkedin` ← **Primary endpoint**
2. `/api/candidates/linkedin`
3. `/api/candidates/add`
4. `/api/candidates`
5. `/api/linkedin/import`

## Expected API Request Format

```json
{
  "linkedinUrl": "https://www.linkedin.com/in/username",
  "extractedData": {
    "firstName": "John",
    "lastName": "Doe",
    "currentTitle": "Software Engineer",
    "currentCompany": "Tech Corp",
    "currentLocation": "San Francisco, CA",
    "linkedinUrl": "https://www.linkedin.com/in/username",
    "extractedAt": "2024-01-15T10:30:00.000Z",
    "source": "linkedin_extension"
  },
  "source": "linkedin_extension",
  "firstName": "John",
  "lastName": "Doe",
  "currentTitle": "Software Engineer",
  "currentCompany": "Tech Corp",
  "currentLocation": "San Francisco, CA",
  "profileUrl": "https://www.linkedin.com/in/username"
}
```

## Debugging Steps

### 1. Check Console Output
When clicking a button, you should see:
```
Sending to Emineon ATS: {url: "https://app-emineon.vercel.app", hasApiKey: true, candidateUrl: "..."}
Trying endpoint: https://app-emineon.vercel.app/api/candidates/parse-linkedin
Response status: 404 (or 200 if successful)
```

### 2. Manual Testing Script
If extension buttons don't work, try the manual injection:

1. Go to LinkedIn search results
2. Press F12 → Console
3. Copy and paste entire contents of `manual-inject.js`
4. Press Enter
5. Look for "Add to ATS" buttons

### 3. Check Network Tab
1. Press F12 → Network tab
2. Click extension button
3. Look for requests to `app-emineon.vercel.app`
4. Check request/response details

## Next Steps for Development

### If API Endpoints Don't Exist Yet:
1. **Create API endpoint** at `/api/candidates/parse-linkedin`
2. **Accept POST requests** with the JSON format above
3. **Parse LinkedIn data** and save to candidate database
4. **Return success response**: `{success: true, id: "candidate-id"}`

### Recommended API Response:
```json
{
  "success": true,
  "candidate": {
    "id": "candidate-123",
    "firstName": "John",
    "lastName": "Doe",
    "linkedinUrl": "https://www.linkedin.com/in/username"
  },
  "message": "Candidate added successfully"
}
```

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup shows correct default values
- [ ] Connection test runs (may show warnings)
- [ ] Buttons appear on LinkedIn search results
- [ ] Buttons appear on individual LinkedIn profiles
- [ ] Clicking button shows "Processing..." state
- [ ] Console shows API endpoint attempts
- [ ] Error handling works properly
- [ ] Success/failure notifications appear

## Common Issues

### CORS Errors
- **Cause**: Emineon ATS needs to allow requests from `chrome-extension://`
- **Solution**: Add CORS headers for Chrome extensions

### 404 Errors
- **Cause**: API endpoints don't exist yet
- **Solution**: Implement the LinkedIn import API endpoints

### Authentication Errors
- **Cause**: API key validation
- **Solution**: Configure proper API key handling

## Integration with Emineon ATS

The extension is designed to integrate with the comprehensive [Emineon ATS platform](https://app-emineon.vercel.app/) that includes:
- 40+ field candidate model
- AI-powered CV parsing
- Advanced candidate pipeline management
- Interview scheduling and assessments
- Automated outreach capabilities

The LinkedIn extension adds seamless candidate sourcing directly from LinkedIn search results and profiles into this robust ATS system. 