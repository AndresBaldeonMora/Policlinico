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

// Colorea la acción según su naturaleza (creación, modificación, baja).
const colorAccion = (accion: string): string => {
  const a = accion.toUpperCase();
  if (a.startsWith("CREAR") || a.startsWith("ACTIVAR")) return "av-tag--green";
  if (a.startsWith("DESACTIVAR") || a.startsWith("ELIMINAR") || a.startsWith("CANCELAR")) return "av-tag--red";
  if (a.startsWith("RESETEAR")) return "av-tag--amber";
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
        <div className="lista-search-bar av-search">
          <Search size={18} className="lista-search-icon" />
          <input
            type="text"
            placeholder="Buscar por acción (ej: CREAR, DESACTIVAR)…"
            value={busqueda}
            onChange={(e) => aplicarFiltro(() => setBusqueda(e.target.value))}
            className="lista-search-input"
          />
        </div>

        <select
          className="av-select"
          value={filtroEntidad}
          onChange={(e) => aplicarFiltro(() => setFiltroEntidad(e.target.value))}
        >
          <option value="">Todas las entidades</option>
          {entidades.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        <div className="av-date-group">
          <label>Desde</label>
          <input type="date" className="av-date" value={filtroDesde} max={filtroHasta || undefined}
            onChange={(e) => aplicarFiltro(() => setFiltroDesde(e.target.value))} />
        </div>
        <div className="av-date-group">
          <label>Hasta</label>
          <input type="date" className="av-date" value={filtroHasta} min={filtroDesde || undefined}
            onChange={(e) => aplicarFiltro(() => setFiltroHasta(e.target.value))} />
        </div>

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
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>Fecha / Hora</th>
                  <th style={{ width: 180 }}>Usuario</th>
                  <th style={{ width: 170 }}>Acción</th>
                  <th style={{ width: 120 }}>Entidad</th>
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
                      <span className={`av-tag ${colorAccion(r.accion)}`}>{r.accion}</span>
                    </td>
                    <td><span className="av-entidad">{r.entidad}</span></td>
                    <td>
                      <span className="av-desc">{r.descripcion || "—"}</span>
                      {(r.estadoAnterior || r.estadoNuevo) && (
                        <span className="av-estados">
                          {r.estadoAnterior && <span className="av-estado-old">{r.estadoAnterior}</span>}
                          {r.estadoAnterior && r.estadoNuevo && <span className="av-arrow">→</span>}
                          {r.estadoNuevo && <span className="av-estado-new">{r.estadoNuevo}</span>}
                        </span>
                      )}
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
