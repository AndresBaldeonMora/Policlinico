import api from "./api";

export interface CitaMedico {
  _id: string;
  pacienteId: {
    _id: string;
    nombres: string;
    apellidos: string;
    dni: string;
    telefono: string;
    correo?: string;
    direccion?: string;
    fechaNacimiento?: string;
  };
  fecha: string;
  hora: string;
  estado: "PENDIENTE" | "ATENDIDA" | "CANCELADA";
  motivo?: string;
}

export interface MedicoPerfil {
  _id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  especialidadId: {
    _id: string;
    nombre: string;
  };
  cmp?: string;
  cvUrl?: string;
}

export class MedicoApiService {
  // Obtener perfil del médico logueado
  static async obtenerMiPerfil(): Promise<MedicoPerfil> {
    const response = await api.get("/medico/perfil");
    return response.data.data;
  }

  // Obtener todas las citas del médico
  static async obtenerMisCitas(): Promise<CitaMedico[]> {
    const response = await api.get("/medico/citas");
    return response.data.data;
  }

  // Obtener citas de hoy
  static async obtenerCitasHoy(): Promise<CitaMedico[]> {
    const response = await api.get("/medico/citas-hoy");
    return response.data.data;
  }

  // Obtener detalle de una cita
  static async obtenerDetalleCita(citaId: string): Promise<CitaMedico> {
    const response = await api.get(`/medico/citas/${citaId}`);
    return response.data.data;
  }

  // Actualizar estado de una cita
  static async actualizarEstadoCita(
    citaId: string,
    estado: "PENDIENTE" | "ATENDIDA" | "CANCELADA"
  ): Promise<CitaMedico> {
    const response = await api.patch(`/medico/citas/${citaId}/estado`, {
      estado,
    });
    return response.data.data;
  }
}