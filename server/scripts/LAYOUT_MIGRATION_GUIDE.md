# Layout Migration to Version - Full Snapshot Versioning

## Overview

This migration implements full snapshot versioning by moving the `layout` field from `SeasonPlan` documents into their corresponding `Version` documents.

## Changes

### Before

```javascript
SeasonPlan {
  _id,
  gardenId,
  year,
  layout,              // ❌ Stored here
  currentVersionId
}

Version {
  _id,
  seasonPlanId,
  plantings,           // ✓ Already here
  comment,
  type
}
```

### After

```javascript
SeasonPlan {
  _id,
  gardenId,
  year,
  currentVersionId     // ✓ Layout removed
}

Version {
  _id,
  seasonPlanId,
  layout,              // ✅ Now stored here (full snapshot)
  plantings,           // ✅ Already here (full snapshot)
  comment,
  type
}
```

## Benefits

1. **Full Snapshot Versioning** - Each version contains complete state (layout + plantings)
2. **Version History** - Can reconstruct exact state at any point in time
3. **Cleaner Separation** - SeasonPlan is just metadata, Version holds all data
4. **Future-Proof** - Easy to add more fields to version snapshots

## Running the Migration

### Step 1: Dry Run (Required First)

```bash
cd server
DRY_RUN=true node scripts/migrate-layout-to-version.js
```

This simulates the migration without making changes.

### Step 2: Run Migration

```bash
node scripts/migrate-layout-to-version.js
```

### Step 3: Verify

Check that:

- All Versions now have layout field
- No SeasonPlans have layout field
- Data integrity maintained

## Safety Features

✅ **Idempotent**

- Safe to run multiple times
- Checks if Version already has layout
- Skips if layout already migrated

✅ **Transactional**

- Each SeasonPlan migrated in own transaction
- Automatic rollback on error
- Maintains data consistency

✅ **Non-Destructive**

- Verifies transfer before removing
- Detailed logging for audit
- No data loss

✅ **Validation**

- Checks layout exists before transfer
- Verifies Version has layout after transfer
- Confirms removal from SeasonPlan

## Migration Process

For each SeasonPlan:

1. **Check** - Does SeasonPlan have layout field?
2. **Verify** - Does it have a currentVersionId?
3. **Fetch** - Get the corresponding Version
4. **Idempotency** - Does Version already have layout?
5. **Transfer** - Copy layout to Version
6. **Remove** - Delete layout from SeasonPlan
7. **Verify** - Confirm successful migration

## Expected Output

```
🚀 Starting migration: Move Layout to Version
✓ Connected to MongoDB

📊 Pre-migration counts:
  SeasonPlans: 1
  SeasonPlans with layout: 1
  Versions: 1

📦 Processing batch: 1 to 1
📄 Processing SeasonPlan 69a6d4c1... (Garden: 69a6d4c1..., Year: 2026)
  📦 Found layout with 3 keys
  ✓ Moved layout to Version 69a6d4c1...
  ✓ Removed layout from SeasonPlan 69a6d4c1...
  ✓ Verified: Layout successfully migrated

✅ Migration completed!
⏱️  Duration: 0.15s

📊 Migration statistics:
  SeasonPlans processed: 1
  Layouts moved to Version: 1
  Layouts already in Version: 0
  Layouts not found: 0
  Layouts removed from SeasonPlan: 1
  Errors: 0

✅ All layouts successfully moved to Versions.
```

## Schema Updates

### SeasonPlan.js

```javascript
// Removed:
layout: {
  type: Object,
  default: {},
}

// Comment added:
// layout removed - now stored in Version for full snapshot versioning
```

### Version.js

```javascript
// Added:
layout: {
  type: Object,
  required: true,
  default: {},
}

// Comment added:
// Full snapshot versioning: both layout and plantings stored here
```

## Troubleshooting

### "Version not found"

- SeasonPlan has currentVersionId but Version doesn't exist
- Check database consistency
- May need to create missing Version

### "SeasonPlan has no layout field"

- Already migrated
- Or was created after schema update
- Safe to skip

### "Version already has layout"

- Migration already run
- Safe to skip
- Will still remove layout from SeasonPlan if present

## Next Steps

After successful migration:

1. **Test Application** - Verify all features work
2. **Update Controllers** - Ensure they read layout from Version
3. **Update Save Logic** - Save layout to Version, not SeasonPlan
4. **Test Version History** - Verify snapshots are complete
5. **Monitor Performance** - Check query performance

## Rollback

If needed, you can manually rollback:

```javascript
// For each Version, move layout back to SeasonPlan
const versions = await Version.find({});
for (const version of versions) {
  await SeasonPlan.updateOne(
    { _id: version.seasonPlanId },
    { $set: { layout: version.layout } },
  );
}
```

⚠️ **Not recommended** - only if migration fails critically.

## Important Notes

1. **Schema Change** - SeasonPlan schema updated (layout removed)
2. **New Versions** - After migration, always save layout to Version
3. **Backward Compatibility** - Old code reading layout from SeasonPlan will fail
4. **Update Queries** - All queries must be updated to fetch layout from Version

## Verification Queries

### Check layout removed from SeasonPlans

```javascript
db.seasonplans.countDocuments({ layout: { $exists: true } });
// Should return: 0
```

### Check all Versions have layout

```javascript
db.versions.countDocuments({ layout: { $exists: false } });
// Should return: 0
```

### Sample check

```javascript
// Get a SeasonPlan
const sp = db.seasonplans.findOne();
// Get its Version
const v = db.versions.findOne({ _id: sp.currentVersionId });
// Verify Version has layout
v.layout; // Should exist
```

---

**Status:** ✅ Ready to run
**Risk Level:** 🟡 Low (schema change, requires code updates)
**Estimated Time:** ~1 second per 50 SeasonPlans
