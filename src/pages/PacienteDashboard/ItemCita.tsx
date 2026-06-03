import { Calendar, Clock, Stethoscope, CalendarClock } from "lucide-react";
import { fmtEstado } from "../../utils/fecha.utils";
import type { CitaHistorial } from "../../services/cita.service";
import "./ItemCita.css";

interface Props {
  cita: CitaHistorial;
  onClick: () => void;
  hideEstado?: boolean;
  onReprogramar?: (cita: CitaHistorial) => void;
}

const puedeReprogramar = (cita: CitaHistorial): boolean => {
  try {
    const fechaStr = cita.fecha.split("T")[0];
    const [y, m, d] = fechaStr.split("-").map(Number);
    const [h, min] = (cita.hora && cita.hora !== "—" ? cita.hora : "00:00").split(":").map(Number);
    const citaDate = new Date(y, m - 1, d, h, min);
    return citaDate.getTime() - Date.now() > 24 * 60 * 60 * 1000;
  } catch { return false; }
};

const ESTADO_CONFIG: Record<string, { label: string; clase: string }> = {
  PENDIENTE:    { label: "Pendiente",    clase: "ic-badge--pending" },
  ASISTIO:      { label: "En sala",      clase: "ic-badge--warning" },
  ATENDIDA:     { label: "Atendida",     clase: "ic-badge--done" },
  CANCELADA:    { label: "Cancelada",    clase: "ic-badge--cancel" },
  REPROGRAMADA: { label: "Reprogramada", clase: "ic-badge--reprogramada" },
  // Alias defensivo para datos heredados sin migrar (VENCIDA → Cancelada)
  VENCIDA:      { label: "Cancelada",    clase: "ic-badge--cancel" },
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  });

const ItemCita = ({ cita, onClick, hideEstado = false, onReprogramar }: Props) => {
  const estadoKey = cita.estado?.toUpperCase()?.trim() ?? "PENDIENTE";
  const badge = ESTADO_CONFIG[estadoKey] ?? {
    label: fmtEstado(cita.estado) || "Desconocido",
    clase: "ic-badge--pending"
  };

  const mostrarReprogramar = hideEstado && onReprogramar && estadoKey === "PENDIENTE";
  const puedeRep = mostrarReprogramar && puedeReprogramar(cita);

  return (
    <div className="ic-card">
      <span className="ic-especialidad" title={cita.especialidad}>
        {cita.especialidad}
      </span>

      {!hideEstado && <span className={`ic-badge ${badge.clase}`}>{badge.label}</span>}

      <span className="ic-medico">
        <Stethoscope size={13} />
        {cita.medico}
      </span>

      <span className="ic-datetime">
        <span className="ic-meta-item">
          <Calendar size={12} />
          {formatFecha(cita.fecha)}
        </span>
        {cita.hora && cita.hora !== "—" && (
          <span className="ic-meta-item">
            <Clock size={12} />
            {cita.hora}
          </span>
        )}
      </span>

      <div className="ic-actions">
        {mostrarReprogramar && (
          <button
            className="ic-btn-reprogramar"
            type="button"
            title={puedeRep ? "Reprogramar cita" : "Solo puedes reprogramar con más de 24 horas de anticipación"}
            disabled={!puedeRep}
            onClick={(e) => { e.stopPropagation(); if (puedeRep) onReprogramar!(cita); }}
          >
            <CalendarClock size={14} />
            Reprogramar
          </button>
        )}
        <button className="ic-btn-detalle" onClick={onClick} type="button">
          Ver detalle
        </button>
      </div>
    </div>
  );
};

export default ItemCita;