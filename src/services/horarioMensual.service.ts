import api from "./api";

export interface HorarioMensual {
  _id: string;
  medicoId: { _id: string; nombres: string; apellidos: string } | string;
  mes: number;
  anio: number;
  diasSemana: number[]; // 0=Domingo … 6=Sábado
  horaInicio: string;
  horaFin: string;
}

export class HorarioMensualService {
  static async guardar(payload: {
    medicoId: string;
    mes: number;
    anio: number;
    diasSemana: number[];
    horaInicio: string;
    horaFin: string;
  }): Promise<HorarioMensual> {
    const res = await api.post<{ success: boolean; data: HorarioMensual }>("/horarios-mensuales", payload);
    return res.data.data;
  }

  static async obtener(medicoId: string, mes: number, anio: number): Promise<HorarioMensual | null> {
    const res = await api.get<{ success: boolean; data: HorarioMensual | null }>("/horarios-mensuales", {
      params: { medicoId, mes, anio },
    });
    return res.data.data ?? null;
  }
}
