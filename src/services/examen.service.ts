import api from "./api";
import type { OrdenDetalle, HistorialEstadoOrden } from "../types/orden.types";// ── Tipos del catálogo de exámenes ─────────────────────────
export type TipoExamen =
  | "HEMATOLOGIA"
  | "BIOQUIMICA"
  | "ORINA"
  | "HECES"
  | "MICROBIOLOGIA"
  | "INMUNOLOGIA"
  | "HORMONAS"
  | "RADIOGRAFIA"
  | "ECOGRAFIA"
  | "TOMOGRAFIA"
  | "RESONANCIA"
  | "ELECTROCARDIOGRAMA"
  | "OTRO";

export type TipoPregunta = "BOOLEAN" | "TEXTO" | "SELECCION";

export interface PreguntaProtocolar {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  obligatoria: boolean;
  opciones?: string[];
}

export interface RespuestaProtocolar {
  preguntaId: string;
  preguntaTexto: string;
  respuesta: string;
}

export interface ExamenLaboratorioImagen {
  _id: string;
  nombre: string;
  tipo: TipoExamen;
  descripcion?: string;
  instrucciones?: string;
  preguntasProtocolares: PreguntaProtocolar[];
  validezDias?: number;
  activo: boolean;
}

// Alias de compatibilidad
export type ExamenLaboratorio = ExamenLaboratorioImagen;

// ── Estados del ciclo de vida de una orden ──────────────────
export type EstadoOrden =
  | "PENDIENTE"   // Emitida por el médico, pendiente de autorización
  | "EN_PROCESO"  // Autorizada por recepción, en período de vigencia (7 días)
  | "ASISTIDO"    // El paciente se presentó al laboratorio
  | "FINALIZADO"  // Resultados cargados y notificación enviada al paciente
  | "CANCELADA"   // Anulada
  | "VENCIDA";    // Expiró el período de vigencia sin asistencia

export type EstadoItem = "PENDIENTE" | "COMPLETADO";

export interface ItemOrden {
  examenId: ExamenLaboratorio | string;
  observaciones?: string;
  respuestasProtocolares?: RespuestaProtocolar[];
  valorResultado?: string;
  unidadResultado?: string;
  archivoUrl?: string;
  fechaResultado?: string;
  estadoItem: EstadoItem;
}

export interface OrdenExamen {
  _id: string;
  pacienteId: {
    _id: string;
    nombres: string;
    apellidos: string;
    dni: string;
    fechaNacimiento?: string;
    sexo?: string;
    correo?: string;
  };
  doctorId: { _id: string; nombres: string; apellidos: string; cmp?: string };
  citaId?: string;
  especialidadId: { _id: string; nombre: string };
  codigoOrden?: string;
  tipoOrden?: string;
  // Ciclo de vida
  fecha: string;
  fechaAutorizacion?: string;
  fechaCitaLab?: string;
  citaImagenFecha?: string;    // Fecha + hora exacta para citas de imagen
  fechaVencimiento?: string;
  fechaAsistencia?: string;
  fechaResultados?: string;
  archivoResultadoUrl?: string;
  // Otros
  citaLabId?: string;
  motivoVencimiento?: string;
  items: ItemOrden[];
  estado: EstadoOrden;
  observacionesGenerales?: string;
  notas?: string;
  historialEstados?: HistorialEstadoOrden[];
  createdAt?: string;
}

// ── Servicio ────────────────────────────────────────────────
export class ExamenService {

  // ─── Catálogo de exámenes ──────────────────────────────────
  static async listarExamenes(tipo?: TipoExamen): Promise<ExamenLaboratorio[]> {
    const params = new URLSearchParams({ activo: "true" });
    if (tipo) params.set("tipo", tipo);
    const res = await api.get<{ success: boolean; data: ExamenLaboratorio[] }>(
      `/examenes?${params.toString()}`
    );
    return res.data.data ?? [];
  }

  // ─── Crear orden (uso médico) ──────────────────────────────
  static async crearOrden(payload: {
    pacienteId: string;
    doctorId: string;
    citaId?: string;
    especialidadId: string;
    observacionesGenerales?: string;
    items: {
      examenId: string;
      observaciones?: string;
      respuestasProtocolares?: RespuestaProtocolar[];
    }[];
  }): Promise<OrdenExamen> {
    const res = await api.post<{ success: boolean; data: OrdenExamen }>("/ordenes", payload);
    return res.data.data;
  }

  // ─── Listar por estado (tab principal del módulo) ──────────
  static async listarPorEstado(estado: EstadoOrden): Promise<OrdenExamen[]> {
    const res = await api.get<{ success: boolean; data: OrdenExamen[] }>(
      `/ordenes?estado=${estado}`
    );
    return res.data.data ?? [];
  }

  // ─── Procesar vencimiento en lote (al abrir el módulo) ────
  static async procesarVencidas(): Promise<{ actualizadas: number }> {
    const res = await api.post<{ success: boolean; actualizadas: number }>(
      "/ordenes/vencimiento"
    );
    return { actualizadas: res.data.actualizadas ?? 0 };
  }

  // ─── Disponibilidad del laboratorio por día ───────────────
  static async obtenerDisponibilidadLab(
    desde: string,
    hasta: string
  ): Promise<{ data: { fecha: string; ocupados: number }[]; capacidadDiaria: number }> {
    const res = await api.get<{
      success: boolean;
      data: { fecha: string; ocupados: number }[];
      capacidadDiaria: number;
    }>(`/ordenes/disponibilidad-lab?desde=${desde}&hasta=${hasta}`);
    return { data: res.data.data ?? [], capacidadDiaria: res.data.capacidadDiaria };
  }

  // ─── Flujo clínico: Autorizar orden (recepción) ────────────
  // PENDIENTE → EN_PROCESO (vigencia 7 días)
  // fechaCitaLab: "YYYY-MM-DD" - día agendado para la toma de muestra
  static async autorizarOrden(ordenId: string, fechaCitaLab?: string): Promise<OrdenExamen> {
    const res = await api.patch<{ success: boolean; data: OrdenExamen }>(
      `/ordenes/${ordenId}/autorizar`,
      fechaCitaLab ? { fechaCitaLab } : {}
    );
    return res.data.data;
  }

  // ─── Flujo clínico: Registrar asistencia del paciente ──────
  // EN_PROCESO → ASISTIDO
  static async registrarAsistencia(
    ordenId: string,
    respuestasProtocolares?: { itemIndex: number; respuestas: RespuestaProtocolar[] }[]
  ): Promise<OrdenExamen> {
    const res = await api.patch<{ success: boolean; data: OrdenExamen }>(
      `/ordenes/${ordenId}/registrar-asistencia`,
      respuestasProtocolares ? { respuestasProtocolares } : {}
    );
    return res.data.data;
  }

  // ─── Flujo clínico: Cargar resultados y finalizar ──────────
  // ASISTIDO → FINALIZADO (sube PDF + envía correo al paciente)
  static async finalizarOrden(ordenId: string, archivoPDF: File): Promise<OrdenExamen> {
    const formData = new FormData();
    formData.append("archivo", archivoPDF);
    const res = await api.patch<{ success: boolean; data: OrdenExamen }>(
      `/ordenes/${ordenId}/finalizar`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  }

  // ─── Consultas generales ───────────────────────────────────
  static async obtenerOrden(id: string): Promise<OrdenExamen> {
    const res = await api.get<{ success: boolean; data: OrdenExamen }>(`/ordenes/${id}`);
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

  static async buscarPorCodigo(codigo: string): Promise<OrdenExamen> {
    const res = await api.get<{ success: boolean; data: OrdenExamen }>(
      `/ordenes/buscar?codigo=${encodeURIComponent(codigo)}`
    );
    return res.data.data;
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

  // ─── Compatibilidad (uso médico) ───────────────────────────
  static async actualizarOrden(
    ordenId: string,
    items: {
      examenId: string;
      observaciones?: string;
      respuestasProtocolares?: RespuestaProtocolar[];
    }[],
    observacionesGenerales?: string
  ): Promise<OrdenExamen> {
    const res = await api.patch<{ success: boolean; data: OrdenExamen }>(
      `/ordenes/${ordenId}`,
      { items, observacionesGenerales }
    );
    return res.data.data;
  }

  static async cancelarOrden(ordenId: string): Promise<void> {
    await api.patch(`/ordenes/${ordenId}/cancelar`);
  }

  static async subirArchivo(ordenId: string, examenId: string, archivo: File): Promise<string> {
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("examenId", examenId);
    const res = await api.post<{ success: boolean; url: string }>(
      `/ordenes/${ordenId}/subir-archivo`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.url;
  }

  // Mantener por compatibilidad con PerfilCita del médico
  static async listarOrdenesPendientes(todos = false): Promise<OrdenExamen[]> {
    const res = await api.get<{ success: boolean; data: OrdenExamen[] }>(
      `/ordenes/pendientes${todos ? "?todos=true" : ""}`
    );
    return res.data.data ?? [];
  }

  // ─── Nuevos métodos (TAREA S10) ────────────────────────────
  static async obtenerOrdenDetalle(ordenId: string): Promise<OrdenDetalle> {
    const res = await api.get<{ success: boolean; data: OrdenExamen }>(`/ordenes/${ordenId}`);
    const data = res.data.data;
    const historial: HistorialEstadoOrden[] = [];
    if (data.fecha) {
      historial.push({ estadoAnterior: "-", estadoNuevo: "PENDIENTE", fecha: new Date(data.fecha), responsable: "Sistema / Médico" });
    }
    if (data.fechaAutorizacion) {
      historial.push({ estadoAnterior: "PENDIENTE", estadoNuevo: "EN_PROCESO", fecha: new Date(data.fechaAutorizacion), responsable: "Recepción" });
    }
    if (data.fechaAsistencia) {
      historial.push({ estadoAnterior: "EN_PROCESO", estadoNuevo: "ASISTIDO", fecha: new Date(data.fechaAsistencia), responsable: "Personal Médico / Recepción" });
    }
    if (data.fechaResultados) {
      historial.push({ estadoAnterior: "ASISTIDO", estadoNuevo: "FINALIZADO", fecha: new Date(data.fechaResultados), responsable: "Laboratorio / Imagenología" });
    }
    
    return {
      id: data._id,
      codigoOrden: data.codigoOrden || data._id,
      tipoOrden: (data.tipoOrden as "LABORATORIO" | "IMAGEN" | "MIXTA") || "MIXTA",
      estado: data.estado,
      especialidad: data.especialidadId?.nombre || "General",
      medicoId: data.doctorId?._id || "",
      medicoNombre: data.doctorId ? `${data.doctorId.nombres} ${data.doctorId.apellidos}` : "No especificado",
      fechaCreacion: new Date(data.fecha),
      fechaCitaLab: data.fechaCitaLab ? new Date(data.fechaCitaLab) : undefined,
      citaImagenFecha: data.citaImagenFecha ? new Date(data.citaImagenFecha) : undefined,
      fechaResultado: data.fechaResultados ? new Date(data.fechaResultados) : undefined,
      fechaAsistencia: data.fechaAsistencia ? new Date(data.fechaAsistencia) : undefined,
      examenes: data.items
        .map(item => {
          const examen = typeof item.examenId === 'string'
            ? { _id: item.examenId, nombre: 'Examen', tipo: 'OTRO' }
            : (item.examenId as any) ?? null;
          if (!examen) return null;
          return {
            id: examen._id ?? "",
            nombre: examen.nombre ?? "Examen",
            tipo: examen.tipo ?? "—",
            estado: item.estadoItem,
            observacion: item.observaciones,
          };
        })
        .filter((ex): ex is NonNullable<typeof ex> => ex !== null),
      historialEstados: data.historialEstados && data.historialEstados.length > 0 ? data.historialEstados : historial,
      archivoResultadoUrl: data.archivoResultadoUrl,
      recomendaciones: data.observacionesGenerales,
      notas: data.notas
    };
  }

  static async obtenerResultados(ordenId: string): Promise<{
    pdfUrl: string;
    fecha: Date;
  }> {
    const res = await api.get<{ success: boolean; data: { pdfUrl: string; fecha: string } }>(`/api/examenes/ordenes/${ordenId}/resultados`);
    return {
      pdfUrl: res.data.data.pdfUrl || "",
      fecha: res.data.data.fecha ? new Date(res.data.data.fecha) : new Date()
    };
  }

  static async obtenerHistorialEstados(ordenId: string): Promise<HistorialEstadoOrden[]> {
    const res = await api.get<{ success: boolean; data: HistorialEstadoOrden[] }>(`/api/examenes/ordenes/${ordenId}/historial`);
    return res.data.data.map(h => ({
      ...h,
      fecha: new Date(h.fecha)
    })) || [];
  }
}

export const TIPO_EXAMEN_LABEL: Record<TipoExamen, string> = {
  HEMATOLOGIA:       "Hematología",
  BIOQUIMICA:        "Bioquímica",
  ORINA:             "Orina",
  HECES:             "Heces",
  MICROBIOLOGIA:     "Microbiología",
  INMUNOLOGIA:       "Inmunología / Serología",
  HORMONAS:          "Hormonas",
  RADIOGRAFIA:       "Radiografía",
  ECOGRAFIA:         "Ecografía / Ultrasound",
  TOMOGRAFIA:        "Tomografía",
  RESONANCIA:        "Resonancia Magnética",
  ELECTROCARDIOGRAMA:"Electrocardiograma",
  OTRO:              "Otro",
};

// Agrupa los tipos en categorías visuales para la UI
export const TIPO_EXAMEN_CATEGORIA: Record<TipoExamen, "LABORATORIO" | "IMAGEN"> = {
  HEMATOLOGIA:       "LABORATORIO",
  BIOQUIMICA:        "LABORATORIO",
  ORINA:             "LABORATORIO",
  HECES:             "LABORATORIO",
  MICROBIOLOGIA:     "LABORATORIO",
  INMUNOLOGIA:       "LABORATORIO",
  HORMONAS:          "LABORATORIO",
  RADIOGRAFIA:       "IMAGEN",
  ECOGRAFIA:         "IMAGEN",
  TOMOGRAFIA:        "IMAGEN",
  RESONANCIA:        "IMAGEN",
  ELECTROCARDIOGRAMA:"IMAGEN",
  OTRO:              "LABORATORIO",
};
