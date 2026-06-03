// src/services/cita.service.ts
import api from "./api";

export type EstadoCita = "PENDIENTE" | "ASISTIO" | "ATENDIDA" | "CANCELADA" | "REPROGRAMADA";

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
  alergias?: { sustancia: string; reaccion: string; severidad: string }[];
  medicamentosHabituales?: { nombre: string; dosis: string; frecuencia: string; activo: boolean }[];
  problemasMedicos?: { descripcion: string; estado: string; fechaInicio?: string }[];
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
  tipo?: string;
  pacienteId: PacienteDTO;
  doctorId?: DoctorDTO | string;
  notasClinicas?: string;
  createdAt?: string;
}

export interface AuditoriaCita {
  _id: string;
  accion: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  descripcion?: string;
  usuarioNombre?: string;
  timestamp: string;
}

// ── Tipo para el historial del paciente ──────────────────────────────────────
export interface RecetaMedicamento {
  nombre: string;
  dosis: string;
  cantidad: string;
  duracion: string;
  indicaciones?: string;
}
 
export interface ExamenSolicitado {
  nombre: string;
  tipo: string;
  estado?: string;
}
 
export interface CitaHistorial {
  _id: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  medico: string;
  especialidad: string;
  doctorId?: string;
  diagnostico?: string;
  notasMedico?: string;
  recetas?: RecetaMedicamento[];
  examenes?: ExamenSolicitado[];
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

  static async marcarAsistencia(citaId: string): Promise<CitaTransformada> {
    const response = await api.patch<{ success: boolean; data: CitaTransformada; message?: string }>(
      `/citas/${citaId}/marcar-asistencia`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || "Error al confirmar asistencia");
    }
    return response.data.data;
  }

  static async eliminar(citaId: string): Promise<void> {
    const response = await api.delete<{ success: boolean; message?: string }>(
      `/citas/${citaId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || "Error al eliminar la cita");
    }
  }

  static async cancelar(citaId: string, motivoCancelacion: string): Promise<CitaTransformada> {
    const response = await api.put<{ success: boolean; data: CitaTransformada; message?: string }>(
      `/citas/${citaId}/cancelar`,
      { motivoCancelacion }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || "Error al cancelar la cita");
    }
    return response.data.data;
  }

  // ── Historial de citas del paciente ────────────────────────────────────────
  static async obtenerHistorialPaciente(correo: string): Promise<CitaHistorial[]> {
    const res = await api.get<{
      success: boolean;
      total: number;
      data: any[];
    }>(`/citas/historial?correo=${encodeURIComponent(correo)}`);

    const rawCitas: any[] = res.data?.data ?? [];

    return rawCitas.map((c) => {
      const recetas: RecetaMedicamento[] =
        c.medicamentosPrescritos?.map((m: any) => ({
          nombre: m.nombre ?? "Sin nombre",
          dosis: m.dosis ?? "—",
          cantidad: "—",                        // el backend no devuelve cantidad
          duracion: m.duracion ?? "—",
          indicaciones: m.observaciones,
        })) ?? [];

      return {
        _id: String(c._id),
        fecha: c.fechaRaw ?? c.fecha,           // usar fechaRaw para ordenar
        hora: c.hora ?? "—",
        estado: c.estado,
        medico: c.doctor ?? "Sin médico",
        especialidad: c.especialidad ?? "Sin especialidad",
        doctorId: c.doctorId ? String(c.doctorId) : undefined,
        diagnostico: c.diagnostico || undefined,
        notasMedico: c.notasClinicas || undefined,
        recetas,
        examenes: [],                           // el historial no devuelve examenes aún
      };
    });
  }

  // ── Obtener auditoría de una cita ──────────────────────────────────────────
  static async obtenerAuditoria(id: string): Promise<AuditoriaCita[]> {
    const response = await api.get<{ success: boolean; data: AuditoriaCita[] }>(
      `/citas/${id}/auditoria`
    );
    return response.data.data ?? [];
  }

  // ── Actualizar cita (doctor, notas) ────────────────────────────────────────
  static async actualizarCita(id: string, datos: { doctorId?: string; notasClinicas?: string }): Promise<CitaTransformada> {
    const response = await api.patch<{ success: boolean; data: CitaTransformada; message?: string }>(
      `/citas/${id}`,
      datos
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Error al actualizar la cita");
    }
    return response.data.data;
  }
}
