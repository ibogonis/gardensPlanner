const Garden = require("../../../models/Garden");
const SeasonPlan = require("../../../models/SeasonPlan");
const Version = require("../../../models/Version");

exports.getGardens = async (req, res) => {
  try {
    const userId = req.user.id;

    const gardens = await Garden.find({
      "members.userId": userId,
    })
      .sort({ createdAt: -1 })
      .select("_id title members createdAt");

    res.json(gardens);
  } catch (error) {
    console.error("Get gardens error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getGardenById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const garden = await Garden.findOne({
      _id: id,
      "members.userId": userId,
    });

    if (!garden) {
      return res.status(404).json({ message: "Garden not found" });
    }

    res.json(garden);
  } catch (error) {
    console.error("Get garden error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createGarden = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Garden title is required" });
    }

    const garden = await Garden.create({
      title,
      members: [
        {
          userId,
          role: "owner",
        },
      ],
    });

    res.status(201).json(garden);
  } catch (error) {
    console.error("Create garden error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateGarden = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title } = req.body;

    // Check if user is owner
    const garden = await Garden.findOne({
      _id: id,
      "members.userId": userId,
      "members.role": "owner",
    });

    if (!garden) {
      return res
        .status(404)
        .json({ message: "Garden not found or insufficient permissions" });
    }

    garden.title = title;
    await garden.save();

    res.json(garden);
  } catch (error) {
    console.error("Update garden error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteGarden = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if user is owner
    const garden = await Garden.findOne({
      _id: id,
      "members.userId": userId,
      "members.role": "owner",
    });

    if (!garden) {
      return res
        .status(404)
        .json({ message: "Garden not found or insufficient permissions" });
    }

    // Delete all related season plans and versions
    const seasonPlans = await SeasonPlan.find({ gardenId: id });
    const seasonPlanIds = seasonPlans.map((sp) => sp._id);

    await Version.deleteMany({ seasonPlanId: { $in: seasonPlanIds } });
    await SeasonPlan.deleteMany({ gardenId: id });
    await Garden.findByIdAndDelete(id);

    res.json({ message: "Garden and all related data deleted" });
  } catch (error) {
    console.error("Delete garden error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSeasonPlans = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gardenId } = req.params;

    // Verify user has access to garden
    const garden = await Garden.findOne({
      _id: gardenId,
      "members.userId": userId,
    });

    if (!garden) {
      return res.status(404).json({ message: "Garden not found" });
    }

    const seasonPlans = await SeasonPlan.find({ gardenId })
      .sort({ year: -1 })
      .select("_id gardenId year currentVersionId createdAt updatedAt");

    res.json(seasonPlans);
  } catch (error) {
    console.error("Get season plans error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSeasonPlanById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const seasonPlan =
      await SeasonPlan.findById(id).populate("currentVersionId");

    if (!seasonPlan) {
      return res.status(404).json({ message: "Season plan not found" });
    }

    // Verify user has access to the garden
    const garden = await Garden.findOne({
      _id: seasonPlan.gardenId,
      "members.userId": userId,
    });

    if (!garden) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Return season plan with full snapshot from current version
    res.json({
      _id: seasonPlan._id,
      gardenId: seasonPlan.gardenId,
      year: seasonPlan.year,
      layout: seasonPlan.currentVersionId?.layout || {},
      plantings: seasonPlan.currentVersionId?.plantings || {},
      currentVersionId: seasonPlan.currentVersionId?._id,
      createdAt: seasonPlan.createdAt,
      updatedAt: seasonPlan.updatedAt,
    });
  } catch (error) {
    console.error("Get season plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createSeasonPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gardenId, year, layout, plantings } = req.body;

    if (!gardenId || !year) {
      return res
        .status(400)
        .json({ message: "Garden ID and year are required" });
    }

    // Verify user has access to garden
    const garden = await Garden.findOne({
      _id: gardenId,
      "members.userId": userId,
    });

    if (!garden) {
      return res.status(404).json({ message: "Garden not found" });
    }

    // Check if season plan already exists for this garden and year
    const existing = await SeasonPlan.findOne({ gardenId, year });
    if (existing) {
      return res.status(400).json({
        message: "Season plan already exists for this garden and year",
      });
    }

    // Create season plan first (without currentVersionId)
    const seasonPlan = await SeasonPlan.create({
      gardenId,
      year,
    });

    // Create initial version with full snapshot
    const version = await Version.create({
      seasonPlanId: seasonPlan._id,
      layout: layout || {},
      plantings: plantings || {},
      comment: "Initial version",
      type: "manual",
    });

    // Update season plan with currentVersionId
    seasonPlan.currentVersionId = version._id;
    await seasonPlan.save();

    res.status(201).json({
      _id: seasonPlan._id,
      gardenId: seasonPlan.gardenId,
      year: seasonPlan.year,
      layout: version.layout,
      plantings: version.plantings,
      currentVersionId: version._id,
      createdAt: seasonPlan.createdAt,
      updatedAt: seasonPlan.updatedAt,
    });
  } catch (error) {
    console.error("Create season plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateSeasonPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { layout, plantings, year, comment } = req.body;

    const seasonPlan =
      await SeasonPlan.findById(id).populate("currentVersionId");

    if (!seasonPlan) {
      return res.status(404).json({ message: "Season plan not found" });
    }

    // Verify user access
    const garden = await Garden.findOne({
      _id: seasonPlan.gardenId,
      "members.userId": userId,
    });

    if (!garden) {
      return res.status(403).json({ message: "Access denied" });
    }

    const currentVersion = seasonPlan.currentVersionId;

    // Detect changes
    const layoutChanged =
      layout &&
      JSON.stringify(layout) !== JSON.stringify(currentVersion?.layout);

    const plantingsChanged =
      plantings &&
      JSON.stringify(plantings) !== JSON.stringify(currentVersion?.plantings);

    const metaChanged = year !== undefined && year !== seasonPlan.year;

    let activeVersion = currentVersion;

    // Create new version only if layout or plantings changed
    if (layoutChanged || plantingsChanged) {
      const newVersion = await Version.create({
        seasonPlanId: seasonPlan._id,
        layout: layout !== undefined ? layout : currentVersion?.layout || {},
        plantings:
          plantings !== undefined ? plantings : currentVersion?.plantings || {},
        comment: comment || "Updated",
        type: "manual",
      });

      seasonPlan.currentVersionId = newVersion._id;
      activeVersion = newVersion;
    }

    // Update metadata
    if (year !== undefined) {
      seasonPlan.year = year;
    }

    if (metaChanged || layoutChanged || plantingsChanged) {
      await seasonPlan.save();
    }

    res.json({
      _id: seasonPlan._id,
      gardenId: seasonPlan.gardenId,
      year: seasonPlan.year,
      layout: activeVersion?.layout || {},
      plantings: activeVersion?.plantings || {},
      currentVersionId: seasonPlan.currentVersionId,
      createdAt: seasonPlan.createdAt,
      updatedAt: seasonPlan.updatedAt,
    });
  } catch (error) {
    console.error("Update season plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteSeasonPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const seasonPlan = await SeasonPlan.findById(id);

    if (!seasonPlan) {
      return res.status(404).json({ message: "Season plan not found" });
    }

    // Verify user has access to the garden
    const garden = await Garden.findOne({
      _id: seasonPlan.gardenId,
      "members.userId": userId,
      "members.role": "owner",
    });

    if (!garden) {
      return res
        .status(403)
        .json({ message: "Access denied or insufficient permissions" });
    }

    // Delete all versions for this season plan
    await Version.deleteMany({ seasonPlanId: id });

    // Delete season plan
    await SeasonPlan.findByIdAndDelete(id);

    res.json({ message: "Season plan and all versions deleted" });
  } catch (error) {
    console.error("Delete season plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getVersionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { seasonPlanId } = req.params;

    const seasonPlan = await SeasonPlan.findById(seasonPlanId);

    if (!seasonPlan) {
      return res.status(404).json({ message: "Season plan not found" });
    }

    // Verify user has access to the garden
    const garden = await Garden.findOne({
      _id: seasonPlan.gardenId,
      "members.userId": userId,
    });

    if (!garden) {
      return res.status(403).json({ message: "Access denied" });
    }

    const versions = await Version.find({ seasonPlanId })
      .sort({ createdAt: -1 })
      .select("_id comment type createdAt");

    res.json(versions);
  } catch (error) {
    console.error("Get version history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getVersionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const version = await Version.findById(id);

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    // Get season plan and verify access
    const seasonPlan = await SeasonPlan.findById(version.seasonPlanId);

    if (!seasonPlan) {
      return res.status(404).json({ message: "Season plan not found" });
    }

    const garden = await Garden.findOne({
      _id: seasonPlan.gardenId,
      "members.userId": userId,
    });

    if (!garden) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(version);
  } catch (error) {
    console.error("Get version error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.restoreVersion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const oldVersion = await Version.findById(id);

    if (!oldVersion) {
      return res.status(404).json({ message: "Version not found" });
    }

    // Get season plan and verify access
    const seasonPlan = await SeasonPlan.findById(oldVersion.seasonPlanId);

    if (!seasonPlan) {
      return res.status(404).json({ message: "Season plan not found" });
    }

    const garden = await Garden.findOne({
      _id: seasonPlan.gardenId,
      "members.userId": userId,
    });

    if (!garden) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Create new version as a copy of the old one
    const newVersion = await Version.create({
      seasonPlanId: seasonPlan._id,
      layout: oldVersion.layout,
      plantings: oldVersion.plantings,
      comment: `Restored from version ${oldVersion._id}`,
      type: "manual",
    });

    // Update season plan's currentVersionId
    seasonPlan.currentVersionId = newVersion._id;
    await seasonPlan.save();

    res.json({
      message: "Version restored",
      version: newVersion,
    });
  } catch (error) {
    console.error("Restore version error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
