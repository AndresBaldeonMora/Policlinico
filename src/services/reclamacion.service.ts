import api from "./api";

export interface Reclamacion {
  _id: string;
  codigo: string;
  pacienteId: {
    _id: string;
    nombres: string;
    apellidos: string;
    dni: string;
    correo?: string;
    telefono?: string;
  } | string;
  tipo: "QUEJA" | "RECLAMO";
  descripcion: string;
  fecha: string;
  createdAt: string;
  updatedAt: string;
}

export class ReclamacionApiService {
  static async registrar(datos: { tipo: "QUEJA" | "RECLAMO"; descripcion: string }): Promise<Reclamacion> {
    const response = await api.post<{ success: boolean; data: Reclamacion }>("/reclamaciones", datos);
    return response.data.data;
  }

  static async listar(): Promise<Reclamacion[]> {
    const response = await api.get<{ success: boolean; data: Reclamacion[] }>("/reclamaciones");
    return response.data.data;
  }
}
