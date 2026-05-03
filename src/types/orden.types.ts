export interface ExamenOrdenDetalle {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  observacion?: string;
}

export interface HistorialEstadoOrden {
  estadoAnterior: string;
  estadoNuevo: string;
  fecha: Date;
  responsable: string;
}

export interface OrdenDetalle {
  id: string;
  codigoOrden: string;
  tipoOrden: "LABORATORIO" | "IMAGEN" | "MIXTA";
  estado: "PENDIENTE" | "EN_PROCESO" | "ASISTIDO" | "FINALIZADO" | "CANCELADA" | "VENCIDA";
  especialidad: string;
  medicoId: string;
  medicoNombre: string;
  fechaCreacion: Date;
  fechaResultado?: Date;
  fechaAsistencia?: Date;
  examenes: ExamenOrdenDetalle[];
  historialEstados: HistorialEstadoOrden[];
  archivoResultadoUrl?: string;
  recomendaciones?: string;
  notas?: string;
}
