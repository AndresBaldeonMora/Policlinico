import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CitaApiService, type CitaProcesada } from "../../services/cita.service";
import { PacienteApiService } from "../../services/paciente.service";
import "./Dashboard.css";


interface StatsState {
  citasHoy: number;
  pacientesTotal: number;
  citasProximas: number;
}

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

function esCitaProxima2Horas(fechaStr: string, hora: string): boolean {
  const ahora = new Date();
  const fecha = parseFechaDMY(fechaStr);
  const [h, m] = hora.split(":").map(Number);
  const citaDate = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), h, m);
  const diff = citaDate.getTime() - ahora.getTime();
  return diff > 0 && diff <= 2 * 60 * 60 * 1000;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsState>({
    citasHoy: 0,
    pacientesTotal: 0,
    citasProximas: 0,
  });
  const [ultimasCitas, setUltimasCitas] = useState<CitaProcesada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [todasCitas, todosPacientes] = await Promise.all([
        CitaApiService.listar(),
        PacienteApiService.listar(),
      ]);

      const citasHoy = todasCitas.filter((c) => esCitaHoy(c.fecha)).length;
      const citasProximas = todasCitas.filter((c) =>
        esCitaProxima2Horas(c.fecha, c.hora)
      ).length;

      setStats({
        citasHoy,
        pacientesTotal: todosPacientes.length,
        citasProximas,
      });
      setUltimasCitas(todasCitas.slice(0, 5));
    } catch {
      setError("No se pudo cargar la información del dashboard.");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  return (
    <div className="dashboard">
      <div className="dashboard-top">
        <div className="dashboard-heading">
          <h1 className="dashboard-title">Inicio</h1>
          <p className="dashboard-subtitle">Resumen del día</p>
        </div>
        <div className="dashboard-actions">
          <button
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => navigate("/pacientes?nuevo=1")}
          >
            Nuevo paciente
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

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-label">Citas hoy</span>
          <span className="stat-value">
            {loading ? <span className="stat-skeleton" /> : stats.citasHoy}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pacientes registrados</span>
          <span className="stat-value">
            {loading ? <span className="stat-skeleton" /> : stats.pacientesTotal}
          </span>
        </div>
        <div className="stat-card stat-card-accent">
          <span className="stat-label">Próximas citas</span>
          <span className="stat-value">
            {loading ? <span className="stat-skeleton" /> : stats.citasProximas}
          </span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Últimas citas registradas</h2>
        {loading ? (
          <div className="dashboard-table-skeleton">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="table-row-skeleton" />
            ))}
          </div>
        ) : ultimasCitas.length === 0 ? (
          <p className="dashboard-empty">No hay citas registradas.</p>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Doctor</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimasCitas.map((cita) => (
                  <tr
                    key={cita._id}
                    className="dashboard-table-row"
                    onClick={() => navigate(`/citas/${cita._id}`)}
                  >
                    <td>{cita.paciente}</td>
                    <td>{cita.doctor}</td>
                    <td>{cita.fecha}</td>
                    <td>{cita.hora}</td>
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
    </div>
  );
}