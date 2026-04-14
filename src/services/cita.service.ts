// src/services/cita.service.ts
import api from "./api";

export type EstadoCita = "PENDIENTE" | "ATENDIDA" | "CANCELADA" | "REPROGRAMADA";

export interface CrearCitaDTO {
  pacienteId: string;
  doctorId: string;
  fecha: string;
  hora: string;
}

export interface PacienteDTO {
  _id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string;
  correo?: string;
  fechaNacimiento?: string;
  edad?: number;
}

export interface DoctorDTO {
  _id: string;
  nombres: string;
  apellidos: string;
  especialidadId?: { _id: string; nombre: string; tieneLaboratorioImagen?: boolean } | string;
}

export interface Cita {
  _id: string;
  pacienteId: string;
  doctorId: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  createdAt?: string;
  updatedAt?: string;
}

export interface CitaProcesada {
  _id: string;
  id: number;
  dni: string;
  paciente: string;
  doctor: string;
  doctorId: string;
  especialidad: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  tipo?: "CONSULTA" | "LABORATORIO" | "REMOTA" | "DOMICILIO";
}

export interface CitaTransformada {
  _id: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  pacienteId: PacienteDTO;
  doctorId?: DoctorDTO | string;
}

export const getDoctorIdString = (doctorId?: DoctorDTO | string): string => {
  if (!doctorId) return "";
  if (typeof doctorId === "string") return doctorId;
  return doctorId._id;
};

export class CitaApiService {
  static async crear(datos: CrearCitaDTO): Promise<Cita> {
    const response = await api.post<{ success: boolean; data: Cita; message?: string }>(
      "/citas", datos
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Error al crear la cita");
    }
    return response.data.data;
  }

  static async obtenerCalendario(
    fecha: string,
    vista: "dia" | "semana" | "mes",
    medicoId?: string
  ): Promise<CitaTransformada[]> {
    const params = new URLSearchParams({ fecha, vista });
    if (medicoId && medicoId !== "ALL") params.set("medicoId", medicoId);
    const response = await api.get<{ success: boolean; data: CitaTransformada[] }>(
      `/citas/calendario?${params.toString()}`
    );
    return response.data.data ?? [];
  }

  static async listar(): Promise<CitaProcesada[]> {
    const response = await api.get<{ success: boolean; data: CitaProcesada[] }>("/citas");
    return response.data.data ?? [];
  }

  static async reprogramar(id: string, nuevaFecha: string, nuevaHora: string): Promise<void> {
    const response = await api.put<{ success: boolean; message?: string }>(
      `/citas/${id}/reprogramar`, { fecha: nuevaFecha, hora: nuevaHora }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || "Error al reprogramar cita");
    }
  }

  static async obtenerPorId(id: string): Promise<CitaTransformada> {
    const response = await api.get<{ success: boolean; data: CitaTransformada; message?: string }>(
      `/citas/${id}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "No se pudo obtener la cita");
    }
    return response.data.data;
  }

  static async cambiarEstado(id: string, estado: EstadoCita): Promise<void> {
    const response = await api.patch<{ success: boolean; message?: string }>(
      `/citas/${id}/estado`,
      { estado }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || "Error al cambiar estado de la cita");
    }
  }
}
