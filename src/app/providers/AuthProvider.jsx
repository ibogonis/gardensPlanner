import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useGardenStore } from "../../features/planner/store/useGardenStore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await axios.post(
        "http://localhost:5001/api/auth/logout",
        {},
        { withCredentials: true },
      );
    } catch (err) {
      // Logout is user intent; even if the request fails, we clear UI state.
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      // Clear persisted garden data on logout
      useGardenStore.getState().reset();
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/users/profile", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch((err) => {
        // Silently handle 401 - user is not logged in
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
