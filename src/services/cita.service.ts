// ============================================
// src/services/cita.service.ts
// ============================================
import api from './api';

export interface Cita {
  id: string;
  pacienteId: string;
  doctorId: string;
  fecha: string;
  hora: string;
  paciente?: {
    nombres: string;
    apellidos: string;
    dni: string;
  };
  doctor?: {
    nombres: string;
    apellidos: string;
    especialidad: string;
  };
}

export class CitaApiService {
  static async crear(cita: {
    pacienteId: string;
    doctorId: string;
    fecha: string;
    hora: string;
  }): Promise<Cita | null> {
    try {
      const response = await api.post<{ success: boolean; data: Cita }>(
        '/citas',
        cita
      );
      return response.data.data || null;
    } catch (error) {
      console.error('Error al crear cita:', error);
      throw error;
    }
  }

  static async listar(): Promise<Cita[]> {
    try {
      const response = await api.get<{ success: boolean; data: Cita[] }>(
        '/citas'
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error al listar citas:', error);
      return [];
    }
  }

  static async obtenerDelDia(): Promise<Cita[]> {
    try {
      const response = await api.get<{ success: boolean; data: Cita[] }>(
        '/citas/hoy'
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener citas del día:', error);
      return [];
    }
  }

  static async cancelar(citaId: string): Promise<boolean> {
    try {
      await api.patch(`/citas/${citaId}/cancelar`);
      return true;
    } catch (error) {
      console.error('Error al cancelar cita:', error);
      return false;
    }
  }
}