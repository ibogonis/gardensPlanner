import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

export const AuthGuard = ({ children }) => {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>; 
  }

  return children;
};
