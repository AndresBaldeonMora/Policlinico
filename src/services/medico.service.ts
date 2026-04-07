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
  notas?: string;
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
    tieneLaboratorio: boolean;
  };
  cmp?: string;
  cvUrl?: string;
}

export class MedicoApiService {
  static async obtenerMiPerfil(): Promise<MedicoPerfil> {
    const response = await api.get("/medico/perfil");
    return response.data.data;
  }

  static async obtenerMisCitas(): Promise<CitaMedico[]> {
    const response = await api.get("/medico/citas");
    return response.data.data;
  }

  static async obtenerCitasHoy(): Promise<CitaMedico[]> {
    const response = await api.get("/medico/citas-hoy");
    return response.data.data;
  }

  static async obtenerDetalleCita(citaId: string): Promise<CitaMedico> {
    const response = await api.get(`/medico/citas/${citaId}`);
    return response.data.data;
  }

  static async actualizarEstadoCita(
    citaId: string,
    estado: "PENDIENTE" | "ATENDIDA" | "CANCELADA"
  ): Promise<CitaMedico> {
    const response = await api.patch(`/medico/citas/${citaId}/estado`, {
      estado,
    });
    return response.data.data;
  }

  static async guardarNotas(
    citaId: string,
    notas: string,
    estadoActual: "PENDIENTE" | "ATENDIDA" | "CANCELADA"
  ): Promise<CitaMedico> {
    const response = await api.patch(`/medico/citas/${citaId}/estado`, {
      estado: estadoActual,
      notas,
    });
    return response.data.data;
  }
}
