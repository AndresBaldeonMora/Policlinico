import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown, ChevronUp, FileText, ExternalLink,
  FlaskConical, Image as ImageIcon, Layers,
  Hourglass, ClipboardCheck, CheckCircle2, XCircle, Clock4,
  Search,
} from "lucide-react";
import {
  ExamenService,
  type OrdenExamen,
  type EstadoOrden,
  TIPO_EXAMEN_LABEL,
} from "../../services/examen.service";

interface Props {
  pacienteId: string;
}

const ESTADO_META: Record<EstadoOrden, { label: string; cls: string; icon: any }> = {
  PENDIENTE:  { label: "Por autorizar", cls: "warning", icon: Hourglass },
  EN_PROCESO: { label: "En vigencia",   cls: "info",    icon: Clock4 },
  ASISTIDO:   { label: "En análisis",   cls: "primary", icon: ClipboardCheck },
  FINALIZADO: { label: "Resultados",    cls: "success", icon: CheckCircle2 },
  CANCELADA:  { label: "Cancelada",     cls: "muted",   icon: XCircle },
};

const TIPO_META: Record<string, { label: string; icon: any; cls: string }> = {
  LABORATORIO: { label: "Laboratorio", icon: FlaskConical, cls: "lab" },
  IMAGEN:      { label: "Imagen",      icon: ImageIcon,    cls: "img" },
  MIXTA:       { label: "Mixta",       icon: Layers,       cls: "mix" },
};

const formatFecha = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("es-PE", {
        day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
      })
    : "—";

export default function PanelOrdenesPaciente({ pacienteId }: Props) {
  const [ordenes, setOrdenes] = useState<OrdenExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(true);
  const [ordenAbierta, setOrdenAbierta] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "FINALIZADO" | "EN_PROCESO" | "PENDIENTE">("todas");
  const [modalOrdenes, setModalOrdenes] = useState(false);
  const [ordenAbiertaModal, setOrdenAbiertaModal] = useState<string | null>(null);
  const [filtroModal, setFiltroModal] = useState<"todas" | "FINALIZADO" | "EN_PROCESO" | "PENDIENTE">("todas");

  useEffect(() => {
    if (!pacienteId) return;
    setLoading(true);
    ExamenService.listarOrdenesPorPaciente(pacienteId)
      .then(setOrdenes)
      .catch(() => setOrdenes([]))
      .finally(() => setLoading(false));
  }, [pacienteId]);

  const stats = useMemo(() => ({
    total: ordenes.length,
    finalizadas: ordenes.filter(o => o.estado === "FINALIZADO").length,
    enProceso:   ordenes.filter(o => o.estado === "EN_PROCESO" || o.estado === "ASISTIDO").length,
    pendientes:  ordenes.filter(o => o.estado === "PENDIENTE").length,
  }), [ordenes]);

  const ordenesFiltradas = useMemo(() => {
    if (filtro === "todas") return ordenes;
    if (filtro === "EN_PROCESO") return ordenes.filter(o => o.estado === "EN_PROCESO" || o.estado === "ASISTIDO");
    return ordenes.filter(o => o.estado === filtro);
  }, [ordenes, filtro]);

  const ordenesFiltradas3 = ordenesFiltradas.slice(0, 3);

  const ordenesFiltradasModal = useMemo(() => {
    if (filtroModal === "todas") return ordenes;
    if (filtroModal === "EN_PROCESO") return ordenes.filter(o => o.estado === "EN_PROCESO" || o.estado === "ASISTIDO");
    return ordenes.filter(o => o.estado === filtroModal);
  }, [ordenes, filtroModal]);

  return (
    <div className="sp-section-container pop-wrap">
      {/* Toggle */}
      <button className="sp-section-toggle" onClick={() => setExpandido(v => !v)}>
        <span className="pop-toggle-label">
          <FlaskConical size={13} className="pop-toggle-icon" />
          Órdenes y resultados
          {ordenes.length > 0 && (
            <span className="pop-pill">{ordenes.length}</span>
          )}
          {stats.finalizadas > 0 && (
            <span className="pop-pill pop-pill--success">
              {stats.finalizadas} con resultados
            </span>
          )}
        </span>
        {expandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expandido && (
        <div className="sp-section-body pop-body">

          {/* Resumen visual */}
          {!loading && ordenes.length > 0 && (
            <div className="pop-stats">
              <button
                className={`pop-stat ${filtro === "todas" ? "pop-stat--active" : ""}`}
                onClick={() => setFiltro("todas")}
              >
                <span className="pop-stat-value">{stats.total}</span>
                <span className="pop-stat-label">Total</span>
              </button>
              <button
                className={`pop-stat pop-stat--success ${filtro === "FINALIZADO" ? "pop-stat--active" : ""}`}
                onClick={() => setFiltro(filtro === "FINALIZADO" ? "todas" : "FINALIZADO")}
                disabled={stats.finalizadas === 0}
              >
                <span className="pop-stat-value">{stats.finalizadas}</span>
                <span className="pop-stat-label">Con resultados</span>
              </button>
              <button
                className={`pop-stat pop-stat--info ${filtro === "EN_PROCESO" ? "pop-stat--active" : ""}`}
                onClick={() => setFiltro(filtro === "EN_PROCESO" ? "todas" : "EN_PROCESO")}
                disabled={stats.enProceso === 0}
              >
                <span className="pop-stat-value">{stats.enProceso}</span>
                <span className="pop-stat-label">En curso</span>
              </button>
              <button
                className={`pop-stat pop-stat--warn ${filtro === "PENDIENTE" ? "pop-stat--active" : ""}`}
                onClick={() => setFiltro(filtro === "PENDIENTE" ? "todas" : "PENDIENTE")}
                disabled={stats.pendientes === 0}
              >
                <span className="pop-stat-value">{stats.pendientes}</span>
                <span className="pop-stat-label">Por autorizar</span>
              </button>
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <div className="pop-loading">
              <div className="pop-sk" />
              <div className="pop-sk" />
            </div>
          ) : ordenes.length === 0 ? (
            <div className="pop-empty">
              <FlaskConical size={22} />
              <p className="pop-empty-title">Sin órdenes</p>
              <p className="pop-empty-sub">Este paciente aún no tiene exámenes registrados</p>
            </div>
          ) : ordenesFiltradas.length === 0 ? (
            <div className="pop-empty pop-empty--soft">
              <Search size={18} />
              <p className="pop-empty-sub">Sin órdenes con ese filtro</p>
            </div>
          ) : (
            <div className="pop-list">
              {ordenesFiltradas3.map(o => {
                const meta = ESTADO_META[o.estado] ?? ESTADO_META.PENDIENTE;
                const tipo = TIPO_META[o.tipoOrden ?? ""] ?? TIPO_META.LABORATORIO;
                const TipoIcon = tipo.icon;
                const EstadoIcon = meta.icon;
                const codigo = o.codigoOrden || `#${o._id.slice(-6).toUpperCase()}`;
                const esExpandida = ordenAbierta === o._id;
                const itemsConResultado = o.items?.filter(it => it.valorResultado || it.archivoUrl) ?? [];
                const totalItems = o.items?.length ?? 0;

                return (
                  <div
                    key={o._id}
                    className={`pop-orden pop-orden--${meta.cls}${esExpandida ? " pop-orden--open" : ""}`}
                  >
                    {/* Rail lateral */}
                    <div className="pop-orden-rail" />

                    {/* Header */}
                    <button
                      className="pop-orden-head"
                      onClick={() => setOrdenAbierta(esExpandida ? null : o._id)}
                    >
                      <div className="pop-orden-tipo-wrap">
                        <div className={`pop-orden-tipo pop-orden-tipo--${tipo.cls}`}>
                          <TipoIcon size={13} />
                        </div>
                      </div>

                      <div className="pop-orden-main">
                        <div className="pop-orden-top">
                          <span className="pop-orden-cod">{codigo}</span>
                          <span className="pop-orden-tipo-label">{tipo.label}</span>
                          {totalItems > 0 && (
                            <span className="pop-orden-items">
                              {totalItems} {totalItems === 1 ? "examen" : "exámenes"}
                            </span>
                          )}
                        </div>
                        <div className="pop-orden-sub">
                          <span>{formatFecha(o.fecha)}</span>
                          {o.especialidadId?.nombre && <span>· {o.especialidadId.nombre}</span>}
                        </div>
                      </div>

                      <div className="pop-orden-right">
                        <span className={`pop-badge pop-badge--${meta.cls}`}>
                          <EstadoIcon size={10} />
                          {meta.label}
                        </span>
                        {esExpandida ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </div>
                    </button>

                    {/* Cuerpo */}
                    {esExpandida && (
                      <div className="pop-orden-body">
                        {/* PDF link */}
                        {o.estado === "FINALIZADO" && o.archivoResultadoUrl && (
                          <a
                            className="pop-pdf"
                            href={o.archivoResultadoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <FileText size={12} />
                            <span>Ver PDF de resultados</span>
                            <ExternalLink size={10} />
                          </a>
                        )}

                        {/* Tabla de items con resultados */}
                        {itemsConResultado.length > 0 ? (
                          <div className="pop-tabla">
                            <div className="pop-tabla-head">
                              <span>Examen</span>
                              <span>Resultado</span>
                              <span>Unidad</span>
                            </div>
                            {itemsConResultado.map((it, idx) => {
                              const ex = typeof it.examenId === "object" ? it.examenId : null;
                              const nombre = ex?.nombre || "Examen";
                              const tipoEx = ex?.tipo ? TIPO_EXAMEN_LABEL[ex.tipo] ?? ex.tipo : "";
                              return (
                                <div key={idx} className="pop-tabla-row">
                                  <span className="pop-tabla-nombre">
                                    {nombre}
                                    {tipoEx && <span className="pop-tabla-tipo"> · {tipoEx}</span>}
                                  </span>
                                  <span className="pop-tabla-valor">{it.valorResultado || "—"}</span>
                                  <span className="pop-tabla-unidad">{it.unidadResultado || ""}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : o.observacionesGenerales ? (
                          <div className="pop-indic">
                            <span className="pop-indic-label">Indicaciones</span>
                            <span className="pop-indic-text">{o.observacionesGenerales}</span>
                          </div>
                        ) : (
                          <div className="pop-sin-result">
                            <Hourglass size={12} />
                            <span>Sin resultados cargados aún</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {ordenesFiltradas.length > 3 && (
                <button
                  onClick={() => setModalOrdenes(true)}
                  style={{
                    width: "100%", marginTop: 6, padding: "6px 0",
                    border: "1px dashed var(--border)", borderRadius: 8,
                    background: "none", color: "var(--primary)", cursor: "pointer",
                    fontSize: 11, fontWeight: 600,
                  }}
                >
                  Ver todas ({ordenesFiltradas.length})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modal todas las órdenes ── */}
      {modalOrdenes && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { setModalOrdenes(false); setOrdenAbiertaModal(null); setFiltroModal("todas"); }}
        >
          <div
            style={{ background: "var(--bg-card)", borderRadius: 12, width: 580, maxWidth: "92vw", maxHeight: "82vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <FlaskConical size={15} /> Órdenes y resultados
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{ordenes.length} órdenes en total</p>
              </div>
              <button
                onClick={() => { setModalOrdenes(false); setOrdenAbiertaModal(null); setFiltroModal("todas"); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted)", lineHeight: 1, padding: "4px 8px" }}
              >
                ×
              </button>
            </div>

            {/* Filtros */}
            <div className="pop-stats" style={{ margin: "12px 20px 0" }}>
              <button className={`pop-stat ${filtroModal === "todas" ? "pop-stat--active" : ""}`} onClick={() => setFiltroModal("todas")}>
                <span className="pop-stat-value">{stats.total}</span>
                <span className="pop-stat-label">Total</span>
              </button>
              <button className={`pop-stat pop-stat--success ${filtroModal === "FINALIZADO" ? "pop-stat--active" : ""}`} onClick={() => setFiltroModal(filtroModal === "FINALIZADO" ? "todas" : "FINALIZADO")} disabled={stats.finalizadas === 0}>
                <span className="pop-stat-value">{stats.finalizadas}</span>
                <span className="pop-stat-label">Con resultados</span>
              </button>
              <button className={`pop-stat pop-stat--info ${filtroModal === "EN_PROCESO" ? "pop-stat--active" : ""}`} onClick={() => setFiltroModal(filtroModal === "EN_PROCESO" ? "todas" : "EN_PROCESO")} disabled={stats.enProceso === 0}>
                <span className="pop-stat-value">{stats.enProceso}</span>
                <span className="pop-stat-label">En curso</span>
              </button>
              <button className={`pop-stat pop-stat--warn ${filtroModal === "PENDIENTE" ? "pop-stat--active" : ""}`} onClick={() => setFiltroModal(filtroModal === "PENDIENTE" ? "todas" : "PENDIENTE")} disabled={stats.pendientes === 0}>
                <span className="pop-stat-value">{stats.pendientes}</span>
                <span className="pop-stat-label">Por autorizar</span>
              </button>
            </div>

            <div className="pop-list" style={{ overflowY: "auto", padding: "12px 20px" }}>
              {ordenesFiltradasModal.length === 0 ? (
                <div className="pop-empty pop-empty--soft">
                  <Search size={18} />
                  <p className="pop-empty-sub">Sin órdenes con ese filtro</p>
                </div>
              ) : ordenesFiltradasModal.map(o => {
                const meta = ESTADO_META[o.estado] ?? ESTADO_META.PENDIENTE;
                const tipo = TIPO_META[o.tipoOrden ?? ""] ?? TIPO_META.LABORATORIO;
                const TipoIcon = tipo.icon;
                const EstadoIcon = meta.icon;
                const codigo = o.codigoOrden || `#${o._id.slice(-6).toUpperCase()}`;
                const esExpandida = ordenAbiertaModal === o._id;
                const itemsConResultado = o.items?.filter(it => it.valorResultado || it.archivoUrl) ?? [];
                const totalItems = o.items?.length ?? 0;
                return (
                  <div key={o._id} className={`pop-orden pop-orden--${meta.cls}${esExpandida ? " pop-orden--open" : ""}`}>
                    <div className="pop-orden-rail" />
                    <button className="pop-orden-head" onClick={() => setOrdenAbiertaModal(esExpandida ? null : o._id)}>
                      <div className="pop-orden-tipo-wrap">
                        <div className={`pop-orden-tipo pop-orden-tipo--${tipo.cls}`}><TipoIcon size={13} /></div>
                      </div>
                      <div className="pop-orden-main">
                        <div className="pop-orden-top">
                          <span className="pop-orden-cod">{codigo}</span>
                          <span className="pop-orden-tipo-label">{tipo.label}</span>
                          {totalItems > 0 && <span className="pop-orden-items">{totalItems} {totalItems === 1 ? "examen" : "exámenes"}</span>}
                        </div>
                        <div className="pop-orden-sub">
                          <span>{formatFecha(o.fecha)}</span>
                          {o.especialidadId?.nombre && <span>· {o.especialidadId.nombre}</span>}
                        </div>
                      </div>
                      <div className="pop-orden-right">
                        <span className={`pop-badge pop-badge--${meta.cls}`}><EstadoIcon size={10} />{meta.label}</span>
                        {esExpandida ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </div>
                    </button>
                    {esExpandida && (
                      <div className="pop-orden-body">
                        {o.estado === "FINALIZADO" && o.archivoResultadoUrl && (
                          <a className="pop-pdf" href={o.archivoResultadoUrl} target="_blank" rel="noreferrer">
                            <FileText size={12} /><span>Ver PDF de resultados</span><ExternalLink size={10} />
                          </a>
                        )}
                        {itemsConResultado.length > 0 ? (
                          <div className="pop-tabla">
                            <div className="pop-tabla-head"><span>Examen</span><span>Resultado</span><span>Unidad</span></div>
                            {itemsConResultado.map((it, idx) => {
                              const ex = typeof it.examenId === "object" ? it.examenId : null;
                              const nombre = ex?.nombre || "Examen";
                              const tipoEx = ex?.tipo ? TIPO_EXAMEN_LABEL[ex.tipo] ?? ex.tipo : "";
                              return (
                                <div key={idx} className="pop-tabla-row">
                                  <span className="pop-tabla-nombre">{nombre}{tipoEx && <span className="pop-tabla-tipo"> · {tipoEx}</span>}</span>
                                  <span className="pop-tabla-valor">{it.valorResultado || "—"}</span>
                                  <span className="pop-tabla-unidad">{it.unidadResultado || ""}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : o.observacionesGenerales ? (
                          <div className="pop-indic">
                            <span className="pop-indic-label">Indicaciones</span>
                            <span className="pop-indic-text">{o.observacionesGenerales}</span>
                          </div>
                        ) : (
                          <div className="pop-sin-result"><Hourglass size={12} /><span>Sin resultados cargados aún</span></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
