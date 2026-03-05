#!/usr/bin/env node

/**
 * Migration Script: Plan → Garden/SeasonPlan/Version
 *
 * Transforms the single-document-per-year structure into normalized collections.
 *
 * Usage:
 *   node scripts/migrate-to-normalized-structure.js
 *
 * Requirements:
 *   - MongoDB connection must be available
 *   - Models: Garden, SeasonPlan, Version must exist
 *   - Old Plan collection must exist with data
 *
 * Safety:
 *   - Idempotent: can be run multiple times
 *   - Does NOT delete old Plan documents
 *   - Uses transactions for data consistency
 *   - Logs all operations for audit trail
 */

require("dotenv").config();
const mongoose = require("mongoose");

// Import models
const Plan = require("../models/Plan");
const Garden = require("../models/Garden");
const SeasonPlan = require("../models/SeasonPlan");
const Version = require("../models/Version");

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRY_RUN = process.env.DRY_RUN === "true"; // Set to true to simulate without writing
const BATCH_SIZE = 50; // Process plans in batches for memory efficiency

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
  oldPlansFound: 0,
  gardensCreated: 0,
  gardensReused: 0,
  seasonPlansCreated: 0,
  seasonPlansSkipped: 0,
  versionsCreated: 0,
  errors: 0,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find or create a Garden for a given userId and garden name.
 * Uses a map cache to avoid redundant DB queries within the same migration run.
 */
const gardenCache = new Map(); // Key: "userId:name" → Value: Garden._id

async function findOrCreateGarden(userId, gardenName, createdAt, session) {
  const cacheKey = `${userId}:${gardenName}`;

  // Check in-memory cache first
  if (gardenCache.has(cacheKey)) {
    stats.gardensReused++;
    return gardenCache.get(cacheKey);
  }

  // Check database
  let garden = await Garden.findOne({
    title: gardenName,
    "members.userId": userId,
  }).session(session);

  if (garden) {
    log(
      "DEBUG",
      `♻️  Reusing existing garden: "${gardenName}" for user ${userId}`,
    );
    stats.gardensReused++;
    gardenCache.set(cacheKey, garden._id);
    return garden._id;
  }

  // Create new garden
  if (DRY_RUN) {
    log(
      "INFO",
      `[DRY RUN] Would create garden: "${gardenName}" for user ${userId}`,
    );
    const mockId = new mongoose.Types.ObjectId();
    gardenCache.set(cacheKey, mockId);
    stats.gardensCreated++;
    return mockId;
  }

  garden = new Garden({
    title: gardenName,
    members: [
      {
        userId: new mongoose.Types.ObjectId(userId),
        role: "owner",
      },
    ],
    createdAt: createdAt, // Preserve original timestamp
  });

  await garden.save({ session });

  log("SUCCESS", `✨ Created garden: "${gardenName}" (ID: ${garden._id})`);
  stats.gardensCreated++;
  gardenCache.set(cacheKey, garden._id);

  return garden._id;
}

/**
 * Check if a SeasonPlan already exists for this garden and year.
 */
async function seasonPlanExists(gardenId, year, session) {
  const existing = await SeasonPlan.findOne({
    gardenId: gardenId,
    year: year,
  }).session(session);

  return !!existing;
}

/**
 * Migrate a single Plan document to the new structure.
 */
async function migratePlan(plan, session) {
  const { userId, name, year, layout, plantings, createdAt } = plan;

  log("INFO", `📄 Processing plan: "${name}" (Year: ${year}, User: ${userId})`);

  // Step 1: Find or create Garden
  const gardenId = await findOrCreateGarden(userId, name, createdAt, session);

  // Step 2: Check if SeasonPlan already exists (idempotency)
  if (await seasonPlanExists(gardenId, year, session)) {
    log(
      "WARNING",
      `⏭️  SeasonPlan already exists for garden ${gardenId}, year ${year}. Skipping.`,
    );
    stats.seasonPlansSkipped++;
    return;
  }

  // Step 3: Create SeasonPlan first (without currentVersionId or layout)
  if (DRY_RUN) {
    log(
      "INFO",
      `[DRY RUN] Would create SeasonPlan for garden ${gardenId}, year ${year}`,
    );
    log(
      "INFO",
      `[DRY RUN] Would create Version with layout and plantings for plan ${plan._id}`,
    );
    stats.versionsCreated++;
    stats.seasonPlansCreated++;
    return;
  }

  const seasonPlan = new SeasonPlan({
    gardenId: gardenId,
    year: year,
    // Note: layout no longer stored here - will be in Version for full snapshot
    createdAt: createdAt, // Preserve original timestamp
  });

  await seasonPlan.save({ session });
  log("SUCCESS", `  ✓ Created SeasonPlan (ID: ${seasonPlan._id})`);
  stats.seasonPlansCreated++;

  // Step 4: Create Version with FULL snapshot (layout + plantings)
  const version = new Version({
    seasonPlanId: seasonPlan._id,
    layout: layout || {}, // Full snapshot: layout stored here
    plantings: plantings || {}, // Full snapshot: plantings stored here
    comment: "Initial migration from legacy Plan collection",
    type: "migration",
    createdAt: createdAt, // Preserve original timestamp
  });

  await version.save({ session });
  log("SUCCESS", `  ✓ Created Version (ID: ${version._id})`);
  stats.versionsCreated++;

  // Step 5: Update SeasonPlan with currentVersionId
  seasonPlan.currentVersionId = version._id;
  await seasonPlan.save({ session });
  log(
    "DEBUG",
    `  ✓ Linked SeasonPlan ${seasonPlan._id} → Version ${version._id}`,
  );
}

/**
 * Process plans in batches to avoid memory issues with large datasets.
 */
async function migratePlansInBatches() {
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const plans = await Plan.find({})
      .sort({ createdAt: 1 }) // Process oldest first
      .skip(skip)
      .limit(BATCH_SIZE)
      .lean(); // Use lean for better performance

    if (plans.length === 0) {
      hasMore = false;
      break;
    }

    log("INFO", `\n📦 Processing batch: ${skip + 1} to ${skip + plans.length}`);

    // Process each plan in a transaction
    for (const plan of plans) {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          await migratePlan(plan, session);
        });
      } catch (error) {
        log("ERROR", `Failed to migrate plan ${plan._id}:`, error.message);
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
  log("INFO", "🚀 Starting migration: Plan → Garden/SeasonPlan/Version");
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
    const oldPlanCount = await Plan.countDocuments();
    stats.oldPlansFound = oldPlanCount;

    const existingGardens = await Garden.countDocuments();
    const existingSeasonPlans = await SeasonPlan.countDocuments();
    const existingVersions = await Version.countDocuments();

    log("INFO", "\n📊 Pre-migration counts:");
    log("INFO", `  Old Plans: ${oldPlanCount}`);
    log("INFO", `  Existing Gardens: ${existingGardens}`);
    log("INFO", `  Existing SeasonPlans: ${existingSeasonPlans}`);
    log("INFO", `  Existing Versions: ${existingVersions}`);
    log("INFO", "════════════════════════════════════════════════════════\n");

    if (oldPlanCount === 0) {
      log("WARNING", "⚠️  No plans found to migrate. Exiting.");
      return;
    }

    // Run migration in batches
    const startTime = Date.now();
    await migratePlansInBatches();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Final statistics
    log("INFO", "\n════════════════════════════════════════════════════════");
    log("SUCCESS", "✅ Migration completed!");
    log("INFO", `⏱️  Duration: ${duration}s`);
    log("INFO", "\n📊 Migration statistics:");
    log("INFO", `  Plans processed: ${stats.oldPlansFound}`);
    log("INFO", `  Gardens created: ${stats.gardensCreated}`);
    log("INFO", `  Gardens reused: ${stats.gardensReused}`);
    log("INFO", `  SeasonPlans created: ${stats.seasonPlansCreated}`);
    log("INFO", `  SeasonPlans skipped: ${stats.seasonPlansSkipped}`);
    log("INFO", `  Versions created: ${stats.versionsCreated}`);
    log("INFO", `  Errors: ${stats.errors}`);
    log("INFO", "════════════════════════════════════════════════════════");

    if (stats.errors > 0) {
      log("WARNING", "⚠️  Some plans failed to migrate. Check logs above.");
      process.exit(1);
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
