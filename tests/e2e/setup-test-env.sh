#!/bin/bash

echo "🔧 Setting up E2E test environment..."

# Export test environment variables
export NODE_ENV=development
export TEST_MODE=true
export SKIP_AUTH_CHECK=true
export BYPASS_CLERK=true
export NEXT_PUBLIC_CLERK_ENABLED=false

# Use test configuration
if [ -f "tests/e2e/test.env" ]; then
  echo "📋 Loading test environment variables..."
  export $(cat tests/e2e/test.env | grep -v '^#' | xargs)
fi

echo "✅ Test environment configured"
echo "   NODE_ENV: $NODE_ENV"
echo "   TEST_MODE: $TEST_MODE"
echo "   BYPASS_CLERK: $BYPASS_CLERK"

# Run the test with the no-db config
echo "🧪 Running authenticated jobs test..."
npx playwright test tests/e2e/specs/jobs-authenticated-test.spec.ts --config=playwright.config.no-db.ts --reporter=list "$@"
