import { useCallback } from "react";
import { Calendar, Clock, Stethoscope, CalendarX } from "lucide-react";
import { formatearFechaLarga } from "../../utils/fecha.utils";
import type { CitaResumen } from "./types";
import "./ResumenCita.css";

/* ── Helpers estáticos (fuera del componente) ── */

const ESTADO_CLASS: Record<string, string> = {
  PENDIENTE:    "resumen-cita__badge--pendiente",
  ASISTIO:      "resumen-cita__badge--asistio",
  ATENDIDA:     "resumen-cita__badge--atendida",
  CANCELADA:    "resumen-cita__badge--cancelada",
  REPROGRAMADA: "resumen-cita__badge--reprogramada",
  VENCIDA:      "resumen-cita__badge--vencida",
};

const TIPO_CLASS: Record<string, string> = {
  CONSULTA:     "resumen-cita__badge--consulta",
  LABORATORIO:  "resumen-cita__badge--laboratorio",
  REMOTA:       "resumen-cita__badge--remota",
  DOMICILIO:    "resumen-cita__badge--domicilio",
};

const TIPO_LABEL: Record<string, string> = {
  CONSULTA:     "Consulta",
  LABORATORIO:  "Laboratorio",
  REMOTA:       "Remota",
  DOMICILIO:    "Domicilio",
};

/* ── Component ── */

interface ResumenCitaProps {
  cita: CitaResumen | null;
  loading: boolean;
  onVerDetalle?: (id: string) => void;
}

const ResumenCita = ({ cita, loading, onVerDetalle }: ResumenCitaProps) => {
  const handleVerDetalle = useCallback(() => {
    if (cita && onVerDetalle) {
      onVerDetalle(cita._id);
    }
  }, [cita, onVerDetalle]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="resumen-cita" aria-busy="true">
        <div className="resumen-cita__header">
          <div className="resumen-cita__header-left">
            <div className="resumen-cita__skeleton-circle" />
            <div className="resumen-cita__skeleton-line resumen-cita__skeleton-line--medium" />
          </div>
          <div className="resumen-cita__skeleton-badge" />
        </div>
        <div className="resumen-cita__body">
          <div className="resumen-cita__skeleton-line resumen-cita__skeleton-line--long" />
          <div className="resumen-cita__skeleton-line resumen-cita__skeleton-line--medium" />
          <div className="resumen-cita__skeleton-line resumen-cita__skeleton-line--short" />
        </div>
      </div>
    );
  }

  /* ── Empty ── */
  if (!cita) {
    return (
      <div className="resumen-cita">
        <div className="resumen-cita__empty">
          <CalendarX size={40} strokeWidth={1.3} className="resumen-cita__empty-icon" />
          <p className="resumen-cita__empty-text">No tienes citas próximas</p>
        </div>
      </div>
    );
  }

  /* ── Data ── */
  const doctorNombre = `Dr. ${cita.doctor.nombres} ${cita.doctor.apellidos}`;
  const fechaFormateada = formatearFechaLarga(cita.fecha);
  const estadoClass = ESTADO_CLASS[cita.estado] ?? "resumen-cita__badge--pendiente";
  const tipoClass = TIPO_CLASS[cita.tipo] ?? "resumen-cita__badge--consulta";
  const tipoLabel = TIPO_LABEL[cita.tipo] ?? cita.tipo;

  return (
    <div className="resumen-cita">
      {/* Header */}
      <div className="resumen-cita__header">
        <div className="resumen-cita__header-left">
          <div className="resumen-cita__header-icon">
            <Calendar size={20} />
          </div>
          <p className="resumen-cita__header-title">Próxima cita</p>
        </div>
        <div className="resumen-cita__badges">
          <span className={`resumen-cita__badge ${tipoClass}`}>
            {tipoLabel}
          </span>
          <span className={`resumen-cita__badge ${estadoClass}`}>
            {cita.estado}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="resumen-cita__body">
        <div className="resumen-cita__row">
          <Calendar size={16} className="resumen-cita__row-icon" />
          <span className="resumen-cita__row-label">{fechaFormateada}</span>
        </div>
        <div className="resumen-cita__row">
          <Clock size={16} className="resumen-cita__row-icon" />
          <span>{cita.hora}</span>
        </div>
        <div className="resumen-cita__row">
          <Stethoscope size={16} className="resumen-cita__row-icon" />
          <span>{doctorNombre}</span>
        </div>
        {cita.doctor.especialidad && (
          <div className="resumen-cita__row">
            <span className="resumen-cita__row-icon" style={{ width: 16 }} />
            <span style={{ fontStyle: "italic", fontSize: "0.8rem" }}>
              {cita.doctor.especialidad}
            </span>
          </div>
        )}
      </div>

      {/* Action */}
      {onVerDetalle && (
        <div className="resumen-cita__action">
          <button className="btn btn-sm btn-secondary" onClick={handleVerDetalle}>
            Ver detalle
          </button>
        </div>
      )}
    </div>
  );
};

export { ResumenCita };
export default ResumenCita;
