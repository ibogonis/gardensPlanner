import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import Contacts from "./pages/Contacts";
import NotFound from "./pages/NotFound";
import Blog from "./pages/Blog";
import Article from "./pages/Article";
import Login from "./pages/Login";
import "./App.css";
import MainLayout from "./layouts/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import { useGardenStore } from "./state/useGardenStore";
import { useEffect } from "react";

function App() {
  const hydrate = useGardenStore.persist.rehydrate;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="planner" element={<Planner />} />
              <Route path="login" element={<Login />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:slug" element={<Article />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
