#!/bin/bash

# Emineon ATS - Vercel Deployment Script
echo "🚀 Deploying Emineon ATS to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

# Build the project locally first to check for errors
echo "🔨 Building project locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Set environment variables for production
echo "⚙️  Setting environment variables..."

# Database
vercel env add DATABASE_URL production
echo "Added DATABASE_URL for production"

# Clerk Authentication
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add CLERK_JWT_KEY production
vercel env add CLERK_APPLICATION_ID production
vercel env add CLERK_INSTANCE_ID production

echo "Added Clerk authentication variables"

# OpenAI
vercel env add OPENAI_API_KEY production
echo "Added OpenAI API key"

# Additional production variables
vercel env add NODE_ENV production --value="production"
vercel env add FRONTEND_URL production --value="https://your-app.vercel.app"

echo "Added production environment variables"

# Deploy to Vercel
echo "🚀 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🎉 Your Emineon ATS is now live!"
echo ""
echo "📋 Next steps:"
echo "1. Update FRONTEND_URL with your actual Vercel URL"
echo "2. Test the deployment with sample data"
echo "3. Configure your custom domain (optional)"
echo "4. Set up monitoring and analytics"
echo ""
echo "💡 Useful commands:"
echo "  vercel logs           # View deployment logs"
echo "  vercel --prod         # Deploy to production"
echo "  vercel dev            # Run local development with Vercel"
echo "" 