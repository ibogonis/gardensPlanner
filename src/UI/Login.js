//import { useState } from "react";
import { login } from "../services/authService";
import AuthForm from "./AuthForm";

export default function Login() {
  const loginFields = [
    {
      name: "email",
      type: "email",
      placeholder: "Email",
      icon: "fa fa-envelope",
    },
    {
      name: "password",
      type: "password",
      placeholder: "Password",
      icon: "fa fa-lock",
    },
  ];

  async function submitHandler(formData) {
    console.log("Logging in with", {
      email: formData.email,
      password: formData.password,
    });
    try {
      const data = await login(formData.email, formData.password);
      console.log("Login successful:", data);
      localStorage.setItem("token", data.token);
      console.log("Token saved!");
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  }

  return (
    <AuthForm
      title="Login"
      message="Please enter your email and password to login."
      fields={loginFields}
      onSubmit={submitHandler}
    />
  );
}
