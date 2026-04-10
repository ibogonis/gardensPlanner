#!/usr/bin/env node

/**
 * Quick verification script for layout migration
 */

require("dotenv").config();
const mongoose = require("mongoose");

async function verify() {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("\n📊 Verification Results:");
  console.log("═".repeat(50));

  // Check SeasonPlans
  const seasonPlansWithLayout = await mongoose.connection.db
    .collection("seasonplans")
    .countDocuments({ layout: { $exists: true } });

  console.log(
    `✅ SeasonPlans with layout field: ${seasonPlansWithLayout} (should be 0)`,
  );

  // Check Versions
  const versionsWithoutLayout = await mongoose.connection.db
    .collection("versions")
    .countDocuments({ layout: { $exists: false } });

  console.log(
    `✅ Versions without layout field: ${versionsWithoutLayout} (should be 0)`,
  );

  // Sample data
  const seasonPlan = await mongoose.connection.db
    .collection("seasonplans")
    .findOne({});

  if (seasonPlan) {
    console.log(`\n📄 Sample SeasonPlan ${seasonPlan._id}:`);
    console.log(`   - Has layout field: ${!!seasonPlan.layout}`);
    console.log(
      `   - currentVersionId: ${seasonPlan.currentVersionId || "null"}`,
    );

    if (seasonPlan.currentVersionId) {
      const version = await mongoose.connection.db
        .collection("versions")
        .findOne({ _id: seasonPlan.currentVersionId });

      if (version) {
        console.log(`\n📦 Corresponding Version ${version._id}:`);
        console.log(`   - Has layout: ${!!version.layout}`);
        console.log(
          `   - Layout keys: ${version.layout ? Object.keys(version.layout).length : 0}`,
        );
        console.log(`   - Has plantings: ${!!version.plantings}`);
        console.log(
          `   - Plantings keys: ${version.plantings ? Object.keys(version.plantings).length : 0}`,
        );
      }
    }
  }

  console.log("\n" + "═".repeat(50));
  console.log(
    seasonPlansWithLayout === 0 && versionsWithoutLayout === 0
      ? "✅ Migration successful!"
      : "❌ Migration incomplete",
  );

  await mongoose.connection.close();
}

verify().catch(console.error);
