const Plan = require("../models/Plan");

exports.createPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, year, layout, plantings } = req.body;

    if (!layout || !plantings) {
      return res.status(400).json({ message: "Invalid plan payload" });
    }
    const plan = await Plan.create({
      userId,
      name,
      year,
      layout,
      plantings,
      schemaVersion: 1,
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error("Create plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const userId = req.user.id;

    const plans = await Plan.find({ userId })
      .sort({ updatedAt: -1 })
      .select("_id name year updatedAt");

    res.json(plans);
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const plan = await Plan.findOne({ _id: id, userId });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json(plan);
  } catch (error) {
    console.error("Get plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { name, year, layout, plantings } = req.body;

    const plan = await Plan.findOneAndUpdate(
      { _id: id, userId },
      {
        name,
        year,
        layout,
        plantings,
      },
      { new: true },
    );
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json(plan);
  } catch (error) {
    console.error("Update plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const plan = await Plan.findOneAndDelete({ _id: id, userId });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({ message: "Plan deleted" });
  } catch (error) {
    console.error("Delete plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
