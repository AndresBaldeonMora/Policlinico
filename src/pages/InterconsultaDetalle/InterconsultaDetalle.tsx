import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeft, User, FileText, MessageCircle, CalendarPlus,
  CheckCircle2, Clock, AlertCircle, Stethoscope, Calendar as CalIcon,
  ChevronLeft, ChevronRight, Send, X, Sparkles, Activity,
  HelpCircle, ClipboardList, Hourglass, BadgeCheck,
} from "lucide-react";
import {
  InterconsultaApiService,
  type Interconsulta,
  type EstadoInterconsulta,
} from "../../services/interconsulta.service";
import { MedicoApiService } from "../../services/medico.service";
import { DoctorApiService } from "../../services/doctor.service";
import { toastExito } from "../../utils/toast";
import "./InterconsultaDetalle.css";

const ESTADO_META: Record<EstadoInterconsulta, { label: string; cls: string; icon: any }> = {
  PENDIENTE:  { label: "Pendiente",     cls: "warn",  icon: Hourglass },
  RESPONDIDA: { label: "Respondida",    cls: "ok",    icon: CheckCircle2 },
  CITADA:     { label: "Cita agendada", cls: "info",  icon: CalIcon },
  ATENDIDA:   { label: "Atendida",      cls: "done",  icon: BadgeCheck },
  CANCELADA:  { label: "Cancelada",     cls: "muted", icon: X },
};

const PRIORIDAD_META: Record<string, { label: string; cls: string }> = {
  urgente:    { label: "Urgente",    cls: "danger" },
  preferente: { label: "Preferente", cls: "warning" },
  electiva:   { label: "Electiva",   cls: "info" },
};

function calcEdad(fechaNacimiento?: string): string {
  if (!fechaNacimiento) return "";
  const b = new Date(fechaNacimiento);
  const t = new Date();
  const age =
    t.getFullYear() - b.getFullYear() -
    (t < new Date(t.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
  return `${age} años`;
}

function iniciales(nombres?: string, apellidos?: string): string {
  const n = (nombres ?? "").trim().split(/\s+/)[0]?.[0] ?? "";
  const a = (apellidos ?? "").trim().split(/\s+/)[0]?.[0] ?? "";
  return (n + a).toUpperCase() || "·";
}

const formatFechaLarga = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("es-PE", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

const formatFechaCorta = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fechaToISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Modo = "ver" | "responder" | "agendar";
type HorarioSlot = { hora: string; disponible: boolean };

// ──────────────────────────────────────────────────────────────
// Componentes internos: Timeline de estado + Mini calendario
// ──────────────────────────────────────────────────────────────

function TimelineEstado({ estado, fechaCreacion, fechaRespuesta, citaFecha, citaEstado }: {
  estado: EstadoInterconsulta;
  fechaCreacion?: string;
  fechaRespuesta?: string;
  citaFecha?: string;
  citaEstado?: string;
}) {
  // Cancelada: timeline corto
  if (estado === "CANCELADA") {
    return (
      <div className="icd-timeline icd-timeline--cancel">
        <div className="icd-timeline-step icd-timeline-step--done">
          <div className="icd-timeline-dot"><Send size={11} /></div>
          <div className="icd-timeline-meta">
            <span className="icd-timeline-label">Enviada</span>
            <span className="icd-timeline-fecha">{formatFechaCorta(fechaCreacion)}</span>
          </div>
        </div>
        <div className="icd-timeline-line icd-timeline-line--done" />
        <div className="icd-timeline-step icd-timeline-step--cancel">
          <div className="icd-timeline-dot"><X size={11} /></div>
          <div className="icd-timeline-meta">
            <span className="icd-timeline-label">Cancelada</span>
          </div>
        </div>
      </div>
    );
  }

  const tieneRespuesta = estado === "RESPONDIDA" || estado === "CITADA" || estado === "ATENDIDA";
  const tieneCita      = estado === "CITADA" || estado === "ATENDIDA";
  const yaAtendida     = estado === "ATENDIDA" || citaEstado === "ATENDIDA";

  return (
    <div className="icd-timeline">
      {/* Paso 1: Enviada */}
      <div className="icd-timeline-step icd-timeline-step--done">
        <div className="icd-timeline-dot"><Send size={11} /></div>
        <div className="icd-timeline-meta">
          <span className="icd-timeline-label">Enviada</span>
          <span className="icd-timeline-fecha">{formatFechaCorta(fechaCreacion)}</span>
        </div>
      </div>
      <div className={`icd-timeline-line${tieneRespuesta ? " icd-timeline-line--done" : ""}`} />

      {/* Paso 2: Respondida */}
      <div className={`icd-timeline-step${tieneRespuesta ? " icd-timeline-step--done" : " icd-timeline-step--pending"}`}>
        <div className="icd-timeline-dot"><MessageCircle size={11} /></div>
        <div className="icd-timeline-meta">
          <span className="icd-timeline-label">Respuesta</span>
          <span className="icd-timeline-fecha">
            {tieneRespuesta ? formatFechaCorta(fechaRespuesta) : "—"}
          </span>
        </div>
      </div>
      <div className={`icd-timeline-line${tieneCita ? " icd-timeline-line--done" : ""}`} />

      {/* Paso 3: Cita agendada */}
      <div className={`icd-timeline-step${tieneCita ? " icd-timeline-step--done" : " icd-timeline-step--pending"}`}>
        <div className="icd-timeline-dot"><CalIcon size={11} /></div>
        <div className="icd-timeline-meta">
          <span className="icd-timeline-label">Cita</span>
          <span className="icd-timeline-fecha">
            {tieneCita ? formatFechaCorta(citaFecha) : (tieneRespuesta && !tieneCita ? "No requerida" : "—")}
          </span>
        </div>
      </div>
      <div className={`icd-timeline-line${yaAtendida ? " icd-timeline-line--done" : ""}`} />

      {/* Paso 4: Atendida */}
      <div className={`icd-timeline-step${yaAtendida ? " icd-timeline-step--done" : " icd-timeline-step--pending"}`}>
        <div className="icd-timeline-dot"><BadgeCheck size={11} /></div>
        <div className="icd-timeline-meta">
          <span className="icd-timeline-label">Atendida</span>
        </div>
      </div>
    </div>
  );
}

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function MiniCalendario({ valor, onChange, min }: {
  valor: string;
  onChange: (iso: string) => void;
  min?: string;
}) {
  const valorDate = new Date(valor);
  const [mes, setMes] = useState<number>(valorDate.getMonth());
  const [año, setAño] = useState<number>(valorDate.getFullYear());

  const minDate = min ? new Date(min) : new Date();
  minDate.setHours(0, 0, 0, 0);

  const primerDia = new Date(año, mes, 1);
  const primerDiaSemana = (primerDia.getDay() + 6) % 7; // Lunes = 0
  const diasEnMes = new Date(año, mes + 1, 0).getDate();

  const navegar = (delta: number) => {
    const nuevoMes = mes + delta;
    if (nuevoMes < 0) { setMes(11); setAño(año - 1); }
    else if (nuevoMes > 11) { setMes(0); setAño(año + 1); }
    else setMes(nuevoMes);
  };

  const seleccionar = (dia: number) => {
    const d = new Date(año, mes, dia);
    if (d < minDate) return;
    onChange(fechaToISO(d));
  };

  const celdas: (number | null)[] = [
    ...Array(primerDiaSemana).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  return (
    <div className="icd-cal">
      <div className="icd-cal-head">
        <button type="button" className="icd-cal-nav" onClick={() => navegar(-1)} aria-label="Mes anterior">
          <ChevronLeft size={14} />
        </button>
        <span className="icd-cal-titulo">{MESES[mes]} {año}</span>
        <button type="button" className="icd-cal-nav" onClick={() => navegar(1)} aria-label="Mes siguiente">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="icd-cal-dias">
        {DIAS_SEMANA.map((d, i) => <span key={i} className="icd-cal-dia-head">{d}</span>)}
      </div>
      <div className="icd-cal-grid">
        {celdas.map((dia, idx) => {
          if (dia === null) return <span key={idx} className="icd-cal-celda icd-cal-celda--vacia" />;
          const d = new Date(año, mes, dia);
          const iso = fechaToISO(d);
          const esHoy = iso === hoyISO();
          const esSel = iso === valor;
          const offlimit = d < minDate;
          return (
            <button
              key={idx}
              type="button"
              disabled={offlimit}
              className={
                "icd-cal-celda" +
                (esSel ? " icd-cal-celda--sel" : "") +
                (esHoy && !esSel ? " icd-cal-celda--hoy" : "") +
                (offlimit ? " icd-cal-celda--off" : "")
              }
              onClick={() => seleccionar(dia)}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Página
// ──────────────────────────────────────────────────────────────

export default function InterconsultaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ic, setIc] = useState<Interconsulta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [miMedicoId, setMiMedicoId] = useState<string>("");

  const [modo, setModo] = useState<Modo>("ver");
  const [respuesta, setRespuesta] = useState("");
  const [respuestaCita, setRespuestaCita] = useState("");
  const [fechaSel, setFechaSel] = useState<string>(hoyISO());
  const [horaSel, setHoraSel] = useState<string>("");
  const [horarios, setHorarios] = useState<HorarioSlot[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      InterconsultaApiService.obtenerPorId(id),
      MedicoApiService.obtenerMiPerfil().catch(() => null),
    ])
      .then(([data, perfil]) => {
        setIc(data);
        if (perfil?._id) setMiMedicoId(perfil._id);
      })
      .catch(() => setError("No se pudo cargar la interconsulta"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (modo !== "agendar" || !miMedicoId) return;
    setCargandoHorarios(true);
    setHoraSel("");
    DoctorApiService.obtenerHorariosDisponibles(miMedicoId, fechaSel)
      .then((slots) => setHorarios(slots as unknown as HorarioSlot[]))
      .catch(() => setHorarios([]))
      .finally(() => setCargandoHorarios(false));
  }, [modo, miMedicoId, fechaSel]);

  const puedeAccionar = useMemo(() => {
    if (!ic || ic.estado !== "PENDIENTE" || !miMedicoId) return false;
    if (ic.solicitanteId?._id === miMedicoId) return false;
    return true;
  }, [ic, miMedicoId]);

  // El destinatario puede agendar cita incluso si ya respondió por escrito.
  const puedeAgendarTrasRespuesta = useMemo(() => {
    if (!ic || ic.estado !== "RESPONDIDA" || !miMedicoId) return false;
    if (ic.solicitanteId?._id === miMedicoId) return false;
    // Si esta interconsulta ya fue respondida por mí, puedo agendar la cita derivada
    const respondidoPorMi = typeof ic.respondidoPorId === "object" && ic.respondidoPorId?._id === miMedicoId;
    return respondidoPorMi;
  }, [ic, miMedicoId]);

  const esSolicitante = ic && miMedicoId && ic.solicitanteId?._id === miMedicoId;

  const handleResponder = async () => {
    if (!ic || !respuesta.trim()) return;
    setGuardando(true);
    try {
      const actualizada = await InterconsultaApiService.responder(ic._id, respuesta.trim());
      setIc(actualizada);
      setModo("ver");
      setRespuesta("");
      toastExito("Respuesta enviada al médico solicitante");
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Error", text: e?.message || "No se pudo enviar la respuesta", confirmButtonColor: "var(--primary)" });
    } finally {
      setGuardando(false);
    }
  };

  const handleAgendar = async () => {
    if (!ic || !fechaSel || !horaSel) return;
    setGuardando(true);
    try {
      const actualizada = await InterconsultaApiService.agendarCita(ic._id, {
        fecha: fechaSel,
        hora: horaSel,
        respuesta: respuestaCita.trim() || undefined,
      });
      setIc(actualizada);
      setModo("ver");
      setHoraSel("");
      setRespuestaCita("");
      toastExito("Cita presencial agendada");
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "No se pudo agendar", text: e?.message || "Verifica fecha y hora", confirmButtonColor: "var(--primary)" });
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="icd-container">
        <div className="icd-skeleton">
          <div className="icd-sk-hero" />
          <div className="icd-sk-row">
            <div className="icd-sk-card" />
            <div className="icd-sk-side" />
          </div>
          <p className="icd-sk-text">Cargando interconsulta…</p>
        </div>
      </div>
    );
  }

  if (error || !ic) {
    return (
      <div className="icd-container">
        <div className="icd-error">
          <div className="icd-error-icon"><AlertCircle size={28} /></div>
          <h3>No se pudo cargar</h3>
          <p>{error || "Interconsulta no encontrada o sin permisos para visualizarla."}</p>
          <button className="icd-btn icd-btn--ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Volver
          </button>
        </div>
      </div>
    );
  }

  const pac = ic.pacienteId;
  const estadoMeta = ESTADO_META[ic.estado];
  const prioMeta = PRIORIDAD_META[ic.prioridad] ?? PRIORIDAD_META.electiva;
  const cita = typeof ic.citaGeneradaId === "object" ? ic.citaGeneradaId : null;
  const EstadoIcon = estadoMeta.icon;

  return (
    <div className="icd-container">

      {/* ── Barra superior ── */}
      <div className="icd-topbar">
        <button className="icd-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="icd-topbar-meta">
          <span className="icd-topbar-id">Interconsulta · #{ic._id.slice(-6).toUpperCase()}</span>
          <span className="icd-topbar-fecha">{formatFechaLarga(ic.createdAt)}</span>
        </div>
      </div>

      {/* ── Hero: paciente + estado actual ── */}
      <div className={`icd-hero icd-hero--${estadoMeta.cls}`}>
        <div className="icd-hero-pac">
          <div className="icd-avatar">{iniciales(pac?.nombres, pac?.apellidos)}</div>
          <div className="icd-hero-pac-info">
            <h1 className="icd-hero-nombre">{pac?.nombres} {pac?.apellidos}</h1>
            <div className="icd-hero-meta">
              <span>DNI {pac?.dni}</span>
              {pac?.fechaNacimiento && <span>· {calcEdad(pac.fechaNacimiento)}</span>}
              <span>· {ic.especialidadSolicitada}</span>
            </div>
          </div>
        </div>
        <div className="icd-hero-status">
          <span className={`icd-prio-pill icd-prio-pill--${prioMeta.cls}`}>
            <span className="icd-prio-dot" /> {prioMeta.label}
          </span>
          <div className={`icd-estado-big icd-estado-big--${estadoMeta.cls}`}>
            <EstadoIcon size={16} />
            <span>{estadoMeta.label}</span>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="icd-timeline-wrap">
        <TimelineEstado
          estado={ic.estado}
          fechaCreacion={ic.createdAt}
          fechaRespuesta={ic.fechaRespuesta}
          citaFecha={cita?.fecha}
          citaEstado={cita?.estado}
        />
      </div>

      <div className="icd-grid">

        {/* ── Columna izquierda: contenido clínico ── */}
        <div className="icd-col-main">

          {/* Solicitud */}
          <div className="icd-card">
            <div className="icd-card-head">
              <div className="icd-card-icon icd-card-icon--blue"><Stethoscope size={14} /></div>
              <h3 className="icd-card-title">Solicitud clínica</h3>
            </div>
            <div className="icd-grid-2col">
              <div className="icd-kv">
                <span className="icd-kv-label">Especialidad solicitada</span>
                <span className="icd-kv-value">{ic.especialidadSolicitada}</span>
              </div>
              <div className="icd-kv">
                <span className="icd-kv-label">Médico solicitante</span>
                <span className="icd-kv-value">{ic.solicitanteNombre}</span>
              </div>
              {ic.medicoSolicitado && (
                <div className="icd-kv">
                  <span className="icd-kv-label">Destino sugerido</span>
                  <span className="icd-kv-value">{ic.medicoSolicitado}</span>
                </div>
              )}
              <div className="icd-kv">
                <span className="icd-kv-label">Prioridad</span>
                <span className="icd-kv-value">
                  <span className={`icd-mini-badge icd-mini-badge--${prioMeta.cls}`}>{prioMeta.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Motivo y contexto */}
          <div className="icd-card">
            <div className="icd-card-head">
              <div className="icd-card-icon icd-card-icon--violet"><FileText size={14} /></div>
              <h3 className="icd-card-title">Motivo y contexto clínico</h3>
            </div>

            <div className="icd-block">
              <div className="icd-block-label">
                <ClipboardList size={11} /> Motivo de la interconsulta
              </div>
              <div className="icd-block-text">{ic.motivoConsulta}</div>
            </div>

            {ic.preguntaClinica && (
              <div className="icd-block">
                <div className="icd-block-label">
                  <HelpCircle size={11} /> Pregunta clínica específica
                </div>
                <div className="icd-block-text">{ic.preguntaClinica}</div>
              </div>
            )}

            {ic.informacionRelevante && (
              <div className="icd-block">
                <div className="icd-block-label">
                  <Activity size={11} /> Información clínica relevante
                </div>
                <div className="icd-block-text">{ic.informacionRelevante}</div>
              </div>
            )}
          </div>

          {/* Respuesta existente */}
          {(ic.estado === "RESPONDIDA" || ic.estado === "CITADA" || ic.estado === "ATENDIDA") && (
            <div className="icd-card icd-card--ok">
              <div className="icd-card-head">
                <div className="icd-card-icon icd-card-icon--green"><CheckCircle2 size={14} /></div>
                <h3 className="icd-card-title">Respuesta del especialista</h3>
                {ic.estado === "ATENDIDA" && (
                  <span className="icd-mini-badge icd-mini-badge--success">
                    <BadgeCheck size={10} /> Cita atendida
                  </span>
                )}
              </div>

              {ic.respuesta ? (
                <div className="icd-block-text icd-respuesta-text">{ic.respuesta}</div>
              ) : (
                <p className="icd-muted-text">Sin nota escrita. {cita ? "El especialista agendó una cita presencial." : ""}</p>
              )}

              <div className="icd-respuesta-meta">
                {ic.respondidoPorNombre && (
                  <span className="icd-meta-chip">
                    <User size={10} /> {ic.respondidoPorNombre}
                  </span>
                )}
                {ic.fechaRespuesta && (
                  <span className="icd-meta-chip">
                    <Clock size={10} /> {formatFechaLarga(ic.fechaRespuesta)}
                  </span>
                )}
              </div>

              {cita && (
                <div className="icd-cita-callout">
                  <CalIcon size={15} />
                  <div className="icd-cita-callout-body">
                    <div className="icd-cita-callout-title">Cita presencial agendada</div>
                    <div className="icd-cita-callout-sub">
                      {formatFechaCorta(cita.fecha)} · {cita.hora ?? "—"} · {cita.estado}
                    </div>
                  </div>
                  <button
                    className="icd-cita-callout-btn"
                    onClick={() => navigate(`/medico/citas/${cita._id}/consulta`)}
                  >
                    Abrir cita →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Columna derecha: acciones ── */}
        <div className="icd-col-side">

          {(ic.estado === "PENDIENTE" || puedeAgendarTrasRespuesta) && (
            <div className="icd-card icd-card--side">
              <div className="icd-card-head">
                <div className="icd-card-icon icd-card-icon--primary"><Sparkles size={14} /></div>
                <h3 className="icd-card-title">
                  {puedeAgendarTrasRespuesta ? "¿Necesita ser citado?" : "Acciones disponibles"}
                </h3>
              </div>

              {ic.estado === "PENDIENTE" && !puedeAccionar && (
                <div className="icd-warn">
                  <Hourglass size={14} />
                  <span>
                    {esSolicitante
                      ? "Tú creaste esta interconsulta. Espera la respuesta del especialista."
                      : "Solo el médico destinatario o de la especialidad solicitada puede responder."}
                  </span>
                </div>
              )}

              {(puedeAccionar || puedeAgendarTrasRespuesta) && modo === "ver" && (
                <div className="icd-actions">
                  {puedeAccionar && (
                    <button className="icd-action-btn icd-action-btn--primary" onClick={() => setModo("responder")}>
                      <div className="icd-action-icon"><MessageCircle size={16} /></div>
                      <div className="icd-action-body">
                        <span className="icd-action-title">Responder por escrito</span>
                        <span className="icd-action-sub">Envía una recomendación clínica al solicitante</span>
                      </div>
                    </button>
                  )}

                  <button className="icd-action-btn icd-action-btn--violet" onClick={() => setModo("agendar")}>
                    <div className="icd-action-icon"><CalendarPlus size={16} /></div>
                    <div className="icd-action-body">
                      <span className="icd-action-title">
                        {puedeAgendarTrasRespuesta ? "Agendar cita complementaria" : "Agendar cita presencial"}
                      </span>
                      <span className="icd-action-sub">
                        {puedeAgendarTrasRespuesta
                          ? "Cita el paciente para evaluación presencial con tu respuesta como referencia"
                          : "Programa la consulta en tu agenda"}
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* MODO RESPONDER (sólo desde PENDIENTE) */}
              {puedeAccionar && modo === "responder" && (
                <div className="icd-form">
                  <div className="icd-form-head">
                    <span className="icd-form-step">Responder</span>
                    <button className="icd-form-close" onClick={() => { setModo("ver"); setRespuesta(""); }} title="Cancelar">
                      <X size={13} />
                    </button>
                  </div>

                  <label className="icd-label">Tu respuesta clínica</label>
                  <textarea
                    className="icd-textarea"
                    placeholder="Recomendación, sugerencia diagnóstica, manejo propuesto…"
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    rows={9}
                    autoFocus
                  />
                  <div className="icd-textarea-foot">
                    <span className="icd-hint">El solicitante recibirá tu respuesta como notificación en su dashboard.</span>
                    <span className="icd-counter">{respuesta.length} car.</span>
                  </div>

                  <div className="icd-form-actions">
                    <button className="icd-btn icd-btn--ghost" onClick={() => { setModo("ver"); setRespuesta(""); }} disabled={guardando}>
                      Cancelar
                    </button>
                    <button className="icd-btn icd-btn--primary" onClick={handleResponder} disabled={guardando || !respuesta.trim()}>
                      <Send size={13} />
                      {guardando ? "Enviando…" : "Enviar respuesta"}
                    </button>
                  </div>
                </div>
              )}

              {/* MODO AGENDAR (desde PENDIENTE o después de RESPONDIDA) */}
              {(puedeAccionar || puedeAgendarTrasRespuesta) && modo === "agendar" && (
                <div className="icd-form">
                  <div className="icd-form-head">
                    <span className="icd-form-step">Agendar cita</span>
                    <button className="icd-form-close" onClick={() => { setModo("ver"); setHoraSel(""); setRespuestaCita(""); }} title="Cancelar">
                      <X size={13} />
                    </button>
                  </div>

                  <label className="icd-label">1. Selecciona el día</label>
                  <MiniCalendario valor={fechaSel} onChange={setFechaSel} min={hoyISO()} />

                  <label className="icd-label">
                    2. Horario disponible
                    {!cargandoHorarios && horarios.length > 0 && (
                      <span className="icd-label-aside">
                        {horarios.filter(h => h.disponible).length} libres
                      </span>
                    )}
                  </label>

                  {cargandoHorarios ? (
                    <div className="icd-horarios-empty">
                      <div className="icd-mini-spinner" /> Consultando agenda…
                    </div>
                  ) : horarios.length === 0 ? (
                    <div className="icd-horarios-empty">
                      <AlertCircle size={14} />
                      <span>Sin horarios para esta fecha</span>
                    </div>
                  ) : (
                    <div className="icd-horarios-grid">
                      {horarios.map((h) => (
                        <button
                          key={h.hora}
                          type="button"
                          disabled={!h.disponible}
                          className={
                            "icd-slot" +
                            (horaSel === h.hora ? " icd-slot--sel" : "") +
                            (!h.disponible ? " icd-slot--off" : "")
                          }
                          onClick={() => setHoraSel(h.hora)}
                          title={h.disponible ? "Disponible" : "Ocupado"}
                        >
                          {h.hora}
                        </button>
                      ))}
                    </div>
                  )}

                  <label className="icd-label">3. Nota opcional para el solicitante</label>
                  <textarea
                    className="icd-textarea"
                    placeholder="Ej. Citado para evaluación cardiológica el viernes."
                    value={respuestaCita}
                    onChange={(e) => setRespuestaCita(e.target.value)}
                    rows={3}
                  />

                  <div className="icd-form-actions">
                    <button className="icd-btn icd-btn--ghost" onClick={() => { setModo("ver"); setHoraSel(""); setRespuestaCita(""); }} disabled={guardando}>
                      Cancelar
                    </button>
                    <button className="icd-btn icd-btn--primary" onClick={handleAgendar} disabled={guardando || !horaSel}>
                      <CalendarPlus size={13} />
                      {guardando ? "Agendando…" : `Confirmar ${horaSel || ""}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tarjeta de estado para estados terminales */}
          {ic.estado !== "PENDIENTE" && (
            <div className={`icd-card icd-card--side icd-state-card icd-state-card--${estadoMeta.cls}`}>
              <div className="icd-state-card-icon">
                <EstadoIcon size={26} />
              </div>
              <div className="icd-state-card-title">{estadoMeta.label}</div>
              <div className="icd-state-card-sub">
                {ic.estado === "RESPONDIDA" && "El solicitante ya cuenta con la recomendación clínica."}
                {ic.estado === "CITADA"     && "El paciente fue citado para evaluación presencial."}
                {ic.estado === "ATENDIDA"   && "La cita derivada de esta interconsulta ya fue atendida."}
                {ic.estado === "CANCELADA"  && "Esta interconsulta fue cancelada."}
              </div>
              {cita && (ic.estado === "CITADA" || ic.estado === "ATENDIDA") && (
                <button className="icd-btn icd-btn--ghost icd-btn--block" onClick={() => navigate(`/medico/citas/${cita._id}/consulta`)}>
                  Ir a la cita derivada →
                </button>
              )}
            </div>
          )}

          {/* Tarjeta lateral: detalles del paciente */}
          <div className="icd-card icd-card--side">
            <div className="icd-card-head">
              <div className="icd-card-icon icd-card-icon--slate"><User size={14} /></div>
              <h3 className="icd-card-title">Paciente</h3>
            </div>
            <div className="icd-pac-lateral">
              <span className="icd-pac-lateral-nombre">{pac?.nombres} {pac?.apellidos}</span>
              <span className="icd-pac-lateral-line">DNI {pac?.dni}</span>
              {pac?.fechaNacimiento && (
                <span className="icd-pac-lateral-line">
                  {calcEdad(pac.fechaNacimiento)} · Nac. {formatFechaCorta(pac.fechaNacimiento)}
                </span>
              )}
              <button
                className="icd-btn icd-btn--ghost icd-btn--block"
                onClick={() => navigate(`/pacientes/${pac?._id}`)}
                style={{ marginTop: 10 }}
              >
                Ver historia clínica →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
