// src/services/doctor.service.ts
import api from './api';

export interface Doctor {
  id: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string;
}

export interface HorarioDisponible {
  hora: string;
  disponible: boolean;
}

export class DoctorApiService {
  // Obtener doctores por especialidad
  static async obtenerPorEspecialidad(especialidadId: string): Promise<Doctor[]> {
    try {
      const response = await api.get<{ success: boolean; data: Doctor[] }>(
        `/doctores/especialidad/${especialidadId}`
      );

      // Validar la respuesta para evitar acceder a datos incorrectos
      if (response.data.success) {
        return response.data.data || [];  // Devuelve los doctores o un array vacío
      } else {
        console.error("Error en la respuesta del servidor", response.data);
        return [];
      }
    } catch (err) {
      console.error("Error al obtener los doctores:", err);
      return []; // Devuelve un arreglo vacío en caso de error
    }
  }

  // Obtener horarios disponibles de un doctor
  static async obtenerHorariosDisponibles(
    doctorId: string,
    fecha: string
  ): Promise<HorarioDisponible[]> {
    try {
      const response = await api.get<{ success: boolean; data: HorarioDisponible[] }>(
        `/doctores/${doctorId}/horarios`,
        { params: { fecha } }
      );

      // Validar la respuesta de horarios
      if (response.data.success) {
        return response.data.data || [];
      } else {
        console.error("Error en la respuesta de horarios", response.data);
        return [];
      }
    } catch (error) {
      console.error('Error al obtener horarios:', error);
      return [];
    }
  }

  // Listar todos los doctores
  static async listar(): Promise<Doctor[]> {
    try {
      const response = await api.get<{ success: boolean; data: Doctor[] }>(
        '/doctores'
      );

      // Validar si la respuesta contiene los datos
      if (response.data.success) {
        return response.data.data || [];
      } else {
        console.error("Error en la respuesta de lista de doctores", response.data);
        return [];
      }
    } catch (error) {
      console.error('Error al listar doctores:', error);
      return [];
    }
  }
}
