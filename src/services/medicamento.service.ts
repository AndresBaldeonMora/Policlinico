// src/services/medicamento.service.ts
import api from "./api";

export interface Medicamento {
  _id: string;
  nombre: string;
  principioActivo: string;
  presentacion: string;
  concentracion?: string;
  formaFarmaceutica?: string;
  viaAdministracion?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicamentoPayload {
  nombre: string;
  principioActivo: string;
  presentacion: string;
  concentracion: string;
  formaFarmaceutica: string;
  viaAdministracion: string;
}

interface AxiosErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

const msg = (error: unknown, fallback: string): string => {
  const err = error as AxiosErrorResponse;
  return err.response?.data?.message || err.message || fallback;
};

export class MedicamentoApiService {
  // todos=true incluye los inactivos (uso del panel admin).
  static async listar(opts?: { q?: string; todos?: boolean }): Promise<Medicamento[]> {
    try {
      const response = await api.get<{ success: boolean; data: Medicamento[] }>("/medicamentos", {
        params: { q: opts?.q || undefined, todos: opts?.todos ? "true" : undefined },
      });
      return response.data.data ?? [];
    } catch (error) {
      throw new Error(msg(error, "Error al listar medicamentos"));
    }
  }

  static async crear(payload: MedicamentoPayload): Promise<Medicamento> {
    try {
      const response = await api.post<{ success: boolean; data: Medicamento }>("/medicamentos", payload);
      return response.data.data;
    } catch (error) {
      throw new Error(msg(error, "Error al crear medicamento"));
    }
  }

  static async actualizar(id: string, payload: Partial<MedicamentoPayload>): Promise<Medicamento> {
    try {
      const response = await api.patch<{ success: boolean; data: Medicamento }>(`/medicamentos/${id}`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(msg(error, "Error al actualizar medicamento"));
    }
  }

  static async toggleActivo(id: string): Promise<Medicamento> {
    try {
      const response = await api.patch<{ success: boolean; data: Medicamento }>(`/medicamentos/${id}/toggle`);
      return response.data.data;
    } catch (error) {
      throw new Error(msg(error, "Error al cambiar el estado del medicamento"));
    }
  }
}
