# Migration Summary

## ✅ What Was Created

### 1. New Mongoose Models

- **`models/Garden.js`** - Multi-user garden entity with members and roles
- **`models/SeasonPlan.js`** - Yearly garden plans with layout and version tracking
- **`models/Version.js`** - Version history for plantings with comments

### 2. Migration Scripts

- **`scripts/migrate-to-normalized-structure.js`** - Main migration (494 lines)
  - Idempotent and transactional
  - Batch processing for memory efficiency
  - Comprehensive logging and error handling
  - DRY_RUN mode for testing

- **`scripts/verify-migration.js`** - Validation script (280 lines)
  - Document count verification
  - Relationship integrity checks
  - Data integrity validation
  - Sample data comparison

- **`scripts/rollback-migration.js`** - Emergency rollback (100 lines)
  - Confirmation prompt before deletion
  - Transactional cleanup
  - Preserves original Plan collection

### 3. Documentation

- **`scripts/MIGRATION_GUIDE.md`** - Complete guide with troubleshooting
- **`scripts/QUICK_START.md`** - Quick reference for running migration

---

## 🎯 Migration Strategy

### Data Transformation

**OLD** → **NEW**

```
Plan {userId, name, year, layout, plantings}
  ↓
Garden {title: name, members: [{userId}]} ← One per userId+name
  ↓
SeasonPlan {gardenId, year, layout} ← One per Garden+year
  ↓
Version {seasonPlanId, plantings} ← One per SeasonPlan
```

### Key Features

✅ **Idempotent**

- Safe to run multiple times
- Reuses existing gardens
- Skips existing season plans

✅ **Non-Destructive**

- Original `plans` collection untouched
- All timestamps preserved
- Data copied, not moved

✅ **Transactional**

- Each plan migrated in its own transaction
- Automatic rollback on error
- Maintains data consistency

✅ **Efficient**

- Batch processing (50 plans at a time)
- In-memory garden cache
- Optimized database queries

---

## 📋 How to Run

### Option 1: Dry Run First (Recommended)

```bash
cd server
DRY_RUN=true node scripts/migrate-to-normalized-structure.js
```

### Option 2: Live Migration

```bash
cd server
node scripts/migrate-to-normalized-structure.js
```

### Option 3: Verify Results

```bash
cd server
node scripts/verify-migration.js
```

### Option 4: Rollback (if needed)

```bash
cd server
node scripts/rollback-migration.js
```

---

## 🔍 What Gets Checked

### Verification Script Validates:

1. ✅ Document counts match (SeasonPlans == Plans)
2. ✅ All relationships are valid
3. ✅ No orphaned documents
4. ✅ No duplicate (garden, year) combinations
5. ✅ All gardens have owners
6. ✅ Data integrity (layout & plantings copied correctly)

---

## 📊 Expected Output Example

```
🚀 Starting migration: Plan → Garden/SeasonPlan/Version
✓ Connected to MongoDB

📊 Pre-migration counts:
  Old Plans: 150
  Existing Gardens: 0
  Existing SeasonPlans: 0
  Existing Versions: 0

📦 Processing batch: 1 to 50
📄 Processing plan: "My Garden" (Year: 2024)
  ✨ Created garden: "My Garden" (ID: 507f...)
  ✓ Created Version (ID: 507f...)
  ✓ Created SeasonPlan (ID: 507f...)

✅ Migration completed!
⏱️  Duration: 12.5s

📊 Migration statistics:
  Plans processed: 150
  Gardens created: 45
  Gardens reused: 105
  SeasonPlans created: 150
  Versions created: 150
  Errors: 0
```

---

## 🛡️ Safety Mechanisms

### 1. Idempotency

```javascript
// Checks before creating
if (await seasonPlanExists(gardenId, year)) {
  // Skip - already migrated
}
```

### 2. Transactions

```javascript
await session.withTransaction(async () => {
  // All operations atomic
  // Auto-rollback on error
});
```

### 3. Caching

```javascript
const gardenCache = new Map();
// Reuses gardens within same run
// Prevents duplicate queries
```

### 4. Batch Processing

```javascript
const BATCH_SIZE = 50;
// Processes in chunks
// Prevents memory overflow
```

---

## 🔧 Configuration Options

### Environment Variables

```bash
DRY_RUN=true     # Test without making changes
```

### Script Constants

```javascript
const DRY_RUN = process.env.DRY_RUN === "true";
const BATCH_SIZE = 50; // Adjust for large documents
```

---

## 🎓 Technical Details

### Models Use:

- Mongoose schemas with proper types
- Compound indexes for performance
- Unique constraints on `seasonPlans` (gardenId + year)
- Referential integrity via ObjectIds

### Migration Uses:

- MongoDB transactions (requires replica set)
- Async/await for clean error handling
- Batch processing for memory efficiency
- Color-coded logging for readability

### Indexes Created:

```javascript
// Gardens
{ "members.userId": 1 }
{ title: 1, "members.userId": 1 }

// SeasonPlans
{ gardenId: 1, year: 1 } // unique

// Versions
{ seasonPlanId: 1, createdAt: -1 }
```

---

## ⚠️ Prerequisites

1. **MongoDB Connection**
   - Working MONGO_URI in `.env`
   - MongoDB Atlas or local replica set
   - Connection string with `?retryWrites=true`

2. **Node.js Environment**
   - Node.js installed
   - Dependencies installed (`npm install`)
   - dotenv configured

3. **Data Requirements**
   - Existing `plans` collection with data
   - userId field populated in plans
   - name field populated in plans

---

## 🚨 Common Issues

### Issue: "Transaction failed"

**Solution:** MongoDB needs to be a replica set. Use MongoDB Atlas or configure local replica set.

### Issue: "Duplicate key error"

**Solution:** Run migration again - it will skip existing documents.

### Issue: Memory error

**Solution:** Reduce BATCH_SIZE in script.

---

## ✨ Next Steps

After successful migration:

1. **Test the Migration**

   ```bash
   node scripts/verify-migration.js
   ```

2. **Update API Controllers**
   - Modify to use new Garden/SeasonPlan/Version models
   - Update query logic for new structure

3. **Update Frontend**
   - Adjust API calls if endpoints change
   - Test all CRUD operations

4. **Monitor Performance**
   - Check query performance with new structure
   - Verify indexes are being used

5. **Backup & Archive**
   - Export old `plans` collection
   - Keep as backup for 30+ days
   - Eventually drop after 100% confidence

---

## 📞 Support

For questions or issues:

1. Check `MIGRATION_GUIDE.md` for detailed documentation
2. Review migration logs for error details
3. Run verification script for diagnostics
4. Test with DRY_RUN first

---

**Status:** ✅ Ready to run
**Risk Level:** 🟢 Low (non-destructive, idempotent, transactional)
**Estimated Time:** ~1-5 seconds per 50 plans
