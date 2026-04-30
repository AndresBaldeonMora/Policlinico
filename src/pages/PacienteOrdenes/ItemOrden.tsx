import { Download } from "lucide-react";
import type { OrdenExamen } from "../../services/examen.service";

export const getEstadoConfig = (estado: string) => {
  if (estado === "FINALIZADO") return { label: "Completada", class: "badge-success" };
  if (estado === "CANCELADA") return { label: "Cancelada", class: "badge-danger" };
  return { label: "Pendiente", class: "badge-warning" };
};

export const ItemOrden = ({ orden }: { orden: OrdenExamen }) => {
  const config = getEstadoConfig(orden.estado);

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "8px",
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "var(--bg-card)",
      boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
    }}>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Orden #{orden.codigoOrden || orden._id.substring(0, 6)}
          <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)", borderRadius: "4px", fontWeight: "normal" }}>
            {orden.tipoOrden || "General"}
          </span>
        </h4>
        <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <span><strong>Fecha:</strong> {new Date(orden.fecha).toLocaleDateString("es-PE")}</span>
          <span><strong>Especialidad:</strong> {orden.especialidadId?.nombre || "No especificada"}</span>
          {orden.estado !== "FINALIZADO" && orden.fechaCitaLab && (
            <span><strong>Cita Lab:</strong> {new Date(orden.fechaCitaLab).toLocaleDateString("es-PE")}</span>
          )}
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
        <span className={`badge ${config.class}`} style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}>
          {config.label}
        </span>
        
        {orden.estado === "FINALIZADO" && orden.archivoResultadoUrl && (
          <a
            href={orden.archivoResultadoUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ 
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              textDecoration: "none",
              fontSize: "0.9rem",
              marginTop: "0.5rem"
            }}
            title="Ver Resultados"
          >
            <Download size={16} /> Descargar Resultados
          </a>
        )}
      </div>
    </div>
  );
};
