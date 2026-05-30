import api from "./api";

export type PrioridadInterconsulta = "urgente" | "preferente" | "electiva";
export type EstadoInterconsulta =
  | "PENDIENTE"
  | "RESPONDIDA"
  | "CITADA"
  | "ATENDIDA"
  | "CANCELADA";

export interface CitaGeneradaRef {
  _id: string;
  fecha: string;
  hora?: string;
  estado: string;
  tipo: string;
}

export interface PacienteRef {
  _id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  fechaNacimiento?: string;
}

export interface DoctorRef {
  _id: string;
  nombres: string;
  apellidos: string;
}

export interface Interconsulta {
  _id: string;
  pacienteId: PacienteRef;
  citaId?: string;
  solicitanteId: DoctorRef;
  solicitanteNombre: string;
  especialidadSolicitada: string;
  medicoSolicitado?: string;
  destinatarioId?: string;
  prioridad: PrioridadInterconsulta;
  motivoConsulta: string;
  preguntaClinica?: string;
  informacionRelevante?: string;
  estado: EstadoInterconsulta;
  respuesta?: string;
  respondidoPorId?: DoctorRef;
  respondidoPorNombre?: string;
  fechaRespuesta?: string;
  citaGeneradaId?: CitaGeneradaRef | string;
  createdAt?: string;
}

export interface AgendarCitaPayload {
  fecha: string;        // "YYYY-MM-DD"
  hora: string;         // "HH:MM"
  respuesta?: string;
}

export interface CrearInterconsultaPayload {
  pacienteId: string;
  citaId?: string;
  especialidadSolicitada: string;
  medicoSolicitado?: string;
  prioridad: PrioridadInterconsulta;
  motivoConsulta: string;
  preguntaClinica?: string;
  informacionRelevante?: string;
}

export class InterconsultaApiService {
  static async crear(payload: CrearInterconsultaPayload): Promise<Interconsulta> {
    const res = await api.post<{ success: boolean; data: Interconsulta }>("/interconsultas", payload);
    return res.data.data;
  }

  static async listarRecibidas(estado?: EstadoInterconsulta | "PROCESADAS"): Promise<Interconsulta[]> {
    const params = estado ? `?estado=${estado}` : "";
    const res = await api.get<{ success: boolean; data: Interconsulta[] }>(`/interconsultas/recibidas${params}`);
    return res.data.data ?? [];
  }

  static async listarEnviadas(): Promise<Interconsulta[]> {
    const res = await api.get<{ success: boolean; data: Interconsulta[] }>("/interconsultas/enviadas");
    return res.data.data ?? [];
  }

  static async listarPorPaciente(pacienteId: string): Promise<Interconsulta[]> {
    const res = await api.get<{ success: boolean; data: Interconsulta[] }>(`/interconsultas/paciente/${pacienteId}`);
    return res.data.data ?? [];
  }

  static async responder(id: string, respuesta: string): Promise<Interconsulta> {
    const res = await api.patch<{ success: boolean; data: Interconsulta }>(
      `/interconsultas/${id}/responder`,
      { respuesta }
    );
    return res.data.data;
  }

  static async obtenerPorId(id: string): Promise<Interconsulta> {
    const res = await api.get<{ success: boolean; data: Interconsulta }>(
      `/interconsultas/${id}`
    );
    return res.data.data;
  }

  static async agendarCita(id: string, payload: AgendarCitaPayload): Promise<Interconsulta> {
    const res = await api.post<{ success: boolean; data: Interconsulta }>(
      `/interconsultas/${id}/agendar`,
      payload
    );
    return res.data.data;
  }
}
