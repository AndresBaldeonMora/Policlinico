import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, CheckCircle, XCircle,
  User, ChevronRight, AlertTriangle, Info, AlertCircle, FileText,
  Inbox, FlaskConical, Reply, Users, Send,
  CheckCircle2, CalendarCheck, Hourglass, BadgeCheck,
} from "lucide-react";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico, MedicoPerfil } from "../../services/medico.service";
import { InterconsultaApiService, type Interconsulta, type EstadoInterconsulta } from "../../services/interconsulta.service";
import "./MedicoDashboard.css";

const ESTADO_ENV_LABEL: Record<EstadoInterconsulta, { label: string; cls: string; icon: any }> = {
  PENDIENTE:  { label: "Pendiente",     cls: "warning", icon: Hourglass },
  RESPONDIDA: { label: "Respondida",    cls: "success", icon: CheckCircle2 },
  CITADA:     { label: "Cita agendada", cls: "info",    icon: CalendarCheck },
  ATENDIDA:   { label: "Atendida",      cls: "success", icon: BadgeCheck },
  CANCELADA:  { label: "Cancelada",     cls: "muted",   icon: XCircle },
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

function iniciales(nombres?: string, apellidos?: string): string {
  const n = (nombres ?? "").trim().split(/\s+/)[0]?.[0] ?? "";
  const a = (apellidos ?? "").trim().split(/\s+/)[0]?.[0] ?? "";
  return (n + a).toUpperCase() || "·";
}

type BandejaTab = "recibidas" | "respondidas" | "resultados" | "enviadas";

export default function MedicoDashboard() {
  const navigate = useNavigate();
  const [perfil,        setPerfil]        = useState<MedicoPerfil | null>(null);
  const [citasHoy,      setCitasHoy]      = useState<CitaMedico[]>([]);
  const [turno,         setTurno]         = useState<{ inicio: string; fin: string } | null>(null);
  const [interconsultas, setInterconsultas] = useState<Interconsulta[]>([]);
  const [respondidas,   setRespondidas]   = useState<Interconsulta[]>([]);
  const [enviadas,      setEnviadas]      = useState<Interconsulta[]>([]);
  const [resultados,    setResultados]    = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [tabActiva,     setTabActiva]     = useState<BandejaTab>("recibidas");

  const cargarBandeja = () => {
    InterconsultaApiService.listarRecibidas("PENDIENTE")
      .then(setInterconsultas)
      .catch(() => {});
    InterconsultaApiService.listarRecibidas("PROCESADAS")
      .then(setRespondidas)
      .catch(() => {});
    InterconsultaApiService.listarEnviadas()
      .then(setEnviadas)
      .catch(() => {});
    MedicoApiService.obtenerResultadosRecientes()
      .then(setResultados)
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      MedicoApiService.obtenerMiPerfil(),
      MedicoApiService.obtenerCitasHoy(),
      MedicoApiService.obtenerTurnoHoy(),
    ])
      .then(([p, c, t]) => { setPerfil(p); setCitasHoy(c); setTurno(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
    cargarBandeja();
  }, []);

  const irADetalle = (ic: Interconsulta) => {
    navigate(`/medico/interconsultas/${ic._id}`);
  };

  // Solo cuentan como "novedades" para el solicitante las que ya fueron
  // procesadas pero aún no las ha visto (RESPONDIDA o CITADA recientes).
  const enviadasNovedades = enviadas.filter(
    (ic) => ic.estado === "RESPONDIDA" || ic.estado === "CITADA"
  );

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
  const proxima    = asistio[0];
  const firstActId = proxima?._id;

  const nombreDoctor = perfil ? `${perfil.nombres} ${perfil.apellidos}` : "Doctor";
  const especialidad = perfil?.especialidadId?.nombre ?? "Medicina General";
  const horaActual   = new Date().getHours();
  const saludo       = horaActual < 12 ? "Buenos días" : horaActual < 18 ? "Buenas tardes" : "Buenas noches";
  const turnoLabel   = turno ? `${turno.inicio} – ${turno.fin}` : null;

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
    ...(enviadasNovedades.length > 0
      ? [{ tipo: "info" as AlertaTipo, msg: `${enviadasNovedades.length} interconsulta${enviadasNovedades.length > 1 ? "s" : ""} tuya${enviadasNovedades.length > 1 ? "s" : ""} respondida${enviadasNovedades.length > 1 ? "s" : ""}` }]
      : []),
  ];

  return (
    <div className="medico-dash">

      {/* ── Header ── */}
      <div className="dash-header-section">
        <div className="dash-greeting">
          <h1 className="dash-greeting-title">{saludo}, {nombreDoctor}</h1>
          <p className="dash-greeting-sub">{formatHoy()} · {especialidad}</p>
        </div>
        <div className="dash-header-chips">
          {turnoLabel && (
            <div className="dash-header-chip">
              <Clock size={15} className="dash-chip-icon" />
              <div>
                <div className="dash-chip-label">Turno</div>
                <div className="dash-chip-value">{turnoLabel}</div>
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

      {/* ── Stats strip + progress (reemplaza 5 KPI tiles) ── */}
      <div className="dash-stats-strip">
        <div className="dash-stat">
          <Calendar size={13} className="dash-stat-icon" />
          <span className="dash-stat-val">{total}</span>
          <span className="dash-stat-lbl">programadas</span>
        </div>
        <div className="dash-stat-sep" />
        <div className="dash-stat dash-stat--success">
          <CheckCircle size={13} className="dash-stat-icon" />
          <span className="dash-stat-val">{atendidas.length}</span>
          <span className="dash-stat-lbl">atendidas <em>· {pct}%</em></span>
        </div>
        <div className="dash-stat-sep" />
        <div className={`dash-stat${asistio.length > 0 ? " dash-stat--primary" : ""}`}>
          <User size={13} className="dash-stat-icon" />
          <span className="dash-stat-val">{asistio.length}</span>
          <span className="dash-stat-lbl">en sala</span>
        </div>
        <div className="dash-stat-sep" />
        <div className={`dash-stat${pendientes.length > 0 ? " dash-stat--warning" : ""}`}>
          <Clock size={13} className="dash-stat-icon" />
          <span className="dash-stat-val">{pendientes.length}</span>
          <span className="dash-stat-lbl">pendientes</span>
        </div>
        {canceladas.length > 0 && (
          <>
            <div className="dash-stat-sep" />
            <div className="dash-stat dash-stat--danger">
              <XCircle size={13} className="dash-stat-icon" />
              <span className="dash-stat-val">{canceladas.length}</span>
              <span className="dash-stat-lbl">canceladas</span>
            </div>
          </>
        )}

        {total > 0 && (
          <div className="dash-stats-progress">
            <div className="dash-stats-progress-track">
              <div className="dash-stats-progress-seg dash-stats-progress-seg--success" style={{ width: `${(atendidas.length / total) * 100}%` }} />
              <div className="dash-stats-progress-seg dash-stats-progress-seg--primary" style={{ width: `${(asistio.length / total) * 100}%` }} />
              <div className="dash-stats-progress-seg dash-stats-progress-seg--warning" style={{ width: `${(pendientes.length / total) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Alertas banner slim ── */}
      {alertas.length > 0 && (
        <div className="dash-alertas-strip">
          {alertas.slice(0, 4).map((a, i) => (
            <div key={i} className={`dash-alerta-chip dash-alerta-chip--${a.tipo}`}>
              {a.tipo === "danger"  && <AlertCircle   size={12} />}
              {a.tipo === "warning" && <AlertTriangle size={12} />}
              {a.tipo === "info"    && <Info          size={12} />}
              {a.tipo === "primary" && <Users         size={12} />}
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── HERO: Próxima atención / En sala ── */}
      {proxima && (() => {
        const enSala = proxima.estado === "ASISTIO";
        const pac = proxima.pacienteId;
        const edadStr = calcEdad(pac.fechaNacimiento);
        const tieneAlergias = (pac.alergias?.length ?? 0) > 0;
        const tieneCronicas = (pac.problemasMedicos?.length ?? 0) > 0;
        return (
          <div className={`dash-proxima${enSala ? " dash-proxima--sala" : ""}`}>
            <div className="dash-proxima-glow" />
            <div className="dash-proxima-left">
              <div className="dash-proxima-eyebrow">
                {enSala && <span className="dash-proxima-dot" />}
                {enSala ? "En sala — listo para atender" : "Próxima atención"}
              </div>
              <div className="dash-proxima-body">
                <div className="dash-proxima-avatar">
                  {iniciales(pac.nombres, pac.apellidos)}
                </div>
                <div className="dash-proxima-info">
                  <h2 className="dash-proxima-name">{pac.nombres} {pac.apellidos}</h2>
                  <div className="dash-proxima-meta">
                    <span><Clock size={11} /> {proxima.hora}</span>
                    {edadStr && <span>{edadStr.replace("a", " años")}</span>}
                    <span>DNI {pac.dni}</span>
                    {tieneAlergias && (
                      <span className="dash-flag dash-flag--danger">
                        <AlertCircle size={10} /> Alergia
                      </span>
                    )}
                    {tieneCronicas && (
                      <span className="dash-flag dash-flag--warning">Crónico</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="dash-proxima-actions">
              <button
                className="dash-proxima-hc-btn"
                onClick={() => navigate(`/pacientes/${pac._id}`)}
                title="Ver historia clínica"
              >
                <FileText size={14} />
              </button>
              <button
                className="dash-proxima-cta"
                onClick={() => navigate(`/medico/citas/${proxima._id}/consulta`)}
              >
                {enSala ? "Continuar consulta" : "Iniciar consulta"} →
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Grid principal: Agenda | Bandeja ── */}
      <div className="dash-content-grid">

        {/* Agenda del día */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Agenda de hoy</span>
            <div className="dash-card-header-right">
              <span className="dash-agenda-total">{asistio.length} en sala</span>
              <button className="dash-link" onClick={() => navigate("/medico/citas")}>Ver todas →</button>
            </div>
          </div>

          {asistio.length === 0 ? (
            <div className="dash-empty">
              <User size={32} />
              <p>No hay pacientes en sala</p>
              <button className="dash-link-secondary" onClick={() => navigate("/medico/citas")}>
                Ver agenda completa
              </button>
            </div>
          ) : (
            <div className="dash-agenda-list">
              {asistio.map((c, i) => {
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
                    style={{ borderBottom: i === asistio.length - 1 ? "none" : undefined }}
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

          {/* Bandeja de tareas — tabs con items full-width */}
          <div className="dash-card dash-bandeja-card-v2">
            <div className="dash-card-header dash-bandeja-header-v2">
              <span className="dash-card-title">
                <Inbox size={15} style={{ verticalAlign: "-2px" }} /> Bandeja de tareas
              </span>
              {(interconsultas.length + enviadasNovedades.length) > 0 ? (
                <span className="dash-bandeja-summary-v2">
                  {interconsultas.length + enviadasNovedades.length} requieren atención
                </span>
              ) : (
                <span className="dash-bandeja-summary-v2 dash-bandeja-summary-v2--ok">
                  <CheckCircle size={11} /> Al día
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="dash-tabs">
              {([
                { id: "recibidas",   label: "Por responder", icon: Reply,         count: interconsultas.length, badge: 0 },
                { id: "respondidas", label: "Respondidas",   icon: CheckCircle2,  count: respondidas.length,    badge: 0 },
                { id: "resultados",  label: "Resultados",    icon: FlaskConical,  count: resultados.length,     badge: 0 },
                { id: "enviadas",    label: "Mis enviadas",  icon: Send,          count: enviadas.length,       badge: enviadasNovedades.length },
              ] as const).map((t) => {
                const TabIcon = t.icon;
                const activa = tabActiva === t.id;
                return (
                  <button
                    key={t.id}
                    className={`dash-tab${activa ? " dash-tab--activa" : ""}`}
                    onClick={() => setTabActiva(t.id as BandejaTab)}
                  >
                    <TabIcon size={13} />
                    <span className="dash-tab-label">{t.label}</span>
                    {t.count > 0 && <span className="dash-tab-count">{t.count}</span>}
                    {t.badge > 0 && <span className="dash-tab-novedad" title={`${t.badge} con novedad`} />}
                  </button>
                );
              })}
            </div>

            {/* Contenido de la tab activa */}
            <div className="dash-tab-content">

              {tabActiva === "recibidas" && (
                interconsultas.length === 0 ? (
                  <div className="dash-tab-empty">
                    <div className="dash-tab-empty-icon dash-tab-empty-icon--ok">
                      <CheckCircle2 size={22} />
                    </div>
                    <p className="dash-tab-empty-title">Bandeja al día</p>
                    <p className="dash-tab-empty-sub">No tienes interconsultas por responder</p>
                  </div>
                ) : (
                  <div className="dash-tab-list">
                    {interconsultas.slice(0, 5).map((ic) => (
                      <button key={ic._id} className="dash-tab-item" onClick={() => irADetalle(ic)}>
                        <div className="dash-tab-item-avatar dash-tab-item-avatar--warn">
                          <Reply size={14} />
                        </div>
                        <div className="dash-tab-item-main">
                          <span className="dash-tab-item-name">
                            {ic.pacienteId?.nombres} {ic.pacienteId?.apellidos}
                          </span>
                          <span className="dash-tab-item-sub">
                            De <b>{ic.solicitanteNombre}</b> · {ic.motivoConsulta}
                          </span>
                        </div>
                        <ChevronRight size={14} className="dash-tab-item-arrow" />
                      </button>
                    ))}
                  </div>
                )
              )}

              {tabActiva === "respondidas" && (
                respondidas.length === 0 ? (
                  <div className="dash-tab-empty">
                    <div className="dash-tab-empty-icon dash-tab-empty-icon--info">
                      <CheckCircle2 size={22} />
                    </div>
                    <p className="dash-tab-empty-title">Sin historial</p>
                    <p className="dash-tab-empty-sub">Aquí verás interconsultas que respondiste o derivaste a cita</p>
                  </div>
                ) : (
                  <div className="dash-tab-list">
                    {respondidas.slice(0, 6).map((ic) => {
                      const est = ESTADO_ENV_LABEL[ic.estado] ?? ESTADO_ENV_LABEL.RESPONDIDA;
                      const EstIcon = est.icon;
                      return (
                        <button
                          key={ic._id}
                          className="dash-tab-item"
                          onClick={() => navigate(`/medico/interconsultas/${ic._id}`)}
                        >
                          <div className="dash-tab-item-avatar dash-tab-item-avatar--success">
                            <CheckCircle2 size={14} />
                          </div>
                          <div className="dash-tab-item-main">
                            <span className="dash-tab-item-name">
                              {ic.pacienteId?.nombres} {ic.pacienteId?.apellidos}
                            </span>
                            <span className="dash-tab-item-sub">
                              De <b>{ic.solicitanteNombre}</b> · {ic.motivoConsulta}
                            </span>
                          </div>
                          <span className={`dash-tab-item-meta dash-tab-item-meta--${est.cls}`}>
                            <EstIcon size={10} /> {est.label}
                          </span>
                          <ChevronRight size={14} className="dash-tab-item-arrow" />
                        </button>
                      );
                    })}
                  </div>
                )
              )}

              {tabActiva === "resultados" && (
                resultados.length === 0 ? (
                  <div className="dash-tab-empty">
                    <div className="dash-tab-empty-icon dash-tab-empty-icon--info">
                      <FlaskConical size={22} />
                    </div>
                    <p className="dash-tab-empty-title">Sin resultados recientes</p>
                    <p className="dash-tab-empty-sub">Aquí verás resultados de exámenes que ordenaste</p>
                  </div>
                ) : (
                  <div className="dash-tab-list">
                    {resultados.slice(0, 5).map((o) => (
                      <button
                        key={o._id}
                        className="dash-tab-item"
                        onClick={() => navigate(`/pacientes/${o.pacienteId?._id}`)}
                      >
                        <div className="dash-tab-item-avatar dash-tab-item-avatar--success">
                          <FlaskConical size={14} />
                        </div>
                        <div className="dash-tab-item-main">
                          <span className="dash-tab-item-name">
                            {o.pacienteId?.nombres} {o.pacienteId?.apellidos}
                          </span>
                          <span className="dash-tab-item-sub">
                            {o.items?.length ?? 0} examen(es) · {o.especialidadId?.nombre ?? ""}
                          </span>
                        </div>
                        {o.archivoResultadoUrl ? (
                          <a
                            className="dash-bandeja-pdf"
                            href={o.archivoResultadoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText size={12} /> PDF
                          </a>
                        ) : null}
                        <ChevronRight size={14} className="dash-tab-item-arrow" />
                      </button>
                    ))}
                  </div>
                )
              )}

              {tabActiva === "enviadas" && (
                enviadas.length === 0 ? (
                  <div className="dash-tab-empty">
                    <div className="dash-tab-empty-icon dash-tab-empty-icon--info">
                      <Send size={22} />
                    </div>
                    <p className="dash-tab-empty-title">Aún no has enviado interconsultas</p>
                    <p className="dash-tab-empty-sub">Aquí verás el estado de las interconsultas que envíes</p>
                  </div>
                ) : (
                  <div className="dash-tab-list">
                    {enviadas.slice(0, 5).map((ic) => {
                      const est = ESTADO_ENV_LABEL[ic.estado] ?? ESTADO_ENV_LABEL.PENDIENTE;
                      const EstIcon = est.icon;
                      const esNovedad = ic.estado === "RESPONDIDA" || ic.estado === "CITADA";
                      return (
                        <button
                          key={ic._id}
                          className={`dash-tab-item${esNovedad ? " dash-tab-item--nuevo" : ""}`}
                          onClick={() => irADetalle(ic)}
                        >
                          {esNovedad && <span className="dash-tab-item-dot" />}
                          <div className="dash-tab-item-avatar dash-tab-item-avatar--info">
                            <Send size={14} />
                          </div>
                          <div className="dash-tab-item-main">
                            <span className="dash-tab-item-name">
                              {ic.pacienteId?.nombres} {ic.pacienteId?.apellidos}
                            </span>
                            <span className="dash-tab-item-sub">
                              A <b>{ic.especialidadSolicitada}</b> · {ic.motivoConsulta}
                            </span>
                          </div>
                          <span className={`dash-tab-item-meta dash-tab-item-meta--${est.cls}`}>
                            <EstIcon size={10} /> {est.label}
                          </span>
                          <ChevronRight size={14} className="dash-tab-item-arrow" />
                        </button>
                      );
                    })}
                  </div>
                )
              )}

            </div>
          </div>

      </div>
    </div>
  );
}
