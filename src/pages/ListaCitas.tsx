import { useEffect, useState } from "react";
import "./ListaCitas.css";
import { CitaApiService } from "../services/cita.service";
import type { CitaProcesada } from "../services/cita.service";

const ListaCitas = () => {
  const [citas, setCitas] = useState<CitaProcesada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // 🔹 Cargar citas desde backend
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

  // 🔍 Buscar por DNI o Doctor
  const filtrarCitas = citas.filter((cita) => {
    const filtro = busqueda.toLowerCase();
    return (
      cita.dni.toLowerCase().includes(filtro) ||
      cita.doctor.toLowerCase().includes(filtro)
    );
  });

  // 🟢 Manejo de eliminación
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

  return (
    <div className="lista-citas">
      <h1>Lista de Citas Programadas</h1>

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
                        <button className="btn-icon" title="Ver">
                          👁️
                        </button>
                        <button className="btn-icon" title="Reprogramar">
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Eliminar"
                          onClick={() => eliminarCita(cita._id)}
                        >
                          ❌
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
    </div>
  );
};

export default ListaCitas;
