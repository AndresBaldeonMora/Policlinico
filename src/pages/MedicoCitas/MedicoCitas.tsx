import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico } from "../../services/medico.service";
import "../../pages/PerfilCita/PerfilCita.css";

const MedicoCitas = () => {
  const [citas, setCitas]               = useState<CitaMedico[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busqueda, setBusqueda]         = useState("");
  const [cargando, setCargando]         = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    MedicoApiService.obtenerMisCitas()
      .then(setCitas)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const citasFiltradas = citas.filter((c) => {
    const pasaEstado    = filtroEstado === "TODOS" || c.estado === filtroEstado;
    const textoBusqueda = `${c.pacienteId.nombres} ${c.pacienteId.apellidos} ${c.pacienteId.dni}`.toLowerCase();
    const pasaBusqueda  = !busqueda || textoBusqueda.includes(busqueda.toLowerCase());
    return pasaEstado && pasaBusqueda;
  });

  if (cargando) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner" />
          <p className="loading-text">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="medico-citas-page">
      <div className="medico-citas-header">
        <h2>Mis Citas</h2>
        <span className="medico-citas-count">
          {citasFiltradas.length} resultado{citasFiltradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="medico-citas-filtros">
        <input
          type="text"
          placeholder="Buscar por nombre o DNI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="TODOS">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ATENDIDA">Atendida</option>
          <option value="CANCELADA">Cancelada</option>
          <option value="REPROGRAMADA">Reprogramada</option>
        </select>
      </div>

      {citasFiltradas.length === 0 ? (
        <div className="medico-citas-vacio">
          No hay citas que coincidan con los filtros.
        </div>
      ) : (
        <div className="medico-citas-tabla-wrapper">
          <table className="medico-citas-tabla">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>DNI</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {citasFiltradas.map((c) => (
                <tr key={c._id}>
                  <td>{c.pacienteId.nombres} {c.pacienteId.apellidos}</td>
                  <td className="td-muted">{c.pacienteId.dni}</td>
                  <td>{new Date(c.fecha).toLocaleDateString("es-PE", { timeZone: "UTC" })}</td>
                  <td>{c.hora || "—"}</td>
                  <td className="td-muted">{c.tipo || "CONSULTA"}</td>
                  <td>
                    <span className={`badge-estado-cita badge-estado-cita--${c.estado.toLowerCase()}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/citas/${c._id}`)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MedicoCitas;
