import api from "./api";

export interface MedicamentoPrescrito {
  medicamentoId: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  observaciones?: string;
}

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
  tipo?: string;
  estado: "PENDIENTE" | "ATENDIDA" | "CANCELADA" | "REPROGRAMADA";
  notas?: string;
  notasClinicas?: string;
  diagnostico?: string;
  tratamiento?: string;
  medicamentosPrescritos?: MedicamentoPrescrito[];
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
    tieneLaboratorioImagen: boolean;
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

  static async guardarNotasClinicas(
    citaId: string,
    datos: { notasClinicas: string; diagnostico: string; tratamiento: string }
  ): Promise<CitaMedico> {
    const response = await api.patch(`/medico/citas/${citaId}/notas`, datos);
    return response.data.data;
  }

  static async prescribirMedicamentos(
    citaId: string,
    medicamentos: MedicamentoPrescrito[]
  ): Promise<CitaMedico> {
    const response = await api.patch(`/medico/citas/${citaId}/medicamentos`, { medicamentos });
    return response.data.data;
  }

  static async obtenerHistorialPaciente(pacienteId: string): Promise<{
    paciente: any;
    citas: { data: any[]; total: number; pagina: number; totalPaginas: number };
    ordenes: { data: any[]; total: number; pagina: number; totalPaginas: number };
  }> {
    const response = await api.get(`/pacientes/${pacienteId}/historial`);
    return response.data.data;
  }
}
