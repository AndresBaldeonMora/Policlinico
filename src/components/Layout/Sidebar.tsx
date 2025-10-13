import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { 
      path: '/', 
      label: 'Inicio', 
      icon: '🏠',
      description: 'Dashboard principal'
    },
    { 
      path: '/reserva-cita', 
      label: 'Solicitar citas', 
      icon: '📅',
      description: 'Agendar nueva cita'
    },
    { 
      path: '/lista-citas', 
      label: 'Gestión de citas', 
      icon: '📋',
      description: 'Ver todas las citas'
    },
    { 
      path: '/doctores', 
      label: 'Médicos', 
      icon: '👨‍⚕️',
      description: 'Directorio médico'
    },
    { 
      path: '/pacientes', 
      label: 'Pacientes', 
      icon: '👥',
      description: 'Gestión de pacientes'
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#22c55e"/>
              <path d="M16 8V24M24 16H8" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className="logo-text">Policlínico</h2>
            <p className="logo-subtitle">Sistema Interno</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <p className="nav-section-title">MENÚ PRINCIPAL</p>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-section">
          <p className="nav-section-title">CONFIGURACIÓN</p>
          <Link to="/perfil" className="sidebar-link">
            <span className="sidebar-icon">👤</span>
            <span className="sidebar-label">Mi Perfil</span>
          </Link>
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout">
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;