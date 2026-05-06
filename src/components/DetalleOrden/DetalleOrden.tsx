import React from "react";
import { ExamenService } from "../../services/examen.service";
import type { OrdenDetalle } from "../../types/orden.types";

interface DetalleOrdenProps {
  ordenId: string;
  isOpen: boolean;
  onClose: () => void;
}


const TIPO_LABEL: Record<string, string> = {
  LABORATORIO: "Laboratorio",
  IMAGEN: "Imagen",
  MIXTA: "Mixta",
};

const fmt = (d: Date) => d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const fmtHora = (d: Date) => d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC" });

const pill = (text: string, color: string, bg: string) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, color, background: bg }}>
    {text}
  </span>
);

export const DetalleOrden: React.FC<DetalleOrdenProps> = ({ ordenId, isOpen, onClose }) => {
  const [orden, setOrden] = React.useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]   = React.useState<string | null>(null);
  const [showPdf, setShowPdf] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || !ordenId) return;
    setLoading(true);
    setError(null);
    setOrden(null);
    ExamenService.obtenerOrdenDetalle(ordenId)
      .then(setOrden)
      .catch((err) => setError(err.message || "Error al cargar la orden"))
      .finally(() => setLoading(false));
  }, [isOpen, ordenId]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;


  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "var(--bg-card)", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", width: "100%", maxWidth: "680px", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {loading ? "Cargando..." : orden ? `Orden #${orden.codigoOrden || orden.id.substring(0, 6)}` : "Detalle de Orden"}
            </h2>
            {orden && pill(TIPO_LABEL[orden.tipoOrden] ?? orden.tipoOrden, "#1e40af", "#dbeafe")}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {loading && <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0" }}>Cargando detalles...</p>}
          {error   && <p style={{ color: "var(--error, #dc2626)", textAlign: "center" }}>{error}</p>}

          {!loading && !error && orden && (
            <>
              {/* Info rápida */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem" }}>
                <InfoItem label="Especialidad" value={orden.especialidad} />
                <InfoItem label="Médico"       value={orden.medicoNombre} />

                {/* Laboratorio: día + horario fijo de atención */}
                {orden.tipoOrden !== "IMAGEN" && orden.fechaCitaLab && (
                  <>
                    <InfoItem label="Día de atención" value={fmt(new Date(orden.fechaCitaLab))} />
                    <InfoItem label="Horario"          value="7:00 a.m. – 11:00 a.m." />
                  </>
                )}

                {/* Imagen: fecha y hora exacta de la cita */}
                {orden.tipoOrden === "IMAGEN" && orden.citaImagenFecha && (
                  <>
                    <InfoItem label="Día de cita" value={fmt(new Date(orden.citaImagenFecha))} />
                    <InfoItem label="Hora"         value={fmtHora(new Date(orden.citaImagenFecha))} />
                  </>
                )}
                {orden.tipoOrden === "IMAGEN" && !orden.citaImagenFecha && orden.fechaCitaLab && (
                  <InfoItem label="Día de cita" value={fmt(new Date(orden.fechaCitaLab))} />
                )}

                {orden.fechaResultado && (
                  <InfoItem label="Resultado el" value={fmt(new Date(orden.fechaResultado))} />
                )}
              </div>

              {/* Notas */}
              {orden.notas && (
                <div style={{ backgroundColor: "var(--bg-hover)", borderRadius: "8px", padding: "0.75rem 1rem", border: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Notas: </span>{orden.notas}
                  </p>
                </div>
              )}

              {/* Exámenes */}
              {(orden.examenes?.length ?? 0) > 0 && (
                <div>
                  <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    Exámenes solicitados ({orden.examenes.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {orden.examenes.map((ex, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.9rem", backgroundColor: "var(--bg-hover)", borderRadius: "8px", border: "1px solid var(--border)", gap: "1rem" }}>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 500 }}>{ex.nombre}</span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", flexShrink: 0 }}>{ex.tipo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observaciones generales */}
              {orden.recomendaciones && (
                <div style={{ backgroundColor: "var(--bg-hover)", borderRadius: "8px", padding: "0.75rem 1rem", border: "1px dashed var(--border)" }}>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Observaciones: </span>{orden.recomendaciones}
                  </p>
                </div>
              )}

              {/* Resultado PDF */}
              {orden.estado === "FINALIZADO" && orden.archivoResultadoUrl && (
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => setShowPdf(true)} className="btn btn-primary" style={{ fontSize: "0.9rem" }}>
                    Ver resultado en PDF
                  </button>
                  <a href={orden.archivoResultadoUrl} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration: "none", fontSize: "0.9rem" }}>
                    Descargar PDF
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "0.9rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-primary">Cerrar</button>
        </div>
      </div>

      {/* Visor PDF */}
      {showPdf && orden?.archivoResultadoUrl && (
        <div onClick={() => setShowPdf(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "1rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "var(--bg-card)", width: "100%", maxWidth: "900px", height: "80vh", display: "flex", flexDirection: "column", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-primary)" }}>Resultado PDF</h3>
              <button onClick={() => setShowPdf(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem" }}>✕</button>
            </div>
            <iframe src={orden.archivoResultadoUrl} style={{ width: "100%", flex: 1, border: "none" }} title="Resultado PDF" />
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div style={{ minWidth: "140px" }}>
    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>{label}</span>
    <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)" }}>{value}</strong>
  </div>
);

export default DetalleOrden;
