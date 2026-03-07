// ============================================================
// perfilCitaReducer.ts
//
// Manages the fetch + clinical data state for PerfilCita.
// UI-only state (tabActiva, tabDemo) stays as useState in the
// component — they are fully independent and don't benefit
// from being in a shared reducer.
// ============================================================

import type { CitaTransformada } from "../../services/cita.service";

// ── Types ────────────────────────────────────────────────────

export interface Alergia {
  id: string;
  sustancia: string;
  reaccion: string;
  severidad: "leve" | "moderada" | "severa";
}

export interface ProblemaMedico {
  id: string;
  descripcion: string;
  estado: "activo" | "resuelto";
  fechaInicio: string;
}

export interface Medicamento {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  activo: boolean;
}

// ── Root state ───────────────────────────────────────────────

export interface PerfilCitaState {
  // Fetch lifecycle
  cita: CitaTransformada | null;
  cargando: boolean;
  error: string | null;

  // Clinical data (currently mock, will come from API)
  alergias: Alergia[];
  problemasMedicos: ProblemaMedico[];
  medicamentos: Medicamento[];
  citasPaciente: CitaTransformada[];
}

export const initialState: PerfilCitaState = {
  cita: null,
  cargando: true,
  error: null,
  alergias: [],
  problemasMedicos: [],
  medicamentos: [],
  citasPaciente: [],
};

// ── Actions ──────────────────────────────────────────────────

export type PerfilCitaAction =
  // Fetch lifecycle
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: CitaTransformada }
  | { type: "FETCH_ERROR"; payload: string }

  // Clinical data (ready for real API responses later)
  | { type: "SET_ALERGIAS"; payload: Alergia[] }
  | { type: "SET_PROBLEMAS_MEDICOS"; payload: ProblemaMedico[] }
  | { type: "SET_MEDICAMENTOS"; payload: Medicamento[] }
  | { type: "SET_CITAS_PACIENTE"; payload: CitaTransformada[] };

// ── Reducer ──────────────────────────────────────────────────

export function perfilCitaReducer(
  state: PerfilCitaState,
  action: PerfilCitaAction
): PerfilCitaState {
  switch (action.type) {
    // ── Fetch lifecycle ───────────────────────────────────────
    case "FETCH_START":
      return { ...state, cargando: true, error: null };

    case "FETCH_SUCCESS":
      return { ...state, cargando: false, cita: action.payload, error: null };

    case "FETCH_ERROR":
      return { ...state, cargando: false, error: action.payload };

    // ── Clinical data ─────────────────────────────────────────
    case "SET_ALERGIAS":
      return { ...state, alergias: action.payload };

    case "SET_PROBLEMAS_MEDICOS":
      return { ...state, problemasMedicos: action.payload };

    case "SET_MEDICAMENTOS":
      return { ...state, medicamentos: action.payload };

    case "SET_CITAS_PACIENTE":
      return { ...state, citasPaciente: action.payload };

    default:
      return state;
  }
}