import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import type { Notificacion } from "./types";
import { TIPO_COLOR, TIPO_BG, tiempoRelativo } from "./ItemNotificacion";
import "./Notificaciones.css";

/* ── Props ── */
/*
 * Auto-refresh (R4): El polling de notificaciones cada 10s se delega
 * al componente padre, que debe actualizar la prop `notificaciones`.
 * Este componente es puramente presentacional y reactivo.
 */
interface CampanillaNotificacionesProps {
  notificaciones: Notificacion[];
  onMarcarLeida?: (id: string) => void;
}

/* ── Component ── */
const CampanillaNotificaciones = ({
  notificaciones,
  onMarcarLeida,
}: CampanillaNotificacionesProps) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const noLeidasCount = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones],
  );

  const ultimas = useMemo(
    () =>
      notificaciones
        .slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 5),
    [notificaciones],
  );

  /* Click fuera cierra */
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  /* ESC cierra */
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleVerTodas = useCallback(() => {
    setOpen(false);
    navigate("/notificaciones");
  }, [navigate]);

  const handleItemClick = useCallback(
    (notif: Notificacion) => {
      if (!notif.leida) onMarcarLeida?.(notif.id);
      if (notif.link) {
        setOpen(false);
        navigate(notif.link);
      }
    },
    [onMarcarLeida, navigate],
  );

  return (
    <div className="campanilla" ref={wrapperRef}>
      <button
        className="campanilla__btn"
        onClick={handleToggle}
        aria-label={`Notificaciones${noLeidasCount > 0 ? `, ${noLeidasCount} sin leer` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={20} strokeWidth={1.8} />
        {noLeidasCount > 0 && (
          <span className="campanilla__badge" aria-hidden="true">
            {noLeidasCount > 99 ? "99+" : noLeidasCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="campanilla__dropdown"
          role="dialog"
          aria-modal="false"
          aria-label="Últimas notificaciones"
        >
          <div className="campanilla__dropdown-header">
            <span className="campanilla__dropdown-title">Notificaciones</span>
            {noLeidasCount > 0 && (
              <span className="campanilla__dropdown-count">{noLeidasCount} nuevas</span>
            )}
          </div>

          <div className="campanilla__dropdown-list">
            {ultimas.length === 0 ? (
              <p className="campanilla__dropdown-empty">Sin notificaciones</p>
            ) : (
              ultimas.map((n) => {
                const color = TIPO_COLOR[n.tipo];
                const bg = TIPO_BG[n.tipo];
                return (
                  <div
                    key={n.id}
                    className={`campanilla__dropdown-item${n.leida ? "" : " campanilla__dropdown-item--unread"}`}
                    onClick={() => handleItemClick(n)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleItemClick(n);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {!n.leida && (
                      <span className="campanilla__dropdown-dot" aria-hidden="true" />
                    )}
                    <div className="campanilla__dropdown-item-content">
                      <p className="campanilla__dropdown-item-title">{n.titulo}</p>
                      <p className="campanilla__dropdown-item-msg">
                        {n.mensaje.length > 100 ? `${n.mensaje.slice(0, 100)}…` : n.mensaje}
                      </p>
                      <div className="campanilla__dropdown-item-meta">
                        <span
                          className="notif-item__tipo-badge"
                          style={{ color, backgroundColor: bg, fontSize: "0.62rem", padding: "0.1rem 0.4rem" }}
                        >
                          {n.tipo}
                        </span>
                        <span className="campanilla__dropdown-item-fecha">
                          {tiempoRelativo(n.fecha)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button className="campanilla__dropdown-footer" onClick={handleVerTodas}>
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
};

export { CampanillaNotificaciones };
export default CampanillaNotificaciones;
