import { supabase } from "./supabaseClient";

export type UserRole = "ADMIN" | "MEDICO" | "RECEPCIONISTA";

export interface AuthUser {
  id: string;         // UUID de Supabase
  correo: string;
  nombres: string;
  apellidos: string;
  rol: UserRole;
  medicoId?: string;
}

export const AuthService = {
  // LOGIN: Supabase maneja todo, nosotros solo leemos el resultado
  login: async (correo: string, password: string): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });

    if (error) {
      // Mensaje amigable en español
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Correo o contraseña incorrectos.");
      }
      throw new Error(error.message);
    }

    const meta = data.user?.user_metadata ?? {};

    return {
      id: data.user!.id,
      correo: data.user!.email!,
      nombres: meta.nombres ?? "",
      apellidos: meta.apellidos ?? "",
      rol: meta.rol as UserRole,
      medicoId: meta.medicoId,
    };
  },

  // LOGOUT: Cierra sesión en Supabase (invalida el token)
  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  // OBTENER SESIÓN ACTIVA: Usado por AuthProvider al iniciar la app
  getSession: async (): Promise<AuthUser | null> => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return null;

    const u = data.session.user;
    const meta = u.user_metadata ?? {};

    return {
      id: u.id,
      correo: u.email!,
      nombres: meta.nombres ?? "",
      apellidos: meta.apellidos ?? "",
      rol: meta.rol as UserRole,
      medicoId: meta.medicoId,
    };
  },

  // TOKEN ACTIVO: Para enviarlo en el header Authorization del backend
  getToken: async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
};