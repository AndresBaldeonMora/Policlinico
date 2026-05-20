import api from "./api";
import type { Alergia, MedicamentoHabitual, ProblemaMedico, CirugiaPevia, AntecedenteFamiliar } from "./paciente.service";

export type { Alergia, MedicamentoHabitual, ProblemaMedico, CirugiaPevia, AntecedenteFamiliar };

export interface MedicamentoPrescrito {
  medicamentoId: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  observaciones?: string;
}

export interface DiagnosticoCIE10 {
  codigo: string;
  descripcion: string;
  tipo: "presuntivo" | "confirmado";
  esPrincipal: boolean;
}

export interface FirmaMedico {
  medicoId: string;
  medicoNombre: string;
  numeroCMP: string;
  fechaHoraFirma: string;
}

export interface EspecialidadNota {
  nombre: string;
  campos: Record<string, string>;
}

export interface OtrosDiagnosticos {
  riesgo: string;
  nutricional: string;
  saludMental: string;
  causaExterna: string;
  estadoFuncional: string;
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
    alergias?: Alergia[];
    medicamentosHabituales?: MedicamentoHabitual[];
    problemasMedicos?: ProblemaMedico[];
    cirugiasPrevias?: CirugiaPevia[];
    antecedentesFamiliares?: AntecedenteFamiliar[];
  };
  fecha: string;
  hora: string;
  tipo?: string;
  subtipoCita?: "NUEVA" | "SEGUIMIENTO";
  estado: "PENDIENTE" | "ASISTIO" | "ATENDIDA" | "CANCELADA" | "REPROGRAMADA";
  notas?: string;
  notasClinicas?: string;
  diagnostico?: string;
  diagnosticos?: DiagnosticoCIE10[];
  otrosDiagnosticos?: OtrosDiagnosticos;
  tratamiento?: string;
  medicamentosPrescritos?: MedicamentoPrescrito[];
  firma?: FirmaMedico;
  especialidad?: EspecialidadNota;
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

export interface CitaHistorial {
  _id: string;
  fecha: string;
  hora: string;
  tipo?: string;
  estado: "PENDIENTE" | "ATENDIDA" | "CANCELADA" | "REPROGRAMADA";
  diagnostico?: string;
  diagnosticos?: DiagnosticoCIE10[];
  tratamiento?: string;
  notasClinicas?: string;
  doctorId?: {
    _id: string;
    nombres: string;
    apellidos: string;
    especialidadId?: {
      _id: string;
      nombre: string;
    };
  };
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
    datos: { notasClinicas: string; diagnostico: string; tratamiento: string; diagnosticos: DiagnosticoCIE10[]; especialidad: EspecialidadNota; otrosDiagnosticos: OtrosDiagnosticos }
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

  static async obtenerHistorialCitasPaciente(
    pacienteId: string,
    excluirCitaId?: string
  ): Promise<CitaHistorial[]> {
    const params = excluirCitaId ? `?excluirCitaId=${excluirCitaId}` : "";
    const response = await api.get(`/medico/pacientes/${pacienteId}/historial-citas${params}`);
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
