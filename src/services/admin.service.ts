// src/services/admin.service.ts
import api from "./api";

// ─── Tipos ────────────────────────────────────────────────────
export type RolGestionable = "RECEPCIONISTA" | "MEDICO" | "ADMINISTRADOR";

export interface UsuarioSistema {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolGestionable | "PACIENTE";
  activo: boolean;
  debeCambiarPassword: boolean;
  medicoId?: string;
  pacienteId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearUsuarioPayload {
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolGestionable;
  password?: string;     // si se omite, el backend genera una temporal
  medicoId?: string;
}

export interface RegistroAuditoria {
  _id: string;
  usuarioId: string;
  usuarioNombre?: string;
  accion: string;
  entidad: string;
  entidadId: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  descripcion?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface PaginacionAuditoria {
  page: number;
  limit: number;
  total: number;
  totalPaginas: number;
}

export interface PaginacionUsuarios {
  page: number;
  limit: number;
  total: number;
  totalPaginas: number;
}

export interface FiltrosAuditoria {
  entidad?: string;
  accion?: string;
  usuarioId?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}

interface AxiosErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

const msg = (error: unknown, fallback: string): string => {
  const err = error as AxiosErrorResponse;
  return err.response?.data?.message || err.message || fallback;
};

// ─── Servicio de usuarios ──────────────────────────────────────
export class UsuarioApiService {
  static async listar(
    params?: { rol?: string; activo?: boolean; q?: string; page?: number; limit?: number }
  ): Promise<{ data: UsuarioSistema[]; paginacion: PaginacionUsuarios; totalActivos: number }> {
    try {
      const response = await api.get<{
        success: boolean;
        data: UsuarioSistema[];
        paginacion: PaginacionUsuarios;
        totalActivos: number;
      }>("/admin/usuarios", {
        params: {
          rol: params?.rol || undefined,
          activo: params?.activo === undefined ? undefined : String(params.activo),
          q: params?.q || undefined,
          page: params?.page,
          limit: params?.limit,
        },
      });
      const data = response.data.data ?? [];
      return {
        data,
        // Fallback por si el backend respondiera sin metadatos de paginación.
        paginacion: response.data.paginacion ?? {
          page: params?.page ?? 1,
          limit: params?.limit ?? data.length,
          total: data.length,
          totalPaginas: 1,
        },
        totalActivos: response.data.totalActivos ?? data.filter((u) => u.activo).length,
      };
    } catch (error) {
      throw new Error(msg(error, "Error al listar usuarios"));
    }
  }

  static async crear(payload: CrearUsuarioPayload): Promise<{ usuario: UsuarioSistema; passwordTemporal?: string }> {
    try {
      const response = await api.post<{ success: boolean; data: UsuarioSistema; passwordTemporal?: string }>(
        "/admin/usuarios",
        payload
      );
      return { usuario: response.data.data, passwordTemporal: response.data.passwordTemporal };
    } catch (error) {
      throw new Error(msg(error, "Error al crear usuario"));
    }
  }

  static async actualizar(id: string, payload: Partial<Omit<CrearUsuarioPayload, "password">>): Promise<UsuarioSistema> {
    try {
      const response = await api.patch<{ success: boolean; data: UsuarioSistema }>(`/admin/usuarios/${id}`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(msg(error, "Error al actualizar usuario"));
    }
  }

  static async toggleActivo(id: string): Promise<UsuarioSistema> {
    try {
      const response = await api.patch<{ success: boolean; data: UsuarioSistema }>(`/admin/usuarios/${id}/toggle`);
      return response.data.data;
    } catch (error) {
      throw new Error(msg(error, "Error al cambiar el estado del usuario"));
    }
  }

  static async resetearPassword(id: string): Promise<string> {
    try {
      const response = await api.post<{ success: boolean; passwordTemporal: string }>(
        `/admin/usuarios/${id}/reset-password`
      );
      return response.data.passwordTemporal;
    } catch (error) {
      throw new Error(msg(error, "Error al resetear la contraseña"));
    }
  }
}

// ─── Servicio de auditoría ─────────────────────────────────────
export class AuditoriaApiService {
  static async listar(filtros: FiltrosAuditoria = {}): Promise<{ data: RegistroAuditoria[]; paginacion: PaginacionAuditoria }> {
    try {
      const response = await api.get<{ success: boolean; data: RegistroAuditoria[]; paginacion: PaginacionAuditoria }>(
        "/admin/auditoria",
        { params: filtros }
      );
      return { data: response.data.data ?? [], paginacion: response.data.paginacion };
    } catch (error) {
      throw new Error(msg(error, "Error al cargar la auditoría"));
    }
  }

  static async opciones(): Promise<{ entidades: string[]; acciones: string[] }> {
    try {
      const response = await api.get<{ success: boolean; data: { entidades: string[]; acciones: string[] } }>(
        "/admin/auditoria/opciones"
      );
      return response.data.data ?? { entidades: [], acciones: [] };
    } catch {
      return { entidades: [], acciones: [] };
    }
  }
}
