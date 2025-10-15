// ============================================
// src/services/paciente.service.ts
// ============================================
import api from './api';

export interface Paciente {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
}

export class PacienteApiService {
  static async buscarPorDNI(dni: string): Promise<Paciente | null> {
    try {
      const response = await api.get<{ success: boolean; data: Paciente }>(
        `/pacientes/dni/${dni}`
      );
      return response.data.data || null;
    } catch (error) {
      console.error('Error al buscar paciente:', error);
      return null;
    }
  }

  static async listar(): Promise<Paciente[]> {
    try {
      const response = await api.get<{ success: boolean; data: Paciente[] }>(
        '/pacientes'
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error al listar pacientes:', error);
      return [];
    }
  }

  static async crear(paciente: Omit<Paciente, 'id'>): Promise<Paciente | null> {
    try {
      const response = await api.post<{ success: boolean; data: Paciente }>(
        '/pacientes',
        paciente
      );
      return response.data.data || null;
    } catch (error) {
      console.error('Error al crear paciente:', error);
      return null;
    }
  }
}