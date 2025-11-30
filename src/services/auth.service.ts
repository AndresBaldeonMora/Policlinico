const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type UserRole = "RECEPCIONISTA" | "MEDICO";

export interface AuthUser {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: UserRole;
  medicoId?: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const AuthService = {
  login: async (correo: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password }),
      credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message = errorData.message || "Credenciales incorrectas";
      throw new Error(message);
    }

    const data = (await res.json()) as LoginResponse;

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear(); // limpieza adicional
  },

  getStoredUser: (): AuthUser | null => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem("token");
  },
};
