import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import {
  Calendar,
  CalendarPlus,
  ClipboardList,
  Stethoscope,
  Users,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  FlaskConical,
  ShieldCheck,
  BookOpen,
  LayoutDashboard,
  Home,
  User,
  UserCog,
  Pill,
  ScrollText,
} from "lucide-react";
import "./Sidebar.css";
const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // pequeña correcion : de adminMenu a recepcionistaMenu 
  const recepcionistaMenu = [
    { path: "/calendario", label: "Calendario", icon: Calendar, description: "Vista principal de citas" },
    { path: "/reserva-cita", label: "Reservar Cita", icon: CalendarPlus, description: "Agendar nueva cita" },
    { path: "/lista-citas", label: "Gestion de Citas", icon: ClipboardList, description: "Administrar citas" },
    { path: "/medicos", label: "Medicos", icon: Stethoscope, description: "Directorio de doctores" },
    { path: "/pacientes", label: "Pacientes", icon: Users, description: "Listado de pacientes" },
    { path: "/laboratorio-imagen", label: "Laboratorio / Imagen", icon: FlaskConical, description: "Órdenes de exámenes e imagen" },
  ];

  const medicoMenu = [
    { path: "/medico",       label: "Dashboard", icon: LayoutDashboard, description: "Panel principal del médico" },
    { path: "/medico/citas", label: "Mis Citas", icon: ClipboardList,   description: "Listado de mis citas" },
  ];

  // Menú ADMINISTRADOR
  const administradorMenu = [
    { path: "/admin", label: "Panel Admin", icon: ShieldCheck, description: "Inicio administración" },
    { path: "/admin/usuarios", label: "Usuarios", icon: UserCog, description: "Gestión de usuarios del sistema" },
    { path: "/admin/especialidades", label: "Especialidades", icon: BookOpen, description: "CRUD especialidades" },
    { path: "/admin/doctores", label: "Doctores", icon: Stethoscope, description: "CRUD doctores" },
    { path: "/admin/pacientes", label: "Pacientes", icon: Users, description: "CRUD pacientes" },
    { path: "/admin/medicamentos", label: "Medicamentos", icon: Pill, description: "Catálogo de medicamentos" },
    { path: "/admin/auditoria", label: "Auditoría", icon: ScrollText, description: "Registro de acciones del sistema" },
  ];

  const pacienteMenu = [
    { path: "/paciente",           label: "Inicio",        icon: Home,          description: "Inicio del portal" },
    { path: "/paciente/reservar",   label: "Reservar Cita", icon: CalendarPlus,  description: "Agendar nueva cita" },
    { path: "/paciente/historial", label: "Mis Citas",     icon: ClipboardList, description: "Ver mis citas" },
    { path: "/paciente/ordenes",   label: "Mis Órdenes",   icon: FlaskConical,  description: "Órdenes de exámenes" },
    { path: "/paciente/perfil",    label: "Mi Perfil",     icon: User,          description: "Datos personales" },
  ];

  const menuMap: Record<string, typeof recepcionistaMenu> = {
    RECEPCIONISTA: recepcionistaMenu,
    MEDICO: medicoMenu,
    administrador: administradorMenu,
    paciente: pacienteMenu,
  };

  const menuItems = menuMap[user?.rol ?? ""] ?? recepcionistaMenu;

  const subtitleMap: Record<string, string> = {
    MEDICO: "Portal Médico",
    administrador: "Portal Administración",
    RECEPCIONISTA: "Portal Recepcionista",
    paciente: "Portal Paciente",
  };
  const subtitle = subtitleMap[user?.rol ?? ""] ?? "Sistema";

  const avatarLetter = user?.nombres?.trim() ? user.nombres.trim().charAt(0).toUpperCase() : "U";
  const nombreCompleto = `${user?.nombres ?? ""} ${user?.apellidos ?? ""}`.trim();

  return (
    <>
      <div
        className="sidebar-overlay"
        onClick={() => document.body.classList.remove('mobile-sidebar-open')}
        aria-hidden="true"
      />
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

      </aside>
    </>
  );
};

export default Sidebar;
