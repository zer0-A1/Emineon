require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistantTools = [
  {
    type: "function",
    function: {
      name: "search_candidates",
      description: "Search for candidates in the database based on skills, experience, or other criteria",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for candidates (skills, experience, role, etc.)"
          },
          filters: {
            type: "object",
            properties: {
              experience_years: { type: "number" },
              skills: { type: "array", items: { type: "string" } },
              location: { type: "string" }
            }
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_job_description",
      description: "Analyze a job description to extract requirements, skills, and generate candidate matching criteria",
      parameters: {
        type: "object",
        properties: {
          job_description: {
            type: "string",
            description: "The job description text to analyze"
          }
        },
        required: ["job_description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_matching_candidates",
      description: "Find candidates that match specific job requirements",
      parameters: {
        type: "object",
        properties: {
          requirements: {
            type: "object",
            properties: {
              skills: { type: "array", items: { type: "string" } },
              experience: { type: "string" },
              location: { type: "string" },
              role_level: { type: "string" }
            }
          },
          limit: {
            type: "number",
            description: "Maximum number of candidates to return",
            default: 10
          }
        },
        required: ["requirements"]
      }
    }
  }
];

async function createCopilotAssistant() {
  try {
    console.log('Creating Emineon ATS Copilot Assistant...');
    
    const assistant = await openai.beta.assistants.create({
      name: "Emineon ATS Copilot",
      instructions: `You are an intelligent AI assistant for Emineon ATS (Applicant Tracking System). You help recruiters, HR professionals, and hiring managers with:

1. **Candidate Management**: Search, analyze, and match candidates to job requirements
2. **Job Analysis**: Analyze job descriptions and extract key requirements  
3. **Document Processing**: Process and analyze CVs, job descriptions, and other recruitment documents
4. **Talent Insights**: Provide data-driven insights about talent pipeline, skill gaps, and market trends
5. **Recruitment Strategy**: Offer recommendations for sourcing, screening, and hiring

Always be helpful, professional, and data-driven in your responses. When using tools, explain what you're doing and provide actionable insights. Format your responses clearly with bullet points, headings, and structured information when appropriate.

Key guidelines:
- Use tools to fetch real data whenever possible
- Provide specific, actionable recommendations
- Explain your reasoning and methodology
- Offer follow-up suggestions and next steps
- Be concise but comprehensive
- Maintain a professional, helpful tone`,
      tools: assistantTools,
      model: "gpt-4o",
      temperature: 0.7,
    });

    console.log('✅ Assistant created successfully!');
    console.log('Assistant ID:', assistant.id);
    console.log('Name:', assistant.name);
    console.log('Model:', assistant.model);
    console.log('Tools:', assistant.tools.length);
    
    console.log('\n🔧 Add this to your .env file:');
    console.log(`OPENAI_ASSISTANT_ID=${assistant.id}`);
    
    return assistant;
  } catch (error) {
    console.error('❌ Error creating assistant:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createCopilotAssistant()
    .then(() => {
      console.log('\n🎉 Setup complete! Your AI Copilot is ready to use.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createCopilotAssistant }; 