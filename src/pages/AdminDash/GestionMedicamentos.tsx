import { useEffect, useReducer, useState } from "react";
import { Search, Plus, Pencil, Power, Pill, X, AlertCircle, Check } from "lucide-react";
import {
  MedicamentoApiService,
  type Medicamento,
} from "../../services/medicamento.service";
import "./GestionMedicamentos.css";

// ─── Tipos del modal ──────────────────────────────────────────
interface FormFields {
  nombre: string;
  principioActivo: string;
  presentacion: string;
  concentracion: string;
  formaFarmaceutica: string;
  viaAdministracion: string;
}

const FORMAS_FARMACEUTICAS = ["Tableta", "Cápsula", "Jarabe", "Ampolla", "Crema", "Otra"];
const VIAS_ADMINISTRACION = ["VO", "IV", "IM", "SC", "Tópico", "Inhalatoria", "Otra"];

interface ModalState {
  abierto: boolean;
  medicamento: Medicamento | null;
  campos: FormFields;
  loading: boolean;
  error: string;
}

type ModalAction =
  | { type: "ABRIR_NUEVO" }
  | { type: "ABRIR_EDITAR"; medicamento: Medicamento }
  | { type: "CERRAR" }
  | { type: "SET_CAMPO"; field: keyof FormFields; value: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ERROR"; message: string };

const camposVacios: FormFields = {
  nombre: "",
  principioActivo: "",
  presentacion: "",
  concentracion: "",
  formaFarmaceutica: "Tableta",
  viaAdministracion: "VO",
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "ABRIR_NUEVO":
      return { abierto: true, medicamento: null, campos: camposVacios, loading: false, error: "" };
    case "ABRIR_EDITAR":
      return {
        abierto: true,
        medicamento: action.medicamento,
        campos: {
          nombre: action.medicamento.nombre,
          principioActivo: action.medicamento.principioActivo,
          presentacion: action.medicamento.presentacion,
          concentracion: action.medicamento.concentracion ?? "",
          formaFarmaceutica: action.medicamento.formaFarmaceutica ?? "Tableta",
          viaAdministracion: action.medicamento.viaAdministracion ?? "VO",
        },
        loading: false,
        error: "",
      };
    case "CERRAR":
      return { ...state, abierto: false, error: "" };
    case "SET_CAMPO":
      return { ...state, campos: { ...state.campos, [action.field]: action.value }, error: "" };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_ERROR":
      return { ...state, error: action.message, loading: false };
    default:
      return state;
  }
}

interface NotificationState {
  message: string;
  type: "success" | "error" | "";
  visible: boolean;
}

// ─── Componente principal ─────────────────────────────────────
const GestionMedicamentos = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({ message: "", type: "", visible: false });

  const [modal, dispatch] = useReducer(modalReducer, {
    abierto: false, medicamento: null, campos: camposVacios, loading: false, error: "",
  });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
  };

  const cargar = async () => {
    try {
      setCargando(true);
      setMedicamentos(await MedicamentoApiService.listar({ todos: true }));
    } catch {
      showNotification("Error al cargar el catálogo.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = medicamentos.filter((m) => {
    const q = busqueda.toLowerCase();
    return (
      m.nombre.toLowerCase().includes(q) ||
      m.principioActivo.toLowerCase().includes(q) ||
      m.presentacion.toLowerCase().includes(q) ||
      (m.concentracion ?? "").toLowerCase().includes(q) ||
      (m.formaFarmaceutica ?? "").toLowerCase().includes(q)
    );
  });

  const validar = (): string | null => {
    const { nombre, principioActivo, presentacion, concentracion, formaFarmaceutica, viaAdministracion } = modal.campos;
    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (!principioActivo.trim()) return "El principio activo es obligatorio.";
    if (!presentacion.trim()) return "La presentación es obligatoria.";
    if (!concentracion.trim()) return "La concentración es obligatoria.";
    if (!formaFarmaceutica) return "La forma farmacéutica es obligatoria.";
    if (!viaAdministracion) return "La vía de administración es obligatoria.";
    return null;
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validar();
    if (err) { dispatch({ type: "SET_ERROR", message: err }); return; }
    dispatch({ type: "SET_LOADING", value: true });
    try {
      const {
        nombre,
        principioActivo,
        presentacion,
        concentracion,
        formaFarmaceutica,
        viaAdministracion,
      } = modal.campos;
      const payload = {
        nombre: nombre.trim(),
        principioActivo: principioActivo.trim(),
        presentacion: presentacion.trim(),
        concentracion: concentracion.trim(),
        formaFarmaceutica,
        viaAdministracion,
      };

      if (modal.medicamento) {
        const actualizado = await MedicamentoApiService.actualizar(modal.medicamento._id, payload);
        setMedicamentos((prev) => prev.map((m) => (m._id === actualizado._id ? actualizado : m)));
        showNotification("Medicamento actualizado.", "success");
      } else {
        const nuevo = await MedicamentoApiService.crear(payload);
        setMedicamentos((prev) => [nuevo, ...prev]);
        showNotification("Medicamento agregado.", "success");
      }
      dispatch({ type: "CERRAR" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", message: err instanceof Error ? err.message : "Error al guardar." });
    }
  };

  const handleToggle = async (m: Medicamento) => {
    setProcesandoId(m._id);
    try {
      const actualizado = await MedicamentoApiService.toggleActivo(m._id);
      setMedicamentos((prev) => prev.map((x) => (x._id === actualizado._id ? actualizado : x)));
      showNotification(actualizado.activo ? "Medicamento activado." : "Medicamento desactivado.", "success");
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Error al cambiar el estado.", "error");
    } finally {
      setProcesandoId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    dispatch({ type: "SET_CAMPO", field: e.target.name as keyof FormFields, value: e.target.value });
  };

  const totalActivos = medicamentos.filter((m) => m.activo).length;

  return (
    <div className="lista-page">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      {/* Header */}
      <div className="lista-page-header">
        <div>
          <h1>Catálogo de Medicamentos</h1>
          <p className="lista-page-subtitle">{medicamentos.length} medicamentos · {totalActivos} activos</p>
        </div>
        <button className="btn-page-action" onClick={() => dispatch({ type: "ABRIR_NUEVO" })}>
          <Plus size={16} /> Nuevo Medicamento
        </button>
      </div>

      {/* Buscador */}
      <div className="lista-search-bar">
        <Search size={18} className="lista-search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, principio activo, forma o concentración..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="lista-search-input"
        />
        {!cargando && busqueda && (
          <span className="lista-search-count">{filtrados.length} de {medicamentos.length}</span>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando catálogo…</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Principio activo</th>
                  <th>Presentación</th>
                  <th>Forma / concentración</th>
                  <th style={{ width: 110, textAlign: "center" }}>Estado</th>
                  <th style={{ width: 110, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length > 0 ? (
                  filtrados.map((m) => (
                    <tr key={m._id} className={!m.activo ? "gm-row--inactivo" : ""}>
                      <td>
                        <div className="ge-especialidad-cell">
                          <div className="ge-icon-wrap"><Pill size={14} /></div>
                          <span className="ge-nombre">{m.nombre}</span>
                        </div>
                      </td>
                      <td>{m.principioActivo}</td>
                      <td>{m.presentacion}</td>
                      <td>
                        <div className="gm-forma-cell">
                          <span>{m.formaFarmaceutica || "—"}</span>
                          <small>{m.concentracion || "Sin concentración"} · {m.viaAdministracion || "Sin vía"}</small>
                        </div>
                      </td>
                      <td className="td-center">
                        <span className={`gm-estado ${m.activo ? "gm-estado--on" : "gm-estado--off"}`}>
                          {m.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="td-center">
                        <div className="ge-actions">
                          <button
                            className="btn-action"
                            onClick={() => dispatch({ type: "ABRIR_EDITAR", medicamento: m })}
                            title="Editar"
                            disabled={procesandoId === m._id}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className={`btn-action ${m.activo ? "btn-action--danger" : ""}`}
                            onClick={() => handleToggle(m)}
                            title={m.activo ? "Desactivar" : "Activar"}
                            disabled={procesandoId === m._id}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="td-empty">
                      <Pill size={32} className="td-empty-icon" />
                      <p>{busqueda ? "No se encontraron medicamentos." : "No hay medicamentos en el catálogo."}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal.abierto && (
        <div
          className="pm-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) dispatch({ type: "CERRAR" }); }}
        >
          <div className="pm-modal" style={{ maxWidth: 620 }}>
            <div className="pm-header">
              <div className="pm-header-info">
                <div className="pm-header-icon"><Pill size={18} /></div>
                <div><h2>{modal.medicamento ? "Editar Medicamento" : "Nuevo Medicamento"}</h2></div>
              </div>
              <button className="pm-close" aria-label="Cerrar" onClick={() => dispatch({ type: "CERRAR" })} disabled={modal.loading}><X size={16} /></button>
            </div>

            {modal.error && (
              <div className="pm-error"><AlertCircle size={15} /> {modal.error}</div>
            )}

            <form onSubmit={handleGuardar} className="pm-form">
              <div className="pm-section">
                <div className="pm-field">
                  <label className="pm-label">Nombre comercial <span className="pm-req">*</span></label>
                  <input className="pm-input" name="nombre" value={modal.campos.nombre} onChange={handleChange} placeholder="Ej: Paracetamol 500mg" disabled={modal.loading} />
                </div>
                <div className="pm-field">
                  <label className="pm-label">Principio activo <span className="pm-req">*</span></label>
                  <input className="pm-input" name="principioActivo" value={modal.campos.principioActivo} onChange={handleChange} placeholder="Ej: Paracetamol" disabled={modal.loading} />
                </div>
                <div className="pm-field">
                  <label className="pm-label">Presentación <span className="pm-req">*</span></label>
                  <input className="pm-input" name="presentacion" value={modal.campos.presentacion} onChange={handleChange} placeholder="Ej: Tableta 500mg / Jarabe 120ml" disabled={modal.loading} />
                </div>
                <div className="pm-field">
                  <label className="pm-label">Concentración <span className="pm-req">*</span></label>
                  <input className="pm-input" name="concentracion" value={modal.campos.concentracion} onChange={handleChange} placeholder="Ej: 500mg o 120mg/5ml" disabled={modal.loading} />
                </div>
                <div className="gm-form-grid">
                  <div className="pm-field">
                    <label className="pm-label">Forma farmacéutica <span className="pm-req">*</span></label>
                    <select className="pm-input" name="formaFarmaceutica" value={modal.campos.formaFarmaceutica} onChange={handleChange} disabled={modal.loading}>
                      {FORMAS_FARMACEUTICAS.map((forma) => <option key={forma} value={forma}>{forma}</option>)}
                    </select>
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">Vía de administración <span className="pm-req">*</span></label>
                    <select className="pm-input" name="viaAdministracion" value={modal.campos.viaAdministracion} onChange={handleChange} disabled={modal.loading}>
                      {VIAS_ADMINISTRACION.map((via) => <option key={via} value={via}>{via}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pm-footer">
                <div />
                <div className="pm-footer-actions">
                  <button type="button" className="pm-btn pm-btn--ghost" onClick={() => dispatch({ type: "CERRAR" })} disabled={modal.loading}>
                    <X size={14} /> Cancelar
                  </button>
                  <button type="submit" className="pm-btn pm-btn--primary" disabled={modal.loading}>
                    {modal.loading
                      ? <><span className="pm-spinner-sm" /> Guardando…</>
                      : <><Check size={14} /> {modal.medicamento ? "Guardar cambios" : "Agregar medicamento"}</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionMedicamentos;
