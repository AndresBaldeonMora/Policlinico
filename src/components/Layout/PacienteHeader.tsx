import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import { useTheme } from "../../context/ThemeContext";
import { Menu, Moon, Sun, LogOut, ChevronDown } from "lucide-react";
import "./PacienteHeader.css";

interface PacienteHeaderProps {
  onToggleSidebar: () => void;
}

const PacienteHeader = ({ onToggleSidebar }: PacienteHeaderProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const avatarLetter = user?.nombres?.charAt(0).toUpperCase() || "P";

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
    <header className="paciente-header">
      <div className="paciente-header__content">
        {/* ── Left ── */}
        <div className="paciente-header__left">
          <button
            className="paciente-header__hamburger"
            onClick={onToggleSidebar}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="paciente-header__greeting">
              Hola, {user?.nombres || "Paciente"}
            </p>
            <p className="paciente-header__greeting-sub">
              Bienvenido a tu portal de salud
            </p>
          </div>
        </div>

        {/* ── Right ── */}
        <div className="paciente-header__right">
          <button
            className="paciente-header__theme-btn"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? (
              <Sun size={20} strokeWidth={1.8} />
            ) : (
              <Moon size={20} strokeWidth={1.8} />
            )}
          </button>

          <div className="paciente-header__divider" />

          <div className="paciente-header__user-wrapper" ref={dropdownRef}>
            <div
              className="paciente-header__user"
              onClick={() => setDropdownOpen((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setDropdownOpen((prev) => !prev);
              }}
            >
              <div className="paciente-header__user-info">
                <p className="paciente-header__user-name">
                  {user ? `${user.nombres} ${user.apellidos}` : "Paciente"}
                </p>
                <p className="paciente-header__user-role">Paciente</p>
              </div>
              <div className="paciente-header__avatar">{avatarLetter}</div>
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`paciente-header__chevron${dropdownOpen ? " paciente-header__chevron--open" : ""}`}
              />
            </div>

            {dropdownOpen && (
              <div className="paciente-header__dropdown">
                <button
                  className="paciente-header__dropdown-item"
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
  );
};

export default PacienteHeader;
