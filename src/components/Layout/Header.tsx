import { useAuth } from "../../hooks/userAuth";
import { useTheme } from "../../context/ThemeContext";
import { Bell, Moon, Search, Sun } from "lucide-react";
import "./Header.css";

const Header = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const avatarLetter = user?.nombres?.charAt(0).toUpperCase() || "U";

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="header-search">
            <Search size={18} className="header-search-icon" />
            <input
              type="text"
              placeholder="Buscar pacientes, citas, doctores..."
              className="header-search-input"
            />
          </div>
        </div>
        <div className="header-right">
          <button className="header-notification" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={20} strokeWidth={1.8} /> : <Moon size={20} strokeWidth={1.8} />}
          </button>
          <button className="header-notification">
            <Bell size={20} strokeWidth={1.8} />
            <span className="notification-badge">3</span>
          </button>
          <div className="header-divider" />
          <div className="header-user">
            <div className="header-user-info">
              <p className="user-name">
                {user ? `${user.nombres} ${user.apellidos}` : "Usuario"}
              </p>
              <p className="user-role">{user?.rol || "Sin rol"}</p>
            </div>
            <div className="user-avatar">{avatarLetter}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
