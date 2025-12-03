import api from "./api"; // Tu instancia de axios con el interceptor
import type { AxiosResponse } from "axios";

// Definimos los tipos aquí para mantener el orden
export type UserRole = "ADMIN" | "MEDICO" | "PACIENTE" | "RECEPCIONISTA";

export interface AuthUser {
  _id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: UserRole;
  medicoId?: string; // Fundamental para que tu dashboard sepa quién es el doctor
}

// La respuesta que devuelve tu Backend al hacer login
interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const AuthService = {
  // 1. LOGIN: Conecta, recibe datos y GUARDA EL TOKEN
  login: async (correo: string, password: string): Promise<LoginResponse> => {
    // Hacemos la petición POST al backend
    const response: AxiosResponse<LoginResponse> = await api.post("/auth/login", {
      correo,
      password,
    });

    const { token, user } = response.data;

    // ============================================================
    // ¡ESTA ES LA PARTE CRUCIAL QUE TE FALTABA!
    // Guardamos el token para que api.ts lo pueda leer
    // ============================================================
    if (token) {
      localStorage.setItem("token", token);
    }
    
    // Guardamos al usuario para no perderlo al recargar la página
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }

    return response.data;
  },

  // 2. LOGOUT: Borra todo para limpiar la sesión
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // 3. RECUPERAR USUARIO: Usado por tu AuthProvider al iniciar la app
  getStoredUser: (): AuthUser | null => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    
    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch (error) {
      console.error("Error al parsear el usuario almacenado:", error);
      return null;
    }
  },

  // 4. TOKEN: Utilidad por si necesitas leer el token manualmente
  getToken: (): string | null => {
    return localStorage.getItem("token");
  }
};