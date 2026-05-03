import type { Notificacion } from "../types/notificacion.types";
import api from "./api";

class NotificacionService {
  static async listarNotificaciones(
    filtro?: "TODAS" | "LEIDAS" | "NO_LEIDAS",
    pagina?: number,
    porPagina?: number
  ): Promise<Notificacion[]> {
    const params = new URLSearchParams();
    if (filtro) params.append("filtro", filtro);
    if (pagina) params.append("pagina", pagina.toString());
    if (porPagina) params.append("porPagina", porPagina.toString());
    
    const response = await api.get<{ success: boolean; data: Notificacion[] }>(`/api/paciente/notificaciones?${params.toString()}`);
    return response.data.data || [];
  }
  
  static async marcarComoLeida(id: string): Promise<void> {
    await api.put(`/api/paciente/notificaciones/${id}/leer`);
  }
  
  static async marcarTodasLeidas(): Promise<void> {
    await api.put(`/api/paciente/notificaciones/marcar-todas-leidas`);
  }
  
  static async eliminar(id: string): Promise<void> {
    await api.delete(`/api/paciente/notificaciones/${id}`);
  }
  
  static async obtenerNoLeidas(): Promise<number> {
    const response = await api.get<{ success: boolean; data: Notificacion[] }>(`/api/paciente/notificaciones?filtro=NO_LEIDAS`);
    return response.data.data ? response.data.data.length : 0;
  }
}

export default NotificacionService;
