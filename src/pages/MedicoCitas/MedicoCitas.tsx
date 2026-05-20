import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico } from "../../services/medico.service";
import { Search, Calendar, User, Play } from "lucide-react";
import "../ListaCitas/ListaCitas.css";
import "./MedicoCitas.css";

const ESTADO_CONFIG: Record<string, { class: string; label: string }> = {
  PENDIENTE:    { class: "badge-info",         label: "Pendiente" },
  REPROGRAMADA: { class: "badge-reprogramada", label: "Reprogramada" },
  ATENDIDA:     { class: "badge-success",      label: "Atendida" },
  CANCELADA:    { class: "badge-danger",       label: "Cancelada" },
  ASISTIO:      { class: "badge-asistio",      label: "Asistió" },
  VENCIDA:      { class: "badge-vencida",      label: "Vencida" },
};

const normalize = (str: string) =>
  (str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const calcAge = (fechaNac?: string) => {
  if (!fechaNac) return "";
  const diff = Date.now() - new Date(fechaNac).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} a.`;
};

const ESTADOS_FILTER = ["TODOS", "PENDIENTE", "ATENDIDA", "CANCELADA", "REPROGRAMADA"];

const TIPO_CONFIG: Record<string, { label: string; cls: string }> = {
  NUEVA:        { label: "1ª Consulta", cls: "mc-tipo-nueva" },
  SEGUIMIENTO:  { label: "Seguimiento", cls: "mc-tipo-seguim" },
  CONSULTA:     { label: "Consulta",    cls: "mc-tipo-nueva" },
  LABORATORIO:  { label: "Laboratorio", cls: "mc-tipo-lab" },
  REMOTA:       { label: "Remota",      cls: "mc-tipo-nueva" },
  DOMICILIO:    { label: "Domicilio",   cls: "mc-tipo-nueva" },
};

export default function MedicoCitas() {
  const navigate = useNavigate();
  const [citas,        setCitas]       = useState<CitaMedico[]>([]);
  const [filtroEstado, setFiltro]      = useState("TODOS");
  const [busqueda,     setBusqueda]    = useState("");
  const [cargando,     setCargando]    = useState(true);

  useEffect(() => {
    MedicoApiService.obtenerMisCitas()
      .then(setCitas)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const filtradas = citas.filter(c => {
    const pasaEstado   = filtroEstado === "TODOS" || c.estado === filtroEstado;
    const term         = normalize(busqueda);
    const pasaBusqueda = !term ||
      normalize(`${c.pacienteId.nombres} ${c.pacienteId.apellidos}`).includes(term) ||
      normalize(c.pacienteId.dni).includes(term) ||
      (c.notas && normalize(c.notas).includes(term));
    return pasaEstado && pasaBusqueda;
  });

  return (
    <div className="lista-page">
      {/* Header */}
      <div className="lista-page-header">
        <div>
          <h1>Mis Citas</h1>
          <p className="lista-page-subtitle">
            {filtradas.length} resultado{filtradas.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mc-toolbar">
        <div className="lista-search-bar">
          <Search size={16} className="lista-search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o motivo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="lista-search-input"
          />
        </div>

        <div className="mc-filters">
          {ESTADOS_FILTER.map(e => (
            <button
              key={e}
              className={`mc-filter-btn${filtroEstado === e ? " mc-filter-btn--active" : ""}`}
              onClick={() => setFiltro(e)}
            >
              {e === "TODOS" ? "Todas" : ESTADO_CONFIG[e]?.label ?? e}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {cargando ? (
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
                  <th style={{ width: 90 }}>Hora</th>
                  <th style={{ width: 230 }}>Paciente</th>
                  <th style={{ width: 55 }}>Edad</th>
                  <th style={{ width: 120 }}>Fecha</th>
                  <th style={{ width: 100 }}>Tipo</th>
                  <th style={{ width: 115 }}>Estado</th>
                  <th style={{ width: 190 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length > 0 ? (
                  filtradas.map(c => {
                    const pac       = c.pacienteId;
                    const estadoInfo = ESTADO_CONFIG[c.estado] ?? { class: "badge-warning", label: c.estado };
                    const iniciales  = `${pac.nombres[0] ?? ""}${pac.apellidos[0] ?? ""}`.toUpperCase();
                    const edad       = calcAge(pac.fechaNacimiento);
                    const puedeConsultar = c.estado === "PENDIENTE" || c.estado === "ASISTIO";

                    return (
                      <tr key={c._id}>
                        {/* Hora */}
                        <td>
                          <span className="mc-hora-badge">{c.hora || "—"}</span>
                        </td>

                        {/* Paciente */}
                        <td>
                          <div className="td-person">
                            <div className="td-avatar">{iniciales}</div>
                            <div className="td-person-info">
                              <span className="td-person-name">
                                {pac.nombres} {pac.apellidos}
                              </span>
                              <span className="td-person-sub">{pac.dni}</span>
                            </div>
                          </div>
                        </td>

                        {/* Edad */}
                        <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                          {edad}
                        </td>

                        {/* Fecha */}
                        <td>
                          <span className="td-date">
                            <Calendar size={12} />
                            {new Date(c.fecha).toLocaleDateString("es-PE", { timeZone: "UTC" })}
                          </span>
                        </td>

                        {/* Tipo — muestra NUEVA/SEGUIMIENTO para consultas, tipo original para laboratorio */}
                        <td>
                          {(() => {
                            const key = c.subtipoCita ?? c.tipo?.toUpperCase() ?? "";
                            const t = TIPO_CONFIG[key] ?? { label: key || "-", cls: "mc-tipo-nueva" };
                            return key
                              ? <span className={`mc-tipo-badge ${t.cls}`}>{t.label}</span>
                              : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>-</span>;
                          })()}
                        </td>

                        {/* Estado */}
                        <td>
                          <span className={`modern-badge ${estadoInfo.class}`}>
                            <span className="modern-badge-dot" />
                            {estadoInfo.label}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => navigate(`/citas/${c._id}`)}
                              title="Ver perfil de cita"
                            >
                              Ver perfil
                            </button>
                            {puedeConsultar && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate(`/medico/citas/${c._id}/consulta`)}
                                title="Iniciar nota SOAP"
                              >
                                <Play size={12} /> Iniciar
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
                      <User size={28} className="td-empty-icon" />
                      <p>No hay citas que coincidan con los filtros.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
