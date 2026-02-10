import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SocialLoginButton from "../UI/SocialLoginButton";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <main style={{ padding: "24px" }}>
      <h1>Login</h1>
      <p>Use a social provider to sign in.</p>
      <div>
        <SocialLoginButton provider="google" />
        <SocialLoginButton provider="facebook" />
      </div>
    </main>
  );
}
