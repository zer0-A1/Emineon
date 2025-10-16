#!/bin/bash

# Comprehensive E2E Test Runner for Emineon ATS
# This script runs all E2E tests with proper reporting and error handling

echo "🚀 Starting Comprehensive E2E Test Suite for Emineon ATS"
echo "=================================================="

# Set environment variables
export BASE_URL=${BASE_URL:-"http://localhost:3000"}
export TEST_TIMEOUT=${TEST_TIMEOUT:-"120000"}
export HEADLESS=${HEADLESS:-"true"}

# Create test results directory
mkdir -p test-results
mkdir -p test-results/failures
mkdir -p test-results/reports

# Function to run tests with retry
run_test_with_retry() {
    local test_file=$1
    local max_retries=2
    local retry_count=0
    
    echo "📋 Running: $test_file"
    
    while [ $retry_count -le $max_retries ]; do
        if npx playwright test "$test_file" --reporter=html,json,line; then
            echo "✅ $test_file passed"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -le $max_retries ]; then
                echo "⚠️  $test_file failed. Retrying ($retry_count/$max_retries)..."
                sleep 5
            else
                echo "❌ $test_file failed after $max_retries retries"
                return 1
            fi
        fi
    done
}

# Start the application if not running
echo "🔍 Checking if application is running..."
if ! curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200"; then
    echo "📦 Starting application..."
    npm run dev &
    APP_PID=$!
    
    # Wait for app to start
    echo "⏳ Waiting for application to start..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200"; then
            echo "✅ Application is running"
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    
    if [ $timeout -eq 0 ]; then
        echo "❌ Application failed to start"
        exit 1
    fi
fi

# Run database migrations if needed
echo "🗄️  Checking database..."
npm run db:migrate

# Clear test data
echo "🧹 Clearing test data..."
npm run db:test:reset 2>/dev/null || true

# Seed test data
echo "🌱 Seeding test data..."
npm run db:test:seed 2>/dev/null || true

# Run all test suites
echo "🧪 Running E2E tests..."
echo "=================================================="

failed_tests=()
passed_tests=()

# Core functionality tests
test_files=(
    "tests/e2e/specs/comprehensive-app-test.spec.ts"
    "tests/e2e/specs/jobs-views-matrix.spec.ts"
    "tests/e2e/specs/data-robustness.spec.ts"
    "tests/e2e/specs/ai-and-documents.spec.ts"
    "tests/e2e/specs/jobs.spec.ts"
    "tests/e2e/specs/candidates.spec.ts"
    "tests/e2e/specs/search.spec.ts"
    "tests/e2e/specs/data-flows.spec.ts"
    "tests/e2e/specs/edge-cases.spec.ts"
    "tests/e2e/specs/performance.spec.ts"
    "tests/e2e/specs/copilot-e2e.spec.ts"
)

# Run each test file
for test_file in "${test_files[@]}"; do
    if [ -f "$test_file" ]; then
        if run_test_with_retry "$test_file"; then
            passed_tests+=("$test_file")
        else
            failed_tests+=("$test_file")
        fi
    else
        echo "⚠️  Test file not found: $test_file"
    fi
done

# Generate summary report
echo ""
echo "=================================================="
echo "📊 Test Summary Report"
echo "=================================================="
echo "Total tests run: ${#test_files[@]}"
echo "✅ Passed: ${#passed_tests[@]}"
echo "❌ Failed: ${#failed_tests[@]}"
echo ""

if [ ${#passed_tests[@]} -gt 0 ]; then
    echo "✅ Passed Tests:"
    for test in "${passed_tests[@]}"; do
        echo "   - $test"
    done
    echo ""
fi

if [ ${#failed_tests[@]} -gt 0 ]; then
    echo "❌ Failed Tests:"
    for test in "${failed_tests[@]}"; do
        echo "   - $test"
    done
    echo ""
fi

# Generate HTML report
echo "📄 Generating HTML report..."
npx playwright show-report

# Create comprehensive report
cat > test-results/e2e-test-report.md << EOF
# E2E Test Report - $(date)

## Summary
- **Total Tests**: ${#test_files[@]}
- **Passed**: ${#passed_tests[@]}
- **Failed**: ${#failed_tests[@]}
- **Success Rate**: $((${#passed_tests[@]} * 100 / ${#test_files[@]}))%

## Environment
- **Base URL**: $BASE_URL
- **Test Timeout**: $TEST_TIMEOUT
- **Headless**: $HEADLESS

## Test Results

### ✅ Passed Tests
$(for test in "${passed_tests[@]}"; do echo "- $test"; done)

### ❌ Failed Tests
$(for test in "${failed_tests[@]}"; do echo "- $test"; done)

## Artifacts
- Screenshots: test-results/failures/
- HTML Report: playwright-report/index.html
- JSON Report: test-results/reports/results.json

## Recommendations
$(if [ ${#failed_tests[@]} -gt 0 ]; then
    echo "1. Review failed test logs in test-results/"
    echo "2. Check screenshots in test-results/failures/"
    echo "3. Run failed tests individually with --debug flag"
    echo "4. Update test data or application code as needed"
else
    echo "All tests passed! The application is ready for deployment."
fi)
EOF

echo ""
echo "📄 Report saved to: test-results/e2e-test-report.md"

# Cleanup
if [ ! -z "$APP_PID" ]; then
    echo "🛑 Stopping application..."
    kill $APP_PID 2>/dev/null || true
fi

# Exit with appropriate code
if [ ${#failed_tests[@]} -gt 0 ]; then
    echo ""
    echo "❌ E2E tests completed with failures"
    exit 1
else
    echo ""
    echo "✅ All E2E tests passed successfully!"
    exit 0
fi
