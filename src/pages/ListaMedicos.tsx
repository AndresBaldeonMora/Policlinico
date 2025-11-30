import { useEffect, useState } from "react";
import "./ListaCitas.css";
import {
  DoctorApiService,
  type DoctorTransformado as DoctorBase,
} from "../services/doctor.service";

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

// Extendemos el tipo base con campos opcionales
type Doctor = DoctorBase & {
  cmp?: string;
  cvUrl?: string;
};

const ListaMedicos = () => {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "",
    visible: false,
  });
  const [doctorCV, setDoctorCV] = useState<Doctor | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, visible: false })),
      2500
    );
  };

  const cargarDoctores = async () => {
    try {
      setCargando(true);
      const data = await DoctorApiService.listar();
      setDoctores(data as Doctor[]);
    } catch (error) {
      console.error("Error al cargar médicos:", error);
      showNotification("Error al cargar la lista de médicos.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDoctores();
  }, []);

  const doctoresFiltrados = doctores.filter((d) => {
    const filtro = normalizeString(busqueda);
    const nombreCompleto = normalizeString(
      `${d.nombres ?? ""} ${d.apellidos ?? ""}`
    );
    const especialidad = normalizeString(d.especialidad ?? "");
    const cmp = normalizeString(d.cmp ?? "");

    return (
      nombreCompleto.includes(filtro) ||
      especialidad.includes(filtro) ||
      cmp.includes(filtro)
    );
  });

  const handleVerCV = (doctor: Doctor) => {
    if (!doctor.cvUrl) {
      showNotification("Este médico no tiene CV registrado.", "error");
      return;
    }
    setDoctorCV(doctor);
  };

  const cvUrlSeleccionado = doctorCV?.cvUrl || null;

  return (
    <div className="lista-citas">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>
          {notification.type === "success" ? "✅ " : "❌ "}
          {notification.message}
        </div>
      )}

      <h1>Médicos Registrados</h1>

      <div className="buscador-container">
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad o CMP..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
      </div>

      {cargando ? (
        <p className="texto-cargando">Cargando médicos...</p>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="citas-table citas-table-medicos">
              <thead>
                <tr>
                  <th className="col-nombre">Nombre</th>
                  <th className="col-especialidad">Especialidad</th>
                  <th className="col-cmp">CMP</th>
                  <th>Correo</th>
                  <th className="col-telefono">Teléfono</th>
                  <th className="col-cv">CV</th>
                </tr>
              </thead>
              <tbody>
                {doctoresFiltrados.length > 0 ? (
                  doctoresFiltrados.map((d) => (
                    <tr key={d.id}>
                      <td className="col-nombre">
                        {d.nombres} {d.apellidos}
                      </td>
                      <td className="col-especialidad">
                        {d.especialidad || "-"}
                      </td>
                      <td className="col-cmp">{d.cmp || "-"}</td>
                      <td>{d.correo || "-"}</td>
                      <td className="col-telefono">{d.telefono || "-"}</td>
                      <td className="col-cv">
                        {d.cvUrl ? (
                          <button
                            type="button"
                            className="btn-small btn-ver-cv"
                            onClick={() => handleVerCV(d)}
                          >
                            Ver CV
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="sin-resultados">
                      No se encontraron médicos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {doctorCV && (
        <div className="modal-overlay">
          <div className="modal-card-cv">
            <div className="modal-cv-header">
              <h3>
                CV de {doctorCV.nombres} {doctorCV.apellidos}
              </h3>
              <button
                type="button"
                className="modal-cv-close"
                onClick={() => setDoctorCV(null)}
              >
                ×
              </button>
            </div>

            {cvUrlSeleccionado ? (
              <iframe
                src={cvUrlSeleccionado}
                title="CV Médico"
                className="modal-cv-iframe"
              />
            ) : (
              <p className="sin-resultados">
                No se encontró un archivo de CV para este médico.
              </p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDoctorCV(null)}
              >
                Cerrar
              </button>
              {cvUrlSeleccionado && (
                <a
                  href={cvUrlSeleccionado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Abrir en nueva pestaña
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaMedicos;
