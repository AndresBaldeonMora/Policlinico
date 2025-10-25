import { useEffect, useState } from "react";
import "./ListaCitas.css";
import { CitaApiService } from "../services/cita.service";
import type { CitaProcesada } from "../services/cita.service";
// ❌ IMPORTACIÓN DE Trash2 ELIMINADA. Solo CalendarClock es necesario.
import { CalendarClock } from "lucide-react"; // 🧩 Íconos profesionales

// --- Componente de Notificación Reutilizable (Se mantiene)
interface NotificationProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

const Notification = ({ message, type, visible }: NotificationProps) => {
  if (!visible) return null;
  return (
    <div className={`notification ${type}`}>
      {type === "success" ? "✅ " : "❌ "}
      {message}
    </div>
  );
};
// ----------------------------------------------------------------------------------

const HORARIOS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
];

const ListaCitas = () => {
  const [citas, setCitas] = useState<CitaProcesada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // --- Estado de la Notificación (Toast) ---
  const [notification, setNotification] = useState({
    message: "",
    type: "", // 'success' o 'error'
    visible: false,
  });

  const [editando, setEditando] = useState<{
    id: string;
    dni: string;
    paciente: string;
    especialidad: string;
    doctor: string;
    fecha: string;
    hora: string;
  } | null>(null);

  // --- Función para mostrar Notificación ---
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    // Ocultar después de 3 segundos
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const cargarCitas = async () => {
    try {
      setCargando(true);
      // El servicio ahora retorna las fechas en formato DD/MM/YYYY
      const data = await CitaApiService.listar();
      setCitas(data);
    } catch (error) {
      console.error("❌ Error al cargar citas:", error);
      showNotification("Error al cargar la lista de citas.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  const filtrarCitas = citas.filter((cita) => {
    const filtro = busqueda.toLowerCase();
    return (
      cita.dni.toLowerCase().includes(filtro) ||
      cita.doctor.toLowerCase().includes(filtro)
    );
  });

  // ❌ FUNCIÓN eliminarCita ELIMINADA
  /*
  const eliminarCita = async (id: string) => { ... lógica de eliminación ... };
  */

  const onReprogramar = (cita: CitaProcesada) => {
    setEditando({
      id: cita._id,
      dni: cita.dni,
      paciente: cita.paciente,
      especialidad: cita.especialidad,
      doctor: cita.doctor,
      fecha: "", // Se limpia para seleccionar nueva fecha
      hora: "",
    });
  };

  const confirmarReprogramar = async () => {
    if (!editando?.fecha || !editando?.hora) {
      showNotification("Por favor selecciona una nueva fecha y hora.", "error");
      return;
    }

    try {
      await CitaApiService.reprogramar(
        editando.id,
        editando.fecha,
        editando.hora
      );
      showNotification("Cita reprogramada correctamente.", "success");
      setEditando(null);
      cargarCitas();
    } catch (error: unknown) {
      let errorMessage = "Error desconocido al reprogramar cita.";
      if (error instanceof Error) {
        errorMessage = error.message || "Error al reprogramar cita.";
      }
      showNotification(errorMessage, "error");
      console.error(error);
    }
  };

  return (
    <div className="lista-citas">
      {/* 🔔 Notificación Toast */}
      <Notification
        message={notification.message}
        type={notification.type as "success" | "error"}
        visible={notification.visible}
      />

      <h1>Lista de Citas Programadas</h1>

      {/* 🔍 Buscador */}
      <div className="buscador-container">
        <input
          type="text"
          placeholder="Buscar por DNI o Doctor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
      </div>

      {cargando ? (
        <p className="texto-cargando">Cargando citas...</p>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="citas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>DNI</th>
                  <th>Paciente</th>
                  <th>Doctor</th>
                  <th>Especialidad</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrarCitas.length > 0 ? (
                  filtrarCitas.map((cita) => (
                    <tr key={cita._id}>
                      <td>{cita.id}</td>
                      <td>{cita.dni}</td>
                      <td>{cita.paciente}</td>
                      <td>{cita.doctor}</td>
                      <td>{cita.especialidad}</td>
                      <td>{cita.fecha}</td>{" "}
                      {/* ✅ FECHA AHORA CORRECTA (DD/MM/YYYY) */}
                      <td>{cita.hora}</td>
                      <td>
                        <span
                          className={`badge ${
                            cita.estado === "pendiente"
                              ? "badge-warning"
                              : cita.estado === "reprogramado"
                              ? "badge-info"
                              : "badge-success"
                          }`}
                        >
                          {cita.estado.charAt(0).toUpperCase() +
                            cita.estado.slice(1)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Reprogramar cita"
                          aria-label="Reprogramar cita"
                          onClick={() => onReprogramar(cita)}
                        >
                          <CalendarClock size={20} strokeWidth={2} />
                        </button>
                        {/* ❌ BOTÓN DE ELIMINAR ELIMINADO */}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="sin-resultados">
                      No se encontraron citas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🟣 Modal Reprogramar (Se mantiene igual, solo se actualiza el className de los inputs) */}
      {editando && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Reprogramar Cita</h3>

            <div className="modal-body">
              <div className="form-group">
                <label>DNI</label>
                <input
                  type="text"
                  value={editando.dni}
                  disabled
                  className="input-disabled-modal"
                />
              </div>
              <div className="form-group">
                <label>Paciente</label>
                <input
                  type="text"
                  value={editando.paciente}
                  disabled
                  className="input-disabled-modal"
                />
              </div>
              <div className="form-group">
                <label>Especialidad</label>
                <input
                  type="text"
                  value={editando.especialidad}
                  disabled
                  className="input-disabled-modal"
                />
              </div>
              <div className="form-group">
                <label>Doctor</label>
                <input
                  type="text"
                  value={editando.doctor}
                  disabled
                  className="input-disabled-modal"
                />
              </div>

              {/* 📅 Nueva fecha */}
              <div className="form-group">
                <label>Nueva Fecha</label>
                <input
                  type="date"
                  value={editando.fecha}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setEditando({
                      ...editando,
                      fecha: e.target.value,
                      hora: "",
                    })
                  }
                  className="input-date"
                />
              </div>

              {/* 🕒 Horarios disponibles */}
              {editando.fecha && (
                <div className="horarios-section">
                  <p className="horarios-title">Horarios Disponibles</p>
                  <div className="horarios-grid">
                    {HORARIOS.map((hora) => (
                      <button
                        key={hora}
                        type="button"
                        className={`horario-btn ${
                          editando.hora === hora ? "selected" : "disponible"
                        }`}
                        onClick={() => setEditando({ ...editando, hora })}
                      >
                        {hora}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setEditando(null)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarReprogramar}
                className="btn btn-primary"
                disabled={!editando.fecha || !editando.hora}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaCitas;
