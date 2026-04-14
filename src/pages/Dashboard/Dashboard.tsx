import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CitaApiService, type CitaProcesada } from "../../services/cita.service";
import { ExamenService, type OrdenExamen } from "../../services/examen.service";
import "./Dashboard.css";

const ESTADO_LABELS: Record<CitaProcesada["estado"], string> = {
  PENDIENTE: "Pendiente",
  ATENDIDA: "Atendida",
  CANCELADA: "Cancelada",
  REPROGRAMADA: "Reprogramada",
};

function parseFechaDMY(fechaStr: string): Date {
  const [day, month, year] = fechaStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

function esCitaHoy(fechaStr: string): boolean {
  const hoy = new Date();
  const fecha = parseFechaDMY(fechaStr);
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [citasHoy, setCitasHoy] = useState<CitaProcesada[]>([]);
  const [ordenesPendientes, setOrdenesPendientes] = useState<OrdenExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [todasCitas, ordenes] = await Promise.all([
          CitaApiService.listar(),
          ExamenService.listarOrdenesPendientes(),
        ]);

        const hoy = todasCitas.filter((c) => esCitaHoy(c.fecha) && c.tipo !== "LABORATORIO");
        setCitasHoy(hoy);

        // Órdenes pendientes que no tienen cita de laboratorio generada
        const ordenesSinCitaLab = ordenes.filter(
          (o) => o.estado === "PENDIENTE" && !o.citaLabId
        );
        setOrdenesPendientes(ordenesSinCitaLab);
      } catch {
        setError("No se pudo cargar la información del dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const citasPendientesHoy = citasHoy.filter((c) => c.estado === "PENDIENTE").length;
  const citasAtendidasHoy = citasHoy.filter((c) => c.estado === "ATENDIDA").length;

  return (
    <div className="dashboard">
      <div className="dashboard-top">
        <div className="dashboard-heading">
          <h1 className="dashboard-title">Panel clínico</h1>
          <p className="dashboard-subtitle">Resumen del día</p>
        </div>
        <div className="dashboard-actions">
          <button
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => navigate("/pacientes?nuevo=1")}
          >
            Buscar paciente
          </button>
          <button
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => navigate("/laboratorio-imagen")}
          >
            Ver laboratorio / imagen
          </button>
          <button
            className="dashboard-btn dashboard-btn-primary"
            onClick={() => navigate("/reserva-cita")}
          >
            Nueva cita
          </button>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {/* Stats rápidos */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-label">Citas hoy</span>
          <span className="stat-value">
            {loading ? <span className="stat-skeleton" /> : citasHoy.length}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pendientes</span>
          <span className="stat-value">
            {loading ? <span className="stat-skeleton" /> : citasPendientesHoy}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Atendidas</span>
          <span className="stat-value">
            {loading ? <span className="stat-skeleton" /> : citasAtendidasHoy}
          </span>
        </div>
        <div className="stat-card stat-card-warning">
          <span className="stat-label">Órdenes lab sin cita</span>
          <span className="stat-value">
            {loading ? <span className="stat-skeleton" /> : ordenesPendientes.length}
          </span>
        </div>
      </div>

      {/* Agenda de hoy */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Agenda de hoy</h2>
        {loading ? (
          <div className="dashboard-table-skeleton">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="table-row-skeleton" />
            ))}
          </div>
        ) : citasHoy.length === 0 ? (
          <p className="dashboard-empty">No hay citas programadas para hoy.</p>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Doctor</th>
                  <th>Especialidad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citasHoy
                  .sort((a, b) => a.hora.localeCompare(b.hora))
                  .map((cita) => (
                    <tr
                      key={cita._id}
                      className="dashboard-table-row"
                      onClick={() => navigate(`/citas/${cita._id}`)}
                    >
                      <td className="td-hora">{cita.hora}</td>
                      <td>{cita.paciente}</td>
                      <td>{cita.doctor}</td>
                      <td>{cita.especialidad}</td>
                      <td>
                        <span className={`estado-badge estado-${cita.estado}`}>
                          {ESTADO_LABELS[cita.estado]}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Órdenes de lab pendientes de cita */}
      {ordenesPendientes.length > 0 && (
        <div className="dashboard-section">
          <h2 className="dashboard-section-title">
            Órdenes de laboratorio / imagen pendientes de cita
          </h2>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Doctor</th>
                  <th>Especialidad</th>
                  <th>Fecha orden</th>
                  <th>Exámenes</th>
                </tr>
              </thead>
              <tbody>
                {ordenesPendientes.map((orden) => (
                  <tr key={orden._id} className="dashboard-table-row">
                    <td>
                      {orden.pacienteId?.nombres} {orden.pacienteId?.apellidos}
                    </td>
                    <td>
                      {orden.doctorId?.nombres} {orden.doctorId?.apellidos}
                    </td>
                    <td>{orden.especialidadId?.nombre}</td>
                    <td>
                      {new Date(orden.fecha).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td>{orden.items?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
