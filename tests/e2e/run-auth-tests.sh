#!/bin/bash

echo "🔐 Running E2E tests with authentication setup..."

# Create auth directory if it doesn't exist
mkdir -p playwright/.auth

# Option 1: Use mock authentication (default)
if [ "$USE_REAL_AUTH" != "true" ]; then
  echo "📋 Using mock authentication for tests"
  export USE_REAL_AUTH=false
else
  echo "🔑 Using real Clerk authentication"
  echo "   Email: $TEST_USER_EMAIL"
  
  # Check if credentials are provided
  if [ -z "$TEST_USER_EMAIL" ] || [ -z "$TEST_USER_PASSWORD" ]; then
    echo "❌ Error: TEST_USER_EMAIL and TEST_USER_PASSWORD must be set for real authentication"
    echo "   Export these variables or use mock auth by not setting USE_REAL_AUTH"
    exit 1
  fi
fi

# Run tests with authentication config
echo "🧪 Running authenticated tests..."
npx playwright test --config=playwright.config.auth.ts "$@"

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed. Check the test results."
  echo "   HTML Report: npx playwright show-report"
fi
