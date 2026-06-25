import api from "./api";

export interface MensajeChat {
  _id: string;
  sala: string;
  autorId: string;
  autorNombre: string;
  autorRol: string;
  texto: string;
  leido: boolean;
  creadoEn: string;
}

export interface ConversacionStaff {
  sala: string;
  tipo: "ADMIN_STAFF";
  nombre: string;
  correo: string;
  userId: string;
  ultimo: MensajeChat | null;
  noLeidos: number;
}

export interface ConversacionPaciente {
  sala: string;
  tipo: "ADMIN_PACIENTE";
  nombre: string;
  pacienteId: string;
  ultimo: MensajeChat | null;
  noLeidos: number;
}

export class ChatService {
  static async historial(sala: string): Promise<MensajeChat[]> {
    const res = await api.get<{ success: boolean; data: MensajeChat[] }>(`/chat/sala/${encodeURIComponent(sala)}`);
    return res.data.data;
  }

  static async conversaciones(): Promise<{ staff: ConversacionStaff[]; pacientes: ConversacionPaciente[] }> {
    const res = await api.get<{ success: boolean; data: any }>("/chat/conversaciones");
    return res.data.data;
  }

  static async noLeidos(sala: string): Promise<number> {
    const res = await api.get<{ success: boolean; data: number }>(`/chat/no-leidos/${encodeURIComponent(sala)}`);
    return res.data.data;
  }
}
