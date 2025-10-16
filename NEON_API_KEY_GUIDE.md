# Neon MCP Server Setup - API Key vs Connection String

## Important Distinction:

### 🔗 Connection String (What you have):
```
postgresql://neondb_owner:npg_kDYdf2A7rmNz@ep-jolly-shadow-agc4ewcs-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```
- Used for: Direct database connections (psql, Prisma, etc.)
- NOT for: MCP Server

### 🔑 API Key (What you need):
```
neon_api_1234567890abcdef...
```
- Used for: MCP Server, Neon API operations
- Get it from: https://console.neon.tech/app/settings/api-keys

## Quick Setup:

1. **Get your API Key:**
   - Visit: https://console.neon.tech/app/settings/api-keys
   - Click "Create API Key"
   - Give it a name (e.g., "MCP Server")
   - Copy the key (starts with `neon_api_`)

2. **Test manually:**
   ```bash
   npx -y @neondatabase/mcp-server-neon start YOUR_API_KEY_HERE
   ```

3. **Configure in Cursor:**
   ```json
   {
     "mcpServers": {
       "neon": {
         "command": "npx",
         "args": [
           "-y", 
           "@neondatabase/mcp-server-neon",
           "start",
           "YOUR_API_KEY_HERE"
         ]
       }
     }
   }
   ```

## Your Project Info:
- **Project Name**: Emineon
- **Project ID**: divine-mouse-52504585
- **Database**: neondb
- **Connection String**: Already saved in your app's .env files
- **API Key**: You need to create this at the link above
