import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthService } from "../services/auth.service";
import type { AuthUser, UserRole } from "../services/auth.service";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = AuthService.getStoredUser();
    if (stored) setUser(stored);
  }, []);

  const login = async (correo: string, password: string) => {
    const { user } = await AuthService.login(correo, password);
    setUser(user);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.rol);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
