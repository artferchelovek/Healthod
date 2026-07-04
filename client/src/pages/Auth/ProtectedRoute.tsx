import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { setupWebPush } from "@/logic/notification";

export const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      setupWebPush().catch((err: any) => {
        console.error("Failed to setup web push:", err);
      });
    }
  }, [token]);

  if (!token) {
    return <Navigate to={"/auth"} replace />;
  }

  return <Outlet />;
};
