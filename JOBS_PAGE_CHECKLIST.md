# Jobs Page - Quick Visual Testing Checklist

## 🎯 Critical Features to Test

### 1. View Modes
```
[ ] List View - Cards in vertical list
[ ] Grid View - Cards in 3-column grid  
[ ] Group by Client - Jobs grouped under client headers
```

### 2. Card States (List/Client View Only)
```
[ ] Single-row (default) - Thin ~64px height
[ ] Expanded - Full details with pipeline stages
[ ] Medium row - In between size
[ ] Cycle: Single → Expanded → Medium → Single
```

### 3. Visual Elements
```
[ ] ✅ Blue bracket (left border) on ALL cards in ALL views
[ ] ✅ NO star icons (⭐) in job titles
[ ] ✅ Hover tooltips on view toggle buttons
```

### 4. Grid View Specifics
```
[ ] Vertical pipeline kanban in each card
[ ] 5 stages: Sourced → Screened → Interview → Offer → Hired
[ ] Candidate chips (circles) in stages
[ ] NO expand/collapse buttons
[ ] Fixed card height
```

### 5. Toolbar Buttons
```
List View:
[ ] "Expand All" → "Single Row All" → "Compact All"

Grid View:
[ ] Toggle button HIDDEN

Client View:
[ ] Each section has own toggle button
```

### 6. Interactions
```
[ ] Click single-row card → Opens job detail page
[ ] Menu button (3 dots) → Edit/Duplicate/Delete
[ ] Add Candidate dropdown works
```

## 🔍 Quick Test Sequence

1. **Load /jobs** → Should show single-row cards
2. **Click Grid View** → 3-column grid with pipelines
3. **Click Group by Client** → Sectioned by client
4. **Back to List View** → Test expand button cycling
5. **Click "Expand All"** → All cards expand
6. **Refresh page** → View mode persists

## 🐛 Common Issues to Check

- No TypeErrors in console
- No layout shifts when switching views
- Smooth animations
- All buttons clickable
- No text overflow

## 📸 Screenshot These States

1. List view - all single-row
2. List view - all expanded  
3. Grid view with pipeline
4. Client view with sections
5. Single card with blue bracket visible
