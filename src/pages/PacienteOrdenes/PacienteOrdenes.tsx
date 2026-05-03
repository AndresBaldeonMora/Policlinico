import { useState, useEffect, useMemo } from "react";
import { ExamenService, type OrdenExamen } from "../../services/examen.service";
import { PacienteApiService } from "../../services/paciente.service";
import { useAuth } from "../../hooks/userAuth";
import {
  Search,
  Calendar as CalendarIcon,
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
  const [filtroEstado, setFiltroEstado] = useState<string>("TODAS");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

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

  // Reset page, search and filters on tab change
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
    setFiltroEstado("TODAS");
    setDateFilter("ALL");
    setCustomDateFrom("");
    setCustomDateTo("");
  }, [activeTab]);

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((orden) => {
      // 1. Tab Filter
      if (activeTab === "ORDENES" && orden.estado === "FINALIZADO")
        return false;
      if (activeTab === "RESULTADOS" && orden.estado !== "FINALIZADO")
        return false;

      // 2. Status Filter
      if (
        activeTab === "ORDENES" &&
        filtroEstado !== "TODAS" &&
        orden.estado !== filtroEstado
      ) {
        return false;
      }

      // 3. Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const codigo = orden.codigoOrden?.toLowerCase() || "";
        const tipo = orden.tipoOrden?.toLowerCase() || "";
        const especialidad = orden.especialidadId?.nombre?.toLowerCase() || "";

        if (
          !codigo.includes(query) &&
          !tipo.includes(query) &&
          !especialidad.includes(query)
        ) {
          return false;
        }
      }

      // 4. Date Filter
      if (dateFilter !== "ALL") {
        const ordenDate = new Date(
          activeTab === "RESULTADOS"
            ? orden.fechaResultados || orden.fecha
            : orden.fecha,
        );
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - ordenDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateFilter === "7DAYS" && diffDays > 7) return false;
        if (dateFilter === "1MONTH" && diffDays > 30) return false;
        if (dateFilter === "1YEAR" && diffDays > 365) return false;
        if (dateFilter === "CUSTOM") {
          if (customDateFrom) {
            const from = new Date(customDateFrom + "T00:00:00");
            if (ordenDate < from) return false;
          }
          if (customDateTo) {
            const to = new Date(customDateTo + "T23:59:59");
            if (ordenDate > to) return false;
          }
        }
      }

      return true;
    });
  }, [
    ordenes,
    activeTab,
    filtroEstado,
    searchQuery,
    dateFilter,
    customDateFrom,
    customDateTo,
  ]);

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

      {/* Filters Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {activeTab === "ORDENES" && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[
              { value: "TODAS", label: "Todas" },
              { value: "PENDIENTE", label: "Pendiente" },
              { value: "EN_PROCESO", label: "En Proceso" },
              { value: "ASISTIDO", label: "Asistida" },
            ].map(({ value, label }) => (
              <button
                key={value}
                className={`btn ${filtroEstado === value ? "btn-primary" : "btn-secondary"}`}
                onClick={() => {
                  setFiltroEstado(value);
                  setCurrentPage(1);
                }}
                style={{ padding: "0.4rem 1rem", fontSize: "0.9rem" }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {activeTab === "RESULTADOS" && <div />} {/* Spacer */}
        {/* Date Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CalendarIcon size={18} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Por fecha:
          </span>
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "0.4rem",
              borderRadius: "4px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
            }}
          >
            <option value="ALL">Cualquier momento</option>
            <option value="7DAYS">Últimos 7 días</option>
            <option value="1MONTH">Último mes</option>
            <option value="1YEAR">Último año</option>
            <option value="CUSTOM">Personalizado</option>
          </select>

          {dateFilter === "CUSTOM" && (
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <input
                type="date"
                value={customDateFrom}
                onKeyDown={(e) => e.preventDefault()}
                onChange={(e) => {
                  setCustomDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.3rem",
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                  fontSize: "0.85rem",
                }}
              />
              <span>-</span>
              <input
                type="date"
                value={customDateTo}
                onKeyDown={(e) => e.preventDefault()}
                onChange={(e) => {
                  setCustomDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.3rem",
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                  fontSize: "0.85rem",
                }}
              />
            </div>
          )}
        </div>
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
