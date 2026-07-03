import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/Auth/Auth.tsx";
import { ProtectedRoute } from "./pages/Auth/ProtectedRoute.tsx";
import Main from "./pages/Main/Main.tsx";
import Layout from "@/components/Layout/Layout.tsx";
import Chat from "@/pages/Chat/Chat.tsx";
import Profile from "@/pages/Profile/Profile.tsx";
import Nutrition from "@/pages/Nutrition/Nutrition.tsx";
import Workouts from "@/pages/Workouts/Workouts.tsx";
import Post from "@/pages/Post/Post.tsx";
import Mood from "@/pages/Mood/Mood.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Main />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/mood" element={<Mood />} />
            {/* Динамический ID поста перемещен вниз, чтобы не перехватывать другие роуты */}
            <Route path="/:id" element={<Post />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
