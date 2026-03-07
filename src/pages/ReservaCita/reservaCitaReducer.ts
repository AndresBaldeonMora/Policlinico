// src/pages/ReservaCita/reservaCitaReducer.ts
import type { PacienteTransformado } from "../../services/paciente.service";
import type { Especialidad } from "../../services/especialidad.service";
import type { DoctorTransformado as Doctor, HorarioDisponible } from "../../services/doctor.service";

// ─── Types ────────────────────────────────────────────────
export interface HorarioPorDia {
  fecha: string;
  fechaISO: string;
  diaNombre: string;
  diaNumero: number;
  horarios: HorarioDisponible[];
}

export interface MesOption {
  numero: number;
  nombre: string;
  anio: number;
}

export interface NotificationState {
  message: string;
  type: "success" | "error" | "";
  visible: boolean;
}

// ─── Estado ───────────────────────────────────────────────
export interface ReservaState {
  // UI
  loading: boolean;
  reniecLoading: boolean;
  error: string;
  notification: NotificationState;
  pasoActual: number;

  // Paciente
  searchDNI: string;
  pacienteEncontrado: PacienteTransformado | null;
  pacienteSeleccionado: PacienteTransformado | null;
  todosLosPacientes: PacienteTransformado[];
  mostrarNuevoPaciente: boolean;

  // Especialidad
  searchEspecialidad: string;
  especialidades: Especialidad[];
  especialidadSeleccionada: Especialidad | null;
  showEspecialidadesSuggestions: boolean;

  // Doctor
  todosLosDoctores: Doctor[];
  doctoresDisponibles: Doctor[];
  doctorSeleccionado: Doctor | null;

  // Fecha / Hora
  mesesDisponibles: MesOption[];
  mesSeleccionado: MesOption | null;
  diasDelMes: number[];
  diaSeleccionado: number | null;
  horariosPorDia: HorarioPorDia[];
  fechaSeleccionada: string;
  horaSeleccionada: string;
}

// ─── Acciones ─────────────────────────────────────────────
export type ReservaAction =
  // Carga inicial
  | { type: "CARGA_INICIO" }
  | { type: "CARGA_EXITO"; pacientes: PacienteTransformado[]; especialidades: Especialidad[]; doctores: Doctor[]; meses: MesOption[] }
  | { type: "CARGA_ERROR"; message: string }
  // Navegación
  | { type: "IR_PASO"; paso: number }
  // Especialidad
  | { type: "SET_SEARCH_ESPECIALIDAD"; value: string }
  | { type: "SELECCIONAR_ESPECIALIDAD"; especialidad: Especialidad | null }
  | { type: "TOGGLE_SUGERENCIAS_ESPECIALIDAD"; visible: boolean }
  // Doctor
  | { type: "SET_DOCTORES_DISPONIBLES"; doctores: Doctor[] }
  | { type: "SELECCIONAR_DOCTOR"; doctor: Doctor | null }
  // Mes / Día
  | { type: "SELECCIONAR_MES"; mes: MesOption; dias: number[] }
  | { type: "SELECCIONAR_DIA"; dia: number }
  // Hora
  | { type: "SET_HORARIOS"; horarios: HorarioPorDia[] }
  | { type: "SELECCIONAR_HORA"; hora: string; fechaISO: string }
  | { type: "RESET_HORA" }
  // Paciente
  | { type: "SET_SEARCH_DNI"; value: string }
  | { type: "SET_RENIEC_LOADING"; value: boolean }
  | { type: "SET_PACIENTE_ENCONTRADO"; paciente: PacienteTransformado | null }
  | { type: "SELECCIONAR_PACIENTE"; paciente: PacienteTransformado }
  | { type: "SET_TODOS_PACIENTES"; pacientes: PacienteTransformado[] }
  | { type: "TOGGLE_NUEVO_PACIENTE"; visible: boolean }
  // Confirm
  | { type: "CONFIRMAR_INICIO" }
  | { type: "CONFIRMAR_EXITO" }
  | { type: "CONFIRMAR_ERROR"; message: string }
  | { type: "HIDE_NOTIFICATION" }
  | { type: "SET_ERROR"; message: string }
  // Prefill URL
  | { type: "PREFILL_FECHA"; mes: MesOption; dias: number[]; dia: number; fechaISO: string }
  | { type: "PREFILL_DOCTOR"; doctor: Doctor; especialidad?: Especialidad }
  // Reset
  | { type: "RESET" };

// ─── Estado inicial ───────────────────────────────────────
export const initialState: ReservaState = {
  loading: false,
  reniecLoading: false,
  error: "",
  notification: { message: "", type: "", visible: false },
  pasoActual: 1,
  searchDNI: "",
  pacienteEncontrado: null,
  pacienteSeleccionado: null,
  todosLosPacientes: [],
  mostrarNuevoPaciente: false,
  searchEspecialidad: "",
  especialidades: [],
  especialidadSeleccionada: null,
  showEspecialidadesSuggestions: false,
  todosLosDoctores: [],
  doctoresDisponibles: [],
  doctorSeleccionado: null,
  mesesDisponibles: [],
  mesSeleccionado: null,
  diasDelMes: [],
  diaSeleccionado: null,
  horariosPorDia: [],
  fechaSeleccionada: "",
  horaSeleccionada: "",
};

// ─── Reducer ──────────────────────────────────────────────
export function reservaReducer(state: ReservaState, action: ReservaAction): ReservaState {
  switch (action.type) {
    case "CARGA_INICIO":
      return { ...state, loading: true, error: "" };
    case "CARGA_EXITO":
      return {
        ...state,
        loading: false,
        todosLosPacientes: action.pacientes,
        especialidades: action.especialidades,
        todosLosDoctores: action.doctores,
        mesesDisponibles: action.meses,
      };
    case "CARGA_ERROR":
      return { ...state, loading: false, error: action.message };

    case "IR_PASO":
      return { ...state, pasoActual: action.paso, error: "" };

    case "SET_SEARCH_ESPECIALIDAD":
      return { ...state, searchEspecialidad: action.value };
    case "SELECCIONAR_ESPECIALIDAD":
      return {
        ...state,
        especialidadSeleccionada: action.especialidad,
        searchEspecialidad: action.especialidad?.nombre ?? "",
        showEspecialidadesSuggestions: false,
        // Reset downstream
        doctorSeleccionado: null,
        doctoresDisponibles: [],
      };
    case "TOGGLE_SUGERENCIAS_ESPECIALIDAD":
      return { ...state, showEspecialidadesSuggestions: action.visible };

    case "SET_DOCTORES_DISPONIBLES":
      return { ...state, doctoresDisponibles: action.doctores };
    case "SELECCIONAR_DOCTOR":
      return { ...state, doctorSeleccionado: action.doctor };

    case "SELECCIONAR_MES":
      return {
        ...state,
        mesSeleccionado: action.mes,
        diasDelMes: action.dias,
        diaSeleccionado: null,
      };
    case "SELECCIONAR_DIA":
      return { ...state, diaSeleccionado: action.dia };

    case "SET_HORARIOS":
      return { ...state, horariosPorDia: action.horarios };
    case "SELECCIONAR_HORA":
      return { ...state, horaSeleccionada: action.hora, fechaSeleccionada: action.fechaISO };
    case "RESET_HORA":
      return { ...state, horaSeleccionada: "", fechaSeleccionada: "" };

    case "SET_SEARCH_DNI":
      return { ...state, searchDNI: action.value, error: "", pacienteEncontrado: null, pacienteSeleccionado: null };
    case "SET_RENIEC_LOADING":
      return { ...state, reniecLoading: action.value };
    case "SET_PACIENTE_ENCONTRADO":
      return { ...state, pacienteEncontrado: action.paciente };
    case "SELECCIONAR_PACIENTE":
      return { ...state, pacienteSeleccionado: action.paciente, searchDNI: action.paciente.dni, error: "" };
    case "SET_TODOS_PACIENTES":
      return { ...state, todosLosPacientes: action.pacientes };
    case "TOGGLE_NUEVO_PACIENTE":
      return { ...state, mostrarNuevoPaciente: action.visible };

    case "CONFIRMAR_INICIO":
      return { ...state, loading: true, error: "" };
    case "CONFIRMAR_EXITO":
      return {
        ...state,
        loading: false,
        notification: { message: "Cita registrada exitosamente", type: "success", visible: true },
      };
    case "CONFIRMAR_ERROR":
      return { ...state, loading: false, error: action.message };
    case "HIDE_NOTIFICATION":
      return { ...state, notification: { ...state.notification, visible: false } };
    case "SET_ERROR":
      return { ...state, error: action.message };

    case "PREFILL_FECHA":
      return {
        ...state,
        mesSeleccionado: action.mes,
        diasDelMes: action.dias,
        diaSeleccionado: action.dia,
        fechaSeleccionada: action.fechaISO,
        pasoActual: Math.max(state.pasoActual, 4),
      };
    case "PREFILL_DOCTOR":
      return {
        ...state,
        doctorSeleccionado: action.doctor,
        ...(action.especialidad && {
          especialidadSeleccionada: action.especialidad,
          searchEspecialidad: action.especialidad.nombre,
        }),
        pasoActual: Math.max(state.pasoActual, state.fechaSeleccionada ? 5 : 2),
      };

    case "RESET":
      return { ...initialState, especialidades: state.especialidades, todosLosDoctores: state.todosLosDoctores, todosLosPacientes: state.todosLosPacientes, mesesDisponibles: state.mesesDisponibles };

    default:
      return state;
  }
}
// ─── Utility functions ────────────────────────────────────

const nombresMeses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export const generarMesesDisponibles = (mesesAdelante = 3): MesOption[] => {
  const meses: MesOption[] = [];
  const hoy = new Date();

  for (let i = 0; i < mesesAdelante; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    meses.push({
      numero: fecha.getMonth(),
      nombre: nombresMeses[fecha.getMonth()],
      anio: fecha.getFullYear(),
    });
  }

  return meses;
};

export const generarDiasDelMes = (mes: MesOption): number[] => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const ultimoDia = new Date(mes.anio, mes.numero + 1, 0);
  const dias: number[] = [];

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const fecha = new Date(mes.anio, mes.numero, dia);
    if (fecha >= hoy) dias.push(dia);
  }

  return dias;
};