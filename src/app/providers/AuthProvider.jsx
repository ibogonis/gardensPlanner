import axios from "../../shared/utils/api/axiosConfig";
import { createContext, useEffect, useState } from "react";
import { useGardenStore } from "../../features/planner/store/useGardenStore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      useGardenStore.getState().reset();
    }
  };

  useEffect(() => {
    axios
      .get("/api/users/profile")
      .then((res) => setUser(res.data))
      .catch((err) => {
        if (err.response?.status !== 401) {
          console.error("Failed to fetch user profile:", err);
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
