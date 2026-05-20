import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, CheckCircle, XCircle,
  User, ChevronRight, AlertTriangle, Info, AlertCircle,
} from "lucide-react";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico, MedicoPerfil } from "../../services/medico.service";
import "./MedicoDashboard.css";

const formatHoy = () =>
  new Date().toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

export default function MedicoDashboard() {
  const navigate = useNavigate();
  const [perfil,    setPerfil]    = useState<MedicoPerfil | null>(null);
  const [citasHoy,  setCitasHoy]  = useState<CitaMedico[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      MedicoApiService.obtenerMiPerfil(),
      MedicoApiService.obtenerCitasHoy(),
    ])
      .then(([p, c]) => { setPerfil(p); setCitasHoy(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  const pendientes = citasHoy.filter(c => c.estado === "PENDIENTE");
  const atendidas  = citasHoy.filter(c => c.estado === "ATENDIDA");
  const canceladas = citasHoy.filter(c => c.estado === "CANCELADA");
  const total      = citasHoy.length;

  const stats = [
    { label: "Citas hoy",  value: total,             color: "info",    icon: <Calendar size={18} /> },
    { label: "Pendientes", value: pendientes.length,  color: "warning", icon: <Clock size={18} /> },
    { label: "Atendidas",  value: atendidas.length,   color: "success", icon: <CheckCircle size={18} /> },
    { label: "Canceladas", value: canceladas.length,  color: "danger",  icon: <XCircle size={18} /> },
  ];

  const proximas      = pendientes.slice(0, 6);
  const nombreDoctor  = perfil ? `${perfil.nombres} ${perfil.apellidos}` : "Doctor";
  const especialidad  = perfil?.especialidadId?.nombre ?? "Medicina General";
  const hora          = new Date().getHours();
  const saludo        = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  type AlertaTipo = "danger" | "warning" | "info";
  const alertas: { tipo: AlertaTipo; msg: string }[] = [
    ...(canceladas.length > 0
      ? [{ tipo: "danger" as AlertaTipo, msg: `${canceladas.length} cita${canceladas.length > 1 ? "s" : ""} cancelada${canceladas.length > 1 ? "s" : ""} hoy` }]
      : []),
    ...(pendientes.length > 0
      ? [{ tipo: "info" as AlertaTipo, msg: `${pendientes.length} paciente${pendientes.length > 1 ? "s" : ""} pendiente${pendientes.length > 1 ? "s" : ""} de atención` }]
      : []),
  ];

  return (
    <div className="medico-dash">
      {/* Header Section */}
      <div className="dash-header-section">
        <div className="dash-greeting">
          <h1 className="dash-greeting-title">👋 {saludo}, {nombreDoctor}</h1>
          <p className="dash-greeting-sub">{formatHoy()} · {especialidad}</p>
        </div>

        {perfil && (
          <div className="dash-profile-chip">
            <div className="dash-profile-avatar-small">{perfil.nombres[0]}{perfil.apellidos[0]}</div>
            <div className="dash-profile-chip-info">
              <div className="dash-profile-name">{perfil.nombres} {perfil.apellidos}</div>
              {perfil.cmp && <div className="dash-profile-cmp">CMP: {perfil.cmp}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="dash-stats">
        {stats.map(s => (
          <div key={s.label} className={`dash-stat-card dash-stat-card--${s.color}`}>
            <div className="dash-stat-icon">{s.icon}</div>
            <div className="dash-stat-body">
              <div className="dash-stat-value">{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid - Centered */}
      <div className="dash-content-grid">
        {/* Main Card - Citas Pendientes */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">📋 Citas Pendientes Hoy</span>
            <button className="dash-link" onClick={() => navigate("/medico/citas")}>
              Ver todas →
            </button>
          </div>

          {proximas.length === 0 ? (
            <div className="dash-empty">
              <User size={32} />
              <p>No hay citas pendientes para hoy</p>
              <button
                className="dash-link-secondary"
                onClick={() => navigate("/medico/citas")}
              >
                Ver mis citas
              </button>
            </div>
          ) : (
            <div className="dash-citas-list">
              {proximas.map(c => {
                const pac      = c.pacienteId;
                const iniciales = `${pac.nombres[0] ?? ""}${pac.apellidos[0] ?? ""}`.toUpperCase();
                return (
                  <div
                    key={c._id}
                    className="dash-cita-row"
                    onClick={() => navigate(`/medico/citas/${c._id}/consulta`)}
                  >
                    <div className="dash-cita-hora">{c.hora}</div>
                    <div className="dash-cita-avatar">{iniciales}</div>
                    <div className="dash-cita-info">
                      <div className="dash-cita-nombre-row">
                        <span className="dash-cita-nombre">
                          {pac.nombres} {pac.apellidos}
                        </span>
                        {c.tipo && (
                          <span className={`dash-tipo-badge ${c.tipo.toUpperCase() === "SEGUIMIENTO" ? "dash-tipo-seguim" : "dash-tipo-nueva"}`}>
                            {c.tipo.toUpperCase() === "SEGUIMIENTO" ? "Seguim." : "Nueva"}
                          </span>
                        )}
                      </div>
                      <div className="dash-cita-meta">
                        {c.notas && (
                          <span className="dash-cita-motivo">
                            {c.notas.substring(0, 65)}{c.notas.length > 65 ? "…" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={15} className="dash-cita-arrow" />
                  </div>
                );
              })}
            </div>
          )}

          {proximas.length > 0 && (
            <div className="dash-card-footer">
              <button
                className="dash-btn-primary"
                onClick={() => navigate(`/medico/citas/${proximas[0]._id}/consulta`)}
              >
                ▶ Iniciar siguiente consulta
              </button>
            </div>
          )}
        </div>

        {/* Alerts & Summary Cards */}
        <div className="dash-side-cards">
          {/* Alertas Clínicas */}
          <div className="dash-card dash-card-compact">
            <div className="dash-card-header">
              <span className="dash-card-title">⚠️ Alertas</span>
            </div>
            <div className="dash-alertas">
              {alertas.length === 0 ? (
                <p className="dash-alertas-empty">Sin alertas para hoy</p>
              ) : (
                alertas.map((a) => (
                  <div key={`${a.tipo}-${a.msg}`} className={`dash-alerta dash-alerta--${a.tipo}`}>
                    {a.tipo === "danger"  && <AlertCircle  size={15} />}
                    {a.tipo === "warning" && <AlertTriangle size={15} />}
                    {a.tipo === "info"    && <Info          size={15} />}
                    <span>{a.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Resumen del día */}
          <div className="dash-card dash-card-compact">
            <div className="dash-card-header">
              <span className="dash-card-title">📊 Resumen</span>
            </div>
            <div className="dash-resumen">
              {[
                { label: "Total citas",  value: total,             color: "var(--info)" },
                { label: "Pendientes",   value: pendientes.length,  color: "var(--warning)" },
                { label: "Atendidas",    value: atendidas.length,   color: "var(--success)" },
                { label: "Canceladas",   value: canceladas.length,  color: "var(--error)" },
              ].map(r => (
                <div key={r.label} className="dash-resumen-row">
                  <span className="dash-resumen-label">{r.label}</span>
                  <span className="dash-resumen-value" style={{ color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
