import api from "./api";

export interface SlotDia {
  total: number;
  reservados: number;
  horas: string[];
}

export class HorarioService {
  // Slots del mes agrupados por día { "2026-06-15": { total, reservados, horas } }
  static async slotsPorMes(
    doctorId: string,
    mes: number,
    anio: number
  ): Promise<Record<string, SlotDia>> {
    const res = await api.get<{ success: boolean; data: Record<string, SlotDia> }>(
      `/horarios/doctor/${doctorId}?mes=${mes}&anio=${anio}`
    );
    return res.data.data ?? {};
  }

  // Crear varios slots de un día
  static async crearBulk(doctorId: string, fecha: string, horas: string[]): Promise<{ creados: number; omitidos: number }> {
    const res = await api.post<{ success: boolean; data: { creados: number; omitidos: number } }>(
      "/horarios/bulk",
      { doctorId, fecha, horas }
    );
    return res.data.data;
  }

  // Eliminar slots de un día (solo los libres)
  static async eliminarBulk(doctorId: string, fecha: string, horas?: string[]): Promise<{ eliminados: number }> {
    const res = await api.delete<{ success: boolean; data: { eliminados: number } }>(
      "/horarios/bulk",
      { data: { doctorId, fecha, horas } }
    );
    return res.data.data;
  }
}
