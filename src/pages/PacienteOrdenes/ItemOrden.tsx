import { Eye, Download, FlaskConical, Calendar } from "lucide-react";
import type { OrdenExamen } from "../../services/examen.service";
import "./ItemOrden.css";

const TIPO_LABEL: Record<string, string> = {
  LABORATORIO: "Laboratorio",
  IMAGEN: "Imagen",
  MIXTA: "Mixta",
};

const ESTADO_CONFIG: Record<string, { label: string; clase: string }> = {
  PENDIENTE:  { label: "Pendiente",  clase: "io-badge--pendiente" },
  EN_PROCESO: { label: "En Proceso", clase: "io-badge--proceso" },
  ASISTIDO:   { label: "Asistida",   clase: "io-badge--asistido" },
  FINALIZADO: { label: "Completada", clase: "io-badge--finalizado" },
  CANCELADA:  { label: "Cancelada",  clase: "io-badge--cancelado" },
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
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
  const badge = ESTADO_CONFIG[orden.estado] ?? { label: orden.estado, clase: "io-badge--pendiente" };
  const tipo = TIPO_LABEL[orden.tipoOrden ?? ""] ?? orden.tipoOrden ?? "General";
  const codigo = orden.codigoOrden || `#${orden._id.substring(0, 6)}`;

  const fechaDisplay = isResultadoView
    ? (orden.fechaResultados ? formatFecha(orden.fechaResultados) : null)
    : (orden.fechaCitaLab ? formatFecha(orden.fechaCitaLab) : null);

  return (
    <div className="io-card">
      <span className="io-codigo" title={codigo}>{codigo}</span>

      <div className="io-badges">
        <span className="io-badge io-badge--tipo">{tipo}</span>
        <span className={`io-badge ${badge.clase}`}>{badge.label}</span>
      </div>

      <span className="io-especialidad">
        <FlaskConical size={13} />
        {orden.especialidadId?.nombre || "Sin especialidad"}
      </span>

      {fechaDisplay && (
        <span className="io-fecha">
          <Calendar size={12} />
          {fechaDisplay}
        </span>
      )}

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
