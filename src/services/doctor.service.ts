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
  cvUrl?: string; // ✅ Soporte para CV
  cmp?: string; // opcional si lo agregas
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
  cvUrl?: string;
  cmp?: string;
}

export interface HorarioDisponible {
  hora: string;
  disponible: boolean;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const transformarDoctor = (doctor: Doctor): DoctorTransformado => {
  const especialidadPoblada =
    typeof doctor.especialidadId === "object"
      ? (doctor.especialidadId as EspecialidadPoblada)
      : null;

  return {
    id: doctor._id || doctor.id || "",
    nombres: doctor.nombres,
    apellidos: doctor.apellidos,
    correo: doctor.correo,
    telefono: doctor.telefono,
    especialidad: especialidadPoblada?.nombre || "Sin especialidad",
    especialidadId:
      especialidadPoblada?._id ||
      (typeof doctor.especialidadId === "string"
        ? doctor.especialidadId
        : ""),
    cvUrl: doctor.cvUrl || "",
    cmp: doctor.cmp,
  };
};

export class DoctorApiService {
  static async listar(): Promise<DoctorTransformado[]> {
    try {
      const response = await api.get<{ success: boolean; data: Doctor[] }>(
        "/doctores"
      );

      if (response.data.success && response.data.data) {
        return response.data.data.map(transformarDoctor);
      }

      return [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error(
        "❌ Error al listar doctores:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.message || "Error al listar doctores"
      );
    }
  }

  static async obtenerPorEspecialidad(
    especialidadId: string
  ): Promise<DoctorTransformado[]> {
    try {
      const response = await api.get<{ success: boolean; data: Doctor[] }>(
        `/doctores/especialidad/${especialidadId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data.map(transformarDoctor);
      }

      return [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error(
        "❌ Error al obtener doctores por especialidad:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.message ||
          "Error al obtener doctores por especialidad"
      );
    }
  }

  static async obtenerHorariosDisponibles(
    doctorId: string,
    fecha: string
  ): Promise<HorarioDisponible[]> {
    try {
      const response = await api.get<{
        success: boolean;
        data: HorarioDisponible[];
      }>(`/doctores/${doctorId}/horarios`, {
        params: { fecha },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error(
        "❌ Error al obtener horarios disponibles:",
        err.response?.data || err.message
      );
      return [];
    }
  }
}
