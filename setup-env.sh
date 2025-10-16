#!/bin/bash

echo "🔧 Setting up environment variables for Vercel..."

# Read from .env file and set Vercel environment variables
if [ -f .env ]; then
    echo "📁 Found .env file, setting up production environment variables..."
    
    # Database
    DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
    if [ ! -z "$DATABASE_URL" ]; then
        echo "$DATABASE_URL" | npx vercel env add DATABASE_URL production
        echo "✅ Set DATABASE_URL"
    fi
    
    # Clerk variables
    CLERK_PUBLISHABLE_KEY=$(grep "^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=" .env | cut -d'=' -f2- | tr -d '"')
    if [ ! -z "$CLERK_PUBLISHABLE_KEY" ]; then
        echo "$CLERK_PUBLISHABLE_KEY" | npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
        echo "✅ Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    fi
    
    CLERK_SECRET_KEY=$(grep "^CLERK_SECRET_KEY=" .env | cut -d'=' -f2- | tr -d '"')
    if [ ! -z "$CLERK_SECRET_KEY" ]; then
        echo "$CLERK_SECRET_KEY" | npx vercel env add CLERK_SECRET_KEY production
        echo "✅ Set CLERK_SECRET_KEY"
    fi
    
    # OpenAI
    OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d'=' -f2- | tr -d '"')
    if [ ! -z "$OPENAI_API_KEY" ]; then
        echo "$OPENAI_API_KEY" | npx vercel env add OPENAI_API_KEY production
        echo "✅ Set OPENAI_API_KEY"
    fi
    
    echo "🎉 Environment variables configured!"
else
    echo "❌ No .env file found. Please create one with your production variables."
    exit 1
fi 