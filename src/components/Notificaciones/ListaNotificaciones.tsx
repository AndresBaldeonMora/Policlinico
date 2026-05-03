import { useState, useCallback, useMemo } from "react";
import { BellOff, Loader2, CheckCheck } from "lucide-react";
import { ItemNotificacion } from "./ItemNotificacion";
import { NotificacionModal } from "./NotificacionModal";
import type { Notificacion } from "./types";
import "./Notificaciones.css";

/* ── Filtros ── */
type Filtro = "todas" | "no-leidas" | "leidas";

const ITEMS_POR_PAGINA = 20;

/* ── Props ── */
interface ListaNotificacionesProps {
  notificaciones: Notificacion[];
  loading: boolean;
  onMarcarLeida: (id: string) => void;
  onMarcarTodasLeidas: () => void;
  onEliminar: (id: string) => void;
}

/* ── Component ── */
const ListaNotificaciones = ({
  notificaciones,
  loading,
  onMarcarLeida,
  onMarcarTodasLeidas,
  onEliminar,
}: ListaNotificacionesProps) => {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [pagina, setPagina] = useState(1);
  const [modalNotif, setModalNotif] = useState<Notificacion | null>(null);

  /* Filtrado */
  const filtradas = useMemo(() => {
    if (filtro === "no-leidas") return notificaciones.filter((n) => !n.leida);
    if (filtro === "leidas") return notificaciones.filter((n) => n.leida);
    return notificaciones;
  }, [notificaciones, filtro]);

  /* Paginación */
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);

  const paginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return filtradas.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [filtradas, paginaActual]);

  const noLeidasCount = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones],
  );

  /* Handlers */
  const handleFiltro = useCallback((f: Filtro) => {
    setFiltro(f);
    setPagina(1);
  }, []);

  const handleClickItem = useCallback((notif: Notificacion) => {
    setModalNotif(notif);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalNotif(null);
  }, []);

  const handlePrev = useCallback(() => {
    setPagina((p) => Math.max(1, p - 1));
  }, []);

  const handleNext = useCallback(() => {
    setPagina((p) => Math.min(totalPaginas, p + 1));
  }, [totalPaginas]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="notif-lista">
        <div className="notif-lista__loading">
          <Loader2 size={32} className="notif-lista__spinner" />
          <p className="notif-lista__loading-text">Cargando notificaciones…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notif-lista">
      {/* Header */}
      <div className="notif-lista__header">
        <h1 className="notif-lista__title">Notificaciones</h1>
        {noLeidasCount > 0 && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={onMarcarTodasLeidas}
            aria-label="Marcar todas como leídas"
          >
            <CheckCheck size={14} />
            <span>Marcar todas como leídas</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="notif-lista__filtros" role="tablist" aria-label="Filtrar notificaciones">
        <button
          className={`notif-lista__filtro-btn ${filtro === "todas" ? "notif-lista__filtro-btn--active" : ""}`}
          onClick={() => handleFiltro("todas")}
          role="tab"
          aria-selected={filtro === "todas"}
        >
          Todas
        </button>
        <button
          className={`notif-lista__filtro-btn ${filtro === "no-leidas" ? "notif-lista__filtro-btn--active" : ""}`}
          onClick={() => handleFiltro("no-leidas")}
          role="tab"
          aria-selected={filtro === "no-leidas"}
        >
          No leídas {noLeidasCount > 0 && <span className="notif-lista__filtro-count">{noLeidasCount}</span>}
        </button>
        <button
          className={`notif-lista__filtro-btn ${filtro === "leidas" ? "notif-lista__filtro-btn--active" : ""}`}
          onClick={() => handleFiltro("leidas")}
          role="tab"
          aria-selected={filtro === "leidas"}
        >
          Leídas
        </button>
      </div>

      {/* Lista */}
      <div className="notif-lista__items" aria-live="polite">
        {paginadas.length === 0 ? (
          <div className="notif-lista__empty">
            <BellOff size={40} strokeWidth={1.3} className="notif-lista__empty-icon" />
            <p className="notif-lista__empty-text">No hay notificaciones</p>
          </div>
        ) : (
          paginadas.map((n) => (
            <ItemNotificacion
              key={n.id}
              notificacion={n}
              onClick={() => handleClickItem(n)}
              onMarcarLeida={onMarcarLeida}
              onEliminar={onEliminar}
            />
          ))
        )}
      </div>

      {/* Paginación */}
      {filtradas.length > ITEMS_POR_PAGINA && (
        <div className="notif-lista__paginacion">
          <button
            className="btn btn-sm btn-secondary"
            onClick={handlePrev}
            disabled={paginaActual <= 1}
          >
            Anterior
          </button>
          <span className="notif-lista__pag-info">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleNext}
            disabled={paginaActual >= totalPaginas}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal de detalle */}
      {modalNotif && (
        <NotificacionModal
          notificacion={modalNotif}
          isOpen={!!modalNotif}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export { ListaNotificaciones };
export default ListaNotificaciones;
