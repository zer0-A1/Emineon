# Emineon ATS AI Copilot Setup Guide

This guide will help you set up the AI Copilot feature using OpenAI's Assistants API.

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key with access to GPT-4o and the Assistants API
2. **Environment Variables**: Make sure your `.env` file is properly configured

## Setup Steps

### 1. Add Environment Variables

Add these to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=will_be_generated_in_step_2
```

### 2. Create the Assistant

Run the assistant creation script:

```bash
node scripts/create-assistant.js
```

This will:
- Create an OpenAI Assistant with the proper instructions and tools
- Display the Assistant ID that you need to add to your `.env` file
- Configure the assistant with function calling capabilities

### 3. Update Environment Variables

After running the script, add the generated Assistant ID to your `.env` file:

```env
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxx
```

### 4. Test the Copilot

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the AI Copilot page:
   ```
   http://localhost:3000/ai-copilot
   ```

3. Try asking questions like:
   - "Help me find JavaScript developers"
   - "Analyze this job description: [paste job description]"
   - "What are the current trends in my talent pipeline?"

## Features

### Current Capabilities

✅ **Smart Chat Interface**: Conversational AI assistant for recruitment tasks  
✅ **Document Analysis**: Upload and analyze job descriptions, CVs, and other documents  
✅ **Candidate Matching**: Find candidates that match specific criteria  
✅ **Talent Insights**: Get analytics about your talent pipeline  
✅ **Job Analysis**: Extract requirements and insights from job descriptions  

### Function Tools Available

1. **search_candidates**: Search candidates by skills, experience, location
2. **analyze_job_description**: Extract requirements from job postings
3. **find_matching_candidates**: Match candidates to specific job requirements
4. **get_talent_insights**: Generate pipeline and market analytics
5. **search_jobs**: Find jobs in your database

### Integration Features

- **Authentication**: Secured with Clerk authentication
- **Database Integration**: Connected to your Prisma/PostgreSQL database
- **File Processing**: Supports PDF, DOCX, and text document analysis
- **Real-time Responses**: Streaming responses for better UX

## Usage Examples

### 1. Candidate Search
```
"Find me senior React developers in San Francisco with at least 5 years of experience"
```

### 2. Job Description Analysis
```
"Analyze this job description and tell me what skills I should look for in candidates: [paste JD]"
```

### 3. Document Upload
- Drag and drop CVs or job descriptions
- Get instant analysis and insights
- Find matching candidates automatically

### 4. Talent Pipeline Insights
```
"What are the skill gaps in my current talent pipeline?"
"Show me hiring trends for the last 6 months"
```

## Troubleshooting

### Common Issues

1. **Assistant not responding**
   - Check that `OPENAI_API_KEY` is set correctly
   - Verify `OPENAI_ASSISTANT_ID` is set
   - Ensure you have OpenAI API credits

2. **Authentication errors**
   - Make sure you're logged in through Clerk
   - Check that Clerk is properly configured

3. **Database errors**
   - Verify your database connection
   - Run `npx prisma generate` to update the client
   - Check that your database schema is up to date

### API Endpoints

- `POST /api/ai-copilot/query` - Main chat interface
- `GET /api/ai-copilot/query` - Health check
- `POST /api/ai-copilot/assistant` - Direct assistant interaction

## Advanced Configuration

### Custom Tools

To add new function tools:

1. Update `scripts/create-assistant.js` with new tool schemas
2. Add corresponding handlers in `src/lib/ai/tool-handlers.ts`
3. Re-create the assistant with the new tools

### Streaming (Coming Soon)

The copilot is designed to support streaming responses for real-time interaction. This will be enabled in future updates.

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Review the server logs for API errors
3. Verify all environment variables are set correctly
4. Ensure your OpenAI account has sufficient credits and API access

---

**Next Steps**: Once the basic setup is working, you can customize the assistant instructions, add more function tools, and integrate with additional data sources. 