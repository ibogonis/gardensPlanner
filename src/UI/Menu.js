import { useContext } from "react";
import { NavLink } from "react-router-dom";
import logo from "../images/logo.png";
import { AuthContext } from "../context/AuthContext";
import SocialLoginButton from "./SocialLoginButton";

export default function Menu() {
  const { user } = useContext(AuthContext);
  return (
    <nav>
      <div className="logo">
        <NavLink to=".">
          <img src={logo} alt="logo" />
        </NavLink>
      </div>

      <ul className="menu">
        <li>
          <NavLink to="planner">Create a plan</NavLink>
        </li>
        <li>
          <NavLink to="blog" end>
            Blog
          </NavLink>
        </li>
        <li>
          <NavLink to="contacts">Contact us</NavLink>
        </li>
        {!user ? (
          <li>
            <SocialLoginButton provider="google" />
          </li>
        ) : (
          <li>👋 {user.username}</li>
        )}
      </ul>
    </nav>
  );
}
