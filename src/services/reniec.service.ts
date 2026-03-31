// src/services/reniec.service.ts
import api from "./api";

export interface ReniecData {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

export class ReniecService {
  static async buscarPorDNI(dni: string): Promise<ReniecData> {
    try {
      const response = await api.get<{ success: boolean; data: ReniecData }>(
        `/reniec/${dni}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("No se encontraron datos para el DNI");
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;

      // 🔍 Manejo adecuado del error 404
      if (err.response?.status === 404) {
        throw new Error("DNI no encontrado en RENIEC");
      }

      // 🔍 Otros errores de API
      throw new Error(
        err.response?.data?.message || err.message || "Error al consultar DNI"
      );
    }
  }
}
