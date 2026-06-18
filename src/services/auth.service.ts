import axios from "axios";

export type UserRole = "MEDICO" | "RECEPCIONISTA" | "administrador" | "cliente" | "paciente";

export interface AuthUser {
  id: string;
  correo: string;
  nombres: string;
  apellidos: string;
  rol: UserRole;
  medicoId?: string;
  pacienteId?: string;
  debeCambiarPassword?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
const TOKEN_KEY = "pcl_token";
const USER_KEY  = "pcl_user";

// Backend devuelve roles en MAYÚSCULAS. Normalizamos para mantener compat con el código existente.
function normalizeRol(rol: string): UserRole {
  const r = String(rol ?? "").toUpperCase();
  switch (r) {
    case "MEDICO":         return "MEDICO";
    case "RECEPCIONISTA":  return "RECEPCIONISTA";
    case "ADMINISTRADOR":  return "administrador";
    case "PACIENTE":       return "paciente";
    default:               return "cliente";
  }
}

interface BackendLoginResponse {
  token: string;
  user: {
    id: string;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: string;
    medicoId?: string;
    pacienteId?: string;
    debeCambiarPassword?: boolean;
  };
}

function toAuthUser(u: BackendLoginResponse["user"]): AuthUser {
  return {
    id:                   u.id,
    correo:               u.correo,
    nombres:              u.nombres ?? "",
    apellidos:            u.apellidos ?? "",
    rol:                  normalizeRol(u.rol),
    medicoId:             u.medicoId,
    pacienteId:           u.pacienteId,
    debeCambiarPassword:  u.debeCambiarPassword ?? false,
  };
}

export const AuthService = {
  login: async (correo: string, password: string): Promise<AuthUser> => {
    try {
      const { data } = await axios.post<BackendLoginResponse>(
        `${API_BASE_URL}/auth/login`,
        { correo, password }
      );
      const user = toAuthUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 401) {
        throw new Error("Correo o contraseña incorrectos.");
      }
      throw new Error(msg ?? err?.message ?? "Error al iniciar sesión");
    }
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Lee el usuario persistido de localStorage (sin pegar al servidor).
  getStoredUser: (): AuthUser | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  cambiarPassword: async (passwordActual: string, passwordNuevo: string): Promise<void> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
    }
    await axios.post(
      `${API_BASE_URL}/auth/cambiar-password`,
      { passwordActual, passwordNuevo },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Actualizar el usuario en localStorage para limpiar el flag
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        const u = JSON.parse(raw) as AuthUser;
        u.debeCambiarPassword = false;
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      } catch { /* ignore */ }
    }
  },

  forgotPassword: async (correo: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/auth/forgot-password`, { correo });
  },

  resetPassword: async (token: string, passwordNuevo: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/auth/reset-password`, { token, passwordNuevo });
  },

  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),

  // Verifica si el JWT no ha expirado (decodifica el payload sin librería externa).
  isTokenValid: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (typeof payload.exp !== "number") return true;
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },
};
