# GardenPlanner Versioning Architecture

## Problem

When users saved their canvas, a new Plan document was created in the database instead of creating a new Version for an existing SeasonPlan.

## Root Cause

1. Frontend's `saveCurrentPlan()` always called `POST /api/plans` (legacy endpoint)
2. This created a new Plan document every time instead of creating versions
3. The new normalized structure (Garden → SeasonPlan → Version) wasn't being used

## Solution

### 1. Updated planService.js

- Added new methods for the Garden API:
  - `createSeasonPlan()` - Create initial season plan + version
  - `updateSeasonPlan()` - Create new version for existing plan
  - `getSeasonPlan()` - Get season plan with current version data
  - `getVersionHistory()` - View all versions
  - `restoreVersion()` - Rollback to previous version

### 2. Updated useGardenStore.js

- Modified `saveCurrentPlan()` to:
  - Auto-create a Garden if none exists
  - Check if plan has an ID (exists in DB)
  - If yes: Call `updateSeasonPlan()` → Creates new Version ONLY if layout or plantings changed
    → Otherwise updates metadata (year/title)
  - If no: Call `createSeasonPlan()` → Creates SeasonPlan + initial Version

### 3. Added gardenService.js

- New service for Garden management
- Functions: getGardens, createGarden, updateGarden, deleteGarden

### 4. Enhanced Store State

- Added `currentGarden` - Current garden being worked on
- Added `gardens` - List of all gardens
- Added `gardenId` to currentPlan
- Added garden management functions:
  - `fetchGardens()` - Load all gardens
  - `createGarden()` - Create new garden
  - `setCurrentGarden()` - Switch gardens
  - `loadSeasonPlan()` - Load plan from new API
  - `getVersionHistory()` - View version history
  - `restoreVersion()` - Restore old version

## How It Works Now

### First Save (New Plan)

```
User clicks Save
  → No gardenId exists
  → Auto-creates Garden with current layout name
  → Creates SeasonPlan for current year
  → Creates Version with full snapshot (layout + plantings)
  → Updates state with plan ID and gardenId
```

### Subsequent Saves (Updates)

```
User clicks Save
  → Plan ID exists
  → Calls updateSeasonPlan(id, data)

  → If layout or plantings changed:
        Create NEW Version with full snapshot

  → If only metadata changed (year/title):
        Update SeasonPlan without creating a new Version

  → Update state with latest snapshot
  → Previous versions preserved for history
```

### Version History

```
User can now:
  → View all saved versions: getVersionHistory(planId)
  → See what changed: Each version has comment + timestamp
  → Restore old version: restoreVersion(versionId) → Creates new version as copy
```

## Database Structure

```
Garden (created once per garden)
  ↓
SeasonPlan (one per year, metadata only)
  ↓
Version 1 (initial save)
Version 2 (first update)
Version 3 (second update)
...
```

**Each Version contains:**

- Full layout (all shapes)
- Full plantings (all crop data)
- Comment (e.g., "Manual save")
- Timestamp
- Type (manual/auto/restored)

## Benefits

1. ✅ **No more duplicate plans** - Updates create versions, not new plans
2. ✅ **Full history** - Every save is a version, nothing is lost
3. ✅ **Easy rollback** - Restore any previous version
4. ✅ **Multi-year support** - Different SeasonPlans per year
5. ✅ **Collaboration ready** - Gardens support multiple members
6. ✅ **Legacy** /api/plans endpoints are deprecated and will be removed

## Testing

1. **New User Flow:**
   - Open planner, draw shapes, click Save
   - Should create garden, plan, and version
   - Check MongoDB: 1 Garden, 1 SeasonPlan, 1 Version

2. **Update Flow:**
   - Modify shapes, click Save again
   - Should create Version #2
   - Check MongoDB: Same Garden/SeasonPlan, 2 Versions

3. **Version History:**
   - Call `getVersionHistory(planId)`
   - Should return array of versions with timestamps

4. **Restore:**
   - Call `restoreVersion(oldVersionId)`
   - Should create new version as copy of old one
   - Canvas should update with restored data

## Files Changed

- `src/features/planner/services/planService.js` - Added new API methods
- `src/features/planner/services/gardenService.js` - NEW - Garden management
- `src/features/planner/store/useGardenStore.js` - Updated save logic + garden management
- `server/src/modules/gardens/garden.controller.js` - Already created (previous work)
- `server/src/modules/gardens/garden.routes.js` - Already created (previous work)

---

**Updated:** March 3, 2026
