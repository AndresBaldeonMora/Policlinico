import { useEffect, useState } from "react";
import "./ListaCitas.css";
import { CitaApiService } from "../services/cita.service";
import type { CitaProcesada } from "../services/cita.service";
import { Trash2, CalendarClock } from "lucide-react"; // 🧩 Íconos profesionales

const HORARIOS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00",
];

const ListaCitas = () => {
  const [citas, setCitas] = useState<CitaProcesada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const [editando, setEditando] = useState<{
    id: string;
    dni: string;
    paciente: string;
    especialidad: string;
    doctor: string;
    fecha: string;
    hora: string;
  } | null>(null);

  const cargarCitas = async () => {
    try {
      setCargando(true);
      const data = await CitaApiService.listar();
      setCitas(data);
    } catch (error) {
      console.error("❌ Error al cargar citas:", error);
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

  const eliminarCita = async (id: string) => {
    if (confirm("¿Seguro que deseas eliminar esta cita?")) {
      try {
        await CitaApiService.eliminar(id);
        alert("✅ Cita eliminada correctamente");
        cargarCitas();
      } catch (error) {
        alert("❌ Error al eliminar cita");
        console.error(error);
      }
    }
  };

  const onReprogramar = (cita: CitaProcesada) => {
    setEditando({
      id: cita._id,
      dni: cita.dni,
      paciente: cita.paciente,
      especialidad: cita.especialidad,
      doctor: cita.doctor,
      fecha: "",
      hora: "",
    });
  };

  const confirmarReprogramar = async () => {
    if (!editando?.fecha || !editando?.hora) {
      alert("Por favor selecciona nueva fecha y hora");
      return;
    }

    try {
      await CitaApiService.reprogramar(
        editando.id,
        editando.fecha,
        editando.hora
      );
      alert("✅ Cita reprogramada correctamente");
      setEditando(null);
      cargarCitas();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message || "❌ Error al reprogramar cita");
      } else {
        alert("❌ Error desconocido al reprogramar cita");
      }
      console.error(error);
    }
  };

  return (
    <div className="lista-citas">
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
                      <td>{cita.fecha}</td>
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
                        <button
                          className="btn-icon"
                          title="Eliminar cita"
                          aria-label="Eliminar cita"
                          onClick={() => eliminarCita(cita._id)}
                        >
                          <Trash2 size={20} strokeWidth={2} color="#dc2626" />
                        </button>
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

      {/* 🟣 Modal Reprogramar */}
      {editando && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Reprogramar Cita</h3>

            <div className="modal-body">
              <div className="form-group">
                <label>DNI</label>
                <input type="text" value={editando.dni} disabled />
              </div>
              <div className="form-group">
                <label>Paciente</label>
                <input type="text" value={editando.paciente} disabled />
              </div>
              <div className="form-group">
                <label>Especialidad</label>
                <input type="text" value={editando.especialidad} disabled />
              </div>
              <div className="form-group">
                <label>Doctor</label>
                <input type="text" value={editando.doctor} disabled />
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
