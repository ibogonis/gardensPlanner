import Button from "./Button";
import { useState } from "react";
import { login } from "../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submitHandler(e) {
    e.preventDefault();
    console.log("Logging in with", { email, password });
    try {
      const data = await login(email, password);
      console.log("Login successful:", data);
      localStorage.setItem("token", data.token);
      console.log("Token saved!");
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  }

  return (
    <form onSubmit={submitHandler}>
      <h2>Login</h2>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <Button textButton="Login" />
      </div>
    </form>
  );
}
