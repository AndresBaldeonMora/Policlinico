import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthService } from "../services/auth.service";
import type { AuthUser, UserRole } from "../services/auth.service";
import { AuthContext } from "./AuthContext";
import CambiarPasswordModal from "../components/CambiarPasswordModal/CambiarPasswordModal";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (AuthService.isTokenValid()) {
      setUser(AuthService.getStoredUser());
    } else {
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

  const onPasswordChanged = () => {
    if (!user) return;
    const updated = { ...user, debeCambiarPassword: false };
    setUser(updated);
  };

  if (loading) return null;

  const debesCambiar = !!user?.debeCambiarPassword;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout, hasRole, onPasswordChanged }}
    >
      {children}
      {debesCambiar && <CambiarPasswordModal onCambioExitoso={onPasswordChanged} />}
    </AuthContext.Provider>
  );
};
