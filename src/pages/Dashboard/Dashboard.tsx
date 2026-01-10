import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import "./Dashboard.css";

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  iconColor: string;
  link: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions: QuickAction[] = [
    {
      title: "Reservar cita",
      description: "Buscar por DNI, registrar paciente rápido y agendar.",
      icon: "🗓️",
      color: "#ecfdf5",
      iconColor: "#10b981",
      link: "/reserva-cita",
    },
    {
      title: "Gestión de citas",
      description: "Ver, filtrar y reprogramar las citas del día.",
      icon: "📋",
      color: "#eff6ff",
      iconColor: "#3b82f6",
      link: "/lista-citas",
    },
    {
      title: "Pacientes",
      description: "Consultar datos y contacto de pacientes registrados.",
      icon: "👥",
      color: "#f0fdf4",
      iconColor: "#16a34a",
      link: "/pacientes",
    },
    {
      title: "Médicos",
      description: "Ver especialidades, contacto y CV disponibles.",
      icon: "👨‍⚕️",
      color: "#fefce8",
      iconColor: "#ca8a04",
      link: "/doctores",
    },
  ];

  return (
    <div className="dashboard">
      {/* Hero principal */}
      <section className="dashboard-hero">
        <div className="hero-text">
          <h1 className="hero-title">Centro Médico – Panel de Control</h1>
          <p className="hero-subtitle">
            Accede rápidamente a las funciones clave para gestionar citas,
            pacientes y médicos.
          </p>
        </div>
        <div className="hero-card">
          <div className="hero-icon">🏥</div>
          <p className="hero-label">
            {user ? `Módulo ${user.rol}` : "Módulo Recepción"}
          </p>
        </div>
      </section>

      {/* Accesos directos */}
      <section className="quick-actions-section">
        <h2 className="section-title">Accesos directos</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <button
              key={action.title}
              className="action-card"
              style={{ backgroundColor: action.color }}
              onClick={() => navigate(action.link)}
            >
              <div className="action-icon" style={{ color: action.iconColor }}>
                {action.icon}
              </div>
              <div className="action-content">
                <h3
                  className="action-title"
                  style={{ color: action.iconColor }}
                >
                  {action.title}
                </h3>
                <p className="action-description">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
