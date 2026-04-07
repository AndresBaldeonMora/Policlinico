import { useEffect, useState, useCallback } from "react";
import { FlaskConical, ChevronDown, ChevronUp, CheckCircle, Clock, XCircle } from "lucide-react";
import type {
  OrdenExamen,
  ItemOrden,
  ExamenLaboratorio,
} from "../../services/examen.service";
import {
  ExamenService,
  TIPO_EXAMEN_LABEL,
} from "../../services/examen.service";
import Swal from "sweetalert2";
import { toastExito } from "../../utils/toast";
import "./Laboratorio.css";

// ─── Helpers ────────────────────────────────────────────────
const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

const ESTADO_CONFIG = {
  PENDIENTE:   { label: "Pendiente",   clase: "lab-badge--pending",  icon: Clock },
  EN_PROCESO:  { label: "En proceso",  clase: "lab-badge--process",  icon: Clock },
  COMPLETADO:  { label: "Completado",  clase: "lab-badge--done",     icon: CheckCircle },
  CANCELADA:   { label: "Cancelada",   clase: "lab-badge--cancel",   icon: XCircle },
};

// ─── Modal de resultados ─────────────────────────────────────
interface ModalResultadosProps {
  orden: OrdenExamen;
  onCerrar: () => void;
  onGuardado: () => void;
}

const ModalResultados = ({ orden, onCerrar, onGuardado }: ModalResultadosProps) => {
  const [valores, setValores] = useState<Record<string, { valor: string; unidad: string }>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [camposVacios, setCamposVacios] = useState<Set<string>>(new Set());

  const pendientes = orden.items.filter((i) => i.estadoItem === "PENDIENTE");

  const handleGuardar = async () => {
    setError("");
    setCamposVacios(new Set());

    // Validar que todos los exámenes pendientes tengan un valor
    const vacios = new Set<string>();
    pendientes.forEach((item) => {
      const ex = typeof item.examenId === "object" ? item.examenId as ExamenLaboratorio : null;
      const id = ex ? ex._id : String(item.examenId);
      const val = valores[id]?.valor?.trim();
      if (!val) vacios.add(id);
    });

    if (vacios.size > 0) {
      setCamposVacios(vacios);
      setError(`Debes ingresar el resultado de todos los exámenes (${vacios.size} vacío${vacios.size > 1 ? "s" : ""}).`);
      return;
    }

    const resultados = pendientes.map((item) => {
      const ex = typeof item.examenId === "object" ? item.examenId as ExamenLaboratorio : null;
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
      toastExito("Resultados guardados correctamente");
      onGuardado();
      onCerrar();
    } catch (err: any) {
      const mensaje =
        err?.response?.data?.message || "Error al guardar resultados. Intenta de nuevo.";
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
            <p className="lab-modal-empty">Todos los exámenes ya tienen resultado.</p>
          ) : (
            <div className="lab-modal-items">
              {pendientes.map((item, i) => {
                const ex = typeof item.examenId === "object" ? item.examenId as ExamenLaboratorio : null;
                const id = ex ? ex._id : String(i);
                return (
                  <div key={id} className="lab-modal-item">
                    <div className="lab-modal-item-nombre">
                      <span>{ex?.nombre ?? "—"}</span>
                      {ex && <span className="lab-modal-item-tipo">{TIPO_EXAMEN_LABEL[ex.tipo]}</span>}
                      {ex?.referenciaTexto && (
                        <span className="lab-modal-item-ref">Ref: {ex.referenciaTexto}</span>
                      )}
                      {ex?.referenciaMin !== undefined && ex?.referenciaMax !== undefined && (
                        <span className="lab-modal-item-ref">
                          Ref: {ex.referenciaMin} – {ex.referenciaMax} {ex.unidad}
                        </span>
                      )}
                    </div>
                    <div className="lab-modal-item-inputs">
                      <input
                        type="text"
                        placeholder="Valor *"
                        className={camposVacios.has(id) ? "lab-input-error" : ""}
                        value={valores[id]?.valor ?? ""}
                        onChange={(e) => {
                          setCamposVacios((prev) => { const next = new Set(prev); next.delete(id); return next; });
                          setError("");
                          setValores((prev) => ({
                            ...prev,
                            [id]: { valor: e.target.value, unidad: prev[id]?.unidad ?? ex?.unidad ?? "" },
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
                            [id]: { valor: prev[id]?.valor ?? "", unidad: e.target.value },
                          }))
                        }
                        className="lab-modal-item-unidad"
                      />
                    </div>
                    {item.observaciones && (
                      <p className="lab-modal-item-obs">Obs: {item.observaciones}</p>
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
              {guardando ? "Guardando..." : "Guardar Resultados"}
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
}

const FilaOrden = ({ orden, onCargarResultados, onCancelarOrden }: FilaOrdenProps) => {
  const [expandido, setExpandido] = useState(false);
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
            <span className="lab-nombre">{paciente.nombres} {paciente.apellidos}</span>
            <span className="lab-dni">DNI: {paciente.dni}</span>
          </div>
        </div>
        <div className="lab-orden-col">
          <span className="lab-text-sm">{doctor.nombres} {doctor.apellidos}</span>
          <span className="lab-text-muted">{orden.especialidadId.nombre}</span>
        </div>
        <div className="lab-orden-col">
          <span className="lab-text-sm">{formatFecha(orden.fecha)}</span>
          <span className="lab-text-muted">{orden.items.length} examen{orden.items.length !== 1 ? "es" : ""}</span>
        </div>
        <div className="lab-orden-col lab-orden-actions">
          <span className={`lab-badge ${cfg.clase}`}>
            <Icon size={12} />
            {cfg.label}
          </span>
          {(orden.estado === "PENDIENTE" || orden.estado === "EN_PROCESO") && (
            <>
              <button
                className="lab-btn lab-btn--sm lab-btn--primary"
                onClick={(e) => { e.stopPropagation(); onCargarResultados(orden); }}
              >
                Cargar Resultados
              </button>
              <button
                className="lab-btn lab-btn--sm lab-btn--danger"
                onClick={(e) => { e.stopPropagation(); onCancelarOrden(orden._id); }}
              >
                Cancelar
              </button>
            </>
          )}
          {expandido ? <ChevronUp size={16} className="lab-chevron" /> : <ChevronDown size={16} className="lab-chevron" />}
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
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orden.items.map((item: ItemOrden, i) => {
                const ex = typeof item.examenId === "object" ? item.examenId as ExamenLaboratorio : null;
                return (
                  <tr key={i}>
                    <td>{ex?.nombre ?? "—"}</td>
                    <td><span className="lab-tipo-chip">{ex ? TIPO_EXAMEN_LABEL[ex.tipo] : "—"}</span></td>
                    <td>
                      {item.valorResultado
                        ? <span className="lab-resultado">{item.valorResultado} {item.unidadResultado}</span>
                        : <span className="lab-text-muted">—</span>
                      }
                    </td>
                    <td>
                      <span className={`lab-badge ${item.estadoItem === "COMPLETADO" ? "lab-badge--done" : "lab-badge--pending"}`}>
                        {item.estadoItem === "COMPLETADO" ? "Listo" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Página principal ─────────────────────────────────────────
type FiltroEstado = "TODOS" | "PENDIENTE" | "EN_PROCESO" | "COMPLETADO";

const Laboratorio = () => {
  const [ordenes, setOrdenes] = useState<OrdenExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("PENDIENTE");
  const [ordenModal, setOrdenModal] = useState<OrdenExamen | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga("");
    try {
      const data = await ExamenService.listarOrdenesPendientes();
      setOrdenes(data);
    } catch {
      setErrorCarga("No se pudieron cargar las órdenes. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

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
      toastExito("Orden cancelada correctamente");
      await cargar();
    } catch {
      Swal.fire("Error", "No se pudo cancelar la orden.", "error");
    }
  };

  const ordenesFiltradas = filtro === "TODOS"
    ? ordenes
    : ordenes.filter((o) => o.estado === filtro);

  const conteo = {
    TODOS: ordenes.length,
    PENDIENTE: ordenes.filter((o) => o.estado === "PENDIENTE").length,
    EN_PROCESO: ordenes.filter((o) => o.estado === "EN_PROCESO").length,
    COMPLETADO: ordenes.filter((o) => o.estado === "COMPLETADO").length,
  };

  return (
    <div className="lab-page">
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
        {(["PENDIENTE", "EN_PROCESO", "TODOS", "COMPLETADO"] as FiltroEstado[]).map((f) => (
          <button
            key={f}
            className={`lab-filtro-btn${filtro === f ? " active" : ""}`}
            onClick={() => setFiltro(f)}
          >
            {f === "TODOS" ? "Todos" : f === "EN_PROCESO" ? "En proceso" : f === "COMPLETADO" ? "Completados" : "Pendientes"}
            <span className="lab-filtro-count">{conteo[f]}</span>
          </button>
        ))}
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
      ) : ordenesFiltradas.length === 0 ? (
        <div className="lab-empty">
          <FlaskConical size={40} />
          <p>No hay órdenes {filtro !== "TODOS" ? `con estado "${filtro}"` : ""}</p>
        </div>
      ) : (
        <div className="lab-lista">
          <div className="lab-lista-header">
            <span>Paciente</span>
            <span>Doctor / Especialidad</span>
            <span>Fecha / Exámenes</span>
            <span>Estado</span>
          </div>
          {ordenesFiltradas.map((orden) => (
            <FilaOrden
              key={orden._id}
              orden={orden}
              onCargarResultados={setOrdenModal}
              onCancelarOrden={handleCancelarOrden}
            />
          ))}
        </div>
      )}

      {ordenModal && (
        <ModalResultados
          orden={ordenModal}
          onCerrar={() => setOrdenModal(null)}
          onGuardado={cargar}
        />
      )}
    </div>
  );
};

export default Laboratorio;
