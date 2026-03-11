import { createContext } from "react";
import type { AuthUser, UserRole } from "../services/auth.service";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);