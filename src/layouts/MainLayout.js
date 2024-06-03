import { Outlet } from "react-router-dom";
import Menu from "../UI/Menu";
import Footer from "../UI/Footer";

export default function MainLayout() {
  return (
    <>
      <Menu />
      <Outlet />
      <Footer />
    </>
  );
}
