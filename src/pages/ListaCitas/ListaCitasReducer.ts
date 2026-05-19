// ============================================================
// listaCitasReducer.ts
// Centralises all ListaCitas UI state into a single reducer.
// ============================================================

import type { HorarioDisponible } from "../../services/doctor.service";

// ── Types ────────────────────────────────────────────────────

export interface MesOption {
  numero: number;
  nombre: string;
  anio: number;
}

export interface HorarioPorDia {
  fecha: string;
  fechaISO: string;
  diaNombre: string;
  diaNumero: number;
  horarios: HorarioDisponible[];
}

export interface EditandoState {
  id: string;
  dni: string;
  paciente: string;
  especialidad: string;
  doctor: string;
  doctorId: string;
  fecha: string;
  hora: string;
  fechaOriginal: string;
  horaOriginal: string;
}

export interface NotificationState {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

// ── Root State ───────────────────────────────────────────────

export interface ListaCitasState {
  notification: NotificationState;
  editando: EditandoState | null;
  pasoModal: 1 | 2;
  mesesDisponibles: MesOption[];
  horariosPorDia: HorarioPorDia[];
  cargandoHorarios: boolean;
}

export const initialState: ListaCitasState = {
  notification: { message: "", type: "success", visible: false },
  editando: null,
  pasoModal: 1,
  mesesDisponibles: [],
  horariosPorDia: [],
  cargandoHorarios: false,
};

// ── Actions ──────────────────────────────────────────────────

export type ListaCitasAction =
  | { type: "SHOW_NOTIFICATION"; payload: { message: string; type: "success" | "error" } }
  | { type: "HIDE_NOTIFICATION" }
  | { type: "SET_MESES_DISPONIBLES"; payload: MesOption[] }
  | { type: "OPEN_MODAL"; payload: EditandoState }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_PASO_MODAL"; payload: 1 | 2 }
  | { type: "SELECT_FECHA"; payload: { fechaISO: string } }
  | { type: "SET_HORA"; payload: string }
  | { type: "SET_CARGANDO_HORARIOS"; payload: boolean }
  | { type: "SET_HORARIOS_POR_DIA"; payload: HorarioPorDia[] };

// ── Reducer ──────────────────────────────────────────────────

export function listaCitasReducer(
  state: ListaCitasState,
  action: ListaCitasAction
): ListaCitasState {
  switch (action.type) {
    case "SHOW_NOTIFICATION":
      return { ...state, notification: { ...action.payload, visible: true } };

    case "HIDE_NOTIFICATION":
      return { ...state, notification: { ...state.notification, visible: false } };

    case "SET_MESES_DISPONIBLES":
      return { ...state, mesesDisponibles: action.payload };

    case "OPEN_MODAL":
      return {
        ...state,
        editando: action.payload,
        pasoModal: 1,
        horariosPorDia: [],
      };

    case "CLOSE_MODAL":
      return {
        ...state,
        editando: null,
        pasoModal: 1,
        horariosPorDia: [],
      };

    case "SET_PASO_MODAL":
      return { ...state, pasoModal: action.payload };

    case "SELECT_FECHA":
      return {
        ...state,
        horariosPorDia: [],
        editando: state.editando
          ? { ...state.editando, fecha: action.payload.fechaISO, hora: "" }
          : null,
      };

    case "SET_HORA":
      return {
        ...state,
        editando: state.editando
          ? { ...state.editando, hora: action.payload }
          : null,
      };

    case "SET_CARGANDO_HORARIOS":
      return { ...state, cargandoHorarios: action.payload };

    case "SET_HORARIOS_POR_DIA":
      return { ...state, horariosPorDia: action.payload };

    default:
      return state;
  }
}
