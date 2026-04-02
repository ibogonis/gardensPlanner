# HistoryTable Implementation Documentation

## Overview

The **HistoryTable** is a comprehensive sidebar panel that provides version history navigation, garden/season selection, and preview/restore functionality for the Garden Planner application.

---

## Features Implemented

✅ **Garden Navigation** - Switch between different gardens
✅ **Season Selection** - Navigate between season plans (years)  
✅ **Version History** - View all versions with timestamps and comments  
✅ **Preview Mode** - View previous versions without changing current state  
✅ **Version Restore** - Restore any previous version (creates new version)  
✅ **Current Version Indicator** - Visual indication of active version  
✅ **Smart State Management** - Preserves state during preview mode

---

## Architecture

### Component Structure

```
HistoryTable/
├── HistoryTable.jsx          # Main component
└── HistoryTable.module.css   # Styles
```

### Integration Points

```
Plan.jsx (Layout)
├── HistoryTable (Left Sidebar)
├── Canvas (Center)
└── Palette + PropertiesPanel (Left Sidebar)
```

---

## Store Integration

### New State Added

```javascript
{
  versions: [],              // Version history for current plan
  isPreviewMode: false,      // Preview mode flag
  previewVersionId: null,    // ID of version being previewed
  savedStateBeforePreview: null  // State backup during preview
}
```

### New Actions Added

```javascript
// Version History
getVersionHistory(seasonPlanId); // Fetches lightweight version list
selectGarden(gardenId); // Switches to different garden
selectPlan(planId); // Loads season plan + version history

// Preview Mode
previewVersion(versionId); // Enters preview mode with snapshot
exitPreview(); // Exits preview, restores saved state

// Restore (enhanced)
restoreVersion(versionId); // Restores version + refreshes history
```

---

## API Integration

### Endpoints Used

```
GET  /api/gardens                        # List gardens
GET  /api/gardens/:id/season-plans       # List season plans
GET  /api/season-plans/:id/versions      # Get version history (lightweight)
GET  /api/versions/:id                   # Get full version snapshot
POST /api/versions/:id/restore           # Restore version
```

### New Service Function

```javascript
planService.getVersion(versionId);
```

Fetches complete version snapshot for preview mode.

---

## UI Components

### Garden Selector

```jsx
<select value={currentGarden?._id}>
  <option>Select a garden</option>
  {gardens.map((garden) => (
    <option key={garden._id}>{garden.title}</option>
  ))}
</select>
```

**Behavior:**

- Loads on mount (fetches gardens)
- On change → loads season plans for selected garden
- Auto-selects first season plan

---

### Season Selector

```jsx
<select value={currentPlan?.id}>
  <option>Select a season</option>
  {plans.map((plan) => (
    <option key={plan._id}>{plan.year}</option>
  ))}
</select>
```

**Behavior:**

- Only shown when garden is selected
- On change → loads season plan + fetches version history
- Displays year (e.g., "2026")

---

### Version List

Displays scrollable list of versions with:

**Visual Elements:**

- ● Green indicator → current version
- ○ Gray indicator → old version
- Comment text (e.g., "Manual save", "Initial version")
- Timestamp (HH:mm format)
- Date label ("Today", "Yesterday", or "Mon DD")

**Actions (per version):**

- **Preview** button → enters preview mode
- **Restore** button → restores version (with confirmation)

**Current version:**

- Cannot be restored (no Restore button)
- Has green background tint

---

### Preview Mode Banner

Appears when `isPreviewMode === true`:

```
👁️ Previewing version
[Restore] [Exit preview]
```

**Behavior:**

- Shown at top of sidebar
- Yellow background (warning color)
- Two actions:
  - **Restore** → restores previewed version
  - **Exit preview** → returns to current version

---

## State Flow

### Initial Load

```
Component mounts
  ↓
fetchGardens()
  ↓
State: gardens[] populated
  ↓
User selects garden
  ↓
selectGarden(gardenId)
  ↓
  1. fetchSeasonPlans(gardenId)
  2. selectPlan(firstPlan._id)
     ↓
     a. loadSeasonPlan(planId)
     b. getVersionHistory(planId)
  ↓
State: currentPlan, versions[] populated
```

---

### Preview Flow

```
User clicks "Preview" on version
  ↓
previewVersion(versionId)
  ↓
  1. Save current state (layout + plantings)
  2. Fetch version snapshot (getVersion API)
  3. Set isPreviewMode = true
  4. Load snapshot into canvas
  ↓
Canvas shows preview
Preview banner appears
  ↓
User clicks "Exit preview"
  ↓
exitPreview()
  ↓
  1. Restore saved state
  2. Set isPreviewMode = false
  ↓
Canvas shows current version
```

---

### Restore Flow

```
User clicks "Restore" on version
  ↓
Confirmation dialog
  ↓
restoreVersion(versionId)
  ↓
Backend:
  1. Creates new version (copy of restored)
  2. Updates currentVersionId
  ↓
Frontend:
  1. loadSeasonPlan(currentPlan.id)  # Reload with new current
  2. getVersionHistory(currentPlan.id)  # Refresh list
  ↓
Version list updated
New version at top (marked as current)
```

---

## Performance Optimizations

### Lightweight Version List

**Problem:** Loading all versions with full snapshots would be slow.

**Solution:** Backend returns only metadata:

```javascript
{
  _id: "...",
  comment: "Manual save",
  type: "manual",
  createdAt: "2026-03-18T10:30:00Z"
}
```

**No `layout` or `plantings` in list.**

### On-Demand Snapshot Loading

Full snapshot only fetched when:

- User clicks "Preview"
- User restores version (backend handles)

---

## Error Handling

### Network Errors

```javascript
try {
  await selectGarden(gardenId);
} catch (err) {
  setError(err.message);
  // Display error in red banner
}
```

### Missing Data

- No gardens → "Select a garden" option shown
- No season plans → "Select a season" option shown
- No versions → "No versions yet" message

### Failed Restore

```javascript
if (!confirm("Restore this version?")) {
  return; // User cancelled
}

try {
  await restoreVersion(versionId);
  alert("Version restored ✅");
} catch (err) {
  alert(`Failed to restore: ${err.message}`);
}
```

---

## UX Details

### Visual Hierarchy

```
┌──────────────────────────┐
│ History                  │ ← Title
├──────────────────────────┤
│ [Garden Selector]        │ ← Dropdown
├──────────────────────────┤
│ [Season Selector]        │ ← Dropdown
├──────────────────────────┤
│ 👁️ Previewing...        │ ← Preview banner (if active)
├──────────────────────────┤
│ Version History          │ ← Label
│ ┌──────────────────────┐ │
│ │ ● Manual save        │ │ ← Current version (green)
│ │   10:30  Today       │ │
│ │ [Preview]            │ │
│ ├──────────────────────┤ │
│ │ ○ Initial version    │ │ ← Old version
│ │   09:15  Yesterday   │ │
│ │ [Preview] [Restore]  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Interactions

**Hover States:**

- Version items → subtle border change + shadow
- Buttons → background color change

**Disabled States:**

- Selectors disabled during loading
- Action buttons disabled during API calls
- Restore button hidden for current version

**Loading States:**

- "Loading..." message in version list
- Disabled selectors

---

## Styling Highlights

### Color Scheme

```css
Current version:
  background: #f1f8f4 (light green)
  border: #4CAF50 (green)
  indicator: ● green

Previewing version:
  background: #fff8e1 (light amber)
  border: #ffc107 (amber)

Preview banner:
  background: #fff3cd (warning yellow)
  border-left: #ff9800 (orange)
```

### Spacing

- Sidebar width: **260px**
- Padding: **16px** sections
- Gap between items: **4px**
- Border radius: **6px** for version items

### Scrolling

```css
.versionList {
  max-height: calc(100vh - 400px); /* Account for header + selectors */
  overflow-y: auto;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
```

---

## Layout Changes

### Before

```
┌────────────────────────────────────┐
│ [Palette + Properties + History]  │  Canvas
└────────────────────────────────────┘
```

### After

```
┌──────────┬──────────────────┬──────────┐
│ History  │     Canvas       │ Palette  │
│ (Left)   │                  │ Props    │
│          │                  │ (Right)  │
└──────────┴──────────────────┴──────────┘
```

**Widths:**

- Left sidebar: 260px
- Right sidebar: 250px
- Canvas: Remaining space

---

## Testing Checklist

### Basic Functionality

- [ ] Sidebar displays on left
- [ ] Gardens load on mount
- [ ] Selecting garden loads seasons
- [ ] Selecting season loads version history
- [ ] Version list displays correctly

### Preview Mode

- [ ] Preview button loads snapshot
- [ ] Canvas shows previewed version
- [ ] Preview banner appears
- [ ] Exit preview restores original state
- [ ] Preview mode persists during interactions

### Restore

- [ ] Restore shows confirmation
- [ ] Restore creates new version
- [ ] Version list updates after restore
- [ ] New version marked as current
- [ ] Cannot restore current version

### Visual States

- [ ] Current version has green indicator
- [ ] Current version has green background
- [ ] Preview version has amber background
- [ ] Hover states work on buttons
- [ ] Loading states show correctly

### Error Handling

- [ ] Network errors show error message
- [ ] Missing gardens handled gracefully
- [ ] Failed restore shows alert
- [ ] Empty states display correctly

---

## Future Enhancements

### Potential Additions

1. **Version Diff View**
   - Show changes between versions
   - Highlight modified shapes

2. **Version Comments**
   - Allow custom comments when saving
   - Edit comment after save

3. **Version Search/Filter**
   - Search by comment
   - Filter by date range
   - Filter by user (for shared gardens)

4. **Batch Operations**
   - Delete old versions
   - Export version snapshots
   - Merge/squash versions

5. **Keyboard Shortcuts**
   - `Cmd/Ctrl + Z` → Preview previous version
   - `Cmd/Ctrl + Shift + Z` → Preview next version
   - `Esc` → Exit preview mode

6. **Version Comparison**
   - Side-by-side view
   - Slider to transition between versions

---

## Summary

The HistoryTable implementation provides:

✅ **Complete navigation** - Gardens, seasons, versions  
✅ **Non-destructive preview** - View without changing state  
✅ **Safe restore** - Confirmation + creates new version  
✅ **Performance** - Lightweight list, on-demand snapshots  
✅ **Clear UX** - Visual indicators, intuitive actions  
✅ **Error resilience** - Graceful handling, clear messages

The component integrates seamlessly with the existing Zustand store and backend API, providing a production-ready version history interface similar to Figma, Linear, and modern design tools.
