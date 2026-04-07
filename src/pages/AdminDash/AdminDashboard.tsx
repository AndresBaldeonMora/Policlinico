import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope, Users, BookOpen, ArrowRight,
  ClipboardList, FlaskConical, Search,
} from "lucide-react";
import { DoctorApiService } from "../../services/doctor.service";
import { EspecialidadApiService } from "../../services/especialidad.service";
import { PacienteApiService } from "../../services/paciente.service";
import {
  ReportesApiService,
  type ReporteOrdenPorEstado,
  type ReporteExamenSolicitado,
} from "../../services/reportes.service";
import "./AdminDashboard.css";

interface StatsState {
  doctores: number;
  especialidades: number;
  pacientes: number;
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE:  "Pendiente",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
  CANCELADA:  "Cancelada",
};
 
const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:  "#3b82f6",
  EN_PROCESO: "#f59e0b",
  COMPLETADO: "#10b981",
  CANCELADA:  "#ef4444",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsState>({ doctores: 0, especialidades: 0, pacientes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Reportes — período
  const hoy    = new Date().toISOString().split("T")[0];
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [fechaInicio,     setFechaInicio]     = useState(hace30);
  const [fechaFin,        setFechaFin]        = useState(hoy);
  const [ordenes,         setOrdenes]         = useState<ReporteOrdenPorEstado[]>([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [errorOrdenes,    setErrorOrdenes]    = useState<string | null>(null);
 
  // Reportes — exámenes
  const [examenes,         setExamenes]         = useState<ReporteExamenSolicitado[]>([]);
  const [cargandoExamenes, setCargandoExamenes] = useState(true);
  const [errorExamenes,    setErrorExamenes]    = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [doctores, especialidades, pacientes] = await Promise.all([
          DoctorApiService.listar(),
          EspecialidadApiService.listar(),
          PacienteApiService.listar(),
        ]);
        setStats({
          doctores: doctores.length,
          especialidades: especialidades.length,
          pacientes: pacientes.length,
        });
      } catch {
        setError("No se pudo cargar la información.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Cargar exámenes al montar ──
  useEffect(() => {
    const fetchExamenes = async () => {
      try {
        setCargandoExamenes(true);
        setExamenes(await ReportesApiService.examenesMasSolicitados());
      } catch {
        setErrorExamenes("No se pudo cargar el reporte de exámenes.");
      } finally {
        setCargandoExamenes(false);
      }
    };
    fetchExamenes();
  }, []);
 
  // ── Buscar órdenes por período ──
  const buscarOrdenes = async () => {
    if (!fechaInicio || !fechaFin) return;
    try {
      setCargandoOrdenes(true);
      setErrorOrdenes(null);
      setOrdenes(await ReportesApiService.ordenesPorPeriodo(fechaInicio, fechaFin));
    } catch {
      setErrorOrdenes("No se pudo cargar el reporte de órdenes.");
    } finally {
      setCargandoOrdenes(false);
    }
  };
 
  useEffect(() => { buscarOrdenes(); }, []);
 
  const totalOrdenes = ordenes.reduce((acc, o) => acc + o.cantidad, 0);
  const maxExamen    = examenes[0]?.total ?? 1;

  const cards = [
    {
      label: "Especialidades",
      value: stats.especialidades,
      icon: BookOpen,
      path: "/admin/especialidades",
      color: "var(--primary)",
      bg: "rgba(20, 184, 166, 0.08)",
    },
    {
      label: "Doctores",
      value: stats.doctores,
      icon: Stethoscope,
      path: "/admin/doctores",
      color: "#6366f1",
      bg: "rgba(99, 102, 241, 0.08)",
    },
    {
      label: "Pacientes",
      value: stats.pacientes,
      icon: Users,
      path: "/admin/pacientes",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.08)",
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-top">
        <div className="dashboard-heading">
          <h1 className="dashboard-title">Panel de Administración</h1>
          <p className="dashboard-subtitle">Gestión general del sistema</p>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <div className="dashboard-stats">
        {cards.map(({ label, value, icon: Icon, path, color, bg }) => (
          <div
            key={label}
            className="ad-card"
            style={{ "--card-color": color, "--card-bg": bg } as React.CSSProperties}
            onClick={() => navigate(path)}
          >
            <div className="ad-card-icon">
              <Icon size={22} />
            </div>
            <div className="ad-card-info">
              <span className="stat-label">{label}</span>
              <span className="stat-value">
                {loading ? <span className="stat-skeleton" /> : value}
              </span>
            </div>
            <ArrowRight size={16} className="ad-card-arrow" />
          </div>
        ))}
      </div>

      {/* ── Reporte: Órdenes por período ── */}
      <div className="ar-section">
        <div className="ar-section-header">
          <div className="ar-section-title">
            <ClipboardList size={18} />
            <h2>Órdenes por Período</h2>
          </div>
          <div className="ar-filters">
            <div className="ar-filter-group">
              <label className="ar-filter-label">Desde</label>
              <input
                type="date" className="ar-input" value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)} max={fechaFin}
              />
            </div>
            <div className="ar-filter-group">
              <label className="ar-filter-label">Hasta</label>
              <input
                type="date" className="ar-input" value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)} min={fechaInicio} max={hoy}
              />
            </div>
            <button className="btn-page-action" onClick={buscarOrdenes} disabled={cargandoOrdenes}>
              {cargandoOrdenes
                ? <><span className="ar-spinner" /> Buscando...</>
                : <><Search size={15} /> Buscar</>
              }
            </button>
          </div>
        </div>
 
        {errorOrdenes && <div className="ar-error">{errorOrdenes}</div>}
 
        {cargandoOrdenes ? (
          <div className="lista-loading"><div className="lista-loading-spinner" /><p>Cargando reporte...</p></div>
        ) : ordenes.length === 0 ? (
          <div className="ar-empty"><ClipboardList size={32} /><p>No hay órdenes en este período.</p></div>
        ) : (
          <>
            <div className="ar-stats-row">
              {ordenes.map((o) => (
                <div
                  key={o._id} className="ar-stat-card"
                  style={{ "--estado-color": ESTADO_COLORS[o._id] ?? "var(--primary)" } as React.CSSProperties}
                >
                  <span className="ar-stat-label">{ESTADO_LABELS[o._id] ?? o._id}</span>
                  <span className="ar-stat-value">{o.cantidad}</span>
                  <div className="ar-stat-bar">
                    <div className="ar-stat-bar-fill" style={{ width: `${(o.cantidad / totalOrdenes) * 100}%` }} />
                  </div>
                  <span className="ar-stat-pct">{Math.round((o.cantidad / totalOrdenes) * 100)}%</span>
                </div>
              ))}
            </div>
            <p className="ar-total">Total: <strong>{totalOrdenes}</strong> órdenes en el período</p>
          </>
        )}
      </div>
 
      {/* ── Reporte: Exámenes más solicitados ── */}
      <div className="ar-section">
        <div className="ar-section-header">
          <div className="ar-section-title">
            <FlaskConical size={18} />
            <h2>Exámenes más Solicitados</h2>
          </div>
        </div>
 
        {errorExamenes && <div className="ar-error">{errorExamenes}</div>}
 
        {cargandoExamenes ? (
          <div className="lista-loading"><div className="lista-loading-spinner" /><p>Cargando exámenes...</p></div>
        ) : examenes.length === 0 ? (
          <div className="ar-empty"><FlaskConical size={32} /><p>No hay datos de exámenes aún.</p></div>
        ) : (
          <div className="lista-table-card">
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Examen</th>
                    <th style={{ width: 200 }}>Frecuencia</th>
                    <th style={{ width: 80, textAlign: "center" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {examenes.map((e, idx) => (
                    <tr key={String(e._id)}>
                      <td>
                        <span className={`ar-rank ${idx < 3 ? "ar-rank--top" : ""}`}>{idx + 1}</span>
                      </td>
                      <td>
                        <div className="ge-especialidad-cell">
                          <div className="ge-icon-wrap"><FlaskConical size={14} /></div>
                          <span className="ge-nombre">{String(e._id)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="ar-bar-wrap">
                          <div className="ar-bar" style={{ width: `${(e.total / maxExamen) * 100}%` }} />
                        </div>
                      </td>
                      <td className="td-center">
                        <span className="ar-count">{e.total}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
 
    </div>
  );
};
 
export default AdminDashboard;