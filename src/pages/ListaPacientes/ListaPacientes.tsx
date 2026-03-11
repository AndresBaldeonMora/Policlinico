// src/pages/ListaPacientes/ListaPacientes.tsx
import { useEffect, useState } from "react";
import "../ListaCitas/ListaCitas.css";
import "./ListaPacientes.css";
import {
  PacienteApiService,
  type PacienteTransformado,
} from "../../services/paciente.service";
import PacienteModal from "./PacienteModal";

const normalizeString = (str: string): string =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

interface NotificationState {
  message: string;
  type: "success" | "error" | "";
  visible: boolean;
}

const ListaPacientes = () => {
  const [pacientes, setPacientes] = useState<PacienteTransformado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    message: "", type: "", visible: false,
  });

  // Modal state
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState<PacienteTransformado | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
  };

  const cargarPacientes = async () => {
    try {
      setCargando(true);
      const data = await PacienteApiService.listar();
      setPacientes(data);
    } catch {
      showNotification("Error al cargar la lista de pacientes.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarPacientes(); }, []);

  const pacientesFiltrados = pacientes.filter((p) => {
    const filtro = normalizeString(busqueda);
    const nombreCompleto = normalizeString(`${p.nombres ?? ""} ${p.apellidos ?? ""}`);
    return (
      nombreCompleto.includes(filtro) ||
      normalizeString(p.dni || "").includes(filtro) ||
      normalizeString(p.telefono || "").includes(filtro)
    );
  });

  const abrirNuevo = () => {
    setPacienteEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (p: PacienteTransformado) => {
    setPacienteEditando(p);
    setModalAbierto(true);
  };

  const handleGuardado = (p: PacienteTransformado) => {
    setModalAbierto(false);
    setPacientes((prev) => {
      const idx = prev.findIndex((x) => x._id === p._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = p;
        return next;
      }
      return [p, ...prev];
    });
    showNotification(
      pacienteEditando ? "Paciente actualizado correctamente." : "Paciente registrado correctamente.",
      "success"
    );
  };

  return (
    <div className="lista-citas">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>
          {notification.type === "success" ? "✅ " : "❌ "}
          {notification.message}
        </div>
      )}

      {/* Header con botón */}
      <div className="lp-header">
        <h1>Pacientes Registrados</h1>
        <button className="lp-btn-nuevo" onClick={abrirNuevo}>
          <span>+</span> Nuevo Paciente
        </button>
      </div>

      {/* Buscador + contador */}
      <div className="buscador-container lp-buscador">
        <input
          type="text"
          placeholder="Buscar por DNI, nombre o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
        {!cargando && (
          <span className="lp-contador">
            {pacientesFiltrados.length} de {pacientes.length} pacientes
          </span>
        )}
      </div>

      {cargando ? (
        <p className="texto-cargando">Cargando pacientes...</p>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="citas-table citas-table-pacientes">
              <thead>
                <tr>
                  <th className="col-dni">DNI</th>
                  <th className="col-nombre">Nombre Completo</th>
                  <th className="col-telefono">Teléfono</th>
                  <th>Correo</th>
                  <th className="col-edad">Edad</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.length > 0 ? (
                  pacientesFiltrados.map((p) => (
                    <tr key={p.id}>
                      <td className="col-dni">
                        <span className="lp-dni-badge">{p.dni}</span>
                      </td>
                      <td className="col-nombre">
                        <span className="lp-nombre">{p.nombres} {p.apellidos}</span>
                      </td>
                      <td className="col-telefono">{p.telefono || <span className="lp-vacio">—</span>}</td>
                      <td>{p.correo || <span className="lp-vacio">—</span>}</td>
                      <td className="col-edad">
                        {p.edad != null ? `${p.edad} años` : <span className="lp-vacio">—</span>}
                      </td>
                      <td className="col-acciones">
                        <button
                          className="lp-btn-editar"
                          onClick={() => abrirEditar(p)}
                          title="Editar paciente"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="sin-resultados">
                      {busqueda ? "No se encontraron pacientes con ese criterio." : "No hay pacientes registrados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <PacienteModal
          paciente={pacienteEditando}
          onGuardado={handleGuardado}
          onCancelar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
};

export default ListaPacientes;