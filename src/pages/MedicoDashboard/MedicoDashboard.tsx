import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Calendar, Clock, CheckCircle, XCircle,
  User, ChevronRight, AlertTriangle, Info, AlertCircle, FileText,
  Inbox, FlaskConical, Reply, Users,
} from "lucide-react";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico, MedicoPerfil } from "../../services/medico.service";
import { InterconsultaApiService, type Interconsulta } from "../../services/interconsulta.service";
import { toastExito } from "../../utils/toast";
import "./MedicoDashboard.css";

const PRIORIDAD_LABEL: Record<string, { label: string; cls: string }> = {
  urgente:    { label: "Urgente",    cls: "danger" },
  preferente: { label: "Preferente", cls: "warning" },
  electiva:   { label: "Electiva",   cls: "info" },
};

const formatHoy = () =>
  new Date().toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

function calcEdad(fechaNacimiento?: string): string {
  if (!fechaNacimiento) return "";
  const b = new Date(fechaNacimiento);
  const t = new Date();
  const age =
    t.getFullYear() - b.getFullYear() -
    (t < new Date(t.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
  return `${age}a`;
}

export default function MedicoDashboard() {
  const navigate = useNavigate();
  const [perfil,        setPerfil]        = useState<MedicoPerfil | null>(null);
  const [citasHoy,      setCitasHoy]      = useState<CitaMedico[]>([]);
  const [interconsultas, setInterconsultas] = useState<Interconsulta[]>([]);
  const [resultados,    setResultados]    = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);

  const cargarBandeja = () => {
    InterconsultaApiService.listarRecibidas("PENDIENTE")
      .then(setInterconsultas)
      .catch(() => {});
    MedicoApiService.obtenerResultadosRecientes()
      .then(setResultados)
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      MedicoApiService.obtenerMiPerfil(),
      MedicoApiService.obtenerCitasHoy(),
    ])
      .then(([p, c]) => { setPerfil(p); setCitasHoy(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
    cargarBandeja();
  }, []);

  const handleResponder = async (ic: Interconsulta) => {
    const { value: respuesta } = await Swal.fire({
      title: "Responder interconsulta",
      html: `<div style="text-align:left;font-size:13px;color:#475569">
        <strong>Paciente:</strong> ${ic.pacienteId?.nombres ?? ""} ${ic.pacienteId?.apellidos ?? ""}<br/>
        <strong>Solicita:</strong> ${ic.solicitanteNombre}<br/>
        <strong>Motivo:</strong> ${ic.motivoConsulta}${ic.preguntaClinica ? `<br/><strong>Pregunta:</strong> ${ic.preguntaClinica}` : ""}
      </div>`,
      input: "textarea",
      inputPlaceholder: "Escribe tu respuesta o recomendación clínica…",
      inputAttributes: { "aria-label": "Respuesta" },
      showCancelButton: true,
      confirmButtonText: "Enviar respuesta",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "var(--primary)",
      inputValidator: (v) => (!v?.trim() ? "La respuesta no puede estar vacía" : undefined),
    });
    if (!respuesta?.trim()) return;
    try {
      await InterconsultaApiService.responder(ic._id, respuesta.trim());
      toastExito("Respuesta enviada");
      cargarBandeja();
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo enviar la respuesta.", confirmButtonColor: "var(--primary)" });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner" />
          <p className="loading-text">Cargando datos…</p>
        </div>
      </div>
    );
  }

  const citas      = [...citasHoy].sort((a, b) => a.hora.localeCompare(b.hora));
  const asistio    = citas.filter(c => c.estado === "ASISTIO");
  const pendientes = citas.filter(c => c.estado === "PENDIENTE");
  const atendidas  = citas.filter(c => c.estado === "ATENDIDA");
  const canceladas = citas.filter(c => c.estado === "CANCELADA" || c.estado === "REPROGRAMADA");
  const total      = citas.length;
  const pct        = total > 0 ? Math.round((atendidas.length / total) * 100) : 0;
  const firstActId = (asistio[0] ?? pendientes[0])?._id;

  const nombreDoctor = perfil ? `${perfil.nombres} ${perfil.apellidos}` : "Doctor";
  const especialidad = perfil?.especialidadId?.nombre ?? "Medicina General";
  const horaActual   = new Date().getHours();
  const saludo       = horaActual < 12 ? "Buenos días" : horaActual < 18 ? "Buenas tardes" : "Buenas noches";
  const turno        = citas.length > 0 ? `${citas[0].hora} – ${citas[citas.length - 1].hora}` : null;

  type AlertaTipo = "danger" | "warning" | "info" | "primary";
  const alertas: { tipo: AlertaTipo; msg: string }[] = [
    ...(canceladas.length > 0
      ? [{ tipo: "danger" as AlertaTipo, msg: `${canceladas.length} cita${canceladas.length > 1 ? "s" : ""} cancelada${canceladas.length > 1 ? "s" : ""} hoy` }]
      : []),
    ...(asistio.length > 0
      ? [{ tipo: "primary" as AlertaTipo, msg: `${asistio.length} paciente${asistio.length > 1 ? "s" : ""} esperando en sala` }]
      : []),
    ...(pendientes.length > 0
      ? [{ tipo: "info" as AlertaTipo, msg: `${pendientes.length} paciente${pendientes.length > 1 ? "s" : ""} pendiente${pendientes.length > 1 ? "s" : ""} de atención` }]
      : []),
    ...(interconsultas.length > 0
      ? [{ tipo: "warning" as AlertaTipo, msg: `${interconsultas.length} interconsulta${interconsultas.length > 1 ? "s" : ""} por responder` }]
      : []),
  ];

  return (
    <div className="medico-dash">

      {/* ── Header ── */}
      <div className="dash-header-section">
        <div className="dash-greeting">
          <h1 className="dash-greeting-title">👋 {saludo}, {nombreDoctor}</h1>
          <p className="dash-greeting-sub">{formatHoy()} · {especialidad}</p>
        </div>
        <div className="dash-header-chips">
          {turno && (
            <div className="dash-header-chip">
              <Clock size={15} className="dash-chip-icon" />
              <div>
                <div className="dash-chip-label">Turno</div>
                <div className="dash-chip-value">{turno}</div>
              </div>
            </div>
          )}
          {perfil?.cmp && (
            <div className="dash-header-chip">
              <FileText size={15} className="dash-chip-icon" />
              <div>
                <div className="dash-chip-label">CMP</div>
                <div className="dash-chip-value">{perfil.cmp}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI tiles (5) ── */}
      <div className="dash-kpis">
        {[
          { label: "Programadas", value: total,             sub: "agenda del día",     cls: "info",    icon: <Calendar size={16} />,     accent: false },
          { label: "Atendidas",   value: atendidas.length,  sub: `${pct}% completado`, cls: "success", icon: <CheckCircle size={16} />,  accent: true  },
          { label: "En sala",     value: asistio.length,    sub: "esperando atención", cls: "primary", icon: <User size={16} />,         accent: asistio.length > 0 },
          { label: "Pendientes",  value: pendientes.length, sub: "por atender",        cls: "warning", icon: <Clock size={16} />,        accent: true  },
          { label: "Canceladas",  value: canceladas.length, sub: "no se presentaron",  cls: "danger",  icon: <XCircle size={16} />,      accent: false },
        ].map(k => (
          <div key={k.label} className={`dash-kpi-tile dash-kpi-tile--${k.cls}${k.accent ? " dash-kpi-tile--accent" : ""}`}>
            <div className="dash-kpi-accent-bar" />
            <div className="dash-kpi-head">
              <span className="dash-kpi-label">{k.label}</span>
              <div className="dash-kpi-icon">{k.icon}</div>
            </div>
            <div className={`dash-kpi-value${k.accent ? " dash-kpi-value--color" : ""}`}>{k.value}</div>
            <div className="dash-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Barra de progreso ── */}
      {total > 0 && (
        <div className="dash-progress-panel">
          <div className="dash-progress-info">
            <span className="dash-progress-label">Progreso de la jornada</span>
            <span className="dash-progress-text">
              {atendidas.length} de {total} atendidas ·{" "}
              <strong className="dash-progress-pct">{pct}%</strong>
            </span>
          </div>
          <div className="dash-progress-track">
            <div className="dash-progress-seg dash-progress-seg--success" style={{ width: `${(atendidas.length / total) * 100}%` }} />
            <div className="dash-progress-seg dash-progress-seg--primary" style={{ width: `${(asistio.length  / total) * 100}%` }} />
            <div className="dash-progress-seg dash-progress-seg--warning" style={{ width: `${(pendientes.length / total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* ── Grid principal ── */}
      <div className="dash-content-grid">

        {/* Agenda del día */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Agenda de hoy</span>
            <div className="dash-card-header-right">
              <span className="dash-agenda-total">{citas.length} citas</span>
              <button className="dash-link" onClick={() => navigate("/medico/citas")}>Ver todas →</button>
            </div>
          </div>

          {asistio.length > 0 && (
            <div className="dash-en-sala-banner">
              <span className="dash-dot-pulse" />
              {asistio.length} paciente{asistio.length > 1 ? "s" : ""} en sala — esperando atención
            </div>
          )}

          {citas.length === 0 ? (
            <div className="dash-empty">
              <User size={32} />
              <p>No hay citas para hoy</p>
              <button className="dash-link-secondary" onClick={() => navigate("/medico/citas")}>
                Ver mis citas
              </button>
            </div>
          ) : (
            <div className="dash-agenda-list">
              {citas.map((c, i) => {
                const pac           = c.pacienteId;
                const isAsistio     = c.estado === "ASISTIO";
                const isAtendida    = c.estado === "ATENDIDA";
                const isNext        = c._id === firstActId;
                const tieneAlergias = (pac.alergias?.length ?? 0) > 0;
                const tieneCronicas = (pac.problemasMedicos?.length ?? 0) > 0;
                const edad          = calcEdad(pac.fechaNacimiento);
                const dotCls        = isAtendida ? "success" : isAsistio ? "primary" : "warning";
                const estadoLabel   = isAtendida ? "Atendida" : isAsistio ? "En sala" : isNext ? "Siguiente" : "Pendiente";
                const estadoCls     = isAtendida ? "success"  : isAsistio ? "primary" : isNext  ? "next"      : "warning";

                return (
                  <div
                    key={c._id}
                    className={`dash-agenda-row${isAsistio ? " dash-agenda-row--active" : ""}${isAtendida ? " dash-agenda-row--done" : ""}`}
                    onClick={() => navigate(`/medico/citas/${c._id}/consulta`)}
                    style={{ borderBottom: i === citas.length - 1 ? "none" : undefined }}
                  >
                    {/* Hora + dot */}
                    <div className="dash-agenda-hora-col">
                      <span className={`dash-agenda-dot dash-agenda-dot--${dotCls}${isAsistio ? " dash-agenda-dot--pulse" : ""}`} />
                      <span className="dash-agenda-hora">{c.hora}</span>
                    </div>

                    {/* Paciente */}
                    <div className="dash-agenda-patient">
                      <div className="dash-agenda-top-row">
                        <span className="dash-agenda-nombre">{pac.nombres} {pac.apellidos}</span>
                        {edad && <span className="dash-agenda-meta">{edad}</span>}
                        {tieneAlergias && (
                          <span className="dash-flag dash-flag--danger">
                            <AlertCircle size={10} /> Alergia
                          </span>
                        )}
                        {tieneCronicas && (
                          <span className="dash-flag dash-flag--warning">Crónico</span>
                        )}
                      </div>
                      {c.notas && (
                        <div className="dash-agenda-motivo">
                          {c.notas.substring(0, 70)}{c.notas.length > 70 ? "…" : ""}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="dash-agenda-actions" onClick={(e) => e.stopPropagation()}>
                      <span className={`dash-estado-chip dash-estado-chip--${estadoCls}`}>{estadoLabel}</span>
                      {(isAsistio || isNext) && (
                        <button
                          className="dash-btn-primary dash-btn-sm"
                          onClick={() => navigate(`/medico/citas/${c._id}/consulta`)}
                        >
                          {isAsistio ? "Continuar" : "Iniciar"}
                        </button>
                      )}
                      {!isAsistio && !isNext && !isAtendida && (
                        <button
                          className="dash-btn-ghost dash-btn-sm"
                          onClick={() => navigate(`/medico/citas/${c._id}/consulta`)}
                        >
                          Ver
                        </button>
                      )}
                      <button
                        className="dash-cita-hc-btn"
                        onClick={() => navigate(`/pacientes/${pac._id}`)}
                        title="Ver historia clínica"
                      >
                        <FileText size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Rail derecho ── */}
        <div className="dash-side-cards">

          {/* Métricas de la jornada */}
          <div className="dash-card">
            <div className="dash-card-header">
              <span className="dash-card-title">Métricas de la jornada</span>
            </div>
            <div className="dash-metric-row">
              <div className="dash-metric-icon dash-metric-icon--info"><Users size={17} /></div>
              <div className="dash-metric-body">
                <div className="dash-metric-label">Pacientes atendidos</div>
                <div className="dash-metric-nums">
                  <span className="dash-metric-value">{atendidas.length}</span>
                  <span className="dash-metric-unit">/ {total}</span>
                </div>
                <div className="dash-metric-track">
                  <div className="dash-metric-fill dash-metric-fill--info" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
            <div className="dash-metric-row">
              <div className="dash-metric-icon dash-metric-icon--primary"><User size={17} /></div>
              <div className="dash-metric-body">
                <div className="dash-metric-label">En sala ahora</div>
                <div className="dash-metric-nums">
                  <span className="dash-metric-value">{asistio.length}</span>
                  <span className="dash-metric-unit">esperando</span>
                </div>
              </div>
            </div>
            <div className="dash-metric-row dash-metric-row--last">
              <div className="dash-metric-icon dash-metric-icon--warning"><Clock size={17} /></div>
              <div className="dash-metric-body">
                <div className="dash-metric-label">Por atender</div>
                <div className="dash-metric-nums">
                  <span className="dash-metric-value">{pendientes.length}</span>
                  <span className="dash-metric-unit">pendientes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas del día */}
          <div className="dash-card">
            <div className="dash-card-header">
              <span className="dash-card-title">⚠️ Alertas del día</span>
              {alertas.length > 0 && <span className="dash-badge-count dash-badge-count--danger">{alertas.length}</span>}
            </div>
            <div className="dash-alertas">
              {alertas.length === 0 ? (
                <p className="dash-alertas-empty">Sin alertas para hoy</p>
              ) : (
                alertas.map((a, i) => (
                  <div key={i} className={`dash-alerta dash-alerta--${a.tipo}`}>
                    {a.tipo === "danger"  && <AlertCircle   size={14} />}
                    {a.tipo === "warning" && <AlertTriangle size={14} />}
                    {a.tipo === "info"    && <Info          size={14} />}
                    {a.tipo === "primary" && <Users         size={14} />}
                    <span>{a.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bandeja de tareas */}
          <div className="dash-card dash-card-compact">
            <div className="dash-card-header">
              <span className="dash-card-title"><Inbox size={15} style={{ verticalAlign: "-2px" }} /> Bandeja de tareas</span>
            </div>
            <div className="dash-bandeja">

              <div className="dash-bandeja-group">
                <div className="dash-bandeja-group-title">
                  <Reply size={13} /> Interconsultas por responder ({interconsultas.length})
                </div>
                {interconsultas.length === 0 ? (
                  <p className="dash-bandeja-empty">Sin interconsultas pendientes</p>
                ) : (
                  interconsultas.slice(0, 4).map((ic) => {
                    const prio = PRIORIDAD_LABEL[ic.prioridad] ?? PRIORIDAD_LABEL.electiva;
                    return (
                      <button key={ic._id} className="dash-bandeja-item" onClick={() => handleResponder(ic)}>
                        <div className="dash-bandeja-item-main">
                          <span className="dash-bandeja-item-name">
                            {ic.pacienteId?.nombres} {ic.pacienteId?.apellidos}
                          </span>
                          <span className="dash-bandeja-item-sub">
                            De {ic.solicitanteNombre} · {ic.motivoConsulta.slice(0, 40)}{ic.motivoConsulta.length > 40 ? "…" : ""}
                          </span>
                        </div>
                        <span className={`dash-bandeja-prio dash-bandeja-prio--${prio.cls}`}>{prio.label}</span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="dash-bandeja-group">
                <div className="dash-bandeja-group-title">
                  <FlaskConical size={13} /> Resultados listos ({resultados.length})
                </div>
                {resultados.length === 0 ? (
                  <p className="dash-bandeja-empty">Sin resultados recientes</p>
                ) : (
                  resultados.slice(0, 4).map((o) => (
                    <button
                      key={o._id}
                      className="dash-bandeja-item"
                      onClick={() => navigate(`/pacientes/${o.pacienteId?._id}`)}
                    >
                      <div className="dash-bandeja-item-main">
                        <span className="dash-bandeja-item-name">
                          {o.pacienteId?.nombres} {o.pacienteId?.apellidos}
                        </span>
                        <span className="dash-bandeja-item-sub">
                          {o.items?.length ?? 0} examen(es) · {o.especialidadId?.nombre ?? ""}
                        </span>
                      </div>
                      {o.archivoResultadoUrl && (
                        <a
                          className="dash-bandeja-pdf"
                          href={o.archivoResultadoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText size={13} /> PDF
                        </a>
                      )}
                      <ChevronRight size={14} className="dash-bandeja-chevron" />
                    </button>
                  ))
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
