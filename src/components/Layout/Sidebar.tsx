import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const adminMenu = [
    {
      path: "/",
      label: "Calendario",
      icon: "📅",
      description: "Vista principal de citas",
    },
    {
      path: "/reserva-cita",
      label: "Solicitar Cita",
      icon: "📝",
      description: "Agendar nueva cita médica",
    },
    {
      path: "/lista-citas",
      label: "Gestión de Citas",
      icon: "📋",
      description: "Ver y administrar todas las citas",
    },
    {
      path: "/medicos",
      label: "Médicos",
      icon: "👨‍⚕️",
      description: "Directorio de doctores",
    },
    {
      path: "/pacientes",
      label: "Pacientes",
      icon: "👥",
      description: "Listado de pacientes",
    },
  ];

  const medicoMenu = [
    {
      path: "/medico",
      label: "Mi Tablero",
      icon: "📊",
      description: "Resumen de mis citas",
    },
  ];

  const menuItems = user?.rol === "MEDICO" ? medicoMenu : adminMenu;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#22c55e" />
              <path
                d="M16 8V24M24 16H8"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="logo-text">Policlínico</h2>
            <p className="logo-subtitle">
              {user?.rol === "MEDICO" ? "Portal Médico" : "Administración"}
            </p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <p className="nav-section-title">MENÚ PRINCIPAL</p>

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                title={item.description}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="nav-section">
          <p className="nav-section-title">CONFIGURACIÓN</p>
          <Link
            to="/perfil"
            className={`sidebar-link ${
              location.pathname === "/perfil" ? "active" : ""
            }`}
          >
            <span className="sidebar-icon">👤</span>
            <span className="sidebar-label">Mi Perfil</span>
          </Link>
        </div>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div
            style={{
              marginBottom: "10px",
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            {user.nombres}
          </div>
        )}
        <button className="btn-logout" onClick={handleLogout}>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
