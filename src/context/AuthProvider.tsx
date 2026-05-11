import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthService } from "../services/auth.service";
import type { AuthUser, UserRole } from "../services/auth.service";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar, restaurar sesión desde localStorage (sin llamadas de red).
  useEffect(() => {
    if (AuthService.isTokenValid()) {
      setUser(AuthService.getStoredUser());
    } else {
      // Token vencido o ausente - limpiar todo.
      AuthService.logout();
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (correo: string, password: string) => {
    const userData = await AuthService.login(correo, password);
    setUser(userData);
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.rol);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};
