import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Stethoscope, Users, BookOpen, ArrowRight,
  AlertTriangle, Info, Megaphone, Trash2,
  CheckCircle2, MessageSquare, ArrowLeftRight, Plus,
  Send, ShieldAlert,
} from "lucide-react";
import { AvisoService, type Aviso, type TipoAviso, type DashboardResumen } from "../../services/aviso.service";
import { toastExito, toastError } from "../../utils/toast";
import "./AdminDashboard.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatFecha = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const TIPO_AVISO_CONFIG: Record<TipoAviso, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  INFO:    { label: "Información", color: "#3b82f6", bg: "rgba(59,130,246,0.08)",  icon: Info         },
  ALERTA:  { label: "Alerta",      color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  icon: AlertTriangle },
  URGENTE: { label: "Urgente",     color: "#ef4444", bg: "rgba(239,68,68,0.08)",   icon: ShieldAlert  },
};

const ESTADO_RECLAMACION: Record<string, { label: string; color: string }> = {
  PENDIENTE:   { label: "Pendiente",   color: "#ef4444" },
  EN_REVISION: { label: "En revisión", color: "#f59e0b" },
  RESUELTO:    { label: "Resuelto",    color: "#10b981" },
};

// ─── Componente principal ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();

  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [avisos, setAvisos]   = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);

  // Form nuevo aviso
  const [form, setForm]         = useState({ titulo: "", mensaje: "", tipo: "INFO" as TipoAviso });
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const [res, avs] = await Promise.all([AvisoService.resumen(), AvisoService.listar()]);
      setResumen(res);
      setAvisos(avs);
    } catch {
      toastError("No se pudo cargar el panel de administración.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrearAviso = async () => {
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      Swal.fire({ icon: "warning", title: "Campos requeridos", text: "Escribe un título y un mensaje.", confirmButtonColor: "var(--primary)" });
      return;
    }
    setGuardando(true);
    try {
      const nuevo = await AvisoService.crear(form);
      setAvisos(prev => [nuevo, ...prev]);
      setForm({ titulo: "", mensaje: "", tipo: "INFO" });
      setMostrarForm(false);
      toastExito("Aviso publicado.");
    } catch {
      toastError("No se pudo publicar el aviso.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarAviso = async (id: string) => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Eliminar aviso?", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#ef4444",
      confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    try {
      await AvisoService.eliminar(id);
      setAvisos(prev => prev.filter(a => a._id !== id));
      toastExito("Aviso eliminado.");
    } catch {
      toastError("No se pudo eliminar el aviso.");
    }
  };

  const stats = resumen?.stats;

  const kpiCards = [
    { label: "Doctores",         value: stats?.totalDoctores,       icon: Stethoscope,    path: "/admin/doctores",       color: "#6366f1", bg: "rgba(99,102,241,0.08)"   },
    { label: "Pacientes",        value: stats?.totalPacientes,      icon: Users,          path: "/admin/pacientes",      color: "#f59e0b", bg: "rgba(245,158,11,0.08)"   },
    { label: "Especialidades",   value: stats?.totalEspecialidades, icon: BookOpen,       path: "/admin/especialidades", color: "var(--primary)", bg: "rgba(5,150,105,0.08)" },
    { label: "Reclamaciones",    value: stats?.reclamacionesPendientes, icon: MessageSquare, path: "/admin/reclamaciones", color: stats?.reclamacionesPendientes ? "#ef4444" : "#10b981", bg: stats?.reclamacionesPendientes ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)" },
    { label: "Interconsultas",   value: stats?.interconsultasPendientes, icon: ArrowLeftRight, path: "/interconsultas", color: stats?.interconsultasPendientes ? "#f59e0b" : "#10b981", bg: stats?.interconsultasPendientes ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)" },
  ];

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <div className="dashboard-top">
        <div className="dashboard-heading">
          <h1 className="dashboard-title">Panel de Administración</h1>
          <p className="dashboard-subtitle">Centro de control y comunicaciones del sistema</p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dashboard-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        {kpiCards.map(({ label, value, icon: Icon, path, color, bg }) => (
          <div
            key={label} className="ad-card"
            style={{ "--card-color": color, "--card-bg": bg } as React.CSSProperties}
            onClick={() => navigate(path)}
          >
            <div className="ad-card-icon"><Icon size={20} /></div>
            <div className="ad-card-info">
              <span className="stat-label">{label}</span>
              <span className="stat-value">
                {cargando ? <span className="stat-skeleton" /> : (value ?? 0)}
              </span>
            </div>
            <ArrowRight size={15} className="ad-card-arrow" />
          </div>
        ))}
      </div>

      {/* ── Layout dos columnas ── */}
      <div className="adm-two-col">

        {/* ── Columna izquierda: Alertas + Reclamaciones ── */}
        <div className="adm-col">

          {/* Alertas del sistema */}
          <div className="ar-section">
            <div className="ar-section-header">
              <div className="ar-section-title">
                <AlertTriangle size={18} />
                <h2>Alertas del Sistema</h2>
              </div>
            </div>
            {cargando ? (
              <div className="lista-loading"><div className="lista-loading-spinner" /></div>
            ) : (
              <div className="adm-alertas-list">
                {resumen?.alertas.map((a, i) => (
                  <div key={i} className={`adm-alerta adm-alerta--${a.tipo}`}>
                    {a.tipo === "error"   && <ShieldAlert size={16} />}
                    {a.tipo === "warning" && <AlertTriangle size={16} />}
                    {a.tipo === "info"    && <CheckCircle2 size={16} />}
                    <span>{a.mensaje}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reclamaciones recientes de pacientes */}
          <div className="ar-section">
            <div className="ar-section-header">
              <div className="ar-section-title">
                <MessageSquare size={18} />
                <h2>Reclamaciones de Pacientes</h2>
              </div>
              <button className="btn-page-action" style={{ fontSize: 12 }} onClick={() => navigate("/admin/reclamaciones")}>
                Ver todas <ArrowRight size={13} />
              </button>
            </div>

            {cargando ? (
              <div className="lista-loading"><div className="lista-loading-spinner" /></div>
            ) : !resumen?.reclamacionesRecientes.length ? (
              <div className="ar-empty">
                <CheckCircle2 size={28} style={{ color: "#10b981" }} />
                <p>Sin reclamaciones pendientes.</p>
              </div>
            ) : (
              <div className="adm-reclamaciones-list">
                {resumen.reclamacionesRecientes.map(r => {
                  const est = ESTADO_RECLAMACION[r.estado] ?? { label: r.estado, color: "#64748b" };
                  const pac = r.pacienteId;
                  return (
                    <div
                      key={r._id} className="adm-reclam-item"
                      onClick={() => navigate("/admin/reclamaciones")}
                    >
                      <div className="adm-reclam-top">
                        <span className="adm-reclam-codigo">{r.codigo}</span>
                        <span className="adm-reclam-tipo">{r.tipo}</span>
                        <span className="adm-reclam-estado" style={{ color: est.color }}>{est.label}</span>
                      </div>
                      {pac && (
                        <div className="adm-reclam-pac">{pac.nombres} {pac.apellidos}</div>
                      )}
                      <div className="adm-reclam-desc">{r.descripcion.slice(0, 100)}{r.descripcion.length > 100 ? "…" : ""}</div>
                      <div className="adm-reclam-fecha">{formatFecha(r.createdAt)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Columna derecha: Tablón de avisos ── */}
        <div className="adm-col">
          <div className="ar-section" style={{ flex: 1 }}>
            <div className="ar-section-header">
              <div className="ar-section-title">
                <Megaphone size={18} />
                <h2>Tablón de Avisos</h2>
              </div>
              <button
                className="btn-page-action"
                style={{ fontSize: 12 }}
                onClick={() => setMostrarForm(v => !v)}
              >
                <Plus size={14} /> Nuevo aviso
              </button>
            </div>

            {/* Form nuevo aviso */}
            {mostrarForm && (
              <div className="adm-aviso-form">
                <input
                  className="adm-aviso-input"
                  placeholder="Título del aviso"
                  value={form.titulo}
                  onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                />
                <textarea
                  className="adm-aviso-textarea"
                  placeholder="Escribe el mensaje o aviso para el personal del sistema…"
                  rows={3}
                  value={form.mensaje}
                  onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))}
                />
                <div className="adm-aviso-form-footer">
                  <select
                    className="adm-aviso-select"
                    value={form.tipo}
                    onChange={e => setForm(p => ({ ...p, tipo: e.target.value as TipoAviso }))}
                  >
                    <option value="INFO">Información</option>
                    <option value="ALERTA">Alerta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="adm-aviso-cancel" onClick={() => setMostrarForm(false)}>Cancelar</button>
                    <button className="btn-page-action" style={{ fontSize: 12 }} onClick={handleCrearAviso} disabled={guardando}>
                      <Send size={13} /> {guardando ? "Publicando…" : "Publicar"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de avisos */}
            {cargando ? (
              <div className="lista-loading"><div className="lista-loading-spinner" /></div>
            ) : avisos.length === 0 ? (
              <div className="ar-empty">
                <Megaphone size={28} />
                <p>No hay avisos activos. Crea el primero.</p>
              </div>
            ) : (
              <div className="adm-avisos-list">
                {avisos.map(a => {
                  const cfg = TIPO_AVISO_CONFIG[a.tipo];
                  const Icon = cfg.icon;
                  return (
                    <div key={a._id} className="adm-aviso-item" style={{ "--av-color": cfg.color, "--av-bg": cfg.bg } as React.CSSProperties}>
                      <div className="adm-aviso-item-header">
                        <span className="adm-aviso-badge" style={{ background: cfg.bg, color: cfg.color }}>
                          <Icon size={12} /> {cfg.label}
                        </span>
                        <span className="adm-aviso-fecha">{formatFecha(a.creadoEn)}</span>
                        <button className="adm-aviso-del" onClick={() => handleEliminarAviso(a._id)} title="Eliminar aviso">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="adm-aviso-titulo">{a.titulo}</div>
                      <div className="adm-aviso-msg">{a.mensaje}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
