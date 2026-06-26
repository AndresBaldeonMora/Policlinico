import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import { InterconsultaApiService } from "../../services/interconsulta.service";
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
  ScrollText,
  ArrowLeftRight,
  MessageSquare,
  Ticket,
  Clock,
} from "lucide-react";
import "./Sidebar.css";
const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [interconsultasPendientes, setInterconsultasPendientes] = useState(0);

  useEffect(() => {
    if (user?.rol !== "RECEPCIONISTA") return;
    const cargar = () => {
      InterconsultaApiService.listarPendientesRecepcion()
        .then(lista => setInterconsultasPendientes(lista.length))
        .catch(() => {});
    };
    cargar();
    const interval = setInterval(cargar, 30_000);
    return () => clearInterval(interval);
  }, [user?.rol]);

  // pequeña correcion : de adminMenu a recepcionistaMenu 
  const recepcionistaMenu = [
    { path: "/calendario",          label: "Calendario",         icon: Calendar,       description: "Vista principal de citas" },
    { path: "/reserva-cita",        label: "Reservar Cita",      icon: CalendarPlus,   description: "Agendar nueva cita" },
    { path: "/lista-citas",         label: "Gestión de Citas",   icon: ClipboardList,  description: "Administrar citas" },
    { path: "/laboratorio-imagen",  label: "Laboratorio / Imagen", icon: FlaskConical, description: "Órdenes de exámenes e imagen" },
    { path: "/interconsultas",      label: "Interconsultas",     icon: ArrowLeftRight, description: "Gestionar interconsultas pendientes" },
    { path: "/pacientes",           label: "Pacientes",          icon: Users,          description: "Listado de pacientes" },
    { path: "/medicos",             label: "Médicos",            icon: Stethoscope,    description: "Directorio de doctores" },
  ];

  const medicoMenu = [
    { path: "/medico",             label: "Inicio",      icon: LayoutDashboard, description: "Panel principal del médico" },
    { path: "/medico/citas",       label: "Mis Citas",   icon: ClipboardList,   description: "Listado de mis citas" },
    { path: "/medico/calendario",  label: "Calendario",  icon: Calendar,        description: "Mi agenda" },
    { path: "/pacientes",          label: "Pacientes",   icon: Users,           description: "Historias clínicas de pacientes" },
  ];

  // Menú ADMINISTRADOR
  const administradorMenu = [
    { path: "/admin",                label: "Panel Admin",    icon: ShieldCheck,   description: "Inicio administración" },
    { path: "/admin/doctores",       label: "Doctores",       icon: Stethoscope,   description: "CRUD doctores" },
    { path: "/admin/horarios",       label: "Horarios",       icon: Clock,         description: "Gestión mensual de horarios" },
    { path: "/admin/especialidades", label: "Especialidades", icon: BookOpen,      description: "CRUD especialidades" },
    { path: "/admin/pacientes",      label: "Pacientes",      icon: Users,         description: "CRUD pacientes" },
    { path: "/admin/usuarios",       label: "Usuarios",       icon: UserCog,       description: "Gestión de usuarios del sistema" },
    { path: "/admin/reclamaciones",  label: "Reclamaciones",  icon: MessageSquare, description: "Libro de reclamaciones virtual" },
    { path: "/admin/chat",           label: "Soporte",        icon: Ticket,        description: "Chat y tickets de soporte" },
    { path: "/admin/auditoria",      label: "Auditoría",      icon: ScrollText,    description: "Registro de acciones del sistema" },
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
              const badge = item.path === "/interconsultas" && interconsultasPendientes > 0
                ? interconsultasPendientes
                : null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                  title={item.description}
                >
                  <span style={{ position: "relative", display: "inline-flex" }}>
                    <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                    {badge !== null && (
                      <span style={{
                        position: "absolute", top: -6, right: -8,
                        background: "#ef4444", color: "#fff",
                        borderRadius: "9999px", fontSize: 10, fontWeight: 700,
                        minWidth: 16, height: 16, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        padding: "0 3px", lineHeight: 1,
                      }}>
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="sidebar-label">{item.label}</span>
                      {badge !== null && (
                        <span style={{
                          marginLeft: "auto", background: "#ef4444", color: "#fff",
                          borderRadius: "9999px", fontSize: 11, fontWeight: 700,
                          minWidth: 20, height: 20, display: "flex",
                          alignItems: "center", justifyContent: "center", padding: "0 5px",
                        }}>
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                      {isActive && !badge && <ChevronRight size={16} className="sidebar-link-arrow" />}
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
