import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText, Search, X, Clock, User, Phone, Mail
} from "lucide-react";
import { ReclamacionApiService, type Reclamacion } from "../../services/reclamacion.service";
import "./GestionReclamaciones.css";

const fmtFecha = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const normalizeString = (str: string): string =>
  (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const GestionReclamaciones = () => {
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | "QUEJA" | "RECLAMO">("TODOS");
  const [seleccionada, setSeleccionada] = useState<Reclamacion | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await ReclamacionApiService.listar();
      setReclamaciones(data);
    } catch (err: any) {
      setError(err?.message || "Error al cargar el libro de reclamaciones.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Filtrado local
  const reclamacionesFiltradas = useMemo(() => {
    return reclamaciones.filter((r) => {
      const pac = typeof r.pacienteId === "object" ? r.pacienteId : null;
      
      const pacienteNombre = pac ? normalizeString(`${pac.nombres || ""} ${pac.apellidos || ""}`) : "";
      const pacienteDni = pac && pac.dni ? normalizeString(pac.dni) : "";
      const codigo = normalizeString(r.codigo || "");
      const descripcion = normalizeString(r.descripcion || "");
      
      const query = normalizeString(busqueda);

      const matchesSearch =
        pacienteNombre.includes(query) ||
        pacienteDni.includes(query) ||
        codigo.includes(query) ||
        descripcion.includes(query);

      const matchesTipo = filtroTipo === "TODOS" || r.tipo === filtroTipo;

      return matchesSearch && matchesTipo;
    });
  }, [reclamaciones, busqueda, filtroTipo]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("TODOS");
  };

  const hayFiltros = busqueda || filtroTipo !== "TODOS";

  return (
    <div className="lista-page">
      {/* Header */}
      <div className="lista-page-header">
        <div>
          <h1>Libro de Reclamaciones</h1>
          <p className="lista-page-subtitle">
            Visualización y seguimiento de quejas y reclamos · {reclamacionesFiltradas.length} registros
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="av-filters">
        <div className="lista-search-bar av-search">
          <Search size={18} className="lista-search-icon" />
          <input
            type="text"
            placeholder="Buscar por código, DNI o nombre del paciente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="lista-search-input"
          />
        </div>

        <select
          className="av-select"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as any)}
        >
          <option value="TODOS">Todos los tipos</option>
          <option value="RECLAMO">Reclamos</option>
          <option value="QUEJA">Quejas</option>
        </select>

        {hayFiltros && (
          <button className="av-clear-btn" onClick={limpiarFiltros} title="Limpiar filtros">
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {error && <div className="ar-error">{error}</div>}

      {/* Tabla */}
      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando reclamaciones…</p>
        </div>
      ) : reclamacionesFiltradas.length === 0 ? (
        <div className="ar-empty">
          <FileText size={32} />
          <p>{hayFiltros ? "No se encontraron registros para los filtros aplicados." : "Aún no hay quejas o reclamos registrados."}</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Código</th>
                  <th style={{ width: 150 }}>Fecha / Hora</th>
                  <th style={{ width: 220 }}>Paciente</th>
                  <th style={{ width: 110 }}>Tipo</th>
                  <th>Descripción corta</th>
                  <th style={{ width: 90, textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {reclamacionesFiltradas.map((r) => {
                  const pac = typeof r.pacienteId === "object" ? r.pacienteId : null;
                  return (
                    <tr key={r._id}>
                      <td><span className="td-mono" style={{ fontWeight: 600 }}>{r.codigo}</span></td>
                      <td>
                        <span className="av-fecha"><Clock size={13} /> {fmtFecha(r.createdAt)}</span>
                      </td>
                      <td>
                        {pac ? (
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{pac.nombres} {pac.apellidos}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>DNI: {pac.dni}</span>
                          </div>
                        ) : (
                          <span className="td-muted">Desconocido</span>
                        )}
                      </td>
                      <td>
                        <span className={`rec-tag ${r.tipo === "QUEJA" ? "rec-tag--queja" : "rec-tag--reclamo"}`}>
                          {r.tipo}
                        </span>
                      </td>
                      <td>
                        <span className="rec-desc-preview">{r.descripcion}</span>
                      </td>
                      <td className="td-center">
                        <button
                          className="btn-action"
                          onClick={() => setSeleccionada(r)}
                          title="Ver detalle completo"
                        >
                          <FileText size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {seleccionada && (
        <div className="rec-modal-overlay" onClick={() => setSeleccionada(null)}>
          <div className="rec-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rec-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={20} className="rec-modal-icon" />
                <h2>Detalle de Reclamación: {seleccionada.codigo}</h2>
              </div>
              <button className="rec-modal-close" onClick={() => setSeleccionada(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="rec-modal-body">
              {/* Info General Card */}
              <div className="rec-modal-meta-card">
                <div className="rec-modal-meta-item">
                  <span className="rec-modal-meta-label"><Clock size={13} /> Fecha y Hora:</span>
                  <span className="rec-modal-meta-value">{fmtFecha(seleccionada.createdAt)}</span>
                </div>
                <div className="rec-modal-meta-item">
                  <span className="rec-modal-meta-label">Tipo:</span>
                  <span className={`rec-tag ${seleccionada.tipo === "QUEJA" ? "rec-tag--queja" : "rec-tag--reclamo"}`}>
                    {seleccionada.tipo}
                  </span>
                </div>
              </div>

              {/* Paciente Card */}
              {typeof seleccionada.pacienteId === "object" && (
                <div className="rec-modal-paciente-card">
                  <h3><User size={14} /> Información del Paciente</h3>
                  <div className="rec-modal-paciente-nombre">
                    {seleccionada.pacienteId.nombres} {seleccionada.pacienteId.apellidos}
                  </div>
                  <div className="rec-modal-paciente-info-grid">
                    <div>
                      <strong>DNI:</strong> {seleccionada.pacienteId.dni}
                    </div>
                    {seleccionada.pacienteId.telefono && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Phone size={12} /> <span>{seleccionada.pacienteId.telefono}</span>
                      </div>
                    )}
                    {seleccionada.pacienteId.correo && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", gridColumn: "span 2" }}>
                        <Mail size={12} /> <span>{seleccionada.pacienteId.correo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Descripción */}
              <div className="rec-modal-paciente-card">
                <h3><FileText size={14} /> Detalle del Hecho / Declaración</h3>
                <div className="rec-modal-desc-text">
                  {seleccionada.descripcion}
                </div>
              </div>
            </div>

            <div className="rec-modal-footer">
              <button className="btn btn-secondary" onClick={() => setSeleccionada(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionReclamaciones;
