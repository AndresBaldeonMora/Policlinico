export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: "CITA" | "EXAMEN" | "RECETA" | "SISTEMA";
  leida: boolean;
  fechaCreacion: Date;
  fechaLectura?: Date;
  link?: string;
  eliminada: boolean;
}
