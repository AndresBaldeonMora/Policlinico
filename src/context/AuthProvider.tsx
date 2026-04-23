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
        const appMeta = u.app_metadata ?? {};
        const rolMeta = (appMeta.role ?? meta.rol) as UserRole | undefined;

        const populateUserAndSet = async (finalRol: UserRole) => {
          let nombres = (meta.nombres as string) ?? "";
          let apellidos = (meta.apellidos as string) ?? "";

          // Si es paciente y faltan sus datos en Supabase, buscamos en DB
          if (finalRol === "paciente" && !nombres) {
            try {
              // Import dinámico para evitar ciclos de dependencia en context
              const { PacienteApiService } = await import("../services/paciente.service");
              const pacientes = await PacienteApiService.listar();
              const p = pacientes.find(x => x.correo?.toLowerCase() === u.email?.toLowerCase());
              if (p) {
                nombres = p.nombres;
                apellidos = p.apellidos;
              }
            } catch (e) {
              console.error("No se pudo obtener datos extra del paciente", e);
            }
          }

          setUser({
            id: u.id,
            correo: u.email!,
            nombres,
            apellidos,
            rol: finalRol,
            medicoId: meta.medicoId as string | undefined,
          });
          setLoading(false);
        };

        if (!rolMeta) {
          // No tiene rol en token — buscar en profiles antes de renderizar
          (async () => {
            try {
              const { data: profile } = await supabase.from("profiles").select("role").eq("id", u.id).single();
              await populateUserAndSet((profile?.role ?? "cliente") as UserRole);
            } catch (err) {
              console.error(err);
              setLoading(false);
            }
          })();
          return;
        }

        // Tiene rol en metadata, lo armamos directamente
        populateUserAndSet(rolMeta).catch(console.error);
        //   // Luego actualiza el rol desde profiles (sin bloquear el render)
        //   supabase
        //     .from("profiles")
        //     .select("role")
        //     .eq("id", u.id)
        //     .single()
        //     .then(({ data: profile }) => {
        //       if (profile?.role) {
        //         setUser((prev) =>
        //           prev ? { ...prev, rol: profile.role as UserRole } : prev
        //         );
        //       }
        //     });
        // }
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
