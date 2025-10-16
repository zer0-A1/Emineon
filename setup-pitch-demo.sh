#!/bin/bash

# 🎯 EMINEON ATS PITCH DEMO SETUP SCRIPT
# Run this script to prepare everything for your pitch demo

echo "🎬 EMINEON ATS PITCH DEMO SETUP"
echo "================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Setup database with demo data
echo "👥 Setting up demo candidates and projects..."
node scripts/setup-pitch-demo-data.js

if [ $? -eq 0 ]; then
    echo "✅ Demo data setup completed successfully!"
else
    echo "❌ Demo data setup failed. Please check the error messages above."
    exit 1
fi

# Test the demo flow
echo "🧪 Testing the complete demo flow..."
node test-emmanuel-email.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 PITCH DEMO SETUP COMPLETE!"
    echo "=============================="
    echo ""
    echo "🚀 Ready for your pitch! Here's what to do:"
    echo ""
    echo "1. Start the application:"
    echo "   npm run dev"
    echo ""
    echo "2. Wait for server to start on http://localhost:3006"
    echo ""
    echo "3. Follow the demo script in PITCH_DEMO_GUIDE.md"
    echo ""
    echo "📋 Quick Demo URLs:"
    echo "   📊 Projects: http://localhost:3006/projects"
    echo "   👥 Candidates: http://localhost:3006/candidates"
    echo "   🌐 Portal Manager: http://localhost:3006/admin/portal-manager"
    echo "   🎯 Client Portal: http://localhost:3006/clients/dataflow/portal"
    echo ""
    echo "🎬 Demo Features Ready:"
    echo "   ✅ Emmanuel's urgent Data Engineer email"
    echo "   ✅ 5 perfectly matched candidates (MongoDB/TypeScript/SQL)"
    echo "   ✅ AI-powered matching with 90%+ scores"
    echo "   ✅ Professional client portal"
    echo "   ✅ Invented company names for confidentiality"
    echo ""
    echo "⏱️  Expected demo time: 10 minutes"
    echo "🎯 Key message: Email to shortlist in under 10 minutes!"
    echo ""
    echo "Good luck with your pitch! 🚀"
else
    echo "❌ Demo test failed. Please check the error messages above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Make sure the database is properly configured"
    echo "   2. Check that all environment variables are set"
    echo "   3. Ensure the server can start with 'npm run dev'"
    exit 1
fi 