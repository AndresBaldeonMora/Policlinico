import { useEffect, useState, useCallback } from "react";
import {
  ScrollText, Search, ChevronLeft, ChevronRight, Filter, X, Clock,
} from "lucide-react";
import {
  AuditoriaApiService,
  type RegistroAuditoria,
  type PaginacionAuditoria,
} from "../../services/admin.service";
import "./VisorAuditoria.css";

// ── Traducciones ──────────────────────────────────────────────────────────────
const ACCION_LABEL: Record<string, string> = {
  // Citas
  crear_cita:           "Nueva cita",
  cancelar_cita:        "Cancelar cita",
  CAMBIO_ESTADO:        "Cambio de estado",
  cambio_estado:        "Cambio de estado",
  // Órdenes
  crear_orden:          "Crear orden",
  autorizar_orden:      "Autorizar orden",
  registrar_asistencia: "Registrar asistencia",
  anular_orden:         "Anular orden",
  // Usuarios
  crear_usuario:        "Crear usuario",
  CREAR:                "Crear",
  ACTUALIZAR:           "Actualizar",
  DESACTIVAR:           "Desactivar",
  ACTIVAR:              "Activar",
  RESETEAR_CLAVE:       "Restablecer contraseña",
  resetear_clave:       "Restablecer contraseña",
  LOGIN:                "Inicio de sesión",
  LOGOUT:               "Cierre de sesión",
};

const ENTIDAD_LABEL: Record<string, string> = {
  Cita:         "Cita médica",
  OrdenExamen:  "Orden de examen",
  Usuario:      "Usuario",
  Doctor:       "Médico",
  Paciente:     "Paciente",
  Especialidad: "Especialidad",
  Horario:      "Horario",
  Reclamacion:  "Reclamación",
  Interconsulta:"Interconsulta",
  AuditLog:     "Registro",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE:    "Pendiente",
  CONFIRMADA:   "Confirmada",
  CANCELADA:    "Cancelada",
  ASISTIO:      "Asistió",
  NO_ASISTIO:   "No asistió",
  EN_PROCESO:   "En proceso",
  ASISTIDO:     "Asistido",
  AUTORIZADO:   "Autorizado",
  COMPLETADO:   "Completado",
  ANULADO:      "Anulado",
};

const labelAccion = (a: string) => ACCION_LABEL[a] ?? a.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const labelEntidad = (e: string) => ENTIDAD_LABEL[e] ?? e;
const labelEstado = (e: string) => ESTADO_LABEL[e] ?? e.replace(/_/g, " ");

// Colorea la acción según su naturaleza (creación, modificación, baja).
const colorAccion = (accion: string): string => {
  const a = accion.toLowerCase();
  if (a.includes("crear") || a.includes("activar") || a.includes("autorizar") || a.includes("login")) return "av-tag--green";
  if (a.includes("cancelar") || a.includes("anular") || a.includes("desactivar") || a.includes("eliminar")) return "av-tag--red";
  if (a.includes("resetear") || a.includes("restablecer")) return "av-tag--amber";
  return "av-tag--blue";
};

const fmtFecha = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const LIMIT = 25;

const VisorAuditoria = () => {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [paginacion, setPaginacion] = useState<PaginacionAuditoria>({ page: 1, limit: LIMIT, total: 0, totalPaginas: 1 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [entidades, setEntidades] = useState<string[]>([]);
  const [filtroEntidad, setFiltroEntidad] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);

  // Cargar opciones de filtro una vez
  useEffect(() => {
    AuditoriaApiService.opciones().then((o) => setEntidades(o.entidades)).catch(() => {});
  }, []);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const { data, paginacion } = await AuditoriaApiService.listar({
        entidad: filtroEntidad || undefined,
        accion: busqueda || undefined,
        desde: filtroDesde || undefined,
        hasta: filtroHasta || undefined,
        page,
        limit: LIMIT,
      });
      setRegistros(data);
      setPaginacion(paginacion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la auditoría.");
    } finally {
      setCargando(false);
    }
  }, [filtroEntidad, busqueda, filtroDesde, filtroHasta, page]);

  useEffect(() => { cargar(); }, [cargar]);

  // Al cambiar un filtro, volver a la página 1
  const aplicarFiltro = (fn: () => void) => { fn(); setPage(1); };

  const limpiarFiltros = () => {
    setFiltroEntidad(""); setFiltroDesde(""); setFiltroHasta(""); setBusqueda(""); setPage(1);
  };

  const hayFiltros = filtroEntidad || filtroDesde || filtroHasta || busqueda;

  return (
    <div className="lista-page">
      {/* Header */}
      <div className="lista-page-header">
        <div>
          <h1>Auditoría del Sistema</h1>
          <p className="lista-page-subtitle">
            Registro de acciones: quién hizo qué y cuándo · {paginacion.total} eventos
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="av-filters">
        {/* Búsqueda */}
        <div className="av-filter-search">
          <Search size={15} className="av-filter-search-icon" />
          <input
            type="text"
            placeholder="Buscar por acción, entidad, usuario…"
            value={busqueda}
            onChange={(e) => aplicarFiltro(() => setBusqueda(e.target.value))}
            className="av-filter-input"
          />
        </div>

        {/* Separador visual */}
        <div className="av-filter-divider" />

        {/* Entidad */}
        <div className="av-filter-group">
          <span className="av-filter-label">Entidad</span>
          <select
            className="av-filter-select"
            value={filtroEntidad}
            onChange={(e) => aplicarFiltro(() => setFiltroEntidad(e.target.value))}
          >
            <option value="">Todas</option>
            {entidades.map((e) => <option key={e} value={e}>{labelEntidad(e)}</option>)}
          </select>
        </div>

        {/* Rango fechas */}
        <div className="av-filter-group">
          <span className="av-filter-label">Desde</span>
          <input type="date" className="av-filter-date" value={filtroDesde} max={filtroHasta || undefined}
            onChange={(e) => aplicarFiltro(() => setFiltroDesde(e.target.value))} />
        </div>
        <div className="av-filter-group">
          <span className="av-filter-label">Hasta</span>
          <input type="date" className="av-filter-date" value={filtroHasta} min={filtroDesde || undefined}
            onChange={(e) => aplicarFiltro(() => setFiltroHasta(e.target.value))} />
        </div>

        {hayFiltros && (
          <button className="av-filter-clear" onClick={limpiarFiltros}>
            <X size={13} /> Limpiar
          </button>
        )}
      </div>

      {error && <div className="ar-error">{error}</div>}

      {/* Tabla */}
      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando auditoría…</p>
        </div>
      ) : registros.length === 0 ? (
        <div className="ar-empty">
          {hayFiltros ? <Filter size={32} /> : <ScrollText size={32} />}
          <p>{hayFiltros ? "No hay eventos para estos filtros." : "Aún no hay eventos registrados."}</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table" style={{ tableLayout: "fixed", width: "100%" }}>
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "36%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Fecha / Hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <span className="av-fecha"><Clock size={13} /> {fmtFecha(r.timestamp)}</span>
                    </td>
                    <td>
                      <span className="av-usuario">
                        {r.usuarioNombre?.includes("Sistema") ? (
                          <>
                            <Clock size={13} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block', marginBottom: '2px' }} />
                            {r.usuarioNombre}
                          </>
                        ) : (
                          r.usuarioNombre || "—"
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={`av-tag ${colorAccion(r.accion)}`}>{labelAccion(r.accion)}</span>
                    </td>
                    <td><span className="av-entidad">{labelEntidad(r.entidad)}</span></td>
                    <td>
                      <div className="av-desc-cell">
                        {r.descripcion && (
                          <span className="av-desc">{r.descripcion}</span>
                        )}
                        {(r.estadoAnterior || r.estadoNuevo) && (
                          <span className="av-estados">
                            {r.estadoAnterior && <span className="av-estado-old">{labelEstado(r.estadoAnterior)}</span>}
                            {r.estadoAnterior && r.estadoNuevo && <span className="av-arrow">→</span>}
                            {r.estadoNuevo && <span className="av-estado-new">{labelEstado(r.estadoNuevo)}</span>}
                          </span>
                        )}
                        {!r.descripcion && !r.estadoAnterior && !r.estadoNuevo && (
                          <span className="av-desc av-desc--muted">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      {!cargando && paginacion.totalPaginas > 1 && (
        <div className="av-pagination">
          <button
            className="av-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <span className="av-page-info">
            Página {paginacion.page} de {paginacion.totalPaginas}
          </span>
          <button
            className="av-page-btn"
            onClick={() => setPage((p) => Math.min(paginacion.totalPaginas, p + 1))}
            disabled={page >= paginacion.totalPaginas}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VisorAuditoria;
