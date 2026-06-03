import { useEffect, useState, useCallback, useMemo, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { MedicoApiService } from "../../services/medico.service";
import type { MedicoPerfil } from "../../services/medico.service";
import { CitaApiService } from "../../services/cita.service";
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import { toISODateLocal, obtenerInicioSemana } from "../../utils/fecha.utils";
import MiniCalendario from "../Calendario/MiniCalendario";
import CalendarioTopbar from "../Calendario/CalendarioTopBar";
import VistaDia from "../Calendario/VistaDia";
import VistaSemana from "../Calendario/VistaSemana";
import VistaMes from "../Calendario/VistaMes";
import "../Calendario/Calendario.css";
import "./MedicoCitas.css";

type Vista = "dia" | "semana" | "mes";

const HORA_INICIO = 8;
const HORA_FIN    = 17;
const HORAS_LABORALES = Array.from(
  { length: Math.ceil(((HORA_FIN - HORA_INICIO) * 60) / 15) },
  (_, i) => {
    const mins = HORA_INICIO * 60 + i * 15;
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  }
);

const ESTADOS_ACTIVOS_CAL = ["PENDIENTE", "REPROGRAMADA", "ASISTIO"];

interface CalState {
  fecha: Date;
  vista: Vista;
  citas: CitaTransformada[];
  loading: boolean;
  citaSelId: string | null;
}

type CalAction =
  | { type: "SET_FECHA";   fecha: Date }
  | { type: "SET_VISTA";   vista: Vista }
  | { type: "SET_CITAS";   citas: CitaTransformada[] }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SEL_CITA";   id: string | null };

const calReducer = (s: CalState, a: CalAction): CalState => {
  switch (a.type) {
    case "SET_FECHA":   return { ...s, fecha: a.fecha };
    case "SET_VISTA":   return { ...s, vista: a.vista };
    case "SET_CITAS":   return { ...s, citas: a.citas };
    case "SET_LOADING": return { ...s, loading: a.value };
    case "SEL_CITA":    return { ...s, citaSelId: a.id };
    default:            return s;
  }
};

const calInitial: CalState = {
  fecha: new Date(),
  vista: "dia",
  citas: [],
  loading: false,
  citaSelId: null,
};

export default function MedicoCalendario() {
  const navigate = useNavigate();

  const [perfil, setPerfil]               = useState<MedicoPerfil | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [cal, dispCal]                    = useReducer(calReducer, calInitial);

  useEffect(() => {
    MedicoApiService.obtenerMiPerfil()
      .then(setPerfil)
      .catch(console.error)
      .finally(() => setCargandoPerfil(false));
  }, []);

  const cargarCitas = useCallback(async () => {
    if (!perfil) return;
    dispCal({ type: "SET_LOADING", value: true });
    try {
      const data = await CitaApiService.obtenerCalendario(
        toISODateLocal(cal.fecha),
        cal.vista,
        perfil._id,
      );
      dispCal({ type: "SET_CITAS", citas: data });
    } catch {
      dispCal({ type: "SET_CITAS", citas: [] });
    } finally {
      dispCal({ type: "SET_LOADING", value: false });
    }
  }, [perfil, cal.fecha, cal.vista]);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  const miDoctor = useMemo<DoctorTransformado | null>(() => {
    if (!perfil) return null;
    return {
      id:             perfil._id,
      nombres:        perfil.nombres,
      apellidos:      perfil.apellidos,
      correo:         perfil.correo,
      telefono:       perfil.telefono,
      especialidad:   perfil.especialidadId.nombre,
      especialidadId: perfil.especialidadId._id,
      cmp:            perfil.cmp,
    };
  }, [perfil]);

  const doctores     = useMemo(() => (miDoctor ? [miDoctor] : []), [miDoctor]);
  const citasActivas = useMemo(
    () => cal.citas.filter(c => ESTADOS_ACTIVOS_CAL.includes(c.estado)),
    [cal.citas]
  );

  const inicioSemana = useMemo(() => obtenerInicioSemana(cal.fecha), [cal.fecha]);

  const diasDelMes = useMemo(() => {
    const anio = cal.fecha.getFullYear();
    const mes  = cal.fecha.getMonth();
    const inicio = new Date(anio, mes, 1);
    const fin    = new Date(anio, mes + 1, 0);
    const dias: Date[] = [];
    const offset = (inicio.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) dias.push(new Date(NaN));
    for (let d = 1; d <= fin.getDate(); d++) dias.push(new Date(anio, mes, d));
    return dias;
  }, [cal.fecha]);

  const cambiarFecha = useCallback((delta: number) => {
    const nueva = new Date(cal.fecha);
    if      (cal.vista === "mes")    nueva.setMonth(nueva.getMonth() + delta);
    else if (cal.vista === "semana") nueva.setDate(nueva.getDate() + delta * 7);
    else                             nueva.setDate(nueva.getDate() + delta);
    dispCal({ type: "SET_FECHA", fecha: nueva });
  }, [cal.fecha, cal.vista]);

  const tituloCalendario = useMemo(() => {
    if (cal.vista === "mes")
      return cal.fecha.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
    if (cal.vista === "dia")
      return cal.fecha.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const inicio = obtenerInicioSemana(cal.fecha);
    const fin    = new Date(inicio); fin.setDate(inicio.getDate() + 6);
    return `${inicio.toLocaleDateString("es-PE")} – ${fin.toLocaleDateString("es-PE")}`;
  }, [cal.fecha, cal.vista]);

  const irADetalleCita = useCallback((e: React.MouseEvent | React.KeyboardEvent, citaId: string) => {
    e.stopPropagation();
    const cita = cal.citas.find(c => c._id === citaId);
    if (cita?.estado === "PENDIENTE" || cita?.estado === "ASISTIO") {
      navigate(`/medico/citas/${citaId}/consulta`);
    } else {
      navigate(`/citas/${citaId}`);
    }
  }, [cal.citas, navigate]);

  if (cargandoPerfil) {
    return (
      <div className="lista-page">
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-page">
      <div className="lista-page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>Calendario</h1>
        </div>
      </div>

      <div className="mc-cal-wrap">
        <div className="mc-cal-sidebar">
          <MiniCalendario
            fecha={cal.fecha}
            onChange={f => dispCal({ type: "SET_FECHA", fecha: f })}
          />
          {miDoctor && (
            <div className="mc-cal-medico-card">
              <div className="mc-cal-medico-avatar">
                {miDoctor.apellidos[0]}{miDoctor.nombres[0]}
              </div>
              <div className="mc-cal-medico-info">
                <span className="mc-cal-medico-nombre">
                  Dr. {miDoctor.nombres} {miDoctor.apellidos}
                </span>
                <span className="mc-cal-medico-esp">{miDoctor.especialidad}</span>
                {miDoctor.cmp && (
                  <span className="mc-cal-medico-cmp">CMP {miDoctor.cmp}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mc-cal-main">
          <CalendarioTopbar
            titulo={tituloCalendario}
            vista={cal.vista}
            onCambiarFecha={cambiarFecha}
            onCambiarVista={v => dispCal({ type: "SET_VISTA", vista: v as Vista })}
          />

          {cal.loading && (
            <div className="loading-indicator">Cargando agenda…</div>
          )}

          {!cal.loading && perfil && (
            <>
              {cal.vista === "dia" && (
                <VistaDia
                  fecha={cal.fecha}
                  horas={HORAS_LABORALES}
                  citas={citasActivas}
                  doctores={doctores}
                  doctorId={perfil._id}
                  onVerCita={irADetalleCita}
                />
              )}
              {cal.vista === "semana" && (
                <VistaSemana
                  inicioSemana={inicioSemana}
                  horas={HORAS_LABORALES}
                  citas={citasActivas}
                  doctores={doctores}
                  doctorId={perfil._id}
                  onVerCita={irADetalleCita}
                />
              )}
              {cal.vista === "mes" && (
                <VistaMes
                  diasDelMes={diasDelMes}
                  citas={citasActivas}
                  doctores={doctores}
                  doctorId={perfil._id}
                  bloqueos={[]}
                  onVerCita={irADetalleCita}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
