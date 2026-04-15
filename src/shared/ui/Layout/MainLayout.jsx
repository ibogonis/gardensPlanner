import { Outlet } from "react-router-dom";
import Menu from "../Menu/Menu";
import Footer from "../Footer/Footer";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../app/providers/AuthProvider";
import { useGardenStore } from "../../../features/planner/store/useGardenStore";

export default function MainLayout() {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
  if (loading) return;

  const store = useGardenStore.getState();

  const init = async () => {
    try {
      if (!user) {
        store.reset();
        return;
      }

      const gardens = await store.fetchGardens();
      if (!gardens.length) return;

      const existingGarden = store.currentGarden;
      const selectedGarden =
        existingGarden &&
        gardens.some((g) => g._id === existingGarden._id)
          ? existingGarden
          : gardens[0];

      // 🔥 один виклик замість всієї логіки
      await store.selectGarden(selectedGarden._id);

    } catch (error) {
      console.error("Bootstrap failed:", error);
    }
  };

  init();
}, [user, loading]);

  return (
    <>
      <Menu />
      <Outlet />
      <Footer />
    </>
  );
}
