import { useEffect, useState } from "react";
import "../ListaCitas/ListaCitas.css";
import {
  PacienteApiService,
  type PacienteTransformado,
} from "../../services/paciente.service";

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
    message: "",
    type: "",
    visible: false,
  });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, visible: false })),
      2500
    );
  };

  const cargarPacientes = async () => {
    try {
      setCargando(true);
      const data = await PacienteApiService.listar();
      setPacientes(data);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
      showNotification("Error al cargar la lista de pacientes.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, []);

  const pacientesFiltrados = pacientes.filter((p) => {
    const filtro = normalizeString(busqueda);
    const nombreCompleto = normalizeString(
      `${p.nombres ?? ""} ${p.apellidos ?? ""}`
    );
    const dni = normalizeString(p.dni || "");
    const telefono = normalizeString(p.telefono || "");
    return (
      nombreCompleto.includes(filtro) ||
      dni.includes(filtro) ||
      telefono.includes(filtro)
    );
  });

  return (
    <div className="lista-citas">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>
          {notification.type === "success" ? "✅ " : "❌ "}
          {notification.message}
        </div>
      )}

      <h1>Pacientes Registrados</h1>

      <div className="buscador-container">
        <input
          type="text"
          placeholder="Buscar por DNI, nombre o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
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
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.length > 0 ? (
                  pacientesFiltrados.map((p) => (
                    <tr key={p.id}>
                      <td className="col-dni">{p.dni}</td>
                      <td className="col-nombre">
                        {p.nombres} {p.apellidos}
                      </td>
                      <td className="col-telefono">{p.telefono || "-"}</td>
                      <td>{p.correo || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="sin-resultados">
                      No se encontraron pacientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaPacientes;
