import React from "react";
import { ExamenService } from "../../services/examen.service";
import type { OrdenDetalle } from "../../types/orden.types";

interface DetalleOrdenProps {
  ordenId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DetalleOrden: React.FC<DetalleOrdenProps> = ({ ordenId, isOpen, onClose }) => {
  const [orden, setOrden] = React.useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = React.useState<boolean>(false);

  const getBadgeClass = (estado: string) => {
    if (estado === "FINALIZADO") return "badge-success";
    if (estado === "CANCELADA" || estado === "VENCIDA") return "badge-danger";
    if (estado === "EN_PROCESO") return "badge-info";
    if (estado === "ASISTIDO") return "badge-asistio";
    return "badge-warning";
  };

  React.useEffect(() => {
    if (isOpen && ordenId) {
      setLoading(true);
      setError(null);
      ExamenService.obtenerOrdenDetalle(ordenId)
        .then((data) => setOrden(data))
        .catch((err) => setError(err.message || "Error al cargar la orden"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, ordenId]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "var(--bg-card)",
        borderRadius: "8px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        width: "100%",
        maxWidth: "800px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-hover)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>
              {loading ? "Cargando..." : orden ? `Orden #${orden.codigoOrden || orden.id.substring(0, 6)}` : "Detalle de Orden"}
            </h2>
            {orden && (
              <>
                <span className="badge badge-info" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}>
                  {orden.tipoOrden}
                </span>
                <span className={`badge ${getBadgeClass(orden.estado)}`} style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}>
                  {orden.estado.replace("_", " ")}
                </span>
              </>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          {loading && <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Cargando detalles...</div>}
          {error && <div className="error-message">{error}</div>}
          
          {!loading && !error && orden && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Información General */}
              <section style={{ backgroundColor: "var(--bg-hover)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Información General</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", fontSize: "0.9rem" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Cita generada:</span>
                    <strong style={{ color: "var(--text-primary)" }}>{new Date(orden.fechaCreacion).toLocaleDateString("es-PE")}</strong>
                  </div>
                  {orden.fechaCitaLab && (
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Día de atención:</span>
                      <strong style={{ color: "var(--text-primary)" }}>{new Date(orden.fechaCitaLab).toLocaleDateString("es-PE")}</strong>
                    </div>
                  )}
                  {orden.fechaAsistencia && (
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Fecha de asistencia:</span>
                      <strong style={{ color: "var(--text-primary)" }}>{new Date(orden.fechaAsistencia).toLocaleDateString("es-PE")}</strong>
                    </div>
                  )}
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Especialidad:</span>
                    <strong style={{ color: "var(--text-primary)" }}>{orden.especialidad}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Médico solicitante:</span>
                    <strong style={{ color: "var(--text-primary)" }}>{orden.medicoNombre}</strong>
                  </div>
                  {orden.notas && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Descripción / Notas:</span>
                      <p style={{ color: "var(--text-primary)", margin: 0 }}>{orden.notas}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Exámenes Solicitados */}
              <section>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Exámenes Solicitados ({orden.examenes?.length || 0})</h3>
                <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead style={{ backgroundColor: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                      <tr>
                        <th style={{ padding: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>NOMBRE</th>
                        <th style={{ padding: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>TIPO</th>
                        <th style={{ padding: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>ESTADO</th>
                        <th style={{ padding: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>OBSERVACIÓN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orden.examenes?.map((examen, index) => (
                        <tr key={index} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "0.75rem", fontSize: "0.9rem", color: "var(--text-primary)" }}>{examen.nombre}</td>
                          <td style={{ padding: "0.75rem", fontSize: "0.9rem", color: "var(--text-primary)" }}>{examen.tipo}</td>
                          <td style={{ padding: "0.75rem", fontSize: "0.9rem", color: "var(--text-primary)" }}>{examen.estado}</td>
                          <td style={{ padding: "0.75rem", fontSize: "0.9rem", color: "var(--text-primary)" }}>{examen.observacion || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Historial de Estados */}
              <section style={{ backgroundColor: "var(--bg-hover)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Historial de Estados</h3>
                {orden.historialEstados && orden.historialEstados.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {orden.historialEstados.map((historial, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", backgroundColor: "var(--bg-card)", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "0.85rem" }}>
                        <div>
                          <strong style={{ color: "var(--text-primary)" }}>{historial.estadoAnterior.replace("_", " ")} &rarr; {historial.estadoNuevo.replace("_", " ")}</strong>
                          <div style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>Por: {historial.responsable}</div>
                        </div>
                        <div style={{ color: "var(--text-muted)" }}>
                          {new Date(historial.fecha).toLocaleString("es-PE")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>No hay registro de historial de estados.</p>
                )}
              </section>

              {/* Resultados */}
              {orden.estado === "FINALIZADO" && orden.archivoResultadoUrl && (
                <section style={{ backgroundColor: "var(--bg-hover)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Resultados Disponibles</h3>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button onClick={() => setShowPdfModal(true)} className="btn btn-primary">
                      Ver Resultados en PDF
                    </button>
                    <a href={orden.archivoResultadoUrl} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                      Descargar PDF
                    </a>
                  </div>
                </section>
              )}

              {/* Recomendaciones */}
              {orden.recomendaciones && (
                <section style={{ backgroundColor: "var(--bg-hover)", padding: "1rem", borderRadius: "6px", border: "1px dashed var(--border)" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Recomendaciones y Observaciones</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>{orden.recomendaciones}</p>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid var(--border)",
          backgroundColor: "var(--bg-hover)",
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem"
        }}>
          {orden?.estado === "FINALIZADO" && (
            <button className="btn btn-secondary">
              Descargar Comprobante de Orden
            </button>
          )}
          <button onClick={onClose} className="btn btn-primary">
            Cerrar
          </button>
        </div>
      </div>

      {/* PDF Modal Adicional */}
      {showPdfModal && orden?.archivoResultadoUrl && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "1rem"
        }}>
          <div style={{ backgroundColor: "var(--bg-card)", width: "100%", maxWidth: "900px", height: "80vh", display: "flex", flexDirection: "column", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "var(--text-primary)" }}>Visor de Resultados PDF</h3>
              <button onClick={() => setShowPdfModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem" }}>✕</button>
            </div>
            <iframe src={orden.archivoResultadoUrl} style={{ width: "100%", flex: 1, border: "none" }} title="Visor PDF" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleOrden;
