/**
 * Tipos compartidos para el módulo de Notificaciones.
 */

export type TipoNotificacion = "CITA" | "EXAMEN" | "RECETA" | "SISTEMA";

export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leida: boolean;
  fecha: string; // ISO 8601
  link?: string;
}
