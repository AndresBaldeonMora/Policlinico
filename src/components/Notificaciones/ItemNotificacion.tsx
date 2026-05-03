import { useCallback, memo } from "react";
import { Check, Trash2 } from "lucide-react";
import type { Notificacion, TipoNotificacion } from "./types";
import "./Notificaciones.css";

/* ── Colores por tipo ── */
const TIPO_COLOR: Record<TipoNotificacion, string> = {
  CITA: "#0066cc",
  EXAMEN: "#00cc66",
  RECETA: "#ff9900",
  SISTEMA: "#999999",
};

const TIPO_BG: Record<TipoNotificacion, string> = {
  CITA: "rgba(0, 102, 204, 0.1)",
  EXAMEN: "rgba(0, 204, 102, 0.1)",
  RECETA: "rgba(255, 153, 0, 0.1)",
  SISTEMA: "rgba(153, 153, 153, 0.1)",
};

/* ── Helpers ── */
function tiempoRelativo(fechaISO: string): string {
  const ahora = Date.now();
  const fecha = new Date(fechaISO).getTime();
  const diff = ahora - fecha;

  const segundos = Math.floor(diff / 1000);
  if (segundos < 60) return "hace un momento";

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas}h`;

  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias}d`;

  return new Date(fechaISO).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
  });
}

/* ── Props ── */
interface ItemNotificacionProps {
  notificacion: Notificacion;
  onClick?: () => void;
  onMarcarLeida?: (id: string) => void;
  onEliminar?: (id: string) => void;
}

/* ── Component ── */
const ItemNotificacion = memo(
  ({ notificacion, onClick, onMarcarLeida, onEliminar }: ItemNotificacionProps) => {
    const { id, titulo, mensaje, tipo, leida, fecha } = notificacion;

    const handleMarcarLeida = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarcarLeida?.(id);
      },
      [id, onMarcarLeida],
    );

    const handleEliminar = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onEliminar?.(id);
      },
      [id, onEliminar],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      },
      [onClick],
    );

    const color = TIPO_COLOR[tipo];
    const bg = TIPO_BG[tipo];

    return (
      <div
        className={`notif-item${leida ? "" : " notif-item--unread"}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Notificación: ${titulo}`}
      >
        {/* Dot indicator */}
        <span
          className="notif-item__dot"
          style={{ backgroundColor: leida ? "var(--border)" : "var(--success)" }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="notif-item__content">
          <p className="notif-item__title">{titulo}</p>
          <p className="notif-item__mensaje">
            {mensaje.length > 150 ? `${mensaje.slice(0, 150)}…` : mensaje}
          </p>
          <div className="notif-item__meta">
            <span
              className="notif-item__tipo-badge"
              style={{ color, backgroundColor: bg }}
            >
              {tipo}
            </span>
            <span className="notif-item__fecha">{tiempoRelativo(fecha)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="notif-item__actions">
          {!leida && onMarcarLeida && (
            <button
              className="notif-item__action-btn"
              onClick={handleMarcarLeida}
              title="Marcar como leída"
              aria-label="Marcar como leída"
            >
              <Check size={14} />
            </button>
          )}
          {onEliminar && (
            <button
              className="notif-item__action-btn notif-item__action-btn--danger"
              onClick={handleEliminar}
              title="Eliminar"
              aria-label="Eliminar notificación"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    );
  },
);

ItemNotificacion.displayName = "ItemNotificacion";

export { ItemNotificacion, tiempoRelativo, TIPO_COLOR, TIPO_BG };
export default ItemNotificacion;
