import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { useGardenStore } from "./features/planner/store/useGardenStore";
import { useEffect } from "react";

function App() {
  const hydrate = useGardenStore.persist.rehydrate;
  const hasHydrated = useGardenStore.persist.hasHydrated();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hasHydrated) return null;

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
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
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
