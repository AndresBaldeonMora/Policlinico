import api from "./api";

export interface Bloqueo {
  _id: string;
  doctorId: { _id: string; nombres: string; apellidos: string } | string;
  fecha: string;
  motivo: string;
  descripcion?: string;
  creadoPor?: { _id: string; nombres: string; apellidos: string } | string;
  creadoEn: string;
  activo: boolean;
}

export interface VerificarBloqueoResponse {
  bloqueado: boolean;
  bloqueo: Bloqueo | null;
}

export class BloqueoService {
  static async crear(payload: {
    doctorId: string;
    fecha: string;
    motivo: string;
    descripcion?: string;
  }): Promise<Bloqueo> {
    const res = await api.post<{ success: boolean; data: Bloqueo }>("/bloqueos", payload);
    return res.data.data;
  }

  static async listar(params?: {
    doctorId?: string;
    mes?: number;
    anio?: number;
  }): Promise<Bloqueo[]> {
    const query = new URLSearchParams();
    if (params?.doctorId) query.set("doctorId", params.doctorId);
    if (params?.mes) query.set("mes", String(params.mes));
    if (params?.anio) query.set("anio", String(params.anio));
    const res = await api.get<{ success: boolean; data: Bloqueo[] }>(
      `/bloqueos?${query.toString()}`
    );
    return res.data.data ?? [];
  }

  static async desactivar(id: string): Promise<void> {
    await api.delete(`/bloqueos/${id}`);
  }

  static async verificar(doctorId: string, fecha: string): Promise<VerificarBloqueoResponse> {
    const res = await api.get<{ success: boolean; data: VerificarBloqueoResponse }>(
      `/bloqueos/doctor/${doctorId}/fecha/${fecha}`
    );
    return res.data.data;
  }
}
