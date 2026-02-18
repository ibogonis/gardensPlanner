const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");
const protect = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, planController.getPlans)
  .post(protect, planController.createPlan);

router
  .route("/:id")
  .get(protect, planController.getPlanById)
  .put(protect, planController.updatePlan)
  .delete(protect, planController.deletePlan);

module.exports = router;
