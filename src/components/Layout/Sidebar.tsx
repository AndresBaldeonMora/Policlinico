import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import {
  Calendar,
  CalendarPlus,
  ClipboardList,
  Stethoscope,
  Users,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const adminMenu = [
    { path: "/", label: "Inicio", icon: LayoutDashboard, description: "Panel de inicio" },
    { path: "/calendario", label: "Calendario", icon: Calendar, description: "Vista principal de citas" },
    { path: "/reserva-cita", label: "Solicitar Cita", icon: CalendarPlus, description: "Agendar nueva cita" },
    { path: "/lista-citas", label: "Gestion de Citas", icon: ClipboardList, description: "Administrar citas" },
    { path: "/medicos", label: "Medicos", icon: Stethoscope, description: "Directorio de doctores" },
    { path: "/pacientes", label: "Pacientes", icon: Users, description: "Listado de pacientes" },
  ];

  const medicoMenu = [
    { path: "/medico", label: "Mi Tablero", icon: LayoutDashboard, description: "Resumen de mis citas" },
  ];

  const menuItems = user?.rol === "MEDICO" ? medicoMenu : adminMenu;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const avatarLetter = user?.nombres?.charAt(0).toUpperCase() || "U";

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="url(#logo-grad)" />
              <path d="M18 10V26M26 18H10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36">
                  <stop stopColor="#14b8a6" />
                  <stop offset="1" stopColor="#0f766e" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {!collapsed && (
            <div>
              <h2 className="logo-text">Policlinico</h2>
              <p className="logo-subtitle">
                {user?.rol === "MEDICO" ? "Portal Medico" : "Administracion"}
              </p>
            </div>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expandir menu" : "Colapsar menu"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <p className="nav-section-title">MENU PRINCIPAL</p>}
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                title={item.description}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {!collapsed && (
                  <>
                    <span className="sidebar-label">{item.label}</span>
                    {isActive && <ChevronRight size={16} className="sidebar-link-arrow" />}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">{avatarLetter}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {user ? `${user.nombres} ${user.apellidos}` : "Usuario"}
              </span>
              <span className="sidebar-user-role">{user?.rol || "Sin rol"}</span>
            </div>
          </div>
        ) : (
          <div className="sidebar-user-card sidebar-user-card--collapsed">
            <div className="sidebar-user-avatar">{avatarLetter}</div>
          </div>
        )}
        <button className="btn-logout" onClick={handleLogout} title="Cerrar Sesion">
          <LogOut size={18} strokeWidth={2} />
          {!collapsed && <span>Cerrar Sesion</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
