<<<<<<< HEAD
import { useEffect, useReducer, useCallback } from "react";
import { MedicoApiService } from "../../services/medico.service";
import type { MedicoPerfil } from "../../services/medico.service";
import { useAuth } from "../../hooks/userAuth";
import Calendario from "../Calendario/Calendario";
import "./MedicoDashboard.css";

interface State {
  loading: boolean;
  perfil: MedicoPerfil | null;
}

type Action =
  | { type: "CARGA_INICIO" }
  | { type: "CARGA_EXITO"; perfil: MedicoPerfil }
  | { type: "CARGA_ERROR" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CARGA_INICIO": return { ...state, loading: true };
    case "CARGA_EXITO":  return { loading: false, perfil: action.perfil };
    case "CARGA_ERROR":  return { ...state, loading: false };
    default:             return state;
  }
}

const MedicoDashboard = () => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { loading: true, perfil: null });
  const { loading, perfil } = state;

  const cargarPerfil = useCallback(async () => {
=======
import { useReducer, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MedicoApiService } from "../../services/medico.service";
import { CitaApiService } from "../../services/cita.service";
import { DoctorApiService } from "../../services/doctor.service";
import type { CitaMedico, MedicoPerfil } from "../../services/medico.service";
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import type { Vista } from "../Calendario/types";
import { useAuth } from "../../hooks/userAuth";
import MedicoHeader from "./MedicoHeader";
import MiniCalendario from "../Calendario/MiniCalendario";
import CalendarioTopbar from "../Calendario/CalendarioTopBar";
import VistaDia from "../Calendario/VistaDia";
import VistaSemana from "../Calendario/VistaSemana";
import VistaMes from "../Calendario/VistaMes";
import "./MedicoDashboard.css";

const HORA_INICIO = 8;
const HORA_FIN = 17;
const INTERVALO_MINUTOS = 15;

const HORAS_LABORALES = (() => {
  const totalMinutos = (HORA_FIN - HORA_INICIO) * 60;
  return Array.from({ length: Math.ceil(totalMinutos / INTERVALO_MINUTOS) }, (_, i) => {
    const mins = HORA_INICIO * 60 + i * INTERVALO_MINUTOS;
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  });
})();

const toISODateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const obtenerInicioSemana = (d: Date): Date => {
  const inicio = new Date(d);
  const offset = (inicio.getDay() + 6) % 7;
  inicio.setDate(inicio.getDate() - offset);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
};

interface DashboardState {
  loading: boolean;
  perfil: MedicoPerfil | null;
  citasHoy: CitaMedico[];
  todasLasCitas: CitaMedico[];
  vista: Vista;
  fecha: Date;
  citasCalendario: CitaTransformada[];
  doctores: DoctorTransformado[];
  loadingCalendario: boolean;
}

type DashboardAction =
  | { type: "CARGA_INICIO" }
  | { type: "CARGA_EXITO"; perfil: MedicoPerfil; citasHoy: CitaMedico[]; todasLasCitas: CitaMedico[] }
  | { type: "CARGA_ERROR" }
  | { type: "SET_VISTA"; vista: Vista }
  | { type: "SET_FECHA"; fecha: Date }
  | { type: "SET_CITAS_CALENDARIO"; citas: CitaTransformada[] }
  | { type: "SET_DOCTORES"; doctores: DoctorTransformado[] }
  | { type: "SET_LOADING_CALENDARIO"; value: boolean };

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "CARGA_INICIO":
      return { ...state, loading: true };
    case "CARGA_EXITO":
      return { ...state, loading: false, perfil: action.perfil, citasHoy: action.citasHoy, todasLasCitas: action.todasLasCitas };
    case "CARGA_ERROR":
      return { ...state, loading: false };
    case "SET_VISTA":
      return { ...state, vista: action.vista };
    case "SET_FECHA":
      return { ...state, fecha: action.fecha };
    case "SET_CITAS_CALENDARIO":
      return { ...state, citasCalendario: action.citas };
    case "SET_DOCTORES":
      return { ...state, doctores: action.doctores };
    case "SET_LOADING_CALENDARIO":
      return { ...state, loadingCalendario: action.value };
    default:
      return state;
  }
}

const initialState: DashboardState = {
  loading: true,
  perfil: null,
  citasHoy: [],
  todasLasCitas: [],
  vista: "dia",
  fecha: new Date(),
  citasCalendario: [],
  doctores: [],
  loadingCalendario: false,
};

const MedicoDashboard = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { loading, perfil, citasHoy, todasLasCitas, vista, fecha, citasCalendario, doctores, loadingCalendario } = state;
  const navigate = useNavigate();
  const { user } = useAuth();
  const medicoId = user?.medicoId ?? "";

  const cargarDatos = useCallback(async () => {
>>>>>>> feature/Fabrizio-Diaz
    dispatch({ type: "CARGA_INICIO" });
    try {
      const perfilData = await MedicoApiService.obtenerMiPerfil();
      dispatch({ type: "CARGA_EXITO", perfil: perfilData });
    } catch {
      dispatch({ type: "CARGA_ERROR" });
    }
  }, []);

<<<<<<< HEAD
  useEffect(() => { cargarPerfil(); }, [cargarPerfil]);
=======
  const cargarDoctores = useCallback(async () => {
    try {
      dispatch({ type: "SET_DOCTORES", doctores: await DoctorApiService.listar() });
    } catch {
      dispatch({ type: "SET_DOCTORES", doctores: [] });
    }
  }, []);

  const cargarCitasCalendario = useCallback(async () => {
    if (!medicoId) return;
    try {
      dispatch({ type: "SET_LOADING_CALENDARIO", value: true });
      const citas = await CitaApiService.obtenerCalendario(toISODateLocal(fecha), vista, medicoId);
      dispatch({ type: "SET_CITAS_CALENDARIO", citas });
    } catch {
      dispatch({ type: "SET_CITAS_CALENDARIO", citas: [] });
    } finally {
      dispatch({ type: "SET_LOADING_CALENDARIO", value: false });
    }
  }, [fecha, vista, medicoId]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);
  useEffect(() => { cargarDoctores(); }, [cargarDoctores]);
  useEffect(() => { cargarCitasCalendario(); }, [cargarCitasCalendario]);

  const cambiarFecha = useCallback((delta: number) => {
    const nueva = new Date(fecha);
    if (vista === "mes") nueva.setMonth(nueva.getMonth() + delta);
    else if (vista === "semana") nueva.setDate(nueva.getDate() + delta * 7);
    else nueva.setDate(nueva.getDate() + delta);
    dispatch({ type: "SET_FECHA", fecha: nueva });
  }, [fecha, vista]);

  const irADetalleCita = useCallback((e: React.MouseEvent | React.KeyboardEvent, citaId: string) => {
    e.stopPropagation();
    navigate(`/citas/${citaId}`);
  }, [navigate]);

  const estadisticas = {
    citasHoy: citasHoy.length,
    pendientes: citasHoy.filter((c) => c.estado === "PENDIENTE").length,
    atendidas: todasLasCitas.filter((c) => c.estado === "ATENDIDA").length,
    canceladas: todasLasCitas.filter((c) => c.estado === "CANCELADA").length,
  };
>>>>>>> feature/Fabrizio-Diaz

  const diasDelMes = useMemo(() => {
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth();
    const inicio = new Date(anio, mes, 1);
    const fin = new Date(anio, mes + 1, 0);
    const dias: Date[] = [];
    const offset = (inicio.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) dias.push(new Date(NaN));
    for (let d = 1; d <= fin.getDate(); d++) dias.push(new Date(anio, mes, d));
    return dias;
  }, [fecha]);

  const inicioSemana = useMemo(() => obtenerInicioSemana(fecha), [fecha]);

  const tituloCalendario = (() => {
    if (vista === "mes") return fecha.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
    if (vista === "dia") return fecha.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const inicio = obtenerInicioSemana(fecha);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    return `${inicio.toLocaleDateString("es-PE")} – ${fin.toLocaleDateString("es-PE")}`;
  })();

  if (loading) {
    return (
      <div className="md-loading">
        <div className="md-spinner" />
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="md-container">
      {/* ── Perfil ── */}
      {perfil && (
        <div className="md-perfil">
          <div className="md-perfil-avatar">
            {perfil.nombres.charAt(0)}{perfil.apellidos.charAt(0)}
          </div>
          <div className="md-perfil-info">
            <h2>Dr. {perfil.nombres} {perfil.apellidos}</h2>
            <span className="md-especialidad">{perfil.especialidadId.nombre}</span>
          </div>
          <div className="md-perfil-datos">
            {perfil.cmp && (
              <div className="md-dato">
                <span className="md-dato-label">CMP</span>
                <span className="md-dato-value">{perfil.cmp}</span>
              </div>
            )}
            <div className="md-dato">
              <span className="md-dato-label">Correo</span>
              <span className="md-dato-value">{perfil.correo}</span>
            </div>
            <div className="md-dato">
              <span className="md-dato-label">Teléfono</span>
              <span className="md-dato-value">{perfil.telefono}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendario ── */}
      <div className="md-calendario">
        <Calendario medicoFijo={user?.medicoId} />
      </div>
=======
    <div className="medico-dashboard">
      {perfil && <MedicoHeader perfil={perfil} estadisticas={estadisticas} />}

      <div className="calendario-container">
        <div className="medico-calendario-layout">
          <div className="calendario-left">
            <MiniCalendario fecha={fecha} onChange={(f) => dispatch({ type: "SET_FECHA", fecha: f })} />
          </div>

          <div className="calendario-main">
            <CalendarioTopbar
              titulo={tituloCalendario}
              vista={vista}
              onCambiarFecha={cambiarFecha}
              onCambiarVista={(v) => dispatch({ type: "SET_VISTA", vista: v })}
            />

            {loadingCalendario && <div className="loading-indicator">Cargando citas...</div>}

            {!loadingCalendario && (
              <>
                {vista === "dia" && (
                  <VistaDia
                    fecha={fecha}
                    horas={HORAS_LABORALES}
                    citas={citasCalendario}
                    doctores={doctores}
                    doctorId={medicoId}
                    onVerCita={irADetalleCita}
                  />
                )}
                {vista === "semana" && (
                  <VistaSemana
                    inicioSemana={inicioSemana}
                    horas={HORAS_LABORALES}
                    citas={citasCalendario}
                    doctores={doctores}
                    doctorId={medicoId}
                    onVerCita={irADetalleCita}
                  />
                )}
                {vista === "mes" && (
                  <VistaMes
                    diasDelMes={diasDelMes}
                    citas={citasCalendario}
                    doctores={doctores}
                    doctorId={medicoId}
                    onVerCita={irADetalleCita}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

>>>>>>> feature/Fabrizio-Diaz
    </div>
  );
};

export default MedicoDashboard;
