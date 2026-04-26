import { useEffect, useRef } from "react";
import {
  X, Calendar, Clock, Stethoscope, FileText,
  Pill, FlaskConical, StickyNote, User,
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
}

// Actualizar configuración de estados incluyendo ASISTIO
const ESTADO_CONFIG: Record<string, { label: string; clase: string }> = {
  PENDIENTE:    { label: "Pendiente",    clase: "dc-badge--pending" },
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

const DetalleCita = ({ cita, onCerrar }: Props) => {
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
              <span className={`dc-badge ${badge.clase}`}>
                {badge.label}
              </span>
            </div>
          </div>

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
                {cita.recetas!.map((receta, i) => (
                  <div key={i} className="dc-receta-item">
                    <div className="dc-receta-nombre">{receta.nombre}</div>
                    <div className="dc-receta-meta">
                      <span><b>Dosis:</b> {receta.dosis}</span>
                      <span><b>Cantidad:</b> {receta.cantidad}</span>
                      <span><b>Duración:</b> {receta.duracion}</span>
                    </div>
                    {receta.indicaciones && (
                      <p className="dc-receta-indicaciones">
                        💡 {receta.indicaciones}
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
                {cita.examenes!.map((examen, i) => (
                  <div key={i} className="dc-examen-item">
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

          {/* Notas del médico */}
          {cita.notasMedico && (
            <div className="dc-section">
              <div className="dc-section-title">
                <StickyNote size={15} />
                <span>Indicaciones del médico</span>
              </div>
              <p className="dc-notas-text">{cita.notasMedico}</p>
            </div>
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