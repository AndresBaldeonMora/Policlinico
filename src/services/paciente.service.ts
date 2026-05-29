// src/services/paciente.service.ts
import api from "./api";
import type { PacientePerfil } from "../types/paciente.types";

export interface Alergia {
  _id?: string;
  sustancia: string;
  reaccion: string;
  severidad: "leve" | "moderada" | "severa";
}

export interface MedicamentoHabitual {
  _id?: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  activo: boolean;
  fechaSuspension?: string;
  motivoSuspension?: string;
}

export interface ProblemaMedico {
  _id?: string;
  descripcion: string;
  estado: "activo" | "resuelto";
  fechaInicio?: string;
}

export interface CirugiaPevia {
  _id?: string;
  procedimiento: string;
  fecha?: string;
  hospital?: string;
}

export interface AntecedenteFamiliar {
  _id?: string;
  parentesco: string;
  condicion: string;
}

export interface HistorialClinico {
  alergias: Alergia[];
  medicamentosHabituales: MedicamentoHabitual[];
  problemasMedicos: ProblemaMedico[];
  cirugiasPrevias: CirugiaPevia[];
  antecedentesFamiliares: AntecedenteFamiliar[];
}

export interface Paciente {
  _id: string;
  id?: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo?: string;
  estadoCivil?: string;
  telefono: string;
  correo: string;
  direccion: string;
  distrito?: string;
  apoderadoNombre?: string;
  apoderadoParentesco?: string;
  apoderadoTelefono?: string;
  alergias?: Alergia[];
  medicamentosHabituales?: MedicamentoHabitual[];
  problemasMedicos?: ProblemaMedico[];
  cirugiasPrevias?: CirugiaPevia[];
  antecedentesFamiliares?: AntecedenteFamiliar[];
  edad?: number;
  tieneCuentaPortal?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PacienteTransformado {
  id: string;
  _id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo?: string;
  estadoCivil?: string;
  telefono: string;
  correo: string;
  direccion: string;
  distrito?: string;
  apoderadoNombre?: string;
  apoderadoParentesco?: string;
  apoderadoTelefono?: string;
  edad?: number;
  tieneCuentaPortal?: boolean;
}

export interface CredencialesPortal {
  correo: string;
  passwordTemporal: string;
}

export interface ResultadoCrearPaciente {
  paciente: PacienteTransformado;
  credenciales?: CredencialesPortal;
}

interface AxiosErrorResponse {
  response?: { data?: { message?: string } };
  message?: string;
}

const calcEdadLocal = (fechaNac?: string): number | undefined => {
  if (!fechaNac) return undefined;
  const b = new Date(fechaNac);
  const t = new Date();
  const age = t.getFullYear() - b.getFullYear() -
    (t < new Date(t.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
  return age;
};

const transformarPaciente = (p: Paciente): PacienteTransformado => ({
  id: p._id || p.id || "",
  _id: p._id || p.id || "",
  dni: p.dni,
  nombres: p.nombres,
  apellidos: p.apellidos,
  fechaNacimiento: p.fechaNacimiento,
  sexo: p.sexo,
  estadoCivil: p.estadoCivil,
  telefono: p.telefono,
  correo: p.correo,
  direccion: p.direccion,
  distrito: p.distrito,
  apoderadoNombre: p.apoderadoNombre,
  apoderadoParentesco: p.apoderadoParentesco,
  apoderadoTelefono: p.apoderadoTelefono,
  edad: p.edad ?? calcEdadLocal(p.fechaNacimiento),
  tieneCuentaPortal: p.tieneCuentaPortal,
});

export class PacienteApiService {
  // Crea paciente - opcionalmente crea también cuenta de portal con `crearCuentaPortal: true`.
  // Si se solicita la cuenta, la respuesta incluirá `credenciales` para entregar al paciente.
  static async crear(
    datos: Omit<Paciente, "_id" | "id" | "edad" | "tieneCuentaPortal"> & {
      crearCuentaPortal?: boolean;
      passwordPortal?: string;
    }
  ): Promise<ResultadoCrearPaciente> {
    try {
      const response = await api.post<{
        success: boolean;
        data: Paciente;
        credenciales?: CredencialesPortal;
      }>("/pacientes", datos);
      if (response.data.success && response.data.data) {
        return {
          paciente: transformarPaciente(response.data.data),
          credenciales: response.data.credenciales,
        };
      }
      throw new Error("Respuesta inesperada del servidor");
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al crear paciente");
    }
  }

  // Crea cuenta de portal para un paciente existente (sin tocar sus datos clínicos).
  static async crearCuentaPortal(
    pacienteId: string,
    passwordPortal?: string
  ): Promise<CredencialesPortal> {
    try {
      const response = await api.post<{
        success: boolean;
        credenciales: CredencialesPortal;
      }>(`/pacientes/${pacienteId}/crear-cuenta`, { passwordPortal });
      if (response.data.success && response.data.credenciales) {
        return response.data.credenciales;
      }
      throw new Error("Respuesta inesperada del servidor");
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al crear cuenta de portal");
    }
  }

  static async actualizar(
    id: string,
    datos: Partial<Omit<Paciente, "_id" | "id" | "edad">>
  ): Promise<PacienteTransformado> {
    try {
      const response = await api.put<{ success: boolean; data: Paciente }>(
        `/pacientes/${id}`,
        datos
      );
      if (response.data.success && response.data.data) {
        return transformarPaciente(response.data.data);
      }
      throw new Error("Respuesta inesperada del servidor");
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al actualizar paciente");
    }
  }
  
  static async eliminar(id: string): Promise<void> {
    try {
      await api.delete(`/pacientes/${id}`);
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al eliminar paciente");
    }
  }

  static async listar(): Promise<PacienteTransformado[]> {
    try {
      const response = await api.get<{ success: boolean; data: Paciente[] }>(
        "/pacientes"
      );
      if (response.data.success && response.data.data) {
        return response.data.data.map(transformarPaciente);
      }
      return [];
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      throw new Error(err.response?.data?.message || "Error al listar pacientes");
    }
  }

  static async obtenerHistorial(id: string, citasPagina = 1, ordenesPagina = 1): Promise<any> {
    const params = new URLSearchParams({ citasPagina: String(citasPagina), ordenesPagina: String(ordenesPagina) });
    const response = await api.get<{ success: boolean; data: any }>(
      `/pacientes/${id}/historial?${params.toString()}`
    );
    return response.data.data;
  }

  static async actualizarHistorialClinico(
    id: string,
    datos: Partial<HistorialClinico>
  ): Promise<Paciente> {
    const response = await api.patch<{ success: boolean; data: Paciente }>(
      `/pacientes/${id}/historial-clinico`,
      datos
    );
    return response.data.data;
  }

  static async buscarPorDni(dni: string): Promise<PacienteTransformado | null> {
    try {
      const response = await api.get<{ success: boolean; data: Paciente }>(
        `/pacientes/dni/${dni}`
      );
      if (response.data.success && response.data.data) {
        return transformarPaciente(response.data.data);
      }
      return null;
    } catch {
      return null;
    }
  }

  static async obtenerHistorialPorCorreo(correo: string): Promise<any> {
    const res = await api.get(
      `/pacientes/correo/${encodeURIComponent(correo)}/historial`
    );
    return res.data.data;
  }

  static async obtenerMiPerfil(): Promise<PacienteTransformado> {
    const response = await api.get<{ success: boolean; data: Paciente }>("/paciente/me");
    return transformarPaciente(response.data.data);
  }

  static async actualizarPerfil(datos: PacientePerfil): Promise<PacienteTransformado> {
    const response = await api.put<{ success: boolean; data: Paciente }>("/paciente/me", datos);
    return transformarPaciente(response.data.data);
  }

  static async cambiarPassword(
    passwordActual: string,
    passwordNueva: string,
    passwordConfirm: string
  ): Promise<void> {
    await api.put("/paciente/me/password", { passwordActual, passwordNueva, passwordConfirm });
  }

  static async subirAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await api.post<{ success: boolean; data: { avatarUrl: string } }>("/paciente/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  }

  static async obtenerMisCitas(params?: { estado?: string; pagina?: number }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.estado) query.set("estado", params.estado);
    if (params?.pagina) query.set("pagina", String(params.pagina));
    const response = await api.get(`/paciente/citas${query.toString() ? `?${query}` : ""}`);
    return response.data;
  }

  static async obtenerMisOrdenes(params?: { estado?: string; tipoOrden?: string; pagina?: number }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.estado)    query.set("estado",    params.estado);
    if (params?.tipoOrden) query.set("tipoOrden", params.tipoOrden);
    if (params?.pagina)    query.set("pagina",    String(params.pagina));
    const response = await api.get(`/paciente/ordenes${query.toString() ? `?${query}` : ""}`);
    return response.data;
  }

  static async obtenerTerminos(): Promise<{
    contenido: string;
    version: string;
    fechaActualizacion: Date;
  }> {
    const response = await api.get<{ success: boolean; data: { contenido: string; version: string; fechaActualizacion: string } }>("/paciente/terminos");
    return {
      ...response.data.data,
      fechaActualizacion: new Date(response.data.data.fechaActualizacion)
    };
  }
}
