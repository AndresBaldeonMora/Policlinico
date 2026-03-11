// src/services/doctor.service.ts
import api from "./api";

interface EspecialidadPoblada {
  _id: string;
  nombre: string;
}

export interface Doctor {
  _id: string;
  id?: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  especialidadId: EspecialidadPoblada | string;
  cmp?: string;
  supabaseId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorTransformado {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  especialidad: string;
  especialidadId: string;
  cmp?: string;
  supabaseId?: string;
}

export interface HorarioDisponible {
  hora: string;
  disponible: boolean;
}

interface AxiosErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

const transformarDoctor = (doctor: Doctor): DoctorTransformado => {
  const esp = typeof doctor.especialidadId === "object"
    ? (doctor.especialidadId as EspecialidadPoblada)
    : null;

  return {
    id: doctor._id || doctor.id || "",
    nombres: doctor.nombres,
    apellidos: doctor.apellidos,
    correo: doctor.correo,
    telefono: doctor.telefono,
    especialidad: esp?.nombre || "Sin especialidad",
    especialidadId: esp?._id || (typeof doctor.especialidadId === "string" ? doctor.especialidadId : ""),
    cmp: doctor.cmp,
    supabaseId: doctor.supabaseId,
  };
};

export class DoctorApiService {
  static async listar(): Promise<DoctorTransformado[]> {
    try {
      const response = await api.get<{ success: boolean; data: Doctor[] }>("/doctores");
      return response.data.success ? response.data.data.map(transformarDoctor) : [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al listar doctores");
    }
  }

  static async obtenerPorEspecialidad(especialidadId: string): Promise<DoctorTransformado[]> {
    try {
      const response = await api.get<{ success: boolean; data: Doctor[] }>(
        `/doctores/especialidad/${especialidadId}`
      );
      return response.data.success ? response.data.data.map(transformarDoctor) : [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al obtener doctores por especialidad");
    }
  }

  static async obtenerHorariosDisponibles(doctorId: string, fecha: string): Promise<HorarioDisponible[]> {
    try {
      const response = await api.get<{ success: boolean; data: HorarioDisponible[] }>(
        `/doctores/${doctorId}/horarios-disponibles`, // ✅ corregido
        { params: { fecha } }
      );
      return response.data.success ? response.data.data : [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error("❌ Error al obtener horarios disponibles:", err.response?.data || err.message);
      return [];
    }
  }
}