import Button from "./Button";
import { useState } from "react";
import { register } from "../services/authService";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submitHandler(e) {
    e.preventDefault();
    console.log("Registering with", { username, email, password });
    try {
      const data = await register(username, email, password);
      console.log("Registration successful:", data);
      localStorage.setItem("token", data.token);
      console.log("Token saved!");
    } catch (error) {
      console.error("Registration failed:", error.message);
    }
  }

  return (
    <form onSubmit={submitHandler}>
      <h2>Create Account</h2>
      <div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
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
        <Button textButton="Submit" />
      </div>
    </form>
  );
}
