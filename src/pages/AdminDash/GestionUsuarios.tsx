import { useEffect, useReducer, useState } from "react";
import {
  Search, Plus, Pencil, UserCog, X, AlertCircle, KeyRound,
  ShieldCheck, Power, Copy, Check,
} from "lucide-react";
import {
  UsuarioApiService,
  type UsuarioSistema,
  type RolGestionable,
} from "../../services/admin.service";
import "./GestionUsuarios.css";

// ─── Constantes ───────────────────────────────────────────────
const ROLES: { value: RolGestionable; label: string }[] = [
  { value: "RECEPCIONISTA", label: "Recepcionista" },
  { value: "MEDICO",        label: "Médico" },
  { value: "ADMINISTRADOR", label: "Administrador" },
];

const ROL_LABEL: Record<string, string> = {
  RECEPCIONISTA: "Recepcionista",
  MEDICO: "Médico",
  ADMINISTRADOR: "Administrador",
  PACIENTE: "Paciente",
};

// ─── Tipos del modal ──────────────────────────────────────────
interface FormFields {
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolGestionable;
}

interface ModalState {
  abierto: boolean;
  usuario: UsuarioSistema | null;
  campos: FormFields;
  loading: boolean;
  error: string;
}

type ModalAction =
  | { type: "ABRIR_NUEVO" }
  | { type: "ABRIR_EDITAR"; usuario: UsuarioSistema }
  | { type: "CERRAR" }
  | { type: "SET_CAMPO"; field: keyof FormFields; value: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ERROR"; message: string };

const camposVacios: FormFields = { nombres: "", apellidos: "", correo: "", rol: "RECEPCIONISTA" };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "ABRIR_NUEVO":
      return { abierto: true, usuario: null, campos: camposVacios, loading: false, error: "" };
    case "ABRIR_EDITAR":
      return {
        abierto: true,
        usuario: action.usuario,
        campos: {
          nombres: action.usuario.nombres,
          apellidos: action.usuario.apellidos,
          correo: action.usuario.correo,
          rol: (["RECEPCIONISTA", "MEDICO", "ADMINISTRADOR"].includes(action.usuario.rol)
            ? action.usuario.rol
            : "RECEPCIONISTA") as RolGestionable,
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
const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<string>("");
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({ message: "", type: "", visible: false });

  // Modal de credenciales temporales (tras crear o resetear)
  const [credenciales, setCredenciales] = useState<{ correo: string; password: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [modal, dispatch] = useReducer(modalReducer, {
    abierto: false, usuario: null, campos: camposVacios, loading: false, error: "",
  });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
  };

  const cargar = async () => {
    try {
      setCargando(true);
      setUsuarios(await UsuarioApiService.listar());
    } catch {
      showNotification("Error al cargar los usuarios.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    const coincideTexto =
      `${u.nombres} ${u.apellidos}`.toLowerCase().includes(q) ||
      u.correo.toLowerCase().includes(q);
    const coincideRol = !filtroRol || u.rol === filtroRol;
    return coincideTexto && coincideRol;
  });

  // ── Validar ──
  const validar = (): string | null => {
    const { nombres, apellidos, correo } = modal.campos;
    if (!nombres.trim())   return "El nombre es obligatorio.";
    if (!apellidos.trim()) return "Los apellidos son obligatorios.";
    if (!correo.trim())    return "El correo es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return "El correo no tiene un formato válido.";
    return null;
  };

  // ── Guardar (crear o actualizar) ──
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validar();
    if (err) { dispatch({ type: "SET_ERROR", message: err }); return; }
    dispatch({ type: "SET_LOADING", value: true });
    try {
      const { nombres, apellidos, correo, rol } = modal.campos;
      const payload = { nombres: nombres.trim(), apellidos: apellidos.trim(), correo: correo.trim(), rol };

      if (modal.usuario) {
        const actualizado = await UsuarioApiService.actualizar(modal.usuario.id, payload);
        setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? actualizado : u)));
        showNotification("Usuario actualizado correctamente.", "success");
        dispatch({ type: "CERRAR" });
      } else {
        const { usuario, passwordTemporal } = await UsuarioApiService.crear(payload);
        setUsuarios((prev) => [usuario, ...prev]);
        dispatch({ type: "CERRAR" });
        if (passwordTemporal) {
          setCredenciales({ correo: usuario.correo, password: passwordTemporal });
        }
        showNotification("Usuario creado correctamente.", "success");
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", message: err instanceof Error ? err.message : "Error al guardar." });
    }
  };

  // ── Activar / Desactivar ──
  const handleToggle = async (u: UsuarioSistema) => {
    setProcesandoId(u.id);
    try {
      const actualizado = await UsuarioApiService.toggleActivo(u.id);
      setUsuarios((prev) => prev.map((x) => (x.id === actualizado.id ? actualizado : x)));
      showNotification(actualizado.activo ? "Usuario activado." : "Usuario desactivado.", "success");
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Error al cambiar el estado.", "error");
    } finally {
      setProcesandoId(null);
    }
  };

  // ── Resetear contraseña ──
  const handleReset = async (u: UsuarioSistema) => {
    setProcesandoId(u.id);
    try {
      const passwordTemporal = await UsuarioApiService.resetearPassword(u.id);
      setCredenciales({ correo: u.correo, password: passwordTemporal });
      showNotification("Contraseña reseteada.", "success");
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Error al resetear.", "error");
    } finally {
      setProcesandoId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    dispatch({ type: "SET_CAMPO", field: e.target.name as keyof FormFields, value: e.target.value });
  };

  const copiarCredenciales = async () => {
    if (!credenciales) return;
    const texto = `Acceso al sistema\nCorreo: ${credenciales.correo}\nContraseña temporal: ${credenciales.password}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* ignorar */ }
  };

  const totalActivos = usuarios.filter((u) => u.activo).length;

  return (
    <div className="lista-page">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      {/* Header */}
      <div className="lista-page-header">
        <div>
          <h1>Usuarios del Sistema</h1>
          <p className="lista-page-subtitle">
            {usuarios.length} usuarios · {totalActivos} activos
          </p>
        </div>
        <button className="btn-page-action" onClick={() => dispatch({ type: "ABRIR_NUEVO" })}>
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="gu-filters">
        <div className="lista-search-bar" style={{ flex: 1 }}>
          <Search size={18} className="lista-search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="lista-search-input"
          />
        </div>
        <select className="gu-filter-select" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando usuarios…</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th style={{ width: 150 }}>Rol</th>
                  <th style={{ width: 110, textAlign: "center" }}>Estado</th>
                  <th style={{ width: 150, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length > 0 ? (
                  filtrados.map((u) => (
                    <tr key={u.id} className={!u.activo ? "gu-row--inactivo" : ""}>
                      <td>
                        <div className="td-person">
                          <div className="td-avatar">{u.nombres.charAt(0)}</div>
                          <div className="td-person-info">
                            <span className="td-person-name">{u.nombres} {u.apellidos}</span>
                            <span className="td-person-meta">{u.correo}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`gu-rol-badge gu-rol-badge--${u.rol.toLowerCase()}`}>
                          {u.rol === "ADMINISTRADOR" && <ShieldCheck size={12} />}
                          {ROL_LABEL[u.rol] ?? u.rol}
                        </span>
                      </td>
                      <td className="td-center">
                        <span className={`gu-estado ${u.activo ? "gu-estado--on" : "gu-estado--off"}`}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="td-center">
                        <div className="ge-actions">
                          <button
                            className="btn-action"
                            onClick={() => dispatch({ type: "ABRIR_EDITAR", usuario: u })}
                            title="Editar"
                            disabled={procesandoId === u.id || u.rol === "PACIENTE"}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-action"
                            onClick={() => handleReset(u)}
                            title="Resetear contraseña"
                            disabled={procesandoId === u.id}
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            className={`btn-action ${u.activo ? "btn-action--danger" : ""}`}
                            onClick={() => handleToggle(u)}
                            title={u.activo ? "Desactivar" : "Activar"}
                            disabled={procesandoId === u.id}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="td-empty">
                      <UserCog size={32} className="td-empty-icon" />
                      <p>{busqueda || filtroRol ? "No se encontraron usuarios." : "No hay usuarios registrados."}</p>
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
          <div className="pm-modal" style={{ maxWidth: 520 }}>
            <div className="pm-header">
              <div className="pm-header-info">
                <div className="pm-header-icon"><UserCog size={18} /></div>
                <div><h2>{modal.usuario ? "Editar Usuario" : "Nuevo Usuario"}</h2></div>
              </div>
              <button className="pm-close" aria-label="Cerrar" onClick={() => dispatch({ type: "CERRAR" })} disabled={modal.loading}><X size={16} /></button>
            </div>

            {modal.error && (
              <div className="pm-error"><AlertCircle size={15} /> {modal.error}</div>
            )}

            <form onSubmit={handleGuardar} className="pm-form">
              <div className="pm-section">
                <div className="pm-row">
                  <div className="pm-field">
                    <label className="pm-label">Nombres <span className="pm-req">*</span></label>
                    <input className="pm-input" name="nombres" value={modal.campos.nombres} onChange={handleChange} placeholder="María" disabled={modal.loading} />
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">Apellidos <span className="pm-req">*</span></label>
                    <input className="pm-input" name="apellidos" value={modal.campos.apellidos} onChange={handleChange} placeholder="Gómez Ruiz" disabled={modal.loading} />
                  </div>
                </div>

                <div className="pm-row">
                  <div className="pm-field">
                    <label className="pm-label">Correo <span className="pm-req">*</span></label>
                    <input className="pm-input" type="email" name="correo" value={modal.campos.correo} onChange={handleChange} placeholder="usuario@clinica.com" disabled={modal.loading} />
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">Rol <span className="pm-req">*</span></label>
                    <select className="pm-select" name="rol" value={modal.campos.rol} onChange={handleChange} disabled={modal.loading}>
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>

                {!modal.usuario && (
                  <p className="gu-hint">
                    <KeyRound size={13} /> Se generará una <strong>contraseña temporal</strong> que deberás entregar al usuario.
                  </p>
                )}
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
                      : <><Check size={14} /> {modal.usuario ? "Guardar cambios" : "Crear usuario"}</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal credenciales temporales */}
      {credenciales && (
        <div className="pm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCredenciales(null); }}>
          <div className="pm-modal" style={{ maxWidth: 440 }}>
            <div className="pm-header">
              <div className="pm-header-info">
                <div className="pm-header-icon"><KeyRound size={18} /></div>
                <div><h2>Credenciales de acceso</h2></div>
              </div>
              <button className="pm-close" aria-label="Cerrar" onClick={() => setCredenciales(null)}><X size={16} /></button>
            </div>
            <div className="pm-section">
              <div className="gu-cred-field">
                <span className="gu-cred-label">Correo</span>
                <span className="gu-cred-value">{credenciales.correo}</span>
              </div>
              <div className="gu-cred-field">
                <span className="gu-cred-label">Contraseña temporal</span>
                <span className="gu-cred-value gu-cred-value--pass">{credenciales.password}</span>
              </div>
              <div className="gu-cred-warning">
                <AlertCircle size={14} />
                <span>Esta contraseña se muestra <strong>una sola vez</strong>. El usuario deberá cambiarla en su primer ingreso.</span>
              </div>
            </div>
            <div className="pm-footer">
              <div />
              <div className="pm-footer-actions">
                <button className="pm-btn pm-btn--ghost" onClick={copiarCredenciales}>
                  {copiado ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                </button>
                <button className="pm-btn pm-btn--primary" onClick={() => setCredenciales(null)}>Listo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;
