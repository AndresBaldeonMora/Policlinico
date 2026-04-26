import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, UserPlus, Pencil, Users, Trash2, ClipboardList, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import "../ListaCitas/ListaCitas.css";
import "./ListaPacientes.css";
import {
  PacienteApiService,
  type PacienteTransformado,
  type CredencialesPortal,
} from "../../services/paciente.service";
import PacienteModal from "./PacienteModal";
import CredencialesModal from "../../components/modals/CredencialesModal";

const normalizeString = (str: string): string =>
  (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

interface NotificationState { message: string; type: "success" | "error" | ""; visible: boolean; }
interface Props {
  puedeEliminar?: boolean;
}
const ListaPacientes = ({ puedeEliminar = false }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [pacientes, setPacientes] = useState<PacienteTransformado[]>([]);
  const [busqueda, setBusqueda] = useState(searchParams.get("buscar") || "");
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({ message: "", type: "", visible: false });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState<PacienteTransformado | null>(null);
  const [credencialesData, setCredencialesData] = useState<{
    paciente: PacienteTransformado;
    credenciales: CredencialesPortal;
  } | null>(null);
  const [creandoCuentaId, setCreandoCuentaId] = useState<string | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
  };

  const cargarPacientes = async () => {
    try {
      setCargando(true);
      setPacientes(await PacienteApiService.listar());
    } catch {
      showNotification("Error al cargar la lista de pacientes.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarPacientes(); }, []);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, pacientes]);

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      abrirNuevo();
    }
  }, []);

  const pacientesFiltrados = pacientes.filter((p) => {
    const filtro = normalizeString(busqueda);
    return normalizeString(`${p.nombres} ${p.apellidos}`).includes(filtro) ||
      normalizeString(p.dni || "").includes(filtro) ||
      normalizeString(p.telefono || "").includes(filtro);
  });

  const abrirNuevo = () => { setPacienteEditando(null); setModalAbierto(true); };
  const abrirEditar = (p: PacienteTransformado) => { setPacienteEditando(p); setModalAbierto(true); };

  const handleGuardado = (p: PacienteTransformado, credenciales?: CredencialesPortal) => {
    setModalAbierto(false);
    const pacienteConFlag = credenciales ? { ...p, tieneCuentaPortal: true } : p;
    setPacientes((prev) => {
      const idx = prev.findIndex((x) => x._id === pacienteConFlag._id);
      if (idx >= 0) { const next = [...prev]; next[idx] = pacienteConFlag; return next; }
      return [pacienteConFlag, ...prev];
    });
    if (credenciales) {
      setCredencialesData({ paciente: pacienteConFlag, credenciales });
      showNotification("Paciente registrado y cuenta de portal creada.", "success");
    } else {
      showNotification(pacienteEditando ? "Paciente actualizado correctamente." : "Paciente registrado correctamente.", "success");
    }
  };

  const handleCrearCuenta = async (p: PacienteTransformado) => {
    if (!p.correo) {
      showNotification("Este paciente no tiene correo registrado. Edítalo primero.", "error");
      return;
    }
    setCreandoCuentaId(p._id);
    try {
      const credenciales = await PacienteApiService.crearCuentaPortal(p._id);
      setPacientes((prev) =>
        prev.map((x) => (x._id === p._id ? { ...x, tieneCuentaPortal: true } : x))
      );
      setCredencialesData({ paciente: p, credenciales });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear cuenta";
      showNotification(msg, "error");
    } finally {
      setCreandoCuentaId(null);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este paciente?")) return;
    try {
      await PacienteApiService.eliminar(id);
      setPacientes((prev) => prev.filter((p) => p._id !== id));
      showNotification("Paciente eliminado.", "success");
    } catch {
      showNotification("Error al eliminar el paciente.", "error");
    }
  };

  return (
    <div className="lista-page">
      {notification.visible && <div className={`notification ${notification.type}`}>{notification.message}</div>}

      <div className="lista-page-header">
        <div>
          <h1>Pacientes</h1>
          <p className="lista-page-subtitle">{pacientes.length} pacientes registrados</p>
        </div>
        <button className="btn-page-action" onClick={abrirNuevo}>
          <UserPlus size={16} /> Nuevo Paciente
        </button>
      </div>

      <div className="lista-search-bar">
        <Search size={18} className="lista-search-icon" />
        <input type="text" placeholder="Buscar por DNI, nombre o telefono..."
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="lista-search-input" />
        {!cargando && busqueda && (
          <span className="lista-search-count">{pacientesFiltrados.length} de {pacientes.length}</span>
        )}
      </div>

      {cargando ? (
        <div className="lista-loading"><div className="lista-loading-spinner" /><p>Cargando pacientes...</p></div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>DNI</th>
                  <th style={{ width: 250 }}>Paciente</th>
                  <th style={{ width: 130 }}>Telefono</th>
                  <th>Correo</th>
                  <th style={{ width: 80 }}>Edad</th>
                  <th style={{ width: 90 }}>Portal</th>
                  <th style={{ width: 110 }}>Accion</th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.length > 0 ? (
                  pacientesFiltrados.map((p) => (
                    <tr
                      key={p.id}
                      ref={highlightId === p.id ? highlightRef : undefined}
                      className={highlightId === p.id ? "tr-highlight" : ""}
                    >
                      <td><span className="td-mono">{p.dni}</span></td>
                      <td>
                        <div className="td-person">
                          <div className="td-avatar">{p.nombres.charAt(0)}</div>
                          <div className="td-person-info">
                            <span className="td-person-name">{p.nombres} {p.apellidos}</span>
                            {p.distrito && <span className="td-person-meta">{p.distrito}</span>}
                          </div>
                        </div>
                      </td>
                      <td>{p.telefono || <span className="td-muted">--</span>}</td>
                      <td className="td-truncate">{p.correo || <span className="td-muted">--</span>}</td>
                      <td className="td-center">{p.edad != null ? `${p.edad}` : <span className="td-muted">--</span>}</td>
                      <td className="td-center">
                        {p.tieneCuentaPortal ? (
                          <span className="lp-badge lp-badge--ok" title="Tiene cuenta de portal">
                            <ShieldCheck size={13} /> Activa
                          </span>
                        ) : (
                          <span className="lp-badge lp-badge--off" title="Sin cuenta de portal">
                            <ShieldOff size={13} /> Sin cuenta
                          </span>
                        )}
                      </td>
                      <td className="td-center">
                        <div className="ge-actions">
                          {!p.tieneCuentaPortal && (
                            <button
                              className="btn-action btn-action--primary"
                              onClick={() => handleCrearCuenta(p)}
                              disabled={creandoCuentaId === p._id || !p.correo}
                              title={p.correo ? "Crear cuenta de portal" : "Falta correo"}
                            >
                              {creandoCuentaId === p._id ? (
                                <span className="lp-spinner-sm" />
                              ) : (
                                <KeyRound size={14} />
                              )}
                            </button>
                          )}
                          <button className="btn-action" onClick={() => navigate(`/pacientes/${p._id}`)} title="Ver historial">
                            <ClipboardList size={15} />
                          </button>
                          <button className="btn-action" onClick={() => abrirEditar(p)} title="Editar">
                            <Pencil size={15} />
                          </button>
                          {puedeEliminar && (
                            <button className="btn-action btn-action--danger" onClick={() => handleEliminar(p._id)} title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="td-empty">
                      <Users size={32} className="td-empty-icon" />
                      <p>{busqueda ? "No se encontraron pacientes con ese criterio." : "No hay pacientes registrados."}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalAbierto && (
        <PacienteModal paciente={pacienteEditando} onGuardado={handleGuardado} onCancelar={() => setModalAbierto(false)} />
      )}

      {credencialesData && (
        <CredencialesModal
          paciente={credencialesData.paciente}
          credenciales={credencialesData.credenciales}
          onCerrar={() => setCredencialesData(null)}
        />
      )}
    </div>
  );
};

export default ListaPacientes;
