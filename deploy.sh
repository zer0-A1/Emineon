#!/bin/bash

# Emineon ATS Deployment Script
# This script prepares and deploys the application

set -e

echo "🚀 Starting Emineon ATS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found! Please copy env.example to .env and configure it."
    exit 1
fi

print_success ".env file found"

# Check environment variables
print_status "Checking environment variables..."

if ! grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" .env; then
    print_error "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found in .env"
    exit 1
fi

if ! grep -q "DATABASE_URL" .env; then
    print_error "DATABASE_URL not found in .env"
    exit 1
fi

print_success "Environment variables configured"

# Export .env into environment for Prisma CLI and build
print_status "Exporting environment variables from .env..."
set -a
. ./.env
set +a

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Sync database schema
print_status "Syncing database schema..."
npx prisma db push

# Build
print_status "Building application with optimizations..."
npm run build

print_success "Build completed successfully!"

# Check if this is a Vercel deployment
if [ -n "$VERCEL" ]; then
    print_status "Detected Vercel deployment environment"
    print_success "Deployment completed on Vercel!"
else
    print_status "Local deployment completed"
    print_warning "To deploy to production:"
    echo "  1. Push to GitHub: git push origin main"
    echo "  2. Connect repository to Vercel"
    echo "  3. Add environment variables in Vercel dashboard"
    echo "  4. Deploy automatically"
fi

echo ""
print_success "🎉 Emineon ATS deployment process completed!"
echo ""
print_status "Application Features:"
echo "  ✅ Enhanced Candidate Form (40+ fields)"
echo "  ✅ CV Upload & Parsing"
echo "  ✅ LinkedIn Integration"
echo "  ✅ Clerk Authentication"
echo "  ✅ Railway Database"
echo "  ✅ AI-Powered Features"
echo "  ✅ Production Build (Warning-Free)"
echo "  ✅ Optimized Prisma Client"
echo "  ✅ Node.js Runtime Configuration" 