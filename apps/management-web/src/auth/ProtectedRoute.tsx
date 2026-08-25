import { Navigate, Outlet } from "react-router";
import { useAuth } from "./useAuth";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <p>Indlæser...</p>;
  }
  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}