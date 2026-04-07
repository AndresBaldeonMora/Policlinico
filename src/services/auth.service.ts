import { supabase } from "./supabaseClient";

export type UserRole = "MEDICO" | "RECEPCIONISTA" | "administrador" | "cliente";

export interface AuthUser {
  id: string;
  correo: string;
  nombres: string;
  apellidos: string;
  rol: UserRole;
  medicoId?: string;
}

async function getRoleForUser(
  userId: string,
  meta: Record<string, unknown>
): Promise<UserRole> {

  // Si user_metadata ya tiene el rol (MEDICO/RECEPCIONISTA), úsalo directo
  if (meta.rol) return meta.rol as UserRole;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role) return profile.role as UserRole;

  // // fallback para usuarios con rol en user_metadata (MEDICO / RECEPCIONISTA)
  // return (meta.rol as UserRole) ?? "cliente";
  return "cliente";
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
    const rol = await getRoleForUser(data.user!.id, meta);

    return {
      id: data.user!.id,
      correo: data.user!.email!,
      nombres: meta.nombres as string ?? "",
      apellidos: meta.apellidos as string ?? "",
      rol,
      medicoId: meta.medicoId as string | undefined,
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
    const rol = await getRoleForUser(u.id, meta);

    return {
      id: u.id,
      correo: u.email!,
      nombres: meta.nombres as string ?? "",
      apellidos: meta.apellidos as string ?? "",
      rol,
      medicoId: meta.medicoId as string | undefined,
    };
  },

  getToken: async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
};
