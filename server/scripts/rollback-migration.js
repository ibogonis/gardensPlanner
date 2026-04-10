#!/usr/bin/env node

/**
 * Rollback Script: Remove migrated data
 *
 * ⚠️  WARNING: This script DELETES data from the new collections.
 * Only use this if the migration failed and you need to start over.
 *
 * This script does NOT restore old Plan documents (they were never deleted).
 *
 * Usage:
 *   node scripts/rollback-migration.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const readline = require("readline");

const Garden = require("../models/Garden");
const SeasonPlan = require("../models/SeasonPlan");
const Version = require("../models/Version");

// ============================================================================
// LOGGING
// ============================================================================

function log(level, message) {
  const colors = {
    INFO: "\x1b[34m",
    WARNING: "\x1b[33m",
    ERROR: "\x1b[31m",
    SUCCESS: "\x1b[32m",
    reset: "\x1b[0m",
  };
  const color = colors[level] || colors.reset;
  console.log(`${color}[${level}]${colors.reset} ${message}`);
}

// ============================================================================
// CONFIRMATION PROMPT
// ============================================================================

async function confirmRollback() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "\n⚠️  WARNING: This will DELETE all Gardens, SeasonPlans, and Versions.\n" +
        "The old Plan collection will remain intact.\n\n" +
        "Are you sure you want to continue? (yes/no): ",
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === "yes");
      },
    );
  });
}

// ============================================================================
// ROLLBACK FUNCTION
// ============================================================================

async function rollback() {
  log("WARNING", "🔄 Starting rollback process...");

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    log("SUCCESS", "✓ Connected to MongoDB");

    // Count documents before deletion
    const gardenCount = await Garden.countDocuments();
    const seasonPlanCount = await SeasonPlan.countDocuments();
    const versionCount = await Version.countDocuments();

    log("INFO", "\n📊 Documents to be deleted:");
    log("INFO", `  Gardens: ${gardenCount}`);
    log("INFO", `  SeasonPlans: ${seasonPlanCount}`);
    log("INFO", `  Versions: ${versionCount}`);

    // Ask for confirmation
    const confirmed = await confirmRollback();

    if (!confirmed) {
      log("INFO", "❌ Rollback cancelled by user.");
      return;
    }

    log("INFO", "\n🗑️  Deleting documents...");

    // Delete in reverse dependency order
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Version.deleteMany({}, { session });
      log("SUCCESS", `✓ Deleted ${versionCount} Versions`);

      await SeasonPlan.deleteMany({}, { session });
      log("SUCCESS", `✓ Deleted ${seasonPlanCount} SeasonPlans`);

      await Garden.deleteMany({}, { session });
      log("SUCCESS", `✓ Deleted ${gardenCount} Gardens`);
    });
    await session.endSession();

    log("SUCCESS", "\n✅ Rollback completed successfully!");
    log("INFO", "Your old Plan collection remains intact.");
    log("INFO", "You can now re-run the migration if needed.");
  } catch (error) {
    log("ERROR", "💥 Rollback failed:");
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
  rollback()
    .then(() => process.exit(0))
    .catch((error) => {
      log("ERROR", "Fatal error:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = { rollback };
