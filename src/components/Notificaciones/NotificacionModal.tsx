import { useCallback, useEffect, useRef } from "react";
import { X, ExternalLink } from "lucide-react";
import type { Notificacion } from "./types";
import { TIPO_COLOR, TIPO_BG } from "./ItemNotificacion";
import "./Notificaciones.css";

/* ── Helpers ── */
function formatearFechaCompleta(fechaISO: string): string {
  const d = new Date(fechaISO);
  const opciones: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return d.toLocaleDateString("es-PE", opciones);
}

/* ── Props ── */
interface NotificacionModalProps {
  notificacion: Notificacion;
  isOpen: boolean;
  onClose: () => void;
}

/* ── Component ── */
const NotificacionModal = ({ notificacion, isOpen, onClose }: NotificacionModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  /* Cierre con ESC */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  /* Click fuera cierra */
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  const { titulo, mensaje, tipo, leida, fecha, link } = notificacion;
  const color = TIPO_COLOR[tipo];
  const bg = TIPO_BG[tipo];

  return (
    <div
      className="notif-modal__overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-modal-title"
    >
      <div className="notif-modal" tabIndex={0}>
        {/* Header */}
        <div className="notif-modal__header">
          <h2 id="notif-modal-title" className="notif-modal__header-title">Detalles de notificación</h2>
          <button
            className="notif-modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="notif-modal__body">
          <h3 className="notif-modal__titulo">{titulo}</h3>
          <p className="notif-modal__mensaje">{mensaje}</p>

          <div className="notif-modal__info-grid">
            <div className="notif-modal__info-item">
              <span className="notif-modal__info-label">Tipo</span>
              <span
                className="notif-item__tipo-badge"
                style={{ color, backgroundColor: bg }}
              >
                {tipo}
              </span>
            </div>
            <div className="notif-modal__info-item">
              <span className="notif-modal__info-label">Fecha</span>
              <span className="notif-modal__info-value">
                {formatearFechaCompleta(fecha)}
              </span>
            </div>
            <div className="notif-modal__info-item">
              <span className="notif-modal__info-label">Estado</span>
              <span
                className={`notif-modal__estado ${
                  leida ? "notif-modal__estado--leida" : "notif-modal__estado--no-leida"
                }`}
              >
                {leida ? "Leída" : "No leída"}
              </span>
            </div>
          </div>

          {link && (
            <a
              href={link}
              className="btn btn-primary notif-modal__link-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} />
              <span>Ir al recurso</span>
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="notif-modal__footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export { NotificacionModal };
export default NotificacionModal;
