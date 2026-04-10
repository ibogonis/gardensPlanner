#!/usr/bin/env node

/**
 * Migration Script: Move Layout from SeasonPlan to Version
 *
 * Implements full snapshot versioning by moving the layout field
 * from SeasonPlan documents into their corresponding Version documents.
 *
 * BEFORE:
 *   SeasonPlan { layout, currentVersionId }
 *   Version { plantings }
 *
 * AFTER:
 *   SeasonPlan { currentVersionId }
 *   Version { layout, plantings }
 *
 * Usage:
 *   node scripts/migrate-layout-to-version.js
 *
 * Safety Features:
 *   - Idempotent: can be run multiple times
 *   - Transactional: atomic operations
 *   - Non-destructive: validates before removing
 *   - Detailed logging for audit trail
 */

require("dotenv").config();
const mongoose = require("mongoose");

// Import models (with NEW schemas)
const SeasonPlan = require("../models/SeasonPlan");
const Version = require("../models/Version");

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRY_RUN = process.env.DRY_RUN === "true";
const BATCH_SIZE = 50;

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const colorMap = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    WARNING: colors.yellow,
    ERROR: colors.red,
    DEBUG: colors.cyan,
  };

  const color = colorMap[level] || colors.reset;
  console.log(`${color}[${timestamp}] ${level}:${colors.reset} ${message}`);

  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// ============================================================================
// MIGRATION STATISTICS
// ============================================================================

const stats = {
  seasonPlansProcessed: 0,
  layoutsMoved: 0,
  layoutsAlreadyInVersion: 0,
  layoutsNotFound: 0,
  layoutsRemoved: 0,
  errors: 0,
};

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migrate a single SeasonPlan: move layout to its Version
 */
async function migrateSeasonPlan(seasonPlan, session) {
  const { _id: seasonPlanId, currentVersionId, gardenId, year } = seasonPlan;

  log(
    "INFO",
    `📄 Processing SeasonPlan ${seasonPlanId} (Garden: ${gardenId}, Year: ${year})`,
  );

  // Step 1: Check if SeasonPlan has layout field
  // Note: After schema update, mongoose won't return layout by default
  // We need to fetch raw document to check if layout exists
  const rawSeasonPlan = await mongoose.connection.db
    .collection("seasonplans")
    .findOne({ _id: seasonPlanId }, { session });

  if (!rawSeasonPlan || !rawSeasonPlan.layout) {
    log(
      "DEBUG",
      `  ⏭️  SeasonPlan ${seasonPlanId} has no layout field. Skipping.`,
    );
    stats.layoutsNotFound++;
    return;
  }

  const layout = rawSeasonPlan.layout;
  log("DEBUG", `  📦 Found layout with ${Object.keys(layout).length} keys`);

  // Step 2: Check if currentVersionId exists
  if (!currentVersionId) {
    log(
      "WARNING",
      `  ⚠️  SeasonPlan ${seasonPlanId} has no currentVersionId. Cannot migrate layout.`,
    );
    stats.errors++;
    return;
  }

  // Step 3: Get the current Version
  const version = await Version.findById(currentVersionId).session(session);

  if (!version) {
    log(
      "ERROR",
      `  ❌ Version ${currentVersionId} not found for SeasonPlan ${seasonPlanId}`,
    );
    stats.errors++;
    return;
  }

  // Step 4: Check if Version already has layout (idempotency)
  if (version.layout && Object.keys(version.layout).length > 0) {
    log(
      "WARNING",
      `  ⏭️  Version ${currentVersionId} already has layout. Skipping transfer.`,
    );
    stats.layoutsAlreadyInVersion++;

    // Still need to remove layout from SeasonPlan if it exists
    if (DRY_RUN) {
      log(
        "INFO",
        `  [DRY RUN] Would remove layout from SeasonPlan ${seasonPlanId}`,
      );
    } else {
      await mongoose.connection.db
        .collection("seasonplans")
        .updateOne(
          { _id: seasonPlanId },
          { $unset: { layout: "" } },
          { session },
        );
      log("SUCCESS", `  ✓ Removed layout from SeasonPlan ${seasonPlanId}`);
      stats.layoutsRemoved++;
    }
    return;
  }

  // Step 5: Transfer layout to Version
  if (DRY_RUN) {
    log("INFO", `  [DRY RUN] Would move layout to Version ${currentVersionId}`);
    log(
      "INFO",
      `  [DRY RUN] Would remove layout from SeasonPlan ${seasonPlanId}`,
    );
    stats.layoutsMoved++;
    return;
  }

  // Update Version with layout
  version.layout = layout;
  await version.save({ session });
  log("SUCCESS", `  ✓ Moved layout to Version ${currentVersionId}`);
  stats.layoutsMoved++;

  // Step 6: Remove layout from SeasonPlan
  // Use raw MongoDB operation to remove field that's not in schema
  await mongoose.connection.db
    .collection("seasonplans")
    .updateOne({ _id: seasonPlanId }, { $unset: { layout: "" } }, { session });

  log("SUCCESS", `  ✓ Removed layout from SeasonPlan ${seasonPlanId}`);
  stats.layoutsRemoved++;

  // Step 7: Verify the migration
  const updatedVersion =
    await Version.findById(currentVersionId).session(session);
  const updatedSeasonPlan = await mongoose.connection.db
    .collection("seasonplans")
    .findOne({ _id: seasonPlanId }, { session });

  if (
    updatedVersion.layout &&
    Object.keys(updatedVersion.layout).length > 0 &&
    !updatedSeasonPlan.layout
  ) {
    log(
      "DEBUG",
      `  ✓ Verified: Layout successfully migrated to Version ${currentVersionId}`,
    );
  } else {
    log("ERROR", `  ❌ Verification failed for SeasonPlan ${seasonPlanId}`);
    stats.errors++;
  }
}

/**
 * Process SeasonPlans in batches
 */
async function migrateInBatches() {
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch SeasonPlans using raw query to include layout field
    const seasonPlanIds = await mongoose.connection.db
      .collection("seasonplans")
      .find({})
      .project({ _id: 1 })
      .skip(skip)
      .limit(BATCH_SIZE)
      .toArray();

    if (seasonPlanIds.length === 0) {
      hasMore = false;
      break;
    }

    log(
      "INFO",
      `\n📦 Processing batch: ${skip + 1} to ${skip + seasonPlanIds.length}`,
    );

    // Process each SeasonPlan in its own transaction
    for (const { _id } of seasonPlanIds) {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          // Fetch full SeasonPlan document
          const seasonPlan = await SeasonPlan.findById(_id).session(session);

          if (!seasonPlan) {
            log("WARNING", `  ⚠️  SeasonPlan ${_id} not found. Skipping.`);
            return;
          }

          await migrateSeasonPlan(seasonPlan, session);
          stats.seasonPlansProcessed++;
        });
      } catch (error) {
        log("ERROR", `Failed to migrate SeasonPlan ${_id}:`, error.message);
        stats.errors++;
      } finally {
        await session.endSession();
      }
    }

    skip += BATCH_SIZE;
  }
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function runMigration() {
  log("INFO", "🚀 Starting migration: Move Layout to Version");
  log(
    "INFO",
    `Mode: ${DRY_RUN ? "DRY RUN (no changes will be made)" : "LIVE"}`,
  );
  log("INFO", "════════════════════════════════════════════════════════");

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    log("SUCCESS", "✓ Connected to MongoDB");

    // Count existing documents
    const seasonPlanCount = await mongoose.connection.db
      .collection("seasonplans")
      .countDocuments();
    const versionCount = await Version.countDocuments();

    // Count SeasonPlans with layout field
    const seasonPlansWithLayout = await mongoose.connection.db
      .collection("seasonplans")
      .countDocuments({ layout: { $exists: true } });

    log("INFO", "\n📊 Pre-migration counts:");
    log("INFO", `  SeasonPlans: ${seasonPlanCount}`);
    log("INFO", `  SeasonPlans with layout: ${seasonPlansWithLayout}`);
    log("INFO", `  Versions: ${versionCount}`);
    log("INFO", "════════════════════════════════════════════════════════\n");

    if (seasonPlanCount === 0) {
      log("WARNING", "⚠️  No SeasonPlans found. Exiting.");
      return;
    }

    if (seasonPlansWithLayout === 0) {
      log("SUCCESS", "✅ All layouts already migrated. Nothing to do.");
      return;
    }

    // Run migration
    const startTime = Date.now();
    await migrateInBatches();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Final statistics
    log("INFO", "\n════════════════════════════════════════════════════════");
    log("SUCCESS", "✅ Migration completed!");
    log("INFO", `⏱️  Duration: ${duration}s`);
    log("INFO", "\n📊 Migration statistics:");
    log("INFO", `  SeasonPlans processed: ${stats.seasonPlansProcessed}`);
    log("INFO", `  Layouts moved to Version: ${stats.layoutsMoved}`);
    log(
      "INFO",
      `  Layouts already in Version: ${stats.layoutsAlreadyInVersion}`,
    );
    log("INFO", `  Layouts not found: ${stats.layoutsNotFound}`);
    log("INFO", `  Layouts removed from SeasonPlan: ${stats.layoutsRemoved}`);
    log("INFO", `  Errors: ${stats.errors}`);
    log("INFO", "════════════════════════════════════════════════════════");

    if (stats.errors > 0) {
      log(
        "WARNING",
        "⚠️  Some SeasonPlans failed to migrate. Check logs above.",
      );
      process.exit(1);
    }

    // Verify final state
    const remainingWithLayout = await mongoose.connection.db
      .collection("seasonplans")
      .countDocuments({ layout: { $exists: true } });

    if (remainingWithLayout > 0) {
      log(
        "WARNING",
        `⚠️  ${remainingWithLayout} SeasonPlans still have layout field.`,
      );
    } else {
      log("SUCCESS", "✅ All layouts successfully moved to Versions.");
    }
  } catch (error) {
    log("ERROR", "💥 Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    log("INFO", "🔌 Disconnected from MongoDB");
  }
}

// ============================================================================
// SCRIPT ENTRY POINT
// ============================================================================

if (require.main === module) {
  runMigration()
    .then(() => {
      log("SUCCESS", "🎉 All done!");
      process.exit(0);
    })
    .catch((error) => {
      log("ERROR", "Fatal error:", error.message);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runMigration };
