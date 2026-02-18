import axios from "axios";

export const planService = {
  async savePlan(data) {
    const response = await axios.post("/api/plans", data);
    return response.data;
  },

  async getPlans() {
    const response = await axios.get("/api/plans");
    return response.data;
  },

  async getPlan(id) {
    const response = await axios.get(`/api/plans/${id}`);
    return response.data;
  },
};
