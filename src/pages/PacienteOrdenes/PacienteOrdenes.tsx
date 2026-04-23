import { useState, useEffect } from "react";
import { ExamenService, type OrdenExamen } from "../../services/examen.service";
import { PacienteApiService } from "../../services/paciente.service";
import { useAuth } from "../../hooks/userAuth";

import { ItemOrden } from "./ItemOrden";

const PacienteOrdenes = () => {
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState<OrdenExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filtro, setFiltro] = useState<"TODAS" | "PENDIENTES" | "FINALIZADAS">(
    "TODAS",
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

  const ordenesFiltradas = ordenes.filter((orden) => {
    if (filtro === "TODAS") return true;
    if (filtro === "FINALIZADAS") return orden.estado === "FINALIZADO";
    return (
      orden.estado === "PENDIENTE" ||
      orden.estado === "EN_PROCESO" ||
      orden.estado === "ASISTIDO"
    );
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
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
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          className={`btn ${filtro === "TODAS" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setFiltro("TODAS")}
        >
          Todas
        </button>
        <button
          className={`btn ${filtro === "PENDIENTES" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setFiltro("PENDIENTES")}
        >
          Pendiente
        </button>
        <button
          className={`btn ${filtro === "FINALIZADAS" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setFiltro("FINALIZADAS")}
        >
          Completada
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
      ) : ordenesFiltradas.length === 0 ? (
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
            No se encontraron órdenes clínicas registradas con este filtro.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {ordenesFiltradas.map((orden) => (
            <ItemOrden key={orden._id} orden={orden} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PacienteOrdenes;
