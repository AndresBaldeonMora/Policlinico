// src/services/cita.service.ts
import api from './api';

export interface Cita {
  _id?: string;
  id?: string;
  pacienteId: string;
  doctorId: string;
  fecha: Date | string;
  hora: string;
  estado?: 'pendiente' | 'completada' | 'cancelada';
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearCitaDTO {
  pacienteId: string;
  doctorId: string;
  fecha: string; // "2025-10-17"
  hora: string;  // "08:00"
}

export interface CitaPopulada extends Omit<Cita, 'pacienteId' | 'doctorId'> {
  paciente: {
    _id: string;
    nombres: string;
    apellidos: string;
    dni: string;
  };
  doctor: {
    _id: string;
    nombres: string;
    apellidos: string;
    especialidadId: {
      _id: string;
      nombre: string;
    };
  };
}

export class CitaApiService {
  // Crear nueva cita
  static async crear(datos: CrearCitaDTO): Promise<Cita> {
    try {
      console.log('📤 Enviando datos de cita:', datos);

      // ⭐ Convertir fecha a formato ISO completo
      const fechaISO = new Date(datos.fecha).toISOString();

      const payload = {
        pacienteId: datos.pacienteId,
        doctorId: datos.doctorId,
        fecha: fechaISO,  // ⭐ Enviar como ISO
        hora: datos.hora
      };

      console.log('📦 Payload procesado:', payload);

      const response = await api.post<{ success: boolean; data: Cita }>(
        '/citas',
        payload
      );

      console.log('✅ Cita creada:', response.data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Respuesta inesperada del servidor');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error al crear cita:', error.message);
        throw error;
      }
      
      const err = error as { 
        response?: { 
          data?: { message?: string; error?: string }; 
          status?: number 
        }; 
        message?: string 
      };
      
      console.error('❌ Error al crear cita:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      throw new Error(
        err.response?.data?.message || 
        err.response?.data?.error ||
        err.message || 
        'Error al crear la cita'
      );
    }
  }

  // Listar todas las citas (con populate)
  static async listar(): Promise<CitaPopulada[]> {
    try {
      const response = await api.get<{ success: boolean; data: CitaPopulada[] }>(
        '/citas'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('❌ Error al listar citas:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Error al listar citas');
    }
  }

  // Eliminar cita
  static async eliminar(id: string): Promise<void> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/citas/${id}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar cita');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('❌ Error al eliminar cita:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Error al eliminar la cita');
    }
  }

  // Obtener citas por paciente
  static async obtenerPorPaciente(pacienteId: string): Promise<CitaPopulada[]> {
    try {
      const response = await api.get<{ success: boolean; data: CitaPopulada[] }>(
        `/citas/paciente/${pacienteId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('❌ Error al obtener citas del paciente:', err.response?.data || err.message);
      return [];
    }
  }

  // Obtener citas por doctor
  static async obtenerPorDoctor(doctorId: string): Promise<CitaPopulada[]> {
    try {
      const response = await api.get<{ success: boolean; data: CitaPopulada[] }>(
        `/citas/doctor/${doctorId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('❌ Error al obtener citas del doctor:', err.response?.data || err.message);
      return [];
    }
  }
}