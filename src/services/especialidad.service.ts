// ============================================
// src/services/especialidad.service.ts
// ============================================
import api from './api';

export interface Especialidad {
  id: string;
  nombre: string;
  descripcion?: string;
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
}