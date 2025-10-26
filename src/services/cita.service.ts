// src/services/cita.service.ts

import api from "./api";

// ------------------- Tipos y DTOs -------------------

export interface Cita {
  _id?: string;
  id?: string;
  pacienteId: string;
  doctorId: string;
  fecha: Date | string;
  hora: string;
  estado?: "pendiente" | "reprogramado" | "finalizado";
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearCitaDTO {
  pacienteId: string;
  doctorId: string;
  fecha: string; // "2025-10-17" (YYYY-MM-DD)
  hora: string; // "08:00"
}

export interface CitaPopulada extends Omit<Cita, "pacienteId" | "doctorId"> {
  paciente: {
    _id: string;
    nombres: string;
    apellidos: string;
    dni: string;
  };
  doctor: {
    _id: string;
    nombres: string;
    apellidos: string;
    especialidadId: {
      _id: string;
      nombre: string;
    };
  };
}

// src/services/cita.service.ts
export interface CitaProcesada {
  _id: string;
  id: number;
  dni: string;
  paciente: string;
  doctor: string;
  doctorId: string; // ✅ AGREGAR ESTA LÍNEA
  especialidad: string;
  fecha: string;
  hora: string;
  estado: "pendiente" | "reprogramado" | "finalizado";
}


// ------------------- Servicio -------------------

export class CitaApiService {

  // 🟢 Crear nueva cita
  static async crear(datos: CrearCitaDTO): Promise<Cita> {
    try {
      // Se envía directamente YYYY-MM-DD. El Controller lo procesa.
      const payload = {
        pacienteId: datos.pacienteId,
        doctorId: datos.doctorId,
        fecha: datos.fecha,
        hora: datos.hora,
      };

      const response = await api.post<{ success: boolean; data: Cita }>(
        "/citas",
        payload
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Respuesta inesperada del servidor");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("❌ Error al crear cita:", error.message);
        throw error;
      }

      const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };

      console.error("❌ Error al crear cita:", err.response?.data || err.message);
      throw new Error(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error al crear la cita"
      );
    }
  }

  // 🟣 Listar todas las citas
  static async listar(): Promise<CitaProcesada[]> {
    try {
      const response = await api.get<{ success: boolean; data: CitaProcesada[] }>(
        "/citas"
      );

      if (response.data.success && response.data.data) {
        // La data ya viene ordenada (más reciente primero) y formateada del backend.
        return response.data.data;
      }

      return [];
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("❌ Error al listar citas:", error.message);
        throw error;
      }

      const err = error as { response?: { data?: { message?: string } } };
      console.error("❌ Error al listar citas:", err.response?.data);
      throw new Error(err.response?.data?.message || "Error al listar citas");
    }
  }

  // 🔵 Reprogramar cita
  static async reprogramar(id: string, nuevaFecha: string, nuevaHora: string): Promise<void> {
    try {
      // NuevaFecha (YYYY-MM-DD) y nuevaHora se envían al backend
      const payload = { fecha: nuevaFecha, hora: nuevaHora };
      const response = await api.put<{ success: boolean; message: string }>(
        `/citas/${id}/reprogramar`,
        payload
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Error al reprogramar cita");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("❌ Error al reprogramar cita:", error.message);
        throw error;
      }

      const err = error as { response?: { data?: { message?: string } } };
      console.error("❌ Error al reprogramar cita:", err.response?.data);
      throw new Error(err.response?.data?.message || "Error al reprogramar cita");
    }
  }
}