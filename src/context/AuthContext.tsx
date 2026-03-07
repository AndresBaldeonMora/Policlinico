import { createContext } from "react";
import type { AuthUser, UserRole } from "../services/auth.service";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

// ✅ Este archivo NO tiene componentes, solo el contexto
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
