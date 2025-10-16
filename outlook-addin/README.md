# Emineon Outlook Add-in

Professional recruitment tools integrated directly into Microsoft Outlook.

## Overview

The Emineon Outlook Add-in provides two beautiful, Emineon-branded panels:

### 📧 Email Reader Panel
- **Contact Extraction**: Automatically extract contact information from emails
- **AI Analysis**: Get intelligent email classification and recruitment insights
- **Quick Actions**: Create jobs, schedule interviews, add contacts
- **Copilot Integration**: Ask questions about emails and get suggestions

### ✍️ Email Composer Panel  
- **Template Library**: Professional recruitment email templates
- **AI Writing Assistant**: Generate and improve emails with AI
- **Category-Based**: Organized templates for candidates, clients, and interviews
- **Quick Actions**: Insert templates, add signatures, schedule emails

## Features

- ✨ **Beautiful Emineon Design**: Consistent with the main platform
- 🤖 **AI-Powered**: Intelligent analysis and writing assistance
- 📱 **Responsive**: Works seamlessly in Outlook panels
- 🔄 **Real-time**: Instant email analysis and template insertion
- 🎯 **Recruitment-Focused**: Built specifically for recruitment workflows

## Installation

### Method 1: Install from File (Recommended)
1. **Download the manifest**: 
   - Visit: `https://app-emineon.vercel.app/api/outlook-addin/download.html`
   - Click "📁 Download Manifest File"
   - Save `emineon-outlook-addin-manifest.xml` to your computer
2. **Install in Outlook**:
   - Open Outlook (web, desktop, or mobile)
   - Go to **Settings** → **Add-ins** → **Get add-ins**
   - Click **"Add a custom add-in"** → **"Add from file"**
   - Select the downloaded `emineon-outlook-addin-manifest.xml` file
   - Click **Install** and accept permissions

### Method 2: Install from URL
1. Copy the manifest URL: `https://app-emineon.vercel.app/api/outlook-addin/manifest.xml`
2. In Outlook settings, choose **Add from URL**
3. Paste the URL and install

## Usage

### Reading Emails
1. Open any email in Outlook
2. Click **Email Analysis** in the Emineon ribbon
3. View extracted contact info and AI insights
4. Use quick actions to add contacts or create opportunities

### Composing Emails
1. Start composing a new email or reply
2. Click **Email Templates** in the Emineon ribbon
3. Browse templates by category (Candidate, Client, Interview)
4. Select and insert templates with one click
5. Use AI writing assistant for custom content

## Templates Available

### Candidate Templates
- Application Received
- Interview Invitation  
- Follow-up After Interview
- Constructive Rejection

### Client Templates
- Project Proposal
- Partnership Communications

### Interview Templates
- Interview Confirmation
- Scheduling Communications

## Technical Requirements

- **Outlook**: Web, Desktop (2016+), or Mobile
- **Permissions**: Read/Write Mailbox access
- **Network**: Internet connection for AI features

## Development

The add-in is built with:
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Design**: Emineon design system
- **Icons**: Lucide icons
- **AI**: OpenAI integration (coming soon)

## Files Structure

```
outlook-addin/
├── manifest.xml              # Add-in configuration
├── taskpane.html             # Email reader panel
├── compose-taskpane.html     # Email composer panel
├── commands.html             # Function commands
├── js/
│   ├── taskpane.js          # Reader functionality
│   └── compose-taskpane.js  # Composer functionality
└── icons/
    ├── emineon-16.png       # Small icon
    ├── emineon-32.png       # Medium icon
    └── emineon-80.png       # Large icon
```

## Support

For installation help or feature requests:
- **Email**: support@emineon.com
- **Website**: https://emineon.com
- **Platform**: https://app-emineon.vercel.app

---

*Emineon Outlook Add-in v2.0.0 - Transform your email into recruitment power.* 