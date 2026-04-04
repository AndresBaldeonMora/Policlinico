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
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        const u = session.user;
        const meta = u.user_metadata ?? {};

        // Renderiza inmediatamente con el rol de user_metadata (puede ser undefined)
        const rolMeta = (meta.rol as UserRole) ?? "cliente";
        setUser({
          id: u.id,
          correo: u.email!,
          nombres: (meta.nombres as string) ?? "",
          apellidos: (meta.apellidos as string) ?? "",
          rol: rolMeta,
          medicoId: meta.medicoId as string | undefined,
        });
        setLoading(false);

        // Luego actualiza el rol desde profiles (sin bloquear el render)
        supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .single()
          .then(({ data: profile }) => {
            if (profile?.role) {
              setUser((prev) =>
                prev ? { ...prev, rol: profile.role as UserRole } : prev
              );
            }
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
