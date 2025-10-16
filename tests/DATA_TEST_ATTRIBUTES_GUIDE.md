# Data Test Attributes Guide

This guide outlines the data-test attributes that need to be added to UI components for Playwright E2E testing.

## Naming Convention

Use kebab-case for data-test attributes:
- `data-test="create-candidate-button"`
- `data-test="candidate-firstname"`
- `data-test="submit-form"`

## Required Attributes by Component

### Layout Components
- `data-test="app-layout"` - Main application layout wrapper
- `data-test="header-search"` - Header search bar
- `data-test="header-search-input"` - Header search input field
- `data-test="command-palette"` - Command palette modal

### Candidates Page (`/candidates`)

#### List View
- `data-test="create-candidate-button"` - Create new candidate button
- `data-test="candidates-table"` - Main candidates table
- `data-test="candidates-grid"` - Grid view container
- `data-test="candidate-row"` - Individual candidate row in table
- `data-test="candidate-card"` - Individual candidate card in grid
- `data-test="search-candidates"` - Search input field
- `data-test="filter-button"` - Open filters button
- `data-test="view-grid"` - Switch to grid view
- `data-test="view-list"` - Switch to list view
- `data-test="pagination"` - Pagination container
- `data-test="next-page"` - Next page button
- `data-test="current-page"` - Current page indicator

#### Candidate Actions
- `data-test="edit-candidate"` - Edit candidate button
- `data-test="delete-candidate"` - Delete candidate button
- `data-test="candidate-checkbox"` - Select candidate checkbox
- `data-test="select-all-checkbox"` - Select all candidates
- `data-test="bulk-actions"` - Bulk actions container
- `data-test="bulk-delete-button"` - Bulk delete button
- `data-test="bulk-status-button"` - Bulk status update button

#### Create/Edit Candidate Modal
- `data-test="create-candidate-modal"` - Create modal container
- `data-test="edit-candidate-modal"` - Edit modal container
- `data-test="cv-upload-tab"` - CV upload tab
- `data-test="candidate-firstname"` - First name input
- `data-test="candidate-lastname"` - Last name input
- `data-test="candidate-email"` - Email input
- `data-test="candidate-phone"` - Phone input
- `data-test="candidate-location"` - Location input
- `data-test="candidate-title"` - Job title input
- `data-test="candidate-experience"` - Years of experience input
- `data-test="candidate-skills-input"` - Skills input field
- `data-test="cv-file-input"` - CV file upload input
- `data-test="parsing-indicator"` - CV parsing in progress
- `data-test="parsing-complete"` - CV parsing complete
- `data-test="submit-candidate"` - Submit button
- `data-test="save-candidate"` - Save changes button

#### Candidate Detail
- `data-test="candidate-detail"` - Detail view container
- `data-test="candidate-drawer"` - Candidate drawer
- `data-test="candidate-name"` - Candidate name display
- `data-test="candidate-status"` - Status badge
- `data-test="candidate-status-select"` - Status dropdown
- `data-test="status-option-active"` - Active status option
- `data-test="status-option-passive"` - Passive status option
- `data-test="add-note-button"` - Add note button
- `data-test="note-content"` - Note textarea
- `data-test="save-note"` - Save note button
- `data-test="candidate-note"` - Displayed note
- `data-test="add-to-job-button"` - Add to job button
- `data-test="export-cv-button"` - Export CV button
- `data-test="share-candidate-button"` - Share candidate button

### Jobs Page (`/jobs`)

#### List View
- `data-test="create-job-button"` - Create new job button
- `data-test="jobs-grid"` - Grid view container
- `data-test="jobs-list"` - List view container
- `data-test="job-card"` - Individual job card
- `data-test="job-title"` - Job title display
- `data-test="job-location"` - Job location display
- `data-test="job-status"` - Job status pill
- `data-test="search-jobs"` - Search input field
- `data-test="urgency-badge"` - Urgency indicator
- `data-test="pipeline-stats"` - Pipeline statistics
- `data-test="pipeline-detailed"` - Detailed pipeline view
- `data-test="stage-count"` - Stage candidate count
- `data-test="expand-all"` - Expand all jobs button

#### Job Actions
- `data-test="edit-job"` - Edit job button
- `data-test="delete-job"` - Delete job button
- `data-test="duplicate-job"` - Duplicate job button
- `data-test="select-job-checkbox"` - Select job checkbox
- `data-test="set-outcome-button"` - Set job outcome button

#### Create/Edit Job Modal
- `data-test="create-job-modal"` - Create modal container
- `data-test="edit-job-modal"` - Edit modal container
- `data-test="job-title"` - Job title input
- `data-test="job-description"` - Description textarea
- `data-test="job-description-input"` - For AI parsing
- `data-test="job-location"` - Location input
- `data-test="job-salary"` - Salary input
- `data-test="employment-type-select"` - Employment type dropdown
- `data-test="employment-type-fulltime"` - Full-time option
- `data-test="urgency-select"` - Urgency dropdown
- `data-test="urgency-high"` - High urgency option
- `data-test="urgency-critical"` - Critical urgency option
- `data-test="job-status-select"` - Status dropdown
- `data-test="status-paused"` - Paused status option
- `data-test="add-stage-button"` - Add pipeline stage
- `data-test="new-stage-input"` - New stage name input
- `data-test="sla-days"` - SLA days input
- `data-test="ai-parse-button"` - AI parse button
- `data-test="publish-job"` - Publish job button
- `data-test="save-draft"` - Save as draft button
- `data-test="save-job"` - Save changes button

#### Job Detail Page
- `data-test="job-detail"` - Job detail container
- `data-test="share-job-button"` - Share job button
- `data-test="export-job-button"` - Export job button

#### Close Job Modal
- `data-test="close-job-modal"` - Close job modal
- `data-test="outcome-won"` - Won outcome button
- `data-test="outcome-lost"` - Lost outcome button
- `data-test="close-reason-select"` - Close reason dropdown
- `data-test="close-notes"` - Close notes textarea
- `data-test="confirm-close"` - Confirm close button

### Pipeline/Kanban (`/jobs/[id]`)
- `data-test="pipeline-stage"` - Pipeline stage column
- `data-test="candidate-card"` - Candidate card in pipeline
- `data-test="add-candidate-button"` - Add candidate to job
- `data-test="existing-candidate-tab"` - Existing candidates tab
- `data-test="remove-candidate"` - Remove candidate from job
- `data-test="pipeline-search"` - Search in pipeline

### Search Page (`/search`)
- `data-test="global-search-input"` - Main search input
- `data-test="search-results"` - Results container
- `data-test="candidates-results"` - Candidates results section
- `data-test="jobs-results"` - Jobs results section
- `data-test="candidate-result"` - Individual candidate result
- `data-test="job-result"` - Individual job result
- `data-test="search-suggestions"` - Search suggestions dropdown
- `data-test="suggestion-item"` - Individual suggestion
- `data-test="filter-type-candidates"` - Filter by candidates
- `data-test="filter-type-jobs"` - Filter by jobs
- `data-test="no-results"` - No results message
- `data-test="advanced-search-button"` - Advanced search toggle
- `data-test="ai-search-toggle"` - AI search mode toggle
- `data-test="ai-processing"` - AI processing indicator
- `data-test="ai-search-results"` - AI search results
- `data-test="relevance-score"` - AI relevance score
- `data-test="ai-match-explanation"` - AI match explanation

### Common UI Elements

#### Filters
- `data-test="filter-status-active"` - Active status filter
- `data-test="apply-filters"` - Apply filters button
- `data-test="active-filters"` - Active filters indicator
- `data-test="active-filters-count"` - Number of active filters

#### Modals
- `data-test="confirm-delete-modal"` - Delete confirmation modal
- `data-test="confirm-delete"` - Confirm delete button
- `data-test="cancel-delete"` - Cancel delete button
- `data-test="share-modal"` - Share modal
- `data-test="copy-link-button"` - Copy link button
- `data-test="link-copied"` - Link copied message

#### Messages
- `data-test="success-message"` - Success notification
- `data-test="error-message"` - Error notification
- `data-test="error-firstname"` - First name validation error
- `data-test="error-lastname"` - Last name validation error
- `data-test="error-email"` - Email validation error
- `data-test="error-title"` - Title validation error
- `data-test="error-description"` - Description validation error

## Implementation Example

```tsx
// Button component
<button
  data-test="create-candidate-button"
  onClick={handleCreate}
  className="..."
>
  Create Candidate
</button>

// Input component
<input
  data-test="candidate-firstname"
  type="text"
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
  className="..."
/>

// Table row
<tr data-test="candidate-row" key={candidate.id}>
  <td>{candidate.name}</td>
  <td data-test="candidate-status">{candidate.status}</td>
</tr>
```

## Best Practices

1. **Unique Identifiers**: Ensure data-test values are unique within a page
2. **Semantic Naming**: Use descriptive names that explain the element's purpose
3. **Consistency**: Follow the same naming pattern throughout the application
4. **No Dynamic Values**: Avoid using dynamic IDs or indexes in data-test attributes
5. **Component Hierarchy**: Include parent context in naming when needed (e.g., `candidate-modal-submit` vs `job-modal-submit`)

## Testing Priority

High priority components to add data-test attributes:
1. Navigation and routing elements
2. Form inputs and buttons
3. Data tables and lists
4. Modal dialogs
5. Action buttons (create, edit, delete)
6. Search and filter controls
7. Status indicators and badges

## Notes for Developers

- Add data-test attributes during development, not as an afterthought
- Keep this guide updated when adding new UI components
- Run Playwright tests locally before committing changes
- Consider data-test attributes as part of the component's API
