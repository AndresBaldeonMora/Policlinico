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
  // notification banner
  notification: NotificationState;

  // modal / rescheduling
  editando: EditandoState | null;
  pasoModal: 1 | 2;

  // month / day / time-slot selectors
  mesesDisponibles: MesOption[];
  mesSeleccionado: MesOption | null;
  diasDelMes: number[];
  diaSeleccionado: number | null;
  horariosPorDia: HorarioPorDia[];
  cargandoHorarios: boolean;
}

export const initialState: ListaCitasState = {
  notification: { message: "", type: "success", visible: false },
  editando: null,
  pasoModal: 1,
  mesesDisponibles: [],
  mesSeleccionado: null,
  diasDelMes: [],
  diaSeleccionado: null,
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
  | { type: "SELECT_MES"; payload: { mes: MesOption; dias: number[] } }
  | { type: "SELECT_DIA"; payload: { dia: number; fechaISO: string } }
  | { type: "SET_HORA"; payload: string }
  | { type: "SET_CARGANDO_HORARIOS"; payload: boolean }
  | { type: "SET_HORARIOS_POR_DIA"; payload: HorarioPorDia[] };

// ── Reducer ──────────────────────────────────────────────────

export function listaCitasReducer(
  state: ListaCitasState,
  action: ListaCitasAction
): ListaCitasState {
  switch (action.type) {
    // ── Notifications ────────────────────────────────────────
    case "SHOW_NOTIFICATION":
      return {
        ...state,
        notification: { ...action.payload, visible: true },
      };

    case "HIDE_NOTIFICATION":
      return {
        ...state,
        notification: { ...state.notification, visible: false },
      };

    // ── Month initialisation ─────────────────────────────────
    case "SET_MESES_DISPONIBLES":
      return { ...state, mesesDisponibles: action.payload };

    // ── Modal lifecycle ──────────────────────────────────────
    case "OPEN_MODAL":
      return {
        ...state,
        editando: action.payload,
        pasoModal: 1,
        mesSeleccionado: null,
        diaSeleccionado: null,
        diasDelMes: [],
        horariosPorDia: [],
      };

    case "CLOSE_MODAL":
      return {
        ...state,
        editando: null,
        pasoModal: 1,
        mesSeleccionado: null,
        diaSeleccionado: null,
        diasDelMes: [],
        horariosPorDia: [],
      };

    case "SET_PASO_MODAL":
      return { ...state, pasoModal: action.payload };

    // ── Month / day selectors ─────────────────────────────────
    case "SELECT_MES":
      return {
        ...state,
        mesSeleccionado: action.payload.mes,
        diasDelMes: action.payload.dias,
        diaSeleccionado: null,
        horariosPorDia: [],
        // Reset fecha/hora in the editing record
        editando: state.editando
          ? { ...state.editando, fecha: "", hora: "" }
          : null,
      };

    case "SELECT_DIA":
      return {
        ...state,
        diaSeleccionado: action.payload.dia,
        horariosPorDia: [],
        editando: state.editando
          ? { ...state.editando, fecha: action.payload.fechaISO, hora: "" }
          : null,
      };

    // ── Time-slot selection ───────────────────────────────────
    case "SET_HORA":
      return {
        ...state,
        editando: state.editando
          ? { ...state.editando, hora: action.payload }
          : null,
      };

    // ── Async horarios ────────────────────────────────────────
    case "SET_CARGANDO_HORARIOS":
      return { ...state, cargandoHorarios: action.payload };

    case "SET_HORARIOS_POR_DIA":
      return { ...state, horariosPorDia: action.payload };

    default:
      return state;
  }
}