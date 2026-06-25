import api from "./api";

export type TipoAviso = "INFO" | "ALERTA" | "URGENTE";

export interface Aviso {
  _id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoAviso;
  creadoEn: string;
}

export interface DashboardResumen {
  stats: {
    totalDoctores: number;
    totalPacientes: number;
    totalEspecialidades: number;
    reclamacionesPendientes: number;
    interconsultasPendientes: number;
  };
  alertas: { tipo: "warning" | "error" | "info"; mensaje: string }[];
  reclamacionesRecientes: {
    _id: string;
    codigo: string;
    tipo: string;
    estado: string;
    descripcion: string;
    createdAt: string;
    pacienteId: { nombres: string; apellidos: string } | null;
  }[];
}

export class AvisoService {
  static async resumen(): Promise<DashboardResumen> {
    const res = await api.get<{ success: boolean; data: DashboardResumen }>("/avisos/dashboard-resumen");
    return res.data.data;
  }

  static async listar(): Promise<Aviso[]> {
    const res = await api.get<{ success: boolean; data: Aviso[] }>("/avisos");
    return res.data.data;
  }

  static async crear(payload: { titulo: string; mensaje: string; tipo: TipoAviso }): Promise<Aviso> {
    const res = await api.post<{ success: boolean; data: Aviso }>("/avisos", payload);
    return res.data.data;
  }

  static async eliminar(id: string): Promise<void> {
    await api.delete(`/avisos/${id}`);
  }
}
