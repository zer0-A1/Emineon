# Comprehensive Manual Testing Guide - Emineon ATS

## Prerequisites
1. Application running locally (`npm run dev`)
2. User account for authentication
3. Browser with developer tools

## 1. Authentication & Access
- [ ] Navigate to http://localhost:3000
- [ ] Sign in with your credentials
- [ ] Verify successful authentication
- [ ] Check user button/avatar appears in header

## 2. Jobs Page - Complete Testing

### 2.1 Initial Page Load
- [ ] Navigate to `/jobs`
- [ ] Verify page loads without errors
- [ ] Check that default view is single-row (compact) view
- [ ] Verify URL remains `/jobs` (no redirect)

### 2.2 View Toggle Buttons
- [ ] Locate the three view toggle buttons in the toolbar
- [ ] **List View Button**:
  - [ ] Hover over button - verify tooltip shows "List View"
  - [ ] Click button - verify it becomes active (highlighted)
  - [ ] Verify jobs display in vertical list format
- [ ] **Grid View Button**:
  - [ ] Hover over button - verify tooltip shows "Grid View"
  - [ ] Click button - verify it becomes active
  - [ ] Verify jobs display in grid layout (3 columns on desktop)
- [ ] **Group by Client Button**:
  - [ ] Hover over button - verify tooltip shows "Group by Client"
  - [ ] Click button - verify it becomes active
  - [ ] Verify jobs are grouped by client with section headers

### 2.3 Job Card States (List View)
- [ ] In List View, verify cards start in single-row format
- [ ] **Single-Row Card**:
  - [ ] Height should be ~64px (h-16)
  - [ ] Shows: Title, Client, Location, Status, Candidate count
  - [ ] Blue bracket on left side (4px wide, primary-500 color)
  - [ ] No detailed information visible
- [ ] **Expand Button Testing**:
  - [ ] Click expand button on first card
  - [ ] Verify card expands to show detailed view
  - [ ] Click again - verify card changes to medium row view
  - [ ] Click again - verify card returns to single-row view
- [ ] **Detailed Card View**:
  - [ ] Shows full job description
  - [ ] Shows pipeline stages with counts
  - [ ] Shows SLA information
  - [ ] Shows all action buttons
  - [ ] Blue bracket still visible

### 2.4 Toolbar Bulk Actions
- [ ] **In List View**:
  - [ ] Locate "Expand All" button in toolbar
  - [ ] Click it - verify ALL cards expand to detailed view
  - [ ] Button text changes to "Single Row All"
  - [ ] Click again - ALL cards change to medium row view
  - [ ] Button text changes to "Compact All"
  - [ ] Click again - ALL cards return to single-row view
- [ ] **In Grid View**:
  - [ ] Verify bulk toggle button is HIDDEN
- [ ] **In Group by Client View**:
  - [ ] Each client section has its own toggle button
  - [ ] Test toggle works per section independently

### 2.5 Grid View Specific Tests
- [ ] Switch to Grid View
- [ ] **Card Layout**:
  - [ ] Cards arranged in grid (1 col mobile, 2 cols tablet, 3 cols desktop)
  - [ ] Each card shows vertical pipeline kanban
  - [ ] Blue bracket on left side of each card
- [ ] **Pipeline Display**:
  - [ ] 5 stages visible: Sourced, Screened, Interview, Offer, Hired
  - [ ] Each stage shows count
  - [ ] Candidate chips (circles with initials) in each stage
  - [ ] Pipeline height is constrained (doesn't overflow card)
- [ ] **No Expand/Collapse**:
  - [ ] Verify no expand buttons on cards
  - [ ] Cards maintain consistent height

### 2.6 Group by Client View Tests
- [ ] Switch to Group by Client view
- [ ] **Client Sections**:
  - [ ] Each client has a section header
  - [ ] Client name displayed prominently
  - [ ] Job count shown (e.g., "3 jobs")
  - [ ] Section has light background
- [ ] **Cards in Client View**:
  - [ ] Default to single-row view
  - [ ] Blue bracket visible on all cards
  - [ ] Can expand/collapse individually
- [ ] **Section Toggle**:
  - [ ] Each section has "Expand All" button
  - [ ] Works only for that section's jobs
  - [ ] Other sections remain unchanged

### 2.7 Job Card Interactions
- [ ] **Click on Single-Row Card** (List View):
  - [ ] Click on card body (not buttons)
  - [ ] Should navigate to job detail page
  - [ ] URL changes to `/jobs/{id}`
  - [ ] Use browser back to return
- [ ] **Menu Button**:
  - [ ] Hover over job card
  - [ ] Click three-dot menu button
  - [ ] Menu opens with: Edit, Duplicate, Delete
  - [ ] Click outside to close menu
- [ ] **Action Buttons**:
  - [ ] "View Details" - navigates to job page
  - [ ] "Add Candidate" dropdown - opens candidate options

### 2.8 Search & Filter
- [ ] **Search Bar**:
  - [ ] Type in search box
  - [ ] Jobs filter in real-time (after debounce)
  - [ ] Clear search - all jobs return
- [ ] **Create Job Button**:
  - [ ] Click "Create Job" or "+" button
  - [ ] Modal/page opens for job creation
  - [ ] Can close/cancel

### 2.9 Visual Verification
- [ ] **Blue Bracket**:
  - [ ] Present on ALL cards in ALL views
  - [ ] 4px wide, primary-500 color
  - [ ] On the left side of each card
- [ ] **No Star Icons**:
  - [ ] Verify NO star (⭐) icons in job titles
  - [ ] Titles are clean text only
- [ ] **Consistent Spacing**:
  - [ ] Cards have consistent gaps
  - [ ] Proper padding around content
  - [ ] No overlapping elements

### 2.10 State Persistence
- [ ] Select Grid View
- [ ] Refresh the page (F5)
- [ ] Verify still in Grid View after reload
- [ ] Expand some cards in List View
- [ ] Navigate away and back
- [ ] Verify view mode persists (not individual card states)

### 2.11 Error Handling
- [ ] **Empty State**:
  - [ ] If no jobs, should show empty state message
  - [ ] "No jobs found" or "Create your first job"
  - [ ] Create button prominently displayed
- [ ] **Console Errors**:
  - [ ] Open browser console (F12)
  - [ ] No errors during view switches
  - [ ] No errors during card interactions
  - [ ] No "TypeError" messages

### 2.12 Responsive Design
- [ ] **Desktop (1920x1080)**:
  - [ ] Grid: 3 columns
  - [ ] All buttons visible
  - [ ] Full navigation sidebar
- [ ] **Tablet (768x1024)**:
  - [ ] Grid: 2 columns
  - [ ] Navigation may collapse
- [ ] **Mobile (375x667)**:
  - [ ] Grid: 1 column
  - [ ] Mobile menu button appears
  - [ ] View toggle buttons still accessible

## 3. Other Core Features

### 3.1 Candidates Page
- [ ] Navigate to `/candidates`
- [ ] Search functionality works
- [ ] Create new candidate
- [ ] Upload CV/Resume
- [ ] View candidate profile
- [ ] Generate competence file

### 3.2 Pipeline Management
- [ ] Open a job detail page
- [ ] Add candidates to pipeline
- [ ] Drag candidates between stages
- [ ] Update candidate status
- [ ] Remove candidates

### 3.3 AI Features
- [ ] Create job with AI parsing
- [ ] Match candidates to job
- [ ] Generate screening questions
- [ ] AI-powered search

### 3.4 Document Generation
- [ ] Generate CV from candidate profile
- [ ] Generate competence file (all templates)
- [ ] Download generated documents
- [ ] Edit competence file content

### 3.5 Search
- [ ] Global search from `/search`
- [ ] Results show jobs and candidates
- [ ] Filters work correctly

### 3.6 Projects & Clients
- [ ] Create new client
- [ ] Create project for client
- [ ] Link jobs to projects
- [ ] View project dashboard

## 4. Performance Checks
- [ ] Page load time < 3 seconds
- [ ] Smooth transitions between views
- [ ] No lag when expanding/collapsing cards
- [ ] Search responds quickly
- [ ] No memory leaks (check Task Manager)

## 5. Data Integrity
- [ ] Create job, refresh, verify it persists
- [ ] Edit job, verify changes save
- [ ] Delete job, verify it's removed
- [ ] Check job counts match actual cards

## Bug Report Template
If you find issues:
```
**Issue**: [Brief description]
**Steps to Reproduce**:
1. 
2. 
3. 
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: [Chrome/Firefox/Safari version]
**Console Errors**: [Any errors from F12 console]
**Screenshot**: [If applicable]
```

## Testing Priority
1. **CRITICAL**: Jobs page view modes and card states
2. **HIGH**: Blue bracket visibility, no star icons
3. **HIGH**: Single-row default view, click to open
4. **MEDIUM**: Pipeline in grid view with candidate chips
5. **LOW**: Animations and transitions

Remember to test with:
- Different amounts of data (0, 1, 10, 100+ jobs)
- Different screen sizes
- Different browsers
- Fast and slow network conditions
