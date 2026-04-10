# Database Migration - Index

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Start here! Quick commands and overview
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Complete guide with troubleshooting
- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Technical details and architecture

## 🛠️ Scripts

- **[migrate-to-normalized-structure.js](./migrate-to-normalized-structure.js)** - Main migration script
- **[verify-migration.js](./verify-migration.js)** - Validation and integrity checks
- **[rollback-migration.js](./rollback-migration.js)** - Emergency rollback (if needed)

## 📦 Models

Located in `../models/`:

- **[Garden.js](../models/Garden.js)** - Multi-user garden entity
- **[SeasonPlan.js](../models/SeasonPlan.js)** - Yearly plans with layouts
- **[Version.js](../models/Version.js)** - Version history for plantings

## 🚀 Quick Commands

```bash
# Test without making changes
DRY_RUN=true node scripts/migrate-to-normalized-structure.js

# Run the migration
node scripts/migrate-to-normalized-structure.js

# Verify results
node scripts/verify-migration.js

# Rollback (if needed)
node scripts/rollback-migration.js
```

## 📊 Migration Flow

```
Old Plan Collection
        ↓
   [Migration]
        ↓
    ┌───────────────────┐
    │                   │
    ↓                   ↓
Gardens          SeasonPlans
    ↓                   ↓
    └─────→ Versions ←──┘
```

## ⚡ What to Read Based on Your Need

### "I just want to run it"

→ Read [QUICK_START.md](./QUICK_START.md)

### "I want to understand the details"

→ Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### "I need technical specs"

→ Read [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)

### "Something went wrong"

→ Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) → Troubleshooting section

### "I need to rollback"

→ Run `node scripts/rollback-migration.js`

## ✅ Safety Checklist

Before running:

- [ ] MongoDB connection working
- [ ] `.env` file configured
- [ ] Backup of database (optional but recommended)
- [ ] Read QUICK_START.md
- [ ] Run in DRY_RUN mode first

After running:

- [ ] Run verify-migration.js
- [ ] Check all tests pass
- [ ] Test application functionality
- [ ] Monitor for any issues

## 📞 Need Help?

1. Check the documentation files above
2. Review migration logs for errors
3. Run verification script for diagnostics
4. Check server/models for model definitions

---

**Created:** March 3, 2026
**Status:** Ready for use
**Version:** 1.0
