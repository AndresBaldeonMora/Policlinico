import { useEffect, useRef } from "react";
import {
  X, Calendar, Clock, Stethoscope, FileText,
  Pill, FlaskConical, StickyNote, User, Info, AlertTriangle,
} from "lucide-react";
import "./DetalleCita.css";

export interface RecetaMedicamento {
  nombre: string;
  dosis: string;
  cantidad: string;
  duracion: string;
  indicaciones?: string;
}

export interface ExamenSolicitado {
  nombre: string;
  tipo: string;
  estado?: string;
}

export interface DetalleCitaData {
  _id: string;
  fecha: string;
  hora: string;
  estado: string;
  medico: string;
  especialidad: string;
  diagnostico?: string;
  notasMedico?: string;
  recetas?: RecetaMedicamento[];
  examenes?: ExamenSolicitado[];
}

interface Props {
  cita: DetalleCitaData;
  onCerrar: () => void;
  hideEstado?: boolean;
}

// Actualizar configuración de estados incluyendo ASISTIO
const ESTADO_CONFIG: Record<string, { label: string; clase: string }> = {
  PENDIENTE:    { label: "Programada",   clase: "dc-badge--pending" },
  ASISTIO:      { label: "Asistió",      clase: "dc-badge--warning" },
  ATENDIDA:     { label: "Atendida",     clase: "dc-badge--done" },
  CANCELADA:    { label: "Cancelada",    clase: "dc-badge--cancel" },
  REPROGRAMADA: { label: "Reprogramada", clase: "dc-badge--reprogramada" },
  VENCIDA:      { label: "Vencida",      clase: "dc-badge--vencida" },
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    weekday: "long", 
    day: "2-digit", 
    month: "long", 
    year: "numeric", 
    timeZone: "UTC",
  });

interface PlanSOAP {
  otrasIndicaciones?: string;
  medidas?: string[];
  proximaCita?: string;
  criteriosAlarma?: string;
}

const parseIndicaciones = (raw?: string): PlanSOAP | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.soap?.P ?? null;
  } catch {
    return null;
  }
};

const IndicacionesMedico = ({ raw }: { raw?: string }) => {
  const plan = parseIndicaciones(raw);

  const otrasIndicaciones = plan?.otrasIndicaciones?.trim();
  const medidas = (plan?.medidas ?? []).filter(Boolean);
  const proximaCita = plan?.proximaCita?.trim();
  const criteriosAlarma = plan?.criteriosAlarma?.trim();

  const hayContenido = otrasIndicaciones || medidas.length > 0 || proximaCita || criteriosAlarma;

  return (
    <div className="dc-section">
      <div className="dc-section-title">
        <StickyNote size={15} />
        <span>Indicaciones del médico</span>
      </div>
      {!hayContenido ? (
        <p className="dc-muted">Sin indicaciones registradas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {otrasIndicaciones && (
            <div>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-primary)" }}>{otrasIndicaciones}</p>
            </div>
          )}
          {medidas.length > 0 && (
            <div>
              <p style={{ margin: "0 0 0.35rem 0", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Medidas:</p>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                {medidas.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
          )}
          {proximaCita && (
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <span style={{ fontWeight: 600 }}>Próxima cita:</span> {proximaCita}
              </p>
            </div>
          )}
          {criteriosAlarma && (
            <div style={{ backgroundColor: "var(--bg-hover)", borderRadius: "6px", padding: "0.5rem 0.75rem", border: "1px solid var(--border)" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <span style={{ fontWeight: 600 }}>Criterios de alarma:</span> {criteriosAlarma}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const calcularHorasRestantes = (fecha: string, hora: string): number => {
  try {
    const fechaStr = fecha.split("T")[0];
    const [y, m, d] = fechaStr.split("-").map(Number);
    const [h, min] = (hora && hora !== "—" ? hora : "00:00").split(":").map(Number);
    const citaDate = new Date(y, m - 1, d, h, min);
    return (citaDate.getTime() - Date.now()) / (1000 * 60 * 60);
  } catch { return 0; }
};

const DetalleCita = ({ cita, onCerrar, hideEstado = false }: Props) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => { 
      if (e.key === "Escape") onCerrar(); 
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCerrar]);

  // Normalizar el estado (por si viene en minúsculas o con espacios)
  const estadoNormalizado = cita.estado?.toUpperCase()?.trim() ?? "PENDIENTE";
  const badge = ESTADO_CONFIG[estadoNormalizado] ?? ESTADO_CONFIG.PENDIENTE;
  const tieneRecetas = (cita.recetas?.length ?? 0) > 0;
  const tieneExamenes = (cita.examenes?.length ?? 0) > 0;

  const esCitaProxima = hideEstado && (estadoNormalizado === "PENDIENTE" || estadoNormalizado === "REPROGRAMADA");
  const horasRestantes = esCitaProxima ? calcularHorasRestantes(cita.fecha, cita.hora) : 0;
  const puedeReprogramar = horasRestantes > 24;

  return (
    <div className="dc-overlay" onClick={onCerrar} role="presentation">
      <div
        className="dc-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dc-title"
      >
        {/* Header */}
        <div className="dc-header">
          <div className="dc-header-left">
            <div className="dc-header-icon">
              <Stethoscope size={18} />
            </div>
            <div>
              <h3 id="dc-title">Detalle de Cita Médica</h3>
              <p className="dc-header-sub">{cita.especialidad}</p>
            </div>
          </div>
          <button 
            ref={closeRef} 
            className="dc-close" 
            onClick={onCerrar} 
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="dc-body">
          {/* Información de la cita */}
          <div className="dc-section">
            <div className="dc-info-row">
              <div className="dc-info-item">
                <Calendar size={14} />
                <span>{formatFecha(cita.fecha)}</span>
              </div>
              <div className="dc-info-item">
                <Clock size={14} />
                <span>{cita.hora}</span>
              </div>
              <div className="dc-info-item">
                <User size={14} />
                <span>{cita.medico}</span>
              </div>
              {!hideEstado && (
                <span className={`dc-badge ${badge.clase}`}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>

          {/* Banner de reprogramación */}
          {esCitaProxima && (
            <div className={`dc-reprog-notice ${puedeReprogramar ? "dc-reprog-notice--ok" : "dc-reprog-notice--warn"}`}>
              {puedeReprogramar ? <Info size={15} /> : <AlertTriangle size={15} />}
              <p>
                {puedeReprogramar
                  ? <>Puedes reprogramar esta cita. Recuerda que <strong>solo se permite hacerlo con más de 24 horas de anticipación</strong> a la hora programada.</>
                  : <>Ya no es posible reprogramar esta cita. El plazo de <strong>24 horas de anticipación</strong> ya venció ({cita.hora && cita.hora !== "—" ? `cita a las ${cita.hora}` : "hora no especificada"}).</>
                }
              </p>
            </div>
          )}

          {/* Contenido clínico: solo si la cita ya fue atendida */}
          {estadoNormalizado === "PENDIENTE" || estadoNormalizado === "REPROGRAMADA" ? (
            <div className="dc-section">
              <p className="dc-muted" style={{ textAlign: "center", padding: "0.5rem 0" }}>
                Esta cita aún no ha sido atendida. Los detalles clínicos estarán disponibles después de la consulta.
              </p>
            </div>
          ) : (
            <>
              {/* Diagnóstico */}
              <div className={`dc-section${!cita.diagnostico ? " dc-section--muted" : ""}`}>
                <div className="dc-section-title">
                  <FileText size={15} />
                  <span>Diagnóstico</span>
                </div>
                {cita.diagnostico ? (
                  <p className="dc-diagnostico-text">{cita.diagnostico}</p>
                ) : (
                  <p className="dc-muted">Sin diagnóstico registrado.</p>
                )}
              </div>

              {/* Recetas médicas */}
              <div className="dc-section">
                <div className="dc-section-title">
                  <Pill size={15} />
                  <span>Recetas médicas</span>
                  {tieneRecetas && <span className="dc-count">{cita.recetas!.length}</span>}
                </div>
                {tieneRecetas ? (
                  <div className="dc-recetas">
                    {cita.recetas!.map((receta) => (
                      <div key={`${receta.nombre}-${receta.dosis}-${receta.duracion}`} className="dc-receta-item">
                        <div className="dc-receta-nombre">{receta.nombre}</div>
                        <div className="dc-receta-meta">
                          <span><b>Dosis:</b> {receta.dosis}</span>
                          <span><b>Cantidad:</b> {receta.cantidad}</span>
                          <span><b>Duración:</b> {receta.duracion}</span>
                        </div>
                        {receta.indicaciones && (
                          <p className="dc-receta-indicaciones">
                            {receta.indicaciones}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dc-muted">No se emitieron recetas en esta cita.</p>
                )}
              </div>

              {/* Exámenes solicitados */}
              <div className="dc-section">
                <div className="dc-section-title">
                  <FlaskConical size={15} />
                  <span>Exámenes solicitados</span>
                  {tieneExamenes && <span className="dc-count">{cita.examenes!.length}</span>}
                </div>
                {tieneExamenes ? (
                  <div className="dc-examenes">
                    {cita.examenes!.map((examen) => (
                      <div key={`${examen.nombre}-${examen.tipo}`} className="dc-examen-item">
                        <span className="dc-examen-nombre">{examen.nombre}</span>
                        <span className="dc-examen-tipo">{examen.tipo}</span>
                        {examen.estado && (
                          <span className={`dc-badge dc-badge--sm ${
                            examen.estado === "COMPLETADO"
                              ? "dc-badge--done"
                              : "dc-badge--pending"
                          }`}>
                            {examen.estado === "COMPLETADO" ? "Completado" : "Pendiente"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dc-muted">No se solicitaron exámenes.</p>
                )}
              </div>

              {/* Indicaciones del médico (plan SOAP) */}
              <IndicacionesMedico raw={cita.notasMedico} />
            </>
          )}
        </div>

        <div className="dc-footer">
          <button 
            type="button" 
            className="dc-btn dc-btn--cancel" 
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleCita;