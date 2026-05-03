import { useState, useEffect, useMemo } from "react";
import { ExamenService, type OrdenExamen } from "../../services/examen.service";
import { PacienteApiService } from "../../services/paciente.service";
import { useAuth } from "../../hooks/userAuth";
import {
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { ItemOrden } from "./ItemOrden";
import DetalleOrden from "../../components/DetalleOrden/DetalleOrden";

const ITEMS_PER_PAGE = 10;

const PacienteOrdenes = () => {
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState<OrdenExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"ORDENES" | "RESULTADOS">(
    "ORDENES",
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Detalle
  const [selectedOrdenId, setSelectedOrdenId] = useState<string | null>(null);

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

        if (!pacienteMatch || !pacienteMatch.id) {
          setErrorMsg(
            "Su cuenta no está vinculada a un registro de paciente válido o le falta un ID. Contacte a recepción.",
          );
          setLoading(false);
          return;
        }

        const data = await ExamenService.listarOrdenesPorPaciente(
          pacienteMatch.id,
        );
        setOrdenes(data);
      } catch (error) {
        setErrorMsg("Error al conectar con la base de datos de órdenes.");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [user?.correo]);

  // Reset page and search on tab change
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
  }, [activeTab]);

  const ordenesFiltradas = useMemo(() => {
    return ordenes
      .filter((orden) => {
        // Tab Filter
        if (activeTab === "ORDENES" && orden.estado === "FINALIZADO") return false;
        if (activeTab === "RESULTADOS" && orden.estado !== "FINALIZADO") return false;

        // Search Filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const codigo = orden.codigoOrden?.toLowerCase() || "";
          const tipo = orden.tipoOrden?.toLowerCase() || "";
          const especialidad = orden.especialidadId?.nombre?.toLowerCase() || "";
          if (!codigo.includes(query) && !tipo.includes(query) && !especialidad.includes(query)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(
          activeTab === "RESULTADOS" ? (a.fechaResultados || a.fecha) : a.fecha
        ).getTime();
        const dateB = new Date(
          activeTab === "RESULTADOS" ? (b.fechaResultados || b.fecha) : b.fecha
        ).getTime();
        return dateB - dateA;
      });
  }, [ordenes, activeTab, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(ordenesFiltradas.length / ITEMS_PER_PAGE);
  const paginatedOrdenes = ordenesFiltradas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", color: "var(--text-primary)" }}>
          📄 Mis Órdenes Clínicas
        </h1>

        {/* Search */}
        <div style={{ position: "relative", width: "380px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Busca por código, examen o especialidad..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "0.5rem 0.5rem 0.5rem 2.2rem",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => setActiveTab("ORDENES")}
          style={{
            padding: "0.75rem 1.5rem",
            borderBottom:
              activeTab === "ORDENES"
                ? "2px solid var(--primary)"
                : "2px solid transparent",
            color:
              activeTab === "ORDENES"
                ? "var(--primary)"
                : "var(--text-secondary)",
            fontWeight: activeTab === "ORDENES" ? "bold" : "normal",
            background: "none",
            border: "none",
            borderBottomWidth: "2px",
            borderBottomStyle: "solid",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Órdenes en Proceso
        </button>
        <button
          onClick={() => setActiveTab("RESULTADOS")}
          style={{
            padding: "0.75rem 1.5rem",
            borderBottom:
              activeTab === "RESULTADOS"
                ? "2px solid var(--primary)"
                : "2px solid transparent",
            color:
              activeTab === "RESULTADOS"
                ? "var(--primary)"
                : "var(--text-secondary)",
            fontWeight: activeTab === "RESULTADOS" ? "bold" : "normal",
            background: "none",
            border: "none",
            borderBottomWidth: "2px",
            borderBottomStyle: "solid",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Resultados
        </button>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "4rem",
          }}
        >
          <div
            className="lista-loading-spinner"
            style={{ marginBottom: "1rem" }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
            Cargando información médica...
          </p>
        </div>
      ) : errorMsg ? (
        <div className="error-message" style={{ margin: 0 }}>
          {errorMsg}
        </div>
      ) : paginatedOrdenes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            backgroundColor: "var(--bg-hover)",
            borderRadius: "8px",
            border: "1px dashed var(--border)",
          }}
        >
          <p
            style={{
              color: "var(--text-muted)",
              margin: 0,
              fontSize: "1.1rem",
            }}
          >
            No se encontraron{" "}
            {activeTab === "ORDENES" ? "órdenes" : "resultados"} con los filtros
            actuales.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            minHeight: "400px",
          }}
        >
          {paginatedOrdenes.map((orden) => (
            <ItemOrden
              key={orden._id}
              orden={orden}
              onVerDetalle={(id) => setSelectedOrdenId(id)}
              isResultadoView={activeTab === "RESULTADOS"}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", padding: "0.5rem" }}
          >
            <ChevronLeft size={18} /> Anterior
          </button>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", padding: "0.5rem" }}
          >
            Siguiente <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Modal Detalles */}
      <DetalleOrden
        ordenId={selectedOrdenId || ""}
        isOpen={!!selectedOrdenId}
        onClose={() => setSelectedOrdenId(null)}
      />
    </div>
  );
};

export default PacienteOrdenes;
