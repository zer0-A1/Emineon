# Emineon ATS - E2E Tests with Playwright

## Overview

This directory contains comprehensive end-to-end tests for the Emineon ATS platform using Playwright. The tests cover all major features including Candidates management, Jobs management, and Search functionality.

## Test Coverage

### 1. Candidates Management (`candidates.spec.ts`)
- **Create**: Manual entry, CV upload, validation
- **Read**: List view, grid view, search, filters, pagination
- **Update**: Edit details, status changes, notes
- **Delete**: Single and bulk deletion
- **Actions**: Add to job, export CV, share profile
- **Bulk Operations**: Multi-select, bulk status update, bulk delete

### 2. Jobs Management (`jobs.spec.ts`)
- **Create**: Manual entry, AI parsing, draft saving
- **Read**: List/grid views, search, filters, pipeline stats
- **Update**: Edit details, urgency, close with outcome (Won/Lost)
- **Delete**: Single deletion with confirmation
- **Pipeline/Kanban**: Drag & drop, add/remove candidates, stage management
- **Actions**: Duplicate, share, export
- **Bulk Operations**: Status updates, bulk deletion

### 3. Search Functionality (`search.spec.ts`)
- **Global Search**: Cross-entity search, suggestions, type filtering
- **Candidate Search**: Name, skills, location, advanced filters
- **Job Search**: Title, location, employment type, urgency
- **Quick Search**: Header search, keyboard shortcuts (Cmd/Ctrl+K)
- **AI Search**: Natural language queries, relevance scoring
- **Search Management**: History, saved searches, export results

## Setup

### Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database running
3. Environment variables configured in `.env.local` or `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/emineon_test
   ```

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test Suites
```bash
# Candidates tests only
npm run test:e2e:candidates

# Jobs tests only
npm run test:e2e:jobs

# Search tests only
npm run test:e2e:search
```

### Interactive Mode
```bash
# Run with UI (recommended for development)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run in headed mode (see browser)
./tests/e2e/run-tests.sh headed
```

### View Test Report
```bash
# After tests run, view HTML report
npm run test:report
```

## Test Data

Tests automatically:
1. Create a test user (`playwright@test.emineon.com`)
2. Set up test company, client, and project
3. Seed test candidates and jobs as needed
4. Clean up all test data after completion

## Authentication

Tests use a mock authentication system that bypasses Clerk in development mode by:
- Setting a `dev-user-id` cookie
- Using the test user ID for all operations

## Data-Test Attributes

The tests rely on `data-test` attributes in the UI. See [DATA_TEST_ATTRIBUTES_GUIDE.md](../DATA_TEST_ATTRIBUTES_GUIDE.md) for:
- Required attributes by component
- Naming conventions
- Implementation examples

## Writing New Tests

### Test Structure
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await page.goto('/route');
    await waitForApp(page);
  });

  test('should perform action', async ({ page }) => {
    // Arrange
    await seedTestData();
    
    // Act
    await page.click('[data-test="button"]');
    
    // Assert
    await expect(page.locator('[data-test="result"]')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-test selectors**: Never rely on classes or text that might change
2. **Wait for elements**: Use `waitForSelector` or `expect().toBeVisible()`
3. **Clean test data**: Tests should not depend on previous test state
4. **Descriptive names**: Test names should clearly describe what they verify
5. **Atomic tests**: Each test should verify one specific behavior

## Debugging Failed Tests

### Local Debugging
```bash
# Run specific test file in debug mode
npx playwright test path/to/test.spec.ts --debug

# Run with --headed to see browser
npx playwright test --headed

# Use test.only to run single test
test.only('should create candidate', async ({ page }) => {
  // test code
});
```

### CI Debugging
- Check test artifacts (screenshots, videos, traces)
- Review console logs in test output
- Use `page.screenshot()` for debugging specific states

## CI/CD Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Common Issues

1. **Tests fail with "No test user found"**
   - Ensure DATABASE_URL is set correctly
   - Check database connection
   - Verify prisma schema is up to date

2. **Elements not found**
   - Check if data-test attributes are added to components
   - Use `page.pause()` to debug element state
   - Verify page has loaded with `waitForApp()`

3. **Authentication errors**
   - Ensure you're running in development mode
   - Check mockAuthentication is called in beforeEach

4. **Flaky tests**
   - Add explicit waits for dynamic content
   - Use `expect().toBeVisible()` instead of checking existence
   - Ensure proper test isolation

## Maintenance

- Update tests when UI changes
- Add data-test attributes for new features
- Keep test data minimal and focused
- Review and update this README as needed

## Support

For issues or questions:
1. Check test output and reports
2. Review similar tests for examples
3. Consult Playwright documentation
4. Contact the development team
