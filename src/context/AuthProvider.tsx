import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../services/supabaseClient";
import { AuthService } from "../services/auth.service";
import type { AuthUser, UserRole } from "../services/auth.service";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Carga la sesión activa al arrancar la app
    AuthService.getSession().then((u) => {
      setUser(u);
      setLoading(false);
    });

    // 2. Escucha cambios de sesión en tiempo real (login/logout/token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null);
          return;
        }
        const meta = session.user.user_metadata ?? {};
        setUser({
          id: session.user.id,
          correo: session.user.email!,
          nombres: meta.nombres ?? "",
          apellidos: meta.apellidos ?? "",
          rol: meta.rol,
          medicoId: meta.medicoId,
        });
      }
    );

    return () => listener.subscription.unsubscribe();
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