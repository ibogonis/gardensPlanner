# Database Migration - Quick Reference

## 🚀 Quick Start

### Step 1: Dry Run (Test)

```bash
cd server
DRY_RUN=true node scripts/migrate-to-normalized-structure.js
```

✅ Safe - no changes made

### Step 2: Run Migration

```bash
node scripts/migrate-to-normalized-structure.js
```

⚠️ This creates new collections

### Step 3: Verify

```bash
node scripts/verify-migration.js
```

✅ Validates migration success

### Step 4 (Optional): Rollback

```bash
node scripts/rollback-migration.js
```

⚠️ Only if needed - deletes new data

---

## 📁 Files Created

### Models

- `models/Garden.js` - Garden entity (multi-user support)
- `models/SeasonPlan.js` - Yearly garden plans
- `models/Version.js` - Version history for plantings

### Scripts

- `scripts/migrate-to-normalized-structure.js` - Main migration
- `scripts/verify-migration.js` - Validation checks
- `scripts/rollback-migration.js` - Emergency rollback
- `scripts/MIGRATION_GUIDE.md` - Detailed documentation
- `scripts/QUICK_START.md` - This file

---

## 🔍 What Gets Created?

**From this Plan:**

```javascript
{
  userId: "user123",
  name: "My Backyard",
  year: 2024,
  layout: { shapes: {...} },
  plantings: { bed1: "Tomatoes" }
}
```

**Creates:**

1. **Garden** (once per userId+name)

```javascript
{
  title: "My Backyard",
  members: [{ userId: "user123", role: "owner" }]
}
```

2. **SeasonPlan** (once per garden+year)

```javascript
{
  gardenId: <Garden._id>,
  year: 2024,
  layout: { shapes: {...} },
  currentVersionId: <Version._id>
}
```

3. **Version** (once per SeasonPlan)

```javascript
{
  seasonPlanId: <SeasonPlan._id>,
  plantings: { bed1: "Tomatoes" },
  type: "migration"
}
```

---

## ✅ Safety Features

- ✅ **Idempotent** - Run multiple times safely
- ✅ **Non-destructive** - Old Plans remain
- ✅ **Transactional** - Atomic operations
- ✅ **Logged** - Full audit trail

---

## 🎯 Expected Results

If you have 100 plans for 30 different gardens:

```
Plans processed: 100
Gardens created: 30      ← Grouped by userId+name
Gardens reused: 70       ← Same garden, different years
SeasonPlans created: 100 ← One per plan
Versions created: 100    ← One per season plan
```

---

## 🆘 Troubleshooting

### "No plans found"

- Check MongoDB connection
- Verify `plans` collection has data

### "Transaction failed"

- Requires MongoDB replica set
- Use MongoDB Atlas or local replica set
- Add `?retryWrites=true` to connection string

### "Duplicate key error"

- Run migration again - it will skip existing
- Check indexes: `db.seasonPlans.getIndexes()`

### Memory issues

- Edit `BATCH_SIZE` in script (default: 50)
- Reduce for large documents

---

## 📊 Verification Checks

The verify script checks:

- ✅ Document counts match
- ✅ All relationships valid
- ✅ No orphaned documents
- ✅ No duplicate (garden, year) pairs
- ✅ All gardens have owners
- ✅ Sample data integrity

---

## 🔄 Running Again

Safe to run multiple times:

- Reuses existing gardens
- Skips existing season plans
- Logs what was skipped

---

## 📞 Need Help?

1. Read `MIGRATION_GUIDE.md` for details
2. Check migration logs
3. Run verification script
4. Review error messages

---

## ⏭️ Next Steps After Migration

1. ✅ Verify with verification script
2. 🧪 Test application thoroughly
3. 🔄 Update API endpoints to use new models
4. 🎨 Update frontend if needed
5. 🗄️ Backup old `plans` collection
6. 🧹 Eventually drop old collection (after 100% confidence)

---

**Pro tip:** Always run DRY_RUN first! 🚀
