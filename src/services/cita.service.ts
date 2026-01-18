import api from "./api";

export type EstadoCita = "PENDIENTE" | "ATENDIDA" | "CANCELADA" | "REPROGRAMADA";

export interface CrearCitaDTO {
  pacienteId: string;
  doctorId: string;
  fecha: string;
  hora: string;
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
}

export interface CitaTransformada {
  _id: string;
  pacienteId: {
    _id?: string;
    nombres: string;
    apellidos: string;
    dni: string;
    telefono?: string;
  } | null;
  doctorId: {
    _id: string;
    nombres: string;
    apellidos: string;
  } | null;
  fecha: string;
  hora: string;
  estado: EstadoCita;
}

export class CitaApiService {
  static async crear(datos: CrearCitaDTO): Promise<Cita> {
    try {
      const payload = {
        pacienteId: datos.pacienteId,
        doctorId: datos.doctorId,
        fecha: datos.fecha,
        hora: datos.hora,
      };

      const response = await api.post<{ success: boolean; data: Cita; message?: string; error?: string }>(
        "/citas",
        payload
      );

      if (response.data.success && response.data.data) return response.data.data;

      throw new Error(response.data.message || response.data.error || "Respuesta inesperada del servidor");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };

      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Error al crear la cita"
      );
    }
  }

  static async obtenerCalendario(
    fecha: string,
    vista: "dia" | "semana" | "mes",
    medicoId?: string
  ): Promise<CitaTransformada[]> {
    const params = new URLSearchParams({ fecha, vista });
    if (medicoId && medicoId !== "ALL") params.set("medicoId", medicoId);

    const r = await api.get<{ success: boolean; data: CitaTransformada[]; message?: string }>(
      `/citas/calendario?${params.toString()}`
    );

    return r.data.data || [];
  }

  static async listar(): Promise<CitaProcesada[]> {
    try {
      const response = await api.get<{ success: boolean; data: CitaProcesada[]; message?: string }>(
        "/citas"
      );
      if (response.data.success && response.data.data) return response.data.data;
      return [];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || err.message || "Error al listar citas");
    }
  }

  static async reprogramar(id: string, nuevaFecha: string, nuevaHora: string): Promise<void> {
    try {
      const payload = { fecha: nuevaFecha, hora: nuevaHora };

      const response = await api.put<{ success: boolean; message?: string }>(
        `/citas/${id}/reprogramar`,
        payload
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Error al reprogramar cita");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(err.response?.data?.message || err.message || "Error al reprogramar cita");
    }
  }
}
