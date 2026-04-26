import { useEffect, useState, useMemo } from "react";
import { CalendarDays, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/userAuth";
import { CitaApiService, type CitaHistorial } from "../../services/cita.service";
import ItemCita from "./ItemCita";
import DetalleCita from "./DetalleCita";
import "./HistorialCitas.css";

// Agregar "ASISTIO" a los tipos de filtro
type FiltroEstado = "TODOS" | "PENDIENTE" | "ASISTIO" | "ATENDIDA" | "CANCELADA" | "REPROGRAMADA" | "VENCIDA";

const FILTRO_LABELS: Record<FiltroEstado, string> = {
  TODOS:        "Todas",
  PENDIENTE:    "Pendientes",
  ASISTIO:      "Asistió",
  ATENDIDA:     "Atendidas",
  CANCELADA:    "Canceladas",
  REPROGRAMADA: "Reprogramadas",
  VENCIDA:      "Vencidas",
};

const POR_PAGINA = 5;

const HistorialCitasPaciente = () => {
  const { user } = useAuth();

  const [citas, setCitas]                       = useState<CitaHistorial[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState("");
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaHistorial | null>(null);
  const [busqueda, setBusqueda]                 = useState("");
  const [filtroEstado, setFiltroEstado]         = useState<FiltroEstado>("TODOS");
  const [pagina, setPagina]                     = useState(1);

  useEffect(() => {
    if (!user?.correo) return;
    setLoading(true);
    setError("");
    CitaApiService.obtenerHistorialPaciente(user.correo)
      .then(setCitas)
      .catch((e) => setError(e?.message ?? "Error al cargar historial"))
      .finally(() => setLoading(false));
  }, [user?.correo]);

  // Resetear página al cambiar filtros o búsqueda
  useEffect(() => { setPagina(1); }, [filtroEstado, busqueda]);

  const citasFiltradas = useMemo(() => {
    return citas
      .filter((c) => {
        if (filtroEstado === "TODOS") return true;
        // Normalizar el estado para comparar
        const estadoCita = c.estado?.toUpperCase()?.trim() ?? "";
        return estadoCita === filtroEstado;
      })
      .filter((c) => {
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase().trim();
        const fecha = new Date(c.fecha);
        const mes      = fecha.toLocaleDateString("es-PE", { month: "long",  timeZone: "UTC" }).toLowerCase();
        const mesCorto = fecha.toLocaleDateString("es-PE", { month: "short", timeZone: "UTC" }).toLowerCase();
        const anio     = fecha.getUTCFullYear().toString();
        return (
          c.medico.toLowerCase().includes(q) ||
          c.especialidad.toLowerCase().includes(q) ||
          mes.includes(q) ||
          mesCorto.includes(q) ||
          anio.includes(q)
        );
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [citas, filtroEstado, busqueda]);

  const totalPaginas  = Math.max(1, Math.ceil(citasFiltradas.length / POR_PAGINA));
  const citasPagina   = citasFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div className="hc-container">
      <div className="hc-header">
        <div className="hc-header-left">
          <div className="hc-header-icon">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="hc-title">Historial de Citas</h2>
          </div>
        </div>
      </div>

      <div className="hc-controls">
        <input
          type="text"
          className="hc-search"
          placeholder="Buscar por médico, especialidad, mes o año..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="hc-filtros">
          <Filter size={14} className="hc-filtro-icon" />
          {(Object.keys(FILTRO_LABELS) as FiltroEstado[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`hc-filtro-btn${filtroEstado === f ? " active" : ""}`}
              onClick={() => setFiltroEstado(f)}
            >
              {FILTRO_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="hc-list">
        {loading && (
          <div className="hc-state">
            <div className="spinner-small" />
            <p>Cargando historial...</p>
          </div>
        )}

        {!loading && error && (
          <div className="hc-state hc-state--error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && citasFiltradas.length === 0 && (
          <div className="hc-state">
            <CalendarDays size={36} style={{ opacity: 0.25 }} />
            <p>
              {busqueda || filtroEstado !== "TODOS"
                ? "No se encontraron citas con los filtros seleccionados."
                : "No tienes citas registradas aún."}
            </p>
          </div>
        )}

        {!loading && !error &&
          citasPagina.map((cita) => (
            <ItemCita
              key={cita._id}
              cita={cita}
              onClick={() => setCitaSeleccionada(cita)}
            />
          ))}
      </div>

      {/* Paginación */}
      {!loading && !error && totalPaginas > 1 && (
        <div className="hc-pagination">
          <button
            type="button"
            className="hc-page-btn"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="hc-page-info">
            Página {pagina} de {totalPaginas}
          </span>

          <button
            type="button"
            className="hc-page-btn"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {citaSeleccionada && (
        <DetalleCita
          cita={citaSeleccionada}
          onCerrar={() => setCitaSeleccionada(null)}
        />
      )}
    </div>
  );
};

export default HistorialCitasPaciente;