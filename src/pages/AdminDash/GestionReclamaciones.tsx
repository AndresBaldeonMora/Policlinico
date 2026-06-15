import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText, Search, X, Clock, User, Phone, Mail, ShieldCheck, CheckCircle, Loader2
} from "lucide-react";
import { ReclamacionApiService, type Reclamacion } from "../../services/reclamacion.service";
import { toastExito, toastError } from "../../utils/toast";
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

const EstadoBadge = ({ estado }: { estado: string }) => {
  switch (estado) {
    case "PENDIENTE":
      return <span className="rec-estado rec-estado--pendiente">Pendiente</span>;
    case "EN_REVISION":
      return <span className="rec-estado rec-estado--revision">En Revisión</span>;
    case "RESUELTO":
      return <span className="rec-estado rec-estado--resuelto">Resuelto</span>;
    default:
      return <span className="rec-estado">{estado}</span>;
  }
};

const GestionReclamaciones = () => {
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | "QUEJA" | "RECLAMO">("TODOS");
  const [seleccionada, setSeleccionada] = useState<Reclamacion | null>(null);

  // Gestión
  const [gestionando, setGestionando] = useState<Reclamacion | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<"EN_REVISION" | "RESUELTO">("EN_REVISION");
  const [respuestaAdmin, setRespuestaAdmin] = useState("");
  const [enviando, setEnviando] = useState(false);

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

  const handleGestionar = async () => {
    if (!gestionando) return;
    if (nuevoEstado === "RESUELTO" && !respuestaAdmin.trim()) {
      toastError("Para marcar como RESUELTO, debes proporcionar una respuesta al paciente.");
      return;
    }

    setEnviando(true);
    try {
      const actualizada = await ReclamacionApiService.gestionar(gestionando._id, {
        estado: nuevoEstado,
        respuestaAdmin: respuestaAdmin.trim() || undefined,
      });
      // Actualizar la lista localmente
      setReclamaciones(prev => prev.map(r => r._id === actualizada._id ? actualizada : r));
      toastExito(`Reclamación actualizada a ${nuevoEstado === "RESUELTO" ? "RESUELTO" : "EN REVISIÓN"}`);
      setGestionando(null);
      setRespuestaAdmin("");
    } catch (err: any) {
      toastError(err?.message || "Error al gestionar la reclamación");
    } finally {
      setEnviando(false);
    }
  };

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
                  <th style={{ width: 100 }}>Estado</th>
                  <th>Descripción corta</th>
                  <th style={{ width: 110, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reclamacionesFiltradas.map((r) => {
                  const pac = typeof r.pacienteId === "object" ? r.pacienteId : null;
                  return (
                    <tr key={r._id}>
                      <td><span className="td-mono" style={{ fontWeight: 600 }}>{r.codigo}</span></td>
                      <td><span className="av-fecha"><Clock size={13} /> {fmtFecha(r.createdAt)}</span></td>
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
                      <td><EstadoBadge estado={r.estado || "PENDIENTE"} /></td>
                      <td><span className="rec-desc-preview">{r.descripcion}</span></td>
                      <td className="td-center">
                        <div className="ge-actions" style={{ gap: "0.5rem", justifyContent: "center" }}>
                          <button
                            className="btn-action"
                            onClick={() => setSeleccionada(r)}
                            title="Ver detalle completo"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            className="btn-action btn-action--primary"
                            onClick={() => {
                              setGestionando(r);
                              setNuevoEstado(r.estado === "PENDIENTE" ? "EN_REVISION" : "EN_REVISION");
                              setRespuestaAdmin(r.respuestaAdmin || "");
                            }}
                            title="Gestionar"
                            disabled={r.estado === "RESUELTO"}
                          >
                            <ShieldCheck size={15} />
                          </button>
                        </div>
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
                <div className="rec-modal-meta-item">
                  <span className="rec-modal-meta-label">Estado:</span>
                  <EstadoBadge estado={seleccionada.estado || "PENDIENTE"} />
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
                    <div><strong>DNI:</strong> {seleccionada.pacienteId.dni}</div>
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
                <div className="rec-modal-desc-text">{seleccionada.descripcion}</div>
              </div>

              {/* Respuesta del administrador si existe */}
              {seleccionada.respuestaAdmin && (
                <div className="rec-modal-paciente-card" style={{ borderLeftColor: "var(--primary)" }}>
                  <h3><ShieldCheck size={14} /> Respuesta del Administrador</h3>
                  <div className="rec-modal-desc-text" style={{ background: "var(--bg-muted)", color: "var(--text-primary)" }}>
                    {seleccionada.respuestaAdmin}
                    {seleccionada.fechaResolucion && (
                      <div style={{ fontSize: "0.7rem", marginTop: "0.5rem", color: "var(--text-muted)" }}>
                        Resuelto el {new Date(seleccionada.fechaResolucion).toLocaleDateString("es-PE")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rec-modal-footer">
              <button className="btn btn-secondary" onClick={() => setSeleccionada(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión */}
      {gestionando && (
        <div className="rec-modal-overlay" onClick={() => !enviando && setGestionando(null)}>
          <div className="rec-modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="rec-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldCheck size={20} className="rec-modal-icon" />
                <h2>Gestionar Reclamación</h2>
              </div>
              <button className="rec-modal-close" onClick={() => !enviando && setGestionando(null)} disabled={enviando}>
                <X size={18} />
              </button>
            </div>

            <div className="rec-modal-body" style={{ gap: "1rem" }}>
              <div className="rec-modal-meta-card" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                <div className="rec-modal-meta-item">
                  <span className="rec-modal-meta-label">Código:</span>
                  <span className="rec-modal-meta-value" style={{ fontWeight: 600 }}>{gestionando.codigo}</span>
                </div>
                <div className="rec-modal-meta-item">
                  <span className="rec-modal-meta-label">Estado actual:</span>
                  <EstadoBadge estado={gestionando.estado || "PENDIENTE"} />
                </div>
              </div>

              <div className="micuenta-perfil__field">
                <label className="micuenta-perfil__field-label">Nuevo Estado</label>
                <select
                  className="micuenta-perfil__select"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value as "EN_REVISION" | "RESUELTO")}
                  disabled={enviando}
                >
                  <option value="EN_REVISION">En Revisión</option>
                  <option value="RESUELTO">Resuelto</option>
                </select>
              </div>

              <div className="micuenta-perfil__field">
                <label className="micuenta-perfil__field-label">
                  Respuesta del Administrador
                  {nuevoEstado === "RESUELTO" && <span style={{ color: "var(--error)" }}> *</span>}
                </label>
                <textarea
                  className="micuenta-perfil__input"
                  rows={4}
                  placeholder="Explique la resolución o acciones tomadas..."
                  value={respuestaAdmin}
                  onChange={(e) => setRespuestaAdmin(e.target.value)}
                  disabled={enviando}
                />
                {nuevoEstado === "RESUELTO" && !respuestaAdmin.trim() && (
                  <p className="micuenta-seg__field-error">La respuesta es obligatoria para marcar como RESUELTO.</p>
                )}
              </div>
            </div>

            <div className="rec-modal-footer" style={{ justifyContent: "space-between" }}>
              <button className="pm-btn pm-btn--ghost" onClick={() => setGestionando(null)} disabled={enviando}>
                Cancelar
              </button>
              <button
                className="pm-btn pm-btn--primary"
                onClick={handleGestionar}
                disabled={enviando || (nuevoEstado === "RESUELTO" && !respuestaAdmin.trim())}
              >
                {enviando ? <Loader2 size={14} className="micuenta-perfil__spinner" /> : <CheckCircle size={14} />}
                <span style={{ marginLeft: "0.3rem" }}>Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionReclamaciones;