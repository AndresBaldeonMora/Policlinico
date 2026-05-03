import { Eye, Download, FlaskConical, Calendar, Clock } from "lucide-react";
import type { OrdenExamen } from "../../services/examen.service";
import "./ItemOrden.css";

const TIPO_LABEL: Record<string, string> = {
  LABORATORIO: "Laboratorio",
  IMAGEN: "Imagen",
  MIXTA: "Mixta",
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  });

const formatHora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

export const ItemOrden = ({
  orden,
  onVerDetalle,
  isResultadoView = false,
}: {
  orden: OrdenExamen;
  onVerDetalle: (id: string) => void;
  isResultadoView?: boolean;
}) => {
  const tipo   = TIPO_LABEL[orden.tipoOrden ?? ""] ?? orden.tipoOrden ?? "General";
  const codigo = orden.codigoOrden || `#${orden._id.substring(0, 6)}`;

  const fechaRef = isResultadoView
    ? (orden.fechaResultados || orden.fecha)
    : (orden.fechaCitaLab || orden.fecha);

  return (
    <div className="io-card">
      <span className="io-codigo" title={codigo}>{codigo}</span>

      <div className="io-badges">
        <span className="io-badge io-badge--tipo">{tipo}</span>
      </div>

      <span className="io-especialidad">
        <FlaskConical size={13} />
        {orden.especialidadId?.nombre || "Sin especialidad"}
      </span>

      <span className="io-fecha">
        <Calendar size={12} />
        {formatFecha(fechaRef)}
      </span>

      <span className="io-fecha">
        <Clock size={12} />
        {formatHora(orden.fecha)}
      </span>

      <div className="io-actions">
        <button
          type="button"
          className="io-btn io-btn--detalle"
          onClick={() => onVerDetalle(orden._id)}
        >
          <Eye size={14} /> Ver detalle
        </button>

        {orden.estado === "FINALIZADO" && orden.archivoResultadoUrl && (
          <a
            href={orden.archivoResultadoUrl}
            target="_blank"
            rel="noreferrer"
            className="io-btn io-btn--download"
            title="Descargar Resultados"
          >
            <Download size={14} /> Descargar
          </a>
        )}
      </div>
    </div>
  );
};
