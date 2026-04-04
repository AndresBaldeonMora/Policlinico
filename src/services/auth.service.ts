import { supabase } from "./supabaseClient";

export type UserRole = "ADMINISTRADOR" | "MEDICO" | "RECEPCIONISTA";

export interface AuthUser {
  id: string;
  correo: string;
  nombres: string;
  apellidos: string;
  rol: UserRole;
  medicoId?: string;
}

export const AuthService = {
  login: async (correo: string, password: string): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Correo o contrasena incorrectos.");
      }
      throw new Error(error.message);
    }

    const meta = data.user?.user_metadata ?? {};
    console.log("meta completo:", meta);
    console.log("rol recibido:", meta.rol);

    return {
      id: data.user!.id,
      correo: data.user!.email!,
      nombres: meta.nombres ?? "",
      apellidos: meta.apellidos ?? "",
      rol: meta.rol as UserRole,
      medicoId: meta.medicoId,
    };
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

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

  getToken: async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
};
