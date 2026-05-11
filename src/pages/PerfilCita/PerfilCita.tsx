
import { useEffect, useState, useCallback, useMemo, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { History, ChevronDown, ChevronUp, Check, Plus, Printer, FileText, AlertTriangle, Pill, User as UserIcon, Calendar, Clock, Stethoscope } from "lucide-react";
import "./PerfilCita.css";
import { CitaApiService } from "../../services/cita.service";
import { perfilCitaReducer, initialState } from "./PerfilCitaReducer";
import { useAuth } from "../../hooks/userAuth";
import type {
  OrdenExamen,
  ExamenLaboratorioImagen,
} from "../../services/examen.service";
import {
  ExamenService,
  TIPO_EXAMEN_LABEL,
} from "../../services/examen.service";
import OrdenExamenModal from "../MedicoDashboard/OrdenExamenModal";
import "../MedicoDashboard/OrdenExamenModal.css";
import Swal from "sweetalert2";
import { toastExito } from "../../utils/toast";

// ============================================================================
// TYPES (UI-only - not shared with reducer)
// ============================================================================

type TabPrincipal = "dashboard" | "historial" | "documentos" | "examenes";

const BADGE_ESTADO: Record<string, { cls: string; label: string }> = {
  PENDIENTE:    { cls: "badge-info",         label: "Pendiente" },
  REPROGRAMADA: { cls: "badge-reprogramada", label: "Reprogramada" },
  ATENDIDA:     { cls: "badge-success",      label: "Atendida" },
  CANCELADA:    { cls: "badge-danger",       label: "Cancelada" },
  ASISTIO:      { cls: "badge-asistio",      label: "Asistió" },
  VENCIDA:      { cls: "badge-vencida",      label: "Vencida" },
};

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS_RECEPCIONISTA: { id: TabPrincipal; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "historial", label: "Historico de Visitas" },
  { id: "documentos", label: "Documentos" },
  { id: "examenes", label: "Examenes" },
];

const TABS_MEDICO: { id: TabPrincipal; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "examenes", label: "Exámenes" },
  { id: "historial", label: "Histórico de Visitas" },
  { id: "documentos", label: "Documentos" },
];

// ============================================================================
// UTILS
// ============================================================================

const FECHA_CORTA_FMT = new Intl.DateTimeFormat("es-PE");

const formatearFechaCorta = (fechaISO?: string) => {
  if (!fechaISO) return "-";
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return "-";
  return FECHA_CORTA_FMT.format(fecha);
};

const formatearFechaHora = (iso: string) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }) +
    " - " +
    d.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    })
  );
};

const calcularEdad = (fechaNacimiento?: string) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (
    hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
  ) {
    edad--;
  }
  return edad;
};

// ============================================================================
// MAIN
// ============================================================================

const PerfilCita = () => {
  const { citaId } = useParams<{ citaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Reducer: fetch lifecycle + clinical data ──────────────
  const [state, dispatch] = useReducer(perfilCitaReducer, initialState);
  const {
    cita,
    cargando,
    error,
    alergias,
    problemasMedicos,
    medicamentos,
    citasPaciente,
  } = state;

  // ── useState: pure UI toggles (no shared state, no side effects) ──
  const [tabActiva, setTabActiva] = useState<TabPrincipal>("dashboard");

  // ── Exámenes ──────────────────────────────────────────────
  const [ordenes, setOrdenes] = useState<OrdenExamen[]>([]);
  const [historial, setHistorial] = useState<OrdenExamen[]>([]);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [mostrarOrdenModal, setMostrarOrdenModal] = useState(false);
  const [ordenEditando, setOrdenEditando] = useState<OrdenExamen | null>(null);
  const [errorOrdenes, setErrorOrdenes] = useState("");

  const cargarOrdenes = useCallback(async () => {
    if (!citaId) return;
    setErrorOrdenes("");
    try {
      const [ordenesActuales, todasOrdenes] = await Promise.all([
        ExamenService.listarOrdenesPorCita(citaId),
        cita?.pacienteId?._id
          ? ExamenService.listarOrdenesPorPaciente(cita.pacienteId._id)
          : Promise.resolve([]),
      ]);
      setOrdenes(ordenesActuales);
      // Historial = órdenes de otras citas del mismo paciente
      setHistorial(
        todasOrdenes.filter(
          (o) => o.citaId !== citaId && o.citaId !== undefined,
        ),
      );
    } catch {
      setErrorOrdenes(
        "No se pudieron cargar las órdenes de examen. Intenta de nuevo.",
      );
    }
  }, [citaId, cita?.pacienteId?._id]);

  useEffect(() => {
    if (tabActiva === "examenes") cargarOrdenes();
  }, [tabActiva, cargarOrdenes]);

  const handleCancelarOrden = async (ordenId: string) => {
    const result = await Swal.fire({
      title: "¿Cancelar esta orden?",
      text: "Esta acción no se puede deshacer. Los exámenes pendientes no se procesarán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, cancelar orden",
      cancelButtonText: "No, mantener",
    });
    if (!result.isConfirmed) return;
    try {
      await ExamenService.cancelarOrden(ordenId);
      toastExito("Orden cancelada correctamente");
      await cargarOrdenes();
    } catch {
      Swal.fire("Error", "No se pudo cancelar la orden.", "error");
    }
  };

  const handleEditarOrden = (orden: OrdenExamen) => {
    setOrdenEditando(orden);
  };

  // ============================================================================

  const cargarCita = useCallback(async () => {
    if (!citaId) {
      dispatch({ type: "FETCH_ERROR", payload: "ID de cita no proporcionado" });
      return;
    }

    dispatch({ type: "FETCH_START" });

    try {
      const data = await CitaApiService.obtenerPorId(citaId);
      dispatch({ type: "FETCH_SUCCESS", payload: data });
      // Cargar historial clínico del paciente
      const pac = data.pacienteId;
      if (pac.alergias) dispatch({ type: "SET_ALERGIAS", payload: pac.alergias as any });
      if (pac.medicamentosHabituales) dispatch({ type: "SET_MEDICAMENTOS", payload: pac.medicamentosHabituales as any });
      if (pac.problemasMedicos) dispatch({ type: "SET_PROBLEMAS_MEDICOS", payload: pac.problemasMedicos as any });
    } catch {
      dispatch({ type: "FETCH_ERROR", payload: "No se pudo cargar la cita" });
    }
  }, [citaId]);

  useEffect(() => {
    cargarCita();
  }, [cargarCita]);

  // ── Handlers de acciones de cita ──────────────────────────────

  const handleConfirmarAsistencia = async () => {
    const estadoActual = cita?.estado;
    const mensaje = estadoActual === "REPROGRAMADA" 
      ? "El paciente asistió a la cita reprogramada."
      : "El paciente asistió a la cita.";
      
    const result = await Swal.fire({
      title: "¿Confirmar asistencia?",
      text: `${mensaje} Pasará al estado ASISTIO.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar asistencia",
      cancelButtonText: "No",
      confirmButtonColor: "#10b981"
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await CitaApiService.cambiarEstado(citaId!, "ASISTIO");
      toastExito("Asistencia confirmada. Esperando finalización del médico.");
      cargarCita();
    } catch (error) {
      Swal.fire("Error", "No se pudo confirmar la asistencia", "error");
    }
  };

  const handleAtenderPaciente = () => {
    navigate(`/medico/citas/${citaId}/consulta`);
  };

  // ============================================================================

  const paciente = useMemo(() => cita?.pacienteId, [cita]);
  const edad = useMemo(
    () => calcularEdad(paciente?.fechaNacimiento),
    [paciente?.fechaNacimiento],
  );
  const doctor = useMemo(
    () => (cita?.doctorId && typeof cita.doctorId === "object" ? cita.doctorId : null),
    [cita?.doctorId],
  );
  const doctorNombre = doctor ? `${doctor.nombres} ${doctor.apellidos}` : null;
  const especialidadNombre = doctor?.especialidadId && typeof doctor.especialidadId === "object"
    ? doctor.especialidadId.nombre : null;

  // ── Loading / error guards ────────────────────────────────

  if (cargando) {
    return (
      <div className="perfil-loading">
        <div className="spinner" />
        <p>Cargando información del paciente…</p>
      </div>
    );
  }

  if (error || !cita || !paciente) {
    return (
      <div className="perfil-error">
        <h2>No se pudo cargar la información</h2>
        <p>
          {error ||
            "Ocurrió un error inesperado al cargar los datos de la cita."}
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-primary" onClick={cargarCita}>
            Reintentar
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/calendario")}
          >
            Volver al Calendario
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================

  return (
    <div className="perfil-clinico">
      {/* HEADER */}
      <div className="perfil-header-global">
        <div className="paciente-contexto">
          <div className="avatar-grande">
            {paciente.nombres.charAt(0)}
            {paciente.apellidos.charAt(0)}
          </div>

          <div className="paciente-info-principal">
            <h1>
              {paciente.nombres} {paciente.apellidos}
            </h1>
            <div className="datos-basicos">
              <span>DNI: {paciente.dni}</span>
              <span>
                F.Nac: {formatearFechaCorta(paciente.fechaNacimiento)}
              </span>
              {edad !== null && <span>{edad} años</span>}
            </div>
          </div>
        </div>

      </div>

      {/* ACCIONES DE CITA - solo si hay botones que mostrar */}
      {cita && (
        (user?.rol === "RECEPCIONISTA" && (cita.estado === "PENDIENTE" || cita.estado === "REPROGRAMADA")) ||
        (user?.rol === "MEDICO" && (cita.estado === "ASISTIO" || cita.estado === "ATENDIDA"))
      ) && (
        <div className="perfil-acciones">
          {user?.rol === "RECEPCIONISTA" &&
          (cita.estado === "PENDIENTE" || cita.estado === "REPROGRAMADA") && (
            <button className="btn btn-primary" onClick={handleConfirmarAsistencia}>
              <Check size={14} /> Confirmar asistencia
            </button>
          )}
          {user?.rol === "MEDICO" && cita.estado === "ASISTIO" && (
            <button className="btn btn-primary" onClick={handleAtenderPaciente}>
              <Stethoscope size={14} /> Atender paciente
            </button>
          )}
          {user?.rol === "MEDICO" && cita.estado === "ATENDIDA" && (
            <button className="btn btn-secondary" onClick={handleAtenderPaciente}>
              <FileText size={14} /> Ver nota SOAP
            </button>
          )}
        </div>
      )}


      {/* TABS - diferenciadas por rol */}
      <div className="tabs-principales">
        {(user?.rol === "MEDICO" ? TABS_MEDICO : TABS_RECEPCIONISTA).map((t) => (
          <button
            key={t.id}
            className={`tab ${tabActiva === t.id ? "activa" : ""}`}
            onClick={() => setTabActiva(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tabActiva === "dashboard" && (
        <div className="dashboard-layout">
          <div className="columna-principal">
            <div className="clinical-grid">
              {/* Alergias */}
              <div className="card-clinica">
                <div className="card-header">
                  <span>Alergias</span>
                </div>
                <div className="card-body">
                  {alergias.length === 0 ? (
                    <div className="perfil-card-empty">
                      <AlertTriangle size={22} />
                      <span>Sin alergias registradas</span>
                    </div>
                  ) : alergias.map(a => (
                    <div key={a.id} className="item-clinico">
                      <span>{a.sustancia} - {a.reaccion}</span>
                      <span className={`badge-small ${a.severidad}`}>{a.severidad}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Problemas Médicos */}
              <div className="card-clinica">
                <div className="card-header">
                  <span>Problemas Médicos</span>
                </div>
                <div className="card-body">
                  {problemasMedicos.length === 0 ? (
                    <div className="perfil-card-empty">
                      <FileText size={22} />
                      <span>Sin problemas registrados</span>
                    </div>
                  ) : problemasMedicos.map(p => (
                    <div key={p.id} className="item-clinico">
                      <span>{p.descripcion}</span>
                      <span className={`badge-small ${p.estado}`}>{p.estado}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medicamentos habituales */}
              <div className="card-clinica">
                <div className="card-header">
                  <span>Medicamentos Habituales</span>
                </div>
                <div className="card-body">
                  {medicamentos.length === 0 ? (
                    <div className="perfil-card-empty">
                      <Pill size={22} />
                      <span>Sin medicamentos registrados</span>
                    </div>
                  ) : medicamentos.map(m => (
                    <div key={m.id} className="item-clinico">
                      <span>{m.nombre} - {m.dosis}</span>
                      <span className="fecha-small">{m.frecuencia}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Datos del Paciente */}
              <div className="card-clinica">
                <div className="card-header">
                  <span>Datos del Paciente</span>
                </div>
                <div className="card-body">
                  <div className="demo-info-grid">
                    <div className="demo-info-item">
                      <label>Nombre completo</label>
                      <span>{paciente.nombres} {paciente.apellidos}</span>
                    </div>
                    <div className="demo-info-item">
                      <label>DNI</label>
                      <span>{paciente.dni}</span>
                    </div>
                    {edad !== null && (
                      <div className="demo-info-item">
                        <label>Edad</label>
                        <span>{edad} años</span>
                      </div>
                    )}
                    <div className="demo-info-item">
                      <label>Fecha de nacimiento</label>
                      <span>{formatearFechaCorta(paciente.fechaNacimiento)}</span>
                    </div>
                    <div className="demo-info-item">
                      <label>Teléfono</label>
                      <span>{paciente.telefono || "—"}</span>
                    </div>
                    <div className="demo-info-item">
                      <label>Correo</label>
                      <span>{paciente.correo || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="columna-lateral">
            {/* Info de la cita */}
            <div className="widget">
              <div className="widget-header">
                <span>Información de la Cita</span>
              </div>
              <div className="widget-body">
                <div className="cita-info-stack">
                  <div className="cita-info-item">
                    <Calendar size={13} />
                    <div>
                      <label>Fecha</label>
                      <span>{formatearFechaCorta(cita.fecha)}</span>
                    </div>
                  </div>
                  <div className="cita-info-item">
                    <Clock size={13} />
                    <div>
                      <label>Hora</label>
                      <span>{cita.hora}</span>
                    </div>
                  </div>
                  {doctorNombre && (
                    <div className="cita-info-item">
                      <UserIcon size={13} />
                      <div>
                        <label>Médico</label>
                        <span>Dr. {doctorNombre}</span>
                      </div>
                    </div>
                  )}
                  {especialidadNombre && (
                    <div className="cita-info-item">
                      <FileText size={13} />
                      <div>
                        <label>Especialidad</label>
                        <span>{especialidadNombre}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Historial de citas del paciente */}
            <div className="widget">
              <div className="widget-header">
                <span>Citas del Paciente</span>
                {citasPaciente.length > 0 && (
                  <span className="widget-count">{citasPaciente.length}</span>
                )}
              </div>
              <div className="widget-body">
                {citasPaciente.length === 0 ? (
                  <p className="widget-empty">Sin citas anteriores</p>
                ) : (
                  citasPaciente.map((c) => {
                    const b = BADGE_ESTADO[c.estado] ?? { cls: "badge-info", label: c.estado };
                    return (
                      <button
                        key={c._id}
                        className="cita-widget-item"
                        onClick={() => navigate(`/citas/${c._id}`)}
                      >
                        <div className="cita-widget-fecha">
                          <span>{formatearFechaCorta(c.fecha)}</span>
                          <span className="cita-widget-hora">{c.hora}</span>
                        </div>
                        <span className={`modern-badge ${b.cls}`}>
                          <span className="modern-badge-dot" />
                          {b.label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tabActiva === "historial" && (
        <div className="card-clinica">
          <div className="card-header"><span>Historial de Visitas</span></div>
          <div className="card-body perfil-tab-empty">
            <History size={36} />
            <p>No hay visitas anteriores registradas</p>
          </div>
        </div>
      )}

      {tabActiva === "documentos" && (
        <div className="card-clinica">
          <div className="card-header"><span>Documentos</span></div>
          <div className="card-body perfil-tab-empty">
            <FileText size={36} />
            <p>No hay documentos cargados</p>
          </div>
        </div>
      )}

      {tabActiva === "examenes" && (
        <div className="card-clinica perfil-examenes">
          <div className="card-header">
            <span>Exámenes de Laboratorio / Imagen</span>
            {user?.rol === "MEDICO" && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setMostrarOrdenModal(true)}
              >
                <Plus size={13} /> Nueva Orden
              </button>
            )}
          </div>

          {errorOrdenes ? (
            <div className="perfil-examenes-error">
              <p>{errorOrdenes}</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={cargarOrdenes}
              >
                Reintentar
              </button>
            </div>
          ) : ordenes.length === 0 && historial.length === 0 ? (
            <p className="perfil-examenes-empty">
              No hay órdenes de examen para esta cita.
            </p>
          ) : (
            <div className="perfil-examenes-lista">
              {/* ── Órdenes de esta cita ── */}
              {ordenes.length === 0 ? (
                <p
                  className="perfil-examenes-empty"
                  style={{ marginBottom: "1rem" }}
                >
                  No hay órdenes para esta cita aún.
                </p>
              ) : (
                ordenes.map((orden) => (
                  <div key={orden._id} className="perfil-orden-card">
                    <div className="perfil-orden-top">
                      <span className="perfil-orden-fecha">
                        {formatearFechaHora(orden.fecha.toString())}
                      </span>
                      <div className="perfil-orden-top-actions">
                        <span
                          className={`perfil-orden-estado perfil-orden-estado--${orden.estado.toLowerCase()}`}
                        >
                          {orden.estado === "PENDIENTE" && "Pendiente"}
                          {orden.estado === "EN_PROCESO" && "En proceso"}
                          {orden.estado === "FINALIZADO" && "Finalizado"}
                          {orden.estado === "CANCELADA" && "Cancelada"}
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/ordenes/${orden._id}/imprimir`)}
                        >
                          <Printer size={13} /> Imprimir
                        </button>
                        {orden.estado === "PENDIENTE" &&
                          user?.rol === "MEDICO" && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleEditarOrden(orden)}
                              >
                                Editar
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleCancelarOrden(orden._id)}
                              >
                                Cancelar Orden
                              </button>
                            </>
                          )}
                        {orden.estado === "EN_PROCESO" &&
                          user?.rol === "MEDICO" && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleCancelarOrden(orden._id)}
                            >
                              Cancelar Orden
                            </button>
                          )}
                      </div>
                    </div>
                    {orden.observacionesGenerales && (
                      <p className="perfil-orden-obs">
                        {orden.observacionesGenerales}
                      </p>
                    )}
                    <table className="perfil-orden-tabla">
                      <thead>
                        <tr>
                          <th>Examen</th>
                          <th>Tipo</th>
                          <th>Observación</th>
                          <th>Resultado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orden.items.map((item, i) => {
                          const ex =
                            typeof item.examenId === "object"
                              ? (item.examenId as ExamenLaboratorioImagen)
                              : null;
                          const rowKey = (item as { _id?: string })._id ?? ex?._id ?? `perfil-item-${i}`;
                          return (
                            <tr key={rowKey}>
                              <td>{ex?.nombre ?? "—"}</td>
                              <td>{ex ? TIPO_EXAMEN_LABEL[ex.tipo] : "—"}</td>
                              <td>
                                {item.observaciones || (
                                  <span style={{ color: "var(--text-muted)" }}>
                                    -
                                  </span>
                                )}
                              </td>
                              <td>
                                {item.valorResultado ? (
                                  <strong>
                                    {item.valorResultado} {item.unidadResultado}
                                  </strong>
                                ) : (
                                  <span style={{ color: "var(--text-muted)" }}>
                                    Pendiente
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))
              )}

              {/* ── Historial de otras visitas ── */}
              {historial.length > 0 && (
                <div className="perfil-historial-seccion">
                  <button
                    className="perfil-historial-toggle"
                    onClick={() => setHistorialAbierto((v) => !v)}
                  >
                    <span className="perfil-historial-toggle-label">
                      <History size={14} />
                      Historial de otras visitas ({historial.length})
                    </span>
                    {historialAbierto ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  {historialAbierto && (
                    <div className="perfil-historial-lista">
                      {historial.map((orden) => (
                        <div
                          key={orden._id}
                          className="perfil-orden-card perfil-orden-card--historial"
                        >
                          <div className="perfil-orden-top">
                            <span className="perfil-orden-fecha">
                              {formatearFechaHora(orden.fecha.toString())}
                            </span>
                            <span
                              className={`perfil-orden-estado perfil-orden-estado--${orden.estado.toLowerCase()}`}
                            >
                              {orden.estado === "PENDIENTE" && "Pendiente"}
                              {orden.estado === "EN_PROCESO" && "En proceso"}
                              {orden.estado === "FINALIZADO" && "Finalizado"}
                              {orden.estado === "CANCELADA" && "Cancelada"}
                            </span>
                          </div>
                          {orden.observacionesGenerales && (
                            <p className="perfil-orden-obs">
                              {orden.observacionesGenerales}
                            </p>
                          )}
                          <table className="perfil-orden-tabla">
                            <thead>
                              <tr>
                                <th>Examen</th>
                                <th>Tipo</th>
                                <th>Observación</th>
                                <th>Resultado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orden.items.map((item, i) => {
                                const ex =
                                  typeof item.examenId === "object"
                                    ? (item.examenId as ExamenLaboratorioImagen)
                                    : null;
                                const hRowKey = (item as { _id?: string })._id ?? ex?._id ?? `perfil-hist-${i}`;
                                return (
                                  <tr key={hRowKey}>
                                    <td>{ex?.nombre ?? "—"}</td>
                                    <td>
                                      {ex ? TIPO_EXAMEN_LABEL[ex.tipo] : "—"}
                                    </td>
                                    <td>
                                      {item.observaciones || (
                                        <span
                                          style={{ color: "var(--text-muted)" }}
                                        >
                                          -
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      {item.valorResultado ? (
                                        <strong>
                                          {item.valorResultado}{" "}
                                          {item.unidadResultado}
                                        </strong>
                                      ) : (
                                        <span
                                          style={{ color: "var(--text-muted)" }}
                                        >
                                          -
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mostrarOrdenModal &&
        cita &&
        user?.rol === "MEDICO" &&
        (() => {
          const doctor =
            cita.doctorId && typeof cita.doctorId === "object"
              ? cita.doctorId
              : null;
          const pacienteId =
            cita.pacienteId && typeof cita.pacienteId === "object"
              ? cita.pacienteId._id
              : String(cita.pacienteId);
          const doctorId = doctor?._id ?? "";
          const especialidadId =
            doctor?.especialidadId && typeof doctor.especialidadId === "object"
              ? doctor.especialidadId._id
              : "";
          return (
            <OrdenExamenModal
              citaId={cita._id}
              pacienteId={pacienteId}
              doctorId={doctorId}
              especialidadId={especialidadId}
              onCerrar={() => setMostrarOrdenModal(false)}
              onOrdenCreada={cargarOrdenes}
            />
          );
        })()}

      {/* ── Modal de edición de orden PENDIENTE ── */}
      {ordenEditando &&
        cita &&
        (() => {
          const doctor =
            cita.doctorId && typeof cita.doctorId === "object"
              ? cita.doctorId
              : null;
          const pacienteId =
            cita.pacienteId && typeof cita.pacienteId === "object"
              ? cita.pacienteId._id
              : String(cita.pacienteId);
          const doctorId = doctor?._id ?? "";
          const especialidadId =
            doctor?.especialidadId && typeof doctor.especialidadId === "object"
              ? doctor.especialidadId._id
              : "";
          // Pre-cargar los exámenes e indicaciones existentes de la orden
          const seleccionadosIniciales = new Set(
            ordenEditando.items.map((it) =>
              typeof it.examenId === "object"
                ? it.examenId._id
                : String(it.examenId),
            ),
          );
          const obsItemIniciales = ordenEditando.items.reduce<
            Record<string, string>
          >((acc, it) => {
            const id =
              typeof it.examenId === "object"
                ? it.examenId._id
                : String(it.examenId);
            acc[id] = it.observaciones ?? "";
            return acc;
          }, {});
          const respuestasIniciales = ordenEditando.items.reduce<
            Record<string, Record<string, string>>
          >((acc, it) => {
            const id =
              typeof it.examenId === "object"
                ? it.examenId._id
                : String(it.examenId);
            if (it.respuestasProtocolares?.length) {
              acc[id] = it.respuestasProtocolares.reduce<Record<string, string>>(
                (map, r) => {
                  map[r.preguntaId] = r.respuesta;
                  return map;
                },
                {},
              );
            }
            return acc;
          }, {});
          return (
            <OrdenExamenModal
              citaId={cita._id}
              pacienteId={pacienteId}
              doctorId={doctorId}
              especialidadId={especialidadId}
              onCerrar={() => setOrdenEditando(null)}
              onOrdenCreada={async () => {
                setOrdenEditando(null);
                await cargarOrdenes();
              }}
              ordenId={ordenEditando._id}
              seleccionadosIniciales={seleccionadosIniciales}
              obsItemIniciales={obsItemIniciales}
              obsGeneralesInicial={ordenEditando.observacionesGenerales ?? ""}
              respuestasProtocolaresIniciales={respuestasIniciales}
            />
          );
        })()}
    </div>
  );
};

export default PerfilCita;
