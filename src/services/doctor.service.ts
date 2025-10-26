// src/services/doctor.service.ts
import api from './api';

// ⭐ Interface para la especialidad poblada
interface EspecialidadPoblada {
  _id: string;
  nombre: string;
}

// ⭐ Interface del Doctor como viene del backend
export interface Doctor {
  _id: string;
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  especialidadId: EspecialidadPoblada | string; // Puede venir poblada o como ID
  createdAt?: string;
  updatedAt?: string;
}

// ⭐ Interface del Doctor transformado para el frontend
export interface DoctorTransformado {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  especialidad: string;
  especialidadId: string;
}

export interface HorarioDisponible {
  hora: string;
  disponible: boolean;
}

// ⭐ Type helper para errores de Axios
interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// ⭐ Función helper para transformar doctor
const transformarDoctor = (doctor: Doctor): DoctorTransformado => {
  const especialidadPoblada = typeof doctor.especialidadId === 'object' 
    ? doctor.especialidadId 
    : null;

  return {
    id: doctor._id || doctor.id,
    nombres: doctor.nombres,
    apellidos: doctor.apellidos,
    correo: doctor.correo,
    telefono: doctor.telefono,
    especialidad: especialidadPoblada?.nombre || 'Sin especialidad',
    especialidadId: especialidadPoblada?._id || (doctor.especialidadId as string)
  };
};

export class DoctorApiService {
  // Obtener doctores por especialidad
  static async obtenerPorEspecialidad(especialidadId: string): Promise<DoctorTransformado[]> {
    try {
      console.log('🔍 Buscando doctores para especialidad:', especialidadId);
      
      const response = await api.get<{ success: boolean; data: Doctor[] }>(
        `/doctores/especialidad/${especialidadId}`
      );

      console.log('📡 Respuesta del servidor:', response.data);

      if (response.data.success && response.data.data) {
        const doctoresTransformados = response.data.data.map(transformarDoctor);
        console.log('✅ Doctores transformados:', doctoresTransformados);
        return doctoresTransformados;
      }

      console.warn('⚠️ Respuesta sin datos o sin éxito');
      return [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error('❌ Error al obtener doctores:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Error al obtener doctores');
    }
  }

  // Obtener horarios disponibles de un doctor
  static async obtenerHorariosDisponibles(
    doctorId: string,
    fecha: string
  ): Promise<HorarioDisponible[]> {
    try {
      console.log('🔍 Obteniendo horarios para doctor:', doctorId, 'fecha:', fecha);
      
      const response = await api.get<{ success: boolean; data: HorarioDisponible[] }>(
        `/doctores/${doctorId}/horarios`,
        { params: { fecha } }
      );

      console.log('📡 Horarios recibidos:', response.data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error('❌ Error al obtener horarios:', err.response?.data || err.message);
      return [];
    }
  }

  // Listar todos los doctores
  static async listar(): Promise<DoctorTransformado[]> {
    try {
      const response = await api.get<{ success: boolean; data: Doctor[] }>(
        '/doctores'
      );

      if (response.data.success && response.data.data) {
        return response.data.data.map(transformarDoctor);
      }

      return [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error('❌ Error al listar doctores:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Error al listar doctores');
    }
  }
}