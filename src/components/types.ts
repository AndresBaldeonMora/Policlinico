import type { ReactNode } from "react";

/**
 * Cita resumida para el portal paciente.
 *
 * Campos alineados con `CitaProcesada` y `CitaTransformada`
 * de `src/services/cita.service.ts`.
 */
export interface CitaResumen {
  _id: string;
  fecha: string;
  hora: string;
  tipo: "CONSULTA" | "LABORATORIO" | "REMOTA" | "DOMICILIO";
  estado: string;
  doctor: {
    nombres: string;
    apellidos: string;
    especialidad?: string;
  };
}

/**
 * Orden resumida para el portal paciente.
 *
 * `tipoOrden` usa los valores reales del backend:
 *   "LABORATORIO" | "IMAGEN" | "MIXTA"
 * (el modelo Mongoose define esos 3 valores, no "LAB").
 *
 * Campos alineados con `OrdenExamen` de `src/services/examen.service.ts`.
 */
export interface OrdenResumen {
  _id: string;
  codigoOrden: string;
  tipoOrden: "LABORATORIO" | "IMAGEN" | "MIXTA";
  estado: string;
  fechaCreacion: string;
  especialidad?: string;
  itemsCount: number;
}

/**
 * Props para el componente CardModulo.
 */
export interface CardModuloProps {
  titulo: string;
  descripcion: string;
  icono: ReactNode;
  ruta: string;
  color?: string;
  badge?: number;
}
