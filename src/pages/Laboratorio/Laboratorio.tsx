import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FlaskConical,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  X,
  AlertTriangle,
  Printer,
  CalendarPlus,
} from "lucide-react";
import type {
  OrdenExamen,
  ItemOrden,
  ExamenLaboratorio,
} from "../../services/examen.service";
import {
  ExamenService,
  TIPO_EXAMEN_LABEL,
} from "../../services/examen.service";
import {
  EspecialidadApiService,
  type Especialidad,
} from "../../services/especialidad.service";
import Swal from "sweetalert2";

import "./Laboratorio.css";
import "../ListaCitas/ListaCitas.css";

// ─── Helpers ────────────────────────────────────────────────
const formatFecha = (iso: string) => {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const hora = d.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  return (
    <>
      <span style={{ display: "block" }}>{fecha}</span>
      <span style={{ display: "block", fontSize: "0.85em", color: "var(--text-muted)" }}>{hora}</span>
    </>
  );
};

const ESTADO_CONFIG: Record<string, { label: string; clase: string; icon: typeof Clock }> = {
  PENDIENTE: { label: "Pendiente", clase: "lab-badge--pending", icon: Clock },
  EN_PROCESO: { label: "En proceso", clase: "lab-badge--process", icon: Clock },
  COMPLETADO: { label: "Completado", clase: "lab-badge--done", icon: CheckCircle },
  CANCELADA: { label: "Cancelada", clase: "lab-badge--cancel", icon: XCircle },
  VENCIDA: { label: "Vencida", clase: "lab-badge--vencida", icon: AlertTriangle },
};

const calcularDiasRestantes = (fechaVencimiento?: string): number | null => {
  if (!fechaVencimiento) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaVencimiento);
  vence.setHours(0, 0, 0, 0);
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
};

const IndicadorVencimiento = ({ fechaVencimiento }: { fechaVencimiento?: string }) => {
  const dias = calcularDiasRestantes(fechaVencimiento);
  if (dias === null) return null;

  let clase = "lab-venc--ok";
  if (dias <= 0) clase = "lab-venc--expired";
  else if (dias <= 7) clase = "lab-venc--danger";

  const porcentaje = Math.max(0, Math.min(100, (dias / 30) * 100));

  return (
    <div className={`lab-venc ${clase}`} title={`${dias > 0 ? dias : 0} días restantes`}>
      <div className="lab-venc-bar">
        <div className="lab-venc-fill" style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="lab-venc-text">
        {dias <= 0 ? "Vencida" : `${dias}d`}
      </span>
    </div>
  );
};

// ─── Modal de resultados ─────────────────────────────────────
interface ModalResultadosProps {
  orden: OrdenExamen;
  onCerrar: () => void;
  onGuardado: () => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

const ModalResultados = ({
  orden,
  onCerrar,
  onGuardado,
  showNotification,
}: ModalResultadosProps) => {
  const [valores, setValores] = useState<
    Record<string, { valor: string; unidad: string }>
  >({});
  const [archivos, setArchivos] = useState<Record<string, { file: File; url?: string; subiendo: boolean }>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [camposVacios, setCamposVacios] = useState<Set<string>>(new Set());

  const handleArchivo = async (id: string, file: File) => {
    setArchivos((prev) => ({ ...prev, [id]: { file, subiendo: true } }));
    try {
      const url = await ExamenService.subirArchivo(orden._id, id, file);
      setArchivos((prev) => ({ ...prev, [id]: { file, url, subiendo: false } }));
      showNotification("Archivo subido correctamente", "success");
    } catch {
      setArchivos((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setError("Error al subir el archivo");
    }
  };

  const pendientes = orden.items.filter((i) => i.estadoItem === "PENDIENTE");

  const handleGuardar = async () => {
    setError("");
    setCamposVacios(new Set());

    const seleccionados = pendientes.filter((item) => {
      const ex = typeof item.examenId === "object" ? (item.examenId as ExamenLaboratorio) : null;
      const id = ex ? ex._id : String(item.examenId);
      return !!valores[id]?.valor?.trim();
    });

    if (seleccionados.length === 0) {
      setError("Debes ingresar el resultado de al menos un examen.");
      return;
    }

    const resultados = seleccionados.map((item) => {
      const ex = typeof item.examenId === "object" ? (item.examenId as ExamenLaboratorio) : null;
      const id = ex ? ex._id : String(item.examenId);
      const v = valores[id];
      return {
        examenId: id,
        valorResultado: v.valor.trim(),
        unidadResultado: v.unidad.trim() || undefined,
      };
    });

    setGuardando(true);
    try {
      await ExamenService.cargarResultados(orden._id, resultados);
      showNotification("Resultados guardados correctamente", "success");
      onGuardado();
      onCerrar();
    } catch (err: any) {
      const mensaje =
        err?.response?.data?.message ||
        "Error al guardar resultados. Intenta de nuevo.";
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const paciente = orden.pacienteId;

  return (
    <div className="lab-modal-overlay" onClick={onCerrar}>
      <div className="lab-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="lab-modal-header">
          <h3>Cargar Resultados</h3>
          <span className="lab-modal-paciente">
            {paciente.nombres} {paciente.apellidos} — {paciente.dni}
          </span>
        </div>

        <div className="lab-modal-body">
          {pendientes.length === 0 ? (
            <p className="lab-modal-empty">
              Todos los exámenes ya tienen resultado.
            </p>
          ) : (
            <div className="lab-modal-items">
              {pendientes.map((item, i) => {
                const ex =
                  typeof item.examenId === "object"
                    ? (item.examenId as ExamenLaboratorio)
                    : null;
                const id = ex ? ex._id : String(i);
                return (
                  <div key={id} className="lab-modal-item">
                    <div className="lab-modal-item-nombre">
                      <span>{ex?.nombre ?? "—"}</span>
                      {ex && (
                        <span className="lab-modal-item-tipo">
                          {TIPO_EXAMEN_LABEL[ex.tipo]}
                        </span>
                      )}
                      {ex?.referenciaTexto && (
                        <span className="lab-modal-item-ref">
                          Ref: {ex.referenciaTexto}
                        </span>
                      )}
                      {ex?.referenciaMin !== undefined &&
                        ex?.referenciaMax !== undefined && (
                          <span className="lab-modal-item-ref">
                            Ref: {ex.referenciaMin} – {ex.referenciaMax}{" "}
                            {ex.unidad}
                          </span>
                        )}
                    </div>
                    <div className="lab-modal-item-inputs">
                      <input
                        type="text"
                        placeholder="Valor *"
                        className={
                          camposVacios.has(id) ? "lab-input-error" : ""
                        }
                        value={valores[id]?.valor ?? ""}
                        onChange={(e) => {
                          setCamposVacios((prev) => {
                            const next = new Set(prev);
                            next.delete(id);
                            return next;
                          });
                          setError("");
                          setValores((prev) => ({
                            ...prev,
                            [id]: {
                              valor: e.target.value,
                              unidad: prev[id]?.unidad ?? ex?.unidad ?? "",
                            },
                          }));
                        }}
                      />
                      <input
                        type="text"
                        placeholder={ex?.unidad || "Unidad"}
                        value={valores[id]?.unidad ?? ex?.unidad ?? ""}
                        onChange={(e) =>
                          setValores((prev) => ({
                            ...prev,
                            [id]: {
                              valor: prev[id]?.valor ?? "",
                              unidad: e.target.value,
                            },
                          }))
                        }
                        className="lab-modal-item-unidad"
                      />
                    </div>
                    <div className="lab-modal-item-archivo">
                      {archivos[id]?.url ? (
                        <a href={archivos[id].url} target="_blank" rel="noopener noreferrer" className="lab-archivo-link">
                          📎 Archivo subido — ver
                        </a>
                      ) : archivos[id]?.subiendo ? (
                        <span className="lab-archivo-subiendo">Subiendo archivo...</span>
                      ) : (
                        <label className="lab-archivo-btn">
                          📎 Adjuntar archivo
                          <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleArchivo(id, f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {item.observaciones && (
                      <p className="lab-modal-item-obs">
                        Obs: {item.observaciones}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lab-modal-footer">
          {error && <p className="lab-modal-error">{error}</p>}
          <button className="lab-btn lab-btn--cancel" onClick={onCerrar}>
            Cancelar
          </button>
          {pendientes.length > 0 && (
            <button
              className="lab-btn lab-btn--primary"
              onClick={handleGuardar}
              disabled={guardando}
            >
              {(() => {
                if (guardando) return "Guardando...";
                const inputsLlenos = pendientes.filter((item) => {
                  const ex = typeof item.examenId === "object" ? (item.examenId as ExamenLaboratorio) : null;
                  const id = ex ? ex._id : String(item.examenId);
                  return !!valores[id]?.valor?.trim();
                }).length;
                if (inputsLlenos > 0 && inputsLlenos < pendientes.length) {
                  return `Guardar Parcial (${inputsLlenos}/${pendientes.length})`;
                }
                return "Completar Orden";
              })()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Fila de orden ────────────────────────────────────────────
interface FilaOrdenProps {
  orden: OrdenExamen;
  onCargarResultados: (orden: OrdenExamen) => void;
  onCancelarOrden: (ordenId: string) => void;
  onGenerarCitaLab: (orden: OrdenExamen) => void;
  onImprimir: (ordenId: string) => void;
}

const FilaOrden = ({
  orden,
  onCargarResultados,
  onCancelarOrden,
  onGenerarCitaLab,
  onImprimir,
}: FilaOrdenProps) => {
  const [expandido, setExpandido] = useState(false);
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null);
  const cfg = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG.PENDIENTE;
  const Icon = cfg.icon;
  const paciente = orden.pacienteId;
  const doctor = orden.doctorId;

  return (
    <div className={`lab-orden${expandido ? " lab-orden--open" : ""}`}>
      <div className="lab-orden-row" onClick={() => setExpandido(!expandido)}>
        <div className="lab-orden-col lab-orden-paciente">
          <div className="lab-avatar">{paciente.nombres.charAt(0)}</div>
          <div>
            <span className="lab-nombre">
              {paciente.nombres} {paciente.apellidos}
            </span>
            <span className="lab-dni">DNI: {paciente.dni}</span>
          </div>
        </div>
        <div className="lab-orden-col">
          <span className="lab-text-sm">
            {doctor.nombres} {doctor.apellidos}
          </span>
          <span className="lab-text-muted">{orden.especialidadId.nombre}</span>
        </div>
        <div className="lab-orden-col">
          {orden.codigoOrden && (
            <span className="lab-codigo">{orden.codigoOrden}</span>
          )}
          <span className="lab-text-sm">{formatFecha(orden.fecha)}</span>
          <span className="lab-text-muted">
            {orden.items.length} examen{orden.items.length !== 1 ? "es" : ""}
          </span>
        </div>
        <div className="lab-orden-col" style={{ alignItems: "center", gap: "0.4rem" }}>
          <span className={`lab-badge ${cfg.clase}`}>
            <Icon size={12} />
            {cfg.label}
          </span>
          {orden.estado === "PENDIENTE" && (
            <IndicadorVencimiento fechaVencimiento={orden.fechaVencimiento} />
          )}
        </div>
        <div className="lab-orden-col lab-orden-actions">
          {orden.estado === "PENDIENTE" && !orden.citaLabId && (
            <button
              className="lab-action-btn lab-action-btn--primary"
              onClick={(e) => { e.stopPropagation(); onGenerarCitaLab(orden); }}
              title="Generar cita de laboratorio"
            >
              <CalendarPlus size={15} />
            </button>
          )}
          {(orden.estado === "PENDIENTE" || orden.estado === "EN_PROCESO") && (
            <button
              className="lab-action-btn lab-action-btn--primary"
              onClick={(e) => { e.stopPropagation(); onCargarResultados(orden); }}
              title="Cargar resultados"
            >
              <FlaskConical size={15} />
            </button>
          )}
          <button
            className="lab-action-btn lab-action-btn--neutral"
            onClick={(e) => { e.stopPropagation(); onImprimir(orden._id); }}
            title="Imprimir orden"
          >
            <Printer size={15} />
          </button>
          {orden.estado === "PENDIENTE" && (
            <button
              className="lab-action-btn lab-action-btn--danger"
              onClick={(e) => { e.stopPropagation(); onCancelarOrden(orden._id); }}
              title="Cancelar orden"
            >
              <XCircle size={15} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {expandido ? (
            <ChevronUp size={16} className="lab-chevron" />
          ) : (
            <ChevronDown size={16} className="lab-chevron" />
          )}
        </div>
      </div>

      {expandido && (
        <div className="lab-orden-detalle">
          {orden.observacionesGenerales && (
            <p className="lab-orden-obs">
              <strong>Indicaciones:</strong> {orden.observacionesGenerales}
            </p>
          )}
          <table className="lab-tabla">
            <thead>
              <tr>
                <th>Examen</th>
                <th>Tipo</th>
                <th>Resultado</th>
                <th>Archivo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orden.items.map((item: ItemOrden, i) => {
                const ex =
                  typeof item.examenId === "object"
                    ? (item.examenId as ExamenLaboratorio)
                    : null;
                return (
                  <tr key={i}>
                    <td>{ex?.nombre ?? "—"}</td>
                    <td>
                      <span className="lab-tipo-chip">
                        {ex ? TIPO_EXAMEN_LABEL[ex.tipo] : "—"}
                      </span>
                    </td>
                    <td>
                      {item.valorResultado ? (
                        <span className="lab-resultado">
                          {item.valorResultado} {item.unidadResultado}
                        </span>
                      ) : (
                        <span className="lab-text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {item.archivoUrl ? (
                        <button
                          className="lab-archivo-ver"
                          onClick={() => setArchivoPreview(item.archivoUrl!)}
                        >
                          📄 Ver archivo
                        </button>
                      ) : (
                        <span className="lab-text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`lab-badge ${item.estadoItem === "COMPLETADO" ? "lab-badge--done" : "lab-badge--pending"}`}
                      >
                        {item.estadoItem === "COMPLETADO"
                          ? "Listo"
                          : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {archivoPreview && (
        <div className="lab-modal-overlay" onClick={() => setArchivoPreview(null)}>
          <div className="lab-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lab-preview-header">
              <h3>Vista previa del archivo</h3>
              <button className="lab-preview-close" onClick={() => setArchivoPreview(null)}>✕</button>
            </div>
            <div className="lab-preview-body">
              {archivoPreview.match(/\.(jpg|jpeg|png|gif|webp|avif|bmp)(\?|$)/i) ? (
                <img src={archivoPreview} alt="Resultado" className="lab-preview-img" />
              ) : archivoPreview.match(/\.pdf(\?|$)/i) ? (
                <iframe src={archivoPreview} className="lab-preview-iframe" title="PDF" />
              ) : (
                <div className="lab-preview-fallback">
                  <p>No se puede previsualizar este tipo de archivo.</p>
                  <a href={archivoPreview} target="_blank" rel="noopener noreferrer" className="lab-btn lab-btn--primary">
                    Descargar archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Página principal ─────────────────────────────────────────
type FiltroEstado = "TODOS" | "PENDIENTE" | "EN_PROCESO" | "COMPLETADO" | "VENCIDA";

// ── Modal Generar Cita Lab ──
interface ModalCitaLabProps {
  orden: OrdenExamen;
  onCerrar: () => void;
  onGenerado: () => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

const ModalCitaLab = ({ orden, onCerrar, onGenerado, showNotification }: ModalCitaLabProps) => {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const hoy = new Date();
  const fechaEmision = hoy.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  const fechaVigencia = new Date(hoy);
  fechaVigencia.setDate(fechaVigencia.getDate() + 7);
  const fechaVigenciaStr = fechaVigencia.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });

  const examenesList = orden.items
    .map((item) => (typeof item.examenId === "object" ? (item.examenId as ExamenLaboratorio).nombre : null))
    .filter(Boolean)
    .join(" · ");

  // Compilar instrucciones únicas de los exámenes de la orden
  const instruccionesUnicas = [
    ...new Set(
      orden.items
        .map((item) => (typeof item.examenId === "object" ? (item.examenId as ExamenLaboratorio).instrucciones : null))
        .filter((i): i is string => !!i?.trim())
    ),
  ];

  const handleGenerar = async () => {
    setGuardando(true);
    setError("");
    try {
      await ExamenService.generarCitaLab(orden._id);
      showNotification("Autorización de laboratorio generada correctamente", "success");
      onGenerado();
      onCerrar();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al generar la autorización");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="lab-modal-overlay" onClick={onCerrar}>
      <div className="lab-modal-card lab-modal-card--citalab" onClick={(e) => e.stopPropagation()}>
        <div className="lab-modal-header">
          <h3>Generar Autorización de Laboratorio</h3>
          <span className="lab-modal-paciente">
            {orden.pacienteId.nombres} {orden.pacienteId.apellidos} — DNI {orden.pacienteId.dni}
          </span>
          {orden.codigoOrden && (
            <span className="lab-modal-codigo-tag">Orden: {orden.codigoOrden}</span>
          )}
        </div>

        <div className="lab-modal-body lab-modal-body--citalab">
          {/* Exámenes solicitados */}
          <div className="lab-citalab-examenes">
            <span className="lab-citalab-examenes-label">Exámenes:</span>
            <span className="lab-citalab-examenes-lista">{examenesList || "—"}</span>
          </div>

          {/* Período de vigencia */}
          <div className="lab-citalab-vigencia">
            <div className="lab-citalab-vigencia-row">
              <span className="lab-citalab-vigencia-label">Fecha de emisión</span>
              <span className="lab-citalab-vigencia-val">{fechaEmision}</span>
            </div>
            <div className="lab-citalab-vigencia-row">
              <span className="lab-citalab-vigencia-label">Válida hasta</span>
              <span className="lab-citalab-vigencia-val lab-citalab-vigencia-val--vence">{fechaVigenciaStr}</span>
            </div>
            <p className="lab-citalab-vigencia-info">
              El paciente puede presentarse al laboratorio cualquier día hábil dentro del período de vigencia. Vencido el plazo, la autorización no puede ser reprogramada.
            </p>
          </div>

          {/* Instrucciones de preparación */}
          {instruccionesUnicas.length > 0 && (
            <div>
              <p className="lab-citalab-section-title">Indicaciones de preparación</p>
              {instruccionesUnicas.map((instr, i) => (
                <div key={i} className="lab-citalab-nota">
                  <AlertTriangle size={13} />
                  <span style={{ whiteSpace: "pre-line" }}>{instr}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lab-modal-footer">
          {error && <p className="lab-modal-error">{error}</p>}
          <button className="lab-btn lab-btn--cancel" onClick={onCerrar}>Cancelar</button>
          <button
            className="lab-btn lab-btn--primary"
            onClick={handleGenerar}
            disabled={guardando}
          >
            {guardando ? "Generando..." : "Confirmar Autorización"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FiltrosAvanzados {
  paciente: string;
  especialidadId: string;
  fechaInicio: string;
  fechaFin: string;
}

const ITEMS_POR_PAGINA = 10;

const filtrosVacios: FiltrosAvanzados = {
  paciente: "",
  especialidadId: "",
  fechaInicio: "",
  fechaFin: "",
};

const Laboratorio = () => {
  const [ordenes, setOrdenes] = useState<OrdenExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("PENDIENTE");
  const [filtros, setFiltros] = useState<FiltrosAvanzados>(filtrosVacios);
  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenModal, setOrdenModal] = useState<OrdenExamen | null>(null);
  const [ordenCitaLab, setOrdenCitaLab] = useState<OrdenExamen | null>(null);
  const [busquedaCodigo, setBusquedaCodigo] = useState("");
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | ""; visible: boolean }>({ message: "", type: "", visible: false });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga("");
    try {
      const data = await ExamenService.listarOrdenesPendientes(true);
      setOrdenes(data);
    } catch {
      setErrorCarga(
        "No se pudieron cargar las órdenes. Verifica tu conexión e intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    EspecialidadApiService.listar()
      .then(setEspecialidades)
      .catch(() => {});
  }, []);

  const handleBuscarPorCodigo = async () => {
    if (!busquedaCodigo.trim()) return;
    try {
      const orden = await ExamenService.buscarPorCodigo(busquedaCodigo.trim());
      setOrdenes([orden]);
      setFiltroEstado("TODOS");
    } catch {
      Swal.fire("No encontrado", "No se encontró una orden con ese código.", "info");
    }
  };

  const handleImprimir = (ordenId: string) => {
    window.open(`/ordenes/${ordenId}/imprimir`, "_blank");
  };

  const handleCancelarOrden = async (ordenId: string) => {
    const result = await Swal.fire({
      title: "¿Cancelar esta orden?",
      text: "Esta acción no se puede deshacer. Los exámenes pendientes no se procesarán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, cancelar orden",
      cancelButtonText: "No, mantener",
    });
    if (!result.isConfirmed) return;
    try {
      await ExamenService.cancelarOrden(ordenId);
      showNotification("Orden cancelada correctamente", "success");
      await cargar();
    } catch {
      Swal.fire("Error", "No se pudo cancelar la orden.", "error");
    }
  };

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((orden) => {
      if (filtroEstado !== "TODOS" && orden.estado !== filtroEstado)
        return false;

      if (busquedaCodigo && busquedaCodigo.length >= 3) {
        const codigo = (orden.codigoOrden || "").toLowerCase();
        if (!codigo.includes(busquedaCodigo.toLowerCase())) return false;
      }

      if (filtros.paciente && filtros.paciente.length >= 3) {
        const nombre =
          `${orden.pacienteId.nombres} ${orden.pacienteId.apellidos}`.toLowerCase();
        if (!nombre.includes(filtros.paciente.toLowerCase())) return false;
      }

      if (
        filtros.especialidadId &&
        orden.especialidadId._id !== filtros.especialidadId
      )
        return false;

      if (filtros.fechaInicio || filtros.fechaFin) {
        const d = new Date(orden.fecha);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const fechaOrdenLocal = `${y}-${m}-${day}`;

        if (filtros.fechaInicio && fechaOrdenLocal < filtros.fechaInicio) return false;
        if (filtros.fechaFin && fechaOrdenLocal > filtros.fechaFin) return false;
      }

      return true;
    });
  }, [ordenes, filtroEstado, filtros]);

  const totalPaginas = Math.ceil(ordenesFiltradas.length / ITEMS_POR_PAGINA);

  const ordenesPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return ordenesFiltradas.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [ordenesFiltradas, paginaActual]);

  const hayFiltrosActivos =
    filtros.paciente ||
    filtros.especialidadId ||
    filtros.fechaInicio ||
    filtros.fechaFin ||
    busquedaCodigo;

  const conteo: Record<FiltroEstado, number> = {
    TODOS: ordenes.length,
    PENDIENTE: ordenes.filter((o) => o.estado === "PENDIENTE").length,
    EN_PROCESO: ordenes.filter((o) => o.estado === "EN_PROCESO").length,
    COMPLETADO: ordenes.filter((o) => o.estado === "COMPLETADO").length,
    VENCIDA: ordenes.filter((o) => o.estado === "VENCIDA").length,
  };

  return (
    <div className="lab-page">
      {notification.visible && <div className={`notification ${notification.type}`}>{notification.message}</div>}
      <div className="lab-header">
        <div className="lab-header-title">
          <FlaskConical size={24} className="lab-header-icon" />
          <div>
            <h1>Laboratorio</h1>
            <p>Gestión de órdenes de exámenes</p>
          </div>
        </div>
      </div>

      <div className="lab-filtros">
        {(
          ["PENDIENTE", "EN_PROCESO", "TODOS", "COMPLETADO", "VENCIDA"] as FiltroEstado[]
        ).map((f) => (
          <button
            key={f}
            className={`lab-filtro-btn${filtroEstado === f ? " active" : ""}`}
            onClick={() => {
              setFiltroEstado(f);
              setPaginaActual(1);
            }}
          >
            {f === "TODOS" ? "Todos"
              : f === "EN_PROCESO" ? "En proceso"
              : f === "COMPLETADO" ? "Completados"
              : f === "VENCIDA" ? "Vencidas"
              : "Pendientes"}
            <span className="lab-filtro-count">{conteo[f]}</span>
          </button>
        ))}
      </div>

      <div className="lab-filtros-avanzados">
        <div className="lab-filtro-campo">
          <span className="lab-filtro-label">Código de orden</span>
          <div className="lab-filtro-codigo-grupo">
            <div style={{ position: "relative" }}>
              <Search size={15} className="lab-filtro-campo-icon" />
              <input
                type="text"
                placeholder="ORD-..."
                value={busquedaCodigo}
                onChange={(e) => setBusquedaCodigo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuscarPorCodigo()}
                className="lab-filtro-input lab-filtro-input--codigo"
              />
            </div>
            <button className="lab-btn-codigo-buscar" onClick={handleBuscarPorCodigo}>
              Buscar
            </button>
          </div>
        </div>

        <div className="lab-filtro-campo">
          <span className="lab-filtro-label">Paciente</span>
          <div style={{ position: "relative" }}>
            <Search size={15} className="lab-filtro-campo-icon" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={filtros.paciente}
              onChange={(e) => {
                setFiltros((p) => ({ ...p, paciente: e.target.value }));
                setPaginaActual(1);
              }}
              className="lab-filtro-input"
            />
          </div>
        </div>

        <div className="lab-filtro-campo">
          <span className="lab-filtro-label">Especialidad</span>
          <select
            value={filtros.especialidadId}
            onChange={(e) => {
              setFiltros((p) => ({ ...p, especialidadId: e.target.value }));
              setPaginaActual(1);
            }}
            className="lab-filtro-select"
          >
            <option value="">Todas las especialidades</option>
            {especialidades.map((esp) => (
              <option key={esp.id} value={esp.id}>
                {esp.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="lab-filtro-campo">
          <span className="lab-filtro-label">Desde</span>
          <input
            type="date"
            value={filtros.fechaInicio}
            onChange={(e) => {
              setFiltros((p) => ({ ...p, fechaInicio: e.target.value }));
              setPaginaActual(1);
            }}
            className="lab-filtro-date"
          />
        </div>

        <div className="lab-filtro-campo">
          <span className="lab-filtro-label">Hasta</span>
          <input
            type="date"
            value={filtros.fechaFin}
            onChange={(e) => {
              setFiltros((p) => ({ ...p, fechaFin: e.target.value }));
              setPaginaActual(1);
            }}
            className="lab-filtro-date"
          />
        </div>

        {hayFiltrosActivos && (
          <div className="lab-filtro-campo">
            <span className="lab-filtro-label" style={{ visibility: "hidden" }}>
              _
            </span>
            <button
              className="lab-btn-limpiar"
              onClick={() => {
                setFiltros(filtrosVacios);
                setBusquedaCodigo("");
                setPaginaActual(1);
                cargar();
              }}
            >
              <X size={14} /> Limpiar
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="lab-loading">
          <div className="spinner-small" />
          <p>Cargando órdenes...</p>
        </div>
      ) : errorCarga ? (
        <div className="lab-error">
          <XCircle size={40} />
          <p>{errorCarga}</p>
          <button className="lab-btn lab-btn--primary" onClick={cargar}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="lab-resultados-info">
            <span>
              {ordenesFiltradas.length} orden
              {ordenesFiltradas.length !== 1 ? "es" : ""} encontrada
              {ordenesFiltradas.length !== 1 ? "s" : ""}
            </span>
          </div>

          {ordenesFiltradas.length === 0 ? (
            <div className="lab-empty">
              <FlaskConical size={40} />
              <p>No hay órdenes con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="lab-lista">
              <div className="lab-lista-header">
                <span className="center">Paciente</span>
                <span>Doctor / Especialidad</span>
                <span>Fecha / Exámenes</span>
                <span className="center">Estado</span>
                <span className="center">Acciones</span>
                <span></span>
              </div>
              {ordenesPaginadas.map((orden) => (
                <FilaOrden
                  key={orden._id}
                  orden={orden}
                  onCargarResultados={setOrdenModal}
                  onCancelarOrden={handleCancelarOrden}
                  onGenerarCitaLab={setOrdenCitaLab}
                  onImprimir={handleImprimir}
                />
              ))}
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="lab-paginacion">
              <button
                className="lab-pag-btn"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((p) => p - 1)}
              >
                Anterior
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                (num) => (
                  <button
                    key={num}
                    className={`lab-pag-btn${paginaActual === num ? " lab-pag-btn--active" : ""}`}
                    onClick={() => setPaginaActual(num)}
                  >
                    {num}
                  </button>
                ),
              )}

              <button
                className="lab-pag-btn"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {ordenModal && (
        <ModalResultados
          orden={ordenModal}
          onCerrar={() => setOrdenModal(null)}
          onGuardado={cargar}
          showNotification={showNotification}
        />
      )}

      {ordenCitaLab && (
        <ModalCitaLab
          orden={ordenCitaLab}
          onCerrar={() => setOrdenCitaLab(null)}
          onGenerado={cargar}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

export default Laboratorio;
