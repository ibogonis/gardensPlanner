import { Outlet } from "react-router-dom";
import Menu from "../Menu/Menu";
import Footer from "../Footer/Footer";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../app/providers/AuthProvider";
import { useGardenStore } from "../../../features/planner/store/useGardenStore";

export default function MainLayout() {
  const { user, loading } = useContext(AuthContext);
  useEffect(() => {
    if (!loading) {
      const store = useGardenStore.getState();

      if (user) {
        // User is logged in - fetch their plans from server
        const init = async () => {
          const plans = await store.fetchPlans();

          if (plans.length > 0) {
            await store.loadPlan(plans[0]._id);
          }
        };

        init();
      } else {
        // User is logged out - clear any persisted data
        store.reset();
      }
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
