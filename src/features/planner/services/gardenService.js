import axios from "../../../shared/utils/api/axiosConfig";

export const gardenService = {
  // Get all gardens for current user
  async getGardens() {
    const response = await axios.get("/api/gardens");
    return response.data;
  },

  // Get a specific garden
  async getGarden(id) {
    const response = await axios.get(`/api/gardens/${id}`);
    return response.data;
  },

  // Create a new garden
  async createGarden(data) {
    const response = await axios.post("/api/gardens", data);
    return response.data;
  },

  // Update a garden
  async updateGarden(id, data) {
    const response = await axios.put(`/api/gardens/${id}`, data);
    return response.data;
  },

  // Delete a garden
  async deleteGarden(id) {
    const response = await axios.delete(`/api/gardens/${id}`);
    return response.data;
  },
};
