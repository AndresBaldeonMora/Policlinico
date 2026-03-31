import { useEffect, useReducer, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CitaApiService } from "../../services/cita.service";
import { DoctorApiService } from "../../services/doctor.service";
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import MiniCalendario from "./MiniCalendario";
import CalendarioTopbar from "./CalendarioTopBar";
import DoctoresPanel from "./DoctoresPanel";
import VistaMes from "./VistaMes";
import VistaSemana from "./VistaSemana";
import VistaDia from "./VistaDia";
import "./Calendario.css";

type Vista = "dia" | "semana" | "mes";

const DOCTOR_TODOS_ID = "ALL";
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
  doctorId: string;
  loading: boolean;
}

type CalendarioAction =
  | { type: "SET_VISTA"; vista: Vista }
  | { type: "SET_FECHA"; fecha: Date }
  | { type: "SET_CITAS"; citas: CitaTransformada[] }
  | { type: "SET_DOCTORES"; doctores: DoctorTransformado[] }
  | { type: "SET_DOCTOR_ID"; doctorId: string }
  | { type: "SET_LOADING"; value: boolean };

const initialState: CalendarioState = {
  vista: "dia",
  fecha: new Date(),
  citas: [],
  doctores: [],
  doctorId: DOCTOR_TODOS_ID,
  loading: false,
};

function calendarioReducer(state: CalendarioState, action: CalendarioAction): CalendarioState {
  switch (action.type) {
    case "SET_VISTA":     return { ...state, vista: action.vista };
    case "SET_FECHA":     return { ...state, fecha: action.fecha };
    case "SET_CITAS":     return { ...state, citas: action.citas };
    case "SET_DOCTORES":  return { ...state, doctores: action.doctores };
    case "SET_DOCTOR_ID": return { ...state, doctorId: action.doctorId };
    case "SET_LOADING":   return { ...state, loading: action.value };
    default:              return state;
  }
}

interface CalendarioProps {
  medicoFijo?: string;
}

const Calendario = ({ medicoFijo }: CalendarioProps) => {
  const [state, dispatch] = useReducer(calendarioReducer, {
    ...initialState,
    doctorId: medicoFijo ?? DOCTOR_TODOS_ID,
  });
  const { vista, fecha, citas, doctores, doctorId, loading } = state;
  const navigate = useNavigate();

  const cargarDoctores = useCallback(async () => {
    try {
      dispatch({ type: "SET_DOCTORES", doctores: await DoctorApiService.listar() });
    } catch {
      dispatch({ type: "SET_DOCTORES", doctores: [] });
    }
  }, []);

  useEffect(() => {
    if (!medicoFijo) return;
    DoctorApiService.obtenerPorId(medicoFijo)
      .then((doc) => dispatch({ type: "SET_DOCTORES", doctores: [doc] }))
      .catch(() => {});
  }, [medicoFijo]);

  const cargarCitas = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", value: true });
      dispatch({
        type: "SET_CITAS",
        citas: await CitaApiService.obtenerCalendario(toISODateLocal(fecha), vista, doctorId),
      });
    } catch {
      dispatch({ type: "SET_CITAS", citas: [] });
    } finally {
      dispatch({ type: "SET_LOADING", value: false });
    }
  }, [fecha, vista, doctorId]);

  // Solo carga doctores si NO es médico fijo (recepcionista / admin)
  useEffect(() => {
    if (!medicoFijo) cargarDoctores();
  }, [cargarDoctores, medicoFijo]);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  const cambiarFecha = useCallback((delta: number) => {
    const nueva = new Date(fecha);
    if (vista === "mes")         nueva.setMonth(nueva.getMonth() + delta);
    else if (vista === "semana") nueva.setDate(nueva.getDate() + delta * 7);
    else                         nueva.setDate(nueva.getDate() + delta);
    dispatch({ type: "SET_FECHA", fecha: nueva });
  }, [fecha, vista]);

  const irADetalleCita = useCallback((e: React.MouseEvent | React.KeyboardEvent, citaId: string) => {
    e.stopPropagation();
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

  // Para VistaDia/Semana/Mes: si es médico fijo, construimos un array con solo ese doctor
  // para que el componente renderice solo su columna (sin necesidad de cambiar VistaDia)
  const doctoresParaVista = medicoFijo
    ? doctores.filter((d) => d.id === medicoFijo)
    : doctores;

  return (
    <div className="calendario-container">
      <div className="calendario-layout">
        <div className="calendario-left">
          <MiniCalendario
            fecha={fecha}
            onChange={(f) => dispatch({ type: "SET_FECHA", fecha: f })}
          />
          {/* Panel de doctores: solo para recepcionista / admin */}
          {!medicoFijo && (
            <DoctoresPanel
              doctores={doctores}
              doctorId={doctorId}
              onSeleccionar={(id) => dispatch({ type: "SET_DOCTOR_ID", doctorId: id })}
            />
          )}
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
                  doctores={doctoresParaVista}
                  doctorId={doctorId}
                  onVerCita={irADetalleCita}
                />
              )}
              {vista === "semana" && (
                <VistaSemana
                  inicioSemana={inicioSemana}
                  horas={HORAS_LABORALES}
                  citas={citas}
                  doctores={doctoresParaVista}
                  doctorId={doctorId}
                  onVerCita={irADetalleCita}
                />
              )}
              {vista === "mes" && (
                <VistaMes
                  diasDelMes={diasDelMes}
                  citas={citas}
                  doctores={doctoresParaVista}
                  doctorId={doctorId}
                  onVerCita={irADetalleCita}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendario;