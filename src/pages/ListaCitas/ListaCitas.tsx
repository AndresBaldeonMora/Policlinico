import { useEffect, useReducer, useRef, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./ListaCitas.css";
import { CitaApiService } from "../../services/cita.service";
import type { CitaProcesada } from "../../services/cita.service";
import { CalendarClock, XCircle, Search, Calendar, Clock, User, Stethoscope, Trash2 } from "lucide-react";
import { DoctorApiService } from "../../services/doctor.service";
import {
  listaCitasReducer,
  initialState,
} from "./ListaCitasReducer";
import type { MesOption, HorarioPorDia } from "./ListaCitasReducer";
import ReprogramarModal from "./ReprogramarModal";
import CitaQuickModal from "../../components/CitaQuickModal/CitaQuickModal";
import { hoyISO, isoADMY, fmtEstado } from "../../utils/fecha.utils";

const normalizeString = (str: string): string =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const FECHA_COMPLETA_FMT = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
const DIA_FMT = new Intl.DateTimeFormat("es-PE", { weekday: "long" });

const formatearFechaCompleta = (fecha: Date): string =>
  FECHA_COMPLETA_FMT.format(fecha);

// Regla de negocio: solo se puede reprogramar hasta 24h antes de la cita.
// `fecha` llega del backend en formato "DD/MM/YYYY" (es-PE); `hora` es hora local Perú (UTC-5).
const horasHastaCita = (fecha: string, hora: string): number => {
  const [h, m] = (hora ?? "23:59").split(":").map(Number);
  const [d, mo, y] = fecha.split("/").map(Number);
  if (!d || !mo || !y) return -Infinity; // fecha inválida → siempre bloquear
  const momentoUTC = Date.UTC(y, mo - 1, d, h + 5, m, 0, 0);
  return (momentoUTC - Date.now()) / (1000 * 60 * 60);
};

const obtenerNombreDia = (fecha: Date): string => {
  const nombre = DIA_FMT.format(fecha);
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
};

const generarMeses = (): MesOption[] => {
  const nombresMeses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const hoy = new Date();
  return Array.from({ length: 3 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    return { numero: d.getMonth(), nombre: nombresMeses[d.getMonth()], anio: d.getFullYear() };
  });
};

interface NotificationProps { message: string; type: "success" | "error"; visible: boolean; }
const Notification = ({ message, type, visible }: NotificationProps) => {
  if (!visible) return null;
  return <div className={`notification ${type}`}>{message}</div>;
};

const ESTADO_CONFIG: Record<string, { class: string; label: string }> = {
  PENDIENTE:    { class: "badge-info",          label: "Pendiente" },
  REPROGRAMADA: { class: "badge-reprogramada",  label: "Reprogramada" },
  ATENDIDA:     { class: "badge-success",       label: "Atendida" },
  CANCELADA:    { class: "badge-danger",        label: "Cancelada" },
  ASISTIO:      { class: "badge-asistio",       label: "Asistió" },
  VENCIDA:      { class: "badge-vencida",       label: "Vencida" },
};

const TABS_ESTADO = [
  { estado: "TODOS",     label: "Todos" },
  { estado: "PENDIENTE", label: "Pendiente" },
  { estado: "EN_SALA",   label: "En sala" },
  { estado: "ATENDIDA",  label: "Atendida" },
  { estado: "CANCELADA", label: "Cancelada" },
];

// Mapea cada tab a los estados reales que agrupa
const TAB_GRUPOS: Record<string, string[]> = {
  TODOS:     [],
  PENDIENTE: ["PENDIENTE", "REPROGRAMADA"],
  EN_SALA:   ["ASISTIO"],
  ATENDIDA:  ["ATENDIDA"],
  CANCELADA: ["CANCELADA", "VENCIDA"],
};

const ListaCitas = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [state, dispatch] = useReducer(listaCitasReducer, initialState);
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState<string | null>(null);
  const [citaParaCancelar, setCitaParaCancelar] = useState<CitaProcesada | null>(null);
  const [citaParaEliminar, setCitaParaEliminar] = useState<CitaProcesada | null>(null);
  const { notification, editando, pasoModal, mesesDisponibles, horariosPorDia, cargandoHorarios } = state;

  const reprogramarId = searchParams.get("reprogramar");

  const [citasData, setCitasData] = useState<CitaProcesada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargandoLista, setCargandoLista] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("TODAS");
  const [fechaFiltro, setFechaFiltro] = useState(hoyISO);

  const showNotification = (message: string, type: "success" | "error") => {
    dispatch({ type: "SHOW_NOTIFICATION", payload: { message, type } });
    setTimeout(() => dispatch({ type: "HIDE_NOTIFICATION" }), 3000);
  };

  useEffect(() => {
    dispatch({ type: "SET_MESES_DISPONIBLES", payload: generarMeses() });
    cargarCitas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, citasData]);

  // Abrir ReprogramarModal automáticamente cuando viene desde el calendario
  useEffect(() => {
    if (!reprogramarId || citasData.length === 0) return;
    const cita = citasData.find((c) => c._id === reprogramarId);
    if (cita) onReprogramar(cita);
  }, [reprogramarId, citasData]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarCitas = async () => {
    try {
      setCargandoLista(true);
      setCitasData(await CitaApiService.listar());
    } catch {
      showNotification("Error al cargar la lista de citas.", "error");
    } finally {
      setCargandoLista(false);
    }
  };

  const handleSelectFecha = async (fechaISO: string) => {
    if (!editando) return;
    dispatch({ type: "SELECT_FECHA", payload: { fechaISO } });
    const [y, m, d] = fechaISO.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);
    await cargarHorariosPorDia(d, editando.doctorId, fechaISO, fecha);
  };

  const cargarHorariosPorDia = async (dia: number, doctorId: string, fechaISO: string, fechaDate: Date) => {
    dispatch({ type: "SET_CARGANDO_HORARIOS", payload: true });
    try {
      const horariosDelDia = await DoctorApiService.obtenerHorariosDisponibles(doctorId, fechaISO);
      const horarioInfo: HorarioPorDia = {
        fecha: formatearFechaCompleta(fechaDate), fechaISO,
        diaNombre: obtenerNombreDia(fechaDate), diaNumero: dia, horarios: horariosDelDia,
      };
      dispatch({ type: "SET_HORARIOS_POR_DIA", payload: [horarioInfo] });
    } catch {
      showNotification("Error al cargar horarios", "error");
    } finally {
      dispatch({ type: "SET_CARGANDO_HORARIOS", payload: false });
    }
  };

  const confirmarEliminacion = async () => {
    if (!citaParaEliminar) return;
    try {
      await CitaApiService.eliminar(citaParaEliminar._id);
      showNotification("Cita eliminada correctamente.", "success");
      setCitaParaEliminar(null);
      cargarCitas();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Error al eliminar la cita.", "error");
      setCitaParaEliminar(null);
    }
  };

  const confirmarCancelacion = async () => {
    if (!citaParaCancelar) return;
    try {
      await CitaApiService.cancelar(citaParaCancelar._id, "Cancelado por recepcionista");
      showNotification("Cita cancelada correctamente.", "success");
      setCitaParaCancelar(null);
      cargarCitas();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Error al cancelar la cita.", "error");
      setCitaParaCancelar(null);
    }
  };

  const onReprogramar = (cita: CitaProcesada) => {
    dispatch({
      type: "OPEN_MODAL",
      payload: {
        id: cita._id, dni: cita.dni, paciente: cita.paciente, especialidad: cita.especialidad,
        doctor: cita.doctor, doctorId: cita.doctorId, fecha: "", hora: "",
        fechaOriginal: cita.fecha, horaOriginal: cita.hora,
      },
    });
  };

  const cerrarModal = () => dispatch({ type: "CLOSE_MODAL" });

  const irASegundoPaso = () => {
    if (!editando?.fecha || !editando?.hora) {
      showNotification("Selecciona una nueva fecha y hora antes de continuar.", "error");
      return;
    }
    dispatch({ type: "SET_PASO_MODAL", payload: 2 });
  };

  const confirmarReprogramar = async () => {
    if (!editando?.fecha || !editando?.hora) {
      showNotification("Faltan datos para reprogramar la cita.", "error");
      return;
    }
    try {
      await CitaApiService.reprogramar(editando.id, editando.fecha, editando.hora);
      showNotification("Cita reprogramada correctamente.", "success");
      cerrarModal();
      cargarCitas();
    } catch (error: unknown) {
      showNotification(error instanceof Error ? error.message : "Error desconocido al reprogramar cita.", "error");
    }
  };

  const citasMedicas = useMemo(
    () => citasData.filter((c) => c.tipo !== "LABORATORIO"),
    [citasData]
  );

  const especialidades = [
    "Medicina General",
    "Pediatría",
    "Odontología",
    "Reumatología",
    "Ginecología y Obstetricia",
    "Cardiología",
    "Endocrinología",
    "Neumología",
    "Gastroenterología",
    "Psiquiatría",
  ];

  const fechaDMY = fechaFiltro ? isoADMY(fechaFiltro) : null;

  const citasPorFechaEspecialidad = useMemo(() => {
    const f = normalizeString(busqueda);
    return citasMedicas.filter((c) => {
      if (fechaDMY && c.fecha !== fechaDMY) return false;
      if (filtroEspecialidad !== "TODAS" && c.especialidad !== filtroEspecialidad) return false;
      if (!f) return true;
      return normalizeString(c.dni).includes(f) || normalizeString(c.doctor).includes(f) || normalizeString(c.paciente).includes(f);
    });
  }, [citasMedicas, fechaDMY, filtroEspecialidad, busqueda]);

  const conteosPorEstado = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [key, estados] of Object.entries(TAB_GRUPOS)) {
      m[key] = estados.length
        ? citasPorFechaEspecialidad.filter((c) => estados.includes(c.estado)).length
        : citasPorFechaEspecialidad.length;
    }
    return m;
  }, [citasPorFechaEspecialidad]);

  const filtrarCitas = useMemo(() => {
    const estados = TAB_GRUPOS[filtroEstado];
    const base = estados?.length
      ? citasPorFechaEspecialidad.filter((c) => estados.includes(c.estado))
      : citasPorFechaEspecialidad;
    return base.toSorted((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));
  }, [citasPorFechaEspecialidad, filtroEstado]);

  return (
    <div className="lista-page">
      <Notification message={notification.message} type={notification.type} visible={notification.visible} />

      <div className="lista-page-header">
        <div>
          <h1>Gestión de Citas</h1>
          <p className="lista-page-subtitle">{filtrarCitas.length} cita{filtrarCitas.length !== 1 ? "s" : ""} · {fechaDMY ?? "todas las fechas"}</p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="lab-filtros-avanzados" style={{ marginBottom: "1rem" }}>
        <div className="lab-filtro-campo">
          <label className="lab-filtro-label">Fecha</label>
          <input
            type="date"
            className="lab-filtro-date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
          />
        </div>
        <div className="lab-filtro-campo" style={{ flex: 2, minWidth: 220 }}>
          <label className="lab-filtro-label">Especialidad</label>
          <select
            className="lab-filtro-select"
            value={filtroEspecialidad}
            onChange={(e) => setFiltroEspecialidad(e.target.value)}
          >
            <option value="TODAS">Todas</option>
            {especialidades.map((esp) => (
              <option key={esp} value={esp}>{esp}</option>
            ))}
          </select>
        </div>
        <div className="lab-filtro-campo" style={{ flex: 1, minWidth: 140 }}>
          <label className="lab-filtro-label">Buscar</label>
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "0.65rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              className="lab-filtro-input"
              placeholder="DNI, paciente o doctor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ paddingLeft: "2.2rem" }}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs de estado ── */}
      <div className="lab-filtros" style={{ marginBottom: "1rem" }} role="tablist">
        {TABS_ESTADO.map((tab) => {
          const count = conteosPorEstado[tab.estado] ?? 0;
          return (
            <button
              key={tab.estado}
              role="tab"
              aria-selected={filtroEstado === tab.estado}
              className={`lab-filtro-btn${filtroEstado === tab.estado ? " active" : ""}`}
              onClick={() => setFiltroEstado(tab.estado)}
            >
              <span>{tab.label}</span>
              <span className="lab-filtro-count">{count}</span>
            </button>
          );
        })}
      </div>

      {cargandoLista ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando citas…</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th style={{ width: 220 }}>Paciente</th>
                  <th style={{ width: 200 }}>Doctor</th>
                  <th style={{ width: 130 }}>Especialidad</th>
                  <th style={{ width: 140 }}>Fecha / Hora</th>
                  <th style={{ width: 120 }}>Estado</th>
                  <th style={{ width: 70 }}>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filtrarCitas.length > 0 ? (
                  filtrarCitas.map((cita) => {
                    const estadoInfo = ESTADO_CONFIG[cita.estado] || { class: "badge-warning", label: fmtEstado(cita.estado) };
                    const inicialPaciente = cita.paciente.charAt(0).toUpperCase();
                    return (
                      <tr
                        key={cita._id}
                        ref={highlightId === cita._id ? highlightRef : undefined}
                        className={`${highlightId === cita._id ? "tr-highlight" : ""} tr-clickable`}
                        onClick={() => setCitaSeleccionadaId(cita._id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="td-id">{cita.id}</td>
                        <td>
                          <div className="td-person">
                            <div className="td-avatar">{inicialPaciente}</div>
                            <div className="td-person-info">
                              <span className="td-person-name">{cita.paciente}</span>
                              <span className="td-person-meta">DNI: {cita.dni}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="td-person">
                            <div className="td-avatar td-avatar--doc"><Stethoscope size={14} /></div>
                            <span className="td-person-name">{cita.doctor}</span>
                          </div>
                        </td>
                        <td><span className="td-specialty">{cita.especialidad}</span></td>
                        <td>
                          <div className="td-datetime">
                            <span className="td-date"><Calendar size={13} /> {cita.fecha}</span>
                            <span className="td-time"><Clock size={13} /> {cita.hora}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`modern-badge ${estadoInfo.class}`}>
                            <span className="modern-badge-dot" />
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            {(() => {
                              const fueraDePlazo = horasHastaCita(cita.fecha, cita.hora) < 24;
                              const puedeReprogramar = (cita.estado === "PENDIENTE" || cita.estado === "REPROGRAMADA") && !fueraDePlazo;
                              return (
                                <button
                                  className="btn-action"
                                  title={
                                    fueraDePlazo
                                      ? "No se puede reprogramar dentro de las 24h previas a la cita"
                                      : puedeReprogramar
                                      ? "Reprogramar cita"
                                      : "Solo se pueden reprogramar citas pendientes o reprogramadas"
                                  }
                                  disabled={!puedeReprogramar}
                                  onClick={() => onReprogramar(cita)}
                                >
                                  <CalendarClock size={16} />
                                </button>
                              );
                            })()}
                            <button
                              className="btn-action btn-action--danger"
                              title="Cancelar cita"
                              disabled={cita.estado !== "PENDIENTE" && cita.estado !== "REPROGRAMADA"}
                              onClick={() => setCitaParaCancelar(cita)}
                            >
                              <XCircle size={16} />
                            </button>
                            {cita.doctor === "Sin asignar" && (
                              <button
                                className="btn-action btn-action--danger"
                                title="Eliminar cita sin asignar"
                                onClick={() => setCitaParaEliminar(cita)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="td-empty">
                      <User size={32} className="td-empty-icon" />
                      <p>{fechaDMY ? `No hay citas para el ${fechaDMY}` : "No se encontraron citas"}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editando && (
        <ReprogramarModal
          editando={editando} pasoModal={pasoModal} mesesDisponibles={mesesDisponibles}
          horariosPorDia={horariosPorDia} cargandoHorarios={cargandoHorarios}
          onSelectFecha={handleSelectFecha}
          onSelectHora={(hora) => dispatch({ type: "SET_HORA", payload: hora })}
          onSiguiente={irASegundoPaso} onVolver={() => dispatch({ type: "SET_PASO_MODAL", payload: 1 })}
          onCerrar={cerrarModal} onConfirmar={confirmarReprogramar}
        />
      )}

      {citaParaEliminar && (
        <div className="confirm-overlay" onClick={() => setCitaParaEliminar(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar cita</h3>
            <p>¿Estás seguro de que deseas eliminar permanentemente la cita de <strong>{citaParaEliminar.paciente}</strong>? Esta acción no se puede deshacer.</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setCitaParaEliminar(null)}>Volver</button>
              <button className="btn btn-danger" onClick={confirmarEliminacion}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {citaParaCancelar && (
        <div className="confirm-overlay" onClick={() => setCitaParaCancelar(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancelar cita</h3>
            <p>¿Estás seguro de que deseas cancelar la cita de <strong>{citaParaCancelar.paciente}</strong>?</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setCitaParaCancelar(null)}>Volver</button>
              <button className="btn btn-danger" onClick={confirmarCancelacion}>Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}

      {citaSeleccionadaId && (
        <CitaQuickModal
          citaId={citaSeleccionadaId}
          onCerrar={() => setCitaSeleccionadaId(null)}
          onCitaActualizada={cargarCitas}
          onIrADetalle={(id) => { setCitaSeleccionadaId(null); navigate(`/citas/${id}`); }}
          onReprogramar={(cita) => {
            setCitaSeleccionadaId(null);
            const pac = cita.pacienteId && typeof cita.pacienteId === "object" ? cita.pacienteId : null;
            const doc = cita.doctorId   && typeof cita.doctorId   === "object" ? cita.doctorId   : null;
            const esp = doc?.especialidadId && typeof doc.especialidadId === "object"
              ? (doc.especialidadId as any).nombre : "—";
            dispatch({
              type: "OPEN_MODAL",
              payload: {
                id:            cita._id,
                dni:           pac?.dni ?? "",
                paciente:      pac ? `${pac.nombres} ${pac.apellidos}` : "—",
                especialidad:  esp,
                doctor:        doc ? `${(doc as any).nombres} ${(doc as any).apellidos}` : "—",
                doctorId:      (doc as any)?._id ?? "",
                fecha:         "",
                hora:          "",
                fechaOriginal: new Date(cita.fecha + "T00:00:00").toLocaleDateString("es-PE"),
                horaOriginal:  cita.hora,
              },
            });
          }}
        />
      )}
    </div>
  );
};

export default ListaCitas;
