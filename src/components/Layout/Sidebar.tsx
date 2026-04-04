import { useState } from "react";
import { Link, useLocation} from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import {
  Calendar,
  CalendarPlus,
  ClipboardList,
  Stethoscope,
  Users,
  LayoutDashboard,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  FlaskConical,
  ShieldCheck, 
  BookOpen
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // pequeña correcion : de adminMenu a recepcionistaMenu 
  const recepcionistaMenu  = [
    { path: "/", label: "Inicio", icon: LayoutDashboard, description: "Panel de inicio" },
    { path: "/calendario", label: "Calendario", icon: Calendar, description: "Vista principal de citas" },
    { path: "/reserva-cita", label: "Solicitar Cita", icon: CalendarPlus, description: "Agendar nueva cita" },
    { path: "/lista-citas", label: "Gestion de Citas", icon: ClipboardList, description: "Administrar citas" },
    { path: "/medicos", label: "Medicos", icon: Stethoscope, description: "Directorio de doctores" },
    { path: "/pacientes",    label: "Pacientes",   icon: Users,         description: "Listado de pacientes" },
    { path: "/laboratorio", label: "Laboratorio", icon: FlaskConical,  description: "Órdenes de exámenes" },
  ];

  const medicoMenu = [
    { path: "/medico", label: "Calendario", icon: Calendar, description: "Mi calendario personal" },
  ];

  // Menú ADMINISTRADOR 
  const administradorMenu = [
    { path: "/admin",               label: "Panel Admin",   icon: ShieldCheck, description: "Inicio administración" },
    { path: "/admin/especialidades", label: "Especialidades", icon: BookOpen,    description: "CRUD especialidades" },
    { path: "/admin/doctores",       label: "Doctores",       icon: Stethoscope, description: "CRUD doctores" },
    { path: "/admin/pacientes",      label: "Pacientes",      icon: Users,       description: "CRUD pacientes" },
  ];

  // Versión mas factible para 3 a mas roles
  const menuMap: Record<string, typeof recepcionistaMenu> = {
    RECEPCIONISTA: recepcionistaMenu,
    MEDICO:        medicoMenu,
    ADMINISTRADOR: administradorMenu,
  };

  // const menuItems = user?.rol === "MEDICO" ? medicoMenu : adminMenu;
  const menuItems = menuMap[user?.rol ?? ""] ?? recepcionistaMenu;

  const subtitleMap: Record<string, string> = {
    MEDICO:        "Portal Médico",
    ADMINISTRADOR: "Portal Administración",
    RECEPCIONISTA: "Portal Recepcionista",
  };
  const subtitle = subtitleMap[user?.rol ?? ""] ?? "Sistema";

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
              {/* <p className="logo-subtitle">
                {user?.rol === "MEDICO" ? "Portal Medico" : "Administracion"}
              </p> */}
              <p className="logo-subtitle">{subtitle}</p>
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
      </div>
    </aside>
  );
};

export default Sidebar;
