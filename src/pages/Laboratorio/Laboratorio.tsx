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

  const handleGuardar = async () => {
    const resultados = Object.entries(valores)
      .filter(([, v]) => v.valor.trim() !== "")
      .map(([examenId, v]) => ({
        examenId,
        valorResultado: v.valor.trim(),
        unidadResultado: v.unidad.trim() || undefined,
      }));

    if (resultados.length === 0) return;
    setGuardando(true);
    try {
      await ExamenService.cargarResultados(orden._id, resultados);
      onGuardado();
      onCerrar();
    } catch (error) {
      console.error("Error al guardar resultados:", error);
    } finally {
      setGuardando(false);
    }
  };

  const paciente = orden.pacienteId;
  const pendientes = orden.items.filter((i) => i.estadoItem === "PENDIENTE");

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
                        placeholder="Valor"
                        value={valores[id]?.valor ?? ""}
                        onChange={(e) =>
                          setValores((prev) => ({
                            ...prev,
                            [id]: { valor: e.target.value, unidad: prev[id]?.unidad ?? ex?.unidad ?? "" },
                          }))
                        }
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
}

const FilaOrden = ({ orden, onCargarResultados }: FilaOrdenProps) => {
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
            <button
              className="lab-btn lab-btn--sm lab-btn--primary"
              onClick={(e) => { e.stopPropagation(); onCargarResultados(orden); }}
            >
              Cargar Resultados
            </button>
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
  const [filtro, setFiltro] = useState<FiltroEstado>("PENDIENTE");
  const [ordenModal, setOrdenModal] = useState<OrdenExamen | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ExamenService.listarOrdenesPendientes();
      setOrdenes(data);
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

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
