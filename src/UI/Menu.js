import { NavLink } from "react-router-dom";
import logo from "../images/logo.png";

export default function Menu() {
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
      </ul>
    </nav>
  );
}
