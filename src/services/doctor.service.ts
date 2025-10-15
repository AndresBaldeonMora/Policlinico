// ============================================
// src/services/doctor.service.ts
// ============================================
import api from './api';

export interface Doctor {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  cmp: string;
}

export interface HorarioDisponible {
  hora: string;
  disponible: boolean;
}

export class DoctorApiService {
  static async obtenerPorEspecialidad(especialidadId: string): Promise<Doctor[]> {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>(
        `/doctores/especialidad/${especialidadId}`
      );
      
      // Transformar la respuesta para que sea compatible
      const doctores = response.data.data || [];
      return doctores.map(doc => ({
        id: doc.id,
        nombre: doc.nombre,
        apellido: doc.apellido,
        especialidad: doc.especialidad?.nombre || 'Sin especialidad',
        cmp: doc.cmp,
      }));
    } catch (error) {
      console.error('Error al obtener doctores:', error);
      return [];
    }
  }

  static async obtenerHorariosDisponibles(
    doctorId: string,
    fecha: string
  ): Promise<HorarioDisponible[]> {
    try {
      const response = await api.get<{ success: boolean; data: HorarioDisponible[] }>(
        `/doctores/${doctorId}/horarios`,
        { params: { fecha } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener horarios:', error);
      return [];
    }
  }

  static async listar(): Promise<Doctor[]> {
    try {
      const response = await api.get<{ success: boolean; data: Doctor[] }>(
        '/doctores'
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error al listar doctores:', error);
      return [];
    }
  }
}
