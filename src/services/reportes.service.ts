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

export interface ReporteCitaPorEstado {
  _id: string;      // estado de la cita
  cantidad: number;
}

export interface ReporteCitaPorEspecialidad {
  _id: string;      // nombre de la especialidad
  cantidad: number;
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

  static async examenesMasSolicitados(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ReporteExamenSolicitado[]> {
    try {
      const response = await api.get<{ success: boolean; data: ReporteExamenSolicitado[] }>(
        "/reportes/examenes-mas-solicitados",
        { params: { fechaInicio, fechaFin } }
      );
      return response.data.data ?? [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al obtener reporte de exámenes");
    }
  }

  static async citasPorPeriodo(
    fechaInicio: string,
    fechaFin: string
  ): Promise<ReporteCitaPorEstado[]> {
    try {
      const response = await api.get<{ success: boolean; data: ReporteCitaPorEstado[] }>(
        "/reportes/citas-por-periodo",
        { params: { fechaInicio, fechaFin } }
      );
      return response.data.data ?? [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al obtener reporte de citas");
    }
  }

  static async citasPorEspecialidad(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ReporteCitaPorEspecialidad[]> {
    try {
      const response = await api.get<{ success: boolean; data: ReporteCitaPorEspecialidad[] }>(
        "/reportes/citas-por-especialidad",
        { params: { fechaInicio, fechaFin } }
      );
      return response.data.data ?? [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al obtener reporte por especialidad");
    }
  }
}