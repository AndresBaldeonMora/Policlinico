import { useEffect, useReducer, useState } from "react";
import { Search, Plus, Pencil, Trash2, FlaskConical, X, AlertCircle } from "lucide-react";
import { EspecialidadApiService, type Especialidad, type ExamenResumen } from "../../services/especialidad.service";
import { ExamenService } from "../../services/examen.service";
import "./GestionEspecialidades.css";

// ─── Tipos ───────────────────────────────────────────────
interface NotificationState {
  message: string;
  type: "success" | "error" | "";
  visible: boolean;
}

interface ModalState {
  abierto: boolean;
  especialidad: Especialidad | null;
  nombre: string;
  tieneLaboratorioImagen: boolean;
  examenesSeleccionados: string[];
  todosExamenes: ExamenResumen[];
  cargandoExamenes: boolean;
  loading: boolean;
  error: string;
}

type ModalAction =
  | { type: "ABRIR_NUEVO" }
  | { type: "ABRIR_EDITAR"; especialidad: Especialidad }
  | { type: "CERRAR" }
  | { type: "SET_NOMBRE"; value: string }
  | { type: "SET_LAB"; value: boolean }
  | { type: "SET_EXAMENES_CATALOGO"; examenes: ExamenResumen[] }
  | { type: "SET_CARGANDO_EXAMENES"; value: boolean }
  | { type: "TOGGLE_EXAMEN"; id: string }
  | { type: "SET_EXAMENES_SELECCIONADOS"; ids: string[] }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ERROR"; message: string }
  | { type: "CLEAR_ERROR" };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "ABRIR_NUEVO":
      return {
        abierto: true,
        especialidad: null,
        nombre: "",
        tieneLaboratorioImagen: false,
        examenesSeleccionados: [],
        todosExamenes: state.todosExamenes,
        cargandoExamenes: false,
        loading: false,
        error: "",
      };
    case "ABRIR_EDITAR":
      return {
        abierto: true,
        especialidad: action.especialidad,
        nombre: action.especialidad.nombre,
        tieneLaboratorioImagen: action.especialidad.tieneLaboratorioImagen ?? false,
        examenesSeleccionados: action.especialidad.examenes?.map((e) => e._id) ?? [],
        todosExamenes: state.todosExamenes,
        cargandoExamenes: false,
        loading: false,
        error: "",
      };
    case "CERRAR":
      return { ...state, abierto: false, error: "" };
    case "SET_NOMBRE":
      return { ...state, nombre: action.value, error: "" };
    case "SET_LAB":
      return {
        ...state,
        tieneLaboratorioImagen: action.value,
        examenesSeleccionados: action.value ? state.examenesSeleccionados : [],
      };
    case "SET_EXAMENES_CATALOGO":
      return { ...state, todosExamenes: action.examenes, cargandoExamenes: false };
    case "SET_CARGANDO_EXAMENES":
      return { ...state, cargandoExamenes: action.value };
    case "TOGGLE_EXAMEN": {
      const ya = state.examenesSeleccionados.includes(action.id);
      return {
        ...state,
        examenesSeleccionados: ya
          ? state.examenesSeleccionados.filter((id) => id !== action.id)
          : [...state.examenesSeleccionados, action.id],
      };
    }
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_ERROR":
      return { ...state, error: action.message, loading: false };
    case "CLEAR_ERROR":
      return { ...state, error: "" };
    default:
      return state;
  }
}

// ─── Componente principal ─────────────────────────────────
const GestionarEspecialidades = () => {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "",
    visible: false,
  });

  const [modal, dispatch] = useReducer(modalReducer, {
    abierto: false,
    especialidad: null,
    nombre: "",
    tieneLaboratorioImagen: false,
    examenesSeleccionados: [],
    todosExamenes: [],
    cargandoExamenes: false,
    loading: false,
    error: "",
  });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
  };

  const cargar = async () => {
    try {
      setCargando(true);
      setEspecialidades(await EspecialidadApiService.listar());
    } catch {
      showNotification("Error al cargar especialidades.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (!modal.abierto) return;
    const fetchExamenes = async () => {
      dispatch({ type: "SET_CARGANDO_EXAMENES", value: true });
      try {
        const data = await ExamenService.listarExamenes();
        dispatch({ type: "SET_EXAMENES_CATALOGO", examenes: data });
      } catch {
        dispatch({ type: "SET_CARGANDO_EXAMENES", value: false });
      }
    };
    fetchExamenes();
  }, [modal.abierto]);

  const filtradas = especialidades.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── Guardar (crear o actualizar) ──
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal.nombre.trim()) {
      dispatch({ type: "SET_ERROR", message: "El nombre es obligatorio." });
      return;
    }
    dispatch({ type: "SET_LOADING", value: true });
    try {
      const payload = {
        nombre: modal.nombre.trim(),
        tieneLaboratorioImagen: modal.tieneLaboratorioImagen,
        examenes: modal.tieneLaboratorioImagen ? modal.examenesSeleccionados : [],
      };
      if (modal.especialidad) {
        const actualizada = await EspecialidadApiService.actualizar(modal.especialidad.id, payload);
        setEspecialidades((prev) => prev.map((e) => (e.id === actualizada.id ? actualizada : e)));
        showNotification("Especialidad actualizada correctamente.", "success");
      } else {
        const nueva = await EspecialidadApiService.crear(payload);
        setEspecialidades((prev) => [nueva, ...prev]);
        showNotification("Especialidad creada correctamente.", "success");
      }
      dispatch({ type: "CERRAR" });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        message: err instanceof Error ? err.message : "Error al guardar.",
      });
    }
  };

  // ── Eliminar ──
  const handleEliminar = (id: string) => setConfirmDelete(id);

  const handleEliminarConfirmado = async (id: string) => {
    setConfirmDelete(null);
    setEliminandoId(id);
    try {
      await EspecialidadApiService.eliminar(id);
      setEspecialidades((prev) => prev.filter((e) => e.id !== id));
      showNotification("Especialidad eliminada.", "success");
    } catch {
      showNotification("Error al eliminar la especialidad.", "error");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="lista-page">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      {/* Header */}
      <div className="lista-page-header">
        <div>
          <h1>Especialidades</h1>
          <p className="lista-page-subtitle">{especialidades.length} especialidades registradas</p>
        </div>
        <button className="btn-page-action" onClick={() => dispatch({ type: "ABRIR_NUEVO" })}>
          <Plus size={16} /> Nueva Especialidad
        </button>
      </div>

      {/* Buscador */}
      <div className="lista-search-bar">
        <Search size={18} className="lista-search-icon" />
        <input
          type="text"
          placeholder="Buscar especialidad..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="lista-search-input"
        />
        {!cargando && busqueda && (
          <span className="lista-search-count">
            {filtradas.length} de {especialidades.length}
          </span>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando especialidades...</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Especialidad</th>
                  <th style={{ width: 150, textAlign: "center" }}>Lab. / Imagen</th>
                  <th style={{ width: 180, textAlign: "center" }}>Exámenes</th>
                  <th style={{ width: 120, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length > 0 ? (
                  filtradas.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="ge-especialidad-cell">
                          <div className="ge-icon-wrap">
                            <FlaskConical size={16} />
                          </div>
                          <span className="ge-nombre">{e.nombre}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        <span className={`ge-badge ${e.tieneLaboratorioImagen ? "ge-badge--yes" : "ge-badge--no"}`}>
                          {e.tieneLaboratorioImagen ? "Sí" : "No"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        {e.tieneLaboratorioImagen ? (
                          <span className="ge-examenes-count">
                            {e.examenes?.length ?? 0} examen{(e.examenes?.length ?? 0) !== 1 ? "es" : ""}
                          </span>
                        ) : (
                          <span className="ge-text-muted">—</span>
                        )}
                      </td>
                      <td className="td-center">
                        <div className="ge-actions">
                          <button
                            className="btn-action"
                            onClick={() => dispatch({ type: "ABRIR_EDITAR", especialidad: e })}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-action btn-action--danger"
                            onClick={() => handleEliminar(e.id)}
                            disabled={eliminandoId === e.id}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="td-empty">
                      <FlaskConical size={32} className="td-empty-icon" />
                      <p>
                        {busqueda
                          ? "No se encontraron especialidades."
                          : "No hay especialidades registradas."}
                      </p>
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
          <div className="pm-modal" style={{ maxWidth: 460 }}>
            <div className="pm-header">
              <div className="pm-header-info">
                <div className="pm-header-icon">{modal.especialidad ? "✏️" : "🩺"}</div>
                <div>
                  <h2>{modal.especialidad ? "Editar Especialidad" : "Nueva Especialidad"}</h2>
                </div>
              </div>
              <button
                className="pm-close"
                onClick={() => dispatch({ type: "CERRAR" })}
                disabled={modal.loading}
              >
                ✕
              </button>
            </div>

            {modal.error && (
              <div className="pm-error">
                <AlertCircle size={15} /> {modal.error}
              </div>
            )}

            <form onSubmit={handleGuardar} className="pm-form">
              <div className="pm-section">
                <div className="pm-field">
                  <label className="pm-label">
                    Nombre <span className="pm-req">*</span>
                  </label>
                  <input
                    className="pm-input"
                    value={modal.nombre}
                    onChange={(e) => dispatch({ type: "SET_NOMBRE", value: e.target.value })}
                    placeholder="Ej: Cardiología"
                    disabled={modal.loading}
                    autoFocus
                  />
                </div>

                <div className="pm-field">
                  <label className="pm-label">¿Tiene laboratorio / imagen?</label>
                  <div className="ge-toggle-wrap">
                    <button
                      type="button"
                      className={`ge-toggle ${modal.tieneLaboratorioImagen ? "ge-toggle--on" : ""}`}
                      onClick={() => dispatch({ type: "SET_LAB", value: !modal.tieneLaboratorioImagen })}
                      disabled={modal.loading}
                    >
                      <span className="ge-toggle-knob" />
                    </button>
                    <span className="ge-toggle-label">
                      {modal.tieneLaboratorioImagen ? "Sí tiene lab. / imagen" : "No tiene lab. / imagen"}
                    </span>
                  </div>
                </div>

                {modal.tieneLaboratorioImagen && (
                  <div className="pm-field">
                    <label className="pm-label">
                      Exámenes asociados
                      {modal.examenesSeleccionados.length > 0 && (
                        <span className="ge-examenes-badge">
                          {modal.examenesSeleccionados.length} seleccionado
                          {modal.examenesSeleccionados.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </label>

                    {modal.cargandoExamenes ? (
                      <div className="ge-examenes-loading">
                        <span className="pm-spinner-sm" /> Cargando exámenes...
                      </div>
                    ) : modal.todosExamenes.length === 0 ? (
                      <p className="ge-examenes-empty">No hay exámenes en el catálogo aún.</p>
                    ) : (
                      <div className="ge-examenes-lista">
                        {modal.todosExamenes.map((ex) => {
                          const seleccionado = modal.examenesSeleccionados.includes(ex._id);
                          return (
                            <label
                              key={ex._id}
                              className={`ge-examen-item ${seleccionado ? "ge-examen-item--on" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={seleccionado}
                                onChange={() => dispatch({ type: "TOGGLE_EXAMEN", id: ex._id })}
                                disabled={modal.loading}
                              />
                              <span className="ge-examen-nombre">{ex.nombre}</span>
                              <span className="ge-examen-tipo">{ex.tipo}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pm-footer">
                <div />
                <div className="pm-footer-actions">
                  <button
                    type="button"
                    className="pm-btn pm-btn--ghost"
                    onClick={() => dispatch({ type: "CERRAR" })}
                    disabled={modal.loading}
                  >
                    <X size={14} /> Cancelar
                  </button>
                  <button
                    type="submit"
                    className="pm-btn pm-btn--primary"
                    disabled={modal.loading || !modal.nombre.trim()}
                  >
                    {modal.loading ? (
                      <><span className="pm-spinner-sm" /> Guardando...</>
                    ) : modal.especialidad ? (
                      "✓ Guardar cambios"
                    ) : (
                      "✓ Crear especialidad"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="pm-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="pm-modal"
            style={{ maxWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-header">
              <div className="pm-header-info">
                <div className="pm-header-icon">🗑️</div>
                <div><h2>¿Eliminar especialidad?</h2></div>
              </div>
              <button className="pm-close" onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <p style={{ padding: "0 1.25rem 1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Esta acción no se puede deshacer.
            </p>
            <div className="pm-footer">
              <div />
              <div className="pm-footer-actions">
                <button
                  className="pm-btn pm-btn--ghost"
                  onClick={() => setConfirmDelete(null)}
                >
                  <X size={14} /> Cancelar
                </button>
                <button
                  className="pm-btn pm-btn--danger"
                  onClick={() => handleEliminarConfirmado(confirmDelete)}
                >
                  <Trash2 size={14} /> Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionarEspecialidades;