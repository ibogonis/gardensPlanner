# Database Migration: Plan → Garden/SeasonPlan/Version

## Overview

This migration transforms the legacy single-document-per-year structure into a normalized three-collection structure optimized for multi-user collaboration and version history.

## Migration Strategy

### Old Structure (Collection: `plans`)

```javascript
{
  _id: ObjectId,
  userId: String,
  name: String,
  year: Number,
  layout: Object,
  plantings: Object
}
```

### New Structure

**Gardens** (Collection: `gardens`)

- One garden per unique (userId + name) combination
- Supports multiple members with roles
- Central entity for organizing season plans

**SeasonPlans** (Collection: `seasonPlans`)

- One plan per garden per year
- Contains layout information
- References current version

**Versions** (Collection: `versions`)

- Version history for plantings
- Linked to season plans
- Tracks changes over time

## Running the Migration

### 1. Dry Run (Recommended First)

```bash
DRY_RUN=true node server/scripts/migrate-to-normalized-structure.js
```

This simulates the migration without making any changes.

### 2. Live Migration

```bash
node server/scripts/migrate-to-normalized-structure.js
```

### 3. Check Results

```bash
# Open MongoDB shell and verify
mongosh "your-connection-string"

# Count documents
db.gardens.countDocuments()
db.seasonPlans.countDocuments()
db.versions.countDocuments()

# Verify a migration
db.gardens.findOne()
db.seasonPlans.findOne()
db.versions.findOne()
```

## Safety Features

✅ **Idempotent** - Can be run multiple times safely

- Reuses existing gardens instead of creating duplicates
- Skips existing season plans for same garden+year
- Uses compound indexes to prevent duplicates

✅ **Non-Destructive** - Old data preserved

- Original `plans` collection remains untouched
- Timestamps preserved from source documents
- All data copied, not moved

✅ **Transactional** - Atomic operations

- Uses MongoDB transactions per plan
- Rollback on error for each transaction
- Maintains data consistency

✅ **Auditable** - Complete logging

- Color-coded log levels
- Detailed statistics
- Error tracking

## Expected Output

```
[2026-03-03T...] INFO: 🚀 Starting migration: Plan → Garden/SeasonPlan/Version
[2026-03-03T...] INFO: Mode: LIVE
[2026-03-03T...] SUCCESS: ✓ Connected to MongoDB

📊 Pre-migration counts:
  Old Plans: 150
  Existing Gardens: 0
  Existing SeasonPlans: 0
  Existing Versions: 0

📦 Processing batch: 1 to 50
📄 Processing plan: "My Garden" (Year: 2024, User: 123...)
  ✓ Created Garden (ID: 456...)
  ✓ Created Version (ID: 789...)
  ✓ Created SeasonPlan (ID: 012...)
...

✅ Migration completed!
⏱️  Duration: 12.5s

📊 Migration statistics:
  Plans processed: 150
  Gardens created: 45
  Gardens reused: 105
  SeasonPlans created: 150
  SeasonPlans skipped: 0
  Versions created: 150
  Errors: 0
```

## Troubleshooting

### Error: "Duplicate key error"

This shouldn't happen due to idempotency checks, but if it does:

1. Check MongoDB indexes are properly created
2. Run the migration again - it will skip existing documents

### Error: "Transaction failed"

1. Ensure MongoDB supports transactions (replica set required)
2. Check connection string includes `?retryWrites=true`
3. Verify MongoDB version >= 4.0

### Memory issues with large datasets

The migration processes in batches of 50. To adjust:

```bash
# Edit BATCH_SIZE in the script
const BATCH_SIZE = 20; // Reduce for large documents
```

## Rollback

If you need to rollback (only needed if something goes wrong):

```bash
node server/scripts/rollback-migration.js
```

⚠️ **Warning**: Rollback deletes new collections. Only use if migration failed.

## Post-Migration

After successful migration:

1. **Update API Endpoints** - Modify controllers to use new models
2. **Update Frontend** - Adjust API calls if needed
3. **Test Thoroughly** - Verify all features work
4. **Monitor Performance** - Check query performance
5. **Backup Old Data** - Archive `plans` collection
6. **Eventually Remove** - After confirmation, drop old collection

## Index Creation

The models automatically create these indexes:

- `gardens`: `{ "members.userId": 1 }`, `{ title: 1, "members.userId": 1 }`
- `seasonPlans`: `{ gardenId: 1, year: 1 }` (unique)
- `versions`: `{ seasonPlanId: 1, createdAt: -1 }`

Verify indexes after migration:

```javascript
db.gardens.getIndexes();
db.seasonPlans.getIndexes();
db.versions.getIndexes();
```

## Support

For issues or questions:

1. Check the migration logs for detailed error messages
2. Verify MongoDB connection and permissions
3. Ensure all models are properly defined
4. Run in DRY_RUN mode first to identify issues
