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
        `/doctores/${doctorId}/horarios-disponibles`,
        { params: { fecha } }
      );
      return response.data.success ? response.data.data : [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      console.error("Error al obtener horarios disponibles:", err.response?.data || err.message);
      return [];
    }
  }

  static async crear(payload: {
    nombres: string;
    apellidos: string;
    correo: string;
    telefono: string;
    especialidadId: string;
    cmp?: string;
  }): Promise<DoctorTransformado> {
    try {
      const response = await api.post<{ success: boolean; data: Doctor }>("/doctores", payload);
      return transformarDoctor(response.data.data);
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al crear doctor");
    }
  }

  static async actualizar(id: string, payload: Partial<{
    nombres: string;
    apellidos: string;
    correo: string;
    telefono: string;
    especialidadId: string;
    cmp: string;
  }>): Promise<DoctorTransformado> {
    try {
      const response = await api.patch<{ success: boolean; data: Doctor }>(`/doctores/${id}`, payload);
      return transformarDoctor(response.data.data);
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al actualizar doctor");
    }
  }

  static async eliminar(id: string): Promise<void> {
    await api.delete(`/doctores/${id}`);
    // try {
    //   await api.delete(`/doctores/${id}`);
    // } catch (error: unknown) {
    //   const err = error as AxiosErrorResponse;
    //   throw new Error(err.response?.data?.message || "Error al eliminar doctor");
    // }
  }
}

