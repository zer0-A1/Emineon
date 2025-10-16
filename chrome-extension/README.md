# Emineon ATS - LinkedIn Chrome Extension

A powerful Chrome extension that allows you to source candidates directly from LinkedIn and sync them to your Emineon ATS platform.

## 🚀 Features

- **One-Click Import**: Add candidates from LinkedIn profiles with a single click
- **Smart Data Extraction**: Automatically extracts name, title, company, location, and work history
- **Real-time Sync**: Instantly syncs candidate data to your Emineon ATS
- **Activity Tracking**: Monitor your sourcing activity and success rates
- **Secure Authentication**: API key-based authentication for secure data transfer

## 📦 Installation

### Method 1: Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "Emineon ATS"
3. Click "Add to Chrome"

### Method 2: Developer Mode (Current)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The extension will appear in your Chrome toolbar

## ⚙️ Configuration

1. **Click the extension icon** in your Chrome toolbar
2. **Enter your ATS URL**: Your Emineon ATS domain (e.g., `https://your-company.emineon.com`)
3. **Enter your API Key**: Get this from your Emineon ATS Settings → API Keys
4. **Click "Save Configuration"**
5. **Test the connection** to ensure everything is working

### Getting Your API Key
1. Log into your Emineon ATS
2. Go to Settings → API Keys
3. Click "Generate New Key"
4. Copy the key and paste it into the extension

## 🎯 Usage

### Adding Candidates from LinkedIn

1. **Navigate to a LinkedIn profile** (e.g., `linkedin.com/in/john-doe`)
2. **Look for the "Add to Emineon ATS" button** near the profile actions
3. **Click the button** to extract and import the candidate
4. **Wait for confirmation** - you'll see a success notification
5. **Check your ATS** - the candidate will appear in your candidates list

### Supported LinkedIn Pages
- Individual profiles (`linkedin.com/in/username`)
- Search results pages (coming soon)
- Company employee listings (coming soon)

## 📊 Features Overview

### Data Extraction
The extension automatically extracts:
- ✅ Full name
- ✅ Current job title
- ✅ Current company
- ✅ Location (city, country)
- ✅ Profile summary/about section
- ✅ Recent work experience (last 3 positions)
- ✅ Profile photo
- ✅ LinkedIn URL

### Smart Processing
- **Duplicate Detection**: Prevents adding the same candidate twice
- **Data Validation**: Ensures all extracted data is properly formatted
- **Error Handling**: Graceful fallbacks if extraction fails
- **Activity Logging**: Tracks all import activities

## 🔧 Troubleshooting

### Extension Not Working
1. **Refresh the LinkedIn page** and try again
2. **Check if you're logged into LinkedIn**
3. **Verify your ATS configuration** in the extension popup
4. **Test the connection** using the "Test Connection" button

### Button Not Appearing
1. **Wait a few seconds** for the page to fully load
2. **Check if you're on a profile page** (not search results)
3. **Refresh the page** if the button doesn't appear
4. **Check browser console** for any error messages

### Import Failures
1. **Verify your API key** is correct and active
2. **Check your internet connection**
3. **Ensure your ATS is accessible** from your current network
4. **Contact support** if issues persist

## 🔒 Privacy & Security

### Data Handling
- **No data storage**: The extension doesn't store any LinkedIn data locally
- **Secure transmission**: All data is sent over HTTPS
- **API authentication**: Secure API key-based authentication
- **Minimal permissions**: Only requests necessary permissions

### LinkedIn Compliance
- **Public data only**: Only extracts publicly visible information
- **Respects rate limits**: Built-in delays to avoid overwhelming LinkedIn
- **Terms compliance**: Designed to comply with LinkedIn's terms of service

## 🛠️ Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/David-tech-creator/app-emineon.git
cd app-emineon/chrome-extension

# No build step required - pure JavaScript
# Just load the folder in Chrome developer mode
```

### File Structure
```
chrome-extension/
├── manifest.json          # Extension configuration
├── src/
│   ├── content.js         # LinkedIn page interaction
│   ├── content.css        # Button and notification styles
│   └── background.js      # Background service worker
├── popup/
│   ├── popup.html         # Extension popup interface
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup functionality
├── icons/                 # Extension icons (16, 32, 48, 128px)
└── README.md             # This file
```

## 📝 API Integration

### Required Endpoints
Your Emineon ATS must implement these endpoints:

#### Health Check
```
GET /api/health
Authorization: Bearer {api_key}
```

#### LinkedIn Import
```
POST /api/candidates/linkedin-import
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "linkedinUrl": "https://linkedin.com/in/username",
  "firstName": "John",
  "lastName": "Doe",
  "currentTitle": "Software Engineer",
  "currentCompany": "Tech Corp",
  "location": { "city": "San Francisco", "country": "USA" },
  "summary": "Experienced software engineer...",
  "workHistory": [...],
  "extractedAt": "2024-01-15T10:30:00Z",
  "source": "linkedin_extension"
}
```

## 🆘 Support

### Getting Help
- **Documentation**: This README file contains all setup and usage instructions
- **GitHub Repository**: [https://github.com/David-tech-creator/app-emineon](https://github.com/David-tech-creator/app-emineon)
- **Issues & Bug Reports**: [GitHub Issues](https://github.com/David-tech-creator/app-emineon/issues)
- **Email**: support@emineon.com

### Reporting Issues
1. **Check the troubleshooting section** above
2. **Search existing issues** on [GitHub](https://github.com/David-tech-creator/app-emineon/issues)
3. **Gather error details** from browser console (F12 → Console tab)
4. **Include your browser version** and OS
5. **Create a new issue** on GitHub or email support with all relevant information

## 📄 License

This extension is part of the Emineon ATS platform. All rights reserved.

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Initial release
- ✅ LinkedIn profile data extraction
- ✅ One-click candidate import
- ✅ Configuration management
- ✅ Activity tracking
- ✅ Error handling and notifications

### Upcoming Features
- 🔄 Bulk import from search results
- 🔄 Advanced filtering options
- 🔄 Custom field mapping
- 🔄 Integration with other platforms 