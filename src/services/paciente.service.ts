// src/services/paciente.service.ts
import api from './api';

export interface Paciente {
  _id: string;
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  direccion: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PacienteTransformado {
  id: string;
  _id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  edad?: number; // ✅ 
  telefono: string;
  correo: string;
  direccion: string;
}


// ⭐ Type helper para errores
interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// ⭐ Transformar paciente
const transformarPaciente = (paciente: Paciente): PacienteTransformado => ({
  id: paciente._id || paciente.id,
  _id: paciente._id || paciente.id, // ⭐ Mantener _id también
  dni: paciente.dni,
  nombres: paciente.nombres,
  apellidos: paciente.apellidos,
  fechaNacimiento: paciente.fechaNacimiento,
  telefono: paciente.telefono,
  correo: paciente.correo,
  direccion: paciente.direccion,
});

export class PacienteApiService {
  // Crear paciente
  static async crear(datos: Omit<Paciente, '_id' | 'id'>): Promise<PacienteTransformado> {
    try {
      const response = await api.post<{ success: boolean; data: Paciente }>(
        '/pacientes',
        datos
      );

      if (response.data.success && response.data.data) {
        return transformarPaciente(response.data.data);
      }

      throw new Error('Respuesta inesperada del servidor');
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error('❌ Error al crear paciente:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Error al crear paciente');
    }
  }

  // Listar pacientes
  static async listar(): Promise<PacienteTransformado[]> {
    try {
      const response = await api.get<{ success: boolean; data: Paciente[] }>(
        '/pacientes'
      );

      if (response.data.success && response.data.data) {
        return response.data.data.map(transformarPaciente);
      }

      return [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error('❌ Error al listar pacientes:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Error al listar pacientes');
    }
  }

  // Buscar por DNI
  static async buscarPorDni(dni: string): Promise<PacienteTransformado | null> {
    try {
      const response = await api.get<{ success: boolean; data: Paciente }>(
        `/pacientes/dni/${dni}`
      );

      if (response.data.success && response.data.data) {
        return transformarPaciente(response.data.data);
      }

      return null;
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error('❌ Error al buscar paciente:', err.response?.data || err.message);
      return null;
    }
  }
}