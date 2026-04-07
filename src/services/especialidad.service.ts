// ============================================
// src/services/especialidad.service.ts
// ============================================
import api from './api';

export interface ExamenResumen {
  _id: string;
  nombre: string;
  tipo: string;
}

export interface Especialidad {
  id: string;
  nombre: string;
  tieneLaboratorio: boolean;
  descripcion?: string;
  examenes: ExamenResumen[];
}

export class EspecialidadApiService {
  static async listar(): Promise<Especialidad[]> {
    try {
      const response = await api.get<{ success: boolean; data: Especialidad[] }>(
        '/especialidades'
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error al listar especialidades:', error);
      return [];
    }
  }

  static async buscar(termino: string): Promise<Especialidad[]> {
    try {
      const response = await api.get<{ success: boolean; data: Especialidad[] }>(
        '/especialidades/buscar',
        { params: { q: termino } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error al buscar especialidades:', error);
      return [];
    }
  }
  static async crear(payload: { nombre: string; tieneLaboratorio: boolean; examenes?: string[];  }): Promise<Especialidad> {
    try {
      const response = await api.post<{ success: boolean; data: Especialidad }>("/especialidades", payload);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || "Error al crear especialidad");
    }
  }

  static async actualizar(id: string, payload: Partial<{ nombre: string; tieneLaboratorio: boolean ; examenes: string[] }>): Promise<Especialidad> {
    try {
      const response = await api.patch<{ success: boolean; data: Especialidad }>(`/especialidades/${id}`, payload);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || "Error al actualizar especialidad");
    }
  }

  static async eliminar(id: string): Promise<void> {
    try {
      await api.delete(`/especialidades/${id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || "Error al eliminar especialidad");
    }
  }
}
