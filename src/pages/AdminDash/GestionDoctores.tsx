import { useEffect, useReducer, useState } from "react";
import { Search, Plus, Pencil, Trash2, Stethoscope, X, AlertCircle, Check } from "lucide-react";
import { DoctorApiService, type DoctorTransformado } from "../../services/doctor.service";
import { EspecialidadApiService, type Especialidad } from "../../services/especialidad.service";
import "./GestionarDoctores.css";

// ─── Tipos ───────────────────────────────────────────────
interface NotificationState {
  message: string;
  type: "success" | "error" | "";
  visible: boolean;
}

interface FormFields {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  especialidadId: string;
  cmp: string;
}

interface ModalState {
  abierto: boolean;
  doctor: DoctorTransformado | null;
  campos: FormFields;
  loading: boolean;
  error: string;
}

type ModalAction =
  | { type: "ABRIR_NUEVO" }
  | { type: "ABRIR_EDITAR"; doctor: DoctorTransformado }
  | { type: "CERRAR" }
  | { type: "SET_CAMPO"; field: keyof FormFields; value: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ERROR"; message: string };

const camposVacios: FormFields = {
  nombres: "", apellidos: "", correo: "", telefono: "", especialidadId: "", cmp: "",
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "ABRIR_NUEVO":
      return { abierto: true, doctor: null, campos: camposVacios, loading: false, error: "" };
    case "ABRIR_EDITAR":
      return {
        abierto: true,
        doctor: action.doctor,
        campos: {
          nombres: action.doctor.nombres,
          apellidos: action.doctor.apellidos,
          correo: action.doctor.correo,
          telefono: action.doctor.telefono,
          especialidadId: action.doctor.especialidadId,
          cmp: action.doctor.cmp ?? "",
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

// ─── Componente principal ─────────────────────────────────
const GestionarDoctores = () => {
  const [doctores, setDoctores] = useState<DoctorTransformado[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({ message: "", type: "", visible: false });

  const [modal, dispatch] = useReducer(modalReducer, {
    abierto: false, doctor: null, campos: camposVacios, loading: false, error: "",
  });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
  };

  const cargar = async () => {
    try {
      setCargando(true);
      const [docs, esps] = await Promise.all([
        DoctorApiService.listar(),
        EspecialidadApiService.listar(),
      ]);
      setDoctores(docs);
      setEspecialidades(esps);
    } catch {
      showNotification("Error al cargar los datos.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = doctores.filter((d) => {
    const q = busqueda.toLowerCase();
    return (
      `${d.nombres} ${d.apellidos}`.toLowerCase().includes(q) ||
      d.especialidad.toLowerCase().includes(q) ||
      (d.correo || "").toLowerCase().includes(q)
    );
  });

  // ── Validar ──
  const validar = (): string | null => {
    const { nombres, apellidos, correo, telefono, especialidadId } = modal.campos;
    if (!nombres.trim())       return "El nombre es obligatorio.";
    if (!apellidos.trim())     return "Los apellidos son obligatorios.";
    if (!correo.trim())        return "El correo es obligatorio.";
    if (!telefono.trim())      return "El teléfono es obligatorio.";
    if (!especialidadId)       return "Selecciona una especialidad.";
    return null;
  };

  // ── Guardar ──
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validar();
    if (err) { dispatch({ type: "SET_ERROR", message: err }); return; }
    dispatch({ type: "SET_LOADING", value: true });
    try {
      const { nombres, apellidos, correo, telefono, especialidadId, cmp } = modal.campos;
      const payload = { nombres: nombres.trim(), apellidos: apellidos.trim(), correo: correo.trim(), telefono: telefono.trim(), especialidadId, cmp: cmp.trim() || undefined };

      if (modal.doctor) {
        const actualizado = await DoctorApiService.actualizar(modal.doctor.id, payload);
        setDoctores((prev) => prev.map((d) => (d.id === actualizado.id ? actualizado : d)));
        showNotification("Doctor actualizado correctamente.", "success");
      } else {
        const nuevo = await DoctorApiService.crear(payload as Required<typeof payload>);
        setDoctores((prev) => [nuevo, ...prev]);
        showNotification("Doctor registrado correctamente.", "success");
      }
      dispatch({ type: "CERRAR" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", message: err instanceof Error ? err.message : "Error al guardar." });
    }
  };

  // ── Eliminar ──
  const handleEliminarConfirmado = async (id: string) => {
    setConfirmDelete(null);
    setEliminandoId(id);
    try {
      await DoctorApiService.eliminar(id);
      setDoctores((prev) => prev.filter((d) => d.id !== id));
      showNotification("Doctor eliminado.", "success");
    } catch {
      showNotification("Error al eliminar el doctor.", "error");
    } finally {
      setEliminandoId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    dispatch({ type: "SET_CAMPO", field: e.target.name as keyof FormFields, value: e.target.value });
  };

  return (
    <div className="lista-page">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      {/* Header */}
      <div className="lista-page-header">
        <div>
          <h1>Doctores</h1>
          <p className="lista-page-subtitle">{doctores.length} doctores registrados</p>
        </div>
        <button className="btn-page-action" onClick={() => dispatch({ type: "ABRIR_NUEVO" })}>
          <Plus size={16} /> Nuevo Doctor
        </button>
      </div>

      {/* Buscador */}
      <div className="lista-search-bar">
        <Search size={18} className="lista-search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="lista-search-input"
        />
        {!cargando && busqueda && (
          <span className="lista-search-count">{filtrados.length} de {doctores.length}</span>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando doctores…</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Especialidad</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th style={{ width: 80, textAlign: "center" }}>CMP</th>
                  <th style={{ width: 100, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length > 0 ? (
                  filtrados.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div className="td-person">
                          <div className="td-avatar">{d.nombres.charAt(0)}</div>
                          <div className="td-person-info">
                            <span className="td-person-name">{d.nombres} {d.apellidos}</span>
                            <span className="td-person-meta">{d.correo}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="gd-esp-badge">{d.especialidad}</span>
                      </td>
                      <td>{d.telefono || <span className="td-muted">--</span>}</td>
                      <td className="td-truncate">{d.correo || <span className="td-muted">--</span>}</td>
                      <td className="td-center">
                        {d.cmp
                          ? <span className="td-mono">{d.cmp}</span>
                          : <span className="td-muted">--</span>
                        }
                      </td>
                      <td className="td-center">
                        <div className="ge-actions">
                          <button
                            className="btn-action"
                            onClick={() => dispatch({ type: "ABRIR_EDITAR", doctor: d })}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-action btn-action--danger"
                            onClick={() => setConfirmDelete(d.id)}
                            disabled={eliminandoId === d.id}
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
                    <td colSpan={6} className="td-empty">
                      <Stethoscope size={32} className="td-empty-icon" />
                      <p>{busqueda ? "No se encontraron doctores." : "No hay doctores registrados."}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal.abierto && (
        <div
          className="pm-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) dispatch({ type: "CERRAR" }); }}
        >
          <div className="pm-modal" style={{ maxWidth: 520 }}>
            <div className="pm-header">
              <div className="pm-header-info">
                <div className="pm-header-icon">{modal.doctor ? <Pencil size={16} /> : <Stethoscope size={16} />}</div>
                <div>
                  <h2>{modal.doctor ? "Editar Doctor" : "Nuevo Doctor"}</h2>
                </div>
              </div>
              <button className="pm-close" aria-label="Cerrar" onClick={() => dispatch({ type: "CERRAR" })} disabled={modal.loading}><X size={16} /></button>
            </div>

            {modal.error && (
              <div className="pm-error">
                <AlertCircle size={15} /> {modal.error}
              </div>
            )}

            <form onSubmit={handleGuardar} className="pm-form">
              <div className="pm-section">
                <div className="pm-row">
                  <div className="pm-field">
                    <label className="pm-label">Nombres <span className="pm-req">*</span></label>
                    <input className="pm-input" name="nombres" value={modal.campos.nombres} onChange={handleChange} placeholder="Juan" disabled={modal.loading} />
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">Apellidos <span className="pm-req">*</span></label>
                    <input className="pm-input" name="apellidos" value={modal.campos.apellidos} onChange={handleChange} placeholder="Pérez García" disabled={modal.loading} />
                  </div>
                </div>

                <div className="pm-row">
                  <div className="pm-field">
                    <label className="pm-label">Correo <span className="pm-req">*</span></label>
                    <input className="pm-input" type="email" name="correo" value={modal.campos.correo} onChange={handleChange} placeholder="doctor@clinica.com" disabled={modal.loading} />
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">Teléfono <span className="pm-req">*</span></label>
                    <input className="pm-input" name="telefono" value={modal.campos.telefono} onChange={handleChange} placeholder="987654321" maxLength={9}  disabled={modal.loading} />
                  </div>
                </div>

                <div className="pm-row">
                  <div className="pm-field">
                    <label className="pm-label">Especialidad <span className="pm-req">*</span></label>
                    <select className="pm-select" name="especialidadId" value={modal.campos.especialidadId} onChange={handleChange} disabled={modal.loading}>
                      <option value="">Seleccionar especialidad</option>
                      {especialidades.map((esp) => (
                        <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">CMP <span className="pm-label-optional">(opcional)</span></label>
                    <input className="pm-input" name="cmp" value={modal.campos.cmp} onChange={handleChange} placeholder="Ej: 12345" maxLength={5} disabled={modal.loading} />
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
                      : <><Check size={14} /> {modal.doctor ? "Guardar cambios" : "Registrar doctor"}</>
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="pm-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="pm-modal"
            style={{ maxWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-header">
              <div className="pm-header-info">
                <div className="pm-header-icon"><Trash2 size={16} /></div>
                <div><h2>¿Eliminar doctor?</h2></div>
              </div>
              <button className="pm-close" aria-label="Cerrar" onClick={() => setConfirmDelete(null)}><X size={16} /></button>
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

export default GestionarDoctores;