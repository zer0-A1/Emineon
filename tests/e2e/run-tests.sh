#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎭 Emineon ATS - Playwright E2E Tests${NC}"
echo "=================================="

# Check if .env.local or .env exists
if [[ ! -f .env.local && ! -f .env ]]; then
    echo -e "${RED}❌ Error: No .env.local or .env file found${NC}"
    echo "Please create a .env.local file with DATABASE_URL"
    exit 1
fi

# Install Playwright browsers if not already installed
echo -e "${YELLOW}📦 Installing Playwright browsers...${NC}"
npx playwright install

# Run different test suites based on argument
case "$1" in
    "candidates")
        echo -e "${GREEN}🧑‍💼 Running Candidates tests...${NC}"
        npx playwright test tests/e2e/specs/candidates.spec.ts
        ;;
    "jobs")
        echo -e "${GREEN}💼 Running Jobs tests...${NC}"
        npx playwright test tests/e2e/specs/jobs.spec.ts
        ;;
    "search")
        echo -e "${GREEN}🔍 Running Search tests...${NC}"
        npx playwright test tests/e2e/specs/search.spec.ts
        ;;
    "ui")
        echo -e "${GREEN}🖥️  Running tests in UI mode...${NC}"
        npx playwright test --ui
        ;;
    "debug")
        echo -e "${GREEN}🐛 Running tests in debug mode...${NC}"
        npx playwright test --debug
        ;;
    "headed")
        echo -e "${GREEN}👀 Running tests in headed mode...${NC}"
        npx playwright test --headed
        ;;
    "report")
        echo -e "${GREEN}📊 Opening last test report...${NC}"
        npx playwright show-report
        ;;
    *)
        echo -e "${GREEN}🚀 Running all tests...${NC}"
        npx playwright test
        ;;
esac

# Show report after tests complete
if [[ "$1" != "ui" && "$1" != "debug" && "$1" != "report" ]]; then
    echo -e "${YELLOW}📊 Test report available. Run 'npm run test:report' to view${NC}"
fi
