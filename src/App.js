import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import HomePage from "./features/static-pages/HomePage";
import PlannerPage from "./features/planner/pages/PlannerPage";
import ContactsPage from "./features/static-pages/ContactsPage";
import NotFoundPage from "./features/static-pages/NotFoundPage";
import BlogPage from "./features/blog/pages/BlogPage";
import ArticlePage from "./features/blog/pages/ArticlePage";
import LoginPage from "./features/auth/pages/LoginPage";

import "./App.css";

import MainLayout from "./shared/ui/Layout/MainLayout";
import { AuthProvider } from "./app/providers/AuthProvider";
import { AuthGuard } from "./app/providers/AuthGuard";
import { useGardenStore } from "./features/planner/store/useGardenStore";

function App() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const unsub = useGardenStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    useGardenStore.persist.rehydrate();

    return () => unsub();
  }, []);

  if (!hasHydrated) return null;

  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGuard>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="planner" element={<PlannerPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="blog/:slug" element={<ArticlePage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthGuard>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
