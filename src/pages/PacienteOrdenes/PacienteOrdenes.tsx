import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ClipboardList, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { ExamenService, type OrdenExamen } from "../../services/examen.service";
import { PacienteApiService } from "../../services/paciente.service";
import { useAuth } from "../../hooks/userAuth";
import { ItemOrden } from "./ItemOrden";
import DetalleOrden from "../../components/DetalleOrden/DetalleOrden";
import "../../pages/PacienteDashboard/HistorialCitas.css";

type Tab = "ORDENES" | "RESULTADOS";

const POR_PAGINA = 10;

const tabStyle = (active: boolean) => ({
  padding: "0.75rem 1.5rem",
  borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
  color: active ? "var(--primary)" : "var(--text-secondary)",
  fontWeight: active ? "bold" : ("normal" as const),
  background: "none",
  border: "none",
  borderBottomWidth: "2px",
  borderBottomStyle: "solid" as const,
  cursor: "pointer",
  fontSize: "1rem",
});

const PacienteOrdenes = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [ordenes, setOrdenes]             = useState<OrdenExamen[]>([]);
  const [loading, setLoading]             = useState(true);
  const [errorMsg, setErrorMsg]           = useState("");
  const [activeTab, setActiveTab]         = useState<Tab>("ORDENES");
  const [searchQuery, setSearchQuery]     = useState("");
  const [currentPage, setCurrentPage]     = useState(1);
  const [selectedOrdenId, setSelectedOrdenId] = useState<string | null>(
    (location.state as any)?.ordenId ?? null
  );

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        if (!user?.correo) {
          setErrorMsg("Usuario sin correo especificado");
          setLoading(false);
          return;
        }
        const pacientes = await PacienteApiService.listar();
        const pacienteMatch = pacientes.find(
          (p) => p.correo?.toLowerCase() === user.correo.toLowerCase(),
        );
        if (!pacienteMatch?.id) {
          setErrorMsg("Su cuenta no está vinculada a un registro de paciente válido. Contacte a recepción.");
          setLoading(false);
          return;
        }
        const data = await ExamenService.listarOrdenesPorPaciente(pacienteMatch.id);
        setOrdenes(data);
      } catch {
        setErrorMsg("Error al conectar con la base de datos de órdenes.");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [user?.correo]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
  }, [activeTab]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const ordenesFiltradas = useMemo(() => {
    return ordenes
      .filter((orden) => {
        const ESTADOS_PROXIMAS = new Set(["PENDIENTE", "EN_PROCESO", "ASISTIDO"]);
        if (activeTab === "ORDENES" && !ESTADOS_PROXIMAS.has(orden.estado)) return false;
        if (activeTab === "RESULTADOS" && ESTADOS_PROXIMAS.has(orden.estado)) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const codigo      = orden.codigoOrden?.toLowerCase() || "";
          const tipo        = orden.tipoOrden?.toLowerCase() || "";
          const especialidad = orden.especialidadId?.nombre?.toLowerCase() || "";
          if (!codigo.includes(q) && !tipo.includes(q) && !especialidad.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(activeTab === "RESULTADOS" ? (a.fechaResultados || a.fecha) : a.fecha).getTime();
        const dateB = new Date(activeTab === "RESULTADOS" ? (b.fechaResultados || b.fecha) : b.fecha).getTime();
        return dateB - dateA;
      });
  }, [ordenes, activeTab, searchQuery]);

  const totalPaginas   = Math.max(1, Math.ceil(ordenesFiltradas.length / POR_PAGINA));
  const ordenesPagina  = ordenesFiltradas.slice((currentPage - 1) * POR_PAGINA, currentPage * POR_PAGINA);

  return (
    <div className="hc-container">
      {/* Header */}
      <div className="hc-header">
        <div className="hc-header-left">
          <div className="hc-header-icon">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="hc-title">Mis Órdenes Clínicas</h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setActiveTab("ORDENES")} style={tabStyle(activeTab === "ORDENES")}>
          Próximas
        </button>
        <button onClick={() => setActiveTab("RESULTADOS")} style={tabStyle(activeTab === "RESULTADOS")}>
          Anteriores
        </button>
      </div>

      {/* Búsqueda */}
      <div className="hc-controls">
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", opacity: 0.55, pointerEvents: "none" }} />
          <input
            type="text"
            className="hc-search"
            placeholder="Buscar por código, examen o especialidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="hc-list">
        {loading && (
          <div className="hc-state">
            <div className="spinner-small" />
            <p>Cargando información médica...</p>
          </div>
        )}

        {!loading && errorMsg && (
          <div className="hc-state hc-state--error">
            <p>{errorMsg}</p>
          </div>
        )}

        {!loading && !errorMsg && ordenesFiltradas.length === 0 && (
          <div className="hc-state">
            <ClipboardList size={36} style={{ opacity: 0.25 }} />
            <p>
              {searchQuery
                ? "No se encontraron órdenes con esa búsqueda."
                : activeTab === "ORDENES"
                  ? "No tienes órdenes próximas registradas."
                  : "No tienes resultados anteriores registrados."}
            </p>
          </div>
        )}

        {!loading && !errorMsg &&
          ordenesPagina.map((orden) => (
            <ItemOrden
              key={orden._id}
              orden={orden}
              onVerDetalle={(id) => setSelectedOrdenId(id)}
              isResultadoView={activeTab === "RESULTADOS"}
            />
          ))}
      </div>

      {/* Paginación */}
      {!loading && !errorMsg && totalPaginas > 1 && (
        <div className="hc-pagination">
          <button
            type="button"
            className="hc-page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="hc-page-info">
            Página {currentPage} de {totalPaginas}
          </span>
          <button
            type="button"
            className="hc-page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPaginas, p + 1))}
            disabled={currentPage === totalPaginas}
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <DetalleOrden
        ordenId={selectedOrdenId || ""}
        isOpen={!!selectedOrdenId}
        onClose={() => setSelectedOrdenId(null)}
      />
    </div>
  );
};

export default PacienteOrdenes;
