import api from "./api";

export type TicketEstado    = "ABIERTO" | "EN_REVISION" | "RESUELTO" | "CERRADO";
export type TicketPrioridad = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
export type TicketCategoria =
  | "ERROR_SISTEMA" | "ACCESO_USUARIO" | "PROBLEMA_CITAS"
  | "PROBLEMA_HISTORIAL" | "LENTITUD" | "DATOS_INCORRECTOS" | "OTRO";

export interface Comentario {
  _id: string;
  autorId: string;
  autorNombre: string;
  autorRol: string;
  texto: string;
  creadoEn: string;
}

export interface Ticket {
  _id: string;
  numero: number;
  titulo: string;
  descripcion: string;
  categoria: TicketCategoria;
  prioridad: TicketPrioridad;
  estado: TicketEstado;
  creadoPorId: string;
  creadoPorNombre: string;
  asignadoAId?: string;
  asignadoANombre?: string;
  comentarios: Comentario[];
  resolucion?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface TicketResumen {
  abiertos: number;
  enRevision: number;
  resueltos: number;
  criticos: number;
  recientes: Omit<Ticket, "comentarios">[];
}

export const CATEGORIAS: Record<TicketCategoria, string> = {
  ERROR_SISTEMA:      "Error del sistema",
  ACCESO_USUARIO:     "Acceso / Credenciales",
  PROBLEMA_CITAS:     "Problema con citas",
  PROBLEMA_HISTORIAL: "Historial clínico",
  LENTITUD:           "Lentitud / Rendimiento",
  DATOS_INCORRECTOS:  "Datos incorrectos",
  OTRO:               "Otro",
};

export const PRIORIDADES: Record<TicketPrioridad, string> = {
  BAJA: "Baja", MEDIA: "Media", ALTA: "Alta", CRITICA: "Crítica",
};

export const ESTADOS: Record<TicketEstado, string> = {
  ABIERTO: "Abierto", EN_REVISION: "En revisión", RESUELTO: "Resuelto", CERRADO: "Cerrado",
};

export class TicketService {
  static async listar(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await api.get<{ success: boolean; data: Ticket[]; total: number; pages: number }>(`/tickets${qs}`);
    return res.data;
  }

  static async obtener(id: string): Promise<Ticket> {
    const res = await api.get<{ success: boolean; data: Ticket }>(`/tickets/${id}`);
    return res.data.data;
  }

  static async crear(payload: { titulo: string; descripcion: string; categoria: TicketCategoria; prioridad: TicketPrioridad }): Promise<Ticket> {
    const res = await api.post<{ success: boolean; data: Ticket }>("/tickets", payload);
    return res.data.data;
  }

  static async actualizar(id: string, payload: Partial<{ estado: TicketEstado; prioridad: TicketPrioridad; resolucion: string }>): Promise<Ticket> {
    const res = await api.patch<{ success: boolean; data: Ticket }>(`/tickets/${id}`, payload);
    return res.data.data;
  }

  static async comentar(id: string, texto: string): Promise<Ticket> {
    const res = await api.post<{ success: boolean; data: Ticket }>(`/tickets/${id}/comentarios`, { texto });
    return res.data.data;
  }

  static async resumen(): Promise<TicketResumen> {
    const res = await api.get<{ success: boolean; data: TicketResumen }>("/tickets/resumen");
    return res.data.data;
  }
}
