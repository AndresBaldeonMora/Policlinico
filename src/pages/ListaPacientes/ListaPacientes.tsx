import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, UserPlus, Pencil, Users,Trash2 } from "lucide-react";
import "../ListaCitas/ListaCitas.css";
import "./ListaPacientes.css";
import { PacienteApiService, type PacienteTransformado } from "../../services/paciente.service";
import PacienteModal from "./PacienteModal";

const normalizeString = (str: string): string =>
  (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

interface NotificationState { message: string; type: "success" | "error" | ""; visible: boolean; }
interface Props {
  puedeEliminar?: boolean;
}
const ListaPacientes = ({ puedeEliminar = false }: Props) => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [pacientes, setPacientes] = useState<PacienteTransformado[]>([]);
  const [busqueda, setBusqueda] = useState(searchParams.get("buscar") || "");
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({ message: "", type: "", visible: false });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState<PacienteTransformado | null>(null);

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

  const handleGuardado = (p: PacienteTransformado) => {
    setModalAbierto(false);
    setPacientes((prev) => {
      const idx = prev.findIndex((x) => x._id === p._id);
      if (idx >= 0) { const next = [...prev]; next[idx] = p; return next; }
      return [p, ...prev];
    });
    showNotification(pacienteEditando ? "Paciente actualizado correctamente." : "Paciente registrado correctamente.", "success");
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
                  <th style={{ width: 80 }}>Accion</th>
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
                        {/* <button className="btn-action" onClick={() => abrirEditar(p)} title="Editar paciente">
                          <Pencil size={15} />
                        </button> */}
                        <div className="ge-actions">
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
                    <td colSpan={6} className="td-empty">
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
    </div>
  );
};

export default ListaPacientes;
