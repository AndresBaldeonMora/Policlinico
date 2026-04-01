import { useEffect, useReducer, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CitaApiService } from "../../services/cita.service";
import { DoctorApiService } from "../../services/doctor.service";
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import { useAuth } from "../../hooks/userAuth";
import MiniCalendario from "./MiniCalendario";
import CalendarioTopbar from "./CalendarioTopBar";
import VistaMes from "./VistaMes";
import VistaSemana from "./VistaSemana";
import VistaDia from "./VistaDia";
import CitaQuickModal from "../../components/CitaQuickModal/CitaQuickModal";
import "./Calendario.css";

type Vista = "dia" | "semana" | "mes";

const HORA_INICIO = 8;
const HORA_FIN = 17;
const INTERVALO_MINUTOS = 15;

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

const HORAS_LABORALES = (() => {
  const totalMinutos = (HORA_FIN - HORA_INICIO) * 60;
  return Array.from({ length: Math.ceil(totalMinutos / INTERVALO_MINUTOS) }, (_, i) => {
    const mins = HORA_INICIO * 60 + i * INTERVALO_MINUTOS;
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  });
})();

interface CalendarioState {
  vista: Vista;
  fecha: Date;
  citas: CitaTransformada[];
  doctores: DoctorTransformado[];
  loading: boolean;
  citaSeleccionadaId: string | null;
}

type CalendarioAction =
  | { type: "SET_VISTA"; vista: Vista }
  | { type: "SET_FECHA"; fecha: Date }
  | { type: "SET_CITAS"; citas: CitaTransformada[] }
  | { type: "SET_DOCTORES"; doctores: DoctorTransformado[] }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SELECCIONAR_CITA"; citaId: string | null };

const initialState: CalendarioState = {
  vista: "dia",
  fecha: new Date(),
  citas: [],
  doctores: [],
  loading: false,
  citaSeleccionadaId: null,
};

function calendarioReducer(state: CalendarioState, action: CalendarioAction): CalendarioState {
  switch (action.type) {
    case "SET_VISTA":         return { ...state, vista: action.vista };
    case "SET_FECHA":         return { ...state, fecha: action.fecha };
    case "SET_CITAS":         return { ...state, citas: action.citas };
    case "SET_DOCTORES":      return { ...state, doctores: action.doctores };
    case "SET_LOADING":       return { ...state, loading: action.value };
    case "SELECCIONAR_CITA":  return { ...state, citaSeleccionadaId: action.citaId };
    default:                  return state;
  }
}

const CalendarioMedico = () => {
  const [state, dispatch] = useReducer(calendarioReducer, initialState);
  const { vista, fecha, citas, doctores, loading, citaSeleccionadaId } = state;
  const navigate = useNavigate();
  const { user } = useAuth();
  const medicoId = user?.medicoId ?? "";

  const cargarDoctores = useCallback(async () => {
    try {
      dispatch({ type: "SET_DOCTORES", doctores: await DoctorApiService.listar() });
    } catch {
      dispatch({ type: "SET_DOCTORES", doctores: [] });
    }
  }, []);

  const cargarCitas = useCallback(async () => {
    if (!medicoId) return;
    try {
      dispatch({ type: "SET_LOADING", value: true });
      dispatch({
        type: "SET_CITAS",
        citas: await CitaApiService.obtenerCalendario(toISODateLocal(fecha), vista, medicoId),
      });
    } catch {
      dispatch({ type: "SET_CITAS", citas: [] });
    } finally {
      dispatch({ type: "SET_LOADING", value: false });
    }
  }, [fecha, vista, medicoId]);

  useEffect(() => { cargarDoctores(); }, [cargarDoctores]);
  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  const cambiarFecha = useCallback((delta: number) => {
    const nueva = new Date(fecha);
    if (vista === "mes")         return dispatch({ type: "SET_FECHA", fecha: new Date(fecha.getFullYear(), fecha.getMonth() + delta, 1) });
    else if (vista === "semana") nueva.setDate(nueva.getDate() + delta * 7);
    else                         nueva.setDate(nueva.getDate() + delta);
    dispatch({ type: "SET_FECHA", fecha: nueva });
  }, [fecha, vista]);

  const irADetalleCita = useCallback((_e: React.MouseEvent | React.KeyboardEvent, citaId: string) => {
    dispatch({ type: "SELECCIONAR_CITA", citaId });
  }, []);

  const cerrarModal = useCallback(() => {
    dispatch({ type: "SELECCIONAR_CITA", citaId: null });
  }, []);

  const irAPerfilCita = useCallback((citaId: string) => {
    dispatch({ type: "SELECCIONAR_CITA", citaId: null });
    navigate(`/citas/${citaId}`);
  }, [navigate]);

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

  return (
    <div className="calendario-container">
      <div className="calendario-layout">
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

          {loading && <div className="loading-indicator">Cargando citas...</div>}

          {!loading && (
            <>
              {vista === "dia" && (
                <VistaDia
                  fecha={fecha}
                  horas={HORAS_LABORALES}
                  citas={citas}
                  doctores={doctores}
                  doctorId={medicoId}
                  onVerCita={irADetalleCita}
                />
              )}
              {vista === "semana" && (
                <VistaSemana
                  inicioSemana={inicioSemana}
                  horas={HORAS_LABORALES}
                  citas={citas}
                  doctores={doctores}
                  doctorId={medicoId}
                  onVerCita={irADetalleCita}
                />
              )}
              {vista === "mes" && (
                <VistaMes
                  diasDelMes={diasDelMes}
                  citas={citas}
                  doctores={doctores}
                  doctorId={medicoId}
                  onVerCita={irADetalleCita}
                />
              )}
            </>
          )}
        </div>
      </div>

      {citaSeleccionadaId && (
        <CitaQuickModal
          citaId={citaSeleccionadaId}
          onCerrar={cerrarModal}
          onCitaActualizada={cargarCitas}
          onIrADetalle={irAPerfilCita}
        />
      )}
    </div>
  );
};

export default CalendarioMedico;
