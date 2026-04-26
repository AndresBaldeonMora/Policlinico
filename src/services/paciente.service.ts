// src/services/paciente.service.ts
import api from "./api";

export interface Paciente {
  _id: string;
  id?: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo?: string;
  estadoCivil?: string;
  telefono: string;
  correo: string;
  direccion: string;
  distrito?: string;
  apoderadoNombre?: string;
  apoderadoParentesco?: string;
  apoderadoTelefono?: string;
  edad?: number;
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
  sexo?: string;
  estadoCivil?: string;
  telefono: string;
  correo: string;
  direccion: string;
  distrito?: string;
  apoderadoNombre?: string;
  apoderadoParentesco?: string;
  apoderadoTelefono?: string;
  edad?: number;
}

interface AxiosErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

const transformarPaciente = (p: Paciente): PacienteTransformado => ({
  id: p._id || p.id || "",
  _id: p._id || p.id || "",
  dni: p.dni,
  nombres: p.nombres,
  apellidos: p.apellidos,
  fechaNacimiento: p.fechaNacimiento,
  sexo: p.sexo,
  estadoCivil: p.estadoCivil,
  telefono: p.telefono,
  correo: p.correo,
  direccion: p.direccion,
  distrito: p.distrito,
  apoderadoNombre: p.apoderadoNombre,
  apoderadoParentesco: p.apoderadoParentesco,
  apoderadoTelefono: p.apoderadoTelefono,
  edad: p.edad,
});

export class PacienteApiService {
  static async crear(
    datos: Omit<Paciente, "_id" | "id" | "edad">
  ): Promise<PacienteTransformado> {
    try {
      const response = await api.post<{ success: boolean; data: Paciente }>(
        "/pacientes",
        datos
      );
      if (response.data.success && response.data.data) {
        return transformarPaciente(response.data.data);
      }
      throw new Error("Respuesta inesperada del servidor");
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al crear paciente");
    }
  }

  static async actualizar(
    id: string,
    datos: Partial<Omit<Paciente, "_id" | "id" | "edad">>
  ): Promise<PacienteTransformado> {
    try {
      const response = await api.put<{ success: boolean; data: Paciente }>(
        `/pacientes/${id}`,
        datos
      );
      if (response.data.success && response.data.data) {
        return transformarPaciente(response.data.data);
      }
      throw new Error("Respuesta inesperada del servidor");
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al actualizar paciente");
    }
  }
  
  static async eliminar(id: string): Promise<void> {
    try {
      await api.delete(`/pacientes/${id}`);
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al eliminar paciente");
    }
  }

  static async listar(): Promise<PacienteTransformado[]> {
    try {
      const response = await api.get<{ success: boolean; data: Paciente[] }>(
        "/pacientes"
      );
      if (response.data.success && response.data.data) {
        return response.data.data.map(transformarPaciente);
      }
      return [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al listar pacientes");
    }
  }

  static async obtenerHistorial(id: string, citasPagina = 1, ordenesPagina = 1): Promise<any> {
    const params = new URLSearchParams({ citasPagina: String(citasPagina), ordenesPagina: String(ordenesPagina) });
    const response = await api.get<{ success: boolean; data: any }>(
      `/pacientes/${id}/historial?${params.toString()}`
    );
    return response.data.data;
  }

  static async buscarPorDni(dni: string): Promise<PacienteTransformado | null> {
    try {
      const response = await api.get<{ success: boolean; data: Paciente }>(
        `/pacientes/dni/${dni}`
      );
      if (response.data.success && response.data.data) {
        return transformarPaciente(response.data.data);
      }
      return null;
    } catch {
      return null;
    }
  }

  static async obtenerHistorialPorCorreo(correo: string): Promise<any> {
    const res = await api.get(
      `/pacientes/correo/${encodeURIComponent(correo)}/historial`
    );
    return res.data.data;
  }
}
