const express = require("express");
const router = express.Router();
const gardenController = require("./garden.controller");
const protect = require("../../../middleware/authMiddleware");

// Garden routes
router
  .route("/")
  .get(protect, gardenController.getGardens)
  .post(protect, gardenController.createGarden);

router
  .route("/:id")
  .get(protect, gardenController.getGardenById)
  .put(protect, gardenController.updateGarden)
  .delete(protect, gardenController.deleteGarden);

// Season plan routes - IMPORTANT: specific routes before parameterized routes
router.route("/season-plans").post(protect, gardenController.createSeasonPlan);

router
  .route("/season-plans/:id")
  .get(protect, gardenController.getSeasonPlanById)
  .put(protect, gardenController.updateSeasonPlan)
  .delete(protect, gardenController.deleteSeasonPlan);

router
  .route("/:gardenId/season-plans")
  .get(protect, gardenController.getSeasonPlans);

// Version routes
router
  .route("/season-plans/:seasonPlanId/versions")
  .get(protect, gardenController.getVersionHistory);

router.route("/versions/:id").get(protect, gardenController.getVersionById);

router
  .route("/versions/:id/restore")
  .post(protect, gardenController.restoreVersion);

module.exports = router;
