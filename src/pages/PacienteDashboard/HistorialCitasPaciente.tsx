import { useEffect, useState, useMemo } from "react";
import { CalendarDays, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/userAuth";
import { CitaApiService, type CitaHistorial } from "../../services/cita.service";
import ItemCita from "./ItemCita";
import DetalleCita from "./DetalleCita";
import "./HistorialCitas.css";

type Tab = "PROXIMAS" | "PASADAS";

const ESTADOS_PROXIMAS = new Set(["PENDIENTE"]);

const POR_PAGINA = 5;

const HistorialCitasPaciente = () => {
  const { user } = useAuth();

  const [citas, setCitas]                       = useState<CitaHistorial[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState("");
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaHistorial | null>(null);
  const [busqueda, setBusqueda]                 = useState("");
  const [activeTab, setActiveTab]               = useState<Tab>("PROXIMAS");
  const [pagina, setPagina]                     = useState(1);

  useEffect(() => {
    if (!user?.correo) return;
    setLoading(true);
    setError("");
    CitaApiService.obtenerHistorialPaciente(user.correo)
      .then(setCitas)
      .catch((e) => setError(e?.message ?? "Error al cargar citas"))
      .finally(() => setLoading(false));
  }, [user?.correo]);

  useEffect(() => {
    setPagina(1);
    setBusqueda("");
  }, [activeTab]);

  useEffect(() => { setPagina(1); }, [busqueda]);

  const citasFiltradas = useMemo(() => {
    const filtered = citas
      .filter((c) => {
        const estado = c.estado?.toUpperCase()?.trim() ?? "";
        return activeTab === "PROXIMAS"
          ? ESTADOS_PROXIMAS.has(estado)
          : !ESTADOS_PROXIMAS.has(estado);
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
      });

    // Próximas: ascendente (la más cercana primero); Pasadas: descendente (la más reciente primero)
    filtered.sort((a, b) => {
      const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      return activeTab === "PROXIMAS" ? diff : -diff;
    });

    return filtered;
  }, [citas, activeTab, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(citasFiltradas.length / POR_PAGINA));
  const citasPagina  = citasFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const tabStyle = (tab: Tab) => ({
    padding: "0.75rem 1.5rem",
    borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
    color: activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
    fontWeight: activeTab === tab ? "bold" : "normal" as const,
    background: "none",
    border: "none",
    borderBottomWidth: "2px",
    borderBottomStyle: "solid" as const,
    cursor: "pointer",
    fontSize: "1rem",
  });

  return (
    <div className="hc-container">
      <div className="hc-header">
        <div className="hc-header-left">
          <div className="hc-header-icon">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="hc-title">Mis Citas</h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        <button onClick={() => setActiveTab("PROXIMAS")} style={tabStyle("PROXIMAS")}>
          Próximas
        </button>
        <button onClick={() => setActiveTab("PASADAS")} style={tabStyle("PASADAS")}>
          Anteriores
        </button>
      </div>

      {/* Búsqueda */}
      <div className="hc-controls" style={{ marginBottom: "1rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="hc-search"
            placeholder="Buscar por médico, especialidad, mes o año..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ paddingLeft: "2rem" }}
          />
        </div>
      </div>

      <div className="hc-list">
        {loading && (
          <div className="hc-state">
            <div className="spinner-small" />
            <p>Cargando citas...</p>
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
              {busqueda
                ? "No se encontraron citas con esa búsqueda."
                : activeTab === "PROXIMAS"
                  ? "No tienes citas próximas registradas."
                  : "No tienes citas anteriores registradas."}
            </p>
          </div>
        )}

        {!loading && !error &&
          citasPagina.map((cita) => (
            <ItemCita
              key={cita._id}
              cita={cita}
              onClick={() => setCitaSeleccionada(cita)}
              hideEstado={activeTab === "PROXIMAS"}
            />
          ))}
      </div>

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
