import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { AuthContext } from "../../../app/providers/AuthProvider";
import LogoutButton from "../LogoutButton/LogoutButton";
import Button from "../Button/Button";
import { useGardenStore } from "../../../features/planner/store/useGardenStore";

export default function Menu() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    useGardenStore.getState().reset();
    useGardenStore.persist.clearStorage();
    navigate("/login");
  };
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
            <NavLink to="/login">
              <Button type="button" textButton="Login" />
            </NavLink>
          </li>
        ) : (
          <>
            <li>Hi, {user.username}</li>
            <li>
              <LogoutButton onLogout={handleLogout} />
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
