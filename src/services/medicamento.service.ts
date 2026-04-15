import api from "./api";

export interface Medicamento {
  _id: string;
  nombre: string;
  principioActivo: string;
  presentacion: string;
}

export class MedicamentoService {
  static async buscar(q: string): Promise<Medicamento[]> {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const response = await api.get<{ success: boolean; data: Medicamento[] }>(
      `/medicamentos${params}`
    );
    return response.data.data ?? [];
  }
}
