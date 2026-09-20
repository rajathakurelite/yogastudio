import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RequireAuth({ roles }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles?.length && !roles.some((r) => user.roles?.includes(r))) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
