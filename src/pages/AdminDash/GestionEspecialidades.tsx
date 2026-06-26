import { useEffect, useReducer, useState } from "react";
import {
  Search, Plus, Pencil, Trash2, FlaskConical, X,
  AlertCircle, Check, DoorOpen, Microscope, ImageIcon, ChevronRight,
} from "lucide-react";
import {
  EspecialidadApiService, type Especialidad, type ExamenResumen,
} from "../../services/especialidad.service";
import { ExamenService } from "../../services/examen.service";
import { toastExito, toastError } from "../../utils/toast";
import "./GestionEspecialidades.css";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ModalState {
  abierto: boolean;
  especialidad: Especialidad | null;
  nombre: string;
  descripcion: string;
  consultorio: string;
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
  | { type: "SET_DESCRIPCION"; value: string }
  | { type: "SET_CONSULTORIO"; value: string }
  | { type: "SET_LAB"; value: boolean }
  | { type: "SET_EXAMENES_CATALOGO"; examenes: ExamenResumen[] }
  | { type: "SET_CARGANDO_EXAMENES"; value: boolean }
  | { type: "TOGGLE_EXAMEN"; id: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ERROR"; message: string };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "ABRIR_NUEVO":
      return { ...state, abierto: true, especialidad: null, nombre: "", descripcion: "", consultorio: "", tieneLaboratorioImagen: false, examenesSeleccionados: [], loading: false, error: "" };
    case "ABRIR_EDITAR":
      return { ...state, abierto: true, especialidad: action.especialidad, nombre: action.especialidad.nombre, descripcion: (action.especialidad as any).descripcion ?? "", consultorio: String((action.especialidad as any).consultorio ?? ""), tieneLaboratorioImagen: action.especialidad.tieneLaboratorioImagen ?? false, examenesSeleccionados: action.especialidad.examenes?.map(e => e._id) ?? [], loading: false, error: "" };
    case "CERRAR":
      return { ...state, abierto: false, error: "" };
    case "SET_NOMBRE":       return { ...state, nombre: action.value, error: "" };
    case "SET_DESCRIPCION":  return { ...state, descripcion: action.value };
    case "SET_CONSULTORIO":  return { ...state, consultorio: action.value };
    case "SET_LAB":          return { ...state, tieneLaboratorioImagen: action.value, examenesSeleccionados: action.value ? state.examenesSeleccionados : [] };
    case "SET_EXAMENES_CATALOGO": return { ...state, todosExamenes: action.examenes, cargandoExamenes: false };
    case "SET_CARGANDO_EXAMENES": return { ...state, cargandoExamenes: action.value };
    case "TOGGLE_EXAMEN": {
      const ya = state.examenesSeleccionados.includes(action.id);
      return { ...state, examenesSeleccionados: ya ? state.examenesSeleccionados.filter(id => id !== action.id) : [...state.examenesSeleccionados, action.id] };
    }
    case "SET_LOADING": return { ...state, loading: action.value };
    case "SET_ERROR":   return { ...state, error: action.message, loading: false };
    default: return state;
  }
}

const INIT: ModalState = { abierto: false, especialidad: null, nombre: "", descripcion: "", consultorio: "", tieneLaboratorioImagen: false, examenesSeleccionados: [], todosExamenes: [], cargandoExamenes: false, loading: false, error: "" };

// ─── Componente ───────────────────────────────────────────────────────────────
export default function GestionarEspecialidades() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando]   = useState(true);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Especialidad | null>(null);
  const [modal, dispatch] = useReducer(modalReducer, INIT);

  const cargar = async () => {
    try { setCargando(true); setEspecialidades(await EspecialidadApiService.listar()); }
    catch { toastError("Error al cargar especialidades."); }
    finally { setCargando(false); }
  };
  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (!modal.abierto) return;
    dispatch({ type: "SET_CARGANDO_EXAMENES", value: true });
    ExamenService.listarExamenes()
      .then(data => dispatch({ type: "SET_EXAMENES_CATALOGO", examenes: data }))
      .catch(() => dispatch({ type: "SET_CARGANDO_EXAMENES", value: false }));
  }, [modal.abierto]);

  const filtradas = especialidades.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal.nombre.trim()) { dispatch({ type: "SET_ERROR", message: "El nombre es obligatorio." }); return; }
    dispatch({ type: "SET_LOADING", value: true });
    try {
      const payload: any = {
        nombre: modal.nombre.trim(),
        descripcion: modal.descripcion.trim() || undefined,
        consultorio: modal.consultorio ? Number(modal.consultorio) : undefined,
        tieneLaboratorioImagen: modal.tieneLaboratorioImagen,
        examenes: modal.tieneLaboratorioImagen ? modal.examenesSeleccionados : [],
      };
      if (modal.especialidad) {
        const actualizada = await EspecialidadApiService.actualizar(modal.especialidad.id, payload);
        setEspecialidades(prev => prev.map(e => e.id === actualizada.id ? actualizada : e));
        toastExito("Especialidad actualizada.");
      } else {
        const nueva = await EspecialidadApiService.crear(payload);
        setEspecialidades(prev => [nueva, ...prev]);
        toastExito("Especialidad creada.");
      }
      dispatch({ type: "CERRAR" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", message: err instanceof Error ? err.message : "Error al guardar." });
    }
  };

  const handleEliminarConfirmado = async () => {
    if (!confirmDelete) return;
    setEliminandoId(confirmDelete.id);
    setConfirmDelete(null);
    try {
      await EspecialidadApiService.eliminar(confirmDelete.id);
      setEspecialidades(prev => prev.filter(e => e.id !== confirmDelete.id));
      toastExito("Especialidad eliminada.");
    } catch (err: any) {
      toastError(err.message || "Error al eliminar.");
    } finally { setEliminandoId(null); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="ge-page">
      {/* Header */}
      <div className="ge-header">
        <div>
          <h1 className="ge-title">Especialidades</h1>
          <p className="ge-subtitle">{especialidades.length} especialidades registradas</p>
        </div>
        <button className="ge-btn-nuevo" onClick={() => dispatch({ type: "ABRIR_NUEVO" })}>
          <Plus size={16} /> Nueva Especialidad
        </button>
      </div>

      {/* Buscador */}
      <div className="ge-search-wrap">
        <Search size={15} className="ge-search-icon" />
        <input className="ge-search-input" placeholder="Buscar especialidad…"
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        {busqueda && (
          <span className="ge-search-count">{filtradas.length} de {especialidades.length}</span>
        )}
      </div>

      {/* Grid de cards */}
      {cargando ? (
        <div className="ge-loading"><div className="ge-spinner" /><p>Cargando…</p></div>
      ) : filtradas.length === 0 ? (
        <div className="ge-empty">
          <FlaskConical size={40} className="ge-empty-icon" />
          <p>{busqueda ? "No se encontraron resultados." : "No hay especialidades registradas."}</p>
        </div>
      ) : (
        <div className="ge-grid">
          {filtradas.map(e => {
            const tieneConsultorio = !!(e as any).consultorio;
            const desc = (e as any).descripcion as string | undefined;
            const numExamenes = e.examenes?.length ?? 0;
            return (
              <div key={e.id} className={`ge-card ${eliminandoId === e.id ? "ge-card--eliminando" : ""}`}>
                <div className="ge-card-top">
                  <div className="ge-card-icon-wrap">
                    <FlaskConical size={18} />
                  </div>
                  <div className="ge-card-nombre-wrap">
                    <h3 className="ge-card-nombre">{e.nombre}</h3>
                    {tieneConsultorio && (
                      <span className="ge-card-consultorio">
                        <DoorOpen size={11} /> Consultorio {(e as any).consultorio}
                      </span>
                    )}
                  </div>
                  <div className="ge-card-acciones">
                    <button className="ge-icon-btn" onClick={() => dispatch({ type: "ABRIR_EDITAR", especialidad: e })} title="Editar">
                      <Pencil size={13} />
                    </button>
                    <button className="ge-icon-btn ge-icon-btn--danger" onClick={() => setConfirmDelete(e)} disabled={eliminandoId === e.id} title="Eliminar">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {desc && <p className="ge-card-desc">{desc}</p>}

                <div className="ge-card-footer">
                  {e.tieneLaboratorioImagen ? (
                    <>
                      <span className="ge-tag ge-tag--lab"><Microscope size={10} /> Lab / Imagen</span>
                      {numExamenes > 0 && (
                        <span className="ge-tag ge-tag--examenes">
                          <ImageIcon size={10} /> {numExamenes} examen{numExamenes !== 1 ? "es" : ""}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="ge-tag ge-tag--nolab">Solo consulta</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal crear / editar ── */}
      {modal.abierto && (
        <div className="pm-overlay" onClick={e => { if (e.target === e.currentTarget) dispatch({ type: "CERRAR" }); }}>
          <div className="ge-modal">
            <div className="ge-modal-header">
              <div className="ge-modal-header-left">
                <div className="ge-modal-icon">
                  {modal.especialidad ? <Pencil size={16} /> : <Plus size={16} />}
                </div>
                <div>
                  <h2>{modal.especialidad ? "Editar especialidad" : "Nueva especialidad"}</h2>
                  <p>{modal.especialidad ? `Editando: ${modal.especialidad.nombre}` : "Completa los datos de la nueva especialidad"}</p>
                </div>
              </div>
              <button className="pm-close" onClick={() => dispatch({ type: "CERRAR" })} disabled={modal.loading}><X size={16} /></button>
            </div>

            {modal.error && (
              <div className="ge-modal-error"><AlertCircle size={14} /> {modal.error}</div>
            )}

            <form onSubmit={handleGuardar} className="ge-modal-body">
              {/* Sección: Información básica */}
              <div className="ge-form-section">
                <p className="ge-form-section-titulo">Información básica</p>
                <div className="ge-form-row">
                  <div className="ge-field ge-field--grow">
                    <label className="ge-label">Nombre <span className="ge-req">*</span></label>
                    <input className="ge-input" value={modal.nombre}
                      onChange={e => dispatch({ type: "SET_NOMBRE", value: e.target.value })}
                      placeholder="Ej: Cardiología" disabled={modal.loading} autoFocus />
                  </div>
                  <div className="ge-field ge-field--sm">
                    <label className="ge-label">N° Consultorio</label>
                    <input className="ge-input" type="number" min="1" max="99"
                      value={modal.consultorio}
                      onChange={e => dispatch({ type: "SET_CONSULTORIO", value: e.target.value })}
                      placeholder="Ej: 3" disabled={modal.loading} />
                  </div>
                </div>
                <div className="ge-field">
                  <label className="ge-label">Descripción <span className="ge-opt">(opcional)</span></label>
                  <textarea className="ge-textarea" rows={3}
                    value={modal.descripcion}
                    onChange={e => dispatch({ type: "SET_DESCRIPCION", value: e.target.value })}
                    placeholder="Describe brevemente el área clínica, los procedimientos que atiende, o el perfil del paciente…"
                    disabled={modal.loading} />
                </div>
              </div>

              {/* Sección: Laboratorio e imagen */}
              <div className="ge-form-section">
                <p className="ge-form-section-titulo">Laboratorio e imagenología</p>
                <div className="ge-toggle-row">
                  <div className="ge-toggle-info">
                    <Microscope size={15} className="ge-toggle-ico" />
                    <div>
                      <p className="ge-toggle-lbl">¿Solicita exámenes de lab / imagen?</p>
                      <p className="ge-toggle-sub">Activa si los médicos de esta especialidad pueden ordenar exámenes de laboratorio o imagenología.</p>
                    </div>
                  </div>
                  <button type="button"
                    className={`ge-toggle ${modal.tieneLaboratorioImagen ? "ge-toggle--on" : ""}`}
                    onClick={() => dispatch({ type: "SET_LAB", value: !modal.tieneLaboratorioImagen })}
                    disabled={modal.loading}>
                    <span className="ge-toggle-knob" />
                  </button>
                </div>

                {modal.tieneLaboratorioImagen && (
                  <div className="ge-field" style={{ marginTop: "0.85rem" }}>
                    <label className="ge-label">
                      Exámenes asociados
                      {modal.examenesSeleccionados.length > 0 && (
                        <span className="ge-badge-count">{modal.examenesSeleccionados.length} seleccionado{modal.examenesSeleccionados.length !== 1 ? "s" : ""}</span>
                      )}
                    </label>
                    {modal.cargandoExamenes ? (
                      <div className="ge-ex-loading"><div className="ge-spinner ge-spinner--sm" /> Cargando catálogo…</div>
                    ) : modal.todosExamenes.length === 0 ? (
                      <p className="ge-ex-empty">No hay exámenes en el catálogo.</p>
                    ) : (
                      <div className="ge-ex-grid">
                        {modal.todosExamenes.map(ex => {
                          const sel = modal.examenesSeleccionados.includes(ex._id);
                          return (
                            <label key={ex._id} className={`ge-ex-item ${sel ? "ge-ex-item--on" : ""}`}>
                              <input type="checkbox" checked={sel}
                                onChange={() => dispatch({ type: "TOGGLE_EXAMEN", id: ex._id })}
                                disabled={modal.loading} />
                              <div className="ge-ex-info">
                                <span className="ge-ex-nombre">{ex.nombre}</span>
                                <span className="ge-ex-tipo">{ex.tipo}</span>
                              </div>
                              {sel && <Check size={12} className="ge-ex-check" />}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ge-modal-footer">
                <button type="button" className="ge-btn-cancel" onClick={() => dispatch({ type: "CERRAR" })} disabled={modal.loading}>
                  Cancelar
                </button>
                <button type="submit" className="ge-btn-guardar" disabled={modal.loading || !modal.nombre.trim()}>
                  {modal.loading
                    ? <><div className="ge-spinner ge-spinner--sm ge-spinner--white" /> Guardando…</>
                    : <><Check size={14} /> {modal.especialidad ? "Guardar cambios" : "Crear especialidad"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminación ── */}
      {confirmDelete && (
        <div className="pm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="ge-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="ge-confirm-icon-wrap">
              <Trash2 size={20} />
            </div>
            <h3>¿Eliminar especialidad?</h3>
            <p>Estás a punto de eliminar <strong>{confirmDelete.nombre}</strong>. Esta acción no se puede deshacer.</p>
            <div className="ge-confirm-btns">
              <button className="ge-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="ge-btn-eliminar" onClick={handleEliminarConfirmado}>
                <Trash2 size={13} /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
