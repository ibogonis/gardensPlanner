import React from "react";

const SocialLoginButton = ({ provider }) => {
  const handleLogin = () => {
    window.location.href = `http://localhost:5001/api/auth/${provider}`;
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        padding: "10px 20px",
        borderRadius: "5px",
        border: "none",
        cursor: "pointer",
        margin: "5px",
        backgroundColor: provider === "google" ? "#DB4437" : "#4267B2",
        color: "#fff",
        fontWeight: "bold",
      }}
    >
      Login with {provider.charAt(0).toUpperCase() + provider.slice(1)}
    </button>
  );
};

export default SocialLoginButton;
