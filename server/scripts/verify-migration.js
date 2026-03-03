#!/usr/bin/env node

/**
 * Verification Script: Check migration results
 *
 * Validates that the migration completed successfully by checking:
 * - Document counts match expectations
 * - Relationships are properly linked
 * - No orphaned documents
 * - Data integrity
 *
 * Usage:
 *   node scripts/verify-migration.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Plan = require("../models/Plan");
const Garden = require("../models/Garden");
const SeasonPlan = require("../models/SeasonPlan");
const Version = require("../models/Version");

// ============================================================================
// VERIFICATION TESTS
// ============================================================================

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function test(name, condition, message) {
  if (condition) {
    console.log(`✅ ${name}`);
    results.passed++;
  } else {
    console.log(`❌ ${name}: ${message}`);
    results.failed++;
  }
}

function warning(message) {
  console.log(`⚠️  ${message}`);
  results.warnings++;
}

async function runVerification() {
  console.log("🔍 Starting migration verification...\n");

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // ========================================================================
    // COUNT CHECKS
    // ========================================================================
    console.log("📊 Document Counts:");
    console.log("═".repeat(50));

    const planCount = await Plan.countDocuments();
    const gardenCount = await Garden.countDocuments();
    const seasonPlanCount = await SeasonPlan.countDocuments();
    const versionCount = await Version.countDocuments();

    console.log(`Plans (old):      ${planCount}`);
    console.log(`Gardens:          ${gardenCount}`);
    console.log(`SeasonPlans:      ${seasonPlanCount}`);
    console.log(`Versions:         ${versionCount}\n`);

    test(
      "SeasonPlans match Plans",
      seasonPlanCount === planCount,
      `Expected ${planCount} SeasonPlans, got ${seasonPlanCount}`,
    );

    test(
      "Versions match SeasonPlans",
      versionCount === seasonPlanCount,
      `Expected ${seasonPlanCount} Versions, got ${versionCount}`,
    );

    test("Gardens exist", gardenCount > 0, "No gardens were created");

    // ========================================================================
    // RELATIONSHIP CHECKS
    // ========================================================================
    console.log("\n🔗 Relationship Integrity:");
    console.log("═".repeat(50));

    // Check: All SeasonPlans have valid Gardens
    const orphanedSeasonPlans = await SeasonPlan.countDocuments({
      gardenId: { $nin: await Garden.distinct("_id") },
    });
    test(
      "All SeasonPlans link to valid Gardens",
      orphanedSeasonPlans === 0,
      `Found ${orphanedSeasonPlans} orphaned SeasonPlans`,
    );

    // Check: All Versions have valid SeasonPlans
    const orphanedVersions = await Version.countDocuments({
      seasonPlanId: { $nin: await SeasonPlan.distinct("_id") },
    });
    test(
      "All Versions link to valid SeasonPlans",
      orphanedVersions === 0,
      `Found ${orphanedVersions} orphaned Versions`,
    );

    // Check: All SeasonPlans have currentVersionId set
    const missingCurrentVersion = await SeasonPlan.countDocuments({
      currentVersionId: { $exists: false },
    });
    test(
      "All SeasonPlans have currentVersionId",
      missingCurrentVersion === 0,
      `Found ${missingCurrentVersion} SeasonPlans without currentVersionId`,
    );

    // Check: All currentVersionIds are valid
    const invalidCurrentVersions = await SeasonPlan.countDocuments({
      currentVersionId: { $nin: await Version.distinct("_id") },
    });
    test(
      "All currentVersionIds are valid",
      invalidCurrentVersions === 0,
      `Found ${invalidCurrentVersions} SeasonPlans with invalid currentVersionId`,
    );

    // ========================================================================
    // DATA INTEGRITY CHECKS
    // ========================================================================
    console.log("\n🛡️  Data Integrity:");
    console.log("═".repeat(50));

    // Check: No duplicate (gardenId, year) combinations
    const seasonPlanGroups = await SeasonPlan.aggregate([
      {
        $group: {
          _id: { gardenId: "$gardenId", year: "$year" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);
    test(
      "No duplicate (garden, year) combinations",
      seasonPlanGroups.length === 0,
      `Found ${seasonPlanGroups.length} duplicate combinations`,
    );

    // Check: All Gardens have at least one member
    const gardensWithoutMembers = await Garden.countDocuments({
      $or: [{ members: { $exists: false } }, { members: { $size: 0 } }],
    });
    test(
      "All Gardens have members",
      gardensWithoutMembers === 0,
      `Found ${gardensWithoutMembers} Gardens without members`,
    );

    // Check: All Gardens have at least one owner
    const gardensWithoutOwner = await Garden.countDocuments({
      "members.role": { $ne: "owner" },
    });
    test(
      "All Gardens have an owner",
      gardensWithoutOwner === 0,
      `Found ${gardensWithoutOwner} Gardens without an owner`,
    );

    // ========================================================================
    // SAMPLE DATA CHECK
    // ========================================================================
    console.log("\n🔬 Sample Data Validation:");
    console.log("═".repeat(50));

    const samplePlan = await Plan.findOne();
    if (samplePlan) {
      console.log(
        `\nChecking sample plan: ${samplePlan.name} (${samplePlan.year})`,
      );

      // Find corresponding Garden
      const garden = await Garden.findOne({
        title: samplePlan.name,
        "members.userId": samplePlan.userId,
      });

      if (garden) {
        console.log(`  ✓ Found Garden: ${garden.title} (${garden._id})`);

        // Find corresponding SeasonPlan
        const seasonPlan = await SeasonPlan.findOne({
          gardenId: garden._id,
          year: samplePlan.year,
        });

        if (seasonPlan) {
          console.log(
            `  ✓ Found SeasonPlan: Year ${seasonPlan.year} (${seasonPlan._id})`,
          );

          // Find corresponding Version
          const version = await Version.findById(seasonPlan.currentVersionId);

          if (version) {
            console.log(`  ✓ Found Version: ${version._id}`);

            // Verify data was copied correctly
            const layoutMatch =
              JSON.stringify(seasonPlan.layout) ===
              JSON.stringify(samplePlan.layout);
            const plantingsMatch =
              JSON.stringify(version.plantings) ===
              JSON.stringify(samplePlan.plantings);

            test(
              "Sample: Layout data matches",
              layoutMatch,
              "Layout data doesn't match",
            );
            test(
              "Sample: Plantings data matches",
              plantingsMatch,
              "Plantings data doesn't match",
            );
          } else {
            warning("Sample: Version not found");
          }
        } else {
          warning("Sample: SeasonPlan not found");
        }
      } else {
        warning("Sample: Garden not found");
      }
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("\n" + "═".repeat(50));
    console.log("📋 Verification Summary:");
    console.log("═".repeat(50));
    console.log(`✅ Passed:   ${results.passed}`);
    console.log(`❌ Failed:   ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);

    if (results.failed === 0 && results.warnings === 0) {
      console.log("\n🎉 All checks passed! Migration is verified.");
      return 0;
    } else if (results.failed === 0) {
      console.log("\n✅ All critical checks passed. Review warnings above.");
      return 0;
    } else {
      console.log("\n❌ Some checks failed. Review errors above.");
      return 1;
    }
  } catch (error) {
    console.error("\n💥 Verification failed:");
    console.error(error);
    return 1;
  } finally {
    await mongoose.connection.close();
  }
}

// ============================================================================
// SCRIPT ENTRY POINT
// ============================================================================

if (require.main === module) {
  runVerification()
    .then((exitCode) => process.exit(exitCode))
    .catch((error) => {
      console.error("Fatal error:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runVerification };
