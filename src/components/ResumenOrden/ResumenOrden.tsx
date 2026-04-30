import { useCallback } from "react";
import { FlaskConical, Calendar, Hash, ClipboardList, PackageX } from "lucide-react";
import { formatearFechaDMY } from "../../utils/fecha.utils";
import type { OrdenResumen } from "../types";
import "./ResumenOrden.css";

/* ── Helpers estáticos (fuera del componente) ── */

const ESTADO_CLASS: Record<string, string> = {
  PENDIENTE:  "resumen-orden__badge--pendiente",
  EN_PROCESO: "resumen-orden__badge--en_proceso",
  ASISTIDO:   "resumen-orden__badge--asistido",
  FINALIZADO: "resumen-orden__badge--finalizado",
  CANCELADA:  "resumen-orden__badge--cancelada",
  VENCIDA:    "resumen-orden__badge--vencida",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE:  "Pendiente",
  EN_PROCESO: "En proceso",
  ASISTIDO:   "Asistido",
  FINALIZADO: "Finalizado",
  CANCELADA:  "Cancelada",
  VENCIDA:    "Vencida",
};

const TIPO_CLASS: Record<string, string> = {
  LABORATORIO: "resumen-orden__badge--laboratorio",
  IMAGEN:      "resumen-orden__badge--imagen",
  MIXTA:       "resumen-orden__badge--mixta",
};

const TIPO_LABEL: Record<string, string> = {
  LABORATORIO: "Laboratorio",
  IMAGEN:      "Imagen",
  MIXTA:       "Mixta",
};

/* ── Component ── */

interface ResumenOrdenProps {
  orden: OrdenResumen | null;
  loading: boolean;
  onVerDetalle?: (id: string) => void;
}

const ResumenOrden = ({ orden, loading, onVerDetalle }: ResumenOrdenProps) => {
  const handleVerDetalle = useCallback(() => {
    if (orden && onVerDetalle) {
      onVerDetalle(orden._id);
    }
  }, [orden, onVerDetalle]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="resumen-orden" aria-busy="true">
        <div className="resumen-orden__header">
          <div className="resumen-orden__header-left">
            <div className="resumen-orden__skeleton-circle" />
            <div className="resumen-orden__skeleton-line resumen-orden__skeleton-line--medium" />
          </div>
          <div className="resumen-orden__skeleton-badge" />
        </div>
        <div className="resumen-orden__body">
          <div className="resumen-orden__skeleton-line resumen-orden__skeleton-line--long" />
          <div className="resumen-orden__skeleton-line resumen-orden__skeleton-line--medium" />
          <div className="resumen-orden__skeleton-line resumen-orden__skeleton-line--short" />
        </div>
      </div>
    );
  }

  /* ── Empty ── */
  if (!orden) {
    return (
      <div className="resumen-orden">
        <div className="resumen-orden__empty">
          <PackageX size={40} strokeWidth={1.3} className="resumen-orden__empty-icon" />
          <p className="resumen-orden__empty-text">No tienes órdenes pendientes</p>
        </div>
      </div>
    );
  }

  /* ── Data ── */
  const estadoClass = ESTADO_CLASS[orden.estado] ?? "resumen-orden__badge--pendiente";
  const estadoLabel = ESTADO_LABEL[orden.estado] ?? orden.estado;
  const tipoClass = TIPO_CLASS[orden.tipoOrden] ?? "resumen-orden__badge--laboratorio";
  const tipoLabel = TIPO_LABEL[orden.tipoOrden] ?? orden.tipoOrden;
  const fechaFormateada = formatearFechaDMY(orden.fechaCreacion);
  const examenesTexto = orden.itemsCount === 1 ? "1 examen" : `${orden.itemsCount} exámenes`;

  return (
    <div className="resumen-orden">
      {/* Header */}
      <div className="resumen-orden__header">
        <div className="resumen-orden__header-left">
          <div className="resumen-orden__header-icon">
            <FlaskConical size={20} />
          </div>
          <p className="resumen-orden__header-title">Orden pendiente</p>
        </div>
        <div className="resumen-orden__badges">
          <span className={`resumen-orden__badge ${tipoClass}`}>
            {tipoLabel}
          </span>
          <span className={`resumen-orden__badge ${estadoClass}`}>
            {estadoLabel}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="resumen-orden__body">
        <div className="resumen-orden__row">
          <Hash size={16} className="resumen-orden__row-icon" />
          <span className="resumen-orden__codigo">{orden.codigoOrden}</span>
        </div>
        <div className="resumen-orden__row">
          <ClipboardList size={16} className="resumen-orden__row-icon" />
          <span>{examenesTexto}</span>
        </div>
        {orden.especialidad && (
          <div className="resumen-orden__row">
            <span className="resumen-orden__row-icon" style={{ width: 16 }} />
            <span style={{ fontStyle: "italic", fontSize: "0.8rem" }}>
              {orden.especialidad}
            </span>
          </div>
        )}
        <div className="resumen-orden__row">
          <Calendar size={16} className="resumen-orden__row-icon" />
          <span>{fechaFormateada}</span>
        </div>
      </div>

      {/* Action */}
      {onVerDetalle && (
        <div className="resumen-orden__action">
          <button className="btn btn-sm btn-secondary" onClick={handleVerDetalle}>
            Ver detalle
          </button>
        </div>
      )}
    </div>
  );
};

export { ResumenOrden };
export default ResumenOrden;
