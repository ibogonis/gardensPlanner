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
        // User is logged in - fetch their gardens and load the first season plan
        const init = async () => {
          try {
            // Fetch all gardens
            const gardens = await store.fetchGardens();

            if (gardens.length > 0) {
              // Set the first garden as current
              store.setCurrentGarden(gardens[0]);

              // Fetch season plans for the first garden
              const seasonPlans = await store.fetchSeasonPlans(gardens[0]._id);

              if (seasonPlans.length > 0) {
                // Load the most recent season plan
                await store.loadSeasonPlan(seasonPlans[0]._id);
              }
            }
          } catch (error) {
            console.error("Failed to load user data:", error);
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
