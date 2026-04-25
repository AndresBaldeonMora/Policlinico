import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ClipboardList,
  FlaskConical,
  User,
  CalendarCheck,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "../../hooks/userAuth";
import { usePacienteDashboard } from "../../hooks/usePacienteDashboard";
import { formatearFechaLarga } from "../../utils/fecha.utils";
import { CardModulo } from "../../components/PacienteComponents/CardModulo";
import { ResumenCita } from "../../components/PacienteComponents/ResumenCita";
import { ResumenOrden } from "../../components/PacienteComponents/ResumenOrden";
import "./PacienteDashboard.css";

/* ── Fecha de hoy para el subtítulo (estable por render) ── */
const fechaHoy = formatearFechaLarga(new Date().toISOString());

const PacienteDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    proximaCita,
    citasPendientes,
    proximaOrden,
    ordenesPendientes,
    loading,
    error,
  } = usePacienteDashboard();

  /* ── Modulos (memoized — depends on badge counts) ── */
  const modulos = useMemo(
    () => [
      {
        titulo: "Mis Citas",
        descripcion: "Agenda y gestiona tus citas médicas",
        icono: <Calendar size={32} />,
        ruta: "/paciente/citas",
        color: "var(--accent)",
        badge: citasPendientes > 0 ? citasPendientes : undefined,
      },
      {
        titulo: "Mi Historial",
        descripcion: "Revisa tu historial de atenciones",
        icono: <ClipboardList size={32} />,
        ruta: "/paciente/historial",
        color: "var(--primary)",
      },
      {
        titulo: "Mis Órdenes",
        descripcion: "Consulta tus órdenes de exámenes",
        icono: <FlaskConical size={32} />,
        ruta: "/paciente/ordenes",
        color: "var(--warning)",
        badge: ordenesPendientes > 0 ? ordenesPendientes : undefined,
      },
      {
        titulo: "Mi Perfil",
        descripcion: "Actualiza tus datos personales",
        icono: <User size={32} />,
        ruta: "/paciente/perfil",
        color: "var(--secondary)",
      },
    ],
    [citasPendientes, ordenesPendientes],
  );

  /* ── Navigation callbacks ── */
  const handleVerCita = useCallback(
    (id: string) => {
      navigate(`/paciente/citas/${id}`);
    },
    [navigate],
  );

  const handleVerOrden = useCallback(
    (id: string) => {
      navigate(`/paciente/ordenes/${id}`);
    },
    [navigate],
  );

  /* ── Próxima cita text for stat card ── */
  const proximaCitaTexto = useMemo(() => {
    if (loading) return "...";
    if (!proximaCita) return "Sin citas";
    try {
      return formatearFechaLarga(proximaCita.fecha);
    } catch {
      return proximaCita.fecha;
    }
  }, [loading, proximaCita]);

  return (
    <div>
      {/* ── Sección 1: Bienvenida ── */}
      <div className="paciente-dashboard__welcome">
        <h1 className="paciente-dashboard__welcome-title">
          Bienvenido, {user?.nombres ?? "Paciente"}
        </h1>
        <p className="paciente-dashboard__welcome-date">{fechaHoy}</p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="paciente-dashboard__error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Sección 2: Resumen rápido (3 contadores) ── */}
      <div className="paciente-dashboard__stats">
        <div className="paciente-dashboard__stat">
          <div className="paciente-dashboard__stat-icon paciente-dashboard__stat-icon--citas">
            <Calendar size={20} />
          </div>
          <div className="paciente-dashboard__stat-info">
            <p className="paciente-dashboard__stat-value">
              {loading ? "—" : citasPendientes}
            </p>
            <p className="paciente-dashboard__stat-label">Citas pendientes</p>
          </div>
        </div>

        <div className="paciente-dashboard__stat">
          <div className="paciente-dashboard__stat-icon paciente-dashboard__stat-icon--proxima">
            <CalendarCheck size={20} />
          </div>
          <div className="paciente-dashboard__stat-info">
            <p className="paciente-dashboard__stat-value paciente-dashboard__stat-value--text">
              {proximaCitaTexto}
            </p>
            <p className="paciente-dashboard__stat-label">Próxima cita</p>
          </div>
        </div>

        <div className="paciente-dashboard__stat">
          <div className="paciente-dashboard__stat-icon paciente-dashboard__stat-icon--ordenes">
            <FileText size={20} />
          </div>
          <div className="paciente-dashboard__stat-info">
            <p className="paciente-dashboard__stat-value">
              {loading ? "—" : ordenesPendientes}
            </p>
            <p className="paciente-dashboard__stat-label">Órdenes pendientes</p>
          </div>
        </div>
      </div>

      {/* ── Sección 3: Acceso rápido (4 CardModulo) ── */}
      <h2 className="paciente-dashboard__section-title">Acceso rápido</h2>
      <div className="paciente-dashboard__modules">
        {modulos.map((modulo) => (
          <CardModulo key={modulo.ruta} {...modulo} />
        ))}
      </div>

      {/* ── Sección 4: Próxima cita y orden pendiente ── */}
      <h2 className="paciente-dashboard__section-title">Tu actividad reciente</h2>
      <div className="paciente-dashboard__resumen">
        <ResumenCita
          cita={proximaCita}
          loading={loading}
          onVerDetalle={handleVerCita}
        />
        <ResumenOrden
          orden={proximaOrden}
          loading={loading}
          onVerDetalle={handleVerOrden}
        />
      </div>
    </div>
  );
};

export default PacienteDashboard;
