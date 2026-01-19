import api from "./api";

// ============================================================================
// ESTADOS
// ============================================================================

export type EstadoCita =
  | "PENDIENTE"
  | "ATENDIDA"
  | "CANCELADA"
  | "REPROGRAMADA";

// ============================================================================
// DTOs
// ============================================================================

export interface CrearCitaDTO {
  pacienteId: string;
  doctorId: string;
  fecha: string;
  hora: string;
}

// ============================================================================
// MODELOS BASE
// ============================================================================

export interface PacienteDTO {
  _id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string;
  correo?: string;
  fechaNacimiento?: string; // ISO string
  edad?: number;            // virtual del backend
}

export interface DoctorDTO {
  _id: string;
  nombres: string;
  apellidos: string;
}

// ============================================================================
// CITA
// ============================================================================

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

// Para listados simples
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

// ✅ ESTA ES LA CLAVE
export interface CitaTransformada {
  _id: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;

  pacienteId: PacienteDTO;
  doctorId?: DoctorDTO;
}

// ============================================================================
// API SERVICE
// ============================================================================

export class CitaApiService {
  static async crear(datos: CrearCitaDTO): Promise<Cita> {
    const response = await api.post<{
      success: boolean;
      data: Cita;
      message?: string;
      error?: string;
    }>("/citas", datos);

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

    const response = await api.get<{
      success: boolean;
      data: CitaTransformada[];
    }>(`/citas/calendario?${params.toString()}`);

    return response.data.data ?? [];
  }

  static async listar(): Promise<CitaProcesada[]> {
    const response = await api.get<{
      success: boolean;
      data: CitaProcesada[];
    }>("/citas");

    return response.data.data ?? [];
  }

  static async reprogramar(
    id: string,
    nuevaFecha: string,
    nuevaHora: string
  ): Promise<void> {
    const response = await api.put<{
      success: boolean;
      message?: string;
    }>(`/citas/${id}/reprogramar`, {
      fecha: nuevaFecha,
      hora: nuevaHora,
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Error al reprogramar cita");
    }
  }

  static async obtenerPorId(id: string): Promise<CitaTransformada> {
    const response = await api.get<{
      success: boolean;
      data: CitaTransformada;
      message?: string;
    }>(`/citas/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "No se pudo obtener la cita");
    }

    return response.data.data;
  }
}
