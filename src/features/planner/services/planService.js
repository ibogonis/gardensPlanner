import axios from "../../../shared/utils/api/axiosConfig";

export const planService = {
  // Create a new season plan (creates initial version)
  async createSeasonPlan(data) {
    const response = await axios.post("/api/gardens/season-plans", data);
    return response.data;
  },

  // Update existing season plan (creates new version)
  async updateSeasonPlan(id, data) {
    const response = await axios.put(`/api/gardens/season-plans/${id}`, data);
    return response.data;
  },

  // Get all season plans for a garden
  async getSeasonPlans(gardenId) {
    const response = await axios.get(`/api/gardens/${gardenId}/season-plans`);
    return response.data;
  },

  // Get a specific season plan
  async getSeasonPlan(id) {
    const response = await axios.get(`/api/gardens/season-plans/${id}`);
    return response.data;
  },

  // Get version history
  async getVersionHistory(seasonPlanId) {
    const response = await axios.get(
      `/api/gardens/season-plans/${seasonPlanId}/versions`,
    );
    return response.data;
  },

  // Restore a version
  async restoreVersion(versionId) {
    const response = await axios.post(
      `/api/gardens/versions/${versionId}/restore`,
    );
    return response.data;
  },

  // LEGACY API - will be removed after migration
  // Legacy: Create plan (old API)
  async savePlan(data) {
    const response = await axios.post("/api/plans", data);
    return response.data;
  },

  // Legacy: Get all plans (old API)
  async getPlans() {
    const response = await axios.get("/api/plans");
    return response.data;
  },

  // Legacy: Get plan by ID (old API)
  async getPlan(id) {
    const response = await axios.get(`/api/plans/${id}`);
    return response.data;
  },
};
