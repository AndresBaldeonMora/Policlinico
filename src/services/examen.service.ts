import api from "./api";

// ── Tipos del catálogo ──────────────────────────────────────
export type TipoExamen =
  | "HEMATOLOGIA"
  | "BIOQUIMICA"
  | "ORINA"
  | "HECES"
  | "MICROBIOLOGIA"
  | "INMUNOLOGIA"
  | "HORMONAS"
  | "IMAGEN"
  | "OTRO";

export interface ExamenLaboratorio {
  _id: string;
  nombre: string;
  tipo: TipoExamen;
  descripcion?: string;
  instrucciones?: string;
  validezDias?: number;
  activo: boolean;
}

// ── Tipos de órdenes ────────────────────────────────────────
export type EstadoOrden = "PENDIENTE" | "EN_PROCESO" | "COMPLETADO" | "CANCELADA" | "VENCIDA";
export type EstadoItem  = "PENDIENTE" | "COMPLETADO";

export interface ItemOrden {
  examenId: ExamenLaboratorio | string;
  observaciones?: string;
  valorResultado?: string;
  unidadResultado?: string;
  fechaResultado?: string;
  estadoItem: EstadoItem;
}

export interface OrdenExamen {
  _id: string;
  pacienteId: { _id: string; nombres: string; apellidos: string; dni: string; fechaNacimiento?: string; sexo?: string };
  doctorId:   { _id: string; nombres: string; apellidos: string; cmp?: string };
  citaId?:    string;
  especialidadId: { _id: string; nombre: string };
  codigoOrden?: string;
  fechaVencimiento?: string;
  citaLabId?: string;
  motivoVencimiento?: string;
  items: ItemOrden[];
  estado: EstadoOrden;
  observacionesGenerales?: string;
  fecha: string;
  createdAt?: string;
}

// ── Cita de laboratorio generada ────────────────────────────
export interface CitaLab {
  _id: string;
  pacienteId: string;
  fecha: string;
  fechaVigenciaHasta: string;
  instrucciones?: string;
  tipo: "LABORATORIO";
  estado: string;
}

// ── Servicio ────────────────────────────────────────────────
export class ExamenService {
  // Catálogo
  static async listarExamenes(tipo?: TipoExamen): Promise<ExamenLaboratorio[]> {
    const params = new URLSearchParams({ activo: "true" });
    if (tipo) params.set("tipo", tipo);
    const res = await api.get<{ success: boolean; data: ExamenLaboratorio[] }>(
      `/examenes?${params.toString()}`
    );
    return res.data.data ?? [];
  }

  // Órdenes
  static async crearOrden(payload: {
    pacienteId: string;
    doctorId: string;
    citaId?: string;
    especialidadId: string;
    observacionesGenerales?: string;
    items: { examenId: string; observaciones?: string }[];
  }): Promise<OrdenExamen> {
    const res = await api.post<{ success: boolean; data: OrdenExamen }>("/ordenes", payload);
    return res.data.data;
  }

  static async listarOrdenesPorCita(citaId: string): Promise<OrdenExamen[]> {
    const res = await api.get<{ success: boolean; data: OrdenExamen[] }>(
      `/ordenes/cita/${citaId}`
    );
    return res.data.data ?? [];
  }

  static async listarOrdenesPorPaciente(pacienteId: string): Promise<OrdenExamen[]> {
    const res = await api.get<{ success: boolean; data: OrdenExamen[] }>(
      `/ordenes/paciente/${pacienteId}`
    );
    return res.data.data ?? [];
  }

  static async listarOrdenesPendientes(): Promise<OrdenExamen[]> {
    const res = await api.get<{ success: boolean; data: OrdenExamen[] }>("/ordenes/pendientes");
    return res.data.data ?? [];
  }

  static async obtenerOrden(id: string): Promise<OrdenExamen> {
    const res = await api.get<{ success: boolean; data: OrdenExamen }>(`/ordenes/${id}`);
    return res.data.data;
  }

  static async cargarResultados(
    ordenId: string,
    resultados: { examenId: string; valorResultado: string; unidadResultado?: string }[]
  ): Promise<OrdenExamen> {
    const res = await api.patch<{ success: boolean; data: OrdenExamen }>(
      `/ordenes/${ordenId}/resultados`,
      { resultados }
    );
    return res.data.data;
  }

  static async cancelarOrden(ordenId: string): Promise<void> {
    await api.patch(`/ordenes/${ordenId}/cancelar`);
  }

  static async actualizarOrden(
    ordenId: string,
    items: { examenId: string; observaciones?: string }[],
    observacionesGenerales?: string
  ): Promise<OrdenExamen> {
    const res = await api.patch<{ success: boolean; data: OrdenExamen }>(
      `/ordenes/${ordenId}`,
      { items, observacionesGenerales }
    );
    return res.data.data;
  }

  static async buscarPorCodigo(codigo: string): Promise<OrdenExamen> {
    const res = await api.get<{ success: boolean; data: OrdenExamen }>(
      `/ordenes/buscar?codigo=${encodeURIComponent(codigo)}`
    );
    return res.data.data;
  }

  static async listarSinCitaLab(): Promise<OrdenExamen[]> {
    const res = await api.get<{ success: boolean; data: OrdenExamen[] }>("/ordenes/sin-cita-lab");
    return res.data.data ?? [];
  }

  static async generarCitaLab(ordenId: string): Promise<{ orden: OrdenExamen; citaLab: CitaLab }> {
    const res = await api.patch<{ success: boolean; data: OrdenExamen; citaLab: CitaLab }>(
      `/ordenes/${ordenId}/generar-cita-lab`,
      {}
    );
    return { orden: res.data.data, citaLab: res.data.citaLab };
  }

  static async obtenerParaImprimir(ordenId: string): Promise<{
    orden: OrdenExamen;
    policlinico: { nombre: string; direccion: string; telefono: string };
  }> {
    const res = await api.get<{
      success: boolean;
      data: {
        orden: OrdenExamen;
        policlinico: { nombre: string; direccion: string; telefono: string };
      };
    }>(`/ordenes/${ordenId}/imprimir`);
    return res.data.data;
  }
}

export const TIPO_EXAMEN_LABEL: Record<TipoExamen, string> = {
  HEMATOLOGIA:   "Hematología",
  BIOQUIMICA:    "Bioquímica",
  ORINA:         "Orina",
  HECES:         "Heces",
  MICROBIOLOGIA: "Microbiología",
  INMUNOLOGIA:   "Inmunología / Serología",
  HORMONAS:      "Hormonas",
  IMAGEN:        "Imagen / Ecografía",
  OTRO:          "Otro",
};
