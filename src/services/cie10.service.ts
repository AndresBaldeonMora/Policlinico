// ============================================
// src/services/cie10.service.ts
// ============================================
import api from "./api";

export interface CIE10Item {
  codigo: string;       // ej. "E11.9"
  descripcion: string;  // descripción oficial
  capitulo: string;     // letra inicial del código
}

export class CIE10ApiService {
  /**
   * Busca códigos CIE-10 por código o por nombre de enfermedad.
   * Catálogo oficial SUSALUD cargado en el backend.
   */
  static async buscar(termino: string): Promise<CIE10Item[]> {
    if (termino.trim().length < 2) return [];
    try {
      const response = await api.get<{ success: boolean; data: CIE10Item[] }>(
        "/cie10",
        { params: { q: termino } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error al buscar CIE-10:", error);
      return [];
    }
  }
}
