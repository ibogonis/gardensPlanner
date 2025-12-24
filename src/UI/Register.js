import { register } from "../services/authService";
import AuthForm from "./AuthForm";

export default function Register() {
  const registerFields = [
    {
      name: "username",
      type: "text",
      placeholder: "Username",
      icon: "fa fa-user",
    },
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
    console.log("Registering with", {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    });
    try {
      const data = await register(
        formData.username,
        formData.email,
        formData.password
      );
      console.log("Registration successful:", data);
      localStorage.setItem("token", data.token);
      console.log("Token saved!");
    } catch (error) {
      console.error("Registration failed:", error.message);
    }
  }

  return (
    <AuthForm
      title="Register"
      message="Please fill in this form to create an account!"
      fields={registerFields}
      onSubmit={submitHandler}
    />
  );
}
