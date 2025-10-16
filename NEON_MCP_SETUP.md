# Neon MCP Setup Guide

## Your Neon Project Details
- **Project Name**: Emineon
- **Project ID**: divine-mouse-52504585
- **Connection String**: `postgresql://neondb_owner:npg_kDYdf2A7rmNz@ep-jolly-shadow-agc4ewcs-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require`

## Option 1: Remote MCP Server (Recommended - Currently Active)

This is what's currently configured in your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "neon-remote": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.neon.tech/sse"]
    }
  }
}
```

### To use:
1. Restart Cursor
2. Authenticate via OAuth when the browser window opens
3. Start using natural language to interact with your database

## Option 2: Local MCP Server (Requires API Key)

If you prefer local setup:

1. Get your Neon API key from: https://console.neon.tech/app/settings/api-keys

2. Update `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "neon-local": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon",
        "start",
        "<YOUR_NEON_API_KEY>"
      ]
    }
  }
}
```

## Troubleshooting

### For macOS/Linux:
The current configuration should work as-is.

### For Windows:
You might need to use CMD or WSL:

**Using CMD:**
```json
{
  "mcpServers": {
    "neon-remote": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "mcp-remote",
        "https://mcp.neon.tech/sse"
      ]
    }
  }
}
```

**Using WSL:**
```json
{
  "mcpServers": {
    "neon-remote": {
      "command": "wsl",
      "args": [
        "npx",
        "-y",
        "mcp-remote",
        "https://mcp.neon.tech/sse"
      ]
    }
  }
}
```

## Example MCP Commands

Once connected, you can use commands like:

- "Show me the schema of the candidates table"
- "List all tables in my Emineon database"
- "Create a backup of the jobs table"
- "Analyze the performance of queries on the applications table"
- "Show me the last 10 entries in the audit_logs table"

## Verifying Connection

After setup, you can verify the connection by asking:
- "What tables are in my Neon database?"
- "Show me the connection details for my current database"
