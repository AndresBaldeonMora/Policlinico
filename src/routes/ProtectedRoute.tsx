import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/userAuth";
import type { UserRole } from "../services/auth.service";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.rol)) {
    if (user.rol === "MEDICO") return <Navigate to="/medico" replace />;
    if (user.rol === "administrador") return <Navigate to="/admin/doctores" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};