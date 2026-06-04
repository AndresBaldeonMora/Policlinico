import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import { useTheme } from "../../context/ThemeContext";
import { MedicoApiService } from "../../services/medico.service";
import { Moon, Search, Sun, LogOut, ChevronDown, Menu } from "lucide-react";
import SearchPalette from "./SearchPalette";
import { CampanillaNotificaciones } from "../Notificaciones/CampanillaNotificaciones";
import type { Notificacion } from "../Notificaciones/types";
import "./Header.css";

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [especialidad, setEspecialidad] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  const handleMarcarLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const avatarLetter = user?.nombres?.trim() ? user.nombres.trim().charAt(0).toUpperCase() : "U";
  const nombreCompleto = `${user?.nombres ?? ""} ${user?.apellidos ?? ""}`.trim();

  useEffect(() => {
    if (user?.rol === "MEDICO") {
      MedicoApiService.obtenerMiPerfil()
        .then((p) => setEspecialidad(p.especialidadId.nombre))
        .catch(() => setEspecialidad(null));
    }
  }, [user?.rol]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && user?.rol !== "paciente") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => document.body.classList.toggle('mobile-sidebar-open')}
              aria-label="Toggle menu"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
            {user?.rol !== "paciente" && (
              <button
                className="header-search"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={18} className="header-search-icon" />
                <span className="header-search-placeholder">
                  Buscar pacientes, citas, doctores…
                </span>
                <kbd className="header-search-kbd">Ctrl+K</kbd>
              </button>
            )}
          </div>

          <div className="header-right">
            <button
              className="header-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun size={20} strokeWidth={1.8} />
              ) : (
                <Moon size={20} strokeWidth={1.8} />
              )}
            </button>

            <CampanillaNotificaciones
              notificaciones={notificaciones}
              onMarcarLeida={handleMarcarLeida}
            />

            <div className="header-divider" />

            <div className="header-user-wrapper" ref={dropdownRef}>
              <div
                className="header-user"
                onClick={() => setDropdownOpen((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setDropdownOpen((prev) => !prev);
                }}
              >
                <div className="header-user-info">
                  <p className="user-name">
                    {nombreCompleto ? nombreCompleto : "Usuario"}
                  </p>
                  {user?.rol === "MEDICO" && especialidad && (
                    <p className="user-role">{especialidad}</p>
                  )}
                  {user?.rol === "RECEPCIONISTA" && (
                    <p className="user-role">Recepcionista</p>
                  )}
                  {user?.rol === "ADMINISTRADOR" && (
                    <p className="user-role">Administrador</p>
                  )}
                </div>
                <div className="user-avatar">{avatarLetter}</div>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className={`header-user-chevron ${dropdownOpen ? "header-user-chevron--open" : ""}`}
                />
              </div>

              {dropdownOpen && (
                <div className="header-dropdown">
                  <button
                    className="header-dropdown-item"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} strokeWidth={2} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Header;
