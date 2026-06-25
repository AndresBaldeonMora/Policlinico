import { useEffect, useState } from "react";
import {
  Ticket as TicketIcon, Plus, Filter, ChevronRight, AlertCircle,
  Clock, CheckCircle, XCircle, MessageSquare, Send, RefreshCw, X
} from "lucide-react";
import {
  TicketService, type Ticket, type TicketEstado, type TicketPrioridad,
  type TicketCategoria, CATEGORIAS, PRIORIDADES, ESTADOS,
} from "../../services/ticket.service";
import { useAuth } from "../../hooks/userAuth";
import "./Tickets.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
const prioridadClase: Record<TicketPrioridad, string> = {
  BAJA: "tk-badge--baja", MEDIA: "tk-badge--media", ALTA: "tk-badge--alta", CRITICA: "tk-badge--critica",
};
const estadoClase: Record<TicketEstado, string> = {
  ABIERTO: "tk-badge--abierto", EN_REVISION: "tk-badge--revision",
  RESUELTO: "tk-badge--resuelto", CERRADO: "tk-badge--cerrado",
};
const EstadoIcon: Record<TicketEstado, typeof TicketIcon> = {
  ABIERTO: AlertCircle, EN_REVISION: Clock, RESUELTO: CheckCircle, CERRADO: XCircle,
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ── Modal: Nuevo ticket ───────────────────────────────────────────────────────
function ModalNuevo({ onClose, onCreado }: { onClose: () => void; onCreado: (t: Ticket) => void }) {
  const [form, setForm] = useState({ titulo: "", descripcion: "", categoria: "" as TicketCategoria | "", prioridad: "MEDIA" as TicketPrioridad });
  const [enviando, setEnviando] = useState(false);
  const [error, setError]       = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descripcion.trim() || !form.categoria) {
      setError("Completa todos los campos obligatorios."); return;
    }
    setEnviando(true);
    try {
      const t = await TicketService.crear({ ...form, categoria: form.categoria as TicketCategoria });
      onCreado(t);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Error al crear el ticket."); setEnviando(false);
    }
  };

  return (
    <div className="tk-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tk-modal">
        <div className="tk-modal-header">
          <h2><TicketIcon size={18} /> Abrir nuevo ticket</h2>
          <button className="tk-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="tk-modal-body" onSubmit={submit}>
          {error && <div className="tk-error-msg">{error}</div>}

          <label className="tk-label">Título <span>*</span></label>
          <input className="tk-input" placeholder="Describe brevemente el problema" value={form.titulo} onChange={set("titulo")} maxLength={200} />

          <div className="tk-row2">
            <div>
              <label className="tk-label">Categoría <span>*</span></label>
              <select className="tk-select" value={form.categoria} onChange={set("categoria")}>
                <option value="">— Seleccionar —</option>
                {(Object.entries(CATEGORIAS) as [TicketCategoria, string][]).map(([k, v]) =>
                  <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="tk-label">Prioridad</label>
              <select className="tk-select" value={form.prioridad} onChange={set("prioridad")}>
                {(Object.entries(PRIORIDADES) as [TicketPrioridad, string][]).map(([k, v]) =>
                  <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <label className="tk-label">Descripción detallada <span>*</span></label>
          <textarea className="tk-textarea" rows={5}
            placeholder="Explica el problema, cuándo ocurre, qué pasos seguiste, etc."
            value={form.descripcion} onChange={set("descripcion")} maxLength={3000} />
          <div className="tk-char-count">{form.descripcion.length}/3000</div>

          <div className="tk-modal-footer">
            <button type="button" className="tk-btn tk-btn--ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="tk-btn tk-btn--primary" disabled={enviando}>
              {enviando ? "Enviando…" : "Abrir ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: Detalle ticket ─────────────────────────────────────────────────────
function ModalDetalle({ ticketId, esAdmin, onClose, onActualizado }: {
  ticketId: string; esAdmin: boolean; onClose: () => void; onActualizado: () => void;
}) {
  const [ticket, setTicket]       = useState<Ticket | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando]   = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const [resolucion, setResolucion] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState<TicketEstado | "">("");

  useEffect(() => {
    TicketService.obtener(ticketId).then(t => { setTicket(t); setResolucion(t.resolucion ?? ""); });
  }, [ticketId]);

  const enviarComentario = async () => {
    if (!comentario.trim() || !ticket) return;
    setEnviando(true);
    try {
      const t = await TicketService.comentar(ticket._id, comentario);
      setTicket(t); setComentario(""); onActualizado();
    } finally { setEnviando(false); }
  };

  const guardarCambios = async () => {
    if (!ticket) return;
    setCambiando(true);
    try {
      const t = await TicketService.actualizar(ticket._id, {
        ...(nuevoEstado ? { estado: nuevoEstado } : {}),
        ...(resolucion.trim() ? { resolucion } : {}),
      });
      setTicket(t); setNuevoEstado(""); onActualizado();
    } finally { setCambiando(false); }
  };

  if (!ticket) return (
    <div className="tk-overlay"><div className="tk-modal"><div className="tk-loading"><div className="tk-spinner" /></div></div></div>
  );

  const EIcon = EstadoIcon[ticket.estado];

  return (
    <div className="tk-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tk-modal tk-modal--lg">
        <div className="tk-modal-header">
          <div className="tk-modal-header-info">
            <span className="tk-ticket-num">#{ticket.numero}</span>
            <h2>{ticket.titulo}</h2>
          </div>
          <button className="tk-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className={`tk-modal-body ${esAdmin && ticket.estado !== "CERRADO" ? "tk-detalle-body--con-panel" : "tk-detalle-body"}`}>
          {/* ── Columna izquierda: info + comentarios ── */}
          <div className="tk-detalle-main">
            {/* Badges */}
            <div className="tk-badge-row">
              <span className={`tk-badge ${estadoClase[ticket.estado]}`}>
                <EIcon size={12} /> {ESTADOS[ticket.estado]}
              </span>
              <span className={`tk-badge ${prioridadClase[ticket.prioridad]}`}>{PRIORIDADES[ticket.prioridad]}</span>
              <span className="tk-badge tk-badge--cat">{CATEGORIAS[ticket.categoria]}</span>
            </div>

            <div className="tk-detalle-meta">
              <span>Abierto por <strong>{ticket.creadoPorNombre}</strong></span>
              <span className="tk-detalle-meta-sep">·</span>
              <span>{formatFecha(ticket.creadoEn)}</span>
              {ticket.asignadoANombre && <>
                <span className="tk-detalle-meta-sep">·</span>
                <span>Asignado a <strong>{ticket.asignadoANombre}</strong></span>
              </>}
            </div>

            <div className="tk-desc-box">
              <h4>Descripción</h4>
              <p>{ticket.descripcion}</p>
            </div>

            {ticket.resolucion && (
              <div className="tk-resolucion-box">
                <h4><CheckCircle size={14} /> Resolución</h4>
                <p>{ticket.resolucion}</p>
              </div>
            )}

            {/* Comentarios */}
            <div className="tk-comentarios">
              <h4><MessageSquare size={14} /> Comentarios ({ticket.comentarios.length})</h4>
              {ticket.comentarios.length === 0
                ? <p className="tk-no-comments">Sin comentarios aún.</p>
                : ticket.comentarios.map(c => (
                  <div key={c._id} className={`tk-comment ${c.autorRol === "ADMINISTRADOR" ? "tk-comment--admin" : ""}`}>
                    <div className="tk-comment-header">
                      <strong>{c.autorNombre}</strong>
                      <span className="tk-comment-rol">{c.autorRol === "ADMINISTRADOR" ? "Administrador" : "Recepcionista"}</span>
                      <span className="tk-comment-fecha">{formatFecha(c.creadoEn)}</span>
                    </div>
                    <p>{c.texto}</p>
                  </div>
                ))
              }

              {ticket.estado !== "CERRADO" && (
                <div className="tk-comment-input-row">
                  <textarea
                    className="tk-textarea tk-textarea--sm"
                    rows={2}
                    placeholder="Escribe un comentario…"
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                  />
                  <button className="tk-btn tk-btn--primary tk-btn--icon" onClick={enviarComentario} disabled={enviando || !comentario.trim()}>
                    <Send size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha: acciones admin ── */}
          {esAdmin && ticket.estado !== "CERRADO" && (
            <div className="tk-detalle-side">
              <h4>Acciones</h4>

              <label className="tk-label">Cambiar estado</label>
              <select className="tk-select" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value as TicketEstado)}>
                <option value="">— Sin cambio —</option>
                {(Object.entries(ESTADOS) as [TicketEstado, string][])
                  .filter(([k]) => k !== ticket.estado)
                  .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>

              <label className="tk-label" style={{ marginTop: "1rem" }}>Resolución / Nota</label>
              <textarea
                className="tk-textarea tk-textarea--sm"
                rows={4}
                placeholder="Describe cómo se resolvió el problema…"
                value={resolucion}
                onChange={e => setResolucion(e.target.value)}
              />

              <button
                className="tk-btn tk-btn--primary"
                style={{ marginTop: "0.75rem", width: "100%" }}
                onClick={guardarCambios}
                disabled={cambiando || (!nuevoEstado && !resolucion.trim())}
              >
                {cambiando ? <><RefreshCw size={14} className="spin" /> Guardando…</> : "Guardar cambios"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Tickets() {
  const { user } = useAuth();
  const esAdmin = user?.rol === "administrador";
  const [tickets, setTickets]       = useState<Ticket[]>([]);
  const [total, setTotal]           = useState(0);
  const [cargando, setCargando]     = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [detalle, setDetalle]       = useState<string | null>(null);
  const [filtros, setFiltros]       = useState<Record<string, string>>({});
  const [page, setPage]             = useState(1);

  const cargar = async (p = page, f = filtros) => {
    setCargando(true);
    try {
      const res = await TicketService.listar({ ...f, page: String(p), limit: "15" });
      setTickets(res.data); setTotal(res.total);
    } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const aplicarFiltro = (k: string, v: string) => {
    const nf = v ? { ...filtros, [k]: v } : Object.fromEntries(Object.entries(filtros).filter(([key]) => key !== k));
    setFiltros(nf); setPage(1); cargar(1, nf);
  };

  return (
    <div className="tk-page">
      {/* Header */}
      <div className="tk-header">
        <div className="tk-header-left">
          <TicketIcon size={22} className="tk-header-icon" />
          <div>
            <h1>Tickets de soporte</h1>
            <p>{total} ticket{total !== 1 ? "s" : ""} {esAdmin ? "en el sistema" : "enviados"}</p>
          </div>
        </div>
        <div className="tk-header-right">
          <button className="tk-btn tk-btn--ghost tk-btn--icon" onClick={() => cargar()} title="Actualizar">
            <RefreshCw size={16} />
          </button>
          {!esAdmin && (
            <button className="tk-btn tk-btn--primary" onClick={() => setModalNuevo(true)}>
              <Plus size={16} /> Nuevo ticket
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="tk-filtros">
        <Filter size={14} className="tk-filtros-icon" />
        <select className="tk-select tk-select--sm" defaultValue="" onChange={e => aplicarFiltro("estado", e.target.value)}>
          <option value="">Todos los estados</option>
          {(Object.entries(ESTADOS) as [TicketEstado, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="tk-select tk-select--sm" defaultValue="" onChange={e => aplicarFiltro("prioridad", e.target.value)}>
          <option value="">Todas las prioridades</option>
          {(Object.entries(PRIORIDADES) as [TicketPrioridad, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="tk-select tk-select--sm" defaultValue="" onChange={e => aplicarFiltro("categoria", e.target.value)}>
          <option value="">Todas las categorías</option>
          {(Object.entries(CATEGORIAS) as [TicketCategoria, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="tk-table-wrap">
        {cargando ? (
          <div className="tk-loading"><div className="tk-spinner" /></div>
        ) : tickets.length === 0 ? (
          <div className="tk-empty">
            <TicketIcon size={36} />
            <p>{esAdmin ? "No hay tickets con esos filtros." : "Aún no has abierto ningún ticket."}</p>
            {!esAdmin && <button className="tk-btn tk-btn--primary" onClick={() => setModalNuevo(true)}><Plus size={15} /> Abrir primer ticket</button>}
          </div>
        ) : (
          <table className="tk-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Estado</th>
                {esAdmin && <th>Creado por</th>}
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => {
                const EIcon = EstadoIcon[t.estado];
                return (
                  <tr key={t._id} className="tk-row" onClick={() => setDetalle(t._id)}>
                    <td className="tk-num">#{t.numero}</td>
                    <td className="tk-titulo">{t.titulo}</td>
                    <td><span className="tk-badge tk-badge--cat">{CATEGORIAS[t.categoria]}</span></td>
                    <td><span className={`tk-badge ${prioridadClase[t.prioridad]}`}>{PRIORIDADES[t.prioridad]}</span></td>
                    <td><span className={`tk-badge ${estadoClase[t.estado]}`}><EIcon size={11} /> {ESTADOS[t.estado]}</span></td>
                    {esAdmin && <td className="tk-autor">{t.creadoPorNombre}</td>}
                    <td className="tk-fecha">{formatFecha(t.creadoEn)}</td>
                    <td><ChevronRight size={16} className="tk-arrow" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {total > 15 && (
        <div className="tk-pagination">
          <button className="tk-btn tk-btn--ghost" disabled={page <= 1} onClick={() => { setPage(p => p - 1); cargar(page - 1); }}>
            ← Anterior
          </button>
          <span>Página {page} de {Math.ceil(total / 15)}</span>
          <button className="tk-btn tk-btn--ghost" disabled={page >= Math.ceil(total / 15)} onClick={() => { setPage(p => p + 1); cargar(page + 1); }}>
            Siguiente →
          </button>
        </div>
      )}

      {/* Modals */}
      {modalNuevo && (
        <ModalNuevo
          onClose={() => setModalNuevo(false)}
          onCreado={t => { setTickets(prev => [t, ...prev]); setTotal(c => c + 1); setModalNuevo(false); }}
        />
      )}
      {detalle && (
        <ModalDetalle
          ticketId={detalle}
          esAdmin={esAdmin}
          onClose={() => setDetalle(null)}
          onActualizado={() => cargar()}
        />
      )}
    </div>
  );
}
