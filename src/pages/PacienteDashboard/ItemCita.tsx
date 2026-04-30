import { Calendar, Clock, Stethoscope } from "lucide-react";
import type { CitaHistorial } from "../../services/cita.service";
import "./ItemCita.css";

interface Props {
  cita: CitaHistorial;
  onClick: () => void;
}

const ESTADO_CONFIG: Record<string, { label: string; clase: string }> = {
  PENDIENTE:    { label: "Pendiente",    clase: "ic-badge--pending" },
  ASISTIO:      { label: "Asistió",      clase: "ic-badge--warning" },
  ATENDIDA:     { label: "Atendida",     clase: "ic-badge--done" },
  CANCELADA:    { label: "Cancelada",    clase: "ic-badge--cancel" },
  REPROGRAMADA: { label: "Reprogramada", clase: "ic-badge--reprogramada" },
  VENCIDA:      { label: "Vencida",      clase: "ic-badge--vencida" },
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  });

const ItemCita = ({ cita, onClick }: Props) => {
  // Normalizar el estado (por si viene en minúsculas o con espacios)
  const estadoKey = cita.estado?.toUpperCase()?.trim() ?? "PENDIENTE";
  const badge = ESTADO_CONFIG[estadoKey] ?? { 
    label: cita.estado || "Desconocido", 
    clase: "ic-badge--pending" 
  };

  return (
    <div className="ic-card">
      <span className="ic-especialidad" title={cita.especialidad}>
        {cita.especialidad}
      </span>

      <span className={`ic-badge ${badge.clase}`}>{badge.label}</span>

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

      <button className="ic-btn-detalle" onClick={onClick} type="button">
        Ver detalle
      </button>
    </div>
  );
};

export default ItemCita;