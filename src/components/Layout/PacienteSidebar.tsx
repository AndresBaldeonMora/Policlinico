import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import {
  Home,
  Calendar,
  ClipboardList,
  FlaskConical,
  User,
  ChevronRight,
  X,
} from "lucide-react";
import "./PacienteSidebar.css";

interface PacienteSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: "/paciente",          label: "Inicio",        icon: Home,          description: "Inicio del portal" },
  { path: "/paciente/citas",    label: "Mis Citas",     icon: Calendar,      description: "Ver mis citas" },
  { path: "/paciente/historial",label: "Mi Historial",  icon: ClipboardList, description: "Historial médico" },
  { path: "/paciente/ordenes",  label: "Mis Órdenes",   icon: FlaskConical,  description: "Órdenes de exámenes" },
  { path: "/paciente/perfil",   label: "Mi Perfil",     icon: User,          description: "Datos personales" },
] as const;

const PacienteSidebar = ({ isOpen, isCollapsed, onClose }: PacienteSidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const avatarLetter = user?.nombres?.charAt(0).toUpperCase() || "P";
  const showLabels = !isCollapsed;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="paciente-sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`paciente-sidebar${isOpen ? " paciente-sidebar--open" : ""}`}
      >
        {/* ── Header ── */}
        <div className="paciente-sidebar__header">
          <div className="paciente-sidebar__logo">
            <div className="paciente-sidebar__logo-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="url(#pac-logo-grad)" />
                <path d="M18 10V26M26 18H10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="pac-logo-grad" x1="0" y1="0" x2="36" y2="36">
                    <stop stopColor="#14b8a6" />
                    <stop offset="1" stopColor="#0f766e" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {showLabels && (
              <div>
                <h2 className="paciente-sidebar__logo-text">Policlinico</h2>
                <p className="paciente-sidebar__logo-subtitle">Portal Paciente</p>
              </div>
            )}
          </div>
          <button
            className="paciente-sidebar__close"
            onClick={onClose}
            title="Cerrar menú"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="paciente-sidebar__nav">
          <div className="paciente-sidebar__section">
            {showLabels && (
              <p className="paciente-sidebar__section-title">MI PORTAL</p>
            )}
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/paciente"
                  ? location.pathname === "/paciente"
                  : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/paciente"}
                  className={`paciente-sidebar__link${isActive ? " active" : ""}`}
                  title={item.description}
                  onClick={onClose}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  {showLabels && (
                    <>
                      <span className="paciente-sidebar__link-label">
                        {item.label}
                      </span>
                      {isActive && (
                        <ChevronRight
                          size={16}
                          className="paciente-sidebar__link-arrow"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* ── Footer / User card ── */}
        <div className="paciente-sidebar__footer">
          <div className="paciente-sidebar__user-card">
            <div className="paciente-sidebar__user-avatar">{avatarLetter}</div>
            {showLabels && (
              <div className="paciente-sidebar__user-info">
                <span className="paciente-sidebar__user-name">
                  {user ? `${user.nombres} ${user.apellidos}` : "Paciente"}
                </span>
                <span className="paciente-sidebar__user-role">Paciente</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default PacienteSidebar;
