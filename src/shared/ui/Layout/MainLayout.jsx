import { Outlet } from "react-router-dom";
import Menu from "../Menu/Menu";
import Footer from "../Footer/Footer";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../app/providers/AuthProvider";
import { useGardenStore } from "../../../features/planner/store/useGardenStore";

export default function MainLayout() {
  const { user, loading } = useContext(AuthContext);
  useEffect(() => {
    if (!loading && user) {
      const store = useGardenStore.getState();

      const init = async () => {
        const plans = await store.fetchPlans();

        if (plans.length > 0) {
          await store.loadPlan(plans[0]._id);
        }
      };

      init();
    }
  }, [user, loading]);
  return (
    <>
      <Menu />
      <Outlet />
      <Footer />
    </>
  );
}
