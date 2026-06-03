// src/pages/Calendario/Calendario.tsx
import { useEffect, useReducer, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { CitaApiService } from "../../services/cita.service";
import { DoctorApiService } from "../../services/doctor.service";
import { BloqueoService, type Bloqueo } from "../../services/bloqueo.service";
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import {
  listaCitasReducer, initialState as repInitial,
  type EditandoState, type MesOption, type HorarioPorDia,
} from "../ListaCitas/ListaCitasReducer";
import ReprogramarModal from "../ListaCitas/ReprogramarModal";
import { toISODateLocal, obtenerInicioSemana } from "../../utils/fecha.utils";
import MiniCalendario from "./MiniCalendario";
import CalendarioTopbar from "./CalendarioTopBar";
import DoctoresPanel from "./DoctoresPanel";
import VistaMes from "./VistaMes";
import VistaSemana from "./VistaSemana";
import VistaDia from "./VistaDia";
import CitaQuickModal from "../../components/CitaQuickModal/CitaQuickModal";
import CitaPanelModal from "../../components/CitaQuickModal/CitaPanelModal";
import PacienteDrawer from "../../components/PacienteDrawer/PacienteDrawer";
import "./Calendario.css";

const FECHA_COMPLETA_FMT = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const DIA_FMT = new Intl.DateTimeFormat("es-PE", { weekday: "long" });

const generarMeses = (): MesOption[] => {
  const nombres = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const hoy = new Date();
  return Array.from({ length: 3 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    return { numero: d.getMonth(), nombre: nombres[d.getMonth()], anio: d.getFullYear() };
  });
};

const obtenerNombreDia = (fecha: Date): string => {
  const n = DIA_FMT.format(fecha);
  return n.charAt(0).toUpperCase() + n.slice(1);
};

type Vista = "dia" | "semana" | "mes";

const DOCTOR_TODOS_ID = "ALL";
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

interface Posicion { x: number; y: number }

interface CalendarioState {
  vista: Vista;
  fecha: Date;
  citas: CitaTransformada[];
  doctores: DoctorTransformado[];
  doctorId: string;
  loading: boolean;
  citaPanelId: string | null;
  panelPos: Posicion;
  citaDetalleId: string | null;
  drawerPacienteId: string | null;
  bloqueos: Bloqueo[];
}

type CalendarioAction =
  | { type: "SET_VISTA"; vista: Vista }
  | { type: "SET_FECHA"; fecha: Date }
  | { type: "SET_CITAS"; citas: CitaTransformada[] }
  | { type: "SET_DOCTORES"; doctores: DoctorTransformado[] }
  | { type: "SET_DOCTOR_ID"; doctorId: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "ABRIR_PANEL"; citaId: string; pos: Posicion }
  | { type: "ABRIR_DETALLE"; citaId: string }
  | { type: "CERRAR_PANEL" }
  | { type: "CERRAR_DETALLE" }
  | { type: "ABRIR_DRAWER"; pacienteId: string }
  | { type: "CERRAR_DRAWER" }
  | { type: "SET_BLOQUEOS"; bloqueos: Bloqueo[] };

const initialState: CalendarioState = {
  vista: "dia",
  fecha: new Date(),
  citas: [],
  doctores: [],
  doctorId: DOCTOR_TODOS_ID,
  loading: false,
  citaPanelId: null,
  panelPos: { x: 0, y: 0 },
  citaDetalleId: null,
  drawerPacienteId: null,
  bloqueos: [],
};

function calendarioReducer(state: CalendarioState, action: CalendarioAction): CalendarioState {
  switch (action.type) {
    case "SET_VISTA":      return { ...state, vista: action.vista };
    case "SET_FECHA":      return { ...state, fecha: action.fecha };
    case "SET_CITAS":      return { ...state, citas: action.citas };
    case "SET_DOCTORES":   return { ...state, doctores: action.doctores };
    case "SET_DOCTOR_ID":  return { ...state, doctorId: action.doctorId };
    case "SET_LOADING":    return { ...state, loading: action.value };
    case "ABRIR_PANEL":    return { ...state, citaPanelId: action.citaId, panelPos: action.pos, citaDetalleId: null };
    case "ABRIR_DETALLE":  return { ...state, citaDetalleId: action.citaId };
    case "CERRAR_PANEL":   return { ...state, citaPanelId: null, citaDetalleId: null };
    case "CERRAR_DETALLE": return { ...state, citaDetalleId: null };
    case "ABRIR_DRAWER":   return { ...state, drawerPacienteId: action.pacienteId, citaPanelId: null };
    case "CERRAR_DRAWER":  return { ...state, drawerPacienteId: null };
    case "SET_BLOQUEOS":   return { ...state, bloqueos: action.bloqueos };
    default:               return state;
  }
}

const Calendario = () => {
  const [state, dispatch] = useReducer(calendarioReducer, initialState);
  const { vista, fecha, citas, doctores, doctorId, loading, citaPanelId, panelPos, citaDetalleId, drawerPacienteId, bloqueos } = state;

  // ── Estado del modal de reprogramar ──
  const [repState, repDispatch] = useReducer(listaCitasReducer, repInitial);
  const { editando, pasoModal, mesesDisponibles, horariosPorDia, cargandoHorarios } = repState;
  const navigate = useNavigate();

  const cargarDoctores = useCallback(async () => {
    try {
      dispatch({ type: "SET_DOCTORES", doctores: await DoctorApiService.listar() });
    } catch {
      dispatch({ type: "SET_DOCTORES", doctores: [] });
    }
  }, []);

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

  const cargarBloqueos = useCallback(async () => {
    try {
      const mes = fecha.getMonth() + 1;
      const anio = fecha.getFullYear();
      const params: { mes: number; anio: number; doctorId?: string } = { mes, anio };
      if (doctorId !== DOCTOR_TODOS_ID) params.doctorId = doctorId;
      dispatch({ type: "SET_BLOQUEOS", bloqueos: await BloqueoService.listar(params) });
    } catch {
      dispatch({ type: "SET_BLOQUEOS", bloqueos: [] });
    }
  }, [fecha, doctorId]);

  useEffect(() => { cargarDoctores(); }, [cargarDoctores]);
  useEffect(() => { cargarCitas(); }, [cargarCitas]);
  useEffect(() => { cargarBloqueos(); }, [cargarBloqueos]);

  const cambiarFecha = useCallback((delta: number) => {
    const nueva = new Date(fecha);
    if (vista === "mes")         return dispatch({ type: "SET_FECHA", fecha: new Date(fecha.getFullYear(), fecha.getMonth() + delta, 1) });
    else if (vista === "semana") nueva.setDate(nueva.getDate() + delta * 7);
    else                         nueva.setDate(nueva.getDate() + delta);
    dispatch({ type: "SET_FECHA", fecha: nueva });
  }, [fecha, vista]);
  
  const irADetalleCita = useCallback((e: React.MouseEvent | React.KeyboardEvent, citaId: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dispatch({ type: "ABRIR_PANEL", citaId, pos: { x: rect.right, y: rect.top } });
  }, []);

  const cerrarPanel = useCallback(() => dispatch({ type: "CERRAR_PANEL" }), []);
  const cerrarDetalle = useCallback(() => dispatch({ type: "CERRAR_DETALLE" }), []);
  const abrirDetalle = useCallback((citaId: string) => dispatch({ type: "ABRIR_DETALLE", citaId }), []);
  const irAPerfilCita = useCallback((citaId: string) => {
    dispatch({ type: "CERRAR_PANEL" });
    navigate(`/citas/${citaId}`);
  }, [navigate]);

  const handleAbrirDrawer = useCallback((pacienteId: string) => {
    dispatch({ type: "ABRIR_DRAWER", pacienteId });
  }, []);

  // ── Acción: En sala de espera ──
  const handleEnSalaEspera = useCallback(async (citaId: string) => {
    try {
      await CitaApiService.cambiarEstado(citaId, "ASISTIO");
      cargarCitas();
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar el estado." });
    }
  }, [cargarCitas]);

  // ── Acción: Eliminar ──
  const handleEliminar = useCallback(async (citaId: string) => {
    const result = await Swal.fire({
      title: "Eliminar cita",
      text: "¿Estás seguro? Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await CitaApiService.eliminar(citaId);
      cargarCitas();
      Swal.fire({ icon: "success", title: "Cita eliminada", toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar la cita." });
    }
  }, [cargarCitas]);

  // ── Acción: Reprogramar ──
  const handleAbrirReprogramar = useCallback((cita: CitaTransformada) => {
    cerrarPanel();
    const pac = cita.pacienteId && typeof cita.pacienteId === "object" ? cita.pacienteId : null;
    const doc = cita.doctorId   && typeof cita.doctorId   === "object" ? cita.doctorId   : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const esp = doc?.especialidadId && typeof doc.especialidadId === "object" ? (doc.especialidadId as any).nombre : "—";
    const payload: EditandoState = {
      id:            cita._id,
      dni:           pac?.dni ?? "",
      paciente:      pac ? `${pac.nombres} ${pac.apellidos}` : "—",
      especialidad:  esp,
      doctor:        doc ? `${(doc as any).nombres} ${(doc as any).apellidos}` : "—",
      doctorId:      doc?._id ?? "",
      fecha:         "",
      hora:          "",
      fechaOriginal: new Date(cita.fecha + "T00:00:00").toLocaleDateString("es-PE"),
      horaOriginal:  cita.hora,
    };
    repDispatch({ type: "SET_MESES_DISPONIBLES", payload: generarMeses() });
    repDispatch({ type: "OPEN_MODAL", payload });
  }, [cerrarPanel]);

  const handleSelectFechaRep = useCallback(async (fechaISO: string) => {
    if (!editando) return;
    repDispatch({ type: "SELECT_FECHA", payload: { fechaISO } });
    const [y, m, d] = fechaISO.split("-").map(Number);
    const fechaDate = new Date(y, m - 1, d);
    repDispatch({ type: "SET_CARGANDO_HORARIOS", payload: true });
    try {
      const slots = await DoctorApiService.obtenerHorariosDisponibles(editando.doctorId, fechaISO);
      const info: HorarioPorDia = {
        fecha: FECHA_COMPLETA_FMT.format(fechaDate),
        fechaISO, diaNombre: obtenerNombreDia(fechaDate), diaNumero: d, horarios: slots,
      };
      repDispatch({ type: "SET_HORARIOS_POR_DIA", payload: [info] });
    } catch {
      repDispatch({ type: "SET_HORARIOS_POR_DIA", payload: [] });
    } finally {
      repDispatch({ type: "SET_CARGANDO_HORARIOS", payload: false });
    }
  }, [editando]);

  const handleConfirmarRep = useCallback(async () => {
    if (!editando?.fecha || !editando?.hora) return;
    try {
      await CitaApiService.reprogramar(editando.id, editando.fecha, editando.hora);
      repDispatch({ type: "CLOSE_MODAL" });
      cargarCitas();
      Swal.fire({ icon: "success", title: "Cita reprogramada", toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo reprogramar la cita." });
    }
  }, [editando, cargarCitas]);

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

  const ESTADOS_ACTIVOS = ["PENDIENTE", "REPROGRAMADA", "ASISTIO"];
  const citasActivas = useMemo(
    () => citas.filter((c) => ESTADOS_ACTIVOS.includes(c.estado)),
    [citas] // eslint-disable-line react-hooks/exhaustive-deps
  );

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
          <DoctoresPanel
            doctores={doctores}
            doctorId={doctorId}
            onSeleccionar={(id) => dispatch({ type: "SET_DOCTOR_ID", doctorId: id })}
          />
        </div>

        <div className="calendario-main">
          <CalendarioTopbar
            titulo={tituloCalendario}
            vista={vista}
            onCambiarFecha={cambiarFecha}
            onCambiarVista={(v) => dispatch({ type: "SET_VISTA", vista: v })}
          />

          {loading && <div className="loading-indicator">Cargando citas…</div>}

          {!loading && (
            <>
              {vista === "dia" && (
                <VistaDia
                  fecha={fecha}
                  horas={HORAS_LABORALES}
                  citas={citasActivas}
                  doctores={doctores}
                  doctorId={doctorId}
                  onVerCita={irADetalleCita}
                />
              )}
              {vista === "semana" && (
                <VistaSemana
                  inicioSemana={inicioSemana}
                  horas={HORAS_LABORALES}
                  citas={citasActivas}
                  doctores={doctores}
                  doctorId={doctorId}
                  onVerCita={irADetalleCita}
                />
              )}
              {vista === "mes" && (
                <VistaMes
                  diasDelMes={diasDelMes}
                  citas={citasActivas}
                  doctores={doctores}
                  doctorId={doctorId}
                  bloqueos={bloqueos}
                  onVerCita={irADetalleCita}
                />
              )}
            </>
          )}
        </div>
      </div>

      {citaPanelId && !citaDetalleId && (() => {
        const citaEncontrada = citas.find(c => c._id === citaPanelId);
        return citaEncontrada ? (
          <CitaPanelModal
            cita={citaEncontrada}
            posicion={panelPos}
            onCerrar={cerrarPanel}
            onVerDetalle={abrirDetalle}
            onReprogramar={handleAbrirReprogramar}
            onEnSalaEspera={handleEnSalaEspera}
            onEliminar={handleEliminar}
            onDatosPaciente={handleAbrirDrawer}
          />
        ) : null;
      })()}

      {citaDetalleId && (
        <CitaQuickModal
          citaId={citaDetalleId}
          onCerrar={cerrarDetalle}
          onCitaActualizada={cargarCitas}
          onIrADetalle={irAPerfilCita}
          onReprogramar={(cita) => { cerrarDetalle(); handleAbrirReprogramar(cita); }}
        />
      )}

      {drawerPacienteId && (
        <PacienteDrawer
          pacienteId={drawerPacienteId}
          onCerrar={() => dispatch({ type: "CERRAR_DRAWER" })}
        />
      )}

      {editando && (
        <ReprogramarModal
          editando={editando}
          pasoModal={pasoModal}
          mesesDisponibles={mesesDisponibles}
          horariosPorDia={horariosPorDia}
          cargandoHorarios={cargandoHorarios}
          onSelectFecha={handleSelectFechaRep}
          onSelectHora={(hora) => repDispatch({ type: "SET_HORA", payload: hora })}
          onSiguiente={() => {
            if (editando?.fecha && editando?.hora)
              repDispatch({ type: "SET_PASO_MODAL", payload: 2 });
          }}
          onVolver={() => repDispatch({ type: "SET_PASO_MODAL", payload: 1 })}
          onCerrar={() => repDispatch({ type: "CLOSE_MODAL" })}
          onConfirmar={handleConfirmarRep}
        />
      )}
    </div>
  );
};

export default Calendario;