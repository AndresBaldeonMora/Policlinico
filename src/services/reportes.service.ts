// src/services/reportes.service.ts
import api from "./api";

// ─── Interfaces ───────────────────────────────────────────────

export interface ReporteOrdenPorEstado {
  _id: string;
  cantidad: number;
}

export interface ReporteExamenSolicitado {
  _id: string;
  total: number;
}

interface AxiosErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

// ─── Service ──────────────────────────────────────────────────

export class ReportesApiService {
  static async ordenesPorPeriodo(
    fechaInicio: string,
    fechaFin: string
  ): Promise<ReporteOrdenPorEstado[]> {
    try {
      const response = await api.get<{ success: boolean; data: ReporteOrdenPorEstado[] }>(
        "/reportes/ordenes-por-periodo",
        { params: { fechaInicio, fechaFin } }
      );
      return response.data.data ?? [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al obtener reporte de órdenes");
    }
  }

  static async examenesMasSolicitados(): Promise<ReporteExamenSolicitado[]> {
    try {
      const response = await api.get<{ success: boolean; data: ReporteExamenSolicitado[] }>(
        "/reportes/examenes-mas-solicitados"
      );
      return response.data.data ?? [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al obtener reporte de exámenes");
    }
  }
}